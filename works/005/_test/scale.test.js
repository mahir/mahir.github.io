import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeScale, FLOOR, K, EVEREST } from '../scale.js';

test('altitude is the log of the price above the year’s low', () => {
  const s = makeScale(50, 100);
  assert.equal(s.alt(50), FLOOR);
  assert.ok(Math.abs(s.alt(100) - (FLOOR + K * Math.log(2))) < 1e-9); // a doubling: about 3,000 m
  assert.ok(Math.abs(s.alt(70.71) - FLOOR - (s.alt(100) - FLOOR) / 2) < 1); // halfway in log terms
});

test('nothing taller than Everest', () => {
  const s = makeScale(10, 200);
  assert.ok(Math.abs(s.alt(200) - EVEREST) < 1e-6);
  assert.equal(s.relief, EVEREST - FLOOR);
});

test('the year is longer for a wilder stock, within 8 and 32 km', () => {
  assert.equal(makeScale(100, 101).L, 8000);
  assert.equal(makeScale(10, 200).L, 32000);
  const s = makeScale(50, 100);
  assert.ok(Math.abs(s.L - 10 * s.relief) < 1e-6);
  assert.equal(s.dayX(0), 0);
  assert.ok(Math.abs(s.dayX(251) - s.L) < 1e-9);
});
