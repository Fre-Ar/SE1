'use client';

import { useEffect, useState } from 'react';
import SearchResultList from './SearchResultList';
import { Story } from '@/components/data_types';
import Link from 'next/link';

type SearchProps = {
  searchQuery: string;
};

export default function StoriesList({ searchQuery }: SearchProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/stories${searchQuery}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
            setStories(json.data);
        } else {
            console.error("Unexpected API response format", json);
            setStories([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(`Could not fetch pages due to an Error: ${err}`)
        console.error('ERROR', err)
      });
  }, []);
  

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }
  
  if (error) return <div className="text-red-600">{error}</div>

  if (stories.length <= 0) {
    return (
      <div className="text-slate-600">
        No recent pages yet. <Link href="/stories" className="text-uni-blue underline">View all stories</Link>
      </div>);
  }

  return <SearchResultList items={stories} />
}