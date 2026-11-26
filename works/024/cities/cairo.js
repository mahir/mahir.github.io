// Cairo: a hot afternoon, looking up the Nile as a screen print. Flat inks with
// black keylines and halftone dots for shade; a stepped sky with a sunburst and
// a great sun; the Citadel and the Muhammad Ali Mosque on their hill, Mamluk
// minarets and domes, Sultan Hassan, the Cairo Tower on Gezira, the Giza
// pyramids in the haze, palms on both banks and feluccas on the river. A border
// of painted blocks, and a black slab with a mashrabiya band for the title.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

const KEY = '#17130f', SAND = '#ecdcb4', SAND_D = '#d9bf8a', OCHRE = '#e3a23a', GOLD = '#f2b83f';
const TERRA = '#c4583a', TERRA_L = '#dd8a5e', LAPIS = '#1f4e8c', LAPIS_L = '#4677ab', TURQ = '#3f9c97';
const PALM = '#2f6b4a', PALM_L = '#4f8f5a', PALM_D = '#1f4d36', CREAM = '#f6ecd6', STONE = '#dcc196', ALAB = '#efe5cf';

export const city = {
  id: 'cairo', name: 'Cairo', wall: '#2a2118',
  alt: "The Nile with feluccas and palms, the Cairo Tower and the Citadel's mosque against a rayed sky and a great sun, the pyramids beyond, the name in English and Arabic",
  google: 'family=Alfa+Slab+One&family=Reem+Kufi:wght@700',
  fonts: [
    ['400 230px "Alfa Slab One"', 'CAIRO'],
    ['400 26px "Alfa Slab One"', 'ON THE NILE · EGYPT'],
    ['700 128px "Reem Kufi"', 'القاهرة'],
  ],
  build,
};

const PX = 96, PY = 96, PW = W - 2 * PX, PB = 1540;   // the picture
const HOR = 1000;                                        // the horizon
// the Nile's two banks, running from near the horizon to the corners
const LB = (y) => { const t = (y - HOR) / 470; return lerp(640, 96, t) - Math.sin(t * Math.PI) * 46; };  // the east bank, on the left
const RB = (y) => { const t = (y - HOR) / 400; return lerp(1010, 1504, t) + Math.sin(t * Math.PI) * 40; }; // the west bank, on the right
const SUN = [960, 676, 228];

function build() {
  const p = new Plate({ paper: SAND, seed: 969 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PB - PY };
  p.stack('sky', 'sun', 'pyramids', 'hill', 'citadel', 'river', 'island', 'tower', 'westbank', 'city',
    'near', 'boats', 'palms', 'birds', 'slab', 'title', 'frame');
  p.layer('slab', { clip: false });
  p.layer('title', { clip: false });
  p.layer('frame', { clip: false });

  sky(p, r);
  border(p, r);
  pyramids(p, r);
  citadel(p, r);
  river(p, r);
  gezira(p, r);
  westBank(p, r);
  eastBank(p, r);
  foreground(p, r);
  life(p, r);
  title(p, r);
  return sprites(p);
}

// The press redraws a mark every frame while it arrives, and palms, roofs and
// windows are costly to draw. A mark that clips in (rise, fall, wipe) is drawn
// once into a sprite of its box at the sheet's scale and that is laid down
// while it arrives; once it has arrived it is drawn as itself, so the finished
// poster is made by the very same strokes.
const CLIPS = ['rise', 'fall', 'wipe', 'wipeR', 'wipeL'];
function sprites(p) {
  for (const name of p.order) for (const m of p.layers[name].marks) {
    if (!CLIPS.includes(m.reveal) || m.draw.length > 1) continue;
    const draw = m.draw, b = m.box;
    let sp = null;
    m.draw = (c, q) => {
      if (q >= 1) { if (sp) { sp.width = sp.height = 0; sp = null; } return draw(c, q); }
      const cw = c.canvas.width, ch = c.canvas.height;
      if (!sp || sp.cw !== cw) {
        // the box and a little more, as the reveal's clip is, in whole pixels
        const k = cw / W;
        const x0 = Math.max(0, Math.floor((b.x - 8) * k)), y0 = Math.max(0, Math.floor((b.y - 8) * k));
        const x1 = Math.min(cw, Math.ceil((b.x + b.w + 8) * k)), y1 = Math.min(ch, Math.ceil((b.y + b.h + 8) * k));
        if (x1 <= x0 || y1 <= y0) return;
        if (sp) sp.width = sp.height = 0;
        sp = document.createElement('canvas');
        sp.width = x1 - x0; sp.height = y1 - y0; sp.cw = cw; sp.x0 = x0; sp.y0 = y0;
        const s = sp.getContext('2d');
        s.setTransform(k, 0, 0, k, -x0, -y0);
        draw(s, q);
      }
      // clip reveals do not move the mark, so the sprite goes down pixel for pixel
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sp, sp.x0, sp.y0); c.restore();
    };
  }
  return p;
}

// ================================================================ helpers
// halftone: dots on a grid inside the current path, larger where f(x, y) is larger
function halftone(c, box, step, f, color) {
  c.fillStyle = color;
  c.beginPath();
  for (let y = box.y; y < box.y + box.h; y += step) {
    const odd = Math.round((y - box.y) / step) % 2;
    for (let x = box.x + (odd ? step / 2 : 0); x < box.x + box.w; x += step) {
      const rad = f(x, y) * step * 0.5;
      if (rad < 0.25) continue;
      c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2);
    }
  }
  c.fill();
}
function keyline(c, w = 2.4) { c.strokeStyle = KEY; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; }
function shape(c, pts, fill, lw = 2.4) { c.fillStyle = fill; poly(c, pts); c.fill(); if (lw) { keyline(c, lw); poly(c, pts); c.stroke(); } }

// a crescent on a rod, for the tops of domes and minarets
function finial(c, x, y, h) {
  keyline(c, Math.max(1.2, h * 0.08));
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.75); c.stroke();
  c.fillStyle = GOLD;
  c.beginPath(); c.arc(x, y - h * 0.35, h * 0.12, 0, Math.PI * 2); c.fill(); c.stroke();
  const cr = h * 0.2, cy = y - h * 0.85;
  c.beginPath(); c.arc(x, cy, cr, Math.PI * 0.1, Math.PI * 0.9, true); c.arc(x, cy - cr * 0.4, cr * 0.8, Math.PI * 0.9, Math.PI * 0.1, false); c.closePath(); c.fill();
  c.lineWidth = 1; c.stroke();
}

// an Ottoman lead dome (for the Muhammad Ali Mosque): round, flat inks, keyline
function leadDome(c, cx, by, rx, ry, fin = true) {
  c.beginPath(); c.ellipse(cx, by, rx, ry, 0, Math.PI, Math.PI * 2); c.closePath();
  c.fillStyle = '#9aa8b4'; c.fill();
  c.save(); c.clip();
  c.fillStyle = '#c8d2d6'; c.beginPath(); c.ellipse(cx - rx * 0.3, by - ry * 0.2, rx * 0.55, ry * 0.75, 0, 0, Math.PI * 2); c.fill();
  halftone(c, { x: cx, y: by - ry, w: rx, h: ry }, Math.max(3, rx * 0.09), (x) => clamp((x - cx) / rx) * 0.9, '#5f6e7e');
  keyline(c, 1); c.beginPath();
  for (let k = -3; k <= 3; k++) { const s = k / 4; c.moveTo(cx + rx * s, by); c.quadraticCurveTo(cx + rx * s * 0.9, by - ry * 0.75, cx, by - ry); }
  c.stroke(); c.restore();
  keyline(c, 2.2); c.beginPath(); c.ellipse(cx, by, rx, ry, 0, Math.PI, Math.PI * 2); c.stroke();
  if (fin) finial(c, cx, by - ry, Math.max(10, ry * 0.5));
}

