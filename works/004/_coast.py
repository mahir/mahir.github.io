"""Turn OpenStreetMap's coastline into the land grid No. 004 is built on: works/004/land.json.

Run from the repository root:  python3 works/004/_coast.py

The frame is where the Bosphorus, the Golden Horn and the Sea of Marmara meet, about 9 km a side. Each 40 m cell
is water (0) or land on one of three shores: the historic peninsula (1), the European side north of the Golden
Horn (2) and the Asian side (3). OpenStreetMap keeps land on the left of every coastline way, so a cell is land
when it lies left of the nearest stretch of coast; no rings need assembling. Coastline © OpenStreetMap
contributors (ODbL), credited on the page.
"""
import json
import math
import subprocess
import sys
from collections import deque
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEST, SOUTH, EAST, NORTH = 28.945, 40.976, 29.052, 41.057
MX = 111320 * math.cos(math.radians((SOUTH + NORTH) / 2))  # metres per degree east
MY = 110950  # metres per degree north
WIDTH, HEIGHT = (EAST - WEST) * MX, (NORTH - SOUTH) * MY
CELL = 40
# the frame plus 0.01° on every side, so ways run past its edges
QUERY = '[out:json][timeout:50];way["natural"="coastline"](40.966,28.935,41.067,29.062);out geom;'

# Each shore is the land component that holds its seed.
SEEDS = {'1': (41.0162, 28.9639), '2': (41.0256, 28.9741), '3': (41.0270, 29.0153)}  # Süleymaniye, Galata Tower, Mihrimah
# Every landmark that owns land must stand on its own shore.
SHORES = [
    ('Hagia Sophia', 41.0086, 28.9802, '1'), ('Blue Mosque', 41.0054, 28.9768, '1'), ('Topkapı', 41.0115, 28.9834, '1'),
    ('Yeni Cami', 41.0171, 28.9714, '1'), ('Süleymaniye', 41.0162, 28.9639, '1'), ('Galata Tower', 41.0256, 28.9741, '2'),
    ('Dolmabahçe', 41.0391, 29.0004, '2'), ('Ortaköy', 41.0473, 29.0270, '2'), ('Mihrimah', 41.0270, 29.0153, '3'),
    ('Haydarpaşa', 40.9969, 29.0190, '3'),
]


def project(lat, lon):
    """Metres east of the frame's west edge and north of its south edge."""
    return ((lon - WEST) * MX, (lat - SOUTH) * MY)


def bucket(ways, size):
    """Index every segment of every way by the size × size squares its bounding box touches."""
    cells = {}
    for way in ways:
        for a, b in zip(way, way[1:]):
            for i in range(math.floor(min(a[0], b[0]) / size), math.floor(max(a[0], b[0]) / size) + 1):
                for j in range(math.floor(min(a[1], b[1]) / size), math.floor(max(a[1], b[1]) / size) + 1):
                    cells.setdefault((i, j), []).append((a, b))
    keys = list(cells)
    return {'size': size, 'cells': cells,
            'span': (min(k[0] for k in keys), max(k[0] for k in keys), min(k[1] for k in keys), max(k[1] for k in keys))}


def ring(ci, cj, r):
    if r == 0:
        yield ci, cj
        return
    for i in range(ci - r, ci + r + 1):
        yield i, cj - r
        yield i, cj + r
    for j in range(cj - r + 1, cj + r):
        yield ci - r, j
        yield ci + r, j


def land_side(px, py, buckets):
    """True when (px, py) lies left of the nearest coastline segment, i.e. on land."""
    size, cells = buckets['size'], buckets['cells']
    i0, i1, j0, j1 = buckets['span']
    ci, cj = math.floor(px / size), math.floor(py / size)
    limit = max(abs(ci - i0), abs(ci - i1), abs(cj - j0), abs(cj - j1))
    best = None  # (squared distance, clarity, cross)
    for r in range(limit + 1):
        for key in ring(ci, cj, r):
            for (ax, ay), (bx, by) in cells.get(key, ()):
                dx, dy = bx - ax, by - ay
                length2 = dx * dx + dy * dy
                t = 0.0 if length2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length2))
                d2 = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2
                cross = dx * (py - ay) - dy * (px - ax)
                clarity = abs(cross) / math.sqrt(length2 or 1)
                # at a vertex two segments are equally near: trust the one the point is most clearly beside
                if best is None or d2 < best[0] - 1e-6 or (abs(d2 - best[0]) <= 1e-6 and clarity > best[1]):
                    best = (d2, clarity, cross)
        # anything in a farther ring is at least r squares away
        if best is not None and best[0] <= (r * size) ** 2:
            break
    return best is not None and best[2] > 0


