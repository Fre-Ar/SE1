import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Interface for the raw SQL result of the User data.
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
 * GET /api/auth/:userId
 *
 * Returns the UserProfile of a user by their id.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  try {
    // Fetch full user data from database
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
    


    // Return user profile
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
    console.error("Error fetching user profile:", err);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}