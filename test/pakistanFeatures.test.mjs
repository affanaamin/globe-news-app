import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  KNOWN_HOTSPOTS, 
  PAKISTAN_STRATEGIC_POINTS, 
  searchPakistanHotspots, 
  buildHotspotReconView,
  getKnownHotspot 
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

test('PAKISTAN_RADIO_STATIONS catalog contains verified HTTPS streams across all regions', () => {
  assert.ok(PAKISTAN_RADIO_STATIONS.length >= 10);

  for (const station of PAKISTAN_RADIO_STATIONS) {
    assert.ok(station.id);
    assert.ok(station.name);
    assert.ok(station.callsign);
    assert.ok(station.frequency);
    assert.ok(station.location);
    assert.ok(station.province);
    assert.ok(station.streamUrl.startsWith('https://'), `Stream URL for ${station.name} must be HTTPS`);
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
    isTelemetryHumActive();
  });
});
