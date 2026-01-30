'use client';

import  React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { FaSearch, FaBan, FaVolumeMute, FaUserShield } from 'react-icons/fa';
import { UserProfile } from '@/components/data_types';



export const UsersTab = () => {
  const { user: currentUser } = useAuth(); // Need current user to check if Admin
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action State
  const [actionTargetUser, setActionTargetUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'mute' | 'ban' | 'role' | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [muteHours, setMuteHours] = useState(24);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: "15",
        query: userSearch,
        role: roleFilter
      });
      const res = await fetch(`/api/moderation/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, userSearch, roleFilter]); // Trigger fetch on changes

  const executeUserAction = async () => {
    if (!actionTargetUser || !actionType) return;
    try {
      let url = "";
      let method = "POST";
      let body: any = {};

      if (actionType === 'ban') {
        url = `/api/moderation/users/${actionTargetUser.id}/ban`;
        body = { reason: actionReason };
      } else if (actionType === 'mute') {
        url = `/api/moderation/users/${actionTargetUser.id}/mute`;
        body = { reason: actionReason, durationHours: muteHours };
      } else if (actionType === 'role') {
        url = `/api/admin/users/${actionTargetUser.id}/role`;
        method = "PATCH";
        const newRole = actionTargetUser.role === 'moderator' ? 'contributor' : 'moderator';
        body = { role: newRole };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      alert(`Action ${actionType} successful.`);
      fetchUsers();
      setActionTargetUser(null);
      setActionType(null);
      setActionReason("");

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
         <div className="flex-1 min-w-[200px] relative">
           <FaSearch className="absolute left-3 top-3 text-slate-400" />
           <input 
             value={userSearch}
             onChange={e => setUserSearch(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && fetchUsers()}
             placeholder="Search users..."
             className="w-full pl-10 pr-4 py-2 border rounded-md text-sm outline-none focus:border-uni-blue"
           />
         </div>
         <select 
           value={roleFilter} 
           onChange={e => setRoleFilter(e.target.value)}
           className="p-2 border rounded-md text-sm outline-none"
         >
           <option value="">All Roles</option>
           <option value="contributor">Contributor</option>
           <option value="moderator">Moderator</option>
           <option value="admin">Admin</option>
         </select>
         <button onClick={fetchUsers} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded hover:bg-slate-700">
           Search
         </button>
      </div>

      {/* USERS LIST */}
      {loading ? <div className="text-center py-10">Loading users...</div> : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    {u.username}
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span className="text-red-600 font-bold flex items-center gap-1"><FaBan size={12}/> Banned</span>
                    ) : u.isMuted ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1"><FaVolumeMute size={12}/> Muted</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2 text-xl">
                    
                    {!u.isBanned && (
                       <button onClick={() => { setActionTargetUser(u); setActionType('mute'); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Mute">
                         <FaVolumeMute />
                       </button>
                    )}
                    {!u.isBanned && !(currentUser?.role === 'moderator' && u.role === 'admin') && (
                       <button onClick={() => { setActionTargetUser(u); setActionType('ban'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Ban">
                         <FaBan />
                       </button>
                    )}
                    {currentUser?.role === 'admin' && u.role !== 'admin' && (
                       <button onClick={() => { setActionTargetUser(u); setActionType('role'); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Promote/Demote">
                         <FaUserShield />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
         <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 border rounded text-xs">Prev</button>
         <span className="text-xs py-1">Page {page} of {totalPages}</span>
         <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded text-xs">Next</button>
      </div>

      {/* USER ACTION MODAL */}
      {actionTargetUser && actionType && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 capitalize">
                 {actionType === 'ban' && <FaBan className="text-red-600"/>}
                 {actionType === 'mute' && <FaVolumeMute className="text-amber-600"/>}
                 {actionType === 'role' && <FaUserShield className="text-purple-600"/>}
                 {actionType === 'role' 
                    ? (actionTargetUser.role === 'moderator' ? "Demote to Contributor" : "Promote to Moderator") 
                    : `${actionType} User: ${actionTargetUser.username}`
                 }
              </h3>
              
              {actionType === 'role' ? (
                 <p className="text-sm text-slate-600 mb-6">
                   Are you sure you want to change this user's role? 
                   {actionTargetUser.role !== 'moderator' && " They will gain access to moderation tools."}
                 </p>
              ) : (
                <div className="space-y-4 mb-4">
                  {actionType === 'mute' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Duration (Hours)</label>
                      <input 
                        type="number" value={muteHours} onChange={e => setMuteHours(parseInt(e.target.value))}
                        className="w-full border p-2 rounded" min={1}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Reason (Required)</label>
                    <textarea 
                      value={actionReason} onChange={e => setActionReason(e.target.value)}
                      className="w-full border p-2 rounded text-sm" rows={3} placeholder="Why is this action being taken?"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => { setActionTargetUser(null); setActionType(null); }} className="px-4 py-2 text-sm border rounded hover:bg-slate-50">Cancel</button>
                <button 
                  onClick={executeUserAction} 
                  disabled={(actionType !== 'role' && actionReason.length < 5)}
                  className="px-4 py-2 text-sm text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
                >
                  Confirm Action
                </button>
              </div>
           </div>
         </div>
      )}
    </div>
  );
};