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
});
