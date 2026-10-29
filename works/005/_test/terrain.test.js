import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grid, monotone, buildTerrain, sampler, crestLine, FOOT } from '../terrain.js';
import { decode, seedOf, YEAR } from '../data.js';
import { makeScale } from '../scale.js';
import { prices } from './helpers.js';

const land = (t, quality = 'low') => {
  const d = decode(prices, t);
  const scale = makeScale(d.lo, d.hi);
  return { d, scale, terrain: buildTerrain({ ...d, scale, seed: seedOf(t), quality }) };
};

test('grid: every day falls on a column, and z = 0 is a row', () => {
  for (const q of ['low', 'high']) {
    const g = grid(24000, q);
    for (let i = 0; i < YEAR; i++) assert.ok(Math.abs(g.xs[g.dayCol(i)] - (i * 24000) / (YEAR - 1)) < 1e-2);
    assert.equal(g.zs[g.zero], 0);
    for (let r = 1; r < g.rows; r++) assert.ok(g.zs[r] > g.zs[r - 1]);
  }
});

test('the monotone cubic goes through every point and never overshoots', () => {
  const ys = [0, 5, 5, 2, 9, 1, 1.5, 30, 0];
  const f = monotone(ys, 10);
  ys.forEach((y, i) => assert.ok(Math.abs(f(i * 10) - y) < 1e-9));
  for (let x = 0; x <= 80; x += 0.25) {
    const i = Math.min(7, Math.floor(x / 10));
    assert.ok(f(x) <= Math.max(ys[i], ys[i + 1]) + 1e-9 && f(x) >= Math.min(ys[i], ys[i + 1]) - 1e-9, `x=${x}`);
  }
});

// a flat year, a falling one, the wildest, and the one that crashed hardest
for (const t of ['BRK.B', 'NKE', 'MRNA', 'COIN']) {
  test(`${t}: the crest is exact, and the highest point of its cross-section`, () => {
    const { d, scale, terrain } = land(t);
    const { heights, cols, zero, dayCol, zs, rows } = terrain;
    let checked = 0;
    for (let i = 0; i < YEAR; i++) {
      const alt = scale.alt(d.closes[i]);
      const c = dayCol(i);
      const h = heights[zero * cols + c];
      if (alt - FOOT < 300) continue; // the plain can round off the lowest passes
      assert.ok(Math.abs(h - alt) < 0.5, `day ${i}: ${h} vs ${alt}`);
      for (let r = 0; r < rows; r++) {
        if (Math.abs(zs[r]) < 0.06 * scale.L) assert.ok(heights[r * cols + c] <= alt + 0.5, `day ${i} row ${r}`);
      }
      checked++;
    }
    assert.ok(checked > YEAR * 0.5, `only ${checked} days checked`);
  });
}

test('the same ticker always makes the same land', () => {
  const a = land('NFLX').terrain, b = land('NFLX').terrain;
  assert.deepEqual(a.heights.slice(0, 5000), b.heights.slice(0, 5000));
  assert.equal(a.maxH, b.maxH);
});

test('normals point up and the sampler matches grid points', () => {
  const { terrain } = land('AAPL');
  const at = sampler(terrain);
  for (let i = 0; i < terrain.normals.length; i += 3 * 997) assert.ok(terrain.normals[i + 1] > 0);
  const r = terrain.zero, c = terrain.dayCol(100);
  assert.ok(Math.abs(at(terrain.xs[c], terrain.zs[r]) - terrain.heights[r * terrain.cols + c]) < 1e-3);
});

test('the chart line is the crest', () => {
  const d = decode(prices, 'NFLX');
  const scale = makeScale(d.lo, d.hi);
  const line = crestLine(d.closes, scale, 4);
  assert.equal(line.length, ((YEAR - 1) * 4 + 1) * 3);
  assert.ok(Math.abs(line[1] - scale.alt(d.closes[0])) < 0.01); // stored as 32-bit floats
  assert.ok(Math.abs(line[line.length - 2] - scale.alt(d.last)) < 0.01);
});
