import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, pct, day, shortDay, span, moved, summary } from '../format.js';

test('money, change and dates read the site’s way', () => {
  assert.equal(money(61.99), '$61.99');
  assert.equal(money(5123.4), '$5,123.40');
  assert.equal(money(111.217), '$111.22');
  assert.equal(pct(-0.4412), '−44.1%');
  assert.equal(pct(0.123), '+12.3%');
  assert.equal(pct(0.0001), '0.0%');
  assert.equal(day('2026-10-28'), '28 Oct 2026');
  assert.equal(day('2026-01-02'), '2 Jan 2026');
  assert.equal(shortDay('2026-06-30'), '30 Jun');
  assert.equal(span(['2025-10-29', '2026-10-28']), '29 Oct 2025 – 28 Oct 2026');
  assert.equal(moved(-0.444), 'down 44%');
  assert.equal(moved(0.004), 'about level');
});

test('the screen-reader summary', () => {
  const dates = ['2025-10-29', '2026-06-30', '2026-10-02', '2026-10-28'];
  const d = { t: 'NFLX', name: 'Netflix', dates, first: 110.37, last: 61.99, hi: 134.12, lo: 58.1, hiDay: 1, loDay: 2, change: 61.99 / 110.37 - 1 };
  assert.equal(summary(d), 'Netflix (NFLX), the year to 28 Oct 2026: from $110.37 to $61.99, down 44%. High $134.12 on 30 Jun, low $58.10 on 2 Oct.');
});
