import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * For now auth is stateless on the server: the client keeps the token
 * in localStorage and simply drops it on logout.
 *
 * This endpoint exists so the frontend has something to call; in the
 * future you could add server-side token blacklisting here if needed.
 */
export async function POST(req: Request) {
  try {
    // If you later add server-side sessions or token blacklisting,
    // you can inspect the Authorization header here:
    //
    // const authHeader = req.headers.get("authorization");
    // ...

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
