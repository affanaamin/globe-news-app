import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  KNOWN_HOTSPOTS, 
  PAKISTAN_STRATEGIC_POINTS, 
  searchPakistanHotspots, 
  buildHotspotReconView,
  buildProvinceReconView,
  buildArticleReconView,
  getKnownHotspot,
  CPEC_ROUTE_WAYPOINTS,
  CPEC_ROUTE_ANNOTATION,
  GWADAR_MARITIME_CORRIDOR_ANNOTATION,
  KARACHI_COASTAL_CORRIDOR_ANNOTATION,
  PAKISTAN_PROVINCIAL_ZONE_ANNOTATIONS,
  getPakistanTacticalAnnotations,
  isPakistanLocation
} from '../utils/reconDispatch.ts';
import { 
  PAKISTAN_RADIO_STATIONS, 
  getStationsForProvince, 
  searchRadioStations 
} from '../utils/radioStations.ts';
import { 
  isMasterMuted, 
  setMasterMute, 
  toggleMasterMute, 
  subscribeMasterMute,
  playRadarPing,
  playScannerClick,
  playTargetLockSound,
  startTelemetryHum,
  stopTelemetryHum,
  isTelemetryHumActive
} from '../utils/audio.ts';
import { createView } from '../gods-eye-view/src/view/index.js';

test('Pakistani strategic cities, ports, dams, and checkpoints are mapped with high precision coordinates', () => {
  const requiredHotspots = [
    'islamabad',
    'karachi',
    'lahore',
    'rawalpindi',
    'peshawar',
    'quetta',
    'gwadar',
    'gwadar port',
    'gilgit',
    'muzaffarabad',
    'faisalabad',
    'multan',
    'sialkot',
    'hyderabad',
    'sukkur',
    'chaman border',
    'torkham',
    'tarbela dam',
    'mangla dam',
    'port qasim',
    'khunjerab pass',
    'siachen glacier',
    'skardu',
    'ormara'
  ];

  for (const name of requiredHotspots) {
    const coords = KNOWN_HOTSPOTS[name] || getKnownHotspot(name);
    assert.ok(coords, `Hotspot "${name}" should exist in KNOWN_HOTSPOTS registry`);
    assert.equal(typeof coords.lat, 'number', `Latitude for ${name} must be numeric`);
    assert.equal(typeof coords.lon, 'number', `Longitude for ${name} must be numeric`);
    assert.ok(coords.lat >= 23 && coords.lat <= 38, `Latitude for ${name} (${coords.lat}) should be within Pakistan latitude range`);
    assert.ok(coords.lon >= 60 && coords.lon <= 78, `Longitude for ${name} (${coords.lon}) should be within Pakistan longitude range`);
    assert.ok((coords.altitude_m || 0) > 0, `Altitude for ${name} must be positive`);
  }
});

test('PAKISTAN_STRATEGIC_POINTS registry is well-formed with categories and descriptions', () => {
  assert.ok(PAKISTAN_STRATEGIC_POINTS.length >= 20, 'Should have at least 20 strategic checkpoints');

  for (const pt of PAKISTAN_STRATEGIC_POINTS) {
    assert.ok(pt.id, 'Point must have id');
    assert.ok(pt.name, 'Point must have name');
    assert.ok(pt.displayName, 'Point must have displayName');
    assert.ok(pt.category, 'Point must have category');
    assert.ok(pt.province, 'Point must have province');
    assert.ok(pt.coords.lat && pt.coords.lon, 'Point must have valid coordinates');
    assert.ok(Array.isArray(pt.keywords) && pt.keywords.length > 0, 'Point must have keywords');
    assert.ok(pt.description.length > 10, 'Point must have description');
  }
});

