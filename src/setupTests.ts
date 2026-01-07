import '@testing-library/jest-dom'
jest.mock('./config/env', () => ({
    ABSTRACT_BASE: 'http://test-api',
    AUTH_BASE: 'http://test-api',
    SOURCEDB_BASE: 'http://test-api',
    API_BASE: 'http://test-api',
  }))
  