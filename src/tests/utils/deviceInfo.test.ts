import { getBrowserAndOS } from '../../utils/deviceInfo';

describe('deviceInfo utility', () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
    });

    const setUserAgent = (ua: string) => {
        Object.defineProperty(navigator, 'userAgent', {
            value: ua,
            configurable: true,
        });
    };

    test('detects Chrome on Windows', () => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        expect(getBrowserAndOS()).toEqual({ browser: 'Chrome', os: 'Windows' });
    });

    test('detects Firefox on MacOS', () => {
        setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0');
        expect(getBrowserAndOS()).toEqual({ browser: 'Firefox', os: 'MacOS' });
    });

    test('detects Edge on Windows', () => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0');
        expect(getBrowserAndOS()).toEqual({ browser: 'Edge', os: 'Windows' });
    });

    test('detects Safari on iOS', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
        expect(getBrowserAndOS()).toEqual({ browser: 'Safari', os: 'iOS' });
    });

    test('detects Linux', () => {
        setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        expect(getBrowserAndOS()).toEqual({ browser: 'Chrome', os: 'Linux' });
    });

    test('detects Android', () => {
        setUserAgent('Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/115.0 Firefox/115.0');
        expect(getBrowserAndOS()).toEqual({ browser: 'Firefox', os: 'Android' });
    });

    test('returns Unknown for unrecognized user agent', () => {
        setUserAgent('Unknown agent');
        expect(getBrowserAndOS()).toEqual({ browser: 'Unknown', os: 'Unknown' });
    });
});
