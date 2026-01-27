import { render, screen, waitFor } from '@testing-library/react';
import { DeviceFingerprintProvider } from '../../components/DeviceFingerprintProvider';
import { getDeviceFingerprint } from '../../services/deviceFingerprint';

jest.mock('../../services/deviceFingerprint', () => ({
    getDeviceFingerprint: jest.fn(),
}));

describe('DeviceFingerprintProvider', () => {
    const mockGetDeviceFingerprint = getDeviceFingerprint as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows loading state initially and then renders children', async () => {
        let resolveFingerprint: (value: string) => void;
        const fingerprintPromise = new Promise<string>((resolve) => {
            resolveFingerprint = resolve;
        });
        mockGetDeviceFingerprint.mockReturnValue(fingerprintPromise);

        render(
            <DeviceFingerprintProvider>
                <div data-testid="child">App Content</div>
            </DeviceFingerprintProvider>
        );

        expect(screen.getByText('Initializing security...')).toBeInTheDocument();
        expect(screen.queryByTestId('child')).not.toBeInTheDocument();

        // @ts-expect-error - testing resolve promise
        resolveFingerprint('mock-fingerprint');

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
        expect(screen.queryByText('Initializing security...')).not.toBeInTheDocument();
    });

    test('renders children even if fingerprinting fails', async () => {
        mockGetDeviceFingerprint.mockRejectedValue(new Error('Fingerprint failed'));

        render(
            <DeviceFingerprintProvider>
                <div data-testid="child">App Content Special</div>
            </DeviceFingerprintProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
    });
});
