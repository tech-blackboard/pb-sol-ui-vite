import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../store/slices/authSlice';
import themeReducer from '../store/slices/themeSlice';
import registrationsReducer from '../store/slices/registrations/registrations.slice';
import sponsorshipsReducer from '../store/slices/sponsorships/sponsorships.slice';
import brochuresReducer from '../store/slices/brochures/brochures.slice';
import accRegistrationsReducer from '../store/slices/accRegistrations/accRegistrations.slice';
import contactsReducer from '../store/slices/contacts/contacts.slice';
import crmReducer from '../store/slices/crm/crm.slice';
import abstractsReducer from '../store/slices/abstracts/abstracts.slice';

jest.mock('../features/abstracts/pages/AbstractsPage', () => () => <div data-testid="page-abstracts">Abstracts Page Content</div>)
jest.mock('../features/crm/pages/MailboxPage', () => () => <div data-testid="page-mailbox">Mailbox Page Content</div>)
jest.mock('../features/registrations/pages/RegistrationsPage', () => () => <div data-testid="page-registrations">Registrations Page Content</div>)
jest.mock('../features/brochures/pages/BrochuresPage', () => () => <div data-testid="page-brochure">Brochure Page Content</div>)
jest.mock('../features/sponsorships/pages/SponsorshipsPage', () => () => <div data-testid="page-sponsorship">Sponsorship Page Content</div>)
jest.mock('../features/accRegistrations/pages/AccRegistrationsPage', () => () => <div data-testid="page-acc">Accommodation Page Content</div>)
jest.mock('../features/contacts/pages/ContactsPage', () => () => <div data-testid="page-contact">Contact Page Content</div>)
jest.mock('../pages/DashboardPage', () => () => <div data-testid="page-dashboard">Dashboard Page Content</div>)
jest.mock('../features/globalContacts/pages/GlobalContactsPage', () => () => <div data-testid="page-global-contacts">Global Contacts Page Content</div>)

// Mock dependencies
jest.mock('../services/deviceFingerprint', () => ({
    getDeviceFingerprint: jest.fn().mockResolvedValue('mock-fp'),
    getCachedDeviceFingerprint: jest.fn().mockReturnValue('mock-fp'),
}));

jest.mock('../services/abstracts', () => ({
    fetchDashboard: jest.fn().mockResolvedValue({ total: 0, statusCounts: [], recentAbstracts: [] }),
    fetchAbstracts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
}));

jest.mock('../services/sourcedb', () => ({
    listWebsites: jest.fn().mockResolvedValue([]),
}));

// We need to import the functions to use them in tests
import { login, logout } from '../services/auth';
jest.mock('../services/auth', () => ({
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue({}),
    refreshToken: jest.fn(),
}));

jest.mock('../services/deviceService', () => ({
    getAllDevices: jest.fn().mockResolvedValue({ data: [], pagination: { total: 0, totalPages: 1 } }),
    approveDevice: jest.fn().mockResolvedValue({}),
    revokeDevice: jest.fn().mockResolvedValue({}),
    forceLogoutDevice: jest.fn().mockResolvedValue({}),
}));

const renderWithProviders = (ui: React.ReactElement, {
    preloadedState = {},
    store = configureStore({
        reducer: {
            auth: authReducer,
            theme: themeReducer,
            abstracts: abstractsReducer,
            registrations: registrationsReducer,
            sponsorships: sponsorshipsReducer,
            brochures: brochuresReducer,
            accRegistrations: accRegistrationsReducer,
            contacts: contactsReducer,
            crm: crmReducer,
        },
        preloadedState,
    }),
} = {}) => {
    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};

