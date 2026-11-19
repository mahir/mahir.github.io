// classes/pavilion.js: small public buildings that move. A newspaper kiosk, a bandstand, a
// greenhouse, a carousel, a telephone box, a garden shed with its water butt and a bus
// shelter, each built correctly as a building at its true size, then fitted for travel: a
// steel skid with tie-down straps, lamps, a number plate, steps or a ladder to the ground and
// a place to drive it from, and carried by running gear from gear.js.

import * as K from '../kit.js';
import * as B from './parts-build.js';
import { word, thou } from '../words.js';
import { D2R, circlePts } from '../geom.js';

let G = null;
try { G = await import('./gear.js'); } catch (e) { G = null; }
let X = null;
try { X = await import('./extras.js'); } catch (e) { X = null; }

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const sgnY = (M) => (M.view.e[1] >= 0 ? 1 : -1);
const sgnX = (M) => (M.view.e[0] >= 0 ? 1 : -1);

function gearPlan(M, o) {
  if (G && G.plan) return G.plan(M, o);
  return { kind: 'none', z: 0, family: 'ground', float: false, form: 'ON A SKID', adj: 'MOBILE', goes: 'travels', places: ['TOWN'], build: () => ({ specs: [], figure: null }) };
}
const octPlan = (R) => { const c = R * 0.41; return [[-R + c, -R], [R - c, -R], [R, -R + c], [R, R - c], [R - c, R], [-R + c, R], [-R, R - c], [-R, -R + c]]; };
const rectPlan = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// index of the side of a polyLathe (n sides, default rot) whose middle is nearest azimuth A
const sideNear = (n, A) => (((Math.round((A - 180 / n) / (360 / n) - 0.5)) % n) + n) % n;

// the skid under every pavilion and the common travel fittings on it
function skid(M, ctx, o) {
  const { g } = ctx;
  const h = o.h ?? 0.22;
  M.part('SKID FRAME', () => {
    B.baseDeck(M, o.plan, h, {});
    M.callout('SKID FRAME', 1, [o.front, 0, h * 0.5], 0.8);
  });
  // tie-down straps from lugs on the building to eyes on the skid
  if (o.ties && o.ties.length) {
    M.part('TIE-DOWN STRAP', () => {
      for (const [a, b] of o.ties) B.tieDown(M, a, b, { r: o.tieR ?? 0.018 });
      M.callout('TIE-DOWN STRAP', o.ties.length, o.ties[0][1], 1.0);
    });
  }
  M.part('LAMP', () => {
    for (const s of [1, -1]) {
      M.at(o.front - 0.1, s * o.halfW * 0.8, h, () => { M.cyl(0.04, 0, 0.28, { isect: false }); M.at(0, 0, 0.36, () => K.lamp(M, { r: 0.1 })); });
      M.at(o.back + 0.1, s * o.halfW * 0.8, h, () => { M.cyl(0.035, 0, 0.22, { isect: false }); M.at(0, 0, 0.28, () => M.rz(180, () => K.lamp(M, { r: 0.07 }))); });
    }
    M.callout('ROAD LAMP', 4, [o.front - 0.1, o.halfW * 0.8 * sgnY(M), h + 0.36], 0.9);
  });
  // number plate on the skid front edge
  M.part('NUMBER PLATE', () => {
    M.at(o.front + 0.005, -o.halfW * 0.45 * sgnY(M), h * 0.5, () => {
      const Bd = M.box([0, -0.42, -0.1], [0.03, 0.42, 0.1], { isect: false });
      const f = Bd.f('+x');
      if (f.on && f.front) { f.rect(-f.w / 2 + f.mOf(1), -f.h / 2 + f.mOf(1), f.w / 2 - f.mOf(1), f.h / 2 - f.mOf(1), { w: 0 }); f.text(ctx.des, 0, 0, 0.11); }
    });
    M.callout('NUMBER PLATE', 1, [o.front, -o.halfW * 0.45 * sgnY(M), h * 0.5], 0.5);
  });
  // a ladder from the skid edge to the ground on the door side
  let fig = null;
  if (o.ladder && g.family !== 'air' && g.z >= 0.6) {
    M.part('BOARDING LADDER', () => {
      const [x, y, rz] = o.ladder;
      M.with({ at: [x, y, h], rz }, () => { const r = B.boardingLadder(M, g.z + h, { w: 0.45 }); fig = [r.foot[0], r.foot[1]]; });
      M.callout('BOARDING LADDER', 1, [x, y, -g.z * 0.4], 1.3);
    });
  }
  return { h, fig };
}
function cab(M, at, rz = 0) {
  M.part('DRIVING CAB', () => {
    M.with({ at, rz }, () => B.driverCab(M, { w: 1.3, d: 1.3, h: 1.85 }));
    M.callout('DRIVING CAB', 1, [at[0] + 0.65, at[1], at[2] + 1.1], 1.7);
  });
}

