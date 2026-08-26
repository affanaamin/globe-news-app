"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

interface PakistanMapProps {
  onSelectProvince: (province: string) => void;
  selectedProvince: string | null;
  onBack: () => void;
}

export default function PakistanMap({ onSelectProvince, selectedProvince, onBack }: PakistanMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const [centroids, setCentroids] = useState<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    fetch('/pakistan-provinces.geojson')
      .then(res => res.json())
      .then(data => {
        // Clone GeoJSON before mutating
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

  const pathGenerator = useMemo(() => {
    if (!geoData) return null;
    const projection = geoMercator().fitSize([900, 750], geoData);
    return geoPath().projection(projection);
  }, [geoData]);

  if (!geoData || !pathGenerator) {
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

      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 text-center">
        <h1 className="text-2xl font-mono text-green-400 tracking-[0.3em] font-bold" style={{ textShadow: '0 0 20px rgba(0,255,128,0.6)' }}>
          PAKISTAN — PROVINCIAL VIEW
        </h1>
        <div className="text-xs font-mono text-green-500/50 mt-1 tracking-widest">SELECT A PROVINCE FOR REGIONAL INTEL</div>
      </div>

      <button 
        type="button"
        onClick={onBack}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 px-4 py-2 rounded transition-all font-mono shadow-[0_0_15px_rgba(0,255,128,0.3)] backdrop-blur-md"
      >
        ← GLOBAL VIEW
      </button>

      <div className="relative w-full h-full max-w-[800px] max-h-[800px] p-8 flex items-center justify-center">
        <svg viewBox="0 0 900 750" className="w-full h-full object-contain">
          
          {/* PASS 1: Province fills only (no stroke) */}
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
                onClick={() => onSelectProvince(name)}
                onMouseEnter={() => setHoveredProvince(name)}
                onMouseLeave={() => setHoveredProvince(null)}
                tabIndex={0}
                role="button"
                aria-label={name}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProvince(name); } }}
              />
            );
          })}

          {/* PASS 2: Province borders only (no fill) — drawn ON TOP so they are never covered */}
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
          
          {/* PASS 3: Labels */}
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
                    fontSize: name === 'Islamabad Capital Territory' ? '11px' : '16px',
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
                    fontSize: name === 'Islamabad Capital Territory' ? '11px' : '16px',
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
        </svg>
      </div>
    </div>
  );
}
