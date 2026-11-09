#!/usr/bin/env python3
"""Fetch the record No. 009 is drawn from and write works/009/midterms.js.

    python3 works/009/_midterms.py

Three public sources, all fetched again on every run:

- House seats held by each party when every Congress opened, 1789 to now, from the Office of the Historian of the
  House (history.house.gov). The seat change of the president's party up to 1930 is worked out from it.
- The seat change of the president's party in the House and Senate, and Gallup's job approval before the vote, for
  every midterm since 1934, from The American Presidency Project at UC Santa Barbara (presidency.ucsb.edu). These are
  the figures usually quoted, so they are used from 1934 on.
- Turnout of the voting-eligible population in every federal election since 1789, from Michael McDonald's UF
  Election Lab (election.lab.ufl.edu), Walter Dean Burnham's figures before 1948. The 2026 file there fills in as
  ballots are counted.

The 2026 seat results are entered by hand in RESULTS_2026 once the races are called. Running it twice changes nothing.
"""

import csv
import html
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'midterms.js'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

HOUSE = 'https://history.house.gov/Institution/Party-Divisions/Party-Divisions/'
UCSB = 'https://www.presidency.ucsb.edu/statistics/data/seats-congress-gainedlost-the-presidents-party-mid-term-elections'
TURNOUT = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/US_VEP_Turnout_Rates_v1.4.csv'
TURNOUT_2026 = 'https://election.lab.ufl.edu/data-downloads/turnoutdata/Turnout_2026G_v0.2.csv'

# 2026, by hand, once the races are called. house: seats won by the Republicans, the president's party, of 435.
# senate: Republican seats in the Senate that opens in January. Leave a chamber as None while it is still being counted.
# by_state: House seats in each state where every race has been called, as {'PA': [Democrats, Republicans], ...}; a state
# with races still out stays off the list. Once all 435 are in, house is added up from it. senate_by_state: the party
# that won each Senate race called so far, as {'ME': 'D', ...}. house_called and senate_called: the national count so
# far, as [Democrats, Republicans], shown until the chamber is final. senate_shares: each Senate race's vote so far.
RESULTS_2026 = {
    'by_state': {  # AP race calls, 6:30 p.m. 8 November: 38 states fully called
        'AL': [2, 5], 'AR': [0, 4], 'CT': [5, 0], 'DE': [1, 0], 'GA': [5, 9], 'HI': [2, 0], 'ID': [0, 2],
        'IL': [14, 3], 'IN': [3, 6], 'IA': [3, 1], 'KS': [1, 3], 'KY': [2, 4], 'MD': [7, 1], 'MA': [9, 0],
        'MI': [9, 4], 'MS': [1, 3], 'MO': [3, 5], 'MT': [1, 1], 'NE': [1, 2], 'NV': [4, 0], 'NH': [2, 0],
        'NJ': [11, 1], 'NM': [3, 0], 'NY': [20, 6], 'ND': [0, 1], 'OH': [8, 7], 'OK': [0, 5], 'OR': [5, 1], 'PA': [11, 6], 'RI': [2, 0],
        'SD': [0, 1], 'TX': [14, 24], 'UT': [1, 3], 'VT': [1, 0], 'VA': [8, 3], 'WV': [0, 2], 'WI': [4, 4],
        'WY': [0, 1],
    },
    'senate_by_state': {  # AP race calls; Alaska and Mississippi uncalled
        'CO': 'D', 'DE': 'D', 'GA': 'D', 'IL': 'D', 'MA': 'D', 'MI': 'D', 'MN': 'D', 'NH': 'D', 'NJ': 'D', 'NM': 'D',
        'OR': 'D', 'RI': 'D', 'VA': 'D',
        'IA': 'D', 'KS': 'D', 'ME': 'D', 'NC': 'D', 'OH': 'D', 'SC': 'D', 'TX': 'D',
        'AL': 'R', 'AR': 'R', 'FL': 'R', 'ID': 'R', 'KY': 'R', 'LA': 'R', 'MT': 'R', 'NE': 'R', 'OK': 'R', 'SD': 'R',
        'TN': 'R', 'WV': 'R', 'WY': 'R',
    },
    'senate_shares': {  # percent of the vote, [Democrat, Republican], from AP's vote count at 6:30 p.m. 8 November
        'MA': [63.4, 32.1], 'DE': [63.6, 36.4], 'OR': [58.1, 38.7], 'RI': [66.8, 29.3], 'CO': [60.4, 35.0],
        'IL': [61.4, 37.1], 'ME': [53.1, 46.8], 'NM': [63.3, 36.7], 'NJ': [62.3, 35.1], 'VA': [61.2, 38.5],
        'MN': [53.7, 43.6], 'NH': [55.9, 42.2], 'MI': [52.5, 45.5], 'GA': [59.0, 41.0], 'NC': [58.7, 39.1],
        'OH': [50.0, 45.2], 'FL': [48.0, 50.9], 'IA': [50.5, 46.4], 'AK': [48.2, 47.9], 'TX': [55.1, 43.0],
        'KS': [51.0, 46.0], 'SC': [51.1, 46.6], 'LA': [49.1, 50.9], 'MS': [49.1, 48.8], 'TN': [42.9, 55.1],
        'AL': [45.3, 54.7], 'KY': [42.9, 55.0], 'AR': [42.4, 54.3], 'OK': [39.3, 57.2], 'WV': [37.9, 58.3],
        'WY': [34.8, 65.2],
    },  # Idaho, Montana, Nebraska and South Dakota had no Democrat on the ballot
    'house_called': [252, 161],
    'senate_called': [54, 44],
    'house': None,
    'house_estimate': 176,  # Republican seats in the NBC News Decision Desk's estimate, used until house is set
    'senate': None,
    'as_of': '2026-11-08 18:30',  # 'YYYY-MM-DD HH:MM' New York time, when the numbers above were last checked
    'note': '22 House races and the Senate races in Alaska and Mississippi are still uncalled. Until the House count is final, its 2026 figures are NBC News’s estimate.',
}

