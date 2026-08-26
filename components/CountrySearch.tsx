"use client";

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

export default function CountrySearch({ onSelectCountry }: { onSelectCountry: (country: string) => void }) {
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch and extract country names from local geojson
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => {
        const names = data.features.map((f: any) => f.properties.ADMIN || f.properties.NAME);
        // Remove duplicates and sort
        const uniqueNames = Array.from(new Set(names)).sort() as string[];
        setCountries(uniqueNames);
      })
      .catch(() => {});

    // Handle clicking outside to close suggestions
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    setActiveIndex(-1);
    if (val.trim() === '') {
      setSuggestions([]);
      setIsOpen(false);
    } else {
      const filtered = countries.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
      setIsOpen(true);
    }
  };

  const handleSelect = (name: string) => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    onSelectCountry(name);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      {isOpen && suggestions.length > 0 && (
        <div 
          id="country-suggestions"
          role="listbox"
          className="absolute bottom-full mb-2 w-full bg-black/90 border border-green-500/50 rounded-lg overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,255,128,0.2)] font-mono text-sm"
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-4 py-2 text-green-100 transition-colors ${
                i === activeIndex ? 'bg-green-500/40 text-green-300' : 'hover:bg-green-500/20 hover:text-green-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex items-center bg-black/80 border border-green-500/50 rounded-full px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,128,0.2)]">
        <Search className="w-4 h-4 text-green-400 mr-2" />
        <input 
          type="text" 
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls="country-suggestions"
          aria-label="Search countries"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (query.trim() !== '') setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="SEARCH COUNTRY..."
          className="bg-transparent border-none outline-none text-green-100 placeholder-green-700 font-mono text-sm w-48"
        />
      </div>
    </div>
  );
}
