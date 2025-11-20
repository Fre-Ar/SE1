
export type PageSection = {
  id: string;
  title: string;
  content: string;
};

export type DiscussionComment = {
  id: string;
  author: string;
  createdAt: string; 
  body: string;
};

export type PageData = {
  title: string;
  subtitle?: string;
  lastEdited: string;
  lastEditedBy: string;
  sections: PageSection[];
  tags?: string[];
  discussion: DiscussionComment[];
};