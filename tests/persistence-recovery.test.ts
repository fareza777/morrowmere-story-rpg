import { describe, expect, it, vi } from 'vitest';
import { createCampaign } from '../src/game/state';
import { createCombat, createEncounter } from '../src/game/combat';
import { initialDirector } from '../src/game/state/create';
import { encodeSaveState } from '../src/game/persistence/codec';
import { resolveCombatTurn } from '../src/game/combat/resolve';
import { merchantRestockSeed } from '../src/game/merchant';
import { canonicalJson, checksumFor } from '../src/game/persistence/checksum';
import { createSaveRepository, saveActiveKey, saveBackupKey } from '../src/game/persistence/repository';
import { subscribeToAppBackground, type BrowserLifecycleDriver } from '../src/native/lifecycle';
import type { ContentIndex } from '../src/game/content/schema';
import { makeContentIndex } from './fixtures/game';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
  keys() { return [...this.values.keys()]; }
}

const content = makeContentIndex();
const state = () => createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, content);

function makeCatalogContent(): ContentIndex {
  const base = makeContentIndex();
  const events = new Map(base.events);
  const fixture = events.get('fixture-event' as never)!;
  events.set('callback-event' as never, { ...fixture, id: 'callback-event' as never, family: 'callback' });
  events.set('other-chapter-event' as never, { ...fixture, id: 'other-chapter-event' as never, chapterId: 'ch02' as never, family: 'elsewhere' });
  events.set('hub-event' as never, { ...fixture, id: 'hub-event' as never, type: 'hub', family: 'hub', merchantId: 'merchant-1' as never, merchantRestockKey: 'merchant-restock' });
  const item = (id: string, category: string) => ({ id, name: id, category, description: id, allowedClasses: ['mage'], stats: {}, value: 1, tags: [] });
  const items = new Map(base.items);
  items.set('potion-1' as never, item('potion-1', 'potion') as never);
  items.set('scroll-1' as never, item('scroll-1', 'scroll') as never);
  items.set('quest-1' as never, item('quest-1', 'quest') as never);
  items.set('weapon-1' as never, item('weapon-1', 'weapon') as never);
  items.set('armor-1' as never, item('armor-1', 'armor') as never);
  items.set('charm-1' as never, item('charm-1', 'charm') as never);
  const enemies = new Map(base.enemies);
  enemies.set('enemy-1' as never, { id: 'enemy-1', archetypeId: 'goblin', name: 'Goblin', rank: 1, level: 1, species: 'goblin', region: 'gloamwood', maxHealth: 10, attack: 2, armor: 0, ward: 0, intentWeights: { strike: 1 }, traits: [], rewardTags: [], description: 'A foe.', artFamily: 'goblin' } as never);
  const encounters = new Map(base.encounters);
  encounters.set('encounter-1' as never, { id: 'encounter-1' as never, enemyIds: ['enemy-1' as never] });
  const companions = new Map(base.companions);
  companions.set('companion-1' as never, { id: 'companion-1' as never, name: 'Scout', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [], combat: { attack: 2, guard: 1, will: 1, actionId: 'scout-shot' } });
  const merchants = new Map(base.merchants);
  merchants.set('merchant-1' as never, { id: 'merchant-1' as never, name: 'Trader', stockItemIds: ['potion-1' as never] });
  return { ...base, events, items, enemies, encounters, companions, merchants };
}

function catalogState() {
  const localContent = makeCatalogContent();
  const base = createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, localContent);
  const campaign = {
    ...base.campaign,
    inventory: {
      pack: [{ id: 'pack-potion', itemId: 'potion-1' as never, quantity: 2 }],
      stash: [{ id: 'stash-scroll', itemId: 'scroll-1' as never, quantity: 1 }],
      questItems: ['quest-1' as never],
      equipment: { weapon: 'weapon-1' as never, armor: 'armor-1' as never, charms: ['charm-1' as never] },
    },
  };
  return {
    content: localContent,
    value: {
      ...base,
      profile: { ...base.profile, discoveries: { events: ['fixture-event' as never], enemies: ['enemy-1'], codex: [] } },
      campaign,
      expedition: {
        routeProfile: 'kings-road' as const, routeSeed: 7,
        director: { ...initialDirector(7), usedSceneIds: ['hub-event' as never], seenEventIds: ['fixture-event' as never], pendingCallbacks: [{ targetEventId: 'callback-event' as never, deadline: { chapterId: 'ch01' as const, slot: 2 }, status: 'pending' as const, required: true }] },
        position: { chapterId: 'ch01' as const, slot: 1 }, currentSceneId: 'hub-event' as never, currentCombat: null, pendingRewards: [], unbankedGold: 3, unbankedLoot: ['scroll-1' as never], temporaryBoons: [],
        merchantVisits: [{ merchantId: 'merchant-1' as never, restockKey: '7:merchant-1:merchant-restock', restockSeed: 7, generatedAtLevel: 1, stock: [{ id: 'merchant-1:7:merchant-1:merchant-restock:0:potion-1', itemId: 'potion-1' as never }] }],
      },
      flow: { screen: 'merchant' as const, overlay: null, merchant: { merchantId: 'merchant-1' as never, restockKey: '7:merchant-1:merchant-restock', returnScreen: 'story' as const } },
    },
  };
}

