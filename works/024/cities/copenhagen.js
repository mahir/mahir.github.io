// Copenhagen: a Danish mid-century poster of Nyhavn, seen from its head by
// Kongens Nytorv looking out to the harbor. The painted houses of the north
// quay run off toward the water in flat blocks of ochre, red, blue and cream,
// with their roofs, gable dormers and café awnings; old wooden ships and the
// red lightship Gedser Rev lie along the quay, their masts and rigging against
// a pale sky; the memorial anchor stands on its plinth in front; across the
// harbor the Opera's flat roof and the corkscrew spire of Our Saviour's Church.
// Flat color, no outlines, reflections broken into dashes; the name below in a
// geometric sans, its Ø in red.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, shade, mix } from '../kit.js';

const PAPER = '#efe6d0', INK = '#1d2838', NAVY = '#23324a';
const SKY = '#c3d8d8', SKY2 = '#d7e4dc', SUN = '#f0b94a', CLOUD = '#f4efe2';
const WATER = '#2d6a84', WATER_D = '#21526a', GLINT = '#9cc6cf';
const RED = '#c8372d', OCHRE = '#e1a43a', BLUE = '#87adc2', CREAM = '#f1dfb8', TERRA = '#d46c45';
const YELLOW = '#ecc65b', SAGE = '#9db28a', ROSE = '#cf6a5c', PEACH = '#efc19a', COBALT = '#55809f';
const ROOF = '#a43f2c', SLATE = '#3c4554', STONE = '#bfb196', STONE_D = '#9d8f75', PLAZA = '#cdbf9f';
const WOOD = '#6b4a34', SAILC = '#efe4c8';

export const city = {
  id: 'copenhagen', name: 'Copenhagen',
  alt: "A Danish mid-century poster of Nyhavn: painted gabled houses along the quay with café umbrellas and parked bicycles, old wooden ships and the red lightship Gedser Rev moored in the canal, the memorial anchor on its plinth in front, and across the harbor the Opera and the corkscrew spire of Our Saviour's Church, above the name KØBENHAVN",
  google: 'family=Jost:wght@500;600;800',
  wall: '#22303f',
  fonts: [['800 250px "Jost"', 'KØBENHAVN'], ['600 30px "Jost"', 'NYHAVN · DANMARK 1673'], ['600 20px "Jost"', 'GEDSER REV']],
  build,
};

// the picture, and the view: one-point perspective from the head of the canal
const PX = 70, PY = 70, PW = W - 2 * PX, PB = 1600;
const VX = 1180, VY = 860, E = 6, F = 900;
const k = (s) => F / s;
const P = (X, s, Z) => [VX + X * F / s, VY + (E - Z) * F / s];
const FAC = -14, QZ = 1.2, EDGE = -6, REDGE = 6, RFAC = 12, HEAD = 7;

// draw in the plane X = const, from (s, Z), u running away along the quay and v up
function inX(c, X, s, Z) {
  const kk = F / s;
  c.transform(-X * F / (s * s), -(E - Z) * F / (s * s), 0, -kk, VX + X * kk, VY + (E - Z) * kk);
}
// draw in the plane s = const, facing us, u to the right and v up
function inS(c, X, s, Z) { const kk = F / s; c.transform(kk, 0, 0, -kk, VX + X * kk, VY + (E - Z) * kk); }
const pathOf = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1673 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PB - PY };
  p.stack('sky', 'far', 'rhouses', 'water', 'refl', 'houses', 'hdetail', 'quay', 'ships', 'rig', 'fore', 'live', 'title');
  p.layer('title', { clip: false });

  sky(p, r);
  far(p, r);
  rightSide(p, r);
  water(p, r);
  const hs = houses(p, r);
  reflections(p, hs);
  quay(p, r);
  ships(p, r);
  fore(p, r);
  lives(p, r);
  title(p);
  return p;
}

