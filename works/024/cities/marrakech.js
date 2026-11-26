// Marrakech: the city seen through a keyhole arch in a wall of zellige. A
// horseshoe arch in a carved stucco frame under a green-tiled eave; around it,
// glazed star-and-cross tilework. Through it: the Koutoubia's minaret over the
// pink walls and flat roofs of the medina, date palms, the snow on the High
// Atlas beyond, storks over the ramparts, and in front, the Jardin Majorelle's
// cobalt basin with its yellow pots and cacti. The title in Ruqaa below.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

// the wall: zellige, stucco, cedar and green roof tiles
const ZG = '#1d6b50', ZG_D = '#134a37', ZB = '#21508f', ZB_D = '#173a6a', ZO = '#d39a2f', ZW = '#f4ecda', ZK = '#1c1a1a', ZR = '#b4452f';
const STUCCO = '#efe2c6', STUCCO_D = '#cdb48a', STUCCO_L = '#fbf4e4', CEDAR = '#7a4a2a', CEDAR_D = '#4e2d1a', ROOF = '#2f7a4f', ROOF_D = '#1c5236';
// the view: an afternoon sky, the Atlas, the pink city, palms, the garden
const SKY_T = '#6ea6c4', SKY_M = '#a8cfd6', SKY_H = '#f3dcb4';
const ATLAS = '#9a96bd', ATLAS_D = '#7a77a3', ATLAS_F = '#b9b4cf', SNOW = '#fbf8f3', SNOW_S = '#d6d6e8';
const PISE = '#d98a62', PISE_L = '#eaa985', PISE_D = '#b5653f', PISE_F = '#e2a487';
const KOUT = '#cf9467', KOUT_L = '#e4b088', KOUT_D = '#a96a45';
const PALM = '#4f7d3e', PALM_D = '#30592c', PALM_L = '#7da35a', TRUNK = '#8a6440', TRUNK_D = '#5e4129';
const MAJ = '#3a4dc4', MAJ_D = '#283795', MAJ_L = '#5c6fdc', LEMON = '#f2c230', LEMON_D = '#c9961c';
const BOUG = '#d2337a', BOUG_L = '#ef6aa3', CACTUS = '#5b8c5a', CACTUS_D = '#3b6a45', POOL = '#3f9aa0';

export const city = {
  id: 'marrakech', name: 'Marrakech', wall: '#4a2219',
  alt: "The Koutoubia's minaret over the pink walls and flat roofs of the medina, date palms and the snowy High Atlas beyond, storks over the ramparts and the Jardin Majorelle's blue basin with yellow pots and cacti, seen through a horseshoe arch set in carved stucco and zellige tilework under a green-tiled eave",
  google: 'family=Aref+Ruqaa:wght@400;700',
  fonts: [['700 196px "Aref Ruqaa"', 'مراكش'], ['400 60px "Aref Ruqaa"', 'MARRAKECH']],
  build,
};

// the arch: a horseshoe, its circle carried below the center onto straight jambs
const CX = W / 2, AC = 760, R = 500, JW = 420, SILL = 1470;
const SPRING = (r, jw) => AC + Math.sqrt(r * r - jw * jw);
const YS = SPRING(R, JW);
// the stucco frame (the alfiz) around the arch, the eave above, the title panel below
const AX0 = 180, AX1 = W - 180, AY0 = 160, AY1 = YS;
const TX0 = 180, TX1 = W - 180, TY0 = 1530, TY1 = 1900;
const GROUND = 1300; // where the garden meets the palms

function archPath(c, k = 0) {
  const r = R + k, jw = JW + k, ys = SPRING(r, jw);
  const a0 = Math.atan2(ys - AC, -jw), a1 = Math.atan2(ys - AC, jw);
  c.moveTo(CX - jw, SILL + (k > 0 ? 0 : 0));
  c.lineTo(CX - jw, ys);
  c.arc(CX, AC, r, a0, a1, false);
  c.lineTo(CX + jw, SILL);
  c.closePath();
}
// the zellige field: everything but the stucco frame, the opening and the title panel
function fieldPath(c) {
  c.beginPath();
  c.rect(0, 0, W, H);
  c.moveTo(AX0, AY0); c.lineTo(AX0, AY1); c.lineTo(CX - JW - 34, AY1); c.lineTo(CX - JW - 34, SILL + 30);
  c.lineTo(CX + JW + 34, SILL + 30); c.lineTo(CX + JW + 34, AY1); c.lineTo(AX1, AY1); c.lineTo(AX1, AY0); c.closePath();
  c.moveTo(TX0, TY0); c.lineTo(TX0, TY1); c.lineTo(TX1, TY1); c.lineTo(TX1, TY0); c.closePath();
}

function build() {
  const p = new Plate({ paper: STUCCO, seed: 1070 });
  const r = p.r;
  // the view is clipped to the arch's box; the wall above it covers the corners
  p.clip = { x: CX - R - 10, y: AC - R - 10, w: 2 * R + 20, h: SILL - (AC - R) + 40 };
  p.stack('land', 'town', 'palms', 'birds', 'garden', 'lamp', 'tiles', 'frame', 'eave', 'title');
  for (const n of ['tiles', 'frame', 'eave']) p.layer(n, { clip: false });
  p.layer('title', { clip: false });

  wall(p, r);
  sky(p, r);
  atlas(p, r);
  medina(p, r);
  koutoubia(p);
  ramparts(p, r);
  palms(p, r);
  garden(p, r);
  life(p, r);
  title(p);
  return sprites(p);
}

// The press redraws a mark every frame while it arrives, and palms, roofs and
// windows are costly to draw. A mark that clips in (rise, fall, wipe) is drawn
// once into a sprite of its box at the sheet's scale and that is laid down
// while it arrives; once it has arrived it is drawn as itself, so the finished
// poster is made by the very same strokes.
const CLIPS = ['rise', 'fall', 'wipe', 'wipeR', 'wipeL'];
function sprites(p) {
  for (const name of p.order) for (const m of p.layers[name].marks) {
    if (!CLIPS.includes(m.reveal) || m.draw.length > 1) continue;
    const draw = m.draw, b = m.box;
    let sp = null;
    m.draw = (c, q) => {
      if (q >= 1) { if (sp) { sp.width = sp.height = 0; sp = null; } return draw(c, q); }
      const cw = c.canvas.width, ch = c.canvas.height;
      if (!sp || sp.cw !== cw) {
        // the box and a little more, as the reveal's clip is, in whole pixels
        const k = cw / W;
        const x0 = Math.max(0, Math.floor((b.x - 8) * k)), y0 = Math.max(0, Math.floor((b.y - 8) * k));
        const x1 = Math.min(cw, Math.ceil((b.x + b.w + 8) * k)), y1 = Math.min(ch, Math.ceil((b.y + b.h + 8) * k));
        if (x1 <= x0 || y1 <= y0) return;
        if (sp) sp.width = sp.height = 0;
        sp = document.createElement('canvas');
        sp.width = x1 - x0; sp.height = y1 - y0; sp.cw = cw; sp.x0 = x0; sp.y0 = y0;
        const s = sp.getContext('2d');
        s.setTransform(k, 0, 0, k, -x0, -y0);
        draw(s, q);
      }
      // clip reveals do not move the mark, so the sprite goes down pixel for pixel
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sp, sp.x0, sp.y0); c.restore();
    };
  }
  return p;
}

// ================================================================ the wall
function wall(p, r) {
  // first, the bare plaster: invisible on the paper, but it hides whatever is
  // drawn in the arch's box outside the opening, from the start
  p.mark('tiles', {
    t: 0, d: 0.1, reveal: 'none', box: { x: 0, y: 0, w: W, h: H },
    draw: (c) => { c.beginPath(); c.rect(0, 0, W, H); archPath(c); c.fillStyle = STUCCO; c.fill('evenodd'); },
  });
  zellige(p, r);
  archBands(p, r);
  stucco(p, r);
  archRing(p);
  archSill(p);
  medallions(p);
  eave(p, r);
}

