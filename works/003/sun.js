// Where the sun stands over Manhattan at a given moment, and when it next lines up with the street grid.
// Solar position after NOAA's spreadsheet method (good to a fraction of a degree for centuries around now);
// clock times are New York's own, daylight saving included, from the browser's time zone data.

export const LAT = 40.758;              // Times Square
export const LON = -73.986;
export const GRID = 29;                 // the street grid is turned 29° east of true north
export const ZONE = 'America/New_York';

const rad = Math.PI / 180;
const sin = (d) => Math.sin(d * rad), cos = (d) => Math.cos(d * rad), tan = (d) => Math.tan(d * rad);
const mod = (a, n) => ((a % n) + n) % n;

// atmospheric refraction near the horizon, in degrees, for a true elevation in degrees
function refraction(e) {
  if (e > 85) return 0;
  const t = tan(e);
  const arcsec = e > 5 ? 58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5
    : e > -0.575 ? 1735 + e * (-518.2 + e * (103.4 + e * (-12.79 + e * 0.711)))
    : -20.774 / t;
  return arcsec / 3600;
}

// { elevation, azimuth } in degrees: elevation as seen (with refraction), azimuth clockwise from true north
export function sunAt(ms) {
  const jd = ms / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sin(2 * M) * (0.019993 - 0.000101 * T) + sin(3 * M) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * sin(omega);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * cos(omega);
  const decl = Math.asin(sin(eps) * sin(lambda)) / rad;
  const y = tan(eps / 2) ** 2;
  const eot = 4 / rad * (y * sin(2 * L0) - 2 * e * sin(M) + 4 * e * y * sin(M) * cos(2 * L0)
    - 0.5 * y * y * sin(4 * L0) - 1.25 * e * e * sin(2 * M));          // equation of time, minutes
  const utcMinutes = mod(ms, 86400000) / 60000;
  const ha = mod(utcMinutes + eot + 4 * LON, 1440) / 4 - 180;            // hour angle, degrees
  const zenith = Math.acos(sin(LAT) * sin(decl) + cos(LAT) * cos(decl) * cos(ha)) / rad;
  const azimuth = mod(Math.atan2(sin(ha), cos(ha) * sin(LAT) - tan(decl) * cos(LAT)) / rad + 180, 360);
  const elevation = 90 - zenith;
  return { elevation: elevation + refraction(elevation), azimuth };
}

// ---------- New York clock time ----------

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
});

// the wall clock in New York at a moment: { y, m, d, h, min, s }
export function nyClock(ms) {
  const p = Object.fromEntries(partsFormat.formatToParts(new Date(ms)).map(({ type, value }) => [type, Number(value)]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24, min: p.minute, s: p.second };
}

const offset = (ms) => {
  const c = nyClock(ms);
  return Date.UTC(c.y, c.m - 1, c.d, c.h, c.min, c.s) - Math.floor(ms / 1000) * 1000;
};

// the moment New York's clocks read y-m-d and `minutes` past midnight
export function nyMoment(y, m, d, minutes) {
  const guess = Date.UTC(y, m - 1, d, 0, 0) + minutes * 60000;
  const first = guess - offset(guess);
  const second = guess - offset(first);
  return second;
}

export const minutesOfDay = (ms) => { const c = nyClock(ms); return c.h * 60 + c.min + c.s / 60; };

// ---------- the sun and the grid ----------

// the sun's bearing measured in the grid: 270 is straight down the cross streets toward the Hudson
export const gridBearing = (azimuth) => mod(azimuth - GRID, 360);

// how far, in degrees, the sun is from looking straight down a cross street (either way)
export const offGrid = (azimuth) => { const g = gridBearing(azimuth); return Math.min(Math.abs(g - 270), Math.abs(g - 90)); };

// The moment the sun's centre stands at an apparent elevation, on a New York calendar day, rising or setting
function crossing(y, m, d, setting, elevation) {
  let a = nyMoment(y, m, d, setting ? 12 * 60 : 0);
  let b = nyMoment(y, m, d, setting ? 23 * 60 + 59 : 12 * 60);
  const above = (ms) => sunAt(ms).elevation > elevation;
  if (above(a) !== setting || above(b) === setting) return null;
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    if (above(mid) === setting) a = mid; else b = mid;
  }
  return Math.round((a + b) / 2 / 60000) * 60000;
}

// sunrise and sunset as almanacs give them: the top of the disk on a level horizon
export const sunrise = (y, m, d) => crossing(y, m, d, false, -0.27);
export const sunset = (y, m, d) => crossing(y, m, d, true, -0.27);

// Seen down a street, the sun sets behind New Jersey's skyline, about half a degree above level; it rises
// over Queens, close to level. With those horizons the May alignment lands on the Hayden Planetarium's
// published day and minute (28 May 2026, 8:14 pm); its July dates come a day or two before this model's.
const HORIZON = { west: 0.5, east: 0 };

// The days the sun rises or sets in line with the cross streets, from a New York calendar day onward:
// [{ ms, setting }], the moment the sun's centre meets that horizon on the day closer to exact.
// Each alignment spans a pair of days.
export function henges(y, m, d, days) {
  const out = [];
  const day0 = Date.UTC(y, m - 1, d);
  let prev = null;
  for (let i = 0; i <= days; i++) {
    const c = new Date(day0 + i * 86400000);
    const ymd = [c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate()];
    const today = [true, false].map((setting) => {
      const ms = crossing(...ymd, setting, setting ? HORIZON.west : HORIZON.east);
      if (ms === null) return null;
      return { ms, setting, miss: gridBearing(sunAt(ms).azimuth) - (setting ? 270 : 90) };
    });
    if (prev) {
      today.forEach((t, k) => {
        const p = prev[k];
        if (t && p && Math.sign(t.miss) !== Math.sign(p.miss) && Math.abs(t.miss - p.miss) < 5) {
          const best = Math.abs(t.miss) < Math.abs(p.miss) ? t : p;
          out.push({ ms: best.ms, setting: best.setting });
        }
      });
    }
    prev = today;
  }
  return out.sort((a, b) => a.ms - b.ms);
}
