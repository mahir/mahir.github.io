// node works/023/_test.js
// Checks what cannot be judged by eye: that every world's character is in range and that
// worlds differ; that a number always gives the same world, also after a change and a step
// back; that the feed narrows the crowd and its showings more than searching does, and
// gradually; that the sellers moving matters; that you and your searching twin come apart;
// that the table in index.html is the kept world's; and that the page loads no file whose
// name starts with an underscore (those are not published).
'use strict';
const assert = require('assert');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const World = require('./world.js');
const T = World.P.months, N = World.P.shoppers;

// characters
const kinds = new Set(), sentences = new Set();
for (let s = 1; s <= 1500; s++) {
  const C = World.character(s);
  assert(C.catalog >= 180 && C.catalog <= 900, `world ${s}: catalog ${C.catalog}`);
  assert(C.picky >= 0.22 && C.picky <= 0.42 && C.pull >= 0.02 && C.pull <= 0.05 && C.set >= 0.0015 && C.set <= 0.01, `world ${s}: people out of range`);
  assert(C.feed.explore >= 0.02 && C.feed.explore <= 0.15 && C.feed.popular >= 0.4 && C.feed.popular <= 1.6, `world ${s}: feed out of range`);
  kinds.add(C.layout); sentences.add(World.describe(C));
}
assert.strictEqual(kinds.size, World.LAYOUTS.length, 'every way of starting out comes up');
assert(sentences.size > 100, 'worlds are of ' + sentences.size + ' kinds');
// everyone starts on the map, and not piled on an edge
for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const h = World.homes(World.character(s));
  let edge = 0; for (let i = 0; i < h.length; i++) { assert(h[i] >= 0.02 && h[i] <= 0.98); if (h[i] <= 0.021 || h[i] >= 0.979) edge++; }
  assert(edge < N * 0.01, `world ${s}: ${edge} shoppers start on an edge`);
}

// one number, one world, also after a change and a step back
const sum = (a) => { let h = 0; for (let i = 0; i < a.length; i += 7) h = (h * 31 + a[i]) >>> 0; return h; };
const started = Date.now();
const a = World.Run(13); a.more();
assert(Date.now() - started < 8000, 'a world takes ' + (Date.now() - started) + ' ms');
const b = World.Run(13); b.more();
assert.strictEqual(sum(a.rec.at), sum(b.rec.at), 'the same number gives the same world');
const c = World.Run(14); c.more();
assert.notStrictEqual(sum(a.rec.at), sum(c.rec.at));
{
  const x = World.Run(9); x.more();
  x.change({ month: 70, kind: 'feed', feed: { popular: 2.2 } }); x.more();
  x.change({ month: 100, kind: 'drop', x: 0.9, y: 0.1 }); x.more();
  const y = World.Run(9);
  y.rec.events.push({ month: 70, kind: 'feed', feed: { popular: 2.2 } }, { month: 100, kind: 'drop', x: 0.9, y: 0.1 });
  y.more();
  assert.strictEqual(sum(x.rec.at), sum(y.rec.at), 'changing course is the same as having planned it');
  const z = World.Run(9); z.more();
  const o = 69 * N * 2;
  assert.deepStrictEqual(x.rec.at.subarray(o, o + N * 2), z.rec.at.subarray(o, o + N * 2), 'a change leaves the months before it alone');
  assert.notStrictEqual(sum(x.rec.at), sum(z.rec.at), 'a change changes what comes after');
  // a change, then a step back to before it, then the same months again without it
  x.change({ month: 40, kind: 'shake', months: 12 }); x.more();
  const w = World.Run(9); w.rec.events.push({ month: 40, kind: 'shake', months: 12 }); w.more();
  assert.strictEqual(sum(x.rec.at), sum(w.rec.at), 'a change before an earlier one throws the later one away');
}

// the feed against searching, the sellers, and you
let narrower = 0, gradual = 0, concentrated = 0, apart = 0, tries = 0, still = 0;
const moved = (p, x, y) => Math.hypot(p[T * 2] - x, p[T * 2 + 1] - y);
for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const f = World.Run(s), q = World.Run(s, { delta: { mode: 'search' } });
  f.more(); q.more();
  if (f.rec.spread[T] < q.rec.spread[T]) narrower++;
  if (f.rec.spread[24] > f.rec.spread[T] + 0.1) gradual++;
  if (f.rec.half[T] * 4 < q.rec.half[T]) concentrated++;
  // the sellers held still: searching then keeps more of its ground
  const h = World.Run(s, { delta: { mode: 'search' }, tweak: (C) => { C.chase = 0; C.copy = 0; } }); h.more();
  if (h.rec.spread[T] > q.rec.spread[T] + 0.1) still++;
  const r = World.rng(s);
  for (let k = 0; k < 12; k++) {
    const i = Math.floor(r() * N), x = f.home[i * 2], y = f.home[i * 2 + 1];
    const you = f.you(x, y, 0);
    tries++; if (moved(you.feed, x, y) > moved(you.search, x, y)) apart++;
  }
}
assert(narrower >= 6, `the feed narrows the crowd more than searching in ${narrower} of 8 worlds`);
assert(gradual >= 7, `the narrowing goes on after year 2 in ${gradual} of 8 worlds`);
assert.strictEqual(concentrated, 8, 'the feed gives half its showings to far less of the catalog');
assert(still >= 7, `sellers that stand still leave searchers more ground in ${still} of 8 worlds`);
assert(apart > tries * 0.7, `you move farther with the feed than searching in ${apart} of ${tries}`);

// the kept world's table
execFileSync(process.execPath, [path.join(__dirname, '_static.js'), '--check'], { stdio: 'inherit' });

// nothing published loads an underscore file
for (const f of fs.readdirSync(__dirname).filter((f) => !f.startsWith('_') && /\.(html|js|css)$/.test(f))) {
  const s = fs.readFileSync(path.join(__dirname, f), 'utf8');
  assert(!/["'(\/]_[\w-]+\.(js|html|css|json)/.test(s), f + ' loads an underscore file');
}

console.log('all good');
