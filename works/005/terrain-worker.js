// Builds the land off the main thread while the opening chart draws itself, and hands the arrays back without copying.

import { buildTerrain } from './terrain.js';
import { makeScale } from './scale.js';
import { KINDS, GRANITE } from './kinds.js';

self.onmessage = ({ data }) => {
  const { id, closes, ma50, ma200, lo, hi, seed, quality, kind } = data;
  const { shape } = KINDS.find((k) => k.name === kind) || GRANITE;
  const t = buildTerrain({ closes, ma50, ma200, scale: makeScale(lo, hi), seed, quality, shape });
  const { xs, zs, cols, rows, zero, heights, base, normals, maxH, L } = t;
  self.postMessage({ id, xs, zs, cols, rows, zero, heights, base, normals, maxH, L }, [xs.buffer, zs.buffer, heights.buffer, base.buffer, normals.buffer]);
};
