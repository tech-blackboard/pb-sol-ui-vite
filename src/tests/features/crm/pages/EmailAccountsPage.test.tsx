import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EmailAccountsPage from '../../../../features/crm/pages/EmailAccountsPage';
import crmReducer, { initialState, type CrmState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import { fetchEmailAccounts, createEmailAccount, deleteEmailAccount } from '../../../../features/crm/services/crmService';
import axios from 'axios';

// ── Mocks ──

jest.mock('../../../../features/crm/services/crmService');
const mockFetchEmailAccounts = fetchEmailAccounts as jest.Mock;
const mockCreateEmailAccount = createEmailAccount as jest.Mock;
const mockDeleteEmailAccount = deleteEmailAccount as jest.Mock;

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));
import { toast } from 'react-hot-toast';
const mockToast = toast as unknown as { success: jest.Mock; error: jest.Mock };

// ── Helpers ──

const makeStore = (overrides: Partial<CrmState> = {}) => {
  return configureStore({
    reducer: {
      crm: crmReducer,
      auth: authReducer
    },
    preloadedState: {
      crm: {
        ...initialState,
        ...overrides,
      },
      auth: {
        user: { name: 'Admin', role: 'ADMIN', isAdmin: true },
        token: 'fake-token',
        loading: false,
        error: null
      }
    },
  });
};

const renderPage = (storeOverrides = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <EmailAccountsPage />
    </Provider>
  );
  return store;
};

// ── Tests ──

describe('EmailAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmailAccounts.mockResolvedValue([]);
  });

  it('renders correctly and fetches accounts on mount', async () => {
    renderPage();
    expect(await screen.findByText('Email Accounts')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockFetchEmailAccounts).toHaveBeenCalled();
    });
  });

  it('shows loading state when fetching', () => {
    renderPage({ loading: { ...initialState.loading, emailAccounts: true } });
    expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
  });

  it('handles add account button click', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Add Account'));
    expect(screen.getByText('Connect Account')).toBeInTheDocument();
  });

  it('handles delete account', async () => {
    const accounts = [{ id: 1, email: 'test@conf.com', name: 'Test', purpose: 'General' }];
    mockFetchEmailAccounts.mockResolvedValue(accounts);
    window.confirm = jest.fn().mockReturnValue(true);
    mockDeleteEmailAccount.mockResolvedValue({ success: true });

    renderPage();

    const deleteBtn = await screen.findByLabelText('Delete account');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteEmailAccount).toHaveBeenCalledWith(1);
      expect(mockToast.success).toHaveBeenCalledWith('Account deleted');
    });
  });

  it('handles bulk upload modal', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Bulk Upload'));

    // Should show the modal header
    expect(screen.getByText('Bulk Upload Accounts')).toBeInTheDocument();
    
    const textarea = screen.getByLabelText('Bulk JSON input');
    fireEvent.change(textarea, { target: { value: '[{"Email ID": "test@test.com"}]' } });
    
    expect(screen.getByText('Create Bulk Accounts')).not.toBeDisabled();
  });

  describe('handleSubmit error handling', () => {
    it('shows axios error message when available', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { data: { message: 'Custom Axios Error' } }
      };
      mockCreateEmailAccount.mockRejectedValue(axiosError);

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      renderPage();
      fireEvent.click(await screen.findByText('Add Account'));

      // Fill form
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@x.com' } });
      fireEvent.change(screen.getByLabelText('Account Name'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('Host', { selector: '#imap-host' }), { target: { value: 'imap.test.com' } });
      fireEvent.change(screen.getByLabelText('Port', { selector: '#imap-port' }), { target: { value: '993' } });
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'test@x.com' } });

      fireEvent.submit(screen.getByRole('form', { name: 'Account Form' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Custom Axios Error');
      });
    });

    it('shows fallback error message', async () => {
      mockCreateEmailAccount.mockRejectedValue(new Error('Generic Error'));
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      renderPage();
      fireEvent.click(await screen.findByText('Add Account'));
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@x.com' } });
      fireEvent.change(screen.getByLabelText('Account Name'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('Host', { selector: '#imap-host' }), { target: { value: 'imap.test.com' } });
      fireEvent.change(screen.getByLabelText('Port', { selector: '#imap-port' }), { target: { value: '993' } });
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'test@x.com' } });
      
      fireEvent.submit(screen.getByRole('form', { name: 'Account Form' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Generic Error');
      });
    });
  });

  it('renders OAuth2 Ready badge when authMethod is oauth2', async () => {
    const accounts = [{ id: 1, email: 'oauth@conf.com', authMethod: 'oauth2', name: 'OAuth', purpose: 'General' }];
    mockFetchEmailAccounts.mockResolvedValue(accounts);

    renderPage();

    expect(await screen.findByText('OAuth2 Ready')).toBeInTheDocument();
  });
});
