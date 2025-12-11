'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSort, FaSearch } from "react-icons/fa";
import { StoryViewDTO} from '@/components/data_types';
import TagAutocomplete from '@/components/TagAutocomplete';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

    // 1. URL State (Source of Truth)
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const rawTags = searchParams.get('tags');

  // Derive array for UI 
  const selectedTags = rawTags?.split(',').filter(Boolean) || [];

  // 2. Local State (Data)
  const [results, setResults] = useState<StoryViewDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 3. Local State (Inputs)
  // We keep a local copy of the query input so typing doesn't trigger a URL update on every keystroke
  const [localQuery, setLocalQuery] = useState(query);

  // Sync local input with URL if URL changes externally (e.g. Back button)
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

    // 4. Data Fetching
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);

      if (rawTags) {
         const tagsArray = rawTags.split(',').filter(Boolean);
         tagsArray.forEach(t => params.append('tag', t)); 
      }

      if (sort) params.append('sort', sort);
      // params.append('limit', '20');

      const res = await fetch(`/api/stories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setTotal(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, rawTags, sort]);

  // Trigger fetch when URL params change
  useEffect(() => {
    console.log('FETCHING!');
    fetchResults();
  }, [fetchResults]);

    // 5. Action Handlers (Update URL)
  const updateSearch = (newQuery: string, newTags: string[], newSort: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newTags.length > 0) params.set('tags', newTags.join(','));
    if (newSort) params.set('sort', newSort);
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = () => updateSearch(localQuery, selectedTags, sort);
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => updateSearch(localQuery, selectedTags, e.target.value);
  const handleAddTag = (tag: string) => !selectedTags.includes(tag) && updateSearch(localQuery, [...selectedTags, tag], sort);
  const handleRemoveTag = (tag: string) => updateSearch(localQuery, selectedTags.filter(t => t !== tag), sort);


  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Search Input */}
          <div className="mb-8">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center relative">
                
                <FaSearch className="absolute top-3 left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search local history..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="flex-1 border rounded pr-2 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-uni-blue"
                />
              </div>
              <button
                onClick={handleSearchSubmit}
                className="bg-uni-blue text-white px-4 py-2 rounded font-medium"
              >
                Search
              </button>
              
              {/* Sort control */}
              <div className="flex items-center text-gray-600 hover:text-gray-300">
                <label>
                  <FaSort className="h-4 w-4 " />
                </label>
                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="px-2 py-1 appearance-none outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="title_desc">Title Z-A</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <TagAutocomplete 
              selectedTags={selectedTags} 
              onAddTag={handleAddTag} 
              onRemoveTag={handleRemoveTag} 
            />
          </div>

          {/* RESULTS AREA */}
          <div className="mb-6 text-gray-600">
            {loading ? 'Searching...' : `Found ${total} result${total !== 1 ? 's' : ''}`}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((story) => (
                <div key={story.storyId}>
                <Link href={`/stories/${story.slug}`}>
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                    {/* Image */}
                    <div className="flex gap-4">
                      {story.leadImage && (
                        <img
                          src={story.leadImage.url}
                          alt={story.leadImage.alt}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-800 hover:text-uni-blue">
                          {story.title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Last Updated: {new Date(story.lastEdited).toLocaleDateString()}
                        </p>
                        {story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {story.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <p>Searching...</p>
              ) : (

                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="text-slate-400 text-lg">No stories found matching your criteria.</div>
                  <button onClick={() => updateSearch('', [], 'newest')} className="mt-4 text-uni-blue hover:underline">Clear Filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
