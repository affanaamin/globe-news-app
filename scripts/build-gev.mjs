import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const gevDir = path.resolve(rootDir, 'gods-eye-view');
const publicGevDir = path.resolve(rootDir, 'public', 'gev');

console.log('🛰️ [build-gev] Preparing God\'s Eye View static assets for Next.js...');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function organizeGevAssets(distDir, targetDir) {
  console.log(`📦 [build-gev] Copying assets from ${distDir} to ${targetDir}...`);
  copyRecursive(distDir, targetDir);

  // vite-plugin-cesium with base=/gev/ places cesium under dist/gev/cesium
  const nestedCesiumDir = path.join(targetDir, 'gev', 'cesium');
  const targetCesiumDir = path.join(targetDir, 'cesium');

  if (fs.existsSync(nestedCesiumDir)) {
    console.log('🔄 [build-gev] Normalizing Cesium assets path from /gev/cesium to /cesium...');
    if (!fs.existsSync(targetCesiumDir)) {
      fs.mkdirSync(targetCesiumDir, { recursive: true });
    }
    copyRecursive(nestedCesiumDir, targetCesiumDir);
    fs.rmSync(path.join(targetDir, 'gev'), { recursive: true, force: true });
  }

  const indexHtml = path.join(targetDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`[build-gev] Verification failed: ${indexHtml} does not exist.`);
  }

  const htmlContent = fs.readFileSync(indexHtml, 'utf8');
  if (!htmlContent.includes('/gev/')) {
    console.warn('⚠️ [build-gev] Warning: index.html does not contain /gev/ asset prefix.');
  } else {
    console.log('✅ [build-gev] Verified index.html contains /gev/ base asset links.');
  }

  // Copy root SVG icons to public/ for components requesting /logo.svg, /mic.svg directly
  syncRootIcons(targetDir);
}

function syncRootIcons(sourceDir) {
  const rootIcons = ['logo.svg', 'mic.svg', 'pin.svg', 'location.svg', 'visual-presets.svg'];
  for (const icon of rootIcons) {
    const srcIcon = path.join(sourceDir, icon);
    const destIcon = path.join(rootDir, 'public', icon);
    if (fs.existsSync(srcIcon)) {
      fs.copyFileSync(srcIcon, destIcon);
    }
  }
}

function loadEnvFiles() {
  const envCandidates = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
    path.join(gevDir, '.env'),
    path.join(gevDir, '.env.local'),
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key] && val) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // ignore read error
      }
    }
  }

  // Cross-wire NEXT_PUBLIC and standard keys
  if (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN && !process.env.CESIUM_ION_TOKEN) {
    process.env.CESIUM_ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  }
  if (process.env.CESIUM_ION_TOKEN && !process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
    process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN = process.env.CESIUM_ION_TOKEN;
  }
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
    process.env.GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
  if (process.env.GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  }

  if (process.env.CESIUM_ION_TOKEN) {
    console.log('🔑 [build-gev] CESIUM_ION_TOKEN detected - photoreal 3D globe & world terrain enabled.');
  }
  if (process.env.GOOGLE_MAPS_API_KEY) {
    console.log('🔑 [build-gev] GOOGLE_MAPS_API_KEY detected - photoreal 3D building meshes enabled.');
  }
}

async function main() {
  loadEnvFiles();
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  const gevExists = fs.existsSync(gevDir);
  const gevNodeModulesExists = gevExists && fs.existsSync(path.join(gevDir, 'node_modules'));
  const prebuiltExists = fs.existsSync(path.join(publicGevDir, 'index.html'));

  if (gevExists && gevNodeModulesExists) {
    console.log('⚙️ [build-gev] Compiling gods-eye-view with Vite (--base=/gev/)...');
    const result = spawnSync(`${npmCmd} run build -- --base=/gev/`, {
      cwd: gevDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env },
    });

    if (result.status !== 0) {
      if (prebuiltExists) {
        console.warn('⚠️ [build-gev] Vite build failed, but pre-built assets exist in public/gev. Continuing with existing assets.');
        return;
      }
      throw new Error(`[build-gev] Vite build failed with exit code ${result.status}`);
    }

    const distDir = path.join(gevDir, 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error(`[build-gev] Dist directory not found at ${distDir}`);
    }

    organizeGevAssets(distDir, publicGevDir);
    console.log('🎉 [build-gev] GEV static assets successfully deployed to public/gev!');
  } else if (prebuiltExists) {
    console.log('ℹ️ [build-gev] Using existing pre-built GEV static assets in public/gev.');
    syncRootIcons(publicGevDir);
  } else if (gevExists) {
    console.log('📦 [build-gev] Installing gods-eye-view dependencies...');
    const installResult = spawnSync(`${npmCmd} install`, {
      cwd: gevDir,
      stdio: 'inherit',
      shell: true,
    });

    if (installResult.status === 0) {
      console.log('⚙️ [build-gev] Compiling gods-eye-view with Vite (--base=/gev/)...');
      const buildResult = spawnSync(`${npmCmd} run build -- --base=/gev/`, {
        cwd: gevDir,
        stdio: 'inherit',
        shell: true,
      });

      if (buildResult.status === 0) {
        organizeGevAssets(path.join(gevDir, 'dist'), publicGevDir);
        console.log('🎉 [build-gev] GEV static assets successfully deployed to public/gev!');
        return;
      }
    }

    throw new Error('[build-gev] Failed to build GEV and no pre-built assets found.');
  } else {
    throw new Error('[build-gev] Neither gods-eye-view directory nor pre-built public/gev found.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
