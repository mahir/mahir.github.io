// The towns the page asks about, north and south, chosen because snow is ordinary there
// for part of the year. Name, country, latitude, longitude. The page asks Open-Meteo about
// all of them in one request, then about the air above one of them.
(function (root) {
  'use strict';
  const TOWNS = [
    ['Sapporo', 'Japan', 43.06, 141.35],
    ['Asahikawa', 'Japan', 43.77, 142.36],
    ['Aomori', 'Japan', 40.82, 140.74],
    ['Harbin', 'China', 45.80, 126.53],
    ['Ulaanbaatar', 'Mongolia', 47.92, 106.92],
    ['Yakutsk', 'Russia', 62.03, 129.73],
    ['Norilsk', 'Russia', 69.35, 88.20],
    ['Novosibirsk', 'Russia', 55.03, 82.92],
    ['Murmansk', 'Russia', 68.97, 33.08],
    ['Almaty', 'Kazakhstan', 43.24, 76.89],
    ['Gulmarg', 'India', 34.05, 74.38],
    ['Leh', 'India', 34.15, 77.58],
    ['Erzurum', 'Turkey', 39.90, 41.27],
    ['Kars', 'Turkey', 40.60, 43.10],
    ['Rovaniemi', 'Finland', 66.50, 25.73],
    ['Kiruna', 'Sweden', 67.86, 20.23],
    ['Tromsø', 'Norway', 69.65, 18.96],
    ['Longyearbyen', 'Svalbard', 78.22, 15.63],
    ['Akureyri', 'Iceland', 65.68, -18.09],
    ['Nuuk', 'Greenland', 64.18, -51.72],
    ['Zakopane', 'Poland', 49.30, 19.95],
    ['Innsbruck', 'Austria', 47.27, 11.39],
    ['St. Anton', 'Austria', 47.13, 10.27],
    ['Davos', 'Switzerland', 46.80, 9.84],
    ['Zermatt', 'Switzerland', 46.02, 7.75],
    ['Chamonix', 'France', 45.92, 6.87],
    ['Cortina d’Ampezzo', 'Italy', 46.54, 12.14],
    ['Québec', 'Canada', 46.81, -71.21],
    ['Iqaluit', 'Canada', 63.75, -68.52],
    ['Yellowknife', 'Canada', 62.45, -114.37],
    ['Banff', 'Canada', 51.18, -115.57],
    ['Whistler', 'Canada', 50.12, -122.95],
    ['Syracuse', 'United States', 43.05, -76.15],
    ['Buffalo', 'United States', 42.89, -78.88],
    ['Marquette', 'United States', 46.54, -87.40],
    ['Aspen', 'United States', 39.19, -106.82],
    ['Truckee', 'United States', 39.33, -120.18],
    ['Anchorage', 'United States', 61.22, -149.90],
    ['Fairbanks', 'United States', 64.84, -147.72],
    ['Utqiaġvik', 'United States', 71.29, -156.79],
    ['Portillo', 'Chile', -32.84, -70.13],
    ['Bariloche', 'Argentina', -41.13, -71.31],
    ['Punta Arenas', 'Chile', -53.16, -70.92],
    ['Ushuaia', 'Argentina', -54.80, -68.30],
    ['Stanley', 'Falkland Islands', -51.69, -57.86],
    ['Villa Las Estrellas', 'Antarctica', -62.20, -58.96],
    ['Thredbo', 'Australia', -36.50, 148.30],
    ['Queenstown', 'New Zealand', -45.03, 168.66],
  ].map(([name, country, lat, lon]) => ({ name, country, lat, lon }));

  if (typeof module !== 'undefined' && module.exports) module.exports = TOWNS;
  else root.SnowTowns = TOWNS;
})(typeof self !== 'undefined' ? self : this);
