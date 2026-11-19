// recs.js: the seven feeds of No. 019. No DOM in here: the page calls it, and so do _world.js and _test.js.
//
//   const W = prepare(world)                      once
//   const R = rank(W, { favorites, weights, ads })  -> { popular: { order, fallback, padFrom, tags }, ... }
//   explain(W, state, R, 'shoppers', id)          -> one sentence, with the numbers that put it there
//   measures(W, ids)                              -> what a top ten is made of
//
// `order` is every listing that is not a favorite, best first. The page shows the first TOP.

import { CRAFTS, title, plural, price, listed } from './vocab.js';

export const TOP = 10;

export const FEEDS = [
  { id: 'popular', name: 'Most popular', line: 'Counts favorites. Every shopper sees the same ten.' },
  { id: 'trending', name: 'Trending and new', line: 'Counts this week’s favorites more than last month’s, and lifts what was just listed.' },
  { id: 'similar', name: 'Similar items', personal: true, line: 'Compares each listing with your favorites: craft, shape, surface, color, price, shop.' },
  { id: 'shoppers', name: 'Shoppers like you', personal: true, line: 'Looks at the shoppers who favorited what you did, and at what else they favorited.' },
  { id: 'learned', name: 'Learned taste', personal: true, line: 'Gives every shopper and listing a place in a space learned from all favorites, and looks near yours.' },
  { id: 'explore', name: 'Explore', line: 'Starts from your taste, keeps repeats apart, and gives three places to listings it knows little about.' },
  { id: 'blend', name: 'The blend', line: 'Takes candidates from the other feeds, scores them once, and sells two places.' },
];

export const WEIGHTS = { taste: 0.6, popular: 0.25, fresh: 0.15, variety: 0.3 };

// How much each attribute counts when two listings are compared.
const ATTRS = [
  ['craft', 1.0, 'craft'], ['surface', 0.9, 'surface'], ['color', 1.0, 'color'], ['form', 0.5, 'shape'],
  ['accent', 0.4, 'second color'], ['tier', 0.4, 'price range'], ['shop', 0.5, 'shop'],
];
const ATTR_NORM = ATTRS.reduce((s, [, w]) => s + w * w, 0);
const TRY_SLOTS = [2, 5, 8];       // Explore's third, sixth and ninth places
const AD_SLOTS = [1, 6];           // The blend's second and seventh
const NEW_DAYS = 7;

// ---------------------------------------------------------------- small numerics
// Solve A x = b for a small symmetric positive-definite A (Gaussian elimination with pivoting).
export function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / d; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / (M[r][r] || 1e-12); }
  return x;
}
function hash(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) { const s = String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= 0x9e37; h = Math.imul(h, 2246822519) >>> 0; }
  return (h >>> 0) / 4294967296;
}
const median = (a) => { const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };

// ---------------------------------------------------------------- prepare
export const ALPHA = 12, LAMBDA = 2;   // the same confidence and regularization _world.js trained with

