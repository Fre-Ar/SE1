// jest.config.js (or .ts)

module.exports = {
  // ... other configurations
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    // This directs imports of next/headers and next/cache to your mocks
    '^next/headers$': '<rootDir>/__mocks__/next/headers.ts',
    '^next/cache$': '<rootDir>/__mocks__/next/cache.ts',
  },
  // Add other necessary environment configurations if using JSDOM for components
  // testEnvironment: 'jsdom', 
};