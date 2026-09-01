import { describe, expect, it } from 'vitest';
import { createCampaign, currentScene, reduceGame, restartChapter, returnToCampAfterDefeat } from '../src/game/state';
import type { ContentIndex } from '../src/game/content/schema';
import type { EventId, ItemId } from '../src/game/domain/ids';
import { createSaveRepository } from '../src/game/persistence/repository';
import { applyEffectsAtomically } from '../src/game/state/effects';
import type { GameStateV2 } from '../src/game/state/types';

const itemId = (id: string) => id as ItemId;
const sceneId = (id: string) => id as EventId;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

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
  items: new Map([...content.items, [itemId('potion-red'), {
    id: 'potion-red', name: 'Red Mercy', category: 'potion', description: 'A field tonic.',
    allowedClasses: ['warrior', 'mage', 'warden'], stats: { health: 12 }, value: 12, tags: ['healing'],
  }]]),
  events: new Map([[sceneId('route-scene'), {
    id: sceneId('route-scene'), chapterId: 'ch01', type: 'main', family: 'road', anchorOrder: 0,
    illustrationId: 'camp-art', title: 'Road', narrative: ['A road.'], eligibility: {}, cooldownRuns: 2, oneShot: true,
    choices: [{
      id: 'fight' as never, label: 'Stand and fight', detail: 'Block the goblin road patrol.', outcome: 'Steel clears the road.',
      effects: [{ type: 'combat', encounterId: 'encounter-1' as never }],
    }],
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
  encounters: new Map([['encounter-1' as never, {
    id: 'encounter-1' as never, family: 'goblin-road', kind: 'regular', enemyIds: ['enemy-1' as never],
    reward: { xp: 10, gold: 2, itemChoices: [] },
  }]]),
  merchants: new Map([['merchant-1' as never, { id: 'merchant-1' as never, name: 'Trader', stockItemIds: [itemId('warrior-blade')] }]]),
  companions: new Map([['companion-1' as never, {
    id: 'companion-1' as never, name: 'Scout', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [],
    combat: { attack: 3, guard: 1, will: 2, actionId: 'scout-shot' },
  }]]),
};

function enterCombat(state: GameStateV2, updatedAt: string, testContent: ContentIndex = orchestrationContent): GameStateV2 {
  const selected = state.expedition?.currentSceneId
    ? state
    : reduceGame(state, { type: 'select-next-scene', updatedAt }, testContent).state;
  return reduceGame(selected, {
    type: 'resolve-choice', eventId: sceneId('route-scene'), choiceId: 'fight' as never, updatedAt,
  }, testContent).state;
}

function arriveAtCamp(state: GameStateV2, updatedAt: string): GameStateV2 {
  return reduceGame(state, { type: 'select-next-scene', updatedAt }, content).state;
}

describe('campaign checkpoints', () => {
  it('keeps the requested hero name on the campaign instead of hero progress', () => {
    const state = createCampaign({ heroClass: 'warden', name: 'Mira', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, content);

    expect(state.campaign.heroName).toBe('Mira');
    expect(state.checkpoints.chapter.campaign.heroName).toBe('Mira');
    expect(state.campaign.hero).not.toHaveProperty('name');
  });

  it('persists a custom name from a reducer-created combat', () => {
    const created = createCampaign({ heroClass: 'warrior', name: 'Mira', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const combat = enterCombat(started, '2026-08-31T00:02:00.000Z');
    const repo = createSaveRepository(new MemoryStorage(), () => '2026-08-31T00:03:00.000Z', orchestrationContent);

    expect(combat.expedition?.currentCombat?.combat?.player.name).toBe('Mira');
    expect(repo.saveSlot(1, combat)).toEqual({ ok: true });
    expect(repo.loadSlot(1)).toMatchObject({ ok: true, state: { campaign: { heroName: 'Mira' }, expedition: { currentCombat: { combat: { player: { name: 'Mira' } } } } } });
  });

  it('persists a reducer-created victory on the reward screen and re-saves its hydrated terminal state', () => {
    const victoryContent: ContentIndex = {
      ...orchestrationContent,
      enemies: new Map([...orchestrationContent.enemies, ['enemy-1' as never, { ...orchestrationContent.enemies.get('enemy-1' as never)!, maxHealth: 1 }]]),
    };
    const created = createCampaign({ heroClass: 'warrior', name: 'Mira', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, victoryContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, victoryContent).state;
    const combat = enterCombat(started, '2026-08-31T00:02:00.000Z', victoryContent);
    const won = reduceGame(combat, { type: 'combat-turn', commandId: 'victory-attack', action: { type: 'attack' }, updatedAt: '2026-08-31T00:03:00.000Z' }, victoryContent).state;
    const repo = createSaveRepository(new MemoryStorage(), () => '2026-08-31T00:04:00.000Z', victoryContent);

    expect(won.flow.screen).toBe('reward');
    expect(won.expedition?.currentCombat?.combat?.outcome).toBe('victory');
    expect(repo.saveSlot(1, won)).toEqual({ ok: true });
    const loaded = repo.loadSlot(1);
    expect(loaded).toMatchObject({ ok: true, state: { flow: { screen: 'reward' }, expedition: { currentCombat: { combat: { outcome: 'victory', enemyIntents: [] } } } } });
    if (!loaded.ok) throw new Error('Expected a hydrated victory save.');
    expect(repo.saveSlot(1, loaded.state)).toEqual({ ok: true });
  });

  it('keeps a coherent loaded checkpoint restartable', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const routed = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const repo = createSaveRepository(new MemoryStorage(), () => '2026-08-31T00:02:00.000Z', content);

    expect(repo.saveSlot(1, routed)).toEqual({ ok: true });
    const loaded = repo.loadSlot(1);
    if (!loaded.ok) throw new Error('Expected a hydrated checkpoint save.');
    const restarted = restartChapter(loaded.state, content, '2026-08-31T00:03:00.000Z');

    expect(restarted.expedition).toBeNull();
    expect(restarted.flow.screen).toBe('camp');
    expect(repo.saveSlot(1, restarted)).toEqual({ ok: true });
  });

  it('loses expedition gains but keeps permanent progression on defeat', () => {
    const started = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const startedRoute = reduceGame(started, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const atCamp = arriveAtCamp(startedRoute, '2026-08-31T00:00:45.000Z');
    const banked = reduceGame({ ...atCamp, expedition: { ...atCamp.expedition!, unbankedGold: 1 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const nextRoute = reduceGame(banked, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:15.000Z' }, content).state;
    const state = {
      ...nextRoute,
      campaign: { ...nextRoute.campaign, hero: { ...nextRoute.campaign.hero, xp: 60, level: 2 }, bankedGold: 7 },
      expedition: { ...nextRoute.expedition!, unbankedGold: 40, unbankedLoot: [itemId('warrior-blade')], temporaryBoons: ['road-blessing'] },
      flow: { ...nextRoute.flow, screen: 'defeat' as const },
    };

    const next = returnToCampAfterDefeat(state, content, '2026-08-31T00:02:00.000Z');

    expect(next.expedition).toBeNull();
    expect(next.campaign.hero).toEqual({ heroClass: 'warrior', xp: 60, level: 2, talents: [] });
    expect(next.campaign.bankedGold).toBe(state.checkpoints.camp!.campaign.bankedGold + 20);
    expect(next.campaign.inventory).toEqual(state.checkpoints.camp!.campaign.inventory);
    expect(next.campaign.attemptCounters.ch01).toBe(1);
    expect(next.campaign.routeSeedNonce).toBe(2);
    expect(next.flow.screen).toBe('camp');
  });

  it('uses the newest camp checkpoint and banks only once', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const initial = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const firstArrival = arriveAtCamp(initial, '2026-08-31T00:00:45.000Z');
    const first = reduceGame({ ...firstArrival, expedition: { ...firstArrival.expedition!, unbankedGold: 10 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:01:00.000Z' }, content).state;
    const secondRoute = reduceGame(first, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:15.000Z' }, content).state;
    const secondArrival = arriveAtCamp(secondRoute, '2026-08-31T00:01:30.000Z');
    const second = reduceGame({ ...secondArrival, expedition: { ...secondArrival.expedition!, unbankedGold: 20 } }, { type: 'bank-camp', updatedAt: '2026-08-31T00:02:00.000Z' }, content).state;
    const duplicate = reduceGame(second, { type: 'bank-camp', updatedAt: '2026-08-31T00:03:00.000Z' }, content);

    expect(second.checkpoints.camp!.campaign.bankedGold).toBe(42);
    expect(duplicate.state).toBe(second);
    expect(duplicate.diagnostic?.code).toBe('safe_hub_required');
  });

  it('banks missing unbanked loot into retained inventory without duplicating a carried copy', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const routed = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:00:30.000Z' }, content).state;
    const atCamp = arriveAtCamp(routed, '2026-08-31T00:00:45.000Z');
    const banked = reduceGame({
      ...atCamp,
      campaign: {
        ...atCamp.campaign,
        inventory: { ...atCamp.campaign.inventory, pack: [{ id: 'pack-item-warrior-blade-1', itemId: itemId('warrior-blade'), quantity: 1 }] },
      },
      expedition: { ...atCamp.expedition!, unbankedLoot: [itemId('warrior-blade'), itemId('warrior-blade')] },
    }, { type: 'bank-camp', updatedAt: '2026-08-31T00:01:00.000Z' }, content);

    expect(banked.diagnostic).toBeUndefined();
    expect(banked.state.campaign.inventory.pack).toEqual([
      { id: 'pack-item-warrior-blade-1', itemId: itemId('warrior-blade'), quantity: 1 },
      { id: 'pack-item-warrior-blade-2', itemId: itemId('warrior-blade'), quantity: 1 },
    ]);
    expect(banked.state.checkpoints.camp?.campaign.inventory).toEqual(banked.state.campaign.inventory);
  });

  it('restores exact chapter payload without rewinding attempt, nonce, or profile', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 9, updatedAt: '2026-08-31T00:00:00.000Z' }, content);
    const altered = {
      ...initial,
      profile: { ...initial.profile, settings: { ...initial.profile.settings, sound: false } },
      campaign: { ...initial.campaign, flags: ['after-entry'], evidence: ['proof'], attemptCounters: { ...initial.campaign.attemptCounters, ch01: 4 }, routeSeedNonce: 7 },
      expedition: initial.expedition,
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
    const result = applyEffectsAtomically(state, [
      { type: 'gold', scope: 'unbanked', amount: 20 },
      { type: 'item', operation: 'grant', itemId: itemId('missing-item'), quantity: 1 },
    ], content);

    expect(result).toEqual({ ok: false, error: { code: 'invalid_item', message: 'That item is not available.' } });
    expect(state.expedition!.unbankedGold).toBe(0);
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
    const combat = enterCombat(selected, '2026-08-31T00:03:00.000Z');
    const turned = reduceGame(combat, { type: 'combat-turn', commandId: 'orchestration-attack', action: { type: 'attack' }, updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;
    const traversable = { ...turned, expedition: { ...turned.expedition!, currentCombat: null, unbankedGold: 20 }, flow: { ...turned.flow, screen: 'story' as const } };
    const merchantScene = reduceGame(traversable, { type: 'select-next-scene', updatedAt: '2026-08-31T00:04:30.000Z' }, orchestrationContent).state;
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
    const withCompanion = enterCombat(started, '2026-08-31T00:02:00.000Z');
    const withoutCompanion = reduceGame(createCampaign({ heroClass: 'warrior', seed: 3, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent), { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const noCompanionCombat = enterCombat(withoutCompanion, '2026-08-31T00:02:00.000Z');

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
    const atMerchant = {
      ...started,
      expedition: {
        ...started.expedition!, currentSceneId: sceneId('merchant-scene'),
        sceneResolution: { eventId: sceneId('merchant-scene'), choiceId: null }, unbankedGold: 20,
      },
    };
    const opened = reduceGame(atMerchant, { type: 'open-merchant', updatedAt: '2026-08-31T00:03:00.000Z' }, orchestrationContent).state;
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
    const durableContent: ContentIndex = {
      ...orchestrationContent,
      enemies: new Map([...orchestrationContent.enemies].map(([id, definition]) => [id, { ...definition, maxHealth: 60 }])),
    };
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, durableContent);
    const roster = { activeCompanionId: 'companion-1' as never, records: [{ companionId: 'companion-1' as never, status: 'recruited' as const, questStage: 3 as const, loyalty: 70, injured: false }] };
    const started = reduceGame({ ...created, campaign: { ...created.campaign, companions: roster } }, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, durableContent).state;
    const combat = enterCombat(started, '2026-08-31T00:02:00.000Z', durableContent);
    const first = reduceGame(combat, { type: 'combat-turn', commandId: 'companion-1', action: { type: 'companion' }, updatedAt: '2026-08-31T00:03:00.000Z' }, durableContent).state;
    const rejected = reduceGame(first, { type: 'combat-turn', commandId: 'companion-rejected', action: { type: 'companion' }, updatedAt: '2026-08-31T00:04:00.000Z' }, durableContent);
    const guarded = reduceGame(rejected.state, { type: 'combat-turn', commandId: 'companion-guard', action: { type: 'guard' }, updatedAt: '2026-08-31T00:05:00.000Z' }, durableContent).state;
    const attacked = reduceGame(guarded, { type: 'combat-turn', commandId: 'companion-attack', action: { type: 'attack' }, updatedAt: '2026-08-31T00:06:00.000Z' }, durableContent).state;
    const available = reduceGame(attacked, { type: 'combat-turn', commandId: 'companion-2', action: { type: 'companion' }, updatedAt: '2026-08-31T00:07:00.000Z' }, durableContent);

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
    const firstScene = { ...started, expedition: { ...started.expedition!, currentSceneId: sceneId('merchant-scene'), sceneResolution: { eventId: sceneId('merchant-scene'), choiceId: null }, unbankedGold: 20 } };
    const openedFirst = reduceGame(firstScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent).state;
    const firstKey = openedFirst.flow.merchant!.restockKey;
    const bought = reduceGame(openedFirst, { type: 'trade', intent: { type: 'buy', stockEntryId: openedFirst.expedition!.merchantVisits[0]!.stock[0]!.id }, updatedAt: '2026-08-31T00:03:00.000Z' }, orchestrationContent).state;
    const closed = reduceGame(bought, { type: 'close-merchant', updatedAt: '2026-08-31T00:04:00.000Z' }, orchestrationContent).state;
    const sharedScene = { ...closed, expedition: { ...closed.expedition!, currentSceneId: sceneId('merchant-scene-shared'), sceneResolution: { eventId: sceneId('merchant-scene-shared'), choiceId: null } } };
    const reopenedShared = reduceGame(sharedScene, { type: 'open-merchant', updatedAt: '2026-08-31T00:05:00.000Z' }, orchestrationContent).state;
    const distinctScene = { ...closed, expedition: { ...closed.expedition!, currentSceneId: sceneId('merchant-scene-distinct'), sceneResolution: { eventId: sceneId('merchant-scene-distinct'), choiceId: null } } };
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

  it.each([
    ['story', 'stash-potion'],
    ['combat', 'pack-potion'],
  ] as const)('rejects %s-time inventory discard before it can desynchronise expedition loot', (screen, entryId) => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const inventory = {
      ...started.campaign.inventory,
      pack: [{ id: 'pack-potion', itemId: itemId('potion-red'), quantity: 2 }],
      stash: [{ id: 'stash-potion', itemId: itemId('potion-red'), quantity: 1 }],
    };
    const state: GameStateV2 = {
      ...started,
      campaign: { ...started.campaign, inventory },
      expedition: { ...started.expedition!, unbankedLoot: [itemId('potion-red')] },
      flow: { ...started.flow, screen },
    };
    const result = reduceGame(state, { type: 'inventory', command: { type: 'discard', entryId, quantity: 1 }, updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent);

    expect(result.state).toBe(state);
    expect(result.diagnostic?.code).toBe('camp_required');
    expect(result.state.expedition?.unbankedLoot).toEqual([itemId('potion-red')]);
  });

  it('derives secured and unsecured partial-stack sales from the camp checkpoint', () => {
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const liveInventory = {
      ...started.campaign.inventory,
      pack: [{ id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 3 }],
    };
    const securedInventory = {
      ...started.checkpoints.camp!.campaign.inventory,
      pack: [{ id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 2 }],
    };
    const atMerchant: GameStateV2 = {
      ...started,
      campaign: { ...started.campaign, inventory: liveInventory },
      checkpoints: {
        ...started.checkpoints,
        camp: { ...started.checkpoints.camp!, campaign: { ...started.checkpoints.camp!.campaign, inventory: securedInventory } },
      },
      expedition: {
        ...started.expedition!, currentSceneId: sceneId('merchant-scene'),
        sceneResolution: { eventId: sceneId('merchant-scene'), choiceId: null },
        // One item is truly unsecured; the second marker deliberately models stale persisted data.
        unbankedLoot: [itemId('potion-red'), itemId('potion-red')],
      },
    };
    const opened = reduceGame(atMerchant, { type: 'open-merchant', updatedAt: '2026-08-31T00:02:00.000Z' }, orchestrationContent).state;
    const sold = reduceGame(opened, {
      type: 'trade', intent: { type: 'sell', entryId: 'pack-stack-potion-red', quantity: 2 }, updatedAt: '2026-08-31T00:03:00.000Z',
    }, orchestrationContent).state;
    const defeated = returnToCampAfterDefeat({ ...sold, flow: { ...sold.flow, screen: 'defeat', merchant: null } }, orchestrationContent, '2026-08-31T00:04:00.000Z');

    expect(sold.campaign.inventory.pack).toEqual([{ id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 1 }]);
    expect(sold.checkpoints.camp!.campaign.inventory.pack).toEqual([{ id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 1 }]);
    expect(sold.expedition!.unbankedLoot).toEqual([]);
    expect(defeated.campaign.inventory.pack).toEqual([{ id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 1 }]);
  });

  it('charges a persistent banked-gold choice against the secured checkpoint atomically', () => {
    const tollScene = {
      id: sceneId('toll-scene'), chapterId: 'ch01' as const, type: 'main' as const, family: 'toll', anchorOrder: 0,
      illustrationId: 'camp-art', title: 'The Toll', narrative: ['The gate captain names a price.'], eligibility: {}, cooldownRuns: 0, oneShot: true,
      choices: [{
        id: 'pay-toll' as never, label: 'Pay five gold', detail: 'Buy safe passage.', outcome: 'The gate opens.',
        effects: [
          { type: 'gold' as const, scope: 'banked' as const, amount: -5 },
          { type: 'flag' as const, operation: 'add' as const, flagId: 'toll-paid' as never },
        ],
      }],
    };
    const tollContent: ContentIndex = { ...orchestrationContent, events: new Map([...orchestrationContent.events, [tollScene.id, tollScene]]) };
    const created = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, tollContent);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, tollContent).state;
    const atToll: GameStateV2 = { ...started, expedition: { ...started.expedition!, currentSceneId: tollScene.id, sceneResolution: null } };
    const paid = reduceGame(atToll, { type: 'resolve-choice', eventId: tollScene.id, choiceId: 'pay-toll' as never, updatedAt: '2026-08-31T00:02:00.000Z' }, tollContent).state;
    const defeated = returnToCampAfterDefeat({ ...paid, flow: { ...paid.flow, screen: 'defeat' } }, tollContent, '2026-08-31T00:03:00.000Z');

    expect(paid.campaign.bankedGold).toBe(7);
    expect(paid.checkpoints.camp!.campaign.bankedGold).toBe(7);
    expect(paid.campaign.flags).toContain('toll-paid');
    expect(defeated.campaign.bankedGold).toBe(7);
    expect(defeated.campaign.flags).toContain('toll-paid');
  });

  it('rejects invalid callback promises without mutating the effect batch', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = applyEffectsAtomically(state, [{ type: 'callback', promise: { targetEventId: sceneId('missing'), deadline: { chapterId: 'ch01', slot: 2 } } }], orchestrationContent);

    expect(result).toEqual({ ok: false, error: { code: 'invalid_callback', message: 'That callback target is not available.' } });
  });

  it.each([NaN, Infinity, 1.5, -1])('rejects unsafe callback deadline slot %s atomically', (slot) => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = applyEffectsAtomically(state, [{ type: 'callback', promise: { targetEventId: sceneId('route-scene'), deadline: { chapterId: 'ch01', slot } } }], orchestrationContent);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_callback');
  });

  it('rejects a callback whose target cannot occur before its deadline', () => {
    const initial = createCampaign({ heroClass: 'warrior', seed: 2, updatedAt: '2026-08-31T00:00:00.000Z' }, orchestrationContent);
    const state = reduceGame(initial, { type: 'start-expedition', updatedAt: '2026-08-31T00:01:00.000Z' }, orchestrationContent).state;
    const result = applyEffectsAtomically(state, [{ type: 'callback', promise: { targetEventId: sceneId('late-scene'), deadline: { chapterId: 'ch01', slot: 1 } } }], orchestrationContent);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_callback');
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
