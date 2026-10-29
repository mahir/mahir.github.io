// The year's change sets the light: a clear golden morning for a year up 30% or more, soft overcast around level,
// a stormy dusk for a year down 30% or more, and a smooth blend in between. Colors are sRGB, 0 to 1.

const hex = (h) => [(h >> 16) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

export const ANCHORS = {
  golden: {
    sunElevation: 9, sunAzimuth: -108, // degrees; azimuth 0 looks past the ridge, -90 is the left, ±180 behind you
    zenith: hex(0x2f62ae), horizon: hex(0xb4c6da), horizonSun: hex(0xf2c690), haze: hex(0xb3c0cc), hazeSun: hex(0xe8c49a),
    sun: hex(0xffc283), sunIntensity: 6, envIntensity: 0.38, exposure: 1.0, glow: 0.45,
    visibility: 110000, hazeHeight: 2200, // m: haze thins with height, as it does in a valley on a clear morning
    cloudCover: 0.32, cloudBase: 1500, cloudDark: 0.05, highClouds: 0.4,
  },
  overcast: {
    sunElevation: 38, sunAzimuth: -150,
    zenith: hex(0x98a3ae), horizon: hex(0xcdd2d6), horizonSun: hex(0xd8d9d8), haze: hex(0xc2c8cd), hazeSun: hex(0xcfd1d0),
    sun: hex(0xe9edf1), sunIntensity: 0.9, envIntensity: 0.9, exposure: 1.0, glow: 0.06,
    visibility: 60000, hazeHeight: 2600,
    cloudCover: 0.93, cloudBase: 2400, cloudDark: 0.3, highClouds: 0,
  },
  storm: {
    sunElevation: 2, sunAzimuth: 20,
    zenith: hex(0x1b2129), horizon: hex(0x4a535d), horizonSun: hex(0xc9805a), haze: hex(0x434b55), hazeSun: hex(0x6a5650),
    sun: hex(0xff8f55), sunIntensity: 2.2, envIntensity: 0.45, exposure: 0.95, glow: 0.3,
    visibility: 40000, hazeHeight: 2000,
    cloudCover: 0.86, cloudBase: 1450, cloudDark: 0.7, highClouds: 0.15,
  },
};

const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => (t >= 1 ? b : Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * t) : a + (b - a) * t);

export function moodOf(change) {
  return Math.max(-1, Math.min(1, change / 0.3));
}

export function weatherFor(change) {
  const m = moodOf(change);
  const to = m >= 0 ? ANCHORS.golden : ANCHORS.storm;
  const t = smooth(Math.abs(m));
  const out = { mood: m };
  for (const key of Object.keys(ANCHORS.overcast)) out[key] = mix(ANCHORS.overcast[key], to[key], t);
  return out;
}

// Where the deck actually sits for a range whose highest ground is `top` metres. Scattered cloud stays at the
// weather's height, and big years break through it; a heavy deck lifts to just above the highest ground, so the
// whole crest reads under a low ceiling instead of vanishing into it.
export function deckFor(weather, top) {
  const heavy = Math.min(1, Math.max(0, (weather.cloudCover - 0.45) / 0.3));
  const lifted = Math.max(weather.cloudBase, top + 350);
  return { base: weather.cloudBase + (lifted - weather.cloudBase) * heavy * heavy * (3 - 2 * heavy), ceiling: weather.cloudCover > 0.6 };
}

// The direction toward the sun, +y up, the camera on the +z side.
export function sunDirection({ sunElevation, sunAzimuth }) {
  const e = (sunElevation * Math.PI) / 180, a = (sunAzimuth * Math.PI) / 180;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)];
}
