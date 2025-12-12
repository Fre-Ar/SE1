import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const JWT_SECRET = process.env.JWT_SECRET!;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.sub;

    // Find stories where:
    // 1. User is the author of the revision
    // 2. Status is 'draft'
    // 3. The story has NO 'published' revisions (meaning it's a completely new story)
    const sql = `
      SELECT 
        s.id_pk as storyId,
        s.slug,
        r.id_pk as revisionId,
        r.title,
        r.created_at
      FROM story s
      JOIN storyRevision r ON s.id_pk = r.story_fk
      WHERE r.author_fk = ?
      AND r.revStatus = 'draft'
      AND NOT EXISTS (
          SELECT 1 FROM storyRevision r2
          WHERE r2.story_fk = s.id_pk AND r2.revStatus = 'published'
      )
      -- Optional: Get only the latest draft per story to avoid duplicates in list
      AND r.id_pk = (
          SELECT MAX(id_pk) FROM storyRevision r3
          WHERE r3.story_fk = s.id_pk
      )
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(sql, [userId]) as [any[], any];

    const drafts = rows.map(r => ({
      storyId: r.storyId,
      slug: r.slug,
      revisionId: r.revisionId,
      title: r.title,
      date: new Date(r.created_at).toISOString()
    }));

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching new drafts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}