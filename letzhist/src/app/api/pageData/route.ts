import { NextResponse } from "next/server";
import { db } from "@/lib/db";


function urlParameters(url : string) {
  const params : Array<string> = url.split('&');
  const result : {[key: string]: Array<string>} = {};
  params.forEach(param => {
    const [key, value] = param.split('=');
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(value);
  });
  return result;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const queryTerm = searchParams.get("query") || "";

    const tags = searchParams.getAll("tags");

    // 1. Initialize Query Parts
    let query = "SELECT c.id_pk, c.title, c.body, c.place, c.era, c.theme, c.created_at, c.updated_at FROM content c";
    const whereConditions: string[] = [];
    const values: Array<string | number> = [];
    let requiresTagsJoin = false;
    let requiresGroupBy = false;

    // 2. Handle Search Term (Title or Body)
    if (queryTerm) {
      whereConditions.push("(c.title LIKE ? OR c.body LIKE ?)");
      values.push(`%${queryTerm}%`, `%${queryTerm}%`);
    }

    // 3. Handle Tags (Ensuring ALL tags are matched)
    if (tags.length > 0) {
      requiresTagsJoin = true;
      requiresGroupBy = true;
      const tagPlaceholders = tags.map(() => "?").join(", ");
      whereConditions.push(`t.tag IN (${tagPlaceholders})`);
      values.push(...tags);
    }

    if (requiresTagsJoin) {
      query += " JOIN tags t ON c.id_pk = t.content_fk";
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }

    if (requiresGroupBy) {
      query += " GROUP BY c.id_pk, c.title, c.created_at";

      query += ` HAVING COUNT(DISTINCT t.tag) = ${tags.length}`;
    }

    query += " ORDER BY c.created_at DESC";
    query += " LIMIT ?";
    values.push(limit); 

    console.log("Final Query:", query);
    console.log("Parameters:", values);
    const [rows] = await db.query(query, values);
    const items = (rows as any[]).map((r) => ({
      id: String(r.id_pk),
      slug: null,
      title: r.title,
      body : r.body,
      place : r.place,
      era : r.era,
      theme : r.theme,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      leadImage: undefined,
      tags: tags,
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load recent pages" }, { status: 500 });
  }
}
