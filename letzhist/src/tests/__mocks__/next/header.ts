export const headers = jest.fn(() => ({
  get: jest.fn(name => {
    if (name === 'authorization') {
      return 'Bearer mock-token'; // Example mock
    }
    return undefined;
  }),
  // Add other methods you use (e.g., has, entries)
}));

export const cookies = jest.fn(() => ({
  get: jest.fn((name) => {
      if (name === 'session-id') return { value: 'mock-session-id' };
      return undefined;
  }),
  // Add other methods you use (e.g., set, delete)
}));