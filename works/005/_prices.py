#!/usr/bin/env python3
"""Fetch the daily closes No. 005 is drawn from: works/005/prices.json.

    python3 works/005/_prices.py

For each company in TICKERS, about 20 months of split-adjusted daily closes from Nasdaq's public quote API. The page
takes the last 252 trading days as the year; the 199 before them feed the 200-day average on the year's first day.

The daily Action (.github/workflows/daily.yml) runs this just after midnight New York time, when the day's close is
final. On days the market was shut nothing changes. If fewer than 90% of the companies come back, the file already
there stays, and so does the daily build. Running it twice changes nothing.
"""

import csv
import datetime
import io
import json
import os
import sys
import time
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
OUT = HERE / 'prices.json'
ZONE = ZoneInfo('America/New_York')
DAYS = 451  # 252 for the year, 199 before it for the 200-day average
GAPS = 3  # missing days a company may have forward-filled before it is left out
ENOUGH = 0.9  # share of companies that must come back, or the old file stays
CLIFF = 0.6  # a close below this share of the day before is left out: almost always a spin-off Nasdaq doesn't adjust for
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
MEMBERS = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv'

# Companies most people recognize, across sectors, with the short names the page shows.
# Each must be in the S&P 500; one that leaves the index drops out by itself.
TICKERS = [
    # technology
    ('AAPL', 'Apple'), ('MSFT', 'Microsoft'), ('NVDA', 'Nvidia'), ('ADBE', 'Adobe'), ('CRM', 'Salesforce'),
    ('ORCL', 'Oracle'), ('INTC', 'Intel'), ('AMD', 'AMD'), ('CSCO', 'Cisco'), ('IBM', 'IBM'), ('QCOM', 'Qualcomm'),
    ('AVGO', 'Broadcom'), ('PLTR', 'Palantir'), ('DELL', 'Dell'), ('MU', 'Micron'), ('INTU', 'Intuit'),
    # communication and media
    ('GOOGL', 'Alphabet'), ('META', 'Meta'), ('NFLX', 'Netflix'), ('DIS', 'Disney'), ('CMCSA', 'Comcast'),
    ('T', 'AT&T'), ('VZ', 'Verizon'),
    # shops, brands, travel and cars
    ('AMZN', 'Amazon'), ('TSLA', 'Tesla'), ('NKE', 'Nike'), ('SBUX', 'Starbucks'), ('MCD', "McDonald's"),
    ('HD', 'Home Depot'), ('LOW', "Lowe's"), ('TGT', 'Target'), ('F', 'Ford'), ('GM', 'General Motors'),
    ('UBER', 'Uber'), ('ABNB', 'Airbnb'), ('EBAY', 'eBay'), ('BKNG', 'Booking'), ('EXPE', 'Expedia'),
    ('MAR', 'Marriott'), ('HLT', 'Hilton'), ('CMG', 'Chipotle'), ('YUM', 'Yum! Brands'), ('DPZ', "Domino's"),
    ('LULU', 'Lululemon'), ('RL', 'Ralph Lauren'), ('TJX', 'TJX'), ('HAS', 'Hasbro'), ('CCL', 'Carnival'),
    ('RCL', 'Royal Caribbean'),
    # food, drink and household
    ('KO', 'Coca-Cola'), ('PEP', 'PepsiCo'), ('PG', 'Procter & Gamble'), ('COST', 'Costco'), ('WMT', 'Walmart'),
    ('HSY', 'Hershey'), ('KHC', 'Kraft Heinz'), ('GIS', 'General Mills'), ('CL', 'Colgate-Palmolive'),
    ('EL', 'Estée Lauder'), ('KDP', 'Keurig Dr Pepper'), ('CLX', 'Clorox'), ('KR', 'Kroger'), ('MNST', 'Monster Beverage'),
    # health
    ('JNJ', 'Johnson & Johnson'), ('PFE', 'Pfizer'), ('MRK', 'Merck'), ('LLY', 'Eli Lilly'), ('ABBV', 'AbbVie'),
    ('UNH', 'UnitedHealth'), ('CVS', 'CVS Health'), ('MRNA', 'Moderna'), ('AMGN', 'Amgen'),
    # money
    ('JPM', 'JPMorgan Chase'), ('BAC', 'Bank of America'), ('WFC', 'Wells Fargo'), ('GS', 'Goldman Sachs'),
    ('MS', 'Morgan Stanley'), ('C', 'Citigroup'), ('V', 'Visa'), ('MA', 'Mastercard'), ('AXP', 'American Express'),
    ('BRK.B', 'Berkshire Hathaway'), ('BLK', 'BlackRock'), ('SCHW', 'Charles Schwab'), ('COF', 'Capital One'),
    ('PYPL', 'PayPal'), ('HOOD', 'Robinhood'), ('COIN', 'Coinbase'),
    # industry, transport and energy
    ('BA', 'Boeing'), ('CAT', 'Caterpillar'), ('DE', 'John Deere'), ('GE', 'GE Aerospace'), ('UPS', 'UPS'),
    ('FDX', 'FedEx'), ('LMT', 'Lockheed Martin'), ('HON', 'Honeywell'), ('MMM', '3M'), ('DAL', 'Delta Air Lines'),
    ('UAL', 'United Airlines'), ('LUV', 'Southwest Airlines'), ('XOM', 'ExxonMobil'), ('CVX', 'Chevron'),
    ('SHW', 'Sherwin-Williams'),
]


