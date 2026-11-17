// classes/locomotive.js: a locomotive of an imaginary railway, standing on a short length of
// track. Four forms with their own running gear: steam (boiler, smokebox, chimney, domes,
// cab, spoked drivers with rods and valve gear, pilot and trailing trucks, tender or side
// tanks), streamlined or hood diesel (extruded nose profile, louvers, roof fans, bogies),
// electric box-cab (pantographs on roof insulators, balconies or end hoods, bogies or rod
// drive), and a propeller, ducted-fan or jet railcar. Jobs: mountain mail, desert express,
// mine, snow clearing (rotary plow front), night sleeper.

import * as K from '../kit.js';
import { D2R, circlePts } from '../geom.js';
import { word, thou } from '../words.js';
import * as R from './parts-rail.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const JOBS = {
  steam: [[3, 'MAIL'], [3, 'EXPRESS'], [2, 'MINE'], [2, 'SNOW'], [2, 'SLEEPER']],
  diesel: [[3, 'MAIL'], [3, 'EXPRESS'], [1.5, 'MINE'], [2, 'SNOW'], [2, 'SLEEPER']],
  electric: [[3, 'MAIL'], [2, 'EXPRESS'], [2, 'MINE'], [1.5, 'SNOW'], [2, 'SLEEPER']],
  railcar: [[3, 'EXPRESS'], [2, 'MAIL']],
};
const PLACES = {
  MAIL: ['MOUNTAIN', 'ALPINE', 'HIGHLAND', 'VALLEY', 'BORDER'],
  EXPRESS: ['DESERT', 'PRAIRIE', 'COASTAL', 'PLATEAU', 'STEPPE'],
  MINE: ['MINE', 'QUARRY', 'COLLIERY', 'SALT FLAT', 'PIT'],
  SNOW: ['ALPINE', 'POLAR', 'MOUNTAIN', 'TUNDRA', 'PASS'],
  SLEEPER: ['NIGHT', 'OVERNIGHT', 'TRANSIT', 'BORDER', 'CAPITAL'],
};
const JOBWORD = { MAIL: 'MAIL', EXPRESS: 'EXPRESS', MINE: 'SHUNTING', SNOW: 'SNOW CLEARING', SLEEPER: 'SLEEPER' };

export default {
  id: 'locomotive',
  family: 'rail',
  weight: 1,
  build(M) {
    // ------------------------------------------------ shared choices
    const form = M.wpick([[3, 'steam'], [2.4, 'diesel'], [2.2, 'electric'], [1.4, 'railcar']]);
    const job = M.wpick(JOBS[form]);
    const place = M.pick(PLACES[job]);
    const gauge = job === 'MINE' ? M.pick([0.762, 1.0, 1.0]) : M.wpick([[6, 1.435], [2, 1.0], [1.5, 1.676]]);
    const W = clamp(1.95 * gauge, 2.05, 3.1);
    const kS = clamp(W / 2.8, 0.78, 1.08);
    const ballast = M.chance(0.65);
    const side = M.chance(0.5) ? 1 : -1;
    const rear = M.chance(0.14);
    const az = (rear ? 180 - M.r(54, 64) : M.r(52, 64)) * side;
    M.setView(az, M.r(22, 30));
    const ns = M.view.e[1] >= 0 ? 1 : -1;           // the side the viewer sees
    const front = M.view.e[0] > 0;
    const plow = job === 'SNOW' ? M.wpick([[3, 'rotary'], [2, 'wedge']]) : 'none';
    const unitNo = String(M.ri(1, 99) * (M.chance(0.4) ? 100 : 1) + M.ri(0, 9)).slice(0, 4);
    const coupler = M.wpick([[3, 'hook'], [2, 'knuckle']]);
    const skin = M.wpick([[3, 'rivet'], [2, 'corr'], [2, 'plain']]);
    const P = { M, form, job, gauge, W, kS, ballast, ns, front, plow, unitNo, coupler, skin, rear };
    const out = { steam, diesel, electric, railcar }[form](M, P);

    // ------------------------------------------------ vocabulary
    const forms = {
      steam: out.tank ? ['TANK ENGINE', 'TANK LOCOMOTIVE'] : ['LOCOMOTIVE', 'STEAM LOCOMOTIVE'],
      diesel: out.hood ? ['DIESEL', 'HOOD DIESEL'] : ['STREAMLINER', 'DIESEL'],
      electric: out.nosed ? ['ELECTRIC', 'ROD ELECTRIC'] : ['BOX-CAB', 'ELECTRIC'],
      railcar: [out.drive === 'jet' ? 'JET RAILCAR' : out.drive === 'fan' ? 'FAN RAILCAR' : 'PROPELLER RAILCAR'],
    }[form];
    const formW = forms[M.ri(0, forms.length - 1)];
    let jw = JOBWORD[job];
    if (job === 'MINE' && (place === 'MINE' || place === 'PIT')) jw = 'SHUNTING';
    let klassPlace = place;
    if ([klassPlace, jw, formW].join(' ').length > 34) jw = job === 'SNOW' ? 'SNOW' : jw;
    if ([klassPlace, jw, formW].join(' ').length > 34) klassPlace = '';
    const mass = out.mass;
    const powerKw = Math.round(out.power / 10) * 10;
    const speed = out.speed;
    const where = {
      MOUNTAIN: 'over the mountain line', ALPINE: 'over the alpine pass', HIGHLAND: 'across the highlands', VALLEY: 'up the valley line',
      BORDER: 'to the border', DESERT: 'across the desert', PRAIRIE: 'across the prairie', COASTAL: 'along the coast', PLATEAU: 'over the plateau',
      STEPPE: 'across the steppe', MINE: 'in the mine yard', QUARRY: 'in the quarry', COLLIERY: 'at the colliery', 'SALT FLAT': 'on the salt flat',
      PIT: 'at the pit head', POLAR: 'on the polar line', TUNDRA: 'across the tundra', PASS: 'through the pass', NIGHT: 'through the night',
      OVERNIGHT: 'overnight', TRANSIT: 'between capitals', CAPITAL: 'out of the capital',
    }[place] || '';
    const carsW = word(out.cars);
    const B = {
      MAIL: [`Hauls ${carsW} mail vans ${where}.`, `Runs the mail ${where} at ${speed} km/h.`],
      EXPRESS: [`Pulls a ${carsW}-car express ${where} at ${speed} km/h.`, `Runs the express ${where}.`],
      MINE: [`Shunts ore wagons ${where} on ${thou(gauge * 1000)} mm track.`, `Moves ${carsW} loaded wagons at a time ${where}.`],
      SNOW: plow === 'rotary' ? [`Clears drifted cuts ${where} with a rotary plow.`] : plow === 'wedge' ? [`Pushes a wedge plow through drifts ${where}.`] : [`Clears snow ${where}.`],
      SLEEPER: [`Hauls ${carsW} sleeping cars ${where}.`, `Takes the sleeper ${where}.`],
    }[job];
    let brief = B[M.ri(0, B.length - 1)].replace(/ a ([aeio])/, ' an $1');
    if (out.extraBrief && M.chance(0.5)) brief = brief.replace(/\.$/, '') + out.extraBrief;
    if (brief.length > 78) brief = B[0];
    if (brief.length > 78) brief = brief.replace(/ [^ ]+ [^ ]+\.$/, '.');
    brief = brief.charAt(0).toUpperCase() + brief.slice(1);
    return {
      place: klassPlace, job: jw, form: formW,
      brief: brief.slice(0, 78),
      specs: [['MASS', `${mass} T`], ['POWER', `${thou(powerKw)} KW`], [out.wheelsLabel || 'WHEELS', out.wheels], gauge !== 1.435 ? ['GAUGE', `${thou(gauge * 1000)} MM`] : ['SPEED', `${speed} KM/H`]],
      figure: out.figure,
    };
  },
};

// ====================================================================== helpers
// face rect from two world-ish points given in the current local frame
function fr(M, f, p0, p1) {
  const a = R.fxz(f, M.W(p0)), b = R.fxz(f, M.W(p1));
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
function fp(M, f, p) { return R.fxz(f, M.W(p)); }

// a skin panel by style
function skinPanel(f, r, skin, i = 0) {
  if (!f.on) return;
  if (skin === 'corr') K.corrugated(f, r, { dir: 'v' });
  else if (skin === 'rivet') { K.frame(f, r, { inset: 1.6 }); f.rivets(r[0] + f.mOf(3), r[3] - f.mOf(3), r[2] - f.mOf(3), r[3] - f.mOf(3), { pitch: 6 }); f.rivets(r[0] + f.mOf(3), r[1] + f.mOf(3), r[2] - f.mOf(3), r[1] + f.mOf(3), { pitch: 6 }); if (f.tone > 0.3) f.hatch([r[0] + f.mOf(3), r[1] + f.mOf(5), r[2] - f.mOf(3), r[3] - f.mOf(5)], { angle: 90, gap: 4.4 - 2 * f.tone, w: 0 }); }
  else { K.frame(f, r, { inset: 1.4 }); if (f.tone > 0.25) f.hatch([r[0] + f.mOf(2.5), r[1] + f.mOf(2.5), r[2] - f.mOf(2.5), r[3] - f.mOf(2.5)], { angle: 90, gap: 4.2 - 2 * f.tone, w: 0 }); }
  void i;
}
// a window: frame and dark glass
function windowAt(f, r, o = {}) {
  if (!f.on) return;
  f.rect(r, { w: 1 });
  const m = Math.min(r[2] - r[0], r[3] - r[1]) * 0.12;
  const g = [[r[0] + m, r[1] + m], [r[2] - m, r[1] + m], [r[2] - m, r[3] - m], [r[0] + m, r[3] - m]];
  K.glass(f, g, { angle: o.angle ?? 62, flip: o.flip });
  if (o.bar) f.line((r[0] + r[2]) / 2, r[1] + m, (r[0] + r[2]) / 2, r[3] - m, { w: 1 });
}
// cutting wedge / cowcatcher / rotary plow at the front, origin at the beam face, +x out
function pilot(M, P, kind, zr, zt) {
  const W = P.W;
  if (kind === 'cow') {
    // cowcatcher: bars fanned from the beam to a nose at rail level
    const nose = [0.95, 0, zr + 0.08];
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const y = -W * 0.42 + W * 0.84 * i / n;
      const foot = [0.95 * (1 - Math.abs(y) / (W * 0.42)) + 0.05, y, zr + 0.08];
      M.tube([0, y * 0.95, zt], foot, 0.025, { isect: false, seg: 6, shade: false });
    }
    M.tube([0.05, -W * 0.42, zr + 0.08], nose, 0.035, { isect: false, seg: 6 });
    M.tube([0.05, W * 0.42, zr + 0.08], nose, 0.035, { isect: false, seg: 6 });
    M.tube([0, -W * 0.42, zt], [0, W * 0.42, zt], 0.035, { isect: false, seg: 6 });
    return;
  }
  if (kind === 'wedge') {
    const L = 1.7, hw = W * 0.52, z0 = zr + 0.06, z1 = zt + 0.6;
    const pr = [[0, -hw, z0], [0, hw, z0], [0, hw, z1], [0, -hw, z1]];
    // two slanted blades meeting at a vertical nose
    for (const s of [1, -1]) {
      const S = M.loft([[0, 0, z0], [0, s * hw, z0], [0, s * hw, z1], [0, 0, z1]], [[L, 0, z0], [0.35, s * hw, z0], [0.15, s * hw, z1], [L * 0.55, 0, z1]], { isect: false });
      for (const k of ['s0', 's0b', 's1', 's1b', 's2', 's2b']) {
        const f = S.f(k);
        if (f.on && f.front) { f.hatch(f.poly, { angle: 0, gap: 3.2 - f.tone, w: 0 }); f.rivets(...f.poly[0], ...f.poly[1], { pitch: 7 }); }
      }
    }
    void pr;
    M.callout('WEDGE PLOW', 1, [L * 0.5, P.ns * hw * 0.4, (z0 + z1) / 2], 2.4);
    return;
  }
  if (kind === 'rotary') {
    // drum housing with a rotor of scoop blades, a chute on top, a cutting wing each side
    const Rr = W * 0.56, zc = zr + 0.28 + Rr, L = 2.4;
    M.box([0, -W * 0.45, zr + 0.35], [L * 0.55, W * 0.45, zc + Rr * 0.5]);
    const D = M.at(0, 0, zc, () => M.cyl(Rr, L * 0.3, L, { axis: 'x' }));
    if (M.decorOn) { D.lat.shade({ gap: 1.8 }); D.lat.ring(0.35, { w: 1 }); D.lat.ring(0.7, { w: 1 }); }
    M.at(0, 0, zc, () => {
      M.cyl(Rr * 1.04, L - 0.12, L, { axis: 'x', isect: false });
      const hub = M.cone(Rr * 0.22, 0.02, L - 0.4, L + 0.45, { axis: 'x' });
      void hub;
      const n = 10;
      for (let i = 0; i < n; i++) {
        M.rx(i * 360 / n, () => M.at(L - 0.12, 0, Rr * 0.55, () => M.rz(28, () => M.box([-0.3, -0.03, -Rr * 0.38], [0.3, 0.03, Rr * 0.38], { isect: false }))));
      }
    });
    // chute
    const cz = zc + Rr * 0.85;
    M.loft([[L * 0.45, -0.35, cz], [L * 0.8, -0.35, cz], [L * 0.8, 0.35, cz], [L * 0.45, 0.35, cz]],
      [[L * 0.35, -0.3 + 1.2 * P.ns, cz + 1.0], [L * 0.7, -0.3 + 1.2 * P.ns, cz + 1.0], [L * 0.7, 0.3 + 1.2 * P.ns, cz + 1.0], [L * 0.35, 0.3 + 1.2 * P.ns, cz + 1.0]]);
    M.box([L * 0.32, -0.32 + 1.2 * P.ns, cz + 1.0], [L * 0.73, 0.32 + 1.2 * P.ns, cz + 1.12], { isect: false });
    // flanger at rail level
    M.box([L * 0.4, -W * 0.36, zr + 0.05], [L * 0.75, W * 0.36, zr + 0.35], { isect: false });
    for (const s of [1, -1]) M.with({ at: [L * 0.7, s * W * 0.45, zc - Rr * 0.4], rz: s * 25 }, () => M.box([0, -0.03, -Rr * 0.5], [0.9, 0.03, Rr * 0.55], { isect: false }));
    M.callout('ROTARY PLOW', 1, [L * 0.7, P.ns * Rr * 0.7, zc + Rr * 0.6], 3);
    M.callout('SNOW CHUTE', 1, [L * 0.55, 1.2 * P.ns, cz + 0.6], 1.2);
    return L + 0.45;
  }
}

// coupling rods between pins, connecting rod to a crosshead; y is the rod plane
function rodBar(M, a, b, t, h) {
  M.along(a, b, (L) => {
    M.box([-0.02, -t / 2, -h / 2], [L + 0.02, t / 2, h / 2], { isect: false });
  });
  for (const p of [a, b]) M.at(p[0], p[1], p[2], () => M.cyl(h * 0.85, -t / 2 - 0.005, t / 2 + 0.005, { axis: 'y', isect: false, seg: 12 }));
}

