import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YEAR, movingAverage, decode, pick, seedOf, normalize } from '../data.js';
import { fakeJson, prices } from './helpers.js';

test('moving averages end on each of the last days', () => {
  const closes = [1, 2, 3, 4, 5, 6];
  assert.deepEqual(movingAverage(closes, 3, 3), [3, 4, 5]); // (2+3+4)/3, (3+4+5)/3, (4+5+6)/3
  assert.deepEqual(movingAverage(closes, 1, 2), [5, 6]);
});

test('decode: the year is the last 252 days, with its high, low and change', () => {
  const json = fakeJson();
  const d = decode(json, 'AAA');
  assert.equal(d.closes.length, YEAR);
  assert.equal(d.ma50.length, YEAR);
  assert.equal(d.ma200.length, YEAR);
  assert.equal(d.dates.length, YEAR);
  assert.equal(d.first, json.tickers[0].closes[451 - 252]);
  assert.equal(d.last, json.tickers[0].closes[450]);
  assert.equal(d.hi, Math.max(...d.closes));
  assert.equal(d.closes[d.loDay], d.lo);
  assert.ok(Math.abs(d.change - (d.last / d.first - 1)) < 1e-12);
  assert.equal(decode(json, 'ZZZ'), null);
});

test('decode works on every company in prices.json', () => {
  for (const { t } of prices.tickers) {
    const d = decode(prices, t);
    assert.ok(d.lo > 0 && d.hi >= d.lo && Number.isFinite(d.ma200[0]), t);
  }
});

test('pick honours ?t=, falls back to random, and avoids the last one shown', () => {
  const json = fakeJson();
  assert.equal(pick(json, { param: 'aaa' }), 'AAA');
  assert.equal(pick(json, { param: 'brk-b' }), 'BRK.B');
  assert.equal(pick(json, { param: 'BRK/B' }), 'BRK.B');
  assert.equal(pick(json, { param: 'NOPE', random: () => 0 }), 'AAA');
  for (const r of [0, 0.4, 0.99999]) assert.notEqual(pick(json, { last: 'AAA', random: () => r }), 'AAA');
  assert.equal(normalize(null), '');
});

test('seeds are stable and differ between tickers', () => {
  assert.equal(seedOf('NFLX'), seedOf('NFLX'));
  assert.notEqual(seedOf('NFLX'), seedOf('NKE'));
});
