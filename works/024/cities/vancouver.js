// Vancouver: a 1960s modernist travel poster. Faceted North Shore mountains
// with the twin Lions and Grouse's ski runs over the harbor; the Lions Gate
// Bridge to Stanley Park's forest and the lighthouse on its point; a freighter
// at anchor, sailboats, the yellow sulfur piles and orange cranes on the far
// shore; glass towers, the Harbour Centre's ring and the sails of Canada Place;
// seaplanes on the water and in the air; a tall cedar in front and the seawall
// below. Flat shapes in a few inks, overprinted, set in condensed type.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, mix, shade } from '../kit.js';

const PAPER = '#efe7d4';
const NAVY = '#1e2f47', NAVY_L = '#3b5170', TEAL = '#2b7c83', TEAL_D = '#1f5f68', TEAL_L = '#7fbcb8', TEAL_LL = '#b9dbd3';
const MUST = '#e3a838', ORANGE = '#dc6630', RED = '#c2452d', WHITE = '#fbf8ef';
const PINE = '#2c5a45', PINE_D = '#1c3c30', PINE_L = '#4f7d55', SLATE = '#7b97a8', SLATE_D = '#56748a', SKY = '#f0dfb2', SKY2 = '#dbe5d6';

export const city = {
  id: 'vancouver', name: 'Vancouver', wall: '#173238',
  alt: 'A 1960s travel poster of Vancouver in flat colors: the North Shore mountains with the twin peaks of the Lions and the ski runs of Grouse Mountain over the harbor, the Lions Gate Bridge reaching to Stanley Park with the lighthouse on Brockton Point, a freighter at anchor and sailboats, yellow sulfur piles and orange cranes on the far shore, glass towers, a concrete tower crowned by a round lookout and the white sails of Canada Place, seaplanes on the water and in the air, a tall cedar in front and the seawall with walkers and a cyclist',
  google: 'family=Barlow+Condensed:wght@600;800',
  fonts: [['800 340px "Barlow Condensed"', 'VANCOUVER'], ['600 40px "Barlow Condensed"', 'BRITISH COLUMBIA · CANADA · FLY · SAIL · WALK THE SEAWALL']],
  build,
};

const FACE = '"Barlow Condensed"';
const X0 = 70, X1 = W - 70, Y0 = 70, Y1 = 1800;
const BASE = 1000;    // the mountains' foot
const WATER = 1062;   // the far shore's waterline
const SEAWALL = 1690; // the near walk