// ====================================================================== steam
function steam(M, P) {
  const { W, kS, job, gauge, ns } = P;
  // ---- choices
  const nd = job === 'MINE' ? M.pick([2, 3, 3]) : job === 'EXPRESS' ? M.pick([2, 3, 3]) : job === 'MAIL' ? M.pick([3, 4]) : M.pick([3, 4, 4]);
  const Rd = (job === 'EXPRESS' ? M.r(0.92, 1.02) : job === 'SLEEPER' ? M.r(0.85, 0.95) : job === 'MAIL' ? M.r(0.74, 0.86) : job === 'MINE' ? M.r(0.5, 0.6) : M.r(0.66, 0.76)) * Math.min(1, kS * 1.05);
  const nl = job === 'MINE' ? M.pick([0, 0, 1]) : job === 'EXPRESS' ? 2 : M.pick([1, 1, 2]);
  const nt = job === 'MINE' ? 0 : job === 'EXPRESS' || job === 'SLEEPER' ? M.pick([1, 1, 0]) : M.pick([0, 0, 1]);
  const tank = job === 'MINE' ? true : job === 'EXPRESS' || job === 'SLEEPER' ? M.chance(0.1) : M.chance(0.35);
  const ang = M.r(0, 360);
  const spokeKind = M.chance(0.85) ? 'spoke' : 'disc';
  const lampKind = M.wpick([[2, 'top'], [2, 'beam'], [1, 'door']]);
  const extras = M.shuffle(['deflectors', 'bell', 'pump', 'heater', 'generator', 'toolbox']).slice(0, M.ri(2, 4));
  if (job === 'MINE') { const i = extras.indexOf('deflectors'); if (i >= 0) extras.splice(i, 1); }
  const sandDome = M.chance(0.7);
  const tenderLen = M.r(5.4, 7.0) * kS;
  const tenderAxles = M.pick([2, 2, 3]);
  const carryCar = !tank && M.chance(0.15);
  const pilotKind = P.plow !== 'none' ? P.plow : P.coupler === 'knuckle' && nl > 0 ? 'cow' : 'none';
  const lenBoost = M.r(0, 1.2);
  const cabLen = M.r(2.1, 2.6) * kS;
  const fbLen = M.r(1.7, 2.4) * kS;

  // ---- layout (x = 0 at the front buffer beam face, everything behind is negative)
  const RT = R.trackTop(P.ballast);
  const yW = R.wheelY(gauge);
  const Rl = 0.42 * kS, Rt = 0.52 * kS;
  const fl = Math.max(0.03, Rd * 0.055);
  const pd = 2 * Rd + 2 * fl + 0.18;
  const xl = nl === 0 ? [] : nl === 1 ? [-1.25 * kS] : [-1.0 * kS, -1.0 * kS - 1.85 * kS];
  const Lc = 1.0 * kS, Rc = clamp(0.3 * kS, 0.22, 0.32);
  const xc = nl === 2 ? (xl[0] + xl[1]) / 2 : nl === 1 ? xl[0] - 0.25 : -1.05 * kS;
  const rc = Rd * 0.36;
  const hubOut = R.WHEEL_W / 2 + Math.min(0.1, Rd * 0.12);
  const yPin = yW + hubOut + 0.02;
  const yCR = yPin + 0.06, yMR = yCR + 0.085;
  const zA = RT + Rd;
  const leadTop = nl ? RT + 2 * Rl + 0.08 : 0;
  const zCyl = Math.max(zA, nl && yMR - Rc < yW + 0.12 ? leadTop + Rc + 0.04 : zA);
  const main = nd >= 4 ? 2 : 1;
  const x0d = xc - Lc / 2 - Rd - 0.35 - lenBoost * 0.3;
  const xd = Array.from({ length: nd }, (_, i) => x0d - i * pd);
  const xm = xd[main];
  const pin = (x) => [x + Math.cos(ang * D2R) * rc, zA + Math.sin(ang * D2R) * rc];
  const [pmx, pmz] = pin(xm);
  const xFront = xc - Lc / 2 - 0.2;
  let Lr = xFront - (xm + rc);
  Lr = Math.max(Lr, Math.abs(zCyl - pmz) + 0.5);
  const xh = pmx + Math.sqrt(Math.max(0.01, Lr * Lr - (zCyl - pmz) ** 2));
  const xdl = xd[nd - 1];
  const zf = RT + Math.max(2 * Rd + 0.24, 1.3 * kS, zCyl - RT + Rc + 0.45);
  let Rb = clamp(0.3 * W, 0.62, 0.9);
  let zb = zf + Rb + 0.22;
  const capZ = RT + 4.55 * kS;
  if (zb + Rb + 0.4 > capZ) { Rb = Math.max(0.55, (capZ - 0.4 - zf - 0.22) / 2); zb = zf + Rb + 0.22; }
  const chH = clamp(capZ - zb - Rb, 0.32, 0.95);
  const xs1 = -0.45 * kS - (nl ? 0 : 0.05);
  const Ls = 1.45 * kS;
  const xs0 = xs1 - Ls;
  let xfb = Math.min(xdl - Rd * 0.2, xs0 - 3.0 * kS);
  const xcf = xfb - fbLen + 0.8;
  const xcr = xcf - cabLen;
  const xt = nt ? Math.min(xfb - fbLen * 0.55, xdl - Rd - Rt - 0.45) : null;
  const zCab = Math.min(capZ - 0.25, zb + Rb + 0.25);
  const bunker = tank ? 1.4 * kS : 0;
  const xRear = xcr - bunker - 0.15;
  const zBuf = RT + 0.82 * kS + 0.18;
  let xT1 = 0, xT0 = 0;
  if (!tank) { xT1 = xRear - 0.75; xT0 = xT1 - tenderLen; }
  const xMin = tank ? xRear - 0.65 : xT0 - 0.65;
  const plowL = P.plow === 'rotary' ? 2.85 : P.plow === 'wedge' ? 1.7 : pilotKind === 'cow' ? 1.0 : 0.5;
  const xMax = plowL;
  const shift = -(xMin + xMax) / 2;
  const out = { tank, cars: job === 'MINE' ? M.ri(6, 12) : M.ri(5, 10), speed: job === 'EXPRESS' ? M.ri(13, 16) * 10 : job === 'MINE' ? M.ri(3, 5) * 10 : M.ri(8, 11) * 10 };
  out.wheels = `${2 * nl}-${2 * nd}-${2 * nt}`;
  out.mass = Math.round((70 + nd * 18 + nl * 6 + Rd * 30) * kS * kS * (tank ? 0.9 : 1.6));
  out.power = (600 + nd * 320 + Rd * 500) * kS * kS;
  out.speed = Math.min(out.speed, Math.round(Rd * 170 / 10) * 10);
  let figure = null;

  M.at(shift, 0, 0, () => {
    R.track(M, { gauge, x0: xMin - 0.6, x1: xMax + 0.9, ballast: P.ballast });
    const near = (fn) => M.mirrorY((s) => fn(s));

    // ---- frames, footplate, buffer beams
    M.part('FRAME', () => {
      for (const s of [1, -1]) M.box([xRear + 0.25, s * (gauge / 2 - 0.2) - 0.035, RT + 0.42], [-0.18, s * (gauge / 2 - 0.2) + 0.035, zf - 0.08], { isect: false });
      const F = M.box([xRear, -W / 2, zf - 0.09], [-0.15, W / 2, zf]);
      const top = F.f('+z');
      if (top.on) { top.line(...fp(M, top, [xcf, 0, zf]), ...fp(M, top, [xcf, 0.01, zf]), { w: 0 }); }
      near((s) => {
        const V = M.box([xcr + 0.3, W / 2 - 0.05, zf - 0.34], [xs1 - 0.25, W / 2, zf - 0.09], { isect: false });
        const f = V.f('+y');
        if (f.on) f.rivets(...fp(M, f, [xcr + 0.4, 0, zf - 0.2]), ...fp(M, f, [xs1 - 0.35, 0, zf - 0.2]), { pitch: 8 });
      });
      M.callout('RUNNING BOARD', 1, [(xcf + xs0) / 2, ns * (W / 2 - 0.3), zf], 0.8);
    });
    M.part('BUFFER BEAM', () => {
      M.at(-0.0, 0, 0, () => R.bufferBeam(M, { w: W * 0.98, z: zBuf, coupler: P.plow === 'rotary' ? 'knuckle' : P.coupler, label: P.unitNo }));
      const FP = M.box([-0.2, -(gauge / 2 - 0.12), zBuf + 0.21], [-0.12, gauge / 2 - 0.12, zf - 0.09], { isect: false });
      const fpf = FP.f('+x');
      if (fpf.on) { fpf.rivets(-fpf.w / 2 + 0.06, fpf.h / 2 - 0.06, fpf.w / 2 - 0.06, fpf.h / 2 - 0.06, { pitch: 6 }); fpf.circle(0, 0, Math.min(fpf.w, fpf.h) * 0.22, { w: 1 }); fpf.hatch(fpf.box, { angle: 90, gap: 3.6, w: 0 }); }
      M.callout(P.coupler === 'knuckle' ? 'KNUCKLE COUPLER' : 'BUFFER', P.coupler === 'knuckle' ? 2 : 4, [0.4, ns * 0.875, zBuf], 1.1);
      if (tank) M.at(xRear, 0, 0, () => M.rz(180, () => R.bufferBeam(M, { w: W * 0.98, z: zBuf, coupler: P.coupler })));
      else M.box([xRear - 0.7, -0.12, zBuf - 0.08], [xRear, 0.12, zBuf + 0.06], { isect: false });
      if (pilotKind !== 'none') pilot(M, P, pilotKind, RT, zBuf - 0.2);
    });

    // ---- running gear
    M.part('DRIVING WHEEL', () => {
      xd.forEach((x, i) => M.at(x, 0, zA, () => {
        M.mirrorY((s) => M.at(0, yW, 0, () => R.railWheel(M, { r: Rd, kind: spokeKind, crank: { rc, ang: ang + (s > 0 ? 0 : 90) }, cw: true, simple: s !== ns, spokes: Math.round(clamp(Rd * 18, 10, 20)) })));
        M.cyl(Rd * 0.13, -yW, yW, { axis: 'y', isect: false });
        void i;
      }));
      M.callout('DRIVING WHEEL', 2 * nd, [xd[0], ns * (yW + 0.08), zA + Rd * 0.55], 3);
      // brake shoes and hangers
      M.mirrorY(() => xd.forEach((x) => {
        M.box([x - Rd - 0.09, yW - 0.06, zA - 0.25], [x - Rd - 0.03, yW + 0.06, zA + 0.15], { isect: false });
        M.tube([x - Rd - 0.06, yW, zA + 0.12], [x - Rd - 0.1, gauge / 2 - 0.2, zf - 0.3], 0.02, { isect: false, seg: 6 });
      }));
      if (M.info) M.info.centers = xd.map((x) => [[x + shift, -yW - 0.5, zA], [x + shift, yW + 0.5, zA]]);
    });
    M.part('COUPLING ROD', () => {
      M.mirrorY((s) => {
        const a = ang + (s > 0 ? 0 : 90);
        const pins = xd.map((x) => [x + Math.cos(a * D2R) * rc, yCR, zA + Math.sin(a * D2R) * rc]);
        for (let i = 0; i + 1 < pins.length; i++) rodBar(M, pins[i], pins[i + 1], 0.05, 0.13 * kS);
      });
      M.callout('COUPLING ROD', 2, [(xd[0] + xd[1]) / 2 + Math.cos(ang * D2R) * rc, ns * yCR, zA + Math.sin(ang * D2R) * rc], 2);
    });
    M.part('CYLINDER', () => {
      M.mirrorY((s) => {
        const a = ang + (s > 0 ? 0 : 90);
        const pmx2 = xm + Math.cos(a * D2R) * rc, pmz2 = zA + Math.sin(a * D2R) * rc;
        const xh2 = pmx2 + Math.sqrt(Math.max(0.01, Lr * Lr - (zCyl - pmz2) ** 2));
        M.at(xc, yMR, zCyl, () => {
          const C = M.cyl(Rc, -Lc / 2, Lc / 2, { axis: 'x' });
          if (M.decorOn) { C.lat.ring(0.18, { w: 1 }); C.lat.ring(0.82, { w: 1 }); C.lat.shade({ gap: 1.6 }); }
          for (const e of [-1, 1]) {
            const Cv = M.cyl(Rc * 1.1, e > 0 ? Lc / 2 - 0.02 : -Lc / 2 - 0.06, e > 0 ? Lc / 2 + 0.06 : -Lc / 2 + 0.02, { axis: 'x', isect: false });
            const fc = e > 0 ? Cv.top : Cv.bottom;
            if (fc.on) { fc.circle(0, 0, Rc * 0.65, { w: 1 }); for (let k = 0; k < 10; k++) { const q = k * Math.PI / 5; fc.circle(Math.cos(q) * Rc * 0.92, Math.sin(q) * Rc * 0.92, Rc * 0.04, { n: 6, w: 1 }); } }
          }
          // steam chest on top, drain cocks under
          const SC = M.box([-Lc * 0.42, -Rc * 0.55, Rc * 0.55], [Lc * 0.42, Rc * 0.55, Rc * 0.55 + 0.32 * kS]);
          const fs = SC.f('+y');
          if (fs.on) fs.rivets(-fs.w / 2 + 0.06, fs.h / 2 - 0.05, fs.w / 2 - 0.06, fs.h / 2 - 0.05, { pitch: 6 });
          M.cyl(0.08, Lc * 0.42, Lc * 0.42 + 0.12, { axis: 'x', isect: false });
          for (const dx of [-0.3, 0.3]) M.tube([dx * Lc, 0, -Rc], [dx * Lc - 0.05, 0, -Rc - 0.22], 0.018, { isect: false, seg: 6 });
          // saddle to the frame
          M.box([-Lc * 0.32, -(yMR - gauge / 2 + 0.2), -0.18], [Lc * 0.32, -Rc * 0.8, 0.18], { isect: false });
        });
        // slide bars, crosshead, piston rod, connecting rod
        const sb0 = xc - Lc / 2 - 0.06, sb1 = xFront - 2 * rc - 0.45;
        for (const dz of [-0.11, 0.11]) M.box([sb1, yMR - 0.035, zCyl + dz - 0.025], [sb0, yMR + 0.035, zCyl + dz + 0.025], { isect: false });
        M.box([sb1 - 0.06, yMR - 0.03, zCyl - 0.2], [sb1, gauge / 2 - 0.16, zCyl + 0.22], { isect: false });
        M.box([xh2 - 0.02, yMR - 0.06, zCyl - 0.085], [xh2 + 0.3, yMR + 0.06, zCyl + 0.085], { isect: false });
        M.tube([xh2 + 0.3, yMR, zCyl], [sb0 + 0.05, yMR, zCyl], 0.035, { isect: false, seg: 8 });
        rodBar(M, [xh2, yMR + 0.05, zCyl], [pmx2, yMR, pmz2], 0.05, 0.15 * kS);
        // valve gear: return crank, eccentric rod, expansion link, radius rod, combination lever
        const ra = (a + 90) * D2R;
        const rcP = [pmx2 + Math.cos(ra) * rc * 0.45, yMR + 0.1, pmz2 + Math.sin(ra) * rc * 0.45];
        const link = [xm + Lr * 0.45, yMR + 0.07, zCyl + Rc + 0.15];
        rodBar(M, [pmx2, yMR + 0.1, pmz2], rcP, 0.03, 0.06);
        rodBar(M, rcP, [link[0], link[1], link[2] - 0.25], 0.03, 0.06);
        M.box([link[0] - 0.06, link[1] - 0.03, link[2] - 0.32], [link[0] + 0.06, link[1] + 0.03, link[2] + 0.12], { isect: false });
        M.box([link[0] - 0.03, link[1] - 0.09, link[2] + 0.1], [link[0] + 0.03, gauge / 2 - 0.2, link[2] + 0.2], { isect: false });
        rodBar(M, [link[0], link[1] + 0.03, link[2]], [xh2 + 0.1, yMR + 0.1, link[2] - 0.02], 0.03, 0.06);
        rodBar(M, [xh2 + 0.1, yMR + 0.1, link[2] - 0.02], [xh2 + 0.12, yMR + 0.1, zCyl - 0.12], 0.03, 0.05);
        void xh;
      });
      M.callout('CYLINDER', 2, [xc + Lc * 0.3, ns * (yMR + Rc * 0.7), zCyl + Rc * 0.4], 2.2);
      M.callout('CONNECTING ROD', 2, [(xh + pmx) / 2, ns * (yMR + 0.05), (zCyl + pmz) / 2], 1.8);
      M.callout('VALVE GEAR', 2, [xm + Lr * 0.45, ns * (yMR + 0.1), zCyl + Rc + 0.05], 1.2);
    });
    if (nl) {
      M.part('PILOT TRUCK', () => {
        for (const x of xl) M.at(x, 0, RT + Rl, () => R.wheelset(M, { r: Rl, gauge, kind: spokeKind, spokes: 10, nearSide: ns }));
        M.mirrorY(() => {
          M.box([Math.min(...xl) - Rl - 0.15, yW + 0.2, RT + Rl - 0.12], [Math.max(...xl) + Rl + 0.15, yW + 0.27, RT + Rl + 0.12], { isect: false });
          for (const x of xl) M.boxc([x, yW + 0.2, RT + Rl], [0.3, 0.18, 0.3], { isect: false });
        });
        M.box([Math.min(...xl) - 0.1, -yW - 0.3, RT + Rl + 0.13], [Math.max(...xl) + 0.1, yW + 0.3, RT + Rl + 0.25], { isect: false });
        M.callout('PILOT TRUCK', 1, [xl[0], ns * (yW + 0.27), RT + Rl], 1.4);
      });
    }
    if (nt) {
      M.part('TRAILING TRUCK', () => {
        M.at(xt, 0, RT + Rt, () => R.wheelset(M, { r: Rt, gauge, kind: 'disc', nearSide: ns }));
        M.mirrorY(() => {
          M.extrude([[xt - Rt - 0.3, RT + Rt + 0.05], [xt + Rt + 1.2, zf - 0.35], [xt + Rt + 1.2, zf - 0.15], [xt - Rt - 0.3, RT + Rt + 0.3]], yW + 0.17, yW + 0.25, { plane: 'xz', isect: false });
          M.boxc([xt, yW + 0.24, RT + Rt], [0.36, 0.16, 0.36], { isect: false });
          M.at(xt, yW + 0.3, RT + Rt + 0.32, () => R.leaf(M, { len: 0.9, n: 5, w: 0.09 }));
        });
      });
    }

    // ---- boiler and smokebox
    M.part('BOILER', () => {
      const Bo = M.at(0, 0, zb, () => M.cyl(Rb, xfb - 0.05, xs0 + 0.02, { axis: 'x' }));
      if (M.decorOn) {
        const L = Bo.lat, nb = Math.max(2, Math.round((xs0 - xfb) / 1.1));
        for (let i = 1; i < nb; i++) { L.ring(i / nb - 0.008, { w: 1 }); L.ring(i / nb + 0.008, { w: 1 }); }
        L.shade({ gap: 1.7, gapMax: 6 });
      }
      // firebox: Belpaire top, staybolt rows
      const top = zb + Rb * 1.04, hw = Rb * 0.97;
      const FB = M.extrude([[-hw, zf - 0.1], [hw, zf - 0.1], [hw, zb + Rb * 0.5], [hw * 0.78, top], [-hw * 0.78, top], [-hw, zb + Rb * 0.5]], xcf - 0.4, xfb, { plane: 'yz' });
      for (const k of ['s1', 's5']) {
        const f = FB.f(k);
        if (!f.on) continue;
        const r = f.box;
        const rows = Math.floor(f.pxOf(f.h) / 7);
        for (let j = 1; j < rows; j++) f.rivets(r[0] + f.mOf(3), r[1] + f.h * j / rows, r[2] - f.mOf(3), r[1] + f.h * j / rows, { pitch: 7 });
        f.hatch([r[0], r[1], r[2], r[3]], { angle: 90, gap: 4.6 - 2.4 * f.tone, w: 0 });
      }
      M.callout('FIREBOX', 1, [(xfb + xcf) / 2, ns * hw, zb], 1);
      // saddle
      M.box([xs0 + 0.15, -Rb * 0.7, zf - 0.02], [xs1 - 0.15, Rb * 0.7, zb - Rb * 0.55]);
      // smokebox
      const SB = M.at(0, 0, zb, () => M.cyl(Rb * 1.06, xs0, xs1, { axis: 'x' }));
      if (M.decorOn) { SB.lat.shade({ gap: 1.3, gapMax: 3.2, threshold: 0.2 }); SB.lat.ring(0.05, { w: 1 }); }
      M.at(0, 0, zb, () => M.cyl(Rb * 1.1, xs1 - 0.07, xs1, { axis: 'x', isect: false }));
      M.callout('BOILER', 1, [(xs0 + xfb) / 2, ns * Rb * 0.7, zb + Rb * 0.7], 2.2);
    });
    M.part('SMOKEBOX DOOR', () => {
      M.at(xs1, 0, zb, () => {
        const pr = [[Rb * 0.95, 0], [Rb * 0.92, 0.05], [Rb * 0.75, 0.09], [Rb * 0.4, 0.12], [0, 0.13]];
        const D = M.lathe(pr, { axis: 'x', sharpDeg: 50 });
        if (M.decorOn) { D.lat.ring(0.32, { w: 1 }); }
        // hinge straps and the dart
        for (const z of [-Rb * 0.42, Rb * 0.42]) M.box([0.06, -Rb * 0.82 * ns, z - 0.035], [0.14, Rb * 0.3 * ns, z + 0.035], { isect: false });
        M.cyl(0.07, 0.1, 0.24, { axis: 'x', isect: false });
        M.box([0.22, -0.2, -0.025], [0.26, 0.2, 0.025], { isect: false });
        M.box([0.26, -0.025, -0.16], [0.3, 0.025, 0.16], { isect: false });
        const NP = M.box([0.08, -0.32, Rb * 0.58], [0.12, 0.32, Rb * 0.58 + 0.17], { isect: false });
        if (NP.f('+x').on) K.stencil(NP.f('+x'), P.unitNo, 0, 0, 0.1);
        // front handrail
        R.handrail(M, [0.18, -Rb * 0.6, Rb * 0.78], [0.18, Rb * 0.6, Rb * 0.78], [-0.15, 0, 0], { pitch: 0.6 });
      });
      M.callout('SMOKEBOX DOOR', 1, [xs1 + 0.12, ns * Rb * 0.3, zb - Rb * 0.2], 1.6);
    });
    M.part('CHIMNEY', () => {
      const xch = (xs0 + xs1) / 2 + 0.05;
      const r0 = 0.26 * kS;
      const C = M.at(xch, 0, zb, () => M.lathe([[r0 * 1.45, Rb * 0.8], [r0 * 1.25, Rb * 1.1], [r0 * 0.95, Rb * 1.1 + 0.08], [r0, Rb + chH * 0.75], [r0 * 1.3, Rb + chH * 0.92], [r0 * 1.3, Rb + chH], [r0 * 0.85, Rb + chH]], { sharpDeg: 30 }));
      if (C.top.on) C.top.hatch(circlePts(0, 0, r0 * 0.8, r0 * 0.8, 20), { angle: 45, gap: 1.0, w: 0 });
      if (M.decorOn) C.lat.shade({ gap: 1.6, gapMax: 4 });
      M.callout('CHIMNEY', 1, [xch, ns * r0, zb + Rb + chH * 0.6], 1.6);
    });
    const xDome = xs0 - (xs0 - xfb) * 0.48;
    M.part('STEAM DOME', () => {
      const r = 0.42 * kS;
      const D = M.at(xDome, 0, zb, () => M.lathe([[r * 1.12, Rb * 0.8], [r, Rb + 0.06], [r, Rb + 0.22 * kS], [r * 0.86, Rb + 0.36 * kS], [r * 0.5, Rb + 0.45 * kS], [0, Rb + 0.47 * kS]], { sharpDeg: 40 }));
      if (M.decorOn) { D.lat.shade({ gap: 1.6, gapMax: 5 }); D.lat.ring(0.45, { w: 1 }); }
      M.callout('STEAM DOME', 1, [xDome, ns * r * 0.6, zb + Rb + 0.3], 1.5);
      if (sandDome) {
        const xs = xDome + (xs0 - xDome) * 0.5, r2 = 0.34 * kS;
        const S = M.at(xs, 0, zb, () => M.lathe([[r2 * 1.1, Rb * 0.82], [r2, Rb + 0.05], [r2, Rb + 0.12], [r2 * 0.75, Rb + 0.3 * kS], [0, Rb + 0.36 * kS]], { sharpDeg: 40 }));
        if (M.decorOn) S.lat.shade({ gap: 1.6, gapMax: 5 });
        M.mirrorY(() => M.pipe([[xs - 0.05, Rb * 0.5, zb + Rb * 0.9], [xs - 0.05, Rb * 1.0, zb + 0.1], [xs - 0.05, Rb * 1.05, zf + 0.04]], 0.025, { isect: false, seg: 6 }));
        M.mirrorY(() => M.pipe([[xd[0] + Rd + 0.25, yW + 0.02, zf - 0.12], [xd[0] + Rd + 0.12, yW, RT + 0.35], [xd[0] + Rd * 0.75, yW, RT + 0.12]], 0.022, { isect: false, seg: 6 }));
        M.callout('SAND DOME', 1, [xs, ns * r2 * 0.5, zb + Rb + 0.2], 1.1);
      }
      // safety valves and whistle on the firebox top
      for (const dy of [-0.13, 0.13]) M.at(xfb - 0.35, dy, zb + Rb * 1.0, () => { M.cyl(0.07, 0, 0.26); M.cyl(0.1, 0.26, 0.32, { isect: false }); });
      M.at(xfb - 0.75, 0, zb + Rb * 1.0, () => { M.cyl(0.03, 0, 0.3, { isect: false }); M.cyl(0.07, 0.3, 0.55, { isect: false }); M.cone(0.07, 0.02, 0.55, 0.62, { isect: false }); });
      M.callout('SAFETY VALVE', 2, [xfb - 0.35, ns * 0.13, zb + Rb + 0.3], 0.8);
    });
    M.part('HANDRAIL', () => {
      M.mirrorY(() => R.handrail(M, [xs1 - 0.12, Rb * 1.18, zb + Rb * 0.35], [xfb + 0.1, Rb * 1.12, zb + Rb * 0.35], [0, -0.16, 0], { pitch: 1.4 }));
      // steam pipes from the smokebox down to the steam chests
      M.mirrorY(() => M.pipe([[xs0 + 0.45, Rb * 0.9, zb - Rb * 0.25], [xs0 + 0.45, Rb * 1.18, zb - Rb * 0.55], [xc + 0.05, yMR - 0.05, zf + 0.05], [xc + 0.05, yMR - 0.05, zCyl + Rc + 0.3]], 0.08 * kS, { isect: false }));
      M.callout('HANDRAIL', 2, [(xs1 + xfb) / 2, ns * Rb * 1.18, zb + Rb * 0.35], 0.6);
    });

    // ---- cab
    M.part('CAB', () => {
      const Wc = W * 0.96;
      const C = M.box([xcr, -Wc / 2, zf], [xcf, Wc / 2, zCab]);
      for (const k of ['+y', '-y']) {
        const f = C.f(k);
        if (!f.on) continue;
        const dz = zf + 1.45;
        // doorway (dark opening) at the rear, window ahead of it, number below
        const dr = fr(M, f, [xcr + 0.12, 0, zf + 0.05], [xcr + 0.75, 0, zf + 1.85]);
        f.rect(dr, { w: 1 });
        f.hatch(dr, { angle: 70, gap: 1.0, gap2: 2.4, w: 0 });
        const wr = fr(M, f, [xcr + 1.0, 0, dz], [xcf - 0.18, 0, zCab - 0.25]);
        if (wr[2] - wr[0] > 0.3) windowAt(f, wr, { bar: true });
        const nr = fr(M, f, [xcr + 0.95, 0, zf + 0.25], [xcf - 0.15, 0, dz - 0.15]);
        K.frame(f, nr, { inset: 1.6 });
        K.stencil(f, P.unitNo, (nr[0] + nr[2]) / 2, (nr[1] + nr[3]) / 2, Math.min(0.42, (nr[3] - nr[1]) * 0.55));
        f.rivets(...fp(M, f, [xcr + 0.03, 0, zCab - 0.05]), ...fp(M, f, [xcf - 0.03, 0, zCab - 0.05]), { pitch: 6 });
      }
      const fb = C.f('-x');
      if (fb.on) {
        for (const s of [1, -1]) windowAt(fb, fr(M, fb, [xcr, s * Wc * 0.12, zCab - 0.95], [xcr, s * Wc * 0.38, zCab - 0.3]));
      }
      const ff = C.f('+x');
      if (ff.on) for (const s of [1, -1]) K.porthole(ff, ...fp(M, ff, [xcf, s * Wc * 0.33, zCab - 0.55]), 0.2);
      // roof: an arched plate with an overhang and a vent
      const rw = Wc / 2 + 0.1, rise = 0.28 * kS;
      const arc = [];
      for (let i = 0; i <= 8; i++) { const t = -1 + 2 * i / 8; arc.push([t * rw, zCab - 0.02 + rise * (1 - t * t)]); }
      const inner = arc.slice().reverse().map(([y, z]) => [y * 0.99, z - 0.05]);
      M.extrude([...arc, ...inner], xcr - 0.18, xcf + 0.12, { plane: 'yz', smoothDeg: 25 });
      M.box([(xcr + xcf) / 2 - 0.35, -0.3, zCab + rise - 0.1], [(xcr + xcf) / 2 + 0.35, 0.3, zCab + rise + 0.12], { isect: true });
      // grab irons and steps at the doorway
      M.mirrorY(() => {
        R.handrail(M, [xcr + 0.05, Wc / 2 + 0.07, zf + 0.25], [xcr + 0.05, Wc / 2 + 0.07, zf + 1.6], [0, -0.07, 0], { pitch: 3 });
        M.at(xcr + 0.45, Wc / 2 - 0.2, zf - 0.09, () => R.steps(M, { n: 2, w: 0.42, gap: Math.min(0.38, (zf - RT - 0.3) / 2.2) }));
      });
      M.callout('CAB', 1, [xcr + 0.5, ns * Wc / 2, zf + 1.2], 1.6);
      figure = [xcr + 0.2 + shift, ns * (W / 2 + 1.0)];
    });

    // ---- lamps and extras
    M.part('HEADLAMP', () => {
      if (lampKind === 'top') M.at(xs1 + 0.15, 0, zb + Rb * 1.12, () => { M.box([-0.35, -0.12, -0.12], [0.05, 0.12, 0.0], { isect: true }); R.headlamp(M, { r: 0.2 * kS }); });
      else if (lampKind === 'door') M.at(xs1 + 0.12, 0, zb + Rb * 0.9, () => R.headlamp(M, { r: 0.14 * kS }));
      else for (const s of [1, -1]) M.at(-0.1, s * W * 0.32, zBuf + 0.42, () => R.headlamp(M, { r: 0.12 * kS, visor: false }));
      M.callout('HEADLAMP', lampKind === 'beam' ? 2 : 1, lampKind === 'beam' ? [0, ns * W * 0.32, zBuf + 0.42] : [xs1 + 0.3, 0, lampKind === 'top' ? zb + Rb * 1.12 : zb + Rb * 0.9], 1.4);
    });
    for (const ex of extras) {
      if (ex === 'deflectors') M.part('SMOKE DEFLECTOR', () => {
        M.mirrorY(() => {
          const y = W / 2 - 0.08;
          const S = M.extrude([[xs1 - 0.05, zf], [xs0 - 0.6, zf], [xs0 - 0.6, zb + Rb * 0.55], [xs0 + 0.2, zb + Rb * 0.95], [xs1 - 0.05, zb + Rb * 0.95]], y - 0.03, y, { plane: 'xz' });
          const f = S.f('+y');
          if (f.on) { f.hatch(f.poly, { angle: 90, gap: 4.2 - 2 * f.tone, w: 0 }); f.rivets(...fp(M, f, [xs1 - 0.1, 0, zf + 0.08]), ...fp(M, f, [xs0 - 0.5, 0, zf + 0.08]), { pitch: 7 }); }
          M.tube([xs0 + 0.1, y - 0.03, zb + Rb * 0.6], [xs0 + 0.2, Rb * 0.95, zb + Rb * 0.25], 0.025, { isect: false, seg: 6 });
        });
        M.callout('SMOKE DEFLECTOR', 2, [xs0 + 0.1, ns * (W / 2 - 0.08), zb], 1.3);
      });
      if (ex === 'bell') M.part('BELL', () => {
        const xb = xs0 - 0.45;
        M.at(xb, 0, zb + Rb * 0.95, () => {
          for (const s of [1, -1]) M.box([-0.03, s * 0.16 - 0.025, 0], [0.03, s * 0.16 + 0.025, 0.42], { isect: false });
          M.at(0, 0, 0.1, () => M.lathe([[0.17, 0], [0.15, 0.06], [0.11, 0.2], [0.08, 0.3], [0, 0.32]], { isect: false }));
        });
        M.callout('BELL', 1, [xb, 0, zb + Rb + 0.25], 0.8);
      });
      if (ex === 'pump') M.part('AIR PUMP', () => {
        const y = ns * (W / 2 - 0.3), xp = xfb + 0.7;
        M.at(xp, y, zf, () => { M.cyl(0.17, 0.05, 0.7); M.cyl(0.13, 0.7, 1.2); M.cyl(0.2, 0, 0.08, { isect: false }); M.cyl(0.15, 1.2, 1.28, { isect: false }); });
        M.pipe([[xp, y, zf + 1.1], [xp + 0.4, y * 0.86, zf + 1.1], [xp + 0.6, y * 0.82, zf + 0.2]], 0.03, { isect: false, seg: 6 });
        M.callout('AIR PUMP', 1, [xp, y, zf + 0.6], 1);
      });
      if (ex === 'heater') M.part('FEEDWATER HEATER', () => {
        M.at(xs1 - 0.25, 0, zb + Rb * 1.08, () => { M.cyl(0.2 * kS, -Rb * 0.75, Rb * 0.75, { axis: 'y' }); for (const s of [1, -1]) M.box([-0.12, s * Rb * 0.5 - 0.04, -0.2], [0.12, s * Rb * 0.5 + 0.04, 0], { isect: false }); });
        M.callout('FEEDWATER HEATER', 1, [xs1 - 0.25, ns * Rb * 0.5, zb + Rb * 1.12], 0.9);
      });
      if (ex === 'generator') M.part('TURBO GENERATOR', () => {
        M.at(xfb - 0.2, ns * Rb * 0.55, zb + Rb * 0.9, () => { M.box([-0.3, -0.12, 0], [0.3, 0.12, 0.1]); M.cyl(0.13, -0.28, 0.28, { axis: 'x', isect: false }); M.cyl(0.1, 0.28, 0.4, { axis: 'x', isect: false }); });
        M.callout('TURBO GENERATOR', 1, [xfb - 0.2, ns * Rb * 0.55, zb + Rb * 1.1], 0.7);
      });
      if (ex === 'toolbox') M.part('TOOL BOX', () => {
        const T = M.box([xs0 + 0.2, ns * (W / 2 - 0.5) - 0.35, zf], [xs0 + 0.95, ns * (W / 2 - 0.5) + 0.35, zf + 0.45]);
        for (const k of ['+y', '-y', '+x']) { const f = T.f(k); if (f.on) K.accessHatch(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)]); }
        M.callout('TOOL BOX', 1, [xs0 + 0.6, ns * (W / 2 - 0.15), zf + 0.25], 0.6);
      });
    }
    // front steps by the buffer beam
    M.mirrorY(() => M.at(-0.45, W / 2 - 0.2, zf - 0.09, () => R.steps(M, { n: 2, w: 0.35, gap: Math.min(0.36, (zf - zBuf) / 2 + 0.1) })));

    // ---- side tanks and bunker, or a tender
    if (tank) {
      M.part('SIDE TANK', () => {
        const x1 = Math.min(xs0 - 0.2, xcf + 3.6 * kS), zt = zb + Rb * 0.3;
        M.mirrorY(() => {
          const S = M.extrude([[xcf, zf], [x1, zf], [x1, zt - 0.3], [x1 - 0.3, zt], [xcf, zt]], Rb * 0.92, W * 0.49, { plane: 'xz' });
          const f = S.f('+y');
          if (f.on) {
            const r = fr(M, f, [xcf + 0.15, 0, zf + 0.15], [x1 - 0.15, 0, zt - 0.15]);
            f.rivets(r[0], r[3], r[2], r[3], { pitch: 6 }); f.rivets(r[0], r[1], r[2], r[1], { pitch: 6 });
            f.rivets(r[0], r[1], r[0], r[3], { pitch: 6 }); f.rivets(r[2], r[1], r[2], r[3], { pitch: 6 });
            K.stencil(f, P.unitNo, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min(0.45, (r[3] - r[1]) * 0.4));
            f.hatch(r, { angle: 90, gap: 5 - 2.6 * f.tone, w: 0 });
          }
          M.at(x1 - 0.6, (Rb * 0.92 + W * 0.49) / 2, zt, () => { M.cyl(0.18, 0, 0.12); M.cyl(0.21, 0.12, 0.16, { isect: false }); });
        });
        M.callout('SIDE TANK', 2, [(xcf + x1) / 2, ns * W * 0.49, (zf + zt) / 2], 2.2);
        const Bk = M.box([xcr - bunker, -W * 0.47, zf], [xcr, W * 0.47, zf + 1.5 * kS]);
        for (const k of ['+y', '-y', '-x']) { const f = Bk.f(k); if (f.on) { const r = [-f.w / 2 + f.mOf(3), -f.h / 2 + f.mOf(3), f.w / 2 - f.mOf(3), f.h / 2 - f.mOf(3)]; f.rivets(r[0], r[3], r[2], r[3], { pitch: 6 }); skinPanel(f, r, 'plain'); } }
        // coal heap with rails
        M.loft([[xcr - bunker + 0.08, -W * 0.44, zf + 1.5 * kS], [xcr - 0.08, -W * 0.44, zf + 1.5 * kS], [xcr - 0.08, W * 0.44, zf + 1.5 * kS], [xcr - bunker + 0.08, W * 0.44, zf + 1.5 * kS]],
          [[xcr - bunker * 0.7, -W * 0.15, zf + 1.5 * kS + 0.35], [xcr - bunker * 0.3, -W * 0.15, zf + 1.5 * kS + 0.35], [xcr - bunker * 0.3, W * 0.15, zf + 1.5 * kS + 0.35], [xcr - bunker * 0.7, W * 0.15, zf + 1.5 * kS + 0.35]], { isect: false }).F.forEach(() => 0);
        M.callout('COAL BUNKER', 1, [xcr - bunker / 2, ns * W * 0.47, zf + 0.8], 1);
        M.at(xcr - bunker - 0.02, -W * 0.3 * ns, zf, () => M.rz(180, () => K.ladder(M, { h: 1.5 * kS + 0.2, w: 0.4 })));
        M.at(xcr - bunker, 0, zf + 1.2, () => M.rz(180, () => R.headlamp(M, { r: 0.12 * kS, visor: false })));
      });
    } else {
      M.part('TENDER', () => tender(M, P, { x0: xT0, x1: xT1, RT, axles: tenderAxles, spokeKind, zTop: zCab - 0.5, carryCar, ns }));
    }
    M.info.mass = [(tank ? xRear : xcr) + shift, -W / 2, RT, xs1 + shift, W / 2, zCab];
  });
  out.figure = figure;
  if (!tank && carryCar) out.extraBrief = ', with a handcar on the tender.';
  if (P.plow === 'none' && job === 'SNOW') out.extraBrief = '';
  return out;
}

