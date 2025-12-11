'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSort } from "react-icons/fa";
import { StoryViewDTO, PaginatedResponse } from '../../components/data_types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [results, setResults] = useState<StoryViewDTO[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [sort, setSort] = useState<string>('newest');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (sort) params.append('sort', sort);

      const response = await fetch(`/api/stories?${params.toString()}`);
      const data: PaginatedResponse<StoryViewDTO> = await response.json();

      setResults(data.data);
      setTotal(data.meta.totalItems);

      // Extract all unique tags from results
      const tags = new Set<string>();
      data.data.forEach((item) => {
        item.tags.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error fetching search results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedTags, sort]);

  // Fetch results when component mounts or filters change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Search Input */}
          <div className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchResults();
                  }
                }}
                className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => fetchResults()}
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
                  onChange={(e) => setSort(e.target.value)}
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

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Filter by tags:</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      selectedTags.includes(tag)
                        ? 'bg-uni-blue text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6 text-gray-600">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <p>
                Found <strong>{total}</strong> result{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((story) => (
                <Link
                  key={story.storyId}
                  href={`/stories/${story.slug}`}
                >
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex gap-4">
                      {story.leadImage && (
                        <img
                          src={story.leadImage.url}
                          alt={story.leadImage.alt}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-800 hover:text-uni-blue">
                          {story.title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Last Edited: {new Date(story.lastEdited).toLocaleDateString()}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <p>Searching...</p>
              ) : (
                <div>
                  <p className="text-lg font-semibold mb-2">No results found</p>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
