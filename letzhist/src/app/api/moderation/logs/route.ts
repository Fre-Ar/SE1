import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest } from "@/lib/utils";

/**
 * GET /api/moderation/logs?limit=50&page=1
 *
 * Returns audit logs for moderators and admins.
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
    if (
      actors.length === 0 ||
      (actors[0].role !== "moderator" && actors[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden - only moderators and admins can view audit logs" },
        { status: 403 }
      );
    }

    // Parse pagination params
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit") ?? "50";
    const pageParam = url.searchParams.get("page") ?? "1";

    let limit = parseInt(limitParam, 10) || 50;
    let page = parseInt(pageParam, 10) || 1;

    limit = Math.max(1, Math.min(100, limit));
    page = Math.max(1, page);

    const offset = (page - 1) * limit;

    // Get total count
    const [countRows] = await db.query("SELECT COUNT(*) as total FROM audit_log");
    const totalCount = (countRows as any[])[0]?.total || 0;

    // Get logs
    const [logs] = await db.query(
      `SELECT 
        al.id_pk,
        al.actor_fk,
        u.username as actor_username,
        al.action,
        al.target_type,
        al.target_id,
        al.target_name,
        al.reason,
        al.timestamp
      FROM audit_log al
      LEFT JOIN users u ON al.actor_fk = u.id_pk
      ORDER BY al.timestamp DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const formattedLogs = (logs as any[]).map((log) => ({
      id: String(log.id_pk),
      actor: log.actor_username,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      targetName: log.target_name,
      reason: log.reason,
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : null,
    }));

    return NextResponse.json({
      data: formattedLogs,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
