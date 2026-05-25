import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore, combineReducers, type Reducer, type UnknownAction } from '@reduxjs/toolkit';
import crmReducer, { initialState, type CrmState } from '../../../../store/slices/crm/crm.slice';
import authReducer from '../../../../store/slices/authSlice';
import CrmSidebar from '../../../../features/crm/components/CrmSidebar';

import themeReducer from '../../../../store/slices/themeSlice';
import abstractsReducer from '../../../../store/slices/abstracts/abstracts.slice';
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice';
import sponsorshipsReducer from '../../../../store/slices/sponsorships/sponsorships.slice';
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice';
import accRegistrationsReducer from '../../../../store/slices/accRegistrations/accRegistrations.slice';
import contactsReducer from '../../../../store/slices/contacts/contacts.slice';
import type { RootState } from '../../../../store';

const makeStore = (overrides: Partial<CrmState> = {}) =>
  configureStore({
    reducer: combineReducers({
      crm: crmReducer,
      auth: authReducer,
      theme: themeReducer,
      abstracts: abstractsReducer,
      registrations: registrationsReducer,
      sponsorships: sponsorshipsReducer,
      brochures: brochuresReducer,
      accRegistrations: accRegistrationsReducer,
      contacts: contactsReducer,
    }) as Reducer<RootState, UnknownAction, Partial<RootState>>,
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
    } as Partial<RootState>,
  });

const renderWithProviders = (ui: React.ReactElement, storeOverrides: Partial<CrmState> = {}) => {
  const store = makeStore(storeOverrides);
  const spy = jest.spyOn(store, 'dispatch');
  const result = render(<Provider store={store}>{ui}</Provider>);
  return { store, spy, ...result };
};

