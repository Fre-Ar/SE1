/**
 * @jest-environment node
 */
import { PUT } from '@/app/api/auth/update-password/route';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/utils';
import bcrypt from 'bcrypt';
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

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockDbQuery = db.query as jest.Mock;
const mockGetUserIdFromRequest = getUserIdFromRequest as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

describe('PUT /api/auth/update-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if current password is missing', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({ newPassword: 'newpassword123' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Current password is required');
  });

  it('should return 400 if new password is missing', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({ currentPassword: 'oldpassword' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('New password is required');
  });

  it('should return 400 if new password is too short', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({ currentPassword: 'oldpassword', newPassword: 'short' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('New password must be at least 8 characters long');
  });

  it('should return 404 if user is not found', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '999', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 401 if current password is incorrect', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 1, password_hash: 'hashed_password' }]]);
    mockBcryptCompare.mockResolvedValueOnce(false);

    const req = createRequest({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Current password is incorrect');
  });

  it('should update password successfully', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 1, password_hash: 'old_hash', username: 'testuser' }]]);
    mockBcryptCompare.mockResolvedValueOnce(true);
    mockBcryptHash.mockResolvedValueOnce('new_hashed_password');
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password updated successfully');
    expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10);
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
