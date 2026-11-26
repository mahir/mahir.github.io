// Lisbon: an azulejo panel, painted in cobalt on white glaze and set tile by
// tile. A yellow tram climbs a steep street of tiled facades with iron
// balconies and laundry; behind it Alfama tumbles down from the Castelo de São
// Jorge past the Sé and the dome of the Panteão Nacional to the Tagus, where
// the 25 de Abril bridge crosses far off. A baroque frame of acanthus scrolls,
// a shell crest and a cartouche with the name. The joints between the tiles
// run over everything.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, cloudPuffs, drawCloud, cloudBox } from '../kit.js';

const GLAZE = '#f3f0e7';
const W1 = '#e1e8f2', W2 = '#bccbe6', W3 = '#86a0d2', W4 = '#4766b0', INK = '#1d2d7a';
const INK2 = 'rgba(29,45,122,.55)';
const YEL = '#efb62c', YEL_L = '#f6d36a', YEL_D = '#c98a14', OCH = '#d69a2b';

export const city = {
  id: 'lisbon', name: 'Lisbon', wall: '#18275a',
  alt: 'An azulejo tile panel painted in cobalt blue: a yellow tram climbing a steep street of tiled facades with iron balconies and laundry, the roofs of Alfama falling from the Castelo de São Jorge past the Sé cathedral and the dome of the Panteão Nacional to the Tagus, and the 25 de Abril bridge far off, in a baroque frame of acanthus scrolls with the name in a cartouche',
  google: 'family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,800;1,9..144,400',
  fonts: [['800 200px "Fraunces"', 'LISBOA'], ['italic 400 40px "Fraunces"', 'a cidade das sete colinas'], ['500 26px "Fraunces"', 'ALFAMA · CASTELO · TEJO'], ['800 30px "Fraunces"', '28E']],
  build,
};

// the opening of the frame: straight sides, a baroque top that rises in the middle
const X0 = 170, X1 = 1430, Y0 = 232, YB = 1500;
const OPEN = (() => {
  const pts = [[X0, YB], [X0, Y0]];
  // left shoulder, an S-curve up to the crown, and back down
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, x = lerp(X0, X1, t);
    const k = Math.abs(t - 0.5) * 2; // 1 at the sides, 0 in the middle
    let y = Y0;
    if (k < 0.42) { const u = k / 0.42; y = Y0 - 72 * (1 - u * u * (3 - 2 * u)); }
    pts.push([x, y]);
  }
  pts.push([X1, YB]);
  return pts;
})();
const topAt = (x) => { const t = clamp((x - X0) / (X1 - X0)); const k = Math.abs(t - 0.5) * 2; if (k >= 0.42) return Y0; const u = k / 0.42; return Y0 - 72 * (1 - u * u * (3 - 2 * u)); };

// the street: its foot runs downhill to the right
const SLOPE = 0.158, ST0 = 1150;
const streetY = (x) => ST0 + (x - X0) * SLOPE;
// the hill of Alfama: from the castle down to the river
const HILL = [[X0, 470], [300, 412], [470, 398], [600, 452], [760, 548], [920, 640], [1060, 712], [1200, 790], [1320, 850], [X1, 882]];
const RIVER = 712;

