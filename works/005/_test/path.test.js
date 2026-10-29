import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePath, blend, beats, flightClock, T } from '../path.js';
import { buildTerrain, sampler, monotone } from '../terrain.js';
import { decode, seedOf, YEAR } from '../data.js';
import { makeScale, FLOOR } from '../scale.js';
import { weatherFor, deckFor } from '../weather.js';
import { prices, project } from './helpers.js';

function setup(t, aspect) {
  const d = decode(prices, t);
  const scale = makeScale(d.lo, d.hi);
  const terrain = buildTerrain({ ...d, scale, seed: seedOf(t), quality: 'low' });
  const crest = monotone(d.closes.map(scale.alt), scale.L / (YEAR - 1));
  const top = Math.max(...[...d.closes, ...d.ma50, ...d.ma200].map(scale.alt));
  const { base: cloudBase, ceiling } = deckFor(weatherFor(d.change), top);
  return { d, scale, cloudBase, ceiling, path: makePath({ scale, crest, aspect, cloudBase, ceiling, ground: sampler(terrain) }), ground: sampler(terrain) };
}

const points = (d, scale, stretch = 1) => d.closes.map((c, i) => [scale.dayX(i), FLOOR + (scale.alt(c) - FLOOR) * stretch, 0]);

for (const t of ['BRK.B', 'NFLX', 'MRNA', 'DIS', 'COIN']) {
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
      const { path, cloudBase, ceiling, ground } = setup(t, aspect);
      for (let s = T.flight; s <= T.rest + 30; s += 0.1) {
        const { pos } = path.at(s);
        assert.ok(pos[1] > ground(pos[0], pos[2]) + 60, `t=${s.toFixed(1)} below ground`);
      }
      for (const k of [path.wide, ...path.along, path.rest]) assert.ok(k.pos[1] < cloudBase - 200 || (!ceiling && k.pos[1] > cloudBase + 300));
    });
  }
}

test('blend starts and ends on its poses', () => {
  const a = { pos: [0, 0, 100000], target: [0, 0, 0], fov: 1.4 }, b = { pos: [300, 900, 4000], target: [100, 200, -50], fov: 40 };
  const close = (p, q) => p.every((v, i) => Math.abs(v - q[i]) < 1e-6);
  assert.ok(close(blend(a, b, 0).pos, a.pos) && close(blend(a, b, 1).pos, b.pos));
  assert.ok(Math.abs(blend(a, b, 1).fov - 40) < 1e-9);
});

test('the flight clock meets every key on time, never runs back, and sets off and settles without a jolt', () => {
  const times = [8.4, 12.6, 14.7, 16.8, 18.9, 21, 23.1, 25.2, 27.3, 29.4, 34];
  const clock = flightClock(times);
  times.forEach((t, k) => assert.ok(Math.abs(clock(t) - k) < 1e-9, `key ${k}`));
  const dt = 0.01;
  let prev = clock(times[0]), prevSpeed = 0;
  for (let t = times[0] + dt; t <= times.at(-1) + 1e-9; t += dt) {
    const u = clock(t), speed = (u - prev) / dt;
    assert.ok(speed >= -1e-9, `backwards at ${t.toFixed(2)}`);
    assert.ok(Math.abs(speed - prevSpeed) < 0.02, `a jolt at ${t.toFixed(2)}`);
    prev = u; prevSpeed = speed;
  }
  assert.ok((clock(times[0] + dt) - clock(times[0])) / dt < 0.01, 'sets off from a standstill');
  assert.ok((clock(times.at(-1)) - clock(times.at(-1) - dt)) / dt < 0.01, 'settles to a standstill');
});

test('the beats run in order', () => {
  assert.equal(beats(0).draw, 0);
  assert.equal(beats(T.tip).draw, 1);
  assert.equal(beats(T.tip).stretch, 1);
  assert.equal(beats(T.flight).stretch, 0);
  assert.equal(beats(T.flight).rise, 1);
  assert.equal(beats(T.rest + 1).line, 0);
});
