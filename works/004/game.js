// What has been placed. Placing is the only way in, and it says no to a landmark already placed, so a double tap,
// a drop during "Build it for me" or a second press of the button can never place one twice.

export function createGame(ids) {
  const placed = new Set();
  const listeners = { place: [], done: [] };
  const emit = (type, detail) => listeners[type].forEach((fn) => fn(detail));
  return {
    place(id) {
      if (!ids.includes(id) || placed.has(id)) return false;
      placed.add(id);
      emit('place', { id, placed: placed.size, total: ids.length });
      if (placed.size === ids.length) emit('done');
      return true;
    },
    isPlaced: (id) => placed.has(id),
    remaining: () => ids.filter((id) => !placed.has(id)),
    count: () => ({ placed: placed.size, total: ids.length }),
    done: () => placed.size === ids.length,
    on(type, fn) { listeners[type].push(fn); },
  };
}

// a drop lands on its outline when it falls within radius metres of it on the ground
export function onTarget(point, target, radius) {
  return !!point && Math.hypot(point.x - target.x, point.z - target.z) <= radius;
}
