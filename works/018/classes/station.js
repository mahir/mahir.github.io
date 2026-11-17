// classes/station.js: an orbital vehicle floating free. Modules from a pool joined at docking
// collars along one main axis (x): pressurized drums with ports and handrails, a spherical
// node with docking ports, a spoked habitat wheel, a truss boom with solar wings and
// radiators, tank clusters, a telescope with a hinged cover, an engine block with bells, a
// docked capsule. Dishes on masts and a manipulator arm add the asymmetry. There is no
// ground: the scale figure is a spacewalker on a tether at the bottom of the station.

import * as K from '../kit.js';
import * as SP from './parts-space.js';
import { D2R } from '../geom.js';
import { word, thou } from '../words.js';

export default {
  id: 'station',
  family: 'space',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const az = M.pick([62, -62, 118, -118]) + M.r(-8, 8), el = M.r(22, 33);
    M.setView(az, el);
    const e = M.view.e;
    const job = M.wpick([[1.2, 'TUG'], [1, 'RELAY'], [1, 'OBSERVATORY'], [1, 'DEPOT'], [1, 'WORKSHOP'], [0.8, 'LIFEBOAT']]);
    const r0 = M.r(1.7, 2.5);
    const des = SP.designationOf(M);
    const unit = String(M.ri(1, 29)).padStart(2, '0');
    const wheelExtra = job !== 'WORKSHOP' && M.chance(0.18);
    const armOn = job === 'WORKSHOP' || M.chance(0.4);
    const dishN = job === 'RELAY' ? M.ri(2, 3) : M.chance(0.55) ? 1 : 0;
    const wingN = M.pick([1, 2]);
    const wingSpan = M.r(7, 14), wingW = M.r(2.2, 3.4), wingK = M.r(0.55, 1.0), radOn = M.chance(0.6);
    const capEnd = job === 'LIFEBOAT' || M.chance(0.45);
    const capSM = M.chance(0.6);
    const radialCaps = job === 'LIFEBOAT' ? M.ri(2, 3) : M.chance(0.3) ? 1 : 0;
    const styles = ['quilt', 'ribbed', 'stringers'];
    const draws = Array.from({ length: 12 }, () => M.rng());
    const place = M.pick(['LOW ORBIT', 'POLAR ORBIT', 'LUNAR ORBIT', 'HIGH ORBIT', 'MARS ORBIT', 'TRANSFER ORBIT']);
    const crew = { TUG: M.ri(2, 4), RELAY: M.ri(2, 3), OBSERVATORY: M.ri(3, 5), DEPOT: M.ri(1, 3), WORKSHOP: M.ri(5, 9), LIFEBOAT: M.ri(2, 4) }[job];

    // ------------------------------------------------ the plan along x
    const plan = [];
    const drum = (o = {}) => plan.push({ kind: 'drum', r: o.r ?? r0 * M.r(0.85, 1.1), len: o.len ?? r0 * M.r(2.6, 4.2), style: o.style ?? M.pick(styles), wins: M.ri(2, 4), arm: !!o.arm });
    const node = () => plan.push({ kind: 'node', r: r0 * M.r(0.85, 1.05) });
    const truss = (o = {}) => plan.push({ kind: 'truss', len: o.len ?? r0 * M.r(3, 6), w: r0 * M.r(0.7, 1.0), wings: o.wings ?? true, rad: o.rad ?? radOn });
    const tanks = () => plan.push({ kind: 'tanks', n: M.pick([3, 4, 6]), rr: r0 * M.r(0.55, 0.8), len: r0 * M.r(3, 4.6), sph: M.chance(0.35) });
    const engine = () => plan.push({ kind: 'engine', r: r0 * M.r(0.9, 1.2), len: r0 * M.r(1.2, 2), n: M.pick([1, 3, 4]) });
    const tele = () => plan.push({ kind: 'telescope', r: r0 * M.r(0.85, 1.25), len: r0 * M.r(4.5, 7), open: M.r(95, 140) });
    const wheel = () => plan.push({ kind: 'wheel', R: r0 * M.r(3.4, 5.2), rt: r0 * M.r(0.45, 0.65), hubR: r0 * 0.7, len: r0 * M.r(1.6, 2.4), spokes: M.pick([3, 4, 6]) });
    if (job === 'TUG') { engine(); tanks(); truss({ wings: M.chance(0.5) }); node(); drum(); }
    else if (job === 'RELAY') { drum(); node(); truss({ wings: true }); if (M.chance(0.6)) drum(); }
    else if (job === 'OBSERVATORY') { if (M.chance(0.6)) truss({ wings: true }); drum(); node(); tele(); }
    else if (job === 'DEPOT') { if (M.chance(0.5)) engine(); tanks(); node(); tanks(); truss({ wings: true }); }
    else if (job === 'WORKSHOP') { drum({ arm: true }); wheel(); drum(); truss({ wings: true }); }
    else { truss({ wings: true }); drum(); node(); }
    if (wheelExtra) plan.splice(Math.min(plan.length, 2), 0, { kind: 'wheel', R: r0 * M.r(3.2, 4.4), rt: r0 * 0.5, hubR: r0 * 0.7, len: r0 * 2, spokes: M.pick([3, 4]) });
    if (armOn && !plan.some((p) => p.arm)) { const d = plan.find((p) => p.kind === 'drum'); if (d) d.arm = true; }
    if (capEnd && plan[plan.length - 1].kind !== 'telescope') plan.push({ kind: 'capsule', r: r0 * M.r(0.75, 0.95), sm: capSM });
    if (!plan.some((p) => p.kind === 'truss') && wingN) plan.splice(1, 0, { kind: 'truss', len: r0 * 4, w: r0 * 0.8, wings: true, rad: false });
    // per-module numbers
    for (const p of plan) {
      if (p.kind === 'node') p.len = p.r * 2;
      if (p.kind === 'capsule') { p.capLen = p.r * 1.33; p.smLen = p.sm ? p.r * 1.3 : 0; p.len = p.capLen + p.smLen + (p.sm ? p.r * 0.9 : 0); }
      if (p.kind === 'engine') p.bell = p.r * (p.n === 1 ? 0.55 : 0.36) * 2.4;
      p.radL = Math.min(wingSpan * 0.55, 7);
      p.rad0 = p.kind === 'truss' ? p.w * 0.6 + (p.rad ? p.w * 0.55 + 0.3 + p.radL : 0) : p.kind === 'tanks' ? p.rr * 2.4 + r0 * 0.4 : p.kind === 'wheel' ? p.R + p.rt : p.r;
    }
    const cL = 0.9;                                   // collar length
    let T = 0;
    plan.forEach((p, i) => { p.x0 = T; T += p.len; if (i < plan.length - 1) T += cL; });
    const eng = plan[0].kind === 'engine' ? plan[0] : null;
    const x0 = -T / 2 + (eng ? eng.bell * 0.5 : 0);
    for (const p of plan) { p.x0 += x0; p.x1 = p.x0 + p.len; p.xm = (p.x0 + p.x1) / 2; }
    // wings hang a little below the axis when they tilt
    const tilt = Math.atan2(e[0], e[2]) / D2R * wingK;
    const wingDown = wingW / 2 * Math.abs(Math.sin(tilt * D2R)) + 0.2;
    let down = 0, low = plan[0];
    for (const p of plan) { const d = Math.max(p.rad0, p.kind === 'truss' && p.wings ? wingDown : 0); if (d > down) { down = d; low = p; } }
    const zc = down + 0.35;
    const yN = e[1] >= 0 ? 1 : -1;                   // the side toward the viewer
    const nyz = Math.hypot(e[1], e[2]) || 1, ny = e[1] / nyz, nz = e[2] / nyz;
    const rim = (x, r) => [x, ny * r * 1.01, zc + nz * r * 1.01];   // a surface point toward the viewer
    const ax = (p, fn) => M.at(p.x0, 0, zc, () => M.ry(90, fn));  // local z along the station axis
    const aF = Math.atan2(e[1], -e[2]) / D2R;         // lathe angle toward the viewer in that frame (local x = world down)
    let main = null, solarQty = 0, radQty = 0, portQty = 0, capQty = 0, tankQty = 0;
    M.info.mass = [plan[0].x0, -r0, zc - r0, plan[plan.length - 1].x1, r0, zc + r0];
    M.info.centers = [[[plan[0].x0 - 2, 0, zc], [plan[plan.length - 1].x1 + 2, 0, zc]]];

    // ------------------------------------------------ build each module
    plan.forEach((p, i) => {
      const dk = draws[i % draws.length];
      if (p.kind === 'drum') {
        M.part('HABITAT MODULE', () => {
          const S = ax(p, () => SP.drumModule(M, { r: p.r, len: p.len, style: p.style, aF, wins: p.wins, hatch: [dk * 40 - 20, 0.7], text: !main ? des : unit }));
          if (!main) main = p;
          // handrails along the side toward the viewer, RCS quads at the ends
          const tA = S.tA ?? Math.hypot(p.r * 0.45, p.r * 0.4) / p.len, tB = S.tB ?? 1 - tA;
          for (const da of [-28, 30]) SP.handrail(M, S.lat, aF + da, tA + 0.05, tB - 0.05, { h: 0.14, r: 0.03, posts: 4 });
          for (const phi of [yN > 0 ? 40 : 140, 90 + (yN > 0 ? 70 : -70)]) {
            M.at(p.x1 - p.r * 0.3, 0, zc, () => M.rx(phi, () => M.at(0, p.r * 0.97, 0, () => M.rz(90, () => SP.rcsQuad(M, { s: p.r * 0.2 })))));
          }
          const hp = S.lat.at(aF + 30, 0.5);
          M.callout('HABITAT MODULE', plan.filter((q) => q.kind === 'drum').length, rim(p.xm, p.r), 2.6);
          M.callout('HANDRAIL', 2, [hp.p[0] + hp.n[0] * 0.14, hp.p[1] + hp.n[1] * 0.14, hp.p[2] + hp.n[2] * 0.14], 0.5);
          M.callout('THRUSTER QUAD', 2, [p.x1 - p.r * 0.25, yN * p.r * 0.75, zc + p.r * 0.75], 0.9);
          if (p.arm) {
            M.part('MANIPULATOR ARM', () => {
              const b = [p.x0 + p.len * (0.3 + dk * 0.3), -yN * p.r * 0.3, zc + p.r * 0.95];
              const L1 = p.r * 2.2 + dk * p.r, L2 = p.r * 2.0;
              const a1 = (30 + dk * 50) * D2R, a2 = (-20 - dk * 60) * D2R, sw = (dk - 0.5) * 1.2;
              const s0 = [b[0], b[1], b[2] + p.r * 0.35];
              const el1 = [s0[0] + Math.cos(a1) * Math.cos(sw) * L1, s0[1] + Math.sin(sw) * L1 * 0.6, s0[2] + Math.sin(a1) * L1];
              const wr = [el1[0] + Math.cos(a2) * L2, el1[1] - Math.sin(sw) * L2 * 0.4, el1[2] + Math.sin(a2) * L2 + p.r * 0.2];
              SP.manipulator(M, [s0, el1, wr], p.r * 0.07);
              M.callout('MANIPULATOR ARM', 1, el1, 2.0);
            });
          }
        });
      } else if (p.kind === 'node') {
        M.part('DOCKING NODE', () => {
          M.at(p.xm, 0, zc, () => {
            const S = M.sphere(p.r);
            if (M.decorOn) { for (let k = 0; k < 8; k++) S.lat.meridian(k * 22.5, 0.04, 0.96, { w: 0 }); S.lat.ring(0.5, { w: 1 }); S.lat.ring(0.3, { w: 0 }); S.lat.ring(0.7, { w: 0 }); S.lat.shade({ gap: 1.7 }); }
            // side ports: up, toward or away from the viewer
            const ports = [['up', 0], ['side', yN * (dk < 0.5 ? 1 : -1)]];
            for (const [k, s] of ports) {
              const rot = k === 'up' ? (fn) => fn() : (fn) => M.rx(s > 0 ? -90 : 90, fn);
              rot(() => M.at(0, 0, p.r * 0.86, () => SP.dockPort(M, { r: p.r * 0.38, len: p.r * 0.4, kind: k === 'up' ? 'petals' : 'drogue' })));
              portQty++;
            }
          });
          M.callout('DOCKING NODE', 1, rim(p.xm, p.r), 2.2);
          M.callout('DOCKING PORT', 2, [p.xm + p.r * 0.4 * Math.sign(e[0] || 1), yN * p.r * 0.2, zc + p.r * 1.0], 1.5);
          // capsules docked radially at the up port and beyond
          for (let k = 0; k < radialCaps; k++) {
            const c = { r: p.r * 0.62 };
            const capLen = c.r * 1.33, portTop = p.r * 0.86 + p.r * 0.4 + 0.02;
            M.part('DOCKED CAPSULE', () => {
              if (k === 0) M.at(p.xm, 0, zc + portTop + capLen, () => M.rx(180, () => { const top = SP.capsule(M, { r: c.r }); void top; }));
              else {
                const s = k === 1 ? -yN : yN;
                M.at(p.xm, s * (portTop + capLen + p.r * 0.1), zc, () => M.rx(s > 0 ? 90 : -90, () => SP.capsule(M, { r: c.r })));
                M.at(p.xm, 0, zc, () => M.rx(s > 0 ? -90 : 90, () => M.at(0, 0, p.r * 0.86, () => SP.dockPort(M, { r: p.r * 0.38, len: p.r * 0.4 + p.r * 0.1, kind: 'probe' }))));
              }
              capQty++;
              { const h = Math.hypot(e[0], e[1]) || 1; M.callout(job === 'LIFEBOAT' ? 'LIFEBOAT CAPSULE' : 'DOCKED CAPSULE', radialCaps, [p.xm + e[0] / h * c.r * 0.7, e[1] / h * c.r * 0.7, zc + portTop + capLen * 0.45], 2.0); }
            });
          }
        });
      } else if (p.kind === 'truss') {
        M.part('TRUSS BOOM', () => {
          K.girder(M, [p.x0, 0, zc], [p.x1, 0, zc], { w: p.w, sec: 4, bay: p.w * 1.2 });
          M.callout('TRUSS BOOM', 1, [p.xm, yN * p.w * 0.5, zc + p.w * 0.5], 1.6);
        });
        if (p.wings) {
          M.part('SOLAR WING', () => {
            const n = Math.min(wingN, p.len > wingW * 2.2 ? 2 : 1);
            for (let k = 0; k < n; k++) {
              const xw = n === 1 ? p.xm : p.x0 + p.len * (k ? 0.75 : 0.25);
              for (const s of [1, -1]) {
                M.at(xw, s * p.w * 0.55, zc, () => M.rz(90 * s, () => M.rx(s * tilt, () => {
                  SP.wing(M, { x0: 0.6, len: wingSpan, w: Math.min(wingW, p.len / n * 0.9), n: 4, kind: 'solar', boom: 0.6 });
                  const pw = Math.min(wingW, p.len / n * 0.9);
                  for (const zz of [0.05, -0.05]) M.callout('SOLAR WING', 2 * n, [0.6 + wingSpan * 0.37, pw * 0.3, zz], 2.4);
                })));
                M.at(xw, s * p.w * 0.55, zc, () => M.rz(90 * s, () => M.ry(90, () => M.cyl(p.w * 0.22, -0.3, 0.3, { isect: false }))));
                solarQty++;
              }
            }
          });
        }
        if (p.rad) {
          M.part('RADIATOR', () => {
            const xr = p.wings ? p.x0 + p.len * 0.5 : p.xm;
            const L = p.radL, w = Math.min(2.2, p.len * 0.3);
            for (const s of [1, -1]) {
              M.at(xr, 0, zc + s * p.w * 0.55, () => M.ry(-90 * s, () => M.rx(90 - tilt * 0.4, () => {
                SP.wing(M, { x0: 0.3, len: L, w, n: 3, kind: 'radiator', boom: 0.3 });
                for (const zz of [0.07, -0.07]) M.callout('RADIATOR', 2, [0.3 + L * 0.3, w * 0.25, zz], 1.6);
              })));
              radQty++;
            }
          });
        }
      } else if (p.kind === 'tanks') {
        M.part('PROPELLANT TANK', () => {
          K.girder(M, [p.x0, 0, zc], [p.x1, 0, zc], { w: r0 * 0.5, sec: 4 });
          for (let k = 0; k < p.n; k++) {
            const a = (k + 0.5) * 360 / p.n * D2R + (p.n === 4 ? 0 : 0.3);
            const rho = p.rr * 1.12 + r0 * 0.3;
            const y = Math.cos(a) * rho, z = Math.sin(a) * rho;
            if (p.sph) {
              const nS = Math.max(1, Math.floor(p.len / (p.rr * 2.1)));
              for (let j = 0; j < nS; j++) M.at(p.x0 + p.len * (j + 0.5) / nS, y, zc + z - p.rr, () => K.tankSphere(M, { r: p.rr, legs: false }) && null);
            } else {
              M.at(p.xm, y, zc + z, () => K.tankCapsule(M, { r: p.rr, len: p.len * 0.94, axis: 'x' }));
            }
            for (const t of [0.15, 0.85]) M.tube([p.x0 + p.len * t, y * 0.35, zc + z * 0.35], [p.x0 + p.len * t, y * 0.88, zc + z * 0.88], 0.07, { isect: false });
            tankQty += p.sph ? Math.max(1, Math.floor(p.len / (p.rr * 2.1))) : 1;
          }
          for (let k = 0; k < p.n; k++) { const a = (k + 0.5) * 360 / p.n * D2R + (p.n === 4 ? 0 : 0.3), rho = p.rr * 1.12 + r0 * 0.3; M.callout('PROPELLANT TANK', tankQty, [p.xm + (p.sph ? p.len / Math.max(1, Math.floor(p.len / (p.rr * 2.1))) * 0 : 0), Math.cos(a) * rho + ny * p.rr * 1.01, zc + Math.sin(a) * rho + nz * p.rr * 1.01], 2.2); }
        });
      } else if (p.kind === 'engine') {
        M.part('ENGINE BLOCK', () => {
          ax(p, () => {
            const S = M.cyl(p.r, 0, p.len);
            SP.skin(M, S, { r: p.r, len: p.len, frames: [[0.04, 1], [0.96, 1], 0.5], stringers: 3.2, a0: 0, hatches: [[aF + 20, 0.5, p.r * 0.4, p.r * 0.4]], text: { str: unit, t: 0.5, h: p.r * 0.4, a: aF - 30 } });
            M.at(0, 0, 0, () => SP.engines(M, { R: p.r, n: p.n, re: SP.engineFit(p.n, p.r) * 0.9, len: p.bell }));
            for (let k = 0; k < 4; k++) M.rz(45 + k * 90, () => M.at(p.r, 0, p.len * 0.8, () => SP.rcsQuad(M, { s: p.r * 0.22 })));
          });
          M.callout('ENGINE BLOCK', 1, rim(p.xm, p.r), 2.3);
          M.callout('MAIN ENGINE', p.n, rim(p.x0 - p.bell * 0.55, p.r * 0.62), 2.0);
        });
      } else if (p.kind === 'telescope') {
        M.part('TELESCOPE', () => {
          ax(p, () => {
            M.cyl(p.r * 1.06, 0, p.r * 0.3);
            const S = M.lathe([[p.r, p.r * 0.3], [p.r, p.len]], { open: true });
            if (M.decorOn) {
              const L = S.lat;
              for (let k = 1; k < 7; k++) L.ring(k / 7, { w: k % 2 ? 0 : 1 });
              for (let a = 0; a < 360; a += 30) L.meridian(a, 0, 1, { w: 0 });
              L.text(des, aF - 25, 0.45, p.r * 0.3, { along: true });
              L.shade({ gap: 1.7 });
            }
            M.cyl(p.r * 1.04, p.len - 0.12, p.len, { isect: false });
            // the dark aperture and the hinged cover
            const D = M.cyl(p.r * 0.96, p.len - 0.5, p.len - 0.45, { isect: false });
            if (D.top.on) { D.top.hatch(D.top.box, { angle: 30, gap: 1.0, w: 0 }); D.top.circle(0, 0, p.r * 0.3, { w: 1 }); }
            M.at(-p.r * 1.04, 0, p.len, () => {
              M.boxc([0, 0, 0], [0.3, p.r * 0.5, 0.3], { isect: false });
              M.ry(-p.open, () => {
                const C = M.cyl(p.r * 1.05, -0.06, 0.08, { isect: false });
                M.at(p.r * 1.04, 0, 0, () => M.cyl(p.r * 1.05, 0, 0.14, { isect: false }));
                if (C.top.on) { C.top.circle(0, 0, p.r * 0.8, { w: 1 }); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; C.top.line(0, 0, Math.cos(a) * p.r * 0.8, Math.sin(a) * p.r * 0.8, { w: 0 }); } }
              });
            });
          });
          M.callout('TELESCOPE TUBE', 1, rim(p.xm, p.r), 2.6);
          { const o = p.open * D2R; M.callout('APERTURE COVER', 1, [p.x1 + p.r * Math.sin(o) * 1.0 + 0.1 * Math.cos(o), 0, zc + p.r * 1.04 - p.r * Math.cos(o) + 0.1 * Math.sin(o)], 2.0); }
        });
      } else if (p.kind === 'wheel') {
        M.part('HABITAT RING', () => {
          ax(p, () => {
            const H = M.cyl(p.hubR, 0, p.len);
            if (M.decorOn) { for (let k = 1; k < 4; k++) H.lat.ring(k / 4, { w: 1 }); H.lat.shade({ gap: 1.8 }); }
            M.at(0, 0, p.len / 2, () => {
              const Tr = M.torus(p.R, p.rt, { rings: 16 });
              if (M.decorOn) {
                const L = Tr.lat;
                for (let a = 0; a < 360; a += 7.5) L.meridian(a, 0, 1, { w: a % 15 ? 0 : 1 });
                for (let a = 3.75; a < 360; a += 15) L.port(a, 0.07, p.rt * 0.16, { w: 1 });
                for (let q = 0; q < 4; q++) L.shade({ t0: q * 0.25 + 0.002, t1: q * 0.25 + 0.248, gap: 1.7, gapMax: 6 });
              }
              for (let k = 0; k < p.spokes; k++) {
                const a = (k * 360 / p.spokes + 30) * D2R;
                const A = [Math.cos(a) * p.hubR, Math.sin(a) * p.hubR, 0], B = [Math.cos(a) * (p.R - p.rt * 0.9), Math.sin(a) * (p.R - p.rt * 0.9), 0];
                K.strut(M, A, B, p.rt * 0.22, { mid: true });
              }
            });
          });
          M.callout('HABITAT RING', 1, rim(p.xm, p.R + p.rt), 2.6);
          for (let k = 0; k < p.spokes; k++) { const a = (k * 360 / p.spokes + 30) * D2R; M.callout('SPOKE', p.spokes, [p.xm + p.rt * 0.22 * Math.sign(e[0] || 1), Math.sin(a) * p.R * 0.55, zc - Math.cos(a) * p.R * 0.55], 0.9); }
        });
      } else if (p.kind === 'capsule') {
        M.part('DOCKED CAPSULE', () => {
          ax(p, () => {
            // apex toward the station: the capsule's frame turned end for end
            const base = p.capLen;
            M.at(0, 0, base, () => M.rx(180, () => SP.capsule(M, { r: p.r })));
            if (p.sm) {
              const z0 = base + p.r * 0.12;
              const S = M.cyl(p.r * 0.95, z0, z0 + p.smLen);
              SP.skin(M, S, { r: p.r, len: p.smLen, frames: [[0.05, 1], [0.95, 1], [0.3, 1], [0.7, 1]], stringers: 2.4, sT: [0.3, 0.7], a0: 0 });
              M.at(0, 0, z0 + p.smLen, () => M.rx(180, () => K.bell(M, { r: p.r * 0.45, len: p.r * 0.9, pump: false })));
              M.callout('SERVICE MODULE', 1, [Math.cos(aF * D2R) * p.r, Math.sin(aF * D2R) * p.r, z0 + p.smLen * 0.5], 1.0);
            }
          });
          capQty++;
          M.callout('FERRY CAPSULE', 1, rim(p.x0 + p.capLen * 0.55, p.r * 0.6), 2.1);
        });
      }
      // collar to the next module
      if (i < plan.length - 1) {
        const q = plan[i + 1];
        const rc = Math.min(p.kind === 'truss' ? p.w * 0.7 : p.kind === 'tanks' ? r0 * 0.45 : p.kind === 'wheel' ? p.hubR * 0.8 : (p.r ?? r0) * 0.55,
          q.kind === 'truss' ? q.w * 0.7 : q.kind === 'tanks' ? r0 * 0.45 : q.kind === 'wheel' ? q.hubR * 0.8 : (q.r ?? r0) * 0.55);
        M.part('DOCKING COLLAR', () => {
          M.at(p.x1 - 0.05, 0, zc, () => M.ry(90, () => SP.collarRing(M, rc, cL + 0.1)));
          M.callout('DOCKING COLLAR', plan.length - 1, rim(p.x1 + cL * 0.12, rc * 1.18), 1.3);
        });
      }
    });

    // ------------------------------------------------ dishes on masts
    const hosts = plan.filter((p) => p.kind === 'drum' || (p.kind === 'node' && !radialCaps));
    for (let k = 0; k < dishN && hosts.length; k++) {
      const h = hosts[k % hosts.length];
      const dk = draws[(k + 5) % draws.length];
      M.part('DISH ANTENNA', () => {
        const rd = r0 * (job === 'RELAY' ? 0.9 + dk * 0.5 : 0.7);
        if (k === 1) {
          // on a side boom away from the viewer, tilted up
          const yb = -yN * (h.r + rd * 1.6);
          M.tube([h.xm, -yN * h.r * 0.9, zc], [h.xm, yb, zc], r0 * 0.06, {});
          M.at(h.xm, yb, zc, () => M.rx(yN * 90, () => { K.dishMount(M, { r: rd, el: 20 + dk * 40, az: dk * 360 }); M.callout('DISH ANTENNA', dishN, [0, 0, rd * 0.92], 2.2); M.callout('DISH ANTENNA', dishN, [rd * 0.3, 0, rd * 0.12], 2.2); }));
        } else {
          const mh = rd * (1.0 + dk);
          const x = h.kind === 'node' ? h.xm : h.x0 + h.len * (0.25 + dk * 0.2);
          K.girder(M, [x, 0, zc + h.r * 0.9], [x, 0, zc + h.r + mh], { w: r0 * 0.22, sec: 3 });
          M.at(x, 0, zc + h.r + mh, () => { K.dishMount(M, { r: rd, el: 25 + dk * 45, az: 90 + dk * 180 }); M.callout('DISH ANTENNA', dishN, [0, 0, rd * 0.92], 2.2); M.callout('DISH ANTENNA', dishN, [rd * 0.3, 0, rd * 0.12], 2.2); });
        }
        M.callout('DISH ANTENNA', dishN, [h.xm, 0, zc + h.r * 0.98], 1.0);
      });
    }
    // a whip antenna on the last drum
    const lastDrum = plan.filter((p) => p.kind === 'drum').pop();
    if (lastDrum) M.part('WHIP ANTENNA', () => M.at(lastDrum.x1 - lastDrum.r * 0.6, -yN * lastDrum.r * 0.4, zc + lastDrum.r * 0.85, () => K.whip(M, { h: r0 * 2.5, lean: 15 })));

    // ------------------------------------------------ the spacewalker's tether
    const sx = e[0] >= 0 ? 1 : -1;
    const fx = low.kind === 'wheel' ? low.xm + sx * (low.rt + 1.2) : low.xm + sx * (low.len ?? 2) * 0.2;
    const fy = yN * (low.kind === 'wheel' ? 1.6 : 1.0);
    const hook = low.kind === 'wheel' ? [low.xm, 0, zc - low.R - low.rt * 0.2] : [low.xm, 0, zc - down + 0.45];
    M.part('TETHER', () => {
      const a = [fx, fy, 1.15], b = hook;
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * 0.6 * yN, a[2] + (b[2] - a[2]) * t - Math.sin(Math.PI * t) * 0.5]); }
      M.line(pts, { w: 1, pass: 2 });
      M.callout('SPACEWALKER ON TETHER', 1, pts[5], 1.4);
    });

    // ------------------------------------------------ vocabulary
    const vol = plan.reduce((a, p) => a + (p.kind === 'drum' ? Math.PI * p.r * p.r * p.len : p.kind === 'node' ? 4.2 * p.r ** 3 : p.kind === 'tanks' ? p.n * Math.PI * p.rr * p.rr * p.len : p.kind === 'wheel' ? 2 * Math.PI * p.R * Math.PI * p.rt * p.rt : 6 * r0 * r0), 0);
    const mass = Math.round(vol * 0.12);
    const power = Math.round((solarQty * wingSpan * wingW * 0.12 + 8) / 5) * 5;
    const forms = {
      TUG: ['CARGO', 'TUG'], RELAY: ['RELAY', draws[0] < 0.5 ? 'STATION' : 'PLATFORM'], OBSERVATORY: [draws[0] < 0.5 ? 'SKY' : 'SOLAR', 'OBSERVATORY'],
      DEPOT: ['FUEL', 'DEPOT'], WORKSHOP: ['REPAIR', 'WORKSHOP'], LIFEBOAT: ['LIFEBOAT', 'STATION'],
    }[job];
    const teleP = plan.find((p) => p.kind === 'telescope');
    const B = {
      TUG: [`Moves cargo between orbits; ${word(crew)} crew live in the forward drum.`, `Moves cargo between orbits with ${word(crew)} crew aboard.`],
      RELAY: [`Passes signals to the far side on ${word(dishN)} dishes; ${word(crew)} crew keep it running.`, `Passes signals to the far side on ${word(dishN)} dishes.`],
      OBSERVATORY: [`Watches the ${forms[0] === 'SKY' ? 'sky' : 'sun'} through a telescope with a hinged cover; ${word(crew)} crew.`, `Watches the ${forms[0] === 'SKY' ? 'sky' : 'sun'} through a telescope with a hinged cover.`],
      DEPOT: [`Stores propellant in ${word(tankQty)} tanks for tugs and landers passing by.`, `Stores propellant for tugs and landers passing by.`],
      WORKSHOP: [`Repairs satellites with a long arm; ${word(crew)} crew work in shifts.`, `Repairs satellites with a long arm.`],
      LIFEBOAT: [`Keeps ${word(capQty)} capsules ready to bring a station crew home.`, `Keeps capsules ready to bring a station crew home.`],
    }[job];
    let brief = B.find((s) => s.length <= 78) || B[1];
    brief = brief.charAt(0).toUpperCase() + brief.slice(1);
    const specs = [['MASS', `${thou(mass)} T`], ['CREW', String(crew)], ['POWER', `${power} KW`]];
    if (job === 'TUG') specs.push(['DELTA-V', `${thou(Math.round(3000 + draws[1] * 3000))} M/S`]);
    else if (teleP) specs.push(['APERTURE', `${thou(Math.round(teleP.r * 1.8 * 1000 / 10) * 10)} MM`]);
    else if (plan.some((p) => p.kind === 'wheel')) specs.push(['SPIN', `${(2 + draws[2] * 2).toFixed(1)} RPM`]);
    else if (tankQty) specs.push(['PROPELLANT', `${thou(Math.round(tankQty * 40 * r0))} T`]);
    else specs.push(['DOCKING PORTS', String(portQty + 1)]);
    return {
      place, job: forms[0], form: forms[1], designation: des, brief, specs,
      float: false,
      figure: [fx, fy],
    };
  },
};
