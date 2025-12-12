import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * PUT /api/auth/update-email
 *
 * Updates the authenticated user's email address.
 */
export async function PUT(req: NextRequest) {
	try {
		// Get token from cookies or Authorization header
		let token = req.cookies.get('auth_token')?.value;

		if (!token) {
			const authHeader = req.headers.get('authorization');
			if (authHeader?.startsWith('Bearer ')) {
				token = authHeader.substring(7);
			}
		}

		if (!token) {
			return NextResponse.json(
				{ error: "Unauthorized - no token provided" },
				{ status: 401 }
			);
		}

		// Verify and decode token
		const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
		if (!JWT_SECRET) {
			console.error("JWT_SECRET not set");
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 }
			);
		}

		let decoded: any;
		try {
			decoded = jwt.verify(token, String(JWT_SECRET));
		} catch (err) {
			return NextResponse.json(
				{ error: "Unauthorized - invalid token" },
				{ status: 401 }
			);
		}

		// Parse request body
		const body = await req.json();
		const { email } = body;

		if (!email || typeof email !== 'string') {
			return NextResponse.json(
				{ error: "Email is required" },
				{ status: 400 }
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email format" },
				{ status: 400 }
			);
		}

		// Check if email already exists
		const [existingRows] = await db.query(
			"SELECT id_pk FROM users WHERE email = ? AND id_pk != ? LIMIT 1",
			[email, decoded.userId]
		);

		if ((existingRows as any[]).length > 0) {
			return NextResponse.json(
				{ error: "Email already in use" },
				{ status: 400 }
			);
		}

		// Update email
		await db.query(
			"UPDATE users SET email = ? WHERE id_pk = ?",
			[email, decoded.userId]
		);

		// Fetch updated user
		const [rows] = await db.query(
			"SELECT id_pk, username, email, role, is_muted, muted_until FROM users WHERE id_pk = ? LIMIT 1",
			[decoded.userId]
		);

		const users = rows as any[];
		if (users.length === 0) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		const user = users[0];

		return NextResponse.json({
			message: "Email updated successfully",
			user: {
				id: user.id_pk,
				username: user.username,
				email: user.email,
				role: user.role,
				isMuted: user.is_muted,
				mutedUntil: user.muted_until,
			},
		});
	} catch (err) {
		console.error("Error updating email:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
