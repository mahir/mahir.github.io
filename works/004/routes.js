// Four of the city's ferry lines, pier to pier, with turns where the straight line would cross land:
// round the tip of Sarayburnu, and off Harem on the way down to Kadıköy.

export const ROUTES = [
  { id: 'eminonu-kadikoy', stops: [[41.0178, 28.9745], [41.0198, 28.9790], [41.0182, 28.9930], [41.0010, 29.0050], [40.9935, 29.0225]] },
  { id: 'eminonu-uskudar', stops: [[41.0178, 28.9745], [41.0280, 29.0090], [41.0272, 29.0130]] },
  { id: 'karakoy-kadikoy', stops: [[41.0215, 28.9790], [41.0120, 29.0000], [41.0010, 29.0050], [40.9935, 29.0225]] },
  { id: 'besiktas-uskudar', stops: [[41.0410, 29.0055], [41.0272, 29.0130]] },
];

// Small boats idling in loops on open water from the start, so the city never opens on dead water.
// rx runs east–west and rz north–south, in metres.
export const BOAT_LOOPS = [
  { id: 'golden-horn', lat: 41.0212, lon: 28.9675, rx: 140, rz: 35 },
  { id: 'the-mouth', lat: 41.0200, lon: 28.9880, rx: 250, rz: 140 },
  { id: 'off-besiktas', lat: 41.0330, lon: 29.0070, rx: 160, rz: 240 },
  { id: 'off-harem', lat: 41.0080, lon: 29.0000, rx: 200, rz: 150 },
  { id: 'marmara', lat: 40.9950, lon: 28.9800, rx: 320, rz: 200 },
  { id: 'under-the-bridge', lat: 41.0445, lon: 29.0300, rx: 120, rz: 200 },
];
