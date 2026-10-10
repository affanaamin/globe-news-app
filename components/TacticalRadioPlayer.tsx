"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RadioTower, 
  Activity, 
  Disc, 
  Sliders, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  RadioStation, 
  getStationsForProvince 
} from '@/utils/radioStations';
import { 
  playScannerClick, 
  playRadarPing, 
  isMasterMuted, 
  toggleMasterMute, 
  subscribeMasterMute, 
  toggleTelemetryHum, 
  isTelemetryHumActive 
} from '@/utils/audio';

interface TacticalRadioPlayerProps {
  province?: string | null;
  className?: string;
}

export default function TacticalRadioPlayer({ province, className = '' }: TacticalRadioPlayerProps) {
  const stations = getStationsForProvince(province);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isHumming, setIsHumming] = useState(() => isTelemetryHumActive());
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fallbackStation: RadioStation = {
    id: 'pbc-default',
    name: 'Radio Pakistan National',
    callsign: 'PBC-ISB',
    frequency: 'AM 1260 kHz / FM 93',
    location: 'Islamabad',
    province: 'Islamabad Capital Territory',
    streamUrl: 'https://whmsonic.radio.gov.pk:7003/stream',
    description: 'National Flagship News Service',
    genre: 'News & Current Affairs',
    isVerified: true,
  };

  const currentStation: RadioStation = stations[currentStationIndex] || stations[0] || fallbackStation;

  // Sync with master mute pub/sub
  useEffect(() => {
    const unsubscribe = subscribeMasterMute((muted) => {
      setIsMuted(muted);
      if (audioRef.current) {
        audioRef.current.muted = muted;
      }
    });
    return () => unsubscribe();
  }, []);

  // Render-phase state adjustment when province changes (React 19 pattern)
  const [prevProvince, setPrevProvince] = useState(province);
  if (province !== prevProvince) {
    setPrevProvince(province);
    if (!isPlaying) {
      setCurrentStationIndex(0);
    }
  }

  // Audio element setup and lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setHasError(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('pause', onPause);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Handle station change
  const playStation = useCallback((station: RadioStation) => {
    if (!audioRef.current) return;
    playScannerClick();
    setHasError(false);
    setIsLoading(true);
    audioRef.current.src = station.streamUrl;
    audioRef.current.volume = volume;
    audioRef.current.muted = isMasterMuted();

    audioRef.current.play().catch(() => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    });
  }, [volume]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying || isLoading) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
      setIsLoading(false);
      playScannerClick();
    } else {
      playStation(currentStation);
    }
  };

  const handleSelectStation = (index: number) => {
    setCurrentStationIndex(index);
    const station = stations[index];
    if (isPlaying || isLoading) {
      playStation(station);
    } else {
      playScannerClick();
    }
  };

  const handleScanFrequencies = () => {
    playScannerClick();
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      return;
    }

    let nextIdx = currentStationIndex;
    let cycles = 0;
    scanIntervalRef.current = setInterval(() => {
      nextIdx = (nextIdx + 1) % stations.length;
      setCurrentStationIndex(nextIdx);
      playScannerClick();
      cycles++;

      if (cycles >= 6) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        playRadarPing();
        playStation(stations[nextIdx]);
      }
    }, 280);
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    if (audioRef.current) {
      audioRef.current.volume = newVal;
    }
  };

  const handleToggleMasterMute = () => {
    const muted = toggleMasterMute();
    setIsMuted(muted);
    if (!muted) {
      playRadarPing();
    }
  };

  const handleToggleHum = () => {
    const active = toggleTelemetryHum();
    setIsHumming(active);
    if (active) {
      playRadarPing();
    } else {
      playScannerClick();
    }
  };

  return (
    <div className={`bg-black/80 border border-green-500/40 rounded-lg p-3 font-mono text-xs shadow-[0_0_20px_rgba(0,255,128,0.15)] relative overflow-hidden ${className}`}>
      {/* Background CRT scanlines */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.03] to-transparent pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-green-500/30 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <RadioTower className={`w-4 h-4 ${isPlaying ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
          <span className="font-bold text-green-400 tracking-wider">
            {"// PK-RADIO TUNER"}
          </span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            [VERIFIED BROADCASTS]
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Signal Indicator */}
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>{isPlaying ? 'LOCKED (100%)' : isLoading ? 'TUNING...' : 'STANDBY'}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-green-300 p-1"
            title={isExpanded ? 'Collapse Presets' : 'Expand All Presets'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Digital Dial / Frequency Display HUD */}
      <div className="bg-green-950/20 border border-green-500/30 rounded p-2.5 mb-2.5 flex items-center justify-between relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -left-10 -top-10 w-24 h-24 bg-green-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-green-300 tracking-widest font-mono">
              {currentStation.frequency}
            </span>
            <span className="text-[10px] text-green-400/80 bg-green-500/15 border border-green-500/30 px-1.5 py-0.5 rounded">
              {currentStation.callsign}
            </span>
          </div>
          <div className="text-white font-semibold text-xs truncate">
            {currentStation.name}
          </div>
          <div className="text-gray-400 text-[10px] truncate">
            {currentStation.location} • {currentStation.province}
          </div>
        </div>

        {/* Animated Spectrum Equalizer Bars */}
        <div className="flex items-end gap-1 h-8 px-2 border-l border-green-500/30">
          {[40, 75, 100, 60, 90, 50].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-t transition-all duration-150 ${
                isPlaying 
                  ? 'bg-green-400 shadow-[0_0_8px_rgba(0,255,128,0.8)] animate-pulse' 
                  : 'bg-green-900/40'
              }`}
              style={{
                height: isPlaying ? `${Math.max(15, (h * ((i + 2) % 3 + 1)) % 100)}%` : '15%',
                animationDelay: `${i * 120}ms`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Primary Playback & Tuner Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs tracking-wider transition-all ${
              isPlaying
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/60 shadow-[0_0_12px_rgba(255,0,0,0.3)] animate-pulse'
                : 'bg-green-500/25 hover:bg-green-500/40 text-green-300 border border-green-500/60 shadow-[0_0_12px_rgba(0,255,128,0.3)]'
            }`}
          >
            {isLoading ? (
              <>
                <Disc className="w-3.5 h-3.5 animate-spin" />
                <span>CONNECTING...</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>OFF AIR</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>TUNE IN</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleScanFrequencies}
            className="flex items-center gap-1 bg-black/70 hover:bg-green-500/20 text-gray-300 hover:text-green-300 border border-green-500/40 px-2 py-1.5 rounded text-xs transition"
            title="Scan frequencies across Pakistan"
          >
            <Radio className="w-3.5 h-3.5 text-green-400" />
            <span>SCAN</span>
          </button>

          <button
            type="button"
            onClick={playRadarPing}
            className="flex items-center gap-1 bg-black/70 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1.5 rounded text-xs transition"
            title="Tactical radar sonar ping"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">PING</span>
          </button>
        </div>

        {/* Tactical Ambient FX & Master Mute */}
        <div className="flex items-center gap-1.5">
          {/* Ambient Hum Toggle */}
          <button
            type="button"
            onClick={handleToggleHum}
            className={`px-2 py-1.5 rounded text-[10px] font-bold border transition ${
              isHumming || isTelemetryHumActive()
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.3)]'
                : 'bg-black/60 text-gray-400 border-gray-700 hover:text-gray-200'
            }`}
            title="Toggle Ambient Tactical Telemetry Hum (55Hz drone)"
          >
            HUM: {isHumming || isTelemetryHumActive() ? 'ON' : 'OFF'}
          </button>

          {/* Master Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMasterMute}
            className={`p-1.5 rounded border transition ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : 'bg-black/60 text-gray-300 border-gray-700 hover:text-green-400'
            }`}
            title={isMuted ? 'Unmute Master Audio' : 'Mute Master Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-1 text-gray-400">
            <Sliders className="w-3 h-3" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-14 accent-green-400 h-1 bg-gray-800 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="mb-2.5 p-2 bg-red-950/40 border border-red-500/40 rounded text-red-300 text-[11px] flex justify-between items-center">
          <span>{"STREAM TEMPORARILY UNREACHABLE // RETRY OR SELECT ANOTHER STATION"}</span>
          <button
            type="button"
            onClick={() => playStation(currentStation)}
            className="underline font-bold hover:text-white ml-2"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Quick Station Preset Pills */}
      <div className="border-t border-green-500/20 pt-2">
        <div className="text-[10px] text-green-500/80 mb-1.5 flex items-center justify-between uppercase tracking-wider">
          <span>TACTICAL BROADCAST PRESETS</span>
          <span>{province ? `PRIORITIZING: ${province.toUpperCase()}` : 'ALL SECTORS'}</span>
        </div>

        <div className={`flex flex-wrap gap-1.5 ${isExpanded ? 'max-h-48 overflow-y-auto' : 'max-h-20 overflow-hidden'}`}>
          {stations.map((st, i) => {
            const isSelected = i === currentStationIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStation(i)}
                className={`px-2 py-1 rounded text-[10px] font-mono tracking-wide transition border ${
                  isSelected
                    ? 'bg-green-500/30 text-green-300 border-green-400 shadow-[0_0_8px_rgba(0,255,128,0.3)] font-bold'
                    : 'bg-black/60 text-gray-400 border-gray-800 hover:border-green-500/40 hover:text-green-300'
                }`}
              >
                <span className="text-green-400 mr-1">[{st.callsign}]</span>
                <span>{st.location}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
