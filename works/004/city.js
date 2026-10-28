// The ordinary city. Every land cell belongs to the nearest landmark on its own shore and rises when that landmark
// is placed, so placing every landmark that owns land builds all of it. Seeded, so every visit grows the same city.

import { toWorld } from './geo.js';

export const HOUSE_CHANCE = 0.82;
export const TREE_CHANCE = 0.08;
export const STOREY = 3.2;
export const HEIGHT_SCALE = 2; // a little taller than true, so the city reads as packed from above
export const CLEAR = 150; // metres kept open around a landmark, unless it names its own `clear`
const GULHANE = { lat: 41.0130, lon: 28.9813, radius: 260 }; // the park below Topkapı: trees, never houses

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assignOwners(land, landmarks) {
  const owners = new Int16Array(land.region.length).fill(-1);
  const at = landmarks.map((m) => (m.ownsLand ? { ...toWorld(m.lat, m.lon), region: m.region } : null));
  for (let i = 0; i < owners.length; i++) {
    const r = land.region[i];
    if (!r) continue;
    const c = land.center(i);
    let best = Infinity;
    at.forEach((p, k) => {
      if (!p || p.region !== r) return;
      const d = (p.x - c.x) ** 2 + (p.z - c.z) ** 2;
      if (d < best) { best = d; owners[i] = k; }
    });
  }
  return owners;
}

export function makeCity(land, owners, landmarks, seed = 4) {
  const rnd = mulberry32(seed);
  const at = landmarks.map((m) => toWorld(m.lat, m.lon));
  const keepClear = landmarks.map((m, k) => m.ownsLand && { ...at[k], r: m.clear ?? CLEAR }).filter(Boolean);
  const park = { ...toWorld(GULHANE.lat, GULHANE.lon), r: GULHANE.radius };
  const near = (c, p) => Math.hypot(c.x - p.x, c.z - p.z) < p.r;
  const houses = [], trees = [];
  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    if (owner < 0) continue;
    const c = land.center(i);
    // draw every number for every cell, so one cell's outcome never shifts another's
    const kind = rnd(), w = land.cell * (0.72 + 0.2 * rnd()), d = land.cell * (0.72 + 0.2 * rnd());
    const jx = (rnd() - 0.5) * (land.cell - w), jz = (rnd() - 0.5) * (land.cell - d);
    const storeys = 3 + Math.floor(rnd() * 4), roof = Math.floor(rnd() * 4), wall = Math.floor(rnd() * 3);
    if (keepClear.some((p) => near(c, p))) continue;
    const delay = Math.min(2, Math.hypot(c.x - at[owner].x, c.z - at[owner].z) / 1500);
    if (near(c, park) || (kind >= HOUSE_CHANCE && kind < HOUSE_CHANCE + TREE_CHANCE)) {
      trees.push({ x: c.x + jx, z: c.z + jz, r: land.cell * (0.3 + 0.15 * (w / land.cell)), owner, delay });
    } else if (kind < HOUSE_CHANCE) {
      houses.push({ x: c.x + jx, z: c.z + jz, w, d, h: storeys * STOREY * HEIGHT_SCALE, roof, wall, owner, delay });
    }
  }
  return { houses, trees };
}

// Instances in the order they will rise: grouped by owner, earliest first, so each neighborhood is one run of the
// instance buffers and a rise touches, and uploads, only its own run. Owner k runs from start[k] to start[k + 1].
export function riseOrder(items, ownerCount) {
  const sorted = [...items].sort((a, b) => a.owner - b.owner || a.delay - b.delay);
  const start = new Int32Array(ownerCount + 1);
  for (const it of sorted) start[it.owner + 1]++;
  for (let k = 0; k < ownerCount; k++) start[k + 1] += start[k];
  return { items: sorted, start };
}

// Within one run (delays sorted, in seconds), t ms after placing: everything before lo is already grown,
// items up to hi have started growing, and items before next have finished.
export function riseWindow(delays, lo, t, rise, grow) {
  let hi = lo;
  while (hi < delays.length && t >= rise + delays[hi] * 1000) hi++;
  let next = lo;
  while (next < hi && t >= rise + delays[next] * 1000 + grow) next++;
  return { hi, next };
}
