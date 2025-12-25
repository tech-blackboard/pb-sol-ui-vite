import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

    // ✅ COVERAGE CONFIG
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    collectCoverageFrom: [
        'src/components/Header.tsx'
    ],

    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.jest.json'
            }
        ]
    }
}

export default config
