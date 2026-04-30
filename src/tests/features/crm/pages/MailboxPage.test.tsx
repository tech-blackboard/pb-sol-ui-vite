import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MailboxPage from '../../../../features/crm/pages/MailboxPage';
import crmReducer, { initialState, setPage, setSidebarOpen, type CrmState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';

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
});


