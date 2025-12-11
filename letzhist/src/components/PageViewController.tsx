"use client";

import React, { useState, useEffect } from "react";
import { StoryViewDTO, RevisionLogEntry, UserProfile } from "@/components/data_types";

// Import Sub-components
import { Read } from "./page-view/Read";
import { Edit } from "./page-view/Edit";
import { HistoryTab } from "./page-view/HistoryTab";
import { DiscussionTab } from "./page-view/DiscussionTab";
import { SidebarMetadata } from "./page-view/Sidebar";

interface PageViewProps {
  initialData: StoryViewDTO;
  user: UserProfile | null;
};

export const PageView: React.FC<PageViewProps> = ({ initialData, user }) => {
  const [activeTab, setActiveTab] = useState<"article" | "discussion" | "history">("article");
  const [currentStory, setCurrentStory] = useState<StoryViewDTO>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  
  const [draftBody, setDraftBody] = useState(initialData.body); 
  const [draftTitle, setDraftTitle] = useState(initialData.title);
  const [changeMessage, setChangeMessage] = useState(""); 

  const [history, setHistory] = useState<RevisionLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // === Permission Logic ===
  const isBanned = user?.isBanned ?? false; // Assuming schema update or custom field
  const isMuted = user?.isMuted ?? false;
  const isMuteActive = isMuted && user?.mutedUntil 
    ? new Date(user.mutedUntil) > new Date() 
    : isMuted;

  // Can Edit if: Logged in AND Not Banned AND Not Muted
  const canEdit = user && !isBanned && !isMuteActive;

  useEffect(() => {
    setCurrentStory(initialData);
    setDraftBody(initialData.body);
    setDraftTitle(initialData.title);
  }, [initialData]);

  // === API Mocks ===
  const fetchHistory = async () => {
    if (history.length > 0) return;
    setIsLoadingHistory(true);
    
    console.log(`Fetching history for story ${currentStory.storyId}...`);
    setTimeout(() => {
      setHistory([
        { revisionId: "rev-3", parentId: 'rev-2', date: "2025-11-18", author: { id: "u1", username: "ArmandoF" }, changeMessage: "Fixed typos", isCurrent: true },
        { revisionId: "rev-2", parentId: 'rev-1', date: "2025-11-15", author: { id: "u2", username: "HistoryBuff" }, changeMessage: "Added 19th century section", isCurrent: false },
        { revisionId: "rev-1", parentId: null, date: "2025-11-10", author: { id: "u1", username: "ArmandoF" }, changeMessage: "Initial draft", isCurrent: false },
      ]);
      setIsLoadingHistory(false);
    }, 800);
  };

  const handleSaveRevision = async () => {
    console.log("Saving new revision...", { draftTitle, changeMessage });
    setCurrentStory((prev) => ({
      ...prev,
      title: draftTitle,
      body: draftBody,
      lastEdited: new Date().toISOString().split("T")[0],
      revisionId: "rev-new-temp",
    }));
    setIsEditing(false);
    setChangeMessage("");
    setActiveTab("article");
  };

  const loadRevision = async (revId: string) => {
    console.log(`Loading specific revision: ${revId}`);
    alert(`Logic to reload page with revision ${revId} would go here.`);
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
            {!isEditing && (
              canEdit ? (
                <button
                  onClick={() => {
                    setDraftBody(currentStory.body);
                    setDraftTitle(currentStory.title);
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
                  body={draftBody}
                  changeMessage={changeMessage}
                  setTitle={setDraftTitle}
                  setBody={setDraftBody}
                  setChangeMessage={setChangeMessage}
                  onCancel={() => setIsEditing(false)}
                  onSave={handleSaveRevision}
                />
              ) : (
                <Read story={currentStory} />
              )
            )}

            {activeTab === "discussion" && (
              <DiscussionTab 
                comments={currentStory.discussion} 
                storyId={currentStory.storyId} 
                currentUser={user} // Pass user down for permission check
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

// Simple internal helper
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