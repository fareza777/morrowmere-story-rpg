import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex, EncounterDefinition, ItemDefinition } from '../src/game/content/schema';
import type { ChoiceId, CompanionId, EncounterId, EnemyId, EventId, ItemId } from '../src/game/domain/ids';
import { decodeSaveState, encodeSaveState } from '../src/game/persistence/codec';
import { createCampaign, reduceGame, type GameStateV2 } from '../src/game/state';

const asChoice = (value: string) => value as ChoiceId;
const asCompanion = (value: string) => value as CompanionId;
const asEncounter = (value: string) => value as EncounterId;
const asEnemy = (value: string) => value as EnemyId;
const asEvent = (value: string) => value as EventId;
const asItem = (value: string) => value as ItemId;
const at = (minute: number) => `2026-09-01T00:${String(minute).padStart(2, '0')}:00.000Z`;

function scene(input: Pick<ChronicleEvent, 'id' | 'choices'> & Partial<ChronicleEvent>): ChronicleEvent {
  return {
    chapterId: 'ch01', type: 'journey', family: 'test', illustrationId: `${input.id}-art`, title: String(input.id),
    narrative: ['A small deterministic choice fixture.'], eligibility: {}, cooldownRuns: 0, oneShot: true,
    ...input,
  };
}

function item(id: ItemId, name: string): ItemDefinition {
  return {
    id, name, category: 'potion', description: `${name}.`, allowedClasses: ['warrior', 'mage', 'warden'],
    stats: { health: 3 }, value: 1, tags: ['healing'],
  };
}

