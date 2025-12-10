'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Story } from '@/components/data_types';


export default function Home() {
  const [items, setItems] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/stories?limit=6');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        if (mounted) setItems(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Could not load recent pages');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow flex flex-col items-center px-4 py-8">
        <div className="max-w-3xl w-full text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to LetzHist</h1>
          <p className="text-slate-600 mb-6">Explore community-written local history pages. Log in to contribute or register to create your first page.</p>

          <Link href="/stories">
            <button className="text-white bg-uni-blue font-bold py-4 px-8 rounded">Access Page View UI</button>
          </Link>

          <Link href="/welcome">
            <button className="text-white bg-uni-blue font-bold py-4 px-8 rounded">Access Welcome Page</button>
          </Link>

          <div className="mt-8 text-left">
            <h2 className="text-2xl font-semibold mb-4">Recent pages</h2>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 animate-pulse rounded" />
                ))}
              </div>
            )}

            {error && <div className="text-red-600">{error}</div>}

            {!loading && !error && items.length === 0 && (
              <div className="text-slate-600">
                No recent pages yet. <Link href="/stories" className="text-uni-blue underline">View all stories</Link>
              </div>
            )}

            {!loading && !error && items.length > 0 && <RecentList items={items} />}
          </div>
        </div>
      </main>
    </div>
  );
}

