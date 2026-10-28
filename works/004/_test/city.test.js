import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAME, MX, MY, HEIGHT, toWorld, parseLand } from '../geo.js';
import { LANDMARKS } from '../landmarks.js';
import { assignOwners, makeCity, CLEAR } from '../city.js';
import { ROUTES, BOAT_LOOPS } from '../routes.js';
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

test('city is deterministic and clear around landmarks', () => {
  const o = assignOwners(L, ls);
  const a = makeCity(L, o, ls, 4), b = makeCity(L, o, ls, 4);
  assert.deepEqual(a, b);
  assert.ok(a.houses.length > 0);
  for (const h of [...a.houses, ...a.trees]) {
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

test('small boats loop on open water', () => {
  const land = realLand();
  assert.equal(BOAT_LOOPS.length, 6);
  for (const b of BOAT_LOOPS) {
    const c = toWorld(b.lat, b.lon);
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2, x = c.x + b.rx * Math.cos(a), z = c.z + b.rz * Math.sin(a);
      // 30 m of water on every side of the boat's path
      for (const [dx, dz] of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30]]) assert.equal(land.regionAt(x + dx, z + dz), 0, `${b.id} at angle ${k}`);
    }
  }
});

test('real map: small mosques scattered through every neighborhood, never crowded', () => {
  const land = realLand(), o = assignOwners(land, LANDMARKS), city = makeCity(land, o, LANDMARKS);
  const ms = city.mosques;
  assert.ok(ms.length > 120 && ms.length < 600, `${ms.length} mosques`);
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    assert.equal(o[land.index(m.x, m.z)], m.owner);
    for (let j = i + 1; j < ms.length; j++) assert.ok(Math.hypot(m.x - ms[j].x, m.z - ms[j].z) >= 350, 'mosques too close');
  }
  for (const lm of LANDMARKS.filter((l) => l.ownsLand)) assert.ok(ms.some((m) => LANDMARKS[m.owner] === lm), lm.id);
});

test('real map: houses vary, trees include cypresses', () => {
  const land = realLand(), o = assignOwners(land, LANDMARKS), city = makeCity(land, o, LANDMARKS);
  const walls = new Set(city.houses.map((h) => h.wall)), roofs = new Set(city.houses.map((h) => h.roof));
  assert.ok(walls.size >= 6 && roofs.size >= 5);
  assert.ok(city.houses.every((h) => Math.abs(h.rot) <= 0.2));
  const kinds = new Set(city.trees.map((t) => t.kind));
  assert.deepEqual([...kinds].sort(), ['cypress', 'round']);
});
