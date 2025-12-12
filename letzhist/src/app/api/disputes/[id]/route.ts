import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest } from "@/lib/utils";


const VALID_TARGET_TYPES: { [key: string]: string } = {
    'story': 'story',
    'revision': 'storyRevision',
    'comment': 'comment',
    'user': 'users',
};

const VALID_CATEGORIES = [
    'accuracy', 
    'bias', 
    'citation_missing', 
    'spam', 
    'harassment', 
    'hate_speech', 
    'violence', 
    'other'
];

/**
 * POST /api/disputes
 * Allows a logged-in user to file a new dispute or report.
 */
export async function POST(req: NextRequest) {
    try {

        const currentUser = await getRoleFromRequest(req); 
                
                    // 2. Check for the error object returned by the helper
                    if (!Array.isArray(currentUser)) {
                      return NextResponse.json(
                        { error: currentUser.error },
                        { status: currentUser.status }
                      );
                    }
        
        const reporterId = parseInt(currentUser[0].id_pk, 10);
        

        const { targetId, targetType, reason, category, contextRevisionId } = await req.json();

   
        if (!targetId || !targetType || !reason || !category) {
            return NextResponse.json({ error: "Missing required fields: targetId, targetType, reason, and category." }, { status: 400 });
        }

        const targetIdInt = parseInt(targetId, 10);
        if (isNaN(targetIdInt) || targetIdInt <= 0) {
            return NextResponse.json({ error: "Invalid targetId format." }, { status: 400 });
        }
        
        if (!VALID_TARGET_TYPES[targetType]) {
            return NextResponse.json({ error: `Invalid targetType: ${targetType}.` }, { status: 400 });
        }
        
        if (!VALID_CATEGORIES.includes(category)) {
            return NextResponse.json({ error: `Invalid category: ${category}.` }, { status: 400 });
        }

        const targetTableName = VALID_TARGET_TYPES[targetType];
        try {
            const [targetCheck] = await db.query(
                `SELECT id_pk FROM ${targetTableName} WHERE id_pk = ? LIMIT 1`,
                [targetIdInt]
            );
            if ((targetCheck as any[]).length === 0) {
                return NextResponse.json({ error: `Target ${targetType} with ID ${targetId} not found.` }, { status: 404 });
            }
        } catch (e) {
            console.error(`DB error during target check for ${targetType}:`, e);
            return NextResponse.json({ error: "Database error during target validation." }, { status: 500 });
        }


        const [conflictRows] = await db.query(
            `SELECT id_pk FROM dispute 
             WHERE reporter_fk = ? 
             AND target_id = ? 
             AND target_type = ? 
             AND currentStatus IN ('open', 'under_review') 
             LIMIT 1`,
            [reporterId, targetIdInt, targetType]
        );
        
        if ((conflictRows as any[]).length > 0) {
            return NextResponse.json({ error: "You have already submitted an active report for this item." }, { status: 409 });
        }
        

        const status = 'open';
        const contextRevIdInt = contextRevisionId ? parseInt(contextRevisionId, 10) : null;
        
        const [result] = await db.query(
            `INSERT INTO dispute 
            (target_type, target_id, category, reason, reporter_fk, currentStatus, contextRevision_fk)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [targetType, targetIdInt, category, reason, reporterId, status, contextRevIdInt]
        );
        
        const newDisputeId = (result as any).insertId;

        const createdAt = new Date().toISOString();
        
        return NextResponse.json({
            id: String(newDisputeId),
            status: status,
            createdAt: createdAt,
            targetType: targetType,
            targetId: String(targetIdInt),
            category: category,
            reason: reason,
            createdBy: {
                id: currentUser[0].id_pk,
                username: currentUser[0].username,
            }
        }, { status: 201 });

    } catch (err) {
        console.error("POST Dispute Error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred while filing the dispute." },
            { status: 500 }
        );
    }
}