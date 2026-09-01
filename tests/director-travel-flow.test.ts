import { describe, expect, it } from 'vitest';
import { CHRONICLE1_CONTENT } from '../src/game/content/chronicle1';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { EventId } from '../src/game/domain/ids';
import { choiceIsAvailable, selectNextScene } from '../src/game/director';
import { createCampaign, initialDirector } from '../src/game/state/create';
import { currentSceneId, reduceGame } from '../src/game/state/reducer';
import type { GameStateV2 } from '../src/game/state/types';

const asEventId = (id: string) => id as EventId;

function fixtureEvent(id: string, slot: number, overrides: Partial<ChronicleEvent> = {}): ChronicleEvent {
  return {
    id: asEventId(id), chapterId: 'ch01', slot, type: 'journey', family: id,
    illustrationId: 'fixture-art', title: id, narrative: ['The road continues.'], eligibility: {},
    cooldownRuns: 0, oneShot: true, choices: [], ...overrides,
  };
}

function fixtureContent(events: readonly ChronicleEvent[]): ContentIndex {
  return {
    events: new Map(events.map((event) => [event.id, event])),
    items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(),
    artIds: new Set(['fixture-art']), audioIds: new Set(),
  };
}

function startOldForest(seed = 17): GameStateV2 {
  const created = createCampaign({
    heroClass: 'warrior',
    seed,
    name: 'Travel Flow',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }, CHRONICLE1_CONTENT);
  const started = reduceGame(created, {
    type: 'start-expedition',
    routeProfile: 'old-forest',
    updatedAt: '2026-09-01T00:01:00.000Z',
  }, CHRONICLE1_CONTENT);
  expect(started.diagnostic).toBeUndefined();
  return started.state;
}

function selectAndResolve(state: GameStateV2, minute: number): { readonly state: GameStateV2; readonly sceneId: string } {
  const selected = reduceGame(state, {
    type: 'select-next-scene',
    updatedAt: `2026-09-01T00:${minute.toString().padStart(2, '0')}:00.000Z`,
  }, CHRONICLE1_CONTENT);
  expect(selected.diagnostic).toBeUndefined();
  const sceneId = currentSceneId(selected.state);
  if (!sceneId) throw new Error('Expected a selected Chronicle scene.');
  const event = CHRONICLE1_CONTENT.events.get(sceneId)!;
  const choice = event.choices.find((candidate) => choiceIsAvailable(
    candidate,
    selected.state.campaign.flags,
    selected.state.expedition?.position,
  ));
  if (!choice) return { state: selected.state, sceneId };
  const resolved = reduceGame(selected.state, {
    type: 'resolve-choice',
    eventId: event.id,
    choiceId: choice.id,
    updatedAt: `2026-09-01T00:${(minute + 1).toString().padStart(2, '0')}:00.000Z`,
  }, CHRONICLE1_CONTENT);
  expect(resolved.diagnostic).toBeUndefined();
  return { state: resolved.state, sceneId };
}

describe('Chronicle travel flow across sparse route slots', () => {
  it('uses the nearest future route-compatible scene when the current slot has no unique candidate', () => {
    const usedSceneIds = [
      'ch01-main-three-days-to-greywatch',
      'ch01-journey-jorys-waxed-tube',
      'ch01-companion-mara-measures-the-road',
    ].map(asEventId);
    const step = selectNextScene({
      ...initialDirector(17),
      usedSceneIds,
      seenEventIds: usedSceneIds,
    }, {
      position: { chapterId: 'ch01', slot: 4 },
      level: 1,
      flags: ['wagons-inspected', 'dispatch-seal-learned', 'mara-met'],
      inventoryTags: [],
      routeProfile: 'old-forest',
    }, CHRONICLE1_CONTENT);

    expect(step.kind).toBe('selected');
    if (step.kind !== 'selected') throw new Error(step.diagnostic);
    expect(step.sceneId).toBe('ch01-hub-first-night-camp');
    expect(step.event.slot).toBe(5);
    expect(step.selectedAt).toEqual({ chapterId: 'ch01', slot: 5 });
  });

  it('does not replay an unused optional scene after the road has moved beyond its slot', () => {
    const stale = fixtureEvent('stale-optional', 1, { weight: 10_000 });
    const current = fixtureEvent('current-road', 3, { weight: 1 });
    const step = selectNextScene(initialDirector(17), {
      position: { chapterId: 'ch01', slot: 3 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest',
    }, fixtureContent([stale, current]));

    expect(step.kind).toBe('selected');
    if (step.kind !== 'selected') throw new Error(step.diagnostic);
    expect(step.sceneId).toBe(current.id);
    expect(step.selectedAt).toEqual({ chapterId: 'ch01', slot: 3 });
  });

  it('bridges to a callback deadline even when no authored scene occupies that slot', () => {
    const callback = fixtureEvent('promised-return', 2);
    const laterRoad = fixtureEvent('later-road', 5);
    const step = selectNextScene({
      ...initialDirector(17),
      pendingCallbacks: [{
        targetEventId: callback.id,
        deadline: { chapterId: 'ch01', slot: 4 },
        status: 'pending',
        required: true,
      }],
    }, {
      position: { chapterId: 'ch01', slot: 3 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest',
    }, fixtureContent([callback, laterRoad]));

    expect(step.kind).toBe('selected');
    if (step.kind !== 'selected') throw new Error(step.diagnostic);
    expect(step.sceneId).toBe(callback.id);
    expect(step.reason).toBe('callback');
    expect(step.selectedAt).toEqual({ chapterId: 'ch01', slot: 4 });
  });

  it('completes after the final anchor instead of replaying skipped optional scenes', () => {
    const skipped = fixtureEvent('skipped-optional', 1, { oneShot: false });
    const finale = fixtureEvent('chapter-finale', 2, { type: 'main', anchorOrder: 2 });
    const step = selectNextScene({
      ...initialDirector(17),
      usedSceneIds: [finale.id],
      seenEventIds: [finale.id],
    }, {
      position: { chapterId: 'ch01', slot: 3 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest',
    }, fixtureContent([skipped, finale]));

    expect(step).toMatchObject({
      kind: 'terminal',
      terminal: 'completed',
      diagnostic: expect.stringMatching(/chapter route is complete/i),
    });
  });

  it('advances past a bridged slot so authored anchors remain in chronological order', () => {
    let state = startOldForest();
    const selected: string[] = [];
    for (let index = 0; index < 4; index += 1) {
      const next = selectAndResolve(state, 2 + index * 2);
      state = next.state;
      selected.push(next.sceneId);
    }

    expect(selected).toEqual([
      'ch01-main-three-days-to-greywatch',
      'ch01-journey-jorys-waxed-tube',
      'ch01-companion-mara-measures-the-road',
      'ch01-hub-first-night-camp',
    ]);
    expect(state.expedition?.position).toEqual({ chapterId: 'ch01', slot: 6 });

    const afterCamp = selectAndResolve(state, 10);
    expect(afterCamp.sceneId).toBe('ch01-main-medicine-for-the-north');
  });
});
