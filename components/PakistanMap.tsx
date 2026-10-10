"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { 
  Rocket, 
  Crosshair, 
  Anchor, 
  Shield, 
  Landmark, 
  MapPin, 
  Waves, 
  Mountain, 
  CloudRain, 
  SunMedium, 
  Snowflake,
  Wind
} from 'lucide-react';
import { 
  PAKISTAN_STRATEGIC_POINTS, 
  PakistanStrategicPoint 
} from '@/utils/reconDispatch';
import { playClickSound, playScannerClick, playTargetLockSound } from '@/utils/audio';

interface PakistanMapProps {
  onSelectProvince: (province: string) => void;
  selectedProvince: string | null;
  onBack: () => void;
  onSelectHotspot?: (hotspot: PakistanStrategicPoint, flyToRecon?: boolean) => void;
}

interface SectorWeatherData {
  temp: number;
  weatherCode: number;
  condition: 'rain' | 'frost' | 'heatwave' | 'fog' | 'clear';
  windSpeed: number;
  humidity: number;
  description: string;
}

// Coordinate paths for Indus Basin Hydraulic Network [lon, lat]
const INDUS_RIVER_COORDS: [number, number][] = [
  [75.82, 35.32], // Skardu gorge / Indus upper reach
  [74.75, 35.55], // Rondu / Astore confluence
  [74.34, 35.90], // Gilgit confluence / Bunji
  [73.20, 35.25], // Kohistan / Dassu
  [72.85, 34.70], // Besham
  [72.6975, 34.0886], // Tarbela Reservoir
  [72.24, 33.89], // Attock confluence (Kabul river enters)
  [71.55, 32.95], // Kalabagh / Mianwali gorge
  [71.30, 32.30], // Chashma Barrage
  [70.90, 31.80], // Dera Ismail Khan
  [70.72, 30.70], // Taunsa Barrage
  [70.42, 28.98], // Mithankot (Panjnad confluence)
  [69.70, 28.42], // Guddu Barrage
  [68.8574, 27.7052], // Sukkur Barrage
  [68.3578, 25.3960], // Kotri Barrage / Hyderabad
  [68.10, 24.75], // Thatta
  [67.55, 23.95], // Keti Bandar / Indus Delta
];

const JHELUM_RIVER_COORDS: [number, number][] = [
  [73.4711, 34.3700], // Muzaffarabad gorge
  [73.6472, 33.1436], // Mangla Dam Reservoir
  [73.72, 32.93], // Jhelum city
  [72.90, 32.50], // Rasul Barrage
  [72.35, 32.00], // Khushab
  [72.15, 31.18], // Trimmu Barrage confluence with Chenab
];

const CHENAB_RIVER_COORDS: [number, number][] = [
  [74.52, 32.68], // Marala Headworks (Sialkot / Gujrat)
  [74.10, 32.40], // Wazirabad
  [73.68, 32.18], // Qadirabad Barrage
  [73.10, 31.70], // Chiniot gorge
  [72.15, 31.18], // Trimmu Barrage (Jhelum joins)
  [71.55, 30.55], // Haveli / Muzaffargarh
  [71.40, 29.80], // Multan bypass / Shujabad
  [70.80, 29.35], // Panjnad Headworks
  [70.42, 28.98], // Mithankot (joins Indus)
];

const RAVI_RIVER_COORDS: [number, number][] = [
  [74.80, 31.90], // Shakargarh / Narowal
  [74.3587, 31.5204], // Lahore bypass
  [73.85, 31.20], // Balloki Headworks
  [72.75, 30.70], // Sidhnai Barrage
  [72.20, 30.55], // Confluence with Chenab
];

const SUTLEJ_RIVER_COORDS: [number, number][] = [
  [74.30, 31.05], // Ganda Singh Wala / Kasur border
  [73.70, 30.35], // Sulemanki Headworks
  [72.80, 29.85], // Islam Headworks / Vehari
  [71.60, 29.30], // Bahawalpur corridor
  [70.80, 29.35], // Confluence at Panjnad
];