test('searchPakistanHotspots resolves queries by city, category, province, and strategic keywords', () => {
  // By city
  const gwadar = searchPakistanHotspots('Gwadar');
  assert.ok(gwadar.length > 0);
  assert.ok(gwadar.some(g => g.name.includes('gwadar')));

  // By province
  const balochistan = searchPakistanHotspots('Balochistan');
  assert.ok(balochistan.length >= 3);
  assert.ok(balochistan.some(b => b.name === 'quetta'));
  assert.ok(balochistan.some(b => b.name.includes('gwadar')));
  assert.ok(balochistan.some(b => b.name.includes('chaman')));

  // By category
  const borderPoints = searchPakistanHotspots('Border Crossing');
  assert.ok(borderPoints.length >= 3);
  assert.ok(borderPoints.some(b => b.name.includes('torkham')));
  assert.ok(borderPoints.some(b => b.name.includes('chaman')));

  // By infrastructure keywords
  const dams = searchPakistanHotspots('dam');
  assert.ok(dams.length >= 2);
  assert.ok(dams.some(d => d.name.includes('tarbela')));
  assert.ok(dams.some(d => d.name.includes('mangla')));

  // Empty query returns empty array
  assert.deepEqual(searchPakistanHotspots(''), []);
  assert.deepEqual(searchPakistanHotspots('   '), []);
});

test('buildHotspotReconView produces valid GEV schema with appropriate style and layers', () => {
  const torkham = PAKISTAN_STRATEGIC_POINTS.find(p => p.name.includes('torkham'));
  assert.ok(torkham);
  const borderView = buildHotspotReconView(torkham);

  assert.equal(borderView.style, 'surveillance');
  assert.ok(borderView.layers.includes('military'));
  assert.equal(borderView.annotations[0].color, 'red');
  assert.ok(createView(borderView), 'GEV validator accepts border view');

  const gwadar = PAKISTAN_STRATEGIC_POINTS.find(p => p.name.includes('gwadar'));
  assert.ok(gwadar);
  const maritimeView = buildHotspotReconView(gwadar);

  assert.equal(maritimeView.style, 'retro');
  assert.ok(maritimeView.layers.includes('ais-live-vessels'));
  assert.equal(maritimeView.annotations[0].color, 'cyan');
  assert.ok(createView(maritimeView), 'GEV validator accepts maritime view');

  const tarbela = PAKISTAN_STRATEGIC_POINTS.find(p => p.name.includes('tarbela'));
  assert.ok(tarbela);
  const damView = buildHotspotReconView(tarbela);

  assert.equal(damView.style, 'thermal');
  assert.ok(damView.layers.includes('local-dams'));
  assert.equal(damView.annotations[0].color, 'amber');
  assert.ok(createView(damView), 'GEV validator accepts dam view');
});

test('PAKISTAN_RADIO_STATIONS catalog contains verified HTTPS streams across all regions including CityFM89 and FM 100', () => {
  assert.ok(PAKISTAN_RADIO_STATIONS.length >= 12);
  assert.ok(PAKISTAN_RADIO_STATIONS.some(s => s.id === 'cityfm89-national'), 'Must include CityFM89');
  assert.ok(PAKISTAN_RADIO_STATIONS.some(s => s.id === 'fm100-pakistan'), 'Must include FM 100 Pakistan');

  for (const station of PAKISTAN_RADIO_STATIONS) {
    assert.ok(station.id);
    assert.ok(station.name);
    assert.ok(station.callsign);
    assert.ok(station.frequency);
    assert.ok(station.location);
    assert.ok(station.province);
    assert.ok(
      station.streamUrl.startsWith('https://') || station.streamUrl.startsWith('/api/'),
      `Stream URL for ${station.name} (${station.streamUrl}) must be HTTPS or secure relative proxy`
    );
    assert.equal(station.isVerified, true);
  }
});

