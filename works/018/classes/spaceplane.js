// classes/spaceplane.js: winged and other returning vehicles on the ground. A delta or
// lifting-body glider on its undercarriage; a small glider riding on top of a big carrier
// plane; a wedge craft on a rocket sled on its rail; a capsule on landing skids under a
// rogallo wing or with a parachute pack; a lenticular craft on three legs. Ground
// equipment from a pool: boarding stairs, a tow tractor, a fuel bowser, a power cart.

import * as K from '../kit.js';
import * as SP from './parts-space.js';
import { D2R } from '../geom.js';
import { word, thou } from '../words.js';

export default {
  id: 'spaceplane',
  family: 'space',
  weight: 1,
  build(M) {
    const kind = M.wpick([[3, 'gear'], [2, 'carrier'], [1.6, 'sled'], [1.5, 'capsule'], [1.4, 'saucer']]);
    const des = SP.designationOf(M);
    const unit = String(M.ri(1, 39)).padStart(2, '0');
    const job = M.pick(['MAIL', 'CREW FERRY', 'INSPECTOR', 'RESCUE', 'COURIER']);
    const place = M.pick(['ORBITAL', 'SUBORBITAL', 'POLAR', 'LUNAR', 'HIGH-ALTITUDE', 'DESERT']);
    const crew = job === 'MAIL' ? M.ri(1, 2) : job === 'CREW FERRY' ? M.ri(4, 8) : M.ri(2, 3);
    const eqPool = M.shuffle(['stairs', 'tractor', 'bowser', 'cart']);
    const nEq = M.wpick([[2, 1], [2, 2], [1, 0]]);
    const draws = Array.from({ length: 8 }, () => M.rng());
    const ctx = { des, unit, job, crew, draws, eq: eqPool.slice(0, nEq) };
    let v;
    if (kind === 'gear') v = onGear(M, ctx);
    else if (kind === 'carrier') v = carrier(M, ctx);
    else if (kind === 'sled') v = sled(M, ctx);
    else if (kind === 'capsule') v = skidCapsule(M, ctx);
    else v = saucer(M, ctx);
    const mass = Math.max(2, Math.round(v.mass));
    const speed = { gear: 7800, carrier: 7600, sled: 2400, capsule: 7700, saucer: 7900 }[kind];
    const B = {
      MAIL: [`Carries ${v.load} of mail to orbit; it ${v.how}.`, `Carries ${v.load} of mail to orbit and back.`],
      'CREW FERRY': [`Ferries ${word(crew)} crew to orbit; it ${v.how}.`, `Ferries ${word(crew)} crew to orbit and back.`],
      INSPECTOR: [`Looks over satellites in orbit; it ${v.how}.`, `Looks over satellites in orbit and comes home.`],
      RESCUE: [`Fetches stranded crews from orbit; it ${v.how}.`, `Fetches stranded crews from orbit.`],
      COURIER: [`Rushes parts and film to stations; it ${v.how}.`, `Rushes parts and film to stations.`],
    }[job];
    let brief = B.find((s) => s.length <= 78) || B[B.length - 1];
    if (brief.length > 78) brief = brief.slice(0, 77).replace(/ \S*$/, '') + '.';
    let jobW = job === 'CREW FERRY' ? 'CREW' : job;
    let klassForm = v.form;
    if ((place + ' ' + jobW + ' ' + klassForm).length > 34) klassForm = v.formShort || klassForm;
    return {
      place, job: jobW, form: klassForm, designation: des, brief,
      specs: [['MASS', `${thou(mass)} T`], ['CREW', String(crew)], [v.k3 || 'SPAN', v.v3], ['SPEED', `${thou(speed)} M/S`]],
      figure: v.figure,
    };
  },
};

// ------------------------------------------------------------------ helpers

// a callout whose anchor is pulled a little toward the viewer, so a point on a skin or a
// strut is not lost under the face it sits on (its place on paper does not change)
function co(M, label, qty, p, prio, d = 0.3) {
  const e = M.view.e;
  M.callout(label, qty, [p[0] + e[0] * d, p[1] + e[1] * d, p[2] + e[2] * d], prio);
}
// a landing gear leg from a point under the body to a wheel (pair) on the ground
function gearLeg(M, top, rw, o = {}) {
  const x = top[0], y = top[1];
  const twin = o.twin ?? false;
  M.tube([x, y, top[2]], [x, y, rw * 1.1], rw * 0.16, {});
  K.collar(M, [x, y, top[2]], [x, y, rw * 1.1], 0.55, rw * 0.16, { len: rw * 0.6 });
  // torque link and a drag brace back to the body
  M.tube([x, y, rw * 1.6], [x - rw * 0.5, y, rw * 2.0], rw * 0.06, { isect: false });
  M.tube([x, y, (top[2] + rw) * 0.6], [x - (top[2] - rw) * 0.45, y, top[2]], rw * 0.08, {});
  const ws = twin ? [y - rw * 0.42, y + rw * 0.42] : [y];
  for (const yy of ws) M.at(x, yy, rw, () => K.wheel(M, { r: rw, w: rw * 0.55 }));
  if (twin) M.tube([x, y - rw * 0.42, rw], [x, y + rw * 0.42, rw], rw * 0.1, { isect: false });
}