function build() {
  const p = new Plate({ paper: PAPER, seed: 1886 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'title', 'far', 'mid', 'shore', 'water', 'city', 'park', 'ship', 'boats', 'near', 'live', 'band');
  p.layer('band', { clip: false });

  sky(p, r);
  far(p, r);
  mid(p, r);
  shore(p, r);
  water(p, r);
  bridge(p, r);
  downtown(p, r);
  park(p, r);
  freighter(p, r);
  boats(p, r);
  near(p, r);
  live(p, r);
  title(p);
  band(p);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}

// ================================================================ the sky: two flat tones, capsule clouds
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: BASE - Y0 + 100 }, (c) => {
    c.fillStyle = SKY; c.fillRect(X0, Y0, X1 - X0, BASE + 100 - Y0);
  }, { t: 0.1, d: 0.7, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: X0, y: 540, w: X1 - X0, h: BASE - 440 }, (c) => {
    c.fillStyle = SKY2; c.fillRect(X0, 560, X1 - X0, BASE + 100 - 560);
    // a fine line where the two inks meet
    c.fillStyle = WHITE; c.fillRect(X0, 556, X1 - X0, 4);
  }, { t: 0.5, d: 0.8, reveal: 'fall', ease: 'inOut' });
  // clouds: stacked rounded bars in white, a teal shadow bar under each
  const clouds = [[180, 500, 260], [1060, 470, 340], [760, 610, 200], [1330, 640, 180]];
  clouds.forEach(([x, y, w], i) => {
    p.group('sky', { x: x - 40, y: y - 60, w: w + 80, h: 100 }, (c) => {
      c.fillStyle = TEAL_LL; c.beginPath(); c.roundRect(x + 20, y + 14, w * 0.8, 14, 7); c.fill();
      c.fillStyle = WHITE;
      c.beginPath(); c.roundRect(x, y, w, 22, 11); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.18, y - 22, w * 0.5, 24, 12); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.32, y - 42, w * 0.24, 22, 11); c.fill();
    }, { t: 1.0 + i * 0.25, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the far range: faceted rock and snow, the Lions
const FAR = [[X0 - 10, 780], [150, 700], [250, 744], [360, 640], [450, 690], [540, 610], [574, 560], [592, 512], [606, 506], [618, 538], [640, 592], [662, 552], [676, 518], [690, 514], [704, 552], [740, 640], [840, 590], [930, 650], [1040, 568], [1120, 610], [1220, 548], [1320, 640], [1420, 600], [X1 + 10, 690]];
const SNOW = 640;
function peaks(ridge) {
  const out = [];
  for (let i = 1; i < ridge.length - 1; i++) if (ridge[i][1] < ridge[i - 1][1] && ridge[i][1] <= ridge[i + 1][1]) out.push(i);
  return out;
}
function facets(ridge, base, skew = 0.35) {
  const shadows = [];
  for (const i of peaks(ridge)) {
    let j = i + 1; while (j < ridge.length - 1 && ridge[j + 1][1] > ridge[j][1]) j++;
    const [px, py] = ridge[i], [vx, vy] = ridge[j];
    const pts = [[px, py]];
    for (let k = i + 1; k <= j; k++) pts.push(ridge[k]);
    pts.push([vx, base], [px + (vx - px) * skew, base]);
    shadows.push(pts);
  }
  return shadows;
}
function snowcaps(ridge, line) {
  const caps = [];
  for (const i of peaks(ridge)) {
    if (ridge[i][1] > line - 20) continue;
    const lim = Math.min(line, ridge[i][1] + 120);
    const cross = (dir) => {
      let k = i;
      while (k + dir >= 0 && k + dir < ridge.length && ridge[k + dir][1] < lim) k += dir;
      const a = ridge[k], b = ridge[Math.max(0, Math.min(ridge.length - 1, k + dir))];
      const t = clamp((lim - a[1]) / ((b[1] - a[1]) || 1));
      const pts = []; for (let m = i; m !== k; m += dir) pts.push(ridge[m]); pts.push(a);
      return { pts, end: [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] };
    };
    const L = cross(-1), R = cross(1);
    const top = ridge[i];
    const cap = [...L.pts.reverse(), L.end];
    // a jagged lower edge from one side to the other
    const n = 6;
    for (let k = 1; k < n; k++) { const x = lerp(L.end[0], R.end[0], k / n); cap.push([x, lim - (k % 2 ? 28 : 0) - Math.abs(x - top[0]) * 0.1]); }
    cap.push(R.end, ...R.pts.slice(1).reverse());
    caps.push({ cap, top, lim });
  }
  return caps;
}
function far(p, r) {
  const sil = [...FAR, [X1 + 10, BASE], [X0 - 10, BASE]];
  p.group('far', boxOf(sil, 4), (c) => { c.fillStyle = SLATE; poly(c, sil); c.fill(); }, { t: 1.6, d: 1.1, reveal: 'rise', ease: 'inOut' });
  const sh = facets(FAR, BASE);
  p.group('far', boxOf(sil, 4), (c) => { c.fillStyle = SLATE_D; for (const s of sh) { poly(c, s); c.fill(); } }, { t: 2.3, d: 0.7, reveal: 'fade' });
  const caps = snowcaps(FAR, SNOW);
  p.group('far', { x: X0, y: 480, w: X1 - X0, h: 220 }, (c) => {
    for (const { cap, top } of caps) {
      c.fillStyle = WHITE; poly(c, cap); c.fill();
      // the shadowed half of the snow
      c.save(); poly(c, cap); c.clip();
      c.fillStyle = TEAL_LL; path(c, [top, [top[0] + 300, top[1] + 300], [top[0] + 300, 900], [top[0] + 50, 900]]); c.fill();
      c.restore();
    }
  }, { t: 2.6, d: 0.8, reveal: 'fall' });
}

// ================================================================ the near range: dark forest, Grouse's ski runs, trees in rows
const MID = [[X0 - 10, 900], [120, 860], [260, 900], [380, 820], [470, 860], [560, 800], [700, 880], [820, 830], [900, 772], [980, 740], [1060, 770], [1170, 830], [1280, 790], [1400, 850], [X1 + 10, 820]];
function mid(p, r) {
  const sil = [...MID, [X1 + 10, WATER], [X0 - 10, WATER]];
  p.group('mid', boxOf(sil, 4), (c) => { c.fillStyle = PINE; poly(c, sil); c.fill(); }, { t: 2.9, d: 1.0, reveal: 'rise', ease: 'inOut' });
  const sh = facets(MID, WATER, 0.5);
  // tree tops in rows across the slopes, as small triangles
  const trees = [[], []];
  for (let y = 790; y < WATER - 10; y += 15) for (let x = X0 + (y % 30 ? 0 : 8); x < X1; x += 16) {
    let top = 2000;
    for (let i = 0; i < MID.length - 1; i++) if (x >= MID[i][0] && x < MID[i + 1][0]) top = lerp(MID[i][1], MID[i + 1][1], (x - MID[i][0]) / (MID[i + 1][0] - MID[i][0]));
    if (y < top + 14 || r() < 0.35) continue;
    trees[r() < 0.6 ? 0 : 1].push([x + r.range(-3, 3), y]);
  }
  p.group('mid', boxOf(sil, 4), (c) => {
    c.fillStyle = PINE_D; for (const s of sh) { poly(c, s); c.fill(); }
    [PINE_D, PINE_L].forEach((col, i) => { c.fillStyle = col; c.beginPath(); for (const [x, y] of trees[i]) { c.moveTo(x, y - 12); c.lineTo(x + 5, y); c.lineTo(x - 5, y); c.closePath(); } c.fill(); });
  }, { t: 3.4, d: 0.8, reveal: 'fade' });
  // Grouse Mountain: ski runs cut white down the slope from the top, and the chairlift
  const gx = 980, gy = 740;
  const runs = [[[gx - 10, gy + 8], [gx - 60, gy + 90], [gx - 90, gy + 200]], [[gx + 4, gy + 6], [gx + 10, gy + 110], [gx - 20, gy + 220]], [[gx + 30, gy + 14], [gx + 80, gy + 100], [gx + 110, gy + 190]]];
  runs.forEach((pts, i) => p.pen('mid', pts.map(([x, y]) => [x, gy + (y - gy) * 0.7]), WHITE, 5 - i * 0.8, { t: 3.9 + i * 0.15, d: 0.7 }));
  p.pen('mid', [[gx + 4, gy + 4], [gx + 120, gy + 190]], NAVY, 1.4, { t: 4.3, d: 0.6 });
  p.group('mid', { x: gx - 30, y: gy - 30, w: 60, h: 40 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(gx - 16, gy - 14, 32, 14); c.fillStyle = NAVY; c.fillRect(gx - 18, gy - 18, 36, 5);
  }, { t: 4.4, d: 0.4, reveal: 'pop' });
}

// ================================================================ the far shore: houses, sulfur piles, cranes
function shore(p, r) {
  const houses = [];
  for (let x = X0; x < X1; x += r.range(12, 22)) houses.push([x, r.range(8, 22), r.pick([WHITE, MUST, TEAL_LL, ORANGE, WHITE])]);
  p.group('shore', { x: X0, y: WATER - 40, w: X1 - X0, h: 44 }, (c) => {
    for (const [x, h, col] of houses) { c.fillStyle = col; c.fillRect(x, WATER - h, 10, h); }
    c.fillStyle = NAVY; c.fillRect(X0, WATER - 3, X1 - X0, 4);
  }, { t: 4.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the sulfur piles: yellow cones
  p.group('shore', { x: 700, y: WATER - 70, w: 220, h: 74 }, (c) => {
    c.fillStyle = MUST;
    for (const [x, w, h] of [[730, 60, 34], [790, 80, 46], [860, 56, 30]]) path(c, [[x - w / 2, WATER - 2], [x - w * 0.12, WATER - h], [x + w * 0.12, WATER - h], [x + w / 2, WATER - 2]]), c.fill();
    c.fillStyle = shade(MUST, 0.82);
    for (const [x, w, h] of [[730, 60, 34], [790, 80, 46], [860, 56, 30]]) path(c, [[x + w * 0.12, WATER - h], [x + w / 2, WATER - 2], [x + w * 0.1, WATER - 2]]), c.fill();
  }, { t: 4.4, d: 0.6, reveal: 'rise' });
  // gantry cranes, orange
  p.group('shore', { x: 900, y: WATER - 110, w: 200, h: 112 }, (c) => {
    c.fillStyle = ORANGE;
    for (const x of [930, 1000, 1060]) {
      c.fillRect(x, WATER - 70, 4, 68); c.fillRect(x + 22, WATER - 70, 4, 68); c.fillRect(x - 20, WATER - 74, 64, 5);
      c.fillRect(x + 6, WATER - 92, 3, 20); path(c, [[x + 7, WATER - 92], [x - 20, WATER - 74], [x - 16, WATER - 74]]); c.fill();
    }
  }, { t: 4.6, d: 0.6, reveal: 'rise' });
}

// ================================================================ the water: bands of teal and long silkscreen lines
function water(p, r) {
  const bands = [[WATER, TEAL_L], [1130, mix(TEAL_L, TEAL, 0.5)], [1260, TEAL], [1480, TEAL_D]];
  bands.forEach(([y, col], i) => {
    const y1 = i < 3 ? bands[i + 1][0] : Y1;
    p.group('water', { x: X0, y, w: X1 - X0, h: y1 - y + 2 }, (c) => { c.fillStyle = col; c.fillRect(X0, y, X1 - X0, y1 - y + 2); }, { t: 1.8 + i * 0.3, d: 0.7, reveal: 'fall', ease: 'inOut' });
  });
  const lines = [];
  for (let y = WATER + 8; y < SEAWALL - 10; y += r.range(9, 22) * (0.5 + (y - WATER) / 600)) {
    const n = r.int(2, 5);
    for (let k = 0; k < n; k++) { const x = r.range(X0, X1), L = r.range(40, 220) * (0.4 + (y - WATER) / 600); lines.push([[x, y], [x + L, y]]); }
  }
  p.strokes('water', lines.filter(([[, y]]) => y < 1260), WHITE, 1.6, { t: 3.2, d: 0.8, reveal: 'wipe' });
  p.strokes('water', lines.filter(([[, y]]) => y >= 1260), TEAL_L, 2.6, { t: 3.5, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the Lions Gate Bridge across the narrows
function bridge(p, r) {
  const xa = 230, xb = 780, deck = 1012, towers = [380, 630], top = 900;
  const cable = [];
  // the main cable sags between the towers and runs down to the anchors
  cable.push([xa, deck - 6]);
  for (let k = 0; k <= 24; k++) { const t = k / 24, x = lerp(towers[0], towers[1], t); cable.push([x, top + 6 + 86 * 4 * t * (1 - t)]); }
  cable.push([xb, deck - 6]);
  const sus = [];
  for (let k = 1; k < cable.length - 1; k++) sus.push([cable[k], [cable[k][0], deck]]);
  p.group('shore', { x: xa - 10, y: top - 20, w: xb - xa + 20, h: deck - top + 50 }, (c) => {
    // the towers
    c.fillStyle = TEAL_LL;
    for (const x of towers) { c.fillRect(x - 7, top, 5, deck - top + 40); c.fillRect(x + 2, top, 5, deck - top + 40); for (const y of [top + 4, top + 44, top + 80]) c.fillRect(x - 8, y, 16, 5); }
    // the deck and the approach viaduct on its piers
    c.fillStyle = TEAL_LL; c.fillRect(xa, deck, xb - xa, 6);
    for (let x = 680; x < xb; x += 22) c.fillRect(x, deck + 6, 3, WATER - deck - 6);
  }, { t: 4.8, d: 0.8, reveal: 'rise' });
  p.pen('shore', cable, TEAL_LL, 2.6, { t: 5.2, d: 1.0 });
  p.strokes('shore', sus, TEAL_LL, 1, { t: 5.6, d: 0.6, reveal: 'fall' });
}

// ================================================================ downtown: glass towers, the Harbour Centre, Canada Place
function downtown(p, r) {
  const foot = 1286;
  const cols = [TEAL, NAVY_L, SLATE, TEAL_D, WHITE, MUST, NAVY];
  const towers = [];
  let x = 830;
  while (x < X1 + 20) {
    const w = r.range(44, 96), h = r.range(150, 430) * (x > 1050 && x < 1400 ? 1.15 : 0.9);
    towers.push({ x, w, top: foot - h, col: r.pick(cols), kind: r.int(0, 2), back: r() < 0.5 });
    x += w * r.range(0.6, 0.95);
  }
  // back row first, then the front row a little lower
  const backs = towers.filter((t) => t.back), fronts = towers.filter((t) => !t.back).map((t) => ({ ...t, top: t.top + 90 }));
  const draw = (list) => (c) => {
    for (const t of list) {
      const { x, w, top, col, kind } = t;
      c.fillStyle = col; c.fillRect(x, top, w, foot - top);
      // the shaded side
      c.fillStyle = 'rgba(20,30,45,0.22)'; c.fillRect(x + w * 0.7, top, w * 0.3, foot - top);
      const line = col === WHITE || col === MUST ? NAVY_L : TEAL_LL;
      c.fillStyle = line;
      if (kind === 0) { for (let yy = top + 10; yy < foot - 6; yy += 9) c.fillRect(x + 4, yy, w - 8, 2); }
      else if (kind === 1) { for (let xx = x + 6; xx < x + w - 4; xx += 8) c.fillRect(xx, top + 8, 2, foot - top - 12); }
      else { for (let yy = top + 10; yy < foot - 6; yy += 14) for (let xx = x + 5; xx < x + w - 8; xx += 10) c.fillRect(xx, yy, 6, 8); }
      // a diagonal sky reflection across the glass
      if (col !== WHITE && col !== MUST) { c.fillStyle = 'rgba(255,255,255,0.16)'; path(c, [[x, top + 40], [x + w * 0.5, top], [x + w * 0.8, top], [x, top + w * 0.9 + 40]]); c.fill(); }
      c.fillStyle = shade(col, 0.7); c.fillRect(x - 2, top - 6, w + 4, 6);
    }
  };
  p.group('city', { x: 800, y: 600, w: X1 - 800 + 40, h: foot - 600 + 10 }, draw(backs), { t: 5.0, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the Harbour Centre: a concrete shaft with the ring of its lookout on top
  const hx = 1180, htop = 760;
  p.group('city', { x: hx - 80, y: htop - 90, w: 160, h: foot - htop + 100 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(hx - 26, htop, 52, foot - htop);
    c.fillStyle = SLATE; c.fillRect(hx + 10, htop, 16, foot - htop);
    c.fillStyle = NAVY_L; for (let y = htop + 70; y < foot; y += 11) c.fillRect(hx - 22, y, 30, 4);
    // the glass elevators up its side
    c.fillStyle = MUST; c.fillRect(hx - 32, htop + 40, 6, foot - htop - 40);
    c.fillStyle = WHITE; c.fillRect(hx - 6, htop - 30, 12, 30);
    c.fillStyle = NAVY; c.beginPath(); c.ellipse(hx, htop - 34, 66, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = WHITE; c.fillRect(hx - 66, htop - 48, 132, 14);
    c.fillStyle = NAVY; for (let k = -60; k < 60; k += 10) c.fillRect(hx + k, htop - 45, 6, 8);
    c.fillStyle = WHITE; c.beginPath(); c.ellipse(hx, htop - 48, 66, 12, 0, Math.PI, 0); c.fill();
    c.fillStyle = NAVY; c.fillRect(hx - 1.5, htop - 86, 3, 30);
  }, { t: 5.8, d: 0.9, reveal: 'rise' });
  p.group('city', { x: 800, y: 600, w: X1 - 800 + 40, h: foot - 600 + 10 }, draw(fronts), { t: 6.4, d: 1.1, reveal: 'rise', ease: 'inOut' });
  // the waterfront: a quay, and Canada Place with its five white sails
  p.group('city', { x: 820, y: 1180, w: X1 - 820, h: 130 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(820, foot - 4, X1 - 820, 10);
    const cx = 960, y = foot - 10;
    c.fillStyle = SLATE; c.fillRect(cx - 120, y - 40, 240, 40);
    c.fillStyle = NAVY_L; for (let xx = cx - 112; xx < cx + 112; xx += 12) c.fillRect(xx, y - 30, 6, 22);
    c.fillStyle = WHITE;
    for (let k = 0; k < 5; k++) {
      const sx = cx - 100 + k * 50, h = 54 + (k % 2 ? 12 : 0) + (k === 2 ? 14 : 0);
      path(c, [[sx - 26, y - 38], [sx, y - 38 - h], [sx + 26, y - 38]]); c.fill();
    }
    c.fillStyle = TEAL_LL;
    for (let k = 0; k < 5; k++) { const sx = cx - 100 + k * 50, h = 54 + (k % 2 ? 12 : 0) + (k === 2 ? 14 : 0); path(c, [[sx, y - 38 - h], [sx + 26, y - 38], [sx + 6, y - 38]]); c.fill(); }
    c.fillStyle = NAVY; for (let k = 0; k < 5; k++) { const sx = cx - 100 + k * 50, h = 54 + (k % 2 ? 12 : 0) + (k === 2 ? 14 : 0); c.fillRect(sx - 1, y - 46 - h, 2, 10); }
  }, { t: 7.2, d: 0.8, reveal: 'rise' });
  // the seaplane dock in Coal Harbour, with a plane tied up
  p.group('city', { x: 1240, y: 1260, w: 300, h: 70 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(1260, 1302, 260, 6);
    for (let x = 1270; x < 1520; x += 30) { c.fillStyle = NAVY; c.fillRect(x, 1306, 4, 12); }
    seaplane(c, 1380, 1300, 0.9, -1, MUST, 0);
  }, { t: 7.6, d: 0.6, reveal: 'pop' });
}

// a floatplane, high wing, two floats: (x, y) its floats' bottom
function seaplane(c, x, y, s, dir, col, prop) {
  const P = (u, v) => [x + dir * u * s, y - v * s];
  c.fillStyle = NAVY;
  for (const v of [0]) { path(c, [P(-34, v), P(30, v), P(38, v + 4), P(30, v + 7), P(-34, v + 7)]); c.fill(); }
  c.fillRect(Math.min(P(-12, 7)[0], P(-10, 7)[0]), y - 20 * s, 2 * s, 13 * s);
  c.fillRect(Math.min(P(12, 7)[0], P(14, 7)[0]), y - 20 * s, 2 * s, 13 * s);
  c.fillStyle = col;
  path(c, [P(-44, 22), P(22, 20), P(34, 26), P(32, 34), P(-6, 36), P(-40, 30), P(-52, 44), P(-58, 44), P(-54, 24)]); c.fill();
  c.fillStyle = WHITE; path(c, [P(4, 30), P(20, 30), P(26, 34), P(6, 35)]); c.fill();
  c.fillStyle = NAVY; path(c, [P(-30, 36), P(24, 36), P(24, 40), P(-30, 40)]); c.fill();
  // the propeller, a blur
  c.fillStyle = 'rgba(30,47,71,0.55)';
  const [px, py] = P(36, 28); c.beginPath(); c.ellipse(px, py, 2 * s, (10 + 4 * Math.sin(prop)) * s, 0, 0, Math.PI * 2); c.fill();
}

// ================================================================ Stanley Park: the forest, its seawall, the lighthouse on Brockton Point
function park(p, r) {
  const land = [[X0 - 10, 1060], [200, 1052], [360, 1070], [470, 1110], [560, 1150], [640, 1196], [610, 1236], [520, 1262], [400, 1290], [260, 1330], [X0 - 10, 1350]];
  const trees = [];
  for (let k = 0; k < 220; k++) {
    const x = r.range(X0, 640), y = r.range(1030, 1330);
    // keep the tree inside the land
    let inside = false;
    for (let i = 0, j = land.length - 1; i < land.length; j = i++) { const [xi, yi] = land[i], [xj, yj] = land[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
    if (!inside) continue;
    trees.push([x, y, r.range(14, 34), r.int(0, 2)]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  p.group('park', boxOf(land, 80), (c) => {
    c.fillStyle = PINE_D; poly(c, land); c.fill();
    // the seawall's pale rim
    c.strokeStyle = WHITE; c.lineWidth = 4; c.beginPath(); land.slice(2, 10).forEach(([x, y], i) => (i ? c.lineTo(x, y + 2) : c.moveTo(x, y + 2))); c.stroke();
  }, { t: 5.4, d: 0.8, reveal: 'rise' });
  const tcols = [PINE, PINE_L, PINE_D];
  [0, 1].forEach((half) => {
    p.group('park', boxOf(land, 80), (c) => {
      for (const [x, y, h, k] of trees.filter((_, i) => i % 2 === half)) {
        c.fillStyle = tcols[k];
        path(c, [[x, y - h * 2.2], [x + h * 0.5, y - h * 0.9], [x + h * 0.3, y - h * 0.9], [x + h * 0.6, y], [x - h * 0.6, y], [x - h * 0.3, y - h * 0.9], [x - h * 0.5, y - h * 0.9]]); c.fill();
      }
    }, { t: 5.8 + half * 0.4, d: 0.8, reveal: 'rise' });
  });
  // Brockton Point's lighthouse: a red and white square tower on an arch
  const lx = 628, ly = 1200;
  p.group('park', { x: lx - 30, y: ly - 90, w: 60, h: 96 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(lx - 14, ly - 40, 28, 40);
    c.fillStyle = NAVY; c.beginPath(); c.moveTo(lx - 8, ly); c.lineTo(lx - 8, ly - 14); c.arc(lx, ly - 14, 8, Math.PI, 0); c.lineTo(lx + 8, ly); c.fill();
    c.fillStyle = WHITE; c.fillRect(lx - 9, ly - 70, 18, 30);
    c.fillStyle = RED; c.fillRect(lx - 9, ly - 62, 18, 6); c.fillRect(lx - 12, ly - 74, 24, 5);
    c.fillStyle = MUST; c.fillRect(lx - 6, ly - 84, 12, 10);
    c.fillStyle = RED; path(c, [[lx - 8, ly - 84], [lx + 8, ly - 84], [lx, ly - 92]]); c.fill();
  }, { t: 6.6, d: 0.6, reveal: 'rise' });
}

// ================================================================ the freighter at anchor
function freighter(p, r) {
  const x0 = 470, x1 = 1010, wl = 1462;
  const boxCols = Array.from({ length: 39 }, () => r.int(0, 6));
  const hull = [[x0, wl - 50], [x0 + 30, wl - 54], [x1 - 40, wl - 46], [x1, wl - 50], [x1 - 14, wl], [x0 + 40, wl]];
  p.group('ship', { x: x0 - 20, y: wl - 220, w: x1 - x0 + 40, h: 280 }, (c) => {
    // reflection in broken bars
    c.fillStyle = TEAL_D;
    for (let k = 0; k < 6; k++) c.fillRect(x0 + 40 + k * 8, wl + 6 + k * 9, x1 - x0 - 80 - k * 16, 4);
    c.fillStyle = RED; poly(c, hull); c.fill();
    c.fillStyle = NAVY; path(c, [[x0 + 24, wl - 14], [x1 - 8, wl - 14], [x1 - 14, wl], [x0 + 40, wl]]); c.fill();
    c.fillStyle = WHITE; path(c, [[x0, wl - 50], [x0 + 30, wl - 54], [x1 - 40, wl - 46], [x1, wl - 50], [x1, wl - 54], [x0, wl - 54]]); c.fill();
    // the bridge house at the stern, and its funnel
    const bx = x1 - 110;
    c.fillStyle = WHITE; c.fillRect(bx, wl - 120, 80, 70); c.fillRect(bx - 10, wl - 140, 92, 22); c.fillRect(bx + 10, wl - 156, 60, 16);
    c.fillStyle = NAVY; for (let k = 0; k < 6; k++) c.fillRect(bx - 4 + k * 14, wl - 134, 9, 8);
    for (let k = 0; k < 5; k++) c.fillRect(bx + 6 + k * 14, wl - 104, 8, 6);
    c.fillStyle = MUST; c.fillRect(bx + 26, wl - 198, 30, 42);
    c.fillStyle = NAVY; c.fillRect(bx + 24, wl - 204, 34, 10);
    c.fillRect(bx + 38, wl - 230, 2, 74);
    // containers stacked on deck, and two cranes
    const cc = [ORANGE, TEAL, MUST, NAVY_L, RED, WHITE, TEAL_L];
    for (let k = 0; k < 13; k++) for (let j = 0; j < 2 + (k % 3 ? 1 : 0); j++) {
      c.fillStyle = cc[boxCols[(k * 3 + j) % boxCols.length]]; c.fillRect(x0 + 60 + k * 26, wl - 74 - j * 18, 24, 16);
    }
    c.fillStyle = NAVY;
    for (const cx of [x0 + 140, x0 + 300]) { c.fillRect(cx, wl - 140, 6, 86); path(c, [[cx + 3, wl - 140], [cx + 70, wl - 104], [cx + 68, wl - 100], [cx + 3, wl - 132]]); c.fill(); }
    // the bow's anchor chain
    c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 28, wl - 40); c.lineTo(x0 + 10, wl + 4); c.stroke();
  }, { t: 7.8, d: 1.0, reveal: 'slide', dx: 120 });
}

// ================================================================ sailboats and a tug
function boats(p, r) {
  const sails = [[420, 1370, 1], [560, 1330, 0.8], [1180, 1420, 0.9], [300, 1560, 1.2], [1300, 1600, 1.3]];
  sails.forEach(([x, y, s], i) => {
    p.group('boats', { x: x - 40 * s, y: y - 100 * s, w: 80 * s, h: 110 * s }, (c) => {
      c.fillStyle = WHITE; path(c, [[x, y - 90 * s], [x, y - 14 * s], [x + 34 * s, y - 14 * s]]); c.fill();
      c.fillStyle = i % 2 ? ORANGE : MUST; path(c, [[x - 3 * s, y - 80 * s], [x - 3 * s, y - 14 * s], [x - 26 * s, y - 14 * s]]); c.fill();
      c.fillStyle = NAVY; path(c, [[x - 30 * s, y - 10 * s], [x + 36 * s, y - 10 * s], [x + 26 * s, y], [x - 22 * s, y]]); c.fill();
      c.fillStyle = TEAL_D; c.fillRect(x - 20 * s, y + 4 * s, 40 * s, 2 * s); c.fillRect(x - 12 * s, y + 10 * s, 24 * s, 2 * s);
    }, { t: 8.4 + i * 0.15, d: 0.5, reveal: 'pop' });
  });
  // a tug pushing white water
  p.group('boats', { x: 1060, y: 1500, w: 200, h: 70 }, (c) => {
    const x = 1150, y = 1556;
    c.fillStyle = WHITE; path(c, [[x - 70, y], [x - 120, y + 6], [x - 60, y + 6]]); c.fill();
    c.fillStyle = RED; path(c, [[x - 60, y - 16], [x + 50, y - 16], [x + 40, y], [x - 50, y]]); c.fill();
    c.fillStyle = WHITE; c.fillRect(x - 10, y - 40, 40, 24); c.fillStyle = NAVY; c.fillRect(x - 4, y - 34, 28, 6);
    c.fillStyle = MUST; c.fillRect(x - 30, y - 34, 12, 18);
  }, { t: 9.1, d: 0.5, reveal: 'pop' });
}

// ================================================================ the foreground: the seawall and a tall cedar
function near(p, r) {
  // the seawall: a pale walk with a rail, lamp posts, walkers
  p.group('near', { x: X0, y: SEAWALL - 40, w: X1 - X0, h: Y1 - SEAWALL + 40 }, (c) => {
    c.fillStyle = mix(PAPER, SLATE, 0.25); c.fillRect(X0, SEAWALL, X1 - X0, Y1 - SEAWALL);
    c.fillStyle = SLATE_D; c.fillRect(X0, SEAWALL, X1 - X0, 10);
    c.fillStyle = WHITE; c.fillRect(X0, SEAWALL + 40, X1 - X0, 3);
    c.fillStyle = NAVY; c.fillRect(X0, SEAWALL - 26, X1 - X0, 3); c.fillRect(X0, SEAWALL - 12, X1 - X0, 2);
    for (let x = X0 + 10; x < X1; x += 40) c.fillRect(x, SEAWALL - 26, 3, 26);
  }, { t: 9.0, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  const lamps = [520, 900, 1280];
  p.group('near', { x: X0, y: SEAWALL - 150, w: X1 - X0, h: 160 }, (c) => {
    for (const x of lamps) {
      c.fillStyle = NAVY; c.fillRect(x - 2, SEAWALL - 130, 4, 130); c.fillRect(x - 2, SEAWALL - 130, 30, 4);
      c.fillStyle = MUST; c.beginPath(); c.arc(x + 26, SEAWALL - 122, 7, 0, Math.PI); c.fill();
    }
  }, { t: 9.3, d: 0.5, reveal: 'rise' });
  const walkers = [[640, 1, ORANGE], [670, 1, TEAL], [1080, -1, MUST], [1400, -1, RED], [1430, -1, NAVY_L]];
  p.group('near', { x: X0, y: SEAWALL - 80, w: X1 - X0, h: 120 }, (c) => {
    for (const [x, d, col] of walkers) {
      const y = SEAWALL + 30;
      c.fillStyle = NAVY; c.fillRect(x - 5, y - 26, 4, 26); c.fillRect(x + 1, y - 26, 4, 26);
      c.fillStyle = col; path(c, [[x - 8, y - 26], [x + 8, y - 26], [x + 6, y - 58], [x - 6, y - 58]]); c.fill();
      c.fillStyle = NAVY; c.beginPath(); c.arc(x, y - 66, 7, 0, Math.PI * 2); c.fill();
    }
    // a dog on a lead
    c.fillStyle = NAVY; c.fillRect(1100, SEAWALL + 16, 20, 8); c.fillRect(1100, SEAWALL + 24, 3, 6); c.fillRect(1117, SEAWALL + 24, 3, 6); c.fillRect(1098, SEAWALL + 10, 6, 8);
    c.strokeStyle = NAVY; c.lineWidth = 1; c.beginPath(); c.moveTo(1086, SEAWALL - 10); c.lineTo(1100, SEAWALL + 12); c.stroke();
  }, { t: 9.6, d: 0.5, reveal: 'fade' });
  // the cedar: a dark trunk and drooping tiers of branches on the left edge
  const cx = 168;
  const tiers = [];
  for (let k = 0; k < 24; k++) {
    const y = 290 + k * 60, w = 46 + k * 9.5 + r.range(-10, 10), droop = 30 + k * 1.6;
    tiers.push([y, w, droop, r() < 0.5]);
  }
  p.group('near', { x: X0 - 10, y: 230, w: 380, h: Y1 - 230 }, (c) => {
    c.fillStyle = '#5a3a2a'; path(c, [[cx - 8, 260], [cx + 8, 260], [cx + 20, Y1], [cx - 20, Y1]]); c.fill();
    for (const [y, w, droop, flip] of tiers) {
      for (const s of [-1, 1]) {
        const ww = w * (s === (flip ? 1 : -1) ? 1 : 0.8);
        c.fillStyle = PINE_D;
        c.beginPath(); c.moveTo(cx, y - 8); c.quadraticCurveTo(cx + s * ww * 0.6, y - 18, cx + s * ww, y + droop); c.lineTo(cx + s * ww * 0.85, y + droop + 8); c.quadraticCurveTo(cx + s * ww * 0.5, y + 10, cx, y + 26); c.fill();
        c.fillStyle = PINE;
        c.beginPath(); c.moveTo(cx, y - 4); c.quadraticCurveTo(cx + s * ww * 0.55, y - 12, cx + s * ww * 0.92, y + droop - 2); c.quadraticCurveTo(cx + s * ww * 0.5, y + 2, cx, y + 12); c.fill();
        // fronds hanging from the branch
        c.strokeStyle = PINE_D; c.lineWidth = 2; c.beginPath();
        for (let t = 0.3; t < 1; t += 0.14) { const fx = cx + s * ww * t, fy = y + droop * t * t + 2; c.moveTo(fx, fy); c.lineTo(fx - s * 3, fy + 18); }
        c.stroke();
      }
    }
    c.fillStyle = PINE_D; path(c, [[cx, 230], [cx + 16, 310], [cx - 16, 310]]); c.fill();
  }, { t: 8.0, d: 1.4, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ live: a plane taking off, one high up, gulls, a cyclist on the seawall
function live(p, r) {
  // takes off from the right, runs on the water, lifts and climbs away to the left, every 14 s
  p.live('live', {
    t: 10.0, d: 1.0, reveal: 'fade',
    box: { x: X0, y: Y0, w: X1 - X0, h: 1400 },
    draw: (c, time) => {
      const u = ((time - 10) % 14) / 14;
      const x = lerp(1440, 300, u), lift = Math.max(0, u - 0.35);
      const y = 1360 - lift * lift * 6000, s = 1.1 - lift * 0.6;
      if (y < Y0 - 60) return;
      if (lift < 0.05) {
        // the wake
        c.fillStyle = WHITE; c.beginPath(); c.moveTo(x + 30, y + 2); c.lineTo(x + 30 + 140 * (1 - lift * 20), y + 8); c.lineTo(x + 30 + 120 * (1 - lift * 20), y - 1); c.fill();
      }
      c.save(); c.translate(x, y); c.rotate(lift * 0.4); c.translate(-x, -y);
      seaplane(c, x, y, s, -1, ORANGE, time * 40);
      c.restore();
    },
  });
  // a plane crossing high in the sky
  p.live('live', {
    t: 10.4, d: 1.0, reveal: 'fade',
    box: { x: X0, y: Y0, w: X1 - X0, h: 700 },
    draw: (c, time) => {
      const x = X0 - 80 + ((time * 50) % (X1 - X0 + 160)), y = 700 - 40 * Math.sin(time * 0.3);
      seaplane(c, x, y, 0.55, 1, RED, time * 40);
    },
  });
  // gulls
  const gulls = [];
  for (let k = 0; k < 6; k++) gulls.push([r.range(500, 1400), r.range(1100, 1500), r() * 6, r.range(0.4, 0.8)]);
  p.live('live', {
    t: 10.2, d: 1.0, reveal: 'fade',
    box: { x: X0, y: 1000, w: X1 - X0, h: 600 },
    draw: (c, time) => {
      c.strokeStyle = WHITE; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      for (const [x0, y0, ph, sp] of gulls) {
        const x = x0 + Math.sin(time * 0.2 * sp + ph) * 90, y = y0 + Math.cos(time * 0.3 * sp + ph) * 30, f = Math.sin(time * 5 + ph) * 6;
        c.moveTo(x - 16, y - 2 - f); c.quadraticCurveTo(x - 8, y - 10 - f, x, y); c.quadraticCurveTo(x + 8, y - 10 - f, x + 16, y - 2 - f);
      }
      c.stroke();
    },
  });
  // a cyclist riding the seawall
  p.live('live', {
    t: 10.6, d: 1.0, reveal: 'fade',
    box: { x: X0, y: SEAWALL - 40, w: X1 - X0, h: 120 },
    draw: (c, time) => {
      const x = X0 - 60 + ((time * 80) % (X1 - X0 + 120)), y = SEAWALL + 46;
      c.strokeStyle = NAVY; c.lineWidth = 2.4; c.beginPath();
      c.arc(x - 16, y - 10, 10, 0, Math.PI * 2); c.moveTo(x + 26, y - 10); c.arc(x + 16, y - 10, 10, 0, Math.PI * 2);
      c.moveTo(x - 16, y - 10); c.lineTo(x, y - 10); c.lineTo(x + 10, y - 26); c.lineTo(x - 6, y - 26); c.lineTo(x, y - 10); c.moveTo(x + 10, y - 26); c.lineTo(x + 16, y - 10);
      const k = Math.sin(time * 7) * 5;
      c.moveTo(x - 4, y - 44); c.lineTo(x + k, y - 14); c.moveTo(x - 4, y - 44); c.lineTo(x - k, y - 12);
      c.stroke();
      c.fillStyle = ORANGE; path(c, [[x - 8, y - 46], [x + 2, y - 46], [x + 10, y - 66], [x, y - 68]]); c.fill();
      c.fillStyle = NAVY; c.beginPath(); c.arc(x + 6, y - 74, 6, 0, Math.PI * 2); c.fill();
    },
  });
}

// ================================================================ the name, condensed, across the sky
function title(p) {
  p.type('title', 'VANCOUVER', W / 2 + 60, 420, { size: 340, family: FACE, weight: 800, color: NAVY, align: 'center', track: -0.005, fit: X1 - X0 - 260, t: 10.8, gap: 0.12, d: 0.6, reveal: 'rise' });
  p.group('title', { x: 400, y: 100, w: 900, h: 70 }, (c) => {
    c.fillStyle = ORANGE; c.fillRect(W / 2 + 60 - 470, 138, 160, 10);
    c.fillStyle = MUST; c.fillRect(W / 2 + 60 - 300, 138, 60, 10);
    c.fillStyle = TEAL; c.fillRect(W / 2 + 60 - 230, 138, 24, 10);
  }, { t: 12.2, d: 0.5, reveal: 'wipe' });
  p.type('title', 'BRITISH COLUMBIA · CANADA', W / 2 + 60 + 470, 150, { size: 40, family: FACE, weight: 600, color: NAVY, align: 'right', track: 0.18, t: 12.4, gap: 0.03, d: 0.4, reveal: 'fade' });
}

// ================================================================ the cream band: a keyline, a few words, color chips
function band(p) {
  p.group('band', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 2; c.strokeRect(X0 - 14, Y0 - 14, X1 - X0 + 28, Y1 - Y0 + 28);
  }, { t: 0.0, d: 0.5, reveal: 'fade' });
  p.type('band', 'FLY · SAIL · WALK THE SEAWALL', X0, 1880, { size: 44, family: FACE, weight: 600, color: NAVY, track: 0.14, t: 12.8, gap: 0.025, d: 0.4, reveal: 'fade' });
  p.group('band', { x: X1 - 300, y: 1840, w: 300, h: 60 }, (c) => {
    [ORANGE, MUST, TEAL, PINE, NAVY].forEach((col, i) => { c.fillStyle = col; c.fillRect(X1 - 250 + i * 50, 1846, 42, 42); });
  }, { t: 13.2, d: 0.6, reveal: 'wipe' });
}
