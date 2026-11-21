// From a forecast of the air over a town to a plan for growing one snow crystal.
//
// What is real: the temperature and humidity at each height, from Open-Meteo. What is
// worked out here: how much vapor each layer has to spare over ice, which kind of crystal
// that layer grows (Nakaya's diagram), and the two numbers handed to Reiter's automaton
// for it. No DOM in here.
(function (root) {
  'use strict';

  // Pressure levels asked for, in hPa, and the fields at each.
  const LEVELS = [1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300];

  // Saturation vapor pressure in hPa over water and over ice, t in °C
  // (Magnus forms, Alduchov and Eskridge 1996).
  const overWater = (t) => 6.1094 * Math.exp(17.625 * t / (t + 243.04));
  const overIce = (t) => 6.1121 * Math.exp(22.587 * t / (t + 273.86));
  // Vapor density in g/m³ for a vapor pressure in hPa.
  const density = (e, t) => e * 100 / (461.5 * (t + 273.15)) * 1000;

  // A forecast gives one humidity for a box of air kilometers wide, cloud and gaps
  // together. The page counts a layer as cloud from this share of ice saturation, and as
  // full cloud at water saturation, where droplets and ice share the air.
  const CLOUD = 85;

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // How readily a crystal widens at this temperature, 0 to 1. Plates and stars grow
  // sideways; columns and needles grow tall, which a flat picture shows as hardly any
  // growth at all. Boundaries at -3, -8 and -22 °C, blended over a degree or two.
  function widens(t) {
    if (t >= 0) return 0;
    const warmPlate = smooth(-3.6, -2.4, t);              // 1 above -3, 0 below
    const plate = smooth(7.2, 8.8, -t) * (1 - smooth(21, 23, -t));
    const cold = smooth(21, 23, -t);
    const column = 1 - warmPlate - plate - cold;
    return clamp(warmPlate * 1 + plate * 1 + column * 0 + cold * 0.3, 0, 1);
  }

  // One layer of air: everything the page says and uses about it.
  function layer(t, rh) {
    const out = { t, rh, rhi: 0, wet: 0, spare: 0, widens: 0, ornate: 0, kind: 'dry' };
    if (t >= 0) { out.kind = 'melt'; out.rhi = rh; return out; }
    const full = 100 * overWater(t) / overIce(t);          // ice-relative humidity at water saturation
    out.rhi = rh * overWater(t) / overIce(t);
    out.wet = clamp((out.rhi - CLOUD) / (full - CLOUD), 0, 1);
    out.spare = out.wet * density(overWater(t) - overIce(t), t); // g/m³, the height on Nakaya's diagram
    out.widens = widens(t);
    if (out.wet <= 0) { out.kind = 'dry'; return out; }
    const star = Math.exp(-Math.pow((t + 15) / 4.5, 2));   // branching peaks near -15 °C
    if (t > -3) { out.ornate = 0.3 + out.wet * 0.2; out.kind = 'thin'; }
    else if (t > -8) { out.ornate = 0; out.kind = 'column'; }
    else if (t > -22) {
      out.ornate = out.wet * (0.3 + 0.7 * star);
      out.kind = out.ornate > 0.62 ? 'star' : out.ornate > 0.3 ? 'sector' : 'plate';
    } else { out.ornate = 0; out.kind = 'cold'; }
    return out;
  }

  // The automaton's two numbers for a layer. Far air near 1 freezes onto every edge alike
  // and makes a plate; thinner far air reaches the tips first and makes arms, then ferns.
  // In the coldest air, where a real crystal is a thick plate, the picture gets an even
  // coat (`solid`). `ornate` runs from 0, a solid plate, to 1, a fern.
  function numbers(ornate, solid) {
    if (solid) return { beta: 0.95, gamma: 0.05 };
    const m = clamp(ornate, 0, 1);
    const P = [[0, 0.93, 0.06], [0.15, 0.9, 0.03], [0.3, 0.8, 0.003], [0.6, 0.62, 0.001], [1, 0.42, 0.0005]];
    let k = 0; while (k < P.length - 2 && m > P[k + 1][0]) k++;
    const f = (m - P[k][0]) / (P[k + 1][0] - P[k][0]);
    return {
      beta: P[k][1] + (P[k + 1][1] - P[k][1]) * f,
      gamma: Math.exp(Math.log(P[k][2]) + (Math.log(P[k + 1][2]) - Math.log(P[k][2])) * f),
    };
  }

  // Open-Meteo's answer for one town -> { ground, points } sorted from the top down.
  function sounding(answer) {
    const h = answer.hourly, c = answer.current, ground = answer.elevation;
    const points = [];
    for (const p of LEVELS) {
      const z = h['geopotential_height_' + p + 'hPa'][0], t = h['temperature_' + p + 'hPa'][0], rh = h['relative_humidity_' + p + 'hPa'][0];
      if (z == null || t == null || rh == null || z < ground + 40) continue;
      points.push({ z, t, rh, hPa: p });
    }
    points.sort((a, b) => b.z - a.z);
    points.push({ z: ground, t: c.temperature_2m, rh: c.relative_humidity_2m, ground: true });
    return { ground, points, time: c.time, code: c.weather_code, snowfall: c.snowfall, zone: answer.timezone_abbreviation };
  }

  // Temperature and humidity at any height, straight lines between the levels.
  function at(points, z) {
    if (z >= points[0].z) return { t: points[0].t, rh: points[0].rh };
    for (let i = 1; i < points.length; i++) {
      if (z >= points[i].z) {
        const a = points[i - 1], b = points[i], f = (z - b.z) / (a.z - b.z || 1);
        return { t: b.t + (a.t - b.t) * f, rh: b.rh + (a.rh - b.rh) * f };
      }
    }
    const g = points[points.length - 1];
    return { t: g.t, rh: g.rh };
  }

  const SLICES = 480;     // steps of the fall
  const REACH = 0.5;      // cells of radius per meter fallen, per g/m³ to spare, where a crystal widens freely
  const MOST = 168;       // the widest crystal the grid can hold, in cells
  const EASE = 110;       // large crystals are eased toward that limit: radius = MOST * tanh(raw / EASE)

  // The fall: where it starts, and what each slice of the way down gives the crystal.
  function plan(snd) {
    const pts = snd.points, top0 = pts[0].z, ground = snd.ground;
    let top = null;
    for (let z = top0; z > ground; z -= 25) { const a = at(pts, z); const L = layer(a.t, a.rh); if (L.wet > 0 && L.widens > 0) { top = z; break; } }
    // start a little above the highest air that can grow a crystal; with none, show 6 km of it anyway
    top = top === null ? Math.min(top0, ground + 6000) : Math.min(top0, top + 150);
    const dz = (top - ground) / SLICES, slices = [];
    let raw = 0, tall = 0;
    for (let i = 0; i < SLICES; i++) {
      const z = top - (i + 0.5) * dz, a = at(pts, z), L = layer(a.t, a.rh), n = numbers(L.ornate, L.kind === 'column' || L.kind === 'cold');
      const grow = L.spare * L.widens * dz * REACH;
      // what a flat picture cannot show as width, it keeps as thickness
      tall += L.spare * (a.t < 0 ? 1 - L.widens : 0) * dz;
      raw += grow;
      slices.push(Object.assign(L, { z, p: (i + 0.5) / SLICES, beta: n.beta, gamma: n.gamma, grow, tall }));
    }
    const k = raw > 0 ? MOST * Math.tanh(raw / EASE) / raw : 1;
    let r = 0;
    for (const s of slices) { s.grow *= k; r += s.grow; s.radius = r; }
    return { empty: r < 2, top, ground, dz, slices, reach: r, tall, at: (p) => slices[Math.max(0, Math.min(SLICES - 1, Math.floor(p * SLICES)))] };
  }

  // Grow the crystal the plan describes. `Reiter` is reiter.js. Returns the wedge arrays;
  // born[i] is how far down the fall (0 to 1) the cell froze, -1 if it never did.
  function grow(Reiter, grid, pl, progress) {
    const first = pl.slices.find((s) => s.grow > 0);
    const c = Reiter.Crystal(grid, first ? first.beta : 0.5);
    for (let i = 0; i < pl.slices.length; i++) {
      const s = pl.slices[i];
      if (s.grow > 0) {
        c.air(s.beta);
        const want = Math.min(grid.R - 8, 1 + s.radius);
        let guard = 0;
        const most = 60 + Math.ceil(s.grow * 90);
        while (c.tip < want && guard < most) { c.step(1, s.gamma, s.p); guard++; }
      }
      if (progress && i % 40 === 0) progress(i / pl.slices.length);
    }
    return { s: c.s, ice: c.ice, born: c.born, tip: c.tip, count: c.count, steps: c.steps };
  }

  const api = { LEVELS, CLOUD, SLICES, MOST, overWater, overIce, density, layer, numbers, sounding, at, plan, grow, widens };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sky = api;
})(typeof self !== 'undefined' ? self : this);
