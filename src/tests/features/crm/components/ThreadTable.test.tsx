import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThreadTable from '../../../../features/crm/components/ThreadTable';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import type { Thread, Contact, Message } from '../../../../features/crm/types';
import type { RootState } from '../../../../store';
import toast from 'react-hot-toast';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';

jest.mock('../../../../store/slices/crm/crm.thunks', () => {
  const actual = jest.requireActual('../../../../store/slices/crm/crm.thunks');
  return {
    ...actual,
    deleteDraftThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.deleteDraftThunk),
    toggleThreadStarThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.toggleThreadStarThunk),
    toggleThreadReadThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.toggleThreadReadThunk),
    trashThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.trashThreadsThunk),
    restoreThreadsThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.restoreThreadsThunk),
    deleteThreadsPermanentlyThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve() })), actual.deleteThreadsPermanentlyThunk),
    fetchMessagesThunk: Object.assign(jest.fn(() => () => ({ unwrap: () => Promise.resolve([]) })), actual.fetchMessagesThunk),
  };
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

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
  isStarred: false,
  isTrash: false,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table headers', () => {
    renderTable();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Received Date')).toBeInTheDocument();
  });

  it('shows loading spinner when loading.threads is true', () => {
    const { container } = render(
      <Provider store={makeStore({ loading: { threads: true, events: false, messages: false, drafts: false, sending: false, savingDraft: false } })}>
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

  it('does NOT filter threads in-memory (filtering is handled by backend)', () => {
    const threads = [
      makeThread({ id: 't-1', subject: 'Inbox Thread', domain: 'inbox.example.com' }),
      makeThread({ id: 't-2', subject: 'Support Thread', domain: 'support.example.com', contact: makeContact({ email: 'b@x.com' }) }),
    ];
    renderTable({ threads, activeDomain: 'inbox.example.com' });
    expect(screen.getByText('Inbox Thread')).toBeInTheDocument();
    expect(screen.getByText('Support Thread')).toBeInTheDocument();
  });

  it('dispatches setSelectedThread and fetchMessagesThunk when a row is clicked', async () => {
    const threads = [makeThread({ id: 'thread-x', subject: 'Click Me' })];
    const { store, spy } = renderTableWithSpy({ threads });

    fireEvent.click(screen.getByText('Click Me'));

    await waitFor(() => {
      expect((store.getState() as RootState).crm.selectedThreadId).toBe('thread-x');
    });
    expect(spy).toHaveBeenCalled();
  });

  it('handles toggle star and read status', async () => {
    const threads = [makeThread({ id: 't1', isStarred: false, isRead: true })];
    const { spy } = renderTableWithSpy({ threads });

    const starBtn = screen.getByTitle('Star');
    fireEvent.click(starBtn);
    expect(spy).toHaveBeenCalled();

    const readBtn = screen.getByTitle('Mark as unread');
    fireEvent.click(readBtn);
    expect(spy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conversation marked as unread');
    });
  });

  it('calls toggleThreadReadThunk on mark as read', async () => {
    const threads = [makeThread({ id: 't1', isRead: false })];
    renderTable({ threads });

    const readBtn = screen.getByTitle('Mark as read');
    fireEvent.click(readBtn);
    expect(crmThunks.toggleThreadReadThunk).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conversation marked as read');
    });
  });

  it('handles trash thread with confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    const threads = [makeThread({ id: 't1', subject: 'Trash Me' })];
    const { spy } = renderTableWithSpy({ threads });

    const trashBtn = screen.getByTitle('Move to Trash');
    fireEvent.click(trashBtn);

    expect(window.confirm).toHaveBeenCalledWith('Move this conversation to Trash?');
    expect(spy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conversation moved to Trash');
    });
  });

  it('handles restore thread', async () => {
    const threads = [makeThread({ id: 't1', subject: 'Restore Me', isTrash: true })];
    const { spy } = renderTableWithSpy({ threads, activeFolder: 'Trash' });

    const restoreBtn = screen.getByTitle('Restore');
    fireEvent.click(restoreBtn);

    expect(spy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conversation restored');
    });
  });

  it('handles permanent delete with confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    const threads = [makeThread({ id: 't1', subject: 'Kill Me', isTrash: true })];
    const { spy } = renderTableWithSpy({ threads, activeFolder: 'Trash' });

    const deleteBtn = screen.getByTitle('Delete Permanently');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith('Permanently delete this conversation? This cannot be undone.');
    expect(spy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conversation permanently deleted');
    });
  });

  // ── Coverage Tests (Error cases) ──

  it('handles delete draft error (coverage line 45-47)', async () => {
    const drafts = [{ id: 'd1', subject: 'Delete Me', direction: 'outbound', status: 'draft', contactId: 1, eventId: 1 } as Message];
    (crmThunks.deleteDraftThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Delete Error') }));
    renderTable({ drafts, activeFolder: 'Drafts' });
    window.confirm = jest.fn().mockReturnValue(true);
    fireEvent.click(screen.getByTitle('Move to Trash'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete Error'));
  });

  it('handles toggle read error (coverage line 62-63)', async () => {
    const threads = [makeThread({ id: 't1', isRead: true })];
    (crmThunks.toggleThreadReadThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Read Status Error') }));
    renderTable({ threads });
    fireEvent.click(screen.getByTitle('Mark as unread'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Read Status Error'));
  });

  it('handles trash thread error (coverage line 71-74)', async () => {
    const threads = [makeThread({ id: 't1', subject: 'Trash Me' })];
    (crmThunks.trashThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Trash Error') }));
    renderTable({ threads });
    window.confirm = jest.fn().mockReturnValue(true);
    fireEvent.click(screen.getByTitle('Move to Trash'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Trash Error'));
  });

  it('handles restore thread error (coverage line 82-85)', async () => {
    const threads = [makeThread({ id: 't1', subject: 'Restore Me', isTrash: true })];
    (crmThunks.restoreThreadsThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Restore Error') }));
    renderTable({ threads, activeFolder: 'Trash' });
    fireEvent.click(screen.getByTitle('Restore'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Restore Error'));
  });

  it('handles permanent delete error (coverage line 93-96)', async () => {
    const threads = [makeThread({ id: 't1', subject: 'Kill Me', isTrash: true })];
    (crmThunks.deleteThreadsPermanentlyThunk as unknown as jest.Mock).mockReturnValueOnce(() => ({ unwrap: () => Promise.reject('Delete Perm Error') }));
    renderTable({ threads, activeFolder: 'Trash' });
    window.confirm = jest.fn().mockReturnValue(true);
    fireEvent.click(screen.getByTitle('Delete Permanently'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete Perm Error'));
  });

  it('calls onSelectItem prop when a row is clicked', () => {
    const onSelectItem = jest.fn();
    const threads = [makeThread({ subject: 'Prop Test' })];
    const store = makeStore({ threads });
    render(
      <Provider store={store}>
        <ThreadTable onSelectItem={onSelectItem} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Prop Test'));
    expect(onSelectItem).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Prop Test' }));
  });

  it('handles selecting a draft with and without threadId', () => {
    const drafts = [
      { id: 'd-1', subject: 'Draft with Thread', threadId: 't-1', direction: 'outbound', status: 'draft', contactId: 1, eventId: 1 } as unknown as Message,
      { id: 'd-2', subject: 'Draft without Thread', threadId: null, direction: 'outbound', status: 'draft', contactId: 1, eventId: 1 } as unknown as Message,
    ];
    const { store } = renderTableWithSpy({ drafts, activeFolder: 'Drafts' });

    // Click draft with thread
    fireEvent.click(screen.getByText('Draft with Thread'));
    expect((store.getState() as RootState).crm.selectedThreadId).toBe('t-1');

    // Click draft without thread
    fireEvent.click(screen.getByText('Draft without Thread'));
    expect((store.getState() as RootState).crm.selectedThreadId).toBe('d-2');
  });

  it('handles bulk selection and individual selection', () => {
    const threads = [
      makeThread({ id: 't1', subject: 'Thread 1' }),
      makeThread({ id: 't2', subject: 'Thread 2' }),
    ];
    const { store } = renderTableWithSpy({ threads });

    // Individual selection
    const checkboxes = screen.getAllByRole('checkbox');
    // checkbox[0] is select all, [1] is t1, [2] is t2
    fireEvent.click(checkboxes[1].parentElement!); // Click the TD to trigger the handler
    expect((store.getState() as RootState).crm.selectedThreadIds).toContain('t1');

    // Bulk selection
    fireEvent.click(checkboxes[0]);
    expect((store.getState() as RootState).crm.selectedThreadIds).toEqual(['t1', 't2']);

    // Bulk unselection
    fireEvent.click(checkboxes[0]);
    expect((store.getState() as RootState).crm.selectedThreadIds).toEqual([]);
  });

  it('renders labels with correct colors', () => {
    const threads = [
      makeThread({ subject: 'Labeled', labels: ['Urgent', 'Support'] })
    ];
    renderTable({ threads });
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });
});
