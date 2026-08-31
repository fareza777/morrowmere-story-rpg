import { EVENTS, SCENE_VARIANT_KEYS } from '../src/game/content/events';
import { buildRoute, chooseNextEvent, getEligibleEvents } from '../src/game/director';
import type { LegacyDirectorContext } from '../src/game/director';

const baseContext: LegacyDirectorContext = {
  seed: 1943,
  heroClass: 'warden',
  flags: [],
  inventoryTags: [],
  factions: { abbey: 0, freeHost: 0, conclave: 0 },
  recentFamilies: [],
  encounteredEventIds: [],
  tension: 2,
  mercy: 0,
  corruption: 0,
  region: 'gloamwood',
};

describe('procedural story director', () => {
  it('builds the same twelve-node chronicle from the same seed', () => {
    const first = buildRoute(baseContext);
    const second = buildRoute(baseContext);

    expect(first).toHaveLength(12);
    expect(first).toEqual(second);
    expect(first.map((node) => node.kind)).toEqual([
      'prologue',
      'story',
      'story',
      'story',
      'lieutenant',
      'story',
      'story',
      'story',
      'lieutenant',
      'story',
      'story',
      'finale',
    ]);
  });

  it('does not repeat an event family inside a three-node memory window', () => {
    const families = buildRoute(baseContext)
      .filter((node) => node.kind === 'story')
      .map((node) => node.family);

    families.forEach((family, index) => {
      expect(families.slice(Math.max(0, index - 3), index)).not.toContain(family);
    });
  });

  it('never exposes an event when its required flag is missing', () => {
    const eligibleIds = getEligibleEvents(baseContext).map((event) => event.id);

    expect(eligibleIds).not.toContain('gloamwood-goblin-debt');
    expect(EVENTS.find((event) => event.id === 'gloamwood-goblin-debt')?.requiredFlags).toEqual([
      'spared-goblin',
    ]);
  });

  it('prioritizes a callback created by earlier mercy', () => {
    const event = chooseNextEvent({
      ...baseContext,
      seed: 77,
      flags: ['spared-goblin'],
      mercy: 2,
    });

    expect(event.id).toBe('gloamwood-goblin-debt');
  });

  it('authors forty-eight templates with over 350 controlled scene variants', () => {
    expect(EVENTS).toHaveLength(48);
    expect(new Set(EVENTS.map((event) => event.id)).size).toBe(48);
    expect(new Set(SCENE_VARIANT_KEYS).size).toBeGreaterThanOrEqual(350);
  });
});
