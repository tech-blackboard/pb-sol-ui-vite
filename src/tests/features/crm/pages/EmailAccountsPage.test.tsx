import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
jest.setTimeout(20000);
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EmailAccountsPage from '../../../../features/crm/pages/EmailAccountsPage';
import crmReducer, { initialState, type CrmState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import { fetchEmailAccounts, createEmailAccount, updateEmailAccount, deleteEmailAccount, getMicrosoftAuthUrl } from '../../../../features/crm/services/crmService';
import axios from 'axios';
import { type EmailAccount } from '../../../../features/crm/types';

// ── Mocks ──

jest.mock('../../../../features/crm/services/crmService');
const mockFetchEmailAccounts = fetchEmailAccounts as jest.Mock;
const mockCreateEmailAccount = createEmailAccount as jest.Mock;
const mockUpdateEmailAccount = updateEmailAccount as jest.Mock;
const mockDeleteEmailAccount = deleteEmailAccount as jest.Mock;
const mockGetMicrosoftAuthUrl = getMicrosoftAuthUrl as jest.Mock;

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
}));
import { toast } from 'react-hot-toast';
const mockToast = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
  loading: jest.Mock;
  dismiss: jest.Mock;
};

// ── Helpers ──

const makeStore = (overrides: Partial<CrmState> = {}, authOverrides: Record<string, unknown> = {}) => {
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
        error: null,
        ...authOverrides
      }
    },
  });
};

