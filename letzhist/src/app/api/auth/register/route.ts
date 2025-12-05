import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise pool
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    // Check uniqueness
    const [rows] = await db.query("SELECT id_pk, username, email FROM users WHERE email = ? OR username = ? LIMIT 1", [email, username]);
    // rows could be RowDataPacket[] or similar
    if ((rows as any[]).length > 0) {
      const existing = (rows as any[])[0];
      if (existing.email === email) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      if (existing.username === username) {
        return NextResponse.json({ error: "Username already in use" }, { status: 409 });
      }
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const JWT_SECRET = process.env.JWT_SECRET as Secret | undefined;
        if (!JWT_SECRET) {
          console.error("JWT_SECRET not set");
          return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

    // Insert user
    const id = uuidv4();
    const role = "contributor";
    const insertSql = "INSERT INTO users (id_pk, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)";
    await db.query(insertSql, [id, username, email, password_hash, role]);

    // Create token
    const token = (jwt as any).sign(
          { sub: id, username, role },
          String(JWT_SECRET),
          { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );
    // Response
    return NextResponse.json({
      user: { id, username, role },
      token,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}