import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StoryViewDTO, UserSummary, Comment, SaveStoryPayload } from '@/components/data_types'; 

// --- INTERNAL INTERFACES FOR DATABASE MAPPING ---

/**
 * Interface for the raw SQL result of the Story + Revision data.
 */
interface StoryRevisionRow {
  storyId: number;
  revisionId: number;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string; // The markdown content from DB
  leadImage: string | null; // Stored as JSON string
  tags: string | null; // GROUP_CONCAT result
  revisionCreatedAt: Date;
  authorId: number;
  authorUsername: string;
}

/**
 * Interface for the raw SQL result of the Comment data.
 */
interface CommentRow {
  id_pk: number;
  story_fk: number;
  revision_fk: number;
  parentId_fk: number;
  user_fk: number;
  body: string;
  created_at: Date;
  status: 'visible' | 'hidden_by_mod' | 'deleted_by_user';
  username: string;
}

// ==========================================
// 1. GET /api/stories/:slug (Load for ReaderView)
// ==========================================

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Check for revisionId query param
  const url = new URL(req.url);
  const requestedRevId = url.searchParams.get("revisionId");
    
  try {
    let revisionCondition = "";
    const queryParams: any[] = [];

    // LOGIC: If a specific revision is requested, find it.
    // OTHERWISE, find the latest 'published' revision (Current Live).
    if (requestedRevId) {
      revisionCondition = `r.id_pk = ?`;
      queryParams.push(requestedRevId);
    } else {
      revisionCondition = `
        r.id_pk = (
          SELECT id_pk FROM storyRevision r2
          WHERE r2.story_fk = s.id_pk 
          AND r2.revStatus = 'published'
          ORDER BY r2.created_at DESC 
          LIMIT 1
        )
      `;
    }

    // Add slug to params 
    queryParams.push(slug);
    
    // 1. Fetch the Story Container and its CURRENT PUBLISHED Revision
    const storySql = `
      SELECT 
        s.id_pk as storyId,
        r.id_pk as revisionId,
        r.title,
        r.subtitle,
        r.slug,
        r.body,
        r.leadImage,
        r.created_at as revisionCreatedAt,
        u.id_pk as authorId,
        u.username as authorUsername,
        GROUP_CONCAT(t.tag) as tags
      FROM story s
      INNER JOIN storyRevision r ON 
        ${revisionCondition} -- Dynamic Join Condition
      INNER JOIN users u ON u.id_pk = r.author_fk
      LEFT JOIN tags t ON t.storyRevision_fk = r.id_pk
      WHERE s.slug = ? 
      GROUP BY s.id_pk, r.id_pk, u.id_pk
      LIMIT 1;
    `;

    // Use type assertion on the query result
    const [storyRows] = await db.query(storySql, queryParams) as [StoryRevisionRow[], any];

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: 'Story or revision not found' }, 
        { status: 404 }
      );
    }

    const storyRow = storyRows[0];
    const storyId = storyRow.storyId;

    // 2. Fetch all Comments for this Story Container
    const commentsSql = `
      SELECT 
        c.id_pk, c.story_fk, c.revision_fk, c.parentId_fk, c.user_fk, 
        c.body, c.created_at, c.status, u.username
      FROM comment c
      INNER JOIN users u ON u.id_pk = c.user_fk
      WHERE c.story_fk = ?
      ORDER BY c.created_at ASC;
    `;
    
    // Use type assertion on the query result
    const [commentRows] = await db.query(commentsSql, [storyId]) as [CommentRow[], any];

    // 3. Map to DTOs
    const discussion: Comment[] = commentRows.map(cRow => ({
      id: cRow.id_pk.toString(),
      storyId: cRow.story_fk.toString(),
      parentId: cRow.parentId_fk ? cRow.parentId_fk.toString() : null,
      revisionId: cRow.revision_fk.toString(),
      author: {
        id: cRow.user_fk.toString(),
        username: cRow.username,
      } as UserSummary,
      body: cRow.body,
      createdAt: new Date(cRow.created_at).toISOString(),
      status: cRow.status,
    }));

    // Construct the StoryViewDTO
    const storyView: StoryViewDTO = {
      // StoryContent part
      title: storyRow.title,
      subtitle: storyRow.subtitle ?? undefined,
      slug: storyRow.slug,
      body: storyRow.body, 
      tags: storyRow.tags ? storyRow.tags.split(',') : [],
      leadImage: storyRow.leadImage ? storyRow.leadImage : undefined,
      
      // StoryViewDTO specific fields
      storyId: storyRow.storyId.toString(),
      revisionId: storyRow.revisionId.toString(),
      lastEdited: new Date(storyRow.revisionCreatedAt).toISOString(),
      author: {
        id: storyRow.authorId.toString(),
        username: storyRow.authorUsername,
      },
      discussion: discussion,
    } as StoryViewDTO; 

    return NextResponse.json(storyView);

  } catch (error) {
    console.error(`Error fetching story with slug ${slug}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// ==========================================
// 2. PUT /api/stories/:slug (Create New Revision)
// ==========================================

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload: SaveStoryPayload = await req.json();
  
  // 1. Get Author
  const authorId = payload.authorId;
  
  // 2. Parse Body
  const contentBody = payload.body;
  const title = payload.title;
  const subtitle = payload.subtitle || "";
  const tags = payload.tags;
  const leadImage = payload.leadImage ? JSON.stringify(payload.leadImage) : null;

  const changeMessage = payload.changeMessage || 'Initial creation';
  const revStatus = payload.revStatus || 'published';

  try {
    // 1. Find existing story container and latest revision to establish parent
    const findStorySql = `
      SELECT 
        s.id_pk as storyId,
        r.id_pk as parentId
      FROM story s
      INNER JOIN storyRevision r ON r.id_pk = (
          SELECT id_pk FROM storyRevision r2
          WHERE r2.story_fk = s.id_pk 
          ORDER BY r2.created_at DESC 
          LIMIT 1
      )
      WHERE s.slug = ?
      LIMIT 1;
    `;
    const [storyRows] = await db.query(findStorySql, [slug]) as [any[], any];

    // Handle case where we might be updating a Draft-Only story (no published revisions yet)
    let storyId, parentId;
    if (storyRows.length === 0) {
        // Fallback: Check if story exists at all (maybe only drafts exist)
        const [rawStory] = await db.query("SELECT id_pk FROM story WHERE slug = ?", [slug]) as [any[], any];
        if (rawStory.length === 0) return NextResponse.json({ error: 'Story not found for update.' }, { status: 404 });
        storyId = rawStory[0].id_pk;
        parentId = null; // No parent if only drafts exist or first revision
    } else {
        storyId = storyRows[0].storyId;
        parentId = storyRows[0].parentId;
    }


    // 2. Insert a new storyRevision
    const insertRevisionSql = `
      INSERT INTO storyRevision (
        story_fk, parentId_fk, author_fk, title, subtitle, slug, body, 
        leadImage, changeMessage, revStatus, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
    `;

    const [revisionResult] = await db.query(insertRevisionSql, [
      storyId, 
      parentId, 
      authorId, 
      title, 
      subtitle, 
      slug, 
      contentBody, 
      leadImage,
      changeMessage,
      revStatus 
    ]) as [any, any];
    const revisionId = revisionResult.insertId;
  

    // 3. Insert Tags linked to the new Revision ID
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tag => `(${revisionId}, '${tag}')`).join(', ');
      const insertTagsSql = `INSERT INTO tags (storyRevision_fk, tag) VALUES ${tagValues}`;
      await db.query(insertTagsSql);
    }

    // Audit logging
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [
        authorId, 
        "story.update", 
        "story", 
        storyId, 
        title, 
        `New revision #${revisionId} created. Message: ${changeMessage}`
      ]
    );

    // 4. Return the new DTO by calling GET with the specific revisionId
    // We construct a new URL with the query param to force GET to fetch this specific revision
    const url = new URL(req.url);
    url.searchParams.set("revisionId", revisionId.toString());

    const headers = new Headers(req.headers);
    // make sure Cookie is preserved (some code paths may drop it)
    headers.set("cookie", req.headers.get("cookie") ?? "");

    // Create a new request object with the updated URL to pass to GET
    const getReq = new NextRequest(url, {
      method: "GET",
      headers,
    });

    return GET(getReq, { params });

  } catch (error) {
    console.error(`Error updating story with slug ${slug}:`, error);
    return NextResponse.json({ error: 'Failed to update story.' }, { status: 500 });
  }
}