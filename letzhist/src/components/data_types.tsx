// ==========================================
// 1. GENERIC API RESPONSES
// ==========================================

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    total: number;
    pendingCount?: number; // Specific to disputes, optional elsewhere
  };
};

export type AuthResponse = {
  user: UserProfile;
  token: string;
};

// ==========================================
// 2. USER & AUTHENTICATION
// ==========================================

export type UserRole = 'contributor' | 'moderator' | 'admin';

export type UserProfile = {
  id: string;
  username: string;
  email?: string; // Email might be hidden in public contexts
  role: UserRole;
  isMuted?: boolean;
  mutedUntil?: string; // ISO Date string
};

// Lightweight user ref for comments/history
export type UserSummary = {
  id: string;
  username: string;
};

// ==========================================
// 3. STORIES (CONTENT)
// ==========================================

export type ImageAsset = {
  url: string;
  alt: string;
  caption?: string;
};

export type PageSection = {
  id: string;
  title?: string;
  markdown: string;
};

export type PageData = {
  id: string;
  slug: string; // url path, ex: 'old-town-square', so the url will be www.[website]/stories/[slug]
  title: string;
  subtitle?: string;
  lastEdited: string; // ISO Date
  lastEditedBy: string; // Username
  sections: PageSection[];
  tags?: string[];
  leadImage?: ImageAsset; // optional lead image like Wikipedia’s top-right image
  discussion: DiscussionComment[];
};

// The lightweight shape returned by GET /api/stories (List View)
export type StoryListItem = {
  id: string;
  slug: string;
  title: string;
  leadImage?: { url: string; alt: string };
  tags: string[];
  createdAt: string; // ISO Date
};

export type VersionHistoryEntry = {
  versionId: string;
  editedBy: string;
  timestamp: string;
  changeSummary: string;
};

// ==========================================
// 4. INTERACTION (COMMENTS)
// ==========================================

export type DiscussionComment = {
  id: string;
  author: string; // Username (legacy support) or UserSummary in future
  createdAt: string; 
  body: string;
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
  targetId: string;
  targetType: TargetType;
  targetTitle?: string; // Useful for UI lists so mods know what page it is
  reason: string;
  category?: ReportCategory; 
  status: DisputeStatus;
  createdAt: string;
  createdBy?: UserSummary; // The reporter
  resolutionNotes?: string;
};

export type AuditLog = {
  id: string;
  actor: string; // Username of Mod/Admin
  action: string; // e.g., 'ban_user', 'lock_page'
  target: string; // Target Username or Page Slug
  timestamp: string;
};

export type IPBan = {
  id: string;
  ip: string;
  reason?: string;
  createdAt: string;
};
