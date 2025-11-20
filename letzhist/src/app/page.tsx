'use client';

import Link from 'next/link';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header/>
      <main className="grow flex justify-center">
       
        <Link href="/stories">
          <button className="text-white bg-uni-blue font-bold py-4 px-8 rounded">Access Page View UI</button>
        </Link>

      </main>
    </div>
  );
}