def get(url, timeout=20):
    request = urllib.request.Request(url, headers={
        'User-Agent': UA, 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def members():
    """The S&P 500's symbols, or None if the list can't be read (then every company in TICKERS is kept)."""
    try:
        return {row['Symbol'] for row in csv.DictReader(io.StringIO(get(MEMBERS).decode('utf-8')))}
    except Exception as e:
        print(f'Could not read the S&P 500 list ({e}); keeping every company.')
        return None


def parse_rows(rows):
    """Nasdaq's rows (newest first, "10/28/2026" and "$1,234.56") as [(YYYY-MM-DD, close)], oldest first."""
    out = []
    for row in rows or []:
        try:
            m, d, y = row['date'].split('/')
            close = float(row['close'].replace('$', '').replace(',', ''))
        except (KeyError, ValueError, AttributeError):
            continue
        if close > 0:
            out.append((f'{y}-{m}-{d}', close))
    return sorted(out)


def fetch(symbol, today, closed):
    """A company's daily closes, oldest first, or None after three tries. Today's row counts only once `closed`."""
    start = today - datetime.timedelta(days=700)
    url = (f'https://api.nasdaq.com/api/quote/{symbol}/historical?assetclass=stocks'
           f'&fromdate={start.isoformat()}&todate={today.isoformat()}&limit=9999')
    for attempt in range(3):
        try:
            data = json.loads(get(url))['data']
            rows = [r for r in parse_rows(data['tradesTable']['rows']) if closed or r[0] < today.isoformat()]
            if rows:
                return rows
        except Exception as e:
            print(f'  {symbol}: {type(e).__name__} {e}')
        time.sleep(1.5 * (attempt + 1))
    return None


def align(series, days=DAYS, gaps=GAPS):
    """Put every company on one calendar of trading days: the dates at least half of them traded, last `days` of them.

    A company missing a day takes the close before it, up to `gaps` times; one with more gaps, or without a close on
    the first day, is left out. Returns (dates, {symbol: closes}).
    """
    if not series:
        return [], {}
    counts = Counter(d for rows in series.values() for d, _ in rows)
    calendar = sorted(d for d, n in counts.items() if n * 2 >= len(series))[-days:]
    if len(calendar) < days:
        return [], {}
    out = {}
    for symbol, rows in series.items():
        by_day = dict(rows)
        before = [c for d, c in rows if d < calendar[0]]
        last = by_day.get(calendar[0], before[-1] if before else None)
        if last is None:
            continue
        closes, missing = [], 0
        for d in calendar:
            if d in by_day:
                last = by_day[d]
            else:
                missing += 1
            closes.append(last)
        if missing <= gaps:
            out[symbol] = closes
    return calendar, out


def cliff(dates, closes):
    """The first day a close fell below CLIFF of the one before, or None. Such a fall would draw a false cliff."""
    for d, a, b in zip(dates[1:], closes, closes[1:]):
        if b < CLIFF * a:
            return d
    return None


def enough(got, wanted):
    return wanted > 0 and got >= ENOUGH * wanted


def render(dates, closes, names):
    """The JSON, one company to a line so a day's change reads in a diff."""
    head = json.dumps({'through': dates[-1], 'dates': dates}, separators=(',', ':'))[:-1]
    lines = [json.dumps({'t': s, 'name': names[s], 'closes': closes[s]}, ensure_ascii=False, separators=(',', ':'))
             for s in names if s in closes]
    return head + ',"tickers":[\n' + ',\n'.join(lines) + '\n]}\n'


def main():
    now = datetime.datetime.now(ZONE)
    today, closed = now.date(), now.hour >= 18  # run by hand during a trading day, today's price isn't a close yet
    index = members()
    names = {s: n for s, n in TICKERS if index is None or s in index}
    for s, _ in TICKERS:
        if s not in names:
            print(f'{s} is no longer in the S&P 500; leaving it out.')

    with ThreadPoolExecutor(max_workers=4) as pool:
        fetched = dict(zip(names, pool.map(lambda s: fetch(s, today, closed), names)))
    series = {s: rows for s, rows in fetched.items() if rows}
    dates, closes = align(series)
    for s in names:
        if s not in closes:
            print(f'{s}: no usable closes; leaving it out today.')
        elif cliff(dates, closes[s]):
            print(f'{s} fell more than {1 - CLIFF:.0%} on {cliff(dates, closes[s])}, likely a spin-off; leaving it out.')
            del closes[s]

    if not enough(len(closes), len(names)):
        print(f'Only {len(closes)} of {len(names)} companies came back; keeping {OUT.name} as it is.')
        return 0
    text = render(dates, closes, names)
    if OUT.exists() and OUT.read_text(encoding='utf-8') == text:
        print(f'No change: {len(closes)} companies through {dates[-1]}.')
        return 0
    temp = OUT.with_suffix('.json.tmp')
    temp.write_text(text, encoding='utf-8')
    os.replace(temp, OUT)
    print(f'Wrote {OUT.name}: {len(closes)} companies, {len(dates)} days through {dates[-1]}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
