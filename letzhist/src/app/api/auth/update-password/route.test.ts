// src/app/api/auth/update-password/route.test.ts

import { PUT } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { mockDbQuery } from "@/tests/__mocks__/@/lib/db"; // Use your DB mock

// Mock external libraries
jest.mock('jsonwebtoken');
import jwt from 'jsonwebtoken';
const mockJwtVerify = jwt.verify as jest.Mock;

jest.mock('bcrypt');
import bcrypt from 'bcrypt';
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

// Spy on console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// --- Setup Constants ---
const MOCK_TOKEN = 'valid-password-update-token';
const MOCK_USER_ID = 101;
// Token payload must use 'sub' to match the file's usage: decoded.sub
const MOCK_TOKEN_PAYLOAD = { sub: MOCK_USER_ID }; 
const CURRENT_PASSWORD = 'currentpassword123';
const NEW_PASSWORD = 'newsecurepassword456';
const MOCK_HASHED_PASSWORD = 'mock-new-hashed-password-xyz';

const MOCK_DB_USER = {
  id_pk: MOCK_USER_ID,
  password_hash: 'existing-hashed-password',
};

describe('PUT /api/auth/update-password', () => {

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables safely
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.JWT_SECRET = 'TEST_SECRET';

    // Default successful mocks:
    mockJwtVerify.mockReturnValue(MOCK_TOKEN_PAYLOAD); 
    // DB Query 1 (Fetch User with Hash):
    mockDbQuery.mockResolvedValueOnce([[MOCK_DB_USER]]); 
    // bcrypt compare (Current Password check):
    mockBcryptCompare.mockResolvedValue(true);
    // bcrypt hash (New Password):
    mockBcryptHash.mockResolvedValue(MOCK_HASHED_PASSWORD);
    // DB Query 2 (Update Password):
    mockDbQuery.mockResolvedValueOnce([{}]); 
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); 
    process.env = OLD_ENV; 
  });


  // --- Helper to create a request ---
  const createMockRequest = async (token: string | null, body: object, source: 'cookie' | 'header' = 'cookie') => {
    let req;
    
    if (source === 'cookie') {
        req = await mockRequest('PUT', 'http://localhost/api/auth/update-password', body);
        (req.cookies.get as jest.Mock).mockImplementation((name: string) => {
            if (name === 'auth_token' && token) {
                return { value: token };
            }
            return undefined;
        });
        (req.headers.get as jest.Mock).mockReturnValue(undefined); // Clear header mock
    } else { // source === 'header'
        const headers: Record<string, string> = {};
        if (token) {
            headers['authorization'] = `Bearer ${token}`;
        }
        req = await mockRequest('PUT', 'http://localhost/api/auth/update-password', body, headers);
        (req.cookies.get as jest.Mock).mockReturnValue(undefined); // Clear cookie mock
        (req.headers.get as jest.Mock).mockImplementation((name: string) => {
            if (name.toLowerCase() === 'authorization') {
                return headers['authorization'];
            }
            return undefined;
        });
    }
    
    return req;
  };
  
  
  // --- Test Case 1: Successful Update (Cookie Token) ---
  it('should return 200 on successful password update via cookie token', async () => {
    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    }, 'cookie');

    const response = await PUT(req);
    const body = await getJsonBody(response);

    // Assert status and content
    expect(response.status).toBe(200);
    expect(body.message).toBe("Password updated successfully");
    
    // Assert internal calls
    expect(mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, 'TEST_SECRET');
    expect(mockDbQuery).toHaveBeenCalledTimes(2); // Fetch & Update
    expect(mockDbQuery).toHaveBeenNthCalledWith(1, expect.any(String), [MOCK_USER_ID]);
    expect(mockBcryptCompare).toHaveBeenCalledWith(CURRENT_PASSWORD, MOCK_DB_USER.password_hash);
    expect(mockBcryptHash).toHaveBeenCalledWith(NEW_PASSWORD, 10);
    expect(mockDbQuery).toHaveBeenNthCalledWith(2, expect.any(String), [MOCK_HASHED_PASSWORD, MOCK_USER_ID]);
  });


  // --- Test Case 2: Successful Update (Bearer Token) ---
  it('should return 200 on successful password update via bearer token', async () => {
    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    }, 'header');

    const response = await PUT(req);
    const body = await getJsonBody(response);

    // Assert status and content
    expect(response.status).toBe(200);
    expect(body.message).toBe("Password updated successfully");
    
    // Assert key calls
    expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    expect(mockBcryptCompare).toHaveBeenCalledTimes(1);
    expect(mockBcryptHash).toHaveBeenCalledTimes(1);
    expect(mockDbQuery).toHaveBeenCalledTimes(2); 
  });


  // --- Test Case 3: No Token Provided (401) ---
  it('should return 401 if no token is provided in cookie or header', async () => {
    const req = await createMockRequest(null, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    }, 'cookie'); // Source doesn't matter as token is null

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - no token provided" });
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });


  // --- Test Case 4: Invalid/Expired Token (401) ---
  it('should return 401 if the token is invalid or expired', async () => {
    // Arrange: Mock jwt.verify to throw an error
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Token is invalid');
    });

    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized - invalid token" });
    expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    expect(mockDbQuery).not.toHaveBeenCalled(); 
  });


  // --- Test Case 5: Missing Required Body Fields (400) ---
  it.each([
      [{ newPassword: NEW_PASSWORD }, "Current password is required"],
      [{ currentPassword: CURRENT_PASSWORD }, "New password is required"],
  ])('should return 400 for missing body field', async (partialBody, expectedError) => {
    const req = await createMockRequest(MOCK_TOKEN, partialBody);

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: expectedError });
    expect(mockJwtVerify).toHaveBeenCalledTimes(1); // Verify token is checked first
    expect(mockDbQuery).not.toHaveBeenCalled(); 
  });


  // --- Test Case 6: New Password Too Short (400) ---
  it('should return 400 if the new password is less than 8 characters', async () => {
    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: 'short'
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "New password must be at least 8 characters long" });
    expect(mockDbQuery).not.toHaveBeenCalled();
  });
  
  
  // --- Test Case 7: User Not Found (404) ---
  it('should return 404 if the user ID from the token is not found in the DB', async () => {
    // Arrange: Mock DB fetch to return empty array
    mockDbQuery.mockResolvedValueOnce([[]]); 

    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
    expect(mockBcryptCompare).not.toHaveBeenCalled(); 
  });


  // --- Test Case 8: Current Password Incorrect (401) ---
  it('should return 401 if the current password verification fails', async () => {
    // Arrange: Mock bcrypt.compare to return false
    mockBcryptCompare.mockResolvedValue(false); 

    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Current password is incorrect" });
    expect(mockDbQuery).toHaveBeenCalledTimes(1); 
    expect(mockBcryptCompare).toHaveBeenCalledTimes(1); 
    expect(mockBcryptHash).not.toHaveBeenCalled(); 
  });
  
  
  // --- Test Case 9: Internal Server Error (DB Fetch Failure) (500) ---
  it('should return 500 and log an error on database fetch failure', async () => {
    // Arrange: Mock DB query to throw an error on the first call (fetch)
    const dbError = new Error('Simulated DB connection failure');
    mockDbQuery.mockRejectedValue(dbError);

    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating password:", dbError);
    expect(mockBcryptCompare).not.toHaveBeenCalled(); 
  });


  // --- Test Case 10: Internal Server Error (DB Update Failure) (500) ---
  it('should return 500 and log an error on database update failure', async () => {
    // Arrange: Keep fetch successful, but mock DB update to throw an error
    const dbError = new Error('Simulated DB update failure');
    mockDbQuery.mockResolvedValueOnce([[MOCK_DB_USER]]); // Fetch Success
    // Skip compare/hash mocks as they are successful by default
    mockDbQuery.mockRejectedValueOnce(dbError); // Update Failure

    const req = await createMockRequest(MOCK_TOKEN, {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD
    });

    const response = await PUT(req);
    const body = await getJsonBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating password:", dbError);
    expect(mockDbQuery).toHaveBeenCalledTimes(2); 
  });
});