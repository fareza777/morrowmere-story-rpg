import { createRng } from '../src/game/rng';

describe('seeded random generator', () => {
  it('replays the same sequence from the same seed', () => {
    const first = createRng(1337);
    const second = createRng(1337);

    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ]);
  });

  it('continues from a serialized state', () => {
    const original = createRng(417);
    original.next();
    const restored = createRng(original.state);

    expect(restored.next()).toBe(original.next());
  });

  it('selects only values inside the requested range', () => {
    const rng = createRng(99);
    const values = Array.from({ length: 100 }, () => rng.int(3, 7));

    expect(Math.min(...values)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...values)).toBeLessThanOrEqual(7);
    expect(new Set(values)).toEqual(new Set([3, 4, 5, 6, 7]));
  });
});
