// prices.json: a shared calendar of 451 trading days and each company's closes on them. The last 252 days are the
// year; the 199 before them let the 50- and 200-day averages start on the year's first day.

export const YEAR = 252;

// The n-day average ending on each of the last `count` days.
export function movingAverage(closes, n, count = YEAR) {
  const out = new Array(count);
  const start = closes.length - count;
  let sum = 0;
  for (let k = start - n + 1; k <= start; k++) sum += closes[k];
  out[0] = sum / n;
  for (let i = 1; i < count; i++) {
    const k = start + i;
    sum += closes[k] - closes[k - n];
    out[i] = sum / n;
  }
  return out;
}

export function normalize(t) {
  return String(t || '').trim().toUpperCase().replace(/[-/]/g, '.');
}

export function decode(json, t) {
  const entry = json.tickers.find((e) => e.t === t);
  if (!entry) return null;
  const all = entry.closes;
  const closes = all.slice(-YEAR);
  const dates = json.dates.slice(-YEAR);
  let hiDay = 0, loDay = 0;
  closes.forEach((c, i) => { if (c > closes[hiDay]) hiDay = i; if (c < closes[loDay]) loDay = i; });
  const first = closes[0], last = closes[YEAR - 1];
  return {
    t: entry.t, name: entry.name, dates, closes,
    ma50: movingAverage(all, 50), ma200: movingAverage(all, 200),
    first, last, hi: closes[hiDay], lo: closes[loDay], hiDay, loDay,
    change: last / first - 1,
    through: json.through,
  };
}

// A ticker from ?t= when the list has it, otherwise a random one that isn't the last one shown, and, when there's
// any other choice, not one `avoid` turns down (so the next company stands in a different kind of land).
export function pick(json, { param = null, last = null, avoid = () => false, random = Math.random } = {}) {
  const symbols = json.tickers.map((e) => e.t);
  const asked = normalize(param);
  if (asked && symbols.includes(asked)) return asked;
  let pool = symbols.length > 1 ? symbols.filter((s) => s !== last) : symbols;
  const fresh = pool.filter((s) => !avoid(s));
  if (fresh.length) pool = fresh;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

// A stable seed per ticker, so the same company always grows the same mountains.
export function seedOf(t) {
  let h = 2166136261;
  for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
