import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EmailAccountsPage from '../../../../features/crm/pages/EmailAccountsPage';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import { fetchEmailAccounts, createEmailAccount, updateEmailAccount, deleteEmailAccount, getMicrosoftAuthUrl } from '../../../../features/crm/services/crmService';
import { toast } from 'react-hot-toast';

// ── Mocks ──

jest.mock('../../../../features/crm/services/crmService');
jest.mock('react-hot-toast');

const mockFetchEmailAccounts = fetchEmailAccounts as jest.Mock;
const mockCreateEmailAccount = createEmailAccount as jest.Mock;
const mockUpdateEmailAccount = updateEmailAccount as jest.Mock;
const mockDeleteEmailAccount = deleteEmailAccount as jest.Mock;
const mockGetMicrosoftAuthUrl = getMicrosoftAuthUrl as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

// ── Helpers ──

const makeStore = (overrides: object = {}) =>
  configureStore({
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

const renderPage = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <EmailAccountsPage />
    </Provider>,
  );
  return store;
};

const mockAccounts = [
  {
    id: 1,
    name: 'Primary Support',
    email: 'support@example.com',
    isActive: true,
    authMethod: 'password',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapUser: 'support@example.com',
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    lastSyncAt: '2026-04-22T10:00:00Z',
  },
  {
    id: 2,
    name: 'Outlook Support',
    email: 'support@outlook.com',
    isActive: false,
    authMethod: 'password',
    imapHost: 'imap.outlook.com',
    imapPort: 993,
    imapUser: 'support@outlook.com',
    smtpHost: 'smtp.outlook.com',
    smtpPort: 465,
  },
];

// ── Tests ─────

