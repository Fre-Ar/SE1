import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";
import { UserProfile } from "@/components/data_types";

/**
 * GET /api/moderation/users?limit=20&page=1
 *
 * Returns a list of users for management by moderators and admins.
 * Only moderators and admins can access this endpoint.
 */
export async function GET(req: NextRequest) {
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

    // 2. Parse Query Params
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const offset = (page - 1) * limit;
    
    const searchQuery = url.searchParams.get("query") || "";
    const roleFilter = url.searchParams.get("role") || "";

    // 3. Build Filters
    const conditions: string[] = ["1=1"]; // Base condition
    const values: any[] = [];

    if (searchQuery) {
      conditions.push("username LIKE ?");
      values.push(`%${searchQuery}%`);
    }

    if (roleFilter && ['contributor', 'moderator', 'admin'].includes(roleFilter)) {
      conditions.push("role = ?");
      values.push(roleFilter);
    }

    const whereClause = conditions.join(" AND ");

    // 4. Get Total Count (for pagination)
    const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const [countRows] = await db.query(countSql, values);
    const totalCount = (countRows as any[])[0]?.total || 0;

    // 5. Get Users
    const usersSql = `
      SELECT 
        id_pk, username, email, role, is_banned, is_muted, muted_until, created_at, last_login
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    // Add pagination params to values
    const queryValues = [...values, limit, offset];
    
    const [users] = await db.query(usersSql, queryValues);

    const formattedUsers: UserProfile[] = (users as any[]).map((user) => ({
      id: String(user.id_pk),
      username: user.username,
      email: user.email,
      role: user.role,
      isBanned: user.is_banned === 1,
      isMuted: user.is_muted === 1,
      mutedUntil: user.muted_until ? new Date(user.muted_until) : undefined,
      createdAt: new Date(user.created_at),
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
