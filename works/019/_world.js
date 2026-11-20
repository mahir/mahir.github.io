#!/usr/bin/env node
// node works/019/_world.js [--dry]
//
// Builds the shop for No. 019 and writes it to world.js: the listings, the shops, and what the rankers
// need that can only be learned from every shopper's favorites (each listing's nearest neighbors by
// co-favorites, and its place in the learned taste space). The shoppers themselves go to shoppers.js, which
// the page fetches only to run the shop forward. It also runs that month once, for readers without scripts.
//
// Everything is seeded, so the same parameters always give the same shop. Change P and run it again.
// It is tooling: the page must never import it (Jekyll does not publish files that start with "_").

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CRAFTS, SURFACES, COLORS, craftIndex, surfaceIndex, colorIndex, title } from './vocab.js';
import { solve, prepare, rank, alike, TOP, FEEDS } from './recs.js';
import { begin, advance, outcome, RUN } from './forward.js';

export const P = {
  seed: 19,
  listings: 1200,
  shops: 120,
  shoppers: 2500,
  today: 180,        // listings carry the day they were listed, 0..today-1; favorites happen on days 1..today-1
  fresh: 8,          // listings put up yesterday, with no favorites yet
  neighbors: 20,     // co-favorite neighbors kept per listing
  k: 8,              // dimensions of the learned taste space
  alpha: 12, lambda: 2, sweeps: 15,
};

// ---------------------------------------------------------------- seeded randomness (as in No. 018)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    const s = String(x);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h ^= 0x9e37; h = Math.imul(h, 2246822519) >>> 0;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------- the hidden tastes
// A taste is what a kind of shopper likes, craft by craft: a "look" is one craft in some surfaces and colors.
// The looks of one taste share no attributes on purpose. The shoppers who like speckled rust mugs also like
// striped cream rugs, and nothing in the listings says so: only their favorites do. That is the difference
// between "Similar items" and "Shoppers like you", and it has to be in the data for the page to show it.
const look = (craft, surfaces, colors) => ({ craft: craftIndex(craft), surfaces: surfaces.map(surfaceIndex), colors: colors.map(colorIndex) });
export const TASTES = [
  { id: 'hearth', share: 0.21, looks: [look('mug', ['speckled'], ['rust', 'ochre']), look('rug', ['striped'], ['cream', 'charcoal']), look('candle', ['plain'], ['ochre', 'cream']), look('board', ['plain'], ['rust', 'plum'])] },
  { id: 'coast', share: 0.17, looks: [look('vase', ['striped'], ['cobalt', 'cream']), look('print', ['geometric'], ['teal', 'cobalt']), look('tote', ['striped'], ['cobalt', 'teal']), look('mug', ['plain'], ['cream', 'teal'])] },
  { id: 'garden', share: 0.15, looks: [look('print', ['botanical'], ['moss', 'blush']), look('vase', ['speckled'], ['sage', 'moss']), look('tote', ['botanical'], ['sage', 'cream']), look('candle', ['botanical'], ['blush', 'sage'])] },
  { id: 'grid', share: 0.12, looks: [look('rug', ['checked'], ['charcoal', 'cobalt']), look('print', ['checked'], ['charcoal', 'cream']), look('board', ['geometric'], ['charcoal', 'cobalt']), look('earrings', ['geometric'], ['cobalt', 'cream'])] },
  { id: 'sweet', share: 0.11, looks: [look('candle', ['striped'], ['blush', 'plum']), look('earrings', ['plain'], ['blush', 'ochre']), look('mug', ['checked'], ['plum', 'blush']), look('tote', ['checked'], ['blush', 'plum'])] },
  { id: 'workshop', share: 0.09, looks: [look('board', ['plain'], ['moss', 'charcoal']), look('mug', ['plain'], ['charcoal', 'moss']), look('candle', ['speckled'], ['charcoal', 'rust']), look('vase', ['plain'], ['rust', 'charcoal'])] },
  { id: 'festival', share: 0.08, looks: [look('earrings', ['botanical'], ['plum', 'teal']), look('tote', ['geometric'], ['ochre', 'plum']), look('rug', ['geometric'], ['teal', 'plum']), look('print', ['striped'], ['ochre', 'teal'])] },
  { id: 'quiet', share: 0.07, looks: [look('vase', ['plain'], ['cream', 'sage']), look('candle', ['speckled'], ['cream', 'sage']), look('board', ['speckled'], ['sage', 'cream']), look('rug', ['plain'], ['sage', 'cream'])] },
];
const LOOK_WEIGHTS = [0.32, 0.26, 0.22, 0.2];   // how a shopper's favorites split over the looks of their taste