// ground equipment, in a frame with +x pointing at the vehicle; stands on z = 0
function equipment(M, kind, o = {}) {
  if (kind === 'stairs') {
    const h = o.h ?? 3;
    // a stair truck: chassis, wheels, flight of stairs climbing toward +x, a landing
    const L = h * 1.4;
    M.box([-L * 0.2, -0.9, 0.5], [L * 0.9, 0.9, 0.8]);
    for (const x of [0, L * 0.7]) for (const s of [1, -1]) M.at(x, s * 0.9, 0.38, () => K.wheel(M, { r: 0.38, w: 0.22 }));
    M.at(0, 0, 0.8, () => K.stairs(M, { len: L * 0.8, h: h - 0.8, w: 1.0 }));
    SP.deck(M, L * 0.8, -0.6, L * 0.8 + 1.2, 0.6, h, { t: 0.12, rail: ['+y', '-y'] });
    for (const s of [1, -1]) M.tube([L * 0.8 + 0.2, s * 0.5, 0.8], [L * 0.8 + 0.2, s * 0.5, h - 0.12], 0.06, {});
    return 'BOARDING STAIRS';
  }
  if (kind === 'tractor') {
    // small tow tractor with a tow bar toward +x
    SP.panelBox(M, [-1.6, -0.9, 0.35], [0.6, 0.9, 1.3], { cell: 0.7, kinds: ['louver', 'corrugated'] });
    M.box([-1.6, -0.7, 1.3], [-0.6, 0.7, 2.2]);
    for (const x of [-1.2, 0.2]) for (const s of [1, -1]) M.at(x, s * 0.9, 0.38, () => K.wheel(M, { r: 0.38, w: 0.3 }));
    M.tube([0.6, 0, 0.6], [o.reach ?? 3, 0, 0.5], 0.06, {});
    return 'TOW TRACTOR';
  }
  if (kind === 'bowser') {
    // fuel bowser: cab, chassis, a capsule tank, a hose reel
    M.box([-3, -1.1, 0.55], [2.2, 1.1, 0.85]);
    const cab = SP.panelBox(M, [1.2, -1.1, 0.85], [2.6, 1.1, 2.6], { cell: 0.9, kinds: ['xWindow', 'corrugated', 'hatch'] });
    const f = cab.f('+x'); if (f.on) { const g = f.grid(2, 2, { gap: 2.2 }); K.xWindow(f, g[2]); K.xWindow(f, g[3]); K.louver(f, [g[0][0], g[0][1], g[1][2], g[1][3]]); }
    M.at(-1.0, 0, 1.75, () => K.tankCapsule(M, { r: 0.9, len: 3.8 }));
    for (const x of [-2.2, -1.2, 1.8]) for (const s of [1, -1]) M.at(x, s * 1.0, 0.45, () => K.wheel(M, { r: 0.45, w: 0.32 }));
    M.at(-2.8, 0, 1.2, () => K.winch(M, { r: 0.3, w: 0.8, at: [0, 0, 0] }));
    return 'FUEL BOWSER';
  }
  // power cart: a box on four small wheels, cable reel
  SP.panelBox(M, [-1, -0.7, 0.35], [1, 0.7, 1.5], { cell: 0.6, kinds: ['louver', 'hatch', 'corrugated'] });
  for (const x of [-0.7, 0.7]) for (const s of [1, -1]) M.at(x, s * 0.72, 0.25, () => K.wheel(M, { r: 0.25, w: 0.16 }));
  M.tube([1, 0, 0.5], [1.6, 0, 0.5], 0.05, {});
  return 'POWER CART';
}

function place(M, kinds, spots) {
  kinds.forEach((k, i) => {
    const s = spots[i % spots.length];
    M.part('GROUND EQUIPMENT', () => {
      const lab = M.with({ at: [s[0], s[1], 0], rz: s[2] }, () => equipment(M, k, { h: s[3], reach: s[4] }));
      co(M, lab, 1, [s[0], s[1], 0.9], 0.8);
    });
  });
}

// ------------------------------------------------------------------ variant: on its gear
function onGear(M, c) {
  M.setView(M.pick([55, -55, 125, -125]) + M.r(-8, 8), M.r(25, 34));
  const e = M.view.e;
  const lifting = M.chance(0.35);
  const Lg = M.r(14, 30);
  const rf = Lg * (lifting ? M.r(0.11, 0.14) : M.r(0.075, 0.095));
  const flat = lifting ? M.r(0.5, 0.65) : M.r(0.75, 0.9);
  const span = Lg * (lifting ? M.r(0.42, 0.55) : M.r(0.6, 0.8));
  const fins = M.pick(['tip', 'tail', 'both']);
  const bells = M.pick([1, 2, 3]);
  const rw = Math.min(0.6, Lg * 0.022);
  const gh = rf * flat + rw * 2 + Lg * M.r(0.07, 0.1);   // body axis height
  M.part('SPACEPLANE', () => {
    M.at(0, 0, gh, () => SP.glider(M, { len: Lg, span, rf, flat, form: lifting ? 'lifting' : 'delta', fins, bells, reg: c.des }));
    co(M, 'SPACEPLANE', 1, [0, 0, gh + rf * flat], 3);
    co(M, 'GLAZED NOSE', 1, [Lg * 0.3, 0, gh + rf * flat * 0.85], 2.2);
    co(M, 'CARGO BAY DOOR', 2, [-Lg * 0.1, rf * 0.4, gh + rf * flat * 0.92], 1.8);
    co(M, 'HEAT TILES', 1, [Lg * 0.1, (e[1] > 0 ? 1 : -1) * rf * 0.95, gh - rf * flat * 0.3], 1.4);
    co(M, 'MAIN ENGINE', bells, [-Lg * 0.5 - rf * 0.3, 0, gh], 1.6);
    co(M, fins === 'tail' ? 'TAIL FIN' : 'TIP FIN', fins === 'tail' ? 1 : 2, fins === 'tail' ? [-Lg * 0.45, 0, gh + rf + Lg * 0.15] : [-Lg * 0.4, (e[1] > 0 ? 1 : -1) * span / 2, gh + Lg * 0.08], 1.7);
    co(M, 'ELEVON', 2, [-Lg * 0.43, (e[1] > 0 ? 1 : -1) * span * 0.3, gh - rf * flat * 0.45 + Lg * 0.012], 1.0);
  });
  M.info.mass = [-Lg / 2, -span / 2, 0, Lg / 2, span / 2, gh + rf * flat];
  M.info.centers = [[[-Lg * 0.6, 0, gh], [Lg * 0.6, 0, gh]]];
  M.part('LANDING GEAR', () => {
    gearLeg(M, [Lg * 0.28, 0, gh - rf * flat * 0.9], rw * 0.85, { twin: true });
    const ym = Math.max(rf * 1.3, span * 0.2);
    for (const s of [1, -1]) gearLeg(M, [-Lg * 0.2, s * ym, gh - rf * flat * 0.45 - Lg * 0.012], rw, { twin: Lg > 20 });
    co(M, 'MAIN GEAR', 2, [-Lg * 0.2, (e[1] > 0 ? 1 : -1) * (ym + rw * 0.3), rw], 1.9);
    co(M, 'NOSE GEAR', 1, [Lg * 0.28, 0, rw * 2.2], 1.5);
  });
  // equipment around it: stairs at the side hatch, a tractor at the nose
  const sy = e[1] >= 0 ? 1 : -1;
  const spots = [
    [Lg * 0.28, sy * (span * 0.5 + 3), sy > 0 ? -90 : 90, gh + rf * flat * 0.2, 0],
    [Lg * 0.5 + 4.5, 0, 180, 0, 3.6],
    [-Lg * 0.2, -sy * (span * 0.5 + 7), sy > 0 ? 90 : -90, 0, 0],
  ];
  const eq = c.eq.slice();
  if (eq.includes('stairs')) { eq.splice(eq.indexOf('stairs'), 1); eq.unshift('stairs'); }
  place(M, eq, spots.map((s, i) => (eq[i] === 'tractor' ? spots[1] : eq[i] === 'stairs' ? spots[0] : spots[2])));
  return {
    mass: Lg * span * rf * 0.15, load: `${Math.round(Lg * 40)} kg`, how: 'lands on a runway',
    form: lifting ? 'LIFTING BODY' : 'SPACEPLANE', k3: 'SPAN', v3: `${thou(Math.round(span * 1000 / 10) * 10)} MM`,
    figure: [Lg * 0.05, sy * (span * 0.5 + 1.5)],
  };
}

