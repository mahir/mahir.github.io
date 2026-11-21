// node works/021/_static.js
// Writes the kept sky (frozen.js) into index.html as a plain table, between the
// <!-- sky --> markers, for readers without scripts. Run it after changing frozen.js or
// the rules in sky.js. `--check` writes nothing and fails if the table is stale.
'use strict';
const fs = require('fs'), path = require('path');
const Sky = require('./sky.js'), F = require('./frozen.js');

const KIND = { melt: 'above freezing: nothing', dry: 'too dry: nothing', thin: 'thin plates', column: 'columns: it thickens', plate: 'a plate', sector: 'broad arms', star: 'branches', cold: 'a thick plate' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const stamp = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d:\d\d)/.exec(iso); return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}, ${m[4]}`; };
const deg = (t) => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t).toFixed(1) + '°';

function table() {
  const snd = Sky.sounding(F.answer);
  const rows = snd.points.map((p) => {
    const L = Sky.layer(p.t, p.rh);
    return `<tr><td>${p.ground ? 'ground, ' : ''}${Math.round(p.z).toLocaleString('en-US')} m</td><td>${deg(p.t)}</td><td>${Math.round(p.rh)}%</td><td>${p.t < 0 ? Math.round(L.rhi) + '%' : ''}</td><td>${L.spare > 0 ? L.spare.toFixed(2) : '0'}</td><td>${KIND[L.kind]}</td></tr>`;
  });
  return [
    '<table>',
    `<caption>The air over ${F.town} at ${stamp(F.answer.current.time)} local time, from Open-Meteo.</caption>`,
    '<thead><tr><th>Height</th><th>Temperature</th><th>Humidity</th><th>Over ice</th><th>To spare, g/m³</th><th>What grows there</th></tr></thead>',
    '<tbody>', ...rows, '</tbody>', '</table>',
  ].join('\n');
}

const file = path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const next = html.replace(/<!-- sky -->[\s\S]*?<!-- \/sky -->/, `<!-- sky -->\n${table()}\n<!-- /sky -->`);
if (process.argv.includes('--check')) {
  if (next !== html) { console.error('index.html: the kept sky table is stale. Run node works/021/_static.js'); process.exit(1); }
  console.log('index.html: the kept sky table is current');
} else if (next !== html) { fs.writeFileSync(file, next); console.log('index.html: wrote the kept sky'); }
else console.log('index.html: nothing to change');
