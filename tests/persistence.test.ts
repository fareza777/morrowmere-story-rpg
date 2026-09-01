import {
  exportSave,
  loadGame,
  saveGame,
  storageKey,
  type SaveSlot,
} from '../src/game/persistence';
import { startNewRun } from '../src/game/state';
import { createCampaign } from '../src/game/state/create';
import { encodeSaveState } from '../src/game/persistence/codec';
import { makeContentIndex } from './fixtures/game';

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

  it('encodes current campaign saves as schema v3', () => {
    const content = makeContentIndex();
    const state = createCampaign({ heroClass: 'warden', seed: 12, updatedAt: '2026-09-01T00:00:00.000Z' }, content);

    expect(encodeSaveState(state, content)?.schemaVersion).toBe(3);
    expect(state.schemaVersion).toBe(3);
  });
});
