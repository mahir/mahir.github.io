// The drafting sheet: paper, frame, title block, parts list, balloons, the pen.
//
//   layout(W, H, opts)          -> L      where everything goes, for a viewport W x H (CSS px)
//   paper(L, dpr)               -> canvas  paper, grid and the preprinted form, once per size
//   compose(L, drawing, info)   -> sheet   every line on the sheet as a pen stroke with a time
//   new Plate(canvas)                      draws a sheet onto a canvas, incrementally
//   still(L, sheet, scale)      -> canvas  the finished sheet, for Save PNG
//
// All lines are opaque colors (ink mixed with paper), so pieces drawn frame by frame
// overlap without darkening and the ink can go straight onto the paper canvas.
import { strokeText, textWidth } from './font.js';

export const PAPER = '#e8e7e1';
export const INK = '#1b1a18';
const PRINT = '#33322e'; // the preprinted form, a touch lighter than drawing ink

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function hex(c) { return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); }
const P_RGB = hex(PAPER), I_RGB = hex(INK);
// ink at alpha a over the paper, as an opaque color
export function mix(a, base = I_RGB) {
  const c = base.map((v, i) => Math.round(P_RGB[i] + (v - P_RGB[i]) * a));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ---------------------------------------------------------------- layout

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const today = (d = new Date()) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// opts: { avoid: [{x0,y0,x1,y1}] rects of page chrome to keep balloons and the vehicle off }
export function layout(W, H, opts = {}) {
  const min = Math.min(W, H);
  const m = Math.round(clamp(min * 0.016, 7, 20));      // paper edge to trim line
  const z = Math.round(clamp(min * 0.017, 11, 17));     // zone strip
  const outer = { x0: m, y0: m, x1: W - m, y1: H - m };
  const inner = { x0: m + z, y0: m + z, x1: W - m - z, y1: H - m - z };
  const iw = inner.x1 - inner.x0, ih = inner.y1 - inner.y0;
  const k = clamp(Math.sqrt(W / 1440), 0.82, 1.18);    // line weight scale

  const narrow = W < 640 || (W < 900 && H > W * 1.15);
  // the title block column: about 310 px wide at 1440, growing gently with the sheet
  const tbW = narrow ? iw : Math.round(clamp(W * 0.215, 290, 400));
  const vc = narrow ? clamp(tbW * 0.0205, 6.6, 9.2) : clamp(tbW * 0.02, 6, 8);   // value cap height
  const lc = narrow ? clamp(vc * 0.6, 4.9, 5.6) : clamp(vc * 0.7, 4.5, 5.3);     // field label cap height
  const pad = Math.max(4, vc * 0.7);                     // inside a cell
  const fieldH = (valueCap) => Math.round(pad * 0.8 + lc + lc * 0.95 + valueCap + pad * 1.05);

  // rows from the bottom up
  const rows = [];
  let y = inner.y1;
  const row = (name, h) => { rows.push({ name, y0: y - h, y1: y }); y -= h; return rows[rows.length - 1]; };
  const firm = row('firm', Math.round(lc * 2.5));
  const drg = row('drg', fieldH(vc * 1.75));
  const kcMax = vc * (narrow ? 2.05 : 1.95), ncMax = vc * 1.5, bc = vc * 0.98;
  const titleH = Math.round(pad * 0.6 + lc + lc * 0.15 + lc * 1.1 + kcMax + vc * 0.95 + ncMax + vc * 0.85 + bc * 2 + bc * 0.75 + pad * 1.3);
  const title = row('title', titleH);
  const info = row('info', fieldH(vc));
  const specRowH = Math.round(vc * 2.15);
  const specs = row('specs', specRowH * 3);
  const tb = { x0: inner.x1 - tbW, y0: y, x1: inner.x1, y1: inner.y1, w: tbW };

  // parts list above the title block, header at its foot, rows going up
  const plRowH = Math.round(vc * 2.05);
  const plRows = 10; // header + up to nine items
  const twoCol = narrow && tbW < 520;
  const plH = plRowH * (twoCol ? 6 : plRows);
  const pl = { x0: tb.x0, x1: tb.x1, y1: tb.y0, y0: tb.y0 - plH, rowH: plRowH, twoCol };

  // where the vehicle goes
  const avoid = opts.avoid || [];
  const chromeBottom = avoid.reduce((b, r) => (r.x0 < W * 0.5 ? Math.max(b, r.y1) : b), 0);
  const gap = clamp(min * 0.03, 10, 34);
  const top = Math.max(inner.y0 + gap, chromeBottom + gap * 0.6);
  // room around the vehicle for balloons
  const br = clamp(vc * 1.18, 7, 11);
  const ring = br * 2 + clamp(min * 0.05, 18, 56);
  // the free area: everything inside the frame below the chrome; the block sits in its corner
  const free = { x0: inner.x0 + gap * 0.5, y0: top, x1: inner.x1 - gap * 0.5, y1: inner.y1 - gap * 0.5 };
  const block = { x0: pl.x0, y0: pl.y0, x1: tb.x1, y1: tb.y1 };
  // a reference box for the first make(); the vehicle is then scaled and placed by place()
  const ref = narrow
    ? { x0: free.x0, y0: free.y0, x1: free.x1, y1: block.y0 - gap * 0.5 }
    : { x0: free.x0, y0: free.y0, x1: block.x0 - gap * 0.5, y1: free.y1 };
  const box = { x0: ref.x0 + ring, y0: ref.y0 + ring, x1: ref.x1 - ring, y1: ref.y1 - ring };
  box.w = Math.max(60, box.x1 - box.x0); box.h = Math.max(60, box.y1 - box.y0);
  box.cx = (ref.x0 + ref.x1) / 2; box.cy = (ref.y0 + ref.y1) / 2;
  const region = free;

  // zones
  const nX = Math.max(4, Math.round(iw / 170) & ~1 || 4);
  const nY = Math.max(2, Math.round(ih / 170));

  return {
    W, H, k, m, z, outer, inner, narrow, tb, pl, rows: { firm, drg, title, info, specs }, specRowH,
    vc, lc, pad, kcMax, ncMax, bc, br, box, region, free, block, nX, nY, avoid, gap,
  };
}

// the top of the parts list for n items (the list grows up from the title block)
export function plTop(L, n) {
  const pl = L.pl;
  const rows = (pl.twoCol ? Math.ceil(Math.min(n, 9) / 2) : Math.min(n, 9)) + 1;
  return pl.y1 - pl.rowH * rows;
}

// ---------------------------------------------------------------- strokes

// a stroke: { pts: Float32Array, lw, col, dash, len, cum, t0, t1 }
function mkStroke(arr, lw, col, dash = null) {
  const pts = arr instanceof Float32Array ? arr : Float32Array.from(arr);
  const n = pts.length >> 1;
  const cum = new Float32Array(n);
  let len = 0;
  for (let i = 1; i < n; i++) {
    len += Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    cum[i] = len;
  }
  return { pts, lw, col, dash, len, cum, t0: 0, t1: 0, done: 0, i: 0 };
}

// lettering: x, y is the left end of the baseline (or center/right with align)
function text(str, x, y, size, { align = 'left', lw = 0.6, col = INK, spacing } = {}) {
  const t = strokeText(str, spacing == null ? {} : { spacing });
  const w = t.width * size;
  const ox = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  return t.paths.map((p) => {
    const a = new Float32Array(p.length);
    for (let i = 0; i < p.length; i += 2) { a[i] = ox + p[i] * size; a[i + 1] = y - p[i + 1] * size; }
    return mkStroke(a, lw, col);
  });
}
const tw = (str, size, spacing) => textWidth(str, spacing == null ? {} : { spacing }) * size;
const textLW = (size, k) => clamp(size * 0.085, 0.42, 1.25) * Math.min(1, k * 1.05);

function seg(x0, y0, x1, y1, lw, col, dash) { return mkStroke([x0, y0, x1, y1], lw, col, dash); }
function circle(cx, cy, r, lw, col, n, a0 = -Math.PI / 2) {
  n = n || Math.max(16, Math.round(r * 2.2));
  const a = [];
  for (let i = 0; i <= n; i++) { const t = a0 + (i / n) * Math.PI * 2; a.push(cx + r * Math.cos(t), cy + r * Math.sin(t)); }
  return mkStroke(a, lw, col);
}

function wrap(str, size, maxW) {
  const words = str.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (tw(t, size) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- the preprinted form

function form(L) {
  const k = L.k, out = [];
  const lwRule = 0.5 * k, lwFrame = 1.25 * k, lwTB = 1.1 * k;
  const { outer: o, inner: n, tb, rows, lc, pad } = L;
  const faint = mix(0.55, hex(PRINT));
  const labelLW = clamp(lc * 0.085, 0.4, 0.5);
  const rect = (r, lw, col = PRINT) => out.push(mkStroke([r.x0, r.y0, r.x1, r.y0, r.x1, r.y1, r.x0, r.y1, r.x0, r.y0], lw, col));
  rect(o, 0.45 * k, faint);
  rect(n, lwFrame);

  // zone marks
  const zc = clamp(L.z * 0.42, 4.6, 6.4);
  const zlw = clamp(zc * 0.09, 0.4, 0.55);
  for (let i = 0; i <= L.nX; i++) {
    const x = n.x0 + (n.x1 - n.x0) * i / L.nX;
    if (i > 0 && i < L.nX) { out.push(seg(x, o.y0, x, n.y0, lwRule, PRINT)); out.push(seg(x, n.y1, x, o.y1, lwRule, PRINT)); }
    if (i < L.nX) {
      const xc = x + (n.x1 - n.x0) / L.nX / 2;
      const s = String(i + 1);
      out.push(...text(s, xc, (o.y0 + n.y0) / 2 + zc / 2, zc, { align: 'center', lw: zlw, col: PRINT }));
      out.push(...text(s, xc, (o.y1 + n.y1) / 2 + zc / 2, zc, { align: 'center', lw: zlw, col: PRINT }));
    }
  }
  for (let j = 0; j <= L.nY; j++) {
    const y = n.y0 + (n.y1 - n.y0) * j / L.nY;
    if (j > 0 && j < L.nY) { out.push(seg(o.x0, y, n.x0, y, lwRule, PRINT)); out.push(seg(n.x1, y, o.x1, y, lwRule, PRINT)); }
    if (j < L.nY) {
      const yc = y + (n.y1 - n.y0) / L.nY / 2 + zc / 2;
      const s = String.fromCharCode(65 + j);
      out.push(...text(s, (o.x0 + n.x0) / 2, yc, zc, { align: 'center', lw: zlw, col: PRINT }));
      out.push(...text(s, (o.x1 + n.x1) / 2, yc, zc, { align: 'center', lw: zlw, col: PRINT }));
    }
  }
  // centering marks, heavier, crossing the zone strip at the middle of each side
  const mx = (n.x0 + n.x1) / 2, my = (n.y0 + n.y1) / 2, cm = L.z + 4;
  out.push(seg(mx, o.y0 - 3, mx, n.y0 + 4, lwFrame, PRINT), seg(mx, n.y1 - 4, mx, o.y1 + 3, lwFrame, PRINT));
  out.push(seg(o.x0 - 3, my, n.x0 + 4, my, lwFrame, PRINT), seg(n.x1 - 4, my, o.x1 + 3, my, lwFrame, PRINT));
  void cm;

  // title block
  rect(tb, lwTB);
  const hline = (y, x0 = tb.x0, x1 = tb.x1, lw = lwRule) => out.push(seg(x0, y, x1, y, lw, PRINT));
  const vline = (x, y0, y1, lw = lwRule) => out.push(seg(x, y0, x, y1, lw, PRINT));
  const label = (s, x, y0) => out.push(...text(s, x + pad * 0.6, y0 + pad * 0.6 + lc, lc, { lw: labelLW, col: PRINT, spacing: 0.24 }));
  for (const name of ['drg', 'title', 'info']) hline(rows[name].y0, tb.x0, tb.x1, name === 'title' || name === 'drg' ? lwTB * 0.75 : lwRule);
  hline(rows.firm.y0, tb.x0, tb.x1, lwRule);
  hline(rows.specs.y0, tb.x0, tb.x1, lwTB);
  // specs grid: two columns, three rows
  const sx = tb.x0 + tb.w / 2;
  vline(sx, rows.specs.y0, rows.specs.y1);
  for (let r = 1; r < 3; r++) hline(rows.specs.y0 + L.specRowH * r, tb.x0, tb.x1);

  const W = tb.w;
  L.cells = {
    date: { x0: tb.x0, x1: tb.x0 + W * 0.27, ...ys(rows.info) },
    scale: { x0: tb.x0 + W * 0.27, x1: tb.x0 + W * 0.69, ...ys(rows.info) },
    proj: { x0: tb.x0 + W * 0.69, x1: tb.x1, ...ys(rows.info) },
    title: { x0: tb.x0, x1: tb.x1, ...ys(rows.title) },
    drg: { x0: tb.x0, x1: tb.x0 + W * 0.5, ...ys(rows.drg) },
    sheet: { x0: tb.x0 + W * 0.5, x1: tb.x0 + W * 0.74, ...ys(rows.drg) },
    series: { x0: tb.x0 + W * 0.74, x1: tb.x1, ...ys(rows.drg) },
  };
  const c = L.cells;
  for (const key of ['scale', 'proj']) vline(c[key].x0, c[key].y0, c[key].y1);
  for (const key of ['sheet', 'series']) vline(c[key].x0, c[key].y0, c[key].y1);
  label('DATE', c.date.x0, c.date.y0);
  label('SCALE', c.scale.x0, c.scale.y0);
  label('PROJECTION', c.proj.x0, c.proj.y0);
  label('TITLE', c.title.x0, c.title.y0);
  label('DRG NO.', c.drg.x0, c.drg.y0);
  label('SHEET', c.sheet.x0, c.sheet.y0);
  label('SERIES', c.series.x0, c.series.y0);
  // the firm strip
  const fc = lc * 1.12;
  const fy = (rows.firm.y0 + rows.firm.y1) / 2 + fc / 2;
  out.push(...text('MAHIRYAVUZ.COM · NO. 018', tb.x0 + pad, fy, fc, { lw: labelLW * 1.1, col: PRINT, spacing: 0.3 }));
  out.push(...text('DRAFTING SHEET', tb.x1 - pad, fy, lc, { align: 'right', lw: labelLW, col: PRINT, spacing: 0.3 }));
  return out;
}
const ys = (r) => ({ y0: r.y0, y1: r.y1 });

// ---------------------------------------------------------------- paper

let grainTile = null;
function grain() {
  if (grainTile) return grainTile;
  const n = 256, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d');
  const im = g.createImageData(n, n);
  let s = 12345;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < n * n; i++) {
    const v = r();
    const dark = v < 0.5;
    const a = Math.abs(v - 0.5) * 2;
    im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = dark ? 40 : 255;
    im.data[4 * i + 3] = Math.round(a * a * 24);
  }
  g.putImageData(im, 0, 0);
  return (grainTile = c);
}

// paper, grid and the preprinted form, at device resolution
export function paper(L, dpr) {
  const { W, H } = L;
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const g = c.getContext('2d');
  g.fillStyle = PAPER;
  g.fillRect(0, 0, c.width, c.height);
  g.scale(dpr, dpr);

  // mottling: a few large soft patches, lighter and darker
  let s = 777;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 14; i++) {
    const x = r() * W, y = r() * H, rad = (0.15 + r() * 0.35) * Math.max(W, H);
    const light = r() < 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, light ? 'rgba(255,255,250,0.07)' : 'rgba(120,110,90,0.035)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  // grid: soft lines, a touch darker with a lighter line beside, slightly uneven
  const cell = clamp(Math.round(Math.max(W, H) / 22), 46, 84);
  const ox = ((W % cell) / 2) - cell * 0.5, oy = ((H % cell) / 2) - cell * 0.5;
  for (let x = ox; x < W; x += cell) {
    const a = 0.05 + r() * 0.035, jx = x + (r() - 0.5) * 0.6;
    g.fillStyle = `rgba(80,78,68,${a})`; g.fillRect(jx, 0, 0.8, H);
    g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.08})`; g.fillRect(jx + 1.1, 0, 0.8, H);
  }
  for (let y = oy; y < H; y += cell) {
    const a = 0.05 + r() * 0.035, jy = y + (r() - 0.5) * 0.6;
    g.fillStyle = `rgba(80,78,68,${a})`; g.fillRect(0, jy, W, 0.8);
    g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.08})`; g.fillRect(0, jy + 1.1, W, 0.8);
  }
  // grain, at device pixels
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = g.createPattern(grain(), 'repeat');
  g.fillRect(0, 0, c.width, c.height);
  g.restore();
  // edges a little darker
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  v.addColorStop(0, 'rgba(90,80,60,0)');
  v.addColorStop(1, 'rgba(90,80,60,0.11)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);

  // the preprinted form
  const pre = form(L);
  g.lineCap = 'round'; g.lineJoin = 'round';
  strokeAll(g, pre);
  return c;
}

function strokeAll(g, list) {
  const groups = new Map();
  for (const s of list) {
    const key = s.lw.toFixed(3) + s.col + (s.dash ? s.dash.join(',') : '');
    let a = groups.get(key);
    if (!a) groups.set(key, (a = []));
    a.push(s);
  }
  for (const a of groups.values()) {
    g.lineWidth = a[0].lw; g.strokeStyle = a[0].col; g.setLineDash(a[0].dash || []);
    g.beginPath();
    for (const s of a) { const p = s.pts; g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); }
    g.stroke();
  }
  g.setLineDash([]);
}

