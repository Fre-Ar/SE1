import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Comment, UserSummary, PaginatedResponse, NewCommentPayload } from '@/components/data_types'; 

// --- INTERNAL INTERFACES FOR DATABASE MAPPING ---

/**
 * Interface for the raw SQL result of the Comment data.
 */
interface CommentRow {
  id_pk: number;
  story_fk: number;
  revision_fk: number;
  user_fk: number;
  body: string;
  created_at: Date;
  username: string;
  // NOTE: Assuming parentId_fk is added to the DB for threading
  parentId_fk: number | null; 
}

// --- HELPER FUNCTIONS ---

/**
 * Finds the Story and its latest published Revision IDs by slug.
 */
async function getStoryAndRevisionIds(slug: string): Promise<{ storyId: number, revisionId: number } | null> {
  const findIdsSql = `
    SELECT 
      s.id_pk as storyId,
      r.id_pk as revisionId
    FROM story s
    INNER JOIN storyRevision r ON r.id_pk = (
        -- Get the latest published revision
        SELECT id_pk FROM storyRevision r2
        WHERE r2.story_fk = s.id_pk 
        AND r2.revStatus = 'published'
        ORDER BY r2.created_at DESC 
        LIMIT 1
    )
    WHERE s.slug = ?
    LIMIT 1;
  `;
  
  const [rows] = await db.query(findIdsSql, [slug]) as [any[], any];

  if (rows.length === 0) {
    return null;
  }
  return { storyId: rows[0].storyId, revisionId: rows[0].revisionId };
}

/**
 * Placeholder for fetching the currently authenticated user's ID
 */
function getAuthUserId(): number {
    // For this demonstration, assuming 'HistoryBuff' (ID 3) is the author.
    return 3; 
}


// ==========================================
// 1. GET /api/stories/:slug/comments (Fetch Comments)
// ==========================================

export async function GET(
  req: NextRequest, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  // NOTE: For simplicity, ignoring pagination parameters (page, pageSize) for now
  const page = 1;
  const pageSize = 50;

  try {
    const ids = await getStoryAndRevisionIds(slug);
    if (!ids) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    const { storyId } = ids;

    // Fetch all Comments for this Story Container
    const commentsSql = `
      SELECT 
        c.id_pk, c.story_fk, c.revision_fk, c.user_fk, 
        c.body, c.created_at, u.username, c.parentId_fk
      FROM comment c
      INNER JOIN users u ON u.id_pk = c.user_fk
      WHERE c.story_fk = ?
      ORDER BY c.created_at ASC
      LIMIT ?;
    `;
    
    // Using simple limit for now, replace with proper pagination OFFSET/LIMIT later
    const [commentRows] = await db.query(commentsSql, [storyId, pageSize]) as [CommentRow[], any];

    // Map to DTOs
    const comments: Comment[] = commentRows.map(cRow => ({
      id: cRow.id_pk.toString(),
      storyId: cRow.story_fk.toString(),
      // Use parentId_fk if available, otherwise null
      parentId: cRow.parentId_fk ? cRow.parentId_fk.toString() : null, 
      revisionId: cRow.revision_fk.toString(),
      author: {
        id: cRow.user_fk.toString(),
        username: cRow.username,
      } as UserSummary,
      body: cRow.body,
      createdAt: new Date(cRow.created_at).toISOString(),
      status: 'visible',
    }));

    const response: PaginatedResponse<Comment> = {
      data: comments,
      meta: {
        page: page,
        pageSize: pageSize,
        totalItems: comments.length, // Placeholder, use a COUNT query for real total
        totalPages: 1, // Placeholder
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`Error fetching comments for slug ${slug}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST /api/stories/:slug/comments (Create New Comment)
// ==========================================

export async function POST(
  req: NextRequest, 
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const payload: NewCommentPayload = await req.json();
  const authorId = getAuthUserId();
  
  if (!payload.body) {
    return NextResponse.json({ error: 'Comment body is required.' }, { status: 400 });
  }

  try {
    const ids = await getStoryAndRevisionIds(slug);
    if (!ids) {
      return NextResponse.json({ error: 'Story not found or not published' }, { status: 404 });
    }
    const { storyId, revisionId } = ids;
    
    const parentId = payload.parentId ? parseInt(payload.parentId, 10) : null;

    // 1. Insert the new comment
    const insertCommentSql = `
      INSERT INTO comment (
        story_fk, revision_fk, user_fk, body, parentId_fk, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW());
    `;
    const [insertResult] = await db.query(insertCommentSql, [
      storyId,
      revisionId,
      authorId,
      payload.body,
      parentId 
    ]) as [any, any];
    const commentId = insertResult.insertId;

    // 2. Fetch the newly created comment (with user details)
    const fetchNewCommentSql = `
      SELECT 
        c.id_pk, c.story_fk, c.revision_fk, c.user_fk, 
        c.body, c.created_at, u.username, c.parentId_fk
      FROM comment c
      INNER JOIN users u ON u.id_pk = c.user_fk
      WHERE c.id_pk = ?
    `;
    const [commentRows] = await db.query(fetchNewCommentSql, [commentId]) as [CommentRow[], any];

    if (commentRows.length === 0) {
       return NextResponse.json({ error: 'Failed to retrieve created comment.' }, { status: 500 });
    }

    const newCommentRow = commentRows[0];
    
    // 3. Map to DTO and return 201 Created
    const newComment: Comment = {
      id: newCommentRow.id_pk.toString(),
      storyId: newCommentRow.story_fk.toString(),
      parentId: newCommentRow.parentId_fk ? newCommentRow.parentId_fk.toString() : null,
      revisionId: newCommentRow.revision_fk.toString(),
      author: {
        id: newCommentRow.user_fk.toString(),
        username: newCommentRow.username,
      } as UserSummary,
      body: newCommentRow.body,
      createdAt: new Date(newCommentRow.created_at).toISOString(),
      status: 'visible',
    };

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error(`Error creating comment for slug ${slug}:`, error);
    return NextResponse.json({ error: 'Failed to create new comment.' }, { status: 500 });
  }
}