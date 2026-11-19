// vocab.js: the words of the shop. What a listing can be, and how its attributes turn into a title.
// A listing is a row of small numbers (see world.js); everything a visitor reads about it is made here,
// so the generator (_world.js), the rankers (recs.js) and the page all say the same thing.

export const CRAFTS = [
  { id: 'mug', name: 'mug', plural: 'mugs', forms: ['mug', 'tall mug', 'espresso cup'], made: 'hand-thrown stoneware', base: 34 },
  { id: 'vase', name: 'vase', plural: 'vases', forms: ['bottle vase', 'bud vase', 'cylinder vase'], made: 'glazed ceramic', base: 58 },
  { id: 'rug', name: 'rug', plural: 'rugs', forms: ['runner', 'area rug', 'round rug'], made: 'handwoven wool', base: 210 },
  { id: 'print', name: 'print', plural: 'prints', forms: ['tall print', 'wide print', 'square print'], made: 'risograph on cotton paper', base: 42 },
  { id: 'candle', name: 'candle', plural: 'candles', forms: ['pillar candle', 'pair of taper candles', 'jar candle'], made: 'hand-poured beeswax', base: 24 },
  { id: 'earrings', name: 'earrings', plural: 'earrings', forms: ['hoop earrings', 'drop earrings', 'stud earrings'], made: 'enamel on brass', base: 38 },
  { id: 'tote', name: 'tote', plural: 'totes', forms: ['tote bag', 'bucket bag', 'market bag'], made: 'screen-printed canvas', base: 46 },
  { id: 'board', name: 'board', plural: 'boards', forms: ['round serving board', 'paddle board', 'cutting board'], made: 'oak with a painted end', base: 64 },
];

export const SURFACES = ['plain', 'striped', 'speckled', 'checked', 'botanical', 'geometric'];

// Ten colors, named the way a maker would name a glaze or a dye.
export const COLORS = [
  { id: 'rust', hex: '#b4532e' },
  { id: 'ochre', hex: '#d29a2c' },
  { id: 'moss', hex: '#5d6c38' },
  { id: 'sage', hex: '#a8b698' },
  { id: 'cobalt', hex: '#2e4d9b' },
  { id: 'teal', hex: '#2b7c78' },
  { id: 'blush', hex: '#e1a698' },
  { id: 'plum', hex: '#6b3a5c' },
  { id: 'cream', hex: '#efe4cc' },
  { id: 'charcoal', hex: '#34322f' },
];

export const craftIndex = (id) => CRAFTS.findIndex((c) => c.id === id);
export const surfaceIndex = (id) => SURFACES.indexOf(id);
export const colorIndex = (id) => COLORS.findIndex((c) => c.id === id);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// "Speckled rust mug"
export function title(l) {
  const s = SURFACES[l.surface];
  return cap(`${s === 'plain' ? '' : s + ' '}${COLORS[l.color].id} ${CRAFTS[l.craft].forms[l.form]}`);
}

// "Speckled rust mug, hand-thrown stoneware, with ochre"
export function longTitle(l) {
  const tail = l.accent !== l.color && SURFACES[l.surface] !== 'plain' ? `, with ${COLORS[l.accent].id}` : '';
  return `${title(l)}, ${CRAFTS[l.craft].made}${tail}`;
}

export const price = (cents) => (cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`);

// "today", "yesterday", "12 days ago"
export function listed(age) {
  if (age <= 0) return 'today';
  if (age === 1) return 'yesterday';
  if (age < 60) return `${age} days ago`;
  return `${Math.round(age / 30)} months ago`;
}

export const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many || one + 's'}`;