// ---------------------------------------------------------------- scale

const NICE = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6, 7.5, 8];
const MM_PER_PX = 0.2646;
// the standard scale at or below the drawing's: N >= raw, and the factor to shrink to it
export function snapScale(pxPerMeter) {
  const raw = 1000 / (pxPerMeter * MM_PER_PX);
  const e = Math.pow(10, Math.floor(Math.log10(raw)));
  let N = 10 * e;
  for (const v of NICE) if (v * e >= raw - 1e-9) { N = v * e; break; }
  N = Math.round(N * 1000) / 1000;
  return { N, r: raw / N };
}

// ---------------------------------------------------------------- compose

// phases of the draw, as fractions of the draw time
const PH = {
  title: [0, 0.11],
  construct: [0.105, 0.16],
  structure: [0.155, 0.55],
  detail: [0.5, 0.72],
  hatch: [0.64, 0.87],
  dims: [0.85, 0.93],
  balloons: [0.875, 0.975],
  list: [0.885, 0.99],
  block: [0.89, 1],
};

// info: { seed, date }
export function compose(L, d, info) {
  const k = L.k;
  const { N, r } = snapScale(d.pxPerMeter);
  const ppm = d.pxPerMeter * r;
  const cx = info.cx ?? L.box.cx, cy = info.cy ?? L.box.cy;
  const X = (x) => cx + x * r, Y = (y) => cy + y * r;

  const LW = [0.38 * k, 0.55 * k, 0.8 * k, 1.2 * k];
  const COL = [mix(0.78), INK, INK, INK];
  const CONS = mix(0.32);
  const dashFor = (dash, lw) => (dash === 'chain' ? [9 * k, 2.4 * k, 1.2 * k, 2.4 * k] : dash === 'dash' ? [3.6 * k, 2.2 * k] : null);

  // drawing strokes into sheet strokes, by pass
  const byPass = [[], [], [], [], []];
  for (const s of d.strokes) {
    const p = s.pts;
    const a = new Float32Array(p.length);
    for (let i = 0; i < p.length; i += 2) { a[i] = X(p[i]); a[i + 1] = Y(p[i + 1]); }
    const w = s.w | 0, pass = clamp(s.pass | 0, 0, 4);
    const lw = pass === 0 ? LW[0] : LW[w];
    const col = pass === 0 ? CONS : COL[w];
    const st = mkStroke(a, lw, col, dashFor(s.dash, lw));
    st.part = s.part | 0;
    byPass[pass].push(st);
  }

  const meta = d.meta || {};
  const { vc, lc, pad, tb, rows } = L;
  const cells = L.cells || (form(L), L.cells);

  // --- title lettering (phase 1)
  const tc = cells.title;
  const innerW = tc.x1 - tc.x0 - pad * 2;
  const klass = (meta.klass || '').toUpperCase();
  const kc = Math.min(L.kcMax, innerW / Math.max(1, textWidth(klass, { spacing: 0.16 })));
  let y = tc.y0 + pad * 0.6 + lc + lc * 1.25 + L.kcMax;
  const penKlass = text(klass, tc.x0 + pad, y, kc, { lw: textLW(kc, k) * 1.08, spacing: 0.16 });
  y += vc * 0.95 + L.ncMax;
  const name = (meta.name || '').toUpperCase();
  const desig = (meta.designation || '').toUpperCase();
  let nc = L.ncMax;
  const dc = vc * 1.12;
  const nameW = () => tw(name, nc, 0.22) + vc * 1.6 + tw(desig, dc);
  while (nameW() > innerW && nc > vc) nc *= 0.94;
  const penName = text(name, tc.x0 + pad, y, nc, { lw: textLW(nc, k) * 1.05, spacing: 0.22 });
  const dx = tc.x0 + pad + tw(name, nc, 0.22) + vc * 1.6;
  penName.push(...text(desig, dx, y, dc, { lw: textLW(dc, k) }));
  y += vc * 0.85 + L.bc;
  let bc = L.bc;
  let lines = wrap(meta.brief || '', bc, innerW);
  while (lines.length > 2 && bc > vc * 0.75) { bc *= 0.93; lines = wrap(meta.brief || '', bc, innerW); }
  const penBrief = [];
  for (const line of lines.slice(0, 2)) { penBrief.push(...text(line.toUpperCase(), tc.x0 + pad, y, bc, { lw: textLW(bc, k) })); y += bc * 1.75; }

  // --- balloons
  const placed = placeBalloons(L, d, X, Y);
  const balloonPens = placed.map((b) => {
    const list = [];
    const dotR = clamp(1.05 * k, 0.9, 1.4);
    list.push(circle(b.ax, b.ay, dotR * 0.5, dotR * 1.5, INK, 8));
    const ex = b.x - b.ux * L.br, ey = b.y - b.uy * L.br;
    list.push(seg(b.ax, b.ay, ex, ey, LW[1] * 0.9, INK));
    list.push(circle(b.x, b.y, L.br, LW[1] * 1.15, INK, 0, Math.atan2(-b.uy, -b.ux)));
    const ncap = L.br * 0.9;
    list.push(...text(String(b.item), b.x - 0.04 * ncap, b.y + ncap / 2, ncap, { align: 'center', lw: textLW(ncap, k) }));
    return list;
  });

  // --- parts list (pen): header at the foot, items above
  const pl = L.pl;
  const plOps = [];
  const items = placed.slice().sort((a, b) => a.item - b.item);
  const nItems = items.length;
  const plc = vc * 0.98;
  const plLW = textLW(plc, k);
  const rule = LW[1] * 0.95;
  const cols = pl.twoCol ? 2 : 1;
  const perCol = cols === 2 ? Math.ceil(nItems / 2) : nItems;
  const colW = (pl.x1 - pl.x0) / cols;
  for (let cI = 0; cI < cols; cI++) {
    const x0 = pl.x0 + colW * cI, x1 = x0 + colW;
    const fr = [0.14, 0.86];
    const xa = x0 + colW * fr[0], xb = x0 + colW * fr[1];
    const n = perCol;
    if (cI > 0 && nItems - perCol <= 0) continue;
    const top = pl.y1 - pl.rowH * (n + 1);
    // header row text and rules
    const hy = pl.y1 - (pl.rowH - lc) / 2;
    plOps.push(mkStroke([x0, pl.y1, x0, top, x1, top, x1, pl.y1], LW[2], INK));
    plOps.push(seg(x0, pl.y1 - pl.rowH, x1, pl.y1 - pl.rowH, LW[2] * 0.9, INK));
    plOps.push(seg(xa, pl.y1, xa, top, rule, INK), seg(xb, pl.y1, xb, top, rule, INK));
    plOps.push(...text('ITEM', (x0 + xa) / 2, hy, lc, { align: 'center', lw: textLW(lc, k), spacing: 0.24 }));
    plOps.push(...text('DESCRIPTION', xa + pad, hy, lc, { lw: textLW(lc, k), spacing: 0.24 }));
    plOps.push(...text('QTY', (xb + x1) / 2, hy, lc, { align: 'center', lw: textLW(lc, k), spacing: 0.24 }));
    for (let i = 0; i < n; i++) {
      const it = items[cI === 0 ? i : perCol + i];
      const ry1 = pl.y1 - pl.rowH * (i + 1), ry0 = ry1 - pl.rowH;
      if (i < n - 1) plOps.push(seg(x0, ry0, x1, ry0, rule, INK));
      if (!it) continue;
      const by = (ry0 + ry1) / 2 + plc / 2;
      plOps.push(...text(String(it.item), (x0 + xa) / 2, by, plc, { align: 'center', lw: plLW }));
      let desc = it.label.toUpperCase();
      let dsz = plc;
      const maxW = xb - xa - pad * 2;
      while (tw(desc, dsz) > maxW && dsz > plc * 0.72) dsz *= 0.95;
      plOps.push(...text(desc, xa + pad, by - (plc - dsz) / 2, dsz, { lw: plLW }));
      plOps.push(...text(String(it.qty), (xb + x1) / 2, by, plc, { align: 'center', lw: plLW }));
    }
  }

  // --- specs (pen)
  const specOps = [];
  const specs = (meta.specs || []).slice(0, 6);
  const sw = tb.w / 2;
  specs.forEach(([lab, val], i) => {
    const col = Math.floor(i / 3), rI = i % 3;
    const x0 = tb.x0 + sw * col, ry0 = rows.specs.y0 + L.specRowH * rI;
    const by = ry0 + L.specRowH / 2 + vc / 2;
    const sl = Math.max(lc, vc * 0.74);
    specOps.push(...text(String(lab).toUpperCase(), x0 + pad, by, sl, { lw: textLW(sl, k), spacing: 0.22 }));
    let vs = vc;
    const maxW = sw - pad * 3 - tw(String(lab).toUpperCase(), sl, 0.22);
    while (tw(String(val), vs) > maxW && vs > vc * 0.7) vs *= 0.95;
    specOps.push(...text(String(val).toUpperCase(), x0 + sw - pad, by, vs, { align: 'right', lw: textLW(vs, k) }));
  });

  // --- the rest of the block (pen)
  const blockOps = [];
  const valueY = (c, cap) => c.y1 - pad * 1.05;
  const date = info.date || today();
  blockOps.push(...text(date, cells.date.x0 + pad, valueY(cells.date, vc), vc, { lw: textLW(vc, k) }));
  const scaleStr = '1:' + fmtN(N);
  blockOps.push(...text(scaleStr, cells.scale.x0 + pad, valueY(cells.scale, vc), vc, { lw: textLW(vc, k) }));
  const scaleBar = bar(cells.scale, cells.scale.x0 + pad + tw(scaleStr, vc) + vc * 1.1, valueY(cells.scale, vc), ppm, vc, lc, k, pad);
  blockOps.push(...scaleBar);
  blockOps.push(...text('AXONOMETRIC', cells.proj.x0 + pad, valueY(cells.proj, vc), Math.min(vc, (cells.proj.x1 - cells.proj.x0 - pad * 2) / textWidth('AXONOMETRIC')), { lw: textLW(vc, k) }));
  const big = vc * 1.75;
  const drgNo = '018-' + String(info.seed).padStart(5, '0');
  blockOps.push(...text(drgNo, cells.drg.x0 + pad, valueY(cells.drg, big), big, { lw: textLW(big, k) * 1.1, spacing: 0.2 }));
  blockOps.push(...text('1 OF 1', cells.sheet.x0 + pad, valueY(cells.sheet, big), vc * 1.15, { lw: textLW(vc * 1.15, k) }));
  const fam = String(meta.family || '').toUpperCase();
  const famSize = Math.min(vc * 1.15, (cells.series.x1 - cells.series.x0 - pad * 2) / Math.max(1, textWidth(fam)));
  blockOps.push(...text(fam, cells.series.x0 + pad, valueY(cells.series, big), famSize, { lw: textLW(famSize, k) }));

  // --- schedule
  const all = [];
  const phase = (key, pens, { lift = 6, sync = true } = {}) => {
    const [a, b] = PH[key];
    pens = pens.filter((p) => p.length);
    if (!pens.length) return;
    const costs = pens.map((p) => p.reduce((s, o) => s + o.len + lift, 0));
    const maxCost = Math.max(...costs);
    pens.forEach((pen, i) => {
      const speed = (sync ? costs[i] : maxCost) / (b - a); // cost per unit of draw fraction
      let t = a;
      for (const o of pen) {
        o.t0 = t;
        t += Math.max(o.len, 0.01) / speed;
        o.t1 = t;
        t += lift / speed;
        all.push(o);
      }
    });
  };

  phase('title', [[...penKlass, ...penName], penBrief], { lift: 2 });
  phase('construct', splitPens(order(byPass[0]), 2), { lift: 4 });
  phase('structure', partPens(byPass[1], 3), { lift: 8, sync: false });
  phase('detail', partPens(byPass[2], 3), { lift: 4, sync: false });
  phase('hatch', partPens(byPass[3], 3, true), { lift: 2, sync: false });
  phase('dims', splitPens(order(byPass[4]), 2), { lift: 3 });
  const bp = [[], []];
  balloonPens.forEach((list, i) => bp[i % 2].push(...list));
  phase('balloons', bp, { lift: 10 });
  phase('list', [plOps], { lift: 2 });
  phase('block', [[...specOps], [...blockOps]], { lift: 2 });

  all.sort((p, q) => p.t0 - q.t0);
  return {
    ops: all,
    balloons: placed,
    scale: N,
    drgNo,
    label: `Drawing sheet ${drgNo}: ${cap(meta.klass)} ${meta.name || ''}, ${meta.designation || ''}. ${meta.brief || ''}`.replace(/\s+/g, ' ').trim(),
    meta,
  };
}

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const fmtN = (n) => (n >= 10000 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));

