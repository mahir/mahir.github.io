// Montreal: a poster in the Expo 67 manner, four inks on white, built from
// circles, triangles and boxes. The Biosphere fills the middle: Fuller's geodesic
// sphere, its near lattice in navy over the far one in blue, a red sun behind it,
// the minirail running through. Habitat 67 is stacked box on box on the quay in
// front; across the river stand Mount Royal with its cross, the towers of
// downtown with Place Ville Marie, the Olympic Stadium's leaning tower and the
// Jacques Cartier Bridge. The name runs across the foot in rounded geometric type.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly } from '../kit.js';

const PAPER = '#f1eee6';
const NAVY = '#16213f', COBALT = '#2456c4', VERM = '#ee4a26', AQUA = '#bfe2e6';
const COB_L = '#7d9be0', AQUA_D = '#93c9d0';

export const city = {
  id: 'montreal', name: 'Montreal',
  alt: "A poster in the Expo 67 manner in navy, blue, red and pale aqua: the Biosphere's geodesic sphere in front of a red sun with the minirail running through it, Habitat 67's stacked concrete boxes on the quay, the Jacques Cartier Bridge over the St. Lawrence, Mount Royal with its cross, downtown's towers with Place Ville Marie, and the Olympic Stadium's leaning tower, over the name MONTRÉAL",
  google: 'family=Montserrat+Alternates:wght@500;800',
  wall: '#141d33',
  fonts: [['800 100px "Montserrat Alternates"', 'MONTRÉAL'], ['500 30px "Montserrat Alternates"', 'TERRE DES HOMMES · EXPO 67 · QUÉBEC']],
  build,
};

const M = 70, PB = 1450; // margin; the picture's foot
const HZ = 1150; // the far shore
const CX = 900, R = 440, CY = HZ - 0.63 * R, CUT = HZ; // the Biosphere