// a tender behind a steam locomotive: tank, coal space, water hatch, bogies, rear beam
function tender(M, P, o) {
  const { W, kS, gauge, ns } = P;
  const { x0, x1, RT } = o;
  const Rw = 0.46 * kS;
  const L = x1 - x0;
  const bp = 1.7 * kS;
  const xb = [x0 + bp + 0.4, x1 - bp - 0.4];
  let bt = 0;
  for (const x of xb) M.at(x, 0, RT, () => { bt = R.bogie(M, { n: 2, pitch: 1.7 * kS, r: Rw, gauge, kind: 'leaf', wheel: o.spokeKind, nearSide: ns }).top; });
  const zF = RT + bt + 0.05, zT = zF + 0.28;
  const Fr = M.box([x0, -W / 2, zF], [x1, W / 2, zT]);
  const ff = Fr.f(ns > 0 ? '+y' : '-y');
  if (ff.on) ff.rivets(...fp(M, ff, [x0 + 0.1, 0, zT - 0.06]), ...fp(M, ff, [x1 - 0.1, 0, zT - 0.06]), { pitch: 7 });
  const zTop = Math.max(zT + 1.5, o.zTop);
  const T = M.box([x0 + 0.1, -W * 0.48, zT], [x1 - 0.3, W * 0.48, zTop]);
  for (const k of ['+y', '-y', '-x']) {
    const f = T.f(k);
    if (!f.on) continue;
    const g = f.grid(k === '-x' ? 2 : Math.max(2, Math.round(L / 1.8)), 2, { gap: 2.4 });
    g.forEach((r, i) => {
      if (k !== '-x' && r.j === 1 && r.i === Math.floor(g.length / 4)) { K.frame(f, r, { inset: 1.6 }); K.stencil(f, P.unitNo, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min(0.4, (r[3] - r[1]) * 0.45)); return; }
      skinPanel(f, r, P.skin === 'corr' ? 'rivet' : P.skin, i);
    });
  }
  // coal boards flaring out at the front, the coal heap, water hatch at the rear
  const xc0 = x1 - 0.3 - (x1 - x0) * 0.55;
  M.mirrorY(() => M.loft([[xc0, W * 0.46, zTop], [x1 - 0.3, W * 0.46, zTop], [x1 - 0.3, W * 0.48, zTop], [xc0, W * 0.48, zTop]],
    [[xc0, W * 0.5, zTop + 0.4], [x1 - 0.3, W * 0.5, zTop + 0.4], [x1 - 0.3, W * 0.52, zTop + 0.4], [xc0, W * 0.52, zTop + 0.4]], { isect: false }));
  M.box([xc0 - 0.04, -W * 0.5, zTop], [xc0, W * 0.5, zTop + 0.4], { isect: false });
  const coal = M.loft([[xc0 + 0.05, -W * 0.46, zTop], [x1 - 0.35, -W * 0.46, zTop], [x1 - 0.35, W * 0.46, zTop], [xc0 + 0.05, W * 0.46, zTop]],
    [[xc0 + 0.6, -W * 0.18, zTop + 0.55], [x1 - 1.0, -W * 0.18, zTop + 0.55], [x1 - 1.0, W * 0.18, zTop + 0.55], [xc0 + 0.6, W * 0.18, zTop + 0.55]], { isect: false });
  for (let i = 0; i < coal.F.length; i++) {
    const f = coal.f(i);
    if (f.on && f.front) {
      // lumps: short strokes and small polygons scattered by a fixed pattern
      const n = Math.floor(f.pxOf(f.w) * f.pxOf(f.h) / 90);
      for (let k = 0; k < Math.min(n, 120); k++) {
        const u = ((k * 0.618) % 1) * 2 - 1, v = ((k * 0.414 + 0.13) % 1) * 2 - 1;
        const x = u * f.w * 0.45, y = v * f.h * 0.45;
        if (f.contains(x, y)) f.ngon(x, y, f.mOf(1.4 + (k % 3)), 5, k * 37, { w: 0 });
      }
    }
  }
  M.at(x0 + 0.75, o.carryCar ? -ns * W * 0.28 : 0, zTop, () => { const H = M.cyl(0.38 * kS, 0, 0.18); M.cyl(0.42 * kS, 0.18, 0.24, { isect: false }); if (H.top.on) H.top.circle(0, 0, 0.2 * kS, { w: 1 }); });
  M.callout('WATER HATCH', 1, [x0 + 0.9, ns * 0.38 * kS, zTop + 0.2], 0.9);
  M.callout('COAL SPACE', 1, [(xc0 + x1) / 2, ns * W * 0.2, zTop + 0.4], 1.2);
  M.callout('TENDER', 1, [(x0 + x1) / 2, ns * W * 0.48, (zT + zTop) / 2], 2);
  // rear: ladder, lamp, buffer beam; handrails at the corners
  M.at(x0 + 0.08, ns * W * 0.28, zT, () => M.rz(180, () => K.ladder(M, { h: zTop - zT + 0.3, w: 0.42 })));
  M.at(x0 + 0.08, -ns * W * 0.28, zTop - 0.3, () => M.rz(180, () => R.headlamp(M, { r: 0.12 * kS })));
  M.at(x0, 0, 0, () => M.rz(180, () => R.bufferBeam(M, { w: W * 0.98, z: RT + 0.82 * kS + 0.18, coupler: P.coupler })));
  M.mirrorY(() => {
    R.handrail(M, [x1 - 0.2, W * 0.48 + 0.07, zT + 0.2], [x1 - 0.2, W * 0.48 + 0.07, zTop - 0.1], [0, -0.07, 0], { pitch: 3 });
    M.at(x1 - 0.55, W / 2 - 0.2, zF, () => R.steps(M, { n: 2, w: 0.38, gap: 0.34 }));
  });
  if (o.carryCar) {
    M.part('HANDCAR', () => {
      M.at(x0 + 1.75, ns * 0.32, zTop + 0.01, () => R.handcar(M, { gauge: Math.min(gauge, 1.0), tilt: 14 }));
      M.callout('INSPECTION HANDCAR', 1, [x0 + 1.9, 0, zTop + 0.8], 2.5);
    });
  }
}

