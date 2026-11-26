// Washington: a 1930s silkscreen in a handful of flat inks, the Mall seen from the
// air above the Capitol, looking west on an April morning. The dome rises out of the
// lower right; the lawns and their rows of elms run up between the museums to the
// Washington Monument, the Reflecting Pool and the Lincoln Memorial on the Potomac.
// The Tidal Basin and the Jefferson Memorial lie to the left in their ring of cherry
// trees. Across the river the Memorial Bridge leads to Arlington: the cemetery's white
// rows on its hills, Arlington House on the crest, Rosslyn's towers, Key Bridge and
// Georgetown's spires, and the blue ridges beyond. Each ink is printed flat and a
// little out of register; the name sits under it all on a band of deep green.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, rng } from '../kit.js';

// the inks
const PAPER = '#efe4c8', NAVY = '#24304a', CREAM = '#f6eedb';
const SKY = ['#5c8db3', '#6f9cbe', '#86adc8', '#a1bfcf', '#bed1d3', '#d8dfcf', '#ebe3c6'];
const RIDGE = ['#c2c4d4', '#aab3cc', '#93a3c0'];
const LAWN = '#a9c46b', LAWN2 = '#9ab85f', MID = '#6f9a4f', DARK = '#3f6c45', DEEP = '#2d4f3e', LIGHT = '#c8da8a';
const PINK = '#f2aab4', PINK2 = '#d97c91', PINK3 = '#fbdada';
const VERM = '#cf543a', OCHRE = '#e4ad4b', ROSE = '#e7a08c';
const STONE = '#ece2c6', STONE2 = '#d5c6a2', STONE3 = '#b9a782', SAND = '#ddcfa9', STREET = '#e9dcb8';
const SLATE = '#8a98a2', SLATE2 = '#6d7d8a', RIVER = '#4c7fa6', RIVER2 = '#77a3c0', POOL = '#86b0c6';
const SHADE = 'rgba(36,48,74,0.26)';

export const city = {
  id: 'washington', name: 'Washington',
  alt: "A 1930s-style silkscreen of Washington from the air above the Capitol dome, looking west along the National Mall past the Smithsonian Castle and the museums to the Washington Monument, the Reflecting Pool and the Lincoln Memorial, with the Jefferson Memorial on the Tidal Basin among cherry trees, and across the Potomac the Memorial Bridge, Arlington National Cemetery and Arlington House on its hill, Rosslyn's towers and Georgetown, over the name WASHINGTON",
  google: 'family=Antonio:wght@400;700',
  wall: '#26372f',
  fonts: [['700 100px "Antonio"', 'WASHINGTON'], ['400 30px "Antonio"', "THE NATION'S CAPITAL · CHERRY BLOSSOM TIME · D.C. 1:2345"]],
  build,
};

const M = 56, PB = 1566; // the margin; the foot of the picture
const HZ = 336; // the horizon

