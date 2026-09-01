import type { GameEffect } from "../domain/effects";
import type { RouteProfileId } from "../director/types";
import type {
  CallbackId,
  ChapterId,
  ChoiceId,
  CompanionId,
  DecisionId,
  EncounterId,
  EnemyId,
  EventId,
  FactionId,
  IllustrationId,
  ItemId,
  MerchantDialogueSetId,
  MerchantId,
  MerchantStockPoolId,
  SceneFamilyId,
  StoryPosition,
  VoiceCueId,
} from "../domain/ids";
import type { EnemyDefinition, ItemDefinition, RegionId } from "../types";

/**
 * Immutable catalog item contracts are consumed by pure game systems through
 * stable `ItemId` map keys.  The existing item shape remains compatible with
 * the vertical-slice catalog while consumers migrate to these domain modules.
 */
export type CatalogItemDefinition = ItemDefinition;

export type ChronicleEventType =
  | "main"
  | "companion"
  | "journey"
  | "combat"
  | "hub";

/** Runtime pacing metadata. Content remains authored; the director only chooses among it. */
export type EventPacing = "danger" | "merchant" | "recovery" | "quiet";

export interface EventEligibility {
  readonly routes?: readonly RouteProfileId[];
  readonly minLevel?: number;
  readonly maxLevel?: number;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
}

/** The three player-facing attributes that can drive a narrative check. */
export type ChronicleStat = 'strength' | 'cunning' | 'will';

/** A visible situational adjustment to a check's final success percentage. */
export interface ChronicleCheckModifier {
  readonly label: string;
  readonly amount: number;
  readonly requirements?: readonly ChronicleFlagRequirement[];
  readonly exclusions?: readonly ChronicleFlagRequirement[];
}

/** One authored outcome of a checked choice. */
export interface ChronicleChoiceBranch<Effect = GameEffect> {
  readonly outcome: string;
  readonly effects: readonly Effect[];
  readonly nextSceneId?: EventId;
  readonly combatEncounterId?: EncounterId;
  readonly continueLabel?: string;
}

/**
 * A deterministic stat check. Critical branches are optional because a
 * critical result falls back to its ordinary success or failure branch.
 */
export interface ChronicleChoiceCheck<Effect = GameEffect> {
  readonly stat: ChronicleStat;
  readonly difficulty: number;
  readonly modifiers?: readonly ChronicleCheckModifier[];
  readonly success: ChronicleChoiceBranch<Effect>;
  readonly failure: ChronicleChoiceBranch<Effect>;
  readonly criticalSuccess?: ChronicleChoiceBranch<Effect>;
  readonly criticalFailure?: ChronicleChoiceBranch<Effect>;
}

/** Lists every authored branch, including optional critical branches. */
export function chronicleCheckBranches<Effect>(
  check: ChronicleChoiceCheck<Effect>,
): readonly ChronicleChoiceBranch<Effect>[] {
  return [
    check.success,
    check.failure,
    ...(check.criticalSuccess ? [check.criticalSuccess] : []),
    ...(check.criticalFailure ? [check.criticalFailure] : []),
  ];
}

interface ChronicleChoiceBase {
  readonly id: ChoiceId;
  readonly label: string;
  readonly detail: string;
  readonly requirements?: readonly ChronicleRequirement[];
  readonly exclusions?: readonly ChronicleRequirement[];
}

/** Legacy/direct choices retain their authored outcome and effects. */
export interface ChronicleDirectChoice extends ChronicleChoiceBase {
  readonly effects: readonly GameEffect[];
  readonly outcome: string;
  readonly nextSceneId?: EventId;
  readonly continueLabel?: string;
  readonly check?: never;
}

/** Checked choices own every outcome and effect through their check branches. */
export interface ChronicleCheckedChoice extends ChronicleChoiceBase {
  readonly check: ChronicleChoiceCheck;
  readonly effects?: never;
  readonly outcome?: never;
}

export type ChronicleChoice = ChronicleDirectChoice | ChronicleCheckedChoice;

export function isChronicleCheckedChoice(
  choice: ChronicleChoice,
): choice is ChronicleCheckedChoice {
  return 'check' in choice;
}

