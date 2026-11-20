// rng.js: seeded random numbers. A language's number is its seed, so the same number always
// gives the same language. Each part of a language draws from its own fork of the seed, so a change
// to how one part is made does not reshuffle the others.

export function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function makeRng(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    f,
    range: (lo, hi) => lo + (hi - lo) * f(),
    int: (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)),
    chance: (p) => f() < p,
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    // weighted([[item, weight], ...]); weights need not sum to 1, and a weight of 0 or less is never drawn
    weighted: (pairs) => {
      let sum = 0;
      for (const [, w] of pairs) sum += Math.max(0, w);
      let x = f() * sum;
      for (const [item, w] of pairs) {
        if (w <= 0) continue;
        x -= w;
        if (x < 0) return item;
      }
      return pairs[pairs.length - 1][0];
    },
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // roughly normal, mean 0, deviation 1
    gauss: () => (f() + f() + f() + f() - 2) * 1.732,
    fork: (label) => makeRng(hash(seed + ':' + label)),
  };
  return r;
}
