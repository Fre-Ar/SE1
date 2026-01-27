/**
 * @jest-environment node
 */
import { POST } from '@/app/api/moderation/users/[id]/ban/route';
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

describe('POST /api/moderation/users/[id]/ban', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (id: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/moderation/users/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 403 if user is not moderator or admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'contributor', id_pk: 1 }]]);

    const req = createRequest('2', { reason: 'Spam' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - insufficient role privileges');
  });

  it('should return 400 for invalid user ID', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);

    const req = createRequest('invalid', { reason: 'Spam' });
    const params = Promise.resolve({ id: 'invalid' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid User ID');
  });

  it('should return 404 if target user not found', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('999', { reason: 'Spam' });
    const params = Promise.resolve({ id: '999' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 400 if trying to ban self', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 1, status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 1, username: 'mod', role: 'moderator', is_banned: false }]]);

    const req = createRequest('1', { reason: 'Self-ban' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('You cannot ban yourself.');
  });

  it('should return 403 if trying to ban admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'admin1', role: 'admin', is_banned: false }]]);

    const req = createRequest('2', { reason: 'Trying to ban admin' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot ban an administrator.');
  });

  it('should return 409 if user is already banned', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'spammer', role: 'contributor', is_banned: true }]]);

    const req = createRequest('2', { reason: 'Already banned' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User is already banned.');
  });

  it('should return 400 if reason is too short', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'user', role: 'contributor', is_banned: false }]]);

    const req = createRequest('2', { reason: 'abc' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('A valid reason (min 5 chars) is required.');
  });

  it('should ban user successfully', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'spammer', role: 'contributor', is_banned: false }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update user
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { reason: 'Repeated spam violations' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('spammer');
    expect(data.user.isBanned).toBe(true);
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('2', { reason: 'Spam' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
