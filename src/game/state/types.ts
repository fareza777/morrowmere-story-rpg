import type { CompanionRoster } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { GameEffect } from '../domain/effects';
import type { ChapterId, EncounterId, EventId, ItemId, MerchantId, StoryPosition } from '../domain/ids';
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
  readonly companions: CompanionRoster;
  readonly directorMemory: DirectorMemory;
  /** These fields deliberately live outside checkpoint payloads. */
  readonly attemptCounters: Readonly<Partial<Record<ChapterId, number>>>;
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
  readonly currentCombat: { readonly encounterId: EncounterId; readonly combat: CombatState | null } | null;
  readonly pendingRewards: readonly ItemId[];
  readonly unbankedGold: number;
  readonly unbankedLoot: readonly ItemId[];
  readonly temporaryBoons: readonly string[];
  readonly merchantVisits: readonly import('../merchant').MerchantVisit[];
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
  | { readonly type: 'bank-camp'; readonly campSceneId?: EventId; readonly updatedAt: string }
  | { readonly type: 'return-to-camp-after-defeat'; readonly updatedAt: string }
  | { readonly type: 'restart-chapter'; readonly updatedAt: string }
  | { readonly type: 'apply-effects'; readonly effects: readonly GameEffect[]; readonly updatedAt: string }
  | { readonly type: 'inventory'; readonly command: InventoryCommand; readonly updatedAt: string }
  | { readonly type: 'select-next-scene'; readonly updatedAt: string }
  | { readonly type: 'combat-turn'; readonly action: CombatAction; readonly updatedAt: string }
  | { readonly type: 'open-merchant'; readonly updatedAt: string }
  | { readonly type: 'close-merchant'; readonly updatedAt: string }
  | { readonly type: 'trade'; readonly intent: TradeIntent; readonly updatedAt: string }
  | { readonly type: 'set-defeat'; readonly updatedAt: string };

export type CurrentScene = ReturnType<ContentIndex['events']['get']>;
