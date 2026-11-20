// _test.js: node works/020/_test.js
// Makes many languages and checks what the page relies on: every word can be said in its language,
// every sentence has words and a gloss for every part, the English is well formed, every script
// can write every word, and a number always gives the same language.
import { makeLanguage, MAX, clampSeed } from './language.js';
import { layout } from './script.js';
import { makeRng } from './rng.js';
import { START, TALE, plain, SUBJECTS, OBJECTS, VERB_LIST, ADJ_LIST, PRON, WHO } from './english.js';
import { GLOSS_KEY } from './grammar.js';
import { NOUNS, VERBS, ADJECTIVES } from './words.js';

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const N = +process.argv[2] || 2000;
let bad = 0;
const fail = (seed, what, detail = '') => { bad++; if (bad <= 25) console.log(`FAIL ${seed}: ${what} ${detail}`); };
const tally = {};
const count = (k) => { tally[k] = (tally[k] || 0) + 1; };
const lexical = new Set([...Object.values(NOUNS).map((n) => n[0]), ...Object.values(VERBS).map((v) => v[0]), ...Object.keys(ADJECTIVES), 'one', 'two', 'earlier', 'later']);

for (let i = 1; i <= N; i++) {
  const seed = i <= N / 2 ? i : clampSeed(Math.floor((i * 7919.37) % MAX) + 1);
  let L;
  try { L = makeLanguage(seed); } catch (e) { fail(seed, 'makeLanguage threw', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
  const { ph, words, script } = L;
  count(`script ${script.family}/${script.kind}`); count(`order ${L.G.order}`); count(`dir ${script.boustro ? 'ox' : script.dir}`);
  if (!L.name || /^[^\p{Lu}]/u.test(L.name)) fail(seed, 'name', L.name);
  if (i % 50 === 0) {
    const again = makeLanguage(seed);
    if (again.name !== L.name || again.say(START).words.map((w) => ph.rom(w.segs)).join(' ') !== L.say(START).words.map((w) => ph.rom(w.segs)).join(' ')) fail(seed, 'not the same language twice');
  }
  const seen = new Map();
  for (const [id, e] of Object.entries(words.lex)) {
    const why = ph.legal(e.segs);
    if (why) fail(seed, `word "${id}"`, `${ph.rom(e.segs)}: ${why}`);
    const key = ph.rom(e.segs);
    if (seen.has(key)) fail(seed, 'two words spelled alike', `${id} and ${seen.get(key)}: ${key}`);
    seen.set(key, id);
  }
  for (const [n, segs] of Object.entries(words.num)) { const why = ph.legal(segs); if (why) fail(seed, `number ${n}`, why); }
  if (ph.legal(L.nameSegs)) fail(seed, 'name unsayable', ph.legal(L.nameSegs));
  const r = makeRng(seed + 17);
  const np = (list, pronOk) => (pronOk && r.chance(0.3) ? { pron: PRON[r.pick(WHO)], incl: r.chance(0.5) } : { noun: r.pick(list), n: r.int(1, 3), adj: r.chance(0.4) ? r.pick(ADJ_LIST) : null, def: r.chance(0.5) });
  const sentences = [START, ...TALE];
  for (let k = 0; k < 30; k++) sentences.push({ subj: np(SUBJECTS, true), verb: r.pick(VERB_LIST), obj: np(OBJECTS), rec: np(OBJECTS), time: r.pick(['past', 'now', 'later']), not: r.chance(0.4), ask: r.chance(0.3), src: r.chance(0.3) ? 'heard' : 'seen' });
  for (const S of sentences) {
    let out;
    try { out = L.say(S); } catch (e) { fail(seed, 'say threw', JSON.stringify(S) + ' ' + e.stack.split('\n').slice(0, 3).join(' | ')); break; }
    const en = plain(S);
    if (!/^[A-Z].*[.?]$/.test(en) || /\s\s|undefined|null/.test(en)) fail(seed, 'English', en);
    if (!out.words.length) fail(seed, 'no words', en);
    for (const w of out.words) {
      const why = ph.legal(w.segs);
      if (why) fail(seed, 'unsayable word', `${ph.rom(w.segs)} (${w.parts.map((p) => p.gloss).join('-')}): ${why}`);
      if (w.roles.length !== w.segs.length) fail(seed, 'roles and sounds differ in length');
      for (const p of w.parts) {
        if (!p.segs.length) fail(seed, 'empty part', p.gloss);
        if (!(p.gloss in GLOSS_KEY) && !lexical.has(p.gloss)) fail(seed, 'gloss without a key', p.gloss);
      }
    }
    // the verb is always there; a negative sentence always differs from its positive
    if (!out.words.some((w) => w.parts.some((p) => p.role === 'verb'))) fail(seed, 'no verb', en);
    if (S.not) {
      const pos = L.say({ ...S, not: false });
      if (pos.words.map((w) => ph.rom(w.segs)).join(' ') === out.words.map((w) => ph.rom(w.segs)).join(' ')) fail(seed, '"not" changes nothing', en);
    }
    try {
      const laid = layout(script, script.compose(out.words, out.end), { size: 30, max: 480 });
      if (!laid.strokes.length || !Number.isFinite(laid.w) || !Number.isFinite(laid.h)) fail(seed, 'nothing to draw', en);
      for (const s of laid.strokes) for (const p of s.pts) if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) { fail(seed, 'a point off the page'); break; }
    } catch (e) { fail(seed, 'layout threw', e.stack.split('\n').slice(0, 3).join(' | ')); break; }
  }
  // every sign in the chart is distinct from the others, and names can be borrowed
  const chart = script.chart.list ? script.chart.list.map((x) => x.segs) : script.chart.rows.flatMap((row) => row.cells);
  const shapes = new Map();
  for (const segs of chart) {
    const cells = script.wordCells(segs);
    const sig = JSON.stringify(cells.map((c) => c.s.map((s) => s.p.map(([x, y]) => [Math.round(x * 50), Math.round(y * 50)]))));
    if (shapes.has(sig)) { fail(seed, 'two signs alike', `${ph.rom(segs)} and ${shapes.get(sig)} (${script.family}/${script.kind})`); }
    shapes.set(sig, ph.rom(segs));
  }
  for (const name of ['Mahir', 'Yavuz', 'Strength', 'Aoife', 'Xavier', 'Zoë', 'Ng', 'A', 'Şükrü Çağ', 'Brrr']) {
    const b = ph.borrow(name);
    if (!b.length || ph.legal(b)) fail(seed, 'borrowed name', `${name} -> ${b.join(' ')}: ${ph.legal(b) || 'empty'}`);
  }
}
// the page colors its cover before any of this code has loaded, with a copy of the sums: the two must agree
{
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const inline = /<script>\n\/\/ Before anything is drawn[\s\S]*?<\/script>/.exec(html);
  if (!inline) fail(0, 'the opening script is missing from index.html');
  else {
    const code = inline[0].replace(/^<script>|<\/script>$/g, '');
    for (let seed = 1; seed <= 400; seed++) {
      const set = {};
      const doc = { documentElement: { classList: { replace() {} }, style: { setProperty: (k, v) => { set[k] = v; } } } };
      vm.runInNewContext(code, { document: doc, location: { hash: '#' + seed, search: '', pathname: '/works/020/' }, history: { replaceState() {} }, Math });
      const cover = makeLanguage(seed).cover;
      if (set['--ground'] !== cover[0] || set['--on'] !== cover[1] || set['--on-soft'] !== cover[2]) { fail(seed, 'cover color before load', `${set['--ground']} but the language has ${cover[0]}`); break; }
    }
  }
}

const groups = {};
for (const [k, v] of Object.entries(tally)) { const [g, ...rest] = k.split(' '); (groups[g] ||= []).push(`${rest.join(' ')} ${(100 * v / N).toFixed(0)}%`); }
for (const [g, list] of Object.entries(groups)) console.log(`${g}: ${list.sort().join(', ')}`);
console.log(bad ? `${bad} failures in ${N} languages` : `ok: ${N} languages`);
process.exit(bad ? 1 : 0);