// ================================================================== NEWSPAPER KIOSK
const kiosk = {
  name: 'NEWSPAPER KIOSK',
  plan(M) {
    const p = {};
    p.R = M.r(1.35, 1.8);
    p.hw = M.r(2.3, 2.7);
    p.roof = M.pick(['tent', 'dome', 'bell']);
    p.rise = p.R * (p.roof === 'tent' ? M.r(0.7, 1.0) : M.r(0.8, 1.1));
    p.cover = M.pick(['seam', 'slate', 'stripe']);
    p.words = M.shuffle(['NEWS', 'LATEST', 'EVENING', 'SPORT', 'WEATHER', 'MARKET', 'RESULTS', 'TIDES']);
    p.stove = M.chance(0.6);
    p.cabOn = M.chance(0.65);
    p.skH = 0.22;
    p.front = p.R + (p.cabOn ? 1.9 : 0.5);
    p.back = -p.R - 0.4;
    p.H = p.skH + p.hw + 0.35 + p.rise + 0.9;
    p.box = { len: p.front - p.back, wid: 2 * p.R + 0.8, hgt: p.H, mass: Math.round(p.R * p.R * 1.4 * 10) / 10 + 1.5, round: true, dx: (p.front + p.back) / 2 };
    p.papers = M.ri(18, 40) * 100;
    return p;
  },
  build(M, p, ctx) {
    const n = 8, kc = 1 / Math.cos(Math.PI / n), Rc = p.R * kc, z0 = p.skH;
    const sk = skid(M, ctx, { plan: rectPlan(p.back, -p.R - 0.4, p.front, p.R + 0.4), front: p.front, back: p.back, halfW: p.R + 0.4, h: p.skH,
      ties: Array.from({ length: 4 }, (_, i) => { const a = (45 + 90 * i) * D2R; return [[Math.cos(a) * p.R * 1.0, Math.sin(a) * p.R * 1.0, z0 + 0.45], [Math.cos(a) * (p.R + 0.32), Math.sin(a) * (p.R + 0.32), z0]]; }),
      ladder: [p.back + 0.6, (p.R + 0.4) * sgnY(M), 90 * sgnY(M)] });
    const iH = sideNear(n, B.viewAz(M));            // the serving hatch faces the viewer
    let body;
    M.part('KIOSK', () => {
      M.at(0, 0, z0, () => B.polyLathe(M, [[Rc * 1.04, 0], [Rc * 1.04, 0.18]], n));
      body = B.polyLathe(M, [[Rc, z0 + 0.18], [Rc, z0 + p.hw]], n);
      let w = 0;
      for (let i = 0; i < n; i++) {
        const f = body.facet(0, i);
        if (!f.on || !f.front) continue;
        const y0 = -f.h / 2, dado = 0.85, top = f.h / 2 - 0.2;
        // dado panels
        K.frame(f, [-f.w / 2 + 0.06, y0 + 0.08, f.w / 2 - 0.06, y0 + dado]);
        f.rect(-f.w / 2 + 0.16, y0 + 0.18, f.w / 2 - 0.16, y0 + dado - 0.1, { w: 0 });
        if (i === iH) {
          // the serving hatch: the dark opening and its shelf of papers
          const hx = f.w * 0.42, hy0 = y0 + 1.0, hy1 = top - 0.1;
          f.rect(-hx, hy0, hx, hy1, { w: 1 });
          f.hatch([-hx, hy0, hx, hy1], { angle: 70, gap: 1.1, gap2: 2.2, w: 0 });
          continue;
        }
        if (i % 2 === iH % 2) {
          // a rack of papers
          const rx = f.w * 0.4, ry0 = y0 + 1.0, ry1 = top - 0.05;
          f.rect(-rx, ry0, rx, ry1, { w: 1 });
          const rows = 4;
          for (let r = 0; r < rows; r++) {
            const a = ry0 + (ry1 - ry0) * r / rows, b = ry0 + (ry1 - ry0) * (r + 1) / rows;
            f.line(-rx, a, rx, a, { w: 1 });
            for (let c = 0; c < 3; c++) {
              const cx0 = -rx + 2 * rx * c / 3 + 0.03, cx1 = -rx + 2 * rx * (c + 1) / 3 - 0.03;
              f.rect(cx0, a + 0.04, cx1, b - 0.02, { w: 0 });
              if (f.pxOf(b - a) > 9) for (let k = 1; k < 5; k++) f.line(cx0 + 0.03, b - 0.06 - (b - a - 0.12) * k / 5, cx1 - 0.03, b - 0.06 - (b - a - 0.12) * k / 5, { w: 0 });
            }
          }
        } else {
          // a poster with stroke lettering
          const rx = f.w * 0.38, ry0 = y0 + 1.05, ry1 = top - 0.05;
          f.rect(-rx, ry0, rx, ry1, { w: 1 });
          const word = p.words[w++ % p.words.length];
          const ch = Math.min(0.17, (2 * rx * 0.85) / Math.max(1, f.textWidth(word, 1)));
          f.text(word, 0, ry1 - 0.2, ch);
          for (let k = 0; k < 4; k++) f.line(-rx * 0.8, ry1 - 0.45 - k * 0.14, rx * (0.8 - (k % 2) * 0.3), ry1 - 0.45 - k * 0.14, { w: 0 });
          f.rect(-rx * 0.7, ry0 + 0.08, rx * 0.7, ry0 + 0.35, { w: 0 });
        }
        if (f.tone > 0.4) f.hatch([-f.w / 2, y0, f.w / 2, f.h / 2], { angle: 45, gap: 5 - 2.6 * f.tone, w: 0 });
      }
      // corner posts
      for (let i = 0; i < n; i++) { const a = (180 / n + i * 360 / n) * D2R; M.at(Math.cos(a) * Rc, Math.sin(a) * Rc, z0, () => M.cyl(0.05, 0.18, p.hw, { isect: false, seg: 8 })); }
      // cornice
      M.at(0, 0, z0 + p.hw, () => { B.polyLathe(M, [[Rc * 1.05, 0], [Rc * 1.12, 0.2], [Rc * 1.12, 0.35]], n); });
      M.callout('KIOSK', 1, [Math.cos(B.viewAz(M) * D2R) * p.R, Math.sin(B.viewAz(M) * D2R) * p.R, z0 + 0.5], 0.8);
      M.callout('PAPER RACK', 4, (() => { const a = body.angle((iH + 2) % n) * D2R; return [Math.cos(a) * p.R, Math.sin(a) * p.R, z0 + 1.6]; })(), 1.8);
      M.callout('POSTER', 3, (() => { const a = body.angle((iH + 1) % n) * D2R; return [Math.cos(a) * p.R, Math.sin(a) * p.R, z0 + 1.9]; })(), 1.4);
    });
    // serving hatch: counter, shutter propped as an awning
    M.part('SERVING HATCH', () => {
      const a = body.angle(iH);
      const fw = 2 * p.R * Math.tan(Math.PI / n);
      M.with({ at: [Math.cos(a * D2R) * p.R, Math.sin(a * D2R) * p.R, z0], rz: a }, () => {
        M.box([0, -fw * 0.45, 0.18 + 1.0 - 0.06], [0.35, fw * 0.45, 0.18 + 1.0]);
        for (let k = 0; k < 3; k++) M.box([0.05 + k * 0.09, -fw * 0.38, 1.18], [0.12 + k * 0.09, fw * 0.38, 1.18 + 0.03 + k * 0.01], { isect: false });
        const hz = p.hw - 0.2;
        M.with({ at: [0, 0, hz], ry: -24 }, () => {
          const S = M.box([0, -fw * 0.47, -0.04], [0.9, fw * 0.47, 0.0]);
          const f = S.f('+z'); if (f.on) { const m = 6; for (let i = 1; i < m; i++) f.line(-f.w / 2, -f.h / 2 + f.h * i / m, f.w / 2, -f.h / 2 + f.h * i / m, { w: 0 }); }
          const u = S.f('-z'); if (u.on && u.front) u.hatch(u.box, { angle: 0, gap: 2, w: 0 });
        });
        for (const s of [1, -1]) M.tube([0.02, s * fw * 0.44, hz - 0.75], [Math.cos(24 * D2R) * 0.8, s * fw * 0.44, hz + Math.sin(24 * D2R) * 0.8], 0.015, { isect: false });
      });
      M.callout('SHUTTER AWNING', 1, [Math.cos(a * D2R) * (p.R + 0.5), Math.sin(a * D2R) * (p.R + 0.5), z0 + p.hw - 0.05], 2.0);
      M.callout('SERVING HATCH', 1, [Math.cos(a * D2R) * (p.R + 0.2), Math.sin(a * D2R) * (p.R + 0.2), z0 + 1.2], 1.6);
    });
    // roof and finial
    M.part('ROOF', () => {
      const z = z0 + p.hw + 0.35, R = Rc * 1.1, h = p.rise;
      const prof = p.roof === 'tent' ? [[R, z], [R * 0.45, z + h * 0.42], [0, z + h]]
        : p.roof === 'dome' ? [[R, z], [R * 0.98, z + h * 0.22], [R * 0.8, z + h * 0.55], [R * 0.45, z + h * 0.85], [0, z + h]]
          : [[R * 1.05, z], [R * 0.86, z + h * 0.12], [R * 0.62, z + h * 0.35], [R * 0.45, z + h * 0.62], [R * 0.25, z + h * 0.85], [0, z + h]];
      B.facetRoof(M, prof, n, p.cover, { hips: p.cover !== 'stripe', hipR: 0.035 });
      if (p.cover === 'stripe') B.valance(M, R * 1.0, n, z + 0.02, 0.28, { scallops: 3 });
      M.at(0, 0, z + h - 0.05, () => B.finial(M, { h: 0.8, r: 0.1 }));
      M.callout('ROOF', 1, [Math.cos(B.viewAz(M) * D2R) * R * 0.6, Math.sin(B.viewAz(M) * D2R) * R * 0.6, z + h * 0.35], 0.9);
      M.callout('FINIAL', 1, [0, 0, z + h + 0.4], 0.7);
      if (p.stove) {
        const a = (B.viewAz(M) + 150) * D2R, r = R * 0.45, zz = z + h * 0.5;
        M.at(Math.cos(a) * r, Math.sin(a) * r, zz, () => { M.cyl(0.07, -0.5, 1.0, {}); M.at(0, 0, 1.0, () => M.lathe([[0.16, 0], [0.16, 0.05], [0.001, 0.18]], { isect: false })); });
        M.callout('STOVE PIPE', 1, [Math.cos(a) * r, Math.sin(a) * r, zz + 0.8], 0.7);
      }
    });
    if (p.cabOn) cab(M, [p.R + 0.25 + 0.65, 0, p.skH]);
    const brief = M.pick([
      'Takes the newsstand to whichever square has the market that day.',
      `Carries ${thou(p.papers)} papers out to the suburbs before seven each morning.`,
      'Meets the night train with the morning papers and the racing results.',
    ]);
    return { brief, fig: sk.fig, specs: [['PAPERS', thou(p.papers)], ['RACKS', '4']], crew: 1, mass: [-Rc, -Rc, 0, Rc, Rc, z0 + p.hw + 0.35], places: ['MARKET', 'CITY', 'STATION', 'SUBURBAN', 'BOULEVARD', 'HARBOR'] };
  },
};

