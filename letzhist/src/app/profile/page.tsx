'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/header';
import type { UserProfile } from '../../components/data_types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('authToken');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setUser(data.user);
        setNewEmail(data.user.email || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateMessage('');

    if (!newEmail.trim()) {
      setUpdateError('Email cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update email');
      }

      const data = await res.json();
      setUser(data.user);
      setUpdateMessage('Email updated successfully!');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateMessage('');

    if (!currentPassword.trim()) {
      setUpdateError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setUpdateError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setUpdateError('Password must be at least 8 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update password');
      }

      setUpdateMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold">{error || 'Failed to load profile'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="grow px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <button
              onClick={handleLogout}
              className="rounded bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 transition"
            >
              Log Out
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-uni-blue text-uni-blue'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-uni-blue text-uni-blue'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Account Settings
              </button>
            </div>
          </div>

          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Username</label>
                  <p className="text-lg text-gray-800 mt-1">{user.username}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-lg text-gray-800 mt-1">{user.email || 'Not set'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Role</label>
                  <p className="text-lg text-gray-800 mt-1 capitalize">
                    {user.role}
                  </p>
                </div>

                {user.isMuted && (
                  <div className="rounded-lg bg-amber-100 p-4 border border-amber-300">
                    <p className="text-sm font-semibold text-amber-900">
                      Account Muted
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      Your account is muted until{' '}
                      {user.mutedUntil
                        ? new Date(user.mutedUntil).toLocaleDateString()
                        : 'indefinitely'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Update Email */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Email</h2>

                {updateMessage && (
                  <div className="mb-4 rounded-lg bg-green-100 p-3 border border-green-300 text-green-700 text-sm font-medium">
                    {updateMessage}
                  </div>
                )}

                {updateError && (
                  <div className="mb-4 rounded-lg bg-red-100 p-3 border border-red-300 text-red-700 text-sm font-medium">
                    {updateError}
                  </div>
                )}

                <form onSubmit={handleEmailChange} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded bg-uni-blue px-4 py-2 text-white font-medium hover:opacity-90 transition"
                  >
                    Update Email
                  </button>
                </form>
              </div>

              {/* Update Password */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>

                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (minimum 8 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded bg-uni-blue px-4 py-2 text-white font-medium hover:opacity-90 transition"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
