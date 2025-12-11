
import { useState, useEffect, useRef } from 'react';
import { FaTimes} from "react-icons/fa";

// ==========================================
// SUB-COMPONENT: Tag Autocomplete
// ==========================================

export default function TagAutocomplete(
  { selectedTags, onAddTag, onRemoveTag }: { 
    selectedTags: string[], 
    onAddTag: (t: string) => void, 
    onRemoveTag: (t: string) => void }) {

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Fetch available tags once on mount
  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllTags(data))
      .catch(err => console.error("Failed to load tags", err));
  }, []);

  // 2. Filter suggestions as user types
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const lowerInput = input.toLowerCase();
    const filtered = allTags
      .filter(tag => 
        tag.toLowerCase().includes(lowerInput) && 
        !selectedTags.includes(tag)
      )
      .slice(0, 5); // Limit to top 5 matches
    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [input, allTags, selectedTags]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTag = (tag: string) => {
    onAddTag(tag);
    setInput('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        // If there's an exact match or top suggestion, select it
        if (suggestions.length > 0) {
            selectTag(suggestions[0]);
        }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" ref={wrapperRef}>
      <span className="text-sm font-semibold text-slate-700 mr-2">Filters:</span>
      
      {/* Active Tags */}
      {selectedTags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {tag}
          <button onClick={() => onRemoveTag(tag)} className="hover:text-blue-900 ml-1">
            <FaTimes size={12} />
          </button>
        </span>
      ))}

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => input && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Type to filter by tags..." : "+ add tag"}
          className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-full text-sm focus:ring-2 focus:ring-uni-blue focus:border-transparent outline-none min-w-[150px]"
        />
        
        {/* Dropdown Suggestions */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
            {suggestions.map(tag => (
              <button
                key={tag}
                onClick={() => selectTag(tag)}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}