// ================================================================== BANDSTAND
const bandstand = {
  name: 'BANDSTAND',
  plan(M) {
    const p = {};
    p.R = M.r(3.2, 4.4);
    p.hp = M.r(0.9, 1.4);
    p.hc = M.r(2.6, 3.1);
    p.rise = p.R * M.r(0.55, 0.8);
    p.roof = M.pick(['bell', 'ogee', 'tent']);
    p.cover = M.pick(['seam', 'slate', 'stripe']);
    p.stands = M.ri(4, 7);
    p.nSteps = Math.max(4, Math.round(p.hp / 0.18));
    p.skH = 0.25;
    p.front = p.R / Math.cos(Math.PI / 8) + p.nSteps * 0.28 + 0.1;
    p.H = p.skH + p.hp + p.hc + 0.4 + p.rise + 1.0;
    p.vane = M.chance(0.4);
    p.vaneDir = M.r(0, 360);
    p.box = { len: 2 * p.front, wid: 2 * p.front, hgt: p.H, mass: Math.round(p.R * p.R * 1.8), round: true };
    return p;
  },
  build(M, p, ctx) {
    const n = 8, kc = 1 / Math.cos(Math.PI / n), Rc = p.R * kc, z0 = p.skH, zf = z0 + p.hp;
    const iS = sideNear(n, Math.round(B.viewAz(M) / 45) * 45);
    const aS = (180 / n + (iS + 0.5) * 360 / n);
    const sk = skid(M, ctx, {
      plan: octPlan(p.front), front: p.front, back: -p.front, halfW: p.front * 0.6, h: p.skH,
      ties: Array.from({ length: 8 }, (_, i) => { const a = (180 / n + i * 360 / n) * D2R; return [[Math.cos(a) * Rc * 0.99, Math.sin(a) * Rc * 0.99, z0 + p.hp * 0.5], [Math.cos(a) * (Rc + 0.5), Math.sin(a) * (Rc + 0.5), z0]]; }).filter((_, i) => i !== iS && i !== (iS + 1) % n),
      ladder: [Math.cos((aS + 90) * D2R) * p.front * 0.92, Math.sin((aS + 90) * D2R) * p.front * 0.92, aS + 90],
    });
    let plinth;
    M.part('PLATFORM', () => {
      plinth = B.polyLathe(M, [[Rc, z0], [Rc, zf - 0.12]], n);
      for (let i = 0; i < n; i++) {
        const f = plinth.facet(0, i);
        const holes = [];
        if (i % 2 && f.on) { const g = [-0.35, -0.12, 0.35, 0.12]; f.rect(g, { w: 1 }); for (let k = 1; k < 6; k++) f.line(-0.35 + 0.7 * k / 6, -0.12, -0.35 + 0.7 * k / 6, 0.12, { w: 1 }); holes.push(g); }
        B.courses(f, f.box, { kind: 'brick', holes });
      }
      const D = B.polyLathe(M, [[Rc * 1.03, zf - 0.12], [Rc * 1.03, zf]], n);
      if (M.decorOn) { const t = D.f('top'); if (t.on) { for (let k = -8; k <= 8; k++) t.line(k * p.R / 8, -p.R, k * p.R / 8, p.R, { w: 0 }); } }
      M.callout('PLATFORM', 1, [Math.cos(B.viewAz(M) * D2R) * p.R, Math.sin(B.viewAz(M) * D2R) * p.R, z0 + p.hp * 0.4], 1.0);
    });
    M.part('STEPS', () => {
      M.with({ at: [Math.cos(aS * D2R) * p.R * 1.0, Math.sin(aS * D2R) * p.R * 1.0, z0], rz: aS }, () => B.steps(M, { n: p.nSteps, rise: p.hp / p.nSteps, run: 0.28, w: 1.6, cheeks: true }));
      M.callout('STEPS', 1, [Math.cos(aS * D2R) * (p.R + 0.7), Math.sin(aS * D2R) * (p.R + 0.7), z0 + p.hp * 0.5], 1.2);
    });
    const Rk = Rc * 0.95;
    const V = (i, z) => { const a = (180 / n + i * 360 / n) * D2R; return [Math.cos(a) * Rk, Math.sin(a) * Rk, z]; };
    M.part('COLUMN', () => {
      for (let i = 0; i < n; i++) {
        const [x, y] = V(i, 0);
        M.at(x, y, zf, () => {
          M.box([-0.14, -0.14, 0], [0.14, 0.14, 0.12], { isect: false });
          M.lathe([[0.1, 0.12], [0.08, 0.3], [0.065, p.hc - 0.35], [0.09, p.hc - 0.25], [0.13, p.hc - 0.12], [0.13, p.hc]], { isect: false, sharpDeg: 40 });
        });
      }
      M.callout('CAST IRON COLUMN', n, V(sideNear(n, B.viewAz(M)), zf + p.hc * 0.5), 1.6);
      // spandrel arcs between the columns
      for (let i = 0; i < n; i++) {
        const a = V(i, zf + p.hc), b = V(i + 1, zf + p.hc);
        const pts = [];
        for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zf + p.hc - 0.5 * Math.sin(Math.PI * t) - 0.02]); }
        M.pipe(pts, 0.025, { isect: false, seg: 6 });
      }
    });
    M.part('BALUSTRADE', () => {
      for (let i = 0; i < n; i++) {
        if (i === iS) continue;
        const a = V(i, zf), b = V(i + 1, zf);
        const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]), u = [d[0] / l * 0.14, d[1] / l * 0.14];
        B.balustrade(M, [[a[0] + u[0], a[1] + u[1], zf], [b[0] - u[0], b[1] - u[1], zf]], { h: 0.9, kind: 'vase', br: 0.045, pitch: 0.2 });
      }
      M.callout('BALUSTRADE', 1, (() => { const q = sideNear(n, B.viewAz(M) + 45); const a = V(q, zf), b = V(q + 1, zf); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zf + 0.6]; })(), 1.3);
    });
    M.part('MUSIC STAND', () => {
      for (let k = 0; k < p.stands; k++) {
        const a = (aS + 180 - 70 + 140 * k / Math.max(1, p.stands - 1)) * D2R, r = p.R * 0.48;
        M.with({ at: [Math.cos(a) * r, Math.sin(a) * r, zf], rz: a / D2R + 180 }, () => {
          for (let q = 0; q < 3; q++) { const b = q * 2.094; M.tube([0, 0, 0.25], [Math.cos(b) * 0.22, Math.sin(b) * 0.22, 0], 0.012, { isect: false, seg: 4 }); }
          M.tube([0, 0, 0.25], [0, 0, 1.05], 0.014, { isect: false, seg: 4 });
          M.with({ at: [0, 0, 1.12], ry: -25 }, () => M.box([-0.012, -0.25, -0.17], [0.012, 0.25, 0.17], { isect: false }));
        });
        M.with({ at: [Math.cos(a) * (p.R * 0.68), Math.sin(a) * (p.R * 0.68), zf], rz: a / D2R }, () => { M.box([-0.2, -0.2, 0.42], [0.2, 0.2, 0.46], { isect: false }); for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) M.tube([sx * 0.17, sy * 0.17, 0], [sx * 0.17, sy * 0.17, 0.42], 0.012, { isect: false, seg: 4 }); M.box([0.17, -0.2, 0.46], [0.2, 0.2, 0.9], { isect: false }); });
      }
      M.callout('MUSIC STAND', p.stands, [0, 0, zf + 1.1], 1.4);
    });
    M.part("CONDUCTOR'S WHEEL", () => {
      const a = aS * D2R, r = p.R * 0.6;
      M.with({ at: [Math.cos(a) * r, Math.sin(a) * r, zf], rz: aS + 180 }, () => B.shipWheel(M, { r: 0.4, h: 0.95 }));
      M.callout('STEERING WHEEL', 1, [Math.cos(a) * r, Math.sin(a) * r, zf + 1.3], 1.7);
    });
    M.part('ROOF', () => {
      const z = zf + p.hc, R = Rc * 1.12, h = p.rise;
      M.at(0, 0, z, () => B.polyLathe(M, [[Rc * 1.0, 0], [Rc * 1.04, 0.1], [Rc * 1.04, 0.38]], n));
      const zz = z + 0.38;
      const prof = p.roof === 'bell' ? [[R, zz], [R * 0.82, zz + h * 0.12], [R * 0.6, zz + h * 0.32], [R * 0.4, zz + h * 0.6], [R * 0.3, zz + h * 0.82], [0, zz + h]]
        : p.roof === 'ogee' ? [[R, zz], [R * 0.9, zz + h * 0.15], [R * 0.6, zz + h * 0.4], [R * 0.3, zz + h * 0.65], [R * 0.12, zz + h * 0.85], [0, zz + h]]
          : [[R, zz], [R * 0.5, zz + h * 0.4], [0, zz + h]];
      B.facetRoof(M, prof, n, p.cover, { hips: p.cover !== 'stripe', hipR: 0.045 });
      B.valance(M, Rc * 1.05, n, z + 0.02, 0.4, { scallops: 4 });
      M.at(0, 0, zz + h - 0.08, () => B.finial(M, { h: 1.0, r: 0.13 }));
      if (p.vane && X && X.weathervane) M.at(0, 0, zz + h + 0.85, () => X.weathervane(M, { h: 1.3, dir: p.vaneDir }));
      M.callout('BELL ROOF', 1, [Math.cos(B.viewAz(M) * D2R) * R * 0.6, Math.sin(B.viewAz(M) * D2R) * R * 0.6, zz + h * 0.3], 1.2);
      M.callout('SCALLOPED VALANCE', 1, [Math.cos(B.viewAz(M) * D2R) * Rc * 1.05, Math.sin(B.viewAz(M) * D2R) * Rc * 1.05, z - 0.15], 1.1);
      M.callout('FINIAL', 1, [0, 0, zz + h + 0.5], 0.6);
    });
    const players = p.stands * 2 + M.ri(0, 4);
    const brief = M.pick([
      `Takes the town band and its ${players} players to a different park each Sunday.`,
      'Goes to whichever square has the market and plays from ten until two.',
      `Brings a band of ${players} to the seafront in summer and the hospital in winter.`,
    ]);
    return { brief, fig: sk.fig, specs: [['BAND', `${players} PLAYERS`], ['STANDS', String(p.stands)]], crew: 2, mass: [-Rc, -Rc, 0, Rc, Rc, zf + p.hc + 0.4], places: ['PARK', 'SEAFRONT', 'PROMENADE', 'CIVIC', 'MUNICIPAL', 'GARDEN'] };
  },
};

