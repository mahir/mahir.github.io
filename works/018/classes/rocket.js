// classes/rocket.js: a launch vehicle standing on its pad. Two to four stages of differing
// diameters joined by skirts or open trusses; a payload fairing, a capsule under an escape
// tower or a winged glider on top; engines over the flame hole; fins, strap-on boosters or
// tapered boosters. Pad furniture from a pool: launch table on legs, on a plinth or on a
// crawler, a service tower with swing arms and a crane, an erector or an umbilical mast,
// lightning masts, propellant tanks, lamp poles. Now and then a sounding rocket on a rail
// launcher towed by a truck.

import * as K from '../kit.js';
import * as SP from './parts-space.js';
import { D2R, dot } from '../geom.js';
import { word, thou } from '../words.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default {
  id: 'rocket',
  family: 'space',
  weight: 1,
  build(M) {
    if (M.chance(0.16)) return sounding(M);
    return launcher(M);
  },
};

// ====================================================================== the tall rocket
function launcher(M) {
  // ------------------------------------------------ choices (all random draws up front)
  const az0 = M.pick([45, 135, -45, -135]);
  const az = az0 + M.r(-13, 13), el = M.r(21, 30);
  M.setView(az, el);
  const e = M.view.e;
  const aView = Math.atan2(e[1], e[0]) / D2R;

  const R1 = M.r(1.5, 3.3);
  const nSt = M.wpick([[4, 2], [5, 3], [1.4, 4]]);
  const st = [];
  {
    let R = R1;
    for (let i = 0; i < nSt; i++) {
      if (i > 0) { const same = M.chance(0.35); const k = M.r(0.55, 0.9); R = Math.max(R1 * 0.38, same ? R : R * k); }
      const Lz = i === 0 ? R * 2 * M.r(3.0, 5.2) : R * 2 * M.r(1.2, 2.6);
      st.push({ R, L: Lz });
    }
  }
  const ist = [];
  for (let i = 1; i < nSt; i++) {
    const truss = st[i].R <= st[i - 1].R * 1.01 && M.chance(0.35);
    const Rm = Math.max(st[i].R, st[i - 1].R);
    ist.push({ kind: truss ? 'truss' : 'skirt', L: truss ? Rm * M.r(0.8, 1.15) : Rm * M.r(0.4, 0.75), n: M.pick([6, 8, 8, 10]) });
  }
  const topKind = M.wpick([[4, 'fairing'], [3, 'capsule'], [1.6, 'glider']]);
  const strap = M.wpick([[3, 'none'], [3.5, 'boosters'], [1.1, 'conical'], [2.5, 'fins']]);
  const nEng = R1 < 2 ? M.pick([1, 3, 4]) : M.pick([1, 4, 5, 5, 7, 9]);
  const reK = M.r(0.85, 1.0), leK = M.r(2.1, 2.8);
  const nb = M.pick([2, 3, 4, 4]), rbK = M.r(0.35, 0.55), lbK = M.r(0.45, 0.78), bNose = M.pick(['cone', 'ogive']), bFins = M.chance(0.35);
  const nF = M.pick([3, 4, 4]), fSpan = M.r(0.6, 1.3), fC0 = M.r(1.4, 2.8), fC1 = M.r(0.25, 0.6), fDrop = M.r(0, 0.35);
  const hammer = M.chance(0.35), fairK = M.r(1.15, 1.45), fairCyl = M.r(0.8, 1.8), fairNose = M.r(1.4, 2.4);
  const capK = M.r(0.75, 1.0), smOn = M.chance(0.7), smK = M.r(1.0, 1.8), towerK = M.r(2.0, 2.7);
  const gK = M.r(2.2, 3.0), gForm = M.pick(['delta', 'delta', 'lifting']), gFins = M.pick(['tip', 'tail', 'both']);
  const padKind = M.wpick([[3, 'legs'], [2.2, 'crawler'], [1.4, 'plinth']]);
  const support = M.wpick([[5, 'tower'], [2.4, 'erector'], [1.6, 'mast']]);
  const sideK = M.rng();
  const wT = Math.max(5, Math.min(9, R1 * M.r(2.2, 3.0))), towerGap = M.r(2.5, 5), towerExtra = M.r(1.5, 5);
  const tableMargin = M.r(2.5, 4.5), hLeg = M.r(5, 9), th = M.r(2.4, 3.6), hPl = M.r(2, 3.5);
  const holdGap = M.r(0.4, 1.0);
  const extrasPool = M.shuffle(['masts', 'sphere', 'tanks', 'lamps']);
  const nExtras = M.wpick([[2, 1], [3, 2], [1, 0]]);
  const extras = extrasPool.slice(0, nExtras);
  const sphR = M.r(2.5, 4.5), mastK = M.r(1.08, 1.25);
  const des = SP.designationOf(M);
  const padNo = M.ri(1, 39);
  const unit = String(M.ri(1, 49)).padStart(2, '0');
  const stStyle = st.map(() => ({ str: M.chance(0.55), tI: M.r(0.35, 0.6), roll: M.rng(), rollK: M.pick(['checker', 'stripes', 'band']), rollA: M.r(0, 90), hat: [M.r(-55, 55), M.r(0.15, 0.85), M.r(-55, 55), M.r(0.15, 0.85)], umbA: M.r(55, 80) * M.pick([1, -1]), umbT: M.r(0.2, 0.8) }));
  const crewN = topKind === 'capsule' ? M.pick([2, 3, 3, 4]) : topKind === 'glider' ? M.pick([1, 2, 2]) : 0;
  const place = M.pick(['EQUATORIAL', 'COASTAL', 'DESERT', 'ISLAND', 'POLAR', 'HIGHLAND', 'STEPPE']);
  const jobPick = M.rng();
  const fairWord = M.chance(0.6);
  const armPick = M.rng();
  const craneYaw = M.r(-25, 25);

  // ------------------------------------------------ the stack, bottom up
  const aFace = aView;                       // skin angle toward the viewer (lathes about z)
  const skinPt = (R, z, da = 0) => [Math.cos((aFace + da) * D2R) * R * 1.0, Math.sin((aFace + da) * D2R) * R * 1.0, z];
  const re = SP.engineFit(nEng, R1) * reK, Le = re * leK;
  const rb = R1 * rbK, Lb = st[0].L * lbK;
  const span = R1 * fSpan, c0 = Math.min(st[0].L * 0.4, R1 * fC0), c1 = c0 * fC1, drop = c0 * fDrop;
  // ring of strap-on boosters, angle offset so two of them sit left and right on paper
  const bRing = strap === 'conical' ? R1 + rb * 0.92 : R1 + rb * 1.12;
  const bA0 = nb === 2 ? aView + 90 : aView + 45 + (nb === 3 ? 15 : 0);
  const Renv = strap === 'boosters' || strap === 'conical' ? bRing + rb : strap === 'fins' ? R1 + span : R1;

  // pad heights
  const engBelow = Math.max(Le, strap === 'fins' ? drop + 0.4 : 0, (strap === 'boosters' || strap === 'conical') ? rb * 0.6 * 2.4 : 0);
  let zT;                                    // table deck
  if (padKind === 'legs') zT = hLeg + th;
  else if (padKind === 'crawler') zT = 2.3 + 2.8 + 2.6 + th;
  else zT = hPl + th;
  const zB = zT + engBelow + holdGap;        // base of the first stage

  let z = zB;
  const levels = [];                          // swing-arm candidates: [z, R]
  const stageS = [];
  const fit = (s, n) => s.length <= n;
  for (let i = 0; i < nSt; i++) {
    const s = st[i], S0 = stStyle[i];
    const nm = i === 0 ? 'FIRST STAGE' : i === 1 ? 'SECOND STAGE' : i === 2 ? 'THIRD STAGE' : 'FOURTH STAGE';
    if (i > 0) {
      const I = ist[i - 1], Ra = st[i - 1].R, Rb = s.R;
      M.part(I.kind === 'truss' ? 'INTERSTAGE TRUSS' : 'INTERSTAGE SKIRT', () => {
        if (I.kind === 'truss') {
          SP.dome(M, Ra * 0.98, z, 0.3);
          SP.trussInterstage(M, { rA: Ra, rB: Rb, z0: z, z1: z + I.L, n: I.n });
          // the upper stage's engine, seen through the truss
          M.at(0, 0, z + I.L, () => K.bell(M, { r: Rb * 0.42, len: I.L * 0.72, pump: true }));
          M.callout('INTERSTAGE TRUSS', 1, skinPt(Math.max(Ra, Rb) * 0.97, z + I.L * 0.5), 1.6);
          M.callout('UPPER STAGE ENGINE', 1, [0, 0, z + I.L * 0.45], 1.1);
        } else {
          SP.skirt(M, { rA: Ra, rB: Rb, z0: z, z1: z + I.L, vents: [[aFace + 25, 0.5], [aFace - 25, 0.5]] });
          M.callout('INTERSTAGE SKIRT', 1, skinPt((Ra + Rb) / 2, z + I.L * 0.5), 0.9);
        }
      });
      levels.push([z + I.L * 0.5, Math.max(Ra, Rb)]);
      z += I.L;
    }
    M.part(nm, () => {
      const S = M.cyl(s.R, z, z + s.L);
      stageS.push(S);
      const ringN = Math.max(2, Math.round(s.L / (s.R * 1.3)));
      const frames = [[0.012, 1], [0.988, 1]];
      const dI = Math.min(0.12, s.R * 0.3 / s.L);
      frames.push([S0.tI - dI, 1], [S0.tI + dI, 1]);
      for (let k = 1; k < ringN; k++) { const t = k / ringN; if (Math.abs(t - S0.tI) > dI * 1.6) frames.push(t); }
      let roll = null;
      if ((i === 0 && S0.roll < 0.6) || (i === 1 && S0.roll < 0.3)) {
        const bands = S0.rollK === 'checker' ? [[0.8, 0.88], [0.88, 0.96]] : S0.rollK === 'stripes' ? [[0.04, Math.min(0.3, 0.04 + s.R * 2 / s.L)]] : [[S0.tI - dI, S0.tI + dI]];
        roll = { kind: S0.rollK, a0: S0.rollA + aFace, bands };
      }
      const tH = s.R * 0.62;
      const label = i === 0 ? des : i === 1 ? unit : '';
      const txt = label && label.length * tH * 0.95 < s.L * 0.42 ? { str: label, t: S0.tI + (1 - S0.tI) * 0.45, h: tH, a: aFace - 18 } : null;
      SP.skin(M, S, {
        r: s.R, len: s.L, frames, a0: aFace,
        stringers: S0.str ? 3.2 : 2.6, sT: S0.str ? [0.012, 0.988] : [S0.tI - dI, S0.tI + dI],
        seams: S0.str ? 0 : 8, seamT: [0.012, 0.988],
        roll, text: txt,
        hatches: [[aFace + S0.hat[0], S0.hat[1], s.R * 0.32, s.R * 0.36], ...(s.L > s.R * 4 ? [[aFace + S0.hat[2], S0.hat[3], s.R * 0.26, s.R * 0.3]] : [])],
        umbs: i < 2 ? [[aFace + S0.umbA, S0.umbT, s.R * 0.4, s.R * 0.3]] : [],
      });
      M.callout(nm, 1, skinPt(s.R, z + s.L * 0.55), 2.6 - i * 0.3);
      if (i < 2) M.callout('UMBILICAL PLATE', 1, skinPt(s.R, z + s.L * S0.umbT, S0.umbA), 0.7);
      M.callout('ACCESS HATCH', nSt, skinPt(s.R, z + s.L * S0.hat[1], S0.hat[0]), 0.6);
      if (i === 0) M.info.mass = [-s.R, -s.R, zB, s.R, s.R, 0];
    });
    levels.push([z + s.L * 0.92, s.R]);
    z += s.L;
  }
  const topR = st[nSt - 1].R;

  // ------------------------------------------------ the top
  let zTop = z, crewZ = null;
  if (topKind === 'fairing') {
    M.part('PAYLOAD FAIRING', () => {
      const Rf = hammer ? topR * fairK : topR;
      if (hammer) { const bt = (Rf - topR) * M.r(1.4, 2.0); M.cone(topR, Rf, z, z + bt); z += bt; }
      const Lc = Rf * 2 * fairCyl, Ln = Rf * fairNose;
      const prof = [[Rf, z], [Rf, z + Lc], ...SP.ogive(Rf, Ln, z + Lc, 9, 0.02).slice(1)];
      const S = M.lathe(prof, { sharpDeg: 20 });
      if (M.decorOn) {
        const L = S.lat, tot = L.total;
        const tc = Lc / tot;
        L.ring(0.01, { w: 1 }); L.ring(0.025, { w: 1 }); L.ring(tc, { w: 0 });
        for (const a of [aFace - 62, aFace + 118]) { L.meridian(a, 0.01, 0.97, { w: 1 }); L.meridian(a + 1.2, 0.01, 0.97, { w: 0 }); }
        for (let k = 1; k < 5; k++) L.ring(tc * k / 5, { w: 0 });
        SP.latHatch(M, L, aFace + 20, tc * 0.55, Rf * 0.4, Rf * 0.42);
        if (fairWord) { const w = jobWord(jobPick, topKind); if (w.length * Rf * 0.5 < Lc * 0.9) L.text(w, aFace - 20, tc * 0.5, Rf * 0.5, { along: true }); }
        L.shade({ gap: 1.6, gapMax: 6 });
      }
      M.callout('PAYLOAD FAIRING', 1, skinPt(Rf, z + Lc * 0.5), 2.8);
      levels.push([z + Lc * 0.4, Rf]);
      zTop = z + Lc + Ln;
    });
  } else if (topKind === 'capsule') {
    const Rc = topR * capK;
    if (smOn) {
      M.part('SERVICE MODULE', () => {
        if (Rc < topR * 0.97) { M.cone(topR, Rc, z, z + (topR - Rc) * 1.6 + 0.3); z += (topR - Rc) * 1.6 + 0.3; }
        const Ls = Rc * smK;
        const S = M.cyl(Rc, z, z + Ls);
        if (M.decorOn) {
          const L = S.lat;
          L.ring(0.04, { w: 1 }); L.ring(0.96, { w: 1 });
          // radiator bands: fine lines between two rings
          for (let a = 0; a < 360; a += 360 / 72) if (SP.facing(M, L, a, 0.5) > 0.03) L.meridian(a, 0.3, 0.75, { w: 0 });
          L.ring(0.3, { w: 1 }); L.ring(0.75, { w: 1 });
          L.shade({ gap: 1.7 });
        }
        for (let k = 0; k < 4; k++) {
          const a = (aFace + 45 + k * 90) * D2R;
          M.at(Math.cos(a) * Rc, Math.sin(a) * Rc, z + Ls * 0.86, () => M.rz(a / D2R, () => SP.rcsQuad(M, { s: Rc * 0.22 })));
        }
        M.callout('SERVICE MODULE', 1, skinPt(Rc, z + Ls * 0.5), 1.7);
        M.callout('THRUSTER QUAD', 4, skinPt(Rc * 1.1, z + Ls * 0.86, 45), 1.2);
        z += Ls;
      });
    } else if (Rc < topR * 0.97) {
      M.part('ADAPTER', () => { M.cone(topR, Rc, z, z + (topR - Rc) * 1.6 + 0.3); z += (topR - Rc) * 1.6 + 0.3; });
    }
    M.part('CREW CAPSULE', () => {
      const h = M.at(0, 0, z, () => SP.capsule(M, { r: Rc, aFace }));
      M.callout('CREW CAPSULE', 1, skinPt(Rc * 0.66, z + Rc * 0.5), 2.8);
      crewZ = z + Rc * 0.42;
      levels.push([crewZ, Rc]);
      M.part('ESCAPE TOWER', () => {
        const top = M.at(0, 0, z + h - Rc * 0.25, () => SP.escapeTower(M, { r: Rc, h: Rc * towerK, rb: Rc * 0.42, mark: '' }));
        M.callout('ESCAPE TOWER', 1, [0, 0, z + h + Rc * towerK * 0.55], 2.4);
        zTop = z + h - Rc * 0.25 + top;
      });
    });
  } else {
    M.part('SPACEPLANE', () => {
      const Lg = Math.max(topR * 2 * gK, R1 * 2 * gK * 1.2);
      const ra = Lg * 0.085;
      const La = Math.max(0.6, (topR - ra) * 1.4);
      M.cone(topR, ra * 1.02, z, z + La);
      z += La;
      M.at(0, 0, z + Lg / 2, () => M.rz(aFace + 180, () => M.ry(-90, () => SP.glider(M, { len: Lg, span: Lg * 0.68, rf: ra, form: gForm, fins: gFins, reg: des.length <= 7 ? des : unit + '-' + des.replace(/[^A-Z0-9]/g, '').slice(-3) }))));
      M.callout('SPACEPLANE', 1, [0, 0, z + Lg * 0.6], 2.8);
      crewZ = z + Lg * 0.86;
      levels.push([crewZ, ra]);
      zTop = z + Lg;
    });
  }
  M.info.mass[5] = zTop;
  M.info.centers = [[[0, 0, zB - 2], [0, 0, zTop + 2]]];

  // ------------------------------------------------ engines and strap-ons
  M.part('MAIN ENGINE', () => {
    M.at(0, 0, zB, () => SP.engines(M, { R: R1, n: nEng, re, len: Le }));
    M.callout('MAIN ENGINE', nEng, [Math.cos(aFace * D2R) * R1 * 0.5, Math.sin(aFace * D2R) * R1 * 0.5, zB - Le * 0.6], 2.2);
  });
  const bAngles = [];
  if (strap === 'boosters' || strap === 'conical') {
    M.part('STRAP-ON BOOSTER', () => {
      for (let k = 0; k < nb; k++) {
        const a = bA0 + k * 360 / nb;
        bAngles.push(a);
        const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
        if (strap === 'boosters') {
          M.at(ca * bRing, sa * bRing, zB, () => booster(M, { r: rb, len: Lb, nose: bNose, fins: bFins, aFace: aView - a, mark: String(k + 1) }));
          // attach struts, top and bottom
          for (const zz of [zB + rb * 0.8, zB + Lb * 0.88]) {
            const p = [ca * (bRing - rb * 0.98), sa * (bRing - rb * 0.98), zz], q = [ca * R1 * 0.99, sa * R1 * 0.99, zz];
            for (const d of [-1, 1]) { const off = [-sa * rb * 0.35 * d, ca * rb * 0.35 * d, 0]; K.strut(M, [p[0] + off[0], p[1] + off[1], zz], [q[0], q[1], zz + d * rb * 0.25], rb * 0.06, { collars: false }); }
            K.ball(M, q, rb * 0.09);
          }
        } else {
          // tapered booster leaning on the core: its tip touches the core skin
          const tilt = Math.atan2(bRing - R1 * 0.98, Lb) / D2R;
          M.at(ca * bRing, sa * bRing, zB, () => M.rz(a, () => M.ry(-tilt, () => conical(M, { r: rb, len: Lb / Math.cos(tilt * D2R), aFace: aView - a, mark: String(k + 1) }))));
          M.at(ca * bRing, sa * bRing, zB, () => M.rz(a, () => M.at(0, 0, 0, () => M.ry(-tilt, () => engCluster4(M, rb)))));
        }
      }
      const aN = bAngles.reduce((b, a) => (Math.cos((a - aView) * D2R) > Math.cos((b - aView) * D2R) ? a : b), bAngles[0]);
      M.callout('STRAP-ON BOOSTER', nb, [Math.cos(aN * D2R) * (bRing + rb), Math.sin(aN * D2R) * (bRing + rb), zB + Lb * 0.45], 2.4);
      if (strap === 'boosters' && bFins) M.callout('STABILIZER FIN', nb * 3, [Math.cos(aN * D2R) * (bRing + rb * 1.6), Math.sin(aN * D2R) * (bRing + rb * 1.6), zB + rb * 0.8], 1.0);
    });
  } else if (strap === 'fins') {
    M.part('STABILIZER FIN', () => {
      for (let k = 0; k < nF; k++) {
        const a = aView + 45 + k * 360 / nF;
        M.rz(a, () => SP.fin(M, { R: R1, c0, c1, s: span, z0: zB + 0.02, drop, mark: k === 0 ? 'A' : null }));
      }
      M.callout('STABILIZER FIN', nF, skinPt(R1 + span * 0.6, zB + c0 * 0.35, 45), 2.2);
    });
  }

  // ------------------------------------------------ the pad
  const cand = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter((d) => d[0] * e[0] + d[1] * e[1] < 0);
  const dT = cand[Math.floor(sideK * cand.length)] || [-1, 0];
  const pT = [-dT[1], dT[0]];                 // perpendicular in plan
  const dist = Renv + towerGap + (support === 'erector' ? 0.8 : support === 'mast' ? 2.2 : wT / 2);
  const wS = support === 'mast' ? 3.6 : support === 'erector' ? 2.4 : wT;
  // table plan: around the rocket, extended toward the support
  const half = Renv + tableMargin;
  let tx0 = -half, tx1 = half, ty0 = -half, ty1 = half;
  const reach = dist + wS / 2 + (support === 'erector' ? 6.5 : 1.5);
  if (dT[0] > 0) tx1 = Math.max(tx1, reach); if (dT[0] < 0) tx0 = Math.min(tx0, -reach);
  if (dT[1] > 0) ty1 = Math.max(ty1, reach); if (dT[1] < 0) ty0 = Math.min(ty0, -reach);
  const tcx = (tx0 + tx1) / 2, tcy = (ty0 + ty1) / 2;

  M.part('LAUNCH TABLE', () => {
    const T = M.box([tx0, ty0, zT - th], [tx1, ty1, zT]);
    const f = T.f('+z');
    const hr = R1 * 0.95;
    const hole = [-hr - tcx, -hr - tcy, hr - tcx, hr - tcy];
    if (f.on) {
      const n = Math.max(2, Math.round(f.w / 4)), m = Math.max(2, Math.round(f.h / 4));
      for (const r of f.grid(n, m, { gap: 2.2 })) {
        if (r[2] > hole[0] - 0.3 && r[0] < hole[2] + 0.3 && r[3] > hole[1] - 0.3 && r[1] < hole[3] + 0.3) continue;
        K.plain(f, r, { shade: false });
      }
      // the flame hole: a dark opening with a rim
      K.frame(f, [hole[0] - 0.4, hole[1] - 0.4, hole[2] + 0.4, hole[3] + 0.4], { inset: 2.5 });
      f.hatch(hole, { angle: 45, gap: 1.1, w: 0 });
      f.hatch(hole, { angle: -45, gap: 2.2, w: 0 });
    }
    for (const k of ['+x', '-x', '+y', '-y']) {
      const sf = T.f(k);
      if (!sf.on) continue;
      const n = Math.max(1, Math.round(sf.w / 3.2));
      const g = sf.grid(n, 1, { gap: 2.4 });
      g.forEach((r, i) => {
        if (i === 1 && n > 3) { K.frame(sf, r); K.stencil(sf, `PAD ${padNo}`, (r[0] + r[2]) / 2, 0, sf.h * 0.32); return; }
        if (i % 5 === 3) { K.accessHatch(sf, [r[0], r[1] + sf.h * 0.1, r[2], r[3] - sf.h * 0.1]); return; }
        K.corrugated(sf, r);
      });
    }
    // hold-down arms
    for (let k = 0; k < 4; k++) {
      const a = (aView + 45 + 90 * k) * D2R;
      const rr = R1 * 0.9;
      const s0 = Math.max(0.5, R1 * 0.28), s1 = s0 * 0.55;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      const sq = (s) => [[x - s, y - s], [x + s, y - s], [x + s, y + s], [x - s, y + s]];
      M.frustum(sq(s0), zT, sq(s1), zB - 0.05, { isect: false });
      M.at(x, y, zB - 0.05, () => M.boxc([0, 0, 0.0], [s1 * 2.4, s1 * 2.4, 0.1], { isect: false }));
    }
    M.callout('HOLD-DOWN ARM', 4, [Math.cos((aView + 45) * D2R) * R1 * 0.9, Math.sin((aView + 45) * D2R) * R1 * 0.9, (zT + zB) / 2], 1.4);
    M.callout('LAUNCH TABLE', 1, [tx0 + (tx1 - tx0) * 0.5, ty0 + (ty1 - ty0) * 0.5, zT], 2.0);
    M.callout('FLAME HOLE', 1, [hr * 0.7 * Math.cos((aView - 90) * D2R), hr * 0.7 * Math.sin((aView - 90) * D2R), zT], 0.8);
    // under the table
    if (padKind === 'legs') {
      const cols = [];
      const nx = (tx1 - tx0) > 30 ? 3 : 2, ny = (ty1 - ty0) > 30 ? 3 : 2;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        if ((i > 0 && i < nx - 1) && (j > 0 && j < ny - 1)) continue;
        cols.push([tx0 + 1.4 + (tx1 - tx0 - 2.8) * i / (nx - 1), ty0 + 1.4 + (ty1 - ty0 - 2.8) * j / (ny - 1)]);
      }
      for (const [x, y] of cols) SP.panelBox(M, [x - 1.1, y - 1.1, 0], [x + 1.1, y + 1.1, zT - th], { cell: 2.6, roof: false });
      M.part('FLAME DEFLECTOR', () => {
        const a = R1 * 1.4, hD = (zT - th) * 0.62;
        const D = M.extrude([[-a, 0], [a, 0], [0, hD]], -R1 * 1.1, R1 * 1.1, { plane: 'xz' });
        for (const k of ['s0', 's1']) { const sf = D.f(k); if (sf.on) sf.grid(1, 4, { gap: 2.2 }).forEach((r) => K.corrugated(sf, r, { dir: 'h' })); }
        M.callout('FLAME DEFLECTOR', 1, [a * 0.45, 0, hD * 0.5], 1.0);
      });
      M.callout('TABLE COLUMN', cols.length, [cols[0][0], cols[0][1], (zT - th) / 2], 0.7);
    } else if (padKind === 'plinth') {
      const P = M.box([tx0 - 3, ty0 - 3, 0], [tx1 + 3, ty1 + 3, hPl]);
      const pf = P.f('+z');
      if (pf.on) {
        // the flame trench runs out from under the table toward the viewer
        const ex = e[0] >= 0 ? 1 : -1;
        const tr = [-tcx + (ex > 0 ? 0 : -(tx1 - tx0) / 2 - 3), -R1 - tcy, -tcx + (ex > 0 ? (tx1 - tx0) / 2 + 3 : 0), R1 - tcy];
        pf.rect(tr, { w: 1 });
        pf.hatch(tr, { angle: 45, gap: 1.2, w: 0 });
      }
      for (const k of ['+x', '-x', '+y', '-y']) { const sf = P.f(k); if (sf.on) sf.grid(Math.max(1, Math.round(sf.w / 5)), 1, { gap: 2 }).forEach((r) => K.frame(sf, r)); }
      M.callout('CONCRETE PLINTH', 1, [tx0 - 3, (ty0 + ty1) / 2, hPl * 0.5], 0.6);
    } else {
      // transporter-crawler: four track units, a body, pedestals to the table
      M.part('CRAWLER', () => {
        const cx0 = tx0 + (tx1 - tx0) * 0.1, cx1 = tx1 - (tx1 - tx0) * 0.1, cy0 = ty0 + (ty1 - ty0) * 0.08, cy1 = ty1 - (ty1 - ty0) * 0.08;
        const tl = Math.min(12, (cx1 - cx0) * 0.36), tr = 1.15;
        for (const sx of [0, 1]) for (const sy of [0, 1]) {
          const x = sx ? cx1 - tl / 2 : cx0 + tl / 2, y = sy ? cy1 - 1.4 : cy0 + 1.4;
          M.at(x, y, 0, () => K.track(M, { len: tl, r: tr, w: 2.0, pitch: tl * 0.06 }));
          M.boxc([x, y, 2.3 + 0.2], [tl * 0.5, 2.4, 0.5], { isect: false });
        }
        const B = SP.panelBox(M, [cx0, cy0, 2.3 + 0.45], [cx1, cy1, 2.3 + 2.8], { cell: 2.8, kinds: ['corrugated', 'corrugated', 'louver', 'corrugated', 'hatch'] });
        void B;
        for (const [x, y] of [[cx0 + 2, cy0 + 2], [cx1 - 2, cy0 + 2], [cx1 - 2, cy1 - 2], [cx0 + 2, cy1 - 2], [(cx0 + cx1) / 2, cy0 + 2], [(cx0 + cx1) / 2, cy1 - 2]]) M.cyl(0.9, 2.3 + 2.8, zT - th, { seg: 16 });
        // a cab on one corner
        const cxn = e[0] >= 0 ? cx1 : cx0, cyn = e[1] >= 0 ? cy1 : cy0;
        const cb = SP.panelBox(M, [cxn - (e[0] >= 0 ? 3 : 0), cyn - (e[1] >= 0 ? 2.6 : 0), 2.3 + 0.45], [cxn + (e[0] >= 0 ? 0 : 3), cyn + (e[1] >= 0 ? 0 : 2.6), 2.3 + 2.8], { cell: 1.4, kinds: ['xWindow', 'corrugated'] });
        void cb;
        M.callout('CRAWLER TRACK', 4, [cxn - Math.sign(e[0] || 1) * tl / 2, cyn, 1.2], 1.8);
        M.callout('CRAWLER', 1, [(cx0 + cx1) / 2, cyn, 3.6], 1.2);
      });
    }
  });

  // ------------------------------------------------ service tower, erector or umbilical mast
  const P = (s, along, up) => [dT[0] * along + pT[0] * s, dT[1] * along + pT[1] * s, up];
  const towerZ = zT;
  const armLevels = levels.filter(([zz]) => zz > zB + (strap === 'boosters' || strap === 'conical' ? Lb + 1 : 3) && zz < zTop - 1);
  if (support === 'tower' || support === 'mast') {
    const isMast = support === 'mast';
    const hTw = isMast ? (zTop - towerZ) * M.r(0.55, 0.8) : zTop - towerZ + towerExtra;
    M.part(isMast ? 'UMBILICAL MAST' : 'SERVICE TOWER', () => {
      M.at(dT[0] * dist, dT[1] * dist, towerZ, () => {
        const lv = SP.latticeTower(M, { w: wS, h: hTw, bay: wS * (isMast ? 1.6 : 1.0), r: wS * 0.035 });
        // elevator shaft in the far corner
        if (!isMast) {
          const s = wS * 0.36;
          const c = [dT[0] * wS * 0.22 + pT[0] * wS * 0.22, dT[1] * wS * 0.22 + pT[1] * wS * 0.22];
          SP.panelBox(M, [c[0] - s / 2, c[1] - s / 2, 0], [c[0] + s / 2, c[1] + s / 2, hTw], { cell: 3.4, roof: false, kinds: ['corrugated', 'corrugated', 'corrugated', 'louver'] });
        }
        // platforms every other bay
        lv.levels.forEach((zz, k) => { if (k > 0 && k % (isMast ? 1 : 2) === 0) SP.deck(M, -wS / 2, -wS / 2, wS / 2, wS / 2, zz, { t: 0.2 }); });
      });
      M.callout(isMast ? 'UMBILICAL MAST' : 'SERVICE TOWER', 1, P(0, dist - wS / 2, towerZ + hTw * 0.4), 2.6);
      M.callout('LIGHTNING ROD', 1, P(wS * 0.4, dist + wS * 0.4, towerZ + hTw + 3), 0.5);
      // top: crane or a lightning rod
      M.at(dT[0] * (dist + wS * 0.4) + pT[0] * wS * 0.4, dT[1] * (dist + wS * 0.4) + pT[1] * wS * 0.4, towerZ + hTw, () => K.whip(M, { h: isMast ? 6 : 10 }));
      if (!isMast) {
        M.part('HAMMERHEAD CRANE', () => {
          const zc = towerZ + hTw;
          M.at(dT[0] * dist, dT[1] * dist, zc, () => {
            M.cyl(wS * 0.18, 0, 1.2);
            const yaw = Math.atan2(-dT[1], -dT[0]) / D2R + craneYaw;
            M.rz(yaw, () => {
              const jl = dist + R1 * 0.5, bl = wS * 0.9;
              K.girder(M, [-bl, 0, 1.8], [jl, 0, 1.8], { w: 1.1, sec: 4 });
              SP.panelBox(M, [-1.4, -1.0, 1.2], [1.0, 1.0, 3.2], { cell: 1.2, kinds: ['xWindow', 'corrugated'] });
              M.boxc([-bl + 1.0, 0, 1.0], [1.8, 1.6, 1.6]);
              M.line([[jl - 0.6, 0, 1.4], [jl - 0.6, 0, -6]], { w: 1, pass: 1 });
              M.boxc([jl - 0.6, 0, -6.3], [0.5, 0.4, 0.6]);
            });
          });
          M.callout('HAMMERHEAD CRANE', 1, P(0, dist * 0.5, towerZ + hTw + 1.8), 1.6);
        });
      }
      // swing arms
      M.part('SWING ARM', () => {
        const usable = armLevels.filter(([zz]) => zz < towerZ + hTw - 0.8);
        const nA = Math.min(usable.length, isMast ? 2 : 4);
        const pickL = usable.slice().sort((a, b) => b[0] - a[0]).slice(0, nA);
        pickL.forEach(([zz, Rl], k) => {
          const crewArm = crewZ && Math.abs(zz - crewZ) < 0.1;
          const a0 = dist - wS / 2, a1 = Rl + (crewArm ? 1.45 : 0.6);
          const swing = k === 0 ? 0 : (armPick * 40 + k * 17) % 40 - 20;
          const end = P(Math.sin(swing * D2R) * (a0 - a1), a0 - Math.cos(swing * D2R) * (a0 - a1), zz);
          K.girder(M, P(0, a0, zz), end, { w: 1.1, sec: 4 });
          if (crewArm) {
            // crew access arm: a white room at the end
            M.at(end[0], end[1], zz - 1.4, () => SP.panelBox(M, [-1.3, -1.3, 0], [1.3, 1.3, 2.6], { cell: 1.3, kinds: ['octPort', 'corrugated'] }));
            M.callout('CREW ACCESS ARM', 1, [end[0], end[1], zz], 2.0);
          } else {
            M.boxc([end[0], end[1], zz - 0.5], [1.0, 1.0, 0.8]);
            // hoses drooping to the skin
            const s = [end[0] * (Rl + 0.05) / Math.hypot(end[0], end[1]), end[1] * (Rl + 0.05) / Math.hypot(end[0], end[1]), zz - 1.6];
            M.pipe([[end[0], end[1], zz - 0.9], [(end[0] + s[0]) / 2, (end[1] + s[1]) / 2, zz - 2.0], s], 0.12, { isect: false });
          }
          if (k === 0) M.callout('SWING ARM', nA, P(0, (a0 + a1) / 2, zz), 2.1);
        });
      });
    });
  } else {
    M.part('ERECTOR', () => {
      const hE = (zTop - zT) * 0.88;
      const ax = dist;
      for (const s of [-1, 1]) K.girder(M, P(s * R1 * 0.75, ax, zT + 0.8), P(s * R1 * 0.75, ax, zT + hE), { w: 1.4, sec: 4 });
      const nX = Math.max(3, Math.round(hE / 9));
      for (let k = 1; k <= nX; k++) {
        const zz = zT + 0.8 + (hE - 0.8) * k / nX;
        M.tube(P(-R1 * 0.75, ax, zz), P(R1 * 0.75, ax, zz), 0.18, { isect: false });
        if (k % 2 === 0 && zz < zTop - 2) {
          // clamp arms around the stack
          const Rl = radiusAt(st, ist, zB, zz, R1);
          for (const s of [-1, 1]) {
            const p = P(s * R1 * 0.75, ax - 0.7, zz);
            const q = P(s * Rl * 0.72, Rl * 0.72, zz);
            M.tube(p, q, 0.16, { isect: false });
            K.ball(M, q, 0.24);
          }
        }
      }
      // base hinge and the lifting rams
      M.at(0, 0, 0, () => M.tube(P(-R1 * 1.1, ax, zT + 0.8), P(R1 * 1.1, ax, zT + 0.8), 0.5, {}));
      for (const s of [-1, 1]) {
        const base = P(s * R1 * 0.75, ax + 5.5, zT + 0.4), up = P(s * R1 * 0.75, ax + 0.7, zT + hE * 0.28);
        M.boxc(base, [1.6, 1.6, 0.8]);
        const mid = [(base[0] + up[0]) / 2, (base[1] + up[1]) / 2, (base[2] + up[2]) / 2];
        M.tube(base, mid, 0.32, {});
        M.tube(mid, up, 0.18, {});
      }
      M.callout('ERECTOR', 1, P(R1 * 0.75, ax, zT + hE * 0.6), 2.6);
      M.callout('LIFTING RAM', 2, P(R1 * 0.75, ax + 3, zT + hE * 0.14), 1.4);
      M.callout('CLAMP ARM', 2 * Math.floor(nX / 2), P(R1 * 0.6, R1 * 0.9, zT + 0.8 + (hE - 0.8) * 2 / nX), 1.0);
    });
  }

  // ------------------------------------------------ extras on the ground
  const front = [e[0] >= 0 ? 1 : -1, e[1] >= 0 ? 1 : -1];
  const tableHalf = Math.max(tx1 - tx0, ty1 - ty0) / 2;
  const groundZ = padKind === 'plinth' ? 0 : 0;
  const out = Math.max(Math.abs(tx0), tx1, Math.abs(ty0), ty1) + (padKind === 'plinth' ? 3 : 0);
  for (const x of extras) {
    if (x === 'masts') {
      M.part('LIGHTNING MAST', () => {
        const hM = zTop * mastK;
        const pts = [];
        for (const s of [-1, 1]) {
          const p = [pT[0] * s * (out + 5) + dT[0] * (out + 4), pT[1] * s * (out + 5) + dT[1] * (out + 4)];
          M.at(p[0], p[1], 0, () => { M.boxc([0, 0, 0.5], [3, 3, 1]); });
          K.girder(M, [p[0], p[1], 1], [p[0], p[1], hM], { w: 1.4, sec: 3 });
          M.at(p[0], p[1], hM, () => K.whip(M, { h: 5 }));
          pts.push([p[0], p[1], hM - 0.5]);
          // guy wires
          for (const g of [0, 120, 240]) { const a = (g + 30) * D2R; M.line([[p[0], p[1], hM * 0.45], [p[0] + Math.cos(a) * hM * 0.16, p[1] + Math.sin(a) * hM * 0.16, 0]], { w: 0, pass: 1, fit: false }); }
        }
        // the catenary between the masts, sagging over the rocket
        const cat = [];
        for (let i = 0; i <= 16; i++) { const t = i / 16; cat.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t, pts[0][2] - Math.sin(Math.PI * t) * zTop * 0.06]); }
        M.line(cat, { w: 1, pass: 1, fit: false });
        M.callout('LIGHTNING MAST', 2, [pts[0][0], pts[0][1], zTop * 0.5], 1.5);
      });
    } else if (x === 'sphere') {
      M.part('PROPELLANT SPHERE', () => {
        const p = [front[0] * (out + sphR + 4) * (dT[0] ? 0.4 : 1), front[1] * (out + sphR + 4) * (dT[1] ? 0.4 : 1)];
        const q = [-pT[0] * (out + sphR + 5), -pT[1] * (out + sphR + 5)];
        const c = [q[0] - dT[0] * (sphR + 2), q[1] - dT[1] * (sphR + 2)];
        void p;
        M.at(c[0], c[1], 0, () => K.tankSphere(M, { r: sphR }));
        K.pipeRun(M, [[c[0], c[1], 0.5], [c[0] * 0.6, c[1] * 0.6, 0.5], [c[0] * 0.6, c[1] * 0.6, 0.3]], 0.3);
        M.callout('PROPELLANT SPHERE', 1, [c[0], c[1], sphR * 1.35], 1.3);
      });
    } else if (x === 'tanks') {
      M.part('PROPELLANT TANK', () => {
        const c = [pT[0] * (out + 6) + dT[0] * 3, pT[1] * (out + 6) + dT[1] * 3];
        const tr = M.r(1.4, 2.0), tl = tr * M.r(4, 6);
        for (const s of [-1, 1]) {
          const cc = [c[0] + dT[0] * s * tr * 1.3, c[1] + dT[1] * s * tr * 1.3];
          M.at(cc[0], cc[1], tr + 0.6, () => M.rz(Math.atan2(pT[1], pT[0]) / D2R, () => K.tankCapsule(M, { r: tr, len: tl })));
          for (const k of [-0.3, 0.3]) M.boxc([cc[0] + pT[0] * tl * k, cc[1] + pT[1] * tl * k, 0.4], [Math.abs(pT[0]) * 0.6 + Math.abs(dT[0]) * tr * 1.6 + 0.01, Math.abs(pT[1]) * 0.6 + Math.abs(dT[1]) * tr * 1.6 + 0.01, 0.8]);
        }
        M.callout('PROPELLANT TANK', 2, [c[0], c[1], tr * 2 + 0.6], 1.2);
      });
    } else if (x === 'lamps') {
      M.part('FLOOD LIGHT', () => {
        for (const s of [-1, 1]) {
          const p = [front[0] * (out + 4) * (s > 0 ? 1 : 0.2), front[1] * (out + 4) * (s > 0 ? 0.2 : 1)];
          const hL = Math.min(28, zTop * 0.32);
          M.at(p[0], p[1], 0, () => {
            M.boxc([0, 0, 0.3], [1.4, 1.4, 0.6]);
            M.cyl(0.22, 0.6, hL, {});
            M.boxc([0, 0, hL], [0.4, 2.8, 0.2]);
            for (const y of [-1.1, -0.4, 0.4, 1.1]) M.at(0.1, y, hL + 0.25, () => M.rz(Math.atan2(-p[1], -p[0]) / D2R, () => K.lamp(M, { r: 0.28 })));
          });
        }
        M.callout('FLOOD LIGHT', 2, [front[0] * (out + 4), front[1] * (out + 4) * 0.2, 10], 0.8);
      });
    }
  }
  void tableHalf; void groundZ;

  // ------------------------------------------------ vocabulary
  const job = jobWord(jobPick, topKind, true);
  const stagesW = word(nSt).toUpperCase();
  let form = `${stagesW}-STAGE ROCKET`;
  if ((place + ' ' + job + ' ' + form).length > 34) form = 'ROCKET';
  const vol = st.reduce((a, s) => a + Math.PI * s.R * s.R * s.L, 0) + (strap === 'boosters' || strap === 'conical' ? nb * Math.PI * rb * rb * Lb * 0.8 : 0);
  const mass = Math.round(vol * 0.3 / 10) * 10 || 10;
  const payload = Math.max(1, Math.round(mass * 0.032));
  const thrust = Math.round(mass * 9.81 * 1.35 / 100) * 100;
  const extra = strap === 'boosters' || strap === 'conical' ? ` with ${word(nb)} boosters` : '';
  let brief;
  const where = { EQUATORIAL: 'an equatorial pad', COASTAL: 'a coastal pad', DESERT: 'a desert pad', ISLAND: 'an island pad', POLAR: 'a polar pad', HIGHLAND: 'a highland pad', STEPPE: 'a steppe pad' }[place];
  const B = {
    MAIL: [`Lifts ${payload} t of mail to the orbital sorting station${extra}.`, `Lifts ${payload} t of mail to the orbital sorting station.`],
    WEATHER: [`Puts a weather satellite in polar orbit${extra}.`, `Puts a weather satellite in polar orbit from ${where}.`],
    SURVEY: [`Puts a survey satellite in a low orbit to map the ground${extra}.`, `Puts a survey satellite in a low orbit to map the ground.`],
    RELAY: [`Lifts a relay satellite to a high orbit over the equator${extra}.`, `Lifts a relay satellite to a high orbit over the equator.`],
    'LUNAR FERRY': [`Sends ${word(crewN)} crew toward the moon in a capsule under an escape tower.`, `Sends ${word(crewN)} crew toward the moon in a capsule.`],
    CREW: [`Takes ${word(crewN)} crew to the station in a capsule under an escape tower.`, `Takes ${word(crewN)} crew to the station in a capsule.`],
    RESCUE: [`Stands ready to send an empty capsule to a station crew in trouble.`, `Stands ready to send a capsule to a station crew.`],
    'GLIDER CREW': [`Lifts a glider with ${word(crewN)} crew to orbit; it lands on a runway.`, `Lifts a crewed glider to orbit.`],
    'GLIDER MAIL': [`Lifts a mail glider to orbit; it glides home with the replies.`, `Lifts a mail glider to orbit.`],
  };
  const key = topKind === 'glider' ? (job === 'MAIL' ? 'GLIDER MAIL' : 'GLIDER CREW') : job;
  brief = (B[key] || B.SURVEY).find((s) => s.length <= 78) || B.SURVEY[1];
  const specs = [['MASS', `${thou(mass)} T`], ['STAGES', String(nSt)], ['THRUST', `${thou(thrust)} KN`]];
  if (crewN) specs.push(['CREW', String(crewN)]); else specs.push(['PAYLOAD', `${thou(payload)} T`]);
  // the scale figure on the ground in front of the table
  const fx = (front[0] > 0 ? tx1 : tx0) + front[0] * (padKind === 'plinth' ? 4.5 : 1.5);
  const fy = (front[1] > 0 ? ty1 : ty0) * 0.55;
  return {
    place, job: topKind === 'glider' ? (job === 'MAIL' ? 'MAIL' : 'CREW') : job, form, designation: des,
    brief, specs, figure: [fx, fy],
  };
}

