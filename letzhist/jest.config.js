// jest.config.js

module.exports = {
  // FIX: This section tells Jest to use babel-jest to transform both 
  // JavaScript (.js/.jsx) and TypeScript (.ts/.tsx) files.
  // This removes the 'as any' and 'as jest.Mock' syntax before parsing.
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  
  // PRESERVE: This was the fix for the previous 'expect is not defined' error
  setupFilesAfterEnv: ['./jest.setup.js'], 

  moduleNameMapper: {
    // Keep your existing module mappers
    '^next/headers$': '<rootDir>/__mocks__/next/headers.ts',
    '^next/cache$': '<rootDir>/__mocks__/next/cache.ts',
    // Add module alias support if needed (e.g., '@/')
    // '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Ensure Jest includes the TypeScript extensions when looking for modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // ... rest of your configurations
};