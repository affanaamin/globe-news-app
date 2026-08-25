"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import NewsDashboard from '@/components/NewsDashboard';
import CountrySearch from '@/components/CountrySearch';
import Starfield from '@/components/Starfield';
import PakistanMap from '@/components/PakistanMap';
import { stopBroadcast } from '@/utils/speech';

// Dynamically import InteractiveGlobe to avoid SSR WebGL issues
const InteractiveGlobe = dynamic(() => import('@/components/InteractiveGlobe'), { ssr: false });

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'pakistan'>('global');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const handleSelectCountry = (country: string | null) => {
    stopBroadcast();
    setSelectedCountry(country);
    setMentions([]);
    // If leaving Pakistan, reset province mode
    if (country !== 'Pakistan') {
      setViewMode('global');
      setSelectedProvince(null);
    }
  };

  const handleExpandPakistan = () => {
    setViewMode('pakistan');
    setSelectedProvince(null);
  };

  const handleBackToGlobal = () => {
    setViewMode('global');
    setSelectedProvince(null);
  };

  const handleSelectProvince = (province: string) => {
    stopBroadcast();
    setSelectedProvince(province);
  };

  // The dashboard is visible if a country is selected (global mode) or if we are in pakistan mode
  const showDashboard = viewMode === 'global' ? !!selectedCountry : true;
  // The dashboard title — show province name if one is selected in pakistan mode
  const dashboardCountry = selectedCountry || 'Pakistan';
  const dashboardSearchQuery = viewMode === 'pakistan' && selectedProvince
    ? `${selectedProvince} Pakistan`
    : viewMode === 'pakistan'
      ? 'Pakistan'
      : undefined;

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      <Starfield />
      
      {viewMode === 'global' ? (
        <div className="absolute inset-0 overflow-hidden" style={showDashboard ? { right: '28rem' } : undefined}>
          <InteractiveGlobe 
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry} 
            mentions={mentions}
          />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden" style={{ right: '28rem' }}>
          <PakistanMap 
            selectedProvince={selectedProvince}
            onSelectProvince={handleSelectProvince}
            onBack={handleBackToGlobal}
          />
        </div>
      )}
      
      {/* Search Bar — only show in global mode */}
      {viewMode === 'global' && (
        <div className={`absolute bottom-8 transition-all duration-500 z-50 ${showDashboard ? 'right-[30rem]' : 'right-8'}`}>
          <CountrySearch onSelectCountry={handleSelectCountry} />
        </div>
      )}

      {/* Pointer-events blocker: prevents globe interaction when hovering dashboard area */}
      {showDashboard && (
        <div className="absolute top-0 right-0 h-full w-full max-w-md z-30" style={{ pointerEvents: 'auto' }} />
      )}

      {showDashboard && (
        <div className="absolute top-0 right-0 h-full w-full max-w-md bg-black/80 backdrop-blur-md border-l border-white/20 p-6 overflow-y-auto z-40">
          <button 
            onClick={() => {
              if (viewMode === 'pakistan') {
                handleBackToGlobal();
                handleSelectCountry(null);
              } else {
                handleSelectCountry(null);
              }
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
          >
            ✕
          </button>
          <NewsDashboard 
            country={dashboardCountry}
            province={viewMode === 'pakistan' ? selectedProvince : null}
            searchQuery={dashboardSearchQuery}
            onMentionsExtracted={setMentions} 
            showExpandBtn={selectedCountry === 'Pakistan' && viewMode === 'global'}
            onExpand={handleExpandPakistan}
          />
        </div>
      )}
    </main>
  );
}
