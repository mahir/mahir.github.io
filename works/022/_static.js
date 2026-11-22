// node works/022/_static.js [--check]
// Writes the kept river, No. 3, into index.html as a table, for readers without scripts.
// With --check it changes nothing and fails if the table is out of date.
'use strict';
const fs = require('fs'), path = require('path');
const River = require('./river.js');
const KEPT = 3;

function table() {
  const P = River.P, run = River.Run(KEPT), C = run.C;
  run.more();
  const cuts = run.channel.cuts.filter((c) => c.sheet).map((c) => c.year);
  const fmt = (n) => n.toLocaleString('en-US');
  const rows = [];
  for (let y = 0; y <= P.years; y += 200) {
    const n = cuts.filter((c) => c <= y).length;
    rows.push(`<tr><td>${fmt(y)}</td><td>${run.stats.winding[y / P.every].toFixed(1)}</td><td>${n}</td></tr>`);
  }
  return [
    '<table>',
    `<caption>River No. ${KEPT}. ${River.describe(C)} The sheet is ${C.long} of its usual widths long. Its length is given in lengths of its valley. Loops cut off on the sheet, in order, in years ${cuts.map(fmt).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</caption>`,
    '<thead><tr><th>Year</th><th>Length</th><th>Loops cut off so far</th></tr></thead>',
    '<tbody>', ...rows, '</tbody>', '</table>',
  ].join('\n');
}

if (require.main === module) {
  const file = path.join(__dirname, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const next = html.replace(/<!-- river -->[\s\S]*?<!-- \/river -->/, `<!-- river -->\n${table()}\n<!-- /river -->`);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('The table in index.html is out of date: run node works/022/_static.js'); process.exit(1); }
  } else if (next !== html) { fs.writeFileSync(file, next); console.log('wrote the kept river into index.html'); } else console.log('index.html is up to date');
}
module.exports = { KEPT };
