import type { ContentIndex } from '../game/content/schema';
import type { DomainEvent } from '../game/domain/result';
import type { RouteProfileId } from '../game/director/types';
import type { GameCommand, GameStateV2 } from '../game/state/types';
import type { HeroClass, ItemCategory } from '../game/types';

export interface SaveSlotSummary {
  readonly slot: 1 | 2 | 3;
  readonly status: 'empty' | 'ready' | 'recoverable' | 'legacy';
  readonly heroName?: string;
  readonly heroClass?: HeroClass;
  readonly chapterLabel?: string;
  readonly level?: number;
  readonly savedAt?: string;
  readonly notice?: string;
}

export interface UiSettings {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly hapticsEnabled: boolean;
  readonly reducedHaptics: boolean;
  readonly sfxVolume: number;
  readonly musicVolume: number;
  readonly voiceVolume: number;
  readonly captions: boolean;
  readonly voiceReplay: 'automatic' | 'manual';
  readonly screenReaderAnnouncements: boolean;
}

export type FeedbackCue =
  | { readonly type: 'sfx'; readonly cueId: string; readonly volume: number }
  | {
      readonly type: 'haptic';
      readonly pattern: 'light' | 'medium' | 'minimal' | 'double' | 'strong' | 'heavy' | 'level-up';
    }
  | { readonly type: 'announce'; readonly message: string };

export interface CinematicShot {
  readonly id: string;
  readonly imageId: string;
  readonly alt: string;
  readonly caption: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly motion: 'pan-left' | 'pan-right' | 'push-in' | 'pull-back' | 'focus-shift' | 'still';
  readonly sfxCueIds: readonly string[];
  readonly haptic?: 'minimal' | 'medium' | 'strong';
}

export interface CinematicSequence {
  readonly id: 'chronicle-1-opening';
  readonly durationMs: number;
  readonly musicId: string;
  readonly musicSrc?: string;
  readonly musicLoop?: boolean;
  readonly voiceId: string;
  readonly shots: readonly CinematicShot[];
}

export interface CinematicAudioPort {
  preload(sequence: CinematicSequence): Promise<void>;
  play(sequence: CinematicSequence, fromMs: number): Promise<void>;
  pause(): void;
  seek(positionMs: number): void;
  stop(): void;
  setVolumes(levels: { readonly music: number; readonly voice: number; readonly sfx: number }): void;
}

export interface UiPorts {
  readonly feedback: { consume(cues: readonly FeedbackCue[]): void };
  readonly cinematicAudio: CinematicAudioPort;
  readonly now: () => number;
}

export interface GameShellProps {
  readonly state: GameStateV2;
  readonly content: ContentIndex;
  readonly transitionEvents: readonly DomainEvent[];
  readonly dispatch: (command: GameCommand) => void;
  readonly onSaveAndExit: () => void;
  readonly onMainMenu: () => void;
  readonly onReplayOpening: () => void;
}

export interface HeroHudViewModel {
  readonly name: string;
  readonly heroClass: HeroClass;
  readonly heroClassLabel: string;
  readonly level: number;
  readonly xp: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly resource: number;
  readonly maxResource: number;
  readonly resourceLabel: 'Stamina' | 'Mana' | 'Focus';
  readonly bankedGold: number;
  readonly carriedGold: number;
  readonly totalGold: number;
  readonly chapterLabel: string;
  readonly locationLabel: string;
}

export interface ObjectiveViewModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly completed: boolean;
}

export interface CompanionSummaryViewModel {
  readonly id: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly injured: boolean;
}

export interface CampViewModel {
  readonly hero: HeroHudViewModel;
  readonly objective: ObjectiveViewModel;
  readonly activeCompanion: CompanionSummaryViewModel | null;
  readonly hasStashItems: boolean;
  readonly canDepart: boolean;
}

export interface RouteOptionViewModel {
  readonly id: RouteProfileId;
  readonly label: string;
  readonly description: string;
  readonly riskLabel: string;
  readonly recoveryLabel: string;
  readonly tradeLabel: string;
  readonly companionLabel: string;
  readonly relicLabel: string;
}

export interface RouteViewModel {
  readonly hero: HeroHudViewModel;
  readonly objective: ObjectiveViewModel;
  readonly routes: readonly RouteOptionViewModel[];
}

export interface StoryChoiceViewModel {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly outcome: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly unavailableReason: string | null;
}

export interface StoryViewModel {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly illustrationId: string;
  readonly illustrationAlt: string;
  readonly choices: readonly StoryChoiceViewModel[];
  readonly resolved: boolean;
  readonly outcome: string | null;
}

export interface StatusViewModel {
  readonly id: string;
  readonly label: string;
  readonly duration: number;
  readonly potency: number;
}