// star-and-cross zellige: an eight-pointed star in every cell, the crosses between
const S = 64;
function zellige(p, r) {
  const cols = Math.ceil(W / S), rows = Math.ceil(H / S);
  // each tile's glaze varies a little, fixed now
  const tone = [];
  const rr = rng(808);
  for (let j = 0; j < rows; j++) { tone.push([]); for (let i = 0; i < cols; i++) tone[j].push([rr.range(-0.08, 0.08), rr.range(-0.06, 0.06)]); }
  const starCol = (i, j) => {
    const k = ((i % 2) + 2 * (j % 2) + Math.floor(i / 2) + Math.floor(j / 2)) % 4;
    return [ZG, ZB, ZG, ZO][k];
  };
  // a star added to the current path, so many can be filled at once
  const star = (c, x, y, rad) => {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
      const rr2 = k % 2 ? rad * 0.765 : rad; // two squares, crossed
      const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
      k ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  };
  const P = 4; // cells per patch
  const patches = [];
  for (let pj = 0; pj * P < rows; pj++) {
    for (let pi = 0; pi * P < cols; pi++) {
      const x0 = pi * P * S, y0 = pj * P * S, w = P * S, h = P * S;
      // skip patches with no field in them
      const inside = (x, y) => (x > AX0 && x < AX1 && y > AY0 && y < AY1) || (x > CX - JW - 34 && x < CX + JW + 34 && y > AY1 && y < SILL + 30) || (x > TX0 && x < TX1 && y > TY0 && y < TY1);
      let any = false;
      for (let a = 0; a <= 4 && !any; a++) for (let b = 0; b <= 4 && !any; b++) if (!inside(x0 + (a / 4) * w, y0 + (b / 4) * h)) any = true;
      if (!any) continue;
      patches.push({ x0, y0, pi, pj, d: Math.hypot(x0 + w / 2 - CX, (y0 + h / 2 - 1950) * 0.8) });
    }
  }
  // set from the foot of the wall upward and outward
  patches.sort((a, b) => a.d - b.d);
  patches.forEach((pt, n) => {
    const { x0, y0 } = pt;
    // the cells, each with its glaze (one of three tones of its color) and the color of its heart
    pt.cells = []; const used = new Map();
    for (let j = y0 / S; j < y0 / S + P; j++) {
      for (let i = x0 / S; i < x0 / S + P; i++) {
        const col = starCol(i, j), dl = (tone[j] && tone[j][i] ? tone[j][i][0] : 0);
        const key = `${col}${Math.round(dl * 12)}`;
        used.set(key, mix(col, dl > 0 ? '#ffffff' : '#000000', Math.round(Math.abs(dl) * 12) / 12));
        pt.cells.push([i * S + S / 2, j * S + S / 2, key, col === ZO ? 0 : col === ZB ? 1 : 2]);
      }
    }
    pt.inks = [...used];
    p.group('tiles', { x: x0, y: y0, w: P * S, h: P * S }, (c) => {
      c.save();
      c.beginPath(); c.rect(x0, y0, P * S, P * S); c.clip();
      fieldPath(c); c.clip('evenodd');
      // the crosses are the white ground
      c.fillStyle = ZW; c.fillRect(x0, y0, P * S, P * S);
      // each ink in one path: the stars by color and glaze, then the strapwork over them
      for (const [col, fill] of pt.inks) {
        c.beginPath();
        for (const [x, y, k] of pt.cells) if (k === col) star(c, x, y, S * 0.5);
        c.fillStyle = fill; c.fill();
      }
      c.beginPath(); for (const [x, y] of pt.cells) star(c, x, y, S * 0.5);
      c.strokeStyle = ZW; c.lineWidth = 3.2; c.stroke();
      c.beginPath(); for (const [x, y] of pt.cells) star(c, x, y, S * 0.43);
      c.strokeStyle = ZK; c.lineWidth = 1.1; c.stroke();
      // a small star of another color in the middle of each
      for (const [inner, fill] of [[0, ZB], [1, ZO], [2, ZW]]) {
        c.beginPath(); for (const [x, y, , mid] of pt.cells) if (mid === inner) star(c, x, y, S * 0.16);
        c.fillStyle = fill; c.fill();
      }
      // a little shine on the glaze
      c.beginPath(); for (const [x, y] of pt.cells) { c.moveTo(x - S * 0.02, y - S * 0.16); c.ellipse(x - S * 0.12, y - S * 0.16, S * 0.1, S * 0.04, -0.6, 0, Math.PI * 2); }
      c.fillStyle = 'rgba(255,255,255,.16)'; c.fill();
      // the crosses at the corners: a black lozenge with a red heart
      c.beginPath(); for (const [x, y] of pt.cells) { const cx = x - S / 2, cy = y - S / 2; c.moveTo(cx, cy - 6); c.lineTo(cx + 6, cy); c.lineTo(cx, cy + 6); c.lineTo(cx - 6, cy); c.closePath(); }
      c.fillStyle = ZK; c.fill();
      c.beginPath(); for (const [x, y] of pt.cells) { const cx = x - S / 2, cy = y - S / 2; c.moveTo(cx + 2, cy); c.arc(cx, cy, 2, 0, Math.PI * 2); }
      c.fillStyle = ZR; c.fill();
      c.restore();
    }, { t: 0.25 + n * 0.05, d: 0.5, reveal: 'pop' });
  });
  // black and white borders along the field's edges: a chevron band
  const edges = [
    [AX0 - 22, AY0 - 22, AX1 - AX0 + 44, 22, 'h'], [AX0 - 22, AY0, 22, AY1 - AY0 + 22, 'v'], [AX1, AY0, 22, AY1 - AY0 + 22, 'v'],
    [AX0 - 22, AY1, CX - JW - 34 - (AX0 - 22), 22, 'h'], [CX + JW + 34, AY1, AX1 + 22 - (CX + JW + 34), 22, 'h'],
    [TX0 - 22, TY0 - 22, TX1 - TX0 + 44, 22, 'h'], [TX0 - 22, TY1, TX1 - TX0 + 44, 22, 'h'], [TX0 - 22, TY0, 22, TY1 - TY0, 'v'], [TX1, TY0, 22, TY1 - TY0, 'v'],
  ];
  edges.forEach(([x, y, w, h, o], n) => {
    p.group('tiles', { x, y, w, h }, (c) => {
      c.fillStyle = ZK; c.fillRect(x, y, w, h);
      c.fillStyle = ZW;
      const L = o === 'h' ? w : h, step = 22;
      for (let s = 0; s < L; s += step) {
        if (o === 'h') poly(c, [[x + s, y + 4], [x + s + step / 2, y + h - 4], [x + s + step, y + 4]]);
        else poly(c, [[x + 4, y + s], [x + w - 4, y + s + step / 2], [x + 4, y + s + step]]);
        c.fill();
      }
      c.fillStyle = ZO; c.fillRect(x, y, w, 2); c.fillRect(x, y + h - 2, w, 2);
    }, { t: 2.4 + n * 0.12, d: 0.7, reveal: o === 'h' ? 'wipe' : 'fall', ease: 'inOut' });
  });
}

// carved stucco in the spandrels: a net of interlaced lobed arches (sebka), cut deep
function stucco(p, r) {
  const region = (c) => { c.beginPath(); c.rect(AX0, AY0, AX1 - AX0, AY1 - AY0); archPath(c, 58); };
  // the net, built as rows of arcs whose crossings make the lozenges
  const net = [];
  const cw = 64, ch = 92;
  for (let row = 0; row * ch < AY1 - AY0 + ch; row++) {
    const y = AY0 + row * ch, off = (row % 2) * cw / 2;
    for (let x = AX0 - cw + off; x < AX1 + cw; x += cw) net.push([x, y]);
  }
  ['L', 'R'].forEach((side, si) => {
    const x0 = side === 'L' ? AX0 : CX, x1 = side === 'L' ? CX : AX1;
    p.group('frame', { x: x0, y: AY0, w: x1 - x0, h: AY1 - AY0 }, (c) => {
      c.save();
      c.beginPath(); c.rect(x0, AY0, x1 - x0, AY1 - AY0); c.clip();
      region(c); c.clip('evenodd');
      c.fillStyle = STUCCO; c.fillRect(x0, AY0, x1 - x0, AY1 - AY0);
      // a lozenge net: each line drawn three times, shadow, cut and light, so it reads as carved
      const lines = (dx, dy, col, lw) => {
        c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
        for (const [x, y] of mine) {
          c.moveTo(x + dx, y + ch + dy);
          c.bezierCurveTo(x + dx, y + ch * 0.45 + dy, x + cw * 0.5 + dx, y + ch * 0.55 + dy, x + cw * 0.5 + dx, y + dy);
          c.bezierCurveTo(x + cw * 0.5 + dx, y + ch * 0.55 + dy, x + cw + dx, y + ch * 0.45 + dy, x + cw + dx, y + ch + dy);
        }
        c.stroke();
      };
      const mine = net.filter(([x]) => x > x0 - cw && x < x1);
      lines(1.8, 2.2, STUCCO_D, 7);
      lines(0, 0, STUCCO_L, 5);
      lines(0.6, 0.8, mix(STUCCO_D, CEDAR, 0.25), 1.2);
      // a small flower in each lozenge
      const petals = (d, col) => {
        c.beginPath();
        for (const [x, y] of mine) {
          const fx = x + cw * 0.5 + d, fy = y + ch * 0.7 + d;
          for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, px = fx + Math.cos(a) * 6, py = fy + Math.sin(a) * 6; c.moveTo(px + Math.cos(a) * 5, py + Math.sin(a) * 5); c.ellipse(px, py, 5, 2.6, a, 0, Math.PI * 2); }
        }
        c.fillStyle = col; c.fill();
      };
      petals(1, STUCCO_D); petals(0, STUCCO_L);
      c.beginPath(); for (const [x, y] of mine) { const fx = x + cw * 0.5, fy = y + ch * 0.7; c.moveTo(fx + 2, fy); c.arc(fx, fy, 2, 0, Math.PI * 2); }
      c.fillStyle = mix(STUCCO_D, CEDAR, 0.3); c.fill();
      c.restore();
    }, { t: 0.9 + si * 0.2, d: 1.1, reveal: 'fall', ease: 'inOut' });
  });
}
function medallions(p) {
  // a medallion in each top corner: a sixteen-point rosette in zellige colors
  for (const s of [-1, 1]) {
    const mx = CX + s * 560, my = 300, rad = 70;
    p.group('frame', { x: mx - rad - 10, y: my - rad - 10, w: 2 * rad + 20, h: 2 * rad + 20 }, (c) => {
      c.fillStyle = STUCCO_D; c.beginPath(); c.arc(mx + 2, my + 3, rad + 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = ZW; c.beginPath(); c.arc(mx, my, rad + 4, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        c.fillStyle = k % 2 ? ZG : ZB;
        c.beginPath(); c.moveTo(mx, my);
        c.lineTo(mx + Math.cos(a - 0.17) * rad * 0.6, my + Math.sin(a - 0.17) * rad * 0.6);
        c.lineTo(mx + Math.cos(a) * rad, my + Math.sin(a) * rad);
        c.lineTo(mx + Math.cos(a + 0.17) * rad * 0.6, my + Math.sin(a + 0.17) * rad * 0.6);
        c.closePath(); c.fill();
      }
      c.strokeStyle = ZK; c.lineWidth = 1.2;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        c.beginPath(); c.moveTo(mx + Math.cos(a - 0.17) * rad * 0.6, my + Math.sin(a - 0.17) * rad * 0.6); c.lineTo(mx + Math.cos(a) * rad, my + Math.sin(a) * rad); c.lineTo(mx + Math.cos(a + 0.17) * rad * 0.6, my + Math.sin(a + 0.17) * rad * 0.6); c.stroke();
      }
      c.fillStyle = ZO; c.beginPath(); c.arc(mx, my, rad * 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = ZK; c.beginPath(); c.arc(mx, my, rad * 0.12, 0, Math.PI * 2); c.fill();
      c.strokeStyle = ZK; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, rad + 4, 0, Math.PI * 2); c.stroke();
    }, { t: 2.1 + (s > 0 ? 0.2 : 0), d: 0.8, reveal: 'iris', ease: 'inOut' });
  }
}

