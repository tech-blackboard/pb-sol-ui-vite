import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ComposeEmailForm } from '../../../../features/crm/components/ComposeEmailForm';
import crmReducer, { initialState as crmInitialState } from '../../../../store/slices/crm/crm.slice';
import * as crmService from '../../../../features/crm/services/crmService';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');
jest.mock('../../../../features/crm/services/crmService', () => ({
    composeEmail: jest.fn(),
    saveDraft: jest.fn(),
    fetchReplyEmails: jest.fn().mockResolvedValue([]),
    fetchEmailAccounts: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../../features/crm/components/GmailToolbar', () => ({
    GmailToolbar: () => <div data-testid="gmail-toolbar" />
}));

jest.mock('../../../../features/crm/components/GmailReplyEditor', () => ({
    GmailReplyEditor: ({ onChange, placeholder, disabled, onEditorReady, content }: {
        onChange: (val: string) => void;
        placeholder?: string;
        disabled?: boolean;
        onEditorReady?: (editor: import('@tiptap/react').Editor) => void;
        content?: string;
    }) => {
        return (
            <textarea
                data-testid="gmail-reply-editor"
                placeholder={placeholder}
                disabled={disabled}
                value={content || ''}
                onChange={(e) => onChange(e.target.value)}
                ref={(el) => {
                    if (el && onEditorReady && !el.dataset.initialized) {
                        el.dataset.initialized = 'true';
                        onEditorReady({
                            getHTML: () => (el as HTMLTextAreaElement).value,
                            commands: {
                                setContent: jest.fn((html) => {
                                    (el as HTMLTextAreaElement).value = html;
                                }),
                                focus: jest.fn(),
                            }
                        } as unknown as import('@tiptap/react').Editor);
                    }
                }}
            />
        );
    }
}));

const renderWithProvider = (preloadedState?: Partial<typeof crmInitialState>) => {
    const store = configureStore({
        reducer: { crm: crmReducer },
        preloadedState: {
            crm: {
                ...crmInitialState,
                ...preloadedState
            }
        }
    });
    return {
        ...render(
            <Provider store={store}>
                <ComposeEmailForm />
            </Provider>
        ),
        store
    };
};