// the scale bar: two halves of alternating black and open blocks, 0 and the length in meters
function bar(cell, x0, yBase, ppm, vc, lc, k, pad) {
  const out = [];
  const room = cell.x1 - pad - x0 - lc * 3.2;
  if (room < 24) return out;
  let L = 1;
  for (const m of [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) if (m * ppm <= room) L = m;
  const len = L * ppm;
  if (len < 16) return out;
  const h = Math.max(2.2, vc * 0.42);
  const y1 = yBase - vc * 0.1, y0 = y1 - h;
  const n = 4;
  out.push(mkStroke([x0, y0, x0 + len, y0, x0 + len, y1, x0, y1, x0, y0], 0.5 * k, INK));
  for (let i = 0; i < n; i++) {
    const a = x0 + len * i / n, b = x0 + len * (i + 1) / n;
    if (i) out.push(seg(a, y0, a, y1, 0.5 * k, INK));
    if (i % 2 === 0) {
      // filled block: a few strokes side by side
      const rows = Math.max(2, Math.round(h / 0.9));
      for (let j = 0; j < rows; j++) { const yy = y0 + h * (j + 0.5) / rows; out.push(seg(a, yy, b, yy, h / rows * 1.2, INK)); }
    }
  }
  out.push(...text(fmtM(L) + ' M', x0 + len + lc * 0.6, y1, lc, { lw: textLW(lc, k), spacing: 0.22 }));
  out.push(...text('0', x0, y0 - lc * 0.45, lc * 0.9, { align: 'center', lw: textLW(lc, k) }));
  return out;
}
const fmtM = (m) => (m < 1 ? String(m).replace(/^0/, '') : String(m));

// ---------------------------------------------------------------- placing the vehicle

// Where the vehicle goes and how large. d0 was made for L.box. A drawing made for a box k
// times as large is the same drawing k times as large (the engine fits uniformly about the
// box center), so centers and scales are searched on d0 and the vehicle is made once more.
// The vehicle may reach into the empty space above and left of the title block, as long as
// no line of it comes near the block. Returns { cx, cy, k }.
export function place(L, d0) {
  const B = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  const grow = (b, x, y) => { if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y; };
  const ink = B(), all = B();
  for (const s of d0.strokes) {
    const p = s.pts;
    for (let i = 0; i < p.length; i += 2) { grow(all, p[i], p[i + 1]); if (s.pass >= 1 && s.pass <= 3) grow(ink, p[i], p[i + 1]); }
  }
  if (!isFinite(ink.x0)) return { cx: L.box.cx, cy: L.box.cy, k: 1 };
  // sample points along every line, one per cell, for the test against the block
  const cell = Math.max(1.5, ((all.x1 - all.x0) + (all.y1 - all.y0)) / 260);
  const seen = new Set(), sx = [], sy = [];
  const add = (x, y) => { const key = Math.round(x / cell) * 100003 + Math.round(y / cell); if (seen.has(key)) return; seen.add(key); sx.push(x); sy.push(y); };
  for (const s of d0.strokes) {
    const p = s.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const n = Math.max(1, Math.ceil(Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) / cell));
      for (let t = 0; t <= n; t++) add(p[i] + (p[i + 2] - p[i]) * t / n, p[i + 1] + (p[i + 3] - p[i + 1]) * t / n);
    }
  }
  const F = L.free, I = L.inner, ringB = L.br * 2 + 12, gb = L.br + 10;
  const by0 = plTop(L, Math.max(5, (d0.callouts || []).length));
  const blk = { x0: L.block.x0 - gb, y0: by0 - gb, x1: L.block.x1 + gb, y1: L.block.y1 + gb };
  // the optical middle of the free area: the centroid of the frame minus the block, a little high
  const fa = (F.x1 - F.x0) * (F.y1 - F.y0);
  const bw = Math.max(0, F.x1 - L.block.x0), bh = Math.max(0, F.y1 - by0), ba = bw * bh;
  const cen = {
    x: ((F.x0 + F.x1) / 2 * fa - (F.x1 - bw / 2) * ba) / (fa - ba),
    y: ((F.y0 + F.y1) / 2 * fa - (F.y1 - bh / 2) * ba) / (fa - ba) - (F.y1 - F.y0) * 0.02,
  };
  const chrome = L.avoid.map((r) => ({ x0: r.x0 - 6, y0: r.y0 - 6, x1: r.x1 + 6, y1: r.y1 + 6 }));
  // the largest k the frame allows at center (cx, cy)
  const kFrame = (cx, cy) => {
    let k = Infinity;
    const lim = (room, ext) => { if (ext > 0) k = Math.min(k, room / ext); else if (room < 0) k = 0; };
    lim(cx - F.x0, -all.x0); lim(F.x1 - cx, all.x1); lim(cy - F.y0, -all.y0); lim(F.y1 - cy, all.y1);
    lim(cx - ringB - I.x0 - 4, -ink.x0); lim(I.x1 - 4 - ringB - cx, ink.x1); lim(I.y1 - 4 - ringB - cy, ink.y1);
    lim(cy - Math.max(I.y0 + 4, F.y0 - L.gap) - ringB, -ink.y0);
    return Math.max(0, k);
  };
  const ok = (cx, cy, k) => {
    const x0 = cx + k * all.x0, x1 = cx + k * all.x1, y0 = cy + k * all.y0, y1 = cy + k * all.y1;
    for (const r of chrome) if (x1 > r.x0 && x0 < r.x1 && y1 > r.y0 && y0 < r.y1) return false;
    if (x1 < blk.x0 || y1 < blk.y0) return true;
    for (let i = 0; i < sx.length; i++) {
      const x = cx + k * sx[i], y = cy + k * sy[i];
      if (x > blk.x0 && x < blk.x1 && y > blk.y0 && y < blk.y1) return false;
    }
    return true;
  };
  const best = { score: -1, cx: L.box.cx, cy: L.box.cy, k: 0 };
  const diag = Math.hypot(F.x1 - F.x0, F.y1 - F.y0);
  const icx = (ink.x0 + ink.x1) / 2, icy = (ink.y0 + ink.y1) / 2;
  const tryAt = (cx, cy) => {
    let hi = kFrame(cx, cy);
    if (!(hi > 0) || !isFinite(hi)) return;
    let lo = 0;
    if (!ok(cx, cy, hi)) {
      for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (ok(cx, cy, mid)) lo = mid; else hi = mid; }
      hi = lo;
    }
    const k = hi;
    const dist = Math.hypot(cx + k * icx - cen.x, cy + k * icy - cen.y) / diag;
    const score = k * (1 - 0.35 * dist);
    if (score > best.score) Object.assign(best, { score, cx, cy, k });
  };
  const nx = 13, ny = 9;
  let stepX = (F.x1 - F.x0) / (nx - 1), stepY = (F.y1 - F.y0) / (ny - 1);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) tryAt(F.x0 + stepX * i, F.y0 + stepY * j);
  for (let round = 0; round < 3; round++) {
    stepX /= 2.5; stepY /= 2.5;
    const c = { ...best };
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) tryAt(c.cx + stepX * i, c.cy + stepY * j);
  }
  if (best.k <= 0) return { cx: L.box.cx, cy: L.box.cy, k: 1 };
  return { cx: best.cx, cy: best.cy, k: best.k };
}

