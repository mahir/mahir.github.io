/* No. 017 · the palette. Nine themes, nine pigment families from Iznik tile and miniature painting, built in OKLCH.
   pair(theme, variant) -> { field, ink } as sRGB hex. Pure and deterministic: the page, the generator and the test share it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Palette = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- color science: OKLCH -> OKLab -> linear sRGB -> sRGB ----
  function oklchToLinear(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
  }
  const EPS = 1e-4;
  const inGamut = rgb => rgb.every(v => v >= -EPS && v <= 1 + EPS);
  const encode = v => { v = Math.min(1, Math.max(0, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; };
  const decode = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

  // gamut mapping: keep lightness and hue, give up chroma until the color exists in sRGB
  function maxChroma(L, h) {
    let lo = 0, hi = 0.5;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid;
    }
    return lo;
  }
  function mapToGamut(L, C, h) {
    if (inGamut(oklchToLinear(L, C, h))) return [L, C, h];
    return [L, Math.min(C, maxChroma(L, h)), h];
  }
  // Pigment, not screen: no color sits at the very edge of sRGB. Chroma stops at 88% of what the hue can reach at that lightness.
  const EDGE = 0.88;
  const pigment = (L, C, h) => [L, Math.min(C, EDGE * maxChroma(L, h)), h];
  function toHex(lch) {
    const rgb = oklchToLinear(...lch).map(encode);
    return '#' + rgb.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  }
  function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map(i => decode(parseInt(hex.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  }

  // ---- the pigments ----
  // h: hue, c: chroma at full strength, light/deep: the field lightness for a light or deep ground.
  const PAPER = [0.955, 0.022, 84];          // warm off-white, the paper of a manuscript page
  const FAMILIES = {
    madder:     { name: 'madder rose',  h: 6,   c: 0.165, light: 0.72, deep: 0.42, comp: 158, compLight: true, near: 338 },
    vermilion:  { name: 'vermilion',    h: 36,  c: 0.19,  light: 0.70, deep: 0.50, comp: 205, near: 62 },
    saffron:    { name: 'saffron and ochre', h: 80, c: 0.16, light: 0.84, deep: 0.62, comp: 266, compLight: true, near: 42 },
    malachite:  { name: 'malachite',    h: 156, c: 0.14,  light: 0.72, deep: 0.38, comp: 4,   near: 190 },
    turquoise:  { name: 'turquoise',    h: 194, c: 0.105, light: 0.745, deep: 0.42, comp: 30,  compLight: true, near: 160 },
    // deep lapis is the reference card's blue (#2748bf); the light one is a mineral blue, well inside the gamut
    lapis:      { name: 'lapis',        h: 266.5, c: 0.19, light: 0.635, lightC: 0.145, deep: 0.457, comp: 82, near: 232 },
    indigo:     { name: 'indigo night', h: 279, c: 0.13,  light: 0.66, deep: 0.25, comp: 86,  near: 238 },
    aubergine:  { name: 'aubergine',    h: 324, c: 0.13,  light: 0.68, deep: 0.33, comp: 128, near: 8 },
    paper:      { name: 'paper',        h: 76,  c: 0.034, light: 0.905, deep: 0.25, comp: 262, compLight: true, near: 40 },
  };

  // ---- the schemes: recipes on (L, C, h). Each returns [field, ink] as OKLCH triples. ----
  const SCHEMES = {
    // near-black ink, leaning toward the field's hue, on a saturated mid-to-light field (the reference card)
    ink: f => [[f.light, f.lightC || f.c, f.h], [0.19, Math.min(0.045, f.c * 0.35), f.h]],
    // warm off-white ink on a deep saturated field
    deep: f => [[f.deep, f.c, f.h], PAPER],
    // one hue: deep field and a pale ink of the same hue
    tonal: f => [[Math.max(0.21, Math.min(f.deep - 0.1, 0.29)), f.c * 0.75, f.h], [0.88, f.c * 0.42, f.h]],
    // one hue the other way: a pale field and a deep ink
    pale: f => [[0.9, f.c * 0.36, f.h], [0.36, f.c * 0.95, f.h]],
    // the opposite hue for the ink, a wide lightness gap so the pair sits still
    complement: f => f.compLight
      ? [[f.light, f.c, f.h], [0.3, 0.13, f.comp]]                    // light field, deep ink: ultramarine on saffron, vermilion on turquoise
      : [[Math.min(f.deep, 0.36), f.c, f.h], [0.89, 0.065, f.comp]],  // deep field, pale ink: pale rose on deep malachite
    // the ink 30-60 degrees around the wheel
    neighbor: f => f.light >= 0.68
      ? [[f.light, f.c, f.h], [0.31, 0.12, f.near]]
      : [[f.deep, f.c, f.h], [0.9, 0.07, f.near]],
    // a paper field with deep colored ink, to rest the eye
    quiet: f => [PAPER, [0.39, Math.min(f.c, 0.16), f.h]],
  };

  // ---- the themes, each with its family and the schemes its cards take, in order ----
  const THEMES = [
    { name: 'Love',      slug: 'love',      family: 'madder',    variants: ['ink', 'deep', 'quiet', 'complement', 'tonal', 'neighbor'] },
    { name: 'The self',  slug: 'self',      family: 'malachite', variants: ['deep', 'ink', 'complement', 'quiet', 'tonal', 'neighbor'] },
    { name: 'Patience',  slug: 'patience',  family: 'lapis',     variants: ['deep', 'ink', 'complement', 'pale', 'tonal', 'neighbor'] },
    { name: 'Silence',   slug: 'silence',   family: 'indigo',    variants: ['deep', 'complement', 'ink', 'tonal', 'neighbor', 'quiet'] },
    { name: 'Humility',  slug: 'humility',  family: 'saffron',   variants: ['ink', 'complement', 'pale', 'neighbor', 'quiet'] },
    { name: 'Loss',      slug: 'loss',      family: 'aubergine', variants: ['deep', 'ink', 'tonal', 'quiet', 'complement', 'neighbor'] },
    { name: 'The path',  slug: 'path',      family: 'turquoise', variants: ['ink', 'deep', 'neighbor', 'complement', 'tonal', 'quiet'] },
    { name: 'Others',    slug: 'others',    family: 'vermilion', variants: ['ink', 'deep', 'complement', 'quiet', 'pale', 'neighbor'] },
    { name: 'Enough',    slug: 'enough',    family: 'paper',     variants: ['ink', 'deep', 'complement', 'neighbor', 'pale'] },
  ];
  const BY = {};
  THEMES.forEach(t => { BY[t.name] = t; BY[t.slug] = t; });

  const MIN_CONTRAST = 4.5, TARGET = 4.7;

  // Push the pair apart in lightness, a step at a time, until the contrast is comfortably over 4.5:1.
  function settle(field, ink) {
    field = field.slice(); ink = ink.slice();
    for (let i = 0; i < 80; i++) {
      const fm = pigment(...field), im = pigment(...ink);
      const fh = toHex(fm), ih = toHex(im);
      if (contrast(fh, ih) >= TARGET) return { field: fh, ink: ih, fieldLch: fm, inkLch: im };
      const up = field[0] > ink[0] ? field : ink, down = up === field ? ink : field;
      // move the color that has the most room; the paper stays paper
      if (up[0] < 0.97 && (up[0] - 0.5 < 0.5 - down[0] || down[0] <= 0.12)) up[0] += 0.01; else down[0] -= 0.01;
    }
    throw new Error('palette: could not settle a pair');
  }

  // Yellow goes to mud when it darkens. Keep yellows light; a dark one is turned deliberately to ochre and umber.
  const isYellow = h => h >= 65 && h <= 110;
  const unmud = lch => (isYellow(lch[2]) && lch[1] > 0.04 && lch[0] < 0.7) ? [lch[0], lch[1], 58] : lch;

  const cache = {};
  function pair(theme, variant) {
    const t = BY[theme];
    if (!t) throw new Error('palette: unknown theme ' + theme);
    if (variant == null) variant = t.variants[0];
    if (typeof variant === 'number') variant = t.variants[((variant % t.variants.length) + t.variants.length) % t.variants.length];
    const key = t.slug + '/' + variant;
    if (cache[key]) return cache[key];
    if (!SCHEMES[variant] || !t.variants.includes(variant)) throw new Error('palette: ' + t.name + ' has no ' + variant);
    const [f, i] = SCHEMES[variant](FAMILIES[t.family]).map(unmud);
    const p = settle(f, i);
    p.theme = t.name; p.variant = variant; p.contrast = contrast(p.field, p.ink);
    p.deep = p.fieldLch[0] < 0.55;
    return (cache[key] = p);
  }
  const variants = theme => BY[theme].variants.slice();

  return { EDGE, maxChroma, isYellow, THEMES, FAMILIES, SCHEMES, MIN_CONTRAST, pair, variants, theme: n => BY[n], contrast, luminance, toHex, mapToGamut, oklchToLinear };
});
