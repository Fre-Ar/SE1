
export type PageSection = {
  id: string;
  title?: string;
  markdown: string;
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

  // optional lead image like Wikipedia’s top-right image
  leadImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  
  discussion: DiscussionComment[];
};