// ---------------------------------------------------------------- pen order

// chain strokes so the pen moves to the nearest next start, flipping strokes where shorter
function order(list, sweep = false) {
  if (list.length < 2) return list.slice();
  if (sweep || list.length > 900) {
    // sort along the direction across the strokes (hatching is drawn line after line)
    let dx = 0, dy = 0;
    for (const s of list) { const p = s.pts, n = p.length; let ex = p[n - 2] - p[0], ey = p[n - 1] - p[1]; if (ex < 0) { ex = -ex; ey = -ey; } dx += ex; dy += ey; }
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const key = (s) => { const p = s.pts, n = p.length; return ((p[0] + p[n - 2]) * nx + (p[1] + p[n - 1]) * ny) / 2; };
    const out = list.slice().sort((a, b) => key(a) - key(b));
    // boustrophedon: alternate direction like a hand would
    let flip = false;
    for (const s of out) { if (flip) reverse(s); flip = !flip; }
    return out;
  }
  const rest = list.slice();
  const out = [];
  // start from the top-left-most stroke
  let bi = 0, bv = Infinity;
  rest.forEach((s, i) => { const v = s.pts[0] + s.pts[1] * 1.5; if (v < bv) { bv = v; bi = i; } });
  let cur = rest.splice(bi, 1)[0];
  out.push(cur);
  while (rest.length) {
    const p = cur.pts, ex = p[p.length - 2], ey = p[p.length - 1];
    let best = 0, bd = Infinity, bflip = false;
    for (let i = 0; i < rest.length; i++) {
      const q = rest[i].pts, n = q.length;
      const d0 = (q[0] - ex) ** 2 + (q[1] - ey) ** 2;
      const d1 = (q[n - 2] - ex) ** 2 + (q[n - 1] - ey) ** 2;
      if (d0 < bd) { bd = d0; best = i; bflip = false; }
      if (d1 < bd) { bd = d1; best = i; bflip = true; }
    }
    cur = rest.splice(best, 1)[0];
    if (bflip) reverse(cur);
    out.push(cur);
  }
  return out;
}

