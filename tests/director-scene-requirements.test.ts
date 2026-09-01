import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { InventoryState } from '../src/game/inventory';
import { eligibleScenes } from '../src/game/director/eligibility';
import type { JourneyDirectorContext } from '../src/game/director/types';
import { initialDirector } from '../src/game/state/create';

const EMPTY_INVENTORY: InventoryState = {
  pack: [],
  stash: [],
  questItems: [],
  equipment: { weapon: null, armor: null, charms: [] },
};

function scene(overrides: Pick<ChronicleEvent, 'requirements' | 'exclusions'>): ChronicleEvent {
  return {
    id: 'scene-gated-at-runtime' as never,
    chapterId: 'ch01',
    slot: 1,
    type: 'journey',
    family: 'runtime-gate-fixture' as never,
    weight: 1,
    illustrationId: 'fixture-art' as never,
    title: 'A Gated Road',
    narrative: ['The road opens only when its terms are met.'],
    eligibility: {},
    cooldownRuns: 0,
    oneShot: true,
    choices: [],
    ...overrides,
  };
}

function content(event: ChronicleEvent): ContentIndex {
  return {
    events: new Map([[event.id, event]]),
    items: new Map(),
    enemies: new Map(),
    encounters: new Map(),
    companions: new Map(),
    merchants: new Map(),
    artIds: new Set(['fixture-art']),
    audioIds: new Set(),
  };
}

function context(overrides: Partial<JourneyDirectorContext> = {}): JourneyDirectorContext {
  return {
    position: { chapterId: 'ch01', slot: 1 },
    level: 1,
    flags: [],
    inventoryTags: [],
    routeProfile: 'old-forest',
    bankedGold: 0,
    unbankedGold: 0,
    inventory: EMPTY_INVENTORY,
    ...overrides,
  };
}

function eligible(event: ChronicleEvent, directorContext: JourneyDirectorContext): readonly string[] {
  return eligibleScenes(initialDirector(31), directorContext, content(event)).map((candidate) => candidate.id);
}

describe('Chronicle scene-level requirements', () => {
  it('honours flag requirements and exclusions before selecting a scene', () => {
    const event = scene({
      requirements: [{ type: 'flag', flagId: 'road-open', present: true }],
      exclusions: [{ type: 'flag', flagId: 'road-burned', present: true }],
    });

    expect(eligible(event, context())).toEqual([]);
    expect(eligible(event, context({ flags: ['road-open'] }))).toEqual(['scene-gated-at-runtime']);
    expect(eligible(event, context({ flags: ['road-open', 'road-burned'] }))).toEqual([]);
  });

  it('honours scoped gold requirements and exclusions before selecting a scene', () => {
    const event = scene({
      requirements: [{ type: 'gold', scope: 'banked', amount: 6 }],
      exclusions: [{ type: 'gold', scope: 'unbanked', amount: 10 }],
    });

    expect(eligible(event, context({ bankedGold: 5 }))).toEqual([]);
    expect(eligible(event, context({ bankedGold: 6, unbankedGold: 9 }))).toEqual(['scene-gated-at-runtime']);
    expect(eligible(event, context({ bankedGold: 6, unbankedGold: 10 }))).toEqual([]);
  });

  it('honours scoped item requirements and exclusions before selecting a scene', () => {
    const event = scene({
      requirements: [{ type: 'item', itemId: 'tool-rope' as never, quantity: 1, scope: 'owned' }],
      exclusions: [{ type: 'item', itemId: 'artifact-black-seal' as never, quantity: 1, scope: 'pack' }],
    });
    const ropeInStash: InventoryState = {
      ...EMPTY_INVENTORY,
      stash: [{ id: 'rope-stash', itemId: 'tool-rope' as never, quantity: 1 }],
    };
    const forbiddenSealInPack: InventoryState = {
      ...ropeInStash,
      pack: [{ id: 'seal-pack', itemId: 'artifact-black-seal' as never, quantity: 1 }],
    };

    expect(eligible(event, context())).toEqual([]);
    expect(eligible(event, context({ inventory: ropeInStash }))).toEqual(['scene-gated-at-runtime']);
    expect(eligible(event, context({ inventory: forbiddenSealInPack }))).toEqual([]);
  });
});