export function prepare(raw) {
  const N = raw.L.length;
  const items = raw.L.map((r, id) => ({
    id, craft: r[0], form: r[1], surface: r[2], color: r[3], accent: r[4], price: r[5], shop: r[6], day: r[7],
    age: raw.today - r[7], favs: r[8], recent: r[9], trend: r[10], bid: r[11], tier: 0,
    nb: [], y: raw.f[id].map((v) => v / 1000), x: raw.xy[id * 2], yy: raw.xy[id * 2 + 1], tie: hash('tie', id),
  }));
  raw.nb.forEach((a, i) => { for (let n = 0; n < a.length; n += 2) items[i].nb.push({ id: a[n], co: a[n + 1] }); });
  // a price is cheap, middling or dear for its craft
  for (let c = 0; c < CRAFTS.length; c++) {
    const of = items.filter((l) => l.craft === c).sort((a, b) => a.price - b.price);
    of.forEach((l, n) => { l.tier = Math.min(2, Math.floor((3 * n) / of.length)); });
  }
  // each shop's standing: the favorites its older listings average
  const shopAvg = raw.shops.map((_, s) => { const of = items.filter((l) => l.shop === s && l.age > NEW_DAYS); return of.length ? of.reduce((a, l) => a + l.favs, 0) / of.length : 0; });
  const k = items[0].y.length;
  const YtY = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => items.reduce((s, l) => s + l.y[a] * l.y[b], 0)));
  const maxFavs = Math.max(...items.map((l) => l.favs));

  const W = { N, k, today: raw.today, items, shops: raw.shops, shopAvg, YtY, maxFavs, counts: raw.counts, tour: raw.tour, shoppers: raw.shoppers };
  W.pop = items.map((l) => l.favs);
  // A new listing has no favorites to count, so it is lifted for a week: most on its first day, and more
  // if its shop's other listings are liked. The lift is sized so that a good shop's new listing lands about fourth.
  const trendSorted = items.map((l) => l.trend).sort((a, b) => b - a);
  const goodShop = shopAvg.slice().sort((a, b) => b - a)[Math.floor(shopAvg.length * 0.1)] || 1;
  W.lift = (l) => (l.age > NEW_DAYS ? 0 : trendSorted[3] * Math.pow(0.5, (l.age - 1) / 1.5) * (0.5 + 0.6 * Math.min(1, shopAvg[l.shop] / goodShop)));
  W.trend = items.map((l) => l.trend + W.lift(l));
  return W;
}

// ---------------------------------------------------------------- comparing listings by what they are
export function alike(a, b) {
  let s = 0;
  for (const [key, w] of ATTRS) if (a[key] === b[key]) s += w * w;
  return s / ATTR_NORM;
}
// The average of the favorites, attribute by attribute: "62% mugs, 38% rugs; 75% speckled…"
function profile(W, favorites) {
  const p = {}; let norm = 0;
  for (const [key, w] of ATTRS) {
    const share = new Map();
    for (const id of favorites) share.set(W.items[id][key], (share.get(W.items[id][key]) || 0) + 1 / favorites.length);
    p[key] = share;
    for (const v of share.values()) norm += w * w * v * v;
  }
  p.norm = Math.sqrt(norm);
  return p;
}
const cosine = (p, l) => { let dot = 0; for (const [key, w] of ATTRS) dot += w * w * (p[key].get(l[key]) || 0); return dot / (p.norm * Math.sqrt(ATTR_NORM)); };

// ---------------------------------------------------------------- rank
function sorted(W, scores, favSet, keep = () => true) {
  const ids = [];
  for (let i = 0; i < W.N; i++) if (!favSet.has(i) && keep(i)) ids.push(i);
  return ids.sort((a, b) => scores[b] - scores[a] || W.items[a].tie - W.items[b].tie);
}

export function rank(W, state) {
  const favorites = state.favorites || [];
  const favSet = new Set(favorites);
  const weights = { ...WEIGHTS, ...(state.weights || {}) };
  const { items, N } = W;
  const cold = favorites.length === 0;
  const R = {};

  R.popular = { order: sorted(W, W.pop, favSet), scores: W.pop };
  R.trending = { order: sorted(W, W.trend, favSet), scores: W.trend, tags: {} };
  for (const id of R.trending.order.slice(0, TOP)) if (items[id].age <= NEW_DAYS) R.trending.tags[id] = 'new';
  const fallback = () => ({ order: R.popular.order, scores: W.pop, fallback: true });

  // Similar items: the cosine between a listing and the average of the favorites
  if (cold) R.similar = fallback();
  else {
    const p = profile(W, favorites);
    const scores = items.map((l) => cosine(p, l));
    R.similar = { order: sorted(W, scores, favSet), scores };
  }

  // Shoppers like you: each favorite votes for its co-favorited neighbors, by cosine over shoppers
  if (cold) R.shoppers = fallback();
  else {
    const scores = new Array(N).fill(0);
    for (const i of favorites) for (const { id: j, co } of items[i].nb) scores[j] += co / Math.sqrt(items[i].favs * items[j].favs);
    const found = sorted(W, scores, favSet, (i) => scores[i] > 0);
    const has = new Set(found);
    // too few shoppers in common to fill the feed: the rest is Most popular, and says so
    R.shoppers = { order: found.concat(R.popular.order.filter((id) => !has.has(id))), scores, padFrom: found.length, fallback: found.length === 0 };
  }

  // Learned taste: fit the shopper's vector to their favorites with the listings fixed, then take dot products
  const x = cold ? null : foldIn(W, favorites);
  if (!x) R.learned = fallback();
  else {
    const scores = items.map((l) => dot(x, l.y));
    R.learned = { order: sorted(W, scores, favSet), scores, x, typical: median(scores) };
  }

  // one number for "does this suit the shopper", 0..1, from whichever personal feeds have something to say
  const top = (r) => (r.fallback ? 0 : Math.max(1e-9, r.scores[r.order[0]]));
  const tops = { similar: 1, shoppers: top(R.shoppers), learned: top(R.learned) };
  const taste = items.map((_, i) => {
    let s = 0, n = 0;
    for (const f of ['similar', 'shoppers', 'learned']) if (!R[f].fallback) { s += Math.max(0, Math.min(1, R[f].scores[i] / tops[f])); n++; }
    return n ? s / n : 0;
  });
  const popular = items.map((l) => Math.log(1 + l.favs) / Math.log(1 + W.maxFavs));
  const fresh = items.map((l) => Math.exp(-l.age / 21));

  R.explore = explore(W, favorites, favSet, R.learned.fallback ? popular : R.learned.scores.map((s) => Math.max(0, s / tops.learned)));
  R.blend = blend(W, R, favSet, { taste, popular, fresh }, weights, state.ads !== false);
  R.parts = { taste, popular, fresh, weights };
  return R;
}

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