def rasterize(ways, cell):
    """Land (True) or water for every cell, rows from north to south, each sampled at its centre."""
    buckets = bucket(ways, cell * 5)
    cols, rows = math.ceil(WIDTH / cell), math.ceil(HEIGHT / cell)
    return [[land_side((c + .5) * cell, HEIGHT - (r + .5) * cell, buckets) for c in range(cols)] for r in range(rows)]


def components(grid, value):
    """4-connected components of cells equal to value, as lists of (row, col)."""
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != value or seen[r][c]:
                continue
            seen[r][c] = True
            part, todo = [], deque([(r, c)])
            while todo:
                y, x = todo.popleft()
                part.append((y, x))
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < rows and 0 <= nx < cols and not seen[ny][nx] and grid[ny][nx] == value:
                        seen[ny][nx] = True
                        todo.append((ny, nx))
            yield part


def remove_specks(grid, min_cells=6):
    """Sink land components and fill water components smaller than min_cells."""
    out = [row[:] for row in grid]
    for value in (True, False):
        for part in list(components(grid, value)):
            if len(part) < min_cells:
                for r, c in part:
                    out[r][c] = not value
    return out


def nearest_land(grid, r, c, reach):
    """The land cell nearest (r, c) within reach cells, or None."""
    best = None
    for y in range(r - reach, r + reach + 1):
        for x in range(c - reach, c + reach + 1):
            if 0 <= y < len(grid) and 0 <= x < len(grid[0]) and grid[y][x]:
                d = (y - r) ** 2 + (x - c) ** 2
                if best is None or d < best[0]:
                    best = (d, y, x)
    return best and best[1:]


def label(grid, seeds):
    """Rows of region codes: each land component takes the code of the seed (row, col) it holds, others become water."""
    out = [['0'] * len(grid[0]) for _ in grid]
    for part in components(grid, True):
        cells = set(part)
        for code, (r, c) in seeds.items():
            snapped = nearest_land(grid, r, c, 3)
            if snapped in cells:
                for y, x in part:
                    out[y][x] = code
                break
    return [''.join(row) for row in out]


def cell_of(lat, lon):
    x, y = project(lat, lon)
    return int((HEIGHT - y) // CELL), int(x // CELL)


def fetch():
    # through curl: the system Python on macOS has a TLS library too old for the Overpass servers
    out = subprocess.run(['curl', '-sf', '--max-time', '90', '-A', 'mahiryavuz.com works/004 coastline',
                          '--data-urlencode', f'data={QUERY}', 'https://overpass-api.de/api/interpreter'],
                         check=True, capture_output=True).stdout
    return json.loads(out)['elements']


def main():
    # a saved Overpass response can stand in for the fetch: python3 works/004/_coast.py overpass.json
    elements = json.loads(Path(sys.argv[1]).read_text())['elements'] if len(sys.argv) > 1 else fetch()
    ways = [[project(p['lat'], p['lon']) for p in way['geometry']] for way in elements]
    grid = remove_specks(rasterize(ways, CELL))
    rows = label(grid, {code: cell_of(*at) for code, at in SEEDS.items()})
    for name, lat, lon, shore in SHORES:
        r, c = cell_of(lat, lon)
        y, x = nearest_land([[ch != '0' for ch in row] for row in rows], r, c, 3)
        assert rows[y][x] == shore, f'{name} is on shore {rows[y][x]}, expected {shore}'
    (HERE / 'land.json').write_text(json.dumps(
        {'frame': [WEST, SOUTH, EAST, NORTH], 'cell': CELL, 'cols': len(rows[0]), 'rows': len(rows), 'rows_n_to_s': rows},
        separators=(',', ':')) + '\n')
    step_r, step_c = len(rows) / 48, len(rows[0]) / 96
    for i in range(48):
        print(''.join('.' if (ch := rows[int(i * step_r)][int(j * step_c)]) == '0' else ch for j in range(96)))
    print(f'{len(ways)} ways, {len(rows[0])} × {len(rows)} cells of {CELL} m, land.json written')


if __name__ == '__main__':
    main()
