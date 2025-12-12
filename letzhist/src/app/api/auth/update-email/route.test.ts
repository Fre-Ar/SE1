// src/app/api/auth/update-email/route.test.ts

import { PUT } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { mockDbQuery } from "@/tests/__mocks__/@/lib/db"; // Use your DB mock

// Mock external libraries
jest.mock('jsonwebtoken');
import jwt from 'jsonwebtoken';
const mockJwtVerify = jwt.verify as jest.Mock;

// Spy on console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// --- Setup Constants ---
const MOCK_TOKEN = 'valid-update-token-12345';
const MOCK_USER_ID = 101;
// Payload must match the file's usage of decoded.sub
const MOCK_TOKEN_PAYLOAD = { sub: MOCK_USER_ID }; 
const NEW_EMAIL = 'new.email@example.com';
const OLD_EMAIL = 'old.email@example.com';
const ANOTHER_USER_ID = 202;

const MOCK_DB_USER = {
  id_pk: MOCK_USER_ID,
  username: 'testuser',
  email: OLD_EMAIL,
  role: 'member',
  is_muted: false,
  muted_until: null,
};
const MOCK_DB_UPDATED_USER = {
    ...MOCK_DB_USER, 
    email: NEW_EMAIL 
};
const MOCK_EXISTING_USER = {
    id_pk: ANOTHER_USER_ID,
    email: NEW_EMAIL,
};

