'use client';

import { use, useEffect, useState } from 'react';
import { PageView } from '@/components/PageViewController';
import { StoryViewDTO } from '@/components/data_types';
import { useAuth } from '@/context/auth-context';

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  // 1. Unwrap params using React.use() 
  const { slug } = use(params);

  // 2. State for Data & Loading
  const [story, setStory] = useState<StoryViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { user } = useAuth();

  // 3. Fetch on Mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/stories/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setStory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [slug]); // Reruns if URL slug changes

  // 4. Handle Loading / Error UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 animate-pulse">Loading story...</div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-red-500">Story not found.</div>
      </div>
    );
  }

  // 5. Render your main UI
  return <PageView initialData={story} user={user} />;
}