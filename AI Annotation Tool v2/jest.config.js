const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/components/(.*)$': '<rootDir>/app/components/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    testMatch: [
        '<rootDir>/app/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/tests/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/tests/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)