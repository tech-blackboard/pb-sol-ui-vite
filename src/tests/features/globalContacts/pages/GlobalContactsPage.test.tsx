import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalContactsPage from '../../../../features/globalContacts/pages/GlobalContactsPage';
import * as contactBucketService from '../../../../services/contactBucket';
import * as sourcedbService from '../../../../services/sourcedb';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import crmReducer from '../../../../store/slices/crm/crm.slice';

jest.mock('../../../../services/contactBucket');
jest.mock('../../../../services/sourcedb');

const mockItems = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    website: { id: 101, name: 'Web A' },
    labels: [{ id: 1, name: 'Contact Inquiry', description: 'desc1' }],
    lastInteraction: '2025-01-01T00:00:00Z',
    notes: 'Some notes',
  },
];

const createMockStore = (preloadedState?: any) =>
  configureStore({
    reducer: { crm: crmReducer } as any,
    preloadedState,
  });

const renderComponent = (ui: React.ReactElement, store = createMockStore()) => {
  return render(<Provider store={store}>{ui}</Provider>);
};

describe('GlobalContactsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sourcedbService.listWebsites as jest.Mock).mockResolvedValue([{ id: 101, name: 'Web A' }]);
    (contactBucketService.getContactBucketLabels as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Label1', description: 'desc1' },
      { id: 2, name: 'Label2', description: 'desc2' }
    ]);
    (contactBucketService.searchContactBucket as jest.Mock).mockResolvedValue({
      items: mockItems,
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    });
  });

  it('renders page title and add button', async () => {
    renderComponent(<GlobalContactsPage />);
    expect(screen.getByText('Global Contacts')).toBeInTheDocument();
    expect(screen.getByText('Add Contact')).toBeInTheDocument();
  });

  it('loads and displays contacts in the table', async () => {
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Web A' })).toBeInTheDocument();
      expect(screen.getAllByText('Contact Inquiry').length).toBeGreaterThan(0);
      expect(screen.getByText('Some notes')).toBeInTheDocument();
    });
  });

  it('handles search input and search button click', async () => {
    renderComponent(<GlobalContactsPage />);
    const input = screen.getByPlaceholderText(/Name, email, phone/);
    fireEvent.change(input, { target: { value: 'search-query' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(expect.objectContaining({
        search: 'search-query'
      }));
    });

    // Test non-Enter key does not trigger search
    (contactBucketService.searchContactBucket as jest.Mock).mockClear();
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(contactBucketService.searchContactBucket).not.toHaveBeenCalled();
  });

  it('handles filters (Conference and Label)', async () => {
    renderComponent(<GlobalContactsPage />);
    
    await waitFor(() => expect(screen.getByRole('option', { name: 'Web A' })).toBeInTheDocument());
    // Conference filter
    const conferenceSelect = screen.getByLabelText('Conference');
    fireEvent.change(conferenceSelect, { target: { value: '101' } });
    await waitFor(() => {
      expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(expect.objectContaining({
        website_id: 101
      }));
    });

    // Label filter
    const labelSelect = screen.getByLabelText('Label');
    fireEvent.change(labelSelect, { target: { value: '2' } }); // Use ID
    await waitFor(() => {
      expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(expect.objectContaining({
        labelId: 2
      }));
    });
  });

  it('opens add modal on button click', async () => {
    renderComponent(<GlobalContactsPage />);
    fireEvent.click(screen.getByText('Add Contact'));
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('opens view modal on row action click', async () => {
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => screen.getByTitle('View Details'));
    fireEvent.click(screen.getByTitle('View Details'));
    expect(screen.getByText('Contact Details')).toBeInTheDocument();

    // Close view modal
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    
    // Open edit modal
    fireEvent.click(screen.getByTitle('Edit Contact'));
    expect(screen.getByText('Edit Contact')).toBeInTheDocument();
  });

  it('shows error message when fetching data fails', async () => {
    (contactBucketService.searchContactBucket as jest.Mock).mockRejectedValue(new Error('Fetch Fail'));
    renderComponent(<GlobalContactsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load contacts')).toBeInTheDocument();
    });
  });

  it('renders "No labels" when contact has no labels', async () => {
    (contactBucketService.searchContactBucket as jest.Mock).mockResolvedValueOnce({
      items: [{ ...mockItems[0], labels: [] }],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    });
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => {
      expect(screen.getByText('No labels')).toBeInTheDocument();
    });
  });

  it('renders correctly with default state', async () => {
    (contactBucketService.searchContactBucket as jest.Mock).mockResolvedValueOnce({
      items: mockItems,
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    });
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('filters and search interactions', () => {
    it('searches on Enter key press', async () => {
      renderComponent(<GlobalContactsPage />);
      const searchInput = screen.getByPlaceholderText(/Name, email, phone/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      await waitFor(() => expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test search' })
      ));
    });

    it('changes conference and label filters including clearing them', async () => {
      renderComponent(<GlobalContactsPage />);
      const confSelect = screen.getByLabelText('Conference');
      const labelSelect = screen.getByLabelText('Label');

      // Wait for API mock options to render
      await waitFor(() => expect(screen.getAllByText('Web A').length).toBeGreaterThan(0));
      await waitFor(() => expect(screen.getAllByText('Contact Inquiry').length).toBeGreaterThan(0));

      // Clear the first search call so we only track the new ones
      (contactBucketService.searchContactBucket as jest.Mock).mockClear();

      // Change to a specific value
      fireEvent.change(confSelect, { target: { value: '101' } });
      fireEvent.change(labelSelect, { target: { value: '1' } });

      await waitFor(() => expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(
        expect.objectContaining({ website_id: 101, labelId: 1 })
      ));

      // Clear them back to "All" (value '')
      fireEvent.change(confSelect, { target: { value: '' } });
      fireEvent.change(labelSelect, { target: { value: '' } });

      await waitFor(() => expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(
        expect.objectContaining({ website_id: undefined, labelId: undefined })
      ));
    });
  });

  describe('empty field fallbacks', () => {
    it('renders dashes for missing name, website, and lastInteraction', async () => {
      (contactBucketService.searchContactBucket as jest.Mock).mockResolvedValueOnce({
        items: [{
          ...mockItems[0],
          name: undefined,
          website: undefined,
          lastInteraction: undefined,
          phone: undefined,
          wphone: undefined,
          organization: undefined,
          country: undefined,
          notes: undefined
        }],
        total: 1, page: 1, limit: 25, totalPages: 1
      });
      renderComponent(<GlobalContactsPage />);
      // the table rows will have '—'
      const dashes = await screen.findAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('handles label refresh error silently', async () => {
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => screen.getByTitle('View Details'));
    
    fireEvent.click(screen.getByText('Add Contact'));
    await waitFor(() => expect(screen.getByText('Add New Contact')).toBeInTheDocument());

    // Mock getContactBucketLabels to reject for the refresh
    (contactBucketService.getContactBucketLabels as jest.Mock).mockRejectedValueOnce(new Error('Label Refresh Error'));
    // Mock createContactBucket to resolve so onSuccess is called
    (contactBucketService.createContactBucket as jest.Mock).mockResolvedValueOnce({ id: 2 });

    // Fill form
    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Conference*'), { target: { value: '101' } });
    
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(contactBucketService.createContactBucket).toHaveBeenCalled();
    });
    // The error should be caught silently, no crash
  });

  it('handles page size change', async () => {
    renderComponent(<GlobalContactsPage />);
    await waitFor(() => screen.getByText('john@example.com'));
    const sizeSelect = screen.getAllByRole('combobox').find(el => (el as HTMLSelectElement).value === '25');
    if (sizeSelect) {
        fireEvent.change(sizeSelect, { target: { value: '50' } });
    }
    await waitFor(() => {
        expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
    });
  });

  it('navigates to crm mailbox and triggers search on email click', async () => {
    const store = createMockStore({
      crm: {
        ...crmReducer(undefined, { type: '@@INIT' }),
        events: [{ id: 99, sourcedbId: 101, name: 'Event A', slug: 'event-a', replyDomain: 'test.com', domains: ['test.com'], replyEmails: ['info@test.com'], isActive: true, createdAt: '' }],
      }
    });
    
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    renderComponent(<GlobalContactsPage />, store);
    
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('john@example.com'));

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/setActiveEvent',
      payload: 99,
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/setActiveFolder',
      payload: 'Inbox',
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/setSearchTerm',
      payload: 'john@example.com',
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'crm/triggerSearch',
    }));
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    
    dispatchSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });
});