function jobWord(p, topKind, full) {
  if (topKind === 'fairing') { const j = ['MAIL', 'WEATHER', 'SURVEY', 'RELAY'][Math.floor(p * 4)]; return full ? j : j; }
  if (topKind === 'capsule') return ['LUNAR FERRY', 'CREW', 'RESCUE'][Math.floor(p * 3)];
  return p < 0.4 ? 'MAIL' : 'CREW';
}

// radius of the stack at height z (for clamp arms)
function radiusAt(st, ist, zB, z, R1) {
  let zz = zB;
  for (let i = 0; i < st.length; i++) {
    if (i > 0) { const I = ist[i - 1]; if (z < zz + I.L) return Math.max(st[i].R, st[i - 1].R); zz += I.L; }
    if (z < zz + st[i].L) return st[i].R;
    zz += st[i].L;
  }
  return st[st.length - 1].R || R1;
}

// a strap-on booster standing on z = 0 (bell below): body, nose, rings, a number
function booster(M, o) {
  const r = o.r, L = o.len;
  const nl = o.nose === 'cone' ? r * 2.2 : r * 2.6;
  const Lc = L - nl;
  const prof = [[r, 0], [r, Lc], ...(o.nose === 'cone' ? [[r * 0.12, L - r * 0.15], [0, L]] : SP.ogive(r, nl, Lc, 7, 0.02).slice(1))];
  const S = M.lathe(prof, { sharpDeg: 20 });
  if (M.decorOn) {
    const Lt = S.lat, tot = Lt.total, tc = Lc / tot;
    for (let k = 0; k <= 6; k++) Lt.ring(0.01 + (tc - 0.02) * k / 6, { w: k === 0 || k === 6 ? 1 : 0 });
    const step = 3.4 * M.px / r / D2R;
    for (let a = 0; a < 360; a += step) if (SP.facing(M, Lt, a, tc / 2) > 0.05) Lt.meridian(a, 0.01, tc * 0.2, { w: 0 });
    Lt.hatch(o.aFace - 70, o.aFace - 20, tc * 0.82, tc * 0.92, { gap: 1.15 });
    Lt.ring(tc * 0.82, { w: 1 }); Lt.ring(tc * 0.92, { w: 1 });
    Lt.text(o.mark, o.aFace + 10, tc * 0.55, r * 0.7, { w: 1 });
    Lt.shade({ gap: 1.7, gapMax: 6 });
  }
  M.at(0, 0, 0, () => K.bell(M, { r: r * 0.6, len: r * 0.6 * 2.3, pump: false }));
  M.cyl(r * 0.98, -0.12, 0, { isect: false });
  if (o.fins) for (let k = 0; k < 3; k++) M.rz(k * 120 + 60 + o.aFace, () => SP.fin(M, { R: r, c0: r * 2.2, c1: r * 0.9, s: r * 0.9, z0: 0.05, drop: r * 0.2 }));
  return S;
}

