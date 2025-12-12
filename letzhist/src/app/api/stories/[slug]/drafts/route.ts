import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const JWT_SECRET = process.env.JWT_SECRET!;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.sub;

    // Fetch drafts for this specific story and user
    const sql = `
      SELECT 
        r.id_pk as revisionId,
        r.title,
        r.created_at,
        r.changeMessage
      FROM storyRevision r
      JOIN story s ON s.id_pk = r.story_fk
      WHERE s.slug = ?
      AND r.author_fk = ?
      AND r.revStatus = 'draft'
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(sql, [slug, userId]) as [any[], any];

    const drafts = rows.map(r => ({
      revisionId: r.revisionId.toString(),
      title: r.title,
      date: new Date(r.created_at).toISOString(),
      summary: r.changeMessage
    }));

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}