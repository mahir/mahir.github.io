// The thirteen pieces, in the order of a walk round the water: Sultanahmet, Eminönü, over the Golden Horn, up the
// European shore, across the Bosphorus and down the Asian side. The tray and "Build it for me" follow this order.
// Each year is when the building standing today was finished. A landmark that owns land raises the neighborhood
// around it on its own shore (region, as in land.json); the bridges and Maiden's Tower stand on the water.
// Bridge ends are from OpenStreetMap.

const bridge = (from, to) => ({ from, to, lat: (from[0] + to[0]) / 2, lon: (from[1] + to[1]) / 2 });

export const LANDMARKS = [
  { id: 'hagia-sophia', name: 'Hagia Sophia', year: 537, lat: 41.0086, lon: 28.9802, region: 1, ownsLand: true },
  { id: 'blue-mosque', name: 'Blue Mosque', year: 1616, lat: 41.0054, lon: 28.9768, region: 1, ownsLand: true },
  { id: 'topkapi', name: 'Topkapı Palace', year: 1478, lat: 41.0115, lon: 28.9834, region: 1, ownsLand: true },
  { id: 'yeni-cami', name: 'Yeni Cami', year: 1665, lat: 41.0171, lon: 28.9714, region: 1, ownsLand: true },
  { id: 'suleymaniye', name: 'Süleymaniye Mosque', year: 1557, lat: 41.0162, lon: 28.9639, region: 1, ownsLand: true },
  { id: 'galata-bridge', name: 'Galata Bridge', year: 1994, ...bridge([41.0182, 28.9719], [41.0219, 28.9745]), region: 0, ownsLand: false },
  { id: 'galata-tower', name: 'Galata Tower', year: 1348, lat: 41.0256, lon: 28.9741, region: 2, ownsLand: true },
  { id: 'dolmabahce', name: 'Dolmabahçe Palace', year: 1856, lat: 41.0391, lon: 29.0004, region: 2, ownsLand: true },
  { id: 'ortakoy', name: 'Ortaköy Mosque', year: 1856, lat: 41.0473, lon: 29.0270, region: 2, ownsLand: true },
  { id: 'bosphorus-bridge', name: 'Bosphorus Bridge', year: 1973, ...bridge([41.0510, 29.0287], [41.0400, 29.0402]), region: 0, ownsLand: false },
  { id: 'mihrimah', name: 'Mihrimah Sultan Mosque', year: 1548, lat: 41.0270, lon: 29.0153, region: 3, ownsLand: true },
  { id: 'maidens-tower', name: "Maiden's Tower", year: 1763, lat: 41.0211, lon: 29.0041, region: 0, ownsLand: false },
  { id: 'haydarpasa', name: 'Haydarpaşa Station', year: 1908, lat: 40.9969, lon: 29.0190, region: 3, ownsLand: true },
];
