import { describe, expect, it, vi } from 'vitest';
import { createCampaign } from '../src/game/state';
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
