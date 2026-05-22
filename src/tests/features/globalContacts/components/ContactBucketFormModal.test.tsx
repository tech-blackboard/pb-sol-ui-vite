import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactBucketFormModal from '../../../../features/globalContacts/components/ContactBucketFormModal';
import * as contactBucketService from '../../../../services/contactBucket';
import * as sourcedbService from '../../../../services/sourcedb';
import toast from 'react-hot-toast';

jest.mock('../../../../services/contactBucket');
jest.mock('../../../../services/sourcedb');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const mockItem = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  organization: 'Test Org',
  phone: '1234567890',
  wphone: '0987654321',
  country: 'USA',
  website: { id: 101, name: 'Test Website' },
  notes: 'Some notes',
  labels: [{ id: 1, name: 'test-label', description: 'desc' }],
  createdAt: '2025-01-01T00:00:00Z',
  lastInteraction: '2025-01-01T00:00:00Z',
};

describe('ContactBucketFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sourcedbService.listWebsites as jest.Mock).mockResolvedValue([{ id: 101, name: 'Test Website' }]);
    // Mock scrollTo
    Element.prototype.scrollTo = jest.fn();
  });

  it('renders in view mode with item details', async () => {
    render(<ContactBucketFormModal mode="view" item={mockItem} onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeDisabled();
    expect(screen.getByDisplayValue('John Doe')).toBeDisabled();
    expect(screen.getByText('test-label')).toBeInTheDocument();
    expect(screen.getByText('Last Interaction')).toBeInTheDocument();
  });

  it('renders in add mode with empty fields', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Email*')).toHaveValue('');
    expect(screen.getByLabelText('Full Name*')).toHaveValue('');
  });

  it('shows validation errors for required fields on submit', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Full Name is required')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Please fill all required fields');
    });
  });

  it('handles field changes and clears errors', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    // Fill other required fields first to isolate email validation
    fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText('Organization*'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone*'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Country*'), { target: { value: 'India' } });
    fireEvent.change(screen.getByLabelText('Conference*'), { target: { value: '101' } });

    const emailInput = screen.getByLabelText('Email*');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => expect(screen.getByText('Invalid email format')).toBeInTheDocument());
    
    fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
    await waitFor(() => expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument());
  });

  it('successfully creates a contact', async () => {
    (contactBucketService.createContactBucket as jest.Mock).mockResolvedValue({ id: 2 });
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    
    render(<ContactBucketFormModal mode="add" onClose={onClose} onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Organization*'), { target: { value: 'New Org' } });
    fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '1112223333' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone*'), { target: { value: '4445556666' } });
    fireEvent.change(screen.getByLabelText('Country*'), { target: { value: 'India' } });
    fireEvent.change(screen.getByLabelText('Conference*'), { target: { value: '101' } });
    
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(contactBucketService.createContactBucket).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@test.com',
        name: 'New User',
        website_id: 101,
      }));
      expect(toast.success).toHaveBeenCalledWith('Contact created successfully');
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('successfully updates a contact', async () => {
    (contactBucketService.updateContactBucket as jest.Mock).mockResolvedValue({ id: 1 });
    render(<ContactBucketFormModal mode="edit" item={mockItem} onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByText('Update'));
    
    await waitFor(() => {
      expect(contactBucketService.updateContactBucket).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Updated Name',
      }));
      expect(toast.success).toHaveBeenCalledWith('Contact updated successfully');
    });
  });

  it('handles API errors on submit', async () => {
    (contactBucketService.createContactBucket as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Duplicate email' } }
    });
    
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText('Organization*'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone*'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Country*'), { target: { value: 'India' } });
    fireEvent.change(screen.getByLabelText('Conference*'), { target: { value: '101' } });
    
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Duplicate email');
    });
  });

  it('handles websites loading error', async () => {
    console.error = jest.fn();
    (sourcedbService.listWebsites as jest.Mock).mockRejectedValue(new Error('Load Fail'));
    
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load websites:', expect.any(Error));
    });
  });
});
