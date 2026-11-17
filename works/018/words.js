// words.js: small text helpers shared by fleet.js and the classes.

const WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
export const word = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n)).toLowerCase();
// 12400 -> '12 400'
export const thou = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const mm = (m) => thou(Math.round(m * 100) * 10);
