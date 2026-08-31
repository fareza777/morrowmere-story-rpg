import type { ProfileState, GameStateV2 } from '../state/types';
import type { SaveSlot } from '../persistence';
import { checksumFor } from './checksum';

export interface SaveEnvelope {
  readonly schemaVersion: 2;
  readonly slot: SaveSlot;
  readonly savedAt: string;
  readonly state: GameStateV2;
  readonly checksum: string;
}

export interface ProfileEnvelope {
  readonly schemaVersion: 2;
  readonly savedAt: string;
  readonly profile: ProfileState;
  readonly checksum: string;
}

const chapters = new Set(['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08']);
const classes = new Set(['warrior', 'mage', 'warden']);
const slots = new Set([1, 2, 3]);

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finite(value: unknown, minimum = -Infinity): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum;
}

function strings(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function recursivelyFinite(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (value === null || typeof value !== 'object') return true;
  return Array.isArray(value)
    ? value.every(recursivelyFinite)
    : Object.values(value as Record<string, unknown>).every(recursivelyFinite);
}

function validSettings(value: unknown): boolean {
  if (!record(value)) return false;
  return finite(value.textScale, 0.5) && typeof value.highContrast === 'boolean' && typeof value.reducedMotion === 'boolean'
    && typeof value.sound === 'boolean' && typeof value.music === 'boolean' && typeof value.narration === 'boolean';
}

export function isProfileState(value: unknown): value is ProfileState {
  if (!record(value) || !record(value.discoveries) || !validSettings(value.settings)) return false;
  return strings(value.discoveries.events) && strings(value.discoveries.enemies) && strings(value.discoveries.codex);
}

function validInventory(value: unknown): boolean {
  if (!record(value) || !Array.isArray(value.pack) || !Array.isArray(value.stash) || !strings(value.questItems) || !record(value.equipment)) return false;
  const entries = [...value.pack, ...value.stash];
  return entries.every((entry) => record(entry) && typeof entry.id === 'string' && typeof entry.itemId === 'string' && finite(entry.quantity, 1) && Number.isInteger(entry.quantity))
    && (value.equipment.weapon === null || typeof value.equipment.weapon === 'string')
    && (value.equipment.armor === null || typeof value.equipment.armor === 'string') && strings(value.equipment.charms);
}

function validCampaign(value: unknown): boolean {
  if (!record(value) || !finite(value.seed, 0) || !Number.isInteger(value.seed) || typeof value.heroName !== 'string' || !chapters.has(value.chapterId as string)
    || !record(value.hero) || !classes.has(value.hero.heroClass as string) || !finite(value.hero.level, 1) || !Number.isInteger(value.hero.level)
    || !finite(value.hero.xp, 0) || !strings(value.hero.talents) || !validInventory(value.inventory) || !finite(value.bankedGold, 0)
    || !strings(value.flags) || !strings(value.evidence) || !record(value.factions) || !record(value.companions) || !record(value.directorMemory)
    || !record(value.attemptCounters) || !finite(value.routeSeedNonce, 0) || !finite(value.transitionCounter, 0)) return false;
  return recursivelyFinite(value);
}

function validCheckpointPayload(value: unknown): boolean {
  if (!record(value)) return false;
  const synthetic = { ...value, attemptCounters: {}, routeSeedNonce: 0, transitionCounter: 0 };
  return validCampaign(synthetic);
}

function validState(value: unknown): value is GameStateV2 {
  if (!record(value) || value.schemaVersion !== 2 || !isProfileState(value.profile) || !validCampaign(value.campaign)
    || !record(value.checkpoints) || !record(value.checkpoints.chapter) || !validCheckpointPayload(value.checkpoints.chapter.campaign)
    || typeof value.checkpoints.chapter.enteredAt !== 'string' || !record(value.flow) || typeof value.updatedAt !== 'string') return false;
  if (value.checkpoints.camp !== null && (!record(value.checkpoints.camp) || !validCheckpointPayload(value.checkpoints.camp.campaign) || typeof value.checkpoints.camp.savedAt !== 'string')) return false;
  return recursivelyFinite(value);
}

export function createSaveEnvelope(slot: SaveSlot, state: GameStateV2, savedAt: string): SaveEnvelope {
  const unsigned = { schemaVersion: 2 as const, slot, savedAt, state };
  return { ...unsigned, checksum: checksumFor(unsigned) };
}

export function createProfileEnvelope(profile: ProfileState, savedAt: string): ProfileEnvelope {
  const unsigned = { schemaVersion: 2 as const, savedAt, profile };
  return { ...unsigned, checksum: checksumFor(unsigned) };
}

export function isSaveEnvelope(value: unknown): value is SaveEnvelope {
  if (!record(value) || value.schemaVersion !== 2 || !slots.has(value.slot as number) || typeof value.savedAt !== 'string' || typeof value.checksum !== 'string' || !validState(value.state)) return false;
  const { checksum: _checksum, ...unsigned } = value;
  return checksumFor(unsigned) === value.checksum;
}

export function isProfileEnvelope(value: unknown): value is ProfileEnvelope {
  if (!record(value) || value.schemaVersion !== 2 || typeof value.savedAt !== 'string' || typeof value.checksum !== 'string' || !isProfileState(value.profile)) return false;
  const { checksum: _checksum, ...unsigned } = value;
  return checksumFor(unsigned) === value.checksum;
}