/** Returns every effect a generic runtime choice can author. */
export function chronicleChoiceEffects(choice: ChronicleChoice): readonly GameEffect[] {
  return isChronicleCheckedChoice(choice)
    ? chronicleCheckBranches(choice.check).flatMap((branch) => branch.effects)
    : choice.effects;
}

export interface ChronicleEvent {
  readonly id: EventId;
  readonly chapterId: ChapterId;
  /** Optional authored unlock position; legacy catalogs without slots stay immediately eligible. */
  readonly slot?: number;
  readonly type: ChronicleEventType;
  readonly family: string;
  readonly anchorOrder?: number;
  readonly weight?: number;
  readonly pacing?: EventPacing;
  readonly threatChange?: number;
  readonly tensionChange?: number;
  readonly illustrationId: string;
  readonly audioId?: string;
  readonly title: string;
  readonly narrative: readonly string[];
  readonly eligibility: EventEligibility;
  readonly cooldownRuns: number;
  readonly oneShot: boolean;
  /** A hub scene may authorize exactly one merchant identity. */
  readonly merchantId?: MerchantId;
  /** Stable authored restock namespace; route state supplies the deterministic seed. */
  readonly merchantRestockKey?: string;
  readonly encounterId?: EncounterId;
  /** Ordered scene-local presentation beats. Effects remain owned by choices. */
  readonly dialogue?: readonly ChronicleDialogueBeat[];
  /** Authored continuations are optional for legacy catalogs. */
  readonly followUps?: readonly EventId[];
  readonly choices: readonly ChronicleChoice[];
}

export interface EncounterDefinition {
  readonly id: EncounterId;
  readonly family: string;
  readonly kind: "regular" | "lieutenant" | "boss";
  readonly enemyIds: readonly EnemyId[];
  readonly bossEnemyId?: EnemyId;
  readonly reward: {
    readonly xp: number;
    readonly gold: number;
    readonly itemChoices: readonly ItemId[];
  };
}

export interface CompanionDefinition {
  readonly id: CompanionId;
  readonly name: string;
  readonly recruitment: {
    readonly requiredDecisionIds: readonly string[];
    readonly blockingDecisionIds?: readonly string[];
  };
  readonly personalQuestIds: readonly EventId[];
  readonly combat: {
    readonly attack: number;
    readonly guard: number;
    readonly will: number;
    readonly actionId: string;
  };
}

export interface MerchantDefinition {
  readonly id: MerchantId;
  readonly name: string;
  readonly stockItemIds: readonly ItemId[];
}

export type JourneySubtype =
  | 'travel'
  | 'investigation'
  | 'side-quest'
  | 'dungeon'
  | 'moral-choice';

export interface ChronicleFlagRequirement {
  readonly type: 'flag';
  readonly flagId: string;
  readonly present: boolean;
}

export type ChronicleRequirement =
  | ChronicleFlagRequirement
  | { readonly type: 'gold'; readonly scope: 'banked' | 'unbanked'; readonly amount: number }
  | { readonly type: 'item'; readonly itemId: ItemId; readonly quantity: number; readonly scope: 'pack' | 'owned' };

export type ChronicleRelationship =
  | { readonly kind: 'companion'; readonly companionId: CompanionId }
  | { readonly kind: 'faction'; readonly factionId: FactionId };

export interface ChronicleCallbackPromise {
  readonly id?: CallbackId;
  readonly targetEventId: EventId;
  readonly deadline: StoryPosition;
  readonly fallbackEventId?: EventId;
}

export interface ChronicleVoiceCue {
  readonly id: VoiceCueId;
  readonly speaker: string;
  readonly text: string;
}

export type DialogueExpression = 'neutral' | 'wary' | 'resolved' | 'hurt' | 'warm';

export interface ChronicleDialogueCharacterLayer {
  readonly illustrationId: IllustrationId;
  readonly companionId?: CompanionId;
  readonly position?: 'left' | 'right' | 'center';
}

export interface ChronicleDialogueBeat {
  readonly speakerId?: string;
  readonly speakerName: string;
  readonly text: string;
  readonly characterLayer?: ChronicleDialogueCharacterLayer;
  readonly expression?: DialogueExpression;
  readonly voiceCueId?: VoiceCueId;
  readonly environmentIllustrationId?: IllustrationId;
}

