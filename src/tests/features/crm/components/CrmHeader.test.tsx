import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CrmHeader from '../../../../features/crm/components/CrmHeader';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';
import type { CrmEvent, EmailAccount } from '../../../../features/crm/types';

// ── Helpers ──

const mockEvent = (overrides: Partial<CrmEvent> = {}): CrmEvent => ({
  id: 1,
  name: 'Tech Conf 2025',
  slug: 'tech-conf-2025',
  replyDomain: 'reply.techconf.com',
  domains: ['inbox.techconf.com', 'support.techconf.com'],
  replyEmails: [],
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const mockEmailAccount = (overrides: Partial<EmailAccount> = {}): EmailAccount => ({
  id: 101,
  name: 'Inbox Account',
  email: 'inbox.techconf.com',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  imapHost: 'imap.test.com',
  imapPort: 993,
  imapUser: 'test',
  imapEncryption: 'ssl',
  smtpHost: 'smtp.test.com',
  smtpPort: 465,
  smtpUser: 'test',
  smtpEncryption: 'ssl',
  ...overrides,
});

const makeStore = (overrides: object = {}) => {
  const preloaded = {
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
  };
  return configureStore({ 
    reducer: { 
      crm: crmReducer,
      auth: authReducer
    }, 
    preloadedState: preloaded 
  });
};

const renderHeader = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <CrmHeader />
    </Provider>,
  );
  return store;
};

const renderHeaderWithSpy = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  const spy = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <CrmHeader />
    </Provider>,
  );
  return { store, spy };
};

// ── Tests ──

