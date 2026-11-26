// Stockholm: a Swedish functionalist poster, clean and light, of a still summer
// morning on Riddarfjärden. On the left, close across the water, the City Hall's
// brick tower with its copper lantern and three gold crowns; across the bay the
// island of Gamla stan: ochre, saffron and rust facades stacked up the hill, the
// Riddarholmen Church's openwork iron spire, the German Church's green needle,
// Storkyrkan's tower and the long block of the Royal Palace. Everything stands
// in a crisp mirror on the water; white ferries cross it. Shapes are flat and
// exact, light comes from the left, and the name is set big under the picture.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix, rng } from '../kit.js';

const PAPER = '#f3f0e8', INK = '#17345e', NAVY = '#17345e';
const SKY0 = '#8fbfe0', SKY1 = '#e6eff0';
const WATER0 = '#5b8fb8', WATER1 = '#1f4c7c';
const BRICK = '#a9442c', COPPER = '#5f9e8c', GOLD = '#e0b341', STONE = '#e7d9b6';
const FACES = ['#d9a441', '#e8bd57', '#c8653d', '#efd590', '#b84d31', '#e9dcc0', '#d58a3e', '#c9a77a', '#e3c27a'];
const ROOFS = ['#3d4a4f', '#8a3a28', '#4f5d5b', '#6d3426'];
const FACE = '"Red Hat Display", sans-serif';

export const city = {
  id: 'stockholm', name: 'Stockholm', wall: '#16304f',
  alt: 'A clean, light functionalist poster of Stockholm on a summer morning: the City Hall\'s brick tower with its copper lantern and three gold crowns on the left, and across Riddarfjärden the ochre and rust houses of Gamla stan with the Riddarholmen Church\'s openwork iron spire, the German Church\'s green spire, Storkyrkan\'s tower and the Royal Palace, all mirrored in the still water, with white ferries, a sailboat and gulls, the name set large beneath',
  google: 'family=Red+Hat+Display:wght@500;900',
  fonts: [['900 100px "Red Hat Display"', 'STOCKHOLM'], ['500 100px "Red Hat Display"', 'RIDDARFJÄRDEN · GAMLA STAN · STADSHUSET 1923 59°19′N']],
  build,
};

const X0 = 80, Y0 = 80, X1 = W - 80, Y1 = 1580;
const SHORE = 1010;  // Gamla stan's quay
const HALL = 1090;   // the City Hall's foot, nearer

function build() {
  const p = new Plate({ paper: PAPER, seed: 1923 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'far', 'spires', 'old', 'quay', 'water', 'refl', 'ripple', 'hall', 'hallx', 'live', 'title');
  p.layer('title', { clip: false });

  const mirror = []; // shapes to reflect: [pts, color]
  sky(p, r);
  far(p, r, mirror);
  gamla(p, r, mirror);
  hall(p, r, mirror);
  water(p, r, mirror);
  life(p, r);
  title(p);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function fillPts(c, pts, col) { c.fillStyle = col; poly(c, pts); c.fill(); }
// a grid of window panes as one path
function panes(c, x, y, w, h, cols, rows, col, fx = 0.42, fy = 0.5) {
  const dx = w / cols, dy = h / rows;
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) c.rect(x + i * dx + dx * (1 - fx) / 2, y + j * dy + dy * (1 - fy) / 2, dx * fx, dy * fy);
  c.fill();
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: SHORE - Y0 + 40 }, (c) => {
    const g = c.createLinearGradient(0, Y0, 0, SHORE);
    g.addColorStop(0, SKY0); g.addColorStop(0.75, SKY1); g.addColorStop(1, '#f1f1e8');
    c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, SHORE - Y0 + 40);
  }, { t: 0.1, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // fine ruled lines in the upper sky: the light, set like a grid
  const rules = [];
  for (let y = Y0 + 30; y < 520; y += 14) rules.push([[X0, y], [X1, y]]);
  p.strokes('sky', rules, 'rgba(255,255,255,.22)', 2, { t: 1.0, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the morning light: two broad, exact beams falling from the upper left
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: SHORE - Y0 }, (c) => {
    c.fillStyle = 'rgba(255,253,240,.16)';
    poly(c, [[X0, Y0 + 80], [X0 + 260, Y0], [X1, 760], [X1, 960]]); c.fill();
    c.fillStyle = 'rgba(255,253,240,.11)';
    poly(c, [[X0 + 420, Y0], [X0 + 560, Y0], [X1, 420], [X1, 520]]); c.fill();
  }, { t: 1.2, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  // long flat clouds: capsules with a shaded underside
  const clouds = [[180, 250, 380, 34], [620, 190, 300, 26], [980, 300, 460, 40], [1180, 160, 230, 22], [300, 420, 260, 24], [820, 470, 340, 28], [1240, 520, 200, 20]];
  clouds.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - 10, y: y - h - 10, w: w + 20, h: h * 2 + 20 }, (c) => {
      const cap = (yy, hh, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, yy, w, hh, hh / 2); c.fill(); };
      cap(y, h, 'rgba(160,190,214,.55)');
      cap(y - h * 0.32, h, '#fbfbf6');
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(x + w * 0.18, y - h * 0.72, w * 0.5, h * 0.8, h * 0.4); c.fill();
    }, { t: 1.3 + i * 0.18, d: 1.2, reveal: 'slide', dx: -60, ease: 'out' });
  });
}

