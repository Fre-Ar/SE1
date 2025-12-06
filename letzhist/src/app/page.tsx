'use client';

import Link from 'next/link';


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow flex justify-center">
       
        <Link href="/stories">
          <button className="text-white bg-uni-blue font-bold py-4 px-8 rounded">Access Page View UI</button>
        </Link>

      </main>
    </div>
  );
}

