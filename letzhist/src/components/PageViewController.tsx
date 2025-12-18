"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StoryViewDTO, RevisionLogEntry, UserProfile, Draft, LeadImage } from "@/components/data_types";

// Import Sub-components
import { Read } from "./page-view/Read";
import { Edit } from "./page-view/Edit";
import { HistoryTab } from "./page-view/HistoryTab";
import { DiscussionTab } from "./page-view/DiscussionTab";
import { SidebarMetadata } from "./page-view/Sidebar";

interface PageViewProps {
  initialData: StoryViewDTO;
  user: UserProfile | null;
  refresh: () => Promise<void>;
  isRefreshing?: boolean;
};

export const PageView: React.FC<PageViewProps> = ({ initialData, user, refresh, isRefreshing }) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"article" | "discussion" | "history">("article");
  const pendingTabRef = useRef<null | "article" | "discussion" | "history">(null);
  const [currentStory, setCurrentStory] = useState<StoryViewDTO>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  
  const [draftBody, setDraftBody] = useState(initialData.body); 
  const [draftTitle, setDraftTitle] = useState(initialData.title);
  const [draftSubtitle, setDraftSubtitle] = useState(initialData.subtitle);
  const [draftTags, setDraftTags] = useState(initialData.tags || []);
  const [draftLeadImage, setDraftLeadImage] = useState<LeadImage | undefined>(initialData.leadImage);
  const [changeMessage, setChangeMessage] = useState(""); 
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [history, setHistory] = useState<RevisionLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // === Permission Logic ===
  const isBanned = user?.isBanned ?? false;
  const isMuted = user?.isMuted ?? false;
  const isMuteActive = isMuted && user?.mutedUntil 
    ? new Date(user.mutedUntil) > new Date() 
    : isMuted;

  // Can Edit if: Logged in AND Not Banned AND Not Muted
  const canEdit = user && !isBanned && !isMuteActive;

  useEffect(() => {
    setCurrentStory(initialData);
    setDraftBody(initialData.body);
    setDraftTags(initialData.tags || []); 
    setDraftLeadImage(initialData.leadImage);
    setDraftTitle(initialData.title);
    setDraftSubtitle(initialData.subtitle || "");

    // if a refresh asked to land on a tab, do it *after* data updates
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    }
  }, [initialData]);

  const refreshAndGoTo = async (tab: "article" | "discussion" | "history") => {
    pendingTabRef.current = tab;
    await refresh();
  };

  // Fetch drafts when entering edit mode
  useEffect(() => {
    if (isEditing && user) {
       fetch(`/api/stories/${currentStory.slug}/drafts`)
         .then(res => res.json())
         .then(data => { if (Array.isArray(data)) setDrafts(data); })
         .catch(console.error);
    }
  }, [isEditing, user, currentStory.slug]);

  // Fetch History
  const fetchHistory = async () => {
    // Prevent refetching if we already have data (simple cache)
    if (history.length > 0) return;
    
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.slug}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      alert("Could not load revision history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle Loading a Draft
  const handleLoadDraft = async (draft: any) => {
     if (!confirm("Load this draft? Unsaved changes will be lost.")) return;
     try {
       const res = await fetch(`/api/stories/${currentStory.slug}?revisionId=${draft.revisionId}`);
       if (!res.ok) throw new Error("Err");
       const data = await res.json();
       setDraftTitle(data.title);
       setDraftSubtitle(data.subtitle);
       setDraftBody(data.body);
       setDraftTags(data.tags || []);
       setDraftLeadImage(data.leadImage);
       setChangeMessage(draft.summary || "");
     } catch (e) { alert("Failed to load draft content"); }
  };

  // Save New Revision (PUT)
  const handleSave = async (status: 'published' | 'draft') => {
    if (!user) {
      alert("You must be logged in.");
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/stories/${currentStory.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTitle,
          subtitle: draftSubtitle,
          body: draftBody,
          tags: draftTags,
          leadImage: draftLeadImage,
          changeMessage: changeMessage,
          revStatus: status,
          authorId: user.id, 
        }),
      });

      if (!res.ok) throw new Error("Failed to save revision");
      if (status === 'draft') alert("Draft saved.");
      else {
          const updated = await res.json();
          // Update UI with new data
          setCurrentStory(updated);
          // Reset Edit Mode
          setIsEditing(false);
          setChangeMessage("");
          setActiveTab("article");
      }
      
      // Clear history cache so next click fetches fresh list
      setHistory([]); 
      
    } catch (err) {
      console.error(err);
      alert("Failed to publish changes.");
    }
  };

  // Load Specific Revision
  const loadRevision = async (revId: string) => {
    // If the user requests the current version they are already viewing, do nothing
    if (revId === currentStory.revisionId) {
        setActiveTab("article");
        return;
    }

    const confirmLoad = confirm("Load this older version? Unsaved changes in the editor will be lost.");
    if (!confirmLoad) return;

    try {
      const res = await fetch(`/api/stories/${currentStory.slug}?revisionId=${revId}`);
      if (!res.ok) throw new Error("Failed to load revision");

      const data = await res.json();
      setCurrentStory(data);
      
      // Switch back to article view to see the content
      setActiveTab("article");
      
      // Note: We do NOT clear history here, as the history list itself hasn't changed.
    } catch (err) {
      console.error(err);
      alert("Could not load the requested revision.");
    }
  };

  // === Render ===
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        
        {/* LEFT COLUMN */}
        <section className="flex-1">
          
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{currentStory.title}</h1>
              {currentStory.subtitle && <p className="mt-1 text-sm text-slate-500">{currentStory.subtitle}</p>}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span>Version: <span className="font-mono text-slate-500">{currentStory.revisionId}</span></span>
                <span>•</span>
                <span>Updated {currentStory.lastEdited} by <span className="font-medium text-slate-500">{currentStory.author.username}</span></span>
              </div>
            </div>

            {/* EDIT BUTTON (Conditional) */}
            {!isEditing ? (
              canEdit ? (
                <button
                  onClick={() => {
                    setDraftBody(currentStory.body);
                    setDraftTitle(currentStory.title);
                    setDraftSubtitle(currentStory.subtitle);
                    setDraftTags(currentStory.tags);
                    setDraftLeadImage(currentStory.leadImage);
                    setChangeMessage("");
                    setIsEditing(true);
                    setActiveTab("article");
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit Page
                </button>
              ) : (
                 // Optional: Show why they can't edit
                 <div className="text-xs text-slate-400 italic">
                   {!user ? "Log in to edit" : "Editing disabled"}
                 </div>
              )
            ) : (
              <button 
                onClick={() => setIsEditing(false)} 
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-red-600 hover:font-bold"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="mb-6 border-b border-slate-200">
            <nav className="-mb-px flex gap-6 text-sm">
              <TabButton 
                label="Article" 
                isActive={activeTab === "article"} 
                onClick={() => setActiveTab("article")} 
                badge={isEditing ? "Editing" : undefined}
                badgeColor="amber"
              />
              <TabButton 
                label="Discussion" 
                isActive={activeTab === "discussion"} 
                onClick={() => setActiveTab("discussion")} 
                badge={currentStory.discussion.length > 0 ? String(currentStory.discussion.length) : undefined}
              />
              <TabButton 
                label="History" 
                isActive={activeTab === "history"} 
                onClick={() => { setActiveTab("history"); fetchHistory(); }} 
              />
            </nav>
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {activeTab === "article" && (
              isEditing ? (
                <Edit
                  title={draftTitle}
                  subtitle={draftSubtitle}
                  body={draftBody}
                  tags={draftTags}
                  leadImage={draftLeadImage}
                  changeMessage={changeMessage}
                  drafts={drafts}
                  setTitle={setDraftTitle}
                  setSubtitle={setDraftSubtitle}
                  setBody={setDraftBody}
                  setTags={setDraftTags}
                  setLeadImage={setDraftLeadImage}
                  setChangeMessage={setChangeMessage}
                  onCancel={() => setIsEditing(false)}
                  onSave={() => handleSave('published')}
                  onSaveDraft={() => handleSave('draft')}
                  onLoadDraft={handleLoadDraft}
                />
              ) : (
                <Read story={currentStory} />
              )
            )}

            {activeTab === "discussion" && (
              <DiscussionTab 
                comments={currentStory.discussion} 
                storySlug={currentStory.slug} 
                currentUser={user} // Pass user down for permission check
                refresh={() => refreshAndGoTo("discussion")}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab 
                history={history} 
                isLoading={isLoadingHistory} 
                currentRevId={currentStory.revisionId}
                onLoadRevision={loadRevision}
              />
            )}
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="w-full max-w-xs space-y-4 lg:w-72">
          <SidebarMetadata story={currentStory} />
        </aside>

      </main>
    </div>
  );
};


const TabButton = ({ label, isActive, onClick, badge, badgeColor = "slate" }: any) => (
  <button
    onClick={onClick}
    className={`border-b-2 px-1 pb-2 flex items-center gap-2 ${
      isActive
        ? "border-uni-blue font-medium text-slate-900"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    {label}
    {badge && (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        badgeColor === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
      }`}>
        {badge}
      </span>
    )}
  </button>
);