// letzhist/app/components/header.tsx

'use client';

import Link from 'next/link';
import { FiSearch } from "react-icons/fi";
import { useRouter } from 'next/navigation';
import { UserProfile } from './data_types';
import { useAuth } from '@/context/auth-context';

// Define the props structure
interface HeaderProps {
  showSearch?: boolean;
}

// Header now accepts user as a prop
export default function Header({ showSearch }: HeaderProps) {
  const { user, refreshUser } = useAuth(); 
  const router = useRouter(); 

  const handleLogout = async () => {
      try {
          await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
          });

          // 1. Refresh the local auth state (updates Header instantly)
          await refreshUser(); 
            
          // 2. Refresh server components (checks for protected routes)
          router.refresh();
          router.push('/');
      } catch (error) {
          console.error('Logout failed:', error);
          alert('Logout failed due to an error.');
      }
  };

  const commonButtonStyles = (hoverColor: string) => `hidden rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-${hoverColor} sm:inline`;

  return (
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="flex items-center text-sm font-bold text-white ">
              <span className="bg-uni-red py-2 px-1 rounded">Lëtz</span>
              <span className="bg-uni-blue py-2 px-1 rounded">Hist</span>
            </Link>
            <span className="text-xs text-slate-400">beta</span>
          </div>

          <div className="flex items-center gap-3">

            {showSearch && <div className="relative w-40 sm:w-64 text-slate-400">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <FiSearch className="h-4 w-4 " />
              </span>
              <input
                type="search"
                placeholder="Search pages..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 pr-2 py-1 pl-8 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
              />
            </div>}

            <button className={`${commonButtonStyles('slate-50')}  text-slate-700`}>
              New page
            </button>

            {user ? (
              <>
                <span
              className="text-sm font-semibold text-slate-700"
              >
              {user.username} 
              </span>
                
                <button
                  onClick={handleLogout} 
                  className={`${commonButtonStyles('slate-50')}  text-red-600`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${commonButtonStyles('slate-50')} text-slate-700`}
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className={`${commonButtonStyles('slate-50')} text-slate-700`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
  );
};