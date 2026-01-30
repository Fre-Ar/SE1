/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/stories/route';
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

describe('GET /api/stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest(`http://localhost:3000/api/stories?${searchParams.toString()}`, {
      method: 'GET',
    });
  };

  it('should return stories with pagination', async () => {
    // Mock count query
    mockDbQuery.mockResolvedValueOnce([[{ total: 2 }]]);
    // Mock stories query
    mockDbQuery.mockResolvedValueOnce([[
      {
        storyId: 1,
        storyCreatedAt: '2024-01-01',
        revisionId: 1,
        title: 'Test Story 1',
        slug: 'test-story-1',
        leadImage: null,
        tagList: 'history,luxembourg',
        lastEdited: '2024-01-15',
      },
      {
        storyId: 2,
        storyCreatedAt: '2024-01-02',
        revisionId: 2,
        title: 'Test Story 2',
        slug: 'test-story-2',
        leadImage: null,
        tagList: 'culture',
        lastEdited: '2024-01-16',
      },
    ]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.meta.total).toBe(2);
    expect(data.meta.page).toBe(1);
  });

  it('should filter stories by query', async () => {
    mockDbQuery.mockResolvedValueOnce([[{ total: 1 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      {
        storyId: 1,
        storyCreatedAt: '2024-01-01',
        revisionId: 1,
        title: 'Luxembourg History',
        slug: 'luxembourg-history',
        leadImage: null,
        tagList: 'history',
        lastEdited: '2024-01-15',
      },
    ]]);

    const req = createRequest({ query: 'luxembourg' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].title).toBe('Luxembourg History');
  });

  it('should sort stories by title ascending', async () => {
    mockDbQuery.mockResolvedValueOnce([[{ total: 2 }]]);
    mockDbQuery.mockResolvedValueOnce([[
      { storyId: 1, storyCreatedAt: '2024-01-01', revisionId: 1, title: 'A Story', slug: 'a-story', leadImage: null, tagList: null, lastEdited: '2024-01-15' },
      { storyId: 2, storyCreatedAt: '2024-01-02', revisionId: 2, title: 'B Story', slug: 'b-story', leadImage: null, tagList: null, lastEdited: '2024-01-16' },
    ]]);

    const req = createRequest({ sort: 'title_asc' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY r.title ASC'),
      expect.any(Array)
    );
  });

  it('should return empty array when no stories found', async () => {
    mockDbQuery.mockResolvedValueOnce([[{ total: 0 }]]);
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(0);
    expect(data.meta.total).toBe(0);
  });

  it('should return 500 on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});

describe('POST /api/stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if title is missing', async () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    mockGetConnection.mockResolvedValueOnce(mockConnection);

    const req = createRequest({
      authorId: '1',
      body: 'Story content',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title and Body are required');
  });

  it('should return 400 if body is missing', async () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    mockGetConnection.mockResolvedValueOnce(mockConnection);

    const req = createRequest({
      authorId: '1',
      title: 'Test Story',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title and Body are required');
  });

  it('should create story and return 200 on success', async () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert story
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert revision
        .mockResolvedValueOnce([{}]) // Insert tags
        .mockResolvedValueOnce([{}]), // Audit log
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    mockGetConnection.mockResolvedValueOnce(mockConnection);

    const req = createRequest({
      authorId: '1',
      title: 'Test Story',
      body: 'This is the story content',
      tags: ['history', 'luxembourg'],
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.storyId).toBeDefined();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });
});
