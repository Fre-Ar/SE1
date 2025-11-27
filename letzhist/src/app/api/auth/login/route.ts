import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // we will create this


/** * POST /api/auth/login
 * 
 * Authenticates a user with email and password.
 * example code subject to change based on db setup!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await db.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
