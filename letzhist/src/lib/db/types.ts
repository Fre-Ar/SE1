export type UserRole = "contributor" | "moderator" | "admin";

export interface User {
  id_pk: number;
  username: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export interface Content {
  id_pk: number;
  title: string;
  body: string;
  place: string;
  era: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Comment {
  id_pk: number;
  content_fk: number;
  user_fk: number;
  body: string;
  createdAt: Date;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Dispute {
  id_pk: number;
  content_fk: number;
  reason: string;
  currentStatus: DsiputeStatus;
  createdAt: Date;
  updatedAt: Date | null;
}

export type EditAction = "create" | "update" | "delete";

export interface EditHistory {
  id_pk: number;
  content_fk: number;
  user_fk: number;
  actionPerformed: EditAction;
  details: string | null;
  timestamp: Date;
}

export interface Edits {
  id_pk: number;
  user_fk: number;
  edit_fk: number;
}

export interface Disputing {
  id_pk: number;
  dispute_fk: number;
  user1_fk: number;
  user2_fk: number;
  timestamp: Date;
}
