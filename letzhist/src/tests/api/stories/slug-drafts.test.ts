/**
 * @jest-environment node
 */
import { GET } from '@/app/api/stories/[slug]/drafts/route';
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

describe('GET /api/stories/[slug]/drafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string) => {
    return new NextRequest(`http://localhost:3000/api/stories/${slug}/drafts`, {
      method: 'GET',
    });
  };

  it('should return user drafts for a specific story', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[
      {
        revisionId: 5,
        title: 'Draft version 2',
        created_at: new Date('2024-01-20'),
        changeMessage: 'Adding more content',
      },
      {
        revisionId: 4,
        title: 'Draft version 1',
        created_at: new Date('2024-01-18'),
        changeMessage: 'Started draft',
      },
    ]]);

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].revisionId).toBe('5');
    expect(data[0].title).toBe('Draft version 2');
  });

  it('should return empty array if no drafts for story', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should return 500 on database error', async () => {
    mockGetUserIdFromRequest.mockReturnValueOnce({ value: '1', status: 200 });
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest('test-story');
    const params = Promise.resolve({ slug: 'test-story' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
