import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * GET /api/moderation/stories?limit=20&page=1
 *
 * Returns a list of published stories for management by moderators and admins.
 * Only moderators and admins can access this endpoint.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    let token = req.cookies.get("auth_token")?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, String(JWT_SECRET));
    } catch (err) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Check moderator or admin role
    const [actorRows] = await db.query(
      "SELECT role FROM users WHERE id_pk = ? LIMIT 1",
      [decoded.userId]
    );

    const actors = actorRows as any[];
    if (
      actors.length === 0 ||
      (actors[0].role !== "moderator" && actors[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden - only moderators and admins can view story list" },
        { status: 403 }
      );
    }

    // Parse pagination params
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit") ?? "20";
    const pageParam = url.searchParams.get("page") ?? "1";

    let limit = parseInt(limitParam, 10) || 20;
    let page = parseInt(pageParam, 10) || 1;

    limit = Math.max(1, Math.min(100, limit));
    page = Math.max(1, page);

    const offset = (page - 1) * limit;

    // Get total count
    const [countRows] = await db.query(
      "SELECT COUNT(*) as total FROM content WHERE is_removed = FALSE"
    );
    const totalCount = (countRows as any[])[0]?.total || 0;

    // Get stories
    const [stories] = await db.query(
      `SELECT 
        id_pk,
        title,
        place,
        era,
        theme,
        is_removed,
        created_at,
        updated_at
      FROM content
      WHERE is_removed = FALSE
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const formattedStories = (stories as any[]).map((story) => ({
      id: String(story.id_pk),
      title: story.title,
      place: story.place,
      era: story.era,
      theme: story.theme,
      isRemoved: story.is_removed,
      createdAt: story.created_at ? new Date(story.created_at).toISOString() : null,
      updatedAt: story.updated_at ? new Date(story.updated_at).toISOString() : null,
    }));

    return NextResponse.json({
      data: formattedStories,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching stories:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
