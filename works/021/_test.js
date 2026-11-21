// node works/021/_test.js
// Checks the parts that cannot be judged by eye: the vapor arithmetic, Nakaya's
// boundaries, that the kept sky grows a crystal and grows the same one twice, and that
// the table in index.html matches it.
'use strict';
const assert = require('assert');
const Sky = require('./sky.js'), Reiter = require('./reiter.js'), F = require('./frozen.js'), TOWNS = require('./towns.js');

// below freezing, air saturated over water has vapor to spare over ice; the most near -12 °C, about 0.22 g/m³
let peak = { t: 0, s: 0 };
for (let t = -0.5; t >= -40; t -= 0.5) {
  assert(Sky.overWater(t) > Sky.overIce(t), 'water above ice at ' + t);
  const s = Sky.density(Sky.overWater(t) - Sky.overIce(t), t);
  if (s > peak.s) peak = { t, s };
}
assert(peak.t <= -10 && peak.t >= -14, 'peak of the spare vapor is at ' + peak.t);
assert(Math.abs(peak.s - 0.22) < 0.02, 'peak spare vapor is ' + peak.s);
assert(Math.abs(Sky.overWater(0) - 6.11) < 0.02 && Math.abs(Sky.overIce(0) - 6.11) < 0.02, 'both 6.11 hPa at 0 °C');

// the kinds, by temperature, in saturated air
const kind = (t) => Sky.layer(t, 100).kind;
assert.strictEqual(kind(1), 'melt');
assert.strictEqual(kind(-1.5), 'thin');
assert.strictEqual(kind(-5), 'column');
assert.strictEqual(kind(-15), 'star');
assert.strictEqual(kind(-30), 'cold');
assert.strictEqual(Sky.layer(-15, 40).kind, 'dry');
assert.strictEqual(Sky.widens(-5), 0, 'a column does not widen');
assert.strictEqual(Sky.widens(-15), 1);
// more vapor near -15 °C means more ornate, and the automaton's far air thins as it does
assert(Sky.layer(-15, 100).ornate > Sky.layer(-15, 85).ornate && Sky.layer(-15, 100).ornate > Sky.layer(-20, 100).ornate);
assert(Sky.numbers(1).beta < Sky.numbers(0.5).beta && Sky.numbers(0.5).beta < Sky.numbers(0).beta);

// folding: all twelve images of a cell land on the same wedge cell
const grid = Reiter.Grid(200);
for (const [q, r] of [[5, 3], [17, -4], [0, 9], [-30, 12]]) {
  const want = Reiter.fold(q, r).join();
  const s = -q - r;
  for (const [a, b] of [[q, r], [r, s], [s, q], [-q, -r], [-r, -s], [-s, -q], [r, q], [s, r], [q, s], [-r, -q], [-s, -r], [-q, -s]]) assert.strictEqual(Reiter.fold(a, b).join(), want);
}

// the kept sky
const snd = Sky.sounding(F.answer), plan = Sky.plan(snd);
assert(!plan.empty, 'the kept sky grows a crystal');
assert(plan.top > plan.ground && plan.slices.length === Sky.SLICES);
const a = Sky.grow(Reiter, grid, plan), b = Sky.grow(Reiter, grid, plan);
assert(a.tip > 30 && a.tip <= Sky.MOST + 2, 'tip ' + a.tip);
assert.strictEqual(a.count, b.count, 'the same sky grows the same crystal');
let late = 0;
for (let i = 0; i < grid.n; i++) { if (a.ice[i]) { assert(a.born[i] >= 0 && a.born[i] <= 1); if (a.born[i] > late) late = a.born[i]; } else assert.strictEqual(a.born[i], -1); }
// nothing freezes in air above 0 °C
const lastGrow = plan.slices.filter((s) => s.grow > 0).pop();
assert(late <= lastGrow.p + 1e-6, 'no ice after the last layer that grows');
assert(plan.slices.every((s) => s.t < 0 || s.grow === 0), 'no growth above freezing');

// a dry sky grows nothing, and still has a plan to draw
const dry = JSON.parse(JSON.stringify(F.answer));
for (const k of Object.keys(dry.hourly)) if (k.startsWith('relative_humidity')) dry.hourly[k] = [20];
const none = Sky.plan(Sky.sounding(dry));
assert(none.empty && none.slices.length === Sky.SLICES);

// towns: named once, on the map, and the kept one is among them
assert.strictEqual(new Set(TOWNS.map((t) => t.name)).size, TOWNS.length);
assert(TOWNS.every((t) => Math.abs(t.lat) <= 90 && Math.abs(t.lon) <= 180));
assert(TOWNS.some((t) => t.name === F.town));
const html = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
assert(html.includes(`which of ${TOWNS.length} towns`), 'index.html names the number of towns');

require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '_static.js'), '--check'], { stdio: 'inherit' });
console.log(`ok: kept sky over ${F.town} grows ${a.count} wedge cells to a tip of ${a.tip}; vapor to spare peaks at ${peak.t} °C, ${peak.s.toFixed(3)} g/m³`);
