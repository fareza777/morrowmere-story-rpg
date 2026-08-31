import type { AttackOutcome, CombatIntent } from './combat';
import type { ChoiceId, CompanionId, EncounterId, EventId, ItemId } from './ids';

export interface CommandDiagnostic {
  readonly code: string;
  readonly message: string;
}

export type DomainResult<T, E extends CommandDiagnostic = CommandDiagnostic> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type DomainEvent =
  | { readonly type: 'choice_resolved'; readonly eventId: EventId; readonly choiceId: ChoiceId }
  | { readonly type: 'item_changed'; readonly itemId: ItemId; readonly quantity: number }
  | { readonly type: 'combat_started'; readonly encounterId: EncounterId }
  | { readonly type: 'notification'; readonly message: string }
  | { readonly type: 'attack_resolved'; readonly attackerId: string; readonly targetId: string; readonly outcome: AttackOutcome; readonly damage: number; readonly powerVariation: number }
  | { readonly type: 'combat_action_rejected'; readonly reason: 'invalid_target' | 'insufficient_resource' | 'item_unavailable' | 'companion_unavailable' | 'companion_cooling_down' | 'companion_support_budget' | 'boss_cannot_flee' }
  | { readonly type: 'combatant_defeated'; readonly combatantId: string }
  | { readonly type: 'status_ticked'; readonly combatantId: string; readonly statusId: string; readonly remainingDuration: number }
  | { readonly type: 'intent_revealed'; readonly enemyId: string; readonly intent: CombatIntent }
  | { readonly type: 'consumable_used'; readonly instanceId: string }
  | { readonly type: 'companion_commanded'; readonly companionId: CompanionId; readonly damage: number }
  | { readonly type: 'flee_resolved'; readonly escaped: boolean }
  | { readonly type: 'boss_phase_changed'; readonly enemyId: string; readonly phase: number };
