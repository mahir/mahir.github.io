import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePath, blend, beats, T } from '../path.js';
import { buildTerrain, sampler, monotone } from '../terrain.js';
import { decode, seedOf, YEAR } from '../data.js';
import { makeScale, FLOOR } from '../scale.js';
import { weatherFor } from '../weather.js';
import { prices, project } from './helpers.js';

function setup(t, aspect) {
  const d = decode(prices, t);
  const scale = makeScale(d.lo, d.hi);
  const terrain = buildTerrain({ ...d, scale, seed: seedOf(t), quality: 'low' });
  const crest = monotone(d.closes.map(scale.alt), scale.L / (YEAR - 1));
  const { cloudBase } = weatherFor(d.change);
  return { d, scale, cloudBase, path: makePath({ scale, crest, aspect, cloudBase, ground: sampler(terrain) }), ground: sampler(terrain) };
}

const points = (d, scale, stretch = 1) => d.closes.map((c, i) => [scale.dayX(i), FLOOR + (scale.alt(c) - FLOOR) * stretch, 0]);

for (const t of ['BRK.B', 'NFLX', 'MRNA']) {
  for (const aspect of [16 / 9, 9 / 19.5]) {
    test(`${t} at ${aspect.toFixed(2)}: the chart and the rest frame the whole year`, () => {
      const { d, scale, path } = setup(t, aspect);
      for (const p of points(d, scale, path.stretch)) {
        const s = project(path.chart, aspect, p);
        assert.ok(Math.abs(s.x) < 1 && Math.abs(s.y) < 1 && s.depth > 0, 'chart');
      }
      const seen = points(d, scale).map((p) => project(path.rest, aspect, p)).filter((s) => Math.abs(s.x) < 1 && Math.abs(s.y) < 1 && s.depth > 0);
      assert.ok(seen.length >= (aspect > 1 ? YEAR : YEAR * 0.9), `rest shows ${seen.length} days`);
    });

    test(`${t} at ${aspect.toFixed(2)}: the camera stays out of the cloud deck and above the ground`, () => {
      const { path, cloudBase, ground } = setup(t, aspect);
      for (let s = T.flight; s <= T.rest + 30; s += 0.1) {
        const { pos } = path.at(s);
        assert.ok(pos[1] > ground(pos[0], pos[2]) + 60, `t=${s.toFixed(1)} below ground`);
      }
      for (const k of [path.wide, ...path.along, path.rest]) assert.ok(k.pos[1] < cloudBase - 200 || k.pos[1] > cloudBase + 300);
    });
  }
}

test('blend starts and ends on its poses', () => {
  const a = { pos: [0, 0, 100000], target: [0, 0, 0], fov: 1.4 }, b = { pos: [300, 900, 4000], target: [100, 200, -50], fov: 40 };
  const close = (p, q) => p.every((v, i) => Math.abs(v - q[i]) < 1e-6);
  assert.ok(close(blend(a, b, 0).pos, a.pos) && close(blend(a, b, 1).pos, b.pos));
  assert.ok(Math.abs(blend(a, b, 1).fov - 40) < 1e-9);
});

test('the beats run in order', () => {
  assert.equal(beats(0).draw, 0);
  assert.equal(beats(T.tip).draw, 1);
  assert.equal(beats(T.tip).stretch, 1);
  assert.equal(beats(T.flight).stretch, 0);
  assert.equal(beats(T.flight).rise, 1);
  assert.equal(beats(T.rest + 1).line, 0);
});
