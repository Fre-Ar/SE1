/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/users/[id]/promote/route';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const mockDbQuery = db.query as jest.Mock;
const mockJwtVerify = jwt.verify as jest.Mock;

describe('POST /api/admin/users/[id]/promote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  const createRequest = (id: string, options: { token?: string; useHeader?: boolean } = {}) => {
    const headers: Record<string, string> = {};
    
    if (options.token && options.useHeader) {
      headers['authorization'] = `Bearer ${options.token}`;
    }

    const req = new NextRequest(`http://localhost:3000/api/admin/users/${id}/promote`, {
      method: 'POST',
      headers,
    });

    // Mock cookie for token
    if (options.token && !options.useHeader) {
      Object.defineProperty(req, 'cookies', {
        value: {
          get: jest.fn().mockImplementation((name: string) => {
            if (name === 'auth_token') return { value: options.token };
            return undefined;
          }),
        },
      });
    }

    return req;
  };

  it('should return 401 if no token provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/users/2/promote', {
      method: 'POST',
    });
    Object.defineProperty(req, 'cookies', {
      value: { get: jest.fn().mockReturnValue(undefined) },
    });

    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized - no token provided');
  });

  it('should return 401 if token is invalid', async () => {
    mockJwtVerify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const req = createRequest('2', { token: 'invalid-token', useHeader: true });
    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized - invalid token');
  });

  it('should return 500 if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;

    const req = createRequest('2', { token: 'test-token', useHeader: true });
    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should return 403 if user is not admin', async () => {
    mockJwtVerify.mockReturnValueOnce({ userId: 1 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator' }]]);

    const req = createRequest('2', { token: 'test-token', useHeader: true });
    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - only admins can promote users');
  });

  it('should return 400 for invalid user ID', async () => {
    mockJwtVerify.mockReturnValueOnce({ userId: 1 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin' }]]);

    const req = createRequest('invalid', { token: 'test-token', useHeader: true });
    const params = { id: 'invalid' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid user ID');
  });

  it('should return 404 if target user not found', async () => {
    mockJwtVerify.mockReturnValueOnce({ userId: 1 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin' }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('999', { token: 'test-token', useHeader: true });
    const params = { id: '999' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 400 if user is already moderator or admin', async () => {
    mockJwtVerify.mockReturnValueOnce({ userId: 1 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin' }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'mod', role: 'moderator' }]]);

    const req = createRequest('2', { token: 'test-token', useHeader: true });
    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User is already a moderator or admin');
  });

  it('should promote user to moderator successfully', async () => {
    mockJwtVerify.mockReturnValueOnce({ userId: 1 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin' }]]);
    mockDbQuery.mockResolvedValueOnce([[{ id_pk: 2, username: 'contributor1', role: 'contributor' }]]);
    mockDbQuery.mockResolvedValueOnce([{}]); // Update query
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest('2', { token: 'test-token', useHeader: true });
    const params = { id: '2' };
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('promoted');
    expect(data.user.role).toBe('moderator');
  });
});
