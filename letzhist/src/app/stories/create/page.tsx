'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Edit } from '@/components/page-view/Edit';
import { SaveStoryPayload } from '@/components/data_types';

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple protection (Middleware is better, but this works for client-side)
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg mt-10 p-6 border rounded-lg bg-white text-center shadow">
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-slate-600 mb-4">You must be logged in to create new history pages.</p>
        <button onClick={() => router.push('/login')} className="text-uni-blue hover:underline">Go to Login</button>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!confirm("Are you sure you want to publish this story?")) return;
    
    setIsSubmitting(true);
    try {
      const payload: SaveStoryPayload = {
        title: title,
        subtitle: subtitle,
        body: body,
        tags: tags,
        //leadImage?: null,
        changeMessage: 'Initial creation',
        revStatus: 'published',
        authorId: user.id
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }

      const data = await res.json();
      router.push(`/stories/${data.slug}`);
      router.refresh(); 
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <main className="mx-auto max-w-4xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Create a New History Page</h1>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Edit
            title={title}
            subtitle={subtitle}
            body={body}
            changeMessage=""
            tags={tags}
            setTitle={setTitle}
            setSubtitle={setSubtitle}
            setBody={setBody}
            setChangeMessage={() => {}}
            setTags={setTags}
            onCancel={() => router.back()}
            onSave={handleCreate}
            isCreating={true}
          />
        </div>
      </main>

      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-uni-blue border-t-transparent mx-auto mb-2"></div>
            <p className="font-bold text-uni-blue">Publishing to LetzHist...</p>
          </div>
        </div>
      )}
    </div>
  );
}