function reverse(s) {
  const p = s.pts, n = p.length, q = new Float32Array(n);
  for (let i = 0; i < n; i += 2) { q[i] = p[n - 2 - i]; q[i + 1] = p[n - 1 - i]; }
  s.pts = q;
  const m = n >> 1;
  for (let i = 1; i < m; i++) s.cum[i] = s.cum[i - 1] + Math.hypot(q[2 * i] - q[2 * i - 2], q[2 * i + 1] - q[2 * i - 1]);
}

function splitPens(list, K) {
  if (!list.length) return [];
  const total = list.reduce((s, o) => s + o.len, 0);
  const pens = [];
  let cur = [], acc = 0;
  for (const o of list) {
    cur.push(o); acc += o.len;
    if (acc >= total / K && pens.length < K - 1) { pens.push(cur); cur = []; acc = 0; }
  }
  if (cur.length) pens.push(cur);
  return pens;
}

// parts in build order, handed to K pens, a big part split between pens
function partPens(list, K, sweep = false) {
  if (!list.length) return [];
  const parts = new Map();
  for (const s of list) { let a = parts.get(s.part); if (!a) parts.set(s.part, (a = [])); a.push(s); }
  const ids = [...parts.keys()].sort((a, b) => a - b);
  const total = list.reduce((s, o) => s + o.len, 0);
  const chunk = total / K;
  const jobs = [];
  for (const id of ids) {
    const seq = order(parts.get(id), sweep);
    const cost = seq.reduce((s, o) => s + o.len, 0);
    if (cost > chunk * 0.9 && seq.length > 6) {
      const n = Math.min(K, Math.ceil(cost / (chunk * 0.6)));
      for (const piece of splitPens(seq, n)) jobs.push(piece);
    } else jobs.push(seq);
  }
  const pens = Array.from({ length: K }, () => ({ load: 0, ops: [] }));
  for (const job of jobs) {
    const cost = job.reduce((s, o) => s + o.len, 0);
    let best = pens[0];
    for (const p of pens) if (p.load < best.load) best = p;
    best.ops.push(...job); best.load += cost;
  }
  return pens.map((p) => p.ops);
}

