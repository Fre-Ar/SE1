import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest, getUserIdFromRequest } from "@/lib/utils";

// Define constants for pagination
const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    // 1. Get user role from Request
    const currentUser = await getRoleFromRequest(req); 
        
    // 2. Check for the error object returned by the helper
    if (!Array.isArray(currentUser)) {
      return NextResponse.json(
      { error: currentUser.error },
      { status: currentUser.status }
      );
    }
    

    if (currentUser[0].role !== 'moderator' && currentUser[0].role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - insufficient role privileges" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const sort = searchParams.get("sort") || "created_desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * PAGE_SIZE;

    const whereConditions: string[] = [];
    const values: Array<string | number> = [];
    
    // Status Filter
    if (statusFilter) {
      const validStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
      if (validStatuses.includes(statusFilter)) {
        whereConditions.push("d.currentStatus = ?");
        values.push(statusFilter);
      }
    }

    // Base Query
    let disputesQuery = `
      SELECT 
        d.id_pk, d.target_id, d.target_type, d.reason, d.currentStatus, d.category,
        d.created_at, d.titleSnapshot, d.contextRevision_fk,
        u.id_pk AS reporter_id, u.username AS reporter_username
      FROM dispute d
      JOIN users u ON d.reporter_fk = u.id_pk
    `;
    
    // Apply WHERE clause
    if (whereConditions.length > 0) {
      disputesQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    // Sort
    let orderByClause = "d.created_at DESC";
    if (sort === "created_asc") {
      orderByClause = "d.created_at ASC";
    }
    disputesQuery += ` ORDER BY ${orderByClause}`;


    disputesQuery += ` LIMIT ? OFFSET ?`;
    values.push(PAGE_SIZE, offset);


    const [disputeRows] = await db.query(disputesQuery, values);
    const disputes = disputeRows as any[];

    let countQuery = `SELECT COUNT(d.id_pk) as totalItems FROM dispute d`;
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    const [totalRows] = await db.query(countQuery, values.slice(0, whereConditions.length));
    const totalItems = (totalRows as any[])[0].totalItems;


    const pendingCountQuery = `SELECT COUNT(id_pk) as pendingCount FROM dispute WHERE currentStatus IN ('open', 'under_review')`;
    const [pendingRows] = await db.query(pendingCountQuery);
    const pendingCount = (pendingRows as any[])[0].pendingCount;


    const data = disputes.map(d => ({
      id: String(d.id_pk),
      targetId: String(d.target_id),
      targetType: d.target_type,
      targetTitle: d.titleSnapshot || 'N/A',
      reason: d.reason,
      category: d.category,
      status: d.currentStatus,
      createdAt: new Date(d.created_at).toISOString(),
      contextRevisionId: d.contextRevision_fk ? String(d.contextRevision_fk) : undefined,
      createdBy: { 
        id: String(d.reporter_id),
        username: d.reporter_username
      }
    }));


    return NextResponse.json({
      data: data,
      meta: {
        page: page,
        pageSize: PAGE_SIZE,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / PAGE_SIZE),
        pendingCount: pendingCount
      }
    });
  } catch (err) {
    console.error("GET Disputes Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching disputes." },
      { status: 500 }
    );
  }
}



// ==========================================
// POST /api/disputes (Create New Report)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // 1. Get userId from cookies
    const response = getUserIdFromRequest(req);
    if (response.error) {
      return {
        error: response.error,
        status: response.status
      };
    }
    const userId = response.value;

    // 2. Parse Payload
    const body = await req.json();
    const { targetId, targetType, category, reason, contextRevisionId } = body;

    // 3. Validation
    if (!targetId || !targetType || !category || !reason) {
          return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
      
    // Validate Category
    const validCategories = [
      'accuracy', 'bias', 'citation_missing', 'spam', 
      'harassment', 'hate_speech', 'violence', 'other'
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // 4. Insert Dispute
    const sql = `
      INSERT INTO dispute (
        target_id, target_type, category, reason, 
        contextRevision_fk, reporter_fk, currentStatus, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', NOW())
    `;

    const [result]: any = await db.query(sql, [
      targetId, 
      targetType, 
      category, 
      reason, 
      contextRevisionId || null, 
      userId
    ]);

    return NextResponse.json({ 
      success: true, 
      disputeId: result.insertId 
    }, { status: 201 });

  } catch (err) {
    console.error("POST Dispute Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}