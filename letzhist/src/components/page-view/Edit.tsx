import React from "react";
import TagAutocomplete from "@/components/TagAutocomplete";
import { Draft } from "../data_types";
import { FaSave, FaFileAlt } from "react-icons/fa";


interface EditProps {
  title: string;
  subtitle?: string;
  body: string;
  changeMessage: string;
  tags: string[]; 

  drafts?: Draft[]; 

  setTitle: (val: string) => void;
  setSubtitle: (val: string) => void;
  setBody: (val: string) => void;
  setChangeMessage: (val: string) => void;
  setTags: (val: string[]) => void;

  onCancel: () => void;
  onSave: () => void;
  onSaveDraft: () => void; 
  onLoadDraft: (d: Draft) => void; 

  isCreating?: boolean; // To toggle UI text
};

export const Edit: React.FC<EditProps> = ({
  title,
  subtitle,
  body,
  changeMessage,
  tags,
  drafts = [],
  setTitle,
  setSubtitle,
  setBody,
  setChangeMessage,
  setTags,
  onCancel,
  onSave,
  onSaveDraft, 
  onLoadDraft,
  isCreating = false,
}) => (
  <div className="space-y-4 animate-in fade-in duration-200">

    {/* Draft Loader Bar */}
    {/* TODO: MAKE THIS PRETTIER */}
      {drafts.length > 0 && (
        <div className="bg-slate-100 p-3 rounded-md flex items-center justify-between border border-slate-200">
           <div className="flex items-center gap-2 text-sm text-slate-600">
             <FaFileAlt />
             <span className="font-semibold">Found {drafts.length} Saved Drafts:</span>
           </div>
           <select 
             className="text-sm border-slate-300 rounded p-1 w-64"
             onChange={(e) => {
                const idx = parseInt(e.target.value);
                if (!isNaN(idx)) onLoadDraft(drafts[idx]);
             }}
             defaultValue=""
           >
             <option value="" disabled>-- Select a draft to load --</option>
             {drafts.map((d, i) => (
               <option key={i} value={i}>
                 {d.date.split('T')[0]} - {d.title}
               </option>
             ))}
           </select>
        </div>
      )}

    {/* Info Banner */}
    <div className={`rounded-md border p-4 text-sm flex items-start gap-2 ${
      isCreating ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"
    }`}>
      <span className="text-lg">{isCreating ? "🆕" : "⚠️"}</span>
      <div>
        <p className="font-semibold">{isCreating ? "Create New Story" : "New Revision"}</p>
        <p className="opacity-90">{isCreating 
          ? "You are starting a new history topic. Please verify your facts." 
          : "Your changes will be saved as a new version."}
        </p>
      </div>
    </div>

    {/* Title */}
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Page Title</label>
      <input 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        placeholder="e.g. The Steel Industry in Esch"
        className="bg-slate-50 w-full text-xl font-bold p-2 border border-slate-300 rounded focus:border-uni-blue outline-none"
      />
    </div>

    {/* Subtitle */}
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Page Subtitle</label>
      <input 
        value={subtitle || ""} 
        onChange={e => setSubtitle(e.target.value)} 
        placeholder="e.g. The Grand Duchy's most important industry before the 70s."
        className="bg-slate-50 w-full text-sm font-semibold text-slate-700 mr-2 p-2 border border-slate-300 rounded focus:border-uni-blue outline-none"
      />
    </div>

    {/* Tags (Categorization) */}
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tags & Keywords</label>
      <div className="p-2 border border-slate-300 rounded bg-slate-50 min-h-[50px]">
        <TagAutocomplete 
            selectedTags={tags} 
            onAddTag={(t) => setTags([...tags, t])}
            onRemoveTag={(t) => setTags(tags.filter(x => x !== t))}
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Press Enter to add a new tag.</p>
    </div>

    {/* Body */}  
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Content (Markdown)</label>
      <textarea 
        value={body} 
        onChange={e => setBody(e.target.value)} 
        rows={15}
        className="bg-slate-50 w-full font-mono text-sm p-3 border border-slate-300 rounded focus:border-uni-blue outline-none leading-relaxed"
      />
      <p className="text-xs text-slate-400 mt-1 text-right">Markdown supported.</p>
    </div>
    
    {/* Change Message (Only for Edit) */}
    {!isCreating && (
      <div className="bg-slate-50 p-3 rounded border border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Change Summary</label>
        <input 
          value={changeMessage} 
          onChange={e => setChangeMessage(e.target.value)} 
          placeholder="e.g. Fixed dates in paragraph 2"
          className="w-full p-2 border border-slate-300 rounded text-sm"
        />
      </div>
    )}
    
    {/* Footer Buttons */}
    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
      
      {/* Cancel Button */}
      <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 hover:font-bold rounded">
        Cancel
      </button>

      {/* Save Draft Button */}
      <button 
        onClick={onSaveDraft} 
        disabled={!title.trim()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded"
      >
        <FaSave className="text-slate-400" />
        Save Draft
      </button>

      {/* Publish Button */}
      <button 
        onClick={onSave} 
        disabled={!title.trim() || !body.trim() || (!isCreating && !changeMessage.trim())}
        className="px-4 py-2 text-sm font-medium text-white bg-uni-blue hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? "Publish Page" : "Publish Changes"}
      </button>
    </div>
  </div>
);