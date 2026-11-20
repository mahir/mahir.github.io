// sounds.js: the sounds of one language. Which consonants and vowels it has, how they make
// syllables, what happens where two pieces of a word meet, and how it is spelled in Latin letters.
//
// A word is an array of segments. A segment is an IPA sound, with 'ː' after a long vowel and
// 'H' or 'L' after a vowel that carries a high or low tone: ['k', 'aːH', 'n'].

const c = (place, manner, voice, w, extra = '') => ({ place, manner, voice, w, extra });
// place: 0 lips, 1 teeth and the ridge behind them, 2 hard palate, 3 soft palate, 4 uvula, 5 throat
export const C = {
  p: c(0, 'stop', 0, 8), b: c(0, 'stop', 1, 5), 'pʰ': c(0, 'stop', 0, 3, 'asp'), 'pʼ': c(0, 'stop', 0, 2.5, 'ej'),
  t: c(1, 'stop', 0, 10), d: c(1, 'stop', 1, 6), 'tʰ': c(1, 'stop', 0, 3.5, 'asp'), 'tʼ': c(1, 'stop', 0, 3, 'ej'),
  k: c(3, 'stop', 0, 10), g: c(3, 'stop', 1, 4.5), 'kʰ': c(3, 'stop', 0, 3.5, 'asp'), 'kʼ': c(3, 'stop', 0, 3, 'ej'),
  q: c(4, 'stop', 0, 3), 'ʔ': c(5, 'stop', 0, 3),
  ts: c(1, 'aff', 0, 3), 'tʃ': c(2, 'aff', 0, 4), 'dʒ': c(2, 'aff', 1, 2.5),
  f: c(0, 'fric', 0, 3.5), v: c(0, 'fric', 1, 3), 'θ': c(1, 'fric', 0, 2, 'dental'),
  s: c(1, 'fric', 0, 8), z: c(1, 'fric', 1, 3), 'ʃ': c(2, 'fric', 0, 4), 'ʒ': c(2, 'fric', 1, 2),
  x: c(3, 'fric', 0, 3.5), 'ɣ': c(3, 'fric', 1, 2.5), h: c(5, 'fric', 0, 5),
  m: c(0, 'nasal', 1, 8), n: c(1, 'nasal', 1, 10), 'ɲ': c(2, 'nasal', 1, 2.5), 'ŋ': c(3, 'nasal', 1, 4),
  l: c(1, 'liquid', 1, 8), r: c(1, 'liquid', 1, 8, 'trill'),
  w: c(0, 'glide', 1, 4.5), j: c(2, 'glide', 1, 5),
};
// the order consonants are listed in, and laid out in the chart
export const C_ORDER = ['p', 'b', 'pʰ', 'pʼ', 't', 'd', 'tʰ', 'tʼ', 'k', 'g', 'kʰ', 'kʼ', 'q', 'ʔ', 'ts', 'tʃ', 'dʒ',
  'f', 'v', 'θ', 's', 'z', 'ʃ', 'ʒ', 'x', 'ɣ', 'h', 'm', 'n', 'ɲ', 'ŋ', 'l', 'r', 'w', 'j'];

// height 0 high to 2 low, backness 0 front to 2 back, rounded, and a base weight
const v = (h, b, r, w) => ({ h, b, r, w });
export const V = {
  i: v(0, 0, 0, 8), y: v(0, 0, 1, 3), 'ɨ': v(0, 1, 0, 3.5), 'ɯ': v(0, 2, 0, 4), u: v(0, 2, 1, 6.5),
  e: v(1, 0, 0, 7), 'ø': v(1, 0, 1, 3), 'ə': v(1, 1, 0, 4), o: v(1, 2, 1, 6),
  'ɛ': v(1.5, 0, 0, 4), 'ɔ': v(1.5, 2, 1, 4), a: v(2, 1, 0, 11),
};
export const V_ORDER = ['i', 'y', 'ɨ', 'ɯ', 'u', 'e', 'ø', 'ə', 'o', 'ɛ', 'ɔ', 'a'];

export const isV = (s) => s[0] in V;
export const base = (s) => s.replace(/[ːHL]/g, '');
export const isLong = (s) => s.includes('ː');
export const toneOf = (s) => (s.endsWith('H') ? 'H' : s.endsWith('L') ? 'L' : '');

