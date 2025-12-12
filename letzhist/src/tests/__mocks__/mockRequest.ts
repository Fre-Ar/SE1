// Example: Updates to your mockRequest function implementation

export async function mockRequest(method: string, url: string, body: any = null, headers: Record<string, string> = {}) {
    // --- Existing logic to create a base Request object ---
    const req = new Request(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
    });

    // --- FIX 1: Implement req.json() to resolve "req.json is not a function" ---
    // The actual NextRequest object has a .json() method to parse the body.
    (req as any).json = jest.fn(async () => body || {});
    
    // --- FIX 2: Implement mockable req.headers.get and req.cookies.get to resolve "reading 'get'" ---
    // You need to explicitly mock the .get() function on the headers/cookies utility objects 
    // to allow tests to call (req.headers.get as jest.Mock).mockReturnValue(...)
    (req as any).headers = {
        get: jest.fn((name) => req.headers.get(name)),
        // Ensure mockClear() exists for test cleanup (e.g., line 80 in update-email.test.ts)
        mockClear: jest.fn() 
    };

    (req as any).cookies = {
        get: jest.fn((name) => {
            // Your logic to return a mock Cookie object { value: 'token' }
            // For now, return a placeholder so the function is defined:
            return name === 'auth_token' ? { value: 'TEST_TOKEN' } : undefined;
        }),
        mockClear: jest.fn()
    };

    return req;
}