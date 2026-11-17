// node works/017/_palette_test.js
// Every theme, every variant: contrast, gamut, complements apart in lightness, no muddy yellows. Prints the hex pairs.
'use strict';
const P = require('./palette.js');

let failures = 0;
const fail = msg => { failures++; console.log('  FAIL ' + msg); };
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const fmt = lch => `oklch(${lch[0].toFixed(3)} ${lch[1].toFixed(3)} ${lch[2].toFixed(0)})`;

for (const t of P.THEMES) {
  console.log(`\n${t.name}  (${P.FAMILIES[t.family].name})`);
  const seen = new Set();
  for (const v of t.variants) {
    const p = P.pair(t.name, v);
    const cr = P.contrast(p.field, p.ink);
    console.log(`  ${v.padEnd(11)} field ${p.field}  ink ${p.ink}  ${cr.toFixed(2)}:1  ${p.deep ? 'deep ' : 'light'}  ${fmt(p.fieldLch)} / ${fmt(p.inkLch)}`);

    if (cr < P.MIN_CONTRAST) fail(`${t.name}/${v}: contrast ${cr.toFixed(2)} < ${P.MIN_CONTRAST}`);
    for (const [role, lch, hex] of [['field', p.fieldLch, p.field], ['ink', p.inkLch, p.ink]]) {
      const lin = P.oklchToLinear(...lch);
      if (!lin.every(x => x >= -1e-4 && x <= 1 + 1e-4)) fail(`${t.name}/${v} ${role} out of sRGB gamut: ${lin.map(x => x.toFixed(4))}`);
      if (lch[1] > P.EDGE * P.maxChroma(lch[0], lch[2]) + 1e-6) fail(`${t.name}/${v} ${role} sits at the gamut edge (${(lch[1] / P.maxChroma(lch[0], lch[2]) * 100).toFixed(0)}% of max chroma)`);
      if (!/^#[0-9a-f]{6}$/.test(hex)) fail(`${t.name}/${v} ${role} bad hex ${hex}`);
      // muddy yellow: a yellow hue, some chroma, and dark
      if (P.isYellow(lch[2]) && lch[1] > 0.04 && lch[0] < 0.7) fail(`${t.name}/${v} ${role} is a muddy yellow ${fmt(lch)}`);
    }
    // complementary (or near-complementary) hues with real chroma must sit far apart in lightness
    const [f, i] = [p.fieldLch, p.inkLch];
    if (f[1] > 0.05 && i[1] > 0.05 && hueGap(f[2], i[2]) > 120 && Math.abs(f[0] - i[0]) < 0.4)
      fail(`${t.name}/${v}: opposite hues at similar lightness (${f[0].toFixed(2)} vs ${i[0].toFixed(2)})`);
    if (v === 'neighbor' && f[1] > 0.05 && i[1] > 0.05) {
      const g = hueGap(f[2], i[2]);
      if (g < 25 || g > 65) fail(`${t.name}/${v}: neighbor ink is ${g.toFixed(0)} degrees away`);
    }
    const key = p.field + p.ink;
    if (seen.has(key)) fail(`${t.name}/${v} repeats another variant`);
    seen.add(key);
    // deterministic
    const again = P.pair(t.slug, t.variants.indexOf(v));
    if (again.field !== p.field || again.ink !== p.ink) fail(`${t.name}/${v} not deterministic`);
  }
}

// the nine families must read as nine: their default fields at least a little apart in hue or lightness
const defaults = P.THEMES.map(t => P.pair(t.name, 0));
for (let a = 0; a < defaults.length; a++) for (let b = a + 1; b < defaults.length; b++) {
  const [x, y] = [defaults[a].fieldLch, defaults[b].fieldLch];
  if (hueGap(x[2], y[2]) < 20 && Math.abs(x[0] - y[0]) < 0.1 && x[1] > 0.05 && y[1] > 0.05)
    fail(`${P.THEMES[a].name} and ${P.THEMES[b].name} defaults are too close`);
}

console.log(failures ? `\n${failures} failure(s)` : `\nAll ${P.THEMES.reduce((n, t) => n + t.variants.length, 0)} pairs pass.`);
process.exit(failures ? 1 : 0);
