/**
 * @jest-environment node
 */
import { GET } from '@/app/api/stories/[slug]/history/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

const mockDbQuery = db.query as jest.Mock;

describe('GET /api/stories/[slug]/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string) => {
    return new NextRequest(`http://localhost:3000/api/stories/${slug}/history`, {
      method: 'GET',
    });
  };

  it('should return revision history', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      {
        revisionId: 3,
        parentId: 2,
        date: new Date('2024-01-20'),
        changeMessage: 'Added new section',
        revStatus: 'published',
        userId: 1,
        username: 'testuser',
      },
      {
        revisionId: 2,
        parentId: 1,
        date: new Date('2024-01-15'),
        changeMessage: 'Fixed typos',
        revStatus: 'published',
        userId: 1,
        username: 'testuser',
      },
      {
        revisionId: 1,
        parentId: null,
        date: new Date('2024-01-10'),
        changeMessage: 'Initial creation',
        revStatus: 'published',
        userId: 1,
        username: 'testuser',
      },
    ]]);

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data[0].isCurrent).toBe(true);
    expect(data[1].isCurrent).toBe(false);
    expect(data[0].revisionId).toBe('3');
  });

  it('should return empty array if no revisions found', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('nonexistent-story');
    const params = Promise.resolve({ slug: 'nonexistent-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
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
