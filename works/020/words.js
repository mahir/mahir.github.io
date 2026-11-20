// words.js: the meanings every language here has a word for, and how a language makes its words.
// Most words are roots. Some are made of two others, the way a tear is "eye-water" in Thai and
// Indonesian; which ones, and out of what, differs from language to language.

// [singular, plural, is it alive, how common: 0 the commonest (shortest roots), 2 the rarest]
export const NOUNS = {
  person: ['person', 'people', 1, 0], woman: ['woman', 'women', 1, 1], man: ['man', 'men', 1, 1], child: ['child', 'children', 1, 1],
  mother: ['mother', 'mothers', 1, 0], father: ['father', 'fathers', 1, 0], friend: ['friend', 'friends', 1, 1],
  stranger: ['stranger', 'strangers', 1, 2], fisherman: ['fisherman', 'fishermen', 1, 2],
  dog: ['dog', 'dogs', 1, 1], bird: ['bird', 'birds', 1, 1], fish: ['fish', 'fish', 1, 1],
  tree: ['tree', 'trees', 0, 1], stone: ['stone', 'stones', 0, 1], water: ['water', 'waters', 0, 0], fire: ['fire', 'fires', 0, 0],
  sun: ['sun', 'suns', 0, 0], moon: ['moon', 'moons', 0, 1], star: ['star', 'stars', 0, 1], sky: ['sky', 'skies', 0, 1],
  earth: ['earth', 'earths', 0, 1], mountain: ['mountain', 'mountains', 0, 1], river: ['river', 'rivers', 0, 1], sea: ['sea', 'seas', 0, 1],
  rain: ['rain', 'rains', 0, 1], snow: ['snow', 'snows', 0, 2], wind: ['wind', 'winds', 0, 1], cloud: ['cloud', 'clouds', 0, 2],
  house: ['house', 'houses', 0, 0], door: ['door', 'doors', 0, 2], boat: ['boat', 'boats', 0, 1], road: ['road', 'roads', 0, 1],
  eye: ['eye', 'eyes', 0, 0], hand: ['hand', 'hands', 0, 0], mouth: ['mouth', 'mouths', 0, 0], heart: ['heart', 'hearts', 0, 1],
  word: ['word', 'words', 0, 0], name: ['name', 'names', 0, 1], night: ['night', 'nights', 0, 0], day: ['day', 'days', 0, 0],
  salt: ['salt', 'salts', 0, 1], bread: ['bread', 'breads', 0, 1],
  tear: ['tear', 'tears', 0, 2], milk: ['milk', 'milks', 0, 2], volcano: ['volcano', 'volcanoes', 0, 2], thunder: ['thunder', 'thunders', 0, 2],
  lightning: ['lightning', 'lightnings', 0, 2], wave: ['wave', 'waves', 0, 2], ice: ['ice', 'ices', 0, 2], dew: ['dew', 'dews', 0, 2],
  writing: ['writing', 'writings', 0, 2],
};
// [dictionary form, with -s, past, how many things it needs: 1 just a doer, 2 a doer and a thing, 3 and someone to receive it]
export const VERBS = {
  sleep: ['sleep', 'sleeps', 'slept', 1, 0], sing: ['sing', 'sings', 'sang', 1, 1], come: ['come', 'comes', 'came', 1, 0],
  see: ['see', 'sees', 'saw', 2, 0], hear: ['hear', 'hears', 'heard', 2, 1], eat: ['eat', 'eats', 'ate', 2, 0],
  love: ['love', 'loves', 'loved', 2, 1], carry: ['carry', 'carries', 'carried', 2, 1], give: ['give', 'gives', 'gave', 3, 0],
  go: ['go', 'goes', 'went', 1, 0], drink: ['drink', 'drinks', 'drank', 2, 1], know: ['know', 'knows', 'knew', 2, 1], speak: ['speak', 'speaks', 'spoke', 1, 1],
};
export const ADJECTIVES = {
  big: 0, small: 0, good: 0, old: 1, new: 1, long: 1, cold: 1, red: 1, white: 1, black: 1,
};

// What a made-up word can be made of, as [what describes, what it is]. A language uses one of these or
// keeps a root of its own. Listed so that anything used as a part is decided before what is built on it.
const MADE = [
  ['sun', [['day', 'eye']]],
  ['moon', [['night', 'sun']]],
  ['star', [['night', 'fire'], ['sky', 'eye']]],
  ['sea', [['big', 'water'], ['salt', 'water']]],
  ['river', [['water', 'road'], ['water', 'mother']]],
  ['tear', [['eye', 'water']]],
  ['milk', [['mother', 'water']]],
  ['dew', [['night', 'water']]],
  ['ice', [['water', 'stone']]],
  ['wave', [['water', 'mountain']]],
  ['boat', [['water', 'house']]],
  ['door', [['house', 'mouth']]],
  ['fisherman', [['fish', 'person']]],
  ['friend', [['heart', 'person']]],
  ['stranger', [['road', 'person']]],
  ['child', [['small', 'person']]],
  ['snow', [['white', 'rain'], ['cold', 'rain']]],
  ['cloud', [['sky', 'water'], ['rain', 'mother']]],
  ['volcano', [['fire', 'mountain']]],
  ['thunder', [['sky', 'word']]],
  ['lightning', [['sky', 'fire']]],
  ['writing', [['hand', 'word']]],
];
// where a real language makes the same word the same way
export const REAL = {
  'eye+water': 'Thai (nam ta) and Indonesian (air mata) say “water of the eye” too',
  'day+eye': 'Malay says it the same way: matahari, the eye of the day',
  'fire+mountain': 'Mandarin (huǒshān) and Icelandic (eldfjall) both say “fire mountain”',
  'water+mother': 'Thai does the same: mae nam, mother of water',
};

