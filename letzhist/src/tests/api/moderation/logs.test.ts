/**
 * @jest-environment node
 */
import { GET } from '@/app/api/moderation/logs/route';
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

describe('GET /api/moderation/logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest(`http://localhost:3000/api/moderation/logs?${searchParams.toString()}`, {
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

  it('should return audit logs for moderator', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 2 }]]); // Count query
    mockDbQuery.mockResolvedValueOnce([[ // Logs query
      {
        id_pk: 1,
        action: 'user.ban',
        target_type: 'user',
        target_id: 5,
        target_name: 'spammer',
        reason: 'Repeated violations',
        timestamp: new Date('2024-01-15'),
        actor_id: 1,
        actor_username: 'moderator1',
        actor_role: 'moderator',
      },
      {
        id_pk: 2,
        action: 'comment.hide',
        target_type: 'comment',
        target_id: 10,
        target_name: 'Comment: Spam...',
        reason: 'Spam content',
        timestamp: new Date('2024-01-14'),
        actor_id: 1,
        actor_username: 'moderator1',
        actor_role: 'moderator',
      },
    ]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].action).toBe('user.ban');
    expect(data.meta.total).toBe(2);
  });

  it('should filter logs by action', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        action: 'user.ban',
        target_type: 'user',
        target_id: 5,
        target_name: 'spammer',
        reason: 'Repeated violations',
        timestamp: new Date('2024-01-15'),
        actor_id: 1,
        actor_username: 'admin1',
        actor_role: 'admin',
      },
    ]]);

    const req = createRequest({ action: 'user.ban' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].action).toBe('user.ban');
  });

  it('should filter logs by targetType', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 0 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ targetType: 'story' });
    const response = await GET(req);

    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('a.target_type = ?'),
      expect.arrayContaining(['story'])
    );
  });

  it('should search by actor username', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        action: 'user.mute',
        target_type: 'user',
        target_id: 10,
        target_name: 'offender',
        reason: 'Harassment',
        timestamp: new Date('2024-01-10'),
        actor_id: 2,
        actor_username: 'moderator2',
        actor_role: 'moderator',
      },
    ]]);

    const req = createRequest({ actor: 'moderator2' });
    const response = await GET(req);

    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('u.username LIKE ?'),
      expect.arrayContaining(['%moderator2%'])
    );
  });

  it('should paginate results', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[{ total: 50 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ page: '2', limit: '10' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.page).toBe(2);
    expect(data.meta.limit).toBe(10);
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
    expect(data.error).toBe('Internal Server Error');
  });
});
