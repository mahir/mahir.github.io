// Kuala Lumpur: a hand-drawn batik. The canting draws everything first in wax on
// the bare cloth, then the dyes come in, brushed and blended as Malaysian batik is:
// an indigo night going to magenta and orange low down, the Petronas Towers in
// silvered turquoise with their setbacks, pinnacles and skybridge, the KL Tower in
// turmeric, the Sultan Abdul Samad Building in brick red with white bands and
// copper domes, royal palms, and big hibiscus with their leaves in the corners.
// Trailing-cloud spirals and wax dots fill the sky; a crackle of fine dark veins
// runs through it all where the wax broke. Bamboo-shoot triangles make the head
// of the cloth below the name.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix } from '../kit.js';

const CLOTH = '#f4e8cf', WAX = '#f2d79a', INDIGO = '#17204a', NIGHT = '#0f1534';
const RED = '#a8242f', MAG = '#c23a6e', TURM = '#e2a62a', TEAL = '#2f8b7a', LEAF = '#22665a';
const FACE = '"Coiny", system-ui';
const TITLE = 'KUALA LUMPUR';

export const city = {
  id: 'kuala-lumpur', name: 'Kuala Lumpur', wall: '#141a36',
  alt: "A batik of Kuala Lumpur drawn in pale wax lines on dyed cloth: the Petronas Towers with their setbacks, pinnacles and skybridge against an indigo night going to turquoise, the KL Tower in turmeric yellow, the Sultan Abdul Samad Building's brick arcades, clock tower and copper domes, royal palms, hibiscus flowers and leaves in the corners, trailing spiral clouds, a full moon and wax dots in the sky, a fine crackle through the dye, swiftlets crossing, and the name on a magenta band over a row of bamboo-shoot triangles",
  google: 'family=Coiny',
  fonts: [['400 100px "Coiny"', 'KUALA LUMPUR · MALAYSIA ·']],
  build,
};

// the picture field inside the border, and the bands below it
const FX0 = 64, FX1 = W - 64, FY0 = 64, FY1 = 1600;
const GROUND = 1560;         // the building's foot
const TL = 612, TR = 988;    // the two towers' axes
const TBASE = 1420, TTOP = 650;

