// language.js: a whole language from one number. Sounds first, then the grammar's choices, then
// the words, then the writing. The same number always gives the same language.

import { makeRng } from './rng.js';
import { makeSounds, C } from './sounds.js';
import { makeGrammar } from './grammar.js';
import { makeWords } from './words.js';
import { makeScript } from './script.js';
import { START, VERB_LIST } from './english.js';

export const MAX = 99999;
export const clampSeed = (n) => ((Math.abs(Math.floor(Number(n) || 0)) - 1) % MAX + MAX) % MAX + 1;

// cloth for the cover: [ground, ink on it, a softer ink on it]
const COVERS = [
  ['#d5452b', '#17110e', '#4a1208'], ['#1f2c5c', '#f3ead6', '#aab3d6'], ['#dba63d', '#1a1408', '#553a08'],
  ['#1f4b3c', '#f1ead7', '#9fc1b0'], ['#5a2040', '#f4e9dc', '#cfa3ba'], ['#e6b0a0', '#1c1210', '#63302a'],
  ['#17130f', '#f2ead9', '#a59a86'], ['#2f6f7e', '#f3ecdb', '#b4d4d8'], ['#2646c4', '#f4ecd8', '#b3bff0'],
  ['#8a2b1c', '#f5e8d6', '#e0a898'], ['#3b4a1f', '#f1ecd4', '#b9c492'], ['#9fb7a6', '#141a15', '#2c4033'],
];

export function makeLanguage(seedIn) {
  const seed = clampSeed(seedIn);
  const root = makeRng(seed * 2654435761);
  const ph = makeSounds(root.fork('sounds'));
  // Now and then an ending and the mending of a seam come out alike, and "did not sing" sounds just
  // like "sang". Real languages live with such things; here the grammar is drawn again instead.
  let G; let words;
  for (let k = 0; k < 6; k++) {
    G = makeGrammar(root.fork(k ? `grammar ${k}` : 'grammar'), ph);
    words = makeWords(root.fork('words'), ph, { headFinal: G.headFinal, reserved: G.reserved });
    if (tellsApart({ ph, G, words })) break;
  }
  const r = root.fork('name');

  // what the language calls itself
  const { lex } = words;
  const join = (a, b) => (G.headFinal ? ph.weld(a, b) : ph.weld(b, a));
  const kinds = r.shuffle([
    ['people', () => join(lex.person.segs, lex.word.segs), 'the people’s word'],
    ['people', () => join(lex.person.segs, lex.mouth.segs), 'the people’s mouth'],
    ['ours', () => join(G.pron['1PL'].flat(), lex.word.segs), 'our word'],
    ['place', () => join(lex.river.segs, lex.word.segs), 'the word of the river'],
    ['place', () => join(lex.mountain.segs, lex.word.segs), 'the word of the mountain'],
    ['place', () => join(lex.sea.segs, lex.mouth.segs), 'the mouth of the sea'],
  ]);
  let nameSegs = null; let nameMeans = '';
  if (r.chance(0.82)) {
    for (const [, make, means] of kinds) {
      const s = make();
      if (ph.rom(s).length <= 9 && !words.taken(s)) { nameSegs = s; nameMeans = means; break; }
    }
  }
  if (!nameSegs) { nameSegs = words.newRoot(1, 4); nameMeans = ''; }
  const romName = ph.rom(nameSegs);
  const name = romName.replace(/^ʼ/, '').replace(/^./u, (ch) => ch.toLocaleUpperCase('en'));

  const lang = { seed, ph, G, words, nameSegs, name, nameMeans, cover: COVERS[root.fork('cover').int(0, COVERS.length - 1)] };
  lang.script = makeScript(root.fork('script'), lang);
  lang.twenty = words.scoreIsPerson ? words.twenty.words : (G.numOrder === 'NumN' ? words.twenty.words : words.twenty.words.slice().reverse());
  lang.say = (S) => G.realize(lang, S);
  lang.facts = [
    ...G.summary,
    `${ph.cons.length} consonants, ${ph.vowels.length} vowels${ph.tones ? `, ${ph.tones} tones` : ''}`,
    lang.script.summary,
  ];
  return lang;
}

// does "not" always change the sentence, and asking, and the past?
function tellsApart(lang) {
  const line = (S) => lang.G.realize(lang, S).words.map((w) => lang.ph.rom(w.segs)).join(' ');
  for (const verb of VERB_LIST) for (const subj of [{ noun: 'bird', n: 1, def: true }, { noun: 'bird', n: 3, def: true }, { pron: '1SG' }, { pron: '2SG' }, { pron: '1PL', incl: true }, { pron: '3PL' }]) {
    for (const time of ['past', 'now', 'later']) {
      const S = { ...START, subj, verb, time };
      const plainLine = line(S);
      if (line({ ...S, not: true }) === plainLine) return false;
      if (lang.G.q.type !== 'voice' && line({ ...S, ask: true }) === plainLine) return false;
      if (time === 'past' && line({ ...S, time: 'now' }) === plainLine) return false;
    }
  }
  return true;
}

// the consonants as a chart: rows by how the sound is made, columns by where
export function consonantChart(ph) {
  const rows = [['stop', 'Stopped'], ['aff', 'Stopped, then hissed'], ['fric', 'Hissed'], ['nasal', 'Through the nose'], ['liquid', 'Flowing'], ['glide', 'Gliding']];
  const cols = ['Lips', 'Teeth', 'Palate', 'Back of the mouth', 'Further back', 'Throat'];
  const used = cols.map((_, i) => ph.cons.some((x) => C[x].place === i));
  return {
    cols: cols.filter((_, i) => used[i]),
    rows: rows.map(([m, label]) => ({ label, cells: cols.map((_, i) => ph.cons.filter((x) => C[x].manner === m && C[x].place === i)).filter((_, i) => used[i]) })).filter((row) => row.cells.some((cell) => cell.length)),
  };
}
