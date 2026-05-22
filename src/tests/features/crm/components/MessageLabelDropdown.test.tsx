import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageLabelDropdown from '../../../../features/crm/components/MessageLabelDropdown';
import crmReducer, { initialState } from '../../../../store/slices/crm/crm.slice';
import type { CrmLabel } from '../../../../features/crm/types';

const makeStore = (labelDefinitions: CrmLabel[] = []) => {
  return configureStore({
    reducer: { crm: crmReducer },
    preloadedState: {
      crm: {
        ...initialState,
        labelDefinitions,
      },
    },
  });
};

const mockLabels: CrmLabel[] = [
  { id: 1, name: 'Lead', createdAt: '', updatedAt: '' },
  { id: 2, name: 'Follow-up', createdAt: '', updatedAt: '' },
];

describe('MessageLabelDropdown', () => {
  it('renders the label icon button', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <MessageLabelDropdown currentLabels={[]} onToggleLabel={() => {}} />
      </Provider>
    );
    expect(screen.getByTitle('Add or manage labels')).toBeInTheDocument();
  });

  it('opens the dropdown when clicked', () => {
    const store = makeStore(mockLabels);
    render(
      <Provider store={store}>
        <MessageLabelDropdown currentLabels={[]} onToggleLabel={() => {}} />
      </Provider>
    );
    
    fireEvent.click(screen.getByTitle('Add or manage labels'));
    expect(screen.getByText('Manage Labels')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
  });

  it('calls onToggleLabel when a label is clicked', () => {
    const onToggleLabel = jest.fn();
    const store = makeStore(mockLabels);
    render(
      <Provider store={store}>
        <MessageLabelDropdown currentLabels={[]} onToggleLabel={onToggleLabel} />
      </Provider>
    );
    
    fireEvent.click(screen.getByTitle('Add or manage labels'));
    fireEvent.click(screen.getByText('Lead'));
    
    expect(onToggleLabel).toHaveBeenCalledWith('Lead');
  });

  it('shows checkmark for selected labels', () => {
    const store = makeStore(mockLabels);
    render(
      <Provider store={store}>
        <MessageLabelDropdown currentLabels={['Lead']} onToggleLabel={() => {}} />
      </Provider>
    );
    
    fireEvent.click(screen.getByTitle('Add or manage labels'));
    // The checkmark is an SVG inside the button
    const leadButton = screen.getByText('Lead').closest('button');
    expect(leadButton?.querySelector('svg')).toBeInTheDocument();
    
    const followupButton = screen.getByText('Follow-up').closest('button');
    // Follow-up doesn't have a checkmark (which is another SVG)
    // Actually, both might have SVGs for the circle, but checkmark is only for isSelected
    // Let's check the structure again:
    // <div class="flex items-center gap-2"> ... circle div ... <span>{label.name}</span> </div>
    // {isSelected && <svg> ... checkmark ... </svg>}
    expect(followupButton?.querySelectorAll('svg').length).toBe(0);
  });

  it('closes the dropdown when clicking outside', () => {
    const store = makeStore(mockLabels);
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Provider store={store}>
          <MessageLabelDropdown currentLabels={[]} onToggleLabel={() => {}} />
        </Provider>
      </div>
    );
    
    fireEvent.click(screen.getByTitle('Add or manage labels'));
    expect(screen.getByText('Manage Labels')).toBeInTheDocument();
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Manage Labels')).not.toBeInTheDocument();
  });
});
