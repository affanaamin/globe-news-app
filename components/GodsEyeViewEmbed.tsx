"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Radar, 
  Layers, 
  Eye, 
  Flame, 
  Plane, 
  Ship, 
  Satellite, 
  Activity, 
  Shield, 
  Crosshair, 
  Radio, 
  RotateCcw, 
  AlertTriangle, 
  RefreshCw,
  Terminal,
  Settings
} from 'lucide-react';
import { 
  GevView, 
  GevStyle, 
  GevViewMessage, 
  GEV_AVAILABLE_STYLES, 
  GEV_AVAILABLE_LAYERS,
  GevViewAppliedMessage,
  GevAnnotation
} from '@/types/gev';

interface GodsEyeViewEmbedProps {
  /** The target view dispatched from news headline selection or external controls */
  targetView?: GevView | null;
  /** Callback fired once GEV notifies it is ready to receive views */
  onReady?: () => void;
  /** Callback fired once a view has been applied by GEV */
  onViewApplied?: (applied: GevViewAppliedMessage) => void;
  /** Base URL of the running GEV instance (defaults to NEXT_PUBLIC_GEV_URL or http://localhost:4173) */
  initialGevUrl?: string;
  className?: string;
}

function normalizeEndpointUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return 'http://localhost:4173';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If user just typed port e.g. "4173" or "5173"
  if (/^\d+$/.test(trimmed)) return `http://localhost:${trimmed}`;
  return `http://${trimmed}`;
}

