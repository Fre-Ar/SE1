'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { PageView } from '@/components/PageViewController';
import { StoryViewDTO } from '@/components/data_types';
import { useAuth } from '@/context/auth-context';

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 1. Unwrap params using React.use() 
  const { slug } = use(params);

  // 2. State for Data & Loading
  const [story, setStory] = useState<StoryViewDTO | null>(null);
  const [loading, setLoading] = useState(true);          // only for first load
  const [refreshing, setRefreshing] = useState(false);   // for background refresh
  const [error, setError] = useState(false);

  const { user } = useAuth();

  // 3. Fetch on Mount
  const hasStoryRef = useRef(false);
  useEffect(() => {
     if (story) hasStoryRef.current = true; 
  }, [story]);

  const fetchStory = useCallback(async () => {
    const isInitial = !hasStoryRef.current;

    try {
      setError(false);
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const res = await fetch(`/api/stories/${slug}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Not found');

      const data: StoryViewDTO = await res.json();
      setStory(data);
    } catch (e) {
      console.error(e);
      setError(true);
      setStory(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  // 4. Handle Loading / Error UI
  if (loading && !story) {
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
  return <PageView 
            initialData={story} 
            user={user} 
            refresh={fetchStory} 
            isRefreshing={refreshing}     // optional UI
          />;
}