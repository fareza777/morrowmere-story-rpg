import type { GameEffect } from '../domain/effects';
import type {
  ChapterId,
  ChoiceId,
  CompanionId,
  EncounterId,
  EnemyId,
  EventId,
  ItemId,
  MerchantId,
} from '../domain/ids';
import type { EnemyDefinition, ItemDefinition } from '../types';

export type ChronicleEventType = 'main' | 'companion' | 'journey' | 'combat' | 'hub';

export interface EventEligibility {
  readonly routes?: readonly string[];
  readonly minLevel?: number;
  readonly maxLevel?: number;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
}

export interface ChronicleChoice {
  readonly id: ChoiceId;
  readonly label: string;
  readonly detail: string;
  readonly effects: readonly GameEffect[];
  readonly outcome: string;
}

export interface ChronicleEvent {
  readonly id: EventId;
  readonly chapterId: ChapterId;
  readonly type: ChronicleEventType;
  readonly family: string;
  readonly anchorOrder?: number;
  readonly illustrationId: string;
  readonly audioId?: string;
  readonly title: string;
  readonly narrative: readonly string[];
  readonly eligibility: EventEligibility;
  readonly cooldownRuns: number;
  readonly oneShot: boolean;
  readonly choices: readonly ChronicleChoice[];
}

export interface EncounterDefinition {
  readonly id: EncounterId;
  readonly enemyIds: readonly EnemyId[];
}

export interface CompanionDefinition {
  readonly id: CompanionId;
  readonly name: string;
  readonly recruitment: {
    readonly requiredDecisionIds: readonly string[];
  };
  readonly personalQuestIds: readonly EventId[];
}

export interface MerchantDefinition {
  readonly id: MerchantId;
  readonly name: string;
  readonly stockItemIds: readonly ItemId[];
}

export interface ContentIndex {
  readonly events: ReadonlyMap<EventId, ChronicleEvent>;
  readonly items: ReadonlyMap<ItemId, ItemDefinition>;
  readonly enemies: ReadonlyMap<EnemyId, EnemyDefinition>;
  readonly encounters: ReadonlyMap<EncounterId, EncounterDefinition>;
  readonly companions: ReadonlyMap<CompanionId, CompanionDefinition>;
  readonly merchants: ReadonlyMap<MerchantId, MerchantDefinition>;
  readonly artIds: ReadonlySet<string>;
  readonly audioIds: ReadonlySet<string>;
}

export type { ChapterId, ChoiceId, CompanionId, EncounterId, EnemyId, EventId, ItemId, MerchantId };
export type { EnemyDefinition, ItemDefinition } from '../types';
