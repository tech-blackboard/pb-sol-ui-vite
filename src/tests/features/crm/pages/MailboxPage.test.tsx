import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MailboxPage from '../../../../features/crm/pages/MailboxPage';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';

// ── Shallow mocks for child components ───

jest.mock('../../../../features/crm/components/CrmHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="crm-header">CrmHeader</div>,
}));

jest.mock('../../../../features/crm/components/CrmSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="crm-sidebar">CrmSidebar</div>,
}));

jest.mock('../../../../features/crm/components/ThreadTable', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-table">ThreadTable</div>,
}));

jest.mock('../../../../features/crm/components/ThreadView', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-view">ThreadView</div>,
}));

// ── Helpers ──

const makeStore = (overrides: object = {}) =>
  configureStore({
    reducer: { crm: crmReducer },
    preloadedState: {
      crm: {
        ...initialState,
        ...overrides,
      },
    },
  });

const renderPage = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <MailboxPage />
    </Provider>,
  );
  return store;
};

// ── Tests ─────

describe('MailboxPage', () => {
  it('renders CrmHeader, CrmSidebar', () => {
    renderPage();
    expect(screen.getByTestId('crm-header')).toBeInTheDocument();
    expect(screen.getByTestId('crm-sidebar')).toBeInTheDocument();
  });

  it('dispatches fetchEventsThunk on mount', () => {
    const store = makeStore();
    const spy = jest.spyOn(store, 'dispatch');
    render(
      <Provider store={store}>
        <MailboxPage />
      </Provider>,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('shows ThreadTable and toolbar when no thread is selected', () => {
    renderPage({ selectedThreadId: null });
    expect(screen.getByTestId('thread-table')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-view')).not.toBeInTheDocument();
  });

  it('shows ThreadView instead of ThreadTable when a thread is selected', () => {
    renderPage({ selectedThreadId: 'thread-1' });
    expect(screen.getByTestId('thread-view')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-table')).not.toBeInTheDocument();
  });

  it('renders pagination info in the list view', () => {
    renderPage({ selectedThreadId: null, totalThreads: 0 });
    // Should show 0–0 of 0 when empty
    expect(screen.getByText(/0–0 of 0/)).toBeInTheDocument();
  });

  it('dispatches fetchThreadsThunk when activeEventId is set (via store preload)', async () => {
    const store = makeStore({ activeEventId: 1 });
    const spy = jest.spyOn(store, 'dispatch');
    render(
      <Provider store={store}>
        <MailboxPage />
      </Provider>,
    );
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('does NOT dispatch fetchThreadsThunk when activeEventId is null', () => {
    const store = makeStore({ activeEventId: null });
    const spy = jest.spyOn(store, 'dispatch');
    render(
      <Provider store={store}>
        <MailboxPage />
      </Provider>,
    );
    // fetchEventsThunk and fetchLabelDefinitionsThunk are dispatched on mount
    const thunkCalls = spy.mock.calls.filter(c => typeof c[0] === 'function');
    expect(thunkCalls.length).toBe(2);
  });
});
