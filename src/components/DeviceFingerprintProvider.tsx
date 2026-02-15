import React, { useEffect, useState } from 'react';
import { getDeviceFingerprint } from '../services/deviceFingerprint';

export const DeviceFingerprintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize device fingerprint on mount
        getDeviceFingerprint()
            .then((fingerprint) => {
                console.log('Device fingerprint initialized:', fingerprint);
                setInitialized(true);
            })
            .catch((error) => {
                console.error('Failed to initialize device fingerprint:', error);
                setInitialized(true); // Still render children even if fingerprinting fails
            });
    }, []);

    // Only render children after fingerprint is initialized
    if (!initialized) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'sans-serif'
            }}>
                <div>Initializing security...</div>
            </div>
        );
    }

    return <>{children}</>;
};
