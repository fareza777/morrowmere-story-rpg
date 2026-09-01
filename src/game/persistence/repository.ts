import type { ContentIndex } from '../content/schema';
import type { GameStateV2, ProfileState } from '../state/types';
import { migrateSave } from './migrate';
import { decodeProfile, decodeSaveState, decodeSaveStateWithDiagnostics, encodeSaveState, isContentBackedProfile } from './codec';
import { createProfileEnvelope, createSaveEnvelope, isProfileEnvelope, isProfileState, isSaveEnvelope, type SaveEnvelope, type SaveSlot } from './schema';

export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly error: string };
export type SlotLoadResult =
  | { readonly ok: true; readonly state: GameStateV2; readonly source: 'active' | 'backup' | 'migrated'; readonly summary: SlotSummary; readonly notice?: string }
  | { readonly ok: false; readonly reason: 'empty' | 'corrupt'; readonly recoveryKeys?: readonly string[]; readonly error?: string };
export type ProfileLoadResult = { readonly ok: true; readonly profile: ProfileState } | { readonly ok: false; readonly reason: 'empty' | 'corrupt'; readonly recoveryKey?: string; readonly error?: string };
export interface SlotSummary { readonly title: string; readonly heroName: string; readonly heroClass: string; readonly level: number; readonly chapter: string; readonly updatedAt: string; }

export const saveActiveKey = (slot: SaveSlot) => `morrowmere:save:v2:${slot}:active`;
export const saveBackupKey = (slot: SaveSlot) => `morrowmere:save:v2:${slot}:backup`;
export const legacySaveKey = (slot: SaveSlot) => `morrowmere:save:${slot}`;
export const profileKey = 'morrowmere:profile:v2';

const EMPTY_CONTENT: ContentIndex = {
  events: new Map(), items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(), artIds: new Set(), audioIds: new Set(),
};

function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
function parseEnvelope(raw: string | null, expectedSlot?: SaveSlot): SaveEnvelope | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isSaveEnvelope(value) && (expectedSlot === undefined || value.slot === expectedSlot) ? value : null;
  } catch { return null; }
}
function parseProfile(raw: string | null) { if (raw === null) return null; try { const value: unknown = JSON.parse(raw); return isProfileEnvelope(value) ? value : null; } catch { return null; } }
function summary(envelope: SaveEnvelope): SlotSummary { const campaign = envelope.state.campaign; return { title: 'Chronicle I — The Black Banner', heroName: campaign.heroName, heroClass: campaign.hero.heroClass.slice(0, 1).toUpperCase() + campaign.hero.heroClass.slice(1), level: campaign.hero.level, chapter: `Chapter ${Number(campaign.chapterId.slice(2))}`, updatedAt: envelope.savedAt }; }

export interface SaveRepository {
  loadProfile(): ProfileLoadResult;
  saveProfile(profile: ProfileState): SaveResult;
  loadSlot(slot: SaveSlot): SlotLoadResult;
  saveSlot(slot: SaveSlot, state: GameStateV2): SaveResult;
  exportSlot(slot: SaveSlot): string | null;
  importSlot(slot: SaveSlot, raw: string): SlotLoadResult;
}

