import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import process from "process";


/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password using the same
 * PBKDF2 scheme as /api/auth/register.
 *
 * Returns a simple signed token plus a basic user profile.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Look up user by email
    const [rows] = await db.query(
      `
      SELECT id_pk, username, email, password_hash, password_salt, role
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Recompute the hash using the stored salt and compare
    const computedHash = crypto
      .pbkdf2Sync(password, user.password_salt, 10000, 64, "sha512")
      .toString("hex");

    if (computedHash !== user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Optional: update last_login timestamp
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id_pk = ?",
      [user.id_pk]
    );

    // Minimal HMAC-signed token: "<userId>:<timestamp>:<signature>"
    
    const secret = process.env.AUTH_SECRET || "dev-secret";
    const payload = `${user.id_pk}:${Date.now()}`;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const token = `${payload}:${signature}`;

    // Shape matches the AuthResponse type (user + token)
    return NextResponse.json({
      user: {
        id: String(user.id_pk),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
