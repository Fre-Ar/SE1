import type { Comment } from "../types";
import { db } from "../pool";
import { getContentBySlug } from "./content"


export async function createComment(slug: string, user_id: number, body: string): Promise<Comment | null> {
  const content = await getContentBySlug(slug);
  if (!content) return null;

  const query = `
    INSERT INTO comment (content_fk, user_fk, body, created_at)
    VALUES (?, ?, ?, NOW())
  `;

  const params = [content.id_pk, user_id, body];
  const [result]: any = await db.query(query, params);

  return {
    id_pk: result.insertId,
    content_fk: content.id_pk,
    user_fk: user_id,
    body: body,
    createdAt: new Date()
  };
}

export async function deleteComment(comment_id: number): Promise<boolean> {
  const [result]: any = await db.query("DELETE FROM comment WHERE id_pk = ?", [comment_id]);

  return result.affectedRows > 0;
}

export async function getCommentsForContent(slug: string): Promise<Comment[]> {
  const content = await getContentBySlug(slug);
  if (!content) return [];

  const [rows] = await db.query("SELECT * FROM comment WHERE content_fk = ?", [content.id_pk]);

  return rows as Comment[];
}
