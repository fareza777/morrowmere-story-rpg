import type { CompanionCombatSnapshot } from '../companions';
import type { DomainEvent } from '../domain/result';
import type { InventoryState } from '../inventory';
import type { EnemyDefinition, EnemyIntent, HeroClass, ItemDefinition } from '../types';

export interface StatusEffect {
  readonly id: string;
  readonly label: string;
  readonly duration: number;
  readonly potency: number;
}

/** Kept structural so the original vertical-slice hero can enter tactical combat. */
export interface HeroCombatant {
  readonly class: HeroClass;
  readonly name: string;
  readonly level: number;
  readonly xp: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly focus: number;
  readonly maxFocus: number;
  readonly strength: number;
  readonly cunning: number;
  readonly will: number;
  readonly armor: number;
  readonly ward: number;
  readonly attackBonus: number;
  readonly guarding: boolean;
  readonly statuses: readonly StatusEffect[];
  readonly inventory: readonly string[];
  readonly equipment: { readonly weapon: string | null; readonly armor: string | null; readonly charms: readonly string[] };
  readonly attackAccuracy?: number;
  readonly criticalChance?: number;
}

export type EnemyRole = 'defender' | 'assassin' | 'archer' | 'shaman' | 'controller' | 'summoner' | 'commander' | 'specialist';

export interface EnemyCombatant extends EnemyDefinition {
  readonly health: number;
  readonly guarding: boolean;
  readonly isBoss: boolean;
  readonly statuses: readonly StatusEffect[];
  readonly role: EnemyRole;
  readonly evasion: number;
  readonly blockChance: number;
  readonly parryChance: number;
  readonly phase: number;
  /** Summoners spend this finite counter before they can call another minion. */
  readonly roleUses?: number;
}

export type CombatOutcome = 'active' | 'victory' | 'defeat' | 'fled';
export type { AttackOutcome } from '../domain/combat';
export type { DomainEvent } from '../domain/result';

export interface EnemyIntentView {
  readonly enemyId: string;
  readonly intent: EnemyIntent;
  readonly text: string;
}

export interface CombatState {
  readonly turn: number;
  readonly rngState: number;
  readonly player: HeroCombatant;
  /** `enemy` and `enemyIntent` remain until the UI migrates to group fields. */
  readonly enemy: EnemyCombatant;
  readonly enemies: readonly EnemyCombatant[];
  readonly enemyIntent: EnemyIntent;
  readonly enemyIntents: readonly EnemyIntentView[];
  readonly intentText: string;
  readonly outcome: CombatOutcome;
  readonly log: readonly string[];
  readonly missedAttacks: number;
  readonly companion: CompanionCombatSnapshot | null;
  readonly companionCooldown: number;
  readonly companionDamageDealt: number;
  readonly companionSupportBudget: number;
}

export type CombatAction =
  | { readonly type: 'attack'; readonly targetId?: string }
  | { readonly type: 'guard' }
  | { readonly type: 'technique'; readonly techniqueId: string; readonly targetId?: string }
  | { readonly type: 'consumable'; readonly instanceId: string; readonly targetId?: string }
  | { readonly type: 'companion'; readonly targetId?: string }
  | { readonly type: 'flee' }
  /** Legacy vertical-slice command. */
  | { readonly type: 'item'; readonly itemId: string };

export interface CombatTurnResult {
  readonly combat: CombatState;
  readonly inventory: InventoryState;
  readonly events: readonly DomainEvent[];
}

export interface CombatContent {
  readonly items: ReadonlyMap<string, ItemDefinition>;
}
