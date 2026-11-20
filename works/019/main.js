// main.js: starts No. 019.
//   ?step=3     open on that step of the tour        ?notour   open on the lab alone
//   ?as=Defne   open in a named shopper's shoes      ?pick=ID  open with that listing's panel
//   ?bare       the lab without the page around it, for stills and the share image
//   ?run        run the shop forward for a month at once

import * as lab from './lab.js';
import { start } from './tour.js';
import * as forward from './run.js';

const q = new URLSearchParams(location.search);
const root = document.documentElement;
if (q.has('bare')) root.classList.add('bare');

lab.build();
const named = lab.W.shoppers.find((s) => s.name === q.get('as'));
start(lab, { off: q.has('bare') || q.has('notour') || !!named, step: +q.get('step') || 0 });
if (named) lab.set({ as: named.name, favorites: named.favs.slice() }, false);
if (q.get('pick')) lab.select(+q.get('pick'));
if (q.has('bare')) document.getElementById('tour-open').hidden = true;
forward.build(lab);
if (q.has('run')) forward.run();
root.dataset.ready = '1';
