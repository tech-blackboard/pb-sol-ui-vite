import '@testing-library/jest-dom'
jest.mock('./config/env', () => ({
  ABSTRACT_BASE: 'http://test-api',
  AUTH_BASE: 'http://test-api',
  SOURCEDB_BASE: 'http://test-api',
  API_BASE: 'http://test-api',
  API_DEVICE: 'http://test-api',
}))
// Mock matchMedia for react-hot-toast and other libraries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