function build() {
  const p = new Plate({ paper: CLOTH, seed: 1998 });
  const r = p.r;
  p.stack('sky', 'clouds', 'cloudWax', 'far', 'farWax', 'towers', 'towerWax', 'hall', 'hallWax', 'flora', 'floraWax', 'crackle', 'band', 'bandWax', 'shadow', 'title', 'life');
  for (const n of ['band', 'bandWax', 'shadow']) p.layer(n, { clip: false });
  p.layer('title', { clip: false });
  p.clip = { x: FX0, y: FY0, w: FX1 - FX0, h: FY1 - FY0 };

  sky(p, r);
  clouds(p, r);
  klTower(p, r);
  petronas(p, r);
  hall(p, r);
  flora(p, r);
  crackle(p, r);
  bands(p, r);
  title(p, r);
  life(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ wax and dye
// a line drawn by hand with the canting: small wobbles along it
function hand(r, pts, amp = 1.2, step = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) out.push([lerp(ax, bx, k / n) + r.range(-amp, amp), lerp(ay, by, k / n) + r.range(-amp, amp)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const closed = (pts) => [...pts, pts[0]];
function lines(c, ls) { c.beginPath(); for (const l of ls) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); } }
// wax as a pen: the outline of a thing, drawn on
function waxPen(p, layer, pts, t, d, w = 3.2, col = WAX) { return p.pen(layer, pts, col, w, { t, d }); }
// many wax lines at once
function waxLines(p, layer, ls, t, d, w = 2, reveal = 'fall', col = WAX) { return p.strokes(layer, ls, col, w, { t, d, reveal }); }
function spiral(cx, cy, r0, turns, dir = 1, a0 = 0) {
  const pts = [], n = Math.round(turns * 28);
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, rr = r0 * (1 - t * 0.86); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}

// ================================================================ the sky
function sky(p, r) {
  const streaks = [];
  for (let y = FY0; y < GROUND; y += r.range(5, 12)) streaks.push([y, r.range(-0.06, 0.06), r.range(4, 12)]);
  p.group('sky', { x: FX0, y: FY0, w: FX1 - FX0, h: FY1 - FY0 }, (c) => {
    const g = c.createLinearGradient(0, FY0, 0, GROUND);
    g.addColorStop(0, NIGHT); g.addColorStop(0.35, INDIGO); g.addColorStop(0.62, '#263c86'); g.addColorStop(0.8, '#22648e'); g.addColorStop(0.92, '#2f9294'); g.addColorStop(1, '#6cc0a4');
    c.fillStyle = g; c.fillRect(FX0, FY0, FX1 - FX0, FY1 - FY0);
    // the brush went across in strokes: faint bands of more and less dye
    for (const [y, k, h] of streaks) { c.fillStyle = k > 0 ? `rgba(10,12,40,${k})` : `rgba(255,230,200,${-k * 0.7})`; c.fillRect(FX0, y, FX1 - FX0, h); }
  }, { t: 4.2, d: 1.8, reveal: 'fall', ease: 'inOut' });
  // a scatter of wax dots, as the cloth is filled between motifs
  const dots = [];
  for (let i = 0; i < 900; i++) {
    const x = r.range(FX0 + 10, FX1 - 10), y = r.range(FY0 + 10, 1250);
    if (Math.abs(x - 800) < 330 && y > 300) continue;
    dots.push([x, y, r.range(1.2, 2.6)]);
  }
  p.group('sky', { x: FX0, y: FY0, w: FX1 - FX0, h: 1260 - FY0 }, (c) => {
    c.fillStyle = 'rgba(246,226,176,.75)'; c.beginPath();
    for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
  }, { t: 6.4, d: 1.4, reveal: 'fall' });
  // a full moon of wax, ringed
  const mx = 1290, my = 330;
  p.group('sky', { x: mx - 120, y: my - 120, w: 240, h: 240 }, (c) => {
    c.fillStyle = '#f3dca2'; c.beginPath(); c.arc(mx, my, 74, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(246,226,176,.8)'; c.lineWidth = 2;
    for (const rr of [88, 100]) { c.beginPath(); c.arc(mx, my, rr, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = 'rgba(246,226,176,.8)';
    for (let k = 0; k < 36; k++) { const a = k * Math.PI / 18; c.beginPath(); c.arc(mx + Math.cos(a) * 112, my + Math.sin(a) * 112, 2.6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(226,166,42,.35)'; c.beginPath(); c.arc(mx - 18, my + 12, 30, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(mx + 26, my - 22, 16, 0, Math.PI * 2); c.fill();
  }, { t: 5.6, d: 1.0, reveal: 'iris' });
}

// trailing clouds: the awan larat, spirals that unroll from a stem
function clouds(p, r) {
  const groups = [
    [180, 330, 1, 0.9], [420, 200, -1, 0.75], [250, 720, 1, 1.0], [1320, 640, -1, 0.95], [1420, 980, 1, 0.8], [170, 1060, -1, 0.85],
  ];
  groups.forEach(([cx, cy, dir, s], gi) => {
    const fills = [], wax = [];
    // a main spiral and two little ones curling off a tail
    const main = spiral(cx, cy, 62 * s, 1.6, dir, gi);
    const tail = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24; tail.push([cx + dir * (60 + 160 * t) * s, cy + 40 * s * Math.sin(t * Math.PI * 1.2) + 20 * t * s]); }
    const sm1 = spiral(tail[12][0], tail[12][1] - 28 * s, 26 * s, 1.3, -dir, 1);
    const sm2 = spiral(tail[24][0] + dir * 22 * s, tail[24][1] - 10 * s, 20 * s, 1.2, dir, 2);
    // the cloud's body, dyed turquoise, behind the lines
    const body = [];
    for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; body.push([cx + Math.cos(a) * 70 * s, cy + Math.sin(a) * 66 * s]); }
    fills.push(body);
    const band = [...tail.map(([x, y]) => [x, y - 16 * s]), ...tail.slice().reverse().map(([x, y]) => [x, y + 14 * s])];
    fills.push(band);
    p.group('clouds', boxOf([...body, ...band, ...sm1, ...sm2], 30), (c) => {
      c.fillStyle = gi % 2 ? 'rgba(47,139,122,.85)' : 'rgba(64,120,170,.8)';
      for (const f of fills) { poly(c, f); c.fill(); }
      c.beginPath(); c.arc(sm1[0][0] - (sm1[0][0] - tail[12][0]) * 0.5, sm1[0][1] + 6 * s, 26 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(tail[24][0] + dir * 20 * s, tail[24][1] - 8 * s, 22 * s, 0, Math.PI * 2); c.fill();
    }, { t: 6.0 + gi * 0.12, d: 0.9, reveal: 'fade' });
    wax.push(hand(r, main, 0.8, 8), hand(r, tail, 0.8), hand(r, sm1, 0.6, 6), hand(r, sm2, 0.6, 6));
    wax.forEach((l, k) => waxPen(p, 'cloudWax', l, 1.2 + gi * 0.2 + k * 0.1, 0.9, 3));
    // a fringe of dots along the tail
    const fr = tail.filter((_, k) => k % 2 === 0).map(([x, y]) => [[x, y + 24 * s], [x + 0.1, y + 24 * s]]);
    waxLines(p, 'cloudWax', fr, 7.0 + gi * 0.1, 0.6, 4.5, 'wipe');
  });
}

// ================================================================ the KL Tower
function klTower(p, r) {
  const x = 300, foot = 1440, podY = 640, podH = 96;
  const shaft = [[x - 19, foot], [x - 12, podY + podH], [x + 12, podY + podH], [x + 19, foot]];
  const pod = [];
  for (let k = 0; k <= 30; k++) { const t = k / 30, a = Math.PI * t; pod.push([x - Math.sin(a) * 58 * (t < 0.5 ? 1 : 0.9), podY + t * podH]); }
  const podL = [...pod, ...pod.slice().reverse().map(([px, py]) => [2 * x - px, py])];
  const mast = [[x - 5, podY], [x - 3, 420], [x, 300], [x + 3, 420], [x + 5, podY]];
  p.group('far', boxOf([...shaft, ...podL, ...mast], 8), (c) => {
    const g = c.createLinearGradient(x - 20, 0, x + 20, 0);
    g.addColorStop(0, '#b4741e'); g.addColorStop(0.5, TURM); g.addColorStop(1, '#a8661a');
    c.fillStyle = g; poly(c, shaft); c.fill();
    c.fillStyle = TURM; poly(c, podL); c.fill();
    c.fillStyle = '#c9862a'; poly(c, mast); c.fill();
    c.fillStyle = MAG; c.fillRect(x - 54, podY + 34, 108, 26);
  }, { t: 4.8, d: 1.2, reveal: 'rise' });
  // its wax: outline, rings round the pod, bands down the shaft
  waxPen(p, 'farWax', hand(r, closed(shaft), 0.6), 0.6, 1.1, 2.6);
  waxPen(p, 'farWax', hand(r, closed(podL), 0.5, 6), 0.9, 1.0, 2.6);
  waxPen(p, 'farWax', mast, 1.1, 0.8, 2.2);
  const rings = [];
  for (const y of [podY + 18, podY + 34, podY + 60, podY + 78]) { const w = 56 * Math.sin(Math.PI * clamp((y - podY) / podH, 0.05, 0.95)); rings.push([[x - w, y], [x + w, y]]); }
  for (let y = podY + podH + 30; y < foot; y += 34) { const w = lerp(12, 19, (y - podY - podH) / (foot - podY - podH)); rings.push([[x - w, y], [x + w, y]]); }
  rings.push([[x, podY + podH], [x, foot]]);
  waxLines(p, 'farWax', rings, 6.2, 1.0, 1.6);
}

// ================================================================ the Petronas Towers
function towerShape(cx) {
  // the shaft, then six setbacks, then the ring and the pinnacle
  const tiers = [[TTOP, 216], [TTOP - 52, 200], [TTOP - 102, 182], [TTOP - 148, 160], [TTOP - 190, 134], [TTOP - 226, 106], [TTOP - 256, 78]];
  const right = [[cx + 108, TBASE]];
  for (let i = 0; i < tiers.length; i++) {
    const [y, w] = tiers[i];
    right.push([cx + w / 2, y]);
    const nw = i + 1 < tiers.length ? tiers[i + 1][1] : 40;
    right.push([cx + w / 2, y - 4], [cx + nw / 2, y - 10]);
  }
  const top = TTOP - 266;
  right.push([cx + 20, top - 4], [cx + 12, top - 40], [cx + 6, top - 60], [cx + 3, top - 120]);
  const pts = [...right, [cx, top - 230], ...right.slice().reverse().map(([x, y]) => [2 * cx - x, y])];
  return { pts, tiers, top };
}
function petronas(p, r) {
  [TL, TR].forEach((cx, ti) => {
    const { pts, tiers, top } = towerShape(cx);
    const t0 = ti * 0.5;
    // the dye: silvered turquoise, its eight-pointed plan showing as light and dark ribs
    p.group('towers', boxOf(pts, 6), (c) => {
      const g = c.createLinearGradient(0, TBASE, 0, top - 230);
      g.addColorStop(0, '#5f9fa6'); g.addColorStop(0.55, '#a9d2cc'); g.addColorStop(1, '#eef0dc');
      c.fillStyle = g; poly(c, pts); c.fill();
      c.save(); poly(c, pts); c.clip();
      c.fillStyle = 'rgba(20,40,80,.22)';
      for (let k = 0; k < 8; k++) if (k % 2) c.fillRect(cx - 108 + k * 27, top - 240, 27, TBASE - top + 240);
      c.fillStyle = 'rgba(15,21,52,.25)'; c.fillRect(cx + 54, top - 240, 60, TBASE - top + 240);
      c.restore();
    }, { t: 5.0 + t0, d: 1.6, reveal: 'rise', ease: 'inOut' });
    // the wax outline, drawn up one side and down the other
    waxPen(p, 'towerWax', hand(r, pts, 0.5, 9), 0.4 + t0, 2.2, 3.4);
    // ribs and floors
    const ribs = [], floors = [];
    for (let k = 1; k < 8; k++) {
      const x = cx - 108 + k * 27, w = Math.abs(x - cx);
      let yTop = TTOP; for (const [y, tw] of tiers) if (tw / 2 > w + 4) yTop = y;
      ribs.push(hand(r, [[x, TBASE], [x, yTop]], 0.4, 20));
    }
    for (let y = TBASE - 10; y > top - 30; y -= 9) {
      let w = 108; if (y < TTOP) { w = 20; for (const [ty, tw] of tiers) if (y < ty + 2) w = tw / 2; else break; for (const [ty, tw] of tiers) if (y <= ty) w = tw / 2; }
      const big = Math.round((TBASE - y) / 9) % 4 === 0;
      (big ? ribs : floors).push([[cx - w + 2, y + r.range(-0.4, 0.4)], [cx + w - 2, y + r.range(-0.4, 0.4)]]);
    }
    waxLines(p, 'towerWax', ribs, 2.6 + t0, 1.4, 2.2);
    waxLines(p, 'towerWax', floors, 7.2 + t0 * 0.6, 1.4, 1, 'rise', 'rgba(246,226,176,.55)');
    // the pinnacle's rings
    const rings = [];
    for (let k = 0; k < 6; k++) { const y = top - 8 - k * 9; rings.push([[cx - 14 + k * 1.6, y], [cx + 14 - k * 1.6, y]]); }
    waxLines(p, 'towerWax', rings, 7.8 + t0 * 0.6, 0.6, 1.6, 'rise');
  });
  // the skybridge on its two floors, and the legs that hold it up
  const by = 900, bx0 = TL + 108, bx1 = TR - 108;
  const deck = [[bx0, by], [bx1, by], [bx1, by + 26], [bx0, by + 26]];
  const legs = [[[800 - 16, by + 26], [bx0, by + 120]], [[800 + 16, by + 26], [bx1, by + 120]]];
  p.group('towers', { x: bx0 - 4, y: by - 6, w: bx1 - bx0 + 8, h: 130 }, (c) => {
    c.fillStyle = '#d7e6dc'; poly(c, deck); c.fill();
    c.fillStyle = 'rgba(15,21,52,.3)'; c.fillRect(bx0, by + 13, bx1 - bx0, 13);
    c.strokeStyle = '#d7e6dc'; c.lineWidth = 7; lines(c, legs); c.stroke();
    c.fillStyle = '#d7e6dc'; c.fillRect(784, by + 22, 32, 10);
  }, { t: 6.6, d: 0.8, reveal: 'wipe' });
  waxPen(p, 'towerWax', closed(deck), 2.8, 0.8, 2.4);
  waxLines(p, 'towerWax', [...legs, [[bx0, by + 13], [bx1, by + 13]], ...Array.from({ length: 12 }, (_, k) => [[bx0 + 6 + k * (bx1 - bx0 - 12) / 11, by + 2], [bx0 + 6 + k * (bx1 - bx0 - 12) / 11, by + 24]])], 3.4, 0.8, 1.8, 'wipe');
}

// ================================================================ Sultan Abdul Samad Building
function hall(p, r) {
  const x0 = 220, x1 = 1380, top = 1380, CX = 800;
  const body = [[x0, GROUND], [x0, top + 30], [x1, top + 30], [x1, GROUND]];
  // the clock tower and the two side towers
  const tower = (cx, w, y0, dome) => {
    const sq = [[cx - w / 2, top + 40], [cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, top + 40]];
    const d = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      // an onion: swells past the drum, then draws up to a point
      const rad = (w / 2 + 3) * (t < 0.35 ? 1 + 0.32 * Math.sin((t / 0.35) * Math.PI / 2) : 1.32 * Math.cos(((t - 0.35) / 0.65) * Math.PI / 2) ** 1.7);
      d.push([cx - rad, y0 - 8 - t * dome]);
    }
    const dome2 = [...d, [cx, y0 - 8 - dome - 22], ...d.slice().reverse().map(([x, y]) => [2 * cx - x, y])];
    return { sq, dome: dome2, drum: [[cx - w / 2 - 4, y0], [cx + w / 2 + 4, y0], [cx + w / 2 + 4, y0 - 10], [cx - w / 2 - 4, y0 - 10]] };
  };
  const towers = [tower(CX, 70, 1240, 70), tower(470, 50, 1320, 46), tower(1130, 50, 1320, 46)];
  // small cupolas on the corners of the roof
  const cup = [];
  for (const cx of [x0 + 20, 330, 610, 990, 1270, x1 - 20]) cup.push(tower(cx, 22, top + 30, 22));
  const all = [...towers, ...cup];
  p.group('hall', { x: x0 - 20, y: 1100, w: x1 - x0 + 40, h: GROUND - 1100 + 4 }, (c) => {
    c.fillStyle = '#a8432e'; poly(c, body); c.fill();
    for (const t of all) { c.fillStyle = '#a8432e'; poly(c, t.sq); c.fill(); c.fillStyle = '#efe0c0'; poly(c, t.drum); c.fill(); }
    // white bands across the brick
    c.fillStyle = '#efe0c0';
    for (const y of [top + 30, top + 74, top + 118, GROUND - 8]) c.fillRect(x0, y, x1 - x0, 6);
    // two stories of horseshoe arches, dark inside
    c.fillStyle = '#3a1630';
    for (let row = 0; row < 2; row++) {
      const yb = top + 74 + row * 44 + (row ? 36 : 0), h = 32;
      for (let x = x0 + 16; x < x1 - 20; x += 30) {
        if (Math.abs(x + 9 - CX) < 44) continue;
        c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yb - h + 10); c.arc(x + 9, yb - h + 10, 9, Math.PI, 0); c.lineTo(x + 18, yb); c.fill();
      }
    }
    // the clock tower's tall entrance arch
    c.beginPath(); c.moveTo(CX - 24, GROUND); c.lineTo(CX - 24, GROUND - 70); c.arc(CX, GROUND - 70, 24, Math.PI, 0); c.lineTo(CX + 24, GROUND); c.fill();
    // the copper domes
    for (const t of all) {
      const xs = t.dome.map((q) => q[0]), dl = Math.min(...xs), dr = Math.max(...xs);
      const g = c.createLinearGradient(dl, 0, dr, 0);
      g.addColorStop(0, '#2d6b5c'); g.addColorStop(0.45, '#6fb39a'); g.addColorStop(1, '#245447');
      c.fillStyle = g; poly(c, t.dome); c.fill();
    }
    // the clock
    c.fillStyle = '#f4e8cf'; c.beginPath(); c.arc(CX, 1290, 20, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INDIGO; c.lineWidth = 2.4; c.beginPath(); c.moveTo(CX, 1290); c.lineTo(CX, 1276); c.moveTo(CX, 1290); c.lineTo(CX + 10, 1294); c.stroke();
  }, { t: 6.8, d: 1.4, reveal: 'rise' });
  // the wax: outlines of body, towers and domes; the brick coursing; the arch heads
  waxPen(p, 'hallWax', hand(r, closed(body), 0.6), 1.6, 1.4, 3);
  towers.forEach((t, i) => { waxPen(p, 'hallWax', hand(r, t.dome, 0.4, 6), 2.0 + i * 0.15, 0.8, 2.8); waxPen(p, 'hallWax', hand(r, closed(t.sq), 0.4), 1.8 + i * 0.15, 0.8, 2.8); });
  const fine = [];
  for (const t of cup) fine.push(t.dome, closed(t.sq));
  for (let y = top + 44; y < GROUND - 10; y += 11) if (y % 44 > 6) fine.push([[x0 + 4, y], [x1 - 4, y]]);
  for (const t of all) {
    const { dome } = t, m = dome[Math.floor(dome.length / 2)];
    // ribs on the domes
    fine.push([[m[0], dome[0][1]], [m[0], m[1]]]);
  }
  waxLines(p, 'hallWax', fine, 7.6, 1.2, 1.4, 'rise', 'rgba(246,226,176,.7)');
  // the ground in front: a lawn of dots and the road
  p.group('hall', { x: FX0, y: GROUND - 2, w: FX1 - FX0, h: FY1 - GROUND + 4 }, (c) => {
    c.fillStyle = '#3a1838'; c.fillRect(FX0, GROUND, FX1 - FX0, FY1 - GROUND);
    c.fillStyle = 'rgba(246,226,176,.6)';
    for (let x = FX0 + 8; x < FX1; x += 14) { c.beginPath(); c.arc(x, GROUND + 14, 2, 0, Math.PI * 2); c.arc(x + 7, GROUND + 28, 2, 0, Math.PI * 2); c.fill(); }
  }, { t: 7.0, d: 0.8, reveal: 'wipe' });
}

// ================================================================ palms and hibiscus
function palm(r, x, foot, h, lean) {
  const trunk = [], fr = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; trunk.push([x + lean * t * t, foot - t * h]); }
  const [tx, ty] = trunk[trunk.length - 1];
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.38, L = r.range(110, 150);
    const f = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; f.push([tx + Math.cos(a) * L * t, ty + Math.sin(a) * L * t + 70 * t * t * (Math.abs(Math.cos(a)) + 0.25)]); }
    fr.push(f);
  }
  return { trunk, fr, top: [tx, ty] };
}
function hibiscus(r, cx, cy, R, rot) {
  const petals = [], veins = [];
  for (let k = 0; k < 5; k++) {
    const a = rot + k * Math.PI * 2 / 5;
    const pts = [[cx + Math.cos(a - 0.5) * R * 0.18, cy + Math.sin(a - 0.5) * R * 0.18]];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, b = a - 0.78 + 1.56 * t;
      const ruff = 1 + 0.045 * Math.sin(t * Math.PI * 9) + (r() - 0.5) * 0.03;
      const rr = R * ruff * (0.62 + 0.38 * Math.sin(t * Math.PI) ** 0.6);
      pts.push([cx + Math.cos(b) * rr, cy + Math.sin(b) * rr]);
    }
    pts.push([cx + Math.cos(a + 0.5) * R * 0.18, cy + Math.sin(a + 0.5) * R * 0.18]);
    petals.push(pts);
    for (const v of [-0.32, 0, 0.32]) {
      const vl = [];
      for (let i = 0; i <= 6; i++) { const t = 0.22 + 0.6 * i / 6, b = a + v * t * 1.3; vl.push([cx + Math.cos(b) * R * t, cy + Math.sin(b) * R * t]); }
      veins.push(vl);
    }
  }
  // the long column of the stamens, with its pollen and five red pads at the tip
  const sa = rot + 0.3, L = R * 1.05;
  const stem = [[cx, cy], [cx + Math.cos(sa) * L * 0.5 + Math.cos(sa + 1.57) * R * 0.04, cy + Math.sin(sa) * L * 0.5 + Math.sin(sa + 1.57) * R * 0.04], [cx + Math.cos(sa) * L, cy + Math.sin(sa) * L]];
  const pollen = [];
  for (let k = 0; k < 14; k++) { const t = r.range(0.55, 0.92); pollen.push([cx + Math.cos(sa) * L * t + r.range(-1, 1) * R * 0.07, cy + Math.sin(sa) * L * t + r.range(-1, 1) * R * 0.07]); }
  const pads = [];
  for (let k = 0; k < 5; k++) { const b = sa + (k - 2) * 0.5; pads.push([stem[2][0] + Math.cos(b) * R * 0.06, stem[2][1] + Math.sin(b) * R * 0.06]); }
  return { petals, veins, stem, pollen, pads, cx, cy, R };
}
function leafShape(r, x, y, L, a) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, w = Math.sin(t * Math.PI) * L * 0.3 * (1 + (i % 2 ? 0.06 : 0));
    pts.push([x + Math.cos(a) * L * t - Math.sin(a) * w, y + Math.sin(a) * L * t + Math.cos(a) * w]);
  }
  for (let i = 24; i >= 0; i--) {
    const t = i / 24, w = Math.sin(t * Math.PI) * L * 0.3 * (1 + (i % 2 ? 0.06 : 0));
    pts.push([x + Math.cos(a) * L * t + Math.sin(a) * w, y + Math.sin(a) * L * t - Math.cos(a) * w]);
  }
  const mid = [[x, y], [x + Math.cos(a) * L * 0.95, y + Math.sin(a) * L * 0.95]];
  const ribs = [];
  for (let k = 1; k < 6; k++) {
    const t = k / 6, mx = x + Math.cos(a) * L * t, my = y + Math.sin(a) * L * t, w = Math.sin(t * Math.PI) * L * 0.24;
    for (const s of [-1, 1]) ribs.push([[mx, my], [mx + Math.cos(a) * w * 0.6 - s * Math.sin(a) * w, my + Math.sin(a) * w * 0.6 + s * Math.cos(a) * w]]);
  }
  return { pts, mid, ribs };
}
// the parts of a wax line not under a flower drawn over it, as separate runs
function outside(pts, discs) {
  const runs = []; let cur = [];
  for (const q of pts) {
    if (discs.some(([x, y, R]) => Math.hypot(q[0] - x, q[1] - y) < R)) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(q);
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
}
function flora(p, r) {
  // the hibiscus: big in the lower corners, smaller ones up the sides
  const flowers = [
    [170, 1500, 150, 0.2, MAG], [1440, 1470, 160, 1.2, RED], [100, 880, 70, 0.6, RED], [1500, 830, 74, 2.1, MAG], [380, 1560, 86, 2.8, '#d8573a'], [1240, 1575, 80, 0.9, '#d8573a'],
  ];
  const cover = flowers.map(([x, y, R]) => [x, y, R * 0.98]);
  const cut = (ls, discs = cover) => ls.flatMap((l) => outside(l, discs));
  // royal palms either side of the hall
  const palms = [palm(r, 190, GROUND + 10, 600, 40), palm(r, 1420, GROUND + 10, 640, -36), palm(r, 1520, GROUND + 10, 470, -14)];
  palms.forEach((pm, i) => {
    const b = boxOf([...pm.trunk, ...pm.fr.flat()], 14);
    p.group('flora', b, (c) => {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 16; c.lineCap = 'round'; lines(c, [pm.trunk]); c.stroke();
      c.strokeStyle = LEAF; c.lineWidth = 15; lines(c, pm.fr); c.stroke();
      c.strokeStyle = TEAL; c.lineWidth = 7; lines(c, pm.fr); c.stroke();
    }, { t: 7.4 + i * 0.2, d: 1.0, reveal: 'rise' });
    const rings = [];
    for (let k = 1; k < pm.trunk.length; k++) { const [x, y] = pm.trunk[k]; rings.push([[x - 7, y], [x + 7, y - 1]]); }
    const leaflets = [];
    for (const f of pm.fr) for (let i = 2; i < f.length; i++) { const [x, y] = f[i]; leaflets.push([[x, y], [x - 6, y + 9]], [[x, y], [x + 6, y + 9]]); }
    waxLines(p, 'floraWax', cut(rings), 8.2 + i * 0.15, 0.8, 1.6, 'rise');
    waxLines(p, 'floraWax', cut(leaflets), 8.4 + i * 0.15, 0.8, 1.3, 'fade');
    pm.fr.forEach((f, k) => { if (k % 2 === 0) cut([f]).forEach((run) => waxPen(p, 'floraWax', run, 2.6 + i * 0.2 + k * 0.03, 0.6, 2)); });
  });
  // the hibiscus' leaves
  const leaves = [
    [60, 1420, 200, -0.6], [300, 1590, 180, -1.9], [1560, 1400, 210, -2.6], [1290, 1600, 170, -1.2], [50, 960, 110, -0.2], [1555, 920, 110, 3.3], [130, 1240, 150, -1.2], [1490, 1220, 150, -1.9],
  ].map(([x, y, L, a]) => leafShape(r, x, y, L, a));
  leaves.forEach((lf, i) => {
    p.group('flora', boxOf(lf.pts, 6), (c) => {
      const g = c.createLinearGradient(lf.mid[0][0], lf.mid[0][1], lf.mid[1][0], lf.mid[1][1]);
      g.addColorStop(0, LEAF); g.addColorStop(1, '#4aa080');
      c.fillStyle = g; poly(c, lf.pts); c.fill();
    }, { t: 8.0 + i * 0.08, d: 0.8, reveal: 'fade' });
    cut([hand(r, closed(lf.pts), 0.6, 8)]).forEach((run) => waxPen(p, 'floraWax', run, 2.4 + i * 0.12, 0.8, 2.6));
    waxLines(p, 'floraWax', cut([lf.mid, ...lf.ribs].map((l) => hand(r, l, 0, 6))), 8.6 + i * 0.06, 0.6, 1.6, 'fade');
  });
  flowers.forEach(([x, y, R, rot, col], i) => {
    const h = hibiscus(r, x, y, R, rot);
    p.group('flora', { x: x - R - 30, y: y - R - 30, w: 2 * R + 60, h: 2 * R + 60 }, (c) => {
      for (const pt of h.petals) {
        const g = c.createRadialGradient(x, y, R * 0.1, x, y, R);
        g.addColorStop(0, '#5a0a24'); g.addColorStop(0.3, shade(col, 0.8)); g.addColorStop(1, mix(col, '#f6c08a', 0.35));
        c.fillStyle = g; poly(c, pt); c.fill();
      }
      // the dark eye
      c.fillStyle = '#4a0820'; c.beginPath();
      for (let k = 0; k <= 10; k++) { const b = rot + k * Math.PI / 5, rr = k % 2 ? R * 0.16 : R * 0.3; c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); }
      c.fill();
      c.strokeStyle = '#f0c46a'; c.lineWidth = R * 0.045; c.lineCap = 'round'; lines(c, [h.stem]); c.stroke();
      c.fillStyle = TURM; for (const [px, py] of h.pollen) { c.beginPath(); c.arc(px, py, R * 0.028, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#b0182c'; for (const [px, py] of h.pads) { c.beginPath(); c.arc(px, py, R * 0.032, 0, Math.PI * 2); c.fill(); }
    }, { t: 8.4 + i * 0.15, d: 0.9, reveal: 'iris' });
    const later = cover.slice(i + 1);
    h.petals.forEach((pt, k) => cut([hand(r, pt.slice(1, -1), 0.6, 7)], later).forEach((run) => waxPen(p, 'floraWax', run, 2.2 + i * 0.25 + k * 0.08, 0.7, R > 100 ? 3.2 : 2.4)));
    waxLines(p, 'floraWax', cut(h.veins, later), 9.0 + i * 0.1, 0.8, R > 100 ? 1.8 : 1.3, 'fade');
  });
}

// ================================================================ the crackle
// where the wax cracked in the dye bath, the dye ran in as fine dark veins
function crackle(p, r) {
  const veins = [];
  for (let i = 0; i < 520; i++) {
    let x = r.range(FX0, FX1), y = r.range(FY0, FY1), a = r() * Math.PI * 2;
    const v = [[x, y]];
    const n = r.int(4, 12);
    for (let k = 0; k < n; k++) { a += r.range(-0.8, 0.8); const L = r.range(8, 26); x += Math.cos(a) * L; y += Math.sin(a) * L; v.push([x, y]); }
    veins.push(v);
    // a branch
    if (r() < 0.5) { const j = r.int(1, v.length - 1); const [bx, by] = v[j]; const b = a + r.range(1, 2); veins.push([[bx, by], [bx + Math.cos(b) * 18, by + Math.sin(b) * 18], [bx + Math.cos(b + 0.4) * 34, by + Math.sin(b + 0.4) * 34]]); }
  }
  let cv = null;
  p.group('crackle', { x: FX0, y: FY0, w: FX1 - FX0, h: FY1 - FY0 }, (c) => {
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = 1600; cv.height = 2000;
      const k = cv.getContext('2d');
      k.lineJoin = 'round'; k.strokeStyle = 'rgba(14,16,48,.32)'; k.lineWidth = 1.1; lines(k, veins); k.stroke();
    }
    c.drawImage(cv, 0, 0, 1600, 2000);
  }, { t: 9.6, d: 1.4, reveal: 'fade' });
}

// ================================================================ the head of the cloth
function bands(p, r) {
  // the border all round: dark, with a chain of wax dots
  p.group('band', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = NIGHT;
    c.beginPath(); c.rect(0, 0, W, H); c.rect(FX0, FY0, FX1 - FX0, FY1 - FY0); c.fill('evenodd');
  }, { t: 0.2, d: 0.9, reveal: 'fade' });
  const chain = [];
  for (let x = 36; x < W - 20; x += 20) chain.push([x, 34], [x, H - 34]);
  for (let y = 56; y < H - 40; y += 20) chain.push([34, y], [W - 34, y]);
  p.group('band', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = WAX; c.beginPath(); for (const [x, y] of chain) { c.moveTo(x + 3.4, y); c.arc(x, y, 3.4, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = WAX; c.lineWidth = 2; c.strokeRect(FX0 - 8, FY0 - 8, FX1 - FX0 + 16, FY1 - FY0 + 16);
  }, { t: 0.6, d: 1.2, reveal: 'wipe' });
  // the title's ground, brushed magenta into red
  const ty0 = 1626, ty1 = 1786;
  p.group('band', { x: FX0, y: ty0, w: FX1 - FX0, h: ty1 - ty0 }, (c) => {
    const g = c.createLinearGradient(FX0, 0, FX1, 0);
    g.addColorStop(0, RED); g.addColorStop(0.5, MAG); g.addColorStop(1, RED);
    c.fillStyle = g; c.fillRect(FX0, ty0, FX1 - FX0, ty1 - ty0);
    c.strokeStyle = WAX; c.lineWidth = 2.4; c.strokeRect(FX0 + 10, ty0 + 10, FX1 - FX0 - 20, ty1 - ty0 - 20);
    c.fillStyle = WAX;
    for (let x = FX0 + 22; x < FX1 - 16; x += 16) { c.beginPath(); c.arc(x, ty0 + 22, 2.2, 0, Math.PI * 2); c.arc(x, ty1 - 22, 2.2, 0, Math.PI * 2); c.fill(); }
  }, { t: 4.0, d: 1.2, reveal: 'wipe' });
  // the bamboo shoots: tall triangles, each filled with its own small pattern
  const by0 = 1800, by1 = 1936, n = 13, tw = (FX1 - FX0) / n;
  const tris = [], fills = [], inner = [];
  for (let k = 0; k < n; k++) {
    const x = FX0 + k * tw;
    tris.push([[x + 4, by1], [x + tw / 2, by0], [x + tw - 4, by1]]);
    inner.push([[x + 22, by1 - 10], [x + tw / 2, by0 + 40], [x + tw - 22, by1 - 10]]);
    // a little flower of dots in each
    fills.push([x + tw / 2, by1 - 40]);
  }
  p.group('band', { x: FX0, y: by0 - 6, w: FX1 - FX0, h: by1 - by0 + 12 }, (c) => {
    c.fillStyle = '#2a2a68'; c.fillRect(FX0, by0, FX1 - FX0, by1 - by0);
    tris.forEach((t, k) => { c.fillStyle = k % 2 ? TURM : TEAL; poly(c, t); c.fill(); });
    inner.forEach((t, k) => { c.fillStyle = k % 2 ? '#c4621f' : LEAF; poly(c, t); c.fill(); });
  }, { t: 4.4, d: 1.2, reveal: 'wipe' });
  const tl = [];
  for (const t of [...tris, ...inner]) tl.push(closed(t));
  for (const [x, y] of fills) { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; tl.push([[x + Math.cos(a) * 6, y + Math.sin(a) * 6], [x + Math.cos(a) * 6.2, y + Math.sin(a) * 6.2]]); } tl.push([[x, by0 + 52], [x, y - 12]]); }
  waxLines(p, 'bandWax', tl, 1.4, 1.2, 2.4, 'wipe');
  // the little triangles hanging from the top of the field
  const top = [];
  for (let x = FX0; x < FX1 - 1; x += 50) top.push([[x, FY0], [x + 25, FY0 + 34], [x + 50, FY0]]);
  p.group('band', { x: FX0, y: FY0 - 2, w: FX1 - FX0, h: 40 }, (c) => {
    top.forEach((t, k) => { c.fillStyle = k % 2 ? TURM : RED; poly(c, t); c.fill(); });
    c.strokeStyle = WAX; c.lineWidth = 1.8; lines(c, top); c.stroke();
  }, { t: 4.6, d: 1.0, reveal: 'wipe' });
}

