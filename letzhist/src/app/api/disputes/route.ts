import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth"; 

// Define constants for pagination
const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
    try {

        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Not logged in." }, { status: 401 });
        }
        

        if (currentUser.role !== 'moderator' && currentUser.role !== 'admin') {
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