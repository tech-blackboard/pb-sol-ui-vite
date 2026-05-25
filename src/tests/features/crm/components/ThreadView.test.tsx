import { render, screen, fireEvent, waitFor } from '@testing-library/react';
jest.setTimeout(20000);
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThreadView from '../../../../features/crm/components/ThreadView';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import toast from 'react-hot-toast';
import type { Thread, Message, Contact, Attachment } from '../../../../features/crm/types';
import type { RootState } from '../../../../store';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../features/crm/services/crmService', () => ({
  unsubscribeContact: jest.fn(),
  downloadAttachment: jest.fn(),
  updateThreadReadStatus: jest.fn(),
}));

jest.mock('../../../../store/slices/crm/crm.thunks', () => {
  const actual = jest.requireActual('../../../../store/slices/crm/crm.thunks');
  return {
    ...actual,
    updateLabelsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.updateLabelsThunk),
    fetchMessagesThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.fetchMessagesThunk),
    toggleThreadReadThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.toggleThreadReadThunk),
    trashThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.trashThreadsThunk),
    restoreThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.restoreThreadsThunk),
    deleteThreadsPermanentlyThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.deleteThreadsPermanentlyThunk),
    junkThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.junkThreadsThunk),
    restoreThreadsFromJunkThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.restoreThreadsFromJunkThunk),
  };
});

import * as crmThunks from '../../../../store/slices/crm/crm.thunks';

jest.mock('../../../../features/crm/components/ReplyForm', () => {
  const React = jest.requireActual('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: { recipientEmail: string; onSuccess: () => void; mode?: string; forwardedFromId?: string }, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        expand: jest.fn(),
        collapse: jest.fn()
      }));
      return (
        <div data-testid="reply-form" data-mode={props.mode} data-forwarded-id={props.forwardedFromId}>
          <span>{props.recipientEmail}</span>
          <button onClick={props.onSuccess}>Trigger Reply Success</button>
        </div>
      );
    })
  };
});

jest.mock('../../../../features/crm/components/EmailBody', () => ({
  __esModule: true,
  default: ({ html, text }: { html?: string; text?: string }) => {
    if (!html && !text) return <p>No content</p>;
    return (
      <div data-testid="email-body">
        {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : text}
      </div>
    );
  },
}));

jest.mock('../../../../features/crm/components/MessageLabelDropdown', () => ({
  __esModule: true,
  default: ({ onToggleLabel }: { onToggleLabel: (label: string) => void }) => (
    <div data-testid="label-dropdown">
      <button onClick={() => onToggleLabel('new-label')} title="Add or manage labels">Add Label</button>
    </div>
  ),
}));

const mockToast = toast as jest.Mocked<typeof toast>;

// ── factories ─────────────────────────────────────────────────────────────────

const makeContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 10, email: 'alice@example.com', status: 'active',
  labels: [], eventId: 1, createdAt: '2025-01-01T00:00:00Z', ...overrides,
});

const makeThread = (overrides: Partial<Thread> = {}): Thread => ({
  id: 'thread-1', subject: 'Hello World', lastMessageAt: '2025-06-15T10:00:00Z',
  eventId: 1, contactId: 10, isRead: true, messageCount: 1,
  domain: 'inbox.example.com', createdAt: '2025-06-15T09:00:00Z',
  contact: makeContact(),
  isStarred: false,
  isTrash: false,
  isJunk: false,
  ...overrides,
});

const makeAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: 1, messageId: 'msg-1', filename: 'report.pdf', contentType: 'application/pdf',
  size: 102400, s3Key: 'files/report.pdf', createdAt: '2025-06-15T10:00:00Z', ...overrides,
});

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1', threadId: 'thread-1', fromEmail: 'alice@example.com',
  fromName: 'Alice', toEmail: 'me@conf.com', subject: 'Hello World',
  textBody: 'Hello there', htmlBody: '', direction: 'inbound', status: 'received',
  eventId: 1, contactId: 10, createdAt: '2025-06-15T10:00:00Z',
  labels: [], attachments: [], isTrash: false, isJunk: false, ...overrides,
});

