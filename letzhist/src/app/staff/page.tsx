'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { FaGavel, FaUsers, FaClipboardList, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import { DisputesTab } from '@/components/staff-dashboard/DisputesTab';
import { UsersTab } from '@/components/staff-dashboard/UsersTab';
import { AuditTab } from '@/components/staff-dashboard/AuditTab';

export default function StaffDashboard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'disputes' | 'users' | 'audit'>('disputes');

  // --- AUTH CHECK ---
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'moderator' && user.role !== 'admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="p-10 text-center">Loading staff portal...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaGavel className="text-amber-500 text-xl" />
            <h1 className="text-xl font-bold">Staff Dashboard</h1>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 uppercase tracking-wide">
              {user.role}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6">
        
        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 mb-6">
          <TabButton 
            active={activeTab === 'disputes'} 
            onClick={() => setActiveTab('disputes')} 
            icon={<FaClipboardList />} 
            label="Disputes Queue" 
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<FaUsers />} 
            label="User Management" 
          />
          <TabButton 
            active={activeTab === 'audit'} 
            onClick={() => setActiveTab('audit')} 
            icon={<FaSearch />} 
            label="Audit Logs" 
          />
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'disputes' && <DisputesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit' && <AuditTab />}

      </main>
    </div>
  );
}

// Helper Component
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
      active 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
    }`}
  >
    {icon} {label}
  </button>
);
