import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";

/**
 * PUT /api/auth/update-password
 *
 * Updates the authenticated user's password.
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
		const { currentPassword, newPassword } = body;

		if (!currentPassword || typeof currentPassword !== 'string') {
			return NextResponse.json(
				{ error: "Current password is required" },
				{ status: 400 }
			);
		}

		if (!newPassword || typeof newPassword !== 'string') {
			return NextResponse.json(
				{ error: "New password is required" },
				{ status: 400 }
			);
		}

		if (newPassword.length < 8) {
			return NextResponse.json(
				{ error: "New password must be at least 8 characters long" },
				{ status: 400 }
			);
		}

		// Fetch user with password hash
		const [rows] = await db.query(
			"SELECT id_pk, password_hash FROM users WHERE id_pk = ? LIMIT 1",
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

		// Verify current password
		const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
		if (!passwordMatch) {
			return NextResponse.json(
				{ error: "Current password is incorrect" },
				{ status: 401 }
			);
		}

		// Hash new password
		const passwordHash = await bcrypt.hash(newPassword, 10);

		// Update password
		await db.query(
			"UPDATE users SET password_hash = ? WHERE id_pk = ?",
			[passwordHash, decoded.userId]
		);

		return NextResponse.json({
			message: "Password updated successfully",
		});
	} catch (err) {
		console.error("Error updating password:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
