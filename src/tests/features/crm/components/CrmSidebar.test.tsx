import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import CrmSidebar from '../../../../features/crm/components/CrmSidebar';

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

const renderWithProviders = (ui: React.ReactElement, storeOverrides: object = {}) => {
    const store = makeStore(storeOverrides);
    return render(<Provider store={store}>{ui}</Provider>);
};

describe('CrmSidebar', () => {
  it('renders the Compose Mail button', () => {
    renderWithProviders(<CrmSidebar />);
    expect(screen.getByText('Compose Mail')).toBeInTheDocument();
  });

  it('renders all folder buttons', () => {
    renderWithProviders(<CrmSidebar />);
    const folders = ['Inbox', 'Drafts', 'Sent', 'Starred', 'Junk', 'Trash'];
    for (const name of folders) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders System section items', () => {
    renderWithProviders(<CrmSidebar />);
    expect(screen.getByText('Data Migration')).toBeInTheDocument();
    expect(screen.getByText('Black List')).toBeInTheDocument();
  });

  it('marks Inbox as the active folder', () => {
    renderWithProviders(<CrmSidebar />);
    // Inbox button should have the active class
    const inboxButton = screen.getByText('Inbox').closest('button');
    expect(inboxButton?.className).toMatch(/bg-blue-50|text-blue-700/);
  });

  it('renders Folders and System section headings', () => {
    renderWithProviders(<CrmSidebar />);
    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
