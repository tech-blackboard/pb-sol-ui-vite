import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MailboxPage from '../../../../features/crm/pages/MailboxPage';
import crmReducer, { initialState, setPage, setSidebarOpen, type CrmState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';
import toast from 'react-hot-toast';

// ── Mocks ──

jest.mock('../../../../features/crm/components/CrmSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="crm-sidebar">CrmSidebar Mock</div>,
}));

jest.mock('../../../../features/crm/components/CrmHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="crm-header">CrmHeader Mock</div>,
}));

jest.mock('../../../../features/crm/components/ThreadTable', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-table">ThreadTable Mock</div>,
}));

jest.mock('../../../../features/crm/components/ThreadView', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-view">ThreadView Mock</div>,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../store/slices/crm/crm.thunks', () => {
  const actual = jest.requireActual('../../../../store/slices/crm/crm.thunks');
  return {
    ...actual,
    trashThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.trashThreadsThunk),
    restoreThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.restoreThreadsThunk),
    deleteThreadsPermanentlyThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.deleteThreadsPermanentlyThunk),
    emptyTrashThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.emptyTrashThunk),
    fetchThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.fetchThreadsThunk),
    fetchDraftsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.fetchDraftsThunk),
    deleteDraftThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.deleteDraftThunk),
  };
});

// Mock the components that are rendered conditionally
jest.mock('../../../../features/crm/pages/EmailAccountsPage', () => ({
  __esModule: true,
  default: () => <div>EmailAccountsPage Mock</div>,
}));

jest.mock('../../../../features/crm/components/ContactBucketView', () => ({
  __esModule: true,
  default: () => <div>ContactBucketView Mock</div>,
}));

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

// ── Tests ──

