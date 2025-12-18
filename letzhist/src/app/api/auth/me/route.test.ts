// src/app/api/auth/me/route.test.ts

import { GET } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { mockDbQuery } from "@/tests/__mocks__/@/lib/db"; // Use your DB mock

// Mock external libraries
jest.mock('jsonwebtoken');
import jwt from 'jsonwebtoken';
const mockJwtVerify = jwt.verify as jest.Mock;

// Spy on console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// Setup constants for testing
const MOCK_TOKEN = 'valid-jwt-token-12345';
const MOCK_USER_ID = 101;
const MOCK_USER_PAYLOAD = { userId: MOCK_USER_ID };
const MOCK_DB_USER = {
  id_pk: MOCK_USER_ID,
  username: 'currentuser',
  email: 'current@example.com',
  role: 'member',
  is_banned: false,
  is_muted: false,
  muted_until: null,
  created_at: new Date('2023-01-01T10:00:00.000Z'),
  last_login: new Date('2025-12-11T12:00:00.000Z'),
};

describe('GET /api/auth/me', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set NODE_ENV to development and JWT_SECRET for successful execution
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.JWT_SECRET = 'TEST_SECRET';

    // Default successful mocks
    mockJwtVerify.mockReturnValue(MOCK_USER_PAYLOAD); 
    mockDbQuery.mockResolvedValue([[MOCK_DB_USER], {}]); // DB user found
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); 
    process.env = OLD_ENV; 
  });


  // --- Helper to create a request with the token embedded in the cookies mock ---
  const createMockRequestWithToken = async (token: string | null) => {
    const req = await mockRequest('GET', 'http://localhost/api/auth/me');
    
    // Explicitly set the token value on the mock 'cookies.get' function
    (req.cookies.get as jest.Mock).mockImplementation((name: string) => {
        if (name === 'auth_token' && token) {
            return { value: token };
        }
        return undefined;
    });

    return req;
  };
  
  
  // --- Test Case 1: Successful Profile Fetch ---
  it('should return 200 and the user profile for a valid token', async () => {
    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    // Assert status and content
    expect(response.status).toBe(200);
    expect(body.user.id).toBe(MOCK_USER_ID);
    expect(body.user.username).toBe(MOCK_DB_USER.username);
    expect(body.user.isBanned).toBe(false);
    
    // Assert JWT verification call
    expect(mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, 'TEST_SECRET');

    // Assert DB query call
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.any(String),
      [MOCK_USER_ID]
    );
  });


  // --- Test Case 2: No Token Provided (401) ---
  it('should return 401 if no auth_token cookie is provided', async () => {
    const req = await createMockRequestWithToken(null); // No token

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - no token provided" });
    expect(mockJwtVerify).not.toHaveBeenCalled();
    expect(mockDbQuery).not.toHaveBeenCalled();
  });


  // --- Test Case 3: Invalid/Expired Token (401) ---
  it('should return 401 if the token is invalid or expired', async () => {
    // Arrange: Mock jwt.verify to throw an error
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Token is invalid');
    });

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - invalid token" });
    expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    expect(mockDbQuery).not.toHaveBeenCalled();
  });


  // --- Test Case 4: Missing JWT_SECRET (500) ---
  it('should return 500 if JWT_SECRET environment variable is not set', async () => {
    // Arrange: Unset JWT_SECRET
    delete process.env.JWT_SECRET;

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Server configuration error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("JWT_SECRET not set");

    // Restore for subsequent tests
    process.env.JWT_SECRET = 'TEST_SECRET';
  });


  // --- Test Case 5: User is Banned (403) ---
  it('should return 403 if the authenticated user is banned', async () => {
    // Arrange: Mock DB user as banned
    const bannedUser = { ...MOCK_DB_USER, is_banned: true };
    mockDbQuery.mockResolvedValueOnce([[bannedUser], {}]);

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Account suspended" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
  });
  
  
  // --- Test Case 6: User ID Missing from Token Payload (401) ---
  it('should return 401 if the token payload is missing the userId', async () => {
    // Arrange: Mock jwt.verify to return a payload without userId
    mockJwtVerify.mockReturnValueOnce({ customField: 'data' }); 

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid token payload" });
    expect(mockDbQuery).not.toHaveBeenCalled();
  });


  // --- Test Case 7: User Not Found in Database (404) ---
  it('should return 404 if the user ID from the token is not found in the DB', async () => {
    // Arrange: Mock DB to return empty array
    mockDbQuery.mockResolvedValueOnce([[], {}]); 

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
  });


  // --- Test Case 8: Internal Server Error (Database Failure) (500) ---
  it('should return 500 and log an error on database query failure', async () => {
    // Arrange: Mock DB query to throw an error
    const dbError = new Error('Simulated DB connection failure');
    mockDbQuery.mockRejectedValue(dbError);

    const req = await createMockRequestWithToken(MOCK_TOKEN);

    const response = await GET(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching current user profile:", dbError);
  });
});