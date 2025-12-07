import type { Content } from "../types"
import { db } from "../pool"


export interface CreateContentInput {
  title: string;
  body: string;
  place: string;
  era: string;
  theme: string;
}

export interface UpdateContentInput {
  title?: string;
  body?: string;
  place?: string;
  era?: string;
  theme?: string;
}


export async function getAllContent(filters?: Partial<Content>): Promise<Content[]> {
  let query = "SELECT * from content WHERE 1=1";
  const params: any[] = [];

  if (filters?.place) {
    query += " AND place = ?";
    params.push(filters.place);
  }
  
  if (filters?.era) {
    query += " AND era = ?";
    params.push(filters.era);
  }

  if (filters?.theme) {
    query += " AND theme = ?";
    params.push(filters.theme);
  }

  const [rows] = await db.query(query, params)

  return rows as Content[];
}

export async function createContent(data: CreateContentInput): Promise<Content> {
  const query = "INSERT INTO content (title, body, place, era, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())";
  const params = [
    data.title,
    data.body,
    data.place,
    data.era,
    data.theme
  ];

  const [result]: any = await db.query(query, params);

  return {
    id_pk: result.insertId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getContentById(id_pk: number): Promise<Content | null> {
  const [rows] = await db.query("SELECT * FROM content WHERE id_pk = ?", [id_pk]);
  const row = (rows as Content[])[0];
  return row ?? null;
}

export async function getContentBySlug(slug: string): Promise<Content[] | null> {
  const [rows] = await db.query("SELECT * FROM content WHERE LOWER(REPLACE(title, ' ', '_')) = ?", [slug.toLowerCase()]);

  return rows ?? null;
}

export async function updateContent(id_pk: number, data: UpdateContentInput): Promise<Content | null> {
  const fields = Object.keys(data);
  if (fields.length === 0) return getContentById(id_pk);

  const setClause = fields.map(f => `$(f) = ?`).join(", ");
  const params = [...fields.map(f => (data as any)[f]), id_pk];

  const query = `
    UPDATE content
    SET ${setClause}, updated_at = NOW()
    WHERE id_pk = ?
  `;

  await db.query(query, params);

  return getContentById(id_pk);
}
