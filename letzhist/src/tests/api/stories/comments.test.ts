/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/stories/[slug]/comments/route';
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

describe('GET /api/stories/[slug]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string) => {
    return new NextRequest(`http://localhost:3000/api/stories/${slug}/comments`, {
      method: 'GET',
    });
  };

  it('should return comments for a story', async () => {
    // Mock getStoryAndRevisionIds query
    mockDbQuery.mockResolvedValueOnce([[{ storyId: 1, revisionId: 1 }]]);
    // Mock comments query
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        story_fk: 1,
        revision_fk: 1,
        user_fk: 2,
        body: 'Great article!',
        created_at: new Date('2024-01-16'),
        username: 'commenter1',
        parentId_fk: null,
        status: 'visible',
      },
      {
        id_pk: 2,
        story_fk: 1,
        revision_fk: 1,
        user_fk: 3,
        body: 'Thanks for sharing!',
        created_at: new Date('2024-01-17'),
        username: 'commenter2',
        parentId_fk: 1,
        status: 'visible',
      },
    ]]);

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].body).toBe('Great article!');
    expect(data[1].parentId).toBe('1');
  });

  it('should return 404 if story not found', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('nonexistent-story');
    const params = Promise.resolve({ slug: 'nonexistent-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Story not found');
  });

  it('should return 500 on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server Error');
  });
});

describe('POST /api/stories/[slug]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/stories/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if body is empty', async () => {
    const req = createRequest('test-story', { body: '   ' });
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Body required');
  });

  it('should create comment and return 201', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ storyId: 1, revisionId: 1 }]]); // getStoryAndRevisionIds
    mockDbQuery.mockResolvedValueOnce([{ insertId: 5 }]); // Insert comment
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 5,
        story_fk: 1,
        revision_fk: 1,
        user_fk: 1,
        body: 'New comment',
        created_at: new Date('2024-01-20'),
        username: 'testuser',
        parentId_fk: null,
        status: 'visible',
      },
    ]]);

    const req = createRequest('test-story', { body: 'New comment' });
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('5');
    expect(data.body).toBe('New comment');
  });

  it('should return 404 if story not found', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('nonexistent-story', { body: 'Comment' });
    const params = Promise.resolve({ slug: 'nonexistent-story' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Story not found');
  });

  it('should create reply to existing comment', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[{ storyId: 1, revisionId: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([{ insertId: 6 }]);
    mockDbQuery.mockResolvedValueOnce([{}]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 6,
        story_fk: 1,
        revision_fk: 1,
        user_fk: 1,
        body: 'Reply to comment',
        created_at: new Date('2024-01-20'),
        username: 'testuser',
        parentId_fk: 5,
        status: 'visible',
      },
    ]]);

    const req = createRequest('test-story', { body: 'Reply to comment', parentId: '5' });
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await POST(req, { params });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.parentId).toBe('5');
  });
});
