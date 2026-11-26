// Zanzibar: a Tingatinga painting. One flat ground of enamel yellow, everything
// outlined in black and patterned with dots: the House of Wonders with its tiers
// of verandas and its clock tower, the Old Fort's crenellated walls, Stone Town's
// tall houses with their carved and studded doors, coconut palms and big painted
// birds; below, dhows with lateen sails on a cobalt sea crowded with patterned fish,
// a turtle, an octopus and coral. The name is painted in black and dotted white.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade } from '../kit.js';

const BLACK = '#15110e', WHITE = '#fbf6ea', YELLOW = '#f6c31b', OCHRE = '#e3a019', ORANGE = '#f07d1c', RED = '#de2f27';
const PINK = '#ef4b97', COBALT = '#1d4cb2', DEEP = '#16378a', SKY = '#33a7e0', TURQ = '#16b1a3', GREEN = '#36a239', LIME = '#a1d23b';
const PURPLE = '#7a3d9f', WOOD = '#7a3d1c', DARKWOOD = '#4f2611', BRASS = '#f2c84a', SAND = '#f2d79a';
const BRIGHT = [RED, ORANGE, PINK, SKY, TURQ, GREEN, LIME, PURPLE, WHITE];
const FACE = '"Luckiest Guy", sans-serif';

export const city = {
  id: 'zanzibar', name: 'Zanzibar', wall: '#3b1f12',
  alt: 'A Tingatinga painting of Zanzibar on a flat yellow ground: the House of Wonders with its tiers of verandas and its clock tower, the Old Fort\'s crenellated walls, tall Stone Town houses with carved, brass-studded doors, coconut palms, big patterned birds and a smiling sun, and below, dhows with lateen sails on a cobalt sea full of dotted fish, a turtle, an octopus and coral, in a black border of colored dots',
  google: 'family=Luckiest+Guy',
  fonts: [['400 100px "Luckiest Guy"', 'ZANZIBAR KARIBU · UNGUJA · STONE TOWN']],
  build,
};

const B = 50;                          // the black border
const SHORE = 1172, SEA = 1186, FLOOR = 1790;

function build() {
  const p = new Plate({ paper: YELLOW, seed: 1964 });
  const r = p.r;
  p.clip = { x: B, y: B, w: W - 2 * B, h: H - 2 * B };
  p.stack('ground', 'sun', 'palms', 'town', 'wonders', 'sea', 'boats', 'fish', 'reef', 'birds', 'title', 'border');
  p.layer('border', { clip: false });

  border(p);
  ground(p, r);
  sun(p, r);
  palms(p, r);
  fort(p, r);
  stoneTown(p, r);
  houseOfWonders(p, r);
  sea(p, r);
  dhows(p, r);
  fishes(p, r);
  reef(p, r);
  birds(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
function shape(c, pts, fill, lw = 3.5, line = BLACK) {
  poly(c, pts); if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
function circle(c, x, y, rr, fill, lw = 0, line = BLACK) {
  c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); }
}
function dots(c, list, color) {
  c.fillStyle = color; c.beginPath();
  for (const [x, y, rr] of list) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); }
  c.fill();
}
// a grid of dots over a box, a little jostled, made at build time
function dotGrid(r, b, step, rad, jit = 0.2) {
  const out = [];
  for (let y = b.y + step / 2, row = 0; y < b.y + b.h; y += step * 0.87, row++) {
    for (let x = b.x + (row % 2 ? step / 2 : 0); x < b.x + b.w; x += step) out.push([x + r.range(-jit, jit) * step, y + r.range(-jit, jit) * step, rad * r.range(0.8, 1.15)]);
  }
  return out;
}
// the shine of wet enamel: a short white curve
function shine(c, x, y, rr, a0 = 3.6, a1 = 4.4) {
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(2, rr * 0.18); c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, rr, a0, a1); c.stroke();
}
function bx(list, pad = 6) { return boxOf(list, pad); }

// ================================================================ the border
function border(p) {
  p.group('border', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = BLACK; c.beginPath(); c.rect(0, 0, W, H); c.rect(B, H - B, W - 2 * B, -(H - 2 * B)); c.fill('evenodd');
    c.strokeStyle = WHITE; c.lineWidth = 3; c.strokeRect(B - 6, B - 6, W - 2 * B + 12, H - 2 * B + 12);
  }, { t: 0.1, d: 0.6, reveal: 'fade' });
  // a ring of colored dots all the way round
  const ring = [];
  const m = B / 2 - 3;
  let k = 0;
  for (let x = 24; x <= W - 24; x += 26) { ring.push([x, m, k++]); ring.push([W - x, H - m, k++]); }
  for (let y = 50; y <= H - 50; y += 26) { ring.push([m, H - y, k++]); ring.push([W - m, y, k++]); }
  const cols = [RED, YELLOW, SKY, PINK, GREEN, ORANGE, WHITE];
  cols.forEach((col, i) => {
    const set = ring.filter((d) => d[2] % cols.length === i).map(([x, y]) => [x, y, 7.5]);
    p.group('border', { x: 0, y: 0, w: W, h: H }, (c) => dots(c, set, col), { t: 0.5 + i * 0.12, d: 0.5, reveal: 'fade' });
  });
}

// ================================================================ the yellow ground
function ground(p, r) {
  // little painted plants and dot flowers scattered over the yellow
  const flowers = [], dashes = [];
  for (let i = 0; i < 110; i++) {
    const x = r.range(B + 20, W - B - 20), y = r.range(470, SHORE - 30);
    if (x > 520 && x < 1080 && y > 640) continue;
    if (r.chance(0.5)) flowers.push([x, y, r.range(4, 7)]);
    else { const a = r.range(-0.5, 0.5); dashes.push([[x, y], [x + Math.cos(a) * 16, y + Math.sin(a) * 16]]); }
  }
  p.group('ground', { x: B, y: 440, w: W - 2 * B, h: SHORE - 420 }, (c) => {
    c.fillStyle = OCHRE; c.beginPath();
    for (const [x, y, rr] of flowers) for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.moveTo(x + Math.cos(a) * rr * 1.5 + rr * 0.6, y + Math.sin(a) * rr * 1.5); c.arc(x + Math.cos(a) * rr * 1.5, y + Math.sin(a) * rr * 1.5, rr * 0.6, 0, Math.PI * 2); }
    c.fill();
    c.strokeStyle = OCHRE; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
    for (const d of dashes) { c.moveTo(d[0][0], d[0][1]); c.lineTo(d[1][0], d[1][1]); }
    c.stroke();
  }, { t: 0.8, d: 0.9, reveal: 'fade' });
  // the sandy shore at the foot of the town
  p.group('ground', { x: B, y: SHORE - 40, w: W - 2 * B, h: 60 }, (c) => {
    shape(c, [[B - 10, SEA + 4], [B - 10, SHORE - 16], [W - B + 10, SHORE - 22], [W - B + 10, SEA + 4]], SAND, 3.5);
  }, { t: 1.0, d: 0.7, reveal: 'wipe' });
}

