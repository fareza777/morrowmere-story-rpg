import { ENDINGS, resolveEnding } from '../src/game/content/story';
import type { EndingContext } from '../src/game/content/story';

const context = (overrides: Partial<EndingContext>): EndingContext => ({
  flags: [],
  factions: { abbey: 0, freeHost: 0, conclave: 0 },
  corruption: 0,
  mercy: 0,
  ...overrides,
});

describe('ending resolver', () => {
  it.each([
    [context({ flags: ['crown-refused', 'truth-known'], mercy: 4 }), 'the-road-without-kings'],
    [context({ flags: ['crown-destroyed'] }), 'iron-rain'],
    [context({ flags: ['crown-restored'] }), 'the-crowned-wound'],
    [context({ factions: { abbey: 6, freeHost: 1, conclave: 0 } }), 'law-of-iron'],
    [context({ factions: { abbey: 1, freeHost: 6, conclave: 0 } }), 'red-dawn'],
    [context({ factions: { abbey: 0, freeHost: 1, conclave: 6 } }), 'pale-star'],
  ] as const)('resolves a reachable chronicle ending', (state, endingId) => {
    expect(resolveEnding(state).id).toBe(endingId);
  });

  it('defines six distinct endings with complete epilogues', () => {
    expect(ENDINGS).toHaveLength(6);
    expect(new Set(ENDINGS.map((ending) => ending.id)).size).toBe(6);
    expect(ENDINGS.every((ending) => ending.epilogue.length >= 120)).toBe(true);
  });
});