const makeStore = (overrides: object = {}) =>
  configureStore({
    reducer: { crm: crmReducer },
    preloadedState: {
      crm: {
        ...initialState,
        ...overrides,
      },
    },
  });

const renderView = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(<Provider store={store}><ThreadView /></Provider>);
  return store;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThreadView', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns null when no thread is selected', () => {
    const { container } = render(
      <Provider store={makeStore({ selectedThreadId: null, threads: [] })}>
        <ThreadView />
      </Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows loading spinner when messages are loading and messages array is empty', () => {
    const { container } = render(
      <Provider store={makeStore({
        loading: { ...initialState.loading, messages: true },
        messages: [],
        selectedThreadId: 'thread-1',
        threads: [makeThread()],
      })}>
        <ThreadView />
      </Provider>,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders draft when selectedThreadId matches a draft instead of a thread', () => {
    renderView({
      threads: [],
      drafts: [
        {
          id: 'draft-1',
          subject: 'Draft Subject',
          eventId: 1,
          contactId: 1,
          updatedAt: '2025-06-15T10:30:00Z',
          fromEmail: 'test@example.com',
          toEmail: 'contact@example.com',
          createdAt: '2025-06-15T10:00:00Z',
          direction: 'outbound',
          status: 'draft',
          textBody: 'draft body',
          htmlBody: '',
        } as unknown as Message
      ],
      messages: [],
      selectedThreadId: 'draft-1',
    });
    expect(screen.getByText('Draft Subject')).toBeInTheDocument();
  });

  it('renders draft when draft.threadId matches selectedThreadId without matching threads', () => {
    renderView({
      threads: [],
      drafts: [
        {
          id: 'draft-2',
          threadId: 't-99',
          eventId: 1,
          contactId: 1,
          createdAt: '2025-06-15T10:00:00Z',
          direction: 'outbound',
          status: 'draft',
          textBody: 'draft body',
          htmlBody: '',
        } as unknown as Message
      ],
      messages: [],
      selectedThreadId: 't-99',
    });
    expect(screen.getByText('(No subject)')).toBeInTheDocument();
  });

  it('reconstructs thread from messages (Fallback 2) when no thread or draft matches', () => {
    renderView({
      threads: [],
      drafts: [],
      messages: [
        {
          id: 'm-1',
          threadId: 't-100',
          subject: 'Message Subject',
          eventId: 1,
          contactId: 1,
          createdAt: '2025-06-15T10:00:00Z',
          direction: 'inbound',
          fromEmail: 'm@example.com',
          contact: makeContact(),
          status: 'received',
          textBody: 'msg body',
          htmlBody: '',
          labels: []
        } as unknown as Message
      ],
      selectedThreadId: 't-100',
    });
    expect(screen.getByText('Message Subject')).toBeInTheDocument();
  });

  it('renders thread subject and message content', () => {
    renderView({
      threads: [makeThread({ subject: 'My Subject' })],
      messages: [makeMessage({ textBody: 'My body text', htmlBody: '' })],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('My Subject')).toBeInTheDocument();
    expect(screen.getByText('My body text')).toBeInTheDocument();
  });

  it('renders htmlBody via dangerouslySetInnerHTML when present', () => {
    renderView({
      threads: [makeThread()],
      messages: [makeMessage({ htmlBody: '<p>HTML body content</p>' })],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('HTML body content')).toBeInTheDocument();
  });

  it('renders "No content" when both textBody and htmlBody are absent', () => {
    renderView({
      threads: [makeThread()],
      messages: [makeMessage({ textBody: undefined, htmlBody: undefined })],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('shows sender initial for outbound messages', () => {
    renderView({
      threads: [makeThread()],
      messages: [makeMessage({ direction: 'outbound', fromName: 'Bob', fromEmail: 'bob@conf.com' })],
      selectedThreadId: 'thread-1',
    });
    // The avatar div shows the first letter of fromName
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('uses fromEmail initial when fromName is absent', () => {
    renderView({
      threads: [makeThread()],
      messages: [makeMessage({ fromName: undefined, fromEmail: 'carol@x.com' })],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('uses "?" initial when both fromName and fromEmail are absent (line 258)', () => {
    renderView({
      threads: [makeThread()],
      messages: [makeMessage({ fromName: undefined, fromEmail: undefined })],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows "Unsubscribed" badge for unsubscribed contact', () => {
    renderView({
      threads: [makeThread({ contact: makeContact({ status: 'unsubscribed' }) })],
      messages: [makeMessage()],
      selectedThreadId: 'thread-1',
    });
    expect(screen.getByText('Unsubscribed')).toBeInTheDocument();
  });

  it('dispatches setSelectedThread(null) when back button is clicked', async () => {
    const store = renderView({
      threads: [makeThread()],
      messages: [makeMessage()],
      selectedThreadId: 'thread-1',
    });
    fireEvent.click(screen.getByTitle('Back to inbox'));
    await waitFor(() => expect((store.getState() as RootState).crm.selectedThreadId).toBeNull());
  });

  describe('unsubscribe flow', () => {
    beforeEach(() => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('calls crmService.unsubscribeContact and shows success toast on confirm', async () => {
      const spy = jest.spyOn(crmService, 'unsubscribeContact').mockResolvedValue(undefined);

      renderView({
        threads: [makeThread({ contact: makeContact({ id: 99, email: 'alice@example.com' }) })],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Unsubscribe Contact'));
      await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Contact unsubscribed successfully'));
      expect(spy).toHaveBeenCalledWith(99, 'User manually unsubscribed from CRM UI');
    });

    it('does not call unsubscribe if confirm is cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const spy = jest.spyOn(crmService, 'unsubscribeContact');

      renderView({
        threads: [makeThread({ contact: makeContact({ id: 99, email: 'alice@example.com' }) })],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Unsubscribe Contact'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not call unsubscribe if contact is missing', () => {
      const spy = jest.spyOn(crmService, 'unsubscribeContact');

      renderView({
        threads: [makeThread({ contact: undefined })],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      const btn = screen.queryByTitle('Unsubscribe Contact');
      if (btn) {
        fireEvent.click(btn);
      }
      expect(spy).not.toHaveBeenCalled();
    });

    it('shows error toast when unsubscribeContact throws', async () => {
      jest.spyOn(crmService, 'unsubscribeContact').mockRejectedValue(new Error('Network'));

      renderView({
        threads: [makeThread()],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Unsubscribe Contact'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to unsubscribe contact'));
    });

    it('handles clicking forward with missing attachments correctly', () => {
      renderView({
        messages: [makeMessage({ attachments: undefined })]
      });

      const forwardBtn = screen.getByTitle('Forward');
      fireEvent.click(forwardBtn);

      const replyForm = screen.getByTestId('reply-form');
      expect(replyForm).toHaveAttribute('data-mode', 'forward');
    });

    it('toggles message details using the ellipsis button', () => {
      renderView({
        messages: [makeMessage({ direction: 'inbound' })],
      });
      // The toggle button has text "▼"
      const toggleBtn = screen.getByText('▼');
      
      // Expand
      fireEvent.click(toggleBtn);
      // Collapse
      fireEvent.click(toggleBtn);
      // Just testing it doesn't crash since it's local state
      expect(toggleBtn).toBeInTheDocument();
    });
  });

  describe('details toggle', () => {
    it('toggles the details dropdown on ▼ click', () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ toEmail: 'me@conf.com', ccEmail: 'cc@test.com', bccEmail: 'bcc@test.com' })],
        selectedThreadId: 'thread-1',
      });

      expect(screen.queryByText('from:')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('▼'));
      expect(screen.getByText('from:')).toBeInTheDocument();
      expect(screen.getByText('cc@test.com')).toBeInTheDocument();
      expect(screen.getByText('bcc@test.com')).toBeInTheDocument();
      // Clicking again closes
      fireEvent.click(screen.getByText('▼'));
      expect(screen.queryByText('from:')).not.toBeInTheDocument();
    });
  });

  describe('labels', () => {
    it('renders existing labels', () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ labels: ['positive', 'abstract'] })],
        selectedThreadId: 'thread-1',
      });
      expect(screen.getByText('positive')).toBeInTheDocument();
      expect(screen.getByText('abstract')).toBeInTheDocument();
    });

    it('dispatches updateLabelsThunk when a label is toggled (add)', async () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add or manage labels'));
      await waitFor(() => expect(crmThunks.updateLabelsThunk).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing', 'new-label'] }));
    });

    it('dispatches updateLabelsThunk when a label is toggled (remove)', async () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing', 'new-label'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add or manage labels'));
      await waitFor(() => expect(crmThunks.updateLabelsThunk).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing'] }));
    });
  });

  describe('attachments', () => {
    it('renders attachment filename and size', () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ attachments: [makeAttachment({ filename: 'photo.jpg', size: 51200 })] })],
        selectedThreadId: 'thread-1',
      });
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
      expect(screen.getByText('50.0 KB')).toBeInTheDocument();
    });

    it('calls downloadAttachment and shows error toast on failure', async () => {
      const dlSpy = jest.spyOn(crmService, 'downloadAttachment').mockRejectedValue(new Error('fail'));

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ attachments: [makeAttachment({ id: 5 })] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Download'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to download attachment'));
      expect(dlSpy).toHaveBeenCalledWith(5, 'report.pdf');
    });
  });

  describe('reply success', () => {
    it('dispatches fetchMessagesThunk when ReplyForm triggers onSuccess', async () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByText('Trigger Reply Success'));
      await waitFor(() => expect(crmThunks.fetchMessagesThunk).toHaveBeenCalledWith('thread-1'));
    });
  });

  describe('draft fallback and special states', () => {
    it('renders a thread-like view for a draft when the thread is not in store', () => {
      const draft = {
        id: 'draft-99',
        subject: 'Draft Subject',
        eventId: 1,
        contactId: 10,
        toEmail: 'target@test.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: [],
        status: 'draft'
      } as unknown as Message;

      renderView({
        selectedThreadId: 'draft-99',
        drafts: [draft],
        threads: [],
        messages: []
      });

      expect(screen.getByText('Draft Subject')).toBeInTheDocument();
      expect(screen.getByText('target@test.com')).toBeInTheDocument();
    });

    it('handles toggle read (mark as unread) from toolbar', async () => {
      renderView({
        threads: [makeThread({ id: 't1', isRead: true })],
        messages: [makeMessage({ threadId: 't1' })],
        selectedThreadId: 't1',
      });

      fireEvent.click(screen.getByTitle('Mark as unread'));
      await waitFor(() => expect(crmThunks.toggleThreadReadThunk).toHaveBeenCalledWith({ threadId: 't1', isRead: false }));
    });

    it('renders Sent and Failed badges correctly', () => {
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [
          makeMessage({ id: 'm1', status: 'sent', direction: 'outbound' }),
          makeMessage({ id: 'm2', status: 'failed', direction: 'outbound' })
        ],
        selectedThreadId: 't1',
      });

      expect(screen.getByText('Sent')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('handles trashing thread from toolbar', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
      });

      fireEvent.click(screen.getByTitle('Move to Trash'));
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => expect(crmThunks.trashThreadsThunk).toHaveBeenCalledWith(['t1']));
    });

    it('handles restoring thread from toolbar', async () => {
      renderView({
        threads: [makeThread({ id: 't1', isTrash: true })],
        messages: [makeMessage({ threadId: 't1' })],
        selectedThreadId: 't1',
        activeFolder: 'Trash'
      });

      fireEvent.click(screen.getByTitle('Restore'));
      await waitFor(() => expect(crmThunks.restoreThreadsThunk).toHaveBeenCalledWith(['t1']));
    });

    it('handles permanent delete from toolbar', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      renderView({
        threads: [makeThread({ id: 't1', isTrash: true })],
        messages: [makeMessage({ threadId: 't1' })],
        selectedThreadId: 't1',
        activeFolder: 'Trash'
      });

      fireEvent.click(screen.getByTitle('Delete Permanently'));
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => expect(crmThunks.deleteThreadsPermanentlyThunk).toHaveBeenCalledWith(['t1']));
    });
  });

  describe('toolbar error handling (coverage line 111-151)', () => {
    it('handles toggle read error', async () => {
      (crmThunks.toggleThreadReadThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Read Error') }));
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
      });
      fireEvent.click(screen.getByTitle('Mark as unread'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Read Error'));
    });

    it('handles trash error', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      (crmThunks.trashThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Trash Error') }));
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
      });
      fireEvent.click(screen.getByTitle('Move to Trash'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Trash Error'));
    });

    it('handles restore error', async () => {
      (crmThunks.restoreThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Restore Error') }));
      renderView({
        threads: [makeThread({ id: 't1', isTrash: true })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
        activeFolder: 'Trash'
      });
      fireEvent.click(screen.getByTitle('Restore'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Restore Error'));
    });

    it('handles permanent delete error', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      (crmThunks.deleteThreadsPermanentlyThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Delete Error') }));
      renderView({
        threads: [makeThread({ id: 't1', isTrash: true })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
        activeFolder: 'Trash'
      });
      fireEvent.click(screen.getByTitle('Delete Permanently'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Delete Error'));
    });

    it('handles spam report error', async () => {
      (crmThunks.junkThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Spam Error') }));
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
      });
      fireEvent.click(screen.getByTitle('Report Spam'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Spam Error'));
    });

    it('handles restore from spam error', async () => {
      (crmThunks.restoreThreadsFromJunkThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Restore Spam Error') }));
      renderView({
        threads: [makeThread({ id: 't1', isJunk: true })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
        activeFolder: 'Junk'
      });
      fireEvent.click(screen.getByTitle('Not Spam'));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Restore Spam Error'));
    });
  });

  describe('Action buttons (Spam, Reply, Forward, Download Error)', () => {
    it('handles marking thread as spam', async () => {
      renderView({
        selectedThreadId: 'thread-1',
        threads: [makeThread()],
        messages: [makeMessage()]
      });

      // Click "Report Spam" (has title "Report Spam")
      fireEvent.click(screen.getByTitle('Report Spam'));
      
      await waitFor(() => {
        expect(crmThunks.junkThreadsThunk).toHaveBeenCalledWith(['thread-1']);
        expect(toast.success).toHaveBeenCalledWith('Conversation reported as spam');
      });
    });

    it('handles restoring from spam', async () => {
      renderView({
        selectedThreadId: 'thread-spam',
        threads: [makeThread({ id: 'thread-spam', isJunk: true })],
        messages: [makeMessage({ threadId: 'thread-spam' })],
        activeFolder: 'Junk'
      });

      fireEvent.click(screen.getByTitle('Not Spam'));
      await waitFor(() => {
        expect(crmThunks.restoreThreadsFromJunkThunk).toHaveBeenCalledWith(['thread-spam']);
        expect(toast.success).toHaveBeenCalledWith('Conversation moved to Inbox');
      });
    });

    it('handles Reply and Forward button clicks on a message with fromName', async () => {
      renderView({
        selectedThreadId: 'thread-1',
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', subject: 'Hello Test', toEmail: 'alice@test.com', fromEmail: 'bob@test.com', fromName: 'Bob' })]
      });

      // Click Reply
      fireEvent.click(screen.getByTitle('Reply'));
      
      await waitFor(() => {
        const replyForm = screen.getByTestId('reply-form');
        expect(replyForm).toHaveAttribute('data-mode', 'reply');
        expect(replyForm).toHaveAttribute('data-forwarded-id', 'msg-1');
      });

      // Click Forward
      fireEvent.click(screen.getByTitle('Forward'));

      await waitFor(() => {
        const replyForm = screen.getByTestId('reply-form');
        expect(replyForm).toHaveAttribute('data-mode', 'forward');
        expect(replyForm).toHaveAttribute('data-forwarded-id', 'msg-1');
      });
    });

    it('handles Reply and Forward button clicks on a message without fromName', async () => {
      renderView({
        selectedThreadId: 'thread-1',
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', subject: 'Hello Test', toEmail: 'alice@test.com', fromEmail: 'bob@test.com', fromName: undefined })]
      });

      // Click Reply
      fireEvent.click(screen.getByTitle('Reply'));
      
      await waitFor(() => {
        const replyForm = screen.getByTestId('reply-form');
        expect(replyForm).toHaveAttribute('data-mode', 'reply');
        expect(replyForm).toHaveAttribute('data-forwarded-id', 'msg-1');
      });

      // Click Forward
      fireEvent.click(screen.getByTitle('Forward'));

      await waitFor(() => {
        const replyForm = screen.getByTestId('reply-form');
        expect(replyForm).toHaveAttribute('data-mode', 'forward');
        expect(replyForm).toHaveAttribute('data-forwarded-id', 'msg-1');
      });
    });

    it('handles download attachment error', async () => {
      (crmService.downloadAttachment as jest.Mock).mockRejectedValueOnce(new Error('Download Error'));
      const msg = makeMessage({ 
        attachments: [{ id: 'a1', filename: 'test.pdf', contentType: 'application/pdf', size: 100, url: 'x', messageId: 'm1', createdAt: '2023' } as unknown as Attachment] 
      });
      renderView({
        selectedThreadId: 'thread-1',
        threads: [makeThread()],
        messages: [msg]
      });

      fireEvent.click(screen.getByTitle('Download'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to download attachment');
      });
    });
  });

  describe('Deep coverage (Fallback reconstruction and Draft association)', () => {
    it('reconstructs thread from messages if thread is missing (Fallback 2, lines 53-68)', () => {
      const messages = [makeMessage({ subject: 'Fallback Thread', labels: ['L1'], fromEmail: undefined })];
      renderView({
        selectedThreadId: 'thread-1',
        threads: [], // No threads in store
        messages: messages
      });

      expect(screen.getByText('Fallback Thread')).toBeInTheDocument();
      expect(screen.getByText('L1')).toBeInTheDocument();
    });

    it('matches an existing draft by threadId or event/contact when threadId is missing', async () => {
      const contact = makeContact({ id: 88, email: 'alice@example.com' });
      const thread = makeThread({ id: 't1', eventId: 5, contact: contact, contactId: 88 });
      const draft = {
        id: 'draft-x',
        contactId: 88,
        eventId: 5,
        threadId: undefined, // undefined threadId fallback
        status: 'draft',
        toEmail: 'alice@x.com'
      } as unknown as Message;

      renderView({
        selectedThreadId: 't1',
        threads: [thread],
        messages: [makeMessage({ threadId: 't1', contactId: 88, eventId: 5 })],
        drafts: [draft]
      });

      await waitFor(() => {
        expect(screen.getByTestId('reply-form')).toHaveTextContent('alice@x.com');
      });
    });

    it('renders high importance indicator', () => {
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage({ id: 'm1', importance: 'high' })],
        selectedThreadId: 't1',
      });
      expect(screen.getByText('High importance')).toBeInTheDocument();
    });

    it('renders low importance indicator', () => {
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [makeMessage({ id: 'm1', importance: 'low' })],
        selectedThreadId: 't1',
      });
      expect(screen.getByText('Low importance')).toBeInTheDocument();
    });

    it('renders outbound message with fallback contact email when toEmail is missing', () => {
      renderView({
        threads: [makeThread({ id: 't1', contact: makeContact({ email: 'fallback@test.com' }) })],
        messages: [makeMessage({ id: 'm1', direction: 'outbound', toEmail: undefined })],
        selectedThreadId: 't1',
      });
      expect(screen.getByText('to fallback@test.com')).toBeInTheDocument();
    });

    it('handles empty messages array when toggling labels', async () => {
      renderView({
        threads: [makeThread({ id: 't1' })],
        messages: [],
        selectedThreadId: 't1',
      });
      // Try to toggle label when there's no message
      fireEvent.click(screen.getByTitle('Add or manage labels'));
      // shouldn't throw error and shouldn't dispatch
      expect(crmThunks.updateLabelsThunk).not.toHaveBeenCalled();
    });
  });
});
