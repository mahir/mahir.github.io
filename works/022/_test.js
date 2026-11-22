// node works/022/_test.js
// Checks the parts that cannot be judged by eye: the rate law, that a number always draws
// the same river, that every river's valley fits its sheet and holds its river, that hard
// ground and set clay do slow a bank, that the sheet's memory of each cell is in order and
// agrees with where the river is, and that the table in index.html is the kept river's.
'use strict';
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');
const River = require('./river.js'), Draw = require('./draw.js'), { KEPT } = require('./_static.js');
const P = River.P;

// the rate law: in step with curvature up to a bend of radius P.sharp, greatest there, less beyond
const top = 1 / P.sharp;
assert(Math.abs(River.rate(top) - top) < 1e-12);
assert(River.rate(top * 0.5) < River.rate(top) && River.rate(top * 2) < River.rate(top) && River.rate(top * 4) < River.rate(top * 2));
assert(Math.abs(River.rate(top * 1.0001) - River.rate(top * 0.9999)) < 1e-4, 'no jump at the sharpest fast bend');

// characters: every valley is on its sheet and wide enough to bend in, and they do differ
const longs = new Set(), sentences = new Set();
for (let s = 1; s <= 1500; s++) {
  const C = River.character(s);
  assert(C.long >= 48 && C.long <= 127 && C.alpha >= 0.45 && C.alpha <= 1.37 && C.neck >= 1 && C.neck <= 2.5, 'river ' + s + ' is out of range');
  assert(C.kl > 0.01 && C.kl * 1 / C.sub <= 0.1 + 1e-9, 'river ' + s + ' steps too far at once');
  assert(C.hard.length <= 4, 'the shader draws four hard patches');
  for (let x = 0; x <= C.long; x += C.long / 24) {
    const [a, b] = River.walls(C, x);
    assert(a <= C.room + 1e-6 && b >= -C.room - 1e-6, 'river ' + s + ': a wall leaves the sheet');
    assert(a - b >= 5, 'river ' + s + ': the valley closes to ' + (a - b).toFixed(1));
  }
  longs.add(C.long); sentences.add(River.describe(C).replace(/ with \w+ patch(es)? of hard ground/, ''));
}
assert(longs.size > 60 && sentences.size > 40, 'the rivers are of ' + sentences.size + ' kinds');

// one number, one river
const started = Date.now();
const run = River.Run(KEPT); run.more();
assert(Date.now() - started < 10000, 'a run takes ' + (Date.now() - started) + ' ms');
const again = River.Run(KEPT); again.more();
const other = River.Run(KEPT + 1); other.more();
const sum = (r) => { let h = 0; for (let i = 0; i < r.sheet.pool.length; i += 7) h = (h * 31 + r.sheet.pool[i]) >>> 0; return h + ':' + r.channel.cuts.length + ':' + r.channel.winding.toFixed(6); };
assert.strictEqual(sum(run), sum(again), 'the same number draws the same river');
assert.notStrictEqual(sum(run), sum(other), 'another number draws another');

// it stays in its valley, and it does meander
const ch = run.channel, sh = run.sheet, looks = run.looks, C = run.C;
for (let i = 0; i < ch.n; i++) {
  const [a, b] = River.walls(C, ch.x[i]);
  assert(ch.y[i] < a + 0.4 && ch.y[i] > b - 0.4, 'the river is outside its valley at ' + ch.x[i].toFixed(1));
}
const onSheet = ch.cuts.filter((c) => c.sheet);
assert(onSheet.length >= 2, 'loops cut off on the sheet: ' + onSheet.length);
assert(Math.max(...run.stats.winding) > 1.6 && run.stats.winding[0] < 1.1, 'it starts nearly straight and winds');

// its width changes along it, within bounds, and the sheet's water is as wide as the river says
let narrow = 9, wide = 0;
for (let i = 0; i < ch.n; i++) {
  assert(ch.w[i] >= 0.6 - 1e-9 && ch.w[i] <= P.widest + 1e-9, 'a width of ' + ch.w[i]);
  if (ch.x[i] > 0 && ch.x[i] < C.long) { narrow = Math.min(narrow, ch.w[i]); wide = Math.max(wide, ch.w[i]); }
}
assert(wide - narrow > 0.3, 'the river is between ' + narrow.toFixed(2) + ' and ' + wide.toFixed(2) + ' wide');
const waterAt = (px, py) => { const c = Math.floor(px * C.per), r = Math.floor((py + C.wide / 2) * C.per); if (c < 0 || r < 0 || c >= sh.cols || r >= sh.rows) return null; const v = sh.visits(c, r); return v.length > 0 && v[v.length - 1].to === looks; };
let edges = 0, right = 0;
for (let i = 6; i < ch.n - 6; i += 4) {
  if (ch.x[i] < 3 || ch.x[i] > C.long - 3) continue;
  const tx = ch.x[i + 1] - ch.x[i - 1], ty = ch.y[i + 1] - ch.y[i - 1], l = Math.hypot(tx, ty);
  for (const side of [-1, 1]) {
    const inside = waterAt(ch.x[i] - side * ty / l * ch.w[i] * 0.35, ch.y[i] + side * tx / l * ch.w[i] * 0.35);
    if (inside === null) continue;
    edges++; if (inside) right++;
  }
}
assert(edges > 30 && right / edges > 0.97, 'water where the river is wide: ' + right + ' of ' + edges);