test('getStationsForProvince correctly prioritizes regional broadcasts for active province', () => {
  // Sindh prioritization
  const sindhStations = getStationsForProvince('Sindh');
  assert.ok(sindhStations[0].province === 'Sindh' || sindhStations[0].location === 'Karachi');

  // Punjab prioritization
  const punjabStations = getStationsForProvince('Punjab');
  assert.ok(punjabStations[0].province === 'Punjab');
  assert.ok(punjabStations.some(s => s.location === 'Lahore'));

  // KPK prioritization
  const kpkStations = getStationsForProvince('Khyber Pakhtunkhwa');
  assert.ok(kpkStations[0].province.includes('Khyber Pakhtunkhwa'));
  assert.equal(kpkStations[0].location, 'Peshawar');

  // Balochistan prioritization
  const balochistanStations = getStationsForProvince('Balochistan');
  assert.ok(balochistanStations[0].province.includes('Balochistan'));
  assert.equal(balochistanStations[0].location, 'Quetta');

  // Azad Kashmir prioritization
  const ajkStations = getStationsForProvince('Azad Kashmir');
  assert.ok(ajkStations[0].province.includes('Azad Kashmir'));

  // Null province returns all stations
  const allStations = getStationsForProvince(null);
  assert.equal(allStations.length, PAKISTAN_RADIO_STATIONS.length);
});

test('searchRadioStations filters stations by keyword, city, frequency, and callsign', () => {
  const pbc = searchRadioStations('PBC');
  assert.ok(pbc.length >= 5);

  const lahore = searchRadioStations('Lahore');
  assert.ok(lahore.some(s => s.name.includes('Lahore')));

  const karachi = searchRadioStations('Karachi');
  assert.ok(karachi.some(s => s.location === 'Karachi'));

  const fm101 = searchRadioStations('101');
  assert.ok(fm101.length >= 2);
});

test('Audio utilities master mute and tactical sound triggers execute safely in server/node environment', () => {
  // Test master mute toggle and subscription
  let notifiedState = null;
  const unsubscribe = subscribeMasterMute((muted) => {
    notifiedState = muted;
  });

  setMasterMute(true);
  assert.equal(isMasterMuted(), true);
  assert.equal(notifiedState, true);

  const toggled = toggleMasterMute();
  assert.equal(toggled, false);
  assert.equal(isMasterMuted(), false);
  assert.equal(notifiedState, false);

  unsubscribe();

  // Test that audio methods do not crash when window/AudioContext is not present
  assert.doesNotThrow(() => {
    playRadarPing();
    playScannerClick();
    playTargetLockSound();
    startTelemetryHum();
    stopTelemetryHum();
    startTelemetryHum();
    stopTelemetryHum();
    isTelemetryHumActive();
  });
});

