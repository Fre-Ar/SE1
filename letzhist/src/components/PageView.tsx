"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StoryViewDTO, Comment, UserSummary, RevisionLogEntry } from "@/components/data_types";

// ==========================================
// TYPES (Ensure these are in your data_types.tsx)
// ==========================================

type PageViewProps = {
  initialData: StoryViewDTO; // Server Component passes the initial state here
};

export const PageView: React.FC<PageViewProps> = ({ initialData }) => {
  // TABS: Added 'history'
  const [activeTab, setActiveTab] = useState<"article" | "discussion" | "history">("article");

  // STATE: The content currently being displayed
  const [currentStory, setCurrentStory] = useState<StoryViewDTO>(initialData);

  // STATE: Editing
  const [isEditing, setIsEditing] = useState(false);
  
  // We now edit the WHOLE body as one markdown string, not sections
  const [draftBody, setDraftBody] = useState(initialData.body); 
  const [draftTitle, setDraftTitle] = useState(initialData.title);
  const [changeMessage, setChangeMessage] = useState(""); // Essential for Audit Logs

  // STATE: History (Fetched lazily)
  const [history, setHistory] = useState<RevisionLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Reset local state if parent updates (e.g. navigation)
  useEffect(() => {
    setCurrentStory(initialData);
    setDraftBody(initialData.body);
    setDraftTitle(initialData.title);
  }, [initialData]);

  // ==========================================
  // API INTERACTIONS (MOCKED)
  // ==========================================

  const fetchHistory = async () => {
    if (history.length > 0) return; // Cache check
    setIsLoadingHistory(true);
    
    // API CALL: GET /api/stories/[id]/history
    // Expected Return: RevisionLogEntry[]
    console.log(`Fetching history for story ${currentStory.storyId}...`);
    
    // MOCK DATA
    setTimeout(() => {
      setHistory([
        { revisionId: "rev-3", parentId: 'rev-2', date: "2025-11-18", author: { id: "u1", username: "ArmandoF" }, changeMessage: "Fixed typos" , isCurrent: true},
        { revisionId: "rev-2", parentId: 'rev-1', date: "2025-11-15", author: { id: "u2", username: "HistoryBuff" }, changeMessage: "Added 19th century section" ,  isCurrent: false},
        { revisionId: "rev-1", parentId: null, date: "2025-11-10", author: { id: "u1", username: "ArmandoF" }, changeMessage: "Initial draft", isCurrent: false},
      ]);
      setIsLoadingHistory(false);
    }, 800);
  };

  const handleSaveRevision = async () => {
    // API CALL: POST /api/stories/[id]/edit
    // Payload: { 
    //   title: draftTitle, 
    //   body: draftBody, 
    //   parentId: currentStory.revisionId,
    //   changeMessage: changeMessage 
    // }
    console.log("Saving new revision...", { draftTitle, changeMessage });

    // Optimistic UI update (In reality, you'd wait for the API to return the new StoryViewDTO)
    setCurrentStory((prev) => ({
      ...prev,
      title: draftTitle,
      body: draftBody,
      lastEdited: new Date().toISOString().split("T")[0],
      revisionId: "rev-new-temp", // Provisional ID
    }));
    
    setIsEditing(false);
    setChangeMessage("");
    setActiveTab("article");
  };

  const loadRevision = async (revId: string) => {
    // API CALL: GET /api/stories/[id]?revision=revId
    // This allows "Time Travel" to see old states
    console.log(`Loading specific revision: ${revId}`);
    alert(`Logic to reload page with revision ${revId} would go here.`);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const startEditing = () => {
    setDraftBody(currentStory.body);
    setDraftTitle(currentStory.title);
    setChangeMessage("");
    setIsEditing(true);
    setActiveTab("article"); // Force view to article
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        
        {/* LEFT COLUMN: Main Content */}
        <section className="flex-1">
          
          {/* HEADER */}
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {currentStory.title}
              </h1>
              {currentStory.subtitle && (
                <p className="mt-1 text-sm text-slate-500">{currentStory.subtitle}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span>Version: <span className="font-mono text-slate-500">{currentStory.revisionId}</span></span>
                <span>•</span>
                <span>Updated {currentStory.lastEdited} by <span className="font-medium text-slate-500">{currentStory.author.username}</span></span>
              </div>
            </div>

            {/* EDIT BUTTON (Only visible if not editing) */}
            {!isEditing && (
              <button
                onClick={startEditing}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Page
              </button>
            )}
          </div>

          {/* NAVIGATION TABS */}
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

          {/* CONTENT AREA */}
          <div className="min-h-[400px]">
            {activeTab === "article" && (
              isEditing ? (
                <EditMode 
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
                <ReadMode story={currentStory} />
              )
            )}

            {activeTab === "discussion" && (
              <DiscussionTab comments={currentStory.discussion} storyId={currentStory.storyId} />
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

        {/* RIGHT COLUMN: Metadata Sidebar */}
        <aside className="w-full max-w-xs space-y-4 lg:w-72">
          <SidebarMetadata story={currentStory} />
        </aside>

      </main>
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

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

/* === 1. READ MODE (Unified Markdown) === */
const ReadMode: React.FC<{ story: StoryViewDTO }> = ({ story }) => (
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
    {/* ONE Unified Markdown Body */}
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {story.body}
    </ReactMarkdown>
  </article>
);

/* === 2. EDIT MODE (Unified Input + Change Message) === */
const EditMode = ({ title, body, changeMessage, setTitle, setBody, setChangeMessage, onCancel, onSave }: any) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
      <span className="text-lg">⚠️</span>
      <div>
        <p className="font-semibold">You are creating a new revision.</p>
        <p>Your changes will be saved as a new snapshot in the history.</p>
      </div>
    </div>

    {/* Title Input */}
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Page Title</label>
      <input 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        className="w-full text-xl font-bold p-2 border border-slate-300 rounded focus:border-uni-blue outline-none"
      />
    </div>

    {/* Body Input */}
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Content (Markdown)</label>
      <textarea 
        value={body} 
        onChange={e => setBody(e.target.value)} 
        rows={15}
        className="w-full font-mono text-sm p-3 border border-slate-300 rounded focus:border-uni-blue outline-none leading-relaxed"
      />
      <p className="text-xs text-slate-400 mt-1 text-right">Markdown supported.</p>
    </div>

    {/* Commit Message (Essential for Traceability) */}
    <div className="bg-slate-50 p-3 rounded border border-slate-200">
      <label className="block text-xs font-semibold text-slate-700 mb-1">Change Summary (Required)</label>
      <input 
        value={changeMessage} 
        onChange={e => setChangeMessage(e.target.value)} 
        placeholder="e.g. Fixed typo in the second paragraph..."
        className="w-full p-2 border border-slate-300 rounded text-sm"
      />
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded">
        Cancel
      </button>
      <button 
        onClick={onSave} 
        disabled={!changeMessage.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-uni-blue hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Publish Changes
      </button>
    </div>
  </div>
);

/* === 3. HISTORY TAB (New) === */
const HistoryTab = ({ history, isLoading, currentRevId, onLoadRevision }: any) => (
  <div className="space-y-4">
    {isLoading ? (
      <div className="text-center py-8 text-slate-400">Loading version history...</div>
    ) : (
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Change Summary</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((entry: RevisionLogEntry) => (
              <tr key={entry.revisionId} className={entry.revisionId === currentRevId ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{entry.date}</td>
                <td className="px-4 py-3 font-medium text-uni-blue">{entry.author.username}</td>
                <td className="px-4 py-3 text-slate-600">{entry.changeMessage}</td>
                <td className="px-4 py-3 text-right">
                  {entry.revisionId === currentRevId ? (
                    <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">Current</span>
                  ) : (
                    <button 
                      onClick={() => onLoadRevision(entry.revisionId)}
                      className="text-xs text-uni-blue hover:underline"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/* === 4. DISCUSSION TAB (Refined) === */
const DiscussionTab = ({ comments, storyId }: { comments: Comment[], storyId: string }) => (
  <div className="space-y-6">
    {/* List */}
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

    {/* Post Box */}
    <div className="pt-4 border-t border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Leave a comment</h3>
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
    </div>
  </div>
);

/* === 5. SIDEBAR METADATA === */
const SidebarMetadata = ({ story }: { story: StoryViewDTO }) => (
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