// ================================================================ the sun
function sun(p, r) {
  const x = 1000, y = 650, R = 72;
  const rays = [];
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2, b = a + Math.PI / 18;
    rays.push([[x + Math.cos(a - 0.09) * (R + 10), y + Math.sin(a - 0.09) * (R + 10)], [x + Math.cos(a + 0.09) * (R + 10), y + Math.sin(a + 0.09) * (R + 10)], [x + Math.cos(a) * (R + (k % 2 ? 46 : 64)), y + Math.sin(a) * (R + (k % 2 ? 46 : 64))]]);
  }
  p.group('sun', { x: x - R - 80, y: y - R - 80, w: 2 * R + 160, h: 2 * R + 160 }, (c) => {
    rays.forEach((ry, k) => shape(c, ry, k % 2 ? RED : ORANGE, 3));
    circle(c, x, y, R + 8, RED, 3.5);
    circle(c, x, y, R - 6, ORANGE, 3);
    // a painted face: eyes, cheeks and a wide smile
    circle(c, x - 30, y - 18, 12, WHITE, 3); circle(c, x + 30, y - 18, 12, WHITE, 3);
    circle(c, x - 27, y - 16, 5, BLACK); circle(c, x + 33, y - 16, 5, BLACK);
    circle(c, x - 48, y + 14, 10, PINK); circle(c, x + 48, y + 14, 10, PINK);
    c.strokeStyle = BLACK; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + 8, 34, 0.2, Math.PI - 0.2); c.stroke();
    shine(c, x, y, R - 18, 3.7, 4.5);
  }, { t: 1.3, d: 0.9, reveal: 'pop', ease: 'back' });
}

