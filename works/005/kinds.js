// Kinds of land, so the ranges don't all look alike: each company always stands in the same one, picked from its
// ticker. A kind is a shape for the terrain (how deep the erosion, how round or flat-topped the slopes, whether they
// step down in terraces) and a paint for the land (ground, forest, rock and its layers). The tree and snow lines stay
// the same in every kind, so height still reads as price. Colours are linear RGB.

const ALPINE_SHAPE = { erode: 0.42, detail: 0.03, gully: 1, round: 0, wide: 1, terrace: 0, riser: 0.35 };

export const KINDS = [
  {
    name: 'granite', // green meadows, dark conifers, grey granite
    shape: ALPINE_SHAPE,
    paint: {
      grassLo: [0.13, 0.16, 0.05], grassHi: [0.24, 0.21, 0.09], dry: [0.2, 0.19, 0.09],
      forest: [0.032, 0.05, 0.022], forestAlt: [0.026, 0.042, 0.024], forestAmt: 0.85,
      rockDark: [0.075, 0.068, 0.06], rockLight: [0.24, 0.215, 0.19], band: [0.2, 0.18, 0.16], strata: 0, bandH: 30, rockAt: 0,
    },
  },
  {
    name: 'larch', // the same mountains in autumn: gold and rust forest, tawny grass
    shape: { ...ALPINE_SHAPE, erode: 0.36 },
    paint: {
      grassLo: [0.11, 0.13, 0.045], grassHi: [0.19, 0.17, 0.07], dry: [0.24, 0.16, 0.05],
      forest: [0.44, 0.13, 0.02], forestAlt: [0.58, 0.33, 0.03], forestAmt: 0.95,
      rockDark: [0.07, 0.065, 0.06], rockLight: [0.22, 0.2, 0.18], band: [0.2, 0.18, 0.16], strata: 0, bandH: 30, rockAt: 0,
    },
  },
  {
    name: 'sandstone', // red rock desert: rust cliffs with pale layers, terraced into mesas, sand and sage below
    shape: { erode: 0.3, detail: 0.03, gully: 1.3, round: 0.6, wide: 0.9, terrace: 150, riser: 0.32 },
    paint: {
      grassLo: [0.36, 0.2, 0.1], grassHi: [0.42, 0.27, 0.15], dry: [0.16, 0.17, 0.1],
      forest: [0.04, 0.05, 0.025], forestAlt: [0.06, 0.06, 0.03], forestAmt: 0.3,
      rockDark: [0.24, 0.07, 0.03], rockLight: [0.56, 0.21, 0.08], band: [0.62, 0.44, 0.28], strata: 0.55, bandH: 24, rockAt: -0.12,
    },
  },
  {
    name: 'basalt', // volcanic: black rock with red cinder layers, bright moss, no trees
    shape: { erode: 0.38, detail: 0.04, gully: 0.7, round: -0.3, wide: 1.1, terrace: 0, riser: 0.35 },
    paint: {
      grassLo: [0.07, 0.13, 0.03], grassHi: [0.1, 0.12, 0.04], dry: [0.03, 0.03, 0.028],
      forest: [0, 0, 0], forestAlt: [0, 0, 0], forestAmt: 0,
      rockDark: [0.016, 0.015, 0.015], rockLight: [0.06, 0.055, 0.052], band: [0.075, 0.035, 0.025], strata: 0.22, bandH: 34, rockAt: -0.06,
    },
  },
  {
    name: 'moor', // highland moor: rounded and smooth, heather and straw, rock only where it's steep
    shape: { erode: 0.16, detail: 0.01, gully: 1.6, round: 0.15, wide: 1.3, terrace: 0, riser: 0.35 },
    paint: {
      grassLo: [0.085, 0.12, 0.04], grassHi: [0.1, 0.055, 0.05], dry: [0.22, 0.16, 0.06],
      forest: [0, 0, 0], forestAlt: [0, 0, 0], forestAmt: 0,
      rockDark: [0.07, 0.07, 0.07], rockLight: [0.2, 0.2, 0.19], band: [0.2, 0.2, 0.19], strata: 0, bandH: 30, rockAt: 0.12,
    },
  },
  {
    name: 'limestone', // pale walls stepping up out of lush meadows and forest
    shape: { erode: 0.3, detail: 0.03, gully: 1.1, round: 0.35, wide: 0.95, terrace: 420, riser: 0.42 },
    paint: {
      grassLo: [0.1, 0.17, 0.04], grassHi: [0.18, 0.2, 0.07], dry: [0.2, 0.19, 0.09],
      forest: [0.025, 0.045, 0.02], forestAlt: [0.035, 0.05, 0.025], forestAmt: 0.85,
      rockDark: [0.3, 0.28, 0.24], rockLight: [0.62, 0.58, 0.5], band: [0.46, 0.39, 0.31], strata: 0.3, bandH: 40, rockAt: -0.04,
    },
  },
];

export const GRANITE = KINDS[0];

// The kind for a ticker's seed (from seedOf), with the bits stirred. The salt is one that spreads today's 102
// companies evenly, 16 to 18 to a kind; a company added later lands wherever its ticker falls.
const SALT = 191;
export function kindOf(seed) {
  const s = seed ^ SALT;
  let h = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  return KINDS[((h ^ (h >>> 16)) >>> 0) % KINDS.length];
}
