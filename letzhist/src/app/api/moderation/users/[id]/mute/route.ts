import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRoleFromRequest } from "@/lib/utils";


export async function POST(req: NextRequest,{ params }: { params: { id: string } }) {
    try {
        const currentUser = await getRoleFromRequest(req); 
        
            // 2. Check for the error object returned by the helper
            if (!Array.isArray(currentUser)) {
              return NextResponse.json(
                { error: currentUser.error },
                { status: currentUser.status }
              );
            }

        if (currentUser[0].role !== 'moderator' && currentUser[0].role !== 'admin') {
            return NextResponse.json({ error: "Forbidden - insufficient role privileges" }, { status: 403 });
        }
        
        const actorId = currentUser[0].id_pk;

        const targetId = parseInt(params.id, 10);
        if (isNaN(targetId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const body = await req.json();
        const { durationHours, reason } = body;

        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
             return NextResponse.json({ error: "A valid reason (min 5 chars) is mandatory for moderation actions." }, { status: 400 });
        }

        const [targetRows] = await db.query(
            "SELECT id_pk, username, is_banned, role FROM users WHERE id_pk = ? LIMIT 1",
            [targetId]
        );

        const targets = targetRows as any[];
        if (targets.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const targetUser = targets[0];
        
        // Security checks
        if (targetUser.is_banned) {
            return NextResponse.json({ error: "Cannot mute a banned user. Unban first." }, { status: 400 });
        }
        if (targetUser.id_pk === actorId || targetUser.role === 'admin') {

            return NextResponse.json({ error: "Cannot mute this user." }, { status: 403 });
        }


        let mutedUntil: string | null = null;
        let muteStatusMessage: string;

        if (typeof durationHours === 'number' && durationHours > 0) {
            const untilDate = new Date();
            untilDate.setHours(untilDate.getHours() + durationHours);

            mutedUntil = untilDate.toISOString().slice(0, 19).replace('T', ' '); 
            muteStatusMessage = `User muted for ${durationHours} hours (until ${untilDate.toISOString()})`;
        } else {

            mutedUntil = null;
            muteStatusMessage = `User permanently muted`;
        }
        
        const isMuted = true;

       
        await db.query(
            "UPDATE users SET is_muted = ?, muted_until = ? WHERE id_pk = ?",
            [isMuted, mutedUntil, targetId]
        );

   
        await db.query(
            "INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason) VALUES (?, ?, ?, ?, ?, ?)",
            [actorId, "user.mute", "user", targetId, targetUser.username, reason]
        );

  
        return NextResponse.json({
            success: true,
            message: `${targetUser.username} has been muted. ${muteStatusMessage}.`,
            user: {
                id: String(targetUser.id_pk),
                username: targetUser.username,
                isMuted: isMuted,
                mutedUntil: mutedUntil ? new Date(mutedUntil).toISOString() : null,
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