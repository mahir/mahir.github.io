// A crowd of shoppers, a catalog, and a feed between them, month by month. No DOM in here:
// the page runs it, and so do _static.js and _test.js.
//
// Taste is two numbers here, a place on a square map. Every shopper has a place (where
// their taste is now) and a home (where it started, which it is pulled back toward a
// little each month: how set they are). Every thing for sale has a place too.
//
// Each month every shopper is shown SHOWN things. The feed picks them from what it has
// learned: the average place of what the shopper favorited lately, trusted more as the
// favorites add up, plus a lean toward what many people favorited lately. Some of the
// places go to things the shopper would not otherwise be shown (explore). The shopper
// favorites at most one of them, more likely the nearer it is to their own taste, and
// their taste moves a step toward it. That is the whole loop.
//
// The sellers move too. Each month every thing drifts toward where favorites have been
// falling near it, and a thing nobody has favorited for a year is taken down and
// replaced, often by a copy of something that sells.
//
// A search world has no feed: each shopper is shown the things nearest their own taste,
// with no lean toward the popular. It is the same crowd, looking for itself.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.World = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const P = {
    shoppers: 6000,
    months: 240,       // twenty years
    shown: 6,          // things in a month's feed
    every: 12,         // a snapshot of the whole state, for going back and changing course
    grid: 24,          // cells across the map for finding things near a place
    feedCells: 40,     // patches across the map the feed ranks for
    demand: 32,        // cells across the map of where favorites fall
    reach: 0.18,       // how far the feed looks from what it has learned
    trust: 3,          // favorites before the feed fully trusts what it has learned
    learn: 0.35,       // how far each favorite moves what the feed has learned
    fade: 0.5 ** (1 / 6),   // lately: favorites count half after six months
    act: 0.8,          // the chance a shopper favorites the best thing shown, if it is right on their taste
    idle: 12,          // months a thing goes without a favorite before its seller takes it down
    stuck: 1 / 12,     // the map is cut into cells this size to say how much of it is lived in
  };

  // ------------------------------------------------------------------ chance
  function hash(...xs) {
    let h = 2166136261 >>> 0;
    for (const x of xs) { h = Math.imul(h ^ (x >>> 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.normal = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307179586 * r()); };
    r.pick = (xs) => xs[Math.floor(r() * xs.length)];
    r.range = (a0, b0) => a0 + (b0 - a0) * r();
    return r;
  }
  const clamp = (x) => (x < 0.02 ? 0.02 : x > 0.98 ? 0.98 : x);

  // ------------------------------------------------------------------ character
  // What a world has of its own: how its crowd starts out, how big its catalog is, how
  // picky and how set its people are, how fast its sellers follow, and how its feed is set.
  const LAYOUTS = ['camps', 'many', 'ring', 'band', 'scatter', 'middle'];

  function character(seed) {
    const r = rng(hash(seed, 7));
    // how often each way of starting out comes up
    const odds = { camps: 3, many: 3, ring: 1.5, band: 2, scatter: 1.5, middle: 2 };
    let roll = r() * 13, layout = LAYOUTS[0];
    for (const k of LAYOUTS) { roll -= odds[k]; if (roll <= 0) { layout = k; break; } }
    const C = {
      seed, layout,
      catalog: Math.round(r.range(180, 900)),
      picky: r.range(0.22, 0.42),       // how near a thing must be to a shopper's taste to be liked
      pull: r.range(0.02, 0.05),          // how far one favorite moves a shopper's taste
      set: r.range(0.0015, 0.01),       // how hard a taste is pulled home each month
      chase: r.range(0.002, 0.012),    // how fast sellers follow the favorites
      copy: r.range(0.3, 0.8),         // the chance a new thing copies one that sells
      feed: { explore: Math.round(r.range(0.02, 0.15) * 100) / 100, popular: Math.round(r.range(0.4, 1.6) * 10) / 10, mode: 'feed' },
      hue: r(),                        // where the colors start round the wheel
      blobs: [],
    };
    // the crowd's first places, as a few weighted blobs (scatter and band are drawn their own way)
    const n = { camps: 2 + Math.floor(r() * 3), many: 8 + Math.floor(r() * 7), ring: 0, band: 0, scatter: 0, middle: 1 }[layout];
    for (let i = 0; i < n; i++) {
      const s = layout === 'many' ? r.range(0.03, 0.07) : layout === 'middle' ? r.range(0.12, 0.18) : r.range(0.06, 0.13);
      C.blobs.push({ x: r.range(0.18, 0.82), y: r.range(0.18, 0.82), s, w: r.range(0.5, 1.5) });
    }
    if (layout === 'middle') { C.blobs[0].x = r.range(0.4, 0.6); C.blobs[0].y = r.range(0.4, 0.6); C.edge = r.range(0.2, 0.4); }
    if (layout === 'ring') {
      C.cx = r.range(0.4, 0.6); C.cy = r.range(0.4, 0.6); C.rad = r.range(0.22, 0.34); C.thick = r.range(0.025, 0.06);
      C.squash = r() < 0.5 ? 1 : r.range(0.55, 0.85); C.tilt = r() * Math.PI;   // an oval, sometimes
      C.span = r() < 0.4 ? 2 * Math.PI : r.range(1.1, 1.6) * Math.PI;           // or only part of a ring
      C.from = r() * 2 * Math.PI;
    }
    if (layout === 'scatter') { C.cx = r.range(0.4, 0.6); C.cy = r.range(0.4, 0.6); C.wide = r.range(0.55, 0.85); C.tall = r.range(0.45, 0.8); C.tilt = r() * Math.PI; }
    if (layout === 'band') { C.angle = r.range(0, Math.PI); C.thick = r.range(0.06, 0.14); C.wave = r.range(0, 0.12); }
    return C;
  }

  const WORDS = {
    camps: (C) => `a crowd in ${['', '', 'two', 'three', 'four'][C.blobs.length]} camps`,
    many: (C) => `a crowd of ${['eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'][C.blobs.length - 8]} small tastes`,
    ring: (C) => C.span < 6 ? 'a crowd along an arc, with nobody inside it' : C.squash < 1 ? 'a crowd in an oval, with nobody in the middle' : 'a crowd in a ring, with nobody in the middle',
    band: () => 'a crowd strung out along one line',
    scatter: () => 'a crowd spread evenly over a wide patch of the map',
    middle: () => 'a crowd mostly in the middle, with some at the edges',
  };
  function describe(C) {
    const size = C.catalog < 350 ? 'a small catalog' : C.catalog < 650 ? 'a middling catalog' : 'a big catalog';
    const set = C.set < 0.004 ? 'easily moved' : C.set < 0.0075 ? 'somewhat set in their ways' : 'set in their ways';
    const chase = C.chase < 0.005 ? 'slow' : C.chase < 0.009 ? 'quick' : 'very quick';
    const s = WORDS[C.layout](C);
    return `${s[0].toUpperCase()}${s.slice(1)}, ${set}, and ${size} from ${chase} sellers.`;
  }

  // where the crowd starts
  function homes(C) {
    const r = rng(hash(C.seed, 11)), N = P.shoppers, a = new Float32Array(N * 2);
    const total = C.blobs.reduce((s, b) => s + b.w, 0);
    for (let i = 0; i < N; i++) {
      let x, y, tries = 0;
      // someone drawn off the map is drawn again, so nobody piles up along an edge
      do {
      if (C.layout === 'scatter') {
        const u = (r() - 0.5) * C.wide, v = (r() - 0.5) * C.tall, c = Math.cos(C.tilt), s = Math.sin(C.tilt);
        x = C.cx + u * c - v * s; y = C.cy + u * s + v * c;
      } else if (C.layout === 'ring') {
        const t = C.from + r() * C.span, d = C.rad + r.normal() * C.thick;
        const u = Math.cos(t) * d, v = Math.sin(t) * d * C.squash, c = Math.cos(C.tilt), s = Math.sin(C.tilt);
        x = C.cx + u * c - v * s; y = C.cy + u * s + v * c;
      }
      else if (C.layout === 'band') {
        const t = r.range(-0.55, 0.55), off = r.normal() * C.thick + Math.sin(t * 7) * C.wave;
        x = 0.5 + Math.cos(C.angle) * t - Math.sin(C.angle) * off; y = 0.5 + Math.sin(C.angle) * t + Math.cos(C.angle) * off;
      } else if (C.layout === 'middle' && r() < C.edge) { x = r(); y = r(); }
      else {
        let w = r() * total, b = C.blobs[0];
        for (const q of C.blobs) { w -= q.w; if (w <= 0) { b = q; break; } }
        x = b.x + r.normal() * b.s; y = b.y + r.normal() * b.s;
      }
      } while ((x < 0.03 || x > 0.97 || y < 0.03 || y > 0.97) && ++tries < 30);
      a[i * 2] = clamp(x); a[i * 2 + 1] = clamp(y);
    }
    return a;
  }

  // ------------------------------------------------------------------ a world
  // settings: { explore, popular, mode: 'feed' | 'search', set (a multiplier on how set people are) }
  // events: [{ month, kind: 'feed', feed }, { month, kind: 'shake', months }, { month, kind: 'drop', x, y }]
  function Run(seed, opts = {}) {
    const C = character(seed);
    if (opts.tweak) opts.tweak(C);      // for tests: change a world's character before it runs
    const N = P.shoppers, M = C.catalog, T = P.months;
    const salt = opts.salt || 0;
    const base = Object.assign({ set: 1 }, C.feed, opts.feed || {});
    const delta = opts.delta || null;     // the second world: the same feed, with these changed
    const home = homes(C);

    // what is recorded, month by month, for drawing and for going back
    const rec = {
      at: new Uint16Array((T + 1) * N * 2),       // every shopper's place, 0..65535
      things: new Float32Array((T + 1) * M * 4),  // every thing: x, y, how popular, how many shoppers were shown it that month
      spread: new Float32Array(T + 1),            // share of the map the crowd lives in, against month 0
      half: new Float32Array(T + 1),              // the share of the catalog that got half of the month's showings
      top: new Float32Array(T + 1),               // share of the month's favorites that went to the top 1% of things
      clumps: [],                                 // each month: [{ x, y, share }] the crowd's clumps
      faves: new Uint32Array(T + 1),
      notes: new Float32Array((T + 1) * 9),       // share of the month's showings in each ninth of the map (3 by 3), for the sound
      feed: [],                                   // the feed as it stood each month
      events: [],
    };
    const snaps = [];

    // the live state
    const S = {
      month: 0,
      u: new Float32Array(home),                  // taste now
      l: new Float32Array(N * 2),                 // what the feed has learned
      n: new Float32Array(N),                     // favorites so far (faded), the feed's trust
      p: new Float32Array(M * 2),                 // things' places
      pop: new Float32Array(M),                   // favorites lately
      idle: new Uint16Array(M),                   // months since a favorite
      seen: new Uint16Array(M),                   // months since anyone was shown it
      shows: new Float32Array(M),                 // times shown this month
      want: new Float32Array(P.demand * P.demand),// where favorites have been falling
      shake: 0,                                   // months of shaking left
      feed: Object.assign({}, base),
    };
    if (delta) Object.assign(S.feed, delta);
    // first catalog: sellers make roughly what people already like, with some wild guesses
    {
      const r = rng(hash(seed, 13));
      for (let j = 0; j < M; j++) {
        if (r() < 0.75) { const i = Math.floor(r() * N); S.p[j * 2] = clamp(home[i * 2] + r.normal() * 0.05); S.p[j * 2 + 1] = clamp(home[i * 2 + 1] + r.normal() * 0.05); }
        else { S.p[j * 2] = clamp(r()); S.p[j * 2 + 1] = clamp(r()); }
        S.pop[j] = 0.5 + r() * 0.5; S.seen[j] = 0;
      }
      // the feed starts out knowing a little about each shopper, from sign-up
      for (let i = 0; i < N; i++) { S.l[i * 2] = clamp(home[i * 2] + r.normal() * 0.12); S.l[i * 2 + 1] = clamp(home[i * 2 + 1] + r.normal() * 0.12); }
    }

    // a bucket grid of the things, rebuilt each month
    const G = P.grid, cellStart = new Int32Array(G * G + 1), cellItems = new Int32Array(M);
    let stamp = 0;
    function bucket() {
      stamp++;
      cellStart.fill(0);
      for (let j = 0; j < M; j++) cellStart[cellOf(S.p[j * 2], S.p[j * 2 + 1]) + 1]++;
      for (let c = 0; c < G * G; c++) cellStart[c + 1] += cellStart[c];
      const fill = cellStart.slice(0, G * G);
      for (let j = 0; j < M; j++) cellItems[fill[cellOf(S.p[j * 2], S.p[j * 2 + 1])]++] = j;
    }
    const cellOf = (x, y) => Math.min(G - 1, Math.floor(x * G)) + Math.min(G - 1, Math.floor(y * G)) * G;

    // the most popular things this month, for the feed's lean and for cold starts
    let hot = [];
    function rankHot() {
      const idx = Array.from({ length: M }, (_, j) => j);
      idx.sort((a, b) => S.pop[b] - S.pop[a]);
      hot = idx.slice(0, 10);
    }

    // The feed ranks the catalog once per patch of the map each month (FEEDCELLS across),
    // for anyone whose learned place falls in that patch, keeping the best LIST; each shopper's
    // SHOWN are then picked from those and the month's most popular, scored again from their
    // own learned place and how far the feed trusts it.
    const FC = P.feedCells, LIST = 14, lists = new Int32Array(FC * FC * LIST), made = new Int32Array(FC * FC).fill(-1);
    const tmpS = new Float32Array(LIST), tmpJ = new Int32Array(LIST);
    function patch(c, feed) {
      if (made[c] === stamp) return c * LIST;
      made[c] = stamp;
      const x = ((c % FC) + 0.5) / FC, y = (Math.floor(c / FC) + 0.5) / FC;
      const search = feed.mode === 'search';
      const reach = search ? P.reach * 0.7 : P.reach, inv = 1 / (2 * reach * reach), lean = search ? 0 : feed.popular;
      const span = Math.ceil(reach * 1.6 * G);
      const cx = Math.min(G - 1, Math.floor(x * G)), cy = Math.min(G - 1, Math.floor(y * G));
      let k = 0;
      for (let gy = Math.max(0, cy - span); gy <= Math.min(G - 1, cy + span); gy++)
        for (let gx = Math.max(0, cx - span); gx <= Math.min(G - 1, cx + span); gx++) {
          const g = gx + gy * G;
          for (let q = cellStart[g]; q < cellStart[g + 1]; q++) {
            const j = cellItems[q], dx = S.p[j * 2] - x, dy = S.p[j * 2 + 1] - y;
            const s = -(dx * dx + dy * dy) * inv + lean * Math.log(1 + S.pop[j]);
            if (k < LIST) { tmpJ[k] = j; tmpS[k] = s; k++; continue; }
            let w = 0; for (let z = 1; z < LIST; z++) if (tmpS[z] < tmpS[w]) w = z;
            if (s > tmpS[w]) { tmpJ[w] = j; tmpS[w] = s; }
          }
        }
      const o = c * LIST;
      for (let z = 0; z < LIST; z++) lists[o + z] = z < k ? tmpJ[z] : -1;
      return o;
    }
    const sc = new Float32Array(P.shown), pk = new Int32Array(P.shown);
    function choose(x, y, trust, feed, r, out) {
      const search = feed.mode === 'search';
      const reach = search ? P.reach * 0.7 : P.reach, inv = 1 / (2 * reach * reach), lean = search ? 0 : feed.popular;
      let k = 0;
      const consider = (j) => {
        for (let q = 0; q < k; q++) if (pk[q] === j) return;
        const dx = S.p[j * 2] - x, dy = S.p[j * 2 + 1] - y;
        const s = -(dx * dx + dy * dy) * inv * trust + lean * Math.log(1 + S.pop[j]) + r() * 0.35;
        if (k < P.shown) { pk[k] = j; sc[k] = s; k++; return; }
        let w = 0; for (let q = 1; q < k; q++) if (sc[q] < sc[w]) w = q;
        if (s > sc[w]) { pk[w] = j; sc[w] = s; }
      };
      const c = Math.min(FC - 1, Math.floor(x * FC)) + Math.min(FC - 1, Math.floor(y * FC)) * FC;
      const o = patch(c, feed);
      for (let z = 0; z < LIST; z++) { const j = lists[o + z]; if (j >= 0) consider(j); }
      if (!search) for (let z = 0; z < hot.length; z++) consider(hot[z]);
      for (let q = 0; q < k; q++) out[q] = pk[q];
      // explore: some places go to something anywhere in the catalog
      if (!search) {
        const ex = S.shake > 0 ? Math.max(feed.explore, 0.6) : feed.explore;
        for (let q = 0; q < P.shown; q++) if (r() < ex) { out[q] = Math.floor(r() * M); if (q >= k) k = q + 1; }
      }
      if (k === 0) { out[0] = Math.floor(r() * M); k = 1; }
      return k;
    }

    // one shopper's month: shown things, perhaps a favorite. Returns the favorite or -1.
    function look(ux, uy, list, k, picky, r) {
      let best = -1, like = 0;
      const inv = 1 / (2 * picky * picky);
      for (let q = 0; q < k; q++) {
        const j = list[q], dx = S.p[j * 2] - ux, dy = S.p[j * 2 + 1] - uy;
        const v = Math.exp(-(dx * dx + dy * dy) * inv) * (0.7 + 0.3 * r());
        if (v > like) { like = v; best = j; }
      }
      return r() < like * P.act ? best : -1;
    }

    const list = new Int32Array(P.shown);
    const faveCount = new Float32Array(M);
    function month() {
      const t = S.month, r = rng(hash(seed, salt, t, 3));
      // events due now
      for (const e of rec.events) if (e.month === t) apply(e);
      bucket(); rankHot();
      faveCount.fill(0); S.shows.fill(0);
      const f = S.feed, picky = C.picky, setK = C.set * (f.set || 1), pull = C.pull;
      const D = P.demand;
      let faves = 0;
      for (let i = 0; i < N; i++) {
        const o = i * 2;
        const trust = Math.min(1, S.n[i] / P.trust) * 0.85 + 0.15;
        const k = f.mode === 'search' ? choose(S.u[o], S.u[o + 1], 1, f, r, list) : choose(S.l[o], S.l[o + 1], trust, f, r, list);
        for (let q = 0; q < k; q++) { S.seen[list[q]] = 0; S.shows[list[q]]++; }
        const j = look(S.u[o], S.u[o + 1], list, k, picky, r);
        if (j >= 0) {
          const px = S.p[j * 2], py = S.p[j * 2 + 1];
          S.u[o] += (px - S.u[o]) * pull; S.u[o + 1] += (py - S.u[o + 1]) * pull;
          S.l[o] += (px - S.l[o]) * P.learn; S.l[o + 1] += (py - S.l[o + 1]) * P.learn;
          S.n[i] = S.n[i] * P.fade + 1;
          faveCount[j]++; faves++;
          const c = Math.min(D - 1, Math.floor(px * D)) + Math.min(D - 1, Math.floor(py * D)) * D;
          S.want[c] += 1;
        } else S.n[i] *= P.fade;
        S.u[o] += (home[o] - S.u[o]) * setK; S.u[o + 1] += (home[o + 1] - S.u[o + 1]) * setK;
      }
      // things: popularity, idleness, sellers following the favorites
      for (let j = 0; j < M; j++) {
        S.pop[j] = S.pop[j] * P.fade + faveCount[j];
        S.idle[j] = faveCount[j] > 0 ? 0 : S.idle[j] + 1;
        if (S.seen[j] < 65000) S.seen[j]++;
      }
      // blur the map of wants a little and let it fade
      const W = S.want, B = new Float32Array(D * D);
      for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
        let s = 0, w = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= D || yy >= D) continue;
          const k = dx || dy ? (dx && dy ? 0.5 : 1) : 2; s += W[xx + yy * D] * k; w += k;
        }
        B[x + y * D] = (s / w) * P.fade;
      }
      S.want = B;
      // read the map of wants between cell centers, so things slide smoothly instead of stopping on cell edges
      const wantAt = (x, y) => {
        const fx = Math.min(D - 1.001, Math.max(0, x * D - 0.5)), fy = Math.min(D - 1.001, Math.max(0, y * D - 0.5));
        const ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy, o = ix + iy * D;
        return (B[o] * (1 - ax) + B[o + 1] * ax) * (1 - ay) + (B[o + D] * (1 - ax) + B[o + D + 1] * ax) * ay;
      };
      const peak = Math.max(1e-6, ...B);
      const h = 0.5 / D;
      // what sells, as a running sum of favorites lately, for sellers to copy from
      const sells = new Float32Array(M); let all = 0;
      for (let j = 0; j < M; j++) { all += S.pop[j]; sells[j] = all; }
      const copyOf = () => { const v = r() * all; let a = 0, b = M - 1; while (a < b) { const m = (a + b) >> 1; if (sells[m] < v) a = m + 1; else b = m; } return a; };
      for (let j = 0; j < M; j++) {
        const x = S.p[j * 2], y = S.p[j * 2 + 1];
        const gx = (wantAt(x + h, y) - wantAt(x - h, y)) / peak, gy = (wantAt(x, y + h) - wantAt(x, y - h)) / peak;
        S.p[j * 2] = clamp(x + gx * C.chase * 3 + r.normal() * 0.002);
        S.p[j * 2 + 1] = clamp(y + gy * C.chase * 3 + r.normal() * 0.002);
        if (S.idle[j] >= P.idle && !S.kept?.has(j)) {
          // taken down, and something new put up: a copy of what sells, or a guess
          if (r() < C.copy) { const m = copyOf(); S.p[j * 2] = clamp(S.p[m * 2] + r.normal() * 0.03); S.p[j * 2 + 1] = clamp(S.p[m * 2 + 1] + r.normal() * 0.03); }
          else { S.p[j * 2] = clamp(r()); S.p[j * 2 + 1] = clamp(r()); }
          S.pop[j] = 0.5; S.idle[j] = 0; S.seen[j] = 0;
        }
      }
      if (S.shake > 0) S.shake--;
      S.month = t + 1;
      note(S.month, faveCount, faves);
      if (S.month % P.every === 0) snap();
    }

    function apply(e) {
      if (e.kind === 'feed') { S.feed = Object.assign({}, S.feed, e.feed); if (delta) Object.assign(S.feed, delta); }
      else if (e.kind === 'shake') S.shake = e.months || 12;
      else if (e.kind === 'drop') {
        // a new thing, put up by a seller who will not take it down
        let j = 0; for (let q = 1; q < M; q++) if (S.pop[q] < S.pop[j] && !(S.kept && S.kept.has(q))) j = q;
        S.p[j * 2] = clamp(e.x); S.p[j * 2 + 1] = clamp(e.y); S.pop[j] = 0; S.idle[j] = 0; S.seen[j] = 0;
        (S.kept || (S.kept = new Set())).add(j);
        e.thing = j;
      }
    }

    // what is kept of a month
    const CELLS = Math.round(1 / P.stuck);
    let lived0 = 0;
    function note(t, faveCount, faves) {
      const o = t * N * 2;
      for (let q = 0; q < N * 2; q++) rec.at[o + q] = Math.round(S.u[q] * 65535);
      const ot = t * M * 4;
      for (let j = 0; j < M; j++) { rec.things[ot + j * 4] = S.p[j * 2]; rec.things[ot + j * 4 + 1] = S.p[j * 2 + 1]; rec.things[ot + j * 4 + 2] = S.pop[j]; rec.things[ot + j * 4 + 3] = S.shows[j]; }
      // spread: the effective number of cells lived in (exp of the entropy), against month 0
      const cnt = new Float32Array(CELLS * CELLS);
      for (let i = 0; i < N; i++) cnt[Math.min(CELLS - 1, Math.floor(S.u[i * 2] * CELLS)) + Math.min(CELLS - 1, Math.floor(S.u[i * 2 + 1] * CELLS)) * CELLS]++;
      let H = 0; for (const c of cnt) if (c) { const p = c / N; H -= p * Math.log(p); }
      const lived = Math.exp(H);
      if (t === 0) lived0 = lived;
      rec.spread[t] = lived / lived0;
      {
        const sh = Array.from(S.shows).sort((a, b) => b - a), all = sh.reduce((a, b) => a + b, 0);
        let s = 0, k = 0; while (k < M && s < all / 2) s += sh[k++];
        rec.half[t] = all ? k / M : 0.5;
        for (let j = 0; j < M; j++) {
          const q = Math.min(2, Math.floor(S.p[j * 2] * 3)) + Math.min(2, Math.floor(S.p[j * 2 + 1] * 3)) * 3;
          rec.notes[t * 9 + q] += all ? S.shows[j] / all : 1 / M;
        }
      }
      if (faves) { const fc = Array.from(faveCount).sort((a, b) => b - a), k = Math.max(1, Math.round(M / 100)); let s = 0; for (let q = 0; q < k; q++) s += fc[q]; rec.top[t] = s / faves; }
      rec.faves[t] = faves;
      rec.clumps[t] = clumps(cnt);
      rec.feed[t] = Object.assign({ shake: S.shake > 0 }, S.feed);
    }

    // the crowd's clumps: connected runs of busy cells, on a coarser map
    function clumps() {
      const K = 20, c = new Float32Array(K * K);
      for (let i = 0; i < N; i++) c[Math.min(K - 1, Math.floor(S.u[i * 2] * K)) + Math.min(K - 1, Math.floor(S.u[i * 2 + 1] * K)) * K]++;
      const busy = N / (K * K) * 1.2, seenC = new Uint8Array(K * K), out = [];
      for (let s = 0; s < K * K; s++) {
        if (seenC[s] || c[s] < busy) continue;
        const stack = [s]; seenC[s] = 1; let n = 0, sx = 0, sy = 0;
        while (stack.length) {
          const q = stack.pop(), x = q % K, y = (q - x) / K;
          n += c[q]; sx += (x + 0.5) / K * c[q]; sy += (y + 0.5) / K * c[q];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= K || yy >= K) continue;
            const qq = xx + yy * K; if (!seenC[qq] && c[qq] >= busy) { seenC[qq] = 1; stack.push(qq); }
          }
        }
        if (n >= N * 0.02) out.push({ x: sx / n, y: sy / n, share: n / N });
      }
      return out.sort((a, b) => b.share - a.share);
    }

    function snap() {
      snaps[S.month / P.every] = {
        month: S.month, u: S.u.slice(), l: S.l.slice(), n: S.n.slice(), p: S.p.slice(), pop: S.pop.slice(),
        idle: S.idle.slice(), seen: S.seen.slice(), want: S.want.slice(), shake: S.shake, feed: Object.assign({}, S.feed),
        kept: S.kept ? new Set(S.kept) : null,
      };
    }
    function restore(z) {
      S.month = z.month; S.u.set(z.u); S.l.set(z.l); S.n.set(z.n); S.p.set(z.p); S.pop.set(z.pop);
      S.idle.set(z.idle); S.seen.set(z.seen); S.want = z.want.slice(); S.shake = z.shake; S.feed = Object.assign({}, z.feed);
      S.kept = z.kept ? new Set(z.kept) : null;
    }

    note(0, new Float32Array(M), 0); snap();

    const run = {
      C, P, rec, home, things: M, settings: () => Object.assign({}, S.feed),
      get done() { return S.month; },
      // work out up to `months` more months; true while there are months left
      more(months = Infinity) {
        for (let q = 0; q < months && S.month < T; q++) month();
        return S.month < T;
      },
      // change course at a month: the record after it is thrown away and worked out again
      change(e) {
        const at = Math.max(0, Math.min(T - 1, S.month, e.month));
        e.month = at;
        // what was planned for later is dropped with the record; a second change of the same kind in one month replaces the first
        rec.events = rec.events.filter((x) => x.month < at || (x.month === at && (x.kind !== e.kind || x.kind === 'drop')));
        rec.events.push(e);
        rec.events.sort((a, b) => a.month - b.month);
        const z = snaps[Math.floor(at / P.every)];
        snaps.length = Math.floor(at / P.every) + 1;
        restore(z);
        while (S.month < at) month();
        return at;
      },
      // you: one more shopper who starts at (x, y) in month `from` and is not counted in the crowd.
      // Returns your places month by month, and your twin's, who searched instead.
      you(x, y, from, set = 1) {
        return { feed: walker(x, y, from, set, 'feed'), search: walker(x, y, from, set, 'search') };
      },
    };

    // one more shopper walked through the recorded months
    function walker(x, y, from, set, mode) {
      const out = new Float32Array((T + 1) * 2).fill(NaN);
      const r = rng(hash(seed, salt, from, mode === 'feed' ? 91 : 92));
      let ux = x, uy = y, lx = x, ly = y, n = 0;
      out[from * 2] = ux; out[from * 2 + 1] = uy;
      const keep = { p: S.p, pop: S.pop, shake: S.shake };
      for (let t = from; t < S.month; t++) {
        // borrow the things as they stood that month
        const ot = t * M * 4, p = new Float32Array(M * 2), pop = new Float32Array(M);
        for (let j = 0; j < M; j++) { p[j * 2] = rec.things[ot + j * 4]; p[j * 2 + 1] = rec.things[ot + j * 4 + 1]; pop[j] = rec.things[ot + j * 4 + 2]; }
        S.p = p; S.pop = pop; S.shake = rec.feed[t].shake ? 1 : 0; bucket(); rankHot();
        const f = Object.assign({}, rec.feed[t]); if (mode === 'search') f.mode = 'search';
        const trust = Math.min(1, n / P.trust) * 0.85 + 0.15;
        const k = f.mode === 'search' ? choose(ux, uy, 1, f, r, list) : choose(lx, ly, trust, f, r, list);
        const j = look(ux, uy, list, k, C.picky, r);
        if (j >= 0) {
          ux += (p[j * 2] - ux) * C.pull; uy += (p[j * 2 + 1] - uy) * C.pull;
          lx += (p[j * 2] - lx) * P.learn; ly += (p[j * 2 + 1] - ly) * P.learn; n = n * P.fade + 1;
        } else n *= P.fade;
        const k2 = C.set * set * (rec.feed[t].set || 1);
        ux += (x - ux) * k2; uy += (y - uy) * k2;
        out[(t + 1) * 2] = ux; out[(t + 1) * 2 + 1] = uy;
      }
      S.p = keep.p; S.pop = keep.pop; S.shake = keep.shake;
      return out;
    }

    return run;
  }

  return { P, rng, hash, character, describe, homes, Run, LAYOUTS };
});
