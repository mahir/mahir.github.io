// Istanbul: dusk across the Bosphorus, seen from Üsküdar looking west. The
// historic peninsula against the afterglow: the Blue Mosque, Hagia Sophia, the
// Süleymaniye further back, Topkapı on its point, and the Galata Tower on its
// hill across the Golden Horn. The Maiden's Tower in the water, a ferry and the
// gulls. The whole view is set in an Iznik tile border, with a cobalt cartouche.

import { Plate, W, boxOf } from '../print.js';
import { mix, lerp, clamp, smooth, poly, rng } from '../kit.js';

// the dusk
const PLUM = '#24163a', VIOLET = '#47295f', MAUVE = '#8a4777', ROSE = '#c8647a';
const CORAL = '#ef8b6b', GOLD = '#f8c27e', HAZE = '#fbdca6';
const INK = '#1a1130', LAMP = '#ffd27e', LAMP2 = '#ffb45e';
// the silhouettes, far to near
const HILL = '#9a6a92', FAR = '#7a5185', SULE = '#5f4279', STONE = '#45365f', SOPHIA = '#5e3459';
const LEAD = '#4a4068', LEAD_LIT = '#9a86a8', NEAR = '#2f2045', QUAY = '#1e1230';
// Iznik
const COBALT = '#1f3f8f', COBALT_D = '#152c66', TURQ = '#2a9fa4', RED = '#c63a2c', GREEN = '#3f8a5a';
const SLIP = '#f6f1e5', TILE_INK = '#1b2347', CREAM = '#f3e9d4';

export const city = {
  id: 'istanbul', name: 'İstanbul', wall: '#1d2a52',
  alt: "A night view of the old city across the Bosphorus, its mosques and domes under a crescent moon, the Galata Tower, the Maiden's Tower and a ferry, in a border of tulips and carnations like İznik tile",
  google: 'family=Bodoni+Moda:ital,wght@0,600;1,700',
  fonts: [
    ['italic 700 150px "Bodoni Moda"', 'İstanbul'],
    ['600 22px "Bodoni Moda"', 'BOĞAZİÇİ · THE CITY ON TWO CONTINENTS'],
  ],
  build,
};

// the tile border: 96 unit tiles, 16 across and 20 down
const S = 96, BX = 32, BY = 40, NX = 16, NY = 20;
const IX0 = BX + S, IY0 = BY + S, IX1 = BX + NX * S - S, IY1 = BY + NY * S - S; // inside the tiles
// the picture
const PX = 152, PY = 160, PW = W - 2 * PX, PH = 1400, PB = PY + PH;
const SHORE = 1120; // where the peninsula meets the water

// lit windows, per layer, switched on together near the end
// A group's draw is run once at build time against a stub context, which only
// collects the windows it lights; draws must therefore be pure (no plate rng).
const LIGHTS = {};
let collecting = false;
let row = 0;
const OCC = [];
const light = (layer, x, y, w, h, arch = true) => { if (collecting) (LIGHTS[layer] ||= []).push([x, y, w, h, arch, row]); };
const occlude = (layer, x, y, w, h) => { if (collecting) OCC.push([layer, row, x, y, w, h]); };
const stub = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
function grp(p, layer, box, draw, o) {
  collecting = true; draw(stub, 1); collecting = false;
  return p.group(layer, box, draw, o);
}

function build() {
  for (const k in LIGHTS) delete LIGHTS[k];
  OCC.length = 0; row = 0;
  const p = new Plate({ paper: CREAM, seed: 1453 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PH };
  p.stack('sky', 'stars', 'clouds', 'hills', 'far', 'sule', 'minarets', 'mosques', 'blue', 'topkapi', 'slope',
    'galata', 'gtower', 'galata2', 'shore', 'water', 'glints', 'boats', 'kiz', 'quay', 'gulls', 'title', 'tiles');
  p.layer('title', { clip: false });
  p.layer('tiles', { clip: false });

  tiles(p, r);
  sky(p, r);
  hills(p, r);
  farCity(p, r);
  suleymaniye(p, r);
  hagiaSophia(p, r);
  blueMosque(p, r);
  topkapi(p, r);
  slope(p, r);
  galata(p, r);
  galataTower(p);
  shore(p, r);
  water(p, r);
  maidensTower(p, r);
  quay(p, r);
  lightsOn(p);
  life(p, r);
  title(p, r);
  return p;
}

// ================================================================ drawing helpers
function archPath(c, x, y, w, h) {
  const rr = w / 2;
  c.moveTo(x, y + h); c.lineTo(x, y + rr); c.arc(x + rr, y + rr, rr, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
}

// the finial on a dome or minaret: a rod, two balls and a crescent
function alem(c, x, y, h, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1, h * 0.07);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.78); c.stroke();
  c.beginPath(); c.arc(x, y - h * 0.3, h * 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x, y - h * 0.52, h * 0.08, 0, Math.PI * 2); c.fill();
  const cr = h * 0.17, cy = y - h * 0.8;
  c.beginPath(); c.arc(x, cy, cr, Math.PI * 0.15, Math.PI * 0.85, true); c.arc(x, cy - cr * 0.35, cr * 0.82, Math.PI * 0.85, Math.PI * 0.15, false); c.fill();
}

// a lead dome: a half ellipse, lit along its rim by the afterglow behind it
function dome(c, cx, by, rx, ry, o = {}) {
  const col = o.col || LEAD, lit = o.lit || LEAD_LIT;
  c.beginPath(); c.ellipse(cx, by, rx, ry, 0, Math.PI, Math.PI * 2); c.closePath();
  const g = c.createLinearGradient(0, by - ry, 0, by);
  g.addColorStop(0, lit); g.addColorStop(0.45, col); g.addColorStop(1, mix(col, INK, 0.35));
  c.fillStyle = g; c.fill();
  // the lead sheets: meridians running to the crown
  if (o.ribs !== 0) {
    c.save(); c.beginPath(); c.ellipse(cx, by, rx, ry, 0, Math.PI, Math.PI * 2); c.closePath(); c.clip();
    c.strokeStyle = o.rib || 'rgba(26,17,48,.35)'; c.lineWidth = Math.max(0.5, rx * 0.012);
    c.beginPath();
    const n = o.ribs || 7;
    for (let k = -n; k <= n; k++) {
      const s = Math.sin((k / (n + 1)) * Math.PI / 2);
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI / 2;
        const x = cx + rx * s * Math.cos(a), y = by - ry * Math.sin(a);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
    }
    c.stroke(); c.restore();
  }
  // rim light
  c.strokeStyle = o.rim || 'rgba(255,196,150,.75)'; c.lineWidth = Math.max(1, rx * 0.035);
  c.beginPath(); c.ellipse(cx, by, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  if (o.alem !== false) alem(c, cx, by - ry + 1, o.alemH || ry * 0.55, o.alemCol || '#d9b77a');
}

// a pencil minaret: base, fluted shaft, balconies, a lead cone and its finial
function minaret(c, x, g, top, w, n, o = {}) {
  const col = o.col || STONE;
  const capH = w * 3.6, capB = top + capH;
  // the plinth
  c.fillStyle = mix(col, INK, 0.15);
  c.fillRect(x - w * 0.72, g - (g - top) * 0.12, w * 1.44, (g - top) * 0.12);
  // the shaft, lit on its left
  const gr = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, mix(col, '#c59aa8', 0.35)); gr.addColorStop(0.45, col); gr.addColorStop(1, mix(col, INK, 0.4));
  c.fillStyle = gr; c.fillRect(x - w / 2, capB, w, g - capB);
  // flutes
  c.strokeStyle = 'rgba(26,17,48,.28)'; c.lineWidth = 0.6;
  c.beginPath(); for (const f of [-0.2, 0.15]) { c.moveTo(x + f * w, capB); c.lineTo(x + f * w, g - (g - top) * 0.12); } c.stroke();
  // the balconies (şerefe), spaced down from the cap
  const span = g - capB;
  const step = o.step || span * 0.16;
  for (let i = 0; i < n; i++) {
    const yb = capB + w * 1.5 + i * step;
    c.fillStyle = mix(col, INK, 0.25);
    poly(c, [[x - w / 2, yb + w * 1.1], [x + w / 2, yb + w * 1.1], [x + w * 0.85, yb], [x - w * 0.85, yb]]); c.fill();
    c.fillStyle = mix(col, '#c59aa8', 0.15); c.fillRect(x - w * 0.88, yb - w * 0.5, w * 1.76, w * 0.5);
    c.strokeStyle = 'rgba(26,17,48,.55)'; c.lineWidth = 0.6; c.strokeRect(x - w * 0.88, yb - w * 0.5, w * 1.76, w * 0.5);
    if (o.lights !== false) light(o.layer || 'minarets', x - w * 0.8, yb - w * 0.32, w * 1.6, Math.max(1, w * 0.14), false);
  }
  // the cone
  const cg = c.createLinearGradient(x - w * 0.6, 0, x + w * 0.6, 0);
  cg.addColorStop(0, o.capLit || '#a593b3'); cg.addColorStop(0.5, LEAD); cg.addColorStop(1, mix(LEAD, INK, 0.4));
  c.fillStyle = cg; poly(c, [[x - w * 0.6, capB], [x, top], [x + w * 0.6, capB]]); c.fill();
  c.fillStyle = mix(col, INK, 0.3); c.fillRect(x - w * 0.62, capB - 1, w * 1.24, Math.max(1.5, w * 0.18));
  alem(c, x, top + 1, w * 1.5, '#d9b77a');
}
const minaretBox = (x, g, top, w) => ({ x: x - w * 1.2, y: top - w * 1.6, w: w * 2.4, h: g - top + w * 1.6 + 2 });

// ================================================================ the Iznik border
// One tile, in its own frame: u runs along the border, v inward. A vine waves
// through every tile, so the border reads as one running scroll.
function tile(c, rr, mirror) {
  c.fillStyle = SLIP; c.fillRect(0, 0, S, S);
  // a faint glaze pooling
  c.fillStyle = 'rgba(31,63,143,.04)'; c.fillRect(0, 0, S, S * 0.5);
  if (mirror) { c.translate(S, 0); c.scale(-1, 1); }
  const vine = (u) => S / 2 + 15 * Math.sin((u / S) * Math.PI * 2);
  // saz leaves first, so the flowers sit over them
  saz(c, [S * 0.45, vine(S * 0.45)], [S * 0.02, S * 0.86], 13, 7.5, TURQ);
  saz(c, [S * 0.56, vine(S * 0.56)], [S * 0.98, S * 0.13], -13, 7, GREEN);
  // the vine
  c.strokeStyle = COBALT; c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath(); for (let u = 0; u <= S; u += 4) u ? c.lineTo(u, vine(u)) : c.moveTo(u, vine(u)); c.stroke();
  // a carnation leaning out, a tulip leaning in
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(S * 0.25, vine(S * 0.25)); c.quadraticCurveTo(S * 0.22, S * 0.5, S * 0.25, S * 0.42); c.stroke();
  carnation(c, S * 0.25, S * 0.43, 1, -Math.PI / 2);
  c.beginPath(); c.moveTo(S * 0.75, vine(S * 0.75)); c.quadraticCurveTo(S * 0.79, S * 0.48, S * 0.75, S * 0.56); c.stroke();
  tulip(c, S * 0.75, S * 0.55, 1, Math.PI / 2, rr() < 0.5 ? RED : COBALT);
  // buds and rosettes in the gaps
  bud(c, S * 0.08, S * 0.2, 0.9);
  rosette(c, S * 0.58, S * 0.84, 5, RED);
  rosette(c, S * 0.94, S * 0.6, 3.6, COBALT);
  c.fillStyle = COBALT;
  for (const [u, v] of [[S * 0.4, S * 0.14], [S * 0.1, S * 0.62], [S * 0.9, S * 0.88]]) { c.beginPath(); c.arc(u, v, 1.6, 0, Math.PI * 2); c.fill(); }
}

