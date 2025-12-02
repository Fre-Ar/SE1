'use client';

import Link from 'next/link';
import Header from '../../components/header';

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header/>
      <main className="grow flex justify-center items-center">
        <div className="flex gap-8">
          <Link href="/login">
            <button className="text-white bg-uni-blue font-bold py-4 px-8 rounded hover:opacity-90 transition">
              Log In
            </button>
          </Link>
          <Link href="/register">
            <button className="text-white bg-uni-red font-bold py-4 px-8 rounded hover:opacity-90 transition">
              Register
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}