test('Cinematic 3D camera angles and oblique pitch/heading perspectives are tuned for Pakistani landmarks', () => {
  // 1. Islamabad: Low-altitude looking North toward Margalla Hills
  const isb = KNOWN_HOTSPOTS['islamabad'];
  assert.ok(isb);
  assert.equal(isb.altitude_m, 2800);
  assert.equal(isb.pitch_deg, -20);
  assert.equal(isb.heading_deg, 0);

  // 2. Gwadar: Ocean-level looking across Hammerhead peninsula toward deep-sea berths
  const gwd = KNOWN_HOTSPOTS['gwadar'];
  assert.ok(gwd);
  assert.equal(gwd.altitude_m, 2200);
  assert.equal(gwd.pitch_deg, -18);
  assert.equal(gwd.heading_deg, 45);

  // 3. K2 & Baltoro Glacier: High-altitude looking down Baltoro toward K2 summit pyramid
  const k2 = KNOWN_HOTSPOTS['k2'];
  assert.ok(k2);
  assert.equal(k2.altitude_m, 9500);
  assert.equal(k2.pitch_deg, -24);
  assert.equal(k2.heading_deg, 25);

  const baltoro = KNOWN_HOTSPOTS['baltoro'];
  assert.ok(baltoro);
  assert.equal(baltoro.altitude_m, 9500);
  assert.equal(baltoro.pitch_deg, -24);

  // 4. Karachi: Arabian Sea surveillance angle across Clifton Beach and Port Qasim
  const khi = KNOWN_HOTSPOTS['karachi'];
  assert.ok(khi);
  assert.equal(khi.altitude_m, 3500);
  assert.equal(khi.pitch_deg, -28);
  assert.equal(khi.heading_deg, 330);

  // 5. Tarbela & Mangla Dams: Hydraulic angles looking across spillways into reservoir basins
  const tarbela = KNOWN_HOTSPOTS['tarbela dam'];
  assert.ok(tarbela);
  assert.equal(tarbela.altitude_m, 3200);
  assert.equal(tarbela.pitch_deg, -22);
  assert.equal(tarbela.heading_deg, 50);

  const mangla = KNOWN_HOTSPOTS['mangla dam'];
  assert.ok(mangla);
  assert.equal(mangla.altitude_m, 3000);
  assert.equal(mangla.pitch_deg, -20);
  assert.equal(mangla.heading_deg, 40);

  // 6. Mountain pass corridors: Khunjerab, Torkham, Chaman
  const khunjerab = KNOWN_HOTSPOTS['khunjerab pass'];
  assert.ok(khunjerab);
  assert.equal(khunjerab.altitude_m, 5800);
  assert.equal(khunjerab.pitch_deg, -25);
  assert.equal(khunjerab.heading_deg, 15);

  const torkham = KNOWN_HOTSPOTS['torkham'];
  assert.ok(torkham);
  assert.equal(torkham.altitude_m, 2600);
  assert.equal(torkham.pitch_deg, -22);
  assert.equal(torkham.heading_deg, 290);

  const chaman = KNOWN_HOTSPOTS['chaman'];
  assert.ok(chaman);
  assert.equal(chaman.altitude_m, 3000);
  assert.equal(chaman.pitch_deg, -22);
  assert.equal(chaman.heading_deg, 315);

  // K2 point in strategic points catalog
  const k2Point = PAKISTAN_STRATEGIC_POINTS.find(p => p.id === 'pk-k2');
  assert.ok(k2Point, 'K2 must be in PAKISTAN_STRATEGIC_POINTS');
  assert.equal(k2Point.coords.altitude_m, 9500);
  assert.equal(k2Point.coords.pitch_deg, -24);
  assert.equal(k2Point.coords.heading_deg, 25);
});

test('Glowing 3D CPEC Route vectors and maritime/border corridors are valid and adhere to GEV schema', () => {
  // Import symbols dynamically or verify exported CPEC route
  assert.ok(Array.isArray(CPEC_ROUTE_WAYPOINTS), 'CPEC_ROUTE_WAYPOINTS must be an array');
  assert.equal(CPEC_ROUTE_WAYPOINTS.length, 6, 'CPEC route should connect 6 primary waypoints from Khunjerab to Gwadar');

  // Verify waypoints trace Khunjerab -> Gilgit -> Islamabad -> Multan -> Sukkur -> Gwadar
  const [khunjerabWp, gilgitWp, isbWp, multanWp, sukkurWp, gwadarWp] = CPEC_ROUTE_WAYPOINTS;
  assert.ok(khunjerabWp.latitude > 36 && khunjerabWp.longitude > 75, 'Waypoint 1 is Khunjerab Pass');
  assert.ok(gilgitWp.latitude > 35 && gilgitWp.longitude > 74, 'Waypoint 2 is Gilgit');
  assert.ok(isbWp.latitude > 33 && isbWp.longitude > 72, 'Waypoint 3 is Islamabad');
  assert.ok(multanWp.latitude > 30 && multanWp.longitude > 71, 'Waypoint 4 is Multan');
  assert.ok(sukkurWp.latitude > 27 && sukkurWp.longitude > 68, 'Waypoint 5 is Sukkur');
  assert.ok(gwadarWp.latitude > 25 && gwadarWp.longitude > 62, 'Waypoint 6 is Gwadar Port');

  // Annotation validation
  assert.equal(CPEC_ROUTE_ANNOTATION.type, 'route');
  assert.equal(CPEC_ROUTE_ANNOTATION.color, 'cyan');
  assert.ok(CPEC_ROUTE_ANNOTATION.label.includes('CPEC'));

  // Corridors
  assert.equal(GWADAR_MARITIME_CORRIDOR_ANNOTATION.type, 'highlight');
  assert.equal(GWADAR_MARITIME_CORRIDOR_ANNOTATION.color, 'cyan');
  assert.equal(KARACHI_COASTAL_CORRIDOR_ANNOTATION.type, 'highlight');
  assert.equal(KARACHI_COASTAL_CORRIDOR_ANNOTATION.color, 'cyan');

  // getPakistanTacticalAnnotations produces valid annotations
  const gwdTactical = getPakistanTacticalAnnotations({ targetId: 'pk-gwd', targetCategory: 'Port & Maritime' });
  assert.ok(gwdTactical.some(a => a.type === 'route'), 'Includes CPEC route');
  assert.ok(gwdTactical.some(a => a.label?.includes('GWADAR')), 'Includes Gwadar anchorage highlight');

  const khiTactical = getPakistanTacticalAnnotations({ targetId: 'pk-khi', targetCategory: 'Port & Maritime' });
  assert.ok(khiTactical.some(a => a.label?.includes('KARACHI')), 'Includes Karachi coastal highlight');

  // Location detection
  assert.equal(isPakistanLocation('Islamabad'), true);
  assert.equal(isPakistanLocation('Gwadar Port'), true);
  assert.equal(isPakistanLocation('K2 Summit'), true);
  assert.equal(isPakistanLocation('Balochistan Province'), true);
  assert.equal(isPakistanLocation('Tokyo, Japan'), false);

  // Full view integration test with GEV validator
  const hotspot = PAKISTAN_STRATEGIC_POINTS.find(p => p.id === 'pk-gwd');
  const view = buildHotspotReconView(hotspot);
  const validated = createView(view);
  assert.ok(validated, 'GEV createView validator approves view with 3D CPEC route and maritime highlight');
  assert.ok(validated.annotations.length >= 3, 'Contains pin, hotspot highlight, and CPEC route annotation');
});

