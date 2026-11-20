#!/usr/bin/env node
// node works/019/_test.js
//
// Checks the shop and the seven feeds of No. 019 without a browser: that the same parameters give the same
// shop, that world.js is the shop _world.js builds today, that every number an explanation quotes can be
// recounted from the shoppers' favorites, and that the feeds disagree in the ways the tour says they do.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build, P, TASTES, crowdOf, month, monthHtml } from './_world.js';
import { begin, advance, outcome, nearest, RUN } from './forward.js';
import { crowd } from './shoppers.js';
import { prepare, rank, explain, measures, FEEDS, TOP } from './recs.js';
import { world } from './world.js';
import { title } from './vocab.js';

const dir = dirname(fileURLToPath(import.meta.url));
let failed = 0, passed = 0;
const ok = (cond, what, detail = '') => { if (cond) passed++; else { failed++; console.log(`FAIL  ${what}${detail ? '  ' + detail : ''}`); } };
const note = (s) => console.log(`      ${s}`);

const { raw, truth } = build(P);
const W = prepare(raw);
const { L, shoppers } = truth;
const N = L.length;

// --- the shop
ok(JSON.stringify(build(P).raw) === JSON.stringify(raw), 'the same parameters build the same shop');
ok(Object.keys(raw).length === Object.keys(world).length && Object.keys(raw).every((k) => JSON.stringify(world[k]) === JSON.stringify(raw[k])), 'world.js is what _world.js builds now', 'run node works/019/_world.js');
const bytes = readFileSync(join(dir, 'world.js')).length;
ok(bytes < 600 * 1024, 'world.js is under 600 KB', `${(bytes / 1024).toFixed(0)} KB`);
ok(L.filter((l) => l.day === P.today - 1).length === P.fresh && L.every((l) => l.day < P.today - 1 || l.favs === 0), "yesterday's listings have no favorites");
ok(raw.shoppers.every((s) => s.favs.length > 0), 'every named shopper was found', raw.shoppers.map((s) => `${s.name} ${s.favs.length}`).join(', '));

// --- every shipped count, recounted from the shoppers
const count = new Array(N).fill(0), recent = new Array(N).fill(0);
for (const sh of shoppers) for (const id of sh.favorites) count[id]++;
for (const l of L) recent[l.id] = l.days.filter((d) => d >= P.today - 14).length;
ok(W.items.every((l) => l.favs === count[l.id]), 'favorites per listing match a recount');
ok(W.items.every((l) => l.recent === recent[l.id]), 'recent favorites match a recount');
ok(raw.counts.favorites === count.reduce((a, b) => a + b, 0), 'the total of favorites matches');
let pairs = 0, wrong = 0;
for (const l of W.items) for (const n of l.nb) {
  pairs++;
  let both = 0;
  for (const sh of shoppers) if (sh.set.has(l.id) && sh.set.has(n.id)) both++;
  if (both !== n.co) wrong++;
}
ok(wrong === 0, `all ${pairs} co-favorite counts match a recount`, `${wrong} wrong`);

// --- every feed, in every state the page starts from
const states = {
  cold: [], one: [raw.tour.first], four: [raw.tour.first, ...raw.tour.more], fresh: [raw.tour.fresh],
  ...Object.fromEntries(raw.shoppers.map((s) => [s.name, s.favs])),
};
const results = {};
for (const [name, favorites] of Object.entries(states)) {
  const state = { favorites };
  const R = (results[name] = rank(W, state));
  ok(JSON.stringify(rank(W, state).blend.order) === JSON.stringify(R.blend.order) && JSON.stringify(rank(W, state).explore.order) === JSON.stringify(R.explore.order), `${name}: ranking twice gives the same feeds`);
  for (const f of FEEDS) {
    const order = R[f.id].order;
    ok(order.length === N - favorites.length && new Set(order).size === order.length, `${name}/${f.id}: every listing once`, `${order.length} of ${N - favorites.length}`);
    ok(!order.some((id) => favorites.includes(id)), `${name}/${f.id}: no favorite is shown again`);
    for (const id of order.slice(0, TOP)) {
      const e = explain(W, state, R, f.id, id);
      ok(e.text && !/undefined|NaN|null/.test(e.text), `${name}/${f.id}: an explanation for ${id}`, e.text);
    }
  }
  const tries = R.explore.order.slice(0, TOP).map((id) => R.explore.tags[id]);
  ok([2, 5, 8].every((n) => tries[n] === 'try') && tries.filter(Boolean).length === 3, `${name}: Explore tries in places 3, 6 and 9`);
  const ads = R.blend.order.slice(0, TOP).map((id) => R.blend.tags[id]);
  ok(ads[1] === 'ad' && ads[6] === 'ad' && ads.filter(Boolean).length === 2, `${name}: The blend sells places 2 and 7`);
  ok(!Object.keys(rank(W, { favorites, ads: false }).blend.tags).length, `${name}: no ads when they are off`);
}

