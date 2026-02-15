import { getDeviceFingerprint, getCachedDeviceFingerprint, clearDeviceFingerprint } from '../../services/deviceFingerprint';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

jest.mock('@fingerprintjs/fingerprintjs');

describe('deviceFingerprint service', () => {
    const mockFp = {
        get: jest.fn().mockResolvedValue({ visitorId: 'test-visitor-id' }),
    };

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        clearDeviceFingerprint();
        (FingerprintJS.load as jest.Mock).mockResolvedValue(mockFp);
    });

    test('getDeviceFingerprint returns visitorId and caches it', async () => {
        const id = await getDeviceFingerprint();
        expect(id).toBe('test-visitor-id');
        expect(localStorage.getItem('deviceFingerprint')).toBe('test-visitor-id');
        expect(FingerprintJS.load).toHaveBeenCalledTimes(1);
    });

    test('getDeviceFingerprint returns same promise when called concurrently', async () => {
        const p1 = getDeviceFingerprint();
        const p2 = getDeviceFingerprint();
        expect(p1).toBe(p2);
        const [id1, id2] = await Promise.all([p1, p2]);
        expect(id1).toBe(id2);
        expect(FingerprintJS.load).toHaveBeenCalledTimes(1);
    });

    test('getDeviceFingerprint returns fallback ID on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (FingerprintJS.load as jest.Mock).mockRejectedValue(new Error('Failed to load'));

        const id = await getDeviceFingerprint();
        expect(id).toMatch(/^fallback-/);
        expect(localStorage.getItem('deviceFingerprint')).toContain('fallback-');
        consoleSpy.mockRestore();
    });

    test('getCachedDeviceFingerprint returns value from localStorage', () => {
        localStorage.setItem('deviceFingerprint', 'cached-id');
        expect(getCachedDeviceFingerprint()).toBe('cached-id');
    });

    test('clearDeviceFingerprint removes item from localStorage', () => {
        localStorage.setItem('deviceFingerprint', 'to-be-cleared');
        clearDeviceFingerprint();
        expect(localStorage.getItem('deviceFingerprint')).toBeNull();
    });
});
