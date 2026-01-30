/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/admin/users/[id]/role/route';
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

describe('PATCH /api/admin/users/[id]/role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (id: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 403 if user is not admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);

    const req = createRequest('2', { role: 'moderator' });
    const params = Promise.resolve({ id: '2' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - insufficient role privileges');
  });

  it('should return 400 for invalid user ID', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);

    const req = createRequest('invalid', { role: 'moderator' });
    const params = Promise.resolve({ id: 'invalid' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  it('should return 400 if trying to change own role', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);

    const req = createRequest('1', { role: 'moderator' });
    const params = Promise.resolve({ id: '1' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot change your own role via this endpoint.');
  });

  it('should return 400 if role is invalid', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);

    const req = createRequest('2', { role: 'admin' });
    const params = Promise.resolve({ id: '2' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid role. Can only set 'contributor' or 'moderator'.");
  });

  it('should promote user to moderator', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { role: 'moderator' });
    const params = Promise.resolve({ id: '2' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.role).toBe('moderator');
  });

  it('should demote user to contributor', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { role: 'contributor' });
    const params = Promise.resolve({ id: '2' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.role).toBe('contributor');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('2', { role: 'moderator' });
    const params = Promise.resolve({ id: '2' });
    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
