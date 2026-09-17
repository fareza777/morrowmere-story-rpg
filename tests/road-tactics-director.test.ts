import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { EventId } from '../src/game/domain/ids';
import { selectNextScene, type DirectorState, type JourneyDirectorContext } from '../src/game/director';

const asEventId = (value: string) => value as EventId;

function event(id: string, overrides: Partial<ChronicleEvent> = {}): ChronicleEvent {
  return {
    id: asEventId(id), chapterId: 'ch01', type: 'journey', family: id, illustrationId: 'fixture-art',
    title: id, narrative: ['A fixture scene.'], eligibility: {}, cooldownRuns: 0, oneShot: true, choices: [],
    ...overrides,
  };
}

function content(events: readonly ChronicleEvent[]): ContentIndex {
  return { events: new Map(events.map((scene) => [scene.id, scene])), items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(), artIds: new Set(['fixture-art']), audioIds: new Set() };
}

const director: DirectorState = {
  rngState: 1, usedSceneIds: [], recentSceneKinds: [], recentFamilies: [], seenEventIds: [],
  familyCooldowns: {}, currentRunBlockedFamilies: [], pendingCallbacks: [], tension: 2, threat: 0,
};

const context: JourneyDirectorContext = {
  position: { chapterId: 'ch01', slot: 1 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest',
};

describe('Road Tactics director bias', () => {
  it('scout prefers an investigation candidate over a danger candidate when both are valid', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('danger', { type: 'combat', weight: 1 }),
      event('investigation', { journeySubtype: 'investigation', weight: 1 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.event.journeySubtype).toBe('investigation');
  });

  it('press-on never bypasses a required callback', () => {
    const selected = selectNextScene({
      ...director,
      pendingCallbacks: [{ targetEventId: asEventId('callback'), deadline: { chapterId: 'ch01', slot: 1 }, status: 'pending', required: true }],
    }, { ...context, roadBias: 'press-on' }, content([
      event('callback'),
      event('danger', { type: 'combat', weight: 100 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.reason).toBe('callback');
  });

  it('keeps paced merchant support ahead of forced threat combat without a road bias', () => {
    const selected = selectNextScene({ ...director, threat: 6, recentSceneKinds: ['danger', 'danger', 'danger'] }, context, content([
      event('merchant', { type: 'hub', pacing: 'merchant', weight: 1_000 }),
      event('combat', { type: 'combat', pacing: 'danger', weight: 1 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.sceneId).toBe('merchant');
    expect(selected.kind === 'selected' && selected.reason).toBe('paced');
  });

  it('does not let road bias bypass a chapter anchor', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('anchor', { type: 'main', anchorOrder: 1 }),
      event('investigation', { journeySubtype: 'investigation', weight: 1_000 }),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('anchor');
    expect(selected.kind === 'selected' && selected.reason).toBe('anchor');
  });

  it('does not let road bias select an ineligible favored investigation', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('locked-investigation', { journeySubtype: 'investigation', weight: 1_000, eligibility: { requiredFlags: ['proof'] } }),
      event('available-road'),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('available-road');
  });

  it('does not let press-on exceed the combat streak cap', () => {
    const usedCombatIds = [asEventId('combat-one'), asEventId('combat-two'), asEventId('combat-three')];
    const selected = selectNextScene({ ...director, usedSceneIds: usedCombatIds }, { ...context, roadBias: 'press-on' }, content([
      event('combat-one', { type: 'combat' }),
      event('combat-two', { type: 'combat' }),
      event('combat-three', { type: 'combat' }),
      event('next-combat', { type: 'combat', weight: 1_000 }),
      event('safe-road'),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('safe-road');
  });
});
