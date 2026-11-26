// No. 024: the checks every city must pass before it goes in ORDER (in _static.js).
//   node works/024/_gate.js              every file in cities/
//   node works/024/_gate.js lima oslo    just those
// Each city is opened alone in a headless browser (Playwright's headless shell,
// as No. 017's _cards.js finds it) on _gate.html. It must load and build, draw for
// 11 to 17 seconds, have a name, wall, description and font link, use only fonts
// that loaded (every character), and draw the same finished poster twice. It also
// notes how many marks arrive at once and how many wait on an earlier one; for the
// cost of a frame, run _bench.html alone (timings taken in parallel mean nothing). Fonts come from Google, so it needs the network.
// Exits 1 if any city fails.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PARALLEL = 4;

function chrome() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const found = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])) : [];
  for (const d of found.reverse()) {
    for (const p of ['chrome-headless-shell-mac-arm64/chrome-headless-shell', 'chrome-headless-shell-mac-x64/chrome-headless-shell', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const f = path.join(base, d, p);
      if (fs.existsSync(f)) return f;
    }
  }
  return process.env.CHROME || null;
}
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(DIR, path.normalize(u).replace(/^\/+/, ''));
    if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}
function check(bin, port, id) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'no024-'));
  return new Promise((resolve) => {
    const p = spawn(bin, ['--no-sandbox', '--headless', '--hide-scrollbars', '--window-size=800,800', '--virtual-time-budget=60000', '--timeout=110000',
      `--user-data-dir=${profile}`, '--dump-dom', `http://127.0.0.1:${port}/_gate.html?id=${encodeURIComponent(id)}`], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    const guard = setTimeout(() => p.kill('SIGKILL'), 150000);
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', () => {
      clearTimeout(guard);
      fs.rmSync(profile, { recursive: true, force: true });
      const m = out.match(/<pre id="out">([\s\S]*?)<\/pre>/);
      if (!m || !m[1]) return resolve({ id, problems: ['the gate page produced nothing (timed out, or the module did not load)'], notes: {} });
      resolve(JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')));
    });
  });
}

const args = process.argv.slice(2);
const ids = args.length ? args : fs.readdirSync(path.join(DIR, 'cities')).filter((f) => f.endsWith('.js') && f !== 'index.js').map((f) => f.slice(0, -3)).sort();
const bin = chrome();
if (!bin) { console.error('no headless Chrome found (set CHROME=/path/to/chrome-headless-shell)'); process.exit(2); }
const server = await serve();
const results = [];
let next = 0;
await Promise.all(Array.from({ length: Math.min(PARALLEL, ids.length) }, async () => {
  while (next < ids.length) {
    const id = ids[next++];
    const r = await check(bin, server.address().port, id);
    results.push(r);
    const n = r.notes || {};
    console.log(`${r.problems.length ? 'FAIL' : 'ok  '} ${id.padEnd(16)} end ${n.end ?? '-'}s  marks ${n.marks ?? '-'}  lives ${n.lives ?? '-'}  at once ${n.peakActive ?? '-'}  held ${n.peakHeld ?? '-'}  colors ${n.colors ?? '-'}`);
    for (const p of r.problems) console.log(`       ${p}`);
  }
}));
server.close();
const failed = results.filter((r) => r.problems.length);
console.log(`\n${results.length - failed.length} of ${results.length} pass`);
process.exit(failed.length ? 1 : 0);
