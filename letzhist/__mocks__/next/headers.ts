// __mocks__/next/headers.ts

export const headers = jest.fn(() => ({
  get: jest.fn(name => {
    if (name === 'authorization') {
      return 'Bearer mock-token';
    }
    return undefined;
  }),
  has: jest.fn(),
  entries: jest.fn(() => []),
}));

export const cookies = jest.fn(() => ({
  get: jest.fn((name) => {
    if (name === 'auth_token') return { value: 'mock-auth-token' };
    return undefined;
  }),
  set: jest.fn(),
  delete: jest.fn(),
}));