// a serrated saz leaf from a to b, bent to one side
function saz(c, a, b, bend, wd, col) {
  const [x0, y0] = a, [x1, y1] = b;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend;
  const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1];
  const left = [], right = [], N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N, [x, y] = at(t), [xa, ya] = at(Math.min(1, t + 0.01)), [xb, yb] = at(Math.max(0, t - 0.01));
    const tx = xa - xb, ty = ya - yb, tl = Math.hypot(tx, ty) || 1, px = -ty / tl, py = tx / tl;
    const wv = wd * Math.sin(Math.PI * t) ** 0.75;
    const saw = i % 2 ? 1 : 0.62; // the serrations on the outer edge
    left.push([x + px * wv * saw, y + py * wv * saw]);
    right.push([x - px * wv * 0.85, y - py * wv * 0.85]);
  }
  const pts = [...left, ...right.reverse()];
  c.fillStyle = col; poly(c, pts); c.fill();
  c.strokeStyle = TILE_INK; c.lineWidth = 0.9; c.lineJoin = 'round'; poly(c, pts); c.stroke();
  // a red vein down the middle, as on the best Iznik leaves
  c.strokeStyle = col === GREEN ? RED : COBALT; c.lineWidth = 1.3;
  c.beginPath(); for (let i = 2; i <= N - 2; i++) { const [x, y] = at(i / N); i > 2 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
}

// a carnation: a fan of serrated red petals over a green calyx
function carnation(c, x, y, s, ang) {
  c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(s, s);
  c.fillStyle = GREEN; poly(c, [[-4, 0], [4, 0], [7, -9], [-7, -9]]); c.fill();
  c.strokeStyle = TILE_INK; c.lineWidth = 0.8; c.stroke();
  const pts = [[-7, -9]];
  for (let i = 0; i <= 12; i++) {
    const a = lerp(-Math.PI * 0.92, -Math.PI * 0.08, i / 12), rad = i % 2 ? 15 : 20;
    pts.push([Math.cos(a) * rad, -9 + Math.sin(a) * rad * 0.95]);
  }
  pts.push([7, -9]);
  c.fillStyle = RED; poly(c, pts); c.fill(); c.stroke();
  c.strokeStyle = SLIP; c.lineWidth = 1;
  c.beginPath(); for (const a of [-2.3, -1.57, -0.84]) { c.moveTo(0, -10); c.lineTo(Math.cos(a) * 14, -9 + Math.sin(a) * 14); } c.stroke();
  c.restore();
}

// an Ottoman tulip: slim, with three needle points
function tulip(c, x, y, s, ang, col) {
  c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(s, s);
  c.beginPath();
  c.moveTo(0, -2);
  c.bezierCurveTo(-11, -6, -10, -18, -8, -30);
  c.quadraticCurveTo(-5, -22, -3, -21);
  c.quadraticCurveTo(-1, -30, 0, -35);
  c.quadraticCurveTo(1, -30, 3, -21);
  c.quadraticCurveTo(5, -22, 8, -30);
  c.bezierCurveTo(10, -18, 11, -6, 0, -2);
  c.fillStyle = col; c.fill();
  c.strokeStyle = TILE_INK; c.lineWidth = 0.8; c.stroke();
  c.fillStyle = col === RED ? COBALT : RED;
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(-4, -14, 0, -24); c.quadraticCurveTo(4, -14, 0, -6); c.fill();
  c.restore();
}

