import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);

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
    
    const userRole = (actorRows as any[])[0].role;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: "Forbidden - insufficient role privileges" }, { status: 403 });
    }

    // 2. Validate Target
    if (isNaN(targetId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Prevent self-demotion via this API to avoid locking oneself out (optional safety)
    if (userId === id) {
       return NextResponse.json({ error: "Cannot change your own role via this endpoint." }, { status: 400 });
    }

    const body = await req.json();
    const { role } = body;

    // 3. Validate Role
    if (!['contributor', 'moderator'].includes(role)) {
       // We restrict setting 'admin' via UI for safety, or you can add it if needed.
       return NextResponse.json({ error: "Invalid role. Can only set 'contributor' or 'moderator'." }, { status: 400 });
    }

    // 4. Update DB
    await db.query("UPDATE users SET role = ? WHERE id_pk = ?", [role, targetId]);

    // 5. Audit Log
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)",
      [userId, "user.change_role", "user", targetId, `Changed role to ${role}`]
    );

    return NextResponse.json({ success: true, role });

  } catch (err) {
    console.error("Role Change Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}