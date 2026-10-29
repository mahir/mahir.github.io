// The four beats, as camera poses over time: the chart, flat and far away through a very long lens; the tip forward
// into a view of the whole range while the land rises; a flight along the year; and a rest on the whole range.
// A pose is { pos: [x, y, z], target: [x, y, z], fov } with fov the vertical angle in degrees.

import { FLOOR } from './scale.js';

export const T = { tip: 2.2, flight: 6.4, alongStart: 8.8, alongEnd: 21.6, rest: 24.2 };
export const DRAW = [0.25, 2.0]; // the line draws itself between these seconds

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const len = (a) => Math.hypot(...a);
const norm = (a) => { const l = len(a) || 1; return a.map((v) => v / l); };
const rad = (d) => (d * Math.PI) / 180;

// How tall the opening chart stands: a chart's proportions, whatever the real relief.
export function chartStretch(scale, aspect) {
  return Math.max(1, ((aspect < 1 ? 0.55 : 0.32) * scale.L) / Math.max(scale.relief, 1));
}

// Progress of everything that isn't the camera, at time t.
export function beats(t) {
  const tip = (t - T.tip) / (T.flight - T.tip);
  return {
    draw: smooth((t - DRAW[0]) / (DRAW[1] - DRAW[0])),
    stretch: 1 - smooth(tip / 0.85), // 1 = the chart's stretch, 0 = real scale
    rise: smooth((tip - 0.12) / 0.78),
    day: smooth((tip - 0.05) / 0.8), // night sky to the day's weather
    line: 1 - smooth((t - T.flight + 1.2) / 2.2),
    labels: smooth((t - T.rest + 0.8) / 1.2),
  };
}

function orbit(target, yaw, pitch, dist) {
  const y = rad(yaw), p = rad(pitch);
  return [target[0] + Math.sin(y) * Math.cos(p) * dist, target[1] + Math.sin(p) * dist, target[2] + Math.cos(y) * Math.cos(p) * dist];
}

// distance at which a width w, square to the view, fills the frame
const fitDistance = (w, fov, aspect) => w / 2 / (aspect * Math.tan(rad(fov) / 2));

