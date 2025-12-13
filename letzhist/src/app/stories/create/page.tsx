'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Edit } from '@/components/page-view/Edit';
import { Draft, LeadImage, SaveStoryPayload } from '@/components/data_types';

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [leadImage, setLeadImage] = useState<LeadImage | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Fetch drafts on mount
  useEffect(() => {
    if (user) {
      fetch('/api/stories/drafts')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setDrafts(data);
        })
        .catch(err => console.error("Failed to load drafts", err));
    }
  }, [user]);

  const loadDraft = async (draft: Draft) => {
      // For new story drafts, we need to load the content. 
      // Since we only have metadata in the list, we fetch the specific revision.
      // We assume fetching a revision by ID works even if not published (as author).
      // We need to know the slug to construct the URL.
      if (!draft.slug) return;

      if (!confirm("Load this draft? Current unsaved changes will be lost.")) return;

      try {
        const res = await fetch(`/api/stories/${draft.slug}?revisionId=${draft.revisionId}`);
        if (!res.ok) throw new Error("Failed to load draft content");
        const data = await res.json();
        
        setTitle(data.title);
        setSubtitle(data.subtitle);
        setBody(data.body);
        setTags(data.tags || []);
        setLeadImage(data.leadImage);
        setExistingSlug(data.slug); // Set this so we PUT instead of POST
      } catch (err) {
        alert("Could not load draft.");
      }
  };

  const handleSave = async (status: 'published' | 'draft') => {
    if (status === 'published' && !confirm("Are you sure you want to publish this story?")) return;
    
    if (status === 'published') setIsSubmitting(true);

    try {
      const method = existingSlug ? 'PUT' : 'POST';
      const url = existingSlug ? `/api/stories/${existingSlug}` : '/api/stories';

      const payload: SaveStoryPayload = {
        title: title,
        subtitle: subtitle,
        body: body,
        tags: tags,
        leadImage: leadImage,
        changeMessage: status === 'draft' ? 'Saved as draft' : 'Initial creation',
        revStatus: status,
        authorId: user!.id
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }

      const data = await res.json();

      if (status === 'published') {
         // If published, go to story
         router.push(`/stories/${existingSlug || data.slug}`);
         router.refresh(); 
      } else {
         // If draft, stay here but update context
         alert("Draft saved successfully!");
         if (!existingSlug) setExistingSlug(data.slug);
         // TODO: Refresh drafts list
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

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
            leadImage={leadImage}
            drafts={drafts}

            setTitle={setTitle}
            setSubtitle={setSubtitle}
            setBody={setBody}
            setChangeMessage={() => {}}
            setTags={setTags}
            setLeadImage={setLeadImage}
            onCancel={() => router.back()}
            onSave={() => handleSave('published')}
            onSaveDraft={() => handleSave('draft')}
            onLoadDraft={loadDraft}
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