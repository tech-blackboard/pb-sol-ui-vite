import { getCachedDeviceFingerprint } from '../../services/deviceFingerprint';

// Declare require for isolateModules
declare const require: (id: string) => unknown;

// Mock dependencies
jest.mock('../../services/deviceFingerprint', () => ({
    getCachedDeviceFingerprint: jest.fn(),
}));

const mockAxiosInstance: jest.Mock & {
    interceptors: {
        request: { use: jest.Mock; eject: jest.Mock };
        response: { use: jest.Mock; eject: jest.Mock };
    };
    create: jest.Mock;
    post: jest.Mock;
    get: jest.Mock;
    defaults: { headers: { common: Record<string, string> } };
} = jest.fn() as unknown as (jest.Mock & {
    interceptors: {
        request: { use: jest.Mock; eject: jest.Mock };
        response: { use: jest.Mock; eject: jest.Mock };
    };
    create: jest.Mock;
    post: jest.Mock;
    get: jest.Mock;
    defaults: { headers: { common: Record<string, string> } };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(mockAxiosInstance as any).interceptors = {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
};
mockAxiosInstance.create = jest.fn().mockReturnValue(mockAxiosInstance);
mockAxiosInstance.post = jest.fn();
mockAxiosInstance.get = jest.fn();
mockAxiosInstance.defaults = { headers: { common: {} } };

// Mock axios globally
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => mockAxiosInstance),
    },
}));

