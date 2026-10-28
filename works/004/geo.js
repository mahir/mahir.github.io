// Where things are. The frame is where the Bosphorus, the Golden Horn and the Sea of Marmara meet, about 9 km a side,
// flattened to metres around its own middle with the same constants works/004/_coast.py uses for land.json.
// World axes follow three.js: +x east, +z south, y up.

export const FRAME = { west: 28.945, south: 40.976, east: 29.052, north: 41.057 };
export const MX = 111320 * Math.cos(((FRAME.south + FRAME.north) / 2) * Math.PI / 180); // metres per degree east
export const MY = 110950; // metres per degree north
export const WIDTH = (FRAME.east - FRAME.west) * MX;
export const HEIGHT = (FRAME.north - FRAME.south) * MY;

// metres east of the frame's west edge and north of its south edge
export function toLocal(lat, lon) {
  return { x: (lon - FRAME.west) * MX, y: (lat - FRAME.south) * MY };
}

export function toWorld(lat, lon) {
  const p = toLocal(lat, lon);
  return { x: p.x - WIDTH / 2, z: HEIGHT / 2 - p.y };
}

// land.json: rows of region codes from the north edge down, one character a cell.
// 0 water, 1 the historic peninsula, 2 the European side north of the Golden Horn, 3 the Asian side.
export function parseLand({ cell, cols, rows, rows_n_to_s }) {
  const region = new Uint8Array(cols * rows);
  rows_n_to_s.forEach((row, r) => { for (let c = 0; c < cols; c++) region[r * cols + c] = row.charCodeAt(c) - 48; });
  const index = (x, z) => {
    const c = Math.floor((x + WIDTH / 2) / cell), r = Math.floor((z + HEIGHT / 2) / cell);
    return c < 0 || r < 0 || c >= cols || r >= rows ? -1 : r * cols + c;
  };
  return {
    cols, rows, cell, region, index,
    regionAt: (x, z) => { const i = index(x, z); return i < 0 ? 0 : region[i]; },
    center: (i) => ({ x: (i % cols + 0.5) * cell - WIDTH / 2, z: (Math.floor(i / cols) + 0.5) * cell - HEIGHT / 2 }),
  };
}
