import React from "react";
import Link from "next/link";
import { Comment, UserProfile } from "@/components/data_types";

type DiscussionTabProps = {
  comments: Comment[];
  storyId: string;
  currentUser: UserProfile | null;
};

export const DiscussionTab: React.FC<DiscussionTabProps> = ({ comments, storyId, currentUser }) => {
  // Logic to determine if user can comment
  const isBanned = currentUser?.isBanned ?? false; // Assuming isBanned might not be on UserProfile type yet, defaulting false
  const isMuted = currentUser?.isMuted ?? false;
  
  // Check if mute is expired or active
  const isMuteActive = isMuted && currentUser?.mutedUntil 
    ? new Date(currentUser.mutedUntil) > new Date() 
    : isMuted;

  const canComment = currentUser && !isBanned && !isMuteActive;

  return (
    <div className="space-y-6">
      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded border border-dashed">
            No comments yet. Be the first to start a discussion.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                {c.author.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{c.author.username}</span>
                  <span className="text-xs text-slate-400">{c.createdAt}</span>
                </div>
                <div className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200 shadow-sm">
                  {c.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Box / Auth State */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Leave a comment</h3>
        
        {!currentUser ? (
          <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 text-center">
            <Link href="/login" className="text-uni-blue font-semibold hover:underline">Log in</Link> to join the discussion.
          </div>
        ) : isBanned ? (
          <div className="bg-red-50 p-4 rounded text-sm text-red-600 border border-red-200">
            Your account is currently banned. You cannot post comments.
          </div>
        ) : isMuteActive ? (
          <div className="bg-amber-50 p-4 rounded text-sm text-amber-700 border border-amber-200">
            You are currently muted until {currentUser.mutedUntil ? new Date(currentUser.mutedUntil).toLocaleDateString() : 'further notice'}.
          </div>
        ) : (
          <>
            <textarea
              rows={3}
              placeholder="Ask a question or suggest a correction..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-uni-blue focus:outline-none focus:ring-1 focus:ring-uni-blue"
            />
            <div className="mt-2 flex justify-end">
              <button className="rounded-md bg-uni-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Post Comment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};