// ------------------------------------------------------------------ variant: on a carrier plane
function carrier(M, c) {
  M.setView(M.pick([55, -55, 125, -125]) + M.r(-8, 8), M.r(24, 32));
  const e = M.view.e;
  const Lc = M.r(36, 52), Rc = Lc * M.r(0.05, 0.065);
  const spanC = Lc * M.r(0.85, 1.1), chord = Lc * M.r(0.13, 0.18);
  const nEng = M.pick([2, 4, 4, 6]);
  const twin = M.chance(0.5);
  const Lg = Lc * M.r(0.32, 0.45), rf = Lg * 0.085, spanG = Lg * 0.68;
  const gForm = M.pick(['delta', 'lifting']);
  const rw = Lc * 0.018;
  const zc = Rc + rw * 2 + Lc * 0.04;                     // fuselage axis height
  const xw = -Lc * 0.04;                                    // wing root center
  M.part('CARRIER AIRCRAFT', () => {
    const prof = [[0, 0], [Rc * 0.35, Lc * 0.02], [Rc * 0.75, Lc * 0.15], [Rc, Lc * 0.32], [Rc, Lc * 0.88], ...SP.ogive(Rc, Lc * 0.12, Lc * 0.88, 6).slice(1)];
    // tail at x = -Lc/2: profile runs nose last, so turn it: lathe along +x from the tail
    const tail = [[Rc * 0.18, 0], [Rc * 0.7, Lc * 0.12], [Rc, Lc * 0.3], [Rc, Lc * 0.86], ...SP.ogive(Rc, Lc * 0.14, Lc * 0.86, 6, 0.02).slice(1)];
    void prof;
    let F;
    M.at(-Lc / 2, 0, zc, () => { F = M.lathe(tail, { axis: 'x', sharpDeg: 25 }); });
    if (M.decorOn) {
      const L = F.lat, tz = (z) => z / Lc;
      const aF = Math.atan2(e[1], -e[2]) / D2R;
      for (let k = 1; k < 14; k++) L.ring(0.2 + 0.6 * k / 14, { w: 0 });
      // a row of cabin windows and the flight deck glazing
      for (let k = 0; k < 18; k++) L.port(aF > 0 ? 125 : 235, tz(Lc * (0.35 + k * 0.025)), Rc * 0.06, { w: 1 });
      for (const a of [180 - 28, 180 - 10, 180 + 10, 180 + 28]) SP.latWindow(M, L, a, tz(Lc * 0.905), Rc * 0.22, Lc * 0.012, L.total);
      L.text(c.unit, aF > 0 ? 110 : 250, tz(Lc * 0.55), Rc * 0.5, { along: true });
      SP.latHatch(M, L, aF > 0 ? 112 : 248, tz(Lc * 0.8), Rc * 0.35, Rc * 0.55);
      L.shade({ gap: 1.7, gapMax: 6 });
    }
    // wing: tapered, swept a little
    const plan = [[xw + chord * 0.5, -Rc * 0.5], [xw + chord * 0.5 - spanC * 0.08, -spanC / 2], [xw + chord * 0.5 - spanC * 0.08 - chord * 0.4, -spanC / 2],
      [xw - chord * 0.5, -Rc * 0.5], [xw - chord * 0.5, Rc * 0.5], [xw + chord * 0.5 - spanC * 0.08 - chord * 0.4, spanC / 2], [xw + chord * 0.5 - spanC * 0.08, spanC / 2], [xw + chord * 0.5, Rc * 0.5]];
    const W = M.extrude(plan, zc - Rc * 0.35, zc - Rc * 0.2, {});
    const wt = W.f('+z');
    if (wt.on) {
      // spar line, flaps and ailerons along the trailing edge, a panel grid
      const xc = (Math.min(xw - chord * 0.5, xw + chord * 0.1 - spanC * 0.08) + xw + chord * 0.5) / 2;
      const sl = (y) => xw - chord * 0.5 + (y - Rc * 0.5) / (spanC / 2 - Rc * 0.5) * (0.6 * chord - 0.08 * spanC) - xc;
      for (const s of [1, -1]) {
        wt.line(-chord * 0.2, s * Rc, -chord * 0.2 - spanC * 0.08, s * spanC * 0.48, { w: 0 });
        const f = chord * 0.22;
        for (const [y0, y1] of [[Rc * 1.2, spanC * 0.3], [spanC * 0.31, spanC * 0.47]]) wt.path([[sl(y0), s * y0], [sl(y0) + f * 0.8, s * y0], [sl(y1) + f * 0.6, s * y1], [sl(y1), s * y1]], { w: 1 });
      }
      const pg = wt.pxOf(chord * 0.3);
      if (pg > 5) { wt.hatch(wt.box, { angle: 90, gap: pg * 1.6, w: 0 }); wt.hatch(wt.box, { angle: 0, gap: pg, w: 0 }); }
      if (wt.tone > 0.2) wt.hatch(wt.box, { angle: 0, gap: 3.6 - 1.4 * wt.tone, w: 0 });
    }
    // engines under the wing on pylons
    const per = nEng / 2;
    for (const s of [1, -1]) for (let k = 0; k < per; k++) {
      const yy = s * (Rc * 1.8 + (spanC * 0.36 - Rc * 1.8) * (per === 1 ? 0.4 : k / (per - 1)));
      const xx = xw + chord * 0.5 - spanC * 0.08 * Math.abs(yy) / (spanC / 2) + chord * 0.15;
      const re = Rc * 0.32;
      M.at(xx - chord * 0.3, yy, zc - Rc * 0.35 - re * 1.4, () => {
        const P = M.lathe([[re * 0.85, 0], [re, chord * 0.15], [re, chord * 0.55], [re * 0.9, chord * 0.75], [re * 0.6, chord * 0.85]], { axis: 'x' });
        if (M.decorOn) { P.lat.ring(0.08, { w: 1 }); P.lat.ring(0.45, { w: 0 }); P.lat.ring(0.7, { w: 1 }); P.lat.hatch(0, 360, 0.0, 0.06, { gap: 1.3 }); P.lat.shade({ gap: 1.6 }); }
        M.ry(90, () => M.cyl(re * 0.8, chord * 0.75, chord * 0.76, { isect: false }));
        M.callout('JET ENGINE', nEng, [chord * 0.35, e[1] * re * 1.05 / Math.hypot(e[1], e[2]), e[2] * re * 1.05 / Math.hypot(e[1], e[2])], 1.6);
        M.box([chord * 0.2, -re * 0.12, re * 0.8], [chord * 0.6, re * 0.12, re * 1.45]);
      });
    }
    // tail: one fin or twin fins on a stabilizer
    const xt = -Lc / 2;
    M.extrude([[xt + Lc * 0.02, -Lc * 0.09], [xt + Lc * 0.12, -Lc * 0.09], [xt + Lc * 0.14, Lc * 0.09], [xt + Lc * 0.03, Lc * 0.09]].map(([x, y]) => [x, y * (twin ? 2.4 : 1.6)]), zc + Rc * 0.1, zc + Rc * 0.2, {});
    const finAt = twin ? [Lc * 0.09 * 2.3, -Lc * 0.09 * 2.3] : [0];
    for (const y of finAt) {
      const S = M.extrude([[xt + Lc * 0.01, zc + Rc * 0.1], [xt + Lc * 0.14, zc + Rc * 0.1], [xt + Lc * 0.06, zc + Rc + Lc * 0.14], [xt - Lc * 0.005, zc + Rc + Lc * 0.14]], y - Rc * 0.06, y + Rc * 0.06, { plane: 'xz' });
      for (const k of ['+y', '-y']) { const f = S.f(k); if (f.on) { f.path(SP.insetPoly(f.poly, f.mOf(3)), { closed: true, w: 1 }); K.stencil(f, c.des, 0, -f.h * 0.05, Lc * 0.018, { upright: true }); } }
    }
    co(M, 'FLIGHT DECK', 1, [Lc * 0.43, 0, zc + Rc * 0.8], 1.3, Rc * 0.3);
    co(M, 'CABIN WINDOW', 18, [Lc * 0.05, (e[1] > 0 ? 1 : -1) * Rc * 0.75, zc + Rc * 0.62], 0.9);
    co(M, 'CARRIER AIRCRAFT', 1, [Lc * 0.1, (e[1] > 0 ? 1 : -1) * Rc * 0.7, zc + Rc * 0.7], 2.4);
    co(M, 'JET ENGINE', nEng, [xw, (e[1] > 0 ? 1 : -1) * Rc * 1.8, zc - Rc * 0.9], 1.6);
    co(M, twin ? 'TWIN TAIL FIN' : 'TAIL FIN', twin ? 2 : 1, [xt + Lc * 0.06, (twin ? Lc * 0.09 * 2.3 * (e[1] > 0 ? 1 : -1) : 0) + (e[1] > 0 ? 1 : -1) * Rc * 0.07, zc + Rc + Lc * 0.07], 1.4);
  });
  M.info.mass = [-Lc / 2, -Rc, zc - Rc, Lc / 2, Rc, zc + Rc];
  M.info.centers = [[[-Lc * 0.55, 0, zc], [Lc * 0.55, 0, zc]]];
  M.part('LANDING GEAR', () => {
    gearLeg(M, [Lc * 0.36, 0, zc - Rc * 0.9], rw * 0.8, { twin: true });
    for (const s of [1, -1]) gearLeg(M, [xw - chord * 0.2, s * Rc * 0.8, zc - Rc * 0.75], rw, { twin: true });
    co(M, 'MAIN GEAR', 2, [xw - chord * 0.2, (e[1] > 0 ? 1 : -1) * Rc * 0.8, rw], 1.2);
  });
  // the glider on top, on three pylons
  const zg = zc + Rc + Lc * 0.035 + rf;
  M.part('PYLON', () => {
    for (const [x, y] of [[Lg * 0.15, 0], [-Lg * 0.25, Rc * 0.45], [-Lg * 0.25, -Rc * 0.45]]) {
      const xx = xw + x;
      M.frustum([[xx - 0.4, y - 0.15], [xx + 0.4, y - 0.15], [xx + 0.4, y + 0.15], [xx - 0.4, y + 0.15]], zc + Rc * 0.9, [[xx - 0.25, y - 0.1], [xx + 0.25, y - 0.1], [xx + 0.25, y + 0.1], [xx - 0.25, y + 0.1]], zg - rf * 0.8, {});
    }
    co(M, 'MATING PYLON', 3, [xw + Lg * 0.15, 0, zc + Rc + Lc * 0.02], 1.4);
  });
  M.part('ORBITER', () => {
    M.at(xw, 0, zg, () => SP.glider(M, { len: Lg, span: spanG, rf, form: gForm, fins: M.pick(['tip', 'tail']), bells: M.pick([2, 3]), reg: c.des.length <= 7 ? c.des : c.unit + '-' + c.des.replace(/[^A-Z0-9]/g, '').slice(-3) }));
    co(M, 'ORBITER', 1, [xw, 0, zg + rf * 0.8], 3);
    co(M, 'ORBITER WING', 2, [xw - Lg * 0.3, (e[1] > 0 ? 1 : -1) * spanG * 0.3, zg - rf * 0.38 + Lg * 0.012], 1.5, 0.1);
  });
  const sy = e[1] >= 0 ? 1 : -1;
  place(M, c.eq.filter((k) => k !== 'stairs'), [[Lc * 0.5 + 4.5, 0, 180, 0, 3.6], [-Lc * 0.15, -sy * (spanC * 0.5 + 4), sy > 0 ? 90 : -90, 0, 0]]);
  return {
    mass: Lc * spanC * Rc * 0.06 + Lg * spanG * rf * 0.15, load: `${Math.round(Lg * 30)} kg`, how: 'starts from the back of a carrier plane',
    form: 'GLIDER ON CARRIER PLANE', formShort: 'GLIDER ON CARRIER', k3: 'CARRIER SPAN', v3: `${thou(Math.round(spanC * 100) * 10)} MM`,
    figure: [Lc * 0.28, sy * (Rc + 3)],
  };
}

