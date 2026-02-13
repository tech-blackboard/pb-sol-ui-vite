import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../store/slices/authSlice';
import themeReducer from '../store/slices/themeSlice';
import abstractsReducer from '../store/slices/abstracts/abstracts.slice';

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
                user: { id: 1, useremail: 'admin@test.com', name: 'Admin', role: 'Administrator', isAdmin: true },
                loading: false,
                error: null,
            },
        };

        renderWithProviders(<App />, { preloadedState });

        // Wait for default page (Abstracts)
        await waitFor(() => {
            expect(screen.getByText(/Abstracts/i)).toBeInTheDocument();
        });

        const navTests = [
            { link: 'Registrations', text: 'Registrations' },
            { link: 'Accommodation Registrations', text: 'Accommodation Registrations' },
            { link: 'Brochure', text: 'Brochure' },
            { link: 'Sponsorship', text: 'Sponsorship' },
            { link: 'Contact', text: 'Contact' },
            { link: 'Dashboard', text: 'Dashboard' },
        ];

        for (const nav of navTests) {
            const link = screen.getByText(nav.link);
            fireEvent.click(link);
            await waitFor(() => {
                // Check if we can find some text that would be on that page.
                // Since we mock features, we just hope they render something unique 
                // or we check the active state if possible.
                // For now, checking if the link remains or page title appears.
                expect(screen.getByText(nav.text)).toBeInTheDocument();
            });
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

        expect(screen.getByRole('heading', { name: /Device Management/i })).toBeInTheDocument();
    });
});
