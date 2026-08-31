import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { EventId } from '../src/game/domain/ids';
import {
  chooseRouteOptions,
  selectNextScene,
  type DirectorContext,
  type DirectorState,
} from '../src/game/director';

const asEventId = (value: string) => value as EventId;

function event(id: string, overrides: Partial<ChronicleEvent> = {}): ChronicleEvent {
  return {
    id: asEventId(id),
    chapterId: 'ch01',
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

function content(events: readonly ChronicleEvent[]): ContentIndex {
  return {
    events: new Map(events.map((scene) => [scene.id, scene])),
    items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(),
    artIds: new Set(['fixture-art']), audioIds: new Set(),
  };
}

function state(overrides: Partial<DirectorState> = {}): DirectorState {
  return {
    rngState: 31, usedSceneIds: [], recentSceneKinds: [], recentFamilies: [], seenEventIds: [],
    familyCooldowns: {}, pendingCallbacks: [], tension: 2, threat: 0, ...overrides,
  };
}

function context(overrides: Partial<DirectorContext> = {}): DirectorContext {
  return {
    position: { chapterId: 'ch01', slot: 1 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest', ...overrides,
  };
}

describe('Chronicle I journey pacing', () => {
  it('takes an eligible threat encounter before an ordinary paced event', () => {
    const step = selectNextScene(
      state({ threat: 6 }),
      context(),
      content([event('combat', { type: 'combat' }), event('ordinary')]),
    );

    expect(step.sceneId).toBe('combat');
    expect(step.reason).toBe('threat');
    expect(step.state.threat).toBeLessThan(6);
  });

  it('keeps scenes unique in a run and honours multi-run family cooldowns', () => {
    const fixture = content([
      event('used'),
      event('cooled', { family: 'recent-family', cooldownRuns: 2 }),
      event('available'),
    ]);
    const step = selectNextScene(
      state({
        usedSceneIds: [asEventId('used')],
        familyCooldowns: { 'recent-family': 3 },
      }),
      context(),
      fixture,
    );

    expect(step.sceneId).toBe('available');
    expect(step.state.usedSceneIds).toEqual([asEventId('used'), asEventId('available')]);
  });

  it('gives unseen eligible scenes a randomized priority over seen scenes', () => {
    const fixture = content([event('seen'), event('unseen-a'), event('unseen-b')]);
    const step = selectNextScene(
      state({ seenEventIds: [asEventId('seen')] }),
      context(),
      fixture,
    );

    expect(['unseen-a', 'unseen-b']).toContain(step.sceneId);
  });

  it('offers three route profiles with distinct risk, recovery, and merchant access', () => {
    const routes = chooseRouteOptions(state(), context());

    expect(routes.map((route) => route.id)).toEqual(['kings-road', 'old-forest', 'ruined-pass']);
    expect(routes[0]?.risk).toBeLessThan(routes[1]?.risk ?? 0);
    expect(routes[1]?.risk).toBeLessThan(routes[2]?.risk ?? 0);
    expect(routes[0]?.merchantBias).toBeGreaterThan(routes[2]?.merchantBias ?? 0);
    expect(routes[0]?.recoveryBias).toBeGreaterThan(routes[2]?.recoveryBias ?? 0);
  });

  it('avoids merchant and recovery droughts across one thousand fixture routes', () => {
    const fixture = content([
      event('fight', { type: 'combat' }),
      event('anchor', { type: 'main', anchorOrder: 3 }),
      event('callback'),
      event('merchant', { type: 'hub', pacing: 'merchant' }),
      event('recovery', { type: 'hub', pacing: 'recovery' }),
      event('journey-a'), event('journey-b'), event('journey-c'), event('journey-d'), event('journey-e'),
      event('journey-f'), event('journey-g'), event('journey-h'), event('journey-i'), event('journey-j'),
    ]);

    for (let seed = 1; seed <= 1_000; seed += 1) {
      let director = state({
        rngState: seed,
        pendingCallbacks: [{
          targetEventId: asEventId('callback'),
          deadline: { chapterId: 'ch01', slot: 6 },
          status: 'pending',
          required: true,
        }],
      });
      const selected: string[] = [];
      for (let slot = 1; slot <= 12; slot += 1) {
        const step = selectNextScene(director, context({ position: { chapterId: 'ch01', slot } }), fixture);
        selected.push(step.sceneId);
        director = step.state;
      }
      const supportSlots = selected
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => id === 'merchant' || id === 'recovery')
        .map(({ index }) => index);
      expect(supportSlots).not.toEqual([]);
      expect(Math.max(...supportSlots.map((slot, index) => index === 0 ? slot + 1 : slot - supportSlots[index - 1]!))).toBeLessThanOrEqual(4);
      expect(new Set(selected).size).toBe(selected.length);
      expect(selected).toContain('anchor');
      expect(selected).toContain('callback');
      expect(director.pendingCallbacks[0]?.status).toBe('fulfilled');
    }
  });
});
