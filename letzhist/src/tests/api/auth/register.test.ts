/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/register/route';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const mockDbQuery = db.query as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockJwtSign = (jwt as any).sign as jest.Mock;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  const createRequest = (body: object) => {
    return new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if username is missing', async () => {
    const req = createRequest({ email: 'test@example.com', password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing fields.');
  });

  it('should return 400 if email is missing', async () => {
    const req = createRequest({ username: 'testuser', password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing fields.');
  });

  it('should return 400 if password is missing', async () => {
    const req = createRequest({ username: 'testuser', email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing fields.');
  });

  it('should return 409 if email is already in use', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      { id_pk: 1, username: 'otheruser', email: 'test@example.com' }
    ]]);

    const req = createRequest({ 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Email already in use.');
  });

  it('should return 409 if username is already in use', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      { id_pk: 1, username: 'testuser', email: 'other@example.com' }
    ]]);

    const req = createRequest({ 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Username already in use.');
  });

  it('should return 500 if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should create user and return 201 on success', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]); // Check uniqueness
    mockBcryptHash.mockResolvedValueOnce('hashed_password');
    mockDbQuery.mockResolvedValueOnce([{ insertId: 1 }]); // Insert user
    mockDbQuery.mockResolvedValueOnce([{}]); // Audit log
    mockJwtSign.mockReturnValueOnce('test-jwt-token');

    const req = createRequest({ 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.id).toBe('1');
    expect(data.token).toBe('test-jwt-token');
  });

  it('should return 500 on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest({ 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error.');
  });
});
