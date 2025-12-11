import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

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
    // 1. Get token from cookies
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    // 2. Verify Token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Token expired or invalid
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // 3. Extract User ID 
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 4. Fetch full user data from database (Exact same columns as [userId] route)
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