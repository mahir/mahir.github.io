// Amsterdam: a Dutch modernist poster. A row of tall, narrow canal houses seen
// straight on across the water, a humpback bridge over a side canal with the
// Westerkerk's crowned spire beyond, elms on the quay, houseboats, and the whole
// street shaken into the canal as a reflection. Flat inks, no outlines, white
// window frames; a halftone sky; the name set up the right edge.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng, shade } from '../kit.js';

const PAPER = '#f2ece0', INK = '#1b1a19', WHITE = '#fbf8f1', STONE = '#e6dcc6';
const BRICK = '#a6432d', BRICK_D = '#7e3122', BROWN = '#5e3b2a', CHOC = '#3a2a23', TAR = '#2a2725';
const GREEN = '#1f4b3f', GREEN_L = '#4d8a63', LEAF = '#2f6a4c', PLASTER = '#e9e0c9', SAND = '#bf9561', OXBLOOD = '#8a3428';
const SKY = '#d3e0df', SKY_D = '#9fbcbd', WATER = '#2a4a45', GLASS = '#2b3634';
const RED = '#d8402a', ORANGE = '#ea7a1c', YELLOW = '#f0c23a', BLUE = '#2b4c8f', GOLD = '#d4a332', PINK = '#e58fa0';

export const city = {
  id: 'amsterdam', name: 'Amsterdam', wall: '#1d3a33',
  alt: "Gabled canal houses, elms and the Westerkerk spire reflected in a canal, with a humpback bridge, houseboats and cyclists, the name set sideways down the edge in heavy lowercase",
  google: 'family=Unbounded:wght@800&family=Space+Mono:wght@700',
  fonts: [['800 100px "Unbounded"', 'amsterdam'], ['700 30px "Space Mono"', 'de grachten the canals 1275']],
  build,
};

// the picture, and the column on the right that holds the name
const X0 = 80, X1 = 1360, Y0 = 80, Y1 = 1920;
const QY = 1180; // the foot of the houses, on the far quay
const WL = 1290; // the water, at the foot of the quay wall
const GAP0 = 770, GAP1 = 1050, GX = 910; // the side canal, under the bridge

function build() {
  const p = new Plate({ paper: PAPER, seed: 1613 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'clouds', 'church', 'side', 'water', 'houses', 'trees', 'quay', 'refl', 'ripples', 'boats', 'bridge', 'riders', 'rail', 'flowers', 'title');
  p.layer('title', { clip: false });

  const scene = []; // what the canal mirrors: drawing functions in sheet units
  sky(p, r, scene);
  church(p, r, scene);
  sideCanal(p, r, scene);
  water(p, r);
  houses(p, r, scene);
  trees(p, r, scene);
  quay(p, r, scene);
  bridge(p, r, scene);
  houseboats(p, r, scene);
  reflection(p, scene);
  life(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- sky
function sky(p, r, scene) {
  const flat = (c) => { c.fillStyle = SKY; c.fillRect(X0, Y0, X1 - X0, WL - Y0); };
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: WL - Y0 }, flat, { t: 0.1, d: 1.4, reveal: 'fall', ease: 'inOut' });
  scene.push(flat);
  // a halftone screen, the dots growing toward the top
  const dots = (c) => {
    c.fillStyle = SKY_D; c.beginPath();
    const step = 15;
    for (let y = Y0 + 6, row = 0; y < 900; y += step * 0.866, row++) {
      const k = clamp((900 - y) / (900 - Y0)) ** 1.1;
      const rad = step * 0.48 * k;
      if (rad < 0.7) continue;
      for (let x = X0 + (row % 2 ? step / 2 : 0); x < X1 + step; x += step) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); }
    }
    c.fill();
  };
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 830 }, dots, { t: 0.6, d: 1.6, reveal: 'fall', ease: 'inOut' });
  scene.push(dots);
  // flat clouds: rounded bars, white over the screen
  const clouds = [[140, 330, 330, 46], [880, 250, 420, 54], [560, 470, 240, 34], [1080, 520, 220, 30]];
  clouds.forEach(([x, y, w, h], i) => {
    const draw = (c) => {
      c.fillStyle = WHITE;
      c.beginPath(); c.roundRect(x, y - h / 2, w, h, h / 2); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.18, y - h * 1.15, w * 0.5, h * 0.9, h * 0.45); c.fill();
      c.fillStyle = SKY; c.fillRect(x + w * 0.1, y + h * 0.18, w * 0.5, 3);
    };
    p.group('clouds', { x: x - 10, y: y - h * 1.3, w: w + 20, h: h * 2 }, draw, { t: 1.3 + i * 0.25, d: 1.2, reveal: 'slide', dx: i % 2 ? 90 : -90, ease: 'out' });
    scene.push(draw);
  });
}

