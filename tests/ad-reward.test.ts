import { describe, expect, it } from 'vitest';
import type { ContentIndex, EncounterDefinition } from '../src/game/content/schema';
import type { CompanionId, EncounterId, EnemyId, EventId, ItemId } from '../src/game/domain/ids';
import { decodeSaveState, encodeSaveState } from '../src/game/persistence/codec';
import { createCampaign, reduceGame } from '../src/game/state';
import type { GameStateV2 } from '../src/game/state/types';

const EVENT_ID = 'reward-fight' as EventId;
const CHOICE_ID = 'meet-the-patrol' as never;
const ENEMY_ID = 'reward-goblin' as EnemyId;
const ENCOUNTER_ID = 'reward-road-patrol' as EncounterId;
const ITEM_ID = 'reward-tonic' as ItemId;
const COMPANION_ID = 'reward-scout' as CompanionId;
const BASE_GOLD = 7;

function rewardContent(kind: EncounterDefinition['kind'] = 'regular'): ContentIndex {
  return {
    events: new Map([[EVENT_ID, {
      id: EVENT_ID,
      chapterId: 'ch01',
      type: 'main',
      family: 'reward-road',
      anchorOrder: 0,
      illustrationId: 'reward-art',
      title: 'The Road Patrol',
      narrative: ['A lone goblin blocks the road.'],
      eligibility: {},
      cooldownRuns: 0,
      oneShot: true,
      choices: [{
        id: CHOICE_ID,
        label: 'Stand your ground',
        detail: 'Fight the patrol.',
        effects: [{ type: 'combat', encounterId: ENCOUNTER_ID }],
        outcome: 'The patrol attacks.',
      }],
    }]]),
    items: new Map([[ITEM_ID, {
      id: ITEM_ID,
      name: 'Road Tonic',
      category: 'potion',
      description: 'A sealed field tonic.',
      allowedClasses: ['warrior', 'mage', 'warden'],
      stats: { health: 3 },
      value: 4,
      tags: ['healing'],
    }]]),
    enemies: new Map([[ENEMY_ID, {
      id: ENEMY_ID,
      archetypeId: 'goblin',
      name: 'Road Goblin',
      rank: 1,
      level: 1,
      species: 'goblin',
      region: 'gloamwood',
      maxHealth: 1,
      attack: 1,
      armor: 0,
      ward: 0,
      intentWeights: { strike: 1 },
      traits: [],
      rewardTags: [],
      description: 'An ordinary road patrol.',
      artFamily: 'goblin',
    }]]),
    encounters: new Map([[ENCOUNTER_ID, {
      id: ENCOUNTER_ID,
      family: 'reward-patrol',
      kind,
      enemyIds: [ENEMY_ID],
      ...(kind === 'boss' ? { bossEnemyId: ENEMY_ID } : {}),
      reward: { xp: 11, gold: BASE_GOLD, itemChoices: [] },
    }]]),
    companions: new Map([[COMPANION_ID, {
      id: COMPANION_ID,
      name: 'Road Scout',
      recruitment: { requiredDecisionIds: [] },
      personalQuestIds: [],
      combat: { attack: 2, guard: 1, will: 1, actionId: 'scout-shot' },
    }]]),
    merchants: new Map(),
    artIds: new Set(['reward-art']),
    audioIds: new Set(),
  };
}