// ================================================================ the sky: pale, a mustard sun, flat paper clouds
function sky(p, r) {
  p.group('sky', { x: PX, y: PY, w: PW, h: VY - PY + 20 }, (c) => {
    c.fillStyle = SKY; c.fillRect(PX, PY, PW, VY - PY + 20);
    c.fillStyle = SKY2; c.fillRect(PX, VY - 190, PW, 210);
    c.fillStyle = mix(SKY, SKY2, 0.5); c.fillRect(PX, VY - 330, PW, 140);
  }, { t: 0.1, d: 1.0, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: 1150, y: 150, w: 320, h: 320 }, (c) => {
    c.fillStyle = SUN; c.beginPath(); c.arc(1310, 310, 132, 0, Math.PI * 2); c.fill();
    c.fillStyle = shade(SUN, 1.07); c.beginPath(); c.arc(1310, 310, 132, -Math.PI * 0.95, -Math.PI * 0.05); c.closePath(); c.fill();
  }, { t: 0.8, d: 0.9, reveal: 'iris' });
  // clouds: stacked rounded bars, as if cut from paper
  const clouds = [[560, 230, 330], [1010, 470, 260], [180, 520, 220], [1340, 600, 200]];
  clouds.forEach(([x, y, w], i) => {
    p.group('sky', { x: x - w * 0.3, y: y - 50, w: w * 1.6, h: 110 }, (c) => {
      c.fillStyle = CLOUD;
      c.beginPath(); c.roundRect(x, y, w, 30, 15); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.18, y - 26, w * 0.52, 30, 15); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.42, y + 22, w * 0.8, 24, 12); c.fill();
      c.fillStyle = SKY2; c.fillRect(x + w * 0.1, y + 18, w * 0.7, 3);
    }, { t: 1.1 + i * 0.22, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ across the harbor: the Opera, Our Saviour's spire, the far shore
function far(p, r) {
  // the far shore of Holmen and Christianshavn: a low band of roofs and trees
  const shore = [];
  for (let x = 700; x < PX + PW; x += r.range(14, 36)) shore.push([x, VY - r.range(6, 22)]);
  p.group('far', { x: 700, y: VY - 40, w: PX + PW - 700, h: 50 }, (c) => {
    c.fillStyle = mix(SKY, COBALT, 0.45);
    c.beginPath(); c.moveTo(700, VY + 2); for (const [x, y] of shore) { c.lineTo(x, y); c.lineTo(x + 12, y); } c.lineTo(PX + PW, VY + 2); c.closePath(); c.fill();
  }, { t: 1.4, d: 0.8, reveal: 'rise' });
  // the Opera: a flat roof hung far out over a glass front
  const ox = 1120, oy = VY - 4;
  p.group('far', { x: ox - 120, y: oy - 70, w: 250, h: 80 }, (c) => {
    c.fillStyle = mix(SKY, NAVY, 0.55); c.fillRect(ox - 60, oy - 46, 130, 46);
    c.fillStyle = mix(SKY, GLINT, 0.2); c.beginPath(); c.moveTo(ox - 20, oy); c.quadraticCurveTo(ox + 10, oy - 60, ox + 40, oy); c.fill();
    c.strokeStyle = mix(SKY, NAVY, 0.4); c.lineWidth = 1.2; c.beginPath();
    for (let x = ox - 16; x < ox + 40; x += 6) { c.moveTo(x, oy); c.lineTo(x, oy - 30); } c.stroke();
    c.fillStyle = mix(SKY, NAVY, 0.75); c.fillRect(ox - 104, oy - 52, 220, 7);
    c.fillRect(ox + 48, oy - 64, 30, 14);
  }, { t: 1.7, d: 0.7, reveal: 'rise' });
  // Our Saviour's Church: the tower, the black spire, and the gilded stair winding round it
  const sx = 1405, base = VY - 6;
  const tw = 46, tTop = base - 190, sTop = tTop - 270;
  const helix = [], helixBack = [];
  const turns = 4, n = 120;
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = lerp(tTop - 24, sTop + 50, t), rad = lerp(30, 4, t) + 6;
    const a = t * turns * Math.PI * 2;
    const pt = [sx + Math.sin(a) * rad, y + Math.cos(a) * 4];
    (Math.cos(a) > 0 ? helix : helixBack).push([pt, i]);
  }
  const seg = (list) => { const out = []; let cur = []; let last = -2; for (const [pt, i] of list) { if (i !== last + 1 && cur.length) { out.push(cur); cur = []; } cur.push(pt); last = i; } if (cur.length) out.push(cur); return out; };
  const front = seg(helix), back = seg(helixBack);
  const SPIRE = '#2a2a30', GILT = '#d8a73c', BRICK = '#a8614a';
  p.group('far', { x: sx - 60, y: tTop - 20, w: 120, h: base - tTop + 26 }, (c) => {
    c.fillStyle = BRICK; c.fillRect(sx - tw / 2, tTop, tw, base - tTop);
    c.fillStyle = shade(BRICK, 0.8); c.fillRect(sx + tw * 0.15, tTop, tw * 0.35, base - tTop);
    c.fillStyle = INK;
    for (let y = tTop + 20; y < base - 30; y += 46) { c.beginPath(); c.roundRect(sx - 6, y, 12, 26, [6, 6, 0, 0]); c.fill(); }
    c.fillStyle = CREAM; c.fillRect(sx - tw / 2 - 3, tTop + 60, tw + 6, 3);
    // the clock
    c.fillStyle = GILT; c.beginPath(); c.arc(sx, tTop + 36, 9, 0, Math.PI * 2); c.fill();
  }, { t: 1.9, d: 0.9, reveal: 'rise' });
  p.group('far', { x: sx - 60, y: sTop - 50, w: 120, h: tTop - sTop + 60 }, (c) => {
    c.fillStyle = SPIRE;
    // the drum and the spire, stepped in
    c.fillRect(sx - 26, tTop - 30, 52, 30);
    c.beginPath(); c.moveTo(sx - 28, tTop - 28); c.lineTo(sx - 6, sTop + 40); c.lineTo(sx + 6, sTop + 40); c.lineTo(sx + 28, tTop - 28); c.closePath(); c.fill();
    c.fillRect(sx - 1.5, sTop - 10, 3, 52);
    c.strokeStyle = GILT; c.lineWidth = 2; c.globalAlpha = 0.45; c.beginPath();
    for (const l of back) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
    c.globalAlpha = 1; c.lineWidth = 3.4; c.beginPath();
    for (const l of front) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
    // the globe and the figure on top, gilt
    c.fillStyle = GILT; c.beginPath(); c.arc(sx, sTop - 4, 7, 0, Math.PI * 2); c.fill();
    c.fillRect(sx - 1.5, sTop - 30, 3, 22); c.beginPath(); c.arc(sx, sTop - 32, 3.5, 0, Math.PI * 2); c.fill();
    c.fillRect(sx - 7, sTop - 24, 14, 2.5);
  }, { t: 2.4, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the south quay, far off on the right
function rightSide(p, r) {
  const cols = [CREAM, OCHRE, BLUE, ROSE, YELLOW, PEACH, SAGE, TERRA, CREAM, OCHRE, BLUE];
  const list = [];
  for (let s = 34, i = 0; s < 98; i++) { const w = r.range(6, 8.5); list.push({ s0: s, s1: s + w, h: r.range(10.5, 14), col: cols[i % cols.length] }); s += w; }
  // far to near
  list.reverse().forEach((hs, i) => {
    const { s0, s1, h, col } = hs;
    const face = [P(RFAC, s0, QZ), P(RFAC, s1, QZ), P(RFAC, s1, h), P(RFAC, s0, h)];
    const roof = [P(RFAC, s0, h), P(RFAC, s1, h), P(RFAC + 4, s1, h + 4), P(RFAC + 4, s0, h + 4)];
    const wins = [];
    const nf = Math.floor((h - 4.8) / 2.9), nc = Math.max(2, Math.round((s1 - s0) / 2));
    for (let f = 0; f < nf; f++) for (let j = 0; j < nc; j++) {
      const sa = lerp(s0, s1, (j + 0.3) / nc), sb = lerp(s0, s1, (j + 0.7) / nc), za = 4.8 + f * 2.9, zb = za + 1.5;
      wins.push([P(RFAC, sa, za), P(RFAC, sb, za), P(RFAC, sb, zb), P(RFAC, sa, zb)]);
    }
    const b = boxOf([...face, ...roof], 4);
    p.group('rhouses', b, (c) => {
      c.fillStyle = shade(col, 0.88); pathOf(c, face); c.fill();
      c.fillStyle = i % 3 ? ROOF : SLATE; pathOf(c, roof); c.fill();
      c.fillStyle = NAVY; for (const w of wins) { pathOf(c, w); c.fill(); }
    }, { t: 2.2 + i * 0.08, d: 0.7, reveal: 'rise' });
  });
  // the quay below them
  p.group('rhouses', boxOf([P(REDGE, 30, QZ), P(RFAC, 30, QZ), P(RFAC, 100, 0), P(REDGE, 100, 0), P(REDGE, 30, 0)], 4), (c) => {
    c.fillStyle = STONE; pathOf(c, [P(REDGE, 30, QZ), P(RFAC, 30, QZ), P(RFAC, 100, QZ), P(REDGE, 100, QZ)]); c.fill();
    c.fillStyle = STONE_D; pathOf(c, [P(REDGE, 30, QZ), P(REDGE, 100, QZ), P(REDGE, 100, 0), P(REDGE, 30, 0)]); c.fill();
  }, { t: 3.2, d: 0.6, reveal: 'fade' });
}

// ================================================================ the canal
function waterPoly() {
  return [P(EDGE, HEAD, 0), P(EDGE, 400, 0), [VX - 200, VY], [PX + PW, VY], [PX + PW, PB], P(EDGE, HEAD, 0)];
}
function water(p, r) {
  const wp = [[P(EDGE, 9, 0)[0], PB], P(EDGE, 9, 0), P(EDGE, 100, 0), [600, VY], [PX + PW, VY], [PX + PW, PB]];
  p.group('water', { x: PX, y: VY - 4, w: PW, h: PB - VY + 8 }, (c) => {
    c.fillStyle = WATER; c.fillRect(PX, VY, PW, PB - VY);
    // the harbor beyond the canal's mouth: a lighter band
    c.fillStyle = mix(WATER, GLINT, 0.35); c.fillRect(PX, VY, PW, 10);
    c.fillStyle = mix(WATER, GLINT, 0.18); c.fillRect(PX, VY + 10, PW, 8);
  }, { t: 2.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // ripples: short dashes that shrink toward the mouth
  const lines = [];
  for (let s = 9; s < 90; s *= 1.035) {
    const y = VY + E * F / s, kk = F / s;
    const xl = VX + EDGE * kk, xr = PX + PW;
    for (let x = xl + r.range(0, 30) * kk / 30; x < xr; x += r.range(40, 120) * kk / 20) {
      const L = r.range(0.5, 1.6) * kk;
      lines.push([[x, y + r.range(-2, 2)], [x + L, y]]);
    }
  }
  p.strokes('water', lines, WATER_D, 2.4, { t: 3.0, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: PX, y: VY, w: PW, h: PB - VY } });
}

// ================================================================ the north quay's houses
const PALETTE = [OCHRE, RED, BLUE, CREAM, TERRA, YELLOW, SAGE, ROSE, PEACH, COBALT, OCHRE, CREAM, RED, YELLOW, BLUE, TERRA, CREAM, ROSE];
function houses(p, r) {
  const list = [];
  let s = 7.6, i = 0;
  while (s < 100) {
    const w = r.range(5.5, 8.5) * (s < 12 ? 1.1 : 1);
    const floors = r.int(3, 4) + (r.chance(0.2) ? 1 : 0);
    const h = 4.8 + floors * 2.9 + 0.4;
    const type = r.pick(['tri', 'curve', 'dormer', 'tri', 'gable', 'curve']);
    list.push({ s0: s, s1: s + w, h, floors, col: PALETTE[i % PALETTE.length], type, seed: r.int(1, 1e6), i });
    s += w; i++;
  }
  // far to near
  const order = list.slice().reverse();
  order.forEach((hs, n) => house(p, hs, 3.7 + n * 0.22));
  return list;
}

function house(p, hs, t) {
  const { s0, s1, h, col, type, floors } = hs;
  const rr = rng(hs.seed);
  const sc = (s0 + s1) / 2, kk = F / sc;
  const X = FAC, dark = shade(col, 0.8), trim = col === CREAM || col === PEACH || col === YELLOW ? shade(col, 0.82) : '#f3ead6';
  const face = [P(X, s0, QZ), P(X, s1, QZ), P(X, s1, h), P(X, s0, h)];
  const isGable = type === 'gable';
  const roof = [P(X, s0, h), P(X, s1, h), P(X - 4.5, s1, h + 4.5), P(X - 4.5, s0, h + 4.5)];
  // the firewall at the near end, which shows above a lower neighbor
  const fire = [P(X, s0, QZ), P(X, s0, h), P(X - 4.5, s0, h + 4.5), P(X - 9, s0, h), P(X - 9, s0, QZ)];
  // the gable dormer (frontispiece) in the middle of the front
  const fw = (s1 - s0) * (type === 'gable' ? 0.5 : 0.2);
  const fa = sc - fw, fb = sc + fw, fh = isGable ? 4.6 : 3.4;
  const front = [];
  if (type === 'tri' || isGable) { front.push(P(X, fa, h - 0.1), P(X, fb, h - 0.1), P(X, sc, h + fh)); }
  if (type === 'curve') {
    for (let j = 0; j <= 16; j++) { const t2 = j / 16; const z = h + fh * Math.sin(t2 * Math.PI) ** 0.6 * (0.8 + 0.2 * Math.cos((t2 - 0.5) * 12)); front.push(P(X, lerp(fa, fb, t2), Math.max(h - 0.1, z))); }
  }
  const chim = [P(X - 4.5, lerp(s0, s1, 0.25), h + 4.5), P(X - 4.5, lerp(s0, s1, 0.25), h + 6), P(X - 4.5, lerp(s0, s1, 0.25) + 0.7, h + 6), P(X - 4.5, lerp(s0, s1, 0.25) + 0.7, h + 4.5)];
  const all = [...face, ...roof, ...fire, ...chim, ...(front.length ? front : [])];
  const b = boxOf(all, 6);
  // tile lines across the roof, running to the vanishing point
  const tiles = [];
  for (let a = 0.6; a < 4.5; a += kk > 40 ? 0.45 : 0.9) tiles.push([P(X - a, s0, h + a), P(X - a, s1, h + a)]);
  p.group('houses', b, (c) => {
    c.fillStyle = shade(col, 0.72); pathOf(c, fire); c.fill();
    c.fillStyle = rr ? (hs.i % 4 === 1 ? SLATE : ROOF) : ROOF; pathOf(c, roof); c.fill();
    c.strokeStyle = shade(hs.i % 4 === 1 ? SLATE : ROOF, 0.82); c.lineWidth = Math.max(0.8, kk * 0.06); c.beginPath();
    for (const [a1, b1] of tiles) { c.moveTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); } c.stroke();
    c.fillStyle = shade(col, 0.66); pathOf(c, chim); c.fill();
    c.fillStyle = col; pathOf(c, face); c.fill();
    if (front.length) { c.fillStyle = col; pathOf(c, front); c.fill(); }
    // the cornice and the plinth
    c.fillStyle = trim; pathOf(c, [P(X, s0, h - 0.35), P(X, s1, h - 0.35), P(X, s1, h), P(X, s0, h)]); c.fill();
    c.fillStyle = dark; pathOf(c, [P(X, s0, QZ), P(X, s1, QZ), P(X, s1, QZ + 0.7), P(X, s0, QZ + 0.7)]); c.fill();
    // a shadow down the far edge, where the next house steps out
    c.fillStyle = shade(col, 0.9); pathOf(c, [P(X, s1 - 0.4, QZ), P(X, s1, QZ), P(X, s1, h), P(X, s1 - 0.4, h)]); c.fill();
  }, { t, d: 0.9, reveal: 'rise', ease: 'out' });

  // windows, doors and the ground floor
  const nc = Math.max(2, Math.round((s1 - s0) / 2.1));
  const near = kk > 45;
  const panes = [], frames = [], sills = [];
  for (let f = 0; f < floors; f++) {
    const za = 5.2 + f * 2.9, zb = za + 1.55;
    for (let j = 0; j < nc; j++) {
      const m = (j + 0.5) / nc, hw = 0.33 / nc * (s1 - s0) / 2.1 * 1.0 + 0.0;
      const sa = lerp(s0, s1, m) - 0.42, sb = lerp(s0, s1, m) + 0.42;
      frames.push([P(X, sa - 0.1, za - 0.1), P(X, sb + 0.1, za - 0.1), P(X, sb + 0.1, zb + 0.1), P(X, sa - 0.1, zb + 0.1)]);
      panes.push([P(X, sa, za), P(X, sb, za), P(X, sb, zb), P(X, sa, zb)]);
      sills.push([P(X, sa - 0.2, za - 0.28), P(X, sb + 0.2, za - 0.28), P(X, sb + 0.2, za - 0.12), P(X, sa - 0.2, za - 0.12)]);
      void hw;
    }
  }
  // a window in the dormer
  if (front.length) {
    const za = h + 0.5, zb = h + (isGable ? 2.6 : 2.0);
    panes.push([P(X, sc - 0.38, za), P(X, sc + 0.38, za), P(X, sc + 0.38, zb), P(X, sc - 0.38, zb)]);
    frames.push([P(X, sc - 0.48, za - 0.1), P(X, sc + 0.48, za - 0.1), P(X, sc + 0.48, zb + 0.1), P(X, sc - 0.48, zb + 0.1)]);
  } else {
    // two small dormers on the roof
    for (const m of [0.3, 0.7]) {
      const sm = lerp(s0, s1, m);
      frames.push([P(X - 1.2, sm - 0.55, h + 1.2), P(X - 1.2, sm + 0.55, h + 1.2), P(X - 1.2, sm + 0.55, h + 2.6), P(X - 1.2, sm - 0.55, h + 2.6)]);
      panes.push([P(X - 1.2, sm - 0.35, h + 1.4), P(X - 1.2, sm + 0.35, h + 1.4), P(X - 1.2, sm + 0.35, h + 2.3), P(X - 1.2, sm - 0.35, h + 2.3)]);
    }
  }
  // the ground floor: a door with a fanlight, a café front with an awning, a cellar
  const doorS = lerp(s0, s1, rr.range(0.15, 0.3));
  const door = [P(X, doorS - 0.55, QZ + 0.7), P(X, doorS + 0.55, QZ + 0.7), P(X, doorS + 0.55, QZ + 3.1), P(X, doorS - 0.55, QZ + 3.1)];
  const shop = [P(X, doorS + 1.1, QZ + 0.9), P(X, s1 - 0.7, QZ + 0.9), P(X, s1 - 0.7, QZ + 2.9), P(X, doorS + 1.1, QZ + 2.9)];
  const awnCol = rr.pick([RED, NAVY, CREAM, OCHRE, SAGE]);
  const awnStripe = awnCol === CREAM ? RED : '#f2ead8';
  const awn = [P(X, doorS + 0.9, QZ + 3.4), P(X, s1 - 0.5, QZ + 3.4), P(X + 1.6, s1 - 0.5, QZ + 2.6), P(X + 1.6, doorS + 0.9, QZ + 2.6)];
  const stripes = [];
  const ns = Math.max(3, Math.round((s1 - 0.5 - doorS - 0.9) / 0.6));
  for (let j = 0; j < ns; j += 2) {
    const a = lerp(doorS + 0.9, s1 - 0.5, j / ns), b2 = lerp(doorS + 0.9, s1 - 0.5, (j + 1) / ns);
    stripes.push([P(X, a, QZ + 3.4), P(X, b2, QZ + 3.4), P(X + 1.6, b2, QZ + 2.6), P(X + 1.6, a, QZ + 2.6)]);
  }
  const hasAwn = rr.chance(0.7);
  const db = boxOf([...face, ...(front.length ? front : []), ...awn, P(X - 1.2, s0, h + 3)], 6);
  p.group('hdetail', db, (c) => {
    c.fillStyle = trim; for (const q of frames) { pathOf(c, q); c.fill(); }
    c.fillStyle = NAVY; for (const q of panes) { pathOf(c, q); c.fill(); }
    if (near) {
      // glazing bars: a cross in each window
      c.strokeStyle = trim; c.lineWidth = Math.max(1, kk * 0.07); c.beginPath();
      for (const q of panes) {
        const mx0 = (q[0][0] + q[1][0]) / 2, my0 = (q[0][1] + q[1][1]) / 2, mx1 = (q[3][0] + q[2][0]) / 2, my1 = (q[3][1] + q[2][1]) / 2;
        c.moveTo(mx0, my0); c.lineTo(mx1, my1);
        const lx = lerp(q[0][0], q[3][0], 0.6), ly = lerp(q[0][1], q[3][1], 0.6), rx = lerp(q[1][0], q[2][0], 0.6), ry = lerp(q[1][1], q[2][1], 0.6);
        c.moveTo(lx, ly); c.lineTo(rx, ry);
      }
      c.stroke();
      c.fillStyle = dark; for (const q of sills) { pathOf(c, q); c.fill(); }
    }
    // the door and the shop window
    c.fillStyle = shade(col === RED ? NAVY : RED, 0.85); pathOf(c, door); c.fill();
    c.fillStyle = INK; pathOf(c, shop); c.fill();
    if (hasAwn) {
      c.fillStyle = awnCol; pathOf(c, awn); c.fill();
      c.fillStyle = awnStripe; for (const q of stripes) { pathOf(c, q); c.fill(); }
    }
  }, { t: t + 0.5, d: 0.7, reveal: 'fade' });
}

// the houses' reflections: the upper floors, mirrored in the water and broken into dashes
function reflections(p, hs) {
  const step = 9;
  p.group('refl', { x: PX, y: VY, w: PW, h: PB - VY }, (c) => {
    c.save();
    // only the open water, past the near quay's edge
    pathOf(c, [P(EDGE, HEAD + 1.5, 0), P(EDGE, 300, 0), [PX + PW, VY], [PX + PW, PB], [P(EDGE, HEAD + 1.5, 0)[0], PB]]); c.clip();
    for (const h of hs) {
      const top = h.h + (h.type === 'gable' ? 3.5 : 2);
      c.fillStyle = mix(h.col, WATER, 0.45);
      pathOf(c, [P(FAC, h.s0, -5), P(FAC, h.s1, -5), P(FAC, h.s1, -top), P(FAC, h.s0, -top)]); c.fill();
    }
    // the water's dashes across the reflection
    c.fillStyle = WATER;
    for (let y = VY + 2; y < PB; y += step) { const g = 2 + (y - VY) / 140; c.fillRect(PX, y, PW, g); }
    c.restore();
  }, { t: 7.3, d: 1.4, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the quay: stone, cobbles, the plaza at the canal's head
function quay(p, r) {
  const qa = [P(FAC, 6, QZ), P(FAC, 120, QZ), P(EDGE, 120, QZ), P(EDGE, HEAD, QZ), [PX - 10, PB + 20]];
  p.group('quay', { x: PX, y: VY, w: 900, h: PB - VY }, (c) => {
    c.fillStyle = STONE; pathOf(c, [P(FAC, 5, QZ), P(FAC, 120, QZ), P(EDGE, 120, QZ), P(EDGE, 4.5, QZ)]); c.fill();
    // the quay's face, down to the water
    c.fillStyle = STONE_D; pathOf(c, [P(EDGE, HEAD, QZ), P(EDGE, 120, QZ), P(EDGE, 120, 0), P(EDGE, HEAD, 0)]); c.fill();
    c.fillStyle = INK; pathOf(c, [P(EDGE, HEAD, QZ), P(EDGE, 120, QZ), P(EDGE, 120, QZ - 0.12), P(EDGE, HEAD, QZ - 0.12)]); c.fill();
  }, { t: 3.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  void qa;
  // cobbles: lines running out along the quay, and across
  const lines = [];
  for (let X = FAC + 0.6; X < EDGE; X += 0.6) lines.push([P(X, 6, QZ), P(X, 60, QZ)]);
  for (let s = 6; s < 40; s *= 1.05) lines.push([P(FAC, s, QZ), P(EDGE, s, QZ)]);
  p.strokes('quay', lines, STONE_D, 1.1, { t: 3.4, d: 0.8, reveal: 'fade', box: { x: PX, y: VY, w: 900, h: PB - VY } });
  // the plaza at the head of the canal, with its granite edge
  p.group('quay', { x: PX, y: 1440, w: PW, h: PB - 1440 + 10 }, (c) => {
    const yE = P(0, HEAD, QZ)[1];
    c.fillStyle = PLAZA; c.fillRect(PX, yE, PW, PB - yE + 10);
    c.fillStyle = STONE_D; c.fillRect(P(EDGE, HEAD, QZ)[0] - 40, yE, PX + PW, 10);
    c.fillStyle = INK; c.fillRect(P(EDGE, HEAD, QZ)[0] - 40, yE - 2, PX + PW, 3);
    // setts, in arcs
    c.strokeStyle = shade(PLAZA, 0.86); c.lineWidth = 1.4; c.beginPath();
    for (let y = yE + 26; y < PB; y += 22) for (let x = PX - 60 + ((y / 22) % 2) * 30; x < PX + PW + 60; x += 60) { c.moveTo(x - 28, y); c.quadraticCurveTo(x, y - 12, x + 28, y); }
    c.stroke();
  }, { t: 3.6, d: 0.8, reveal: 'rise' });
  // bollards along the edge, and a chain between them
  const bol = [];
  for (let s = 8; s < 70; s *= 1.18) bol.push(s);
  p.group('quay', boxOf([P(EDGE + 0.3, 8, QZ + 1.2), P(EDGE, 8, QZ), P(EDGE, 70, QZ)], 20), (c) => {
    c.fillStyle = INK;
    for (const s of bol) { const kk = F / s; const [x, y] = P(EDGE + 0.35, s, QZ); c.fillRect(x - kk * 0.14, y - kk * 0.7, kk * 0.28, kk * 0.7); c.beginPath(); c.arc(x, y - kk * 0.7, kk * 0.17, Math.PI, 0); c.fill(); }
  }, { t: 7.3, d: 0.5, reveal: 'fade' });
  // iron lamp posts along the quay, each with a lantern
  const lamps = [];
  for (let s = 12.5; s < 80; s *= 1.36) lamps.push(s);
  p.group('quay', boxOf([P(EDGE - 0.9, 9.2, QZ + 5), P(EDGE - 0.9, 9.2, QZ), P(EDGE - 0.9, 80, QZ)], 30), (c) => {
    for (const s of lamps) {
      c.save(); inS(c, EDGE - 0.9, s, QZ);
      c.fillStyle = INK; c.fillRect(-0.06, 0, 0.12, 3.6); c.fillRect(-0.14, 0, 0.28, 0.5);
      c.beginPath(); c.moveTo(-0.24, 3.6); c.lineTo(0.24, 3.6); c.lineTo(0.3, 4.2); c.lineTo(-0.3, 4.2); c.closePath(); c.fill();
      c.fillStyle = '#f6e2a6'; c.fillRect(-0.18, 3.68, 0.36, 0.44);
      c.fillStyle = INK; c.beginPath(); c.moveTo(-0.36, 4.2); c.lineTo(0, 4.5); c.lineTo(0.36, 4.2); c.closePath(); c.fill();
      c.restore();
    }
  }, { t: 7.5, d: 0.7, reveal: 'rise' });
}

// ================================================================ the ships along the quay
function hull(X0, X1, s0, s1, fb, bowLift) {
  // the outer side (X1), the stern (s0), the deck; the bow narrows to the middle
  const mid = (X0 + X1) / 2, sb = s1 - (s1 - s0) * 0.22;
  const sheer = (s) => fb + bowLift * clamp((s - s0) / (s1 - s0)) ** 3;
  const side = [];
  for (let j = 0; j <= 10; j++) { const s = lerp(s0, sb, j / 10); side.push(P(X1, s, sheer(s))); }
  for (let j = 1; j <= 8; j++) { const t = j / 8; const s = lerp(sb, s1 + 1, t); side.push(P(lerp(X1, mid, t ** 1.6), s, sheer(s))); }
  for (let j = 8; j >= 1; j--) { const t = j / 8; const s = lerp(sb, s1 - 0.4, t); side.push(P(lerp(X1, mid, t ** 1.2), s, -0.2)); }
  side.push(P(X1, sb, -0.2), P(X1, s0 + 0.3, -0.2));
  const stern = [P(X0, s0, fb), P(X1, s0, fb), P(X1, s0 + 0.3, -0.2), P(X0 + 0.6, s0 + 0.3, -0.2)];
  const deck = [P(X0, s0, fb), P(X1, s0, fb)];
  for (let j = 0; j <= 10; j++) { const s = lerp(s0, sb, j / 10); deck.push(P(X1, s, sheer(s))); }
  deck.push(P(mid, s1 + 1, sheer(s1 + 1)));
  for (let j = 10; j >= 0; j--) { const s = lerp(s0, sb, j / 10); deck.push(P(X0, s, sheer(s))); }
  return { side, stern, deck, sheer, mid };
}
function ships(p, r) {
  const X0 = EDGE + 0.2, X1 = EDGE + 4.6;
  const fleet = [
    { s0: 74, s1: 84, col: INK, band: CREAM, masts: [[78, 12]], t: 7.6 },
    { s0: 57, s1: 69, col: '#2f5a4c', band: OCHRE, masts: [[60, 14], [64.5, 17]], t: 7.8 },
    { s0: 43, s1: 54, col: NAVY, band: RED, masts: [[47, 16]], t: 8.0 },
    { s0: 30.5, s1: 40.5, col: RED, band: CREAM, masts: [[34.5, 15]], t: 8.2, light: true },
    { s0: 19.5, s1: 28.5, col: '#ede0c0', band: INK, masts: [[22, 15], [25.6, 19]], t: 8.5 },
    { s0: 10.4, s1: 18, col: INK, band: OCHRE, masts: [[12.6, 17], [15.6, 21]], t: 8.8 },
  ];
  // small boats on the far side
  for (const [s0, col] of [[52, CREAM], [40, RED], [64, BLUE]]) {
    const hh = hull(REDGE - 3.2, REDGE - 0.4, s0, s0 + 6, 1.0, 0.5);
    // their outer side faces us from the right, so draw the X0 side
    const side = [P(REDGE - 3.2, s0, 1), P(REDGE - 3.2, s0 + 6, 1.3), P(REDGE - 1.8, s0 + 7, 1.4), P(REDGE - 3.2, s0 + 5.6, -0.2), P(REDGE - 3.2, s0, -0.2)];
    p.group('ships', boxOf([...side, P(REDGE - 1.8, s0 + 3, 9)], 4), (c) => {
      c.fillStyle = col; pathOf(c, side); c.fill();
      c.fillStyle = shade(col, 0.7); pathOf(c, hh.stern); c.fill();
      const [mx, my] = P(REDGE - 1.8, s0 + 3, 1), [, ty] = P(REDGE - 1.8, s0 + 3, 9);
      c.fillStyle = WOOD; c.fillRect(mx - 1, ty, 2.2, my - ty);
    }, { t: 7.5, d: 0.6, reveal: 'rise' });
  }
  const rig = [];
  fleet.forEach((sh, n) => {
    const { s0, s1, col, band } = sh;
    const fb = sh.light ? 2.4 : 1.6;
    const hh = hull(X0, X1, s0, s1, fb, sh.light ? 0.9 : 1.1);
    const kk = F / ((s0 + s1) / 2);
    // a rubbing band under the rail
    const bandPts = [];
    for (let j = 0; j <= 12; j++) { const s = lerp(s0, s1 - (s1 - s0) * 0.22, j / 12); bandPts.push(P(X1, s, hh.sheer(s) - 0.15)); }
    for (let j = 12; j >= 0; j--) { const s = lerp(s0, s1 - (s1 - s0) * 0.22, j / 12); bandPts.push(P(X1, s, hh.sheer(s) - 0.55)); }
    // a deckhouse
    const dhA = lerp(s0, s1, 0.08), dhB = lerp(s0, s1, 0.32);
    const dh = [P(X1 - 1, dhA, fb), P(X1 - 1, dhB, fb), P(X1 - 1, dhB, fb + 1.0), P(X1 - 1, dhA, fb + 1.0)];
    const dhEnd = [P(X0 + 1, dhA, fb), P(X1 - 1, dhA, fb), P(X1 - 1, dhA, fb + 1.0), P(X0 + 1, dhA, fb + 1.0)];
    const dhTop = [P(X0 + 1, dhA, fb + 1.0), P(X1 - 1, dhA, fb + 1.0), P(X1 - 1, dhB, fb + 1.0), P(X0 + 1, dhB, fb + 1.0)];
    const portholes = [];
    for (let j = 1; j < 6; j++) portholes.push(P(X1, lerp(s0, s1, j / 7), fb * 0.45));
    // masts, booms with furled sails, bowsprit
    const masts = sh.masts.map(([ms, mh]) => ({ ms, mh, foot: P(hh.mid, ms, fb), top: P(hh.mid, ms, fb + mh) }));
    const bowTip = P(hh.mid, s1 + 5, hh.sheer(s1) + 0.8);
    const all = [...hh.side, ...hh.stern, ...hh.deck, ...masts.map((m) => m.top), bowTip];
    p.group('ships', boxOf([...hh.side, ...hh.stern, ...hh.deck, ...dh, ...dhTop, bowTip], 6), (c) => {
      c.fillStyle = shade(col === '#ede0c0' ? CREAM : col, 0.62); pathOf(c, hh.stern); c.fill();
      c.fillStyle = WOOD; pathOf(c, hh.deck); c.fill();
      c.fillStyle = col; pathOf(c, hh.side); c.fill();
      c.fillStyle = band; pathOf(c, bandPts); c.fill();
      // the waterline
      c.fillStyle = shade(col === '#ede0c0' ? OCHRE : col, 0.55);
      pathOf(c, [P(X1, s0 + 0.3, 0.25), P(X1, s1 - (s1 - s0) * 0.22, 0.25), P(lerp(X1, hh.mid, 0.7), s1 - 0.6, 0.25), P(lerp(X1, hh.mid, 0.7), s1 - 0.6, -0.2), P(X1, s0 + 0.3, -0.2)]); c.fill();
      c.fillStyle = shade(CREAM, 0.95); pathOf(c, dhEnd); c.fill();
      c.fillStyle = CREAM; pathOf(c, dh); c.fill();
      c.fillStyle = shade(WOOD, 0.8); pathOf(c, dhTop); c.fill();
      c.fillStyle = INK; for (const [x, y] of portholes) { c.beginPath(); c.arc(x, y, Math.max(1, kk * 0.13), 0, Math.PI * 2); c.fill(); }
      // the bowsprit
      const [bx, by] = P(hh.mid, s1 - 0.5, hh.sheer(s1) + 0.4);
      c.strokeStyle = WOOD; c.lineWidth = Math.max(1.5, kk * 0.14); c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bowTip[0], bowTip[1]); c.stroke();
    }, { t: sh.t, d: 1.0, reveal: 'rise', ease: 'out' });
    if (sh.light) {
      // the lightship's name along her side, and her lantern mast
      const sm = lerp(s0, s1, 0.42);
      p.group('ships', boxOf([P(X1, sm - 3, fb), P(X1, sm + 4, 0)], 10), (c) => {
        c.save(); inX(c, X1, sm - 2.6, fb * 0.32); c.scale(1, -1);
        c.fillStyle = '#f4ecd8'; c.font = '600 0.95px "Jost"'; c.textBaseline = 'alphabetic';
        c.fillText('GEDSER REV', 0, 0);
        c.restore();
      }, { t: sh.t + 0.6, d: 0.6, reveal: 'wipe' });
    }
    // masts, rising
    masts.forEach((m, j) => {
      const mw = Math.max(2, kk * 0.22);
      const boomEnd = P(hh.mid, m.ms - 4.2, fb + 2.2), boomFoot = P(hh.mid, m.ms, fb + 2.4);
      const gaffEnd = P(hh.mid, m.ms - 3.6, fb + m.mh * 0.62), gaffFoot = P(hh.mid, m.ms, fb + m.mh * 0.5);
      p.group('ships', boxOf([m.foot, m.top, boomEnd, gaffEnd], 12), (c) => {
        c.fillStyle = WOOD;
        c.beginPath(); c.moveTo(m.foot[0] - mw / 2, m.foot[1]); c.lineTo(m.foot[0] + mw / 2, m.foot[1]); c.lineTo(m.top[0] + mw * 0.2, m.top[1]); c.lineTo(m.top[0] - mw * 0.2, m.top[1]); c.closePath(); c.fill();
        // crosstrees
        const [cx2, cy2] = P(hh.mid, m.ms, fb + m.mh * 0.78);
        c.fillRect(cx2 - kk * 0.6, cy2 - 1, kk * 1.2, Math.max(1.5, kk * 0.08));
        if (sh.light && j === 0) {
          // the lantern cage near the top
          const [lx, ly] = P(hh.mid, m.ms, fb + m.mh * 0.86);
          const lw = kk * 0.9, lh = kk * 1.1;
          c.fillStyle = INK; c.fillRect(lx - lw / 2, ly - lh, lw, lh);
          c.fillStyle = SUN; c.fillRect(lx - lw * 0.32, ly - lh * 0.84, lw * 0.64, lh * 0.6);
          c.fillStyle = INK; c.beginPath(); c.moveTo(lx - lw * 0.6, ly - lh); c.lineTo(lx, ly - lh * 1.5); c.lineTo(lx + lw * 0.6, ly - lh); c.fill();
        } else {
          // the gaff and boom, with the sails furled on them
          c.strokeStyle = WOOD; c.lineWidth = Math.max(1.4, kk * 0.12); c.lineCap = 'round'; c.beginPath();
          c.moveTo(boomFoot[0], boomFoot[1]); c.lineTo(boomEnd[0], boomEnd[1]); c.moveTo(gaffFoot[0], gaffFoot[1]); c.lineTo(gaffEnd[0], gaffEnd[1]); c.stroke();
          c.strokeStyle = SAILC; c.lineWidth = Math.max(3, kk * 0.42); c.beginPath();
          c.moveTo(lerp(boomFoot[0], boomEnd[0], 0.08), lerp(boomFoot[1], boomEnd[1], 0.08) - kk * 0.2); c.lineTo(lerp(boomFoot[0], boomEnd[0], 0.92), lerp(boomFoot[1], boomEnd[1], 0.92) - kk * 0.2); c.stroke();
          c.strokeStyle = shade(SAILC, 0.85); c.lineWidth = Math.max(1, kk * 0.08); c.beginPath();
          for (let q = 0.15; q < 0.9; q += 0.12) { const x = lerp(boomFoot[0], boomEnd[0], q), y = lerp(boomFoot[1], boomEnd[1], q) - kk * 0.2; c.moveTo(x, y - kk * 0.22); c.lineTo(x + kk * 0.05, y + kk * 0.2); }
          c.stroke();
        }
      }, { t: sh.t + 0.4 + j * 0.15, d: 1.1, reveal: 'rise', ease: 'out' });
      // the rigging: stays to the bowsprit and the stern, shrouds down each side
      const [sx0, sy0] = P(X0 + 0.2, m.ms - 0.4, fb), [sx1, sy1] = P(X1 - 0.2, m.ms - 0.4, fb);
      rig.push({ t: sh.t + 1.2 + j * 0.2, lines: [[m.top, j === sh.masts.length - 1 ? bowTip : masts[j + 1].top], [m.top, [sx0, sy0]], [m.top, [sx1, sy1]], ...(j === 0 ? [[m.top, P(hh.mid, s0 + 0.2, fb + 0.6)]] : [])], kk });
    });
    void all;
  });
  // the rigging, drawn by pen
  rig.sort((a, b) => a.t - b.t).forEach((g) => {
    g.lines.forEach((l, j) => p.pen('rig', [l[0], l[1]], INK, Math.max(1, g.kk * 0.045), { t: g.t + j * 0.08, d: 0.9 }));
  });
}

// ================================================================ in front: umbrellas, bicycles, people, the anchor
function figure(c, col, hat, skirt) {
  // a mid-century person, u across and v up, 1.75 tall
  c.fillStyle = INK; c.beginPath(); c.arc(0, 1.6, 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = col;
  if (skirt) { c.beginPath(); c.moveTo(-0.17, 1.44); c.lineTo(0.17, 1.44); c.lineTo(0.3, 0.55); c.lineTo(-0.3, 0.55); c.closePath(); c.fill(); }
  else { c.beginPath(); c.moveTo(-0.2, 1.44); c.lineTo(0.2, 1.44); c.lineTo(0.18, 0.8); c.lineTo(-0.18, 0.8); c.closePath(); c.fill(); }
  c.fillStyle = INK; c.fillRect(-0.15, 0, 0.11, skirt ? 0.58 : 0.82); c.fillRect(0.04, 0, 0.11, skirt ? 0.58 : 0.82);
  if (hat) { c.fillStyle = hat; c.fillRect(-0.16, 1.68, 0.32, 0.08); }
}
function bike(c, col) {
  // a city bicycle side on: u along it (1.7 long), v up
  c.strokeStyle = INK; c.lineWidth = 0.05; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.arc(0.33, 0.33, 0.32, 0, Math.PI * 2); c.moveTo(1.67, 0.33); c.arc(1.35, 0.33, 0.32, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = col; c.lineWidth = 0.07; c.beginPath();
  c.moveTo(0.33, 0.33); c.lineTo(0.78, 0.36); c.lineTo(0.68, 0.86); c.lineTo(1.24, 0.86); c.lineTo(1.35, 0.33);
  c.moveTo(0.78, 0.36); c.lineTo(1.2, 0.8); c.moveTo(0.68, 0.86); c.lineTo(0.64, 0.98);
  c.moveTo(1.24, 0.86); c.lineTo(1.22, 1.08); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 0.06; c.beginPath(); c.moveTo(0.52, 1.0); c.lineTo(0.78, 1.0); c.moveTo(1.12, 1.1); c.lineTo(1.3, 1.06); c.stroke();
  // a basket on the front
  c.fillStyle = OCHRE; c.fillRect(1.3, 0.86, 0.32, 0.22);
}
function fore(p, r) {
  // café umbrellas and tables along the houses
  const umbs = [];
  for (let s = 9.4; s < 60; s *= r.range(1.12, 1.2)) umbs.push([s, r.pick([CREAM, RED, OCHRE, CREAM, NAVY]), r.range(-12.4, -10.6)]);
  umbs.reverse();
  umbs.forEach(([s, col, X], i) => {
    const kk = F / s, [x, y] = P(X, s, QZ);
    const b = { x: x - kk * 1.8, y: y - kk * 2.8, w: kk * 3.6, h: kk * 2.9 };
    p.group('fore', b, (c) => {
      c.save(); inS(c, X, s, QZ);
      c.fillStyle = INK; c.fillRect(-0.05, 0, 0.1, 2.3);
      // tables and chairs under it
      c.fillRect(-0.7, 0.72, 0.6, 0.06); c.fillRect(0.25, 0.72, 0.6, 0.06); c.fillRect(-0.45, 0, 0.06, 0.72); c.fillRect(0.5, 0, 0.06, 0.72);
      c.fillStyle = col; c.beginPath(); c.moveTo(-1.5, 2.0); c.quadraticCurveTo(0, 2.75, 1.5, 2.0); c.closePath(); c.fill();
      c.fillStyle = col === CREAM ? RED : CREAM; c.fillRect(-1.5, 1.9, 3.0, 0.12);
      c.restore();
    }, { t: 9.2 + i * 0.07, d: 0.5, reveal: 'pop' });
  });
  // people on the quay
  const folk = [];
  for (let n = 0; n < 16; n++) folk.push([Math.exp(r.range(Math.log(9), Math.log(55))), r.range(-12.8, -6.8), r.pick([RED, NAVY, OCHRE, CREAM, COBALT, SAGE, TERRA]), r.chance(0.3) ? INK : null, r.chance(0.4)]);
  folk.sort((a, b) => b[0] - a[0]);
  p.group('fore', { x: PX, y: 700, w: 1000, h: 900 }, (c) => {
    for (const [s, X, col, hat, sk] of folk) { c.save(); inS(c, X, s, QZ); figure(c, col, hat, sk); c.restore(); }
  }, { t: 9.6, d: 0.8, reveal: 'fade' });
  // bicycles parked along the near houses, and one against the quay edge
  const bikes = [];
  for (let s = 8.2; s < 14.5; s += 0.62) bikes.push([s, r.pick([INK, RED, COBALT, '#2f5a4c', OCHRE, INK])]);
  p.group('fore', { x: PX - 10, y: 950, w: 500, h: 560 }, (c) => {
    for (let n = bikes.length - 1; n >= 0; n--) { const [s, col] = bikes[n]; c.save(); inX(c, FAC + 0.5 + (n % 2) * 0.12, s, QZ); bike(c, col); c.restore(); }
  }, { t: 9.9, d: 0.8, reveal: 'wipe' });
  // on the plaza: two people with bicycles, and a cargo bike
  p.group('fore', { x: 300, y: 1300, w: 700, h: 310 }, (c) => {
    c.save(); inS(c, -3.6, 5.9, QZ); c.scale(1, 1); figure(c, RED, null, true); c.restore();
    c.save(); inS(c, -2.1, 6.4, QZ); figure(c, NAVY, INK, false); c.restore();
    c.save(); inS(c, -6.0, 6.2, QZ); bike(c, '#2f5a4c'); c.restore();
    c.save(); inS(c, -1.6, 6.5, QZ); c.scale(-1, 1); bike(c, RED); c.restore();
  }, { t: 10.3, d: 0.6, reveal: 'drop', dy: 20 });
  anchor(p);
}

// the memorial anchor: an admiralty anchor, stock across the top, on a granite plinth
function anchor(p) {
  const X = 0.9, s = 6.6, kk = F / s;
  const [bx, by] = P(X, s, QZ);
  p.group('fore', { x: bx - kk * 2.6, y: by - kk * 1.3, w: kk * 5.2, h: kk * 1.4 }, (c) => {
    c.save(); inS(c, X, s, QZ);
    c.fillStyle = shade(STONE, 0.78); c.fillRect(-1.3, 0, 2.6, 1.0);
    c.fillStyle = STONE; c.fillRect(-1.3, 0, 1.9, 1.0);
    c.fillStyle = shade(STONE, 0.7); c.fillRect(-1.45, 1.0, 2.9, 0.16);
    c.restore();
  }, { t: 9.0, d: 0.6, reveal: 'rise' });
  p.group('fore', { x: bx - kk * 2.6, y: by - kk * 6.4, w: kk * 5.2, h: kk * 5.3 }, (c) => {
    c.save(); inS(c, X, s, QZ + 1.16);
    c.fillStyle = INK; c.strokeStyle = INK; c.lineCap = 'round';
    // the shank
    c.beginPath(); c.moveTo(-0.12, 0.2); c.lineTo(0.12, 0.2); c.lineTo(0.09, 4.0); c.lineTo(-0.09, 4.0); c.closePath(); c.fill();
    // the arms and flukes
    c.lineWidth = 0.2; c.beginPath(); c.moveTo(-1.25, 1.25); c.quadraticCurveTo(-1.0, 0.15, 0, 0.18); c.quadraticCurveTo(1.0, 0.15, 1.25, 1.25); c.stroke();
    for (const sgn of [-1, 1]) { c.beginPath(); c.moveTo(sgn * 1.25, 1.55); c.lineTo(sgn * 1.55, 1.05); c.lineTo(sgn * 1.0, 0.95); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(0, 0.12, 0.16, 0, Math.PI * 2); c.fill();
    // the stock and the ring
    c.fillRect(-1.5, 3.45, 3.0, 0.2); c.beginPath(); c.arc(-1.5, 3.55, 0.13, 0, Math.PI * 2); c.arc(1.5, 3.55, 0.13, 0, Math.PI * 2); c.fill();
    c.lineWidth = 0.1; c.beginPath(); c.arc(0, 4.22, 0.26, 0, Math.PI * 2); c.stroke();
    // a lit edge
    c.fillStyle = '#4a5a72'; c.fillRect(-0.12, 0.3, 0.06, 3.6); c.fillRect(-1.5, 3.6, 3.0, 0.05);
    c.restore();
  }, { t: 9.3, d: 1.2, reveal: 'rise', ease: 'out' });
}

// ================================================================ what moves: flags, gulls, a canal boat, glints
function lives(p, r) {
  // the Danish flags on the sterns and a flagpole: they ripple
  const flags = [[10.4, 2.4], [19.5, 2.4], [30.5, 3.2], [43, 2.4]].map(([s, z]) => ({ s, z, kk: F / s, foot: P(EDGE + 2.4, s - 0.4, z) }));
  const flagBox = boxOf(flags.flatMap((f) => [[f.foot[0] - f.kk * 3, f.foot[1] - f.kk * 4], [f.foot[0] + f.kk * 1, f.foot[1] + 4]]), 6);
  p.live('live', {
    t: 10.0, d: 0.6, reveal: 'fade', box: flagBox,
    draw: (c, time) => {
      for (const f of flags) {
        const [x, y] = f.foot, kk = f.kk;
        c.strokeStyle = WOOD; c.lineWidth = Math.max(1, kk * 0.06); c.beginPath(); c.moveTo(x, y); c.lineTo(x - kk * 0.6, y - kk * 2.8); c.stroke();
        const px = x - kk * 0.6, py = y - kk * 2.8, fw = kk * 1.3, fh = kk * 0.85;
        const wav = (u) => Math.sin(time * 4 + u * 5 + f.s) * kk * 0.08 * u;
        c.fillStyle = RED; c.beginPath(); c.moveTo(px, py);
        for (let u = 0; u <= 1.001; u += 0.25) c.lineTo(px - fw * u, py + wav(u));
        for (let u = 1; u >= -0.001; u -= 0.25) c.lineTo(px - fw * u, py + fh + wav(u));
        c.fill();
        // the white cross, nearer the hoist
        c.fillStyle = '#f6efe0';
        c.beginPath(); for (let u = 0; u <= 1.001; u += 0.25) c.lineTo(px - fw * u, py + fh * 0.42 + wav(u)); for (let u = 1; u >= -0.001; u -= 0.25) c.lineTo(px - fw * u, py + fh * 0.58 + wav(u)); c.fill();
        c.beginPath(); c.moveTo(px - fw * 0.3, py + wav(0.3)); c.lineTo(px - fw * 0.42, py + wav(0.42)); c.lineTo(px - fw * 0.42, py + fh + wav(0.42)); c.lineTo(px - fw * 0.3, py + fh + wav(0.3)); c.fill();
      }
    },
  });
  // gulls wheeling over the masts
  const gulls = [];
  for (let i = 0; i < 7; i++) gulls.push([r.range(500, 1450), r.range(130, 520), r() * 6, r.range(0.8, 1.4), r.range(0.1, 0.22)]);
  p.live('live', {
    t: 10.4, d: 0.8, reveal: 'fade', box: { x: PX, y: PY, w: PW, h: 600 },
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      for (const [x, y, ph, s, sp] of gulls) {
        const bx = x + Math.sin(time * sp + ph) * 70, by = y + Math.cos(time * sp * 1.3 + ph) * 22, f = Math.sin(time * 3 + ph * 2) * 6 * s;
        c.moveTo(bx - 20 * s, by + f * 0.3); c.quadraticCurveTo(bx - 9 * s, by - 9 * s - f, bx, by); c.quadraticCurveTo(bx + 9 * s, by - 9 * s - f, bx + 20 * s, by + f * 0.3);
      }
      c.stroke();
    },
  });
  // a canal boat with its awning, going out toward the harbor and back again
  p.live('live', {
    t: 10.8, d: 0.8, reveal: 'fade', box: { x: 600, y: VY - 20, w: PX + PW - 600, h: PB - VY + 20 },
    draw: (c, time) => {
      const u = ((time - 10.8) / 46) % 1, s = 9.5 * Math.pow(70 / 9.5, u);
      const fade = clamp(Math.min(u * 12, (1 - u) * 10));
      if (fade <= 0) return;
      c.globalAlpha *= fade;
      c.save(); inS(c, 1.2, s, 0);
      c.fillStyle = WATER_D; c.fillRect(-1.6, -0.2, 3.4, 0.2);
      c.fillStyle = NAVY; c.beginPath(); c.moveTo(-1.5, 0); c.lineTo(1.5, 0); c.lineTo(1.4, 0.9); c.lineTo(-1.4, 0.9); c.closePath(); c.fill();
      c.fillStyle = CREAM; c.fillRect(-1.45, 0.75, 2.9, 0.12);
      c.fillStyle = INK; for (let q = -1.1; q < 1.2; q += 0.55) c.fillRect(q, 0.9, 0.05, 0.8);
      c.fillStyle = '#f3ead8'; c.fillRect(-1.5, 1.68, 3.0, 0.12);
      // passengers' heads
      c.fillStyle = INK; for (let q = -1.0; q < 1.1; q += 0.42) { c.beginPath(); c.arc(q, 1.16, 0.1, 0, Math.PI * 2); c.fill(); }
      c.restore();
    },
  });
  // glints on the water, coming and going
  const gl = [];
  for (let i = 0; i < 40; i++) { const s = Math.exp(r.range(Math.log(9), Math.log(60))); const kk = F / s; gl.push([P(r.range(EDGE + 5, 9), s, 0), kk, r() * 6, r.range(0.6, 1.4)]); }
  p.live('live', {
    t: 11.0, d: 0.8, reveal: 'fade', box: { x: 600, y: VY, w: PX + PW - 600, h: PB - VY },
    draw: (c, time) => {
      c.fillStyle = GLINT; c.beginPath();
      for (const [[x, y], kk, ph, sp] of gl) {
        const a = Math.sin(time * sp + ph);
        if (a < 0.2) continue;
        const L = kk * 0.9 * a;
        c.rect(x - L / 2 + Math.sin(time * 0.5 + ph) * kk * 0.3, y, L, Math.max(1.2, kk * 0.06));
      }
      c.fill();
    },
  });
}

// ================================================================ the name, in a geometric sans, its Ø in red
function title(p) {
  const y = 1858;
  const o = { size: 250, family: '"Jost"', weight: 800, color: NAVY, track: -0.01, t: 11.0, gap: 0.12, d: 0.6, reveal: 'press', fit: PW };
  const set = p.type('title', 'KØBENHAVN', PX - 6, y, o);
  // the Ø again in red, laid exactly over the navy one
  const g = set.glyphs[1], gx = g.box.x + set.size * 0.15, f = `800 ${set.size}px "Jost"`;
  p.mark('title', { t: 12.0, d: 0.5, reveal: 'fade', box: g.box, draw: (c) => { c.font = f; c.fillStyle = RED; c.fillText('Ø', gx, y); } });
  p.group('title', { x: PX, y: 1880, w: PW, h: 40 }, (c) => {
    c.fillStyle = RED; c.fillRect(PX, 1888, PW, 6);
  }, { t: 12.2, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'NYHAVN · DANMARK 1673', PX, 1940, { size: 30, family: '"Jost"', weight: 600, color: NAVY, track: 0.2, t: 12.6, gap: 0.03, d: 0.4, reveal: 'fade' });
}