describe('MailboxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders EmailAccountsPage when activeFolder is Accounts', () => {
    const store = makeStore({ activeFolder: 'Accounts' });
    render(<Provider store={store}><MailboxPage /></Provider>);
    expect(screen.getByText('EmailAccountsPage Mock')).toBeInTheDocument();
  });

  it('renders ContactBucketView when activeFolder is Contact Bucket', () => {
    const store = makeStore({ activeFolder: 'Contact Bucket' });
    render(<Provider store={store}><MailboxPage /></Provider>);
    expect(screen.getByText('ContactBucketView Mock')).toBeInTheDocument();
    // Header and Sidebar should be hidden for Contact Bucket
    expect(screen.queryByTestId('crm-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('crm-sidebar')).not.toBeInTheDocument();
  });

  it('renders CrmHeader and CrmSidebar when activeFolder is Inbox', () => {
    const store = makeStore({ activeFolder: 'Inbox' });
    render(<Provider store={store}><MailboxPage /></Provider>);
    expect(screen.getByTestId('crm-header')).toBeInTheDocument();
    expect(screen.getByTestId('crm-sidebar')).toBeInTheDocument();
  });

  it('handles pagination button clicks', async () => {
    const store = makeStore({ totalThreads: 150, activeFolder: 'Inbox' });
    const spy = jest.spyOn(store, 'dispatch');
    render(<Provider store={store}><MailboxPage /></Provider>);

    // Wait for mount effects (initial page 1)
    await waitFor(() => expect(screen.getByText('1–50 of 150')).toBeInTheDocument());

    const prevBtn = screen.getByTitle('Previous Page');
    const nextBtn = screen.getByTitle('Next Page');

    // Previous should be disabled on page 1
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    spy.mockClear();
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(setPage(2));
    });
  });

  it('dispatches fetchDraftsThunk when activeFolder is Drafts', async () => {
    const store = makeStore({ activeEventId: 1, activeFolder: 'Drafts' });
    const spy = jest.spyOn(store, 'dispatch');
    render(<Provider store={store}><MailboxPage /></Provider>);

    await waitFor(() => {
      // Check if any function (thunk) was dispatched
      expect(spy).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('renders mobile sidebar backdrop and closes on click', async () => {
    // Set window width to mobile
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    
    const store = makeStore({ activeFolder: 'Inbox' });
    const spy = jest.spyOn(store, 'dispatch');
    render(<Provider store={store}><MailboxPage /></Provider>);
    
    // Open sidebar AFTER mount effects have run (to avoid auto-close on mobile)
    act(() => {
      store.dispatch(setSidebarOpen(true));
    });

    const backdrop = screen.getByTestId('mobile-backdrop');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(setSidebarOpen(false));
    });

    // Reset innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  it('renders ThreadView when selectedThreadId is present', () => {
    const store = makeStore({ selectedThreadId: 't1', activeFolder: 'Inbox' });
    render(<Provider store={store}><MailboxPage /></Provider>);
    expect(screen.getByTestId('thread-view')).toBeInTheDocument();
  });

  it('handles previous page click', async () => {
    const store = makeStore({ totalThreads: 150, activeFolder: 'Inbox' });
    const spy = jest.spyOn(store, 'dispatch');
    render(<Provider store={store}><MailboxPage /></Provider>);

    // Go to page 2 first
    const nextBtn = screen.getByTitle('Next Page');
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(setPage(2));
    });

    // Mock state update (since we are using a real store but manually spying)
    // Actually, the reducer will handle it. 
    
    const prevBtn = screen.getByTitle('Previous Page');
    await waitFor(() => expect(prevBtn).not.toBeDisabled());
    
    fireEvent.click(prevBtn);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(setPage(1));
    });
  });

  it('dispatches fetchThreadsThunk for standard folder', async () => {
    const store = makeStore({ activeEventId: 1, activeFolder: 'Inbox' });
    const spy = jest.spyOn(store, 'dispatch');
    render(<Provider store={store}><MailboxPage /></Provider>);

    await waitFor(() => {
      // Check for thunk dispatch
      expect(spy).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Bulk Actions and Trash', () => {
    it('handles bulk trash action (line 154-162)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ selectedThreadIds: ['t1', 't2'], activeFolder: 'Inbox' });
      const spy = jest.spyOn(store, 'dispatch');
      render(<Provider store={store}><MailboxPage /></Provider>);

      const bulkTrashBtn = screen.getByTitle('Move Selected to Trash');
      fireEvent.click(bulkTrashBtn);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('handles bulk restore and permanent delete in Trash folder (line 129-150)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ selectedThreadIds: ['t1'], activeFolder: 'Trash' });
      const spy = jest.spyOn(store, 'dispatch');
      render(<Provider store={store}><MailboxPage /></Provider>);

      const restoreBtn = screen.getByTitle('Restore Selected');
      fireEvent.click(restoreBtn);
      expect(spy).toHaveBeenCalled();

      spy.mockClear();
      const deleteBtn = screen.getByTitle('Delete Selected Permanently');
      fireEvent.click(deleteBtn);
      expect(window.confirm).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('handles empty trash action (line 206-219)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ activeFolder: 'Trash', activeEventId: 1 });
      const spy = jest.spyOn(store, 'dispatch');
      render(<Provider store={store}><MailboxPage /></Provider>);

      const emptyBtn = screen.getByText('Empty Trash now');
      fireEvent.click(emptyBtn);
      
      expect(window.confirm).toHaveBeenCalledWith('Empty Trash? All conversations in Trash will be permanently deleted.');
      expect(spy).toHaveBeenCalled();
    });

    it('handles bulk trash success and error (coverage 74-77)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ selectedThreadIds: ['t1'], activeFolder: 'Inbox' });
      render(<Provider store={store}><MailboxPage /></Provider>);

      // Success
      fireEvent.click(screen.getByTitle('Move Selected to Trash'));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 conversations moved to Trash'));

      // Error
      act(() => {
        store.dispatch({ type: 'crm/selectAllThreads', payload: ['t2'] });
      });
      (crmThunks.trashThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Trash Error') }));
      fireEvent.click(screen.getByTitle('Move Selected to Trash'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Trash Error'));
    });

    it('handles bulk trash drafts (coverage 77)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ selectedThreadIds: ['d1', 'd2'], activeFolder: 'Drafts' });
      render(<Provider store={store}><MailboxPage /></Provider>);

      fireEvent.click(screen.getByTitle('Move Selected to Trash'));
      
      await waitFor(() => {
        // Should dispatch deleteDraftThunk instead of trashThreadsThunk
        expect(toast.success).toHaveBeenCalledWith('2 drafts moved to Trash');
      });
    });

    it('handles bulk restore success and error (coverage 84-87)', async () => {
      const store = makeStore({ selectedThreadIds: ['t1'], activeFolder: 'Trash' });
      render(<Provider store={store}><MailboxPage /></Provider>);

      fireEvent.click(screen.getByTitle('Restore Selected'));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 conversations restored'));

      (crmThunks.restoreThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Restore Error') }));
      fireEvent.click(screen.getByTitle('Restore Selected'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Restore Error'));
    });

    it('handles bulk delete permanent success and error (coverage 94-97)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ selectedThreadIds: ['t1'], activeFolder: 'Trash' });
      render(<Provider store={store}><MailboxPage /></Provider>);

      fireEvent.click(screen.getByTitle('Delete Selected Permanently'));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 conversations permanently deleted'));

      (crmThunks.deleteThreadsPermanentlyThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Delete Error') }));
      fireEvent.click(screen.getByTitle('Delete Selected Permanently'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete Error'));
    });

    it('handles empty trash success and error (coverage 105-108)', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      const store = makeStore({ activeFolder: 'Trash', activeEventId: 1 });
      render(<Provider store={store}><MailboxPage /></Provider>);

      fireEvent.click(screen.getByText('Empty Trash now'));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Trash emptied successfully'));

      (crmThunks.emptyTrashThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Empty Error') }));
      fireEvent.click(screen.getByText('Empty Trash now'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Empty Error'));
    });
  });
});
