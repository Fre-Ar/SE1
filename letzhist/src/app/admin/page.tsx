'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  email: string;
  role: 'contributor' | 'moderator' | 'admin';
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
  createdAt: string | null;
};

type Story = {
  id: string;
  title: string;
  place: string;
  era: string;
  theme: string;
  isRemoved: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  targetType: 'user' | 'content' | 'story';
  targetId: number;
  targetName: string;
  reason: string | null;
  timestamp: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'logs'>('users');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Users tab state
  const [users, setUsers] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'promote'>('ban');
  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Stories tab state
  const [stories, setStories] = useState<Story[]>([]);
  const [storyPage, setStoryPage] = useState(1);
  const [storyTotal, setStoryTotal] = useState(0);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removeMessage, setRemoveMessage] = useState('');
  const [removeError, setRemoveError] = useState('');

  // Logs tab state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  // Check authentication and role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }

        const data = await res.json();
        const role = data.user.role;

        if (role !== 'admin') {
          router.push('/');
          return;
        }

        setUserRole(role);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [router]);

  // Fetch users
  const fetchUsers = async (page: number) => {
    try {
      const res = await fetch(`/api/moderation/users?page=${page}&limit=10`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data.data);
      setUserPage(page);
      setUserTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Fetch stories
  const fetchStories = async (page: number) => {
    try {
      const res = await fetch(`/api/moderation/stories?page=${page}&limit=10`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await res.json();
      setStories(data.data);
      setStoryPage(page);
      setStoryTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Fetch logs
  const fetchLogs = async (page: number) => {
    try {
      const res = await fetch(`/api/moderation/logs?page=${page}&limit=20`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await res.json();
      setLogs(data.data);
      setLogPage(page);
      setLogTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (!loading && userRole) {
      if (activeTab === 'users') {
        fetchUsers(1);
      } else if (activeTab === 'stories') {
        fetchStories(1);
      } else if (activeTab === 'logs') {
        fetchLogs(1);
      }
    }
  }, [activeTab, loading, userRole]);

  // Handle ban user
  const handleBanUser = async (userId: string) => {
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch(`/api/moderation/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: actionReason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to ban user');
      }

      setActionMessage('User banned successfully!');
      setActionReason('');
      setSelectedUser(null);
      fetchUsers(userPage);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle promote user
  const handlePromoteUser = async (userId: string) => {
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to promote user');
      }

      setActionMessage('User promoted successfully!');
      setActionReason('');
      setSelectedUser(null);
      fetchUsers(userPage);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle remove story
  const handleRemoveStory = async (storyId: string) => {
    setRemoveError('');
    setRemoveMessage('');

    try {
      const res = await fetch(`/api/moderation/stories/${storyId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: removeReason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove story');
      }

      setRemoveMessage('Story removed successfully!');
      setRemoveReason('');
      setSelectedStory(null);
      fetchStories(storyPage);
      setTimeout(() => setRemoveMessage(''), 3000);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="grow flex items-center justify-center">
          <p>Loading admin dashboard...</p>
        </main>
      </div>
    );
  }

  if (error || !userRole) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold">{error || 'Unauthorized'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="grow px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Administrator Dashboard</h1>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'users'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'stories'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Audit Logs
              </button>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {actionMessage && (
                <div className="rounded-lg bg-green-100 p-3 border border-green-300 text-green-700 text-sm font-medium">
                  {actionMessage}
                </div>
              )}
              {actionError && (
                <div className="rounded-lg bg-red-100 p-3 border border-red-300 text-red-700 text-sm font-medium">
                  {actionError}
                </div>
              )}

              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm">{user.username}</td>
                          <td className="px-6 py-3 text-sm">{user.email}</td>
                          <td className="px-6 py-3 text-sm capitalize">{user.role}</td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isBanned
                                ? 'bg-red-100 text-red-700'
                                : user.isMuted
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {user.isBanned ? 'Banned' : user.isMuted ? 'Muted' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm space-x-2">
                            {user.role === 'contributor' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('promote');
                                }}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Promote
                              </button>
                            )}
                            {!user.isBanned && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('ban');
                                }}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total: {userTotal} users
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => fetchUsers(Math.max(1, userPage - 1))}
                      disabled={userPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {userPage}</span>
                    <button
                      onClick={() => fetchUsers(userPage + 1)}
                      disabled={users.length < 10}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Modal */}
              {selectedUser && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {actionType === 'ban' ? 'Ban User' : 'Promote User'}: {selectedUser.username}
                  </h2>
                  <div className="space-y-4">
                    {actionType === 'ban' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason (optional)
                        </label>
                        <textarea
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Enter reason for banning..."
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          actionType === 'ban'
                            ? handleBanUser(selectedUser.id)
                            : handlePromoteUser(selectedUser.id)
                        }
                        className={`rounded px-4 py-2 text-white font-medium ${
                          actionType === 'ban'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        Confirm {actionType === 'ban' ? 'Ban' : 'Promotion'}
                      </button>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="rounded bg-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              {removeMessage && (
                <div className="rounded-lg bg-green-100 p-3 border border-green-300 text-green-700 text-sm font-medium">
                  {removeMessage}
                </div>
              )}
              {removeError && (
                <div className="rounded-lg bg-red-100 p-3 border border-red-300 text-red-700 text-sm font-medium">
                  {removeError}
                </div>
              )}

              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Place</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Era</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Theme</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stories.map((story) => (
                        <tr key={story.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm">{story.title}</td>
                          <td className="px-6 py-3 text-sm">{story.place}</td>
                          <td className="px-6 py-3 text-sm">{story.era}</td>
                          <td className="px-6 py-3 text-sm">{story.theme}</td>
                          <td className="px-6 py-3 text-sm">
                            {!story.isRemoved && (
                              <button
                                onClick={() => setSelectedStory(story)}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total: {storyTotal} stories
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => fetchStories(Math.max(1, storyPage - 1))}
                      disabled={storyPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {storyPage}</span>
                    <button
                      onClick={() => fetchStories(storyPage + 1)}
                      disabled={stories.length < 10}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Remove Story Modal */}
              {selectedStory && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Remove Story: {selectedStory.title}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason (optional)
                      </label>
                      <textarea
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter reason for removal..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveStory(selectedStory.id)}
                        className="rounded bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
                      >
                        Confirm Removal
                      </button>
                      <button
                        onClick={() => setSelectedStory(null)}
                        className="rounded bg-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Target</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{log.actor || 'System'}</td>
                        <td className="px-6 py-3 text-sm font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.action}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <div className="text-xs text-gray-500">{log.targetType}</div>
                          <div>{log.targetName}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {log.reason || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Total: {logTotal} logs
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => fetchLogs(Math.max(1, logPage - 1))}
                    disabled={logPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {logPage}</span>
                  <button
                    onClick={() => fetchLogs(logPage + 1)}
                    disabled={logs.length < 20}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
