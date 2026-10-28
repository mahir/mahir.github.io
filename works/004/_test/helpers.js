import { readFileSync } from 'node:fs';
import { parseLand } from '../geo.js';

export const realLand = () => parseLand(JSON.parse(readFileSync(new URL('../land.json', import.meta.url))));

// the region of the nearest land cell within radius metres of p, or 0
export function nearestLandRegion(L, p, radius) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < L.region.length; i++) {
    if (!L.region[i]) continue;
    const c = L.center(i), d = Math.hypot(c.x - p.x, c.z - p.z);
    if (d <= radius && d < bestD) { best = L.region[i]; bestD = d; }
  }
  return best;
}
