// Las Vegas: a 1950s travel print of the desert at night, atomic-age. A
// highway runs straight across the desert to the Strip, a low reef of light
// under the mountains, its searchlights sweeping a sky of starbursts. A
// diamond welcome sign on the left, a motel's pylon on the right with a neon
// arrow of chasing bulbs, Joshua trees along the road, a finned
// car heading in. All of it in a round-cornered panel on cream paper printed
// with boomerangs and sparkles, the name below in Fascinate. The signs, their
// names and the welcome sign's words are invented.

import { Plate, W, H } from '../print.js';
import { mix, lerp, rng } from '../kit.js';

// the night
const NIGHT = '#0c1a2b', NAVY = '#13284a', INDIGO = '#2b2f6b', PLUM = '#5b2f6e', MAGENTA = '#b0407a', EMBER = '#f08a4b';
const PEAK_F = '#3a3470', PEAK_M = '#2a2656', PEAK_N = '#1b1b3d', DESERT = '#4a3a5e', DESERT_N = '#2e2642', SAND = '#6d5470';
const ROAD = '#1d1a2c', ROAD_L = '#2c2840';
// the neon and the print
const PINK = '#ff5c9a', TURQ = '#52e2d4', ORANGE = '#ff8a3a', LEMON = '#ffe066', LIME = '#a8f06a', RED = '#ff4a3d', WHITE = '#fff6e2';
const CREAM = '#f2e6cc', CREAM_D = '#e1d0ad', ATOM_R = '#e2552f', ATOM_T = '#2fa39a', INK = '#1d1b2e';
const BULB = '#ffe9a8';

export const city = {
  id: 'las-vegas', name: 'Las Vegas', wall: '#14182b',
  alt: "A 1950s travel print of Las Vegas at night: a desert highway running straight to the lit Strip and its needle of a tower under the mountains, searchlights and atomic starbursts in the sky, a diamond welcome sign with an invented greeting on the left, a motel's pylon with a neon arrow of chasing bulbs on the right, Joshua trees by the road and a finned car driving in, set in a round-cornered panel on cream paper printed with boomerangs, the name below",
  google: 'family=Fascinate&family=Yellowtail',
  fonts: [['400 200px "Fascinate"', 'LASVEGAS WELCOME NEVADA SKYROCKET MOTEL VACANCY COMET NEBULA QUASAR ATOMIC7 COCKTAILS POOL TV · 2 MI'], ['400 60px "Yellowtail"', 'to the bright lights where the desert never sleeps']],
  build,
};

// the panel the night sits in, and the paper round it
const PX0 = 70, PX1 = W - 70, PY0 = 70, PY1 = 1560, RAD = 96;
const HOR = 1188, VX = 812; // the horizon and the road's vanishing point
function panel(c, k = 0) {
  const x0 = PX0 - k, y0 = PY0 - k, x1 = PX1 + k, y1 = PY1 + k, r = RAD + k;
  c.moveTo(x0 + r, y0); c.arcTo(x1, y0, x1, y1, r); c.arcTo(x1, y1, x0, y1, r); c.arcTo(x0, y1, x0, y0, r); c.arcTo(x0, y0, x1, y0, r); c.closePath();
}

// neon: a path stroked wide and faint, then narrower and brighter, then a white-hot core
function neon(c, col, w = 4, core = true) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [k, a] of [[5.5, 0.08], [3.4, 0.14], [2, 0.32]]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w * k; c.stroke(); }
  c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = w; c.stroke();
  if (core) { c.strokeStyle = mix(col, '#ffffff', 0.7); c.lineWidth = w * 0.35; c.stroke(); }
}
function neonText(c, str, x, y, font, col, w = 3, align = 'center') {
  c.font = font; c.textAlign = align; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  for (const [k, a] of [[5, 0.1], [3, 0.18], [1.8, 0.4]]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w * k; c.strokeText(str, x, y); }
  c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = w; c.strokeText(str, x, y);
  c.strokeStyle = mix(col, '#ffffff', 0.7); c.lineWidth = w * 0.35; c.strokeText(str, x, y);
}
// an atomic starburst: long and short spikes round a small heart
function burst(c, x, y, R, col, n = 8, inner = 0.22) {
  c.beginPath();
  for (let k = 0; k < n * 2; k++) { const a = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? R * inner : (k % 4 ? R * 0.62 : R); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = col; c.fill();
}
// a sputnik: a ball with rays ending in dots
function sputnik(c, x, y, R, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1.2, R * 0.05); c.lineCap = 'round';
  c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.13; c.moveTo(x + Math.cos(a) * R * 0.25, y + Math.sin(a) * R * 0.25); c.lineTo(x + Math.cos(a) * R * (k % 2 ? 0.7 : 1), y + Math.sin(a) * R * (k % 2 ? 0.7 : 1)); } c.stroke();
  c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.13, rr = R * (k % 2 ? 0.7 : 1); c.moveTo(x + Math.cos(a) * rr + R * 0.08, y + Math.sin(a) * rr); c.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, R * 0.08, 0, Math.PI * 2); } c.fill();
  c.beginPath(); c.arc(x, y, R * 0.22, 0, Math.PI * 2); c.fill();
}
// a boomerang, the shape of the decade
function boomerang(c, x, y, s, a) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.moveTo(-30, 8); c.quadraticCurveTo(0, -22, 30, 8); c.quadraticCurveTo(32, 14, 26, 12); c.quadraticCurveTo(0, -6, -26, 12); c.quadraticCurveTo(-32, 14, -30, 8); c.closePath();
  c.restore();
}