// ================================================================== GREENHOUSE
const greenhouse = {
  name: 'GREENHOUSE',
  plan(M) {
    const p = {};
    p.L = M.r(5, 8.5);
    p.W = M.r(2.8, 4.0);
    p.hp = M.r(0.55, 0.8);
    p.hg = M.r(1.5, 1.9);
    p.rise = p.W * M.r(0.32, 0.42);
    p.bay = M.r(0.62, 0.8);
    p.plants = M.pick(['tufts', 'tomato', 'tufts']);
    p.boiler = M.chance(0.6);
    p.vents = Array.from({ length: 12 }, () => M.chance(0.35));
    p.skH = 0.22;
    p.front = p.L / 2 + 1.9;
    p.back = -p.L / 2 - 0.6;
    p.H = p.skH + p.hp + p.hg + p.rise + 0.5;
    p.box = { len: p.front - p.back, wid: p.W + 0.8, hgt: p.H, mass: Math.round(p.L * p.W * 0.4 * 10) / 10 };
    return p;
  },
  build(M, p, ctx) {
    const L = p.L, W = p.W, z0 = p.skH, zp = z0 + p.hp, ze = zp + p.hg, zr = ze + p.rise;
    const sy = sgnY(M);
    const sk = skid(M, ctx, { plan: rectPlan(p.back, -W / 2 - 0.4, p.front, W / 2 + 0.4), front: p.front, back: p.back, halfW: W / 2 + 0.4, h: p.skH,
      ties: [-0.35, 0.35].flatMap((t) => [1, -1].map((s) => [[t * L, s * W / 2, z0 + p.hp * 0.6], [t * L, s * (W / 2 + 0.3), z0]])),
      ladder: [-L / 2 - 0.4, 0, 180] });
    M.part('BRICK PLINTH', () => {
      const P = M.box([-L / 2, -W / 2, z0], [L / 2, W / 2, zp]);
      for (const k of ['+x', '-x', '+y', '-y']) { const f = P.f(k); const holes = []; if (k === '-x') holes.push([-0.45, -f.h / 2, 0.45, f.h / 2]); B.courses(f, f.box, { kind: 'brick', holes }); }
      M.box([-L / 2 - 0.04, -W / 2 - 0.04, zp - 0.02], [L / 2 + 0.04, W / 2 + 0.04, zp + 0.08], { isect: false });
      M.callout('BRICK PLINTH', 1, [L * 0.2, sy * W / 2, z0 + p.hp * 0.5], 1.0);
    });
    const nb = Math.max(4, Math.round(L / p.bay)), bay = L / nb;
    const ventL = Math.min(0.45, W * 0.14);
    const s = 0.035;
    M.part('GLAZING BAR', () => {
      // posts, eaves, rafters, ridge
      for (const side of [1, -1]) {
        M.box([-L / 2, side * W / 2 - s, zp + 0.08], [L / 2, side * W / 2 + s, zp + 0.15], { isect: false });
        M.box([-L / 2, side * W / 2 - s * 1.5, ze - 0.08], [L / 2, side * W / 2 + s * 1.5, ze], { isect: false });
        for (let i = 0; i <= nb; i++) {
          const x = -L / 2 + i * bay;
          M.box([x - s, side * W / 2 - s, zp + 0.08], [x + s, side * W / 2 + s, ze], { isect: false });
          M.tube([x, side * W / 2, ze], [x, 0, zr], s * 0.9, { isect: false, seg: 4 });
        }
        // horizontal glazing laps on the walls and roof
        for (let k = 1; k < 3; k++) M.line([[-L / 2, side * W / 2 + side * 0.01, zp + 0.15 + (ze - zp - 0.15) * k / 3], [L / 2, side * W / 2 + side * 0.01, zp + 0.15 + (ze - zp - 0.15) * k / 3]], { w: 0, pass: 2 });
        for (let k = 1; k < 3; k++) { const t = k / 3; M.line([[-L / 2, side * W / 2 * (1 - t), ze + p.rise * t + 0.01], [L / 2, side * W / 2 * (1 - t), ze + p.rise * t + 0.01]], { w: 0, pass: 2 }); }
        // a few glints on the panes facing the viewer
        if (side === sy) for (let i = 0; i < nb; i += 2) {
          const x = -L / 2 + (i + 0.5) * bay;
          for (const d of [0, 0.12]) M.line([[x - bay * 0.25 + d, side * (W / 2 + 0.02), zp + 0.5 + d], [x + bay * 0.05 + d, side * (W / 2 + 0.02), zp + 0.9 + d]], { w: 0, pass: 2 });
        }
      }
      M.box([-L / 2, -0.06, zr - 0.06], [L / 2, 0.06, zr + 0.06], { isect: false });
      // gable ends: posts, a rafter pair, the door at -x
      for (const ex of [1, -1]) {
        const x = ex * L / 2;
        M.tube([x, W / 2, ze], [x, 0, zr], s * 1.2, { isect: false, seg: 4 });
        M.tube([x, -W / 2, ze], [x, 0, zr], s * 1.2, { isect: false, seg: 4 });
        const m = Math.max(2, Math.round(W / 0.7));
        for (let j = 1; j < m; j++) {
          const y = -W / 2 + W * j / m;
          if (ex < 0 && Math.abs(y) < 0.5) continue;
          const zt = ze + p.rise * (1 - Math.abs(y) / (W / 2));
          M.box([x - s, y - s, zp + 0.08], [x + s, y + s, zt], { isect: false });
        }
        M.box([x - s, -W / 2, zp + 0.08], [x + s, W / 2, zp + 0.15], { isect: false });
      }
      // the door
      const xd = -L / 2;
      for (const yy of [-0.45, 0.45]) M.box([xd - s * 1.4, yy - s * 1.4, z0 + 0.05], [xd + s * 1.4, yy + s * 1.4, ze + 0.1], { isect: false });
      M.box([xd - s * 1.4, -0.45, ze + 0.05], [xd + s * 1.4, 0.45, ze + 0.15], { isect: false });
      M.box([xd - s, -0.43, z0 + 0.95], [xd + s, 0.43, z0 + 1.0], { isect: false });
      M.callout('GLAZING BAR', nb * 4, [L * 0.1, sy * W / 2, zp + p.hg * 0.6], 1.4);
      M.callout('GLAZED DOOR', 1, [-L / 2, 0, z0 + 1.4], 1.2);
    });
    M.part('RIDGE VENT', () => {
      for (let i = 0; i < nb; i++) {
        const x0 = -L / 2 + i * bay + 0.06, x1 = x0 + bay - 0.12;
        const open = p.vents[i % 12];
        const ang = open ? 18 : 0;
        M.with({ at: [0, sy * 0.06, zr], rx: -sy * (Math.atan2(p.rise, W / 2) / D2R - ang) }, () => M.box([x0, Math.min(0, sy * ventL), -0.012], [x1, Math.max(0, sy * ventL), 0.012], { isect: false }));
        if (!open) continue;
        M.tube([(x0 + x1) / 2, sy * (ventL + 0.1), zr - (ventL + 0.1) * p.rise / (W / 2)], [(x0 + x1) / 2, sy * ventL * 0.9, zr - ventL * p.rise / (W / 2) + 0.14], 0.01, { isect: false, seg: 4 });
      }
      for (const ex of [1, -1]) M.at(ex * L / 2, 0, zr + 0.06, () => B.finial(M, { h: 0.45, r: 0.06 }));
      M.callout('RIDGE VENT', nb, [0, sy * 0.3, zr + 0.05], 1.6);
    });
    M.part('STAGING', () => {
      for (const side of [1, -1]) {
        const y0 = side * (W / 2 - 0.08), y1 = side * (W / 2 - 0.08 - Math.min(0.8, W * 0.25));
        const T = M.box([-L / 2 + 0.15, Math.min(y0, y1), zp + 0.1], [L / 2 - 0.15, Math.max(y0, y1), zp + 0.14], { isect: false });
        void T;
        for (let i = 0; i <= 3; i++) { const x = -L / 2 + 0.2 + (L - 0.4) * i / 3; M.box([x - 0.025, (y0 + y1) / 2 - 0.025, z0 + 0.05], [x + 0.025, (y0 + y1) / 2 + 0.025, zp + 0.1], { isect: false }); }
        // pots and tufts in rows
        const np = Math.max(4, Math.round((L - 0.4) / 0.35));
        for (let i = 0; i < np; i++) {
          for (const q of [0.3, 0.7]) {
            const x = -L / 2 + 0.3 + (L - 0.6) * i / (np - 1), y = y0 + (y1 - y0) * q, z = zp + 0.14;
            M.at(x, y, z, () => M.cone(0.06, 0.08, 0, 0.12, { isect: false, seg: 6 }));
            const h = p.plants === 'tomato' ? 0.9 + ((i * 7 + q * 10) % 3) * 0.12 : 0.22 + ((i * 3 + q * 10) % 4) * 0.04;
            const blades = p.plants === 'tomato' ? 3 : 6;
            for (let b = 0; b < blades; b++) {
              const a = (b / blades) * 2 * Math.PI + i;
              const lean = p.plants === 'tomato' ? 0.12 : 0.13;
              M.line([[x, y, z + 0.12], [x + Math.cos(a) * lean, y + Math.sin(a) * lean, z + 0.12 + h * (0.7 + 0.3 * ((b * 5) % 3) / 2)]], { w: 0, pass: 2 });
            }
            if (p.plants === 'tomato') M.line([[x, y, z + 0.12], [x, y, z + 0.12 + h + 0.1]], { w: 1, pass: 2 });
          }
        }
      }
      M.callout(p.plants === 'tomato' ? 'TOMATO PLANT' : 'SEEDLING POT', Math.max(4, Math.round((L - 0.4) / 0.35)) * 4, [L * 0.2, sy * (W / 2 - 0.3), zp + 0.4], 1.5);
    });
    if (p.boiler) {
      M.part('BOILER STACK', () => {
        M.at(L / 2 - 0.5, -sy * (W / 2 - 0.5), zp, () => { M.box([-0.3, -0.3, 0], [0.3, 0.3, 0.7], { isect: false }); });
        M.at(L / 2 - 0.5, -sy * (W / 2 - 0.5), zp + 0.7, () => K.stack(M, { r: 0.08, h: zr - zp + 0.2 }));
        M.callout('BOILER STACK', 1, [L / 2 - 0.5, -sy * (W / 2 - 0.5), zr + 0.4], 1.0);
      });
    }
    cab(M, [L / 2 + 0.25 + 0.65, 0, p.skH]);
    const trays = Math.round(L * 10);
    const brief = M.pick([
      `Brings ${trays} trays of seedlings to the allotments each April.`,
      'Follows the sun up the valley and keeps the tomatoes at 22 degrees.',
      'Takes the botanical society\'s orchids to each county show in turn.',
    ]);
    return { brief, fig: sk.fig, specs: [['GLAZED AREA', `${Math.round(L * (p.hg + Math.hypot(W / 2, p.rise)) * 2)} M2`], ['BENCHES', '2']], crew: 1, mass: [-L / 2, -W / 2, 0, L / 2, W / 2, zr], places: ['ALLOTMENT', 'COUNTY', 'GARDEN', 'NURSERY', 'VALLEY', 'MARKET'] };
  },
};

