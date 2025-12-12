import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Comment, UserSummary, PaginatedResponse, NewCommentPayload } from '@/components/data_types'; 
import jwt from "jsonwebtoken";

// Internal interface matching DB row
interface CommentRow {
  id_pk: number;
  story_fk: number;
  revision_fk: number;
  user_fk: number;
  body: string;
  created_at: Date;
  username: string;
  parentId_fk: number | null;
  status: 'visible' | 'hidden_by_mod' | 'deleted_by_user';
}

// Helper to get Auth User ID
function getAuthUserId(req: NextRequest): number | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded.userId || decoded.sub;
  } catch (e) {
    return null;
  }
}

// Helper to get Story IDs
async function getStoryAndRevisionIds(slug: string): Promise<{ storyId: number, revisionId: number } | null> {
  const [rows] = await db.query(`
    SELECT s.id_pk as storyId, r.id_pk as revisionId
    FROM story s
    INNER JOIN storyRevision r ON r.id_pk = (
        SELECT id_pk FROM storyRevision r2
        WHERE r2.story_fk = s.id_pk AND r2.revStatus = 'published'
        ORDER BY r2.created_at DESC LIMIT 1
    )
    WHERE s.slug = ? LIMIT 1
  `, [slug]) as [any[], any];
  return rows.length ? { storyId: rows[0].storyId, revisionId: rows[0].revisionId } : null;
}


export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const ids = await getStoryAndRevisionIds(slug);
    if (!ids) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    
    // Fetch comments including status and parentId
    const [rows] = await db.query(`
      SELECT 
        c.id_pk, c.story_fk, c.revision_fk, c.user_fk, 
        c.body, c.created_at, u.username, c.parentId_fk, c.status
      FROM comment c
      INNER JOIN users u ON u.id_pk = c.user_fk
      WHERE c.story_fk = ?
      ORDER BY c.created_at ASC
    `, [ids.storyId]) as [CommentRow[], any];

    const comments: Comment[] = rows.map(row => ({
      id: row.id_pk.toString(),
      storyId: row.story_fk.toString(),
      parentId: row.parentId_fk ? row.parentId_fk.toString() : null,
      revisionId: row.revision_fk.toString(),
      author: { id: row.user_fk.toString(), username: row.username },
      body: row.body,
      createdAt: new Date(row.created_at).toISOString(),
      status: row.status,
    }));

    // We return a flat list; the frontend will build the tree
    return NextResponse.json(comments);

  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload: NewCommentPayload = await req.json();
  if (!payload.body.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 });

  try {
    const ids = await getStoryAndRevisionIds(slug);
    if (!ids) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const parentId = payload.parentId ? parseInt(payload.parentId, 10) : null;

    const [res]: any = await db.query(`
      INSERT INTO comment (story_fk, revision_fk, user_fk, body, parentId_fk, created_at, status)
      VALUES (?, ?, ?, ?, ?, NOW(), 'visible')
    `, [ids.storyId, ids.revisionId, userId, payload.body, parentId]);

    // Return the new comment object
    const [newRows] = await db.query(`
      SELECT c.*, u.username FROM comment c 
      JOIN users u ON u.id_pk = c.user_fk 
      WHERE c.id_pk = ?`, [res.insertId]) as [any[], any];
    
    const row = newRows[0];
    const newComment: Comment = {
      id: row.id_pk.toString(),
      storyId: row.story_fk.toString(),
      parentId: row.parentId_fk?.toString() ?? null,
      revisionId: row.revision_fk.toString(),
      author: { id: row.user_fk.toString(), username: row.username },
      body: row.body,
      createdAt: new Date(row.created_at).toISOString(),
      status: row.status
    };

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
  }
}