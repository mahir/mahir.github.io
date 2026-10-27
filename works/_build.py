#!/usr/bin/env python3
"""Put today's work on the homepage and refresh what search engines and AI assistants read, from works/works.js.

    python3 works/_build.py

Writes /index.html: today's work itself, under the site's own title, description and structured data, so
search engines index the homepage as Mahir's instead of following a redirect to whichever work is up.
Also writes the parts of the pages between <!-- gen:NAME --> and <!-- /gen:NAME --> markers (structured
data, the static list of works, the short bio), plus /sitemap.xml and /llms.txt.

"Today" is New York's date. A GitHub Action (.github/workflows/daily.yml) runs this just after midnight
there, so a work dated ahead goes up on its day. Running it twice changes nothing.

The facts about Mahir below are the single source for all of that; edit them here.
"""

import ast
import datetime
import html
import json
import pathlib
import re
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://mahiryavuz.com'
ZONE = ZoneInfo('America/New_York')

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
# every profile that is Mahir's, for search engines to tie together (the pages link the ones above)
PROFILES = LINKS + [('GitHub', 'https://github.com/mahir')]

# what a search for Mahir should show for the homepage, whichever work is up
HOME_TITLE = 'Mahir Yavuz · Product and engineering leader, educator and advisor'
HOME_DESCRIPTION = (
    'Mahir Yavuz: product and engineering leader, educator and advisor, working with data since 1998. '
    'Head of Engineering at AirOps; before that Etsy, Topos and R/GA.'
)
PERSON = {
    '@type': 'Person',
    '@id': f'{SITE}/#person',
    'name': 'Mahir Yavuz',
    'url': f'{SITE}/',
    'image': f'{SITE}/profile.jpg',
    'description': ROLE,
    'jobTitle': 'Head of Engineering',
    'worksFor': {'@type': 'Organization', 'name': 'AirOps', 'url': 'https://www.airops.com/'},
    'knowsAbout': [
        'AI products', 'Search', 'Recommendation systems', 'Advertising platforms', 'Data science',
        'Machine learning', 'Product management', 'Data visualization', 'Media art',
    ],
    'sameAs': [link for _, link in PROFILES],
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


def breadcrumbs(*trail):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': link} for i, (name, link) in enumerate(trail)]}


def profile_page(updated):
    return {'@type': 'ProfilePage', '@id': f'{SITE}/#page', 'url': f'{SITE}/', 'name': 'Mahir Yavuz',
            'isPartOf': {'@id': WEBSITE['@id']}, 'mainEntity': {'@id': PERSON['@id']}, 'dateModified': updated}


def homepage(current, newest_first, updated):
    """/ is today's work as it stands, with the site's own head in place of the work's <!-- page:head --> block,
    and an account of Mahir for screen readers and crawlers that read the HTML without running it."""
    page = f'works/{number(current)}/index.html'
    src = (ROOT / page).read_text()
    block = re.search(r'<!-- page:head -->.*?<!-- /page:head -->\n?', src, re.S)
    if not block or not src.startswith('<!doctype html>\n') or src.count('</body>') != 1:
        raise SystemExit(f'works/_build.py: {page} needs a <!doctype html> first line, one </body> and a '
                         '<!-- page:head --> ... <!-- /page:head --> block around its title, meta and structured data')
    theme = re.search(r'<meta name="theme-color" content="([^"]*)">', block.group(0))
    e = html.escape
    head = '\n'.join([
        f'<title>{e(HOME_TITLE)}</title>',
        f'<meta name="description" content="{e(HOME_DESCRIPTION)}">',
        '<meta name="author" content="Mahir Yavuz">',
        f'<link rel="canonical" href="{SITE}/">',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '<link rel="apple-touch-icon" href="/profile.jpg">',
        f'<meta name="theme-color" content="{theme.group(1) if theme else "#06070b"}">',
        '<meta property="og:type" content="profile">',
        '<meta property="profile:first_name" content="Mahir">',
        '<meta property="profile:last_name" content="Yavuz">',
        '<meta property="og:site_name" content="Mahir Yavuz">',
        '<meta property="og:title" content="Mahir Yavuz">',
        f'<meta property="og:description" content="{e(ROLE)}">',
        f'<meta property="og:url" content="{SITE}/">',
        f'<meta property="og:image" content="{SITE}/og.jpg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="Mahir Yavuz, with his portrait set in type on a round ink plate">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:creator" content="@mahir_nyc">',
        ld(WEBSITE, profile_page(updated), PERSON, artwork(current)),
    ]) + '\n'
    hidden = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap'
    about = '\n'.join([
        f'<section aria-labelledby="home-about" style="{hidden}">',
        '  <h2 id="home-about">About Mahir Yavuz</h2>',
        f'  <p>{e(ROLE)}</p>',
        f'  <p>{e(BIO)}</p>',
        f'  <p>On the homepage today: <a href="/works/{number(current)}/">No. {number(current)} · {e(current["title"])}</a>. '
        '<a href="/works/">All works and a short bio</a>.</p>',
        '  <ul>',
        *[f'    <li><a href="/works/{number(w)}/">No. {number(w)} · {e(w["title"])}</a></li>' for w in newest_first],
        '  </ul>',
        '  <ul>',
        *[f'    <li><a href="{link}" rel="me">{name}</a></li>' for name, link in LINKS],
        '  </ul>',
        '</section>',
        '<script src="/works/works.js"></script>',
        '<script>',
        '  // /?on=YYYY-MM-DD previews another day: hand over to the work that will be up then',
        '  (() => {',
        "    if (!window.Works || !new URLSearchParams(location.search).has('on')) return;",
        '    const w = Works.current(Works.today());',
        f"    if (w && Works.number(w) !== '{number(current)}') location.replace(Works.url(w) + location.search + location.hash);",
        '  })();',
        '</script>',
        '',
    ])
    out = src[:block.start()] + head + src[block.end():]
    out = out.replace('</body>', about + '</body>')
    note = (f'<!-- The homepage: No. {number(current)} as it stands, under the site\'s own title and data. '
            f'Written by works/_build.py from {page}; edit that page and run the build, not this file. -->\n')
    (ROOT / 'index.html').write_text(out.replace('<!doctype html>\n', '<!doctype html>\n' + note, 1))


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
    today = datetime.datetime.now(ZONE).date().isoformat()
    works = read_works()
    live = sorted((w for w in works if w['date'] <= today), key=lambda w: (w['date'], w['n']))
    newest_first = list(reversed(live))
    updated = live[-1]['date'] if live else today
    e = html.escape

    # the static list on the works index (replaced by the live list in the browser), and the short bio
    fill('works/index.html', 'works', '\n'.join(
        f'<li><a href="/works/{number(w)}/"><span class="n mono">No. {number(w)}</span>'
        f'<span class="t">{e(w["title"])}</span>'
        f'<time class="d mono" datetime="{w["date"]}">{nice_date(w["date"])}</time></a></li>'
        for w in newest_first))
    fill('works/index.html', 'bio', '\n'.join(f'<p>{e(para)}</p>' for para in SHORT_BIO))

    # structured data
    fill('works/index.html', 'ld', ld(
        WEBSITE,
        {'@type': 'CollectionPage', '@id': f'{SITE}/works/#page', 'url': f'{SITE}/works/', 'name': 'Bio and works',
         'description': 'Mahir Yavuz: a short bio, and his works, newest first.',
         'isPartOf': {'@id': WEBSITE['@id']}, 'author': {'@id': PERSON['@id']}, 'dateModified': updated,
         'mainEntity': {'@type': 'ItemList', 'itemListElement': [
             {'@type': 'ListItem', 'position': i + 1, 'url': url(w), 'name': w['title']}
             for i, w in enumerate(newest_first)]}},
        breadcrumbs(('Mahir Yavuz', f'{SITE}/'), ('Bio and works', f'{SITE}/works/')),
        PERSON))
    for w in works:
        page = f'works/{number(w)}/index.html'
        if (ROOT / page).exists():
            fill(page, 'ld', ld(WEBSITE, PERSON, artwork(w), breadcrumbs(
                ('Mahir Yavuz', f'{SITE}/'), ('Bio and works', f'{SITE}/works/'),
                (f'No. {number(w)} · {w["title"]}', url(w)))))
        else:
            print(f'skipped {page}: no page yet')

    # the homepage: today's work, once its page carries this run's structured data
    if live:
        homepage(live[-1], newest_first, updated)

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
        *[f'- [{name}]({link})' for name, link in PROFILES],
        '',
    ]
    (ROOT / 'llms.txt').write_text('\n'.join(lines))

    print(f'{len(live)} of {len(works)} works are up as of {today} in New York; the homepage is '
          f'No. {number(live[-1]) if live else "none"}; refreshed the pages, sitemap.xml and llms.txt')


if __name__ == '__main__':
    main()
