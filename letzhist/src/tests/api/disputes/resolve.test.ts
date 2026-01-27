/**
 * @jest-environment node
 */
import { POST } from '@/app/api/disputes/[id]/resolve/route';
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

describe('POST /api/disputes/[id]/resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (id: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/disputes/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 403 if user is not moderator or admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'contributor', id_pk: 1 }]]);

    const req = createRequest('1', { status: 'resolved', notes: 'Done' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - insufficient role privileges');
  });

  it('should return 400 if status is invalid', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);

    const req = createRequest('1', { status: 'invalid_status', notes: 'Done' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid status');
  });

  it('should return 404 if dispute not found', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('999', { status: 'resolved', notes: 'Done' });
    const params = Promise.resolve({ id: '999' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Dispute not found');
  });

  it('should set dispute to under_review', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ target_id: 1, target_type: 'comment', category: 'spam' }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1', { status: 'under_review' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('under_review');
  });

  it('should resolve dispute with notes', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ target_id: 1, target_type: 'story', category: 'accuracy' }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1', { status: 'resolved', notes: 'Content verified as accurate' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('resolved');
  });

  it('should dismiss dispute', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ target_id: 1, target_type: 'comment', category: 'other' }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('1', { status: 'dismissed', notes: 'Not a valid report' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('dismissed');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('1', { status: 'resolved', notes: 'Done' });
    const params = Promise.resolve({ id: '1' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