// ====================================================================== diesel
function diesel(M, P) {
  const { W, kS, job, gauge, ns } = P;
  const hood = job === 'MINE' ? true : M.chance(0.42);
  const L = (job === 'MINE' ? M.r(10, 12.5) : job === 'EXPRESS' || job === 'SLEEPER' ? M.r(17, 20) : M.r(14.5, 17.5)) * kS;
  const na = job === 'MINE' ? 2 : M.pick([2, 3, 3]);
  const Rw = 0.5 * kS;
  const pitch = (na === 2 ? M.r(2.1, 2.6) : M.r(1.75, 1.95)) * kS;
  const kind = M.wpick([[3, 'coil'], [1, 'leaf']]);
  const nose = M.wpick([[3, 'bulldog'], [2, 'slant'], [1.5, 'bullet']]);
  const dbl = !hood && M.chance(0.3);
  const fans = M.ri(2, 4);
  const pool = M.shuffle(['horns', 'blister', 'stacks', 'mars', 'bell', 'antenna']).slice(0, M.ri(2, 4));
  const doors = M.ri(5, 8);
  const fuelBox = M.chance(0.5);
  const cabFront = M.r(0.2, 0.32);
  const out = { hood, cars: M.ri(5, 12), speed: job === 'EXPRESS' ? M.ri(14, 18) * 10 : job === 'MINE' ? M.ri(4, 6) * 10 : M.ri(10, 13) * 10 };
  out.wheels = na === 2 ? 'BO-BO' : 'CO-CO';
  out.wheelsLabel = 'AXLES';
  out.mass = Math.round(L * 6.2 * kS * kS * (na === 3 ? 1.15 : 1));
  out.power = L * 120 * kS * kS * (na === 3 ? 1.3 : 1);
  const RT = R.trackTop(P.ballast);
  const xR = -L / 2, xF = L / 2;
  const plowL = P.plow === 'rotary' ? 2.85 : P.plow === 'wedge' ? 1.7 : 0.6;
  const shift = -plowL / 2 + (dbl ? 0 : 0);
  let figure = null;
  M.at(shift, 0, 0, () => {
    R.track(M, { gauge, x0: xR - 1.2, x1: xF + plowL + 0.8, ballast: P.ballast });
    // ---- bogies
    let bt = 0, bl = 0;
    const tmp = (n, p) => (n - 1) * p + 2 * Rw + 0.7;
    bl = tmp(na, pitch);
    const xb = [xR + bl / 2 + 0.8, xF - bl / 2 - 0.8];
    M.part('BOGIE', () => {
      for (const x of xb) M.at(x, 0, RT, () => { bt = R.bogie(M, { n: na, pitch, r: Rw, gauge, kind, wheel: 'disc', nearSide: ns }).top; });
      M.callout('BOGIE', 2, [xb[1], ns * (R.wheelY(gauge) + 0.3), RT + Rw + 0.5], 2.4);
      M.callout('AXLE BOX', 2 * na * 2, [xb[0] - (na - 1) * pitch / 2, ns * (R.wheelY(gauge) + 0.32), RT + Rw], 1);
      M.info.centers = [];
      for (const x of xb) for (let i = 0; i < na; i++) { const ax = x - (na - 1) * pitch / 2 + i * pitch + shift; M.info.centers.push([[ax, -1.2, RT + Rw], [ax, 1.2, RT + Rw]]); }
    });
    const zd = RT + bt + 0.4;
    // ---- underframe, fuel tank, ends
    M.part('UNDERFRAME', () => {
      const F = M.box([xR, -W / 2, zd - 0.38], [xF, W / 2, zd]);
      for (const k of ['+y', '-y']) { const f = F.f(k); if (f.on) { f.rivets(-f.w / 2 + 0.1, f.h / 2 - 0.06, f.w / 2 - 0.1, f.h / 2 - 0.06, { pitch: 7 }); f.line(-f.w / 2, -f.h / 2 + 0.1, f.w / 2, -f.h / 2 + 0.1, { w: 0 }); } }
      const deck = F.f('+z');
      if (deck.on && hood) deck.hatch(deck.box, { angle: 0, gap: 4, w: 0 });
      const lt = xb[1] - xb[0] - bl - 0.4;
      const zt0 = RT + 0.45, zt1 = zd - 0.38;
      if (fuelBox) {
        const T = M.box([-lt / 2, -W * 0.42, zt0], [lt / 2, W * 0.42, zt1]);
        const f = T.f(ns > 0 ? '+y' : '-y');
        if (f.on) { const g = f.grid(3, 1, { gap: 2.4 }); g.forEach((r) => skinPanel(f, r, 'plain')); f.circle(...fp(M, f, [lt * 0.3, 0, (zt0 + zt1) / 2]), 0.08, { w: 1 }); }
      } else {
        const ry = W * 0.4, rz = (zt1 - zt0) / 2;
        const pr = [];
        for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * Math.PI; pr.push([Math.cos(a) * ry, zt0 + rz + Math.sin(a) * rz]); }
        const T = M.extrude(pr, -lt / 2, lt / 2, { plane: 'yz', smoothDeg: 30 });
        void T;
        for (const x of [-lt * 0.3, lt * 0.3]) M.box([x - 0.05, -ry - 0.02, zt0 - 0.02], [x + 0.05, ry + 0.02, zt1], { isect: false });
      }
      M.at(lt * 0.25, ns * W * 0.42, zt1 - 0.1, () => M.cyl(0.07, 0, 0.12, { axis: 'y', isect: false }));
      for (const s of [1, -1]) M.at(0, s * W * 0.46, zt1 - 0.18, () => M.cyl(0.13, -lt * 0.45, lt * 0.45, { axis: 'x', isect: false }));
      M.callout('FUEL TANK', 1, [0, ns * W * 0.42, (zt0 + zt1) / 2], 2);
      M.callout('AIR RESERVOIR', 2, [lt * 0.3, ns * W * 0.46 + ns * 0.12, zt1 - 0.18], 0.7);
      // ends: pilots, couplers, steps
      for (const e of [1, -1]) {
        M.at(e > 0 ? xF : xR, 0, 0, () => M.rz(e > 0 ? 0 : 180, () => {
          if (!(e > 0 && P.plow !== 'none')) {
            const pz = zd - 0.38;
            const S = M.loft([[0, -W * 0.48, pz], [0, W * 0.48, pz], [0, W * 0.48, RT + 0.12], [0, -W * 0.48, RT + 0.12]],
              [[0.04, -W * 0.48, pz], [0.04, W * 0.48, pz], [0.42, W * 0.36, RT + 0.12], [0.42, -W * 0.36, RT + 0.12]], { isect: false });
            for (let i = 0; i < S.F.length; i++) { const f = S.f(i); if (f.on && f.front && f.w > 1) { const r = f.box; for (let k = 0; k < 4; k++) { const x = r[0] + f.w * (0.2 + 0.2 * k); f.rect(x - 0.06, r[1] + f.h * 0.25, x + 0.06, r[3] - f.h * 0.25, { w: 1 }); } } }
          }
          R.coupler(M, { kind: 'knuckle' });
          M.at(0, 0, zd - 0.6, () => R.coupler(M, { kind: 'knuckle' }));
          M.mirrorY(() => {
            M.at(-0.35, W / 2 - 0.25, zd - 0.38, () => R.steps(M, { n: 3, w: 0.42, gap: Math.min(0.33, (zd - RT - 0.5) / 3) }));
            R.handrail(M, [0.04, W / 2 - 0.05, zd + 0.15], [0.04, W / 2 - 0.05, zd + 1.0], [-0.08, 0, 0], { pitch: 3 });
            M.pipe([[0, W * 0.2, zd - 0.6], [0.2, W * 0.22, zd - 0.75], [0.22, W * 0.22, zd - 1.0]], 0.025, { isect: false, seg: 6 });
          });
        }));
      }
      if (P.plow !== 'none') M.at(xF, 0, 0, () => pilot(M, P, P.plow, RT, zd - 0.6));
      M.callout('PILOT', 2, [xF + 0.25, ns * W * 0.3, RT + 0.6], 0.8);
    });

    // ---- body
    if (!hood) {
      const H = 2.75 * kS, Wb = W - 0.04;
      // nose profile in (x, z) above the deck, front at xF
      const pts = [];
      const zz = (z) => zd + z * kS;
      let ws = 0;
      pts.push([xF - 0.05, zz(0)]);
      const curve = (cps, n) => { for (let i = 1; i <= n; i++) { const t = i / n; const a = cps[0], b = cps[1], c = cps[2]; pts.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]]); } };
      if (nose === 'bulldog') {
        curve([[xF - 0.05, zz(0)], [xF + 0.45, zz(0.3)], [xF + 0.35, zz(1.0)]], 5);
        curve([[xF + 0.35, zz(1.0)], [xF + 0.2, zz(1.45)], [xF - 0.7, zz(1.75)]], 5);
        ws = pts.length - 1;
        pts.push([xF - 1.15, zz(2.4)]);
        curve([[xF - 1.15, zz(2.4)], [xF - 1.45, zz(2.75)], [xF - 2.1, zz(2.75)]], 4);
      } else if (nose === 'slant') {
        pts.push([xF + 0.05, zz(0.15)], [xF + 0.05, zz(1.2)]);
        curve([[xF + 0.05, zz(1.2)], [xF + 0.04, zz(1.45)], [xF - 0.25, zz(1.6)]], 3);
        ws = pts.length - 1;
        pts.push([xF - 1.0, zz(2.45)]);
        curve([[xF - 1.0, zz(2.45)], [xF - 1.25, zz(2.75)], [xF - 1.7, zz(2.75)]], 3);
      } else {
        curve([[xF - 0.05, zz(0)], [xF + 0.9, zz(0.15)], [xF + 0.6, zz(1.1)]], 6);
        ws = pts.length - 1;
        pts.push([xF - 0.5, zz(2.3)]);
        curve([[xF - 0.5, zz(2.3)], [xF - 0.9, zz(2.75)], [xF - 1.9, zz(2.75)]], 4);
      }
      if (dbl) {
        const fpts = pts.slice().reverse().map(([x, z]) => [-x, z]);
        pts.push(...fpts);
      } else {
        pts.push([xR + 0.25, zd + H], [xR + 0.05, zd + H - 0.25], [xR + 0.05, zd]);
      }
      const B = M.part('CARBODY', () => M.extrude(pts, -Wb / 2, Wb / 2, { plane: 'xz', smoothDeg: 16 }));
      const f = B.f(ns > 0 ? '+y' : '-y');
      const cabX = xF - 2.9;
      if (f.on) {
        // cab side window and door, porthole band, louver band, radiator grille
        windowAt(f, fr(M, f, [xF - 2.35, 0, zz(1.55)], [xF - 1.35, 0, zz(2.25)]), { bar: true });
        K.door(M, f, ...fp(M, f, [cabX - 0.1, 0, zz(1.05)]), 0.7, 1.95);
        const x0 = dbl ? -cabX + 0.6 : xR + 0.5, x1 = cabX - 0.8;
        const n = Math.max(3, Math.round((x1 - x0) / 1.6));
        for (let i = 0; i < n; i++) {
          const a = x0 + (x1 - x0) * i / n + 0.05, b = x0 + (x1 - x0) * (i + 1) / n - 0.05;
          const rU = fr(M, f, [a, 0, zz(1.75)], [b, 0, zz(2.4)]);
          const rL = fr(M, f, [a, 0, zz(0.15)], [b, 0, zz(1.65)]);
          if (i % 3 === 1) K.porthole(f, (rU[0] + rU[2]) / 2, (rU[1] + rU[3]) / 2, Math.min(rU[3] - rU[1], rU[2] - rU[0]) * 0.36);
          else if (i % 3 === 2) K.louver(f, rU);
          else skinPanel(f, rU, P.skin === 'corr' ? 'corr' : 'plain');
          skinPanel(f, rL, P.skin, i);
        }
        const nr = fr(M, f, [x0 + (x1 - x0) * 0.35, 0, zz(0.45)], [x0 + (x1 - x0) * 0.65, 0, zz(1.25)]);
        K.stencil(f, P.unitNo, (nr[0] + nr[2]) / 2, (nr[1] + nr[3]) / 2, Math.min(0.55, nr[3] - nr[1]) * 0.75);
        f.line(...fp(M, f, [xR + 0.1, 0, zz(1.7)]), ...fp(M, f, [xF - 0.3, 0, zz(1.7)]), { w: 1 });
      }
      // windshield on the strip after the nose curve
      const wsf = B.f('s' + ws);
      if (wsf.on && wsf.front) {
        const b = wsf.box, m = wsf.mOf(3);
        for (const s of [-1, 1]) windowAt(wsf, [s > 0 ? 0.08 : b[0] + 0.25, b[1] + m, s > 0 ? b[2] - 0.25 : -0.08, b[3] - m], { angle: 30 });
      }
      M.callout('CAB', 1, [xF - 1.8, ns * Wb / 2, zz(1.9)], 1.4);
      M.callout('CARBODY', 1, [0, ns * Wb / 2, zz(1.0)], 2);
      // nose: headlamp in the bulge, number boards
      M.part('HEADLAMP', () => {
        const hx = nose === 'slant' ? xF + 0.2 : nose === 'bullet' ? xF + 0.5 : xF + 0.46;
        M.at(hx, 0, zz(nose === 'bullet' ? 0.8 : 0.95), () => R.headlamp(M, { r: 0.18 * kS, visor: false }));
        if (pool.includes('mars')) M.at(xF - 1.95, 0, zz(2.75) + 0.2, () => M.ry(-10, () => { M.box([-0.3, -0.5, -0.22], [0.0, 0.5, -0.12], { isect: false }); R.headlamp(M, { r: 0.13 * kS, visor: false }); M.at(0, 0.38, 0, () => R.headlamp(M, { r: 0.11 * kS, visor: false })); M.at(0, -0.38, 0, () => R.headlamp(M, { r: 0.11 * kS, visor: false })); }));
        M.callout('HEADLAMP', 1, [hx + 0.1, 0, zz(0.95)], 1.4);
      });
      roofGear(M, P, { x0: dbl ? -cabX : xR + 0.6, x1: cabX - 0.4, z: zd + H, fans, pool, w: Wb * 0.7 });
      figure = [xR + 1.0 + shift, ns * (W / 2 + 1.2)];
      M.info.mass = [xR + shift, -W / 2, RT, xF + shift, W / 2, zd + H];
    } else {
      // hood unit: long hood, cab, short hood, walkway railings
      const Wh = W * 0.62, Hh = 2.25 * kS, Hc = 2.95 * kS, Hs = 1.65 * kS;
      const lc = 2.6 * kS;
      const xc0 = xF - 1.4 * kS - lc * (1 + cabFront), xc1 = xc0 + lc;
      const hoodProf = (w, h) => [[-w / 2, 0], [w / 2, 0], [w / 2, h - 0.22], [w / 2 - 0.22, h], [-w / 2 + 0.22, h], [-w / 2, h - 0.22]];
      let LH;
      M.part('LONG HOOD', () => {
        LH = M.at(0, 0, zd, () => M.extrude(hoodProf(Wh, Hh), xR + 0.7, xc0, { plane: 'yz' }));
        for (const k of ['s1', 's5']) {
          const f = LH.f(k);
          if (!f.on) continue;
          const g = f.grid(doors, 1, { gap: 2.6 });
          g.forEach((r, i) => {
            const mr = [r[0], r[1] + f.h * 0.06, r[2], r[3] - f.h * 0.06];
            if (i % 3 === 0) K.louver(f, [mr[0], mr[1] + (mr[3] - mr[1]) * 0.55, mr[2], mr[3]]);
            K.frame(f, mr, { inset: 1.4 });
            f.rect(mr[0] + (mr[2] - mr[0]) * 0.08, mr[1] + (mr[3] - mr[1]) * 0.42, mr[0] + (mr[2] - mr[0]) * 0.14, mr[1] + (mr[3] - mr[1]) * 0.52, { w: 1 });
            if (f.tone > 0.3) f.hatch([mr[0] + f.mOf(3), mr[1] + f.mOf(3), mr[2] - f.mOf(3), mr[1] + (mr[3] - mr[1]) * 0.5], { angle: 90, gap: 4.4 - 2 * f.tone, w: 0 });
          });
        }
        const lb = LH.f('-x');
        if (lb.on) { K.louver(lb, [-lb.w * 0.35, 0, lb.w * 0.35, lb.h * 0.4]); K.stencil(lb, P.unitNo, 0, -lb.h * 0.25, 0.22); }
        M.callout('ENGINE HOOD', 1, [(xR + xc0) / 2, ns * Wh / 2, zd + Hh * 0.5], 2);
      });
      M.part('CAB', () => {
        const C = M.box([xc0, -W * 0.47, zd], [xc1, W * 0.47, zd + Hc]);
        for (const k of ['+y', '-y']) {
          const f = C.f(k);
          if (!f.on) continue;
          windowAt(f, fr(M, f, [xc0 + 0.25, 0, zd + Hc * 0.55], [xc0 + lc * 0.48, 0, zd + Hc - 0.25]), { bar: true });
          windowAt(f, fr(M, f, [xc0 + lc * 0.55, 0, zd + Hc * 0.55], [xc1 - 0.2, 0, zd + Hc - 0.25]));
          const nr = fr(M, f, [xc0 + 0.25, 0, zd + 0.25], [xc1 - 0.2, 0, zd + Hc * 0.48]);
          K.frame(f, nr, { inset: 1.6 });
          K.stencil(f, P.unitNo, (nr[0] + nr[2]) / 2, (nr[1] + nr[3]) / 2, Math.min(0.5, (nr[3] - nr[1]) * 0.5));
        }
        const cf = C.f('+x');
        if (cf.on) for (const s of [1, -1]) windowAt(cf, fr(M, cf, [xc1, s * W * 0.06, zd + Hs + 0.25], [xc1, s * W * 0.4, zd + Hc - 0.25]), { angle: 40 });
        const cb = C.f('-x');
        if (cb.on) for (const s of [1, -1]) windowAt(cb, fr(M, cb, [xc0, s * (Wh / 2 + 0.1), zd + Hh + 0.1], [xc0, s * W * 0.44, zd + Hc - 0.25]));
        M.box([xc0 - 0.15, -W * 0.5, zd + Hc], [xc1 + 0.15, W * 0.5, zd + Hc + 0.1], { isect: false });
        M.callout('CAB', 1, [(xc0 + xc1) / 2, ns * W * 0.47, zd + Hc * 0.75], 1.6);
      });
      M.part('SHORT HOOD', () => {
        const S = M.at(0, 0, zd, () => M.extrude(hoodProf(Wh * 0.95, Hs), xc1, xF - 0.65, { plane: 'yz' }));
        const nf = S.f('+x');
        if (nf.on) { K.louver(nf, [-nf.w * 0.3, -nf.h * 0.4, nf.w * 0.3, nf.h * 0.05]); }
        for (const k of ['s1', 's5']) { const f = S.f(k); if (f.on) f.grid(2, 1, { gap: 2.6 }).forEach((r) => K.frame(f, [r[0], r[1] + f.h * 0.06, r[2], r[3] - f.h * 0.06], { inset: 1.4 })); }
        M.at(xF - 0.62, 0, zd + Hs - 0.25, () => R.headlamp(M, { r: 0.15 * kS }));
        for (const s of [1, -1]) M.at(xF - 0.62, s * Wh * 0.3, zd + Hs - 0.25, () => M.box([0, -0.18, -0.09], [0.06, 0.18, 0.09], { isect: false }));
        M.callout('HEADLAMP', 1, [xF - 0.4, 0, zd + Hs - 0.25], 1.3);
      });
      M.part('WALKWAY RAILING', () => {
        M.mirrorY(() => {
          K.railing(M, [[xR + 0.25, W / 2 - 0.06, zd], [xc0 - 0.1, W / 2 - 0.06, zd]], { h: 0.95, posts: 1.6 });
          K.railing(M, [[xc1 + 0.1, W / 2 - 0.06, zd], [xF - 0.2, W / 2 - 0.06, zd], [xF - 0.2, W * 0.28, zd]], { h: 0.95, posts: 1.6 });
        });
        K.railing(M, [[xR + 0.25, W / 2 - 0.06, zd], [xR + 0.25, W * 0.3, zd]], { h: 0.95 });
        M.callout('WALKWAY RAILING', 2, [(xR + xc0) / 2, ns * (W / 2 - 0.06), zd + 0.95], 1.2);
      });
      roofGear(M, P, { x0: xR + 0.9, x1: xc0 - 0.3, z: zd + Hh, fans, pool, w: Wh * 0.8 });
      if (pool.includes('mars')) M.at(xc1 + 0.1, 0, zd + Hc - 0.2, () => R.headlamp(M, { r: 0.12 * kS }));
      figure = [xR - 0.6 + shift, ns * (W / 2 + 1.2)];
      M.info.mass = [xR + shift, -W / 2, RT, xF + shift, W / 2, zd + Hc];
    }
  });
  out.figure = figure;
  return out;
}