// Where a world point lands on screen for a pose: normalized device coordinates, x and y in [-1, 1] when in view.
export function project(pose, aspect, p) {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = norm(sub(pose.target, pose.pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(p, pose.pos);
  const depth = dot(d, f);
  const t = Math.tan(rad(pose.fov) / 2);
  return { x: dot(d, r) / depth / (t * aspect), y: dot(d, u) / depth / t, depth };
}

// The nearest orbit distance at which every point sits inside the frame with a margin.
function fit(target, yaw, pitch, fov, aspect, points, L, margin = [0.9, 0.8]) {
  const inside = (dist) => {
    const pose = { pos: orbit(target, yaw, pitch, dist), target, fov };
    return points.every((p) => { const s = project(pose, aspect, p); return s.depth > 0 && Math.abs(s.x) < margin[0] && Math.abs(s.y) < margin[1]; });
  };
  let lo = 0.15 * L, hi = 8 * L;
  if (!inside(hi)) return { pos: orbit(target, yaw, pitch, hi), target, fov };
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (inside(mid)) hi = mid; else lo = mid; }
  return { pos: orbit(target, yaw, pitch, hi), target, fov };
}

// Under a heavy deck (overcast, storm) the camera stays below it; under scattered cloud it keeps out of the layer,
// above or below, since a camera inside it would see it edge on.
export function makePath({ scale, crest, aspect, cloudBase, ceiling = false, ground = () => FLOOR }) {
  const { L, relief } = scale;
  const stretch = chartStretch(scale, aspect);
  const portrait = aspect < 1;

  const clear = (pose) => {
    let y = pose.pos[1];
    if (ceiling) y = Math.min(y, cloudBase - 220);
    else if (y > cloudBase - 220 && y < cloudBase + 320) y = y < cloudBase + 50 ? cloudBase - 220 : cloudBase + 320;
    y = Math.max(y, ground(pose.pos[0], pose.pos[2]) + 160);
    return { ...pose, pos: [pose.pos[0], y, pose.pos[2]] };
  };

  // 1. The chart: square on, from so far away that it looks flat.
  const chartFov = 1.4;
  const chartH = relief * stretch;
  const chartTarget = [L / 2, FLOOR + chartH * 0.5 - chartH * 0.12, 0];
  const chartDist = Math.max(fitDistance(L * (portrait ? 1.12 : 1.2), chartFov, aspect), (chartH * 1.5) / 2 / Math.tan(rad(chartFov) / 2));
  const chart = { pos: [L / 2, chartTarget[1], chartDist], target: chartTarget, fov: chartFov };

  // the crest, sampled, for framing the whole range
  const ridge = [];
  for (let i = 0; i <= 50; i++) { const x = (i / 50) * L; ridge.push([x, crest(x), 0]); }

  // 2. The whole range, from above and in front.
  const wideTarget = [L / 2, FLOOR + relief * 0.35, -0.08 * L];
  const wide = clear(portrait
    ? fit(wideTarget, 40, 9, 50, aspect, ridge, L)
    : fit(wideTarget, -6, 8, 40, aspect, ridge, L));

  // 3. Along the year, a little below the local peaks so the crest stands against the sky.
  const along = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = lerp(-0.03 * L, 1.03 * L, i / (n - 1));
    let peak = FLOOR;
    for (let s = -0.05; s <= 0.12; s += 0.01) peak = Math.max(peak, crest(clamp(x + s * L, 0, L)));
    const camX = x - 0.03 * L, camZ = 0.13 * L;
    along.push(clear({
      pos: [camX, Math.max(FLOOR + 220, FLOOR + 0.85 * (peak - FLOOR)), camZ],
      target: [x + 0.14 * L, FLOOR + 0.78 * (peak - FLOOR), -0.03 * L],
      fov: portrait ? 64 : 48,
    }));
  }

  // 4. The rest: the whole range again, from about the height of its peaks so the crest stands against the sky,
  // turned toward today's end so it is nearest and the year recedes into the haze.
  const restTarget = [0.55 * L, FLOOR + relief * 0.62, -0.05 * L];
  const rest = clear(portrait
    ? fit(restTarget, 60, 0.5, 52, aspect, ridge, L)
    : fit(restTarget, 34, -0.3, 38, aspect, ridge, L));

  // the flight's keys and their times
  const keys = [wide, ...along, rest];
  const times = [T.flight, ...along.map((_, i) => lerp(T.alongStart, T.alongEnd, i / (n - 1))), T.rest];

  function spline(field, t) {
    let k = 0;
    while (k < times.length - 2 && t > times[k + 1]) k++;
    const u = clamp((t - times[k]) / (times[k + 1] - times[k]), 0, 1);
    // ease into the first key and out of the last
    const e = k === 0 || k === times.length - 2 ? smooth(u) : u;
    const p0 = keys[Math.max(0, k - 1)][field], p1 = keys[k][field], p2 = keys[k + 1][field], p3 = keys[Math.min(keys.length - 1, k + 2)][field];
    const e2 = e * e, e3 = e2 * e;
    return p1.map((_, i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * e + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * e2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * e3));
  }

  function at(t) {
    if (t < T.tip) return chart;
    if (t < T.flight) return blend(chart, wide, smooth((t - T.tip) / (T.flight - T.tip)));
    if (t < T.rest) {
      let k = 0;
      while (k < times.length - 2 && t > times[k + 1]) k++;
      const u = clamp((t - times[k]) / (times[k + 1] - times[k]), 0, 1);
      const pos = spline('pos', t);
      pos[1] = Math.max(pos[1], ground(pos[0], pos[2]) + 160); // between keys the curve can swing low
      return { pos, target: spline('target', t), fov: lerp(keys[k].fov, keys[k + 1].fov, smooth(u)) };
    }
    return drift(rest, t - T.rest, L);
  }

  return { at, chart, wide, along, rest, stretch };
}

// From one pose to another as a dolly zoom: direction and target glide, distance and lens change in log space,
// so the long-lens chart opens into a wide view without a jump.
export function blend(a, b, u) {
  const target = lerp3(a.target, b.target, u);
  const da = sub(a.pos, a.target), db = sub(b.pos, b.target);
  const dir = norm(lerp3(norm(da), norm(db), u));
  const dist = Math.exp(lerp(Math.log(len(da)), Math.log(len(db)), u));
  const fov = (2 * Math.atan(Math.exp(lerp(Math.log(Math.tan(rad(a.fov) / 2)), Math.log(Math.tan(rad(b.fov) / 2)), u))) * 180) / Math.PI;
  return { pos: target.map((v, i) => v + dir[i] * dist), target, fov };
}

// a slow, small sway at rest
function drift(pose, s, L) {
  const w = smooth(s / 4);
  return { ...pose, pos: [pose.pos[0] + Math.sin(s * 0.07) * 0.012 * L * w, pose.pos[1] + Math.sin(s * 0.05) * 0.003 * L * w, pose.pos[2]] };
}