export default function GodsEyeViewEmbed({
  targetView,
  onReady,
  onViewApplied,
  initialGevUrl,
  className = '',
}: GodsEyeViewEmbedProps) {
  const defaultUrl = normalizeEndpointUrl(
    initialGevUrl || process.env.NEXT_PUBLIC_GEV_URL || 'http://localhost:4173'
  );
  const [gevBaseUrl, setGevBaseUrl] = useState<string>(defaultUrl);
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(defaultUrl);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Maintain active telemetry and active annotations so HUD actions don't wipe headline pins
  const [telemetryState, setTelemetryState] = useState<{
    lat: number;
    lon: number;
    alt: number;
    pitch: number;
    heading: number;
    style: GevStyle;
    layers: string[];
    annotations: GevAnnotation[];
  }>({
    lat: 30.3753,
    lon: 69.3451,
    alt: 800_000,
    pitch: -55,
    heading: 0,
    style: 'normal',
    layers: ['flights', 'ais-live-vessels', 'satellites'],
    annotations: [],
  });

  const pendingViewRef = useRef<GevView | null>(null);
  const isReadyRef = useRef<boolean>(false);
  const applyingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onReadyRef = useRef(onReady);
  const onViewAppliedRef = useRef(onViewApplied);

  useEffect(() => {
    onReadyRef.current = onReady;
    onViewAppliedRef.current = onViewApplied;
  }, [onReady, onViewApplied]);

  // Keep isReadyRef in sync with isReady outside of render phase
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  // Track iframe load attempt and timeout
  const [iframeKey, setIframeKey] = useState(0);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send a view to the GEV iframe
  const dispatchView = useCallback((view: GevView) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      pendingViewRef.current = view;
      return;
    }

    if (!isReadyRef.current) {
      pendingViewRef.current = view;
      return;
    }

    const requestId = `gev_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setIsApplying(true);

    if (applyingTimerRef.current) clearTimeout(applyingTimerRef.current);
    applyingTimerRef.current = setTimeout(() => {
      setIsApplying(false);
    }, 4000);

    const message: GevViewMessage = {
      type: 'gev:view',
      id: requestId,
      view,
    };

    try {
      iframeRef.current.contentWindow.postMessage(message, '*');
      
      // Update local telemetry preview and retain annotations
      setTelemetryState(prev => ({
        lat: view.camera.lat,
        lon: view.camera.lon,
        alt: view.camera.altitude_m ?? prev.alt,
        pitch: view.camera.pitch_deg ?? prev.pitch,
        heading: view.camera.heading_deg ?? prev.heading,
        style: view.style || prev.style,
        layers: view.layers || prev.layers,
        annotations: view.annotations !== undefined ? view.annotations : prev.annotations,
      }));
    } catch (err) {
      console.error('Failed to postMessage to GEV iframe:', err);
      setIsApplying(false);
    }
  }, []);

  // PostMessage listener for GEV handshake
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Source validation: ensure message originates from our GEV iframe
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'gev:ready') {
        // Crucial: Set ref to true BEFORE dispatching any queued view
        isReadyRef.current = true;
        setIsReady(true);
        setConnectionError(null);
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
        if (onReadyRef.current) onReadyRef.current();

        // Dispatch queued view if available
        if (pendingViewRef.current) {
          const nextView = pendingViewRef.current;
          pendingViewRef.current = null;
          dispatchView(nextView);
        }
      } else if (data.type === 'gev:view-applied') {
        if (applyingTimerRef.current) {
          clearTimeout(applyingTimerRef.current);
          applyingTimerRef.current = null;
        }
        setIsApplying(false);
        if (onViewAppliedRef.current) {
          onViewAppliedRef.current(data as GevViewAppliedMessage);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (applyingTimerRef.current) clearTimeout(applyingTimerRef.current);
    };
  }, [dispatchView]);

  // Set timeout warning if iframe takes too long to announce ready
  useEffect(() => {
    readyTimeoutRef.current = setTimeout(() => {
      if (!isReadyRef.current) {
        setConnectionError('Uplink timeout: Ensure GEV dev server is active on ' + gevBaseUrl);
      }
    }, 12000);

    return () => {
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    };
  }, [gevBaseUrl, iframeKey]);

  // Sync external targetView changes
  useEffect(() => {
    if (targetView) {
      const scheduleTimer = setTimeout(() => {
        dispatchView(targetView);
      }, 0);
      return () => clearTimeout(scheduleTimer);
    }
  }, [targetView, dispatchView]);

  // Layer toggle handler: preserves active annotations and camera angles
  const handleToggleLayer = (layerId: string) => {
    const current = new Set(telemetryState.layers);
    if (current.has(layerId)) {
      current.delete(layerId);
    } else {
      current.add(layerId);
    }
    const updatedLayers = Array.from(current);
    const updatedView: GevView = {
      camera: {
        lat: telemetryState.lat,
        lon: telemetryState.lon,
        altitude_m: telemetryState.alt,
        pitch_deg: telemetryState.pitch,
        heading_deg: telemetryState.heading,
      },
      style: telemetryState.style,
      layers: updatedLayers,
      annotations: telemetryState.annotations,
      map: 'photoreal',
    };
    dispatchView(updatedView);
  };

  // Style change handler: preserves active annotations and camera angles
  const handleChangeStyle = (style: GevStyle) => {
    const updatedView: GevView = {
      camera: {
        lat: telemetryState.lat,
        lon: telemetryState.lon,
        altitude_m: telemetryState.alt,
        pitch_deg: telemetryState.pitch,
        heading_deg: telemetryState.heading,
      },
      style,
      layers: telemetryState.layers,
      annotations: telemetryState.annotations,
      map: 'photoreal',
    };
    dispatchView(updatedView);
  };

  // Reset to default strategic overview position
  const handleResetCamera = () => {
    const overviewView: GevView = {
      camera: {
        lat: 30.3753,
        lon: 69.3451,
        altitude_m: 1_200_000,
        pitch_deg: -55,
        heading_deg: 0,
      },
      layers: ['flights', 'ais-live-vessels', 'satellites'],
      style: 'normal',
      map: 'photoreal',
      annotations: [],
    };
    dispatchView(overviewView);
  };

  const reloadIframe = () => {
    isReadyRef.current = false;
    setIsReady(false);
    setConnectionError(null);
    setIframeKey(k => k + 1);
  };

  const embedSrc = `${gevBaseUrl.replace(/\/$/, '')}/?embed=1`;

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden font-mono ${className}`}>
      {/* Top Tactical HUD Bar */}
      <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Telemetry Status */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-black/85 backdrop-blur-md border border-cyan-500/40 px-3.5 py-2 rounded shadow-[0_0_15px_rgba(0,255,255,0.15)] text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isReady ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 animate-pulse"></span>
              )}
            </span>
            <span className="text-cyan-400 font-bold tracking-wider">
              {isReady ? 'GEV RECON // LINKED' : 'INITIALIZING UPLINK...'}
            </span>
          </div>

          <div className="h-3.5 w-px bg-cyan-500/30"></div>

          <div className="text-gray-300 text-[11px] flex gap-2">
            <span>LAT: <span className="text-cyan-300 font-semibold">{telemetryState.lat.toFixed(2)}°</span></span>
            <span>LON: <span className="text-cyan-300 font-semibold">{telemetryState.lon.toFixed(2)}°</span></span>
            <span>ALT: <span className="text-cyan-300 font-semibold">{(telemetryState.alt / 1000).toFixed(0)}km</span></span>
          </div>

          {isApplying && (
            <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
              SYNCING VIEW...
            </span>
          )}
        </div>

        {/* Center: Sensor Mode Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-green-500/40 p-1 rounded shadow-[0_0_15px_rgba(0,255,128,0.15)] text-xs">
          <span className="text-gray-400 text-[10px] px-2 font-bold uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-green-400" /> SENSOR:
          </span>
          {GEV_AVAILABLE_STYLES.slice(0, 5).map((styleName) => {
            const isActive = telemetryState.style === styleName;
            return (
              <button
                key={styleName}
                type="button"
                onClick={() => handleChangeStyle(styleName)}
                className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-green-500/30 text-green-300 border border-green-400 shadow-[0_0_10px_rgba(0,255,128,0.3)]'
                    : 'text-gray-400 hover:text-green-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {styleName === 'retro' ? 'CRT' : styleName === 'surveillance' ? 'NVG' : styleName === 'thermal' ? 'FLIR' : styleName}
              </button>
            );
          })}
        </div>

        {/* Right: Reset & Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 bg-black/85 hover:bg-white/10 text-gray-300 border border-gray-600/60 px-2.5 py-1.5 rounded transition text-xs shadow-md"
            title="Reset to strategic altitude"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">RESET</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomUrlOpen(!isCustomUrlOpen)}
            className="flex items-center gap-1 bg-black/85 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-600/60 p-1.5 rounded transition text-xs"
            title="GEV Server Endpoint Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom GEV Endpoint Config Popover */}
      {isCustomUrlOpen && (
        <div className="absolute top-16 right-6 z-30 bg-black/95 border border-cyan-500/50 p-4 rounded-lg shadow-2xl max-w-sm text-xs font-mono">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-cyan-500/30">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> GEV ENDPOINT CONFIG
            </span>
            <button 
              type="button" 
              onClick={() => setIsCustomUrlOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-[11px] mb-3 leading-relaxed">
            Configure the running God&apos;s Eye View instance. Default is <code className="text-cyan-300">http://localhost:4173</code>:
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="flex-1 bg-black border border-gray-600 px-2.5 py-1.5 rounded text-white text-xs focus:border-cyan-400 outline-none"
              placeholder="http://localhost:4173"
            />
            <button
              type="button"
              onClick={() => {
                const normalized = normalizeEndpointUrl(customUrlInput);
                setGevBaseUrl(normalized);
                setCustomUrlInput(normalized);
                setIsCustomUrlOpen(false);
                reloadIframe();
              }}
              className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50 px-3 py-1.5 rounded font-bold"
            >
              SAVE
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Layer Selector Bar */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none flex flex-col gap-2">
        <div className="pointer-events-auto bg-black/85 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-cyan-400 font-bold tracking-wider uppercase border-b border-cyan-500/20 pb-1">
            <Layers className="w-3 h-3 text-cyan-400" /> ACTIVE TELEMETRY STREAMS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GEV_AVAILABLE_LAYERS.map((layer) => {
              const isActive = telemetryState.layers.includes(layer.id);
              
              let Icon = Layers;
              if (layer.icon === 'Plane') Icon = Plane;
              else if (layer.icon === 'Crosshair') Icon = Crosshair;
              else if (layer.icon === 'Ship') Icon = Ship;
              else if (layer.icon === 'Satellite') Icon = Satellite;
              else if (layer.icon === 'Activity') Icon = Activity;
              else if (layer.icon === 'Flame') Icon = Flame;
              else if (layer.icon === 'Shield') Icon = Shield;
              else if (layer.icon === 'Radio') Icon = Radio;
              else if (layer.icon === 'Radar') Icon = Radar;

              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => handleToggleLayer(layer.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,255,255,0.25)]'
                      : 'bg-black/60 text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Offline / Connection Error Overlay */}
      {connectionError && !isReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-black/95 border-2 border-amber-500/60 rounded-lg p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] text-gray-200">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="w-7 h-7 shrink-0 animate-pulse" />
              <div>
                <h3 className="font-bold text-base tracking-wider uppercase">Tactical Recon Uplink Standby</h3>
                <p className="text-xs text-amber-500/90 font-mono">GEV Engine Not Detected on {gevBaseUrl}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono mb-6 bg-gray-950 p-3.5 rounded border border-gray-800">
              <p className="text-gray-300">To launch the Cesium 3D God&apos;s Eye View engine locally:</p>
              <div className="bg-black border border-amber-500/30 p-2.5 rounded text-amber-300 select-all font-mono text-[11px]">
                npm run dev:gev
              </div>
              <p className="text-gray-400 text-[11px]">
                Or start both concurrently: <code className="text-cyan-400">npm run dev:all</code>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={reloadIframe}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 py-2 px-3 rounded font-bold text-xs transition tracking-wider"
              >
                <RefreshCw className="w-3.5 h-3.5" /> RETRY CONNECTION
              </button>
              <button
                type="button"
                onClick={() => setIsCustomUrlOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded text-xs transition"
              >
                Change Port
              </button>
            </div>
          </div>
        </div>
      )}

      {/* God's Eye View Iframe - trusted origin embedding */}
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={embedSrc}
        title="God's Eye View Tactical Console"
        className="w-full h-full border-0 pointer-events-auto"
        allow="camera; microphone; geolocation; fullscreen; accelerometer; gyroscope"
      />
    </div>
  );
}
