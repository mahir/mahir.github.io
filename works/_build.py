#!/usr/bin/env python3
"""Refresh what search engines and AI assistants read, from the schedule in works/works.js.

    python3 works/_build.py

Writes the parts of the pages between <!-- gen:NAME --> and <!-- /gen:NAME --> markers
(structured data, the static list of works, the short bio), plus /sitemap.xml and /llms.txt.
Visitors with JavaScript see the live list from works.js either way; this keeps the plain HTML,
which most crawlers read, in step with it. Works dated after today are left out until the next run.

The facts about Mahir below are the single source for all of that; edit them here.
"""

import ast
import datetime
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://mahiryavuz.com'

ROLE = 'Product and engineering leader, educator and advisor, working with data since 1998.'
BIO = (
    'Head of Engineering at AirOps. Before that, Mahir was Head of Engineering for Search, Recommendations '
    'and Ads at Etsy, co-founder and CTO of Topos, Director of Data Science at R/GA and Senior Researcher at '
    'Ars Electronica Futurelab in Linz, and his teams have taken on data problems for companies including '
    'Nike, PwC, Google and Microsoft. He has taught since 2003, at Columbia University, the University of '
    'Pennsylvania, Pratt and the University of Art and Design Linz, with guest lectures at MIT, NYU and SVA. '
    'His work has been shown at the Ars Electronica Festival, SIGGRAPH, ISEA and the Istanbul Biennial, and he '
    'has spoken at TEDx Istanbul and Vienna, Microsoft Build, Visualized and the Fast Company Innovation Festival.'
)
# The short version opens /works/: what Mahir does now and did before, then teaching and exhibitions.
SHORT_BIO = (
    'Head of Engineering at AirOps. Before that, Mahir led engineering for Search, Recommendations and Ads at Etsy, '
    'co-founded Topos as its CTO, directed data science at R/GA and was a senior researcher at Ars Electronica '
    'Futurelab in Linz.',
    'He has taught since 2003, at Columbia University, the University of Pennsylvania, Pratt and the University of Art '
    'and Design Linz, and his work has been shown at the Ars Electronica Festival, SIGGRAPH and the Istanbul Biennial.',
)
LINKS = [
    ('Substack', 'https://mahir.substack.com/'),
    ('Bluesky', 'https://bsky.app/profile/mahiryavuz.bsky.social'),
    ('X', 'https://x.com/mahir_nyc'),
    ('LinkedIn', 'https://www.linkedin.com/in/mahiryavuz/'),
]
PERSON = {
    '@type': 'Person',
    '@id': f'{SITE}/#person',
    'name': 'Mahir Yavuz',
    'url': f'{SITE}/',
    'image': f'{SITE}/profile.jpg',
    'description': ROLE,
    'jobTitle': 'Head of Engineering',
    'worksFor': {'@type': 'Organization', 'name': 'AirOps'},
    'knowsAbout': [
        'AI products', 'Search', 'Recommendation systems', 'Advertising platforms', 'Data science',
        'Machine learning', 'Product management', 'Data visualization', 'Media art',
    ],
    'sameAs': [url for _, url in LINKS],
}
WEBSITE = {
    '@type': 'WebSite',
    '@id': f'{SITE}/#website',
    'url': f'{SITE}/',
    'name': 'Mahir Yavuz',
    'inLanguage': 'en',
    'author': {'@id': PERSON['@id']},
}


def read_works():
    """The list in works.js: one object literal per work, with string and number values."""
    src = (ROOT / 'works/works.js').read_text()
    block = re.search(r'const list = \[(.*?)\n  \];', src, re.S)
    if not block:
        raise SystemExit('works/_build.py: could not find `const list = [ ... ];` in works/works.js')
    works = []
    for body in re.findall(r'\{(.*?)\}', block.group(1), re.S):
        pairs = re.findall(r'(\w+)\s*:\s*(\'(?:[^\'\\]|\\.)*\'|"(?:[^"\\]|\\.)*"|-?\d+)', body)
        work = {key: ast.literal_eval(value) for key, value in pairs}
        for key in ('n', 'title', 'date'):
            if key not in work:
                raise SystemExit(f'works/_build.py: a work in works.js has no `{key}`: {body.strip()}')
        works.append(work)
    return works


def number(w):
    return f"{w['n']:03d}"


def url(w):
    return f"{SITE}/works/{number(w)}/"


def nice_date(s):
    d = datetime.date.fromisoformat(s)
    return f"{d.day} {d.strftime('%b')} {d.year}"


def ld(*nodes):
    data = json.dumps({'@context': 'https://schema.org', '@graph': list(nodes)}, ensure_ascii=False, indent=2)
    return f'<script type="application/ld+json">\n{data}\n</script>'


