import { describe, expect, it } from 'vitest';
import { startNewRun } from '../src/game/state';
import { createSaveRepository, legacySaveKey } from '../src/game/persistence/repository';
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

describe('schema-v1 migration', () => {
  it('archives v1 once and starts a clean Chronicle I while preserving approved profile data', () => {
    const storage = new MemoryStorage();
    const legacy = { ...startNewRun({ heroClass: 'warden', name: 'Mira', seed: 8 }), settings: { textScale: 1.25, highContrast: true, reducedMotion: true, sound: false, music: false, narration: true }, discoveredEvents: ['fixture-event', 'missing'], discoveredEnemies: ['known-enemy', 'missing'], flags: ['old-choice'], gold: 99, hero: { ...startNewRun({ heroClass: 'warden', name: 'Mira', seed: 8 }).hero, xp: 500, level: 4 } };
    const content = makeContentIndex();
    (content.enemies as Map<never, never>).set('known-enemy' as never, { id: 'known-enemy' as never, archetypeId: 'known', name: 'Known', rank: 1, level: 1, species: 'known', region: 'gloamwood', maxHealth: 1, attack: 1, armor: 0, ward: 0, intentWeights: { strike: 1 }, traits: [], rewardTags: [], description: '', artFamily: 'known' } as never);
    storage.setItem(legacySaveKey(1), JSON.stringify(legacy));
    const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z', content);

    const migrated = repo.loadSlot(1);

    expect(migrated).toMatchObject({ ok: true, source: 'migrated', notice: expect.stringContaining('Chronicle I'), state: { campaign: { heroName: 'Mira', chapterId: 'ch01', flags: [], bankedGold: 12, hero: { heroClass: 'warden', level: 1, xp: 0 } }, expedition: null, profile: { settings: legacy.settings, discoveries: { events: ['fixture-event'], enemies: ['known-enemy'] } } } });
    expect(storage.keys().filter((key) => key.includes(':legacy:'))).toHaveLength(1);
    expect(repo.loadSlot(1)).toMatchObject({ ok: true, source: 'active' });
    expect(storage.keys().filter((key) => key.includes(':legacy:'))).toHaveLength(1);
  });
});
