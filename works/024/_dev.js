// No. 024, dev pages only (not published, and nothing published imports it):
// a city's drawing with its type loaded, as the page does it.
export async function ready(id, wait = 6000) {
  const { city } = await import(`./cities/${id}.js`);
  if (city.google && !document.querySelector(`link[data-q="${CSS.escape(city.google)}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?${city.google}&display=swap`; l.dataset.q = city.google;
    document.head.appendChild(l);
    await new Promise((r) => { l.onload = r; l.onerror = r; });
  }
  await Promise.race([
    Promise.all((city.fonts || []).map((f) => (Array.isArray(f) ? document.fonts.load(f[0], f[1]) : document.fonts.load(f)).catch(() => null))),
    new Promise((r) => setTimeout(r, wait)),
  ]);
  return city;
}