SENATE_DEFEND_2026 = 22  # Republican seats among the 35 up, with the Ohio and Florida specials (270toWin, 3 November 2026)

# The president's party in every midterm before 1934, and which of the House table's two named columns holds it:
# 0 is the first party column, 1 the second. None where no party carried over (1822, when the Republicans split into
# factions, and 1866, when Andrew Johnson led no party in the House).
EARLY = [
    (1790, 'George Washington', 'Pro-Administration', 'F', 0),
    (1794, 'George Washington', 'Federalist', 'F', 0),
    (1798, 'John Adams', 'Federalist', 'F', 0),
    (1802, 'Thomas Jefferson', 'Democratic-Republican', 'DR', 1),
    (1806, 'Thomas Jefferson', 'Democratic-Republican', 'DR', 1),
    (1810, 'James Madison', 'Democratic-Republican', 'DR', 1),
    (1814, 'James Madison', 'Democratic-Republican', 'DR', 1),
    (1818, 'James Monroe', 'Democratic-Republican', 'DR', 1),
    (1822, 'James Monroe', 'Democratic-Republican', 'DR', None),
    (1826, 'John Quincy Adams', 'Adams', 'NR', 0),
    (1830, 'Andrew Jackson', 'Jacksonian', 'D', 1),
    (1834, 'Andrew Jackson', 'Jacksonian', 'D', 1),
    (1838, 'Martin Van Buren', 'Democratic', 'D', 0),
    (1842, 'John Tyler', 'Whig', 'W', 1),  # elected a Whig, expelled by the party in 1841
    (1846, 'James K. Polk', 'Democratic', 'D', 0),
    (1850, 'Millard Fillmore', 'Whig', 'W', 1),
    (1854, 'Franklin Pierce', 'Democratic', 'D', 0),
    (1858, 'James Buchanan', 'Democratic', 'D', 0),
    (1862, 'Abraham Lincoln', 'Republican', 'R', 1),
    (1866, 'Andrew Johnson', 'National Union', 'NU', None),
    (1870, 'Ulysses S. Grant', 'Republican', 'R', 1),
    (1874, 'Ulysses S. Grant', 'Republican', 'R', 1),
    (1878, 'Rutherford B. Hayes', 'Republican', 'R', 1),
    (1882, 'Chester A. Arthur', 'Republican', 'R', 1),
    (1886, 'Grover Cleveland', 'Democratic', 'D', 0),
    (1890, 'Benjamin Harrison', 'Republican', 'R', 1),
    (1894, 'Grover Cleveland', 'Democratic', 'D', 0),
    (1898, 'William McKinley', 'Republican', 'R', 1),
    (1902, 'Theodore Roosevelt', 'Republican', 'R', 1),
    (1906, 'Theodore Roosevelt', 'Republican', 'R', 1),
    (1910, 'William Howard Taft', 'Republican', 'R', 1),
    (1914, 'Woodrow Wilson', 'Democratic', 'D', 0),
    (1918, 'Woodrow Wilson', 'Democratic', 'D', 0),
    (1922, 'Warren G. Harding', 'Republican', 'R', 1),
    (1926, 'Calvin Coolidge', 'Republican', 'R', 1),
    (1930, 'Herbert Hoover', 'Republican', 'R', 1),
]

