// Rome: a Piranesi etching. The Colosseum close and huge, its outer ring standing
// on the left with all four orders and broken down on the right to the inner
// arcades, so the eye goes in over the ruin to the far wall and the tiers of the
// cavea. Plants grow from the stone; tiny figures give the scale. The Arch of
// Constantine, the Meta Sudans and the Palatine stand beside it. All in line:
// sepia and black on warm paper, inside a plate mark, the name on a carved tablet.

import { Plate, W, H } from '../print.js';
import { lerp, clamp, poly, rng } from '../kit.js';

const PAPER = '#efe2c2', PLATE = '#e9dab6', STONE = '#e8d6ae', STONE_D = '#d9c298';
const INK = '#1c140d', SEPIA = '#4f3520', BROWN = '#7a5634', FAINT = '#9a7a55';
const DARK = '#2e2015', MID = '#5c4129';

const TITLE = 'ROMA';
const CAPTION = "VEDUTA DELL'ANFITEATRO FLAVIO, DETTO IL COLOSSEO";
const KEY = ['1. Anfiteatro Flavio', '2. Arco di Costantino', '3. Meta Sudante', '4. Monte Palatino', '5. Cupola di S. Pietro'];

export const city = {
  id: 'rome', name: 'Rome', wall: '#2b2119',
  alt: 'A sepia etching of the Colosseum, close and huge, its outer ring of arches standing on the left and broken down on the right to show the tiers inside, with plants growing from the stone, tiny figures, the Arch of Constantine, the Meta Sudans, the Palatine with umbrella pines and the far dome of St. Peter’s, and in the dark foreground a broken column, fallen stones, figures in silhouette and the name ROMA cut in a stone tablet leaning against a block',
  google: 'family=Marcellus',
  fonts: [['400 100px "Marcellus"', TITLE + CAPTION + KEY.join('') + 'TAV. I 0123456789']],
  build,
};

// the image window inside the plate
const IX = 120, IY = 120, IW = W - 240, IH = 1540;
const FONT = '"Marcellus", serif';

// ---------------------------------------------------------------- the camera
// A pinhole looking level along +Y from 72 m up, as from a hill: verticals
// stay vertical, and the eye sees over the broken ring into the cavea.
const F = 2500, CX = 760, HY = 480, EYE = 72;
const proj = (X, Y, Z) => [CX + (F * X) / Y, HY - (F * (Z - EYE)) / Y];
const groundY = (Y) => HY + (F * EYE) / Y;

// ---------------------------------------------------------------- the amphitheater
// An ellipse 188 by 156 m, turned a little, in 80 bays. b counts bays round the
// ring (0 to 80), d is meters in from the outer face, z is height.
const OX = -12, OY = 300, PSI = -0.32, A = 94, B = 78, NB = 80;
const BAY = 6.77;
const LIGHT = (() => { const l = Math.hypot(0.92, 0.22); return [0.92 / l, -0.22 / l]; })(); // the sun low on the right

const ARC = (() => {
  const n = 4096, cum = [0];
  let s = 0, px = A, py = 0;
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, x = A * Math.cos(a), y = B * Math.sin(a);
    s += Math.hypot(x - px, y - py); cum.push(s); px = x; py = y;
  }
  return { n, cum, total: s };
})();
function thAt(b) {
  let t = b / NB; t -= Math.floor(t);
  const target = t * ARC.total, cum = ARC.cum;
  let lo = 0, hi = ARC.n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < target) lo = m; else hi = m; }
  const f = (target - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]);
  return ((lo + f) / ARC.n) * Math.PI * 2;
}
const cp = Math.cos(PSI), sp = Math.sin(PSI);
function at(b, d) {
  const th = thAt(b), ca = Math.cos(th), sa = Math.sin(th);
  let nx = ca / A, ny = sa / B; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
  const ex = A * ca - d * nx, ey = B * sa - d * ny;
  return { X: OX + ex * cp - ey * sp, Y: OY + ex * sp + ey * cp, nx: nx * cp - ny * sp, ny: nx * sp + ny * cp };
}
const S = (b, d, z) => { const q = at(b, d); return proj(q.X, q.Y, z); };
const facing = (b, d) => { const q = at(b, d); return -q.X * q.nx - q.Y * q.ny > 0; };
// 0 in full light, 1 in full shade; inner faces look the other way
const shadeAt = (b, sign = 1) => { const q = at(b, 0); return clamp(0.5 - 0.5 * sign * (q.nx * LIGHT[0] + q.ny * LIGHT[1]) * 1.25); };
const bayLen = (d) => BAY * (1 - d / 86);

// where each ring turns from front to back (b runs left to right along the front)
function frontRange(d) {
  let l = null, rr = null;
  for (let b = 0; b < NB; b += 0.02) {
    const f0 = facing(b, d), f1 = facing(b + 0.02, d);
    if (!f0 && f1) l = b + 0.02;
    if (f0 && !f1) rr = b;
  }
  return [l, rr < l ? rr + NB : rr];
}

// a polyline along the ring at height z (a number or a function of b)
function along(b0, b1, d, z, step = 0.125) {
  const pts = [];
  const n = Math.max(1, Math.ceil((b1 - b0) / step));
  for (let i = 0; i <= n; i++) { const b = lerp(b0, b1, i / n); pts.push(S(b, d, typeof z === 'function' ? z(b) : z)); }
  return pts;
}
// a stepped broken top: flat runs and drops, as [b, z] pairs
function brokenTop(r, b0, b1, zAt, amp, step = 0.3) {
  const out = [];
  let b = b0;
  while (b < b1 - 1e-6) {
    const nb = Math.min(b1, b + step * r.range(0.4, 1.4));
    const z = zAt((b + nb) / 2) - r() * amp;
    out.push([b, z], [nb, z]);
    b = nb;
  }
  return out;
}
// densify a profile so its runs follow the curve
function profilePts(prof, d) {
  const pts = [];
  for (let i = 0; i < prof.length; i++) {
    const [b, z] = prof[i];
    if (i > 0 && prof[i - 1][1] === z) {
      const b0 = prof[i - 1][0];
      const n = Math.ceil((b - b0) / 0.125);
      for (let k = 1; k < n; k++) pts.push(S(lerp(b0, b, k / n), d, z));
    }
    pts.push(S(b, d, z));
  }
  return pts;
}
// the wall between the ground (or z0) and a broken top, as one polygon
function wallPoly(prof, d, z0 = 0) {
  const b0 = prof[0][0], b1 = prof[prof.length - 1][0];
  return [...along(b0, b1, d, z0), ...profilePts(prof, d).reverse()];
}
const flatTop = (b0, b1, z) => [[b0, z], [b1, z]];
// height of a profile at b
function topAt(prof, b) {
  for (let i = prof.length - 1; i >= 0; i--) if (prof[i][0] <= b) return prof[i][1];
  return prof[0][1];
}

// an arched opening in bay i: u is across the bay (0 to 1), from sill to spring and round
function archPts(i, d, w, sill, spring) {
  const L = bayLen(d), rad = w * L, pts = [];
  pts.push(S(i + 0.5 - w, d, sill), S(i + 0.5 - w, d, spring));
  for (let k = 1; k < 12; k++) {
    const a = Math.PI - (k / 12) * Math.PI;
    pts.push(S(i + 0.5 + w * Math.cos(a), d, spring + rad * Math.sin(a)));
  }
  pts.push(S(i + 0.5 + w, d, spring), S(i + 0.5 + w, d, sill));
  return pts;
}

// vertical lines on a ring face, closer together where it turns from the light
function vHatch(r, d, b0, b1, z0, z1, sign = 1, sp0 = 7, sp1 = 2.0, floor = 0) {
  const lines = [];
  let lx = null;
  for (let b = b0; b < b1; b += 0.01) {
    const sh = Math.max(floor, shadeAt(b, sign));
    const za = typeof z0 === 'function' ? z0(b) : z0, zb = typeof z1 === 'function' ? z1(b) : z1;
    if (zb <= za + 0.1) { lx = null; continue; }
    const [x, ya] = S(b, d, za);
    if (lx !== null && Math.abs(x - lx) < lerp(sp0, sp1, sh)) continue;
    const [, yb] = S(b, d, zb);
    lines.push([[x + r.range(-0.25, 0.25), ya], [x, yb + r.range(0, 0.6)]]);
    lx = x;
  }
  return lines;
}
// the quads of the bays turned furthest from the light, for cross-hatching
function shadeQuads(d, b0, b1, z0, z1, min, sign = 1) {
  const quads = [];
  for (let b = Math.floor(b0 * 4) / 4; b < b1; b += 0.25) {
    if (shadeAt(b + 0.125, sign) < min) continue;
    const ba = Math.max(b0, b), bb = Math.min(b1, b + 0.25);
    quads.push([...along(ba, bb, d, z0, 0.125), ...along(ba, bb, d, z1, 0.125).reverse()]);
  }
  return quads;
}

// boxes ---------------------------------------------------------------------
function bbox(pts, pad = 4) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

// lines across a polygon at an angle, clipped later by the polygon itself
function hatchLines(box, step, ang, jit = 0, r = null) {
  const lines = [];
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2, R = Math.hypot(box.w, box.h) / 2 + 4;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  for (let s = -R; s <= R; s += step) {
    const o = r ? r.range(-jit, jit) : 0;
    lines.push([[cx + nx * (s + o) - dx * R, cy + ny * (s + o) - dy * R], [cx + nx * (s + o) + dx * R, cy + ny * (s + o) + dy * R]]);
  }
  return lines;
}
function strokeLines(c, lines, color, lw) {
  c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  for (const l of lines) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); }
  c.stroke();
}
function clipTo(c, polys) {
  c.beginPath();
  for (const pts of polys) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  c.clip();
}
function fillPolys(c, polys, color) {
  c.fillStyle = color;
  c.beginPath();
  for (const pts of polys) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  c.fill();
}

// a heavy group drawn once into its own canvas, at the press's scale and on its
// pixel grid, then copied each frame while it arrives: the hatching is costly
let CACHES = [], SPENT = [], TINY = null;
// fn may be a list of steps, drawn in turn into the same context (its clips kept)
function cached(box, fn, t = 0, d = 0.8) {
  const steps = Array.isArray(fn) ? fn : [fn];
  const e = { t, d, cv: null, g: null, ck: 0, ox: 0, oy: 0, i: 0, baked: false };
  e.start = (k) => {
    e.ox = Math.floor(box.x * k); e.oy = Math.floor(box.y * k);
    const w = Math.max(1, Math.ceil((box.x + box.w) * k) - e.ox), h = Math.max(1, Math.ceil((box.y + box.h) * k) - e.oy);
    e.cv = document.createElement('canvas'); e.cv.width = w; e.cv.height = h;
    e.g = e.cv.getContext('2d');
    e.g.setTransform(k, 0, 0, k, -e.ox, -e.oy);
    e.ck = k; e.i = 0; e.baked = false;
  };
  e.ready = (k) => e.baked || (e.cv && e.ck === k && e.i === steps.length);
  // one step, then copy the canvas once out of sight so its drawing is done now
  e.step = (k) => {
    if (!e.cv || e.ck !== k) e.start(k);
    steps[e.i++](e.g);
    TINY ??= document.createElement('canvas'); TINY.width = TINY.height = 1;
    TINY.getContext('2d').drawImage(e.cv, 0, 0, 1, 1);
  };
  CACHES.push(e);
  // once it is whole (q is 1) and has not been drawn for a few frames, it is
  // pressed for good and its canvas is let go
  return (c, q) => {
    const k = c.canvas.width / W;
    if (!e.cv || e.ck !== k) e.start(k);
    while (e.i < steps.length) steps[e.i++](e.g);
    c.drawImage(e.cv, e.ox / k, e.oy / k, e.cv.width / k, e.cv.height / k);
    if (q === 1) { if (!e.baked) SPENT.push(e); e.baked = true; e.idle = 0; }
  };
}
const G = (p, layer, box, fn, o) => p.group(layer, box, cached(box, fn, o.t, o.d ?? 0.8), o);

// the groups' canvases are made ahead, a step or a few a frame in the quiet
// early seconds, so none costs its whole drawing in the frame it starts to
// arrive; groups already whole are skipped. It draws nothing itself, and sits
// on a layer that already moves.
function prebuild(p) {
  const list = CACHES.slice().sort((a, b) => a.t - b.t);
  let next = 0, last = 0;
  p.live('mid', {
    t: 0, d: 0.01, reveal: 'none',
    draw: (c, time) => {
      const k = c.canvas.width / W, t0 = performance.now();
      // played again from the start: make them all again
      if (time < last) { for (const e of list) e.baked = false; next = 0; }
      last = time;
      if (list[0] && list[0].ck !== k) next = 0;
      // let go of the canvases of whole groups not drawn for three frames
      for (const e of SPENT) if (++e.idle > 3 && e.baked && e.cv) { e.cv.width = e.cv.height = 0; e.cv = e.g = null; }
      SPENT = SPENT.filter((e) => e.cv);
      while (next < list.length) {
        const e = list[next];
        if (time >= e.t + e.d || e.ready(k)) { next++; continue; }
        e.step(k);
        if (performance.now() - t0 > 3) break;
      }
    },
  });
}

