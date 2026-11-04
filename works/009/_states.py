#!/usr/bin/env python3
"""Work out No. 009's state-by-state record and write works/009/states.js.

    python3 works/009/_states.py path/to/1976-2024-house.csv

Three sources:

- Every US House general election by district, 1976 to 2024, from the MIT Election Data and Science Lab
  (doi:10.7910/DVN/IG0UN2, public domain). Harvard Dataverse asks for a guestbook entry before the download, so the
  file is fetched by hand and its path given here; only what is worked out from it is kept in states.js.
- Every US Senate general election by state, 1976 to 2024, and every presidential one, from the same lab
  (doi:10.7910/DVN/PEJ5QU and doi:10.7910/DVN/42MVDX, public domain, no guestbook), fetched here.
- Turnout of the voting-eligible population by state, 1980 to 2022, and the 2026 count as it comes in, from the UF
  Election Lab, with 2024 and 2026 from its files for those years. Where a state reported no total of ballots before
  2010, votes for the highest office on the ballot stand in.

Running it twice changes nothing.
"""

import csv
import functools
import io
import re
import json
import statistics as st
import sys
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'states.js'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
TURNOUT = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/Turnout_1980_2022_v1.2.csv'
SENATE = 'https://dataverse.harvard.edu/api/access/datafile/13887039?format=original'
PRESIDENT_VOTES = 'https://dataverse.harvard.edu/api/access/datafile/13887042'
TURNOUT_2024 = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/Turnout_2024G_v0.4.csv'
TURNOUT_2026 = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/Turnout_2026G_v0.2.csv'

NAMES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado',
    'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
    'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
    'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
    'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
    'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming',
}
PRESIDENT = {1978: 'D', 1982: 'R', 1986: 'R', 1990: 'R', 1994: 'D', 1998: 'D', 2002: 'R', 2006: 'R', 2010: 'D',
             2014: 'D', 2018: 'R', 2022: 'D', 2026: 'R'}
