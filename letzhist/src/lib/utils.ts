import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Helper to format tags (spaces -> underscores, lowercase)
export const formatTag = (val: string) => val.trim().toLowerCase().replace(/\s+/g, '_');
// Helper to unformat tags (underscores -> spaces, trim)
export const unformatTag = (val: string) => val.replace(/_+/g, ' ').trim();


export const getUserIdFromRequest = (req: NextRequest): { value?: string; error?: string; status: number } => {
  // 1. Get token from cookies
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return {
      value: undefined,
      error: "Unauthorized - no token provided",
      status: 401 
    };
  }

  // 2. Verify Token
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("JWT_SECRET not set");
    return { 
      value: undefined,
      error: "Server configuration error",
      status: 500 
    };
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Token expired or invalid
    return { 
      value: undefined,
      error: "Unauthorized - invalid token",
      status: 401 
    };
  }

  // 3. Extract User ID 
  const userId = decoded.userId;

  if (!userId) {
    return {
      value: undefined,
      error: "Invalid token payload",
      status: 401 
    };
  }

  return {
    value: userId,
    error: undefined,
    status: 200 
  };
}

export const getRoleFromRequest = async (req: NextRequest): Promise<any[] | { error: string; status: number }> => {
  const response = getUserIdFromRequest(req);
  if (response.error) {
    return {
      error: response.error,
      status: response.status
    };
  }
  const userId = response.value
  
  // Check moderator or admin role
  const [actorRows] = await db.query(
    "SELECT  role, id_pk FROM users WHERE id_pk = ? LIMIT 1",
    [userId]
  );
  
  // On success, return the QueryResult
  return [actorRows];
};