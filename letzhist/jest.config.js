// jest.config.js

module.exports = {
  // You might need to add the 'transform' block here if you didn't put it in a separate Babel config:
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
   },

  setupFilesAfterEnv: ['./jest.setup.js'],

  moduleNameMapper: {
    // FIX: Add the path alias mapping for '@/'
    // This resolves "@/tests/utils" to "<rootDir>/src/tests/utils"
    '^@/(.*)$': '<rootDir>/src/$1', 
    
    // Existing mappers:
    '^next/headers$': '<rootDir>/__mocks__/next/headers.ts',
    '^next/cache$': '<rootDir>/__mocks__/next/cache.ts',
  },
  // testEnvironment: 'jsdom', 
};