// --- the tour
const top = (R, f) => R[f].order.slice(0, TOP);
const shared = (a, b) => a.filter((id) => b.includes(id)).length;
{
  const R = results.cold;
  ok(['similar', 'shoppers', 'learned'].every((f) => R[f].fallback && shared(top(R, f), top(R, 'popular')) === TOP), 'step 1: with no favorites the personal feeds are Most popular');
  ok(!R.popular.fallback && !R.trending.fallback && !R.explore.fallback && !R.blend.fallback, 'step 1: the other four feeds stand on their own');
}
{
  const R = results.one, sim = measures(W, top(R, 'similar')), cf = measures(W, top(R, 'shoppers'));
  ok(['similar', 'shoppers', 'learned'].every((f) => !R[f].fallback), 'step 2: one favorite is enough for every personal feed');
  ok(sim.crafts === 1, 'step 2: Similar items is all one craft', `${sim.crafts} crafts`);
  ok(cf.crafts >= 3, 'step 2: Shoppers like you crosses crafts', `${cf.crafts} crafts`);
  ok(shared(top(R, 'similar'), top(R, 'shoppers')) <= 3, 'step 2: the two share at most three listings', `${shared(top(R, 'similar'), top(R, 'shoppers'))}`);
  ok(R.shoppers.padFrom >= TOP, 'step 2: Shoppers like you needs no topping up');
  note(`step 2  similar: ${sim.crafts} craft, ${sim.colors} colors   shoppers like you: ${cf.crafts} crafts, ${cf.colors} colors   shared ${shared(top(R, 'similar'), top(R, 'shoppers'))}`);
}
{
  const R = results.four, sim = measures(W, top(R, 'similar')), ex = measures(W, top(R, 'explore'));
  ok(sim.crafts === 1 && sim.colors <= 3, 'step 3: with four favorites Similar items has closed in', `${sim.crafts} crafts, ${sim.colors} colors`);
  ok(ex.crafts >= sim.crafts + 3, 'step 3: Explore is wider than Similar items', `${ex.crafts} against ${sim.crafts}`);
  ok(measures(W, top(R, 'popular')).favorites > 3 * sim.favorites, 'step 3: Similar items reaches far less popular listings than Most popular');
}
{
  // a listing with no favorites: only the feeds that do not need other shoppers can show it
  const id = raw.tour.fresh;
  ok(W.items[id].favs === 0 && W.items[id].age === 1, 'step 5: the fresh listing is a day old with no favorites');
  ok(top(results.cold, 'trending').includes(id), 'step 5: Trending and new shows it to everyone', `place ${results.cold.trending.order.indexOf(id) + 1}`);
  ok(top(results.four, 'similar').includes(id), 'step 5: Similar items shows it to a shopper whose favorites it resembles', `place ${results.four.similar.order.indexOf(id) + 1}`);
  for (const [name, R] of Object.entries(results)) {
    if (name === 'fresh') continue;
    ok(!top(R, 'popular').includes(id) && !top(R, 'learned').includes(id) && R.shoppers.order.indexOf(id) >= Math.min(R.shoppers.padFrom ?? 0, N), `step 5: ${name}: Most popular, Shoppers like you and Learned taste cannot show it`);
  }
  const R = results.fresh;
  ok(R.learned.fallback && R.shoppers.fallback && !R.similar.fallback, 'a shopper whose only favorite is new: Similar items works, the two that learn from shoppers do not');
  note(`step 5  "${title(W.items[id])}": trending ${results.cold.trending.order.indexOf(id) + 1}, similar (four favorites) ${results.four.similar.order.indexOf(id) + 1}, popular ${results.cold.popular.order.indexOf(id) + 1}`);
}
{
  const R = rank(W, { favorites: states.four, weights: { taste: 0, popular: 1, fresh: 0, variety: 0 }, ads: false });
  ok(shared(top(R, 'blend'), top(R, 'popular')) >= 8, 'step 6: with every weight on popularity The blend is Most popular', `${shared(top(R, 'blend'), top(R, 'popular'))} shared`);
  const T = rank(W, { favorites: states.four, weights: { taste: 1, popular: 0, fresh: 0, variety: 0 }, ads: false });
  ok(shared(top(T, 'blend'), top(T, 'popular')) <= 4, 'step 6: with every weight on taste it is not');
}

// --- do the two feeds that learn from shoppers find a shopper's taste? Hide nothing, just ask whether
//     what they recommend to a simulated shopper is from that shopper's two tastes.
{
  const inTaste = (id, t) => TASTES[t].looks.some((lk, n) => truth.pools[t * 4 + n].includes(id));
  const hit = { similar: 0, shoppers: 0, learned: 0 }; let n = 0;
  for (let u = 0; u < shoppers.length && n < 150; u += 7) {
    const sh = shoppers[u];
    if (sh.favorites.length < 6) continue;
    n++;
    const R = rank(W, { favorites: sh.favorites });
    for (const f of Object.keys(hit)) hit[f] += top(R, f).filter((id) => inTaste(id, sh.t1) || inTaste(id, sh.t2)).length / TOP;
  }
  for (const f of Object.keys(hit)) hit[f] /= n;
  ok(hit.shoppers > 0.75 && hit.learned > 0.75, 'the collaborative feeds recommend from a shopper’s own tastes', JSON.stringify(hit));
  note(`share of a top ten from the shopper's two tastes, over ${n} shoppers: similar ${hit.similar.toFixed(2)}, shoppers like you ${hit.shoppers.toFixed(2)}, learned taste ${hit.learned.toFixed(2)}`);
}

