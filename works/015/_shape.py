#!/usr/bin/env python3
"""Builds data/<city>.json for No. 015 and writes the table of numbers into index.html.

It reads the OpenStreetMap replies that No. 014's script keeps in works/014/_cache/ (run
`python3 works/014/_streets.py` first if they are gone), with the same cities and start points.

For each city it keeps the streets within 1.5 km of the start: roads of every class below a motorway,
alleys, and footways that have a name (which is what the streets of Venice and of the Fez medina are).
Left out: motorways and slip roads, tunnels, service roads, squares mapped as areas, sidewalks,
and paths without a name, which are mostly inside parks.

What it measures, all inside that circle:
  grid     the share of street length within 7.5 degrees of the two directions, at right angles to
           each other, that hold the most street. Streets in every direction alike would score 17%.
  dir      the grid direction nearest north, in degrees east of north (negative: west)
  cross, tee, dead   junctions where four or more streets meet, where three meet, and dead ends,
           as shares of all three. Junctions within 15 m of each other count as one, so a street
           crossing both sides of a divided road is one crossroads, not two.
  corner   the median length of street between one junction and the next, in metres
  km       kilometres of street per square kilometre
  rose     the share of street length in each 5 degree band of direction, 36 bands from north round to south

Run from the repository root:   python3 works/015/_shape.py
"""
import importlib.util, json, math, os, re, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('streets', os.path.join(HERE, '..', '014', '_streets.py'))
streets = importlib.util.module_from_spec(spec); spec.loader.exec_module(streets)

