import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherFor, ANCHORS, moodOf, sunDirection } from '../weather.js';

test('the anchors are hit exactly and the ends clamp', () => {
  assert.equal(weatherFor(0.3).visibility, ANCHORS.golden.visibility);
  assert.equal(weatherFor(0.9).cloudCover, ANCHORS.golden.cloudCover);
  assert.equal(weatherFor(0).cloudBase, ANCHORS.overcast.cloudBase);
  assert.deepEqual(weatherFor(-0.5).zenith, ANCHORS.storm.zenith);
  assert.equal(moodOf(-2), -1);
});

test('in between, the weather moves one way', () => {
  let prev = -Infinity;
  for (let c = 0; c <= 0.3; c += 0.01) { const v = weatherFor(c).visibility; assert.ok(v >= prev); prev = v; }
  prev = Infinity;
  for (let c = 0; c >= -0.3; c -= 0.01) { const v = weatherFor(c).cloudDark; assert.ok(v >= prev || prev === Infinity); prev = v; }
});

test('the sun direction is a unit vector, up when the sun is up', () => {
  const d = sunDirection(weatherFor(0.4));
  assert.ok(Math.abs(Math.hypot(...d) - 1) < 1e-9);
  assert.ok(d[1] > 0);
  assert.ok(d[0] < 0); // a golden morning lights the ridge from the left
});
