import {
  exportSave,
  loadGame,
  saveGame,
  storageKey,
  type SaveSlot,
} from '../src/game/persistence';
import { startNewRun } from '../src/game/state';

describe('local persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a complete seeded run', () => {
    const original = startNewRun({ heroClass: 'mage', seed: 9081 });
    const slot: SaveSlot = 2;

    expect(saveGame(slot, original)).toEqual({ ok: true });
    const loaded = loadGame(slot);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.state).toEqual(original);
    expect(JSON.parse(exportSave(slot) ?? '{}').schemaVersion).toBe(1);
  });

  it('preserves corrupt data under a recovery key', () => {
    localStorage.setItem(storageKey(1), '{not-json');

    const result = loadGame(1);

    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'corrupt') {
      expect(result.reason).toBe('corrupt');
      expect(result.recoveryKey).toMatch(/^morrowmere:recovery:/);
      expect(localStorage.getItem(result.recoveryKey)).toBe('{not-json');
    }
  });

  it('distinguishes an empty slot from a corrupt slot', () => {
    expect(loadGame(3)).toEqual({ ok: false, reason: 'empty' });
  });
});