// ---------------------------------------------------------------- balloons

function placeBalloons(L, d, X, Y) {
  const calls = (d.callouts || []).slice(0, 9);
  if (!calls.length) return [];
  const W = L.W, H = L.H;
  const cs = 4;
  const gw = Math.ceil(W / cs), gh = Math.ceil(H / cs);
  const occ = new Uint8Array(gw * gh);
  const mark = (x, y) => { const i = x / cs | 0, j = y / cs | 0; if (i >= 0 && j >= 0 && i < gw && j < gh) occ[j * gw + i] = 1; };
  for (const s of d.strokes) {
    if (s.pass === 0) continue;
    const p = s.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const x0 = X(p[i]), y0 = Y(p[i + 1]), x1 = X(p[i + 2]), y1 = Y(p[i + 3]);
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2.5));
      for (let t = 0; t <= n; t++) mark(x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n);
    }
  }
  // two masks: the ink closed over small gaps (panels, hatching, between struts), and the
  // same with the vehicle's convex outline filled in. Balloons prefer to stand outside the
  // outline, but may use a big open gap when that keeps the leader much shorter.
  const dil = (src, r, val) => {
    const tmp = new Uint8Array(src.length), out = new Uint8Array(src.length);
    for (let j = 0; j < gh; j++) {
      let c = 0;
      for (let i = -r; i < gw; i++) {
        const a = i + r, b = i - r - 1;
        if (a < gw && src[j * gw + a] === val) c++;
        if (b >= 0 && src[j * gw + b] === val) c--;
        if (i >= 0) tmp[j * gw + i] = c > 0 ? val : 1 - val;
      }
    }
    for (let i = 0; i < gw; i++) {
      let c = 0;
      for (let j = -r; j < gh; j++) {
        const a = j + r, b = j - r - 1;
        if (a < gh && tmp[a * gw + i] === val) c++;
        if (b >= 0 && tmp[b * gw + i] === val) c--;
        if (j >= 0) out[j * gw + i] = c > 0 ? val : 1 - val;
      }
    }
    return out;
  };
  const rc = Math.max(2, Math.round(clamp(Math.min(W, H) * 0.024, 10, 26) / cs));
  const occInk = dil(dil(occ, rc, 1), rc, 0);
  for (let i = 0; i < occ.length; i++) occInk[i] |= occ[i];
  const occHull = occInk.slice();
  let ccx = 0, ccy = 0;
  {
    const pts = [];
    for (const s of d.strokes) {
      if (s.pass < 1 || s.pass > 3) continue;
      const p = s.pts;
      for (let i = 0; i < p.length; i += 2) pts.push([X(p[i]), Y(p[i + 1])]);
    }
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const [x, y] of pts) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    ccx = (bx0 + bx1) / 2; ccy = (by0 + by1) / 2;
    const hull = convexHull(pts);
    if (hull.length > 2) {
      for (let j = 0; j < gh; j++) {
        const yy = j * cs + cs / 2;
        let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < hull.length; k++) {
          const a = hull[k], b = hull[(k + 1) % hull.length];
          if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) {
            const x = a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]);
            lo = Math.min(lo, x); hi = Math.max(hi, x);
          }
        }
        if (lo > hi) continue;
        for (let i = Math.max(0, lo / cs | 0); i <= Math.min(gw - 1, hi / cs | 0); i++) occHull[j * gw + i] = 1;
      }
    }
  }
  const R = L.br;
  const inner = L.inner, m = 6;
  const blocks = [
    { x0: L.pl.x0 - m, y0: plTop(L, calls.length) - m, x1: W, y1: H },
    { x0: L.tb.x0 - m, y0: L.tb.y0 - m, x1: W, y1: H },
    ...L.avoid.map((r) => ({ x0: r.x0 - m, y0: r.y0 - m, x1: r.x1 + m, y1: r.y1 + m })),
  ];
  const free = (x, y, rr, mask) => {
    if (x - rr < inner.x0 + m || x + rr > inner.x1 - m || y - rr < inner.y0 + m || y + rr > inner.y1 - m) return false;
    for (const b of blocks) if (x + rr > b.x0 && x - rr < b.x1 && y + rr > b.y0 && y - rr < b.y1) return false;
    const i0 = Math.max(0, (x - rr) / cs | 0), i1 = Math.min(gw - 1, (x + rr) / cs | 0);
    const j0 = Math.max(0, (y - rr) / cs | 0), j1 = Math.min(gh - 1, (y + rr) / cs | 0);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (!mask[j * gw + i]) continue;
      const qx = i * cs + cs / 2, qy = j * cs + cs / 2;
      if ((qx - x) ** 2 + (qy - y) ** 2 < (rr + cs * 0.7) ** 2) return false;
    }
    return true;
  };
  const pts = calls.map((c) => ({ ...c, ax: X(c.x), ay: Y(c.y) }));
  // clockwise from twelve o'clock
  for (const p of pts) { p.ang = Math.atan2(p.ay - ccy, p.ax - ccx); p.key = (p.ang + Math.PI / 2 + Math.PI * 4) % (Math.PI * 2); }
  pts.sort((a, b) => a.key - b.key);
  const placed = [];
  const crosses = (a, b, c, e) => {
    const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) !== o(a, b, e) && o(c, e, a) !== o(c, e, b);
  };
  const distSeg = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy || 1;
    const t = clamp(((px - ax) * vx + (py - ay) * vy) / l, 0, 1);
    return Math.hypot(px - ax - vx * t, py - ay - vy * t);
  };
  const maxD = Math.hypot(W, H) * 0.5;
  for (const p of pts) {
    let base = Math.atan2(p.ay - ccy, p.ax - ccx);
    if (Math.hypot(p.ay - ccy, p.ax - ccx) < 4) base = -Math.PI / 2;
    let best = null;
    for (const mask of [occHull, occInk]) for (let dd = -180; dd < 180; dd += 15) {
      const a = base + dd * Math.PI / 180;
      const ux = Math.cos(a), uy = Math.sin(a);
      for (let dist = R * 2; dist < maxD; dist += 3) {
        const x = p.ax + ux * dist, y = p.ay + uy * dist;
        if (x < inner.x0 || x > inner.x1 || y < inner.y0 || y > inner.y1) break;
        if (!free(x, y, R + 5, mask)) continue;
        // a little more clearance from the ink, then score
        const extra = R * 1.5;
        const fx = x + ux * extra, fy = y + uy * extra;
        const okExtra = free(fx, fy, R + 5, mask);
        const bx = okExtra ? fx : x, by = okExtra ? fy : y;
        const len = Math.hypot(bx - p.ax, by - p.ay);
        let score = len + Math.abs(dd) * 0.35 + (mask === occInk ? 40 : 0);
        let bad = false;
        for (const q of placed) {
          if (Math.hypot(q.x - bx, q.y - by) < R * 2.6) { bad = true; break; }
          if (crosses({ x: p.ax, y: p.ay }, { x: bx, y: by }, { x: q.ax, y: q.ay }, { x: q.x, y: q.y })) score += 400;
          if (distSeg(q.x, q.y, p.ax, p.ay, bx, by) < R + 3) score += 300;
          if (distSeg(bx, by, q.ax, q.ay, q.x, q.y) < R + 3) score += 300;
        }
        if (!bad && (!best || score < best.score)) best = { x: bx, y: by, score };
        break;
      }
    }
    if (!best) continue;
    const ux = best.x - p.ax, uy = best.y - p.ay, l = Math.hypot(ux, uy) || 1;
    placed.push({ ...p, x: best.x, y: best.y, ux: ux / l, uy: uy / l });
  }
  // untangle: two leaders that cross swap their balloons
  const cross2 = (a, b) => crosses({ x: a.ax, y: a.ay }, { x: a.x, y: a.y }, { x: b.ax, y: b.ay }, { x: b.x, y: b.y });
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      if (!cross2(a, b)) continue;
      const sa = { ...a, x: b.x, y: b.y }, sb = { ...b, x: a.x, y: a.y };
      if (cross2(sa, sb)) continue;
      for (const [o, n] of [[a, sa], [b, sb]]) {
        const ux = n.x - o.ax, uy = n.y - o.ay, l = Math.hypot(ux, uy) || 1;
        o.x = n.x; o.y = n.y; o.ux = ux / l; o.uy = uy / l;
      }
    }
  }
  // number the balloons clockwise from twelve o'clock, by where they stand
  for (const b of placed) b.key2 = (Math.atan2(b.y - ccy, b.x - ccx) + Math.PI / 2 + Math.PI * 4) % (Math.PI * 2);
  placed.sort((a, b) => a.key2 - b.key2);
  placed.forEach((b, i) => { b.item = i + 1; });
  return placed;
}

