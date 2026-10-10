#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const gevDir = path.resolve(rootDir, 'gods-eye-view');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('----------------------------------------------------');
console.log('🌐 STARTING DUAL-ENGINE INTEL CONSOLE');
console.log('  1. News Dashboard (Next.js): http://localhost:3000');
console.log('  2. Tactical Recon (GEV):    http://localhost:4173');
console.log('----------------------------------------------------');

const nextProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const gevProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: gevDir,
  stdio: 'inherit',
  shell: true,
});

function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  if (isWin) {
    try {
      spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      proc.kill();
    }
  } else {
    try {
      proc.kill('SIGTERM');
    } catch {
      proc.kill();
    }
  }
}

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nShutting down dual-engine processes...');
  killProcessTree(nextProc);
  killProcessTree(gevProc);
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
