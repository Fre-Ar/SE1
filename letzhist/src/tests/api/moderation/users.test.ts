/**
 * @jest-environment node
 */
import { GET } from '@/app/api/moderation/users/route';
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

describe('GET /api/moderation/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest(`http://localhost:3000/api/moderation/users?${searchParams.toString()}`, {
      method: 'GET',
    });
  };

  it('should return 403 if user is not moderator or admin', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'contributor', id_pk: 1 }]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - insufficient role privileges');
  });

  it('should return users list for moderator', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 2 }]]); // Count query
    mockDbQuery.mockResolvedValueOnce([[ // Users query
      {
        id_pk: 1,
        username: 'user1',
        email: 'user1@example.com',
        role: 'contributor',
        is_banned: 0,
        is_muted: 0,
        muted_until: null,
        created_at: new Date('2024-01-01'),
        last_login: new Date('2024-01-15'),
      },
      {
        id_pk: 2,
        username: 'user2',
        email: 'user2@example.com',
        role: 'contributor',
        is_banned: 1,
        is_muted: 0,
        muted_until: null,
        created_at: new Date('2024-01-02'),
        last_login: null,
      },
    ]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].username).toBe('user1');
    expect(data.data[1].isBanned).toBe(true);
    expect(data.meta.total).toBe(2);
  });

  it('should search users by username', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'contributor',
        is_banned: 0,
        is_muted: 0,
        muted_until: null,
        created_at: new Date('2024-01-01'),
        last_login: new Date('2024-01-15'),
      },
    ]]);

    const req = createRequest({ query: 'test' });
    const response = await GET(req);

    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('username LIKE ?'),
      expect.arrayContaining(['%test%'])
    );
  });

  it('should filter users by role', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 2,
        username: 'mod1',
        email: 'mod@example.com',
        role: 'moderator',
        is_banned: 0,
        is_muted: 0,
        muted_until: null,
        created_at: new Date('2024-01-02'),
        last_login: new Date('2024-01-10'),
      },
    ]]);

    const req = createRequest({ role: 'moderator' });
    const response = await GET(req);

    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('role = ?'),
      expect.arrayContaining(['moderator'])
    );
  });

  it('should paginate results', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 100 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ page: '3', limit: '20' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.page).toBe(3);
    expect(data.meta.limit).toBe(20);
    expect(data.meta.totalPages).toBe(5);
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