// the bands round the opening: the carved lobes of the rim, then a zellige ring
function archBands(p, r) {
  const ring = (c, k0, k1) => { c.beginPath(); archPath(c, k1); archPath(c, k0); };
  // the carved rim: a band of lobes round the opening, drawn as the pen goes
  p.mark('frame', {
    t: 0.5, d: 1.4, reveal: 'draw', ease: 'inOut', box: { x: CX - R - 50, y: AC - R - 50, w: 2 * R + 100, h: SILL - AC + R + 90 },
    draw: (c, q) => {
      c.save(); ring(c, 0, 34); c.clip('evenodd');
      // the band is revealed from both feet up to the crown
      c.beginPath(); c.rect(0, lerp(SILL + 40, AC - R - 40, q), W, H); c.clip();
      c.fillStyle = STUCCO; c.fillRect(0, 0, W, H);
      // lobes: half discs along the edge, carved
      const lobes = [];
      const arcA0 = Math.atan2(YS - AC, -JW), arcA1 = Math.atan2(YS - AC, JW) + Math.PI * 2;
      const nA = 44;
      for (let k = 0; k <= nA; k++) { const a = lerp(arcA0, arcA1, k / nA); lobes.push([CX + Math.cos(a) * (R + 4), AC + Math.sin(a) * (R + 4)]); }
      for (let y = YS + 30; y < SILL; y += 34) { lobes.push([CX - JW - 4, y]); lobes.push([CX + JW + 4, y]); }
      for (const [x, y] of lobes) {
        c.fillStyle = STUCCO_D; c.beginPath(); c.arc(x + 1.5, y + 2, 15, 0, Math.PI * 2); c.fill();
        c.fillStyle = STUCCO_L; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fill();
        c.fillStyle = mix(STUCCO_D, CEDAR, 0.15); c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      c.strokeStyle = 'rgba(60,40,25,.75)'; c.lineWidth = 2.4;
      c.save(); c.beginPath(); c.rect(0, lerp(SILL + 40, AC - R - 40, q), W, H); c.clip();
      c.beginPath(); archPath(c, 0); c.stroke();
      c.restore();
    },
  });
}
function archRing(p) {
  const ring = (c, k0, k1) => { c.beginPath(); archPath(c, k1); archPath(c, k0); };
  // the outer ring: ochre and green voussoirs, radiating
  const vous = [];
  const n = 54;
  const a0 = Math.atan2(SPRING(R + 58, JW + 58) - AC, -(JW + 58)), a1 = Math.atan2(SPRING(R + 58, JW + 58) - AC, JW + 58) + Math.PI * 2;
  for (let k = 0; k < n; k++) vous.push([lerp(a0, a1, k / n), lerp(a0, a1, (k + 1) / n)]);
  p.group('frame', { x: CX - R - 80, y: AC - R - 80, w: 2 * R + 160, h: SILL - AC + R + 120 }, (c) => {
    // the ring's white ground, then each voussoir as a small wedge between the two radii
    c.fillStyle = ZW; ring(c, 34, 58); c.fill('evenodd');
    for (const odd of [0, 1]) {
      c.beginPath();
      vous.forEach(([b0, b1], k) => {
        if (k % 2 !== odd) return;
        const a = b0 + 0.006, b = b1 - 0.006;
        c.moveTo(CX + Math.cos(a) * (R + 35), AC + Math.sin(a) * (R + 35));
        c.arc(CX, AC, R + 57, a, b); c.arc(CX, AC, R + 35, b, a, true); c.closePath();
      });
      // the jambs below the circle, in the same two colors, in courses
      for (const s of [-1, 1]) {
        for (let y = SPRING(R + 34, JW + 34); y < SILL + 30; y += 26) {
          if (Math.round(y / 26) % 2 !== odd) continue;
          c.rect(CX + s * (JW + 34) - (s > 0 ? 0 : 24), y + 1, 24, 24);
        }
      }
      c.fillStyle = odd ? ZG : ZO; c.fill();
    }
    c.strokeStyle = ZK; c.lineWidth = 2;
    c.beginPath(); archPath(c, 58); c.stroke();
    c.beginPath(); archPath(c, 34); c.stroke();
  }, { t: 1.6, d: 0.9, reveal: 'rise', ease: 'inOut' });

}
function archSill(p) {
  // the sill: a marble step across the foot of the opening
  p.group('frame', { x: CX - JW - 70, y: SILL - 6, w: 2 * JW + 140, h: 50 }, (c) => {
    c.fillStyle = '#e9e1d2'; c.fillRect(CX - JW - 60, SILL, 2 * JW + 120, 22);
    c.fillStyle = '#c9bca6'; c.fillRect(CX - JW - 60, SILL + 18, 2 * JW + 120, 6);
    c.strokeStyle = 'rgba(60,40,25,.6)'; c.lineWidth = 1.2; c.strokeRect(CX - JW - 60, SILL, 2 * JW + 120, 24);
  }, { t: 2.0, d: 0.6, reveal: 'wipe' });
}

// the eave over the door: carved cedar brackets under a roof of green glazed tiles
function eave(p, r) {
  const y0 = 40, y1 = 112, yb = 150;
  p.group('eave', { x: 0, y: y1 - 4, w: W, h: yb - y1 + 16 }, (c) => {
    c.fillStyle = CEDAR; c.fillRect(0, y1, W, yb - y1);
    // the brackets: stepped ends of beams, carved
    for (let x = 12; x < W; x += 48) {
      c.fillStyle = CEDAR_D; c.fillRect(x, y1, 26, yb - y1);
      c.fillStyle = mix(CEDAR, '#d9a06a', 0.25); c.fillRect(x + 3, y1 + 4, 20, 8); c.fillRect(x + 6, y1 + 16, 14, 8); c.fillRect(x + 9, y1 + 28, 8, 6);
    }
    // a painted band along the beam: small diamonds
    c.fillStyle = ZO; for (let x = 0; x < W; x += 16) poly(c, [[x, yb - 5], [x + 4, yb - 9], [x + 8, yb - 5], [x + 4, yb - 1]]), c.fill();
    c.fillStyle = CEDAR_D; c.fillRect(0, yb - 2, W, 6);
  }, { t: 0.3, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the roof: rows of green barrel tiles, the bottom row with round ends
  p.group('eave', { x: 0, y: 0, w: W, h: y1 + 14 }, (c) => {
    c.fillStyle = ROOF_D; c.fillRect(0, 0, W, y1 + 4);
    const tw = 30;
    for (let x = -tw / 2; x < W + tw; x += tw) {
      const g = c.createLinearGradient(x, 0, x + tw, 0);
      g.addColorStop(0, ROOF_D); g.addColorStop(0.35, mix(ROOF, '#9fd0a0', 0.35)); g.addColorStop(0.6, ROOF); g.addColorStop(1, ROOF_D);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x + 2, 0); c.lineTo(x + 2, y1 - 2); c.arc(x + tw / 2, y1 - 2, tw / 2 - 2, Math.PI, 0, true); c.lineTo(x + tw - 2, 0); c.closePath(); c.fill();
      // the courses: a fine line where each tile laps the one below
      c.strokeStyle = 'rgba(10,40,25,.5)'; c.lineWidth = 1;
      c.beginPath(); for (let y = 18; y < y1 - 4; y += 22) { c.moveTo(x + 3, y); c.quadraticCurveTo(x + tw / 2, y + 5, x + tw - 3, y); } c.stroke();
      c.fillStyle = 'rgba(10,40,25,.6)'; c.beginPath(); c.arc(x + tw / 2, y1 - 2, 4, 0, Math.PI * 2); c.fill();
    }
    // the ridge
    c.fillStyle = ROOF_D; c.fillRect(0, 0, W, 10);
    c.fillStyle = mix(ROOF, '#9fd0a0', 0.3); c.fillRect(0, 8, W, 3);
  }, { t: 0.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the view
function sky(p, r) {
  const b = { x: CX - R, y: AC - R, w: 2 * R, h: 1100 - (AC - R) };
  p.group('land', b, (c) => {
    const g = c.createLinearGradient(0, AC - R, 0, 1080);
    g.addColorStop(0, SKY_T); g.addColorStop(0.55, SKY_M); g.addColorStop(0.9, SKY_H); g.addColorStop(1, '#f6d2a6');
    c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
    const glow = c.createRadialGradient(1180, 980, 10, 1180, 980, 520);
    glow.addColorStop(0, 'rgba(255,226,170,.75)'); glow.addColorStop(1, 'rgba(255,226,170,0)');
    c.fillStyle = glow; c.fillRect(b.x, b.y, b.w, b.h);
  }, { t: 1.6, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // a few thin clouds
  [[420, 430, 260], [880, 360, 320], [1040, 560, 220], [560, 640, 180]].forEach(([x, y, w], i) => {
    p.group('land', { x: x - 10, y: y - 20, w: w + 20, h: 34 }, (c) => {
      c.fillStyle = 'rgba(255,250,240,.75)';
      c.beginPath(); c.ellipse(x + w / 2, y, w / 2, 8, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + w * 0.4, y - 7, w * 0.26, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(232,190,150,.35)'; c.fillRect(x + w * 0.15, y + 4, w * 0.7, 2);
    }, { t: 2.6 + i * 0.2, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// the High Atlas: a far range and a nearer one, snow on their tops
function ridge(rr, x0, x1, base, peak, rough, n = 64) {
  const pts = [];
  // a few big peaks, then midpoint noise
  const tops = [];
  for (let k = 0; k < 5; k++) tops.push([lerp(x0, x1, rr()), peak + rr() * rough]);
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    let y = base;
    for (const [tx, ty] of tops) y = Math.min(y, ty + Math.abs(x - tx) * rr.range(0.45, 0.6));
    pts.push([x, y + rr.range(-6, 6)]);
  }
  return pts;
}
function atlas(p, r) {
  const x0 = CX - R, x1 = CX + R;
  const rr = rng(4167);
  const far = ridge(rr, x0, x1, 1080, 820, 60);
  const near = ridge(rr, x0, x1, 1100, 900, 70, 80);
  [[far, ATLAS_F, 3.0, 0], [near, ATLAS, 3.4, 1]].forEach(([pts, col, t, k]) => {
    const shape = pts.concat([[x1, 1120], [x0, 1120]]);
    const snowLine = k ? 960 : 900;
    p.group('land', boxOf(shape, 4), (c) => {
      c.fillStyle = col; poly(c, shape); c.fill();
      // shade on the east faces (the slopes that go down to the right)
      c.fillStyle = mix(col, ATLAS_D, 0.55);
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i + 1][1] > pts[i][1]) { poly(c, [pts[i], pts[i + 1], [pts[i + 1][0] - 6, 1120], [pts[i][0] - 30, 1120]]); c.fill(); }
      }
    }, { t, d: 1.0, reveal: 'rise', ease: 'out' });
    // the snow: above the snow line, ragged, with couloirs running down
    // the snow's ragged edge and the streaks in the gullies, fixed now
    const rs = rng(90 + k), edge = [[x0, snowLine]], streaks = [];
    for (let x = x0; x <= x1; x += 14) edge.push([x, snowLine + Math.sin(x * 0.07 + k) * 10 + rs.range(-8, 8)]);
    edge.push([x1, 0], [x0, 0]);
    for (let i = 0; i < 30; i++) { const x = rs.range(x0, x1), y = snowLine + rs.range(-4, 16), L = rs.range(10, 36); streaks.push([x, y, x + rs.range(-8, 8), y + L, rs.range(1, 2.6)]); }
    p.group('land', boxOf(shape, 4), (c) => {
      c.save(); poly(c, shape); c.clip();
      c.fillStyle = SNOW; poly(c, edge); c.fill();
      c.strokeStyle = 'rgba(251,248,243,.7)'; c.lineCap = 'round';
      for (const [xa, ya, xb, yb, lw] of streaks) { c.lineWidth = lw; c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke(); }
      // shadowed snow on the east faces
      c.fillStyle = SNOW_S;
      for (let i = 0; i < pts.length - 1; i++) if (pts[i + 1][1] > pts[i][1] + 2) { poly(c, [pts[i], pts[i + 1], [pts[i + 1][0] - 4, snowLine + 40], [pts[i][0] - 18, snowLine + 40]]); c.fill(); }
      c.restore();
    }, { t: t + 0.7, d: 0.9, reveal: 'fall', ease: 'inOut' });
  });
  // the palm groves on the plain, a haze of green dots under the mountains
  const dots = [];
  for (let i = 0; i < 260; i++) dots.push([r.range(x0, x1), 1092 + r() * 36, r.range(3, 7)]);
  p.group('land', { x: x0, y: 1070, w: 2 * R, h: 80 }, (c) => {
    c.fillStyle = mix(SKY_H, PALM, 0.25); c.fillRect(x0, 1100, 2 * R, 60);
    for (const [x, y, s] of dots) { c.fillStyle = mix(PALM, SKY_H, 0.45 - (y - 1092) / 200); c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 4.2, d: 0.8, reveal: 'rise' });
}

// the medina: flat roofs in pink and ochre, rising in rows toward us
function medina(p, r) {
  const x0 = CX - R - 10, x1 = CX + R + 10;
  const rows = [[1130, 0.55, 22], [1150, 0.7, 26], [1172, 0.85, 30], [1196, 1, 36]];
  rows.forEach(([base, s, n], ri) => {
    const rr = rng(700 + ri), houses = [];
    let x = x0;
    while (x < x1) {
      const w = rr.range(34, 70) * s, h = rr.range(26, 60) * s;
      houses.push({ x, w, h, col: rr.pick([PISE, PISE_L, PISE_F, mix(PISE, PISE_D, 0.3), '#e8b58f']), win: rr.int(1, 3), terrace: rr.chance(0.3), green: rr.chance(0.08), tower: rr.chance(0.05) });
      x += w * rr.range(0.7, 1.0);
    }
    // split each row in three marks, left, middle and right
    for (let part = 0; part < 3; part++) {
      const a = x0 + (part / 3) * (x1 - x0), b = x0 + ((part + 1) / 3) * (x1 - x0);
      const list = houses.filter((hh) => hh.x >= a && hh.x < b);
      p.group('town', { x: a - 80, y: base - 160 * s, w: b - a + 160, h: 180 * s + 40 }, (c) => {
        for (const hh of list) house(c, hh, base, s);
      }, { t: 4.4 + ri * 0.3 + part * 0.1, d: 0.7, reveal: 'rise' });
    }
  });
}
function house(c, hh, base, s) {
  const { x, w, h, col } = hh, top = base - h;
  c.fillStyle = col; c.fillRect(x, top, w, h + 40);
  // the shaded side
  c.fillStyle = mix(col, PISE_D, 0.55); c.fillRect(x, top, w * 0.18, h + 40);
  // the parapet, and its stepped merlons on some
  c.fillStyle = mix(col, '#fff2e0', 0.2); c.fillRect(x, top - 3 * s, w, 3 * s);
  if (hh.terrace) {
    c.fillStyle = col;
    for (let k = x + 3; k < x + w - 6 * s; k += 10 * s) { c.fillRect(k, top - 9 * s, 5 * s, 6 * s); }
  }
  if (hh.green) { c.fillStyle = ROOF; poly(c, [[x - 2, top], [x + w / 2, top - 14 * s], [x + w + 2, top]]); c.fill(); }
  if (hh.tower) {
    c.fillStyle = col; c.fillRect(x + w * 0.35, top - 46 * s, w * 0.3, 46 * s);
    c.fillStyle = ROOF; c.fillRect(x + w * 0.33, top - 50 * s, w * 0.34, 5 * s);
  }
  // windows: small, dark, some arched
  c.fillStyle = 'rgba(80,36,24,.75)';
  for (let k = 0; k < hh.win; k++) {
    const wx = x + w * (0.3 + 0.5 * (k + 0.5) / hh.win) - 2.5 * s, wy = top + h * 0.3;
    c.beginPath(); c.moveTo(wx, wy + 9 * s); c.lineTo(wx, wy + 2 * s); c.arc(wx + 2.5 * s, wy + 2.5 * s, 2.5 * s, Math.PI, 0); c.lineTo(wx + 5 * s, wy + 9 * s); c.fill();
  }
}

// the Koutoubia: the square stone shaft with its panels of lobed arches and net,
// the band of green tile under the merlons, the lantern, its dome and the brass balls
const KX = 600, KB = 1200, KW = 104, KS = 650; // its axis, foot, width and the shaft's top
function koutoubia(p) {
  const x0 = KX - KW / 2, x1 = KX + KW / 2, side = 22;
  // the mosque's long green roofs at its foot
  p.group('town', { x: KX - 260, y: 1080, w: 460, h: 130 }, (c) => {
    for (const [a, b, y] of [[KX - 250, KX - 60, 1120], [KX + 50, KX + 190, 1128], [KX - 200, KX - 20, 1140]]) {
      c.fillStyle = PISE_L; c.fillRect(a, y, b - a, 80);
      c.fillStyle = mix(PISE_L, PISE_D, 0.3); c.fillRect(a, y, 10, 80);
      // a blind arcade along the wall
      c.fillStyle = mix(PISE_L, PISE_D, 0.45);
      for (let x = a + 16; x < b - 12; x += 16) { c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x, y + 14); c.arc(x + 5, y + 14, 5, Math.PI, 0); c.lineTo(x + 10, y + 40); c.fill(); }
      c.fillStyle = ROOF; poly(c, [[a - 4, y], [a + 18, y - 16], [b - 18, y - 16], [b + 4, y]]); c.fill();
      c.strokeStyle = ROOF_D; c.lineWidth = 1; c.beginPath(); for (let x = a + 6; x < b; x += 7) { c.moveTo(x, y - 1); c.lineTo(x + 3, y - 14); } c.stroke();
    }
  }, { t: 5.2, d: 0.7, reveal: 'rise' });
  // the shaft, rising
  p.group('town', { x: x0 - side - 8, y: KS - 34, w: KW + side + 16, h: KB - KS + 40 }, (c) => {
    // the shaded face to the left
    c.fillStyle = KOUT_D; poly(c, [[x0 - side, KS + 8], [x0, KS], [x0, KB], [x0 - side, KB]]); c.fill();
    c.fillStyle = KOUT; c.fillRect(x0, KS, KW, KB - KS);
    // light on the right edge
    c.fillStyle = KOUT_L; c.fillRect(x1 - 6, KS, 6, KB - KS);
    // the masonry courses
    c.strokeStyle = 'rgba(120,70,40,.28)'; c.lineWidth = 1; c.beginPath();
    for (let y = KS + 8; y < KB; y += 8) { c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0 - side, y + 2); c.lineTo(x0, y); }
    c.stroke();
    // the merlons along the top, stepped and pointed
    c.fillStyle = KOUT;
    for (let k = 0; k < 6; k++) {
      const mx = x0 + 4 + k * (KW - 8) / 5;
      poly(c, [[mx - 7, KS], [mx - 7, KS - 10], [mx - 4, KS - 10], [mx - 4, KS - 16], [mx, KS - 22], [mx + 4, KS - 16], [mx + 4, KS - 10], [mx + 7, KS - 10], [mx + 7, KS]]); c.fill();
    }
    c.fillStyle = KOUT_D;
    for (let k = 0; k < 3; k++) { const mx = x0 - side + 5 + k * 8; c.fillRect(mx - 3, KS - 6 + k * 2, 6, 10); }
  }, { t: 5.6, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // the carved panels on its face, set in place one above another
  const panel = (c, y, h, kind) => {
    const px = x0 + 12, pw = KW - 24;
    c.fillStyle = KOUT_D; c.fillRect(px - 2, y - 2, pw + 4, h + 4);
    c.fillStyle = mix(KOUT, KOUT_D, 0.25); c.fillRect(px, y, pw, h);
    c.strokeStyle = KOUT_L; c.lineWidth = 1.6;
    if (kind === 'net') {
      // the lozenge net of interlaced arches
      c.save(); c.beginPath(); c.rect(px, y, pw, h); c.clip();
      c.beginPath();
      const cw = pw / 4, ch = 26;
      for (let row = -1; row * ch < h + ch; row++) {
        const yy = y + row * ch, off = (row % 2) * cw / 2;
        for (let xx = px - cw + off; xx < px + pw + cw; xx += cw) {
          c.moveTo(xx, yy + ch); c.bezierCurveTo(xx, yy + ch * 0.4, xx + cw / 2, yy + ch * 0.6, xx + cw / 2, yy);
          c.bezierCurveTo(xx + cw / 2, yy + ch * 0.6, xx + cw, yy + ch * 0.4, xx + cw, yy + ch);
        }
      }
      c.stroke(); c.restore();
    } else {
      // a pair of lobed blind arches over a window
      for (const f of [0.25, 0.75]) {
        const ax = px + pw * f, ar = pw * 0.2;
        c.beginPath(); c.moveTo(ax - ar, y + h); c.lineTo(ax - ar, y + h * 0.42);
        for (let k = 0; k < 5; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 5; c.arc(ax + Math.cos(a) * ar * 0.82, y + h * 0.42 + Math.sin(a) * ar * 0.82, ar * 0.26, a - 1.2, a + 1.2); }
        c.lineTo(ax + ar, y + h); c.stroke();
      }
      c.fillStyle = 'rgba(70,35,20,.85)';
      const wx = px + pw / 2;
      c.beginPath(); c.moveTo(wx - 5, y + h - 4); c.lineTo(wx - 5, y + h * 0.5); c.arc(wx, y + h * 0.5, 5, Math.PI, 0); c.lineTo(wx + 5, y + h - 4); c.fill();
    }
  };
  const panels = [[KS + 40, 120, 'net'], [KS + 176, 74, 'arch'], [KS + 270, 60, 'arch'], [KS + 352, 86, 'net']];
  panels.forEach(([y, h, kind], i) => {
    p.group('town', { x: x0, y: y - 6, w: KW, h: h + 12 }, (c) => panel(c, y, h, kind), { t: 6.5 + i * 0.18, d: 0.5, reveal: 'fade' });
  });
  // small windows lower down, staggered as the ramp inside climbs
  p.group('town', { x: x0, y: KS + 440, w: KW, h: KB - KS - 440 }, (c) => {
    c.fillStyle = 'rgba(70,35,20,.8)';
    for (let k = 0; k < 4; k++) { const wx = KX + (k % 2 ? 18 : -18), wy = KS + 470 + k * 34; c.fillRect(wx - 2.5, wy, 5, 12); c.beginPath(); c.arc(wx, wy, 2.5, Math.PI, 0); c.fill(); }
  }, { t: 7.2, d: 0.4, reveal: 'fade' });
  // the band of green tile under the merlons
  p.group('town', { x: x0 - side, y: KS + 10, w: KW + side, h: 22 }, (c) => {
    c.fillStyle = ZG; c.fillRect(x0, KS + 12, KW, 16);
    c.fillStyle = ZG_D; poly(c, [[x0 - side, KS + 18], [x0, KS + 12], [x0, KS + 28], [x0 - side, KS + 34]]); c.fill();
    c.fillStyle = ZW; for (let x = x0 + 4; x < x1; x += 10) { poly(c, [[x, KS + 20], [x + 4, KS + 15], [x + 8, KS + 20], [x + 4, KS + 25]]); c.fill(); }
  }, { t: 7.2, d: 0.6, reveal: 'wipe' });
  // the lantern, its little dome and the finial of brass balls
  const lw = 40, lt = KS - 100;
  p.group('town', { x: KX - lw, y: lt - 120, w: 2 * lw, h: KS - lt + 124 }, (c) => {
    c.fillStyle = KOUT_D; poly(c, [[KX - lw / 2 - 10, lt + 4], [KX - lw / 2, lt], [KX - lw / 2, KS], [KX - lw / 2 - 10, KS]]); c.fill();
    c.fillStyle = KOUT; c.fillRect(KX - lw / 2, lt, lw, KS - lt);
    c.fillStyle = ZG; c.fillRect(KX - lw / 2, lt + 10, lw, 8);
    c.strokeStyle = KOUT_L; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(KX - 9, KS - 14); c.lineTo(KX - 9, lt + 40); c.arc(KX, lt + 40, 9, Math.PI, 0); c.lineTo(KX + 9, KS - 14); c.stroke();
    c.fillStyle = 'rgba(70,35,20,.85)'; c.fillRect(KX - 3, lt + 44, 6, 22);
    c.fillStyle = KOUT;
    for (let k = 0; k < 3; k++) { const mx = KX - lw / 2 + 6 + k * (lw - 12) / 2; poly(c, [[mx - 5, lt], [mx - 5, lt - 8], [mx, lt - 14], [mx + 5, lt - 8], [mx + 5, lt]]); c.fill(); }
    // the ribbed dome
    c.fillStyle = ZG; c.beginPath(); c.ellipse(KX, lt - 2, lw * 0.32, 18, 0, Math.PI, 0); c.fill();
    c.strokeStyle = ZG_D; c.lineWidth = 1; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(KX + k * 4, lt - 2); c.quadraticCurveTo(KX + k * 2.6, lt - 14, KX, lt - 20); } c.stroke();
  }, { t: 7.5, d: 0.6, reveal: 'rise' });
  p.group('town', { x: KX - 16, y: lt - 100, w: 32, h: 84 }, (c) => {
    c.strokeStyle = '#8a6a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(KX, lt - 18); c.lineTo(KX, lt - 92); c.stroke();
    for (const [y, rad] of [[lt - 34, 9], [lt - 54, 7.5], [lt - 71, 6], [lt - 85, 4]]) {
      c.fillStyle = '#d9a83a'; c.beginPath(); c.arc(KX, y, rad, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f6db8a'; c.beginPath(); c.arc(KX + rad * 0.3, y - rad * 0.3, rad * 0.35, 0, Math.PI * 2); c.fill();
    }
  }, { t: 8.0, d: 0.5, reveal: 'pop' });
}

// the ramparts: red pisé walls with square towers and stepped merlons, storks' nests on top
const RY = 1230; // the wall walk
function ramparts(p, r) {
  const x0 = CX - R - 10, x1 = CX + R + 10;
  p.group('town', { x: x0, y: RY - 30, w: x1 - x0, h: 120 }, (c) => {
    c.fillStyle = PISE_D; c.fillRect(x0, RY, x1 - x0, 90);
    c.fillStyle = mix(PISE_D, PISE, 0.4); c.fillRect(x0, RY, x1 - x0, 6);
    // the putlog holes left by the shuttering, in rows
    c.fillStyle = 'rgba(70,30,18,.6)';
    for (let y = RY + 16; y < RY + 90; y += 18) for (let x = x0 + ((y / 18) % 2) * 15; x < x1; x += 30) c.fillRect(x, y, 3, 2.4);
    // merlons
    c.fillStyle = PISE_D;
    for (let x = x0; x < x1; x += 18) poly(c, [[x + 2, RY], [x + 2, RY - 8], [x + 5, RY - 8], [x + 5, RY - 13], [x + 9, RY - 17], [x + 13, RY - 13], [x + 13, RY - 8], [x + 16, RY - 8], [x + 16, RY]]), c.fill();
  }, { t: 6.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the towers, and a gate
  const towers = [x0 + 60, x0 + 300, x0 + 520, x0 + 780, x0 + 960];
  towers.forEach((tx, i) => {
    p.group('town', { x: tx - 40, y: RY - 112, w: 80, h: 212 }, (c) => {
      c.fillStyle = PISE_D; c.fillRect(tx - 28, RY - 40, 56, 140);
      c.fillStyle = mix(PISE_D, '#5a2a18', 0.3); c.fillRect(tx - 28, RY - 40, 12, 140);
      c.fillStyle = PISE_D;
      for (let k = 0; k < 4; k++) { const x = tx - 26 + k * 15; poly(c, [[x, RY - 40], [x, RY - 48], [x + 3, RY - 48], [x + 3, RY - 53], [x + 6.5, RY - 57], [x + 10, RY - 53], [x + 10, RY - 48], [x + 13, RY - 48], [x + 13, RY - 40]]); c.fill(); }
      c.fillStyle = 'rgba(70,30,18,.6)';
      for (let y = RY - 24; y < RY + 90; y += 18) for (let x = tx - 20; x < tx + 24; x += 14) c.fillRect(x, y, 3, 2.4);
      // a storks' nest on every other tower
      if (i % 2 === 0) {
        c.fillStyle = '#6e5232'; c.beginPath(); c.ellipse(tx + 4, RY - 58, 24, 9, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#8b6c44'; c.lineWidth = 1; c.beginPath(); for (let k = -20; k < 24; k += 5) { c.moveTo(tx + k, RY - 52); c.lineTo(tx + k + 7, RY - 64); } c.stroke();
        stork(c, tx + 6, RY - 64, 0.9);
      }
    }, { t: 6.5 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
  // the gate: a horseshoe arch in the wall, like the one we look through
  const gx = x0 + 650;
  p.group('town', { x: gx - 50, y: RY - 60, w: 100, h: 160 }, (c) => {
    c.fillStyle = PISE_D; c.fillRect(gx - 44, RY - 30, 88, 130);
    c.fillStyle = PISE_L; c.beginPath(); c.moveTo(gx - 24, RY + 90); c.lineTo(gx - 24, RY + 30); c.arc(gx, RY + 22, 26, Math.PI * 0.78, Math.PI * 0.22, false); c.lineTo(gx + 24, RY + 90); c.fill();
    c.fillStyle = '#4a2416'; c.beginPath(); c.moveTo(gx - 18, RY + 90); c.lineTo(gx - 18, RY + 32); c.arc(gx, RY + 24, 20, Math.PI * 0.75, Math.PI * 0.25, false); c.lineTo(gx + 18, RY + 90); c.fill();
  }, { t: 7.0, d: 0.5, reveal: 'rise' });
}
// a white stork standing, black flight feathers, red bill and legs
function stork(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#fbf7ee'; c.beginPath(); c.ellipse(0, -14, 9, 6, -0.3, 0, Math.PI * 2); c.fill();
  c.fillStyle = ZK; c.beginPath(); c.ellipse(4, -12, 8, 3.6, -0.3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fbf7ee'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, -17); c.quadraticCurveTo(-9, -26, -7, -32); c.stroke();
  c.fillStyle = '#fbf7ee'; c.beginPath(); c.arc(-7, -33, 3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#d9452f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-9, -33); c.lineTo(-19, -29); c.stroke();
  c.beginPath(); c.moveTo(-1, -9); c.lineTo(-2, 4); c.moveTo(2, -9); c.lineTo(3, 4); c.stroke();
  c.restore();
}

// date palms: ringed trunks, a crown of arching fronds, dates hanging
function fronds(seed, s) {
  const rr = rng(seed), n = 15, fr = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k / (n - 1) - 0.5) * Math.PI * 1.9 + rr.range(-0.1, 0.1);
    fr.push([a, rr.range(0.85, 1.1) * 72 * s, rr.chance(0.35) ? PALM_D : rr.chance(0.5) ? PALM : PALM_L]);
  }
  fr.sort((A, B) => (A[2] === PALM_D ? -1 : 1) - (B[2] === PALM_D ? -1 : 1));
  return fr;
}
function palm(c, x, y, h, s, lean, fr) {
  const tx = x + lean * h, ty = y - h;
  // the trunk, a gentle curve, its leaf scars in a crosshatch
  const w0 = 14 * s, w1 = 9 * s;
  c.fillStyle = TRUNK;
  c.beginPath(); c.moveTo(x - w0 / 2, y); c.quadraticCurveTo(x + lean * h * 0.3 - w0 / 2, y - h * 0.5, tx - w1 / 2, ty); c.lineTo(tx + w1 / 2, ty); c.quadraticCurveTo(x + lean * h * 0.3 + w0 / 2, y - h * 0.5, x + w0 / 2, y); c.closePath(); c.fill();
  c.strokeStyle = TRUNK_D; c.lineWidth = 1.2 * s; c.beginPath();
  for (let k = 0; k < h / (6 * s); k++) {
    const f = k / (h / (6 * s)), cx = lerp(x, tx, f) + lean * h * 0.3 * 4 * f * (1 - f) * 0.5, cy = y - f * h, w = lerp(w0, w1, f) / 2;
    c.moveTo(cx - w, cy); c.lineTo(cx + w * 0.2, cy - 4 * s); c.moveTo(cx + w, cy - 1 * s); c.lineTo(cx - w * 0.2, cy - 5 * s);
  }
  c.stroke();
  // the fronds: arching, drooping more the lower they sit
  for (const [a, L, col] of fr) {
    const droop = Math.abs(Math.cos(a)) * 0.9 + 0.2;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + droop * L * 0.5;
    const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.6 - L * 0.12;
    // the leaflets, as a fan of short strokes either side of the rib
    c.strokeStyle = col; c.lineWidth = 2.2 * s; c.lineCap = 'round';
    c.beginPath();
    for (let k = 2; k <= 12; k++) {
      const f = k / 12, bx = (1 - f) ** 2 * tx + 2 * (1 - f) * f * mx + f * f * ex, by = (1 - f) ** 2 * ty + 2 * (1 - f) * f * my + f * f * ey;
      const ll = (1 - f * 0.6) * 16 * s;
      c.moveTo(bx, by); c.lineTo(bx + ll * 0.5, by + ll);
      c.moveTo(bx, by); c.lineTo(bx - ll * 0.5, by + ll);
    }
    c.stroke();
    c.lineWidth = 2 * s; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
  }
  // dates, in orange bunches under the crown
  c.fillStyle = '#d9822b';
  for (const dx of [-8, 7]) { c.beginPath(); c.ellipse(tx + dx * s, ty + 12 * s, 5 * s, 9 * s, dx * 0.03, 0, Math.PI * 2); c.fill(); }
}
function palms(p, r) {
  // [x, foot, height, scale, lean]
  const list = [[330, 1300, 330, 1.0, -0.12], [440, 1290, 250, 0.85, 0.06], [780, 1290, 280, 0.9, 0.1], [880, 1300, 360, 1.05, -0.08],
    [1000, 1290, 230, 0.8, 0.12], [1150, 1300, 320, 1.0, -0.05], [1260, 1300, 270, 0.9, -0.15], [690, 1280, 200, 0.7, -0.1]];
  list.forEach(([x, y, h, s, lean], i) => {
    const box = { x: x + lean * h - 110 * s, y: y - h - 90 * s, w: 220 * s + Math.abs(lean * h) + 20, h: h + 100 * s };
    box.x = Math.min(box.x, x - 20);
    const fr = fronds(50 + i, s);
    p.group('palms', box, (c) => palm(c, x, y, h, s, lean, fr), { t: 7.6 + i * 0.16, d: 0.7, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ the garden
// the Jardin Majorelle's blue: a long basin with a yellow rim, pots and cacti, bougainvillea
function garden(p, r) {
  const x0 = CX - JW - 10, x1 = CX + JW + 10;
  // the cobalt wall behind the basin, then the basin and its water
  p.group('garden', { x: x0, y: GROUND - 20, w: x1 - x0, h: SILL - GROUND + 30 }, (c) => {
    c.fillStyle = MAJ; c.fillRect(x0, GROUND - 6, x1 - x0, SILL - GROUND + 10);
    c.fillStyle = MAJ_D; c.fillRect(x0, GROUND + 52, x1 - x0, 8);
    // the wall's coping in lemon
    c.fillStyle = LEMON; c.fillRect(x0, GROUND - 12, x1 - x0, 8);
    c.fillStyle = LEMON_D; c.fillRect(x0, GROUND - 5, x1 - x0, 2);
    // a row of small openwork arches along the wall
    c.fillStyle = MAJ_D;
    for (let x = x0 + 30; x < x1 - 20; x += 46) { c.beginPath(); c.moveTo(x, GROUND + 46); c.lineTo(x, GROUND + 18); c.arc(x + 10, GROUND + 18, 10, Math.PI, 0); c.lineTo(x + 20, GROUND + 46); c.fill(); }
    // the terrace: blue and white tiles toward us
    c.fillStyle = '#e9e3f3'; c.fillRect(x0, GROUND + 60, x1 - x0, SILL - GROUND - 60);
    c.fillStyle = MAJ_L;
    for (let y = GROUND + 64, k = 0; y < SILL; y += 18, k++) for (let x = x0 + (k % 2) * 18; x < x1; x += 36) poly(c, [[x, y + 9], [x + 9, y], [x + 18, y + 9], [x + 9, y + 18]]), c.fill();
  }, { t: 8.6, d: 0.8, reveal: 'rise', ease: 'inOut' });
  // the pool, long and narrow, its rim yellow
  const py0 = 1380, py1 = 1436, pa = CX - 250, pb = CX + 250;
  const rp = rng(21), pads = [];
  for (let k = 0; k < 14; k++) pads.push([pa + 20 + rp() * (pb - pa - 40), py0 + 10 + rp() * (py1 - py0 - 20)]);
  p.group('garden', { x: pa - 30, y: py0 - 20, w: pb - pa + 60, h: py1 - py0 + 40 }, (c) => {
    c.fillStyle = LEMON; c.beginPath(); c.roundRect(pa - 14, py0 - 12, pb - pa + 28, py1 - py0 + 24, 10); c.fill();
    c.fillStyle = MAJ; c.beginPath(); c.roundRect(pa - 4, py0 - 3, pb - pa + 8, py1 - py0 + 6, 6); c.fill();
    const g = c.createLinearGradient(0, py0, 0, py1);
    g.addColorStop(0, '#5fb6b4'); g.addColorStop(1, POOL);
    c.fillStyle = g; c.fillRect(pa + 4, py0 + 4, pb - pa - 8, py1 - py0 - 8);
    // lily pads and a flower or two
    for (let k = 0; k < 14; k++) {
      const [x, y] = pads[k];
      c.fillStyle = k % 3 ? '#4f8f4a' : '#6aa85a';
      c.beginPath(); c.ellipse(x, y, 10, 4, 0, 0.3, Math.PI * 2 - 0.1); c.lineTo(x, y); c.fill();
      if (k % 5 === 0) { c.fillStyle = '#f6c8dc'; c.beginPath(); c.arc(x + 2, y - 2, 3, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 9.0, d: 0.6, reveal: 'iris' });
  // pots on the terrace: tall jars in lemon, cobalt and green, with cacti and agaves
  const pots = [[CX - 360, 1420, 1.3, LEMON, 'saguaro'], [CX - 300, 1440, 0.9, MAJ_L, 'agave'], [CX + 320, 1430, 1.2, LEMON, 'barrel'],
    [CX + 380, 1446, 1.0, ZG, 'paddle'], [CX - 410, 1460, 0.8, ZG, 'barrel'], [CX + 270, 1456, 0.8, MAJ_L, 'agave']];
  pots.forEach(([x, y, s, col, plant], i) => {
    p.group('garden', { x: x - 70 * s, y: y - 190 * s, w: 140 * s, h: 200 * s }, (c) => {
      plantDraw(c, x, y - 52 * s, s, plant);
      jar(c, x, y, s, col);
    }, { t: 9.3 + i * 0.12, d: 0.5, reveal: 'drop', dy: 30 });
  });
  // bougainvillea climbing the left jamb and spilling over, and up the right
  for (const side of [-1, 1]) {
    const rr = rng(side > 0 ? 9 : 8), fl = [];
    const bx = CX + side * (JW - 10);
    for (let k = 0; k < 160; k++) {
      const t = rr() ** 0.8;
      const y = SILL - t * 640, x = bx - side * (rr() ** 2) * (40 + (1 - t) * 30) - side * Math.sin(t * 9) * 12;
      fl.push([x, y, rr.range(4, 9), rr.pick([BOUG, BOUG, BOUG_L, '#a8235b']), rr() < 0.3]);
    }
    p.group('garden', boxOf(fl.map(([x, y]) => [x, y]), 20), (c) => {
      // the woody stems
      c.strokeStyle = '#6a4a30'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx, SILL);
      for (let k = 0; k <= 20; k++) { const t = k / 20; c.lineTo(bx - side * Math.sin(t * 9) * 12, SILL - t * 640); }
      c.stroke();
      for (const [x, y, s, col, leaf] of fl) {
        if (leaf) { c.fillStyle = PALM; c.beginPath(); c.ellipse(x, y, s * 0.9, s * 0.45, 0.6, 0, Math.PI * 2); c.fill(); continue; }
        c.fillStyle = col;
        for (let k = 0; k < 3; k++) { const a = k * 2.1; c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4, s * 0.55, s * 0.4, a, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#fbe9b0'; c.beginPath(); c.arc(x, y, 1.2, 0, Math.PI * 2); c.fill();
      }
    }, { t: 9.8 + (side > 0 ? 0.3 : 0), d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
}
function jar(c, x, y, s, col) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 22 * s, y - 52 * s); c.bezierCurveTo(x - 40 * s, y - 30 * s, x - 26 * s, y, x - 14 * s, y); c.lineTo(x + 14 * s, y);
  c.bezierCurveTo(x + 26 * s, y, x + 40 * s, y - 30 * s, x + 22 * s, y - 52 * s); c.closePath(); c.fill();
  c.fillStyle = mix(col, '#000', 0.22); c.beginPath(); c.moveTo(x + 6 * s, y - 52 * s); c.bezierCurveTo(x + 30 * s, y - 34 * s, x + 22 * s, y - 4 * s, x + 14 * s, y); c.lineTo(x + 6 * s, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - 14 * s, y - 34 * s, 4 * s, 10 * s, 0.3, 0, Math.PI * 2); c.fill();
  c.fillStyle = mix(col, '#000', 0.12); c.fillRect(x - 25 * s, y - 58 * s, 50 * s, 7 * s);
}
function plantDraw(c, x, y, s, kind) {
  c.lineCap = 'round';
  if (kind === 'saguaro') {
    c.strokeStyle = CACTUS; c.lineWidth = 16 * s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 120 * s); c.stroke();
    c.lineWidth = 11 * s; c.beginPath(); c.moveTo(x, y - 50 * s); c.lineTo(x - 22 * s, y - 50 * s); c.lineTo(x - 22 * s, y - 90 * s);
    c.moveTo(x, y - 70 * s); c.lineTo(x + 20 * s, y - 70 * s); c.lineTo(x + 20 * s, y - 104 * s); c.stroke();
    c.strokeStyle = CACTUS_D; c.lineWidth = 1.2 * s; c.beginPath();
    for (const dx of [-3, 3]) { c.moveTo(x + dx * s, y); c.lineTo(x + dx * s, y - 124 * s); }
    c.stroke();
  } else if (kind === 'barrel') {
    c.fillStyle = CACTUS; c.beginPath(); c.ellipse(x, y - 18 * s, 22 * s, 24 * s, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = CACTUS_D; c.lineWidth = 1.4 * s; c.beginPath();
    for (let k = -2; k <= 2; k++) { c.moveTo(x + k * 8 * s, y + 4 * s); c.quadraticCurveTo(x + k * 11 * s, y - 18 * s, x + k * 4 * s, y - 40 * s); }
    c.stroke();
    c.fillStyle = LEMON; for (const dx of [-6, 2, 9]) { c.beginPath(); c.arc(x + dx * s, y - 40 * s, 3.4 * s, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'agave') {
    c.fillStyle = '#7fa79a';
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k / 8 - 0.5) * 2.6, L = (k % 2 ? 50 : 66) * s;
      c.beginPath(); c.moveTo(x - 5 * s, y); c.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 - 6 * s, x + Math.cos(a) * L, y + Math.sin(a) * L); c.lineTo(x + 5 * s, y); c.fill();
    }
  } else {
    // prickly pear: flat paddles
    const pads = [[0, -24, 16, 22, 0], [-18, -54, 13, 18, -0.4], [16, -58, 13, 18, 0.35], [-2, -84, 11, 15, 0.1]];
    for (const [dx, dy, a, b, rot] of pads) {
      c.fillStyle = CACTUS; c.beginPath(); c.ellipse(x + dx * s, y + dy * s, a * s, b * s, rot, 0, Math.PI * 2); c.fill();
      c.fillStyle = CACTUS_D; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + (dx - 4 + k * 4) * s, y + (dy - 2 + (k % 2) * 6) * s, 1, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = BOUG_L; c.beginPath(); c.arc(x + 4 * s, y - 100 * s, 4 * s, 0, Math.PI * 2); c.fill();
  }
}

// ================================================================ life
function life(p, r) {
  // storks soaring over the ramparts in slow circles
  const st = [[700, 620, 160, 0.18, 0, 1.2], [960, 760, 110, -0.22, 2, 0.95], [480, 820, 90, 0.26, 4, 0.8]];
  p.live('birds', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, rad, w, ph, s] of st) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a) * rad * 0.35;
        const dir = Math.sign(-Math.sin(a) * w) || 1;
        flyingStork(c, x, y, s, dir, Math.sin(time * 1.6 + ph));
      }
    },
  });
  // swifts darting under the arch
  const sw = [];
  for (let i = 0; i < 9; i++) sw.push([r.range(400, 1200), r.range(380, 900), r.range(60, 200), r.range(0.5, 1.1) * (r.chance(0.5) ? 1 : -1), r() * 7]);
  p.live('birds', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#2a2230';
      for (const [x0, y0, rad, w, ph] of sw) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a * 1.7) * rad * 0.3;
        const fl = 0.6 + 0.4 * Math.sin(time * 14 + ph * 5);
        c.beginPath(); c.moveTo(x - 9, y - 3 * fl); c.quadraticCurveTo(x - 3, y - 1, x, y); c.quadraticCurveTo(x + 3, y - 1, x + 9, y - 3 * fl); c.quadraticCurveTo(x + 3, y + 1, x, y + 2); c.quadraticCurveTo(x - 3, y + 1, x - 9, y - 3 * fl); c.fill();
      }
    },
  });
  // the lantern in the crown of the arch
  p.live('lamp', {
    t: 10.0, d: 1.0, reveal: 'drop', dy: 50, box: { x: CX - 70, y: AC - R, w: 140, h: 290 },
    draw: (c, time) => lantern(c, Math.sin(time * 0.7) * 0.035),
  });
  // the water in the basin: a slow shimmer of light
  const sh = [];
  for (let i = 0; i < 26; i++) sh.push([r.range(CX - 240, CX + 240), r.range(1388, 1428), r() * 6, r.range(8, 22)]);
  p.live('garden', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#e4fbf6';
      for (const [x, y, ph, L] of sh) {
        const a = Math.sin(time * 1.3 + ph * 2);
        if (a < 0.2) continue;
        c.globalAlpha = a * 0.8; c.fillRect(x - L / 2 + Math.sin(time * 0.5 + ph) * 4, y, L, 1.6);
      }
      c.globalAlpha = 1;
    },
  });
}
// a pierced brass lantern hanging from the crown of the arch, turning a little on its chain
function lantern(c, sway) {
  const top = AC - R - 4, len = 118;
  c.save(); c.translate(CX, top); c.rotate(sway);
  // the chain
  c.strokeStyle = '#8a6a2a'; c.lineWidth = 1.6;
  for (let y = 0; y < len; y += 9) { c.beginPath(); c.ellipse(0, y + 4, 2.4, 4.4, (y / 9) % 2 ? 0 : Math.PI / 2, 0, Math.PI * 2); c.stroke(); }
  c.translate(0, len); c.scale(1.3, 1.3);
  // the cap: a small dome with a ring
  c.fillStyle = '#b8872e'; c.beginPath(); c.ellipse(0, 10, 22, 14, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#e2b04a'; c.beginPath(); c.arc(0, -2, 4, 0, Math.PI * 2); c.fill();
  c.fillRect(-26, 8, 52, 6);
  // the body: six panes of amber and green glass behind pierced brass
  const body = [[-24, 14], [24, 14], [30, 46], [22, 92], [-22, 92], [-30, 46]];
  c.fillStyle = '#c8952f'; poly(c, body); c.fill();
  const panes = [[-18, 20, '#f2b13d'], [-6, 20, '#3f9a6a'], [6, 20, '#f2b13d']];
  for (const [x, y, col] of panes) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + 60); c.lineTo(x, y + 12); c.arc(x + 6, y + 12, 6, Math.PI, 0); c.lineTo(x + 12, y + 60); c.fill(); }
  // the piercings, a pattern of little holes catching the light
  c.fillStyle = '#7a5418';
  for (let y = 22; y < 88; y += 7) for (let x = -24; x <= 24; x += 7) if (Math.abs(x) + Math.abs(y - 52) * 0.4 < 30 && ((x + y) / 7) % 2 === 0) c.fillRect(x - 1, y - 1, 2, 2);
  c.fillStyle = 'rgba(255,240,200,.35)'; c.fillRect(-20, 16, 4, 70);
  c.strokeStyle = '#6a4614'; c.lineWidth = 1.2; poly(c, body); c.stroke();
  // the foot and its drop
  c.fillStyle = '#b8872e'; c.beginPath(); c.moveTo(-22, 92); c.lineTo(22, 92); c.lineTo(8, 104); c.lineTo(-8, 104); c.closePath(); c.fill();
  c.fillStyle = '#e2b04a'; c.beginPath(); c.arc(0, 110, 5, 0, Math.PI * 2); c.fill();
  c.restore();
}
function flyingStork(c, x, y, s, dir, flap) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  // seen from the side, heading left: the far wing, the body, then the near wing
  const wing = (len, up, back) => {
    const tx = -2 + back, ty = -len * up;
    c.fillStyle = '#fbf7ee';
    c.beginPath(); c.moveTo(-8, -1); c.quadraticCurveTo(-10, ty * 0.5, tx - 6, ty); c.lineTo(tx + 12, ty + 3); c.quadraticCurveTo(10, ty * 0.45, 8, 0); c.closePath(); c.fill();
    // the black flight feathers along the trailing edge and the tip
    c.fillStyle = ZK;
    c.beginPath(); c.moveTo(tx - 6, ty); c.lineTo(tx + 12, ty + 3); c.lineTo(7, ty * 0.35); c.lineTo(3, ty * 0.5); c.closePath(); c.fill();
  };
  const up = 0.55 + flap * 0.45;
  wing(22, up * 0.8, 4);
  c.fillStyle = '#fbf7ee'; c.beginPath(); c.ellipse(0, 0, 15, 4.5, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(-21, -1, 9, 2.4, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#d9452f'; c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-29, -1); c.lineTo(-41, 1); c.moveTo(13, 1); c.lineTo(32, 4); c.stroke();
  wing(30, up, 0);
  c.restore();
}

// ================================================================ the title
function title(p) {
  const cx = W / 2;
  // the panel: polished plaster with a carved double border
  p.group('title', { x: TX0 - 4, y: TY0 - 4, w: TX1 - TX0 + 8, h: TY1 - TY0 + 8 }, (c) => {
    c.fillStyle = STUCCO_L; c.fillRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
    c.strokeStyle = STUCCO_D; c.lineWidth = 3; c.strokeRect(TX0 + 16, TY0 + 16, TX1 - TX0 - 32, TY1 - TY0 - 32);
    c.strokeStyle = ZG; c.lineWidth = 1.4; c.strokeRect(TX0 + 24, TY0 + 24, TX1 - TX0 - 48, TY1 - TY0 - 48);
    // small carved rosettes in its corners
    for (const [x, y] of [[TX0 + 24, TY0 + 24], [TX1 - 24, TY0 + 24], [TX0 + 24, TY1 - 24], [TX1 - 24, TY1 - 24]]) {
      c.fillStyle = STUCCO_D; c.beginPath(); c.arc(x + 1, y + 1.5, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = ZO; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = ZG_D; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }
  }, { t: 3.2, d: 0.8, reveal: 'iris', ease: 'inOut' });
  // مراكش, set whole so its letters join, wiped in from the right as it is read
  const ay = 1766;
  p.mark('title', {
    t: 10.7, d: 1.4, reveal: 'wipeL', ease: 'inOut', box: { x: TX0 + 30, y: TY0 + 20, w: TX1 - TX0 - 60, h: 250 },
    draw: (c) => {
      c.font = '700 196px "Aref Ruqaa", serif'; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = ZO; c.fillText('مراكش', cx + 5, ay + 5);
      c.fillStyle = ZG_D; c.fillText('مراكش', cx, ay);
      c.direction = 'ltr';
    },
  });
  p.type('title', 'MARRAKECH', cx, 1856, {
    family: '"Aref Ruqaa", serif', size: 60, color: ZR, align: 'center', track: 0.32, t: 11.9, gap: 0.09, d: 0.6,
  });
  // eight-pointed stars either side of the name
  for (const s of [-1, 1]) {
    const x = cx + s * 470, y = 1700;
    p.group('title', { x: x - 60, y: y - 60, w: 120, h: 120 }, (c) => {
      for (const [rad, col] of [[52, ZB], [40, ZW], [30, ZG], [14, ZO]]) {
        c.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? rad * 0.765 : rad; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = ZK; c.lineWidth = 1.2; c.stroke();
      }
    }, { t: 12.6 + (s > 0 ? 0.2 : 0), d: 0.6, reveal: 'pop' });
  }
}
