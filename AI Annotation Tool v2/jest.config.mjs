import nextJest from 'next/jest.js';

// Create Jest configuration using Next.js's built-in helper
const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
const config = {
    // Use jsdom to simulate a browser environment for React component tests
    testEnvironment: 'jest-environment-jsdom',

    // Setup files to run before each test
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Tell Jest where to find your test files
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)'
    ],

    // Module path aliases to match your Next.js import aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Collect coverage from these files
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
};

// Export the configuration wrapped by Next.js's helper
export default createJestConfig(config);