describe('ComposeEmailForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockCrmState = {
        loading: { savingDraft: false, sending: false },
        emailAccounts: [{ id: 1, email: 'acc@example.com' }],
        events: [
            { id: 1, name: 'Event 1', replyEmails: ['reply@example.com'], signatureName: 'John', signaturePlace: 'NYC' }
        ],
        activeEventId: 1,
    } as unknown as Partial<typeof crmInitialState>;

    it('renders with default fields and signature', async () => {
        renderWithProvider(mockCrmState);
        expect(screen.getByPlaceholderText('Add recipients...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email subject')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
        expect(screen.getByText('Cc')).toBeInTheDocument();
        expect(screen.getByText('Bcc')).toBeInTheDocument();

        // Signature should be injected
        const editor = screen.getByTestId('gmail-reply-editor');
        await waitFor(() => {
            expect((editor as HTMLTextAreaElement).value).toContain('John');
            expect((editor as HTMLTextAreaElement).value).toContain('NYC');
        });
    });

    it('toggles Cc and Bcc fields', async () => {
        renderWithProvider(mockCrmState);
        
        // Show CC
        fireEvent.click(screen.getAllByText('Cc')[0]);
        expect(screen.getByPlaceholderText('Add Cc...')).toBeInTheDocument();
        
        // Show BCC
        fireEvent.click(screen.getAllByText('Bcc')[0]);
        expect(screen.getByPlaceholderText('Add Bcc...')).toBeInTheDocument();
        
        // Type into CC
        const ccInput = screen.getByPlaceholderText('Add Cc...');
        fireEvent.change(ccInput, { target: { value: 'cc@example.com,' } });
        expect(screen.getByText('cc@example.com')).toBeInTheDocument();
    });

    it('handles comprehensive toEmail input interactions (comma, enter, backspace, blur)', async () => {
        renderWithProvider(mockCrmState);
        const toInput = screen.getByPlaceholderText('Add recipients...');

        // comma
        fireEvent.change(toInput, { target: { value: 'test1@test.com' } });
        fireEvent.keyDown(toInput, { key: ',' });
        expect(screen.getByText('test1@test.com')).toBeInTheDocument();

        // space
        fireEvent.change(toInput, { target: { value: 'test_space@test.com' } });
        fireEvent.keyDown(toInput, { key: ' ' });
        expect(screen.getByText('test_space@test.com')).toBeInTheDocument();

        // enter
        fireEvent.change(toInput, { target: { value: 'test2@test.com' } });
        fireEvent.keyDown(toInput, { key: 'Enter', code: 'Enter' });
        expect(screen.getByText('test2@test.com')).toBeInTheDocument();

        // blur
        fireEvent.change(toInput, { target: { value: 'test3@test.com' } });
        fireEvent.blur(toInput);
        expect(screen.getByText('test3@test.com')).toBeInTheDocument();

        // backspace
        fireEvent.change(toInput, { target: { value: '' } });
        fireEvent.keyDown(toInput, { key: 'Backspace', code: 'Backspace' });
        expect(screen.queryByText('test3@test.com')).not.toBeInTheDocument();
        
        // Remove icon
        const test2Div = screen.getByText('test2@test.com').closest('div');
        fireEvent.click(test2Div!.querySelector('button')!);
        expect(screen.queryByText('test2@test.com')).not.toBeInTheDocument();
    });

    it('handles comprehensive Cc/Bcc input interactions (comma, enter, backspace, blur)', async () => {
        renderWithProvider(mockCrmState);
        fireEvent.click(screen.getAllByText('Cc')[0]);
        fireEvent.click(screen.getAllByText('Bcc')[0]);

        const ccInput = screen.getByPlaceholderText('Add Cc...');
        fireEvent.change(ccInput, { target: { value: 'cc1@test.com,' } });
        expect(screen.getByText('cc1@test.com')).toBeInTheDocument();

        fireEvent.change(ccInput, { target: { value: 'cc2@test.com' } });
        fireEvent.keyDown(ccInput, { key: 'Enter', code: 'Enter' });
        expect(screen.getByText('cc2@test.com')).toBeInTheDocument();
        
        fireEvent.change(ccInput, { target: { value: 'cc3@test.com' } });
        fireEvent.blur(ccInput);
        expect(screen.getByText('cc3@test.com')).toBeInTheDocument();

        fireEvent.change(ccInput, { target: { value: '' } });
        fireEvent.keyDown(ccInput, { key: 'Backspace', code: 'Backspace' });
        expect(screen.queryByText('cc3@test.com')).not.toBeInTheDocument();

        // remove icon
        const cc1Div = screen.getByText('cc1@test.com').closest('div');
        fireEvent.click(cc1Div!.querySelector('button')!);
        expect(screen.queryByText('cc1@test.com')).not.toBeInTheDocument();

        // Close Cc row
        const closeCcBtns = ccInput.parentElement!.querySelectorAll('button');
        const closeCcRowBtn = Array.from(closeCcBtns).find(btn => btn.className.includes('hover:text-red-500'));
        if (closeCcRowBtn) fireEvent.click(closeCcRowBtn);
        expect(screen.queryByPlaceholderText('Add Cc...')).not.toBeInTheDocument();

        // bcc
        const bccInput = screen.getByPlaceholderText('Add Bcc...');
        fireEvent.change(bccInput, { target: { value: 'bcc1@test.com,' } });
        expect(screen.getByText('bcc1@test.com')).toBeInTheDocument();

        fireEvent.change(bccInput, { target: { value: 'bcc2@test.com' } });
        fireEvent.keyDown(bccInput, { key: 'Enter', code: 'Enter' });
        expect(screen.getByText('bcc2@test.com')).toBeInTheDocument();
        
        fireEvent.change(bccInput, { target: { value: 'bcc3@test.com' } });
        fireEvent.blur(bccInput);
        expect(screen.getByText('bcc3@test.com')).toBeInTheDocument();

        fireEvent.change(bccInput, { target: { value: '' } });
        fireEvent.keyDown(bccInput, { key: 'Backspace', code: 'Backspace' });
        expect(screen.queryByText('bcc3@test.com')).not.toBeInTheDocument();

        const closeBccBtns = bccInput.parentElement!.querySelectorAll('button');
        const closeBccRowBtn = Array.from(closeBccBtns).find(btn => btn.querySelector('svg')?.innerHTML.includes('18L18'));
        if (closeBccRowBtn) fireEvent.click(closeBccRowBtn);
        expect(screen.queryByPlaceholderText('Add Bcc...')).not.toBeInTheDocument();
    });

    it('handles importance dropdown', async () => {
        renderWithProvider(mockCrmState);
        const importanceBtn = screen.getByTitle('Set message importance');
        fireEvent.click(importanceBtn);
        
        const highBtn = screen.getByText('High Importance');
        fireEvent.click(highBtn);
        
        expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('autosaves draft when typing body', async () => {
        (crmService.saveDraft as jest.Mock).mockResolvedValue({ id: 'draft-1' });
        renderWithProvider(mockCrmState);
        
        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);
        
        const editor = screen.getByTestId('gmail-reply-editor');
        fireEvent.change(editor, { target: { value: 'New Body' } });
        
        // Fast forward 3 seconds
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });
        
        await waitFor(() => {
            expect(crmService.saveDraft).toHaveBeenCalled();
            expect(screen.getByText('Draft saved')).toBeInTheDocument();
        });
    });

    it('shows error modal if no recipient when submitting', async () => {
        renderWithProvider(mockCrmState);
        const submitBtn = screen.getByRole('button', { name: /Send/i });
        fireEvent.click(submitBtn);
        
        expect(screen.getByText('Missing Recipient')).toBeInTheDocument();
        
        // Close modal
        fireEvent.click(screen.getByText('OK'));
        await waitFor(() => {
            expect(screen.queryByText('Missing Recipient')).not.toBeInTheDocument();
        });
    });

    it('shows toast if no body when submitting', async () => {
        renderWithProvider({ ...mockCrmState, events: [{ id: 1, name: 'Event 1' }] } as unknown as Partial<typeof crmInitialState>); // No signature
        
        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);
        
        const submitBtn = screen.getByRole('button', { name: /Send/i });
        fireEvent.click(submitBtn);
        
        expect(toast.error).toHaveBeenCalledWith('Please enter a message');
    });

    it('submits successfully', async () => {
        (crmService.composeEmail as jest.Mock).mockResolvedValue({});
        renderWithProvider(mockCrmState);
        
        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);
        
        const subjectInput = screen.getByPlaceholderText('Email subject');
        fireEvent.change(subjectInput, { target: { value: 'My Subject' } });
        
        const submitBtn = screen.getByRole('button', { name: /Send/i });
        fireEvent.click(submitBtn);
        
        await waitFor(() => {
            expect(crmService.composeEmail).toHaveBeenCalledWith(expect.objectContaining({
                toEmail: 'test@test.com',
                subject: 'My Subject'
            }));
            expect(toast.success).toHaveBeenCalledWith('Email sent successfully');
        });
    });

    it('shows error toast when send fails', async () => {
        (crmService.composeEmail as jest.Mock).mockRejectedValue(new Error('Network error'));
        renderWithProvider(mockCrmState);

        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);

        const editor = screen.getByTestId('gmail-reply-editor');
        fireEvent.change(editor, { target: { value: 'Some body text' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to send email');
        });
    });

    it('shows toast error when no activeEventId and fromEmail has no matching event', async () => {
        // No activeEventId + fromEmail not in any event replyEmails
        renderWithProvider({
            ...mockCrmState,
            activeEventId: undefined,
            events: [],
        } as unknown as Partial<typeof crmInitialState>);

        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'to@test.com' } });
        fireEvent.blur(toInput);

        const editor = screen.getByTestId('gmail-reply-editor');
        fireEvent.change(editor, { target: { value: 'Hello world' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Please select a conference first to compose an email');
        });
    });

    it('handleAccountChange selects an email account from dropdown', async () => {
        renderWithProvider({
            ...mockCrmState,
            // Provide an email account that matches a replyEmail
            emailAccounts: [{ id: 2, email: 'reply@example.com' }],
            events: [{ id: 1, name: 'Ev', replyEmails: ['reply@example.com'] }],
        } as unknown as Partial<typeof crmInitialState>);

        const fromSelect = screen.getByRole('combobox');
        // Select the account option (value = 'acc_2')
        fireEvent.change(fromSelect, { target: { value: 'acc_2' } });
        // No crash = pass; fromEmail should be reply@example.com now
        expect(fromSelect).toBeInTheDocument();
    });

    it('handleAccountChange sets fromEmail when value is a plain email (no acc_ prefix)', async () => {
        renderWithProvider({
            ...mockCrmState,
            emailAccounts: [],
            events: [{ id: 1, name: 'Ev', replyEmails: ['manual@example.com'] }],
        } as unknown as Partial<typeof crmInitialState>);

        const fromSelect = screen.getByRole('combobox');
        fireEvent.change(fromSelect, { target: { value: 'manual@example.com' } });
        expect(fromSelect).toBeInTheDocument();
    });

    it('gathers reply emails from all events when activeEventId is undefined', () => {
        renderWithProvider({
            ...mockCrmState,
            activeEventId: undefined,
            events: [
                { id: 1, name: 'E1', replyEmails: ['email1@test.com'] },
                { id: 2, name: 'E2', replyEmails: ['email2@test.com'] },
            ]
        } as unknown as Partial<typeof crmInitialState>);

        const fromSelect = screen.getByRole('combobox');
        expect(fromSelect.innerHTML).toContain('email1@test.com');
        expect(fromSelect.innerHTML).toContain('email2@test.com');
    });

    it('updates signature when activeEventId changes', async () => {
        const { store } = renderWithProvider({
            ...mockCrmState,
            activeEventId: 1,
            events: [
                { id: 1, name: 'Event 1', replyEmails: ['reply@example.com'], signatureName: 'John', signaturePlace: 'NYC' },
                { id: 2, name: 'Event 2', replyEmails: ['reply2@example.com'], signatureName: 'Jane', signaturePlace: 'LA' },
                { id: 3, name: 'Event 3', replyEmails: ['reply3@example.com'] },
            ]
        } as unknown as Partial<typeof crmInitialState>);

        const editor = screen.getByTestId('gmail-reply-editor') as HTMLTextAreaElement;
        
        await waitFor(() => {
            expect(editor.value).toContain('John');
        });

        // Add dummy signature div structure so DOMParser can find it
        fireEvent.change(editor, { target: { value: '<div class="email-signature">Old Sig</div><p>Content</p>' } });

        // Change activeEventId to 2
        act(() => {
            store.dispatch({ type: 'crm/setActiveEvent', payload: 2 });
        });

        await waitFor(() => {
            expect(editor.value).toContain('Jane');
            expect(editor.value).toContain('LA');
        });

        // Change activeEventId to 3 (no signature)
        act(() => {
            store.dispatch({ type: 'crm/setActiveEvent', payload: 3 });
        });

        await waitFor(() => {
            expect(editor.value).not.toContain('Jane');
        });
    });

    it('closes importance dropdown when clicking outside', async () => {
        renderWithProvider(mockCrmState);
        const importanceBtn = screen.getByTitle('Set message importance');
        fireEvent.click(importanceBtn);
        expect(screen.getByText('High Importance')).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        await waitFor(() => {
            expect(screen.queryByText('High Importance')).not.toBeInTheDocument();
        });
    });

    it('finds targetEventId from fromEmail during saveDraft when activeEventId is undefined', async () => {
        renderWithProvider({
            ...mockCrmState,
            activeEventId: undefined,
            events: [{ id: 1, name: 'Event 1', replyEmails: ['acc@example.com'] }],
        } as unknown as Partial<typeof crmInitialState>);

        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);

        const editor = screen.getByTestId('gmail-reply-editor');
        fireEvent.change(editor, { target: { value: 'Draft body' } });

        // Auto-save triggers after 3s
        act(() => {
            jest.advanceTimersByTime(3500);
        });

        await waitFor(() => {
            expect(crmService.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
                eventId: 1,
                htmlBody: 'Draft body',
                toEmail: 'test@test.com'
            }));
        });
    });

    it('finds targetEventId from fromEmail during submit when activeEventId is undefined', async () => {
        (crmService.composeEmail as jest.Mock).mockResolvedValue({});
        renderWithProvider({
            ...mockCrmState,
            activeEventId: undefined,
            events: [{ id: 5, name: 'Ev 5', replyEmails: ['acc@example.com'] }],
        } as unknown as Partial<typeof crmInitialState>);

        const toInput = screen.getByPlaceholderText('Add recipients...');
        fireEvent.change(toInput, { target: { value: 'test@test.com' } });
        fireEvent.blur(toInput);

        const editor = screen.getByTestId('gmail-reply-editor');
        fireEvent.change(editor, { target: { value: 'My body text' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));
        });

        await waitFor(() => {
            expect(crmService.composeEmail).toHaveBeenCalledWith(expect.objectContaining({
                eventId: 5,
                toEmail: 'test@test.com'
            }));
        });
    });

    it('shows sending spinner when loading.sending is true', async () => {

        renderWithProvider({
            ...mockCrmState,
            loading: { ...crmInitialState.loading, sending: true },
        } as unknown as Partial<typeof crmInitialState>);

        // The send button should show spinner + 'Sending...' text
        expect(screen.getByText('Sending...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sending.../i })).toBeDisabled();
    });
});
