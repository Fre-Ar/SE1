/**
 * @jest-environment node
 */
import { GET } from '@/app/api/auth/me/route';
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

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });
  };

  it('should return user profile on valid token', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        is_muted: false,
        muted_until: null,
        is_banned: false,
        created_at: new Date('2024-01-01'),
        last_login: new Date('2024-01-15'),
      }
    ]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe(1);
    expect(data.user.username).toBe('testuser');
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.role).toBe('contributor');
  });

  it('should return 404 if user is not found in database', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '999', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 403 if user is banned', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        username: 'banneduser',
        email: 'banned@example.com',
        role: 'contributor',
        is_muted: false,
        muted_until: null,
        is_banned: true,
        created_at: new Date('2024-01-01'),
        last_login: new Date('2024-01-15'),
      }
    ]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Account suspended');
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