// ================================================================== CAROUSEL
const HORSE = [[-0.72, 0.9], [-0.5, 0.92], [-0.05, 0.88], [0.3, 0.94], [0.44, 1.18], [0.52, 1.4], [0.5, 1.52], [0.6, 1.44], [0.7, 1.36], [0.88, 1.12], [0.84, 1.04], [0.66, 1.1], [0.54, 0.96], [0.55, 0.78], [0.74, 0.66], [0.8, 0.5], [0.7, 0.42], [0.66, 0.47], [0.7, 0.53], [0.48, 0.62], [0.42, 0.58], [0.4, 0.22], [0.46, 0.16], [0.34, 0.14], [0.32, 0.58], [-0.3, 0.58], [-0.5, 0.4], [-0.72, 0.2], [-0.8, 0.12], [-0.84, 0.2], [-0.64, 0.4], [-0.58, 0.62], [-0.68, 0.7], [-0.86, 0.5], [-0.92, 0.56], [-0.8, 0.82]];
const carousel = {
  name: 'CAROUSEL',
  plan(M) {
    const p = {};
    p.R = M.r(3.8, 5.2);
    p.hpl = 0.45;
    p.hc = M.r(3.3, 3.7);
    p.rise = p.R * M.r(0.45, 0.65);
    p.nPole = M.pick([10, 12, 14]);
    p.inner = M.chance(0.5);
    p.inKind = M.pick(['horse', 'chariot']);
    p.ribs = M.pick([16, 24]);
    p.phase = M.r(0, 360);
    p.organ = M.chance(0.5);
    p.skH = 0.25;
    p.H = p.skH + p.hpl + p.hc + p.rise + 1.6;
    p.box = { len: 2 * (p.R + 0.6), wid: 2 * (p.R + 0.6), hgt: p.H, mass: Math.round(p.R * p.R * 0.9), round: true };
    return p;
  },
  build(M, p, ctx) {
    const R = p.R, z0 = p.skH, zp = z0 + p.hpl, zr = zp + p.hc;
    const aE = B.viewAz(M);
    const sk = skid(M, ctx, { plan: octPlan(R + 0.6), front: R + 0.6, back: -R - 0.6, halfW: (R + 0.6) * 0.55, h: p.skH,
      ties: Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) * Math.PI / 4; return [[Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99, z0 + p.hpl * 0.6], [Math.cos(a) * (R + 0.45), Math.sin(a) * (R + 0.45), z0]]; }),
      ladder: [Math.cos((aE + 70) * D2R) * (R + 0.55), Math.sin((aE + 70) * D2R) * (R + 0.55), aE + 70] });
    M.part('TURNTABLE', () => {
      const P = M.cyl(R, z0, zp);
      if (M.decorOn) {
        const L = P.lat;
        for (let i = 0; i < 48; i++) L.meridian(i * 7.5, 0.25, 0.75, { w: 0 });
        L.ring(0.25, { w: 0 }); L.ring(0.75, { w: 0 });
        const t = P.top;
        if (t.on) { for (let i = 0; i < p.nPole; i++) { const a = (i + 0.5) * 2 * Math.PI / p.nPole; t.line(Math.cos(a) * R * 0.25, Math.sin(a) * R * 0.25, Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98, { w: 0 }); } t.circle(0, 0, R * 0.6, { w: 0 }); }
      }
      M.callout('TURNTABLE', 1, [Math.cos(aE * D2R) * R, Math.sin(aE * D2R) * R, z0 + p.hpl * 0.5], 1.0);
    });
    M.part('CENTER DRUM', () => {
      const r = R * 0.22;
      const D = M.cyl(r, zp, zr);
      if (M.decorOn) {
        const L = D.lat;
        for (let i = 0; i < 8; i++) { const a = i * 45; L.shape(a, 0.55, circlePts(0, 0, r * 0.28, p.hc * 0.22, 14), { closed: true, w: 1 }); L.shape(a, 0.55, circlePts(0, 0, r * 0.22, p.hc * 0.17, 14), { closed: true, w: 0 }); L.hatch(a - 7, a + 7, 0.5, 0.6, { gap: 1.6 }); }
        L.ring(0.15, { w: 1 }); L.ring(0.9, { w: 1 });
        L.shade({ gap: 1.6, gapMax: 5 });
      }
      M.callout('CENTER DRUM', 1, [Math.cos(aE * D2R) * r, Math.sin(aE * D2R) * r, zp + p.hc * 0.55], 1.2);
      if (p.organ && X && X.organPipes) {
        M.with({ at: [Math.cos(aE * D2R) * (r + 0.05), Math.sin(aE * D2R) * (r + 0.05), zp], rz: aE }, () => X.organPipes(M, { n: 9, h: 1.6, w: 1.1, shape: 'tower' }));
        M.callout('BAND ORGAN', 1, [Math.cos(aE * D2R) * (r + 0.3), Math.sin(aE * D2R) * (r + 0.3), zp + 1.2], 1.6);
      }
    });
    M.part('RIDE', () => {
      const rings = [[R * 0.8, 'horse']];
      if (p.inner) rings.push([R * 0.55, p.inKind]);
      rings.forEach(([rr, kind], ri) => {
        const np = ri ? Math.round(p.nPole * 0.7) : p.nPole;
        for (let i = 0; i < np; i++) {
          const a = (i + 0.5) * 360 / np + ri * 10;
          const x = Math.cos(a * D2R) * rr, y = Math.sin(a * D2R) * rr;
          if (kind === 'horse') {
            M.tube([x, y, zp], [x, y, zr], 0.03, { isect: false, seg: 6 });
            const lift = 0.25 * Math.sin((i * 2 + ri) * 1.3 + p.phase);
            M.with({ at: [x, y, zp + 0.35 + lift], rz: a + 90 }, () => {
              const S = M.extrude(HORSE, -0.1, 0.1, { plane: 'xz' });
              if (M.decorOn) for (const k of ['-y', '+y']) { const f = S.f(k); if (f.on && f.front) { const m = k === '-y' ? 1 : -1, Q = (u, v) => [m * (u + 0.02), v - 0.82]; f.path([[-0.22, 0.9], [0.18, 0.92], [0.12, 0.66], [-0.18, 0.64]].map(([u, v]) => Q(u, v)), { closed: true, w: 1 }); f.path([[0.3, 0.94], [0.44, 1.18], [0.52, 1.4]].map(([u, v]) => Q(u - 0.05, v - 0.02)), { w: 0 }); f.circle(...Q(0.66, 1.28), 0.025, { n: 6 }); f.path([[0.55, 1.2], [0.5, 0.98], [0.3, 0.9]].map(([u, v]) => Q(u, v)), { w: 0 }); if (f.tone > 0.3) f.hatch(f.poly, { angle: 60, gap: 3.5, w: 0 }); } }
            });
          } else {
            M.with({ at: [x, y, zp], rz: a + 90 }, () => {
              M.box([-0.6, -0.35, 0], [0.6, 0.35, 0.45]);
              const Bk = M.extrude([[-0.6, 0.45], [0.6, 0.45], [0.55, 1.0], [0.2, 1.15], [-0.4, 1.1], [-0.6, 0.8]], 0.25, 0.35, { plane: 'xz' });
              const f = Bk.f('+y'); if (f.on) f.hatch(f.poly, { angle: 45, gap: 3, w: 0 });
            });
          }
        }
      });
      M.callout('GALLOPER', p.nPole, [Math.cos((aE + 180 / p.nPole) * D2R) * R * 0.8, Math.sin((aE + 180 / p.nPole) * D2R) * R * 0.8, zp + 1.0], 2.2);
      M.callout('BRASS POLE', p.nPole, [Math.cos((aE + 360 / p.nPole * 1.5) * D2R) * R * 0.8, Math.sin((aE + 360 / p.nPole * 1.5) * D2R) * R * 0.8, zp + p.hc * 0.85], 1.0);
    });
    M.part('CANOPY', () => {
      const S = B.roundRoof(M, [[R * 1.04, zr], [R * 1.04, zr + 0.06], [R * 0.2, zr + p.rise], [0.12, zr + p.rise + 0.05]], { ribs: p.ribs, stripes: true, t0: 0.02, t1: 0.95 });
      void S;
      // rounding board and scalloped valance
      const n = 32;
      M.at(0, 0, zr - 0.32, () => M.cyl(R * 1.02, 0, 0.32, { open: true }));
      B.valance(M, R * 1.04, n, zr - 0.31, 0.26, { scallops: 1, rot: 0 });
      M.at(0, 0, zr + p.rise, () => { M.cyl(0.16, 0, 0.3, { isect: false }); if (X && X.flag) M.at(0, 0, 0.3, () => X.flag(M, { h: 1.3, w: 0.7 })); else B.finial(M, { h: 0.9, r: 0.12 }); });
      M.callout('TENTED CANOPY', 1, [Math.cos(aE * D2R) * R * 0.6, Math.sin(aE * D2R) * R * 0.6, zr + p.rise * 0.45], 1.6);
      M.callout('SCALLOPED VALANCE', 1, [Math.cos(aE * D2R) * R * 1.04, Math.sin(aE * D2R) * R * 1.04, zr - 0.45], 1.2);
    });
    M.part('STEERING WHEEL', () => {
      const a = (aE - 50) * D2R, r = R * 0.38;
      M.with({ at: [Math.cos(a) * r, Math.sin(a) * r, zp], rz: aE - 50 }, () => B.shipWheel(M, { r: 0.38, h: 0.95 }));
      M.callout('STEERING WHEEL', 1, [Math.cos(a) * r, Math.sin(a) * r, zp + 1.3], 1.4);
    });
    const riders = p.nPole + (p.inner ? Math.round(p.nPole * 0.7) * (p.inKind === 'horse' ? 1 : 2) : 0);
    const brief = M.pick([
      `Goes from fair to fair on its own and turns ${riders} riders at 4 RPM.`,
      'Arrives at the village green on Friday night and leaves on Monday morning.',
      `Carries ${riders} children round the market square and then to the next one.`,
    ]);
    return { brief, fig: sk.fig, specs: [['RIDERS', String(riders)], ['TURNING', '4 RPM']], crew: 2, mass: [-R, -R, 0, R, R, zr], places: ['FAIRGROUND', 'SEASIDE', 'VILLAGE', 'PIER', 'MARKET', 'FESTIVAL'] };
  },
};