describe('App Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login page when not authenticated', () => {
        renderWithProviders(<App />);
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    test('renders dashboard when authenticated', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester', isAdmin: false },
                loading: false,
                error: null,
            },
            theme: { mode: 'light' as const },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });
    });

    test('handles network error event', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:network-error'));
        });

        await waitFor(() => {
            expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();
        });
    });

    test('handles server error event', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:server-error'));
        });

        await waitFor(() => {
            expect(screen.getByText(/Our servers are currently experiencing issues/i)).toBeInTheDocument();
        });
    });

    test('handles server unavailable event', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:server-unavailable'));
        });

        await waitFor(() => {
            expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
        });
    });

    test('handles device not approved event', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:device-not-approved', {
                detail: { message: 'Security alert: New device' }
            }));
        });

        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        });
    });

    test('handles device not approved event with fallback message', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:device-not-approved'));
        });

        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        });
    });

    test('handles auth failure event', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        const { store } = renderWithProviders(<App />, { preloadedState });

        act(() => {
            window.dispatchEvent(new CustomEvent('app:auth-failure'));
        });

        await waitFor(() => {
            expect(store.getState().auth.user).toBeNull();
        });
    });

    test('handles logout process', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const userMenuButton = screen.getByTitle(/Profile/i);
        fireEvent.click(userMenuButton);

        const logoutButton = screen.getByText(/Logout/i);
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        });
        expect(logout).toHaveBeenCalled();
    });

    test('handles successful sign in', async () => {
        (login as jest.Mock).mockResolvedValue({
            user: { id: 1, email: 'test@test.com', name: 'Test User', role: 'Tester' },
            token: 'mock-token'
        });

        renderWithProviders(<App />);

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

        const signInButton = screen.getByRole('button', { name: /Sign in/i });
        fireEvent.click(signInButton);

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });
    });

    test('handles sign in failure', async () => {
        (login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

        renderWithProviders(<App />);

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

        const signInButton = screen.getByRole('button', { name: /Sign in/i });
        fireEvent.click(signInButton);

        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        });
    });

    test('toggles sidebar and clicks overlay', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
        window.dispatchEvent(new Event('resize'));

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const menuButton = screen.getByLabelText(/Open sidebar/i);
        fireEvent.click(menuButton);

        const overlay = document.querySelector('.bg-black\\/30');
        expect(overlay).toBeInTheDocument();

        fireEvent.click(overlay!);

        await waitFor(() => {
            expect(document.querySelector('.bg-black\\/30')).not.toBeInTheDocument();
        });
    });

    test('navigates through all sections', async () => {
        const preloadedState = {
            auth: {
                user: {
                    id: 1,
                    useremail: 'admin@test.com',
                    name: 'Admin',
                    role: 'Administrator',
                    isAdmin: true,
                },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        // Wait for default page
        await screen.findByTestId('page-abstracts');

        const navTests = [
            { label: 'Registrations', page: 'page-registrations' },
            { label: 'Accommodation Registrations', page: 'page-acc' },
            { label: 'Brochures', page: 'page-brochure' },
            { label: 'Sponsors/Exhibitors', page: 'page-sponsorship' },
            { label: 'Contacts', page: 'page-contact' },
            { label: 'Dashboard', page: 'page-dashboard' },
        ];

        for (const nav of navTests) {
            fireEvent.click(screen.getByRole('button', { name: nav.label }));

            expect(await screen.findByTestId(nav.page)).toBeInTheDocument();
        }
    });

    test('renders Device Management for admins', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'admin@test.com', name: 'Admin', role: 'Administrator', isAdmin: true },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const deviceLink = screen.getByText('Device Management');
        fireEvent.click(deviceLink);

        await waitFor(() => {
            expect(screen.queryByText(/Loading devices/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getAllByText(/Device Management/i).length).toBeGreaterThan(0)
    });

    test('initializes dark mode correctly', () => {
        const preloadedState = {
            theme: { mode: 'dark' as const },
        };

        renderWithProviders(<App />, { preloadedState });

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    test('navigates to CRM/Mailbox section', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const mailboxButton = screen.getByRole('button', { name: /Mailbox/i });
        fireEvent.click(mailboxButton);

        expect(await screen.findByTestId('page-mailbox')).toBeInTheDocument();
    });

    test('handles app:navigate event with truthy and falsy details', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        // Fire navigate event with truthy detail
        act(() => {
            window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'crm' }));
        });

        expect(await screen.findByTestId('page-mailbox')).toBeInTheDocument();

        // Fire navigate event with falsy/null detail (should not change section)
        act(() => {
            window.dispatchEvent(new CustomEvent('app:navigate', { detail: null }));
        });

        // It should still be mailbox
        expect(screen.getByTestId('page-mailbox')).toBeInTheDocument();
    });

    test('admin navigating to Contact Bucket dispatches setActiveFolder and renders MailboxPage', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'admin@test.com', name: 'Admin', role: 'Administrator', isAdmin: true },
                loading: false,
                error: null,
            },
        };

        const { store } = renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        // Click Contact Bucket button
        const contactBucketButton = screen.getByRole('button', { name: /Contact Bucket/i });
        fireEvent.click(contactBucketButton);

        // Verify it dispatches setActiveFolder('Contact Bucket')
        await waitFor(() => {
            expect(store.getState().crm.activeFolder).toBe('Contact Bucket');
        });

        // Contact Bucket renders MailboxPage when activeId === 'contactBucket' and isAdmin
        expect(screen.getByTestId('page-mailbox')).toBeInTheDocument();
    });

    test('admin navigating to Global Contacts renders GlobalContactsPage', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'admin@test.com', name: 'Admin', role: 'Administrator', isAdmin: true },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        // Click Global Contacts button
        const globalContactsButton = screen.getByRole('button', { name: /Global Contacts/i });
        fireEvent.click(globalContactsButton);

        // Verify GlobalContactsPage renders
        expect(await screen.findByTestId('page-global-contacts')).toBeInTheDocument();
    });
});