test('GEV viewer and scene configure terrain exaggeration 1.25, enableLighting, and atmospheric fog', async () => {
  const viewerJs = await import('node:fs').then(fs => 
    fs.readFileSync(new URL('../gods-eye-view/src/app/viewer.js', import.meta.url), 'utf8')
  );
  assert.ok(viewerJs.includes('terrainExaggeration: 1.25'), 'viewer.js must set terrainExaggeration: 1.25');
  assert.ok(viewerJs.includes('viewer.scene.globe.enableLighting = true'), 'viewer.js must set enableLighting = true');
  assert.ok(viewerJs.includes('viewer.scene.globe.terrainExaggeration = 1.25'), 'viewer.js must set globe.terrainExaggeration = 1.25');
  assert.ok(viewerJs.includes('viewer.scene.fog.enabled = true'), 'viewer.js must enable atmospheric fog');

  const sceneJs = await import('node:fs').then(fs => 
    fs.readFileSync(new URL('../gods-eye-view/src/app/scene.js', import.meta.url), 'utf8')
  );
  assert.ok(sceneJs.includes('viewer.scene.globe.enableLighting = true'), 'scene.js must configure dynamic lighting');
  assert.ok(sceneJs.includes('viewer.scene.globe.terrainExaggeration = 1.25'), 'scene.js must configure terrain exaggeration');

  const buildGev = await import('node:fs').then(fs => 
    fs.readFileSync(new URL('../scripts/build-gev.mjs', import.meta.url), 'utf8')
  );
  assert.ok(buildGev.includes('CESIUM_ION_TOKEN'), 'build-gev.mjs must pass CESIUM_ION_TOKEN');
  assert.ok(buildGev.includes('GOOGLE_MAPS_API_KEY'), 'build-gev.mjs must pass GOOGLE_MAPS_API_KEY');
});

