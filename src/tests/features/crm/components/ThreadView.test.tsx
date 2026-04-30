import { render, screen, fireEvent, waitFor } from '@testing-library/react';
jest.setTimeout(20000);
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThreadView from '../../../../features/crm/components/ThreadView';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';
import toast from 'react-hot-toast';
import type { Thread, Message, Contact, Attachment, CrmEvent } from '../../../../features/crm/types';
import type { RootState } from '../../../../store';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../features/crm/components/ReplyForm', () => ({
  __esModule: true,
  default: ({ onSuccess, recipientEmail }: { onSuccess?: () => void; recipientEmail?: string }) => (
    <div data-testid="reply-form">
      <span>{recipientEmail}</span>
      <button onClick={onSuccess}>Trigger Reply Success</button>
    </div>
  ),
}));

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
  labels: [], attachments: [], ...overrides,
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

  it('disables unsubscribe button when contact is already unsubscribed', () => {
    renderView({
      threads: [makeThread({ contact: makeContact({ status: 'unsubscribed' }) })],
      messages: [makeMessage()],
      selectedThreadId: 'thread-1',
    });
    const unsubBtn = screen.getByTitle('Unsubscribe Contact');
    expect(unsubBtn).toBeDisabled();
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

    it('does nothing when user cancels the confirm dialog', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      const spy = jest.spyOn(crmService, 'unsubscribeContact');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Unsubscribe Contact'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing when thread has no contact', async () => {
      const spy = jest.spyOn(crmService, 'unsubscribeContact');

      renderView({
        threads: [makeThread({ contact: undefined })],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Unsubscribe Contact'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('details toggle', () => {
    it('toggles the details dropdown on ▼ click', () => {
      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ toEmail: 'me@conf.com' })],
        selectedThreadId: 'thread-1',
      });

      expect(screen.queryByText('from:')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('▼'));
      expect(screen.getByText('from:')).toBeInTheDocument();
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
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add or manage labels'));
      await waitFor(() => expect(thunkSpy).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing', 'new-label'] }));
    });

    it('dispatches updateLabelsThunk when a label is toggled (remove)', async () => {
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing', 'new-label'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add or manage labels'));
      await waitFor(() => expect(thunkSpy).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing'] }));
    });

    it('returns early if first message is missing onToggleLabel (line 181)', async () => {
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');
      renderView({
        threads: [makeThread()],
        messages: [],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add or manage labels'));
      expect(thunkSpy).not.toHaveBeenCalled();
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

    it('successfully downloads without toast on success', async () => {
      jest.spyOn(crmService, 'downloadAttachment').mockResolvedValue(undefined);

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ attachments: [makeAttachment({ id: 5 })] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Download'));
      await waitFor(() => expect(mockToast.error).not.toHaveBeenCalled());
    });
  });

  describe('reply success', () => {
    it('dispatches fetchMessagesThunk when ReplyForm triggers onSuccess', async () => {
      const store = makeStore({
        threads: [makeThread()],
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
      });
      const spy = jest.spyOn(store, 'dispatch');
      render(<Provider store={store}><ThreadView /></Provider>);

      fireEvent.click(screen.getByText('Trigger Reply Success'));
      await waitFor(() => expect(spy).toHaveBeenCalled());
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

    it('renders a thread-like view for a draft with missing fields (line 31-44)', () => {
      const draft = {
        id: 'draft-99',
        subject: undefined,
        fromEmail: undefined,
        toEmail: undefined,
        eventId: 1,
        contactId: 10,
        createdAt: new Date().toISOString(),
        labels: [],
        status: 'draft'
      } as unknown as Message;

      renderView({
        selectedThreadId: 'draft-99',
        drafts: [draft],
        threads: [],
        messages: []
      });

      expect(screen.getByText('(No subject)')).toBeInTheDocument();
    });

    it('matches draft by threadId (line 27)', () => {
      const draft = {
        id: 'd-1',
        threadId: 'thread-1',
        subject: 'Thread Draft'
      } as Message;

      renderView({
        selectedThreadId: 'thread-1',
        drafts: [draft],
        threads: [], // thread-1 not in threads list
        messages: []
      });

      expect(screen.getByText('Thread Draft')).toBeInTheDocument();
    });

    it('handles toggle read (mark as unread) from toolbar', async () => {
      const updateSpy = jest.spyOn(crmService, 'updateThreadReadStatus').mockResolvedValue(undefined);
      const store = makeStore({
        threads: [makeThread({ id: 't1', isRead: true })],
        messages: [makeMessage({ threadId: 't1' })],
        selectedThreadId: 't1',
      });
      render(<Provider store={store}><ThreadView /></Provider>);

      fireEvent.click(screen.getByTitle('Mark as unread'));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith('t1', false);
      }, { timeout: 5000 });
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

    it('matches draft for ReplyForm based on threadId or contactId/eventId', () => {
      const draft = {
        id: 'd1',
        threadId: 'thread-1',
        contactId: 10,
        eventId: 1,
        htmlBody: 'Draft content'
      } as unknown as Message;

      renderView({
        threads: [makeThread({ id: 'thread-1', contactId: 10, eventId: 1 })],
        messages: [makeMessage({ threadId: 'thread-1' })],
        selectedThreadId: 'thread-1',
        drafts: [draft]
      });

      // The mock ReplyForm doesn't show content, but we can verify it doesn't crash 
      // and we could potentially extend the mock to verify props if needed.
      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });

    it('matches draft for ReplyForm based on only contactId and eventId (line 421)', () => {
      const draft = {
        id: 'd1',
        threadId: undefined, // No threadId yet
        contactId: 10,
        eventId: 1,
        htmlBody: 'Matching draft'
      } as unknown as Message;

      renderView({
        threads: [makeThread({ id: 'thread-1', contactId: 10, eventId: 1 })],
        messages: [makeMessage({ threadId: 'thread-1' })],
        selectedThreadId: 'thread-1',
        drafts: [draft]
      });

      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });

    it('handles empty replyEmails in ReplyForm (line 428)', () => {
      renderView({
        threads: [makeThread({ eventId: 999 })], // event 999 doesn't exist
        messages: [makeMessage()],
        selectedThreadId: 'thread-1',
        events: []
      });
      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });

    it('handles presence of replyEmails in ReplyForm (line 428)', () => {
      renderView({
        threads: [makeThread({ id: 't1', eventId: 1 })],
        messages: [makeMessage()],
        selectedThreadId: 't1',
        events: [{ id: 1, replyEmails: ['sup@test.com'] } as unknown as CrmEvent]
      });
      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });
  });
});

