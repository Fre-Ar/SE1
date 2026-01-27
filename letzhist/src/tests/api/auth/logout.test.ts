/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';

describe('POST /api/auth/logout', () => {
  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
  };

  it('should return success message and clear auth_token cookie', async () => {
    const req = createRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Logged out successfully');

    // Check that the cookie is being cleared
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('auth_token=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
