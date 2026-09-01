import { describe, expect, it } from 'vitest';
import {
  createCampaign,
  currentSceneId,
  reduceGame,
  type GameStateV2,
} from '../src/game/state';
import { applyCompanionEffect, recruitCompanion } from '../src/game/companions';
import type { ContentIndex, ChronicleEvent, EncounterDefinition } from '../src/game/content/schema';
import type { ChoiceId, CompanionId, EncounterId, EnemyId, EventId, ItemId, MerchantId } from '../src/game/domain/ids';
import { createSaveRepository } from '../src/game/persistence';

const asEvent = (value: string) => value as EventId;
const asChoice = (value: string) => value as ChoiceId;
const asItem = (value: string) => value as ItemId;
const asEnemy = (value: string) => value as EnemyId;
const asEncounter = (value: string) => value as EncounterId;
const asCompanion = (value: string) => value as CompanionId;
const asMerchant = (value: string) => value as MerchantId;
const at = (minute: number) => `2026-08-31T00:${String(minute).padStart(2, '0')}:00.000Z`;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function event(input: Partial<ChronicleEvent> & Pick<ChronicleEvent, 'id' | 'type' | 'family' | 'choices'>): ChronicleEvent {
  return {
    chapterId: 'ch01', illustrationId: `${input.id}-art`, title: String(input.id), narrative: ['The road remains clear enough to follow.'],
    eligibility: {}, cooldownRuns: 0, oneShot: true, ...input,
  };
}

function encounter(input: Pick<EncounterDefinition, 'id' | 'family' | 'kind' | 'enemyIds' | 'reward'> & Partial<EncounterDefinition>): EncounterDefinition {
  return input;
}

function makeContent(): ContentIndex {
  const roadFight = event({
    id: asEvent('road-fight'), type: 'main', family: 'road-fight', anchorOrder: 0, eligibility: { routes: ['kings-road'] },
    choices: [{
      id: asChoice('stand-ground'), label: 'Stand your ground', detail: 'Protect the medicine cart.', outcome: 'You hold the road.',
      effects: [
        { type: 'vitals', health: -8 },
        { type: 'item', operation: 'grant', itemId: asItem('red-mercy'), quantity: 2 },
        { type: 'combat', encounterId: asEncounter('road-pack') },
      ],
    }],
  });
  const trader = event({
    id: asEvent('safe-trader'), type: 'hub', family: 'safe-trader', oneShot: false, eligibility: { routes: ['kings-road'] },
    merchantId: asMerchant('road-trader'), merchantRestockKey: 'safe-road', choices: [],
  });
  const fieldWound = event({
    id: asEvent('field-wound'), type: 'main', family: 'field-wound', anchorOrder: 0, eligibility: { routes: ['old-forest'] },
    choices: [{ id: asChoice('bind-wound'), label: 'Bind the wound', detail: 'Keep moving.', outcome: 'The bleeding slows.', effects: [{ type: 'vitals', health: -12 }] }],
  });
  const losingFight = event({
    id: asEvent('losing-fight'), type: 'main', family: 'losing-fight', anchorOrder: 1, eligibility: { routes: ['old-forest'] },
    choices: [{ id: asChoice('face-raider'), label: 'Face the raider', detail: 'There is no safe detour.', outcome: 'The raider charges.', effects: [{ type: 'combat', encounterId: asEncounter('raider-ambush') }] }],
  });

  const item = (id: string, category: 'potion' | 'weapon', value: number, stats: { health?: number; attack?: number }) => ({
    id, name: id, category, description: `${id}.`, allowedClasses: ['warrior', 'mage', 'warden'] as const, stats, value, tags: category === 'potion' ? ['healing'] : [],
  });
  const enemy = (id: string, maxHealth: number, attack: number) => ({
    id, archetypeId: id, name: id, rank: 1, level: 1, species: 'goblin' as const, region: 'gloamwood' as const,
    maxHealth, attack, armor: 0, ward: 0, intentWeights: { strike: 1 as const }, traits: [], rewardTags: [], description: `${id}.`, artFamily: 'goblin',
  });
  const encounters = [
    encounter({ id: asEncounter('road-pack'), family: 'road-pack', kind: 'regular', enemyIds: [asEnemy('goblin-a'), asEnemy('goblin-b')], reward: { xp: 100, gold: 7, itemChoices: [asItem('road-token')] } }),
    encounter({ id: asEncounter('raider-ambush'), family: 'raider', kind: 'lieutenant', enemyIds: [asEnemy('raider')], reward: { xp: 0, gold: 0, itemChoices: [] } }),
  ];
  const events = [roadFight, trader, fieldWound, losingFight];
  return {
    events: new Map(events.map((entry) => [entry.id, entry])),
    items: new Map([
      [asItem('red-mercy'), item('red-mercy', 'potion', 5, { health: 12 })],
      [asItem('road-token'), item('road-token', 'weapon', 1, { attack: 1 })],
      [asItem('merchant-blade'), item('merchant-blade', 'weapon', 15, { attack: 2 })],
    ]),
    enemies: new Map([
      [asEnemy('goblin-a'), enemy('goblin-a', 13, 2)],
      [asEnemy('goblin-b'), enemy('goblin-b', 13, 2)],
      [asEnemy('raider'), enemy('raider', 90, 55)],
    ]),
    encounters: new Map(encounters.map((entry) => [entry.id, entry])),
    companions: new Map([[asCompanion('mara'), {
      id: asCompanion('mara'), name: 'Mara Venn', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [],
      combat: { attack: 1, guard: 1, will: 0, actionId: 'covering-shot' },
    }]]),
    merchants: new Map([[asMerchant('road-trader'), { id: asMerchant('road-trader'), name: 'Road Trader', stockItemIds: [asItem('merchant-blade')] }]]),
    artIds: new Set(events.map((entry) => entry.illustrationId)), audioIds: new Set(),
  };
}

