// english.js: the meaning side of the sentence. A sentence is a small object (who, does what, to
// what, when, not, asked); this file says it in English, in pieces the page can make tappable.

import { NOUNS, VERBS } from './words.js';

export const WHO = ['I', 'you', 'we', 'they'];
export const PRON = { I: '1SG', you: '2SG', we: '1PL', they: '3PL' };
export const SUBJECTS = ['woman', 'man', 'child', 'fisherman', 'friend', 'stranger', 'dog', 'bird'];
export const OBJECTS = ['bird', 'fish', 'dog', 'child', 'woman', 'stranger', 'stone', 'tree', 'house', 'boat', 'bread', 'moon', 'star'];
export const VERB_LIST = ['sleep', 'sing', 'come', 'see', 'hear', 'eat', 'love', 'carry', 'give'];
export const ADJ_LIST = ['old', 'big', 'small', 'good', 'red'];

export const START = {
  subj: { noun: 'fisherman', n: 1, adj: null, def: true },
  verb: 'see',
  obj: { noun: 'bird', n: 2, adj: null, def: false },
  rec: { noun: 'child', n: 1, adj: null, def: true },
  time: 'past', not: false, ask: false, src: 'seen',
};

// the short tale every language tells: the same four sentences, so two languages can be read side by side
export const TALE = [
  { subj: { noun: 'fisherman', n: 1, adj: 'old', def: false }, verb: 'see', obj: { noun: 'bird', n: 2, adj: 'small', def: false }, time: 'past' },
  { subj: { noun: 'bird', n: 3, adj: null, def: true }, verb: 'sing', time: 'past', not: true },
  { subj: { noun: 'fisherman', n: 1, adj: null, def: true }, verb: 'give', obj: { noun: 'fish', n: 1, adj: null, def: false }, rec: { noun: 'bird', n: 3, adj: null, def: true }, time: 'past' },
  { subj: { noun: 'bird', n: 3, adj: null, def: true }, verb: 'sing', time: 'now' },
].map((s) => ({ rec: START.rec, obj: START.obj, not: false, ask: false, src: 'seen', ...s }));

const an = (next) => (/^[aeiou]/.test(next) ? 'an' : 'a');

export function nounPhrase(spec, { object = false } = {}) {
  if (spec.pron) {
    const key = Object.keys(PRON).find((k) => PRON[k] === spec.pron);
    return object ? { I: 'me', you: 'you', we: 'us', they: 'them' }[key] : key;
  }
  const noun = NOUNS[spec.noun][spec.n > 1 ? 1 : 0];
  const rest = (spec.adj ? spec.adj + ' ' : '') + noun;
  if (spec.n === 2) return (spec.def ? 'the two ' : 'two ') + rest;
  if (spec.def) return 'the ' + rest;
  return spec.n === 1 ? `${an(rest)} ${rest}` : rest;
}

// The sentence as pieces: { t: text, chip: 'subj' | 'verb' | 'obj' | 'rec' | undefined }
export function english(S) {
  const [baseForm, sForm, past, valency] = VERBS[S.verb];
  const subj = nounPhrase(S.subj);
  const third = !S.subj.pron && S.subj.n === 1;
  const out = [];
  const say = (t, chip) => out.push({ t, chip });
  const cap = (s) => (s === 'I' ? s : s[0].toUpperCase() + s.slice(1));
  if (S.ask) {
    say(S.time === 'past' ? 'Did ' : S.time === 'later' ? 'Will ' : third ? 'Does ' : 'Do ');
    say(subj, 'subj');
    say(S.not ? ' not ' : ' ');
    say(baseForm, 'verb');
  } else {
    say(cap(subj), 'subj');
    if (S.not) say(S.time === 'past' ? ' did not ' : S.time === 'later' ? ' will not ' : third ? ' does not ' : ' do not ');
    else say(S.time === 'later' ? ' will ' : ' ');
    say(S.not || S.time === 'later' ? baseForm : S.time === 'past' ? past : third ? sForm : baseForm, 'verb');
  }
  if (valency >= 2) { say(' '); say(nounPhrase(S.obj, { object: true }), 'obj'); }
  if (valency === 3) { say(' to '); say(nounPhrase(S.rec, { object: true }), 'rec'); }
  if (S.src === 'heard' && !S.ask) say(', they say');
  say(S.ask ? '?' : '.');
  return out;
}

export const plain = (S) => english(S).map((p) => p.t).join('');
