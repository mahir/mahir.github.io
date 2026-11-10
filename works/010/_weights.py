#!/usr/bin/env python3
"""Builds weights.js for No. 010 from the SPDR S&P 500 ETF Trust's own filings with the SEC.

The fund (SPY, CIK 884394) holds the index's companies at the index's weights, so each holding's
share of the fund's stock is that company's share of the S&P 500 to within a few hundredths of a point.
It reported its full holdings once a year from 1995 to 2009 (N-30D, 30 September; 31 December in 1995
and 1996), twice a year from 2010 to 2019 (N-30D, 31 March and 30 September) and every quarter since
September 2019 (NPORT-P). Every one of those reports is read here; nothing in between is estimated.

Companies are matched across reports by name. A renamed company is one line (Facebook, then Meta).
After a merger the line continues from the larger partner (SBC, then AT&T; Exxon, then Exxon Mobil),
and the smaller partner's line ends. The big cases are listed in ALIAS and SPLIT below; smaller renames
are caught when one name stops in a report and a longer or shorter form of it starts in the next.
Share classes of one company are added together.

Run from the repository root:  python3 works/010/_weights.py
Filings are kept in a cache folder (default: works/010/_cache, not committed) so reruns don't refetch.
"""
import re, os, sys, json, html, time, urllib.request
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '_cache')
UA = {'User-Agent': 'research-script contact@example.com'}
CIK = '884394'

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def fetch():
    os.makedirs(CACHE, exist_ok=True)
    idx = os.path.join(CACHE, 'index.json')
    try:
        raw = get(f'https://data.sec.gov/submissions/CIK{CIK.zfill(10)}.json'); open(idx, 'wb').write(raw)
    except Exception as e:
        print('index not refreshed:', e)
    r = json.load(open(idx))['filings']['recent']
    files = {}
    for f, dt, rd, acc, doc in zip(r['form'], r['filingDate'], r['reportDate'], r['accessionNumber'], r['primaryDocument']):
        if not ((f == 'N-30D' and dt < '2019-08') or f == 'NPORT-P'): continue
        if dt == '2014-12-01': rd = '2014-09-30'      # EDGAR lists this report under the wrong year
        a = acc.replace('-', '')
        if f == 'NPORT-P': url, ext = f'https://www.sec.gov/Archives/edgar/data/{CIK}/{a}/primary_doc.xml', 'xml'
        elif doc: url, ext = f'https://www.sec.gov/Archives/edgar/data/{CIK}/{a}/{doc}', doc.rsplit('.', 1)[1]
        else: url, ext = f'https://www.sec.gov/Archives/edgar/data/{CIK}/{acc}.txt', 'txt'
        p = os.path.join(CACHE, f'{rd}_{f}.{ext}'); files[rd] = p
        if not (os.path.exists(p) and os.path.getsize(p) > 1000):
            open(p, 'wb').write(get(url)); print('fetched', os.path.basename(p)); time.sleep(0.25)
    return dict(sorted(files.items()))

num=re.compile(r'^(.*?)[\s.]*\s\$?\s*([\d,]{3,})\s+\$?\s*([\d,]{5,})\s*$')
def clean(n):
    n=html.unescape(n)
    n=re.sub(r'\([a-z](,\s*[a-z])*\)','',n)       # footnote refs (a)
    n=re.sub(r'[\*†‡#+]','',n)
    n=re.sub(r'(\s*\.){2,}.*$','',n)
    n=re.sub(r'\s+',' ',n).strip(' .,')
    return n
def ptext(p):
    t=open(p,encoding='latin-1').read()
    i=re.search(r'COMMON STOCKS[^\n]{0,80}SHARES',t,re.I).start()
    i=t.rfind('\n',0,i)
    lines=t[i:].split('\n'); out=[]; pre=''
    for ln in lines:
        s=ln.rstrip()
        if re.search(r'^\s*Total (Common Stocks|Investments)',s,re.I): break
        if not s.strip() or s.lstrip().startswith('<') or 'SCHEDULE OF INV' in s or re.match(r'^[\s\-=]+$',s) or 'COMMON STOCKS' in s.upper() or re.match(r'^\s*(DECEMBER|SEPTEMBER|MARCH) \d',s) or re.match(r'^\s*\d+\s*$',s) or 'SHARES' in s:
            pre='' if not s.strip() else pre; continue
        m=num.match(s)
        if m:
            name=clean(pre+' '+m.group(1)); pre=''
            out.append((name,int(m.group(3).replace(',',''))))
        else:
            if len(s)<70 and not re.search(r'\d{3}',s): pre=(pre+' '+s.strip()).strip()
            else: pre=''
    return out