// ------------------------------------------------------------------ variant: rocket sled
function sled(M, c) {
  M.setView(M.pick([58, -58, 122, -122]) + M.r(-6, 6), M.r(24, 32));
  const e = M.view.e;
  const Lg = M.r(9, 15), rf = Lg * 0.12, spanG = Lg * M.r(0.45, 0.6), flat = 0.55;
  const g = M.r(2.4, 3.6);                                  // rail gauge
  const Ls = Lg * M.r(1.05, 1.3);                           // sled length
  const nM = M.pick([2, 3, 4]);
  const track = Ls * M.r(2.4, 3.2);
  const berm = M.r(0.6, 1.2);
  const zr = berm + 0.35;                                   // rail top
  const tilt = M.r(4, 9);
  M.part('LAUNCH RAIL', () => {
    const B = M.box([-track * 0.62, -g / 2 - 1.2, 0], [track * 0.38, g / 2 + 1.2, berm]);
    for (const k of ['+y', '-y']) { const f = B.f(k); if (f.on) f.grid(Math.max(2, Math.round(f.w / 3)), 1, { gap: 2 }).forEach((r) => K.frame(f, r)); }
    for (let x = -track * 0.62 + 0.4; x < track * 0.38; x += 1.1) M.box([x, -g / 2 - 0.5, berm], [x + 0.3, g / 2 + 0.5, berm + 0.18], { isect: false });
    for (const s of [1, -1]) M.box([-track * 0.62, s * g / 2 - 0.09, berm + 0.18], [track * 0.38, s * g / 2 + 0.09, zr], { isect: false });
    co(M, 'LAUNCH RAIL', 2, [track * 0.25, (e[1] > 0 ? 1 : -1) * g / 2, zr], 1.8);
    co(M, 'CONCRETE BERM', 1, [track * 0.2, (e[1] > 0 ? 1 : -1) * (g / 2 + 1.2), berm * 0.5], 0.8);
  });
  const hs = 1.1;                                            // sled frame height
  M.part('ROCKET SLED', () => {
    // slippers on the rails, a frame, a cradle, the motors at the back
    for (const s of [1, -1]) for (const x of [-Ls * 0.4, Ls * 0.35]) {
      M.box([x - 0.5, s * g / 2 - 0.22, zr - 0.05], [x + 0.5, s * g / 2 + 0.22, zr + 0.25]);
    }
    const F = M.box([-Ls / 2, -g / 2 - 0.15, zr + 0.25], [Ls / 2, g / 2 + 0.15, zr + hs]);
    for (const k of ['+y', '-y', '+x']) { const f = F.f(k); if (f.on) f.grid(Math.max(2, Math.round(f.w / 1.6)), 1, { gap: 2.2 }).forEach((r, i) => (i % 3 === 1 ? K.accessHatch(f, r) : K.corrugated(f, r))); }
    const top = F.f('+z'); if (top.on) top.grid(Math.max(2, Math.round(top.w / 2)), 2, { gap: 2 }).forEach((r) => K.plain(top, r, { shade: false }));
    // motors: bells pointing back (-x)
    const mr = Math.min(g / 2 * 0.55, 0.7);
    const ys = nM === 2 ? [-mr * 1.15, mr * 1.15] : nM === 3 ? [-mr * 2.1, 0, mr * 2.1] : [-mr * 3.1, -mr * 1.05, mr * 1.05, mr * 3.1];
    for (const y of ys) {
      M.at(-Ls / 2, y * Math.min(1, (g / 2) / (Math.abs(ys[0]) + mr)), zr + 0.25 + (hs - 0.25) / 2, () => {
        M.ry(-90, () => { const S = M.cyl(mr * 0.9, 0, Ls * 0.18); if (M.decorOn) { S.lat.ring(0.5, { w: 1 }); S.lat.shade({ gap: 1.6 }); } });
        M.at(-Ls * 0.18, 0, 0, () => M.ry(90, () => K.bell(M, { r: mr * 0.85, len: mr * 1.5, pump: false })));
      });
    }
    // cradle arms up to the craft
    for (const x of [-Lg * 0.3, Lg * 0.2]) for (const s of [1, -1]) M.tube([x, s * g * 0.35, zr + hs], [x, s * rf * 0.5, zr + hs + 1.0], 0.1, {});
    co(M, 'ROCKET SLED', 1, [0, (e[1] > 0 ? 1 : -1) * (g / 2 + 0.15), zr + hs * 0.6], 2.4);
    co(M, 'SLED MOTOR', nM, [-Ls / 2 - Ls * 0.1, 0, zr + 0.25 + (hs - 0.25) / 2 + mr * 0.9], 1.8);
    co(M, 'RAIL SLIPPER', 4, [Ls * 0.35, (e[1] > 0 ? 1 : -1) * (g / 2 + 0.22), zr + 0.1], 1.0);
  });
  const zg = zr + hs + 1.0 + rf * flat;
  M.part('WEDGE CRAFT', () => {
    M.at(Lg * 0.0, 0, zg, () => M.ry(-tilt, () => SP.glider(M, { len: Lg, span: spanG, rf, flat, form: 'lifting', fins: 'both', bells: M.pick([1, 2]), reg: c.des })));
    co(M, 'WEDGE CRAFT', 1, [0, 0, zg + rf * flat], 3);
    co(M, 'GLAZED NOSE', 1, [Lg * 0.3, 0, zg + rf * flat * 0.8 + Lg * 0.3 * Math.sin(tilt * D2R)], 1.6);
  });
  M.info.mass = [-Ls / 2, -g / 2 - 0.15, zr, Ls / 2, g / 2 + 0.15, zr + hs];
  M.info.centers = [[[-track * 0.62, 0, zr], [track * 0.38, 0, zr]]];
  const sy = e[1] >= 0 ? 1 : -1;
  place(M, c.eq.filter((k) => k === 'cart' || k === 'bowser').slice(0, 1), [[track * 0.2, sy * (g / 2 + 5), sy > 0 ? -90 : 90, 0, 0]]);
  return {
    mass: Lg * spanG * rf * 0.15 + Ls * g * 0.6, load: `${Math.round(Lg * 25)} kg`, how: 'starts from a rocket sled on a rail',
    form: 'SLED-LAUNCHED GLIDER', formShort: 'SLED GLIDER', k3: 'RAIL GAUGE', v3: `${thou(Math.round(g * 100) * 10)} MM`,
    figure: [-Ls * 0.8, sy * (g / 2 + 2.2)],
  };
}

