'use client';

import Link from 'next/link';
import StoriesList from '@/components/StoriesList';



export default function Home() {

  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow flex flex-col items-center px-4 py-8">
        <div className="max-w-3xl w-full text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to LëtzHist</h1>
          <p className="text-slate-600 mb-6">Explore community-written local history pages. Log in to contribute or register to create your first page.</p>

          <Link href="/moderation" className="bg-uni-blue text-white p-4 rounded">
            Access Mod Page
          </Link>
          <Link href="/admin" className="bg-uni-blue text-white p-4 rounded">
            Access Admin Page
          </Link>

          <div className="mt-8 text-left">
            <h2 className="text-2xl font-semibold mb-4">Recent pages</h2>
            
            

            <StoriesList searchQuery={'?limit=6&sort=newest'}/>
          </div>
        </div>
      </main>
    </div>
  );
}

