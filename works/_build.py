#!/usr/bin/env python3
"""Feature today's work on the homepage and refresh what search engines and AI assistants read, from works/works.js.

    python3 works/_build.py

Writes the parts of the pages between <!-- gen:NAME --> and <!-- /gen:NAME --> markers: on the homepage, the
short bio, today's work and the list of works, which visitors with JavaScript see redrawn for their own day, and
the latest posts from Mahir's Substack; on /press/, the list of talks, podcasts, press, papers and projects; in every
page, the structured data. Also writes /sitemap.xml and /llms.txt.

"Today" is New York's date. A GitHub Action (.github/workflows/daily.yml) runs this just after midnight
there, so a work dated ahead is featured on its day. Substack refuses GitHub's servers, so there the posts already
listed stay; after a new post, run this on your own machine and commit. Running it twice changes nothing, as long as
no post has gone up in between.

The facts about Mahir below are the single source for all of that; edit them here.
"""

import ast
import datetime
import email.utils
import html
import json
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET
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
    'University, with guest lectures at MIT, NYU and SVA. At Columbia Engineering he lectures on Business '
    'Applications of LLMs and Product Management with AI. His work has been shown '
    'at the Ars Electronica Festival, SIGGRAPH, ISEA, the Istanbul Biennial and elsewhere, and he has spoken at '
    'events such as TEDx Istanbul and Vienna, Microsoft Build, Google Cloud Next, Visualized and the Fast Company '
    'Innovation Festival. He publishes a new data visualization every day at casualdata.com.'
)
AIROPS = 'https://www.airops.com/'
ETSY = 'https://www.etsy.com/'
TOPOS = 'https://topos.com/'
RGA = 'https://rga.com/'
FUTURELAB = 'https://ars.electronica.art/futurelab/en/'
CASUALDATA = 'https://casualdata.com/'
TEDX_VIENNA = 'https://www.youtube.com/watch?v=gY36Sm2uI6k'
MICROSOFT_BUILD = 'https://www.youtube.com/watch?v=dvC4dK9c7nQ'
GOOGLE_CLOUD_NEXT = 'https://www.youtube.com/watch?v=yUK4XUggdQw'
GOOGLE_CLOUD_STORY = 'https://cloud.google.com/customers/etsy-ai'
STACK_OVERFLOW_PODCAST = 'https://stackoverflow.blog/2025/07/29/that-custom-gift-for-your-mom-takes-more-work-than-you-think/'
COLUMBIA = 'https://www.columbia.edu/'
COLUMBIA_NEWS = 'https://www.engineering.columbia.edu/about/news/preparing-engineers-ai-driven-world'
PRESS_TITLE = 'Talks and press'  # the page at /press/, which the short bio points to
# The short version opens the homepage: what Mahir does now and did before, and the press about it, then teaching,
# lectures and talks. Its lists are examples, not every one. [words](url) becomes a link.
SHORT_BIO = (
    f'Head of Engineering at [AirOps]({AIROPS}). Before that, Mahir led engineering for Search, Recommendations and '
    f'Ads at [Etsy]({ETSY}), co-founded [Topos]({TOPOS}) as its CTO, directed data science at [R/GA]({RGA}) and was a '
    f'senior researcher at [Ars Electronica Futurelab]({FUTURELAB}) in Linz. His teams have taken on data problems for '
    'companies including Nike, SAP, Siemens, PwC, Google and Microsoft, and his work at Etsy has been featured in '
    f'[a Google Cloud customer story]({GOOGLE_CLOUD_STORY}) and on [the Stack Overflow podcast]({STACK_OVERFLOW_PODCAST}).',
    'He has taught since 2003, at schools including Columbia University, the University of Pennsylvania, Pratt, the '
    'University of Art and Design Linz and Istanbul Bilgi University. At Columbia Engineering he lectures on '
    f'Business Applications of LLMs and [Product Management with AI]({COLUMBIA_NEWS}). '
    'He has spoken at events such as '
    f'[TEDx Vienna]({TEDX_VIENNA}), [Microsoft Build]({MICROSOFT_BUILD}), [Google Cloud Next]({GOOGLE_CLOUD_NEXT}) and '
    f'the Fast Company Innovation Festival. More are listed under [{PRESS_TITLE}](/press/).',
    f'He publishes a new data visualization every day at [casualdata.com]({CASUALDATA}).',
)
SUBSTACK = 'https://mahir.substack.com/'
POSTS_SHOWN = 3  # the newest posts listed under Writing on the homepage
LINKS = [
    ('Substack', SUBSTACK),
    ('Bluesky', 'https://bsky.app/profile/mahiryavuz.bsky.social'),
    ('X', 'https://x.com/mahir_nyc'),
    ('LinkedIn', 'https://www.linkedin.com/in/mahiryavuz/'),
]
# every profile that is Mahir's, for search engines to tie together (the homepage links the ones above)
PROFILES = LINKS + [('GitHub', 'https://github.com/mahir')]

