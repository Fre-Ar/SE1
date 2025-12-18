import React, { useRef, useState } from "react";
import TagAutocomplete from "@/components/TagAutocomplete";
import { Draft, LeadImage } from "../data_types";
import { FaSave, FaFileAlt, FaImage, FaTrash, FaUpload, FaSpinner, FaBook } from "react-icons/fa";

interface EditProps {
  title: string;
  subtitle?: string;
  body: string;
  changeMessage: string;
  tags: string[]; 
  leadImage?: LeadImage;

  drafts?: Draft[]; 

  setTitle: (val: string) => void;
  setSubtitle: (val: string) => void;
  setBody: (val: string) => void;
  setChangeMessage: (val: string) => void;
  setTags: (val: string[]) => void;
  setLeadImage: (val: LeadImage | undefined) => void;

  onCancel: () => void;
  onSave: () => void;
  onSaveDraft: () => void; 
  onLoadDraft: (d: Draft) => void; 

  isCreating?: boolean; // To toggle UI text
};

// Standard Markdown delimiter for separating content from references
const REF_SEPARATOR = "\n\n## References\n";

export const Edit: React.FC<EditProps> = ({
  title, subtitle, body, changeMessage, tags, leadImage, drafts = [],
  setTitle, setSubtitle, setBody, setChangeMessage, setTags, setLeadImage,
  onCancel, onSave, onSaveDraft, onLoadDraft, isCreating = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBody, setIsUploadingBody] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // For Lead Image
  const bodyFileInputRef = useRef<HTMLInputElement>(null); // For Body Image

  // --- DERIVE CONTENT & REFERENCES FROM BODY ---
  // We split the single storage string into two UI fields
  const parts = body.split(REF_SEPARATOR);
  const mainContent = parts[0]; 
  // If the separator exists multiple times (rare edge case), join the rest back
  const referencesContent = parts.length > 1 ? parts.slice(1).join(REF_SEPARATOR) : "";

  // --- WRAPPER SETTERS ---
  const setMainContent = (newContent: string) => {
    // Reconstruct the full body: Content + Separator + Refs
    setBody(newContent + REF_SEPARATOR + referencesContent);
  };

  const setReferencesContent = (newRefs: string) => {
    // Reconstruct the full body: Content + Separator + New Refs
    setBody(mainContent + REF_SEPARATOR + newRefs);
  };

  // --- HELPER: Generic Upload ---
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url; 
  };

  // --- HANDLER: Lead Image ---
  const handleLeadImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(e.target.files[0]);
      setLeadImage({
        url, 
        alt: title || "Story Cover",
        caption: "" });
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- HANDLER: Body Image ---
  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploadingBody(true);
    try {
      const file = e.target.files[0];
      const url = await uploadFile(file);
      
      // Insert Markdown at Cursor Position
      const markdown = `\n![${file.name}](${url})\n`;
      
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        // TODO: see what's up with this unused text
        const newText = mainContent.substring(0, start) + markdown + mainContent.substring(end);
        setMainContent(newText);
        
        // Restore focus (optional, usually good UX)
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(start + markdown.length, start + markdown.length);
        }, 0);
      } else {
        setMainContent(mainContent + markdown); // Fallback
      }

    } catch (err) {
      alert("Failed to insert image.");
    } finally {
      setIsUploadingBody(false);
      // Reset input so same file can be selected again if needed
      if (bodyFileInputRef.current) bodyFileInputRef.current.value = "";
    }
  };

  return (
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

    {/* Lead Image Section */}
    <div className="rounded-lg">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cover Image</label>
      
      {leadImage ? (
        <div className="relative group overflow-hidden rounded-md border border-slate-300 bg-slate-50">
          <img 
            src={leadImage.url} 
            alt="Cover Preview" 
            className="w-full object-cover"
          />
          {/* Overlay Actions */}
          <div className="absolute inset-0 bottom-8 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-slate-800 px-3 py-1 rounded text-sm font-medium hover:bg-slate-200 flex items-center gap-2"
            >
              <FaUpload /> Change
            </button>
            <button 
              onClick={() => setLeadImage(undefined)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            >
              <FaTrash /> Remove
            </button>
          </div>
          {/* Caption Input */}
          <input 
            value={leadImage.caption || ""}
            onChange={(e) => setLeadImage({...leadImage, caption: e.target.value})}
            placeholder="Add a caption for the cover image..."
            className="w-full text-xs p-2 border-t border-slate-200 bg-slate-50 focus:outline-none"
          />
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 hover:border-uni-blue hover:text-uni-blue hover:bg-blue-50 cursor-pointer transition-colors"
        >
          {isUploading ? (
            <FaSpinner className="animate-spin text-2xl" />
          ) : (
            <>
              <FaImage className="text-2xl mb-1" />
              <span className="text-sm font-medium">Click to upload cover image</span>
            </>
          )}
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleLeadImageUpload} className="hidden" accept="image/*" />
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
      
      {/* Editor Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 border border-slate-300 border-b-0 rounded-t-md">
          <button 
            onClick={() => bodyFileInputRef.current?.click()}
            className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-slate-700 hover:bg-white hover:text-uni-blue rounded transition-colors"
            title="Insert Image"
          >
            {isUploadingBody ? <FaSpinner className="animate-spin" /> : <FaImage />}
            <span>Add Image</span>
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-400 ml-auto">Supports Markdown</span>
      </div>
      <input type="file" ref={bodyFileInputRef} onChange={handleBodyImageUpload} className="hidden" accept="image/*" />

      {/* Text Area */}
      <textarea 
        value={mainContent} 
        onChange={e => setMainContent(e.target.value)} 
        rows={15}
        className="bg-slate-50 w-full font-mono text-sm p-3 border border-slate-300 rounded focus:border-uni-blue outline-none leading-relaxed"
      />
      <p className="text-xs text-slate-400 mt-1 text-right">Markdown supported.</p>
    </div>

    {/* References (FR-19) */}
    <div className="bg-amber-50/50 p-4 rounded border border-amber-100">
       <div className="flex items-center gap-2 mb-2">
         <FaBook className="text-amber-600"/>
         <label className="text-sm font-bold text-slate-700 uppercase">References <span className="text-red-500">*</span></label>
       </div>
       <p className="text-xs text-slate-500 mb-2">
         Please list your sources (books, archives, websites). This is required to maintain historical accuracy.
       </p>
       <textarea
          value={referencesContent}
          onChange={e => setReferencesContent(e.target.value)}
          rows={4}
          placeholder="- Smith, J. (1999). History of Lux...\n- National Archives, Document #123\n- www.history.lu/article"
          className="w-full text-sm p-2 border border-slate-300 rounded focus:border-amber-400 outline-none font-mono bg-white"
       />
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
        disabled={
          !title.trim() || 
          !mainContent.trim() || 
          !referencesContent.trim() || 
          (!isCreating && !changeMessage.trim())
        }
        className="px-4 py-2 text-sm font-medium text-white bg-uni-blue hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? "Publish Page" : "Publish Changes"}
      </button>
    </div>
  </div>
  );
};