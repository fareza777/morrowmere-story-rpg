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
  | { readonly type: 'item'; readonly operation: 'grant' | 'remove'; readonly itemId: ItemId; readonly quantity: number; readonly destination?: 'pack' | 'unbanked-loot' }
  | { readonly type: 'xp'; readonly amount: number; readonly source?: 'story' | 'quest' | 'companion' }
  | { readonly type: 'flag'; readonly operation: 'add' | 'remove'; readonly flagId: FlagId }
  | { readonly type: 'evidence'; readonly operation: 'add' | 'remove'; readonly evidenceId: string }
  | { readonly type: 'faction'; readonly factionId: FactionId; readonly amount: number }
  | { readonly type: 'companion'; readonly companionId: CompanionId; readonly operation: CompanionOperation }
  | { readonly type: 'companion-loyalty'; readonly companionId: CompanionId; readonly amount: number }
  | { readonly type: 'companion-quest'; readonly companionId: CompanionId; readonly stage: 0 | 1 | 2 | 3 }
  | { readonly type: 'companion-injury'; readonly companionId: CompanionId; readonly injured: boolean }
  | { readonly type: 'threat'; readonly amount: number }
  | { readonly type: 'tension'; readonly amount: number }
  | { readonly type: 'vitals'; readonly health?: number; readonly resource?: number }
  | { readonly type: 'callback'; readonly promise: CallbackPromiseDefinition }
  | { readonly type: 'combat'; readonly encounterId: EncounterId };