// ================================================================ coconut palms
function palm(r, x0, y0, h, lean) {
  // a curved trunk in rings, a crown of fronds, a bunch of coconuts
  const trunk = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; trunk.push([x0 + lean * h * t * t, y0 - h * t]); }
  const top = trunk[12];
  const fronds = [];
  const angs = [-2.9, -2.4, -1.9, -1.35, -0.85, -0.3, 0.15, 2.6];
  for (const a0 of angs) {
    const a = a0 + r.range(-0.12, 0.12), L = r.range(150, 210), droop = 0.9;
    const spine = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; spine.push([top[0] + Math.cos(a) * L * t, top[1] + Math.sin(a) * L * t + droop * L * t * t * 0.55]); }
    // the leaflets either side, as a zigzag outline
    const up = [], dn = [];
    for (let k = 1; k <= 10; k++) {
      const [sx, sy] = spine[k], [px, py] = spine[k - 1];
      const dx = sx - px, dy = sy - py, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      const w = 30 * Math.sin((k / 10) * Math.PI * 0.9 + 0.2);
      up.push([sx + nx * w + dx * 0.6, sy + ny * w + dy * 0.6], [sx + nx * w * 0.25, sy + ny * w * 0.25]);
      dn.push([sx - nx * w + dx * 0.6, sy - ny * w + dy * 0.6], [sx - nx * w * 0.25, sy - ny * w * 0.25]);
    }
    fronds.push({ spine, pts: [spine[0], ...up, spine[10], ...dn.reverse()], col: r.pick([GREEN, '#2b8a31', LIME]) });
  }
  const nuts = [[-14, 14], [10, 18], [-2, 30], [18, 4]].map(([dx, dy]) => [top[0] + dx, top[1] + dy]);
  return { trunk, top, fronds, nuts, box: { x: Math.min(x0, top[0]) - 240, y: top[1] - 220, w: Math.abs(lean * h) + 500, h: h + 260 } };
}
function drawPalm(c, pm, part) {
  if (part === 'trunk') {
    const { trunk } = pm;
    const L = [], R = [];
    trunk.forEach(([x, y], k) => { const w = lerp(20, 11, k / 12); L.push([x - w, y]); R.push([x + w, y]); });
    shape(c, [...L, ...R.reverse()], '#b0702e', 3.5);
    c.strokeStyle = BLACK; c.lineWidth = 2.5; c.beginPath();
    trunk.forEach(([x, y], k) => { if (!k) return; const w = lerp(20, 11, k / 12); c.moveTo(x - w, y + 3); c.quadraticCurveTo(x, y - 6, x + w, y + 3); });
    c.stroke();
    return;
  }
  for (const f of pm.fronds) {
    shape(c, f.pts, f.col, 3);
    c.strokeStyle = BLACK; c.lineWidth = 2.5; c.beginPath(); f.spine.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  }
  for (const [x, y] of pm.nuts) { circle(c, x, y, 13, '#8a5a1e', 3); shine(c, x, y, 7, 3.6, 4.6); }
}
function palms(p, r) {
  const list = [palm(r, 210, SHORE - 8, 640, 0.22), palm(r, 470, SHORE - 6, 470, -0.18), palm(r, 1180, SHORE - 6, 520, 0.12), palm(r, 1430, SHORE - 6, 630, -0.2)];
  list.forEach((pm, i) => {
    p.group('palms', pm.box, (c) => drawPalm(c, pm, 'trunk'), { t: 2.0 + i * 0.25, d: 0.9, reveal: 'rise' });
    p.group('palms', pm.box, (c) => drawPalm(c, pm, 'crown'), { t: 2.6 + i * 0.25, d: 0.8, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the Old Fort
function fort(p, r) {
  const y = SHORE - 14, x0 = 90, x1 = 560, top = 1000;
  const merl = [];
  for (let x = x0; x < x1 - 10; x += 34) merl.push([x, top]);
  const stones = dotGrid(r, { x: x0, y: top + 20, w: x1 - x0, h: y - top - 20 }, 26, 3.4, 0.25);
  p.group('town', { x: x0 - 70, y: 860, w: x1 - x0 + 90, h: y - 850 }, (c) => {
    // the wall and its square merlons
    const wall = [[x0, y], [x0, top]];
    for (const [mx] of merl) wall.push([mx, top], [mx, top - 22], [mx + 20, top - 22], [mx + 20, top]);
    wall.push([x1, top], [x1, y]);
    shape(c, wall, '#c8823e');
    dots(c, stones, '#a9652a');
    // the gate
    c.beginPath(); c.moveTo(300, y); c.lineTo(300, 1080); c.arc(338, 1080, 38, Math.PI, 0); c.lineTo(376, y); c.closePath();
    c.fillStyle = DARKWOOD; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3.5; c.stroke();
    c.strokeStyle = WHITE; c.lineWidth = 3; c.beginPath(); c.arc(338, 1080, 48, Math.PI, 0); c.stroke();
    // the round tower at the corner
    shape(c, [[60, y], [60, 940], [160, 940], [160, y]], '#d28c46');
    const cr = [[52, 940]];
    for (let x = 52; x < 166; x += 22) cr.push([x, 940], [x, 918], [x + 13, 918], [x + 13, 940]);
    cr.push([168, 940], [168, 956], [52, 956]);
    shape(c, cr, '#b8712f');
    c.fillStyle = BLACK; c.fillRect(100, 980, 14, 30); c.fillRect(100, 1050, 14, 30);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(84, 960); c.lineTo(84, y - 4); c.moveTo(136, 960); c.lineTo(136, y - 4); c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ Stone Town houses
const HOUSE = ['#f7b2c6', '#a7dcf2', WHITE, '#f6d36e', '#bfe39b', '#f2a46a'];
function door(c, d) {
  const { x, y, w, h, arch } = d, x0 = x - w / 2, top = y - h;
  // the carved frame: a wide band of zigzag and dots
  shape(c, [[x0 - 14, y], [x0 - 14, top - 26], [x0 + w + 14, top - 26], [x0 + w + 14, y]], WOOD, 3);
  c.strokeStyle = BRASS; c.lineWidth = 2; c.beginPath();
  for (let yy = top - 20; yy < y - 6; yy += 10) { c.moveTo(x0 - 11, yy); c.lineTo(x0 - 3, yy + 5); c.lineTo(x0 - 11, yy + 10); c.moveTo(x0 + w + 11, yy); c.lineTo(x0 + w + 3, yy + 5); c.lineTo(x0 + w + 11, yy + 10); }
  for (let xx = x0 - 8; xx < x0 + w + 8; xx += 10) { c.moveTo(xx, top - 22); c.lineTo(xx + 5, top - 12); c.lineTo(xx + 10, top - 22); }
  c.stroke();
  if (arch) {
    c.beginPath(); c.moveTo(x0 - 14, top - 24); c.arc(x, top - 24, w / 2 + 14, Math.PI, 0); c.closePath();
    c.fillStyle = WOOD; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.moveTo(x0, top - 24); c.arc(x, top - 24, w / 2, Math.PI, 0); c.closePath(); c.fillStyle = DARKWOOD; c.fill(); c.stroke();
    c.strokeStyle = BRASS; c.lineWidth = 2; c.beginPath();
    for (let k = 1; k < 6; k++) { const a = Math.PI + (k / 6) * Math.PI; c.moveTo(x, top - 24); c.lineTo(x + Math.cos(a) * w / 2, top - 24 + Math.sin(a) * w / 2); }
    c.stroke();
  }
  // the two leaves, the carved post between them, the brass studs
  shape(c, [[x0, y], [x0, top], [x0 + w, top], [x0 + w, y]], DARKWOOD, 3);
  c.fillStyle = WOOD; c.fillRect(x - 5, top, 10, h);
  c.strokeStyle = BRASS; c.lineWidth = 1.6; c.beginPath();
  for (let yy = top + 8; yy < y - 4; yy += 12) { c.moveTo(x + 4, yy); c.arc(x, yy, 4, 0, Math.PI * 2); }
  c.stroke();
  c.strokeStyle = BLACK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, top); c.lineTo(x, y); c.stroke();
  dots(c, d.studs, BRASS);
  c.strokeStyle = BLACK; c.lineWidth = 1; c.beginPath(); for (const [sx, sy, sr] of d.studs) { c.moveTo(sx + sr, sy); c.arc(sx, sy, sr, 0, Math.PI * 2); } c.stroke();
}
function mkDoor(x, y, w, h, arch) {
  const studs = [];
  for (let yy = y - h + 12; yy < y - 6; yy += 16) for (const side of [-1, 1]) for (let k = 0; k < 2; k++) studs.push([x + side * (w * 0.17 + k * w * 0.2), yy, 3.4]);
  return { x, y, w, h, arch, studs };
}
function stoneTown(p, r) {
  const list = [
    { x0: 1040, x1: 1200, top: 830, col: HOUSE[0] }, { x0: 1200, x1: 1370, top: 900, col: HOUSE[1] }, { x0: 1370, x1: W - B + 10, top: 800, col: HOUSE[3] },
  ];
  list.forEach((hs, i) => {
    const y = SHORE - 14, w = hs.x1 - hs.x0, cx = (hs.x0 + hs.x1) / 2;
    const dr = mkDoor(cx, y, Math.min(70, w * 0.42), 118, i !== 1);
    const wins = [];
    for (let yy = hs.top + 40; yy < y - 200; yy += 88) for (let k = 0; k < 2; k++) wins.push([hs.x0 + w * (0.18 + k * 0.42), yy, w * 0.22, 54]);
    const plaster = dotGrid(r, { x: hs.x0, y: hs.top, w, h: y - hs.top }, 40, 2.4, 0.3);
    p.group('town', { x: hs.x0 - 20, y: hs.top - 30, w: w + 40, h: y - hs.top + 40 }, (c) => {
      shape(c, [[hs.x0, y], [hs.x0, hs.top], [hs.x1, hs.top], [hs.x1, y]], hs.col);
      dots(c, plaster, shade(hs.col, 0.86));
      // the parapet, with stepped teeth
      const par = [[hs.x0 - 6, hs.top + 10], [hs.x0 - 6, hs.top - 6]];
      for (let x = hs.x0; x < hs.x1 - 10; x += 26) par.push([x, hs.top - 6], [x + 6, hs.top - 18], [x + 14, hs.top - 18], [x + 20, hs.top - 6]);
      par.push([hs.x1 + 6, hs.top - 6], [hs.x1 + 6, hs.top + 10]);
      shape(c, par, WHITE, 3);
      // shuttered windows
      for (const [wx, wy, ww, wh] of wins) {
        c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + ww / 2); c.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); c.lineTo(wx + ww, wy + wh); c.closePath();
        c.fillStyle = i === 1 ? GREEN : SKY; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3; c.stroke();
        c.lineWidth = 2; c.beginPath(); c.moveTo(wx + ww / 2, wy + ww / 2); c.lineTo(wx + ww / 2, wy + wh);
        for (let yy = wy + ww / 2 + 6; yy < wy + wh; yy += 7) { c.moveTo(wx + 3, yy); c.lineTo(wx + ww - 3, yy); }
        c.stroke();
      }
      // a carved wooden balcony on the upper floor
      const by = y - 196;
      shape(c, [[hs.x0 + 8, by], [hs.x0 + 8, by - 46], [hs.x1 - 8, by - 46], [hs.x1 - 8, by]], WOOD, 3);
      c.strokeStyle = BRASS; c.lineWidth = 2; c.beginPath();
      for (let x = hs.x0 + 16; x < hs.x1 - 12; x += 10) { c.moveTo(x, by - 40); c.lineTo(x, by - 6); }
      c.stroke();
      shape(c, [[hs.x0 + 2, by + 8], [hs.x0 + 2, by], [hs.x1 - 2, by], [hs.x1 - 2, by + 8]], DARKWOOD, 2.5);
      door(c, dr);
    }, { t: 4.4 + i * 0.35, d: 1.0, reveal: 'rise', ease: 'inOut' });
  });
}

// ================================================================ the House of Wonders
function houseOfWonders(p, r) {
  const x0 = 560, x1 = 1060, y = SHORE - 14, cx = (x0 + x1) / 2;
  const floors = [[y, 1030], [1030, 900], [900, 780]];
  floors.forEach(([yb, yt], i) => {
    const inset = i * 10, a = x0 + inset, b = x1 - inset;
    const cols = [];
    for (let k = 0; k <= 12; k++) cols.push(lerp(a + 8, b - 8, k / 12));
    p.group('wonders', { x: a - 20, y: yt - 24, w: b - a + 40, h: yb - yt + 30 }, (c) => {
      // the deep shade of the veranda behind the columns
      shape(c, [[a, yb], [a, yt], [b, yt], [b, yb]], WHITE);
      c.fillStyle = '#9fb9c9'; c.fillRect(a + 6, yt + 20, b - a - 12, yb - yt - 20);
      // doors and windows in the wall behind
      c.fillStyle = '#2e5a7a'; c.beginPath();
      for (let k = 0; k < 12; k++) { const xx = lerp(a + 8, b - 8, (k + 0.5) / 12); c.rect(xx - 8, yt + 40, 16, yb - yt - 60); }
      c.fill();
      // the slender iron columns
      c.fillStyle = WHITE; c.strokeStyle = BLACK; c.lineWidth = 2.5;
      for (const xx of cols) { c.fillRect(xx - 5, yt + 16, 10, yb - yt - 16); c.strokeRect(xx - 5, yt + 16, 10, yb - yt - 16); }
      // the balustrade, green, and the floor slab
      if (i > 0) {
        c.fillStyle = GREEN; c.fillRect(a, yb - 28, b - a, 22); c.strokeRect(a, yb - 28, b - a, 22);
        c.strokeStyle = WHITE; c.lineWidth = 2; c.beginPath();
        for (let xx = a + 6; xx < b - 4; xx += 9) { c.moveTo(xx, yb - 25); c.lineTo(xx, yb - 9); }
        c.stroke();
      }
      shape(c, [[a - 12, yt + 18], [a - 12, yt], [b + 12, yt], [b + 12, yt + 18]], i === 2 ? RED : WHITE, 3);
      c.strokeStyle = BLACK; c.lineWidth = 3.5; c.strokeRect(a, yt, b - a, yb - yt);
    }, { t: 3.6 + i * 0.45, d: 0.9, reveal: 'rise', ease: 'inOut' });
  });
  // the clock tower in the middle of the roof
  const tw = 52;
  p.group('wonders', { x: cx - tw - 20, y: 560, w: tw * 2 + 40, h: 240 }, (c) => {
    shape(c, [[cx - tw, 784], [cx - tw, 680], [cx + tw, 680], [cx + tw, 784]], WHITE);
    for (const k of [-1, 1]) { c.fillStyle = '#2e5a7a'; c.fillRect(cx + k * 26 - 7, 730, 14, 40); c.strokeStyle = BLACK; c.lineWidth = 2.5; c.strokeRect(cx + k * 26 - 7, 730, 14, 40); }
    circle(c, cx, 710, 24, YELLOW, 3.5);
    c.strokeStyle = BLACK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, 710); c.lineTo(cx, 694); c.moveTo(cx, 710); c.lineTo(cx + 12, 714); c.stroke();
    dots(c, Array.from({ length: 12 }, (_, k) => [cx + Math.cos(k / 12 * Math.PI * 2) * 18, 710 + Math.sin(k / 12 * Math.PI * 2) * 18, 1.8]), BLACK);
    shape(c, [[cx - tw - 10, 684], [cx - tw - 10, 666], [cx + tw + 10, 666], [cx + tw + 10, 684]], RED, 3);
    shape(c, [[cx - tw + 10, 666], [cx - tw + 10, 616], [cx + tw - 10, 616], [cx + tw - 10, 666]], WHITE, 3);
    c.fillStyle = '#2e5a7a'; c.fillRect(cx - 24, 628, 14, 30); c.fillRect(cx + 10, 628, 14, 30);
    shape(c, [[cx - tw, 618], [cx, 584], [cx + tw, 618]], GREEN, 3);
    c.strokeStyle = BLACK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, 586); c.lineTo(cx, 560); c.stroke();
    shape(c, [[cx, 560], [cx + 26, 567], [cx, 574]], RED, 2.5);
  }, { t: 5.1, d: 0.9, reveal: 'rise' });
  // the great carved door of the entrance, on the ground floor
  const dr = mkDoor(cx, y, 74, 124, true);
  p.group('wonders', { x: cx - 90, y: y - 220, w: 180, h: 230 }, (c) => door(c, dr), { t: 5.6, d: 0.7, reveal: 'pop' });
}

// ================================================================ the sea
function sea(p, r) {
  p.group('sea', { x: B, y: SEA - 10, w: W - 2 * B, h: H - SEA }, (c) => {
    c.fillStyle = COBALT; c.fillRect(B - 10, SEA, W - 2 * B + 20, H - SEA);
    c.fillStyle = DEEP; c.fillRect(B - 10, 1480, W - 2 * B + 20, H - 1480);
    c.strokeStyle = BLACK; c.lineWidth = 3.5; c.beginPath(); c.moveTo(B - 10, SEA); c.lineTo(W - B + 10, SEA); c.stroke();
  }, { t: 1.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // waves painted as rows of little white arcs, and dots between
  const arcs = [], specks = [];
  for (let y = SEA + 22, row = 0; y < FLOOR; y += 34, row++) {
    for (let x = B + (row % 2) * 24; x < W - B; x += 48) {
      if (r.chance(0.22)) continue;
      arcs.push([x + r.range(-4, 4), y + r.range(-3, 3)]);
      if (r.chance(0.5)) specks.push([x + 24, y + 12, 2.6]);
    }
  }
  const half = Math.floor(arcs.length / 2);
  [arcs.slice(0, half), arcs.slice(half)].forEach((set, i) => {
    p.group('sea', boxOf(set, 26), (c) => {
      c.strokeStyle = i ? 'rgba(160,205,240,.6)' : 'rgba(251,246,234,.8)'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
      for (const [x, y] of set) { c.moveTo(x - 14, y + 4); c.quadraticCurveTo(x, y - 9, x + 14, y + 4); }
      c.stroke();
    }, { t: 2.1 + i * 0.4, d: 0.9, reveal: i ? 'wipeL' : 'wipe' });
  });
  p.group('sea', boxOf(specks, 6), (c) => dots(c, specks, SKY), { t: 2.9, d: 0.6, reveal: 'fade' });
}

// ================================================================ dhows
function dhowParts(x, y, s, dir, sailCol) {
  const P = (dx, dy) => [x + dir * dx * s, y + dy * s];
  const hull = [P(-120, -40), P(-100, -18), P(-70, 6), P(70, 8), P(110, -14), P(150, -52), P(118, -38), P(-96, -30)];
  const sail = [P(-96, -56), P(150, -310), P(176, -140), P(130, -38)];
  const yard = [P(-110, -48), P(170, -330)];
  const mast = [P(10, -36), P(10, -250)];
  return { hull, sail, yard, mast, x, y, s, dir, sailCol, box: boxOf([...hull, ...sail, ...yard], 14) };
}
function drawDhow(c, d) {
  const { s } = d;
  shape(c, d.sail, d.sailCol, 3.5);
  // seams across the sail and a patch
  c.save(); poly(c, d.sail); c.clip();
  c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2; c.beginPath();
  for (let k = 1; k < 7; k++) { const t = k / 7; c.moveTo(lerp(d.sail[0][0], d.sail[1][0], t), lerp(d.sail[0][1], d.sail[1][1], t)); c.lineTo(lerp(d.sail[3][0], d.sail[1][0], t * 0.9), lerp(d.sail[3][1], d.sail[1][1], t * 0.9)); }
  c.stroke(); c.restore();
  c.strokeStyle = BLACK; c.lineWidth = 5 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(d.mast[0][0], d.mast[0][1]); c.lineTo(d.mast[1][0], d.mast[1][1]); c.stroke();
  c.lineWidth = 4 * s; c.beginPath(); c.moveTo(d.yard[0][0], d.yard[0][1]); c.lineTo(d.yard[1][0], d.yard[1][1]); c.stroke();
  shape(c, d.hull, WOOD, 3.5);
  // painted bands on the hull and a row of dots
  c.save(); poly(c, d.hull); c.clip();
  c.fillStyle = TURQ; c.fillRect(d.x - 200 * s, d.y - 30 * s, 400 * s, 9 * s);
  c.fillStyle = RED; c.fillRect(d.x - 200 * s, d.y - 21 * s, 400 * s, 5 * s);
  c.restore();
  dots(c, Array.from({ length: 9 }, (_, k) => [d.x + d.dir * (-70 + k * 18) * s, d.y - 8 * s, 2.6 * s]), WHITE);
}
function dhows(p, r) {
  const fleet = [dhowParts(360, 1372, 0.75, 1, WHITE), dhowParts(1150, 1392, 0.85, -1, '#f6e2b0'), dhowParts(760, 1318, 0.5, 1, '#f39a8e')];
  fleet.sort((a, b) => a.y - b.y).forEach((d, i) => {
    p.group('boats', d.box, (c) => drawDhow(c, d), { t: 7.6 + i * 0.3, d: 1.0, reveal: 'slide', dx: -d.dir * 60, ease: 'out' });
  });
}

// ================================================================ fish
function fishShape(r, x, y, L, h, dir, col, pat) {
  const body = [];
  for (let k = 0; k <= 32; k++) {
    const a = (k / 32) * Math.PI * 2, bxv = Math.cos(a) * L / 2, byv = Math.sin(a) * h / 2 * (1 - 0.3 * Math.cos(a));
    body.push([x + dir * bxv, y + byv]);
  }
  const tail = [[x - dir * L * 0.42, y], [x - dir * L * 0.7, y - h * 0.5], [x - dir * L * 0.6, y], [x - dir * L * 0.7, y + h * 0.5]];
  const fin = [[x - dir * L * 0.1, y - h * 0.42], [x + dir * L * 0.05, y - h * 0.72], [x + dir * L * 0.2, y - h * 0.42]];
  const fin2 = [[x - dir * L * 0.05, y + h * 0.4], [x + dir * L * 0.02, y + h * 0.62], [x + dir * L * 0.15, y + h * 0.38]];
  const b = boxOf(body, 0);
  const marks = pat === 'dots' ? dotGrid(r, b, Math.max(10, h * 0.2), Math.max(2.4, h * 0.045), 0.15)
    : pat === 'scales' ? dotGrid(r, b, Math.max(12, h * 0.18), Math.max(4, h * 0.07), 0)
      : [];
  const stripes = [];
  if (pat === 'stripes') for (let k = 1; k < 6; k++) stripes.push(x + dir * L * (-0.3 + k * 0.12));
  return { x, y, L, h, dir, col, pat, body, tail, fin, fin2, marks, stripes, accent: r.pick(BRIGHT.filter((c) => c !== col)), box: boxOf([...body, ...tail, ...fin, ...fin2], 10) };
}
function drawFish(c, f) {
  shape(c, f.tail, f.accent, 3); shape(c, f.fin, f.accent, 3); shape(c, f.fin2, f.accent, 3);
  shape(c, f.body, f.col, 3.5);
  c.save(); poly(c, f.body); c.clip();
  if (f.pat === 'dots') dots(c, f.marks, WHITE);
  else if (f.pat === 'scales') {
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.beginPath();
    for (const [x, y, rr] of f.marks) { c.moveTo(x + rr * 1.6, y); c.arc(x, y, rr * 1.6, 0, Math.PI, false); }
    c.stroke();
  } else if (f.pat === 'stripes') {
    c.strokeStyle = f.accent; c.lineWidth = f.h * 0.09; c.beginPath();
    for (const sx of f.stripes) { c.moveTo(sx, f.y - f.h); c.lineTo(sx + f.dir * 6, f.y + f.h); }
    c.stroke();
  }
  c.restore();
  // the gill, the eye, the mouth
  const gx = f.x + f.dir * f.L * 0.22;
  c.strokeStyle = BLACK; c.lineWidth = 3; c.beginPath(); c.arc(gx - f.dir * f.h * 0.4, f.y, f.h * 0.4, -0.9, 0.9); if (f.dir < 0) { c.beginPath(); c.arc(gx + f.h * 0.4, f.y, f.h * 0.4, Math.PI - 0.9, Math.PI + 0.9); } c.stroke();
  const ex = f.x + f.dir * f.L * 0.32, ey = f.y - f.h * 0.1, er = Math.max(6, f.h * 0.13);
  circle(c, ex, ey, er, WHITE, 3); circle(c, ex + f.dir * er * 0.25, ey, er * 0.5, BLACK);
  c.beginPath(); c.moveTo(f.x + f.dir * f.L * 0.5, f.y + f.h * 0.05); c.lineTo(f.x + f.dir * f.L * 0.42, f.y + f.h * 0.12); c.stroke();
  shine(c, f.x + f.dir * f.L * 0.1, f.y - f.h * 0.05, f.h * 0.3, f.dir > 0 ? 3.7 : 4.9, f.dir > 0 ? 4.5 : 5.7);
}
const SCHOOL = [
  [250, 1470, 230, 96, 1, ORANGE, 'dots'], [640, 1430, 180, 78, -1, PINK, 'scales'], [1010, 1470, 260, 110, -1, YELLOW, 'stripes'],
  [1380, 1440, 170, 80, -1, TURQ, 'dots'], [420, 1620, 200, 84, -1, LIME, 'stripes'], [820, 1610, 240, 100, 1, RED, 'scales'],
  [1260, 1650, 210, 90, 1, SKY, 'scales'], [160, 1740, 140, 60, 1, PURPLE, 'dots'], [1100, 1790, 150, 62, -1, ORANGE, 'dots'],
  [620, 1800, 120, 52, 1, WHITE, 'stripes'],
];
function fishes(p, r) {
  SCHOOL.forEach(([x, y, L, h, dir, col, pat], i) => {
    const f = fishShape(r, x, y, L, h, dir, col, pat);
    p.group('fish', f.box, (c) => drawFish(c, f), { t: 8.1 + i * 0.16, d: 0.7, reveal: 'pop', ease: 'back' });
  });
  // a turtle swimming up between them
  const tx = 1440, ty = 1560;
  const plates = [];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; plates.push([tx + Math.cos(a) * 38, ty + Math.sin(a) * 28, 14]); }
  p.group('fish', { x: tx - 120, y: ty - 100, w: 240, h: 200 }, (c) => {
    for (const [dx, dy, a] of [[-56, -40, -0.6], [56, -40, 0.6], [-50, 40, 0.5], [50, 40, -0.5]]) {
      c.save(); c.translate(tx + dx, ty + dy); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 34, 14, 0, 0, Math.PI * 2); c.fillStyle = GREEN; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3; c.stroke(); c.restore();
    }
    circle(c, tx, ty - 76, 22, GREEN, 3); circle(c, tx - 8, ty - 82, 4, BLACK); circle(c, tx + 8, ty - 82, 4, BLACK);
    c.beginPath(); c.ellipse(tx, ty, 62, 54, 0, 0, Math.PI * 2); c.fillStyle = '#8c5a22'; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3.5; c.stroke();
    for (const [x, y, rr] of plates) circle(c, x, y, rr, OCHRE, 2.5);
    circle(c, tx, ty, 18, ORANGE, 2.5);
    shine(c, tx - 6, ty - 6, 40, 3.7, 4.4);
  }, { t: 9.7, d: 0.8, reveal: 'pop', ease: 'back' });
}

// ================================================================ the reef
function reef(p, r) {
  // the sandy floor with shells, coral branches and an octopus
  const floor = [[B - 10, H], [B - 10, 1860], [260, 1846], [520, 1868], [800, 1850], [1080, 1870], [1340, 1848], [W - B + 10, 1862], [W - B + 10, H]];
  const grains = dotGrid(r, { x: B, y: 1850, w: W - 2 * B, h: 110 }, 18, 2.2, 0.35);
  p.group('reef', { x: B - 10, y: 1830, w: W - 2 * B + 20, h: H - 1830 }, (c) => {
    shape(c, floor, SAND, 3.5); dots(c, grains, OCHRE);
  }, { t: 9.2, d: 0.8, reveal: 'rise' });
  const corals = [[110, 1860, RED], [560, 1868, PINK], [990, 1862, ORANGE], [1500, 1858, PURPLE]].map(([x, y, col]) => {
    const br = [];
    const grow = (x0, y0, a, L, d) => {
      const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
      br.push([x0, y0, x1, y1, Math.max(5, d * 4)]);
      if (d > 1) { grow(x1, y1, a - r.range(0.3, 0.6), L * 0.75, d - 1); grow(x1, y1, a + r.range(0.3, 0.6), L * 0.75, d - 1); }
    };
    grow(x, y, -Math.PI / 2, 50, 4);
    return { br, col };
  });
  corals.forEach((cr, i) => {
    p.group('reef', boxOf(cr.br.flatMap((b) => [[b[0], b[1]], [b[2], b[3]]]), 24), (c) => {
      c.lineCap = 'round';
      c.strokeStyle = BLACK; c.beginPath(); for (const b of cr.br) { c.lineWidth = b[4] + 6; c.moveTo(b[0], b[1]); c.lineTo(b[2], b[3]); c.stroke(); c.beginPath(); }
      c.strokeStyle = cr.col; for (const b of cr.br) { c.lineWidth = b[4]; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[2], b[3]); c.stroke(); }
      dots(c, cr.br.filter((b) => b[4] <= 5).map((b) => [b[2], b[3], 5]), YELLOW);
    }, { t: 9.4 + i * 0.12, d: 0.7, reveal: 'rise' });
  });
  // the octopus on the floor, curling its arms
  const ox = 1240, oy = 1830;
  const arms = [];
  for (let k = 0; k < 8; k++) {
    const a0 = Math.PI * (0.05 + (k / 7) * 0.9), pts = [];
    for (let s = 0; s <= 14; s++) { const t = s / 14, a = a0 + Math.sin(t * 4 + k) * 0.5 * t; pts.push([ox + Math.cos(a) * (40 + t * 110), oy - 30 + Math.sin(a) * (20 + t * 60)]); }
    arms.push(pts);
  }
  p.group('reef', { x: ox - 180, y: oy - 130, w: 360, h: 230 }, (c) => {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, col] of [[22, BLACK], [16, PINK]]) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      for (const a of arms) { c.moveTo(a[0][0], a[0][1]); for (const q of a) c.lineTo(q[0], q[1]); }
      c.stroke();
    }
    dots(c, arms.flatMap((a) => a.filter((q, s) => s % 2 && s > 2).map(([x, y]) => [x, y, 2.6])), WHITE);
    c.beginPath(); c.ellipse(ox, oy - 70, 56, 62, 0, 0, Math.PI * 2); c.fillStyle = PINK; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3.5; c.stroke();
    circle(c, ox - 20, oy - 66, 11, WHITE, 3); circle(c, ox + 20, oy - 66, 11, WHITE, 3);
    circle(c, ox - 18, oy - 64, 5, BLACK); circle(c, ox + 22, oy - 64, 5, BLACK);
    dots(c, [[ox - 26, oy - 106, 6], [ox + 4, oy - 116, 7], [ox + 30, oy - 100, 5]], '#f7a7ca');
    shine(c, ox - 10, oy - 80, 40, 3.7, 4.4);
  }, { t: 9.9, d: 0.8, reveal: 'pop', ease: 'back' });
}