const makeEmailAccount = (overrides: Partial<EmailAccount> = {}): EmailAccount => ({
  id: 1,
  name: 'Test Account',
  email: 'test@example.com',
  imapHost: 'imap.example.com',
  imapPort: 993,
  imapUser: 'test@example.com',
  imapEncryption: 'ssl',
  smtpHost: 'smtp.example.com',
  smtpPort: 465,
  smtpUser: 'test@example.com',
  smtpEncryption: 'ssl',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

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
    // JSDOM does not implement scrollTo — mock it to prevent TypeError
    window.HTMLElement.prototype.scrollTo = jest.fn();
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
    const account = makeEmailAccount({ id: 1, email: 'test@conf.com', name: 'Test' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    window.confirm = jest.fn().mockReturnValue(true);
    mockDeleteEmailAccount.mockResolvedValue({ success: true });

    renderPage();

    const deleteBtn = await screen.findByLabelText('Delete account');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteEmailAccount).toHaveBeenCalledWith(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Details Modal & Filters Coverage', () => {
    it('handles status filter change and scrolls to top', async () => {
      const activeAccount = makeEmailAccount({ id: 1, isActive: true });
      const disabledAccount = makeEmailAccount({ id: 2, isActive: false, email: 'disabled@test.com' });
      mockFetchEmailAccounts.mockResolvedValue([activeAccount, disabledAccount]);
      renderPage();

      await waitForElementToBeRemoved(() => screen.queryByText('Loading accounts...'));

      // Ensure All is active initially
      const activeFilterBtn = screen.getByRole('button', { name: /Active/i });
      fireEvent.click(activeFilterBtn);

      expect(await screen.findByText('Active')).toBeInTheDocument();
      
      const disabledFilterBtn = screen.getByRole('button', { name: /Disabled/i });
      fireEvent.click(disabledFilterBtn);
      
      expect(await screen.findByText('disabled@test.com')).toBeInTheDocument();
    });

    it('handles Microsoft Auth inside details modal', async () => {
      const account = makeEmailAccount({ id: 1, email: 'user@outlook.com', authMethod: 'password' });
      mockFetchEmailAccounts.mockResolvedValue([account]);
      window.open = jest.fn();

      renderPage();

      await waitForElementToBeRemoved(() => screen.queryByText('Loading accounts...'));

      // Click view details (button text is 'View')
      const viewBtn = await screen.findByText('View');
      fireEvent.click(viewBtn);

      const msBtn = await screen.findByText('Connect Microsoft OAuth2');
      fireEvent.click(msBtn);

      await waitFor(() => {
        expect(mockGetMicrosoftAuthUrl).toHaveBeenCalledWith(1);
      });
    });

    it('handles Edit Settings button inside details modal', async () => {
      const account = makeEmailAccount({ id: 1 });
      mockFetchEmailAccounts.mockResolvedValue([account]);
      renderPage();

      const viewBtn = await screen.findByText('View');
      fireEvent.click(viewBtn);

      const editSettingsBtn = await screen.findByText('Edit Settings');
      fireEvent.click(editSettingsBtn);

      expect(await screen.findByText('Edit Account')).toBeInTheDocument();
    });

    it('renders API key details when outboundProvider is not smtp', async () => {
      const account = makeEmailAccount({
        id: 1,
        email: 'api@test.com',
        outboundProvider: 'api_postmark',
        apiRegion: 'us-east-1'
      });
      mockFetchEmailAccounts.mockResolvedValue([account]);
      renderPage();

      const viewBtn = await screen.findByText('View');
      fireEvent.click(viewBtn);

      expect(screen.getByText('API Key')).toBeInTheDocument();
      expect(screen.getByText('AWS Region')).toBeInTheDocument();
      expect(screen.getByText('us-east-1')).toBeInTheDocument();
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
    const account = makeEmailAccount({ id: 1, email: 'oauth@conf.com', authMethod: 'oauth2' });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    expect(await screen.findByText('OAuth2 Ready')).toBeInTheDocument();
  });

  it('shows access denied when user is not an admin', () => {
    const store = makeStore({}, { user: { name: 'User', isAdmin: false } });

    render(
      <Provider store={store}>
        <EmailAccountsPage />
      </Provider>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('handles Microsoft Auth button click', async () => {
    const account = makeEmailAccount({ id: 1, email: 'user@outlook.com', authMethod: 'password' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    const mockAuthUrl = 'https://login.microsoft.com/auth';
    mockGetMicrosoftAuthUrl.mockResolvedValue(mockAuthUrl);

    // Mock window.open
    window.open = jest.fn();

    renderPage();

    const connectBtn = await screen.findByText('Connect Microsoft');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(mockGetMicrosoftAuthUrl).toHaveBeenCalledWith(1);
      expect(window.open).toHaveBeenCalledWith(mockAuthUrl, '_self');
    });
  });

  it('handles successful bulk upload', async () => {
    mockCreateEmailAccount.mockResolvedValue({});
    renderPage();
    fireEvent.click(await screen.findByText('Bulk Upload'));

    const textarea = screen.getByLabelText('Bulk JSON input');
    const bulkData = [
      { email: 'new1@test.com', name: 'New 1', 'IMAP/SMTP Server': 'mail.test.com' },
      { email: 'new2@test.com', name: 'New 2' }
    ];
    fireEvent.change(textarea, { target: { value: JSON.stringify(bulkData) } });

    await waitFor(() => expect(screen.getByText('Create Bulk Accounts')).not.toBeDisabled());

    fireEvent.click(screen.getByText('Create Bulk Accounts'));

    await waitFor(() => {
      expect(mockCreateEmailAccount).toHaveBeenCalledTimes(2);
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Success! Created: 2'));
    }, { timeout: 10000 });
  });

  it('handles account editing', async () => {
    const account = makeEmailAccount({ id: 1, email: 'edit@test.com', name: 'Original' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    renderPage();

    fireEvent.click(await screen.findByLabelText('Edit account'));

    const nameInput = screen.getByLabelText('Account Name');
    fireEvent.change(nameInput, { target: { value: 'Updated' } });

    const hostInput = screen.getByLabelText('Host', { selector: '#imap-host' });
    fireEvent.change(hostInput, { target: { value: 'imap.test.com' } });

    const userInput = screen.getByLabelText('Username');
    fireEvent.change(userInput, { target: { value: 'updated@test.com' } });

    mockUpdateEmailAccount.mockResolvedValue({});

    fireEvent.submit(screen.getByRole('form', { name: 'Account Form' }));

    await waitFor(() => {
      expect(mockUpdateEmailAccount).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated' }));
      expect(mockToast.success).toHaveBeenCalledWith('Account updated successfully');
    }, { timeout: 10000 });
  });

  it('handles delete failure', async () => {
    const account = makeEmailAccount({ id: 1, email: 'del@test.com', name: 'Delete Me' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    window.confirm = jest.fn(() => true);
    renderPage();

    mockDeleteEmailAccount.mockRejectedValue(new Error('Delete failed'));

    fireEvent.click(await screen.findByLabelText('Delete account'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete account');
    });
  });

  it('handles bulk upload invalid JSON', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Bulk Upload'));

    const textarea = screen.getByLabelText('Bulk JSON input');
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    fireEvent.click(screen.getByText('Create Bulk Accounts'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Invalid JSON format');
    });
  });

  it('handles form submission error', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Add Account'));

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'error@test.com' } });
    fireEvent.change(screen.getByLabelText('Account Name'), { target: { value: 'Error' } });
    fireEvent.change(screen.getByLabelText('Host', { selector: '#imap-host' }), { target: { value: 'imap.test.com' } });
    fireEvent.change(screen.getByLabelText('Port', { selector: '#imap-port' }), { target: { value: '993' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'error@test.com' } });

    mockCreateEmailAccount.mockRejectedValue(new Error('Save failed'));

    fireEvent.submit(screen.getByRole('form', { name: 'Account Form' }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Save failed');
    }, { timeout: 10000 });
  });

  it('handles microsoft auth error', async () => {
    const account = makeEmailAccount({ id: 1, email: 'user@outlook.com', name: 'Outlook' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    renderPage();
    mockGetMicrosoftAuthUrl.mockRejectedValue(new Error('Auth failed'));

    fireEvent.click(await screen.findByText('Connect Microsoft'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to initiate Microsoft login');
    });
  });

  it('handles bulk upload with non-array JSON', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Bulk Upload'));

    const textarea = screen.getByLabelText('Bulk JSON input');
    fireEvent.change(textarea, { target: { value: '{"not": "an array"}' } });

    fireEvent.click(screen.getByText('Create Bulk Accounts'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Input must be a JSON array');
    });
  });

  it('displays top-level error message', async () => {
    // We need to trigger the local 'error' state
    // In EmailAccountsPage, error state is set when loadAccounts fails
    mockFetchEmailAccounts.mockRejectedValueOnce(new Error('Load failed'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Load failed')).toBeInTheDocument();
    });
  });

  it('displays top-level error message for non-Error object (line 71)', async () => {
    mockFetchEmailAccounts.mockRejectedValueOnce('String Error');
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load accounts')).toBeInTheDocument();
    });
  });

  it('handles SendGrid and AWS SES provider fields', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Add Account'));

    const providerSelect = screen.getByLabelText('Outbound Provider');

    // SendGrid
    fireEvent.change(providerSelect, { target: { value: 'sendgrid' } });
    const sgInput = screen.getByLabelText('SendGrid API Key');
    fireEvent.change(sgInput, { target: { value: 'SG.123' } });

    // AWS SES
    fireEvent.change(providerSelect, { target: { value: 'aws-ses' } });
    const awsInput = screen.getByLabelText('AWS Access Key & Secret (Format: KeyID:Secret)');
    const awsRegion = screen.getByLabelText('AWS Region');
    fireEvent.change(awsInput, { target: { value: 'key:secret' } });
    fireEvent.change(awsRegion, { target: { value: 'us-east-1' } });

    // Submit to cover those lines in the submit handler too
    mockCreateEmailAccount.mockResolvedValueOnce({});
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'aws@test.com' } });
    fireEvent.change(screen.getByLabelText('Account Name'), { target: { value: 'AWS' } });
    fireEvent.change(screen.getByLabelText('Host', { selector: '#imap-host' }), { target: { value: 'imap.test.com' } });
    fireEvent.change(screen.getByLabelText('Port', { selector: '#imap-port' }), { target: { value: '993' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'aws@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockCreateEmailAccount).toHaveBeenCalledWith(expect.objectContaining({
        outboundProvider: 'aws-ses',
        apiKey: 'key:secret',
        apiRegion: 'us-east-1'
      }));
    }, { timeout: 10000 });
  });

  describe('URL Status parameters', () => {
    const originalHistory = window.history.replaceState;

    beforeEach(() => {
      window.history.replaceState = jest.fn();
    });

    afterEach(() => {
      window.history.replaceState = originalHistory;
      window.history.pushState({}, '', '/');
    });

    it('handles success status in URL', async () => {
      window.history.pushState({}, '', '/?status=success');

      renderPage();

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Microsoft account connected successfully!');
        expect(window.history.replaceState).toHaveBeenCalledWith({}, expect.any(String), '/');
      });
    });

    it('handles error status in URL without message (line 92)', async () => {
      window.history.pushState({}, '', '/?status=error');

      renderPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to connect Microsoft account');
        expect(window.history.replaceState).toHaveBeenCalledWith({}, expect.any(String), '/');
      });
    });
  });

  it('handles cancel delete (line 134)', async () => {
    const account = makeEmailAccount({ id: 1, name: 'Dont Delete' });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    window.confirm = jest.fn().mockReturnValue(false);

    renderPage();

    const deleteBtn = await screen.findByLabelText('Delete account');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteEmailAccount).not.toHaveBeenCalled();
  });

  describe('Bulk Upload edge cases', () => {
    it('skips items without email and handles duplicates', async () => {
      const existingAccounts = [makeEmailAccount({ id: 1, email: 'exists@test.com', name: 'Existing' })];
      mockFetchEmailAccounts.mockResolvedValue(existingAccounts);
      renderPage();

      // Wait for accounts to load
      await screen.findByText('Existing');

      fireEvent.click(screen.getByText('Bulk Upload'));
      const textarea = screen.getByLabelText('Bulk JSON input');
      const bulkData = [
        { name: 'No Email' }, // Skip: missing email
        { email: 'exists@test.com', name: 'Duplicate' }, // Skip: duplicate
        { email: 'valid@test.com', name: 'Valid' } // Process
      ];
      fireEvent.change(textarea, { target: { value: JSON.stringify(bulkData) } });

      mockCreateEmailAccount.mockResolvedValue({});
      fireEvent.click(screen.getByText('Create Bulk Accounts'));

      await waitFor(() => {
        expect(mockCreateEmailAccount).toHaveBeenCalledTimes(1);
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Success! Created: 1, Skipped: 2'));
      }, { timeout: 10000 });
    });

    it('handles individual creation failures in bulk upload', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryByText('Loading accounts...')).not.toBeInTheDocument();
      }, { timeout: 10000 });
      fireEvent.click(screen.getByText('Bulk Upload'));
      const textarea = screen.getByLabelText('Bulk JSON input');
      const bulkData = [
        { email: 'fail@test.com', name: 'Fail' },
        { email: 'success@test.com', name: 'Success' }
      ];
      fireEvent.change(textarea, { target: { value: JSON.stringify(bulkData) } });

      mockCreateEmailAccount
        .mockRejectedValueOnce(new Error('Item failed'))
        .mockResolvedValueOnce({});

      fireEvent.click(screen.getByText('Create Bulk Accounts'));

      await waitFor(() => {
        expect(mockCreateEmailAccount).toHaveBeenCalledTimes(2);
        expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Completed with 1 errors. Created: 1, Skipped: 0'));
      }, { timeout: 10000 });
    });

    it('uses email prefix as fallback name in bulk upload (line 185)', async () => {
      renderPage();
      fireEvent.click(await screen.findByText('Bulk Upload'));
      const textarea = screen.getByLabelText('Bulk JSON input');
      const bulkData = [{ email: 'fallback@test.com' }];
      fireEvent.change(textarea, { target: { value: JSON.stringify(bulkData) } });

      mockCreateEmailAccount.mockResolvedValue({});
      fireEvent.click(screen.getByText('Create Bulk Accounts'));

      await waitFor(() => {
        expect(mockCreateEmailAccount).toHaveBeenCalledWith(expect.objectContaining({
          name: 'fallback'
        }));
      });
    });
  });

  it('filters accounts by activeDomain (line 239)', async () => {
    const accounts = [
      makeEmailAccount({ id: 1, email: 'a@test.com' }),
      makeEmailAccount({ id: 2, email: 'b@test.com' })
    ];
    mockFetchEmailAccounts.mockResolvedValue(accounts);

    renderPage({ accountsActiveDomain: 'a@test.com' });

    expect(await screen.findByText('a@test.com')).toBeInTheDocument();
    expect(screen.queryByText('b@test.com')).not.toBeInTheDocument();
  });

  it('displays inactive status and Never sync (line 318-319, 341)', async () => {
    const account = makeEmailAccount({
      id: 1,
      email: 'inactive@test.com',
      isActive: false,
      lastSyncAt: undefined
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    const disabledElements = await screen.findAllByText('Disabled');
    expect(disabledElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Last Sync: Never/)).toBeInTheDocument();
  });

  it('displays Last Sync time when present (line 341)', async () => {
    const syncTime = new Date('2023-01-01T10:00:00Z').toISOString();
    const account = makeEmailAccount({
      id: 1,
      email: 'sync@test.com',
      lastSyncAt: syncTime
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    expect(await screen.findByText(/Last Sync: 1\/1\/2023/)).toBeInTheDocument();
  });

  it('opens and closes the View Details Modal', async () => {
    const account = makeEmailAccount({
      id: 1,
      email: 'view@test.com',
      name: 'View Me',
      isActive: true,
      authMethod: 'password'
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    await screen.findByText('View Me');

    const viewBtn = screen.getByRole('button', { name: /View/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText('Account Details')).toBeInTheDocument();
    expect(screen.getByText('password')).toBeInTheDocument();
    expect(screen.getByText('Syncing')).toBeInTheDocument();

    const modalHeader = screen.getByText('Account Details').parentElement;
    const closeBtn = modalHeader!.querySelector('button');
    fireEvent.click(closeBtn!);

    expect(screen.queryByText('Account Details')).not.toBeInTheDocument();
  });

  it('renders oauth auth method in View Details Modal for microsoft accounts', async () => {
    const account = makeEmailAccount({
      id: 1,
      email: 'view@outlook.com',
      name: 'View Me Microsoft',
      isActive: false,
      authMethod: 'oauth2'
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    await screen.findByText('View Me Microsoft');

    const viewBtn = screen.getByRole('button', { name: /View/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText('Account Details')).toBeInTheDocument();
    expect(screen.getByText('oauth')).toBeInTheDocument(); // because it checks for outlook.com
    expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
  });

  it('renders missing inbound and outbound values in View Details Modal', async () => {
    const account = makeEmailAccount({
      id: 1,
      email: 'missing@test.com',
      name: 'Missing Values',
      isActive: true,
      authMethod: undefined,
      imapHost: '',
      imapPort: 0,
      imapUser: '',
      imapEncryption: undefined,
      outboundProvider: 'smtp',
      smtpHost: '',
      smtpPort: 0,
      smtpUser: '' // should fallback to email
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);

    renderPage();

    await screen.findByText('Missing Values');

    const viewBtn = screen.getByRole('button', { name: /View/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText('Account Details')).toBeInTheDocument();
    // Inbound
    const nas = screen.getAllByText('N/A');
    expect(nas.length).toBeGreaterThan(0);
    // Auth Method fallback to password
    expect(screen.getByText('password')).toBeInTheDocument();
    // SMTP user fallback to email
    expect(screen.getAllByText('missing@test.com').length).toBeGreaterThan(0);
  });

  it('covers Microsoft connection button when not oauth2 (line 664)', async () => {
    const account = makeEmailAccount({
      id: 1,
      email: 'test@outlook.com',
      name: 'Outlook password',
      isActive: true,
      authMethod: 'password'
    });
    mockFetchEmailAccounts.mockResolvedValue([account]);
    renderPage();
    
    const viewBtns = await screen.findAllByText('View');
    fireEvent.click(viewBtns[0]);
    
    expect(screen.getByRole('button', { name: /^Connect Microsoft OAuth2$/i })).toBeInTheDocument();
  });

  it('covers oauth2 fallback and precisionsummits.com condition in View Details Modal', async () => {
    const acc1 = makeEmailAccount({ id: 1, email: 'test@precisionsummits.com', name: 'Precision', authMethod: 'oauth2' });
    const acc2 = makeEmailAccount({ id: 2, email: 'test@gmail.com', name: 'Gmail', authMethod: 'oauth2' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acc3 = makeEmailAccount({ id: 3, email: 'test@other.com', name: 'Other Auth', authMethod: 'custom_auth' as any });
    
    mockFetchEmailAccounts.mockResolvedValue([acc1, acc2, acc3]);

    renderPage();

    await screen.findByText('Precision');

    const viewBtns = screen.getAllByRole('button', { name: /View/i });
    
    // View Precision
    fireEvent.click(viewBtns[0]);
    expect(screen.getByText('oauth')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // View Gmail
    fireEvent.click(viewBtns[1]);
    expect(screen.getByText('oauth2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // View Other
    fireEvent.click(viewBtns[2]);
    expect(screen.getByText('custom_auth')).toBeInTheDocument();
  });

  it('toggles Active Status in account form', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Add Account'));
    
    // Find toggle button. The form has text "Active Status" and "Enable or disable background synchronization"
    // The button is the next element or can be queried by role
    const form = screen.getByRole('form', { name: 'Account Form' });
    const toggleBtn = form.querySelector('button[type="button"]');
    
    expect(toggleBtn).toBeInTheDocument();
    
    // Initial state is active (bg-green-500)
    expect(toggleBtn).toHaveClass('bg-green-500');
    
    // Toggle off
    fireEvent.click(toggleBtn!);
    
    expect(toggleBtn).toHaveClass('bg-gray-300');
  });
});

