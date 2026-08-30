export type HeroClass = 'warrior' | 'mage' | 'warden';

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

export type EnemyIntent = 'strike' | 'heavy' | 'guard' | 'hex' | 'recover' | 'flee';

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