const SHOP_FIRST = ['Slow', 'Kiln', 'Field', 'Salt', 'Ember', 'Low', 'Paper', 'Second', 'Small', 'Quiet', 'North', 'Wild', 'Plain', 'Honest', 'Blue', 'Tin', 'Late', 'Early', 'Odd', 'Common', 'River', 'Hollow', 'Marrow', 'Thistle', 'Juniper', 'Copper', 'Linen', 'Moth', 'Fig', 'Pebble', 'Wren', 'Clove', 'Harbor', 'Sorrel', 'Tallow', 'Birch', 'Lark', 'Mallow', 'Fennel', 'Ash', 'Gull', 'Rye', 'Flint', 'Dune', 'Plover', 'Nettle'];
const SHOP_SECOND = {
  mug: ['Pottery', 'Clay', 'Kiln', 'Ceramics', 'Stoneware'], vase: ['Pottery', 'Clay', 'Ceramics', 'Vessels', 'Studio'],
  rug: ['Loom', 'Weavers', 'Wool', 'Rugs'], print: ['Press', 'Prints', 'Paper', 'Editions'],
  candle: ['Wax', 'Candles', 'Chandlery', 'Light'], earrings: ['Metals', 'Jewelry', 'Enamel', 'Studio'],
  tote: ['Canvas', 'Bags', 'Sewing', 'Goods'], board: ['Woodshop', 'Timber', 'Boards', 'Joinery'],
};

