import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAME, MX, MY, HEIGHT, toWorld, parseLand } from '../geo.js';
import { LANDMARKS } from '../landmarks.js';
import { assignOwners, makeCity, CLEAR } from '../city.js';
import { ROUTES } from '../routes.js';
import { realLand } from './helpers.js';

// A strip of two shores: columns 0-4 are the peninsula (1), 5-9 the Asian side (3), one water cell in the corner.
const L = parseLand({ cell: 40, cols: 10, rows: 3, rows_n_to_s: ['1111133333', '1111133333', '1111133330'] });
const at = (c, r) => ({ lon: FRAME.west + (c + 0.5) * 40 / MX, lat: FRAME.south + (HEIGHT - (r + 0.5) * 40) / MY });
const A = { id: 'a', ...at(0, 1), region: 1, ownsLand: true };
const B = { id: 'b', ...at(5, 1), region: 3, ownsLand: true };
const C = { id: 'c', ...at(9, 0), region: 0, ownsLand: false };
const ls = [A, B, C];
const colX = (c) => L.center(c).x, rowZ = (r) => L.center(r * L.cols).z;
const dist = (p, m) => { const w = toWorld(m.lat, m.lon); return Math.hypot(p.x - w.x, p.z - w.z); };

test('owners: nearest landmark on the same shore', () => {
  const o = assignOwners(L, ls);
  assert.equal(o[L.index(colX(4), rowZ(0))], 0); // B is nearer, but on the other shore
  assert.equal(o[L.index(colX(6), rowZ(2))], 1);
  assert.ok(![...o].includes(2)); // landmarks that own no land own nothing
  assert.equal(o[L.index(colX(9), rowZ(2))], -1); // water
});

test('city is deterministic, staggered and clear around landmarks', () => {
  const o = assignOwners(L, ls);
  const a = makeCity(L, o, ls, 4), b = makeCity(L, o, ls, 4);
  assert.deepEqual(a, b);
  assert.ok(a.houses.length > 0);
  for (const h of [...a.houses, ...a.trees]) {
    assert.ok(h.delay >= 0 && h.delay <= 2);
    assert.equal(o[L.index(h.x, h.z)], h.owner);
    for (const m of ls.filter((m) => m.ownsLand)) assert.ok(dist(h, m) >= (m.clear ?? CLEAR));
  }
  assert.notDeepEqual(makeCity(L, o, ls, 5), a);
});

test('real map: every land cell has an owner', () => {
  const land = realLand(), o = assignOwners(land, LANDMARKS);
  land.region.forEach((r, i) => assert.equal(o[i] === -1, r === 0, `cell ${i}`));
});

test('real map: Gülhane is trees, and houses grow by landmark', () => {
  const land = realLand(), o = assignOwners(land, LANDMARKS), city = makeCity(land, o, LANDMARKS);
  const gulhane = toWorld(41.0130, 28.9813);
  assert.ok(!city.houses.some((h) => Math.hypot(h.x - gulhane.x, h.z - gulhane.z) < 260));
  assert.ok(city.trees.some((t) => Math.hypot(t.x - gulhane.x, t.z - gulhane.z) < 260));
  assert.ok(city.houses.length > 10000);
  for (const m of LANDMARKS.filter((m) => m.ownsLand)) {
    assert.ok(city.houses.some((h) => LANDMARKS[h.owner] === m), m.id);
  }
});

// points every step metres along a route's stops, leaving out the first and last `skip` metres (the piers)
function sampleRoute(stops, step, skip) {
  const pts = stops.map(([lat, lon]) => toWorld(lat, lon));
  const out = [];
  let along = 0, total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let d = 0; d < len; d += step) {
      const s = along + d;
      if (s > skip && s < total - skip) out.push({ x: a.x + (b.x - a.x) * d / len, z: a.z + (b.z - a.z) * d / len });
    }
    along += len;
  }
  return out;
}

test('ferry routes stay on water', () => {
  const land = realLand();
  assert.equal(ROUTES.length, 4);
  for (const r of ROUTES) {
    for (const p of sampleRoute(r.stops, 40, 80)) assert.equal(land.regionAt(p.x, p.z), 0, `${r.id} at ${p.x.toFixed(0)},${p.z.toFixed(0)}`);
  }
});