// hard ground is slow to cut, and so is a cut-off loop once its clay has set
assert(C.hard.length > 0, 'the kept river has hard ground to show');
const k = C.hard[0];
assert(Math.abs(ch.soft(k[0], k[1]) - C.stiff) < 1e-9, 'the middle of a hard patch');
const loop = onSheet[0], mid = loop.x.length >> 1;
const late = River.Channel(KEPT);
while (late.year < loop.year + 2) late.step();
const fresh = late.soft(loop.x[mid], loop.y[mid]);
while (late.year < loop.year + C.set / 2) late.step();
const half = late.soft(loop.x[mid], loop.y[mid]);
assert(fresh > 0.95 && half < fresh && half >= C.plug, 'clay sets in a loop: ' + fresh.toFixed(2) + ' then ' + half.toFixed(2));

// index.html says the fastest bank anywhere moves about a twentieth of a width a year
let fastest = 0;
P.cols = 384; P.rows = 240;
for (let s = 1; s <= 60; s++) { const r = River.Run(s); r.more(); fastest = Math.max(fastest, r.channel.fastest); }
P.cols = 1536; P.rows = 960;
assert(fastest > 0.035 && fastest < 0.065, 'fastest bank, widths a year: ' + fastest);

// every cell's visits are in order, and none overlap
let most = 0, ponds = 0;
for (let r = 0; r < sh.rows; r += 3) for (let c = 0; c < sh.cols; c += 3) {
  const v = sh.visits(c, r);
  most = Math.max(most, v.length);
  for (let i = 0; i < v.length; i++) {
    assert(v[i].from <= v[i].to && v[i].to <= looks, 'a visit ends before it starts');
    if (i) assert(v[i].from > v[i - 1].to + 1, 'two visits run together');
    if (v[i].lake) {
      ponds++;
      assert(v[i].lake <= P.fill);
      const y = v[i].to * P.every;
      assert(ch.cuts.some((x) => x.year > y && x.year <= y + P.every), 'a pond with no cut-off after year ' + y);
    }
  }
}
assert(most <= 32, 'the shader reads at most 32 visits a cell; one has ' + most);
assert(ponds > 100, 'cut-off loops are marked on the sheet');

// where the river is now, the sheet says water now; where it started, water from the start
const cellOf = (x, y) => [Math.floor(x * C.per), Math.floor((y + C.wide / 2) * C.per)];
let checked = 0;
for (let i = 0; i < ch.n; i += 5) {
  if (ch.x[i] < 1 || ch.x[i] > C.long - 1) continue;
  const [c, r] = cellOf(ch.x[i], ch.y[i]), v = sh.visits(c, r);
  assert(v.length && v[v.length - 1].to === looks, 'the river is at ' + c + ',' + r + ' and the sheet does not say so');
  checked++;
}
assert(checked > 20, 'points of the river checked: ' + checked);
const first = River.Channel(KEPT);
for (let i = 0; i < first.n; i += 9) {
  if (first.x[i] < 1 || first.x[i] > C.long - 1) continue;
  const [c, r] = cellOf(first.x[i], first.y[i]);
  assert.strictEqual(sh.visits(c, r)[0].from, 0);
}

// the inks: twenty, and no century shares one with the next
assert.strictEqual(Draw.RiverInks.length, P.years / 100);
assert.strictEqual(new Set(Draw.RiverInks.map((x) => x.join())).size, 20, 'every century has its own ink');

// the table for readers without scripts
execFileSync(process.execPath, [path.join(__dirname, '_static.js'), '--check'], { stdio: 'inherit' });
console.log(`ok: river No. ${KEPT} (${River.describe(C)}), ${onSheet.length} loops cut off on the sheet, up to ${most} visits to one cell; ${sentences.size} kinds of river in 1,500`);
