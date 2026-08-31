import { createCompanionRoster } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { ChapterId } from '../domain/ids';
import type { DirectorState } from '../director/types';
import type { CampaignCheckpointPayload, CreateCampaignOptions, DirectorMemory, GameStateV2, ProfileState } from './types';

const DEFAULT_PROFILE: ProfileState = {
  settings: { textScale: 1, highContrast: false, reducedMotion: false, sound: true, music: true, narration: false },
  discoveries: { events: [], enemies: [], codex: [] },
};

export function campaignPayload(state: GameStateV2['campaign']) {
  const { attemptCounters: _attemptCounters, routeSeedNonce: _routeSeedNonce, transitionCounter: _transitionCounter, ...payload } = state;
  return {
    ...payload,
    hero: { ...payload.hero, talents: [...payload.hero.talents] },
    inventory: {
      pack: payload.inventory.pack.map((entry) => ({ ...entry })), stash: payload.inventory.stash.map((entry) => ({ ...entry })), questItems: [...payload.inventory.questItems],
      equipment: { weapon: payload.inventory.equipment.weapon, armor: payload.inventory.equipment.armor, charms: [...payload.inventory.equipment.charms] },
    },
    flags: [...payload.flags], evidence: [...payload.evidence], factions: { ...payload.factions },
    companions: { activeCompanionId: payload.companions.activeCompanionId, records: payload.companions.records.map((record) => ({ ...record })) },
    directorMemory: { rngState: payload.directorMemory.rngState, seenEventIds: [...payload.directorMemory.seenEventIds], familyCooldowns: { ...payload.directorMemory.familyCooldowns }, pendingCallbacks: payload.directorMemory.pendingCallbacks.map((callback) => ({ ...callback, deadline: { ...callback.deadline } })) },
  } satisfies CampaignCheckpointPayload;
}

export function initialDirector(seed: number): DirectorState {
  return { rngState: seed >>> 0, usedSceneIds: [], recentSceneKinds: [], recentFamilies: [], seenEventIds: [], familyCooldowns: {}, currentRunBlockedFamilies: [], pendingCallbacks: [], tension: 2, threat: 0 };
}

export function initialDirectorMemory(seed: number): DirectorMemory {
  return { rngState: seed >>> 0, seenEventIds: [], familyCooldowns: {}, pendingCallbacks: [] };
}

function createProfile(): ProfileState {
  return { settings: { ...DEFAULT_PROFILE.settings }, discoveries: { events: [], enemies: [], codex: [] } };
}

export function createCampaign(options: CreateCampaignOptions, content: ContentIndex): GameStateV2 {
  const chapterId: ChapterId = options.chapterId ?? 'ch01';
  const campaign = {
    seed: options.seed >>> 0,
    chapterId,
    hero: { heroClass: options.heroClass, xp: 0, level: 1, talents: [] },
    inventory: { pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] } },
    bankedGold: 12,
    flags: [], evidence: [], factions: {}, companions: createCompanionRoster(content), directorMemory: initialDirectorMemory(options.seed),
    attemptCounters: {}, routeSeedNonce: 0, transitionCounter: 0,
  } as const;
  const payload = campaignPayload(campaign);
  return {
    schemaVersion: 2, profile: createProfile(), campaign, expedition: null,
    checkpoints: { chapter: { campaign: campaignPayload(campaign), enteredAt: options.updatedAt }, camp: { campaign: payload, campSceneId: null, savedAt: options.updatedAt } },
    flow: { screen: 'camp', overlay: null }, updatedAt: options.updatedAt,
  };
}
