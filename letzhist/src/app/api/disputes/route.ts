import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";
import { Dispute } from "@/components/data_types";

// Define constants for pagination
const PAGE_SIZE = 20;

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
    } else {
      whereConditions.push("d.currentStatus = 'open'");
    }

    // Base Query with JOINS for Context
    let disputesQuery = `
      SELECT 
        d.id_pk, d.target_id, d.target_type, d.reason, d.currentStatus, d.category,
        d.created_at, d.contextRevision_fk,
        d.resolvedBy_fk, d.resolvedAt, d.resolutionNotes,
        
        u.id_pk AS reporter_id, u.username AS reporter_username,

        -- Resolver Info
        ures.username AS resolver_username,
        
        -- Comment Context
        c.body AS comment_body,
        uc.username AS comment_author,
        
        -- Story Context
        s.slug AS story_slug,
        sr.title AS story_title,
        us.username AS story_author

      FROM dispute d
      JOIN users u ON d.reporter_fk = u.id_pk

      -- Join for Resolver (Moderator)
      LEFT JOIN users ures ON d.resolvedBy_fk = ures.id_pk
      
      -- Join for Comment Targets
      LEFT JOIN comment c ON d.target_type = 'comment' AND d.target_id = c.id_pk
      LEFT JOIN users uc ON c.user_fk = uc.id_pk
      
      -- Join for Story Targets (Assuming target_id = story.id)
      LEFT JOIN story s ON (d.target_type = 'story' OR d.target_type = 'revision') AND d.target_id = s.id_pk
      -- We try to join the specific context revision if provided
      LEFT JOIN storyRevision sr ON d.contextRevision_fk = sr.id_pk
      LEFT JOIN users us ON sr.author_fk = us.id_pk
    `;
    
    // Apply WHERE clause
    if (whereConditions.length > 0) {
      disputesQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    // Sort
    let orderByClause = "d.created_at DESC";
    if (sort === "created_asc") orderByClause = "d.created_at ASC";
    if (sort === "resolved_desc") orderByClause = "d.resolvedAt DESC";
    
    disputesQuery += ` ORDER BY ${orderByClause}`;
    disputesQuery += ` LIMIT ? OFFSET ?`;
    values.push(PAGE_SIZE, offset);

    const [disputeRows] = await db.query(disputesQuery, values);
    const disputes = disputeRows as any[];

    // Count Queries
    let countQuery = `SELECT COUNT(d.id_pk) as totalItems FROM dispute d`;
    if (whereConditions.length > 0) countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    const [totalRows] = await db.query(countQuery, values.slice(0, whereConditions.length));
    const totalItems = (totalRows as any[])[0].totalItems;

    // Map Data
    const data: Dispute[] = disputes.map(d => ({
      id: String(d.id_pk),
      targetId: String(d.target_id),
      targetType: d.target_type,
      // Context Data (Unified based on type)
      context: {
        content: d.target_type === 'comment' ? d.comment_body : d.story_title,
        author: d.target_type === 'comment' ? d.comment_author : d.story_author,
        slug: d.story_slug, // For linking
      },
      contextRevisionId: d.contextRevision_fk ? String(d.contextRevision_fk) : undefined,

      reason: d.reason,
      category: d.category,
      status: d.currentStatus,
      
      createdAt: new Date(d.created_at),
      createdBy: { 
        id: String(d.reporter_id),
        username: d.reporter_username
      },

      resolvedBy: { 
        id: String(d.resolvedBy_fk),
        username: d.reporter_username
      },
      resolutionNotes: d.resolutionNotes,
      resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : undefined 
    }));

    return NextResponse.json({
      data: data,
      meta: {
        page: page,
        pageSize: PAGE_SIZE,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / PAGE_SIZE),
      }
    });

  } catch (err) {
    console.error("GET Disputes Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
      NextResponse.json(
        { error: response.error },
        { status: response.status }
      );
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