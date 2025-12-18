// Define the spyable function and export it
export const mockNextResponseJson = jest.fn((body, init) => {
    // This is the default mock implementation
    return {
        status: init?.status || 200,
        headers: new Headers(),
        cookies: { set: jest.fn() },
        json: async () => body,
    };
});

// Export the mocked Next.js module structure
export const NextResponse = {
    json: mockNextResponseJson, // Points to the spyable function
    redirect: jest.fn(),
    // Add other static methods (e.g., NextRequest, cache, etc.) if needed
};