function build() {
  const p = new Plate({ paper: CREAM, seed: 1955 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'stars', 'beams', 'hills', 'strip', 'desert', 'road', 'poles', 'signs', 'motel', 'near', 'live', 'paper', 'title');
  p.layer('paper', { clip: false });
  p.layer('title', { clip: false });

  paper(p, r);
  sky(p, r);
  hills(p, r);
  strip(p, r);
  desert(p, r);
  road(p, r);
  roadside(p, r);
  welcome(p, r);
  motel(p, r);
  plants(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// ================================================================ the paper round the panel
function paper(p, r) {
  p.group('paper', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = CREAM; c.beginPath(); c.rect(0, 0, W, H); panel(c); c.fill('evenodd');
  }, { t: 0, d: 0.1, reveal: 'none' });
  // the printed pattern in the margins and the foot: sparkles and boomerangs, scattered
  const marks = [];
  const free = (x, y) => (y > PY1 + 30 && (y < 1610 || y > 1910 || x < 150 || x > 1450)) || x < PX0 - 22 || x > PX1 + 22 || y < PY0 - 22;
  for (let i = 0; i < 900 && marks.length < 70; i++) {
    const x = r.range(14, W - 14), y = r.range(14, H - 14);
    if (!free(x, y) || marks.some((m) => Math.hypot(m[0] - x, m[1] - y) < 46)) continue;
    marks.push([x, y, r.pick([0, 0, 1, 2]), r.pick([ATOM_R, ATOM_T, ATOM_T, CREAM_D]), r.range(0, Math.PI * 2), r.range(0.4, 0.62)]);
  }
  p.group('paper', { x: 0, y: 0, w: W, h: H }, (c) => {
    for (const [x, y, k, col, a, s] of marks) {
      if (k === 0) burst(c, x, y, 13 * s * 1.6, col, 4, 0.18);
      else if (k === 1) { boomerang(c, x, y, s, a); c.fillStyle = col; c.fill(); }
      else { c.fillStyle = col; c.beginPath(); c.arc(x, y, 4 * s * 1.6, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 0.3, d: 0.9, reveal: 'fade' });
  // the panel's printed edge: a dark line and a turquoise one
  p.group('paper', { x: PX0 - 20, y: PY0 - 20, w: PX1 - PX0 + 40, h: PY1 - PY0 + 40 }, (c) => {
    c.beginPath(); panel(c, 3); c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
    c.beginPath(); panel(c, 13); c.strokeStyle = ATOM_T; c.lineWidth = 3; c.stroke();
  }, { t: 0.4, d: 1.0, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the sky
function sky(p, r) {
  // flat bands of night, warming down to the glow over the Strip
  const stops = [NIGHT, NIGHT, NAVY, NAVY, INDIGO, INDIGO, PLUM, MAGENTA, EMBER];
  const y0 = PY0, y1 = HOR;
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = y0 + (i / n) ** 1.0 * (y1 - y0), b = y0 + ((i + 1) / n) * (y1 - y0);
    const f = (i / (n - 1)) * (stops.length - 1), k = Math.floor(f), col = mix(stops[k], stops[Math.min(stops.length - 1, k + 1)], f - k);
    p.group('sky', { x: PX0, y: a - 2, w: PX1 - PX0, h: b - a + 4 }, (c) => { c.fillStyle = col; c.fillRect(PX0, a, PX1 - PX0, b - a + 1); },
      { t: 0.5 + i * 0.045, d: 0.5, reveal: 'fall', ease: 'inOut' });
  }
  // the glow of the Strip spreading up into it
  p.group('sky', { x: PX0, y: 700, w: PX1 - PX0, h: HOR - 700 + 10 }, (c) => {
    const g = c.createRadialGradient(VX, HOR, 20, VX, HOR, 620);
    g.addColorStop(0, 'rgba(255,190,120,.55)'); g.addColorStop(0.4, 'rgba(255,92,154,.22)'); g.addColorStop(1, 'rgba(255,92,154,0)');
    c.fillStyle = g; c.fillRect(PX0, 700, PX1 - PX0, HOR - 700 + 10);
  }, { t: 1.8, d: 1.2, reveal: 'fade' });
  // small stars, and the big starbursts of the decade
  const dots = [];
  for (let i = 0; i < 260; i++) { const y = r.range(PY0, 900); dots.push([r.range(PX0, PX1), y, r.range(0.8, 2.2) * (1 - (y - PY0) / 1400)]); }
  p.group('stars', { x: PX0, y: PY0, w: PX1 - PX0, h: 900 - PY0 }, (c) => {
    c.fillStyle = WHITE; c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 1.4, d: 1.0, reveal: 'fade' });
  const big = [[250, 300, 54, WHITE, 0], [1230, 230, 40, TURQ, 1], [560, 470, 30, LEMON, 0], [1380, 560, 26, WHITE, 0], [640, 250, 22, PINK, 1], [180, 700, 22, TURQ, 0], [1100, 640, 18, WHITE, 1], [700, 180, 16, WHITE, 0]];
  big.forEach(([x, y, R, col, k], i) => {
    p.group('stars', { x: x - R - 10, y: y - R - 10, w: 2 * R + 20, h: 2 * R + 20 }, (c) => (k ? sputnik(c, x, y, R, col) : burst(c, x, y, R, col, 4, 0.12)),
      { t: 2.0 + i * 0.16, d: 0.6, reveal: 'pop', ease: 'back' });
  });
  // the moon: a thin crescent with an orbit round it
  p.group('stars', { x: 920, y: 160, w: 200, h: 160 }, (c) => {
    c.translate(-380, -140);
    c.fillStyle = LEMON; c.beginPath(); c.arc(1400, 380, 42, 0, Math.PI * 2); c.arc(1416, 368, 38, 0, Math.PI * 2, true); c.fill('evenodd');
    c.strokeStyle = 'rgba(255,224,102,.5)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(1400, 380, 84, 22, -0.35, 0, Math.PI * 2); c.stroke();
    c.fillStyle = LEMON; c.beginPath(); c.arc(1400 + Math.cos(2.4) * 84 * Math.cos(-0.35) - Math.sin(2.4) * 22 * Math.sin(-0.35), 380 + Math.cos(2.4) * 84 * Math.sin(-0.35) + Math.sin(2.4) * 22 * Math.cos(-0.35), 5, 0, Math.PI * 2); c.fill();
  }, { t: 2.6, d: 0.8, reveal: 'iris' });
}

// ================================================================ the mountains
function ridge(rr, x0, x1, base, pts) {
  const out = [[x0, base + 40]];
  for (const [x, y] of pts) out.push([x, y + rr.range(-6, 6)]);
  out.push([x1, base + 40]);
  return out;
}
function hills(p, r) {
  const rr = rng(31);
  // the Spring Mountains: far, then middle, then the near low hills; each lit pink on one flank
  const far = ridge(rr, PX0 - 10, PX1 + 10, HOR, [[PX0, 1060], [180, 1030], [300, 990], [380, 1010], [470, 950], [560, 985], [640, 1040], [720, 1070], [900, 1080], [1000, 1040], [1090, 990], [1170, 940], [1240, 970], [1330, 925], [1420, 980], [PX1, 1020]]);
  const mid = ridge(rr, PX0 - 10, PX1 + 10, HOR, [[PX0, 1110], [150, 1090], [250, 1060], [360, 1095], [470, 1120], [600, 1140], [760, 1160], [880, 1162], [1000, 1150], [1110, 1110], [1210, 1080], [1300, 1100], [1420, 1070], [PX1, 1100]]);
  [[far, PEAK_F, 2.2], [mid, PEAK_M, 2.6]].forEach(([pts, col, t], k) => {
    p.group('hills', { x: PX0 - 10, y: 900, w: PX1 - PX0 + 20, h: HOR - 860 }, (c) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.closePath(); c.fill();
      // the moonlit flanks: each peak's left slope a shade lighter, ruled with fine lines
      c.fillStyle = mix(col, k ? MAGENTA : '#8a6fb0', 0.25);
      for (let i = 1; i < pts.length - 2; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        if (by < ay) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(bx - (bx - ax) * 0.15, HOR + 10); c.lineTo(ax, HOR + 10); c.closePath(); c.fill(); }
      }
      // fine ruling across the dark flanks, as the screen leaves it
      c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.closePath(); c.clip();
      c.strokeStyle = mix(col, '#000000', 0.22); c.lineWidth = 1; c.beginPath(); for (let y = 900; y < HOR; y += 5) { c.moveTo(PX0, y); c.lineTo(PX1, y); } c.stroke(); c.restore();
    }, { t, d: 1.2, reveal: 'rise', ease: 'inOut' });
  });
}

// ================================================================ the Strip on the horizon
function strip(p, r) {
  // the needle of a tower far off, with its pod and its light
  const tx = 990;
  p.group('strip', { x: tx - 50, y: 610, w: 100, h: HOR - 600 }, (c) => {
    c.fillStyle = '#4b3f7a'; c.beginPath(); c.moveTo(tx - 12, HOR); c.lineTo(tx - 6, 720); c.lineTo(tx + 6, 720); c.lineTo(tx + 12, HOR); c.closePath(); c.fill();
    c.fillStyle = '#6a5a9a'; c.fillRect(tx - 2, 730, 4, HOR - 740);
    // the pod: stacked rings
    for (const [y, w, col] of [[720, 44, '#5c4f8e'], [706, 52, '#7a6ab0'], [694, 46, '#5c4f8e'], [684, 34, '#7a6ab0']]) { c.fillStyle = col; c.fillRect(tx - w / 2, y - 10, w, 12); }
    c.fillStyle = LEMON; for (let x = tx - 22; x < tx + 22; x += 5) c.fillRect(x, 700, 2.4, 3);
    c.strokeStyle = '#6a5a9a'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, 674); c.lineTo(tx, 616); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(tx, 616, 3.4, 0, Math.PI * 2); c.fill();
  }, { t: 4.2, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // the hotels: slabs and towers, their windows lit
  const slabs = [];
  let x = 560;
  while (x < 1080) {
    const w = r.range(28, 70), h = r.range(40, 150) * (1 - Math.abs(x - VX) / 700);
    slabs.push([x, w, Math.max(26, h), r.pick(['#2e2a5a', '#3a3268', '#26244c', '#463a6e']), r.pick([LEMON, WHITE, '#ffd2a0', TURQ])]);
    x += w * r.range(0.55, 0.95);
  }
  const lit = slabs.map((s) => { const o = []; for (let y = HOR - 8; y > HOR - s[2] + 6; y -= 6) for (let xx = s[0] + 3; xx < s[0] + s[1] - 3; xx += 5) if (r.chance(0.55)) o.push([xx, y]); return o; });
  for (let g = 0; g < 3; g++) {
    const set = slabs.map((s, i) => [s, lit[i]]).filter((_, i) => i % 3 === g);
    p.group('strip', { x: 540, y: HOR - 170, w: 560, h: 180 }, (c) => {
      for (const [[sx, sw, sh, col, wl], win] of set) {
        c.fillStyle = col; c.fillRect(sx, HOR - sh, sw, sh);
        c.fillStyle = mix(col, '#ffffff', 0.12); c.fillRect(sx, HOR - sh, sw * 0.25, sh);
        c.fillStyle = wl; for (const [wx, wy] of win) c.fillRect(wx, wy, 2.4, 2.4);
      }
    }, { t: 4.6 + g * 0.3, d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
  // the signs of the Strip: pylons with neon tops and starbursts, small and many
  const names = [['COMET', PINK], ['NEBULA', TURQ], ['QUASAR', ORANGE], ['ATOMIC7', LEMON]];
  const pylons = [[676, 1070, 0], [740, 1030, 1], [930, 1050, 2], [1050, 1090, 3]];
  pylons.forEach(([px, top, k], i) => {
    const [name, col] = names[k];
    p.group('strip', { x: px - 60, y: top - 60, w: 120, h: HOR - top + 70 }, (c) => {
      c.fillStyle = '#20193a'; c.fillRect(px - 3, top, 6, HOR - top);
      // the sign board, set on end, with its name in neon letters down it
      c.fillStyle = '#2b2250'; c.fillRect(px - 15, top + 6, 30, 86);
      c.beginPath(); c.rect(px - 15, top + 6, 30, 86); neon(c, col, 1.4, false);
      c.fillStyle = mix(col, '#ffffff', 0.4); c.font = '400 13px "Fascinate"'; c.textAlign = 'center';
      for (let j = 0; j < name.length; j++) c.fillText(name[j], px, top + 20 + j * 11);
      c.beginPath(); c.arc(px, top - 6, 9, 0, Math.PI * 2); neon(c, col, 2);
      burst(c, px, top - 30, 16, mix(col, '#ffffff', 0.4), 4, 0.15);
    }, { t: 5.4 + i * 0.2, d: 0.7, reveal: 'rise', ease: 'out' });
  });
  // the glow along the Strip's foot
  p.group('strip', { x: 520, y: HOR - 40, w: 600, h: 50 }, (c) => {
    const g = c.createLinearGradient(0, HOR - 34, 0, HOR);
    g.addColorStop(0, 'rgba(255,160,110,0)'); g.addColorStop(1, 'rgba(255,170,120,.55)');
    c.fillStyle = g; c.fillRect(540, HOR - 34, 560, 36);
    c.fillStyle = LEMON; for (let x2 = 560; x2 < 1080; x2 += 9) c.fillRect(x2, HOR - 4, 4, 2);
  }, { t: 6.4, d: 0.8, reveal: 'fade' });
}

// ================================================================ the desert
function desert(p, r) {
  // bands of dusky sand, darker as they come near
  const bands = [[HOR, 1230, SAND], [1230, 1300, mix(SAND, DESERT, 0.5)], [1300, 1400, DESERT], [1400, PY1 + 10, DESERT_N]];
  bands.forEach(([a, b, col], i) => p.group('desert', { x: PX0, y: a - 2, w: PX1 - PX0, h: b - a + 4 }, (c) => { c.fillStyle = col; c.fillRect(PX0, a, PX1 - PX0, b - a + 1); },
    { t: 3.0 + i * 0.15, d: 0.6, reveal: 'fall', ease: 'inOut' }));
  // scrub: small dark tufts, scattered and thicker near
  const tufts = [];
  for (let i = 0; i < 260; i++) { const y = HOR + (PY1 - HOR) * r() ** 1.6, s = lerp(0.6, 3.6, (y - HOR) / (PY1 - HOR)); tufts.push([r.range(PX0, PX1), y, s]); }
  p.group('desert', { x: PX0, y: HOR, w: PX1 - PX0, h: PY1 - HOR }, (c) => {
    c.fillStyle = 'rgba(16,14,34,.55)'; c.beginPath(); for (const [x, y, s] of tufts) { c.moveTo(x + 3 * s, y); c.ellipse(x, y, 3 * s, 1.4 * s, 0, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = 'rgba(176,120,170,.35)'; c.lineWidth = 1; c.beginPath(); for (const [x, y, s] of tufts) { c.moveTo(x - 2 * s, y - 0.5 * s); c.lineTo(x - s, y - 3 * s); c.moveTo(x + s, y - 0.5 * s); c.lineTo(x + 2 * s, y - 2.6 * s); } c.stroke();
  }, { t: 3.6, d: 0.8, reveal: 'fade' });
  // rocks and boulders, moonlit on their left, and ruled tracks of wind in the sand
  const rocks = [];
  for (let i = 0; i < 70; i++) { const y = HOR + 20 + (PY1 - HOR - 20) * r() ** 1.3, s = lerp(0.5, 3.2, (y - HOR) / (PY1 - HOR)), x = r.range(PX0, PX1); if (Math.abs(x - VX) < (y - HOR) * 1.25 + 40) continue; rocks.push([x, y, s, r.range(8, 16)]); }
  const tracks = [];
  for (let i = 0; i < 90; i++) { const y = r.range(HOR + 10, PY1), s = lerp(0.4, 2.6, (y - HOR) / (PY1 - HOR)), x = r.range(PX0, PX1); tracks.push([[x, y], [x + 30 * s, y - 0.6 * s], [x + 60 * s, y]]); }
  p.strokes('desert', tracks, 'rgba(150,110,160,.35)', 1.1, { t: 3.8, d: 0.8, reveal: 'fade', box: { x: PX0 - 200, y: HOR - 10, w: PX1 - PX0 + 400, h: PY1 - HOR + 20 } });
  p.group('desert', { x: PX0, y: HOR, w: PX1 - PX0, h: PY1 - HOR }, (c) => {
    for (const [x, y, s, w] of rocks) {
      c.fillStyle = '#1a1530'; c.beginPath(); c.moveTo(x - w * s, y); c.quadraticCurveTo(x - w * s * 0.8, y - w * s * 0.9, x, y - w * s * 0.8); c.quadraticCurveTo(x + w * s * 0.9, y - w * s * 0.6, x + w * s, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(190,140,200,.45)'; c.beginPath(); c.moveTo(x - w * s, y); c.quadraticCurveTo(x - w * s * 0.8, y - w * s * 0.9, x, y - w * s * 0.8); c.quadraticCurveTo(x - w * s * 0.5, y - w * s * 0.4, x - w * s * 0.6, y); c.closePath(); c.fill();
    }
  }, { t: 4.0, d: 0.8, reveal: 'fade' });
}

// ================================================================ the road
const edge = (y, side) => { const t = (y - HOR) / (PY1 - HOR); return lerp(VX + (side ? 6 : -6), side ? 1250 : 380, t); };
function road(p, r) {
  p.group('road', { x: PX0, y: HOR - 4, w: PX1 - PX0, h: PY1 - HOR + 20 }, (c) => {
    c.fillStyle = ROAD; c.beginPath(); c.moveTo(edge(HOR, 0), HOR); c.lineTo(edge(HOR, 1), HOR); c.lineTo(edge(PY1 + 10, 1), PY1 + 10); c.lineTo(edge(PY1 + 10, 0), PY1 + 10); c.closePath(); c.fill();
    // the shoulders, lit from the Strip
    c.fillStyle = ROAD_L; c.beginPath(); c.moveTo(VX, HOR); c.lineTo(edge(PY1 + 10, 0) + 60, PY1 + 10); c.lineTo(edge(PY1 + 10, 1) - 60, PY1 + 10); c.closePath(); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
  }, { t: 3.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // its white edges, drawn by the pen from near to far
  for (const side of [0, 1]) p.pen('road', [[edge(PY1 + 10, side), PY1 + 10], [edge(HOR, side), HOR]], WHITE, 3, { t: 4.0 + side * 0.15, d: 1.0, cap: 'butt' });
  // the dashes down the middle, laid one after another away from us
  const dashes = [];
  for (let t = 0.02; t < 1; t *= 1.32) dashes.push(t);
  dashes.reverse().forEach((t, i) => {
    const y0 = HOR + (PY1 - HOR) * t, y1 = HOR + (PY1 - HOR) * Math.min(1.05, t * 1.16), w0 = 1 + 9 * t, w1 = 1 + 9 * t * 1.16;
    p.fill('road', [[VX - w0 / 2, y0], [VX + w0 / 2, y0], [VX + w1 / 2, y1], [VX - w1 / 2, y1]], LEMON, { t: 4.3 + i * 0.07, d: 0.3, reveal: 'pop' });
  });
  // telephone poles along the right shoulder, their wires sagging between
  const poles = [];
  for (let t = 0.06; t < 0.5; t *= 1.42) { const y = HOR + (PY1 - HOR) * t; poles.push([edge(y, 1) + 30 + 260 * t, y, 270 * t + 6]); }
  poles.forEach(([x, y, h], i) => {
    p.group('poles', { x: x - h * 0.25, y: y - h - 10, w: h * 0.5, h: h + 14 }, (c) => {
      c.fillStyle = '#120f22'; c.fillRect(x - h * 0.018 - 0.5, y - h, h * 0.036 + 1, h);
      c.fillRect(x - h * 0.16, y - h * 0.94, h * 0.32, h * 0.03 + 1);
      c.fillRect(x - h * 0.12, y - h * 0.86, h * 0.24, h * 0.025 + 1);
    }, { t: 4.6 + (poles.length - i) * 0.12, d: 0.5, reveal: 'rise' });
  });
  const wires = [];
  for (const k of [-0.15, 0, 0.15]) {
    const pts = [];
    for (let i = poles.length - 1; i > 0; i--) {
      const [x0, y0, h0] = poles[i], [x1, y1, h1] = poles[i - 1];
      for (let s = 0; s <= 10; s++) { const t = s / 10; pts.push([lerp(x0 + k * h0, x1 + k * h1, t), lerp(y0 - h0 * 0.94, y1 - h1 * 0.94, t) + Math.sin(t * Math.PI) * lerp(h0, h1, t) * 0.08]); }
    }
    wires.push(pts);
  }
  p.strokes('poles', wires, '#120f22', 1.2, { t: 5.5, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
}

// little motel signs lining the road into town, smaller and smaller
function roadside(p, r) {
  const cols = [PINK, TURQ, LEMON, LIME, ORANGE];
  const list = [];
  for (let t = 0.04, i = 0; t < 0.36; t *= 1.3, i++) {
    const side = i % 2, y = HOR + (PY1 - HOR) * t;
    list.push([edge(y, side) + (side ? 1 : -1) * (30 + 300 * t), y, 0.25 + 3 * t, cols[i % cols.length], r.int(0, 2)]);
  }
  list.forEach(([x, y, s, col, kind], i) => {
    p.group('poles', { x: x - 40 * s, y: y - 90 * s, w: 80 * s, h: 96 * s }, (c) => {
      c.fillStyle = '#120f22'; c.fillRect(x - 1.5 * s, y - 50 * s, 3 * s, 50 * s);
      c.beginPath();
      if (kind === 0) c.rect(x - 18 * s, y - 72 * s, 36 * s, 22 * s);
      else if (kind === 1) c.arc(x, y - 64 * s, 14 * s, 0, Math.PI * 2);
      else { c.moveTo(x - 20 * s, y - 52 * s); c.lineTo(x, y - 84 * s); c.lineTo(x + 20 * s, y - 52 * s); c.closePath(); }
      c.fillStyle = '#1b1636'; c.fill(); neon(c, col, Math.max(1, 1.6 * s));
    }, { t: 5.0 + i * 0.12, d: 0.5, reveal: 'pop' });
  });
  // a billboard out in the desert on the left
  const bx = 636, by = 1262;
  p.group('poles', { x: bx - 110, y: by - 110, w: 220, h: 120 }, (c) => {
    c.fillStyle = '#120f22'; for (const dx of [-60, 60]) c.fillRect(bx + dx - 3, by - 40, 6, 40);
    c.fillStyle = CREAM; c.fillRect(bx - 96, by - 104, 192, 64);
    c.fillStyle = ATOM_T; c.fillRect(bx - 96, by - 104, 192, 14);
    c.font = '400 22px "Fascinate"'; c.textAlign = 'center'; c.fillStyle = ATOM_R; c.fillText('SKYROCKET', bx - 14, by - 54);
    c.font = '400 14px "Fascinate"'; c.fillStyle = INK; c.fillText('POOL · TV · 2 MI', bx - 14, by - 74 + 34);
    burst(c, bx + 70, by - 64, 18, LEMON, 4, 0.16);
    c.fillStyle = 'rgba(20,16,40,.35)'; c.fillRect(bx - 96, by - 46, 192, 6);
  }, { t: 5.8, d: 0.6, reveal: 'rise' });
}

// ================================================================ the welcome sign
const WX = 360, WY = 1080; // the diamond's middle
function welcome(p, r) {
  const hw = 250, hh = 160;
  // its two legs
  p.group('signs', { x: WX - 120, y: WY, w: 240, h: 470 }, (c) => {
    for (const s of [-1, 1]) {
      c.fillStyle = '#c9ccd6'; c.fillRect(WX + s * 70 - 8, WY + 60, 16, 400);
      c.fillStyle = '#8b8fa3'; c.fillRect(WX + s * 70 + 2, WY + 60, 6, 400);
    }
    c.fillStyle = 'rgba(10,8,20,.6)'; c.beginPath(); c.ellipse(WX, WY + 462, 120, 10, 0, 0, Math.PI * 2); c.fill();
  }, { t: 6.4, d: 0.8, reveal: 'rise', ease: 'inOut' });
  // the diamond: cream face, red rim of bulbs, and a row of silver dollars for the letters
  const dia = (k) => [[WX, WY - hh - k], [WX + hw + k * 1.5, WY], [WX, WY + hh + k], [WX - hw - k * 1.5, WY]];
  p.group('signs', { x: WX - hw - 40, y: WY - hh - 40, w: 2 * hw + 80, h: 2 * hh + 80 }, (c) => {
    const path = (k) => { const d = dia(k); c.beginPath(); c.moveTo(d[0][0], d[0][1]); for (const q of d) c.lineTo(q[0], q[1]); c.closePath(); };
    // the glow it throws
    path(30); c.fillStyle = 'rgba(255,233,168,.08)'; c.fill();
    path(10); c.fillStyle = RED; c.fill();
    path(0); c.fillStyle = WHITE; c.fill();
    path(-6); c.strokeStyle = RED; c.lineWidth = 2; c.stroke();
  }, { t: 6.8, d: 0.9, reveal: 'iris', ease: 'inOut' });
  // the bulbs round the rim
  const bulbs = [];
  const d = dia(5);
  for (let k = 0; k < 4; k++) { const [ax, ay] = d[k], [bx, by] = d[(k + 1) % 4]; for (let i = 0; i < 16; i++) bulbs.push([lerp(ax, bx, i / 16), lerp(ay, by, i / 16)]); }
  p.group('signs', { x: WX - hw - 30, y: WY - hh - 30, w: 2 * hw + 60, h: 2 * hh + 60 }, (c) => {
    c.fillStyle = 'rgba(255,233,168,.3)'; c.beginPath(); for (const [x, y] of bulbs) { c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI * 2); } c.fill();
    c.fillStyle = BULB; c.beginPath(); for (const [x, y] of bulbs) { c.moveTo(x + 3.4, y); c.arc(x, y, 3.4, 0, Math.PI * 2); } c.fill();
  }, { t: 7.5, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // W E L C O M E, one coin at a time
  const word = 'WELCOME';
  [...word].forEach((ch, i) => {
    const x = WX + (i - 3) * 50, y = WY - 70 + Math.abs(i - 3) * 9;
    p.group('signs', { x: x - 30, y: y - 30, w: 60, h: 60 }, (c) => {
      c.fillStyle = '#d7dbe6'; c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#8b8fa3'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#aab0c2'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 18, 0, Math.PI * 2); c.stroke();
      c.fillStyle = RED; c.font = '400 26px "Fascinate"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(ch, x, y + 9);
    }, { t: 7.9 + i * 0.1, d: 0.5, reveal: 'pop', ease: 'back' });
  });
  // "to Fabulous", in script, and the state beneath, between two stars
  p.mark('signs', {
    t: 8.7, d: 0.9, reveal: 'wipe', ease: 'inOut', box: { x: WX - 150, y: WY - 30, w: 300, h: 80 },
    draw: (c) => { c.font = '400 46px "Yellowtail"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = ATOM_T; c.fillText('to the bright lights', WX, WY + 26); },
  });
  p.mark('signs', {
    t: 9.2, d: 0.5, reveal: 'press', box: { x: WX - 130, y: WY + 34, w: 260, h: 60 },
    draw: (c) => {
      c.font = '400 34px "Fascinate"'; c.textAlign = 'center'; c.fillStyle = RED; c.fillText('NEVADA', WX, WY + 78);
      burst(c, WX - 92, WY + 66, 12, LEMON, 4, 0.18); burst(c, WX + 92, WY + 66, 12, LEMON, 4, 0.18);
    },
  });
  // the star on top
  p.group('signs', { x: WX - 60, y: WY - hh - 140, w: 120, h: 130 }, (c) => {
    c.fillStyle = '#c9ccd6'; c.fillRect(WX - 3, WY - hh - 60, 6, 60);
    sputnik(c, WX, WY - hh - 86, 44, LEMON);
    c.fillStyle = RED; c.beginPath(); c.arc(WX, WY - hh - 86, 7, 0, Math.PI * 2); c.fill();
  }, { t: 9.4, d: 0.6, reveal: 'pop', ease: 'back' });
}

// ================================================================ the motel and its pylon
const MX = 1336; // the pylon's foot
const ARROW = [[1296, 800], [1120, 800], [1120, 1010], [1146, 1072]]; // the arrow's bulb path, then the head
function motel(p, r) {
  // the motel: a long low block with a folded-plate roof, doors in turquoise
  const y0 = 1340, y1 = 1470, x0 = 1180, x1 = PX1 + 20;
  p.group('motel', { x: x0 - 20, y: y0 - 80, w: x1 - x0 + 40, h: y1 - y0 + 100 }, (c) => {
    c.fillStyle = '#e8d6b8'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = '#bfa98d'; c.fillRect(x0, y1 - 18, x1 - x0, 18);
    // the zigzag roof
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(x0 - 16, y0 + 4);
    for (let x = x0 - 16, k = 0; x <= x1; x += 40, k++) c.lineTo(x, y0 + (k % 2 ? -26 : 4));
    c.lineTo(x1, y0 + 12); c.lineTo(x0 - 16, y0 + 12); c.closePath(); c.fill();
    c.fillStyle = '#1e7a72'; c.fillRect(x0 - 16, y0 + 4, x1 - x0 + 16, 10);
    // the doors and windows, some lit
    for (let x = x0 + 18, k = 0; x < x1 - 30; x += 54, k++) {
      c.fillStyle = k % 3 === 1 ? '#ffd88a' : '#2a6f8a'; c.fillRect(x, y0 + 40, 24, 34);
      c.fillStyle = '#2fa39a'; c.fillRect(x + 30, y0 + 30, 14, 70);
      c.fillStyle = WHITE; c.fillRect(x + 40, y0 + 64, 2, 2);
    }
    // the shade under the eave
    c.fillStyle = 'rgba(20,16,40,.35)'; c.fillRect(x0, y0 + 12, x1 - x0, 14);
  }, { t: 7.4, d: 0.9, reveal: 'rise', ease: 'inOut' });
  // the pylon: a tall tapering blade
  p.group('motel', { x: MX - 70, y: 430, w: 160, h: 1480 - 430 }, (c) => {
    c.fillStyle = '#e5543a'; c.beginPath(); c.moveTo(MX - 30, 1476); c.lineTo(MX - 50, 600); c.lineTo(MX + 50, 560); c.lineTo(MX + 26, 1476); c.closePath(); c.fill();
    c.fillStyle = '#b83a28'; c.beginPath(); c.moveTo(MX + 10, 1476); c.lineTo(MX + 18, 568); c.lineTo(MX + 50, 560); c.lineTo(MX + 26, 1476); c.closePath(); c.fill();
    // SKYROCKET down the blade in cream letters, outlined in turquoise neon
    c.font = '400 58px "Fascinate"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    [...'SKYROCKET'].forEach((ch, i) => { c.fillStyle = WHITE; c.fillText(ch, MX - 4, 650 + i * 60); });
    c.strokeStyle = 'rgba(82,226,212,.9)'; c.lineWidth = 1.4;
    [...'SKYROCKET'].forEach((ch, i) => c.strokeText(ch, MX - 4, 650 + i * 60));
  }, { t: 7.8, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // a boomerang board across it, MOTEL in neon
  p.group('motel', { x: MX - 160, y: 1240, w: 340, h: 120 }, (c) => {
    c.save(); c.translate(MX - 10, 1300); c.scale(4.6, 2.6);
    c.beginPath(); c.moveTo(-30, 8); c.quadraticCurveTo(0, -22, 30, 8); c.quadraticCurveTo(32, 14, 26, 12); c.quadraticCurveTo(0, -6, -26, 12); c.quadraticCurveTo(-32, 14, -30, 8); c.closePath();
    c.restore();
    c.fillStyle = '#1e7a72'; c.fill();
    neonText(c, 'MOTEL', MX - 10, 1312, '400 44px "Fascinate"', PINK, 2.4);
  }, { t: 8.6, d: 0.7, reveal: 'pop', ease: 'back' });
  // the starburst and the orbiting atom on top
  p.group('motel', { x: MX - 110, y: 380, w: 220, h: 200 }, (c) => {
    c.beginPath(); c.ellipse(MX, 500, 90, 28, -0.4, 0, Math.PI * 2); neon(c, TURQ, 3);
    c.beginPath(); c.ellipse(MX, 500, 90, 28, 0.6, 0, Math.PI * 2); neon(c, PINK, 3);
    burst(c, MX, 500, 58, LEMON, 6, 0.2);
    c.fillStyle = WHITE; c.beginPath(); c.arc(MX, 500, 10, 0, Math.PI * 2); c.fill();
  }, { t: 9.0, d: 0.7, reveal: 'pop', ease: 'back' });
  // the arrow: its frame drawn first; the bulbs along it are lit in the live layer
  p.group('motel', { x: 1060, y: 760, w: 280, h: 420 }, (c) => {
    c.beginPath(); c.moveTo(ARROW[0][0], ARROW[0][1]); for (const q of ARROW) c.lineTo(q[0], q[1]);
    c.strokeStyle = '#2a2250'; c.lineWidth = 26; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = '#3a2f6a'; c.lineWidth = 18; c.stroke();
    // its head, pointing down at the rooms
    const [hx, hy] = ARROW[3], L = Math.hypot(26, 62), dx = 26 / L, dy = 62 / L;
    const tri = (f, b, w) => { c.beginPath(); c.moveTo(hx + dx * f, hy + dy * f); c.lineTo(hx - dx * b - dy * w, hy - dy * b + dx * w); c.lineTo(hx - dx * b + dy * w, hy - dy * b - dx * w); c.closePath(); };
    tri(84, 4, 32); c.fillStyle = '#2a2250'; c.fill();
    tri(70, 0, 24); neon(c, ORANGE, 3); c.fillStyle = 'rgba(255,138,58,.35)'; c.fill();
  }, { t: 8.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // VACANCY and COCKTAILS signs by the road
  p.group('motel', { x: 1150, y: 1140, w: 180, h: 210 }, (c) => {
    c.fillStyle = '#c9ccd6'; c.fillRect(1196, 1196, 5, 140); c.fillRect(1290, 1196, 5, 30);
    c.fillStyle = '#1b1636'; c.fillRect(1166, 1158, 144, 42);
  }, { t: 8.9, d: 0.5, reveal: 'rise' });
  p.group('motel', { x: 1420, y: 1200, w: 120, h: 150 }, (c) => {
    c.fillStyle = '#c9ccd6'; c.fillRect(1468, 1260, 5, 84);
    c.beginPath(); c.moveTo(1436, 1214); c.lineTo(1506, 1214); c.lineTo(1471, 1262); c.closePath(); neon(c, LIME, 2.4);
    c.beginPath(); c.moveTo(1471, 1262); c.lineTo(1471, 1214); neon(c, LIME, 1.6, false);
    c.fillStyle = PINK; c.beginPath(); c.arc(1452, 1222, 5, 0, Math.PI * 2); c.fill();
    neonText(c, 'COCKTAILS', 1471, 1204, '400 15px "Fascinate"', LIME, 1);
  }, { t: 9.3, d: 0.6, reveal: 'pop' });
}

// ================================================================ Joshua trees
function joshua(c, x, y, s, seed) {
  const rr = rng(seed);
  c.strokeStyle = '#0f0d20'; c.lineCap = 'round'; c.lineJoin = 'round';
  const arm = (x0, y0, a, len, w, depth) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    if (depth > 0) { arm(x1, y1, a - rr.range(0.4, 0.8), len * 0.7, w * 0.75, depth - 1); arm(x1, y1, a + rr.range(0.4, 0.8), len * 0.7, w * 0.75, depth - 1); }
    else {
      // the spiky tuft at the end
      c.lineWidth = 1.2 * s; c.beginPath();
      for (let k = 0; k < 9; k++) { const b = -Math.PI / 2 + (k - 4) * 0.32; c.moveTo(x1, y1); c.lineTo(x1 + Math.cos(b) * 9 * s, y1 + Math.sin(b) * 9 * s); }
      c.stroke();
    }
  };
  arm(x, y, -Math.PI / 2, 46 * s, 7 * s, 2);
}
function plants(p, r) {
  const list = [
    // Joshua trees only: the saguaro is a Sonoran cactus and does not grow in the Mojave
    ['j', 650, 1236, 0.7], ['j', 180, 1290, 1.0], ['j', 560, 1300, 0.46], ['j', 1500, 1260, 0.8], ['j', 1080, 1236, 0.28],
    ['j', 960, 1220, 0.5], ['j', 140, 1520, 1.05], ['j', 222, 1424, 1.3], ['j', 1010, 1300, 0.36],
  ].sort((a, b) => a[2] - b[2]);
  list.forEach(([, x, y, s], i) => {
    const h = 200 * s;
    p.group('near', { x: x - 120 * s, y: y - h - 20, w: 240 * s, h: h + 30 }, (c) => {
      c.fillStyle = 'rgba(8,6,18,.5)'; c.beginPath(); c.ellipse(x + 20 * s, y + 2, 40 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
      joshua(c, x, y, s, 70 + i);
    }, { t: 8.8 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
}

// ================================================================ what moves
function life(p, r) {
  // two searchlights from the Strip, sweeping slowly
  p.live('beams', {
    t: 9.6, d: 1.5, reveal: 'fade',
    draw: (c, time) => {
      for (const [x, ph, sp] of [[700, 0, 0.35], [940, 2.2, 0.28]]) {
        const a = -Math.PI / 2 + Math.sin(time * sp + ph) * 0.42, L = 1200;
        c.fillStyle = 'rgba(255,240,210,.09)'; c.beginPath(); c.moveTo(x - 3, HOR - 20); c.lineTo(x + Math.cos(a - 0.035) * L, HOR - 20 + Math.sin(a - 0.035) * L); c.lineTo(x + Math.cos(a + 0.035) * L, HOR - 20 + Math.sin(a + 0.035) * L); c.lineTo(x + 3, HOR - 20); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,240,210,.08)'; c.beginPath(); c.moveTo(x, HOR - 20); c.lineTo(x + Math.cos(a - 0.012) * L, HOR - 20 + Math.sin(a - 0.012) * L); c.lineTo(x + Math.cos(a + 0.012) * L, HOR - 20 + Math.sin(a + 0.012) * L); c.closePath(); c.fill();
      }
    },
  });
  // the arrow's bulbs, chasing toward its head
  const path = ARROW.slice(0, 3);
  const bulbs = [];
  for (let i = 0; i < path.length - 1; i++) { const [ax, ay] = path[i], [bx, by] = path[i + 1], n = Math.round(Math.hypot(bx - ax, by - ay) / 22); for (let k = 0; k < n; k++) bulbs.push([lerp(ax, bx, k / n), lerp(ay, by, k / n)]); }
  bulbs.push(path[2]);
  p.live('live', {
    t: 9.8, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const step = Math.floor(time * 9);
      for (let i = 0; i < bulbs.length; i++) {
        const on = (i - step) % 3 === 0 || (i - step) % 3 === -0;
        const [x, y] = bulbs[i];
        c.fillStyle = on ? 'rgba(255,233,168,.35)' : 'rgba(0,0,0,0)';
        if (on) { c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = on ? BULB : '#6b5a4a'; c.beginPath(); c.arc(x, y, 4.2, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // VACANCY, buzzing on with a flicker
  p.live('live', {
    t: 10.0, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const f = Math.sin(time * 23) + Math.sin(time * 7.3) > 1.6 ? 0.25 : 1;
      c.globalAlpha *= f; neonText(c, 'VACANCY', 1238, 1188, '400 24px "Fascinate"', PINK, 1.4); c.globalAlpha = 1;
    },
  });
  // the stars that twinkle: a few sparkles growing and shrinking
  const tw = [];
  for (let i = 0; i < 16; i++) tw.push([r.range(PX0 + 40, PX1 - 40), r.range(PY0 + 40, 860), r() * 7, r.range(5, 10)]);
  p.live('live', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => { for (const [x, y, ph, R] of tw) { const k = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + ph)); burst(c, x, y, R * k, WHITE, 4, 0.12); } },
  });
  // a finned car with its tail lights heading off down the road, again and again
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const u = ((time - 10.2) * 0.07) % 1, t = lerp(0.85, 0.06, u ** 0.7);
      const y = HOR + (PY1 - HOR) * t, s = t * 2.6, x = VX + 70 * t;
      c.globalAlpha *= Math.min(1, u * 12, (1 - u) * 8); car(c, x, y, s);
    },
  });
}
// a 1950s car from behind: wide, with tail fins and round red lights
function car(c, x, y, s) {
  c.fillStyle = 'rgba(255,74,61,.18)'; c.beginPath(); c.ellipse(x, y + 4 * s, 46 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2fa39a'; c.beginPath(); c.moveTo(x - 34 * s, y); c.lineTo(x - 36 * s, y - 20 * s); c.lineTo(x - 30 * s, y - 28 * s); c.lineTo(x - 24 * s, y - 20 * s); c.lineTo(x + 24 * s, y - 20 * s); c.lineTo(x + 30 * s, y - 28 * s); c.lineTo(x + 36 * s, y - 20 * s); c.lineTo(x + 34 * s, y); c.closePath(); c.fill();
  c.fillStyle = WHITE; c.beginPath(); c.moveTo(x - 20 * s, y - 20 * s); c.lineTo(x - 14 * s, y - 36 * s); c.lineTo(x + 14 * s, y - 36 * s); c.lineTo(x + 20 * s, y - 20 * s); c.closePath(); c.fill();
  c.fillStyle = '#1b2a44'; c.beginPath(); c.moveTo(x - 16 * s, y - 22 * s); c.lineTo(x - 12 * s, y - 33 * s); c.lineTo(x + 12 * s, y - 33 * s); c.lineTo(x + 16 * s, y - 22 * s); c.closePath(); c.fill();
  c.fillStyle = '#c9ccd6'; c.fillRect(x - 34 * s, y - 6 * s, 68 * s, 4 * s);
  c.fillStyle = RED; for (const dx of [-28, 28]) { c.beginPath(); c.arc(x + dx * s, y - 14 * s, 3.4 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = 'rgba(255,74,61,.3)'; for (const dx of [-28, 28]) { c.beginPath(); c.arc(x + dx * s, y - 14 * s, 8 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#0c0a18'; c.fillRect(x - 30 * s, y, 10 * s, 4 * s); c.fillRect(x + 20 * s, y, 10 * s, 4 * s);
}

// ================================================================ the name
function title(p, r) {
  const cx = W / 2;
  // LAS VEGAS: atomic red over a turquoise shadow, letter by letter
  p.type('title', 'LAS VEGAS', cx, 1800, {
    family: '"Fascinate"', size: 232, color: ATOM_R, shadow: ATOM_T, sx: 10, sy: 10, align: 'center', track: 0.03, fit: 1360, t: 10.6, gap: 0.15, d: 0.7,
  });
  // the line under it, between boomerangs
  p.mark('title', {
    t: 12.2, d: 0.9, reveal: 'wipe', ease: 'inOut', box: { x: cx - 380, y: 1820, w: 760, h: 90 },
    draw: (c) => { c.font = '400 56px "Yellowtail"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = INK; c.fillText('where the desert never sleeps', cx, 1884); },
  });
  for (const s of [-1, 1]) {
    p.group('title', { x: cx + s * 440 - 60, y: 1830, w: 120, h: 80 }, (c) => {
      boomerang(c, cx + s * 440, 1866, 1.1, s * 0.3); c.fillStyle = ATOM_T; c.fill();
      burst(c, cx + s * 500, 1850, 14, ATOM_R, 4, 0.16);
    }, { t: 12.9 + (s > 0 ? 0.15 : 0), d: 0.5, reveal: 'pop', ease: 'back' });
  }
}