// ================================================================ birds
function bird(c, b, flap = 0) {
  const { x, y, s, dir, col, wing } = b;
  const P = (dx, dy) => [x + dir * dx * s, y + dy * s];
  // long tail feathers
  for (const [k, cc] of [[-1, RED], [0, SKY], [1, GREEN]]) shape(c, [P(-40, 0), P(-150, 18 + k * 22), P(-158, 30 + k * 22), P(-44, 12)], cc, 2.5);
  shape(c, [P(-60, 8), P(-30, -26), P(30, -30), P(70, -10), P(60, 18), P(0, 30)], col, 3.5);
  // the head and the beak
  circle(c, P(74, -24)[0], P(74, -24)[1], 28 * s, col, 3.5);
  shape(c, [P(96, -34), P(140, -20), P(98, -14)], ORANGE, 3);
  circle(c, P(80, -30)[0], P(80, -30)[1], 8 * s, WHITE, 2.5); circle(c, P(82, -30)[0], P(82, -30)[1], 4 * s, BLACK);
  // the wing: five long feathers fanned up and back, each banded
  for (let k = 4; k >= 0; k--) {
    const a = -1.2 - k * 0.22 - flap * 0.5, L = (110 - k * 8) * (0.75 + 0.25 * (1 - flap));
    const bx0 = 10 - k * 8, ux = Math.cos(a), uy = Math.sin(a);
    const tip = P(bx0 + ux * L, -10 + uy * L), root = P(bx0, -10);
    const nx = -uy * 16, ny = ux * 16;
    const f = [P(bx0 - nx * 0.3, -10 - ny * 0.3), P(bx0 + ux * L * 0.5 - nx, -10 + uy * L * 0.5 - ny), tip, P(bx0 + ux * L * 0.5 + nx, -10 + uy * L * 0.5 + ny), P(bx0 + nx * 0.3, -10 + ny * 0.3)];
    shape(c, f, k % 2 ? wing : WHITE, 3);
    const m = P(bx0 + ux * L * 0.62, -10 + uy * L * 0.62);
    circle(c, m[0], m[1], 5 * s, k % 2 ? RED : wing, 2);
    void root;
  }
  dots(c, [P(0, 0), P(20, 4), P(-20, 6), P(40, -4), P(10, 14)].map(([px, py]) => [px, py, 4 * s]), WHITE);
}
const BIRDS = [{ x: 600, y: 660, s: 1.1, dir: 1, col: '#2a8de0', wing: ORANGE }, { x: 900, y: 505, s: 0.6, dir: -1, col: PINK, wing: TURQ }];
function birds(p, r) {
  BIRDS.forEach((b, i) => p.group('birds', { x: b.x - 200 * b.s - 20, y: b.y - 190 * b.s - 20, w: 380 * b.s + 40, h: 260 * b.s + 40 }, (c) => bird(c, b, 0), { t: 9.9 + i * 0.3, d: 0.8, reveal: 'pop', ease: 'back' }));
  // a perched bird on the town's tallest palm, small and red
  p.group('birds', { x: 1300, y: 560, w: 200, h: 120 }, (c) => {
    shape(c, [[1360, 640], [1400, 612], [1440, 620], [1446, 646], [1400, 660]], RED, 3);
    circle(c, 1446, 614, 16, RED, 3); shape(c, [[1458, 606], [1484, 614], [1458, 622]], YELLOW, 2.5);
    circle(c, 1450, 610, 4, BLACK);
    shape(c, [[1362, 642], [1318, 668], [1324, 676], [1366, 652]], PURPLE, 2.5);
  }, { t: 10.4, d: 0.6, reveal: 'pop', ease: 'back' });
}