# Talks and press: everything on /press/, in the page's own groups. The short bio links a few; the rest are only there.
# Each entry is a piece that exists at `url`, checked there before it was added: `name` is the piece's own title, `by`
# who published it, `date` when (YYYY-MM-DD, or YYYY-MM or YYYY when the day isn't known; `when` words it for something
# that ran over several years, with `date` its last year), `note` one plain sentence for
# the page saying what it is. `lang` marks a piece that isn't in English. `about: False` is a piece about one of Mahir's
# companies or projects rather than about him; `own` ('author' or 'creator') is one he wrote or made. Those two kinds stay
# out of the structured data's "pieces about Mahir" (subjectOf), and none of this is ever among his profiles.
TALKS = [
    {'url': GOOGLE_CLOUD_NEXT, 'by': 'Google Cloud', 'date': '2025-07-11',
     'name': 'New Way Now: Etsy keeps human connection at the heart of commerce with Google Cloud AI',
     'note': 'Google Cloud’s film on how Etsy uses AI in search and discovery, with Mahir interviewed.'},
    {'url': MICROSOFT_BUILD, 'by': 'Microsoft', 'date': '2024-05-24',
     'name': 'Five lessons Etsy learned building on Microsoft AI | BRK258',
     'note': 'Session at Microsoft Build 2024, given with colleagues from Etsy and Microsoft.'},
    {'url': 'https://ars.electronica.art/keplersgardens/en/experiental-ai/', 'by': 'Ars Electronica', 'date': '2020-09-10',
     'name': 'The New Real: Experiental AI and the AI Lab',
     'note': 'Panel at the Ars Electronica Festival 2020 with Jake Elwes, Caroline Sinders and Anna Ridler, '
             'moderated by Drew Hemment.'},
    {'url': 'https://www.youtube.com/watch?v=RanjusPDRqk', 'by': 'Columbia GSAPP', 'date': '2017-06-08',
     'name': 'Speak to the Eyes - Mahir Yavuz | Studio-X Istanbul',
     'note': 'Talk on data visualization at Studio-X Istanbul.'},
    {'url': 'https://vimeo.com/199769134', 'by': 'Ars Electronica', 'date': '2016-09',
     'name': 'Chemistry of Intelligence / Ars Electronica 2016 / FIS Stage',
     'note': 'Talk at the Ars Electronica Festival 2016 in Linz.'},
    {'url': 'https://www.nyc.gov/site/cidi/about/innovation-lecture-series.page', 'by': 'NYC CIDI', 'date': '2016-06-02',
     'name': 'Data Visualization Projects for Cities and Citizens',
     'note': 'Lecture in the Innovation Lecture Series of New York City’s Center for Innovation through Data '
             'Intelligence.'},
    {'url': TEDX_VIENNA, 'by': 'TEDx Talks', 'date': '2015-07-09',
     'name': 'Who will govern "smart" cities? | Mahir Yavuz | TEDxViennaSalon',
     'note': 'Talk at TEDxVienna’s CityX salon.'},
    {'url': 'https://www.youtube.com/watch?v=U1D6aZTfhS8', 'by': 'TEDx Talks', 'date': '2014-06-01', 'lang': 'tr',
     'name': 'Veri arayan adam: Mahir Yavuz at TEDxReset 2014',
     'note': 'TEDx talk in Istanbul, “The man seeking the data”. In Turkish.'},
]
PODCASTS = [
    {'url': STACK_OVERFLOW_PODCAST, 'type': 'PodcastEpisode', 'by': 'Stack Overflow', 'date': '2025-07-29',
     'name': 'That custom gift for your mom takes more work than you think',
     'note': 'The Stack Overflow Podcast, on the engineering behind Etsy’s marketplace.'},
    {'url': 'https://datastori.es/81-the-hustle-with-mahir-yavuz-and-jan-willem-tulp/', 'type': 'PodcastEpisode',
     'by': 'Data Stories', 'date': '2016-08-25',
     'name': '081 | The Hustle with Mahir Yavuz and Jan Willem Tulp',
     'note': 'Data Stories episode 81, on the business side of data visualization.'},
    {'url': 'https://datastori.es/data-stories-23-inspiration-or-plagiarism/', 'type': 'PodcastEpisode',
     'by': 'Data Stories', 'date': '2013-05-30',
     'name': 'Inspiration or Plagiarism? w/ Bryan Connor and Mahir Yavuz',
     'note': 'Data Stories episode 23, with Bryan Connor of The Why Axis.'},
    {'url': 'https://manifold.press/diziler/adaptasyon-podcast', 'type': 'PodcastSeries', 'by': 'Manifold',
     'date': '2020', 'when': '2016–2020', 'lang': 'tr', 'own': 'creator',
     'name': 'Adaptasyon',
     'note': 'A podcast on new technology that Mahir made with Onur Akmehmet. In Turkish.'},
]
PRESS = [
    {'url': COLUMBIA_NEWS, 'type': 'NewsArticle', 'by': 'Columbia Engineering', 'date': '2026-02-16',
     'name': 'Preparing Engineers for an AI-Driven World',
     'note': 'On Columbia Engineering’s AI workshops, among them Mahir’s Product Management with AI.'},
    {'url': GOOGLE_CLOUD_STORY, 'by': 'Google Cloud',
     'name': 'Etsy: Connecting nearly 90 million buyers with special items using gen AI and "algotorial curation"',
     'note': 'Google Cloud’s customer story on Etsy, which quotes Mahir.'},
    {'url': 'https://penntoday.upenn.edu/news/maps-pandemics-and-reckoning-history', 'type': 'NewsArticle',
     'by': 'Penn Today', 'date': '2020-08-10',
     'name': 'Maps, pandemics, and reckoning with history',
     'note': 'On mapping at Penn, with Mahir on the COVID-19 data compiler that Topos built.'},
    {'url': 'https://www.inverse.com/article/46287-transforming-data-collection-with-artificial-intelligence',
     'type': 'NewsArticle', 'by': 'Inverse', 'date': '2018-07-08',
     'name': 'Topos Utilizes A.I. to Understand Cities and Map Micro-Neighborhoods',
     'note': 'On how Topos reads cities with machine learning, with Mahir and co-founder Will Shapiro.'},
    {'url': 'https://www.storybench.org/one-data-driven-art-technology-company-understanding-cities-ai/',
     'type': 'NewsArticle', 'by': 'Storybench', 'date': '2017-11-03',
     'name': 'How one data-driven art and technology company is understanding cities with AI',
     'note': 'A write-up of Mahir’s talk on Topos at Northeastern University.'},
    {'url': 'https://www.fastcompany.com/90131540/this-startup-used-ai-to-redefine-n-y-c-s-five-boroughs-for-today',
     'type': 'NewsArticle', 'by': 'Fast Company', 'date': '2017-06-29', 'about': False,
     'name': 'Here’s How N.Y.C.’s Five Boroughs Should Really Be Defined',
     'note': 'On Topos, which used AI to redraw New York’s five boroughs.'},
    {'url': 'https://www.metalocus.es/en/news/sense-patterns', 'by': 'Metalocus', 'date': '2011-10-24', 'about': False,
     'name': 'Sense of Patterns',
     'note': 'On Sense of Patterns, Mahir’s series of printed data visualizations.'},
    {'url': 'https://makezine.com/article/craft/newsknitter/', 'by': 'Make:', 'date': '2007-09-05', 'about': False,
     'name': 'Newsknitter',
     'note': 'On News Knitter, made with Ebru Kurbak, which knits the day’s headlines into sweaters.'},
]
PAPERS = [
    {'url': 'https://arxiv.org/abs/2305.13399', 'type': 'ScholarlyArticle', 'by': 'arXiv', 'date': '2023-05-22',
     'own': 'author',
     'name': 'Efficient Large-Scale Visual Representation Learning And Evaluation',
     'note': 'Paper with colleagues at Etsy on visual representation learning at scale.'},
    {'url': 'https://arxiv.org/abs/2302.01255', 'type': 'ScholarlyArticle', 'by': 'arXiv', 'date': '2023-02-02',
     'own': 'author',
     'name': 'adSformers: Personalization from Short-Term Sequences and Diversity of Representations in Etsy Ads',
     'note': 'Paper with colleagues at Etsy on personalizing Etsy Ads from a shopper’s recent activity.'},
    {'url': 'https://medium.com/topos-ai/rethinking-distance-in-new-york-city-d17212d24919', 'type': 'Article',
     'by': 'Topos', 'date': '2017-04-10', 'own': 'author',
     'name': 'Rethinking ‘distance’ in New York City',
     'note': 'Essay with Will Shapiro on new ways to understand a city’s neighborhoods.'},
    {'url': 'https://dl.acm.org/doi/10.1145/1667265.1667298', 'type': 'ScholarlyArticle', 'by': 'ACM', 'date': '2009',
     'own': 'author',
     'name': 'News Knitter',
     'note': 'Paper with Ebru Kurbak on News Knitter.'},
]
PROJECTS = [
    {'url': 'https://vimeo.com/106298010', 'by': 'ARTE Creative', 'date': '2014-09-16', 'own': 'creator',
     'name': 'Orkan Telhan & Mahir M. Yavuz: United Colors of Dissent',
     'note': 'Short film on United Colors of Dissent, from the Connecting Cities series.'},
    {'url': 'https://www.connectingcities.net/projects/united-colors-dissent/', 'by': 'Connecting Cities',
     'date': '2013-09-02', 'own': 'creator',
     'name': 'United Colors of Dissent',
     'note': 'A data-driven performance for public screens, made with Orkan Telhan.'},
    {'url': f'{CASUALDATA}work/', 'by': 'casualdata', 'date': '2011', 'when': '2007–2011', 'own': 'creator',
     'name': 'Work 2007–2011',
     'note': 'Mahir’s own archive of News Knitter, Value Machine, Newshaper, Social Bits and Sense of Patterns.'},
]
# the page's groups, in its order; inside a group the newest comes first, and undated pieces last
RECORD = [
    ('Talks', 'talks', TALKS),
    ('Podcasts', 'podcasts', PODCASTS),
    ('Press', 'press', PRESS),
    ('Papers and essays', 'papers', PAPERS),
    ('Art projects', 'projects', PROJECTS),
]
PRESS_ABOUT = ('Talks, podcasts, press, papers and art projects by and about Mahir Yavuz, each linked to where it was '
               'published.')
