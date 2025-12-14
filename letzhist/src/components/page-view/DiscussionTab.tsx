import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Comment, UserProfile } from "@/components/data_types";
import { CommentNode, CommentNodeType } from "./CommentNode";
import { ReportModal } from "./ReportModal";

interface DiscussionTabProps {
  comments: Comment[];
  storySlug: string;
  currentUser: UserProfile | null;
  refresh: () => void;
};

export const DiscussionTab: React.FC<DiscussionTabProps> = ({ comments, storySlug, currentUser, refresh }) => {
  const [replyTarget, setReplyTarget] = useState<string | null>(null); // ID of comment being replied to
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reporting State
  const [isReporting, setIsReporting] = useState(false);
  const [reportTargetComment, setReportTargetComment] = useState<Comment | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Logic to determine if user can comment
  const isBanned = currentUser?.isBanned ?? false; 
  const isMuted = currentUser?.isMuted ?? false;
  
  // Check if mute is expired or active
  const isMuteActive = isMuted && currentUser?.mutedUntil 
    ? new Date(currentUser.mutedUntil) > new Date() 
    : isMuted;

  const canComment = currentUser && !isBanned && !isMuteActive;


  // 1. Transform flat list to tree
  const commentTree = useMemo(() => {
    const map = new Map<string, any>();
    const roots: CommentNodeType[] = [];

    // Initialize map
    comments.forEach(c => map.set(c.id, { comment: c, replies: [] }));

    // Build hierarchy
    comments.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).replies.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });

    return roots;
  }, [comments]);

  // 2. Handlers
  const handlePost = async () => {
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    try {
       const res = await fetch(`/api/stories/${storySlug}/comments`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ body: inputText, parentId: replyTarget })
       });

       if (!res.ok) throw new Error("Failed");
       
       setInputText("");
       setReplyTarget(null);
       refresh(); // Reload data to show new comment
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if(!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if(res.ok) refresh();
    } catch(err) {
      console.error(err);
    }
  };

  // --- REPORTING LOGIC ---
  const handleReportClick = (comment: Comment) => {
    setReportTargetComment(comment);
    setIsReporting(true);
  };

  const handleReportSubmit = async (category: string, reason: string) => {
    if (!reportTargetComment) return;
    setIsSubmittingReport(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: reportTargetComment.id,
          targetType: 'comment',
          category,
          reason,
          contextRevisionId: reportTargetComment.revisionId 
        }),
      });

      if (!res.ok) throw new Error("Report failed");
      
      alert("Report submitted successfully. Thank you for helping keep our community safe.");
      setIsReporting(false);
      setReportTargetComment(null);
      
    } catch (err) {
      alert("Failed to submit report. Please try again later.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Report Modal */}
      <ReportModal 
        isOpen={isReporting} 
        onClose={() => setIsReporting(false)} 
        onSubmit={handleReportSubmit}
        isSubmitting={isSubmittingReport}
      />
      
      {/* Comments List */}
      <div className="min-h-[200px] mr-4">
        {commentTree.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
            <p>No comments yet.</p>
            <p className="text-xs">Be the first to start a discussion.</p>
          </div>
        ) : (
          commentTree.map(root => (
            <CommentNode 
              key={root.comment.id}
              comment={root.comment}
              replies={root.replies}
              currentUser={currentUser}
              onReply={(id) => {
                 setReplyTarget(id);
                 // Scroll to input
                 document.getElementById("comment-box")?.scrollIntoView({ behavior: 'smooth' });
              }}
              onDelete={handleDelete}
              onReport={handleReportClick} 
            />
          ))
        )}
      </div>

      {/* Input Area */}
      <div id="comment-box" className="pt-4 border-t border-slate-200 sticky bottom-0 bg-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Leave a comment</h3>
        
        {!currentUser ? (
          <div className="text-center p-4 rounded text-sm text-slate-600 bg-slate-50">
            <Link href="/login" className="text-uni-blue font-bold hover:underline">Log in</Link> to join the discussion.
          </div>
        ) : isBanned ? (
          <div className="bg-red-50 p-4 rounded text-sm text-red-600 border border-red-200">
            Your account is currently banned. You cannot post comments.
          </div>
        ) : isMuteActive ? (
          <div className="bg-amber-50 p-4 rounded text-sm text-amber-700 border border-amber-200">
            You are currently muted until {currentUser!.mutedUntil ? new Date(currentUser!.mutedUntil!).toLocaleDateString() : 'further notice'}.
          </div>
        ) : (
          <div className="space-y-3">
             {/* Reply Context Banner */}
             {replyTarget && (
               <div className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs">
                 <span>Replying to a comment...</span>
                 <button onClick={() => setReplyTarget(null)} className="hover:text-blue-950 font-bold">Cancel</button>
               </div>
             )}
             
             <label className="sr-only">Leave a comment</label>
             <textarea
               rows={3}
               value={inputText}
               onChange={e => setInputText(e.target.value)}
               placeholder={replyTarget ? "Write your reply..." : "Ask a question, add context, or suggest a correction..."}
               className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-uni-blue focus:ring-1 focus:ring-uni-blue outline-none transition shadow-inner bg-white px-3 py-2"
             />
             
             <div className="flex justify-between items-center">
               <span className="text-xs text-slate-400">Markdown supported. Be respectful.</span>
               <button 
                 onClick={handlePost}
                 disabled={isSubmitting || !inputText.trim()}
                 className="bg-uni-blue text-white px-5 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
               >
                 {isSubmitting ? "Posting..." : (replyTarget ? "Post Reply" : "Post Comment")}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};