// a tapered booster: wide at the base, a point at the top, on its own axis
function conical(M, o) {
  const r = o.r, L = o.len;
  const prof = [[r, 0], [r * 0.98, L * 0.12], [r * 0.55, L * 0.72], ...SP.ogive(r * 0.55, L * 0.28, L * 0.72, 6, 0).slice(1)];
  const S = M.lathe(prof, { sharpDeg: 12 });
  if (M.decorOn) {
    const Lt = S.lat;
    for (const t of [0.02, 0.12, 0.3, 0.5, 0.7]) Lt.ring(t, { w: t === 0.02 || t === 0.7 ? 1 : 0 });
    for (let k = 0; k < 12; k++) Lt.meridian(k * 30, 0.02, 0.7, { w: 0 });
    Lt.text(o.mark, o.aFace, 0.4, r * 0.55, { w: 1 });
    Lt.shade({ gap: 1.6, gapMax: 6 });
  }
  M.cyl(r * 0.98, -0.1, 0, { isect: false });
  // a short fin at the outer side
  SP.fin(M, { R: r * 0.98, c0: r * 1.6, c1: r * 0.8, s: r * 0.55, z0: 0.05, drop: 0 });
  return S;
}
function engCluster4(M, r) {
  for (const [x, y] of SP.engineLayout(4, r, r * 0.34)) M.at(x, y, -0.1, () => K.bell(M, { r: r * 0.34, len: r * 0.34 * 2.3, pump: false }));
}