// ---------------------------------------------------------------- the Westerkerk
function church(p, r, scene) {
  const cx = GX;
  const stages = [];
  // the brick shaft with stone quoins and a tall window
  stages.push([(c) => {
    c.fillStyle = BRICK; c.fillRect(cx - 40, 760, 80, 420);
    c.fillStyle = STONE;
    for (let y = 772; y < 1180; y += 34) { c.fillRect(cx - 40, y, 12, 14); c.fillRect(cx + 28, y, 12, 14); }
    c.fillStyle = GLASS; c.beginPath(); c.moveTo(cx - 12, 1000); c.lineTo(cx - 12, 880); c.arc(cx, 880, 12, Math.PI, 0); c.lineTo(cx + 12, 1000); c.fill();
    c.fillStyle = WHITE; c.fillRect(cx - 1, 870, 2, 130);
    c.fillStyle = STONE; c.fillRect(cx - 46, 752, 92, 10);
    for (let x = cx - 42; x < cx + 42; x += 8) c.fillRect(x, 742, 4, 10);
    c.fillRect(cx - 46, 738, 92, 5);
  }, 760, 1.7]);
  // the stone stage with the blue clock
  stages.push([(c) => {
    c.fillStyle = STONE; c.fillRect(cx - 33, 650, 66, 90);
    c.fillStyle = shade(STONE, 0.82); c.fillRect(cx + 16, 650, 17, 90);
    c.fillStyle = BLUE; c.beginPath(); c.arc(cx, 690, 20, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke();
    c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(cx + Math.cos(a) * 14, 690 + Math.sin(a) * 14); c.lineTo(cx + Math.cos(a) * 18, 690 + Math.sin(a) * 18); }
    c.moveTo(cx, 690); c.lineTo(cx + 8, 682); c.moveTo(cx, 690); c.lineTo(cx, 676); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(cx - 9, 734); c.lineTo(cx - 9, 722); c.arc(cx, 722, 9, Math.PI, 0); c.lineTo(cx + 9, 734); c.fill();
    c.fillStyle = STONE; c.fillRect(cx - 38, 644, 76, 8);
    for (let x = cx - 34; x < cx + 34; x += 7) c.fillRect(x, 634, 3.4, 10);
    c.fillRect(cx - 38, 630, 76, 5);
  }, 650, 0.8]);
  // two open stages, narrowing, columns and arches
  stages.push([(c) => {
    for (const [w, y0, y1, col] of [[29, 566, 630, PLASTER], [23, 512, 566, STONE], [16, 470, 512, PLASTER]]) {
      c.fillStyle = col; c.fillRect(cx - w, y0, 2 * w, y1 - y0);
      c.fillStyle = INK;
      for (const dx of [-w * 0.5, w * 0.5]) { c.beginPath(); c.moveTo(cx + dx - w * 0.22, y1 - 4); c.lineTo(cx + dx - w * 0.22, y0 + 18); c.arc(cx + dx, y0 + 18, w * 0.22, Math.PI, 0); c.lineTo(cx + dx + w * 0.22, y1 - 4); c.fill(); }
      c.fillStyle = shade(col, 0.8); c.fillRect(cx + w * 0.55, y0, w * 0.45, y1 - y0);
      c.fillStyle = GOLD; c.fillRect(cx - w - 4, y0 - 4, 2 * w + 8, 5);
      // urns at the corners, columns at the edges
      c.beginPath(); c.arc(cx - w - 1, y0 - 8, 3.4, 0, Math.PI * 2); c.arc(cx + w + 1, y0 - 8, 3.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = WHITE; c.fillRect(cx - w, y0 + 2, 3, y1 - y0 - 4); c.fillRect(cx + w - 3, y0 + 2, 3, y1 - y0 - 4);
    }
  }, 460, 1.0]);
  // the imperial crown: blue and gold, an orb, the vane
  stages.push([(c) => {
    c.translate(0, -58);
    c.fillStyle = GOLD; c.fillRect(cx - 22, 520, 44, 10);
    c.fillStyle = RED; c.fillRect(cx - 18, 500, 36, 20);
    c.fillStyle = BLUE; c.beginPath(); c.ellipse(cx, 520, 22, 42, 0, Math.PI, 0); c.fill();
    c.fillStyle = GOLD;
    for (const dx of [-14, 0, 14]) { c.beginPath(); c.ellipse(cx + dx * 0.9, 498, 2.6, 22 - Math.abs(dx) * 0.6, 0, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); for (const dx of [-18, -6, 6, 18]) { c.moveTo(cx + dx + 3, 522); c.arc(cx + dx, 522, 3, 0, Math.PI * 2); } c.fill();
    c.beginPath(); c.arc(cx, 474, 7, 0, Math.PI * 2); c.fill();
    c.fillRect(cx - 1.5, 404, 3, 66);
    c.fillRect(cx - 6, 452, 12, 3);
    poly(c, [[cx + 1, 420], [cx + 22, 426], [cx + 14, 432], [cx + 1, 430]]); c.fill();
  }, 340, 0.7]);
  stages.forEach(([draw, top, d], i) => {
    p.group('church', { x: cx - 60, y: top - 10, w: 120, h: 1190 - top }, draw, { t: 1.8 + i * 0.5, d, reveal: i === 3 ? 'drop' : 'rise', dy: 40, ease: 'out' });
    scene.push(draw);
  });
}

// ---------------------------------------------------------------- the side canal, beyond the bridge
function sideCanal(p, r, scene) {
  // two rows of facades running away to the church: drawn in perspective quads
  const VP = [GX, 1150];
  const row = (side) => {
    const xN = side < 0 ? GAP0 : GAP1, xF = side < 0 ? GX - 32 : GX + 32;
    const along = (x, yN) => yN + (VP[1] - yN) * ((x - xN) / (VP[0] - xN));
    const splits = [0, 0.38, 0.62, 0.8, 0.92, 1];
    // the heights are drawn once, here: drawn inside the draw they would change every frame
    const rr = rng(side < 0 ? 41 : 42);
    const tops = splits.slice(1).map((_, i) => 600 + rr.range(-40, 40) + i * 6);
    const cols = [BRICK, PLASTER, BROWN, SAND, BRICK_D, TAR].map((c) => mix(c, SKY, 0.35));
    return (c) => {
      for (let i = 0; i < splits.length - 1; i++) {
        const xa = lerp(xN, xF, splits[i]), xb = lerp(xN, xF, splits[i + 1]);
        const topN = tops[i];
        const ya0 = along(xa, QY), yb0 = along(xb, QY), ya1 = along(xa, topN), yb1 = along(xb, topN);
        const col = cols[(i + (side < 0 ? 0 : 3)) % cols.length];
        c.fillStyle = col; poly(c, [[xa, ya0], [xb, yb0], [xb, yb1], [xa, ya1]]); c.fill();
        // a little gable on top
        const mx = (xa + xb) / 2, my = (ya1 + yb1) / 2, gh = Math.abs(xb - xa) * 0.35;
        poly(c, [[xa, ya1], [xb, yb1], [mx, my - gh]]); c.fill();
        // windows in a grid that follows the plane
        const n = 5;
        const P = (u, v) => { const x = lerp(xa, xb, u); return [x, lerp(along(x, QY), along(x, topN), v)]; };
        for (let f = 0; f < n; f++) for (let k = 0; k < 2; k++) {
          const u0 = (k + 0.2) / 2, u1 = (k + 0.75) / 2, v0 = 0.07 + f * 0.18, v1 = v0 + 0.12;
          c.fillStyle = mix(WHITE, SKY, 0.2); poly(c, [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]); c.fill();
          c.fillStyle = mix(GLASS, SKY, 0.35); poly(c, [P(u0 + 0.05, v0 + 0.012), P(u1 - 0.05, v0 + 0.012), P(u1 - 0.05, v1 - 0.012), P(u0 + 0.05, v1 - 0.012)]); c.fill();
        }
        // a cornice line, and the shade of the next house's edge
        c.fillStyle = mix(WHITE, SKY, 0.2); poly(c, [P(0, 0.985), P(1, 0.985), P(1, 1), P(0, 1)]); c.fill();
        c.fillStyle = 'rgba(30,30,30,.12)'; poly(c, [[xb - 1, yb0], [xb, yb0], [xb, yb1], [xb - 1, yb1]]); c.fill();
      }
      // the far water between them
      c.fillStyle = mix(WATER, SKY, 0.4); poly(c, [[xN, QY], [xF, along(xF, QY)], [xF, QY + 24], [xN, QY + 24]]); c.fill();
    };
  };
  for (const side of [-1, 1]) {
    const draw = row(side);
    p.group('side', { x: side < 0 ? GAP0 - 10 : GX - 10, y: 500, w: GAP1 - GX + 20, h: WL - 500 }, draw, { t: 2.6 + (side > 0 ? 0.3 : 0), d: 1.0, reveal: 'rise' });
    scene.push(draw);
  }
}

// ---------------------------------------------------------------- the canal
function water(p, r) {
  p.group('water', { x: X0, y: WL - 4, w: X1 - X0, h: Y1 - WL + 4 }, (c) => {
    c.fillStyle = WATER; c.fillRect(X0, WL - 4, X1 - X0, Y1 - WL + 4);
  }, { t: 2.0, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // long pale ripples, until the street's reflection settles over them
  const lines = [];
  r = rng(5); // its own stream, so the houses stay as they were
  for (let y = WL + 20; y < Y1; y += r.range(10, 22)) {
    const k = (y - WL) / (Y1 - WL);
    for (let x = X0 - r() * 200; x < X1; x += r.range(120, 260)) lines.push([[x, y], [x + r.range(40, 160) * (0.5 + k), y]]);
  }
  p.strokes('water', lines, 'rgba(211,224,223,.35)', 2, { t: 3.0, d: 1.6, reveal: 'wipe' });
}

// ---------------------------------------------------------------- the houses
const KINDS = ['step', 'neck', 'bell', 'cornice', 'spout'];
const FACES = [BRICK, BROWN, TAR, BRICK_D, PLASTER, SAND, GREEN, OXBLOOD, CHOC];

function houses(p, r, scene) {
  const list = [];
  const plan = (xa, xb, seedK) => {
    let x = xa;
    let last = -1, lastKind = '';
    while (x < xb) {
      let w = r.range(104, 142);
      if (xb - x - w < 70) w = xb - x;
      let fi; do { fi = r.int(0, FACES.length - 1); } while (fi === last);
      let kind; do { kind = r.pick(KINDS); } while (kind === lastKind);
      last = fi; lastKind = kind;
      const floors = r.int(3, 4), story = r.range(88, 100);
      list.push({
        x, w, floors, story, kind, col: FACES[fi], gh: 118, G: r.range(120, 175) * (kind === 'cornice' ? 0.7 : 1),
        lean: r.range(-0.014, 0.014), door: r.chance(0.5) ? 0 : 1, seed: Math.floor(r() * 1e9), boxes: r.chance(0.55),
      });
      x += w;
    }
  };
  plan(X0 - 30, GAP0, 1);
  plan(GAP1, X1 + 40, 2);
  // from the middle outward, so the row grows away from the bridge
  const order = list.map((h, i) => i).sort((a, b) => Math.abs(list[a].x + list[a].w / 2 - GX) - Math.abs(list[b].x + list[b].w / 2 - GX));
  const jobs = [];
  order.forEach((i, k) => {
    const h = list[i];
    const hb = h.gh + h.floors * h.story;
    const t = 3.2 + k * 0.3;
    const body = (c) => house(c, h, 'body');
    const gable = (c) => house(c, h, 'gable');
    const pad = 40;
    jobs.push(['houses', { x: h.x - pad, y: QY - hb - 10, w: h.w + 2 * pad, h: hb + 14 }, body, { t, d: 0.9, reveal: 'rise', ease: 'out' }]);
    jobs.push(['houses', { x: h.x - pad, y: QY - hb - h.G - 70, w: h.w + 2 * pad, h: h.G + 90 }, gable, { t: t + 0.65, d: 0.7, reveal: 'drop', dy: 30, ease: 'out' }]);
    scene.push(body, gable);
  });
  jobs.sort((a, b) => a[3].t - b[3].t).forEach((j) => p.group(...j));
}

// a window: white frame, two sashes, glazing bars, a glint
function win(c, x, y, w, h, o = {}) {
  const fr = o.frame || WHITE;
  c.fillStyle = fr; c.fillRect(x, y, w, h);
  const b = Math.max(2.4, w * 0.09);
  c.fillStyle = GLASS; c.fillRect(x + b, y + b, w - 2 * b, h - 2 * b);
  c.fillStyle = 'rgba(210,228,226,.16)'; poly(c, [[x + b, y + b], [x + w * 0.62, y + b], [x + b, y + h * 0.5]]); c.fill();
  c.fillStyle = fr;
  c.fillRect(x, y + h * 0.48, w, b * 0.8);
  const cols = o.cols ?? 2, rows = o.rows ?? 3;
  for (let k = 1; k < cols; k++) c.fillRect(x + (w * k) / cols - 0.8, y, 1.6, h);
  for (let k = 1; k < rows; k++) { c.fillRect(x, y + (h * 0.48 * k) / rows, w, 1.4); c.fillRect(x, y + h * 0.48 + (h * 0.52 * k) / rows, w, 1.4); }
}

function house(c, h, part) {
  const { x, w, floors, story, gh, G, col, kind } = h;
  const hb = gh + floors * story, y0 = QY - hb, cx = x + w / 2;
  const rr = rng(h.seed);
  const light = col === PLASTER || col === SAND;
  const trim = light ? GREEN : WHITE, frame = light ? (col === SAND ? WHITE : GREEN) : WHITE;
  const bays = w >= 122 ? 3 : 2, pitch = w / bays, ww = pitch * 0.56;
  c.save();
  c.translate(cx, QY); c.rotate(h.lean); c.translate(-cx, -QY);
  if (part === 'body') {
    c.fillStyle = col; c.fillRect(x, y0, w + 0.8, hb);
    // brick courses, faint
    if (!light && col !== GREEN) {
      c.fillStyle = 'rgba(0,0,0,.09)';
      for (let y = y0 + 4; y < QY; y += 6) c.fillRect(x, y, w, 1.2);
    }
    // the party walls between houses
    c.fillStyle = 'rgba(20,15,12,.35)'; c.fillRect(x, y0, 2.2, hb);
    // floors of tall windows, with stone lintels and sills
    for (let f = 0; f < floors; f++) {
      const yb = QY - gh - f * story;
      const wh = story * (0.7 - f * 0.04);
      const wy = yb - story * 0.12 - wh;
      for (let k = 0; k < bays; k++) {
        const wx = x + k * pitch + (pitch - ww) / 2;
        c.fillStyle = light ? shade(col, 0.85) : STONE;
        c.fillRect(wx - 4, wy - 9, ww + 8, 6);
        c.fillRect(wx - 3, wy + wh, ww + 6, 4);
        win(c, wx, wy, ww, wh, { frame, rows: f === floors - 1 ? 2 : 3 });
        if (h.boxes && f === 0) tulips(c, wx + ww / 2, wy + wh + 2, rr);
      }
    }
    // the ground floor: a door up a stoop, big windows, cellar lights
    const gy = QY - gh;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, QY - 26, w, 26);
    for (let k = 0; k < bays; k++) {
      const wx = x + k * pitch + (pitch - ww) / 2;
      const isDoor = (h.door === 0 && k === 0) || (h.door === 1 && k === bays - 1);
      if (isDoor) {
        const dw = ww * 1.05, dx = wx - (dw - ww) / 2;
        c.fillStyle = trim; c.fillRect(dx - 4, gy + 6, dw + 8, gh - 26);
        c.fillStyle = light ? CHOC : rr.pick([GREEN, '#203a5c', OXBLOOD, TAR]); c.fillRect(dx, gy + 30, dw, gh - 50);
        c.fillStyle = GLASS; c.beginPath(); c.arc(dx + dw / 2, gy + 30, dw / 2, Math.PI, 0); c.fill();
        c.strokeStyle = trim; c.lineWidth = 1.4; c.beginPath();
        for (let a = 1; a < 6; a++) { const an = Math.PI + (a / 6) * Math.PI; c.moveTo(dx + dw / 2, gy + 30); c.lineTo(dx + dw / 2 + Math.cos(an) * dw / 2, gy + 30 + Math.sin(an) * dw / 2); }
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(dx + 4, gy + 36, dw * 0.38, gh - 64); c.fillRect(dx + dw * 0.56, gy + 36, dw * 0.38, gh - 64);
        c.fillStyle = GOLD; c.beginPath(); c.arc(dx + dw * 0.5, gy + gh * 0.55, 2.2, 0, Math.PI * 2); c.fill();
        // the stoop and its iron rail
        c.fillStyle = STONE; for (let s = 0; s < 3; s++) c.fillRect(dx - 8 - s * 4, QY - 20 + s * 7, dw + 16 + s * 8, 7);
        c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(dx - 16, QY); c.lineTo(dx - 12, QY - 30); c.lineTo(dx - 2, QY - 30); c.stroke();
      } else {
        const gwh = gh * 0.58;
        win(c, wx, gy + 14, ww, gwh, { frame, rows: 2 });
        if (rr.chance(0.4)) {
          c.fillStyle = rr.pick([GREEN, OXBLOOD]);
          c.fillRect(wx - ww * 0.42, gy + 14, ww * 0.38, gwh); c.fillRect(wx + ww * 1.04, gy + 14, ww * 0.38, gwh);
          c.fillStyle = 'rgba(255,255,255,.25)';
          for (const sx of [wx - ww * 0.42, wx + ww * 1.04]) for (let y = gy + 20; y < gy + 14 + gwh; y += 7) c.fillRect(sx + 2, y, ww * 0.34, 1.4);
        }
        c.fillStyle = GLASS; c.fillRect(wx + ww * 0.15, QY - 22, ww * 0.7, 14);
        c.fillStyle = INK; for (let k2 = 1; k2 < 5; k2++) c.fillRect(wx + ww * 0.15 + (ww * 0.7 * k2) / 5, QY - 22, 1.4, 14);
      }
    }
    // a stone band over the ground floor
    c.fillStyle = light ? shade(col, 0.8) : STONE; c.fillRect(x, gy - 2, w, 5);
  } else {
    gable(c, h, x, y0, w, G, cx, col, trim, frame, rr);
  }
  c.restore();
}

function gable(c, h, x, y0, w, G, cx, col, trim, frame, rr) {
  const top = y0 - G;
  const hoist = (hx, hy) => {
    // the hoist beam, its little hood, and the hook on its rope
    c.fillStyle = CHOC; poly(c, [[hx - 5, hy + 8], [hx + 5, hy + 8], [hx + 7, hy - 6], [hx - 7, hy - 6]]); c.fill();
    c.fillStyle = trim; poly(c, [[hx - 10, hy - 6], [hx + 10, hy - 6], [hx, hy - 16]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(hx, hy + 8); c.lineTo(hx, hy + 32); c.stroke();
    c.lineWidth = 1.8; c.beginPath(); c.arc(hx + 3, hy + 34, 3, Math.PI, Math.PI * 0.2, true); c.stroke();
  };
  const hoistDoor = (dx, dy, dw, dh) => {
    c.fillStyle = trim; c.fillRect(dx - 3, dy - 3, dw + 6, dh + 6);
    c.fillStyle = rr.pick([GREEN, OXBLOOD, GREEN]); c.fillRect(dx, dy, dw / 2 - 1, dh); c.fillRect(dx + dw / 2 + 1, dy, dw / 2 - 1, dh);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(dx + 3, dy + 3, dw / 2 - 7, 2); c.fillRect(dx + dw / 2 + 4, dy + dh - 6, dw / 2 - 7, 2);
  };
  c.fillStyle = col;
  if (h.kind === 'step') {
    const n = 4, tw = w * 0.3, sw = (w / 2 - tw / 2) / n, sh = G / (n + 0.6);
    const pts = [[x, y0]];
    for (let i = 0; i < n; i++) { pts.push([x + i * sw, y0 - (i + 1) * sh]); pts.push([x + (i + 1) * sw, y0 - (i + 1) * sh]); }
    pts.push([cx - tw / 2, top], [cx + tw / 2, top]);
    for (let i = n - 1; i >= 0; i--) { pts.push([x + w - (i + 1) * sw, y0 - (i + 1) * sh]); pts.push([x + w - i * sw, y0 - (i + 1) * sh]); }
    pts.push([x + w, y0]);
    poly(c, pts); c.fill();
    c.fillStyle = trim;
    for (let i = 0; i < n; i++) { c.fillRect(x + i * sw - 2, y0 - (i + 1) * sh - 5, sw + 2, 6); c.fillRect(x + w - (i + 1) * sw, y0 - (i + 1) * sh - 5, sw + 2, 6); }
    c.fillRect(cx - tw / 2 - 3, top - 6, tw + 6, 7);
    c.beginPath(); c.arc(cx, top - 12, 6, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x + i * sw + 3, y0 - (i + 1) * sh - 9, 3, 0, Math.PI * 2); c.arc(x + w - i * sw - 3, y0 - (i + 1) * sh - 9, 3, 0, Math.PI * 2); c.fill(); }
    win(c, cx - w * 0.3, y0 - G * 0.48, w * 0.22, G * 0.36, { frame, rows: 2 });
    win(c, cx + w * 0.08, y0 - G * 0.48, w * 0.22, G * 0.36, { frame, rows: 2 });
    hoistDoor(cx - tw * 0.32, top + G * 0.1, tw * 0.64, G * 0.26);
    hoist(cx, top + 2);
  } else if (h.kind === 'neck') {
    const nw = w * 0.48, sh = G * 0.46;
    c.fillRect(cx - nw / 2, top + 14, nw, G - 14);
    c.fillRect(x, y0 - 14, w, 16);
    // the claw pieces on the shoulders, in sandstone, with their scrolls
    c.fillStyle = STONE;
    for (const d of [-1, 1]) {
      const ex = d < 0 ? x : x + w, nx = cx + d * nw / 2;
      c.beginPath(); c.moveTo(ex, y0 - 12); c.quadraticCurveTo(nx - d * 4, y0 - 14, nx, y0 - sh); c.lineTo(nx, y0 - 12); c.closePath(); c.fill();
      c.strokeStyle = STONE; c.lineWidth = 5; c.beginPath(); c.arc(ex - d * 10, y0 - 24, 8, 0, Math.PI * 1.6); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(lerp(ex, nx, 0.55), y0 - 22, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = STONE;
    }
    // the pediment on top of the neck
    c.fillStyle = trim;
    poly(c, [[cx - nw / 2 - 8, top + 16], [cx + nw / 2 + 8, top + 16], [cx, top - 14]]); c.fill();
    c.fillStyle = col; poly(c, [[cx - nw / 2 + 4, top + 11], [cx + nw / 2 - 4, top + 11], [cx, top - 4]]); c.fill();
    c.fillStyle = trim; c.beginPath(); c.arc(cx, top - 18, 5, 0, Math.PI * 2); c.fill();
    for (const d of [-1, 1]) { c.beginPath(); c.arc(cx + d * (nw / 2 + 6), top + 10, 4, 0, Math.PI * 2); c.fill(); }
    hoistDoor(cx - nw * 0.3, y0 - G * 0.62, nw * 0.6, G * 0.3);
    win(c, cx - nw * 0.3, y0 - G * 0.26, nw * 0.6, G * 0.22, { frame, rows: 1 });
    c.fillStyle = trim; c.beginPath(); c.arc(cx, top + 30, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = GLASS; c.beginPath(); c.arc(cx, top + 30, 5, 0, Math.PI * 2); c.fill();
    hoist(cx, top + 22);
  } else if (h.kind === 'bell') {
    const tw = w * 0.36;
    const outline = () => {
      c.beginPath(); c.moveTo(x, y0 + 1);
      c.bezierCurveTo(x + 4, y0 - G * 0.3, cx - tw / 2 - w * 0.16, y0 - G * 0.42, cx - tw / 2, y0 - G * 0.8);
      c.arc(cx, y0 - G * 0.8, tw / 2, Math.PI, 0);
      c.bezierCurveTo(cx + tw / 2 + w * 0.16, y0 - G * 0.42, x + w - 4, y0 - G * 0.3, x + w, y0 + 1);
      c.closePath();
    };
    outline(); c.fill();
    c.strokeStyle = trim; c.lineWidth = 6; outline(); c.stroke();
    c.fillStyle = trim; c.beginPath(); c.arc(cx, y0 - G * 0.8 - tw / 2 - 6, 6, 0, Math.PI * 2); c.fill();
    // a festoon under the top, a big window, the hoist door
    c.strokeStyle = trim; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - tw * 0.4, y0 - G * 0.74); c.quadraticCurveTo(cx, y0 - G * 0.62, cx + tw * 0.4, y0 - G * 0.74); c.stroke();
    hoistDoor(cx - tw * 0.32, y0 - G * 0.6, tw * 0.64, G * 0.26);
    win(c, cx - w * 0.17, y0 - G * 0.3, w * 0.34, G * 0.26, { frame, rows: 1, cols: 3 });
    hoist(cx, y0 - G * 0.8 - 4);
  } else if (h.kind === 'cornice') {
    // an attic story and a white cornice with a crest
    c.fillRect(x, y0 - G * 0.55, w, G * 0.56);
    const k = Math.max(2, Math.round(w / 46));
    for (let i = 0; i < k; i++) win(c, x + (w / k) * (i + 0.25), y0 - G * 0.45, (w / k) * 0.5, G * 0.3, { frame, rows: 1 });
    c.fillStyle = trim; c.fillRect(x - 6, y0 - G * 0.55 - 12, w + 12, 12);
    for (let xx = x - 2; xx < x + w + 2; xx += 8) c.fillRect(xx, y0 - G * 0.55, 4, 5);
    // the crest
    c.beginPath(); c.moveTo(cx - w * 0.28, y0 - G * 0.55 - 12); c.quadraticCurveTo(cx - w * 0.26, top - 10, cx, top - 14); c.quadraticCurveTo(cx + w * 0.26, top - 10, cx + w * 0.28, y0 - G * 0.55 - 12); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(cx, y0 - G * 0.55 - 30, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = trim; for (const d of [-1, 1]) { c.beginPath(); c.arc(cx + d * w * 0.32, y0 - G * 0.55 - 20, 5, 0, Math.PI * 2); c.fill(); }
    hoist(cx, top - 14);
  } else {
    // a warehouse's spout gable over a column of loading doors
    const tw = w * 0.34;
    poly(c, [[x, y0 + 1], [x + w * 0.08, y0 - G * 0.25], [cx - tw / 2, y0 - G * 0.82], [cx - tw / 2, top], [cx + tw / 2, top], [cx + tw / 2, y0 - G * 0.82], [x + w * 0.92, y0 - G * 0.25], [x + w, y0 + 1]]); c.fill();
    c.fillStyle = trim; c.fillRect(cx - tw / 2 - 5, top - 6, tw + 10, 7);
    poly(c, [[cx - tw / 2 - 4, top - 6], [cx + tw / 2 + 4, top - 6], [cx, top - 24]]); c.fill();
    hoistDoor(cx - tw * 0.36, top + 12, tw * 0.72, G * 0.32);
    hoistDoor(cx - tw * 0.36, y0 - G * 0.44, tw * 0.72, G * 0.32);
    win(c, x + w * 0.12, y0 - G * 0.2, w * 0.14, G * 0.15, { frame, rows: 1, cols: 1 });
    win(c, x + w * 0.74, y0 - G * 0.2, w * 0.14, G * 0.15, { frame, rows: 1, cols: 1 });
    hoist(cx, top - 4);
  }
}

// ---------------------------------------------------------------- elms
function trees(p, r, scene) {
  const spots = [[150, 1.0], [700, 0.92], [1290, 1.05]];
  spots.forEach(([tx, s], i) => {
    const rr = rng(70 + i);
    const crown = [];
    // a tall vase of leaf dabs, left open enough to see the houses through
    for (let k = 0; k < 900; k++) {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr());
      const yy = 740 + Math.sin(a) * 150 * d * s - 20;
      const ww = 120 * s * (0.75 + 0.35 * (1 - (yy - 600) / 300));
      const xx = tx + Math.cos(a) * ww * d;
      if (rr.chance(0.3) && d < 0.7) continue;
      crown.push([xx, yy, rr.range(4, 9) * s, rr()]);
    }
    const branches = [];
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + rr.range(-0.9, 0.9);
      const y0 = 960 - k * 18, len = rr.range(90, 170) * s;
      branches.push([[tx, y0], [tx + Math.cos(a) * len * 0.5, y0 + Math.sin(a) * len * 0.5 - 10], [tx + Math.cos(a) * len, y0 + Math.sin(a) * len]]);
    }
    const trunk = (c) => {
      c.fillStyle = CHOC;
      poly(c, [[tx - 12 * s, QY], [tx + 12 * s, QY], [tx + 7 * s, 900], [tx - 7 * s, 900]]); c.fill();
      c.strokeStyle = CHOC; c.lineCap = 'round';
      for (const b of branches) { c.lineWidth = 6 * s; c.beginPath(); c.moveTo(...b[0]); c.quadraticCurveTo(...b[1], ...b[2]); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(tx - 9 * s, 920, 3, QY - 930);
    };
    const leaves = (c) => {
      for (const [col, pick] of [[GREEN, (v) => v < 0.45], [LEAF, (v) => v >= 0.45 && v < 0.8], [GREEN_L, (v) => v >= 0.8]]) {
        c.fillStyle = col; c.beginPath();
        for (const [x, y, rad, v] of crown) if (pick(v)) { c.moveTo(x + rad, y); c.ellipse(x, y, rad, rad * 0.75, 0, 0, Math.PI * 2); }
        c.fill();
      }
    };
    p.group('trees', { x: tx - 30, y: 860, w: 60, h: QY - 850 }, trunk, { t: 7.0 + i * 0.3, d: 0.8, reveal: 'rise' });
    p.group('trees', { x: tx - 190 * s, y: 540, w: 380 * s, h: 440 }, leaves, { t: 7.5 + i * 0.3, d: 1.1, reveal: 'pop', ease: 'back' });
    scene.push(trunk, leaves);
  });
}

// ---------------------------------------------------------------- the quay
function quay(p, r, scene) {
  const street = (c) => {
    c.fillStyle = '#8f8478'; c.fillRect(X0, QY, X1 - X0, 22);
    c.fillStyle = 'rgba(30,25,20,.25)';
    for (let x = X0; x < X1; x += 9) for (let y = QY + 3; y < QY + 20; y += 6) c.fillRect(x + ((y / 6) % 2) * 4, y, 6, 3);
    c.fillStyle = STONE; c.fillRect(X0, QY + 20, X1 - X0, 6);
    // the quay wall, with its mooring rings
    c.fillStyle = BRICK_D; c.fillRect(X0, QY + 26, X1 - X0, WL - QY - 24);
    c.fillStyle = 'rgba(0,0,0,.16)'; for (let y = QY + 31; y < WL; y += 6) c.fillRect(X0, y, X1 - X0, 1.2);
    c.strokeStyle = INK; c.lineWidth = 2;
    for (let x = X0 + 60; x < X1; x += 170) { c.beginPath(); c.arc(x, QY + 52, 6, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = 'rgba(30,50,45,.5)'; c.fillRect(X0, WL - 14, X1 - X0, 14);
  };
  p.group('quay', { x: X0, y: QY - 4, w: X1 - X0, h: WL - QY + 8 }, street, { t: 6.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  scene.push(street);
  // the little posts along the curb, and bikes parked against them
  const posts = [];
  for (let x = X0 + 30; x < X1; x += r.range(44, 60)) if (x < GAP0 - 10 || x > GAP1 + 10) posts.push(x);
  const bikes = [];
  for (let i = 0; i < 9; i++) { const x = r.range(X0 + 40, X1 - 40); if (x > GAP0 - 30 && x < GAP1 + 30) continue; bikes.push([x, r.pick([INK, INK, RED, '#2d5e8e', GREEN, YELLOW]), r.chance(0.5) ? 1 : -1, r.chance(0.4)]); }
  const furniture = (c) => {
    for (const x of posts) {
      c.fillStyle = OXBLOOD; c.fillRect(x - 4, QY - 26, 8, 30);
      c.beginPath(); c.arc(x, QY - 26, 4, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 3, QY - 22, 2, 20);
    }
    for (const [x, col, d, basket] of bikes) bike(c, x, QY + 4, 0.9, col, d, basket);
  };
  p.group('quay', { x: X0, y: QY - 60, w: X1 - X0, h: 70 }, furniture, { t: 7.4, d: 0.7, reveal: 'fade' });
  scene.push(furniture);
}

// a bicycle, side on, wheels on y
function bike(c, x, y, s, col, dir, basket) {
  const R = 13 * s;
  c.save(); c.translate(x, 0); c.scale(dir, 1); c.translate(-x, 0);
  c.strokeStyle = INK; c.lineWidth = 1.8 * s;
  c.beginPath(); c.arc(x - 18 * s, y - R, R, 0, Math.PI * 2); c.moveTo(x + 18 * s + R, y - R); c.arc(x + 18 * s, y - R, R, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = col; c.lineWidth = 2.6 * s; c.beginPath();
  c.moveTo(x - 18 * s, y - R); c.lineTo(x - 2 * s, y - R); c.lineTo(x + 12 * s, y - R - 18 * s); c.lineTo(x - 6 * s, y - R - 18 * s); c.lineTo(x - 2 * s, y - R);
  c.moveTo(x - 18 * s, y - R); c.lineTo(x - 8 * s, y - R - 22 * s); c.moveTo(x + 18 * s, y - R); c.lineTo(x + 12 * s, y - R - 24 * s);
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2 * s; c.beginPath();
  c.moveTo(x - 13 * s, y - R - 23 * s); c.lineTo(x - 3 * s, y - R - 23 * s);
  c.moveTo(x + 12 * s, y - R - 24 * s); c.quadraticCurveTo(x + 6 * s, y - R - 30 * s, x + 2 * s, y - R - 26 * s); c.stroke();
  if (basket) { c.fillStyle = SAND; c.fillRect(x + 14 * s, y - R - 26 * s, 12 * s, 8 * s); }
  c.restore();
}

// ---------------------------------------------------------------- the humpback bridge
const B0 = GAP0 - 20, B1 = GAP1 + 20;
const deck = (x) => {
  const f = clamp((x - B0) / (B1 - B0));
  return QY - 58 * Math.sin(f * Math.PI) ** 0.8;
};
function bridge(p, r, scene) {
  const aw = 92, ay = WL + 4, acy = 1178; // the arch: half span, springing, crown
  const body = (c) => {
    const pts = [];
    for (let x = B0; x <= B1; x += 6) pts.push([x, deck(x) + 22]);
    pts.push([B1, WL + 6], [B0, WL + 6]);
    c.fillStyle = BRICK; poly(c, pts); c.fill();
    c.fillStyle = 'rgba(0,0,0,.1)';
    for (let y = QY - 60; y < WL; y += 6) c.fillRect(B0, y, B1 - B0, 1.2);
    // the opening: an elliptical arch with white stone voussoirs
    const arch = () => { c.beginPath(); c.moveTo(GX - aw, ay); c.ellipse(GX, ay, aw, ay - acy, 0, Math.PI, 0); c.closePath(); };
    c.fillStyle = mix(WATER, SKY, 0.25); arch(); c.fill();
    c.save(); arch(); c.clip();
    c.fillStyle = 'rgba(15,25,22,.75)'; c.beginPath(); c.ellipse(GX, ay + 6, aw - 4, ay - acy - 2, 0, Math.PI, 0); c.ellipse(GX, ay + 30, aw - 4, ay - acy - 6, 0, 0, Math.PI, true); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let y = ay - 40; y < ay; y += 9) c.fillRect(GX - 50 + ((y * 7) % 30), y, 40, 2);
    c.restore();
    for (let k = 0; k <= 16; k++) {
      const a0 = Math.PI + (k / 17) * Math.PI, a1 = Math.PI + ((k + 1) / 17) * Math.PI;
      const ri = 1, ro = 1.17;
      const P = (a, s) => [GX + Math.cos(a) * aw * s, ay + Math.sin(a) * (ay - acy) * s];
      c.fillStyle = k % 2 ? STONE : WHITE;
      poly(c, [P(a0, ri), P(a1, ri), P(a1, ro), P(a0, ro)]); c.fill();
    }
    // the white stone cap along the deck
    c.fillStyle = WHITE; c.beginPath();
    for (let x = B0; x <= B1; x += 6) c.lineTo(x, deck(x) + 14);
    for (let x = B1; x >= B0; x -= 6) c.lineTo(x, deck(x) + 24);
    c.fill();
  };
  p.group('bridge', { x: B0 - 10, y: QY - 80, w: B1 - B0 + 20, h: WL - QY + 100 }, body, { t: 8.0, d: 1.1, reveal: 'rise', ease: 'inOut' });
  scene.push(body);

  // the iron railing, drawn along by a pen
  const rail = [];
  for (let x = B0 + 6; x <= B1 - 6; x += 6) rail.push([x, deck(x) - 18]);
  p.pen('rail', rail, INK, 3.4, { t: 8.8, d: 1.0 });
  const bars = [];
  for (let x = B0 + 10; x < B1 - 6; x += 8) bars.push([[x, deck(x) + 14], [x, deck(x) - 18]]);
  p.strokes('rail', bars, INK, 1.4, { t: 9.2, d: 0.6, reveal: 'wipe' });
  const railArt = (c) => {
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); rail.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.lineWidth = 1.4; c.beginPath(); for (const [[a, b], [, d]] of bars) { c.moveTo(a, b); c.lineTo(a, d); } c.stroke();
  };
  scene.push(railArt);
  // the lamps at each end of the bridge
  for (const [lx, i] of [[B0 + 16, 0], [B1 - 16, 1]]) {
    const ly = deck(lx) + 14;
    const draw = (c) => bridgeLamp(c, lx, ly);
    p.group('rail', { x: lx - 30, y: ly - 170, w: 60, h: 176 }, draw, { t: 9.4 + i * 0.2, d: 0.7, reveal: 'drop', dy: 30 });
    scene.push(draw);
  }
  // bicycles leaning on the railing
  const leaning = [[B0 + 70, RED, 1], [GX + 40, INK, -1], [B1 - 80, '#2d5e8e', 1]];
  p.group('rail', { x: B0, y: QY - 120, w: B1 - B0, h: 120 }, (c) => {
    for (const [x, col, d] of leaning) bike(c, x, deck(x) + 14, 0.95, col, d, d > 0);
  }, { t: 9.9, d: 0.6, reveal: 'fade' });
}

function bridgeLamp(c, x, y) {
  c.fillStyle = INK;
  c.fillRect(x - 8, y - 16, 16, 16);
  c.fillRect(x - 3.5, y - 120, 7, 106);
  c.fillRect(x - 6, y - 60, 12, 6);
  c.fillRect(x - 9, y - 124, 18, 5);
  // the lantern, four panes
  poly(c, [[x - 10, y - 124], [x + 10, y - 124], [x + 13, y - 152], [x - 13, y - 152]]); c.fill();
  c.fillStyle = YELLOW; poly(c, [[x - 7, y - 127], [x + 7, y - 127], [x + 9, y - 149], [x - 9, y - 149]]); c.fill();
  c.fillStyle = INK; c.fillRect(x - 0.8, y - 150, 1.6, 24);
  poly(c, [[x - 16, y - 152], [x + 16, y - 152], [x, y - 166]]); c.fill();
}

// ---------------------------------------------------------------- houseboats
function houseboats(p, r, scene) {
  const boats = [
    { x: 110, w: 360, col: GREEN, cab: PLASTER },
    { x: 1080, w: 300, col: TAR, cab: '#c9d6cf' },
  ];
  boats.forEach((b, i) => {
    const draw = (c) => {
      const { x, w } = b, hy = WL + 14;
      // the hull
      c.fillStyle = b.col; poly(c, [[x, hy - 30], [x + w, hy - 30], [x + w - 14, hy + 6], [x + 10, hy + 6]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 4, hy - 26, w - 10, 3);
      // the cabin, its windows and a stove pipe
      c.fillStyle = b.cab; c.fillRect(x + 20, hy - 82, w - 60, 52);
      c.fillStyle = shade(b.cab, 0.85); c.fillRect(x + 20, hy - 82, w - 60, 6);
      for (let k = 0; k < Math.floor((w - 80) / 46); k++) win(c, x + 34 + k * 46, hy - 70, 30, 30, { frame: WHITE, rows: 1 });
      c.fillStyle = OXBLOOD; c.fillRect(x + w - 70, hy - 76, 22, 46);
      c.fillStyle = INK; c.fillRect(x + 40, hy - 112, 7, 30);
      // the roof garden: pots and plants
      for (let k = 0; k < 5; k++) {
        const px = x + 60 + k * (w - 120) / 4;
        c.fillStyle = OXBLOOD; c.fillRect(px - 7, hy - 96, 14, 14);
        c.fillStyle = k % 2 ? GREEN_L : LEAF; c.beginPath(); c.arc(px, hy - 102, 10 + (k % 3) * 2, 0, Math.PI * 2); c.fill();
        if (k % 2 === 0) { c.fillStyle = [RED, YELLOW, PINK][k / 2]; c.beginPath(); c.arc(px - 3, hy - 108, 3, 0, Math.PI * 2); c.arc(px + 4, hy - 104, 3, 0, Math.PI * 2); c.fill(); }
      }
      // the gangplank to the quay
      c.fillStyle = SAND; poly(c, [[x + w - 40, hy - 30], [x + w - 20, hy - 30], [x + w - 8, QY + 20], [x + w - 28, QY + 20]]); c.fill();
    };
    p.group('boats', { x: b.x - 10, y: WL - 110, w: b.w + 20, h: 140 }, draw, { t: 8.5 + i * 0.3, d: 1.0, reveal: 'slide', dx: i ? 80 : -80, ease: 'out' });
    scene.push(draw);
  });
}

// ---------------------------------------------------------------- the reflection
// the street, flipped into the canal, shaken a strip at a time; made once
function reflection(p, scene) {
  let src = null;
  const top = 300; // the highest part of the street that the water shows
  const make = () => {
    const cv = document.createElement('canvas');
    cv.width = X1 - X0; cv.height = WL - top;
    const c = cv.getContext('2d');
    c.translate(-X0, -top);
    for (const f of scene) { c.save(); f(c, 1); c.restore(); }
    return cv;
  };
  p.group('refl', { x: X0, y: WL, w: X1 - X0, h: Y1 - WL }, (c) => {
    src ??= make();
    const step = 2;
    for (let y = WL; y < Y1; y += step) {
      const d = y - WL;
      // the image squeezes a little as it goes down, the way water shortens it
      const sy = Math.round(2 * WL - (WL + d * 0.96) - step - top);
      if (sy < 0) break;
      const band = Math.sin(d * 0.045) * Math.sin(d * 0.011 + 0.6);
      const dx = band * (1.5 + d * 0.016) + Math.sin(d * 0.21) * (0.6 + d * 0.004);
      c.drawImage(src, 0, sy, X1 - X0, step, X0 + dx, y, X1 - X0, step + 0.5);
    }
    // the water over it, darker away from the wall
    const g = c.createLinearGradient(0, WL, 0, Y1);
    g.addColorStop(0, 'rgba(42,74,69,.45)'); g.addColorStop(1, 'rgba(32,58,54,.75)');
    c.fillStyle = g; c.fillRect(X0, WL, X1 - X0, Y1 - WL);
    // pale bands where the wind ruffles it
    c.fillStyle = 'rgba(211,224,223,.18)';
    for (let y = WL + 40; y < Y1; y += 37) c.fillRect(X0, y, X1 - X0, 2 + (y - WL) * 0.006);
  }, { t: 9.8, d: 1.6, reveal: 'fall', ease: 'inOut' });
}

// ---------------------------------------------------------------- what moves
function life(p, r) {
  // flowers: boxes of tulips along the bridge
  // (the sill boxes are part of each house; these are the bridge's)
  const boxes = [];
  for (let x = B0 + 40; x < B1 - 40; x += 46) boxes.push([x, deck(x) - 16]);
  boxes.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < boxes.length; i += 6) {
    const set = boxes.slice(i, i + 6);
    p.group('flowers', boxOf(set, 40), (c) => { for (const [x, y] of set) tulips(c, x, y, rng(Math.floor(x * 7 + y))); }, { t: 9.6 + i * 0.03, d: 0.6, reveal: 'pop', ease: 'back' });
  }

  // ripples sliding along
  const rip = [];
  for (let i = 0; i < 60; i++) rip.push([r.range(X0, X1), r.range(WL + 30, Y1 - 10), r.range(20, 70), r.range(6, 20), r()]);
  p.live('ripples', {
    t: 9.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = 'rgba(240,244,236,.5)';
      c.beginPath();
      for (const [x, y, len, sp, ph] of rip) {
        const k = (y - WL) / (Y1 - WL);
        const xx = X0 + ((x - X0 + time * sp) % (X1 - X0 + 100)) - 50;
        const a = 0.5 + 0.5 * Math.sin(time * 1.3 + ph * 6);
        c.rect(xx, y, len * (0.4 + k) * a, 1.5 + k * 2);
      }
      c.fill();
    },
  });

  // cyclists along the quay and over the hump
  const riders = [
    { ph: 0.1, sp: 0.022, col: RED, coat: '#2d5e8e' }, { ph: 0.6, sp: 0.03, col: INK, coat: OXBLOOD },
    { ph: 0.35, sp: -0.026, col: '#2d5e8e', coat: YELLOW }, { ph: 0.85, sp: -0.02, col: GREEN, coat: TAR },
  ];
  p.live('riders', {
    t: 10.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const v of riders) {
        let f = (v.ph + time * v.sp) % 1; if (f < 0) f += 1;
        const x = lerp(X0 - 60, X1 + 60, f), dir = v.sp > 0 ? 1 : -1;
        const y = deck(x) + 4;
        const slope = (deck(x + 4) - deck(x - 4)) / 8;
        c.save(); c.translate(x, y); c.rotate(Math.atan(slope) * 0.9); c.translate(-x, -y);
        rider(c, x, y, 0.95, v.col, v.coat, dir, time * 9 * Math.abs(v.sp) * 40);
        c.restore();
      }
    },
  });

  // a little open boat with its people and a flag
  p.live('ripples', {
    t: 10.3, d: 1.0, reveal: 'slide', dx: -100,
    draw: (c, time) => {
      const x = 260 + Math.min(time, 120) * 5, y = 1640 + Math.sin(time * 1.2) * 2;
      sloop(c, x, y);
      // its own reflection, shaken
      c.save(); c.globalAlpha = 0.35;
      for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? OXBLOOD : WHITE; c.fillRect(x - 90 + Math.sin(time * 3 + k) * 4, y + 6 + k * 5, 180 - k * 12, 2.5); }
      c.restore();
      c.fillStyle = 'rgba(240,244,236,.7)';
      for (let k = 0; k < 3; k++) c.fillRect(x - 130 - k * 50, y + 2 + k * 3, 60 - k * 10, 2);
    },
  });

  // gulls, high up
  const gulls = [];
  for (let i = 0; i < 4; i++) gulls.push([r.range(200, 1200), r.range(180, 420), r() * 6, r.range(0.15, 0.25)]);
  p.live('flowers', {
    t: 10.6, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = 'round';
      for (const [x0, y0, ph, sp] of gulls) {
        const a = time * sp + ph, x = x0 + Math.cos(a) * 80, y = y0 + Math.sin(a * 1.4) * 20, fl = Math.sin(time * 5 + ph) * 5;
        c.beginPath(); c.moveTo(x - 14, y - 3 + fl); c.quadraticCurveTo(x - 6, y - 8, x, y); c.quadraticCurveTo(x + 6, y - 8, x + 14, y - 3 + fl); c.stroke();
      }
    },
  });
}

function tulips(c, x, y, rr) {
  c.fillStyle = GREEN; c.fillRect(x - 18, y - 2, 36, 10);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 18, y - 2, 36, 2);
  for (let k = 0; k < 6; k++) {
    const fx = x - 15 + k * 6, h = rr.range(10, 18);
    c.strokeStyle = GREEN_L; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx, y - 1); c.lineTo(fx, y - h); c.stroke();
    c.fillStyle = rr.pick([RED, RED, ORANGE, YELLOW, PINK, WHITE]);
    c.beginPath(); c.moveTo(fx - 3.4, y - h); c.lineTo(fx - 3.4, y - h - 6); c.lineTo(fx - 1.2, y - h - 4); c.lineTo(fx, y - h - 8); c.lineTo(fx + 1.2, y - h - 4); c.lineTo(fx + 3.4, y - h - 6); c.lineTo(fx + 3.4, y - h); c.quadraticCurveTo(fx, y - h + 3, fx - 3.4, y - h); c.fill();
  }
}

function rider(c, x, y, s, col, coat, dir, spin) {
  bike(c, x, y, s, col, dir, false);
  c.save(); c.translate(x, 0); c.scale(dir, 1); c.translate(-x, 0);
  const R = 13 * s, hip = [x - 6 * s, y - R - 26 * s];
  // legs pedaling
  const a = spin;
  const pedal = [x - 2 * s + Math.cos(a) * 7 * s, y - R + Math.sin(a) * 7 * s];
  const pedal2 = [x - 2 * s - Math.cos(a) * 7 * s, y - R - Math.sin(a) * 7 * s];
  c.strokeStyle = TAR; c.lineWidth = 4 * s; c.lineCap = 'round';
  for (const pd of [pedal2, pedal]) { c.beginPath(); c.moveTo(...hip); c.lineTo((hip[0] + pd[0]) / 2 + 5 * s, (hip[1] + pd[1]) / 2); c.lineTo(...pd); c.stroke(); }
  // body, arm, head
  c.fillStyle = coat; poly(c, [[hip[0] - 5 * s, hip[1] + 2 * s], [hip[0] + 6 * s, hip[1] + 2 * s], [x + 4 * s, y - R - 50 * s], [x - 6 * s, y - R - 52 * s]]); c.fill();
  c.strokeStyle = coat; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x - 1 * s, y - R - 46 * s); c.lineTo(x + 10 * s, y - R - 30 * s); c.stroke();
  c.fillStyle = '#e8c4a2'; c.beginPath(); c.arc(x, y - R - 58 * s, 6.5 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = TAR; c.beginPath(); c.arc(x - 1 * s, y - R - 60 * s, 6.5 * s, Math.PI * 0.9, Math.PI * 2.05); c.fill();
  c.restore();
}

function sloop(c, x, y) {
  c.fillStyle = OXBLOOD; poly(c, [[x - 100, y - 20], [x + 110, y - 24], [x + 92, y], [x - 88, y]]); c.fill();
  c.fillStyle = WHITE; c.fillRect(x - 96, y - 22, 200, 4);
  c.fillStyle = SAND; c.fillRect(x - 70, y - 30, 150, 8);
  // three people, and a flag on the stern
  for (const [px, col] of [[x - 50, YELLOW], [x, '#2d5e8e'], [x + 46, RED]]) {
    c.fillStyle = col; c.beginPath(); c.roundRect(px - 9, y - 54, 18, 26, 6); c.fill();
    c.fillStyle = '#e8c4a2'; c.beginPath(); c.arc(px, y - 61, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = TAR; c.beginPath(); c.arc(px, y - 63, 6.5, Math.PI, Math.PI * 2); c.fill();
  }
  c.fillStyle = INK; c.fillRect(x - 96, y - 70, 2, 50);
  c.fillStyle = RED; c.fillRect(x - 94, y - 70, 26, 6); c.fillStyle = WHITE; c.fillRect(x - 94, y - 64, 26, 6); c.fillStyle = BLUE; c.fillRect(x - 94, y - 58, 26, 6);
}

// ---------------------------------------------------------------- the name, up the right edge
function title(p) {
  const mc = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const word = 'amsterdam';
  let size = 176;
  const font = (s) => `800 ${s}px "Unbounded", sans-serif`;
  mc.font = font(size);
  const maxLen = 1250;
  let len = mc.measureText(word).width;
  if (len > maxLen) { size *= maxLen / len; mc.font = font(size); len = maxLen; }
  const base = 1517, foot = Y1; // the letters stand on a vertical baseline and read upward
  let k = 0;
  for (let i = 0; i < word.length; i++) {
    const s0 = mc.measureText(word.slice(0, i)).width, gw = mc.measureText(word[i]).width;
    const ch = word[i], f = font(size);
    const yb = foot - s0;
    p.group('title', { x: base - size * 1.05, y: yb - gw - 10, w: size * 1.3, h: gw + 20 }, (c) => {
      c.save(); c.translate(base, yb); c.rotate(-Math.PI / 2);
      c.font = f; c.fillStyle = INK; c.textBaseline = 'alphabetic'; c.fillText(ch, 0, 0);
      c.restore();
    }, { t: 10.7 + k * 0.2, d: 0.7, reveal: 'slide', dx: 70, ease: 'out' });
    k++;
  }
  // the colored blocks above it, a little De Stijl
  const ct = foot - len - 40;
  const blocks = [
    [1380, Y0, 140, 140, RED], [1380, Y0 + 150, 66, 66, BLUE], [1454, Y0 + 150, 66, 24, YELLOW], [1380, ct - 20, 140, 10, INK],
  ];
  blocks.forEach(([x, y, w, h, col], i) => {
    p.group('title', { x, y, w, h }, (c) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, { t: 12.6 + i * 0.15, d: 0.5, reveal: i % 2 ? 'wipe' : 'fall', ease: 'inOut' });
  });
  // the small type, also on its side
  const small = [['de grachten', 1405, 13.1], ['the canals', 1440, 13.3]];
  for (const [txt, bx, t] of small) {
    p.group('title', { x: bx - 30, y: Y0 + 240, w: 40, h: ct - Y0 - 260 }, (c) => {
      c.save(); c.translate(bx, ct - 44); c.rotate(-Math.PI / 2);
      c.font = '700 26px "Space Mono", monospace'; c.fillStyle = INK; c.fillText(txt, 0, 0);
      c.restore();
    }, { t, d: 0.6, reveal: 'fade' });
  }
}
