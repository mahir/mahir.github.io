import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, onTarget } from '../game.js';

test('place once, count, done fires once', () => {
  const g = createGame(['a', 'b']);
  let done = 0;
  const placed = [];
  g.on('done', () => done++);
  g.on('place', (e) => placed.push(e));
  assert.equal(g.place('a'), true);
  assert.equal(g.place('a'), false);
  assert.equal(g.place('zzz'), false);
  assert.deepEqual(g.count(), { placed: 1, total: 2 });
  assert.deepEqual(g.remaining(), ['b']);
  assert.equal(g.isPlaced('a'), true);
  g.place('b');
  g.place('b');
  assert.equal(done, 1);
  assert.equal(g.done(), true);
  assert.deepEqual(placed, [{ id: 'a', placed: 1, total: 2 }, { id: 'b', placed: 2, total: 2 }]);
});

test('onTarget', () => {
  assert.ok(onTarget({ x: 3, z: 4 }, { x: 0, z: 0 }, 5));
  assert.ok(!onTarget({ x: 3, z: 4.1 }, { x: 0, z: 0 }, 5));
  assert.ok(!onTarget(null, { x: 0, z: 0 }, 5)); // a drop off the map
});
