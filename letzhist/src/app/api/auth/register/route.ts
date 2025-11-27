import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";


/** * POST /api/auth/register
 * 
 * Registers a new user with username, email, and password.
 * Passwords are hashed using PBKDF2 before storing.
 * 
 * example code subject to change based on db setup!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const [existing] = await db.query(
      "SELECT id_pk FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "Email or username already exists." },
        { status: 409 }
      );
    }

    // Generate salt
    const salt = crypto.randomBytes(16).toString("hex");

    // Hash password using PBKDF2
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    // Insert into database
    await db.query(
      `
      INSERT INTO users (username, email, password_hash, password_salt, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [username, email, hash, salt]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