test('PAKISTAN_PROVINCIAL_ZONE_ANNOTATIONS covers all 7 provinces and territories', () => {
  const provinces = [
    'balochistan',
    'sindh',
    'punjab',
    'khyber pakhtunkhwa',
    'gilgit-baltistan',
    'azad kashmir',
    'islamabad capital territory'
  ];

  for (const prov of provinces) {
    const anno = PAKISTAN_PROVINCIAL_ZONE_ANNOTATIONS[prov];
    assert.ok(anno, `Must have zone highlight annotation for ${prov}`);
    assert.equal(anno.type, 'highlight');
    assert.ok(typeof anno.latitude === 'number' && anno.latitude > 20 && anno.latitude < 38);
    assert.ok(typeof anno.longitude === 'number' && anno.longitude > 60 && anno.longitude < 78);
    assert.ok(anno.label?.length && anno.label.length <= 120);
  }
});

test('buildProvinceReconView produces valid GEV schema with CPEC route vector and provincial zone highlights', () => {
  const provinces = [
    'Balochistan',
    'Sindh',
    'Punjab',
    'Khyber Pakhtunkhwa',
    'Gilgit-Baltistan',
    'Azad Kashmir',
    'Islamabad Capital Territory'
  ];

  for (const prov of provinces) {
    const view = buildProvinceReconView(prov);
    assert.ok(view);
    assert.ok(view.camera.lat >= 23 && view.camera.lat <= 38, `Valid latitude for ${prov}`);
    assert.ok(view.camera.lon >= 60 && view.camera.lon <= 78, `Valid longitude for ${prov}`);
    assert.ok(view.camera.altitude_m && view.camera.altitude_m >= 150_000, `High altitude perspective for ${prov}`);
    assert.ok(view.camera.pitch_deg && view.camera.pitch_deg <= -40, `Oblique perspective for ${prov}`);

    // Must include CPEC route annotation
    assert.ok(
      view.annotations?.some(a => a.type === 'route' && a.label?.includes('CPEC')),
      `Province ${prov} view must include CPEC route vector`
    );

    // Must include provincial zone highlight
    assert.ok(
      view.annotations?.some(a => a.type === 'highlight' && (a.label?.includes('PROVINCE') || a.label?.includes('CAPITAL'))),
      `Province ${prov} view must include provincial zone highlight`
    );

    // Schema validation
    const validated = createView(view);
    assert.ok(validated, `GEV schema validation succeeds for ${prov}`);
  }
});

test('buildArticleReconView prioritizes specific landmarks without being shadowed by "Pakistan" in headlines', () => {
  // 1. Gwadar Port mentioned alongside Pakistan
  const gwdView = buildArticleReconView({
    title: 'Pakistan Navy commissions advanced naval surveillance craft at Gwadar Port',
    country: 'Pakistan',
  });
  assert.equal(gwdView.camera.lat, KNOWN_HOTSPOTS['gwadar'].lat, 'Must target Gwadar lat');
  assert.equal(gwdView.camera.lon, KNOWN_HOTSPOTS['gwadar'].lon, 'Must target Gwadar lon');
  assert.equal(gwdView.camera.altitude_m, 2200, 'Must use tuned 2,200m Gwadar altitude');
  assert.equal(gwdView.camera.pitch_deg, -18, 'Must use tuned -18° Gwadar pitch');
  assert.equal(gwdView.camera.heading_deg, 45, 'Must use tuned 45° Gwadar heading');
  assert.ok(gwdView.annotations?.some(a => a.label?.includes('GWADAR')), 'Includes Gwadar maritime highlight');

  // 2. Islamabad mentioned alongside Pakistan
  const isbView = buildArticleReconView({
    title: 'Federal government convenes bilateral summit in Islamabad, Pakistan',
    country: 'Pakistan',
  });
  assert.equal(isbView.camera.lat, KNOWN_HOTSPOTS['islamabad'].lat, 'Must target Islamabad lat');
  assert.equal(isbView.camera.lon, KNOWN_HOTSPOTS['islamabad'].lon, 'Must target Islamabad lon');
  assert.equal(isbView.camera.altitude_m, 2800, 'Must use tuned 2,800m Islamabad Margalla altitude');
  assert.equal(isbView.camera.pitch_deg, -20, 'Must use tuned -20° Islamabad pitch');

  // 3. Tarbela Dam mentioned alongside Pakistan
  const trbView = buildArticleReconView({
    title: 'Water flow reaches seasonal capacity at Tarbela Dam in northern Pakistan',
    country: 'Pakistan',
  });
  assert.equal(trbView.camera.lat, KNOWN_HOTSPOTS['tarbela dam'].lat, 'Must target Tarbela Dam lat');
  assert.equal(trbView.camera.altitude_m, 3200, 'Must use tuned 3,200m Tarbela altitude');
  assert.equal(trbView.camera.pitch_deg, -22, 'Must use tuned -22° Tarbela pitch');

  // 4. K2 summit mentioned alongside Pakistan
  const k2View = buildArticleReconView({
    title: 'Mountaineering expedition establishes high camp below K2 summit in Pakistan',
    country: 'Pakistan',
  });
  assert.equal(k2View.camera.lat, KNOWN_HOTSPOTS['k2'].lat, 'Must target K2 lat');
  assert.equal(k2View.camera.altitude_m, 9500, 'Must use tuned 9,500m K2/Baltoro altitude');
  assert.equal(k2View.camera.pitch_deg, -24, 'Must use tuned -24° K2 pitch');
  assert.equal(k2View.camera.heading_deg, 25, 'Must use tuned 25° K2 heading');

  // 5. Generic Pakistan headline with no specific landmark targets country overview
  const pkOverview = buildArticleReconView({
    title: 'Pakistan hosts international digital economic forum',
    country: 'Pakistan',
  });
  assert.equal(pkOverview.camera.lat, KNOWN_HOTSPOTS['pakistan'].lat, 'Must target Pakistan country center');
  assert.equal(pkOverview.camera.altitude_m, KNOWN_HOTSPOTS['pakistan'].altitude_m, 'Must use high strategic altitude');
  assert.ok(pkOverview.annotations?.some(a => a.type === 'route'), 'Includes 3D CPEC vector artery');
});