// ---------------------------------------------------------------- build
function build() {
  CACHES = []; SPENT = [];
  const p = new Plate({ paper: PAPER, seed: 1756 });
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IH };
  // few layers, each drawn in time order, so finished marks are pressed at once
  p.stack('plate', 'sky', 'land', 'colBack', 'colFront', 'mid', 'front', 'tablet', 'frame', 'caption');
  for (const n of ['plate', 'frame', 'caption']) p.layer(n, { clip: false });

  plate(p);
  sky(p, rng(11));
  distance(p, rng(12));
  ground(p, rng(13));
  const geo = colosseum(p, rng(14));
  plants(p, rng(15), geo);
  metaSudans(p, rng(16));
  arch(p, rng(17));
  figures(p, rng(18), geo);
  foreground(p, rng(19));
  birds(p, rng(20));
  tablet(p, rng(21));
  caption(p);
  prebuild(p);
  // press each layer's marks in the order they finish (stable, so ties keep their stacking)
  for (const n of ['land', 'colFront', 'mid']) p.layers[n].marks.sort((m1, m2) => m1.t + m1.d - (m2.t + m2.d));
  return p;
}

// ---------------------------------------------------------------- the plate
function plate(p) {
  // the plate's own tone and its bevelled edge, pressed into the sheet
  p.group('plate', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PLATE; c.fillRect(70, 70, W - 140, H - 140);
    c.strokeStyle = 'rgba(90,64,40,.35)'; c.lineWidth = 3; c.strokeRect(70, 70, W - 140, H - 140);
    c.strokeStyle = 'rgba(255,250,235,.55)'; c.lineWidth = 2; c.strokeRect(75, 75, W - 150, H - 150);
    c.strokeStyle = 'rgba(90,64,40,.18)'; c.lineWidth = 1; c.strokeRect(78, 78, W - 156, H - 156);
  }, { t: 0.05, d: 1.0, reveal: 'fade', ease: 'soft' });
}

// ---------------------------------------------------------------- the sky
// ruled lines, darker and closer toward the top; the clouds are where the
// ruling stops, with their bellies shaded in short strokes
function noise2(r) {
  const N = 64, g = [];
  for (let i = 0; i < N * N; i++) g.push(r());
  const v = (i, j) => g[((j % N + N) % N) * N + ((i % N + N) % N)];
  const sm = (t) => t * t * (3 - 2 * t);
  const n = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
    return lerp(lerp(v(i, j), v(i + 1, j), fx), lerp(v(i, j + 1), v(i + 1, j + 1), fx), fy);
  };
  return (x, y) => n(x, y) * 0.55 + n(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + n(x * 4.3 + 1, y * 4.3 + 9) * 0.15;
}
function sky(p, r) {
  const nz = noise2(r);
  const y0 = IY + 3, y1 = HY + 12;
  // clouds lie in long banks, thicker in the middle of the sky
  const dens = (x, y) => {
    const k = (y - y0) / (y1 - y0);
    return nz(x / 230, y / 62) + 0.16 * Math.sin(k * Math.PI) ** 1.5 - 0.1 * (k > 0.85 ? (k - 0.85) * 6 : 0) + (x < 600 && k < 0.35 ? -0.08 : 0);
  };
  const TH = 0.6;
  const rows = [];
  for (let y = y0; y < y1;) {
    const k = (y - y0) / (y1 - y0);
    const segs = [], belly = [], soft = [];
    let run = null, brun = null;
    for (let x = IX; x <= IX + IW; x += 3) {
      const yy = y + Math.sin(x * 0.004 + y * 0.01) * 0.7;
      const dv = dens(x, y);
      const inside = dv > TH;
      if (!inside) { if (!run) run = []; run.push([x, yy]); } else if (run) { if (run.length > 1) segs.push(run); run = null; }
      // the shaded underside: inside the cloud, just above where it ends
      const under = inside && dens(x, y + 10) < TH + 0.01 && dv < TH + 0.09;
      if (under) { if (!brun) brun = []; brun.push([x, yy]); } else if (brun) { if (brun.length > 1) belly.push(brun); brun = null; }
      if (inside && dv < TH + 0.025 && r() < 0.5) soft.push([[x, yy], [x + 2, yy]]);
    }
    if (run && run.length > 1) segs.push(run);
    if (brun && brun.length > 1) belly.push(brun);
    rows.push({ y, segs, belly, soft, lw: lerp(1.2, 0.5, k) });
    y += lerp(3.4, 5.6, k);
  }
  const per = 16;
  for (let i = 0; i < rows.length; i += per) {
    const band = rows.slice(i, i + per);
    const box = { x: IX, y: band[0].y - 4, w: IW, h: band[band.length - 1].y - band[0].y + 8 };
    const segs = band.flatMap((rw) => rw.segs), lw = band[0].lw;
    G(p, 'sky', box, (c) => strokeLines(c, segs, SEPIA, lw), { t: 0.4 + (i / per) * 0.15, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  }
  // the zenith: a second set of lines across the top, fading down
  const cross = [];
  for (let s = -500; s < 1600; s += 4.4) cross.push([[IX + s, IY], [IX + s + 330, IY + 230]]);
  G(p, 'sky', { x: IX, y: IY, w: IW, h: 240 }, (c) => {
    c.save();
    c.beginPath(); c.rect(IX, IY, IW, 232); c.clip();
    strokeLines(c, cross, 'rgba(60,40,24,.6)', 0.6);
    const g = c.createLinearGradient(0, IY, 0, IY + 230);
    g.addColorStop(0, 'rgba(233,218,182,0)'); g.addColorStop(1, 'rgba(233,218,182,1)');
    c.fillStyle = g; c.fillRect(IX, IY, IW, 232);
    c.restore();
  }, { t: 1.5, d: 1.2, reveal: 'fade' });
  // the bellies and soft edges of the clouds
  for (let i = 0; i < rows.length; i += per * 2) {
    const band = rows.slice(i, i + per * 2);
    const box = { x: IX, y: band[0].y - 6, w: IW, h: band[band.length - 1].y - band[0].y + 12 };
    const belly = band.flatMap((rw) => rw.belly), soft = band.flatMap((rw) => rw.soft);
    G(p, 'sky', box, (c) => { strokeLines(c, belly, 'rgba(46,32,21,.8)', 0.8); strokeLines(c, soft, 'rgba(79,53,32,.6)', 0.6); }, { t: 1.9 + (i / per) * 0.12, d: 1.0, reveal: 'wipeL' });
  }
}

// ---------------------------------------------------------------- the distance
// the city spread out below the hills, roofs and domes and towers getting
// fainter toward the horizon, the far dome of St. Peter’s on the left
function distance(p, r) {
  const hills = [];
  for (let x = IX; x <= IX + IW; x += 8) hills.push([x, HY - 4 - Math.sin(x * 0.005 + 0.6) * 7 - Math.sin(x * 0.019 + 1) * 3 - (x > 900 && x < 1300 ? Math.sin((x - 900) / 400 * Math.PI) * 14 : 0)]);
  p.pen('land', hills, FAINT, 1, { t: 1.3, d: 1.4 });
  const hillShade = [];
  for (let x = IX; x <= IX + IW; x += 3.2) { const k = Math.floor((x - IX) / 8); const y = hills[Math.min(k, hills.length - 1)][1]; if (r() < 0.6) hillShade.push([[x, y + 1], [x, HY + 2]]); }
  G(p, 'land', { x: IX, y: HY - 40, w: IW, h: 50 }, (c) => strokeLines(c, hillShade, 'rgba(154,122,85,.5)', 0.5), { t: 1.7, d: 1.0, reveal: 'wipe' });

  // rows of houses from far to near: the nearer, the larger and darker
  const rows = [6000, 4200, 3000, 2200, 1650, 1250, 960];
  rows.forEach((Y, k) => {
    const s = F / Y, yb = groundY(Y), shapes = [];
    for (let x = IX - 10; x < IX + IW + 10;) {
      const w = r.range(10, 24) * s * (Y > 3000 ? 1.4 : 1), h = r.range(6, 18) * s;
      shapes.push({ x, w, h, roof: r() < 0.6, tower: r() < 0.05, dome: r() < 0.03 && Y < 4000, dy: r.range(-1.5, 1.5) * s * 3 });
      x += w + r.range(-0.4, 0.3) * w;
    }
    const ink = k < 3 ? 'rgba(154,122,85,.55)' : 'rgba(122,86,52,.7)';
    G(p, 'land', { x: IX, y: yb - 90 * s - 10, w: IW, h: 100 * s + 20 }, (c) => {
      for (const b of shapes) {
        const y0 = yb + b.dy, x0 = b.x;
        c.fillStyle = PLATE; c.fillRect(x0, y0 - b.h, b.w, b.h);
        // the shaded side and a few windows
        c.strokeStyle = ink; c.lineWidth = 0.5;
        c.beginPath();
        for (let xx = x0 + b.w * 0.66; xx < x0 + b.w; xx += 2.6) { c.moveTo(xx, y0 - b.h); c.lineTo(xx, y0); }
        c.stroke();
        c.lineWidth = 0.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y0 - b.h); c.lineTo(x0 + b.w, y0 - b.h); c.lineTo(x0 + b.w, y0); c.stroke();
        if (b.roof) { c.beginPath(); c.moveTo(x0 - 1, y0 - b.h); c.lineTo(x0 + b.w * 0.5, y0 - b.h - b.w * 0.22); c.lineTo(x0 + b.w + 1, y0 - b.h); c.stroke(); }
        if (b.tower) {
          const tw = b.w * 0.35, th = b.h * 1.9;
          c.fillStyle = PLATE; c.fillRect(x0 + b.w * 0.3, y0 - b.h - th, tw, th); c.strokeRect(x0 + b.w * 0.3, y0 - b.h - th, tw, th);
          c.beginPath(); c.moveTo(x0 + b.w * 0.3 - 1, y0 - b.h - th); c.lineTo(x0 + b.w * 0.3 + tw / 2, y0 - b.h - th - tw * 0.6); c.lineTo(x0 + b.w * 0.3 + tw + 1, y0 - b.h - th); c.stroke();
        }
        if (b.dome) {
          const dr = b.w * 0.42;
          c.beginPath(); c.arc(x0 + b.w / 2, y0 - b.h, dr, Math.PI, 0); c.fillStyle = PLATE; c.fill(); c.stroke();
          c.beginPath(); c.moveTo(x0 + b.w / 2, y0 - b.h - dr); c.lineTo(x0 + b.w / 2, y0 - b.h - dr - 4 * s * 3); c.stroke();
        }
      }
    }, { t: 1.7 + k * 0.22, d: 1.0, reveal: 'rise', ease: 'inOut' });
  });

  // the dome of St. Peter's on the horizon: drum, ribbed dome, lantern
  const sx = 330, sy = groundY(4200), s = F / 4200;
  G(p, 'land', { x: sx - 60 * s - 10, y: sy - 150 * s - 10, w: 120 * s + 20, h: 150 * s + 20 }, (c) => {
    c.strokeStyle = BROWN; c.lineWidth = 0.9; c.fillStyle = PLATE;
    const R = 21 * s, drumH = 18 * s, base = sy - 46 * s;
    c.fillRect(sx - 60 * s, base, 120 * s, 46 * s); c.strokeRect(sx - 60 * s, base, 120 * s, 46 * s);
    c.fillRect(sx - R * 1.05, base - drumH, R * 2.1, drumH); c.strokeRect(sx - R * 1.05, base - drumH, R * 2.1, drumH);
    c.beginPath(); c.moveTo(sx - R, base - drumH); c.bezierCurveTo(sx - R, base - drumH - R * 1.25, sx - R * 0.2, base - drumH - R * 1.35, sx, base - drumH - R * 1.38);
    c.bezierCurveTo(sx + R * 0.2, base - drumH - R * 1.35, sx + R, base - drumH - R * 1.25, sx + R, base - drumH); c.closePath(); c.fill(); c.stroke();
    c.beginPath();
    for (const k of [-0.6, -0.25, 0.1, 0.45]) { c.moveTo(sx + k * R, base - drumH); c.quadraticCurveTo(sx + k * R * 0.9, base - drumH - R * 1.1, sx + k * 0.15 * R, base - drumH - R * 1.36); }
    for (let x = sx - R; x < sx + R; x += R / 4) { c.moveTo(x, base - drumH + 2); c.lineTo(x, base - 2); }
    c.stroke();
    c.fillRect(sx - R * 0.16, base - drumH - R * 1.7, R * 0.32, R * 0.34); c.strokeRect(sx - R * 0.16, base - drumH - R * 1.7, R * 0.32, R * 0.34);
    c.beginPath(); c.moveTo(sx, base - drumH - R * 1.7); c.lineTo(sx, base - drumH - R * 2.05); c.stroke();
    // shade on its right
    c.strokeStyle = 'rgba(122,86,52,.6)'; c.lineWidth = 0.5; c.beginPath();
    for (let x = sx + R * 0.2; x < sx + R; x += 1.6) { c.moveTo(x, base - drumH - Math.sqrt(Math.max(0, 1 - ((x - sx) / R) ** 2)) * R * 1.3); c.lineTo(x, base); }
    c.stroke();
  }, { t: 2.5, d: 1.0, reveal: 'rise' });
  numeral(p, '5', sx + 34, sy - 120 * s, 3.5);

  // the Palatine: its hill, the tall brick arcades of the palace, and pines
  const top = (x) => 680 + Math.sin(x * 0.012) * 8 + Math.sin(x * 0.031) * 4 + (x < 1280 ? (1280 - x) * 0.6 : 0);
  const hill = [[1150, 1000]];
  for (let x = 1150; x <= IX + IW + 4; x += 6) hill.push([x, top(x)]);
  hill.push([IX + IW + 4, 1000]);
  const arcs = [];
  const tiers = [[1300, 1484, 770, 44, 22], [1314, 1470, 726, 40, 20], [1340, 1452, 686, 36, 18]];
  for (const [x0, x1, yb, h, w] of tiers) {
    for (let x = x0; x < x1; x += w + 7) {
      if (r() < 0.12) continue;
      const ht = h * r.range(0.85, 1);
      const pts = [[x, yb], [x, yb - ht + w / 2]];
      for (let k = 1; k < 8; k++) { const a = Math.PI + (k / 8) * Math.PI; pts.push([x + w / 2 + Math.cos(a) * w / 2, yb - ht + w / 2 + Math.sin(a) * w / 2]); }
      pts.push([x + w, yb - ht + w / 2], [x + w, yb]);
      arcs.push(pts);
    }
  }
  const massTop = (x) => (x < 1300 ? 790 : x < 1336 ? 736 : x < 1460 ? 642 - Math.sin(x * 0.07) * 8 : 690);
  const mass = [[1294, 790]];
  for (let x = 1294; x <= 1490; x += 4) mass.push([x, massTop(x) + (r() < 0.3 ? r.range(0, 10) : 0)]);
  mass.push([1490, 790]);
  G(p, 'land', bbox(hill, 10), (c) => {
    c.fillStyle = '#e4d3ad'; poly(c, hill); c.fill();
    c.save(); poly(c, hill); c.clip();
    strokeLines(c, hatchLines(bbox(hill), 3.4, 0.04), 'rgba(122,86,52,.55)', 0.6);
    c.restore();
    c.strokeStyle = BROWN; c.lineWidth = 1; poly(c, hill); c.stroke();
  }, { t: 1.9, d: 1.2, reveal: 'rise' });
  G(p, 'land', { x: 1280, y: 610, w: 220, h: 200 }, (c) => {
    c.fillStyle = '#dcc69c'; poly(c, mass); c.fill();
    c.save(); poly(c, mass); c.clip();
    strokeLines(c, hatchLines({ x: 1280, y: 610, w: 220, h: 200 }, 2.2, Math.PI / 2), 'rgba(79,53,32,.6)', 0.6);
    fillPolys(c, arcs, 'rgba(36,25,16,.85)');
    c.restore();
    c.strokeStyle = SEPIA; c.lineWidth = 1; poly(c, mass); c.stroke();
  }, { t: 2.4, d: 1.3, reveal: 'rise' });
  const pines = [[1196, 750, 1.0], [1250, 720, 0.85], [1474, 658, 1.2], [1405, 648, 0.85], [1160, 780, 0.7]];
  pines.forEach(([x, y, s2], i) => {
    G(p, 'land', { x: x - 70 * s2, y: y - 110 * s2, w: 140 * s2, h: 120 * s2 }, (c) => umbrellaPine(c, rng(300 + i), x, y, s2), { t: 2.8 + i * 0.15, d: 0.9, reveal: 'rise' });
  });
  [[1288, 736, 0.8], [1300, 738, 0.62], [1226, 740, 0.7]].forEach(([x, y, s2], i) => {
    G(p, 'land', { x: x - 12, y: y - 82 * s2, w: 24, h: 86 * s2 }, (c) => cypress(c, x, y, s2), { t: 3.1 + i * 0.12, d: 0.7, reveal: 'rise' });
  });
  numeral(p, '4', 1384, 620, 3.6);
}

function umbrellaPine(c, r, x, y, s) {
  // a tall bent trunk and a flat dark crown, shaded underneath
  c.strokeStyle = SEPIA; c.lineWidth = 2.2 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6 * s, y - 50 * s, x - 2 * s, y - 80 * s); c.stroke();
  c.lineWidth = 1.2 * s;
  c.beginPath(); c.moveTo(x + 1 * s, y - 62 * s); c.lineTo(x + 24 * s, y - 86 * s); c.moveTo(x - 1 * s, y - 70 * s); c.lineTo(x - 22 * s, y - 88 * s); c.stroke();
  const pts = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    pts.push([x - 2 * s + Math.cos(a) * 58 * s * (1 + r.range(-0.05, 0.05)), y - 86 * s + Math.sin(a) * 22 * s * (1 + r.range(-0.15, 0.15))]);
  }
  for (let i = n; i >= 0; i--) { const t = i / n; pts.push([x - 2 * s + lerp(-58, 58, t) * s, y - 82 * s + Math.sin(t * Math.PI) * 6 * s + r.range(-1, 1) * s]); }
  c.fillStyle = 'rgba(46,32,21,.75)'; poly(c, pts); c.fill();
  c.save(); poly(c, pts); c.clip();
  c.fillStyle = 'rgba(28,20,13,.6)'; c.fillRect(x - 70 * s, y - 92 * s, 140 * s, 20 * s);
  c.restore();
  // little tufts along the top
  c.strokeStyle = 'rgba(28,20,13,.8)'; c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 0; i < 26; i++) { const t = r(); const xx = x - 2 * s + lerp(-54, 54, t) * s, yy = y - 86 * s - Math.sin(t * Math.PI) * 21 * s; c.moveTo(xx, yy); c.lineTo(xx + r.range(-2, 2), yy - r.range(2, 5) * s); }
  c.stroke();
}
function cypress(c, x, y, s) {
  c.fillStyle = 'rgba(40,28,18,.75)';
  c.beginPath(); c.moveTo(x, y - 82 * s); c.quadraticCurveTo(x + 9 * s, y - 40 * s, x + 4 * s, y); c.lineTo(x - 4 * s, y); c.quadraticCurveTo(x - 9 * s, y - 40 * s, x, y - 82 * s); c.fill();
}

