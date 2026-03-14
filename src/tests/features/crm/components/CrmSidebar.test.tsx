import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CrmSidebar from '../../../../features/crm/components/CrmSidebar';

describe('CrmSidebar', () => {
  it('renders the Compose Mail button', () => {
    render(<CrmSidebar />);
    expect(screen.getByText('Compose Mail')).toBeInTheDocument();
  });

  it('renders all folder buttons', () => {
    render(<CrmSidebar />);
    const folders = ['Inbox', 'Drafts', 'Sent', 'Starred', 'Junk', 'Trash'];
    for (const name of folders) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders System section items', () => {
    render(<CrmSidebar />);
    expect(screen.getByText('Data Migration')).toBeInTheDocument();
    expect(screen.getByText('Black List')).toBeInTheDocument();
  });

  it('marks Inbox as the active folder', () => {
    render(<CrmSidebar />);
    // Inbox button should have the active class
    const inboxButton = screen.getByText('Inbox').closest('button');
    expect(inboxButton?.className).toMatch(/bg-blue-50|text-blue-700/);
  });

  it('renders Folders and System section headings', () => {
    render(<CrmSidebar />);
    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
