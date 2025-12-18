'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSort, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Story} from '@/components/data_types';
import TagAutocomplete from '@/components/TagAutocomplete';
import SearchResultList from '@/components/SearchResultList';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

    // 1. URL State (Source of Truth)
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const rawTags = searchParams.get('tags');
  const page = parseInt(searchParams.get('page') || '1', 10); 

  // Derive array for UI 
  const selectedTags = rawTags?.split(',').filter(Boolean) || [];

  // 2. Local State (Data)
  const [results, setResults] = useState<Story[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0); 
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

      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/stories?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data);
        setTotal(json.meta.total);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, rawTags, sort, page]);

  // Trigger fetch when URL params change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

    // 5. Action Handlers (Update URL)
  const updateSearch = (newQuery: string, newTags: string[], newSort: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newTags.length > 0) params.set('tags', newTags.join(','));
    if (newSort) params.set('sort', newSort);
    // Always set page
    params.set('page', newPage.toString());

    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = () => updateSearch(localQuery, selectedTags, sort, 1); // Reset to page 1
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => updateSearch(localQuery, selectedTags, e.target.value, 1);
  const handleAddTag = (tag: string) => !selectedTags.includes(tag) && updateSearch(localQuery, [...selectedTags, tag], sort, 1);
  const handleRemoveTag = (tag: string) => updateSearch(localQuery, selectedTags.filter(t => t !== tag), sort, 1);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateSearch(localQuery, selectedTags, sort, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
            <>
              <SearchResultList items={results}/>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <FaChevronLeft className="w-3 h-3" /> Previous
                  </button>
                  
                  <span className="text-sm text-slate-600">
                    Page <span className="font-semibold text-slate-900">{page}</span> of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-3 py-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                  >
                     Next <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <p>Searching...</p>
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="text-slate-400 text-lg">No stories found matching your criteria.</div>
                  <button onClick={() => updateSearch('', [], 'newest', 1)} className="mt-4 text-uni-blue hover:underline">Clear Filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
