// Run: node --test "works/004/_test/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAME, toLocal, toWorld, parseLand } from '../geo.js';
import { LANDMARKS } from '../landmarks.js';
import { realLand, nearestLandRegion } from './helpers.js';

test('frame corners', () => {
  assert.deepEqual(toLocal(40.976, 28.945), { x: 0, y: 0 });
  const ne = toLocal(41.057, 29.052);
  assert.ok(Math.abs(ne.x - 8987) < 5 && Math.abs(ne.y - 8987) < 5);
  const c = toWorld(41.0165, 28.9985);
  assert.ok(Math.abs(c.x) < 1 && Math.abs(c.z) < 1);
  assert.ok(toWorld(41.05, 29).z < 0); // north is -z
  assert.ok(toWorld(41.0165, 29.04).x > 0); // east is +x
});

test('parseLand fixture', () => {
  const L = parseLand({ cell: 40, cols: 3, rows: 2, rows_n_to_s: ['013', '200'] });
  const p = L.center(2);
  assert.equal(L.regionAt(p.x, p.z), 3);
  assert.equal(L.region[3], 2);
  assert.equal(L.index(1e6, 0), -1);
  assert.equal(L.regionAt(1e6, 0), 0);
  assert.equal(L.index(p.x, p.z), 2);
});

test('real land.json: landmarks on their shore', () => {
  const L = realLand();
  assert.equal(L.cols, 225);
  for (const m of LANDMARKS.filter((m) => m.ownsLand)) {
    assert.equal(nearestLandRegion(L, toWorld(m.lat, m.lon), 120), m.region, m.id);
  }
});

test('landmarks table', () => {
  assert.equal(LANDMARKS.length, 13);
  assert.equal(new Set(LANDMARKS.map((m) => m.id)).size, 13);
  for (const m of LANDMARKS) {
    assert.ok(m.lat > FRAME.south && m.lat < FRAME.north && m.lon > FRAME.west && m.lon < FRAME.east, m.id);
  }
  for (const m of LANDMARKS.filter((m) => m.from)) {
    assert.ok(Math.abs(m.lat - (m.from[0] + m.to[0]) / 2) < 1e-9 && Math.abs(m.lon - (m.from[1] + m.to[1]) / 2) < 1e-9, m.id);
  }
});
