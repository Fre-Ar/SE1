import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

/**
 * POST /api/moderation/users/[id]/ban
 * Bans a user. Only moderators and admins can perform this action.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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

    // Check role
    const [actorRows] = await db.query(
      "SELECT role, id_pk FROM users WHERE id_pk = ? LIMIT 1",
      [userId]
    );
    
    const role = (actorRows as any[])[0].role;

    if (role !== 'moderator' && role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - insufficient role privileges" }, { status: 403 });
    }

    const actorId = userId;
    const targetId = parseInt(id, 10);

    if (isNaN(targetId)) return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });

    // 2. Fetch Target User
    const [rows] = await db.query(
      "SELECT id_pk, username, role, is_banned FROM users WHERE id_pk = ? LIMIT 1",
      [targetId]
    ) as [any[], any];

    if (rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const targetUser = rows[0];

    // 3. Safety Checks
    // Prevent banning self
    if (targetUser.id_pk === actorId) {
      return NextResponse.json({ error: "You cannot ban yourself." }, { status: 400 });
    }
    // Prevent banning admins (unless you are a super-admin, but usually admins are protected)
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: "Cannot ban an administrator." }, { status: 403 });
    }
    // Check if already banned
    if (targetUser.is_banned) {
      return NextResponse.json({ error: "User is already banned." }, { status: 409 });
    }

    // 4. Parse Reason
    const body = await req.json();
    const { reason } = body;
    
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: "A valid reason (min 5 chars) is required." }, { status: 400 });
    }

    // 5. Execute Ban (Atomic if possible, here sequential)
    // Update User
    await db.query("UPDATE users SET is_banned = 1 WHERE id_pk = ?", [targetId]);

    // Create Audit Log (Action: user.ban)
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [actorId, "user.ban", "user", targetId, targetUser.username, reason]
    );

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} has been banned.`,
      user: { id: targetId, isBanned: true }
    });

  } catch (err) {
    console.error("Ban API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}