import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns user data and a JWT token on success.
 */
export async function POST(req: Request) {
	try {
		const { email, password } = await req.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
		}
		console.log(db);
		// Fetch user by email
		const [rows] = await db.query(
			"SELECT id_pk, username, password_hash, role FROM users WHERE email = ? LIMIT 1",
			[email]
		);
		console.log(rows);
		const users = rows as any[];
		if (users.length === 0) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const user = users[0];

		// Compare password
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		// Ensure JWT secret is set
		const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
		if (!JWT_SECRET) {
			console.error("JWT_SECRET not set");
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		const token = (jwt as any).sign(
			{ sub: user.id_pk, username: user.username, role: user.role },
			String(JWT_SECRET),
			{ expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
		);

		
        const homeUrl = new URL('/', req.url);

        const response = NextResponse.redirect(homeUrl, 302);

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response; // Return the response containing the redirect and the cookie
	} catch (err) {
		console.error("Login error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
