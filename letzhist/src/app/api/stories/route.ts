import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SaveStoryPayload, Story } from '@/components/data_types'; 


interface StoryRow {
  storyId: number;
  storyCreatedAt: string;
  revisionId: number;
  title: string;
  slug: string;
  leadImage: string | null; 
  tagList: string | null; 
  lastEdited: string;
}

// Helper: Slugify
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const sort = searchParams.get('sort') || 'newest';
    const tags = searchParams.getAll('tag'); // Supports multiple &tag=A&tag=B

    // Pagination Params
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // 1. Base Query Joins
    // We join 'story' with 'storyRevision'.
    const baseJoins = `
      FROM story s
      INNER JOIN storyRevision r ON r.id_pk = (
          SELECT id_pk FROM storyRevision r2
          WHERE r2.story_fk = s.id_pk 
          AND r2.revStatus = 'published'
          ORDER BY r2.created_at DESC 
          LIMIT 1
      )
      LEFT JOIN tags t ON t.storyRevision_fk = r.id_pk
    `;

    const values: any[] = [];
    const conditions: string[] = [];

    // 2. Filter: Full Text Search (Title or Body)
    if (query) {
      conditions.push(`(r.title LIKE ? OR r.body LIKE ?)`);
      values.push(`%${query}%`, `%${query}%`);
    }

    // 3. Filter: Tags
    // Since we are already joining/grouping tags, we can't easily filter in the WHERE 
    // without messing up the GROUP_CONCAT. 
    // Strategy: Use EXISTS clauses for strict filtering (AND logic).
    if (tags.length > 0) {
      tags.forEach(tag => {
        conditions.push(`
          EXISTS (
            SELECT 1 FROM tags t_filter 
            WHERE t_filter.storyRevision_fk = r.id_pk 
            AND t_filter.tag = ?
          )
        `);
        values.push(tag);
      });
    }

    // Apply WHERE clauses
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    // 4. Execute count query
    // We count distinct stories that match the criteria
    const countSql = `SELECT COUNT(DISTINCT s.id_pk) as total ${baseJoins} ${whereClause}`;
    
    // We use a copy of values for the count query because the main query will add LIMIT params
    const [countRows] = await db.query(countSql, [...values]) as [any[], any];
    const total = countRows[0]?.total || 0;

    // 5. Execute data query
    // Grouping is required for GROUP_CONCAT to work correctly
    let sql = `
      SELECT 
        s.id_pk as storyId,
        s.created_at as storyCreatedAt,
        r.id_pk as revisionId,
        r.title,
        r.slug,
        r.leadImage,
        r.created_at as lastEdited,
        GROUP_CONCAT(t.tag) as tagList
      ${baseJoins}
      ${whereClause}
      GROUP BY s.id_pk, r.id_pk 
    `;

    // 6. Sorting
    // Sorting
    switch (sort) {
      case 'title_asc': sql += ` ORDER BY r.title ASC`; break;
      case 'title_desc': sql += ` ORDER BY r.title DESC`; break;
      case 'oldest': sql += ` ORDER BY s.created_at ASC`; break;
      case 'newest':
      default: sql += ` ORDER BY s.created_at DESC`; break;
    }
    // TODO: Add more sorting options

    // 7. Pagination and Limit
    // We add this LAST, after the sorting
    sql += ` LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    // 8. Execution
    const [rows] = await db.query(sql, values) as [StoryRow[], any];

    // 8. Mapping to TypeScript Type
    const stories: Story[] = rows.map((row) => ({
      id: row.storyId.toString(),
      createdAt: new Date(row.storyCreatedAt),
      lastEdited: new Date(row.lastEdited),
      currentRevisionId: row.revisionId.toString(),
      
      title: row.title,
      slug: row.slug,
      // Parse JSON if leadImage is stored as string in DB, or use as is if driver handles it
      leadImage: typeof row.leadImage === 'string' ? JSON.parse(row.leadImage) : row.leadImage,
      
      tags: row.tagList ? row.tagList.split(',') : [],
    }));

    return NextResponse.json({
      data: stories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {

  const connection = await db.getConnection(); 
  try {
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

    if (!title || !contentBody) {
      return NextResponse.json({ error: "Title and Body are required" }, { status: 400 });
    }

    const slug =  payload.slug || generateSlug(title);
    if (!slug) {
      return NextResponse.json({ error: 'Slug could not be generated from title.' }, { status: 400 });
    }


    // 3. TRANSACTION START
    await connection.beginTransaction();

    // A. Create Story Container
    const [storyResult]: any = await connection.query(
      "INSERT INTO story (slug, liveTitle, created_at) VALUES (?, ?, NOW())",
      [slug, title]
    );
    const storyId = storyResult.insertId;

    // B. Create First Revision
    const [revResult]: any = await connection.query(
      `INSERT INTO storyRevision 
        (story_fk, parentId_fk, author_fk, title, subtitle, slug, body, leadImage, created_at, changeMessage, revStatus) 
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [storyId, authorId, title, subtitle, slug, contentBody, leadImage, changeMessage, revStatus]
    );

    const revisionId = revResult.insertId;

    // C. Insert Tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagValues = tags.map((t: string) => [revisionId, t]);
      await connection.query(
        "INSERT INTO tags (storyRevision_fk, tag) VALUES ?",
        [tagValues]
      );
    }

    // 4. TRANSACTION COMMIT
    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      storyId, 
      slug,
      status: revStatus
    });

  } catch (error: any) {
    await connection.rollback();
    console.error("Failed to create story:", error);
    
    // Handle Duplicate Slug
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "A story with this slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    connection.release();
  }
}
