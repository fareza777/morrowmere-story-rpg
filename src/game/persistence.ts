import type { GameState } from './state';

// V1 callers keep these functions while controllers migrate to the injected V2 repository.
export { createSaveRepository, legacySaveKey, profileKey, saveActiveKey, saveBackupKey } from './persistence/repository';
export type { ProfileLoadResult, SaveRepository, SaveResult as V2SaveResult, SlotLoadResult, SlotSummary } from './persistence/repository';
export type { SaveSlot } from './persistence/schema';
export { canonicalJson, checksumFor } from './persistence/checksum';

import type { SaveSlot } from './persistence/schema';

export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly error: string };
export type LoadResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: 'empty' }
  | { readonly ok: false; readonly reason: 'corrupt'; readonly recoveryKey: string };

export const storageKey = (slot: SaveSlot) => `morrowmere:save:${slot}`;

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameState>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.seed === 'number' &&
    Array.isArray(candidate.route) &&
    typeof candidate.routeIndex === 'number' &&
    Boolean(candidate.hero) &&
    Boolean(candidate.settings)
  );
}

export function saveGame(slot: SaveSlot, state: GameState): SaveResult {
  try {
    localStorage.setItem(storageKey(slot), JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to save the Chronicle.' };
  }
}

export function loadGame(slot: SaveSlot): LoadResult {
  const raw = localStorage.getItem(storageKey(slot));
  if (raw === null) return { ok: false, reason: 'empty' };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) throw new Error('Invalid save schema');
    return { ok: true, state: parsed };
  } catch {
    const recoveryKey = `morrowmere:recovery:${Date.now()}:${slot}`;
    localStorage.setItem(recoveryKey, raw);
    return { ok: false, reason: 'corrupt', recoveryKey };
  }
}

export function exportSave(slot: SaveSlot): string | null {
  return localStorage.getItem(storageKey(slot));
}

export function importSave(slot: SaveSlot, raw: string): LoadResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) throw new Error('Invalid save schema');
    localStorage.setItem(storageKey(slot), JSON.stringify(parsed));
    return { ok: true, state: parsed };
  } catch {
    const recoveryKey = `morrowmere:recovery:${Date.now()}:${slot}`;
    localStorage.setItem(recoveryKey, raw);
    return { ok: false, reason: 'corrupt', recoveryKey };
  }
}
