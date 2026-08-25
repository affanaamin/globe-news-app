"use client";

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function CountrySearch({ onSelectCountry }: { onSelectCountry: (country: string) => void }) {
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
      });

    // Handle clicking outside to close suggestions
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
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
    onSelectCountry(name);
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      {isOpen && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-black/90 border border-green-500/50 rounded-lg overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,255,128,0.2)] font-mono text-sm">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2 text-green-100 hover:bg-green-500/20 hover:text-green-400 transition-colors"
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
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (query.trim() !== '') setIsOpen(true) }}
          placeholder="SEARCH COUNTRY..."
          className="bg-transparent border-none outline-none text-green-100 placeholder-green-700 font-mono text-sm w-48"
        />
      </div>
    </div>
  );
}
