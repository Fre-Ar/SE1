// app/api/moderation/users/[id]/mute/route.ts

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt, { Secret } from "jsonwebtoken";

/**
 * Helper function to check and decode the JWT and check roles.
 * In a real application, this should be a shared middleware or utility.
 */
async function authenticateAndAuthorize(req: NextRequest) {
    let token = req.cookies.get("auth_token")?.value;
    if (!token) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        return { error: "Unauthorized - no token provided", status: 401 };
    }

    const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
    if (!JWT_SECRET) {
        console.error("JWT_SECRET not set");
        return { error: "Server configuration error", status: 500 };
    }

    let decoded: any;
    try {
        decoded = jwt.verify(token, String(JWT_SECRET));
    } catch (err) {
        return { error: "Unauthorized - invalid token", status: 401 };
    }

    // Fetch the acting user's role and details
    const [userRows] = await db.query(
        "SELECT role, id_pk, username FROM users WHERE id_pk = ? LIMIT 1",
        [decoded.sub]
    );
    const users = userRows as any[];
    if (users.length === 0) {
        return { error: "Unauthorized - user not found", status: 401 };
    }
    
    const userRole = users[0].role;
    
    // Check moderator or admin role
    if (userRole !== 'moderator' && userRole !== 'admin') {
        return { error: "Forbidden - insufficient role privileges", status: 403 };
    }
    
    return { actorId: decoded.sub, actorUsername: users[0].username };
}

/**
 * POST /api/moderation/users/[id]/mute
 *
 * Mutes a user for a specified duration. Only moderators and admins can perform this action.
 * Request Body:
 * {
 * durationHours?: number; // Optional. If missing, assumes a permanent mute (is_muted=TRUE, muted_until=NULL).
 * reason: string;         // Mandatory reason for the audit log.
 * }
 */
export async function POST(req: NextRequest,{ params }: { params: { id: string } }) {
    try {
        const authResult = await authenticateAndAuthorize(req);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const { actorId } = authResult;

        // 1. Validate Target ID
        const targetId = parseInt(params.id, 10);
        if (isNaN(targetId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        // 2. Parse Request Body
        const body = await req.json();
        const { durationHours, reason } = body;

        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
             return NextResponse.json({ error: "A valid reason (min 5 chars) is mandatory for moderation actions." }, { status: 400 });
        }

        // 3. Look up Target User
        const [targetRows] = await db.query(
            "SELECT id_pk, username, is_muted, is_banned, role FROM users WHERE id_pk = ? LIMIT 1",
            [targetId]
        );

        const targets = targetRows as any[];
        if (targets.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const targetUser = targets[0];
        
        // Prevent muting a banned user or muting self/admin (optional but recommended)
        if (targetUser.is_banned) {
            return NextResponse.json({ error: "Cannot mute a banned user. Unban first." }, { status: 400 });
        }
        if (targetUser.id_pk === actorId || targetUser.role === 'admin') {
             // Admins should only be muted by other admins in a more complex setup, 
             // but simple block here prevents accidental self-mute or attacking admin.
            return NextResponse.json({ error: "Cannot mute this user." }, { status: 403 });
        }

        // 4. Calculate Mute Time
        let mutedUntil: string | null = null;
        let muteStatusMessage: string;

        if (typeof durationHours === 'number' && durationHours > 0) {
            // Temporary mute: Calculate timestamp using MySQL's DATE_ADD function syntax or calculate in JS.
            // Using JS for calculation here for simplicity across database types:
            const untilDate = new Date();
            untilDate.setHours(untilDate.getHours() + durationHours);
            mutedUntil = untilDate.toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL TIMESTAMP/DATETIME
            muteStatusMessage = `User muted for ${durationHours} hours (until ${untilDate.toISOString()})`;
        } else {
            // Permanent mute
            mutedUntil = null;
            muteStatusMessage = `User permanently muted`;
        }
        
        // Ensure is_muted is set to TRUE
        const isMuted = true;

        // 5. Update Database
        await db.query(
            "UPDATE users SET is_muted = ?, muted_until = ? WHERE id_pk = ?",
            [isMuted, mutedUntil, targetId]
        );

        // 6. Log the action
        await db.query(
            "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
            [actorId, "user.mute", "user", targetId, targetUser.username, reason]
        );

        // 7. Return Success Response
        return NextResponse.json({
            success: true,
            message: `${targetUser.username} has been muted. ${muteStatusMessage}.`,
            user: {
                id: String(targetUser.id_pk),
                username: targetUser.username,
                isMuted: isMuted,
                mutedUntil: mutedUntil ? new Date(mutedUntil).toISOString() : null,
                // Only return the necessary fields for the client to confirm the action
            }
        });

    } catch (err) {
        console.error("Mute User Error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred during the mute operation." },
            { status: 500 }
        );
    }
}