// ---------------------------------------------------------------- build
export function build(p = P) {
  const rng = (...key) => mulberry32(hashSeed(p.seed, ...key));
  const int = (r, n) => Math.floor(r() * n);
  const pick = (r, a) => a[int(r, a.length)];
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const weighted = (r, w) => { let t = 0; for (const x of w) t += x; let u = r() * t; for (let i = 0; i < w.length; i++) { u -= w[i]; if (u <= 0) return i; } return w.length - 1; };

  const LOOKS = TASTES.flatMap((t, ti) => t.looks.map((l, li) => ({ ...l, taste: ti, n: ti * 4 + li })));
  const N = p.listings;

  // --- shops: four fifths keep to one look, the rest make whatever they like
  const r1 = rng('shops');
  const demand = LOOKS.map((lk) => Math.pow(TASTES[lk.taste].share * LOOK_WEIGHTS[lk.n % 4], 0.6));
  // the shops beyond one a look are dealt out in proportion to that demand, largest remainder first
  const spare = Math.round(p.shops * 0.8) - LOOKS.length, total = demand.reduce((a, b) => a + b, 0);
  const lookOfShop = [];
  for (let n = 0; n < spare; n++) {
    let best = 0, gap = -Infinity;
    demand.forEach((d, l) => { const g = (d / total) * spare - lookOfShop.filter((x) => x === l).length; if (g > gap) { gap = g; best = l; } });
    lookOfShop.push(best);
  }
  const names = new Set();
  const shops = [];
  for (let s = 0; s < p.shops; s++) {
    // more shops make what more shoppers want, though not in proportion: the popular looks stay crowded
    const lk = s < LOOKS.length ? LOOKS[s] : s < Math.round(p.shops * 0.8) ? LOOKS[lookOfShop[s - LOOKS.length]] : null;
    const craft = lk ? lk.craft : int(r1, CRAFTS.length);
    let name;
    do { name = `${pick(r1, SHOP_FIRST)} ${pick(r1, SHOP_SECOND[CRAFTS[craft].id])}`; } while (names.has(name));
    names.add(name);
    shops.push({
      name, look: lk, craft, form: int(r1, 3),
      open: r1() < 0.55 ? 0 : int(r1, p.today - 30),
      priceMul: Math.exp(normal(r1) * 0.22),
      size: 1 / Math.pow(1 + int(r1, 12), 0.7),          // a few large shops, many small ones
      ads: r1() < 0.3,
    });
  }

  // --- listings
  const r2 = rng('listings');
  const sizes = shops.map((s) => s.size);
  const sizesOf = LOOKS.map((lk) => shops.map((s) => (s.look === lk ? s.size : 0)));
  const L = [], made = new Set();
  for (let i = 0; i < N; i++) {
    // every shop has at least one listing; after that, three listings in four are some look's, from one of its shops
    const onLook = i < p.shops ? !!shops[i].look : r2() < 0.74;
    const s = i < p.shops ? i : onLook ? weighted(r2, sizesOf[weighted(r2, demand)]) : weighted(r2, sizes);
    const shop = shops[s];
    // a shop does not list the same thing twice: draw again, a few times, until this one is its own
    let craft, surface, color, accent, form, key, tries = 0;
    do {
    if (onLook) {
      craft = shop.look.craft; surface = pick(r2, shop.look.surfaces); color = pick(r2, shop.look.colors);
      accent = r2() < 0.6 ? pick(r2, shop.look.colors) : int(r2, COLORS.length);
    } else {
      craft = r2() < 0.93 ? shop.craft : int(r2, CRAFTS.length);   // a pottery rarely sells a rug
      surface = int(r2, SURFACES.length); color = int(r2, COLORS.length); accent = int(r2, COLORS.length);
    }
    form = r2() < (tries ? 0.34 : 0.6) ? shop.form : int(r2, 3);
    key = [s, craft, form, surface, color, SURFACES[surface] === 'plain' ? '' : accent].join('.');
    } while (made.has(key) && ++tries < 14);
    made.add(key);
    const dollars = CRAFTS[craft].base * shop.priceMul * Math.exp(normal(r2) * 0.25);
    L.push({
      id: i, craft, form, surface, color, accent,
      price: Math.max(8, Math.round(dollars)) * 100, shop: s,
      day: shop.open + int(r2, p.today - 1 - shop.open),
      q: Math.exp(normal(r2) * 0.6),                    // how much shoppers take to it, all else equal
      bid: shop.ads && r2() < 0.5 ? 10 + 5 * int(r2, 22) : 0,   // cents a click
      favs: 0, days: [],
    });
  }
  const matches = (l, lk) => l.craft === lk.craft && lk.surfaces.includes(l.surface) && lk.colors.includes(l.color);
  const pools = LOOKS.map((lk) => L.filter((l) => matches(l, lk)).map((l) => l.id));

  // --- yesterday's listings: three in the first look, from three shops (the tour uses one), the rest spread over other looks
  const r3 = rng('fresh');
  const fresh = [];
  for (let n = 0; fresh.length < p.fresh; n++) {
    const from = pools[n < 3 ? 0 : (n * 5) % LOOKS.length];
    const pool = from.filter((id) => !fresh.includes(id) && L[id].bid === 0 && !fresh.some((f) => L[f].shop === L[id].shop));
    if (pool.length > 3) fresh.push(pick(r3, pool));
  }
  for (const id of fresh) L[id].day = p.today - 1;
  for (const lk of LOOKS) pools[lk.n] = L.filter((l) => matches(l, lk)).map((l) => l.id);

  // --- shoppers and their favorites, day by day
  const r4 = rng('shoppers');
  const shares = TASTES.map((t) => t.share);
  const shoppers = [];
  const events = [];
  for (let u = 0; u < p.shoppers; u++) {
    const t1 = weighted(r4, shares);
    let t2; do { t2 = int(r4, TASTES.length); } while (t2 === t1);
    const n = Math.max(1, Math.min(70, Math.round(Math.exp(2.2 + normal(r4) * 0.75))));
    const joined = int(r4, p.today - 10);
    shoppers.push({ t1, t2, favorites: [], set: new Set() });
    for (let e = 0; e < n; e++) events.push({ u, day: joined + 1 + int(r4, p.today - 1 - joined), e: events.length });
  }
  events.sort((a, b) => a.day - b.day || a.e - b.e);

  const r5 = rng('favorites');
  const all = L.map((l) => l.id);
  let kept = 0;
  for (const ev of events) {
    const sh = shoppers[ev.u];
    const r = r5();
    const taste = r < 0.68 ? sh.t1 : r < 0.86 ? sh.t2 : -1;
    let pool = taste < 0 ? all : pools[taste * 4 + weighted(r5, LOOK_WEIGHTS)];
    let w = pool.map((id) => {
      const l = L[id];
      if (l.day >= ev.day || sh.set.has(id)) return 0;
      // what is already favorited is seen more, and so is what is new
      return l.q * Math.pow(1 + l.favs, 0.3) * (1 + 1.5 * Math.exp(-(ev.day - l.day) / 8));
    });
    if (!w.some((x) => x > 0)) continue;
    const id = pool[weighted(r5, w)];
    sh.favorites.push(id); sh.set.add(id);
    L[id].favs++; L[id].days.push(ev.day);
    kept++;
  }

  // --- what the rankers need from all those favorites
  for (const l of L) {
    l.recent = l.days.filter((d) => d >= p.today - 14).length;
    l.trend = +l.days.reduce((a, d) => a + Math.pow(0.5, (p.today - d) / 7), 0).toFixed(2);
  }
  const co = new Map();
  for (const sh of shoppers) {
    const f = sh.favorites.slice().sort((a, b) => a - b);
    for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) { const key = f[a] * N + f[b]; co.set(key, (co.get(key) || 0) + 1); }
  }
  const near = L.map(() => []);
  for (const [key, c] of co) {
    if (c < 2) continue;                                 // one shared shopper is a coincidence
    const i = Math.floor(key / N), j = key % N;
    const sim = c / Math.sqrt(L[i].favs * L[j].favs);
    near[i].push([j, c, sim]); near[j].push([i, c, sim]);
  }
  for (const a of near) { a.sort((x, y) => y[2] - x[2] || x[0] - y[0]); a.length = Math.min(a.length, p.neighbors); }

  const { Y } = als(shoppers.map((s) => s.favorites), N, p, rng('als'));
  const xy = pca2(Y);

  // --- the world as it ships
  const raw = {
    today: p.today,
    counts: { shoppers: p.shoppers, favorites: kept },
    shops: shops.map((s) => s.name),
    L: L.map((l) => [l.craft, l.form, l.surface, l.color, l.accent, l.price, l.shop, l.day, l.favs, l.recent, l.trend, l.bid]),
    nb: near.map((a) => a.flatMap(([j, c]) => [j, c])),
    f: Y.map((y) => y.map((v) => Math.round(v * 1000))),
    xy: xy.flat(),
  };

  // --- the tour's listings and the named shoppers, chosen by rule so they survive a change of parameters
  // Yesterday's listing first: of the three in the first look, the one Trending and new ranks highest. Then the
  // favorites the tour makes: established listings of the same look that most resemble it, so that Similar
  // items can find the new one and the feeds that learn from shoppers cannot.
  const W0 = prepare(raw);
  const trending = rank(W0, { favorites: [] }).trending.order;
  const freshOne = fresh.slice(0, 3).sort((x, y) => trending.indexOf(x) - trending.indexOf(y))[0];
  const near0 = pools[0].filter((id) => L[id].favs >= 30)
    .sort((x, y) => alike(W0.items[freshOne], W0.items[y]) - alike(W0.items[freshOne], W0.items[x]) || L[y].favs - L[x].favs || x - y);
  raw.tour = { first: near0[0], more: near0.slice(1, 4), fresh: freshOne };

  const purity = (sh) => sh.favorites.filter((id) => TASTES[sh.t1].looks.some((lk) => matches(L[id], lk))).length / sh.favorites.length;
  const find = (test) => shoppers.findIndex((sh, u) => !taken.has(u) && test(sh));
  const taken = new Set();
  const named = [
    ['Defne', (sh) => sh.t1 === 1 && sh.favorites.length >= 8 && sh.favorites.length <= 11 && purity(sh) > 0.8],
    ['Otis', (sh) => sh.t1 === 3 && sh.favorites.length >= 12 && sh.favorites.length <= 16 && purity(sh) > 0.7],
    ['Mirela', (sh) => sh.t1 === 2 && sh.t2 === 4 && sh.favorites.length >= 9 && sh.favorites.length <= 14 && purity(sh) < 0.7],
    ['Jun', (sh) => sh.t1 === 5 && sh.favorites.length === 2 && purity(sh) === 1],
  ];
  raw.shoppers = named.map(([name, test]) => { const u = find(test); taken.add(u); return { name, favs: u < 0 ? [] : shoppers[u].favorites.slice() }; });

  return { raw, truth: { L, shops, shoppers, pools, LOOKS, fresh, co } };
}

