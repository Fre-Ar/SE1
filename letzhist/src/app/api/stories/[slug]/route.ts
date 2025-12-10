import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// We only need the types from data_types.tsx
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
  user_fk: number;
  body: string;
  created_at: Date;
  username: string;
}

// ==========================================
// 1. GET /api/stories/:slug (Load for ReaderView)
// ==========================================

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
    
  try {
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
      INNER JOIN storyRevision r ON r.id_pk = (
          -- Subquery to get the latest published revision (current live version)
          SELECT id_pk FROM storyRevision r2
          WHERE r2.story_fk = s.id_pk 
          AND r2.revStatus = 'published'
          ORDER BY r2.created_at DESC 
          LIMIT 1
      )
      INNER JOIN users u ON u.id_pk = r.author_fk
      LEFT JOIN tags t ON t.storyRevision_fk = r.id_pk
      WHERE s.slug = ?
      GROUP BY s.id_pk, r.id_pk, u.id_pk
      LIMIT 1;
    `;
    
    // Use type assertion on the query result
    const [storyRows] = await db.query(storySql, [slug]) as [StoryRevisionRow[], any];

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: 'Story not found or not published' }, 
        { status: 404 }
      );
    }

    const storyRow = storyRows[0];
    const storyId = storyRow.storyId;

    // 2. Fetch all Comments for this Story Container
    const commentsSql = `
      SELECT 
        c.id_pk, c.story_fk, c.revision_fk, c.user_fk, 
        c.body, c.created_at, u.username
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
      parentId: null, // Assuming no threading yet as per DB schema
      revisionId: cRow.revision_fk.toString(),
      author: {
        id: cRow.user_fk.toString(),
        username: cRow.username,
      } as UserSummary,
      body: cRow.body,
      createdAt: new Date(cRow.created_at).toISOString(),
      status: 'visible',
    }));

    // Construct the StoryViewDTO (explicit assertion bypasses the compiler issue)
    const storyView: StoryViewDTO = {
      // StoryContent part
      title: storyRow.title,
      subtitle: storyRow.subtitle ?? undefined,
      slug: storyRow.slug,
      body: storyRow.body, 
      tags: storyRow.tags ? storyRow.tags.split(',') : [],
      leadImage: storyRow.leadImage ? JSON.parse(storyRow.leadImage) : undefined, 
      
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
// 2. POST /api/stories (Create New Story)
// (Note: This handler is only active if the file is named route.ts in a /api/stories/ directory)
// ==========================================

export async function POST(req: NextRequest) {
  const payload: SaveStoryPayload = await req.json();
  const {authorId}  = await req.json();
  
  // NOTE: Slug generation logic is simplified here.
  const newSlug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

  if (!newSlug) {
    return NextResponse.json({ error: 'Slug could not be generated from title.' }, { status: 400 });
  }

  try {
    // 1. Insert into story container
    const insertStorySql = `
      INSERT INTO story (slug, liveTitle) VALUES (?, ?);
    `;
    const [storyResult] = await db.query(insertStorySql, [newSlug, payload.title]) as [any, any];
    const storyId = storyResult.insertId;

    // 2. Insert into storyRevision (First Revision)
    const insertRevisionSql = `
      INSERT INTO storyRevision (
        story_fk, parentId_fk, author_fk, title, subtitle, slug, body, 
        leadImage, changeMessage, revStatus, created_at
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'published', NOW());
    `;
    const [revisionResult] = await db.query(insertRevisionSql, [
      storyId, 
      authorId, 
      payload.title, 
      payload.subtitle ?? null, 
      newSlug, 
      payload.body, 
      payload.leadImage ? JSON.stringify(payload.leadImage) : null,
      payload.changeMessage
    ]) as [any, any];
    const revisionId = revisionResult.insertId;

    // 3. Insert Tags
    if (payload.tags && payload.tags.length > 0) {
      const tagValues = payload.tags.map(tag => `(${revisionId}, '${tag}')`).join(', ');
      const insertTagsSql = `INSERT INTO tags (storyRevision_fk, tag) VALUES ${tagValues}`;
      await db.query(insertTagsSql);
    }
    
    // NOTE: In a production app, this would be wrapped in a transaction.

    // 4. Return the new DTO (by running the GET logic)
    // We assume the db object can handle a simplified query for the single story fetch
    return GET(req, { params: { slug: newSlug } });

  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create new story.' }, { status: 500 });
  }
}


// ==========================================
// 3. PUT /api/stories/:slug (Create New Revision)
// ==========================================

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const payload: SaveStoryPayload = await req.json();
  const {authorId}  = await req.json();

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

    if (storyRows.length === 0) {
      return NextResponse.json({ error: 'Story not found for update.' }, { status: 404 });
    }

    const storyId = storyRows[0].storyId;
    const parentId = storyRows[0].parentId;

    // 2. Insert a new storyRevision
    const insertRevisionSql = `
      INSERT INTO storyRevision (
        story_fk, parentId_fk, author_fk, title, subtitle, slug, body, 
        leadImage, changeMessage, revStatus, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', NOW());
    `;
    const [revisionResult] = await db.query(insertRevisionSql, [
      storyId, 
      parentId, // Link to previous revision
      authorId, 
      payload.title, 
      payload.subtitle ?? null, 
      slug, // Slug must remain consistent
      payload.body, 
      payload.leadImage ? JSON.stringify(payload.leadImage) : null,
      payload.changeMessage
    ]) as [any, any];
    const revisionId = revisionResult.insertId;

    // 3. Insert Tags linked to the new Revision ID
    if (payload.tags && payload.tags.length > 0) {
      const tagValues = payload.tags.map(tag => `(${revisionId}, '${tag}')`).join(', ');
      const insertTagsSql = `INSERT INTO tags (storyRevision_fk, tag) VALUES ${tagValues}`;
      await db.query(insertTagsSql);
    }

    // 4. Return the new DTO
    return GET(req, { params: { slug: slug } });

  } catch (error) {
    console.error(`Error updating story with slug ${slug}:`, error);
    return NextResponse.json({ error: 'Failed to create new story revision.' }, { status: 500 });
  }
}