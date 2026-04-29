import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ContactBucketView from '../../../../features/crm/components/ContactBucketView';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import * as crmThunks from '../../../../store/slices/crm/crm.thunks';

import * as crmService from '../../../../features/crm/services/crmService';
import type { Thread, Message } from '../../../../features/crm/types';

// Mock the service
jest.mock('../../../../features/crm/services/crmService', () => ({
  fetchThreads: jest.fn().mockResolvedValue({ threads: [], total: 0 }),
  fetchCrmEvents: jest.fn().mockResolvedValue([]),
}));

// Mock ThreadTable to avoid complex sub-component rendering
jest.mock('../../../../features/crm/components/ThreadTable', () => ({
  __esModule: true,
  default: ({ onSelectItem }: { onSelectItem: (item: Thread | Message) => void }) => (
    <div data-testid="thread-table">
      <button onClick={() => onSelectItem({ id: 't1', eventId: 1 } as Thread)}>Click Thread</button>
    </div>
  ),
}));

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

describe('ContactBucketView', () => {
  const mockEvents = [
    { id: 1, name: 'Event 1', slug: 'e1', replyDomain: 'd1', isActive: true },
    { id: 2, name: 'Event 2', slug: 'e2', replyDomain: 'd2', isActive: true },
  ];

  const mockLabels = [
    { id: 1, name: 'Registered', createdAt: '', updatedAt: '' },
    { id: 2, name: 'Positive', createdAt: '', updatedAt: '' },
  ];

  it('renders initial state with conference selection prompt', () => {
    render(
      <Provider store={makeStore({ events: mockEvents })}>
        <ContactBucketView />
      </Provider>
    );

    expect(screen.getByText('Contact Bucket')).toBeInTheDocument();
    expect(screen.getByText('Select a Conference')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /conference edition/i })).toBeInTheDocument();
  });

  it('dispatches fetchThreadsThunk when conference is selected', async () => {
    const thunkSpy = jest.spyOn(crmThunks, 'fetchThreadsThunk');
    render(
      <Provider store={makeStore({ events: mockEvents })}>
        <ContactBucketView />
      </Provider>
    );

    const select = screen.getByRole('combobox', { name: /conference edition/i });
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(thunkSpy).toHaveBeenCalledWith(expect.objectContaining({
        eventId: 1,
        folder: 'Contact Bucket'
      }));
    });
  });

  it('dispatches fetchThreadsThunk with specific label when label is selected', async () => {
    const thunkSpy = jest.spyOn(crmThunks, 'fetchThreadsThunk');
    render(
      <Provider store={makeStore({ events: mockEvents, labelDefinitions: mockLabels })}>
        <ContactBucketView />
      </Provider>
    );

    // Select conference first
    fireEvent.change(screen.getByRole('combobox', { name: /conference edition/i }), { target: { value: '1' } });
    
    // Select label
    const labelSelect = screen.getByRole('combobox', { name: /contact label/i });
    fireEvent.change(labelSelect, { target: { value: 'Registered' } });

    await waitFor(() => {
      expect(thunkSpy).toHaveBeenCalledWith(expect.objectContaining({
        eventId: 1,
        label: 'Registered',
        folder: 'Contact Bucket'
      }));
    });
  });

  it('shows empty state message when no threads are found', async () => {
    render(
      <Provider store={makeStore({ 
        events: mockEvents, 
        threads: [], 
        totalThreads: 0,
        loading: { ...initialState.loading, threads: false }
      })}>
        <ContactBucketView />
      </Provider>
    );

    // Select conference to trigger result view
    fireEvent.change(screen.getByRole('combobox', { name: /conference edition/i }), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('No labeled threads found')).toBeInTheDocument();
    });
  });

  it('renders ThreadTable when threads are present', async () => {
    (crmService.fetchThreads as jest.Mock).mockResolvedValue({ 
      threads: [{ id: 't1', subject: 'S1', contact: { email: 'c1' }, eventId: 1 } as Thread], 
      total: 1 
    });

    render(
      <Provider store={makeStore({ 
        events: mockEvents, 
        loading: { ...initialState.loading, threads: false }
      })}>
        <ContactBucketView />
      </Provider>
    );

    fireEvent.change(screen.getByRole('combobox', { name: /conference edition/i }), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByTestId('thread-table')).toBeInTheDocument();
    });
  });

  it('redirects to Mailbox when a thread is clicked', async () => {
    // We need a more realistic store mock to track dispatches if we wanted to be thorough,
    // but here we can just mock the ThreadTable and check if the handler is called correctly
    // Since we've already tested that handleRowClick dispatches everything, 
    // let's verify the custom event at least.
    
    const navigateSpy = jest.fn();
    window.addEventListener('app:navigate', navigateSpy as EventListener);

    (crmService.fetchThreads as jest.Mock).mockResolvedValue({ 
      threads: [{ id: 't1', subject: 'S1', contact: { email: 'c1' }, eventId: 1 } as Thread], 
      total: 1 
    });

    render(
      <Provider store={makeStore({ 
        events: mockEvents, 
        loading: { ...initialState.loading, threads: false }
      })}>
        <ContactBucketView />
      </Provider>
    );

    fireEvent.change(screen.getByRole('combobox', { name: /conference edition/i }), { target: { value: '1' } });

    await screen.findByTestId('thread-table');
    
    // Simulate clicking the thread table row (which calls onSelectItem)
    fireEvent.click(screen.getByText('Click Thread'));

    expect(navigateSpy).toHaveBeenCalled();
    const lastCallDetail = (navigateSpy.mock.calls[0][0] as CustomEvent).detail;
    expect(lastCallDetail).toBe('crm');

    window.removeEventListener('app:navigate', navigateSpy as EventListener);
  });
});