// ---------------------------------------------------------------- learned taste: matrix factorization
// Implicit-feedback alternating least squares (Hu, Koren and Volinsky, 2008). A favorite is a 1 held with
// confidence 1 + alpha; everything else is a 0 held with confidence 1. Each sweep solves every shopper's
// vector with the listings fixed, then every listing's with the shoppers fixed.
function als(favorites, N, p, r) {
  const k = p.k;
  const init = () => Array.from({ length: k }, () => (r() - 0.5) * 0.2);
  const X = favorites.map(init), Y = Array.from({ length: N }, init);
  const byItem = Array.from({ length: N }, () => []);
  favorites.forEach((f, u) => { for (const i of f) byItem[i].push(u); });
  const gram = (M) => { const G = Array.from({ length: k }, () => new Array(k).fill(0)); for (const m of M) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) G[a][b] += m[a] * m[b]; return G; };
  const half = (target, other, lists) => {
    const G = gram(other);
    for (let t = 0; t < target.length; t++) {
      const A = G.map((row, a) => row.map((v, b) => v + (a === b ? p.lambda : 0)));
      const rhs = new Array(k).fill(0);
      for (const o of lists[t]) {
        const m = other[o];
        for (let a = 0; a < k; a++) { rhs[a] += (1 + p.alpha) * m[a]; for (let b = 0; b < k; b++) A[a][b] += p.alpha * m[a] * m[b]; }
      }
      target[t] = lists[t].length ? solve(A, rhs) : new Array(k).fill(0);
    }
  };
  for (let s = 0; s < p.sweeps; s++) { half(X, Y, favorites); half(Y, X, byItem); }
  return { X, Y };
}

