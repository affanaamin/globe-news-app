import type { GevAnnotation, GevAnnotationColor, GevCamera, GevStyle, GevView } from '../types/gev';

export interface LocationCoordinates {
  lat: number;
  lon: number;
  altitude_m?: number;
  pitch_deg?: number;
  heading_deg?: number;
}

export interface PakistanStrategicPoint {
  id: string;
  name: string;
  displayName: string;
  category: 'Strategic City' | 'Port & Maritime' | 'Border Crossing' | 'Critical Infrastructure' | 'Administrative Hub';
  province: string;
  coords: LocationCoordinates;
  keywords: string[];
  description: string;
}

export const KNOWN_HOTSPOTS: Record<string, LocationCoordinates> = {
  // Pakistan regions & cities - cinematic oblique angles and tuned altitude
  'pakistan': { lat: 30.3753, lon: 69.3451, altitude_m: 900_000, pitch_deg: -55, heading_deg: 0 },
  'islamabad': { lat: 33.6844, lon: 73.0479, altitude_m: 2800, pitch_deg: -20, heading_deg: 0 },
  'karachi': { lat: 24.8607, lon: 67.0011, altitude_m: 3500, pitch_deg: -28, heading_deg: 330 },
  'lahore': { lat: 31.5204, lon: 74.3587, altitude_m: 3800, pitch_deg: -25, heading_deg: 350 },
  'rawalpindi': { lat: 33.5973, lon: 73.0479, altitude_m: 3500, pitch_deg: -24, heading_deg: 10 },
  'peshawar': { lat: 34.0151, lon: 71.5249, altitude_m: 3600, pitch_deg: -22, heading_deg: 285 },
  'quetta': { lat: 30.1798, lon: 66.9750, altitude_m: 4200, pitch_deg: -24, heading_deg: 45 },
  'gwadar': { lat: 25.1264, lon: 62.3225, altitude_m: 2200, pitch_deg: -18, heading_deg: 45 },
  'gwadar port': { lat: 25.1264, lon: 62.3225, altitude_m: 2200, pitch_deg: -18, heading_deg: 45 },
  'gilgit': { lat: 35.9208, lon: 74.3083, altitude_m: 5500, pitch_deg: -22, heading_deg: 35 },
  'k2': { lat: 35.8810, lon: 76.5133, altitude_m: 9500, pitch_deg: -24, heading_deg: 25 },
  'baltoro': { lat: 35.7417, lon: 76.3500, altitude_m: 9500, pitch_deg: -24, heading_deg: 25 },
  'baltoro glacier': { lat: 35.7417, lon: 76.3500, altitude_m: 9500, pitch_deg: -24, heading_deg: 25 },
  'muzaffarabad': { lat: 34.3700, lon: 73.4711, altitude_m: 3600, pitch_deg: -22, heading_deg: 10 },
  'faisalabad': { lat: 31.4504, lon: 73.1350, altitude_m: 3600, pitch_deg: -25, heading_deg: 0 },
  'multan': { lat: 30.1575, lon: 71.5249, altitude_m: 3400, pitch_deg: -24, heading_deg: 20 },
  'sialkot': { lat: 32.4945, lon: 74.5229, altitude_m: 3200, pitch_deg: -22, heading_deg: 30 },
  'hyderabad': { lat: 25.3960, lon: 68.3578, altitude_m: 3200, pitch_deg: -22, heading_deg: 340 },
  'sukkur': { lat: 27.7052, lon: 68.8574, altitude_m: 2400, pitch_deg: -20, heading_deg: 75 },
  'chaman border': { lat: 30.9213, lon: 66.4522, altitude_m: 3000, pitch_deg: -22, heading_deg: 315 },
  'chaman': { lat: 30.9213, lon: 66.4522, altitude_m: 3000, pitch_deg: -22, heading_deg: 315 },
  'torkham': { lat: 34.1264, lon: 71.1006, altitude_m: 2600, pitch_deg: -22, heading_deg: 290 },
  'torkham border': { lat: 34.1264, lon: 71.1006, altitude_m: 2600, pitch_deg: -22, heading_deg: 290 },
  'tarbela dam': { lat: 34.0886, lon: 72.6975, altitude_m: 3200, pitch_deg: -22, heading_deg: 50 },
  'tarbela': { lat: 34.0886, lon: 72.6975, altitude_m: 3200, pitch_deg: -22, heading_deg: 50 },
  'mangla dam': { lat: 33.1436, lon: 73.6472, altitude_m: 3000, pitch_deg: -20, heading_deg: 40 },
  'mangla': { lat: 33.1436, lon: 73.6472, altitude_m: 3000, pitch_deg: -20, heading_deg: 40 },
  'port qasim': { lat: 24.7833, lon: 67.3500, altitude_m: 2800, pitch_deg: -20, heading_deg: 310 },
  'khunjerab pass': { lat: 36.8500, lon: 75.4278, altitude_m: 5800, pitch_deg: -25, heading_deg: 15 },
  'khunjerab': { lat: 36.8500, lon: 75.4278, altitude_m: 5800, pitch_deg: -25, heading_deg: 15 },
  'siachen': { lat: 35.4212, lon: 77.1095, altitude_m: 8500, pitch_deg: -26, heading_deg: 340 },
  'siachen glacier': { lat: 35.4212, lon: 77.1095, altitude_m: 8500, pitch_deg: -26, heading_deg: 340 },
  'skardu': { lat: 35.2971, lon: 75.6333, altitude_m: 5500, pitch_deg: -22, heading_deg: 30 },
  'ormara': { lat: 25.2078, lon: 64.6361, altitude_m: 2500, pitch_deg: -20, heading_deg: 20 },
  'pasni': { lat: 25.2631, lon: 63.4719, altitude_m: 2600, pitch_deg: -20, heading_deg: 15 },
  'bahawalpur': { lat: 29.3956, lon: 71.6836, altitude_m: 3600, pitch_deg: -22, heading_deg: 10 },
  'abbottabad': { lat: 34.1688, lon: 73.2215, altitude_m: 3200, pitch_deg: -22, heading_deg: 15 },
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

/**
 * Curated registry of Pakistan's major strategic cities, border corridors, deep-sea ports and dams
 */
export const PAKISTAN_STRATEGIC_POINTS: PakistanStrategicPoint[] = [
  {
    id: 'pk-isb',
    name: 'islamabad',
    displayName: 'Islamabad Capital District',
    category: 'Administrative Hub',
    province: 'Islamabad Capital Territory',
    coords: { lat: 33.6844, lon: 73.0479, altitude_m: 2800, pitch_deg: -20, heading_deg: 0 },
    keywords: ['capital', 'federal', 'diplomatic', 'presidency', 'parliament', 'margalla'],
    description: 'Federal capital looking North toward the Margalla Hills ridge command apparatus.',
  },
  {
    id: 'pk-khi',
    name: 'karachi',
    displayName: 'Karachi (Arabian Sea Metropolis)',
    category: 'Port & Maritime',
    province: 'Sindh',
    coords: { lat: 24.8607, lon: 67.0011, altitude_m: 3500, pitch_deg: -28, heading_deg: 330 },
    keywords: ['port', 'financial', 'stock exchange', 'maritime', 'arabian sea', 'clifton'],
    description: 'Arabian Sea coastal metropolis surveillance angle across Clifton Beach and harbor berths.',
  },
  {
    id: 'pk-lhe',
    name: 'lahore',
    displayName: 'Lahore (Punjab Capital)',
    category: 'Strategic City',
    province: 'Punjab',
    coords: { lat: 31.5204, lon: 74.3587, altitude_m: 3800, pitch_deg: -25, heading_deg: 350 },
    keywords: ['punjab', 'cultural', 'provincial capital', 'eastern border', 'corridor', 'walled city'],
    description: 'Cultural and political capital of Punjab, key eastern strategic hub and Ravi river corridor.',
  },
  {
    id: 'pk-rwp',
    name: 'rawalpindi',
    displayName: 'Rawalpindi (Military GHQ)',
    category: 'Administrative Hub',
    province: 'Punjab',
    coords: { lat: 33.5973, lon: 73.0479, altitude_m: 3500, pitch_deg: -24, heading_deg: 10 },
    keywords: ['ghq', 'defense', 'army', 'joint staff', 'nur khan airbase', 'cantonment'],
    description: 'General Headquarters (GHQ) command node and strategic logistics center.',
  },
  {
    id: 'pk-pew',
    name: 'peshawar',
    displayName: 'Peshawar (Frontier Gateway)',
    category: 'Strategic City',
    province: 'Khyber Pakhtunkhwa',
    coords: { lat: 34.0151, lon: 71.5249, altitude_m: 3600, pitch_deg: -22, heading_deg: 285 },
    keywords: ['khyber', 'kpk', 'frontier', 'northwestern corridor', 'bala hissar'],
    description: 'Capital of Khyber Pakhtunkhwa, historic trade gateway to Central Asia and Durand Line corridor.',
  },
  {
    id: 'pk-uet',
    name: 'quetta',
    displayName: 'Quetta (Balochistan Hub)',
    category: 'Strategic City',
    province: 'Balochistan',
    coords: { lat: 30.1798, lon: 66.9750, altitude_m: 4200, pitch_deg: -24, heading_deg: 45 },
    keywords: ['balochistan', 'bolan pass', 'command and staff college', 'plateau', 'chiltan'],
    description: 'Provincial capital of Balochistan looking northeast toward Chiltan & Zarghun mountain ridges.',
  },
  {
    id: 'pk-gwd',
    name: 'gwadar port',
    displayName: 'Gwadar Port (CPEC Terminus)',
    category: 'Port & Maritime',
    province: 'Balochistan',
    coords: { lat: 25.1264, lon: 62.3225, altitude_m: 2200, pitch_deg: -18, heading_deg: 45 },
    keywords: ['gwadar', 'deep sea port', 'cpec', 'arabian sea', 'naval', 'free zone', 'hammerhead'],
    description: 'Dramatic ocean-level view looking across the Hammerhead peninsula toward deep-sea berths.',
  },
  {
    id: 'pk-glt',
    name: 'gilgit',
    displayName: 'Gilgit (Karakoram Node)',
    category: 'Strategic City',
    province: 'Gilgit-Baltistan',
    coords: { lat: 35.9208, lon: 74.3083, altitude_m: 5500, pitch_deg: -22, heading_deg: 35 },
    keywords: ['karakoram', 'kkh', 'northern areas', 'himalaya', 'highland', 'confluence'],
    description: 'Administrative capital of Gilgit-Baltistan on the Karakoram Highway route looking toward mountain walls.',
  },
  {
    id: 'pk-k2',
    name: 'k2',
    displayName: 'K2 Summit & Baltoro Glacier',
    category: 'Critical Infrastructure',
    province: 'Gilgit-Baltistan',
    coords: { lat: 35.8810, lon: 76.5133, altitude_m: 9500, pitch_deg: -24, heading_deg: 25 },
    keywords: ['k2', 'baltoro', 'godwin austen', 'karakoram', 'glacier', '8611m', 'summit', 'concordia'],
    description: 'High-altitude panoramic view looking down the Baltoro Glacier toward K2 summit pyramid (8,611m).',
  },
  {
    id: 'pk-mzf',
    name: 'muzaffarabad',
    displayName: 'Muzaffarabad (AJK Capital)',
    category: 'Strategic City',
    province: 'Azad Kashmir',
    coords: { lat: 34.3700, lon: 73.4711, altitude_m: 3600, pitch_deg: -22, heading_deg: 10 },
    keywords: ['kashmir', 'ajk', 'jhelum', 'neelum', 'line of control'],
    description: 'Capital of Azad Jammu & Kashmir at confluence of Neelum and Jhelum river gorges.',
  },
  {
    id: 'pk-fsd',
    name: 'faisalabad',
    displayName: 'Faisalabad (Industrial Spine)',
    category: 'Strategic City',
    province: 'Punjab',
    coords: { lat: 31.4504, lon: 73.1350, altitude_m: 3600, pitch_deg: -25, heading_deg: 0 },
    keywords: ['textile', 'industry', 'manchester of pakistan', 'punjab'],
    description: 'Major industrial powerhouse, national textile manufacturing center.',
  },
  {
    id: 'pk-mux',
    name: 'multan',
    displayName: 'Multan (Southern Punjab)',
    category: 'Strategic City',
    province: 'Punjab',
    coords: { lat: 30.1575, lon: 71.5249, altitude_m: 3400, pitch_deg: -24, heading_deg: 20 },
    keywords: ['saints', 'agriculture', 'chenab', 'cotton', 'cpec motorway'],
    description: 'Historic city of saints and central nexus connecting Punjab with Sindh along CPEC M4/M5.',
  },
  {
    id: 'pk-skt',
    name: 'sialkot',
    displayName: 'Sialkot (Export & Aviation Hub)',
    category: 'Strategic City',
    province: 'Punjab',
    coords: { lat: 32.4945, lon: 74.5229, altitude_m: 3200, pitch_deg: -22, heading_deg: 30 },
    keywords: ['export', 'aviation', 'surgical', 'sports goods', 'international airport'],
    description: 'Dynamic export industrial corridor with private international cargo airport.',
  },
  {
    id: 'pk-hyd',
    name: 'hyderabad',
    displayName: 'Hyderabad (Lower Sindh)',
    category: 'Strategic City',
    province: 'Sindh',
    coords: { lat: 25.3960, lon: 68.3578, altitude_m: 3200, pitch_deg: -22, heading_deg: 340 },
    keywords: ['sindh', 'indus', 'kotri', 'm9 motorway', 'agricultural'],
    description: 'Second largest city of Sindh, agricultural and cultural hub on the Indus river basin.',
  },
  {
    id: 'pk-skr',
    name: 'sukkur',
    displayName: 'Sukkur (Indus Barrage Hub)',
    category: 'Critical Infrastructure',
    province: 'Sindh',
    coords: { lat: 27.7052, lon: 68.8574, altitude_m: 2400, pitch_deg: -20, heading_deg: 75 },
    keywords: ['barrage', 'indus', 'irrigation', 'cpec junction', 'waterway'],
    description: 'Site of landmark Sukkur Barrage, lifeline of Pakistan canal irrigation system and CPEC corridor.',
  },
  {
    id: 'pk-chm',
    name: 'chaman border',
    displayName: 'Chaman Border (Friendship Gate)',
    category: 'Border Crossing',
    province: 'Balochistan',
    coords: { lat: 30.9213, lon: 66.4522, altitude_m: 3000, pitch_deg: -22, heading_deg: 315 },
    keywords: ['chaman', 'durand line', 'kandahar', 'customs', 'spin boldak', 'border', 'khojak'],
    description: 'High-altitude mountain pass corridor perspective looking northwest toward Friendship Gate and Kandahar.',
  },
  {
    id: 'pk-trkh',
    name: 'torkham',
    displayName: 'Torkham Border (Khyber Pass)',
    category: 'Border Crossing',
    province: 'Khyber Pakhtunkhwa',
    coords: { lat: 34.1264, lon: 71.1006, altitude_m: 2600, pitch_deg: -22, heading_deg: 290 },
    keywords: ['torkham', 'khyber pass', 'jalalabad', 'transit', 'durand line', 'border'],
    description: 'Mountain pass corridor approach perspective looking west-northwest along the Khyber Pass rift.',
  },
  {
    id: 'pk-trb',
    name: 'tarbela dam',
    displayName: 'Tarbela Dam (Indus Reservoir)',
    category: 'Critical Infrastructure',
    province: 'Khyber Pakhtunkhwa',
    coords: { lat: 34.0886, lon: 72.6975, altitude_m: 3200, pitch_deg: -22, heading_deg: 50 },
    keywords: ['dam', 'hydroelectric', 'reservoir', 'indus', 'water security', 'megawatt', 'spillway'],
    description: 'Hydraulic angle looking across the massive spillways into the vast Indus reservoir basin.',
  },
  {
    id: 'pk-mng',
    name: 'mangla dam',
    displayName: 'Mangla Dam (Jhelum Basin)',
    category: 'Critical Infrastructure',
    province: 'Azad Kashmir',
    coords: { lat: 33.1436, lon: 73.6472, altitude_m: 3000, pitch_deg: -20, heading_deg: 40 },
    keywords: ['dam', 'jhelum', 'mirpur', 'hydropower', 'reservoir', 'water', 'spillway'],
    description: 'Hydraulic perspective looking across the spillways into the Jhelum reservoir basin.',
  },
  {
    id: 'pk-pqm',
    name: 'port qasim',
    displayName: 'Port Muhammad Bin Qasim',
    category: 'Port & Maritime',
    province: 'Sindh',
    coords: { lat: 24.7833, lon: 67.3500, altitude_m: 2800, pitch_deg: -20, heading_deg: 310 },
    keywords: ['port qasim', 'lng terminal', 'energy port', 'shipping', 'steel mill'],
    description: 'Deep-water energy terminal handling national LNG, petroleum, and maritime bulk trade.',
  },
  {
    id: 'pk-khj',
    name: 'khunjerab pass',
    displayName: 'Khunjerab Pass (Pak-China Border)',
    category: 'Border Crossing',
    province: 'Gilgit-Baltistan',
    coords: { lat: 36.8500, lon: 75.4278, altitude_m: 5800, pitch_deg: -25, heading_deg: 15 },
    keywords: ['khunjerab', 'china', 'karakoram highway', 'highest border', 'xinjiang', 'cpec'],
    description: 'Highest paved international border crossing at 4,693m with northern approach corridor perspective.',
  },
  {
    id: 'pk-scn',
    name: 'siachen glacier',
    displayName: 'Siachen Glacier Sector',
    category: 'Border Crossing',
    province: 'Gilgit-Baltistan',
    coords: { lat: 35.4212, lon: 77.1095, altitude_m: 8500, pitch_deg: -26, heading_deg: 340 },
    keywords: ['siachen', 'glacier', 'high altitude', 'karakoram', 'defense'],
    description: 'Strategic high-altitude Karakoram glacial defense zone oblique ridge perspective.',
  },
  {
    id: 'pk-skd',
    name: 'skardu',
    displayName: 'Skardu (Baltistan Gateway)',
    category: 'Strategic City',
    province: 'Gilgit-Baltistan',
    coords: { lat: 35.2971, lon: 75.6333, altitude_m: 5500, pitch_deg: -22, heading_deg: 30 },
    keywords: ['baltistan', 'k2', 'airport', 'shigar', 'indus valley'],
    description: 'Key mountain defense sector and staging gateway for northern Karakoram expeditions.',
  },
  {
    id: 'pk-orm',
    name: 'ormara',
    displayName: 'Ormara (Jinnah Naval Base)',
    category: 'Port & Maritime',
    province: 'Balochistan',
    coords: { lat: 25.2078, lon: 64.6361, altitude_m: 2500, pitch_deg: -20, heading_deg: 20 },
    keywords: ['jinnah naval base', 'navy', 'makran coast', 'submarine', 'coastal'],
    description: 'Strategic Pakistan Navy coastal operating base along the Makran Coastal Highway.',
  },
  {
    id: 'pk-abt',
    name: 'abbottabad',
    displayName: 'Abbottabad (Hazara Division)',
    category: 'Strategic City',
    province: 'Khyber Pakhtunkhwa',
    coords: { lat: 34.1688, lon: 73.2215, altitude_m: 3200, pitch_deg: -22, heading_deg: 15 },
    keywords: ['pma', 'kakul', 'military academy', 'hazara', 'galyat'],
    description: 'Home of Pakistan Military Academy (PMA) Kakul and Hazara division administrative hub.',
  },
];

/**
 * 3D CPEC logistics artery waypoints tracing the primary trade and energy corridor
 * from Khunjerab Pass at the Chinese border down to the Arabian Sea terminus at Gwadar.
 */
export const CPEC_ROUTE_WAYPOINTS = [
  { latitude: 36.8500, longitude: 75.4278 }, // 1. Khunjerab Pass (Pak-China border, 4,693m)
  { latitude: 35.9208, longitude: 74.3083 }, // 2. Gilgit (Karakoram Node)
  { latitude: 33.6844, longitude: 73.0479 }, // 3. Islamabad / Rawalpindi (Federal Command)
  { latitude: 30.1575, longitude: 71.5249 }, // 4. Multan (Central Punjab Nexus)
  { latitude: 27.7052, longitude: 68.8574 }, // 5. Sukkur (Indus Barrage / Sindh Highway)
  { latitude: 25.1264, longitude: 62.3225 }, // 6. Gwadar (Deep-Sea Port Terminus)
];

/**
 * Glowing 3D CPEC Route vector annotation for God's Eye View
 */
export const CPEC_ROUTE_ANNOTATION: GevAnnotation = {
  type: 'route',
  points: CPEC_ROUTE_WAYPOINTS,
  label: '[CPEC] KHUNJERAB-GWADAR LOGISTICS ARTERY',
  color: 'cyan',
};

/**
 * Gwadar Deep-Sea Anchorage maritime corridor highlight
 */
export const GWADAR_MARITIME_CORRIDOR_ANNOTATION: GevAnnotation = {
  type: 'highlight',
  latitude: 25.1264,
  longitude: 62.3225,
  label: '[MARITIME] GWADAR DEEP-SEA ANCHORAGE',
  color: 'cyan',
};

/**
 * Karachi Coastal Sector & Port Qasim maritime corridor highlight
 */
export const KARACHI_COASTAL_CORRIDOR_ANNOTATION: GevAnnotation = {
  type: 'highlight',
  latitude: 24.8607,
  longitude: 67.0011,
  label: '[MARITIME] KARACHI COASTAL CORRIDOR',
  color: 'cyan',
};

/**
 * Mountain pass border checkpoint annotations
 */
export const PAKISTAN_BORDER_HIGHLIGHT_ANNOTATIONS: Record<string, GevAnnotation> = {
  khunjerab: {
    type: 'highlight',
    latitude: 36.8500,
    longitude: 75.4278,
    label: '[BORDER] KHUNJERAB PASS CORRIDOR',
    color: 'red',
  },
  torkham: {
    type: 'highlight',
    latitude: 34.1264,
    longitude: 71.1006,
    label: '[BORDER] TORKHAM PASS CORRIDOR',
    color: 'red',
  },
  chaman: {
    type: 'highlight',
    latitude: 30.9213,
    longitude: 66.4522,
    label: '[BORDER] CHAMAN / KHOJAK CORRIDOR',
    color: 'red',
  },
};

/**
 * Determines whether a location string or point belongs to Pakistan
 */
export function isPakistanLocation(textOrPoint?: string | PakistanStrategicPoint | null): boolean {
  if (!textOrPoint) return false;
  if (typeof textOrPoint === 'object') return true;
  const q = textOrPoint.trim().toLowerCase();
  if (q.includes('pakistan')) return true;
  const pkKeys = [
    'islamabad', 'karachi', 'lahore', 'rawalpindi', 'peshawar', 'quetta',
    'gwadar', 'gilgit', 'muzaffarabad', 'faisalabad', 'multan', 'sialkot',
    'hyderabad', 'sukkur', 'chaman', 'torkham', 'tarbela', 'mangla',
    'khunjerab', 'siachen', 'skardu', 'k2', 'baltoro', 'punjab', 'sindh',
    'balochistan', 'khyber', 'kpk', 'azad kashmir', 'gilgit-baltistan', 'cpec'
  ];
  return pkKeys.some(k => q.includes(k));
}

/**
 * Generates supplementary glowing 3D tactical annotations for Pakistani points of interest
 */
export function getPakistanTacticalAnnotations(options?: {
  targetId?: string;
  targetCategory?: string;
  includeCpec?: boolean;
}): GevAnnotation[] {
  const annotations: GevAnnotation[] = [];
  const includeCpec = options?.includeCpec !== false;
  if (includeCpec) {
    annotations.push(CPEC_ROUTE_ANNOTATION);
  }

  const targetId = options?.targetId?.toLowerCase();
  if (targetId) {
    if (targetId.includes('gwd') || targetId.includes('gwadar')) {
      annotations.push(GWADAR_MARITIME_CORRIDOR_ANNOTATION);
    } else if (targetId.includes('khi') || targetId.includes('karachi') || targetId.includes('pqm')) {
      annotations.push(KARACHI_COASTAL_CORRIDOR_ANNOTATION);
    } else if (targetId.includes('khj') || targetId.includes('khunjerab')) {
      annotations.push(PAKISTAN_BORDER_HIGHLIGHT_ANNOTATIONS.khunjerab);
    } else if (targetId.includes('trkh') || targetId.includes('torkham')) {
      annotations.push(PAKISTAN_BORDER_HIGHLIGHT_ANNOTATIONS.torkham);
    } else if (targetId.includes('chm') || targetId.includes('chaman')) {
      annotations.push(PAKISTAN_BORDER_HIGHLIGHT_ANNOTATIONS.chaman);
    }
  }

  return annotations;
}

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
 * Searches Pakistan's strategic cities, ports, dams, and border crossings
 */
export function searchPakistanHotspots(query: string): PakistanStrategicPoint[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PAKISTAN_STRATEGIC_POINTS.filter((p) => {
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.province.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}

/**
 * Builds a God's Eye View payload optimized for a specific Pakistan strategic city or hotspot
 */
export function buildHotspotReconView(hotspot: PakistanStrategicPoint): GevView {
  let style: GevStyle = 'normal';
  let layers: string[] = ['flights', 'ais-live-vessels', 'satellites'];
  let pinColor: GevAnnotationColor = 'primary';

  if (hotspot.category === 'Border Crossing') {
    style = 'surveillance'; // Night vision tactical
    layers = ['military', 'military-installations', 'military-awareness', 'satellites', 'flights'];
    pinColor = 'red';
  } else if (hotspot.category === 'Port & Maritime') {
    style = 'retro'; // Tactical CRT green
    layers = ['ais-live-vessels', 'telegeography-submarine-cables', 'weather-radar', 'satellites'];
    pinColor = 'cyan';
  } else if (hotspot.category === 'Critical Infrastructure') {
    style = 'thermal'; // FLIR thermal
    layers = ['local-dams', 'earthquakes', 'local-firms', 'satellites'];
    pinColor = 'amber';
  } else if (hotspot.category === 'Administrative Hub') {
    style = 'normal';
    layers = ['flights', 'satellites', 'local-datacenters'];
    pinColor = 'green';
  }

  const annotations: GevAnnotation[] = [
    {
      type: 'pin',
      latitude: hotspot.coords.lat,
      longitude: hotspot.coords.lon,
      label: `[PK RECON] ${hotspot.displayName.toUpperCase()}`.slice(0, 110),
      color: pinColor,
    },
    {
      type: 'highlight',
      latitude: hotspot.coords.lat,
      longitude: hotspot.coords.lon,
      color: pinColor,
    },
    ...getPakistanTacticalAnnotations({ targetId: hotspot.id, targetCategory: hotspot.category }),
  ];

  const camera: GevCamera = {
    lat: hotspot.coords.lat,
    lon: hotspot.coords.lon,
    altitude_m: hotspot.coords.altitude_m || 40_000,
    pitch_deg: hotspot.coords.pitch_deg !== undefined ? hotspot.coords.pitch_deg : -45,
    heading_deg: hotspot.coords.heading_deg !== undefined ? hotspot.coords.heading_deg : 0,
  };

  return {
    camera,
    layers,
    style,
    map: 'photoreal',
    annotations,
  };
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

  // If targeting Pakistan, include 3D CPEC logistics artery and tactical corridors
  const isTargetingPakistan = 
    isPakistanLocation(country) ||
    isPakistanLocation(province) ||
    isPakistanLocation(detectedHotspotKey) ||
    isPakistanLocation(combinedText);

  if (isTargetingPakistan) {
    const pkAnnotations = getPakistanTacticalAnnotations({
      targetId: detectedHotspotKey || undefined,
      includeCpec: true,
    });
    annotations.push(...pkAnnotations);
  }

  const camera: GevCamera = {
    lat: targetLocation.lat,
    lon: targetLocation.lon,
    altitude_m: targetLocation.altitude_m || 500_000,
    pitch_deg: targetLocation.pitch_deg !== undefined ? targetLocation.pitch_deg : -50,
    heading_deg: targetLocation.heading_deg !== undefined ? targetLocation.heading_deg : 0,
  };

  return {
    camera,
    layers,
    style,
    map: 'photoreal',
    annotations,
  };
}