// ================================================================== TELEPHONE BOX
const phonebox = {
  name: 'TELEPHONE BOX',
  plan(M) {
    const p = {};
    p.a = M.r(0.92, 1.05);
    p.h = M.r(2.2, 2.4);
    p.dome = p.a * M.r(0.22, 0.3);
    p.rows = M.pick([6, 7, 8]);
    p.peri = M.chance(0.55);
    p.skH = 0.18;
    p.H = p.skH + 0.12 + p.h + 0.3 + p.dome + 0.4;
    p.box = { len: p.a + 1.0, wid: p.a + 0.8, hgt: p.H, mass: 1.2 };
    return p;
  },
  build(M, p, ctx) {
    const h2 = p.a / 2, z0 = p.skH, zb = z0 + 0.12, zt = zb + p.h;
    const front = h2 + 0.55, back = -h2 - 0.45;
    const sk = skid(M, ctx, { plan: rectPlan(back, -h2 - 0.4, front, h2 + 0.4), front, back, halfW: h2 + 0.4, h: p.skH,
      ties: [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sy]) => [[sx * h2, sy * h2, zb + 0.4], [sx * (h2 + 0.3), sy * (h2 + 0.3), z0]]),
      ladder: [back + 0.25, 0, 180] });
    const doorK = M.view.e[0] >= 0 ? '+x' : '-x';
    M.part('KIOSK BODY', () => {
      M.box([-h2 - 0.04, -h2 - 0.04, z0], [h2 + 0.04, h2 + 0.04, zb], { isect: false });
      const Bd = M.box([-h2, -h2, zb], [h2, h2, zt - 0.28]);
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = Bd.f(k);
        if (!f.on || !f.front) continue;
        const fr = 0.09, x0 = -f.w / 2 + fr, x1 = f.w / 2 - fr, y0 = -f.h / 2 + 0.28, y1 = f.h / 2 - 0.08;
        f.rect(-f.w / 2 + 0.04, -f.h / 2 + 0.02, f.w / 2 - 0.04, f.h / 2, { w: 1 });
        f.rect(x0, y0, x1, y1, { w: 1 });
        const cols = 3;
        for (let i = 0; i < cols; i++) for (let j = 0; j < p.rows; j++) {
          const a = x0 + (x1 - x0) * i / cols + 0.02, b = x0 + (x1 - x0) * (i + 1) / cols - 0.02;
          const c = y0 + (y1 - y0) * j / p.rows + 0.015, d = y0 + (y1 - y0) * (j + 1) / p.rows - 0.015;
          f.rect(a, c, b, d, { w: 0 });
          if ((i + j) % 3 === 0) f.line(a + (b - a) * 0.2, c + (d - c) * 0.2, a + (b - a) * 0.6, d - (d - c) * 0.15, { w: 0 });
        }
        f.rect(x0, -f.h / 2 + 0.06, x1, y0 - 0.05, { w: 0 });
        f.hatch([x0 + 0.02, -f.h / 2 + 0.08, x1 - 0.02, y0 - 0.07], { angle: 90, gap: 2.4, w: 0 });
        if (k === doorK) { f.rect(x1 - 0.06, -0.05, x1 - 0.02, 0.2, { w: 1 }); }
        if (f.tone > 0.35) f.hatch(f.box, { angle: 45, gap: 4.5 - 2 * f.tone, w: 0 });
      }
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) M.box([sx * h2 - 0.05, sy * h2 - 0.05, zb], [sx * h2 + 0.05, sy * h2 + 0.05, zt - 0.28], { isect: false });
      M.callout('GLAZED PANE', p.rows * 12, [h2 * sgnX(M), 0, zb + p.h * 0.5], 1.6);
      M.callout('DOOR', 1, [h2 * (doorK === '+x' ? 1 : -1), h2 * 0.6, zb + p.h * 0.4], 1.0);
    });
    M.part('SIGN PANEL', () => {
      const S = M.box([-h2 - 0.03, -h2 - 0.03, zt - 0.28], [h2 + 0.03, h2 + 0.03, zt]);
      for (const k of ['+x', '-x', '+y', '-y']) { const f = S.f(k); if (f.on && f.front) { f.rect(-f.w * 0.42, -f.h * 0.32, f.w * 0.42, f.h * 0.32, { w: 1 }); f.text('TELEPHONE', 0, 0, Math.min(0.08, f.h * 0.3)); } }
      M.box([-h2 - 0.08, -h2 - 0.08, zt], [h2 + 0.08, h2 + 0.08, zt + 0.06], { isect: false });
      M.callout('SIGN PANEL', 4, [h2 * sgnX(M), 0, zt - 0.14], 1.3);
    });
    M.part('DOMED ROOF', () => {
      const R = (h2 + 0.06) * Math.SQRT2, d = p.dome;
      const prof = [[R, zt + 0.06], [R * 0.94, zt + 0.06 + d * 0.4], [R * 0.78, zt + 0.06 + d * 0.75], [R * 0.5, zt + 0.06 + d * 0.95], [0, zt + 0.06 + d]];
      const S = B.polyLathe(M, prof, 4, { rot: 45 });
      if (M.decorOn) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const f = S.facet(j, i); if (f.on && f.front && f.tone > 0.2) f.hatch(f.poly, { angle: 0, gap: 4.6 - 2 * f.tone, w: 0 }); }
      M.at(0, 0, zt + 0.06 + d - 0.02, () => { M.box([-0.07, -0.07, 0], [0.07, 0.07, 0.1], { isect: false }); M.at(0, 0, 0.1, () => M.sphere(0.06)); });
      M.callout('DOMED ROOF', 1, [0, 0, zt + 0.06 + d * 0.8], 1.2);
      if (p.peri && X && X.periscope) {
        M.at(-h2 * 0.35, 0, zt + 0.06 + d * 0.7, () => X.periscope(M, { h: 0.9, r: 0.06 }));
        M.callout("DRIVER'S PERISCOPE", 1, [-h2 * 0.35, 0, zt + d + 0.6], 1.9);
      }
    });
    M.part('STEERING TILLER', () => {
      const x = h2 + 0.02;
      M.tube([x, -h2 * 0.2, zb + 1.0], [x + 0.38, -h2 * 0.2, zb + 0.95], 0.025, { isect: false });
      M.at(x + 0.42, -h2 * 0.2, zb + 0.95, () => M.sphere(0.045));
      M.at(x, -h2 * 0.2, zb + 1.0, () => M.box([0, -0.06, -0.06], [0.04, 0.06, 0.06], { isect: false }));
      M.callout('STEERING TILLER', 1, [x + 0.3, -h2 * 0.2, zb + 0.96], 1.5);
    });
    const brief = M.pick([
      'Goes to whichever village has a fault on the line and stays until it is fixed.',
      'Takes a public telephone to the cliff path each summer for walkers in need.',
      'Follows the agricultural show round the county with a line to the exchange.',
    ]);
    return { brief, fig: sk.fig, specs: [['LINES', '1'], ['PANES', String(p.rows * 3 * 4)]], crew: 1, mass: [-h2, -h2, 0, h2, h2, zt], places: ['VILLAGE', 'RURAL', 'COUNTY', 'CLIFF', 'COASTAL', 'HIGHLAND'] };
  },
};

