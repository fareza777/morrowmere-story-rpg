import { describe, expect, it } from 'vitest';
import { createCampaign } from '../src/game/state/create';
import { resolveTravelAction } from '../src/game/state/road-tactics';
import { reduceGame } from '../src/game/state/reducer';
import type { CompanionId } from '../src/game/domain/ids';
import { deriveHeroStats } from '../src/game/progression';
import { makeContentIndex } from './fixtures/game';

const updatedAt = '2026-09-17T08:00:00.000Z';

function routeStateWith(companionId: CompanionId) {
  const content = makeContentIndex();
  const roadEvent = content.events.get('fixture-event' as never)!;
  (content.events as Map<never, typeof roadEvent>).set(roadEvent.id, {
    ...roadEvent,
    type: 'journey',
    pacing: 'quiet',
    threatChange: 0,
    tensionChange: 0,
  });
  const started = reduceGame(createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content), {
    type: 'start-expedition', routeProfile: 'kings-road', updatedAt,
  }, content).state;
  return {
    content,
    state: {
      ...started,
      expedition: {
        ...started.expedition!,
        heroVitals: { health: 20, resource: 3 },
        director: { ...started.expedition!.director, threat: 5, tension: 5 },
      },
      campaign: {
        ...started.campaign,
        companions: {
          activeCompanionId: companionId,
          records: [{ companionId, status: 'recruited' as const, questStage: 3 as const, loyalty: 35, injured: false }],
        },
      },
    },
  };
}

describe('Road Tactics companion moves', () => {
  it.each([
    ['mara', -2, 0, 0, 0, 'road:scouted'],
    ['rukhar', -1, -1, 0, 0, 'road:guarded'],
    ['caldus', 0, 0, 8, 1, 'road:triaged'],
    ['lyra', -1, 0, 0, 0, 'road:proof'],
    ['talla', -1, -1, 0, 0, 'road:hidden'],
  ] as const)('%s has a deterministic exploration effect', (companion, threatDelta, tensionDelta, healthDelta, resourceDelta, boon) => {
    const { state: before, content } = routeStateWith(companion);
    const result = resolveTravelAction(before, 'companion', content, updatedAt);

    expect(result.state.expedition!.director.threat).toBeGreaterThanOrEqual(0);
    expect(result.state.expedition!.director.threat).toBeLessThanOrEqual(10);
    expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
    expect(result.state.expedition!.temporaryBoons).toContain(boon);
    expect(result.state.expedition!.director.threat - before.expedition!.director.threat).toBe(threatDelta);
    expect(result.state.expedition!.director.tension - before.expedition!.director.tension).toBe(tensionDelta);
    expect(result.state.expedition!.heroVitals.health - before.expedition!.heroVitals.health).toBe(healthDelta);
    expect(result.state.expedition!.heroVitals.resource - before.expedition!.heroVitals.resource).toBe(resourceDelta);
    const maxima = deriveHeroStats(before.campaign.hero, before.campaign.inventory, content.items);
    expect(result.state.expedition!.heroVitals.health).toBeLessThanOrEqual(maxima.maxHealth);
    expect(result.state.expedition!.heroVitals.resource).toBeLessThanOrEqual(maxima.maxFocus);
  });

  it('clamps Caldus triage at the hero vital maxima', () => {
    const { state: initial, content } = routeStateWith('caldus');
    const maxima = deriveHeroStats(initial.campaign.hero, initial.campaign.inventory, content.items);
    const before = { ...initial, expedition: { ...initial.expedition!, heroVitals: { health: maxima.maxHealth, resource: maxima.maxFocus } } };
    const result = resolveTravelAction(before, 'companion', content, updatedAt);

    expect(result.state.expedition!.heroVitals).toEqual({ health: maxima.maxHealth, resource: maxima.maxFocus });
  });
});