// roof fans, horns, dynamic brake blister, stacks, bell, antenna
function roofGear(M, P, o) {
  const { x0, x1, z, fans, pool, w } = o;
  const kS = P.kS;
  M.part('RADIATOR FAN', () => {
    const r = Math.min(w / 2 - 0.05, 0.55 * kS);
    for (let i = 0; i < fans; i++) {
      const x = x0 + r + 0.2 + i * (2 * r + 0.25);
      const F = M.at(x, 0, z, () => M.cyl(r, -0.05, 0.14));
      if (F.top.on) {
        const f = F.top;
        f.circle(0, 0, r * 0.9, { w: 1 });
        f.circle(0, 0, r * 0.18, { w: 1 });
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; f.line(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, { w: 0 }); }
        f.hatch(circlePts(0, 0, r * 0.88, r * 0.88, 24), { angle: 0, gap: 2.2, w: 0, holes: [circlePts(0, 0, r * 0.2, r * 0.2, 12)] });
      }
    }
    M.callout('RADIATOR FAN', fans, [x0 + r + 0.2, 0, z + 0.14], 1.6);
  });
  const xm = (x0 + x1) / 2;
  if (pool.includes('blister')) M.part('BRAKE GRID', () => {
    const b = M.box([x1 - 2.4, -w * 0.4, z - 0.05], [x1 - 0.3, w * 0.4, z + 0.35]);
    const f = b.f('+z');
    if (f.on) for (const r of f.grid(4, 1, { gap: 2.4 })) K.louver(f, r);
    for (const k of ['+y', '-y']) { const s = b.f(k); if (s.on) s.hatch(s.box, { angle: 0, gap: 2.2, w: 0 }); }
    M.callout('BRAKE GRID', 1, [x1 - 1.3, 0, z + 0.35], 1);
  });
  if (pool.includes('stacks')) M.part('EXHAUST STACK', () => {
    for (const dx of [-0.35, 0.35]) M.at(xm + dx, 0, z, () => { M.box([-0.18, -0.1, -0.05], [0.18, 0.1, 0.25]); const S = M.cyl(0.08, 0.25, 0.45, { isect: false }); if (S.top.on) S.top.hatch(circlePts(0, 0, 0.06, 0.06, 10), { angle: 45, gap: 1, w: 0 }); });
    M.callout('EXHAUST STACK', 2, [xm, 0, z + 0.4], 0.8);
  });
  if (pool.includes('horns')) M.part('AIR HORN', () => {
    M.at(x1 + 0.1, 0, z, () => {
      M.box([-0.08, -0.2, 0], [0.08, 0.2, 0.12]);
      M.at(0, -0.12, 0.2, () => K.horn(M, { r: 0.11 }));
      M.at(0, 0.12, 0.2, () => M.rz(180, () => K.horn(M, { r: 0.12 })));
      M.at(0.05, 0, 0.3, () => K.horn(M, { r: 0.09 }));
      for (const y of [-0.12, 0.12]) M.box([-0.03, y - 0.03, 0.1], [0.03, y + 0.03, 0.2], { isect: false });
    });
    M.callout('AIR HORN', 3, [x1 + 0.1, 0, z + 0.25], 0.9);
  });
  if (pool.includes('bell')) M.part('BELL', () => {
    M.at(x1 - 0.2, P.ns * w * 0.3, z, () => { M.box([-0.05, -0.12, 0], [0.05, 0.12, 0.3], { isect: false }); M.at(0, 0, 0.05, () => M.lathe([[0.14, 0], [0.12, 0.05], [0.09, 0.17], [0, 0.24]], { isect: false })); });
  });
  if (pool.includes('antenna')) M.part('ANTENNA', () => {
    M.at(xm - 1.0, -P.ns * w * 0.25, z, () => K.whip(M, { h: 1.6 * kS, lean: 10 }));
    M.callout('RADIO ANTENNA', 1, [xm - 1.0, -P.ns * w * 0.25, z + 0.3], 0.5);
  });
}

