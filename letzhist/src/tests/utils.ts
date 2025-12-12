// src/tests/util.ts

import { NextRequest, NextResponse } from "next/server";

// Define the shape of our mock NextRequest
interface MockNextRequest extends NextRequest {
    cookies: any;
    nextUrl: any;
    page: any;
    ua: any;
}

/**
 * Creates a mock NextRequest object for Next.js API route testing (route.ts).
 * This mock satisfies the NextRequest interface by adding necessary Next.js properties.
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE).
 * @param {string} url - The URL (e.g., 'http://localhost/api/users').
 * @param {object | null} body - The request body object.
 * @param {object} headers - Additional request headers.
 * @returns {MockNextRequest} A mocked NextRequest object.
 */
export async function mockRequest(
  method: string,
  url: string,
  body: object | null = null,
  headers: Record<string, string> = {},
): Promise<MockNextRequest> {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  // Create the base Request object
  const request = new Request(url, init);

  // Parse the URL to create a mock nextUrl property
  const parsedUrl = new URL(url);

  // Construct the mock object to satisfy the NextRequest interface
  const mockNextRequest: MockNextRequest = {
    ...request,
    // Add Next.js specific properties, mocked as necessary
    cookies: {
        get: jest.fn().mockImplementation((name: string) => ({ 
            value: `mock-cookie-value-for-${name}` 
        })),
        set: jest.fn(),
        delete: jest.fn(),
    },
    nextUrl: {
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
        // Add other nextUrl properties used in your routes if needed
        clone: jest.fn().mockReturnThis(), 
    },
    page: { params: {} }, // Mock page params if needed
    ua: { isMobile: false, isBot: false, ua: 'mock-user-agent' }, // Mock user agent
    // Cast to 'any' to handle the differences between Request and NextRequest properties
  } as unknown as MockNextRequest; 

  return mockNextRequest;
}

/**
 * Extracts the JSON body from a standard Web Response object.
 * (No change needed here)
 * @param {Response} response - The Response object returned by the API handler.
 * @returns {Promise<any>} The parsed JSON body.
 */
export async function getJsonBody(response: Response): Promise<any> {
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json();
  }
  return null;
}