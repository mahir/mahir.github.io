#!/usr/bin/env python3
"""Tell search engines which pages changed today, through IndexNow (indexnow.org).

    python3 works/_indexnow.py            the pages the sitemap dates today, New York's day
    python3 works/_indexnow.py --all      every page in the sitemap
    python3 works/_indexnow.py URL ...    these pages

IndexNow is one address that Bing, Yandex, Naver, Seznam, Yep and a few others all read, so a new page is picked up
in minutes instead of at their next visit. Bing's index is also what Copilot answers from. Google does not take
part; it reads the sitemap. An answer of 200 or 202 means the list was received, not that a page was indexed.

The site proves it sent the list with a key: a file at the root named <key>.txt that holds the same key. The key is
public by design. Run this only after the pages are live: it waits until the published sitemap matches this one, and
gives up quietly if that takes too long. The daily Action runs it after a work goes up (.github/workflows/daily.yml);
after publishing anything else by hand, run it yourself.
"""

import datetime
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = 'mahiryavuz.com'
SITE = f'https://{HOST}'
ENDPOINT = 'https://api.indexnow.org/indexnow'
AGENT = {'User-Agent': f'{SITE} build'}
WAIT = 300  # seconds to wait for GitHub Pages to publish before giving up


def key():
    """The key is the name of the one file at the root that is 32 hex digits and holds its own name."""
    for p in ROOT.glob('*.txt'):
        if re.fullmatch(r'[0-9a-f]{32}', p.stem) and p.read_text().strip() == p.stem:
            return p.stem
    raise SystemExit('works/_indexnow.py: no key file at the root (32 hex digits, .txt, holding its own name)')


def sitemap():
    """(address, day) for every page in sitemap.xml."""
    return re.findall(r'<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>', (ROOT / 'sitemap.xml').read_text())


def fetch(address):
    with urllib.request.urlopen(urllib.request.Request(address, headers=AGENT), timeout=20) as response:
        return response.read().decode()


def published():
    """Wait until the live sitemap is the one in this folder and the key file is being served."""
    local, k, deadline = (ROOT / 'sitemap.xml').read_text(), key(), time.time() + WAIT
    while True:
        try:
            if fetch(f'{SITE}/sitemap.xml?{int(time.time())}') == local and fetch(f'{SITE}/{k}.txt').strip() == k:
                return True
        except (OSError, urllib.error.URLError):
            pass
        if time.time() > deadline:
            return False
        time.sleep(15)


def main():
    args = sys.argv[1:]
    if args == ['--all']:
        pages = [address for address, _ in sitemap()]
    elif args:
        pages = args
    else:
        today = datetime.datetime.now(ZoneInfo('America/New_York')).date().isoformat()
        pages = [address for address, day in sitemap() if day == today]
    if not pages:
        print('IndexNow: no page is dated today, nothing to send')
        return
    if not published():
        print(f'IndexNow: the site had not caught up after {WAIT} seconds, nothing sent')
        return
    k = key()
    body = json.dumps({'host': HOST, 'key': k, 'keyLocation': f'{SITE}/{k}.txt', 'urlList': pages}).encode()
    request = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                     headers={**AGENT, 'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(f'IndexNow: sent {len(pages)} page(s), answer {response.status}')
    except urllib.error.HTTPError as err:
        print(f'IndexNow: refused with {err.code} {err.reason}')
    except OSError as err:
        print(f'IndexNow: could not reach {ENDPOINT} ({err})')


if __name__ == '__main__':
    main()