PARTY_NAMES = {'D': 'Democratic', 'R': 'Republican'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')


def cells(row):
    return [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<.*?>', '', c))).strip() for c in re.findall(r'<t[dh].*?</t[dh]>', row, re.S)]


def house_divisions():
    """Seats held when each Congress opened: {congress: (total, first party, second party)}."""
    page = get(HOUSE)
    table = page[page.find('<table'):page.find('</table>')]
    out = {}
    for row in re.findall(r'<tr.*?</tr>', table, re.S):
        c = cells(row)
        m = re.match(r'(\d+)(st|nd|rd|th) \((\d{4})', c[0]) if c else None
        if not m:
            continue
        total = int(c[1][:3])  # a footnote mark can follow the seat count: "4355" is 435, note 5
        out[int(m.group(1))] = (total, int(c[2]), int(c[3]))
    if len(out) < 115:
        sys.exit(f'House table: only {len(out)} Congresses read')
    return out


def num(s):
    s = s.strip().replace('+', '')
    return int(s) if re.fullmatch(r'-?\d+', s) else None


def ucsb():
    """{year: row} for every midterm since 1934, 2026 included."""
    page = get(UCSB)
    table = page[page.find('<table'):page.rfind('</table>')]
    readings = ['early August', 'late August', 'early September', 'late September', 'early October', 'late October']
    out = {}
    for row in re.findall(r'<tr.*?</tr>', table, re.S):
        c = cells(row)
        if len(c) < 14 or not re.fullmatch(r'\d{4}', c[0]):
            continue
        approval = None
        for when, v in zip(readings, c[4:10]):
            if num(v) is not None:
                approval = {'v': num(v), 'when': when}
        president = re.sub(r'-(I|II)$', '', c[2]).replace(' (Nixon)', '')
        out[int(c[0])] = {
            'president': president, 'party': c[3], 'approval': approval,
            'house_defend': num(c[10]), 'senate_defend': num(c[11]),
            'house_change': num(c[12]), 'senate_change': num(c[13]),
        }
    if 2022 not in out:
        sys.exit('American Presidency Project table: 2022 not found')
    return out


def turnout():
    rows = list(csv.DictReader(io.StringIO(get(TURNOUT))))
    out = []
    for r in rows:
        y = int(r['YEAR'])
        for kind, col in (('p', 'TURNOUT_RATE_PRES'), ('m', 'TURNOUT_RATE_MIDTERM')):
            if r[col].strip():
                out.append({'y': y, 'kind': kind, 'v': round(float(r[col]) * 100, 1)})
    return out


def turnout_2026():
    """The UF Election Lab's national 2026 estimate, or None while it has none."""
    try:
        rows = list(csv.DictReader(io.StringIO(get(TURNOUT_2026))))
    except Exception as e:  # the file may move once the count is done; the rest of the record still stands
        print(f'2026 turnout: {e}', file=sys.stderr)
        return None
    us = next((r for r in rows if r['STATE_ABV'] == 'US'), None)
    if not us:
        return None
    rate = us['VEP_TURNOUT_RATE'].strip().rstrip('%')
    ballots = us['TOTAL_BALLOTS_COUNTED'].replace(',', '').strip()
    vep = int(us['VEP'].replace(',', ''))
    if not rate and not ballots:
        return {'v': None, 'vep': vep}
    v = float(rate) if rate else int(ballots) / vep * 100
    if v < 1:  # a share rather than a percentage
        v *= 100
    return {'v': round(v, 1), 'vep': vep, 'ballots': int(ballots) if ballots else None}


def main():
    house = house_divisions()
    modern = ucsb()
    turn = turnout()
    mid_turnout = {t['y']: t['v'] for t in turn if t['kind'] == 'm'}

    def congress(y):  # the Congress elected in year y
        return (y - 1788) // 2 + 1

    midterms = []
    for y, president, name, party, col in EARLY:
        before, after = house[congress(y - 2)], house[congress(y)]
        m = {'y': y, 'president': president, 'party': party, 'partyName': name, 'turnout': mid_turnout.get(y)}
        if col is not None:
            m.update(seats0=before[1 + col], seats1=after[1 + col], size0=before[0], size1=after[0])
            m['change'] = m['seats1'] - m['seats0']
        midterms.append(m)

    for y in sorted(modern):
        if y == 2026:
            continue
        r = modern[y]
        before, after = house[congress(y - 2)], house[congress(y)]
        m = {
            'y': y, 'president': r['president'], 'party': r['party'], 'partyName': PARTY_NAMES[r['party']],
            'seats0': r['house_defend'], 'seats1': r['house_defend'] + r['house_change'], 'change': r['house_change'],
            'size0': before[0], 'size1': after[0],
            'senate': {'change': r['senate_change'], 'defend': r['senate_defend']},
            'approval': r['approval'], 'turnout': mid_turnout.get(y),
        }
        if y in (1950, 1958, 1986, 1998, 2006, 2014):
            m['second'] = True  # the second midterm of a two-term presidency
        midterms.append(m)

    for m in midterms:
        if 'seats0' in m:
            m['share0'] = round(m['seats0'] / m['size0'] * 100, 2)
            m['share1'] = round(m['seats1'] / m['size1'] * 100, 2)
            m['shift'] = round(m['share1'] - m['share0'], 2)

    by_state = RESULTS_2026['by_state']
    if sum(map(sum, by_state.values())) == 435 and RESULTS_2026['house'] is None:
        RESULTS_2026['house'] = sum(r for _, r in by_state.values())
    r26 = modern.get(2026, {})
    now = house[max(house)]
    y2026 = {
        'y': 2026, 'president': 'Donald J. Trump', 'party': 'R', 'partyName': 'Republican',
        'seats0': r26.get('house_defend') or now[2], 'size0': 435, 'majority': 218,
        # The APP's 2026 row lists 20 Republican seats up, the regular class only; its earlier rows count specials too
        # (Mississippi's in 2018, Oklahoma's in 2022), so the specials in Ohio and Florida are added here.
        'senate': {'defend': SENATE_DEFEND_2026, 'seats0': 53, 'majority': 51},  # the vice president breaks a 50-50 tie
        'approval': r26.get('approval'),
        'turnout': turnout_2026(),
        'house': RESULTS_2026['house'] if RESULTS_2026['house'] is not None else RESULTS_2026['house_estimate'],
        'estimate': RESULTS_2026['house'] is None and RESULTS_2026['house_estimate'] is not None,
        'senateSeats': RESULTS_2026['senate'], 'byState': by_state,
        'senateCalls': RESULTS_2026['senate_by_state'],
        'senateShares': RESULTS_2026['senate_shares'], 'houseCalled': RESULTS_2026['house_called'], 'senateCalled': RESULTS_2026['senate_called'],
        'asOf': RESULTS_2026['as_of'], 'note': RESULTS_2026['note'],
    }
    if y2026['house'] is not None:
        y2026['change'] = y2026['house'] - y2026['seats0']
        y2026['share0'] = round(y2026['seats0'] / 435 * 100, 2)
        y2026['share1'] = round(y2026['house'] / 435 * 100, 2)
        y2026['shift'] = round(y2026['share1'] - y2026['share0'], 2)
    if y2026['senateSeats'] is not None:
        y2026['senate']['change'] = y2026['senateSeats'] - y2026['senate']['seats0']

    # Every change of House control since 1946, by the seats each party held as the House opened. (Earlier counts can
    # mislead: in 1916 and 1930 the party with fewer seats organized the House, so the list starts after them.)
    control, held = [], None
    for y in range(1944, max(house) * 2 + 1787, 2):
        n = congress(y)
        if n not in house:
            break
        total, d, r = house[n]
        party = 'D' if d > r else 'R'
        if held and party != held:
            control.append({'y': y, 'kind': 'midterm' if y % 4 == 2 else 'presidential', 'to': party})
        held = party

    data = {'midterms': midterms, 'turnout': turn, 'y2026': y2026, 'control': control}
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    text = (
        '// Written by _midterms.py from the House Historian, The American Presidency Project and the UF Election Lab.\n'
        '// Edit RESULTS_2026 there, not here.\n'
        f'window.MIDTERMS = {body};\n'
    )
    if OUT.exists() and OUT.read_text() == text:
        print('midterms.js unchanged')
        return
    OUT.write_text(text)
    print(f'midterms.js: {len(midterms)} midterms, {len(turn)} turnout years, 2026 turnout {y2026["turnout"]}')


if __name__ == '__main__':
    main()
