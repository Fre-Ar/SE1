// src/app/api/auth/register/route.test.ts

import { POST } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { mockDbQuery } from "@/tests/__mocks__/@/lib/db"; // Use your DB mock

// Mock external libraries
jest.mock('bcryptjs');
import bcrypt from 'bcryptjs';
const mockBcryptHash = bcrypt.hash as jest.Mock;

jest.mock('jsonwebtoken');
import jwt from 'jsonwebtoken';
const mockJwtSign = (jwt as any).sign as jest.Mock;

// Spy on console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// Setup constants for testing
const MOCK_USERNAME = 'newuser';
const MOCK_EMAIL = 'new@example.com';
const MOCK_PASSWORD = 'strongpassword123';
const MOCK_HASHED_PASSWORD = 'mock-hashed-password-xyz';
const MOCK_USER_ID = 501;
const MOCK_TOKEN = 'mock-registration-jwt-token-789';

// Existing user mock data for conflict checks
const EXISTING_USER_DATA = { id_pk: 100, username: 'existing', email: 'existing@example.com' };

describe('POST /api/auth/register', () => {

  const OLD_ENV = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables safely
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.JWT_SECRET = 'TEST_SECRET';
    process.env.JWT_EXPIRES_IN = '1h';

    // Default successful mocks:
    // 1. Uniqueness check (initial query): Return empty array (user is unique)
    mockDbQuery.mockResolvedValueOnce([[]]); 
    // 2. Hash password
    mockBcryptHash.mockResolvedValue(MOCK_HASHED_PASSWORD);
    // 3. Insert user (second query): Return mock insertId
    mockDbQuery.mockResolvedValueOnce([{ insertId: MOCK_USER_ID }]); 
    // 4. Create token
    mockJwtSign.mockReturnValue(MOCK_TOKEN); 
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); 
    process.env = OLD_ENV; 
  });


  // --- Test Case 1: Successful Registration (201 Created) ---
  it('should return 201 and the new user token on successful registration', async () => {
    // Arrange
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/register',
      { username: MOCK_USERNAME, email: MOCK_EMAIL, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert Status and Body
    expect(response.status).toBe(201);
    expect(body).toEqual({
      user: { id: MOCK_USER_ID.toString() },
      token: MOCK_TOKEN,
    });

    // Assert internal calls
    expect(mockDbQuery).toHaveBeenCalledTimes(2); // Uniqueness check & Insert
    expect(mockBcryptHash).toHaveBeenCalledWith(MOCK_PASSWORD, 10);
    expect(mockJwtSign).toHaveBeenCalledWith(
      { userId: MOCK_USER_ID.toString() },
      'TEST_SECRET',
      { expiresIn: '1h' }
    );
    
    // Assert the INSERT query parameters
    const insertCall = mockDbQuery.mock.calls[1];
    expect(insertCall[1]).toEqual([
        MOCK_USERNAME, 
        MOCK_EMAIL, 
        MOCK_HASHED_PASSWORD, 
        'contributor'
    ]);
  });


  // --- Test Case 2: Missing Fields Validation (400 Bad Request) ---
  it.each([
    [{ username: MOCK_USERNAME, email: MOCK_EMAIL }, 'password'],
    [{ username: MOCK_USERNAME, password: MOCK_PASSWORD }, 'email'],
    [{ email: MOCK_EMAIL, password: MOCK_PASSWORD }, 'username'],
  ])('should return 400 if %s is missing', async (partialBody, missingField) => {
    // Arrange
    const req = await mockRequest('POST', 'http://localhost/api/auth/register', partialBody);

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing fields." });
    expect(mockDbQuery).not.toHaveBeenCalled(); 
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });


  // --- Test Case 3: Email Already in Use (409 Conflict) ---
  it('should return 409 if the email is already in use', async () => {
    // Arrange: Mock uniqueness check to return existing user by email
    mockDbQuery.mockResolvedValueOnce([[{...EXISTING_USER_DATA, email: MOCK_EMAIL}]]); 
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/register',
      { username: MOCK_USERNAME, email: MOCK_EMAIL, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Email already in use." });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });


  // --- Test Case 4: Username Already in Use (409 Conflict) ---
  it('should return 409 if the username is already in use', async () => {
    // Arrange: Mock uniqueness check to return existing user by username
    mockDbQuery.mockResolvedValueOnce([[{...EXISTING_USER_DATA, username: MOCK_USERNAME, email: 'different@mail.com'}]]); 
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/register',
      { username: MOCK_USERNAME, email: MOCK_EMAIL, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Username already in use." });
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });


  // --- Test Case 5: Missing JWT_SECRET (500 Server Config Error) ---
  it('should return 500 if JWT_SECRET environment variable is not set', async () => {
    // Arrange: Unset JWT_SECRET
    delete process.env.JWT_SECRET;
    
    // We only need the first two queries to succeed before hitting the JWT check
    mockDbQuery.mockResolvedValueOnce([[]]); // Uniqueness check
    mockBcryptHash.mockResolvedValue(MOCK_HASHED_PASSWORD);

    // Skip the insert mock, as we should fail before that. The default setup has one remaining mock.
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/register',
      { username: MOCK_USERNAME, email: MOCK_EMAIL, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Server configuration error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("JWT_SECRET not set");

    // Restore for subsequent tests
    process.env.JWT_SECRET = 'TEST_SECRET';
  });


  // --- Test Case 6: Internal Server Error on Uniqueness Check (500) ---
  it('should return 500 and log an error on database failure during uniqueness check', async () => {
    // Arrange: Mock DB query to throw an error on the first call (uniqueness check)
    const dbError = new Error('Simulated DB connection failure');
    mockDbQuery.mockRejectedValue(dbError);

    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/register',
      { username: MOCK_USERNAME, email: MOCK_EMAIL, password: MOCK_PASSWORD }
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error." });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Register error:", dbError);
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });
});