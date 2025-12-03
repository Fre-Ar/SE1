import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/stories?limit=6
 * Returns a JSON array of recent pages from the `content` table.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit") ?? "6";
    let limit = parseInt(limitParam, 10) || 6;
    limit = Math.max(1, Math.min(20, limit));

    const [rows] = await db.query(
      "SELECT id_pk, title, created_at FROM content ORDER BY created_at DESC LIMIT ?",
      [limit]
    );

    const items = (rows as any[]).map((r) => ({
      id: String(r.id_pk),
      slug: null,
      title: r.title,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      leadImage: undefined,
      tags: [],
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load recent pages" }, { status: 500 });
  }
}
