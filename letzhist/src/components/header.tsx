'use client';

import Link from 'next/link';
import { FiSearch } from "react-icons/fi";
import { useState, useEffect } from 'react';

export default function Header() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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

            <div className="relative w-40 sm:w-64 text-slate-400">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <FiSearch className="h-4 w-4 " />
              </span>
              <input
                type="search"
                placeholder="Search pages..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 pr-2 py-1 pl-8 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
              />
            </div>

            <button className="hidden rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 sm:inline">
              New page
            </button>

            {!loading && user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 sm:inline"
                >
                  {user.username}
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 sm:inline"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="hidden rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 sm:inline"
                >
                  Register
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>
  );
  
};
