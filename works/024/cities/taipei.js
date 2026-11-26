// Taipei: a hand-painted 1960s Taiwanese film poster. Taipei 101 rises like a
// stalk of bamboo, node over node, into a dramatic painted sky of jade and pink
// cloud, a light breaking behind its crown. Below, the hills with the Grand
// Hotel's palace roof, the blue roof of the Chiang Kai-shek Memorial Hall and a
// town of signboards; in front, the swallowtail roof of Longshan Temple with two
// dragons on its ridge playing with a flaming pearl, red lanterns under the
// eaves and scooters in the street. The title 臺北 is painted down the left in
// red with a yellow edge and a deep shadow, the credits on the cream margin.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, mix, shade } from '../kit.js';

const PAPER = '#efe5cc', INK = '#1d1420';
const NIGHT = '#123a55', JADE = '#1f7a78', MINT = '#86c8a8', GLOW = '#f6dd94', SALMON = '#ee9873';
const VIOLET = '#5a3a6c', PINK = '#ee9aa0', PEACH = '#ffd9a6';
const GLASS_L = '#9fd8c8', GLASS_M = '#3f8f95', GLASS_D = '#1d4756', GLASS_DD = '#163746';
const TILE = '#c4452a', TILE_D = '#8a2a1e', TILE_L = '#e0704a', GREEN = '#2f9468', GREEN_D = '#1d5f45';
const GOLD = '#f0b93a', GOLD_D = '#a8741c', RED = '#d92a1c', YELLOW = '#ffd84a', CREAM = '#fff4d8';

const FACE = '"Noto Serif TC"';
const CREDITS = '臺北市 · 臺北101 · 龍山寺 · 圓山大飯店 · 中正紀念堂';
const SIGNS = '茶麵書藥布飯酒茶行店';

export const city = {
  id: 'taipei', name: 'Taipei', wall: '#173340',
  alt: 'A hand-painted 1960s film poster of Taipei: Taipei 101 rising node over node into a jade and pink sky with light breaking behind its crown, the Grand Hotel on its green hill, the blue roof of the Chiang Kai-shek Memorial Hall and a town of signboards, and in front the swallowtail roof of Longshan Temple with two dragons on its ridge and a flaming pearl between them, red lanterns under the eaves and scooters in the street, with the name 臺北 painted down the left and TAIPEI on the cream margin',
  google: 'family=Noto+Serif+TC:wght@500;900',
  fonts: [['900 300px "Noto Serif TC"', '臺北TAIPEI彩色巨片寶島之都' + SIGNS], ['500 34px "Noto Serif TC"', CREDITS + '彩色寬銀幕']],
  build,
};

// the painted picture, and the cream margin below it
const X0 = 44, X1 = W - 44, Y0 = 44, Y1 = 1790;
const TX = 1040; // the tower's axis
const G = 1470;  // the tower's foot (behind the temple roof)

function build() {
  const p = new Plate({ paper: PAPER, seed: 101 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'brush', 'cloud', 'far', 'town', 'tower', 'mist', 'temple', 'ridge', 'street', 'live', 'title', 'frame');
  p.layer('frame', { clip: false });

  frame(p);
  sky(p, r);
  clouds(p, r);
  hills(p, r);
  hotel(p);
  town(p, r);
  memorial(p);
  tower(p, r);
  mist(p, r);
  temple(p, r);
  dragons(p, r);
  street(p, r);
  live(p, r);
  title(p);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([k, col]) => g.addColorStop(k, col));
  return g;
}

// ================================================================ the sheet
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(X0 - 1.5, Y0 - 1.5, X1 - X0 + 3, Y1 - Y0 + 3);
    c.strokeStyle = RED; c.lineWidth = 2; c.strokeRect(X0 - 16, Y0 - 16, X1 - X0 + 32, H - 2 * Y0 + 32 - 28);
  }, { t: 0, d: 0.8, reveal: 'fade' });
}