// ================================================================ the far shore
function far(p, r, mirror) {
  // Södermalm's and Skeppsholmen's low far rim, pale blue
  const pts = [[X0, SHORE - 40]];
  for (let x = X0; x <= X1; x += 22) {
    const h = 34 + 20 * Math.sin(x * 0.006) + r.range(0, 12) + (r.chance(0.15) ? r.range(10, 28) : 0);
    pts.push([x, SHORE - h], [x + 22, SHORE - h]);
  }
  pts.push([X1, SHORE], [X0, SHORE]);
  p.fill('far', pts, '#b6cbd8', { t: 1.6, d: 1.0, reveal: 'rise' });
  // a few far spires and a dome
  p.group('far', { x: 900, y: 820, w: 600, h: 200 }, (c) => {
    c.fillStyle = '#a3bccd';
    poly(c, [[960, SHORE - 50], [968, 880], [976, SHORE - 50]]); c.fill();
    c.beginPath(); c.arc(1420, SHORE - 66, 22, Math.PI, 0); c.fill();
    c.fillRect(1398, SHORE - 66, 44, 30);
    poly(c, [[1424 - 2, SHORE - 88], [1420, SHORE - 112], [1418 + 4, SHORE - 88]]); c.fill();
  }, { t: 2.0, d: 0.8, reveal: 'rise' });
}