function recruitedCampaign(content: ContentIndex): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', name: 'Aster Vale', seed: 91, updatedAt: at(0) }, content);
  const staged = applyCompanionEffect(created.campaign.companions, { type: 'set-quest-stage', companionId: asCompanion('mara'), questStage: 3 });
  const loyal = applyCompanionEffect(staged.ok ? staged.value : created.campaign.companions, { type: 'change-loyalty', companionId: asCompanion('mara'), amount: 35 });
  const roster = loyal.ok ? loyal.value : created.campaign.companions;
  const recruited = recruitCompanion(roster, asCompanion('mara'), { flags: [], companions: roster }, content);
  if (!recruited.ok) throw new Error('Fixture companion should be recruitable.');
  return { ...created, campaign: { ...created.campaign, companions: recruited.value } };
}

function dispatch(state: GameStateV2, command: Parameters<typeof reduceGame>[1], content: ContentIndex): GameStateV2 {
  const transition = reduceGame(state, command, content);
  if (transition.diagnostic) throw new Error(`${transition.diagnostic.code}: ${transition.diagnostic.message}`);
  return transition.state;
}

function win(state: GameStateV2, content: ContentIndex, startMinute: number): GameStateV2 {
  let next = state;
  for (let turn = 0; turn < 10 && next.flow.screen === 'combat'; turn += 1) {
    next = dispatch(next, { type: 'combat-turn', commandId: `win:${turn}`, action: { type: 'attack' }, updatedAt: at(startMinute + turn) }, content);
  }
  expect(next.flow.screen).toBe('reward');
  expect(next.expedition?.currentCombat?.combat?.player.health).toBeGreaterThan(0);
  return next;
}

