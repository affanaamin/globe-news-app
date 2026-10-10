"use client";

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search, MapPin, Rocket, Shield, Anchor, Landmark } from 'lucide-react';
import { 
  PakistanStrategicPoint, 
  searchPakistanHotspots 
} from '@/utils/reconDispatch';
import { playClickSound, playScannerClick, playTargetLockSound } from '@/utils/audio';

export interface SearchResultItem {
  type: 'country' | 'hotspot';
  name: string;
  countryName: string;
  hotspot?: PakistanStrategicPoint;
}

interface CountrySearchProps {
  onSelectCountry: (country: string) => void;
  onSelectHotspot?: (hotspot: PakistanStrategicPoint, flyToRecon?: boolean) => void;
  dropdownPosition?: 'up' | 'down';
}

export default function CountrySearch({ 
  onSelectCountry, 
  onSelectHotspot,
  dropdownPosition = 'up',
}: CountrySearchProps) {
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch and extract country names from local geojson
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => {
        const names = data.features.map((f: any) => f.properties.ADMIN || f.properties.NAME);
        const uniqueNames = Array.from(new Set(names)).sort() as string[];
        setCountries(uniqueNames);
      })
      .catch(() => {});

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
    const trimmed = val.trim();
    if (trimmed === '') {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const lower = trimmed.toLowerCase();

    // 1. Search Pakistan strategic hotspots first (high priority)
    const matchingHotspots = searchPakistanHotspots(lower).slice(0, 5);
    const hotspotItems: SearchResultItem[] = matchingHotspots.map(h => ({
      type: 'hotspot',
      name: h.displayName,
      countryName: 'Pakistan',
      hotspot: h,
    }));

    // 2. Search sovereign countries
    const matchingCountries = countries
      .filter(c => c.toLowerCase().includes(lower))
      .slice(0, 5)
      .map(c => ({
        type: 'country' as const,
        name: c,
        countryName: c,
      }));

    // Combine: hotspots first when searching Pakistani places, else mix
    const combined = [...hotspotItems, ...matchingCountries].slice(0, 7);
    setSuggestions(combined);
    setIsOpen(combined.length > 0);
  };

  const handleSelect = (item: SearchResultItem, flyToRecon = false) => {
    if (item.type === 'hotspot' && item.hotspot) {
      if (flyToRecon) {
        playTargetLockSound();
      } else {
        playScannerClick();
      }

      if (onSelectHotspot) {
        onSelectHotspot(item.hotspot, flyToRecon);
      } else {
        onSelectCountry('Pakistan');
      }
    } else {
      playClickSound();
      onSelectCountry(item.countryName);
    }

    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
      playScannerClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      playScannerClick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex], false);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0], false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const isDropdownDown = dropdownPosition === 'down';

  return (
    <div ref={wrapperRef} className="relative z-50">
      {isOpen && suggestions.length > 0 && (
        <div 
          id="country-suggestions"
          role="listbox"
          className={`absolute ${isDropdownDown ? 'top-full mt-2' : 'bottom-full mb-2'} w-80 sm:w-96 bg-black/95 border border-green-500/60 rounded-lg overflow-hidden backdrop-blur-xl shadow-[0_0_25px_rgba(0,255,128,0.25)] font-mono text-xs max-h-80 overflow-y-auto`}
        >
          <div className="px-3 py-1.5 bg-green-950/40 border-b border-green-500/30 text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>TACTICAL RECON TARGET SEARCH</span>
            <span>{suggestions.length} MATCHES</span>
          </div>

          {suggestions.map((item, i) => {
            const isSelected = i === activeIndex;
            const isHotspot = item.type === 'hotspot';
            const hotspot = item.hotspot;

            return (
              <div
                key={`${item.type}-${item.name}`}
                role="option"
                aria-selected={isSelected}
                className={`px-3 py-2 border-b border-white/5 transition-all flex items-center justify-between gap-2 ${
                  isSelected ? 'bg-green-500/30 text-green-200' : 'hover:bg-green-500/15 text-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item, false)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5 font-bold truncate">
                    {isHotspot ? (
                      hotspot?.category === 'Border Crossing' ? (
                        <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : hotspot?.category === 'Port & Maritime' ? (
                        <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : hotspot?.category === 'Critical Infrastructure' ? (
                        <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      )
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>

                  {isHotspot && hotspot && (
                    <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                      <span className="text-green-400/90 font-semibold">{hotspot.province}</span>
                      <span>•</span>
                      <span className="text-cyan-400/80">{hotspot.category}</span>
                      <span>•</span>
                      <span className="text-gray-500">{hotspot.coords.lat.toFixed(2)}°N, {hotspot.coords.lon.toFixed(2)}°E</span>
                    </div>
                  )}

                  {!isHotspot && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      SOVEREIGN NATION // STRATEGIC SECTOR
                    </div>
                  )}
                </button>

                {/* SATELLITE FLY-TO Instant Trigger Button for Pakistani Hotspots */}
                {isHotspot && hotspot && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(item, true);
                    }}
                    className="shrink-0 flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/60 hover:border-cyan-400 px-2 py-1 rounded text-[10px] font-bold tracking-wider shadow-[0_0_8px_rgba(0,255,255,0.2)] transition-all"
                    title="Instant 3D Satellite Fly-To in Tactical Recon"
                  >
                    <Rocket className="w-3 h-3 text-cyan-400" />
                    <span>FLY-TO</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex items-center bg-black/85 border border-green-500/50 hover:border-green-400 rounded-full px-4 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,128,0.2)] transition-all">
        <Search className="w-4 h-4 text-green-400 mr-2 shrink-0" />
        <input 
          type="text" 
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls="country-suggestions"
          aria-label="Search countries and Pakistan cities or strategic checkpoints"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (query.trim() !== '') setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="SEARCH COUNTRY OR PK CITY / CHECKPOINT..."
          className="bg-transparent border-none outline-none text-green-100 placeholder-green-700/80 font-mono text-xs sm:text-sm w-56 sm:w-64"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            className="text-gray-500 hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
