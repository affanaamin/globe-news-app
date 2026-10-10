import type { GevAnnotation, GevAnnotationColor, GevCamera, GevStyle, GevView } from '../types/gev';

export interface LocationCoordinates {
  lat: number;
  lon: number;
  altitude_m?: number;
  pitch_deg?: number;
  heading_deg?: number;
}

export const KNOWN_HOTSPOTS: Record<string, LocationCoordinates> = {
  // Pakistan regions & cities
  'pakistan': { lat: 30.3753, lon: 69.3451, altitude_m: 900_000, pitch_deg: -55 },
  'islamabad': { lat: 33.6844, lon: 73.0479, altitude_m: 45_000, pitch_deg: -45 },
  'karachi': { lat: 24.8607, lon: 67.0011, altitude_m: 60_000, pitch_deg: -45 },
  'lahore': { lat: 31.5204, lon: 74.3587, altitude_m: 50_000, pitch_deg: -45 },
  'peshawar': { lat: 34.0151, lon: 71.5249, altitude_m: 45_000, pitch_deg: -45 },
  'quetta': { lat: 30.1798, lon: 66.9750, altitude_m: 45_000, pitch_deg: -45 },
  'gwadar': { lat: 25.1264, lon: 62.3225, altitude_m: 40_000, pitch_deg: -40 },
  'gilgit': { lat: 35.9208, lon: 74.3083, altitude_m: 55_000, pitch_deg: -40 },
  'muzaffarabad': { lat: 34.3700, lon: 73.4711, altitude_m: 45_000, pitch_deg: -45 },
  'sindh': { lat: 25.8943, lon: 68.5247, altitude_m: 400_000, pitch_deg: -50 },
  'punjab': { lat: 31.1704, lon: 72.7097, altitude_m: 450_000, pitch_deg: -50 },
  'khyber pakhtunkhwa': { lat: 34.9526, lon: 72.3311, altitude_m: 350_000, pitch_deg: -50 },
  'balochistan': { lat: 28.4907, lon: 65.0958, altitude_m: 500_000, pitch_deg: -50 },
  'gilgit-baltistan': { lat: 35.8026, lon: 74.9832, altitude_m: 350_000, pitch_deg: -45 },
  'azad kashmir': { lat: 33.9259, lon: 73.7810, altitude_m: 200_000, pitch_deg: -45 },
  
  // Major Geopolitical Sovereign Nations
  'united states': { lat: 37.0902, lon: -95.7129, altitude_m: 3_000_000, pitch_deg: -55 },
  'usa': { lat: 37.0902, lon: -95.7129, altitude_m: 3_000_000, pitch_deg: -55 },
  'united kingdom': { lat: 55.3781, lon: -3.4360, altitude_m: 1_200_000, pitch_deg: -50 },
  'uk': { lat: 55.3781, lon: -3.4360, altitude_m: 1_200_000, pitch_deg: -50 },
  'china': { lat: 35.8617, lon: 104.1954, altitude_m: 2_500_000, pitch_deg: -55 },
  'russia': { lat: 61.5240, lon: 105.3188, altitude_m: 4_000_000, pitch_deg: -60 },
  'ukraine': { lat: 48.3794, lon: 31.1656, altitude_m: 1_200_000, pitch_deg: -50 },
  'india': { lat: 20.5937, lon: 78.9629, altitude_m: 2_000_000, pitch_deg: -55 },
  'iran': { lat: 32.4279, lon: 53.6880, altitude_m: 1_500_000, pitch_deg: -50 },
  'israel': { lat: 31.0461, lon: 34.8516, altitude_m: 300_000, pitch_deg: -45 },
  'japan': { lat: 36.2048, lon: 138.2529, altitude_m: 1_500_000, pitch_deg: -50 },
  'germany': { lat: 51.1657, lon: 10.4515, altitude_m: 1_000_000, pitch_deg: -50 },
  'france': { lat: 46.2276, lon: 2.2137, altitude_m: 1_200_000, pitch_deg: -50 },
  'turkey': { lat: 38.9637, lon: 35.2433, altitude_m: 1_200_000, pitch_deg: -50 },
  'saudi arabia': { lat: 23.8859, lon: 45.0792, altitude_m: 1_800_000, pitch_deg: -50 },
  'united arab emirates': { lat: 23.4241, lon: 53.8478, altitude_m: 600_000, pitch_deg: -45 },
  'uae': { lat: 23.4241, lon: 53.8478, altitude_m: 600_000, pitch_deg: -45 },
  'south korea': { lat: 35.9078, lon: 127.7669, altitude_m: 700_000, pitch_deg: -45 },
  'taiwan': { lat: 23.6978, lon: 120.9605, altitude_m: 500_000, pitch_deg: -45 },
  'canada': { lat: 56.1304, lon: -106.3468, altitude_m: 3_500_000, pitch_deg: -60 },
  'brazil': { lat: -14.2350, lon: -51.9253, altitude_m: 3_000_000, pitch_deg: -55 },
  'australia': { lat: -25.2744, lon: 133.7751, altitude_m: 3_000_000, pitch_deg: -55 },
  'egypt': { lat: 26.8206, lon: 30.8025, altitude_m: 1_400_000, pitch_deg: -50 },
  'afghanistan': { lat: 33.9391, lon: 67.7100, altitude_m: 1_000_000, pitch_deg: -50 },
  'syria': { lat: 34.8021, lon: 38.9968, altitude_m: 800_000, pitch_deg: -50 },
  'iraq': { lat: 33.2232, lon: 43.6793, altitude_m: 1_000_000, pitch_deg: -50 },
  'yemen': { lat: 15.5527, lon: 48.5164, altitude_m: 1_000_000, pitch_deg: -50 },
  'lebanon': { lat: 33.8547, lon: 35.8623, altitude_m: 250_000, pitch_deg: -45 },

  // Geopolitical Hotspot Capitals & Metropolises
  'washington': { lat: 38.9072, lon: -77.0369, altitude_m: 60_000, pitch_deg: -45 },
  'london': { lat: 51.5074, lon: -0.1278, altitude_m: 60_000, pitch_deg: -45 },
  'beijing': { lat: 39.9042, lon: 116.4074, altitude_m: 70_000, pitch_deg: -45 },
  'moscow': { lat: 55.7558, lon: 37.6173, altitude_m: 70_000, pitch_deg: -45 },
  'kyiv': { lat: 50.4501, lon: 30.5234, altitude_m: 55_000, pitch_deg: -45 },
  'tehran': { lat: 35.6892, lon: 51.3890, altitude_m: 65_000, pitch_deg: -45 },
  'tel aviv': { lat: 32.0853, lon: 34.7818, altitude_m: 50_000, pitch_deg: -45 },
  'jerusalem': { lat: 31.7683, lon: 35.2137, altitude_m: 45_000, pitch_deg: -45 },
  'gaza': { lat: 31.5017, lon: 34.4668, altitude_m: 30_000, pitch_deg: -40 },
  'taipei': { lat: 25.0330, lon: 121.5654, altitude_m: 50_000, pitch_deg: -45 },
  'tokyo': { lat: 35.6762, lon: 139.6503, altitude_m: 70_000, pitch_deg: -45 },
  'new delhi': { lat: 28.6139, lon: 77.2090, altitude_m: 60_000, pitch_deg: -45 },
  'dubai': { lat: 25.2048, lon: 55.2708, altitude_m: 50_000, pitch_deg: -45 },
  'riyadh': { lat: 24.7136, lon: 46.6753, altitude_m: 60_000, pitch_deg: -45 },
  'paris': { lat: 48.8566, lon: 2.3522, altitude_m: 60_000, pitch_deg: -45 },
  'berlin': { lat: 52.5200, lon: 13.4050, altitude_m: 60_000, pitch_deg: -45 },
  'seoul': { lat: 37.5665, lon: 126.9780, altitude_m: 60_000, pitch_deg: -45 },
  'kabul': { lat: 34.5553, lon: 69.2075, altitude_m: 45_000, pitch_deg: -45 },
  'baghdad': { lat: 33.3152, lon: 44.3661, altitude_m: 50_000, pitch_deg: -45 },
  'beirut': { lat: 33.8938, lon: 35.5018, altitude_m: 35_000, pitch_deg: -45 },
  
  // Strategic Chokepoints
  'hormuz': { lat: 26.5667, lon: 56.2500, altitude_m: 120_000, pitch_deg: -45 },
  'red sea': { lat: 20.0000, lon: 38.5000, altitude_m: 450_000, pitch_deg: -50 },
  'suez': { lat: 30.5852, lon: 32.2654, altitude_m: 80_000, pitch_deg: -45 },
  'malacca': { lat: 4.1406, lon: 100.5639, altitude_m: 250_000, pitch_deg: -45 },
  'taiwan strait': { lat: 24.0000, lon: 119.5000, altitude_m: 300_000, pitch_deg: -45 },
};

