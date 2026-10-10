import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleReconView, KNOWN_HOTSPOTS, getKnownHotspot } from '../utils/reconDispatch.ts';
import { createView } from '../gods-eye-view/src/view/index.js';

test('buildArticleReconView handles empty inputs gracefully and complies with GEV createView', () => {
  const view = buildArticleReconView({
    title: '',
    country: 'Pakistan',
  });

  assert.ok(view);
  assert.ok(view.camera);
  assert.equal(typeof view.camera.lat, 'number');
  assert.equal(typeof view.camera.lon, 'number');
  assert.equal(view.map, 'photoreal');
  assert.ok(Array.isArray(view.layers));
  assert.ok(view.annotations.length > 0);

  // Validate that GEV's own schema validator accepts the view
  const validated = createView(view);
  assert.ok(validated);
  assert.equal(validated.camera.lat, view.camera.lat);
});

test('buildArticleReconView detects military / defense topics and assigns surveillance style and layers', () => {
  const view = buildArticleReconView({
    title: 'Missile Defense Systems deployed near border troops',
    description: 'Military forces increase combat readiness',
    country: 'Pakistan',
  });

  assert.equal(view.style, 'surveillance');
  assert.ok(view.layers.includes('military'));
  assert.ok(view.layers.includes('military-installations'));
  assert.equal(view.annotations[0].color, 'red');

  const validated = createView(view);
  assert.equal(validated.style, 'surveillance');
});

test('buildArticleReconView detects natural disasters and assigns thermal FLIR sensor mode', () => {
  const view = buildArticleReconView({
    title: 'Magnitude 6.2 Earthquake strikes northern region triggering landslide warnings',
    description: 'Severe disaster management teams respond',
    country: 'Pakistan',
  });

  assert.equal(view.style, 'thermal');
  assert.ok(view.layers.includes('earthquakes'));
  assert.ok(view.layers.includes('local-firms'));
  assert.equal(view.annotations[0].color, 'amber');

  const validated = createView(view);
  assert.equal(validated.style, 'thermal');
});

test('buildArticleReconView detects maritime topics and assigns retro CRT and AIS vessels', () => {
  const view = buildArticleReconView({
    title: 'Cargo vessel operations expand at port with new shipping container routes',
    country: 'Pakistan',
  });

  assert.equal(view.style, 'retro');
  assert.ok(view.layers.includes('ais-live-vessels'));
  assert.ok(view.layers.includes('telegeography-submarine-cables'));
  assert.equal(view.annotations[0].color, 'cyan');

  const validated = createView(view);
  assert.equal(validated.style, 'retro');
});

test('buildArticleReconView detects aviation and space topics correctly', () => {
  const aviationView = buildArticleReconView({
    title: 'Commercial airline flights grounded at major airport after airspace incident',
    country: 'Pakistan',
  });
  assert.equal(aviationView.style, 'retro');
  assert.ok(aviationView.layers.includes('flights'));

  const spaceView = buildArticleReconView({
    title: 'Satellite orbit payload launch confirmed by NASA mission control',
    country: 'Pakistan',
  });
  assert.equal(spaceView.style, 'normal');
  assert.ok(spaceView.layers.includes('satellites'));
  assert.ok(spaceView.layers.includes('rocket-launches'));
});

test('buildArticleReconView detects specific city hotspots like Gwadar, Karachi, and Beijing', () => {
  const gwadarView = buildArticleReconView({
    title: 'Deep sea port developments finalized in Gwadar',
    country: 'Pakistan',
  });
  assert.equal(gwadarView.camera.lat, KNOWN_HOTSPOTS['gwadar'].lat);
  assert.equal(gwadarView.camera.lon, KNOWN_HOTSPOTS['gwadar'].lon);

  const karachiView = buildArticleReconView({
    title: 'Financial summit concludes in Karachi',
    country: 'Pakistan',
  });
  assert.equal(karachiView.camera.lat, KNOWN_HOTSPOTS['karachi'].lat);
  assert.equal(karachiView.camera.lon, KNOWN_HOTSPOTS['karachi'].lon);

  const beijingView = buildArticleReconView({
    title: 'Trade delegates arrive in Beijing for bilateral economic summit',
    country: 'China',
  });
  assert.equal(beijingView.camera.lat, KNOWN_HOTSPOTS['beijing'].lat);
  assert.equal(beijingView.camera.lon, KNOWN_HOTSPOTS['beijing'].lon);
});