describe('PUT /api/auth/update-email', () => {

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables safely
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.JWT_SECRET = 'TEST_SECRET';

    // Default successful mocks:
    mockJwtVerify.mockReturnValue(MOCK_TOKEN_PAYLOAD); 
    // DB Query 1 (Uniqueness Check): No existing user
    mockDbQuery.mockResolvedValueOnce([[]]); 
    // DB Query 2 (Update): Mock successful update
    mockDbQuery.mockResolvedValueOnce([{}]); 
    // DB Query 3 (Fetch Updated User): Return the newly updated user
    mockDbQuery.mockResolvedValueOnce([[MOCK_DB_UPDATED_USER]]); 
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); 
    process.env = OLD_ENV; 
  });


  // --- Helper to create a request with the token in cookies ---
  const createMockRequestWithCookieToken = async (token: string | null, email = NEW_EMAIL) => {
    const req = await mockRequest('PUT', 'http://localhost/api/auth/update-email', { email });
    
    (req.cookies.get as jest.Mock).mockImplementation((name: string) => {
        if (name === 'auth_token' && token) {
            return { value: token };
        }
        return undefined;
    });

    // Clear the headers mock to ensure cookie path is taken
    (req.headers.get as jest.Mock).mockClear(); 

    return req;
  };

  // --- Helper to create a request with the token in Authorization header ---
 const createMockRequestWithBearerToken = async (token: string | null, email = NEW_EMAIL) => {
    const headers: Record<string, string> = {};
    if (token) {
        headers['authorization'] = `Bearer ${token}`;
    }

    const req = await mockRequest('PUT', 'http://localhost/api/auth/update-email', { email }, headers);
    (req.cookies.get as jest.Mock).mockReturnValue(undefined); 
    
    (req.headers.get as jest.Mock).mockImplementation((name: string) => {
        if (name.toLowerCase() === 'authorization') {
            return headers['authorization'];
        }
        return undefined;
    });

    return req;
};
  
  
  // --- Test Case 1: Successful Update (Cookie Token) ---
  it('should return 200 and the updated profile when token is in cookie', async () => {
    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    // Assert status and content
    expect(response.status).toBe(200);
    expect(body.message).toBe("Email updated successfully");
    expect(body.user.email).toBe(NEW_EMAIL);
    
    // Assert JWT verification call
    expect(mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, 'TEST_SECRET');

    // Assert DB calls (Uniqueness, Update, Fetch)
    expect(mockDbQuery).toHaveBeenCalledTimes(3);
    expect(mockDbQuery).toHaveBeenNthCalledWith(1, expect.any(String), [NEW_EMAIL, MOCK_USER_ID]);
    expect(mockDbQuery).toHaveBeenNthCalledWith(2, expect.any(String), [NEW_EMAIL, MOCK_USER_ID]);
    expect(mockDbQuery).toHaveBeenNthCalledWith(3, expect.any(String), [MOCK_USER_ID]);
  });


  // --- Test Case 2: Successful Update (Bearer Token) ---
  it('should return 200 and the updated profile when token is in Authorization header', async () => {
    const req = await createMockRequestWithBearerToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    // Assert status and content
    expect(response.status).toBe(200);
    expect(body.user.email).toBe(NEW_EMAIL);
    
    // Assert JWT verification call
    expect(mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, 'TEST_SECRET');
    expect(mockDbQuery).toHaveBeenCalledTimes(3); 
  });


  // --- Test Case 3: Missing Email in Body (400) ---
  it('should return 400 if email field is missing in request body', async () => {
    const req = await createMockRequestWithCookieToken(MOCK_TOKEN, undefined); // Pass undefined email

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Email is required" });
    expect(mockDbQuery).not.toHaveBeenCalled(); // Should fail before DB check
  });


  // --- Test Case 4: Invalid Email Format (400) ---
  it.each([
      'invalid-email',
      'no-at-symbol.com',
      'double@at@mail.com',
      'space @in.email'
  ])('should return 400 for invalid email format: %s', async (invalidEmail) => {
    const req = await createMockRequestWithCookieToken(MOCK_TOKEN, invalidEmail);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid email format" });
    expect(mockDbQuery).not.toHaveBeenCalled();
  });


  // --- Test Case 5: Email Already in Use by Another User (400) ---
  it('should return 400 if the new email is already in use by another user', async () => {
    // Arrange: Mock DB Query 1 (Uniqueness Check) to return an existing user
    mockDbQuery.mockResolvedValueOnce([[MOCK_EXISTING_USER]]); 

    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Email already in use" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
  });
  
  
  // --- Test Case 6: No Token Provided (401) ---
  it('should return 401 if no token is provided in cookie or header', async () => {
    const req = await mockRequest('PUT', 'http://localhost/api/auth/update-email', { email: NEW_EMAIL });
    // Ensure both are cleared for this test
    (req.cookies.get as jest.Mock).mockReturnValue(undefined); 
    (req.headers.get as jest.Mock).mockReturnValue(undefined); 

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - no token provided" });
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });


  // --- Test Case 7: Invalid/Expired Token (401) ---
  it('should return 401 if the token is invalid or expired', async () => {
    // Arrange: Mock jwt.verify to throw an error
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Token is invalid');
    });

    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - invalid token" });
    expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    expect(mockDbQuery).not.toHaveBeenCalled(); 
  });


  // --- Test Case 8: Missing JWT_SECRET (500) ---
  it('should return 500 if JWT_SECRET environment variable is not set', async () => {
    // Arrange: Unset JWT_SECRET
    delete process.env.JWT_SECRET;

    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Server configuration error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("JWT_SECRET not set");

    // Restore for subsequent tests
    process.env.JWT_SECRET = 'TEST_SECRET';
  });


  // --- Test Case 9: User Not Found After Update (404) ---
  it('should return 404 if the user cannot be fetched after the update', async () => {
    // Arrange: Keep Uniqueness and Update mocks successful, but mock Fetch query to return empty
    mockDbQuery.mockResolvedValueOnce([[]]); // Uniqueness Check (Success)
    mockDbQuery.mockResolvedValueOnce([{}]); // Update (Success)
    mockDbQuery.mockResolvedValueOnce([[]]); // Fetch Updated User (Failure)

    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockDbQuery).toHaveBeenCalledTimes(3);
  });


  // --- Test Case 10: Internal Server Error (Database Failure on Update) (500) ---
  it('should return 500 and log an error on internal database failure', async () => {
    // Arrange: Mock DB Update query (the second call) to throw an error
    const dbError = new Error('Simulated DB connection failure');
    mockDbQuery.mockResolvedValueOnce([[]]); // Uniqueness Check (Success)
    mockDbQuery.mockRejectedValueOnce(dbError); // Update (Failure)

    const req = await createMockRequestWithCookieToken(MOCK_TOKEN);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating email:", dbError);
    expect(mockDbQuery).toHaveBeenCalledTimes(2); 
  });
});