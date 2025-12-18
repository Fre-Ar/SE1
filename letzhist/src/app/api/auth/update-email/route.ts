import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

/**
 * PUT /api/auth/update-email
 *
 * Updates the authenticated user's email address.
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
			[email, userId]
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
			[email, userId]
		);

		// Fetch updated user
		const [rows] = await db.query(
			"SELECT id_pk, username, email, role, is_muted, muted_until FROM users WHERE id_pk = ? LIMIT 1",
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

		// Audit Logging
		await db.query(
			"INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
			[user.id_pk, "user.update_email", "user", user.id_pk, user.username, "User updated their email address"]
		);

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