// a Mamluk stone dome: tall and pointed, carved with zigzags or a net
function stoneDome(c, cx, by, w, h, carve, col = STONE) {
  const path = () => { c.beginPath(); c.moveTo(cx - w / 2, by); c.bezierCurveTo(cx - w / 2, by - h * 0.62, cx - w * 0.12, by - h * 0.86, cx, by - h); c.bezierCurveTo(cx + w * 0.12, by - h * 0.86, cx + w / 2, by - h * 0.62, cx + w / 2, by); c.closePath(); };
  // the drum
  shape(c, [[cx - w / 2 - 2, by + h * 0.22], [cx + w / 2 + 2, by + h * 0.22], [cx + w / 2 + 2, by], [cx - w / 2 - 2, by]], col, 1.8);
  c.fillStyle = KEY; for (let k = -2; k <= 2; k++) { c.beginPath(); archish(c, cx + k * w * 0.18 - 2, by + h * 0.04, 4, h * 0.13); c.fill(); }
  path(); c.fillStyle = col; c.fill();
  c.save(); path(); c.clip();
  keyline(c, 1);
  c.beginPath();
  if (carve === 'plain') {
    c.moveTo(cx - w / 2, by - h * 0.12); c.quadraticCurveTo(cx, by - h * 0.2, cx + w / 2, by - h * 0.12);
  } else if (carve === 'zigzag') {
    for (let y = by - 4; y > by - h; y -= h * 0.09) for (let x = cx - w / 2; x < cx + w / 2; x += w * 0.12) { c.moveTo(x, y); c.lineTo(x + w * 0.06, y - h * 0.05); c.lineTo(x + w * 0.12, y); }
  } else {
    for (let k = -6; k <= 6; k++) { c.moveTo(cx + k * w * 0.12, by); c.quadraticCurveTo(cx + k * w * 0.1, by - h * 0.6, cx, by - h); }
    for (let k = -6; k <= 6; k++) { c.moveTo(cx + k * w * 0.12, by); c.quadraticCurveTo(cx - k * w * 0.02, by - h * 0.5, cx - k * w * 0.05, by - h * 0.8); }
  }
  c.stroke();
  halftone(c, { x: cx, y: by - h, w: w / 2, h }, Math.max(3, w * 0.08), (x) => clamp((x - cx) / (w / 2)) * 0.8, 'rgba(23,19,15,.55)');
  c.restore();
  keyline(c, 2); path(); c.stroke();
  finial(c, cx, by - h, Math.max(9, h * 0.3));
}
function archish(c, x, y, w, h) { const rr = w / 2; c.moveTo(x, y + h); c.lineTo(x, y + rr); c.quadraticCurveTo(x, y, x + rr, y - rr * 0.4); c.quadraticCurveTo(x + w, y, x + w, y + rr); c.lineTo(x + w, y + h); c.closePath(); }

// a Mamluk minaret: square, then octagonal, then a pavilion on columns under a
// bulb, with a carved balcony between each stage
function mamluk(c, x, g, h, w, o = {}) {
  const col = o.col || STONE, dark = mix(col, KEY, 0.25);
  const y1 = g - h * 0.42, y2 = g - h * 0.68, y3 = g - h * 0.86;
  // square shaft
  shape(c, [[x - w / 2, g], [x + w / 2, g], [x + w / 2, y1], [x - w / 2, y1]], col, 2);
  c.fillStyle = KEY;
  for (const yy of [g - h * 0.15, g - h * 0.3]) { c.beginPath(); archish(c, x - w * 0.16, yy, w * 0.32, h * 0.07); c.fill(); }
  c.fillStyle = 'rgba(23,19,15,.25)'; c.fillRect(x + w * 0.15, y1, w * 0.35, g - y1);
  // a balcony: a band of muqarnas (little stepped teeth), then a rail
  const balcony = (y, bw) => {
    shape(c, [[x - bw * 0.36, y + 10], [x + bw * 0.36, y + 10], [x + bw * 0.62, y], [x - bw * 0.62, y]], dark, 1.6);
    c.fillStyle = KEY; for (let k = -2; k <= 2; k++) c.fillRect(x + k * bw * 0.2 - 1.2, y + 2, 2.4, 6);
    shape(c, [[x - bw * 0.62, y], [x + bw * 0.62, y], [x + bw * 0.62, y - 6], [x - bw * 0.62, y - 6]], col, 1.6);
  };
  // octagonal stage, with its facets
  const w2 = w * 0.78;
  shape(c, [[x - w2 / 2, y1], [x + w2 / 2, y1], [x + w2 / 2, y2], [x - w2 / 2, y2]], col, 2);
  keyline(c, 1); c.beginPath(); c.moveTo(x - w2 * 0.2, y1); c.lineTo(x - w2 * 0.2, y2); c.moveTo(x + w2 * 0.2, y1); c.lineTo(x + w2 * 0.2, y2); c.stroke();
  c.fillStyle = 'rgba(23,19,15,.25)'; c.fillRect(x + w2 * 0.2, y2, w2 * 0.3, y1 - y2);
  c.fillStyle = KEY; c.beginPath(); archish(c, x - w2 * 0.1, y1 - h * 0.17, w2 * 0.2, h * 0.08); c.fill();
  balcony(y1, w * 1.1);
  // the pavilion: columns with open arches
  const w3 = w * 0.56;
  shape(c, [[x - w3 / 2, y2], [x + w3 / 2, y2], [x + w3 / 2, y3], [x - w3 / 2, y3]], col, 1.8);
  c.fillStyle = o.sky || '#b3c6bd'; c.beginPath(); archish(c, x - w3 * 0.3, y3 + 4, w3 * 0.24, y2 - y3 - 8); archish(c, x + w3 * 0.06, y3 + 4, w3 * 0.24, y2 - y3 - 8); c.fill();
  keyline(c, 1); c.stroke();
  balcony(y2, w * 0.95);
  // the bulb, or a double bulb (as on al-Ghuri's), with a crescent
  const bulb = (by, bw, bh) => {
    c.beginPath(); c.moveTo(x - bw * 0.3, by); c.bezierCurveTo(x - bw * 0.75, by - bh * 0.45, x - bw * 0.2, by - bh * 0.8, x, by - bh); c.bezierCurveTo(x + bw * 0.2, by - bh * 0.8, x + bw * 0.75, by - bh * 0.45, x + bw * 0.3, by); c.closePath();
    c.fillStyle = col; c.fill(); keyline(c, 1.8); c.stroke();
  };
  shape(c, [[x - w3 * 0.55, y3], [x + w3 * 0.55, y3], [x + w3 * 0.55, y3 - 5], [x - w3 * 0.55, y3 - 5]], dark, 1.4);
  if (o.double) { bulb(y3 - 5, w * 0.5, h * 0.12); bulb(y3 - 5, w * 0.5, h * 0.12); c.save(); c.translate(w * 0.24, 0); bulb(y3 - 5, w * 0.46, h * 0.11); c.restore(); c.save(); c.translate(-w * 0.24, 0); bulb(y3 - 5, w * 0.46, h * 0.11); c.restore(); finial(c, x - w * 0.24, y3 - 5 - h * 0.11, 10); finial(c, x + w * 0.24, y3 - 5 - h * 0.11, 10); }
  else { bulb(y3 - 5, w * 0.62, h * 0.14); finial(c, x, y3 - 5 - h * 0.14, Math.max(10, h * 0.07)); }
}
const mamlukBox = (x, g, h, w) => ({ x: x - w * 1.2, y: g - h * 1.08 - 20, w: w * 2.4, h: h * 1.08 + 24 });

// a date palm: a ringed, leaning trunk and a crown of arching fronds
function palm(c, x, y, h, lean, rr, o = {}) {
  const top = [x + lean * h * 0.3, y - h];
  const cx = x + lean * h * 0.12, cy = y - h * 0.5;
  const tw = Math.max(3, h * 0.045);
  // the trunk
  c.beginPath(); c.moveTo(x - tw, y); c.quadraticCurveTo(cx - tw * 0.8, cy, top[0] - tw * 0.7, top[1]); c.lineTo(top[0] + tw * 0.7, top[1]); c.quadraticCurveTo(cx + tw * 0.8, cy, x + tw, y); c.closePath();
  c.fillStyle = o.trunk || '#8a5a34'; c.fill(); keyline(c, Math.max(1, h * 0.008)); c.stroke();
  // the rings, as little chevrons
  c.beginPath();
  for (let k = 1; k < 26; k++) {
    const t = k / 26, xx = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * top[0], yy = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * top[1];
    const ww = tw * lerp(1, 0.7, t);
    c.moveTo(xx - ww, yy); c.lineTo(xx, yy + ww * 0.5); c.lineTo(xx + ww, yy);
  }
  c.lineWidth = Math.max(0.8, h * 0.005); c.stroke();
  // dates hanging under the crown
  c.fillStyle = TERRA; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(top[0] + (k - 3) * h * 0.012, top[1] + h * 0.03 + (k % 3) * h * 0.012, h * 0.012, 0, Math.PI * 2); c.fill(); }
  // the fronds: lower and darker ones first
  const n = o.n || 13;
  const fr = [];
  for (let k = 0; k < n; k++) fr.push({ a: -Math.PI / 2 + ((k / (n - 1)) * 2 - 1) * 1.75 + rr.range(-0.12, 0.12), L: h * rr.range(0.32, 0.44), droop: rr.range(0.5, 0.95), dark: k % 2 });
  fr.sort((a, b) => Math.abs(b.a + Math.PI / 2) - Math.abs(a.a + Math.PI / 2));
  for (const f of fr) frond(c, top[0], top[1], f.a, f.L, f.droop, f.dark ? (o.dark || PALM_D) : (o.green || PALM), h);
}
function frond(c, x, y, a, L, droop, col, h) {
  // the rib: out along a, then falling under its own weight
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push([x + Math.cos(a) * L * t, y + Math.sin(a) * L * t + droop * L * t * t * (0.6 + 0.4 * Math.abs(Math.cos(a)))]);
  }
  // the leaflets: pairs of thin blades along the rib, hanging a little
  const blades = [];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16, [px, py] = pts[i], [qx, qy] = pts[i - 1];
    const dx = px - qx, dy = py - qy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const ll = L * 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.6 + 2;
    for (const sgn of [-1, 1]) {
      const ang = 0.8 * sgn;
      const bx = ux * Math.cos(ang) - uy * Math.sin(ang), by = ux * Math.sin(ang) + uy * Math.cos(ang);
      blades.push([[px, py], [px + bx * ll * 0.55, py + by * ll * 0.55 + ll * 0.12], [px + bx * ll, py + by * ll + ll * 0.4]]);
    }
  }
  const lw = Math.max(1.3, h * 0.0085);
  const draw = (w, colr) => {
    c.strokeStyle = colr; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (const bl of blades) { c.moveTo(bl[0][0], bl[0][1]); c.quadraticCurveTo(bl[1][0], bl[1][1], bl[2][0], bl[2][1]); }
    c.stroke();
  };
  draw(lw + Math.max(1.2, h * 0.004), KEY);
  draw(lw, col);
  c.strokeStyle = KEY; c.lineWidth = Math.max(1, h * 0.006);
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
}