function build() {
  const p = new Plate({ paper: PAPER, seed: 1967 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: PB - M };
  p.stack('sky', 'far', 'city', 'sphereB', 'rail', 'sphereF', 'river', 'bridge', 'habitat', 'live', 'foot');
  p.layer('foot', { clip: false });

  sky(p, r);
  far(p, r);
  downtown(p, r);
  sphere(p, r);
  river(p, r);
  habitat(p, r);
  lives(p, r);
  foot(p, r);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}

// ================================================================ the sky: a flat aqua field, the red sun, round clouds
const SX = 1180, SY = 560, SR = 230;
function sky(p, r) {
  p.group('sky', { x: M, y: M, w: W - 2 * M, h: HZ - M + 4 }, (c) => {
    c.fillStyle = AQUA; c.fillRect(M, M, W - 2 * M, HZ - M + 4);
  }, { t: 0.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // a fine screen of horizontal rules across the top of the sky
  const rules = [];
  for (let y = M + 14, k = 0; y < 640; y += 10 + k * 0.8, k++) rules.push([[M, y], [W - M, y]]);
  p.strokes('sky', rules, 'rgba(255,255,255,0.55)', 2, { t: 0.7, d: 1.2, reveal: 'fall', ease: 'inOut', box: { x: M, y: M, w: W - 2 * M, h: 580 } });
  p.group('sky', { x: SX - SR - 4, y: SY - SR - 4, w: 2 * SR + 8, h: 2 * SR + 8 }, (c) => {
    c.fillStyle = VERM; c.beginPath(); c.arc(SX, SY, SR, 0, Math.PI * 2); c.fill();
    // paper stripes across the sun's lower half, as on the period posters
    c.fillStyle = AQUA;
    for (let k = 0; k < 6; k++) { const y = SY + 40 + k * 34, h = 4 + k * 3.5; c.fillRect(SX - SR, y, 2 * SR, h); }
  }, { t: 1.0, d: 1.1, reveal: 'iris' });
  // clouds made of half circles on a rule
  const clouds = [[300, 300, 1.0], [560, 210, 0.7], [1380, 220, 0.6]];
  p.group('sky', { x: M, y: 120, w: W - 2 * M, h: 260 }, (c) => {
    c.fillStyle = '#ffffff';
    for (const [x, y, s] of clouds) {
      for (const [dx, rr] of [[-70, 38], [-20, 58], [40, 44], [86, 28]]) { c.beginPath(); c.arc(x + dx * s, y, rr * s, Math.PI, 0); c.fill(); }
      c.fillRect(x - 108 * s, y, 222 * s, 8 * s);
    }
  }, { t: 1.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ Mount Royal and its cross, the Olympic Stadium's tower
function far(p, r) {
  const hill = [[M, HZ], [M, 900], [140, 860], [230, 800], [330, 770], [420, 790], [520, 850], [620, 930], [700, HZ]];
  p.group('far', boxOf(hill, 4), (c) => {
    c.fillStyle = COB_L; path(c, hill); c.fill();
    // the mountain's woods: rows of navy dots, thinning toward the top
    c.fillStyle = 'rgba(22,33,63,0.35)';
    for (let y = 820; y < HZ; y += 16) for (let x = M + ((y / 16) % 2) * 8; x < 700; x += 16) {
      if (y < edgeY(hill, x) + 10) continue;
      const k = clamp((y - 800) / 300); c.beginPath(); c.arc(x, y, 2 + k * 3.5, 0, Math.PI * 2); c.fill();
    }
  }, { t: 1.3, d: 1.0, reveal: 'rise' });
  // the cross on the summit: a steel lattice, drawn by a pen
  const kx = 330, ky = 772;
  const cross = [[[kx, ky], [kx, ky - 150]], [[kx - 44, ky - 110], [kx + 44, ky - 110]]];
  p.strokes('far', cross, NAVY, 9, { t: 2.0, d: 0.7, reveal: 'rise', cap: 'butt' });
  const latt = [];
  for (let y = ky - 6; y > ky - 150; y -= 12) latt.push([[kx - 4, y], [kx + 4, y - 6]]);
  p.strokes('far', latt, AQUA, 1.5, { t: 2.5, d: 0.5, reveal: 'rise' });
  // the Olympic Stadium on the right: the shell, the tower leaning over it
  const ox = 1400;
  p.group('far', { x: 1260, y: 720, w: 290, h: 440 }, (c) => {
    c.fillStyle = COB_L; c.beginPath(); c.moveTo(1290, HZ); c.quadraticCurveTo(1300, 1040, 1420, 1030); c.quadraticCurveTo(1540, 1030, 1540, HZ); c.fill();
    c.fillStyle = NAVY; for (let k = 0; k < 9; k++) { const x = 1310 + k * 26; c.fillRect(x, 1070 + Math.abs(k - 4) * 6, 6, HZ - 1070); }
    // the tower: a curved spine leaning right, its cables to the roof
    c.fillStyle = NAVY; c.beginPath(); c.moveTo(ox - 44, HZ); c.quadraticCurveTo(ox - 40, 900, ox + 40, 760); c.lineTo(ox + 70, 772); c.quadraticCurveTo(ox + 10, 920, ox + 6, HZ); c.fill();
    c.fillStyle = VERM; c.fillRect(ox + 36, 770, 30, 12);
    c.strokeStyle = NAVY; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 8; k++) { c.moveTo(ox + 50, 780 + k * 6); c.lineTo(1430 + k * 14, 1034); }
    c.stroke();
  }, { t: 2.2, d: 1.2, reveal: 'rise' });
}
function edgeY(pts, x) {
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; if (x >= x0 && x <= x1 && x1 !== x0) return lerp(y0, y1, (x - x0) / (x1 - x0)); }
  return HZ;
}

// ================================================================ downtown: flat navy towers with paper windows
function downtown(p, r) {
  const towers = [];
  let x = 110;
  while (x < 1290) {
    const w = r.range(36, 80);
    const behind = x > 460 && x < 1340;
    towers.push({ x, w, h: behind ? r.range(80, 200) : r.range(120, 300), kind: 'plain' });
    x += w + r.range(4, 16);
  }
  // Place Ville Marie, its cruciform slab; the copper pyramid of 1000 de La Gauchetière
  towers.push({ x: 360, w: 120, h: 380, kind: 'pvm' });
  towers.push({ x: 520, w: 64, h: 420, kind: 'pyr' });
  towers.sort((a, b) => a.h - b.h).reverse();
  const front = towers.filter((t) => t.kind !== 'plain');
  const plain = towers.filter((t) => t.kind === 'plain');
  const winsOf = (t) => {
    const out = [];
    for (let y = HZ - t.h + 14; y < HZ - 10; y += 14) for (let xx = t.x + 6; xx < t.x + t.w - 8; xx += 10) out.push([xx, y]);
    return out;
  };
  // the plain blocks rise in three groups, left to right
  for (let g = 0; g < 3; g++) {
    const set = plain.filter((t, i) => i % 3 === g);
    const bx = { x: M, y: HZ - 320, w: 1300, h: 330 };
    p.group('city', bx, (c) => {
      for (const t of set) {
        c.fillStyle = g === 1 ? COBALT : NAVY; c.fillRect(t.x, HZ - t.h, t.w, t.h);
        c.fillStyle = g === 1 ? 'rgba(241,238,230,0.5)' : 'rgba(191,226,230,0.55)';
        for (const [wx, wy] of winsOf(t)) c.fillRect(wx, wy, 5, 6);
      }
    }, { t: 1.8 + g * 0.35, d: 1.0, reveal: 'rise' });
  }
  p.group('city', { x: 340, y: HZ - 520, w: 270, h: 530 }, (c) => {
    for (const t of front) {
      if (t.kind === 'pvm') {
        // the cross-shaped plan read in elevation: a central slab and two set-back wings
        c.fillStyle = NAVY; c.fillRect(t.x, HZ - t.h + 20, t.w, t.h - 20);
        c.fillStyle = COBALT; c.fillRect(t.x + t.w * 0.34, HZ - t.h, t.w * 0.32, t.h);
        c.fillStyle = 'rgba(241,238,230,0.75)';
        for (let y = HZ - t.h + 26; y < HZ - 8; y += 9) { c.fillRect(t.x + 4, y, t.w * 0.3 - 6, 3); c.fillRect(t.x + t.w * 0.7 + 2, y, t.w * 0.3 - 6, 3); }
        c.fillStyle = 'rgba(191,226,230,0.8)'; for (let y = HZ - t.h + 8; y < HZ - 8; y += 9) c.fillRect(t.x + t.w * 0.38, y, t.w * 0.24, 3);
      } else {
        c.fillStyle = NAVY; c.fillRect(t.x, HZ - t.h + 70, t.w, t.h - 70);
        c.fillStyle = VERM; poly(c, [[t.x - 2, HZ - t.h + 70], [t.x + t.w + 2, HZ - t.h + 70], [t.x + t.w / 2, HZ - t.h]]); c.fill();
        c.fillStyle = 'rgba(191,226,230,0.7)'; for (let y = HZ - t.h + 82; y < HZ - 8; y += 11) for (let xx = t.x + 6; xx < t.x + t.w - 6; xx += 10) c.fillRect(xx, y, 5, 5);
      }
    }
  }, { t: 2.8, d: 1.1, reveal: 'rise' });
}

// ================================================================ the Biosphere: a geodesic sphere, near lattice over far
function geodesic(n) {
  const t = (1 + Math.sqrt(5)) / 2;
  const V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const edges = new Map();
  const key = (a) => a.map((x) => x.toFixed(4)).join(',');
  const add = (a, b) => { const ka = key(a), kb = key(b), k = ka < kb ? ka + '|' + kb : kb + '|' + ka; if (!edges.has(k)) edges.set(k, [a, b]); };
  for (const [i, j, k] of F) {
    const A = V[i], B = V[j], C = V[k];
    const pt = (u, v) => norm([0, 1, 2].map((q) => A[q] + (B[q] - A[q]) * u / n + (C[q] - A[q]) * v / n));
    for (let u = 0; u < n; u++) for (let v = 0; v < n - u; v++) {
      const a = pt(u, v), b = pt(u + 1, v), c2 = pt(u, v + 1);
      add(a, b); add(b, c2); add(c2, a);
    }
  }
  return [...edges.values()];
}
function sphere(p, r) {
  // turn the solid a little so no pole points at us, then project
  const ax = 0.42, ay = 0.3;
  const rot = ([x, y, z]) => {
    let y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax);
    let x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
    return [x2, y1, z2];
  };
  const proj = ([x, y]) => [CX + x * R, CY - y * R];
  const front = [], back = [];
  for (const [a, b] of geodesic(9)) {
    const A = rot(a), B = rot(b);
    const pa = proj(A), pb = proj(B);
    if (pa[1] > CUT + 2 && pb[1] > CUT + 2) continue;
    ((A[2] + B[2]) / 2 > 0 ? front : back).push([pa, pb]);
  }
  // the glass: a pale disc, cut flat at the foot
  const clipCut = (c) => { c.beginPath(); c.rect(CX - R - 10, CY - R - 10, 2 * R + 20, CUT - (CY - R - 10)); c.clip(); };
  p.group('sphereB', { x: CX - R - 6, y: CY - R - 6, w: 2 * R + 12, h: CUT - CY + R + 8 }, (c) => {
    c.save(); clipCut(c);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.arc(CX, CY, R, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 3.0, d: 1.0, reveal: 'iris' });
  // the far lattice builds from the ground up in bands, then the near one over it
  const bands = (list, nb) => {
    const sorted = [...list].sort((a, b) => (b[0][1] + b[1][1]) - (a[0][1] + a[1][1]));
    const out = []; const per = Math.ceil(sorted.length / nb);
    for (let i = 0; i < nb; i++) out.push(sorted.slice(i * per, (i + 1) * per));
    return out.filter((b) => b.length);
  };
  bands(back, 8).forEach((set, i) => {
    p.mark('sphereB', {
      t: 3.4 + i * 0.28, d: 0.9, reveal: 'rise', box: boxOf(set.flat(), 4),
      draw: (c) => {
        c.save(); clipCut(c);
        c.strokeStyle = COB_L; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
        for (const [a, b] of set) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke(); c.restore();
      },
    });
  });
  bands(front, 10).forEach((set, i) => {
    p.mark('sphereF', {
      t: 5.0 + i * 0.3, d: 0.9, reveal: 'rise', box: boxOf(set.flat(), 4),
      draw: (c) => {
        c.save(); clipCut(c);
        c.strokeStyle = NAVY; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
        for (const [a, b] of set) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke(); c.restore();
      },
    });
  });
  // the rim and the base ring where it meets the island
  const hw = Math.sqrt(R * R - (CUT - CY) ** 2);
  p.group('sphereF', { x: CX - R - 8, y: CY - R - 8, w: 2 * R + 16, h: CUT - CY + R + 30 }, (c) => {
    c.save(); clipCut(c);
    c.strokeStyle = NAVY; c.lineWidth = 4; c.beginPath(); c.arc(CX, CY, R, 0, Math.PI * 2); c.stroke();
    c.restore();
    c.fillStyle = NAVY; c.fillRect(CX - hw - 20, CUT - 6, 2 * hw + 40, 12);
  }, { t: 7.8, d: 0.8, reveal: 'fade' });
  // the minirail's track, through the sphere
  p.group('rail', { x: M, y: RAILY - 10, w: W - 2 * M, h: 60 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(M, RAILY, W - 2 * M, 7);
    for (let x = M + 40; x < W - M; x += 120) c.fillRect(x - 4, RAILY, 8, HZ - RAILY);
  }, { t: 4.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}
const RAILY = 1050;

// ================================================================ the St. Lawrence: bands of blue, the Jacques Cartier Bridge
function river(p, r) {
  p.group('river', { x: M, y: HZ - 2, w: W - 2 * M, h: PB - HZ + 4 }, (c) => {
    c.fillStyle = COBALT; c.fillRect(M, HZ, W - 2 * M, PB - HZ);
  }, { t: 2.6, d: 0.8, reveal: 'fall' });
  // white rules on the water, finer near the far shore
  const lines = [];
  for (let y = HZ + 10, k = 0; y < PB; k++, y += 8 + k * 1.6) {
    const segs = [];
    let x = M;
    while (x < W - M) { const l = r.range(60, 260) * (1 + k * 0.1); segs.push([[x, y], [Math.min(W - M, x + l), y]]); x += l + r.range(14, 60); }
    lines.push({ segs, w: 1.2 + k * 0.35 });
  }
  lines.forEach(({ segs, w }, i) => p.strokes('river', segs, 'rgba(241,238,230,0.55)', w, { t: 3.0 + i * 0.07, d: 0.7, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' }));
  // the bridge: a cantilever truss on piers, low across the right of the river
  const y0 = 1240, x0 = 860, x1 = W - M;
  const top = (x) => y0 - 30 - 90 * Math.max(0, Math.sin(clamp((x - 1040) / 360) * Math.PI)) - 40 * Math.max(0, Math.sin(clamp((x - 1400) / 200) * Math.PI));
  const members = [];
  for (let x = x0, k = 0; x < x1; x += 24, k++) {
    members.push([[x, y0], [x, top(x)]]);
    members.push(k % 2 ? [[x, y0], [x + 24, top(x + 24)]] : [[x, top(x)], [x + 24, y0]]);
    members.push([[x, top(x)], [x + 24, top(x + 24)]]);
  }
  p.group('bridge', { x: x0 - 10, y: y0 - 6, w: x1 - x0 + 20, h: 120 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(x0, y0, x1 - x0, 12);
    for (const x of [960, 1040, 1400, 1520]) c.fillRect(x - 12, y0, 24, 110);
  }, { t: 6.0, d: 0.8, reveal: 'wipeL' });
  p.strokes('bridge', members, NAVY, 2.4, { t: 6.4, d: 1.4, reveal: 'wipeL', ease: 'inOut' });
}

// ================================================================ Habitat 67: boxes stacked on the quay, dropped in one by one
function habitat(p, r) {
  const OX = 120, OY = 1110, A = 34, Z = 40; // the origin of the grid, cell size, story height
  const P3 = (i, j, k) => [OX + (i - j) * A, OY + (i + j) * A * 0.5 - k * Z];
  // the quay it stands on: a paper deck with a navy edge, running out into the river
  const deck = [P3(-3, -3, 0), P3(22, -3, 0), P3(22, 4, 0), P3(-3, 4, 0)];
  const side = [P3(-3, 4, 0), P3(22, 4, 0), P3(22, 4, -3), P3(-3, 4, -3)];
  const side2 = [P3(22, -3, 0), P3(22, 4, 0), P3(22, 4, -3), P3(22, -3, -3)];
  p.group('habitat', boxOf([...deck, ...side, ...side2], 4), (c) => {
    c.fillStyle = '#dcd8cd'; path(c, deck); c.fill();
    c.fillStyle = NAVY; path(c, side); c.fill(); path(c, side2); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath();
    for (let i = -2; i < 22; i += 2) { const a = P3(i, -3, 0), b = P3(i, 4, 0); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.globalAlpha = 0.25; c.stroke(); c.globalAlpha = 1;
  }, { t: 6.8, d: 0.8, reveal: 'rise' });
  // modules: long boxes stacked in a stepped ridge, turning at each story, some left out
  const mods = [];
  const levels = 7;
  for (let k = 0; k < levels; k++) {
    const along = k % 2 === 0;
    const i0 = k * 1.4 - 1, i1 = 20 - k * 1.6;
    for (let i = i0 + (k % 3) * 0.6; i < i1; i += along ? 3.2 : 2.2) {
      if (k > 0 && r.chance(0.14 + k * 0.03)) continue;
      const j = along ? (k % 4 === 0 ? -1 : 0) + r.int(0, 1) * 0.5 : -1.6 + r.int(0, 1);
      mods.push({ i, j, k, di: along ? 2.8 : 1.4, dj: along ? 1.4 : 2.8, plant: r.chance(0.35), win: r.int(0, 2) });
    }
  }
  mods.sort((a, b) => (a.k - b.k) || ((a.i + a.j) - (b.i + b.j)));
  // drawn back to front so nearer boxes cover farther ones; arrival is by story
  mods.forEach((m, n) => {
    const { i, j, k, di, dj } = m;
    const t0 = P3(i, j, k + 1), t1 = P3(i + di, j, k + 1), t2 = P3(i + di, j + dj, k + 1), t3 = P3(i, j + dj, k + 1);
    const b1 = P3(i + di, j, k), b2 = P3(i + di, j + dj, k), b3 = P3(i, j + dj, k);
    const pts = [t0, t1, t2, t3, b1, b2, b3];
    p.group('habitat', boxOf(pts, 6), (c) => {
      // top, the right face (in shade), the left face (in light)
      c.fillStyle = PAPER; path(c, [t0, t1, t2, t3]); c.fill();
      c.fillStyle = NAVY; path(c, [t1, t2, b2, b1]); c.fill();
      c.fillStyle = AQUA_D; path(c, [t3, t2, b2, b3]); c.fill();
      c.strokeStyle = NAVY; c.lineWidth = 1.5; path(c, [t0, t1, t2, t3]); c.stroke(); path(c, [t3, t2, b2, b3]); c.stroke();
      // windows: a long band on the light face, a square on the dark
      const lf = (u, v) => [lerp(lerp(b3[0], b2[0], u), lerp(t3[0], t2[0], u), v), lerp(lerp(b3[1], b2[1], u), lerp(t3[1], t2[1], u), v)];
      const rf = (u, v) => [lerp(lerp(b1[0], b2[0], u), lerp(t1[0], t2[0], u), v), lerp(lerp(b1[1], b2[1], u), lerp(t1[1], t2[1], u), v)];
      c.fillStyle = COBALT; path(c, [lf(0.12, 0.28), lf(m.win ? 0.55 : 0.88, 0.28), lf(m.win ? 0.55 : 0.88, 0.74), lf(0.12, 0.74)]); c.fill();
      if (m.win) { path(c, [lf(0.66, 0.28), lf(0.88, 0.28), lf(0.88, 0.74), lf(0.66, 0.74)]); c.fill(); }
      c.fillStyle = 'rgba(191,226,230,0.85)'; path(c, [rf(0.25, 0.32), rf(0.6, 0.32), rf(0.6, 0.7), rf(0.25, 0.7)]); c.fill();
      // a planter on the roof terrace
      if (m.plant) {
        const [px, py] = [(t0[0] + t2[0]) / 2, (t0[1] + t2[1]) / 2];
        c.fillStyle = VERM; c.beginPath(); c.arc(px - 8, py - 4, 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = COBALT; c.beginPath(); c.arc(px + 6, py - 7, 9, 0, Math.PI * 2); c.fill();
      }
    }, { t: 7.2 + n * 0.075, d: 0.5, reveal: 'drop', dy: 40, ease: 'out' });
  });
}

// ================================================================ what moves: the minirail, boats, flags
function lives(p, r) {
  // the minirail: a little train of five cars gliding through the sphere and on
  p.live('rail', {
    t: 8.4, d: 1.0,
    draw: (c, time) => {
      const span = W - 2 * M + 400, x0 = M - 300 + ((time - 8.4) * 70) % span;
      for (let k = 0; k < 5; k++) {
        const x = x0 - k * 54;
        if (x < M - 60 || x > W - M + 10) continue;
        c.fillStyle = k === 0 ? VERM : COBALT; c.beginPath(); c.roundRect(x, RAILY - 28, 50, 26, k === 0 ? [12, 4, 4, 4] : 4); c.fill();
        c.fillStyle = AQUA; c.fillRect(x + 6, RAILY - 22, 38, 8);
      }
    },
  });
  // sailboats and a hydrofoil on the river
  const boats = [[900, 1330, 0.7, 14], [1180, 1410, 1.0, 20], [1420, 1300, 0.55, 10]];
  p.live('live', {
    t: 9.0, d: 1.0,
    draw: (c, time) => {
      for (let i = 0; i < boats.length; i++) {
        const [bx, y, s, sp] = boats[i];
        const x = 840 + ((bx - 840 + (time - 9) * sp) % (W - M - 880)) + 20;
        c.fillStyle = NAVY; c.beginPath(); c.moveTo(x - 30 * s, y); c.lineTo(x + 30 * s, y); c.lineTo(x + 22 * s, y + 9 * s); c.lineTo(x - 22 * s, y + 9 * s); c.fill();
        c.fillStyle = i % 2 ? VERM : PAPER; poly(c, [[x - 2 * s, y - 4], [x - 2 * s, y - 70 * s], [x - 34 * s, y - 4]]); c.fill();
        c.fillStyle = i % 2 ? PAPER : VERM; poly(c, [[x + 2 * s, y - 4], [x + 2 * s, y - 56 * s], [x + 24 * s, y - 4]]); c.fill();
      }
    },
  });
  // gulls wheeling over the river
  const gulls = [];
  for (let i = 0; i < 6; i++) gulls.push([r.range(700, 1450), r.range(1180, 1300), r() * 6, r.range(0.8, 1.2)]);
  p.live('live', {
    t: 9.6, d: 1.0,
    draw: (c, time) => {
      c.strokeStyle = NAVY; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'miter'; c.beginPath();
      for (const [x, y, ph, s] of gulls) {
        const bx = x + Math.sin(time * 0.25 + ph) * 60, by = y - 120 + Math.sin(time * 0.6 + ph) * 12, f = Math.sin(time * 3.4 + ph) * 6 * s;
        c.moveTo(bx - 18 * s, by - f); c.lineTo(bx, by + 4 * s); c.lineTo(bx + 18 * s, by - f);
      }
      c.stroke();
    },
  });
}

// ================================================================ the foot: a band of triangles, the name, the line
function foot(p, r) {
  // a band of triangles in the four inks, under the picture
  const tri = [];
  const cols = [NAVY, COBALT, VERM, AQUA];
  for (let k = 0, x = M; x < W - M - 1; k++, x += 40) tri.push([x, k % 2, cols[(k * 3 + (k >> 2)) % 4]]);
  p.group('foot', { x: M, y: PB, w: W - 2 * M, h: 44 }, (c) => {
    for (const [x, up, col] of tri) {
      c.fillStyle = col; c.beginPath();
      if (up) { c.moveTo(x, PB + 40); c.lineTo(x + 40, PB + 40); c.lineTo(x + 20, PB + 4); }
      else { c.moveTo(x, PB + 4); c.lineTo(x + 40, PB + 4); c.lineTo(x + 20, PB + 40); }
      c.fill();
    }
  }, { t: 10.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  p.type('foot', 'MONTRÉAL', W / 2, 1745, { size: 250, family: '"Montserrat Alternates"', weight: 800, color: NAVY, align: 'center', fit: W - 2 * M, track: -0.02, t: 10.8, gap: 0.16, d: 0.6, reveal: 'drop' });
  p.group('foot', { x: M, y: 1790, w: W - 2 * M, h: 10 }, (c) => { c.fillStyle = VERM; c.fillRect(M, 1792, W - 2 * M, 6); }, { t: 12.4, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  p.type('foot', 'TERRE DES HOMMES · EXPO 67 · QUÉBEC', W / 2, 1870, { size: 30, family: '"Montserrat Alternates"', weight: 500, color: NAVY, align: 'center', track: 0.32, t: 12.8, gap: 0.025, d: 0.3, reveal: 'fade' });
}
