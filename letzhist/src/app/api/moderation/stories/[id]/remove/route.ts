import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * POST /api/moderation/stories/[id]/remove
 *
 * Removes a published story/page. Only moderators and admins can perform this action.
 * Requires: reason (optional)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      [decoded.sub]
    );

    const actors = actorRows as any[];
    if (
      actors.length === 0 ||
      (actors[0].role !== "moderator" && actors[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden - only moderators and admins can remove stories" },
        { status: 403 }
      );
    }

    // Get the story to remove
    const storyId = parseInt(params.id, 10);
    if (isNaN(storyId)) {
      return NextResponse.json({ error: "Invalid story ID" }, { status: 400 });
    }

    const [storyRows] = await db.query(
      "SELECT id_pk, title, is_removed FROM content WHERE id_pk = ? LIMIT 1",
      [storyId]
    );

    const stories = storyRows as any[];
    if (stories.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const story = stories[0];

    if (story.is_removed) {
      return NextResponse.json(
        { error: "Story is already removed" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { reason } = body;

    // Remove the story
    await db.query("UPDATE content SET is_removed = TRUE WHERE id_pk = ?", [
      storyId,
    ]);

    // Log the action
    await db.query(
      "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
      [decoded.sub, "remove_story", "story", storyId, story.title, reason || null]
    );

    return NextResponse.json({
      message: `Story "${story.title}" has been removed`,
      story: {
        id: story.id_pk,
        title: story.title,
        is_removed: true,
      },
    });
  } catch (err) {
    console.error("Error removing story:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