describe('Chronicle I public core integration', () => {
  it('runs the real choice, combat, reward, merchant, bank, defeat, save, and restart path', () => {
    const content = makeContent();
    let state = recruitedCampaign(content);
    const activated = reduceGame(state, { type: 'set-active-companion', companionId: asCompanion('mara'), updatedAt: at(1) }, content);
    expect(activated.diagnostic).toBeUndefined();
    state = activated.state;
    expect(state.checkpoints.camp?.campaign.companions.activeCompanionId).toBe(asCompanion('mara'));

    state = dispatch(state, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt: at(2) }, content);
    expect(state.expedition?.heroVitals).toEqual({ health: 44, resource: 8 });
    state = dispatch(state, { type: 'select-next-scene', updatedAt: at(3) }, content);
    expect(currentSceneId(state)).toBe(asEvent('road-fight'));
    const blocked = reduceGame(state, { type: 'select-next-scene', updatedAt: at(4) }, content);
    expect(blocked.state).toBe(state);
    expect(blocked.diagnostic?.code).toBe('choice_required');
    expect(reduceGame(state, { type: 'resolve-choice', eventId: asEvent('stale'), choiceId: asChoice('stand-ground'), updatedAt: at(4) }, content).state).toBe(state);

    state = dispatch(state, { type: 'resolve-choice', eventId: asEvent('road-fight'), choiceId: asChoice('stand-ground'), updatedAt: at(5) }, content);
    expect(state.expedition?.sceneResolution).toMatchObject({ eventId: asEvent('road-fight'), choiceId: asChoice('stand-ground') });
    expect(state.expedition?.currentCombat?.combat?.player.name).toBe('Aster Vale');
    expect(state.expedition?.currentCombat?.combat?.enemies).toHaveLength(2);
    const firstEnemy = state.expedition!.currentCombat!.combat!.enemies[0]!.id;
    state = dispatch(state, { type: 'combat-turn', commandId: 'guard:1', action: { type: 'guard' }, updatedAt: at(6) }, content);
    const potionEntry = state.campaign.inventory.pack.find((entry) => entry.itemId === asItem('red-mercy'))!;
    const beforePotion = potionEntry.quantity;
    state = dispatch(state, { type: 'combat-turn', commandId: 'potion:1', action: { type: 'consumable', instanceId: potionEntry.id }, updatedAt: at(7) }, content);
    expect(state.campaign.inventory.pack.find((entry) => entry.id === potionEntry.id)?.quantity).toBe(beforePotion - 1);
    expect(state.expedition?.heroVitals.health).toBe(state.expedition?.currentCombat?.combat?.player.health);

    const companion = reduceGame(state, { type: 'combat-turn', commandId: 'companion:1', action: { type: 'companion', targetId: firstEnemy }, updatedAt: at(8) }, content);
    state = companion.state;
    expect(state.expedition?.currentCombat?.combat?.companionCooldown).toBe(2);
    const rejected = reduceGame(state, { type: 'combat-turn', commandId: 'companion:2', action: { type: 'companion', targetId: firstEnemy }, updatedAt: at(9) }, content);
    expect(rejected.state).toBe(state);
    expect(rejected.events[0]?.eventId).toBe('transient:companion:2:0');
    const replay = reduceGame(state, { type: 'combat-turn', commandId: 'companion:2', action: { type: 'companion', targetId: firstEnemy }, updatedAt: at(9) }, content);
    expect(replay.events[0]?.eventId).toBe(rejected.events[0]?.eventId);
    const otherTap = reduceGame(state, { type: 'combat-turn', commandId: 'companion:3', action: { type: 'companion', targetId: firstEnemy }, updatedAt: at(9) }, content);
    expect(otherTap.events[0]?.eventId).not.toBe(rejected.events[0]?.eventId);
    state = dispatch(state, { type: 'combat-turn', commandId: 'cooldown:1', action: { type: 'attack' }, updatedAt: at(10) }, content);
    expect(state.expedition?.currentCombat?.combat?.companionCooldown).toBe(1);
    state = dispatch(state, { type: 'combat-turn', commandId: 'cooldown:2', action: { type: 'attack' }, updatedAt: at(11) }, content);
    expect(state.expedition?.currentCombat?.combat?.companionCooldown).toBe(0);
    state = win(state, content, 12);

    expect(state.campaign.hero.xp).toBe(100);
    expect(state.campaign.encounterFamilyVictories['road-pack']).toBe(1);
    expect(state.expedition?.unbankedGold).toBe(7);
    expect(state.expedition?.pendingReward).toMatchObject({ encounterId: asEncounter('road-pack'), baseGold: 7, grantedXp: 100, adEligible: true });
    const repo = createSaveRepository(new MemoryStorage(), () => at(20), content);
    expect(repo.saveSlot(1, state)).toEqual({ ok: true });
    const loaded = repo.loadSlot(1);
    if (!loaded.ok) throw new Error('Reward save should load.');
    state = loaded.state;
    const receipt = state.expedition!.pendingReward!;
    state = dispatch(state, { type: 'claim-rewards', rewardId: receipt.rewardId, itemId: asItem('road-token'), updatedAt: at(21) }, content);
    expect(state.expedition?.pendingReward).toBeNull();
    expect(state.expedition?.currentCombat).toBeNull();
    expect(state.campaign.inventory.pack.some((entry) => entry.itemId === asItem('road-token'))).toBe(true);

    state = dispatch(state, { type: 'select-next-scene', updatedAt: at(22) }, content);
    expect(currentSceneId(state)).toBe(asEvent('safe-trader'));
    state = dispatch(state, { type: 'open-merchant', updatedAt: at(23) }, content);
    const visit = state.expedition!.merchantVisits[0]!;
    state = dispatch(state, { type: 'close-merchant', updatedAt: at(24) }, content);
    state = dispatch(state, { type: 'open-merchant', updatedAt: at(25) }, content);
    expect(state.expedition!.merchantVisits[0]).toEqual(visit);
    const stockEntryId = state.expedition!.merchantVisits[0]!.stock[0]!.id;
    state = dispatch(state, { type: 'trade', intent: { type: 'buy', stockEntryId }, updatedAt: at(26) }, content);
    expect(state.expedition?.unbankedGold).toBe(0);
    expect(state.campaign.bankedGold).toBe(4);
    expect(state.checkpoints.camp?.campaign.bankedGold).toBe(4);
    state = dispatch(state, { type: 'close-merchant', updatedAt: at(27) }, content);
    const firstRouteSeed = state.expedition!.routeSeed;
    state = dispatch(state, { type: 'bank-camp', updatedAt: at(28) }, content);
    expect(state.expedition).toBeNull();
    expect(state.flow.screen).toBe('camp');
    expect(state.campaign.routeSeedNonce).toBe(1);

    state = dispatch(state, { type: 'start-expedition', routeProfile: 'old-forest', updatedAt: at(29) }, content);
    expect(state.expedition?.routeSeed).not.toBe(firstRouteSeed);
    state = dispatch(state, { type: 'select-next-scene', updatedAt: at(30) }, content);
    state = dispatch(state, { type: 'resolve-choice', eventId: asEvent('field-wound'), choiceId: asChoice('bind-wound'), updatedAt: at(31) }, content);
    const fieldPotion = state.campaign.inventory.pack.find((entry) => entry.itemId === asItem('red-mercy'))!;
    const rngBefore = state.expedition!.director.rngState;
    const slotBefore = state.expedition!.position.slot;
    state = dispatch(state, { type: 'use-item', entryId: fieldPotion.id, updatedAt: at(32) }, content);
    expect(state.expedition?.director.rngState).toBe(rngBefore);
    expect(state.expedition?.position.slot).toBe(slotBefore);

    state = dispatch(state, { type: 'select-next-scene', updatedAt: at(33) }, content);
    state = dispatch(state, { type: 'resolve-choice', eventId: asEvent('losing-fight'), choiceId: asChoice('face-raider'), updatedAt: at(34) }, content);
    for (let turn = 0; turn < 4 && state.flow.screen === 'combat'; turn += 1) {
      state = dispatch(state, { type: 'combat-turn', commandId: `lose:${turn}`, action: { type: 'guard' }, updatedAt: at(35 + turn) }, content);
    }
    expect(state.flow.screen).toBe('defeat');
    expect(state.expedition?.pendingReward).toBeNull();
    const permanentXp = state.campaign.hero.xp;
    state = dispatch(state, { type: 'return-to-camp-after-defeat', updatedAt: at(40) }, content);
    expect(state.campaign.hero.xp).toBe(permanentXp);
    expect(state.campaign.attemptCounters.ch01).toBe(1);
    state = dispatch(state, { type: 'restart-chapter', updatedAt: at(41) }, content);
    expect(state.expedition).toBeNull();
    expect(state.flow.screen).toBe('camp');
    expect(state.campaign.attemptCounters.ch01).toBe(2);
  });

  it('keeps successful flee separate from rewards', () => {
    const content = makeContent();
    let state = createCampaign({ heroClass: 'warden', seed: 2, updatedAt: at(0) }, content);
    state = dispatch(state, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt: at(1) }, content);
    state = dispatch(state, { type: 'select-next-scene', updatedAt: at(2) }, content);
    state = dispatch(state, { type: 'resolve-choice', eventId: asEvent('road-fight'), choiceId: asChoice('stand-ground'), updatedAt: at(3) }, content);
    state = dispatch(state, { type: 'combat-turn', commandId: 'flee:1', action: { type: 'flee' }, updatedAt: at(4) }, content);
    expect(state.flow.screen).toBe('story');
    expect(state.expedition?.currentCombat).toBeNull();
    expect(state.expedition?.pendingReward).toBeNull();
    expect(state.campaign.hero.xp).toBe(0);
    expect(state.expedition?.unbankedGold).toBe(0);
  });
});
