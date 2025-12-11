import React from "react";
import { StoryViewDTO } from "@/components/data_types";

export const SidebarMetadata: React.FC<{ story: StoryViewDTO }> = ({ story }) => (
  <>
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Page Details
      </h2>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">Last Revised</dt>
          <dd className="font-medium text-slate-700">{story.lastEdited}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Revision ID</dt>
          <dd className="font-mono text-slate-500 truncate w-20 text-right" title={story.revisionId}>
            {story.revisionId}
          </dd>
        </div>
        
        {story.tags && story.tags.length > 0 && (
          <div className="pt-3 border-t border-slate-100 mt-3">
            <dt className="mb-2 text-slate-500">Tags</dt>
            <dd className="flex flex-wrap gap-1">
              {story.tags.map((tag) => (
                <span key={tag} className="rounded px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>

    <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-800 border border-blue-100">
      <p className="font-bold mb-1">About LetzHist</p>
      <p>This content is community-curated. View the <b>History</b> tab to see how this page evolved over time.</p>
    </div>
  </>
);