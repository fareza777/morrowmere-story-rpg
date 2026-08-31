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

const orchestrationContent: ContentIndex = {
  ...content,
  events: new Map([[sceneId('route-scene'), {
    id: sceneId('route-scene'), chapterId: 'ch01', type: 'main', family: 'road', anchorOrder: 0,
    illustrationId: 'camp-art', title: 'Road', narrative: ['A road.'], eligibility: {}, cooldownRuns: 2, oneShot: true, choices: [],
  }], [sceneId('merchant-scene'), {
    id: sceneId('merchant-scene'), chapterId: 'ch01', type: 'hub', family: 'merchant', merchantId: 'merchant-1' as never, merchantRestockKey: 'road-trader',
    illustrationId: 'camp-art', title: 'Trader', narrative: ['A trader waits.'], eligibility: {}, cooldownRuns: 0, oneShot: false, choices: [],
  }], [sceneId('merchant-scene-shared'), {
    id: sceneId('merchant-scene-shared'), chapterId: 'ch01', type: 'hub', family: 'merchant-shared', merchantId: 'merchant-1' as never, merchantRestockKey: 'road-trader',
    illustrationId: 'camp-art', title: 'Second Trader', narrative: ['The same trader returns.'], eligibility: {}, cooldownRuns: 0, oneShot: false, choices: [],
  }], [sceneId('merchant-scene-distinct'), {
    id: sceneId('merchant-scene-distinct'), chapterId: 'ch01', type: 'hub', family: 'merchant-distinct', merchantId: 'merchant-1' as never, merchantRestockKey: 'night-trader',
    illustrationId: 'camp-art', title: 'Night Trader', narrative: ['A new stock arrives.'], eligibility: {}, cooldownRuns: 0, oneShot: false, choices: [],
  }], [sceneId('late-scene'), {
    id: sceneId('late-scene'), chapterId: 'ch01', type: 'main', family: 'late', anchorOrder: 5,
    illustrationId: 'camp-art', title: 'Late', narrative: ['Too late.'], eligibility: {}, cooldownRuns: 0, oneShot: true, choices: [],
  }]]),
  enemies: new Map([['enemy-1' as never, {
    id: 'enemy-1', archetypeId: 'goblin', name: 'Goblin', rank: 1, level: 1, species: 'goblin', region: 'gloamwood',
    maxHealth: 30, attack: 1, armor: 0, ward: 0, intentWeights: { strike: 1 }, traits: [], rewardTags: [], description: 'A foe.', artFamily: 'goblin',
  }]]),
  encounters: new Map([['encounter-1' as never, { id: 'encounter-1' as never, enemyIds: ['enemy-1' as never] }]]),
  merchants: new Map([['merchant-1' as never, { id: 'merchant-1' as never, name: 'Trader', stockItemIds: [itemId('warrior-blade')] }]]),
  companions: new Map([['companion-1' as never, {
    id: 'companion-1' as never, name: 'Scout', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [],
    combat: { attack: 3, guard: 1, will: 2, actionId: 'scout-shot' },
  }]]),
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
      expedition: { ...initial.expedition!, currentCombat: { encounterId: 'fight' as never, combat: null }, pendingRewards: [itemId('warrior-blade')] },
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
    const result = reduceGame(state, { type: 'select-next-scene', updatedAt: '2026-08-31T00:01:00.000Z' }, content);

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

  it('secures recovered gold in the next camp checkpoint across two defeats', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const firstRoute = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const firstCamp = returnToCampAfterDefeat({ ...firstRoute, expedition: { ...firstRoute.expedition!, unbankedGold: 20 }, flow: { ...firstRoute.flow, screen: 'defeat' } }, content, '2026-08-31T00:02:00.000Z');
    const secondRoute = reduceGame(firstCamp, { type: 'start-expedition', updatedAt: '2026-08-31T00:03:00.000Z' }, content).state;
    const secondCamp = returnToCampAfterDefeat({ ...secondRoute, expedition: { ...secondRoute.expedition!, unbankedGold: 10 }, flow: { ...secondRoute.flow, screen: 'defeat' } }, content, '2026-08-31T00:04:00.000Z');

    expect(firstCamp.checkpoints.camp!.campaign.bankedGold).toBe(22);
    expect(secondCamp.campaign.bankedGold).toBe(27);
    expect(secondCamp.checkpoints.camp!.campaign.bankedGold).toBe(27);
  });

  it('orchestrates director selection, combat turns, and merchant trades through V2 commands', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const selected = reduceGame(started, { type: 'select-next-scene', updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent).state;
    const combat = reduceGame(selected, { type: 'apply-effects', updatedAt: '2026-08-31T00:03:00.000Z', effects: [{ type: 'combat', encounterId: 'encounter-1' as never }] }, orchestrationContent).state;
    const turned = reduceGame(combat, { type: 'combat-turn', action: { type: 'attack' }, updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;
    const merchantScene = reduceGame({ ...turned, expedition: { ...turned.expedition!, unbankedGold: 20 }, flow: { ...turned.flow, screen: 'story' } }, { type: 'select-next-scene', updatedAt: '2026-08-31T00:04:30.000Z' }, orchestrationContent).state;
    const opened = reduceGame(merchantScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:04:45.000Z' }, orchestrationContent).state;
    const stockEntryId = opened.expedition!.merchantVisits[0]!.stock[0]!.id;
    const traded = reduceGame(opened, { type: 'trade', intent: { type: 'buy', stockEntryId }, updatedAt: '2026-08-31T00:05:00.000Z' }, orchestrationContent).state;

    expect(selected.expedition!.currentSceneId).toBe(sceneId('route-scene'));
    expect(selected.campaign.directorMemory.seenEventIds).toContain(sceneId('route-scene'));
    expect(combat.flow.screen).toBe('combat');
    expect(turned.expedition!.currentCombat?.combat?.turn).toBeGreaterThan(1);
    expect(traded.expedition!.merchantVisits[0]?.stock).toEqual([]);
    expect(traded.campaign.inventory.pack[0]?.itemId).toBe(itemId('warrior-blade'));
    expect(traded.expedition!.unbankedGold).toBeLessThan(20);
  });

  it('includes only an active recruited companion in V2 combat', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const roster = { activeCompanionId: 'companion-1' as never, records: [{ companionId: 'companion-1' as never, status: 'recruited' as const, questStage: 3 as const, loyalty: 70, injured: false }] };
    const started = reduceGame({ ...created, campaign: { ...created.campaign, companions: roster } }, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const withCompanion = reduceGame(started, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'combat', encounterId: 'encounter-1' as never }] }, orchestrationContent).state;
    const withoutCompanion = reduceGame(createCampaign({ heroClass: 'warrior', seed: 3, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent), { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const noCompanionCombat = reduceGame(withoutCompanion, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'combat', encounterId: 'encounter-1' as never }] }, orchestrationContent).state;

    expect(withCompanion.expedition!.currentCombat!.combat!.companion?.companionId).toBe('companion-1');
    expect(withCompanion.expedition!.currentCombat!.combat!.companionCooldown).toBe(0);
    expect(withCompanion.expedition!.currentCombat!.combat!.companionSupportBudget).toBeGreaterThan(0);
    expect(noCompanionCombat.expedition!.currentCombat!.combat!.companion).toBeNull();
  });

  it('permits trade only through an authored matching merchant window and closes back to story', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const arbitraryInput = { ...started, expedition: { ...started.expedition!, unbankedGold: 20 } };
    const arbitrary = reduceGame(arbitraryInput, { type: 'trade', intent: { type: 'buy', stockEntryId: 'forged' }, updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent);
    const combatInput = { ...arbitraryInput, flow: { ...arbitraryInput.flow, screen: 'combat' as const } };
    const combatRejected = reduceGame(combatInput, { type: 'trade', intent: { type: 'buy', stockEntryId: 'forged' }, updatedAt: '2026-08-31T00:02:10.000Z' }, orchestrationContent);
    const defeatInput = { ...arbitraryInput, flow: { ...arbitraryInput.flow, screen: 'defeat' as const } };
    const defeatRejected = reduceGame(defeatInput, { type: 'trade', intent: { type: 'buy', stockEntryId: 'forged' }, updatedAt: '2026-08-31T00:02:20.000Z' }, orchestrationContent);
    const route = reduceGame(started, { type: 'select-next-scene', updatedAt: '2026-08-31T00:02:30.000Z' }, orchestrationContent).state;
    const atMerchant = reduceGame(route, { type: 'select-next-scene', updatedAt: '2026-08-31T00:02:45.000Z' }, orchestrationContent).state;
    const opened = reduceGame({ ...atMerchant, expedition: { ...atMerchant.expedition!, unbankedGold: 20 } }, { type: 'open-merchant', updatedAt: '2026-08-31T00:03:00.000Z' }, orchestrationContent).state;
    const stockEntryId = opened.expedition!.merchantVisits[0]!.stock[0]!.id;
    const bought = reduceGame(opened, { type: 'trade', intent: { type: 'buy', stockEntryId }, updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;
    const closed = reduceGame(bought, { type: 'close-merchant', updatedAt: '2026-08-31T00:05:00.000Z' }, orchestrationContent).state;
    const reopened = reduceGame(closed, { type: 'open-merchant', updatedAt: '2026-08-31T00:06:00.000Z' }, orchestrationContent).state;

    expect(arbitrary.state).toBe(arbitraryInput);
    expect(arbitrary.diagnostic?.code).toBe('merchant_required');
    expect(combatRejected.state).toBe(combatInput);
    expect(defeatRejected.state).toBe(defeatInput);
    expect(closed.flow.screen).toBe('story');
    expect(closed.flow.merchant).toBeNull();
    expect(reopened.expedition!.merchantVisits[0]!.stock).toEqual([]);
  });

  it('ticks companion cooldown on spent turns without letting rejected actions burn it', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const roster = { activeCompanionId: 'companion-1' as never, records: [{ companionId: 'companion-1' as never, status: 'recruited' as const, questStage: 3 as const, loyalty: 70, injured: false }] };
    const started = reduceGame({ ...created, campaign: { ...created.campaign, companions: roster } }, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const combat = reduceGame(started, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'combat', encounterId: 'encounter-1' as never }] }, orchestrationContent).state;
    const first = reduceGame(combat, { type: 'combat-turn', action: { type: 'companion' }, updatedAt: '2026-08-31T00:03:00.000Z' }, orchestrationContent).state;
    const rejected = reduceGame(first, { type: 'combat-turn', action: { type: 'companion' }, updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent);
    const guarded = reduceGame(rejected.state, { type: 'combat-turn', action: { type: 'guard' }, updatedAt: '2026-08-31T00:05:00.000Z' }, orchestrationContent).state;
    const attacked = reduceGame(guarded, { type: 'combat-turn', action: { type: 'attack' }, updatedAt: '2026-08-31T00:06:00.000Z' }, orchestrationContent).state;
    const available = reduceGame(attacked, { type: 'combat-turn', action: { type: 'companion' }, updatedAt: '2026-08-31T00:07:00.000Z' }, orchestrationContent);

    expect(first.expedition!.currentCombat!.combat!.companionCooldown).toBe(2);
    expect(rejected.events[0]?.domain).toEqual({ type: 'combat_action_rejected', reason: 'companion_cooling_down' });
    expect(rejected.state).toBe(first);
    expect(guarded.expedition!.currentCombat!.combat!.companionCooldown).toBe(1);
    expect(attacked.expedition!.currentCombat!.combat!.companionCooldown).toBe(0);
    expect(available.events.some((event) => event.domain.type === 'companion_commanded')).toBe(true);
  });

  it('shares merchant stock across authored scenes in the same restock namespace', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const firstScene = { ...started, expedition: { ...started.expedition!, currentSceneId: sceneId('merchant-scene'), unbankedGold: 20 } };
    const openedFirst = reduceGame(firstScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent).state;
    const firstKey = openedFirst.flow.merchant!.restockKey;
    const bought = reduceGame(openedFirst, { type: 'trade', intent: { type: 'buy', stockEntryId: openedFirst.expedition!.merchantVisits[0]!.stock[0]!.id }, updatedAt: '2026-08-31T00:03:00.000Z' }, orchestrationContent).state;
    const closed = reduceGame(bought, { type: 'close-merchant', updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;
    const sharedScene = { ...closed, expedition: { ...closed.expedition!, currentSceneId: sceneId('merchant-scene-shared') } };
    const reopenedShared = reduceGame(sharedScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:05:00.000Z' }, orchestrationContent).state;
    const distinctScene = { ...closed, expedition: { ...closed.expedition!, currentSceneId: sceneId('merchant-scene-distinct') } };
    const openedDistinct = reduceGame(distinctScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:06:00.000Z' }, orchestrationContent).state;

    expect(reopenedShared.flow.merchant!.restockKey).toBe(firstKey);
    expect(reopenedShared.expedition!.merchantVisits).toHaveLength(1);
    expect(reopenedShared.expedition!.merchantVisits[0]!.stock).toEqual([]);
    expect(openedDistinct.flow.merchant!.restockKey).not.toBe(firstKey);
    expect(openedDistinct.expedition!.merchantVisits).toHaveLength(2);
    expect(openedDistinct.expedition!.merchantVisits.find((visit) => visit.restockKey === openedDistinct.flow.merchant!.restockKey)?.stock).toHaveLength(1);
  });

  it('keeps director memory across defeat and begins the next run with the saved cooldowns', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const selected = reduceGame(started, { type: 'select-next-scene', updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent).state;
    const camp = returnToCampAfterDefeat({ ...selected, expedition: { ...selected.expedition!, unbankedGold: 1 }, flow: { ...selected.flow, screen: 'defeat' } }, orchestrationContent, '2026-08-31T00:03:00.000Z');
    const next = reduceGame(camp, { type: 'start-expedition', updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;

    expect(next.expedition!.director.seenEventIds).toContain(sceneId('route-scene'));
    expect(next.expedition!.director.currentRunBlockedFamilies).toContain('road');
  });

  it('derives equipment class from campaign state instead of a forged command class', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = { ...initial, campaign: { ...initial.campaign, inventory: { ...initial.campaign.inventory, pack: [{ id: 'blade', itemId: itemId('warrior-blade'), quantity: 1 }] } } };
    const result = reduceGame(state, { type: 'inventory', command: { type: 'equip', entryId: 'blade', heroClass: 'mage' }, updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent);

    expect(result.state.campaign.inventory.equipment.weapon).toBe(itemId('warrior-blade'));
  });

  it('rejects invalid callback promises without mutating the effect batch', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = reduceGame(state, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'callback', promise: { targetEventId: sceneId('missing'), deadline: { chapterId: 'ch01', slot: 2 } } }] }, orchestrationContent);

    expect(result.state).toBe(state);
    expect(result.diagnostic).toEqual({ code: 'invalid_callback', message: 'That callback target is not available.' });
  });

  it.each([NaN, Infinity, 1.5, -1])('rejects unsafe callback deadline slot %s atomically', (slot) => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = reduceGame(state, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'callback', promise: { targetEventId: sceneId('route-scene'), deadline: { chapterId: 'ch01', slot } } }] }, orchestrationContent);

    expect(result.state).toBe(state);
    expect(result.diagnostic?.code).toBe('invalid_callback');
  });

  it('rejects a callback whose target cannot occur before its deadline', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = reduceGame(state, { type: 'apply-effects', updatedAt: '2026-08-31T00:02:00.000Z', effects: [{ type: 'callback', promise: { targetEventId: sceneId('late-scene'), deadline: { chapterId: 'ch01', slot: 1 } } }] }, orchestrationContent);

    expect(result.state).toBe(state);
    expect(result.diagnostic?.code).toBe('invalid_callback');
  });

  it('does not alias nested checkpoint payloads after defeat or chapter restart', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const withSnapshot = { ...initial, checkpoints: { ...initial.checkpoints, chapter: { ...initial.checkpoints.chapter, campaign: { ...initial.checkpoints.chapter.campaign, flags: ['entry'], companions: { activeCompanionId: 'companion-1' as never, records: [{ companionId: 'companion-1' as never, status: 'recruited' as const, questStage: 3 as const, loyalty: 50, injured: false }] } } } } };
    const routed = reduceGame(withSnapshot, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const returned = returnToCampAfterDefeat({ ...routed, expedition: { ...routed.expedition!, unbankedGold: 2 }, flow: { ...routed.flow, screen: 'defeat' } }, orchestrationContent, '2026-08-31T00:02:00.000Z');
    const returnedUnsafe = returned as any;
    returnedUnsafe.campaign.inventory.equipment.charms.push('defeat-mutation');
    expect(returned.checkpoints.camp!.campaign.inventory.equipment.charms).toEqual([]);
    const restarted = restartChapter(returned, orchestrationContent, '2026-08-31T00:03:00.000Z');
    const unsafe = restarted as any;
    unsafe.campaign.flags.push('mutated');
    unsafe.campaign.inventory.equipment.charms.push('mutated');
    unsafe.campaign.companions.records[0].loyalty = -100;
    unsafe.campaign.directorMemory.pendingCallbacks.push({ targetEventId: sceneId('route-scene'), deadline: { chapterId: 'ch01', slot: 1 }, status: 'pending', required: true });

    expect(restarted.checkpoints.chapter.campaign.flags).toEqual(['entry']);
    expect(restarted.checkpoints.chapter.campaign.inventory.equipment.charms).toEqual([]);
    expect(restarted.checkpoints.chapter.campaign.companions.records[0]?.loyalty).toBe(50);
    expect(restarted.checkpoints.chapter.campaign.directorMemory.pendingCallbacks).toEqual([]);
  });

  it('creates independent profile and checkpoint payload references', () => {
    const first = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const second = createCampaign({ heroClass: 'warrior', seed: 3, updatedAt: '2026-08-31T00:00:00.000Z' }, content);

    expect(first.profile).not.toBe(second.profile);
    expect(first.checkpoints.chapter.campaign).not.toBe(first.checkpoints.camp!.campaign);
    expect(first.checkpoints.chapter.campaign.inventory.equipment).not.toBe(first.checkpoints.camp!.campaign.inventory.equipment);
    expect(first.checkpoints.chapter.campaign.companions.records).not.toBe(first.checkpoints.camp!.campaign.companions.records);
  });
});
