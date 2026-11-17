#!/usr/bin/env node
// node works/017/_cards.js [--no-fit]
//
// Writes the cards from sayings.json into index.html, between <!-- gen:cards --> and <!-- /gen:cards -->
// (and the theme filter between <!-- gen:filter --> markers). Then it fits each saying: it opens _fit.html in the
// headless browser, which finds the largest size in cqw at which the saying stays above the footer, and writes
// that number into the card as --fs. Running it twice changes nothing.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn, execSync } = require('child_process');
const P = require('./palette.js');

const DIR = __dirname;
const INDEX = path.join(DIR, 'index.html');
const MAX_FS = 25;        // cqw: a five-word saying stops getting better past this
const SAFETY = 0.985;     // leave a little room for other browsers' line breaking

// ---------- read and check the sayings ----------
const sayings = JSON.parse(fs.readFileSync(path.join(DIR, 'sayings.json'), 'utf8'));
const problems = [];
const ids = new Set();
for (const [n, s] of sayings.entries()) {
  const where = `sayings.json[${n}] ${s.id || ''}`;
  if (!/^[a-z0-9-]+$/.test(s.id || '')) problems.push(`${where}: id must be lowercase letters, digits and hyphens`);
  if (ids.has(s.id)) problems.push(`${where}: id repeats`);
  ids.add(s.id);
  if (!P.theme(s.theme)) problems.push(`${where}: unknown theme "${s.theme}"`);
  if ((String(s.text).match(/\*/g) || []).length !== 2) problems.push(`${where}: text needs exactly one *phrase*`);
  if (!s.author) problems.push(`${where}: no author`);
  if (s.lang && !['tr', 'fa', 'ar', 'pa', 'ur'].includes(s.lang)) problems.push(`${where}: lang "${s.lang}" is not tr, fa, ar, pa or ur`);
  if (s.original && !s.lang) problems.push(`${where}: original text without lang`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// ---------- text ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Curly quotes inside a saying that is itself in double quotes: double becomes single, apostrophes curl.
function smart(s) {
  let open = true;
  return s
    .replace(/(\w)'(\w)/g, '$1’$2')
    .replace(/'/g, (m, i) => (i === 0 || /[\s(\[“‘—-]/.test(s[i - 1])) ? '‘' : '’')
    .replace(/"/g, () => { const q = open ? '‘' : '’'; open = !open; return q; })
    .replace(/“/g, '‘').replace(/”/g, '’');
}
function sayingHTML(text) {
  const t = smart(text.trim());
  return esc(t).replace(/\*([^*]+)\*/, '<em>$1</em>');
}
const plain = text => smart(text.trim()).replace(/\*/g, '');

// ---------- lines ----------
// The saying, in its quotation marks, as characters that know whether they are italic. HTML entities stay whole.
function chars(text) {
  const html = '“' + sayingHTML(text) + '”', out = [];
  let it = false;
  for (let i = 0; i < html.length;) {
    if (html.startsWith('<em>', i)) { it = true; i += 4; continue; }
    if (html.startsWith('</em>', i)) { it = false; i += 5; continue; }
    if (html[i] === '&') { const j = html.indexOf(';', i); out.push({ c: html.slice(i, j + 1), it }); i = j + 1; continue; }
    out.push({ c: html[i], it }); i++;
  }
  return out;
}
function wordsOf(text) {
  const ws = [[]];
  for (const ch of chars(text)) { if (ch.c === ' ') ws.push([]); else ws.at(-1).push(ch); }
  return ws.filter(w => w.length);
}
function runHTML(cs) {
  let h = '', open = false;
  for (const { c, it } of cs) {
    if (it && !open) { h += '<em>'; open = true; }
    if (!it && open) { h += '</em>'; open = false; }
    h += c;
  }
  return open ? h + '</em>' : h;
}
const joinWords = ws => ws.flatMap((w, i) => i ? [{ c: ' ', it: w[0].it && ws[i - 1].at(-1).it }, ...w] : w);
// breaks: how many words go on each line. Without them (or if they no longer match the text) the saying wraps freely.
function linesHTML(text, breaks) {
  const ws = wordsOf(text);
  if (!breaks || breaks.reduce((a, b) => a + b, 0) !== ws.length) return runHTML(joinWords(ws));
  let k = 0;
  return breaks.map(n => `<span class="ln">${runHTML(joinWords(ws.slice(k, k += n)))}</span>`).join(' ');
}
const isArabicScript = s => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(s);

// ---------- colors: each card a deterministic variant of its theme's family ----------
const byTheme = {};
for (const s of sayings) (byTheme[s.theme] = byTheme[s.theme] || []).push(s);
const cards = sayings.map(s => {
  const t = P.theme(s.theme);
  const k = byTheme[s.theme].indexOf(s);
  const pair = P.pair(t.name, k % t.variants.length);
  const fam = P.FAMILIES[t.family];
  const hue = pair.fieldLch[1] < 0.05 ? 60 : pair.fieldLch[2];
  return { s, t, pair, deep: pair.deep, warm: hue < 110 || hue > 340, words: plain(s.text).split(/\s+/).length, fam };
});

// ---------- order: themes interleave; neighbors alternate deep and light, warm and cool ----------
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
function order(list) {
  const left = list.slice(), out = [];
  // open on the card closest to the reference: deep lapis with paper ink
  let first = left.findIndex(c => c.t.family === 'lapis' && c.pair.variant === 'deep');
  if (first < 0) first = 0;
  out.push(left.splice(first, 1)[0]);
  const remaining = th => left.filter(c => c.t === th).length;
  while (left.length) {
    const i = out.length;
    let best = null, bestScore = Infinity;
    for (const c of left) {
      const at = k => out[i - k];
      let score = 0;
      // the same theme beside or above (in a 3 or 4 column wall) reads as a block
      for (const [k, w] of [[1, 10], [2, 3], [3, 7], [4, 7], [5, 2]]) if (at(k) && at(k).t === c.t) score += w;
      // the same saying near itself
      for (const k of [1, 2, 3, 4, 5]) if (at(k) && at(k).s.text === c.s.text) score += 6;
      // deep and light: different from the left neighbor, mixed with the ones above
      if (at(1) && at(1).deep === c.deep) score += 4;
      if (at(3) && at(3).deep === c.deep) score += 1.5;
      if (at(4) && at(4).deep === c.deep) score += 1.5;
      if (at(1) && at(1).warm === c.warm) score += 2;
      // long and short sayings alternate a little too
      if (at(1) && (at(1).words > 15) === (c.words > 15)) score += 1;
      // keep every theme spread through the wall rather than saving one for the end
      score -= 0.9 * remaining(c.t);
      score += hash(c.s.id + ':' + i) * 0.5;
      if (score < bestScore) { bestScore = score; best = c; }
    }
    out.push(left.splice(left.indexOf(best), 1)[0]);
  }
  return out;
}
const wall = order(cards);

// ---------- markup ----------
// Names and references: an apostrophe before a vowel is an ayn (Sa‘id, Nu‘aym), before a consonant an elision or a possessive (Abu’l, Ansari’s).
const translit = str => String(str).replace(/(\w)'(?=[aeiouāīū])/gi, '$1‘').replace(/'/g, '’');
const upper = (str, lang) => translit(str).toLocaleUpperCase(lang === 'tr' ? 'tr' : 'en');
// a title is set in italics; a tradition is not a title
const title = w => /tradition/i.test(w) ? esc(translit(w)) : `<cite>${esc(translit(w))}</cite>`;
function refHTML(s) {
  let r = esc(translit(smart(s.ref).replace(/‘/g, '“').replace(/’(?=[\s,.;)]|$)/g, '”')));
  // the title in italics, by its full name or, failing that, its short one (al-Risala al-Qushayriyya: “Risala”)
  if (s.work && !/tradition/i.test(s.work)) {
    const full = esc(translit(s.work)), short = full.replace(/^al-/, '').split(/[\s(]/)[0];
    if (r.includes(full)) r = r.split(full).join(`<cite>${full}</cite>`);
    else if (short.length > 3) r = r.replace(new RegExp(`\\b${short}\\b`), `<cite>${short}</cite>`);
  }
  return r;
}
// Persian or Arabic quoted inside an English note: isolate it so its direction does not upset the marks around it
const rtlRuns = h => h.replace(/[\u0600-\u06FF][\u0600-\u06FF\s\u200c]*[\u0600-\u06FF]/g, m => `<bdi dir="rtl" class="rtl">${m}</bdi>`);
function tileHTML(c, fsz, breaks) {
  const { s, t, pair } = c;
  const nameLang = s.lang === 'tr' ? ' lang="tr"' : '';
  const reported = s.grade === 'B' && s.ref;
  let work;
  if (reported) work = refHTML(s).replace(/^\w/, ch => ch.toUpperCase());           // “Reported by Attar, Tadhkirat al-Awliya, …”
  else work = [s.work && title(s.work), s.ref && refHTML(s)].filter(Boolean).join(', ');
  let orig = '';
  if (s.original) {
    const rtl = isArabicScript(s.original);
    const lines = s.original.trim().split(/\s+\/\s+|\n/).map(esc).join('<br>');
    orig = `<p class="src-orig" lang="${s.lang}"${rtl ? ' dir="rtl"' : ''}>${lines}</p>`;
  }
  const lines = [
    `<p class="src-who">${s.grade === 'C' ? '<span class="src-attr">Attributed to</span> ' : ''}<span class="src-author"${nameLang}>${esc(translit(s.author))}</span>${s.dates ? ` <span class="src-dates">${esc(s.dates)}</span>` : ''}</p>`,
    work && `<p class="src-work">${work}</p>`,
    orig,
    s.note && `<p class="src-note">${rtlRuns(esc(translit(smart(s.note).replace(/‘/g, '“').replace(/’(?=[\s,.;:)]|$)/g, '”'))))}</p>`,
    `<p class="src-theme">${esc(t.name)}</p>`,
    s.sourceUrl && `<p class="src-link"><a href="${esc(s.sourceUrl)}" rel="noopener">Source</a></p>`,
  ].filter(Boolean);
  return `<li class="tile" id="${s.id}" data-theme="${t.slug}" data-variant="${pair.variant}">
        <figure>
          <a class="card" href="#${s.id}" style="--f:${pair.field};--i:${pair.ink};--fs:${fsz}">
            <blockquote class="q"><p>${linesHTML(s.text, breaks)}</p></blockquote>
            <span class="ft" aria-hidden="true"><span>${esc(upper(s.author, s.lang))}</span><span>${esc(upper(t.name))}</span></span>
          </a>
          <figcaption class="src">
            ${lines.join('\n            ')}
          </figcaption>
        </figure>
      </li>`;
}
function filterHTML() {
  const used = P.THEMES.filter(t => cards.some(c => c.t === t));
  return ['<button type="button" aria-pressed="true">All</button>']
    .concat(used.map(t => `<button type="button" aria-pressed="false" data-theme="${t.slug}"><i aria-hidden="true" style="--sw:${P.pair(t.name, 0).field}"></i>${esc(t.name)}</button>`))
    .join('\n      ');
}
function fill(html, name, body, indent) {
  const re = new RegExp(`([ \\t]*)<!-- gen:${name} -->[\\s\\S]*?<!-- /gen:${name} -->`);
  if (!re.test(html)) throw new Error(`index.html has no <!-- gen:${name} --> marker`);
  return html.replace(re, (m, pad) => `${pad}<!-- gen:${name} -->\n${body}\n${pad}<!-- /gen:${name} -->`);
}
function write(sizes, breaks) {
  let html = fs.readFileSync(INDEX, 'utf8');
  html = fill(html, 'filter', '      ' + filterHTML(), '');
  html = fill(html, 'cards', wall.map(c => '      ' + tileHTML(c, sizes[c.s.id] ?? 10, breaks[c.s.id])).join('\n'), '');
  fs.writeFileSync(INDEX, html);
}

// sizes already in the page, so a run without --no-fit and a run with it agree
function bakedSizes() {
  const html = fs.readFileSync(INDEX, 'utf8'), out = {};
  for (const m of html.matchAll(/<li class="tile" id="([^"]+)"[\s\S]*?--fs:([\d.]+)"/g)) out[m[1]] = parseFloat(m[2]);
  return out;
}

function bakedBreaks() {
  const html = fs.readFileSync(INDEX, 'utf8'), out = {};
  for (const m of html.matchAll(/<li class="tile" id="([^"]+)"[\s\S]*?<blockquote class="q"><p>([\s\S]*?)<\/p><\/blockquote>/g)) {
    const lines = [...m[2].matchAll(/<span class="ln">([\s\S]*?)<\/span>/g)];
    if (lines.length) out[m[1]] = lines.map(l => l[1].replace(/<[^>]+>/g, '').trim().split(/\s+/).length);
  }
  return out;
}

// ---------- fit, in the headless browser ----------
function chrome() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const found = fs.existsSync(base) ? fs.readdirSync(base).filter(d => d.startsWith('chromium_headless_shell-')).sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])) : [];
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
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}
async function fit() {
  const bin = chrome();
  if (!bin) throw new Error('no headless Chrome found (set CHROME=/path/to/chrome-headless-shell)');
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/_fit.html?max=${MAX_FS}&safety=${SAFETY}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'no017-'));
  try {
    const dom = await new Promise((resolve, reject) => {
      const p = spawn(bin, ['--no-sandbox', '--headless', '--hide-scrollbars', '--window-size=1400,1000', '--virtual-time-budget=60000', '--timeout=90000',
        `--user-data-dir=${profile}`, '--dump-dom', url], { stdio: ['ignore', 'pipe', 'ignore'] });
      let out = '';
      const guard = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('headless browser timed out')); }, 120000);
      p.stdout.on('data', d => { out += d; });
      p.on('close', () => { clearTimeout(guard); resolve(out); });
    });
    const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
    if (!m) throw new Error('the fit page produced nothing');
    const res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    if (res.error) throw new Error('fit page: ' + res.error);
    return res;
  } finally {
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

(async () => {
  const before = fs.readFileSync(INDEX, 'utf8');
  write(bakedSizes(), bakedBreaks());
  if (process.argv.includes('--no-fit')) { report(before); return; }
  const res = await fit();
  if (!res.fonts) throw new Error('the fit page did not get the web fonts; not writing sizes measured in a fallback face');
  const sizes = {}, breaks = {}, weak = [];
  for (const c of wall) {
    const r = res.sizes[c.s.id];
    if (!r) throw new Error('no size for ' + c.s.id);
    sizes[c.s.id] = r.fs; breaks[c.s.id] = r.breaks;
    if (!r.pass) weak.push(`${c.s.id} (${r.why})`);
  }
  write(sizes, breaks);
  if (weak.length) console.log(`no rag passed every rule within 12% of the largest size, best kept: ${weak.join(', ')}`);
  report(before);
  const list = wall.map(c => ({ id: c.s.id, words: c.words, ...res.sizes[c.s.id] })).sort((a, b) => a.fs - b.fs);
  console.log(`sizes: ${list[0].fs} cqw (${list[0].id}, ${list[0].words} words) to ${list.at(-1).fs} cqw (${list.at(-1).id}, ${list.at(-1).words} words)`);
})().catch(e => { console.error('works/017/_cards.js: ' + e.message); process.exit(1); });

function report(before) {
  const after = fs.readFileSync(INDEX, 'utf8');
  console.log(`${wall.length} cards; index.html ${before === after ? 'unchanged' : 'updated'}`);
}
