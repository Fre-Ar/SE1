import React from "react";

type EditProps = {
  title: string;
  body: string;
  changeMessage: string;
  setTitle: (val: string) => void;
  setBody: (val: string) => void;
  setChangeMessage: (val: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export const Edit: React.FC<EditProps> = ({
  title,
  body,
  changeMessage,
  setTitle,
  setBody,
  setChangeMessage,
  onCancel,
  onSave,
}) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
      <span className="text-lg">⚠️</span>
      <div>
        <p className="font-semibold">You are creating a new revision.</p>
        <p>Your changes will be saved as a new snapshot in the history.</p>
      </div>
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Page Title</label>
      <input 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        className="w-full text-xl font-bold p-2 border border-slate-300 rounded focus:border-uni-blue outline-none"
      />
    </div>

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

    <div className="bg-slate-50 p-3 rounded border border-slate-200">
      <label className="block text-xs font-semibold text-slate-700 mb-1">Change Summary (Required)</label>
      <input 
        value={changeMessage} 
        onChange={e => setChangeMessage(e.target.value)} 
        placeholder="e.g. Fixed typo in the second paragraph..."
        className="w-full p-2 border border-slate-300 rounded text-sm"
      />
    </div>

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