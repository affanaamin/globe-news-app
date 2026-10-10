import { spawn } from 'node:child_process';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runBrowserAudit() {
  console.log('🚀 Launching Chrome Headless for live audit...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--user-data-dir=' + process.env.TEMP + '\\chrome-audit-profile-' + Date.now(),
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        await getJson('/json/version');
        connected = true;
        break;
      } catch {}
    }

    if (!connected) {
      throw new Error('Failed to connect to Chrome debugging port.');
    }
    console.log('Connected to Chrome DevTools Protocol.');

    const targets = await getJson('/json/list');
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found.');

    const wsUrl = pageTarget.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const pending = new Map();
    const consoleLogs = [];
    const failedRequests = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value || a.description).join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      } else if (msg.method === 'Log.entryAdded') {
        consoleLogs.push({ type: msg.params.entry.level, text: msg.params.entry.text });
      } else if (msg.method === 'Network.responseReceived') {
        const status = msg.params.response.status;
        const url = msg.params.response.url;
        if (status >= 400) {
          failedRequests.push({ status, url });
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        pending.set(curId, resolve);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    console.log('\n--- 1. Testing /boost Navigation & Redirection ---');
    await send('Page.navigate', { url: 'http://localhost:3005/boost' });
    await sleep(3000);

    const boostEval = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ href: window.location.href, title: document.title })',
      returnByValue: true,
    });
    console.log('Location after /boost:', boostEval.result?.result?.value);

    console.log('\n--- 2. Testing /?mode=recon Tactical Recon Engine ---');
    await send('Page.navigate', { url: 'http://localhost:3005/?mode=recon' });
    await sleep(6000);

    const reconEval = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        href: window.location.href,
        hasIframe: !!document.querySelector('iframe'),
        iframeSrc: document.querySelector('iframe')?.getAttribute('src'),
        isLinked: document.body.innerText.includes('GEV RECON // LINKED'),
        hudText: Array.from(document.querySelectorAll('span')).map(s => s.innerText).filter(t => t.includes('GEV') || t.includes('UPLINK')),
      })`,
      returnByValue: true,
    });
    console.log('Recon mode inspection:', reconEval.result?.result?.value);

    console.log('\n--- 3. Testing direct /gev/index.html?embed=1 Loading ---');
    failedRequests.length = 0;
    consoleLogs.length = 0;
    await send('Page.navigate', { url: 'http://localhost:3005/gev/index.html?embed=1' });
    await sleep(5000);

    const gevEval = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        cesiumDefined: typeof Cesium !== 'undefined',
        cesiumContainer: !!document.getElementById('cesiumContainer'),
        bodyClass: document.body.className,
      })`,
      returnByValue: true,
    });
    console.log('GEV direct inspection:', gevEval.result?.result?.value);

    console.log('\n--- Network Failures (4xx / 5xx) ---');
    if (failedRequests.length === 0) {
      console.log('None! All requests succeeded.');
    } else {
      for (const r of failedRequests) {
        console.log(`Failed: [${r.status}] ${r.url}`);
      }
    }

    console.log('\n--- Console Logs & Errors ---');
    const errors = consoleLogs.filter((l) => l.type === 'error');
    const warnings = consoleLogs.filter((l) => l.type === 'warning' || l.type === 'warn');
    console.log(`Captured ${consoleLogs.length} logs (${errors.length} errors, ${warnings.length} warnings)`);
    for (const err of errors) {
      console.log('❌ Error:', err.text);
    }
    for (const w of warnings.slice(0, 10)) {
      console.log('⚠️ Warning:', w.text);
    }

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runBrowserAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