// a felucca: a low painted hull, a short mast and the great lateen sail
function felucca(c, x, y, s, dir = 1, o = {}) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  // the hull
  shape(c, [[-120, -18], [118, -26], [108, -10], [90, 2], [-90, 4], [-110, -6]], o.hull || LAPIS, 3);
  shape(c, [[-116, -16], [116, -24], [113, -18], [-113, -11]], o.band || OCHRE, 1.6);
  c.fillStyle = CREAM; for (let k = -4; k <= 4; k++) c.fillRect(k * 20 - 3, -9, 6, 3);
  // the yard, the sail and the mast
  const yard0 = [70, -40], yard1 = [-130, -330];
  const clew = [-102, -34];
  c.beginPath(); c.moveTo(yard0[0], yard0[1]); c.lineTo(yard1[0], yard1[1]);
  c.quadraticCurveTo(-150, -170, clew[0], clew[1]); c.quadraticCurveTo(-20, -24, yard0[0], yard0[1]); c.closePath();
  c.fillStyle = o.sail || CREAM; c.fill();
  c.save(); c.clip();
  // seams and the sail's own shade
  keyline(c, 1.2); c.beginPath();
  for (let k = 1; k < 6; k++) { const t = k / 6; c.moveTo(lerp(yard0[0], yard1[0], t), lerp(yard0[1], yard1[1], t)); c.lineTo(clew[0] + 10, clew[1] - 6); }
  c.stroke();
  halftone(c, { x: -160, y: -340, w: 240, h: 320 }, 7, (px, py) => clamp((-60 - px) / 120) * 0.8 * clamp((py + 300) / 200), 'rgba(23,19,15,.35)');
  c.restore();
  keyline(c, 3); c.beginPath(); c.moveTo(yard1[0], yard1[1]); c.quadraticCurveTo(-150, -170, clew[0], clew[1]); c.quadraticCurveTo(-20, -24, yard0[0], yard0[1]); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(yard0[0] + 8, yard0[1] + 6); c.lineTo(yard1[0] - 4, yard1[1] - 6); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(40, -24); c.lineTo(40, -120); c.stroke();
  // a pennant at the masthead
  c.fillStyle = TERRA; poly(c, [[yard1[0] - 4, yard1[1] - 6], [yard1[0] - 40, yard1[1] - 2], [yard1[0] - 6, yard1[1] + 6]]); c.fill(); keyline(c, 1.5); c.stroke();
  // the boatman at the tiller
  c.fillStyle = o.robe || '#f2ead8';
  poly(c, [[-82, -24], [-66, -24], [-70, -62], [-80, -62]]); c.fill(); keyline(c, 2); c.stroke();
  c.fillStyle = '#7a4a2c'; c.beginPath(); c.arc(-75, -70, 8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = CREAM; c.beginPath(); c.ellipse(-75, -76, 9, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  keyline(c, 3); c.beginPath(); c.moveTo(-70, -44); c.lineTo(-110, -30); c.stroke();
  c.restore();
}

// ================================================================ the sky and the sun
function sky(p, r) {
  const bands = ['#2f5f96', '#4b7cab', '#78a2bf', '#a9c2bd', '#d4d0a8', '#ecd49b'];
  const cuts = [PY, 260, 440, 600, 740, 870, HOR + 4];
  bands.forEach((col, i) => {
    p.group('sky', { x: PX, y: cuts[i], w: PW, h: cuts[i + 1] - cuts[i] + 2 }, (c) => {
      c.fillStyle = col; c.fillRect(PX, cuts[i], PW, cuts[i + 1] - cuts[i] + 2);
      // the next band's color as dots where they meet, as a screen prints a blend
      if (i < bands.length - 1) {
        c.save(); c.beginPath(); c.rect(PX, cuts[i], PW, cuts[i + 1] - cuts[i]); c.clip();
        const h = cuts[i + 1] - cuts[i];
        halftone(c, { x: PX, y: cuts[i + 1] - h * 0.45, w: PW, h: h * 0.45 }, 9, (x, y) => clamp((y - (cuts[i + 1] - h * 0.45)) / (h * 0.45)) * 0.85, bands[i + 1]);
        c.restore();
      }
    }, { t: 0.1 + i * 0.22, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // the sunburst: wedges of lighter sky from the sun
  const [sx, sy, sr] = SUN;
  p.group('sky', { x: PX, y: PY, w: PW, h: HOR - PY }, (c) => {
    c.save(); c.beginPath(); c.rect(PX, PY, PW, HOR - PY); c.clip();
    c.fillStyle = 'rgba(255,244,214,.16)';
    const n = 36;
    for (let k = 0; k < n; k += 2) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      c.beginPath(); c.moveTo(sx, sy); c.arc(sx, sy, 1800, a0, a1); c.closePath(); c.fill();
    }
    c.restore();
  }, { t: 1.4, d: 1.4, reveal: 'iris', ease: 'inOut' });
  // the sun: a disc, a ring, a lighter disc a little off register, dots below
  p.group('sun', { x: sx - sr - 40, y: sy - sr - 40, w: 2 * sr + 80, h: 2 * sr + 80 }, (c) => {
    c.fillStyle = 'rgba(246,214,140,.55)'; c.beginPath(); c.arc(sx, sy, sr + 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f7cd62'; c.beginPath(); c.arc(sx - 10, sy - 12, sr * 0.8, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.clip();
    halftone(c, { x: sx - sr, y: sy - sr, w: 2 * sr, h: 2 * sr }, 10, (x, y) => clamp((y - sy + sr * 0.2) / (sr * 1.2)) * 0.75, OCHRE);
    c.restore();
    keyline(c, 3); c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.stroke();
  }, { t: 1.0, d: 1.8, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the border: painted blocks, as on a tomb wall
function border(p, r) {
  const o = 36, bw = 34;
  const cols = [LAPIS, OCHRE, TERRA, PALM, OCHRE, TURQ];
  const runs = [
    { x0: o, y0: o, dx: 1, dy: 0, len: W - 2 * o, horiz: true },
    { x0: W - o - bw, y0: o, dx: 0, dy: 1, len: H - 2 * o, horiz: false },
    { x0: W - o, y0: H - o - bw, dx: -1, dy: 0, len: W - 2 * o, horiz: true },
    { x0: o, y0: H - o, dx: 0, dy: -1, len: H - 2 * o, horiz: false },
  ];
  let t = 1.6;
  runs.forEach((run, ri) => {
    const n = Math.round(run.len / 46), step = run.len / n;
    // in groups of six blocks, each group pressed in turn
    for (let g0 = 0; g0 < n; g0 += 6) {
      const blocks = [];
      for (let k = g0; k < Math.min(n, g0 + 6); k++) {
        const a = k * step + 3, b = (k + 1) * step - 3;
        let x, y, w, h;
        if (run.horiz) { x = run.dx > 0 ? run.x0 + a : run.x0 - b; y = run.y0; w = b - a; h = bw; }
        else { y = run.dy > 0 ? run.y0 + a : run.y0 - b; x = run.x0; w = bw; h = b - a; }
        blocks.push([x, y, w, h, cols[(k + ri * 2) % cols.length]]);
      }
      const pts = blocks.flatMap(([x, y, w, h]) => [[x, y], [x + w, y + h]]);
      p.group('frame', boxOf(pts, 3), (c) => {
        for (const [x, y, w, h, col] of blocks) {
          c.fillStyle = col; c.fillRect(x, y, w, h);
          // a pale bar across each block, as the painters did
          c.fillStyle = 'rgba(246,236,214,.75)';
          if (w > h) c.fillRect(x + w * 0.42, y + 4, w * 0.16, h - 8); else c.fillRect(x + 4, y + h * 0.42, w - 8, h * 0.16);
          keyline(c, 1.4); c.strokeRect(x, y, w, h);
        }
      }, { t, d: 0.35, reveal: 'pop' });
      t += 0.045;
    }
  });
  // the black rules either side of the blocks, and round the picture
  const rect = (i) => [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i]];
  p.pen('frame', rect(o - 5), KEY, 4, { t: 1.6, d: 1.6, cap: 'square' });
  p.pen('frame', rect(o + bw + 5), KEY, 4, { t: 1.8, d: 1.6, cap: 'square' });
  p.pen('frame', [[PX, PY], [PX + PW, PY], [PX + PW, PB], [PX, PB], [PX, PY]], KEY, 6, { t: 2.0, d: 1.6, cap: 'square' });
}

// ================================================================ Giza, in the haze
function pyramids(p, r) {
  // the haze along the horizon
  p.group('pyramids', { x: PX, y: 900, w: PW, h: 120 }, (c) => {
    c.fillStyle = '#efd9a6'; c.fillRect(PX, 960, PW, 50);
    halftone(c, { x: PX, y: 930, w: PW, h: 40 }, 8, (x, y) => clamp((y - 930) / 40) * 0.7, '#efd9a6');
  }, { t: 2.2, d: 1.0, reveal: 'fade' });
  const list = [
    { x: 1330, half: 72, h: 96, t: 2.6, name: 'Menkaure' },
    { x: 1214, half: 148, h: 214, t: 2.9, cap: true, name: 'Khafre' },
    { x: 1072, half: 154, h: 198, t: 3.2, name: 'Khufu' },
  ];
  const base = HOR + 2;
  for (const py of list) {
    const apex = [py.x, base - py.h], L = [py.x - py.half, base], R = [py.x + py.half, base];
    const mid = [py.x + py.half * 0.22, base];
    p.group('pyramids', { x: py.x - py.half - 6, y: apex[1] - 8, w: 2 * py.half + 12, h: py.h + 14 }, (c) => {
      // the lit face and the face in shade, in a pale haze
      shape(c, [L, mid, apex], '#ecc590', 0);
      shape(c, [mid, R, apex], '#d39a62', 0);
      c.save(); poly(c, [mid, R, apex]); c.clip();
      halftone(c, { x: mid[0] - 10, y: apex[1], w: R[0] - mid[0] + 10, h: py.h }, 6, () => 0.5, 'rgba(150,88,50,.55)');
      c.restore();
      // the courses of stone, faint
      c.strokeStyle = 'rgba(120,80,50,.3)'; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 12; k++) { const y = base - (py.h * k) / 12, w = py.half * (1 - k / 12); c.moveTo(py.x - w, y); c.lineTo(py.x + w, y); }
      c.stroke();
      // Khafre keeps a cap of its old casing at the top
      if (py.cap) {
        const f = 0.22;
        shape(c, [[py.x - py.half * f, apex[1] + py.h * f], [py.x + py.half * f, apex[1] + py.h * f], apex], '#f3dcb0', 0);
      }
      keyline(c, 2); poly(c, [L, apex, R]); c.stroke();
      c.beginPath(); c.moveTo(apex[0], apex[1]); c.lineTo(mid[0], mid[1]); c.lineWidth = 1.2; c.stroke();
    }, { t: py.t, d: 1.0, reveal: 'rise', ease: 'inOut' });
  }
}

// ================================================================ the Citadel and the Muhammad Ali Mosque
function citadel(p, r) {
  // the Mokattam spur, a cliff of ochre strata
  const hill = [[PX - 10, 1010], [PX - 10, 900], [150, 896], [230, 884], [470, 884], [560, 914], [660, 962], [740, 1002]];
  p.group('hill', boxOf(hill, 6), (c) => {
    shape(c, hill, '#d8aa6a', 2.4);
    c.save(); poly(c, hill); c.clip();
    keyline(c, 1); c.strokeStyle = 'rgba(23,19,15,.4)'; c.beginPath();
    const rr = rng(5);
    for (let y = 905; y < 1010; y += 11) { c.moveTo(PX, y + rr() * 4); for (let x = PX; x < 760; x += 40) c.lineTo(x + 40, y + rr() * 6 - 3); }
    c.stroke();
    halftone(c, { x: 450, y: 880, w: 320, h: 130 }, 7, (x) => clamp((x - 470) / 200) * 0.7, 'rgba(120,70,30,.6)');
    c.restore();
  }, { t: 3.4, d: 1.0, reveal: 'rise' });
  // the walls with their round towers
  p.group('citadel', { x: PX, y: 840, w: 600, h: 70 }, (c) => {
    shape(c, [[PX - 10, 900], [PX - 10, 872], [540, 872], [560, 904]], '#e4c48e', 2);
    c.fillStyle = KEY; for (let x = PX; x < 540; x += 12) c.fillRect(x, 866, 6, 6);
    for (const tx of [150, 260, 400, 520]) {
      shape(c, [[tx - 16, 902], [tx + 16, 902], [tx + 16, 858], [tx - 16, 858]], '#e8cc98', 2);
      c.fillStyle = KEY; for (let k = 0; k < 3; k++) c.fillRect(tx - 14 + k * 11, 852, 6, 6);
      c.fillRect(tx - 2, 872, 4, 10);
    }
  }, { t: 3.8, d: 0.8, reveal: 'wipe' });
  // the mosque, white alabaster under grey lead domes, and its two very tall minarets
  const cx = 330, g = 872;
  p.group('citadel', { x: cx - 130, y: 620, w: 260, h: 256 }, (c) => {
    // the prayer hall
    shape(c, [[cx - 118, g], [cx + 118, g], [cx + 118, g - 74], [cx - 118, g - 74]], ALAB, 2.2);
    c.fillStyle = 'rgba(23,19,15,.15)'; c.fillRect(cx + 30, g - 74, 88, 74);
    c.fillStyle = KEY;
    for (let row = 0; row < 2; row++) for (let k = 0; k < 9; k++) { c.beginPath(); archish(c, cx - 104 + k * 24, g - 64 + row * 32, 9, 18); c.fill(); }
    // corner domes and half domes stepping up to the great dome
    for (const s of [-1, 1]) {
      shape(c, [[cx + s * 112 - 12, g - 74], [cx + s * 112 + 12, g - 74], [cx + s * 112 + 12, g - 96], [cx + s * 112 - 12, g - 96]], ALAB, 1.6);
      leadDome(c, cx + s * 112, g - 96, 14, 14);
      leadDome(c, cx + s * 74, g - 80, 26, 22);
    }
    shape(c, [[cx - 58, g - 74], [cx + 58, g - 74], [cx + 58, g - 132], [cx - 58, g - 132]], ALAB, 2);
    leadDome(c, cx - 50, g - 110, 32, 30, false); leadDome(c, cx + 50, g - 110, 32, 30, false);
    // the turrets at the corners of the drum
    for (const s of [-1, 1]) { shape(c, [[cx + s * 66 - 6, g - 128], [cx + s * 66 + 6, g - 128], [cx + s * 66 + 6, g - 154], [cx + s * 66 - 6, g - 154]], ALAB, 1.4); leadDome(c, cx + s * 66, g - 154, 8, 9); }
    shape(c, [[cx - 62, g - 130], [cx + 62, g - 130], [cx + 62, g - 146], [cx - 62, g - 146]], ALAB, 2);
    c.fillStyle = KEY; for (let k = 0; k < 10; k++) c.fillRect(cx - 54 + k * 11.4, g - 142, 4, 9);
    leadDome(c, cx, g - 146, 64, 60);
  }, { t: 4.3, d: 1.2, reveal: 'rise', ease: 'inOut' });
  for (const [i, x] of [[0, 214], [1, 446]]) {
    const top = 448, w = 13;
    p.group('citadel', { x: x - 20, y: top - 30, w: 40, h: g - top + 32 }, (c) => {
      shape(c, [[x - w / 2, g], [x + w / 2, g], [x + w / 2, top + 50], [x - w / 2, top + 50]], ALAB, 2);
      c.fillStyle = 'rgba(23,19,15,.18)'; c.fillRect(x + 1, top + 50, w / 2 - 1, g - top - 50);
      for (const yb of [top + 110, top + 190]) {
        shape(c, [[x - w * 0.5, yb + 12], [x + w * 0.5, yb + 12], [x + w, yb], [x - w, yb]], '#cfc3a8', 1.6);
        shape(c, [[x - w, yb], [x + w, yb], [x + w, yb - 7], [x - w, yb - 7]], ALAB, 1.6);
      }
      // the pencil cap
      shape(c, [[x - w * 0.62, top + 52], [x + w * 0.62, top + 52], [x, top]], '#9aa8b4', 2);
      finial(c, x, top, 22);
    }, { t: 4.9 + i * 0.25, d: 1.1, reveal: 'rise', ease: 'inOut' });
  }
}

// ================================================================ the river
function river(p, r) {
  const bands = [['#a9c6cf', HOR], ['#7aa5c3', 1028], ['#4e80b2', 1080], ['#2f639d', 1170], ['#214f89', 1300], ['#1b437a', 1440]];
  p.group('river', { x: PX, y: HOR, w: PW, h: PB - HOR }, (c) => {
    bands.forEach(([col, y0], i) => {
      const y1 = (bands[i + 1] || [0, PB])[1];
      c.fillStyle = col; c.fillRect(PX, y0, PW, y1 - y0 + 1);
      if (i < bands.length - 1) halftone(c, { x: PX, y: y1 - (y1 - y0) * 0.4, w: PW, h: (y1 - y0) * 0.4 }, lerp(5, 12, i / 5), (x, y) => clamp((y - (y1 - (y1 - y0) * 0.4)) / ((y1 - y0) * 0.4)) * 0.8, bands[i + 1][0]);
    });
  }, { t: 3.4, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the ripples: short pale dashes in rows, longer near us
  for (let b = 0; b < 6; b++) {
    const y0 = lerp(HOR + 8, PB, (b / 6) ** 1.4), y1 = lerp(HOR + 8, PB, ((b + 1) / 6) ** 1.4);
    const lines = [];
    for (let y = y0; y < y1; y += lerp(5, 18, b / 6)) {
      const f = (y - HOR) / (PB - HOR);
      for (let k = 0; k < lerp(10, 18, f); k++) {
        const x = r.range(Math.max(PX, LB(y)), Math.min(PX + PW, RB(y))), L = lerp(8, 70, f) * r.range(0.5, 1.2);
        lines.push([[x - L / 2, y], [x - L / 6, y - 2 * f - 1], [x + L / 6, y - 2 * f - 1], [x + L / 2, y]]);
      }
    }
    p.strokes('river', lines, 'rgba(232,240,236,.7)', lerp(1.2, 3.2, b / 6), { t: 8.0 + b * 0.12, d: 0.8, reveal: b % 2 ? 'wipeL' : 'wipe' });
  }

  // the sun's road on the water: ochre dashes widening toward us
  const road = [];
  for (let y = HOR + 6; y < PB; y += lerp(4, 14, (y - HOR) / (PB - HOR))) {
    const f = (y - HOR) / (PB - HOR), half = lerp(20, 210, f);
    for (let k = 0; k < 3 + f * 5; k++) {
      const x = SUN[0] + r.gauss() * half, L = lerp(8, 50, f) * r.range(0.5, 1.2);
      road.push([[x - L / 2, y], [x + L / 2, y]]);
    }
  }
  p.strokes('river', road, GOLD, 3, { t: 8.6, d: 1.0, reveal: 'fall' });
  const far = [[680, 1012, 0.07], [720, 1022, 0.09], [1000, 1016, 0.08], [960, 1032, 0.1], [610, 1040, 0.12]];
  p.group('river', { x: 560, y: 960, w: 500, h: 90 }, (c) => { for (const [x, y, s] of far) felucca(c, x, y, s, x > 840 ? -1 : 1, {}); }, { t: 9.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ Gezira and the Cairo Tower
function gezira(p, r) {
  const isl = [];
  for (let k = 0; k <= 30; k++) { const a = Math.PI + (k / 30) * Math.PI; isl.push([846 + Math.cos(a) * 160, 1058 + Math.sin(a) * 18]); }
  for (let k = 0; k <= 20; k++) { const f = k / 20; isl.push([1006 - f * 320, 1058 + Math.sin(f * Math.PI) * 10]); }
  const trees = [];
  for (let i = 0; i < 26; i++) trees.push([r.range(700, 995), r.range(1040, 1056), r.range(7, 15), r.chance(0.3)]);
  trees.sort((a, b) => a[1] - b[1]);
  p.group('island', { x: 670, y: 970, w: 350, h: 110 }, (c) => {
    shape(c, isl, '#a8a05a', 2);
    for (const [x, y, s, isPalm] of trees) {
      if (isPalm) { palm(c, x, y, s * 3.2, 0.1, rng(Math.round(x)), { n: 9 }); continue; }
      c.fillStyle = PALM_D; c.beginPath(); c.arc(x + 2, y - s * 0.8, s, 0, Math.PI * 2); c.fill();
      c.fillStyle = PALM_L; c.beginPath(); c.arc(x - 1, y - s, s * 0.8, 0, Math.PI * 2); c.fill();
      keyline(c, 1.2); c.beginPath(); c.arc(x + 1, y - s * 0.85, s * 0.95, Math.PI * 0.95, Math.PI * 2.05); c.stroke();
    }
  }, { t: 6.0, d: 0.8, reveal: 'rise' });
  // the tower: a lattice shaft like a lotus stem, opening into the flower at the top
  const x = 846, base = 1050, top = 336;
  p.group('tower', { x: x - 70, y: top - 80, w: 140, h: base - top + 86 }, (c) => {
    const shaft = [[x - 21, base], [x + 21, base], [x + 15, 450], [x - 15, 450]];
    shape(c, shaft, '#d0874f', 0);
    // the lattice of crossing diagonals
    c.save(); poly(c, shaft); c.clip();
    c.fillStyle = '#e8a46a'; c.fillRect(x - 22, 450, 14, base - 450);
    keyline(c, 1.4); c.beginPath();
    for (let y = base + 40; y > 400; y -= 13) { c.moveTo(x - 24, y); c.lineTo(x + 24, y - 26); c.moveTo(x + 24, y); c.lineTo(x - 24, y - 26); }
    c.stroke();
    halftone(c, { x: x + 4, y: 450, w: 22, h: base - 450 }, 5, () => 0.6, 'rgba(23,19,15,.5)');
    c.restore();
    keyline(c, 2.6); poly(c, shaft); c.stroke();
    // the lotus: a flaring crown, two decks and the restaurant ring
    const crown = [[x - 15, 450], [x + 15, 450], [x + 40, 408], [x + 42, 394], [x - 42, 394], [x - 40, 408]];
    shape(c, crown, '#d0874f', 2.4);
    keyline(c, 1.2); c.beginPath(); for (const dx of [-24, -10, 4, 18]) { c.moveTo(x + dx * 0.4, 448); c.lineTo(x + dx, 396); } c.stroke();
    shape(c, [[x - 44, 394], [x + 44, 394], [x + 44, 374], [x - 44, 374]], CREAM, 2.4);
    c.fillStyle = KEY; for (let k = 0; k < 9; k++) c.fillRect(x - 40 + k * 9.4, 379, 5, 10);
    shape(c, [[x - 38, 374], [x + 38, 374], [x + 30, 360], [x - 30, 360]], '#d0874f', 2);
    shape(c, [[x - 30, 360], [x + 30, 360], [x + 30, 348], [x - 30, 348]], CREAM, 2);
    c.fillStyle = KEY; for (let k = 0; k < 6; k++) c.fillRect(x - 26 + k * 9.6, 351, 4.5, 6);
    // the mast
    shape(c, [[x - 6, 348], [x + 6, 348], [x + 3, 300], [x - 3, 300]], '#e6dcc4', 2);
    keyline(c, 2); c.beginPath(); c.moveTo(x, 300); c.lineTo(x, 276); c.stroke();
    c.fillStyle = TERRA; c.beginPath(); c.arc(x, 274, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
  }, { t: 6.4, d: 1.8, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the west bank: palms and a village
function westBank(p, r) {
  const land2 = [[RB(HOR + 2), HOR + 2], [PX + PW + 10, HOR + 2], [PX + PW + 10, 1430]];
  for (let y = 1430; y >= HOR + 2; y -= 10) land2.push([RB(y), y]);
  p.group('westbank', boxOf(land2, 4), (c) => {
    shape(c, land2, '#c9b26a', 2.2);
    // fields in strips
    c.save(); poly(c, land2); c.clip();
    for (let k = 0; k < 9; k++) {
      const y = HOR + 6 + k * k * 4.5;
      c.fillStyle = k % 2 ? '#9fae5c' : '#b8b866'; c.fillRect(PX, y, PW + 20, (k + 1) * 6);
    }
    halftone(c, { x: 870, y: HOR, w: 640, h: 430 }, 8, (x, y) => clamp((y - HOR) / 400) * 0.5, 'rgba(47,107,74,.5)');
    c.strokeStyle = 'rgba(47,77,40,.45)'; c.lineWidth = 1.4; c.beginPath();
    for (let k = 0; k < 26; k++) { const xb = 1000 + k * 34; c.moveTo(1040, HOR + 4); c.lineTo(xb + (xb - 1040) * 1.2, 1440); }
    c.stroke();
    c.restore();
    keyline(c, 2.2); poly(c, land2); c.stroke();
  }, { t: 3.8, d: 0.9, reveal: 'fade' });
  // a far row of palms and low houses, then nearer, bigger ones
  const rows = [[1008, 0.35, 34], [1024, 0.5, 24], [1046, 0.7, 14]];
  rows.forEach(([y, s, n], k) => {
    const items = [];
    for (let i = 0; i < n; i++) {
      const x = r.range(RB(y) + 20, PX + PW + 10);
      items.push(r.chance(0.65) ? { palm: true, x, h: r.range(60, 110) * s, lean: r.range(-0.25, 0.25), seed: r.int(1, 9999) } : { x, w: r.range(30, 60) * s, h: r.range(24, 40) * s, col: r.pick([CREAM, '#e9d4a8', TERRA_L, '#d8c49a']) });
    }
    items.sort((a, b) => (a.palm ? 1 : 0) - (b.palm ? 1 : 0));
    // in runs of eight, a beat apart, so no one frame draws a whole row of palms
    for (let j = 0; j * 8 < items.length; j++) {
      const run = items.slice(j * 8, j * 8 + 8);
      p.group('westbank', { x: RB(y) - 40, y: y - 140 * s - 30, w: PX + PW - RB(y) + 60, h: 140 * s + 40 }, (c) => {
        for (const it of run) {
          if (it.palm) { palm(c, it.x, y, it.h, it.lean, rng(it.seed), { n: 9 }); continue; }
          shape(c, [[it.x, y], [it.x + it.w, y], [it.x + it.w, y - it.h], [it.x, y - it.h]], it.col, 1.6);
          c.fillStyle = KEY; for (let q = 0; q < it.w / 12; q++) c.fillRect(it.x + 4 + q * 12, y - it.h * 0.7, 4, 6);
        }
      }, { t: 7.2 + k * 0.3 + j * 0.02, d: 0.8, reveal: 'rise' });
    }
  });
}

// ================================================================ the east bank: the old city
function eastBank(p, r) {
  // the land, under everything on this side
  const land = [[PX - 10, HOR - 2], [LB(HOR + 2), HOR - 2]];
  for (let y = HOR; y <= PB + 10; y += 10) land.push([LB(y), y]);
  land.push([PX - 10, PB + 10]);
  p.group('hill', boxOf(land, 4), (c) => shape(c, land, '#d2b47c', 2.2), { t: 3.9, d: 0.8, reveal: 'fade' });

  // Sultan Hassan: a cliff of a mosque, its deep cornice, the tallest minaret and the dome
  const sx = 545, sg = 1036;
  p.group('city', { x: sx - 110, y: 590, w: 240, h: sg - 590 + 8 }, (c) => {
    mamluk(c, sx + 74, sg - 100, 300, 26, { col: '#e2c494' });
    stoneDome(c, sx - 30, 900, 92, 92, 'plain', '#d7b27c');
    shape(c, [[sx - 96, sg], [sx + 60, sg], [sx + 60, 906], [sx - 96, 906]], '#e6c896', 2.4);
    c.fillStyle = 'rgba(23,19,15,.16)'; c.fillRect(sx + 10, 906, 50, sg - 906);
    // the muqarnas cornice
    shape(c, [[sx - 100, 906], [sx + 64, 906], [sx + 64, 896], [sx - 100, 896]], '#d3ad74', 1.8);
    c.fillStyle = KEY; for (let x = sx - 96; x < sx + 60; x += 8) c.fillRect(x, 899, 4, 5);
    // tall recessed panels with windows
    for (let k = 0; k < 5; k++) {
      const x = sx - 86 + k * 29;
      c.fillStyle = 'rgba(23,19,15,.2)'; c.fillRect(x, 918, 18, 100);
      c.fillStyle = KEY; for (const yy of [930, 966, 996]) { c.beginPath(); archish(c, x + 5, yy, 8, 16); c.fill(); }
    }
    // the great portal
    shape(c, [[sx + 30, sg], [sx + 56, sg], [sx + 56, 930], [sx + 30, 930]], '#d3ad74', 1.8);
    c.fillStyle = KEY; c.beginPath(); archish(c, sx + 36, 950, 14, 86); c.fill();
  }, { t: 5.0, d: 1.2, reveal: 'rise', ease: 'inOut' });

  // the rooftops of the old city, row on row toward the river, with minarets
  // and domes among them
  const rows = [[1040, 0.42], [1078, 0.55], [1126, 0.72], [1188, 0.9], [1262, 1.1], [1350, 1.3]];
  const kinds = [CREAM, '#ead3a2', TERRA_L, '#dcc08c', '#e8dcc0', '#c9a874', '#b9c3b8'];
  rows.forEach(([y, s], k) => {
    const items = [];
    const xe = LB(y) - 8;
    for (let x = PX - 30 + r() * 20; x < xe;) {
      const w = r.range(40, 90) * s, h = r.range(40, 90) * s;
      if (k < 4 && r.chance(0.17)) { items.push({ k: 'minaret', x: x + w / 2, h: r.range(180, 280) * s, w: 22 * s, dbl: r.chance(0.25) }); }
      if (k < 4 && r.chance(0.14)) { items.push({ k: 'dome', x: x + w / 2, w: w * 0.8, h: w * 0.9, carve: r.pick(['zigzag', 'net']), hh: h }); }
      if (k >= 2 && r.chance(0.14)) { items.push({ k: 'palm', x: x + w / 2, h: r.range(120, 180) * s, lean: r.range(-0.2, 0.2), seed: r.int(1, 9999) }); }
      items.push({ k: 'house', x, w: Math.min(w, xe - x), h, col: r.pick(kinds), mash: r.chance(0.35), tank: r.chance(0.3), coop: k > 1 && r.chance(0.08), line: r.chance(0.15) });
      x += w + r.range(-4, 2) * s;
    }
    // houses first, then the tall things over the row behind but behind the next row
    const order = [...items.filter((i) => i.k === 'minaret' || i.k === 'dome'), ...items.filter((i) => i.k === 'house'), ...items.filter((i) => i.k === 'palm')];
    p.group(k < 1 ? 'city' : 'near', { x: PX - 40, y: y - 340 * s, w: LB(y) - PX + 60, h: 340 * s + 30 }, (c) => {
      const rr = rng(300 + k);
      for (const it of order) {
        if (it.k === 'minaret') { mamluk(c, it.x, y - 20 * s, it.h, it.w, { double: it.dbl }); continue; }
        if (it.k === 'dome') { stoneDome(c, it.x, y - it.hh - 12 * s, it.w, it.h, it.carve); continue; }
        if (it.k === 'palm') { palm(c, it.x, y + 4, it.h, it.lean, rng(it.seed)); continue; }
        house(c, it, y, s, rr);
      }
    }, { t: 5.4 + k * 0.32, d: 0.8, reveal: 'rise' });
  });

  // the corniche along the east bank: a stone wall and lamp posts receding
  const wall = [];
  for (let y = HOR + 2; y <= PB + 10; y += 10) wall.push([LB(y), y]);
  for (let y = PB + 10; y >= HOR + 2; y -= 10) wall.push([LB(y) + lerp(1, 16, (y - HOR) / 540), y + lerp(0.5, 8, (y - HOR) / 540)]);
  p.group('near', boxOf(wall, 4), (c) => {
    shape(c, wall, '#e6d2a6', 1.8);
    for (let y = 1030; y < PB; y += lerp(18, 70, (y - HOR) / 540)) {
      const s = (y - HOR) / 470, x = LB(y);
      keyline(c, lerp(1, 3.4, s)); c.beginPath(); c.moveTo(x - 2, y); c.lineTo(x - 2, y - 80 * s); c.lineTo(x + 8 * s, y - 84 * s); c.stroke();
      c.fillStyle = CREAM; c.beginPath(); c.arc(x + 10 * s, y - 80 * s, 4 * s + 1, 0, Math.PI * 2); c.fill(); keyline(c, lerp(0.8, 2, s)); c.stroke();
    }
  }, { t: 7.6, d: 1.0, reveal: 'fall' });
}

function house(c, it, y, s, rr) {
  const { x, w, h, col } = it;
  shape(c, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], col, Math.max(1.2, 2 * s));
  // the shaded side
  c.fillStyle = 'rgba(23,19,15,.13)'; c.fillRect(x + w * 0.78, y - h, w * 0.22, h);
  // a parapet
  c.fillStyle = mix(col, KEY, 0.12); c.fillRect(x - 1, y - h - 3 * s, w + 2, 3 * s);
  // windows: shutters and small dark openings
  const cols = Math.max(1, Math.floor(w / (18 * s))), rows = Math.max(1, Math.floor(h / (22 * s)));
  for (let rI = 0; rI < rows; rI++) for (let q = 0; q < cols; q++) {
    const wx = x + (q + 0.5) * (w / cols) - 4 * s, wy = y - h + 8 * s + rI * 22 * s;
    if (wy + 12 * s > y - 2) continue;
    const roll = rr();
    c.fillStyle = roll < 0.25 ? TURQ : roll < 0.45 ? '#6b8a5c' : KEY;
    c.fillRect(wx, wy, 8 * s, 12 * s);
  }
  // a mashrabiya: a projecting box of wooden lattice
  if (it.mash && w > 30 * s) {
    const mx = x + w * 0.3, my = y - h * 0.75, mw = w * 0.36, mh = h * 0.36;
    shape(c, [[mx, my + mh], [mx + mw, my + mh], [mx + mw, my], [mx, my]], '#7a4a2c', 1.4);
    c.strokeStyle = '#c9925a'; c.lineWidth = Math.max(0.6, s); c.beginPath();
    for (let gx = mx + 3 * s; gx < mx + mw; gx += 4 * s) { c.moveTo(gx, my + 2); c.lineTo(gx, my + mh - 2); }
    for (let gy = my + 3 * s; gy < my + mh; gy += 4 * s) { c.moveTo(mx + 2, gy); c.lineTo(mx + mw - 2, gy); }
    c.stroke();
  }
  // a water tank on the roof, or a pigeon tower, or washing on a line
  if (it.tank) { shape(c, [[x + w * 0.6, y - h - 3 * s], [x + w * 0.8, y - h - 3 * s], [x + w * 0.8, y - h - 14 * s], [x + w * 0.6, y - h - 14 * s]], '#9aa8b4', 1); }
  if (it.coop) {
    const cx = x + w * 0.3, top = y - h - 60 * s;
    shape(c, [[cx - 10 * s, y - h], [cx + 10 * s, y - h], [cx + 7 * s, top], [cx - 7 * s, top]], '#b98a56', 1.2);
    c.strokeStyle = KEY; c.lineWidth = 0.8; c.beginPath();
    for (let gy = y - h - 8 * s; gy > top; gy -= 6 * s) { c.moveTo(cx - 9 * s, gy); c.lineTo(cx + 9 * s, gy); }
    c.moveTo(cx - 14 * s, top); c.lineTo(cx + 14 * s, top); c.stroke();
  }
  if (it.line) {
    c.strokeStyle = KEY; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 4, y - h - 10 * s); c.quadraticCurveTo(x + w / 2, y - h - 4 * s, x + w - 4, y - h - 10 * s); c.stroke();
    for (let k = 1; k < 4; k++) { c.fillStyle = [TERRA, TURQ, CREAM, OCHRE][k]; c.fillRect(x + (k * w) / 4 - 3 * s, y - h - 8 * s, 6 * s, 7 * s); }
  }
}

// ================================================================ the near banks: big palms, reeds, people, egrets
function foreground(p, r) {
  // reeds and papyrus along both banks
  const reeds = [];
  for (let y = HOR + 10; y < PB; y += 4) {
    const f = (y - HOR) / (PB - HOR);
    for (const bank of [LB, RB]) {
      if (r.chance(0.6)) {
        const x = bank(y) + (bank === LB ? 18 : -6) * f + r.range(-4, 4), L = lerp(4, 46, f) * r.range(0.6, 1.2), a = r.range(-0.4, 0.4) + (bank === LB ? 0.15 : -0.15);
        reeds.push([[x, y], [x + Math.sin(a) * L, y - Math.cos(a) * L]]);
      }
    }
  }
  p.strokes('palms', reeds, PALM_D, 2, { t: 8.2, d: 0.8, reveal: 'rise' });
  // papyrus heads at the nearest reeds
  const heads = reeds.filter(([[, y]]) => y > 1300 && r.chance(0.18)).map(([, top]) => top);
  p.group('palms', boxOf(heads.length ? heads : [[0, 0]], 30), (c) => {
    for (const [x, y] of heads) {
      c.fillStyle = PALM_L; c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + (k / 8 - 0.5) * 2.2; c.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 12); }
      c.closePath(); c.fill(); keyline(c, 1.2); c.stroke();
    }
  }, { t: 8.6, d: 0.6, reveal: 'pop' });
  // the great palms that frame the view
  const big = [[138, 1560, 470, 0.2], [250, 1560, 300, 0.5], [1478, 1560, 920, -0.1], [1396, 1560, 360, -0.42]];
  big.forEach(([x, y, h, lean], i) => {
    const top = [x + lean * h * 0.3, y - h];
    p.group('palms', { x: Math.min(x, top[0]) - h * 0.55, y: top[1] - h * 0.45, w: Math.abs(top[0] - x) + h * 1.1, h: h * 1.5 }, (c) => palm(c, x, y, h, lean, rng(70 + i), { n: 15 }),
      { t: 8.0 + i * 0.22, d: 1.1, reveal: 'rise', ease: 'inOut' });
  });
  // people on the corniche and on the west bank, and egrets in the shallows
  p.group('near', { x: PX, y: 1180, w: PW, h: 360 }, (c) => {
    figure(c, LB(1300) - 40, 1300, 0.9, CREAM, '#7a4a2c');
    figure(c, LB(1300) - 70, 1302, 0.85, LAPIS_L, '#5a3a22', true);
    figure(c, LB(1420) - 60, 1420, 1.15, TERRA_L, '#6a4228');
    figure(c, RB(1250) + 60, 1250, 0.8, '#f2ead8', '#7a4a2c');
    for (const [x, y, s] of [[LB(1240) + 26, 1244, 0.7], [RB(1340) - 40, 1344, 0.9], [RB(1210) - 18, 1212, 0.6]]) egret(c, x, y, s);
    rowboat(c, LB(1190) + 90, 1190, 0.55, TERRA);
    rowboat(c, RB(1290) - 150, 1290, 0.75, TURQ);
  }, { t: 9.0, d: 0.7, reveal: 'drop', dy: 12 });
}

function figure(c, x, y, s, robe, skin, veil) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // a long galabeya, a head, a turban or scarf
  shape(c, [[-11, 0], [11, 0], [7, -46], [-7, -46]], robe, 2);
  c.fillStyle = skin; c.beginPath(); c.arc(0, -54, 7, 0, Math.PI * 2); c.fill(); keyline(c, 1.6); c.stroke();
  c.fillStyle = veil ? robe : CREAM;
  if (veil) { c.beginPath(); c.moveTo(-9, -44); c.quadraticCurveTo(-10, -66, 0, -64); c.quadraticCurveTo(10, -66, 9, -44); c.fill(); c.stroke(); }
  else { c.beginPath(); c.ellipse(0, -60, 8, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.restore();
}

// a fisherman's rowboat, a net over the side
function rowboat(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  shape(c, [[-60, -14], [62, -16], [48, 2], [-46, 2]], col, 2.4);
  shape(c, [[-58, -14], [60, -16], [58, -11], [-56, -9]], CREAM, 1.4);
  figure(c, 6, -12, 0.7, '#f2ead8', '#7a4a2c');
  keyline(c, 2.4); c.beginPath(); c.moveTo(-10, -26); c.lineTo(-56, 10); c.moveTo(22, -26); c.lineTo(70, 10); c.stroke();
  c.strokeStyle = 'rgba(23,19,15,.6)'; c.lineWidth = 1; c.beginPath();
  for (let k = 0; k < 6; k++) { c.moveTo(-40 + k * 6, -12); c.lineTo(-52 + k * 8, 8); }
  c.stroke();
  c.restore();
}

function egret(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  keyline(c, 1.6);
  c.beginPath(); c.moveTo(-2, 0); c.lineTo(-1, -16); c.moveTo(3, 0); c.lineTo(2, -16); c.stroke();
  c.fillStyle = '#fbf6ea'; c.beginPath(); c.ellipse(0, -22, 12, 7, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(8, -26); c.quadraticCurveTo(16, -34, 10, -40); c.quadraticCurveTo(8, -44, 14, -46); c.lineWidth = 3.4; c.strokeStyle = KEY; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#fbf6ea'; c.stroke();
  c.fillStyle = OCHRE; poly(c, [[14, -47], [26, -45], [14, -44]]); c.fill();
  c.restore();
}

// a felucca drawn once to its own canvas at twice the sheet's scale, so the live
// layer only has to place it
function sprite(b) {
  if (b.img) return b.img;
  const R = 2, x0 = (b.dir > 0 ? -175 : -135) * b.s - 6, y0 = -360 * b.s - 6;
  const w = 312 * b.s + 12, h = 380 * b.s + 12;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * R); cv.height = Math.ceil(h * R);
  const c = cv.getContext('2d'); c.scale(R, R); c.translate(-x0, -y0);
  felucca(c, 0, 0, b.s, b.dir, b);
  return (b.img = { cv, x0, y0, w: cv.width / R, h: cv.height / R });
}

// ================================================================ life: feluccas, kites and egrets, the glitter
function life(p, r) {
  const boats = [
    { x: 1010, y: 1470, s: 0.95, dir: 1, sp: 5, sail: CREAM, hull: LAPIS, band: OCHRE },
    { x: 610, y: 1290, s: 0.5, dir: -1, sp: -3, sail: '#f3e2c0', hull: TERRA, band: CREAM },
    { x: 780, y: 1150, s: 0.26, dir: 1, sp: 2, sail: CREAM, hull: PALM, band: OCHRE },
    { x: 910, y: 1105, s: 0.17, dir: -1, sp: -1.2, sail: '#f3e2c0', hull: LAPIS, band: TERRA },
  ];
  // the far ones first, so the near ones sail over them
  p.live('boats', {
    t: 9.4, d: 1.4, reveal: 'slide', dx: 60,
    draw: (c, time) => {
      for (let i = boats.length - 1; i >= 0; i--) {
        const b = boats[i];
        const x = b.x + Math.sin(time * 0.05 + i) * 30 + Math.min(time, 120) * b.sp * 0.25;
        const y = b.y + Math.sin(time * 1.2 + i * 1.7) * 2.2 * b.s;
        // its shadow on the water
        c.fillStyle = 'rgba(16,40,70,.35)'; c.beginPath(); c.ellipse(x, y + 10 * b.s, 120 * b.s, 9 * b.s, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(x, y); c.rotate(Math.sin(time * 1.1 + i) * 0.015);
        const sp = sprite(b);
        c.drawImage(sp.cv, sp.x0, sp.y0, sp.w, sp.h);
        c.restore();
      }
    },
  });
  // black kites circling high over the city, egrets flying low
  const kites = [];
  for (let i = 0; i < 7; i++) kites.push({ cx: r.range(250, 1350), cy: r.range(220, 560), R: r.range(40, 110), w: r.range(0.3, 0.6) * (r.chance(0.5) ? 1 : -1), ph: r() * 7, s: r.range(0.7, 1.3) });
  const egrets = [];
  for (let i = 0; i < 5; i++) egrets.push({ y: r.range(1080, 1180), ph: r() * 1700, s: r.range(0.5, 0.8) });
  p.live('birds', {
    t: 9.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = KEY;
      for (const k of kites) {
        const a = time * k.w + k.ph, x = k.cx + Math.cos(a) * k.R, y = k.cy + Math.sin(a) * k.R * 0.45;
        const tilt = Math.sin(a) * 0.25, s = k.s;
        c.save(); c.translate(x, y); c.rotate(tilt + (k.w > 0 ? 0 : Math.PI) * 0); c.scale(s, s);
        c.beginPath(); c.moveTo(-26, -3); c.quadraticCurveTo(-12, -9, -4, -2); c.lineTo(-3, 6); c.lineTo(-6, 14); c.lineTo(0, 11); c.lineTo(6, 14); c.lineTo(3, 6); c.lineTo(4, -2); c.quadraticCurveTo(12, -9, 26, -3); c.quadraticCurveTo(12, -3, 0, 2); c.quadraticCurveTo(-12, -3, -26, -3); c.fill();
        c.restore();
      }
      for (const e of egrets) {
        const x = PX + ((time * 30 + e.ph) % (PW + 200)) - 100, y = e.y + Math.sin(time * 0.8 + e.ph) * 6;
        const fl = Math.sin(time * 5 + e.ph) * 6 * e.s;
        c.fillStyle = '#fbf6ea'; keyline(c, 1.2);
        c.beginPath(); c.ellipse(x, y, 12 * e.s, 4 * e.s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - 4 * e.s, y); c.lineTo(x - 2 * e.s, y - 14 * e.s - fl); c.lineTo(x + 6 * e.s, y); c.closePath(); c.fill(); c.stroke();
      }
    },
  });
  // glitter on the sun's road
  const gl = [];
  for (let i = 0; i < 90; i++) {
    const y = HOR + 8 + r() ** 1.3 * (PB - HOR - 10), f = (y - HOR) / (PB - HOR);
    gl.push([SUN[0] + r.gauss() * lerp(20, 200, f), y, r() * 7, lerp(6, 36, f)]);
  }
  p.live('river', {
    t: 9.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#fff3c8';
      for (const [x, y, ph, L] of gl) {
        const a = Math.sin(time * 2.1 + ph * 3);
        if (a < 0.35) continue;
        c.globalAlpha = (a - 0.35) * 1.5; c.fillRect(x - L / 2, y - 1.5, L, 3);
      }
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ the title slab
function title(p, r) {
  const x0 = PX, y0 = 1560, x1 = PX + PW, y1 = 1904;
  p.group('slab', { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (c) => {
    c.fillStyle = KEY; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }, { t: 10.2, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the mashrabiya band: turned beads and spindles in a lattice
  const my = y0 + 18, mh = 40;
  p.group('slab', { x: x0, y: my - 4, w: x1 - x0, h: mh + 8 }, (c) => {
    c.fillStyle = OCHRE; c.fillRect(x0 + 18, my - 4, x1 - x0 - 36, 3); c.fillRect(x0 + 18, my + mh + 1, x1 - x0 - 36, 3);
    c.strokeStyle = OCHRE; c.lineWidth = 2.2; c.beginPath();
    const st = 20;
    for (let x = x0 + 28; x <= x1 - 28; x += st) { c.moveTo(x, my + 2); c.lineTo(x, my + mh - 2); }
    for (const yy of [my + mh / 2]) { c.moveTo(x0 + 28, yy); c.lineTo(x1 - 28, yy); }
    for (let x = x0 + 28; x < x1 - 28; x += st) { c.moveTo(x, my + mh / 2); c.lineTo(x + st / 2, my + 4); c.lineTo(x + st, my + mh / 2); c.lineTo(x + st / 2, my + mh - 4); c.closePath(); }
    c.stroke();
    c.fillStyle = GOLD;
    for (let x = x0 + 28; x <= x1 - 28; x += st) { c.beginPath(); c.ellipse(x, my + mh / 2, 4, 5.5, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = TERRA;
    for (let x = x0 + 28 + st / 2; x < x1 - 28; x += st) { c.beginPath(); c.arc(x, my + mh / 2, 2.6, 0, Math.PI * 2); c.fill(); }
  }, { t: 10.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // CAIRO in a heavy slab serif, printed a little off register
  p.type('title', 'CAIRO', 140, 1862, {
    family: '"Alfa Slab One", serif', weight: 400, size: 230, color: OCHRE, shadow: TERRA, sx: 7, sy: 7,
    track: 0.03, t: 11.0, gap: 0.16, d: 0.7, reveal: 'drop', fit: 820,
  });
  // القاهرة, set whole so the letters join, wiped in from the right as it is read
  const ax = 1456, ay = 1792;
  p.group('title', { x: 1000, y: ay - 150, w: ax - 1000 + 16, h: 200 }, (c) => {
    c.font = '700 128px "Reem Kufi", sans-serif'; c.direction = 'rtl'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillStyle = LAPIS_L; c.fillText('القاهرة', ax + 5, ay + 5);
    c.fillStyle = SAND; c.fillText('القاهرة', ax, ay);
  }, { t: 12.0, d: 1.1, reveal: 'wipeL', ease: 'inOut' });
  p.type('title', 'ON THE NILE · EGYPT', ax, 1862, {
    family: '"Alfa Slab One", serif', weight: 400, size: 26, color: TURQ, track: 0.24, align: 'right', t: 12.7, gap: 0.025, d: 0.5, reveal: 'fade',
  });
  // a small sun stamped beside the name
  p.group('title', { x: 1030, y: 1710, w: 60, h: 60 }, (c) => {
    c.fillStyle = GOLD; c.beginPath(); c.arc(1060, 1740, 14, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(1060 + Math.cos(a) * 19, 1740 + Math.sin(a) * 19); c.lineTo(1060 + Math.cos(a) * 26, 1740 + Math.sin(a) * 26); }
    c.stroke();
  }, { t: 13.2, d: 0.6, reveal: 'pop' });
}
