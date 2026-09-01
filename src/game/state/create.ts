import { createCompanionRoster } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { ChapterId } from '../domain/ids';
import type { DirectorState } from '../director/types';
import type { AdPacingState, CampaignCheckpointPayload, CreateCampaignOptions, DirectorMemory, GameStateV2, ProfileState } from './types';

const DEFAULT_PROFILE: ProfileState = {
  settings: { textScale: 1, highContrast: false, reducedMotion: false, sound: true, music: true, narration: false, haptics: true, reducedHaptics: false },
  discoveries: { events: [], enemies: [], codex: [] },
};

const initialAttemptCounters = () => ({ ch01: 0, ch02: 0, ch03: 0, ch04: 0, ch05: 0, ch06: 0, ch07: 0, ch08: 0 } as const);

export function cloneCampaignPayload(payload: CampaignCheckpointPayload): CampaignCheckpointPayload {
  return {
    ...payload,
    hero: { ...payload.hero, talents: [...payload.hero.talents] },
    inventory: {
      pack: payload.inventory.pack.map((entry) => ({ ...entry })), stash: payload.inventory.stash.map((entry) => ({ ...entry })), questItems: [...payload.inventory.questItems],
      equipment: { weapon: payload.inventory.equipment.weapon, armor: payload.inventory.equipment.armor, charms: [...payload.inventory.equipment.charms] },
    },
    flags: [...payload.flags], evidence: [...payload.evidence], factions: { ...payload.factions }, encounterFamilyVictories: { ...payload.encounterFamilyVictories },
    companions: { activeCompanionId: payload.companions.activeCompanionId, records: payload.companions.records.map((record) => ({ ...record })) },
    directorMemory: { rngState: payload.directorMemory.rngState, seenEventIds: [...payload.directorMemory.seenEventIds], familyCooldowns: { ...payload.directorMemory.familyCooldowns }, pendingCallbacks: payload.directorMemory.pendingCallbacks.map((callback) => ({ ...callback, deadline: { ...callback.deadline } })) },
  };
}

export function campaignPayload(state: GameStateV2['campaign']) {
  const { attemptCounters: _attemptCounters, routeSeedNonce: _routeSeedNonce, transitionCounter: _transitionCounter, ...payload } = state;
  return cloneCampaignPayload(payload);
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

export function initialAdPacingState(): AdPacingState {
  return {
    lastInterstitialAt: null,
    expeditionBreaksSinceInterstitial: 0,
    rewardedShownAtCurrentBreak: false,
    claimedRewardOfferIds: [],
    rewardedClaimsThisExpedition: 0,
  };
}

export function createCampaign(options: CreateCampaignOptions, content: ContentIndex): GameStateV2 {
  const chapterId: ChapterId = options.chapterId ?? 'ch01';
  const campaign = {
    seed: options.seed >>> 0,
    chapterId,
    heroName: options.name?.trim() || 'The Oathless',
    hero: { heroClass: options.heroClass, xp: 0, level: 1, talents: [] },
    inventory: { pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] } },
    bankedGold: 12,
    flags: [], evidence: [], factions: {}, companions: createCompanionRoster(content), directorMemory: initialDirectorMemory(options.seed),
    encounterFamilyVictories: {},
    attemptCounters: initialAttemptCounters(), routeSeedNonce: 0, transitionCounter: 0,
  } as const;
  const payload = campaignPayload(campaign);
  return {
    schemaVersion: 3, profile: createProfile(), campaign, expedition: null, adPacing: initialAdPacingState(),
    checkpoints: { chapter: { campaign: campaignPayload(campaign), enteredAt: options.updatedAt }, camp: { campaign: payload, campSceneId: null, savedAt: options.updatedAt } },
    flow: { screen: 'camp', overlay: null, merchant: null }, updatedAt: options.updatedAt,
  };
}
