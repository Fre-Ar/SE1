/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route';
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
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const mockDbQuery = db.query as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockJwtSign = (jwt as any).sign as jest.Mock;

describe('POST /api/auth/login', () => {
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
    return new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if email is missing', async () => {
    const req = createRequest({ password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing email or password');
  });

  it('should return 400 if password is missing', async () => {
    const req = createRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing email or password');
  });

  it('should return 401 if user is not found', async () => {
    mockDbQuery.mockResolvedValueOnce([[]]);

    const req = createRequest({ email: 'notfound@example.com', password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 if password does not match', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      { id_pk: 1, username: 'testuser', password_hash: 'hashedpassword', role: 'contributor' }
    ]]);
    mockBcryptCompare.mockResolvedValueOnce(false);

    const req = createRequest({ email: 'test@example.com', password: 'wrongpassword' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 500 if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;

    mockDbQuery.mockResolvedValueOnce([[
      { id_pk: 1, username: 'testuser', password_hash: 'hashedpassword', role: 'contributor' }
    ]]);
    mockBcryptCompare.mockResolvedValueOnce(true);
    mockDbQuery.mockResolvedValueOnce([{}]); // audit log

    const req = createRequest({ email: 'test@example.com', password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should redirect and set cookie on successful login', async () => {
    mockDbQuery.mockResolvedValueOnce([[
      { id_pk: 1, username: 'testuser', password_hash: 'hashedpassword', role: 'contributor' }
    ]]);
    mockBcryptCompare.mockResolvedValueOnce(true);
    mockDbQuery.mockResolvedValueOnce([{}]); // audit log
    mockJwtSign.mockReturnValueOnce('test-jwt-token');

    const req = createRequest({ email: 'test@example.com', password: 'password123' });
    const response = await POST(req);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/');
    
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('auth_token=test-jwt-token');
  });

  it('should return 500 on database error', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

    const req = createRequest({ email: 'test@example.com', password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