describe('api service', () => {
    const mockGetFingerprint = getCachedDeviceFingerprint as jest.Mock;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        jest.clearAllMocks();

        // Use isolateModules to ensure api.ts is re-evaluated with our mock for EACH test
        jest.isolateModules(() => {
            require('../../lib/api');
        });
    });

    describe('Request Interceptor', () => {
        test('adds Authorization header from localStorage if token exists', () => {
            localStorage.setItem('accessToken', 'ls-token');
            const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
            const config = { headers: { set: jest.fn() } };
            requestInterceptor(config);
            expect(config.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer ls-token');
        });

        test('adds Authorization header from sessionStorage if token exists in SS and not in LS', () => {
            sessionStorage.setItem('accessToken', 'ss-token');
            const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
            const config = { headers: { set: jest.fn() } };
            requestInterceptor(config);
            expect(config.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer ss-token');
        });

        test('adds device ID header if fingerprint is cached', () => {
            mockGetFingerprint.mockReturnValue('device-123');
            const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
            const config = { headers: { set: jest.fn() } };
            requestInterceptor(config);
            expect(config.headers.set).toHaveBeenCalledWith('x-device-id', 'device-123');
        });

        test('does not add headers if no token or device ID', () => {
            mockGetFingerprint.mockReturnValue(null);
            const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
            const config = { headers: { set: jest.fn() } };
            const result = requestInterceptor(config);
            expect(config.headers.set).not.toHaveBeenCalled();
            expect(result).toBe(config);
        });
    });

    describe('Response Interceptor', () => {
        const getResponseInterceptor = () => (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

        test('passes through successful responses', () => {
            const [onFulfilled] = getResponseInterceptor();
            const response = { data: 'ok' };
            expect(onFulfilled(response)).toBe(response);
        });

        test('handles 500+ errors and dispatches app:server-error', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
            const err = { response: { status: 502 }, config: {} };

            try { await onRejected(err); } catch { /* expected */ }
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:server-error' }));
        });

        test('handles connection refused and dispatches app:server-unavailable', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
            const err = { code: 'ECONNREFUSED', config: {} };

            try { await onRejected(err); } catch { /* expected */ }
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:server-unavailable' }));
        });

        test('handles network error (offline) and dispatches app:network-error', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

            Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
            const err = { config: {} };

            try { await onRejected(err); } catch { /* expected */ }
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:network-error' }));

            Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
        });

        test('handles device restriction (403 with device message)', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
            const err = {
                response: {
                    status: 403,
                    data: { message: 'Security: device revoked' }
                },
                config: {}
            };

            try { await onRejected(err); } catch { /* expected */ }
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'app:device-not-approved',
                detail: { message: 'Security: device revoked' }
            }));
        });

        test('clears tokens and dispatches auth-failure on 401 during refresh call', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
            localStorage.setItem('accessToken', 'old');
            localStorage.setItem('refreshToken', 'old-refresh');

            const err = {
                response: { status: 401 },
                config: { url: '/refresh-token' }
            };

            try { await onRejected(err); } catch { /* expected */ }

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:auth-failure' }));
        });

        test('prevents infinite loop if auth-failure already dispatched', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

            // First trigger a refresh failure to set isAuthFailureDispatched = true
            const errRefresh = { response: { status: 401 }, config: { url: '/refresh-token' } };
            try { await onRejected(errRefresh); } catch { /* Expected failure */ }
            dispatchSpy.mockClear();

            // Subsequent 401 should be rejected immediately without dispatching again
            const errNormal = { response: { status: 401 }, config: { url: '/normal' } };
            try { await onRejected(errNormal); } catch { /* Expected failure */ }
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        test('optimistic concurrency: retries with existing new token if current request used old one', async () => {
            const [, onRejected] = getResponseInterceptor();

            localStorage.setItem('accessToken', 'brand-new-token');
            const originalConfig = {
                url: '/some-api',
                headers: {
                    Authorization: 'Bearer old-token',
                    set: jest.fn()
                }
            };
            const err = { response: { status: 401 }, config: originalConfig };

            // When it retries, it calls api(original) which we mock here
            (mockAxiosInstance as jest.Mock).mockResolvedValueOnce({ data: 'retry-success' });

            const result = await onRejected(err);

            expect(result).toEqual({ data: 'retry-success' });
            expect(originalConfig.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer brand-new-token');
        });

        test('optimistic concurrency fallback: uses simple assignment if headers.set is missing', async () => {
            const [, onRejected] = getResponseInterceptor();

            localStorage.setItem('accessToken', 'brand-new-token');
            const originalConfig = {
                url: '/some-api',
                headers: {
                    Authorization: 'Bearer old-token'
                }
            } as unknown as { url: string; headers: Record<string, string>; _retry?: boolean };
            const err = { response: { status: 401 }, config: originalConfig };

            (mockAxiosInstance as jest.Mock).mockResolvedValueOnce({ data: 'retry-success' });

            await onRejected(err);
            expect(originalConfig.headers['Authorization']).toBe('Bearer brand-new-token');
        });

        test('performs token refresh and retries request on 401', async () => {
            const [, onRejected] = getResponseInterceptor();

            localStorage.setItem('refreshToken', 'valid-refresh');
            const originalConfig = {
                url: '/target-api',
                headers: { set: jest.fn() }
            };
            const err = { response: { status: 401 }, config: originalConfig };

            // Mock successful refresh post
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: { access_token: 'fresh-token', refresh_token: 'new-refresh' }
            });
            // Mock retry call
            mockAxiosInstance.mockResolvedValueOnce({ data: 'refresh-retry-success' });

            const result = await onRejected(err);

            expect(result).toEqual({ data: 'refresh-retry-success' });
            expect(localStorage.getItem('accessToken')).toBe('fresh-token');
            expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
            expect(originalConfig.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer fresh-token');
        });

        test('handles refresh failure with hard logout', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

            localStorage.setItem('accessToken', 'about-to-clear');
            const err = { response: { status: 401 }, config: { url: '/target' } };

            // Mock refresh post failure
            mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh expired'));

            try { await onRejected(err); } catch { /* expected */ }

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:auth-failure' }));
        });

        test('handles refresh success but missing token in response', async () => {
            const [, onRejected] = getResponseInterceptor();
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

            const err = { response: { status: 401 }, config: { url: '/target' } };

            // Mock refresh post success but empty data
            mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

            try { await onRejected(err); } catch { /* expected */ }

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:auth-failure' }));
        });
    });
});
