/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/disputes/route';
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

describe('GET /api/disputes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest(`http://localhost:3000/api/disputes?${searchParams.toString()}`, {
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

  it('should return disputes for moderator', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        target_id: 1,
        target_type: 'comment',
        reason: 'Spam content',
        currentStatus: 'open',
        category: 'spam',
        created_at: new Date('2024-01-15'),
        contextRevision_fk: null,
        resolvedBy_fk: null,
        resolvedAt: null,
        resolutionNotes: null,
        reporter_id: 2,
        reporter_username: 'reporter',
        resolver_username: null,
        comment_body: 'Spam text',
        comment_author: 'spammer',
        story_slug: 'test-story',
        story_title: 'Test Story',
        story_author: 'author',
      },
    ]]);
    mockDbQuery.mockResolvedValueOnce([[{ totalItems: 1 }]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].category).toBe('spam');
    expect(data.meta.totalItems).toBe(1);
  });

  it('should filter disputes by status', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);
    mockDbQuery.mockResolvedValueOnce([[{ totalItems: 0 }]]);

    const req = createRequest({ status: 'resolved' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('currentStatus = ?'),
      expect.arrayContaining(['resolved'])
    );
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 1 }]]);
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

describe('POST /api/disputes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if required fields are missing', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({ targetId: 1 });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields.');
  });

  it('should return 400 if category is invalid', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });

    const req = createRequest({
      targetId: 1,
      targetType: 'comment',
      category: 'invalid_category',
      reason: 'Test reason',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid category.');
  });

  it('should create dispute and return 201', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([{ insertId: 1 }]); // Insert dispute
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log

    const req = createRequest({
      targetId: 1,
      targetType: 'comment',
      category: 'spam',
      reason: 'This is spam content',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.disputeId).toBe(1);
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest({
      targetId: 1,
      targetType: 'comment',
      category: 'spam',
      reason: 'This is spam',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
