import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('the page switches to js before it paints, also on the homepage copy', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  // after the page:head block, which the homepage copy replaces with the site's own
  const afterBlock = head.slice(head.indexOf('<!-- /page:head -->'));
  assert.match(afterBlock, /<script>document\.documentElement\.classList\.replace\('no-js', 'js'\);<\/script>/);
});

test('the page keeps what the build needs', () => {
  assert.ok(html.startsWith('<!doctype html>\n'));
  assert.equal(html.split('</body>').length - 1, 1);
  assert.match(html, /<!-- page:head -->[\s\S]*<!-- gen:ld -->[\s\S]*<!-- \/gen:ld -->[\s\S]*<!-- \/page:head -->/);
});