// ================================================================== GARDEN SHED
const shed = {
  name: 'GARDEN SHED',
  plan(M) {
    const p = {};
    p.L = M.r(2.2, 3.2);
    p.W = M.r(1.6, 2.2);
    p.h = M.r(1.85, 2.1);
    p.rise = p.W * M.r(0.25, 0.4);
    p.wall = M.pick(['boards', 'battens']);
    p.roof = M.pick(['shingle', 'seam', 'tile']);
    p.pots = M.ri(1, 3);
    p.skH = 0.2;
    p.front = p.L / 2 + 1.8;
    p.back = -p.L / 2 - 0.4;
    p.H = p.skH + 0.1 + p.h + p.rise + 0.3;
    p.box = { len: p.front - p.back, wid: p.W + 1.6, hgt: p.H, mass: 1.4 };
    return p;
  },
  build(M, p, ctx) {
    const L = p.L, W = p.W, z0 = p.skH, zf = z0 + 0.1, zw = zf + p.h;
    const sy = sgnY(M);
    const sk = skid(M, ctx, { plan: rectPlan(p.back, -W / 2 - 0.8, p.front, W / 2 + 0.8), front: p.front, back: p.back, halfW: W / 2 + 0.8, h: p.skH,
      ties: [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, s2]) => [[sx * L / 2, s2 * W / 2, zf + 0.35], [sx * (L / 2 + 0.25), s2 * (W / 2 + 0.25), z0]]),
      ladder: [p.back + 0.2, -sy * W * 0.2, 180] });
    M.part('SHED', () => {
      M.box([-L / 2 - 0.04, -W / 2 - 0.04, z0], [L / 2 + 0.04, W / 2 + 0.04, zf], { isect: false });
      const Bd = M.box([-L / 2, -W / 2, zf], [L / 2, W / 2, zw]);
      const gw = B.gableWall(M, { len: L, w: W, z: zw, rise: p.rise });
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = Bd.f(k);
        const holes = [];
        if (k === (sy > 0 ? '+y' : '-y')) {
          holes.push(B.doorway(f, -f.w * 0.18, -f.h / 2, 0.8, Math.min(1.85, p.h - 0.08), { ledged: true }));
          holes.push(B.sash(f, f.w * 0.28, f.h * 0.12, 0.7, 0.6, { panes: [3, 2], casement: true }));
        }
        if (k === '+x') holes.push(B.sash(f, 0, f.h * 0.12, 0.6, 0.55, { panes: [2, 2], casement: true }));
        B.courses(f, f.box, { kind: p.wall, holes });
      }
      for (const k of ['+x', '-x']) { const f = gw.f(k); B.courses(f, f.box, { kind: p.wall }); }
      M.callout('LEDGED DOOR', 1, [-L * 0.18, sy * W / 2, zf + 1.0], 1.3);
      M.callout('WINDOW', 2, [L * 0.28, sy * W / 2, zf + p.h * 0.62], 0.9);
    });
    let roof;
    M.part('ROOF', () => {
      roof = B.gableRoof(M, { len: L, w: W, z: zw, rise: p.rise, over: 0.18, overEnd: 0.15, kind: p.roof, t: 0.07 });
      for (const ex of [1, -1]) M.extrude([[-roof.W2, roof.eave - 0.07], [0, roof.ridge - 0.07], [roof.W2, roof.eave - 0.07], [roof.W2, roof.eave - 0.2], [0, roof.ridge - 0.2], [-roof.W2, roof.eave - 0.2]], ex * (L / 2 + 0.15) - 0.015, ex * (L / 2 + 0.15) + 0.015, { plane: 'yz', isect: false });
      M.callout('ROOF', 1, [0, sy * W * 0.25, (roof.eave + roof.ridge) / 2], 0.9);
    });
    M.part('WATER BUTT', () => {
      const yb = sy * (W / 2 + 0.36), xb = L / 2 - 0.35;
      B.gutter(M, [-L / 2 - 0.1, sy * (roof.W2 - 0.02), roof.eave - 0.08], [L / 2 + 0.1, sy * (roof.W2 - 0.02), roof.eave - 0.08], { r: 0.05, down: [xb, sy * (W / 2 + 0.3), zf + 0.95], from: 'b', shoe: -0.05 });
      M.at(xb, yb, zf, () => {
        M.box([-0.3, -0.3, 0], [0.3, 0.3, 0.12], { isect: false });
        const T = M.lathe([[0.26, 0.12], [0.3, 0.45], [0.31, 0.6], [0.3, 0.75], [0.27, 1.05]], { sharpDeg: 40 });
        if (M.decorOn) { for (const t of [0.1, 0.5, 0.9]) { T.lat.ring(t - 0.02, { w: 1 }); T.lat.ring(t + 0.02, { w: 1 }); } for (let i = 0; i < 16; i++) T.lat.meridian(i * 22.5, 0, 1, { w: 0 }); T.lat.shade({ gap: 1.4 }); }
        M.cyl(0.29, 1.05, 1.09, { isect: false });
        M.at(0.3 * sgnX(M), 0, 0.3, () => M.ry(90 * sgnX(M), () => M.cyl(0.02, 0, 0.08, { isect: false })));
      });
      M.callout('WATER BUTT', 1, [xb, yb + sy * 0.3, zf + 0.6], 1.8);
      M.callout('GUTTER', 1, [0, sy * roof.W2, roof.eave - 0.08], 0.8);
    });
    M.part('FLOWERPOT', () => {
      for (let i = 0; i < p.pots; i++) {
        const x = -L / 2 + 0.2 + i * 0.3, y = sy * (W / 2 + 0.35);
        M.at(x, y, zf, () => M.cone(0.1, 0.13, 0, 0.2, { isect: false }));
        { for (let b = 0; b < 5; b++) { const a = b * 1.26 + i; M.line([[x, y, zf + 0.2], [x + Math.cos(a) * 0.12, y + Math.sin(a) * 0.12, zf + 0.42 + (b % 2) * 0.08]], { w: 0, pass: 2 }); } }
      }
    });
    cab(M, [L / 2 + 0.3 + 0.65, 0, p.skH]);
    const brief = M.pick([
      'Takes the tools to whichever allotment is being dug that week.',
      `Carries the parks department's mowers to ${M.ri(3, 9)} greens and 200 liters of water.`,
      'Moves to the far end of the garden each spring and stores the deck chairs.',
    ]);
    return { brief, fig: sk.fig, specs: [['WATER BUTT', '200 L'], ['FLOOR', `${(L * W).toFixed(1)} M2`]], crew: 1, mass: [-L / 2, -W / 2, 0, L / 2, W / 2, zw + p.rise], places: ['ALLOTMENT', 'GARDEN', 'PARKS', 'ESTATE', 'SUBURBAN', 'VILLAGE'] };
  },
};