function title(p) {
  const y = 1748;
  p.type('shadow', TITLE, W / 2 + 6, y + 7, { family: FACE, size: 150, color: NIGHT, align: 'center', track: 0.03, fit: FX1 - FX0 - 120, t: 10.6, gap: 0.12, d: 0.7, reveal: 'drop' });
  p.type('title', TITLE, W / 2, y, { family: FACE, size: 150, color: WAX, align: 'center', track: 0.03, fit: FX1 - FX0 - 120, t: 10.65, gap: 0.12, d: 0.7, reveal: 'drop' });
}

// ================================================================ what moves
function life(p, r) {
  // the warning lights on the spires and the KL Tower's mast blink
  p.live('life', {
    t: 9.0, d: 1, box: { x: 260, y: 100, w: 800, h: 240 },
    draw: (c, time) => {
      const on = (k) => 0.5 + 0.5 * Math.sin(time * 3 + k) > 0.45;
      c.fillStyle = '#ff5a4a';
      for (const [x, y, k] of [[TL, 152, 0], [TR, 152, 1.5], [300, 298, 3]]) if (on(k)) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
    },
  });
  // swiftlets crossing the sky in a loose flock
  const birds = [];
  for (let i = 0; i < 9; i++) birds.push([r.range(-120, 0), r.range(-50, 50), r() * 6, r.range(0.85, 1.15)]);
  p.live('life', {
    t: 10.0, d: 1, box: { x: FX0, y: 380, w: FX1 - FX0, h: 400 },
    draw: (c, time) => {
      const u = time - 10;
      c.strokeStyle = WAX; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (const [dx, dy, ph, sp] of birds) {
        const x = 1500 - u * 52 * sp + dx, y = 560 + dy + Math.sin(u * 0.8 + ph) * 12 - u * 6;
        const f = Math.sin(u * 9 + ph) * 4;
        c.moveTo(x - 9, y - 2 - f); c.quadraticCurveTo(x - 4, y - 4 - f, x, y); c.quadraticCurveTo(x + 4, y - 4 - f, x + 9, y - 2 - f);
      }
      c.stroke();
    },
  });
  // light moving on the skybridge
  p.live('life', {
    t: 9.4, d: 1, box: { x: 720, y: 896, w: 160, h: 34 },
    draw: (c, time) => {
      c.fillStyle = 'rgba(255,220,140,.9)';
      for (let k = 0; k < 6; k++) { const a = 0.5 + 0.5 * Math.sin(time * 2 + k * 1.3); c.globalAlpha = a; c.fillRect(727 + k * 25, 903, 12, 6); }
    },
  });
}
