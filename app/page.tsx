"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Globe, 
  Radar, 
  Newspaper, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import NewsDashboard, { NewsArticle } from '@/components/NewsDashboard';
import CountrySearch from '@/components/CountrySearch';
import Starfield from '@/components/Starfield';
import PakistanMap from '@/components/PakistanMap';
import GodsEyeViewEmbed from '@/components/GodsEyeViewEmbed';
import { stopBroadcast } from '@/utils/speech';
import { GevView } from '@/types/gev';
import { 
  getKnownHotspot, 
  PakistanStrategicPoint, 
  buildHotspotReconView 
} from '@/utils/reconDispatch';
import { 
  toggleMasterMute, 
  subscribeMasterMute, 
  playRadarPing, 
  playTargetLockSound, 
  playScannerClick 
} from '@/utils/audio';

// Dynamically import InteractiveGlobe to avoid SSR WebGL issues
const InteractiveGlobe = dynamic(() => import('@/components/InteractiveGlobe'), { ssr: false });

export default function Home() {
  const [engineMode, setEngineMode] = useState<'strategic' | 'recon'>('strategic');
  const [hasMountedRecon, setHasMountedRecon] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'pakistan'>('global');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [targetReconView, setTargetReconView] = useState<GevView | null>(null);
  const [activeArticleUrl, setActiveArticleUrl] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<PakistanStrategicPoint | null>(null);

  // Mobile layout & drawer state (< 768px)
  const [isMobile, setIsMobile] = useState(false);
  const [drawerState, setDrawerState] = useState<'peek' | 'half' | 'full'>('half');
  const [isMutedState, setIsMutedState] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMasterMute((muted) => {
      setIsMutedState(muted);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncModeFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') || params.get('engine') || '').toLowerCase();
      if (mode === 'recon' || mode === 'gev' || mode === 'boost') {
        setHasMountedRecon(true);
        setEngineMode('recon');
      }
    };

    window.addEventListener('popstate', syncModeFromUrl);
    const timer = setTimeout(syncModeFromUrl, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', syncModeFromUrl);
    };
  }, []);

  const handleSelectCountry = (country: string | null) => {
    stopBroadcast();
    setSelectedCountry(country);
    setMentions([]);
    setActiveHotspot(null);

    // If leaving Pakistan, reset province mode
    if (country !== 'Pakistan') {
      setViewMode('global');
      setSelectedProvince(null);
    }

    if (country) {
      const hotspot = getKnownHotspot(country);
      if (hotspot) {
        setTargetReconView({
          camera: {
            lat: hotspot.lat,
            lon: hotspot.lon,
            altitude_m: hotspot.altitude_m || 800_000,
            pitch_deg: hotspot.pitch_deg || -50,
            heading_deg: 0,
          },
          layers: ['flights', 'ais-live-vessels', 'satellites'],
          style: 'normal',
          map: 'photoreal',
          annotations: [{
            type: 'pin',
            latitude: hotspot.lat,
            longitude: hotspot.lon,
            label: `SECTOR: ${country.toUpperCase()}`,
            color: 'primary',
          }],
        });
      }
    }
  };

  const handleSelectHotspot = (hotspot: PakistanStrategicPoint, flyToRecon = true) => {
    stopBroadcast();
    setActiveHotspot(hotspot);
    setSelectedCountry('Pakistan');
    setSelectedProvince(hotspot.province);
    setActiveArticleUrl(null);

    const reconView = buildHotspotReconView(hotspot);
    setHasMountedRecon(true);
    setTargetReconView(reconView);

    if (flyToRecon) {
      playTargetLockSound();
      setEngineMode('recon');
    } else {
      playScannerClick();
    }
  };

  const handleExpandPakistan = () => {
    setViewMode('pakistan');
    setSelectedProvince(null);
    setActiveHotspot(null);
  };

  const handleBackToGlobal = () => {
    setViewMode('global');
    setSelectedProvince(null);
    setActiveHotspot(null);
  };

  const handleSelectProvince = (province: string) => {
    stopBroadcast();
    setSelectedProvince(province);
    setActiveHotspot(null);

    const hotspot = getKnownHotspot(province);
    if (hotspot) {
      setTargetReconView({
        camera: {
          lat: hotspot.lat,
          lon: hotspot.lon,
          altitude_m: hotspot.altitude_m || 350_000,
          pitch_deg: hotspot.pitch_deg || -45,
          heading_deg: 0,
        },
        layers: ['flights', 'ais-live-vessels', 'earthquakes'],
        style: 'normal',
        map: 'photoreal',
        annotations: [{
          type: 'pin',
          latitude: hotspot.lat,
          longitude: hotspot.lon,
          label: `PROVINCE: ${province.toUpperCase()}`,
          color: 'primary',
        }],
      });
    }
  };

  const handleSelectReconTarget = (view: GevView, article: NewsArticle) => {
    setHasMountedRecon(true);
    setTargetReconView(view);
    setActiveArticleUrl(article.url);
    // Switch to Tactical Recon mode so the user immediately experiences GEV camera flight and telemetry
    setEngineMode('recon');
  };

  const handleToggleMasterAudio = () => {
    const muted = toggleMasterMute();
    if (!muted) {
      playRadarPing();
    }
  };

  // The dashboard is visible if a country is selected (global mode) or if we are in pakistan mode
  const showDashboard = viewMode === 'global' ? !!selectedCountry : true;
  const dashboardCountry = selectedCountry || 'Pakistan';
  const dashboardSearchQuery = activeHotspot 
    ? `${activeHotspot.name} Pakistan`
    : viewMode === 'pakistan' && selectedProvince
      ? `${selectedProvince} Pakistan`
      : viewMode === 'pakistan'
        ? 'Pakistan'
        : undefined;

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <Starfield />

      {/* Top Header & Dual-Engine Mode Switcher Bar */}
      <header className="absolute top-4 left-4 sm:left-6 z-30 flex flex-wrap items-center gap-2 sm:gap-4 pointer-events-none">
        {/* Console Brand Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/90 backdrop-blur-md border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-xl font-mono text-[11px] sm:text-xs text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-bold tracking-widest text-gray-200">PLANET OSINT //</span>
          <span className="text-gray-400 font-medium hidden md:inline">DUAL-ENGINE CONSOLE</span>
        </div>

        {/* Engine Switcher Toggle Pill */}
        <div className="pointer-events-auto flex items-center bg-black/90 backdrop-blur-md border border-white/20 p-1 rounded-lg shadow-xl font-mono text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => {
              playScannerClick();
              setEngineMode('strategic');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
              engineMode === 'strategic'
                ? 'bg-green-500/25 text-green-300 border border-green-500/60 shadow-[0_0_12px_rgba(0,255,128,0.3)]'
                : 'text-gray-400 hover:text-green-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-green-400" />
            <span>STRATEGIC 3D</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playScannerClick();
              setHasMountedRecon(true);
              setEngineMode('recon');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
              engineMode === 'recon'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/80 shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                : 'text-gray-400 hover:text-cyan-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400" />
            <span>TACTICAL RECON</span>
          </button>
        </div>

        {/* Master Audio HUD Pill */}
        <div className="pointer-events-auto flex items-center bg-black/90 backdrop-blur-md border border-white/20 p-1 rounded-lg shadow-xl font-mono text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={handleToggleMasterAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-md font-bold tracking-wider transition-all ${
              isMutedState
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-green-500/20 text-green-300 border border-green-500/60 shadow-[0_0_10px_rgba(0,255,128,0.2)]'
            }`}
            title={isMutedState ? 'Unmute Master Audio' : 'Mute Master Audio'}
          >
            {isMutedState ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMutedState ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      </header>

      {/* Strategic 3D Globe / Pakistan Map (Persistent WebGL context) */}
      <div 
        className={`absolute inset-0 overflow-hidden transition-opacity duration-300 ${
          engineMode === 'strategic' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
        style={!isMobile && showDashboard ? { right: '28rem' } : undefined}
      >
        {viewMode === 'global' ? (
          <InteractiveGlobe 
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry} 
            mentions={mentions}
          />
        ) : (
          <PakistanMap 
            selectedProvince={selectedProvince}
            onSelectProvince={handleSelectProvince}
            onBack={handleBackToGlobal}
            onSelectHotspot={handleSelectHotspot}
          />
        )}
      </div>

      {/* Tactical Recon GEV Cesium 3D Engine (Lazy mounted on first use, then kept warm) */}
      {hasMountedRecon && (
        <div 
          className={`absolute inset-0 overflow-hidden transition-opacity duration-300 ${
            engineMode === 'recon' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
          style={!isMobile && showDashboard ? { right: '28rem' } : undefined}
        >
          <GodsEyeViewEmbed 
            targetView={targetReconView}
          />
        </div>
      )}
      
      {/* Search Bar - Responsive Placement */}
      <div 
        className={`transition-all duration-300 z-30 ${
          isMobile 
            ? showDashboard && drawerState !== 'peek'
              ? 'absolute top-16 left-4 right-4 flex justify-center'
              : 'absolute bottom-24 left-4 right-4 flex justify-center'
            : `absolute bottom-8 ${showDashboard ? 'right-[30rem]' : 'right-8'}`
        }`}
      >
        <CountrySearch 
          onSelectCountry={handleSelectCountry} 
          onSelectHotspot={handleSelectHotspot}
        />
      </div>

      {/* Reopen News Dashboard button when closed */}
      {!showDashboard && (
        <button
          type="button"
          onClick={() => {
            playScannerClick();
            handleSelectCountry('Pakistan');
          }}
          className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-2 bg-black/90 hover:bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-mono text-xs font-bold tracking-wider shadow-lg transition-all"
        >
          <Newspaper className="w-4 h-4" />
          <span>INTEL FEED</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* DESKTOP (>= 768px): Classic Right Sidebar Dashboard */}
      {showDashboard && !isMobile && (
        <div className="absolute top-0 right-0 h-full w-full max-w-md bg-black/85 backdrop-blur-md border-l border-white/20 p-6 overflow-y-auto z-40 shadow-2xl">
          <button 
            type="button"
            aria-label="Close news dashboard"
            onClick={() => handleSelectCountry(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-1"
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
            engineMode={engineMode}
            onSelectReconTarget={handleSelectReconTarget}
            activeTargetArticleUrl={activeArticleUrl}
          />
        </div>
      )}

      {/* MOBILE (< 768px): Responsive Bottom Sheet / Collapsible Drawer */}
      {showDashboard && isMobile && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-green-500/50 rounded-t-2xl shadow-[0_-15px_35px_rgba(0,0,0,0.9)] transition-all duration-300 flex flex-col overflow-hidden ${
            drawerState === 'peek' 
              ? 'h-20' 
              : drawerState === 'half' 
                ? 'h-[55vh]' 
                : 'h-[90vh]'
          }`}
        >
          {/* Mobile Drawer Top Drag Bar & Controls */}
          <div 
            onClick={() => {
              playScannerClick();
              setDrawerState(prev => prev === 'peek' ? 'half' : prev === 'half' ? 'full' : 'peek');
            }}
            className="w-full pt-2 pb-1.5 px-4 cursor-pointer flex flex-col items-center border-b border-white/10 shrink-0 bg-green-950/20"
          >
            {/* Drag Handle Pill */}
            <div className="w-12 h-1 bg-green-500/50 rounded-full mb-2"></div>
            
            <div className="w-full flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 truncate pr-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></div>
                <span className="font-bold text-green-300 uppercase truncate">
                  {activeHotspot ? activeHotspot.displayName : (dashboardSearchQuery || dashboardCountry)}
                </span>
                <span className="text-[10px] text-gray-400 hidden xs:inline">
                  [{drawerState.toUpperCase()}]
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                {/* Minimize/Maximize state buttons */}
                <button
                  type="button"
                  onClick={() => {
                    playScannerClick();
                    setDrawerState(prev => prev === 'full' ? 'half' : 'peek');
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Collapse Drawer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playScannerClick();
                    setDrawerState(prev => prev === 'peek' ? 'half' : 'full');
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Expand Drawer"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playScannerClick();
                    handleSelectCountry(null);
                  }}
                  className="p-1 text-gray-400 hover:text-red-400 font-bold ml-1"
                  title="Close Drawer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <NewsDashboard 
              country={dashboardCountry}
              province={viewMode === 'pakistan' ? selectedProvince : null}
              searchQuery={dashboardSearchQuery}
              onMentionsExtracted={setMentions} 
              showExpandBtn={selectedCountry === 'Pakistan' && viewMode === 'global'}
              onExpand={handleExpandPakistan}
              engineMode={engineMode}
              onSelectReconTarget={handleSelectReconTarget}
              activeTargetArticleUrl={activeArticleUrl}
            />
          </div>
        </div>
      )}
    </main>
  );
}
