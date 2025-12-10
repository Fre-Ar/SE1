import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Header from './header'; 

interface JwtPayload {
    sub: number; 
    username: string;
    role: string;
    exp: number;
}

interface AuthHeaderProps {
  showSearch?: boolean;
}

export default async function AuthHeaderWrapper({ showSearch }: AuthHeaderProps) { 
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth_token')?.value; 

    let user: { username: string } | null = null;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (token && JWT_SECRET) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as object as JwtPayload;

            if (decoded.exp * 1000 > Date.now()) {
                user = { username: decoded.username };
            }
        } catch (e) {
            // Token expired or invalid, user remains null
            console.error("Token verification failed in header:", e);
            }
    }
    return <Header user={user} showSearch={showSearch}/>;
}