test('buildArticleReconView detects sovereign country hotspots like China, United States, and Ukraine', () => {
  const chinaView = buildArticleReconView({
    title: 'Strategic energy pipeline approved',
    country: 'China',
  });
  assert.equal(chinaView.camera.lat, KNOWN_HOTSPOTS['china'].lat);
  assert.equal(chinaView.camera.lon, KNOWN_HOTSPOTS['china'].lon);

  const usaView = buildArticleReconView({
    title: 'Congressional budget committee reviews maritime security',
    country: 'United States',
  });
  assert.equal(usaView.camera.lat, KNOWN_HOTSPOTS['united states'].lat);
  assert.equal(usaView.camera.lon, KNOWN_HOTSPOTS['united states'].lon);

  const ukraineView = buildArticleReconView({
    title: 'Reconstruction conference gathers international partners',
    country: 'Ukraine',
  });
  assert.equal(ukraineView.camera.lat, KNOWN_HOTSPOTS['ukraine'].lat);
  assert.equal(ukraineView.camera.lon, KNOWN_HOTSPOTS['ukraine'].lon);
});

test('buildArticleReconView preserves 0-coordinates on Equator and Prime Meridian (no falsy fallback bug)', () => {
  // Equator test: lat = 0, lon = 6.6 (Sao Tome)
  const equatorView = buildArticleReconView({
    title: 'Equatorial maritime shipping lane monitored',
    country: 'Sao Tome',
    defaultCoords: [0, 6.6],
  });
  assert.equal(equatorView.camera.lat, 0);
  assert.equal(equatorView.camera.lon, 6.6);

  // Prime Meridian test: lat = 51.48, lon = 0 (Greenwich)
  const meridianView = buildArticleReconView({
    title: 'Astronomical observatory publishes telemetry',
    country: 'Greenwich',
    defaultCoords: [51.48, 0],
  });
  assert.equal(meridianView.camera.lat, 51.48);
  assert.equal(meridianView.camera.lon, 0);

  // Null island test: lat = 0, lon = 0
  const nullIslandView = buildArticleReconView({
    title: 'Ocean weather buoy telemetry update',
    country: 'Atlantic Ocean',
    defaultCoords: [0, 0],
  });
  assert.equal(nullIslandView.camera.lat, 0);
  assert.equal(nullIslandView.camera.lon, 0);
});

test('buildArticleReconView strictly constrains annotation label lengths for GEV limit', () => {
  const extremelyLongTitle = 'A'.repeat(500);
  const view = buildArticleReconView({
    title: extremelyLongTitle,
    country: 'Pakistan',
    mentions: ['China', 'B'.repeat(300)],
  });

  for (const annotation of view.annotations) {
    if (annotation.label) {
      assert.ok(
        annotation.label.length <= 120,
        `Annotation label exceeded GEV 120 char ceiling: ${annotation.label.length}`
      );
    }
  }

  // Must not throw in createView
  const validated = createView(view);
  assert.ok(validated);
});

test('getKnownHotspot helper resolves countries and hotspots case-insensitively', () => {
  assert.ok(getKnownHotspot('Pakistan'));
  assert.ok(getKnownHotspot('pakistan'));
  assert.ok(getKnownHotspot('UNITED STATES'));
  assert.ok(getKnownHotspot('china'));
  assert.ok(getKnownHotspot('Gwadar'));
  assert.equal(getKnownHotspot('NonExistentFictionalLand404'), undefined);
  assert.equal(getKnownHotspot(null), undefined);
});
