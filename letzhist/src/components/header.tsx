// letzhist/app/components/header.tsx

'use client';

import Link from 'next/link';
import { FaGavel, FaSearch, FaRegPlusSquare, FaUser } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


// Header now accepts user as a prop
export default function Header() {
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

  const commonButtonStyles = (hoverColor: string) => `hidden rounded-lg font-bold px-3 py-1 text-sm hover:bg-${hoverColor} sm:inline`;

  return (
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="flex items-center text-sm font-bold text-white ">
              <span className="bg-uni-red py-2 px-1 rounded">Lëtz</span>
              <span className="bg-uni-blue py-2 px-1 rounded">Hist</span>
            </Link>
            <span className="text-xs text-slate-400">beta</span>

            <Link href="/rules" className="text-xs font-bold text-slate-500 hover:text-uni-blue uppercase tracking-wide">
              Rules
            </Link>
          </div>

          <div className="flex items-center gap-3">

            <Link href="/search" className="flex items-center text-sm font-bold text-slate-400 hover:text-slate-300">
              <FaSearch className="h-6 w-6 " />
            </Link>


            {user ? (
              <>

              <Link
                href="/stories/create"
                className={`${commonButtonStyles('slate-100')} text-slate-600`}
              >
                <span className='flex items-center gap-1'>
                  <FaRegPlusSquare className="h-6 w-6 "/>
                  New page
                </span>
              </Link>

              <Link
                href="/profile"
                className={`${commonButtonStyles('slate-100')} text-slate-600`}
              >
                <span className='flex items-center gap-2'>
                  <FaUser className="h-4 w-4 "/>
                  {user.username} 
                </span>
              </Link>
                
                <button
                  onClick={handleLogout} 
                  className={`${commonButtonStyles('slate-100')}  text-red-600`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className={`${commonButtonStyles('slate-100')} text-slate-600`}
                >
                  Register
                </Link>

                <Link
                  href="/login"
                  className={`${commonButtonStyles('slate-100')} text-slate-600`}
                >
                  Log in
                </Link>

                
              </>
            )}

            {(user?.role == 'admin' || user?.role == 'moderator') && (
              <Link href="/staff" className="flex items-center text-sm font-bold text-slate-400 hover:text-slate-300">
                <FaGavel className="h-6 w-6 " />
              </Link>
            )}
            
          </div>
        </div>
      </header>
  );
};