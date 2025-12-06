import mysql from "mysql2/promise";

/**
 * MySQL connection pool for your Docker-hosted LetzHist database.
 * 
 * Works in Next.js App Router server components and route handlers.
 */
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "letzuser",
  password: process.env.DB_PASSWORD || "letzpass",
  database: process.env.DB_NAME || "letz_hist_db",
  connectionLimit: 10,
});
