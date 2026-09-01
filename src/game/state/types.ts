import type { CompanionRoster } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { ChapterId, ChoiceId, CompanionId, EncounterId, EventId, ItemId, MerchantId, StoryPosition } from '../domain/ids';
import type { CommandDiagnostic, DomainEvent } from '../domain/result';
import type { DirectorState, RouteProfileId } from '../director/types';
import type { InventoryCommand, InventoryState } from '../inventory';
import type { HeroProgress } from '../progression';
import type { HeroClass } from '../types';
import type { CombatAction, CombatState } from '../combat/types';
import type { TradeIntent } from '../merchant';

export interface DirectorMemory {
  readonly rngState: number;
  readonly seenEventIds: readonly EventId[];
  readonly familyCooldowns: Readonly<Record<string, number>>;
  readonly pendingCallbacks: DirectorState['pendingCallbacks'];
}

export interface ProfileState {
  readonly settings: {
    readonly textScale: number;
    readonly highContrast: boolean;
    readonly reducedMotion: boolean;
    readonly sound: boolean;
    readonly music: boolean;
    readonly narration: boolean;
    readonly haptics: boolean;
    readonly reducedHaptics: boolean;
  };
  readonly discoveries: {
    readonly events: readonly EventId[];
    readonly enemies: readonly string[];
    readonly codex: readonly string[];
  };
}

export interface CampaignState {
  readonly seed: number;
  readonly chapterId: ChapterId;
  /** Display identity belongs to the campaign, never to derived hero progress. */
  readonly heroName: string;
  readonly hero: HeroProgress;
  readonly inventory: InventoryState;
  readonly bankedGold: number;
  readonly flags: readonly string[];
  readonly evidence: readonly string[];
  readonly factions: Readonly<Record<string, number>>;
  readonly encounterFamilyVictories: Readonly<Record<string, number>>;
  readonly companions: CompanionRoster;
  readonly directorMemory: DirectorMemory;
  /** These fields deliberately live outside checkpoint payloads. */
  /** A stable eight-chapter replay ledger; every chapter has an explicit counter. */
  readonly attemptCounters: Readonly<Record<ChapterId, number>>;
  readonly routeSeedNonce: number;
  readonly transitionCounter: number;
}

export interface CampaignCheckpointPayload {
  readonly seed: number;
  readonly chapterId: ChapterId;
  readonly heroName: string;
  readonly hero: HeroProgress;
  readonly inventory: InventoryState;
  readonly bankedGold: number;
  readonly flags: readonly string[];
  readonly evidence: readonly string[];
  readonly factions: Readonly<Record<string, number>>;
  readonly encounterFamilyVictories: Readonly<Record<string, number>>;
  readonly companions: CompanionRoster;
  readonly directorMemory: DirectorMemory;
}

export interface ChapterSnapshot {
  readonly campaign: CampaignCheckpointPayload;
  readonly enteredAt: string;
}

export interface CampSnapshot {
  readonly campaign: CampaignCheckpointPayload;
  readonly campSceneId: EventId | null;
  readonly savedAt: string;
}

/** Saved runtime state is IDs/progress only; immutable catalogs stay in ContentIndex. */
export interface ExpeditionState {
  readonly routeProfile: RouteProfileId;
  readonly routeSeed: number;
  readonly director: DirectorState;
  readonly position: StoryPosition;
  readonly currentSceneId: EventId | null;
  readonly sceneResolution: SceneResolution | null;
  readonly heroVitals: HeroVitals;
  readonly currentCombat: { readonly encounterId: EncounterId; readonly combat: CombatState | null } | null;
  readonly pendingReward: PendingBattleReward | null;
  readonly unbankedGold: number;
  readonly unbankedLoot: readonly ItemId[];
  readonly temporaryBoons: readonly string[];
  readonly merchantVisits: readonly import('../merchant').MerchantVisit[];
}

export interface HeroVitals {
  readonly health: number;
  readonly resource: number;
}

export interface SceneResolution {
  readonly eventId: EventId;
  readonly choiceId: ChoiceId | null;
  /** Optional until the v2 save migration upgrades legacy compact resolutions. */
  readonly resultKind?: 'direct' | 'critical-success' | 'success' | 'failure' | 'critical-failure';
  readonly chance?: number | null;
  readonly roll?: number | null;
  readonly outcome?: string;
  readonly effectSummary?: readonly string[];
  readonly nextSceneId?: EventId | null;
  readonly continueLabel?: string | null;
}

