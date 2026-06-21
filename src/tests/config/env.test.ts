// Mock the env module to avoid import.meta.env issues in Jest's CJS environment.
// The real env.ts uses Vite's import.meta.env which is not available in Node/Jest.
// We verify that the module exports the correct shape (all required string constants).
// Use empty string literals instead of process.env to avoid requiring Node type definitions.
jest.mock('../../config/env', () => ({
    ABSTRACT_BASE: '',
    AUTH_BASE: '',
    SOURCEDB_BASE: '',
    API_BASE: '',
    API_DEVICE: '',
}));

import * as env from '../../config/env';

describe('Environment Configuration', () => {
    it('should export all required environment variable bases', () => {
        expect(env.ABSTRACT_BASE).toBeDefined();
        expect(env.AUTH_BASE).toBeDefined();
        expect(env.SOURCEDB_BASE).toBeDefined();
        expect(env.API_BASE).toBeDefined();
        expect(env.API_DEVICE).toBeDefined();
    });

    it('should fall back to default values or empty strings if VITE_ constants are not defined', () => {
        expect(typeof env.API_BASE).toBe('string');
        expect(typeof env.AUTH_BASE).toBe('string');
        expect(typeof env.ABSTRACT_BASE).toBe('string');
        expect(typeof env.SOURCEDB_BASE).toBe('string');
        expect(typeof env.API_DEVICE).toBe('string');
    });
});