// The two directions of the taste space along which the listings spread the most, for the map. 0..1000.
function pca2(Y) {
  const k = Y[0].length, live = Y.filter((y) => y.some((v) => v !== 0));
  const mean = Array.from({ length: k }, (_, a) => live.reduce((s, y) => s + y[a], 0) / live.length);
  const C = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => live.reduce((s, y) => s + (y[a] - mean[a]) * (y[b] - mean[b]), 0)));
  const axes = [];
  for (let n = 0; n < 2; n++) {
    let v = Array.from({ length: k }, (_, a) => 1 / (a + 1 + n));
    for (let it = 0; it < 300; it++) {
      let w = C.map((row) => row.reduce((s, c, b) => s + c * v[b], 0));
      for (const ax of axes) { const d = w.reduce((s, x, a) => s + x * ax[a], 0); w = w.map((x, a) => x - d * ax[a]); }
      const len = Math.hypot(...w); v = w.map((x) => x / len);
    }
    axes.push(v);
  }
  const pts = Y.map((y) => axes.map((ax) => y.reduce((s, v, a) => s + (v - mean[a]) * ax[a], 0)));
  const out = [];
  for (let d = 0; d < 2; d++) {
    const vals = pts.map((q) => q[d]); const lo = Math.min(...vals), hi = Math.max(...vals);
    pts.forEach((q, i) => { (out[i] = out[i] || [])[d] = Math.round(((q[d] - lo) / (hi - lo)) * 1000); });
  }
  return out;
}

// ---------------------------------------------------------------- the crowd, for running the shop forward
// What forward.js needs that the page does not: every shopper's two tastes and favorites, and for each listing
// the taste it belongs to (-1: none) and how much shoppers take to it, times 100. The page loads it only when
// the visitor runs the shop forward.
export function crowdOf(truth) {
  const taste = truth.L.map(() => -1);
  truth.LOOKS.forEach((lk) => { for (const id of truth.pools[lk.n]) taste[id] = lk.taste; });
  return {
    t: truth.shoppers.flatMap((sh) => [sh.t1, sh.t2]),
    f: truth.shoppers.map((sh) => sh.favorites.slice()),
    taste,
    q: truth.L.map((l) => Math.round(l.q * 100)),
  };
}
function writeCrowd(crowd, dir) {
  const js = `// shoppers.js: the shoppers of No. 019. Written by _world.js; do not edit by hand.
// t: each shopper's first and second taste.   f: each shopper's favorites, oldest first.
// taste: the taste each listing belongs to (-1: none).   q: each listing's appeal, times 100.
export const crowd = {
t: ${JSON.stringify(crowd.t)},
taste: ${JSON.stringify(crowd.taste)},
q: ${JSON.stringify(crowd.q)},
f: ${'[\n' + crowd.f.map((r) => JSON.stringify(r)).join(',\n') + '\n]'},
};
`;
  writeFileSync(join(dir, 'shoppers.js'), js);
  return js.length;
}

