import type { ChoiceId, EncounterId, EventId, ItemId } from './ids';

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
  | { readonly type: 'notification'; readonly message: string };
