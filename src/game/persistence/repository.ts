import type { ContentIndex } from '../content/schema';
import type { GameStateV2, ProfileState } from '../state/types';
import type { SaveSlot } from '../persistence';
import { migrateSave } from './migrate';
import { createProfileEnvelope, createSaveEnvelope, isProfileEnvelope, isProfileState, isSaveEnvelope, type SaveEnvelope } from './schema';

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
function parseEnvelope(raw: string | null): SaveEnvelope | null { if (raw === null) return null; try { const value: unknown = JSON.parse(raw); return isSaveEnvelope(value) ? value : null; } catch { return null; } }
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
      const current = parseEnvelope(currentRaw);
      if (currentRaw !== null && current) storage.setItem(saveBackupKey(slot), currentRaw);
      storage.setItem(saveActiveKey(slot), nextRaw);
      return { ok: true };
    } catch (error) { return { ok: false, error: message(error, 'Unable to save the Chronicle.') }; }
  };
  return {
    saveSlot(slot, state) {
      if (!isSaveEnvelope(createSaveEnvelope(slot, state, clock()))) return { ok: false, error: 'Invalid save state.' };
      return saveEnvelope(slot, createSaveEnvelope(slot, state, clock()));
    },
    loadSlot(slot) {
      let activeRaw: string | null;
      let backupRaw: string | null;
      try { activeRaw = storage.getItem(saveActiveKey(slot)); backupRaw = storage.getItem(saveBackupKey(slot)); }
      catch (error) { return { ok: false, reason: 'corrupt', error: message(error, 'Unable to read the Chronicle.') }; }
      const recoveryKeys: string[] = [];
      const active = parseEnvelope(activeRaw);
      if (activeRaw !== null && !active) { const key = archive(slot, 'active', activeRaw); if (key) recoveryKeys.push(key); }
      const backup = parseEnvelope(backupRaw);
      if (backupRaw !== null && !backup) { const key = archive(slot, 'backup', backupRaw); if (key) recoveryKeys.push(key); }
      if (active) return { ok: true, state: active.state, source: 'active', summary: summary(active) };
      if (backup) {
        try { storage.setItem(saveActiveKey(slot), backupRaw!); } catch { /* Recovery remains usable even if promotion cannot persist. */ }
        return { ok: true, state: backup.state, source: 'backup', summary: summary(backup) };
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
        const envelope = parseEnvelope(storage.getItem(saveActiveKey(slot)))!;
        return { ok: true, state: migrated, source: 'migrated', summary: summary(envelope), notice: 'Your prior save was archived. Chronicle I begins at Chapter 1.' };
      } catch (error) { const key = archive(slot, 'legacy-invalid', legacyRaw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [], error: message(error, 'Unable to migrate the Chronicle.') }; }
    },
    exportSlot(slot) {
      try { const raw = storage.getItem(saveActiveKey(slot)); return parseEnvelope(raw) ? raw : null; } catch { return null; }
    },
    importSlot(slot, raw) {
      const incoming = parseEnvelope(raw);
      if (!incoming) { const key = archive(slot, 'import', raw); return { ok: false, reason: 'corrupt', recoveryKeys: key ? [key] : [] }; }
      const target = createSaveEnvelope(slot, incoming.state, clock());
      const written = saveEnvelope(slot, target);
      if (!written.ok) return { ok: false, reason: 'corrupt', error: written.error };
      return { ok: true, state: incoming.state, source: 'active', summary: summary(target) };
    },
    saveProfile(profile) {
      if (!isProfileState(profile)) return { ok: false, error: 'Invalid profile.' };
      try { storage.setItem(profileKey, JSON.stringify(createProfileEnvelope(profile, clock()))); return { ok: true }; }
      catch (error) { return { ok: false, error: message(error, 'Unable to save preferences.') }; }
    },
    loadProfile() {
      let raw: string | null;
      try { raw = storage.getItem(profileKey); } catch (error) { return { ok: false, reason: 'corrupt', error: message(error, 'Unable to read preferences.') }; }
      if (raw === null) return { ok: false, reason: 'empty' };
      const profile = parseProfile(raw);
      if (profile) return { ok: true, profile: profile.profile };
      const key = archive(1, 'profile', raw);
      return { ok: false, reason: 'corrupt', recoveryKey: key };
    },
  };
}
