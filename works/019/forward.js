// forward.js: the shop of No. 019, run forward a day at a time. No DOM in here: run.js calls it, and so do
// _world.js and _test.js.
//
//   const sim = begin(world, crowd)     seven copies of the shop, one for each feed
//   advance(sim, 10)                    work for about 10 ms; true when a day has ended
//   outcome(sim, sim.worlds[0])         what that shop's feed did with the days so far
//
// Each copy is run by one feed, as if that feed were the only way into the shop. Every day the same
// shoppers come by in every copy, each is shown the feed's ten for them, and each favorites what fits their
// taste. At night the copy takes in the day's favorites: counts, the trend, who favorited what together,
// and the taste space. So the feed that showed the listings also learns from what it showed.
//
// The feeds are the page's own (recs.js). What is added here is how a shopper takes to a listing, which
// follows the rule the shop was made with (_world.js): a first taste, a weaker second one, and now and then
// something else.

import { prepare, derive, rank, hash, solve, ALPHA, LAMBDA, FEEDS, TOP } from './recs.js';

export const RUN = {
  days: 30,
  visits: 100,     // shoppers who come by in a day, of 2,500
  like: 0.1,       // how often a listing of the shopper's first taste is favorited, in first place, at ordinary appeal
  second: 0.45,    // the second taste, against the first
  other: 0.06,     // anything else
  fade: 0.2,       // attention falls down the ten: 1 / (1 + fade × places below the first)
  appeal: 3,       // a listing's appeal counts up to this
  neighbors: 20,   // as _world.js keeps
};

const HALF = Math.pow(0.5, 1 / 7);                       // a favorite counts half as much a week on
const WITH = { shoppers: ['pairs'], learned: ['space'], explore: ['space'], blend: ['pairs', 'space'] };   // what a feed learns from, besides counts
const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

export function begin(world, crowd) {
  const N = world.L.length, U = crowd.f.length;
  const before = world.L.map((r) => r[8]);
  // the listings from most favorited to least on the day the run starts: the order the page draws them in
  const order = before.map((_, i) => i).sort((a, b) => before[b] - before[a] || a - b);
  const tenth = new Set(order.slice(0, Math.round(N / 10)));
  const sim = { N, U, crowd, today: world.today, day: 0, w: 0, n: 0, night: 0, before, order, tenth, worlds: [] };
  sim.held = [...tenth].reduce((s, id) => s + before[id], 0) / before.reduce((a, b) => a + b, 0);   // what the top tenth held already

  for (const feed of FEEDS) {
    const W = prepare(world);
    const wd = { feed: feed.id, W, favs: crowd.f.map((a) => a.slice()), gained: new Uint16Array(N), shown: new Uint32Array(N), day: new Uint16Array(N), total: 0, visits: 0, daily: [] };
    const learns = WITH[feed.id] || [];
    if (learns.includes('pairs')) {
      // how many shoppers favorited both of two listings
      wd.co = new Uint16Array(N * N);
      for (const f of wd.favs) for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) { wd.co[f[a] * N + f[b]]++; wd.co[f[b] * N + f[a]]++; }
    }
    if (learns.includes('space')) {
      // the shoppers' own places in the taste space, which the shop does not ship: fitted to the listings' as they stand
      wd.X = wd.favs.map(() => null);
      half(wd.X, W.items.map((l) => l.y), wd.favs, W.k);
    }
    sim.worlds.push(wd);
  }
  return sim;
}

// Work for about `budget` milliseconds. True when a day has ended, in every copy.
export function advance(sim, budget = Infinity) {
  const t0 = now();
  for (;;) {
    if (sim.w < sim.worlds.length) {
      const wd = sim.worlds[sim.w];
      while (sim.n < RUN.visits) { visit(sim, wd, sim.n++); if (now() - t0 > budget) return false; }
      sim.n = 0; sim.w++;
    } else if (sim.night < sim.worlds.length) {
      night(sim, sim.worlds[sim.night++]);
      if (now() - t0 > budget) return false;
    } else {
      sim.day++; sim.w = 0; sim.night = 0;
      return true;
    }
  }
}

// How a shopper takes to a listing: 1 for their first taste, less for their second, little for anything else.
export function fit(crowd, u, id) {
  const t = crowd.taste[id];
  return t < 0 ? RUN.other : t === crowd.t[u * 2] ? 1 : t === crowd.t[u * 2 + 1] ? RUN.second : RUN.other;
}

