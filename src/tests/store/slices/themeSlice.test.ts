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
});
