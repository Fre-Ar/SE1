'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaHistory, FaUser, FaBullseye } from 'react-icons/fa';
import { AuditLog } from '../data_types';

export const AuditTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actorSearch, setActorSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        actor: actorSearch,
        action: actionFilter,
        targetType: targetTypeFilter
      });

      const res = await fetch(`/api/moderation/logs?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce actor search or fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on filter change
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorSearch, actionFilter, targetTypeFilter]);

  // Handle Page Change separately to avoid resetting page to 1
  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);


  const getActionColor = (action: string) => {
    if (action.includes('ban')) return 'text-red-600 bg-red-50 border-red-200';
    if (action.includes('mute')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (action.includes('promote')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Actor Search */}
        <div className="relative">
          <FaUser className="absolute left-3 top-3 text-slate-400 text-xs" />
          <input 
            value={actorSearch}
            onChange={e => setActorSearch(e.target.value)}
            placeholder="Filter by Actor..."
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md outline-none focus:border-uni-blue"
          />
        </div>

        {/* Action Filter */}
        <div className="relative">
          <FaHistory className="absolute left-3 top-3 text-slate-400 text-xs" />
          <select 
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md outline-none focus:border-uni-blue bg-white"
          >
            <option value="">All Actions</option>
            <option value="user.ban">Ban User</option>
            <option value="user.mute">Mute User</option>
            <option value="user.promote">Promote User</option>
            <option value="user.change_role">Change Role</option>
            <option value="story.lock">Lock Story</option>
            <option value="comment.hide">Hide Comment</option>
          </select>
        </div>

        {/* Target Type Filter */}
        <div className="relative">
          <FaBullseye className="absolute left-3 top-3 text-slate-400 text-xs" />
          <select 
            value={targetTypeFilter}
            onChange={e => setTargetTypeFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md outline-none focus:border-uni-blue bg-white"
          >
            <option value="">All Targets</option>
            <option value="user">User</option>
            <option value="story">Story</option>
            <option value="comment">Comment</option>
            <option value="dispute">Dispute</option>
          </select>
        </div>

        <button 
          onClick={fetchLogs} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded hover:bg-slate-700"
        >
          <FaFilter /> Apply
        </button>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading audit logs...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details/Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No logs found matching filters.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {log.actor.username}
                      <span className="block text-[10px] text-slate-400 uppercase">{log.actor.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="uppercase font-bold text-slate-400 mr-1">{log.target.type}</span>
                        <span className="font-semibold text-slate-700">{log.target.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {log.target.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 italic">
                      "{log.reason || 'No details provided'}"
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-6">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-white"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-white"
          >
            Next
          </button>
      </div>

    </div>
  );
};