// ---------------------------------------------------------------- the ground
function ground(p, r) {
  // the trodden ground between the monuments: ruled lines, closer toward us,
  // with a lighter road running from the foreground to the arch
  const roadAt = (y) => { const k = clamp((y - 1440) / (IY + IH - 1440)); return [lerp(1275, 960, k) + Math.sin(k * 3) * 20, lerp(30, 170, k)]; };
  const road = (x, y) => { if (y < 1440) return false; const [cx, hw] = roadAt(y); return Math.abs(x - cx) < hw; };
  const rows = [];
  for (let y = HY + 4; y < IY + IH; y += lerp(5.5, 3.4, (y - HY) / (IY + IH - HY))) {
    const segs = []; let run = null;
    for (let x = IX; x <= IX + IW; x += 6) {
      const gap = road(x, y) ? r() < 0.7 : r() < 0.04;
      if (!gap) { if (!run) run = []; run.push([x, y + r.range(-0.6, 0.6)]); } else if (run) { if (run.length > 1) segs.push(run); run = null; }
    }
    if (run && run.length > 1) segs.push(run);
    rows.push({ y, segs });
  }
  const per = 22;
  for (let i = 0; i < rows.length; i += per) {
    const band = rows.slice(i, i + per);
    const k = i / rows.length;
    const segs = band.flatMap((rw) => rw.segs), col = k < 0.5 ? BROWN : SEPIA, lw = lerp(0.6, 1.1, k);
    G(p, 'land', { x: IX, y: band[0].y - 4, w: IW, h: band[band.length - 1].y - band[0].y + 8 }, (c) => strokeLines(c, segs, col, lw),
      { t: 0.8 + (i / per) * 0.1, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  }
  // the road's edges and wheel ruts
  const edgeL = [], edgeR = [], ruts = [];
  for (let y = 1450; y <= IY + IH; y += 10) {
    const [cx, hw] = roadAt(y);
    edgeL.push([cx - hw + r.range(-2, 2), y]); edgeR.push([cx + hw + r.range(-2, 2), y]);
    ruts.push([cx - hw * 0.35, y], [cx + hw * 0.3, y]);
  }
  const rut1 = ruts.filter((_, i) => i % 2 === 0), rut2 = ruts.filter((_, i) => i % 2 === 1);
  G(p, 'land', bbox([...edgeL, ...edgeR], 8), (c) => { strokeLines(c, [edgeL, edgeR], SEPIA, 1.1); strokeLines(c, [rut1, rut2], 'rgba(79,53,32,.55)', 0.8); }, { t: 2.2, d: 0.8, reveal: 'fall' });
  // tufts of grass and stones scattered over the ground
  const tufts = [], stones = [];
  for (let i = 0; i < 520; i++) {
    const y = lerp(HY + 30, IY + IH, r() ** 0.7), x = r.range(IX, IX + IW);
    if (road(x, y) && r() < 0.8) continue;
    const s = clamp((y - HY) / 600, 0.25, 1.4);
    if (r() < 0.7) {
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + r.range(-0.9, 0.9); tufts.push([[x, y], [x + Math.cos(a) * 6 * s, y + Math.sin(a) * 9 * s]]); }
    } else {
      const w = r.range(4, 10) * s, h = w * 0.5;
      stones.push([[x - w, y], [x - w * 0.8, y - h], [x + w * 0.6, y - h * 1.1], [x + w, y]]);
    }
  }
  G(p, 'land', { x: IX, y: HY, w: IW, h: IY + IH - HY }, (c) => { strokeLines(c, tufts, SEPIA, 0.8); strokeLines(c, stones, SEPIA, 0.9); }, { t: 3.3, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- the Colosseum
// the outer ring's three orders and attic: [z0, z1, spring, half width, sill, cornice from]
const ORDERS = [
  { z0: 0, z1: 10.6, spring: 7.0, w: 0.31, sill: 0.5, corn: 9.3, col: 0.065 },
  { z0: 10.6, z1: 21.9, spring: 17.8, w: 0.29, sill: 12.3, corn: 20.6, col: 0.058, ped: 12.3 },
  { z0: 21.9, z1: 32.8, spring: 28.6, w: 0.28, sill: 23.6, corn: 31.5, col: 0.055, ped: 23.6 },
];
const ATTIC = { z0: 32.8, z1: 48.5, win: [37.4, 40.3], corbel: 43.2, corn: 46.6 };

function colosseum(p, r) {
  const [fl, fr] = frontRange(0);
  const BRK = 70;                // the outer ring ends here, right of the middle
  const [f6l, f6r] = frontRange(6);
  const [, f12r] = frontRange(12);
  const geo = { fl, fr, BRK, tops: [] };

  // the outer wall's top: whole, with a few blocks gone, then broken down to the end
  const outerTop = brokenTop(r, fl - 0.5, BRK, (b) => {
    if (b < BRK - 3.2) return 48.7;
    return lerp(48.7, 12, clamp((b - (BRK - 3.2)) / 3.2) ** 0.9);
  }, 0, 0.25).map(([b, z], i, a) => [b, b < BRK - 3.2 ? z - (r() < 0.18 ? r.range(0.4, 1.6) : 0) : z - r.range(0, 1.8)]);
  // keep the stepped runs flat after the jitter
  for (let i = 1; i < outerTop.length; i += 2) outerTop[i][1] = outerTop[i - 1][1];
  geo.outerTop = outerTop;

  farSide(p, r, geo, f6r);
  innerRing(p, r, geo, 12, BRK - 1.2, f12r, (b) => lerp(31, 22, clamp((b - BRK) / 10)) + Math.sin(b * 1.7) * 2, 3.8, 4.0);
  innerRing(p, r, geo, 6, BRK - 0.8, f6r, (b) => lerp(23.5, 15, clamp((b - BRK) / 12)) + Math.sin(b * 2.3) * 1.5, 2.6, 4.4);
  outerWall(p, r, geo, outerTop);
  buttress(p, r, geo);
  numeral(p, '1', S(fl + 4, 0, 48.5)[0], S(fl + 4, 0, 48.5)[1] - 40, 7.2);
  return geo;
}

// the far side, seen from inside: the tall wall with light through its arches,
// the tiers of the cavea coming down in curves, and the arena
function farSide(p, r, geo, f6r) {
  const { fl } = geo;
  const b0 = (f6r % NB) + 0.1, b1 = fl;     // back: b rising runs right to left
  const tall = b0 + 8;                       // from here leftward the wall stands whole
  const prof = brokenTop(r, b0, b1, (b) => (b < tall ? lerp(19, 48.7, clamp((b - b0) / 8) ** 1.4) : 48.7), 1.4, 0.3);
  const face = wallPoly(prof, 0, 20);
  const arches3 = [], wins = [];
  for (let i = Math.ceil(b0); i < b1 - 1; i++) {
    const top = topAt(prof, i + 0.5);
    if (top > 31) arches3.push(archPts(i, 0, 0.28, 23.6, 28.6));
    if (top > 41 && i % 2 === 0) wins.push([S(i + 0.36, 0, ATTIC.win[0]), S(i + 0.64, 0, ATTIC.win[0]), S(i + 0.64, 0, ATTIC.win[1]), S(i + 0.36, 0, ATTIC.win[1])]);
  }
  const fbox = bbox(face, 6);
  const vlines = vHatch(r, 0, b0, b1, 20, (b) => topAt(prof, b) - 0.3, -1, 5.5, 2.0, 0.2);
  const courses = [];
  for (const z of [22.2, 23.4, 31.6, 32.6, 34, 46.6, 47.6]) {
    const pts = along(b0, b1, 0, z, 0.25).filter((_, i) => true);
    courses.push(pts);
  }
  G(p, 'colBack', fbox, (c) => {
    fillPolys(c, [face], STONE_D);
    c.save(); clipTo(c, [face]);
    strokeLines(c, vlines, 'rgba(79,53,32,.7)', 0.6);
    strokeLines(c, courses, 'rgba(46,32,21,.7)', 0.8);
    // the arches let the sky through
    fillPolys(c, arches3, PAPER); fillPolys(c, wins, PAPER);
    c.restore();
    c.strokeStyle = SEPIA; c.lineWidth = 0.8;
    for (const a of arches3) { poly(c, a); c.stroke(); }
    c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath();
    const tp = profilePts(prof, 0); c.moveTo(tp[0][0], tp[0][1]); for (const q of tp) c.lineTo(q[0], q[1]); c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // a few sky lines seen through the arches
  const skyBits = [];
  for (const a of arches3) { const bb = bbox(a, 0); for (let y = bb.y + 3; y < bb.y + bb.h; y += 4) skyBits.push([[bb.x, y], [bb.x + bb.w, y]]); }
  G(p, 'colBack', fbox, (c) => { c.save(); clipTo(c, arches3); strokeLines(c, skyBits, 'rgba(79,53,32,.5)', 0.5); c.restore(); }, { t: 3.6, d: 0.5, reveal: 'fade' });

  // the cavea: terraces of broken seating, each with a riser of dark vaults
  const T = [[4, 16, 22.5, 20.5], [16, 28, 16, 13], [28, 41, 9, 6.5]];
  const risers = [[16, 20.5, 16], [28, 13, 9], [41, 6.5, 0]];
  T.forEach(([da, db, za, zb], k) => {
    const prof0 = along(b0, b1, da, za, 0.2), prof1 = along(b0, b1, db, zb, 0.2);
    const top = [...prof0, ...prof1.reverse()];
    const steps = [];
    for (let d = da + 1.2; d < db; d += 1.25) {
      const z = lerp(za, zb, (d - da) / (db - da));
      // broken runs of seat steps
      let run = [];
      for (let b = b0; b <= b1; b += 0.2) {
        if (r() < 0.05) { if (run.length > 1) steps.push(run); run = []; continue; }
        run.push(S(b, d, z));
      }
      if (run.length > 1) steps.push(run);
    }
    const [dr, zr0, zr1] = risers[k];
    const rise = [...along(b0, b1, dr, zr0, 0.2), ...along(b0, b1, dr, zr1, 0.2).reverse()];
    const vaults = [];
    for (let i = Math.ceil(b0); i < b1 - 1; i++) {
      if (k === 2 && i % 2) continue;
      const hgt = zr0 - zr1, w = k === 2 ? 0.2 : 0.3;
      vaults.push(archPts(i, dr, w, zr1 + 0.2, zr1 + hgt * 0.55));
    }
    const vbox = bbox([...top, ...rise], 6);
    G(p, 'colBack', vbox, (c) => {
      fillPolys(c, [top], k === 2 ? '#e2cfa8' : '#dfcaa0');
      fillPolys(c, [rise], '#a88a62');
      c.save(); clipTo(c, [rise]);
      strokeLines(c, hatchLines(bbox(rise), 2.2, Math.PI / 2), 'rgba(28,20,13,.7)', 0.65);
      c.restore();
      fillPolys(c, vaults, '#160f09');
      strokeLines(c, steps, 'rgba(79,53,32,.75)', 0.7);
      c.strokeStyle = INK; c.lineWidth = 0.9;
      c.beginPath(); const e = along(b0, b1, dr, zr0, 0.2); c.moveTo(e[0][0], e[0][1]); for (const q of e) c.lineTo(q[0], q[1]); c.stroke();
    }, { t: 3.4 + k * 0.3, d: 0.8, reveal: 'fall', ease: 'inOut' });
  });
  // the arena floor, earth with a path across it
  const arena = along(0, NB, 41, 0, 0.5);
  const lines = [];
  const ab = bbox(arena, 0);
  for (let y = ab.y + 2; y < ab.y + ab.h; y += 3.2) lines.push([[ab.x, y], [ab.x + ab.w, y]]);
  G(p, 'colBack', bbox(arena, 6), (c) => {
    fillPolys(c, [arena], '#e4d3ad');
    c.save(); clipTo(c, [arena]); strokeLines(c, lines, 'rgba(122,86,52,.45)', 0.6); c.restore();
  }, { t: 4.2, d: 0.7, reveal: 'fade' });
  geo.arena = arena;
}

// an inner ring standing in the gap the outer one left: plain piers, arches,
// a broken top. Through its arches, the darkness of the vaults.
function innerRing(p, r, geo, d, b0, b1, zAt, amp, tStart) {
  const prof = brokenTop(r, b0, b1, zAt, amp, 0.35);
  const face = wallPoly(prof, d, 0);
  const arches = [], innerA = [];
  for (let i = Math.floor(b0); i < b1; i++) {
    for (const o of ORDERS.slice(0, 2)) {
      const top = Math.min(topAt(prof, i + 0.3), topAt(prof, i + 0.7));
      if (top < o.spring + 1) continue;
      arches.push(archPts(i, d, o.w, o.sill, o.spring));
      innerA.push(archPts(i, d + 5.5, o.w * 0.9, o.sill, o.spring));
    }
  }
  const vl = vHatch(r, d, b0, b1, 0.3, (b) => topAt(prof, b) - 0.2, 1, 5.5, 1.8, 0.25);
  const dq = shadeQuads(d, b0, b1, 0, 32, 0.45);
  const courses = [];
  for (const z of [0.6, 9.3, 10.6, 20.6, 21.9]) courses.push(along(b0, b1, d, z, 0.2));
  const box = bbox(face, 8);
  const tp = profilePts(prof, d);
  G(p, 'colBack', box, (c) => {
    fillPolys(c, [face], STONE);
    c.save(); clipTo(c, [face]);
    strokeLines(c, vl, 'rgba(46,32,21,.72)', 0.65);
    if (dq.length) { c.save(); clipTo(c, dq); c.fillStyle = 'rgba(46,32,21,.3)'; c.fillRect(box.x, box.y, box.w, box.h); strokeLines(c, hatchLines(box, 2.6, -1.0), 'rgba(28,20,13,.7)', 0.6); c.restore(); }
    strokeLines(c, courses, 'rgba(28,20,13,.75)', 0.9);
    fillPolys(c, arches, '#2a1d12');
    c.save(); clipTo(c, arches);
    strokeLines(c, hatchLines(box, 2.0, Math.PI / 2), 'rgba(12,8,5,.9)', 0.8);
    fillPolys(c, innerA, '#120c07'); c.restore();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.1;
    for (const a of arches) { poly(c, a); c.stroke(); }
    c.lineWidth = 1.3; c.beginPath(); c.moveTo(tp[0][0], tp[0][1]); for (const q of tp) c.lineTo(q[0], q[1]); c.stroke();
  }, { t: tStart, d: 1.0, reveal: 'rise', ease: 'inOut' });
  geo.tops.push({ prof, d });
}

// the outer wall: three orders of arches with half-columns, the attic with its
// windows and corbels, all in line, then the shade hatched over it
function outerWall(p, r, geo, prof) {
  const b0 = prof[0][0], b1 = prof[prof.length - 1][0];
  const face = wallPoly(prof, 0, 0);
  const top = (b) => topAt(prof, b);
  const fbox = bbox(face, 10);
  const bays = [];
  for (let i = Math.floor(b0); i < b1; i++) bays.push(i);

  // the plain wall, then the stories rising one by one

  // stone courses on the piers: thin broken lines, a course every 0.62 m, by story
  const byStory = [[], [], [], []];
  const storyOf = (z) => (z < 10.6 ? 0 : z < 21.9 ? 1 : z < 32.8 ? 2 : 3);
  for (let z = 0.7; z < 48; z += 0.62) {
    const into = byStory[storyOf(z)];
    // runs of a course, with gaps, and the joints between the blocks
    for (let b = b0; b < b1;) {
      const len = r.range(0.3, 1.6), gap = r.range(0.05, 0.5);
      const bb = Math.min(b1, b + len);
      if (z < top(b) - 0.3 && z < top(bb) - 0.3 && r() < 0.8) {
        into.push(along(b, bb, 0, z + r.range(-0.04, 0.04), 0.1));
        for (let j = b + r.range(0.05, 0.2); j < bb; j += r.range(0.16, 0.3)) into.push([S(j, 0, z), S(j, 0, z + 0.62)]);
      }
      b = bb + gap;
    }
  }

  const levels = [...ORDERS, ATTIC];
  levels.forEach((o, k) => {
    const t0 = 3.0 + k * 0.75;
    const zA = o.z0, zB = o.z1;
    // the band of wall for this story, clipped to the broken top
    const band = [...along(b0, b1, 0, k ? zA + 0.08 : zA, 0.125), ...along(b0, b1, 0, zB, 0.125).reverse()];
    const bandBox = bbox(band, 8);
    const arches = [], inner = [], cols = [], colShade = [], caps = [], holes = [];
    for (const i of bays) {
      if (top(i + 0.5) < zA + 1) continue;
      if (k < 3) {
        if (top(i + 0.2) > o.spring + 1 && top(i + 0.8) > o.spring + 1) {
          arches.push(archPts(i, 0, o.w, o.sill, o.spring));
          inner.push(archPts(i, 5.5, o.w * 0.92, o.sill, o.spring - 0.2));
        }
        // a half-column at the pier: its shade side hatched
        for (const bc of [i]) {
          if (bc < b0 + 0.1 || top(bc) < o.corn) continue;
          const zb = o.ped ?? o.z0 + 0.6, zt = o.corn - 0.9;
          const w = o.col;
          cols.push([S(bc - w, 0, zb), S(bc - w, 0, zt)], [S(bc + w, 0, zb), S(bc + w, 0, zt)]);
          for (let s = 0.15; s < 1; s += 0.22) colShade.push([S(bc + w * s, 0, zb), S(bc + w * s, 0, zt)]);
          // capital and base
          caps.push([S(bc - w * 1.5, 0, zt), S(bc + w * 1.5, 0, zt), S(bc + w * 1.5, 0, zt + 0.5), S(bc - w * 1.5, 0, zt + 0.5)]);
          caps.push([S(bc - w * 1.4, 0, zb), S(bc + w * 1.4, 0, zb), S(bc + w * 1.4, 0, zb + 0.35), S(bc - w * 1.4, 0, zb + 0.35)]);
        }
      } else {
        // the attic: flat pilasters, windows in every other bay, three corbels
        if (top(i) > ATTIC.corn) {
          const w = 0.05;
          cols.push([S(i - w, 0, zA + 1.2), S(i - w, 0, ATTIC.corn - 0.3)], [S(i + w, 0, zA + 1.2), S(i + w, 0, ATTIC.corn - 0.3)]);
          colShade.push([S(i + w * 0.4, 0, zA + 1.2), S(i + w * 0.4, 0, ATTIC.corn - 0.3)]);
        }
        if (i % 2 === 0 && top(i + 0.5) > ATTIC.win[1] + 0.5) arches.push([S(i + 0.37, 0, ATTIC.win[0]), S(i + 0.63, 0, ATTIC.win[0]), S(i + 0.63, 0, ATTIC.win[1]), S(i + 0.37, 0, ATTIC.win[1])]);
        for (const u of [0.22, 0.5, 0.78]) {
          if (top(i + u) < ATTIC.corbel + 1) continue;
          caps.push([S(i + u - 0.04, 0, ATTIC.corbel), S(i + u + 0.04, 0, ATTIC.corbel), S(i + u + 0.04, 0, ATTIC.corbel + 0.7), S(i + u - 0.04, 0, ATTIC.corbel + 0.7)]);
        }
      }
      // holes where the iron clamps were dug out
      for (let h = 0; h < (k === 3 ? 9 : 6); h++) {
        const u = r(), z = r.range(zA + 0.4, zB - 0.4);
        if (z > top(i + u) - 0.4) continue;
        if (k < 3 && Math.abs(u - 0.5) < o.w + 0.03 && z < o.spring + o.w * bayLen(0) + 0.3) continue;
        if (k === 3 && i % 2 === 0 && u > 0.33 && u < 0.67 && z > ATTIC.win[0] - 0.3 && z < ATTIC.win[1] + 0.3) continue;
        const [x, y] = S(i + u, 0, z);
        const s = F / at(i + u, 0).Y;
        holes.push([x, y, r.range(0.12, 0.26) * s, r.range(0.08, 0.16) * s]);
      }
    }
    // the band of stone: courses, holes and the shade
    const crossLines = [];
    const shadeLines = vHatch(r, 0, b0, b1, zA, (b) => (shadeAt(b) < 0.22 ? zA : Math.min(zB, top(b) - 0.15)), 1, 9, 1.9);
    const dark1 = shadeQuads(0, b0, b1, zA, zB, 0.45), dark2 = shadeQuads(0, b0, b1, zA, zB, 0.66);
    if (k < 3) {
      // the shade under each cornice, and the cast shade on the soffits
      for (let b = b0; b < b1; b += 0.03) {
        const zt = Math.min(o.corn, top(b));
        if (zt < o.corn - 1) continue;
        crossLines.push([S(b, 0, o.corn - 1.0), S(b, 0, o.corn)]);
      }
    }
    const cornice = [];
    if (k < 3) {
      for (const z of [o.corn, o.corn + 0.35, o.corn + 0.75, o.z1 - 0.2, o.z1]) cornice.push(clipRun(b0, b1, z, top));
    } else {
      for (const z of [zA + 0.1, zA + 1.2, ATTIC.corn, ATTIC.corn + 0.4, ATTIC.corn + 1.1]) cornice.push(clipRun(b0, b1, z, top));
    }
    const corn = cornice.flat();
    const sBox = bbox(band.concat(corn.flat()), 10);
    const bandClip = [band];

    // the shade deepens in steps as the ring turns from the sun
    const tones = [0.24, 0.31, 0.38, 0.45, 0.52, 0.6, 0.68, 0.76, 0.84].map((m) => shadeQuads(0, b0, b1, zA, zB, m)).filter((q) => q.length);
    const hA = hatchLines(sBox, 2.6, -1.05), hB = hatchLines(sBox, 2.3, 1.0), hC = hatchLines(sBox, 3.2, 0.2);
    // in steps, so its canvas can be made over a few frames
    G(p, 'colFront', sBox, [
      (c) => { c.save(); clipTo(c, [face]); clipTo(c, bandClip); c.fillStyle = STONE; c.fillRect(sBox.x, sBox.y, sBox.w, sBox.h); },
      (c) => { for (const q of tones) fillPolys(c, q, 'rgba(40,28,18,.13)'); },
      (c) => strokeLines(c, byStory[k], 'rgba(79,53,32,.5)', 0.5),
      (c) => strokeLines(c, shadeLines, 'rgba(28,20,13,.85)', 0.8),
      (c) => strokeLines(c, crossLines, 'rgba(20,14,9,.85)', 0.7),
      (c) => { if (dark1.length) { c.save(); clipTo(c, dark1); strokeLines(c, hA, 'rgba(20,14,9,.75)', 0.65); c.restore(); } },
      (c) => { if (dark2.length) { c.save(); clipTo(c, dark2); strokeLines(c, hB, 'rgba(20,14,9,.75)', 0.65); c.restore(); } },
      (c) => { if (dark2.length) { c.save(); clipTo(c, dark2); strokeLines(c, hC, 'rgba(20,14,9,.5)', 0.55); c.restore(); } },
      (c) => {
        c.fillStyle = 'rgba(20,14,9,.85)';
        for (const [x, y, rx, ry] of holes) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
        c.restore();
      },
    ], { t: t0, d: 1.0, reveal: 'rise', ease: 'inOut' });

    // the arches: black voids, the next ring's pier dimly seen through each
    const aBox = arches.length ? bbox(arches.flat(), 6) : sBox;
    if (arches.length) {
      const v1 = hatchLines(aBox, 2.4, Math.PI / 2 + 0.06), v2 = hatchLines(aBox, 2.8, -0.7);
      G(p, 'colFront', aBox, [
        (c) => { c.save(); clipTo(c, [face]); fillPolys(c, arches, k < 3 ? '#2c1e12' : '#140d08'); },
        (c) => { c.save(); clipTo(c, arches); strokeLines(c, v1, '#0e0905', 1.0); },
        (c) => strokeLines(c, v2, 'rgba(14,9,5,.9)', 0.8),
        (c) => {
          if (k < 3) { fillPolys(c, inner, '#0e0905'); }
          c.restore();
          c.strokeStyle = INK; c.lineWidth = 1.2;
          for (const a of arches) { poly(c, a); c.stroke(); }
          c.restore();
        },
      ], { t: t0 + 0.3, d: 0.8, reveal: 'wipe', ease: 'inOut' });
    }

    // the columns and capitals, and the cornice lines over them
    const cBox = bbox(band.concat(corn.flat(), cols.flat()), 10);
    G(p, 'colFront', cBox, (c) => {
      c.save(); clipTo(c, [face]);
      fillPolys(c, caps, STONE);
      strokeLines(c, colShade, 'rgba(28,20,13,.7)', 0.65);
      strokeLines(c, cols, INK, 0.9);
      c.strokeStyle = INK; c.lineWidth = 0.8;
      for (const q of caps) { poly(c, q); c.stroke(); }
      c.restore();
      cornice.forEach((runs, j) => strokeLines(c, runs, INK, j === 0 || j === 4 ? 1.4 : 0.9));
    }, { t: t0 + 0.45, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  });

  // the foot, the broken top and the end, inked last
  const tp = profilePts(prof, 0);
  const endLine = [S(b1, 0, top(b1 - 0.01)), S(b1, 0, 0)];
  const foot = along(b0, b1, 0, 0, 0.125);
  G(p, 'colFront', bbox([...tp, ...foot], 6), (c) => {
    strokeLines(c, [foot], INK, 1.6);
    strokeLines(c, [endLine], INK, 1.4);
  }, { t: 6.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  p.pen('colFront', tp, INK, 1.5, { t: 6.1, d: 1.0 });
  geo.outerFace = face;
  geo.top = top;
}
function clipRun(b0, b1, z, top) {
  const runs = []; let run = [];
  for (let b = b0; b <= b1 + 1e-6; b += 0.125) {
    if (top(b) < z + 0.05) { if (run.length > 1) runs.push(run); run = []; continue; }
    run.push(S(b, 0, z));
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

// the sloping brick buttress that holds the end of the outer ring
function buttress(p, r, geo) {
  const b1 = geo.outerTop[geo.outerTop.length - 1][0];
  const zt = 26;
  const pts = [...along(b1 - 0.35, b1 + 0.1, -0.6, zt, 0.05), ...along(b1 + 0.1, b1 + 2.6, -0.6, (b) => zt * (1 - (b - b1 - 0.1) / 2.5), 0.1), ...along(b1 + 2.6, b1 - 0.35, -0.6, 0, 0.1)];
  const bricks = [];
  for (let z = 0.4; z < zt; z += 0.42) {
    const bR = b1 + 0.1 + 2.5 * (1 - z / zt);
    bricks.push(along(b1 - 0.35, bR, -0.6, z + r.range(-0.05, 0.05), 0.1));
  }
  const box = bbox(pts, 8);
  const bv = vHatch(rng(7), -0.6, b1 - 0.35, b1 + 2.6, 0, zt, 1, 4, 1.8, 0.4);
  G(p, 'colFront', box, (c) => {
    fillPolys(c, [pts], '#d6bd96');
    c.save(); clipTo(c, [pts]);
    strokeLines(c, bricks, 'rgba(46,32,21,.7)', 0.65);
    strokeLines(c, bv, 'rgba(28,20,13,.45)', 0.55);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.4; poly(c, pts); c.stroke();
  }, { t: 6.4, d: 0.9, reveal: 'rise' });
}

// ---------------------------------------------------------------- plants
// tufts and bushes along every broken top and ledge, ivy hanging from the cornices
function plants(p, r, geo) {
  const bushes = [], hangs = [];
  const { outerTop } = geo;
  const top = geo.top;
  // along the broken tops of the inner rings and the outer wall
  const edges = [...geo.tops, { prof: outerTop, d: 0 }];
  edges.forEach(({ prof, d }) => {
    for (let i = 0; i < prof.length; i += 2) {
      if (r() < (d === 0 ? 0.7 : 0.3)) continue;
      const b = lerp(prof[i][0], prof[i + 1]?.[0] ?? prof[i][0], r());
      const [x, y] = S(b, d, prof[i][1]);
      const s = F / at(b, d).Y / 9;
      bushes.push({ x, y, s: s * (r() < 0.25 ? r.range(1.1, 1.6) : r.range(0.35, 0.8)), seed: r.int(1, 9999) });
    }
  });
  // on the cornice ledges of the outer wall
  for (const o of ORDERS) {
    for (let b = geo.fl; b < geo.BRK; b += r.range(1.5, 4.5)) {
      if (top(b) < o.z1 + 0.5) continue;
      const [x, y] = S(b, 0, o.z1);
      const s = F / at(b, 0).Y / 9;
      if (r() < 0.6) bushes.push({ x, y, s: s * r.range(0.4, 0.8), seed: r.int(1, 9999) });
      else hangs.push({ x, y, s, n: r.int(5, 14), seed: r.int(1, 9999) });
    }
  }
  // grouped so few arrive at once
  const chunk = 14;
  for (let i = 0; i < bushes.length; i += chunk) {
    const set = bushes.slice(i, i + chunk);
    const box = bbox(set.flatMap((b) => [[b.x - 30 * b.s, b.y - 36 * b.s], [b.x + 30 * b.s, b.y + 8]]), 6);
    G(p, 'colFront', box, (c) => { for (const b of set) bush(c, rng(b.seed), b.x, b.y, b.s); }, { t: 7.6 + (i / chunk) * 0.18, d: 0.7, reveal: 'fade' });
  }
  for (let i = 0; i < hangs.length; i += chunk) {
    const set = hangs.slice(i, i + chunk);
    const box = bbox(set.flatMap((h) => [[h.x - 20 * h.s, h.y - 6], [h.x + 20 * h.s, h.y + h.n * 5 * h.s + 10]]), 6);
    G(p, 'colFront', box, (c) => { for (const h of set) ivy(c, rng(h.seed), h.x, h.y, h.s, h.n); }, { t: 7.7 + (i / chunk) * 0.18, d: 0.8, reveal: 'fall' });
  }
}
function bush(c, r, x, y, s) {
  // a scraggly shrub rooted in a crack: a few bent stems, and small leaves
  // heaped in clumps along them, the clumps darker underneath
  const stems = 3 + Math.floor(r() * 4), clumps = [];
  c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = Math.max(0.5, 0.8 * s);
  c.beginPath();
  for (let i = 0; i < stems; i++) {
    const a = -Math.PI / 2 + r.range(-1.3, 1.3), L = r.range(10, 28) * s;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8 + (Math.abs(a + Math.PI / 2) > 0.9 ? L * 0.3 : 0);
    const mx = x + Math.cos(a) * L * 0.5 + r.range(-3, 3) * s, my = y + Math.sin(a) * L * 0.6;
    c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey);
    clumps.push([ex, ey, r.range(5, 10) * s], [mx, my, r.range(3, 6) * s]);
  }
  c.stroke();
  for (const [cx, cy, rad] of clumps) {
    const n = Math.floor(rad * 1.6) + 3;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      const lx = cx + Math.cos(a) * d, ly = cy + Math.sin(a) * d * 0.7;
      c.fillStyle = ly > cy ? DARK : r() < 0.5 ? SEPIA : 'rgba(46,32,21,.6)';
      c.beginPath(); c.ellipse(lx, ly, r.range(1.4, 2.6) * s, r.range(0.8, 1.4) * s, r.range(-1, 1), 0, Math.PI * 2); c.fill();
    }
  }
}
function ivy(c, r, x, y, s, n) {
  c.strokeStyle = SEPIA; c.lineWidth = Math.max(0.5, 0.7 * s);
  for (let k = 0; k < 3; k++) {
    let xx = x + r.range(-10, 10) * s, yy = y;
    c.beginPath(); c.moveTo(xx, yy);
    const pts = [];
    for (let i = 0; i < n; i++) { xx += r.range(-2, 2) * s; yy += r.range(3, 6) * s; c.lineTo(xx, yy); pts.push([xx, yy]); }
    c.stroke();
    c.fillStyle = DARK;
    for (const [px, py] of pts) { if (r() < 0.7) { c.beginPath(); c.ellipse(px + r.range(-2, 2) * s, py, 2.1 * s, 1.5 * s, r() * 3, 0, Math.PI * 2); c.fill(); } }
  }
}

// ---------------------------------------------------------------- the Meta Sudans
// the brick core of the old fountain: a broken cone with niches
function metaSudans(p, r) {
  // first the long shadows the sun throws to the left, of this and of the arch
  const shadow = (pts) => G(p, 'mid', bbox(pts, 6), (c) => {
    c.save(); clipTo(c, [pts]);
    fillPolys(c, [pts], 'rgba(46,32,21,.25)');
    strokeLines(c, hatchLines(bbox(pts), 2.2, 0.08), 'rgba(20,14,9,.75)', 0.75);
    strokeLines(c, hatchLines(bbox(pts), 3.0, -0.9), 'rgba(20,14,9,.5)', 0.6);
    c.restore();
  }, { t: 6.0, d: 0.8, reveal: 'wipeL', ease: 'inOut' });
  shadow([proj(31, 200, 0), proj(31 + 25.9, 200, 0), proj(31 + 25.9, 207.4, 0), proj(31 - 36, 214, 0), proj(31 - 40, 206, 0)]);
  shadow([proj(13 - 4, 222, 0), proj(13 + 4, 222, 0), proj(13 - 14, 232, 0), proj(13 - 18, 226, 0)]);
  const X = 13, Y = 218;
  const base = proj(X, Y, 0), topP = proj(X, Y, 9.5);
  const s = F / Y;
  const rb = 4.2 * s, rt = 2.0 * s;
  const x = base[0], yb = base[1], yt = topP[1];
  const body = [[x - rb, yb], [x - rt, yt + 4], [x - rt * 0.4, yt - 3], [x + rt * 0.5, yt + 2], [x + rt, yt + 5], [x + rb, yb]];
  const box = bbox(body, 10);
  G(p, 'mid', box, (c) => {
    // its foot, a round step
    c.fillStyle = STONE_D; c.beginPath(); c.ellipse(x, yb, rb * 1.5, rb * 0.2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#d6bd96'; poly(c, body); c.fill();
    c.save(); poly(c, body); c.clip();
    // brick courses and shade on the right
    const lines = [];
    for (let y = yt; y < yb; y += 2.6) lines.push([[x - rb, y], [x + rb, y]]);
    strokeLines(c, lines, 'rgba(79,53,32,.55)', 0.55);
    const sh = [];
    for (let xx = x - rb; xx < x - rb * 0.1; xx += 2) sh.push([[xx, yt - 4], [xx, yb]]);
    strokeLines(c, sh, 'rgba(20,14,9,.75)', 0.7);
    // niches
    c.fillStyle = DARK;
    for (const [nx, ny] of [[-0.45, 0.45], [0.15, 0.4], [-0.15, 0.75], [0.5, 0.72]]) {
      const cx0 = x + nx * rb, cy0 = lerp(yt, yb, ny);
      c.beginPath(); c.moveTo(cx0 - 4, cy0 + 10); c.lineTo(cx0 - 4, cy0); c.arc(cx0, cy0, 4, Math.PI, 0); c.lineTo(cx0 + 4, cy0 + 10); c.fill();
    }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, body); c.stroke();
    bush(c, rng(41), x - rt * 0.4, yt - 2, 0.9);
    bush(c, rng(42), x + rt * 0.8, yt + 5, 0.6);
  }, { t: 6.4, d: 0.9, reveal: 'rise' });
  numeral(p, '3', x - rb - 16, yt + 10, 7.4);
}

// ---------------------------------------------------------------- the Arch of Constantine
function arch(p, r) {
  const AX = 31, AY = 200, WD = 25.9, DP = 7.4;
  const P = (u, z) => proj(AX + u, AY, z);
  const Q = (dy, z) => proj(AX, AY + dy, z);       // its left side
  const rect = (u0, z0, u1, z1) => [P(u0, z0), P(u1, z0), P(u1, z1), P(u0, z1)];
  const archOf = (u0, u1, sill, spring) => {
    const pts = [P(u0, sill), P(u0, spring)];
    const rad = (u1 - u0) / 2;
    for (let k = 1; k < 16; k++) { const a = Math.PI - (k / 16) * Math.PI; pts.push(P(u0 + rad + Math.cos(a) * rad, spring + Math.sin(a) * rad)); }
    pts.push(P(u1, spring), P(u1, sill));
    return pts;
  };
  const body = [P(0, 0), P(WD, 0), P(WD, 21), P(0, 21)];
  const side = [Q(0, 0), Q(DP, 0), Q(DP, 21), Q(0, 21)];
  const arches = [archOf(9.7, 16.2, 0.9, 8.3), archOf(2.75, 6.15, 0.9, 5.6), archOf(19.75, 23.15, 0.9, 5.6)];
  const cols = [1.4, 8.3, 17.6, 24.5];
  const box = bbox([...body, ...side], 30);
  const sideArch = (() => { // the side has a small arch through it
    const pts = [];
    const u0 = 2.2, u1 = 5.2, spring = 5.4, rad = 1.5;
    pts.push(Q(u0, 0.9), Q(u0, spring));
    for (let k = 1; k < 12; k++) { const a = Math.PI - (k / 12) * Math.PI; pts.push(Q(u0 + rad + Math.cos(a) * rad, spring + Math.sin(a) * rad)); }
    pts.push(Q(u1, spring), Q(u1, 0.9));
    return pts;
  })();

  G(p, 'mid', box, (c) => {
    fillPolys(c, [side], '#b39770');
    c.save(); clipTo(c, [side]);
    strokeLines(c, hatchLines(bbox(side), 2.0, Math.PI / 2), 'rgba(20,14,9,.75)', 0.6);
    strokeLines(c, hatchLines(bbox(side), 2.8, -0.9), 'rgba(20,14,9,.5)', 0.55);
    c.restore();
    fillPolys(c, [sideArch], '#120c07');
    fillPolys(c, [body], STONE);
    // courses over the whole front
    c.save(); clipTo(c, [body]);
    const lines = [];
    for (let z = 1.2; z < 21; z += 0.55) lines.push([P(0, z), P(WD, z)]);
    strokeLines(c, lines, 'rgba(122,86,52,.5)', 0.5);
    c.restore();
    fillPolys(c, arches, '#24180f');
    c.save(); clipTo(c, arches);
    strokeLines(c, hatchLines(bbox(arches.flat()), 2.0, -0.8), 'rgba(12,8,5,.9)', 0.7);
    // light through the central arch: the road and sky beyond
    fillPolys(c, [archOf(11.2, 16.2, 0.9, 6.8)], '#c9b08a');
    c.restore();
  }, { t: 6.2, d: 1.0, reveal: 'rise', ease: 'inOut' });

  // the order: pedestals, columns, the broken-forward entablature, the attic
  const ink = [], fine = [], dark = [], light = [];
  for (const u of cols) {
    const w = 0.5;
    ink.push(rect(u - 0.9, 0.9, u + 0.9, 4.4));      // pedestal
    fine.push([P(u - 0.75, 1.6), P(u + 0.75, 1.6)], [P(u - 0.75, 3.8), P(u + 0.75, 3.8)]);
    light.push(rect(u - w, 4.4, u + w, 12.9));         // shaft
    for (let f = -0.35; f <= 0.36; f += 0.14) fine.push([P(u + f, 4.8), P(u + f, 12.6)]);
    dark.push(rect(u - w, 4.6, u - 0.18, 12.7));
    ink.push(rect(u - 0.75, 12.9, u + 0.75, 13.9));    // capital
    for (let k = 0; k < 4; k++) fine.push([P(u - 0.6 + k * 0.4, 13), P(u - 0.5 + k * 0.4, 13.8)]);
    ink.push(rect(u - 0.95, 13.9, u + 0.95, 15.3));    // the entablature over it
    // a captive on top, against the attic
    light.push(statue(P, u, 15.3));
  }
  ink.push(rect(0, 13.9, WD, 15.3), rect(-0.2, 15.1, WD + 0.2, 15.5), rect(0, 20.2, WD, 21), rect(-0.2, 0, WD + 0.2, 0.9));
  ink.push(rect(7.4, 16.0, 18.5, 20.0)); // the inscription panel
  const letters = [];
  for (const [z, n] of [[19.1, 22], [17.9, 26], [16.8, 24]]) {
    for (let k = 0; k < n; k++) { const u = lerp(8.1, 17.8, (k + 0.5) / n); if ((k * 7 + n) % 9 === 0) continue; letters.push([P(u - 0.12, z), P(u + 0.12, z + 0.55)]); }
  }
  // reliefs on the attic either side, and roundels over the side arches
  const reliefs = [rect(1.2, 16.2, 6.8, 19.8), rect(19.1, 16.2, 24.7, 19.8)];
  const rounds = [];
  for (const cx of [3.15, 5.75, 20.15, 22.75]) rounds.push([P(cx, 9.9), F / AY * 1.15]);
  const friezes = [rect(1.0, 7.7, 8.9, 8.4), rect(17.0, 7.7, 24.9, 8.4)];
  const relH = hatchLines(bbox(reliefs.flat()), 2.0, 1.1, 1.2, rng(5));
  G(p, 'mid', box, (c) => {
    fillPolys(c, light, STONE);
    fillPolys(c, dark, 'rgba(46,32,21,.45)');
    fillPolys(c, reliefs, '#cdb48a');
    c.save(); clipTo(c, reliefs);
    strokeLines(c, relH, 'rgba(28,20,13,.65)', 0.55);
    c.restore();
    for (const [[x, y], rad] of rounds) {
      c.fillStyle = '#cdb48a'; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      c.save(); c.clip(); strokeLines(c, hatchLines({ x: x - rad, y: y - rad, w: 2 * rad, h: 2 * rad }, 1.8, 0.9), 'rgba(28,20,13,.6)', 0.5); c.restore();
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.stroke();
    }
    fillPolys(c, friezes, '#d3bb93');
    strokeLines(c, fine, 'rgba(28,20,13,.7)', 0.55);
    strokeLines(c, letters, 'rgba(28,20,13,.8)', 0.9);
    c.strokeStyle = INK; c.lineWidth = 1;
    for (const q of [...ink, ...light, ...friezes]) { poly(c, q); c.stroke(); }
    c.lineWidth = 1.3;
    for (const a of arches) { poly(c, a); c.stroke(); }
    poly(c, body); c.stroke(); poly(c, side); c.stroke();
    // weeds on the top
    bush(c, rng(51), P(4, 21)[0], P(4, 21)[1], 0.7);
    bush(c, rng(52), P(15, 21)[0], P(15, 21)[1], 0.9);
    bush(c, rng(53), P(23, 21)[0], P(23, 21)[1], 0.6);
  }, { t: 6.8, d: 0.9, reveal: 'rise', ease: 'inOut' });
  numeral(p, '2', P(WD / 2, 21)[0], P(0, 21)[1] - 16, 7.8);
}
// a standing figure in a cloak, as a shape in front of the attic
function statue(P, u, z) {
  const pts = [];
  const prof = [[0, 0], [0.42, 0], [0.38, 1.6], [0.48, 2.6], [0.3, 3.1], [0.2, 3.3], [0.22, 3.6], [0, 3.75]];
  for (const [du, dz] of prof) pts.push(P(u + du, z + dz));
  for (let i = prof.length - 1; i >= 0; i--) pts.push(P(u - prof[i][0], z + prof[i][1]));
  return pts;
}

// ---------------------------------------------------------------- the figures
// Piranesi's little people: cloaked, pointing, sitting on the stones
function figures(p, r, geo) {
  const people = [];
  const add = (x, y, kind, flip = 1, h = null) => people.push({ x, y, h: h ?? Math.max(9, 1.75 * (y - HY) / EYE), kind, flip, seed: r.int(1, 9999) });
  // along the foot of the great wall, and in its arches
  for (const b of [54.5, 56.2, 57.1, 59.6, 61.0, 63.7, 64.4, 67.2]) { const [x, y] = S(b, -2 - r() * 6, 0); add(x, y, r.pick(['stand', 'walk', 'point', 'staff']), r() < 0.5 ? 1 : -1); }
  // in the arena, beyond the gap, and on the far tiers
  for (const b of [6, 9.5, 12]) { const [x, y] = S(b, 50, 0); add(x, y, 'walk', b > 8 ? -1 : 1); }
  // by the Meta Sudans and the arch, and along the road
  add(1010, 1335, 'point', 1); add(1032, 1338, 'stand', -1); add(1058, 1344, 'sit', -1);
  add(1150, 1402, 'walk', -1); add(1240, 1420, 'staff', -1); add(1352, 1398, 'stand', 1);
  add(1180, 1500, 'walk', 1); add(1110, 1540, 'stand', -1);
  const box = bbox(people.flatMap((q) => [[q.x - q.h * 0.8, q.y - q.h * 1.1], [q.x + q.h * 0.8, q.y + 4]]), 6);
  G(p, 'mid', box, (c) => { for (const q of people) figure(c, rng(q.seed), q); }, { t: 8.4, d: 0.7, reveal: 'fade' });
  // an ox cart bringing stone up the road
  G(p, 'mid', { x: 1010, y: 1430, w: 140, h: 70 }, (c) => cart(c, 1080, 1480, 0.9), { t: 8.7, d: 0.6, reveal: 'pop' });
  // the shepherds' fire by the road, where the smoke rises from
  G(p, 'mid', { x: FIRE[0] - 20, y: FIRE[1] - 22, w: 40, h: 28 }, (c) => {
    c.translate(FIRE[0], FIRE[1]); c.scale(0.6, 0.6); c.translate(-1370, -1556);
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(1352, 1560); c.lineTo(1384, 1550); c.moveTo(1356, 1550); c.lineTo(1386, 1560); c.stroke();
    c.fillStyle = DARK; c.beginPath(); c.moveTo(1360, 1553); c.quadraticCurveTo(1368, 1530, 1372, 1540); c.quadraticCurveTo(1378, 1534, 1380, 1553); c.fill();
  }, { t: 9.0, d: 0.5, reveal: 'pop' });
}
const FIRE = [1322, 1452];
// the near group on the rubble, dark against the light, and their dog
function nearFigures(p, r) {
  const people = [
    { x: 1228, y: 1581, h: 66, kind: 'point', flip: -1 }, { x: 1290, y: 1575, h: 60, kind: 'sit', flip: -1 },
    { x: 1362, y: 1567, h: 70, kind: 'staff', flip: -1 },
  ].map((q) => ({ ...q, seed: r.int(1, 9999), dark: true }));
  const box = bbox(people.flatMap((q) => [[q.x - q.h * 0.8, q.y - q.h * 1.15], [q.x + q.h * 0.8, q.y + 4]]), 6);
  G(p, 'front', box, (c) => { for (const q of people) figure(c, rng(q.seed), q); }, { t: 9.6, d: 0.6, reveal: 'fade' });
  G(p, 'front', { x: 1330, y: 1566, w: 44, h: 30 }, (c) => {
    c.translate(0, -14);
    c.fillStyle = INK; c.beginPath(); c.ellipse(1350, 1596, 11, 4.5, -0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(1362, 1590, 3.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    for (const lx of [1342, 1346, 1355, 1358]) { c.moveTo(lx, 1598); c.lineTo(lx + 0.5, 1606); }
    c.moveTo(1339, 1594); c.quadraticCurveTo(1333, 1588, 1334, 1584); c.stroke();
  }, { t: 9.9, d: 0.5, reveal: 'pop' });
}
function figure(c, r, q) {
  const { x, y, h, kind, flip } = q;
  c.save(); c.translate(x, y); c.scale(flip * h / 40, h / 40);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // legs
  c.strokeStyle = INK; c.lineWidth = 2.2;
  c.beginPath();
  if (kind === 'sit') { c.moveTo(-2, -14); c.lineTo(8, -14); c.lineTo(9, 0); c.moveTo(-1, -13); c.lineTo(10, -12); c.lineTo(12, 0); }
  else if (kind === 'walk') { c.moveTo(-1, -16); c.lineTo(-6, 0); c.moveTo(1, -16); c.lineTo(6, -1); }
  else { c.moveTo(-1, -16); c.lineTo(-3, 0); c.moveTo(1, -16); c.lineTo(3, 0); }
  c.stroke();
  // the cloak, lit on the left and hatched on the right
  const top = kind === 'sit' ? -30 : -34, foot = kind === 'sit' ? -12 : -14;
  const cloak = [[-2, top], [5, top + 1], [9, foot + 2], [3, foot], [-8, foot - 1], [-6, top + 8]];
  c.fillStyle = q.dark ? '#140d08' : '#8a6c4a'; poly(c, cloak); c.fill();
  c.save(); poly(c, cloak); c.clip();
  c.strokeStyle = 'rgba(20,14,9,.9)'; c.lineWidth = 1.1;
  c.beginPath(); for (let k = -6; k < 12; k += 2.2) { c.moveTo(k, top - 2); c.lineTo(k + 4, foot + 2); } c.stroke();
  if (q.dark) { // a thread of light down the sunward edge
    c.strokeStyle = 'rgba(239,226,194,.75)'; c.lineWidth = 0.9; c.beginPath();
    if (flip > 0) { c.moveTo(4.5, top + 2); c.lineTo(8, foot + 1.5); } else { c.moveTo(-5.4, top + 8); c.lineTo(-7.2, foot - 0.6); }
    c.stroke();
  }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.3; poly(c, cloak); c.stroke();
  // the head, with a hat
  c.fillStyle = INK; c.beginPath(); c.arc(1, top - 3.5, 3.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(1, top - 6, 5.5, 1.4, 0, 0, Math.PI * 2); c.fill();
  // the arm
  c.lineWidth = 1.8; c.beginPath();
  if (kind === 'point') { c.moveTo(3, top + 4); c.lineTo(12, top - 4); c.lineTo(15, top - 8); }
  else if (kind === 'staff') { c.moveTo(3, top + 4); c.lineTo(9, top + 10); c.moveTo(10, top - 8); c.lineTo(12, 0); }
  else if (kind === 'walk') { c.moveTo(-3, top + 5); c.lineTo(-7, top + 13); }
  c.stroke();
  c.restore();
}
function cart(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.fillStyle = STONE;
  // the ox
  const ox = [[-44, -12], [-20, -14], [-14, -10], [-16, -2], [-40, -2], [-46, -6]];
  c.fillStyle = '#cdb48a'; poly(c, ox); c.fill(); c.stroke();
  c.beginPath(); for (const lx of [-40, -36, -22, -18]) { c.moveTo(lx, -2); c.lineTo(lx, 6); } c.moveTo(-46, -10); c.lineTo(-52, -16); c.moveTo(-46, -10); c.lineTo(-48, -18); c.stroke();
  c.save(); poly(c, ox); c.clip(); c.beginPath(); for (let k = -46; k < -12; k += 2.5) { c.moveTo(k, -6); c.lineTo(k + 3, -2); } c.stroke(); c.restore();
  // the cart and its load of stone
  c.fillStyle = STONE; c.fillRect(-12, -18, 40, 10); c.strokeRect(-12, -18, 40, 10);
  c.fillStyle = '#d6bd96'; c.beginPath(); c.moveTo(-10, -18); c.lineTo(-4, -26); c.lineTo(10, -28); c.lineTo(24, -22); c.lineTo(26, -18); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-12, -12); c.lineTo(-30, -8); c.stroke();
  c.fillStyle = STONE; c.beginPath(); c.arc(8, -4, 8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); for (let a = 0; a < 6; a++) { c.moveTo(8, -4); c.lineTo(8 + Math.cos(a) * 8, -4 + Math.sin(a) * 8); } c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the foreground
// a heavy dark bank of rubble across the bottom, as the etcher frames his view:
// a fallen fluted column and a capital, a broken shaft still standing, drums
// and squared stones, the road coming through a gap in it
function foreground(p, r) {
  const BOT = IY + IH + 4;
  const ridge = [[IX - 4, 1450], [300, 1462], [520, 1490], [680, 1528], [800, 1570], [880, 1598], [1110, 1602], [1180, 1562], [1260, 1548], [1380, 1522], [IX + IW + 4, 1500]];
  const edge = [];
  for (let i = 0; i < ridge.length - 1; i++) {
    const [x0, y0] = ridge[i], [x1, y1] = ridge[i + 1];
    for (let x = x0; x < x1; x += 7) edge.push([x, lerp(y0, y1, (x - x0) / (x1 - x0)) + r.range(-3, 3)]);
  }
  edge.push(ridge[ridge.length - 1]);
  const bank = [...edge, [IX + IW + 4, BOT], [IX - 4, BOT]];
  const bb = bbox(bank, 4);
  const h1 = hatchLines(bb, 2.3, 0.1), h2 = hatchLines(bb, 2.9, -0.85), h3 = hatchLines(bb, 3.6, 1.2, 0.8, r);
  // stones heaped along its top: lit tops, black undersides
  const stones = [];
  for (let i = 0; i < 70; i++) {
    const k = r.int(0, edge.length - 1), [x, y] = edge[k];
    const w = r.range(10, 34), h = w * r.range(0.35, 0.6), dy = r.range(-4, 26);
    stones.push({ x, y: y + dy, w, h, a: r.range(-0.25, 0.25) });
  }
  G(p, 'front', bb, [
    (c) => { fillPolys(c, [bank], 'rgba(40,27,16,.8)'); c.save(); clipTo(c, [bank]); },
    (c) => strokeLines(c, h1, 'rgba(14,9,5,.85)', 0.85),
    (c) => strokeLines(c, h2, 'rgba(14,9,5,.7)', 0.7),
    (c) => {
      strokeLines(c, h3, 'rgba(14,9,5,.5)', 0.6);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(edge[0][0], edge[0][1]); for (const q of edge) c.lineTo(q[0], q[1]); c.stroke();
    },
  ], { t: 8.6, d: 0.8, reveal: 'rise', ease: 'inOut' });
  const sb = bbox(stones.flatMap((q) => [[q.x - q.w, q.y - q.h * 2], [q.x + q.w, q.y + q.h]]), 6);
  G(p, 'front', sb, (c) => {
    for (const q of stones) {
      c.save(); c.translate(q.x, q.y); c.rotate(q.a);
      const top = [[-q.w / 2, -q.h * 0.5], [q.w / 2 - 3, -q.h * 0.5], [q.w / 2 + 3, -q.h], [-q.w / 2 + 6, -q.h]];
      const front = [[-q.w / 2, -q.h * 0.5], [q.w / 2 - 3, -q.h * 0.5], [q.w / 2 - 3, q.h * 0.4], [-q.w / 2, q.h * 0.4]];
      const side = [[q.w / 2 - 3, -q.h * 0.5], [q.w / 2 + 3, -q.h], [q.w / 2 + 3, -q.h * 0.1], [q.w / 2 - 3, q.h * 0.4]];
      c.fillStyle = '#3a2819'; poly(c, front); c.fill();
      c.fillStyle = STONE; poly(c, top); c.fill(); c.fillStyle = STONE_D; poly(c, side); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; poly(c, top); c.stroke(); poly(c, side); c.stroke();
      c.restore();
    }
  }, { t: 8.8, d: 0.7, reveal: 'rise' });

  // a broken shaft still standing at the right edge, lit on its right
  const sx0 = 1414, sx1 = 1484, sTop = [[sx0, 1452], [1426, 1440], [1438, 1458], [1452, 1430], [1466, 1446], [sx1, 1436]];
  const shaft = [...sTop, [sx1, BOT], [sx0, BOT]];
  const flutes = [];
  for (let x = sx0 + 5; x < sx1; x += 6.5) flutes.push([[x, 1420], [x, BOT]]);
  const sdark = [];
  for (let x = sx0; x < sx0 + 44; x += 1.4) sdark.push([[x, 1420], [x, BOT]]);
  G(p, 'front', bbox(shaft, 6), (c) => {
    fillPolys(c, [shaft], STONE);
    fillPolys(c, [[[sx0, 1400], [sx0 + 40, 1400], [sx0 + 40, BOT], [sx0, BOT]]], 'rgba(46,32,21,.45)');
    c.save(); clipTo(c, [shaft]);
    strokeLines(c, sdark, 'rgba(14,9,5,.85)', 1.0);
    strokeLines(c, flutes, INK, 0.9);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.4; poly(c, shaft); c.stroke();
  }, { t: 8.9, d: 0.7, reveal: 'rise' });

  // the fluted column lying on its side, and the capital fallen by it
  G(p, 'front', { x: 1130, y: 1500, w: 360, h: 170 }, (c) => {
    const x0 = 1180, y0 = 1612, x1 = 1470, y1 = 1580, rad = 26;
    const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny);
    const ox = (nx / nl) * rad, oy = (ny / nl) * rad;
    // its shadow on the rubble
    c.fillStyle = 'rgba(10,6,3,.85)';
    poly(c, [[x0 - 30, y0 + oy + 8], [x1 - 10, y1 + oy + 6], [x1 - 40, y1 + oy + 20], [x0 - 60, y0 + oy + 22]]); c.fill();
    const shaftP = [[x0 + ox, y0 + oy], [x1 + ox, y1 + oy], [x1 - ox, y1 - oy], [x0 - ox, y0 - oy]];
    c.fillStyle = STONE; poly(c, shaftP); c.fill();
    c.save(); poly(c, shaftP); c.clip();
    const fl = [];
    for (let k = -0.9; k <= 0.9; k += 0.16) fl.push([[x0 + ox * k, y0 + oy * k], [x1 + ox * k, y1 + oy * k]]);
    strokeLines(c, fl, 'rgba(28,20,13,.75)', 0.8);
    const sh = [];
    for (let k = -0.1; k <= 1; k += 0.05) sh.push([[x0 + ox * k, y0 + oy * k], [x1 + ox * k, y1 + oy * k]]);
    strokeLines(c, sh, 'rgba(10,6,3,.85)', 1.0);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.5; poly(c, shaftP); c.stroke();
    // its broken end, seen end-on, in shade
    c.fillStyle = '#5a4029'; c.beginPath(); c.ellipse(x0, y0, 9, rad, Math.atan2(y1 - y0, x1 - x0), 0, Math.PI * 2); c.fill(); c.stroke();
    capital(c, 1420, 1652, 1.0);
  }, { t: 9.0, d: 0.8, reveal: 'rise' });

  // two column drums and squared stones by the road
  G(p, 'front', { x: 930, y: 1540, w: 230, h: 125 }, (c) => {
    const drum = (x, y, rx, h) => {
      const ry = rx * 0.32;
      c.fillStyle = STONE_D; c.beginPath(); c.moveTo(x - rx, y - h); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y - h); c.closePath(); c.fill();
      c.save(); c.clip();
      const l = []; for (let xx = x - rx; xx < x + rx * 0.35; xx += 1.8) l.push([[xx, y - h - ry], [xx, y + ry]]);
      strokeLines(c, l, 'rgba(14,9,5,.85)', 0.8);
      const f = []; for (let k = -0.8; k <= 0.8; k += 0.27) f.push([[x + k * rx, y - h], [x + k * rx, y + Math.sqrt(1 - k * k) * ry]]);
      strokeLines(c, f, 'rgba(28,20,13,.8)', 0.7);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(x - rx, y - h); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y - h); c.stroke();
      c.fillStyle = PAPER; c.beginPath(); c.ellipse(x, y - h, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    };
    c.fillStyle = 'rgba(10,6,3,.8)';
    for (const [x, y, rx] of [[1040, 1640, 34], [1100, 1616, 26]]) { c.beginPath(); c.ellipse(x - rx * 0.9, y + 4, rx * 1.3, rx * 0.3, 0, 0, Math.PI * 2); c.fill(); }
    drum(1040, 1640, 34, 30); drum(1100, 1616, 26, 22);
    c.strokeStyle = INK; c.lineWidth = 1;
    for (const [x, y, w, h] of [[960, 1600, 30, 14], [1140, 1648, 26, 12], [1002, 1586, 18, 9]]) {
      c.fillStyle = STONE; c.fillRect(x, y - h, w, h); c.strokeRect(x, y - h, w, h);
      c.beginPath(); for (let xx = x; xx < x + w * 0.5; xx += 1.6) { c.moveTo(xx, y - h); c.lineTo(xx, y); } c.stroke();
    }
  }, { t: 9.1, d: 0.8, reveal: 'rise' });

  nearFigures(p, r);

  // big dark shrubs on the bank
  const shrubs = [[1480, 1660, 3.2], [905, 1650, 2.4], [700, 1640, 2.0], [960, 1610, 1.6], [1180, 1590, 1.6]];
  G(p, 'front', { x: 560, y: 1440, w: 940, h: 230 }, (c) => { shrubs.forEach(([x, y, s], i) => bush(c, rng(700 + i), x, y, s)); }, { t: 10.0, d: 0.6, reveal: 'fade' });
  // tall weeds and a thistle along the bottom edge
  const weeds = [];
  for (let i = 0; i < 90; i++) {
    const x = r.range(IX, IX + IW), y = IY + IH + 2;
    if (x < 680) continue;
    const L = r.range(20, 70), a = -Math.PI / 2 + r.range(-0.5, 0.5);
    weeds.push([[x, y], [x + Math.cos(a) * L * 0.5 + r.range(-6, 6), y + Math.sin(a) * L * 0.5], [x + Math.cos(a) * L, y + Math.sin(a) * L]]);
  }
  G(p, 'front', { x: 640, y: IY + IH - 80, w: IX + IW - 640, h: 90 }, (c) => strokeLines(c, weeds, INK, 1.1), { t: 10.1, d: 0.7, reveal: 'rise' });
}
function capital(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const body = [[-40, 0], [-34, -44], [-46, -52], [46, -52], [34, -44], [40, 0]];
  c.fillStyle = STONE; poly(c, body); c.fill();
  c.save(); poly(c, body); c.clip();
  // two rows of acanthus: hooked leaves drawn as loops
  c.strokeStyle = INK; c.lineWidth = 1;
  for (const [yy, n, h] of [[-2, 5, 18], [-18, 4, 20]]) {
    for (let k = 0; k < n; k++) {
      const cx = lerp(-32, 32, n === 1 ? 0.5 : k / (n - 1));
      c.beginPath(); c.moveTo(cx - 8, yy); c.quadraticCurveTo(cx - 9, yy - h, cx, yy - h - 3); c.quadraticCurveTo(cx + 8, yy - h + 2, cx + 4, yy - h + 6); c.moveTo(cx, yy - h - 3); c.quadraticCurveTo(cx + 9, yy - h * 0.5, cx + 8, yy); c.stroke();
      c.beginPath(); c.moveTo(cx, yy); c.lineTo(cx, yy - h + 2); c.stroke();
    }
  }
  const sh = [];
  for (let xx = 5; xx < 50; xx += 2.4) sh.push([[xx, -54], [xx - 8, 2]]);
  strokeLines(c, sh, 'rgba(20,14,9,.6)', 0.7);
  c.restore();
  // volutes
  c.lineWidth = 1.3;
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 40, -46, 6, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(sx * 40, -46, 2.5, 0, Math.PI * 2); c.stroke(); }
  c.lineWidth = 1.4; poly(c, body); c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the birds and the smoke
function birds(p, r) {
  // crows wheeling over the broken top, behind the walls
  for (let i = 0; i < 4; i++) {
    const cx = r.range(480, 1150), cy = r.range(300, 560), rx = r.range(60, 140), ry = rx * 0.35, ph = r() * 6, sp = r.range(0.25, 0.45) * (i % 2 ? 1 : -1);
    p.live('sky', {
      t: 10.0 + i * 0.25, d: 0.8, reveal: 'fade',
      draw: (c, time) => {
        const a = time * sp + ph;
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        const f = Math.sin(time * 7 + ph);
        c.strokeStyle = INK; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 8, y - 2 - f * 3); c.quadraticCurveTo(x - 3, y - 4 - f, x, y); c.quadraticCurveTo(x + 3, y - 4 - f, x + 8, y - 2 - f * 3); c.stroke();
      },
    });
  }
  // the shepherds' smoke: a few strokes curling up and drifting left
  p.live('mid', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(46,32,21,.5)'; c.lineWidth = 1; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        for (let i = 0; i <= 16; i++) {
          const s = i / 16, yy = FIRE[1] - 12 - s * 140;
          const xx = FIRE[0] + k * 3 - s * s * 70 + Math.sin(s * 6 - time * 1.4 + k) * (3 + s * 12);
          if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- the tablet
// a tabula ansata, the Roman tablet with dovetail handles, set up in the left
// foreground against a fallen block of cornice, its shadow thrown on the block
function tablet(p, r) {
  // the block: a fallen piece of cornice, broken off on the right, its top in the sun
  const BOT = IY + IH + 4, dx = 26, dy = 22;
  const front = [[IX - 4, 1440], [330, 1440], [356, 1452], [372, 1446], [402, 1474], [418, 1470], [446, 1504], [452, BOT], [IX - 4, BOT]];
  const top = [[IX - 4, 1440], [330, 1440], [330 + dx, 1440 - dy], [IX - 4 + dx, 1440 - dy]];
  const brk = [[330, 1440], [330 + dx, 1440 - dy], [380 + dx, 1450 - dy], [402 + dx, 1474 - dy], [446 + dx, 1504 - dy], [452 + dx, BOT - dy], [452, BOT], [446, 1504], [418, 1470], [402, 1474], [372, 1446], [356, 1452]];
  const bbx = bbox([...front, ...top, ...brk], 6);
  const fH1 = hatchLines(bbox(front), 2.2, 0.15), fH2 = hatchLines(bbox(front), 3.0, -0.95);
  const molds = [1452, 1476, 1484, 1530].map((y) => [[IX - 4, y], [lerp(330, 446, (y - 1440) / 64), y]]);
  const bH = hatchLines(bbox(brk), 3.4, 1.25, 1.0, r);
  G(p, 'tablet', bbx, (c) => {
    fillPolys(c, [front], '#5e432b');
    c.save(); clipTo(c, [front]);
    strokeLines(c, fH1, 'rgba(14,9,5,.85)', 0.8);
    strokeLines(c, fH2, 'rgba(14,9,5,.6)', 0.65);
    strokeLines(c, molds, INK, 1.3);
    c.restore();
    fillPolys(c, [top], STONE);
    // the broken face, rough and lit from the right
    fillPolys(c, [brk], STONE_D);
    c.save(); clipTo(c, [brk]); strokeLines(c, bH, 'rgba(79,53,32,.6)', 0.6); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.5;
    for (const q of [front, top, brk]) { poly(c, q); c.stroke(); }
  }, { t: 9.4, d: 0.8, reveal: 'rise', ease: 'inOut' });

  // the tablet stands in front, its foot in the rubble and its top against the block
  const x0 = 176, x1 = 616, y0 = 1494, y1 = 1648, ear = 40;
  const ym = (y0 + y1) / 2;
  const out = [[x0, y0], [x1, y0], [x1, ym - 18], [x1 + ear, ym - 46], [x1 + ear, ym + 46], [x1, ym + 18], [x1, y1], [x0, y1], [x0, ym + 18], [x0 - ear, ym + 46], [x0 - ear, ym - 46], [x0, ym - 18]];
  // a chip broken from the top right corner
  out.splice(1, 0, [x1 - 58, y0], [x1 - 44, y0 + 11], [x1 - 26, y0 + 5], [x1 - 12, y0 + 13]);
  // it leans back a little: its thickness shows along the top and the right
  const thick = out.map(([x, y]) => [x + 7, y - 9]);
  const shade = out.map(([x, y]) => [x - 26, y - 8]);
  const box = bbox([...out, ...thick, ...shade], 12);
  const weather = [];
  for (let y = y0 + 30; y < y1; y += 3.4) { if (r() < 0.35) continue; weather.push([[x0 - ear, y], [x1 + ear, y + r.range(-1, 1)]]); }
  const sh = hatchLines(box, 2.0, 0.9);
  G(p, 'tablet', box, (c) => {
    // the shadow it throws on the block and the ground to its left
    fillPolys(c, [shade], 'rgba(8,5,3,.82)');
    // its thickness, catching the light
    c.fillStyle = '#d9c298'; poly(c, thick); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, thick); c.stroke();
    c.fillStyle = '#f3e9d0'; poly(c, out); c.fill();
    c.save(); poly(c, out); c.clip();
    strokeLines(c, weather, 'rgba(122,86,52,.2)', 0.6);
    // the lower edge in the shade of the rubble
    c.save(); c.beginPath(); c.rect(x0 - ear, y1 - 16, x1 - x0 + 2 * ear, 20); c.clip(); strokeLines(c, sh, 'rgba(20,14,9,.6)', 0.6); c.restore();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, out); c.stroke();
    // the moldings: a sunk field inside two lines, shaded on its top and left inside
    c.lineWidth = 1; c.strokeRect(x0 + 12, y0 + 11, x1 - x0 - 24, y1 - y0 - 22);
    c.lineWidth = 1.8; c.strokeRect(x0 + 19, y0 + 18, x1 - x0 - 38, y1 - y0 - 36);
    c.strokeStyle = 'rgba(28,20,13,.65)'; c.lineWidth = 0.7; c.beginPath();
    for (let x = x0 + 21; x < x1 - 19; x += 2.4) { c.moveTo(x, y0 + 19); c.lineTo(x, y0 + 24); }
    for (let y = y0 + 20; y < y1 - 19; y += 2.4) { c.moveTo(x0 + 20, y); c.lineTo(x0 + 25, y); }
    c.stroke();
    // cracks
    c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
    c.moveTo(x1 - 96, y1); c.lineTo(x1 - 106, y1 - 24); c.lineTo(x1 - 99, y1 - 42); c.lineTo(x1 - 112, y1 - 64);
    c.moveTo(x0 - 24, ym - 36); c.lineTo(x0 + 5, ym - 10); c.lineTo(x0 + 3, ym + 6);
    c.stroke();
  }, { t: 10.0, d: 0.8, reveal: 'rise', ease: 'inOut' });

  // the name, cut into the stone: dark letters with a lit lower edge
  p.type('tablet', TITLE, (x0 + x1) / 2, y1 - 38, {
    family: FONT, size: 106, color: INK, shadow: 'rgba(255,248,230,.9)', sx: 1.5, sy: 2, track: 0.14, align: 'center', t: 10.7, gap: 0.2, d: 0.8,
  });
  // grass and a weed in front of its foot, and ivy over its left handle
  const grass = [];
  for (let i = 0; i < 46; i++) {
    const x = r.range(x0 - 50, x1 + 60), y = BOT - r.range(0, 10), L = r.range(12, 40), a = -Math.PI / 2 + r.range(-0.6, 0.6);
    grass.push([[x, y], [x + Math.cos(a) * L * 0.5 + r.range(-4, 4), y + Math.sin(a) * L * 0.5], [x + Math.cos(a) * L, y + Math.sin(a) * L]]);
  }
  G(p, 'tablet', { x: x0 - ear - 40, y: y0 - 70, w: x1 - x0 + 2 * ear + 120, h: BOT - y0 + 76 }, (c) => {
    strokeLines(c, grass, INK, 1.0);
    ivy(c, rng(61), x0 - 26, y0 - 6, 1.6, 15);
    bush(c, rng(62), x0 - 22, y0 - 2, 1.3);
    bush(c, rng(63), x1 + 30, y1 + 6, 1.4);
  }, { t: 12.0, d: 0.7, reveal: 'fade' });
}

// ---------------------------------------------------------------- the frame and caption
function caption(p) {
  // the image's border: a heavy rule and a fine one, as the plate was ruled
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  p.pen('frame', rect(IX, IY, IW, IH), INK, 2.2, { t: 12.2, d: 1.6, cap: 'square' });
  p.pen('frame', rect(IX - 8, IY - 8, IW + 16, IH + 16), INK, 0.9, { t: 12.4, d: 1.6, cap: 'square' });
  p.type('caption', CAPTION, W / 2, 1752, { family: FONT, size: 34, color: INK, track: 0.12, align: 'center', t: 12.4, gap: 0.03, d: 0.4, reveal: 'fade', fit: 1200 });
  p.pen('caption', [[W / 2 - 90, 1772], [W / 2 + 90, 1772]], SEPIA, 0.9, { t: 13.7, d: 0.5 });
  // the key under it, as one line, and the plate's number
  const line = (text, x, y, size, color, align, track, t) => p.mark('caption', {
    t, d: 0.7, reveal: 'wipe', ease: 'inOut', box: { x: align === 'center' ? x - 150 : x - 200, y: y - size, w: align === 'center' ? 300 : 210, h: size * 1.4 },
    draw: (c) => { c.font = `400 ${size}px ${FONT}`; c.fillStyle = color; c.textAlign = align; c.letterSpacing = `${track}px`; c.fillText(text, x, y); c.letterSpacing = '0px'; },
  });
  KEY.forEach((k, i) => line(k, IX + (IW * (i + 0.5)) / KEY.length, 1812, 23, SEPIA, 'center', 0.5, 13.6 + i * 0.12));
  line('TAV. I', IX + IW, 1880, 20, SEPIA, 'right', 4, 14.2);
}
// a small engraved number by a landmark, keyed in the caption
function numeral(p, n, x, y, t) {
  p.mark('caption', { t, d: 0.5, reveal: 'fade', box: { x: x - 14, y: y - 22, w: 28, h: 30 }, draw: (c) => { c.font = `400 22px ${FONT}`; c.fillStyle = INK; c.textAlign = 'center'; c.fillText(n, x, y); } });
}
