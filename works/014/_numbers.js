#!/usr/bin/env node
// Writes each city's reach from its first start point into index.html, so the page has its numbers
// without scripts (search engines and AI assistants read it that way). Run after _streets.py:
//   node works/014/_numbers.js
// Running it twice changes nothing.
const fs = require('fs'), path = require('path');
const W = require('./walk.js');
const page = path.join(__dirname, 'index.html');
let html = fs.readFileSync(page, 'utf8');
const rows = [];
html = html.replace(/(<article class="city" id="([a-z]+)"[\s\S]*?<p class="reach">)<b>[^<]*<\/b><span>[^<]*<\/span>/g, (all, head, slug) => {
  const file = path.join(__dirname, 'data', slug + '.json');
  if (!fs.existsSync(file)) { rows.push(`${slug.padEnd(10)} no data`); return all; }
  const w = W.walk(W.graph(JSON.parse(fs.readFileSync(file, 'utf8'))), 0, 0);
  const pct = Math.round(100 * W.share(w, W.SECONDS)), km = W.km2(w, W.SECONDS).toFixed(1);
  rows.push(`${slug.padEnd(10)} ${String(pct).padStart(3)}%  ${km} km²   starts ${Math.hypot(w.x, w.y).toFixed(0)} m from the point given   5 min ${Math.round(100 * W.share(w, 300))}%  10 min ${Math.round(100 * W.share(w, 600))}%`);
  return `${head}<b>${pct}%</b><span>${km} km²</span>`;
});
fs.writeFileSync(page, html);
console.log(rows.join('\n'));
