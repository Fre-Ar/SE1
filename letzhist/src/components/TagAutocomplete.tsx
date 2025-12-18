
import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus} from "react-icons/fa";
import { formatTag, unformatTag } from '@/lib/utils';


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

    const formattedInput = formatTag(input);
    // Filter existing tags
    const matches = allTags.filter(tag => 
      tag.toLowerCase().includes(formattedInput) && 
      !selectedTags.includes(tag)
    ).slice(0, 5);

    setSuggestions(matches);
    setIsOpen(true); // Always open if there is input (to show "Create new" option)
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

  const addTag = (tag: string) => {
    const formatted = formatTag(tag);
    if (formatted && !selectedTags.includes(formatted)) {
      onAddTag(formatted);
      setInput('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Priority 1: Select the top suggestion if it matches perfectly or if highlighted
      // Priority 2: Create a new tag from input
      if (suggestions.length > 0 && suggestions[0] === formatTag(input)) {
          addTag(suggestions[0]);
      } else {
          addTag(input);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" ref={wrapperRef}>
      <span className="text-sm font-semibold text-slate-700 mr-2">Tags:</span>
      
      {/* Active Tags */}
      {selectedTags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-uni-blue rounded-full text-sm font-medium">
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
        
        {/* Dropdown */}
        {isOpen && input && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* 1. Existing Suggestions */}
            {suggestions.map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-uni-blue transition"
              >
                {unformatTag(tag)}
              </button>
            ))}

            {/* 2. "Create New" Option (if input doesn't match an existing tag exactly) */}
            {!suggestions.includes(formatTag(input)) && (
               <button
                 onClick={() => addTag(input)}
                 className="block w-full text-left px-4 py-2 text-sm text-uni-blue font-semibold hover:bg-blue-50 transition border-t border-slate-100"
               >
                 <span className="flex items-center gap-2">
                   <FaPlus size={10} />
                   Create new: {formatTag(input)}
                 </span>
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}