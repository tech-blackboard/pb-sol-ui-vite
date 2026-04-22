import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThreadView from '../../../../features/crm/components/ThreadView';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';
import toast from 'react-hot-toast';
import type { Thread, Message, Contact, Attachment } from '../../../../features/crm/types';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../features/crm/components/ReplyForm', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="reply-form">
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
  contact: makeContact(), ...overrides,
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
    await waitFor(() => expect(store.getState().crm.selectedThreadId).toBeNull());
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

    it('dispatches updateLabelsThunk when a new label is confirmed via prompt', async () => {
      jest.spyOn(window, 'prompt').mockReturnValue('new-label');
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add label'));
      await waitFor(() => expect(thunkSpy).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing', 'new-label'] }));
    });

    it('does nothing when prompt is cancelled', async () => {
      jest.spyOn(window, 'prompt').mockReturnValue(null);
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ labels: [] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add label'));
      expect(thunkSpy).not.toHaveBeenCalled();
    });

    it('deduplicates labels when adding one already present', async () => {
      jest.spyOn(window, 'prompt').mockReturnValue('existing');
      const thunkSpy = jest.spyOn(crmThunks, 'updateLabelsThunk');

      renderView({
        threads: [makeThread()],
        messages: [makeMessage({ id: 'msg-1', labels: ['existing'] })],
        selectedThreadId: 'thread-1',
      });

      fireEvent.click(screen.getByTitle('Add label'));
      await waitFor(() =>
        expect(thunkSpy).toHaveBeenCalledWith({ messageId: 'msg-1', labels: ['existing'] }),
      );
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
});