NEW_MAPS = {1982, 1992, 2002, 2012, 2022}  # midterms fought on maps drawn after a census
SOUTH = ['AL', 'AR', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX', 'VA']
# Governors elected in odd years, and in presidential years, as the states hold them now.
GOVERNOR_ODD = ['KY', 'LA', 'MS', 'NJ', 'VA']
GOVERNOR_PRESIDENTIAL = ['DE', 'IN', 'MO', 'MT', 'NC', 'ND', 'UT', 'WA', 'WV']
# States voting on different House lines in 2026 than in 2024, as of 28 September 2026 (PolicyMap's redistricting
# tracker, checked against Voting Rights Lab): eight new maps in force, and Alabama back on its 2023 map.
# Missouri's 2025 map is blocked for 2026 and Virginia's never took effect.
NEW_LINES_2026 = ['AL', 'CA', 'FL', 'LA', 'NC', 'OH', 'TN', 'TX', 'UT']
# Republican-held seats with no Democrat on the 2026 ballot: Ballotpedia's Annual Congressional Competitiveness Report,
# updated 21 September 2026 (one race in 435 without a Democrat; Democrats ran in 434).
UNCONTESTED_2026 = 1
SKIP = {'UNDER VOTES', 'OVER VOTES', 'BLANK VOTE', 'VOID', 'EXHAUSTED BALLOT', 'WRITEIN', 'SCATTERING'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')


def party(lines):
    if 'DEMOCRAT' in lines or 'DEMOCRATIC-FARMER-LABOR' in lines:
        return 'D'
    if 'REPUBLICAN' in lines or 'INDEPENDENT-REPUBLICAN' in lines:
        return 'R'
    return 'O'


def districts(path):
    """{(year, state, district): {'w': party, 'D': votes, 'R': votes, 'name': winner, 'cands': [(name, party)]}} for
    every regular House general election."""
    races = defaultdict(list)
    for r in csv.DictReader(open(path, newline='')):
        # Texas's court-redrawn districts of 1996 and 2006 voted in an open November special, coded as a primary
        if (r['stage'] != 'GEN' and r['special'] != 'TRUE') or r['office'] != 'US HOUSE' or r['state_po'] not in NAMES:
            continue
        races[(int(r['year']), r['state_po'], int(r['district']), r['special'] == 'TRUE')].append(r)
    # a special counts only where the district has no regular race that year
    races = {k[:3]: v for k, v in races.items() if not k[3] or (*k[:3], False) not in races}
    out = {}
    for key, rows in races.items():
        if any(r['runoff'] == 'TRUE' for r in rows):  # Louisiana's and Georgia's December runoffs decide the seat
            rows = [r for r in rows if r['runoff'] == 'TRUE']
        cand = defaultdict(lambda: {'v': 0, 'lines': set(), 'name': ''})
        for r in rows:
            if r['candidate'] in SKIP:
                continue
            c = cand[r['candidate']]
            v = int(float(r['candidatevotes']))
            c['v'] = -1 if v < 0 else c['v'] + v  # -1: unopposed, and not on the ballot
            c['lines'].add(r['party'])
            c['name'] = r['candidate']
        winner = max(cand.values(), key=lambda c: (c['v'] == -1, c['v']))
        votes = {p: sum(c['v'] for c in cand.values() if party(c['lines']) == p and c['v'] > 0) for p in 'DR'}
        out[key] = {'w': party(winner['lines']), **votes, 'name': winner['name'],
                    'cands': [(c['name'], party(c['lines'])) for c in cand.values() if c['v'] and party(c['lines']) != 'O']}
    return out


def person(name, state, p):
    """Who a candidate is, as far as a name allows: state, party, surname and first initial."""
    n = re.sub(r'\\?"[^"]*\\?"|\u201c.*?\u201d|\(.*?\)', ' ', name.upper()).replace(',', ' ').replace('.', ' ').split()
    n = [t for t in n if t not in {'JR', 'SR', 'II', 'III', 'IV'}] or ['?']
    return (state, p, n[-1], n[0][0])


def incumbents(W):
    """For each midterm, how the president's party's members who ran again fared: those first elected two years before
    against those elected earlier. A member is the previous winner with the same surname and party in the same state,
    with the same first initial or in the same district; MEDSL spells names differently from year to year."""
    won = defaultdict(dict)  # year -> person -> district
    for (y, s, d), v in W.items():
        won[y][person(v['name'], s, v['w'])] = d
    out = {}
    for y, p in PRESIDENT.items():
        if y - 4 not in won or y not in won:
            continue
        before = {k: d for k, d in won[y - 2].items() if k[1] == p}
        tally = {'fresh': [0, 0], 'vets': [0, 0]}  # [lost, ran]
        for (yy, s, d), v in W.items():
            if yy != y:
                continue
            for name, cp in v['cands']:
                k = person(name, s, cp)
                same = next((b for b in before if b[:3] == k[:3] and (b == k or before[b] == d)), None)
                if same is None:
                    continue
                t = tally['vets' if same in won[y - 4] else 'fresh']
                t[1] += 1
                t[0] += v['w'] != cp
        out[y] = tally
    # the class the president's party elected with him in 2024, and how many took seats the other party held
    fresh = [k for k in won[2024] if k[1] == 'R' and k not in won[2022]]
    took = sum(1 for (y, s, d), v in W.items() if y == 2024 and v['w'] == 'R' and person(v['name'], s, 'R') in fresh
               and W.get((2022, s, d), {}).get('w') == 'D')
    return out, {'fresh': len(fresh), 'took': took}


@functools.cache
def senate_rows():
    return list(csv.DictReader(io.StringIO(get(SENATE))))


def senate_map_2026():
    """The 35 Senate seats up in 2026, each with the party that holds it and Trump's 2024 margin in the state, in points
    of the two-party vote. The regular seats are the ones won in 2020 (Georgia's after its January runoff); Ohio and
    Florida also fill seats in specials, both held by Republican appointees."""
    votes = defaultdict(Counter)
    for r in senate_rows():
        y, stage = int(r['year']), r['stage'].upper()
        if r['special'].upper() == 'TRUE' or y not in (2020, 2021) or not ('RUNOFF' in stage if y == 2021 else stage == 'GEN'):
            continue
        p = {'DEMOCRAT': 'D', 'REPUBLICAN': 'R'}.get(r['party_simplified'])
        if p is None:  # MEDSL files a few major-party winners as OTHER; the detailed label still names the party
            det = r['party_detailed'].upper()
            p = 'D' if 'DEMOCRAT' in det else 'R' if 'REPUBLICAN' in det else 'O'
        votes[(r['state_po'], y)][p] += float(r['candidatevotes'] or 0)
    held = {}
    for (s, y), v in votes.items():
        if y == 2021 or (s, 2021) not in votes:
            held[s] = max(v, key=v.get)
    held.update({'OH': 'R', 'FL': 'R'})
    held['WY'] = 'R'  # MEDSL's 2020 Wyoming rows carry no party; the winner, Cynthia Lummis, is a Republican
    pres = defaultdict(Counter)
    for r in csv.DictReader(io.StringIO(get(PRESIDENT_VOTES))):
        if r['year'] == '2024' and r['party_simplified'] in ('DEMOCRAT', 'REPUBLICAN'):
            pres[r['state_po']][r['party_simplified'][0]] += float(r['candidatevotes'])
    seats = [{'s': s, 'h': h, 'm': round((pres[s]['R'] - pres[s]['D']) / (pres[s]['R'] + pres[s]['D']) * 100, 1),
              'special': s in ('OH', 'FL')} for s, h in held.items()]
    if len(seats) != 35 or any(x['h'] not in 'DR' for x in seats):
        sys.exit(f'2026 Senate map: {len(seats)} seats, {[x for x in seats if x["h"] not in "DR"]}')
    return sorted(seats, key=lambda x: x['m'])


def senate_vs_house(W):
    """Each midterm Senate race against the House vote in the same state on the same day: the president's party's share
    of the two-party vote in each, and who won. Races an independent won are left out."""
    rows = senate_rows()
    votes, runoff, lead = defaultdict(Counter), defaultdict(Counter), defaultdict(Counter)
    for r in rows:
        y, stage = int(r['year']), r['stage'].upper()
        if y not in PRESIDENT:
            continue
        key = (y, r['state_po'], r['special'].upper() == 'TRUE')
        v = float(r['candidatevotes'] or 0)
        p = {'DEMOCRAT': 'D', 'REPUBLICAN': 'R'}.get(r['party_simplified'])
        if stage == 'GEN':
            lead[key][(r['candidate'], p)] += v
            if p:
                votes[key][p] += v
        elif 'RUNOFF' in stage and p:  # Georgia's December runoffs decide the seat
            runoff[key][p] += v
    house = defaultdict(Counter)
    for (y, s, _), v in W.items():
        house[(y, s)].update({'D': v['D'], 'R': v['R']})
    out = []
    for (y, s, special), v in sorted(votes.items()):
        h = house[(y, s)]
        if not (v['D'] and v['R'] and h['D'] and h['R']) or max(lead[(y, s, special)].items(), key=lambda kv: kv[1])[0][1] is None:
            continue
        p = PRESIDENT[y]
        decided = runoff[(y, s, special)] or v
        out.append({
            'y': y, 's': s, 'special': special,
            'sen': round(v[p] / (v['D'] + v['R']) * 100, 1), 'house': round(h[p] / (h['D'] + h['R']) * 100, 1),
            'win': max('DR', key=lambda q: decided[q]), 'houseWin': 'D' if h['D'] > h['R'] else 'R',
        })
    return out


def turnout():
    """{(year, state): VEP turnout %}, 1980 to 2022."""
    out = {}
    for r in csv.DictReader(io.StringIO(get(TURNOUT))):
        s = r['STATE_ABV']
        if s not in NAMES:
            continue
        rate = r['VEP_TURNOUT_RATE'].strip().rstrip('%')
        if rate:
            out[(int(r['YEAR']), s)] = float(rate)
            continue
        top = r['VOTE_FOR_HIGHEST_OFFICE'].replace(',', '').strip()
        if top.isdigit():
            out[(int(r['YEAR']), s)] = round(int(top) / int(r['VEP'].replace(',', '')) * 100, 2)
    return out


def turnout_one(url):
    """{state: VEP turnout %} from one year's file, empty while it has none."""
    try:
        rows = list(csv.DictReader(io.StringIO(get(url))))
    except Exception as e:  # the file may move once the count is done
        print(f'{url}: {e}', file=sys.stderr)
        return {}
    out = {}
    for r in rows:
        rate = r['VEP_TURNOUT_RATE'].strip().rstrip('%')
        if r['STATE_ABV'] in NAMES and rate:
            v = float(rate)
            out[r['STATE_ABV']] = round(v * 100 if v < 1 else v, 1)
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    W = districts(sys.argv[1])
    years = sorted({y for y, _, _ in W})

    seats = {y: {s: [0, 0, 0] for s in NAMES} for y in years}
    for (y, s, _), v in W.items():
        seats[y][s]['DRO'.index(v['w'])] += 1
    for y in years:
        if sum(map(sum, seats[y].values())) != 435:
            sys.exit(f'{y}: {sum(map(sum, seats[y].values()))} seats, not 435')

    # How each midterm moved districts drawn the same both times: the change in the president's party's share of the
    # two-party vote, among districts both parties contested in both elections.
    swing = {}
    for y, p in PRESIDENT.items():
        if y in NEW_MAPS or y not in seats:
            continue
        moves, by_state = [], defaultdict(list)
        for (yy, s, d), v in W.items():
            b = W.get((y - 2, s, d))
            if yy != y or not b or not (v['D'] and v['R'] and b['D'] and b['R']):
                continue
            x = (v[p] / (v['D'] + v['R']) - b[p] / (b['D'] + b['R'])) * 100
            moves.append(x)
            by_state[s].append(x)
        swing[y] = {
            'n': len(moves), 'against': sum(1 for x in moves if x < 0), 'median': round(st.median(moves), 1),
            'states': {s: round(st.median(v), 1) for s, v in by_state.items() if len(v) >= 3},
        }

    # Is there a state that always swings harder than the country? Correlate each state's swing, less the national
    # median, between one midterm and the next.
    def corr(a, b):
        ma, mb = st.mean(a), st.mean(b)
        num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
        return num / (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** .5
    sy = sorted(swing)
    rel = {y: {s: v - swing[y]['median'] for s, v in swing[y]['states'].items()} for y in sy}
    links = []
    for a, b in zip(sy, sy[1:]):
        both = [s for s in rel[a] if s in rel[b]]
        links.append({'a': a, 'b': b, 'r': round(corr([rel[a][s] for s in both], [rel[b][s] for s in both]), 2), 'n': len(both)})

    south = [[y, sum(seats[y][s][0] for s in SOUTH), sum(sum(seats[y][s]) for s in SOUTH)] for y in years]

    T = turnout()
    t24, t26 = turnout_one(TURNOUT_2024), turnout_one(TURNOUT_2026)
    mids = [y for y in range(2002, 2023, 4)]
    kept = {}
    for s in NAMES:
        r = [T[(y, s)] / T[(y - 2, s)] for y in mids if (y, s) in T and (y - 2, s) in T]
        kept[s] = round(st.mean(r) * 100, 1)
    turn = {y: {s: T[(y, s)] for s in NAMES if (y, s) in T} for y in (2018, 2020, 2022)}
    turn[2024] = t24

    close = {}
    for (y, s, _), v in W.items():
        if y == 2024 and v['w'] == 'R' and v['D'] and v['R']:
            m = (v['R'] - v['D']) / (v['D'] + v['R']) * 100
            c = close.setdefault(s, [0, 0])
            c[0] += m < 5
            c[1] += m < 10
    close = {s: c for s, c in close.items() if c[1]}

    splits = senate_vs_house(W)
    senate2026 = senate_map_2026()
    freshmen, class2024 = incumbents(W)
    # seats the out-party left without a candidate of its own, in each midterm
    uncontested = {y: sum(1 for (yy, s, d), v in W.items() if yy == y and v['w'] == p and not v['R' if p == 'D' else 'D'])
                   for y, p in PRESIDENT.items() if y in seats}

    data = {
        'names': NAMES, 'president': PRESIDENT, 'newMaps': sorted(NEW_MAPS), 'south': SOUTH,
        'seats': {str(y): {s: v for s, v in seats[y].items() if any(v)} for y in years},
        'swing': swing, 'links': links, 'southSeats': south,
        'kept': kept, 'turnout': turn, 'turnout2026': t26,
        'governorOdd': GOVERNOR_ODD, 'governorPresidential': GOVERNOR_PRESIDENTIAL,
        'close2024': close, 'newLines2026': NEW_LINES_2026, 'splits': splits,
        'freshmen': freshmen, 'class2024': class2024, 'uncontested': uncontested,
        'uncontested2026': UNCONTESTED_2026, 'senate2026': senate2026,
    }
    text = (
        '// Written by _states.py from the MIT Election Lab\'s House and Senate returns and the UF Election Lab\'s turnout.\n'
        f'window.STATES = {json.dumps(data, separators=(",", ":"))};\n'
    )
    if OUT.exists() and OUT.read_text() == text:
        print('states.js unchanged')
        return
    OUT.write_text(text)
    print(f'states.js: {len(years)} elections, {len(swing)} same-map midterms, {len(close)} states with close Republican seats, '
          f'{len(splits)} midterm Senate races, 2026 turnout for {len(t26)} states')


if __name__ == '__main__':
    main()
