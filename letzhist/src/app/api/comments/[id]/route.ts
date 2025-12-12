import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const commentId = parseInt(id, 10);

  // 1. Auth Check
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId || decoded.sub;

    // 2. Fetch Comment & User Role
    const [rows] = await db.query(`
      SELECT c.user_fk, u.role 
      FROM comment c
      CROSS JOIN users u 
      WHERE c.id_pk = ? AND u.id_pk = ?
    `, [commentId, userId]) as [any[], any];

    if (rows.length === 0) {
      // Either comment doesn't exist or user doesn't exist
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { user_fk: authorId, role: userRole } = rows[0];

    // 3. Permission Check
    // Allowed if: User is Author OR User is Moderator/Admin
    const isAuthor = authorId === userId;
    const isStaff = userRole === 'moderator' || userRole === 'admin';

    if (!isAuthor && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Soft Delete
    // If Admin/Mod -> 'hidden_by_mod'
    // If Author -> 'deleted_by_user'
    const newStatus = isStaff && !isAuthor ? 'hidden_by_mod' : 'deleted_by_user';

    await db.query(
      "UPDATE comment SET status = ? WHERE id_pk = ?",
      [newStatus, commentId]
    );

    return NextResponse.json({ success: true, status: newStatus });

  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}