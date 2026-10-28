#!/usr/bin/env python3
"""Feature today's work on the homepage and refresh what search engines and AI assistants read, from works/works.js.

    python3 works/_build.py

Writes the parts of the pages between <!-- gen:NAME --> and <!-- /gen:NAME --> markers: on the homepage, the
short bio, today's work and the list of works, which visitors with JavaScript see redrawn for their own day; in
every page, the structured data. Also writes /sitemap.xml and /llms.txt.

"Today" is New York's date. A GitHub Action (.github/workflows/daily.yml) runs this just after midnight
there, so a work dated ahead is featured on its day. Running it twice changes nothing.

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

ROLE = 'Engineering and product leader. Teacher and advisor. Turning data into products since 1998.'
BIO = (
    'Head of Engineering at AirOps. Before that, Mahir was Head of Engineering for Search, Recommendations '
    'and Ads at Etsy, co-founder and CTO of Topos, Director of Data Science at R/GA and Senior Researcher at '
    'Ars Electronica Futurelab in Linz, and his teams have taken on data problems for companies including '
    'Nike, SAP, Siemens, PwC, Google and Microsoft. He has taught since 2003, at schools including Columbia '
    'University, the University of Pennsylvania, Pratt, the University of Art and Design Linz and Istanbul Bilgi '
    'University, with guest lectures at MIT, NYU and SVA. He currently lectures on Business Applications of LLMs and '
    'Product Management with AI. His work has been shown '
    'at the Ars Electronica Festival, SIGGRAPH, ISEA, the Istanbul Biennial and elsewhere, and he has spoken at '
    'events such as TEDx Istanbul and Vienna, Microsoft Build, Google Cloud Next, Visualized and the Fast Company '
    'Innovation Festival.'
)
AIROPS = 'https://www.airops.com/'
ETSY = 'https://www.etsy.com/'
TOPOS = 'https://topos.com/'
RGA = 'https://rga.com/'
FUTURELAB = 'https://ars.electronica.art/futurelab/en/'
TEDX_VIENNA = 'https://www.youtube.com/watch?v=gY36Sm2uI6k'
MICROSOFT_BUILD = 'https://www.youtube.com/watch?v=dvC4dK9c7nQ'
GOOGLE_CLOUD_NEXT = 'https://www.youtube.com/watch?v=yUK4XUggdQw'
GOOGLE_CLOUD_STORY = 'https://cloud.google.com/customers/etsy-ai'
STACK_OVERFLOW_PODCAST = 'https://stackoverflow.blog/2025/07/29/that-custom-gift-for-your-mom-takes-more-work-than-you-think/'
# The short version opens the homepage: what Mahir does now and did before, and the press about it, then teaching,
# lectures and talks. Its lists are examples, not every one. [words](url) becomes a link.
SHORT_BIO = (
    f'Head of Engineering at [AirOps]({AIROPS}). Before that, Mahir led engineering for Search, Recommendations and '
    f'Ads at [Etsy]({ETSY}), co-founded [Topos]({TOPOS}) as its CTO, directed data science at [R/GA]({RGA}) and was a '
    f'senior researcher at [Ars Electronica Futurelab]({FUTURELAB}) in Linz. His teams have taken on data problems for '
    'companies including Nike, SAP, Siemens, PwC, Google and Microsoft, and his work at Etsy has been featured in '
    f'[a Google Cloud customer story]({GOOGLE_CLOUD_STORY}) and on [the Stack Overflow podcast]({STACK_OVERFLOW_PODCAST}).',
    'He has taught since 2003, at schools including Columbia University, the University of Pennsylvania, Pratt, the '
    'University of Art and Design Linz and Istanbul Bilgi University, and he currently lectures on Business '
    'Applications of LLMs and Product Management with AI. He has spoken at events such as '
    f'[TEDx Vienna]({TEDX_VIENNA}), [Microsoft Build]({MICROSOFT_BUILD}), [Google Cloud Next]({GOOGLE_CLOUD_NEXT}) and '
    'the Fast Company Innovation Festival.',
)
LINKS = [
    ('Substack', 'https://mahir.substack.com/'),
    ('Bluesky', 'https://bsky.app/profile/mahiryavuz.bsky.social'),
    ('X', 'https://x.com/mahir_nyc'),
    ('LinkedIn', 'https://www.linkedin.com/in/mahiryavuz/'),
]
# every profile that is Mahir's, for search engines to tie together (the homepage links the ones above)
PROFILES = LINKS + [('GitHub', 'https://github.com/mahir')]

# Talks and press: linked from the short bio, and pieces about Mahir in the structured data (subjectOf), never among
# his profiles. `name` is the piece's own title.
TALKS = [
    {'url': TEDX_VIENNA, 'by': 'TEDx Talks', 'date': '2015-07-09',
     'name': 'Who will govern "smart" cities? | Mahir Yavuz | TEDxViennaSalon'},
    {'url': MICROSOFT_BUILD, 'by': 'Microsoft Developer', 'date': '2024-05-24',
     'name': 'Five lessons Etsy learned building on Microsoft AI | BRK258'},
    {'url': GOOGLE_CLOUD_NEXT, 'by': 'Google Cloud', 'date': '2025-07-11',
     'name': 'New Way Now: Etsy keeps human connection at the heart of commerce with Google Cloud AI'},
]
PRESS = [
    {'url': STACK_OVERFLOW_PODCAST, 'type': 'PodcastEpisode', 'by': 'Stack Overflow', 'date': '2025-07-29',
     'name': 'That custom gift for your mom takes more work than you think'},
    {'url': GOOGLE_CLOUD_STORY, 'by': 'Google Cloud',
     'name': 'Etsy: Connecting nearly 90 million buyers with special items using gen AI and "algotorial curation"'},
]


def piece(p):
    node = {'@type': p.get('type', 'CreativeWork'), 'name': p['name'], 'url': p['url'],
            'publisher': {'@type': 'Organization', 'name': p['by']}}
    if p.get('date'):
        node['datePublished'] = p['date']
    return node


PERSON = {
    '@type': 'Person',
    '@id': f'{SITE}/#person',
    'name': 'Mahir Yavuz',
    'url': f'{SITE}/',
    # the photo on the homepage; /profile.jpg is the older, smaller one that No. 001 and No. 002 are drawn from
    'image': f'{SITE}/portrait.jpg',
    'description': ROLE,
    'jobTitle': 'Head of Engineering',
    'worksFor': {'@type': 'Organization', 'name': 'AirOps', 'url': AIROPS},
    'knowsAbout': [
        'AI products', 'Search', 'Recommendation systems', 'Advertising platforms', 'Data science',
        'Machine learning', 'Product management', 'Data visualization', 'Media art',
    ],
    'sameAs': [link for _, link in PROFILES],
    'subjectOf': [piece(p) for p in TALKS + PRESS if p.get('url')],
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
        'isPartOf': {'@id': WEBSITE['@id']},
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


def feature(w):
    """Today's work on the homepage: its share image, number, date, title and what it is. The page's script
    draws the same thing when the visitor's day has a different work."""
    e = html.escape
    lines = [
        f'<a class="feature" href="/works/{number(w)}/">',
        f'  <img src="/works/{number(w)}/og.jpg" width="1200" height="630" alt="">',
        '  <span class="body">',
        f'    <span class="n mono">No. {number(w)} · {nice_date(w["date"])}</span>',
        f'    <span class="t">{e(w["title"])}</span>',
    ]
    if w.get('about'):
        lines.append(f'    <span class="about">{e(w["about"])}</span>')
    lines += ['    <span class="go mono">Open the experiment →</span>', '  </span>', '</a>']
    return '\n'.join(lines)


