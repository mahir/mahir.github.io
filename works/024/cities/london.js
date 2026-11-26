// London: a linocut in the manner of the 1930s transport posters. The Thames at
// Westminster in the evening: the palace's long river front with the Elizabeth
// Tower, the bridge with red buses crossing, St Paul's and Tower Bridge in the
// fog downstream. Five inks (near-black, signal red, slate blue, ochre, cream),
// gouge marks cut into the dark blocks, and the colors printed a hair off the key.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

const INK = '#1d1b20', PAPER = '#eee2c4', RED = '#c4372a', RED_D = '#8e2a22';
const SLATE = '#3f5c77', SLATE_D = '#2c4257', SLATE_L = '#8da3b2', FOG = '#d9d6c4';
const OCHRE = '#dba443', OCHRE_D = '#b07a2c', STONE = '#e7bf6c', SKY = '#efc983', SKY_L = '#f6e0b0', CREAM = '#f4e9cf';

export const city = {
  id: 'london', name: 'London', wall: '#2a2724',
  alt: "A railway-poster view of the Houses of Parliament and Big Ben across the Thames, with Westminster Bridge, a red bus, a lamp post and St Paul's dome far off, under a red title band",
  google: 'family=Josefin+Sans:wght@600;700',
  fonts: [['700 100px "Josefin Sans"', 'LONDON'], ['600 40px "Josefin Sans"', 'THE THAMES AT WESTMINSTER']],
  build,
};

// the picture, between the red title block and the black band below
const X0 = 92, X1 = 1508, Y0 = 400, Y1 = 1822;
const TX = 900, TB = 1440; // the clock tower's middle and foot
const RIVER = 1500; // the water at the foot of the palace's river wall

function build() {
  const p = new Plate({ paper: PAPER, seed: 1859 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'sun', 'clouds', 'far', 'fog', 'victoria', 'roofs', 'palace', 'river', 'tower', 'bridge', 'bridgeTop', 'boats', 'wisps', 'front', 'gulls', 'title', 'frame');
  p.layer('title', { clip: false });
  p.layer('frame', { clip: false });

  frame(p);
  sky(p, r);
  distance(p, r);
  river(p, r);
  victoria(p, r);
  palace(p, r);
  tower(p, r);
  bridge(p, r);
  boats(p, r);
  front(p, r);
  gulls(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- the cutter's tools
// a gouge mark: a tapered sliver from its tail at (x, y), len long, w wide
function gouge(c, x, y, len, w, a = 0) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const P = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
  const [ax, ay] = P(0, 0), [bx, by] = P(len * 0.38, -w), [tx, ty] = P(len, 0), [dx, dy] = P(len * 0.38, w);
  c.moveTo(ax, ay); c.quadraticCurveTo(bx, by, tx, ty); c.quadraticCurveTo(dx, dy, ax, ay);
}
// rows of gouges whose length grows with k(y) from 0 to 1: the printer's gradient
function gougeField(r, x0, x1, y0, y1, step, kAt, o = {}) {
  const out = [];
  for (let y = y0; y < y1; y += step) {
    const k = kAt(y);
    if (k <= 0.02) continue;
    const L = lerp(o.l0 ?? 6, o.l1 ?? 90, k), w = lerp(o.w0 ?? 0.8, o.w1 ?? 4.5, k);
    for (let x = x0 - r() * L; x < x1;) {
      const len = L * r.range(0.6, 1.3);
      out.push([x, y + r.range(-1.5, 1.5), len, w * r.range(0.7, 1.1), r.range(-0.04, 0.04)]);
      x += len + lerp(o.g0 ?? 30, o.g1 ?? 4, k) * r.range(0.6, 1.6);
    }
  }
  return out;
}
function drawGouges(c, list, color) {
  c.fillStyle = color; c.beginPath();
  for (const g of list) gouge(c, ...g);
  c.fill();
}
// a wobbly line, the way a knife follows a ruler by hand
function wob(r, pts, amp = 1.2) { return pts.map(([x, y]) => [x + r.range(-amp, amp), y + r.range(-amp, amp)]); }
// a pointed (lancet) opening, foot at y
function lancet(c, x, y, w, h) {
  c.moveTo(x, y); c.lineTo(x, y - h + w * 0.8);
  c.quadraticCurveTo(x, y - h + w * 0.15, x + w / 2, y - h);
  c.quadraticCurveTo(x + w, y - h + w * 0.15, x + w, y - h + w * 0.8);
  c.lineTo(x + w, y); c.closePath();
}

// ---------------------------------------------------------------- frame
function frame(p) {
  const r = rng(12);
  // the outer border, cut by hand
  const rect = (i) => wob(r, [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i]], 0.8);
  p.pen('frame', rect(50), INK, 12, { t: 0.05, d: 1.8, cap: 'square' });
  p.pen('frame', rect(70), INK, 2, { t: 0.4, d: 1.8, cap: 'square' });
  // the picture's edge
  p.pen('frame', [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1], [X0, Y0]], INK, 4, { t: 0.6, d: 1.6, cap: 'square' });
}