/**
 * Chronicle-only effects remain separate from the atomic core effect union.
 * The production content adapter must normalize these variants before the
 * core reducer receives them.
 */
export type ChronicleEffect =
  | GameEffect
  | { readonly type: 'evidence'; readonly operation: 'add' | 'remove'; readonly evidenceId: string }
  | { readonly type: 'companion-loyalty'; readonly companionId: CompanionId; readonly amount: number }
  | { readonly type: 'companion-quest'; readonly companionId: CompanionId; readonly stage: 0 | 1 | 2 | 3 }
  | { readonly type: 'companion-injury'; readonly companionId: CompanionId; readonly injured: boolean }
  | { readonly type: 'threat'; readonly amount: number }
  | { readonly type: 'tension'; readonly amount: number };

interface Chronicle1ChoiceBase {
  readonly id: DecisionId;
  readonly label: string;
  readonly detail: string;
  readonly requirements?: readonly ChronicleRequirement[];
  readonly exclusions?: readonly ChronicleRequirement[];
}

export interface Chronicle1DirectChoice extends Chronicle1ChoiceBase {
  readonly effects: readonly ChronicleEffect[];
  readonly outcome: string;
  readonly nextSceneId?: EventId;
  readonly continueLabel?: string;
  readonly check?: never;
}

export interface Chronicle1CheckedChoice extends Chronicle1ChoiceBase {
  readonly check: ChronicleChoiceCheck<ChronicleEffect>;
  readonly effects?: never;
  readonly outcome?: never;
}

export type Chronicle1Choice = Chronicle1DirectChoice | Chronicle1CheckedChoice;

export function isChronicle1CheckedChoice(
  choice: Chronicle1Choice,
): choice is Chronicle1CheckedChoice {
  return 'check' in choice;
}

/** Returns all visible outcome text for source assembly checks. */
export function chronicle1ChoiceOutcomes(choice: Chronicle1Choice): readonly string[] {
  return isChronicle1CheckedChoice(choice)
    ? chronicleCheckBranches(choice.check).map((branch) => branch.outcome)
    : [choice.outcome];
}

/** Returns every effect a Chronicle I choice can author. */
export function chronicle1ChoiceEffects(choice: Chronicle1Choice): readonly ChronicleEffect[] {
  return isChronicle1CheckedChoice(choice)
    ? chronicleCheckBranches(choice.check).flatMap((branch) => branch.effects)
    : choice.effects;
}

export interface Chronicle1Event
  extends Omit<ChronicleEvent, 'id' | 'family' | 'weight' | 'illustrationId' | 'choices' | 'dialogue'> {
  readonly id: EventId;
  readonly region: RegionId;
  /** Positive, chapter-local position used by source validation and callbacks. */
  readonly slot: number;
  readonly family: SceneFamilyId;
  readonly weight: number;
  readonly illustrationId: IllustrationId;
  readonly journeySubtype?: JourneySubtype;
  readonly relationship?: ChronicleRelationship;
  readonly requirements?: readonly ChronicleRequirement[];
  readonly exclusions?: readonly ChronicleRequirement[];
  readonly followUps: readonly EventId[];
  readonly callbackPromises: readonly ChronicleCallbackPromise[];
  readonly encounterId?: EncounterId;
  readonly voiceCues?: readonly ChronicleVoiceCue[];
  readonly dialogue?: readonly ChronicleDialogueBeat[];
  /** One non-selective choice is legal only when this marker is true. */
  readonly continueOnly?: boolean;
  readonly choices: readonly Chronicle1Choice[];
}

/**
 * Authored files use literal strings. `defineScene` is the sole branding
 * boundary and turns this source shape into a deeply immutable event.
 */