export function createSaveRepository(storage: Storage, clock: () => string, content: ContentIndex = EMPTY_CONTENT): SaveRepository {
  let recoveryCounter = 0;
  const archive = (slot: SaveSlot, source: string, raw: string, prefix = 'recovery'): string | undefined => {
    const key = `morrowmere:${prefix}:${slot}:${clock()}:${source}:${recoveryCounter++}`;
    try { storage.setItem(key, raw); return key; } catch { return undefined; }
  };
  const saveEnvelope = (slot: SaveSlot, envelope: SaveEnvelope): SaveResult => {
    const nextRaw = JSON.stringify(envelope);
    try {
      const currentRaw = storage.getItem(saveActiveKey(slot));
      const current = parseEnvelope(currentRaw, slot);
      if (currentRaw !== null && current && decodeSaveState(current.state, content)) storage.setItem(saveBackupKey(slot), currentRaw);
      storage.setItem(saveActiveKey(slot), nextRaw);
      return { ok: true };
    } catch (error) { return { ok: false, error: message(error, 'Unable to save the Chronicle.') }; }
  };
  return {
    saveSlot(slot, state) {
      let encoded;
      try { encoded = encodeSaveState(state, content); }
      catch { return { ok: false, error: 'Invalid save state.' }; }
      if (!encoded) return { ok: false, error: 'Invalid save state.' };
      const envelope = createSaveEnvelope(slot, encoded, clock());
      if (!isSaveEnvelope(envelope)) return { ok: false, error: 'Invalid save state.' };
      return saveEnvelope(slot, envelope);
    },
    loadSlot(slot) {
      let activeRaw: string | null;
      let backupRaw: string | null;
      try { activeRaw = storage.getItem(saveActiveKey(slot)); backupRaw = storage.getItem(saveBackupKey(slot)); }
      catch (error) { return { ok: false, reason: 'corrupt', error: message(error, 'Unable to read the Chronicle.') }; }
      const recoveryKeys: string[] = [];
      const activeEnvelope = parseEnvelope(activeRaw, slot);
      const activeDecoded = activeEnvelope ? decodeSaveStateWithDiagnostics(activeEnvelope.state, content) : null;
      const active = activeDecoded?.state ?? null;
      if (activeRaw !== null && !active) { const key = archive(slot, 'active', activeRaw); if (key) recoveryKeys.push(key); }
      const backupEnvelope = parseEnvelope(backupRaw, slot);
      const backupDecoded = backupEnvelope ? decodeSaveStateWithDiagnostics(backupEnvelope.state, content) : null;
      const backup = backupDecoded?.state ?? null;
      if (backupRaw !== null && !backup) { const key = archive(slot, 'backup', backupRaw); if (key) recoveryKeys.push(key); }
      if (active && activeEnvelope) {
        const recovered = activeEnvelope.schemaVersion === 2 || (activeDecoded?.diagnostics.length ?? 0) > 0;
        if (recovered) this.saveSlot(slot, active);
        return {
          ok: true,
          state: active,
          source: activeEnvelope.schemaVersion === 2 ? 'migrated' : 'active',
          summary: summary(activeEnvelope),
          ...(recovered ? { notice: activeDecoded?.diagnostics.join(' ') || 'Your save was upgraded to the current format.' } : {}),
        };
      }
      if (backup && backupEnvelope) {
        const recovered = backupEnvelope.schemaVersion === 2 || (backupDecoded?.diagnostics.length ?? 0) > 0;
        try {
          if (recovered) this.saveSlot(slot, backup);
          else storage.setItem(saveActiveKey(slot), backupRaw!);
        } catch { /* Recovery remains usable even if promotion cannot persist. */ }
        return { ok: true, state: backup, source: 'backup', summary: summary(backupEnvelope), ...(recovered ? { notice: backupDecoded?.diagnostics.join(' ') || 'Your backup was upgraded to the current format.' } : {}) };
      }
      if (activeRaw !== null || backupRaw !== null) return { ok: false, reason: 'corrupt', recoveryKeys };
      let legacyRaw: string | null;
      try { legacyRaw = storage.getItem(legacySaveKey(slot)); } catch (error) { return { ok: false, reason: 'corrupt', error: message(error, 'Unable to read the Chronicle.') }; }
      if (legacyRaw === null) return { ok: false, reason: 'empty' };
      try {
        const legacy: unknown = JSON.parse(legacyRaw);
        const migrated = migrateSave(legacy, content, clock());
        if (!migrated) { const key = archive(slot, 'legacy-invalid', legacyRaw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [] }; }
        archive(slot, 'v1', legacyRaw, 'legacy');
        const written = this.saveSlot(slot, migrated);
        if (!written.ok) return { ok: false, reason: 'corrupt', error: written.error };
        const envelope = parseEnvelope(storage.getItem(saveActiveKey(slot)), slot)!;
        return { ok: true, state: migrated, source: 'migrated', summary: summary(envelope), notice: 'Your prior save was archived. Chronicle I begins at Chapter 1.' };
      } catch (error) { const key = archive(slot, 'legacy-invalid', legacyRaw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [], error: message(error, 'Unable to migrate the Chronicle.') }; }
    },
    exportSlot(slot) {
      try { const raw = storage.getItem(saveActiveKey(slot)); const envelope = parseEnvelope(raw, slot); return envelope && decodeSaveState(envelope.state, content) ? raw : null; } catch { return null; }
    },
    importSlot(slot, raw) {
      const incoming = parseEnvelope(raw);
      const decoded = incoming ? decodeSaveStateWithDiagnostics(incoming.state, content) : null;
      const state = decoded?.state ?? null;
      if (!incoming || !state) { const key = archive(slot, 'import', raw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [] }; }
      const encoded = encodeSaveState(state, content);
      if (!encoded) { const key = archive(slot, 'import', raw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [] }; }
      const target = createSaveEnvelope(slot, encoded, clock());
      const written = saveEnvelope(slot, target);
      if (!written.ok) return { ok: false, reason: 'corrupt', error: written.error };
      return { ok: true, state, source: incoming?.schemaVersion === 2 ? 'migrated' : 'active', summary: summary(target), ...(decoded && decoded.diagnostics.length > 0 ? { notice: decoded.diagnostics.join(' ') } : {}) };
    },
    saveProfile(profile) {
      if (!isProfileState(profile) || !isContentBackedProfile(profile, content)) return { ok: false, error: 'Invalid profile.' };
      try { storage.setItem(profileKey, JSON.stringify(createProfileEnvelope(profile, clock()))); return { ok: true }; }
      catch (error) { return { ok: false, error: message(error, 'Unable to save preferences.') }; }
    },
    loadProfile() {
      let raw: string | null;
      try { raw = storage.getItem(profileKey); } catch (error) { return { ok: false, reason: 'corrupt', error: message(error, 'Unable to read preferences.') }; }
      if (raw === null) return { ok: false, reason: 'empty' };
      const profile = parseProfile(raw);
      if (profile && isContentBackedProfile(profile.profile, content)) return { ok: true, profile: decodeProfile(profile.profile) };
      const key = archive(1, 'profile', raw);
      return { ok: false, reason: 'corrupt', recoveryKey: key };
    },
  };
}
