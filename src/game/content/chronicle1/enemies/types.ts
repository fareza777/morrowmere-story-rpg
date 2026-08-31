import type { EnemyRole } from '../../../combat/types';
import type { ChapterId, EncounterId, EnemyId } from '../../../domain/ids';
import type { EncounterDefinition } from '../../schema';
import type { EnemyDefinition, EnemyIntent, EnemySpecies, RegionId } from '../../../types';

export type EnemyCompatibilityTag =
  | 'arcane'
  | 'backline'
  | 'beast'
  | 'construct'
  | 'elite'
  | 'expeditionary'
  | 'false-flag'
  | 'fire'
  | 'frontline'
  | 'hard-control'
  | 'leader'
  | 'mobile'
  | 'ranged'
  | 'siege'
  | 'specialist'
  | 'summons'
  | 'support'
  | 'undead'
  | 'unique'
  | 'water';

export type EnemyStatusId =
  | 'bleeding'
  | 'burning'
  | 'guard-broken'
  | 'hindered'
  | 'marked'
  | 'poisoned'
  | 'silenced'
  | 'staggered';

export interface EnemyStatusInteraction {
  readonly statusId: EnemyStatusId;
  readonly relation: 'applies' | 'cleanses' | 'exploits' | 'resists';
  readonly detail: string;
}

export interface Chronicle1EnemyArchetype {
  readonly id: string;
  readonly baseName: string;
  readonly species: EnemySpecies;
  readonly region: RegionId;
  readonly eligibleRegions: readonly RegionId[];
  readonly role: EnemyRole;
  readonly compatibilityTags: readonly EnemyCompatibilityTag[];
  readonly incompatibleTags: readonly EnemyCompatibilityTag[];
  readonly statusInteractions: readonly EnemyStatusInteraction[];
  readonly battlefieldRule: string;
  readonly portraitIds: readonly [string, string, string, string];
}

export interface Chronicle1EnemyDefinition extends EnemyDefinition {
  readonly portraitId: string;
  readonly eligibleRegions: readonly RegionId[];
  readonly role: EnemyRole;
  readonly compatibilityTags: readonly EnemyCompatibilityTag[];
  readonly incompatibleTags: readonly EnemyCompatibilityTag[];
  readonly statusInteractions: readonly EnemyStatusInteraction[];
  readonly battlefieldRule: string;
  readonly threatCost: number;
}

export interface BossPhaseDefinition {
  readonly id: string;
  readonly label: string;
  readonly startsAtHealthPercent: number;
  readonly telegraph: string;
  readonly counterplay: string;
  readonly intentWeights: Readonly<Partial<Record<EnemyIntent, number>>>;
}

export interface BossAntiCheeseRule {
  readonly trigger: string;
  readonly response: string;
  readonly counterplay: string;
}

export interface Chronicle1BossDefinition extends Chronicle1EnemyDefinition {
  readonly isBoss: true;
  readonly phases: readonly BossPhaseDefinition[];
  readonly antiCheese: BossAntiCheeseRule;
}

export interface Chronicle1EncounterDefinition extends EncounterDefinition {
  readonly id: EncounterId;
  readonly chapterId: ChapterId;
  readonly region: RegionId;
  readonly levelBand: { readonly min: number; readonly max: number };
  readonly threatBudget: number;
  readonly openingDamageCap: number;
  readonly compatibilityTags: readonly EnemyCompatibilityTag[];
  readonly counterplay: string;
  readonly enemyIds: readonly EnemyId[];
}

export interface ChapterThreatBudget {
  readonly levelBand: { readonly min: number; readonly max: number };
  readonly region: RegionId;
  readonly maxThreat: number;
  readonly maxOpeningDamage: number;
}

export type EncounterValidationIssueCode =
  | 'duplicate_encounter_id'
  | 'duplicate_unique_boss'
  | 'empty_encounter'
  | 'incompatible_enemy_group'
  | 'invalid_boss_identity'
  | 'invalid_chapter_budget'
  | 'invalid_enemy_region'
  | 'missing_enemy'
  | 'permanent_control_loop'
  | 'threat_budget_exceeded'
  | 'unsafe_opening_damage';

export interface EncounterValidationIssue {
  readonly code: EncounterValidationIssueCode;
  readonly encounterId: string;
  readonly message: string;
}
