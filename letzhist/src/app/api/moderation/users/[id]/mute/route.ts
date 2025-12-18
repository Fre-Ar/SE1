import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

/**
 * POST /api/moderation/users/[id]/mute
 * Mutes a user for a specific duration.
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

    // 2. Fetch Target
    const [rows] = await db.query(
      "SELECT id_pk, username, role, is_banned FROM users WHERE id_pk = ? LIMIT 1",
      [targetId]
    ) as [any[], any];

    if (rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const targetUser = rows[0];

    // 3. Safety Checks
    if (targetUser.id_pk === actorId) {
      return NextResponse.json({ error: "You cannot mute yourself." }, { status: 400 });
    }
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: "Cannot mute an administrator." }, { status: 403 });
    }
    if (targetUser.is_banned) {
      return NextResponse.json({ error: "User is banned. Unban them before muting." }, { status: 400 });
    }

    // 4. Parse Body
    const body = await req.json();
    const { reason, durationHours } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: "A valid reason (min 5 chars) is required." }, { status: 400 });
    }

    // 5. Calculate Mute Duration
    let mutedUntil: string | null = null;
    let message = "";

    if (typeof durationHours === 'number' && durationHours > 0) {
      const date = new Date();
      date.setTime(date.getTime() + (durationHours * 60 * 60 * 1000));
      // MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
      mutedUntil = date.toISOString().slice(0, 19).replace('T', ' ');
      message = `User muted for ${durationHours} hours (until ${mutedUntil})`;
    } else {
      // Permanent mute (or indefinite)
      mutedUntil = null; 
      message = "User permanently muted";
    }

    // 6. Execute Mute
    await db.query(
      "UPDATE users SET is_muted = 1, muted_until = ? WHERE id_pk = ?", 
      [mutedUntil, targetId]
    );

    // Create Audit Log (Action: user.mute)
    // We include the duration in the reason or metadata for clarity
    const auditReason = `${reason} (Duration: ${durationHours ? durationHours + 'h' : 'Permanent'})`;
    
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [actorId, "user.mute", "user", targetId, targetUser.username, auditReason]
    );

    return NextResponse.json({
      success: true,
      message,
      user: { 
        id: targetId, 
        isMuted: true, 
        mutedUntil 
      }
    });

  } catch (err) {
    console.error("Mute API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}