function content(): ContentIndex {
  const success = scene({
    id: asEvent('checked-success'),
    choices: [{
      id: asChoice('resolve-success'), label: 'Secure the wagon', detail: 'Brace the axle before the road falls away.',
      check: {
        stat: 'strength', difficulty: 0,
        success: {
          outcome: 'The wagon holds and the hidden cache is yours.',
          effects: [
            { type: 'flag', operation: 'add', flagId: 'wagon-secured' as never },
            { type: 'xp', amount: 60, source: 'story' },
            { type: 'item', operation: 'grant', itemId: asItem('packed-tonic'), quantity: 1, destination: 'pack' },
            { type: 'item', operation: 'grant', itemId: asItem('loose-token'), quantity: 1, destination: 'unbanked-loot' },
          ],
          nextSceneId: asEvent('success-aftermath'),
          continueLabel: 'Take the high road',
        },
        failure: { outcome: 'The braces splinter before the wheel turns.', effects: [{ type: 'flag', operation: 'add', flagId: 'unexpected-success-failure' as never }] },
      },
    }] as never,
  });
  const failure = scene({
    id: asEvent('checked-failure'),
    choices: [{
      id: asChoice('resolve-failure'), label: 'Cross the bog', detail: 'Read the hidden footing under black water.',
      check: {
        stat: 'cunning', difficulty: 99,
        success: { outcome: 'You find a dry line through the reeds.', effects: [{ type: 'flag', operation: 'add', flagId: 'unexpected-bog-success' as never }] },
        failure: {
          outcome: 'Raiders rise from the waterline.', effects: [{ type: 'flag', operation: 'add', flagId: 'bog-ambush' as never }],
          combatEncounterId: asEncounter('bog-raiders'), nextSceneId: asEvent('success-aftermath'), continueLabel: 'Draw your sword',
        },
      },
    }] as never,
  });
  const direct = scene({
    id: asEvent('direct-choice'),
    choices: [{
      id: asChoice('direct'), label: 'Continue onward', detail: 'Keep the caravan moving.',
      outcome: 'The road bends toward Greywatch.', effects: [{ type: 'flag', operation: 'add', flagId: 'direct-kept' as never }],
    }],
  });
  const mixedDestinationHub = scene({
    id: asEvent('mixed-destination-hub'), type: 'hub',
    choices: [{
      id: asChoice('take-both'), label: 'Secure both tonic crates', detail: 'Keep one ready and send one to the camp chest.',
      outcome: 'Both crates are accounted for.',
      effects: [
        { type: 'item', operation: 'grant', itemId: asItem('packed-tonic'), quantity: 1, destination: 'pack' },
        { type: 'item', operation: 'grant', itemId: asItem('packed-tonic'), quantity: 1, destination: 'unbanked-loot' },
      ],
    }] as never,
  });
  const summary = scene({
    id: asEvent('summary-choice'),
    choices: [{
      id: asChoice('summarize'), label: 'Prepare the caravan', detail: 'Record every consequence before setting out.',
      outcome: 'Every ledger is updated before departure.',
      effects: [
        { type: 'gold', scope: 'unbanked', amount: 5 },
        { type: 'vitals', health: -1, resource: 1 },
        { type: 'evidence', operation: 'add', evidenceId: 'field-evidence' },
        { type: 'faction', factionId: 'greywatch' as never, amount: 2 },
        { type: 'companion-loyalty', companionId: asCompanion('mara'), amount: 35 },
        { type: 'companion-quest', companionId: asCompanion('mara'), stage: 3 },
        { type: 'companion-injury', companionId: asCompanion('mara'), injured: true },
        { type: 'companion', companionId: asCompanion('mara'), operation: 'recruit' },
        { type: 'threat', amount: 1 },
        { type: 'tension', amount: -1 },
        { type: 'callback', promise: { targetEventId: asEvent('success-aftermath'), deadline: { chapterId: 'ch01', slot: 2 } } },
      ],
    }] as never,
  });
  const aftermath = scene({ id: asEvent('success-aftermath'), choices: [] });
  const enemy = {
    id: asEnemy('bog-raider'), archetypeId: 'bog-raider', name: 'Bog Raider', rank: 1, level: 1, species: 'human' as const,
    region: 'gloamwood' as const, maxHealth: 12, attack: 1, armor: 0, ward: 0, intentWeights: { strike: 1 as const },
    traits: [], rewardTags: [], description: 'A road raider.', artFamily: 'raider',
  };
  const encounter: EncounterDefinition = {
    id: asEncounter('bog-raiders'), family: 'bog-raiders', kind: 'regular', enemyIds: [enemy.id], reward: { xp: 0, gold: 0, itemChoices: [] },
  };
  return {
    events: new Map([success, failure, direct, mixedDestinationHub, summary, aftermath].map((entry) => [entry.id, entry])),
    items: new Map([
      [asItem('packed-tonic'), item(asItem('packed-tonic'), 'Packed Tonic')],
      [asItem('loose-token'), item(asItem('loose-token'), 'Loose Token')],
    ]),
    enemies: new Map([[enemy.id, enemy]]), encounters: new Map([[encounter.id, encounter]]), companions: new Map([[asCompanion('mara'), {
      id: asCompanion('mara'), name: 'Mara', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [],
      combat: { attack: 1, guard: 1, will: 1, actionId: 'covering-shot' },
    }]]), merchants: new Map(),
    artIds: new Set([success, failure, direct, mixedDestinationHub, summary, aftermath].map((entry) => entry.illustrationId)), audioIds: new Set(),
  };
}

function atScene(eventId: EventId, index: ContentIndex): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', seed: 1, updatedAt: at(0) }, index);
  const started = reduceGame(created, { type: 'start-expedition', updatedAt: at(1) }, index).state;
  return { ...started, expedition: { ...started.expedition!, currentSceneId: eventId, sceneResolution: null, sceneVisitCounts: { [eventId]: 1 } } };
}

