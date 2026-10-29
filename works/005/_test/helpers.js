import { readFileSync } from 'node:fs';

export const prices = JSON.parse(readFileSync(new URL('../prices.json', import.meta.url), 'utf8'));

// A made-up year: a 450-day ramp with a wiggle, on the real calendar's length.
export function fakeJson(closes = Array.from({ length: 451 }, (_, i) => 100 + i * 0.2 + 5 * Math.sin(i / 7))) {
  return {
    through: '2026-10-28',
    dates: Array.from({ length: closes.length }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`),
    tickers: [{ t: 'AAA', name: 'Aaa', closes }, { t: 'BRK.B', name: 'Berkshire Hathaway', closes }, { t: 'CCC', name: 'Ccc', closes }],
  };
}

export { project } from '../path.js';
