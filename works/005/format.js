// How numbers and dates read on the page: "$1,234.56", "−44.1%", "28 Oct 2026". Dates are calendar days as the
// data gives them (YYYY-MM-DD), never shifted through a time zone.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MINUS = '−';

export function money(x) {
  return '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(change) {
  const v = Math.round(change * 1000) / 10;
  if (v === 0) return '0.0%';
  return (v < 0 ? MINUS : '+') + Math.abs(v).toFixed(1) + '%';
}

export function day(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function shortDay(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function span(dates) {
  return `${day(dates[0])} – ${day(dates[dates.length - 1])}`;
}

export function moved(change) {
  const p = Math.round(Math.abs(change) * 100);
  if (p === 0) return 'about level';
  return `${change < 0 ? 'down' : 'up'} ${p}%`;
}

// What a screen reader hears for the range on view.
export function summary(d) {
  return `${d.name} (${d.t}), the year to ${day(d.dates[d.dates.length - 1])}: from ${money(d.first)} to ${money(d.last)}, `
    + `${moved(d.change)}. High ${money(d.hi)} on ${shortDay(d.dates[d.hiDay])}, low ${money(d.lo)} on ${shortDay(d.dates[d.loDay])}.`;
}