function victoryState(kind: EncounterDefinition['kind'] = 'regular') {
  const content = rewardContent(kind);
  const created = createCampaign({
    heroClass: 'warrior',
    name: 'Mira',
    seed: 2,
    updatedAt: '2026-08-31T12:00:00.000Z',
  }, content);
  const prepared: GameStateV2 = {
    ...created,
    campaign: {
      ...created.campaign,
      inventory: {
        ...created.campaign.inventory,
        pack: [{ id: 'road-tonic-instance', itemId: ITEM_ID, quantity: 1 }],
      },
      companions: {
        activeCompanionId: null,
        records: created.campaign.companions.records.map((record) => ({
          ...record,
          status: 'recruited' as const,
          questStage: 2 as const,
          loyalty: 47,
        })),
      },
    },
  };
  const started = reduceGame(prepared, {
    type: 'start-expedition',
    updatedAt: '2026-08-31T12:01:00.000Z',
  }, content).state;
  const selected = reduceGame(started, {
    type: 'select-next-scene',
    updatedAt: '2026-08-31T12:02:00.000Z',
  }, content).state;
  const combat = reduceGame(selected, {
    type: 'resolve-choice',
    eventId: EVENT_ID,
    choiceId: CHOICE_ID,
    updatedAt: '2026-08-31T12:03:00.000Z',
  }, content).state;
  const won = reduceGame(combat, {
    type: 'combat-turn',
    commandId: `victory-${kind}`,
    action: { type: 'attack' },
    updatedAt: '2026-08-31T12:04:00.000Z',
  }, content).state;
  if (won.flow.screen !== 'reward' || !won.expedition?.pendingReward) {
    throw new Error('The rewarded-ad fixture must end in a battle victory.');
  }
  return { content, state: won };
}

function saveRoundTrip(state: GameStateV2, content: ContentIndex): GameStateV2 {
  const encoded = encodeSaveState(state, content);
  if (!encoded) throw new Error('Expected the rewarded state to encode.');
  const decoded = decodeSaveState(encoded, content);
  if (!decoded) throw new Error('Expected the rewarded state to decode.');
  return decoded;
}

