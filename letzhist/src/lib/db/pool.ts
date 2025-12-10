import mysql from "mysql2/promise";

/**
 * MySQL connection pool for your Docker-hosted LetzHist database.
 * 
 * Works in Next.js App Router server components and route handlers.
 */
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "letzhist",
  connectionLimit: 10,
});