export function foldIn(W, favorites) {
  const k = W.k;
  const A = W.YtY.map((row, a) => row.map((v, b) => v + (a === b ? LAMBDA : 0)));
  const rhs = new Array(k).fill(0);
  for (const id of favorites) {
    const y = W.items[id].y;
    for (let a = 0; a < k; a++) { rhs[a] += (1 + ALPHA) * y[a]; for (let b = 0; b < k; b++) A[a][b] += ALPHA * y[a] * y[b]; }
  }
  const x = solve(A, rhs);
  return Math.hypot(...x) < 1e-6 ? null : x;   // favorites nobody else has favorited say nothing here
}

// Where a shopper with these favorites sits on the map: the same two directions the listings are drawn on.
export function place(W, favorites) {
  if (!favorites.length) return null;
  let x = 0, y = 0, n = 0;
  for (const id of favorites) { const l = W.items[id]; if (l.favs) { x += l.x; y += l.yy; n++; } }
  return n ? { x: x / n, y: y / n } : null;
}

// Explore. Seven places go to the shopper's taste, each pick marked down for resembling the favorites and
// the picks above it (maximal marginal relevance). Three go to tries: listings with little history, from
// crafts the shopper has not favorited, scored with a bonus that shrinks as favorites come in.
function explore(W, favorites, favSet, rel) {
  const { items } = W;
  const favItems = favorites.map((id) => items[id]);
  const favCrafts = new Set(favItems.map((l) => l.craft));
  const everyCraft = favCrafts.size === CRAFTS.length;
  const key = favorites.slice().sort((a, b) => a - b).join('.');
  const byRel = sorted(W, rel, favSet);
  const pool = byRel.slice(0, 240);
  const picked = [], tags = {}, why = {};
  const resembles = (l, set, weight = 1) => { let m = 0; for (const o of set) m = Math.max(m, weight * alike(l, o)); return m; };

  for (let slot = 0; slot < TOP + 2; slot++) {
    const chosen = picked.map((id) => items[id]);
    let best = -1, bestScore = -Infinity;
    if (TRY_SLOTS.includes(slot)) {
      const tries = chosen.filter((l) => tags[l.id]);
      for (const l of items) {
        if (favSet.has(l.id) || picked.includes(l.id)) continue;
        if (!everyCraft && favCrafts.has(l.craft)) continue;
        const s = 0.4 * rel[l.id] + 1 / Math.sqrt(1 + l.favs / 4) + (l.age <= NEW_DAYS ? 0.1 : 0) + 0.35 * hash(key, l.id) - 0.6 * resembles(l, tries);
        if (s > bestScore) { bestScore = s; best = l.id; }
      }
      if (best >= 0) tags[best] = 'try';
    } else {
      for (const id of pool) {
        if (picked.includes(id)) continue;
        const l = items[id];
        const s = 0.6 * rel[id] - 0.4 * Math.max(resembles(l, favItems, 0.6), resembles(l, chosen));
        if (s > bestScore) { bestScore = s; best = id; }
      }
      if (best >= 0) why[best] = picked.length;
    }
    if (best >= 0) picked.push(best);
  }
  const has = new Set(picked);
  return { order: picked.concat(byRel.filter((id) => !has.has(id))), scores: rel, tags, why };
}