// ================================================================ the view
// The ground is in kilometers from the Capitol: X runs west, Y north. The eye looks
// west, turned a little north, from high over the Capitol's south-east corner. Sizes
// across shrink with distance as in a perspective; the depth is laid out by hand, as
// a bird's-eye map does, so the far shore keeps room.
const TH = 0.19, CT = Math.cos(TH), ST = Math.sin(TH), L0 = -0.34, CXV = 780, U = 1435, K = 0.75;
const FV = [-1, 0, 0.6, 1.45, 2.2, 3.5, 4.3, 5.3, 6.5, 9, 14, 30];
const FY = [1760, 1450, 1300, 1060, 885, 738, 668, 592, 524, 446, 380, HZ];
const yOf = (() => {
  const n = FV.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((FY[i + 1] - FY[i]) / (FV[i + 1] - FV[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const h0 = FV[i] - FV[i - 1], h1 = FV[i + 1] - FV[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= FV[0]) return FY[0] + m[0] * (x - FV[0]);
    if (x >= FV[n - 1]) return FY[n - 1];
    let i = 0; while (x > FV[i + 1]) i++;
    const h = FV[i + 1] - FV[i], t = (x - FV[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * FY[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * FY[i + 1] + (t3 - t2) * h * m[i + 1];
  };
})();
const fOf = (X, Y) => X * CT + Y * ST;
// the size of a kilometer across, in pixels, at a place
const S = (X, Y) => U / (1 + K * Math.max(-0.5, fOf(X, Y)));
// a place on the ground (and z pixels above it, as seen at the Capitol) on the sheet
function P(X, Y, z = 0) {
  const f = fOf(X, Y), l = -X * ST + Y * CT - L0, s = 1 / (1 + K * Math.max(-0.5, f));
  return [CXV + l * U * s, yOf(f) - z * s];
}
const Wp = (pts) => pts.map(([X, Y]) => P(X, Y));
// more points along a world polygon, so long edges bend as the ground does
function sub(pts, step = 0.06, closed = true) {
  const out = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}
const rect = (X0, X1, Y0, Y1) => [[X0, Y0], [X0, Y1], [X1, Y1], [X1, Y0]];
const oval = (X, Y, rx, ry, n = 36, rot = 0) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, u = Math.cos(a) * rx, v = Math.sin(a) * ry;
    pts.push([X + u * Math.cos(rot) - v * Math.sin(rot), Y + u * Math.sin(rot) + v * Math.cos(rot)]);
  }
  return pts;
};
function path(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function addPath(c, pts) { pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function inPoly(pts, X, Y) {
  let k = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > Y) !== (yj > Y) && X < ((xj - xi) * (Y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
}
const clipBox = (b, pad = 0) => {
  const x0 = Math.max(M - 8, b.x - pad), y0 = Math.max(M - 8, b.y - pad);
  const x1 = Math.min(W - M + 8, b.x + b.w + pad), y1 = Math.min(PB + 8, b.y + b.h + pad);
  return { x: x0, y: y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0) };
};
const wbox = (pts, pad = 4) => clipBox(boxOf(Wp(pts), pad));

// the screen's textures, made once: specks where the ink did not take, and a dot screen
const TEX = {};
function speckles() {
  if (!TEX.speck) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 192;
    const x = cv.getContext('2d'), r = rng(311);
    for (let i = 0; i < 230; i++) {
      x.fillStyle = `rgba(246,238,219,${0.12 + r() * 0.3})`;
      const s = 0.5 + r() * 1.2;
      x.beginPath(); x.ellipse(r() * 192, r() * 192, s, s * (0.5 + r() * 0.6), r() * 3, 0, Math.PI * 2); x.fill();
    }
    // the drag of the squeegee: faint streaks across
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(246,238,219,${0.05 + r() * 0.08})`; x.fillRect(r() * 192, r() * 192, 20 + r() * 60, 0.8 + r()); }
    TEX.speck = cv;
  }
  return TEX.speck;
}
function dots() {
  if (!TEX.dot) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 8;
    const x = cv.getContext('2d');
    x.fillStyle = 'rgba(36,48,74,0.5)';
    x.beginPath(); x.arc(2, 2, 1.25, 0, Math.PI * 2); x.arc(6, 6, 1.25, 0, Math.PI * 2); x.fill();
    TEX.dot = cv;
  }
  return TEX.dot;
}
// a heavy mark drawn once into its own canvas at the press's scale, then laid down
// as an image while it arrives
function gb(p, layer, box, draw, o) {
  let cv = null, k = 0;
  return p.group(layer, box, (c) => {
    const s = c.getTransform().a;
    if (!cv || s !== k) {
      k = s; cv = document.createElement('canvas');
      cv.width = Math.ceil(box.w * s) + 2; cv.height = Math.ceil(box.h * s) + 2;
      const x = cv.getContext('2d'); x.setTransform(s, 0, 0, s, -box.x * s, -box.y * s); draw(x);
    }
    c.drawImage(cv, box.x, box.y, cv.width / k, cv.height / k);
  }, o);
}
// lay specks over whatever is in the current path (clip already set by the caller)
function speck(c, b) { c.fillStyle = c.createPattern(speckles(), 'repeat'); c.fillRect(b.x, b.y, b.w, b.h); }

// ================================================================ the plate
function build() {
  const p = new Plate({ paper: PAPER, seed: 1934 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: PB - M };
  p.stack('sky', 'clouds', 'ridges', 'va', 'water', 'dc', 'grass', 'far', 'mid', 'near', 'mon', 'capitol', 'front', 'live', 'title');
  p.layer('title', { clip: false });

  sky(p);
  ridges(p);
  virginia(p);
  water(p);
  ground(p);
  things(p);
  monument(p);
  capitol(p);
  lives(p);
  train(p);
  title(p);
  return p;
}

// ================================================================ the sky: stepped bands and flat clouds
function sky(p) {
  const n = SKY.length, top = M, bot = HZ + 30;
  const ys = SKY.map((_, i) => top + (bot - top) * (i / n) ** 0.85);
  SKY.forEach((col, i) => {
    const y0 = ys[i], y1 = i + 1 < n ? ys[i + 1] : bot;
    p.group('sky', { x: M, y: y0 - 2, w: W - 2 * M, h: y1 - y0 + 4 }, (c) => {
      c.fillStyle = col; c.fillRect(M, y0, W - 2 * M, y1 - y0 + 1);
    }, { t: 0.1 + i * 0.12, d: 0.7, reveal: 'fall', ease: 'inOut' });
  });
  // the sheet's texture over the sky, printed with it
  p.group('sky', { x: M, y: M, w: W - 2 * M, h: bot - M }, (c) => {
    c.beginPath(); c.rect(M, M, W - 2 * M, bot - M); c.clip(); speck(c, { x: M, y: M, w: W - 2 * M, h: bot - M });
  }, { t: 0.9, d: 0.6, reveal: 'fade' });
  // the clouds: flat cream heaps with a lilac shadow printed a hair off
  const cl = [[110, 214, 360, 74, 1], [560, 128, 300, 48, 0], [1010, 236, 470, 92, 1], [1250, 120, 230, 36, 0], [360, 306, 250, 30, 0]];
  cl.forEach(([x, y, w, h, big], i) => {
    const cr = rng(70 + i), lobes = [];
    const k = Math.max(3, Math.round(w / (h * 0.95)));
    for (let j = 0; j < k; j++) {
      const t = (j + 0.5) / k, lift = Math.sin(t * Math.PI) ** 0.7;
      lobes.push([x + t * w + cr.range(-6, 6), y - h * (0.18 + 0.5 * lift) * cr.range(0.85, 1.1), (w / k) * cr.range(0.6, 0.78) * (0.75 + 0.4 * lift)]);
    }
    if (big) for (let j = 0; j < 2; j++) lobes.push([x + w * (0.35 + j * 0.25), y - h * 0.92, (w / k) * 0.75]);
    const heap = (c, dx, dy) => {
      c.beginPath();
      for (const [cx, cy, rr] of lobes) { c.moveTo(cx + dx + rr, cy + dy); c.arc(cx + dx, cy + dy, rr, 0, Math.PI * 2); }
    };
    const b = { x: x - h, y: y - h * 1.9, w: w + 2 * h, h: h * 1.9 + 4 };
    p.group('clouds', b, (c) => {
      c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, y - b.y); c.clip();
      c.fillStyle = '#b9b6cf'; heap(c, 7, 4); c.fill();
      c.fillStyle = CREAM; heap(c, 0, 0); c.fill();
      // the shaded lower half in a second, lilac pass, cut in flat steps
      c.beginPath(); heap(c, 0, 0); c.clip();
      c.fillStyle = '#dcd6dc'; c.fillRect(b.x, y - h * 0.42, b.w, h);
      c.fillStyle = '#c8c4d6'; c.fillRect(b.x, y - h * 0.16, b.w, h);
      speck(c, b);
      c.restore();
    }, { t: 0.9 + i * 0.25, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the far ridges, the Blue Ridge to the hills over Arlington
function ridges(p) {
  const ridge = (base, amp, seed, freq) => {
    const rr = rng(seed), pts = [[M - 10, base + 140]];
    let y = 0;
    for (let x = M - 10; x <= W - M + 20; x += 12) {
      y = base - amp * (0.55 + 0.45 * Math.sin(x * freq + seed)) * (0.8 + 0.2 * Math.sin(x * freq * 3.1 + seed * 2)) - rr.range(0, amp * 0.08);
      pts.push([x, y]);
    }
    pts.push([W - M + 20, base + 140]);
    return pts;
  };
  const sets = [[HZ - 8, 34, 3, 0.0042, RIDGE[0]], [HZ + 6, 26, 9, 0.0061, RIDGE[1]], [HZ + 22, 22, 15, 0.0083, RIDGE[2]]];
  sets.forEach(([base, amp, seed, fq, col], i) => {
    const pts = ridge(base, amp, seed, fq);
    p.group('ridges', clipBox(boxOf(pts, 4)), (c) => {
      c.fillStyle = col; path(c, pts); c.fill();
      // a lighter top edge on the sunny side, printed a little high
      c.save(); path(c, pts); c.clip();
      c.strokeStyle = mix(col, CREAM, 0.35); c.lineWidth = 3; c.beginPath();
      pts.slice(1, -1).forEach(([x, y], k) => (k ? c.lineTo(x - 2, y + 2) : c.moveTo(x - 2, y + 2))); c.stroke();
      c.restore();
    }, { t: 1.3 + i * 0.22, d: 0.8, reveal: 'rise' });
  });
  // the wooded hills of Virginia closest under the ridges: rows of round crowns as a pattern
  const hills = ridge(HZ + 44, 24, 21, 0.007);
  const rr = rng(23), crowns = [];
  for (let y = HZ + 22; y < HZ + 150; y += 7) {
    for (let x = M - 10; x < W - M + 10; x += rr.range(7, 12)) {
      if (y < edgeAt(hills, x) + 6) continue;
      crowns.push([x + rr.range(-2, 2), y + rr.range(-2, 2), rr.range(3.2, 5.2) * (0.8 + (y - HZ) / 260)]);
    }
  }
  gb(p, 'ridges', clipBox(boxOf(hills, 4)), (c) => {
    c.fillStyle = '#7d9c88'; path(c, hills); c.fill();
    c.save(); path(c, hills); c.clip();
    c.fillStyle = '#5e816f'; c.beginPath();
    for (const [x, y, rad] of crowns) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); }
    c.fill();
    c.fillStyle = '#93b097'; c.beginPath();
    for (const [x, y, rad] of crowns) { c.moveTo(x - rad * 0.3 + rad * 0.45, y - rad * 0.35); c.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.45, 0, Math.PI * 2); }
    c.fill();
    c.restore();
  }, { t: 1.9, d: 0.8, reveal: 'rise' });
}
function edgeAt(pts, x) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x >= x0 && x <= x1 && x1 > x0) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return HZ;
}

// ================================================================ the Potomac's two banks
// the District's bank, north to south, round the end of West Potomac Park to the
// Tidal Basin's inlet, then down the shore of East Potomac Park
const DCB = [[7.2, 2.6], [6.4, 2.05], [5.8, 1.72], [5.3, 1.48], [4.9, 1.3], [4.5, 1.1], [4.24, 0.8], [4.06, 0.46], [3.92, 0.12], [3.84, -0.16], [3.74, -0.42], [3.56, -0.66], [3.3, -0.86], [3.1, -0.95], [3.02, -1.02], [2.86, -1.3], [2.55, -1.85], [2.1, -2.6], [1.6, -3.4], [1.1, -3.95]];
// Virginia's bank, with Columbia Island against it
const VAB = [[7.2, 2.2], [6.4, 1.7], [5.8, 1.4], [5.4, 1.12], [5.12, 0.9], [4.98, 0.6], [4.8, 0.3], [4.6, 0.02], [4.5, -0.3], [4.46, -0.6], [4.4, -0.95], [4.28, -1.4], [4.12, -2.0], [3.92, -2.8], [3.7, -3.6], [3.4, -4.4]];
// the river as one shape, and the District's ground up to Georgetown's heights
const RIVP = [...sub(DCB, 0.1, false), ...sub(VAB.slice().reverse(), 0.1, false)];
const DCLAND = [[5.75, 1.7], ...DCB.slice(3, 14), [3.0, -1.0], [2.05, -1.02], [1.8, -1.3], [0.9, -2.6], [-0.9, -2.6], [-0.9, 4.5], [5.25, 4.5]];
// the Memorial Bridge, from the Lincoln Memorial's circle to Columbia Island, aimed at Arlington House
const BR0 = [3.7, -0.11], BR1 = [4.5, -0.43];
const ARLH = [5.51, -0.86], HEMI = [5.0, -0.63];
const CEM = [[4.92, -0.3], [5.35, -0.26], [5.75, -0.36], [6.05, -0.6], [6.2, -1.0], [6.1, -1.45], [5.75, -1.78], [5.3, -1.72], [4.98, -1.4], [4.84, -0.95], [4.84, -0.6]];
const LINC = [3.56, -0.07], MON = [2.27, -0.04], JEFF = [2.38, -0.985];
const TB = [[2.24, -0.36], [2.46, -0.33], [2.7, -0.36], [2.88, -0.46], [2.97, -0.62], [2.98, -0.78], [2.88, -0.84], [2.72, -0.88], [2.55, -0.9], [2.4, -0.92], [2.25, -0.9], [2.14, -0.84], [2.1, -0.7], [2.12, -0.52]];

// ================================================================ Virginia: hills, the cemetery, Arlington House, Rosslyn, Georgetown
function virginia(p) {
  // the land from the far bank back to the wooded hills, one flat green
  const land = [[3.4, -7], [14, -7], [14, 9], [3.4, 9]];
  const landS = Wp(sub(land, 0.2));
  const vb = { x: M, y: HZ + 20, w: W - 2 * M, h: 720 - HZ };
  p.group('va', vb, (c) => {
    c.fillStyle = '#93b46a'; path(c, landS); c.fill();
  }, { t: 2.0, d: 0.8, reveal: 'fall', ease: 'inOut' });
  // the hills as flat slopes: lit to the left, shaded to the right, in three greens
  const rr = rng(41), hills = [];
  for (let i = 0; i < 34; i++) {
    const X = rr.range(4.9, 9.5), Y = rr.range(-3.2, 2.6);
    if (X < 5.4 && Y > 0.3) continue; // Rosslyn
    hills.push([X, Y, rr.range(0.25, 0.6), rr.range(0.35, 0.8)]);
  }
  hills.sort((a, b) => fOf(b[0], b[1]) - fOf(a[0], a[1]));
  p.group('va', vb, (c) => {
    c.save(); path(c, landS); c.clip();
    for (const [X, Y, rx, ry] of hills) {
      const o = Wp(oval(X, Y, rx, ry, 28));
      c.fillStyle = '#a3bf73'; path(c, o); c.fill();
      const sh = Wp(oval(X + 0.04, Y + ry * 0.35, rx * 0.85, ry * 0.62, 28));
      c.fillStyle = '#85a862'; path(c, sh); c.fill();
    }
    c.restore();
  }, { t: 2.3, d: 0.8, reveal: 'fall' });

  // the towns on the hills: small houses with red and gray roofs along winding lanes
  const houses = [], woods = [];
  const hr = rng(43);
  for (let X = 5.0; X < 17; X += 0.05 + (X - 5.0) * 0.013) {
    for (let Y = -4; Y < 5.0; Y += 0.045 + (X - 5.0) * 0.009) {
      const XX = X + hr.range(-0.02, 0.02), YY = Y + Math.sin(X * 7) * 0.03 + hr.range(-0.015, 0.015);
      const [x, y] = P(XX, YY);
      if (x < M - 10 || x > W - M + 10 || y < HZ + 30) continue;
      if (inPoly(CEM, XX, YY) || inPoly(RIVP, XX, YY) || inPoly(DCLAND, XX, YY)) continue;
      if ((XX < 6.5 && YY > -0.3 && YY < 0.35) || (XX < 5.95 && YY > 0.35 && YY < 1.2)) continue; // the fort's parade, Rosslyn
      const n = Math.sin(XX * 4.1 + YY * 3.3) + Math.sin(XX * 2.3 - YY * 5.7) + Math.sin(YY * 9.1 + XX * 1.3) * 0.5;
      if (n > 0.2) woods.push([x, y, S(XX, YY)]);
      else if (Math.sin(XX * 1.7 + YY * 2.9) + Math.sin(YY * 1.1 - XX * 3.3) > -0.3 && hr.chance(0.75)) houses.push([x, y, S(XX, YY), hr.pick([VERM, VERM, SLATE2, '#b25b44', OCHRE])]);
    }
  }
  gb(p, 'va', vb, (c) => {
    // woods first, as massed crowns
    for (const [ink, dx, dy, k] of [[DARK, 0.15, 0.1, 1], [MID, -0.08, -0.1, 0.8]]) {
      c.fillStyle = ink; c.beginPath();
      for (const [x, y, s] of woods) { const R = s * 0.032 * k; c.moveTo(x + dx * R + R, y + dy * R - R); c.arc(x + dx * R, y + dy * R - R, R, 0, Math.PI * 2); }
      c.fill();
    }
    c.fillStyle = '#9dbb6f'; c.beginPath();
    for (const [x, y, s] of woods) { const R = s * 0.011; c.moveTo(x - R * 1.2 + R, y - R * 3.6); c.arc(x - R * 1.2, y - R * 3.6, R, 0, Math.PI * 2); }
    c.fill();
  }, { t: 2.6, d: 0.7, reveal: 'rise' });
  gb(p, 'va', vb, (c) => {
    for (const [x, y, s, roof] of houses) {
      const w = s * 0.016, h = s * 0.009;
      c.fillStyle = CREAM; c.fillRect(x - w, y - h, w * 2, h);
      c.fillStyle = roof; c.beginPath(); c.moveTo(x - w * 1.15, y - h); c.lineTo(x - w * 0.6, y - h * 2.1); c.lineTo(x + w * 0.7, y - h * 2.1); c.lineTo(x + w * 1.15, y - h); c.fill();
    }
  }, { t: 2.9, d: 0.7, reveal: 'rise' });

  // the cemetery: rolling green hills, white rows, its roads and its oaks
  const cem = sub(CEM, 0.08), cemS = Wp(cem), cb = clipBox(boxOf(cemS, 30));
  p.group('va', cb, (c) => {
    c.fillStyle = LAWN; path(c, cemS); c.fill();
    c.save(); path(c, cemS); c.clip();
    // the slopes, lit and shaded
    const hr2 = rng(47);
    for (let i = 0; i < 10; i++) {
      const X = hr2.range(4.9, 6.1), Y = hr2.range(-1.7, -0.3), rx = hr2.range(0.15, 0.3), ry = hr2.range(0.25, 0.45);
      c.fillStyle = '#b8d07c'; path(c, Wp(oval(X, Y, rx, ry, 24))); c.fill();
      c.fillStyle = '#93b464'; path(c, Wp(oval(X + 0.03, Y + ry * 0.4, rx * 0.8, ry * 0.55, 24))); c.fill();
    }
    // the crest Arlington House stands on: a lit brow, a shaded slope toward the river
    c.fillStyle = '#86a95e'; path(c, Wp(oval(ARLH[0] - 0.12, ARLH[1], 0.3, 0.5, 30))); c.fill();
    c.fillStyle = '#c4d98c'; path(c, Wp(oval(ARLH[0] + 0.02, ARLH[1] - 0.04, 0.22, 0.38, 30))); c.fill();
    c.restore();
  }, { t: 3.0, d: 0.8, reveal: 'fall' });
  // the white headstones in rows, as dashes along lines across the slopes
  const rows = [];
  for (let X = 4.86; X < 6.2; X += 0.018) {
    let run = null;
    for (let Y = -1.8; Y < -0.25; Y += 0.02) {
      const XX = X + Math.sin(Y * 6 + X * 3) * 0.008;
      const ok = inPoly(CEM, XX, Y) && Math.abs(Y - lerp(HEMI[1], ARLH[1], clamp((XX - HEMI[0]) / (ARLH[0] - HEMI[0])))) > 0.04
        && Math.hypot(XX - ARLH[0], Y - ARLH[1]) > 0.11 && Math.abs(Math.sin(Y * 13 + XX * 4)) > 0.12;
      if (ok) { if (!run) { run = []; rows.push(run); } run.push(P(XX, Y)); } else run = null;
    }
  }
  gb(p, 'va', cb, (c) => {
    c.strokeStyle = CREAM; c.lineWidth = 1.5; c.setLineDash([1.4, 1.6]); c.beginPath();
    for (const run of rows) { if (run.length < 2) continue; run.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); }
    c.stroke(); c.setLineDash([]);
  }, { t: 3.3, d: 1.2, reveal: 'wipeL', ease: 'inOut' });
  // the cemetery's roads, curving
  const roads = [];
  for (let k = 0; k < 6; k++) {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.05) { const Y = lerp(-0.3, -1.75, t), X = 4.95 + k * 0.22 + Math.sin(t * 5 + k) * 0.07; if (inPoly(CEM, X, Y)) pts.push(P(X, Y)); }
    if (pts.length > 1) roads.push(pts);
  }
  // Memorial Avenue, from the bridge's circle on Columbia Island to the Hemicycle
  const ave = Wp(sub([BR1, HEMI], 0.05, false));
  p.group('va', clipBox(boxOf([...ave, ...cemS], 6)), (c) => {
    c.strokeStyle = STREET; c.lineCap = 'round';
    c.lineWidth = 1.6; c.beginPath();
    for (const r0 of roads) r0.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.lineWidth = 4; c.beginPath(); ave.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    // the lawn up the hill from the Hemicycle to the house
    const lane = Wp([[HEMI[0], HEMI[1] - 0.03], [ARLH[0] - 0.08, ARLH[1] - 0.04], [ARLH[0] - 0.08, ARLH[1] + 0.04], [HEMI[0], HEMI[1] + 0.03]]);
    c.fillStyle = '#c2d68a'; path(c, lane); c.fill();
  }, { t: 3.5, d: 0.7, reveal: 'fade' });
}

// ================================================================ the water: the Potomac, the Tidal Basin, the pools
function water(p) {
  const riv = RIVP;
  const rivS = Wp(riv), rb = clipBox(boxOf(rivS, 4));
  // waves: short light strokes, longer far away where they crowd
  const wr = rng(61), waves = [], dark = [];
  for (let i = 0; i < 520; i++) {
    const X = wr.range(1.5, 7.2), Y = wr.range(-4.2, 2.6);
    if (!inPoly(riv, X, Y)) continue;
    const [x, y] = P(X, Y), l = S(X, Y) * wr.range(0.012, 0.03);
    (wr.chance(0.7) ? waves : dark).push([x, y, l]);
  }
  gb(p, 'water', rb, (c) => {
    c.fillStyle = RIVER; path(c, rivS); c.fill();
    c.save(); path(c, rivS); c.clip();
    // a paler band down the middle of the stream, where the sky lies on it
    const mid = [...sub(DCB.map(([X, Y], i) => [lerp(X, VAB[Math.min(i, VAB.length - 1)][0], 0.3), Y - 0.02]), 0.1, false)];
    c.strokeStyle = '#5f8fb3'; c.lineWidth = 26; c.lineJoin = 'round'; c.beginPath();
    Wp(mid).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = RIVER2; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, l] of waves) { c.moveTo(x - l, y); c.quadraticCurveTo(x, y - 2, x + l, y); }
    c.stroke();
    c.strokeStyle = '#3c6b91'; c.beginPath();
    for (const [x, y, l] of dark) { c.moveTo(x - l, y); c.lineTo(x + l, y); }
    c.stroke();
    speck(c, rb);
    c.restore();
  }, { t: 2.4, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // the Boundary Channel behind Columbia Island, and Theodore Roosevelt Island's woods
  const chan = Wp(sub([[4.92, 0.3], [4.78, 0.0], [4.7, -0.4], [4.66, -0.9], [4.55, -1.4], [4.4, -2.0]], 0.06, false));
  const tri = Wp(oval(4.8, 0.86, 0.1, 0.2, 30, -0.5));
  p.group('water', clipBox(boxOf([...chan, ...tri], 12)), (c) => {
    c.strokeStyle = RIVER; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath();
    chan.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.fillStyle = DARK; path(c, tri); c.fill();
    c.save(); path(c, tri); c.clip();
    const tr = rng(63);
    c.fillStyle = MID; c.beginPath();
    for (let i = 0; i < 50; i++) { const [x, y] = P(tr.range(4.68, 4.92), tr.range(0.65, 1.07)), rad = tr.range(3, 5); c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); }
    c.fill(); c.restore();
  }, { t: 3.1, d: 0.6, reveal: 'fade' });
}

// ================================================================ the District's ground: streets, parks, pools
// the street grid, in kilometers: the lettered streets run east-west, the numbered north-south
const NS = []; for (let X = -0.6; X < 7.0; X += 0.105) NS.push(X);
const RAILY = -0.6;
// the railroad: along the cutting south of the Mall, then over the channel toward Virginia
const RAIL = sub([[-0.8, RAILY], [1.6, RAILY], [1.85, -0.63]], 0.03, false);
const EW = []; for (let Y = -1.3; Y < 3.2; Y += 0.1) EW.push(Y);
const MALL_N = 0.245, MALL_S = -0.245;
// places the blocks keep clear of
function open(X, Y) {
  if (X > 0.28 && X < 2.62 && Y > MALL_S && Y < MALL_N) return true; // the Mall and the Monument grounds
  if (X > 1.95 && X < 2.62 && Y > MALL_S - 0.08 && Y < 0.72) return true; // the Monument grounds and the Ellipse
  if (X > 2.18 && X < 2.6 && Y > 0.72 && Y < 1.12) return true; // the White House and Lafayette Square
  if (X > 2.6 && X < 3.9 && Y > -0.36 && Y < 0.3) return true; // the Reflecting Pool's gardens
  if (X > 2.0 && Y < -0.3 && Y > -1.0 && X < 3.9) return true; // the Tidal Basin and West Potomac Park
  if (X > 1.98 && Y < -0.95) return true; // East Potomac Park
  if (X > 5.3 && X < 5.75 && Y > 1.82 && Y < 2.15) return true; // Georgetown University's yard
  if (X < 0.3 && Y > -0.3) return true; // the Capitol and its grounds
  if (X > 0.4 && X < 0.62 && Y > -0.5 && Y < -0.3) return true; // the Botanic Garden
  if (inPoly(DCB.concat([[9, -6], [9, 4]]), X, Y)) return true; // the river and Virginia
  return false;
}
function ground(p) {
  const landS = Wp(sub(DCLAND, 0.12)), lb = { x: M, y: 520, w: W - 2 * M, h: PB - 520 };
  p.group('dc', lb, (c) => {
    c.fillStyle = SAND; path(c, landS); c.fill();
  }, { t: 2.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // East Potomac Park and the Washington Channel to its left
  const epp = [[3.02, -1.02], [2.86, -1.3], [2.55, -1.85], [2.1, -2.6], [1.7, -2.6], [2.05, -1.45], [2.1, -1.05]];
  const chan = [[2.1, -1.05], [2.05, -1.45], [1.7, -2.6], [1.45, -2.6], [1.84, -1.4], [1.96, -1.02]];
  // the streets, as lines of the paler ink
  const st = [];
  for (const X of NS) st.push(sub([[X, -1.0], [X, 3.2]], 0.15, false));
  for (const Y of EW) st.push(sub([[0.0, Y], [7.0, Y]], 0.15, false));
  st.push(sub([[0.2, 0.1], [2.16, 0.86]], 0.1, false)); // Pennsylvania Avenue
  st.push(sub([[0.2, -0.1], [1.9, -0.62]], 0.1, false)); // Maryland Avenue
  st.push(sub([[1.2, 0.95], [2.2, 1.05], [2.7, 1.48]], 0.1, false)); // New York Avenue toward the north-west
  st.push(sub([[2.6, 0.24], [3.6, 0.9], [4.0, 1.12]], 0.1, false)); // Virginia Avenue
  const stS = st.map(Wp);
  gb(p, 'dc', lb, (c) => {
    c.save(); path(c, landS); c.clip();
    c.strokeStyle = STREET; c.lineCap = 'butt';
    c.beginPath();
    for (const l of stS) l.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.lineWidth = 3.2; c.stroke();
    c.restore();
  }, { t: 3.0, d: 1.0, reveal: 'fall' });

  // the parks
  const lawns = [
    rect(0.3, 1.96, -0.142, 0.142), // the Mall's lawns between its drives
    sub([[1.96, -0.28], [1.96, 0.26], [2.62, 0.26], [2.62, -0.28]], 0.1), // the Monument grounds
    oval(2.38, 0.5, 0.17, 0.16, 36), // the Ellipse
    rect(2.3, 2.46, 0.78, 0.95), // the White House's South Lawn
    rect(2.3, 2.46, 1.0, 1.1), // Lafayette Square
    sub(rect(2.62, 3.82, -0.3, 0.26), 0.1), // the Reflecting Pool's gardens
    sub([[2.98, -0.3], [3.8, -0.3], [3.74, -0.42], [3.56, -0.66], [3.3, -0.86], [3.1, -0.95], [2.98, -0.8]], 0.08), // West Potomac Park
    sub(epp, 0.1),
    rect(1.98, 2.24, -0.3, -0.98), // the lawn east of the basin
  ];
  const lawnS = lawns.map(Wp);
  p.group('grass', lb, (c) => {
    c.fillStyle = LAWN; for (const l of lawnS) { path(c, l); c.fill(); }
    // the Mall's mowing stripes
    c.fillStyle = LAWN2;
    for (let k = 0; k < 8; k += 2) { const Y0 = -0.07 + k * 0.0175; path(c, Wp(sub(rect(0.3, 1.96, Y0, Y0 + 0.0175), 0.2))); c.fill(); }
    // the Monument's knoll, a paler crown
    c.fillStyle = LIGHT; path(c, Wp(oval(MON[0], MON[1], 0.13, 0.17, 30))); c.fill();
  }, { t: 3.3, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the gravel walks and drives, and the circle round the Lincoln Memorial
  const walks = [rect(0.3, 1.96, 0.07, 0.082), rect(0.3, 1.96, -0.082, -0.07), rect(0.3, 1.96, 0.142, 0.156), rect(0.3, 1.96, -0.156, -0.142),
    rect(2.8, 3.41, 0.048, 0.06), rect(2.8, 3.41, -0.06, -0.048)];
  const ring = Wp(oval(LINC[0], LINC[1], 0.13, 0.13, 40)), ringIn = Wp(oval(LINC[0], LINC[1], 0.1, 0.1, 40));
  p.group('grass', lb, (c) => {
    c.fillStyle = STREET; for (const w0 of walks) { path(c, Wp(sub(w0, 0.15))); c.fill(); }
    c.beginPath(); addPath(c, ring); addPath(c, ringIn.slice().reverse()); c.fill();
    c.fillStyle = LAWN; path(c, ringIn); c.fill();
    // the Monument's spokes
    c.strokeStyle = STREET; c.lineWidth = 1.6; c.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.4, [x0, y0] = P(MON[0] + Math.cos(a) * 0.03, MON[1] + Math.sin(a) * 0.03), [x1, y1] = P(MON[0] + Math.cos(a) * 0.3, MON[1] + Math.sin(a) * 0.27); c.moveTo(x0, y0); c.lineTo(x1, y1); }
    c.stroke();
  }, { t: 3.7, d: 0.8, reveal: 'fall' });

  // the railroad's cutting, its two tracks and their ties
  const railS = Wp(RAIL);
  const cut = [...RAIL.map(([X, Y]) => [X, Y + 0.013]), ...RAIL.slice().reverse().map(([X, Y]) => [X, Y - 0.013])];
  p.group('grass', clipBox(boxOf(railS, 20)), (c) => {
    c.fillStyle = '#c7b58c'; path(c, Wp(cut)); c.fill();
    c.strokeStyle = 'rgba(36,48,74,0.4)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < RAIL.length; i++) { const [X, Y] = RAIL[i], a = P(X, Y - 0.012), b = P(X, Y + 0.012); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath();
    for (const dy of [-0.008, 0.008]) RAIL.forEach(([X, Y], i) => { const [x, y] = P(X, Y + dy); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
  }, { t: 3.6, d: 0.8, reveal: 'wipeL' });

  // the water in the parks: the Reflecting Pool, the World War II memorial's pool, the
  // Constitution Gardens lake, the Tidal Basin and the Washington Channel
  const pool = Wp(sub(rect(2.79, 3.42, -0.036, 0.036), 0.05));
  const ww2 = Wp(oval(2.66, -0.03, 0.05, 0.075, 30)), ww2p = Wp(oval(2.66, -0.03, 0.033, 0.05, 30));
  const lake = Wp(oval(3.0, 0.16, 0.16, 0.045, 30));
  const tb = Wp(sub(TB, 0.05)), ch = Wp(sub(chan, 0.08));
  const wb = clipBox(boxOf([...pool, ...lake, ...tb, ...ch], 6));
  const tw = rng(67), ripples = [];
  for (let i = 0; i < 80; i++) { const X = tw.range(2.1, 3.0), Y = tw.range(-0.95, -0.33); if (inPoly(TB, X, Y)) ripples.push([...P(X, Y), S(X, Y) * tw.range(0.01, 0.02)]); }
  p.group('grass', wb, (c) => {
    c.fillStyle = STONE; path(c, ww2); c.fill();
    c.fillStyle = POOL; path(c, pool); c.fill(); path(c, ww2p); c.fill(); path(c, lake); c.fill();
    c.fillStyle = RIVER; path(c, tb); c.fill(); path(c, ch); c.fill();
    // the sky's pale band down the length of the Reflecting Pool
    c.fillStyle = '#c4dbe0'; path(c, Wp(sub(rect(2.8, 3.41, -0.012, 0.012), 0.05))); c.fill();
    c.strokeStyle = RIVER2; c.lineWidth = 1.4; c.beginPath();
    for (const [x, y, l] of ripples) { c.moveTo(x - l, y); c.lineTo(x + l, y); }
    c.stroke();
    // the inlet bridge's white arch on the basin's west side
    const [bx, by] = P(2.97, -0.72);
    c.fillStyle = STONE; c.fillRect(bx - 9, by - 4, 18, 4);
  }, { t: 3.9, d: 0.9, reveal: 'fall' });
}

// ================================================================ what stands on the ground, far to near
// Every building and tree is an item with its depth f and a draw; items are printed
// in bands, far first. Trees in a run are printed ink by ink, so their crowns merge.
function things(p) {
  const items = [];
  const put = (X, Y, bb, draw) => items.push({ f: fOf(X, Y), bb, draw });
  const crowns = (X, Y, R, pal) => {
    const [x, y] = P(X, Y), s = S(X, Y), rad = R * s / 1000;
    items.push({ f: fOf(X, Y), tree: [x, y, rad, pal], bb: { x: x - rad * 1.4, y: y - rad * 2.3, w: rad * 2.8, h: rad * 2.5 } });
  };
  const ELM = [DEEP, DARK, MID], OAK = [DARK, MID, LIGHT], CHERRY = [PINK2, PINK, PINK3];
  const block = (o) => {
    const pts = [P(o.X0, o.Y0), P(o.X0, o.Y1), P(o.X1, o.Y1), P(o.X1, o.Y0)];
    const tops = pts.map(([x, y]) => [x, y - o.z * S(o.X0, o.Y0) / U]);
    put(o.X0, (o.Y0 + o.Y1) / 2, boxOf([...pts, ...tops], 6 + (o.pad || 0)), (c) => { prism(c, o); if (o.extra) o.extra(c); });
  };

  // ---- the city blocks, north and south of the Mall, and on up to Georgetown
  const br = rng(1791);
  for (let i = 0; i < NS.length - 1; i++) {
    for (let j = 0; j < EW.length - 1; j++) {
      const X0 = NS[i] + 0.014, X1 = NS[i + 1] - 0.014, Y0 = EW[j] + 0.012, Y1 = EW[j + 1] - 0.012;
      const Xm = (X0 + X1) / 2, Ym = (Y0 + Y1) / 2;
      if (open(Xm, Ym) || open(X0, Y0) || open(X1, Y1) || open(X0, Y1) || open(X1, Y0) || !inPoly(DCLAND, Xm, Ym)) continue;
      const [sx, sy] = P(Xm, Ym);
      if (sx < M - 60 || sx > W - M + 60 || sy > PB + 40) continue;
      // the squares: a block of lawn under trees
      const n = Math.sin(Xm * 9.1 + Ym * 4.3) + Math.sin(Xm * 3.7 - Ym * 11.9);
      if (n > 1.55 && !(Ym > MALL_N && Ym < 0.62 && Xm < 1.95)) {
        items.push({ f: fOf(X0, Ym), bb: wbox(rect(X0, X1, Y0, Y1), 4), draw: (c) => { c.fillStyle = LAWN; path(c, Wp(rect(X0, X1, Y0, Y1))); c.fill(); } });
        for (let k = 0; k < 7; k++) crowns(br.range(X0, X1), br.range(Y0, Y1), br.range(10, 14), br.chance(0.3) ? CHERRY : OAK);
        continue;
      }
      // Georgetown: low brick rows; the Federal Triangle: limestone and red tile, one height;
      // south-west: big plain federal blocks round courts
      const gtown = Xm > 4.3 && Ym > 0.95;
      const fed = Ym > MALL_N && Ym < 0.62 && Xm > 0.55 && Xm < 1.95 && Ym < 0.3 + (Xm - 0.2) * 0.38;
      const south = Ym < MALL_S && Xm < 2.0;
      // south of the railroad and on Capitol Hill: brick rows under big trees
      if (Ym < RAILY || Xm < 0.3) {
        for (let k = 0; k < 2; k++) {
          const a = lerp(X0, X1, k / 2) + 0.005, b = lerp(X0, X1, (k + 1) / 2) - 0.005;
          block({ X0: a, X1: b, Y0, Y1, z: br.range(34, 56), color: br.pick(['#c98e6c', '#b9674c', '#d9a27c', '#e3c9a3', STONE]), roof: br.pick([SLATE2, VERM, '#9a6a4e', SLATE, '#b9a989']), court: br.chance(0.3), story: 12, pitch: 7 });
        }
        for (let k = 0; k < 5; k++) crowns(X0 - 0.008, lerp(Y0, Y1, (k + 0.5) / 5), br.range(10, 14), br.chance(0.25) ? CHERRY : OAK);
        if (br.chance(0.5)) for (let k = 0; k < 3; k++) crowns(lerp(X0, X1, (k + 0.5) / 3), Y0 - 0.006, br.range(9, 13), OAK);
        continue;
      }
      if (gtown) {
        for (let k = 0; k < 3; k++) {
          const a = lerp(X0, X1, k / 3) + 0.004, b = lerp(X0, X1, (k + 1) / 3) - 0.004;
          block({ X0: a, X1: b, Y0, Y1, z: br.range(30, 50), color: br.pick(['#c98e6c', '#b9674c', '#d9a27c', STONE2, '#e3c9a3']), roof: br.pick([SLATE2, VERM, '#9a6a4e', SLATE]), story: 12, pitch: 7 });
        }
        if (br.chance(0.6)) crowns(X0 - 0.008, Ym, br.range(10, 14), OAK);
        continue;
      }
      if (south) {
        const split = br.chance(0.5);
        for (const [a, b] of split ? [[X0, (X0 + X1) / 2 - 0.006], [(X0 + X1) / 2 + 0.006, X1]] : [[X0, X1]]) {
          block({ X0: a, X1: b, Y0, Y1, z: br.range(60, 100), color: br.pick([STONE, '#e6d2ad', '#d7cdb4', '#d9b48f', '#c98e6c']), roof: br.pick(['#a9b5a6', SLATE, '#c9b694', VERM, SLATE2]), court: !split || br.chance(0.4), story: 14, pitch: 8 });
        }
        for (let k = 0; k < 4; k++) crowns(X0 - 0.01, lerp(Y0, Y1, (k + 0.5) / 4), 11, br.chance(0.3) ? CHERRY : OAK);
        if (br.chance(0.4)) for (let k = 0; k < 3; k++) crowns(lerp(X0, X1, (k + 0.5) / 3), Y1 + 0.006, 10, OAK);
        continue;
      }
      const fz = fed ? 92 : br.range(50, 115);
      // a block is one building or two
      const halves = !fed && br.chance(0.55) ? [[X0, (X0 + X1) / 2 - 0.006], [(X0 + X1) / 2 + 0.006, X1]] : [[X0, X1]];
      for (const [a, b] of halves) {
        const col = fed ? STONE : br.pick([STONE, STONE2, '#e6d2ad', '#d9b48f', '#e3d9c3', '#c98e6c']);
        const roof = fed ? VERM : br.pick([SLATE, SLATE, '#9fa79c', '#b9a989', VERM, '#c9b694']);
        block({ X0: a, X1: b, Y0, Y1, z: fed ? fz : fz * br.range(0.8, 1.2), color: col, roof, court: fed || br.chance(0.3), story: 13, pitch: 9 });
      }
      // street trees along the block's near side
      if (!fed && br.chance(0.6)) for (let k = 0; k < 4; k++) crowns(X0 - 0.01, lerp(Y0, Y1, (k + 0.5) / 4), 9, OAK);
    }
  }
  // the White House, the Treasury and the Old Executive Office Building
  put(2.36, 0.87, clipBox({ x: P(2.38, 0.87)[0] - 60, y: P(2.38, 0.87)[1] - 50, w: 120, h: 60 }), (c) => whiteHouse(c));
  // the Botanic Garden's glass house at the Capitol's foot
  put(0.5, -0.42, clipBox({ x: P(0.5, -0.42)[0] - 80, y: P(0.5, -0.42)[1] - 90, w: 160, h: 100 }), (c) => conservatory(c));
  block({ X0: 2.16, X1: 2.24, Y0: 0.8, Y1: 1.02, z: 60, color: STONE, roof: SLATE2, story: 15, pitch: 7 });
  block({ X0: 2.52, X1: 2.6, Y0: 0.8, Y1: 1.02, z: 70, color: '#d6c9ab', roof: SLATE2, story: 14, pitch: 6 });
  // the Kennedy Center on the river, a long white box behind its thin columns
  block({ X0: 4.0, X1: 4.12, Y0: 0.5, Y1: 0.8, z: 70, color: CREAM, roof: '#d8d0b8', win: false, extra: (c) => {
    const [x0, yb] = P(4.0, 0.5), [x1] = P(4.0, 0.8), s = S(4.0, 0.6) / U;
    c.fillStyle = 'rgba(36,48,74,0.45)'; for (let x = x0 + 2; x < x1 - 1; x += 3.2) c.fillRect(x, yb - 66 * s, 1.1, 62 * s);
  } });
  // the spires of Healy Hall on Georgetown's hill
  put(5.5, 1.97, clipBox({ x: P(5.5, 1.97)[0] - 70, y: P(5.5, 1.97)[1] - 150, w: 140, h: 156 }), (c) => healy(c));
  // Key Bridge's arches, Georgetown to Rosslyn
  put(5.32, 1.28, clipBox(boxOf(Wp([[5.26, 1.5], [5.42, 1.06]]), 30)), (c) => keyBridge(c));
  // Rosslyn's towers on the Virginia shore
  const rt = rng(1965);
  const towers = [];
  for (let i = 0; i < 16; i++) towers.push([rt.range(5.2, 5.85), rt.range(0.42, 1.08), rt.range(0.05, 0.09), rt.range(240, 470)]);
  for (const [X, Y, w, z] of towers) {
    block({ X0: X, X1: X + w * 0.7, Y0: Y, Y1: Y + w, z, color: rt.pick(['#d8d4c4', '#c5ccc8', '#e3dccb', '#b9c3c4']), roof: SLATE, side: '#9aa7ad', story: 14, pitch: 6, win: 'rgba(76,127,166,0.8)' });
  }
  // Fort Myer's barracks on the ridge beyond the cemetery: long red roofs in rows
  for (let k = 0; k < 7; k++) block({ X0: 6.25 + (k % 2) * 0.1, X1: 6.31 + (k % 2) * 0.1, Y0: -0.25 + k * 0.08, Y1: -0.2 + k * 0.08, z: 40, color: '#c98e6c', roof: VERM, story: 12, pitch: 6 });
  // Arlington House on its crest, the Hemicycle at the cemetery's gate
  put(ARLH[0] - 0.02, ARLH[1], clipBox({ x: P(...ARLH)[0] - 90, y: P(...ARLH)[1] - 80, w: 180, h: 90 }), (c) => arlingtonHouse(c));
  put(HEMI[0], HEMI[1], clipBox({ x: P(...HEMI)[0] - 40, y: P(...HEMI)[1] - 24, w: 80, h: 32 }), (c) => hemicycle(c));
  // the oaks of the cemetery and the woods round Arlington House
  const cr = rng(1864);
  for (let i = 0; i < 70; i++) {
    const X = cr.range(4.85, 6.2), Y = cr.range(-1.75, -0.3);
    if (!inPoly(CEM, X, Y) || Math.hypot(X - ARLH[0], Y - ARLH[1]) < 0.08) continue;
    crowns(X, Y, cr.range(16, 24), OAK);
  }
  for (let i = 0; i < 26; i++) { const a = cr.range(0, Math.PI * 2), d = cr.range(0.1, 0.22); crowns(ARLH[0] + 0.05 + Math.cos(a) * d * 0.6, ARLH[1] + Math.sin(a) * d, cr.range(18, 26), ELM); }
  // the trees along Memorial Avenue and on Columbia Island
  for (let t = 0.05; t < 1; t += 0.07) for (const dy of [-0.025, 0.025]) crowns(lerp(BR1[0], HEMI[0], t), lerp(BR1[1], HEMI[1], t) + dy, 10, ELM);
  for (let i = 0; i < 40; i++) { const Y = cr.range(-1.6, 0.0), X = cr.range(4.52, 4.66); crowns(X, Y, cr.range(12, 18), OAK); }

  // ---- the Mall
  // the elms: four rows each side of the lawn, a double row each side of the pool
  for (const sd of [-1, 1]) {
    for (const Y of [0.092, 0.107, 0.122, 0.136]) for (let X = 0.32; X < 1.96; X += 0.024) crowns(X, sd * Y, 14, ELM);
    for (const Y of [0.074, 0.09]) for (let X = 2.8; X < 3.42; X += 0.028) crowns(X, sd * Y, 14, ELM);
  }
  // the museums: north side, the National Gallery's West Building and its dome, the
  // Sculpture Garden, Natural History and its dome, American History, the bronze corona
  block({ X0: 0.56, X1: 0.68, Y0: 0.165, Y1: 0.24, z: 70, color: '#ead2bd', roof: '#d6bba2', side: '#c9a88d', win: false, extra: (c) => eastBuilding(c) });
  block({ X0: 0.77, X1: 1.11, Y0: 0.165, Y1: 0.24, z: 64, color: '#ecd3bf', roof: '#cdb69f', side: '#d1ae95', story: 20, pitch: 14, extra: (c) => dome(c, 0.94, 0.2, 64, 34, '#8fa59a') });
  block({ X0: 1.34, X1: 1.6, Y0: 0.165, Y1: 0.24, z: 74, color: STONE, roof: '#c2b593', story: 22, pitch: 13, extra: (c) => dome(c, 1.47, 0.2, 74, 46, '#7f9a90') });
  block({ X0: 1.71, X1: 1.91, Y0: 0.165, Y1: 0.24, z: 64, color: '#e2d8c0', roof: '#b3ad99', story: 12, pitch: 18 });
  put(2.04, 0.2, clipBox({ x: P(2.04, 0.2)[0] - 50, y: P(2.04, 0.2)[1] - 70, w: 100, h: 76 }), (c) => corona(c, 2.04, 0.2));
  // south side: the American Indian museum's curves, Air and Space, the Hirshhorn's
  // drum, Arts and Industries, the Castle, the Freer
  put(0.63, -0.2, clipBox({ x: P(0.63, -0.2)[0] - 70, y: P(0.63, -0.2)[1] - 90, w: 140, h: 96 }), (c) => indian(c));
  block({ X0: 0.79, X1: 1.1, Y0: -0.24, Y1: -0.165, z: 66, color: '#e5dccb', roof: '#bdb6a6', story: 66, pitch: 46, win: 'rgba(76,127,166,0.85)' });
  put(1.2, -0.2, clipBox({ x: P(1.2, -0.2)[0] - 50, y: P(1.2, -0.2)[1] - 60, w: 100, h: 70 }), (c) => hirshhorn(c));
  block({ X0: 1.3, X1: 1.39, Y0: -0.24, Y1: -0.165, z: 44, color: '#cf8c6c', roof: '#7e8d86', side: '#b06f54', story: 14, pitch: 8, extra: (c) => {
    for (const Y of [-0.24, -0.2, -0.165]) turret(c, 1.3, Y, 44, 26, 8, '#cf8c6c', '#7e8d86');
  } });
  put(1.43, -0.17, clipBox({ x: P(1.47, -0.17)[0] - 80, y: P(1.47, -0.17)[1] - 120, w: 160, h: 126 }), (c) => castle(c));
  block({ X0: 1.55, X1: 1.64, Y0: -0.24, Y1: -0.165, z: 46, color: '#d6cdb8', roof: SLATE, story: 14, pitch: 8 });
  // the Sculpture Garden's pool and its trees, and the gardens behind the Castle
  for (let i = 0; i < 22; i++) crowns(br.range(1.14, 1.27), br.range(0.17, 0.24), 11, OAK);
  for (let i = 0; i < 14; i++) crowns(br.range(1.42, 1.56), br.range(-0.25, -0.22), 9, CHERRY);
  // cars along Constitution and Independence Avenues
  for (const Y of [MALL_N + 0.008, MALL_S - 0.008]) for (let X = 0.4; X < 3.7; X += br.range(0.03, 0.09)) {
    const [x, y] = P(X, Y), s = S(X, Y) / 1000, col = br.pick([NAVY, VERM, OCHRE, CREAM, SLATE2, '#2f6b5a']);
    put(X, Y, { x: x - 10 * s - 2, y: y - 8 * s - 2, w: 20 * s + 4, h: 10 * s + 4 }, (c) => { c.fillStyle = col; c.fillRect(x - 5 * s, y - 4.5 * s, 10 * s, 4.5 * s); c.fillStyle = NAVY; c.fillRect(x - 3 * s, y - 6.5 * s, 6 * s, 2 * s); });
  }
  // the Ellipse's ring of trees and the White House grounds
  for (let k = 0; k < 30; k++) { const a = (k / 30) * Math.PI * 2; crowns(2.38 + Math.cos(a) * 0.185, 0.5 + Math.sin(a) * 0.175, 13, OAK); }
  for (let i = 0; i < 24; i++) crowns(br.range(2.28, 2.5), br.range(0.72, 1.1), br.range(10, 15), ELM);
  // the Monument grounds: elms scattered on the slopes, and the World War II memorial's pillars
  for (let i = 0; i < 60; i++) {
    const X = br.range(1.98, 2.6), Y = br.range(-0.28, 0.24);
    if (Math.hypot((X - MON[0]) / 0.14, (Y - MON[1]) / 0.18) < 1.1) continue;
    crowns(X, Y, br.range(12, 17), br.chance(0.25) ? CHERRY : ELM);
  }
  put(2.66, -0.03, clipBox(boxOf(Wp(oval(2.66, -0.03, 0.06, 0.09)), 12)), (c) => ww2(c));
  // Constitution Gardens and the woods along the pool's south side
  for (let i = 0; i < 90; i++) {
    const X = br.range(2.66, 3.8), Y = br.range(-0.3, 0.26);
    if (Math.abs(Y) < 0.11 || Math.hypot(X - LINC[0], Y - LINC[1]) < 0.16 || (Y > 0.1 && Math.hypot((X - 3.0) / 0.17, (Y - 0.16) / 0.06) < 1.1)) continue;
    crowns(X, Y, br.range(12, 17), br.chance(0.15) ? OAK : ELM);
  }
  // the ring of trees round the Lincoln Memorial
  for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; if (Math.cos(a) < -0.85) continue; crowns(LINC[0] + Math.cos(a) * 0.145, LINC[1] + Math.sin(a) * 0.145, 12, ELM); }
  // West Potomac Park: cherries along the river and the basin, and the Jefferson's grove
  for (let i = 0; i < 46; i++) { const t = i / 46, X = lerp(3.1, 3.8, t) - (1 - t) * 0.1, Y = lerp(-0.92, -0.3, t); crowns(X - 0.03, Y + 0.02 * Math.sin(i), 12, CHERRY); }
  for (let i = 0; i < 60; i++) { const X = br.range(3.0, 3.7), Y = br.range(-0.85, -0.32); if (inPoly(DCB.concat([[9, -6], [9, 4]]), X, Y)) continue; crowns(X, Y, br.range(11, 15), br.chance(0.6) ? CHERRY : ELM); }
  // the cherries round the Tidal Basin, two deep
  for (let k = 0; k < 64; k++) {
    const i = Math.floor((k / 64) * TB.length), j = (i + 1) % TB.length, t = (k / 64) * TB.length - i;
    const X = lerp(TB[i][0], TB[j][0], t), Y = lerp(TB[i][1], TB[j][1], t);
    const cx = 2.55, cy = -0.62, d = Math.hypot(X - cx, Y - cy);
    for (const k2 of [1.06, 1.14]) { const XX = cx + (X - cx) * (1 + (k2 - 1) * 0.3 / d), YY = cy + (Y - cy) * (1 + (k2 - 1) * 0.3 / d); if (Math.hypot(XX - JEFF[0], YY - JEFF[1]) > 0.07) crowns(XX, YY, 13, CHERRY); }
  }
  // East Potomac Park: cherries in long rows down the peninsula
  for (let i = 0; i < 70; i++) { const t = br.range(0, 1), X = lerp(2.95, 2.0, t) - br.range(0, 0.3), Y = lerp(-1.08, -2.5, t); if (inPoly([[3.02, -1.02], [2.86, -1.3], [2.55, -1.85], [2.1, -2.6], [1.7, -2.6], [2.05, -1.45], [2.1, -1.05]], X, Y)) crowns(X, Y, 13, br.chance(0.75) ? CHERRY : ELM); }
  // the lawn east of the basin
  for (let i = 0; i < 26; i++) crowns(br.range(1.99, 2.22), br.range(-0.95, -0.32), 12, br.chance(0.5) ? CHERRY : OAK);
  // the memorials
  put(LINC[0] - 0.04, LINC[1], clipBox({ x: P(...LINC)[0] - 80, y: P(...LINC)[1] - 70, w: 160, h: 84 }), (c) => lincoln(c));
  put(JEFF[0] - 0.05, JEFF[1], clipBox({ x: P(...JEFF)[0] - 80, y: P(...JEFF)[1] - 90, w: 170, h: 100 }), (c) => jefferson(c));
  // the Memorial Bridge, low granite arches across the river
  put(4.1, -0.27, clipBox(boxOf(Wp([BR0, BR1]), 30)), (c) => memorialBridge(c));
  // the Capitol's grounds: big crowns at its sides, and the trees of the south-west
  for (let i = 0; i < 40; i++) { const X = br.range(0.05, 0.3), Y = br.range(-0.5, -0.2); crowns(X, Y, br.range(14, 20), br.chance(0.15) ? CHERRY : OAK); }

  // print them in bands, far to near
  items.sort((a, b) => b.f - a.f);
  const bands = [['far', 3.75, 2.2, 3.7, 9], ['mid', 1.9, 3.9, 5.6, 12], ['near', -9, 5.7, 7.2, 10]];
  let rest = items;
  for (const [layer, fmin, t0, t1, n] of bands) {
    const set = rest.filter((it) => it.f >= fmin);
    rest = rest.filter((it) => it.f < fmin);
    const per = Math.ceil(set.length / n);
    for (let i = 0; i < n; i++) {
      const part = set.slice(i * per, (i + 1) * per);
      if (!part.length) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const { bb } of part) { x0 = Math.min(x0, bb.x); y0 = Math.min(y0, bb.y); x1 = Math.max(x1, bb.x + bb.w); y1 = Math.max(y1, bb.y + bb.h); }
      p.group(layer, clipBox({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, 6), (c) => printRun(c, part),
        { t: lerp(t0, t1, i / Math.max(1, n - 1)), d: 0.8, reveal: 'rise', ease: 'out' });
    }
  }
}
// buildings in order; a run of trees ink by ink: the dark under-crowns, the leaf, the light
function printRun(c, part) {
  let run = [];
  const flush = () => {
    if (!run.length) return;
    for (let pass = 0; pass < 3; pass++) {
      const by = new Map();
      for (const t of run) { const col = t[3][pass]; if (!by.has(col)) by.set(col, []); by.get(col).push(t); }
      for (const [col, list] of by) {
        c.fillStyle = col; c.beginPath();
        for (const [x, y, R] of list) {
          if (pass === 0) { c.moveTo(x + R * 0.2 + R, y - R * 0.85); c.arc(x + R * 0.2, y - R * 0.85, R, 0, Math.PI * 2); }
          else if (pass === 1) { c.moveTo(x - R * 0.12 + R * 0.8, y - R * 1.02); c.arc(x - R * 0.12, y - R * 1.02, R * 0.8, 0, Math.PI * 2); }
          else { c.moveTo(x - R * 0.4 + R * 0.28, y - R * 1.3); c.arc(x - R * 0.4, y - R * 1.3, R * 0.28, 0, Math.PI * 2); }
        }
        c.fill();
      }
    }
    run = [];
  };
  for (const it of part) {
    if (it.tree) run.push(it.tree);
    else { flush(); it.draw(c); }
  }
  flush();
}

// a building: walls that face us, its roof and its windows. o: { X0, X1, Y0, Y1, z, color, roof, side, court, story, pitch, win }
function prism(c, o) {
  const F = [[o.X0, o.Y0], [o.X0, o.Y1], [o.X1, o.Y1], [o.X1, o.Y0]];
  const s0 = S(o.X0, (o.Y0 + o.Y1) / 2) / U;
  const B = F.map(([X, Y]) => P(X, Y)), T = F.map(([X, Y]) => P(X, Y, o.z));
  for (let i = 0; i < 4; i++) {
    const a = i, b = (i + 1) % 4, q = [B[a], B[b], T[b], T[a]];
    let area = 0;
    for (let k = 0; k < 4; k++) { const p0 = q[k], p1 = q[(k + 1) % 4]; area += p0[0] * p1[1] - p1[0] * p0[1]; }
    if (area >= 0) continue;
    c.fillStyle = i === 0 ? o.color : (o.side || shade(o.color, 0.8)); path(c, q); c.fill();
    if (o.win !== false) faceWindows(c, q, Math.max(1, Math.round(o.z / (o.story || 14))), Math.max(3, (o.pitch || 9) * s0 * 1.4), o.win || 'rgba(36,48,74,0.62)');
  }
  c.fillStyle = o.roof || shade(o.color, 0.9); path(c, T); c.fill();
  if (o.court) {
    const m = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const L = (x, y) => m(m(T[0], T[1], x), m(T[3], T[2], x), y), k = 0.3;
    c.fillStyle = shade(o.roof || o.color, 0.66); path(c, [L(k, k), L(1 - k, k), L(1 - k, 1 - k), L(k, 1 - k)]); c.fill();
  }
}
function faceWindows(c, q, rows, pitch, color) {
  const [b0, b1, t1, t0] = q;
  const len = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]), hgt = Math.abs(b0[1] - t0[1]);
  if (len < 4 || hgt < 5) return;
  const cols = Math.max(1, Math.round(len / pitch));
  const L = (x, y) => [lerp(lerp(b0[0], b1[0], x), lerp(t0[0], t1[0], x), y), lerp(lerp(b0[1], b1[1], x), lerp(t0[1], t1[1], x), y)];
  c.fillStyle = color; c.beginPath();
  const wh = Math.max(0.9, (hgt / (rows + 0.6)) * 0.46);
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.35) / (rows + 0.6);
    for (let k = 0; k < cols; k++) {
      const a = L((k + 0.28) / cols, y), b = L((k + 0.72) / cols, y);
      c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], b[1] - wh); c.lineTo(a[0], a[1] - wh);
    }
  }
  c.fill();
}
// a dome on a roof at (X, Y), z the roof's height
function dome(c, X, Y, z, rad, col) {
  const s = S(X, Y) / U, [x, y] = P(X, Y, z), R = rad * s;
  c.fillStyle = STONE; c.fillRect(x - R * 0.85, y - R * 0.4, R * 1.7, R * 0.42);
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y - R * 0.4, R * 0.72, R * 0.7, 0, Math.PI, 0); c.fill();
  c.fillStyle = SHADE; c.beginPath(); c.ellipse(x, y - R * 0.4, R * 0.72, R * 0.7, 0, Math.PI * 1.55, 0); c.lineTo(x + R * 0.15, y - R * 0.4); c.fill();
  c.fillStyle = CREAM; c.fillRect(x - R * 0.08, y - R * 1.22, R * 0.16, R * 0.18);
}
function turret(c, X, Y, z, h, w, col, roof) {
  const s = S(X, Y) / U, [x, y] = P(X, Y, z), hw = w * s * 0.5, hh = h * s;
  c.fillStyle = col; c.fillRect(x - hw, y - hh, hw * 2, hh + 1);
  c.fillStyle = shade(col, 0.8); c.fillRect(x, y - hh, hw, hh + 1);
  c.fillStyle = roof; c.beginPath(); c.moveTo(x - hw * 1.2, y - hh); c.lineTo(x, y - hh - hw * 2.4); c.lineTo(x + hw * 1.2, y - hh); c.fill();
}

// ---------------------------------------------------------------- the landmarks, each in its own small drawing
// the Smithsonian Castle: red sandstone, a long hall and its crowd of towers
function castle(c) {
  const X0 = 1.4, X1 = 1.5, Y0 = -0.235, Y1 = -0.15, RED = '#b65a42', DRK = '#924631', ROOF = '#5c6b73';
  prism(c, { X0, X1, Y0, Y1, z: 50, color: RED, roof: ROOF, side: DRK, story: 15, pitch: 6, win: 'rgba(36,48,74,0.8)' });
  const T = [[-0.225, 108, 15, 'spire'], [-0.207, 82, 12, 'flat'], [-0.186, 150, 15, 'flag'], [-0.17, 96, 18, 'flat'], [-0.156, 70, 11, 'spire'], [-0.232, 64, 10, 'spire']];
  for (const [Y, h, w, kind] of T) {
    const s = S(X0, Y) / U, [x, y] = P(X0, Y), hw = w * s * 0.5, hh = h * s;
    c.fillStyle = RED; c.fillRect(x - hw, y - hh, 2 * hw, hh);
    c.fillStyle = DRK; c.fillRect(x + hw * 0.15, y - hh, hw * 0.85, hh);
    c.fillStyle = NAVY; for (let k = 1; k < 4; k++) c.fillRect(x - hw * 0.5, y - hh + k * hh * 0.22, hw * 0.55, hh * 0.09);
    if (kind === 'flat') { c.fillStyle = RED; for (let k = -2; k <= 2; k++) c.fillRect(x + k * hw * 0.42 - hw * 0.15, y - hh - hw * 0.45, hw * 0.3, hw * 0.45); }
    else { c.fillStyle = ROOF; c.beginPath(); c.moveTo(x - hw * 1.1, y - hh); c.lineTo(x, y - hh - hw * (kind === 'spire' ? 3.4 : 2)); c.lineTo(x + hw * 1.1, y - hh); c.fill(); }
    if (kind === 'flag') { c.strokeStyle = NAVY; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - hh - hw * 2); c.lineTo(x, y - hh - hw * 3.4); c.stroke(); }
  }
}
// the Hirshhorn: a concrete drum on four piers, a band of window round it
function hirshhorn(c) {
  const [x, y] = P(1.2, -0.2), s = S(1.2, -0.2) / U, R = 0.04 * S(1.2, -0.2), h = 64 * s, ry = R * 0.36;
  c.fillStyle = '#e4dccb'; c.fillRect(x - R, y - h, 2 * R, h * 0.82);
  c.beginPath(); c.ellipse(x, y - h * 0.18, R, ry, 0, 0, Math.PI); c.fill();
  c.fillStyle = SHADE; c.fillRect(x + R * 0.3, y - h, R * 0.7, h * 0.82);
  c.fillStyle = 'rgba(36,48,74,0.7)'; c.fillRect(x - R, y - h * 0.62, 2 * R, h * 0.1);
  c.fillStyle = '#cfc6b3'; c.beginPath(); c.ellipse(x, y - h, R, ry, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = LAWN; c.beginPath(); c.ellipse(x, y - h, R * 0.45, ry * 0.45, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = NAVY; for (let k = -1; k <= 1; k += 2) c.fillRect(x + k * R * 0.5 - 1.5, y - h * 0.2, 3, h * 0.2);
}
// the National Museum of the American Indian: curved tiers of golden stone
function indian(c) {
  const [x, y] = P(0.63, -0.2), s = S(0.63, -0.2) / U;
  for (let k = 0; k < 5; k++) {
    const w = (60 - k * 7) * s, yy = y - k * 12 * s;
    c.fillStyle = k % 2 ? '#d9a85f' : '#e6bb73'; c.beginPath(); c.ellipse(x, yy, w, 14 * s, 0, Math.PI, 0); c.lineTo(x + w, yy + 12 * s); c.lineTo(x - w, yy + 12 * s); c.fill();
  }
  c.fillStyle = '#c38f4c'; c.beginPath(); c.ellipse(x + 10 * s, y - 62 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2); c.fill();
}
// the National Gallery's East Building: sharp triangles of pink marble
function eastBuilding(c) {
  const [x, y] = P(0.62, 0.225), s = S(0.62, 0.225) / U;
  c.fillStyle = '#ead2bd'; c.beginPath(); c.moveTo(x - 50 * s, y); c.lineTo(x - 50 * s, y - 76 * s); c.lineTo(x + 34 * s, y - 76 * s); c.lineTo(x + 50 * s, y); c.fill();
  c.fillStyle = '#c9a88d'; c.beginPath(); c.moveTo(x + 6 * s, y); c.lineTo(x + 6 * s, y - 76 * s); c.lineTo(x + 34 * s, y - 76 * s); c.lineTo(x + 50 * s, y); c.fill();
}
// the African American museum: three bronze tiers, wider as they rise
function corona(c, X, Y) {
  const s = S(X, Y) / U, [x, y] = P(X, Y), w0 = 0.04 * S(X, Y), h = 15 * s;
  c.fillStyle = '#d9cfb8'; c.fillRect(x - w0 * 0.7, y - h * 1.4, w0 * 1.4, h * 1.4);
  for (let k = 0; k < 3; k++) {
    const yb = y - h * (1.4 + k * 1.5), yt = yb - h * 1.4, wb = w0 * (0.72 + k * 0.14), wt = wb * 1.1;
    c.fillStyle = '#9b6a3c'; c.beginPath(); c.moveTo(x - wb, yb); c.lineTo(x + wb, yb); c.lineTo(x + wt, yt); c.lineTo(x - wt, yt); c.fill();
    c.fillStyle = '#7c5230'; c.beginPath(); c.moveTo(x + wb * 0.3, yb); c.lineTo(x + wb, yb); c.lineTo(x + wt, yt); c.lineTo(x + wt * 0.3, yt); c.fill();
    c.strokeStyle = 'rgba(228,173,75,0.65)'; c.lineWidth = 0.8; c.beginPath();
    for (let i = -6; i <= 6; i++) { c.moveTo(x + i * wb / 6.5, yb); c.lineTo(x + i * wt / 6.5, yt); }
    c.stroke();
  }
}
// the World War II memorial: an oval of pillars round its pool, arches at the ends
function ww2(c) {
  const s = S(2.66, -0.03) / U;
  c.fillStyle = STONE2;
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2; if (Math.abs(Math.sin(a)) > 0.97) continue;
    const [x, y] = P(2.66 + Math.cos(a) * 0.055, -0.03 + Math.sin(a) * 0.082);
    c.fillRect(x - 1.2, y - 12 * s, 2.4, 12 * s);
  }
  for (const sd of [-1, 1]) { const [x, y] = P(2.66, -0.03 + sd * 0.085); c.fillStyle = STONE; c.fillRect(x - 5, y - 26 * s, 10, 26 * s); c.fillStyle = NAVY; c.fillRect(x - 2, y - 18 * s, 4, 12 * s); }
}
// the White House: a white house with its bowed south portico, toward the Ellipse
function whiteHouse(c) {
  const [x, y] = P(2.36, 0.87), s = S(2.36, 0.87) / U * 2.6;
  c.fillStyle = '#c9d48f'; c.beginPath(); c.ellipse(x - 10 * s, y + 4 * s, 70 * s, 14 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = STONE2; c.fillRect(x + 4 * s, y - 30 * s, 40 * s, 26 * s);
  c.fillStyle = CREAM; c.fillRect(x - 44 * s, y - 30 * s, 48 * s, 26 * s);
  c.fillStyle = '#d8d2bf'; c.beginPath(); c.moveTo(x - 46 * s, y - 30 * s); c.lineTo(x + 46 * s, y - 30 * s); c.lineTo(x + 42 * s, y - 40 * s); c.lineTo(x - 42 * s, y - 40 * s); c.fill();
  c.fillStyle = 'rgba(36,48,74,0.6)'; for (let k = 0; k < 10; k++) { c.fillRect(x - 40 * s + k * 8.6 * s, y - 26 * s, 3 * s, 6 * s); c.fillRect(x - 40 * s + k * 8.6 * s, y - 16 * s, 3 * s, 6 * s); }
  // the bow
  c.fillStyle = CREAM; c.beginPath(); c.ellipse(x - 4 * s, y - 4 * s, 13 * s, 6 * s, 0, 0, Math.PI); c.lineTo(x - 17 * s, y - 32 * s); c.ellipse(x - 4 * s, y - 32 * s, 13 * s, 6 * s, 0, Math.PI, 0, true); c.fill();
  c.fillStyle = '#5b6474'; c.fillRect(x - 14 * s, y - 28 * s, 20 * s, 22 * s);
  c.fillStyle = CREAM; for (let k = 0; k < 5; k++) c.fillRect(x - 15 * s + k * 5 * s, y - 29 * s, 2.4 * s, 24 * s);
  c.fillStyle = STONE; c.beginPath(); c.ellipse(x - 4 * s, y - 32 * s, 14 * s, 6 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = VERM; c.fillRect(x - 4 * s, y - 52 * s, 9 * s, 5 * s); c.fillStyle = NAVY; c.fillRect(x - 4.5 * s, y - 52 * s, 1, 20 * s);
}
// the Botanic Garden's conservatory: glass wings and a tall glass house in the middle
function conservatory(c) {
  const [x, y] = P(0.5, -0.42), s = S(0.5, -0.42) / U * 2.2;
  const glass = (x0, w, h, top) => {
    c.fillStyle = STONE; c.fillRect(x0, y - 8 * s, w, 8 * s);
    c.fillStyle = '#bfd8d4'; c.beginPath(); c.moveTo(x0, y - 8 * s); c.lineTo(x0, y - h * s); c.quadraticCurveTo(x0 + w / 2, y - (h + top) * s, x0 + w, y - h * s); c.lineTo(x0 + w, y - 8 * s); c.fill();
    c.fillStyle = 'rgba(76,127,166,0.35)'; c.beginPath(); c.moveTo(x0 + w * 0.55, y - 8 * s); c.lineTo(x0 + w * 0.55, y - (h + top * 0.9) * s); c.quadraticCurveTo(x0 + w * 0.8, y - (h + top * 0.6) * s, x0 + w, y - h * s); c.lineTo(x0 + w, y - 8 * s); c.fill();
    c.strokeStyle = CREAM; c.lineWidth = 1; c.beginPath();
    for (let xx = x0 + 4 * s; xx < x0 + w; xx += 4.5 * s) { c.moveTo(xx, y - 8 * s); c.lineTo(xx, y - h * s - top * s * Math.sin(Math.PI * (xx - x0) / w) * 0.9); }
    c.stroke();
  };
  glass(x - 62 * s, 44 * s, 20, 6);
  glass(x + 18 * s, 44 * s, 20, 6);
  glass(x - 20 * s, 40 * s, 30, 26);
}
// Georgetown University's Healy Hall: a steep gray roof and its tall clock spire
function healy(c) {
  const [x, y] = P(5.5, 1.97), s = S(5.5, 1.97) / U * 2.5;
  c.fillStyle = '#9c9a8e'; c.fillRect(x - 40 * s, y - 60 * s, 80 * s, 60 * s);
  c.fillStyle = '#7f7d72'; c.fillRect(x + 12 * s, y - 60 * s, 28 * s, 60 * s);
  c.fillStyle = SLATE2; c.beginPath(); c.moveTo(x - 44 * s, y - 60 * s); c.lineTo(x - 30 * s, y - 84 * s); c.lineTo(x + 30 * s, y - 84 * s); c.lineTo(x + 44 * s, y - 60 * s); c.fill();
  c.fillStyle = NAVY; for (let k = 0; k < 6; k++) c.fillRect(x - 34 * s + k * 12 * s, y - 48 * s, 4 * s, 9 * s);
  // the spire
  c.fillStyle = '#a8a597'; c.fillRect(x - 8 * s, y - 130 * s, 16 * s, 70 * s);
  c.fillStyle = CREAM; c.beginPath(); c.arc(x, y - 116 * s, 4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = SLATE2; c.beginPath(); c.moveTo(x - 10 * s, y - 130 * s); c.lineTo(x, y - 190 * s); c.lineTo(x + 10 * s, y - 130 * s); c.fill();
  for (const dx of [-30, 30]) { c.beginPath(); c.moveTo(x + dx * s - 5 * s, y - 84 * s); c.lineTo(x + dx * s, y - 112 * s); c.lineTo(x + dx * s + 5 * s, y - 84 * s); c.fill(); }
}
// Key Bridge: a deck on stone arches
function keyBridge(c) {
  const a = [5.27, 1.47], b = [5.41, 1.08];
  const n = 6;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(P(lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)));
  const s = S(5.33, 1.27) / U;
  c.fillStyle = STONE2; c.beginPath();
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    c.moveTo(x0, y0 - 18 * s); c.lineTo(x1, y1 - 18 * s); c.lineTo(x1, y1 + 2);
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 12 * s, x0, y0 + 2); c.closePath();
  }
  c.fill();
  c.strokeStyle = CREAM; c.lineWidth = 2; c.beginPath(); c.moveTo(pts[0][0], pts[0][1] - 18 * s); c.lineTo(pts[n][0], pts[n][1] - 18 * s); c.stroke();
}
// the Memorial Bridge: a long low deck, its arches on the side toward us
function memorialBridge(c) {
  const n = 9, pts = [];
  for (let i = 0; i <= n; i++) pts.push([lerp(BR0[0], BR1[0], i / n), lerp(BR0[1], BR1[1], i / n)]);
  const dk = 0.026; // half the deck's width
  const deck = Wp([[BR0[0] - 0.007, BR0[1] - dk], [BR1[0] - 0.007, BR1[1] - dk], [BR1[0] + 0.007, BR1[1] + dk], [BR0[0] + 0.007, BR0[1] + dk]]);
  // the side toward us is the south-east face; arches under the near edge
  c.fillStyle = STONE2; c.beginPath();
  for (let i = 0; i < n; i++) {
    const [x0, y0] = P(pts[i][0] - 0.007, pts[i][1] - dk), [x1, y1] = P(pts[i + 1][0] - 0.007, pts[i + 1][1] - dk);
    const h = 20 * S(...pts[i]) / U;
    c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y1 + h);
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + h * 0.1, x0, y0 + h); c.closePath();
  }
  c.fill();
  c.fillStyle = STONE; path(c, deck); c.fill();
  c.strokeStyle = STONE3; c.lineWidth = 1; path(c, deck); c.stroke();
  // the bronze horsemen at the near end, two dark blocks
  const [x, y] = P(BR0[0] + 0.02, BR0[1] - 0.03);
  c.fillStyle = OCHRE; c.fillRect(x - 3, y - 9, 6, 9); c.fillRect(x + 14, y - 15, 6, 9);
}
// Arlington House: a buff mansion behind eight massive columns, facing us down the hill
function arlingtonHouse(c) {
  const [x, y] = P(...ARLH), s = S(...ARLH) / U * 3.2;
  // the wings
  c.fillStyle = '#e8c79a'; c.fillRect(x - 58 * s, y - 34 * s, 116 * s, 34 * s);
  c.fillStyle = '#c9a777'; c.fillRect(x + 22 * s, y - 34 * s, 36 * s, 34 * s);
  c.fillStyle = SLATE2; c.fillRect(x - 60 * s, y - 40 * s, 120 * s, 6 * s);
  c.fillStyle = NAVY; for (let k = 0; k < 4; k++) { c.fillRect(x - 54 * s + k * 9 * s, y - 26 * s, 4 * s, 10 * s); c.fillRect(x + 26 * s + k * 9 * s, y - 26 * s, 4 * s, 10 * s); }
  // the portico: a deep shadow, the columns, the pediment
  c.fillStyle = '#7a5a3c'; c.fillRect(x - 26 * s, y - 52 * s, 52 * s, 52 * s);
  c.fillStyle = '#f0d6aa';
  for (let k = 0; k < 8; k++) c.fillRect(x - 25 * s + k * 7 * s, y - 50 * s, 4.4 * s, 50 * s);
  c.fillStyle = '#e8c79a'; c.beginPath(); c.moveTo(x - 30 * s, y - 50 * s); c.lineTo(x, y - 68 * s); c.lineTo(x + 30 * s, y - 50 * s); c.fill();
  c.fillStyle = '#c9a777'; c.beginPath(); c.moveTo(x, y - 68 * s); c.lineTo(x + 30 * s, y - 50 * s); c.lineTo(x, y - 50 * s); c.fill();
  // the key line, printed a hair off
  c.strokeStyle = NAVY; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 29 * s + 1.5, y - 49 * s + 1); c.lineTo(x + 1.5, y - 67 * s + 1); c.lineTo(x + 31 * s + 1.5, y - 49 * s + 1); c.stroke();
  // the flag on its pole beside the house
  c.fillStyle = NAVY; c.fillRect(x - 66 * s, y - 70 * s, 1.2, 70 * s);
  c.fillStyle = VERM; c.fillRect(x - 66 * s + 1, y - 70 * s, 14 * s, 8 * s);
}
// the Hemicycle at the cemetery's gate: a low curved wall
function hemicycle(c) {
  const [x, y] = P(...HEMI), s = S(...HEMI) / U * 1.6;
  c.fillStyle = STONE; c.beginPath(); c.ellipse(x, y, 34 * s, 10 * s, 0, Math.PI, 0); c.lineTo(x + 34 * s, y + 6 * s); c.ellipse(x, y + 6 * s, 34 * s, 10 * s, 0, 0, Math.PI, true); c.fill();
  c.fillStyle = STONE3; c.beginPath(); c.ellipse(x, y, 34 * s, 10 * s, 0, Math.PI, 0); c.ellipse(x, y + 3 * s, 30 * s, 7 * s, 0, 0, Math.PI, true); c.fill();
  c.fillStyle = POOL; c.beginPath(); c.ellipse(x, y + 10 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2); c.fill();
}
// the Lincoln Memorial: a Doric temple on a high terrace, its twelve columns facing the pool
function lincoln(c) {
  const [x, y] = P(...LINC), s = S(...LINC) / U * 2.1;
  const w = 92 * s, d = 30 * s; // half the front; the depth seen from above
  // the terrace and the steps down to the pool
  c.fillStyle = STONE2; c.fillRect(x - w - 16 * s, y - 22 * s, 2 * w + 32 * s, 22 * s);
  c.fillStyle = STONE; c.beginPath(); c.moveTo(x - w - 16 * s, y - 22 * s); c.lineTo(x + w + 16 * s, y - 22 * s); c.lineTo(x + w + 6 * s, y - 22 * s - d * 1.3); c.lineTo(x - w - 26 * s, y - 22 * s - d * 1.3); c.fill();
  c.fillStyle = STONE; c.fillRect(x - 30 * s, y - 22 * s, 60 * s, 30 * s);
  c.strokeStyle = STONE3; c.lineWidth = 0.9; c.beginPath();
  for (let k = 1; k < 6; k++) { const yy = y - 22 * s + k * 5 * s; c.moveTo(x - 30 * s, yy); c.lineTo(x + 30 * s, yy); }
  c.stroke();
  // the roof seen from above, and the attic
  const b = y - 22 * s - 4 * s, top = b - 70 * s;
  c.fillStyle = '#d8ccab'; c.beginPath(); c.moveTo(x - w, top); c.lineTo(x + w, top); c.lineTo(x + w - 8 * s, top - d); c.lineTo(x - w - 8 * s, top - d); c.fill();
  c.fillStyle = '#c4b591'; c.fillRect(x - w * 0.8, top - d * 0.75, w * 1.5, d * 0.5);
  // the cella's shadow behind the colonnade
  c.fillStyle = '#5b6474'; c.fillRect(x - w, top + 14 * s, 2 * w, b - top - 14 * s);
  c.fillStyle = CREAM;
  for (let k = 0; k < 12; k++) { const cx = x - w + (k + 0.5) * (2 * w / 12); c.fillRect(cx - 4.2 * s, top + 14 * s, 8.4 * s, b - top - 14 * s); }
  c.fillStyle = STONE; c.fillRect(x - w - 2 * s, top, 2 * w + 4 * s, 15 * s);
  c.fillStyle = STONE3; for (let k = 0; k < 13; k++) c.fillRect(x - w + k * (2 * w / 12) - 1, top + 4 * s, 2, 6 * s);
  // the key line, off register
  c.strokeStyle = NAVY; c.lineWidth = 1.2; c.strokeRect(x - w - 2 * s + 2, top + 1.5, 2 * w + 4 * s, b - top);
}
// the Jefferson Memorial: a ring of columns under a low dome, its portico toward the basin
function jefferson(c) {
  const [x, y] = P(...JEFF), s = S(...JEFF) / U * 2.4;
  const R = 34 * s, ry = R * 0.42, base = y - 10 * s, top = base - 36 * s;
  // the terrace and steps
  c.fillStyle = STONE2; c.beginPath(); c.ellipse(x, y, R * 1.5, ry * 1.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = STONE; c.beginPath(); c.ellipse(x, y - 6 * s, R * 1.35, ry * 1.35, 0, 0, Math.PI * 2); c.fill();
  // the colonnade: a dark wall, light columns round the front
  c.fillStyle = '#5b6474'; c.fillRect(x - R, top, 2 * R, base - top); c.beginPath(); c.ellipse(x, base, R, ry, 0, 0, Math.PI); c.fill();
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * (k + 0.5) / 13, cx = x - Math.cos(a) * R, cw = 4.2 * s * Math.sin(a) + 1;
    c.fillStyle = mix(STONE2, CREAM, clamp(1 - (cx - x + R) / (2 * R) * 0.9)); c.fillRect(cx - cw / 2, top + 2 * s, cw, base - top - 2 * s + Math.sin(a) * ry);
  }
  // the entablature, the dome
  c.fillStyle = STONE; c.fillRect(x - R - 2 * s, top - 7 * s, 2 * R + 4 * s, 8 * s);
  c.beginPath(); c.ellipse(x, top - 7 * s, R + 2 * s, ry, 0, Math.PI, 0); c.fill();
  c.fillStyle = CREAM; c.beginPath(); c.ellipse(x, top - 10 * s, R * 0.82, R * 0.6, 0, Math.PI, 0); c.fill();
  c.fillStyle = SHADE; c.beginPath(); c.ellipse(x, top - 10 * s, R * 0.82, R * 0.6, 0, Math.PI * 1.6, 0); c.lineTo(x + R * 0.2, top - 10 * s); c.fill();
  // the portico, toward the north and the basin: to our right
  const px = x + R * 0.95, pw = 18 * s;
  c.fillStyle = '#5b6474'; c.fillRect(px - pw, top + 2 * s, pw * 2, base - top);
  c.fillStyle = CREAM; for (let k = 0; k < 4; k++) c.fillRect(px - pw + 1 + k * (pw * 2 / 4), top + 2 * s, 3.4 * s, base - top);
  c.fillStyle = STONE; c.beginPath(); c.moveTo(px - pw - 3 * s, top + 2 * s); c.lineTo(px - pw * 0.2, top - 14 * s); c.lineTo(px + pw + 3 * s, top + 2 * s); c.fill();
  c.fillStyle = STONE2; c.beginPath(); c.moveTo(px - pw * 0.2, top - 14 * s); c.lineTo(px + pw + 3 * s, top + 2 * s); c.lineTo(px - pw * 0.2, top + 2 * s); c.fill();
  c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x + 2, top - 8 * s, R * 0.82, R * 0.6, 0, Math.PI, 0); c.stroke();
}

// ================================================================ the Washington Monument, its flags and its shadow
function monument(p) {
  const [x, yb] = P(...MON), s = S(...MON) / U;
  const bw = 22, tw = 15, sh = 590, ph = 46; // half widths at foot and top, shaft and capstone
  // the shadow, falling to the north across the grounds and the avenue
  const tip = P(MON[0] - 0.02, MON[1] + 0.62);
  const shd = [[x - bw * 0.7, yb], [x + bw * 0.8, yb + 2], [tip[0] + 2, tip[1] + 1], [tip[0] - 3, tip[1] - 2]];
  p.group('grass', clipBox(boxOf(shd, 4)), (c) => {
    c.fillStyle = SHADE; path(c, shd); c.fill();
  }, { t: 7.1, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  const pts = [[x - bw, yb], [x + bw, yb], [x + tw, yb - sh], [x, yb - sh - ph], [x - tw, yb - sh]];
  p.group('mon', boxOf(pts, 8), (c) => {
    // the lit face and the face in shade, split down the middle, each its own ink
    c.fillStyle = CREAM; path(c, [[x - bw, yb], [x, yb], [x, yb - sh - ph], [x - tw, yb - sh]]); c.fill();
    c.fillStyle = STONE2; path(c, [[x + 1.5, yb], [x + bw + 1.5, yb], [x + tw + 1.5, yb - sh], [x + 1.5, yb - sh - ph]]); c.fill();
    // the dot screen over the shaded face
    c.save(); path(c, [[x + 1.5, yb], [x + bw + 1.5, yb], [x + tw + 1.5, yb - sh], [x + 1.5, yb - sh - ph]]); c.clip();
    c.fillStyle = c.createPattern(dots(), 'repeat'); c.fillRect(x, yb - sh - ph, bw + 4, sh + ph);
    c.restore();
    // the line a third of the way up where the marble changes
    const yc = yb - sh * 0.27, wc = lerp(bw, tw, 0.27);
    c.fillStyle = 'rgba(207,84,58,0.1)'; path(c, [[x - bw, yb], [x + bw, yb], [x + wc, yc], [x - wc, yc]]); c.fill();
    c.strokeStyle = 'rgba(36,48,74,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - wc, yc); c.lineTo(x + wc, yc); c.stroke();
    // the windows under the capstone
    c.fillStyle = NAVY; c.fillRect(x - 8, yb - sh + 10, 4, 7); c.fillRect(x + 5, yb - sh + 10, 3, 7);
    // the key line, printed off register
    c.strokeStyle = NAVY; c.lineWidth = 1.6; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - bw + 3, yb); c.lineTo(x - tw + 3, yb - sh); c.lineTo(x + 3, yb - sh - ph); c.lineTo(x + tw + 3, yb - sh); c.lineTo(x + bw + 3, yb); c.stroke();
    c.beginPath(); c.moveTo(x - tw + 3, yb - sh); c.lineTo(x + tw + 3, yb - sh); c.stroke();
  }, { t: 6.5, d: 1.8, reveal: 'rise', ease: 'inOut' });
  // the ring of flagpoles round its foot
  const poles = [];
  for (let k = 0; k < 50; k++) {
    const a = (k / 50) * Math.PI * 2, [px, py] = P(MON[0] + Math.cos(a) * 0.075, MON[1] + Math.sin(a) * 0.085);
    poles.push([px, py, Math.sin(a + 0.3) < 0]);
  }
  MONF.poles = poles; MONF.h = 12;
  p.group('mon', clipBox({ x: x - 80, y: yb - 50, w: 160, h: 80 }), (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 0.9; c.beginPath();
    for (const [px, py] of poles) { c.moveTo(px, py); c.lineTo(px, py - MONF.h); }
    c.stroke();
    c.fillStyle = STONE; c.beginPath(); c.ellipse(x, yb, bw * 1.5, bw * 0.5, 0, 0, Math.PI * 2); c.fill();
  }, { t: 8.2, d: 0.6, reveal: 'rise' });
}
const MONF = {};

// ================================================================ the Capitol, its dome rising at the lower right
// drawn at its own, larger scale: meters, x to the north (right), y to the west (away), z up
const CK = 4.6, C1 = 0.34, C2 = 0.95, CAPX = 1268, CAPY = 1488;
function C(xm, ym, z = 0) {
  return [CAPX + (xm * CT - ym * ST) * CK, CAPY - (ym * CT + xm * ST) * CK * C1 - z * CK * C2];
}
const CROOF = '#d3d1b9', CROOF2 = '#bdbca3';
// a box of the Capitol: its east face (toward us), the end toward the middle, the roof
function cbox(c, x0, x1, y0, y1, z0, z1, o = {}) {
  const front = [C(x0, y0, z0), C(x1, y0, z0), C(x1, y0, z1), C(x0, y0, z1)];
  const roof = [C(x0, y0, z1), C(x1, y0, z1), C(x1, y1, z1), C(x0, y1, z1)];
  // depth runs up and to the left, so the end we see is always the left one
  const end = [C(x0, y0, z0), C(x0, y1, z0), C(x0, y1, z1), C(x0, y0, z1)];
  c.fillStyle = o.side || STONE2; path(c, end); c.fill();
  c.fillStyle = o.color || STONE; path(c, front); c.fill();
  c.fillStyle = o.roof || CROOF; path(c, roof); c.fill();
  // the seams of the metal roof, running back
  c.strokeStyle = CROOF2; c.lineWidth = 1; c.beginPath();
  for (let xx = x0 + 3; xx < x1 - 1; xx += 3.5) { const a = C(xx, y0 + 1, z1), b = C(xx, y1 - 1, z1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // the cornice: a light line along the top of the face
  c.fillStyle = CREAM; path(c, [C(x0, y0, z1 - 1.6), C(x1, y0, z1 - 1.6), C(x1, y0, z1), C(x0, y0, z1)]); c.fill();
  if (o.win) {
    c.fillStyle = 'rgba(36,48,74,0.72)'; c.beginPath();
    const n = Math.round((x1 - x0) / 4.6);
    for (const zz of o.win) for (let k = 0; k < n; k++) {
      const xx = x0 + (k + 0.5) * (x1 - x0) / n;
      const [a, b] = C(xx - 0.9, y0, zz), [, d] = C(xx, y0, zz + 4.2);
      c.rect(a, d, C(xx + 0.9, y0, zz)[0] - a, b - d);
    }
    c.fill();
    // pilasters between the windows
    c.fillStyle = 'rgba(185,167,130,0.55)';
    for (let k = 0; k <= n; k += 2) { const xx = x0 + k * (x1 - x0) / n, [a, b] = C(xx, y0, 4), [, d] = C(xx, y0, z1 - 2); c.fillRect(a - 0.8, d, 1.6, b - d); }
  }
}
// a portico on an east face: the shadow behind, the columns, the pediment, the steps
function portico(c, xc, w, y0, depth, z0, z1, n) {
  c.fillStyle = CROOF; path(c, [C(xc - w, y0, z1), C(xc + w, y0, z1), C(xc + w, y0 - depth, z1), C(xc - w, y0 - depth, z1)]); c.fill();
  c.fillStyle = '#5d6678'; path(c, [C(xc - w, y0 - depth, z0), C(xc + w, y0 - depth, z0), C(xc + w, y0 - depth, z1 - 3), C(xc - w, y0 - depth, z1 - 3)]); c.fill();
  for (let k = 0; k < n; k++) {
    const xx = xc - w + (k + 0.5) * (2 * w / n), [cx, cb] = C(xx, y0 - depth, z0), [, ct] = C(xx, y0 - depth, z1 - 3);
    c.fillStyle = CREAM; c.fillRect(cx - 0.9 * CK, ct, 1.8 * CK, cb - ct);
    c.fillStyle = STONE2; c.fillRect(cx + 0.25 * CK, ct, 0.65 * CK, cb - ct);
  }
  const L = C(xc - w - 1.5, y0 - depth, z1 - 3), R = C(xc + w + 1.5, y0 - depth, z1 - 3), T = C(xc, y0 - depth, z1 + 6);
  c.fillStyle = STONE; path(c, [C(xc - w - 1.5, y0 - depth, z1 - 4.5), C(xc + w + 1.5, y0 - depth, z1 - 4.5), C(xc + w + 1.5, y0 - depth, z1 - 2), C(xc - w - 1.5, y0 - depth, z1 - 2)]); c.fill();
  // the roof over the portico, back to the wall, then the pediment's face in two inks
  c.fillStyle = CROOF2; path(c, [L, T, C(xc, y0, z1 + 6), C(xc - w - 1.5, y0, z1 - 3)]); c.fill();
  c.fillStyle = CROOF; path(c, [T, R, C(xc + w + 1.5, y0, z1 - 3), C(xc, y0, z1 + 6)]); c.fill();
  c.fillStyle = CREAM; path(c, [L, T, R]); c.fill();
  c.fillStyle = STONE2; path(c, [T, R, [T[0], R[1]]]); c.fill();
  c.strokeStyle = NAVY; c.lineWidth = 1.3; c.lineJoin = 'round'; c.beginPath(); c.moveTo(L[0] + 2.5, L[1] + 1.5); c.lineTo(T[0] + 2.5, T[1] + 1.5); c.lineTo(R[0] + 2.5, R[1] + 1.5); c.stroke();
  // the steps down to the plaza
  const st = [C(xc - w * 0.75, y0 - depth, z0), C(xc + w * 0.75, y0 - depth, z0), C(xc + w * 0.85, y0 - depth - 14, 0), C(xc - w * 0.85, y0 - depth - 14, 0)];
  c.fillStyle = STONE; path(c, st); c.fill();
  c.strokeStyle = STONE3; c.lineWidth = 0.9; c.beginPath();
  for (let k = 1; k < 8; k++) { const t = k / 8, a = C(xc - w * lerp(0.75, 0.85, t), y0 - depth - 14 * t, z0 * (1 - t)), b = C(xc + w * lerp(0.75, 0.85, t), y0 - depth - 14 * t, z0 * (1 - t)); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
}
function capitol(p) {
  const RZ = 26; // the roof line, in meters
  // the east plaza, its paving, and the lawns either side
  const plaza = [C(-150, -130), C(170, -130), C(170, -40), C(-150, -40)];
  p.group('capitol', clipBox(boxOf(plaza, 4)), (c) => {
    c.fillStyle = STREET; path(c, plaza); c.fill();
    c.strokeStyle = SAND; c.lineWidth = 1.2; c.beginPath();
    for (let k = -150; k < 170; k += 10) { const a = C(k, -130), b = C(k, -42); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    c.fillStyle = LAWN;
    for (const [x0, x1] of [[-150, -125], [140, 170]]) { path(c, [C(x0, -130), C(x1, -130), C(x1, -40), C(x0, -40)]); c.fill(); }
  }, { t: 7.4, d: 0.7, reveal: 'fall' });
  // the House wing, the old building, the Senate wing
  p.group('capitol', clipBox({ x: 560, y: 1180, w: 1100, h: 400 }), (c) => {
    // right to left, so each box covers the end wall of the one to its right
    cbox(c, 66, 118, -48, 34, 0, RZ, { win: [5, 15] });
    cbox(c, 30, 66, -30, 30, 0, RZ - 2, { win: [5, 15] });
    cbox(c, -30, 30, -34, 34, 0, RZ, { win: [5, 15] });
    cbox(c, -66, -30, -30, 30, 0, RZ - 2, { win: [5, 15] });
    cbox(c, -118, -66, -48, 34, 0, RZ, { win: [5, 15] });
    // the balustrades along the roof edges, as dot rows
    c.fillStyle = 'rgba(36,48,74,0.5)';
    for (const [x0, x1, y0] of [[-118, -66, -48], [66, 118, -48], [-30, 30, -34], [-66, -30, -30], [30, 66, -30]]) for (let xx = x0 + 1; xx < x1; xx += 1.8) { const [a, b] = C(xx, y0, RZ + 1.4); c.fillRect(a, b, 1.3, 3); }
  }, { t: 7.7, d: 0.9, reveal: 'rise' });
  p.group('capitol', clipBox({ x: 560, y: 1240, w: 1100, h: 340 }), (c) => {
    portico(c, -92, 20, -48, 8, 6, RZ, 8);
    portico(c, 92, 20, -48, 8, 6, RZ, 8);
    portico(c, 0, 24, -34, 14, 7, RZ + 1, 8);
  }, { t: 8.2, d: 0.8, reveal: 'rise' });

  // the dome, larger than life: the podium, the peristyle, the attic, the shell, the lantern
  const E = 1.45, zb = RZ + 2;
  const ring = (r, z) => { const pts = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push(C(Math.cos(a) * r * E, Math.sin(a) * r * E, z)); } return pts; };
  const cyl = (c, r, z0, z1, col, top = true) => {
    const lo = ring(r, z0), hi = ring(r, z1);
    c.fillStyle = col; c.beginPath();
    c.moveTo(...lo[24]); for (let i = 25; i < 48; i++) c.lineTo(...lo[i]); c.lineTo(...lo[0]);
    c.lineTo(...hi[0]); for (let i = 47; i >= 24; i--) c.lineTo(...hi[i]); c.closePath(); c.fill();
    if (top) { path(c, hi); c.fill(); }
  };
  const domeBox = clipBox({ x: CAPX - 210, y: 930, w: 420, h: 420 });
  const zp = zb + 7, zt = zp + 15 * E; // the peristyle's foot and top
  p.group('capitol', domeBox, (c) => {
    cyl(c, 25, zb - 4, zb + 3, STONE);
    cyl(c, 23, zb + 3, zp, STONE2);
    c.fillStyle = 'rgba(36,48,74,0.4)';
    for (let k = 0; k < 24; k++) { const a = Math.PI + (k + 0.5) / 24 * Math.PI, [wx, wy] = C(Math.cos(a) * 23 * E, Math.sin(a) * 23 * E, zb + 4); c.fillRect(wx - 1, wy - 8, 2, 6); }
  }, { t: 8.6, d: 0.6, reveal: 'rise' });
  p.group('capitol', domeBox, (c) => {
    // the drum wall behind the columns, its windows, then the 36 columns, of which we see half
    cyl(c, 18.5, zp, zt, '#58637a');
    c.fillStyle = 'rgba(228,173,75,0.7)';
    for (let k = 0; k < 12; k++) {
      const a = Math.PI + (k + 0.5) / 12 * Math.PI, sw = Math.abs(Math.sin(a));
      const [wx, wy] = C(Math.cos(a) * 18.5 * E, Math.sin(a) * 18.5 * E, zp + 4), [, wt] = C(Math.cos(a) * 18.5 * E, Math.sin(a) * 18.5 * E, zp + 15);
      c.fillRect(wx - 2.4 * sw - 0.5, wt, 4.8 * sw + 1, wy - wt);
    }
    for (let k = 0; k < 18; k++) {
      const a = Math.PI + (k + 0.5) / 18 * Math.PI, xx = Math.cos(a) * 22 * E, yy = Math.sin(a) * 22 * E;
      const [cx, cb] = C(xx, yy, zp), [, ct] = C(xx, yy, zt);
      const lit = clamp(0.6 - Math.cos(a) * 0.6), w = 3.6 * Math.abs(Math.sin(a)) + 1.4;
      c.fillStyle = mix(STONE3, CREAM, lit); c.fillRect(cx - w, ct, 2 * w, cb - ct);
      c.fillStyle = 'rgba(36,48,74,0.18)'; c.fillRect(cx + w * 0.3, ct, w * 0.7, cb - ct);
    }
    // the entablature and its balustrade
    cyl(c, 23.5, zt, zt + 3.5, STONE);
    c.fillStyle = 'rgba(36,48,74,0.55)';
    for (let k = 0; k < 56; k++) { const a = Math.PI + (k + 0.5) / 56 * Math.PI, [bx, by] = C(Math.cos(a) * 23.5 * E, Math.sin(a) * 23.5 * E, zt + 3.5); c.fillRect(bx - 0.6, by - 0.5, 1.3, 3.2); }
  }, { t: 9.0, d: 0.9, reveal: 'rise', ease: 'inOut' });
  const za = zt + 3.5, zd = za + 7 * E; // the attic's foot; the shell's foot
  p.group('capitol', domeBox, (c) => {
    cyl(c, 19, za, zd, STONE);
    // the attic's pilasters and its windows
    c.fillStyle = NAVY;
    for (let k = 0; k < 16; k++) {
      const a = Math.PI + (k + 0.5) / 16 * Math.PI, sw = Math.abs(Math.sin(a));
      const [wx, wy] = C(Math.cos(a) * 19 * E, Math.sin(a) * 19 * E, za + 2.5), [, wt] = C(Math.cos(a) * 19 * E, Math.sin(a) * 19 * E, za + 7);
      c.fillRect(wx - 1.8 * sw - 0.4, wt, 3.6 * sw + 0.8, wy - wt);
    }
    c.fillStyle = 'rgba(36,48,74,0.22)'; const [ax] = C(19 * E * 0.35, 0, za); const [, ay0] = C(0, -19 * E, za), [, ay1] = C(0, -19 * E, zd);
    c.fillRect(ax, ay1 - 30, 19 * E * CK, ay0 - ay1 + 30);
  }, { t: 9.5, d: 0.6, reveal: 'rise' });
  // the shell: an ellipsoid a little taller than round, drawn by its outline
  const DR = 16 * E, DH = 25 * E;
  const outline = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30, rr = DR * Math.cos(t * Math.PI / 2), zz = zd + DH * Math.sin(t * Math.PI / 2); const [cx, cy] = C(0, 0, zz); outline.push([cx - rr * CK, cy, cx + rr * CK]); }
  const shellPath = (c, dx = 0, dy = 0) => {
    c.beginPath();
    const [, by] = C(0, 0, zd), [bcx] = C(0, 0, zd);
    c.moveTo(bcx - DR * CK + dx, by + dy);
    for (const [l, y] of outline) c.lineTo(l + dx, y + dy);
    for (let i = outline.length - 1; i >= 0; i--) c.lineTo(outline[i][2] + dx, outline[i][1] + dy);
    c.ellipse(bcx + dx, by + dy, DR * CK, DR * CK * C1, 0, 0, Math.PI);
    c.closePath();
  };
  p.group('capitol', domeBox, (c) => {
    c.save();
    c.fillStyle = CREAM; shellPath(c); c.fill();
    shellPath(c); c.clip();
    const [cx0, cy0] = C(0, 0, zd);
    // the shade on the right in flat steps, the dot screen over the deepest
    c.fillStyle = '#e2d7ba'; c.fillRect(cx0 + DR * CK * 0.15, cy0 - 260, 220, 320);
    c.fillStyle = STONE2; c.fillRect(cx0 + DR * CK * 0.5, cy0 - 260, 220, 320);
    c.fillStyle = c.createPattern(dots(), 'repeat'); c.fillRect(cx0 + DR * CK * 0.72, cy0 - 260, 220, 320);
    // the ribs, from the foot to the eye
    c.strokeStyle = 'rgba(36,48,74,0.45)'; c.lineWidth = 1.3; c.beginPath();
    for (let k = 1; k < 20; k++) {
      const a = Math.PI + (k / 20) * Math.PI;
      for (let i = 0; i <= 16; i++) { const t = i / 16 * 0.88, rr = DR * Math.cos(t * Math.PI / 2), zz = zd + DH * Math.sin(t * Math.PI / 2); const [px, py] = C(Math.cos(a) * rr, Math.sin(a) * rr, zz); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    }
    c.stroke();
    // the rings that band the shell, and its three tiers of small windows
    c.strokeStyle = 'rgba(185,167,130,0.9)'; c.lineWidth = 1.6;
    for (const t of [0.08, 0.33, 0.58]) { const rr = DR * Math.cos(t * Math.PI / 2), [px, py] = C(0, 0, zd + DH * Math.sin(t * Math.PI / 2)); c.beginPath(); c.ellipse(px, py, rr * CK, rr * CK * C1, 0, 0, Math.PI); c.stroke(); }
    c.fillStyle = NAVY;
    for (const [t, n, ww, wh] of [[0.2, 15, 1.5, 4.6], [0.45, 13, 1.2, 3.6], [0.68, 11, 0.9, 2.6]]) {
      const rr = DR * Math.cos(t * Math.PI / 2), zz = zd + DH * Math.sin(t * Math.PI / 2);
      for (let k = 0; k < n; k++) { const a = Math.PI + (k + 0.5) / n * Math.PI, [px, py] = C(Math.cos(a) * rr, Math.sin(a) * rr, zz), sw = Math.abs(Math.sin(a)); c.fillRect(px - ww * sw - 0.5, py - wh * CK * 0.55, 2 * ww * sw + 1, wh * CK * 0.55); }
    }
    c.restore();
    // the key line round the shell, printed off register
    c.strokeStyle = NAVY; c.lineWidth = 1.8; c.lineJoin = 'round'; c.beginPath();
    outline.forEach(([l, y], i) => (i ? c.lineTo(l + 3, y + 2) : c.moveTo(l + 3, y + 2)));
    for (let i = outline.length - 1; i >= 0; i--) c.lineTo(outline[i][2] + 3, outline[i][1] + 2);
    c.stroke();
  }, { t: 9.8, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the lantern: a little ring of columns, its cap, and the bronze figure on top
  const zl = zd + DH - 2;
  const [lx0, ly0] = C(0, 0, zl);
  p.group('capitol', clipBox({ x: lx0 - 50, y: ly0 - 150, w: 100, h: 160 }), (c) => {
    cyl(c, 4.2, zl, zl + 2.5, STONE);
    cyl(c, 3.4, zl + 2.5, zl + 12, '#58637a');
    c.fillStyle = CREAM;
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) / 7 * Math.PI, [lx, lb] = C(Math.cos(a) * 3.6 * E, Math.sin(a) * 3.6 * E, zl + 2.5), [, lt] = C(Math.cos(a) * 3.6 * E, Math.sin(a) * 3.6 * E, zl + 12); c.fillRect(lx - 1.5, lt, 3, lb - lt); }
    cyl(c, 4, zl + 12, zl + 14, STONE);
    const [tx, ty] = C(0, 0, zl + 14);
    c.fillStyle = CREAM; c.beginPath(); c.ellipse(tx, ty, 3.4 * E * CK, 4.6 * E * CK * C2, 0, Math.PI, 0); c.fill();
    c.fillStyle = STONE2; c.beginPath(); c.ellipse(tx, ty, 3.4 * E * CK, 4.6 * E * CK * C2, 0, Math.PI * 1.55, 0); c.lineTo(tx, ty); c.fill();
    // the figure: a dark, crested shape on a little drum
    const fy = ty - 4.6 * E * CK * C2 + 2;
    c.fillStyle = NAVY; c.fillRect(tx - 3.5, fy - 6, 7, 6);
    c.beginPath(); c.moveTo(tx - 5, fy - 6); c.lineTo(tx - 3.5, fy - 26); c.lineTo(tx - 1.5, fy - 34); c.lineTo(tx + 2.5, fy - 33); c.lineTo(tx + 4, fy - 25); c.lineTo(tx + 5.5, fy - 6); c.fill();
  }, { t: 10.4, d: 0.6, reveal: 'rise' });

  // the trees of the Capitol's grounds, last, round its feet and in the corners
  const tr = rng(1800), front = [];
  for (let i = 0; i < 40; i++) {
    const side = i % 4;
    const x = side < 2 ? tr.range(M - 30, 560) : side === 2 ? tr.range(560, 700) : tr.range(1490, W - M + 30);
    const y = side === 2 ? tr.range(1470, 1600) : tr.range(1400, 1610);
    const R = tr.range(24, 44) * (0.7 + (y - 1400) / 600), pal = tr.chance(0.3) ? [PINK2, PINK, PINK3] : [DEEP, DARK, MID];
    // a crown is a heap of rounded clumps
    const clumps = [[x, y, R * 0.75, pal]];
    for (let k = 0; k < 5; k++) { const a = -Math.PI * (0.1 + 0.8 * k / 4) + tr.range(-0.2, 0.2); clumps.push([x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.5 + R * 0.25, R * tr.range(0.45, 0.6), pal]); }
    front.push([x, y, clumps]);
  }
  front.sort((a, b) => a[1] - b[1]);
  for (let pass = 0; pass < 2; pass++) {
    const set = front.filter((_, i) => i % 2 === pass);
    p.group('front', clipBox({ x: M - 60, y: 1300, w: W, h: 300 }), (c) => {
      printRun(c, set.flatMap(([, , clumps]) => clumps.map((t) => ({ tree: t }))));
    }, { t: 10.6 + pass * 0.35, d: 0.6, reveal: 'pop' });
  }
  // people on the plaza and the Mall's walks: tiny marks, printed at once
  const ppl = [], pr = rng(1801);
  for (let i = 0; i < 220; i++) {
    const X = pr.range(0.4, 3.4), Y = pr.chance(0.5) ? pr.pick([0.076, -0.076, 0.149, -0.149]) + pr.range(-0.004, 0.004) : pr.range(-0.02, 0.02);
    if (X > 1.96 && X < 2.62 && Math.abs(Y) > 0.03) continue;
    if (X > 2.78 && X < 3.42 && Math.abs(Y) < 0.042) continue;
    const [x, y] = P(X, Y), h = Math.max(1.4, S(X, Y) * 0.0042);
    ppl.push([x, y, h, pr.pick([NAVY, VERM, OCHRE, CREAM, PINK2])]);
  }
  p.group('near', clipBox({ x: M, y: 700, w: W - 2 * M, h: PB - 700 }), (c) => {
    for (const [x, y, h, col] of ppl) { c.fillStyle = col; c.fillRect(x - h * 0.22, y - h, h * 0.44, h); }
  }, { t: 7.3, d: 0.5, reveal: 'fade' });
  const crowd = [];
  for (let i = 0; i < 70; i++) { const [x, y] = C(pr.range(-130, 150), pr.range(-125, -66)); crowd.push([x, y, pr.pick([NAVY, VERM, OCHRE, PINK2, SLATE2])]); }
  p.group('capitol', clipBox(boxOf(crowd.map(([x, y]) => [x, y]), 12)), (c) => {
    for (const [x, y, col] of crowd) { c.fillStyle = col; c.fillRect(x - 1.6, y - 8, 3.2, 8); c.fillStyle = '#e8c4a0'; c.fillRect(x - 1.2, y - 10.5, 2.4, 2.4); }
  }, { t: 10.9, d: 0.5, reveal: 'fade' });
}

// ================================================================ what moves: flags, a flock, petals, a plane, boats
function lives(p) {
  const r = rng(99);
  // the flags round the Monument stir in the wind
  p.live('live', {
    t: 8.8, d: 0.8,
    draw: (c, time) => {
      const h = MONF.h, fw = 4.6, fh = 2.8;
      c.fillStyle = VERM; c.beginPath();
      for (let i = 0; i < MONF.poles.length; i++) {
        const [x, y] = MONF.poles[i], w = Math.sin(time * 6 + i * 0.7) * fh * 0.25, top = y - h;
        c.moveTo(x, top); c.quadraticCurveTo(x + fw * 0.5, top + w, x + fw, top + w * 0.4); c.lineTo(x + fw, top + fh + w * 0.4); c.quadraticCurveTo(x + fw * 0.5, top + fh + w, x, top + fh);
      }
      c.fill();
      c.fillStyle = NAVY; c.beginPath();
      for (let i = 0; i < MONF.poles.length; i++) { const [x, y] = MONF.poles[i]; c.rect(x, y - h, 2, 1.5); }
      c.fill();
    },
  });
  // a flock of starlings wheeling over the river
  const birds = [];
  for (let i = 0; i < 18; i++) birds.push([r.range(-120, 140), r.range(-40, 40), r.range(0.7, 1.15), r() * 6]);
  p.live('live', {
    t: 10.0, d: 1.0,
    draw: (c, time) => {
      const k = time - 10, ox = 1180 - k * 34, oy = 420 - k * 5 + Math.sin(k * 0.4) * 20;
      c.strokeStyle = NAVY; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (const [dx, dy, s, ph] of birds) {
        const x = ox + dx + Math.sin(k * 0.8 + ph) * 16, y = oy + dy + Math.cos(k * 0.9 + ph) * 9, f = Math.sin(k * 8 + ph) * 4 * s;
        c.moveTo(x - 7 * s, y - f); c.lineTo(x, y + 1.5); c.lineTo(x + 7 * s, y - f);
      }
      c.stroke();
    },
  });
  // a twin-engined airliner coming down the river to the airport, off to the left
  p.live('live', {
    t: 10.3, d: 1.0,
    draw: (c, time) => {
      const k = time - 10.3, x = 1280 - k * 40, y = 170 + k * 7;
      c.save(); c.translate(x, y); c.rotate(0.06);
      c.fillStyle = CREAM; c.beginPath(); c.ellipse(0, 0, 36, 5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-6, 0); c.lineTo(8, 22); c.lineTo(14, 22); c.lineTo(8, 0); c.moveTo(-6, 0); c.lineTo(8, -20); c.lineTo(14, -20); c.lineTo(8, 0); c.fill();
      c.beginPath(); c.moveTo(26, -2); c.lineTo(36, -16); c.lineTo(40, -15); c.lineTo(36, 0); c.fill();
      c.fillStyle = VERM; c.fillRect(-30, -1, 58, 2);
      c.fillStyle = NAVY; c.fillRect(3, 10, 6, 3); c.fillRect(3, -13, 6, 3);
      c.restore();
    },
  });
  // petals drifting over the left of the picture
  const pet = [];
  for (let i = 0; i < 40; i++) pet.push([r.range(M, 820), r.range(0, 1000), r.range(14, 28), r() * 6, r.range(2.6, 5)]);
  p.live('live', {
    t: 10.6, d: 1.0,
    draw: (c, time) => {
      const k = time - 10.6;
      c.fillStyle = '#f6c3c8'; c.beginPath();
      for (const [x0, y0, sp, ph, s] of pet) {
        const y = 520 + ((y0 + k * sp * 2) % 1000), x = x0 + Math.sin(k * 0.8 + ph) * 30 + k * 6, a = k * 1.3 + ph;
        c.moveTo(x + s, y); c.ellipse(x, y, s, s * 0.5, a, 0, Math.PI * 2);
      }
      c.fill();
    },
  });
  // a rowing eight on the Potomac, and a sightseeing boat by the Lincoln Memorial
  p.live('live', {
    t: 9.6, d: 1.0,
    draw: (c, time) => {
      const k = time - 9.6;
      let [x, y] = P(4.55 - k * 0.012, 1.05 - k * 0.03);
      c.fillStyle = NAVY; c.fillRect(x - 16, y - 1.2, 32, 2.4);
      c.strokeStyle = NAVY; c.lineWidth = 0.9; c.beginPath();
      const sw = Math.sin(k * 5) * 2.5;
      for (let i = -3; i <= 3; i++) { c.moveTo(x + i * 4, y - 1); c.lineTo(x + i * 4 + sw, y + 4); }
      c.stroke();
      c.strokeStyle = 'rgba(246,238,219,0.8)'; c.beginPath(); c.moveTo(x + 18, y); c.lineTo(x + 40, y + 1); c.stroke();
      [x, y] = P(4.0 + k * 0.004, -0.75 + k * 0.012);
      c.fillStyle = CREAM; c.beginPath(); c.moveTo(x - 20, y - 6); c.lineTo(x + 22, y - 6); c.lineTo(x + 16, y + 2); c.lineTo(x - 18, y + 2); c.fill();
      c.fillStyle = VERM; c.fillRect(x - 12, y - 12, 22, 6);
      c.fillStyle = NAVY; c.fillRect(x - 10, y - 10, 18, 1.6);
    },
  });
}

// a freight train along the cutting, its engine leading, a plume of smoke
function train(p) {
  const pts = RAIL.map(([X, Y]) => [...P(X, Y + 0.008), S(X, Y)]), cum = [0];
  for (let i = 1; i < RAIL.length; i++) cum.push(cum[i - 1] + Math.hypot(RAIL[i][0] - RAIL[i - 1][0], RAIL[i][1] - RAIL[i - 1][1]));
  const at = (d) => {
    let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const t = clamp((d - cum[i - 1]) / (cum[i] - cum[i - 1])), a = pts[i - 1], b = pts[i];
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  };
  const cars = [NAVY, '#7a5a3c', VERM, '#7a5a3c', OCHRE, '#7a5a3c', SLATE2, VERM];
  p.live('live', {
    t: 9.9, d: 0.8,
    draw: (c, time) => {
      const L = cum[cum.length - 1], head = 0.3 + (((time - 9.9) * 0.02) % (L + 0.1)); // kilometers along the line, coming toward the Capitol
      for (let k = 0; k < cars.length; k++) {
        const d = L - head + k * 0.028;
        if (d < 0.01 || d > L - 0.03) continue;
        const [x0, y0, sc] = at(d), [x1, y1] = at(d + 0.024), h = sc * 0.009;
        c.fillStyle = cars[k]; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y1 - h); c.lineTo(x0, y0 - h); c.fill();
        if (k === 0) { c.fillStyle = 'rgba(246,238,219,0.85)'; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x0 + 4 + j * 5, y0 - h - 4 - j * 3, 3 + j * 1.2, 0, Math.PI * 2); c.fill(); } }
      }
    },
  });
}

// ================================================================ the name, on its band of deep green
function title(p) {
  // the picture's edge: a navy rule
  p.group('title', { x: M - 4, y: M - 4, w: W - 2 * M + 8, h: PB - M + 8 }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 3; c.strokeRect(M, M, W - 2 * M, PB - M);
  }, { t: 0.3, d: 0.9, reveal: 'fade' });
  const B0 = PB + 18, B1 = 1880;
  p.group('title', { x: M - 2, y: B0 - 2, w: W - 2 * M + 4, h: B1 - B0 + 4 }, (c) => {
    c.fillStyle = DEEP; c.fillRect(M, B0, W - 2 * M, B1 - B0);
    c.save(); c.beginPath(); c.rect(M, B0, W - 2 * M, B1 - B0); c.clip(); speck(c, { x: M, y: B0, w: W - 2 * M, h: B1 - B0 }); c.restore();
  }, { t: 10.8, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the name: pink printed under, a few pixels off; cream over it
  const y = 1846;
  const o = { size: 300, family: 'Antonio', weight: 700, align: 'center', fit: W - 2 * M - 70, track: 0.05, gap: 0.1, d: 0.6, reveal: 'rise' };
  p.type('title', 'WASHINGTON', W / 2 + 7, y + 5, { ...o, color: PINK2, t: 11.1 });
  p.type('title', 'WASHINGTON', W / 2, y, { ...o, color: CREAM, t: 11.2 });
  p.type('title', "THE NATION'S CAPITAL · CHERRY BLOSSOM TIME", W / 2, 1930, { size: 32, family: 'Antonio', weight: 400, color: NAVY, align: 'center', track: 0.36, t: 12.6, gap: 0.02, d: 0.35, reveal: 'fade' });
  // the printer's marks in the margins: register crosses and a strip of the inks used
  p.group('title', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 1.2;
    for (const [x, y0] of [[M / 2, 820], [W - M / 2, 820]]) {
      c.beginPath(); c.arc(x, y0, 9, 0, Math.PI * 2); c.moveTo(x - 15, y0); c.lineTo(x + 15, y0); c.moveTo(x, y0 - 15); c.lineTo(x, y0 + 15); c.stroke();
    }
    const inks = [NAVY, DEEP, MID, LAWN, RIVER, SKY[1], PINK, VERM, OCHRE, STONE2];
    inks.forEach((col, i) => { c.fillStyle = col; c.fillRect(M + i * 18, 1962, 14, 10); });
  }, { t: 13.0, d: 0.6, reveal: 'fade' });
}
