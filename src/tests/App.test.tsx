import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../store/slices/authSlice';
import themeReducer from '../store/slices/themeSlice';
import abstractsReducer from '../store/slices/abstracts/abstracts.slice';

declare const require: (id: string) => { login: jest.Mock };

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

    test('toggles theme', async () => {
        const preloadedState = {
            auth: {
                user: { id: 1, useremail: 'test@test.com', name: 'Test User', role: 'Tester' },
                loading: false,
                error: null,
            },
        };

        const { store } = renderWithProviders(<App />, { preloadedState });

        // Wait for dashboard to settle
        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
        fireEvent.click(themeToggle);

        expect(store.getState().theme.mode).toBe('dark');
        expect(document.documentElement).toHaveClass('dark');
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

        // Wait for initial render
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
            // ServerIssueAlert has "Server Unavailable" header but this specific text in description
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
            // ServerUnavailableAlert has this text in description
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

        // App should logout on device revocation
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
    });

    test('handles successful sign in', async () => {
        (require('../services/auth').login as jest.Mock).mockResolvedValue({
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
        (require('../services/auth').login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

        renderWithProviders(<App />);

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

        const signInButton = screen.getByRole('button', { name: /Sign in/i });
        fireEvent.click(signInButton);

        await waitFor(() => {
            // Should still be on sign in page
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

        // Mock mobile view
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
        window.dispatchEvent(new Event('resize'));

        renderWithProviders(<App />, { preloadedState });

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });

        const menuButton = screen.getByLabelText(/Open sidebar/i);
        fireEvent.click(menuButton);

        // Overlay should appear. We can't easily find by role but we can find by class or just wait.
        // It's a div with fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden
        const overlay = document.querySelector('.bg-black\\/30');
        expect(overlay).toBeInTheDocument();

        fireEvent.click(overlay!);

        await waitFor(() => {
            expect(document.querySelector('.bg-black\\/30')).not.toBeInTheDocument();
        });
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
