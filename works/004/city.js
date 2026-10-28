// The ordinary city, standing from the start around the gaps where the landmarks go. Every land cell belongs to the
// nearest landmark on its own shore, its neighborhood, so each one gets its own small mosques. Seeded, so every visit
// shows the same city.

import { toWorld } from './geo.js';

export const HOUSE_CHANCE = 0.82;
export const TREE_CHANCE = 0.08;
export const STOREY = 3.2;
export const HEIGHT_SCALE = 2; // a little taller than true, so the city reads as packed from above
export const CLEAR = 150;
export const MOSQUE_CHANCE = 0.04, MOSQUE_GAP = 350; // metres between neighborhood mosques // metres kept open around a landmark, unless it names its own `clear`
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
  const park = { ...toWorld(GULHANE.lat, GULHANE.lon), r: GULHANE.radius + land.cell / 2 }; // half a cell more, so no house jitters in
  const near = (c, p) => Math.hypot(c.x - p.x, c.z - p.z) < p.r;
  const houses = [], trees = [], mosques = [];
  // every neighborhood has its own small mosques, never closer than MOSQUE_GAP to one another
  const spaced = new Map(), key = (x, z) => `${Math.floor(x / MOSQUE_GAP)},${Math.floor(z / MOSQUE_GAP)}`;
  const roomForMosque = (x, z) => {
    const [gx, gz] = key(x, z).split(',').map(Number);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      for (const m of spaced.get(`${gx + a},${gz + b}`) || []) if (Math.hypot(m.x - x, m.z - z) < MOSQUE_GAP) return false;
    }
    return true;
  };
  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    if (owner < 0) continue;
    const c = land.center(i);
    // draw every number for every cell, so one cell's outcome never shifts another's
    const kind = rnd(), w = land.cell * (0.6 + 0.3 * rnd()), d = land.cell * (0.6 + 0.3 * rnd());
    const jx = (rnd() - 0.5) * (land.cell - w), jz = (rnd() - 0.5) * (land.cell - d);
    const storeys = 3 + Math.floor(rnd() * 4), roofPick = rnd(), wall = Math.floor(rnd() * 6);
    const rot = (rnd() - 0.5) * 0.36, special = rnd();
    if (keepClear.some((p) => near(c, p))) continue;
    // a flat grey roof on about one building in eight, terracotta on the rest
    const roof = roofPick < 0.12 ? 4 : Math.floor(((roofPick - 0.12) / 0.88) * 4);
    if (near(c, park) || (kind >= HOUSE_CHANCE && kind < HOUSE_CHANCE + TREE_CHANCE)) {
      trees.push({ x: c.x + jx, z: c.z + jz, r: land.cell * (0.3 + 0.15 * (w / land.cell)), owner, kind: special < 0.35 ? 'cypress' : 'round' });
    } else if (kind < HOUSE_CHANCE) {
      if (special < MOSQUE_CHANCE && roomForMosque(c.x, c.z)) {
        const m = { x: c.x, z: c.z, owner, size: 38 + 12 * ((special * 97) % 1), rot };
        mosques.push(m);
        const k = key(c.x, c.z);
        spaced.set(k, [...(spaced.get(k) || []), m]);
      } else {
        houses.push({ x: c.x + jx, z: c.z + jz, w, d, h: storeys * STOREY * HEIGHT_SCALE, roof, wall, rot, owner });
      }
    }
  }
  return { houses, trees, mosques };
}