// ====================================================================== the sounding rocket
function sounding(M) {
  const az = M.pick([52, -52, 128, -128]) + M.r(-8, 8), el = M.r(24, 32);
  M.setView(az, el);
  const e = M.view.e;
  const aView = Math.atan2(e[1], e[0]) / D2R;
  const r0 = M.r(0.22, 0.42), L0 = r0 * 2 * M.r(6, 10);
  const two = M.chance(0.65);
  const r1 = r0 * M.r(0.55, 0.8), L1 = r1 * 2 * M.r(6, 11);
  const nFin = M.pick([3, 4, 4]);
  const railEl = M.r(58, 80), railAz = M.r(-35, 35) + 180;
  const truckL = M.r(6.2, 7.6), trL = M.r(6, 8.5);
  const des = SP.designationOf(M);
  const roll = M.pick(['checker', 'stripes', 'band']);
  const rollA = M.r(0, 90);
  const payloadWord = M.pick(['', 'METEO', 'AURORA', 'OZONE']);
  const place = M.pick(['DESERT', 'POLAR', 'COASTAL', 'STEPPE', 'ISLAND', 'HIGHLAND']);
  const job = M.pick(['WEATHER', 'AURORA', 'OZONE', 'UPPER-AIR']);
  const apogee = Math.round(M.r(60, 180) / 10) * 10;
  const jack = M.chance(0.75);
  const cabinBox = M.chance(0.5);

  const W = 2.4;
  const zf = 0.9;                             // trailer frame top
  const rw = 0.45;
  // truck at +x, trailer behind it
  const xTr0 = -trL / 2 - 1.0, xTr1 = trL / 2 - 1.0;  // trailer frame x range
  const truckX = xTr1 + 1.6 + truckL / 2;
  M.part('TRACTOR TRUCK', () => {
    M.at(truckX, 0, 0, () => SP.truck(M, { len: truckL, w: W, r: 0.5, reg: des }));
    M.callout('TRACTOR TRUCK', 1, [truckX + truckL / 2, 0, 1.6], 1.6);
  });
  M.part('TOW BAR', () => {
    M.tube([xTr1, 0.35, zf - 0.2], [truckX - truckL / 2 - 0.3, 0, 0.6], 0.07, {});
    M.tube([xTr1, -0.35, zf - 0.2], [truckX - truckL / 2 - 0.3, 0, 0.6], 0.07, {});
    M.callout('TOW BAR', 1, [(xTr1 + truckX - truckL / 2) / 2, 0, 0.7], 0.8);
  });
  M.part('LAUNCHER TRAILER', () => {
    const F = M.box([xTr0, -W / 2, zf - 0.35], [xTr1, W / 2, zf]);
    for (const k of ['+y', '-y']) { const f = F.f(k); if (f.on) { f.grid(Math.max(2, Math.round(f.w / 1.2)), 1, { gap: 2 }).forEach((r) => K.plain(f, r, { shade: false })); } }
    const top = F.f('+z');
    if (top.on) top.grid(Math.max(2, Math.round(top.w / 1.4)), 2, { gap: 2 }).forEach((r) => K.plain(top, r, { shade: false }));
    for (const x of [xTr0 + 1.0, xTr0 + 1.0 + rw * 2.3]) {
      for (const s of [1, -1]) M.at(x, s * (W / 2 - rw * 0.3), rw, () => K.wheel(M, { r: rw, w: rw * 0.6 }));
      M.tube([x, -W / 2 + rw * 0.3, rw], [x, W / 2 - rw * 0.3, rw], rw * 0.12, { isect: false });
    }
    M.box([xTr0 + 0.4, -W / 2 - 0.05, rw * 2.05], [xTr0 + 1.6 + rw * 2.3, W / 2 + 0.05, rw * 2.15], { isect: false });
    if (jack) {
      for (const sx of [xTr0 + 0.2, xTr1 - 0.3]) for (const s of [1, -1]) {
        const a = [sx, s * W / 2, zf - 0.2], b = [sx, s * (W / 2 + 1.1), 0.12];
        M.tube(a, [sx, s * (W / 2 + 1.1), zf - 0.2], 0.08, { isect: false });
        M.tube([sx, s * (W / 2 + 1.1), zf - 0.15], b, 0.07, {});
        M.at(b[0], b[1], 0, () => M.boxc([0, 0, 0.06], [0.45, 0.45, 0.12]));
      }
      M.callout('OUTRIGGER JACK', 4, [xTr0 + 0.2, (e[1] > 0 ? 1 : -1) * (W / 2 + 1.1), 0.4], 1.1);
    }
    if (cabinBox) SP.panelBox(M, [xTr1 - 1.8, -W / 2 + 0.1, zf], [xTr1 - 0.2, W / 2 - 0.1, zf + 1.6], { cell: 0.9, kinds: ['louver', 'corrugated', 'hatch', 'corrugated'] });
    M.callout('LAUNCHER TRAILER', 1, [(xTr0 + xTr1) / 2, (e[1] > 0 ? 1 : -1) * W / 2, zf - 0.2], 1.4);
  });
  // launcher: turntable, hinged rail, ram
  const pivot = [xTr0 + trL * 0.32, 0, zf + 0.55];
  const totalL = L0 + (two ? L1 + r1 * 3 : r0 * 3.2);
  const railL = totalL * M.r(0.85, 1.05);
  const dir = [Math.cos(railEl * D2R) * Math.cos(railAz * D2R), Math.cos(railEl * D2R) * Math.sin(railAz * D2R), Math.sin(railEl * D2R)];
  const tip = [pivot[0] + dir[0] * railL, pivot[1] + dir[1] * railL, pivot[2] + dir[2] * railL];
  M.part('LAUNCH RAIL', () => {
    M.at(pivot[0], 0, zf, () => { M.cyl(0.9, 0, 0.25); M.cyl(0.75, 0.25, 0.4); });
    for (const s of [1, -1]) M.boxc([pivot[0], s * 0.32, zf + 0.5], [0.5, 0.12, 0.4]);
    K.girder(M, pivot, tip, { w: Math.max(0.35, r0 * 1.3), sec: 3, bay: Math.max(0.6, r0 * 2.5) });
    M.callout('LAUNCH RAIL', 1, [pivot[0] + dir[0] * railL * 0.7, pivot[1] + dir[1] * railL * 0.7, pivot[2] + dir[2] * railL * 0.7], 2.2);
  });
  M.part('ELEVATING RAM', () => {
    const a = [pivot[0] + Math.cos(railAz * D2R) * 1.9, Math.sin(railAz * D2R) * 1.9, zf + 0.1];
    const b = [pivot[0] + dir[0] * railL * 0.32, pivot[1] + dir[1] * railL * 0.32, pivot[2] + dir[2] * railL * 0.32];
    M.boxc(a, [0.4, 0.5, 0.25]);
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    M.tube(a, m, 0.12, {});
    M.tube(m, b, 0.07, {});
    M.callout('ELEVATING RAM', 1, m, 1.2);
  });
  // the rocket rides on top of the rail
  const off = Math.max(0.35, r0 * 1.3) * 0.75 + r0 + 0.04;
  const upN = [-Math.sin(railEl * D2R) * Math.cos(railAz * D2R), -Math.sin(railEl * D2R) * Math.sin(railAz * D2R), Math.cos(railEl * D2R)];
  const base = [pivot[0] + dir[0] * railL * 0.06 + upN[0] * off, pivot[1] + dir[1] * railL * 0.06 + upN[1] * off, pivot[2] + dir[2] * railL * 0.06 + upN[2] * off];
  const rTop = [base[0] + dir[0], base[1] + dir[1], base[2] + dir[2]];
  M.part('BOOSTER', () => {
    M.along(base, rTop, () => M.ry(90, () => {
      const aF = aView;                         // approximate: the lathe angle is found per surface
      const S = M.cyl(r0, 0, L0);
      SP.skin(M, S, { r: r0, len: L0, frames: [[0.02, 1], [0.98, 1], 0.3, 0.6], stringers: 0, seams: 4, a0: 45, text: { str: des, t: 0.55, h: r0 * 0.75 }, shade: true });
      K.bell(M, { r: r0 * 0.75, len: r0 * 1.4, pump: false });
      for (let k = 0; k < nFin; k++) M.rz(k * 360 / nFin + 45, () => SP.fin(M, { R: r0, c0: r0 * 4, c1: r0 * 2, s: r0 * 2.2, z0: 0.05, drop: r0 * 0.5, mark: k === 0 ? '1' : null }));
      void aF;
      if (two) {
        M.cone(r0, r1, L0, L0 + r1 * 0.8);
        M.part('SUSTAINER', () => {
          const z0 = L0 + r1 * 0.8;
          const S2 = M.cyl(r1, z0, z0 + L1);
          SP.skin(M, S2, { r: r1, len: L1, frames: [[0.02, 1], [0.98, 1], 0.5], stringers: 0, seams: 0, a0: 0,
            roll: { kind: roll, a0: rollA, bands: roll === 'checker' ? [[0.6, 0.72], [0.72, 0.84]] : roll === 'stripes' ? [[0.1, 0.4]] : [[0.45, 0.55]] } });
          for (let k = 0; k < nFin; k++) M.rz(k * 360 / nFin, () => SP.fin(M, { R: r1, c0: r1 * 3, c1: r1 * 1.4, s: r1 * 1.4, z0: z0 + 0.05, drop: 0 }));
          const n = SP.ogive(r1, r1 * 5, z0 + L1, 8, 0.02);
          const N = M.lathe([[r1, z0 + L1], ...n.slice(1)]);
          if (M.decorOn) { N.lat.ring(0.3, { w: 1 }); if (payloadWord) N.lat.text(payloadWord, 0, 0.2, r1 * 0.6, { along: true }); N.lat.shade({ gap: 1.6 }); }
          for (let k = 0; k < 4; k++) M.callout('SUSTAINER', 1, [Math.cos(k * Math.PI / 2) * r1 * 1.02, Math.sin(k * Math.PI / 2) * r1 * 1.02, z0 + L1 * 0.5], 1.6);
          for (let k = 0; k < 4; k++) M.callout('NOSE CONE', 1, [Math.cos(k * Math.PI / 2) * r1 * 0.75, Math.sin(k * Math.PI / 2) * r1 * 0.75, z0 + L1 + r1 * 1.6], 1.4);
        });
      } else {
        const n = SP.ogive(r0, r0 * 3.2, L0, 8, 0.02);
        const N = M.lathe([[r0, L0], ...n.slice(1)]);
        if (M.decorOn) { N.lat.ring(0.35, { w: 1 }); N.lat.shade({ gap: 1.6 }); }
        for (let k = 0; k < 4; k++) M.callout('NOSE CONE', 1, [Math.cos(k * Math.PI / 2) * r0 * 0.75, Math.sin(k * Math.PI / 2) * r0 * 0.75, L0 + r0 * 1.0], 1.4);
      }
      for (let k = 0; k < 4; k++) M.callout('BOOSTER', 1, [Math.cos(k * Math.PI / 2) * r0 * 1.02, Math.sin(k * Math.PI / 2) * r0 * 1.02, L0 * 0.5], 2.0);
      M.callout('STABILIZER FIN', nFin * (two ? 2 : 1), [r0 * 2.2, 0, r0 * 1.5], 1.5);
    }));
  });
  M.info.mass = [xTr0, -W / 2, 0, truckX + truckL / 2, W / 2, 3.0];
  M.info.centers = [[base, [base[0] + dir[0] * totalL * 1.08, base[1] + dir[1] * totalL * 1.08, base[2] + dir[2] * totalL * 1.08]]];
  const mass = Math.max(1, Math.round((Math.PI * r0 * r0 * L0 + (two ? Math.PI * r1 * r1 * L1 : 0)) * 1.6 * 10) / 10);
  const briefs = {
    WEATHER: `Fires a weather probe to ${apogee} km from a rail towed behind a truck.`,
    AURORA: `Fires instruments into the aurora from a rail towed behind a truck.`,
    OZONE: `Samples the ozone layer at ${apogee} km; the rail folds down for the road.`,
    'UPPER-AIR': `Carries upper-air instruments to ${apogee} km and drops them on a parachute.`,
  };
  return {
    place, job, form: 'SOUNDING ROCKET', designation: des,
    brief: briefs[job],
    specs: [['MASS', `${mass} T`], ['STAGES', two ? '2' : '1'], ['APOGEE', `${apogee} KM`], ['CREW', '2']],
    figure: [xTr0 - 1.2, (e[1] >= 0 ? 1 : -1) * (W / 2 + 2.2)],
  };
}

void cap; void dot;
