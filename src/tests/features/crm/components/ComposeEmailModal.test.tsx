import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ComposeEmailModal from '../../../../features/crm/components/ComposeEmailModal';
import crmReducer, { initialState as crmInitialState, closeComposeModal } from '../../../../store/slices/crm/crm.slice';

jest.mock('../../../../features/crm/components/ComposeEmailForm', () => ({
    ComposeEmailForm: () => <div data-testid="compose-email-form">Mock Form</div>
}));

const renderWithProvider = (isComposeModalOpen: boolean) => {
    const store = configureStore({
        reducer: { crm: crmReducer },
        preloadedState: {
            crm: {
                ...crmInitialState,
                isComposeModalOpen,
            }
        }
    });
    jest.spyOn(store, 'dispatch');
    return { ...render(
        <Provider store={store}>
            <ComposeEmailModal />
        </Provider>
    ), store };
};

describe('ComposeEmailModal', () => {
    it('returns null when isComposeModalOpen is false', () => {
        const { container } = renderWithProvider(false);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders modal and form when isComposeModalOpen is true', () => {
        renderWithProvider(true);
        expect(screen.getByText('New Message')).toBeInTheDocument();
        expect(screen.getByTestId('compose-email-form')).toBeInTheDocument();
    });

    it('dispatches closeComposeModal when close button is clicked', () => {
        const { store } = renderWithProvider(true);
        const closeBtn = screen.getByTitle('Close');
        
        fireEvent.click(closeBtn);
        expect(store.dispatch).toHaveBeenCalledWith(closeComposeModal());
    });
});