// ====================================================================== electric
function electric(M, P) {
  const { W, kS, job, gauge, ns } = P;
  const nosed = M.chance(0.38);
  const L = (job === 'MINE' ? M.r(10, 12) : M.r(14, 18)) * kS;
  const rods = nosed && M.chance(0.6);
  const na = rods ? 3 : job === 'MINE' ? 2 : M.pick([2, 2, 3]);
  const Rw = (rods ? 0.62 : 0.5) * kS;
  const pitch = (rods ? 2 * Rw + 0.28 : na === 2 ? M.r(2.2, 2.6) : M.r(1.8, 1.95)) * (rods ? 1 : kS);
  const kind = M.wpick([[2, 'coil'], [2, 'leaf']]);
  const nP = job === 'MINE' ? 1 : M.pick([1, 2, 2]);
  const pkind = M.wpick([[3, 'diamond'], [2, 'single']]);
  const balcony = !nosed && M.chance(0.55);
  const pool = M.shuffle(['breaker', 'resistor', 'horns', 'bus', 'lamps', 'whistle']).slice(0, M.ri(2, 4));
  const ang = M.r(0, 360);
  const out = { nosed, cars: M.ri(5, 12), speed: job === 'EXPRESS' ? M.ri(14, 17) * 10 : job === 'MINE' ? M.ri(3, 6) * 10 : M.ri(9, 12) * 10 };
  out.wheels = rods ? '1-C-C-1' : na === 2 ? 'BO-BO' : 'CO-CO';
  out.wheelsLabel = 'AXLES';
  out.mass = Math.round(L * 6.8 * kS * kS * (na === 3 ? 1.15 : 1));
  out.power = L * 150 * kS * kS * (na === 3 ? 1.3 : 1);
  out.extraBrief = nP === 2 ? ' under two pantographs.' : '';
  const RT = R.trackTop(P.ballast);
  const xR = -L / 2, xF = L / 2;
  const plowL = P.plow === 'rotary' ? 2.85 : P.plow === 'wedge' ? 1.7 : 0.6;
  const shift = -plowL / 2;
  let figure = null;
  M.at(shift, 0, 0, () => {
    R.track(M, { gauge, x0: xR - 1.2, x1: xF + plowL + 0.8, ballast: P.ballast });
    const bl = (na - 1) * pitch + 2 * Rw + 0.7;
    const xb = [xR + bl / 2 + 0.7, xF - bl / 2 - 0.7];
    let bt = 0;
    M.info.centers = [];
    M.part(rods ? 'DRIVING WHEEL' : 'BOGIE', () => {
      if (!rods) {
        for (const x of xb) M.at(x, 0, RT, () => { bt = R.bogie(M, { n: na, pitch, r: Rw, gauge, kind, wheel: M.decorOn ? 'disc' : 'disc', nearSide: ns }).top; });
        M.callout('BOGIE', 2, [xb[0], ns * (R.wheelY(gauge) + 0.3), RT + Rw + 0.5], 2.4);
        for (const x of xb) for (let i = 0; i < na; i++) { const ax = x - (na - 1) * pitch / 2 + i * pitch + shift; M.info.centers.push([[ax, -1.2, RT + Rw], [ax, 1.2, RT + Rw]]); }
      } else {
        // two rod-coupled trucks with a jackshaft each, a pony axle at each end
        const yW = R.wheelY(gauge);
        const rc = Rw * 0.4;
        for (const e of [1, -1]) {
          const xc = e * (L / 2 - bl / 2 - 1.3);
          const xs = [0, 1, 2].map((i) => xc + (i - 1) * pitch);
          for (const x of xs) M.at(x, 0, RT + Rw, () => { M.mirrorY((s) => M.at(0, yW, 0, () => R.railWheel(M, { r: Rw, kind: 'spoke', crank: { rc, ang: ang + (s > 0 ? 0 : 90) }, cw: true, simple: s !== ns, spokes: 12 }))); M.cyl(Rw * 0.13, -yW, yW, { axis: 'y', isect: false }); M.info.centers.push([[x + shift, -1.2, RT + Rw], [x + shift, 1.2, RT + Rw]]); });
          // jackshaft above between the outer pair
          const xj = xc - e * pitch * 0.5, zj = RT + 2 * Rw + 0.15;
          M.mirrorY((s) => {
            const a = ang + (s > 0 ? 0 : 90);
            const pins = xs.map((x) => [x + Math.cos(a * D2R) * rc, yW + R.WHEEL_W / 2 + Math.min(0.1, Rw * 0.12) + 0.08, RT + Rw + Math.sin(a * D2R) * rc]);
            for (let i = 0; i + 1 < pins.length; i++) rodBar(M, pins[i], pins[i + 1], 0.05, 0.12);
            const D = M.at(xj, yW + 0.12, zj, () => M.cyl(Rw * 0.62, -0.06, 0.06, { axis: 'y', isect: false }));
            if (D.top.on) D.top.hatch(circlePts(0, 0, Rw * 0.55, Rw * 0.55, 20), { angle: 45, gap: 2.4, w: 0 });
            const jp = [xj + Math.cos(a * D2R) * rc, pins[0][1] + 0.07, zj + Math.sin(a * D2R) * rc];
            rodBar(M, jp, [pins[1][0], pins[1][1] + 0.07, pins[1][2]], 0.05, 0.13);
            // outside frame plate above the wheels
            const OF = M.box([xs[0] - Rw - 0.3, yW + 0.24, RT + 2 * Rw + 0.05], [xs[2] + Rw + 0.3, yW + 0.32, RT + 2 * Rw + 0.7], { isect: false });
            const of = OF.f('+y');
            if (of.on) { of.rivets(-of.w / 2 + 0.08, of.h / 2 - 0.06, of.w / 2 - 0.08, of.h / 2 - 0.06, { pitch: 6 }); for (const x of [xs[0] - pitch * 0.5, xs[1] - pitch * 0.5, xs[2] + pitch * 0.5]) of.circle(...fp(M, of, [x, 0, RT + 2 * Rw + 0.38]), 0.12, { w: 1 }); }
          });
          // pony axle at the outer end
          const xp = xc + e * (pitch + Rw + 0.75);
          M.at(xp, 0, RT + 0.42 * kS, () => R.wheelset(M, { r: 0.42 * kS, gauge, kind: 'disc', nearSide: ns }));
        }
        bt = 2 * Rw + 0.62;
        M.callout('DRIVING WHEEL', 12, [xR + bl / 2 + 1.3, ns * (yW + 0.08), RT + Rw * 1.5], 3);
        M.callout('JACKSHAFT', 2, [xF - bl / 2 - 1.3 + pitch * 0.5, ns * (yW + 0.2), RT + 2 * Rw + 0.15], 1.6);
        M.callout('COUPLING ROD', 4, [xF - bl / 2 - 1.3, ns * (yW + 0.2), RT + Rw], 1.8);
      }
    });
    const zd = RT + bt + 0.4;
    M.part('UNDERFRAME', () => {
      const F = M.box([xR, -W / 2, zd - 0.36], [xF, W / 2, zd]);
      for (const k of ['+y', '-y']) { const f = F.f(k); if (f.on) f.rivets(-f.w / 2 + 0.1, f.h / 2 - 0.06, f.w / 2 - 0.1, f.h / 2 - 0.06, { pitch: 7 }); }
      if (!rods) {
        const lt = xb[1] - xb[0] - bl - 0.5;
        if (lt > 1) {
          const T = M.box([-lt / 2, -W * 0.4, RT + 0.6], [lt / 2, W * 0.4, zd - 0.36]);
          const f = T.f(ns > 0 ? '+y' : '-y');
          if (f.on) f.grid(3, 1, { gap: 2.4 }).forEach((r) => K.louver(f, r));
          M.callout('TRANSFORMER', 1, [0, ns * W * 0.4, (RT + 0.6 + zd - 0.36) / 2], 1.6);
        }
      }
      for (const e of [1, -1]) M.at(e > 0 ? xF : xR, 0, 0, () => M.rz(e > 0 ? 0 : 180, () => {
        if (!(e > 0 && P.plow !== 'none')) R.bufferBeam(M, { w: W * 0.98, z: zd - 0.55, h: 0.36, coupler: P.coupler, label: e > 0 ? P.unitNo : '' });
        M.mirrorY(() => M.at(-0.4, W / 2 - 0.25, zd - 0.36, () => R.steps(M, { n: 3, w: 0.42, gap: Math.min(0.33, (zd - RT - 0.5) / 3) })));
      }));
      if (P.plow !== 'none') M.at(xF, 0, 0, () => pilot(M, P, P.plow, RT, zd - 0.6));
      M.callout(P.coupler === 'knuckle' ? 'KNUCKLE COUPLER' : 'BUFFER', P.coupler === 'knuckle' ? 2 : 4, [xF + 0.4, ns * 0.875, zd - 0.55], 1);
    });
    // body profile across (y, z): straight sides, rounded roof shoulders
    const H = 2.7 * kS, Wb = W - 0.06, rr = 0.42 * kS;
    const prof = (w, h) => {
      const p = [[-w / 2, 0], [w / 2, 0], [w / 2, h - rr]];
      for (let i = 1; i <= 4; i++) { const a = (90 * i / 4) * D2R; p.push([w / 2 - rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr]); }
      for (let i = 0; i <= 3; i++) { const a = (90 + 90 * i / 4) * D2R; p.push([-w / 2 + rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr]); }
      p.push([-w / 2, h - rr]);
      return p;
    };
    const sideK = ns > 0 ? 's1' : 's' + (prof(1, 1).length - 1);
    let xb0, xb1;
    if (!nosed) { xb0 = xR + (balcony ? 1.1 : 0.05); xb1 = xF - (balcony ? 1.1 : 0.05); } else { xb0 = -L * 0.24; xb1 = L * 0.24; }
    M.part('CARBODY', () => {
      const B = M.at(0, 0, zd, () => M.extrude(prof(Wb, H), xb0, xb1, { plane: 'yz', smoothDeg: 30 }));
      const f = B.f(sideK);
      if (f.on) {
        const n = Math.max(4, Math.round((xb1 - xb0) / 1.5));
        for (let i = 0; i < n; i++) {
          const a = xb0 + (xb1 - xb0) * i / n + 0.04, b = xb0 + (xb1 - xb0) * (i + 1) / n - 0.04;
          const end = i === 0 || i === n - 1;
          const rU = fr(M, f, [a, 0, zd + H * 0.56], [b, 0, zd + H - rr - 0.05]);
          const rL = fr(M, f, [a, 0, zd + 0.1], [b, 0, zd + H * 0.52]);
          if (end) {
            windowAt(f, rU, { bar: true });
            const dc = fr(M, f, [a + 0.1, 0, zd + 0.1], [b - 0.1, 0, zd + H * 0.5]);
            K.frame(f, dc);
            f.rect(dc[0] + (dc[2] - dc[0]) * 0.75, (dc[1] + dc[3]) / 2, dc[0] + (dc[2] - dc[0]) * 0.85, (dc[1] + dc[3]) / 2 + 0.1, { w: 1 });
          } else {
            if (i % 2) K.louver(f, rU); else K.fill(f, rU, P.skin === 'corr' ? 'corrugated' : 'xWindow');
            skinPanel(f, rL, P.skin, i);
          }
        }
        const nr = fr(M, f, [-1.3, 0, zd + H * 0.18], [1.3, 0, zd + H * 0.46]);
        K.stencil(f, P.unitNo, (nr[0] + nr[2]) / 2, (nr[1] + nr[3]) / 2, Math.min(0.5, (nr[3] - nr[1]) * 0.8));
      }
      // ends: windows, door, lamps
      for (const k of ['+x', '-x']) {
        const e = B.f(k);
        if (!e.on) continue;
        const xe = k === '+x' ? xb1 : xb0;
        for (const s of [1, -1]) windowAt(e, fr(M, e, [xe, s * (balcony ? Wb * 0.18 : 0.06), zd + H * 0.58], [xe, s * Wb * 0.42, zd + H - rr * 0.6]), { angle: 40 });
        if (balcony) { const dr = fr(M, e, [xe, -0.38, zd + 0.05], [xe, 0.38, zd + H - 0.3]); K.door(M, e, (dr[0] + dr[2]) / 2, (dr[1] + dr[3]) / 2, dr[2] - dr[0], dr[3] - dr[1]); }
        else K.stencil(e, P.unitNo, 0, fp(M, e, [xe, 0, zd + H * 0.3])[1], 0.24);
      }
      // grab irons by the end doors
      M.mirrorY(() => {
        for (const x of [xb0 + 0.12, xb1 - 0.12]) R.handrail(M, [x, Wb / 2 + 0.07, zd + 0.3], [x, Wb / 2 + 0.07, zd + 1.7], [0, -0.07, 0], { pitch: 3 });
      });
      M.callout('CARBODY', 1, [0, ns * Wb / 2, zd + H * 0.35], 2);
      M.callout('CAB', 2, [xb1 - 0.6, ns * Wb / 2, zd + H * 0.75], 1.3);
    });
    if (nosed) {
      M.part('END HOOD', () => {
        for (const e of [1, -1]) {
          const xe = e * (L / 2 - 0.25), xc = e * L * 0.24;
          const Hn = H * 0.62;
          const pr = [[xc, zd], [xe, zd], [xe, zd + Hn * 0.7], [xe - e * 0.7, zd + Hn], [xc, zd + Hn]];
          const S = M.extrude(e > 0 ? pr : pr.slice().reverse(), -Wb * 0.38, Wb * 0.38, { plane: 'xz' });
          const f = S.f(ns > 0 ? '+y' : '-y');
          if (f.on) { const a = Math.min(xc, xe - e * 0.8), b = Math.max(xc, xe - e * 0.8); const n = Math.max(2, Math.round((b - a) / 1.3)); for (let i = 0; i < n; i++) K.louver(f, fr(M, f, [a + (b - a) * i / n + 0.05, 0, zd + 0.15], [a + (b - a) * (i + 1) / n - 0.05, 0, zd + Hn * 0.62])); }
          M.at(xe, 0, zd + Hn * 0.55, () => M.rz(e > 0 ? 0 : 180, () => R.headlamp(M, { r: 0.15 * kS })));
          M.mirrorY(() => K.railing(M, [[xe - e * 0.1, Wb / 2 - 0.02, zd], [xc + e * 0.1, Wb / 2 - 0.02, zd]], { h: 0.9, posts: 1.5 }));
        }
        M.callout('HEADLAMP', 2, [xF - 0.2, 0, zd + H * 0.34], 1.3);
        M.callout('END HOOD', 2, [xF - 2, ns * Wb * 0.38, zd + H * 0.3], 1.4);
      });
    } else {
      M.part('BALCONY', () => {
        for (const e of [1, -1]) {
          const xe = e > 0 ? xF : xR, xbx = e > 0 ? xb1 : xb0;
          if (balcony) {
            const y = Wb / 2 - 0.04;
            K.railing(M, [[xbx, y, zd], [xe - e * 0.08, y, zd], [xe - e * 0.08, 0.45, zd]], { h: 1.0, posts: 0.7 });
            K.railing(M, [[xbx, -y, zd], [xe - e * 0.08, -y, zd], [xe - e * 0.08, -0.45, zd]], { h: 1.0, posts: 0.7 });
          }
          M.at(xbx, 0, zd + H - rr * 0.4, () => M.rz(e > 0 ? 0 : 180, () => R.headlamp(M, { r: 0.15 * kS })));
          if (pool.includes('lamps')) for (const s of [1, -1]) M.at(xbx, s * Wb * 0.38, zd + 0.35, () => M.rz(e > 0 ? 0 : 180, () => R.headlamp(M, { r: 0.09 * kS, visor: false })));
        }
        if (balcony) M.callout('END BALCONY', 2, [xF - 0.5, ns * (Wb / 2 - 0.04), zd + 1.0], 1.4);
        M.callout('HEADLAMP', 2, [xb1 + 0.15, 0, zd + H - rr * 0.4], 1.3);
      });
    }
    // roof: pantographs on insulators, bus line, breaker, resistors, horns
    const zr = zd + H;
    M.part('PANTOGRAPH', () => {
      const xs = nP === 1 ? [xb1 - 1.6 * kS] : [xb0 + 1.6 * kS, xb1 - 1.6 * kS];
      const ph = M.decorOn ? 0 : 0;
      void ph;
      xs.forEach((x, i) => M.at(x, 0, zr, () => M.rz(i === 0 && nP === 2 ? 180 : 0, () => R.pantograph(M, { h: (i === 0 && nP === 2 ? 0.7 : 1.7) * kS, w: 1.1 * kS, a: 0.75 * kS, kind: pkind }))));
      M.callout('PANTOGRAPH', nP, [xs[xs.length - 1], 0, zr + 1.6 * kS], 3);
      M.callout('ROOF INSULATOR', nP * 4 + 2, [xs[0] + 0.75 * kS, ns * 0.5 * kS, zr + 0.2], 1.4);
      if (pool.includes('bus') || nP === 2) {
        const zb = zr + 0.55;
        const a = xs[0], b = xs[xs.length - 1] - (nP === 1 ? 3.5 : 0);
        for (const x of [a - (nP === 1 ? 0.9 : -0.9), (a + b) / 2, b + (nP === 1 ? 0 : -0.9)]) M.at(x, -0.35, zr, () => R.insulator(M, { h: 0.5, r: 0.07, n: 4 }));
        M.pipe([[a + 0.9 * (nP === 1 ? -1 : 1), -0.35, zb], [b - 0.9 * (nP === 1 ? 0 : 1), -0.35, zb]], 0.03, { isect: false, seg: 6 });
        M.callout('ROOF BUS LINE', 1, [(a + b) / 2, -0.35, zb], 0.8);
      }
    });
    M.part('ROOF EQUIPMENT', () => {
      if (pool.includes('breaker')) {
        M.at(0, 0.3, zr, () => { for (const x of [-0.35, 0.35]) M.at(x, 0, 0, () => R.insulator(M, { h: 0.45, r: 0.08, n: 4 })); const Bx = M.box([-0.55, -0.25, 0.45], [0.55, 0.25, 0.8]); const f = Bx.f(ns > 0 ? '+y' : '-y'); if (f.on) K.accessHatch(f, [-f.w * 0.4, -f.h * 0.4, f.w * 0.4, f.h * 0.4], { noRivets: true }); });
        M.callout('MAIN BREAKER', 1, [0, 0.3 + ns * 0.25, zr + 0.65], 1);
      }
      if (pool.includes('resistor')) {
        const x = nP === 2 ? -0.1 : xb0 + 1.8;
        const Bx = M.box([x - 1.0, -Wb * 0.3, zr - 0.05], [x + 1.0, Wb * 0.3, zr + 0.4]);
        for (const k of ['+y', '-y', '+z']) { const f = Bx.f(k); if (f.on) for (const r of f.grid(k === '+z' ? 3 : 4, 1, { gap: 2.4 })) K.louver(f, r); }
        M.callout('RESISTOR GRID', 1, [x, ns * Wb * 0.3, zr + 0.25], 1);
      }
      if (pool.includes('horns')) {
        M.at(xb1 - 0.5, -0.5 * ns, zr, () => { M.box([-0.06, -0.15, -0.05], [0.06, 0.15, 0.1]); M.at(0, -0.08, 0.16, () => K.horn(M, { r: 0.07 })); M.at(0, 0.08, 0.16, () => K.horn(M, { r: 0.06 })); });
        M.callout('AIR HORN', 2, [xb1 - 0.5, -0.5 * ns, zr + 0.2], 0.8);
      }
      if (pool.includes('whistle')) M.at(xb0 + 0.6, 0.4, zr, () => { M.cyl(0.03, -0.05, 0.25, { isect: false }); M.cyl(0.06, 0.25, 0.45, { isect: false }); });
      // roof walkway boards
      const rw = M.box([xb0 + 0.4, -0.22, zr - 0.02], [xb1 - 0.4, 0.22, zr + 0.03], { isect: false });
      const t = rw.f('+z');
      if (t.on) t.hatch(t.box, { angle: 90, gap: 3.2, w: 0 });
    });
    figure = [xR - 0.4 + shift, ns * (W / 2 + 1.2)];
    M.info.mass = [xb0 + shift, -W / 2, RT, xb1 + shift, W / 2, zd + H];
  });
  out.figure = figure;
  return out;
}