// --- the shop run forward
{
  const made = crowdOf(truth);
  ok(Object.keys(made).length === Object.keys(crowd).length && Object.keys(made).every((k) => JSON.stringify(crowd[k]) === JSON.stringify(made[k])), 'shoppers.js is what _world.js builds now', 'run node works/019/_world.js');
  const size = readFileSync(join(dir, 'shoppers.js')).length;
  ok(size < 300 * 1024, 'shoppers.js is under 300 KB', `${(size / 1024).toFixed(0)} KB`);
  ok(crowd.f.length === P.shoppers && crowd.taste.length === N && crowd.q.length === N && crowd.t.length === 2 * P.shoppers, 'it has every shopper and every listing');

  // the neighbors forward.js rebuilds each night are the ones the shop ships, when nothing has happened yet
  const co = new Uint16Array(N * N), copy = prepare(raw);
  for (const f of crowd.f) for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) { co[f[a] * N + f[b]]++; co[f[b] * N + f[a]]++; }
  nearest(co, copy.items);
  ok(copy.items.every((l, i) => JSON.stringify(l.nb) === JSON.stringify(W.items[i].nb)), 'rebuilding the co-favorite neighbors from the shoppers gives the shipped ones');

  // two days, twice: the same shoppers, the same favorites
  const two = () => { const s = begin(raw, crowd); while (s.day < 2) advance(s, 5); return s.worlds.map((wd) => [wd.total, ...wd.gained]); };
  ok(JSON.stringify(two()) === JSON.stringify(two()), 'running the shop forward twice gives the same two days, however the work is sliced');

  const sim = month(raw, crowd), out = Object.fromEntries(sim.worlds.map((wd) => [wd.feed, outcome(sim, wd)]));
  ok(sim.day === RUN.days && sim.worlds.every((wd) => wd.visits === RUN.days * RUN.visits && wd.daily.length === RUN.days), `a month is ${RUN.days} days of ${RUN.visits} visits in every copy`);
  for (const wd of sim.worlds) {
    const gained = wd.gained.reduce((a, b) => a + b, 0);
    ok(gained === wd.total && wd.daily.reduce((a, b) => a + b, 0) === wd.total, `${wd.feed}: the favorites given add up`, `${gained}, ${wd.total}`);
    ok(wd.W.items.every((l) => l.favs === sim.before[l.id] + wd.gained[l.id] && l.age === W.items[l.id].age + RUN.days), `${wd.feed}: every listing's count is what it had plus what it gained`);
    ok(wd.favs.every((f, u) => new Set(f).size === f.length && f.length >= crowd.f[u].length), `${wd.feed}: no shopper favorited a listing twice`);
    ok([...wd.gained].every((g, id) => !g || wd.shown[id] >= g), `${wd.feed}: nothing was favorited without being shown`);
  }
  // what the section is there to show
  const feeds = Object.keys(out);
  ok(feeds.every((f) => f === 'popular' || out[f].shown > out.popular.shown), 'Most popular shows the fewest listings', feeds.map((f) => `${f} ${out[f].shown}`).join(', '));
  ok(feeds.every((f) => f === 'similar' || out[f].shown < out.similar.shown), 'Similar items shows the most');
  ok(['shoppers', 'learned', 'explore', 'blend'].every((f) => out[f].favorites > out.similar.favorites && out.similar.favorites > out.popular.favorites), 'the four feeds that learn from shoppers earn more favorites than Similar items, and Similar items more than Most popular');
  ok(out.popular.top > 0.95 && out.similar.top < sim.held, 'Most popular gives nearly everything to the top tenth; Similar items gives it less than it already held', `${out.popular.top.toFixed(2)}, ${out.similar.top.toFixed(2)}, held ${sim.held.toFixed(2)}`);
  ok(out.explore.shown > out.learned.shown && out.explore.favorites < out.learned.favorites, 'Explore shows more of the shop than Learned taste, and earns fewer favorites for it');
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  ok(html.includes(monthHtml(sim)), 'the month in index.html, for readers without scripts, is this month', 'run node works/019/_world.js');
  for (const f of feeds) note(`a month of ${f.padEnd(9)} ${String(out[f].favorites).padStart(5)} favorites, ${String(out[f].shown).padStart(5)} listings shown, ${String(out[f].got).padStart(4)} favorited, ${Math.round(out[f].top * 100)}% to the top tenth`);
}

console.log(`${failed ? 'FAILED' : 'ok'}  ${passed} checks passed${failed ? `, ${failed} failed` : ''}`);
process.exit(failed ? 1 : 0);
