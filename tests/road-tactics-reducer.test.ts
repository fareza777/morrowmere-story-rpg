import { describe, expect, it } from 'vitest';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import type { GameStateV2 } from '../src/game/state/types';
import { makeContentIndex } from './fixtures/game';

const updatedAt = '2026-09-17T08:00:00.000Z';

function roadContent() {
  const content = makeContentIndex();
  const event = content.events.get('fixture-event' as never)!;
  (content.events as Map<never, typeof event>).set(event.id, {
    ...event,
    type: 'journey',
    weight: 10,
    pacing: 'quiet',
  });
  return content;
}

function campState(content = roadContent()) {
  return createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content);
}

function routeState(overrides: Partial<GameStateV2> = {}) {
  const content = roadContent();
  const started = reduceGame(campState(content), {
    type: 'start-expedition',
    routeProfile: 'kings-road',
    updatedAt,
  }, content).state;
  return {
    content,
    state: {
      ...started,
      ...overrides,
      expedition: {
        ...started.expedition!,
        ...overrides.expedition,
      },
    },
  };
}

describe('Road Tactics reducer', () => {
  it('starts a route in travel before selecting a scene', () => {
    const content = roadContent();
    const started = reduceGame(campState(content), {
      type: 'start-expedition',
      routeProfile: 'kings-road',
      updatedAt,
    }, content);

    expect(started.state.flow.screen).toBe('travel');
    expect(started.state.expedition?.currentSceneId).toBeNull();
  });

  it('scout spends one resource and selects exactly one next scene', () => {
    const { content, state } = routeState();
    const before = state.expedition!.heroVitals.resource;
    const result = reduceGame(state, {
      type: 'travel-action',
      action: 'scout',
      updatedAt,
    }, content);

    expect(result.state.expedition!.heroVitals.resource).toBe(before - 1);
    expect(result.state.flow.screen).toBe('story');
    expect(result.state.expedition!.currentSceneId).not.toBeNull();
    expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
  });

  it('rejects scout at zero resource without changing state', () => {
    const { content, state } = routeState();
    const travel = {
      ...state,
      expedition: {
        ...state.expedition!,
        heroVitals: { health: 30, resource: 0 },
      },
    };
    const result = reduceGame(travel, {
      type: 'travel-action',
      action: 'scout',
      updatedAt,
    }, content);

    expect(result.state).toEqual(travel);
    expect(result.diagnostic?.code).toBe('insufficient_resource');
  });

  it('rejects a travel action when a scene is still current', () => {
    const { content, state } = routeState();
    const invalidTravel = {
      ...state,
      expedition: { ...state.expedition!, currentSceneId: 'fixture-event' as never },
    };

    const result = reduceGame(invalidTravel, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state).toEqual(invalidTravel);
    expect(result.diagnostic?.code).toBe('travel_required');
  });

  it('completes the chapter when the director has no remaining scene', () => {
    const { content, state } = routeState();
    const complete = {
      ...state,
      expedition: {
        ...state.expedition!,
        director: {
          ...state.expedition!.director,
          usedSceneIds: ['fixture-event' as never],
          seenEventIds: ['fixture-event' as never],
        },
      },
    };

    const result = reduceGame(complete, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state.expedition).toBeNull();
    expect(result.state.flow.screen).toBe('camp');
    expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
  });

  it('auto-resolves a scene whose dialogue is hidden and keeps its follow-up', () => {
    const content = roadContent();
    const event = content.events.get('fixture-event' as never)!;
    (content.events as Map<never, typeof event>).set(event.id, {
      ...event,
      type: 'journey',
      weight: 10,
      pacing: 'quiet',
      dialogue: [{ speakerName: 'Scout', text: 'This is hidden.', requirements: [{ type: 'flag', flagId: 'missing-flag', present: true }] }],
      followUps: ['follow-up' as never],
    });
    (content.events as Map<never, typeof event>).set('follow-up' as never, {
      ...event,
      id: 'follow-up' as never,
      type: 'journey',
      family: 'follow-up',
      weight: 1,
    });
    const state = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;

    const result = reduceGame(state, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state.expedition?.sceneResolution?.eventId).toBe('fixture-event');
    expect(result.state.expedition?.authoredSceneQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({ sceneId: 'follow-up' }),
    ]));
  });

  it('allows banking a resolved hub after travel clears the current scene', () => {
    const content = roadContent();
    const event = content.events.get('fixture-event' as never)!;
    (content.events as Map<never, typeof event>).set(event.id, { ...event, type: 'hub' });
    const state = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const travel = {
      ...state,
      expedition: {
        ...state.expedition!,
        sceneResolution: { eventId: 'fixture-event' as never, choiceId: null, resultKind: 'direct' as const, chance: null, roll: null, outcome: 'Safe.', effectSummary: [], nextSceneId: null, continueLabel: null },
      },
    };

    const result = reduceGame(travel, { type: 'bank-camp', updatedAt }, content);

    expect(result.state.flow.screen).toBe('camp');
    expect(result.state.expedition).toBeNull();
  });

  it('returns to travel after battle rewards are claimed', () => {
    const { content, state } = routeState();
    const reward = {
      ...state,
      expedition: {
        ...state.expedition!,
        currentCombat: null,
        pendingReward: { rewardId: 'reward-1', rewardOfferId: 'offer-1', encounterId: 'encounter-1' as never, itemChoices: [], baseGold: 0, grantedXp: 0, adEligible: false, rewardedGoldSettlement: 'ineligible' as const },
      },
      flow: { ...state.flow, screen: 'reward' as const },
    };

    const result = reduceGame(reward, { type: 'claim-rewards', rewardId: 'reward-1', itemId: null, updatedAt }, content);

    expect(result.state.flow.screen).toBe('travel');
    expect(result.state.expedition?.currentSceneId).toBeNull();
  });
});