def linked(text):
    """Text for HTML, with [words](url) as links."""
    return re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', html.escape(text))


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

    # the homepage: the short bio, today's work and a plain list of works, which the page redraws for the visitor's day
    fill('index.html', 'bio', '\n'.join(f'<p>{linked(para)}</p>' for para in SHORT_BIO))
    fill('index.html', 'today', feature(live[-1]) if live else '')
    fill('index.html', 'works', '\n'.join(
        f'<li><a href="/works/{number(w)}/"><span class="n mono">No. {number(w)}</span>'
        f'<span class="t">{e(w["title"])}</span>'
        f'<time class="d mono" datetime="{w["date"]}">{nice_date(w["date"])}</time></a></li>'
        for w in newest_first))

    # structured data
    fill('index.html', 'ld', ld(
        WEBSITE,
        {'@type': 'ProfilePage', '@id': f'{SITE}/#page', 'url': f'{SITE}/', 'name': 'Mahir Yavuz',
         'isPartOf': {'@id': WEBSITE['@id']}, 'mainEntity': {'@id': PERSON['@id']}, 'dateModified': updated},
        PERSON,
        {'@type': 'ItemList', '@id': f'{SITE}/#experiments', 'name': 'Experiments by Mahir Yavuz',
         'itemListOrder': 'https://schema.org/ItemListOrderDescending',
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': url(w), 'name': w['title']}
                             for i, w in enumerate(newest_first)]}))
    for w in works:
        page = f'works/{number(w)}/index.html'
        if (ROOT / page).exists():
            fill(page, 'ld', ld(WEBSITE, PERSON, artwork(w), breadcrumbs(
                ('Mahir Yavuz', f'{SITE}/'), (f'No. {number(w)} · {w["title"]}', url(w)))))
        else:
            print(f'skipped {page}: no page yet')

    # sitemap
    entries = [(f'{SITE}/', updated)] + [(url(w), w['date']) for w in live]
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'  <url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>\n' for loc, mod in entries)
        + '</urlset>\n')

    # llms.txt (llmstxt.org): the same facts as plain text for AI assistants
    lines = [
        '# Mahir Yavuz', '',
        f'> {ROLE} Head of Engineering at AirOps. The homepage has his bio and his experiments, a new one some '
        'days, with the latest on view; every experiment has its own page.', '',
        BIO, '',
        '## Experiments', '',
        *[f'- [No. {number(w)} · {w["title"]}]({url(w)}) ({nice_date(w["date"])}): {w.get("about", "")}'.rstrip(': ')
          for w in newest_first],
        '',
        '## Talks and press', '',
        *[f'- [{p["name"]}]({p["url"]}) ({p["by"]})' for p in TALKS + PRESS if p.get('url')],
        '',
        '## Elsewhere', '',
        *[f'- [{name}]({link})' for name, link in PROFILES],
        '',
    ]
    (ROOT / 'llms.txt').write_text('\n'.join(lines))

    print(f'{len(live)} of {len(works)} works are up as of {today} in New York; on view: '
          f'No. {number(live[-1]) if live else "none"}; refreshed the pages, sitemap.xml and llms.txt')


if __name__ == '__main__':
    main()