# the day the list on /press/ last changed, for the sitemap; change it when you add or remove a piece
PRESS_UPDATED = '2026-11-12'


def piece(p):
    node = {'@type': p.get('type', 'CreativeWork'), 'name': p['name'], 'url': p['url'],
            'publisher': {'@type': 'Organization', 'name': p['by']}}
    if p.get('date'):
        node['datePublished'] = p['date']
    if p.get('lang'):
        node['inLanguage'] = p['lang']
    if p.get('own'):
        node[p['own']] = {'@id': f'{SITE}/#person'}
    return node


def newest_first_pieces(pieces):
    return sorted(pieces, key=lambda p: p.get('date', ''), reverse=True)


# pieces about Mahir himself, for the structured data
ABOUT_MAHIR = [p for _, _, group in RECORD for p in newest_first_pieces(group)
               if p.get('about', True) and not p.get('own')]


def org(name, link, kind='Organization'):
    return {'@type': kind, 'name': name, 'url': link}


# What search engines and AI assistants are told about Mahir. Only what the bios above already say: where he works
# now, where he teaches, and where he worked before (schema.org has no "former employer", so those go under alumniOf,
# which takes any organization). His degrees are not here; add the schools to alumniOf as CollegeOrUniversity.
PERSON = {
    '@type': 'Person',
    '@id': f'{SITE}/#person',
    'name': 'Mahir Yavuz',
    'url': f'{SITE}/',
    # the photo on the homepage; /profile.jpg is the older, smaller one that No. 001 and No. 002 are drawn from
    'image': f'{SITE}/portrait.jpg',
    'description': ROLE,
    'jobTitle': 'Head of Engineering',
    'worksFor': org('AirOps', AIROPS),
    'affiliation': org('Columbia University', COLUMBIA, 'CollegeOrUniversity'),
    'alumniOf': [org('Etsy', ETSY), org('Topos', TOPOS), org('R/GA', RGA), org('Ars Electronica Futurelab', FUTURELAB)],
    'knowsAbout': [
        'AI products', 'Search', 'Recommendation systems', 'Advertising platforms', 'Data science',
        'Machine learning', 'Product management', 'Data visualization', 'Media art',
    ],
    'sameAs': [link for _, link in PROFILES],
    'subjectOf': [piece(p) for p in ABOUT_MAHIR],
}
# casualdata is Mahir's own; its site names him as founder, and this is the same statement from his side
CASUALDATA_ORG = {
    '@type': 'Organization',
    '@id': f'{CASUALDATA}#org',
    'name': 'casualdata',
    'url': CASUALDATA,
    'founder': {'@id': PERSON['@id']},
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
    """28 Oct 2026; Oct 2026 or 2026 when that is all the date says."""
    if len(s) == 4:
        return s
    if len(s) == 7:
        return f"{datetime.date.fromisoformat(s + '-01').strftime('%b')} {s[:4]}"
    d = datetime.date.fromisoformat(s)
    return f"{d.day} {d.strftime('%b')} {d.year}"


def when_of(p):
    """A piece's date as the page shows it; `when` says it in words for one that ran over several years."""
    return p.get('when') or nice_date(p['date'])


def press_rows(pieces):
    """One group on /press/: the date, the piece's title with a sentence on what it is, and who published it."""
    e = html.escape
    rows = []
    for p in newest_first_pieces(pieces):
        when = (f'<time class="n mono" datetime="{p["date"]}">{when_of(p)}</time>' if p.get('date')
                else '<span class="n mono">Undated</span>')
        lang = f' hreflang="{p["lang"]}"' if p.get('lang') else ''
        rows.append(
            f'<li><a href="{e(p["url"])}"{lang}>{when}'
            f'<span class="t">{e(p["name"], quote=False)}</span>'
            f'<span class="by mono">{e(p["by"])} <span aria-hidden="true">↗</span></span>'
            f'<span class="note">{e(p["note"], quote=False)}</span></a></li>')
    return '\n'.join(rows)


def press_page():
    e = html.escape
    parts = []
    for title, slug, pieces in RECORD:
        parts += [f'<section id="{slug}" aria-labelledby="{slug}-title">',
                  f'  <h2 class="label mono" id="{slug}-title">{e(title)}</h2>',
                  '  <ul class="list">',
                  *['    ' + row for row in press_rows(pieces).split('\n')],
                  '  </ul>',
                  '</section>']
    return '\n'.join(parts)


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


def latest_posts():
    """The newest posts on Mahir's Substack, from its feed. If the feed can't be read, the ones the homepage lists
    already, so a bad night at Substack never empties the list."""
    try:
        request = urllib.request.Request(f'{SUBSTACK}feed', headers={'User-Agent': f'{SITE} build'})
        with urllib.request.urlopen(request, timeout=20) as response:
            items = ET.fromstring(response.read()).findall('./channel/item')
        posts = [{'title': i.findtext('title').strip(), 'url': i.findtext('link').strip(),
                  'date': email.utils.parsedate_to_datetime(i.findtext('pubDate')).astimezone(ZONE).date().isoformat()}
                 for i in items]
        if posts:
            return sorted(posts, key=lambda p: p['date'], reverse=True)[:POSTS_SHOWN]
        problem = 'it has no posts'
    except (OSError, ET.ParseError, AttributeError, TypeError, ValueError) as err:
        problem = err
    print(f'kept the posts already on the homepage: could not read {SUBSTACK}feed ({problem})')
    region = re.search(r'<!-- gen:writing -->(.*?)<!-- /gen:writing -->', (ROOT / 'index.html').read_text(), re.S)
    return [{'url': html.unescape(u), 'title': html.unescape(t), 'date': d} for u, d, t in re.findall(
        r'<a href="([^"]+)"><time class="n mono" datetime="([^"]+)">.*?</time><span class="t">(.*?)</span>',
        region.group(1) if region else '')]


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
    posts = latest_posts()
    updated = max([live[-1]['date'] if live else today] + [p['date'] for p in posts])
    e = html.escape

    # the homepage: the short bio, today's work and a plain list of works, which the page redraws for the visitor's
    # day, then the latest posts
    fill('index.html', 'bio', '\n'.join(f'<p>{linked(para)}</p>' for para in SHORT_BIO))
    fill('index.html', 'today', feature(live[-1]) if live else '')
    fill('index.html', 'works', '\n'.join(
        f'<li><a href="/works/{number(w)}/"><span class="n mono">No. {number(w)}</span>'
        f'<span class="t">{e(w["title"])}</span>'
        f'<time class="d mono" datetime="{w["date"]}">{nice_date(w["date"])}</time></a></li>'
        for w in newest_first))
    fill('index.html', 'writing', '\n'.join(
        f'<li><a href="{e(p["url"])}"><time class="n mono" datetime="{p["date"]}">{nice_date(p["date"])}</time>'
        f'<span class="t">{e(p["title"])}</span></a></li>'
        for p in posts))

    # structured data
    fill('index.html', 'ld', ld(
        WEBSITE,
        {'@type': 'ProfilePage', '@id': f'{SITE}/#page', 'url': f'{SITE}/', 'name': 'Mahir Yavuz',
         'isPartOf': {'@id': WEBSITE['@id']}, 'mainEntity': {'@id': PERSON['@id']}, 'dateModified': updated},
        PERSON,
        CASUALDATA_ORG,
        {'@type': 'ItemList', '@id': f'{SITE}/#experiments', 'name': 'Experiments by Mahir Yavuz',
         'itemListOrder': 'https://schema.org/ItemListOrderDescending',
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': url(w), 'name': w['title']}
                             for i, w in enumerate(newest_first)]},
        {'@type': 'ItemList', '@id': f'{SITE}/#writing', 'name': 'Writing by Mahir Yavuz',
         'itemListOrder': 'https://schema.org/ItemListOrderDescending',
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': {
             '@type': 'BlogPosting', 'headline': p['title'], 'url': p['url'], 'datePublished': p['date'],
             'author': {'@id': PERSON['@id']}}} for i, p in enumerate(posts)]}))
    for w in works:
        page = f'works/{number(w)}/index.html'
        if (ROOT / page).exists():
            fill(page, 'ld', ld(WEBSITE, PERSON, artwork(w), breadcrumbs(
                ('Mahir Yavuz', f'{SITE}/'), (f'No. {number(w)} · {w["title"]}', url(w)))))
        else:
            print(f'skipped {page}: no page yet')

    # /press/: every talk, podcast, article, paper and project, and the same list for search engines
    every = [p for _, _, group in RECORD for p in newest_first_pieces(group)]
    fill('press/index.html', 'press', press_page())
    fill('press/index.html', 'ld', ld(
        WEBSITE, PERSON,
        {'@type': 'CollectionPage', '@id': f'{SITE}/press/#page', 'url': f'{SITE}/press/', 'name': PRESS_TITLE,
         'description': PRESS_ABOUT, 'isPartOf': {'@id': WEBSITE['@id']}, 'about': {'@id': PERSON['@id']},
         'dateModified': PRESS_UPDATED, 'mainEntity': {'@id': f'{SITE}/press/#list'}},
        {'@type': 'ItemList', '@id': f'{SITE}/press/#list', 'name': f'{PRESS_TITLE}: Mahir Yavuz',
         'numberOfItems': len(every),
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': piece(p)} for i, p in enumerate(every)]},
        breadcrumbs(('Mahir Yavuz', f'{SITE}/'), (PRESS_TITLE, f'{SITE}/press/'))))

    # sitemap
    entries = [(f'{SITE}/', updated), (f'{SITE}/press/', PRESS_UPDATED)] + [(url(w), w['date']) for w in live]
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
        '## Writing', '',
        *[f'- [{p["title"]}]({p["url"]}) ({nice_date(p["date"])})' for p in posts],
        f'- [All posts on Substack]({SUBSTACK})',
        '',
        f'## {PRESS_TITLE}', '',
        f'The same list, with dates, is a page of its own: {SITE}/press/', '',
        *[line for title, _, group in RECORD for line in (
            f'### {title}', '',
            *[f'- [{p["name"]}]({p["url"]}) ({p["by"]}' + (f', {when_of(p)}' if p.get('date') else '')
              + f'): {p["note"]}' for p in newest_first_pieces(group)],
            '')],
        '## Elsewhere', '',
        *[f'- [{name}]({link})' for name, link in PROFILES],
        '',
    ]
    (ROOT / 'llms.txt').write_text('\n'.join(lines))

    print(f'{len(live)} of {len(works)} works are up as of {today} in New York; on view: '
          f'No. {number(live[-1]) if live else "none"}; refreshed the pages, sitemap.xml and llms.txt')


if __name__ == '__main__':
    main()
