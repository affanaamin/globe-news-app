# Planet OSINT // Dual-Engine Intelligence Console

An advanced geospatial open-source intelligence (OSINT) and live news monitoring console combining:
1. **Strategic Overview (3D Globe):** High-level Three.js neon cyberpunk globe with ISS live orbit telemetry and 2D Pakistan provincial deep-dive.
2. **Tactical Recon (God's Eye View):** High-resolution Cesium 3D geospatial intelligence console integrated from [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view), supporting live flights, AIS maritime vessels, satellites, earthquakes, thermal fire feeds, radio stations, and multiple sensor modes (FLIR Thermal, NVG Night Vision, CRT Phosphor, Photoreal 3D).

---

## Architecture & Integration Details

- **Dual-Engine Toggle:** Header buttons in `app/page.tsx` allow seamless hot-switching between Strategic 3D Globe and Tactical Recon.
- **Embedded RPC Protocol:** `components/GodsEyeViewEmbed.tsx` embeds GEV via `/?embed=1` and handles bidirectional `window.postMessage` RPC:
  - Inbound: Listens for `gev:ready` and `gev:view-applied`.
  - Outbound: Dispatches validated type-safe `gev:view` payloads with camera coordinates, layer visibility, annotation pins/highlights, and sensor styles.
- **Headline Recon Dispatching:** In `NewsDashboard.tsx`, news headlines can be targeted (`DISPATCH RECON`). `utils/reconDispatch.ts` parses locations and event keywords to automatically configure camera coordinates, sensor styles, and relevant telemetry layers (e.g. military flights for conflict, AIS vessels for maritime, thermal FLIR for disasters).
- **Framing & CSP:** GEV is configured in `gods-eye-view/.env` with `GEV_EMBED_FRAME_ANCESTORS=http://localhost:3000 http://localhost:3001 *` to allow iframe embedding under its CSP plugin.

---

## Getting Started

### 1. Install Dependencies
```bash
# Install main application dependencies
npm install

# Install God's Eye View dependencies
npm --prefix gods-eye-view install
```

### 2. Environment Configuration
- In root `.env.local`:
  ```env
  NEXT_PUBLIC_GEV_URL=http://localhost:4173
  ```
- In `gods-eye-view/.env`:
  ```env
  PORT=4173
  GEV_EMBED_FRAME_ANCESTORS=http://localhost:3000 http://localhost:3001 *
  ```
  *(Optional: Add `GOOGLE_MAPS_API_KEY` or `CESIUM_ION_TOKEN` in `gods-eye-view/.env` for Google Photorealistic 3D Tiles).*

### 3. Running the Development Servers

You can launch both engines concurrently with one command:
```bash
npm run dev:all
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Next.js News App (http://localhost:3000)
npm run dev:news

# Terminal 2: God's Eye View Tactical Console (http://localhost:4173)
npm run dev:gev
```

---

## Testing & Verification
```bash
# Run unit tests verifying GEV contract schemas, hotspot resolution, and edge cases
npm test

# Run Next.js production build and TypeScript check
npm run build
```
Builds cleanly with zero TypeScript errors.
