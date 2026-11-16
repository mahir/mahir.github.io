#!/usr/bin/env python3
"""Builds data/<city>.json and data/<city>-wide.json for No. 014 from OpenStreetMap, through the Overpass API.

For each city in CITIES it takes every way tagged `highway` within 2.6 km of the start point, keeps
the ones a person can walk along, and writes them as a graph: junctions, and the edges between them
with their shape. Coordinates are whole metres east and north of the start point. <city>.json covers
1.3 km around the start, enough for the walk from it; <city>-wide.json covers all 2.6 km.

What counts as walkable: streets and paths of every class except motorways, minus anything tagged
closed to walkers (foot=no, access=private and the like), driveways and parking aisles, cycleways
that don't say walkers may use them, and indoor corridors. Separately mapped sidewalks and crossings
are kept for walking but flagged, so the page doesn't draw a street three times. Fragments that
connect to nothing (under 3 km of street in all) are dropped. Ferries, lifts and hills are ignored.

The page lets the start move up to 1.25 km and walks 1.25 km from it, so no walk leaves the 2.5 km
the data covers.

Run from the repository root:   python3 works/014/_streets.py            (all cities)
                                python3 works/014/_streets.py london     (one)
                                python3 works/014/_streets.py --near     (what OSM has at each start)
Overpass replies are kept in works/014/_cache/ (not committed), so reruns don't refetch.
© OpenStreetMap contributors, ODbL.
"""
import gzip, json, math, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '_cache')
OUT = os.path.join(HERE, 'data')
R_FETCH, R_WIDE, R_CORE = 2650, 2600, 1320
UA = 'street-research-script'
SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

# slug: (latitude, longitude) of the start point
CITIES = {
    'london':    (51.50809, -0.12806),    # Trafalgar Square
    'newyork':   (40.75800, -73.98557),   # Times Square
    'paris':     (48.85341, 2.34880),     # Notre-Dame, point zéro
    'istanbul':  (41.01690, 28.97120),    # Eminönü
    'venice':    (45.43800, 12.33590),    # Rialto Bridge
    'fez':       (34.06490, -4.97330),    # al-Qarawiyyin
    'tokyo':     (35.65950, 139.70050),   # Shibuya Crossing
    'kyoto':     (35.00370, 135.75950),   # Shijō Karasuma
    'barcelona': (41.38700, 2.17000),     # Plaça de Catalunya
    'beijing':   (39.94040, 116.39000),   # Drum Tower
    'brasilia':  (-15.79833, -47.87556),  # the cathedral (the bus station, on a flyover, cuts the walk short)
    'dubai':     (25.20140, 55.26950),    # Burj Khalifa/Dubai Mall metro station
}

NOT_STREETS = {'motorway', 'motorway_link', 'construction', 'proposed', 'planned', 'raceway', 'bus_guideway',
               'busway', 'corridor', 'elevator', 'platform', 'abandoned', 'razed', 'disused', 'escape',
               'rest_area', 'services', 'via_ferrata', 'emergency_bay', 'no', 'bridleway'}
OPEN = {'yes', 'designated', 'permissive', 'public'}
CLOSED = {'private', 'no', 'customers', 'delivery', 'agricultural', 'forestry', 'military', 'restricted'}


def overpass(query, tries=60):
    """Asks each server in turn, through curl (the system Python's TLS is too old for some of them)."""
    wait = 5
    for i in range(tries):
        url = SERVERS[i % len(SERVERS)]
        r = subprocess.run(['curl', '-s', '-m', '150', '-A', UA, '--data-urlencode', 'data=' + query, url], capture_output=True)
        if r.stdout.lstrip()[:1] == b'{' and r.stdout.rstrip()[-1:] == b'}':
            return r.stdout
        print('   ', url.split('/')[2], 'did not answer with data', flush=True)
        time.sleep(wait); wait = min(wait + 5, 20)
    raise SystemExit('Overpass did not answer')


def fetch(slug):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, slug + '.json')
    if not (os.path.exists(p) and os.path.getsize(p) > 10000):
        lat, lon = CITIES[slug]
        print('  fetching', slug, flush=True)
        raw = overpass(f'[out:json][timeout:150];way(around:{R_FETCH},{lat},{lon})[highway];out body qt;>;out skel qt;')
        open(p, 'wb').write(raw)
        time.sleep(2)
    return json.load(open(p))


def walkable(t):
    """None if a walker can't use the way, else 1 for a separately mapped sidewalk or crossing, 0 otherwise."""
    h = t.get('highway')
    if h in NOT_STREETS or t.get('indoor') in ('yes', 'room', 'corridor'): return None
    foot, access = t.get('foot'), t.get('access')
    if foot in ('no', 'private') or t.get('motorroad') == 'yes': return None
    if foot not in OPEN:
        if access in CLOSED: return None
        if h == 'cycleway': return None
        if h in ('trunk', 'trunk_link') and t.get('sidewalk') in (None, 'no', 'none') and foot is None and t.get('maxspeed', '0').split()[0].isdigit() and int(t.get('maxspeed', '0').split()[0]) >= 80: return None
    if t.get('service') in ('driveway', 'parking_aisle', 'drive-through', 'emergency_access'): return None
    return 1 if t.get('footway') in ('sidewalk', 'crossing', 'traffic_island') else 0