describe('CrmHeader', () => {
  it('renders Conference Edition and Email Account selects plus Sync button', () => {
    renderHeader();
    expect(screen.getByText('Conference Edition')).toBeInTheDocument();
    expect(screen.getByText('Email Account')).toBeInTheDocument();
    expect(screen.getByTitle('Synchronize Emails')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Subject or Email ID')).toBeInTheDocument();
    expect(screen.getByTitle('Search Email')).toBeInTheDocument();
  });

  it('populates the event dropdown from the store', () => {
    const events = [mockEvent({ id: 1, name: 'Conf A' }), mockEvent({ id: 2, name: 'Conf B' })];
    renderHeader({ events });
    expect(screen.getByRole('option', { name: 'Conf A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Conf B' })).toBeInTheDocument();
  });

  it('shows "All Accounts" option in domain dropdown when no active event', () => {
    renderHeader();
    expect(screen.getByRole('option', { name: 'All Accounts' })).toBeInTheDocument();
  });

  it('populates email account dropdown from emailAccounts in state', () => {
    const emailAccounts = [
      mockEmailAccount({ id: 101, email: 'inbox.techconf.com' }),
      mockEmailAccount({ id: 102, email: 'support.techconf.com' })
    ];
    renderHeader({ emailAccounts, activeEventId: 1 });
    expect(screen.getByRole('option', { name: 'inbox.techconf.com' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'support.techconf.com' })).toBeInTheDocument();
  });

  it('dispatches setActiveEvent when conference is changed', () => {
    const events = [mockEvent({ id: 1, name: 'Conf A' }), mockEvent({ id: 2, name: 'Conf B' })];
    const { store, spy } = renderHeaderWithSpy({ events });

    const conferenceSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(conferenceSelect, { target: { value: '2' } });

    expect(spy).toHaveBeenCalled();
    expect(store.getState().crm.activeEventId).toBe(2);
  });

  it('dispatches setActiveDomain and setActiveEmailAccountId when a specific account is chosen', () => {
    const emailAccounts = [mockEmailAccount({ id: 101, email: 'inbox.techconf.com' })];
    const { store, spy } = renderHeaderWithSpy({ emailAccounts, activeEventId: 1 });

    const accountSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(accountSelect, { target: { value: '101' } });

    expect(spy).toHaveBeenCalled();
    expect(store.getState().crm.activeDomain).toBe('inbox.techconf.com');
    expect(store.getState().crm.activeEmailAccountId).toBe(101);
  });

  it('dispatches setActiveDomain(null) and setActiveEmailAccountId(null) when "All Accounts" is selected', () => {
    const emailAccounts = [mockEmailAccount({ id: 101, email: 'inbox.techconf.com' })];
    const store = renderHeader({ emailAccounts, activeEventId: 1, activeEmailAccountId: 101, activeDomain: 'inbox.techconf.com' });

    const accountSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(accountSelect, { target: { value: 'all' } });

    expect(store.getState().crm.activeDomain).toBeNull();
    expect(store.getState().crm.activeEmailAccountId).toBeNull();
  });

  it('does NOT dispatch fetchThreadsThunk when Sync is clicked with no active event', () => {
    const fetchSpy = jest.spyOn(crmThunks, 'fetchThreadsThunk');
    renderHeader({ activeEventId: null });
    fireEvent.click(screen.getByTitle('Synchronize Emails'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('dispatches fetchThreadsThunk when Sync is clicked with an active event', () => {
    const { spy } = renderHeaderWithSpy({ activeEventId: 1, events: [mockEvent({ id: 1 })] });

    fireEvent.click(screen.getByTitle('Synchronize Emails'));

    expect(spy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates local search state as user types', () => {
    renderHeader();
    const searchInput = screen.getByPlaceholderText('Subject or Email ID') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'hello' } });
    expect(searchInput.value).toBe('hello');
  });

  it('dispatches triggerSearch automatically when search input is cleared', () => {
    const { spy } = renderHeaderWithSpy({ searchTerm: 'old' });
    const searchInput = screen.getByPlaceholderText('Subject or Email ID');
    
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should dispatch triggerSearch (plus the setSearchTerm update)
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerSearch' }));
  });

  it('dispatches triggerSearch when search button is clicked in regular tab', () => {
    const { spy } = renderHeaderWithSpy();
    fireEvent.click(screen.getByTitle('Search Email'));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerSearch' }));
  });

  it('dispatches triggerSearch when Enter is pressed in search input in regular tab', () => {
    const { spy } = renderHeaderWithSpy();
    const searchInput = screen.getByPlaceholderText('Subject or Email ID');
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerSearch' }));
  });

  describe('Accounts Tab Functionality', () => {
    it('dispatches setAccountsActiveEvent when conference is changed in Accounts tab', () => {
      const events = [mockEvent({ id: 1, name: 'Conf A' })];
      const { spy } = renderHeaderWithSpy({ events, activeFolder: 'Accounts' });

      const conferenceSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(conferenceSelect, { target: { value: '1' } });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/setAccountsActiveEvent', payload: 1 }));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/setAccountsActiveDomain', payload: null }));
    });

    it('dispatches triggerAccountsSearch when search button is clicked in Accounts tab', () => {
      const { spy } = renderHeaderWithSpy({ activeFolder: 'Accounts' });
      fireEvent.click(screen.getByTitle('Search Email'));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerAccountsSearch' }));
    });

    it('dispatches triggerAccountsSearch when Enter is pressed in search input in Accounts tab', () => {
      const { spy } = renderHeaderWithSpy({ activeFolder: 'Accounts' });
      const searchInput = screen.getByPlaceholderText('Subject or Email ID');
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerAccountsSearch' }));
    });

    it('dispatches setAccountsActiveDomain when account is changed in Accounts tab', () => {
      const emailAccounts = [mockEmailAccount({ id: 101, email: 'inbox.techconf.com' })];
      const { spy } = renderHeaderWithSpy({ emailAccounts, accountsActiveEventId: 1, activeFolder: 'Accounts' });
      const accountSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(accountSelect, { target: { value: '101' } });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/setAccountsActiveDomain', payload: 'inbox.techconf.com' }));
    });

    it('dispatches triggerAccountsSearch when search input is cleared in Accounts tab', () => {
      const { spy } = renderHeaderWithSpy({ accountsSearchTerm: 'old', activeFolder: 'Accounts' });
      const searchInput = screen.getByPlaceholderText('Subject or Email ID');
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/triggerAccountsSearch' }));
    });
  });

  describe('Sidebar Toggle', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    });

    it('dispatches toggleSidebar when button is clicked and screen is mobile (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      const { spy } = renderHeaderWithSpy();
      fireEvent.click(screen.getByLabelText('Toggle Sidebar'));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/toggleSidebar' }));
    });

    it('dispatches toggleSidebarCollapse when button is clicked and screen is desktop (>= 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      const { spy } = renderHeaderWithSpy();
      fireEvent.click(screen.getByLabelText('Toggle Sidebar'));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/toggleSidebarCollapse' }));
    });
  });
});
