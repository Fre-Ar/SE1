import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";
import { AuditLog } from "@/components/data_types";

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
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const actionFilter = url.searchParams.get("action"); // e.g., 'user.ban'
    const actorSearch = url.searchParams.get("actor");   // username
    const targetType = url.searchParams.get("targetType"); // 'user', 'story', etc.

    // 3. Build Query
    const conditions: string[] = ["1=1"];
    const values: any[] = [];

    if (actionFilter) {
      conditions.push("a.action = ?");
      values.push(actionFilter);
    }

    if (targetType) {
      conditions.push("a.target_type = ?");
      values.push(targetType);
    }

    if (actorSearch) {
      conditions.push("u.username LIKE ?");
      values.push(`%${actorSearch}%`);
    }

    const whereClause = conditions.join(" AND ");

    // 4. Count Total
    const countSql = `
      SELECT COUNT(*) as total 
      FROM audit_log a
      LEFT JOIN users u ON a.actor_fk = u.id_pk
      WHERE ${whereClause}
    `;
    const [countRows] = await db.query(countSql, values);
    const totalCount = (countRows as any[])[0]?.total || 0;

    // 5. Fetch Logs
    const logsSql = `
      SELECT 
        a.id_pk,
        a.action,
        a.target_type,
        a.target_id,
        a.target_name,
        a.reason,
        a.timestamp,
        u.id_pk as actor_id,
        u.username as actor_username,
        u.role as actor_role
      FROM audit_log a
      LEFT JOIN users u ON a.actor_fk = u.id_pk
      WHERE ${whereClause}
      ORDER BY a.timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    // Append pagination values
    const queryValues = [...values, limit, offset];
    const [rows] = await db.query(logsSql, queryValues);

    const logs: AuditLog[] = (rows as any[]).map(r => ({
      id: r.id_pk.toString(),
      action: r.action,
      target: {
        type: r.target_type,
        id: r.target_id.toString(),
        name: r.target_name || "N/A"
      },
      reason: r.reason,
      timestamp: new Date(r.timestamp).toISOString(),
      actor: {
        id: r.actor_id?.toString() || "0",
        username: r.actor_username || "System",
        role: r.actor_role || "system"
      }
    }));

    return NextResponse.json({
      data: logs,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (err) {
    console.error("Audit Logs Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}