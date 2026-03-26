import themeReducer, { setTheme, toggleTheme, selectTheme } from '../../../store/slices/themeSlice';
import { type RootState } from '../../../store';

describe('themeSlice', () => {
    const initialState = { mode: 'light' as const };

    test('should return initial state', () => {
        expect(themeReducer(undefined, { type: 'unknown' })).toEqual({
            mode: expect.stringMatching(/light|dark/),
        });
    });

    test('should handle setTheme', () => {
        const actual = themeReducer(initialState, setTheme('dark'));
        expect(actual.mode).toBe('dark');
    });

    test('should handle toggleTheme', () => {
        let actual = themeReducer(initialState, toggleTheme());
        expect(actual.mode).toBe('dark');
        actual = themeReducer(actual, toggleTheme());
        expect(actual.mode).toBe('light');
    });

    test('selectTheme should return mode', () => {
        const state = { theme: { mode: 'dark' } } as RootState;
        expect(selectTheme(state)).toBe('dark');
    });

    describe('Initialization logic', () => {
        const originalLocalStorage = Object.getPrototypeOf(localStorage);
        const originalMatchMedia = window.matchMedia;

        beforeEach(() => {
            jest.resetModules();
        });

        afterAll(() => {
            Object.setPrototypeOf(localStorage, originalLocalStorage);
            window.matchMedia = originalMatchMedia;
        });

        test('should initialize with light theme if stored in localStorage', () => {
            jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
            // @ts-expect-error - require() is used for module isolation
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const freshReducer = require('../../../store/slices/themeSlice').default;
            const state = freshReducer(undefined, { type: 'INIT' });
            expect(state.mode).toBe('light');
        });

        test('should initialize with dark theme if prefers-color-scheme is dark', () => {
            jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));

            // @ts-expect-error - require() is used for module isolation
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const freshReducer = require('../../../store/slices/themeSlice').default;
            const state = freshReducer(undefined, { type: 'INIT' });
            expect(state.mode).toBe('dark');
        });
    });
});
