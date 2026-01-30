/**
 * @jest-environment node
 */
import { POST } from '@/app/api/moderation/users/[id]/mute/route';
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

describe('POST /api/moderation/users/[id]/mute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (id: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/moderation/users/${id}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 403 if user is not moderator or admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'contributor', id_pk: 1 }]]);

    const req = createRequest('2', { reason: 'Harassment', durationHours: 24 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - insufficient role privileges');
  });

  it('should return 400 for invalid user ID', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);

    const req = createRequest('invalid', { reason: 'Harassment', durationHours: 24 });
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

    const req = createRequest('999', { reason: 'Harassment', durationHours: 24 });
    const params = Promise.resolve({ id: '999' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 400 if trying to mute self', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 1, status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 1, username: 'mod', role: 'moderator', is_banned: false }]]);

    const req = createRequest('1', { reason: 'Self-mute', durationHours: 24 });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('You cannot mute yourself.');
  });

  it('should return 403 if trying to mute admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'admin1', role: 'admin', is_banned: false }]]);

    const req = createRequest('2', { reason: 'Trying to mute admin', durationHours: 24 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot mute an administrator.');
  });

  it('should return 400 if user is banned', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'user', role: 'contributor', is_banned: true }]]);

    const req = createRequest('2', { reason: 'Already banned', durationHours: 24 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User is banned. Unban them before muting.');
  });

  it('should return 400 if reason is too short', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'user', role: 'contributor', is_banned: false }]]);

    const req = createRequest('2', { reason: 'abc', durationHours: 24 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('A valid reason (min 5 chars) is required.');
  });

  it('should mute user for specified duration', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'offender', role: 'contributor', is_banned: false }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update user
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { reason: 'Repeated harassment', durationHours: 48 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('48 hours');
  });

  it('should mute user permanently when no duration specified', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'offender', role: 'contributor', is_banned: false }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update user
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { reason: 'Severe violations - permanent mute' });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('permanently');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('2', { reason: 'Harassment', durationHours: 24 });
    const params = Promise.resolve({ id: '2' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