// ====================================================================== railcar
// paddle propeller in the local yz plane (thrust along +x): spinner and n twisted blades
function paddleProp(M, o) {
  const Rp = o.r, n = o.n ?? 3;
  M.lathe([[Rp * 0.16, -Rp * 0.1], [Rp * 0.16, Rp * 0.05], [Rp * 0.11, Rp * 0.2], [0, Rp * 0.3]], { axis: 'x', sharpDeg: 40 });
  M.cyl(Rp * 0.1, -Rp * 0.3, -Rp * 0.1, { axis: 'x' });
  const out = [[0, -Rp * 0.07, Rp * 0.12], [0, Rp * 0.1, Rp * 0.12], [0, Rp * 0.16, Rp * 0.45], [0, Rp * 0.13, Rp * 0.8], [0, Rp * 0.06, Rp], [0, -Rp * 0.04, Rp * 0.99], [0, -Rp * 0.1, Rp * 0.7], [0, -Rp * 0.1, Rp * 0.35]];
  for (let i = 0; i < n; i++) {
    M.rx((o.phase ?? 20) + i * 360 / n, () => M.rz(o.pitch ?? 32, () => {
      const S = M.plate(out, { girth: Rp * 0.04 });
      const f = S.f('face');
      if (f.on) { f.line(...R.fxz(f, M.W([0, 0, Rp * 0.14])), ...R.fxz(f, M.W([0, 0.01, Rp * 0.95])), { w: 1 }); f.hatch(f.poly, { angle: 0, gap: 3.4, w: 0 }); }
      M.tube([0, 0, Rp * 0.05], [0, 0, Rp * 0.2], Rp * 0.035, { isect: false });
    }));
  }
}