function signed(raw: Record<string, unknown>): string {
  const { checksum: _checksum, ...unsigned } = raw;
  return JSON.stringify({ ...unsigned, checksum: checksumFor(unsigned) });
}

describe('V2 save recovery', () => {
  it('isolates all three slots and returns an English summary', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    const one = state();
    const second = state();
    const two = {
      ...second,
      campaign: { ...second.campaign, heroName: 'Briar' },
      checkpoints: {
        ...second.checkpoints,
        chapter: { ...second.checkpoints.chapter, campaign: { ...second.checkpoints.chapter.campaign, heroName: 'Briar' } },
        camp: second.checkpoints.camp === null ? null : { ...second.checkpoints.camp, campaign: { ...second.checkpoints.camp.campaign, heroName: 'Briar' } },
      },
    };

    expect(repo.saveSlot(1, one)).toEqual({ ok: true });
    expect(repo.saveSlot(2, two)).toEqual({ ok: true });
    expect(repo.loadSlot(1)).toMatchObject({ ok: true, source: 'active', summary: { title: 'Chronicle I — The Black Banner', heroName: 'Aster', heroClass: 'Mage', level: 1, chapter: 'Chapter 1' } });
    expect(repo.loadSlot(2)).toMatchObject({ ok: true, source: 'active', summary: { heroName: 'Briar' } });
    expect(repo.loadSlot(3)).toEqual({ ok: false, reason: 'empty' });
  });

  it('uses recursively sorted canonical JSON for checksums', () => {
    expect(canonicalJson({ z: [{ b: 2, a: 1 }], a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"z":[{"a":1,"b":2}]}');
    expect(checksumFor({ b: 2, a: 1 })).toBe(checksumFor({ a: 1, b: 2 }));
  });

  it('keeps the previous valid active save as backup only on the second save', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    const first = state();
    const second = { ...first, updatedAt: '2026-08-31T00:01:00.000Z' };
    repo.saveSlot(1, first);
    expect(storage.getItem(saveBackupKey(1))).toBeNull();
    repo.saveSlot(1, second);
    expect(JSON.parse(storage.getItem(saveBackupKey(1)) ?? '{}').state.updatedAt).toBe(first.updatedAt);
  });

  it('does not overwrite active data when the backup write fails', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    const current = storage.getItem(saveActiveKey(1));
    const original = storage.setItem.bind(storage);
    storage.setItem = (key, value) => { if (key === saveBackupKey(1)) throw new Error('full'); original(key, value); };

    expect(repo.saveSlot(1, { ...state(), updatedAt: 'later' })).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(current);
  });

  it('archives corrupt active data and promotes a valid backup', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    repo.saveSlot(1, { ...state(), updatedAt: 'later' });
    storage.setItem(saveActiveKey(1), '{bad');

    const loaded = repo.loadSlot(1);

    expect(loaded).toMatchObject({ ok: true, source: 'backup' });
    expect(storage.getItem(saveActiveKey(1))).toBe(storage.getItem(saveBackupKey(1)));
    expect(storage.keys().filter((key) => key.includes(':recovery:'))).toHaveLength(1);
  });

  it('keeps a valid active save when its backup is corrupt and archives both invalid raws uniquely', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    storage.setItem(saveBackupKey(1), '{bad-backup');
    expect(repo.loadSlot(1)).toMatchObject({ ok: true, source: 'active' });
    storage.setItem(saveActiveKey(1), '{bad-active');
    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.keys().filter((key) => key.includes(':recovery:')).length).toBe(3);
  });

  it('rejects a checksum-tampered envelope without treating it as a save', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    const tampered = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    tampered.state.campaign.bankedGold = 999;
    storage.setItem(saveActiveKey(1), JSON.stringify(tampered));

    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
  });

  it('exports only valid envelopes and validates import before writing', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    const exported = repo.exportSlot(1);
    expect(exported).not.toBeNull();
    const before = storage.getItem(saveActiveKey(2));
    expect(repo.importSlot(2, '{bad')).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBe(before);
    expect(repo.importSlot(2, exported!)).toMatchObject({ ok: true, source: 'active' });
    expect(repo.loadSlot(2)).toMatchObject({ ok: true, state: { campaign: { heroName: 'Aster' } } });
  });

  it('stores a validated canonical global profile', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    const profile = state().profile;
    expect(repo.saveProfile(profile)).toEqual({ ok: true });
    expect(repo.loadProfile()).toEqual({ ok: true, profile });
    storage.setItem('morrowmere:profile:v2', '{bad');
    expect(repo.loadProfile()).toMatchObject({ ok: false, reason: 'corrupt' });
  });

  it.each([
    ['unknown root key', (envelope: any) => { envelope.state.unknown = true; }],
    ['unknown nested profile key', (envelope: any) => { envelope.state.profile.settings.unknown = true; }],
    ['empty flow', (envelope: any) => { envelope.state.flow = {}; }],
    ['malformed expedition', (envelope: any) => { envelope.state.expedition = {}; }],
    ['malformed companion record', (envelope: any) => { envelope.state.campaign.companions = { activeCompanionId: null, records: [{ companionId: 'c', status: 'unknown', questStage: 0, loyalty: 0, injured: false, extra: true }] }; }],
    ['malformed director memory', (envelope: any) => { envelope.state.campaign.directorMemory = { rngState: 1, seenEventIds: [], familyCooldowns: {}, pendingCallbacks: [], extra: true }; }],
    ['malformed checkpoint payload', (envelope: any) => { envelope.state.checkpoints.chapter.campaign = {}; }],
    ['NaN-like numeric encoding', (envelope: any) => { envelope.state.campaign.bankedGold = null; }],
  ])('rejects a checksum-valid envelope with %s', (_label, mutate) => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    const envelope = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    mutate(envelope);
    storage.setItem(saveActiveKey(1), signed(envelope));

    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
  });

  it('does not write malformed but checksum-valid imports or malformed profiles', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(1, state());
    const before = storage.getItem(saveActiveKey(2));
    const envelope = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    envelope.state.flow = {};

    expect(repo.importSlot(2, signed(envelope))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBe(before);
    expect(repo.saveProfile({ ...state().profile, discoveries: { ...state().profile.discoveries, extra: [] } } as never)).toMatchObject({ ok: false });
    expect(storage.getItem('morrowmere:profile:v2')).toBeNull();
  });

  it('rejects a Map-backed runtime record without writing', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    expect(repo.saveSlot(1, state())).toEqual({ ok: true });
    const before = storage.getItem(saveActiveKey(1));
    const malformed = { ...state(), campaign: { ...state().campaign, factions: new Map([['abbey', 3]]) } };

    expect(() => repo.saveSlot(1, malformed as never)).not.toThrow();
    expect(repo.saveSlot(1, malformed as never)).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(before);
  });

  it.each([
    ['a Set', () => new Set([['abbey', 3]])],
    ['a Date', () => new Date('2026-08-31T00:00:00.000Z')],
    ['a class instance', () => new (class RuntimeFactions { readonly abbey = 3; })()],
    ['a symbol value', () => ({ abbey: Symbol('abbey') })],
    ['a function value', () => ({ abbey: () => 3 })],
    ['a BigInt value', () => ({ abbey: BigInt(3) })],
    ['a cycle', () => { const value: Record<string, unknown> = {}; value.self = value; return value; }],
  ])('rejects a runtime factions record containing %s without writing or throwing', (_label, makeMalformed) => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    expect(repo.saveSlot(1, state())).toEqual({ ok: true });
    const before = storage.getItem(saveActiveKey(1));
    const malformed = { ...state(), campaign: { ...state().campaign, factions: makeMalformed() } };

    expect(() => repo.saveSlot(1, malformed as never)).not.toThrow();
    expect(repo.saveSlot(1, malformed as never)).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(before);
  });

  it('rejects a checksum-valid import with a ghost catalog item before writing', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    expect(repo.saveSlot(1, state())).toEqual({ ok: true });
    const forged = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    forged.state.campaign.inventory.pack = [{ id: 'ghost-entry', itemId: 'ghost-item', quantity: 1 }];
    const before = storage.getItem(saveActiveKey(2));

    expect(repo.importSlot(2, signed(forged))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBe(before);
  });

  it('round-trips a state whose persisted IDs all resolve through content', () => {
    const { content: localContent, value } = catalogState();
    const repo = createSaveRepository(new MemoryStorage(), () => '2026-08-31T00:00:00.000Z', localContent);

    expect(repo.saveSlot(1, value)).toEqual({ ok: true });
    expect(repo.loadSlot(1)).toMatchObject({ ok: true, state: {
      campaign: { inventory: { pack: [{ itemId: 'potion-1' }], equipment: { weapon: 'weapon-1', armor: 'armor-1', charms: ['charm-1'] } } },
      expedition: { currentSceneId: 'hub-event', merchantVisits: [{ merchantId: 'merchant-1', stock: [{ itemId: 'potion-1' }] }] },
      flow: { merchant: { merchantId: 'merchant-1' } },
    } });
    expect(repo.saveProfile(value.profile)).toEqual({ ok: true });
    expect(repo.loadProfile()).toEqual({ ok: true, profile: value.profile });
  });

  it.each([
    ['profile event discovery', (envelope: any) => { envelope.state.profile.discoveries.events[0] = 'ghost-event'; }],
    ['profile enemy discovery', (envelope: any) => { envelope.state.profile.discoveries.enemies[0] = 'ghost-enemy'; }],
    ['pack item', (envelope: any) => { envelope.state.campaign.inventory.pack[0].itemId = 'ghost-item'; }],
    ['stash item', (envelope: any) => { envelope.state.campaign.inventory.stash[0].itemId = 'ghost-item'; }],
    ['quest item', (envelope: any) => { envelope.state.campaign.inventory.questItems[0] = 'ghost-item'; }],
    ['equipment item', (envelope: any) => { envelope.state.campaign.inventory.equipment.weapon = 'ghost-item'; }],
    ['current scene', (envelope: any) => { envelope.state.expedition.currentSceneId = 'ghost-event'; }],
    ['encounter', (envelope: any) => { envelope.state.expedition.currentCombat = { encounterId: 'ghost-encounter', combat: null }; }],
    ['pending reward', (envelope: any) => { envelope.state.expedition.pendingRewards[0] = 'ghost-item'; }],
    ['unbanked loot', (envelope: any) => { envelope.state.expedition.unbankedLoot[0] = 'ghost-item'; }],
    ['companion record', (envelope: any) => { envelope.state.campaign.companions.records[0].companionId = 'ghost-companion'; }],
    ['active companion', (envelope: any) => { envelope.state.campaign.companions.activeCompanionId = 'ghost-companion'; }],
    ['director used scene', (envelope: any) => { envelope.state.expedition.director.usedSceneIds[0] = 'ghost-event'; }],
    ['director seen scene', (envelope: any) => { envelope.state.expedition.director.seenEventIds[0] = 'ghost-event'; }],
    ['director callback target', (envelope: any) => { envelope.state.expedition.director.pendingCallbacks[0].targetEventId = 'ghost-event'; }],
    ['merchant identity', (envelope: any) => { envelope.state.expedition.merchantVisits[0].merchantId = 'ghost-merchant'; }],
    ['merchant stock catalog membership', (envelope: any) => { envelope.state.expedition.merchantVisits[0].stock[0].itemId = 'scroll-1'; }],
    ['flow merchant', (envelope: any) => { envelope.state.flow.merchant.merchantId = 'ghost-merchant'; }],
  ])('rejects a checksum-valid import with a ghost %s before writing', (_label, mutate) => {
    const { content: localContent, value } = catalogState();
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    expect(repo.saveSlot(1, value)).toEqual({ ok: true });
    const envelope = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    mutate(envelope);

    expect(repo.importSlot(2, signed(envelope))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBeNull();
  });

  it.each([
    ['a pack above its capacity', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, inventory: { ...candidate.campaign.inventory, pack: Array.from({ length: 25 }, (_, index) => ({ id: `pack-${index}`, itemId: 'potion-1', quantity: 1 })) } } })],
    ['a duplicate entry ID across pack and stash', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, inventory: { ...candidate.campaign.inventory, stash: [...candidate.campaign.inventory.stash, { ...candidate.campaign.inventory.pack[0] }] } } })],
    ['more than two equipped charms', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, inventory: { ...candidate.campaign.inventory, equipment: { ...candidate.campaign.inventory.equipment, charms: ['charm-1', 'charm-1', 'charm-1'] } } } })],
    ['an equipment ID with the wrong category', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, inventory: { ...candidate.campaign.inventory, equipment: { ...candidate.campaign.inventory.equipment, weapon: 'potion-1' } } } })],
    ['an unknown talent at a valid talent level', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, hero: { ...candidate.campaign.hero, level: 3, talents: ['ghost-talent'] } } })],
    ['director threat above its bounded range', (candidate: any) => ({ ...candidate, expedition: { ...candidate.expedition, director: { ...candidate.expedition.director, threat: 11 } } })],
  ])('rejects %s before overwriting a valid save', (_label, mutate) => {
    const { content: localContent, value } = catalogState();
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    expect(repo.saveSlot(1, value)).toEqual({ ok: true });
    const before = storage.getItem(saveActiveKey(1));

    expect(repo.saveSlot(1, mutate(value) as never)).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(before);
  });

  it.each([
    ['a current scene from another chapter', (envelope: any) => { envelope.state.expedition.currentSceneId = 'other-chapter-event'; }],
    ['a merchant payload outside the merchant screen', (envelope: any) => { envelope.state.flow.screen = 'story'; }],
  ])('rejects a checksum-valid import with %s before writing', (_label, mutate) => {
    const { content: localContent, value } = catalogState();
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    expect(repo.saveSlot(1, value)).toEqual({ ok: true });
    const envelope = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    mutate(envelope);

    expect(repo.importSlot(2, signed(envelope))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBeNull();
  });

  it.each([
    ['a mismatched campaign chapter', (envelope: any) => { envelope.state.campaign.chapterId = 'ch02'; }],
    ['a mismatched checkpoint identity', (envelope: any) => { envelope.state.checkpoints.chapter.campaign.heroName = 'Impostor'; }],
    ['a camp scene from another chapter', (envelope: any) => { envelope.state.checkpoints.camp.campSceneId = 'other-chapter-event'; }],
    ['merchant stock generated above the saved hero level', (envelope: any) => { envelope.state.expedition.merchantVisits[0].generatedAtLevel = 15; }],
    ['merchant stock generated above the chapter cap', (envelope: any) => { envelope.state.campaign.hero.level = 15; envelope.state.expedition.merchantVisits[0].generatedAtLevel = 15; }],
    ['an injected merchant stock entry ID', (envelope: any) => { envelope.state.expedition.merchantVisits[0].stock[0].id = 'injected-stock'; }],
    ['duplicate merchant visit namespace', (envelope: any) => { envelope.state.expedition.merchantVisits.push({ ...envelope.state.expedition.merchantVisits[0] }); }],
  ])('rejects a checksum-valid import with %s before writing', (_label, mutate) => {
    const { content: localContent, value } = catalogState();
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    expect(repo.saveSlot(1, value)).toEqual({ ok: true });
    const envelope = JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}');
    mutate(envelope);

    expect(repo.importSlot(2, signed(envelope))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBeNull();
  });

  it.each([
    ['a hero above the level cap', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, hero: { ...candidate.campaign.hero, level: 16 } } })],
    ['a partial attempt-counter record', (candidate: any) => ({ ...candidate, campaign: { ...candidate.campaign, attemptCounters: { ch01: 0 } } })],
    ['director tension above its bounded range', (candidate: any) => ({ ...candidate, expedition: { routeProfile: 'kings-road', routeSeed: 1, director: { ...initialDirector(1), tension: 11 }, position: { chapterId: 'ch01', slot: 0 }, currentSceneId: null, currentCombat: null, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [] }, flow: { screen: 'story', overlay: null, merchant: null } })],
  ])('rejects %s before overwriting an active save', (_label, mutate) => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    expect(repo.saveSlot(1, state())).toEqual({ ok: true });
    const before = storage.getItem(saveActiveKey(1));

    expect(repo.saveSlot(1, mutate(state()) as never)).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(before);
  });

  it('rejects a valid slot-2 envelope copied into slot-1 storage', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    repo.saveSlot(2, state());
    const copied = storage.getItem(saveActiveKey(2));
    storage.setItem(saveActiveKey(1), copied!);

    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(repo.loadSlot(2)).toMatchObject({ ok: true, source: 'active' });
    expect(storage.keys().some((key) => key.includes(':recovery:1:'))).toBe(true);
  });

  it('persists only a compact combat DTO and restores a deterministic combat alias', () => {
    const storage = new MemoryStorage();
    const localContent = makeContentIndex();
    const enemy = { id: 'enemy-1', archetypeId: 'goblin', name: 'Goblin', rank: 1, level: 1, species: 'goblin' as const, region: 'gloamwood' as const, maxHealth: 10, attack: 2, armor: 0, ward: 0, intentWeights: { strike: 1 }, traits: [], rewardTags: [], description: 'A foe.', artFamily: 'goblin' };
    (localContent.enemies as Map<never, never>).set('enemy-1' as never, enemy as never);
    (localContent.items as Map<never, never>).set('item-1' as never, { id: 'item-1', name: 'Tonic', category: 'potion', description: 'A tonic.', allowedClasses: ['mage'], stats: {}, value: 1, tags: [] } as never);
    (localContent.encounters as Map<never, never>).set('fight-1' as never, { id: 'fight-1', enemyIds: ['enemy-1'] } as never);
    (localContent.merchants as Map<never, never>).set('merchant-1' as never, { id: 'merchant-1', name: 'Trader', stockItemIds: ['item-1'] } as never);
    const fixture = localContent.events.get('fixture-event' as never)!;
    (localContent.events as Map<never, never>).set('merchant-hub' as never, { ...fixture, id: 'merchant-hub', type: 'hub', family: 'merchant', merchantId: 'merchant-1', merchantRestockKey: 'merchant-restock' } as never);
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    const combat = createCombat({ class: 'mage', name: 'Aster', level: 1, xp: 0, health: 20, maxHealth: 20, focus: 10, maxFocus: 10, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5, attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] } }, enemy, 7);
    const base = createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, localContent);
    const complete = {
      ...base,
      expedition: { routeProfile: 'kings-road' as const, routeSeed: 7, director: initialDirector(7), position: { chapterId: 'ch01' as const, slot: 0 }, currentSceneId: null, currentCombat: { encounterId: 'fight-1' as never, combat }, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [{ merchantId: 'merchant-1' as never, restockKey: '7:merchant-1:merchant-restock', restockSeed: 7, generatedAtLevel: 1, stock: [{ id: 'merchant-1:7:merchant-1:merchant-restock:0:item-1', itemId: 'item-1' as never }] }] },
      flow: { screen: 'combat' as const, overlay: null, merchant: null },
    };

    expect(repo.saveSlot(1, complete)).toEqual({ ok: true });
    const raw = repo.exportSlot(1) ?? '';
    expect(raw).not.toContain('Goblin');
    expect(raw).not.toContain('A foe.');
    expect(raw).not.toContain('artFamily');
    expect(raw).not.toContain('intentText');
    expect(raw).not.toContain('"log"');
    expect(raw).not.toContain('restockSeed');
    const loaded = repo.loadSlot(1);
    expect(loaded).toMatchObject({ ok: true, state: { expedition: { currentCombat: { combat: { enemies: [expect.objectContaining({ id: 'enemy-1' })] } } } } });
    if (!loaded.ok || !loaded.state.expedition?.currentCombat?.combat) throw new Error('Expected hydrated combat.');
    const hydrated = loaded.state.expedition.currentCombat.combat;
    expect(hydrated.enemy).toBe(hydrated.enemies[0]);
    expect(hydrated.enemy.name).toBe('Goblin');
    expect(hydrated.player.inventory).toEqual([]);
    expect(hydrated.player.equipment).toEqual({ weapon: null, armor: null, charms: [] });
    expect(loaded.state.expedition!.merchantVisits[0]!.restockSeed).toBe(merchantRestockSeed(7, 'merchant-1' as never, '7:merchant-1:merchant-restock'));
    const originalTurn = resolveCombatTurn(combat, { type: 'attack' }, complete.campaign.inventory, { items: localContent.items });
    const hydratedTurn = resolveCombatTurn(hydrated, { type: 'attack' }, loaded.state.campaign.inventory, { items: localContent.items });
    expect(hydratedTurn.events).toEqual(originalTurn.events);
    expect(hydratedTurn.combat.rngState).toBe(originalTurn.combat.rngState);
    expect(encodeSaveState({ ...complete, campaign: { ...complete.campaign, inventory: originalTurn.inventory }, expedition: { ...complete.expedition!, currentCombat: { ...complete.expedition!.currentCombat!, combat: originalTurn.combat } } }, localContent)).toEqual(encodeSaveState({ ...loaded.state, campaign: { ...loaded.state.campaign, inventory: hydratedTurn.inventory }, expedition: { ...loaded.state.expedition!, currentCombat: { ...loaded.state.expedition!.currentCombat!, combat: hydratedTurn.combat } } }, localContent));
    const before = storage.getItem(saveActiveKey(1));
    const hostile = { ...complete, expedition: { ...complete.expedition!, currentCombat: { ...complete.expedition!.currentCombat!, combat: { ...combat, enemyIntents: null } } } };
    expect(() => repo.saveSlot(1, hostile as never)).not.toThrow();
    expect(repo.saveSlot(1, hostile as never)).toMatchObject({ ok: false });
    expect(storage.getItem(saveActiveKey(1))).toBe(before);
    const impossible = JSON.parse(before ?? '{}');
    impossible.state.expedition.currentCombat.combat.player.modifiers.maxHealth = -999;
    storage.setItem(saveActiveKey(1), signed(impossible));
    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
    const malformed = JSON.parse(before ?? '{}');
    malformed.state.expedition.currentCombat.combat.player.modifiers.unknown = 1;
    storage.setItem(saveActiveKey(1), signed(malformed));
    expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });

    const impossibleRuntime = [
      ['player health above its hydrated maximum', (envelope: any) => { envelope.state.expedition.currentCombat.combat.player.health = 999; }],
      ['player focus above its hydrated maximum', (envelope: any) => { envelope.state.expedition.currentCombat.combat.player.focus = 999; }],
      ['negative hydrated player armor', (envelope: any) => { envelope.state.expedition.currentCombat.combat.player.modifiers.armor = -999; }],
      ['enemy health above its hydrated maximum', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].health = 999; }],
      ['negative hydrated enemy armor', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].modifiers.armor = -999; }],
      ['an enemy evasion probability above one hundred', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].modifiers.evasion = 101; }],
      ['a non-boss enemy phase beyond phase one', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].phase = 2; }],
      ['a non-summoner role-use budget', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].roleUses = 1; }],
      ['an extra catalog enemy outside the encounter definition', (envelope: any) => { const first = envelope.state.expedition.currentCombat.combat.enemies[0]; envelope.state.expedition.currentCombat.combat.enemies.push({ ...first, instanceId: 'enemy-1-extra' }); }],
      ['combat payload on the story screen', (envelope: any) => { envelope.state.flow.screen = 'story'; }],
      ['a forged direct combat instance ID', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].instanceId = 'enemy-1-2'; envelope.state.expedition.currentCombat.combat.primaryEnemyId = 'enemy-1-2'; envelope.state.expedition.currentCombat.combat.enemyIntents[0].enemyId = 'enemy-1-2'; }],
      ['an active combat with no living-enemy intent', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemyIntents = []; }],
      ['an active combat with a mismatched legacy intent', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemyIntent = 'heavy'; }],
      ['a full-health living victory on the reward screen', (envelope: any) => { envelope.state.expedition.currentCombat.combat.outcome = 'victory'; envelope.state.flow.screen = 'reward'; }],
      ['an active combat on the reward screen', (envelope: any) => { envelope.state.flow.screen = 'reward'; }],
      ['a defeat with no living enemy', (envelope: any) => { envelope.state.expedition.currentCombat.combat.player.health = 0; envelope.state.expedition.currentCombat.combat.enemies[0].health = 0; envelope.state.expedition.currentCombat.combat.outcome = 'defeat'; envelope.state.expedition.pendingRewards = []; envelope.state.flow.screen = 'defeat'; }],
      ['a fled combat with no living enemy', (envelope: any) => { envelope.state.expedition.currentCombat.combat.enemies[0].health = 0; envelope.state.expedition.currentCombat.combat.outcome = 'fled'; envelope.state.expedition.pendingRewards = []; envelope.state.flow.screen = 'reward'; }],
    ] as const;
    for (const [_label, mutate] of impossibleRuntime) {
      const candidate = JSON.parse(before ?? '{}');
      mutate(candidate);
      storage.setItem(saveActiveKey(1), signed(candidate));
      expect(repo.loadSlot(1)).toMatchObject({ ok: false, reason: 'corrupt' });
    }
  });

  it('persists summoned combat enemies by their catalog origin and resumes their next turn', () => {
    const storage = new MemoryStorage();
    const localContent = makeContentIndex();
    const summoner = { id: 'caller', archetypeId: 'caller', name: 'Caller', rank: 1, level: 1, species: 'human' as const, region: 'gloamwood' as const, maxHealth: 20, attack: 3, armor: 0, ward: 0, intentWeights: { hex: 1 }, traits: ['summon'], rewardTags: [], description: 'Calls smoke.', artFamily: 'caller' };
    (localContent.enemies as Map<never, never>).set('caller' as never, summoner as never);
    (localContent.encounters as Map<never, never>).set('caller-fight' as never, { id: 'caller-fight', enemyIds: ['caller'] } as never);
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    const hero = { class: 'mage' as const, name: 'Aster', level: 1, xp: 0, health: 20, maxHealth: 20, focus: 10, maxFocus: 10, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5, attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] } };
    const base = createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, localContent);
    const summoned = resolveCombatTurn(createCombat(hero, summoner, 7), { type: 'guard' }, base.campaign.inventory, { items: localContent.items });
    expect(summoned.combat.enemies).toHaveLength(2);
    const complete = {
      ...base,
      expedition: { routeProfile: 'kings-road' as const, routeSeed: 7, director: initialDirector(7), position: { chapterId: 'ch01' as const, slot: 0 }, currentSceneId: null, currentCombat: { encounterId: 'caller-fight' as never, combat: summoned.combat }, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [] },
      flow: { screen: 'combat' as const, overlay: null, merchant: null },
    };

    expect(repo.saveSlot(1, complete)).toEqual({ ok: true });
    const persisted = JSON.parse(repo.exportSlot(1) ?? '{}');
    expect(persisted.state.expedition.currentCombat.combat.enemies).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: { kind: 'summon-smoke', originEnemyId: 'caller' } }),
    ]));
    const loaded = repo.loadSlot(1);
    if (!loaded.ok || !loaded.state.expedition?.currentCombat?.combat) throw new Error('Expected hydrated summoned combat.');
    const originalNext = resolveCombatTurn(summoned.combat, { type: 'guard' }, complete.campaign.inventory, { items: localContent.items });
    const hydratedNext = resolveCombatTurn(loaded.state.expedition.currentCombat.combat, { type: 'guard' }, loaded.state.campaign.inventory, { items: localContent.items });
    expect(hydratedNext.events).toEqual(originalNext.events);
    expect(hydratedNext.combat.rngState).toBe(originalNext.combat.rngState);
    expect(repo.saveSlot(1, loaded.state)).toEqual({ ok: true });
  });

  it('binds duplicate direct enemies and summoned smoke to their canonical occurrence IDs', () => {
    const storage = new MemoryStorage();
    const localContent = makeContentIndex();
    const caller = { id: 'caller', archetypeId: 'caller', name: 'Caller', rank: 1, level: 1, species: 'human' as const, region: 'gloamwood' as const, maxHealth: 20, attack: 3, armor: 0, ward: 0, intentWeights: { hex: 1 }, traits: ['summon'], rewardTags: [], description: 'Calls smoke.', artFamily: 'caller' };
    (localContent.enemies as Map<never, never>).set('caller' as never, caller as never);
    (localContent.encounters as Map<never, never>).set('duplicate-callers' as never, { id: 'duplicate-callers' as never, enemyIds: ['caller' as never, 'caller' as never] } as never);
    const hero = { class: 'mage' as const, name: 'Aster', level: 1, xp: 0, health: 20, maxHealth: 20, focus: 10, maxFocus: 10, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5, attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] } };
    const base = createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, localContent);
    const combat = createEncounter(hero, { id: 'duplicate-callers' as never, enemyIds: ['caller' as never, 'caller' as never] }, localContent, 7);
    const stateWithCombat = { ...base, expedition: { routeProfile: 'kings-road' as const, routeSeed: 7, director: initialDirector(7), position: { chapterId: 'ch01' as const, slot: 0 }, currentSceneId: null, currentCombat: { encounterId: 'duplicate-callers' as never, combat }, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [] }, flow: { screen: 'combat' as const, overlay: null, merchant: null } };
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);

    expect(repo.saveSlot(1, stateWithCombat)).toEqual({ ok: true });
    const direct = JSON.parse(repo.exportSlot(1) ?? '{}');
    expect(direct.state.expedition.currentCombat.combat.enemies.map((enemy: { instanceId: string }) => enemy.instanceId)).toEqual(['caller', 'caller-2']);
    direct.state.expedition.currentCombat.combat.enemies[1].instanceId = 'caller-3';
    direct.state.expedition.currentCombat.combat.enemyIntents[1].enemyId = 'caller-3';
    expect(repo.importSlot(2, signed(direct))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBeNull();

    const summoned = resolveCombatTurn(combat, { type: 'guard' }, base.campaign.inventory, { items: localContent.items });
    expect(summoned.combat.enemies.map((enemy) => enemy.id)).toEqual(['caller', 'caller-2', 'caller-smoke-1', 'caller-2-smoke-1']);
    const stateWithSummons = { ...stateWithCombat, expedition: { ...stateWithCombat.expedition, currentCombat: { ...stateWithCombat.expedition.currentCombat, combat: summoned.combat } } };
    expect(repo.saveSlot(1, stateWithSummons)).toEqual({ ok: true });
    const forged = JSON.parse(repo.exportSlot(1) ?? '{}');
    forged.state.expedition.currentCombat.combat.enemies[3].instanceId = 'caller-2-smoke-2';
    forged.state.expedition.currentCombat.combat.enemyIntents[3].enemyId = 'caller-2-smoke-2';

    expect(repo.importSlot(2, signed(forged))).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(saveActiveKey(2))).toBeNull();
  });
});

