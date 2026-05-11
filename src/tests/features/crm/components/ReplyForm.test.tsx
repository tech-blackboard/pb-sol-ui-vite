import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ReplyForm from '../../../../features/crm/components/ReplyForm';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import type { Message } from '../../../../features/crm/types';
import toast from 'react-hot-toast';

jest.mock('../../../../features/crm/services/crmService', () => ({
  sendReply: jest.fn(),
  saveDraft: jest.fn(),
  fetchReplyEmails: jest.fn().mockResolvedValue([]),
  fetchEmailAccounts: jest.fn().mockResolvedValue([]),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockToast = toast as jest.Mocked<typeof toast>;

const makeStore = (loadingOverrides: object = {}) => {
  return configureStore({
    reducer: { crm: crmReducer },
    preloadedState: {
      crm: {
        ...initialState,
        loading: { ...initialState.loading, ...loadingOverrides },
      },
    },
  });
};

const defaultProps = {
  threadId: 'thread-1',
  defaultSubject: 'Hello World',
  recipientEmail: 'alice@example.com',
  replyEmails: ['support@test.com', 'events@test.com'],
  contactId: 1,
  eventId: 1,
};

const renderForm = (props = {}, storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <ReplyForm {...defaultProps} {...props} />
    </Provider>,
  );
  return store;
};

// ── Tests ──

describe('ReplyForm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('collapsed state', () => {
    it('shows the click-to-reply prompt mentioning recipient email', () => {
      renderForm();
      expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
      expect(screen.getByText(/Reply/)).toBeInTheDocument();
    });

    it('expands when the reply prompt button is clicked', () => {
      renderForm();
      // The collapsed state wraps everything in a button
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Write your reply here...')).toBeInTheDocument();
    });
  });

  describe('expanded state', () => {
    const expand = () => fireEvent.click(screen.getByRole('button'));

    it('shows recipient email in the Reply to: row', () => {
      renderForm();
      expand();
      expect(screen.getByText('Reply to:')).toBeInTheDocument();
      expect(screen.getAllByText('alice@example.com').length).toBeGreaterThan(0);
    });

    it('collapses when the × button is clicked', () => {
      renderForm();
      expand();
      // The close (×) button is the "type=button" button inside the form
      const closeBtn = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'button');
      fireEvent.click(closeBtn!);
      // Should revert to the prompt text
      expect(screen.getByText(/Click here to/)).toBeInTheDocument();
    });

    it('shows error toast when submitting with empty body', async () => {
      renderForm();
      expand();
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Please enter a message'));
    });

    it('prepends "Re: " to subject when it does not already start with it', async () => {
      const serviceSpy = jest.spyOn(crmService, 'sendReply').mockResolvedValue({ status: 'ok', messageId: 'new-1' });

      renderForm();
      expand();
      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'My reply text' } });
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));

      await waitFor(() => expect(serviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Re: Hello World' }),
      ));
    });

    it('handles draft auto-save after 30 seconds', async () => {
      const saveSpy = jest.spyOn(crmService, 'saveDraft').mockResolvedValue({
        id: 'draft-1', subject: 'Re: Hello World', fromEmail: 'support@test.com',
        toEmail: 'alice@example.com', textBody: 'Testing auto-save logic',
        htmlBody: 'Testing auto-save logic', threadId: 'thread-1',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        labels: [], contactId: 1, eventId: 1,
        direction: 'outbound', status: 'draft', attachments: [],
        isTrash: false, isJunk: false
      } as Message);
      renderForm();
      expand();

      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'Testing auto-save logic' } });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ textBody: 'Testing auto-save logic' })
      ));
    });

    it('saves draft on component unmount', async () => {
      const saveSpy = jest.spyOn(crmService, 'saveDraft').mockResolvedValue({
        id: 'draft-1', subject: 'Re: Hello World', fromEmail: 'support@test.com',
        toEmail: 'alice@example.com', textBody: 'Unmount test',
        htmlBody: 'Unmount test', threadId: 'thread-1',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        labels: [], contactId: 1, eventId: 1,
        direction: 'outbound', status: 'draft', attachments: [],
        isTrash: false, isJunk: false
      } as Message);
      const { unmount } = render(
        <Provider store={makeStore()}>
          <ReplyForm {...defaultProps} />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'Unmount test' } });

      unmount();

      await waitFor(() => expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ textBody: 'Unmount test' })
      ));
    });


    it('shows saving draft status', () => {
      renderForm({}, { savingDraft: true });
      expand();
      expect(screen.getByText('Saving draft...')).toBeInTheDocument();
    });

    it('shows draft saved status when draftId exists', () => {
      renderForm({ initialDraftId: 'd-123' });
      // initialDraftId causes it to be expanded
      expect(screen.getByText('Draft saved')).toBeInTheDocument();
    });

    it('shows success toast, clears body, and collapses on successful send', async () => {
      jest.spyOn(crmService, 'sendReply').mockResolvedValue({ status: 'ok', messageId: 'm1' });

      const onSuccess = jest.fn();
      renderForm({ onSuccess });
      expand();

      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'My reply' } });
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));

      await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Reply sent successfully'));
      expect(onSuccess).toHaveBeenCalled();
      expect(screen.getByText(/Click here to/)).toBeInTheDocument();
    });

    it('shows error toast when send fails', async () => {
      jest.spyOn(crmService, 'sendReply').mockRejectedValue(new Error('Network error'));

      renderForm();
      expand();
      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'Body' } });
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to send reply'));
    });

    it('disables textarea and submit button when loading.sending is true', () => {
      renderForm({}, { sending: true });
      expand();
      expect(screen.getByPlaceholderText('Write your reply here...')).toBeDisabled();
      expect(screen.getByText('Send Reply').closest('button')).toBeDisabled();
    });

    it('shows spinner inside Send button when loading.sending', () => {
      renderForm({}, { sending: true });
      expand();
      const btn = screen.getByText('Send Reply').closest('button')!;
      // The spinner div is inside the button
      expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('handles email selection changes from replyEmails', async () => {
      renderForm({ replyEmails: ['default@test.com', 'other@test.com'] });
      expand();

      // Change to a specific email
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other@test.com' } });

      // Submit and check if correct email was used
      const serviceSpy = jest.spyOn(crmService, 'sendReply').mockResolvedValue({ status: 'ok', messageId: 'm1' });
      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'Body' } });
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));

      await waitFor(() => expect(serviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fromEmail: 'other@test.com'
        })
      ));
    });


  });
});