def phtml(p):
    t=open(p,encoding='latin-1').read()
    i=t.upper().find('SCHEDULE OF INVESTMENTS'); 
    # skip table-of-contents hits: take the hit followed soonest by 'Shares'
    idx=[m.start() for m in re.finditer('SCHEDULE OF INVESTMENTS',t,re.I)]
    i=re.search(r'Common Stocks(?:(?!Common Stocks).){0,600}?Shares',t,re.S|re.I).start()
    out=[]
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>',t[i:],re.S|re.I):
        cells=[html.unescape(re.sub(r'<[^>]+>','',c)).replace('\xa0',' ').strip() for c in re.findall(r'<td[^>]*>(.*?)</td>',row,re.S|re.I)]
        cells=[c for c in cells if c and c!='$']
        if not cells: continue
        if re.match(r'Total (Common Stocks|Investments)',cells[0],re.I): break
        nums=[c for c in cells[1:] if re.fullmatch(r'\$?\s*[\d,]+',c)]
        if len(nums)>=2 and not re.fullmatch(r'[\d,$ ]+',cells[0]):
            out.append((clean(cells[0]),int(nums[-1].replace(',','').replace('$',''))))
    return out
def pxml(p):
    t=open(p,encoding='utf-8').read()
    t=re.sub(r' xmlns(:\w+)?="[^"]+"','',t); t=re.sub(r' xsi:\w+="[^"]+"','',t); t=re.sub(r'<(/?)\w+:',r'<\1',t)
    root=ET.fromstring(t.encode()); out=[]
    for s in root.iter('invstOrSec'):
        g=lambda k:(s.findtext(k) or '').strip()
        if g('assetCat')!='EC': continue
        tick=''
        for idn in s.iter('ticker'): tick=idn.get('value','')
        out.append((g('name') or g('title'),float(g('valUSD')),g('cusip'),g('title')))
    return out

def key(n):
    s=n.lower().replace('&',' and ').replace('/the','').replace("'",'')
    s=re.sub(r'\(?\bclass [a-z]\b\)?|\bcl [a-z]\b|\bseries [a-z]\b|\bnew\b','',s)
    s=re.sub(r'\([^)]*\)','',s)
    s=re.sub(r'[^a-z0-9 ]',' ',s)
    s=re.sub(r'\b(the|corporation|corp|incorporated|inc|company|companies|cos|co|ltd|limited|plc|nv|sa|ag|holdings|holding|group|and|com|de|of)\b',' ',s)
    s=re.sub(r'\binternational\b','intl',s); s=re.sub(r'\blaboratories\b','lab',s); s=re.sub(r'\bindustries\b','ind',s)
    return re.sub(r'\s+','',s)