// The blend. Candidates come from the other feeds; one score weighs taste, popularity and freshness; picks
// that resemble the ones above them are marked down; then two slots go to the best-paying relevant ads.
function blend(W, R, favSet, parts, weights, ads) {
  const { items } = W;
  const sum = weights.taste + weights.popular + weights.fresh || 1;
  const w = { taste: weights.taste / sum, popular: weights.popular / sum, fresh: weights.fresh / sum, variety: weights.variety };
  const base = items.map((_, i) => w.taste * parts.taste[i] + w.popular * parts.popular[i] + w.fresh * parts.fresh[i]);
  const cand = new Set();
  for (const f of ['popular', 'trending', 'similar', 'shoppers', 'learned']) if (!R[f].fallback) for (const id of R[f].order.slice(0, 60)) cand.add(id);

  const sold = [];
  if (ads) {
    const paid = items.filter((l) => l.bid > 0 && !favSet.has(l.id))
      .sort((a, b) => b.bid * (0.05 + parts.taste[b.id]) - a.bid * (0.05 + parts.taste[a.id]) || a.tie - b.tie);
    for (const l of paid) { if (sold.length < AD_SLOTS.length && !sold.some((id) => items[id].shop === l.shop)) sold.push(l.id); }
  }
  const organic = [], cost = {};
  const pool = [...cand].filter((id) => !sold.includes(id)).sort((a, b) => base[b] - base[a] || items[a].tie - items[b].tie);
  for (let n = 0; n < TOP + 2 && n < pool.length; n++) {
    const chosen = organic.map((id) => items[id]);
    let best = -1, bestScore = -Infinity, bestCost = 0;
    for (const id of pool) {
      if (organic.includes(id)) continue;
      let m = 0; for (const o of chosen) m = Math.max(m, alike(items[id], o));
      const s = base[id] - w.variety * 0.5 * m;
      if (s > bestScore) { bestScore = s; best = id; bestCost = w.variety * 0.5 * m; }
    }
    organic.push(best); cost[best] = bestCost;
  }
  const order = organic.slice(), tags = {};
  sold.forEach((id, n) => { order.splice(Math.min(AD_SLOTS[n], order.length), 0, id); tags[id] = 'ad'; });
  const has = new Set(order);
  const rest = sorted(W, base, favSet, (i) => !has.has(i));
  return { order: order.concat(rest), scores: base, tags, w, cost };
}

// ---------------------------------------------------------------- explain
const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const two = (v) => v.toFixed(2);
const pct = (v) => `${Math.round(v * 100)}%`;

