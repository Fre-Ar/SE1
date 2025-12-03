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

		// Fetch user by email
		const [rows] = await db.query(
			"SELECT id, username, password_hash, role FROM users WHERE email = ? LIMIT 1",
			[email]
		);

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
			{ sub: user.id, username: user.username, role: user.role },
			String(JWT_SECRET),
			{ expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
		);

		return NextResponse.json(
			{
				user: { id: user.id, username: user.username, role: user.role },
				token,
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error("Login error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
