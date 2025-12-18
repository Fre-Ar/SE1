import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const disputeId = parseInt(id, 10);

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

    // 2. Parse Body
    const body = await req.json();
    const { status, notes } = body;

    if (!['under_review', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fecth dispute context (Needed for Audit Log)
    const [disputeRows] = await db.query(
      "SELECT target_id, target_type, category FROM dispute WHERE id_pk = ? LIMIT 1", 
      [disputeId]
    ) as [any[], any];

    if (disputeRows.length === 0) {
       return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }
    const disputeCtx = disputeRows[0];

    // 3. Logic
    let sql = "";
    const values: any[] = [];

    if (status === 'under_review') {
      // Assign to staff, set status, but NO resolvedAt date yet
      sql = `
        UPDATE dispute 
        SET currentStatus = ?, resolvedBy_fk = ? 
        WHERE id_pk = ?
      `;
      values.push(status, userId, disputeId);
    } else {
      // Resolve or Dismiss
      // Requires notes
      if (!notes && status === 'dismissed') {
        // Maybe optional for resolved? Let's make it optional generally unless strictly required.
      }
      
      sql = `
        UPDATE dispute 
        SET currentStatus = ?, resolvedBy_fk = ?, resolutionNotes = ?, resolvedAt = NOW()
        WHERE id_pk = ?
      `;
      values.push(status, userId, notes || "", disputeId);
    }

  await db.query(sql, values);

  // Audit Logging
  // Map internal targetType to Audit Log ENUM
  const isStory = disputeCtx.targetType === 'story' || disputeCtx.targetType === 'revision'
  const auditTargetType = isStory ? 'story' : disputeCtx.targetType

  await db.query(
    "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
    [
      userId, 
      `dispute.${status}`, // e.g., dispute.resolved, dispute.dismissed
      auditTargetType, 
      disputeCtx.target_id, 
      `Dispute #${disputeId}`, 
      `Resolution: ${status}. Notes: ${notes || "N/A"}`
    ]
  );

  return NextResponse.json({ success: true, status });

  } catch (err) {
    console.error("Resolve Dispute Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}