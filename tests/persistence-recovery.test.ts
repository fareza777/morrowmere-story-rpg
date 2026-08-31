import { describe, expect, it, vi } from 'vitest';
import { createCampaign } from '../src/game/state';
import { createCombat } from '../src/game/combat';
import { initialDirector } from '../src/game/state/create';
import { encodeSaveState } from '../src/game/persistence/codec';
import { resolveCombatTurn } from '../src/game/combat/resolve';
import { merchantRestockSeed } from '../src/game/merchant';
import { canonicalJson, checksumFor } from '../src/game/persistence/checksum';
import { createSaveRepository, saveActiveKey, saveBackupKey } from '../src/game/persistence/repository';
import { subscribeToAppBackground, type BrowserLifecycleDriver } from '../src/native/lifecycle';
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

function signed(raw: Record<string, unknown>): string {
  const { checksum: _checksum, ...unsigned } = raw;
  return JSON.stringify({ ...unsigned, checksum: checksumFor(unsigned) });
}

describe('V2 save recovery', () => {
  it('isolates all three slots and returns an English summary', () => {
    const storage = new MemoryStorage();
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);
    const one = state();
    const two = { ...state(), campaign: { ...state().campaign, heroName: 'Briar' } };

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
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', localContent);
    const combat = createCombat({ class: 'mage', name: 'Aster', level: 1, xp: 0, health: 20, maxHealth: 20, focus: 10, maxFocus: 10, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5, attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] } }, enemy, 7);
    const base = createCampaign({ heroClass: 'mage', name: 'Aster', seed: 99, updatedAt: '2026-08-31T00:00:00.000Z' }, localContent);
    const complete = {
      ...base,
      expedition: { routeProfile: 'kings-road' as const, routeSeed: 7, director: initialDirector(7), position: { chapterId: 'ch01' as const, slot: 0 }, currentSceneId: null, currentCombat: { encounterId: 'fight-1' as never, combat }, pendingRewards: ['reward-1' as never], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [{ merchantId: 'merchant-1' as never, restockKey: 'route:merchant', restockSeed: 7, stock: [{ id: 'stock-1', itemId: 'item-1' as never }] }] },
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
    expect(loaded.state.expedition!.merchantVisits[0]!.restockSeed).toBe(merchantRestockSeed(7, 'merchant-1' as never, 'route:merchant'));
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
  });

  it('persists summoned combat enemies by their catalog origin and resumes their next turn', () => {
    const storage = new MemoryStorage();
    const localContent = makeContentIndex();
    const summoner = { id: 'caller', archetypeId: 'caller', name: 'Caller', rank: 1, level: 1, species: 'human' as const, region: 'gloamwood' as const, maxHealth: 20, attack: 3, armor: 0, ward: 0, intentWeights: { hex: 1 }, traits: ['summon'], rewardTags: [], description: 'Calls smoke.', artFamily: 'caller' };
    (localContent.enemies as Map<never, never>).set('caller' as never, summoner as never);
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
