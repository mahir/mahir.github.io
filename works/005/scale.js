// Real scale: altitude is the log of the price, so equal percentage moves climb equally wherever they happen, and the
// tree line, snow line and clouds stay at fixed heights. A quiet year stays in the foothills; a doubling reaches snow.

import { YEAR } from './data.js';

export const FLOOR = 300; // m, the year's low
export const K = 4300; // m per unit of ln(price): a doubling is about 3,000 m of relief
export const EVEREST = 8848;
export const TREE_LINE = 1900;
export const SNOW_LINE = 2800;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function makeScale(lo, hi) {
  const span = Math.log(hi / lo);
  const relief = Math.min(K * span, EVEREST - FLOOR);
  const k = span > 0 ? relief / span : K; // shrinks only past Everest
  // the year's length keeps a chart's proportions: short hills for a quiet year, a long range for a wild one
  const L = clamp(10 * relief, 8000, 32000);
  return {
    lo, hi, k, relief, L,
    alt: (price) => FLOOR + k * Math.log(price / lo),
    dayX: (i) => (i * L) / (YEAR - 1),
  };
}