// ================================================================ sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 1500 }, (c) => {
    c.fillStyle = vgrad(c, Y0, 1450, [[0, NIGHT], [0.3, JADE], [0.56, MINT], [0.76, GLOW], [1, SALMON]]);
    c.fillRect(X0, Y0, X1 - X0, 1500);
  }, { t: 0, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // a light breaking behind the crown
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 1200 }, (c) => {
    const g = c.createRadialGradient(TX, 380, 20, TX, 380, 720);
    g.addColorStop(0, 'rgba(255,246,210,0.85)'); g.addColorStop(0.35, 'rgba(255,226,160,0.35)'); g.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, 1200);
    // long soft rays
    c.fillStyle = 'rgba(255,240,200,0.12)';
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (k - 6.5) * 0.2;
      c.beginPath(); c.moveTo(TX, 380);
      c.lineTo(TX + Math.cos(a - 0.035) * 1500, 380 + Math.sin(a - 0.035) * 1500);
      c.lineTo(TX + Math.cos(a + 0.035) * 1500, 380 + Math.sin(a + 0.035) * 1500); c.fill();
    }
  }, { t: 0.7, d: 1.6, reveal: 'iris', ease: 'soft' });

  // the brush: short loose strokes over the whole sky, light and dark
  const sets = [[[], 'rgba(255,240,205,0.16)', 5], [[], 'rgba(12,40,60,0.14)', 4], [[], 'rgba(255,170,150,0.16)', 6], [[], 'rgba(255,255,240,0.2)', 2.5]];
  for (let i = 0; i < 900; i++) {
    const y = r.range(Y0 + 10, 1420), x = r.range(X0 - 40, X1);
    const k = (y - Y0) / 1400;
    const set = k > 0.62 ? r.pick([0, 2, 2, 3]) : k < 0.3 ? r.pick([1, 1, 3]) : r.pick([0, 1, 3]);
    const L = r.range(40, 170), a = r.range(-0.08, 0.05);
    const pts = [];
    for (let s = 0; s <= 4; s++) pts.push([x + (L * s) / 4, y + Math.sin(s * 1.3 + i) * 2 + a * (L * s) / 4]);
    sets[set][0].push(pts);
  }
  sets.forEach(([lines, col, w], i) => p.strokes('brush', lines, col, w, { t: 1.1 + i * 0.35, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut', box: { x: X0 - 50, y: Y0, w: X1 - X0 + 100, h: 1420 } }));
}

// a painted cloud: violet shadow, pink body, a peach edge toward the light
function cloudPuffs(r, x, y, w, h) {
  const out = [];
  const n = Math.max(5, Math.round(w / (h * 0.38)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, lift = Math.sin(t * Math.PI) ** 0.7;
    out.push([x + t * w + r.range(-0.1, 0.1) * w / n, y - h * 0.45 * lift, (w / n) * r.range(0.6, 0.85) * (0.7 + 0.5 * lift)]);
  }
  for (let i = 0; i < n; i++) out.push([x + w * r.range(0.15, 0.85), y - h * r.range(0.4, 0.85), (w / n) * r.range(0.6, 1.0)]);
  for (let i = 0; i < n; i++) out.push([x + w * r.range(0.05, 0.95), y - h * r.range(0.05, 0.3), (w / n) * r.range(0.4, 0.7)]);
  return out;
}
function paintCloud(c, puffs, foot, lx) {
  c.save();
  c.beginPath(); c.rect(X0 - 400, Y0 - 400, X1 - X0 + 800, foot + 400 - Y0); c.clip();
  const layer = (col, k, dx, dy) => {
    c.fillStyle = col; c.beginPath();
    for (const [x, y, rr] of puffs) { const ox = x + dx * rr, oy = y + dy * rr; c.moveTo(ox + rr * k, oy); c.arc(ox, oy, rr * k, 0, Math.PI * 2); }
    c.fill();
  };
  // lit from one side: a peach rim, the pink body, mauve and violet shade below
  const sx = Math.sign(lx);
  layer(PEACH, 1, 0, 0);
  layer(PINK, 0.96, -sx * 0.14, 0.1);
  layer('#d78aa2', 0.84, -sx * 0.2, 0.34);
  layer('#9a5a8c', 0.5, -sx * 0.22, 0.85);
  c.restore();
}

function clouds(p, r) {
  const list = [
    // x, foot, w, h, light from (sign)
    [X0 - 60, 820, 640, 230, 1], [1180, 760, 420, 150, -1], [X0 + 40, 1050, 380, 90, 1],
    [1240, 1020, 360, 80, -1], [560, 640, 260, 80, 1], [1290, 470, 260, 70, -1], [120, 330, 300, 80, 1],
  ];
  list.forEach(([x, foot, w, h, lx], i) => {
    const pf = cloudPuffs(r, x, foot, w, h);
    const bx = boxOf(pf.map(([a, b]) => [a, b]), Math.max(...pf.map((q) => q[2])) + 8);
    p.group('cloud', bx, (c) => paintCloud(c, pf, foot, lx), { t: 1.6 + i * 0.3, d: 1.4, reveal: lx > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
  // thin streaks of pink low over the hills
  const streaks = [];
  for (let i = 0; i < 16; i++) {
    const y = r.range(1080, 1220), x = r.range(X0, X1 - 200), L = r.range(120, 380);
    streaks.push([[x, y], [x + L * 0.5, y - 3], [x + L, y + 1]]);
  }
  p.strokes('cloud', streaks, 'rgba(255,190,170,0.55)', 7, { t: 3.6, d: 1.0, reveal: 'wipe' });
}

// ================================================================ hills, hotel, town
function hills(p, r) {
  const ridge = (x0, x1, base, f) => { const pts = [[x0, base]]; for (let x = x0; x <= x1; x += 12) pts.push([x, f(x)]); pts.push([x1, base]); return pts; };
  const far = ridge(X0, X1, 1460, (x) => 1215 + Math.sin(x * 0.006) * 18 + Math.sin(x * 0.021 + 1) * 6);
  p.fill('far', far, mix(VIOLET, SALMON, 0.45), { t: 2.2, d: 1.0, reveal: 'rise' });
  // Elephant Mountain behind the tower's right
  const ele = ridge(1100, X1, 1460, (x) => 1160 + 90 * ((x - 1400) / 300) ** 2 + Math.sin(x * 0.05) * 5);
  // Jiantan hill under the hotel
  const jian = ridge(X0, 760, 1460, (x) => 1262 + 120 * ((x - 340) / 420) ** 2 + Math.sin(x * 0.07) * 4);
  for (const [pts, t, lit] of [[ele, 2.6, -1], [jian, 2.8, 1]]) {
    const b = boxOf(pts, 4);
    // the trees on the hill: dabs of dark and light green, made at build time
    const dabs = [[], [], []];
    for (let i = 0; i < 520; i++) {
      const x = r.range(b.x, b.x + b.w), y = r.range(b.y, b.y + b.h);
      if (!inside(pts, x, y)) continue;
      const k = (x - b.x) / b.w, lightSide = lit > 0 ? 1 - k : k;
      dabs[r() < 0.25 + lightSide * 0.4 ? 2 : r() < 0.5 ? 1 : 0].push([x, y, r.range(5, 11)]);
    }
    p.group('far', b, (c) => {
      c.fillStyle = vgrad(c, b.y, b.y + 260, [[0, '#3f7d5e'], [1, '#22493f']]); path(c, pts); c.fill();
      c.save(); path(c, pts); c.clip();
      ['#1d3f37', '#2f6a52', '#6fa874'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); for (const [x, y, rr] of dabs[i]) { c.moveTo(x + rr, y); c.ellipse(x, y, rr, rr * 0.7, 0, 0, Math.PI * 2); } c.fill(); });
      c.restore();
      // a warm rim on the ridge
      c.strokeStyle = 'rgba(255,214,150,0.7)'; c.lineWidth = 3; path(c, pts.slice(1, -1), false); c.stroke();
    }, { t, d: 1.0, reveal: 'rise' });
  }
}

function inside(pts, x, y) {
  let k = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
}

// a Chinese roof seen from the front: eave line with upturned ends, a ridge
function roofShape(cx, eaveY, halfW, rise, lift, ridgeHalf) {
  return [
    [cx - halfW - lift * 0.6, eaveY - lift], [cx - halfW + lift, eaveY - lift * 0.2], [cx - halfW * 0.5, eaveY + 2],
    [cx + halfW * 0.5, eaveY + 2], [cx + halfW - lift, eaveY - lift * 0.2], [cx + halfW + lift * 0.6, eaveY - lift],
    [cx + ridgeHalf, eaveY - rise], [cx - ridgeHalf, eaveY - rise],
  ];
}

function hotel(p) {
  const cx = 350, base = 1262;
  p.group('far', { x: 140, y: 1070, w: 420, h: 200 }, (c) => {
    // the wings
    for (const sx of [-1, 1]) {
      const wx = cx + sx * 150;
      c.fillStyle = '#a92d26'; c.fillRect(wx - 45, base - 52, 90, 52);
      c.fillStyle = '#ffe9b0'; for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) c.fillRect(wx - 40 + k * 14, base - 46 + row * 15, 7, 8);
      c.fillStyle = '#e8a43a'; path(c, roofShape(wx, base - 52, 52, 22, 8, 30)); c.fill();
    }
    // the main block: red columns, rows of lit windows
    c.fillStyle = '#b8322a'; c.fillRect(cx - 105, base - 110, 210, 110);
    c.fillStyle = '#fff0c0';
    for (let row = 0; row < 7; row++) for (let k = 0; k < 14; k++) c.fillRect(cx - 98 + k * 14.5, base - 102 + row * 14, 8, 8);
    c.fillStyle = '#7d1e1a'; for (let k = 0; k <= 7; k++) c.fillRect(cx - 105 + k * 30, base - 110, 4, 110);
    // the great roof, gold tiles, with its upturned ends
    const R = roofShape(cx, base - 110, 140, 52, 14, 78);
    c.fillStyle = '#e8a43a'; path(c, R); c.fill();
    c.save(); path(c, R); c.clip();
    c.strokeStyle = '#a8641c'; c.lineWidth = 1.6; c.beginPath();
    for (let x = cx - 160; x < cx + 160; x += 7) { c.moveTo(x, base - 165); c.lineTo(x + (x - cx) * 0.25, base - 105); }
    c.stroke();
    c.fillStyle = 'rgba(255,236,170,0.6)'; c.fillRect(cx - 160, base - 166, 330, 10);
    c.restore();
    c.fillStyle = '#7d1e1a'; c.fillRect(cx - 82, base - 166, 164, 6);
    c.fillStyle = '#e8a43a'; path(c, roofShape(cx, base - 160, 60, 24, 6, 34)); c.fill();
  }, { t: 3.2, d: 0.9, reveal: 'rise' });
}

function town(p, r) {
  // rows of low painted buildings with windows, tanks and signboards
  const rows = [[1350, 0.75, 3.3], [1420, 1, 3.7]];
  const pal = ['#e8b48a', '#d9c7a0', '#9fb7ad', '#c98c78', '#e6d3b0', '#b9a3b4', '#f0c99a'];
  for (const [base, s, t0] of rows) {
    const items = [];
    let x = X0 - 10;
    while (x < X1) {
      const w = r.range(36, 80) * s, h = r.range(40, 150) * s * (Math.abs(x - TX) < 160 ? 0.6 : 1);
      items.push({ x, w, h, col: r.pick(pal), sign: r.chance(0.4) ? [r.pick(['#d92a1c', '#1d6fa8', '#f0b93a', '#2f9468']), r.pick([...SIGNS])] : null, tank: r.chance(0.4), win: r.int(0, 2) });
      x += w + r.range(-4, 6);
    }
    // four marks a row, left to right
    for (let q = 0; q < 4; q++) {
      const part = items.filter((it) => it.x >= X0 - 10 + q * 380 && it.x < X0 - 10 + (q + 1) * 380);
      if (!part.length) continue;
      const bx = { x: part[0].x - 6, y: base - 200 * s, w: part[part.length - 1].x + part[part.length - 1].w - part[0].x + 12, h: 210 * s };
      p.group('town', bx, (c) => {
        for (const it of part) {
          const top = base - it.h;
          c.fillStyle = it.col; c.fillRect(it.x, top, it.w, it.h);
          c.fillStyle = shade(it.col, 0.72); c.fillRect(it.x + it.w - 6 * s, top, 6 * s, it.h);
          c.fillStyle = 'rgba(255,250,230,0.5)'; c.fillRect(it.x, top, it.w, 3);
          // windows
          c.fillStyle = it.win ? '#3b3a4c' : '#fff1c4';
          for (let y = top + 10 * s; y < base - 14 * s; y += 15 * s) for (let wx = it.x + 6 * s; wx < it.x + it.w - 12 * s; wx += 12 * s) c.fillRect(wx, y, 6 * s, 7 * s);
          if (it.tank) { c.fillStyle = '#5b6a78'; c.fillRect(it.x + it.w * 0.3, top - 12 * s, 14 * s, 12 * s); c.fillRect(it.x + it.w * 0.3 + 2, top - 16 * s, 10 * s, 4 * s); }
          if (it.sign) {
            const sw = 20 * s, sh = 54 * s, sx = it.x + 4, sy = top + 12 * s;
            c.fillStyle = it.sign[0]; c.fillRect(sx, sy, sw, sh);
            c.fillStyle = CREAM; c.font = `900 ${16 * s}px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(it.sign[1], sx + sw / 2, sy + sh * 0.3);
          }
        }
      }, { t: t0 + q * 0.25, d: 0.8, reveal: 'rise' });
    }
  }
}

function memorial(p) {
  const cx = 640, base = 1400;
  p.group('town', { x: cx - 130, y: base - 190, w: 260, h: 200 }, (c) => {
    // three white terraces
    [[220, 0], [190, 12], [160, 24]].forEach(([w, dy]) => { c.fillStyle = '#f4efe2'; c.fillRect(cx - w / 2, base - dy - 12, w, 12); c.fillStyle = '#c9c2b4'; c.fillRect(cx - w / 2, base - dy - 2, w, 2); });
    c.fillStyle = '#d6d0c4'; c.fillRect(cx - 18, base - 36, 36, 36);
    // the white hall and its blue door
    c.fillStyle = '#f7f3ea'; c.fillRect(cx - 70, base - 106, 140, 70);
    c.fillStyle = '#d6cfc0'; c.fillRect(cx + 40, base - 106, 30, 70);
    c.fillStyle = '#1f4fa0'; path(c, [[cx - 16, base - 36], [cx + 16, base - 36], [cx + 16, base - 80], [cx, base - 92], [cx - 16, base - 80]]); c.fill();
    // the two blue octagonal roofs and the gold finial
    c.fillStyle = '#1f4fa0'; path(c, roofShape(cx, base - 106, 96, 30, 10, 66)); c.fill();
    c.fillStyle = '#f7f3ea'; c.fillRect(cx - 54, base - 150, 108, 14);
    c.fillStyle = '#1f4fa0'; path(c, roofShape(cx, base - 150, 74, 46, 10, 10)); c.fill();
    c.fillStyle = 'rgba(160,200,255,0.45)'; path(c, [[cx - 74, base - 150], [cx - 10, base - 196], [cx, base - 196], [cx - 30, base - 150]]); c.fill();
    c.fillStyle = GOLD; c.fillRect(cx - 4, base - 210, 8, 16); c.beginPath(); c.arc(cx, base - 212, 6, 0, Math.PI * 2); c.fill();
  }, { t: 4.3, d: 0.9, reveal: 'rise' });
}

// ================================================================ Taipei 101
// a flared module: wider at its top, like a section of bamboo
function face(c, yb, yt, wb, wt, floors, tint = 0) {
  const off = wb * 0.1, offT = wt * 0.1;
  const L = [[TX - wb / 2, yb], [TX + off, yb], [TX + offT, yt], [TX - wt / 2, yt]];
  const R = [[TX + off, yb], [TX + wb / 2, yb], [TX + wt / 2, yt], [TX + offT, yt]];
  c.fillStyle = vgrad(c, yb, yt, [[0, GLASS_M], [1, mix(GLASS_L, PEACH, tint)]]); path(c, L); c.fill();
  c.fillStyle = vgrad(c, yb, yt, [[0, GLASS_DD], [1, mix(GLASS_D, '#5d8f95', 0.5 + tint * 0.3)]]); path(c, R); c.fill();
  // floors and mullions, fanning with the flare
  const lines = (q, col, n) => {
    c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
    for (let f = 1; f < floors; f++) {
      const k = f / floors, y = lerp(yb, yt, k);
      c.moveTo(lerp(q[0][0], q[3][0], k), y); c.lineTo(lerp(q[1][0], q[2][0], k), y);
    }
    for (let m = 1; m < n; m++) {
      const k = m / n;
      c.moveTo(lerp(q[0][0], q[1][0], k), yb); c.lineTo(lerp(q[3][0], q[2][0], k), yt);
    }
    c.stroke();
  };
  lines(L, 'rgba(14,40,50,0.35)', 9);
  lines(R, 'rgba(160,220,215,0.18)', 6);
  c.strokeStyle = 'rgba(230,255,245,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(TX + off, yb); c.lineTo(TX + offT, yt); c.stroke();
}

function tower(p, r) {
  // the podium, a tapering pyramid up to the 25th floor, with the ruyi above the doors
  const baseTop = 1185;
  p.group('tower', { x: TX - 140, y: baseTop - 10, w: 280, h: G - baseTop + 20 }, (c) => {
    face(c, G, baseTop, 250, 160, 22, 0);
  }, { t: 4.2, d: 0.7, reveal: 'rise' });
  // eight modules of eight floors, each flaring outward, node over node
  const MH = 94;
  for (let k = 0; k < 8; k++) {
    const yb = baseTop - k * MH, yt = yb - MH, tint = k / 7;
    p.group('tower', { x: TX - 110, y: yt - 10, w: 220, h: MH + 14 }, (c) => {
      face(c, yb, yt, 146, 190, 8, tint * 0.55);
      // the node: a pale lip at the top of the module
      c.fillStyle = mix('#d8efe2', PEACH, tint * 0.6); path(c, [[TX - 99, yt + 1], [TX + 19, yt + 1], [TX + 19, yt - 5], [TX - 97, yt - 5]]); c.fill();
      c.fillStyle = '#6fa3a2'; path(c, [[TX + 19, yt + 1], [TX + 99, yt + 1], [TX + 97, yt - 5], [TX + 19, yt - 5]]); c.fill();
      // a warm light caught on the lit face
      c.fillStyle = `rgba(255,210,150,${0.08 + tint * 0.22})`; path(c, [[TX - 70, yb], [TX - 40, yb], [TX - 46, yt], [TX - 82, yt]]); c.fill();
    }, { t: 4.8 + k * 0.32, d: 0.55, reveal: 'rise' });
  }
  const top = baseTop - 8 * MH; // 433
  p.group('tower', { x: TX - 80, y: 90, w: 160, h: top - 80 }, (c) => {
    face(c, top, top - 40, 118, 118, 4, 0.7);
    face(c, top - 40, top - 108, 94, 124, 6, 0.9);
    c.fillStyle = '#e7f5ea'; c.fillRect(TX - 64, top - 113, 128, 6);
    face(c, top - 108, top - 142, 80, 80, 3, 1);
    face(c, top - 142, top - 170, 56, 56, 2, 1);
    // the mast
    c.fillStyle = '#d9e8e4'; path(c, [[TX - 8, top - 170], [TX + 8, top - 170], [TX + 2, 100], [TX - 2, 100]]); c.fill();
    c.fillStyle = '#6c8c92'; path(c, [[TX + 1, top - 170], [TX + 8, top - 170], [TX + 2, 100], [TX + 0.5, 100]]); c.fill();
    c.fillStyle = '#e8f2ee'; for (const y of [top - 200, top - 236, top - 270]) c.fillRect(TX - 11, y, 22, 5);
  }, { t: 7.4, d: 0.9, reveal: 'rise' });
  // the ruyi: gold coins with a cloud scroll, over the podium
  p.group('tower', { x: TX - 80, y: baseTop - 10, w: 160, h: 80 }, (c) => {
    for (const [x, sx] of [[TX - 44, 1], [TX + 56, 0.62]]) {
      const y = baseTop + 34;
      c.fillStyle = GOLD_D; c.beginPath(); c.ellipse(x, y, 24 * sx, 24, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(x - 1, y - 1, 21 * sx, 21, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_D; c.lineWidth = 3; c.beginPath();
      c.moveTo(x - 12 * sx, y + 4); c.bezierCurveTo(x - 14 * sx, y - 12, x, y - 12, x, y - 2); c.bezierCurveTo(x, y - 12, x + 14 * sx, y - 12, x + 12 * sx, y + 4);
      c.lineTo(x, y + 12); c.closePath(); c.stroke();
    }
  }, { t: 7.9, d: 0.6, reveal: 'pop' });
}

// a thin band of mist crossing in front of the tower
function mist(p, r) {
  const bands = [[930, 0.5, 9.0], [1110, 0.42, 9.3]];
  bands.forEach(([y, a, t], i) => {
    const pf = [];
    for (let k = 0; k < 12; k++) pf.push([lerp(780, 1420, k / 11) + r.range(-20, 20), y + r.range(-10, 10), r.range(50, 90), r.range(14, 24)]);
    p.group('mist', { x: 700, y: y - 60, w: 820, h: 120 }, (c) => {
      c.fillStyle = `rgba(255,226,220,${a})`; c.beginPath();
      for (const [x, yy, rx, ry] of pf) { c.moveTo(x + rx, yy); c.ellipse(x, yy, rx, ry, 0, 0, Math.PI * 2); } c.fill();
      c.fillStyle = `rgba(255,246,230,${a})`; c.beginPath();
      for (const [x, yy, rx, ry] of pf) { c.moveTo(x + rx * 0.6, yy - ry * 0.4); c.ellipse(x, yy - ry * 0.4, rx * 0.6, ry * 0.45, 0, 0, Math.PI * 2); } c.fill();
    }, { t, d: 1.4, reveal: i ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ Longshan Temple's roof
const RC = 800, RX0 = 120, RX1 = 1480;
const ridgeY = (x) => 1418 - 64 * (Math.abs(x - RC) / 680) ** 4;
const eaveY = (x) => 1585 - 80 * (Math.abs(x - RC) / 780) ** 4;

function temple(p, r) {
  // the tiled slope, from the ridge down to the eave
  const slope = [];
  for (let x = RX0; x <= RX1; x += 10) slope.push([x, ridgeY(x) + 14]);
  for (let x = X1 + 20; x >= X0 - 20; x -= 10) slope.push([x, eaveY(x)]);
  p.group('temple', { x: X0 - 30, y: 1330, w: X1 - X0 + 60, h: 280 }, (c) => {
    c.fillStyle = vgrad(c, 1400, 1590, [[0, TILE_L], [0.5, TILE], [1, TILE_D]]); path(c, slope); c.fill();
    c.save(); path(c, slope); c.clip();
    // the tile channels, and a dark seam between each
    c.strokeStyle = 'rgba(90,20,12,0.55)'; c.lineWidth = 2.4; c.beginPath();
    for (let x = X0 - 20; x < X1 + 20; x += 15) { const sp = (x - RC) * 0.08; c.moveTo(x, ridgeY(clamp(x, RX0, RX1)) + 10); c.lineTo(x + sp, eaveY(x) + 4); }
    c.stroke();
    c.strokeStyle = 'rgba(255,190,140,0.35)'; c.lineWidth = 1.4; c.beginPath();
    for (let x = X0 - 13; x < X1 + 20; x += 15) { const sp = (x - RC) * 0.08; c.moveTo(x, ridgeY(clamp(x, RX0, RX1)) + 14); c.lineTo(x + sp, eaveY(x) - 6); }
    c.stroke();
    // the evening light across the tiles, and the courses of tile
    const sh = c.createLinearGradient(X0, 0, X1, 0);
    sh.addColorStop(0, 'rgba(255,200,150,0.0)'); sh.addColorStop(0.55, 'rgba(255,214,160,0.28)'); sh.addColorStop(1, 'rgba(60,0,30,0.3)');
    c.fillStyle = sh; c.fillRect(X0 - 30, 1330, X1 - X0 + 60, 280);
    c.strokeStyle = 'rgba(90,20,12,0.25)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 9; k++) { for (let x = X0 - 20; x <= X1 + 20; x += 20) { const y = lerp(ridgeY(clamp(x, RX0, RX1)) + 14, eaveY(x), k / 9); x === X0 - 20 ? c.moveTo(x, y) : c.lineTo(x, y); } }
    c.stroke();
    c.restore();
  }, { t: 6.4, d: 1.1, reveal: 'rise' });

  // round tile ends along the eave, green glaze and gold
  const ends = [];
  for (let x = X0; x <= X1; x += 15) ends.push([x + (x - RC) * 0.08, eaveY(x) + 1]);
  p.group('temple', { x: X0 - 40, y: 1520, w: X1 - X0 + 80, h: 90 }, (c) => {
    c.fillStyle = GREEN_D; c.beginPath(); for (const [x, y] of ends) { c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI * 2); } c.fill();
    c.fillStyle = GOLD; c.beginPath(); for (const [x, y] of ends) { c.moveTo(x + 3, y); c.arc(x, y, 3, 0, Math.PI * 2); } c.fill();
  }, { t: 7.2, d: 0.8, reveal: 'wipe' });

  // under the eave: the painted bracket beam, the porch in shadow, red columns
  const beam = [];
  for (let x = X0; x < X1; x += 46) beam.push([x, r.pick(['#2f6fb0', GREEN, GOLD, '#e85a3a', '#2f6fb0'])]);
  p.group('temple', { x: X0, y: 1540, w: X1 - X0, h: 170 }, (c) => {
    const top = (x) => eaveY(x) + 6;
    const under = [[X0, top(X0)]];
    for (let x = X0; x <= X1; x += 20) under.push([x, top(x)]);
    under.push([X1, 1712], [X0, 1712]);
    c.fillStyle = '#2a1218'; path(c, under); c.fill();
    // the beam
    for (const [x, col] of beam) {
      const y = Math.max(top(x), top(x + 46)) + 4;
      c.fillStyle = col; c.fillRect(x + 3, y, 40, 22);
      c.fillStyle = CREAM; c.fillRect(x + 11, y + 7, 24, 8);
      c.fillStyle = col; c.fillRect(x + 15, y + 9, 16, 4);
    }
    c.fillStyle = GOLD_D; c.fillRect(X0, 1640, X1 - X0, 8);
    // the columns
    for (const x of [150, 420, 690, 910, 1180, 1450]) {
      c.fillStyle = '#b3241c'; c.fillRect(x - 13, 1600, 26, 112);
      c.fillStyle = '#e0503a'; c.fillRect(x - 13, 1600, 7, 112);
      c.fillStyle = GOLD; c.fillRect(x - 17, 1640, 34, 8);
      c.fillStyle = '#4a3a3a'; c.fillRect(x - 18, 1700, 36, 12);
    }
    // the doors, dark red with gold studs
    for (const x of [555, 1045]) {
      c.fillStyle = '#6a1a18'; c.fillRect(x - 90, 1650, 180, 62);
      c.fillStyle = GOLD; for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) c.fillRect(x - 80 + k * 20, 1660 + row * 16, 4, 4);
      c.fillStyle = '#2a1218'; c.fillRect(x - 1, 1650, 2, 62);
    }
  }, { t: 7.6, d: 0.9, reveal: 'fall' });

  // the ridge itself, glazed green, set with cut-porcelain flowers
  const band = [];
  for (let x = RX0; x <= RX1; x += 8) band.push([x, ridgeY(x) - 18]);
  for (let x = RX1; x >= RX0; x -= 8) band.push([x, ridgeY(x) + 16]);
  const flowers = [];
  for (let x = RX0 + 20; x < RX1 - 20; x += 13) flowers.push([x, ridgeY(x) - 1 + r.range(-3, 3), r.pick(['#ffd84a', '#ffffff', '#ff8fb0', '#7fc8ff', '#ff6a3a']), r.range(3, 5)]);
  // a swallowtail: the ridge's end, forked and swept up and out
  const tail = (sx) => {
    const x = sx < 0 ? RX0 : RX1, y = ridgeY(x);
    return [
      [[x + sx * 30, y - 18], [x - sx * 10, y - 40], [x - sx * 50, y - 92], [x - sx * 78, y - 118], [x - sx * 60, y - 80], [x - sx * 20, y - 20], [x + sx * 30, y + 16]],
      [[x + sx * 10, y + 6], [x - sx * 30, y - 16], [x - sx * 66, y - 50], [x - sx * 50, y - 22], [x - sx * 10, y + 16]],
    ];
  };
  p.group('ridge', { x: X0 - 20, y: 1260, w: X1 - X0 + 40, h: 200 }, (c) => {
    c.fillStyle = GREEN; path(c, band); c.fill();
    for (const sx of [-1, 1]) for (const q of tail(sx)) { c.fillStyle = GREEN_D; path(c, q); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke(); }
    c.strokeStyle = GOLD; c.lineWidth = 2.5; path(c, band); c.stroke();
    for (const [x, y, col, rr] of flowers) { c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#1d5f45'; for (let x = RX0 + 60; x < RX1; x += 120) c.fillRect(x, ridgeY(x) - 18, 3, 34);
  }, { t: 8.0, d: 1.0, reveal: 'iris' });
}

// ================================================================ the dragons and the pearl
function dragons(p, r) {
  for (const sx of [-1, 1]) {
    // the body: a wave along the ridge, from the tail by the swallowtail to the head by the pearl
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const t = k / 60, x = RC + sx * lerp(620, 120, t);
      pts.push([x, ridgeY(x) - 34 - 26 * Math.sin(t * Math.PI * 2.4) * (0.4 + 0.6 * t) - 18 * t]);
    }
    const head = pts[pts.length - 1];
    const spikes = [];
    for (let k = 4; k < 58; k += 3) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      const a = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2 * sx;
      spikes.push([x0, y0, a]);
    }
    p.group('ridge', boxOf(pts, 60), (c) => {
      // legs gripping the ridge
      c.strokeStyle = GREEN_D; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
      for (const k of [14, 30, 46]) { const [x, y] = pts[k]; c.moveTo(x, y); c.lineTo(x - sx * 10, ridgeY(x) - 18); } c.stroke();
      // spikes along the back
      c.fillStyle = '#ff7a2a';
      for (const [x, y, a] of spikes) { const s = 14; c.beginPath(); c.moveTo(x + Math.cos(a + 0.8) * 4, y + Math.sin(a + 0.8) * 4); c.lineTo(x + Math.cos(a) * s * sx, y - Math.abs(Math.sin(a)) * s); c.lineTo(x + Math.cos(a - 0.8) * 4, y + Math.sin(a - 0.8) * 4); c.fill(); }
      // the body, its scales of cut porcelain
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = '#0f4a36'; c.lineWidth = 26; path(c, pts, false); c.stroke();
      c.strokeStyle = '#2fae74'; c.lineWidth = 20; path(c, pts, false); c.stroke();
      c.strokeStyle = '#ffd84a'; c.lineWidth = 11; c.setLineDash([5, 7]); path(c, pts, false); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#7fe0b0'; c.lineWidth = 3; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y - 7) : c.moveTo(x, y - 7))); c.stroke();
      // the head, turned to the pearl: long snout, open jaw, horns, a whisker
      const [hx, hy] = head;
      c.save(); c.translate(hx, hy); c.scale(-sx, 1);
      c.fillStyle = '#2fae74'; c.strokeStyle = '#0f4a36'; c.lineWidth = 3;
      path(c, [[14, -14], [-20, -18], [-44, -10], [-46, -2], [-26, 0], [-44, 10], [-40, 16], [-14, 12], [14, 14]]); c.fill(); c.stroke();
      c.fillStyle = '#ff7a2a'; path(c, [[6, -14], [24, -40], [14, -12]]); c.fill(); path(c, [[-6, -16], [4, -44], [-2, -16]]); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-16, -8, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(-17, -8, 2.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffd84a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-42, -6); c.quadraticCurveTo(-62, -26, -54, -40); c.moveTo(-40, 12); c.quadraticCurveTo(-60, 22, -66, 10); c.stroke();
      c.fillStyle = '#ff6a6a'; path(c, [[-26, 2], [-40, 6], [-28, 8]]); c.fill();
      c.restore();
      // the tail's curl
      const [tx, ty] = pts[0];
      c.strokeStyle = '#2fae74'; c.lineWidth = 9; c.beginPath(); c.arc(tx - sx * 10, ty - 10, 14, 0, Math.PI * 1.6); c.stroke();
    }, { t: 8.6 + (sx > 0 ? 0.35 : 0), d: 1.1, reveal: sx < 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  }
  // the flaming pearl on its little stand
  const py = ridgeY(RC) - 64;
  p.group('ridge', { x: RC - 50, y: py - 60, w: 100, h: 100 }, (c) => {
    c.fillStyle = GOLD_D; c.fillRect(RC - 6, py + 20, 12, 28); c.fillRect(RC - 16, py + 42, 32, 6);
    c.fillStyle = '#ff9a2a';
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.36, L = 40 - Math.abs(k - 4) * 3;
      c.beginPath(); c.moveTo(RC + Math.cos(a - 0.3) * 18, py + Math.sin(a - 0.3) * 18);
      c.quadraticCurveTo(RC + Math.cos(a) * L * 0.8 + 6, py + Math.sin(a) * L * 0.8, RC + Math.cos(a) * L, py + Math.sin(a) * L);
      c.lineTo(RC + Math.cos(a + 0.3) * 18, py + Math.sin(a + 0.3) * 18); c.fill();
    }
    const g = c.createRadialGradient(RC - 6, py - 6, 2, RC, py, 22);
    g.addColorStop(0, '#fff2c0'); g.addColorStop(0.5, '#ff6a3a'); g.addColorStop(1, '#b3241c');
    c.fillStyle = g; c.beginPath(); c.arc(RC, py, 20, 0, Math.PI * 2); c.fill();
  }, { t: 9.4, d: 0.6, reveal: 'pop' });
}

// ================================================================ the street
function scooter(c, x, y, s, dir, col, shirt, helmet) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = '#16121a';
  c.beginPath(); c.arc(-20, -8, 8, 0, Math.PI * 2); c.arc(20, -8, 8, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#9a9aa4'; c.beginPath(); c.arc(-20, -8, 3, 0, Math.PI * 2); c.arc(20, -8, 3, 0, Math.PI * 2); c.fill();
  c.fillStyle = col;
  path(c, [[-30, -12], [-6, -12], [4, -20], [14, -20], [24, -12], [28, -18], [20, -42], [14, -42], [16, -24], [6, -16], [-6, -22], [-26, -26]]); c.fill();
  c.fillStyle = '#26202a'; c.fillRect(-26, -30, 22, 5);
  c.fillStyle = '#fff4c0'; c.fillRect(22, -40, 5, 4);
  // the rider
  c.fillStyle = shirt; path(c, [[-18, -30], [-4, -30], [2, -58], [-12, -60]]); c.fill();
  c.strokeStyle = shirt; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2, -52); c.lineTo(16, -42); c.stroke();
  c.strokeStyle = '#2d2a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-14, -30); c.lineTo(2, -26); c.lineTo(4, -14); c.stroke();
  c.fillStyle = '#e8b890'; c.beginPath(); c.arc(-4, -66, 6.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = helmet; c.beginPath(); c.arc(-5, -68, 8, Math.PI, Math.PI * 2.1); c.fill();
  c.restore();
}

const SCOOT = ['#e8402a', '#f0e6d0', '#2f6fb0', '#ffd84a', '#3aa37a', '#f28ab0', '#9aa6b4'];
const SHIRT = ['#ffffff', '#2f6fb0', '#e8402a', '#ffd84a', '#7a4ab0', '#2a2a3a', '#3aa37a'];

function street(p, r) {
  p.group('street', { x: X0, y: 1700, w: X1 - X0, h: Y1 - 1700 }, (c) => {
    c.fillStyle = '#8f7f86'; c.fillRect(X0, 1700, X1 - X0, 12);
    c.fillStyle = vgrad(c, 1712, Y1, [[0, '#3c3242'], [1, '#2a2230']]); c.fillRect(X0, 1712, X1 - X0, Y1 - 1712);
    c.fillStyle = 'rgba(255,220,170,0.6)'; for (let x = X0 + 20; x < X1; x += 120) c.fillRect(x, 1758, 60, 4);
    // the lanterns' glow on the wet road
    c.fillStyle = 'rgba(255,120,80,0.18)'; for (const x of [260, 560, 1040, 1340]) c.fillRect(x - 30, 1716, 60, 70);
  }, { t: 8.4, d: 0.8, reveal: 'fade' });
  // scooters parked along the curb
  const parked = [];
  for (let x = X0 + 30; x < X1 - 30; x += r.range(48, 90)) if (r.chance(0.6)) parked.push([x, r.pick(SCOOT)]);
  p.group('street', { x: X0, y: 1680, w: X1 - X0, h: 40 }, (c) => {
    for (const [x, col] of parked) {
      c.save(); c.translate(x, 1712); c.scale(0.55, 0.55);
      c.fillStyle = '#16121a'; c.beginPath(); c.arc(-20, -8, 8, 0, Math.PI * 2); c.arc(20, -8, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; path(c, [[-30, -12], [-6, -12], [4, -20], [14, -20], [24, -12], [28, -18], [20, -42], [14, -42], [16, -24], [6, -16], [-6, -22], [-26, -26]]); c.fill();
      c.restore();
    }
  }, { t: 9.0, d: 0.6, reveal: 'wipe' });
}

// ================================================================ what moves
function live(p, r) {
  // red lanterns swaying under the eaves
  const lanterns = [[285, 1.0], [555, 0.9], [800, 1.1], [1045, 0.9], [1315, 1.0]].map(([x, s], i) => [x, s, i * 1.3]);
  p.live('live', {
    t: 9.6, d: 0.8, reveal: 'fade',
    box: { x: X0, y: 1560, w: X1 - X0, h: 160 },
    draw: (c, time) => {
      for (const [x, s, ph] of lanterns) {
        const a = Math.sin(time * 1.3 + ph) * 0.06, top = eaveY(x) + 30;
        c.save(); c.translate(x, top); c.rotate(a);
        c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 16); c.stroke();
        c.fillStyle = '#e8321e'; c.beginPath(); c.ellipse(0, 16 + 30 * s, 26 * s, 30 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,200,120,0.55)'; c.beginPath(); c.ellipse(-6 * s, 12 + 28 * s, 9 * s, 22 * s, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#9a1a12'; c.lineWidth = 1.5; c.beginPath();
        for (const k of [-0.6, 0, 0.6]) { c.moveTo(k * 26 * s, 16 + 4 * s); c.quadraticCurveTo(k * 34 * s, 16 + 30 * s, k * 26 * s, 16 + 56 * s); }
        c.stroke();
        c.fillStyle = GOLD; c.fillRect(-10 * s, 14, 20 * s, 5); c.fillRect(-10 * s, 14 + 58 * s, 20 * s, 5);
        c.strokeStyle = '#ffcf3a'; c.lineWidth = 2; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(k * 2.5, 20 + 60 * s); c.lineTo(k * 3, 36 + 62 * s); } c.stroke();
        c.restore();
      }
    },
  });
  // scooters in two lanes, one each way
  const lanes = [];
  for (let i = 0; i < 6; i++) lanes.push([1748, 0.72, 1, i / 6 + r.range(-0.03, 0.03), r.pick(SCOOT), r.pick(SHIRT), r.pick(SCOOT), 70]);
  for (let i = 0; i < 5; i++) lanes.push([1792, 0.95, -1, i / 5 + r.range(-0.03, 0.03), r.pick(SCOOT), r.pick(SHIRT), r.pick(SCOOT), 95]);
  const span = X1 - X0 + 160;
  p.live('live', {
    t: 9.9, d: 0.8, reveal: 'fade',
    box: { x: X0, y: 1680, w: X1 - X0, h: Y1 - 1680 },
    draw: (c, time) => {
      for (const [y, s, dir, ph, col, shirt, helmet, v] of lanes) {
        const u = (ph * span + time * v) % span;
        scooter(c, dir > 0 ? X0 - 80 + u : X1 + 80 - u, y, s, dir, col, shirt, helmet);
      }
    },
  });
  // the beacon on the mast, and swifts wheeling about the crown
  const birds = [];
  for (let i = 0; i < 7; i++) birds.push([r.range(80, 200), r.range(0.3, 0.6), r() * 6, r.range(-50, 50)]);
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade',
    box: { x: TX - 260, y: 60, w: 520, h: 420 },
    draw: (c, time) => {
      const on = 0.5 + 0.5 * Math.sin(time * 3);
      c.fillStyle = `rgba(255,80,60,${0.4 + on * 0.6})`; c.beginPath(); c.arc(TX, 100, 4 + on * 2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (const [rad, sp, ph, dy] of birds) {
        const a = time * sp + ph, x = TX + Math.cos(a) * rad * 1.2, y = 260 + dy + Math.sin(a) * rad * 0.4;
        const f = Math.sin(time * 9 + ph) * 3;
        c.moveTo(x - 8, y - 2 - f); c.quadraticCurveTo(x - 3, y - 4, x, y); c.quadraticCurveTo(x + 3, y - 4, x + 8, y - 2 - f);
      }
      c.stroke();
    },
  });
}

// ================================================================ the title and the credits
function title(p) {
  // 臺北 painted down the left: a deep shadow, a yellow edge, red letters with a light
  const chars = [['臺', 470], ['北', 800]];
  chars.forEach(([ch, y], i) => {
    const x = 250, size = 300;
    p.mark('title', {
      t: 10.6 + i * 0.5, d: 0.9, reveal: 'press',
      box: { x: x - 200, y: y - 320, w: 420, h: 400 },
      draw: (c) => {
        c.font = `900 ${size}px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
        c.fillStyle = '#2a0f1e';
        for (let k = 16; k > 0; k -= 2) c.fillText(ch, x + k, y + k);
        c.strokeStyle = YELLOW; c.lineWidth = 18; c.strokeText(ch, x, y);
        c.fillStyle = RED; c.fillText(ch, x, y);
        c.save(); c.beginPath(); c.rect(x - 200, y - 300, 400, 150); c.clip();
        c.fillStyle = 'rgba(255,170,120,0.45)'; c.fillText(ch, x, y); c.restore();
      },
    });
  });
  // the tag in a yellow box, set down the side
  p.group('title', { x: 458, y: 170, w: 70, h: 300 }, (c) => {
    c.fillStyle = YELLOW; c.fillRect(464, 180, 56, 260);
    c.strokeStyle = RED; c.lineWidth = 3; c.strokeRect(470, 186, 44, 248);
  }, { t: 11.7, d: 0.4, reveal: 'fall' });
  ['寶', '島', '之', '都'].forEach((ch, i) => p.type('title', ch, 492, 240 + i * 58, { size: 44, family: FACE, weight: 900, color: RED, align: 'center', t: 11.9 + i * 0.1, d: 0.4, reveal: 'press' }));
  // 彩色巨片 on a red banner in the corner
  p.group('title', { x: 1220, y: Y0, w: X1 - 1220, h: 230 }, (c) => {
    c.fillStyle = RED; path(c, [[1290, Y0], [1400, Y0], [X1, 154], [X1, 264]]); c.fill();
    c.strokeStyle = YELLOW; c.lineWidth = 3; path(c, [[1316, Y0], [1384, Y0], [X1, 170], [X1, 238]]); c.stroke();
  }, { t: 12.3, d: 0.5, reveal: 'wipe' });
  p.mark('title', {
    t: 12.6, d: 0.6, reveal: 'press', box: { x: 1300, y: 40, w: 260, h: 200 },
    draw: (c) => {
      c.save(); c.translate(1438, 138); c.rotate(Math.PI / 4);
      c.font = `900 40px ${FACE}`; c.textAlign = 'center'; c.fillStyle = YELLOW; c.fillText('彩色巨片', 0, 14); c.restore();
    },
  });
  // the margin: TAIPEI and the credit line
  p.type('frame', CREDITS, W / 2, 1846, { size: 32, family: FACE, weight: 500, color: '#5a3a3a', align: 'center', track: 0.08, t: 12.4, gap: 0.03, d: 0.4, reveal: 'fade' });
  p.type('frame', 'TAIPEI', W / 2, 1948, { size: 104, family: FACE, weight: 900, color: RED, shadow: '#2a0f1e', sx: 4, sy: 4, align: 'center', track: 0.42, t: 12.0, gap: 0.12, d: 0.6, reveal: 'press' });
  p.group('frame', { x: X0, y: 1800, w: X1 - X0, h: 20 }, (c) => {
    c.fillStyle = RED; c.fillRect(X0 + 60, 1808, X1 - X0 - 120, 3);
  }, { t: 11.8, d: 0.6, reveal: 'wipe' });
  for (const sx of [-1, 1]) p.group('frame', { x: W / 2 + sx * 440 - 40, y: 1880, w: 80, h: 60 }, (c) => {
    c.fillStyle = RED; c.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 9 : 22; const x = W / 2 + sx * 440 + Math.cos(a) * rr, y = 1910 + Math.sin(a) * rr; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.fill();
  }, { t: 13.0, d: 0.5, reveal: 'pop' });
}