const KABUL_RIVER_COORDS: [number, number][] = [
  [71.1006, 34.1264], // Khyber / Torkham flank
  [71.5249, 34.0151], // Peshawar / Warsak
  [71.85, 34.02], // Nowshera
  [72.24, 33.89], // Attock confluence with Indus
];

// Topographic relief contour paths [lon, lat][]
const KARAKORAM_CONTOURS: [number, number][][] = [
  // 8,000m+ K2 Crest Contour
  [
    [76.35, 35.95], [76.60, 35.93], [76.70, 35.80], 
    [76.55, 35.75], [76.30, 35.82], [76.35, 35.95]
  ],
  // Nanga Parbat 8,126m Relief
  [
    [74.45, 35.35], [74.70, 35.32], [74.75, 35.15],
    [74.50, 35.10], [74.35, 35.22], [74.45, 35.35]
  ],
  // 6,000m Karakoram Ridge Line
  [
    [73.80, 36.50], [74.30, 36.80], [75.10, 36.50], [75.60, 36.20],
    [76.60, 36.10], [77.20, 35.50], [76.50, 35.00], [75.20, 35.10],
    [74.20, 35.20], [73.80, 35.80], [73.80, 36.50]
  ],
  // 4,000m High Plateau Relief
  [
    [73.20, 36.80], [74.00, 37.00], [75.50, 37.00], [76.90, 36.50],
    [77.40, 35.40], [76.70, 34.80], [75.00, 34.70], [74.00, 34.90],
    [73.20, 35.60], [73.20, 36.80]
  ]
];

const HINDU_KUSH_CONTOURS: [number, number][][] = [
  // Tirich Mir 7,708m Crest
  [
    [71.60, 36.45], [72.10, 36.40], [72.25, 36.15],
    [71.75, 36.05], [71.45, 36.25], [71.60, 36.45]
  ],
  // Chitral / Swat High Ridges
  [
    [71.20, 35.80], [72.30, 35.90], [72.80, 35.40],
    [72.20, 34.80], [71.50, 35.00], [71.20, 35.80]
  ]
];

const SULAIMAN_CONTOURS: [number, number][][] = [
  // Takht-e-Sulaiman 3,487m Ridge
  [
    [69.80, 32.20], [70.20, 32.00], [70.30, 31.40], [70.20, 30.50],
    [70.00, 29.80], [69.60, 29.80], [69.70, 30.80], [69.60, 31.80],
    [69.80, 32.20]
  ],
  // Inner crest
  [
    [69.90, 31.80], [70.15, 31.70], [70.10, 31.20],
    [69.85, 31.30], [69.90, 31.80]
  ]
];

const KIRTHAR_CONTOURS: [number, number][][] = [
  // Gorakh Hill 1,734m Western Ridge
  [
    [67.00, 27.80], [67.40, 27.50], [67.30, 26.50], [67.10, 25.60],
    [66.80, 25.70], [66.90, 26.80], [67.00, 27.80]
  ]
];

const SECTOR_COORDINATES: Record<string, [number, number]> = {
  'Islamabad Capital Territory': [33.6844, 73.0479],
  'Punjab': [31.5204, 74.3587],
  'Sindh': [24.8607, 67.0011],
  'Khyber Pakhtunkhwa': [34.0151, 71.5249],
  'Balochistan': [30.1798, 66.9750],
  'Gilgit-Baltistan': [35.9208, 74.3083],
  'Azad Kashmir': [34.3700, 73.4711],
};

