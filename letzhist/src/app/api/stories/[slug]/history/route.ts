import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RevisionLogEntry } from "@/components/data_types";

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Fetch all revisions for the story identified by slug
    // We join with users to get author details
    const sql = `
      SELECT 
        r.id_pk as revisionId,
        r.parentId_fk as parentId,
        r.created_at as date,
        r.changeMessage,
        r.revStatus,
        u.id_pk as userId,
        u.username
      FROM storyRevision r
      INNER JOIN story s ON s.id_pk = r.story_fk
      LEFT JOIN users u ON u.id_pk = r.author_fk
      WHERE s.slug = ?
      AND r.revStatus = 'published' 
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(sql, [slug]) as [any[], any];

    const history: RevisionLogEntry[] = rows.map((row, index) => ({
      revisionId: row.revisionId.toString(),
      parentId: row.parentId ? row.parentId.toString() : null,
      author: {
        id: row.userId?.toString() ?? "Unknown Id",
        username: row.username ?? "Unknown",
      },
      date: new Date(row.date).toISOString().split('T')[0], // YYYY-MM-DD
      changeMessage: row.changeMessage || "No description",
      isCurrent: index === 0, // the first result is implicitly the current live version.
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}