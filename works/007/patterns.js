// Iznik patterns. generate(seed) returns one plate as an ordered list of shapes, in plate units: the plate's
// edge is at radius 1, x runs right and y runs down, so "up" on a bouquet is -y. Nothing here draws; plate.js
// paints the list. Shapes are stacked in the order they are added.
//   { pts, fill, ink, open, ground, at }
//   fill: 'blue' | 'turq' | 'green' | 'red' | 'white' | null    ink: line width, 0 for none
//   open: a line rather than a closed shape    ground: painted behind everything, around reserved white
//   at: where the brush starts
window.Iznik = (() => {
  'use strict';

  const TAU = Math.PI * 2;
  const INK = 0.0021;
  const WELL = 0.69;           // the well's picture stays inside this radius
  const RIM_IN = 0.785, RIM_OUT = 0.962;

  // The palettes follow the workshop's own decades, each kept close to what survives in museums.
  const PALETTES = {
    classic:   { name: 'Red and green, about 1570', blue: '#1f3f96', turq: '#2ea3a8', green: '#3b8c5c', red: '#c63a22', ink: '#1b2130', body: '#f1ece0' },
    late:      { name: 'Red and green, about 1590', blue: '#23479a', turq: '#3a9fa2', green: '#2f7d55', red: '#b8331f', ink: '#20242e', body: '#eee6d6' },
    damascus:  { name: 'Sage and purple, about 1550', blue: '#2a4f9e', turq: '#3fa6a4', green: '#7d9a78', red: '#6e4274', ink: '#232533', body: '#f0ebdf' },
    blueturq:  { name: 'Blue and turquoise, about 1530', blue: '#1b3a8e', turq: '#35aab0', green: '#1f6f8f', red: '#14296e', ink: '#171d2c', body: '#f3efe5' },
  };

  function mulberry(a) {
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Catmull-Rom through control points, as a dense polyline.
  function curve(c, n = 10) {
    const out = [];
    for (let i = 0; i < c.length - 1; i++) {
      const p0 = c[Math.max(i - 1, 0)], p1 = c[i], p2 = c[i + 1], p3 = c[Math.min(i + 2, c.length - 1)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(c[c.length - 1].slice());
    return out;
  }

  // A closed outline around a spine, with half-width w(t) on each side.
  function ribbon(spine, w, w2 = w) {
    const L = [], R = [], n = spine.length;
    for (let i = 0; i < n; i++) {
      const a = spine[Math.max(i - 1, 0)], b = spine[Math.min(i + 1, n - 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const t = i / (n - 1), wl = w(t), wr = w2(t);
      L.push([spine[i][0] - dy * wl, spine[i][1] + dx * wl]);
      R.push([spine[i][0] + dy * wr, spine[i][1] - dx * wr]);
    }
    return L.concat(R.reverse());
  }

  const leafW = (w) => (t) => w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
  // A saw edge: each tooth swells toward the tip of the leaf and drops back.
  const sawW = (w, teeth, depth) => (t) => {
    const f = (t * teeth) % 1;
    return leafW(w)(t) * (1 - depth * (1 - f * f));
  };

  const circle = (x, y, r, n = 14) => {
    const p = [];
    for (let i = 0; i < n; i++) p.push([x + r * Math.cos(i / n * TAU), y + r * Math.sin(i / n * TAU)]);
    return p;
  };

  function generate(seed) {
    const rand = mulberry(seed);
    const R = (a, b) => a + (b - a) * rand();
    const pick = (l) => l[Math.floor(rand() * l.length)];
    const chance = (p) => rand() < p;
    let shapes = [];

    const add = (pts, fill, o = {}) => {
      shapes.push({ pts, fill, ink: o.ink === undefined ? INK : o.ink, ground: !!o.ground, at: o.at || pts[0], open: false });
    };
    const line = (pts, ink = INK) => shapes.push({ pts, fill: null, ink, open: true, ground: false, at: pts[0] });

    // A frame places a motif drawn upright around the origin: position, direction of its "up", size, mirror.
    const frame = (x, y, ang, s, flip = 1) => {
      const c = Math.cos(ang), n = Math.sin(ang);
      return (p) => {
        const lx = p[0] * s * flip, ly = p[1] * s;
        return [x + lx * c + ly * n, y + lx * n - ly * c];
      };
    };

    /* ---------- Flowers and leaves. Each is drawn with its stem at (0,0), growing up to about y = 1. ---------- */

    function smallLeaf(f, len, wid, fill, bend = 0.2) {
      const sp = curve([[0, 0], [bend * len, len * 0.5], [0, len]], 8);
      add(ribbon(sp, leafW(wid)).map(f), fill);
      line(sp.slice(1, -2).map(f), INK * 0.6);
    }

    function tulip(f, a, b, t = 'white') {
      const side = (s) => {
        const sp = curve([[s * 0.03, 0.03], [s * 0.3, 0.3], [s * 0.3, 0.72], [s * 0.41, 1.05]], 7);
        return ribbon(sp, (u) => 0.17 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.8));
      };
      const mid = curve([[0, 0.02], [0, 0.5], [0, 1.16]], 9);
      add(ribbon(mid, leafW(0.17)).map(f), a);
      add(side(-1).map(f), b);
      add(side(1).map(f), b);
      add(ribbon(curve([[0, 0.14], [0, 0.45], [0, 0.82]], 8), leafW(0.05)).map(f), t, { ink: INK * 0.7 });
      for (const s of [-1, 1]) {
        const sp = curve([[s * 0.1, 0.2], [s * 0.2, 0.42], [s * 0.21, 0.66]], 6);
        add(ribbon(sp, leafW(0.03)).map(f), t, { ink: INK * 0.6 });
      }
      add(ribbon(curve([[-0.17, 0.09], [0, -0.03], [0.17, 0.09]], 6), leafW(0.05)).map(f), 'green');
    }

    function carnation(f, a, b) {
      const n = 7;
      for (const i of [0, 6, 1, 5, 2, 4, 3]) {
        const th = (i - 3) / 3 * 1.2, cx = Math.sin(th), cy = Math.cos(th), px = cy, py = -cx;
        const len = 0.82 - Math.abs(i - 3) * 0.05, wid = 0.2;
        const o = [0, 0.26];
        const at = (r, s) => [o[0] + cx * r + px * s, o[1] + cy * r + py * s];
        const pts = [at(0.02, 0)];
        const teeth = 4;
        pts.push(at(len * 0.72, -wid * 0.92));
        for (let k = 0; k <= teeth; k++) {
          const s = -wid + k / teeth * wid * 2;
          pts.push(at(len, s));
          if (k < teeth) pts.push(at(len * 0.9, s + wid / teeth));
        }
        pts.push(at(len * 0.72, wid * 0.92));
        add(pts.map(f), i % 2 ? b : a);
        if (i % 2 === 0) line([at(0.2, 0), at(len * 0.82, 0)].map(f), INK * 0.6);
      }
      add(ribbon(curve([[0, -0.04], [0, 0.18], [0, 0.42]], 7), leafW(0.135)).map(f), 'green');
      for (const s of [-0.05, 0.05]) line([[s, 0.06], [s * 1.2, 0.3]].map(f), INK * 0.6);
    }

    function hyacinth(f, a) {
      const sp = curve([[0, 0], [0.04, 0.55], [-0.02, 1.0], [0.05, 1.5]], 8);
      add(ribbon(sp, (t) => 0.018 * (1 - t) + 0.006).map(f), 'green', { ink: INK * 0.7 });
      const n = 10;
      for (let i = 0; i < n; i++) {
        const t = 0.26 + 0.72 * i / (n - 1), p = sp[Math.floor(t * (sp.length - 1))], s = i % 2 ? 1 : -1;
        const size = 0.3 - 0.13 * t;
        const bell = [[0, 0.02], [s * size * 0.45, 0.13 * size / 0.2], [s * size * 0.95, 0.03], [s * size * 1.25, 0.1], [s * size * 1.2, -0.03],
          [s * size * 1.36, -0.09], [s * size * 1.06, -0.1], [s * size * 0.95, -0.2 * size / 0.2 * 0.7], [s * size * 0.4, -0.1], [0, -0.03]];
        add(curve(bell.concat([bell[0]]), 3).map((q) => f([q[0] + p[0], q[1] + p[1]])), a);
      }
      add(ribbon(curve([sp[sp.length - 1], [0.07, 1.68]], 6), leafW(0.04)).map(f), a);
    }

    function rosette(f, n, a, c = 'red', o = {}) {
      const r = 1, notch = 0.1;
      for (let i = 0; i < n; i++) {
        const th = i / n * TAU, half = Math.PI / n * 0.96;
        const pts = [[0, 0]];
        for (let k = 0; k <= 12; k++) {
          const u = k / 12, an = th - half + u * half * 2;
          const rad = r * (1 - notch * Math.pow(Math.abs(2 * u - 1), 6) - (Math.abs(u - 0.5) < 0.07 ? 0.1 * (1 - Math.abs(u - 0.5) / 0.07) : 0)) * (0.78 + 0.22 * Math.pow(Math.sin(Math.PI * u), 0.5));
          pts.push([rad * Math.sin(an), rad * Math.cos(an)]);
        }
        add(pts.map(f), a);
        if (o.veins) line([[0.3 * Math.sin(th), 0.3 * Math.cos(th)], [0.7 * Math.sin(th), 0.7 * Math.cos(th)]].map(f), INK * 0.6);
      }
      add(circle(0, 0, 0.3).map(f), c);
      add(circle(0, 0, 0.12, 10).map(f), 'white', { ink: INK * 0.6 });
      if (o.stamens) {
        for (let i = 0; i < n * 2; i++) {
          const th = (i + 0.5) / (n * 2) * TAU;
          add(circle(0.46 * Math.sin(th), 0.46 * Math.cos(th), 0.035, 6).map(f), 'red', { ink: 0 });
        }
      }
    }

    // A layered fan: the Ottoman hatayi, a composite blossom seen from the side, or a whole rosette at spread = TAU.
    function fan(f, radius, lobes, spread, fill, ink = INK, cy = 0.05) {
      const pts = [];
      if (spread < TAU - 0.01) pts.push([0, 0]);
      for (let i = 0; i < lobes; i++) {
        const a0 = -spread / 2 + i / lobes * spread, da = spread / lobes;
        for (let k = 0; k <= 9; k++) {
          const u = k / 9, an = a0 + u * da;
          // Each lobe swells to a small point at its middle.
          const puff = Math.pow(Math.sin(Math.PI * u), 0.55), tip = Math.pow(1 - Math.min(1, Math.abs(u - 0.5) * 7), 2);
          const rad = radius * (0.76 + 0.2 * puff + 0.1 * tip);
          pts.push([rad * Math.sin(an), cy + rad * Math.cos(an)]);
        }
      }
      add(pts.map(f), fill, { ink });
    }

    function hatayi(f, a, b, c, spread = 3.4) {
      fan(f, 1, 9, spread, a);
      fan(f, 0.76, 7, spread * 0.92, b);
      fan(f, 0.52, 5, spread * 0.84, c);
      const th = spread / 2 * 0.74;
      for (let i = -3; i <= 3; i++) {
        const an = i / 3 * th;
        add(circle(0.86 * Math.sin(an), 0.05 + 0.86 * Math.cos(an), 0.022, 7).map(f), chanceWhite(a), { ink: 0 });
      }
      add(ribbon(curve([[0, 0.07], [0, 0.26], [0, 0.46]], 7), leafW(0.12)).map(f), a);
      add(ribbon(curve([[-0.3, 0.0], [0, -0.1], [0.3, 0.0]], 6), leafW(0.08)).map(f), 'green');
    }
    const chanceWhite = (a) => (a === 'white' ? 'blue' : 'white');

    function saz(pts, w, a, b, teeth = 15) {
      const sp = curve(pts, 12);
      add(ribbon(sp, sawW(w, teeth, 0.3)), a);
      add(ribbon(sp, leafW(w * 0.33)), b, { ink: INK * 0.7 });
      line(sp.slice(3, -3), INK * 0.6);
      // Short veins between the midrib and the teeth.
      for (let i = 6; i < sp.length - 6; i += 5) {
        const q = sp[i], r = sp[i + 1], dx = r[0] - q[0], dy = r[1] - q[1], d = Math.hypot(dx, dy) || 1;
        const t = i / (sp.length - 1), o0 = leafW(w * 0.36)(t), o1 = leafW(w * 0.74)(t);
        for (const s of [-1, 1]) {
          line([[q[0] - dy / d * o0 * s, q[1] + dx / d * o0 * s], [q[0] - dy / d * o1 * s + dx / d * 0.012, q[1] + dx / d * o1 * s + dy / d * 0.012]], INK * 0.5);
        }
      }
      return sp;
    }

    function cloud(f, fill) {
      const c = [[-1.1, 0.12], [-0.72, -0.1], [-0.4, 0.04], [-0.12, 0.13], [0.14, -0.02], [0.42, -0.12], [0.72, 0.0], [1.0, 0.14]];
      add(ribbon(curve(c, 7), (t) => 0.2 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.8) * (0.72 + 0.28 * Math.cos(t * 19))).map(f), fill);
      line(curve(c.slice(1, -2), 7).map(f), INK * 0.6);
    }

    function cintamani(x, y, s, a, b) {
      const f = frame(x, y, 0, s);
      for (const [cx, cy] of [[0, -0.62], [-0.56, 0.36], [0.56, 0.36]]) {
        add(circle(cx, cy, 0.46, 20).map(f), a);
        add(circle(cx, cy, 0.27, 16).map(f), 'white', { ink: INK * 0.7 });
        add(circle(cx, cy, 0.13, 12).map(f), b, { ink: INK * 0.7 });
      }
      // The paired wavy bands: tiger stripes below the three spots.
      for (const dy of [0.96, 1.3]) {
        const sp = curve([[-0.8, dy + 0.05], [-0.4, dy - 0.12], [0, dy + 0.08], [0.4, dy - 0.1], [0.8, dy + 0.04]], 7);
        add(ribbon(sp, (t) => 0.08 * Math.pow(Math.sin(Math.PI * t), 0.6)).map(f), b);
      }
    }

    /* ---------- The well. Each composition draws at any scale; fit() brings it inside the well. ---------- */

    const COLS = () => pick([['red', 'blue'], ['red', 'turq'], ['blue', 'red'], ['red', 'white']]);

    function bouquet() {
      // Flowers rise from a tuft on one side of the dish and fan out, as they do on the dishes of the 1570s.
      const B = [R(-0.03, 0.03), 0.64];
      const n = pick([5, 7, 7, 9]);
      const kinds = ['tulip', 'carnation', 'hyacinth', 'rose'];
      const cen = pick(['tulip', 'hyacinth', 'carnation']);
      const stems = [], heads = [];
      const pairs = [];
      for (let i = 0; i < (n - 1) / 2; i++) pairs.push(pick(kinds));

      // Two saz leaves arch out low on either side, over the stems.
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) / 2, u = k / ((n - 1) / 2);
        const ang = u * R(0.92, 1.0);
        const dist = (1.34 - 0.2 * u * u) * R(0.97, 1.03);
        const end = [B[0] + Math.sin(ang) * dist, B[1] - Math.cos(ang) * dist];
        const s = i % 2 ? 1 : -1;
        const mid = [B[0] + Math.sin(ang * 0.5) * dist * 0.55 + s * 0.045, B[1] - Math.cos(ang * 0.5) * dist * 0.55];
        const kind = k === 0 ? cen : pairs[Math.min(Math.abs(k) - 1, pairs.length - 1)];
        stems.push({ pts: curve([B, mid, end], 14), kind, ang, s });
      }
      for (const st of stems) add(ribbon(st.pts, () => 0.0065), 'green', { ink: INK * 0.7 });

      const leafy = (st) => {
        for (const t of [0.34, 0.5, 0.66]) {
          const i = Math.floor(t * (st.pts.length - 1)), p = st.pts[i], q = st.pts[i + 1];
          const dir = Math.atan2(q[0] - p[0], -(q[1] - p[1]));
          const side = (i % 2 ? 1 : -1) * st.s;
          smallLeaf(frame(p[0], p[1], dir + side * 0.62, 1, side), R(0.16, 0.24), R(0.024, 0.032), pick(['green', 'green', 'turq']));
        }
      };
      stems.forEach(leafy);

      const lw = R(0.1, 0.125);
      const flip = chance(0.5) ? 1 : -1;
      const sazCols = pick([['green', 'turq'], ['blue', 'turq'], ['green', 'white']]);
      for (const s of [-1, 1]) {
        saz([B, [s * flip * 0.26, 0.3], [s * flip * 0.6, 0.02], [s * flip * 0.95, 0.12], [s * flip * 1.02, 0.5]], lw, sazCols[0], sazCols[1]);
      }

      for (const st of stems) {
        const end = st.pts[st.pts.length - 1], p = st.pts[st.pts.length - 3];
        const dir = Math.atan2(end[0] - p[0], -(end[1] - p[1]));
        const size = R(0.29, 0.35), f = frame(end[0], end[1], dir, size);
        const [a, b] = COLS();
        if (st.kind === 'tulip') tulip(f, a, a === 'red' ? 'red' : b === 'red' ? 'red' : a);
        else if (st.kind === 'carnation') carnation(frame(end[0], end[1], dir, size * 1.02), 'red', pick(['blue', 'white']));
        else if (st.kind === 'hyacinth') hyacinth(frame(end[0], end[1], dir, size * 0.9), pick(['blue', 'turq']));
        else rosette(frame(end[0], end[1], dir, size * 0.72), pick([5, 6]), pick(['red', 'blue', 'white']), pick(['turq', 'red']), { veins: true });
      }

      // The tuft: leaves spreading from where the stems meet, then a small blossom over the join.
      for (let i = -2; i <= 2; i++) {
        smallLeaf(frame(B[0], B[1] + 0.03, i * 0.7, 1, i < 0 ? -1 : 1), 0.2, 0.04, 'green', 0.25);
      }
      rosette(frame(B[0], B[1], 0, 0.052), 6, 'white', 'blue');
    }

    function radial() {
      const n = pick([6, 8, 8, 12]), [a, b] = pick([['red', 'blue'], ['blue', 'red'], ['red', 'turq']]);
      const sc = n >= 12 ? 0.7 : n === 6 ? 1.16 : 1;
      const each = (fn) => { for (let i = 0; i < n; i++) fn(i / n * TAU, Math.sin(i / n * TAU), -Math.cos(i / n * TAU)); };

      // A hoop of stem ties the sprays together.
      const hoop = [];
      for (let i = 0; i <= 96; i++) {
        const t = i / 96 * TAU, r = 0.56 + 0.075 * Math.cos(t * n);
        hoop.push([r * Math.sin(t), -r * Math.cos(t)]);
      }
      add(ribbon(hoop, () => 0.006), 'green', { ink: INK * 0.7 });

      each((th, x, y) => {
        for (const s of [-1, 1]) {
          const rot = (p) => [p[0] * Math.cos(th) - p[1] * Math.sin(th), p[0] * Math.sin(th) + p[1] * Math.cos(th)];
          const u = Math.PI / n * 0.92;
          const c = [[0.0, -0.13], [s * Math.sin(u) * 0.27, -Math.cos(u) * 0.27], [s * Math.sin(u) * 0.46, -Math.cos(u) * 0.46], [s * Math.sin(u * 0.45) * 0.6, -Math.cos(u * 0.45) * 0.6]].map(rot);
          saz(c, 0.05 * sc, 'green', 'turq', 12);
        }
      });
      each((th, x, y) => {
        hatayi(frame(x * 0.41, y * 0.41, th, 0.19 * sc), a, 'white', b, 3);
        tulip(frame(x * 0.585, y * 0.585, th, 0.11 * sc), b === 'red' ? 'blue' : 'red', b === 'red' ? 'blue' : 'red');
      });
      each((th) => {
        const t = th + Math.PI / n, x = Math.sin(t), y = -Math.cos(t);
        rosette(frame(x * 0.615, y * 0.615, t, 0.058 * sc), 5, 'white', b, { veins: false });
        smallLeaf(frame(x * 0.52, y * 0.52, t + 0.5, 1), 0.08, 0.016, 'green');
        smallLeaf(frame(x * 0.52, y * 0.52, t - 0.5, 1, -1), 0.08, 0.016, 'green');
      });
      fan(frame(0, 0, 0, 0.2), 1, n, TAU, a, INK, 0);
      fan(frame(0, 0, Math.PI / n, 0.2), 0.74, n, TAU, 'white', INK, 0);
      rosette(frame(0, 0, 0, 0.085), n === 12 ? 6 : n, b, 'turq');
    }

    function pinwheel() {
      const n = pick([3, 4, 4, 5]), off = R(0, TAU);
      const [a, b] = pick([['blue', 'turq'], ['green', 'turq'], ['blue', 'white']]);
      const [c, d] = pick([['red', 'blue'], ['red', 'turq'], ['blue', 'red']]);
      const rot = (p, t) => [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)];

      // Fine sprays fill the space between the blades.
      for (let i = 0; i < n; i++) {
        const t = off + (i + 0.5) / n * TAU;
        const sp = curve([[0.12, 0], [0.32, 0.1], [0.5, 0.05], [0.62, -0.1]].map((p) => rot(p, t)), 10);
        add(ribbon(sp, () => 0.005), 'green', { ink: INK * 0.7 });
        for (const i2 of [8, 14, 20, 26]) {
          const p = sp[i2], s = i2 % 4 ? 1 : -1;
          smallLeaf(frame(p[0], p[1], t + Math.PI / 2 + s * 0.8, 1, s), 0.09, 0.015, 'green');
        }
        const e = sp[sp.length - 1];
        rosette(frame(e[0], e[1], t, 0.07), 6, c, d, { veins: true });
        const m = sp[15];
        rosette(frame(m[0] + 0.03, m[1] - 0.05, t, 0.04), 5, 'white', 'red');
      }
      for (let i = 0; i < n; i++) {
        const t = off + i / n * TAU;
        const pts = [[0.05, 0.03], [0.3, -0.14], [0.56, -0.13], [0.72, 0.1], [0.62, 0.3]].map((p) => rot(p, t));
        const sp = saz(pts, 0.105, a, b, 17);
        const m = sp[Math.floor(sp.length * 0.46)], ang = t + Math.PI / 2;
        hatayi(frame(m[0], m[1], ang + 0.3, 0.135), c, 'white', d, 3.2);
      }
      fan(frame(0, 0, 0, 0.17), 1, 8, TAU, c, INK, 0);
      fan(frame(0, 0, 0.3, 0.17), 0.72, 8, TAU, 'white', INK, 0);
      rosette(frame(0, 0, 0, 0.075), 6, d, 'turq');
    }

    function cypress() {
      // A cypress with a flowering plum wound around it.
      const h = 1.5, base = 0.72;
      const trunk = curve([[0, base], [0, base - h * 0.5], [0, base - h]], 18);
      add(ribbon(trunk, sawW(0.135, 22, 0.16)), pick(['green', 'blue']));
      add(ribbon(trunk, leafW(0.045)), 'turq', { ink: INK * 0.6 });
      for (let i = 5; i < trunk.length - 5; i += 3) {
        const t = i / (trunk.length - 1), w = leafW(0.12)(t);
        for (const s of [-1, 1]) line([[s * w * 0.42, trunk[i][1] + 0.02], [s * w * 0.9, trunk[i][1] - 0.025]], INK * 0.55);
      }
      for (const s of [-1, 1]) {
        const c = [[s * 0.03, 0.72], [s * 0.3, 0.42], [s * 0.2, 0.12], [s * 0.42, -0.14], [s * 0.34, -0.42], [s * 0.2, -0.56]];
        const sp = curve(c, 10);
        add(ribbon(sp, (t) => 0.012 * (1 - t) + 0.004), 'red', { ink: INK * 0.7 });
        for (let i = 7; i < sp.length - 1; i += 8) {
          const p = sp[i], side = (i % 16 < 8 ? 1 : -1);
          const q = [p[0] + side * R(0.09, 0.18), p[1] - R(0.03, 0.12)];
          line(curve([p, [(p[0] + q[0]) / 2, p[1] - 0.04], q], 4), INK);
          rosette(frame(q[0], q[1], R(0, 3), R(0.052, 0.074)), 5, 'white', 'blue', { stamens: true });
          smallLeaf(frame(p[0], p[1], side * 1.1, 1, side), 0.1, 0.02, 'green');
        }
      }
      for (const s of [-1, 1]) {
        tulip(frame(s * 0.56, 0.3, s * 0.3, 0.22), 'red', 'red');
        const sp = curve([[s * 0.2, 0.74], [s * 0.42, 0.62], [s * 0.53, 0.32]], 8);
        add(ribbon(sp, () => 0.006), 'green', { ink: INK * 0.7 });
        smallLeaf(frame(sp[10][0], sp[10][1], s * 1.3, 1, s), 0.16, 0.03, 'turq');
      }
    }

    function chintamani() {
      const s = R(0.09, 0.11), dx = s * 3.7, dy = dx * 0.88, [a, b] = pick([['blue', 'red'], ['turq', 'red'], ['blue', 'blue']]);
      for (let j = -5; j <= 5; j++) {
        for (let i = -5; i <= 5; i++) {
          const x = (i + (j % 2 ? 0.5 : 0)) * dx, y = j * dy;
          if (Math.hypot(x, y) < WELL - s * 1.8) cintamani(x, y, s, a, b);
        }
      }
    }

    function scrolls() {
      // Hair-thin spirals with small leaves, the kind once called Golden Horn ware.
      const centers = [[0, 0, 0.27]];
      const n = 6, a0 = R(0, 1);
      for (let i = 0; i < n; i++) centers.push([0.5 * Math.cos(a0 + i / n * TAU), 0.5 * Math.sin(a0 + i / n * TAU), 0.245]);
      for (const [cx, cy, r] of centers) {
        const dir = chance(0.5) ? 1 : -1, a = R(0, TAU), turns = 3.1, pts = [];
        for (let i = 0; i <= 180; i++) {
          const t = i / 180, th = a + dir * t * turns * TAU, rr = r * (1 - t * 0.9);
          pts.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th)]);
        }
        line(pts, INK * 1.05);
        for (let i = 3; i < 170; i += 4 + Math.floor(i / 60)) {
          const p = pts[i], q = pts[i + 1], tan = Math.atan2(q[0] - p[0], -(q[1] - p[1]));
          const size = 0.03 - 0.018 * i / 180;
          for (const s of [-1, 1]) smallLeaf(frame(p[0], p[1], tan + s * 0.75, 1, s), size, size * 0.3, 'blue', 0.12);
        }
        rosette(frame(cx, cy, a, 0.03), 5, 'blue', 'turq');
      }
    }

    /* ---------- The rim, drawn on a strip that bends round the plate. ---------- */

    const bend = (u, v) => {
      const r = RIM_IN + v * (RIM_OUT - RIM_IN);
      return [r * Math.sin(u), -r * Math.cos(u)];
    };
    const ring = (r0, r1, fill, o = {}) => {
      const a = circle(0, 0, r1, 180), b = circle(0, 0, r0, 180);
      add(a.concat([a[0]], [b[0]], b.slice().reverse()), fill, { ink: 0, at: [0, -r1], ...o });
      shapes[shapes.length - 1].ring = true;
    };
    const hoop = (r, w = INK) => { const p = circle(0, 0, r, 180); p.push(p[0]); line(p, w); };

    function rimWaves() {
      // The Iznik wave-and-rock border: blue crests curling into tight spirals over turquoise rocks.
      const n = pick([24, 26, 28]), du = TAU / n;
      const h = RIM_OUT - RIM_IN, asp = h / (du * 0.875);    // strip height over strip width, so spirals stay round
      const at = (i, x, y) => bend((i + x) * du, y);
      for (let i = 0; i < n; i++) {
        const rock = [[0.1, 0.03], [0.26, 0.2], [0.38, 0.1], [0.52, 0.27], [0.74, 0.03]].map(([x, y]) => at(i, x, y));
        add(rock, 'turq', { ink: INK * 0.7 });
        for (const x of [0.28, 0.42, 0.56]) line([at(i, x, 0.05), at(i, x + 0.03, 0.14)], INK * 0.5);

        const sp = [[-0.06, 0.02], [0.14, 0.28], [0.3, 0.62]].map(([x, y]) => at(i, x, y));
        const cx = 0.68, cy = 0.56, turns = 2.15, a0 = 3.1;
        for (let k = 0; k <= 56; k++) {
          const t = k / 56, r = 0.4 * (1 - 0.9 * Math.pow(t, 0.85)), th = a0 + t * turns * TAU;
          sp.push(at(i, cx + r * Math.cos(th) * asp, cy + r * Math.sin(th)));
        }
        const c = curve(sp.slice(0, 4), 5).concat(sp.slice(4));
        add(ribbon(c, (t) => (0.0145 * Math.pow(1 - t, 0.75) + 0.0028) * Math.min(1, t / 0.05 + 0.1)), 'blue', { ink: INK * 0.75 });
        add(circle(...at(i, cx, cy), 0.0052, 8), 'blue', { ink: 0 });
        for (let k = 0; k < 4; k++) {
          const x = 0.03 + k * 0.1;
          line([at(i, x + 0.1, 0.13 + k * 0.1), at(i, x + 0.02, 0.28 + k * 0.1)], INK * 0.5);
        }
      }
    }

    function rimClouds() {
      const n = pick([6, 7, 8]), [a, b] = pick([['blue', 'red'], ['red', 'blue'], ['blue', 'turq']]);
      const du = TAU / n;
      for (let i = 0; i < n; i++) {
        const u = i * du;
        const f = (p) => bend(u + p[0] * du * 0.34, 0.5 + p[1] * 1.5);
        cloud(f, a);
        const g = bend(u + du * 0.5, 0.5);
        rosette(frame(g[0], g[1], u + du * 0.5, 0.058), 6, b, 'turq');
        for (const s of [-1, 1]) {
          const l = bend(u + du * (0.5 + s * 0.13), 0.5);
          smallLeaf(frame(l[0], l[1], u + du * 0.5 + s * 1.57, 1, s), 0.05, 0.011, 'green');
        }
      }
    }

    function rimFlowers() {
      const n = pick([12, 14, 16]), du = TAU / n, [a, b] = pick([['red', 'white'], ['white', 'red'], ['red', 'turq']]);
      const hoopPts = [];
      for (let i = 0; i <= 240; i++) {
        const t = i / 240 * TAU;
        hoopPts.push(bend(t, 0.5 + 0.33 * Math.sin(t * n)));
      }
      add(ribbon(hoopPts, () => 0.0045), 'green', { ink: INK * 0.6 });
      for (let i = 0; i < n; i++) {
        const u = (i + 0.0) * du, p = bend(u, 0.2), q = bend(u + du * 0.5, 0.82);
        tulip(frame(p[0], p[1], u, 0.1), a === 'white' ? 'red' : a, a === 'white' ? 'red' : a);
        rosette(frame(q[0], q[1], u, 0.048), 6, b, 'blue');
      }
    }

    function rimLozenge() {
      const n = pick([14, 16, 20]), du = TAU / n, [a, b] = pick([['blue', 'red'], ['turq', 'red'], ['red', 'blue']]);
      for (let i = 0; i < n; i++) {
        const c = [[0, 0.5], [0.5, 0.97], [1, 0.5], [0.5, 0.03]].map(([x, y]) => bend((i + x) * du, y));
        add(c, a);
        const d = [[0.2, 0.5], [0.5, 0.78], [0.8, 0.5], [0.5, 0.22]].map(([x, y]) => bend((i + x) * du, y));
        add(d, 'white', { ink: INK * 0.7 });
        const m = bend((i + 0.5) * du, 0.5);
        rosette(frame(m[0], m[1], (i + 0.5) * du, 0.032), 4, b, 'blue');
        for (const v of [0.14, 0.86]) {
          const t = bend(i * du, v);
          add(circle(t[0], t[1], 0.016, 8), b, { ink: INK * 0.6 });
        }
      }
    }

    function guard(col, kind) {
      hoop(0.738, INK * 1.1);
      hoop(0.776, INK * 1.1);
      const n = 72, du = TAU / n, r0 = 0.74, r1 = 0.774;
      for (let i = 0; i < n; i++) {
        const u = i * du, P = (x, y) => { const r = r0 + y * (r1 - r0), a = u + x * du; return [r * Math.sin(a), -r * Math.cos(a)]; };
        if (kind === 'scallop') {
          const c = curve([[0, 0], [0.12, 0.72], [0.5, 1], [0.88, 0.72], [1, 0]], 4).map(([x, y]) => P(x, y));
          add(c, col, { ink: INK * 0.5 });
        } else if (kind === 'chain') {
          add(i % 2 ? circle(...P(0.5, 0.5), 0.012, 9) : [P(0, 0.5), P(0.5, 0.92), P(1, 0.5), P(0.5, 0.08)], i % 2 ? 'turq' : col, { ink: INK * 0.5 });
        } else {
          add([P(0, 0), P(0.5, 0.9), P(1, 0)], col, { ink: INK * 0.5 });
        }
      }
    }

    // Iznik painters left little bare ground. Find the emptiest spot, set a sprig in it, and repeat until none is left.
    function fillGaps() {
      const N = 96, cell = (WELL * 2) / N, used = new Uint8Array(N * N);
      const mark = (x, y, r) => {
        const cr = Math.ceil(r / cell), ci = Math.floor((x + WELL) / cell), cj = Math.floor((y + WELL) / cell);
        for (let j = cj - cr; j <= cj + cr; j++) for (let i = ci - cr; i <= ci + cr; i++) {
          if (i >= 0 && j >= 0 && i < N && j < N && (i - ci) ** 2 + (j - cj) ** 2 <= cr * cr) used[j * N + i] = 1;
        }
      };
      for (const s of shapes) {
        for (let i = 0; i < s.pts.length; i++) mark(s.pts[i][0], s.pts[i][1], 0.012);
        if (!s.open && s.fill) {
          let x = 0, y = 0;
          for (const p of s.pts) { x += p[0]; y += p[1]; }
          mark(x / s.pts.length, y / s.pts.length, 0.018);
        }
      }
      for (let tries = 0; tries < 46; tries++) {
        // Distance from every free cell to the nearest used one, on a coarse sweep.
        let best = 0, bx = 0, by = 0;
        for (let j = 0; j < N; j += 2) for (let i = 0; i < N; i += 2) {
          const x = -WELL + (i + 0.5) * cell, y = -WELL + (j + 0.5) * cell, edge = WELL - Math.hypot(x, y);
          if (edge <= 0 || used[j * N + i]) continue;
          let d = edge;
          for (let r = 1; r < 16 && cell * r < d; r++) {
            let hit = false;
            for (let k = 0; k < 12 && !hit; k++) {
              const ii = i + Math.round(Math.cos(k / 12 * TAU) * r), jj = j + Math.round(Math.sin(k / 12 * TAU) * r);
              if (ii >= 0 && jj >= 0 && ii < N && jj < N && used[jj * N + ii]) hit = true;
            }
            if (hit) { d = cell * r; break; }
          }
          if (d > best) { best = d; bx = x; by = y; }
        }
        if (best < 0.03) break;
        const size = Math.min(best * 0.82, 0.075), a = Math.atan2(bx, -by) + R(-0.5, 0.5);
        if (size > 0.05 && chance(0.55)) {
          // A bud on a short curved stem, leaves either side.
          const tip = frame(bx, by, a, 1), sp = curve([[0, -size], [size * 0.25, 0], [0, size * 0.25]], 5).map(tip);
          add(ribbon(sp, () => 0.0042), 'green', { ink: INK * 0.6 });
          smallLeaf(frame(sp[4][0], sp[4][1], a - 0.8, 1, -1), size * 0.72, size * 0.17, 'green');
          smallLeaf(frame(sp[6][0], sp[6][1], a + 0.8, 1), size * 0.72, size * 0.17, 'turq');
          tulip(frame(sp[10][0], sp[10][1], a, size * 0.68), 'red', 'red');
        } else {
          const n = pick([5, 5, 6]);
          rosette(frame(bx, by, a, size * 0.62), n, pick(['blue', 'red', 'turq']), pick(['red', 'turq', 'blue']));
          for (const d of [-1, 1]) smallLeaf(frame(bx + Math.sin(a + d * 2) * size * 0.6, by - Math.cos(a + d * 2) * size * 0.6, a + d * 2, 1, d), size * 0.5, size * 0.13, 'green');
        }
        mark(bx, by, best * 0.95);
      }
    }

    /* ---------- One plate ---------- */

    const COMPOSITIONS = [
      ['Bouquet', bouquet, 5],
      ['Rosette', radial, 3],
      ['Saz leaves', pinwheel, 3],
      ['Cypress and plum', cypress, 2],
      ['Çintamani', chintamani, 1.5],
      ['Spiral scroll', scrolls, 1.5],
    ];
    const RIMS = [['wave and rock', rimWaves, 4], ['cloud bands', rimClouds, 1], ['flowers', rimFlowers, 2], ['lozenges', rimLozenge, 2]];
    const weighted = (l) => {
      let t = l.reduce((s, x) => s + x[2], 0) * rand();
      for (const x of l) if ((t -= x[2]) <= 0) return x;
      return l[0];
    };

    const paletteKey = pick(['classic', 'classic', 'classic', 'late', 'damascus', 'blueturq']);
    const comp = weighted(COMPOSITIONS), rim = weighted(RIMS);

    // Most surviving dishes keep a white ground. The rest lay cobalt or turquoise around white reserved shapes.
    const groundRoll = rand();
    const groundable = comp[0] !== 'Spiral scroll';
    const wellGround = groundable && groundRoll > 0.7 ? (groundRoll > 0.88 ? 'turq' : 'blue') : null;
    const rimGround = rim[0] === 'wave and rock' ? null : (rand() < 0.45 ? pick(['blue', 'blue', 'turq']) : null);

    // The well first, fitted to its circle; the rim and rings are measured in plate units and stay as they are.
    if (wellGround) add(circle(0, 0, 0.738, 180), wellGround, { ink: 0, ground: true, at: [0, 0] });
    if (rimGround) ring(0.776, 0.985, rimGround, { ground: true });
    const fixed = shapes;
    shapes = [];
    comp[1]();
    let cx = 0, cy = 0, far = 0;
    {
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const s of shapes) for (const p of s.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      cx = (x0 + x1) / 2; cy = (y0 + y1) / 2;
      for (const s of shapes) for (const p of s.pts) far = Math.max(far, Math.hypot(p[0] - cx, p[1] - cy));
    }
    const k = WELL / far;
    for (const s of shapes) {
      for (const p of s.pts) { p[0] = (p[0] - cx) * k; p[1] = (p[1] - cy) * k; }
      s.at = [(s.at[0] - cx) * k, (s.at[1] - cy) * k];
    }
    if (comp[0] !== 'Rosette' && comp[0] !== 'Spiral scroll') fillGaps();
    const well = shapes;
    shapes = [];

    guard(pick(['blue', 'blue', 'turq']), pick(['scallop', 'teeth', 'chain']));
    rim[1]();
    hoop(0.965, INK * 1.1);
    ring(0.984, 1.012, 'blue');
    const border = shapes;

    // Nothing may vanish into its own ground.
    const swap = { blue: 'turq', turq: 'white', green: 'white' };
    if (wellGround) for (const s of well) if (s.fill === wellGround) s.fill = swap[wellGround];
    if (rimGround) for (const s of border) if (s.fill === rimGround && !s.ring) s.fill = swap[rimGround];

    const P = PALETTES[paletteKey];
    return {
      seed,
      shapes: fixed.concat(well, border),
      palette: P,
      title: comp[0],
      detail: `${rim[0][0].toUpperCase()}${rim[0].slice(1)} on the rim`,
      era: P.name,
    };
  }

  return { generate };
})();
