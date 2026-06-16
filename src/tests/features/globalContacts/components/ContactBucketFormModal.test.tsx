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
    (contactBucketService.getContactBucketLabels as jest.Mock).mockResolvedValue([{ id: 1, name: 'test-label' }]);
    // Mock scrollTo
    Element.prototype.scrollTo = jest.fn();
  });

  it('renders in view mode with item details', async () => {
    render(<ContactBucketFormModal mode="view" item={mockItem} onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeDisabled();
    expect(screen.getByDisplayValue('John Doe')).toBeDisabled();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('test-label')).toBeInTheDocument();
    expect(screen.getByText('Last Interaction')).toBeInTheDocument();
  });

  it('renders in add mode with empty fields', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Email*')).toHaveValue('');
    expect(screen.getByLabelText('Full Name')).toHaveValue('');
  });

  it('shows validation errors for required fields on submit', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Conference is required')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Please fill all required fields');
    });
  });

  it('handles field changes and clears errors', async () => {
    render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
    
    await waitFor(() => expect(screen.getByText('Test Website')).toBeInTheDocument());

    // Fill other required fields first to isolate email validation
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'India' } });
    fireEvent.change(screen.getByLabelText('Conference*'), { target: { value: '101' } });

    const emailInput = screen.getByLabelText('Email*');
    fireEvent.change(emailInput, { target: { value: 'invalid@com' } });
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => expect(screen.getByText('Invalid email format')).toBeInTheDocument());
    
    fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
    await waitFor(() => expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument());
  }, 15000);

  it('successfully creates a contact', async () => {
    (contactBucketService.createContactBucket as jest.Mock).mockResolvedValue({ id: 2 });
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    
    render(<ContactBucketFormModal mode="add" onClose={onClose} onSuccess={onSuccess} />);
    
    await waitFor(() => expect(screen.getByText('Test Website')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'New Org' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1112223333' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone'), { target: { value: '4445556666' } });
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'India' } });
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
    
    await waitFor(() => expect(screen.getByText('Test Website')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Updated Name' } });
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
    
    await waitFor(() => expect(screen.getByText('Test Website')).toBeInTheDocument());

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('WhatsApp Phone'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'India' } });
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
      expect(console.error).toHaveBeenCalledWith('Failed to load data:', expect.any(Error));
    });
  });

  describe('Label interactions', () => {
    it('allows selecting and unselecting labels', async () => {
      render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
      await waitFor(() => expect(screen.getByText('Select labels...')).toBeInTheDocument());

      // Open dropdown
      fireEvent.click(screen.getByText('Select labels...'));
      expect(screen.getByText('Clear All')).toBeInTheDocument();

      // Select test-label
      const labelBtn = screen.getByRole('button', { name: /test-label/i });
      fireEvent.click(labelBtn);

      // Verify it updates text
      expect(screen.getByText('1 label(s) selected')).toBeInTheDocument();

      // Unselect test-label
      fireEvent.click(labelBtn);
      expect(screen.getByText('Select labels...')).toBeInTheDocument();
    });

    it('allows clearing all labels', async () => {
      render(<ContactBucketFormModal mode="edit" item={mockItem} onClose={jest.fn()} onSuccess={jest.fn()} />);
      await waitFor(() => expect(screen.getByText('1 label(s) selected')).toBeInTheDocument());

      // Open dropdown
      fireEvent.click(screen.getByText('1 label(s) selected'));
      
      // Click Clear All
      fireEvent.click(screen.getByText('Clear All'));

      // Verify cleared
      expect(screen.getByText('Select labels...')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
      await waitFor(() => expect(screen.getByText('Select labels...')).toBeInTheDocument());

      // Open dropdown
      fireEvent.click(screen.getByText('Select labels...'));
      expect(screen.getByText('Clear All')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('renders empty label state in view mode', () => {
      render(<ContactBucketFormModal mode="view" item={{ ...mockItem, labels: [] }} onClose={jest.fn()} onSuccess={jest.fn()} />);
      expect(screen.getByText('No interaction labels assigned.')).toBeInTheDocument();
    });

    it('allows removing labels via the displayed tag button', async () => {
      render(<ContactBucketFormModal mode="edit" item={mockItem} onClose={jest.fn()} onSuccess={jest.fn()} />);
      await waitFor(() => expect(screen.getByText('1 label(s) selected')).toBeInTheDocument());

      // Find the cross button on the tag
      // The tag is rendered with test-label text and an X button
      const removeBtn = screen.getAllByRole('button').find(btn => btn.className.includes('p-0.5 hover:bg-blue-100'));
      if (removeBtn) {
        fireEvent.click(removeBtn);
      }

      expect(screen.getByText('Select labels...')).toBeInTheDocument();
    });

    it('shows No labels found when no labels are available', async () => {
      (contactBucketService.getContactBucketLabels as jest.Mock).mockResolvedValue([]);
      render(<ContactBucketFormModal mode="add" onClose={jest.fn()} onSuccess={jest.fn()} />);
      
      // Wait for the async load to complete so state updates are flushed
      await waitFor(() => {
        expect(screen.getByText('Select labels...')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select labels...'));

      await waitFor(() => {
        expect(screen.getByText('No labels found')).toBeInTheDocument();
      });
    });
  });
});
