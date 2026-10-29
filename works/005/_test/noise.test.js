import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeNoise } from '../noise.js';

test('noise is deterministic per seed and stays in range', () => {
  const a = makeNoise(7), b = makeNoise(7), c = makeNoise(8);
  let differs = false;
  for (let i = 0; i < 2000; i++) {
    const x = i * 0.37 - 300, y = i * 0.11 + 40;
    const n = a.noise2(x, y);
    assert.equal(n, b.noise2(x, y));
    assert.ok(n >= -1 && n <= 1);
    const r = a.ridged(x, y);
    assert.ok(r >= 0 && r <= 1);
    assert.ok(Math.abs(a.fbm(x, y)) <= 1);
    if (n !== c.noise2(x, y)) differs = true;
  }
  assert.ok(differs);
});