export default function PakistanMap({ 
  onSelectProvince, 
  selectedProvince, 
  onBack,
  onSelectHotspot,
}: PakistanMapProps) {
  interface GeoFeature {
    properties: {
      shapeName: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface GeoDataShape {
    features: GeoFeature[];
    [key: string]: unknown;
  }

  const [geoData, setGeoData] = useState<GeoDataShape | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<PakistanStrategicPoint | null>(null);
  const [centroids, setCentroids] = useState<Map<string, [number, number]>>(new Map());

  // Tactical cartography layer toggles
  const [showRivers, setShowRivers] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [showWeatherFx, setShowWeatherFx] = useState(true);

  // Live weather state for active sector
  const [weatherData, setWeatherData] = useState<SectorWeatherData | null>(null);

  useEffect(() => {
    fetch('/pakistan-provinces.geojson')
      .then(res => res.json())
      .then(data => {
        const cleanData = JSON.parse(JSON.stringify(data));
        delete cleanData.crs;
        
        const projection = geoMercator().fitSize([900, 750], cleanData);
        const path = geoPath().projection(projection);
        
        const newCentroids = new Map<string, [number, number]>();
        cleanData.features.forEach((feature: GeoFeature) => {
          const name = feature.properties.shapeName;
          const centroid = path.centroid(feature as unknown as Parameters<typeof path.centroid>[0]);
          if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
            newCentroids.set(name, centroid as [number, number]);
          }
        });
        
        setCentroids(newCentroids);
        setGeoData(cleanData);
      })
      .catch(err => console.error('Failed to load Pakistan GeoJSON:', err));
  }, []);

  // Fetch live weather data from Open-Meteo for selected province or default capital
  useEffect(() => {
    const coords = selectedProvince && SECTOR_COORDINATES[selectedProvince]
      ? SECTOR_COORDINATES[selectedProvince]
      : SECTOR_COORDINATES['Islamabad Capital Territory'];

    const [lat, lon] = coords;
    const controller = new AbortController();

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          const code = Number(data.current.weather_code ?? 0);
          const temp = Number(data.current.temperature_2m ?? 24);
          const wind = Number(data.current.wind_speed_10m ?? 8);
          const humidity = Number(data.current.relative_humidity_2m ?? 50);

          let condition: SectorWeatherData['condition'] = 'clear';
          let description = 'Clear / Optimal Vis';

          if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
            condition = 'rain';
            description = 'Precipitation / Rain Streaks';
          } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86) || temp <= 0) {
            condition = 'frost';
            description = 'Frost & Ice Shimmer';
          } else if (temp >= 35) {
            condition = 'heatwave';
            description = 'Thermal Heatwave Pulse';
          } else if (code === 45 || code === 48) {
            condition = 'fog';
            description = 'Atmospheric Mist / Fog';
          }

          setWeatherData({
            temp: Math.round(temp),
            weatherCode: code,
            condition,
            windSpeed: Math.round(wind),
            humidity: Math.round(humidity),
            description,
          });
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Weather fetch error:', err);
      });

    return () => controller.abort();
  }, [selectedProvince]);

  const projection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitSize([900, 750], geoData as unknown as Parameters<ReturnType<typeof geoMercator>['fitSize']>[1]);
  }, [geoData]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath().projection(projection);
  }, [projection]);

  // Helper to project polyline coordinates to SVG path "d" attribute
  const projectPolyline = useMemo(() => {
    return (points: [number, number][]) => {
      if (!projection) return '';
      return points
        .map((p, idx) => {
          const projected = projection(p);
          if (!projected) return '';
          return `${idx === 0 ? 'M' : 'L'} ${projected[0].toFixed(1)} ${projected[1].toFixed(1)}`;
        })
        .filter(Boolean)
        .join(' ');
    };
  }, [projection]);

  // Filter hotspots relevant to the selected province, or show major hubs if none selected
  const visibleHotspots = useMemo(() => {
    if (!selectedProvince) {
      return PAKISTAN_STRATEGIC_POINTS.slice(0, 10);
    }
    const filtered = PAKISTAN_STRATEGIC_POINTS.filter(p => 
      p.province.toLowerCase().includes(selectedProvince.toLowerCase())
    );
    return filtered.length > 0 ? filtered : PAKISTAN_STRATEGIC_POINTS.slice(0, 8);
  }, [selectedProvince]);

  const handleHotspotClick = (hotspot: PakistanStrategicPoint, flyTo = true) => {
    if (flyTo) {
      playTargetLockSound();
    } else {
      playClickSound();
    }

    if (onSelectHotspot) {
      onSelectHotspot(hotspot, flyTo);
    }
  };

  if (!geoData || !pathGenerator || !projection) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-green-500 font-mono text-lg">
        LOADING REGIONAL INTEL...
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 128, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 128, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Top Title & Weather Intel Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none flex flex-col items-center">
        <h1 className="text-xl sm:text-2xl text-green-400 tracking-[0.3em] font-bold" style={{ textShadow: '0 0 20px rgba(0,255,128,0.6)' }}>
          PAKISTAN — PROVINCIAL VIEW
        </h1>
        <div className="text-[11px] text-green-500/70 mt-1 tracking-widest uppercase">
          {selectedProvince ? `ACTIVE SECTOR: ${selectedProvince.toUpperCase()} // SELECT TARGET` : 'CLICK PROVINCE OR STRATEGIC TARGET FOR 3D FLY-TO'}
        </div>

        {/* Live Open-Meteo METAR Weather Intel Pill */}
        {weatherData && (
          <div className="mt-2 pointer-events-auto flex items-center gap-2 bg-black/80 border border-cyan-500/40 px-3 py-1 rounded-full text-[10px] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] backdrop-blur-md">
            {weatherData.condition === 'rain' && <CloudRain className="w-3 h-3 text-cyan-400 animate-bounce" />}
            {weatherData.condition === 'frost' && <Snowflake className="w-3 h-3 text-blue-300 animate-spin" style={{ animationDuration: '6s' }} />}
            {weatherData.condition === 'heatwave' && <SunMedium className="w-3 h-3 text-amber-400 animate-pulse" />}
            {weatherData.condition === 'clear' && <Wind className="w-3 h-3 text-emerald-400" />}
            {weatherData.condition === 'fog' && <Waves className="w-3 h-3 text-gray-300" />}
            
            <span className="font-bold tracking-wider">
              {selectedProvince ? selectedProvince.toUpperCase() : 'FEDERAL COMMAND'} METAR:
            </span>
            <span className="text-white font-bold">{weatherData.temp}°C</span>
            <span className="text-gray-400">|</span>
            <span className="text-cyan-200">{weatherData.description}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">WIND: {weatherData.windSpeed} KM/H</span>
          </div>
        )}
      </div>

      {/* Global View Button */}
      <button 
        type="button"
        onClick={() => { playScannerClick(); onBack(); }}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 px-3.5 py-1.5 rounded transition-all text-xs shadow-[0_0_15px_rgba(0,255,128,0.3)] backdrop-blur-md"
      >
        ← GLOBAL VIEW
      </button>

      {/* Top Right: Cartography Overhaul Layer Toggles */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-black/85 border border-cyan-500/40 p-1.5 rounded-lg shadow-xl backdrop-blur-md text-[10px]">
        <button
          type="button"
          onClick={() => setShowRivers(!showRivers)}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold tracking-wider transition ${
            showRivers
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'text-gray-500 hover:text-cyan-300'
          }`}
          title="Toggle Indus Basin Hydraulic Network (Indus, Jhelum, Chenab, Ravi, Sutlej)"
        >
          <Waves className="w-3 h-3" />
          <span>INDUS BASIN</span>
        </button>

        <button
          type="button"
          onClick={() => setShowContours(!showContours)}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold tracking-wider transition ${
            showContours
              ? 'bg-amber-500/30 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'text-gray-500 hover:text-amber-300'
          }`}
          title="Toggle Topographic Mountain Elevation Contours"
        >
          <Mountain className="w-3 h-3" />
          <span>RELIEF</span>
        </button>

        <button
          type="button"
          onClick={() => setShowWeatherFx(!showWeatherFx)}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold tracking-wider transition ${
            showWeatherFx
              ? 'bg-green-500/30 text-green-300 border border-green-400/80 shadow-[0_0_8px_rgba(0,255,128,0.3)]'
              : 'text-gray-500 hover:text-green-300'
          }`}
          title="Toggle Live Cybernetic Weather Visual Effects"
        >
          <CloudRain className="w-3 h-3" />
          <span>WEATHER FX</span>
        </button>
      </div>

      {/* Main SVG Map */}
      <div className="relative w-full h-full max-w-[850px] max-h-[800px] p-4 sm:p-8 flex items-center justify-center">
        <svg viewBox="0 0 900 750" className="w-full h-full object-contain">
          <defs>
            {/* Hydraulic River Conduit Glow Filter */}
            <filter id="river-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Weather FX Rain Pattern */}
            <pattern id="rain-streaks" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
              <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1.2" strokeDasharray="6 8" />
            </pattern>

            {/* Heatwave Gradient */}
            <radialGradient id="heatwave-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(249, 115, 22, 0.25)" />
              <stop offset="60%" stopColor="rgba(234, 88, 12, 0.12)" />
              <stop offset="100%" stopColor="rgba(234, 88, 12, 0)" />
            </radialGradient>
          </defs>
          
          {/* PASS 1: Province fills */}
          {geoData.features.map((feature: GeoFeature, i: number) => {
            const name = feature.properties.shapeName;
            const isSelected = selectedProvince === name;
            const isHovered = hoveredProvince === name;
            const fillColor = isSelected
              ? 'rgba(0, 255, 128, 0.25)'
              : isHovered
                ? 'rgba(0, 255, 128, 0.15)'
                : 'rgba(0, 255, 128, 0.03)';
            return (
              <path
                key={`fill-${i}`}
                d={pathGenerator(feature as unknown as Parameters<typeof pathGenerator>[0]) as string}
                style={{
                  fill: fillColor,
                  stroke: 'none',
                  cursor: 'pointer',
                  transition: 'fill 0.3s ease',
                }}
                onClick={() => { playClickSound(); onSelectProvince(name); }}
                onMouseEnter={() => setHoveredProvince(name)}
                onMouseLeave={() => setHoveredProvince(null)}
                tabIndex={0}
                role="button"
                aria-label={name}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProvince(name); } }}
              />
            );
          })}

          {/* PASS 2: Topographic Hillshade & Mountain Elevation Contours */}
          {showContours && (
            <g id="topographic-mountain-relief" pointerEvents="none">
              {/* Karakoram & Himalayas Elevation Contours (Gilgit-Baltistan) */}
              {KARAKORAM_CONTOURS.map((ring, idx) => (
                <path
                  key={`karakoram-${idx}`}
                  d={`${projectPolyline(ring)} Z`}
                  fill="rgba(245, 158, 11, 0.04)"
                  stroke={idx === 0 ? '#f59e0b' : idx === 1 ? '#fbbf24' : 'rgba(245, 158, 11, 0.45)'}
                  strokeWidth={idx === 0 ? 1.8 : 1.1}
                  strokeDasharray={idx === 0 ? 'none' : '4 3'}
                  filter={idx === 0 ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' : 'none'}
                />
              ))}

              {/* Hindu Kush / Tirich Mir Contours (Northern KPK) */}
              {HINDU_KUSH_CONTOURS.map((ring, idx) => (
                <path
                  key={`hindukush-${idx}`}
                  d={`${projectPolyline(ring)} Z`}
                  fill="rgba(245, 158, 11, 0.03)"
                  stroke="rgba(245, 158, 11, 0.45)"
                  strokeWidth={1.1}
                  strokeDasharray="4 3"
                />
              ))}

              {/* Sulaiman Mountain Range Contours (Balochistan / Western Frontier) */}
              {SULAIMAN_CONTOURS.map((ring, idx) => (
                <path
                  key={`sulaiman-${idx}`}
                  d={`${projectPolyline(ring)} Z`}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeWidth={1.1}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Kirthar Range Contours (Sindh / Balochistan Border) */}
              {KIRTHAR_CONTOURS.map((ring, idx) => (
                <path
                  key={`kirthar-${idx}`}
                  d={`${projectPolyline(ring)} Z`}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeWidth={1.0}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Mountain Relief Elevation Peak Tags */}
              {projection([76.5133, 35.8810]) && (
                <text
                  x={projection([76.5133, 35.8810])![0]}
                  y={projection([76.5133, 35.8810])![1] - 8}
                  fill="#fbbf24"
                  fontSize="8.5px"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ▲ 8,611m [K2]
                </text>
              )}

              {projection([74.5891, 35.2375]) && (
                <text
                  x={projection([74.5891, 35.2375])![0]}
                  y={projection([74.5891, 35.2375])![1] - 8}
                  fill="#f59e0b"
                  fontSize="8px"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  ▲ 8,126m [NANGA PARBAT]
                </text>
              )}

              {projection([71.8486, 36.2536]) && (
                <text
                  x={projection([71.8486, 36.2536])![0]}
                  y={projection([71.8486, 36.2536])![1] - 8}
                  fill="#f59e0b"
                  fontSize="8px"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  ▲ 7,708m [TIRICH MIR]
                </text>
              )}
            </g>
          )}

          {/* PASS 3: Indus Basin Hydraulic Network */}
          {showRivers && (
            <g id="indus-basin-hydraulic-network" pointerEvents="none">
              {/* Indus Main Stem Outer Glow */}
              <path
                d={projectPolyline(INDUS_RIVER_COORDS)}
                fill="none"
                stroke="rgba(6, 182, 212, 0.35)"
                strokeWidth={4.5}
                strokeLinecap="round"
                filter="url(#river-glow)"
              />
              {/* Indus Main Stem Cybernetic Conduit Line */}
              <path
                d={projectPolyline(INDUS_RIVER_COORDS)}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={2.2}
                strokeDasharray="10 4"
                strokeLinecap="round"
              />

              {/* Jhelum River */}
              <path
                d={projectPolyline(JHELUM_RIVER_COORDS)}
                fill="none"
                stroke="rgba(6, 182, 212, 0.25)"
                strokeWidth={3}
              />
              <path
                d={projectPolyline(JHELUM_RIVER_COORDS)}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1.4}
                strokeDasharray="6 3"
              />

              {/* Chenab River */}
              <path
                d={projectPolyline(CHENAB_RIVER_COORDS)}
                fill="none"
                stroke="rgba(6, 182, 212, 0.25)"
                strokeWidth={3}
              />
              <path
                d={projectPolyline(CHENAB_RIVER_COORDS)}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1.5}
                strokeDasharray="8 3"
              />

              {/* Ravi River */}
              <path
                d={projectPolyline(RAVI_RIVER_COORDS)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.3}
                strokeDasharray="5 3"
                opacity={0.85}
              />

              {/* Sutlej River */}
              <path
                d={projectPolyline(SUTLEJ_RIVER_COORDS)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.3}
                strokeDasharray="5 3"
                opacity={0.85}
              />

              {/* Kabul River */}
              <path
                d={projectPolyline(KABUL_RIVER_COORDS)}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1.3}
                strokeDasharray="5 3"
                opacity={0.8}
              />

              {/* Hydraulic Labels */}
              {projection([69.2, 28.0]) && (
                <text
                  x={projection([69.2, 28.0])![0]}
                  y={projection([69.2, 28.0])![1]}
                  fill="#06b6d4"
                  fontSize="8px"
                  fontFamily="monospace"
                  fontWeight="bold"
                  opacity={0.8}
                >
                  ≈ INDUS RIVER (SINDHU)
                </text>
              )}

              {projection([71.8, 30.2]) && (
                <text
                  x={projection([71.8, 30.2])![0]}
                  y={projection([71.8, 30.2])![1]}
                  fill="#38bdf8"
                  fontSize="7.5px"
                  fontFamily="monospace"
                  opacity={0.75}
                >
                  ≈ PANJNAD / CHENAB
                </text>
              )}
            </g>
          )}

          {/* PASS 4: Live Cybernetic Weather Effects Layer */}
          {showWeatherFx && weatherData && (
            <g id="live-weather-effects" pointerEvents="none">
              {/* Rain Streaks Overlay */}
              {weatherData.condition === 'rain' && (
                <rect x="0" y="0" width="900" height="750" fill="url(#rain-streaks)" opacity={0.6} />
              )}

              {/* Heatwave Thermal Pulse Ripple across Indus plains */}
              {weatherData.condition === 'heatwave' && projection([71.0, 29.5]) && (
                <g>
                  <circle
                    cx={projection([71.0, 29.5])![0]}
                    cy={projection([71.0, 29.5])![1]}
                    r="120"
                    fill="url(#heatwave-glow)"
                    className="animate-pulse"
                  />
                  <circle
                    cx={projection([71.0, 29.5])![0]}
                    cy={projection([71.0, 29.5])![1]}
                    r="180"
                    fill="none"
                    stroke="rgba(249, 115, 22, 0.3)"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                  />
                </g>
              )}

              {/* Frost Shimmer Stars in Northern Highlands */}
              {weatherData.condition === 'frost' && projection([75.0, 35.8]) && (
                <g>
                  <circle
                    cx={projection([75.0, 35.8])![0]}
                    cy={projection([75.0, 35.8])![1]}
                    r="90"
                    fill="rgba(186, 230, 253, 0.08)"
                  />
                  <circle
                    cx={projection([75.0, 35.8])![0]}
                    cy={projection([75.0, 35.8])![1]}
                    r="5"
                    fill="#bae6fd"
                    filter="drop-shadow(0 0 6px #38bdf8)"
                    className="animate-ping"
                  />
                  <text
                    x={projection([75.0, 35.8])![0]}
                    y={projection([75.0, 35.8])![1] + 18}
                    fill="#bae6fd"
                    fontSize="7.5px"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ❄ SUB-ZERO FROST SHIMMER
                  </text>
                </g>
              )}
            </g>
          )}

          {/* PASS 5: Province borders */}
          {geoData.features.map((feature: GeoFeature, i: number) => {
            const name = feature.properties.shapeName;
            const isSelected = selectedProvince === name;
            const isHovered = hoveredProvince === name;
            return (
              <path
                key={`stroke-${i}`}
                d={pathGenerator(feature as unknown as Parameters<typeof pathGenerator>[0]) as string}
                style={{
                  fill: 'none',
                  stroke: isSelected ? '#00ff80' : isHovered ? '#00ff80' : 'rgba(0, 255, 128, 0.6)',
                  strokeWidth: isSelected ? 3.5 : isHovered ? 2.5 : 1.8,
                  filter: isSelected
                    ? 'drop-shadow(0 0 10px rgba(0, 255, 128, 0.8))'
                    : isHovered
                      ? 'drop-shadow(0 0 5px rgba(0, 255, 128, 0.4))'
                      : 'none',
                  pointerEvents: 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
          
          {/* PASS 6: Province Labels */}
          {geoData.features.map((feature: GeoFeature, i: number) => {
            const name = feature.properties.shapeName;
            const centroid = centroids.get(name);
            if (!centroid) return null;
            const isSelected = selectedProvince === name;
            const isHovered = hoveredProvince === name;
            
            return (
              <g key={`label-${i}`}>
                <text
                  x={centroid[0]}
                  y={centroid[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fill: 'black',
                    fontSize: name === 'Islamabad Capital Territory' ? '11px' : '15px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    stroke: 'black',
                    strokeWidth: 5,
                    paintOrder: 'stroke' as const,
                  }}
                >
                  {name}
                </text>
                <text
                  x={centroid[0]}
                  y={centroid[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fill: isSelected ? '#ffffff' : isHovered ? '#00ff80' : 'rgba(0, 255, 128, 0.9)',
                    fontSize: name === 'Islamabad Capital Territory' ? '11px' : '15px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                  }}
                >
                  {name}
                </text>
              </g>
            );
          })}

          {/* PASS 7: Strategic Hotspot Pins & Coordinates on Map */}
          {PAKISTAN_STRATEGIC_POINTS.map((pt) => {
            const pos = projection([pt.coords.lon, pt.coords.lat]);
            if (!pos) return null;
            const [x, y] = pos;
            const isHovered = hoveredHotspot?.id === pt.id;
            const isProvincialMatch = selectedProvince 
              ? pt.province.toLowerCase().includes(selectedProvince.toLowerCase())
              : true;

            const pinColor = pt.category === 'Border Crossing' 
              ? '#ef4444' 
              : pt.category === 'Port & Maritime' 
                ? '#06b6d4' 
                : pt.category === 'Critical Infrastructure'
                  ? '#f59e0b'
                  : '#10b981';

            return (
              <g 
                key={`hotspot-${pt.id}`}
                className="cursor-pointer transition-transform"
                onClick={() => handleHotspotClick(pt, true)}
                onMouseEnter={() => setHoveredHotspot(pt)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                {/* Ping ring */}
                {isProvincialMatch && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 14 : 9}
                    fill="none"
                    stroke={pinColor}
                    strokeWidth={isHovered ? 2 : 1.2}
                    opacity={isHovered ? 0.9 : 0.5}
                    className={isHovered ? 'animate-ping' : ''}
                  />
                )}

                {/* Center dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 4.5 : 3}
                  fill={pinColor}
                  stroke="#000000"
                  strokeWidth={1.5}
                  filter={`drop-shadow(0 0 6px ${pinColor})`}
                />

                {/* Hotspot callout tag when hovered */}
                {isHovered && (
                  <g pointerEvents="none">
                    <rect
                      x={x + 8}
                      y={y - 20}
                      width={170}
                      height={24}
                      rx={4}
                      fill="#050505"
                      stroke={pinColor}
                      strokeWidth={1}
                      filter="drop-shadow(0 2px 8px rgba(0,0,0,0.8))"
                    />
                    <text
                      x={x + 14}
                      y={y - 5}
                      fill="#ffffff"
                      fontSize="10px"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pt.displayName.slice(0, 24)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Strategic Hotspots & SATELLITE FLY-TO Panel */}
      <div className="absolute bottom-16 md:bottom-6 left-4 md:left-6 right-4 md:right-auto md:max-w-xl z-30 bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2.5 sm:p-3 font-mono shadow-2xl">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Crosshair className="w-3.5 h-3.5" />
            <span>PAKISTAN RECON TARGETS</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {selectedProvince ? `[${selectedProvince.toUpperCase()}]` : '[ALL SECTORS]'}
          </span>
        </div>

        {/* Hotspot Buttons Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {visibleHotspots.map((h) => {
            let Icon = MapPin;
            if (h.category === 'Border Crossing') Icon = Shield;
            else if (h.category === 'Port & Maritime') Icon = Anchor;
            else if (h.category === 'Critical Infrastructure') Icon = Landmark;

            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handleHotspotClick(h, true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-gray-800 hover:border-cyan-400 transition text-[11px] group"
                title={`${h.displayName} — Click for 3D Satellite Fly-To`}
              >
                <Icon className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold">{h.displayName.split('(')[0].trim()}</span>
                <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[9px] text-cyan-300 font-bold bg-cyan-950/60 px-1 rounded border border-cyan-500/40">
                  <Rocket className="w-2.5 h-2.5" /> FLY-TO
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
