// The landmarks as toys: simple solids, a little larger than life so they read from above, each with the few
// features that make it itself (Hagia Sophia's flattened dome and buttresses, the Blue Mosque's six minarets,
// Galata Tower's cone). Metres, origin at the ground under the landmark's centre, +x east, -z north.

import { toWorld } from './geo.js';

export const PALETTE = {
  water: 0x2a8c99,
  roofs: [0xdd6a44, 0xc9603c, 0xe8845a, 0xb8714a],
  red: 0xc1381e,
  trees: [0x5caa3b, 0x546647, 0x7d9f45],
  walls: [0xf6ebdc, 0xeee6d6, 0xebd3a3],
  stone: 0xece2cf,
  greyStone: 0xdedad2,
  hagia: 0xd7a07a,
  white: 0xf8f4ec,
  lead: 0x6a747c,
  leadLight: 0x8b9196,
  road: 0xa3aaaa,
  rock: 0x8a7f72,
  slate: 0x5c5f64,
  sand: 0xd8c8a8,
};

export function buildLandmark(THREE, landmark) {
  const k = kit(THREE);
  const g = new THREE.Group();
  const make = MODELS[landmark.id];
  make(k, g, landmark);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  g.userData.height = box.max.y;
  if (!g.userData.footprint) g.userData.footprint = { w: box.max.x - box.min.x, d: box.max.z - box.min.z, angle: 0 };
  return g;
}

// A sticker-book outline: a pale plate on the ground, a dashed border, and a faint ghost of the building.
export function buildOutline(THREE, landmark, model) {
  const { w, d, angle } = model.userData.footprint;
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.y = angle;
  g.add(inner);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d),
    new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: 0.55, depthWrite: false }));
  plate.position.y = 7;
  inner.add(plate);
  const hw = w / 2, hd = d / 2;
  const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]].map(([x, z]) => new THREE.Vector3(x, 8, z));
  const border = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: 0x6b5444, dashSize: Math.max(w, d) / 24, gapSize: Math.max(w, d) / 36, transparent: true, opacity: 0.85 }));
  border.computeLineDistances();
  inner.add(border);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false });
  const ghost = model.clone(true);
  ghost.traverse((o) => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; } });
  g.add(ghost);
  g.userData = { plate, ghostMat, border };
  return g;
}

// ---------- the kit ----------
function kit(THREE) {
  const mats = new Map();
  const mat = (color) => {
    if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 }));
    return mats.get(color);
  };
  const mesh = (geo, color, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); return m; };
  const k = {
    THREE, mat,
    // a box standing on y
    box: (w, h, d, color, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), color, x, y, z),
    cyl: (r, h, color, x = 0, y = 0, z = 0, seg = 20, rTop = r) => mesh(new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0), color, x, y, z),
    cone: (r, h, color, x = 0, y = 0, z = 0, seg = 20) => mesh(new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0), color, x, y, z),
    // a dome sitting on y, flattened by squash
    dome: (r, color, x = 0, y = 0, z = 0, squash = 1) => {
      const m = mesh(new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), color, x, y, z);
      m.scale.y = squash;
      return m;
    },
    // half a dome against a wall, opening toward +x rotated by `turn`
    halfDome: (r, color, x, y, z, turn) => {
      const m = mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI, 0, Math.PI / 2), color, x, y, z);
      m.rotation.y = turn;
      return m;
    },
    minaret: (h, r, x, z, base = 0, balconies = 2) => {
      const g = new THREE.Group();
      g.position.set(x, base, z);
      const shaft = h * 0.84;
      g.add(k.cyl(r, shaft, PALETTE.stone, 0, 0, 0, 12, r * 0.85));
      for (let i = 0; i < balconies; i++) g.add(k.cyl(r * 1.6, r * 0.6, PALETTE.stone, 0, shaft * (0.58 + i * 0.16), 0, 12));
      g.add(k.cone(r * 1.05, h - shaft, PALETTE.lead, 0, shaft, 0, 12));
      return g;
    },
    trees: (g, spots, r = 14) => spots.forEach(([x, z], i) => g.add(mesh(new THREE.IcosahedronGeometry(r * (0.8 + 0.4 * ((i * 37) % 10) / 10), 0), PALETTE.trees[i % 3], x, r + 6, z))),
  };
  return k;
}

