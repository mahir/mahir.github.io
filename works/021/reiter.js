// Clifford Reiter's snow crystal automaton (2005), on a grid of hexagons.
//
// Every cell holds an amount of water. A cell at 1 or more is ice. Ice and the cells
// touching it are "receptive": they keep what they hold and take in `gamma` more each
// step. Everywhere else the water is vapor and spreads to its six neighbors, at a rate set
// by `alpha`. Far from the crystal the air holds `beta`. That is the whole model: two
// numbers, beta and gamma, decide between a plate and a star.
//
// A snow crystal has six mirror lines, so only one twelfth of the grid is kept and worked
// on; a neighbor that falls outside that wedge is found by folding it back in.
//
// No DOM in here: the page runs it in a worker, and the tests run it in Node.
(function (root) {
  'use strict';

  // The twelve symmetries of a hexagon, on cube coordinates (x + y + z = 0): fold any cell
  // into the wedge x >= y >= 0 (so z = -x - y is the most negative).
  function fold(q, r) {
    let x = q, z = r, y = -q - r;
    const a = [Math.abs(x), Math.abs(y), Math.abs(z)].sort((m, n) => n - m); // a[0] = a[1] + a[2]
    return [a[1], a[2]]; // the two smaller ones: fx >= fy >= 0
  }

  function Grid(R) {
    // wedge cells: fx >= fy >= 0, fx + fy <= R (hex distance of the cell is fx + fy)
    const index = new Map();
    const fx = [], fy = [];
    for (let d = 0; d <= R; d++) for (let b = 0; b <= d >> 1; b++) { index.set((d - b) * 4096 + b, fx.length); fx.push(d - b); fy.push(b); }
    const n = fx.length;
    const nb = new Int32Array(n * 6);
    const edge = new Uint8Array(n);
    const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
    for (let i = 0; i < n; i++) {
      // a cell of the wedge in axial coordinates: cube (x, y, z) = (fx, fy, -fx-fy) -> q = x, r = z
      const q = fx[i], r = -fx[i] - fy[i];
      for (let k = 0; k < 6; k++) {
        const [a, b] = fold(q + DIRS[k][0], r + DIRS[k][1]);
        const j = index.get(a * 4096 + b);
        if (j === undefined) { nb[i * 6 + k] = i; edge[i] = 1; } else nb[i * 6 + k] = j;
      }
      if (fx[i] + fy[i] >= R) edge[i] = 1;
    }
    return { R, n, nb, edge, fx, fy, index, fold };
  }

  // A crystal being grown. `grid` from Grid(R).
  function Crystal(grid, beta0) {
    const { n, nb, edge } = grid;
    const s = new Float32Array(n).fill(beta0);
    const u = new Float32Array(n);
    const ice = new Uint8Array(n);
    const rec = new Uint8Array(n);
    const born = new Float32Array(n).fill(-1); // when each cell froze, in whatever clock the caller keeps
    let beta = beta0, tip = 0, count = 0, steps = 0;
    s[0] = 1; ice[0] = 1; born[0] = 0; count = 1;

    function mark() {
      for (let i = 0; i < n; i++) {
        if (ice[i]) { rec[i] = 1; continue; }
        const o = i * 6;
        rec[i] = (ice[nb[o]] | ice[nb[o + 1]] | ice[nb[o + 2]] | ice[nb[o + 3]] | ice[nb[o + 4]] | ice[nb[o + 5]]);
      }
    }
    mark();

    // The air far away changes as the crystal falls: scale the vapor that is not yet held
    // by the crystal, so the new air arrives at once and not after a slow spread inward.
    function air(b) {
      if (b === beta) return;
      const k = b / beta;
      for (let i = 0; i < n; i++) if (!rec[i]) s[i] *= k;
      beta = b;
    }

    function step(alpha, gamma, clock) {
      const h = alpha / 12;
      for (let i = 0; i < n; i++) u[i] = rec[i] ? 0 : s[i];
      let froze = 0;
      for (let i = 0; i < n; i++) {
        if (edge[i]) { if (!rec[i]) s[i] = beta; continue; }
        const o = i * 6;
        const sum = u[nb[o]] + u[nb[o + 1]] + u[nb[o + 2]] + u[nb[o + 3]] + u[nb[o + 4]] + u[nb[o + 5]];
        const un = u[i] + h * (sum - 6 * u[i]);
        const v = rec[i] ? s[i] + gamma : 0;
        const t = un + v;
        s[i] = t;
        if (!ice[i] && t >= 1) { ice[i] = 1; born[i] = clock; froze++; const d = grid.fx[i] + grid.fy[i]; if (d > tip) tip = d; }
      }
      if (froze) { count += froze; mark(); }
      steps++;
      return froze;
    }

    return { s, ice, born, step, air, get tip() { return tip; }, get count() { return count; }, get steps() { return steps; }, get beta() { return beta; } };
  }

  const api = { Grid, Crystal, fold };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Reiter = api;
})(typeof self !== 'undefined' ? self : this);