// Where a listing stands in a feed and why, in one or two sentences. `rank` is 1-based; null for a favorite.
export function explain(W, state, R, feed, id) {
  const l = W.items[id], r = R[feed], favorites = state.favorites || [];
  const at = r.order.indexOf(id);
  const out = { rank: at < 0 ? null : at + 1, tag: (r.tags && r.tags[id]) || null, text: '' };
  if (at < 0) { out.text = 'One of your favorites, so no feed shows it again.'; return out; }
  const favText = `${plural(l.favs, 'shopper')} favorited it.`;

  if (feed === 'popular') out.text = l.favs ? favText : 'Nobody has favorited it yet.';
  else if (feed === 'trending') {
    if (l.age <= NEW_DAYS) out.text = `Listed ${listed(l.age)} by ${W.shops[l.shop]}, whose other listings average ${Math.round(W.shopAvg[l.shop])} favorites.${l.favs ? ` ${plural(l.favs, 'favorite')} so far.` : ''}`;
    else out.text = l.favs ? `${l.recent} of its ${plural(l.favs, 'favorite')} came in the last two weeks.` : 'No favorites yet.';
  } else if (r.fallback) {
    out.text = `Nothing to go on yet, so this is Most popular. ${favText}`;
  } else if (feed === 'similar') {
    let best = null, bestSim = -1;
    for (const f of favorites) { const s = alike(l, W.items[f]); if (s > bestSim) { bestSim = s; best = W.items[f]; } }
    const shared = ATTRS.filter(([key]) => l[key] === best[key]).map(([, , name]) => name);
    out.text = `${shared.length ? `Same ${list(shared)} as` : 'Shares nothing with'} your ${title(best).toLowerCase()}. Match with your favorites: ${two(r.scores[id])}.`;
  } else if (feed === 'shoppers') {
    const votes = favorites.map((f) => ({ f, n: W.items[f].nb.find((n) => n.id === id) })).filter((v) => v.n).sort((a, b) => b.n.co / Math.sqrt(W.items[b.f].favs) - a.n.co / Math.sqrt(W.items[a.f].favs));
    if (!votes.length) out.text = !l.favs ? 'Nobody has favorited it, so no shopper connects it to your favorites.' : at >= r.padFrom ? `Too few shoppers share your favorites to reach it, so it stands where Most popular puts it. ${favText}` : favText;
    else {
      const v = votes[0], f = W.items[v.f];
      out.text = `${v.n.co} of the ${plural(f.favs, 'shopper')} who favorited your ${title(f).toLowerCase()} also favorited this.${votes.length > 1 ? ` ${votes.length - 1} more of your favorites point to it.` : ''}`;
    }
  } else if (feed === 'learned') {
    out.text = l.favs ? `Its place in the taste space lies ${r.scores[id] > 4 * Math.max(0.02, r.typical) ? 'close to' : r.scores[id] > 1.5 * Math.max(0.02, r.typical) ? 'toward' : 'away from'} yours: a score of ${two(r.scores[id])}, where a typical listing gets ${two(r.typical)}.` : 'It has no favorites, so it has no place in the taste space yet.';
  } else if (feed === 'explore') {
    if (out.tag === 'try') out.text = `A try. ${l.favs ? `Only ${plural(l.favs, 'favorite')}` : `Listed ${listed(l.age)}, no favorites`} so far, so nobody knows yet whether it suits you${favorites.length && !favorites.some((f) => W.items[f].craft === l.craft) ? `, and you have favorited no ${CRAFTS[l.craft].plural}` : ''}.`;
    else if (r.why[id] !== undefined) {
      const above = r.why[id] ? `the ${r.why[id] === 1 ? 'one' : r.why[id]} above it` : '';
      const unlike = [favorites.length ? 'your favorites' : '', above].filter(Boolean);
      out.text = `${favorites.length ? 'Fits your taste' : 'Liked by many'} (${two(r.scores[id])})${unlike.length ? `, and chosen for being unlike ${unlike.join(' and ')}` : ''}.`;
    }
    else out.text = `${favorites.length ? 'Fit with your taste' : 'Popularity'}: ${two(r.scores[id])}.`;
  } else if (feed === 'blend') {
    const p = R.parts, w = r.w;
    if (out.tag === 'ad') out.text = `Sponsored. ${W.shops[l.shop]} bids ${price(l.bid)} a click, and its fit with your taste is ${two(p.taste[id])}.`;
    else out.text = `Taste ${two(p.taste[id])} × ${pct(w.taste)}, popular ${two(p.popular[id])} × ${pct(w.popular)}, fresh ${two(p.fresh[id])} × ${pct(w.fresh)}: ${two(r.scores[id])}${r.cost[id] >= 0.005 ? `, less ${two(r.cost[id])} for resembling a listing above it` : ''}.`;
  }
  return out;
}

// ---------------------------------------------------------------- measures
// What a top ten is made of: how varied, how popular, how new.
export function measures(W, ids) {
  const of = ids.map((id) => W.items[id]);
  return {
    crafts: new Set(of.map((l) => l.craft)).size,
    colors: new Set(of.map((l) => l.color)).size,
    favorites: Math.round(median(of.map((l) => l.favs))),
    days: Math.round(median(of.map((l) => l.age))),
  };
}
