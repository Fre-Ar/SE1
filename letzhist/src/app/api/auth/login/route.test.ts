import { POST } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { mockDbQuery } from "@/tests/__mocks__/@/lib/db";


jest.mock('bcryptjs');
import bcrypt from 'bcryptjs';
const mockBcryptCompare = bcrypt.compare as jest.Mock;

jest.mock('jsonwebtoken');
import jwt from 'jsonwebtoken';
const mockJwtSign = (jwt as any).sign as jest.Mock;

const MOCK_USER = {
  id_pk: 101,
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedPassword123',
  role: 'user',
};
const MOCK_TOKEN = 'mock-jwt-token-12345';
const MOCK_PASSWORD = 'password123';

describe('POST /api/auth/login', () => {


  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.clearAllMocks();

    process.env = { ...OLD_ENV, JWT_SECRET: 'TEST_SECRET', JWT_EXPIRES_IN: '1h' };


    mockDbQuery.mockResolvedValueOnce([[MOCK_USER]]); 
    mockBcryptCompare.mockResolvedValue(true);      
    mockJwtSign.mockReturnValue(MOCK_TOKEN); 
  });

  afterAll(() => {
    process.env = OLD_ENV; 
  });


  it('should return a 302 redirect and set auth_token cookie on successful login', async () => {

    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { email: MOCK_USER.email, password: MOCK_PASSWORD }
    );


    const response = await POST(req);
    const setCookieHeader = response.headers.get('set-cookie');
    const locationHeader = response.headers.get('location');

    expect(response.status).toBe(302);
    expect(locationHeader).toBe('http://localhost/');
    expect(setCookieHeader).toContain(`auth_token=${MOCK_TOKEN}`);
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('Path=/');
    expect(setCookieHeader).toContain('SameSite=Strict');


    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.any(String),
      [MOCK_USER.email]
    );
    expect(mockBcryptCompare).toHaveBeenCalledWith(MOCK_PASSWORD, MOCK_USER.password_hash);
    expect(mockJwtSign).toHaveBeenCalledWith(
      { userId: MOCK_USER.id_pk },
      'TEST_SECRET',
      { expiresIn: '1h' }
    );
  });


 
  it('should return 400 if email is missing in the request body', async () => {
  
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { password: MOCK_PASSWORD } 
    );


    const response = await POST(req);
    const body = await getJsonBody(response);


    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing email or password" });
    expect(mockDbQuery).not.toHaveBeenCalled(); 
  });



  it('should return 401 if the user is not found in the database', async () => {

    mockDbQuery.mockResolvedValueOnce([[]]);
    mockBcryptCompare.mockClear(); 
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { email: 'nonexistent@example.com', password: MOCK_PASSWORD }
    );

 
    const response = await POST(req);
    const body = await getJsonBody(response);


    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid credentials" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
    expect(mockBcryptCompare).not.toHaveBeenCalled(); 
  });



  it('should return 401 on password mismatch', async () => {

    mockBcryptCompare.mockResolvedValue(false);
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { email: MOCK_USER.email, password: 'wrongpassword' }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid credentials" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
    expect(mockBcryptCompare).toHaveBeenCalledTimes(1);
    expect(mockJwtSign).not.toHaveBeenCalled(); // Should fail before JWT signing
  });


  // --- Test Case 5: Missing JWT_SECRET (500) ---
  it('should return 500 if JWT_SECRET environment variable is not set', async () => {
    // Arrange: Unset JWT_SECRET
    delete process.env.JWT_SECRET;

    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { email: MOCK_USER.email, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Server configuration error" });
    // Cleanup for next test
    process.env.JWT_SECRET = 'TEST_SECRET'; 
  });


  // --- Test Case 6: Internal Server Error (Database Failure) (500) ---
  it('should return 500 on internal server errors (e.g., database failure)', async () => {
    // Arrange: Mock DB query to throw an error
    const dbError = new Error('Simulated DB connection failure');
    mockDbQuery.mockRejectedValue(dbError);

    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/login',
      { email: MOCK_USER.email, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(console.error).toHaveBeenCalledWith("Login error:", dbError);
  });
});