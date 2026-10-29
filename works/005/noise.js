// Seeded 2D simplex noise and the fractal sums the terrain is carved with. The same seed always gives the same land.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];

export function makeNoise(seed) {
  const random = rng(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  // in [-1, 1]
  function noise2(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = GRAD[perm[ii + perm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
    return Math.max(-1, Math.min(1, 70 * n));
  }

  // fractal sum, roughly in [-1, 1]
  function fbm(x, y, octaves = 4, lacunarity = 2.03, gain = 0.5) {
    let sum = 0, amp = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise2(x, y);
      norm += amp;
      amp *= gain;
      x = x * lacunarity + 17.1;
      y = y * lacunarity - 9.7;
    }
    return sum / norm;
  }

  // sharp crests where the noise crosses zero, in [0, 1]: spurs and the gullies between them
  function ridged(x, y, octaves = 4, lacunarity = 2.1, gain = 0.5) {
    let sum = 0, amp = 1, norm = 0, weight = 1;
    for (let o = 0; o < octaves; o++) {
      let n = 1 - Math.abs(noise2(x, y));
      n *= n * weight;
      weight = Math.min(1, n * 1.6);
      sum += amp * n;
      norm += amp;
      amp *= gain;
      x = x * lacunarity + 5.3;
      y = y * lacunarity + 11.9;
    }
    return sum / norm;
  }

  // Value noise with its gradient: [value in -1..1, d/dx, d/dy]. Quintic, so the gradient is smooth too.
  function noised(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const dux = 30 * fx * fx * (fx * (fx - 2) + 1), duy = 30 * fy * fy * (fy * (fy - 2) + 1);
    const h = (i, j) => perm[(perm[i & 255] + j) & 255] / 255;
    const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
    const k1 = b - a, k2 = c - a, k4 = a - b - c + d;
    return [2 * (a + k1 * ux + k2 * uy + k4 * ux * uy) - 1, 2 * dux * (k1 + k4 * uy), 2 * duy * (k2 + k4 * ux)];
  }

  // Inigo Quilez's eroded fbm: each octave is damped where the slopes so far are steep, which grows smooth
  // valleys and sharp, detailed ridges, much as water would. Roughly in -1..1.
  function eroded(x, y, octaves = 6) {
    let sum = 0, amp = 1, dx = 0, dy = 0;
    for (let o = 0; o < octaves; o++) {
      const [v, nx, ny] = noised(x, y);
      dx += nx; dy += ny;
      sum += (amp * v) / (1 + dx * dx + dy * dy);
      amp *= 0.5;
      const qx = 1.6 * x - 1.2 * y, qy = 1.2 * x + 1.6 * y;
      x = qx + 3.1; y = qy - 7.7;
    }
    return sum;
  }

  return { noise2, fbm, ridged, noised, eroded };
}
