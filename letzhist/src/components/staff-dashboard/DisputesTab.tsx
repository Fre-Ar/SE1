'use client';

import { useState, useEffect } from 'react';
import { FaClipboardList, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { Dispute } from '@/components/data_types';



export const DisputesTab = () => {
  // --- DISPUTE STATE ---
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionAction, setResolutionAction] = useState<'resolved' | 'dismissed' | null>(null);

  // --- FETCH DISPUTES ---
  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status: statusFilter,
        sort: 'created_desc'
      });
      
      const res = await fetch(`/api/disputes?${params}`);
      if (res.ok) {
        const json = await res.json();
        setDisputes(json.data);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, page]);

  // --- HANDLERS ---
  const handleStatusChange = async (id: string, newStatus: string, notes?: string) => {
    try {
      const res = await fetch(`/api/disputes/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (res.ok) {
        // Refresh list
        fetchDisputes();
        setSelectedDispute(null);
        setResolutionNote("");
        setResolutionAction(null);
      } else {
        alert("Failed to update status");
      }
    } catch (e) {
      alert("Error updating status");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">  
      {/* FILTERS */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-500">Filter Status:</span>
          <div className="flex gap-2">
            {['open', 'under_review', 'resolved', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-bold rounded-full capitalize transition-colors ${
                  statusFilter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={fetchDisputes} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      {/* LIST */}
      {loadingDisputes ? (
        <div className="text-center py-10 text-slate-400">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border border-dashed text-slate-400">
          No disputes found with status "{statusFilter}".
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                
                {/* Left: Meta Info */}
                <div className="p-4 bg-slate-50 md:w-64 border-r border-slate-100 shrink-0 space-y-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        d.status === 'open' ? 'bg-red-100 text-red-700' :
                        d.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        d.status === 'dismissed' ? 'bg-slate-200 text-slate-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Reporter</p>
                      <p className="text-sm font-medium">{d.createdBy.username}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Category</p>
                      <p className="text-sm capitalize">{d.category.replace('_', ' ')}</p>
                    </div>
                </div>

                {/* Middle: Content & Reason */}
                <div className="p-4 flex-1 space-y-4">
                  
                  {/* The Complaint */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Reason for Report:</h3>
                    <p className="text-sm text-slate-800 bg-red-50 p-2 rounded border border-red-100">
                      "{d.reason}"
                    </p>
                  </div>

                  {/* The Target Content */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Target Content ({d.targetType})</span>
                        <span className="text-xs font-normal text-slate-500">Author: {d.context.author || 'Unknown'}</span>
                    </h3>
                    
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 font-mono max-h-32 overflow-y-auto">
                        {d.context.content || <em>[Content Deleted or Unavailable]</em>}
                    </div>

                    {/* Link to Context */}
                    {d.targetType !== 'user' && d.context.slug && (
                      <div className="mt-2 text-right">
                        <a 
                          href={`/stories/${d.context.slug}${d.contextRevisionId ? `?revisionId=${d.contextRevisionId}` : ''}`} 
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1"
                        >
                          View Context <FaEye />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="p-4 border-l border-slate-100 md:w-48 bg-slate-50 flex flex-col gap-2 justify-center">
                  {d.status === 'open' && (
                    <button 
                      onClick={() => handleStatusChange(d.id, 'under_review')}
                      className="w-full py-2 px-3 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FaClipboardList /> Review
                    </button>
                  )}
                  
                  {(d.status === 'open' || d.status === 'under_review') && (
                    <>
                      <button 
                        onClick={() => { setSelectedDispute(d); setResolutionAction('resolved'); }}
                        className="w-full py-2 px-3 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <FaCheck /> Resolve
                      </button>
                      <button 
                        onClick={() => { setSelectedDispute(d); setResolutionAction('dismissed'); }}
                        className="w-full py-2 px-3 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 flex items-center justify-center gap-2"
                      >
                        <FaTimes /> Dismiss
                      </button>
                    </>
                  )}

                  {(d.status === 'resolved' || d.status === 'dismissed') && (
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Handled by</p>
                      <div className="text-xs font-bold bg-slate-200 rounded px-2 py-1 inline-block">Staff Username: {d.resolvedBy?.username}</div>
                      {d.resolutionNotes && (
                          <p className="mt-2 text-[10px] text-slate-500 italic">"{d.resolutionNotes}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 mt-6">
        <button 
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-sm text-slate-600">Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* RESOLUTION MODAL */}
      {selectedDispute && resolutionAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
             <h3 className="text-lg font-bold mb-4 capitalize">{resolutionAction} Dispute</h3>
             <textarea 
               className="w-full border p-2 rounded mb-4 text-sm" rows={3} placeholder="Resolution notes..."
               value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
             />
             <div className="flex justify-end gap-2">
               <button onClick={() => { setSelectedDispute(null); setResolutionAction(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
               <button onClick={() => handleStatusChange(selectedDispute.id, resolutionAction, resolutionNote)} className="px-4 py-2 text-sm bg-slate-800 text-white rounded font-bold">Confirm</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};