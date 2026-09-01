import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex, EncounterDefinition } from '../src/game/content/schema';
import type { ChoiceId, CompanionId, EncounterId, EnemyId, EventId, ItemId } from '../src/game/domain/ids';
import { createCheckRoll } from '../src/game/checks';
import { checksumFor } from '../src/game/persistence/checksum';
import { decodeSaveState, encodeSaveState } from '../src/game/persistence/codec';
import { createSaveRepository, saveActiveKey } from '../src/game/persistence/repository';
import { createCampaign, reduceGame } from '../src/game/state';

const asChoice = (value: string) => value as ChoiceId;
const asCompanion = (value: string) => value as CompanionId;
const asEncounter = (value: string) => value as EncounterId;
const asEnemy = (value: string) => value as EnemyId;
const asEvent = (value: string) => value as EventId;
const asItem = (value: string) => value as ItemId;
const at = (minute: number) => `2026-09-01T02:${String(minute).padStart(2, '0')}:00.000Z`;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function event(input: Partial<ChronicleEvent> & Pick<ChronicleEvent, 'id' | 'choices'>): ChronicleEvent {
  return {
    chapterId: 'ch01', slot: 1, type: 'journey', family: String(input.id), illustrationId: `${input.id}-art`,
    title: String(input.id), narrative: ['A migration fixture.'], eligibility: {}, cooldownRuns: 0, oneShot: false,
    ...input,
  };
}

function fixtureContent(): ContentIndex {
  const rewardItem = {
    id: asItem('migration-tonic'), name: 'Migration Tonic', category: 'potion' as const,
    description: 'A tonic carried across versions.', allowedClasses: ['warrior' as const], stats: { health: 1 }, value: 4, tags: ['healing'],
  };
  const weapon = { ...rewardItem, id: asItem('migration-blade'), name: 'Migration Blade', category: 'weapon' as const, stats: { attack: 1 } };
  const armor = { ...rewardItem, id: asItem('migration-mail'), name: 'Migration Mail', category: 'armor' as const, stats: { armor: 1 } };
  const charm = { ...rewardItem, id: asItem('migration-charm'), name: 'Migration Charm', category: 'charm' as const, stats: { will: 1 } };
  const aftermath = event({ id: asEvent('migration-aftermath'), slot: 2, choices: [] });
  const direct = event({
    id: asEvent('migration-direct'),
    choices: [{
      id: asChoice('take-payment'), label: 'Take payment', detail: 'Accept the old reward.',
      outcome: 'The payment is already in your purse.', effects: [{ type: 'gold', scope: 'unbanked', amount: 7 }],
      nextSceneId: aftermath.id,
    }],
  });
  const checked = event({
    id: asEvent('migration-checked'),
    choices: [{
      id: asChoice('test-the-lock'), label: 'Test the lock', detail: 'Work the old mechanism.',
      check: {
        stat: 'cunning', difficulty: 4,
        success: { outcome: 'The old lock yields.', effects: [{ type: 'flag', operation: 'add', flagId: 'lock-opened' as never }] },
        failure: { outcome: 'The lock holds.', effects: [{ type: 'flag', operation: 'add', flagId: 'lock-held' as never }] },
      },
    }],
  });
  const fight = event({
    id: asEvent('migration-fight'), type: 'combat',
    choices: [{
      id: asChoice('fight'), label: 'Fight', detail: 'Defend the save.', outcome: 'The raider attacks.',
      effects: [{ type: 'combat', encounterId: asEncounter('migration-encounter') }],
    }],
  });
  const enemy = {
    id: asEnemy('migration-raider'), archetypeId: 'migration-raider', name: 'Migration Raider', rank: 1, level: 1,
    species: 'human' as const, region: 'gloamwood' as const, maxHealth: 1, attack: 0, armor: 0, ward: 0,
    intentWeights: { strike: 1 as const }, traits: [], rewardTags: [], description: 'A fragile fixture.', artFamily: 'raider',
  };
  const encounter: EncounterDefinition = {
    id: asEncounter('migration-encounter'), family: 'migration', kind: 'regular', enemyIds: [enemy.id],
    reward: { xp: 19, gold: 11, itemChoices: [rewardItem.id] },
  };
  const companion = {
    id: asCompanion('migration-companion'), name: 'Mara', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [],
    combat: { attack: 1, guard: 1, will: 1, actionId: 'migration-cover' },
  };
  const events = [direct, checked, fight, aftermath];
  return {
    events: new Map(events.map((entry) => [entry.id, entry])),
    items: new Map([rewardItem, weapon, armor, charm].map((entry) => [entry.id, entry])),
    enemies: new Map([[enemy.id, enemy]]), encounters: new Map([[encounter.id, encounter]]),
    companions: new Map([[companion.id, companion]]), merchants: new Map(),
    artIds: new Set(events.map((entry) => entry.illustrationId)), audioIds: new Set(),
  };
}

