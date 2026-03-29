import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CrmHeader from '../../../../features/crm/components/CrmHeader';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';
import type { CrmEvent } from '../../../../features/crm/types';

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

const makeStore = (overrides: object = {}) => {
  const preloaded = {
    crm: {
      ...initialState,
      ...overrides,
    },
  };
  return configureStore({ reducer: { crm: crmReducer }, preloadedState: preloaded });
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
    expect(screen.getByText('Synchronize Emails')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Subject or Email ID')).toBeInTheDocument();
    expect(screen.getByText('Search Email')).toBeInTheDocument();
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

  it('populates domain dropdown from active event domains', () => {
    const events = [mockEvent({ id: 1 })];
    renderHeader({ events, activeEventId: 1 });
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

  it('dispatches setActiveDomain when a specific domain is chosen', () => {
    const events = [mockEvent({ id: 1 })];
    const { store, spy } = renderHeaderWithSpy({ events, activeEventId: 1 });

    const domainSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(domainSelect, { target: { value: 'inbox.techconf.com' } });

    expect(spy).toHaveBeenCalled();
    expect(store.getState().crm.activeDomain).toBe('inbox.techconf.com');
  });

  it('dispatches setActiveDomain(null) when "All Accounts" is selected', () => {
    const events = [mockEvent({ id: 1 })];
    const store = renderHeader({ events, activeEventId: 1, activeDomain: 'inbox.techconf.com' });

    const domainSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(domainSelect, { target: { value: 'all' } });

    expect(store.getState().crm.activeDomain).toBeNull();
  });

  it('does NOT dispatch fetchThreadsThunk when Sync is clicked with no active event', () => {
    const fetchSpy = jest.spyOn(crmThunks, 'fetchThreadsThunk');
    renderHeader({ activeEventId: null });
    fireEvent.click(screen.getByText('Synchronize Emails'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('dispatches fetchThreadsThunk when Sync is clicked with an active event', () => {
    const { spy } = renderHeaderWithSpy({ activeEventId: 1, events: [mockEvent({ id: 1 })] });

    fireEvent.click(screen.getByText('Synchronize Emails'));

    expect(spy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates local search state as user types', () => {
    renderHeader();
    const searchInput = screen.getByPlaceholderText('Subject or Email ID') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'hello' } });
    expect(searchInput.value).toBe('hello');
  });
});