def artwork(w):
    node = {
        '@type': 'VisualArtwork',
        '@id': f'{url(w)}#work',
        'name': w['title'],
        'url': url(w),
        'datePublished': w['date'],
        'creator': {'@id': PERSON['@id']},
        'isPartOf': {'@id': f'{SITE}/works/#page'},
        'image': f'{url(w)}og.jpg',
    }
    if w.get('about'):
        node['description'] = w['about']
    if w.get('medium'):
        node['artMedium'] = w['medium']
    return node


def fill(path, name, content):
    """Replace what is between <!-- gen:name --> and <!-- /gen:name -->, indented like the opening marker."""
    p = ROOT / path
    text = p.read_text()
    pattern = re.compile(rf'([ \t]*)<!-- gen:{name} -->.*?<!-- /gen:{name} -->', re.S)
    m = pattern.search(text)
    if not m:
        raise SystemExit(f'works/_build.py: {path} has no <!-- gen:{name} --> marker')
    pad = m.group(1)
    body = '\n'.join(pad + line if line else line for line in content.split('\n'))
    new = f'{pad}<!-- gen:{name} -->\n{body}\n{pad}<!-- /gen:{name} -->'
    p.write_text(text[:m.start()] + new + text[m.end():])


def main():
    today = datetime.date.today().isoformat()
    works = read_works()
    live = sorted((w for w in works if w['date'] <= today), key=lambda w: (w['date'], w['n']))
    newest_first = list(reversed(live))
    updated = live[-1]['date'] if live else today
    e = html.escape

    # the static lists: the works index (replaced by the live list in the browser) and the homepage's plain version
    fill('works/index.html', 'works', '\n'.join(
        f'<li><a href="/works/{number(w)}/"><span class="n mono">No. {number(w)}</span>'
        f'<span class="t">{e(w["title"])}</span>'
        f'<time class="d mono" datetime="{w["date"]}">{nice_date(w["date"])}</time></a></li>'
        for w in newest_first))
    fill('index.html', 'works', '\n'.join(
        f'<li><a href="/works/{number(w)}/">No. {number(w)} · {e(w["title"])}</a> <time datetime="{w["date"]}">{nice_date(w["date"])}</time></li>'
        for w in newest_first))
    fill('index.html', 'bio', f'<p class="bio-text">{e(BIO)}</p>')
    fill('works/index.html', 'bio', '\n'.join(f'<p>{e(para)}</p>' for para in SHORT_BIO))

    # structured data
    fill('index.html', 'ld', ld(
        WEBSITE,
        {'@type': 'ProfilePage', '@id': f'{SITE}/#page', 'url': f'{SITE}/', 'name': 'Mahir Yavuz',
         'isPartOf': {'@id': WEBSITE['@id']}, 'mainEntity': {'@id': PERSON['@id']}, 'dateModified': updated},
        PERSON))
    fill('works/index.html', 'ld', ld(
        WEBSITE,
        {'@type': 'CollectionPage', '@id': f'{SITE}/works/#page', 'url': f'{SITE}/works/', 'name': 'Works',
         'description': 'Mahir Yavuz: a short bio, and his works, newest first.',
         'isPartOf': {'@id': WEBSITE['@id']}, 'author': {'@id': PERSON['@id']}, 'dateModified': updated,
         'mainEntity': {'@type': 'ItemList', 'itemListElement': [
             {'@type': 'ListItem', 'position': i + 1, 'url': url(w), 'name': w['title']}
             for i, w in enumerate(newest_first)]}},
        PERSON))
    for w in works:
        page = f'works/{number(w)}/index.html'
        if (ROOT / page).exists():
            fill(page, 'ld', ld(WEBSITE, PERSON, artwork(w)))
        else:
            print(f'skipped {page}: no page yet')

    # sitemap
    entries = [(f'{SITE}/', updated), (f'{SITE}/works/', updated)] + [(url(w), w['date']) for w in live]
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'  <url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>\n' for loc, mod in entries)
        + '</urlset>\n')

    # llms.txt (llmstxt.org): the same facts as plain text for AI assistants
    lines = [
        '# Mahir Yavuz', '',
        f'> {ROLE} Head of Engineering at AirOps. This site shows a new artwork some days; '
        'the homepage is always the latest one, and every work keeps its own page.', '',
        BIO, '',
        '## Works', '',
        *[f'- [No. {number(w)} · {w["title"]}]({url(w)}) ({nice_date(w["date"])}): {w.get("about", "")}'.rstrip(': ')
          for w in newest_first],
        f'- [All works]({SITE}/works/)', '',
        '## Elsewhere', '',
        *[f'- [{name}]({link})' for name, link in LINKS],
        '',
    ]
    (ROOT / 'llms.txt').write_text('\n'.join(lines))

    print(f'{len(live)} of {len(works)} works are up as of {today}; refreshed the pages, sitemap.xml and llms.txt')


if __name__ == '__main__':
    main()
