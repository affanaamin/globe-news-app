"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { Rocket, Crosshair, Anchor, Shield, Landmark, MapPin } from 'lucide-react';
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

export default function PakistanMap({ 
  onSelectProvince, 
  selectedProvince, 
  onBack,
  onSelectHotspot,
}: PakistanMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<PakistanStrategicPoint | null>(null);
  const [centroids, setCentroids] = useState<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    fetch('/pakistan-provinces.geojson')
      .then(res => res.json())
      .then(data => {
        const cleanData = JSON.parse(JSON.stringify(data));
        delete cleanData.crs;
        
        const projection = geoMercator().fitSize([900, 750], cleanData);
        const path = geoPath().projection(projection);
        
        const newCentroids = new Map<string, [number, number]>();
        cleanData.features.forEach((feature: any) => {
          const name = feature.properties.shapeName;
          const centroid = path.centroid(feature);
          if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
            newCentroids.set(name, centroid as [number, number]);
          }
        });
        
        setCentroids(newCentroids);
        setGeoData(cleanData);
      })
      .catch(err => console.error('Failed to load Pakistan GeoJSON:', err));
  }, []);

  const projection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitSize([900, 750], geoData);
  }, [geoData]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath().projection(projection);
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
    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0, 255, 128, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 128, 0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Top Title Bar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
        <h1 className="text-xl sm:text-2xl font-mono text-green-400 tracking-[0.3em] font-bold" style={{ textShadow: '0 0 20px rgba(0,255,128,0.6)' }}>
          PAKISTAN — PROVINCIAL VIEW
        </h1>
        <div className="text-[11px] font-mono text-green-500/70 mt-1 tracking-widest uppercase">
          {selectedProvince ? `ACTIVE SECTOR: ${selectedProvince.toUpperCase()} // SELECT TARGET` : 'CLICK PROVINCE OR STRATEGIC TARGET FOR 3D FLY-TO'}
        </div>
      </div>

      <button 
        type="button"
        onClick={() => { playScannerClick(); onBack(); }}
        className="absolute top-8 left-8 z-30 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 px-3.5 py-1.5 rounded transition-all font-mono text-xs shadow-[0_0_15px_rgba(0,255,128,0.3)] backdrop-blur-md"
      >
        ← GLOBAL VIEW
      </button>

      {/* Main SVG Map */}
      <div className="relative w-full h-full max-w-[850px] max-h-[800px] p-4 sm:p-8 flex items-center justify-center">
        <svg viewBox="0 0 900 750" className="w-full h-full object-contain">
          
          {/* PASS 1: Province fills */}
          {geoData.features.map((feature: any, i: number) => {
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
                d={pathGenerator(feature) as string}
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

          {/* PASS 2: Province borders */}
          {geoData.features.map((feature: any, i: number) => {
            const name = feature.properties.shapeName;
            const isSelected = selectedProvince === name;
            const isHovered = hoveredProvince === name;
            return (
              <path
                key={`stroke-${i}`}
                d={pathGenerator(feature) as string}
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
          
          {/* PASS 3: Province Labels */}
          {geoData.features.map((feature: any, i: number) => {
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

          {/* PASS 4: Strategic Hotspot Pins & Coordinates on Map */}
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
      <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-xl z-30 bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-lg p-3 font-mono shadow-2xl">
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
