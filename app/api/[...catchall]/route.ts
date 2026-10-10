import { NextRequest, NextResponse } from 'next/server';

/**
 * Fallback route handler for God's Eye View backend proxy endpoints.
 * When deployed as static assets on Next.js / Vercel without an active
 * background Vite provider process, this ensures calls to /api/setup,
 * /api/vessels, /api/google, etc. return graceful JSON responses instead
 * of HTML 404 error documents that break client JSON deserialization.
 */

function handleFallback(req: NextRequest, { params }: { params: Promise<{ catchall?: string[] }> }) {
  return params.then(({ catchall = [] }) => {
    const endpoint = catchall.join('/');

    // 1. Setup status and key management
    if (endpoint === 'setup/status') {
      return NextResponse.json({
        available: false,
        configured: false,
        mode: 'static-embed',
        message: 'Static embedded God\'s Eye View engine running with keyless defaults.',
      });
    }

    if (endpoint === 'setup/keys') {
      return NextResponse.json({ ok: true });
    }

    // 2. Google Photoreal / Geocoding / Places tokens
    if (endpoint === 'google/tiles-token') {
      return NextResponse.json({
        ok: false,
        token: null,
        mode: 'keyless-fallback',
        error: 'Google 3D tokens not configured; Cesium World Terrain fallback active.',
      });
    }

    if (endpoint === 'google/nearby-places' || endpoint === 'google/text-search') {
      return NextResponse.json({ places: [] });
    }

    // 3. Maritime vessels / live feeds
    if (endpoint === 'vessels' || endpoint.startsWith('vessels/')) {
      return NextResponse.json({ records: [], complete: true });
    }

    // 4. Weather / cyclones
    if (endpoint === 'cyclones') {
      return NextResponse.json({ storms: [], features: [] });
    }

    // 5. OpenAI / Voice Realtime endpoints
    if (endpoint === 'realtime/oauth-status') {
      return NextResponse.json({ available: false, loginFailed: false });
    }

    if (endpoint === 'realtime/token') {
      return NextResponse.json(
        { ok: false, error: 'Voice realtime provider not configured in static embed mode.' },
        { status: 503 }
      );
    }

    if (endpoint === 'realtime/debug-log') {
      return NextResponse.json({ ok: true });
    }

    if (endpoint === 'openai/hud-summary') {
      return NextResponse.json({ ok: false, summary: null });
    }

    // 6. Local receivers / ADS-B SDR
    if (endpoint === 'local-receivers/aircraft') {
      return NextResponse.json({ aircraft: [] });
    }

    // 7. Overpass / OSM
    if (endpoint === 'overpass') {
      return NextResponse.json({ elements: [] });
    }

    // Default clean JSON 404 for unknown API routes
    return NextResponse.json(
      {
        ok: false,
        endpoint: `/api/${endpoint}`,
        error: 'Endpoint not available in static embed mode.',
      },
      { status: 404 }
    );
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleFallback(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleFallback(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleFallback(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleFallback(req, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
