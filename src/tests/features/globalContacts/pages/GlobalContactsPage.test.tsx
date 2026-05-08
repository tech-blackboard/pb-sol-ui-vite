import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalContactsPage from '../../../../features/globalContacts/pages/GlobalContactsPage';
import * as contactBucketService from '../../../../services/contactBucket';
import * as sourcedbService from '../../../../services/sourcedb';

jest.mock('../../../../services/contactBucket');
jest.mock('../../../../services/sourcedb');

const mockItems = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    website: { id: 101, name: 'Web A' },
    labels: [{ id: 1, name: 'Label1', description: 'desc1' }],
    lastInteraction: '2025-01-01T00:00:00Z',
  },
];

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
    render(<GlobalContactsPage />);
    expect(screen.getByText('Global Contacts')).toBeInTheDocument();
    expect(screen.getByText('Add Contact')).toBeInTheDocument();
  });

  it('loads and displays contacts in the table', async () => {
    render(<GlobalContactsPage />);
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Web A' })).toBeInTheDocument();
      expect(screen.getAllByText('Label1').length).toBeGreaterThan(0);
    });
  });

  it('handles search input and search button click', async () => {
    render(<GlobalContactsPage />);
    const input = screen.getByPlaceholderText(/Name, email, phone/);
    fireEvent.change(input, { target: { value: 'search-query' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(contactBucketService.searchContactBucket).toHaveBeenCalledWith(expect.objectContaining({
        search: 'search-query'
      }));
    });
  });

  it('handles filters (Conference and Label)', async () => {
    render(<GlobalContactsPage />);
    
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
    render(<GlobalContactsPage />);
    fireEvent.click(screen.getByText('Add Contact'));
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('opens view modal on row action click', async () => {
    render(<GlobalContactsPage />);
    await waitFor(() => screen.getByTitle('View Details'));
    fireEvent.click(screen.getByTitle('View Details'));
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
  });

  it('shows error message when fetching data fails', async () => {
    (contactBucketService.searchContactBucket as jest.Mock).mockRejectedValue(new Error('Fetch Fail'));
    render(<GlobalContactsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load contacts')).toBeInTheDocument();
    });
  });
});
