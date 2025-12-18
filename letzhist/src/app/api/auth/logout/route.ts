import { NextResponse, NextRequest } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Logs out the user by clearing the auth_token cookie.
 */
export async function POST(req: NextRequest) {
	try {
		const response = NextResponse.json({ message: "Logged out successfully" });

		// Clear the auth_token cookie
		response.cookies.set({
			name: "auth_token",
			value: "",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 0,
			path: "/",
		});

		return response;
	} catch (err) {
		console.error("Logout error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