// ---------------------------------------------------------------- sky
const SUN = [470, 1020];
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 1100 }, (c) => {
    c.fillStyle = SKY; c.fillRect(X0, Y0, X1 - X0, 1100);
  }, { t: 0.2, d: 1.5, reveal: 'fall', ease: 'inOut' });

  // the evening's rays, cut out of the block and left pale
  const n = 30;
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 1100 }, (c, q) => {
    const R = 1700 * q;
    c.fillStyle = SKY_L; c.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + (i / n) * Math.PI * 1.02 - 0.02, a1 = a0 + (Math.PI / n) * 0.55;
      c.moveTo(SUN[0], SUN[1]); c.lineTo(SUN[0] + Math.cos(a0) * R, SUN[1] + Math.sin(a0) * R); c.lineTo(SUN[0] + Math.cos(a1) * R, SUN[1] + Math.sin(a1) * R);
      c.closePath();
    }
    c.fill();
  }, { t: 1.1, d: 1.8, reveal: 'draw', ease: 'inOut' });

  // the slate dusk at the top, carved into a gradient toward the rays
  const edge = (x) => 690 + Math.sin(x * 0.006 + 1) * 26 + Math.sin(x * 0.017) * 9;
  const band = [[X0, Y0]];
  for (let x = X0; x <= X1; x += 12) band.push([x, edge(x)]);
  band.push([X1, Y0]);
  const gs = gougeField(r, X0, X1, Y0 + 30, 760, 9, (y) => clamp((y - 470) / 260) ** 1.3, { l0: 8, l1: 120, w0: 0.7, w1: 4.2, g0: 40, g1: 3 });
  p.group('sky', boxOf(band, 6), (c) => {
    c.fillStyle = SLATE; poly(c, band); c.fill();
    c.save(); poly(c, band); c.clip();
    drawGouges(c, gs, SKY);
    c.restore();
  }, { t: 0.8, d: 1.6, reveal: 'fall', ease: 'inOut' });

  // the low sun, ringed with cuts
  p.group('sun', { x: SUN[0] - 200, y: SUN[1] - 200, w: 400, h: 400 }, (c) => {
    c.fillStyle = CREAM; c.beginPath(); c.arc(SUN[0], SUN[1], 168, 0, Math.PI * 2); c.fill();
    c.strokeStyle = OCHRE; c.lineWidth = 3;
    for (let k = 1; k < 9; k++) { c.beginPath(); c.arc(SUN[0], SUN[1], 168 - k * 17, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
    c.fillStyle = OCHRE; c.beginPath(); c.arc(SUN[0], SUN[1], 30, 0, Math.PI * 2); c.fill();
  }, { t: 1.6, d: 1.4, reveal: 'rise', ease: 'inOut' });

  // long evening clouds: cream, with their undersides cut in slate lines
  const clouds = [[1010, 560, 420, 34], [640, 770, 280, 24], [1150, 830, 300, 24], [640, 610, 220, 20]];
  clouds.forEach(([x, y, w, h], i) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const f = k / 24; pts.push([x + f * w, y - Math.sin(f * Math.PI) ** 0.6 * h - Math.sin(f * 17 + i) * 3]); }
    for (let k = 24; k >= 0; k--) { const f = k / 24; pts.push([x + f * w + (1 - f) * 30 - 15, y + Math.sin(f * Math.PI) * h * 0.25]); }
    p.group('clouds', boxOf(pts, 6), (c) => {
      c.fillStyle = CREAM; poly(c, pts); c.fill();
      c.strokeStyle = SLATE; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (let k = 0; k < 4; k++) { const yy = y - h * 0.15 + k * 6; c.moveTo(x + w * (0.12 + k * 0.05), yy); c.lineTo(x + w * (0.9 - k * 0.07), yy); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = 2; poly(c, pts); c.stroke();
    }, { t: 2.0 + i * 0.3, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- downstream: the City, St Paul's, Tower Bridge
function distance(p, r) {
  const base = 1400;
  const far = [];
  for (let x = 980; x < X1 + 10;) {
    const w = r.range(14, 40), h = r.range(16, 60);
    far.push({ x, w, h, chim: r.chance(0.5), spire: r.chance(0.1) ? r.range(40, 90) : 0 });
    x += w + r.range(-3, 3);
  }
  p.group('far', { x: 970, y: base - 180, w: X1 - 960, h: 190 }, (c) => {
    for (const b of far) {
      if (b.x > 1130 && b.x < 1260) continue;
      c.fillStyle = SLATE_L; c.fillRect(b.x, base - b.h - 40, b.w, b.h + 40);
      c.fillStyle = mix(SLATE_L, SLATE, 0.35);
      for (let y = base - b.h - 34; y < base - 10; y += 9) for (let x = b.x + 3; x < b.x + b.w - 4; x += 7) c.fillRect(x, y, 2.5, 3.5);
      if (b.chim) { c.fillStyle = SLATE_L; c.fillRect(b.x + b.w * 0.6, base - b.h - 52, 6, 14); }
      if (b.spire) {
        // a Wren steeple: stages and a needle
        const sx = b.x + b.w / 2;
        c.fillStyle = mix(SLATE_L, SLATE, 0.2);
        c.fillRect(sx - 7, base - b.h - 40 - b.spire * 0.5, 14, b.spire * 0.5);
        c.fillRect(sx - 5, base - b.h - 40 - b.spire * 0.75, 10, b.spire * 0.25);
        poly(c, [[sx - 4, base - b.h - 40 - b.spire * 0.75], [sx + 4, base - b.h - 40 - b.spire * 0.75], [sx, base - b.h - 40 - b.spire * 1.15]]); c.fill();
      }
    }
  }, { t: 2.5, d: 1.2, reveal: 'rise' });

  // St Paul's: the west towers, the colonnaded drum, the dome, the lantern
  const sx = 1205, sb = 1372;
  p.group('far', { x: sx - 120, y: sb - 240, w: 240, h: 260 }, (c) => {
    const lit = mix(SLATE_L, CREAM, 0.35), mid = SLATE_L, dk = mix(SLATE_L, SLATE, 0.55);
    // the nave and the transept roof
    c.fillStyle = mid; c.fillRect(sx - 110, sb - 46, 220, 60);
    c.fillStyle = dk; for (let x = sx - 104; x < sx + 104; x += 10) c.fillRect(x, sb - 38, 4, 12);
    // the west towers, left and right of the front
    for (const tx of [sx - 92, sx + 78]) {
      c.fillStyle = mid; c.fillRect(tx, sb - 108, 16, 70);
      c.fillStyle = lit; c.fillRect(tx + 2, sb - 120, 12, 14);
      c.beginPath(); c.arc(tx + 8, sb - 120, 6, Math.PI, 0); c.fill();
      c.fillStyle = dk; c.fillRect(tx + 5, sb - 98, 6, 14); c.fillRect(tx + 7, sb - 132, 2, 8);
    }
    // the drum and its ring of columns
    c.fillStyle = mid; c.fillRect(sx - 58, sb - 96, 116, 50);
    c.fillStyle = dk; for (let x = sx - 54; x <= sx + 52; x += 8) c.fillRect(x, sb - 92, 3.5, 40);
    c.fillStyle = mid; c.fillRect(sx - 62, sb - 100, 124, 6);
    c.fillStyle = lit; c.fillRect(sx - 46, sb - 116, 92, 16);
    c.fillStyle = dk; for (let x = sx - 42; x < sx + 42; x += 9) c.fillRect(x, sb - 112, 3, 8);
    // the dome, with its ribs
    c.fillStyle = lit; c.beginPath(); c.ellipse(sx, sb - 116, 50, 58, 0, Math.PI, 0); c.fill();
    c.save(); c.beginPath(); c.ellipse(sx, sb - 116, 50, 58, 0, Math.PI, 0); c.clip();
    c.fillStyle = mid; c.fillRect(sx + 8, sb - 180, 60, 70);
    c.strokeStyle = dk; c.lineWidth = 1.4; c.beginPath();
    for (let k = -4; k <= 4; k++) { c.moveTo(sx + k * 11, sb - 116); c.quadraticCurveTo(sx + k * 9, sb - 160, sx, sb - 174); }
    c.stroke();
    c.restore();
    // the lantern, the ball and the cross
    c.fillStyle = mid; c.fillRect(sx - 8, sb - 200, 16, 28);
    c.fillStyle = dk; c.fillRect(sx - 3, sb - 194, 6, 16);
    c.fillStyle = mid; poly(c, [[sx - 10, sb - 200], [sx + 10, sb - 200], [sx, sb - 214]]); c.fill();
    c.beginPath(); c.arc(sx, sb - 217, 4, 0, Math.PI * 2); c.fill();
    c.fillRect(sx - 1.2, sb - 232, 2.4, 13); c.fillRect(sx - 5, sb - 228, 10, 2.2);
  }, { t: 2.9, d: 1.3, reveal: 'rise', ease: 'inOut' });

  // Tower Bridge, farther and paler: two towers, the high walkways, the chains
  p.group('far', { x: 1230, y: 1200, w: 300, h: 210 }, (c) => {
    const col = mix(SLATE_L, FOG, 0.3), dk = mix(SLATE_L, SLATE, 0.45);
    const towers = [1352, 1450], tw = 32, tb = 1392, tt = 1262;
    // the chains, out to the shores and slung between the towers
    c.strokeStyle = dk; c.lineWidth = 3; c.beginPath();
    c.moveTo(1240, 1372); c.quadraticCurveTo(1300, 1366, towers[0] - tw / 2, tt + 14);
    c.moveTo(towers[1] + tw / 2, tt + 14); c.quadraticCurveTo(1500, 1366, 1560, 1372); c.stroke();
    c.lineWidth = 1; c.beginPath();
    for (let x = 1250; x < towers[0] - 20; x += 9) { const f = (x - 1240) / (towers[0] - tw / 2 - 1240); c.moveTo(x, 1372 - f * f * 96); c.lineTo(x, 1374); }
    for (let x = towers[1] + 24; x < 1560; x += 9) { const f = 1 - (x - towers[1] - tw / 2) / (1560 - towers[1] - tw / 2); c.moveTo(x, 1372 - f * f * 96); c.lineTo(x, 1374); }
    c.stroke();
    // the two high walkways
    c.fillStyle = col; c.fillRect(towers[0], tt + 4, towers[1] - towers[0], 9); c.fillRect(towers[0], tt + 20, towers[1] - towers[0], 9);
    c.fillStyle = dk; for (let x = towers[0] + tw / 2 + 2; x < towers[1] - tw / 2; x += 7) { c.fillRect(x, tt + 7, 3, 3); c.fillRect(x, tt + 23, 3, 3); }
    // the roadway, and the bascules meeting in the middle
    c.fillStyle = col; c.fillRect(1240, 1368, 320, 9);
    for (const tx of towers) {
      c.fillStyle = col; c.fillRect(tx - tw / 2, tt, tw, tb - tt);
      c.fillStyle = dk; c.fillRect(tx + tw * 0.2, tt, tw * 0.3, tb - tt);
      c.beginPath(); lancet(c, tx - 6, tt + 70, 12, 36); lancet(c, tx - 5, tt + 112, 10, 22); c.fill();
      c.beginPath(); lancet(c, tx - 10, tb - 2, 20, 26); c.fill();
      // corner turrets with pointed caps, and the steep middle roof
      c.fillStyle = col;
      for (const dx of [-tw / 2 - 2, tw / 2 - 6]) { c.fillRect(tx + dx, tt - 18, 8, 22); poly(c, [[tx + dx - 2, tt - 18], [tx + dx + 10, tt - 18], [tx + dx + 4, tt - 38]]); c.fill(); }
      poly(c, [[tx - 10, tt], [tx + 10, tt], [tx, tt - 30]]); c.fill();
      c.fillStyle = dk; c.fillRect(tx - 0.8, tt - 40, 1.6, 12);
    }
  }, { t: 3.3, d: 1.1, reveal: 'rise' });

  // the plane trees along the far embankment
  const trees = [];
  for (let x = 985; x < X1 + 10; x += r.range(16, 26)) trees.push([x, 1392 + r.range(-3, 3), r.range(10, 16)]);
  p.group('far', { x: 970, y: 1350, w: X1 - 960, h: 60 }, (c) => {
    c.fillStyle = mix(SLATE_L, SLATE, 0.3);
    for (const [x, y, rr] of trees) { c.beginPath(); c.arc(x, y - rr, rr, 0, Math.PI * 2); c.arc(x + rr * 0.6, y - rr * 0.6, rr * 0.7, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = mix(SLATE_L, FOG, 0.4);
    for (const [x, y, rr] of trees) { c.beginPath(); c.arc(x - rr * 0.35, y - rr * 1.3, rr * 0.35, 0, Math.PI * 2); c.fill(); }
  }, { t: 3.6, d: 0.9, reveal: 'rise' });

  // the fog downstream
  fogBand(p, r, 'fog', 980, 1345, 560, 30, 3.8, 'wipeL');
  fogBand(p, r, 'fog', 1040, 1300, 300, 16, 4.1, 'wipe');
}

// a band of fog: cream, its edge cut in long waves, with slate lines in it
function fogBand(p, r, layer, x, y, w, h, t, rev) {
  const top = [], bot = [];
  const ph = r() * 6;
  for (let k = 0; k <= 30; k++) {
    const f = k / 30, xx = x + f * w, taper = Math.sin(f * Math.PI) ** 0.5;
    top.push([xx, y - h * taper + Math.sin(f * 9 + ph) * 4]);
    bot.push([xx, y + h * 0.5 * taper + Math.sin(f * 7 + ph) * 3]);
  }
  const pts = [...top, ...bot.reverse()];
  p.group(layer, boxOf(pts, 8), (c) => {
    c.fillStyle = FOG; poly(c, pts); c.fill();
    c.save(); poly(c, pts); c.clip();
    c.strokeStyle = SLATE_L; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 4; k++) {
      const yy = y - h * 0.55 + k * h * 0.4;
      for (let xx = x + 10 + k * 17; xx < x + w - 30; xx += 90) { c.moveTo(xx, yy); c.quadraticCurveTo(xx + 25, yy - 4, xx + 54, yy); }
    }
    c.stroke();
    c.restore();
  }, { t, d: 1.3, reveal: rev, ease: 'inOut' });
}

// ---------------------------------------------------------------- the river
function river(p, r) {
  p.group('river', { x: X0, y: RIVER - 10, w: X1 - X0, h: Y1 - RIVER + 10 }, (c) => {
    c.fillStyle = SLATE; c.fillRect(X0, RIVER - 6, X1 - X0, Y1 - RIVER + 6);
    // the far water, under the bridge and downstream, is paler
    c.fillStyle = SLATE_L; c.fillRect(960, 1380, X1 - 960, 130);
  }, { t: 1.6, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // the water cut as a carver does it: long sliding gouges, bigger near
  const rows = 22;
  for (let k = 0; k < rows; k++) {
    const f = k / (rows - 1);
    const y = lerp(RIVER + 10, Y1 - 8, f ** 1.25);
    const list = [];
    const L = lerp(26, 150, f), wd = lerp(1, 4.2, f);
    for (let x = X0 - r() * L; x < X1;) {
      const len = L * r.range(0.5, 1.2);
      if (r.chance(0.82)) list.push([x, y + r.range(-2, 2), len, wd * r.range(0.6, 1.1), r.range(-0.03, 0.03)]);
      x += len + L * r.range(0.25, 0.9);
    }
    p.group('river', { x: X0 - 10, y: y - 12, w: X1 - X0 + 20, h: 24 }, (c) => drawGouges(c, list, k % 4 === 3 ? SLATE_L : mix(SLATE_L, CREAM, 0.45)),
      { t: 2.3 + k * 0.1, d: 0.8, reveal: k % 2 ? 'wipeL' : 'wipe' });
  }
}

// ---------------------------------------------------------------- the palace
const PX1 = 838; // the palace's river front ends at the clock tower
const tP = (x) => clamp((x - X0) / (PX1 - X0));
const sAt = (x) => lerp(0.56, 1, tP(x));
const baseAt = (x) => lerp(1406, TB, tP(x));
const hAt = (x) => 205 * sAt(x);

function victoria(p, r) {
  // the Victoria Tower, at the far end: a great square keep with corner turrets
  const x0 = 150, x1 = 292, top = 860, foot = 1300;
  p.group('victoria', { x: x0 - 30, y: top - 160, w: x1 - x0 + 70, h: foot - top + 170 }, (c) => {
    c.fillStyle = mix(STONE, FOG, 0.25); c.fillRect(x0, top, x1 - x0, foot - top);
    c.fillStyle = INK; c.fillRect(x1, top + 6, 22, foot - top);
    c.save(); c.beginPath(); c.rect(x1, top + 6, 22, foot - top); c.clip();
    c.fillStyle = mix(STONE, FOG, 0.25); c.beginPath();
    for (let y = top + 20; y < foot; y += 26) gouge(c, x1 + 3, y, 16, 1.6, 0.05);
    c.fill(); c.restore();
    const lit = mix(STONE, FOG, 0.25);
    // the high stage: three great windows with mullions and transoms
    c.fillStyle = INK; c.beginPath();
    for (let i = 0; i < 3; i++) lancet(c, x0 + 22 + i * 36, top + 150, 26, 124);
    c.fill();
    c.strokeStyle = lit; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i < 3; i++) {
      const wx = x0 + 22 + i * 36;
      c.moveTo(wx + 13, top + 150); c.lineTo(wx + 13, top + 40);
      for (const ty of [top + 70, top + 104, top + 134]) { c.moveTo(wx, ty); c.lineTo(wx + 26, ty); }
    }
    c.stroke();
    // below it, stages of paired windows between thin buttresses, with a band of shields
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x0, top + 160); c.lineTo(x1, top + 160); c.stroke();
    c.fillStyle = INK;
    for (let i = 0; i < 6; i++) { const sx = x0 + 14 + i * 21; c.beginPath(); c.moveTo(sx, top + 166); c.lineTo(sx + 12, top + 166); c.lineTo(sx + 12, top + 176); c.quadraticCurveTo(sx + 6, top + 186, sx, top + 176); c.closePath(); c.fill(); }
    const bays = 4, bw = (x1 - x0 - 16) / bays;
    for (let y = top + 196; y < foot - 30; y += 52) {
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
      c.beginPath();
      for (let i = 0; i < bays; i++) { lancet(c, x0 + 8 + i * bw + bw * 0.18, y + 44, bw * 0.26, 34); lancet(c, x0 + 8 + i * bw + bw * 0.56, y + 44, bw * 0.26, 34); }
      c.fill();
      c.lineWidth = 1; c.beginPath();
      for (let i = 0; i <= bays; i++) { const bx = x0 + 8 + i * bw; c.moveTo(bx, y); c.lineTo(bx, y + 52); }
      c.stroke(); c.lineWidth = 1.6;
    }
    // the turrets at the corners, rising above the parapet
    for (const tx of [x0 - 6, x1 - 12]) {
      c.fillStyle = mix(STONE, FOG, 0.15); c.fillRect(tx, top - 50, 18, foot - top + 50);
      c.fillStyle = INK; c.fillRect(tx + 11, top - 50, 7, foot - top + 50);
      c.fillStyle = lit; c.beginPath(); for (let y = top - 30; y < foot; y += 40) lancet(c, tx + 3, y + 22, 6, 18); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(tx, top - 50, 18, foot - top + 50);
      c.fillStyle = OCHRE_D; poly(c, [[tx - 3, top - 50], [tx + 21, top - 50], [tx + 9, top - 92]]); c.fill(); c.stroke();
      c.fillStyle = OCHRE; for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(tx - 3 + k * 3 - 1, top - 50 - k * 10.5, 2, 0, Math.PI * 2); c.arc(tx + 21 - k * 3 + 1, top - 50 - k * 10.5, 2, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.moveTo(tx + 9, top - 92); c.lineTo(tx + 9, top - 104); c.stroke();
    }
    // the battlements, pierced
    c.fillStyle = INK; c.fillRect(x0, top - 6, x1 - x0, 10);
    for (let x = x0 + 14; x < x1 - 14; x += 12) c.fillRect(x, top - 18, 7, 12);
    c.fillStyle = lit; for (let x = x0 + 14; x < x1 - 14; x += 12) c.fillRect(x + 2, top - 2, 3, 3);
    // smaller pinnacles along the parapet, and the flagpole
    c.fillStyle = INK;
    for (const px of [x0 + 40, x0 + 71, x0 + 102]) poly(c, [[px - 4, top - 6], [px + 4, top - 6], [px, top - 34]]), c.fill();
    c.fillRect((x0 + x1) / 2 - 1.5, top - 150, 3, 144);
  }, { t: 3.4, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // the flag, out in the wind
  const fx = (x0 + x1) / 2 + 1, fy = top - 146;
  p.live('victoria', {
    t: 5.2, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const fw = 64, fh = 36, n = 12;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        const dy = Math.sin(time * 4 - u0 * 5) * 4 * u0;
        c.save();
        c.beginPath(); c.rect(fx + u0 * fw, fy - 1 + dy, fw / n + 0.6, fh + 2); c.clip();
        c.translate(0, dy);
        flag(c, fx, fy, fw, fh);
        c.restore();
      }
    },
  });
  fogBand(p, r, 'victoria', 60, 1230, 420, 26, 5.0, 'wipe');
}

function flag(c, x, y, w, h) {
  c.fillStyle = SLATE_D; c.fillRect(x, y, w, h);
  c.lineCap = 'butt';
  c.strokeStyle = CREAM; c.lineWidth = h * 0.2;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
  c.strokeStyle = RED; c.lineWidth = h * 0.07;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
  c.fillStyle = CREAM; c.fillRect(x + w * 0.42, y, w * 0.16, h); c.fillRect(x, y + h * 0.36, w, h * 0.28);
  c.fillStyle = RED; c.fillRect(x + w * 0.46, y, w * 0.08, h); c.fillRect(x, y + h * 0.42, w, h * 0.16);
}

function palace(p, r) {
  // the roofs behind the parapet, with their cresting, vents and spirelets
  const roofTop = (x) => baseAt(x) - hAt(x) - 46 * sAt(x);
  const roof = [];
  for (let x = X0 - 10; x <= PX1; x += 8) roof.push([x, roofTop(x)]);
  roof.push([PX1, baseAt(PX1) - hAt(PX1) + 10], [X0 - 10, baseAt(X0) - hAt(X0) + 10]);
  const vents = [];
  for (let x = X0 + 10; x < PX1 - 20; x += r.range(28, 60)) vents.push([x, r.int(0, 3)]);
  p.group('roofs', { x: X0 - 20, y: 1060, w: PX1 - X0 + 40, h: 400 }, (c) => {
    c.fillStyle = SLATE; poly(c, roof); c.fill();
    c.strokeStyle = SLATE_D; c.lineWidth = 1.2; c.beginPath();
    for (let x = X0; x < PX1; x += 7) { c.moveTo(x, roofTop(x) + 4); c.lineTo(x - 6, baseAt(x) - hAt(x) + 8); }
    c.stroke();
    // the cresting on the ridge
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
    c.moveTo(X0, roofTop(X0)); for (let x = X0; x <= PX1; x += 8) c.lineTo(x, roofTop(x)); c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (let x = X0; x <= PX1; x += 6) { const y = roofTop(x); c.moveTo(x, y); c.lineTo(x, y - 6 * sAt(x)); }
    c.stroke();
    // vents and little spires along the roofs
    for (const [x, kind] of vents) {
      const s = sAt(x), y = roofTop(x);
      c.fillStyle = INK;
      if (kind === 0) { c.fillRect(x - 5 * s, y - 26 * s, 10 * s, 26 * s); poly(c, [[x - 8 * s, y - 26 * s], [x + 8 * s, y - 26 * s], [x, y - 48 * s]]); c.fill(); }
      else if (kind === 1) { poly(c, [[x - 3 * s, y], [x + 3 * s, y], [x, y - 40 * s]]); c.fill(); }
      else { c.fillStyle = OCHRE_D; c.fillRect(x - 6 * s, y - 18 * s, 12 * s, 18 * s); c.fillStyle = INK; c.fillRect(x - 7 * s, y - 21 * s, 14 * s, 4 * s); }
    }
  }, { t: 3.9, d: 1.2, reveal: 'rise' });

  // the Central Tower: an octagon with its spire, behind the roofs
  const cx = 560, cb = 1200, ctop = 1012;
  p.group('roofs', { x: cx - 60, y: 820, w: 120, h: 400 }, (c) => {
    c.fillStyle = STONE; c.fillRect(cx - 20, ctop, 40, cb - ctop);
    c.fillStyle = OCHRE_D; c.fillRect(cx - 34, ctop, 14, cb - ctop);
    c.fillStyle = INK; c.fillRect(cx + 20, ctop, 14, cb - ctop);
    c.fillStyle = INK; c.beginPath();
    for (let y = ctop + 70; y < cb; y += 62) { lancet(c, cx - 9, y, 18, 48); lancet(c, cx - 31, y, 8, 44); }
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(cx - 34, ctop, 68, cb - ctop);
    c.fillRect(cx - 38, ctop - 6, 76, 8);
    // the spire, with crockets up its edges
    c.fillStyle = SLATE; poly(c, [[cx - 30, ctop - 4], [cx + 30, ctop - 4], [cx, ctop - 175]]); c.fill();
    c.fillStyle = SLATE_D; poly(c, [[cx + 4, ctop - 4], [cx + 30, ctop - 4], [cx, ctop - 175]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, [[cx - 30, ctop - 4], [cx + 30, ctop - 4], [cx, ctop - 175]]); c.stroke();
    c.fillStyle = OCHRE;
    for (let k = 1; k < 8; k++) { const f = k / 8; c.beginPath(); c.arc(cx - 30 * (1 - f) - 2, ctop - 4 - 171 * f, 2.4, 0, Math.PI * 2); c.arc(cx + 30 * (1 - f) + 2, ctop - 4 - 171 * f, 2.4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = INK; c.fillRect(cx - 1.5, ctop - 195, 3, 22);
    // pinnacles at the drum's corners
    for (const dx of [-34, -18, 18, 34]) poly(c, [[cx + dx - 4, ctop - 2], [cx + dx + 4, ctop - 2], [cx + dx, ctop - 34]]), c.fill();
  }, { t: 4.3, d: 1.3, reveal: 'rise', ease: 'inOut' });

  // the river front: bays of tall windows, and taller pavilions with turrets
  const units = [];
  let x = PX1, i = 0;
  while (x > X0 - 40) {
    const s = sAt(x), w = 30 * s;
    const pav = i % 10 === 0 || i % 10 === 1;
    units.push({ x0: x - w, x1: x, pav, s });
    x -= w; i++;
  }
  // a group of bays at a time, from the far end to the clock tower; the
  // pavilion roofs come in among them, so the layer is added in time order
  units.reverse();
  const jobs = [];
  const later = (layer, box, draw, o) => jobs.push([layer, box, draw, o]);
  for (let k = 0; k < units.length; k += 5) {
    const set = units.slice(k, k + 5);
    const xa = set[0].x0, xb = set[set.length - 1].x1;
    const topY = baseAt(xb) - hAt(xb) * 1.45 - 60;
    const t = 4.7 + (k / units.length) * 2.0;
    later('palace', { x: xa - 20, y: topY, w: xb - xa + 40, h: baseAt(xb) - topY + 10 }, (c) => {
      for (const u of set) bay(c, u);
    }, { t, d: 0.8, reveal: 'rise' });
  }
  // pavilion roofs and turrets, which sit over two bays
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    if (!u.pav || (k > 0 && units[k - 1].pav)) continue;
    const v = units[k + 1] && units[k + 1].pav ? units[k + 1] : u;
    const xa = u.x0, xb = v.x1, s = u.s, top = baseAt(xb) - hAt(xb) * 1.3;
    const t = 4.7 + (k / units.length) * 2.0 + 0.6;
    later('palace', { x: xa - 20, y: top - 90 * s - 30, w: xb - xa + 40, h: 140 * s + 30 }, (c) => {
      const mx = (xa + xb) / 2, w = xb - xa;
      const rf = [[xa - 2, top], [xb + 2, top], [mx + w * 0.12, top - w * 0.95], [mx - w * 0.12, top - w * 0.95]];
      c.fillStyle = SLATE; poly(c, rf); c.fill();
      c.strokeStyle = SLATE_D; c.lineWidth = 1; c.beginPath();
      for (let f = 0.1; f < 1; f += 0.12) { c.moveTo(lerp(xa, xb, f), top); c.lineTo(lerp(mx - w * 0.12, mx + w * 0.12, f), top - w * 0.95); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.5; poly(c, rf); c.stroke();
      c.fillStyle = INK; c.fillRect(mx - w * 0.12, top - w * 0.95 - 3, w * 0.24, 4);
      c.fillRect(mx - 1, top - w * 0.95 - 22 * s, 2, 22 * s);
      // the corner turrets, with their pointed caps
      for (const tx of [xa, xb]) {
        c.fillStyle = STONE; c.fillRect(tx - 5 * s, top - 30 * s, 10 * s, 34 * s);
        c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(tx - 5 * s, top - 30 * s, 10 * s, 34 * s);
        c.fillStyle = OCHRE_D; poly(c, [[tx - 7 * s, top - 30 * s], [tx + 7 * s, top - 30 * s], [tx, top - 62 * s]]); c.fill(); c.stroke();
      }
    }, { t, d: 0.7, reveal: 'rise' });
  }
  jobs.sort((j1, j2) => j1[3].t - j2[3].t).forEach((j) => p.group(...j));
  // the river wall and terrace, all along the front and under the tower
  const wall = [];
  for (let xx = X0 - 10; xx <= 1000; xx += 10) wall.push([xx, baseAt(Math.min(xx, PX1))]);
  wall.push([1000, RIVER + 4], [X0 - 10, RIVER + 4]);
  p.group('palace', boxOf(wall, 6), (c) => {
    c.fillStyle = mix(STONE, OCHRE_D, 0.35); poly(c, wall); c.fill();
    c.save(); poly(c, wall); c.clip();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 6; k++) {
      c.moveTo(X0 - 10, lerp(baseAt(X0), RIVER, k / 6));
      for (let xx = X0; xx <= 1000; xx += 20) c.lineTo(xx, lerp(baseAt(Math.min(xx, PX1)), RIVER, k / 6));
    }
    c.stroke();
    c.fillStyle = INK; c.fillRect(X0 - 10, RIVER - 14, 1020, 18);
    c.fillStyle = mix(STONE, OCHRE_D, 0.35); c.beginPath();
    for (let xx = X0; xx < 1000; xx += 26) gouge(c, xx, RIVER - 6, 18, 1.6);
    c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
    c.moveTo(X0 - 10, baseAt(X0)); for (let xx = X0; xx <= 1000; xx += 10) c.lineTo(xx, baseAt(Math.min(xx, PX1))); c.stroke();
  }, { t: 6.7, d: 1.0, reveal: 'wipe' });
}

// one bay of the river front: three tiers of lancets between buttresses
function bay(c, u) {
  const { x0, x1, s, pav } = u;
  const w = x1 - x0, yb = baseAt(x1), h = hAt(x1) * (pav ? 1.3 : 1);
  c.fillStyle = STONE; c.fillRect(x0, yb - h, w + 0.6, h);
  // the buttress's shaded side
  c.fillStyle = OCHRE_D; c.fillRect(x1 - w * 0.16, yb - h, w * 0.16, h);
  // three tiers of paired lancets, a fourth in a pavilion
  const tiers = pav ? [[0.06, 0.22], [0.3, 0.48], [0.55, 0.72], [0.79, 0.92]] : [[0.08, 0.3], [0.4, 0.62], [0.72, 0.88]];
  c.fillStyle = INK; c.beginPath();
  for (const [a, b] of tiers) {
    const lw = w * 0.2;
    lancet(c, x0 + w * 0.16, yb - h * a, lw, h * (b - a));
    lancet(c, x0 + w * 0.5, yb - h * a, lw, h * (b - a));
  }
  c.fill();
  // tracery bands between the tiers
  c.strokeStyle = INK; c.lineWidth = Math.max(0.8, 1.2 * s); c.beginPath();
  for (const [, b] of tiers) { const y = yb - h * (b + 0.035); c.moveTo(x0, y); c.lineTo(x1, y); }
  for (const [a] of tiers) {
    const y = yb - h * (a - 0.02);
    for (let k = 0; k < 3; k++) { const xx = x0 + w * (0.12 + k * 0.28); c.moveTo(xx, y); c.quadraticCurveTo(xx + w * 0.1, y - 7 * s, xx + w * 0.2, y); }
  }
  c.stroke();
  // the buttress line and its pinnacle above the parapet
  c.lineWidth = Math.max(1, 1.8 * s); c.beginPath(); c.moveTo(x1, yb); c.lineTo(x1, yb - h); c.stroke();
  poly(c, [[x1 - 3.5 * s, yb - h], [x1 + 3.5 * s, yb - h], [x1, yb - h - 26 * s]]); c.fill();
  // the parapet: a black band with little openings
  c.fillRect(x0, yb - h - 1, w + 0.6, 6 * s);
  c.fillStyle = STONE;
  for (let xx = x0 + 3 * s; xx < x1 - 4 * s; xx += 7 * s) c.fillRect(xx, yb - h + 1, 3 * s, 2.5 * s);
}

// ---------------------------------------------------------------- the Elizabeth Tower
function tower(p, r) {
  const B = TB, cx = TX;
  const hw = 62, side = 32, SH = 500; // the shaft's height // the front face's half width, and the shaded side face
  // the shaft: recessed panels, string courses, a lit front and a cut-dark side
  p.group('tower', { x: cx - hw - 20, y: B - SH - 20, w: 2 * hw + side + 40, h: SH + 40 }, (c) => {
    const top = B - SH;
    c.save(); c.translate(3, -2); // the ochre printed a little off the key
    c.fillStyle = OCHRE; c.fillRect(cx - hw, top, 2 * hw, SH);
    c.restore();
    c.fillStyle = INK; c.fillRect(cx + hw, top + 4, side, SH);
    c.fillStyle = OCHRE_D; c.beginPath();
    for (let y = top + 14; y < B - 6; y += 14) gouge(c, cx + hw + 4, y + (y % 28 ? 0 : 3), side - 8, 1.5, 0.02);
    c.fill();
    // panels: three a stage, pointed heads, a slit window in each
    const stages = 9, sh = SH / stages;
    c.strokeStyle = INK; c.lineCap = 'butt';
    for (let i = 0; i < stages; i++) {
      const y = B - i * sh;
      c.lineWidth = i % 3 === 0 ? 3.4 : 1.8;
      c.beginPath(); c.moveTo(cx - hw, y - sh); c.lineTo(cx + hw, y - sh); c.stroke();
      c.lineWidth = 1.4; c.beginPath();
      for (let k = 0; k < 3; k++) {
        const px = cx - hw + 10 + k * ((2 * hw - 20) / 3) + 3;
        const pw = (2 * hw - 20) / 3 - 6;
        lancet(c, px, y - 4, pw, sh - 10);
      }
      c.stroke();
      c.fillStyle = OCHRE_D; c.beginPath();
      for (let k = 0; k < 3; k++) { const px = cx - hw + 10 + k * ((2 * hw - 20) / 3) + 3, pw = (2 * hw - 20) / 3 - 6; c.rect(px + pw * 0.62, y - sh * 0.62, pw * 0.38, sh * 0.58); }
      c.fill();
      if (i > 0) {
        c.fillStyle = INK; c.beginPath();
        for (let k = 0; k < 3; k++) { const px = cx - hw + 10 + k * ((2 * hw - 20) / 3) + 3, pw = (2 * hw - 20) / 3 - 6; lancet(c, px + pw * 0.36, y - 12, pw * 0.28, sh * 0.5); }
        c.fill();
      }
    }
    // the corner buttresses
    c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath();
    c.moveTo(cx - hw + 8, top); c.lineTo(cx - hw + 8, B); c.moveTo(cx + hw - 8, top); c.lineTo(cx + hw - 8, B); c.stroke();
    c.lineWidth = 2.6; c.strokeRect(cx - hw, top, 2 * hw, SH);
    // the door at the foot
    c.fillStyle = INK; c.beginPath(); lancet(c, cx - 14, B, 28, 46); c.fill();
  }, { t: 5.0, d: 1.9, reveal: 'rise', ease: 'inOut' });

  // the clock stage: wider, gilt frame, black spandrels, the dial
  const cb = B - SH, ch = 150, cw = 72;
  const dial = [cx, cb - 78], dr = 50;
  p.group('tower', { x: cx - cw - 10, y: cb - ch - 20, w: 2 * cw + side + 30, h: ch + 30 }, (c) => {
    c.save(); c.translate(3, -2);
    c.fillStyle = OCHRE; c.fillRect(cx - cw, cb - ch, 2 * cw, ch);
    c.restore();
    c.fillStyle = INK; c.fillRect(cx + cw, cb - ch + 4, side - 4, ch);
    // the dial on the side, seen edge on
    c.strokeStyle = OCHRE; c.lineWidth = 2.4; c.beginPath(); c.ellipse(cx + cw + 13, dial[1], 8, dr * 0.95, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.6; c.strokeRect(cx - cw, cb - ch, 2 * cw, ch);
    // the square gilt frame and its dark corners
    const fq = dr + 10;
    c.fillStyle = INK; c.fillRect(dial[0] - fq, dial[1] - fq, 2 * fq, 2 * fq);
    c.fillStyle = OCHRE;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.arc(dial[0] + sx * fq * 0.78, dial[1] + sy * fq * 0.78, 5, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = OCHRE; c.lineWidth = 3; c.strokeRect(dial[0] - fq + 3, dial[1] - fq + 3, 2 * fq - 6, 2 * fq - 6);
    // the band of blind tracery under it, and the little gables over it
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath();
    for (let x = cx - cw + 6; x < cx + cw - 10; x += 14) { c.moveTo(x, cb - 4); c.lineTo(x, cb - 12); c.quadraticCurveTo(x + 7, cb - 20, x + 14, cb - 12); }
    c.stroke();
    c.fillStyle = INK;
    for (const gx of [cx - 46, cx, cx + 46]) poly(c, [[gx - 20, cb - ch + 2], [gx + 20, cb - ch + 2], [gx, cb - ch - 14]]), c.fill();
  }, { t: 6.7, d: 0.8, reveal: 'rise' });

  // the dial: cream glass, hour bars, minute marks
  p.group('tower', { x: dial[0] - dr - 6, y: dial[1] - dr - 6, w: 2 * dr + 12, h: 2 * dr + 12 }, (c) => {
    c.fillStyle = CREAM; c.beginPath(); c.arc(dial[0], dial[1], dr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.lineWidth = 1; c.beginPath(); c.arc(dial[0], dial[1], dr - 14, 0, Math.PI * 2); c.stroke();
    c.lineCap = 'butt';
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2, big = k % 5 === 0;
      c.lineWidth = big ? 3.6 : 1;
      c.beginPath(); c.moveTo(dial[0] + Math.cos(a) * (dr - (big ? 13 : 5)), dial[1] + Math.sin(a) * (dr - (big ? 13 : 5))); c.lineTo(dial[0] + Math.cos(a) * (dr - 2), dial[1] + Math.sin(a) * (dr - 2)); c.stroke();
    }
    // the gilt rays of the inner glass
    c.strokeStyle = OCHRE; c.lineWidth = 1;
    c.beginPath(); for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; c.moveTo(dial[0] + Math.cos(a) * 8, dial[1] + Math.sin(a) * 8); c.lineTo(dial[0] + Math.cos(a) * (dr - 16), dial[1] + Math.sin(a) * (dr - 16)); } c.stroke();
  }, { t: 7.3, d: 0.8, reveal: 'iris', ease: 'inOut' });

  // the belfry: three tall openings a face, pinnacles at the corners
  const bb = cb - ch, bh = 96, bw = 66;
  p.group('tower', { x: cx - bw - 14, y: bb - bh - 50, w: 2 * bw + side + 28, h: bh + 54 }, (c) => {
    c.save(); c.translate(3, -2);
    c.fillStyle = OCHRE; c.fillRect(cx - bw, bb - bh, 2 * bw, bh);
    c.restore();
    c.fillStyle = INK; c.fillRect(cx + bw, bb - bh + 4, side - 2, bh);
    c.beginPath();
    for (let k = -1; k <= 1; k++) lancet(c, cx + k * 40 - 13, bb - 10, 26, 74);
    c.fill();
    c.strokeStyle = OCHRE; c.lineWidth = 2; c.beginPath();
    for (let k = -1; k <= 1; k++) { c.moveTo(cx + k * 40, bb - 10); c.lineTo(cx + k * 40, bb - 70); c.moveTo(cx + k * 40 - 13, bb - 40); c.lineTo(cx + k * 40 + 13, bb - 40); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(cx - bw, bb - bh, 2 * bw, bh);
    // the cornice, with cresting
    c.fillStyle = INK; c.fillRect(cx - bw - 6, bb - bh - 8, 2 * bw + side + 8, 10);
    c.fillStyle = OCHRE; for (let x = cx - bw - 2; x < cx + bw + side; x += 9) c.fillRect(x, bb - bh - 6, 4, 5);
    // corner pinnacles
    c.fillStyle = INK;
    for (const px of [cx - bw, cx + bw, cx + bw + side - 4]) {
      c.fillRect(px - 4, bb - bh - 26, 8, 20);
      poly(c, [[px - 6, bb - bh - 26], [px + 6, bb - bh - 26], [px, bb - bh - 48]]); c.fill();
    }
  }, { t: 7.5, d: 0.7, reveal: 'rise' });

  // the iron roof: steep, ribbed, with a gabled window on each face
  const rb = bb - bh - 8, rh = 120, rt = rb - rh;
  p.group('tower', { x: cx - 90, y: rt - 20, w: 200, h: rh + 30 }, (c) => {
    const rf = [[cx - 66, rb], [cx + 66, rb], [cx + 26, rt], [cx - 26, rt]];
    const rs = [[cx + 66, rb], [cx + 66 + side - 6, rb], [cx + 26 + 6, rt], [cx + 26, rt]];
    c.fillStyle = SLATE; poly(c, rf); c.fill();
    c.fillStyle = INK; poly(c, rs); c.fill();
    c.strokeStyle = SLATE_D; c.lineWidth = 1.4; c.beginPath();
    for (let f = 0.08; f < 1; f += 0.09) { c.moveTo(lerp(cx - 66, cx + 66, f), rb); c.lineTo(lerp(cx - 26, cx + 26, f), rt); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.2; poly(c, rf); c.stroke();
    // the gabled windows
    for (const gx of [cx - 30, cx + 30]) {
      const gy = rb - 34;
      c.fillStyle = OCHRE; poly(c, [[gx - 14, gy + 20], [gx + 14, gy + 20], [gx + 14, gy], [gx, gy - 18], [gx - 14, gy]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = INK; c.beginPath(); lancet(c, gx - 5, gy + 18, 10, 26); c.fill();
    }
    // the corner pinnacles at its foot
    for (const px of [cx - 66, cx + 66]) {
      c.fillStyle = INK; poly(c, [[px - 6, rb], [px + 6, rb], [px, rb - 52]]); c.fill();
    }
  }, { t: 7.9, d: 0.8, reveal: 'rise' });

  // the lantern that is lit when the House sits, the spire and the finial
  const lb = rt, lh = 30, lt = lb - lh, st = lt - 92;
  p.group('tower', { x: cx - 40, y: st - 40, w: 90, h: lb - st + 48 }, (c) => {
    c.fillStyle = OCHRE; c.fillRect(cx - 22, lt, 44, lh);
    c.fillStyle = CREAM; c.beginPath(); for (const k of [-1, 0, 1]) lancet(c, cx + k * 13 - 4, lb - 4, 8, 22); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(cx - 22, lt, 44, lh);
    c.fillStyle = INK; c.fillRect(cx - 26, lt - 4, 52, 6);
    c.fillStyle = SLATE; poly(c, [[cx - 20, lt - 3], [cx + 20, lt - 3], [cx, st]]); c.fill();
    c.fillStyle = INK; poly(c, [[cx + 4, lt - 3], [cx + 20, lt - 3], [cx, st]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.8; poly(c, [[cx - 20, lt - 3], [cx + 20, lt - 3], [cx, st]]); c.stroke();
    c.fillStyle = OCHRE;
    for (let k = 1; k < 6; k++) { const f = k / 6; c.beginPath(); c.arc(cx - 20 * (1 - f) - 2, lt - 3 - (lt - 3 - st) * f, 2.2, 0, Math.PI * 2); c.fill(); }
    // the finial: an orb and a cross-flower
    c.fillStyle = OCHRE; c.beginPath(); c.arc(cx, st - 5, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = INK; c.fillRect(cx - 1.4, st - 28, 2.8, 20); c.fillRect(cx - 7, st - 22, 14, 2.6);
  }, { t: 8.4, d: 0.7, reveal: 'rise' });

  // the hands, keeping time
  p.live('tower', {
    t: 7.9, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const mins = 52 + Math.floor(time / 3) + smoothTick(time / 3), hrs = 6 + mins / 60;
      const am = (mins / 60) * Math.PI * 2 - Math.PI / 2, ah = (hrs / 12) * Math.PI * 2 - Math.PI / 2;
      c.strokeStyle = INK; c.lineCap = 'round';
      c.lineWidth = 4.4; c.beginPath(); c.moveTo(dial[0], dial[1]); c.lineTo(dial[0] + Math.cos(ah) * 26, dial[1] + Math.sin(ah) * 26); c.stroke();
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(dial[0] - Math.cos(am) * 6, dial[1] - Math.sin(am) * 6); c.lineTo(dial[0] + Math.cos(am) * 42, dial[1] + Math.sin(am) * 42); c.stroke();
      c.fillStyle = RED; c.beginPath(); c.arc(dial[0], dial[1], 3.4, 0, Math.PI * 2); c.fill();
    },
  });
}
// the minute hand jumps, and settles
function smoothTick(f) { const k = f - Math.floor(f); return k < 0.12 ? (1 - (1 - k / 0.12) ** 3) - 1 : 0; }

// ---------------------------------------------------------------- Westminster Bridge
const BX0 = 962;
const bT = (x) => (x - BX0) / (X1 - BX0);
const deckY = (x) => lerp(1392, 1496, bT(x));
const footY = (x) => lerp(RIVER - 2, 1650, bT(x));
const bS = (x) => lerp(1, 1.55, bT(x));

function bridge(p, r) {
  const piers = [1000, 1130, 1292, 1490, 1740];
  // the stone piers with their cutwaters
  p.group('bridge', { x: BX0 - 10, y: 1360, w: X1 - BX0 + 20, h: 240 }, (c) => {
    for (const px of piers) {
      const s = bS(px), pw = 16 * s, top = deckY(px) + 24 * s, foot = footY(px);
      c.fillStyle = mix(STONE, CREAM, 0.3); c.fillRect(px - pw, top, 2 * pw, foot - top);
      c.fillStyle = OCHRE_D; c.fillRect(px + pw * 0.3, top, pw * 0.7, foot - top);
      poly(c, [[px - pw, foot - 22 * s], [px + pw, foot - 22 * s], [px, foot - 44 * s]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(px - pw, top, 2 * pw, foot - top);
      c.lineWidth = 1; c.beginPath();
      for (let y = top + 10 * s; y < foot; y += 9 * s) { c.moveTo(px - pw, y); c.lineTo(px + pw, y); }
      c.stroke();
    }
  }, { t: 8.0, d: 0.9, reveal: 'rise' });

  // the iron arches, the spandrels and the deck's fascia
  p.group('bridge', { x: BX0 - 10, y: 1350, w: X1 - BX0 + 20, h: 260 }, (c) => {
    // the deck, seen edge on
    const fas = [];
    for (let x = BX0; x <= X1 + 10; x += 10) fas.push([x, deckY(x)]);
    for (let x = X1 + 10; x >= BX0; x -= 10) fas.push([x, deckY(x) + 26 * bS(x)]);
    c.fillStyle = SLATE; poly(c, fas); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; poly(c, fas); c.stroke();
    for (let i = 0; i < piers.length - 1; i++) {
      const a = piers[i] + 16 * bS(piers[i]), b = piers[i + 1] - 16 * bS(piers[i + 1]);
      const top = (x) => deckY(x) + 26 * bS(x);
      const spring = (x) => footY(x) - 46 * bS(x);
      // the spandrel and the arch
      const outer = [], inner = [];
      for (let k = 0; k <= 24; k++) {
        const f = k / 24, x = lerp(a, b, f);
        outer.push([x, top(x)]);
        inner.push([x, lerp(spring(a), spring(b), f) - Math.sin(f * Math.PI) ** 0.7 * (spring(x) - top(x) - 12 * bS(x))]);
      }
      const span = [...outer, ...inner.slice().reverse()];
      c.fillStyle = SLATE; poly(c, span); c.fill();
      // the iron ribs, radial in the spandrel
      c.save(); poly(c, span); c.clip();
      c.strokeStyle = SLATE_D; c.lineWidth = 1.4; c.beginPath();
      for (let k = 1; k < 18; k++) { const f = k / 18, [ix, iy] = inner[Math.round(f * 24)]; c.moveTo(ix, iy); c.lineTo(lerp(a, b, f) + (f - 0.5) * 20, top(lerp(a, b, f))); }
      c.stroke();
      c.restore();
      // under the arch: the shadow, and the paler water beyond
      const hole = [...inner, [b, footY(b) - 4], [a, footY(a) - 4]];
      c.fillStyle = INK; poly(c, hole); c.fill();
      c.save(); poly(c, hole); c.clip();
      c.fillStyle = SLATE_L; c.beginPath();
      for (let y = lerp(spring(a), spring(b), 0.5) - 10; y < footY(b); y += 7) for (let x = a + 6; x < b; x += 26) gouge(c, x + ((y * 3) % 13), y, 20, 1.7);
      c.fill();
      c.restore();
      c.strokeStyle = OCHRE; c.lineWidth = 2.2; c.beginPath(); inner.forEach(([x, y], k) => (k ? c.lineTo(x, y + 2) : c.moveTo(x, y + 2))); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); inner.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
  }, { t: 8.4, d: 1.3, reveal: 'wipe', ease: 'inOut' });

  // buses and a cab on the deck; the parapet, in the layer above, hides the wheels
  const traffic = [
    { kind: 'bus', ph: 0.05, sp: 0.032, lane: 0 }, { kind: 'bus', ph: 0.55, sp: 0.032, lane: 0 },
    { kind: 'bus', ph: 0.3, sp: -0.028, lane: 1 }, { kind: 'cab', ph: 0.8, sp: -0.04, lane: 1 }, { kind: 'cab', ph: 0.35, sp: 0.045, lane: 0 },
  ];
  p.live('bridge', {
    t: 9.4, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(BX0 + 4, 1200, X1 - BX0, 300); c.clip();
      for (const lane of [1, 0]) {
        for (const v of traffic) {
          if (v.lane !== lane) continue;
          let f = (v.ph + time * v.sp) % 1; if (f < 0) f += 1;
          const x = lerp(BX0 - 120, X1 + 140, f), s = bS(x) * (lane ? 0.94 : 1);
          const y = deckY(x) + (lane ? -10 : -2);
          if (v.kind === 'bus') bus(c, x, y, s, v.sp > 0 ? 1 : -1);
          else cab(c, x, y, s, v.sp > 0 ? 1 : -1);
        }
      }
      c.restore();
    },
  });

  // people on the near pavement, their heads and hats over the parapet
  const folk = [];
  for (let x = BX0 + 30; x < X1 - 10; x += r.range(28, 70)) folk.push([x, r.int(0, 3), r.chance(0.5) ? 1 : -1]);
  p.group('bridgeTop', { x: BX0, y: 1300, w: X1 - BX0, h: 200 }, (c) => {
    for (const [x, kind, dir] of folk) person(c, x, deckY(x) + 8, bS(x) * 0.95, kind, dir);
  }, { t: 8.9, d: 0.6, reveal: 'fade' });

  // the parapet: open Gothic tracery, and the lamps over the piers
  p.group('bridgeTop', { x: BX0 - 10, y: 1300, w: X1 - BX0 + 20, h: 200 }, (c) => {
    const ph = (x) => 24 * bS(x);
    const band = [];
    for (let x = BX0; x <= X1 + 10; x += 10) band.push([x, deckY(x) + 8 - ph(x)]);
    for (let x = X1 + 10; x >= BX0; x -= 10) band.push([x, deckY(x) + 8]);
    c.fillStyle = SLATE; poly(c, band); c.fill();
    c.fillStyle = mix(SLATE_L, CREAM, 0.3); c.beginPath();
    for (let x = BX0 + 10; x < X1; x += 15 * bS(x)) {
      const s = bS(x), y = deckY(x) + 8 - ph(x) / 2;
      c.moveTo(x + 4.5 * s, y); c.arc(x, y, 4.5 * s, 0, Math.PI * 2);
    }
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath();
    c.moveTo(BX0, deckY(BX0) + 8 - ph(BX0)); for (let x = BX0; x <= X1 + 10; x += 10) c.lineTo(x, deckY(x) + 8 - ph(x)); c.stroke();
    c.lineWidth = 1.6; c.beginPath();
    c.moveTo(BX0, deckY(BX0) + 8); for (let x = BX0; x <= X1 + 10; x += 10) c.lineTo(x, deckY(x) + 8); c.stroke();
  }, { t: 9.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  // the lamps: an iron standard with three lanterns
  const lamps = [1000, 1130, 1292, 1490];
  lamps.forEach((lx, i) => {
    const s = bS(lx), y = deckY(lx) + 8 - 24 * s, top = y - 86 * s;
    p.group('bridgeTop', { x: lx - 30 * s, y: top - 26 * s, w: 60 * s, h: y - top + 30 * s }, (c) => lamp(c, lx, y, s), { t: 9.6 + i * 0.15, d: 0.6, reveal: 'rise' });
  });
}

function lamp(c, x, y, s) {
  c.fillStyle = INK;
  c.fillRect(x - 6 * s, y - 14 * s, 12 * s, 14 * s);
  c.fillRect(x - 2.4 * s, y - 80 * s, 4.8 * s, 70 * s);
  c.strokeStyle = INK; c.lineWidth = 2.2 * s; c.beginPath();
  c.moveTo(x, y - 66 * s); c.quadraticCurveTo(x - 16 * s, y - 70 * s, x - 18 * s, y - 60 * s);
  c.moveTo(x, y - 66 * s); c.quadraticCurveTo(x + 16 * s, y - 70 * s, x + 18 * s, y - 60 * s);
  c.stroke();
  for (const [lx, ly] of [[x - 18 * s, y - 60 * s], [x + 18 * s, y - 60 * s], [x, y - 84 * s]]) {
    c.fillStyle = OCHRE; poly(c, [[lx - 5 * s, ly], [lx + 5 * s, ly], [lx + 6 * s, ly - 10 * s], [lx - 6 * s, ly - 10 * s]]); c.fill();
    c.fillStyle = INK; poly(c, [[lx - 7 * s, ly - 10 * s], [lx + 7 * s, ly - 10 * s], [lx, ly - 17 * s]]); c.fill();
    c.fillRect(lx - 5 * s, ly, 10 * s, 2 * s);
  }
}

// a figure from the chest up: 0 a bowler, 1 a cloche, 2 an umbrella, 3 a cap
function person(c, x, y, s, kind, dir) {
  c.fillStyle = INK;
  c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 8 * s, y - 30 * s); c.quadraticCurveTo(x, y - 36 * s, x + 8 * s, y - 30 * s); c.lineTo(x + 9 * s, y); c.closePath(); c.fill();
  c.beginPath(); c.arc(x, y - 40 * s, 5.5 * s, 0, Math.PI * 2); c.fill();
  if (kind === 0) { c.fillRect(x - 8 * s, y - 45 * s, 16 * s, 2.4 * s); c.beginPath(); c.arc(x, y - 45 * s, 5.4 * s, Math.PI, 0); c.fill(); }
  else if (kind === 1) { c.fillStyle = RED; c.beginPath(); c.arc(x, y - 43 * s, 6.5 * s, Math.PI, 0); c.fill(); c.fillRect(x - 7 * s, y - 43 * s, 14 * s, 3 * s); }
  else if (kind === 2) { c.beginPath(); c.moveTo(x - 20 * s, y - 50 * s); c.quadraticCurveTo(x, y - 70 * s, x + 20 * s, y - 50 * s); c.closePath(); c.fill(); c.fillRect(x - 0.8 * s, y - 52 * s, 1.6 * s, 14 * s); }
  else { c.fillRect(x - 6 * s + dir * 2 * s, y - 46 * s, 12 * s, 3 * s); }
  c.fillStyle = OCHRE; c.fillRect(x + dir * 2.5 * s - 1 * s, y - 41 * s, 2 * s, 2 * s);
}

// a red double-decker, side on, its front toward dir
function bus(c, x, y, s, dir) {
  const L = 112 * s, Hh = 70 * s, x0 = x - L / 2;
  c.save();
  c.translate(x, 0); c.scale(dir, 1); c.translate(-x, 0);
  // the red body, printed a little off its key line
  c.fillStyle = RED;
  c.beginPath(); c.moveTo(x0 + 2, y); c.lineTo(x0 + 2, y - Hh + 10 * s); c.quadraticCurveTo(x0 + 2, y - Hh + 2, x0 + 12 * s, y - Hh + 2);
  c.lineTo(x0 + L - 10 * s, y - Hh + 2); c.quadraticCurveTo(x0 + L + 2, y - Hh + 2, x0 + L + 2, y - Hh + 14 * s); c.lineTo(x0 + L + 2, y); c.closePath(); c.fill();
  // the windows, upper and lower deck
  c.fillStyle = CREAM;
  c.fillRect(x0 + 6 * s, y - Hh * 0.86, L - 14 * s, Hh * 0.22);
  c.fillRect(x0 + 6 * s, y - Hh * 0.47, L - 30 * s, Hh * 0.2);
  c.fillStyle = INK;
  for (let k = 0; k < 6; k++) c.fillRect(x0 + 6 * s + k * (L - 14 * s) / 6 + (L - 14 * s) / 6 - 2.2 * s, y - Hh * 0.86, 2.2 * s, Hh * 0.22);
  for (let k = 0; k < 5; k++) c.fillRect(x0 + 6 * s + k * (L - 30 * s) / 5 + (L - 30 * s) / 5 - 2.2 * s, y - Hh * 0.47, 2.2 * s, Hh * 0.2);
  // the cream band between the decks, the cab and the blind
  c.fillStyle = CREAM; c.fillRect(x0, y - Hh * 0.6, L, 3 * s);
  c.fillStyle = INK; c.fillRect(x0 + L - 16 * s, y - Hh * 0.47, 12 * s, Hh * 0.28);
  c.fillStyle = CREAM; c.fillRect(x0 + L - 14 * s, y - Hh * 0.98, 10 * s, 5 * s);
  // the key line
  c.strokeStyle = INK; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x0, y - Hh + 8 * s); c.quadraticCurveTo(x0, y - Hh, x0 + 10 * s, y - Hh);
  c.lineTo(x0 + L - 12 * s, y - Hh); c.quadraticCurveTo(x0 + L, y - Hh, x0 + L, y - Hh + 12 * s); c.lineTo(x0 + L, y); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x0 + 20 * s, y, 8 * s, 0, Math.PI * 2); c.arc(x0 + L - 24 * s, y, 8 * s, 0, Math.PI * 2); c.fill();
  c.restore();
}
function cab(c, x, y, s, dir) {
  c.save(); c.translate(x, 0); c.scale(dir, 1); c.translate(-x, 0);
  c.fillStyle = INK;
  c.beginPath(); c.moveTo(x - 26 * s, y); c.lineTo(x - 26 * s, y - 18 * s); c.lineTo(x - 14 * s, y - 20 * s); c.lineTo(x - 10 * s, y - 34 * s);
  c.lineTo(x + 12 * s, y - 34 * s); c.lineTo(x + 16 * s, y - 20 * s); c.lineTo(x + 26 * s, y - 18 * s); c.lineTo(x + 26 * s, y); c.closePath(); c.fill();
  c.fillStyle = CREAM; c.fillRect(x - 7 * s, y - 31 * s, 8 * s, 9 * s); c.fillRect(x + 3 * s, y - 31 * s, 7 * s, 9 * s);
  c.fillStyle = OCHRE; c.fillRect(x - 2 * s, y - 38 * s, 6 * s, 4 * s);
  c.restore();
}

// ---------------------------------------------------------------- on the river
function boats(p, r) {
  // the clock tower's reflection, broken by the water
  p.group('river', { x: TX - 120, y: RIVER, w: 240, h: 330 }, (c) => {
    const rr = rng(5);
    c.fillStyle = OCHRE;
    for (let y = RIVER + 8; y < RIVER + 300; y += 9) {
      const k = (y - RIVER) / 300, w = lerp(120, 40, k) * rr.range(0.5, 1.1);
      if (rr.chance(0.22)) continue;
      c.fillRect(TX - w / 2 + rr.range(-12, 12) + 3, y, w, lerp(4, 2, k));
    }
    c.fillStyle = SLATE_D; c.beginPath();
    for (let y = RIVER + 14; y < RIVER + 220; y += 13) gouge(c, TX + 58 + rr.range(-8, 8), y, rr.range(14, 36), 2.2);
    c.fill();
  }, { t: 9.0, d: 1.0, reveal: 'fall' });
  // the evening sun's path
  p.group('river', { x: 300, y: RIVER, w: 360, h: 320 }, (c) => {
    const rr = rng(8);
    c.fillStyle = mix(OCHRE, CREAM, 0.4);
    for (let y = RIVER + 14; y < RIVER + 300; y += 11) { const w = rr.range(20, 80) * (1 - (y - RIVER) / 400); c.fillRect(SUN[0] - w / 2 + rr.range(-40, 40), y, w, 3); }
  }, { t: 9.3, d: 1.0, reveal: 'fall' });

  // moored lighters by the palace wall
  p.group('boats', { x: 560, y: 1490, w: 260, h: 70 }, (c) => {
    for (const [x, w] of [[580, 110], [700, 96]]) {
      const y = 1530;
      c.fillStyle = INK; poly(c, [[x, y - 16], [x + w, y - 16], [x + w - 8, y], [x + 6, y]]); c.fill();
      c.fillStyle = SLATE_D; poly(c, [[x + 8, y - 16], [x + w - 8, y - 16], [x + w - 20, y - 28], [x + 20, y - 28]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
      for (let xx = x + 24; xx < x + w - 20; xx += 12) { c.moveTo(xx, y - 28); c.lineTo(xx - 3, y - 16); }
      c.stroke();
      c.fillStyle = CREAM; c.fillRect(x + 4, y - 13, w - 8, 2);
    }
  }, { t: 9.6, d: 0.8, reveal: 'rise' });

  // a tug towing two lighters downstream
  p.live('boats', {
    t: 9.9, d: 1.2, reveal: 'slide', dx: -120,
    draw: (c, time) => {
      const x = 640 + Math.min(time, 90) * 3.5, y = 1688 + Math.sin(time * 0.9) * 1.6;
      // the tow line and the lighters behind
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 76, y - 20); c.quadraticCurveTo(x - 110, y - 10, x - 150, y - 16); c.stroke();
      for (const lx of [x - 260]) {
        c.fillStyle = INK; poly(c, [[lx, y - 22], [lx + 150, y - 22], [lx + 140, y], [lx + 8, y]]); c.fill();
        c.fillStyle = SLATE_D; poly(c, [[lx + 10, y - 22], [lx + 140, y - 22], [lx + 128, y - 38], [lx + 22, y - 38]]); c.fill();
        c.fillStyle = mix(SLATE_L, CREAM, 0.45); c.beginPath();
        for (let k = 0; k < 4; k++) gouge(c, lx - 40 - k * 24, y + 3 + k * 2, 40, 1.8, 0.02);
        c.fill();
      }
      tug(c, x, y);
      // smoke, in cut rings
      for (let i = 0; i < 6; i++) {
        const age = (time * 0.35 + i / 6) % 1;
        c.fillStyle = `rgba(44,66,87,${0.8 * (1 - age)})`;
        c.beginPath(); c.arc(x + 6 - age * 120, y - 84 - age * 70 + Math.sin(age * 6) * 4, 8 + age * 22, 0, Math.PI * 2); c.fill();
      }
    },
  });
}

function tug(c, x, y) {
  c.fillStyle = INK; poly(c, [[x - 80, y - 24], [x + 72, y - 30], [x + 58, y], [x - 70, y]]); c.fill();
  c.fillStyle = RED; c.fillRect(x - 76, y - 28, 146, 5);
  c.fillStyle = CREAM; c.fillRect(x - 40, y - 52, 56, 24);
  c.fillStyle = INK; for (let k = 0; k < 4; k++) c.fillRect(x - 35 + k * 13, y - 46, 8, 9);
  c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x - 40, y - 52, 56, 24);
  c.fillStyle = CREAM; c.fillRect(x - 6, y - 66, 26, 14); c.strokeRect(x - 6, y - 66, 26, 14);
  c.fillStyle = RED; c.fillRect(x - 2, y - 92, 16, 40);
  c.fillStyle = INK; c.fillRect(x - 2, y - 96, 16, 9); c.strokeRect(x - 2, y - 96, 16, 44);
  c.fillStyle = mix(SLATE_L, CREAM, 0.45); c.beginPath();
  gouge(c, x + 56, y + 2, 50, 2.2, 0.06); gouge(c, x + 30, y + 6, 70, 2, 0.03); c.fill();
}

// ---------------------------------------------------------------- the near bank
function front(p, r) {
  // wisps of fog across the far end of the palace
  fogBand(p, r, 'wisps', 70, 1392, 520, 22, 8.8, 'wipe');
  // the embankment wall at our feet, cut from the black
  const wy = 1772;
  p.group('front', { x: X0, y: wy - 10, w: X1 - X0, h: Y1 - wy + 10 }, (c) => {
    c.fillStyle = INK; c.fillRect(X0, wy, X1 - X0, Y1 - wy);
    c.fillStyle = OCHRE; c.fillRect(X0, wy + 4, X1 - X0, 4);
    // the coping, and the granite courses picked out with a fine gouge
    c.fillStyle = mix(STONE, CREAM, 0.4); c.beginPath();
    const rr = rng(21);
    for (const [y, off] of [[wy + 22, 0], [wy + 38, 40]]) {
      for (let x = X0 + off - 60; x < X1; x += rr.range(70, 100)) {
        gouge(c, x, y, rr.range(40, 70), 1.3);
        c.rect(x - 2, y + 2, 1.6, 12);
      }
    }
    c.fill();
  }, { t: 9.2, d: 0.9, reveal: 'rise' });
  // a dolphin lamp on the embankment
  const lx = 214, ly = wy;
  p.group('front', { x: lx - 70, y: ly - 420, w: 140, h: 430 }, (c) => {
    c.fillStyle = INK;
    // the plinth, and two dolphins coiled about the foot of the column
    poly(c, [[lx - 30, ly], [lx + 30, ly], [lx + 24, ly - 26], [lx - 24, ly - 26]]); c.fill();
    c.fillRect(lx - 28, ly - 32, 56, 7);
    c.strokeStyle = INK; c.lineCap = 'round';
    for (const d of [-1, 1]) {
      c.lineWidth = 13; c.beginPath();
      c.moveTo(lx + d * 26, ly - 44); c.bezierCurveTo(lx + d * 40, ly - 70, lx - d * 6, ly - 84, lx + d * 4, ly - 112); c.stroke();
      // the head, low and outward, and the tail flicked up by the column
      c.beginPath(); c.ellipse(lx + d * 30, ly - 42, 12, 9, d * 0.5, 0, Math.PI * 2); c.fill();
      poly(c, [[lx + d * 38, ly - 42], [lx + d * 50, ly - 36], [lx + d * 38, ly - 36]]); c.fill();
      poly(c, [[lx + d * 4, ly - 110], [lx + d * 22, ly - 128], [lx + d * 14, ly - 108]]); c.fill();
      c.fillStyle = OCHRE; c.beginPath(); c.arc(lx + d * 32, ly - 45, 2.2, 0, Math.PI * 2); c.fill(); c.fillStyle = INK;
    }
    c.fillStyle = OCHRE; c.beginPath();
    gouge(c, lx - 30, ly - 60, 26, 2.2, -1.25); gouge(c, lx + 18, ly - 88, 24, 2, -1.9); c.fill();
    c.fillStyle = INK;
    // the fluted column
    c.fillRect(lx - 9, ly - 330, 18, 214);
    c.fillStyle = mix(STONE, CREAM, 0.3); for (let y = ly - 320; y < ly - 130; y += 22) c.fillRect(lx - 2, y, 2, 14);
    c.fillStyle = INK; c.fillRect(lx - 16, ly - 340, 32, 12); c.fillRect(lx - 12, ly - 130, 24, 10);
    // the lantern and its glow
    c.fillStyle = OCHRE; c.beginPath(); c.arc(lx, ly - 364, 24, 0, Math.PI * 2); c.fill();
    c.fillStyle = CREAM; c.beginPath(); c.arc(lx - 6, ly - 370, 9, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(lx, ly - 364, 24, 0, Math.PI * 2); c.stroke();
    c.fillStyle = INK; poly(c, [[lx - 14, ly - 384], [lx + 14, ly - 384], [lx, ly - 404]]); c.fill();
    c.fillRect(lx - 1.5, ly - 414, 3, 12);
  }, { t: 9.5, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- gulls
function gulls(p, r) {
  const flock = [];
  for (let i = 0; i < 16; i++) flock.push([r.range(1080, 1460), r.range(620, 960), r.range(0.9, 1.7), r.range(-0.3, 0.3)]);
  p.group('gulls', { x: 1040, y: 580, w: 460, h: 420 }, (c) => {
    c.fillStyle = INK;
    for (const [x, y, s, a] of flock) gullShape(c, x, y, s, a, 0.5);
  }, { t: 9.8, d: 1.0, reveal: 'fade' });
  const birds = [];
  for (let i = 0; i < 5; i++) birds.push({ x0: r.range(700, 1250), y0: r.range(900, 1200), ph: r() * 6, sp: r.range(0.18, 0.3), rad: r.range(50, 110) });
  p.live('gulls', {
    t: 10.2, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = INK;
      for (const b of birds) {
        const a = time * b.sp + b.ph;
        gullShape(c, b.x0 + Math.cos(a) * b.rad, b.y0 + Math.sin(a * 1.3) * 26, 1.5, Math.cos(a) * 0.2, (Math.sin(time * 5 + b.ph) + 1) / 2);
      }
    },
  });
}
// a gull as a cut shape: two swept wings
function gullShape(c, x, y, s, a, flap) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  const up = 4 + flap * 6;
  c.beginPath();
  c.moveTo(-16, -up * 0.4); c.quadraticCurveTo(-8, -up - 3, 0, 0); c.quadraticCurveTo(8, -up - 3, 16, -up * 0.4);
  c.quadraticCurveTo(8, -up + 1.5, 0, 3); c.quadraticCurveTo(-8, -up + 1.5, -16, -up * 0.4);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the title
function title(p) {
  // the red block, with a few cuts left at its edges
  const bx = X0, by = 92, bw = X1 - X0, bh = 286;
  const r = rng(33);
  const cuts = gougeField(r, bx, bx + bw, by + 12, by + bh - 6, 12, (y) => (y < by + 40 || y > by + bh - 30 ? 0.35 : 0), { l0: 10, l1: 50, w0: 1, w1: 2.4, g0: 200, g1: 120 });
  p.group('title', { x: bx, y: by, w: bw, h: bh }, (c) => {
    c.fillStyle = RED; c.fillRect(bx, by, bw, bh);
    drawGouges(c, cuts, mix(RED, PAPER, 0.45));
    c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(bx, by, bw, bh);
  }, { t: 10.2, d: 0.9, reveal: 'fall', ease: 'inOut' });
  p.type('title', 'LONDON', W / 2 + 6, by + 236, {
    family: '"Josefin Sans", sans-serif', weight: 700, size: 250, track: 0.2, fit: 1240, align: 'center',
    color: CREAM, shadow: INK, sx: 7, sy: 6, t: 10.9, gap: 0.24, d: 0.8,
  });
  // the black band beneath the picture
  const sy = 1846, sh = 64;
  p.group('title', { x: X0, y: sy, w: X1 - X0, h: sh }, (c) => {
    c.fillStyle = INK; c.fillRect(X0, sy, X1 - X0, sh);
  }, { t: 12.4, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'THE THAMES AT WESTMINSTER', W / 2, sy + 46, {
    family: '"Josefin Sans", sans-serif', weight: 600, size: 34, track: 0.42, align: 'center', color: CREAM, t: 12.8, gap: 0.035, d: 0.5, reveal: 'fade',
  });
  // two red squares, like the knife's start and stop
  for (const [x, t] of [[X0 + 40, 13.4], [X1 - 64, 13.5]]) {
    p.group('title', { x: x - 4, y: sy + 18, w: 32, h: 32 }, (c) => { c.fillStyle = RED; c.fillRect(x, sy + 22, 22, 22); }, { t, d: 0.5, reveal: 'pop' });
  }
}