export interface ArticleReconInput {
  title: string;
  description?: string;
  sentimentScore?: number;
  country: string;
  province?: string | null;
  mentions?: string[];
  defaultCoords?: [number, number]; // [lat, lng]
}

/**
 * Resolves a location name or country name against known hotspots
 */
export function getKnownHotspot(name?: string | null): LocationCoordinates | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  return KNOWN_HOTSPOTS[key];
}

/**
 * Builds a God's Eye View payload optimized for a specific news headline
 */
export function buildArticleReconView({
  title,
  description = '',
  sentimentScore = 0,
  country,
  province,
  mentions = [],
  defaultCoords,
}: ArticleReconInput): GevView {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // 1. Determine location coordinates
  let targetLocation: LocationCoordinates = {
    lat: 30.3753,
    lon: 69.3451,
    altitude_m: 650_000,
    pitch_deg: -50,
    heading_deg: 0,
  };

  // Check known hotspots in text
  let detectedHotspotKey: string | null = null;
  for (const [key, coords] of Object.entries(KNOWN_HOTSPOTS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(combinedText)) {
      targetLocation = coords;
      detectedHotspotKey = key;
      break;
    }
  }

  // If no hotspot in text, fallback to province or country coordinates
  if (!detectedHotspotKey) {
    if (province && KNOWN_HOTSPOTS[province.toLowerCase()]) {
      targetLocation = KNOWN_HOTSPOTS[province.toLowerCase()];
    } else if (KNOWN_HOTSPOTS[country.toLowerCase()]) {
      targetLocation = KNOWN_HOTSPOTS[country.toLowerCase()];
    } else if (
      Array.isArray(defaultCoords) &&
      Number.isFinite(defaultCoords[0]) &&
      Number.isFinite(defaultCoords[1])
    ) {
      targetLocation = {
        lat: defaultCoords[0],
        lon: defaultCoords[1],
        altitude_m: 750_000,
        pitch_deg: -55,
        heading_deg: 0,
      };
    }
  }

  // 2. Classify domain / intelligence category
  const isMilitary = /\b(military|army|defense|war|attack|missile|strike|border|forces|troop|combat|security|airforce|navy|nuclear)\b/i.test(combinedText);
  const isMaritime = /\b(vessel|ship|sea|maritime|port|cargo|tanker|coast|ocean|cables|strait|canal)\b/i.test(combinedText);
  const isDisaster = /\b(earthquake|quake|flood|fire|wildfire|cyclone|storm|rain|weather|tsunami|landslide|disaster)\b/i.test(combinedText);
  const isAviation = /\b(flight|airline|airplane|airport|airspace|aviation|pilot|crash|boeing|airbus)\b/i.test(combinedText);
  const isSpace = /\b(satellite|orbit|space|rocket|launch|nasa|isro|esa)\b/i.test(combinedText);
  const isTechInfra = /\b(telecom|fiber|internet|cable|datacenter|power|grid|dam|cyber|energy)\b/i.test(combinedText);

  // 3. Choose visual sensor style
  let style: GevStyle = 'normal';
  let layers: string[] = ['flights', 'ais-live-vessels', 'satellites'];
  let pinColor: GevAnnotationColor = 'primary';

  if (isMilitary) {
    style = 'surveillance'; // NVG Night Vision
    layers = ['military', 'military-installations', 'military-awareness', 'flights', 'satellites'];
    pinColor = 'red';
  } else if (isDisaster) {
    style = 'thermal'; // FLIR thermal camera
    layers = ['earthquakes', 'local-firms', 'weather-cyclones', 'fire-perimeters'];
    pinColor = 'amber';
  } else if (isMaritime) {
    style = 'retro'; // CRT green tactical
    layers = ['ais-live-vessels', 'telegeography-submarine-cables', 'weather-radar'];
    pinColor = 'cyan';
  } else if (isAviation) {
    style = 'retro';
    layers = ['flights', 'military', 'weather-radar'];
    pinColor = 'amber';
  } else if (isSpace) {
    style = 'normal';
    layers = ['satellites', 'rocket-launches', 'radio'];
    pinColor = 'primary';
  } else if (isTechInfra) {
    style = 'retro';
    layers = ['telegeography-submarine-cables', 'local-datacenters', 'local-dams', 'radio'];
    pinColor = 'green';
  } else {
    // Sentiment based
    if (sentimentScore < 0) {
      style = 'surveillance';
      layers = ['flights', 'ais-live-vessels', 'earthquakes'];
      pinColor = 'red';
    } else if (sentimentScore > 0) {
      style = 'normal';
      layers = ['flights', 'ais-live-vessels', 'satellites'];
      pinColor = 'green';
    }
  }

  // 4. Construct Tactical Annotations
  const annotations: GevAnnotation[] = [];

  // Main event pinpoint: ensure label strictly <= 120 chars for GEV limit
  const trimmedTitle = title.trim();
  const shortTitle = trimmedTitle.length > 70 
    ? `${trimmedTitle.slice(0, 67)}...` 
    : (trimmedTitle || 'TARGET DETECTED');
  
  annotations.push({
    type: 'pin',
    latitude: targetLocation.lat,
    longitude: targetLocation.lon,
    label: `[INTEL] ${shortTitle}`.slice(0, 110),
    color: pinColor,
  });

  // Highlight region radius
  annotations.push({
    type: 'highlight',
    latitude: targetLocation.lat,
    longitude: targetLocation.lon,
    color: pinColor,
  });

  // If there are mentioned countries, add secondary labels if distinct from target
  if (mentions && mentions.length > 0) {
    mentions.slice(0, 3).forEach((mention) => {
      const hotspot = KNOWN_HOTSPOTS[mention.toLowerCase()];
      if (
        hotspot &&
        (Math.abs(hotspot.lat - targetLocation.lat) > 0.05 ||
         Math.abs(hotspot.lon - targetLocation.lon) > 0.05)
      ) {
        annotations.push({
          type: 'label',
          latitude: hotspot.lat,
          longitude: hotspot.lon,
          label: `MENTION: ${mention.toUpperCase()}`.slice(0, 110),
          color: 'cyan',
        });
      }
    });
  }

  const camera: GevCamera = {
    lat: targetLocation.lat,
    lon: targetLocation.lon,
    altitude_m: targetLocation.altitude_m || 500_000,
    pitch_deg: targetLocation.pitch_deg || -50,
    heading_deg: targetLocation.heading_deg || 0,
  };

  return {
    camera,
    layers,
    style,
    map: 'photoreal',
    annotations,
  };
}
