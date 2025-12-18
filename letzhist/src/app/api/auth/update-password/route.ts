import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getUserIdFromRequest } from "@/lib/utils";

/**
 * PUT /api/auth/update-password
 *
 * Updates the authenticated user's password.
 */
export async function PUT(req: NextRequest) {
	try {
		// 1. Get userId from cookies
    const response = getUserIdFromRequest(req);
    if (response.error) {
      NextResponse.json(
        { error: response.error },
        { status: response.status }
      );
    }
    const userId = response.value;
		
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
			[userId]
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
			[passwordHash, userId]
		);

		// Audit Logging
		await db.query(
			"INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
			[user.id_pk, "user.update_password", "user", user.id_pk, user.username, "User updated their password"]
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