const RUDE = /fuc|fuk|shit|cunt|cock|dick|piss|puss|nig|fag|kike|slut|whor|rape|anal|anus|tit|cum|sex|nazi|jew|poo|pee|ass|kkk|sperm|penis|vagin|bitch|damn|hell|homo|porn|wank|twat|arse|butt|dum|kill|dead|die/;

export function makeWords(r, ph, { headFinal, reserved = [] }) {
  const used = new Set(reserved);      // spellings already taken, by the grammar's small words to begin with
  const lex = {};        // id -> { segs, parts? }
  const taken = (segs) => used.has(ph.rom(segs));
  const claim = (segs) => { used.add(ph.rom(segs)); return segs; };

  function newRoot(rank, minLen = 2) {
    for (let tries = 0; tries < 80; tries++) {
      const n = ph.rootLength(r, rank) + (tries > 40 ? 1 : 0);
      const segs = ph.root(r, n);
      const key = ph.rom(segs).toLowerCase();
      if (segs.length < minLen || taken(segs) || RUDE.test(key.normalize('NFD').replace(/[̀-ͯ]/g, ''))) continue;
      return claim(segs);
    }
    return claim(ph.root(r, 3));
  }

  const made = new Map(MADE);
  const order = [...Object.keys(NOUNS).filter((id) => !made.has(id)), ...Object.keys(ADJECTIVES), ...MADE.map(([id]) => id), ...Object.keys(VERBS)];
  const fondness = r.range(0.45, 0.8);       // how readily this language builds a word instead of coining one
  for (const id of order) {
    const options = made.get(id);
    if (options && r.chance(fondness)) {
      const usable = options.filter(([a, b]) => lex[a] && lex[b] && !lex[a].parts && !lex[b].parts);
      if (usable.length) {
        const [a, b] = r.pick(usable);
        const [first, second] = headFinal ? [a, b] : [b, a];
        const segs = ph.weld(lex[first].segs, lex[second].segs);
        if (!taken(segs)) { lex[id] = { segs: claim(segs), parts: [a, b], order: [first, second] }; continue; }
      }
    }
    const rank = id in NOUNS ? NOUNS[id][3] : id in VERBS ? VERBS[id][4] : ADJECTIVES[id];
    lex[id] = { segs: newRoot(rank) };
  }

  // ---------------------------------------------------------------- counting
  const system = r.weighted([['ten', 0.6], ['five', 0.24], ['take away', 0.16]]);
  const handFive = r.chance(0.28) && !lex.hand.parts;
  const num = {};
  const lit = {};
  for (const n of [1, 2, 3, 4]) num[n] = newRoot(0);
  num[5] = handFive ? lex.hand.segs : newRoot(0);
  if (handFive) lit[5] = 'hand';
  const add = (a, b) => (headFinal ? ph.weld(num[a], num[b]) : ph.weld(num[a], num[b]));
  if (system === 'five') {
    for (const n of [6, 7, 8, 9]) { num[n] = add(5, n - 5); lit[n] = `${handFive ? 'hand' : 'five'} and ${['one', 'two', 'three', 'four'][n - 6]}`; }
    if (r.chance(0.55)) { num[10] = ph.weld(num[2], num[5]); lit[10] = handFive ? 'two hands' : 'two fives'; } else num[10] = newRoot(0);
  } else {
    for (const n of [6, 7]) num[n] = newRoot(1);
    num[10] = newRoot(0);
    if (system === 'take away') {
      const from = ph.affix(r, 'suffix');
      const less = (k) => { const a = num[k]; return ph.weld([...a, ...ph.attachSuffix(a, from)], num[10]); };
      num[8] = less(2); lit[8] = 'two from ten';
      num[9] = less(1); lit[9] = 'one from ten';
    } else { num[8] = newRoot(1); num[9] = newRoot(1); }
  }
  for (const n of Object.keys(num)) used.add(ph.rom(num[n]));
  const scoreIsPerson = r.chance(0.18) && !lex.person.parts;
  const twenty = scoreIsPerson
    ? { words: [num[1], lex.person.segs], lit: 'one person: all the fingers and toes' }
    : { words: [num[2], num[10]], lit: 'two tens' };

  return { lex, num, numLit: lit, numSystem: system, handFive, twenty, scoreIsPerson, newRoot, claim, taken, headFinal };
}
