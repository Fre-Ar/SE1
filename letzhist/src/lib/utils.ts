import jwt, { Secret } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Helper to format tags (spaces -> underscores, lowercase)
export const formatTag = (val: string) => val.trim().toLowerCase().replace(/\s+/g, '_');
// Helper to unformat tags (underscores -> spaces, trim)
export const unformatTag = (val: string) => val.replace(/_+/g, ' ').trim();


export const getRoleFromRequest = async (req: NextRequest): Promise<any[] | { error: string; status: number }> => {
    // 1. Syntax Fix: 'export const async' is wrong. Use 'export const ... = async'
    // 2. Type Fix: Use '|' for union types, and wrap in Promise.

    // Verify authentication
    let token = req.cookies.get("auth_token")?.value;
    if (!token) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        // Return JSON structure on failure
        return { 
            error: "Unauthorized - no token provided", 
            status: 401 
        };
    }

    const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
    if (!JWT_SECRET) {
        console.error("JWT_SECRET not set");
        // Return JSON structure on failure
        return { 
            error: "Server configuration error", 
            status: 500 
        };
    }

    let decoded: any;
    try {
        decoded = jwt.verify(token, String(JWT_SECRET));
    } catch (err) {
        // Return JSON structure on failure
        return { 
            error: "Unauthorized - invalid token", 
            status: 401 
        };
    }

    // Check moderator or admin role
    const [actorRows] = await db.query(
        "SELECT  role, id_pk FROM users WHERE id_pk = ? LIMIT 1",
        [decoded.userId]
    );
    
    // On success, return the QueryResult
    return [actorRows];
};