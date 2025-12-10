// ==========================================
// 1. GENERIC API RESPONSES
// ==========================================

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

// For things like disputes where you need extra counts, extend the type:
export type DisputeListResponse = PaginatedResponse<Dispute> & {
  meta: {
    pendingCount: number;
  };
};

export type AuthResponse = {
  user: UserProfile;
  token: string;
};

// ==========================================
// 2. USER & AUTHENTICATION
// ==========================================

export type UserRole = 'visitor' | 'contributor' | 'moderator' | 'admin';

export type UserProfile = {
  id: string;
  username: string;
  email?: string; // Email might be hidden in public contexts
  role: UserRole;
  isMuted?: boolean;
  mutedUntil?: string; // ISO Date string
  createdAt: string;   // Helpful for "Member since..."
};

// Lightweight user ref for comments/history
export type UserSummary = {
  id: string;
  username: string;
};

// ==========================================
// 3. STORIES (CONTENT)
// ==========================================


// ==========================================
// STORY DATA MODEL (Git/Wikipedia Style)
// ==========================================

// 1. THE CONTENT (The "Blob")
// This is the actual data we care about. 
// It is separated so we can easily type the "diff" between two versions.
export type StoryContent = {
  title: string;
  subtitle?: string;
  slug: string; // e.g., 'old-town-hall'
  body: string; // The main text content
  tags: string[];
  // Metadata for the lead image (stored here to be versioned!)
  leadImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
};

// 2. THE REVISION (The "Commit")
// An immutable snapshot of the story at a point in time.
export type StoryRevision = {
  id: string; // UUID or Hash (e.g., 'rev-abc-123')
  storyId: string; // Links this revision to the Story container
  
  // The "Git" Factor:
  parentId: string | null; // Points to the previous revision. Null if it's the first one.
  
  content: StoryContent; // The full snapshot of data at this moment
  
  // Audit / Meta
  author: UserSummary; // Who made this specific change
  createdAt: string; // ISO Date
  changeMessage: string; // The "Commit Message" (e.g., "Fixed typo in date")
  
  // Status of this specific revision
  status: 'draft' | 'published';
};

// 3. THE STORY (The "Repository")
// The persistent container that users actually "visit".
export type Story = {
  id: string; // Persistent ID (e.g., 'story-555')
  createdAt: string; // When the story was first created
  
  // The Pointer:
  // This determines what is shown to the public. 
  // To "Revert", we simply change this ID to an older Revision ID.
  currentRevisionId: string; 
  
  // Computed fields (optional, for performance/lists):
  // These mimic the properties of the 'currentRevision' for easy UI access
  title: string; 
  slug: string;
  leadImage?: { url: string; alt: string };
  tags: string[];
};

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

// When fetching a story for the Reader View (Read-Only)
// We merge the Container info with the Current Revision content.
export type StoryViewDTO = StoryContent & {
  storyId: string;
  revisionId: string;
  lastEdited: string;
  author: UserSummary;
  // INTEGRATION:
  // We attach the discussion threads here.
  // Typically fetched as a flat list and reconstructed into a tree by the UI.
  discussion: Comment[]; 
};

// When fetching History (The "Git Log")
export type RevisionLogEntry = {
  revisionId: string;
  parentId: string | null;
  author: UserSummary;
  date: string;
  changeMessage: string;
  isCurrent: boolean; // True if this is the active version
};

// ==========================================
// 4. DISCUSSION & COMMENTS
// ==========================================

export type Comment = {
  id: string;
  storyId: string; // LINKS TO: Story (The Persistent Container)
  
  // If null, this is a top-level comment. 
  // If set, it is a reply to another comment.
  parentId: string | null; 
  
  // CONTEXTUAL VERSIONING
  // We link the comment to the story generally, but we ALSO record 
  // which version the user was looking at when they wrote it.
  // This allows UI to show a badge like "Commented on older version".
  revisionId: string; 
  
  author: UserSummary;
  body: string;
  createdAt: string; // ISO Date
  updatedAt?: string; // If the comment itself was edited
  
  // MODERATION (FR-13)
  // Instead of deleting records from the DB, we "soft delete" or hide them.
  status: 'visible' | 'hidden_by_mod' | 'deleted_by_user';
};


// ==========================================
// 5. DISPUTES & MODERATION
// ==========================================

export type TargetType = 'comment' | 'user' | 'story';

export type ReportCategory = 
  | 'accuracy' 
  | 'bias' 
  | 'citation_missing' 
  | 'spam' 
  | 'harassment' 
  | 'hate_speech' 
  | 'violence' 
  | 'other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type Dispute = {
  id: string;
  
  // What is being reported?
  targetId: string; 
  targetType: TargetType;
  
  // Context: If reporting a Story/Accuracy, WHICH version was the user looking at?
  // Critical for reproducing the issue.
  contextRevisionId?: string; 
  
  title?: string; // Snapshot of the title at reporting time (for UI lists)
  
  reason: string;
  category: ReportCategory; 
  status: DisputeStatus;
  
  createdAt: string;
  createdBy: UserSummary; // Should be mandatory (even if anon, system needs a tracking ID)
  
  // Moderator Actions
  resolvedBy?: UserSummary;
  resolutionNotes?: string;
  resolvedAt?: string;
};

// ==========================================
// 6. AUDIT LOGS 
// ==========================================

export type AuditAction = 
  // User Management
  | 'user.ban' 
  | 'user.unban' 
  | 'user.mute' 
  | 'user.promote' 
  
  // Content Moderation
  | 'story.lock' 
  | 'story.unlock' 
  | 'story.revert' 
  | 'comment.hide' 
  
  // System
  | 'system.settings_change';

export type AuditLog = {
  id: string;
  
  // The "Who" (Use UserSummary or ID, not just a string username)
  actor: UserSummary; 
  
  // The "What"
  action: AuditAction; 
  
  // The "Target"
  targetId: string; 
  targetType: TargetType;
  
  // The "When"
  timestamp: string;
  
  // The "Why" (FR-12/13 requires rationale)
  rationale?: string; 
  
  // The "Details" (JSON blob for specifics)
  // e.g., { oldRole: 'contributor', newRole: 'moderator' }
  // e.g., { duration: '24h' }
  metadata?: Record<string, any>; 
};

export type IPBan = {
  id: string;
  ip: string;
  reason?: string;
  createdBy: UserSummary; // Traceability: Who banned this IP?
  createdAt: string;
  expiresAt?: string; // Good practice to allow temporary IP blocks
};