# Same name, different company: (key, last report date of the earlier company) -> key for the earlier one.
SPLIT = {
    'att': ('2005-09-30', 'attold'),                 # AT&T Corp., bought by SBC, which took the name
    'bankamerica': ('1997-09-30', 'bankamericaold'), # BankAmerica, bought by NationsBank, which took the name
    'timewarner': ('2000-09-30', 'timewarnerold'),   # Time Warner, bought by America Online
    'travelers': ('1998-09-30', 'travelersgroup'),   # Travelers Group, which merged into Citigroup
    'broadcom': ('2015-09-30', 'broadcomold'),       # Broadcom Corp., bought by Avago, which took the name
    'wachovia': ('2000-09-30', 'wachoviaold'),       # Wachovia, bought by First Union, which took the name
}
ALIAS = {
    'exxon': 'exxonmobil', 'walmartstores': 'walmart', 'facebook': 'metaplatforms', 'google': 'alphabet',
    'philipmorris': 'altria', 'sbccommunications': 'att', 'bellatlantic': 'verizoncommunications',
    'chasemanhattan': 'jpmorganchase', 'citicorp': 'citigroup', 'nationsbank': 'bankofamerica', 'bankamerica': 'bankofamerica',
    'americaonline': 'timewarner', 'aoltimewarner': 'timewarner', 'chevrontexaco': 'chevron',
    'mciworldcom': 'worldcom', 'hewlettpackard': 'hp', 'lilly': 'elililly', 'disney': 'waltdisney',
    'dellcomputer': 'dell', 'delltechnologies': 'dell', 'tycolab': 'tycointl',
    'federalnationalmortgageassn': 'fanniemae', 'federalhomeloanmortgage': 'freddiemac',
    'americanhomeproducts': 'wyeth', 'adobesystems': 'adobe', 'oraclesystems': 'oracle',
    'morganstanleydeanwitterdiscover': 'morganstanley', 'morganstanleydeanwitter': 'morganstanley',
    'minnesotaminingmanufacturing': '3m', 'applecomputer': 'apple', 'biogenidec': 'biogen',
    'cvs': 'cvshealth', 'cvscaremark': 'cvshealth', 'ciscosystemsdelaware': 'ciscosystems',
    'unitedtechnologies': 'rtx', 'raytheontechnologies': 'rtx', 'unitedhealthcare': 'unitedhealth',
    'alliedsignal': 'honeywellintl', 'avagotechnologies': 'broadcom', 'priceline': 'booking',
    'praxair': 'linde', 'fpl': 'nexteraenergy', 'thermoelectron': 'thermofisherscientific',
    'schlumberger': 'slb', 'firstunion': 'wachovia', 'morgan': 'jpmorgan', 'costco': 'costcowholesale',
    'pharmaciaupjohn': 'pharmacia', 'sprint': 'sprintnextel', 'eidupontnemours': 'dupontnemours',
    'dowchemical': 'dow', 'dowdupont': 'dow', 'dowwi': 'dow', 'publicstoragereit': 'publicstorage',
    'lyondellbasellindnvclassa': 'lyondellbasellind', 'comcastspecial': 'comcast', 'norwest': 'wellsfargo',
    'phillipspetroleum': 'conocophillips', 'motorola': 'motorolasolutions',
}
# How a company is written on the page, where the fund's latest name for it isn't what people call it.
SHOW = {
    'alphabet': 'Alphabet', 'metaplatforms': 'Meta', 'intlbusinessmachines': 'IBM', 'att': 'AT&T',
    'attold': 'AT&T Corp.', 'bankamericaold': 'BankAmerica', 'timewarnerold': 'Time Warner (to 2000)',
    'timewarner': 'Time Warner', 'travelersgroup': 'Travelers Group', 'broadcomold': 'Broadcom Corp.',
    'wachoviaold': 'Wachovia (to 2001)', 'verizoncommunications': 'Verizon', 'jpmorganchase': 'JPMorgan Chase',
    'jpmorgan': 'J.P. Morgan & Co.', 'amazon': 'Amazon', 'nvidia': 'Nvidia', 'proctergamble': 'Procter & Gamble',
    'cocacola': 'Coca-Cola', 'berkshirehathaway': 'Berkshire Hathaway', 'unitedhealth': 'UnitedHealth',
    'ciscosystems': 'Cisco', 'waltdisney': 'Disney', 'homedepot': 'Home Depot', 'elililly': 'Eli Lilly',
    'costcowholesale': 'Costco', 'hp': 'HP', 'slb': 'Schlumberger', 'rtx': 'RTX', '3m': '3M',
    'lucenttechnologies': 'Lucent', 'nortelnetworks': 'Nortel', 'worldcom': 'WorldCom',
    'advancedmicrodevices': 'AMD', 'microntechnology': 'Micron', 'palantirtechnologies': 'Palantir',
    'dupontnemours': 'DuPont', 'unitedparcelservice': 'UPS', 'qualcomm': 'Qualcomm', 'tycointl': 'Tyco',
    'sunmicrosystems': 'Sun Microsystems', 'emc': 'EMC', 'royaldutchpetroleum': 'Royal Dutch Petroleum',
    'generalelectric': 'General Electric', 'americanintl': 'AIG', 'ubertechnologies': 'Uber',
    'mcdonalds': "McDonald's", 'bankofamerica': 'Bank of America', 'gevernova': 'GE Vernova', 'dell': 'Dell', 'merck': 'Merck', 'wellsfargo': 'Wells Fargo',
}

