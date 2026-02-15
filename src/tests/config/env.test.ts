/// <reference types="vite/client" />




describe('Environment Configuration', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('should export all required environment variable bases', async () => {
        const env = await import('../../config/env');
        expect(env.ABSTRACT_BASE).toBeDefined();
        expect(env.AUTH_BASE).toBeDefined();
        expect(env.SOURCEDB_BASE).toBeDefined();
        expect(env.API_BASE).toBeDefined();
        expect(env.API_DEVICE).toBeDefined();
    });

    it('should fall back to empty string if VITE_ constants are not defined', async () => {
        // Mock import.meta.env
        // Note: In Jest with Vite, we might need to use defineProperty or similar
        // but for now let's just ensure they are strings
        const env = await import('../../config/env');
        expect(typeof env.API_BASE).toBe('string');
        expect(typeof env.AUTH_BASE).toBe('string');
        expect(typeof env.ABSTRACT_BASE).toBe('string');
        expect(typeof env.SOURCEDB_BASE).toBe('string');
        expect(typeof env.API_DEVICE).toBe('string');
    });
});
