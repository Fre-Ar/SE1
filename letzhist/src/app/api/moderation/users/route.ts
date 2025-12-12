import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest } from "@/lib/utils";

/**
 * GET /api/moderation/users?limit=20&page=1
 *
 * Returns a list of users for management by moderators and admins.
 * Only moderators and admins can access this endpoint.
 */
export async function GET(req: NextRequest) {
  try {
       const actors = await getRoleFromRequest(req); 
   
       // 2. Check for the error object returned by the helper
       if (!Array.isArray(actors)) {
         return NextResponse.json(
           { error: actors.error },
           { status: actors.status }
         );
       }
    // 2. Check for the error object returned by the helper
    if (
      actors.length === 0 ||
      (actors[0].role !== "moderator" && actors[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden - only moderators and admins can view user list" },
        { status: 403 }
      );
    }

    // Parse pagination params
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit") ?? "20";
    const pageParam = url.searchParams.get("page") ?? "1";

    let limit = parseInt(limitParam, 10) || 20;
    let page = parseInt(pageParam, 10) || 1;

    limit = Math.max(1, Math.min(100, limit));
    page = Math.max(1, page);

    const offset = (page - 1) * limit;

    // Get total count
    const [countRows] = await db.query("SELECT COUNT(*) as total FROM users");
    const totalCount = (countRows as any[])[0]?.total || 0;

    // Get users
    const [users] = await db.query(
      `SELECT 
        id_pk,
        username,
        email,
        role,
        is_banned,
        is_muted,
        muted_until,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const formattedUsers = (users as any[]).map((user) => ({
      id: String(user.id_pk),
      username: user.username,
      email: user.email,
      role: user.role,
      isBanned: user.is_banned,
      isMuted: user.is_muted,
      mutedUntil: user.muted_until ? new Date(user.muted_until).toISOString() : null,
      createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
    }));

    return NextResponse.json({
      data: formattedUsers,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