// ================================================================ Gamla stan
function gamla(p, r, mirror) {
  // landmarks behind the houses
  riddarholm(p, r, mirror);
  tyska(p, r, mirror);
  storkyrkan(p, r, mirror);

  // the houses: stepped up the hill toward the middle of the island
  const houses = [];
  let x = 600;
  while (x < X1 + 20) {
    const w = r.range(34, 72);
    const hill = Math.sin(clamp((x - 600) / 820) * Math.PI) * 110;
    const h = r.range(70, 120) + hill;
    houses.push({ x, w, h, col: FACES[r.int(0, FACES.length - 1)], roof: ROOFS[r.int(0, ROOFS.length - 1)], gable: r.chance(0.35), rows: Math.max(3, Math.round(h / 24)), cols: Math.max(2, Math.round(w / 16)), chim: r.chance(0.5) ? r.range(0.2, 0.8) : -1 });
    x += w;
  }
  // two back rows, higher up the hill and paler, roofs and chimneys
  const back = [];
  for (const [row, lift, fade] of [[0, 230, 0.45], [1, 150, 0.22]]) {
    for (let bx = 720 + row * 20; bx < 1360; bx += r.range(36, 62)) {
      const hill = Math.sin(clamp((bx - 640) / 760) * Math.PI);
      back.push({ x: bx, w: r.range(40, 66), h: lift * (0.55 + 0.6 * hill) + 60 + r.range(0, 26), col: mix(FACES[r.int(0, FACES.length - 1)], SKY1, fade), roof: mix(ROOFS[r.int(0, 3)], SKY1, fade), row, ch: r.chance(0.6) });
    }
  }
  back.forEach((b, i) => {
    const y = SHORE - b.h;
    p.group('old', { x: b.x - 4, y: y - 40, w: b.w + 8, h: b.h + 44 }, (c) => {
      fillPts(c, rect(b.x, y, b.w, b.h), b.col);
      c.fillStyle = 'rgba(40,30,40,.12)'; c.fillRect(b.x + b.w - 6, y, 6, b.h);
      fillPts(c, [[b.x - 2, y], [b.x + b.w + 2, y], [b.x + b.w - 9, y - 20], [b.x + 9, y - 20]], b.roof);
      if (b.ch) { c.fillStyle = b.roof; c.fillRect(b.x + b.w * 0.3, y - 32, 6, 14); c.fillRect(b.x + b.w * 0.68, y - 28, 6, 10); }
      panes(c, b.x + 4, y + 8, b.w - 8, Math.min(b.h - 20, 90), Math.round(b.w / 14), 4, 'rgba(40,60,80,.4)');
    }, { t: 2.2 + b.row * 0.4 + (b.x - 720) / 640 * 1.2, d: 0.9, reveal: 'rise' });
  });
  // boats moored along the quay
  const moored = [];
  for (let mx = 820; mx < X1 - 40; mx += r.range(60, 120)) moored.push([mx, r.range(30, 52), r.pick(['#f3f0e8', '#1d2a40', '#b84d31', '#e8bd57']), r.chance(0.4)]);
  p.group('hallx', { x: 800, y: SHORE - 70, w: X1 - 800, h: 100 }, (c) => {
    for (const [mx, L, col, mast] of moored) {
      c.fillStyle = col; poly(c, [[mx - L / 2, SHORE + 12], [mx + L / 2, SHORE + 12], [mx + L / 2 - 6, SHORE + 22], [mx - L / 2 + 4, SHORE + 22]]); c.fill();
      c.fillStyle = '#f3f0e8'; c.fillRect(mx - L * 0.2, SHORE + 4, L * 0.3, 8);
      if (mast) { c.fillStyle = '#2b3448'; c.fillRect(mx - 1, SHORE - 60, 2, 72); }
    }
  }, { t: 8.8, d: 0.8, reveal: 'fade' });
  houses.forEach((h, i) => {
    const y = SHORE - h.h;
    mirror.push([rect(h.x, y, h.w, h.h), h.col]);
    p.group('old', { x: h.x - 6, y: y - 46, w: h.w + 12, h: h.h + 50 }, (c) => {
      fillPts(c, rect(h.x, y, h.w, h.h), h.col);
      // the lit left edge and the shadowed right: light from the left
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(h.x, y, 4, h.h);
      c.fillStyle = 'rgba(40,30,40,.16)'; c.fillRect(h.x + h.w - 7, y, 7, h.h);
      // the roof
      if (h.gable) fillPts(c, [[h.x, y], [h.x + h.w / 2, y - h.w * 0.55], [h.x + h.w, y]], h.roof);
      else fillPts(c, [[h.x - 2, y], [h.x + h.w + 2, y], [h.x + h.w - 10, y - 22], [h.x + 10, y - 22]], h.roof);
      if (h.chim > 0) { c.fillStyle = shade(h.roof, 0.8); c.fillRect(h.x + h.w * h.chim, y - 34, 7, 22); }
      // windows, a band of cornice and a door
      panes(c, h.x + 3, y + 8, h.w - 6, h.h - 34, h.cols, h.rows, 'rgba(32,46,72,.72)', 0.44, 0.52);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(h.x, y + 3, h.w, 2);
      c.fillStyle = shade(h.col, 0.7); c.fillRect(h.x, SHORE - 22, h.w, 3);
      c.fillStyle = '#2b3448'; c.fillRect(h.x + h.w / 2 - 5, SHORE - 18, 10, 18);
    }, { t: 2.6 + i * 0.1, d: 0.9, reveal: 'rise' });
  });
  palace(p, r, mirror);
  // the quay: granite, trees, lamps, people
  p.group('quay', { x: 590, y: SHORE - 8, w: X1 - 590 + 10, h: 26 }, (c) => {
    c.fillStyle = '#cfc6b4'; c.fillRect(590, SHORE - 2, X1 - 590, 12);
    c.fillStyle = '#8c8676'; c.fillRect(590, SHORE + 8, X1 - 590, 4);
  }, { t: 4.4, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  const trees = [];
  for (let tx = 640; tx < 1260; tx += r.range(38, 70)) if (!(tx > 680 && tx < 770)) trees.push([tx, r.range(16, 22)]);
  trees.forEach(([tx, rad], i) => {
    p.group('quay', { x: tx - rad - 4, y: SHORE - rad * 3 - 4, w: rad * 2 + 8, h: rad * 3 + 10 }, (c) => {
      c.fillStyle = '#4d3a2c'; c.fillRect(tx - 1.5, SHORE - rad * 1.2, 3, rad * 1.2);
      c.fillStyle = '#3f7a52'; c.beginPath(); c.arc(tx, SHORE - rad * 1.7, rad, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6da36a'; c.beginPath(); c.arc(tx - rad * 0.3, SHORE - rad * 1.95, rad * 0.6, 0, Math.PI * 2); c.fill();
    }, { t: 7.6 + i * 0.06, d: 0.6, reveal: 'pop' });
    mirror.push([rect(tx - rad, SHORE - rad * 2.7, rad * 2, rad * 2.7), '#3f7a52']);
  });
  // lamps and walkers as one group
  const folk = [];
  for (let i = 0; i < 46; i++) folk.push([r.range(610, X1 - 10), r.pick(['#17345e', '#b84d31', '#2b3448', '#f3f0e8', '#d9a441']), r.range(9, 12)]);
  p.group('quay', { x: 600, y: SHORE - 30, w: X1 - 600, h: 32 }, (c) => {
    for (const [fx, col, h] of folk) {
      c.fillStyle = col; c.fillRect(fx - 1.6, SHORE - h + 2, 3.2, h - 5);
      c.fillStyle = '#2b2a30'; c.beginPath(); c.arc(fx, SHORE - h + 1, 1.8, 0, Math.PI * 2); c.fill();
      c.fillRect(fx - 1.3, SHORE - 3, 1.1, 3); c.fillRect(fx + 0.3, SHORE - 3, 1.1, 3);
    }
    c.fillStyle = '#2b3448';
    for (let lx = 620; lx < X1; lx += 96) { c.fillRect(lx, SHORE - 30, 2, 28); c.fillRect(lx - 3, SHORE - 32, 8, 4); }
  }, { t: 8.4, d: 1.0, reveal: 'fade' });
}

function riddarholm(p, r, mirror) {
  // the Riddarholmen Church: brick nave, square tower, openwork cast-iron spire
  const cx = 720, base = SHORE, tw = 62, top = 640, tip = 330;
  const nave = rect(640, base - 210, 170, 210);
  const tower = rect(cx - tw / 2, top, tw, base - top);
  mirror.push([nave, BRICK], [tower, BRICK], [[[cx - 30, top], [cx, tip], [cx + 30, top]], '#34424c']);
  p.group('spires', { x: 630, y: base - 260, w: 190, h: 262 }, (c) => {
    fillPts(c, nave, BRICK);
    fillPts(c, [[636, base - 210], [725, base - 258], [814, base - 210]], '#4f5d5b');
    c.fillStyle = shade(BRICK, 0.75);
    for (let i = 0; i < 5; i++) { c.beginPath(); c.roundRect(650 + i * 32, base - 180, 12, 60, [6, 6, 0, 0]); c.fill(); }
  }, { t: 3.2, d: 1.0, reveal: 'rise' });
  p.group('spires', { x: cx - 40, y: top - 10, w: 80, h: base - top + 12 }, (c) => {
    fillPts(c, tower, BRICK);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(cx - tw / 2, top, 6, base - top);
    c.fillStyle = shade(BRICK, 0.7);
    for (let y = top + 30; y < base - 220; y += 54) { c.beginPath(); c.roundRect(cx - 8, y, 16, 34, [8, 8, 0, 0]); c.fill(); }
    // little corner gables
    c.fillStyle = '#4f5d5b';
    poly(c, [[cx - tw / 2 - 4, top], [cx - tw / 2 + 10, top - 22], [cx - tw / 2 + 24, top]]); c.fill();
    poly(c, [[cx + tw / 2 - 24, top], [cx + tw / 2 - 10, top - 22], [cx + tw / 2 + 4, top]]); c.fill();
  }, { t: 3.6, d: 1.2, reveal: 'rise' });
  // the iron spire: a dark cone of cast iron, cut through with openwork
  const cone = [[cx - 30, top], [cx - 6, tip + 40], [cx, tip], [cx + 6, tip + 40], [cx + 30, top]];
  p.fill('spires', cone, '#34424c', { t: 4.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  const lat = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const y0 = lerp(top - 4, tip + 30, i / n), y1 = lerp(top - 4, tip + 30, (i + 1) / n);
    const w0 = 26 * (1 - i / n) + 2, w1 = 26 * (1 - (i + 1) / n) + 2;
    lat.push([[cx - w0, y0], [cx + w1, y1]], [[cx + w0, y0], [cx - w1, y1]]);
  }
  lat.push([[cx, top - 4], [cx, tip + 30]]);
  p.strokes('spires', lat, 'rgba(190,214,230,.75)', 1.6, { t: 5.5, d: 1.0, reveal: 'rise', box: { x: cx - 36, y: tip - 10, w: 72, h: top - tip + 20 } });
  // the gilded spike and a ring of little pinnacles at the foot
  p.group('spires', { x: cx - 40, y: tip - 34, w: 80, h: top - tip + 40 }, (c) => {
    c.fillStyle = '#34424c'; c.fillRect(cx - 1.5, tip - 30, 3, 32);
    c.fillStyle = GOLD; c.beginPath(); c.arc(cx, tip - 30, 3.5, 0, Math.PI * 2); c.fill();
    for (const dx of [-34, -18, 18, 34]) { poly(c, [[cx + dx - 4, top], [cx + dx, top - 26], [cx + dx + 4, top]]); c.fillStyle = '#34424c'; c.fill(); }
  }, { t: 6.0, d: 0.6, reveal: 'rise' });
}

function tyska(p, r, mirror) {
  // the German Church: brick tower and a tall green copper needle
  const cx = 1236, base = SHORE - 60, tw = 48, top = 600, tip = 300;
  mirror.push([rect(cx - tw / 2, top, tw, base - top), BRICK], [[[cx - 22, top], [cx, tip], [cx + 22, top]], COPPER]);
  p.group('spires', { x: cx - 40, y: tip - 20, w: 80, h: base - tip + 24 }, (c) => {
    fillPts(c, rect(cx - tw / 2, top, tw, base - top), '#b0503a');
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(cx - tw / 2, top, 6, base - top);
    c.fillStyle = shade(BRICK, 0.7);
    for (let y = top + 24; y < base - 100; y += 46) { c.beginPath(); c.roundRect(cx - 7, y, 14, 28, [7, 7, 0, 0]); c.fill(); }
    // the clock
    c.fillStyle = GOLD; c.beginPath(); c.arc(cx, top + 18, 9, 0, Math.PI * 2); c.fill();
    // the copper: a bell-shaped foot, a lantern, then the needle
    fillPts(c, [[cx - 28, top], [cx - 20, top - 30], [cx - 10, top - 44], [cx + 10, top - 44], [cx + 20, top - 30], [cx + 28, top]], COPPER);
    fillPts(c, rect(cx - 9, top - 70, 18, 26), COPPER);
    c.fillStyle = '#2c4f4a'; c.fillRect(cx - 4, top - 66, 8, 18);
    fillPts(c, [[cx - 12, top - 70], [cx, tip], [cx + 12, top - 70]], COPPER);
    c.fillStyle = 'rgba(0,40,40,.22)'; poly(c, [[cx, top - 70], [cx, tip], [cx + 12, top - 70]]); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(cx, tip - 4, 3.5, 0, Math.PI * 2); c.fill();
  }, { t: 4.0, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

function storkyrkan(p, r, mirror) {
  // Storkyrkan: a tall ochre tower with a copper cupola, lantern and obelisk top
  const cx = 1060, base = SHORE - 120, tw = 70, top = 560;
  mirror.push([rect(cx - tw / 2, top, tw, base - top), '#e2b45a']);
  p.group('spires', { x: cx - 52, y: top - 190, w: 104, h: base - top + 194 }, (c) => {
    fillPts(c, rect(cx - tw / 2, top, tw, base - top), '#e2b45a');
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(cx - tw / 2, top, 7, base - top);
    c.fillStyle = 'rgba(90,50,20,.18)'; c.fillRect(cx + tw / 2 - 10, top, 10, base - top);
    c.fillStyle = '#f2dfb0'; c.fillRect(cx - tw / 2 - 4, top, tw + 8, 8); c.fillRect(cx - tw / 2 - 2, top + 120, tw + 4, 5);
    c.fillStyle = '#3e4a5c';
    c.beginPath(); c.roundRect(cx - 10, top + 30, 20, 60, [10, 10, 0, 0]); c.fill();
    c.beginPath(); c.roundRect(cx - 8, top + 150, 16, 40, [8, 8, 0, 0]); c.fill();
    // the cupola
    c.fillStyle = COPPER;
    c.beginPath(); c.moveTo(cx - 40, top); c.bezierCurveTo(cx - 40, top - 50, cx - 18, top - 70, cx, top - 74); c.bezierCurveTo(cx + 18, top - 70, cx + 40, top - 50, cx + 40, top); c.fill();
    c.fillStyle = 'rgba(0,40,40,.2)';
    c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, top - 74); c.bezierCurveTo(cx + 18, top - 70, cx + 40, top - 50, cx + 40, top); c.fill();
    fillPts(c, rect(cx - 13, top - 110, 26, 38), COPPER);
    c.fillStyle = '#2c4f4a'; c.fillRect(cx - 5, top - 104, 10, 26);
    fillPts(c, [[cx - 18, top - 110], [cx, top - 128], [cx + 18, top - 110]], COPPER);
    fillPts(c, [[cx - 4, top - 128], [cx, top - 180], [cx + 4, top - 128]], COPPER);
    c.fillStyle = GOLD; c.beginPath(); c.arc(cx, top - 182, 4, 0, Math.PI * 2); c.fill();
  }, { t: 4.3, d: 1.5, reveal: 'rise', ease: 'inOut' });
}

function palace(p, r, mirror) {
  // the Royal Palace: a long pale block on the top of the island, at the right
  const x = 1330, y = SHORE - 300, w = X1 - x + 20, h = 300;
  mirror.push([rect(x, y, w, h), STONE]);
  p.group('old', { x: x - 6, y: y - 20, w: w + 12, h: h + 22 }, (c) => {
    fillPts(c, rect(x, y, w, h), STONE);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y, 6, h);
    // the balustrade, cornice and the stone base
    c.fillStyle = '#d2c299'; c.fillRect(x - 4, y - 12, w + 8, 12); c.fillRect(x, y + 36, w, 5); c.fillRect(x, SHORE - 80, w, 80);
    c.fillStyle = '#b9a87f';
    for (let bx = x; bx < x + w; bx += 9) c.fillRect(bx, y - 10, 4, 8);
    // pilasters
    c.fillStyle = 'rgba(160,140,100,.3)';
    for (let px = x + 20; px < x + w; px += 64) c.fillRect(px, y + 40, 8, h - 120);
    panes(c, x + 6, y + 50, w - 12, h - 140, Math.round(w / 21), 5, '#5d6a7a', 0.42, 0.56);
    panes(c, x + 6, SHORE - 72, w - 12, 60, Math.round(w / 21), 2, '#7c7a70', 0.3, 0.4);
    // the projecting middle bay, a shade warmer, with its pediment
    c.fillStyle = 'rgba(200,170,110,.22)'; c.fillRect(x + 50, y - 12, 80, h + 12);
    fillPts(c, [[x + 44, y - 12], [x + 90, y - 38], [x + 136, y - 12]], '#d2c299');
  }, { t: 5.0, d: 1.4, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the City Hall
function hall(p, r, mirror) {
  // the long body along the water, with the arcade on the quay
  const bx = X0 - 10, bw = 560, top = HALL - 190;
  mirror.push([rect(bx, top, bw, 190), BRICK]);
  p.group('hall', { x: bx - 4, y: top - 50, w: bw + 10, h: 196 + 60 }, (c) => {
    fillPts(c, rect(bx, top, bw, 190), BRICK);
    // copper roof with dormers
    fillPts(c, [[bx, top], [bx + bw, top], [bx + bw - 14, top - 28], [bx, top - 28]], COPPER);
    c.fillStyle = '#4b8676';
    for (let x = bx + 20; x < bx + bw - 30; x += 40) c.fillRect(x, top - 22, 14, 14);
    // windows in long ranks
    panes(c, bx + 10, top + 20, bw - 20, 80, 22, 3, '#3a2a30', 0.4, 0.58);
    // the open arcade on the water, white columns
    c.fillStyle = '#5a2a20'; c.fillRect(bx, HALL - 62, bw, 62);
    c.fillStyle = '#efe6d2';
    for (let x = bx + 8; x < bx + bw; x += 34) c.fillRect(x, HALL - 62, 8, 62);
    c.fillRect(bx, HALL - 66, bw, 6);
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(bx, top, bw, 5);
  }, { t: 5.2, d: 1.3, reveal: 'rise', ease: 'inOut' });

  // the little east tower, with its gilded lantern
  const ex = 560;
  mirror.push([rect(ex - 26, top - 130, 52, 130), BRICK]);
  p.group('hall', { x: ex - 40, y: top - 230, w: 80, h: 236 }, (c) => {
    fillPts(c, rect(ex - 26, top - 130, 52, 136), '#b24b31');
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(ex - 26, top - 130, 5, 136);
    c.fillStyle = '#3a2a30'; c.fillRect(ex - 5, top - 110, 10, 40);
    c.fillStyle = COPPER; c.beginPath(); c.moveTo(ex - 30, top - 130); c.quadraticCurveTo(ex - 28, top - 170, ex, top - 178); c.quadraticCurveTo(ex + 28, top - 170, ex + 30, top - 130); c.fill();
    c.fillStyle = GOLD; c.fillRect(ex - 6, top - 210, 12, 34); c.beginPath(); c.arc(ex, top - 214, 7, 0, Math.PI * 2); c.fill();
  }, { t: 6.0, d: 1.1, reveal: 'rise' });

  // the great tower: a square brick shaft, slit windows, the open gallery, the
  // copper lantern in steps, and the three crowns on the top
  const cx = 300, tw = 132, shaftTop = 470, foot = top;
  mirror.push([rect(cx - tw / 2, shaftTop, tw, foot - shaftTop), BRICK], [rect(cx - 50, 250, 100, 220), COPPER]);
  p.group('hall', { x: cx - tw / 2 - 10, y: shaftTop - 20, w: tw + 20, h: foot - shaftTop + 24 }, (c) => {
    fillPts(c, rect(cx - tw / 2, shaftTop, tw, foot - shaftTop), BRICK);
    // light on the left face, shade on the right third
    c.fillStyle = 'rgba(255,230,200,.16)'; c.fillRect(cx - tw / 2, shaftTop, 10, foot - shaftTop);
    c.fillStyle = 'rgba(40,10,10,.2)'; c.fillRect(cx + tw / 6, shaftTop, tw / 3, foot - shaftTop);
    // brick coursing
    c.fillStyle = 'rgba(70,20,10,.18)';
    for (let y = shaftTop + 6; y < foot; y += 7) c.fillRect(cx - tw / 2, y, tw, 1.2);
    // tall slit windows
    c.fillStyle = '#3a2228';
    for (const dx of [-36, -12, 12, 36]) c.fillRect(cx + dx - 3, shaftTop + 70, 6, 200);
    // the corner pinnacles on top of the shaft
    c.fillStyle = BRICK;
    for (const dx of [-tw / 2, tw / 2 - 18]) { c.fillRect(cx + dx, shaftTop - 16, 18, 18); }
  }, { t: 5.6, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // the gallery and the lantern
  p.group('hall', { x: cx - 70, y: 230, w: 140, h: 250 }, (c) => {
    // the open gallery: dark bays between white piers
    c.fillStyle = '#2a1f26'; c.fillRect(cx - 52, 390, 104, 80);
    c.fillStyle = '#ece1c8';
    for (let i = 0; i <= 5; i++) c.fillRect(cx - 52 + i * 20 - 2, 390, 6, 80);
    c.fillRect(cx - 58, 384, 116, 8); c.fillRect(cx - 58, 466, 116, 6);
    // stepped copper lantern
    const steps = [[46, 356, 30], [36, 320, 36], [26, 290, 30], [16, 262, 28]];
    for (const [hw, y, h] of steps) {
      fillPts(c, rect(cx - hw, y, hw * 2, h), COPPER);
      c.fillStyle = 'rgba(0,50,45,.24)'; c.fillRect(cx, y, hw, h);
      c.fillStyle = '#2c4f4a'; c.fillRect(cx - hw * 0.35, y + 6, hw * 0.25, h - 10); c.fillRect(cx + hw * 0.1, y + 6, hw * 0.25, h - 10);
      c.fillStyle = '#86bfae'; c.fillRect(cx - hw - 3, y + h - 4, hw * 2 + 6, 4);
    }
    fillPts(c, [[cx - 10, 262], [cx, 236], [cx + 10, 262]], COPPER);
  }, { t: 7.0, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // the three crowns, in gold
  [[cx - 13, 226], [cx + 13, 226], [cx, 200]].forEach(([x, y], i) => {
    p.group('hallx', { x: x - 14, y: y - 16, w: 28, h: 28 }, (c) => {
      c.fillStyle = GOLD;
      poly(c, [[x - 10, y + 6], [x - 10, y - 6], [x - 5, y - 1], [x, y - 9], [x + 5, y - 1], [x + 10, y - 6], [x + 10, y + 6]]); c.fill();
      c.fillStyle = '#b88a25'; c.fillRect(x - 10, y + 3, 20, 3);
    }, { t: 8.3 + i * 0.22, d: 0.6, reveal: 'drop', dy: 16 });
  });
  p.pen('hallx', [[cx, 228], [cx, 246]], '#b88a25', 2, { t: 8.2, d: 0.3 });

  // the garden in front of the hall, a row of clipped trees on the quay
  const trees = [];
  for (let x = X0 + 10; x < 600; x += 46) trees.push([x + r.range(-6, 6), r.range(20, 28)]);
  p.group('hallx', { x: X0 - 10, y: HALL - 70, w: 560, h: 76 }, (c) => {
    c.fillStyle = '#d7cbb2'; c.fillRect(X0 - 10, HALL - 4, 560, 10);
    for (const [x, rad] of trees) {
      c.fillStyle = '#4d3a2c'; c.fillRect(x - 2, HALL - 24, 4, 20);
      c.fillStyle = '#2f6a47'; c.beginPath(); c.arc(x, HALL - 30 - rad * 0.6, rad, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c9a62'; c.beginPath(); c.arc(x - rad * 0.3, HALL - 34 - rad * 0.8, rad * 0.55, 0, Math.PI * 2); c.fill();
    }
  }, { t: 7.8, d: 0.9, reveal: 'rise' });
  mirror.push([rect(X0, HALL - 60, 540, 60), '#2f6a47']);
}

// ================================================================ the water
function water(p, r, mirror) {
  p.group('water', { x: X0, y: SHORE + 8, w: X1 - X0, h: Y1 - SHORE }, (c) => {
    const g = c.createLinearGradient(0, SHORE, 0, Y1);
    g.addColorStop(0, WATER0); g.addColorStop(1, WATER1);
    c.fillStyle = g; c.fillRect(X0, SHORE + 8, X1 - X0, Y1 - SHORE);
  }, { t: 4.8, d: 1.4, reveal: 'fall', ease: 'inOut' });

  // the reflections: every shape flipped about its waterline, cut into strips
  // that shift a little sideways, softened toward the water's color
  const strips = [];
  for (const [pts, col] of mirror) {
    const b = boxOf(pts, 0);
    const foot = b.x < 640 ? HALL : SHORE + 10;
    strips.push({ pts: pts.map(([x, y]) => [x, foot + (foot - y) * 0.82]), col: mix(col, WATER0, 0.42), foot });
  }
  const cuts = [];
  for (let y = SHORE + 10; y < Y1; y += r.range(5, 11)) cuts.push([y, r.range(-4, 4) * (0.3 + (y - SHORE) / 700)]);
  const reflGroup = (sel, t) => p.group('refl', { x: X0, y: SHORE, w: X1 - X0, h: Y1 - SHORE }, (c) => {
    for (let i = 0; i < cuts.length - 1; i++) {
      const [y0, dx] = cuts[i], y1 = cuts[i + 1][0] - 1.6;
      c.save(); c.beginPath(); c.rect(X0, y0, X1 - X0, y1 - y0); c.clip();
      c.translate(dx, 0);
      for (const s of strips) if (sel(s) && y0 > s.foot - 2) fillPts(c, s.pts, s.col);
      c.restore();
    }
  }, { t, d: 1.6, reveal: 'fall', ease: 'inOut' });
  reflGroup((s) => s.foot === SHORE + 10, 6.4);
  reflGroup((s) => s.foot === HALL, 7.2);

  // crisp ripples, more of them and longer nearer
  const rips = [];
  for (let y = SHORE + 16; y < Y1; y += 4 + (y - SHORE) * 0.012) {
    const n = Math.round(r.range(4, 9));
    for (let i = 0; i < n; i++) {
      const x = r.range(X0, X1), L = r.range(14, 50) * (0.6 + (y - SHORE) / 400);
      rips.push([[x, y], [x + L, y]]);
    }
  }
  p.strokes('ripple', rips, 'rgba(240,246,248,.45)', 1.6, { t: 8.2, d: 1.4, reveal: 'fall', ease: 'inOut', box: { x: X0, y: SHORE, w: X1 - X0, h: Y1 - SHORE } });
  const dark = [];
  for (let y = SHORE + 20; y < Y1; y += 7 + (y - SHORE) * 0.016) {
    for (let i = 0; i < 5; i++) { const x = r.range(X0, X1), L = r.range(20, 80); dark.push([[x, y], [x + L, y]]); }
  }
  p.strokes('ripple', dark, 'rgba(18,48,84,.35)', 2, { t: 8.6, d: 1.2, reveal: 'fall', ease: 'inOut', box: { x: X0, y: SHORE, w: X1 - X0, h: Y1 - SHORE } });
}

// ================================================================ things that move
function ferry(c, x, y, s, dir) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  // reflection
  c.fillStyle = 'rgba(240,240,235,.28)'; c.fillRect(-60, 6, 120, 10);
  // hull
  c.fillStyle = '#1d2a40'; poly(c, [[-62, -6], [64, -6], [56, 6], [-56, 6]]); c.fill();
  c.fillStyle = '#f7f4ec'; c.fillRect(-58, -26, 112, 20);
  c.fillStyle = '#f7f4ec'; c.fillRect(-40, -42, 70, 16);
  c.fillStyle = '#2a3a55';
  for (let i = 0; i < 9; i++) c.fillRect(-52 + i * 11.5, -20, 6, 7);
  for (let i = 0; i < 5; i++) c.fillRect(-34 + i * 12, -37, 6, 6);
  // the funnel: black top, a yellow band
  c.fillStyle = '#1d2a40'; c.fillRect(-6, -66, 14, 24);
  c.fillStyle = GOLD; c.fillRect(-6, -56, 14, 5);
  c.fillStyle = '#c0392b'; c.fillRect(46, -40, 2, 14); c.fillRect(48, -40, 8, 5);
  c.restore();
}

function life(p, r) {
  // two white ferries crossing, slowly, one each way
  p.live('live', {
    t: 9.0, d: 1.2, box: { x: X0, y: 1100, w: X1 - X0, h: 400 },
    draw: (c, time) => {
      const k = time - 9;
      ferry(c, 520 + k * 9, 1290, 1.25, 1);
      ferry(c, 1360 - k * 6, 1150, 0.8, -1);
    },
  });
  // a sailboat drifting, its mast swaying a touch
  p.live('live', {
    t: 9.4, d: 1.0, box: { x: X0, y: 1300, w: X1 - X0, h: 280 },
    draw: (c, time) => {
      const k = time - 9.4, x = 1180 + k * 3, y = 1470, a = Math.sin(time * 1.3) * 0.03;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = '#f7f4ec'; poly(c, [[2, -150], [2, -12], [76, -12]]); c.fill();
      c.fillStyle = '#e8d9b8'; poly(c, [[-3, -128], [-3, -12], [-54, -12]]); c.fill();
      c.fillStyle = NAVY; c.fillRect(-1, -156, 3, 148);
      poly(c, [[-56, -8], [72, -8], [60, 6], [-46, 6]]); c.fill();
      c.restore();
      c.fillStyle = 'rgba(240,240,235,.25)'; c.fillRect(x - 40, y + 10, 100, 4); c.fillRect(x - 20, y + 20, 60, 3);
    },
  });
  // gulls wheeling
  const gulls = [];
  for (let i = 0; i < 6; i++) gulls.push([r.range(500, 1400), r.range(200, 560), r.range(0.8, 1.4), r() * 6, r.range(0.6, 1.1)]);
  p.live('live', {
    t: 9.2, d: 1.0, box: { x: X0, y: 100, w: X1 - X0, h: 560 },
    draw: (c, time) => {
      c.strokeStyle = '#ffffff'; c.lineCap = 'round';
      for (const [x0, y0, s, ph, sp] of gulls) {
        const x = x0 + Math.sin(time * 0.25 * sp + ph) * 60, y = y0 + Math.cos(time * 0.3 * sp + ph) * 20;
        const f = Math.sin(time * 5 * sp + ph);
        c.lineWidth = 2.6 * s;
        c.beginPath(); c.moveTo(x - 14 * s, y - (2 + f * 5) * s); c.quadraticCurveTo(x - 6 * s, y - 8 * s, x, y); c.quadraticCurveTo(x + 6 * s, y - 8 * s, x + 14 * s, y - (2 + f * 5) * s); c.stroke();
      }
    },
  });
  // the flags on the palace and the hall
  p.live('live', {
    t: 8.8, d: 0.8, box: { x: 1380, y: 640, w: 80, h: 70 },
    draw: (c, time) => {
      const x = 1420, y = SHORE - 312;
      c.fillStyle = '#5d6a7a'; c.fillRect(x - 1, y - 56, 2.5, 56);
      c.beginPath(); c.moveTo(x, y - 56);
      for (let i = 0; i <= 6; i++) c.lineTo(x + i * 5.5, y - 56 + Math.sin(time * 4 - i * 0.8) * 2);
      for (let i = 6; i >= 0; i--) c.lineTo(x + i * 5.5, y - 36 + Math.sin(time * 4 - i * 0.8) * 2);
      c.fillStyle = '#2f6eb5'; c.fill();
      c.fillStyle = '#f2c230';
      c.fillRect(x + 9, y - 56 + Math.sin(time * 4 - 1.5) * 2, 5, 20);
      c.fillRect(x, y - 48 + Math.sin(time * 4 - 2) * 2, 33, 4);
    },
  });
}

// ================================================================ the name
function title(p) {
  const ty = 1838;
  p.group('title', { x: X0, y: Y1 + 20, w: X1 - X0, h: 12 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(X0, Y1 + 24, X1 - X0, 4);
  }, { t: 10.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'STOCKHOLM', X0 - 6, ty, {
    family: FACE, weight: 900, size: 260, track: -0.01, fit: X1 - X0 + 12, color: NAVY,
    t: 10.4, gap: 0.16, d: 0.7, reveal: 'rise',
  });
  // the colors of the city, as three squares, and a line of small type
  [['#d9a441', 0], [BRICK, 1], [COPPER, 2]].forEach(([col, i]) => {
    p.group('title', { x: X0 + i * 38 - 2, y: 1878, w: 34, h: 34 }, (c) => { c.fillStyle = col; c.fillRect(X0 + i * 38, 1880, 30, 30); }, { t: 12.0 + i * 0.12, d: 0.5, reveal: 'pop' });
  });
  p.type('title', 'RIDDARFJÄRDEN · GAMLA STAN · STADSHUSET', X0 + 130, 1906, {
    family: FACE, weight: 500, size: 26, track: 0.22, color: NAVY, t: 12.3, gap: 0.025, d: 0.4, reveal: 'fade',
  });
  p.type('title', '59°19′N', X1, 1906, {
    family: FACE, weight: 500, size: 26, track: 0.12, color: NAVY, align: 'right', t: 13.2, gap: 0.04, d: 0.4, reveal: 'fade',
  });
}
