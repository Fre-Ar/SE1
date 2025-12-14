import React from "react";
import { Comment, UserProfile } from "@/components/data_types";
import { FaReply, FaTrash, FaFlag } from "react-icons/fa";

export type CommentNodeType = {
  comment: Comment, 
  replies: CommentNodeType[]
}

interface CommentNodeProps {
  comment: Comment, 
  replies: CommentNodeType[], 
  currentUser: UserProfile | null,
  onReply: (parentId: string) => void,
  onDelete: (id: string) => void,
  onReport: (comment: Comment) => void
}


export const CommentNode: React.FC<CommentNodeProps> = ({ comment, replies, currentUser, onReply, onDelete, onReport }) => {
  const isDeleted = comment.status !== 'visible';
  const isAuthor = currentUser?.id === comment.author.id;
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const canDelete = !isDeleted && (isAuthor || isStaff);

  return (
    <div className="flex gap-3 mb-4">
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isDeleted ? "bg-slate-100 text-slate-300" : "bg-uni-blue/10 text-uni-blue"
      }`}>
        {isDeleted ? "?" : comment.author.username.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-semibold ${isDeleted ? "text-slate-400 italic" : "text-slate-900"}`}>
            {isDeleted ? "Deleted User" : comment.author.username}
          </span>
          <span className="text-xs text-slate-400">
             {new Date(comment.createdAt).toLocaleDateString()}
          </span>
          {isStaff && !isDeleted && <span className="text-[10px] text-slate-400 px-1 border border-slate-200 rounded">#{comment.id}</span>}
        </div>

        {/* Body */}
        <div className={`text-sm p-3 rounded border ${
          isDeleted 
            ? "bg-slate-50 border-slate-100 text-slate-400 italic" 
            : "bg-white border-slate-200 text-slate-800 shadow-sm"
        }`}>
          {isDeleted ? (
            comment.status === 'hidden_by_mod' ? "[Comment removed by moderator]" : "[Comment deleted by user]"
          ) : (
            comment.body
          )}
        </div>

        {/* Actions */}
        {!isDeleted && currentUser && (
          <div className="flex items-center gap-4 mt-1 ml-1">
            <button 
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-uni-blue font-medium transition-colors"
            >
              <FaReply /> Reply
            </button>
            
            {canDelete && (
              <button 
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
              >
                <FaTrash /> Delete
              </button>
            )}
            
            {/* Simple Report Placeholder (Logic would go to Dispute System) */}
            {!isAuthor && (
              <button 
                onClick={() => onReport(comment)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 transition-colors"
              >
                 <FaFlag /> Report
              </button>
            )}
          </div>
        )}

        {/* Recursive Replies */}
        {replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-slate-100">
             {replies.map(reply => (
               <CommentNode 
                 key={reply.comment.id} 
                 comment={reply.comment} 
                 replies={reply.replies || []} 
                 currentUser={currentUser}
                 onReply={onReply}
                 onDelete={onDelete}
                 onReport={onReport}
               />
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