// ================================================================ the live things
function life(p, r) {
  // a fish crossing the sea, and another slower, deeper
  const swimmers = [fishShape(r, 0, 0, 120, 52, 1, '#ffffff', 'stripes'), fishShape(r, 0, 0, 96, 42, -1, YELLOW, 'none')];
  swimmers[0].accent = SKY; swimmers[1].accent = RED;
  p.live('fish', {
    t: 10.4, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const span = W + 300;
      const xa = -150 + ((time - 10.4) * 40 + 700) % span, ya = 1540 + Math.sin(time * 1.1) * 12;
      const xb = W + 150 - ((time - 10.4) * 26 + 300) % span, yb = 1720 + Math.sin(time * 0.8 + 1) * 10;
      for (const [f, x, y] of [[swimmers[0], xa, ya], [swimmers[1], xb, yb]]) {
        c.save(); c.translate(x, y); drawFishLite(c, f); c.restore();
      }
    },
  });
  // bubbles rising from the octopus
  const bub = [0, 1, 2, 3, 4].map((k) => [1240 + (k - 2) * 14, k * 0.2, 5 + (k % 3) * 2]);
  p.live('reef', {
    t: 10.6, d: 1, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = WHITE; c.lineWidth = 2.5; c.beginPath();
      for (const [x, ph, rr] of bub) {
        const k = (time * 0.18 + ph) % 1, y = 1720 - k * 260, xx = x + Math.sin(time * 2 + ph * 9) * 8;
        c.moveTo(xx + rr, y); c.arc(xx, y, rr, 0, Math.PI * 2);
      }
      c.stroke();
    },
  });
  // a bird flying slowly across the yellow, its wings beating
  const flyer = { x: 0, y: 0, s: 0.5, dir: -1, col: GREEN, wing: ORANGE };
  p.live('birds', {
    t: 10.8, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const x = W + 120 - ((time - 10.8) * 30 + 320) % (W + 300), y = 760 + Math.sin(time * 0.9) * 20;
      c.save(); c.translate(x, y); bird(c, flyer, (Math.sin(time * 4) + 1) / 2); c.restore();
    },
  });
  // the dhows rock a little on the swell: a white wake under each
  p.live('boats', {
    t: 10.2, d: 1, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = WHITE; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
      for (const [x, y, ph] of [[360, 1382, 0], [1150, 1402, 2], [760, 1324, 4]]) {
        const o = Math.sin(time * 1.4 + ph) * 8;
        c.moveTo(x - 90 + o, y); c.quadraticCurveTo(x - 60 + o, y + 10, x - 30 + o, y); c.moveTo(x + 40 - o, y + 4); c.quadraticCurveTo(x + 70 - o, y + 14, x + 100 - o, y + 4);
      }
      c.stroke();
    },
  });
}
// a fish around the origin without its clipped pattern, for drawing every frame
function drawFishLite(c, f) {
  const d = f.dir, L = f.L, h = f.h;
  c.lineJoin = 'round';
  shape(c, [[-d * L * 0.42, 0], [-d * L * 0.7, -h * 0.5], [-d * L * 0.6, 0], [-d * L * 0.7, h * 0.5]], f.accent, 3);
  c.beginPath(); c.ellipse(0, 0, L / 2, h / 2, 0, 0, Math.PI * 2); c.fillStyle = f.col; c.fill(); c.strokeStyle = BLACK; c.lineWidth = 3; c.stroke();
  c.strokeStyle = f.accent; c.lineWidth = 7; c.beginPath();
  for (let k = -1; k <= 1; k++) { c.moveTo(k * L * 0.14, -h * 0.4); c.lineTo(k * L * 0.14, h * 0.4); }
  c.stroke();
  circle(c, d * L * 0.3, -h * 0.08, 7, WHITE, 2.5); circle(c, d * L * 0.31, -h * 0.08, 3.5, BLACK);
}

