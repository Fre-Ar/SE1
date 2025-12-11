import 'server-only';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { cache } from 'react';
import { UserProfile, JwtPayload} from '@/components/data_types';


// Cache ensures this function runs only once per request, even if called by multiple components.
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;

    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }

    const res = await fetch(`/api/auth/${decoded.userId}`);
    if (!res.ok) {
      console.error('Error during User Fetching: ', res.status);
      return null;
    }
    const user = (await res.json()) as UserProfile;

    return user;
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
});