R = 1500                      # metres around the start
EDGE = 40                     # junctions this close to the circle's edge are not counted: the cut makes false dead ends
NEAR = 15                     # junctions this close together are one junction
ROADS = {'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'pedestrian', 'road'}
PATHS = {'footway', 'path', 'steps', 'track', 'cycleway'}
NAMES = {   # slug: (name, start, the line about its streets from No. 014)
    'istanbul': ('Istanbul', 'Eminönü'), 'paris': ('Paris', 'Notre-Dame'), 'london': ('London', 'Trafalgar Square'),
    'venice': ('Venice', 'Rialto Bridge'), 'fez': ('Fez', 'al-Qarawiyyin'), 'kyoto': ('Kyoto', 'Shijō Karasuma'),
    'beijing': ('Beijing', 'Drum Tower'), 'newyork': ('New York', 'Times Square'), 'barcelona': ('Barcelona', 'Plaça de Catalunya'),
    'tokyo': ('Tokyo', 'Shibuya Crossing'), 'brasilia': ('Brasília', 'The cathedral'), 'dubai': ('Dubai', 'Burj Khalifa / Dubai Mall station'),
}


def is_street(t):
    h = t.get('highway')
    if t.get('area') == 'yes' or t.get('access') in ('private', 'no') or t.get('indoor') in ('yes', 'room', 'corridor'): return False
    if t.get('tunnel') not in (None, 'no', 'building_passage'): return False
    if h in ROADS: return True
    if h == 'service': return t.get('service') == 'alley'
    if h in PATHS: return bool(t.get('name')) and t.get('footway') not in ('sidewalk', 'crossing', 'traffic_island')
    return False


def build(slug):
    lat0, lon0 = streets.CITIES[slug]
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110540
    els = streets.fetch(slug)['elements']
    xy = {e['id']: ((e['lon'] - lon0) * kx, (e['lat'] - lat0) * ky) for e in els if e['type'] == 'node'}
    inside = {i for i, (x, y) in xy.items() if x * x + y * y <= R * R}

    runs = []
    for e in els:
        if e['type'] != 'way' or not is_street(e.get('tags', {})): continue
        run = []
        for n in e['nodes']:
            if n in inside: run.append(n)
            else:
                if len(run) > 1: runs.append(run)
                run = []
        if len(run) > 1: runs.append(run)

    # which way the streets run: length by direction, in half-degree and 5-degree bands
    fine, rose, total = [0.0] * 360, [0.0] * 36, 0.0
    for run in runs:
        for a, b in zip(run, run[1:]):
            dx, dy = xy[b][0] - xy[a][0], xy[b][1] - xy[a][1]; d = math.hypot(dx, dy)
            if not d: continue
            bearing = math.degrees(math.atan2(dx, dy)) % 180
            fine[int(bearing * 2) % 360] += d; rose[round(bearing / 5) % 36] += d; total += d
    best, at = 0, 0
    for j in range(180):                                   # a pair of directions at right angles, 7.5 degrees either side
        s = sum(fine[(j + k) % 360] + fine[(j + 180 + k) % 360] for k in range(-15, 15))
        if s > best: best, at = s, j
    direction = at / 2 if at / 2 <= 45 else at / 2 - 90

    # edges between the nodes that more than one street touches, joined where they only meet two by two
    uses = {}
    for run in runs:
        for n in set(run): uses[n] = uses.get(n, 0) + 1
        for n in run: uses[n] += run.count(n) > 1
    edges = []
    for run in runs:
        start = 0
        for i in range(1, len(run)):
            if uses[run[i]] > 1 or i == len(run) - 1: edges.append(run[start:i + 1]); start = i
    ends = {}
    for k, ns in enumerate(edges):
        for n in (ns[0], ns[-1]): ends.setdefault(n, []).append(k)
    gone = {}
    for n, ks in ends.items():
        if len(ks) != 2 or ks[0] == ks[1]: continue
        i, j = ks
        while i in gone: i = gone[i]
        while j in gone: j = gone[j]
        if i == j: continue
        a, c = edges[i], edges[j]
        if a[-1] != n: a = a[::-1]
        if c[0] != n: c = c[::-1]
        if c[0] != n or a[-1] != n: continue
        edges[i] = a + c[1:]; gone[j] = i
    edges = [e for k, e in enumerate(edges) if k not in gone]
    length = lambda ns: sum(math.hypot(xy[q][0] - xy[p][0], xy[q][1] - xy[p][1]) for p, q in zip(ns, ns[1:]))

    # junctions: end nodes within 15 m of each other are one junction
    nodes = sorted({n for ns in edges for n in (ns[0], ns[-1])})
    parent = {n: n for n in nodes}
    def find(a):
        while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
        return a
    cells = {}
    for n in nodes: cells.setdefault((int(xy[n][0] // NEAR), int(xy[n][1] // NEAR)), []).append(n)
    for (cx, cy), here in cells.items():
        for ox in (-1, 0, 1):
            for oy in (-1, 0, 1):
                for m in cells.get((cx + ox, cy + oy), ()):
                    for n in here:
                        if n < m and math.hypot(xy[n][0] - xy[m][0], xy[n][1] - xy[m][1]) <= NEAR: parent[find(n)] = find(m)
    degree, far = {}, {}
    for ns in edges:
        a, b = find(ns[0]), find(ns[-1])
        if a == b and length(ns) <= 2 * NEAR: continue     # a link inside one junction
        degree[a] = degree.get(a, 0) + 1; degree[b] = degree.get(b, 0) + 1
    for n in nodes: far[find(n)] = max(far.get(find(n), 0), math.hypot(*xy[n]))
    counted = {j for j, d in degree.items() if d != 2 and far[j] <= R - EDGE}
    dead = sum(degree[j] == 1 for j in counted); tee = sum(degree[j] == 3 for j in counted); cross = sum(degree[j] >= 4 for j in counted)
    spans = [length(ns) for ns in edges if find(ns[0]) != find(ns[-1]) and find(ns[0]) in counted and find(ns[-1]) in counted]

    stats = {
        'grid': round(100 * best / total), 'dir': round(direction),
        'cross': round(100 * cross / (dead + tee + cross)), 'tee': round(100 * tee / (dead + tee + cross)), 'dead': round(100 * dead / (dead + tee + cross)),
        'corner': round(statistics.median(spans)), 'km': round(total / 1000 / (math.pi * R * R / 1e6), 1),
    }

    ids, flat, out = {}, [], []
    def node(n):
        if n not in ids: ids[n] = len(ids); flat.extend((round(xy[n][0]), round(xy[n][1])))
        return ids[n]
    for ns in edges:
        out += [node(ns[0]), node(ns[-1])]
        pts = streets.simplify([xy[n] for n in ns])[1:-1]
        out.append(len(pts))
        px, py = round(xy[ns[0]][0]), round(xy[ns[0]][1])
        for x, y in pts:
            x, y = round(x), round(y); out += [x - px, y - py]; px, py = x, y
    os.makedirs(os.path.join(HERE, 'data'), exist_ok=True)
    p = os.path.join(HERE, 'data', slug + '.json')
    json.dump({'r': R, 'n': flat, 'e': out, 's': stats, 'rose': [round(v / total, 4) for v in rose]}, open(p, 'w'), separators=(',', ':'))
    print(f'{slug:10} {os.path.getsize(p) / 1024:4.0f} KB  {total / 1000:4.0f} km  junctions {dead + tee + cross:5}  {stats}  top band {max(rose) / total:.2f}', flush=True)
    return stats


def direction_words(d):
    return 'due north' if d == 0 else f'{abs(d)}° {"east" if d > 0 else "west"} of north'


if __name__ == '__main__':
    rows = []
    for slug, (name, place) in NAMES.items():
        s = build(slug)
        rows.append(f'        <tr id="{slug}" data-grid="{s["grid"]}" data-dir="{s["dir"]}" data-cross="{s["cross"]}" data-tee="{s["tee"]}" data-dead="{s["dead"]}" data-corner="{s["corner"]}" data-km="{s["km"]}">'
                    f'<th scope="row">{name}<small>{place}</small></th><td>{s["grid"]}%</td><td>{direction_words(s["dir"])}</td>'
                    f'<td>{s["cross"]}%</td><td>{s["tee"]}%</td><td>{s["dead"]}%</td><td>{s["corner"]} m</td><td>{s["km"]} km</td></tr>')
    page = os.path.join(HERE, 'index.html')
    if os.path.exists(page):
        html = open(page, encoding='utf-8').read()
        html, n = re.subn(r'(<!-- rows -->\n).*?( *<!-- /rows -->)', lambda m: m.group(1) + '\n'.join(rows) + '\n' + m.group(2), html, flags=re.S)
        open(page, 'w', encoding='utf-8').write(html)
        print('rows written into index.html' if n else 'no <!-- rows --> marker in index.html')