// ================================================================ the title
// ZANZIBAR painted black over the yellow with a red shadow, dotted white inside
function title(p, r) {
  const y = 330, size = 240;
  const res = p.type('title', 'ZANZIBAR', W / 2, y, { family: FACE, size, color: BLACK, align: 'center', track: 0.02, t: 11.0, gap: 0.14, d: 0.6, reveal: 'pop', ease: 'back' });
  const f = `normal 400 ${res.size}px ${FACE}`;
  res.glyphs.forEach((m, i) => {
    const ch = 'ZANZIBAR'[i], b = m.box, gx = b.x + res.size * 0.15;
    const spots = dotGrid(r, { x: b.x, y: b.y, w: b.w, h: b.h }, 17, 3.2, 0.12);
    let img = null;
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.fillStyle = RED; c.fillText(ch, gx + 9, y + 9);
      if (!img) img = dotted(ch, f, b, gx, y, spots);
      c.drawImage(img, b.x, b.y, b.w, b.h);
    };
  });
  p.type('title', 'KARIBU · UNGUJA · STONE TOWN', W / 2, 410, { family: FACE, size: 40, color: RED, align: 'center', track: 0.16, t: 12.3, gap: 0.03, d: 0.4, reveal: 'fade' });
}
function dotted(ch, f, b, gx, y, spots) {
  const S = 2, cv = document.createElement('canvas');
  cv.width = Math.ceil(b.w * S); cv.height = Math.ceil(b.h * S);
  const c = cv.getContext('2d');
  c.scale(S, S); c.translate(-b.x, -b.y);
  c.font = f; c.textBaseline = 'alphabetic'; c.fillStyle = BLACK; c.fillText(ch, gx, y);
  c.globalCompositeOperation = 'source-atop';
  dots(c, spots, WHITE);
  return cv;
}
