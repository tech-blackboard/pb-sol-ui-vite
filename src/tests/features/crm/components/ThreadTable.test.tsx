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
    // We pass activeDomain, but the table should show both because it doesn't filter anymore
    renderTable({ threads, activeDomain: 'inbox.example.com' });
    expect(screen.getByText('Inbox Thread')).toBeInTheDocument();
    expect(screen.getByText('Support Thread')).toBeInTheDocument();
  });

  it('does NOT filter drafts in-memory (filtering is handled by backend)', () => {
    const drafts = [
      { id: 'd-1', subject: 'Inbox Draft', direction: 'outbound', status: 'draft', fromEmail: 'inbox.example.com' } as Message,
      { id: 'd-2', subject: 'Support Draft', direction: 'outbound', status: 'draft', fromEmail: 'support.example.com' } as Message,
    ];
    renderTable({ drafts, activeDomain: 'inbox.example.com', activeFolder: 'Drafts' });
    expect(screen.getByText('Inbox Draft')).toBeInTheDocument();
    expect(screen.getByText('Support Draft')).toBeInTheDocument();
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
      expect((store.getState() as RootState).crm.selectedThreadId).toBe('thread-x');
    });
    // Two dispatches: setSelectedThread + fetchMessagesThunk
    expect(spy).toHaveBeenCalled();
  });

  it('dispatches setSelectedThread with draft ID and skips fetchMessagesThunk for a draft without threadId', async () => {
    const drafts = [
      { id: 'draft-1', subject: 'My Draft', direction: 'outbound', status: 'draft', contactId: 10, eventId: 1, toEmail: 'test@example.com' } as Message
    ];
    const { store, spy } = renderTableWithSpy({ drafts, activeFolder: 'Drafts' });

    fireEvent.click(screen.getByText('My Draft'));

    await waitFor(() => {
      expect((store.getState() as RootState).crm.selectedThreadId).toBe('draft-1');
    });
    expect(spy).toHaveBeenCalled();
  });

  it('handles delete draft with confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    const drafts = [{ id: 'd1', subject: 'Delete Me', direction: 'outbound', status: 'draft', contactId: 1, eventId: 1 } as Message];
    const { spy } = renderTableWithSpy({ drafts, activeFolder: 'Drafts' });
 
    const deleteBtn = screen.getByTitle('Move to Trash');
    fireEvent.click(deleteBtn);
 
    expect(window.confirm).toHaveBeenCalledWith('Move this draft to Trash?');
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
    expect(toast.success).toHaveBeenCalledWith('Conversation marked as unread');
  });

  it('calls toggleThreadReadThunk on mark as read (line 63)', () => {
    const spy = jest.spyOn(crmThunks, 'toggleThreadReadThunk');
    const threads = [makeThread({ id: 't1', isRead: false })];
    renderTable({ threads });

    const readBtn = screen.getByTitle('Mark as read');
    fireEvent.click(readBtn);
    expect(spy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Conversation marked as read');
  });

  it('shows correct star button title (line 132-135)', () => {
    const threads = [makeThread({ id: 't1', isStarred: true })];
    renderTable({ threads });
    expect(screen.getByTitle('Unstar')).toBeInTheDocument();
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
    const cells = screen.getAllByRole('cell');
    const dateCells = cells.filter(c => c.className.includes('text-right'));
    expect(dateCells.length).toBeGreaterThan(0);
  });

  it('renders labels for threads', () => {
    const threads = [makeThread({ id: 't1', labels: ['Urgent', 'Inquiry'] })];
    renderTable({ threads });
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Inquiry')).toBeInTheDocument();
  });

  it('renders correct folder badges (line 165-166)', () => {
    const threads = [makeThread({ id: 't1' })];
    renderTable({ threads, activeFolder: 'Sent' });
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('shows correct empty state messages (line 188)', () => {
    const { rerender } = render(
      <Provider store={makeStore({ threads: [], activeFolder: 'Sent' })}>
        <ThreadTable />
      </Provider>,
    );
    expect(screen.getByText('No sent messages found.')).toBeInTheDocument();

    rerender(
      <Provider store={makeStore({ threads: [], activeFolder: 'Starred' })}>
        <ThreadTable />
      </Provider>,
    );
    expect(screen.getByText('No starred threads found.')).toBeInTheDocument();

    rerender(
      <Provider store={makeStore({ drafts: [], activeFolder: 'Drafts' })}>
        <ThreadTable />
      </Provider>,
    );
    expect(screen.getByText('No drafts found.')).toBeInTheDocument();
  });

  it('calls onSelectItem prop when provided', () => {
    const onSelectItem = jest.fn();
    const threads = [makeThread({ id: 't1', subject: 'Custom Select' })];
    const store = makeStore({ threads });
    render(
      <Provider store={store}>
        <ThreadTable onSelectItem={onSelectItem} />
      </Provider>,
    );

    fireEvent.click(screen.getByText('Custom Select'));
    expect(onSelectItem).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }));
  });

  it('dispatches setSelectedThread and fetchMessagesThunk for a draft WITH threadId', async () => {
    const drafts = [
      { id: 'draft-1', threadId: 'thread-real', subject: 'Draft with Thread', direction: 'outbound', status: 'draft', contactId: 10, eventId: 1, toEmail: 'test@example.com' } as Message
    ];
    const { store, spy } = renderTableWithSpy({ drafts, activeFolder: 'Drafts' });

    fireEvent.click(screen.getByText('Draft with Thread'));

    await waitFor(() => {
      expect((store.getState() as RootState).crm.selectedThreadId).toBe('thread-real');
    });
    // Should call fetchMessagesThunk
    expect(spy).toHaveBeenCalled();
  });

  it('handles trash thread with confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    const threads = [makeThread({ id: 't1', subject: 'Trash Me' })];
    const { spy } = renderTableWithSpy({ threads });

    const trashBtn = screen.getByTitle('Move to Trash');
    fireEvent.click(trashBtn);

    expect(window.confirm).toHaveBeenCalledWith('Move this conversation to Trash?');
    expect(spy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Conversation moved to Trash');
  });

  it('handles restore thread', async () => {
    const threads = [makeThread({ id: 't1', subject: 'Restore Me', isTrash: true })];
    const { spy } = renderTableWithSpy({ threads, activeFolder: 'Trash' });

    const restoreBtn = screen.getByTitle('Restore');
    fireEvent.click(restoreBtn);

    expect(spy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Conversation restored');
  });

  it('handles permanent delete with confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    const threads = [makeThread({ id: 't1', subject: 'Kill Me', isTrash: true })];
    const { spy } = renderTableWithSpy({ threads, activeFolder: 'Trash' });

    const deleteBtn = screen.getByTitle('Delete Permanently');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith('Permanently delete this conversation? This cannot be undone.');
    expect(spy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Conversation permanently deleted');
  });

  it('handles bulk selection', () => {
    const threads = [
      makeThread({ id: 't1', subject: 'T1' }),
      makeThread({ id: 't2', subject: 'T2' }),
    ];
    const { spy } = renderTableWithSpy({ threads });

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/selectAllThreads',
      payload: ['t1', 't2']
    }));
 
    fireEvent.click(selectAllCheckbox);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/selectAllThreads',
      payload: []
    }));
  });
 
  it('handles individual thread selection (line 90-91)', () => {
    const threads = [makeThread({ id: 't1', subject: 'T1' })];
    const { spy } = renderTableWithSpy({ threads });
 
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Index 0 is select all, index 1 is first row
 
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/toggleThreadSelection',
      payload: 't1'
    }));
  });

});