describe('CrmSidebar', () => {
  it('renders the Compose Mail button', () => {
    renderWithProviders(<CrmSidebar />);
    expect(screen.getByText('Compose Mail')).toBeInTheDocument();
  });

  it('renders all folder buttons', () => {
    renderWithProviders(<CrmSidebar />);
    const folders = ['Inbox', 'Drafts', 'Sent', 'Starred', 'Junk', 'Trash', 'Accounts'];
    for (const name of folders) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('dispatches clearSelection and setActiveFolder when a folder is clicked', () => {
    const { spy } = renderWithProviders(<CrmSidebar />);
    fireEvent.click(screen.getByText('Drafts'));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/clearSelection' }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'crm/setActiveFolder', payload: 'Drafts' }));
  });

  it('renders unread count badge for Inbox', () => {
    renderWithProviders(<CrmSidebar />, { unreadCount: 5 });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders drafts count badge', () => {
    renderWithProviders(<CrmSidebar />, { draftsCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders sent count badge', () => {
    renderWithProviders(<CrmSidebar />, { sentCount: 10 });
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders starred count badge', () => {
    renderWithProviders(<CrmSidebar />, { starredCount: 2 });
    expect(screen.getByText('2')).toBeInTheDocument();
  });
 
  it('renders trash count badge', () => {
    renderWithProviders(<CrmSidebar />, { trashCount: 7 });
    expect(screen.getByText('7')).toBeInTheDocument();
  });
 
  it('renders accounts count badge', () => {
    renderWithProviders(<CrmSidebar />, { accountsCount: 4 });
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders junk count badge', () => {
    renderWithProviders(<CrmSidebar />, { junkCount: 8 });
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('applies correct styles to active Junk folder badge', () => {
    renderWithProviders(<CrmSidebar />, { junkCount: 8, activeFolder: 'Junk' });
    const badge = screen.getByText('8');
    expect(badge.className).toContain('bg-orange-100');
  });

  it('applies correct styles to active folder count badge', () => {
    renderWithProviders(<CrmSidebar />, { unreadCount: 5, activeFolder: 'Inbox' });
    const badge = screen.getByText('5');
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-700');
  });

  it('renders System section items', () => {
    renderWithProviders(<CrmSidebar />);
    expect(screen.getByText('Data Migration')).toBeInTheDocument();
    expect(screen.getByText('Black List')).toBeInTheDocument();
  });

  it('marks Inbox as the active folder', () => {
    renderWithProviders(<CrmSidebar />);
    const inboxButton = screen.getByText('Inbox').closest('button');
    expect(inboxButton?.className).toMatch(/bg-blue-50|text-blue-700/);
  });

  it('does not render Accounts folder for non-admin users', () => {
    const customStore = configureStore({
      reducer: combineReducers({
        crm: crmReducer, auth: authReducer, theme: themeReducer,
        abstracts: abstractsReducer, registrations: registrationsReducer,
        sponsorships: sponsorshipsReducer, brochures: brochuresReducer,
        accRegistrations: accRegistrationsReducer, contacts: contactsReducer
      }) as Reducer<RootState, UnknownAction, Partial<RootState>>,
      preloadedState: {
        crm: { ...initialState },
        auth: { user: { name: 'User', role: 'User', isAdmin: false }, token: 'fake', loading: false, error: null }
      } as Partial<RootState>
    });
    render(<Provider store={customStore}><CrmSidebar /></Provider>);
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument();
  });

  it('applies correct translation class when sidebar is closed', () => {
    const { container } = renderWithProviders(<CrmSidebar />, { isSidebarOpen: false });
    const sidebarDiv = container.firstChild as HTMLElement;
    expect(sidebarDiv.className).toContain('-translate-x-full');
  });

  it('renders inactive folder badges with correct colors', () => {
    renderWithProviders(<CrmSidebar />, {
      unreadCount: 5,
      draftsCount: 3,
      sentCount: 10,
      starredCount: 2,
      activeFolder: 'Trash' // Something else
    });

    expect(screen.getByText('5').className).toContain('text-blue-600');
    expect(screen.getByText('3').className).toContain('bg-gray-100');
    expect(screen.getByText('10').className).toContain('bg-gray-100');
    expect(screen.getByText('2').className).toContain('bg-yellow-100');
  });

  it('translates sidebar correctly when open', () => {
    const { container } = renderWithProviders(<CrmSidebar />, { isSidebarOpen: true });
    const sidebarDiv = container.firstChild as HTMLElement;
    expect(sidebarDiv.className).toContain('translate-x-0');
  });

  it('renders collapsed state indicator for unread Inbox', () => {
    const { container } = renderWithProviders(<CrmSidebar />, { 
      isSidebarCollapsed: true, 
      unreadCount: 5 
    });
    // The dot is an anonymous div with specific classes
    const unreadDot = container.querySelector('.bg-blue-600.rounded-full.absolute');
    expect(unreadDot).toBeInTheDocument();
  });

  it('applies correct styles to active Drafts folder badge', () => {
    renderWithProviders(<CrmSidebar />, { draftsCount: 3, activeFolder: 'Drafts' });
    const badge = screen.getByText('3');
    expect(badge.className).toContain('bg-blue-100');
  });
  
  it('applies correct styles to active Sent folder badge', () => {
    renderWithProviders(<CrmSidebar />, { sentCount: 10, activeFolder: 'Sent' });
    const badge = screen.getByText('10');
    expect(badge.className).toContain('bg-blue-100');
  });

  it('applies correct styles to active Starred folder badge', () => {
    renderWithProviders(<CrmSidebar />, { starredCount: 2, activeFolder: 'Starred' });
    const badge = screen.getByText('2');
    expect(badge.className).toContain('bg-blue-100');
  });

  it('applies correct styles to active Trash folder badge', () => {
    renderWithProviders(<CrmSidebar />, { trashCount: 7, activeFolder: 'Trash' });
    const badge = screen.getByText('7');
    expect(badge.className).toContain('bg-blue-100');
  });

  it('applies correct styles to active Accounts folder badge', () => {
    renderWithProviders(<CrmSidebar />, { accountsCount: 4, activeFolder: 'Accounts' });
    const badge = screen.getByText('4');
    expect(badge.className).toContain('bg-blue-100');
  });
});