describe('rewarded battle gold', () => {
  it('adds exactly one authored base-gold copy to carried gold without changing progression, items, or companions', () => {
    const { content, state } = victoryState();
    const reward = state.expedition!.pendingReward!;
    const beforeHero = state.campaign.hero;
    const beforeInventory = state.campaign.inventory;
    const beforeCompanions = state.campaign.companions;
    const beforeLoot = state.expedition!.unbankedLoot;

    expect(reward.baseGold).toBe(BASE_GOLD);
    expect(state.expedition!.unbankedGold).toBe(reward.baseGold);
    expect(reward.rewardOfferId).toBe(`reward:${state.campaign.seed}:${reward.rewardId}`);

    const claimed = reduceGame(state, {
      type: 'CLAIM_REWARDED_GOLD',
      rewardOfferId: reward.rewardOfferId,
      updatedAt: '2026-08-31T12:05:00.000Z',
    }, content);

    expect(claimed.diagnostic).toBeUndefined();
    expect(claimed.state.expedition!.unbankedGold - state.expedition!.unbankedGold).toBe(reward.baseGold);
    expect(claimed.state.expedition!.unbankedGold).toBe(BASE_GOLD * 2);
    expect(claimed.state.campaign.bankedGold).toBe(state.campaign.bankedGold);
    expect(claimed.state.campaign.hero).toBe(beforeHero);
    expect(claimed.state.campaign.hero).toEqual(beforeHero);
    expect(claimed.state.campaign.inventory).toBe(beforeInventory);
    expect(claimed.state.campaign.inventory).toEqual(beforeInventory);
    expect(claimed.state.campaign.companions).toBe(beforeCompanions);
    expect(claimed.state.campaign.companions).toEqual(beforeCompanions);
    expect(claimed.state.expedition!.unbankedLoot).toBe(beforeLoot);
    expect(claimed.state.expedition!.pendingReward!.rewardedGoldSettlement).toBe('claimed');
    expect(claimed.state.adPacing).toMatchObject({
      rewardedShownAtCurrentBreak: true,
      claimedRewardOfferIds: [reward.rewardOfferId],
      rewardedClaimsThisExpedition: 1,
    });
  });

  it('is a referential no-op when the same offer is replayed after a save encode/decode round-trip', () => {
    const { content, state } = victoryState();
    const rewardOfferId = state.expedition!.pendingReward!.rewardOfferId;
    const first = reduceGame(state, {
      type: 'CLAIM_REWARDED_GOLD',
      rewardOfferId,
      updatedAt: '2026-08-31T12:05:00.000Z',
    }, content).state;
    const resumed = saveRoundTrip(first, content);

    const duplicate = reduceGame(resumed, {
      type: 'CLAIM_REWARDED_GOLD',
      rewardOfferId,
      updatedAt: '2026-08-31T12:06:00.000Z',
    }, content);

    expect(duplicate.state).toBe(resumed);
    expect(duplicate.events).toEqual([]);
    expect(duplicate.diagnostic).toBeUndefined();
    expect(duplicate.state.expedition!.unbankedGold).toBe(BASE_GOLD * 2);
    expect(duplicate.state.adPacing.claimedRewardOfferIds).toEqual([rewardOfferId]);
    expect(duplicate.state.adPacing.rewardedClaimsThisExpedition).toBe(1);
  });

  it('rejects boss rewards and a fourth rewarded claim in the same expedition', () => {
    const boss = victoryState('boss');
    const bossReward = boss.state.expedition!.pendingReward!;
    expect(bossReward.adEligible).toBe(false);
    expect(bossReward.rewardedGoldSettlement).toBe('ineligible');

    const rejectedBoss = reduceGame(boss.state, {
      type: 'CLAIM_REWARDED_GOLD',
      rewardOfferId: bossReward.rewardOfferId,
      updatedAt: '2026-08-31T12:05:00.000Z',
    }, boss.content);
    expect(rejectedBoss.state).toBe(boss.state);
    expect(rejectedBoss.diagnostic?.code).toBe('rewarded_gold_ineligible');

    const ordinary = victoryState();
    const capped: GameStateV2 = {
      ...ordinary.state,
      adPacing: {
        ...ordinary.state.adPacing,
        claimedRewardOfferIds: ['prior-offer-1', 'prior-offer-2', 'prior-offer-3'],
        rewardedClaimsThisExpedition: 3,
      },
    };
    const rejectedFourth = reduceGame(capped, {
      type: 'CLAIM_REWARDED_GOLD',
      rewardOfferId: capped.expedition!.pendingReward!.rewardOfferId,
      updatedAt: '2026-08-31T12:05:00.000Z',
    }, ordinary.content);
    expect(rejectedFourth.state).toBe(capped);
    expect(rejectedFourth.diagnostic?.code).toBe('rewarded_gold_ineligible');
  });

  it('records an interstitial only at a due camp break and rejects active expedition screens', () => {
    const content = rewardContent();
    const camp = createCampaign({
      heroClass: 'warrior',
      seed: 2,
      updatedAt: '2026-08-31T12:00:00.000Z',
    }, content);
    const due: GameStateV2 = {
      ...camp,
      adPacing: {
        ...camp.adPacing,
        lastInterstitialAt: '2026-08-31T12:10:00.000Z',
        expeditionBreaksSinceInterstitial: 3,
      },
    };
    const shownAt = '2026-08-31T12:30:00.000Z';
    const recorded = reduceGame(due, {
      type: 'RECORD_INTERSTITIAL_SHOWN',
      shownAt,
      updatedAt: shownAt,
    }, content);

    expect(recorded.diagnostic).toBeUndefined();
    expect(recorded.state.flow.screen).toBe('camp');
    expect(recorded.state.expedition).toBeNull();
    expect(recorded.state.adPacing).toMatchObject({
      lastInterstitialAt: shownAt,
      expeditionBreaksSinceInterstitial: 0,
      rewardedShownAtCurrentBreak: false,
    });

    const ordinary = victoryState();
    const unsafe: GameStateV2 = {
      ...ordinary.state,
      adPacing: { ...due.adPacing },
    };
    const rejected = reduceGame(unsafe, {
      type: 'RECORD_INTERSTITIAL_SHOWN',
      shownAt,
      updatedAt: shownAt,
    }, ordinary.content);
    expect(rejected.state).toBe(unsafe);
    expect(rejected.diagnostic?.code).toBe('interstitial_not_due');
  });
});
