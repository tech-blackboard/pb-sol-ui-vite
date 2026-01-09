import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fingerprintPromise: Promise<string> | null = null;

/**
 * Initialize and get device fingerprint ID
 * Uses FingerprintJS to generate a stable browser fingerprint
 */
export async function getDeviceFingerprint(): Promise<string> {
    // Return cached promise if already initializing
    if (fingerprintPromise) {
        return fingerprintPromise;
    }

    // // Check localStorage cache first
    // const cached = localStorage.getItem('deviceFingerprint');
    // if (cached) {
    //     return cached;
    // }

    // Generate new fingerprint
    fingerprintPromise = (async () => {
        try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const visitorId = result.visitorId;

            // Cache in localStorage
            localStorage.setItem('deviceFingerprint', visitorId);

            return visitorId;
        } catch (error) {
            console.error('Failed to generate device fingerprint:', error);
            // Fallback to a random ID if fingerprinting fails
            const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceFingerprint', fallbackId);
            return fallbackId;
        }
    })();

    return fingerprintPromise;
}

/**
 * Get cached device fingerprint synchronously
 * Returns null if not yet initialized
 */
// console.log('-----device fingerprint', localStorage.getItem('deviceFingerprint'))
export function getCachedDeviceFingerprint(): string | null {
    console.log('-----device in function  fingerprint', localStorage.getItem('deviceFingerprint'))
    return localStorage.getItem('deviceFingerprint');
}

/**
 * Clear device fingerprint cache
 * Useful for testing or logout
 */
export function clearDeviceFingerprint(): void {
    localStorage.removeItem('deviceFingerprint');
    fingerprintPromise = null;
}