test('Gods Eye View defaults directly to Pakistan strategic vantage with Sentinel-2 basemap', async () => {
  const { DEFAULT_PAKISTAN_CAMERA, buildDefaultPakistanReconView, getPakistanTacticalAnnotations } = await import('../utils/reconDispatch.ts');
  const { createView } = await import('../gods-eye-view/src/view/index.js');
  const { CAMERA_PRESETS, flyToPakistan } = await import('../gods-eye-view/src/camera.js');
  const { MAP_STACKS } = await import('../gods-eye-view/src/maps/catalog.js');
  const { createDefaultMapSources } = await import('../gods-eye-view/src/maps/defaultSources.js');
  const { createSentinelImagery, SENTINEL_ATTRIBUTION_HTML } = await import('../gods-eye-view/src/maps/imagery.js');
  const { GEV_AVAILABLE_MAPS } = await import('../types/gev.ts');

  // 1. Verify DEFAULT_PAKISTAN_CAMERA specifications
  assert.equal(DEFAULT_PAKISTAN_CAMERA.lat, 30.3753);
  assert.equal(DEFAULT_PAKISTAN_CAMERA.lon, 69.3451);
  assert.equal(DEFAULT_PAKISTAN_CAMERA.altitude_m, 1600000);
  assert.equal(DEFAULT_PAKISTAN_CAMERA.heading_deg, 0);
  assert.equal(DEFAULT_PAKISTAN_CAMERA.pitch_deg, -55);

  const directTactical = getPakistanTacticalAnnotations({ includeCpec: true });
  assert.ok(directTactical.length >= 8, 'getPakistanTacticalAnnotations with includeCpec yields CPEC route and all provincial zones');

  // 2. Verify buildDefaultPakistanReconView payload
  const defaultView = buildDefaultPakistanReconView();
  assert.deepEqual(defaultView.camera, DEFAULT_PAKISTAN_CAMERA);
  assert.deepEqual(defaultView.layers, ['flights', 'ais-live-vessels', 'earthquakes']);
  assert.equal(defaultView.map, 'sentinel-2');
  assert.equal(defaultView.style, 'normal');

  // Verify pre-warmed tactical annotations: CPEC route + all provincial zones
  assert.ok(defaultView.annotations.some(a => a.type === 'route' && a.label?.includes('CPEC')), 'Pre-warmed with CPEC route');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('BALOCHISTAN')), 'Includes Balochistan provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('SINDH')), 'Includes Sindh provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('PUNJAB')), 'Includes Punjab provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('KHYBER PAKHTUNKHWA')), 'Includes KPK provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('GILGIT-BALTISTAN')), 'Includes GB provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('AZAD KASHMIR')), 'Includes AJK provincial highlight');
  assert.ok(defaultView.annotations.some(a => a.label?.includes('ISLAMABAD')), 'Includes ICT provincial highlight');

  // 3. Schema validation with GEV's createView
  const validated = createView(defaultView);
  assert.ok(validated, 'createView must accept default Pakistan view');
  assert.equal(validated.map, 'sentinel-2', 'createView preserves sentinel-2 map stack');
  assert.equal(validated.camera.altitude_m, 1600000);

  // 4. GEV standalone camera presets
  assert.ok(CAMERA_PRESETS.pakistan, 'CAMERA_PRESETS must include pakistan');
  assert.equal(typeof flyToPakistan, 'function', 'camera.js must export flyToPakistan');

  // 5. Sentinel-2 catalog & keyless default source verification
  const sentinelStack = MAP_STACKS.find(s => s.id === 'sentinel-2');
  assert.ok(sentinelStack, 'MAP_STACKS must contain sentinel-2');
  assert.equal(sentinelStack.label, 'Sentinel-2 (ESA)');
  assert.equal(sentinelStack.shortLabel, 'Sentinel');
  assert.equal(sentinelStack.kind, 'sentinel-2');
  assert.equal(sentinelStack.requiresIon, false);

  assert.ok(GEV_AVAILABLE_MAPS.includes('sentinel-2'), 'types/gev.ts must export sentinel-2 in GEV_AVAILABLE_MAPS');

  // Keyless default must be sentinel-2 (not esri-imagery or Texas)
  const keylessSources = createDefaultMapSources();
  assert.equal(keylessSources.defaultId, 'sentinel-2', 'Keyless defaultId must be sentinel-2 for fresh imagery');
  assert.equal(keylessSources.unknownId, 'sentinel-2', 'Keyless unknownId must fall back to sentinel-2');
  assert.equal(keylessSources.recoveryId, 'esri-imagery', 'Keyless recoveryId must fall back to esri-imagery');
  const sentinelSource = keylessSources.sources.find(s => s.descriptor.id === 'sentinel-2');
  assert.ok(sentinelSource, 'Keyless sources must include sentinel-2 source');
  assert.equal(sentinelSource.available, true, 'Sentinel-2 must be available keylessly');
  assert.ok(sentinelSource.constructionFallback, 'Sentinel-2 must have construction fallback to esri-imagery');
  assert.equal(sentinelSource.constructionFallback.id, 'esri-imagery');

  // Credentialed mode sets photoreal as defaultId
  const keyedSources = createDefaultMapSources({ googleTileset: { show: true } });
  assert.equal(keyedSources.defaultId, 'photoreal', 'Keyed defaultId remains photoreal 3D');
  assert.equal(keyedSources.unknownId, 'photoreal', 'Keyed unknownId remains photoreal');
  assert.equal(keyedSources.recoveryId, 'photoreal', 'Keyed recoveryId remains photoreal');

  // Verify Sentinel imagery factory
  assert.ok(SENTINEL_ATTRIBUTION_HTML.includes('Sentinel-2 cloudless'));
  assert.equal(typeof createSentinelImagery, 'function');
  const provider = createSentinelImagery();
  assert.ok(provider, 'createSentinelImagery must construct a valid provider');
  assert.ok(provider.url.includes('s2cloudless'), 'Provider URL must target EOX Sentinel-2 cloudless mosaic');
  assert.equal(provider.maximumLevel, 18, 'Must configure maximumLevel 18 for EOX WMTS pyramid');
});


