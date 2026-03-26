import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ReplyForm from '../../../../features/crm/components/ReplyForm';
import crmReducer from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import toast from 'react-hot-toast';

jest.mock('../../../../features/crm/services/crmService', () => ({
  ...jest.requireActual('../../../../features/crm/services/crmService'),
  sendReply: jest.fn(),
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
        events: [], threads: [], messages: [],
        activeEventId: null, activeDomain: null, selectedThreadId: null,
        loading: { events: false, threads: false, messages: false, sending: false, ...loadingOverrides },
        error: null,
      },
    },
  });
};

const defaultProps = {
  threadId: 'thread-1',
  defaultSubject: 'Hello World',
  recipientEmail: 'alice@example.com',
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
  afterEach(() => jest.clearAllMocks());

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

    it('does NOT prepend "Re: " when subject already starts with it', async () => {
      const serviceSpy = jest.spyOn(crmService, 'sendReply').mockResolvedValue({ status: 'ok', messageId: 'new-2' });

      renderForm({ defaultSubject: 'Re: Already prefixed' });
      expand();
      fireEvent.change(screen.getByPlaceholderText('Write your reply here...'), { target: { value: 'Body' } });
      fireEvent.submit(screen.getByRole('button', { name: /send reply/i }));

      await waitFor(() => expect(serviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Re: Already prefixed' }),
      ));
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
  });
});