export interface PendingBattleReward {
  readonly rewardId: string;
  readonly rewardOfferId: string;
  readonly encounterId: EncounterId;
  readonly itemChoices: readonly ItemId[];
  readonly baseGold: number;
  readonly grantedXp: number;
  readonly adEligible: boolean;
  readonly rewardedGoldSettlement: 'available' | 'claimed' | 'ineligible';
}

export interface AdPacingState {
  readonly lastInterstitialAt: string | null;
  readonly expeditionBreaksSinceInterstitial: number;
  readonly rewardedShownAtCurrentBreak: boolean;
  readonly claimedRewardOfferIds: readonly string[];
  readonly rewardedClaimsThisExpedition: number;
}

export interface FlowState {
  readonly screen: 'camp' | 'story' | 'combat' | 'reward' | 'merchant' | 'defeat' | 'ending';
  readonly overlay: 'inventory' | 'chronicle' | 'bestiary' | 'settings' | null;
  readonly merchant: { readonly merchantId: MerchantId; readonly restockKey: string; readonly returnScreen: 'camp' | 'story' } | null;
}

export interface GameStateV2 {
  readonly schemaVersion: 2;
  readonly profile: ProfileState;
  readonly campaign: CampaignState;
  readonly expedition: ExpeditionState | null;
  readonly adPacing: AdPacingState;
  readonly checkpoints: { readonly chapter: ChapterSnapshot; readonly camp: CampSnapshot | null };
  readonly flow: FlowState;
  readonly updatedAt: string;
}

/** Envelope keeps a stable delivery ID without colliding with `choice_resolved.eventId`. */
export interface SequencedDomainEvent {
  readonly eventId: string;
  readonly sequence: number;
  readonly domain: DomainEvent;
}

export interface GameTransition {
  readonly state: GameStateV2;
  readonly events: readonly SequencedDomainEvent[];
  readonly diagnostic?: CommandDiagnostic;
}

export interface CreateCampaignOptions {
  readonly heroClass: HeroClass;
  readonly seed: number;
  readonly name?: string;
  readonly updatedAt: string;
  readonly chapterId?: ChapterId;
}

export type GameCommand =
  | { readonly type: 'start-expedition'; readonly routeProfile?: RouteProfileId; readonly updatedAt: string }
  | { readonly type: 'bank-camp'; readonly updatedAt: string }
  | { readonly type: 'return-to-camp-after-defeat'; readonly updatedAt: string }
  | { readonly type: 'restart-chapter'; readonly updatedAt: string }
  | { readonly type: 'resolve-choice'; readonly eventId: EventId; readonly choiceId: ChoiceId; readonly updatedAt: string }
  | { readonly type: 'claim-rewards'; readonly rewardId: string; readonly itemId: ItemId | null; readonly updatedAt: string }
  | { readonly type: 'CLAIM_REWARDED_GOLD'; readonly rewardOfferId: string; readonly updatedAt: string }
  | { readonly type: 'RECORD_INTERSTITIAL_SHOWN'; readonly shownAt: string; readonly updatedAt: string }
  | { readonly type: 'update-profile-settings'; readonly settings: ProfileState['settings']; readonly updatedAt: string }
  | { readonly type: 'set-active-companion'; readonly companionId: CompanionId | null; readonly updatedAt: string }
  | { readonly type: 'use-item'; readonly entryId: string; readonly updatedAt: string }
  | { readonly type: 'inventory'; readonly command: Exclude<InventoryCommand, { readonly type: 'add' }>; readonly updatedAt: string }
  | { readonly type: 'select-next-scene'; readonly updatedAt: string }
  | { readonly type: 'combat-turn'; readonly commandId: string; readonly action: CombatAction; readonly updatedAt: string }
  | { readonly type: 'open-merchant'; readonly updatedAt: string }
  | { readonly type: 'close-merchant'; readonly updatedAt: string }
  | { readonly type: 'trade'; readonly intent: TradeIntent; readonly updatedAt: string };

export type CurrentScene = ReturnType<ContentIndex['events']['get']>;
