#!/usr/bin/env node
// node works/017/_cards.js [--no-fit]
//
// Writes the cards from sayings.json into index.html, one section a theme, between <!-- gen:cards --> and
// <!-- /gen:cards -->; the theme links between <!-- gen:nav --> markers and the lede, with its counts, between <!-- gen:lede -->. Then it fits each saying: it opens _fit.html in the
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
// Hand-set line breaks, by id: words per line. Only for a card the fitter's rules cannot get right; the size is then
// the largest at which these lines fit. Each entry says why.
const BREAKS = {
  'junayd-love-with-a-motive': [2, 2, 3, 2, 3],              // no line ending on "the"
  'daqqaq-silent-about-the-truth': [1, 2, 1, 3, 3],          // was "about the / truth is a / mute devil"
  'ghazali-advice-is-easy': [2, 2, 3, 3],                    // "the hard part" kept together
  'ruwaym-words-and-deeds': [3, 4, 5, 3, 4, 5],              // the two halves set as a pair
  'ibn-ata-allah-free-and-slave': [3, 3, 3, 3, 4, 2],        // no line ending on "a"
  'dhul-nun-most-worries': [2, 3, 3, 3, 1],                  // "worries are those" whole; the last word is long
  'abu-uthman-fire-and-ashes': [2, 4, 3, 4, 3, 3],           // "gets off with ashes" whole
  'rumi-water-runs-to-the-low': [3, 4, 2, 4, 4, 3, 3, 3],    // "make yourself low" whole
  'rumi-less-by-dying': [4, 4, 3, 4, 3, 3, 3, 4],            // "ever less by dying" whole
  'shabistari-sweep-the-heart': [3, 5, 3, 3, 4, 3],          // "the house of the heart" whole
  'mmb-better-to-keep-silent': [3, 3, 4, 3, 4, 2, 4],        // the poet's name, Muhammad Bakhsh, on one line
  'fudayl-the-hen': [3, 2, 3, 3, 3, 2, 3],                   // "mistreated his hen" whole
};
const LANGS = ['tr', 'fa', 'ar', 'pa', 'ur', 'sd', 'ps'];
const BATCH = 40;         // cards a headless browser fits; the batches run side by side
const PARALLEL = Math.max(1, Math.min(6, os.cpus().length - 1));
// the page's ground, read from style.css: a card whose field is close to it gets a hairline edge
const GROUND = (fs.readFileSync(path.join(DIR, 'style.css'), 'utf8').match(/--ground:\s*(#[0-9a-f]{6})/i) || [])[1];
if (!GROUND) { console.error('works/017/_cards.js: no --ground hex in style.css'); process.exit(1); }
const EDGE_BELOW = 1.3;   // contrast with the ground under which a card needs its edge

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
  if (/^(theme|w|h)-/.test(s.id || '')) problems.push(`${where}: ids starting theme-, w- or h- belong to the page`);
  if (s.lang && !LANGS.includes(s.lang)) problems.push(`${where}: lang "${s.lang}" is not one of ${LANGS.join(', ')}`);
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

// ---------- order and colors ----------
// The wall is one section a theme, in the palette's theme order; inside a section the sayings keep the order of
// sayings.json. Each card takes a variant of its theme so that it reads as a different color from the four
// cards before it (its field, or, for two cards on undyed paper, its ink's hue; see Palette.differ): its neighbor in a row, and the card above it at two, three or four across. Among the variants
// that allow, the one used least so far, then one that turns deep after light (or light after deep).
const NEAR = 4;
const byTheme = new Map(P.THEMES.map(t => [t, []]));
for (const s of sayings) byTheme.get(P.theme(s.theme)).push(s);
const sections = [];
for (const [t, list] of byTheme) {
  if (!list.length) continue;
  const used = Object.fromEntries(t.variants.map(v => [v, 0]));
  const pick = [];
  // depth first, cheapest variant first; back up a card when the rule leaves none (it is not transitive on paper)
  let steps = 0;
  const place = k => {
    if (k === list.length) return true;
    if (++steps > 200000) throw new Error(`${t.name}: no color order found`);
    const before = pick.slice(Math.max(0, k - NEAR)).map(v => P.pair(t.name, v));
    const prev = before.at(-1);
    const cost = v => used[v] * 2 + (prev && P.pair(t.name, v).deep === prev.deep ? 1 : 0) + t.variants.indexOf(v) * 0.01;
    const ok = t.variants.filter(v => before.every(b => P.differ(P.pair(t.name, v), b))).sort((a, b) => cost(a) - cost(b));
    for (const v of ok) {
      pick.push(v); used[v]++;
      if (place(k + 1)) return true;
      pick.pop(); used[v]--;
    }
    return false;
  };
  if (!place(0)) throw new Error(`${t.name}: no variant order keeps neighbors apart`);
  const cards = list.map((s, k) => {
    const pair = P.pair(t.name, pick[k]);
    return { s, t, pair, deep: pair.deep, edge: P.contrast(pair.field, GROUND) < EDGE_BELOW, words: plain(s.text).split(/\s+/).length };
  });
  sections.push({ t, cards });
}
const wall = sections.flatMap(x => x.cards);

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
    // the script, when the language alone does not say it: Punjabi is written in Shahmukhi (Arabic) or in Gurmukhi
    const guru = /[\u0A00-\u0A7F]/.test(s.original);
    const tag = s.lang === 'pa' ? (guru ? 'pa-Guru' : 'pa-Arab') : s.lang;
    const lines = s.original.trim().split(/\s+\/\s+|\n/).map(esc).join('<br>');
    orig = `<p class="src-orig" lang="${tag}"${rtl ? ' dir="rtl"' : ''}>${lines}</p>`;
  }
  const lines = [
    `<p class="src-who">${s.grade === 'C' ? '<span class="src-attr">Attributed to</span> ' : ''}<span class="src-author"${nameLang}>${esc(translit(s.author))}</span>${s.dates ? ` <span class="src-dates">${esc(s.dates)}</span>` : ''}</p>`,
    work && `<p class="src-work">${rtlRuns(work)}</p>`,
    orig,
    s.note && `<p class="src-note">${rtlRuns(esc(translit(smart(s.note).replace(/‘/g, '“').replace(/’(?=[\s,.;:)]|$)/g, '”'))))}</p>`,
    `<p class="src-theme">${esc(t.name)}</p>`,
    s.sourceUrl && `<p class="src-link"><a href="${esc(s.sourceUrl)}" rel="noopener">Source</a></p>`,
  ].filter(Boolean);
  return `<li class="tile" id="${s.id}" data-theme="${t.slug}" data-variant="${pair.variant}">
        <figure>
          <a class="card${c.edge ? ' edge' : ''}" href="#${s.id}" style="--f:${pair.field};--i:${pair.ink};--fs:${fsz}">
            <blockquote class="q"><p>${linesHTML(s.text, breaks)}</p></blockquote>
            <span class="ft" aria-hidden="true"><span>${esc(upper(s.author, s.lang))}</span><span>${esc(upper(t.name))}</span></span>
          </a>
          <figcaption class="src">
            ${lines.join('\n            ')}
          </figcaption>
        </figure>
      </li>`;
}
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function navHTML() {
  return sections.map(({ t }) => `<li><a href="#theme-${t.slug}"><i aria-hidden="true" style="--sw:${P.pair(t.name, 0).field}"></i>${esc(t.name)}</a></li>`).join('\n        ');
}
function ledeHTML() {
  return `<p class="lede">${count(wall.length, 'saying', 'sayings')} of Sufi poets and teachers, one to a card, in ${NUM[sections.length] || sections.length} themes. Each theme has its own color. Open a card for its source.</p>`;
}
function sectionHTML({ t, cards }, sizes, breaks) {
  const n = cards.length;
  return `      <section class="theme" id="theme-${t.slug}" aria-labelledby="h-${t.slug}">
        <div class="th">
          <h2 id="h-${t.slug}">${esc(t.name)}</h2>
          <p class="th-n">${count(n, 'saying', 'sayings')}</p>
        </div>
        <ol class="wall" id="w-${t.slug}">
${cards.map(c => '      ' + tileHTML(c, sizes[c.s.id] ?? 10, breaks[c.s.id])).join('\n')}
        </ol>
        <button type="button" class="more" aria-expanded="false" aria-controls="w-${t.slug}" data-n="${n}" hidden>Show all ${n}</button>
      </section>`;
}
function fill(html, name, body, indent) {
  const re = new RegExp(`([ \\t]*)<!-- gen:${name} -->[\\s\\S]*?<!-- /gen:${name} -->`);
  if (!re.test(html)) throw new Error(`index.html has no <!-- gen:${name} --> marker`);
  return html.replace(re, (m, pad) => `${pad}<!-- gen:${name} -->\n${body}\n${pad}<!-- /gen:${name} -->`);
}
function write(sizes, breaks) {
  let html = fs.readFileSync(INDEX, 'utf8');
  html = fill(html, 'lede', '    ' + ledeHTML());
  html = fill(html, 'nav', '        ' + navHTML());
  html = fill(html, 'cards', sections.map(x => sectionHTML(x, sizes, breaks)).join('\n'));
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
function fitBatch(bin, port, from, to) {
  const url = `http://127.0.0.1:${port}/_fit.html?max=${MAX_FS}&safety=${SAFETY}&from=${from}&to=${to}&force=${encodeURIComponent(JSON.stringify(BREAKS))}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'no017-'));
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ['--no-sandbox', '--headless', '--hide-scrollbars', '--window-size=1400,1000', '--virtual-time-budget=60000', '--timeout=90000',
      `--user-data-dir=${profile}`, '--dump-dom', url], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    const guard = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(`headless browser timed out on cards ${from}-${to}`)); }, 120000);
    p.stdout.on('data', d => { out += d; });
    p.on('close', () => {
      clearTimeout(guard);
      fs.rmSync(profile, { recursive: true, force: true });
      const m = out.match(/<pre id="out">([\s\S]*?)<\/pre>/);
      if (!m) return reject(new Error(`the fit page produced nothing for cards ${from}-${to}`));
      const res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      if (res.error) return reject(new Error('fit page: ' + res.error));
      resolve(res);
    });
  });
}
// the cards in batches, a few headless browsers at a time
async function fit() {
  const bin = chrome();
  if (!bin) throw new Error('no headless Chrome found (set CHROME=/path/to/chrome-headless-shell)');
  const server = await serve();
  try {
    const jobs = [];
    for (let from = 0; from < wall.length; from += BATCH) jobs.push([from, Math.min(wall.length, from + BATCH)]);
    const all = { fonts: true, sizes: {} };
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const [from, to] = jobs[next++];
        const res = await fitBatch(bin, server.address().port, from, to);
        all.fonts = all.fonts && res.fonts;
        Object.assign(all.sizes, res.sizes);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, jobs.length) }, worker));
    return all;
  } finally {
    server.close();
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
  // --report <file>: every card's chosen lines and the rules it met, for reviewing the rag
  const ri = process.argv.indexOf('--report');
  if (ri > 0) fs.writeFileSync(process.argv[ri + 1], JSON.stringify(wall.map(c => ({ id: c.s.id, ...res.sizes[c.s.id] })), null, 1));
  if (weak.length) console.log(`${weak.length} cards keep a fault (no better rag within 75% of the largest size): ${weak.join(', ')}`);
  report(before);
  const list = wall.map(c => ({ id: c.s.id, words: c.words, ...res.sizes[c.s.id] })).sort((a, b) => a.fs - b.fs);
  console.log(`sizes: ${list[0].fs} cqw (${list[0].id}, ${list[0].words} words) to ${list.at(-1).fs} cqw (${list.at(-1).id}, ${list.at(-1).words} words)`);
})().catch(e => { console.error('works/017/_cards.js: ' + e.message); process.exit(1); });

function report(before) {
  const after = fs.readFileSync(INDEX, 'utf8');
  console.log(`${wall.length} cards; index.html ${before === after ? 'unchanged' : 'updated'}`);
}
