import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChapterId, EventId } from '../src/game/domain/ids';
import {
  selectNextScene,
  type DirectorContext,
  type DirectorState,
} from '../src/game/director';

const asEventId = (value: string) => value as EventId;

function event(
  id: string,
  overrides: Partial<ChronicleEvent> = {},
): ChronicleEvent {
  return {
    id: asEventId(id),
    chapterId: 'ch03',
    type: 'journey',
    family: id,
    illustrationId: 'fixture-art',
    title: id,
    narrative: ['A fixture scene.'],
    eligibility: {},
    cooldownRuns: 0,
    oneShot: true,
    choices: [],
    ...overrides,
  };
}

function content(...events: ChronicleEvent[]): ContentIndex {
  return {
    events: new Map(events.map((scene) => [scene.id, scene])),
    items: new Map(),
    enemies: new Map(),
    encounters: new Map(),
    companions: new Map(),
    merchants: new Map(),
    artIds: new Set(['fixture-art']),
    audioIds: new Set(),
  };
}

function state(overrides: Partial<DirectorState> = {}): DirectorState {
  return {
    rngState: 1943,
    usedSceneIds: [],
    recentSceneKinds: [],
    recentFamilies: [],
    seenEventIds: [],
    familyCooldowns: {},
    pendingCallbacks: [],
    tension: 2,
    threat: 0,
    ...overrides,
  };
}

function context(overrides: Partial<DirectorContext> = {}): DirectorContext {
  return {
    position: { chapterId: 'ch03', slot: 2 },
    level: 5,
    flags: [],
    inventoryTags: [],
    routeProfile: 'old-forest',
    ...overrides,
  };
}

describe('Chronicle I callback scheduling', () => {
  it('fulfils a promised callback at its deadline before an eligible anchor', () => {
    const step = selectNextScene(
      state({
        pendingCallbacks: [{
          targetEventId: asEventId('rukhar-callback-03'),
          deadline: { chapterId: 'ch03', slot: 2 },
          status: 'pending',
          required: true,
        }],
      }),
      context(),
      content(
        event('rukhar-callback-03'),
        event('chapter-anchor', { type: 'main', anchorOrder: 2 }),
      ),
    );

    expect(step.sceneId).toBe('rukhar-callback-03');
    expect(step.reason).toBe('callback');
    expect(step.state.pendingCallbacks[0]?.status).toBe('fulfilled');
  });

  it('selects the oldest due main anchor when no callback is due', () => {
    const step = selectNextScene(
      state(),
      context({ position: { chapterId: 'ch03', slot: 4 } }),
      content(
        event('anchor-one', { type: 'main', anchorOrder: 1 }),
        event('anchor-four', { type: 'main', anchorOrder: 4 }),
        event('road-event'),
      ),
    );

    expect(step.sceneId).toBe('anchor-one');
    expect(step.reason).toBe('anchor');
  });

  it('reserves a required callback scene until its deadline', () => {
    const step = selectNextScene(
      state({
        pendingCallbacks: [{
          targetEventId: asEventId('reserved-callback'),
          deadline: { chapterId: 'ch03', slot: 3 },
          status: 'pending',
          required: true,
        }],
      }),
      context({ position: { chapterId: 'ch03', slot: 1 } }),
      content(event('reserved-callback', { weight: 100 }), event('ordinary-road-scene')),
    );

    expect(step.sceneId).toBe('ordinary-road-scene');
    expect(step.state.pendingCallbacks[0]?.status).toBe('pending');
  });

  it('resumes from the saved RNG state without rerolling', () => {
    const saved = state();
    const fixture = content(event('first'), event('second'), event('third'));

    expect(selectNextScene(saved, context(), fixture)).toEqual(
      selectNextScene(saved, context(), fixture),
    );
  });
});
