import type { Dispute, DisputeStatus } from "../types";
import { db } from "../pool";


export async function createDispute(contentId: number, userId: number, reason: string): Promise<Dispute> {
  const query = "INSERT INTO dispute (content_fk, reason, currentStatus, created_at, updated_at) VALUES (?, ?, \"open\", NOW(), NOW())";
  const params = [contentId, reason];

  const [result]: any = await db.query(query, params);

  return {
    id: result.insertId,
    contentId: contentId,
    reason: reason,
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getAllDisputes(): Promise<Dispute[]> {
  const [rows] = await db.query("SELECT * FROM dispute");

  return rows as Dispute[];
}

export async function getDisputeById(id: number): Promise<Dispute | null> {
  const [rows] = await db.query("SELECT * FROM dispute WHERE id_pk = ?", [id]);
  const row = (rows as Dispute[])[0];

  return row ?? null;
}

export async function updateDisputeStatus(id: number, status: DisputeStatus): Promise<Dispute | null> {
  const query = `
    UPDATE dispute
    SET currentStatus = ?, updated_at = NOW()
    WHERE id_pk = ?
  `;
  const params = [status, id];

  await db.query(query, params);

  return getDisputeById(id);
}
  
export async function setDisputeResolved(id: number): Promise<Dispute | null> {
  return updateDisputeStatus(id, "resolved");
}

export async function setDisputeDismissed(id: number): Promise<Dispute | null> {
  return updateDisputeStatus(id, "dismissed");
}
