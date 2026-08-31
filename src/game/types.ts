import type { CombatIntent } from './domain/combat';

export type HeroClass = 'warrior' | 'mage' | 'warden';

export type {
  ChapterId,
  ChoiceId,
  CompanionId,
  EncounterId,
  EnemyId,
  EventId,
  FactionId,
  FlagId,
  ItemId,
  MerchantId,
  StoryPosition,
} from './domain/ids';

export type RegionId = 'gloamwood' | 'drowned-road' | 'embervault' | 'crownless-keep';

export type EnemySpecies =
  | 'goblin'
  | 'orc'
  | 'human'
  | 'mage'
  | 'beast'
  | 'troll'
  | 'construct'
  | 'undead'
  | 'cultist'
  | 'demon';

export type EnemyIntent = CombatIntent;

export interface EnemyDefinition {
  readonly id: string;
  readonly archetypeId: string;
  readonly name: string;
  readonly rank: number;
  readonly level: number;
  readonly species: EnemySpecies;
  readonly region: RegionId;
  readonly maxHealth: number;
  readonly attack: number;
  readonly armor: number;
  readonly ward: number;
  readonly intentWeights: Readonly<Partial<Record<EnemyIntent, number>>>;
  readonly traits: readonly string[];
  readonly rewardTags: readonly string[];
  readonly description: string;
  readonly artFamily: string;
}

export type ItemCategory = 'weapon' | 'armor' | 'charm' | 'potion' | 'scroll' | 'quest';

export interface ItemStats {
  readonly attack?: number;
  readonly will?: number;
  readonly armor?: number;
  readonly ward?: number;
  readonly health?: number;
  readonly focus?: number;
}

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: ItemCategory;
  readonly description: string;
  readonly allowedClasses: readonly HeroClass[];
  readonly stats: ItemStats;
  readonly value: number;
  readonly tags: readonly string[];
}

export interface RewardContext {
  readonly heroClass: HeroClass;
  readonly level: number;
  readonly seed: number;
}

export interface FactionStanding {
  readonly abbey: number;
  readonly freeHost: number;
  readonly conclave: number;
}

export type SkillStat = 'strength' | 'cunning' | 'will';

export interface EventEffect {
  readonly attack?: number;
  readonly armor?: number;
  readonly ward?: number;
  readonly health?: number;
  readonly focus?: number;
  readonly supplies?: number;
  readonly gold?: number;
  readonly mercy?: number;
  readonly corruption?: number;
  readonly addFlags?: readonly string[];
  readonly faction?: Partial<FactionStanding>;
  readonly startCombat?: string;
  readonly rewardTag?: string;
}

export interface EventChoice {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly check?: { readonly stat: SkillStat; readonly difficulty: number };
  readonly effect: EventEffect;
  readonly outcome: string;
}