// ------------------------------------------------------------------ variant: capsule on skids
function skidCapsule(M, c) {
  M.setView(M.pick([40, -40, 140, -140]) + M.r(-8, 8), M.r(26, 34));
  const e = M.view.e;
  const r = M.r(1.6, 2.6);
  const rogallo = M.chance(0.6);
  const nSk = M.pick([3, 4]);
  const zs = r * 0.55;                                      // heat shield above the ground
  let h = 0;
  const aView = Math.atan2(e[1], e[0]) / D2R;
  M.part('CAPSULE', () => {
    h = M.at(0, 0, zs, () => SP.capsule(M, { r, aFace: aView }));
    co(M, 'HEAT SHIELD', 1, [Math.cos(aView * D2R) * r * 0.99, Math.sin(aView * D2R) * r * 0.99, zs - 0.02], 1.5);
    co(M, 'CREW HATCH', 1, [Math.cos(aView * D2R) * r * 0.82, Math.sin(aView * D2R) * r * 0.82, zs + h * 0.0 + r * 0.42], 1.3, r * 0.15);
    co(M, 'CREW CAPSULE', 1, [Math.cos(aView * D2R) * r * 0.7, Math.sin(aView * D2R) * r * 0.7, zs + r * 0.5], 3);
    for (let k = 0; k < 3; k++) {
      const a = (aView + 60 + k * 120) * D2R;
      M.at(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, zs + r * 0.32, () => M.rz(a / D2R, () => M.ry(-38, () => SP.rcsQuad(M, { s: r * 0.16 }))));
    }
    co(M, 'THRUSTER QUAD', 3, [Math.cos((aView + 60) * D2R) * r * 0.9, Math.sin((aView + 60) * D2R) * r * 0.9, zs + r * 0.32], 1.0);
  });
  M.part('LANDING SKID', () => {
    for (let k = 0; k < nSk; k++) {
      const a = (aView + 45 + k * 360 / nSk) * D2R, ca = Math.cos(a), sa = Math.sin(a);
      const R0 = r * 0.6, R1 = r * 1.05;
      const foot = [ca * R1, sa * R1, 0.12];
      K.strut(M, [ca * R0, sa * R0, zs - r * 0.08], foot, r * 0.045, {});
      K.strut(M, [ca * r * 0.95, sa * r * 0.95, zs + 0.02], [ca * R1, sa * R1, 0.4], r * 0.03, { collars: false });
      // the ski, tangent to the circle
      M.with({ at: [foot[0], foot[1], 0], rz: a / D2R + 90 }, () => {
        M.box([-r * 0.45, -r * 0.07, 0], [r * 0.45, r * 0.07, 0.08]);
        M.extrude([[r * 0.45, 0], [r * 0.6, 0.18], [r * 0.6, 0.24], [r * 0.45, 0.08]], -r * 0.07, r * 0.07, { plane: 'xz' });
      });
    }
    co(M, 'LANDING SKID', nSk, [Math.cos((aView + 45) * D2R) * r * 1.05, Math.sin((aView + 45) * D2R) * r * 1.05, 0.06], 2.0);
  });
  const zTop = zs + h;
  let yawW = 0;
  if (rogallo) {
    M.part('ROGALLO WING', () => {
      // a flexible delta wing held up by inflated booms, rigged to the capsule's nose
      const Lk = r * M.r(3.4, 4.4), hw = zTop + Lk * 0.85;
      const yaw = aView + 90 + M.r(-20, 20);
      yawW = yaw;
      M.with({ at: [0, 0, hw], rz: yaw }, () => {
        const nose = [Lk * 0.55, 0, 0.3], tail = [-Lk * 0.45, 0, 0], sweep = 50 * D2R;
        const tips = [1, -1].map((s) => [nose[0] - Math.cos(sweep) * Lk, s * Math.sin(sweep) * Lk, -Lk * 0.08]);
        M.pipe([tips[0], nose, tips[1]], r * 0.09, { isect: false });
        M.tube(nose, tail, r * 0.09, { isect: false });
        // membrane: one sheet per lobe, with battens and a billow line drawn on it
        for (const t of tips) {
          M.plate([nose, t, tail], { isect: false });
          for (let i = 1; i < 5; i++) { const u = i / 5; M.line([nose, [t[0] + (tail[0] - t[0]) * u, t[1] + (tail[1] - t[1]) * u, t[2] + (tail[2] - t[2]) * u]], { w: 0, pass: 2 }); }
        }
        // rigging lines down to the capsule's nose
        for (const t of tips) M.callout('ROGALLO WING', 1, [(nose[0] + t[0] + tail[0]) / 3, (nose[1] + t[1] + tail[1]) / 3, (nose[2] + t[2] + tail[2]) / 3 + 0.12], 2.6);
        M.callout('INFLATED BOOM', 3, [nose[0] * 0.5 + tips[0][0] * 0.5, tips[0][1] * 0.5, (nose[2] + tips[0][2]) / 2 + r * 0.1], 1.0);
        M.callout('RIGGING LINE', 5, [nose[0] * 0.5, 0, -(hw - zTop) * 0.5 + 0.15], 0.8);
        for (const p of [nose, tail, tips[0], tips[1], [0, 0, 0]]) M.line([p, [0, 0, -(hw - zTop)]], { w: 1, pass: 2 });
      });
      co(M, 'ROGALLO WING', 1, [0, 0, hw + 0.2], 2.6, 0.1);
      co(M, 'INFLATED BOOM', 3, [Math.cos(yawW * D2R) * Lk * 0.3, Math.sin(yawW * D2R) * Lk * 0.3, hw + 0.25], 1.0, r * 0.1);
    });
  } else {
    M.part('PARACHUTE PACK', () => {
      const rp = r * 0.3, lp = r * 0.45;
      const S = M.cyl(rp, zTop, zTop + lp);
      if (M.decorOn) { S.lat.ring(0.3, { w: 1 }); S.lat.ring(0.7, { w: 1 }); for (let k = 0; k < 6; k++) S.lat.meridian(k * 60, 0, 1, { w: 1 }); S.lat.shade({ gap: 1.6 }); }
      M.cone(rp, rp * 0.8, zTop + lp, zTop + lp + rp * 0.3);
      co(M, 'PARACHUTE PACK', 1, [Math.cos(aView * D2R) * rp, Math.sin(aView * D2R) * rp, zTop + lp * 0.5], 2.4);
      // a drogue mortar and a flotation bag
      M.at(rp * 0.4, -rp * 0.4, zTop + lp + rp * 0.3, () => M.cyl(rp * 0.25, 0, rp * 0.5));
    });
  }
  M.info.mass = [-r, -r, 0, r, r, zTop];
  const sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;
  place(M, c.eq.filter((k) => k !== 'stairs').slice(0, 1), [[sx * (r + 7), -sy * (r + 3), sx > 0 ? 180 : 0, 0, 3]]);
  return {
    mass: r * r * r * 0.8, load: `${Math.round(r * 120)} kg`, how: rogallo ? 'lands on skids under a rogallo wing' : 'lands on skids under a parachute',
    form: rogallo ? 'CAPSULE UNDER ROGALLO WING' : 'SKID CAPSULE', formShort: rogallo ? 'ROGALLO CAPSULE' : 'SKID CAPSULE', k3: 'DIAMETER', v3: `${thou(Math.round(r * 200) * 10)} MM`,
    figure: [sx * (r + 2.2), sy * (r + 1.2)],
  };
}

