/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/comments/[id]/route';
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

describe('DELETE /api/comments/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (id: string) => {
    return new NextRequest(`http://localhost:3000/api/comments/${id}`, {
      method: 'DELETE',
    });
  };

  it('should return 404 if comment not found', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('999');
    const params = Promise.resolve({ id: '999' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Not found');
  });

  it('should return 403 if user is not author or staff', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '2', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      { user_fk: 1, role: 'contributor', snippet: 'Test comment' }
    ]]);

    const req = createRequest('1');
    const params = Promise.resolve({ id: '1' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should soft delete comment as author', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 1, status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      { user_fk: 1, role: 'contributor', snippet: 'Test comment' }
    ]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update status
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1');
    const params = Promise.resolve({ id: '1' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('deleted_by_user');
  });

  it('should soft delete comment as moderator', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 2, status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      { user_fk: 1, role: 'moderator', snippet: 'Test comment' }
    ]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update status
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1');
    const params = Promise.resolve({ id: '1' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('hidden_by_mod');
  });

  it('should soft delete comment as admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 3, status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      { user_fk: 1, role: 'admin', snippet: 'Test comment' }
    ]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update status
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1');
    const params = Promise.resolve({ id: '1' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('hidden_by_mod');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: 1, status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('1');
    const params = Promise.resolve({ id: '1' });
    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