export interface EnemyIntentViewModel {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface EnemyCombatViewModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly illustrationId: string;
  readonly illustrationKind: 'chronicle-portrait' | 'art-family';
  readonly artFamily: string;
  readonly role: string;
  readonly roleLabel: string;
  readonly health: number;
  readonly maxHealth: number;
  readonly statuses: readonly StatusViewModel[];
  readonly intent: EnemyIntentViewModel;
  readonly isBoss: boolean;
  readonly phase: number;
}

export interface CompanionCombatViewModel {
  readonly id: string;
  readonly name: string;
  readonly commandId: string;
  readonly commandLabel: string;
  readonly cooldownRemaining: number;
  readonly available: boolean;
  readonly unavailableReason: string | null;
  readonly injured: boolean;
}

export interface CombatActionViewModel {
  readonly id: 'attack' | 'guard' | 'technique' | 'consumable' | 'companion' | 'flee';
  readonly label: string;
  readonly available: boolean;
  readonly unavailableReason: string | null;
  readonly turnCostLabel: string | null;
}

export interface CombatViewModel {
  readonly hero: HeroHudViewModel;
  readonly companion: CompanionCombatViewModel | null;
  readonly enemies: readonly EnemyCombatViewModel[];
  readonly selectedTargetId: string;
  readonly actions: readonly CombatActionViewModel[];
  readonly log: readonly string[];
}

export interface StatLineViewModel {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly displayValue: string;
}

export interface ItemRowViewModel {
  readonly entryId: string | null;
  readonly itemId: string;
  readonly name: string;
  readonly category: ItemCategory;
  readonly categoryLabel: string;
  readonly description: string;
  readonly quantity: number;
  readonly iconId: string | null;
  readonly rarityLabel: string;
  readonly tier: 1 | 2 | 3 | 4 | 5 | null;
  readonly allowedClasses: readonly HeroClass[];
  readonly minimumLevel: number | null;
  readonly minimumChapter: number | null;
  readonly restrictionLabel: string;
  readonly stats: readonly StatLineViewModel[];
  readonly tags: readonly string[];
  readonly usable: boolean;
  readonly equippable: boolean;
}

export interface EquipmentViewModel {
  readonly weapon: ItemRowViewModel | null;
  readonly armor: ItemRowViewModel | null;
  readonly charms: readonly ItemRowViewModel[];
}

export interface InventoryViewModel {
  readonly usedSlots: number;
  readonly capacity: 24;
  readonly pack: readonly ItemRowViewModel[];
  readonly stash: readonly ItemRowViewModel[];
  readonly equipment: EquipmentViewModel;
  readonly questItems: readonly ItemRowViewModel[];
  readonly derivedStats: readonly StatLineViewModel[];
}

export interface MerchantStockViewModel extends ItemRowViewModel {
  readonly stockEntryId: string;
  readonly price: number;
  readonly affordable: boolean;
}

export interface MerchantSaleViewModel extends ItemRowViewModel {
  readonly priceEach: number;
  readonly stackPrice: number;
}

export interface MerchantViewModel {
  readonly id: string;
  readonly name: string;
  readonly illustrationId: string;
  readonly illustrationAlt: string;
  readonly dialogue: readonly string[];
  readonly bankedGold: number;
  readonly carriedGold: number;
  readonly totalGold: number;
  readonly stock: readonly MerchantStockViewModel[];
  readonly sellable: readonly MerchantSaleViewModel[];
  readonly emptyStockMessage: string | null;
}

export interface ConsequenceViewModel {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly sceneTitle: string;
}

export interface EvidenceViewModel {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
}

export interface CompanionQuestViewModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly stage: 1 | 2 | 3;
  readonly completed: boolean;
}

export interface CompanionJournalViewModel {
  readonly id: string;
  readonly name: string;
  readonly status: 'unknown' | 'recruited' | 'left' | 'dead';
  readonly statusLabel: string;
  readonly loyaltyLabel: 'Wary' | 'Respectful' | 'Loyal';
  readonly injured: boolean;
  readonly active: boolean;
  readonly commandId: string;
  readonly commandLabel: string;
  readonly commandCooldown: number | null;
  readonly loyaltyDescription: string;
  readonly explorationCapability: {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  } | null;
  readonly passive: {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  } | null;
  readonly recruitmentCostLabel: string | null;
  readonly personalQuests: readonly CompanionQuestViewModel[];
}

export interface CodexEntryViewModel {
  readonly id: string;
  readonly category: 'event' | 'enemy';
  readonly title: string;
  readonly description: string;
  readonly illustrationId: string | null;
}

export interface JournalViewModel {
  readonly objective: ObjectiveViewModel;
  readonly consequences: readonly ConsequenceViewModel[];
  readonly evidence: readonly EvidenceViewModel[];
  readonly companions: readonly CompanionJournalViewModel[];
  readonly codex: readonly CodexEntryViewModel[];
}