function build() {
  const p = new Plate({ paper: GLAZE, seed: 1755 });
  const r = p.r;
  p.clip = { x: X0, y: Y0 - 80, w: X1 - X0, h: YB - Y0 + 80 };
  p.stack('sky', 'far', 'river', 'bridge', 'town', 'facades', 'street', 'tram', 'life', 'mask', 'frame', 'title', 'tiles');
  for (const n of ['mask', 'frame', 'title', 'tiles']) p.layer(n, { clip: false });

  tiles(p, r);
  frame(p, r);
  sky(p, r);
  river(p, r);
  bridge(p, r);
  town(p, r);
  facades(p, r);
  street(p, r);
  tram(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// ================================================================ brush helpers
function wob(r, pts, amt = 1.2, step = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([lerp(ax, bx, k / n) + r.range(-amt, amt), lerp(ay, by, k / n) + r.range(-amt, amt)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function path(c, pts, close) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
function curve(ctrl, step = 8) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const [ax, ay] = ctrl[i], [bx, by] = ctrl[i + 1];
    for (let x = ax; x < bx; x += step) { const t = (x - ax) / (bx - ax), e = t * t * (3 - 2 * t); out.push([x, lerp(ay, by, e)]); }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
const hillPts = curve(HILL, 6);
const hillAt = (x) => { for (let i = 1; i < hillPts.length; i++) if (hillPts[i][0] >= x) { const [ax, ay] = hillPts[i - 1], [bx, by] = hillPts[i]; return lerp(ay, by, (x - ax) / (bx - ax || 1)); } return hillPts[hillPts.length - 1][1]; };

// an acanthus leaf: a curling spine with a lobed edge on one side, and its curl
function leaf(x, y, ang, len, wid, bend, lobes = 4) {
  const n = 26, spine = [];
  let a = ang, px = x, py = y;
  for (let i = 0; i <= n; i++) {
    spine.push([px, py]);
    const t = i / n;
    a += bend * (0.4 + 1.6 * t * t) / n;
    px += Math.cos(a) * len / n; py += Math.sin(a) * len / n;
  }
  const side = Math.sign(bend) || 1;
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, [sx, sy] = spine[i];
    const [nx, ny] = i < n ? spine[i + 1] : spine[i];
    const [qx, qy] = i > 0 ? spine[i - 1] : spine[i];
    let dx = nx - qx, dy = ny - qy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const env = Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.8;
    const lobe = 0.55 + 0.45 * Math.abs(Math.sin(t * lobes * Math.PI));
    const w0 = wid * env * lobe;
    outer.push([sx - dy * w0 * side, sy + dx * w0 * side]);
    inner.push([sx + dy * w0 * 0.35 * side, sy - dx * w0 * 0.35 * side]);
  }
  return { spine, shape: [...outer, ...inner.reverse()] };
}
function drawLeaf(c, lf, fill = W3, line = INK) {
  c.fillStyle = fill; path(c, lf.shape, true); c.fill();
  c.strokeStyle = line; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
  c.lineWidth = 1.4; path(c, lf.spine); c.stroke();
}
// a spiral curl, a volute
function spiral(x, y, r0, turns, a0 = 0, dir = 1) {
  const pts = [], n = Math.round(turns * 36);
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, rr = r0 * (1 - t * 0.85); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  return pts;
}

// ================================================================ the tiles: glaze, joints, chips
function tiles(p, r) {
  const T = 100;
  const tint = [], chips = [], craze = [];
  for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) {
    tint.push([x, y, r.range(-1, 1)]);
    if (r.chance(0.18)) { const cx = x + (r.chance(0.5) ? 0 : T), cy = y + (r.chance(0.5) ? 0 : T); chips.push([cx + r.range(-3, 3), cy + r.range(-3, 3), r.range(3, 7)]); }
    if (r.chance(0.22)) {
      let px = x + r.range(10, 90), py = y + r.range(10, 90); const l = [[px, py]];
      for (let k = 0; k < 4; k++) { px += r.range(-14, 14); py += r.range(-14, 14); l.push([clamp(px, x + 2, x + T - 2), clamp(py, y + 2, y + T - 2)]); }
      craze.push(l);
    }
  }
  p.group('tiles', { x: 0, y: 0, w: W, h: H }, (c) => {
    // each tile fired a little differently
    for (const [x, y, k] of tint) {
      c.fillStyle = k > 0 ? `rgba(255,255,255,${(0.12 * k).toFixed(3)})` : `rgba(120,140,170,${(-0.05 * k).toFixed(3)})`;
      c.fillRect(x + 1, y + 1, T - 2, T - 2);
    }
    // a sheen along the upper left of each glaze
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2;
    c.beginPath(); for (const [x, y] of tint) { c.moveTo(x + 4, y + T - 8); c.lineTo(x + 4, y + 4); c.lineTo(x + T - 8, y + 4); } c.stroke();
    // the joints
    c.strokeStyle = 'rgba(118,122,132,.55)'; c.lineWidth = 2.6;
    c.beginPath();
    for (let x = T; x < W; x += T) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = T; y < H; y += T) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    c.strokeStyle = 'rgba(80,84,96,.35)'; c.lineWidth = 0.8;
    c.beginPath();
    for (let x = T; x < W; x += T) { c.moveTo(x + 1.4, 0); c.lineTo(x + 1.4, H); }
    for (let y = T; y < H; y += T) { c.moveTo(0, y + 1.4); c.lineTo(W, y + 1.4); }
    c.stroke();
    // fine crazing in the glaze, and chipped corners where the white body shows
    c.strokeStyle = 'rgba(90,100,120,.22)'; c.lineWidth = 0.7;
    c.beginPath(); for (const l of craze) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
    c.fillStyle = '#e9e4d6';
    for (const [x, y, s] of chips) { c.beginPath(); c.ellipse(x, y, s, s * 0.7, x, 0, Math.PI * 2); c.fill(); }
  }, { t: 0, d: 1.2, reveal: 'fade' });
}

// ================================================================ the frame
function framePath(c) { OPEN.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function frame(p, r) {
  // the glaze outside the opening, laid first so the view never shows past it
  p.mark('mask', { t: 0, d: 0.05, reveal: 'none', box: { x: 0, y: 0, w: W, h: H }, draw: (c) => {
    c.fillStyle = GLAZE; c.beginPath(); c.rect(0, 0, W, H); framePath(c); c.fill('evenodd');
  } });
  // the outer border: a dark band and a pale one, at the sheet's edge
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 16; c.strokeRect(26, 26, W - 52, H - 52);
    c.strokeStyle = W3; c.lineWidth = 6; c.strokeRect(46, 46, W - 92, H - 92);
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(54, 54, W - 108, H - 108);
  }, { t: 0.4, d: 1.0, reveal: 'iris', ease: 'inOut' });

  // the rinceau up each side: a waving stem, a leaf and a curl in each bay
  const sides = [];
  for (const cx of [108, W - 108]) {
    const dir = cx < W / 2 ? 1 : -1;
    const stem = [];
    for (let y = 1830; y >= 330; y -= 6) stem.push([cx + 20 * Math.sin((y - 330) / 190 * Math.PI), y]);
    const leaves = [], curls = [], buds = [];
    for (let k = 0, y = 1790; y > 380; y -= 190, k++) {
      const s = k % 2 ? 1 : -1;
      const sx = cx + 20 * Math.sin((y - 330) / 190 * Math.PI);
      leaves.push(leaf(sx, y, -Math.PI / 2 + s * 0.7, 140, 34, s * 2.8, 5));
      leaves.push(leaf(sx, y - 20, -Math.PI / 2 - s * 0.5, 84, 18, -s * 1.8, 3));
      curls.push(spiral(sx + s * 36, y - 110, 18, 1.4, s > 0 ? Math.PI : 0, s));
      buds.push([sx - s * 30, y - 120, 7]);
    }
    sides.push({ cx, dir, stem, leaves, curls, buds });
  }
  sides.forEach((sd, i) => {
    p.group('frame', { x: sd.cx - 60, y: 160, w: 120, h: 1700 }, (c) => {
      c.fillStyle = W1; c.fillRect(sd.cx - 46, 170, 92, 1660);
      c.strokeStyle = W3; c.lineWidth = 2; c.strokeRect(sd.cx - 46, 170, 92, 1660);
    }, { t: 0.6 + i * 0.1, d: 1.0, reveal: 'fall', ease: 'inOut' });
    p.pen('frame', sd.stem, INK, 4, { t: 0.9 + i * 0.15, d: 2.0, ease: 'inOut' });
    p.group('frame', { x: sd.cx - 90, y: 300, w: 180, h: 1560 }, (c) => {
      for (const lf of sd.leaves) drawLeaf(c, lf, W3);
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round';
      for (const cu of sd.curls) { path(c, cu); c.stroke(); }
      for (const [x, y, rr] of sd.buds) {
        c.fillStyle = W4; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
        c.fillStyle = W2; c.beginPath(); c.arc(x - 2, y - 2, rr * 0.45, 0, Math.PI * 2); c.fill();
      }
    }, { t: 1.6 + i * 0.15, d: 1.6, reveal: 'rise', ease: 'inOut' });
  });

  // the molding round the opening: a dark roll, a pale band and a row of pearls
  const pearls = [];
  for (let i = 1; i < OPEN.length; i++) {
    const [ax, ay] = OPEN[i - 1], [bx, by] = OPEN[i];
    const L = Math.hypot(bx - ax, by - ay), n = Math.floor(L / 24);
    for (let k = 0; k < n; k++) pearls.push([lerp(ax, bx, k / n), lerp(ay, by, k / n)]);
  }
  const outline = [...OPEN.slice(1), [X1, YB], [X0, YB], [X0, Y0]];
  p.group('frame', { x: X0 - 60, y: Y0 - 140, w: X1 - X0 + 120, h: YB - Y0 + 200 }, (c) => {
    c.lineJoin = 'round';
    c.strokeStyle = INK; c.lineWidth = 58; path(c, outline); c.stroke();
    c.strokeStyle = W2; c.lineWidth = 46; path(c, outline); c.stroke();
    c.strokeStyle = W4; c.lineWidth = 14; path(c, outline); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; path(c, outline); c.stroke();
    c.fillStyle = GLAZE;
    for (const [x, y] of pearls) { c.beginPath(); c.arc(x, y, 4.6, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.2, d: 1.5, reveal: 'iris', ease: 'inOut' });

  // the crest: a scallop shell over the crown, scrolls either side
  const cx = W / 2, cy = 132;
  const ribs = [];
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (1 + i / 12); ribs.push([[cx, cy + 34], [cx + Math.cos(a) * 92, cy + 34 + Math.sin(a) * 84]]); }
  const crestL = [leaf(cx - 96, cy + 34, Math.PI, 210, 34, -2.4, 5), leaf(cx - 80, cy + 50, Math.PI + 0.3, 120, 18, 1.6, 3)];
  const crestR = [leaf(cx + 96, cy + 34, 0, 210, 34, 2.4, 5), leaf(cx + 80, cy + 50, -0.3, 120, 18, -1.6, 3)];
  p.group('frame', { x: cx - 360, y: 20, w: 720, h: 210 }, (c) => {
    for (const lf of [...crestL, ...crestR]) drawLeaf(c, lf, W3);
    c.fillStyle = W2; c.strokeStyle = INK; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(cx - 92, cy + 34);
    for (let i = 0; i <= 24; i++) { const a = Math.PI * (1 + i / 24); const bump = 1 + 0.05 * Math.abs(Math.sin(i * Math.PI / 2)); c.lineTo(cx + Math.cos(a) * 92 * bump, cy + 34 + Math.sin(a) * 84 * bump); }
    c.closePath(); c.fill(); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); for (const [a, b] of ribs) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    c.fillStyle = W4; c.beginPath(); c.ellipse(cx, cy + 40, 30, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  }, { t: 2.2, d: 1.2, reveal: 'pop', ease: 'back' });
  // scrolls along the top, from the crest to the corners
  for (const s of [-1, 1]) {
    const lv = [];
    const stem = [];
    for (let k = 0; k <= 60; k++) { const t = k / 60; stem.push([cx + s * (250 + t * 420), 118 + 22 * Math.sin(t * Math.PI * 3)]); }
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.25) / 3, x = cx + s * (250 + t * 420), y = 118 + 22 * Math.sin(t * Math.PI * 3);
      lv.push(leaf(x, y, (s > 0 ? 0 : Math.PI) + (k % 2 ? -0.5 : 0.5) * s, 130, 28, s * (k % 2 ? 2.4 : -2.4), 4));
    }
    const cu = [spiral(cx + s * 460, 86, 20, 1.5, 0, s), spiral(cx + s * 600, 150, 16, 1.4, Math.PI, -s), spiral(cx + s * 680, 112, 22, 1.6, 0, s)];
    p.group('frame', { x: s > 0 ? cx + 220 : 100, y: 30, w: 580, h: 200 }, (c) => {
      for (const lf of lv) drawLeaf(c, lf, W2);
      c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = 'round'; path(c, stem); c.stroke();
      c.lineWidth = 3; for (const q of cu) { path(c, q); c.stroke(); }
    }, { t: 2.6, d: 1.2, reveal: s > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  }
  // the corners: a rosette in a square
  const corners = [[108, 108], [W - 108, 108], [108, H - 108], [W - 108, H - 108]];
  corners.forEach(([x, y], i) => {
    p.group('frame', { x: x - 70, y: y - 70, w: 140, h: 140 }, (c) => {
      c.fillStyle = W1; c.strokeStyle = INK; c.lineWidth = 2.4;
      c.fillRect(x - 56, y - 56, 112, 112); c.strokeRect(x - 56, y - 56, 112, 112);
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        c.fillStyle = k % 2 ? W3 : W4;
        c.beginPath(); c.ellipse(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 22, 10, a, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      c.fillStyle = YEL; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fill(); c.stroke();
    }, { t: 0.8 + i * 0.12, d: 0.8, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the sky
function sky(p, r) {
  // long wash strokes laid flat toward the horizon
  const bands = [];
  for (let i = 0; i < 9; i++) {
    const y = 470 + i * 26 + r.range(-6, 6), x0 = X0 + r.range(0, 300), x1 = X1 - r.range(0, 200);
    const top = [], bot = [];
    for (let x = x0; x <= x1; x += 20) { top.push([x, y + r.range(-2, 2)]); bot.push([x, y + 9 + i * 0.8 + r.range(-2, 2)]); }
    bands.push([...top, ...bot.reverse()]);
  }
  p.group('sky', { x: X0, y: 440, w: X1 - X0, h: 300 }, (c) => {
    c.fillStyle = 'rgba(134,160,210,.22)';
    for (const b of bands) { path(c, b, true); c.fill(); }
  }, { t: 1.4, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // clouds: cobalt outline, pale wash, shading lines
  const cl = [[880, 330, 300, 90], [1150, 440, 240, 70], [420, 300, 220, 64], [1260, 260, 170, 52], [620, 420, 160, 44]];
  cl.forEach(([x, y, w, h], i) => {
    const cs = cloudPuffs(rng(40 + i), x, y, w, h);
    p.group('sky', cloudBox(cs), (c) => drawCloud(c, cs, { fill: GLAZE, line: INK, lw: 1.6, hatch: W3, hlw: 1.4, step: 6, cover: 0.5 }),
      { t: 1.8 + i * 0.25, d: 0.9, reveal: 'fade' });
  });
}

// ================================================================ the far bank and the Tagus
function river(p, r) {
  const far = wob(r, curve([[X0, 700], [400, 690], [700, 698], [900, 680], [1100, 690], [1300, 676], [X1, 688]], 14), 1.2, 14);
  const dots = [];
  for (let i = 0; i < 70; i++) { const x = r.range(X0, X1); dots.push([x, 696 + r.range(0, 12), r.range(2, 5)]); }
  p.group('far', { x: X0, y: 650, w: X1 - X0, h: 80 }, (c) => {
    c.fillStyle = W2; path(c, [...far, [X1, RIVER + 4], [X0, RIVER + 4]], true); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; path(c, far); c.stroke();
    c.fillStyle = W4; for (const [x, y, s] of dots) c.fillRect(x, y, s, s * 0.7);
  }, { t: 2.0, d: 1.0, reveal: 'rise' });
  // the water: a pale wash and rows of short strokes
  const waves = [];
  for (let y = RIVER + 10; y < 900; y += 9) {
    const n = Math.round(14 + (y - RIVER) * 0.12);
    for (let i = 0; i < n; i++) {
      const x = r.range(X0, X1), L = 8 + (y - RIVER) * 0.1 + r.range(0, 10);
      waves.push([[x, y], [x + L * 0.5, y - 2], [x + L, y]]);
    }
  }
  p.group('river', { x: X0, y: RIVER, w: X1 - X0, h: 200 }, (c) => {
    c.fillStyle = W1; c.fillRect(X0, RIVER, X1 - X0, 200);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(X0, RIVER); c.lineTo(X1, RIVER); c.stroke();
  }, { t: 2.3, d: 0.8, reveal: 'fall' });
  p.strokes('river', waves, W4, 1.4, { t: 2.6, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
}

// ================================================================ the 25 de Abril bridge, far off
function bridge(p, r) {
  const deck = (x) => 742 - (x - 1000) * 0.03;
  const towers = [[1150, 150], [1380, 170]];
  const cable = [];
  const top = (k) => [towers[k][0], deck(towers[k][0]) - towers[k][1]];
  const [ax, ay] = top(0), [bx, by] = top(1);
  // from behind the hill to the first tower, the main span, and on out of the frame
  for (let x = 960; x <= ax; x += 6) { const t = (x - 960) / (ax - 960); cable.push([x, lerp(deck(960) - 12, ay, t) + 22 * Math.sin(t * Math.PI)]); }
  for (let x = ax; x <= bx; x += 6) { const t = (x - ax) / (bx - ax); cable.push([x, lerp(ay, by, t) + 118 * Math.sin(t * Math.PI)]); }
  for (let x = bx; x <= X1 + 20; x += 6) { const t = (x - bx) / 160; cable.push([x, by + 60 * t * (2 - t)]); }
  const hangers = [];
  for (const [x, y] of cable) if ((Math.round(x) % 12) === 0 && y < deck(x) - 6) hangers.push([[x, y], [x, deck(x)]]);
  // the truss under the deck
  const truss = [];
  for (let x = 960; x < X1; x += 14) { truss.push([[x, deck(x) + 2], [x + 7, deck(x + 7) + 12], [x + 14, deck(x + 14) + 2]]); }
  p.group('bridge', { x: 940, y: 540, w: 500, h: 240 }, (c) => {
    for (const [x, h] of towers) {
      const y0 = RIVER + 30, y1 = deck(x) - h;
      c.fillStyle = W3; c.strokeStyle = INK; c.lineWidth = 1.4;
      for (const dx of [-9, 9]) { c.fillRect(x + dx - 3.5, y1, 7, y0 - y1); c.strokeRect(x + dx - 3.5, y1, 7, y0 - y1); }
      // portal beams and the crossed bracing between the legs
      c.lineWidth = 1.4; c.beginPath();
      for (const yy of [y1 + 4, y1 + h * 0.45, deck(x) + 14]) { c.moveTo(x - 12, yy); c.lineTo(x + 12, yy); }
      for (let yy = y1 + 8; yy < y0 - 20; yy += 26) { c.moveTo(x - 6, yy); c.lineTo(x + 6, yy + 24); c.moveTo(x + 6, yy); c.lineTo(x - 6, yy + 24); }
      c.stroke();
    }
  }, { t: 2.8, d: 1.0, reveal: 'rise' });
  p.group('bridge', { x: 940, y: 720, w: 500, h: 40 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(960, deck(960)); c.lineTo(X1, deck(X1)); c.stroke();
    c.lineWidth = 1; c.beginPath(); for (const l of truss) { c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); c.lineTo(l[2][0], l[2][1]); } c.stroke();
    c.beginPath(); c.moveTo(960, deck(960) + 12); c.lineTo(X1, deck(X1) + 12); c.stroke();
  }, { t: 3.2, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.pen('bridge', cable, INK, 2, { t: 3.5, d: 1.2 });
  p.strokes('bridge', hangers, INK2, 0.8, { t: 4.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ Alfama: the castle, rows of houses, the Sé, the Panteão
function house(c, h) {
  const { x, y, w, ht, roof, side, wins, bal, tone, sideW } = h;
  // the side wall in shade
  if (sideW) {
    c.fillStyle = W2; poly(c, [[x + w, y], [x + w + sideW, y - sideW * 0.4], [x + w + sideW, y - ht - sideW * 0.4], [x + w, y - ht]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }
  c.fillStyle = tone; c.fillRect(x, y - ht, w, ht);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x, y - ht, w, ht);
  // the roof: a tiled slope seen from a little above
  if (roof) {
    const rh = roof, o = sideW || 4;
    const rp = [[x - 3, y - ht], [x + w + 3, y - ht], [x + w + o, y - ht - rh], [x + o * 0.4, y - ht - rh]];
    c.fillStyle = W3; poly(c, rp); c.fill(); c.stroke();
    c.strokeStyle = W4; c.lineWidth = 0.9; c.beginPath();
    for (let k = 1; k < 4; k++) { const t = k / 4; c.moveTo(lerp(x - 3, x + o * 0.4, t), y - ht - rh * t); c.lineTo(lerp(x + w + 3, x + w + o, t), y - ht - rh * t); }
    c.stroke();
  }
  // windows, one path
  c.fillStyle = INK; c.beginPath();
  for (const [wx, wy, ww, wh] of wins) c.rect(wx, wy, ww, wh);
  c.fill();
  if (bal.length) {
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    for (const [bx, by, bw] of bal) { c.moveTo(bx, by); c.lineTo(bx + bw, by); c.moveTo(bx, by + 5); c.lineTo(bx + bw, by + 5); for (let k = 0; k <= bw; k += 3) { c.moveTo(bx + k, by); c.lineTo(bx + k, by + 5); } }
    c.stroke();
  }
}
function makeHouse(r, x, y, w, ht, s) {
  const wins = [], bal = [];
  const floors = Math.max(1, Math.floor((ht - 6 * s) / (15 * s)));
  const cols = Math.max(1, Math.round(w / (14 * s)));
  const ww = 4.2 * s, wh = 7.5 * s;
  for (let f = 0; f < floors; f++) {
    const wy = y - ht + 6 * s + f * 15 * s;
    for (let k = 0; k < cols; k++) {
      const wx = x + (k + 0.5) * w / cols - ww / 2;
      if (r.chance(0.08)) continue;
      wins.push([wx, wy, ww, wh]);
      if (f > 0 && s > 0.8 && r.chance(0.25)) bal.push([wx - 2, wy + wh - 4, ww + 4]);
    }
  }
  const tone = r.chance(0.2) ? W1 : GLAZE;
  return { x, y, w, ht, roof: r.chance(0.82) ? r.range(7, 12) * s : 0, sideW: r.chance(0.45) ? r.range(5, 10) * s : 0, wins, bal, tone };
}
function town(p, r) {
  const items = [];
  // the hill itself, a pale wash under the houses
  const hillShape = [...hillPts, [X1, 1400], [X0, 1400]];
  items.push({ t: 2.6, layer: 'town', box: boxOf(hillShape, 4), d: 1.0, reveal: 'rise', draw: (c) => {
    c.fillStyle = W1; path(c, hillShape, true); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; path(c, hillPts); c.stroke();
  } });

  // the Castelo de São Jorge: crenellated walls and square towers among pines
  const wallTop = 360, wallFoot = 438;
  const towersC = [[198, 300, 46], [292, 318, 40], [394, 292, 52], [508, 322, 42]];
  const pines = [];
  for (let i = 0; i < 14; i++) pines.push([r.range(X0, 600), r.range(410, 450), r.range(10, 18)]);
  items.push({ t: 3.0, d: 1.2, reveal: 'rise', box: { x: X0, y: 240, w: 460, h: 230 }, draw: (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.4;
    // the curtain wall
    c.fillStyle = W2; c.fillRect(X0, wallTop, 400, wallFoot - wallTop); c.strokeRect(X0, wallTop, 400, wallFoot - wallTop);
    // hatching in the wall's shade
    c.strokeStyle = W4; c.lineWidth = 0.9; c.beginPath();
    for (let x = X0 + 4; x < X0 + 400; x += 5) { c.moveTo(x, wallTop + 14); c.lineTo(x, wallFoot); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.4;
    const merlons = (x0, x1, y) => { c.fillStyle = W2; for (let x = x0; x < x1 - 4; x += 12) { c.fillRect(x, y - 9, 7, 9); c.strokeRect(x, y - 9, 7, 9); } };
    merlons(X0, X0 + 400, wallTop);
    for (const [x, y, w] of towersC) {
      c.fillStyle = GLAZE; c.fillRect(x - w / 2, y, w, wallFoot - y); c.strokeRect(x - w / 2, y, w, wallFoot - y);
      c.fillStyle = W2; c.fillRect(x + w * 0.15, y, w * 0.35, wallFoot - y);
      merlons(x - w / 2, x + w / 2, y);
      c.fillStyle = INK; c.fillRect(x - 3, y + 16, 6, 12); c.fillRect(x - 3, y + 42, 6, 10);
    }
    // a flag on the keep
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(394, 283); c.lineTo(394, 250); c.stroke();
    c.fillStyle = W4; poly(c, [[394, 250], [418, 256], [394, 263]]); c.fill();
  } });
  items.push({ t: 3.7, d: 0.7, reveal: 'fade', box: { x: X0 - 10, y: 380, w: 460, h: 90 }, draw: (c) => {
    for (const [x, y, s] of pines) {
      c.fillStyle = W4; c.beginPath(); c.ellipse(x, y - s, s * 1.4, s * 0.7, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      c.beginPath(); c.moveTo(x, y - s * 0.4); c.lineTo(x, y + 6); c.stroke();
    }
  } });

  // rows of houses down the hill, back to front
  const rows = [];
  let k = 0;
  for (let dy = 22; dy < 900; dy += 26, k++) {
    const s = 0.72 + Math.min(0.6, k * 0.024);
    const row = [];
    let x = X0 - r.range(10, 40);
    while (x < X1 + 10) {
      const w = r.range(30, 62) * s;
      const base = hillAt(x + w / 2) + dy + r.range(-5, 5);
      if (base < streetY(x) - 60 && base > 430) row.push(makeHouse(r, x, base, w, r.range(34, 62) * s, s));
      x += w + r.range(-2, 4);
    }
    // a few trees between the houses
    const trees = [];
    for (let i = 0; i < 2; i++) if (r.chance(0.5)) { const tx = r.range(X0, X1); trees.push([tx, hillAt(tx) + dy - 6, r.range(10, 16) * s]); }
    if (row.length) rows.push({ row, trees, dy });
  }
  rows.forEach(({ row, trees, dy }, i) => {
    let y0 = Infinity, y1 = -Infinity;
    for (const h of row) { y0 = Math.min(y0, h.y - h.ht - 16); y1 = Math.max(y1, h.y + 4); }
    items.push({ t: 3.6 + i * 0.13, d: 0.8, reveal: 'rise', box: { x: X0 - 20, y: y0 - 20, w: X1 - X0 + 40, h: y1 - y0 + 30 }, draw: (c) => {
      for (const [tx, ty, s] of trees) {
        c.fillStyle = W3; c.beginPath(); c.arc(tx, ty - s, s, 0, Math.PI * 2); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      }
      for (const h of row) house(c, h);
    }, base: hillAt(800) + dy });
  });

  // the Sé: two crenellated towers, a rose window and the portal
  const sx = 960, sb = hillAt(960) + 140;
  items.push({ t: 4.9, d: 1.2, reveal: 'rise', box: { x: sx - 110, y: sb - 260, w: 220, h: 270 }, draw: (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.6;
    // the nave between the towers
    c.fillStyle = GLAZE; c.fillRect(sx - 40, sb - 170, 80, 170); c.strokeRect(sx - 40, sb - 170, 80, 170);
    for (const dx of [-70, 70]) {
      const x = sx + dx;
      c.fillStyle = GLAZE; c.fillRect(x - 30, sb - 236, 60, 236); c.strokeRect(x - 30, sb - 236, 60, 236);
      c.fillStyle = W2; c.fillRect(x + 8, sb - 236, 22, 236);
      // merlons
      for (let k = 0; k < 5; k++) { c.fillStyle = W2; c.fillRect(x - 30 + k * 13, sb - 246, 8, 10); c.strokeRect(x - 30 + k * 13, sb - 246, 8, 10); }
      // the belfry openings
      c.fillStyle = INK;
      for (const ox of [-14, 6]) { c.beginPath(); c.moveTo(x + ox, sb - 170); c.lineTo(x + ox, sb - 196); c.arc(x + ox + 4, sb - 196, 4, Math.PI, 0); c.lineTo(x + ox + 8, sb - 170); c.fill(); }
      c.fillRect(x - 3, sb - 120, 6, 16);
      // string courses
      c.beginPath(); c.moveTo(x - 30, sb - 150); c.lineTo(x + 30, sb - 150); c.moveTo(x - 30, sb - 210); c.lineTo(x + 30, sb - 210); c.stroke();
    }
    // the rose window and the round-arched portal
    c.fillStyle = W3; c.beginPath(); c.arc(sx, sb - 118, 18, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.moveTo(sx, sb - 118); c.lineTo(sx + Math.cos(a) * 18, sb - 118 + Math.sin(a) * 18); } c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(sx - 18, sb); c.lineTo(sx - 18, sb - 50); c.arc(sx, sb - 50, 18, Math.PI, 0); c.lineTo(sx + 18, sb); c.fill();
    c.strokeStyle = W4; for (const rr of [24, 30]) { c.beginPath(); c.arc(sx, sb - 50, rr, Math.PI, 0); c.stroke(); }
  }, base: sb - 60 });

  // the Panteão Nacional: a white dome on a drum, with its lantern
  const px = 380, pb = hillAt(380) + 300;
  items.push({ t: 5.6, d: 1.3, reveal: 'rise', box: { x: px - 140, y: pb - 330, w: 280, h: 340 }, draw: (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.6;
    // the body with its corner towers
    c.fillStyle = GLAZE; c.fillRect(px - 120, pb - 120, 240, 120); c.strokeRect(px - 120, pb - 120, 240, 120);
    for (const dx of [-120, 80]) { c.fillStyle = W1; c.fillRect(px + dx, pb - 150, 40, 150); c.strokeRect(px + dx, pb - 150, 40, 150); }
    c.fillStyle = INK; for (let k = 0; k < 4; k++) c.fillRect(px - 54 + k * 32, pb - 92, 10, 30);
    c.beginPath(); for (let k = 0; k < 6; k++) { c.moveTo(px - 70 + k * 28, pb - 50); c.lineTo(px - 70 + k * 28, pb); } c.stroke();
    // the drum
    c.fillStyle = GLAZE; c.fillRect(px - 64, pb - 186, 128, 66); c.strokeRect(px - 64, pb - 186, 128, 66);
    c.beginPath(); for (let k = 0; k <= 8; k++) { c.moveTo(px - 64 + k * 16, pb - 186); c.lineTo(px - 64 + k * 16, pb - 120); } c.stroke();
    // the dome, shaded with curved lines
    c.fillStyle = GLAZE; c.beginPath(); c.moveTo(px - 70, pb - 186); c.bezierCurveTo(px - 70, pb - 260, px - 30, pb - 286, px, pb - 288); c.bezierCurveTo(px + 30, pb - 286, px + 70, pb - 260, px + 70, pb - 186); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = W3; c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 6; k++) { const dx = (k / 6 - 0.5) * 140; c.moveTo(px + dx, pb - 186); c.quadraticCurveTo(px + dx * 0.8, pb - 260, px, pb - 288); }
    c.stroke();
    c.fillStyle = W2; c.beginPath(); c.moveTo(px + 20, pb - 186); c.quadraticCurveTo(px + 50, pb - 250, px + 6, pb - 286); c.bezierCurveTo(px + 30, pb - 286, px + 70, pb - 260, px + 70, pb - 186); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6;
    // the lantern
    c.fillStyle = GLAZE; c.fillRect(px - 10, pb - 318, 20, 30); c.strokeRect(px - 10, pb - 318, 20, 30);
    c.beginPath(); c.arc(px, pb - 318, 10, Math.PI, 0); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(px, pb - 328); c.lineTo(px, pb - 340); c.stroke();
  }, base: pb - 50 });

  items.sort((a, b) => a.t - b.t);
  for (const it of items) p.mark('town', it);
}

// ================================================================ the street of tiled facades
const PATTERNS = ['diamond', 'quatre', 'cross', 'scale', 'stripe'];
function patternPath(c, kind, x0, y0, x1, y1, s) {
  c.beginPath();
  if (kind === 'diamond') {
    for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) { c.moveTo(x + s / 2, y + 2); c.lineTo(x + s - 2, y + s / 2); c.lineTo(x + s / 2, y + s - 2); c.lineTo(x + 2, y + s / 2); c.closePath(); }
  } else if (kind === 'quatre') {
    for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) { const cx = x + s / 2, cy = y + s / 2, q = s * 0.2; for (const [dx, dy] of [[q, 0], [-q, 0], [0, q], [0, -q]]) { c.moveTo(cx + dx + q * 0.9, cy + dy); c.arc(cx + dx, cy + dy, q * 0.9, 0, Math.PI * 2); } }
  } else if (kind === 'cross') {
    for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) { const cx = x + s / 2, cy = y + s / 2, q = s * 0.32; c.rect(cx - q, cy - q * 0.25, 2 * q, q * 0.5); c.rect(cx - q * 0.25, cy - q, q * 0.5, 2 * q); }
  } else if (kind === 'scale') {
    for (let y = y0, k = 0; y < y1; y += s * 0.6, k++) for (let x = x0 - (k % 2) * s / 2; x < x1; x += s) { c.moveTo(x + s, y); c.arc(x + s / 2, y, s / 2, 0, Math.PI); }
  } else {
    for (let x = x0; x < x1; x += s) c.rect(x, y0, s * 0.3, y1 - y0);
  }
}
function facades(p, r) {
  // from the left edge downhill: tall narrow houses, each with its own tiles
  const list = [];
  let x = X0 - 20;
  while (x < X1 + 10) {
    const w = r.range(150, 230);
    const foot = streetY(x + w);
    const ht = r.range(250, 330);
    const top = streetY(x) - ht;
    list.push({ x, w, top, kind: PATTERNS[list.length % PATTERNS.length], dark: r.chance(0.5), floors: Math.floor((streetY(x) - top - 70) / 78) });
    x += w;
  }
  list.forEach((f, i) => {
    const { x, w, top, kind, dark } = f;
    const footL = streetY(x), footR = streetY(x + w);
    const shape = [[x, top], [x + w, top], [x + w, footR], [x, footL]];
    // window bays: tall doors onto balconies, a shop door at the foot
    const bays = Math.max(2, Math.round(w / 72));
    const wins = [], bals = [], shut = [];
    for (let fl = 0; fl < f.floors; fl++) {
      const wy = top + 46 + fl * 78;
      for (let b = 0; b < bays; b++) {
        const wx = x + (b + 0.5) * w / bays - 15;
        wins.push([wx, wy, 30, 50]);
        if (fl < f.floors - 1 || r.chance(0.5)) bals.push([wx - 8, wy + 32, 46, 20]);
        shut.push([wx, wy, 30, 50]);
      }
    }
    const doorX = x + w * r.range(0.25, 0.6);
    const box = { x: x - 10, y: top - 34, w: w + 20, h: footR - top + 50 };
    p.group('facades', box, (c) => {
      c.save(); poly(c, shape); c.clip();
      c.fillStyle = GLAZE; c.fillRect(x, top, w, footR - top + 4);
      // the tiled front: the pattern, then the windows cut out of it
      c.fillStyle = dark ? W3 : W2; patternPath(c, kind, x, top + 26, x + w, footR, kind === 'stripe' ? 12 : 18); c.fill();
      c.strokeStyle = dark ? W4 : W3; c.lineWidth = 0.8; c.stroke();
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2; poly(c, shape); c.stroke();
      // the cornice and the eave
      c.fillStyle = W4; c.fillRect(x - 6, top - 6, w + 12, 12); c.strokeRect(x - 6, top - 6, w + 12, 12);
      c.fillStyle = W3; poly(c, [[x - 10, top - 6], [x + w + 10, top - 6], [x + w + 2, top - 30], [x - 2, top - 30]]); c.fill(); c.stroke();
      c.strokeStyle = W4; c.lineWidth = 1; c.beginPath(); for (let k = x + 4; k < x + w; k += 9) { c.moveTo(k, top - 7); c.lineTo(k + 1, top - 29); } c.stroke();
      // window frames in stone, the dark panes, open shutters
      c.strokeStyle = INK;
      for (const [wx, wy, ww, wh] of wins) {
        c.fillStyle = GLAZE; c.fillRect(wx - 5, wy - 8, ww + 10, wh + 10); c.lineWidth = 1.4; c.strokeRect(wx - 5, wy - 8, ww + 10, wh + 10);
        c.fillStyle = INK; c.fillRect(wx, wy, ww, wh);
        c.strokeStyle = W3; c.lineWidth = 1; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.4); c.lineTo(wx + ww, wy + wh * 0.4); c.stroke();
        c.strokeStyle = INK;
      }
      // iron balconies
      c.lineWidth = 1.2;
      for (const [bx, by, bw, bh] of bals) {
        c.fillStyle = W4; c.fillRect(bx - 2, by + bh, bw + 4, 4);
        c.beginPath(); c.rect(bx, by, bw, bh);
        for (let k = 4; k < bw; k += 5) { c.moveTo(bx + k, by); c.lineTo(bx + k, by + bh); }
        c.moveTo(bx, by + bh / 2); c.lineTo(bx + bw, by + bh / 2);
        c.stroke();
      }
      // the door at street level
      const dy = streetY(doorX + 18);
      c.fillStyle = INK; c.beginPath(); c.moveTo(doorX, dy); c.lineTo(doorX, dy - 60); c.arc(doorX + 18, dy - 60, 18, Math.PI, 0); c.lineTo(doorX + 36, dy); c.fill();
      c.fillStyle = W1; c.fillRect(doorX - 8, dy - 4, 52, 6);
    }, { t: 6.4 + i * 0.32, d: 1.1, reveal: 'rise', ease: 'out' });
    // flowerpots on the balconies, a few sprigs
    const pots = bals.filter(() => r.chance(0.4)).map(([bx, by, bw]) => [bx + r.range(4, bw - 10), by]);
    if (pots.length) p.group('facades', { x: x - 10, y: top, w: w + 20, h: footR - top }, (c) => {
      for (const [px, py] of pots) {
        c.fillStyle = W4; c.fillRect(px, py - 8, 9, 8);
        c.fillStyle = W3; c.beginPath(); c.arc(px + 2, py - 11, 4, 0, Math.PI * 2); c.arc(px + 7, py - 12, 4, 0, Math.PI * 2); c.fill();
        c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      }
    }, { t: 9.3 + i * 0.05, d: 0.5, reveal: 'pop' });
    f.bals = bals;
  });
  facadesList = list;
}
let facadesList = [];

// ================================================================ the street: rails, cobbles, a lamp, the wires
function street(p, r) {
  const yA = (x) => streetY(x) + 2;
  const yR1 = (x) => streetY(x) + 78, yR2 = (x) => streetY(x) + 112;
  const curb = (x) => streetY(x) + 150;
  // the roadway of square setts
  const road = [[X0, yA(X0)], [X1, yA(X1)], [X1, curb(X1)], [X0, curb(X0)]];
  const setts = [];
  for (let x = X0; x < X1; x += 14) for (let k = 0; k < 10; k++) {
    const y = yA(x) + 6 + k * 14 + ((x / 14) % 2) * 7;
    if (y > curb(x) - 6) continue;
    setts.push([[x + 1, y], [x + 11, y + 1.8]]);
  }
  p.group('street', boxOf(road, 6), (c) => {
    c.fillStyle = W1; poly(c, road); c.fill();
    c.strokeStyle = W3; c.lineWidth = 1; c.beginPath();
    for (const [a, b] of setts) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }, { t: 8.2, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
  // the rails
  p.strokes('street', [[[X0, yR1(X0)], [X1, yR1(X1)]], [[X0, yR2(X0)], [X1, yR2(X1)]]], INK, 3, { t: 8.6, d: 0.8, reveal: 'wipeL', ease: 'inOut' });
  // the pavement: calçada in black and white waves
  const pave = [[X0, curb(X0)], [X1, curb(X1)], [X1, YB + 20], [X0, YB + 20]];
  const wave = [];
  for (let k = 0; k < 8; k++) {
    const top = [], bot = [];
    for (let x = X0; x <= X1; x += 8) {
      const base = curb(x) + 16 + k * 30;
      top.push([x, base + 7 * Math.sin(x / 34)]);
      bot.push([x, base + 12 + 7 * Math.sin(x / 34 + 0.6)]);
    }
    wave.push([...top, ...bot.reverse()]);
  }
  p.group('street', boxOf(pave, 4), (c) => {
    c.fillStyle = GLAZE; poly(c, pave); c.fill();
    c.save(); poly(c, pave); c.clip();
    c.fillStyle = W3; for (const w of wave) { path(c, w, true); c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(X0, curb(X0)); c.lineTo(X1, curb(X1)); c.stroke();
    c.fillStyle = W2; poly(c, [[X0, curb(X0)], [X1, curb(X1)], [X1, curb(X1) + 8], [X0, curb(X0) + 8]]); c.fill();
  }, { t: 8.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  // the overhead wire, on span wires from the facades
  const wireY = (x) => streetY(x) - 196;
  const spans = [];
  for (const x of [300, 760, 1220]) spans.push([[x, wireY(x) - 30], [x + 10, wireY(x + 10)]]);
  p.pen('street', [[X0, wireY(X0)], [X1, wireY(X1)]], INK, 2, { t: 9.0, d: 1.0 });
  p.strokes('street', spans, INK, 1.4, { t: 9.4, d: 0.4, reveal: 'fade' });

  // a lamp on an iron bracket
  const lx = 248, ly = streetY(lx) - 214;
  p.group('street', { x: lx - 40, y: ly - 50, w: 110, h: 120 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(lx - 30, ly + 12); c.lineTo(lx + 30, ly + 12); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(lx - 30, ly + 40); c.quadraticCurveTo(lx, ly + 36, lx + 26, ly + 12); c.stroke();
    c.beginPath(); c.arc(lx - 12, ly + 30, 8, 0, Math.PI * 1.6); c.stroke();
    c.fillStyle = W2; poly(c, [[lx + 18, ly + 14], [lx + 42, ly + 14], [lx + 46, ly + 46], [lx + 14, ly + 46]]); c.fill(); c.stroke();
    c.fillStyle = W4; poly(c, [[lx + 12, ly + 14], [lx + 48, ly + 14], [lx + 30, ly - 2]]); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(lx + 30, ly + 14); c.lineTo(lx + 30, ly + 46); c.stroke();
  }, { t: 9.6, d: 0.6, reveal: 'drop' });

  // laundry lines between the windows, the clothes hung (they move later)
  // (the lines themselves are baked; the clothes are live)
}

// ================================================================ the tram
const ANG = Math.atan(SLOPE);
const TX = 820;
function drawTram(c) {
  // in its own frame: x along the body (front to the left), y up from the rails (0)
  c.lineJoin = 'round';
  const L = 230;
  // the trolley pole from the roof to the wire
  c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.moveTo(60, -232); c.lineTo(178, -308); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(178, -308, 5, 0, Math.PI * 2); c.fill();
  // the truck and wheels
  c.fillStyle = INK;
  for (const wx of [-70, 70]) { c.beginPath(); c.arc(wx, -14, 15, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = W4; c.fillRect(-110, -30, 220, 16);
  // the lower body, yellow, with its panels
  c.fillStyle = YEL; c.beginPath(); c.roundRect(-L, -122, 2 * L, 96, [4, 4, 14, 14]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  c.strokeStyle = YEL_D; c.lineWidth = 1.4;
  for (let k = 0; k < 6; k++) { const x = -L + 26 + k * 72; c.strokeRect(x, -108, 60, 62); }
  // the white band under the windows
  c.fillStyle = GLAZE; c.fillRect(-L, -136, 2 * L, 16); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(-L, -136, 2 * L, 16);
  // the upper body: yellow posts between the windows
  c.fillStyle = YEL; c.fillRect(-L + 4, -214, 2 * L - 8, 80); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-L + 4, -214, 2 * L - 8, 80);
  const wins = [];
  for (let k = 0; k < 7; k++) wins.push([-L + 40 + k * 56, -204, 42, 60]);
  c.fillStyle = W1;
  for (const [x, y, w, h] of wins) { c.fillRect(x, y, w, h); }
  c.strokeStyle = INK; c.lineWidth = 1.6;
  for (const [x, y, w, h] of wins) { c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y + h * 0.36); c.lineTo(x + w, y + h * 0.36); c.stroke(); }
  // reflections on the glass, a few passengers' heads
  c.strokeStyle = W3; c.lineWidth = 1.4; c.beginPath();
  for (const [x, y, w, h] of wins) { c.moveTo(x + 6, y + h - 4); c.lineTo(x + w * 0.6, y + h * 0.4); c.moveTo(x + 14, y + h - 4); c.lineTo(x + w * 0.8, y + h * 0.45); }
  c.stroke();
  c.fillStyle = W4;
  for (const k of [1, 2, 4, 5]) { const [x, y] = wins[k]; c.beginPath(); c.arc(x + 21, y + 44, 9, 0, Math.PI * 2); c.fill(); c.fillRect(x + 9, y + 50, 24, 10); }
  // the front cab: the driver's windows and the door
  c.fillStyle = YEL; c.fillRect(-L - 14, -210, 18, 186); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-L - 14, -210, 18, 186);
  c.fillStyle = W1; c.fillRect(-L - 12, -200, 14, 56); c.strokeRect(-L - 12, -200, 14, 56);
  // the roof: pale, rounded, with its ventilator
  c.fillStyle = W2; c.beginPath(); c.moveTo(-L - 18, -212); c.quadraticCurveTo(-L - 10, -236, -L + 20, -238); c.lineTo(L - 20, -238); c.quadraticCurveTo(L + 6, -236, L + 6, -212); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = W3; c.fillRect(-120, -250, 240, 12); c.strokeRect(-120, -250, 240, 12);
  // the destination box over the cab, and the headlamp
  c.fillStyle = INK; c.fillRect(-L - 8, -268, 92, 30);
  c.fillStyle = YEL_L; c.font = '800 24px "Fraunces"'; c.textBaseline = 'middle'; c.fillText('28E', -L + 6, -252);
  c.fillStyle = GLAZE; c.beginPath(); c.arc(-L - 10, -60, 9, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  // the lifeguard tray and fender at the front
  c.fillStyle = INK; c.fillRect(-L - 26, -30, 30, 8);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(-L - 24 + k * 6, -30); c.lineTo(-L - 20 + k * 6, -22); } c.stroke();
  // a shadow line under the body, hatched
  c.strokeStyle = YEL_D; c.lineWidth = 1; c.beginPath();
  for (let x = -L + 4; x < L; x += 5) { c.moveTo(x, -36); c.lineTo(x + 6, -28); }
  c.stroke();
}
function tram(p, r) {
  const x = TX, y = streetY(TX) + 112;
  const box = { x: x - 320, y: y - 400, w: 620, h: 440 };
  p.mark('tram', {
    t: 9.4, d: 1.8, reveal: 'slide', ease: 'out', dx: Math.cos(ANG) * 360, dy: Math.sin(ANG) * 360, box,
    draw: (c) => { c.save(); c.translate(x, y); c.rotate(ANG); drawTram(c); c.restore(); },
  });
}

// ================================================================ life: people, gulls, a ferry, washing in the wind
function figure(c, x, y, s, o = {}) {
  // a walker in profile: striding legs, a coat or a full skirt, an arm swinging
  c.strokeStyle = INK; c.lineWidth = 1.3; c.lineJoin = 'round'; c.lineCap = 'round';
  const st = o.stride ?? 1;
  c.lineWidth = 2.6 * s; c.beginPath();
  c.moveTo(x, y - 16 * s); c.lineTo(x - 5 * s * st, y); c.moveTo(x, y - 16 * s); c.lineTo(x + 6 * s * st, y - 1 * s); c.stroke();
  c.lineWidth = 1.3;
  c.fillStyle = o.coat || W4;
  c.beginPath();
  if (o.skirt) { c.moveTo(x - 4 * s, y - 36 * s); c.quadraticCurveTo(x - 12 * s, y - 14 * s, x - 11 * s, y - 9 * s); c.lineTo(x + 11 * s, y - 9 * s); c.quadraticCurveTo(x + 10 * s, y - 20 * s, x + 4 * s, y - 36 * s); }
  else { c.moveTo(x - 5 * s, y - 37 * s); c.lineTo(x - 7 * s, y - 14 * s); c.lineTo(x + 7 * s, y - 14 * s); c.lineTo(x + 5 * s, y - 37 * s); }
  c.closePath(); c.fill(); c.stroke();
  // shoulders and the arm
  c.beginPath(); c.ellipse(x, y - 37 * s, 6 * s, 3 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.lineWidth = 2.2 * s; c.strokeStyle = o.coat === W2 ? W4 : INK;
  c.beginPath(); c.moveTo(x + 2 * s, y - 36 * s); c.lineTo(x + 6 * s * st, y - 24 * s); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.3;
  c.fillStyle = GLAZE; c.beginPath(); c.arc(x + 1 * s, y - 45 * s, 5.5 * s, 0, Math.PI * 2); c.fill(); c.stroke();
  if (o.hat) { c.fillStyle = INK; c.beginPath(); c.ellipse(x + 1 * s, y - 49 * s, 8 * s, 2 * s, 0, 0, Math.PI * 2); c.fill(); c.fillRect(x - 4 * s, y - 56 * s, 10 * s, 7 * s); }
  if (o.basket) { c.fillStyle = W2; c.beginPath(); c.ellipse(x + 1 * s, y - 53 * s, 11 * s, 4 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = W3; c.fillRect(x - 8 * s, y - 53 * s, 18 * s, 4 * s); c.strokeRect(x - 8 * s, y - 53 * s, 18 * s, 4 * s); }
  if (o.shawl) { c.fillStyle = INK; c.beginPath(); c.moveTo(x - 5 * s, y - 47 * s); c.quadraticCurveTo(x - 10 * s, y - 34 * s, x - 7 * s, y - 24 * s); c.lineTo(x + 6 * s, y - 32 * s); c.quadraticCurveTo(x + 7 * s, y - 46 * s, x - 5 * s, y - 47 * s); c.fill(); }
}
function life(p, r) {
  // people on the pavement
  const curb = (x) => streetY(x) + 150;
  const folk = [[240, 1.9, { hat: true }], [330, 1.75, { coat: W3, basket: true, skirt: true, stride: -0.8 }], [520, 1.8, { coat: W2, skirt: true, shawl: true }], [700, 1.6, { coat: W3, stride: -1 }], [1010, 1.7, { hat: true, stride: 0.7 }], [1340, 1.5, { coat: W3, basket: true, skirt: true }]];
  folk.forEach(([x, s, o], i) => {
    const y = Math.min(YB - 8, curb(x) + 70 + (i % 2) * 26);
    p.group('life', { x: x - 40, y: y - 70 * s, w: 80, h: 80 * s }, (c) => figure(c, x, y, s, o), { t: 10.2 + i * 0.15, d: 0.5, reveal: 'drop' });
  });
  // a cat on a step and pigeons by the door
  p.group('life', { x: 1080, y: 1300, w: 200, h: 80 }, (c) => {
    const y = curb(1100) + 40;
    c.fillStyle = INK; c.beginPath(); c.ellipse(1100, y - 8, 16, 8, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(1116, y - 18, 7, 0, Math.PI * 2); c.fill();
    poly(c, [[1112, y - 23], [1114, y - 31], [1118, y - 24]]); c.fill(); poly(c, [[1118, y - 24], [1122, y - 31], [1123, y - 21]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(1085, y - 8); c.quadraticCurveTo(1070, y - 4, 1074, y - 22); c.stroke();
    c.fillStyle = W3;
    for (const [px, py] of [[1170, y + 20], [1196, y + 14], [1220, y + 22]]) { c.beginPath(); c.ellipse(px, py, 8, 5, -0.2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(px + 7, py - 5, 3.4, 0, Math.PI * 2); c.fill(); }
  }, { t: 10.9, d: 0.5, reveal: 'fade' });

  // laundry on lines across a facade: the lines baked, the clothes swaying (live)
  const lines = [];
  const clothes = [];
  for (const f of facadesList) {
    if (f.x < 180 || f.x > 1300 || f.floors < 3 || !r.chance(0.7)) continue;
    const y = f.top + 120 + r.int(0, 1) * 78;
    const x0 = f.x + 12, x1 = f.x + f.w - 12;
    lines.push([[x0, y], [(x0 + x1) / 2, y + 8], [x1, y]]);
    for (let x = x0 + 10; x < x1 - 20; x += r.range(20, 30)) clothes.push([x, y + 8 * Math.sin(((x - x0) / (x1 - x0)) * Math.PI), r.range(12, 20), r.range(16, 30), r.pick([W3, W4, YEL, GLAZE, W2]), r() * 6]);
  }
  p.strokes('life', lines, INK, 1, { t: 10.4, d: 0.6, reveal: 'wipe' });
  p.live('life', {
    t: 10.7, d: 0.8, reveal: 'fade', box: { x: X0, y: 700, w: X1 - X0, h: 500 },
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 1;
      for (const [x, y, w, h, col, ph] of clothes) {
        const sw = Math.sin(time * 1.6 + ph) * 3;
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + sw, y + h); c.lineTo(x + sw * 0.6, y + h); c.closePath(); c.fill(); c.stroke();
      }
    },
  });

  // gulls over the river and the roofs
  const gulls = [];
  for (let i = 0; i < 9; i++) gulls.push([r.range(560, 1400), r.range(300, 640), r() * 6, r.range(0.8, 1.4)]);
  p.live('life', {
    t: 5.0, d: 1.0, reveal: 'fade', box: { x: X0, y: 200, w: X1 - X0, h: 500 },
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (const [x, y, ph, s] of gulls) {
        const gx = x + Math.sin(time * 0.2 + ph) * 40, gy = y + Math.sin(time * 0.5 + ph) * 10, f = Math.sin(time * 4 + ph) * 3;
        c.moveTo(gx - 12 * s, gy - 2 * s + f * 0.5); c.quadraticCurveTo(gx - 6 * s, gy - 8 * s - f, gx, gy); c.quadraticCurveTo(gx + 6 * s, gy - 8 * s - f, gx + 12 * s, gy - 2 * s + f * 0.5);
      }
      c.stroke();
    },
  });
  // a cacilheiro ferry crossing the Tagus, and a fragata with its sail
  p.live('life', {
    t: 4.6, d: 1.0, reveal: 'fade', box: { x: X0, y: 680, w: X1 - X0, h: 120 },
    draw: (c, time) => {
      const x = 1140 + Math.sin(time * 0.05) * 30 + time * 3, y = 772 + Math.sin(time * 1.2) * 1;
      c.fillStyle = GLAZE; c.strokeStyle = INK; c.lineWidth = 1.4;
      poly(c, [[x - 44, y - 10], [x + 44, y - 10], [x + 36, y], [x - 38, y]]); c.fill(); c.stroke();
      c.fillStyle = W2; c.fillRect(x - 28, y - 22, 54, 12); c.strokeRect(x - 28, y - 22, 54, 12);
      c.fillStyle = INK; for (let k = 0; k < 6; k++) c.fillRect(x - 24 + k * 9, y - 19, 4, 5);
      c.fillRect(x - 4, y - 32, 6, 10);
      const bx = 1300 - time * 2, by = 800 + Math.sin(time * 1.5 + 1) * 1.2;
      c.fillStyle = W4; poly(c, [[bx - 20, by - 5], [bx + 22, by - 5], [bx + 14, by + 2], [bx - 14, by + 2]]); c.fill();
      c.fillStyle = W3; poly(c, [[bx, by - 52], [bx, by - 7], [bx + 26, by - 9]]); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(bx, by - 56); c.lineTo(bx, by - 5); c.stroke();
    },
  });
}

// ================================================================ the cartouche and the name
function title(p, r) {
  const cx = W / 2, cy = 1700, w = 1040, h = 250;
  // the plaque: concave corners, scrolled ends
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, k = 34;
  const leavesL = [leaf(x0 - 10, cy, Math.PI, 150, 32, -2.8, 5), leaf(x0 - 10, cy + 20, Math.PI * 0.9, 110, 20, 2.2, 4)];
  const leavesR = [leaf(x1 + 10, cy, 0, 150, 32, 2.8, 5), leaf(x1 + 10, cy + 20, Math.PI * 0.1, 110, 20, -2.2, 4)];
  const plq = (c) => {
    c.beginPath();
    c.moveTo(x0 + k, y0);
    c.lineTo(x1 - k, y0); c.arc(x1, y0, k, Math.PI, Math.PI / 2, true);
    c.lineTo(x1 + 10, cy - 30); c.arc(x1 + 10, cy, 30, -Math.PI / 2, Math.PI / 2, false);
    c.lineTo(x1, y1 - k); c.arc(x1, y1, k, -Math.PI / 2, Math.PI, true);
    c.lineTo(x0 + k, y1); c.arc(x0, y1, k, 0, -Math.PI / 2, true);
    c.lineTo(x0 - 10, cy + 30); c.arc(x0 - 10, cy, 30, Math.PI / 2, Math.PI * 1.5, false);
    c.lineTo(x0, y0 + k); c.arc(x0, y0, k, Math.PI / 2, 0, true);
    c.closePath();
  };
  p.group('frame', { x: x0 - 200, y: y0 - 30, w: w + 400, h: h + 60 }, (c) => {
    for (const lf of [...leavesL, ...leavesR]) drawLeaf(c, lf, W3);
    c.fillStyle = W2; c.save(); c.translate(8, 8); plq(c); c.fill(); c.restore();
    c.fillStyle = GLAZE; plq(c); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; plq(c); c.stroke();
    c.strokeStyle = W3; c.lineWidth = 2; c.save(); c.translate(cx, cy); c.scale(0.95, 0.88); c.translate(-cx, -cy); plq(c); c.stroke(); c.restore();
    // ochre volutes at the ends
    for (const [x, s] of [[x0 - 10, -1], [x1 + 10, 1]]) {
      c.fillStyle = OCH; c.beginPath(); c.arc(x, cy, 18, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2.4; path(c, spiral(x, cy, 18, 1.6, s > 0 ? 0 : Math.PI, s)); c.stroke();
    }
  }, { t: 10.2, d: 1.0, reveal: 'iris', ease: 'inOut' });

  // LISBOA, a little shadow in the pale blue
  p.type('title', 'LISBOA', cx, cy + 46, { size: 178, family: '"Fraunces"', weight: 800, color: INK, shadow: W2, sx: 6, sy: 6, track: 0.14, align: 'center', t: 11.0, gap: 0.14, d: 0.7 });
  p.type('title', 'a cidade das sete colinas', cx, cy + 102, { size: 34, family: '"Fraunces"', weight: 400, style: 'italic', color: W4, align: 'center', t: 12.0, gap: 0.025, d: 0.4, reveal: 'fade' });
  // the date of the panel, in the margin below
  p.type('title', 'ALFAMA · CASTELO · TEJO', cx, 1900, { size: 22, family: '"Fraunces"', weight: 500, color: INK, align: 'center', track: 0.3, t: 12.5, gap: 0.02, d: 0.3, reveal: 'fade' });
}
