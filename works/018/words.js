// words.js: small text helpers shared by fleet.js and the classes.

const WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
export const word = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n)).toLowerCase();
// 12400 -> '12 400'
export const thou = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const mm = (m) => thou(Math.round(m * 100) * 10);

// A brief that is too long loses whole trailing clauses, never half a phrase.
export function fitBrief(s, max = 78) {
  s = String(s || '').trim();
  if (s.length <= max) return s;
  let t = s.replace(/\.$/, '');
  while (t.length + 1 > max) {
    let cut = -1;
    for (const sp of [' with ', ' and ', ', ', '; ']) cut = Math.max(cut, t.lastIndexOf(sp));
    if (cut < 24) {
      t = t.slice(0, max - 1).replace(/\s+\S*$/, '');
      t = t.replace(/(\s+(a|an|the|of|in|on|at|to|for|with|and|its|up|by|from|one|two))+$/i, '');
      break;
    }
    t = t.slice(0, cut);
  }
  return t + '.';
}

// 'one stewards' -> 'one steward', 'one foremen' -> 'one foreman'
const KEEP_S = new Set(['bus', 'brass', 'glass', 'pass', 'press', 'class', 'bellows', 'lens', 'chassis', 'canvas',
  'compass', 'mess', 'gas', 'axis', 'cross', 'plus', 'less', 'species', 'series', 'works', 'mains']);
export function oneOf(s) {
  return String(s || '').replace(/\b([Oo]ne) ([a-z]+)\b/g, (m, one, w) => {
    if (KEEP_S.has(w)) return m;
    if (/men$/.test(w)) return `${one} ${w.slice(0, -3)}man`;
    if (/[^s]s$/.test(w) && !/(us|is)$/.test(w)) return `${one} ${w.slice(0, -1)}`;
    return m;
  });
}
