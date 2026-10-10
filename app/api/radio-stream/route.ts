import { NextRequest, NextResponse } from 'next/server';

/**
 * Verified stream endpoints for stations whose official transmitters
 * broadcast over HTTP icecast/shoutcast servers (to prevent mixed-content
 * blocking in modern HTTPS browser environments like Vercel).
 */
const VERIFIED_STATIONS: Record<string, string> = {
  'fm100-isb': 'http://162.244.80.118:4900/;stream.mp3',
  'fm100-khi': 'http://162.244.80.118:3024/;stream.mp3',
  'fm100-lhe': 'http://162.244.80.118:4900/stream.mp3',
  'fm100-hyd': 'http://162.244.80.118:3024/stream.mp3',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get('station');
  const targetUrl = stationId ? VERIFIED_STATIONS[stationId] : null;

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Invalid or unverified station identifier.' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const upstreamResponse = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OSINT-Console/1.0',
        'Icy-MetaData': '0',
      },
    });

    clearTimeout(timeout);

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return NextResponse.json(
        { error: `Upstream radio station returned HTTP ${upstreamResponse.status}` },
        { status: 502 }
      );
    }

    const contentType = upstreamResponse.headers.get('content-type') || 'audio/mpeg';

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Radio-Station': stationId || 'unknown',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to establish connection to upstream broadcast station: ' + err.message },
      { status: 504 }
    );
  }
}
