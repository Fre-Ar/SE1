// __mocks__/@/lib/db.ts

const mockQuery = jest.fn();

export const db = {
  query: mockQuery,
  // Add other methods used, e.g., end: jest.fn(),
};

export const mockDbQuery = mockQuery; // Export the mock function for easy testing