function preparedExpedition(content: ContentIndex) {
  const created = createCampaign({ heroClass: 'warrior', name: 'Mira', seed: 41, updatedAt: at(0) }, content);
  const prepared = {
    ...created,
    campaign: {
      ...created.campaign,
      hero: { ...created.campaign.hero, level: 2, xp: 51 },
      inventory: {
        pack: [{ id: 'migration-pack', itemId: asItem('migration-tonic'), quantity: 2 }],
        stash: [], questItems: [],
        equipment: { weapon: asItem('migration-blade'), armor: asItem('migration-mail'), charms: [asItem('migration-charm')] },
      },
      bankedGold: 37, flags: ['old-flag'], evidence: ['old-evidence'],
      companions: {
        activeCompanionId: asCompanion('migration-companion'),
        records: [{ companionId: asCompanion('migration-companion'), status: 'recruited' as const, questStage: 2 as const, loyalty: 44, injured: true }],
      },
    },
  };
  return reduceGame(prepared, { type: 'start-expedition', updatedAt: at(1) }, content).state;
}

function atScene(sceneId: EventId, content: ContentIndex) {
  const started = preparedExpedition(content);
  return {
    ...started,
    expedition: {
      ...started.expedition!, currentSceneId: sceneId, sceneResolution: null,
      sceneVisitCounts: { [sceneId]: 1 },
      director: { ...started.expedition!.director, usedSceneIds: [sceneId], seenEventIds: [sceneId] },
      position: { chapterId: 'ch01' as const, slot: 2 },
    },
  };
}

function asV2Dto(encoded: NonNullable<ReturnType<typeof encodeSaveState>>) {
  const value = structuredClone(encoded) as any;
  value.schemaVersion = 2;
  if (value.expedition) {
    delete value.expedition.sceneVisitCounts;
    delete value.expedition.checkedAttempts;
  }
  return value;
}

function signedV2(slot: 1 | 2 | 3, state: unknown, savedAt = at(9)) {
  const unsigned = { schemaVersion: 2, slot, savedAt, state };
  return JSON.stringify({ ...unsigned, checksum: checksumFor(unsigned) });
}

