"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { geoCentroid } from 'd3-geo';
import { playClickSound } from '../utils/audio';
import * as THREE from 'three';

const trussGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
const metalMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 100 });
const solarPanelGeo = new THREE.BoxGeometry(2, 0.1, 5);
const panelMat = new THREE.MeshPhongMaterial({ 
  color: 0x0044ff, 
  shininess: 150,
  emissive: 0x001144, 
  side: THREE.DoubleSide 
});
const moduleGeo = new THREE.CylinderGeometry(0.6, 0.6, 3, 16);
const whiteMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 50 });
const redLightGeo = new THREE.SphereGeometry(0.4, 8, 8);
const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

export function createISSModel(): THREE.Group {
  const iss = new THREE.Group();

  // Main truss (long cylinder)
  const truss = new THREE.Mesh(trussGeo, metalMat);
  truss.rotation.z = Math.PI / 2;
  iss.add(truss);

  // Solar arrays (4 sets of flat boxes)
  const positions = [
    [-2.5, 0, 2],
    [-2.5, 0, -2],
    [2.5, 0, 2],
    [2.5, 0, -2]
  ];

  positions.forEach(pos => {
    const panel = new THREE.Mesh(solarPanelGeo, panelMat);
    panel.position.set(pos[0], pos[1], pos[2]);
    iss.add(panel);
  });

  // Modules (central living quarters)
  const mainModule = new THREE.Mesh(moduleGeo, whiteMat);
  iss.add(mainModule);

  const crossModule = new THREE.Mesh(moduleGeo, whiteMat);
  crossModule.rotation.x = Math.PI / 2;
  iss.add(crossModule);

  // Add a pulsing red beacon light (we can just make it static bright red)
  const redLight = new THREE.Mesh(redLightGeo, redLightMat);
  redLight.position.y = 1.7;
  iss.add(redLight);
  
  // Scale it down significantly so it looks proportional to the globe
  iss.scale.set(0.6, 0.6, 0.6);

  return iss;
}

interface GlobeProps {
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
  mentions?: string[];
}

