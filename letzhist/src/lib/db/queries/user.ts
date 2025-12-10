import {db} from "../pool";
import {User, UserRole} from "../types";
import crypto from "crypto";


export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const query = "INSERT INTO users (username, email, password_hash, role, created_at, last_login) VALUES (?, ?, ?, \"contributor\", NOW(), NOW())";
  const params = [...data];

  const [result] = await db.query(query, params);

  return {
    id: result.insertId,
    ...data,
    role: "contributor",
    createdAt: new Date(),
    lastLogin: new Date()
  };
}

export async function getUserById(id: number): Promise<User | null> {
  return null; //TODO: implement
}