export type ChronicleEffectSource =
  | { readonly type: 'gold'; readonly scope: 'banked' | 'unbanked'; readonly amount: number }
  | { readonly type: 'item'; readonly operation: 'grant' | 'remove'; readonly itemId: string; readonly quantity: number; readonly destination?: 'pack' | 'unbanked-loot' }
  | { readonly type: 'xp'; readonly amount: number; readonly source?: 'story' | 'quest' | 'companion' }
  | { readonly type: 'flag'; readonly operation: 'add' | 'remove'; readonly flagId: string }
  | { readonly type: 'faction'; readonly factionId: string; readonly amount: number }
  | { readonly type: 'companion'; readonly companionId: string; readonly operation: 'recruit' | 'dismiss' }
  | { readonly type: 'vitals'; readonly health?: number; readonly resource?: number }
  | { readonly type: 'callback'; readonly promise: { readonly targetEventId: string; readonly deadline: StoryPosition } }
  | { readonly type: 'combat'; readonly encounterId: string }
  | { readonly type: 'evidence'; readonly operation: 'add' | 'remove'; readonly evidenceId: string }
  | { readonly type: 'companion-loyalty'; readonly companionId: string; readonly amount: number }
  | { readonly type: 'companion-quest'; readonly companionId: string; readonly stage: 0 | 1 | 2 | 3 }
  | { readonly type: 'companion-injury'; readonly companionId: string; readonly injured: boolean }
  | { readonly type: 'threat'; readonly amount: number }
  | { readonly type: 'tension'; readonly amount: number };

export interface ChronicleFlagRequirementSource {
  readonly type: 'flag';
  readonly flagId: string;
  /** Older authored chapter drafts default to requiring the flag to exist. */
  readonly present?: boolean;
}

export type ChronicleRequirementSource =
  | ChronicleFlagRequirementSource
  | { readonly type: 'gold'; readonly scope: 'banked' | 'unbanked'; readonly amount: number }
  | { readonly type: 'item'; readonly itemId: string; readonly quantity: number; readonly scope?: 'pack' | 'owned' };

export interface ChronicleCheckModifierSource {
  readonly label: string;
  readonly amount: number;
  readonly requirements?: readonly ChronicleFlagRequirementSource[];
  readonly exclusions?: readonly ChronicleFlagRequirementSource[];
}

export interface ChronicleChoiceBranchSource {
  readonly outcome: string;
  readonly effects: readonly ChronicleEffectSource[];
  readonly nextSceneId?: string;
  readonly combatEncounterId?: string;
  readonly continueLabel?: string;
}

export interface ChronicleChoiceCheckSource {
  readonly stat: ChronicleStat;
  readonly difficulty: number;
  readonly modifiers?: readonly ChronicleCheckModifierSource[];
  readonly success: ChronicleChoiceBranchSource;
  readonly failure: ChronicleChoiceBranchSource;
  readonly criticalSuccess?: ChronicleChoiceBranchSource;
  readonly criticalFailure?: ChronicleChoiceBranchSource;
}

export interface ChronicleDialogueCharacterLayerSource {
  readonly illustrationId: string;
  readonly companionId?: string;
  readonly position?: 'left' | 'right' | 'center';
}

export interface ChronicleDialogueBeatSource {
  readonly speakerId?: string;
  readonly speakerName: string;
  readonly text: string;
  readonly characterLayer?: ChronicleDialogueCharacterLayerSource;
  readonly expression?: DialogueExpression;
  readonly voiceCueId?: string;
  readonly environmentIllustrationId?: string;
}

interface Chronicle1ChoiceSourceBase {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly requirements?: readonly ChronicleRequirementSource[];
  readonly exclusions?: readonly ChronicleRequirementSource[];
}

export interface Chronicle1DirectChoiceSource extends Chronicle1ChoiceSourceBase {
  readonly effects: readonly ChronicleEffectSource[];
  readonly outcome: string;
  readonly nextSceneId?: string;
  readonly continueLabel?: string;
  readonly check?: never;
}

export interface Chronicle1CheckedChoiceSource extends Chronicle1ChoiceSourceBase {
  readonly check: ChronicleChoiceCheckSource;
  readonly effects?: never;
  readonly outcome?: never;
}

export type Chronicle1ChoiceSource = Chronicle1DirectChoiceSource | Chronicle1CheckedChoiceSource;

