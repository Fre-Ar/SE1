import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest } from "@/lib/utils";

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
      const actors = await getRoleFromRequest(req); 
  
      // 2. Check for the error object returned by the helper
      if (!Array.isArray(actors)) {
        return NextResponse.json(
          { error: actors.error },
          { status: actors.status }
        );
      }
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
      [actors[0].id_pk, "remove_story", "story", storyId, story.title, reason || null]
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
