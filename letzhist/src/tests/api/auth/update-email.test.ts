/**
 * @jest-environment node
 */
import { PUT } from '@/app/api/auth/update-email/route';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/utils';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  getUserIdFromRequest: jest.fn(),
}));

const mockDbQuery = db.query as jest.Mock;
const mockGetUserIdFromRequest = getUserIdFromRequest as jest.Mock;

describe('PUT /api/auth/update-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/auth/update-email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if email is missing', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({});
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('should return 400 if email format is invalid', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({ email: 'invalid-email' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should return 400 if email is already in use', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2 }]]); // Email exists

    const req = createRequest({ email: 'existing@example.com' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email already in use');
  });

  it('should update email successfully', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]); // No existing email
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        username: 'testuser',
        email: 'newemail@example.com',
        role: 'contributor',
        is_muted: false,
        muted_until: null,
      }
    ]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest({ email: 'newemail@example.com' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Email updated successfully');
    expect(data.user.email).toBe('newemail@example.com');
  });

  it('should return 404 if user not found after update', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]); // No existing email
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([[]]); // User not found

    const req = createRequest({ email: 'newemail@example.com' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest({ email: 'newemail@example.com' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