describe('schema-v2 living encounter migration', () => {
  it('preserves campaign, expedition, combat, and pending reward progress in schema v3', () => {
    const content = fixtureContent();
    const staged = atScene(asEvent('migration-fight'), content);
    const fighting = reduceGame(staged, { type: 'resolve-choice', eventId: asEvent('migration-fight'), choiceId: asChoice('fight'), updatedAt: at(2) }, content).state;
    const won = reduceGame(fighting, { type: 'combat-turn', commandId: 'migration-win', action: { type: 'attack' }, updatedAt: at(3) }, content).state;
    const encoded = encodeSaveState(won, content);
    if (!encoded) throw new Error('Expected a valid v2 fixture.');

    const v2 = asV2Dto(encoded);
    delete v2.expedition.authoredSceneQueue;
    const migrated = decodeSaveState(v2, content);

    expect(migrated).not.toBeNull();
    expect(migrated).toMatchObject({
      schemaVersion: 3,
      campaign: {
        heroName: 'Mira', chapterId: 'ch01', hero: { level: 2, xp: 70 }, bankedGold: 37,
        flags: ['old-flag'], evidence: ['old-evidence'],
        inventory: { pack: [{ itemId: 'migration-tonic', quantity: 2 }], equipment: { weapon: 'migration-blade', armor: 'migration-mail', charms: ['migration-charm'] } },
        companions: { activeCompanionId: 'migration-companion', records: [{ status: 'recruited', questStage: 2, loyalty: 44, injured: true }] },
      },
      expedition: {
        position: { chapterId: 'ch01', slot: 2 }, currentSceneId: 'migration-fight', unbankedGold: 11,
        currentCombat: { encounterId: 'migration-encounter', combat: { outcome: 'victory' } },
        pendingReward: { encounterId: 'migration-encounter', baseGold: 11, grantedXp: 19, itemChoices: ['migration-tonic'] },
        authoredSceneQueue: [], sceneVisitCounts: { 'migration-fight': 1 }, checkedAttempts: [],
      },
      flow: { screen: 'reward' },
    });
  });

  it('migrates a rich checked resolution into the strict resolution and immutable attempt ledger', () => {
    const content = fixtureContent();
    const resolved = reduceGame(
      atScene(asEvent('migration-checked'), content),
      { type: 'resolve-choice', eventId: asEvent('migration-checked'), choiceId: asChoice('test-the-lock'), updatedAt: at(2) },
      content,
    ).state;
    const encoded = encodeSaveState(resolved, content);
    if (!encoded) throw new Error('Expected a valid checked fixture.');

    const migrated = decodeSaveState(asV2Dto(encoded), content);

    expect(migrated?.expedition?.sceneResolution).toEqual(resolved.expedition?.sceneResolution);
    expect(migrated?.expedition?.checkedAttempts).toEqual([{
      eventId: 'migration-checked', choiceId: 'test-the-lock', visitOrdinal: 1,
      chance: resolved.expedition?.sceneResolution?.chance,
      roll: resolved.expedition?.sceneResolution?.roll,
      resultKind: resolved.expedition?.sceneResolution?.resultKind,
    }]);
    expect(migrated?.expedition?.sceneVisitCounts).toEqual({ 'migration-checked': 1 });
    const reloadedWithoutPresentationReceipt = {
      ...migrated!, expedition: { ...migrated!.expedition!, sceneResolution: null },
    };
    const replay = reduceGame(reloadedWithoutPresentationReceipt, {
      type: 'resolve-choice', eventId: asEvent('migration-checked'), choiceId: asChoice('test-the-lock'), updatedAt: at(4),
    }, content);
    expect(replay.diagnostic?.code).toBe('choice_resolved');
    expect(replay.state.expedition?.checkedAttempts).toHaveLength(1);
  });

  it('increments scene visits on selection and seeds later checks from the visit ordinal', () => {
    const base = fixtureContent();
    const checked = { ...base.events.get(asEvent('migration-checked'))!, slot: undefined };
    const content = { ...base, events: new Map([[checked.id, checked]]) };
    const started = reduceGame(
      createCampaign({ heroClass: 'warrior', seed: 41, updatedAt: at(0) }, content),
      { type: 'start-expedition', updatedAt: at(1) },
      content,
    ).state;
    const firstScene = reduceGame(started, { type: 'select-next-scene', updatedAt: at(2) }, content).state;
    const first = reduceGame(firstScene, {
      type: 'resolve-choice', eventId: checked.id, choiceId: asChoice('test-the-lock'), updatedAt: at(3),
    }, content).state;
    const readyToRevisit = {
      ...first,
      expedition: {
        ...first.expedition!, currentSceneId: null, sceneResolution: null,
        director: { ...first.expedition!.director, usedSceneIds: [] },
      },
    };
    const secondScene = reduceGame(readyToRevisit, { type: 'select-next-scene', updatedAt: at(4) }, content).state;
    const second = reduceGame(secondScene, {
      type: 'resolve-choice', eventId: checked.id, choiceId: asChoice('test-the-lock'), updatedAt: at(5),
    }, content).state;

    expect(firstScene.expedition?.sceneVisitCounts).toEqual({ 'migration-checked': 1 });
    expect(secondScene.expedition?.sceneVisitCounts).toEqual({ 'migration-checked': 2 });
    expect(second.expedition?.checkedAttempts.map((attempt) => attempt.visitOrdinal)).toEqual([1, 2]);
    expect(second.expedition?.sceneResolution?.roll).toBe(createCheckRoll(41, checked.id, 2, asChoice('test-the-lock')));
  });

  it('expands compact resolutions without replaying their already-applied rewards', () => {
    const content = fixtureContent();
    const command = { type: 'resolve-choice' as const, eventId: asEvent('migration-direct'), choiceId: asChoice('take-payment'), updatedAt: at(2) };
    const resolved = reduceGame(atScene(asEvent('migration-direct'), content), command, content).state;
    const encoded = encodeSaveState(resolved, content);
    if (!encoded?.expedition) throw new Error('Expected a valid direct fixture.');
    const v2 = asV2Dto(encoded);
    v2.expedition.sceneResolution = { eventId: 'migration-direct', choiceId: 'take-payment' };

    const migrated = decodeSaveState(v2, content)!;
    const replay = reduceGame(migrated, command, content);

    expect(migrated.expedition?.sceneResolution).toMatchObject({
      resultKind: 'direct', chance: null, roll: null, outcome: 'The payment is already in your purse.',
      nextSceneId: 'migration-aftermath', continueLabel: null,
    });
    expect(replay.diagnostic?.code).toBe('choice_resolved');
    expect(replay.state.expedition?.unbankedGold).toBe(7);
  });

  it('drops only invalid queued targets and surfaces a recoverable repository notice', () => {
    const content = fixtureContent();
    const resolved = reduceGame(
      atScene(asEvent('migration-direct'), content),
      { type: 'resolve-choice', eventId: asEvent('migration-direct'), choiceId: asChoice('take-payment'), updatedAt: at(2) },
      content,
    ).state;
    const encoded = encodeSaveState(resolved, content);
    if (!encoded?.expedition) throw new Error('Expected a valid queued fixture.');
    const v2 = asV2Dto(encoded);
    v2.expedition.authoredSceneQueue = [
      { sceneId: 'missing-aftermath', sourceSceneId: 'migration-direct', requirementMode: 'required' },
      { sceneId: 'migration-aftermath', sourceSceneId: 'migration-direct', requirementMode: 'optional' },
    ];
    const storage = new MemoryStorage();
    storage.setItem(saveActiveKey(1), signedV2(1, v2));
    const repository = createSaveRepository(storage, () => at(9), content);

    const loaded = repository.loadSlot(1);

    expect(loaded).toMatchObject({
      ok: true, source: 'migrated', notice: expect.stringMatching(/removed 1 unavailable authored scene/i),
      state: { expedition: { authoredSceneQueue: [{ sceneId: 'migration-aftermath' }] } },
    });
    expect(JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}').schemaVersion).toBe(3);
  });
});
