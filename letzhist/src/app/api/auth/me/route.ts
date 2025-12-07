import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile.
 * Reads JWT token from cookies or Authorization header.
 */
export async function GET(req: NextRequest) {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies.get('auth_token')?.value;

        if (!token) {
            // Try Authorization header as fallback
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized - no token provided" },
                { status: 401 }
            );
        }

        // Verify and decode token
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

        // Fetch full user data from database
        const [rows] = await db.query(
            "SELECT id_pk, username, email, role, is_muted, muted_until, is_banned FROM users WHERE id_pk = ? LIMIT 1",
            [decoded.sub]
        );

        const users = rows as any[];
        if (users.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = users[0];

        // Return user profile
        return NextResponse.json({
            user: {
                id: user.id_pk,
                username: user.username,
                email: user.email,
                role: user.role,
                isMuted: user.is_muted,
                mutedUntil: user.muted_until,
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