function bud(c, x, y, s) {
  c.fillStyle = TURQ; c.strokeStyle = TILE_INK; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(x, y, 4.5 * s, 7 * s, 0.5, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = RED; c.beginPath(); c.ellipse(x + 0.6, y - 1, 2 * s, 3.4 * s, 0.5, 0, Math.PI * 2); c.fill();
}

function rosette(c, x, y, rad, col) {
  c.fillStyle = col; c.strokeStyle = TILE_INK; c.lineWidth = 0.7;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    c.beginPath(); c.arc(x + Math.cos(a) * rad * 0.75, y + Math.sin(a) * rad * 0.75, rad * 0.5, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  c.fillStyle = col === RED ? COBALT : RED; c.beginPath(); c.arc(x, y, rad * 0.4, 0, Math.PI * 2); c.fill();
}

// the corner tile: a medallion on cobalt
function cornerTile(c) {
  c.fillStyle = COBALT; c.fillRect(0, 0, S, S);
  c.strokeStyle = SLIP; c.lineWidth = 2; c.strokeRect(5, 5, S - 10, S - 10);
  const m = S / 2;
  c.fillStyle = TURQ; c.beginPath(); c.arc(m, m, 34, 0, Math.PI * 2); c.fill();
  c.strokeStyle = TILE_INK; c.lineWidth = 1; c.stroke();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.save(); c.translate(m, m); c.rotate(a);
    c.fillStyle = SLIP; c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(-11, -18, 0, -31); c.quadraticCurveTo(11, -18, 0, -4); c.fill();
    c.strokeStyle = TILE_INK; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = RED; c.beginPath(); c.moveTo(0, -10); c.quadraticCurveTo(-4, -18, 0, -25); c.quadraticCurveTo(4, -18, 0, -10); c.fill();
    c.restore();
  }
  c.fillStyle = RED; c.beginPath(); c.arc(m, m, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = SLIP; c.beginPath(); c.arc(m, m, 2.6, 0, Math.PI * 2); c.fill();
  // three-ball çintamani in the corners
  c.fillStyle = SLIP;
  for (const [u, v] of [[14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14]]) {
    for (const [a, b] of [[-3, 2], [3, 2], [0, -3]]) { c.beginPath(); c.arc(u + a, v + b, 2.2, 0, Math.PI * 2); c.fill(); }
  }
}

function tiles(p, r) {
  // the order the tiles are set: clockwise from the top left
  const list = [];
  for (let i = 0; i < NX; i++) list.push({ x: BX + i * S, y: BY, rot: 0 });
  for (let j = 1; j < NY; j++) list.push({ x: BX + (NX - 1) * S, y: BY + j * S, rot: 1 });
  for (let i = NX - 2; i >= 0; i--) list.push({ x: BX + i * S, y: BY + (NY - 1) * S, rot: 2 });
  for (let j = NY - 2; j >= 1; j--) list.push({ x: BX, y: BY + j * S, rot: 3 });
  const corner = (t) => (t.x === BX || t.x === BX + (NX - 1) * S) && (t.y === BY || t.y === BY + (NY - 1) * S);
  list.forEach((t, i) => {
    const seed = 900 + i, mirror = i % 2 === 1;
    p.group('tiles', { x: t.x, y: t.y, w: S, h: S }, (c) => {
      c.save(); c.translate(t.x, t.y);
      if (corner(t)) cornerTile(c);
      else {
        // turn the tile so its v always points into the picture
        c.translate(S / 2, S / 2); c.rotate((t.rot * Math.PI) / 2); c.translate(-S / 2, -S / 2);
        tile(c, rng(seed), mirror);
      }
      c.restore();
      c.strokeStyle = 'rgba(27,35,71,.55)'; c.lineWidth = 1; c.strokeRect(t.x + 0.5, t.y + 0.5, S - 1, S - 1);
    }, { t: 0.1 + i * 0.03, d: 0.5, reveal: 'pop' });
  });
  // the guard band inside the tiles: red, slip with cobalt lozenges, cobalt
  const gw = 18;
  const sides = [
    { x: IX0, y: IY0, w: IX1 - IX0, h: gw, rev: 'wipe' },
    { x: IX1 - gw, y: IY0, w: gw, h: IY1 - IY0, rev: 'fall' },
    { x: IX0, y: IY1 - gw, w: IX1 - IX0, h: gw, rev: 'wipeL' },
    { x: IX0, y: IY0, w: gw, h: IY1 - IY0, rev: 'rise' },
  ];
  sides.forEach((b, i) => {
    p.group('tiles', { x: b.x, y: b.y, w: b.w, h: b.h }, (c) => {
      c.fillStyle = COBALT; c.fillRect(b.x, b.y, b.w, b.h);
      const horiz = b.w > b.h;
      c.fillStyle = SLIP;
      if (horiz) c.fillRect(b.x, b.y + 4, b.w, b.h - 8); else c.fillRect(b.x + 4, b.y, b.w - 8, b.h);
      c.fillStyle = RED;
      if (horiz) c.fillRect(b.x, b.y + (i === 0 ? 0 : b.h - 3), b.w, 3); else c.fillRect(b.x + (i === 3 ? 0 : b.w - 3), b.y, 3, b.h);
      // lozenges and dots
      const n = Math.round((horiz ? b.w : b.h) / 24);
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n;
        const x = horiz ? b.x + f * b.w : b.x + b.w / 2, y = horiz ? b.y + b.h / 2 : b.y + f * b.h;
        c.fillStyle = k % 2 ? RED : COBALT;
        poly(c, [[x, y - 5], [x + 5, y], [x, y + 5], [x - 5, y]]); c.fill();
        c.fillStyle = TURQ;
        const ox = horiz ? 12 : 0, oy = horiz ? 0 : 12;
        c.beginPath(); c.arc(x + ox, y + oy, 1.8, 0, Math.PI * 2); c.fill();
      }
    }, { t: 2.0 + i * 0.3, d: 1.2, reveal: b.rev, ease: 'inOut' });
  });
}

// ================================================================ sky
function sky(p, r) {
  const hy = 1110;
  p.group('sky', { x: PX, y: PY, w: PW, h: PH }, (c) => {
    const g = c.createLinearGradient(0, PY, 0, hy);
    g.addColorStop(0, PLUM); g.addColorStop(0.28, VIOLET); g.addColorStop(0.55, MAUVE);
    g.addColorStop(0.75, ROSE); g.addColorStop(0.9, CORAL); g.addColorStop(1, GOLD);
    c.fillStyle = g; c.fillRect(PX, PY, PW, SHORE - PY + 2);
  }, { t: 0.3, d: 2.0, reveal: 'fall', ease: 'inOut' });
  // the afterglow where the sun went down, behind the peninsula
  p.group('sky', { x: PX, y: 500, w: PW, h: 700 }, (c) => {
    const g = c.createRadialGradient(760, 1110, 10, 760, 1110, 620);
    g.addColorStop(0, 'rgba(255,232,170,.95)'); g.addColorStop(0.25, 'rgba(255,196,130,.55)'); g.addColorStop(1, 'rgba(255,160,120,0)');
    c.fillStyle = g; c.fillRect(PX, 500, PW, 700);
  }, { t: 1.3, d: 1.6, reveal: 'fade' });
  // stars in the plum at the top
  const stars = [];
  for (let i = 0; i < 70; i++) stars.push([PX + r() * PW, PY + 10 + r() ** 1.7 * 420, 0.6 + r() * 1.5]);
  p.group('stars', { x: PX, y: PY, w: PW, h: 480 }, (c) => {
    for (const [x, y, s] of stars) { c.fillStyle = `rgba(255,240,225,${0.35 + 0.5 * (1 - (y - PY) / 480)})`; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.7, d: 1.4, reveal: 'fade' });
  // the crescent: its lit limb faces the glow
  const mx = 430, my = 340, R = 40;
  const dx = 760 - mx, dy = 1110 - my, dl = Math.hypot(dx, dy);
  const sx = mx - (dx / dl) * R * 0.42, sy = my - (dy / dl) * R * 0.42;
  p.group('stars', { x: mx - 130, y: my - 130, w: 260, h: 260 }, (c) => {
    const halo = c.createRadialGradient(mx, my, R * 0.8, mx, my, 125);
    halo.addColorStop(0, 'rgba(255,230,190,.22)'); halo.addColorStop(1, 'rgba(255,230,190,0)');
    c.fillStyle = halo; c.fillRect(mx - 130, my - 130, 260, 260);
    c.fillStyle = 'rgba(255,240,220,.1)'; c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.clip();
    c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.arc(sx, sy, R * 0.97, 0, Math.PI * 2);
    c.fillStyle = '#fbefcf'; c.fill('evenodd');
    c.restore();
  }, { t: 2.0, d: 1.4, reveal: 'iris', ease: 'inOut' });
  // the evening star, near the moon
  p.group('stars', { x: 540, y: 400, w: 30, h: 30 }, (c) => {
    c.fillStyle = 'rgba(255,245,225,.95)'; c.beginPath(); c.arc(555, 415, 2.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,245,225,.5)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(547, 415); c.lineTo(563, 415); c.moveTo(555, 407); c.lineTo(555, 423); c.stroke();
  }, { t: 3.4, d: 0.6, reveal: 'pop' });

  // long thin clouds, lit from below by the sun already gone
  const streaks = [
    [960, 470, 440, 20], [180, 560, 360, 16], [700, 560, 560, 26], [1080, 650, 330, 15],
    [260, 700, 520, 22], [820, 790, 470, 18], [170, 850, 330, 12], [560, 905, 640, 14], [1120, 900, 300, 12],
  ];
  streaks.forEach(([x, y, w, h], i) => {
    const pts = [];
    const n = 28, rr = rng(40 + i);
    for (let k = 0; k <= n; k++) { const f = k / n; pts.push([x + f * w, y - h * Math.sin(Math.PI * f) ** 0.6 * (0.7 + 0.3 * Math.sin(f * 9 + i)) - rr() * 2]); }
    for (let k = n; k >= 0; k--) { const f = k / n; pts.push([x + f * w + 20 * Math.sin(Math.PI * f), y + h * 0.35 * Math.sin(Math.PI * f)]); }
    const low = clamp((y - 450) / 460);
    p.group('clouds', boxOf(pts, 6), (c) => {
      const g = c.createLinearGradient(0, y - h, 0, y + h * 0.4);
      g.addColorStop(0, mix(mix(VIOLET, MAUVE, low), PLUM, 0.15)); g.addColorStop(0.65, mix(MAUVE, ROSE, low)); g.addColorStop(1, mix(CORAL, HAZE, low));
      c.fillStyle = g; poly(c, pts); c.fill();
      // bright lines along the underside
      c.save(); poly(c, pts); c.clip();
      c.strokeStyle = `rgba(255,214,160,${0.35 + 0.4 * low})`; c.lineWidth = 1;
      c.beginPath();
      for (let k = 0; k < 3; k++) { const yy = y + h * 0.3 - k * 3.5; c.moveTo(x + 20 + k * 30, yy); c.lineTo(x + w - 20 - k * 30, yy); }
      c.stroke(); c.restore();
    }, { t: 2.4 + i * 0.16, d: 1.3, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the far land
function hills(p, r) {
  const pts = [[PX, 1060]];
  for (let x = PX; x <= PX + PW; x += 12) pts.push([x, 1040 - 22 * Math.sin((x - PX) * 0.004 + 0.6) - 9 * Math.sin(x * 0.017) - 30 * smooth(1100, 1450, x)]);
  pts.push([PX + PW, 1130], [PX, 1130]);
  p.group('hills', boxOf(pts, 4), (c) => {
    const g = c.createLinearGradient(0, 980, 0, 1100);
    g.addColorStop(0, mix(HILL, ROSE, 0.35)); g.addColorStop(1, mix(HILL, GOLD, 0.25));
    c.fillStyle = g; poly(c, pts); c.fill();
    // a far town as a scatter of tiny lights
    const rr = rng(8);
    c.fillStyle = 'rgba(255,220,150,.55)';
    for (let i = 0; i < 120; i++) { const x = PX + rr() * PW, y = 1030 + rr() * 60; c.fillRect(x, y, 1.6, 1.6); }
  }, { t: 3.0, d: 1.2, reveal: 'rise' });
}

// the far peninsula: a running roofline with small mosques, cypresses and windows
function farCity(p, r) {
  const segs = [];
  let x = PX - 10;
  while (x < 1160) {
    const kind = r();
    if (kind < 0.07) { segs.push({ k: 'mosque', x, w: r.range(50, 80), h: r.range(26, 40) }); x += segs.at(-1).w + 8; continue; }
    if (kind < 0.2) { segs.push({ k: 'cypress', x, h: r.range(30, 60) }); x += r.range(6, 12); continue; }
    const w = r.range(14, 34);
    segs.push({ k: 'house', x, w, h: r.range(14, 36) }); x += w - r.range(0, 3);
  }
  const base = 1080;
  const ground = (xx) => base - 26 * Math.sin((xx - PX) / 1000 * Math.PI) - 10;
  const chunks = 3, per = Math.ceil(segs.length / chunks);
  for (let k = 0; k < chunks; k++) {
    const part = segs.slice(k * per, (k + 1) * per);
    const x0 = part[0].x - 20, x1 = part.at(-1).x + 100;
    grp(p, 'far', { x: x0, y: 880, w: x1 - x0, h: 260 }, (c) => {
      const rr = rng(50 + k);
      for (const s of part) {
        const gy = ground(s.x);
        c.fillStyle = FAR; c.strokeStyle = 'rgba(255,200,160,.45)'; c.lineWidth = 0.8;
        if (s.k === 'house') {
          c.fillRect(s.x, gy - s.h, s.w, s.h + 60);
          poly(c, [[s.x - 2, gy - s.h], [s.x + s.w / 2, gy - s.h - s.w * 0.28], [s.x + s.w + 2, gy - s.h]]); c.fill();
          c.beginPath(); c.moveTo(s.x - 2, gy - s.h); c.lineTo(s.x + s.w / 2, gy - s.h - s.w * 0.28); c.lineTo(s.x + s.w + 2, gy - s.h); c.stroke();
        } else if (s.k === 'cypress') {
          c.beginPath(); c.moveTo(s.x - 4, gy + 2); c.quadraticCurveTo(s.x - 5, gy - s.h * 0.6, s.x, gy - s.h); c.quadraticCurveTo(s.x + 5, gy - s.h * 0.6, s.x + 4, gy + 2); c.fill();
        } else {
          // a neighborhood mosque: a block, one dome, one minaret
          c.fillRect(s.x, gy - s.h, s.w, s.h + 60);
          dome(c, s.x + s.w / 2, gy - s.h, s.w * 0.36, s.w * 0.32, { col: FAR, lit: mix(FAR, ROSE, 0.6), ribs: 0, alemH: 10, rim: 'rgba(255,200,160,.6)' });
          const mx = s.x + s.w + 4;
          c.fillStyle = FAR; c.fillRect(mx - 2.5, gy - s.h - 70, 5, s.h + 70);
          poly(c, [[mx - 3, gy - s.h - 70], [mx, gy - s.h - 88], [mx + 3, gy - s.h - 70]]); c.fill();
          c.fillRect(mx - 4.5, gy - s.h - 50, 9, 3);
        }
        if (s.k !== 'cypress' && s.w > 18) for (let yy = gy - s.h + 6; yy < gy - 4; yy += 9) if (rr() < 0.35) light('far', s.x + 4 + rr() * (s.w - 10), yy, 2.2, 3, false);
      }
    }, { t: 3.3 + k * 0.3, d: 1.1, reveal: 'rise' });
  }
}

// ================================================================ Süleymaniye, on the third hill, further away
function suleymaniye(p, r) {
  const cx = 1040, g = 1050;
  const col = SULE, lead = mix(LEAD, SULE, 0.55), lit = mix(LEAD_LIT, ROSE, 0.35);
  grp(p, 'sule', { x: cx - 120, y: 850, w: 240, h: g - 850 + 40 }, (c) => {
    c.fillStyle = col;
    c.fillRect(cx - 100, g - 50, 200, 90);
    c.fillRect(cx - 80, g - 78, 160, 30);
    // the buttress turrets and the cascade of half domes
    for (const s of [-1, 1]) {
      c.fillStyle = col; c.fillRect(cx + s * 56 - 6, g - 118, 12, 40);
      dome(c, cx + s * 56, g - 118, 8, 8, { col: lead, lit, ribs: 0, alemH: 8 });
      dome(c, cx + s * 74, g - 74, 18, 14, { col: lead, lit, ribs: 4, alemH: 8 });
      dome(c, cx + s * 40, g - 84, 26, 22, { col: lead, lit, ribs: 4, alem: false });
    }
    // the drum and the great dome
    c.fillStyle = col; c.fillRect(cx - 46, g - 112, 92, 22);
    dome(c, cx, g - 110, 52, 48, { col: lead, lit, ribs: 6, alemH: 18 });
    dome(c, cx, g - 80, 30, 18, { col: lead, lit, ribs: 4, alem: false });
    for (let k = 0; k < 9; k++) light('sule', cx - 40 + k * 9.2, g - 106, 4, 8);
    for (let k = 0; k < 12; k++) light('sule', cx - 92 + k * 15.6, g - 40, 5, 10);
  }, { t: 3.9, d: 1.3, reveal: 'rise', ease: 'inOut' });
  const mins = [[cx - 62, 778, 9, 3], [cx + 62, 778, 9, 3], [cx - 94, 830, 8, 2], [cx + 94, 830, 8, 2]];
  mins.forEach(([x, top, w, n], i) => {
    grp(p, 'sule', minaretBox(x, g, top, w), (c) => minaret(c, x, g, top, w, n, { col, layer: 'sule', capLit: lit }),
      { t: 4.4 + i * 0.18, d: 0.9, reveal: 'rise', ease: 'inOut' });
  });
}

// ================================================================ Hagia Sophia
function hagiaSophia(p, r) {
  const cx = 742, g = 1062;
  const body = SOPHIA, bodyL = mix(SOPHIA, ROSE, 0.42), bodyD = mix(SOPHIA, INK, 0.35);
  // four mismatched minarets, one balcony each: the red brick one, a stout stone
  // one, and two slender ones on the far side
  const mins = [
    [cx - 108, 686, 10, 1, STONE], [cx + 112, 690, 10, 1, STONE],
    [cx - 150, 716, 16, 1, '#6a3434'], [cx + 152, 728, 15, 1, mix(STONE, '#8e7e90', 0.3)],
  ];
  mins.forEach(([x, top, w, n, col], i) => {
    grp(p, 'minarets', minaretBox(x, g, top, w), (c) => minaret(c, x, g, top, w, n, { col, step: 0 }),
      { t: 5.5 + i * 0.2, d: 1.0, reveal: 'rise', ease: 'inOut' });
  });
  // the walls and the great buttresses
  grp(p, 'mosques', { x: cx - 140, y: g - 175, w: 280, h: 230 }, (c) => {
    c.fillStyle = body; c.fillRect(cx - 120, g - 96, 240, 140);
    // the tympanum with its rows of windows
    c.fillStyle = mix(body, ROSE, 0.12); c.fillRect(cx - 88, g - 150, 176, 56);
    c.strokeStyle = 'rgba(26,17,48,.45)'; c.lineWidth = 1; c.strokeRect(cx - 88, g - 150, 176, 56);
    for (let row = 0; row < 2; row++) for (let k = 0; k < 7; k++) {
      const wx = cx - 76 + k * 22, wy = g - 144 + row * 24;
      c.fillStyle = bodyD; c.beginPath(); archPath(c, wx, wy, 9, 16); c.fill();
      if ((k + row) % 2 === 0) light('mosques', wx + 1.5, wy + 2, 6, 13);
    }
    // the great buttress piers, rising nearly to the dome, their tops sloped
    for (const s of [-1, 1]) {
      const x0 = cx + s * 124;
      const pier = [[x0, g + 40], [x0, g - 136], [x0 - s * 12, g - 170], [x0 - s * 40, g - 170], [x0 - s * 40, g + 40]];
      c.fillStyle = s < 0 ? bodyL : bodyD; poly(c, pier); c.fill();
      c.strokeStyle = 'rgba(26,17,48,.45)'; c.lineWidth = 1; poly(c, pier); c.stroke();
      c.strokeStyle = 'rgba(255,196,150,.55)'; c.beginPath(); c.moveTo(x0, g - 136); c.lineTo(x0 - s * 12, g - 170); c.lineTo(x0 - s * 40, g - 170); c.stroke();
      c.fillStyle = 'rgba(26,17,48,.5)';
      for (const yy of [g - 150, g - 118, g - 86]) c.fillRect(x0 - s * 20 - 2, yy, 4, 12);
      // a lower stepped buttress outside it
      c.fillStyle = s < 0 ? body : bodyD; poly(c, [[x0 + s * 20, g + 40], [x0 + s * 20, g - 54], [x0, g - 80], [x0, g + 40]]); c.fill();
      c.strokeStyle = 'rgba(255,196,150,.4)'; c.beginPath(); c.moveTo(x0 + s * 20, g - 54); c.lineTo(x0, g - 80); c.stroke();
    }
    // the ground floor arcade
    for (let k = 0; k < 11; k++) {
      const wx = cx - 104 + k * 19.5;
      c.fillStyle = bodyD; c.beginPath(); archPath(c, wx, g - 70, 10, 22); c.fill();
      if (k % 3 !== 1) light('mosques', wx + 2, g - 67, 6, 18);
    }
    // a band of stone along the cornice
    c.fillStyle = mix(body, GOLD, 0.18); c.fillRect(cx - 120, g - 98, 240, 4);
  }, { t: 4.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the half domes and the great flat dome on its ring of forty windows
  grp(p, 'mosques', { x: cx - 112, y: g - 262, w: 224, h: 140 }, (c) => {
    c.fillStyle = mix(body, INK, 0.1); c.fillRect(cx - 96, g - 172, 192, 22);
    for (let k = 0; k < 20; k++) {
      const wx = cx - 92 + k * 9.4;
      c.fillStyle = mix(body, ROSE, 0.2); c.fillRect(wx, g - 172, 3.4, 22);
      light('mosques', wx + 4.2, g - 166, 3.6, 10, false);
    }
    dome(c, cx, g - 170, 98, 46, { col: mix(LEAD, SOPHIA, 0.25), ribs: 9, alemH: 26 });
  }, { t: 5.4, d: 1.0, reveal: 'drop', dy: 30 });
  grp(p, 'mosques', { x: cx - 110, y: g - 210, w: 220, h: 120 }, (c) => {
    for (const s of [-1, 1]) dome(c, cx + s * 64, g - 128, 30, 18, { col: mix(LEAD, SOPHIA, 0.2), ribs: 4, alem: false });
    dome(c, cx, g - 140, 70, 36, { col: mix(LEAD, SOPHIA, 0.2), ribs: 6, alem: false });
    c.fillStyle = body; c.fillRect(cx - 32, g - 104, 64, 30);
    dome(c, cx, g - 104, 34, 22, { col: mix(LEAD, SOPHIA, 0.2), ribs: 4, alem: false });
  }, { t: 5.8, d: 0.8, reveal: 'drop', dy: 20 });
}

// ================================================================ the Blue Mosque
function blueMosque(p, r) {
  const cx = 372, g = 1070;
  const col = STONE, lead = LEAD;
  // six pencil minarets: four with three balconies, two with two
  const mins = [
    [cx - 168, 698, 12, 3], [cx + 168, 698, 12, 3], [cx - 132, 716, 11, 3], [cx + 132, 716, 11, 3],
    [cx - 206, 760, 10, 2], [cx + 206, 760, 10, 2],
  ];
  mins.forEach(([x, top, w, n], i) => {
    grp(p, 'minarets', minaretBox(x, g, top, w), (c) => minaret(c, x, g, top, w, n, {}),
      { t: 6.4 + i * 0.16, d: 1.0, reveal: 'rise', ease: 'inOut' });
  });
  // the body: arcades, the prayer hall wall
  grp(p, 'blue', { x: cx - 190, y: g - 110, w: 380, h: 160 }, (c) => {
    c.fillStyle = col; c.fillRect(cx - 176, g - 60, 352, 110);
    c.fillStyle = mix(col, INK, 0.2); c.fillRect(cx - 176, g - 62, 352, 4);
    for (let k = 0; k < 16; k++) {
      const wx = cx - 168 + k * 21.6;
      c.fillStyle = mix(col, INK, 0.45); c.beginPath(); archPath(c, wx, g - 50, 12, 26); c.fill();
      if (k % 4 !== 2) light('blue', wx + 2.5, g - 47, 7, 22);
    }
    c.fillStyle = col; c.fillRect(cx - 150, g - 100, 300, 42);
    for (let k = 0; k < 10; k++) {
      const wx = cx - 136 + k * 28.5;
      c.fillStyle = mix(col, INK, 0.45); c.beginPath(); archPath(c, wx, g - 94, 10, 20); c.fill();
      if (k % 3 !== 1) light('blue', wx + 2, g - 91, 6, 16);
    }
  }, { t: 5.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the cascade of domes, from the crown down
  const lit = '#a896b8';
  grp(p, 'blue', { x: cx - 100, y: g - 260, w: 200, h: 110 }, (c) => {
    c.fillStyle = col; c.fillRect(cx - 72, g - 172, 144, 26);
    for (let k = 0; k < 14; k++) { const wx = cx - 66 + k * 9.6; c.fillStyle = mix(col, INK, 0.4); c.beginPath(); archPath(c, wx, g - 168, 5, 14); c.fill(); light('blue', wx + 1, g - 166, 3, 11); }
    dome(c, cx, g - 170, 74, 62, { col: lead, lit, ribs: 8, alemH: 30 });
  }, { t: 5.6, d: 0.9, reveal: 'drop', dy: 34 });
  grp(p, 'blue', { x: cx - 120, y: g - 215, w: 240, h: 110 }, (c) => {
    // the four weight turrets around the crown
    for (const s of [-1, 1]) {
      c.fillStyle = col; c.fillRect(cx + s * 82 - 8, g - 182, 16, 50);
      dome(c, cx + s * 82, g - 182, 10, 11, { col: lead, lit, ribs: 0, alemH: 12 });
    }
    // the half domes
    for (const s of [-1, 1]) dome(c, cx + s * 58, g - 122, 50, 38, { col: lead, lit, ribs: 5, alem: false });
    dome(c, cx, g - 124, 52, 30, { col: lead, lit, ribs: 5, alem: false });
  }, { t: 6.0, d: 0.8, reveal: 'drop', dy: 26 });
  grp(p, 'blue', { x: cx - 170, y: g - 150, w: 340, h: 60 }, (c) => {
    for (const s of [-1, 1]) {
      dome(c, cx + s * 104, g - 100, 26, 20, { col: lead, lit, ribs: 4, alem: false });
      dome(c, cx + s * 140, g - 100, 18, 16, { col: lead, lit, ribs: 3, alemH: 9 });
    }
    dome(c, cx, g - 100, 26, 16, { col: lead, lit, ribs: 4, alem: false });
  }, { t: 6.3, d: 0.7, reveal: 'drop', dy: 18 });
}

// ================================================================ Topkapı on Sarayburnu
function topkapi(p, r) {
  // the point of land under the palace, its trees, the kitchens' chimneys and
  // the Tower of Justice
  const ground = (x) => 1060 + 50 * smooth(900, 1150, x);
  const trees = [];
  for (let i = 0; i < 46; i++) {
    const x = r.range(890, 1150), y = ground(x) + r.range(4, 40);
    trees.push({ x, y, cyp: r.chance(0.55), h: r.range(26, 58) });
  }
  trees.sort((a, b) => a.y - b.y);
  grp(p, 'topkapi', { x: 870, y: 800, w: 300, h: 340 }, (c) => {
    const pts = [[880, 1130]];
    for (let x = 880; x <= 1160; x += 10) pts.push([x, ground(x) + 6]);
    pts.push([1160, 1130]);
    c.fillStyle = mix(NEAR, SULE, 0.45); poly(c, pts); c.fill();
    // the palace roofs, low and long
    c.fillStyle = mix(NEAR, SULE, 0.3);
    for (const [x, w, h] of [[905, 70, 22], [985, 120, 18], [1040, 70, 24]]) {
      const y = ground(x) - h;
      c.fillRect(x, y, w, h + 10);
      poly(c, [[x - 4, y], [x + w / 2, y - 10], [x + w + 4, y]]); c.fill();
      for (let k = 0; k < w / 10; k++) light('topkapi', x + 4 + k * 10, y + 6, 3, 6);
    }
    // the kitchens: a row of chimneys with small domes
    for (let k = 0; k < 9; k++) {
      const x = 990 + k * 12, y = ground(x) - 20;
      c.fillStyle = mix(NEAR, SULE, 0.35); c.fillRect(x - 3, y - 16, 6, 16);
      dome(c, x, y - 16, 5, 5, { col: LEAD, lit: LEAD_LIT, ribs: 0, alem: false, rim: 'rgba(255,196,150,.5)' });
    }
    // the Tower of Justice: a plain shaft, a windowed lantern and a tall spire
    const tx = 935, ty = ground(tx) - 18;
    c.fillStyle = mix(NEAR, SULE, 0.5); c.fillRect(tx - 11, ty - 120, 22, 120);
    c.fillStyle = mix(NEAR, SULE, 0.65); c.fillRect(tx - 14, ty - 150, 28, 32);
    for (let k = 0; k < 3; k++) light('topkapi', tx - 11 + k * 8.4, ty - 146, 4.5, 16);
    c.fillStyle = mix(NEAR, SULE, 0.3); c.fillRect(tx - 16, ty - 154, 32, 5);
    const cg = c.createLinearGradient(tx - 15, 0, tx + 15, 0);
    cg.addColorStop(0, LEAD_LIT); cg.addColorStop(1, LEAD);
    c.fillStyle = cg; poly(c, [[tx - 15, ty - 154], [tx, ty - 205], [tx + 15, ty - 154]]); c.fill();
    alem(c, tx, ty - 204, 18, '#d9b77a');
    // the trees of the palace gardens and Gülhane
    for (const t of trees) {
      c.fillStyle = mix(NEAR, '#3e5a52', t.cyp ? 0.2 : 0.35);
      if (t.cyp) { c.beginPath(); c.moveTo(t.x - 5, t.y); c.quadraticCurveTo(t.x - 7, t.y - t.h * 0.55, t.x, t.y - t.h); c.quadraticCurveTo(t.x + 7, t.y - t.h * 0.55, t.x + 5, t.y); c.fill(); }
      else { for (const [a, b, rr] of [[-6, -10, 9], [6, -12, 10], [0, -20, 10]]) { c.beginPath(); c.arc(t.x + a, t.y + b, rr * t.h / 40, 0, Math.PI * 2); c.fill(); } }
    }
    // the sea walls along the point
    c.fillStyle = mix(NEAR, SULE, 0.25);
    c.fillRect(880, 1108, 280, 14);
    for (let x = 890; x < 1160; x += 46) c.fillRect(x, 1098, 14, 24);
  }, { t: 6.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the slope below the mosques
function slope(p, r) {
  const rows = 4;
  for (let k = 0; k < rows; k++) {
    const y = lerp(1068, 1116, k / (rows - 1));
    const tone = mix(SULE, NEAR, 0.35 + k * 0.2);
    const items = [];
    for (let x = PX - 10 + r() * 20; x < 890;) {
      if (r.chance(0.16)) { items.push({ k: 'tree', x, h: r.range(20, 40), cyp: r.chance(0.6) }); x += r.range(8, 16); continue; }
      const w = r.range(18, 42), h = r.range(18, 36) * (1 + k * 0.12);
      items.push({ k: 'house', x, w, h, bay: r.chance(0.35) });
      x += w + r.range(-2, 4);
    }
    row = k;
    grp(p, 'slope', { x: PX - 20, y: y - 90, w: 900, h: 120 }, (c) => {
      const rr = rng(60 + k);
      for (const it of items) {
        c.fillStyle = tone;
        if (it.k === 'tree') {
          if (it.cyp) { c.beginPath(); c.moveTo(it.x - 5, y + 4); c.quadraticCurveTo(it.x - 6, y - it.h * 0.6, it.x, y - it.h); c.quadraticCurveTo(it.x + 6, y - it.h * 0.6, it.x + 5, y + 4); c.fill(); }
          else { c.beginPath(); c.arc(it.x, y - it.h * 0.5, it.h * 0.42, 0, Math.PI * 2); c.fill(); }
          continue;
        }
        // a wooden house with a hipped roof and a bay window (cumba)
        c.fillRect(it.x, y - it.h, it.w, it.h + 20); occlude('slope', it.x - 3, y - it.h - 9, it.w + 6, it.h + 30);
        c.fillStyle = mix(tone, INK, 0.25);
        poly(c, [[it.x - 3, y - it.h], [it.x + it.w * 0.25, y - it.h - 9], [it.x + it.w * 0.75, y - it.h - 9], [it.x + it.w + 3, y - it.h]]); c.fill();
        c.strokeStyle = 'rgba(255,190,150,.35)'; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(it.x - 3, y - it.h); c.lineTo(it.x + it.w * 0.25, y - it.h - 9); c.lineTo(it.x + it.w * 0.75, y - it.h - 9); c.stroke();
        if (it.bay) { c.fillStyle = mix(tone, ROSE, 0.1); c.fillRect(it.x + it.w * 0.25, y - it.h * 0.85, it.w * 0.5, it.h * 0.4); }
        for (let yy = y - it.h + 5; yy < y - 6; yy += 10) for (let xx = it.x + 4; xx < it.x + it.w - 5; xx += 8) {
          if (rr() < 0.32) light('slope', xx, yy, 3.4, 5, false);
          else { c.fillStyle = mix(tone, INK, 0.4); c.fillRect(xx, yy, 3.4, 5); }
        }
      }
    }, { t: 6.6 + k * 0.25, d: 0.9, reveal: 'rise' });
  }
}

// ================================================================ Galata
const galataY = (x) => SHORE - 190 * smooth(1165, 1350, x) - 10 * smooth(1350, 1460, x);
function galata(p, r) {
  // houses climbing the hill in rows, the nearer ones lower and darker
  const rows = 7;
  for (let k = 0; k < rows; k++) {
    const f = k / (rows - 1);
    const tone = mix(mix(SULE, ROSE, 0.15), NEAR, f * 0.75);
    const items = [];
    for (let x = 1160 + r() * 10; x < PX + PW + 20;) {
      const w = r.range(16, 34), h = r.range(26, 60) * (0.7 + f * 0.5);
      items.push({ x, w, h, roof: r.pick(['hip', 'flat', 'flat', 'gable']) });
      x += w + r.range(-3, 3);
    }
    const layer = k < 2 ? 'galata' : 'galata2';
    const foot = (x) => Math.min(SHORE + 4, lerp(galataY(x) + 6, SHORE + 4, f * 0.85));
    const top = Math.min(...items.map((it) => foot(it.x + it.w / 2) - it.h)) - 14;
    row = k;
    grp(p, layer, { x: 1140, y: top, w: 330, h: SHORE + 30 - top }, (c) => {
      const rr = rng(70 + k);
      for (const it of items) {
        const y = foot(it.x + it.w / 2);
        c.fillStyle = tone; c.fillRect(it.x, y - it.h, it.w, SHORE + 20 - y + it.h); occlude('galata', it.x - 2, y - it.h - 10, it.w + 4, SHORE + 30 - y + it.h);
        if (it.roof === 'hip') { poly(c, [[it.x - 2, y - it.h], [it.x + it.w / 2, y - it.h - 10], [it.x + it.w + 2, y - it.h]]); c.fill(); }
        else if (it.roof === 'gable') { c.fillRect(it.x + it.w * 0.2, y - it.h - 6, it.w * 0.6, 6); }
        else { c.fillStyle = mix(tone, INK, 0.2); c.fillRect(it.x - 1, y - it.h - 2, it.w + 2, 3); }
        c.strokeStyle = 'rgba(255,190,150,.3)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(it.x, y - it.h); c.lineTo(it.x + it.w, y - it.h); c.stroke();
        const cols = Math.max(1, Math.floor((it.w - 6) / 8));
        for (let yy = y - it.h + 7; yy < y + 20 && yy < SHORE - 6; yy += 11) for (let q = 0; q < cols; q++) {
          const xx = it.x + (it.w - cols * 8) / 2 + q * 8 + 2;
          if (rr() < 0.28) light(layer, xx, yy, 3.6, 5.5, false);
          else { c.fillStyle = mix(tone, INK, 0.3); c.fillRect(xx, yy, 3.6, 5.5); }
        }
        // a cornice under the roof
        c.fillStyle = mix(tone, '#c59aa8', 0.18); c.fillRect(it.x, y - it.h + 1, it.w, 2);
      }
    }, { t: 6.9 + k * 0.17, d: 0.8, reveal: 'rise' });
  }
}

function galataTower(p) {
  const x = 1300, base = galataY(x) + 40, w = 30;
  const top = 676;
  const capB = 770, gal = 808;
  grp(p, 'gtower', { x: x - 60, y: top - 30, w: 120, h: base - top + 40 }, (c) => {
    // the stone drum, round, lit on its left
    const g = c.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, '#8e6a8e'); g.addColorStop(0.35, '#6a4c78'); g.addColorStop(1, '#2f2147');
    c.fillStyle = g; c.fillRect(x - w, gal, 2 * w, base - gal);
    // courses of stone and small windows
    c.strokeStyle = 'rgba(26,17,48,.3)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = gal + 14; y < base; y += 14) { c.moveTo(x - w, y); c.lineTo(x + w, y); }
    c.stroke();
    for (const [yy, xs] of [[860, [-14, 8]], [910, [-6]], [960, [-14, 10]]]) for (const dx of xs) { c.fillStyle = '#24183a'; c.beginPath(); archPath(c, x + dx, yy, 6, 13); c.fill(); light('gtower', x + dx + 1, yy + 2, 4, 10); }
    // the gallery: a ring of arches under the cone, and the balcony
    c.fillStyle = '#5a416c'; c.fillRect(x - w - 4, capB, 2 * w + 8, gal - capB);
    for (let k = 0; k < 6; k++) { const ax = x - w + 2 + k * 10; c.fillStyle = '#20152f'; c.beginPath(); archPath(c, ax, capB + 8, 7, 22); c.fill(); light('gtower', ax + 1, capB + 10, 5, 19); }
    c.fillStyle = '#3a2a52'; c.fillRect(x - w - 9, gal - 2, 2 * w + 18, 6);
    c.strokeStyle = '#3a2a52'; c.lineWidth = 1; c.beginPath();
    for (let xx = x - w - 8; xx <= x + w + 8; xx += 5) { c.moveTo(xx, gal - 2); c.lineTo(xx, gal - 12); }
    c.moveTo(x - w - 9, gal - 12); c.lineTo(x + w + 9, gal - 12); c.stroke();
    // the cone
    const cg = c.createLinearGradient(x - w, 0, x + w, 0);
    cg.addColorStop(0, '#b7a1bd'); cg.addColorStop(0.4, LEAD); cg.addColorStop(1, '#2a2040');
    c.fillStyle = cg; poly(c, [[x - w - 6, capB + 2], [x, top], [x + w + 6, capB + 2]]); c.fill();
    c.strokeStyle = 'rgba(26,17,48,.3)'; c.lineWidth = 0.7; c.beginPath();
    for (const f of [-0.6, -0.25, 0.1, 0.45]) { c.moveTo(x, top + 4); c.lineTo(x + f * (w + 6), capB + 2); } c.stroke();
    c.strokeStyle = 'rgba(255,200,160,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w - 6, capB + 2); c.lineTo(x, top); c.stroke();
    c.strokeStyle = '#d9b77a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - 22); c.stroke();
    c.fillStyle = '#d9b77a'; c.beginPath(); c.arc(x, top - 8, 2.4, 0, Math.PI * 2); c.fill();
  }, { t: 7.4, d: 1.4, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the waterfront and the bridge
function shore(p, r) {
  grp(p, 'shore', { x: PX, y: SHORE - 20, w: PW, h: 30 }, (c) => {
    // the quays at the water's edge
    c.fillStyle = mix(NEAR, INK, 0.3); c.fillRect(PX, SHORE - 6, 1170 - PX, 8);
    c.fillStyle = mix(NEAR, INK, 0.3); c.fillRect(1160, SHORE - 6, PX + PW - 1160, 8);
    // the Galata Bridge, low across the mouth of the Golden Horn
    c.fillStyle = NEAR; c.fillRect(1120, SHORE - 12, 70, 4);
    c.strokeStyle = NEAR; c.lineWidth = 1; c.beginPath();
    for (let x = 1124; x < 1190; x += 8) { c.moveTo(x, SHORE - 8); c.lineTo(x, SHORE); } c.stroke();
    for (let x = 1124; x < 1190; x += 10) light('shore', x, SHORE - 15, 1.6, 1.6, false);
  }, { t: 7.6, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the Bosphorus
function water(p, r) {
  p.group('water', { x: PX, y: SHORE, w: PW, h: PB - SHORE }, (c) => {
    const g = c.createLinearGradient(0, SHORE, 0, PB);
    g.addColorStop(0, '#f0b483'); g.addColorStop(0.18, '#d98479'); g.addColorStop(0.45, '#8c4c78'); g.addColorStop(0.8, '#45295f'); g.addColorStop(1, '#2a1a42');
    c.fillStyle = g; c.fillRect(PX, SHORE, PW, PB - SHORE);
    // the column of light under the glow
    const gl = c.createRadialGradient(760, SHORE, 10, 760, SHORE, 380);
    gl.addColorStop(0, 'rgba(255,226,160,.85)'); gl.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = gl; c.save(); c.translate(760, SHORE); c.scale(0.55, 1); c.translate(-760, -SHORE); c.fillRect(0, SHORE, 2000, 420); c.restore();
  }, { t: 2.3, d: 1.8, reveal: 'fall', ease: 'inOut' });
  // ripples, finer far away
  const bands = 10;
  for (let b = 0; b < bands; b++) {
    const y0 = lerp(SHORE + 4, PB, (b / bands) ** 1.5), y1 = lerp(SHORE + 4, PB, ((b + 1) / bands) ** 1.5);
    const dark = [], lite = [];
    const k = b / bands;
    for (let y = y0; y < y1; y += lerp(3, 12, k)) {
      const n = Math.round(lerp(26, 12, k));
      for (let i = 0; i < n; i++) {
        const x = PX + r() * PW, L = lerp(8, 46, k) * r.range(0.6, 1.4), a = lerp(0.6, 3, k);
        const line = [[x - L, y], [x - L * 0.5, y - a], [x, y], [x + L * 0.5, y + a * 0.6], [x + L, y]];
        const nearGlow = Math.abs(x - 760) < 160 + k * 220;
        (nearGlow && r.chance(0.7) ? lite : dark).push(line);
      }
    }
    p.strokes('water', dark, `rgba(42,24,66,${0.35 + k * 0.3})`, lerp(0.8, 1.8, k), { t: 8.2 + b * 0.1, d: 0.8, reveal: b % 2 ? 'wipeL' : 'wipe' });
    p.strokes('water', lite, `rgba(255,222,170,${0.75 - k * 0.3})`, lerp(0.8, 2, k), { t: 8.3 + b * 0.1, d: 0.8, reveal: b % 2 ? 'wipe' : 'wipeL' });
  }
  // the reflections of the skyline: dark, broken, swaying
  const refl = [];
  const add = (x, len, w) => {
    for (let y = SHORE + 2; y < SHORE + len; y += r.range(5, 9)) {
      const L = w * r.range(0.6, 1.4);
      refl.push([[x - L / 2 + Math.sin(y * 0.3) * 3, y], [x + L / 2 + Math.sin(y * 0.3) * 3, y]]);
    }
  };
  for (const x of [166, 204, 240, 504, 540, 578]) add(x, r.range(150, 230), 9);
  for (const x of [592, 634, 854, 894]) add(x, r.range(140, 200), 10);
  for (let x = 220; x < 540; x += 12) add(x, r.range(60, 110), 16);
  for (let x = 640; x < 860; x += 12) add(x, r.range(50, 100), 16);
  add(1300, 260, 30);
  for (let x = 1180; x < 1440; x += 14) add(x, r.range(40, 110), 16);
  p.strokes('water', refl, 'rgba(47,32,69,.42)', 2.2, { t: 9.2, d: 1.0, reveal: 'fall' });
}

// ================================================================ the Maiden's Tower
function maidensTower(p, r) {
  const x = 330, wl = 1398, t0 = wl - 14;
  const body = '#3b2a50', lit = '#5c4470', dark = '#20152f', stone = '#4a3a5c';
  grp(p, 'kiz', { x: x - 170, y: wl - 300, w: 340, h: 470 }, (c) => {
    // its reflection, broken by the swell
    const rr = rng(31);
    c.fillStyle = 'rgba(32,20,48,.45)';
    for (let y = wl + 6; y < wl + 160; y += 5) {
      const f = (y - wl) / 160, sw = Math.sin(y * 0.35) * 4;
      const half = y < wl + 70 ? 110 * (1 - f * 0.6) : 24 * (1 - f);
      if (rr() < 0.8) c.fillRect(x - half + sw + rr() * 6, y, half * 2 * rr.range(0.7, 1), 2.4);
    }
    c.fillStyle = 'rgba(255,210,140,.55)';
    for (const dx of [-70, -26, 0, 44]) for (let y = wl + 10; y < wl + 90; y += 7) if (rr() < 0.7) c.fillRect(x + dx + Math.sin(y) * 3, y, 6, 2);
    // the islet: rocks, and the stone terrace wall round it
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(x - 160, wl + 6);
    for (let k = 0; k <= 24; k++) { const f = k / 24; c.lineTo(x - 160 + f * 320, wl + 2 - Math.sin(f * Math.PI) * 8 + Math.sin(k * 2.3) * 3); }
    c.lineTo(x + 160, wl + 8); c.closePath(); c.fill();
    c.fillStyle = stone; c.fillRect(x - 130, t0, 260, 14);
    c.strokeStyle = 'rgba(255,200,160,.25)'; c.lineWidth = 0.8; c.beginPath();
    c.moveTo(x - 130, t0 + 0.5); c.lineTo(x + 130, t0 + 0.5);
    for (let xx = x - 122; xx < x + 130; xx += 16) { c.moveTo(xx, t0 + 1); c.lineTo(xx, t0 + 7); c.moveTo(xx + 8, t0 + 7); c.lineTo(xx + 8, t0 + 14); }
    c.moveTo(x - 130, t0 + 7); c.lineTo(x + 130, t0 + 7); c.stroke();
    // the main house, with a low lead roof
    c.fillStyle = body; c.fillRect(x - 104, wl - 66, 188, 52);
    c.fillStyle = lit; c.fillRect(x - 104, wl - 66, 52, 52);
    c.fillStyle = '#5b5078'; poly(c, [[x - 112, wl - 66], [x + 92, wl - 66], [x + 80, wl - 80], [x - 100, wl - 80]]); c.fill();
    c.strokeStyle = 'rgba(255,196,150,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 112, wl - 66); c.lineTo(x - 100, wl - 80); c.lineTo(x + 80, wl - 80); c.stroke();
    for (let k = 0; k < 8; k++) {
      if (k === 4) continue;
      const wx = x - 96 + k * 23;
      c.fillStyle = dark; c.beginPath(); archPath(c, wx, wl - 58, 9, 24); c.fill();
      if (k !== 2 && k !== 6) light('kiz', wx + 1.5, wl - 56, 6, 21);
    }
    c.fillStyle = dark; c.beginPath(); archPath(c, x - 7, wl - 50, 14, 36); c.fill();
    // the tower, with corner pilasters
    c.fillStyle = body; c.fillRect(x - 22, wl - 196, 44, 130);
    c.fillStyle = lit; c.fillRect(x - 22, wl - 196, 9, 130);
    c.fillStyle = mix(body, INK, 0.3); c.fillRect(x + 15, wl - 196, 7, 130);
    for (const yy of [wl - 170, wl - 128]) { c.fillStyle = dark; c.beginPath(); archPath(c, x - 6, yy, 12, 26); c.fill(); light('kiz', x - 4, yy + 3, 8, 22); }
    c.fillStyle = mix(body, INK, 0.3); c.fillRect(x - 26, wl - 98, 52, 4);
    // the balcony and its railing
    c.fillStyle = dark; c.fillRect(x - 32, wl - 202, 64, 7);
    c.strokeStyle = dark; c.lineWidth = 1; c.beginPath();
    c.moveTo(x - 32, wl - 212); c.lineTo(x + 32, wl - 212);
    for (let xx = x - 30; xx <= x + 30; xx += 5) { c.moveTo(xx, wl - 212); c.lineTo(xx, wl - 202); }
    c.stroke();
    // the octagonal lantern
    c.fillStyle = body; c.fillRect(x - 18, wl - 240, 36, 38);
    for (let k = 0; k < 4; k++) light('kiz', x - 15 + k * 8, wl - 235, 5.4, 28);
    c.fillStyle = dark; for (let k = 0; k <= 4; k++) c.fillRect(x - 18 + k * 8.4, wl - 240, 2, 38);
    c.fillRect(x - 21, wl - 243, 42, 4);
    // the lead cap, swelling then drawn to a point, with its rod and pennant
    const cg = c.createLinearGradient(x - 22, 0, x + 22, 0);
    cg.addColorStop(0, '#b7a1bd'); cg.addColorStop(0.45, LEAD); cg.addColorStop(1, '#2a2040');
    c.fillStyle = cg; c.beginPath(); c.moveTo(x - 20, wl - 243);
    c.bezierCurveTo(x - 26, wl - 258, x - 8, wl - 266, x, wl - 284);
    c.bezierCurveTo(x + 8, wl - 266, x + 26, wl - 258, x + 20, wl - 243); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,200,160,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 20, wl - 243); c.bezierCurveTo(x - 26, wl - 258, x - 8, wl - 266, x, wl - 284); c.stroke();
    c.strokeStyle = '#d9b77a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, wl - 284); c.lineTo(x, wl - 298); c.stroke();
    c.fillStyle = '#d9b77a'; c.beginPath(); c.arc(x, wl - 288, 2.2, 0, Math.PI * 2); c.fill();
    // a lamp and a little landing
    c.fillStyle = dark; c.fillRect(x + 112, wl - 50, 3, 36); c.fillRect(x + 100, wl - 4, 50, 5);
    light('kiz', x + 109, wl - 57, 9, 9, false);
  }, { t: 8.6, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the quay at Üsküdar, close by
function quay(p, r) {
  const y = 1510;
  p.group('quay', { x: PX, y: y - 6, w: PW, h: PB - y + 6 }, (c) => {
    c.fillStyle = QUAY; c.fillRect(PX, y, PW, PB - y);
    c.fillStyle = '#2c1d40'; c.fillRect(PX, y - 4, PW, 7);
    c.strokeStyle = 'rgba(255,200,160,.18)'; c.lineWidth = 1; c.beginPath();
    for (let x = PX; x < PX + PW; x += 42) { c.moveTo(x + ((x / 42) % 2) * 21, y + 8); c.lineTo(x + ((x / 42) % 2) * 21, PB); }
    c.moveTo(PX, y + 26); c.lineTo(PX + PW, y + 26); c.stroke();
  }, { t: 9.0, d: 0.8, reveal: 'rise' });
  // what stands on it: a railing, lamps, a fisherman, a couple on a bench, a
  // simit cart, a cat and a gull on a bollard
  p.group('quay', { x: PX, y: y - 170, w: PW, h: 176 }, (c) => {
    c.strokeStyle = QUAY; c.lineWidth = 2; c.beginPath();
    c.moveTo(PX, y - 26); c.lineTo(PX + PW, y - 26);
    for (let x = PX + 10; x < PX + PW; x += 26) { c.moveTo(x, y - 26); c.lineTo(x, y); }
    c.stroke();
    c.lineWidth = 0.8; c.beginPath(); c.moveTo(PX, y - 13); c.lineTo(PX + PW, y - 13); c.stroke();
    // lamp posts
    for (const lx of [520, 980, 1390]) {
      c.fillStyle = QUAY; c.fillRect(lx - 2.5, y - 128, 5, 128); c.fillRect(lx - 6, y - 10, 12, 10);
      c.fillRect(lx - 16, y - 130, 32, 3);
      for (const s of [-1, 1]) { c.beginPath(); c.arc(lx + s * 14, y - 138, 7, 0, Math.PI * 2); c.fillStyle = '#ffe2a8'; c.fill(); }
      const gl = c.createRadialGradient(lx, y - 138, 2, lx, y - 138, 40);
      gl.addColorStop(0, 'rgba(255,220,150,.45)'); gl.addColorStop(1, 'rgba(255,220,150,0)');
      c.fillStyle = gl; c.fillRect(lx - 40, y - 178, 80, 80);
    }
    c.fillStyle = QUAY;
    // the fisherman and his rod
    const fx = 690;
    c.fillRect(fx - 6, y - 52, 12, 26); c.fillRect(fx - 5, y - 26, 4, 26); c.fillRect(fx + 1, y - 26, 4, 26);
    c.beginPath(); c.arc(fx, y - 58, 6, 0, Math.PI * 2); c.fill();
    c.fillRect(fx - 8, y - 66, 16, 3);
    c.strokeStyle = QUAY; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx + 4, y - 44); c.lineTo(fx + 80, y - 120); c.stroke();
    c.strokeStyle = 'rgba(255,230,200,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(fx + 80, y - 120); c.quadraticCurveTo(fx + 96, y - 60, fx + 102, y + 2); c.stroke();
    // a bucket
    c.fillStyle = QUAY; poly(c, [[fx - 26, y - 14], [fx - 14, y - 14], [fx - 16, y], [fx - 24, y]]); c.fill();
    // the couple on a bench, a tea glass between them
    const bx = 1180;
    c.fillRect(bx - 40, y - 24, 80, 4); c.fillRect(bx - 36, y - 24, 3, 24); c.fillRect(bx + 33, y - 24, 3, 24); c.fillRect(bx - 40, y - 44, 80, 3);
    for (const s of [-1, 1]) {
      const px = bx + s * 16;
      c.beginPath(); c.arc(px, y - 54, 6.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(px - 9, y - 22); c.quadraticCurveTo(px - 10, y - 46, px, y - 47); c.quadraticCurveTo(px + 10, y - 46, px + 9, y - 22); c.fill();
    }
    c.fillStyle = '#c25a3c'; c.fillRect(bx - 2, y - 30, 4, 6);
    // the simit cart: a glass case on wheels, lit inside
    const sx = 860;
    c.fillStyle = QUAY; c.fillRect(sx - 30, y - 30, 60, 6);
    c.beginPath(); c.arc(sx - 18, y - 8, 8, 0, Math.PI * 2); c.arc(sx + 18, y - 8, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd890'; c.fillRect(sx - 26, y - 56, 52, 26);
    c.strokeStyle = QUAY; c.lineWidth = 2; c.strokeRect(sx - 26, y - 56, 52, 26);
    c.fillStyle = '#b0663a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(sx - 18 + k * 9, y - 40, 3.6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = QUAY; poly(c, [[sx - 32, y - 56], [sx + 32, y - 56], [sx + 26, y - 66], [sx - 26, y - 66]]); c.fill();
    // the cat, watching the water
    const cx = 1010;
    c.beginPath(); c.ellipse(cx, y - 9, 9, 9, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 1, y - 22, 6, 0, Math.PI * 2); c.fill();
    poly(c, [[cx - 4, y - 26], [cx - 2, y - 33], [cx + 1, y - 27]]); c.fill();
    poly(c, [[cx + 1, y - 27], [cx + 5, y - 33], [cx + 6, y - 25]]); c.fill();
    c.strokeStyle = QUAY; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx - 8, y - 3); c.quadraticCurveTo(cx - 22, y - 2, cx - 18, y - 14); c.stroke();
    // a gull on a bollard
    const gx = 300;
    c.fillRect(gx - 7, y - 18, 14, 18);
    c.fillStyle = '#efe6dc'; c.beginPath(); c.ellipse(gx, y - 26, 10, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(gx + 8, y - 31, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a5470'; poly(c, [[gx - 10, y - 28], [gx + 4, y - 30], [gx - 2, y - 24]]); c.fill();
    c.fillStyle = '#e8a43a'; poly(c, [[gx + 11, y - 31], [gx + 17, y - 30], [gx + 11, y - 29]]); c.fill();
  }, { t: 9.3, d: 0.9, reveal: 'drop', dy: 14 });
}

// ================================================================ the lights come on
function lightsOn(p) {
  const order = ['far', 'sule', 'minarets', 'mosques', 'blue', 'topkapi', 'slope', 'galata', 'gtower', 'galata2', 'shore', 'kiz'];
  order.forEach((layer, li) => {
    const list = LIGHTS[layer];
    if (!list || !list.length) return;
    const grpOf = (l) => (l === 'galata2' ? 'galata' : l);
    const occ = OCC.filter((o) => o[0] === grpOf(layer));
    const visible = list.filter(([x, y, w, h, , k]) => !occ.some(([, ok, ox, oy, ow, oh]) => ok > k && x + w / 2 > ox && x + w / 2 < ox + ow && y + h / 2 > oy && y + h / 2 < oy + oh));
    list.length = 0; list.push(...visible);
    // in a few waves, scattered
    const waves = list.length > 60 ? 3 : 1;
    for (let w = 0; w < waves; w++) {
      const part = list.filter((_, i) => (i * 7919) % waves === w);
      const pts = part.flatMap(([x, y, ww, hh]) => [[x, y], [x + ww, y + hh]]);
      p.group(layer, boxOf(pts, 6), (c) => {
        for (const [x, y, ww, hh, arch] of part) {
          c.fillStyle = (x * 13 + y * 7) % 5 < 1 ? LAMP2 : LAMP;
          c.beginPath(); arch && ww > 3 ? archPath(c, x, y, ww, hh) : c.rect(x, y, ww, hh); c.fill();
        }
      }, { t: 9.0 + li * 0.16 + w * 0.35, d: 0.7, reveal: 'fade' });
    }
  });
}

// ================================================================ life: stars, glints, boats, the ferry, gulls
function life(p, r) {
  // stars that twinkle
  const tw = [];
  for (let i = 0; i < 26; i++) tw.push([PX + r() * PW, PY + 10 + r() ** 1.5 * 360, r() * 6, 0.8 + r() * 1.2]);
  p.live('stars', {
    t: 3.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x, y, ph, s] of tw) {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.9 + ph));
        c.fillStyle = `rgba(255,244,230,${a.toFixed(3)})`; c.fillRect(x - s, y - s * 0.25, 2 * s, s * 0.5); c.fillRect(x - s * 0.25, y - s, s * 0.5, 2 * s);
      }
    },
  });
  // glints under the lit shore and the glow
  const gl = [];
  for (let i = 0; i < 170; i++) {
    const x = r.chance(0.45) ? 760 + r.gauss() * 140 : PX + r() * PW;
    const y = SHORE + 6 + r() ** 1.4 * 360;
    gl.push([x, y, r() * 6, r.range(4, 16) * (0.5 + (y - SHORE) / 400)]);
  }
  p.live('glints', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = 'rgba(255,226,160,.9)';
      for (const [x, y, ph, L] of gl) {
        const a = Math.sin(time * 1.7 + ph * 3);
        if (a < 0.2) continue;
        c.globalAlpha = a * 0.8; c.fillRect(x - L / 2 + Math.sin(time + ph) * 3, y, L, 1.5);
      }
      c.globalAlpha = 1;
    },
  });
  // fishing boats, bobbing, each with its lamp
  const boats = [[560, 1300, 0.8, '#3a6b8a'], [1030, 1350, 0.95, '#c2553e'], [1320, 1440, 1.2, '#2f7f78'], [790, 1418, 1.2, '#e2d3b6'], [210, 1240, 0.6, '#c2553e']];
  p.live('boats', {
    t: 9.9, d: 1.0, reveal: 'fade',
    draw: (c, time) => { boats.forEach(([x, y, s, col], i) => kayik(c, x + Math.sin(time * 0.15 + i) * 6, y + Math.sin(time * 1.3 + i * 2) * 1.6 * s, s, col, Math.sin(time * 1.1 + i) * 0.03)); },
  });
  // the ferry, crossing slowly, smoking
  p.live('boats', {
    t: 10.0, d: 1.4, reveal: 'slide', dx: 120,
    draw: (c, time) => vapur(c, 1150 - Math.max(0, time - 10) * 9, 1268 + Math.sin(time * 0.9) * 1.2, time),
  });
  // gulls wheeling over the water and the domes
  const gs = [];
  for (let i = 0; i < 30; i++) {
    const near = r();
    gs.push({ x: PX + 40 + r() * (PW - 80), y: 560 + r() * 760, rx: r.range(30, 120), ry: r.range(10, 40), w: r.range(0.15, 0.4) * (r.chance(0.5) ? 1 : -1), ph: r() * 7, s: lerp(0.8, 2.0, near ** 1.5) });
  }
  p.live('gulls', {
    t: 9.6, d: 1.4, reveal: 'fade',
    draw: (c, time) => {
      c.lineCap = 'round';
      for (const g of gs) {
        const a = time * g.w + g.ph;
        const x = g.x + Math.cos(a) * g.rx, y = g.y + Math.sin(a) * g.ry;
        const fl = Math.sin(time * 7 + g.ph * 3);
        // pale against the dark sky, dark against the glow
        const lite = y < 820 || y > 1200;
        const w = 9 * g.s, h = (2.2 + fl * 2.4) * g.s;
        c.strokeStyle = lite ? 'rgba(252,240,226,.92)' : 'rgba(40,24,60,.85)'; c.lineWidth = 1.5 * g.s;
        c.beginPath(); c.moveTo(x - w, y - h * 0.3); c.quadraticCurveTo(x - w * 0.45, y - h * 1.3, x, y); c.quadraticCurveTo(x + w * 0.45, y - h * 1.3, x + w, y - h * 0.3); c.stroke();
      }
    },
  });
}

function kayik(c, x, y, s, col, tilt) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s);
  c.fillStyle = 'rgba(255,220,160,.25)'; c.fillRect(-26, 3, 52, 2);
  c.fillStyle = '#2a1a36';
  c.beginPath(); c.moveTo(-34, -12); c.quadraticCurveTo(-26, 2, -12, 2); c.lineTo(16, 2); c.quadraticCurveTo(30, 2, 36, -13); c.lineTo(30, -8); c.lineTo(-28, -8); c.closePath(); c.fill();
  c.fillStyle = col; c.fillRect(-28, -9, 58, 3);
  // the fisherman, hunched
  c.fillStyle = '#20152f'; c.beginPath(); c.ellipse(4, -15, 6, 8, 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(7, -25, 4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#20152f'; c.lineWidth = 1; c.beginPath(); c.moveTo(9, -16); c.lineTo(34, -38); c.stroke();
  // the lamp on its pole
  c.fillRect(-22, -30, 1.6, 22);
  c.fillStyle = '#ffd890'; c.beginPath(); c.arc(-21, -32, 3, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,214,140,.25)'; c.beginPath(); c.arc(-21, -32, 9, 0, Math.PI * 2); c.fill();
  c.restore();
}

// a Bosphorus ferry heading left: a dark hull, two white decks of lit windows, one funnel
function vapur(c, x, y, time) {
  // the wake
  c.strokeStyle = 'rgba(255,236,214,.55)'; c.lineWidth = 1.3;
  c.beginPath();
  for (let k = 0; k < 5; k++) { const xx = x + 120 + k * 26; c.moveTo(xx, y + 2 + k * 1.5); c.lineTo(xx + 22, y + 3 + k * 2); }
  c.moveTo(x - 128, y + 1); c.quadraticCurveTo(x - 140, y + 5, x - 150, y + 4);
  c.stroke();
  // the hull
  c.fillStyle = '#1c1428';
  poly(c, [[x - 134, y - 20], [x + 120, y - 20], [x + 116, y], [x - 120, y]]); c.fill();
  c.fillStyle = '#f2e8da'; c.fillRect(x - 130, y - 24, 248, 5);
  // the decks
  c.fillStyle = '#efe5d6'; c.fillRect(x - 112, y - 46, 222, 22);
  c.fillStyle = '#e4d8c6'; c.fillRect(x - 80, y - 64, 156, 18);
  c.fillStyle = '#2a1e36'; c.fillRect(x - 116, y - 48, 230, 3); c.fillRect(x - 84, y - 66, 164, 3);
  c.fillStyle = LAMP;
  for (let k = 0; k < 17; k++) c.fillRect(x - 106 + k * 12.6, y - 41, 7.4, 11);
  for (let k = 0; k < 11; k++) c.fillRect(x - 74 + k * 13.6, y - 60, 7.4, 9);
  // the wheelhouse forward and the mast
  c.fillStyle = '#efe5d6'; c.fillRect(x - 74, y - 80, 30, 14);
  c.fillStyle = '#2a1e36'; c.fillRect(x - 76, y - 82, 34, 3);
  c.fillStyle = LAMP; c.fillRect(x - 70, y - 76, 22, 5);
  c.strokeStyle = '#2a1e36'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 92, y - 46); c.lineTo(x - 96, y - 104); c.stroke();
  c.fillStyle = '#ff6a50'; c.beginPath(); c.arc(x - 96, y - 106, 2.2, 0, Math.PI * 2); c.fill();
  // the funnel, raked back, cream with a black top
  poly(c, [[x + 4, y - 64], [x + 26, y - 64], [x + 32, y - 104], [x + 12, y - 104]]); c.fillStyle = '#efe5d6'; c.fill();
  poly(c, [[x + 11, y - 96], [x + 31, y - 96], [x + 32, y - 104], [x + 12, y - 104]]); c.fillStyle = '#1c1428'; c.fill();
  // smoke, drifting back and up, thinning as it goes
  for (let k = 0; k < 10; k++) {
    const f = ((time * 0.22 + k / 10) % 1);
    const sx = x + 22 + f * 150 + Math.sin(f * 4 + k) * 5, sy = y - 108 - f * 60 - Math.sin(f * 3) * 10;
    const rad = 5 + f * 22;
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, rad);
    g.addColorStop(0, `rgba(150,124,150,${(0.42 * (1 - f) ** 1.3).toFixed(3)})`); g.addColorStop(1, 'rgba(150,124,150,0)');
    c.fillStyle = g; c.beginPath(); c.arc(sx, sy, rad, 0, Math.PI * 2); c.fill();
  }
}

// ================================================================ the title
function title(p, r) {
  const cx = W / 2, cy = 1688, hw = 470, hh = 90;
  const cart = (c, ins) => {
    const a = hw - ins, b = hh - ins, e = 96;
    c.beginPath();
    c.moveTo(cx - a - 22 + ins * 0.4, cy);
    c.bezierCurveTo(cx - a + 10, cy - 4, cx - a + 30, cy - b, cx - a + e, cy - b);
    c.lineTo(cx + a - e, cy - b);
    c.bezierCurveTo(cx + a - 30, cy - b, cx + a - 10, cy - 4, cx + a + 22 - ins * 0.4, cy);
    c.bezierCurveTo(cx + a - 10, cy + 4, cx + a - 30, cy + b, cx + a - e, cy + b);
    c.lineTo(cx - a + e, cy + b);
    c.bezierCurveTo(cx - a + 30, cy + b, cx - a + 10, cy + 4, cx - a - 22 + ins * 0.4, cy);
    c.closePath();
  };
  p.group('title', { x: cx - hw - 40, y: cy - hh - 10, w: 2 * hw + 80, h: 2 * hh + 20 }, (c) => {
    cart(c, 0); c.fillStyle = COBALT; c.fill();
    c.strokeStyle = TILE_INK; c.lineWidth = 2; c.stroke();
    cart(c, 9); c.strokeStyle = '#d9b77a'; c.lineWidth = 1.6; c.stroke();
    cart(c, 14); c.strokeStyle = 'rgba(246,241,229,.35)'; c.lineWidth = 0.8; c.stroke();
    // small rumi scrolls in the pointed ends
    for (const s of [-1, 1]) {
      const ex = cx + s * (hw - 52);
      c.fillStyle = TURQ; c.beginPath(); c.arc(ex, cy, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = RED; c.beginPath(); c.arc(ex, cy, 4.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = SLIP; for (const dy of [-22, 22]) { c.beginPath(); c.arc(ex - s * 6, cy + dy * 0.8, 2.4, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 10.6, d: 0.9, reveal: 'iris', ease: 'inOut' });
  p.type('title', 'İstanbul', cx, cy + 42, {
    family: '"Bodoni Moda", serif', style: 'italic', weight: 700, size: 126, color: '#f7eedb', shadow: 'rgba(10,18,50,.55)',
    align: 'center', track: 0.02, t: 11.1, gap: 0.15, d: 0.8, fit: 640,
  });
  p.type('title', 'BOĞAZİÇİ  ·  THE CITY ON TWO CONTINENTS', cx, 1822, {
    family: '"Bodoni Moda", serif', weight: 600, size: 22, color: COBALT, align: 'center', track: 0.3, t: 12.3, gap: 0.018, d: 0.5, reveal: 'fade',
  });
  // tulip sprays either side, echoing the border
  for (const s of [-1, 1]) {
    const x = cx + s * 560, y = 1726;
    p.group('title', { x: x - 60, y: y - 110, w: 120, h: 130 }, (c) => {
      c.strokeStyle = COBALT; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 6, y - 40, x, y - 62);
      c.moveTo(x, y - 14); c.quadraticCurveTo(x - 20, y - 30, x - 30, y - 52);
      c.moveTo(x, y - 14); c.quadraticCurveTo(x + 20, y - 30, x + 30, y - 52); c.stroke();
      saz(c, [x - 2, y - 4], [x - 44, y - 30], 8, 6, TURQ);
      saz(c, [x + 2, y - 4], [x + 44, y - 30], -8, 6, GREEN);
      tulip(c, x, y - 60, 1.25, -Math.PI / 2, RED);
      carnation(c, x - 30, y - 50, 0.8, -Math.PI / 2 - 0.5);
      carnation(c, x + 30, y - 50, 0.8, -Math.PI / 2 + 0.5);
    }, { t: 12.8 + (s > 0 ? 0.25 : 0), d: 0.7, reveal: 'pop' });
  }
  // the picture's own edge
  const rect = [[PX, PY], [PX + PW, PY], [PX + PW, PB], [PX, PB], [PX, PY]];
  p.pen('title', rect, TILE_INK, 2.2, { t: 13.1, d: 0.8, cap: 'square' });
}