function railcar(M, P) {
  const { kS, gauge, ns, job } = P;
  const drive = M.wpick([[3, 'prop'], [2, 'fan'], [1.6, 'jet']]);
  const L = (job === 'EXPRESS' ? M.r(17, 21) : M.r(15, 18)) * kS;
  const Rm = M.r(1.3, 1.5) * kS;
  const Rw = M.r(0.54, 0.62) * kS;
  const twoBogie = M.chance(0.35);
  const fin = drive !== 'fan' || M.chance(0.4);
  const nWin = M.ri(7, 10);
  const blades = M.pick([2, 3, 4]);
  const skirt = M.chance(0.7);
  const noseLen = M.r(3.2, 4.6) * kS;
  const tailLen = M.r(6.5, 9) * kS;
  const out = { drive, cars: 0, speed: M.ri(16, 23) * 10 };
  out.wheels = twoBogie ? 'BO-BO' : '1-A';
  out.wheelsLabel = 'AXLES';
  out.mass = Math.round(L * 1.2 * kS);
  out.power = drive === 'jet' ? 2 * M.r(2400, 4000) : M.r(450, 900);
  out.extraBrief = drive === 'prop' ? ', driven by a tail propeller.' : drive === 'fan' ? ', driven by a ducted fan.' : ', driven by two jet engines.';
  const RT = R.trackTop(P.ballast);
  const zH = RT + 2 * Rw + (twoBogie ? 0.75 : 0.3);    // hull bottom
  const kz = 1.06;
  const zc = zH + Rm * kz;
  const xR = -L / 2, xF = L / 2;
  const tailR = Rm * 0.36;
  let figure = null;
  const xa = [xR + tailLen * 0.75 + (twoBogie ? 2.4 : 1.4), xF - noseLen * 0.75 - (twoBogie ? 2.2 : 1.2)];
  const yW = R.wheelY(gauge);
  M.at(0, 0, 0, () => {
    R.track(M, { gauge, x0: xR - (drive === 'jet' ? 0.8 : 2.4), x1: xF + 1.0, ballast: P.ballast });
    // ---- running gear: axles in frames with leaf springs, or two bogies
    M.part('RUNNING GEAR', () => {
      M.info.centers = [];
      for (const x of xa) {
        if (twoBogie) {
          M.at(x, 0, RT, () => R.bogie(M, { n: 2, pitch: 2.0 * kS, r: Rw, gauge, kind: 'leaf', wheel: 'spoke', nearSide: ns }));
          for (const dx of [-1, 1]) M.info.centers.push([[x + dx * kS, -1.2, RT + Rw], [x + dx * kS, 1.2, RT + Rw]]);
        } else {
          M.at(x, 0, RT + Rw, () => R.wheelset(M, { r: Rw, gauge, kind: 'spoke', spokes: 10, nearSide: ns }));
          M.mirrorY(() => {
            const HP = M.extrude([[x - Rw - 0.7, zH + 0.1], [x + Rw + 0.7, zH + 0.1], [x + Rw + 0.4, RT + Rw + 0.2], [x + 0.2, RT + Rw - 0.15], [x - 0.2, RT + Rw - 0.15], [x - Rw - 0.4, RT + Rw + 0.2]], yW + 0.16, yW + 0.24, { plane: 'xz', isect: false });
            const hf = HP.f('+y');
            if (hf.on) {
              hf.rivets(...fp(M, hf, [x - Rw - 0.6, 0, zH]), ...fp(M, hf, [x + Rw + 0.6, 0, zH]), { pitch: 6 });
              for (const sx of [-1, 1]) hf.circle(...fp(M, hf, [x + sx * (Rw + 0.15), 0, (zH + RT + Rw) / 2 + 0.1]), 0.11, { w: 1 });
              if (hf.tone > 0.25) hf.hatch(hf.poly, { angle: 90, gap: 4.2 - 2 * hf.tone, w: 0 });
            }
            M.boxc([x, yW + 0.22, RT + Rw], [0.34, 0.2, 0.36], { isect: false });
            M.at(x, yW + 0.33, RT + Rw + 0.36, () => R.leaf(M, { len: 1.3, n: 6, w: 0.1 }));
          });
          M.info.centers.push([[x, -1.2, RT + Rw], [x, 1.2, RT + Rw]]);
        }
      }
      M.callout(twoBogie ? 'BOGIE' : 'WHEELSET', 2, [xa[1], ns * (yW + 0.1), RT + Rw], 2);
      M.callout('LEAF SPRING', twoBogie ? 8 : 4, [xa[0], ns * (yW + 0.33), RT + Rw + 0.36], 1.2);
    });
    // ---- hull: a lathe about x, a little taller than wide
    M.part('HULL', () => {
      const pr = [[tailR, xR]];
      for (let i = 1; i <= 5; i++) { const t = i / 5; pr.push([tailR + (Rm - tailR) * (1 - (1 - t) ** 2.2), xR + tailLen * t]); }
      pr.push([Rm, xF - noseLen]);
      const nN = 8;
      for (let i = 1; i <= nN; i++) { const a = (i / nN) * 90 * D2R; pr.push([Rm * Math.cos(a), xF - noseLen + Math.sin(a) * noseLen]); }
      pr[pr.length - 1][0] = 0;
      const hull = M.at(0, 0, zc, () => M.scale(1, 0.94, kz, () => M.lathe(pr, { axis: 'x', sharpDeg: 30 })));
      const Lt = hull.lat;
      // arc-length t of a world x along the profile
      const cum = [0];
      for (let i = 1; i < pr.length; i++) cum.push(cum[i - 1] + Math.hypot(pr[i][0] - pr[i - 1][0], pr[i][1] - pr[i - 1][1]));
      const tot = cum[cum.length - 1];
      const tX = (x) => { for (let i = 1; i < pr.length; i++) if (x <= pr[i][1]) { const f = (x - pr[i - 1][1]) / (pr[i][1] - pr[i - 1][1] || 1); return (cum[i - 1] + (cum[i] - cum[i - 1]) * f) / tot; } return 1; };
      if (M.decorOn) {
        Lt.shade({ t0: 0.01, t1: 0.985, gap: 1.8, gapMax: 7 });
        const sgn = ns > 0 ? 1 : -1;
        const aW = 90 * sgn + (sgn > 0 ? 18 : -18);         // window band, a little above the equator
        // panel joints
        for (let x = xR + 1.6; x < xF - noseLen * 0.5; x += 1.8 * kS) Lt.ring(tX(x), { w: 0 });
        // belt lines above and below the windows, full length on both sides
        for (const sd of [1, -1]) for (const da of [-20, 21, 26]) Lt.meridian(sd * (90 + 18) + sd * da * (sd > 0 ? 1 : 1) - (sd > 0 ? 0 : 0), tX(xR + tailLen * 0.55), tX(xF - noseLen * 0.35), { w: da === 26 ? 0 : 1 });
        // windows with pillars
        const wx0 = xR + tailLen * 0.75, wx1 = xF - noseLen - 0.6;
        const ww = (wx1 - wx0) / nWin;
        const wh = Rm * 0.62;
        for (let i = 0; i < nWin; i++) {
          if (i === 1) continue;
          const xm = wx0 + ww * (i + 0.5);
          const t = tX(xm), dt = (ww * 0.38) / tot;
          Lt.shape(aW, t, [[-wh / 2, -ww * 0.4], [wh / 2, -ww * 0.4], [wh / 2, ww * 0.4], [-wh / 2, ww * 0.4]], { closed: true, w: 1 });
          const da = (wh * 0.42) / Rm / D2R;
          Lt.hatch(aW - da, aW + da, t - dt * 0.92, t + dt * 0.92, { gap: 1.1 });
        }
        // door in the second bay, with its own small window
        const xd = wx0 + ww * 1.5, td = tX(xd);
        Lt.shape(aW - 16 * sgn, td, [[-1.25 * kS, -ww * 0.36], [0.85 * kS, -ww * 0.36], [0.85 * kS, ww * 0.36], [-1.25 * kS, ww * 0.36]], { closed: true, w: 1 });
        Lt.shape(aW - 16 * sgn, td, [[0.15 * kS, -ww * 0.22], [0.65 * kS, -ww * 0.22], [0.65 * kS, ww * 0.22], [0.15 * kS, ww * 0.22]], { closed: true, w: 1 });
        // windshield panes around the nose
        const tw = tX(xF - noseLen * 0.42);
        for (const a of [148, 180, 212]) Lt.shape(a, tw, [[-0.42 * kS, -0.36 * kS], [0.42 * kS, -0.36 * kS], [0.42 * kS, 0.36 * kS], [-0.42 * kS, 0.36 * kS]], { closed: true, w: 1 });
        Lt.hatch(130, 230, tw - 0.012, tw + 0.012, { gap: 1.0 });
        Lt.text(P.unitNo, 90 * sgn - 4 * sgn, tX(xR + tailLen * 0.5), 0.5 * kS, { along: true });
      }
      M.info.mass = [xR, -Rm, zH, xF, Rm, zc + Rm * kz];
      M.callout('HULL', 1, [xR + tailLen, ns * Rm * 0.9, zc + 0.3], 2);
      M.callout('CAB', 1, [xF - noseLen * 0.4, 0, zc + Rm * 0.8], 1.4);
      M.callout('ENTRANCE DOOR', 1, [xR + tailLen * 0.75 + (L - tailLen * 0.75 - noseLen) / nWin * 1.5, ns * Rm * 0.9, zc - 0.2], 1);
    });
    // ---- underframe, skirt with wheel arches, steps, coupler, lamp
    M.part('UNDERFRAME', () => {
      const x0 = xR + tailLen * 0.75, x1 = xF - noseLen * 0.75;
      M.box([x0, -yW - 0.12, zH - 0.25], [x1, yW + 0.12, zH + 0.35]);
      const xd = xR + tailLen * 0.75 + (L - tailLen * 0.75 - noseLen) / nWin * 1.5;
      M.mirrorY(() => M.at(xd, Rm * 0.86 + 0.12, zH + 0.2, () => R.steps(M, { n: 3, w: 0.55, gap: Math.min(0.32, (zH - RT) / 3.3) })));
      M.at(xF - noseLen * 0.35, 0, RT + 0.85 * kS, () => R.coupler(M, { kind: 'knuckle' }));
      M.at(xF - noseLen * 0.35, 0, RT + 0.85 * kS, () => { M.box([-1.2, -0.12, -0.08], [0.02, 0.12, 0.08], { isect: false }); M.box([-1.2, -0.3, -0.08], [-0.85, 0.3, zH - RT - 0.85 * kS + 0.3]); });
      M.at(xF - noseLen * 0.06, 0, zc - Rm * 0.35, () => R.headlamp(M, { r: 0.16 * kS, visor: false }));
            M.callout('HEADLAMP', 1, [xF - noseLen * 0.06 + 0.1, 0, zc - Rm * 0.35], 1.2);
      figure = [xd + 1.8, ns * (Rm + 1.2)];
    });
    // ---- propulsion
    M.part(drive === 'prop' ? 'PROPELLER' : drive === 'fan' ? 'DUCTED FAN' : 'JET ENGINE', () => {
      if (drive === 'prop') {
        const Rp = Math.min(zc - RT - 0.3, Rm * 1.3);
        M.at(xR, 0, zc, () => {
          M.cone(tailR, tailR * 0.55, -0.45, 0, { axis: 'x' });
          M.at(-0.65, 0, 0, () => M.ry(180, () => paddleProp(M, { r: Rp, n: blades, phase: 25 })));
        });
        M.callout('PROPELLER', 1, [xR - 0.65, ns * Rp * 0.5, zc + Rp * 0.4], 3);
      } else if (drive === 'fan') {
        const Rf = Math.min(zc - RT - 0.35, Rm * 1.08);
        M.at(xR - 0.9, 0, zc, () => {
          K.ductedFan(M, { r: Rf, blades: 7 });
          for (let i = 0; i < 4; i++) M.rx(45 + 90 * i, () => M.box([0.25, -0.04, tailR * 0.5], [1.4, 0.04, Rf * 1.02], { isect: false }));
        });
        M.at(xR, 0, zc, () => M.cone(tailR, tailR * 0.4, -1.0, 0, { axis: 'x' }));
        M.callout('DUCTED FAN', 1, [xR - 0.9, ns * Rf, zc], 3);
      } else {
        const rj = 0.42 * kS, lj = 3.6 * kS;
        M.mirrorY(() => {
          const y = Rm * 0.55, z = zc + Rm * 0.95 + rj + 0.25, x = xF - noseLen - 3.5 * kS;
          M.at(x, y, z, () => {
            const N = M.lathe([[rj * 0.82, lj], [rj, lj * 0.85], [rj * 1.05, lj * 0.5], [rj * 0.85, 0.05], [rj * 0.6, 0]], { axis: 'x', sharpDeg: 30 });
            if (M.decorOn) { N.lat.shade({ gap: 1.6 }); N.lat.ring(0.3, { w: 1 }); N.lat.ring(0.62, { w: 1 }); }
            const I = M.cyl(rj * 0.62, lj - 0.05, lj + 0.02, { axis: 'x', isect: false });
            if (I.top.on) I.top.hatch(circlePts(0, 0, rj * 0.6, rj * 0.6, 16), { angle: 0, gap: 1.6, w: 0 });
            M.cone(0.12, 0.01, lj - 0.2, lj + 0.25, { axis: 'x' });
            const Nz = M.cyl(rj * 0.55, -0.25, 0.02, { axis: 'x', isect: false });
            if (Nz.bottom.on) Nz.bottom.hatch(circlePts(0, 0, rj * 0.5, rj * 0.5, 16), { angle: 45, gap: 1.0, w: 0 });
          });
          M.extrude([[x + 0.6, zc + Rm * 0.6], [x + 2.4, zc + Rm * 0.6], [x + 2.0, z - rj * 0.6], [x + 0.9, z - rj * 0.6]], y - 0.06, y + 0.06, { plane: 'xz' });
        });
        M.callout('JET ENGINE', 2, [xF - noseLen - 3.5 * kS + 1.8, ns * Rm * 0.55, zc + Rm * 0.95 + 0.7], 3);
      }
      if (fin) {
        const S = M.extrude([[xR + 0.3, zc + tailR * 0.5], [xR + tailLen * 0.62, zc + Rm * 0.75], [xR + tailLen * 0.35, zc + Rm + 1.1 * kS], [xR + 0.9, zc + Rm + 1.1 * kS]], -0.06, 0.06, { plane: 'xz' });
        const f = S.f(ns > 0 ? '+y' : '-y');
        if (f.on) { f.hatch(f.poly, { angle: 90, gap: 4.5 - 2 * f.tone, w: 0 }); K.stencil(f, P.unitNo, ...fp(M, f, [xR + tailLen * 0.3, 0, zc + Rm * 0.95]), 0.3 * kS); }
        M.callout('TAIL FIN', 1, [xR + tailLen * 0.3, ns * 0.06, zc + Rm + 0.4], 1);
      }
      M.at(0, 0, zc + Rm * kz, () => K.whip(M, { h: 1.2, lean: 25 }));
    });
  });
  out.figure = figure;
  return out;
}
