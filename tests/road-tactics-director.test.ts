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
});