// One shopper comes by. Who it is, and whether they would favorite a given listing today, is the same in
// every copy of the shop: the copies differ only in what their feed puts in front of them.
function visit(sim, wd, n) {
  const { crowd, N } = sim;
  const u = Math.floor(hash('who', sim.day, n) * sim.U);
  const favorites = wd.favs[u];
  const ten = rank(wd.W, { favorites }, wd.feed)[wd.feed].order.slice(0, TOP);
  const liked = [];
  ten.forEach((id, place) => {
    wd.shown[id]++;
    const chance = RUN.like * fit(crowd, u, id) * Math.min(RUN.appeal, crowd.q[id] / 100) / (1 + RUN.fade * place);
    if (hash('like', sim.day, u, id) < chance) liked.push(id);
  });
  for (const id of liked) {
    if (wd.co) for (const o of favorites) { wd.co[id * N + o]++; wd.co[o * N + id]++; }
    favorites.push(id);
    wd.day[id]++; wd.gained[id]++; wd.total++;
  }
  wd.visits++;
}

// The shop closes for the day and takes in what happened.
function night(sim, wd) {
  const { W } = wd, { items } = W;
  let today = 0;
  W.today++;
  for (const l of items) {
    const g = wd.day[l.id];
    today += g;
    l.favs += g;
    l.trend = (l.trend + g) * HALF;
    l.age++;
  }
  wd.daily.push(today);
  wd.day.fill(0);
  if (wd.co) nearest(wd.co, items);
  if (wd.X) {
    // one sweep of alternating least squares from where the space stood: the shoppers, then the listings
    const Y = items.map((l) => l.y), byItem = items.map(() => []);
    wd.favs.forEach((f, u) => { for (const i of f) byItem[i].push(u); });
    half(wd.X, Y, wd.favs, W.k);
    half(Y, wd.X, byItem, W.k);
    items.forEach((l, i) => { l.y = Y[i]; });
  }
  derive(W);
}

// Each listing's nearest neighbors by co-favorites, as _world.js makes them: at least two shoppers in common,
// nearest by cosine over shoppers, the first twenty kept.
export function nearest(co, items) {
  const N = items.length;
  for (let i = 0; i < N; i++) {
    const near = [], fi = items[i].favs;
    for (let j = 0, at = i * N; j < N; j++, at++) { const c = co[at]; if (c >= 2) near.push([j, c, c / Math.sqrt(fi * items[j].favs)]); }
    near.sort((x, y) => y[2] - x[2] || x[0] - y[0]);
    if (near.length > RUN.neighbors) near.length = RUN.neighbors;
    items[i].nb = near.map(([id, c]) => ({ id, co: c }));
  }
}

// Half a sweep of implicit-feedback alternating least squares: solve every target's vector with the others fixed.
export function half(target, other, lists, k) {
  const G = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const m of other) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) G[a][b] += m[a] * m[b];
  for (let t = 0; t < target.length; t++) {
    if (!lists[t].length) { target[t] = new Array(k).fill(0); continue; }
    const A = G.map((row, a) => row.map((v, b) => v + (a === b ? LAMBDA : 0)));
    const rhs = new Array(k).fill(0);
    for (const o of lists[t]) {
      const m = other[o];
      for (let a = 0; a < k; a++) { rhs[a] += (1 + ALPHA) * m[a]; for (let b = 0; b < k; b++) A[a][b] += ALPHA * m[a] * m[b]; }
    }
    target[t] = solve(A, rhs);
  }
}

// What a copy's feed has done with the days so far.
export function outcome(sim, wd) {
  let shown = 0, got = 0, top = 0;
  for (let i = 0; i < sim.N; i++) {
    if (wd.shown[i]) shown++;
    if (wd.gained[i]) { got++; if (sim.tenth.has(i)) top += wd.gained[i]; }
  }
  const most = sim.order.filter((id) => wd.gained[id]).sort((a, b) => wd.gained[b] - wd.gained[a] || a - b).slice(0, 3);
  return {
    favorites: wd.total,                              // favorites given: how well the feed served the shoppers
    shown,                                            // listings that were in anyone's ten
    got,                                              // listings that gained a favorite
    top: wd.total ? top / wd.total : 0,               // the share that went to listings already in the top tenth
    most,
  };
}
