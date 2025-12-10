export type UserRole = "contributor" | "moderator" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export interface Content {
  id: number;
  title: string;
  body: string;
  place: string;
  era: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Comment {
  id: number;
  contentId: number;
  userId: number;
  body: string;
  createdAt: Date;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Dispute {
  id: number;
  contentId: number;
  reason: string;
  status: DisputeStatus;
  createdAt: Date;
  updatedAt: Date | null;
}

export type EditAction = "create" | "update" | "delete";

export interface EditHistory {
  id: number;
  contentId: number;
  userId: number;
  actionPerformed: EditAction;
  details: any;
  timestamp: Date;
}

export interface Edits {
  id: number;
  userId: number;
  editId: number;
}

export interface Disputing {
  id: number;
  disputeId: number;
  user1Id: number;
  user2Id: number;
  timestamp: Date;
}
