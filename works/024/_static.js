// No. 024: after adding a city or changing one's name, wall or description, run
//   node works/024/_static.js
// (and, for a new city or a changed look, node works/024/_thumbs.js <id>, its picture
// in the index). It reads every city file named in ORDER and writes
//   cities/index.js   the list the page reads (each city's file loads only when its turn comes)
//   index.html        the list of posters in the page's text, for readers without scripts
// ORDER is the order the posters are printed in: keep neighbors unlike each other
// (not two harbors, two night scenes or two script titles in a row).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const ORDER = [
  'new-york', 'tokyo', 'paris', 'mexico-city', 'cairo', 'london', 'sydney', 'istanbul', 'rio',
  'venice', 'seoul', 'san-francisco', 'amsterdam', 'marrakech', 'reykjavik', 'washington',
  'shanghai', 'copenhagen', 'los-angeles', 'beirut', 'madrid', 'miami', 'havana', 'moscow',
  'vancouver', 'cartagena', 'seville', 'toronto', 'ulaanbaatar', 'barcelona', 'fez',
  'new-orleans', 'lisbon', 'manila', 'las-vegas', 'krakow', 'muscat', 'ho-chi-minh-city',
  'berlin', 'delhi', 'lima', 'rome', 'taipei', 'montreal', 'zurich', 'isfahan', 'dakar', 'oslo',
  'hanoi', 'varanasi', 'marseille', 'quito', 'beijing', 'dublin', 'cusco', 'singapore', 'porto',
  'dubai', 'zanzibar', 'prague', 'osaka', 'baku', 'florence', 'honolulu', 'colombo', 'naples',
  'hong-kong', 'lagos', 'edinburgh', 'mumbai', 'wellington', 'vienna', 'buenos-aires', 'boston',
  'brussels', 'kuala-lumpur', 'valparaiso', 'st-petersburg', 'chicago', 'bangkok', 'stockholm',
  'nairobi', 'kyoto', 'budapest', 'tunis', 'melbourne', 'munich', 'jaipur', 'seattle', 'nice',
  'kathmandu', 'samarkand', 'helsinki', 'cape-town', 'auckland', 'athens', 'macau', 'la-paz',
  'dubrovnik', 'yangon',
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = [];
const problems = [];
for (const id of ORDER) {
  const file = join(here, 'cities', `${id}.js`);
  if (!existsSync(file)) { problems.push(`${id}: no file`); continue; }
  const { city } = await import(pathToFileURL(file).href);
  if (!city) { problems.push(`${id}: no export named city`); continue; }
  if (city.id !== id) problems.push(`${id}: its id is ${city.id}`);
  for (const k of ['name', 'wall', 'alt', 'google']) if (!city[k]) problems.push(`${id}: no ${k}`);
  rows.push({ id, name: city.name, wall: city.wall, alt: city.alt });
}
if (new Set(ORDER).size !== ORDER.length) problems.push('a city is in ORDER twice');
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const js = `// No. 024: the cities, in the order they are printed. Written by _static.js from
// ORDER there and each city's own file: edit those, not this. A city's drawing
// is in cities/<id>.js and loads when its turn comes.
export const CITIES = [
${rows.map((r) => `  ${JSON.stringify(r)},`).join('\n')}
];

export const load = (id) => import(\`./\${id}.js\`).then((m) => m.city);
`;
writeFileSync(join(here, 'cities', 'index.js'), js);

const page = join(here, 'index.html');
const html = readFileSync(page, 'utf8');
const list = `    <ol>\n${rows.map((r) => `      <li>${esc(r.name)}. ${esc(r.alt)}.</li>`).join('\n')}\n    </ol>\n`;
const out = html.replace(/    <ol>\n[\s\S]*?\n    <\/ol>\n/, list);
if (out === html && !html.includes(list)) { console.error('index.html: no <ol> to replace'); process.exit(1); }
writeFileSync(page, out);
console.log(`${rows.length} cities written to cities/index.js and index.html`);
