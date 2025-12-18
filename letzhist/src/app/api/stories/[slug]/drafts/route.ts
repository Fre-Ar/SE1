import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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