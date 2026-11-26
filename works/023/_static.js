// node works/023/_static.js [--check]
// Writes the kept world, No. 13, into index.html as a table, for readers without scripts:
// the world with its feed, and the same crowd searching. With --check it changes nothing and
// fails if the table is out of date.
'use strict';
const fs = require('fs'), path = require('path');
const World = require('./world.js');
const KEPT = 13;

function table() {
  const feed = World.Run(KEPT), search = World.Run(KEPT, { delta: { mode: 'search' } });
  feed.more(); search.more();
  const pct = (x) => Math.round(x * 100) + '%';
  const rows = [];
  for (let y = 0; y <= 20; y += 2) {
    const m = y * 12;
    rows.push(`<tr><td>${y}</td><td>${pct(Math.min(1, feed.rec.spread[m]))}</td><td>${m ? pct(feed.rec.half[m]) : '–'}</td><td>${pct(Math.min(1, search.rec.spread[m]))}</td><td>${m ? pct(search.rec.half[m]) : '–'}</td></tr>`);
  }
  return [
    '<table>',
    `<caption>World No. ${KEPT}. ${World.describe(feed.C)} ${World.P.shoppers.toLocaleString('en-US')} shoppers and ${feed.C.catalog} things for sale. “Ground” is the share of the map the crowd lives on, against where it started; “half” is the share of the catalog that got half of the month’s showings.</caption>`,
    '<thead><tr><th>Year</th><th>Ground, with the feed</th><th>Half, with the feed</th><th>Ground, searching</th><th>Half, searching</th></tr></thead>',
    '<tbody>', ...rows, '</tbody>', '</table>',
  ].join('\n');
}

if (require.main === module) {
  const file = path.join(__dirname, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const next = html.replace(/<!-- kept -->[\s\S]*?<!-- \/kept -->/, `<!-- kept -->\n${table()}\n<!-- /kept -->`);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('The table in index.html is out of date: run node works/023/_static.js'); process.exit(1); }
  } else if (next !== html) { fs.writeFileSync(file, next); console.log('wrote the kept world into index.html'); } else console.log('index.html is up to date');
}
module.exports = { KEPT };
