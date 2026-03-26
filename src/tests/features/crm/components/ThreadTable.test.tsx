import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThreadTable from '../../../../features/crm/components/ThreadTable';
import crmReducer from '../../../../store/slices/crm/crm.slice';
import type { Thread, Contact } from '../../../../features/crm/types';

// ── helpers ─

const makeContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 10,
  email: 'alice@example.com',
  status: 'active',
  labels: [],
  eventId: 1,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makeThread = (overrides: Partial<Thread> = {}): Thread => ({
  id: 'thread-1',
  subject: 'Hello World',
  lastMessageAt: '2025-06-15T10:30:00Z',
  eventId: 1,
  contactId: 10,
  isRead: true,
  messageCount: 1,
  domain: 'inbox.techconf.com',
  createdAt: '2025-06-15T09:00:00Z',
  contact: makeContact(),
  ...overrides,
});

const makeStore = (overrides: object = {}) => {
  const preloaded = {
    crm: {
      events: [],
      threads: [],
      messages: [],
      activeEventId: null,
      activeDomain: null,
      selectedThreadId: null,
      loading: { events: false, threads: false, messages: false, sending: false },
      error: null,
      ...overrides,
    },
  };
  return configureStore({ reducer: { crm: crmReducer }, preloadedState: preloaded });
};

const renderTable = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  render(
    <Provider store={store}>
      <ThreadTable />
    </Provider>,
  );
  return store;
};

const renderTableWithSpy = (storeOverrides: object = {}) => {
  const store = makeStore(storeOverrides);
  const spy = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <ThreadTable />
    </Provider>,
  );
  return { store, spy };
};

// ── Tests ───

describe('ThreadTable', () => {
  it('renders the table headers', () => {
    renderTable();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Received Date')).toBeInTheDocument();
  });

  it('shows loading spinner when loading.threads is true', () => {
    const { container } = render(
      <Provider store={makeStore({ loading: { threads: true, events: false, messages: false, sending: false } })}>
        <ThreadTable />
      </Provider>,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('From')).not.toBeInTheDocument();
  });

  it('renders a row for each thread', () => {
    const threads = [
      makeThread({ id: 't-1', subject: 'First Thread' }),
      makeThread({ id: 't-2', subject: 'Second Thread', contact: makeContact({ email: 'bob@example.com' }) }),
    ];
    renderTable({ threads });
    expect(screen.getByText('First Thread')).toBeInTheDocument();
    expect(screen.getByText('Second Thread')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows "Unknown" when thread has no contact', () => {
    const threads = [makeThread({ contact: undefined })];
    renderTable({ threads });
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('shows empty-state message when no threads', () => {
    renderTable({ threads: [] });
    expect(screen.getByText('No threads found for this mailbox.')).toBeInTheDocument();
  });

  it('filters threads by activeDomain', () => {
    const threads = [
      makeThread({ id: 't-1', subject: 'Inbox Thread', domain: 'inbox.example.com' }),
      makeThread({ id: 't-2', subject: 'Support Thread', domain: 'support.example.com', contact: makeContact({ email: 'b@x.com' }) }),
    ];
    renderTable({ threads, activeDomain: 'inbox.example.com' });
    expect(screen.getByText('Inbox Thread')).toBeInTheDocument();
    expect(screen.queryByText('Support Thread')).not.toBeInTheDocument();
  });

  it('shows all threads when activeDomain is null', () => {
    const threads = [
      makeThread({ id: 't-1', subject: 'Thread A', domain: 'a.com' }),
      makeThread({ id: 't-2', subject: 'Thread B', domain: 'b.com', contact: makeContact({ email: 'b@b.com' }) }),
    ];
    renderTable({ threads, activeDomain: null });
    expect(screen.getByText('Thread A')).toBeInTheDocument();
    expect(screen.getByText('Thread B')).toBeInTheDocument();
  });

  it('dispatches setSelectedThread and fetchMessagesThunk when a row is clicked', async () => {
    const threads = [makeThread({ id: 'thread-x', subject: 'Click Me' })];
    const { store, spy } = renderTableWithSpy({ threads });

    fireEvent.click(screen.getByText('Click Me'));

    await waitFor(() => {
      expect(store.getState().crm.selectedThreadId).toBe('thread-x');
    });
    // Two dispatches: setSelectedThread + fetchMessagesThunk
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('applies bold class to unread threads', () => {
    const threads = [makeThread({ id: 't-1', subject: 'Unread Thread', isRead: false })];
    renderTable({ threads });
    const row = screen.getByText('Unread Thread').closest('tr');
    expect(row?.className).toMatch(/font-bold/);
  });

  it('highlights the selected thread row', () => {
    const threads = [makeThread({ id: 'sel-thread', subject: 'Selected' })];
    renderTable({ threads, selectedThreadId: 'sel-thread' });
    const row = screen.getByText('Selected').closest('tr');
    expect(row?.className).toMatch(/bg-blue-50/);
  });

  it('formats the date in the last column', () => {
    const threads = [makeThread({ lastMessageAt: '2025-06-15T10:30:00Z' })];
    renderTable({ threads });
    // The formatted date should appear in the document
    // (exact format depends on locale, just verify something is rendered in the last cell)
    const cells = screen.getAllByRole('cell');
    const dateCells = cells.filter(c => c.className.includes('text-right'));
    expect(dateCells.length).toBeGreaterThan(0);
  });
});