def simplify(pts, tol=1.5):
    """Douglas-Peucker on a list of (x, y)."""
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; d2 = dx * dx + dy * dy
        worst, at = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if d2 == 0: d = math.hypot(px - ax, py - ay)
            else:
                u = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / d2))
                d = math.hypot(px - ax - u * dx, py - ay - u * dy)
            if d > worst: worst, at = d, i
        if worst > tol: keep[at] = True; stack += [(a, at), (at, b)]
    return [p for p, k in zip(pts, keep) if k]


def build(slug, radius, name):
    """Writes data/<name>.json: the walkable graph within `radius` metres of the city's start point."""
    lat0, lon0 = CITIES[slug]
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110540
    els = fetch(slug)['elements']
    xy = {e['id']: ((e['lon'] - lon0) * kx, (e['lat'] - lat0) * ky) for e in els if e['type'] == 'node'}
    inside = {i for i, (x, y) in xy.items() if x * x + y * y <= radius * radius}

    # runs of consecutive nodes inside the circle, per walkable way
    runs = []
    for e in els:
        if e['type'] != 'way': continue
        flag = walkable(e.get('tags', {}))
        if flag is None: continue
        run = []
        for n in e['nodes']:
            if n in inside: run.append(n)
            else:
                if len(run) > 1: runs.append((run, flag))
                run = []
        if len(run) > 1: runs.append((run, flag))

    # cut the runs into edges at every node that more than one run touches
    uses = {}
    for run, _ in runs:
        for n in set(run): uses[n] = uses.get(n, 0) + 1
        for n in run: uses[n] += run.count(n) > 1          # a way that crosses itself
    edges = []                                              # [flag, node ids from one end to the other]
    for run, flag in runs:
        start = 0
        for i in range(1, len(run)):
            if uses[run[i]] > 1 or i == len(run) - 1:
                edges.append([flag, run[start:i + 1]]); start = i

    # join edges that meet two by two (a street mapped as several ways), so only real junctions are left
    ends = {}
    for k, (_, ns) in enumerate(edges):
        for n in (ns[0], ns[-1]): ends.setdefault(n, []).append(k)
    gone = set()
    for n, ks in ends.items():
        if len(ks) != 2 or ks[0] == ks[1]: continue
        i, j = ks
        while i in gone: i = edges[i][2]
        while j in gone: j = edges[j][2]
        if i == j or edges[i][0] != edges[j][0]: continue
        a, c = edges[i][1], edges[j][1]
        if a[-1] != n: a = a[::-1]
        if c[0] != n: c = c[::-1]
        if c[0] != n or a[-1] != n: continue
        edges[i][1] = a + c[1:]; gone.add(j); edges[j].append(i)
    edges = [e for k, e in enumerate(edges) if k not in gone]

    def length(ns):
        return sum(math.hypot(xy[q][0] - xy[p][0], xy[q][1] - xy[p][1]) for p, q in zip(ns, ns[1:]))

    # drop fragments: connected pieces with under 3 km of street
    parent = {}
    def find(a):
        while parent.setdefault(a, a) != a:
            parent[a] = parent[parent[a]]; a = parent[a]
        return a
    for _, ns in edges: parent[find(ns[0])] = find(ns[-1])
    total = {}
    for _, ns in edges: total[find(ns[0])] = total.get(find(ns[0]), 0) + length(ns)
    edges = [e for e in edges if total[find(e[1][0])] >= 3000]

    # An edge is written as: junction, junction, n, then n shape points, each as a step from the point before.
    # A sidewalk or crossing is never drawn, so it is written as: junction, junction, -1, its length in metres.
    ids, nodes, out, km = {}, [], [], 0
    def node(n):
        if n not in ids:
            ids[n] = len(ids); nodes.extend((round(xy[n][0]), round(xy[n][1])))
        return ids[n]
    for flag, ns in edges:
        out += [node(ns[0]), node(ns[-1])]
        if flag:
            out += [-1, max(1, round(length(ns)))]; continue
        pts = simplify([xy[n] for n in ns])[1:-1]
        out.append(len(pts))
        px, py = round(xy[ns[0]][0]), round(xy[ns[0]][1])
        for x, y in pts:
            x, y = round(x), round(y); out += [x - px, y - py]; px, py = x, y
        km += length(ns) / 1000

    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name + '.json')
    json.dump({'lat': lat0, 'lon': lon0, 'r': radius, 'n': nodes, 'e': out}, open(p, 'w'), separators=(',', ':'))
    gz = len(gzip.compress(open(p, 'rb').read()))
    print(f'{name:16} {len(ids):6} junctions {len(edges):6} edges {km:5.0f} km drawn {os.path.getsize(p) / 1024:5.0f} KB {gz / 1024:4.0f} KB gzipped', flush=True)


def near():
    """Prints what OpenStreetMap names within 150 m of each start point, to check the points by eye."""
    for slug, (lat, lon) in CITIES.items():
        raw = overpass(f'[out:json][timeout:25];nwr(around:150,{lat},{lon})[name][~"^(place|tourism|historic|railway|highway|bridge)$"~"."];out tags 40;')
        names = sorted({e['tags'].get('name:en') or e['tags']['name'] for e in json.loads(raw)['elements']})
        print(f'{slug:10}', '; '.join(names)[:300]); time.sleep(2)


if __name__ == '__main__':
    args = sys.argv[1:]
    if args == ['--near']: near()
    else:
        for slug in (args or CITIES):
            build(slug, R_CORE, slug)                 # what the page opens with: the walk from the start point
            build(slug, R_WIDE, slug + '-wide')       # loaded when a city is opened, so the start can move
