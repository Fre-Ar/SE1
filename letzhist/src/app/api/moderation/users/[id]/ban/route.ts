import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";
import { getRoleFromRequest } from "@/lib/utils";

/**
 * POST /api/moderation/users/[id]/ban
 *
 * Bans a user. Only moderators and admins can perform this action.
 * Requires: reason (optional)
 */
export async function POST(req: NextRequest,{ params }: { params: { id: string } }) {
  try {
   
    const actors = await getRoleFromRequest(req); 

    // 2. Check for the error object returned by the helper
    if (!Array.isArray(actors)) {
      return NextResponse.json(
        { error: actors.error },
        { status: actors.status }
      );
    }


    // 4. Check if the authenticated user has the necessary role
    if (
      actors.length === 0 ||
      (actors[0].role !== "moderator" && actors[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden - only moderators and admins can ban users" },
        { status: 403 }
      );
    }

    // Get the user to ban
    const targetId = parseInt(params.id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [targetRows] = await db.query(
      "SELECT id_pk, username, is_banned FROM users WHERE id_pk = ? LIMIT 1",
      [targetId]
    );

    const targets = targetRows as any[];
    if (targets.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = targets[0];

    if (targetUser.is_banned) {
      return NextResponse.json(
        { error: "User is already banned" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { reason } = body;

    // Ban the user
    await db.query("UPDATE users SET is_banned = TRUE WHERE id_pk = ?", [
      targetId,
    ]);

    // Log the action
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
      [actors[0].id_pk, "ban_user", "user", targetId, targetUser.username, reason || null]
    );

    return NextResponse.json({
      message: `User ${targetUser.username} has been banned`,
      user: {
        id: targetUser.id_pk,
        username: targetUser.username,
        is_banned: true,
      },
    });
  } catch (err) {
    console.error("Error banning user:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
