import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/utils";


/**
 * Interface for the raw SQL result
 */
interface UserRow {
  id_pk: number;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  is_muted: boolean;
  muted_until: Date | null;
  created_at: Date;
  last_login: Date | null;
}

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * It decodes the JWT to get the ID, then fetches fresh data from the DB.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Get userId from cookies
    const response = getUserIdFromRequest(req);
    if (response.error) {
      return {
        error: response.error,
        status: response.status
      };
    }
    const userId = response.value;

    // 2. Fetch full user data from database (Exact same columns as [userId] route)
    const [userRows] = await db.query(
      "SELECT id_pk, username, email, role, is_muted, muted_until, is_banned, created_at, last_login FROM users WHERE id_pk = ? LIMIT 1",
      [userId]
    ) as [UserRow[], any];

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // 5. Check if Banned
    if (user.is_banned) {
      return NextResponse.json(
        { error: "Account suspended" },
        { status: 403 }
      );
    }

    // 6. Return user profile (Matching the structure of [userId] route)
    return NextResponse.json({
      user: {
        id: user.id_pk,
        username: user.username,
        email: user.email,
        role: user.role,
        isMuted: user.is_muted,
        mutedUntil: user.muted_until,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        isBanned: user.is_banned,
      },
    });

  } catch (err) {
    console.error("Error fetching current user profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}