// ================================================================== BUS SHELTER
const shelter = {
  name: 'BUS SHELTER',
  plan(M) {
    const p = {};
    p.L = M.r(3.4, 5.0);
    p.D = M.r(1.3, 1.6);
    p.h = M.r(2.3, 2.5);
    p.roof = M.pick(['barrel', 'barrel', 'mono']);
    p.route = String(M.ri(2, 88));
    p.bin = M.chance(0.7);
    p.skH = 0.2;
    p.front = p.L / 2 + 0.8;
    p.back = -p.L / 2 - 1.9;
    p.H = p.skH + p.h + 0.5 + 0.4;
    p.box = { len: p.front - p.back, wid: p.D + 1.6, hgt: p.H, mass: 2.2 };
    return p;
  },
  build(M, p, ctx) {
    const L = p.L, D = p.D, z0 = p.skH, zt = z0 + p.h;
    const sy = sgnY(M);           // the open side faces the viewer
    const yb = -sy * D / 2;       // back wall
    const sk = skid(M, ctx, { plan: rectPlan(p.back, -D / 2 - 0.8, p.front, D / 2 + 0.8), front: p.front, back: p.back, halfW: D / 2 + 0.8, h: p.skH,
      ties: [-0.4, 0.4].map((t) => [[t * L, yb, z0 + 0.5], [t * L, yb - sy * 0.3, z0]]), ladder: null });
    const nb = Math.max(2, Math.round(L / 1.3));
    const post = 0.05;
    M.part('FRAME', () => {
      for (let i = 0; i <= nb; i++) { const x = -L / 2 + L * i / nb; M.box([x - post, yb - post, z0], [x + post, yb + post, zt], { isect: false }); }
      for (const ex of [-1, 1]) M.box([ex * L / 2 - post, sy * D / 2 - post, z0], [ex * L / 2 + post, sy * D / 2 + post, zt], { isect: false });
      M.box([-L / 2, yb - post, zt - 0.08], [L / 2, yb + post, zt], { isect: false });
      M.callout('STEEL FRAME', 1, [L / 2, sy * D / 2, z0 + p.h * 0.6], 0.8);
    });
    M.part('GLAZED PANEL', () => {
      for (let i = 0; i < nb; i++) {
        const x0 = -L / 2 + L * i / nb + post, x1 = -L / 2 + L * (i + 1) / nb - post;
        const P = M.box([x0, yb - 0.008, z0 + 0.12], [x1, yb + 0.008, zt - 0.1], { isect: false });
        const f = P.f(sy > 0 ? '+y' : '-y');
        if (f.on) { f.rect(-f.w / 2 + 0.04, -f.h / 2 + 0.04, f.w / 2 - 0.04, f.h / 2 - 0.04, { w: 1 }); f.line(-f.w / 2 + 0.04, -f.h * 0.18, f.w / 2 - 0.04, -f.h * 0.18, { w: 1 }); f.hatch([-f.w / 2 + 0.06, -f.h / 2 + 0.06, f.w / 2 - 0.06, f.h / 2 - 0.06], { angle: 58, gap: 7, w: 0 }); for (const d of [0, 0.12, 0.2]) f.line(-f.w * 0.3 + d, f.h * 0.0 + d, -f.w * 0.02 + d, f.h * 0.3 + d, { w: 0 }); }
      }
      // the end panel with the timetable
      const ex = -1;
      const P = M.box([ex * L / 2 - 0.008, -D / 2 + post, z0 + 0.12], [ex * L / 2 + 0.008, D / 2 - post, zt - 0.1], { isect: false });
      const f = P.f(M.view.e[0] >= 0 ? '+x' : '-x');
      if (f.on && f.front) {
        f.rect(-f.w / 2 + 0.05, -f.h / 2 + 0.05, f.w / 2 - 0.05, f.h / 2 - 0.05, { w: 1 });
        f.rect(-f.w * 0.38, -f.h * 0.3, f.w * 0.38, f.h * 0.38, { w: 1 });
        f.text('BUS', 0, f.h * 0.24, Math.min(0.2, f.w * 0.15));
        f.text(p.route, 0, f.h * 0.02, Math.min(0.32, f.w * 0.22));
        for (let r = 0; r < 4; r++) f.line(-f.w * 0.3, -f.h * 0.12 - r * 0.07, f.w * (0.3 - (r % 2) * 0.15), -f.h * 0.12 - r * 0.07, { w: 0 });
        f.hatch([-f.w / 2 + 0.07, -f.h / 2 + 0.07, f.w / 2 - 0.07, f.h / 2 - 0.07], { angle: 58, gap: 7, w: 0, holes: [[-f.w * 0.38, -f.h * 0.3, f.w * 0.38, f.h * 0.38]] });
      }
      M.callout('GLAZED PANEL', nb + 1, [0, yb, z0 + p.h * 0.7], 1.2);
    });
    M.part('TIMETABLE', () => {
      const x = -L / 2 + L / nb * 0.5;
      M.at(x, yb + sy * 0.02, z0 + 1.45, () => {
        const T = M.box([-0.3, -0.02, -0.4], [0.3, 0.02, 0.4].map((v, i) => (i === 1 ? 0.02 : v)), { isect: false });
        const f = T.f(sy > 0 ? '+y' : '-y');
        if (f.on && f.front) {
          f.rect(-f.w / 2 + f.mOf(1.5), -f.h / 2 + f.mOf(1.5), f.w / 2 - f.mOf(1.5), f.h / 2 - f.mOf(1.5), { w: 1 });
          f.text('TIMES', 0, f.h * 0.36, 0.06);
          for (let c = 0; c < 4; c++) for (let r = 0; r < 12; r++) f.line(-f.w * 0.42 + c * f.w * 0.22, f.h * 0.27 - r * f.h * 0.055, -f.w * 0.42 + c * f.w * 0.22 + f.w * 0.16, f.h * 0.27 - r * f.h * 0.055, { w: 0 });
        }
      });
      M.callout('TIMETABLE', 1, [x, yb + sy * 0.03, z0 + 1.5], 1.8);
    });
    M.part('BENCH', () => {
      const y0 = yb + sy * 0.08, y1 = yb + sy * 0.48;
      for (let k = 0; k < 4; k++) { const y = y0 + (y1 - y0) * (k + 0.5) / 4; M.box([-L * 0.35, y - 0.04, z0 + 0.44], [L * 0.35, y + 0.04, z0 + 0.47], { isect: false }); }
      for (const t of [-0.3, 0, 0.3]) { const x = t * L; M.box([x - 0.03, Math.min(y0, y1), z0 + 0.4], [x + 0.03, Math.max(y0, y1), z0 + 0.44], { isect: false }); M.box([x - 0.02, yb + sy * 0.05 - 0.02, z0 + 0.1], [x + 0.02, yb + sy * 0.05 + 0.02, z0 + 0.44], { isect: false }); M.tube([x, yb + sy * 0.06, z0 + 0.25], [x, (y0 + y1) / 2, z0 + 0.4], 0.015, { isect: false, seg: 4 }); }
      M.callout('BENCH', 1, [0, (y0 + y1) / 2, z0 + 0.47], 1.4);
    });
    M.part('CANOPY', () => {
      if (p.roof === 'barrel') {
        const pts = [];
        for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([-Math.cos(a) * (D / 2 + 0.2), zt + Math.sin(a) * 0.35]); }
        const inner = pts.slice().reverse().map(([y, z]) => [y * 0.96, z - 0.05]);
        const S = M.extrude([...pts, ...inner], -L / 2 - 0.15, L / 2 + 0.15, { plane: 'yz', smoothDeg: 30 });
        if (M.decorOn) for (let i = 0; i < 8; i++) { const f = S.f('s' + i); if (f.on && f.front) { const m = Math.max(3, Math.round(L / 0.5)); for (let k = 1; k < m; k++) f.line(-f.w / 2 + f.w * k / m, -f.h / 2, -f.w / 2 + f.w * k / m, f.h / 2, { w: 0 }); } }
      } else {
        const S = M.extrude([[-D / 2 - 0.25, zt + 0.05], [D / 2 + 0.25, zt + 0.25], [D / 2 + 0.25, zt + 0.4], [-D / 2 - 0.25, zt + 0.2]].map(([y, z]) => [y * -sy, z]), -L / 2 - 0.15, L / 2 + 0.15, { plane: 'yz' });
        const f = S.f('+z'); void f;
        for (const k of ['s1', 's3']) { const g = S.f(k); if (g.on && g.front) { g.text('BUS STOP', 0, 0, 0.09); } }
      }
      M.callout('CANOPY', 1, [0, 0, zt + 0.35], 1.0);
    });
    M.part('BUS STOP FLAG', () => {
      const x = p.back + 0.5, y = sy * (D / 2 + 0.4);
      M.tube([x, y, z0], [x, y, z0 + 2.9], 0.04, {});
      M.at(x, y, z0 + 2.65, () => {
        const S = M.rx(90, () => M.cyl(0.3, -0.015, 0.015, { isect: false }));
        void S;
      });
      M.at(x, y - sy * 0.016, z0 + 2.65, () => {
        const P = M.box([-0.26, -0.004, -0.06], [0.26, 0.004, 0.06], { isect: false });
        const f = P.f(sy > 0 ? '+y' : '-y'); if (f.on) f.text('BUS STOP', 0, 0, 0.05);
      });
      M.at(x, y + sy * 0.02, z0 + 1.7, () => { const T = M.box([-0.18, -0.03, -0.3], [0.18, 0.03, 0.3], { isect: false }); const f = T.f(sy > 0 ? '+y' : '-y'); if (f.on) { f.text(p.route, 0, f.h * 0.3, 0.09); for (let r = 0; r < 6; r++) f.line(-f.w * 0.35, -r * 0.06, f.w * 0.35, -r * 0.06, { w: 0 }); } });
      M.callout('BUS STOP FLAG', 1, [x, y, z0 + 2.65], 1.6);
      if (p.bin) {
        M.at(x + 0.6, y, z0, () => { M.tube([0, 0, 0], [0, 0, 0.6], 0.025, { isect: false }); M.at(0.12, 0, 0.5, () => { const Bn = M.lathe([[0.15, -0.35], [0.17, 0.1], [0.17, 0.14]], { open: true }); if (M.decorOn) { for (let i = 0; i < 12; i++) Bn.lat.meridian(i * 30, 0.1, 0.9, { w: 0 }); Bn.lat.shade({ gap: 1.6 }); } }); });
        M.callout('LITTER BIN', 1, [x + 0.72, y, z0 + 0.4], 0.6);
      }
    });
    cab(M, [L / 2 + 0.05, sy * 0.1, p.skH], 0);
    const brief = M.pick([
      `Follows the number ${p.route} bus on its diversion and stays at each new stop.`,
      'Goes to whichever stop has the longest queue and keeps the rain off it.',
      `Shelters ${M.ri(8, 14)} people at the stop the timetable says is next.`,
    ]);
    return { brief, fig: sk.fig, specs: [['ROUTE', p.route], ['SEATS', String(Math.round(L * 0.7 / 0.5))]], crew: 1, mass: [-L / 2, -D / 2, 0, L / 2, D / 2, zt], places: ['CITY', 'SUBURBAN', 'COUNTY', 'RURAL', 'INTERURBAN', 'TOWN'] };
  },
};

const OBJECTS = { kiosk, bandstand, greenhouse, carousel, phonebox, shed, shelter };

function designation(M) {
  const L = () => LET[Math.floor(M.rng() * LET.length)];
  const k = M.rng();
  const a = L(), b = L(), n = M.ri(2, 48), m = L();
  if (k < 0.4) return `${a}${b}-${String(n).padStart(2, '0')}`;
  if (k < 0.7) return `P-${n}${m}`;
  return `NO. ${n}`;
}

export default {
  id: 'pavilion',
  family: 'ground',
  weight: 2,
  build(M) {
    const names = Object.keys(OBJECTS);
    let v = M.pick(names);
    if (G && G.test && names.includes(G.test.variant)) v = G.test.variant;
    const O = OBJECTS[v];
    const p = O.plan(M);
    const des = designation(M);
    const az = M.pick([40, -40, 140, -140]) + M.r(-10, 10);
    M.setView(az, M.r(27, 35));
    const dx = p.box.dx ?? (p.front != null && p.back != null ? (p.front + p.back) / 2 : 0);
    const g = gearPlan(M, { len: p.box.len, wid: p.box.wid, hgt: p.box.hgt, mass: p.box.mass, round: p.box.round });
    const ctx = { g, des };
    let res;
    // the declared box is centered: shift the building so its skid is centered too
    M.at(-dx, 0, g.z, () => { res = O.build(M, p, ctx); });
    const mb = res.mass;
    M.info.mass = [mb[0] - dx, mb[1], mb[2] + g.z, mb[3] - dx, mb[4], mb[5] + g.z];
    const gi = g.build() || { specs: [], figure: null };
    const specs = [...(gi.specs || []).slice(0, 1), ['MASS', `${p.box.mass < 10 ? p.box.mass.toFixed(1) : Math.round(p.box.mass)} T`], ['CREW', String(res.crew)], ...res.specs].slice(0, 4);
    const place = M.pick(res.places);
    const opts = [`${g.adj} ${O.name}`, `${O.name} ${g.form}`, `${place} ${O.name} ${g.form}`];
    let klass = opts[M.ri(0, 2)];
    if (klass.length > 34) klass = opts[1].length <= 34 ? opts[1] : opts[0].length <= 34 ? opts[0] : O.name;
    const fig = gi.figure || res.fig || null;
    return { klass, brief: res.brief, specs, designation: des, family: g.family, float: g.float, figure: fig };
  },
};
void word;
