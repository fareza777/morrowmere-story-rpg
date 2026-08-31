import { describe, expect, it } from 'vitest';
import { createCampaign, currentScene, reduceGame, restartChapter, returnToCampAfterDefeat } from '../src/game/state';
import type { ContentIndex } from '../src/game/content/schema';
import type { EventId, ItemId } from '../src/game/domain/ids';

const itemId = (id: string) => id as ItemId;
const sceneId = (id: string) => id as EventId;

const content: ContentIndex = {
  events: new Map([[sceneId('camp-scene'), {
    id: sceneId('camp-scene'), chapterId: 'ch01', type: 'hub', family: 'camp',
    illustrationId: 'camp-art', title: 'Camp', narrative: ['Safe for now.'], eligibility: {}, cooldownRuns: 0, oneShot: false, choices: [],
  }]]),
  items: new Map([[itemId('warrior-blade'), {
    id: 'warrior-blade', name: 'Warrior Blade', category: 'weapon', description: 'A blade.',
    allowedClasses: ['warrior'], stats: { attack: 2 }, value: 10, tags: [],
  }]]),
  enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(), artIds: new Set(['camp-art']), audioIds: new Set(),
};

describe('campaign checkpoints', () => {
  it('loses expedition gains but keeps permanent progression on defeat', () => {
    const started = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const startedRoute = reduceGame(started, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const banked = reduceGame({ ...startedRoute, expedition: { ...startedRoute.expedition!, unbankedGold: 1 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const state = {
      ...banked,
      campaign: { ...banked.campaign, hero: { ...banked.campaign.hero, xp: 60, level: 2 }, bankedGold: 7 },
      expedition: { ...banked.expedition!, unbankedGold: 40, unbankedLoot: [itemId('warrior-blade')], temporaryBoons: ['road-blessing'] },
      flow: { ...banked.flow, screen: 'defeat' as const },
    };

    const next = returnToCampAfterDefeat(state, content, '2026-08-31T00:02:00.000Z');

    expect(next.expedition).toBeNull();
    expect(next.campaign.hero).toEqual({ heroClass: 'warrior', xp: 60, level: 2, talents: [] });
    expect(next.campaign.bankedGold).toBe(state.checkpoints.camp!.campaign.bankedGold + 20);
    expect(next.campaign.inventory).toEqual(state.checkpoints.camp!.campaign.inventory);
    expect(next.campaign.attemptCounters.ch01).toBe(1);
    expect(next.campaign.routeSeedNonce).toBe(1);
    expect(next.flow.screen).toBe('camp');
  });

  it('uses the newest camp checkpoint and banks only once', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const initial = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const first = reduceGame({ ...initial, expedition: { ...initial.expedition!, unbankedGold: 10 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const second = reduceGame({ ...first, expedition: { ...first.expedition!, unbankedGold: 20 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:02:00.000Z' }, content).state;
    const duplicate = reduceGame(second, { type: 'bank-camp', updatedAt: '2026-08-31T00:03:00.000Z' }, content);

    expect(second.checkpoints.camp!.campaign.bankedGold).toBe(42);
    expect(duplicate.state).toBe(second);
    expect(duplicate.diagnostic?.code).toBe('nothing_to_bank');
  });

  it('restores exact chapter payload without rewinding attempt, nonce, or profile', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const altered = {
      ...initial,
      profile: { ...initial.profile, settings: { ...initial.profile.settings, sound: false } },
      campaign: { ...initial.campaign, flags: ['after-entry'], evidence: ['proof'], attemptCounters: { ch01: 4 }, routeSeedNonce: 7 },
      expedition: { ...initial.expedition!, currentCombat: { encounterId: 'fight' as never }, pendingRewards: [itemId('warrior-blade')] },
      flow: { ...initial.flow, screen: 'defeat' as const },
    };

    const next = restartChapter(altered, content, '2026-08-31T00:02:00.000Z');

    expect(next.campaign.flags).toEqual([]);
    expect(next.campaign.evidence).toEqual([]);
    expect(next.campaign.attemptCounters.ch01).toBe(5);
    expect(next.campaign.routeSeedNonce).toBe(8);
    expect(next.profile.settings.sound).toBe(false);
    expect(next.expedition).toBeNull();
    expect(next.flow.screen).toBe('camp');
  });

  it('rejects an atomic effect batch without changing RNG or any slice', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const state = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const result = reduceGame(state, { type: 'apply-effects', updatedAt: '2026-08-31T00:01:00.000Z', effects: [
      { type: 'gold', scope: 'unbanked', amount: 20 },
      { type: 'item', operation: 'grant', itemId: itemId('missing-item'), quantity: 1 },
    ] }, content);

    expect(result.state).toBe(state);
    expect(result.diagnostic).toEqual({ code: 'invalid_item', message: 'That item is not available.' });
    expect(result.events).toEqual([]);
  });

  it('sequences committed events and exposes the current scene without catalog data in snapshots', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const state = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const result = reduceGame(state, { type: 'set-scene', sceneId: sceneId('camp-scene'), updatedAt: '2026-08-31T00:01:00.000Z' }, content);

    expect(currentScene(result.state, content)?.id).toBe(sceneId('camp-scene'));
    expect(result.events).toEqual([{ domain: { type: 'notification', message: 'Scene ready.' }, eventId: '2:0', sequence: 2 }]);
    expect(JSON.stringify(result.state.checkpoints)).not.toContain('Safe for now.');
  });

  it('derives a saved route seed from the campaign seed and the fresh-route nonce', () => {
    const nine = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const eleven = createCampaign({ heroClass: 'warrior', seed: 11, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const first = reduceGame(nine, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const other = reduceGame(eleven, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const retried = reduceGame({ ...first, flow: { ...first.flow, screen: 'defeat' }, expedition: { ...first.expedition!, unbankedGold: 1 } }, { type: 'return-to-camp-after-defeat', updatedAt: '2026-08-31T00:02:00.000Z' }, content).state;
    const fresh = reduceGame(retried, { type: 'start-expedition', updatedAt: '2026-08-31T00:03:00.000Z' }, content).state;

    expect(first.expedition!.routeSeed).not.toBe(other.expedition!.routeSeed);
    expect(fresh.expedition!.routeSeed).not.toBe(first.expedition!.routeSeed);
  });
});
