import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextConfig from '../next.config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicGevDir = path.resolve(rootDir, 'public', 'gev');

// Test the normalization logic extracted from GodsEyeViewEmbed
function normalizeEndpointUrl(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return '/gev';
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return `http://localhost:${trimmed}`;
  return `http://${trimmed}`;
}

test('GEV Production Static Assets: verify files in public/gev', () => {
  const indexHtmlPath = path.join(publicGevDir, 'index.html');
  assert.ok(fs.existsSync(indexHtmlPath), 'public/gev/index.html must exist');

  const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(htmlContent.includes('/gev/cesium/Cesium.js'), 'index.html must reference Cesium.js under /gev/');
  assert.ok(htmlContent.includes('/gev/cesium/Widgets/widgets.css'), 'index.html must reference Cesium widgets under /gev/');
  assert.ok(htmlContent.includes('/gev/assets/'), 'index.html must reference scripts/styles in /gev/assets/');

  // Verify Cesium runtime bundle
  const cesiumJsPath = path.join(publicGevDir, 'cesium', 'Cesium.js');
  assert.ok(fs.existsSync(cesiumJsPath), 'public/gev/cesium/Cesium.js must exist');
  const cesiumStats = fs.statSync(cesiumJsPath);
  assert.ok(cesiumStats.size > 1_000_000, 'Cesium.js should be a full bundle (> 1MB)');

  // Verify Cesium widgets
  const widgetsCssPath = path.join(publicGevDir, 'cesium', 'Widgets', 'widgets.css');
  assert.ok(fs.existsSync(widgetsCssPath), 'widgets.css must exist');

  // Verify models directory
  const modelsDir = path.join(publicGevDir, 'models');
  assert.ok(fs.existsSync(modelsDir), 'public/gev/models directory must exist');
});

test('GEV URL normalization: handles production relative paths, ports, and external domains', () => {
  // Empty or whitespace defaults to same-origin /gev
  assert.equal(normalizeEndpointUrl(''), '/gev');
  assert.equal(normalizeEndpointUrl('   '), '/gev');
  assert.equal(normalizeEndpointUrl(undefined), '/gev');

  // Relative paths preserved
  assert.equal(normalizeEndpointUrl('/gev'), '/gev');
  assert.equal(normalizeEndpointUrl('/gev/'), '/gev/');

  // Numeric port shorthand expanded to localhost
  assert.equal(normalizeEndpointUrl('4173'), 'http://localhost:4173');
  assert.equal(normalizeEndpointUrl('5173'), 'http://localhost:5173');

  // Absolute URLs preserved
  assert.equal(normalizeEndpointUrl('http://localhost:4173'), 'http://localhost:4173');
  assert.equal(normalizeEndpointUrl('https://gev.internal.net'), 'https://gev.internal.net');
  assert.equal(normalizeEndpointUrl('gev.example.com'), 'http://gev.example.com');
});

test('Next.js configuration: rewrites and redirects support /gev and /boost seamlessly', async () => {
  assert.ok(typeof nextConfig.rewrites === 'function', 'nextConfig must define rewrites');
  const rewrites = await nextConfig.rewrites();

  const gevRewrite = rewrites.find((r) => r.source === '/gev');
  assert.ok(gevRewrite, 'Should have rewrite for /gev');
  assert.equal(gevRewrite.destination, '/gev/index.html');

  const cesiumRewrite = rewrites.find((r) => r.source === '/cesium/:path*');
  assert.ok(cesiumRewrite, 'Should have rewrite fallback for /cesium/:path*');
  assert.equal(cesiumRewrite.destination, '/gev/cesium/:path*');

  const modelsRewrite = rewrites.find((r) => r.source === '/models/:path*');
  assert.ok(modelsRewrite, 'Should have rewrite fallback for /models/:path*');
  assert.equal(modelsRewrite.destination, '/gev/models/:path*');

  // Test redirects for /boost
  assert.ok(typeof nextConfig.redirects === 'function', 'nextConfig must define redirects');
  const redirects = await nextConfig.redirects();
  const boostRedirect = redirects.find((r) => r.source === '/boost');
  assert.ok(boostRedirect, 'Should have redirect for /boost');
  assert.equal(boostRedirect.destination, '/?mode=recon');
  assert.equal(boostRedirect.permanent, false);
});