const VOWEL_SYSTEMS = [
  { v: ['i', 'a', 'u'], w: 9 },
  { v: ['i', 'e', 'a', 'o', 'u'], w: 44 },
  { v: ['i', 'e', 'a', 'o'], w: 4 },
  { v: ['i', 'e', 'ə', 'a', 'o', 'u'], w: 8 },
  { v: ['i', 'ɨ', 'u', 'e', 'a', 'o'], w: 6 },
  { v: ['i', 'e', 'ɛ', 'a', 'ɔ', 'o', 'u'], w: 11 },
  { v: ['i', 'y', 'e', 'ø', 'a', 'o', 'u'], w: 8, harmony: 0.5, pairs: { a: 'e', o: 'ø', u: 'y' }, neutral: ['i'] },
  { v: ['i', 'y', 'ɯ', 'u', 'e', 'ø', 'a', 'o'], w: 7, harmony: 1, pairs: { a: 'e', 'ɯ': 'i', o: 'ø', u: 'y' }, neutral: [] },
];

export function makeSounds(r) {
  // ---------------------------------------------------------------- which sounds
  const size = r.weighted([['small', 0.2], ['mid', 0.55], ['large', 0.25]]);
  const k = size === 'small' ? 0 : size === 'mid' ? 1 : 2;
  const has = new Set(['p', 't', 'k', 'm', 'n']);
  const maybe = (ph, probs, cond = true) => { if (cond && r.chance(probs[k])) has.add(ph); };
  const liq = r.weighted([['both', size === 'small' ? 0.3 : 0.65], ['l', 0.2], ['r', 0.2]]);
  if (liq !== 'r') has.add('l');
  if (liq !== 'l') has.add('r');
  maybe('s', [0.75, 0.95, 0.98]);
  maybe('h', [0.6, 0.6, 0.7]);
  if (!has.has('s') && !has.has('h')) has.add(r.pick(['s', 'h']));
  const voiced = r.chance([0.12, 0.7, 0.85][k]);
  if (voiced) ['b', 'd', 'g'].forEach((x) => has.add(x));
  maybe('j', [0.5, 0.88, 0.95]);
  maybe('w', [0.6, 0.7, 0.75]);
  maybe('ʔ', [0.3, 0.18, 0.3]);
  maybe('f', [0.1, 0.45, 0.6]);
  maybe('ʃ', [0.05, 0.42, 0.65]);
  maybe('tʃ', [0.05, 0.42, 0.7]);
  maybe('ŋ', [0.2, 0.3, 0.45]);
  maybe('x', [0.03, 0.2, 0.4]);
  maybe('ts', [0, 0.14, 0.3]);
  maybe('q', [0, 0.08, 0.3]);
  maybe('ɲ', [0, 0.1, 0.25]);
  maybe('θ', [0, 0.03, 0.06]);
  maybe('z', [0.3, 0.45, 0.6], voiced && has.has('s'));
  maybe('v', [0.2, 0.35, 0.5], voiced);
  maybe('dʒ', [0.3, 0.5, 0.7], voiced && has.has('tʃ'));
  maybe('ʒ', [0, 0.25, 0.45], has.has('ʃ') && has.has('z'));
  maybe('ɣ', [0, 0.25, 0.4], has.has('x') && voiced);
  const third = k === 0 ? '' : r.weighted([['', 0.74], ['asp', 0.14], ['ej', 0.12]]);
  if (third === 'asp') ['pʰ', 'tʰ', 'kʰ'].forEach((x) => has.add(x));
  if (third === 'ej') ['pʼ', 'tʼ', 'kʼ'].forEach((x) => has.add(x));
  const cons = C_ORDER.filter((x) => has.has(x));

  const system = r.weighted(VOWEL_SYSTEMS.map((s) => [s, s.w]));
  const vowels = V_ORDER.filter((x) => system.v.includes(x));
  const long = r.chance(0.2);
  const tones = r.weighted([[0, 0.86], [2, 0.09], [3, 0.05]]);
  let harmony = null;
  if (system.harmony && r.chance(system.harmony)) {
    const back = Object.keys(system.pairs);
    const front = Object.values(system.pairs);
    harmony = { back, front, neutral: system.neutral, toFront: system.pairs, toBack: Object.fromEntries(Object.entries(system.pairs).map(([a, b]) => [b, a])) };
  }

  // ---------------------------------------------------------------- how they make syllables
  const sylType = r.weighted([
    ['CV', [0.5, 0.2, 0.08][k]],
    ['CVn', [0.3, 0.34, 0.27][k]],      // a syllable may close, but only with a few consonants
    ['CVC', [0.15, 0.3, 0.35][k]],
    ['CCVC', [0.05, 0.16, 0.3][k]],     // and may open with a stop and a liquid
  ]);
  const onsetOpt = r.chance(sylType === 'CV' ? 0.45 : 0.3);
  const clusters = sylType === 'CCVC' && (has.has('l') || has.has('r'));
  const coda = new Set();
  if (sylType === 'CVn') {
    const pool = r.shuffle(['n', 'n', 'm', 'ŋ', 'l', 'r', 's', 'k', 't'].filter((x) => has.has(x)));
    const n = r.int(1, 3);
    for (const x of pool) { if (coda.size < n) coda.add(x); }
    coda.add('n');
  } else if (sylType !== 'CV') {
    for (const x of cons) {
      const d = C[x];
      if (d.extra === 'asp' || d.extra === 'ej' || x === 'h' || x === 'ʔ' || d.manner === 'glide') continue;
      if (d.voice && (d.manner === 'stop' || d.manner === 'fric' || d.manner === 'aff')) continue;  // final devoicing, in effect
      coda.add(x);
    }
  }
  const codaP = sylType === 'CVn' ? 0.3 : 0.45;
  const stress = r.weighted([['first', 0.35], ['next to last', 0.4], ['last', 0.25]]);

  // how often each sound turns up: the common ones stay common, but every language leans its own way
  const wC = new Map(cons.map((x) => [x, C[x].w * Math.exp(r.gauss() * 0.55)]));
  const wV = new Map(vowels.map((x) => [x, V[x].w * Math.exp(r.gauss() * 0.4)]));
  // how long roots run: closed syllables and tones go with short words, open syllables with long ones
  const lean = r.weighted([['short', sylType === 'CV' ? 0.1 : 0.4], ['middle', 0.45], ['long', sylType === 'CV' ? 0.45 : 0.15]]);
  const lenDist = tones && lean !== 'long' ? [[0.85, 0.15, 0], [0.55, 0.45, 0], [0.25, 0.65, 0.1]]
    : lean === 'short' ? [[0.7, 0.3, 0], [0.4, 0.55, 0.05], [0.15, 0.7, 0.15]]
    : lean === 'middle' ? [[0.35, 0.6, 0.05], [0.12, 0.7, 0.18], [0.03, 0.57, 0.4]]
    : [[0.12, 0.7, 0.18], [0.03, 0.57, 0.4], [0, 0.4, 0.6]];

  const buffer = r.weighted([['j', 4], ['n', 2], ['h', 2], ['ʔ', 1.5], ['w', 1], ['s', 1], ['r', 1], ['t', 0.5], ['k', 0.5]].filter(([x]) => has.has(x)));
  const hiatus = r.weighted([['buffer', 0.7], ['elide', 0.3]]);
  const epBase = ['ɨ', 'ə', 'i', 'ɯ', 'u', 'a'].filter((x) => vowels.includes(x)).slice(0, 2);
  let epV = harmony ? (vowels.includes('ɯ') ? 'ɯ' : 'u') : r.pick(epBase);
  if (tones) epV += 'L';

  // ---------------------------------------------------------------- spelling in Latin letters
  const style = r.pick(['digraph', 'digraph', 'caron']);
  const dg = style === 'digraph';
  const rom = {};
  for (const x of cons) rom[x] = x;
  const asp = has.has('kʰ');
  const jIsY = has.has('dʒ') || dg || r.chance(0.5);
  Object.assign(rom, {
    'ʃ': dg ? 'sh' : 'š', 'tʃ': dg ? 'ch' : 'č', 'ʒ': dg ? 'zh' : 'ž', 'dʒ': 'j', j: jIsY ? 'y' : 'j',
    x: dg && !asp ? 'kh' : 'x', 'ɣ': dg ? 'gh' : 'ğ', 'ŋ': dg ? 'ng' : 'ŋ', 'ɲ': dg && jIsY ? 'ny' : 'ñ',
    ts: dg ? 'ts' : 'c', 'θ': asp ? 'θ' : 'th', 'ʔ': 'ʼ', 'pʰ': 'ph', 'tʰ': 'th', 'kʰ': 'kh', 'pʼ': 'pʼ', 'tʼ': 'tʼ', 'kʼ': 'kʼ',
  });
  const vr = { i: 'i', e: 'e', a: 'a', o: 'o', u: 'u', y: 'ü', 'ø': 'ö', 'ɯ': 'ı', 'ɨ': 'ï', 'ə': 'ë' };
  vr['ɛ'] = !vowels.includes('e') ? 'e' : tones ? 'ɛ' : 'è';
  vr['ɔ'] = !vowels.includes('o') ? 'o' : tones ? 'ɔ' : 'ò';
  const plainVowels = vowels.every((x) => 'ieaou'.includes(x));
  const longStyle = plainVowels && !tones && r.chance(0.45) ? 'macron' : 'double';
  const romSeg = (s) => {
    if (!isV(s)) return rom[s] ?? s;
    let out = vr[base(s)];
    if (isLong(s)) out = longStyle === 'macron' ? out + '̄' : out + out;
    const t = toneOf(s);
    if (t === 'H') out = out[0] + '́' + out.slice(1);
    if (t === 'L' && tones === 3) out = out[0] + '̀' + out.slice(1);
    return out.normalize('NFC');
  };
  const romanize = (segs) => segs.map(romSeg).join('');
  const ipaSeg = (s) => {
    if (!isV(s)) return s;
    const t = toneOf(s);
    return (base(s) + (t === 'H' ? '́' : t === 'L' && tones === 3 ? '̀' : '')).normalize('NFC') + (isLong(s) ? 'ː' : '');
  };

  // ---------------------------------------------------------------- making syllables and roots
  const pickC = (rr, ok = () => true) => rr.weighted(cons.filter(ok).map((x) => [x, wC.get(x)]));
  const classOf = (vb) => (!harmony ? '' : harmony.back.includes(vb) ? 'back' : harmony.front.includes(vb) ? 'front' : '');
  const pickV = (rr, cls) => rr.weighted(vowels.filter((x) => !harmony || !cls || classOf(x) === cls || harmony.neutral.includes(x)).map((x) => [x, wV.get(x)]));
  const tone = (rr) => (tones === 2 ? (rr.chance(0.4) ? 'H' : 'L') : tones === 3 ? rr.pick(['H', '', '', 'L']) : '');

  function syllable(rr, { first = false, last = false, cls = '', plain = false } = {}) {
    const out = [];
    let onset = null;
    if (!(first && onsetOpt && rr.chance(0.22))) {
      onset = pickC(rr, (x) => !(first && (x === 'ŋ' || x === 'ʔ')) && !(plain && C[x].extra));
      out.push(onset);
      const d = C[onset];
      if (clusters && !plain && rr.chance(0.2) && (d.manner === 'stop' || onset === 'f') && d.place !== 5 && d.place !== 4 && !d.extra) {
        const ls = ['r', 'l'].filter((x) => has.has(x) && !(x === 'l' && d.place === 1));
        if (ls.length) out.push(rr.pick(ls));
      }
    }
    let vb = pickV(rr, cls);
    for (let i = 0; i < 4 && ((onset === 'j' && vb === 'i') || (onset === 'w' && vb === 'u')); i++) vb = pickV(rr, cls);
    out.push(vb + (long && !plain && rr.chance(0.16) ? 'ː' : '') + tone(rr));
    if (coda.size && rr.chance(last ? codaP : codaP * 0.55)) {
      out.push(rr.weighted([...coda].map((x) => [x, wC.get(x)])));
    }
    return out;
  }

  function root(rr, n) {
    const cls = harmony ? rr.pick(['back', 'front']) : '';
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = syllable(rr, { first: i === 0, last: i === n - 1, cls });
      const prev = out[out.length - 1];
      if (prev && !isV(prev)) {
        // a closed syllable meets the next one: no doubled consonant, no three in a row
        if (prev === s[0] || (s.length > 1 && !isV(s[1])) || isV(s[0])) out.pop();
      }
      if (out.length && isV(out[out.length - 1]) && isV(s[0])) s.unshift(pickC(rr));
      out.push(...s);
    }
    return out;
  }

  // how many syllables a root gets: `rank` 0 for the commonest words, 2 for the rarest
  const rootLength = (rr, rank) => rr.weighted(lenDist[rank].map((w, i) => [i + 1, w]));

  // a small piece of grammar: an ending, a beginning, or a word of its own
  function affix(rr, kind) {
    const easy = (x) => !C[x].extra && x !== 'ʔ' && x !== 'q';
    const cv = () => { const s = syllable(rr, { plain: true, cls: harmony ? 'back' : '' }).filter((x, i, a) => !(i === a.length - 1 && !isV(x))); return s.length === 1 ? [pickC(rr, easy), ...s] : s; };
    // a vowel on its own is never the filler vowel, or an ending could not be told from the mending of a seam
    const vOnly = () => { let x = pickV(rr, harmony ? 'back' : ''); for (let i = 0; i < 8 && x === base(epV); i++) x = pickV(rr, harmony ? 'back' : ''); return [x + tone(rr)]; };
    const codaC = () => rr.weighted([...coda].map((x) => [x, wC.get(x)]));
    if (kind === 'word') {
      const s = cv();
      if (coda.size && rr.chance(0.3)) s.push(codaC());
      return s;
    }
    if (kind === 'suffix') {
      const shape = rr.weighted([['CV', 5], ['VC', coda.size ? 2.5 : 0], ['V', 1], ['C', coda.size ? 1.6 : 0]]);
      return shape === 'CV' ? cv() : shape === 'VC' ? [...vOnly(), codaC()] : shape === 'V' ? vOnly() : [codaC()];
    }
    const shape = rr.weighted([['CV', 6], ['V', 2], ['VC', coda.size ? 1.5 : 0]]);
    return shape === 'CV' ? cv() : shape === 'V' ? vOnly() : [...vOnly(), codaC()];
  }

  // ---------------------------------------------------------------- where two pieces meet
  const lastHarmonic = (segs, fromEnd = true) => {
    const list = fromEnd ? segs.slice().reverse() : segs;
    for (const s of list) { if (isV(s)) { const cl = classOf(base(s)); if (cl) return cl; } }
    return '';
  };
  // vowel harmony: an ending takes front or back vowels to match the word it joins
  function harmonize(aff, stem, fromEnd = true) {
    if (!harmony) return aff.slice();
    const cls = lastHarmonic(stem, fromEnd) || 'back';
    return aff.map((s) => {
      if (!isV(s)) return s;
      const b = base(s);
      const to = cls === 'front' ? harmony.toFront[b] : harmony.toBack[b];
      return to ? s.replace(b, to) : s;
    });
  }
  const ep = (stem, fromEnd) => harmonize([epV], stem, fromEnd)[0];

  function attachSuffix(cur, aff) {
    let a = harmonize(aff, cur, true);
    const last = cur[cur.length - 1];
    if (isV(last) && isV(a[0])) {
      a = hiatus === 'elide' && a.length > 1 ? a.slice(1) : [buffer, ...a];
    } else if (!isV(last) && !isV(a[0])) {
      const before = cur[cur.length - 2];
      if (a.length === 1 || !coda.has(last) || last === a[0] || (before && !isV(before)) || (a.length > 1 && !isV(a[1]))) a = [ep(cur, true), ...a];
    }
    return a;
  }
  function attachPrefix(pre, cur) {
    let p = harmonize(pre, cur, false);
    const last = p[p.length - 1];
    if (isV(last) && isV(cur[0])) p = [...p, buffer];
    else if (!isV(last) && !isV(cur[0])) {
      if (!coda.has(last) || last === cur[0] || (cur.length > 1 && !isV(cur[1]))) p = [...p, ep(cur, false)];
    }
    return p;
  }
  // two whole words made into one, as in a compound: only the seam is mended
  function weld(a, b) {
    const last = a[a.length - 1];
    if (isV(last) && isV(b[0])) return [...a, buffer, ...b];
    if (!isV(last) && !isV(b[0])) {
      const before = a[a.length - 2];
      if (!coda.has(last) || last === b[0] || (before && !isV(before)) || (b.length > 1 && !isV(b[1]))) return [...a, epV, ...b];
    }
    return [...a, ...b];
  }

  // ---------------------------------------------------------------- syllables of a finished word
  function syllabify(segs) {
    const nuclei = [];
    segs.forEach((s, i) => { if (isV(s)) nuclei.push(i); });
    if (!nuclei.length) return [{ onset: segs.slice(), nucleus: null, coda: [] }];
    const out = [];
    let start = 0;
    nuclei.forEach((ni, q) => {
      const next = nuclei[q + 1];
      let end;
      if (next === undefined) end = segs.length;
      else {
        const between = next - ni - 1;                      // consonants before the next vowel
        const toNext = between <= 1 ? between
          : between === 2 ? (clusters && C[segs[next - 1]]?.manner === 'liquid' && ['stop', 'fric'].includes(C[segs[next - 2]]?.manner) && !coda.has(segs[next - 2]) ? 2 : 1)
          : Math.min(2, between - 1);
        end = next - toNext;
      }
      out.push({ onset: segs.slice(start, ni), nucleus: segs[ni], coda: segs.slice(ni + 1, end) });
      start = end;
    });
    return out;
  }

  // is this word sayable in this language? (for the tests)
  const opensTogether = (a, b) => clusters && C[b]?.manner === 'liquid' && (C[a]?.manner === 'stop' || a === 'f') && !C[a].extra && C[a].place < 4;
  function legal(segs) {
    if (!segs.length || !segs.some(isV)) return 'no vowel';
    for (const s of segs) if (!has.has(s) && !(isV(s) && vowels.includes(base(s)))) return `no such sound: ${s}`;
    for (let i = 1; i < segs.length; i++) if (isV(segs[i]) && isV(segs[i - 1])) return 'two vowels in a row';
    let run = 0;
    for (let i = 0; i <= segs.length; i++) {
      if (i < segs.length && !isV(segs[i])) { run++; continue; }
      const cs = segs.slice(i - run, i);
      const atStart = i - run === 0;
      const atEnd = i === segs.length;
      if (atStart) {
        if (run > 2 || (run === 2 && !opensTogether(cs[0], cs[1]))) return `starts with ${cs.join('')}`;
      } else if (atEnd) {
        if (run > 1 || (run === 1 && !coda.has(cs[0]))) return `ends in ${cs.join('')}`;
      } else if (run === 2) {
        if (!coda.has(cs[0]) && !opensTogether(cs[0], cs[1])) return `${cs.join('')} in the middle`;
      } else if (run === 3) {
        if (!coda.has(cs[0]) || !opensTogether(cs[1], cs[2])) return `${cs.join('')} in the middle`;
      } else if (run > 3) return 'too many consonants together';
      run = 0;
    }
    return '';
  }

  // ---------------------------------------------------------------- a foreign name, said here
  const dist = (a, b) => {
    const A = C[a]; const B = C[b];
    const manners = ['stop', 'aff', 'fric', 'nasal', 'liquid', 'glide'];
    const md = A.manner === B.manner ? 0
      : (A.manner === 'liquid' && B.manner === 'liquid') ? 0.4
      : Math.min(3, 0.9 * Math.abs(manners.indexOf(A.manner) - manners.indexOf(B.manner)) + ((A.manner === 'nasal') !== (B.manner === 'nasal') ? 1.2 : 0));
    return Math.abs(A.place - B.place) * 0.8 + md + (A.voice !== B.voice ? 0.6 : 0) + (B.extra ? 0.3 : 0) + (a === 'l' && b === 'r' || a === 'r' && b === 'l' ? 0.5 : 0);
  };
  function nearestC(target) {
    if (has.has(target)) return target;
    if (!C[target]) return null;
    if (target === 'h' || target === 'ʔ') return ['h', 'x', 'ʔ'].find((x) => has.has(x)) || null;
    let best = null; let bd = Infinity;
    for (const x of cons) { const d = dist(target, x); if (d < bd) { bd = d; best = x; } }
    return bd > 2.6 ? null : best;
  }
  function nearestV(target) {
    if (vowels.includes(target)) return target;
    const T = V[target];
    let best = vowels[0]; let bd = Infinity;
    for (const x of vowels) {
      const d = Math.hypot(T.h - V[x].h, (T.b - V[x].b) * 0.8, (T.r - V[x].r) * 0.7);
      if (d < bd) { bd = d; best = x; }
    }
    return best;
  }
  const LATIN = {
    sch: ['ʃ'], tch: ['tʃ'], sh: ['ʃ'], ch: ['tʃ'], th: ['θ'], ph: ['f'], kh: ['x'], gh: ['g'], zh: ['ʒ'], ng: ['ŋ'], ck: ['k'], qu: ['k', 'w'],
    ts: ['ts'], tz: ['ts'], oo: ['u'], ee: ['i'], ou: ['u'], ie: ['i'], ea: ['i'], ai: ['a', 'j'], ay: ['e', 'j'], ey: ['e', 'j'], au: ['a', 'w'],
    a: ['a'], b: ['b'], c: ['k'], d: ['d'], e: ['e'], f: ['f'], g: ['g'], h: ['h'], i: ['i'], j: ['dʒ'], k: ['k'], l: ['l'], m: ['m'], n: ['n'],
    o: ['o'], p: ['p'], q: ['k'], r: ['r'], s: ['s'], t: ['t'], u: ['u'], v: ['v'], w: ['w'], x: ['k', 's'], y: ['j'], z: ['z'],
    'ç': ['tʃ'], 'ş': ['ʃ'], 'ğ': [], 'ı': ['ɯ'], 'ö': ['ø'], 'ü': ['y'], 'ñ': ['ɲ'], 'ß': ['s'], 'ø': ['ø'], 'å': ['o'], 'æ': ['e'],
  };
  // "Mahir" as this language would say it: each sound swapped for the nearest one it has, and
  // a vowel slipped in wherever its syllables would not hold the consonants.
  function borrow(text) {
    const raw = text.toLowerCase().normalize('NFC').replace(/[^\p{L}]/gu, '');
    const want = [];
    for (let i = 0; i < raw.length;) {
      let hit = null;
      for (const len of [3, 2, 1]) {
        const chunk = raw.slice(i, i + len);
        const key = chunk in LATIN ? chunk : (len === 1 ? chunk.normalize('NFD').replace(/[̀-ͯ]/g, '') : null);
        if (key && key in LATIN) {
          hit = LATIN[key].slice();
          if (key === 'c' && 'eiy'.includes(raw[i + 1] || '')) hit = ['s'];
          if (key === 'y' && !'aeiouöü'.includes(raw[i + 1] || '')) hit = ['i'];
          if (len === 1 && raw[i + 1] === chunk && !(chunk in V)) i++;      // doubled consonants are said once
          i += len;
          break;
        }
      }
      if (!hit) { i++; continue; }
      want.push(...hit);
    }
    let segs = [];
    for (const s of want) {
      const got = s in V ? nearestV(s) : nearestC(s);
      if (got) segs.push(got);
    }
    // mend it: no two vowels together, and no consonants where a syllable cannot hold them
    const out = [];
    const echo = () => { for (let i = out.length - 1; i >= 0; i--) if (isV(out[i])) return base(out[i]); return base(epV); };
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const prev = out[out.length - 1];
      if (isV(s)) {
        // between two vowels, the glide the first one already ends in; failing that, the language's own filler
        const glide = (v0) => (V[v0].b === 0 && has.has('j') ? 'j' : V[v0].r && has.has('w') ? 'w' : null);
        if (prev && isV(prev)) { if (base(prev) === s) continue; out.push(glide(base(prev)) || glide(s) || buffer); }
        if (!prev && !onsetOpt) out.push(['ʔ', 'h'].find((x) => has.has(x)) || glide(s) || buffer);
        out.push(s);
        continue;
      }
      if (prev && !isV(prev)) {
        const before = out[out.length - 2];
        const opens = clusters && C[s].manner === 'liquid' && C[prev].manner === 'stop' && isV(segs[i + 1] || '') && (!before || isV(before));
        const closes = coda.has(prev) && before && isV(before) && prev !== s;
        if (prev === s) continue;
        if (!opens && !closes) out.push(base(epV));
      }
      out.push(s);
    }
    const lastSeg = out[out.length - 1];
    if (lastSeg && !isV(lastSeg)) {
      const before = out[out.length - 2];
      if (!coda.has(lastSeg) || (before && !isV(before))) out.push(echo());
    }
    if (out.length && !out.some(isV)) out.push(base(epV));
    return out;
  }

  return {
    size, cons, vowels, long, tones, harmony, stress, sylType, onsetOpt, clusters, coda, buffer, hiatus, epV, style, longStyle,
    has: (x) => has.has(x), romMap: rom, romSeg, rom: romanize, ipaSeg, ipa: (segs) => segs.map(ipaSeg).join(''),
    syllable, root, rootLength, affix, harmonize, attachSuffix, attachPrefix, weld, syllabify, legal, borrow, classOf,
  };
}
