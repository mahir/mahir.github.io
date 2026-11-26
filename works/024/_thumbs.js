// No. 024: the small pictures of the finished posters that the index shows.
//   node works/024/_thumbs.js              every city in cities/
//   node works/024/_thumbs.js lima oslo    just those
// Run it after adding a city or changing how one looks. Each poster is drawn
// headless on _thumb.html at twice the size, halved, and written to thumbs/<id>.webp.
// Fonts come from Google, so it needs the network.
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
function shoot(bin, port, id) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'no024-'));
  return new Promise((resolve) => {
    const p = spawn(bin, ['--no-sandbox', '--headless', '--hide-scrollbars', '--window-size=800,800', '--virtual-time-budget=30000', '--timeout=60000',
      `--user-data-dir=${profile}`, '--dump-dom', `http://127.0.0.1:${port}/_thumb.html?id=${encodeURIComponent(id)}`], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    const guard = setTimeout(() => p.kill('SIGKILL'), 90000);
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', () => {
      clearTimeout(guard);
      fs.rmSync(profile, { recursive: true, force: true });
      const m = out.match(/<pre id="out">data:image\/webp;base64,([^<]+)<\/pre>/);
      if (!m) return resolve(`${id}: no picture (${(out.match(/<pre id="out">([^<]{0,200})/) || [])[1] || 'timed out'})`);
      const buf = Buffer.from(m[1], 'base64');
      fs.writeFileSync(path.join(DIR, 'thumbs', `${id}.webp`), buf);
      resolve(null);
    });
  });
}

const args = process.argv.slice(2);
const ids = args.length ? args : fs.readdirSync(path.join(DIR, 'cities')).filter((f) => f.endsWith('.js') && f !== 'index.js').map((f) => f.slice(0, -3)).sort();
const bin = chrome();
if (!bin) { console.error('no headless Chrome found (set CHROME=/path/to/chrome-headless-shell)'); process.exit(2); }
fs.mkdirSync(path.join(DIR, 'thumbs'), { recursive: true });
const server = await serve();
const problems = [];
let next = 0;
await Promise.all(Array.from({ length: Math.min(PARALLEL, ids.length) }, async () => {
  while (next < ids.length) {
    const id = ids[next++];
    const e = await shoot(bin, server.address().port, id);
    if (e) problems.push(e);
    console.log(e ? `FAIL ${e}` : `ok   ${id}`);
  }
}));
server.close();
console.log(`${ids.length - problems.length} of ${ids.length} written to thumbs/`);
process.exit(problems.length ? 1 : 0);
