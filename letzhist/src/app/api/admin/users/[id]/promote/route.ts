import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * POST /api/admin/users/[id]/promote
 *
 * Promotes a user to moderator. Only admins can perform this action.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    let token = req.cookies.get("auth_token")?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

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

    // Check admin role
    const [actorRows] = await db.query(
      "SELECT role FROM users WHERE id_pk = ? LIMIT 1",
      [decoded.sub]
    );

    const actors = actorRows as any[];
    if (actors.length === 0 || actors[0].role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - only admins can promote users" },
        { status: 403 }
      );
    }

    // Get the user to promote
    const targetId = parseInt(params.id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [targetRows] = await db.query(
      "SELECT id_pk, username, role FROM users WHERE id_pk = ? LIMIT 1",
      [targetId]
    );

    const targets = targetRows as any[];
    if (targets.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = targets[0];

    if (targetUser.role === "moderator" || targetUser.role === "admin") {
      return NextResponse.json(
        { error: "User is already a moderator or admin" },
        { status: 400 }
      );
    }

    // Promote the user to moderator
    await db.query("UPDATE users SET role = 'moderator' WHERE id_pk = ?", [
      targetId,
    ]);

    // Log the action
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name) VALUES (?, ?, ?, ?, ?)",
      [decoded.sub, "promote_user", "user", targetId, targetUser.username]
    );

    return NextResponse.json({
      message: `User ${targetUser.username} has been promoted to moderator`,
      user: {
        id: targetUser.id_pk,
        username: targetUser.username,
        role: "moderator",
      },
    });
  } catch (err) {
    console.error("Error promoting user:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