describe('EmailAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmailAccounts.mockResolvedValue(mockAccounts);
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    // Mock window.open
    window.open = jest.fn();
    
    // Reset URL to default
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    // No specific cleanup needed
  });

  it('renders loading state initially', async () => {
    mockFetchEmailAccounts.mockReturnValue(new Promise(() => {})); // Never resolves
    renderPage();
    expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
  });

  it('renders account list after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByText('Loading accounts...')).not.toBeInTheDocument());
    
    expect(screen.getByText('Primary Support')).toBeInTheDocument();
    expect(screen.getByText('support@example.com')).toBeInTheDocument();
    expect(screen.getByText('Outlook Support')).toBeInTheDocument();
    expect(screen.getByText('support@outlook.com')).toBeInTheDocument();
  });

  it('shows "Connect Microsoft" button for outlook accounts', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Outlook Support')).toBeInTheDocument());
    expect(screen.getByText('Connect Microsoft')).toBeInTheDocument();
  });

  it('handles Microsoft OAuth initiation', async () => {
    mockGetMicrosoftAuthUrl.mockResolvedValue('https://microsoft.com/auth');
    renderPage();
    await waitFor(() => expect(screen.getByText('Connect Microsoft')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Connect Microsoft'));
    await waitFor(() => expect(mockGetMicrosoftAuthUrl).toHaveBeenCalledWith(2));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith('https://microsoft.com/auth', '_self'));
  });

  it('handles Microsoft login failure', async () => {
    mockGetMicrosoftAuthUrl.mockRejectedValue(new Error('Auth failed'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Outlook Support')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Connect Microsoft'));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to initiate Microsoft login'));
  });

  it('opens "Add Account" modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Add Account')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Add Account'));
    expect(screen.getByText('Connect Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company Support')).toBeInTheDocument();
  });

  it('handles successful account creation', async () => {
    mockCreateEmailAccount.mockResolvedValue({ id: 3, name: 'New' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Add Account')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Add Account'));
    
    fireEvent.change(screen.getByPlaceholderText('Company Support'), { target: { value: 'New Team' } });
    fireEvent.change(screen.getByPlaceholderText('support@precisionglobalconferences.com'), { target: { value: 'team@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('imap.gmail.com'), { target: { value: 'imap.test.com' } });
    fireEvent.change(screen.getByPlaceholderText('smtp.gmail.com'), { target: { value: 'smtp.test.com' } });
    
    // Fill required username
    const usernameInputs = screen.getAllByRole('textbox').filter(i => (i as HTMLInputElement).value === '');
    if (usernameInputs.length > 0) {
      fireEvent.change(usernameInputs[0], { target: { value: 'team@test.com' } });
    }

    fireEvent.click(screen.getByText('Create Account'));
    
    await waitFor(() => expect(mockCreateEmailAccount).toHaveBeenCalled());
    expect(mockToast.success).toHaveBeenCalledWith('Account added successfully');
    await waitFor(() => expect(screen.queryByText('Connect Account')).not.toBeInTheDocument());
  });

  it('handles successful account update', async () => {
    mockUpdateEmailAccount.mockResolvedValue({ id: 1, name: 'Updated' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Primary Support')).toBeInTheDocument());
    
    // Find edit button
    const editButtons = screen.getAllByLabelText('Edit account');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Edit Account')).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('Primary Support'), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByText('Update Account'));
    
    await waitFor(() => expect(mockUpdateEmailAccount).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated Name' })));
    expect(mockToast.success).toHaveBeenCalledWith('Account updated successfully');
  });

  it('handles account deletion', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Primary Support')).toBeInTheDocument());
    
    // Find delete button
    const deleteButtons = screen.getAllByLabelText('Delete account');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(mockDeleteEmailAccount).toHaveBeenCalledWith(1));
    expect(mockToast.success).toHaveBeenCalledWith('Account deleted');
  });

  it('handles bulk upload', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Bulk Upload')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Bulk Upload'));
    expect(screen.getByText('Bulk Upload Accounts')).toBeInTheDocument();
    
    const json = JSON.stringify([
      { 'Email ID': 'bulk1@test.com', 'Password': 'pass', 'IMAP/SMTP Server': 'mail.com' }
    ]);
    
    fireEvent.change(screen.getByLabelText('Bulk JSON input'), { target: { value: json } });
    fireEvent.click(screen.getByText('Create Bulk Accounts'));
    
    await waitFor(() => expect(mockCreateEmailAccount).toHaveBeenCalled());
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Success! Created: 1'));
  });

  it('handles Microsoft OAuth callback success from URL', async () => {
    window.history.replaceState(null, '', '/?status=success');
    renderPage();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Microsoft account connected successfully!'));
  });

  it('handles Microsoft OAuth callback error from URL', async () => {
    window.history.replaceState(null, '', '/?status=error&message=Something went wrong');
    renderPage();
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Something went wrong'));
  });

  describe('Admin Access Control', () => {
    it('renders Access Denied for non-admin users', () => {
      const store = configureStore({
        reducer: { crm: crmReducer, auth: authReducer },
        preloadedState: {
          crm: initialState,
          auth: { user: { name: 'User', role: 'USER', isAdmin: false }, token: 't', loading: false, error: null }
        }
      });
      render(<Provider store={store}><EmailAccountsPage /></Provider>);
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission/)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('shows error message when loadAccounts fails', async () => {
      mockFetchEmailAccounts.mockRejectedValue(new Error('API Failure'));
      renderPage();
      await waitFor(() => expect(screen.getByText('API Failure')).toBeInTheDocument());
    });

    it('cancels deletion when confirm is rejected', async () => {
      window.confirm = jest.fn(() => false);
      renderPage();
      await waitFor(() => expect(screen.getByText('Primary Support')).toBeInTheDocument());
      
      const deleteBtn = screen.getAllByLabelText('Delete account')[0];
      fireEvent.click(deleteBtn);
      
      expect(mockDeleteEmailAccount).not.toHaveBeenCalled();
    });

    it('shows error toast when deletion fails', async () => {
      mockDeleteEmailAccount.mockRejectedValue(new Error('Fail'));
      renderPage();
      await waitFor(() => expect(screen.getByText('Primary Support')).toBeInTheDocument());
      
      fireEvent.click(screen.getAllByLabelText('Delete account')[0]);
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to delete account'));
    });
  });

  describe('Form Validation and Providers', () => {
    it('switches fields when outbound provider changes', async () => {
      renderPage();
      const addBtn = await screen.findByText('Add Account');
      fireEvent.click(addBtn);
      
      const select = screen.getByRole('combobox', { name: '' }); // The only select in form
      
      // Select SendGrid
      fireEvent.change(select, { target: { value: 'sendgrid' } });
      expect(screen.getByLabelText(/SendGrid API Key/i)).toBeInTheDocument();
      
      // Select AWS SES
      fireEvent.change(select, { target: { value: 'aws-ses' } });
      expect(screen.getByLabelText(/AWS Access Key & Secret/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('us-east-1')).toBeInTheDocument();
    });
  });

  describe('Advanced Bulk Upload', () => {
    it('handles invalid JSON in bulk upload', async () => {
      renderPage();
      const bulkBtn = await screen.findByText('Bulk Upload');
      fireEvent.click(bulkBtn);
      fireEvent.change(screen.getByLabelText('Bulk JSON input'), { target: { value: 'invalid-json' } });
      fireEvent.click(screen.getByText('Create Bulk Accounts'));
      expect(mockToast.error).toHaveBeenCalledWith('Invalid JSON format');
    });

    it('handles JSON that is not an array', async () => {
      renderPage();
      const bulkBtn = await screen.findByText('Bulk Upload');
      fireEvent.click(bulkBtn);
      fireEvent.change(screen.getByLabelText('Bulk JSON input'), { target: { value: '{"key": "value"}' } });
      fireEvent.click(screen.getByText('Create Bulk Accounts'));
      expect(mockToast.error).toHaveBeenCalledWith('Input must be a JSON array');
    });

    it('skips duplicates and items without email', async () => {
      renderPage();
      const bulkBtn = await screen.findByText('Bulk Upload');
      fireEvent.click(bulkBtn);
      
      const json = JSON.stringify([
        { email: 'support@example.com' }, // Duplicate
        { Purpose: 'No Email' },          // Missing email
        { email: 'new-bulk@test.com' }    // New
      ]);
      
      fireEvent.change(screen.getByLabelText('Bulk JSON input'), { target: { value: json } });
      fireEvent.click(screen.getByText('Create Bulk Accounts'));
      
      await waitFor(() => expect(mockCreateEmailAccount).toHaveBeenCalledTimes(1));
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Created: 1, Skipped: 2'));
    });
  });
});
