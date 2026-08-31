import type {
  CompanionId,
  EncounterId,
  FactionId,
  FlagId,
  ItemId,
  StoryPosition,
  EventId,
} from './ids';

export type CompanionOperation = 'recruit' | 'dismiss';

export interface CallbackPromiseDefinition {
  readonly targetEventId: EventId;
  readonly deadline: StoryPosition;
}

export type GameEffect =
  | { readonly type: 'gold'; readonly scope: 'banked' | 'unbanked'; readonly amount: number }
  | { readonly type: 'item'; readonly operation: 'grant' | 'remove'; readonly itemId: ItemId; readonly quantity: number }
  | { readonly type: 'flag'; readonly operation: 'add' | 'remove'; readonly flagId: FlagId }
  | { readonly type: 'faction'; readonly factionId: FactionId; readonly amount: number }
  | { readonly type: 'companion'; readonly companionId: CompanionId; readonly operation: CompanionOperation }
  | { readonly type: 'vitals'; readonly health?: number; readonly resource?: number }
  | { readonly type: 'callback'; readonly promise: CallbackPromiseDefinition }
  | { readonly type: 'combat'; readonly encounterId: EncounterId };
