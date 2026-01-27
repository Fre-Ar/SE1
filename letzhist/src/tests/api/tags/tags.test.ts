/**
 * @jest-environment node
 */
import { GET } from '@/app/api/tags/route';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

const mockDbQuery = db.query as jest.Mock;

describe('GET /api/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of tags sorted by usage', async () => {
    mockDbQuery.mockResolvedValueOnce([
      [
        { tag: 'history', count: 15 },
        { tag: 'luxembourg', count: 10 },
        { tag: 'culture', count: 5 },
      ],
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(['history', 'luxembourg', 'culture']);
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY tag'),
    );
  });

  it('should return empty array if no tags found', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return empty array on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual([]);
  });
});
