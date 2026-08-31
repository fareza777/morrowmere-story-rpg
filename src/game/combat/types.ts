import type { CompanionCombatSnapshot } from '../companions';
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
}

export type CombatOutcome = 'active' | 'victory' | 'defeat' | 'fled';
export type AttackOutcome = 'miss' | 'glancing' | 'hit' | 'critical' | 'blocked' | 'parried';

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

export type DomainEvent =
  | { readonly type: 'attack_resolved'; readonly attackerId: string; readonly targetId: string; readonly outcome: AttackOutcome; readonly damage: number; readonly powerVariation: number }
  | { readonly type: 'combat_action_rejected'; readonly reason: 'invalid_target' | 'insufficient_resource' | 'item_unavailable' | 'companion_unavailable' | 'companion_cooling_down' | 'companion_support_budget' | 'boss_cannot_flee' }
  | { readonly type: 'combatant_defeated'; readonly combatantId: string }
  | { readonly type: 'status_ticked'; readonly combatantId: string; readonly statusId: string; readonly remainingDuration: number }
  | { readonly type: 'intent_revealed'; readonly enemyId: string; readonly intent: EnemyIntent }
  | { readonly type: 'consumable_used'; readonly instanceId: string }
  | { readonly type: 'companion_commanded'; readonly companionId: string; readonly damage: number }
  | { readonly type: 'flee_resolved'; readonly escaped: boolean }
  | { readonly type: 'boss_phase_changed'; readonly enemyId: string; readonly phase: number };

export interface CombatTurnResult {
  readonly combat: CombatState;
  readonly inventory: InventoryState;
  readonly events: readonly DomainEvent[];
}

export interface CombatContent {
  readonly items: ReadonlyMap<string, ItemDefinition>;
}