// The shop run forward for a month under each feed, and what came of it as plain text, for readers without scripts.
export function month(raw, crowd, days = RUN.days) {
  const sim = begin(raw, crowd);
  while (sim.day < days) advance(sim);
  return sim;
}
export function monthHtml(sim) {
  const n = (x) => x.toLocaleString('en-US');
  const rows = sim.worlds.map((wd, i) => {
    const o = outcome(sim, wd);
    return `        <li><b>${FEEDS[i].name}</b> earned ${n(o.favorites)} favorites and showed ${n(o.shown)} of the ${n(sim.N)} listings. ${Math.round(o.top * 100)}% of those favorites went to listings already in the top tenth.</li>`;
  });
  return `      <p>As the run starts, the ${n(sim.tenth.size)} most favorited listings hold ${Math.round(sim.held * 100)}% of all favorites. After ${sim.day} days:</p>\n      <ul>\n${rows.join('\n')}\n      </ul>`;
}

// ---------------------------------------------------------------- write
function write(raw, dir) {
  const rows = (a) => '[\n' + a.map((r) => JSON.stringify(r)).join(',\n') + '\n]';
  const js = `// world.js: the shop of No. 019. Written by _world.js; do not edit by hand.
// L: one row a listing: craft, form, surface, color, accent, price in cents, shop, day listed, favorites,
//    favorites in the last 14 days, favorites weighted by recency, bid in cents a click (0: none).
// nb: each listing's nearest neighbors by co-favorites, as pairs: neighbor, shoppers who favorited both.
// f:  each listing's place in the learned taste space, times 1000.   xy: its place on the map, 0..1000.
export const world = {
today: ${raw.today},
counts: ${JSON.stringify(raw.counts)},
tour: ${JSON.stringify(raw.tour)},
shoppers: ${JSON.stringify(raw.shoppers)},
shops: ${JSON.stringify(raw.shops)},
L: ${rows(raw.L)},
nb: ${rows(raw.nb)},
f: ${rows(raw.f)},
xy: ${JSON.stringify(raw.xy)},
};
`;
  writeFileSync(join(dir, 'world.js'), js);
  return js.length;
}

// The two feeds that are the same for everyone, as plain lists, for readers without scripts.
function writeHtml(raw, dir, crowd) {
  const file = join(dir, 'index.html');
  if (!existsSync(file)) return false;
  const W = prepare(raw);
  const R = rank(W, { favorites: [] });
  let html = readFileSync(file, 'utf8');
  for (const feed of ['popular', 'trending']) {
    const items = R[feed].order.slice(0, TOP).map((id) => `        <li>${title(W.items[id])}, ${W.shops[W.items[id].shop]}</li>`).join('\n');
    const re = new RegExp(`(<!-- gen:${feed} -->)[\\s\\S]*?(<!-- /gen:${feed} -->)`);
    if (re.test(html)) html = html.replace(re, `$1\n${items}\n        $2`);
  }
  html = html.replace(/(<!-- gen:count -->)[\s\S]*?(<!-- \/gen:count -->)/g, `$1${raw.L.length.toLocaleString('en-US')}$2`);
  html = html.replace(/(<!-- gen:forward -->)[\s\S]*?(<!-- \/gen:forward -->)/, (_, a, b) => `${a}\n${monthHtml(month(raw, crowd))}\n      ${b}`);
  writeFileSync(file, html);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = dirname(fileURLToPath(import.meta.url));
  const t0 = Date.now();
  const { raw, truth } = build(P);
  const favs = truth.L.map((l) => l.favs).sort((a, b) => b - a);
  console.log(`${raw.L.length} listings, ${raw.shops.length} shops, ${P.shoppers} shoppers, ${raw.counts.favorites} favorites (${Date.now() - t0} ms)`);
  console.log(`favorites per listing: max ${favs[0]}, 10th ${favs[9]}, median ${favs[favs.length >> 1]}, none ${favs.filter((f) => f === 0).length}`);
  console.log(`tour: first "${title(truth.L[raw.tour.first])}" (${truth.L[raw.tour.first].favs}), fresh "${title(truth.L[raw.tour.fresh])}"`);
  console.log('shoppers:', raw.shoppers.map((s) => `${s.name} ${s.favs.length}`).join(', '));
  if (process.argv.includes('--dry')) process.exit(0);
  const bytes = write(raw, dir), crowd = crowdOf(truth);
  console.log(`world.js: ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`shoppers.js: ${(writeCrowd(crowd, dir) / 1024).toFixed(0)} KB`);
  if (writeHtml(raw, dir, crowd)) console.log('index.html: the two plain lists and the month run forward refreshed');
}
