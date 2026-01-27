/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/stories/[slug]/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));

const mockDbQuery = db.query as jest.Mock;
const mockGetConnection = db.getConnection as jest.Mock;

describe('GET /api/stories/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string, params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() 
      ? `http://localhost:3000/api/stories/${slug}?${searchParams.toString()}`
      : `http://localhost:3000/api/stories/${slug}`;
    return new NextRequest(url, { method: 'GET' });
  };

  it('should return story with comments', async () => {
    // Mock story query
    mockDbQuery.mockResolvedValueOnce([[
      {
        storyId: 1,
        revisionId: 1,
        title: 'Test Story',
        subtitle: 'A subtitle',
        slug: 'test-story',
        body: '# Test Story\n\nContent here...',
        leadImage: null,
        tags: 'history,luxembourg',
        revisionCreatedAt: new Date('2024-01-15'),
        authorId: 1,
        authorUsername: 'testuser',
      },
    ]]);
    // Mock comments query
    mockDbQuery.mockResolvedValueOnce([[
      {
        id_pk: 1,
        story_fk: 1,
        revision_fk: 1,
        parentId_fk: null,
        user_fk: 2,
        body: 'Great story!',
        created_at: new Date('2024-01-16'),
        status: 'visible',
        username: 'commenter',
      },
    ]]);

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Story');
    expect(data.slug).toBe('test-story');
    expect(data.discussion).toHaveLength(1);
    expect(data.author.username).toBe('testuser');
  });

  it('should return 404 if story not found', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('nonexistent-story');
    const params = Promise.resolve({ slug: 'nonexistent-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Story or revision not found');
  });

  it('should fetch specific revision when revisionId is provided', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      {
        storyId: 1,
        revisionId: 5,
        title: 'Test Story v5',
        subtitle: null,
        slug: 'test-story',
        body: 'Updated content',
        leadImage: null,
        tags: 'history',
        revisionCreatedAt: new Date('2024-02-01'),
        authorId: 1,
        authorUsername: 'testuser',
      },
    ]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('test-story', { revisionId: '5' });
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revisionId).toBe('5');
    expect(data.title).toBe('Test Story v5');
  });

  it('should return 500 on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});

describe('PUT /api/stories/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string, body: object) => {
    return new NextRequest(`http://localhost:3000/api/stories/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should create new revision on update', async () => {
    // Mock db.query for the PUT handler (it doesn't use connection pooling)
    mockDbQuery.mockResolvedValueOnce([[{ storyId: 1, parentId: 1 }]]); // Find story
    mockDbQuery.mockResolvedValueOnce([{ insertId: 2 }]); // Insert revision
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log
    // Mock the GET call that happens at the end (for returning updated story)
    mockDbQuery.mockResolvedValueOnce([[
      {
        storyId: 1,
        revisionId: 2,
        title: 'Updated Story',
        subtitle: null,
        slug: 'test-story',
        body: 'Updated content',
        leadImage: null,
        tags: null,
        revisionCreatedAt: new Date(),
        authorId: 1,
        authorUsername: 'testuser',
      },
    ]]);
    mockDbQuery.mockResolvedValueOnce([[]]); // Comments

    const req = createRequest('test-story', {
      authorId: '1',
      title: 'Updated Story',
      body: 'Updated content',
      changeMessage: 'Fixed typos',
    });
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revisionId).toBeDefined();
  });
});