def tidy(n):
    n = re.sub(r'/(The|Delaware|DE|MD|New|Old)\b', '', n, flags=re.I)
    n = re.sub(r'^([A-Z][\w\-]*) \(((?!Class|The)[^)]+)\)', r'\2 \1', n)      # "Lilly (Eli) & Co" -> "Eli Lilly & Co"
    n = re.sub(r',?\s*\(?\b(Class|Series|Cl\.?) [A-Z]\b\)?|\(The\)|\bW/I\b|,? Com$|\(N\.Y\. Shares\)', '', n)
    for _ in range(3):
        n = re.sub(r'\s+(&|and)$', '', n.strip(' ,.'))
        n = re.sub(r'[,\s]+(Inc|Corp|Corporation|Co|Cos|PLC|Ltd|NV|N\.V|SA|Company|Holdings|Group|The|Limited)\.?$', '', n.strip(' ,.'), flags=re.I)
    n = re.sub(r'\s+(&|and)$', '', n.strip(' ,.'))
    return re.sub(r'\s+', ' ', n).strip(' ,.')

def build():
    files = fetch(); dates = list(files); snaps = []
    for d, p in files.items():
        rows = ptext(p) if p.endswith('.txt') else phtml(p) if p.endswith('.htm') else pxml(p)
        tot = sum(r[1] for r in rows); snap = {}
        assert 495 <= len(rows) <= 510, (d, len(rows))
        for r in rows:
            k = key(r[0])
            if k in SPLIT and d <= SPLIT[k][0]: k = SPLIT[k][1]
            k = ALIAS.get(k, k)
            e = snap.setdefault(k, [0.0, r[0]]); e[0] += r[1] / tot
            if 'class a' not in r[0].lower() and len(r[0]) < len(e[1]): e[1] = r[0]
        snaps.append(snap)
    # Renames nobody listed: a name that stops in one report while a longer or shorter form of it starts in the next.
    while True:
        first, last = {}, {}
        for i, s in enumerate(snaps):
            for k in s: first.setdefault(k, i); last[k] = i
        link = {}
        for a in last:
            if last[a] == len(snaps) - 1: continue
            for b in snaps[last[a] + 1]:
                if first[b] == last[a] + 1 and a != b and min(len(a), len(b)) >= 5 and (a.startswith(b) or b.startswith(a)):
                    link[a] = b
        if not link: break
        for s in snaps:
            for a, b in link.items():
                if a in s:
                    v = s.pop(a); e = s.setdefault(b, [0.0, v[1]]); e[0] += v[0]
    names = {}
    for s in snaps:
        for k, (w, n) in s.items(): names.setdefault(k, []).append(n)
    out = []
    for k, ns in names.items():
        show = SHOW.get(k) or tidy(ns[-1])
        aka = []
        for n in ns:
            t = tidy(n)
            if t.lower().replace('.', '').replace(',', '').replace(' ', '').replace('-', '') != show.lower().replace('.', '').replace(',', '').replace(' ', '').replace('-', '') and t not in aka: aka.append(t)
        idx = [i for i, s in enumerate(snaps) if k in s]
        w = [round(snaps[i][k][0] * 100000) if k in snaps[i] else 0 for i in range(idx[0], idx[-1] + 1)]   # thousandths of a percent
        c = {'n': show, 's': idx[0], 'w': w}
        if aka: c['aka'] = aka[:4]
        out.append(c)
    out.sort(key=lambda c: (-max(c['w']), c['n']))
    js = 'window.Weights = ' + json.dumps({'source': 'SPDR S&P 500 ETF Trust filings, SEC EDGAR', 'dates': dates, 'companies': out}, separators=(',', ':'), ensure_ascii=False) + ';\n'
    open(os.path.join(HERE, 'weights.js'), 'w', encoding='utf-8').write('// Written by _weights.py. Each company: n name, s index of its first report in dates, w its share of the index from then on in thousandths of a percent (0 = not in the index), aka earlier names.\n' + js)
    print(len(dates), 'reports,', len(out), 'companies,', len(js) // 1024, 'KB')
    return dates, out

if __name__ == '__main__':
    dates, out = build()
    for i in (0, 5, 13, 30, len(dates) - 1):
        top = sorted(((c['w'][i - c['s']], c['n']) for c in out if 0 <= i - c['s'] < len(c['w'])), reverse=True)[:20]
        print(dates[i], '| top 20 hold %.1f%% |' % (sum(t[0] for t in top) / 1000), ', '.join(t[1] for t in top))