// the big mosque recipe: a block, a drum, a dome, half-domes and small domes round it
function mosque(k, g, { w, d, h, color, domeR, drum, halfDomes = [], small = [], squash = 0.85 }) {
  g.add(k.box(w, h, d, color));
  g.add(k.cyl(domeR * 0.98, drum, color, 0, h, 0, 24));
  g.add(k.dome(domeR, PALETTE.leadLight, 0, h + drum, 0, squash));
  for (const turn of halfDomes) {
    g.add(k.halfDome(domeR * 0.72, PALETTE.leadLight, Math.cos(turn) * domeR * 0.55, h, -Math.sin(turn) * domeR * 0.55, turn));
  }
  for (const [x, z, r] of small) g.add(k.dome(r, PALETTE.leadLight, x, h, z, 0.9));
}

const E = 0, N = Math.PI / 2, W = Math.PI, S = -Math.PI / 2;
// turns about y that lay a building along its stretch of shore, measured from land.json's coastline
const SHORE = { dolmabahce: 0.379, haydarpasa: -0.698 + Math.PI };

const MODELS = {
  'hagia-sophia'(k, g) {
    mosque(k, g, { w: 170, d: 140, h: 62, color: PALETTE.hagia, domeR: 52, drum: 22, halfDomes: [E, W], squash: 0.62,
      small: [[-70, -50, 16], [70, -50, 16], [-70, 50, 16], [70, 50, 16]] });
    for (const [x, z] of [[-60, -78], [60, -78], [-60, 78], [60, 78]]) g.add(k.box(26, 92, 18, PALETTE.hagia, x, 0, z)); // buttresses
    for (const [x, z] of [[-112, -92], [112, -92], [-112, 92], [112, 92]]) g.add(k.minaret(150, 4.5, x, z));
  },
  'blue-mosque'(k, g) {
    mosque(k, g, { w: 150, d: 150, h: 46, color: PALETTE.greyStone, domeR: 46, drum: 16, halfDomes: [E, N, W, S], squash: 0.9,
      small: [[-58, -58, 17], [58, -58, 17], [-58, 58, 17], [58, 58, 17]] });
    g.add(k.box(150, 20, 80, PALETTE.greyStone, 0, 0, -118)); // courtyard to the north
    for (let i = -2; i <= 2; i++) g.add(k.dome(9, PALETTE.leadLight, i * 28, 20, -150, 0.9));
    for (const [x, z] of [[-90, -90], [90, -90], [-90, 90], [90, 90], [-90, -160], [90, -160]]) g.add(k.minaret(190, 5, x, z, 0, 3));
  },
  suleymaniye(k, g) {
    mosque(k, g, { w: 160, d: 150, h: 48, color: PALETTE.stone, domeR: 52, drum: 18, halfDomes: [N, S], squash: 0.9,
      small: [[-66, -30, 13], [-66, 0, 13], [-66, 30, 13], [66, -30, 13], [66, 0, 13], [66, 30, 13]] });
    g.add(k.box(160, 18, 90, PALETTE.stone, 0, 0, -122));
    for (let i = -2; i <= 2; i++) g.add(k.dome(9, PALETTE.leadLight, i * 30, 18, -162, 0.9));
    for (const [x, z, h] of [[-84, -80, 200], [84, -80, 200], [-84, -168, 160], [84, -168, 160]]) g.add(k.minaret(h, 5, x, z, 0, h > 180 ? 3 : 2));
    g.add(k.box(240, 8, 230, PALETTE.sand, 0, -2, -50)); // the terrace it stands on
  },
  'yeni-cami'(k, g) {
    g.add(k.box(130, 12, 110, PALETTE.greyStone)); // the raised base, at the foot of Galata Bridge
    const top = new k.THREE.Group();
    top.position.y = 12;
    mosque(k, top, { w: 96, d: 88, h: 34, color: PALETTE.greyStone, domeR: 32, drum: 10, halfDomes: [E, N, W, S], squash: 0.9,
      small: [[-38, -36, 10], [38, -36, 10], [-38, 36, 10], [38, 36, 10]] });
    g.add(top);
    for (const [x, z] of [[-56, -48], [56, -48]]) g.add(k.minaret(130, 4, x, z, 12, 2));
  },
  topkapi(k, g) {
    const roof = PALETTE.leadLight, wall = PALETTE.stone;
    for (const [w, d, x, z] of [[320, 30, 0, -100], [320, 30, 0, 100], [30, 230, -150, 0], [30, 230, 150, 0], [30, 170, -20, 0], [120, 26, 70, 20]]) {
      g.add(k.box(w, 14, d, wall, x, 0, z));
      g.add(k.box(w - 4, 4, d - 4, roof, x, 14, z));
    }
    g.add(k.box(24, 66, 24, wall, -20, 0, -60)); // the Tower of Justice
    g.add(k.cone(20, 34, PALETTE.lead, -20, 66, -60, 4));
    g.add(k.box(40, 30, 20, wall, -150, 0, 110)); // the gate
    k.trees(g, [[-90, -40], [-70, 40], [60, -50], [90, 60], [110, -30], [40, 70], [-100, 70], [-60, -70], [100, -70], [20, -60]]);
  },
  'galata-tower'(k, g) {
    g.add(k.cyl(30, 140, 0xd9cbb0, 0, 0, 0, 24, 27));
    g.add(k.cyl(30, 14, PALETTE.slate, 0, 140, 0, 24)); // the ring of windows
    g.add(k.cyl(32, 3, PALETTE.stone, 0, 154, 0, 24));
    g.add(k.cone(31, 44, PALETTE.lead, 0, 157, 0, 24));
  },
  dolmabahce(k, g) {
    const body = new k.THREE.Group();
    body.rotation.y = SHORE.dolmabahce; // along the shore, set back 20 m from it
    const front = new k.THREE.Group();
    front.position.z = -20;
    front.add(k.box(520, 40, 90, PALETTE.white));
    front.add(k.box(110, 60, 110, PALETTE.white));
    front.add(k.box(516, 6, 86, PALETTE.leadLight, 0, 40, 0));
    front.add(k.dome(30, PALETTE.leadLight, 0, 60, 0, 0.6));
    for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) front.add(k.box(6, 34, 92, PALETTE.greyStone, i * 38, 0, 0)); // pilasters
    body.add(front);
    g.add(body);
    g.userData.footprint = { w: 520, d: 110, angle: SHORE.dolmabahce };
  },
  ortakoy(k, g) {
    g.add(k.box(62, 32, 62, PALETTE.white));
    g.add(k.cyl(24, 10, PALETTE.white, 0, 32, 0));
    g.add(k.dome(24, PALETTE.leadLight, 0, 42, 0, 0.95));
    for (const [x, z] of [[-40, 30], [40, 30]]) g.add(k.minaret(84, 3.5, x, z, 0, 1));
    g.add(k.box(110, 3, 110, PALETTE.greyStone, 0, 0, 0)); // the square on the water's edge
  },
  mihrimah(k, g) {
    mosque(k, g, { w: 92, d: 92, h: 36, color: PALETTE.stone, domeR: 38, drum: 14, squash: 0.95, small: [] });
    g.add(k.box(92, 12, 40, PALETTE.stone, 0, 0, 68)); // the portico
    for (let i = -1; i <= 1; i++) g.add(k.dome(10, PALETTE.leadLight, i * 28, 12, 68, 0.9));
    for (const [x, z] of [[-56, 48], [56, 48]]) g.add(k.minaret(122, 4, x, z, 0, 2));
  },
  haydarpasa(k, g) {
    const body = new k.THREE.Group();
    body.rotation.y = SHORE.haydarpasa; // its towers face the water, the platforms run inland
    const stone = 0xd8c4a0;
    body.add(k.box(180, 44, 44, stone));
    body.add(k.box(30, 40, 80, stone, -75, 0, -60));
    body.add(k.box(30, 40, 80, stone, 75, 0, -60));
    const roof = new k.THREE.Mesh(new k.THREE.CylinderGeometry(20, 20, 172, 3).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), k.mat(PALETTE.leadLight));
    roof.position.set(0, 52, 0);
    roof.scale.set(1, 0.5, 0.9);
    body.add(roof);
    for (const x of [-86, 86]) { body.add(k.cyl(15, 66, stone, x, 0, 18)); body.add(k.cone(17, 28, PALETTE.slate, x, 66, 18)); }
    g.add(body);
    g.userData.footprint = { w: 200, d: 130, angle: SHORE.haydarpasa };
  },
  'maidens-tower'(k, g) {
    g.add(k.cyl(46, 9, PALETTE.rock, 0, -3, 0, 14, 40));
    g.add(k.box(60, 14, 30, PALETTE.white, -8, 6, 6));
    g.add(k.cyl(11, 62, PALETTE.white, 14, 6, -6, 8));
    g.add(k.cyl(12.5, 3, PALETTE.greyStone, 14, 68, -6, 8));
    g.add(k.cyl(8, 10, PALETTE.white, 14, 71, -6, 8));
    g.add(k.cone(9.5, 28, PALETTE.lead, 14, 81, -6, 8));
  },
  'galata-bridge'(k, g, lm) {
    const { length, angle } = span(lm);
    const deck = new k.THREE.Group();
    deck.rotation.y = angle;
    deck.add(k.box(length, 6, 64, PALETTE.greyStone, 0, 3, 0)); // the lower level of shops and arches
    deck.add(k.box(length, 5, 60, PALETTE.road, 0, 13, 0));
    deck.add(k.box(length, 1, 6, PALETTE.leadLight, 0, 18, 0)); // the tram's way
    for (let x = -length / 2 + 30; x < length / 2; x += 60) deck.add(k.box(10, 5, 56, PALETTE.slate, x, -2, 0));
    for (const z of [-29, 29]) for (let x = -length / 2 + 15; x < length / 2; x += 45) deck.add(k.cyl(0.8, 12, PALETTE.slate, x, 18, z, 6));
    g.add(deck);
    g.userData.footprint = { w: length, d: 64, angle };
  },
  'bosphorus-bridge'(k, g, lm) {
    const T = k.THREE;
    const { length, angle } = span(lm);
    const b = new T.Group();
    b.rotation.y = angle;
    const half = length / 2, towerX = half * 0.68, deckY = 100, top = 260, w = 34;
    // the deck: level between the towers, sloping down to the shores
    const deckShape = [[-half, 24], [-towerX, deckY], [towerX, deckY], [half, 24]];
    for (let i = 0; i < 3; i++) {
      const [x0, y0] = deckShape[i], [x1, y1] = deckShape[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const seg = k.box(len, 6, w, PALETTE.white, 0, 0, 0);
      seg.geometry.translate(0, -3, 0);
      seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      seg.rotation.z = Math.atan2(y1 - y0, x1 - x0);
      b.add(seg);
    }
    for (const x of [-towerX, towerX]) {
      for (const z of [-w / 2, w / 2]) b.add(k.box(8, top, 8, PALETTE.white, x, 0, z));
      for (const y of [deckY + 30, top - 20]) b.add(k.box(8, 8, w + 8, PALETTE.white, x, y, 0));
    }
    for (const x of [-half, half]) b.add(k.box(30, 30, w + 10, PALETTE.greyStone, x, 0, 0)); // anchorages
    // main cables: from each anchorage up to a tower top, a sag across the middle, and down again
    const cableMat = new T.MeshStandardMaterial({ color: 0xc8c2b8, roughness: 0.6 });
    const hangerPts = [];
    for (const z of [-w / 2, w / 2]) {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const x = -half + (length * i) / 64;
        let y;
        if (x < -towerX) y = 30 + (top - 30) * ((x + half) / (half - towerX));
        else if (x > towerX) y = 30 + (top - 30) * ((half - x) / (half - towerX));
        else y = deckY + 12 + (top - deckY - 12) * (x / towerX) ** 2;
        pts.push(new T.Vector3(x, y, z));
        if (Math.abs(x) < towerX - 10 && i % 2 === 0) hangerPts.push(new T.Vector3(x, y, z), new T.Vector3(x, deckY, z));
      }
      b.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 128, 1.6, 6), cableMat));
    }
    b.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(hangerPts), new T.LineBasicMaterial({ color: 0xb8b2a8 })));
    g.add(b);
    g.userData.footprint = { w: length, d: w + 10, angle };
  },
};

// a bridge's length and its turn about y, from its two ends
function span(lm) {
  const a = toWorld(...lm.from), b = toWorld(...lm.to);
  return { length: Math.hypot(b.x - a.x, b.z - a.z), angle: -Math.atan2(b.z - a.z, b.x - a.x) };
}
