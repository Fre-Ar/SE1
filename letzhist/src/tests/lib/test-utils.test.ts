/**
 * @jest-environment node
 */
import { mockRequest, getJsonBody } from '@/tests/utils';

describe('mockRequest', () => {
  it('should create a request with cookies mock', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test');
    expect(req.cookies).toBeDefined();
    expect(typeof req.cookies.get).toBe('function');
  });

  it('should have mocked cookies object with get function', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test');
    expect(typeof req.cookies.get).toBe('function');
    expect(typeof req.cookies.set).toBe('function');
    expect(typeof req.cookies.delete).toBe('function');
  });

  it('should return mock cookie values', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test');
    const cookie = req.cookies.get('auth_token');
    expect(cookie).toEqual({ value: 'mock-cookie-value-for-auth_token' });
  });

  it('should have nextUrl with pathname', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test/path');
    expect(req.nextUrl.pathname).toBe('/api/test/path');
  });

  it('should have nextUrl with searchParams', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test?foo=bar&baz=qux');
    expect(req.nextUrl.searchParams.get('foo')).toBe('bar');
    expect(req.nextUrl.searchParams.get('baz')).toBe('qux');
  });

  it('should have page property', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test');
    expect(req.page).toBeDefined();
    expect(req.page.params).toEqual({});
  });

  it('should have ua property', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/test');
    expect(req.ua).toBeDefined();
    expect(req.ua.isMobile).toBe(false);
    expect(req.ua.isBot).toBe(false);
  });

  it('should handle different URLs correctly', async () => {
    const req = await mockRequest('POST', 'http://localhost/api/users/123');
    expect(req.nextUrl.pathname).toBe('/api/users/123');
  });

  it('should handle query parameters', async () => {
    const req = await mockRequest('GET', 'http://localhost/api/search?q=test&page=1&limit=10');
    expect(req.nextUrl.searchParams.get('q')).toBe('test');
    expect(req.nextUrl.searchParams.get('page')).toBe('1');
    expect(req.nextUrl.searchParams.get('limit')).toBe('10');
  });
});

describe('getJsonBody', () => {
  it('should parse JSON response body', async () => {
    const mockResponse = new Response(JSON.stringify({ message: 'hello' }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toEqual({ message: 'hello' });
  });

  it('should parse complex JSON objects', async () => {
    const data = {
      user: { id: 1, name: 'Test' },
      items: [1, 2, 3],
      nested: { a: { b: { c: 'deep' } } },
    };
    const mockResponse = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toEqual(data);
  });

  it('should parse JSON with charset in content-type', async () => {
    const mockResponse = new Response(JSON.stringify({ test: true }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toEqual({ test: true });
  });

  it('should return null for non-JSON response', async () => {
    const mockResponse = new Response('plain text', {
      headers: { 'Content-Type': 'text/plain' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toBeNull();
  });

  it('should return null for HTML response', async () => {
    const mockResponse = new Response('<html></html>', {
      headers: { 'Content-Type': 'text/html' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toBeNull();
  });

  it('should return null when no content-type header', async () => {
    const mockResponse = new Response('some content');

    const body = await getJsonBody(mockResponse);
    expect(body).toBeNull();
  });

  it('should parse empty JSON object', async () => {
    const mockResponse = new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toEqual({});
  });

  it('should parse JSON array', async () => {
    const mockResponse = new Response(JSON.stringify([1, 2, 3]), {
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toEqual([1, 2, 3]);
  });

  it('should parse null JSON value', async () => {
    const mockResponse = new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await getJsonBody(mockResponse);
    expect(body).toBeNull();
  });
});
