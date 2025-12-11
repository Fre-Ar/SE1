import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StoryViewDTO } from "@/components/data_types";

export const Read: React.FC<{ story: StoryViewDTO }> = ({ story }) => (
  <article className="prose prose-slate max-w-none">
    {story.leadImage && (
      <figure className="float-right ml-6 mb-4 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <img
          src={story.leadImage.url}
          alt={story.leadImage.alt}
          className="mx-auto mb-2 h-auto w-full rounded object-cover"
        />
        {story.leadImage.caption && (
          <figcaption className="text-center text-xs text-slate-500 italic">
            {story.leadImage.caption}
          </figcaption>
        )}
      </figure>
    )}
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {story.body}
    </ReactMarkdown>
  </article>
);