export default function InteractiveGlobe({ selectedCountry, onSelectCountry, mentions = [] }: GlobeProps) {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] });
  const [hoverD, setHoverD] = useState<any>(null);

  useEffect(() => {
    // Load GeoJSON data for countries from local public folder
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => {
        data.features.forEach((f: any) => {
          const [lng, lat] = geoCentroid(f);
          f.properties._lng = lng;
          f.properties._lat = lat;
        });
        setCountries(data);
      })
      .catch(() => {});
  }, []);

  const isCountry = (d: any) => d && d.properties && d.properties.ADMIN;

  const isSelectedCountry = useCallback((d: any) => {
    if (!d || !d.properties) return false;
    return isCountry(d) && (d.properties.ADMIN || d.properties.NAME) === selectedCountry;
  }, [selectedCountry]);

  const isActive = (d: any) => d === hoverD || isSelectedCountry(d);

  // Compute Arcs Data
  const arcsData = useMemo(() => {
    if (!selectedCountry || !mentions || mentions.length === 0 || countries.features.length === 0) return [];
    
    const origin = countries.features.find(isSelectedCountry);
    if (!origin) return [];

    return mentions.map(mentionName => {
      const dest = countries.features.find(f => (f.properties.ADMIN || f.properties.NAME) === mentionName);
      if (!dest) return null;
      return {
        startLat: origin.properties._lat,
        startLng: origin.properties._lng,
        endLat: dest.properties._lat,
        endLng: dest.properties._lng,
        name: mentionName
      };
    }).filter(Boolean) as any[];
  }, [selectedCountry, mentions, countries, isSelectedCountry]);

  // Effect to zoom into country or zoom out
  useEffect(() => {
    if (globeEl.current) {
      if (selectedCountry && countries.features.length > 0) {
        const polygon = countries.features.find(isSelectedCountry);
        if (polygon) {
          globeEl.current.pointOfView({ lat: polygon.properties._lat, lng: polygon.properties._lng, altitude: 1.2 }, 1000);
        }
      } else if (selectedCountry === null) {
        globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
      }
    }
  }, [selectedCountry, countries, isSelectedCountry]);

  // ISS Tracker Effect
  const [issData, setIssData] = useState<{ lat: number; lng: number, path: {lat: number, lng: number}[] } | null>(null);
  
  useEffect(() => {
    let active = true;
    const pathHistory: {lat: number, lng: number}[] = [];
    
    const fetchISS = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        pathHistory.push({ lat: data.latitude, lng: data.longitude });
        if (pathHistory.length > 300) pathHistory.shift(); // keep trail
        setIssData({ lat: data.latitude, lng: data.longitude, path: [...pathHistory] });
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchISS();
    const interval = setInterval(fetchISS, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Combine HTML elements
  const htmlElements = selectedCountry ? countries.features.filter(isSelectedCountry) : [];

  // Make the globe's Three.js renderer transparent so the starfield shows through
  useEffect(() => {
    if (globeEl.current) {
      const renderer = globeEl.current.renderer();
      if (renderer) {
        renderer.setClearColor(0x000000, 0);
      }
    }
  }, []);

  return (
    <div 
      className="w-full h-full cursor-pointer relative"
      onMouseLeave={() => setHoverD(null)}
    >
      <Globe
        ref={globeEl}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={false}
        showAtmosphere={true}
        atmosphereColor="#b000ff"
        atmosphereAltitude={0.25}
        polygonsData={countries.features}
        polygonAltitude={d => isActive(d) ? 0.2 : 0.02}
        polygonCapColor={d => isActive(d) ? 'rgba(0, 255, 128, 0.9)' : 'rgba(0, 200, 100, 0.15)'}
        polygonSideColor={d => isActive(d) ? 'rgba(0, 255, 128, 0.4)' : 'rgba(0, 200, 100, 0.05)'}
        polygonStrokeColor={() => 'rgba(0, 255, 128, 0.4)'}
        polygonLabel={({ properties }: any) => `
          <div class="bg-black/80 text-green-400 px-3 py-1.5 rounded border border-green-500/50 backdrop-blur-sm font-semibold shadow-[0_0_10px_rgba(0,255,128,0.3)]">
            ${properties.ADMIN || properties.NAME}
          </div>
        `}
        htmlElementsData={htmlElements}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="bg-black/80 text-green-400 px-3 py-1.5 rounded border border-green-500/50 backdrop-blur-sm font-semibold shadow-[0_0_10px_rgba(0,255,128,0.3)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
              ${d.properties.ADMIN || d.properties.NAME}
            </div>
          `;
          return el;
        }}
        htmlLat={(d: any) => d.properties._lat}
        htmlLng={(d: any) => d.properties._lng}
        htmlAltitude={() => 0.22}
        
        // 3D Objects (ISS)
        objectsData={issData ? [{ lat: issData.lat, lng: issData.lng }] : []}
        objectLat="lat"
        objectLng="lng"
        objectAltitude={0.35}
        objectThreeObject={createISSModel}

        // Paths (ISS Orbit)
        pathsData={issData && issData.path.length > 1 ? [issData.path] : []}
        pathPointLat={(d: any) => d.lat}
        pathPointLng={(d: any) => d.lng}
        pathPointAlt={0.35}
        pathColor={() => 'rgba(255, 0, 0, 0.6)'}
        pathDashLength={0.01}
        pathDashGap={0}
        pathDashAnimateTime={0}
        
        // Arcs Rendering
        arcsData={arcsData}
        arcStartLat={d => (d as any).startLat}
        arcStartLng={d => (d as any).startLng}
        arcEndLat={d => (d as any).endLat}
        arcEndLng={d => (d as any).endLng}
        arcColor={() => 'rgba(0, 255, 128, 0.9)'}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcAltitudeAutoScale={0.3}

        onPolygonHover={setHoverD}
        onPolygonClick={(polygon: any) => {
          playClickSound();
          const { properties } = polygon;
          const countryName = properties.ADMIN || properties.NAME;
          
          if (selectedCountry === countryName) {
            onSelectCountry(null);
          } else {
            onSelectCountry(countryName);
          }
        }}
      />
      
      {/* Outer glow overlay for the entire globe container */}
      <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0_0_100px_rgba(0,255,128,0.1)]"></div>
    </div>
  );
}