function convexHull(P) {
  if (P.length < 3) return P;
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

// ---------------------------------------------------------------- the plate

export class Plate {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.ops = [];
  }
  setup(L, dpr, paperCanvas) {
    this.L = L; this.dpr = dpr; this.paperCanvas = paperCanvas;
    const c = this.c;
    const w = Math.round(L.W * dpr), h = Math.round(L.H * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    c.style.width = L.W + 'px'; c.style.height = L.H + 'px';
  }
  load(sheet) {
    this.sheet = sheet;
    this.ops = sheet ? sheet.ops : [];
    this.reset();
  }
  reset() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.paperCanvas) g.drawImage(this.paperCanvas, 0, 0);
    for (const o of this.ops) { o.done = 0; o.i = 0; }
    this.next = 0; this.active = []; this.T = 0;
  }
  // draw everything up to draw fraction T (0..1), only what is new since the last call
  advance(T) {
    if (T < this.T) this.reset();
    this.T = T;
    const ops = this.ops, active = this.active;
    while (this.next < ops.length && ops[this.next].t0 <= T) active.push(ops[this.next++]);
    if (!active.length) return 0;
    const g = this.g;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const groups = new Map();
    let keep = 0, drawn = 0;
    for (let a = 0; a < active.length; a++) {
      const o = active[a];
      const target = T >= o.t1 ? o.len : o.len * (T - o.t0) / (o.t1 - o.t0);
      if (target > o.done) {
        if (o.dash) {
          g.lineWidth = o.lw; g.strokeStyle = o.col; g.setLineDash(o.dash); g.lineDashOffset = o.done;
          g.beginPath(); piece(g, o, o.done, target); g.stroke();
          g.setLineDash([]);
        } else {
          const key = o.lw + o.col;
          let grp = groups.get(key);
          if (!grp) groups.set(key, (grp = []));
          grp.push(o, o.done, target);
        }
        o.done = target;
        drawn++;
      }
      if (o.done < o.len - 1e-6) active[keep++] = o;
    }
    active.length = keep;
    for (const grp of groups.values()) {
      g.lineWidth = grp[0].lw; g.strokeStyle = grp[0].col;
      g.beginPath();
      for (let i = 0; i < grp.length; i += 3) piece(g, grp[i], grp[i + 1], grp[i + 2]);
      g.stroke();
    }
    return drawn;
  }
  get finished() { return this.next >= this.ops.length && !this.active.length; }
}

// the part of stroke o from length s0 to s1, as a subpath
function piece(g, o, s0, s1) {
  const p = o.pts, c = o.cum, n = c.length;
  if (n < 2) return;
  let i = o.i;
  while (i < n - 2 && c[i + 1] < s0) i++;
  const at = (j, s) => {
    const l = c[j + 1] - c[j];
    const t = l > 0 ? (s - c[j]) / l : 0;
    return [p[2 * j] + (p[2 * j + 2] - p[2 * j]) * t, p[2 * j + 1] + (p[2 * j + 3] - p[2 * j + 1]) * t];
  };
  let q = at(i, s0);
  g.moveTo(q[0], q[1]);
  while (i < n - 2 && c[i + 1] <= s1) { i++; g.lineTo(p[2 * i], p[2 * i + 1]); }
  q = at(i, Math.min(s1, c[n - 1]));
  g.lineTo(q[0], q[1]);
  o.i = i;
}

// the finished sheet at any scale, for Save PNG
export function still(L, sheet, scale = 2) {
  const c = paper(L, scale);
  const g = c.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const plain = sheet.ops.filter((o) => !o.dash);
  strokeAll(g, plain);
  for (const o of sheet.ops) if (o.dash) strokeAll(g, [o]);
  return c;
}