// ------------------------------------------------------------------ variant: lenticular craft
function saucer(M, c) {
  M.setView(M.pick([45, -45, 135, -135]) + M.r(-10, 10), M.r(26, 34));
  const e = M.view.e;
  const R = M.r(5, 9), h1 = R * M.r(0.16, 0.24), h2 = R * M.r(0.2, 0.3);
  const nLeg = 3;
  const zr = R * M.r(0.42, 0.55);                           // rim height
  const ramp = M.chance(0.7);
  const aView = Math.atan2(e[1], e[0]) / D2R;
  let body;
  M.part('LENTICULAR HULL', () => {
    const prof = [[0, zr - h1], [R * 0.3, zr - h1 * 0.92], [R * 0.6, zr - h1 * 0.66], [R * 0.85, zr - h1 * 0.3], [R, zr],
      [R * 0.85, zr + h2 * 0.3], [R * 0.6, zr + h2 * 0.68], [R * 0.32, zr + h2], [R * 0.3, zr + h2]];
    body = M.lathe(prof, { sharpDeg: 28 });
    if (M.decorOn) {
      const L = body.lat;
      for (let k = 0; k < 24; k++) L.meridian(k * 15, 0.02, 0.98, { w: k % 3 ? 0 : 1 });
      for (const t of [0.25, 0.42, 0.58, 0.75, 0.9]) L.ring(t, { w: 0 });
      L.ring(0.5, { w: 1 });
      L.ring(0.47, { w: 1 }); L.hatch(0, 360, 0.47, 0.5, { gap: 1.3 });
      for (let k = 0; k < 24; k++) L.port(k * 15 + 7.5, 0.56, R * 0.022, { w: 1 });
      L.text(c.des, aView, 0.68, R * 0.07, {});
      SP.latHatch(M, L, aView + 30, 0.4, R * 0.12, R * 0.08);
      L.shade({ gap: 1.7, gapMax: 6 });
    }
    co(M, 'LENTICULAR HULL', 1, [Math.cos(aView * D2R) * R * 0.7, Math.sin(aView * D2R) * R * 0.7, zr + h2 * 0.5], 3);
    co(M, 'VIEW PORT', 24, [Math.cos((aView + 7.5) * D2R) * R * 0.9, Math.sin((aView + 7.5) * D2R) * R * 0.9, zr + h2 * 0.17], 1.2);
    // rim RCS quads
    for (let k = 0; k < 4; k++) M.at(Math.cos((aView + 45 + k * 90) * D2R) * R * 0.99, Math.sin((aView + 45 + k * 90) * D2R) * R * 0.99, zr, () => M.rz(aView + 45 + k * 90, () => SP.rcsQuad(M, { s: R * 0.05 })));
    co(M, 'THRUSTER QUAD', 4, [Math.cos((aView + 45) * D2R) * R * 1.02, Math.sin((aView + 45) * D2R) * R * 1.02, zr], 1.0);
  });
  M.part('CUPOLA', () => {
    M.at(0, 0, zr + h2, () => K.cupola(M, { r: R * 0.3, h: R * 0.08, windows: 10 }));
    co(M, 'CONTROL CUPOLA', 1, [0, 0, zr + h2 + R * 0.12], 2.2, R * 0.3);
  });
  M.part('LANDING LEG', () => {
    for (let k = 0; k < nLeg; k++) {
      const a = (aView + 60 + k * 120) * D2R, ca = Math.cos(a), sa = Math.sin(a);
      const foot = [ca * R * 0.78, sa * R * 0.78, 0.5];
      const top = [ca * R * 0.5, sa * R * 0.5, zr - h1 * 0.75];
      const q = [ca * R * 0.3 - sa * R * 0.12, sa * R * 0.3 + ca * R * 0.12, zr - h1 * 0.92];
      K.leg(M, { top: [top, q], foot, r: R * 0.022, knee: 0.5 });
      M.at(foot[0], foot[1], 0, () => K.footpad(M, { r: R * 0.11 }));
      co(M, 'FOOTPAD', nLeg, [foot[0], foot[1], R * 0.02], 1.4, R * 0.1);
      co(M, 'LANDING LEG', nLeg, [(top[0] + foot[0]) / 2, (top[1] + foot[1]) / 2, (top[2] + foot[2]) / 2], 2, R * 0.04);
    }
    { const a = (aView + 60) * D2R; co(M, 'LANDING LEG', nLeg, [Math.cos(a) * R * 0.64, Math.sin(a) * R * 0.64, (0.5 + zr - h1 * 0.75) / 2], 2, R * 0.05); }
  });
  M.part('LIFT ENGINE', () => {
    M.at(0, 0, zr - h1 * 0.95, () => SP.engines(M, { R: R * 0.24, n: M.pick([1, 4, 5]), len: Math.min(zr * 0.6, R * 0.2) }));
    co(M, 'LIFT ENGINE', 1, [0, 0, zr - h1 - R * 0.1], 1.6, R * 0.2);
  });
  if (ramp) {
    M.part('BOARDING RAMP', () => {
      const a = aView + (M.chance(0.5) ? 0 : 180) - 10;
      M.rz(a, () => {
        const x0 = R * 0.35, z0 = zr - h1 * 0.88, L = Math.hypot(z0, R * 0.8);
        M.along([x0, 0, z0], [x0 + R * 0.75, 0, 0.05], (l) => {
          const S = M.box([0, -0.7, -0.12], [l, 0.7, 0]);
          const f = S.f('+z'); if (f.on) { for (let x = -f.w / 2 + f.mOf(4); x < f.w / 2; x += 0.35) f.line(x, -f.h / 2 + f.mOf(2), x, f.h / 2 - f.mOf(2), { w: 0 }); f.rect(f.box, { w: 1 }); }
          K.railing(M, [[0.3, 0.7, 0], [l - 0.2, 0.7, 0]], { h: 0.9 });
          return S;
        });
        void L;
      });
      co(M, 'BOARDING RAMP', 1, [Math.cos(a * D2R) * R * 0.75, Math.sin(a * D2R) * R * 0.75, zr * 0.35], 1.6);
    });
  }
  M.info.mass = [-R, -R, zr - h1, R, R, zr + h2];
  M.info.centers = [[[0, 0, 0], [0, 0, zr + h2 + R * 0.3]]];
  const sx = e[0] >= 0 ? 1 : -1, sy = e[1] >= 0 ? 1 : -1;
  place(M, c.eq.filter((k) => k !== 'stairs').slice(0, 1), [[-sx * (R + 4), sy * (R * 0.6), sx > 0 ? 0 : 180, 0, 3]]);
  return {
    mass: R * R * (h1 + h2) * 0.6, load: `${Math.round(R * 60)} kg`, how: 'lands upright on three legs',
    form: 'LENTICULAR CRAFT', k3: 'DIAMETER', v3: `${thou(Math.round(R * 200) * 10)} MM`,
    figure: [sx * R * 0.95, sy * R * 0.55],
  };
}
