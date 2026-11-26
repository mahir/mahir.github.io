// The schedule of works. Each work lives at /works/<n as three digits>/ and goes up on its date.
// The homepage features the newest work whose date has arrived in New York: works/_build.py writes it there,
// and a GitHub Action runs that build just after midnight New York time, so a work dated ahead goes up by
// itself on its day, and a day without a new work keeps the last one.
// Preview any day by adding ?on=YYYY-MM-DD to the homepage.
// `about` is the line under the work on the homepage; it and `medium` also describe the work to search engines
// and AI assistants. After editing the list, run `python3 works/_build.py` to refresh the homepage, sitemap,
// llms.txt and the pages' structured data.
window.Works = (() => {
  'use strict';

  const list = [
    {
      n: 1, title: 'Self-portrait in latent space', date: '2026-10-26', medium: 'Interactive WebGL',
      about: 'A career as a cloud of points that searches itself under the cursor and gathers into a face when the name is clicked.',
    },
    {
      n: 2, title: 'Self-portrait in type', date: '2026-10-26', medium: 'Interactive canvas and type',
      about: 'The original homepage as a full screen of type: the page’s own text runs across it as one line, wound in a spiral from an eye, and sets a face that turns toward the pointer; click to spill the type and wind it again from there, or type to set it in your own words.',
    },
    {
      n: 3, title: 'Manhattan sundial', date: '2026-10-27', medium: 'Interactive WebGL and live solar data',
      about: 'An abstract model of Manhattan lit by the sun where it stands over New York at this minute; drag through the day and the year, or jump to the next Manhattanhenge.',
    },
    {
      n: 4, title: 'Istanbul, piece by piece', date: '2026-10-28', medium: 'Interactive WebGL game',
      about: 'An isometric Istanbul where the Bosphorus, the Golden Horn and the Marmara meet, rebuilt landmark by landmark as each one raises its neighborhood.',
    },
    {
      n: 5, title: 'The year in relief', date: '2026-10-29', medium: 'Interactive WebGL and daily market data',
      about: 'A well-known S&P 500 company’s last year of closing prices as a mountain range, a new company every visit, with the weather set by how the year went.',
    },
    {
      n: 6, title: 'New York, interlocked', date: '2026-10-30', medium: 'Animated SVG lettering',
      about: 'New York neighborhoods drawn stroke by stroke in nested block letters, short letters held in the arms of tall ones, in pairs of colors after Josef Albers, a new name every 15 seconds.',
    },
    {
      n: 7, title: 'Iznik, plate by plate', date: '2026-10-31', medium: 'Interactive WebGL and canvas',
      about: 'Ottoman Iznik dishes painted on a 3D plate in workshop order, outline, cobalt, turquoise, green and red, then glazed, a new pattern every time.',
    },
    {
      n: 8, title: 'Philosophy, mind to mind', date: '2026-11-03', medium: 'Interactive SVG chart',
      about: 'Who drew on whom in 2,600 years of philosophy, from Thales to Judith Butler, as one chart that plays its own lines through time; tap a thinker to light their lineage.',
    },
    {
      n: 9, title: 'The midterm tide', date: '2026-11-04', medium: 'Interactive SVG charts and election data',
      about: 'Every US midterm since 1790 set against 2026: what the record said before the vote, the results as they were called, and state-by-state maps since 1978.',
    },
    {
      n: 10, title: 'The S&P 500, by weight', date: '2026-11-09', medium: 'Interactive canvas chart and SEC filing data',
      about: 'Every company’s share of the S&P 500 from 1995 to 2026, stacked by rank: the twenty largest drawn one by one as they rise and fall, with all 500 a click away.',
    },
    {
      n: 11, title: 'A piano, tuned by ear', date: '2026-11-11', medium: 'Interactive WebGL and Web Audio',
      about: 'One octave of a grand piano’s strings, each a little flat, tuned in the tuner’s own order: turn the lever on a pin until the beat between two notes slows to the right pace, then move to the next string.',
    },
    {
      n: 12, title: 'Ebru, sheet by sheet', date: '2026-11-12', medium: 'Interactive WebGL',
      about: 'A marbler’s tray seen from above: drop the colors, draw them back and forth, comb them, then lay a sheet of paper on the water and keep the sheet as a picture.',
    },
    {
      n: 13, title: 'Turkish, suffix by suffix', date: '2026-11-13', medium: 'Interactive type',
      about: 'A Turkish word grows a suffix at each tap, from Çekoslovakya to 44 letters, while the English under it grows from one word into a sentence; four words to build, and a change of root changes the vowels of every suffix.',
    },
    {
      n: 14, title: 'Cities, step by step', date: '2026-11-14', medium: 'Interactive canvas and OpenStreetMap data',
      about: 'Fifteen minutes on foot from one spot in each of twelve cities, drawn at one scale: the streets light up as the walker reaches them, against the ring a straight line would reach; open a city and drag the map to start somewhere else.',
    },
    {
      n: 15, title: 'Cities, two by two', date: '2026-11-15', medium: 'Interactive canvas and OpenStreetMap data',
      about: 'Two cities side by side at one scale, each street colored by the compass direction it runs: a grid shows as a single color and a city whose streets point every way as every color, with a compass of directions and the junctions counted for each; London against New York, or any two of twelve.',
    },
    {
      n: 16, title: 'A coffee, ordered by color', date: '2026-11-16', medium: 'Interactive WebGL',
      about: 'A mokka on a Viennese coffee-house table: pour milk until it looks like the coffee you drink every day, stir, and a card of coffee colors shows your shade and what to ask for in Vienna, from a Schwarzer to a Kaffee verkehrt.',
    },
    {
      n: 17, title: 'Sufi sayings, card by card', date: '2026-11-17', medium: 'Interactive type and color',
      about: 'More than two hundred sayings of Sufi poets and teachers, from Rabia to Bulleh Shah, each set large on a card in the color of its theme, nine themes from love to loss; open a card for its source and its original words, recolor it, or save it as a picture.',
    },
    {
      n: 18, title: 'Imaginary vehicles, drawn to scale', date: '2026-11-18', medium: 'Generative canvas drawing',
      about: 'A drafting table that does not stop: it invents a vehicle, letters its name and purpose, and draws it in ink, line by line, as an old technical illustration with a parts list and a title block, then turns to a fresh sheet; a teapot under a wing, a grand piano on legs, a lighthouse on pontoons, a car with forty loudspeakers, and plainer things such as landers, locomotives and tugs, each sheet numbered so it can be opened again.',
    },
    {
      n: 19, title: 'One shop, seven feeds', date: '2026-11-20', medium: 'Interactive SVG and simulated data',
      about: 'An imaginary shop of 1,200 handmade things, each drawn in code and favorited by 2,500 shoppers who never existed, sorted by seven recommenders side by side, from a count of favorites to a space of tastes learned from them; favorite a listing and every feed sorts itself again, and open one to read why each feed put it where it did.',
    },
    {
      n: 20, title: 'A language nobody speaks', date: '2026-11-21', medium: 'Generative language, canvas writing and Web Audio',
      about: 'A page that makes up a whole language each time it opens: its sounds, a script of its own that a pen writes out, words built from other words, a way of counting and a grammar; change one English sentence and whatever changes in the language is written in red, with a note on which real languages do the same, from Turkish to Tok Pisin; type a name to see it written, hear the sentence said, and keep the number to open the same language again.',
    },
    {
      n: 21, title: 'A snowflake, on its way down', date: '2026-11-22', medium: 'Live weather data, WebGL and a cellular automaton',
      about: 'A page that finds a town where it is snowing this hour, reads the temperature and humidity of the air above it, and grows one snow crystal by falling through that air: a plate where it is cold and thin, ferns where it is wet near −15°, so the crystal is a record of that sky; drag it back up the rail of heights and let it fall again, point at a piece of ice to see where it froze, or try another of 48 towns.',
    },
    {
      n: 22, title: 'A river, and where it has been', date: '2026-11-23', medium: 'WebGL and a river simulation',
      about: 'A river seen from above that moves across its valley for 2,000 years, eating its outer banks, widening at its quickest bends and cutting off its own loops, and inks the ground it leaves in the color of that century, the way Harold Fisk’s 1944 maps of the Mississippi show its old courses; drag the years back along the rail, point at a piece of ground to see when the river left it and where it ran that year, or open another river: every number from 1 to 99,999 draws one of its own, broad or small, slow or restless, in a valley with its own shape and its own patches of hard ground.',
    },
    {
      n: 23, title: 'Six thousand tastes, narrowing', date: '2026-11-26', medium: 'WebGL simulation and Web Audio',
      about: 'Six thousand made-up shoppers on a map of taste and a feed that shows each of them six things a month, run for twenty years and drawn as a long exposure, every shopper a thin line in the color of where their taste started, so that where a crowd from all over the map is drawn together its colors add up to white; put yourself in the crowd and see where the feed takes you and where you would have gone searching on your own, put up a new thing and see whether anyone is ever shown it, change how the feed leans or shake it for a year, and set the same crowd searching beside it: every number from 1 to 99,999 is a world of its own, in camps, rings or lines, with a big catalog or a small one and sellers quick or slow to copy what sells.',
    },
  ];

  const pad = (x, w) => String(x).padStart(w, '0');
  // New York's calendar day, as YYYY-MM-DD
  const newYork = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });

  function today() {
    const on = new URLSearchParams(location.search).get('on');
    return /^\d{4}-\d{2}-\d{2}$/.test(on || '') ? on : newYork.format(new Date());
  }

  // Works up on a given day, oldest first.
  const live = (day) => list.filter((w) => w.date <= day).sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);

  return {
    list,
    today,
    live,
    current: (day) => live(day).pop() || null,
    url: (w) => `/works/${pad(w.n, 3)}/`,
    number: (w) => pad(w.n, 3),
    // A schedule date as a local calendar day, never shifted by UTC.
    date: (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  };
})();