export interface Chronicle1EventSource {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly region: RegionId;
  readonly slot: number;
  readonly type: ChronicleEventType;
  readonly family: string;
  readonly anchorOrder?: number;
  readonly weight: number;
  readonly pacing?: EventPacing;
  readonly threatChange?: number;
  readonly tensionChange?: number;
  readonly journeySubtype?: JourneySubtype;
  readonly relationship?:
    | { readonly kind: 'companion'; readonly companionId: string }
    | { readonly kind: 'faction'; readonly factionId: string };
  readonly illustrationId: string;
  readonly audioId?: string;
  readonly voiceCues?: readonly { readonly id: string; readonly speaker: string; readonly text: string }[];
  readonly dialogue?: readonly ChronicleDialogueBeatSource[];
  readonly title: string;
  readonly narrative: readonly string[];
  readonly eligibility: EventEligibility;
  readonly requirements?: readonly ChronicleRequirementSource[];
  readonly exclusions?: readonly ChronicleRequirementSource[];
  readonly cooldownRuns: number;
  readonly oneShot: boolean;
  readonly merchantId?: string;
  readonly merchantRestockKey?: string;
  readonly followUps: readonly string[];
  readonly callbackPromises: readonly {
    readonly id?: string;
    readonly targetEventId: string;
    readonly deadline: StoryPosition;
    readonly fallbackEventId?: string;
  }[];
  readonly encounterId?: string;
  readonly continueOnly?: boolean;
  readonly choices: readonly Chronicle1ChoiceSource[];
}

export type SevenAnchorIds = readonly [
  EventId,
  EventId,
  EventId,
  EventId,
  EventId,
  EventId,
  EventId,
];

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly title: string;
  readonly levelBand: { readonly min: number; readonly max: number };
  readonly region: RegionId;
  readonly anchorIds: SevenAnchorIds;
}

export interface ChronicleDefinition {
  readonly id: 'chronicle-1';
  readonly title: 'Chronicle I — The Black Banner';
  readonly chapters: readonly [
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
    ChapterDefinition,
  ];
}

export interface ChronicleRouteDefinition {
  readonly id: RouteProfileId;
  readonly label: string;
  readonly description: string;
  readonly danger: number;
  readonly recoveryWeight: number;
  readonly merchantWeight: number;
  readonly companionWeight: number;
  readonly relicWeight: number;
}

export interface ChronicleFactionDefinition {
  readonly id: FactionId;
  readonly name: string;
  readonly description: string;
}

export interface Chronicle1CompanionDefinition extends Omit<CompanionDefinition, 'combat'> {
  readonly values: readonly string[];
  readonly explorationCapability: {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  };
  readonly passive: {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  };
  readonly combat: CompanionDefinition['combat'] & { readonly commandCooldown: 2 };
  /** Compatibility alias for consumers that present command rules outside combat. */
  readonly commandCooldown: 2;
  readonly loyaltyStates: Readonly<Record<'wary' | 'respectful' | 'loyal', string>>;
  readonly visibleCost: string;
  /** Compatibility alias retained for early content consumers. */
  readonly visibleRecruitmentCost: string;
  readonly outcomeSceneIds: readonly EventId[];
}

export interface Chronicle1MerchantDefinition {
  readonly id: MerchantId;
  readonly name: string;
  readonly stockPoolId: MerchantStockPoolId;
  readonly dialogueSetId: MerchantDialogueSetId;
  readonly illustrationId: IllustrationId;
  readonly restockGateIds: readonly EventId[];
}

export interface ContentIndex {
  readonly events: ReadonlyMap<EventId, ChronicleEvent>;
  readonly items: ReadonlyMap<ItemId, ItemDefinition>;
  readonly enemies: ReadonlyMap<EnemyId, EnemyDefinition>;
  readonly encounters: ReadonlyMap<EncounterId, EncounterDefinition>;
  readonly companions: ReadonlyMap<CompanionId, CompanionDefinition>;
  readonly merchants: ReadonlyMap<MerchantId, MerchantDefinition>;
  readonly artIds: ReadonlySet<string>;
  readonly audioIds: ReadonlySet<string>;
}

export type {
  CallbackId,
  ChapterId,
  ChoiceId,
  CompanionId,
  DecisionId,
  EncounterId,
  EnemyId,
  EventId,
  FactionId,
  IllustrationId,
  ItemId,
  MerchantDialogueSetId,
  MerchantId,
  MerchantStockPoolId,
  SceneFamilyId,
  VoiceCueId,
};
export type { EnemyDefinition, ItemDefinition } from "../types";