describe('narrative choice resolution', () => {
  it('resolves a checked success deterministically and applies its XP and authored item destinations once', () => {
    const index = content();
    const initial = atScene(asEvent('checked-success'), index);
    const command = { type: 'resolve-choice' as const, eventId: asEvent('checked-success'), choiceId: asChoice('resolve-success'), updatedAt: at(2) };

    const first = reduceGame(initial, command, index);
    const replay = reduceGame(atScene(asEvent('checked-success'), index), command, index);

    expect(first.diagnostic).toBeUndefined();
    expect(first.state.expedition?.sceneResolution).toMatchObject({
      eventId: asEvent('checked-success'), choiceId: asChoice('resolve-success'), resultKind: 'success', chance: 95, roll: 77,
      outcome: 'The wagon holds and the hidden cache is yours.', effectSummary: ['+60 XP', '+1 Packed Tonic', '+1 Loose Token'],
      nextSceneId: asEvent('success-aftermath'), continueLabel: 'Take the high road',
    });
    expect(first.state.expedition?.sceneResolution).toEqual(replay.state.expedition?.sceneResolution);
    expect(first.state.campaign.hero.xp).toBe(60);
    expect(first.state.campaign.flags).toContain('wagon-secured');
    expect(first.state.campaign.inventory.pack.map((entry) => entry.itemId)).toEqual([asItem('packed-tonic')]);
    expect(first.state.expedition?.unbankedLoot).toEqual([asItem('loose-token')]);

    const duplicate = reduceGame(first.state, command, index);
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.diagnostic?.code).toBe('choice_resolved');
    expect(duplicate.state.campaign.hero.xp).toBe(60);
  });

  it('acknowledges a combat branch before handoff and clears its setup after battle exit', () => {
    const index = content();
    const result = reduceGame(
      atScene(asEvent('checked-failure'), index),
      { type: 'resolve-choice', eventId: asEvent('checked-failure'), choiceId: asChoice('resolve-failure'), updatedAt: at(2) },
      index,
    );

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.expedition?.sceneResolution).toMatchObject({
      resultKind: 'failure', chance: 15, roll: 48, outcome: 'Raiders rise from the waterline.',
      effectSummary: ['Combat begins'], continueLabel: 'Draw your sword',
    });
    expect(result.state.campaign.flags).toContain('bog-ambush');
    expect(result.state.campaign.flags).not.toContain('unexpected-bog-success');
    expect(result.state.flow.screen).toBe('story');
    expect(result.state.expedition?.currentCombat).toEqual({ encounterId: asEncounter('bog-raiders'), combat: null });

    const encoded = encodeSaveState(result.state, index);
    const decoded = encoded ? decodeSaveState(encoded, index) : null;
    expect(decoded?.flow.screen).toBe('story');
    expect(decoded?.expedition?.currentCombat).toEqual({ encounterId: asEncounter('bog-raiders'), combat: null });

    const handedOff = reduceGame(result.state, { type: 'select-next-scene', updatedAt: at(3) }, index);
    expect(handedOff.state.flow.screen).toBe('combat');
    expect(handedOff.state.expedition?.currentCombat?.combat?.outcome).toBe('active');

    const activeCombat = handedOff.state.expedition!.currentCombat!.combat!;
    const fleeing = {
      ...handedOff.state,
      expedition: {
        ...handedOff.state.expedition!,
        currentCombat: { ...handedOff.state.expedition!.currentCombat!, combat: { ...activeCombat, player: { ...activeCombat.player, cunning: 99 } } },
      },
    };
    const fled = reduceGame(fleeing, { type: 'combat-turn', commandId: 'flee-from-setup', action: { type: 'flee' }, updatedAt: at(4) }, index);
    expect(fled.state.flow.screen).toBe('story');
    expect(fled.state.expedition?.currentCombat).toBeNull();
    expect(fled.state.expedition?.currentSceneId).toBeNull();
    expect(fled.state.expedition?.sceneResolution).toBeNull();
    expect(fled.state.expedition?.authoredSceneQueue).toEqual([]);

    const rewarded = {
      ...handedOff.state,
      expedition: {
        ...handedOff.state.expedition!,
        currentCombat: { ...handedOff.state.expedition!.currentCombat!, combat: { ...activeCombat, outcome: 'victory' as const } },
        pendingReward: { rewardId: 'bog-raider-reward', rewardOfferId: 'reward:1:bog-raider-reward', encounterId: asEncounter('bog-raiders'), itemChoices: [], baseGold: 0, grantedXp: 0, adEligible: false, rewardedGoldSettlement: 'ineligible' as const },
      },
      flow: { ...handedOff.state.flow, screen: 'reward' as const },
    };
    const claimed = reduceGame(rewarded, { type: 'claim-rewards', rewardId: 'bog-raider-reward', itemId: null, updatedAt: at(5) }, index);
    expect(claimed.state.flow.screen).toBe('story');
    expect(claimed.state.expedition?.currentCombat).toBeNull();
    expect(claimed.state.expedition?.currentSceneId).toBeNull();
    expect(claimed.state.expedition?.sceneResolution).toBeNull();
    expect(claimed.state.expedition?.authoredSceneQueue.map((entry) => entry.sceneId)).toEqual([asEvent('success-aftermath')]);
  });

  it('records direct choices as non-random resolutions', () => {
    const index = content();
    const result = reduceGame(
      atScene(asEvent('direct-choice'), index),
      { type: 'resolve-choice', eventId: asEvent('direct-choice'), choiceId: asChoice('direct'), updatedAt: at(2) },
      index,
    );

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.expedition?.sceneResolution).toMatchObject({
      resultKind: 'direct', chance: null, roll: null, outcome: 'The road bends toward Greywatch.',
      effectSummary: [], nextSceneId: null, continueLabel: null,
    });
  });

  it('keeps separately authored pack and unbanked copies through banking', () => {
    const index = content();
    const resolved = reduceGame(
      atScene(asEvent('mixed-destination-hub'), index),
      { type: 'resolve-choice', eventId: asEvent('mixed-destination-hub'), choiceId: asChoice('take-both'), updatedAt: at(2) },
      index,
    ).state;

    expect(resolved.campaign.inventory.pack).toEqual([{ id: 'pack-stack-packed-tonic', itemId: asItem('packed-tonic'), quantity: 1 }]);
    expect(resolved.campaign.inventory.stash).toEqual([{ id: 'stash-stack-packed-tonic', itemId: asItem('packed-tonic'), quantity: 1 }]);
    expect(resolved.expedition?.unbankedLoot).toEqual([asItem('packed-tonic')]);

    const banked = reduceGame(resolved, { type: 'bank-camp', updatedAt: at(3) }, index);

    expect(banked.diagnostic).toBeUndefined();
    expect(banked.state.campaign.inventory.pack).toEqual(resolved.campaign.inventory.pack);
    expect(banked.state.campaign.inventory.stash).toEqual(resolved.campaign.inventory.stash);
  });

  it('round-trips a rich checked resolution through save encoding', () => {
    const index = content();
    const resolved = reduceGame(
      atScene(asEvent('checked-success'), index),
      { type: 'resolve-choice', eventId: asEvent('checked-success'), choiceId: asChoice('resolve-success'), updatedAt: at(2) },
      index,
    ).state;

    const encoded = encodeSaveState(resolved, index);
    const decoded = encoded ? decodeSaveState(encoded, index) : null;

    expect(encoded).not.toBeNull();
    expect(decoded?.expedition?.sceneResolution).toEqual(resolved.expedition?.sceneResolution);
  });

  it('summarizes every noncombat atomic effect in concise English', () => {
    const index = content();
    const result = reduceGame(
      atScene(asEvent('summary-choice'), index),
      { type: 'resolve-choice', eventId: asEvent('summary-choice'), choiceId: asChoice('summarize'), updatedAt: at(2) },
      index,
    );

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.expedition?.sceneResolution?.effectSummary).toEqual([
      '+5 Gold', '-1 Health', '+1 Focus', 'Evidence secured', 'Greywatch reputation +2',
      'Mara loyalty +35', 'Mara quest progress updated', 'Mara injured', 'Mara joined', 'Threat +1', 'Tension -1',
    ]);
  });
});