class Events {
  private readonly listeners = new Map<string, Set<() => void>>();
  addEventListener(name: string, listener: () => void) { const values = this.listeners.get(name) ?? new Set(); values.add(listener); this.listeners.set(name, values); }
  removeEventListener(name: string, listener: () => void) { this.listeners.get(name)?.delete(listener); }
  emit(name: string) { for (const listener of this.listeners.get(name) ?? []) listener(); }
}

describe('background lifecycle seam', () => {
  it('flushes once per background cycle, uses the latest callback, and cleans up listeners', () => {
    const document = new Events();
    const window = new Events();
    let hidden = false;
    const driver: BrowserLifecycleDriver = { document, window, isHidden: () => hidden };
    const first = vi.fn();
    const latest = vi.fn();
    let callback = first;
    const cleanup = subscribeToAppBackground(() => callback, driver);

    hidden = true; document.emit('visibilitychange'); window.emit('pagehide');
    expect(first).toHaveBeenCalledTimes(1);
    callback = latest;
    hidden = false; document.emit('visibilitychange'); window.emit('pageshow');
    hidden = true; window.emit('pagehide');
    expect(latest).toHaveBeenCalledTimes(1);
    cleanup(); cleanup();
    hidden = false; document.emit('visibilitychange'); hidden = true; window.emit('pagehide');
    expect(latest).toHaveBeenCalledTimes(1);
  });
});
