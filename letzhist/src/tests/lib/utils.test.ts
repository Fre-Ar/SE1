/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock jsonwebtoken before importing the module
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { formatTag, unformatTag, getUserIdFromRequest, getRoleFromRequest } from '@/lib/utils';

const mockJwtVerify = jwt.verify as jest.Mock;
const mockDbQuery = db.query as jest.Mock;

describe('formatTag', () => {
  it('should convert spaces to underscores', () => {
    expect(formatTag('hello world')).toBe('hello_world');
  });

  it('should convert multiple spaces to single underscores', () => {
    expect(formatTag('hello   world')).toBe('hello_world');
  });

  it('should convert to lowercase', () => {
    expect(formatTag('Hello World')).toBe('hello_world');
  });

  it('should trim whitespace', () => {
    expect(formatTag('  hello world  ')).toBe('hello_world');
  });

  it('should handle mixed case and multiple spaces', () => {
    expect(formatTag('  HELLO   WORLD  ')).toBe('hello_world');
  });

  it('should handle single word', () => {
    expect(formatTag('hello')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(formatTag('')).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(formatTag('   ')).toBe('');
  });

  it('should handle tabs and newlines as spaces', () => {
    expect(formatTag('hello\tworld\ntest')).toBe('hello_world_test');
  });
});

describe('unformatTag', () => {
  it('should convert underscores to spaces', () => {
    expect(unformatTag('hello_world')).toBe('hello world');
  });

  it('should convert multiple underscores to single spaces', () => {
    expect(unformatTag('hello___world')).toBe('hello world');
  });

  it('should trim whitespace', () => {
    expect(unformatTag('  hello_world  ')).toBe('hello world');
  });

  it('should handle single word', () => {
    expect(unformatTag('hello')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(unformatTag('')).toBe('');
  });

  it('should handle string with only underscores', () => {
    expect(unformatTag('___')).toBe('');
  });

  it('should preserve case', () => {
    expect(unformatTag('Hello_World')).toBe('Hello World');
  });
});

describe('getUserIdFromRequest', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (token?: string): NextRequest => {
    const req = {
      cookies: {
        get: jest.fn().mockReturnValue(token ? { value: token } : undefined),
      },
    } as unknown as NextRequest;
    return req;
  };

  it('should return 401 when no token is provided', () => {
    const req = createMockRequest();
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(401);
    expect(result.error).toBe('Unauthorized - no token provided');
    expect(result.value).toBeUndefined();
  });

  it('should return 500 when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const req = createMockRequest('some-token');
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(500);
    expect(result.error).toBe('Server configuration error');
    expect(result.value).toBeUndefined();
  });

  it('should return 401 when token is invalid', () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = createMockRequest('invalid-token');
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(401);
    expect(result.error).toBe('Unauthorized - invalid token');
    expect(result.value).toBeUndefined();
  });

  it('should return 401 when token payload has no userId', () => {
    mockJwtVerify.mockReturnValue({ someOtherField: 'value' });

    const req = createMockRequest('valid-token');
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(401);
    expect(result.error).toBe('Invalid token payload');
    expect(result.value).toBeUndefined();
  });

  it('should return userId on valid token', () => {
    mockJwtVerify.mockReturnValue({ userId: '123' });

    const req = createMockRequest('valid-token');
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(200);
    expect(result.value).toBe('123');
    expect(result.error).toBeUndefined();
  });

  it('should return numeric userId when token contains number', () => {
    mockJwtVerify.mockReturnValue({ userId: 456 });

    const req = createMockRequest('valid-token');
    const result = getUserIdFromRequest(req);

    expect(result.status).toBe(200);
    expect(result.value).toBe(456);
    expect(result.error).toBeUndefined();
  });

  it('should verify token with correct secret', () => {
    mockJwtVerify.mockReturnValue({ userId: '123' });

    const req = createMockRequest('my-token');
    getUserIdFromRequest(req);

    expect(mockJwtVerify).toHaveBeenCalledWith('my-token', 'test-secret');
  });
});

describe('getRoleFromRequest', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (token?: string): NextRequest => {
    const req = {
      cookies: {
        get: jest.fn().mockReturnValue(token ? { value: token } : undefined),
      },
    } as unknown as NextRequest;
    return req;
  };

  it('should return error when no token provided', async () => {
    const req = createMockRequest();
    const result = await getRoleFromRequest(req);

    expect(result).toEqual({
      error: 'Unauthorized - no token provided',
      status: 401,
    });
  });

  it('should return error when token is invalid', async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = createMockRequest('invalid-token');
    const result = await getRoleFromRequest(req);

    expect(result).toEqual({
      error: 'Unauthorized - invalid token',
      status: 401,
    });
  });

  it('should return user role data on valid token', async () => {
    mockJwtVerify.mockReturnValue({ userId: '1' });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'admin', id_pk: 1 }]]);

    const req = createMockRequest('valid-token');
    const result = await getRoleFromRequest(req);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([[{ role: 'admin', id_pk: 1 }]]);
  });

  it('should query database with correct userId', async () => {
    mockJwtVerify.mockReturnValue({ userId: '42' });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'contributor', id_pk: 42 }]]);

    const req = createMockRequest('valid-token');
    await getRoleFromRequest(req);

    expect(mockDbQuery).toHaveBeenCalledWith(
      'SELECT  role, id_pk FROM users WHERE id_pk = ? LIMIT 1',
      ['42']
    );
  });

  it('should return moderator role', async () => {
    mockJwtVerify.mockReturnValue({ userId: '5' });
    mockDbQuery.mockResolvedValueOnce([[{ role: 'moderator', id_pk: 5 }]]);

    const req = createMockRequest('valid-token');
    const result = await getRoleFromRequest(req);

    expect(result).toEqual([[{ role: 'moderator', id_pk: 5 }]]);
  });

  it('should return empty array when user not found', async () => {
    mockJwtVerify.mockReturnValue({ userId: '999' });
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createMockRequest('valid-token');
    const result = await getRoleFromRequest(req);

    expect(result).toEqual([[]]);
  });
});
