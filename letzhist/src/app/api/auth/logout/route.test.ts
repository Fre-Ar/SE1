// src/app/api/auth/logout/route.test.ts

import { POST } from "./route"; 
import { mockRequest, getJsonBody } from "@/tests/utils"; 
import { NextResponse } from "next/server"; // Import for mocking setup

// We need to spy on console.error to check if errors are logged internally
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('POST /api/auth/logout', () => {

  // Global environment setup/teardown
  const OLD_ENV = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development', // Default for most tests
        writable: true, 
    });

    process.env.JWT_SECRET = 'TEST_SECRET';
    process.env.JWT_EXPIRES_IN = '1h'; 
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); 
    process.env = OLD_ENV; 
  });


  // --- Test Case 1: Successful Logout ---
  it('should return 200 and set an expired auth_token cookie', async () => {
    // 1. Arrange: Create a mock POST request
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/logout'
    );

    // 2. Act: Call the handler
    const response = await POST(req);
    const body = await getJsonBody(response);
    const setCookieHeader = response.headers.get('set-cookie');

    // 3. Assert: Check response properties
    expect(response.status).toBe(200);
    expect(body).toEqual({ message: "Logged out successfully" });

    // Assert cookie clearing:
    expect(setCookieHeader).toContain('auth_token=');
    expect(setCookieHeader).toContain('Max-Age=0'); 
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('Path=/');
    expect(setCookieHeader).toContain('SameSite=Strict');
    
    // Check Secure flag: In 'development' (default mock), it should NOT be present
    expect(setCookieHeader).not.toContain('Secure');
  });


  // --- Test Case 2: Secure Cookie Flag in Production ---
  it('should include the Secure flag when NODE_ENV is production', async () => {
    // Arrange: Set environment to 'production' using the safe method
    Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
    });
    
    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/logout'
    );

    // Act
    const response = await POST(req);
    const setCookieHeader = response.headers.get('set-cookie');

    // Assert
    expect(response.status).toBe(200);
    expect(setCookieHeader).toContain('Secure');

  });


  // --- Test Case 3: Internal Server Error (Mocking a failure inside the handler) ---
  it('should return 500 and log an error if an unexpected error occurs', async () => {
    // Arrange: Spy on and temporarily replace NextResponse.json to force an error.
    const originalJson = NextResponse.json;
    const mockError = new Error('Forced response creation failure');
    
    // Temporarily replace NextResponse.json with a function that throws
    (NextResponse.json as any) = jest.fn(() => {
        throw mockError;
    });

    const req = await mockRequest(
      'POST',
      'http://localhost/api/auth/logout'
    );

    // Act
    const response = await POST(req);
    const body = await getJsonBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Logout error:", mockError);

    // Cleanup: Restore original function
    (NextResponse.json as any) = originalJson;
  });
});