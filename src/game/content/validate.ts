import type { GameEffect } from '../domain/effects';
import type { ContentIndex } from './schema';

export type ContentIssueCode =
  | 'duplicate_event_id'
  | 'duplicate_item_id'
  | 'duplicate_enemy_id'
  | 'duplicate_encounter_id'
  | 'duplicate_companion_id'
  | 'duplicate_merchant_id'
  | 'duplicate_choice_id'
  | 'missing_art'
  | 'missing_audio'
  | 'missing_item'
  | 'missing_companion'
  | 'missing_encounter'
  | 'missing_enemy'
  | 'missing_callback_target'
  | 'missing_merchant_stock';

export interface ContentIssue {
  readonly code: ContentIssueCode;
  readonly message: string;
}

function duplicateIssues<T extends { readonly id: string }>(
  entries: Iterable<T>,
  code: Extract<ContentIssueCode, `duplicate_${string}_id`>,
): ContentIssue[] {
  const seen = new Set<string>();
  const issues: ContentIssue[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      issues.push({ code, message: `Duplicate ID: ${entry.id}` });
    }
    seen.add(entry.id);
  }
  return issues;
}

function effectIssues(effect: GameEffect, index: ContentIndex): ContentIssue[] {
  if (effect.type === 'item' && !index.items.has(effect.itemId)) {
    return [{ code: 'missing_item', message: `Missing item: ${effect.itemId}` }];
  }
  if (effect.type === 'companion' && !index.companions.has(effect.companionId)) {
    return [{ code: 'missing_companion', message: `Missing companion: ${effect.companionId}` }];
  }
  if (effect.type === 'combat' && !index.encounters.has(effect.encounterId)) {
    return [{ code: 'missing_encounter', message: `Missing encounter: ${effect.encounterId}` }];
  }
  if (effect.type === 'callback' && !index.events.has(effect.promise.targetEventId)) {
    return [{ code: 'missing_callback_target', message: `Missing callback event: ${effect.promise.targetEventId}` }];
  }
  return [];
}

export function validateContent(index: ContentIndex): ContentIssue[] {
  const issues = [
    ...duplicateIssues(index.events.values(), 'duplicate_event_id'),
    ...duplicateIssues(index.items.values(), 'duplicate_item_id'),
    ...duplicateIssues(index.enemies.values(), 'duplicate_enemy_id'),
    ...duplicateIssues(index.encounters.values(), 'duplicate_encounter_id'),
    ...duplicateIssues(index.companions.values(), 'duplicate_companion_id'),
    ...duplicateIssues(index.merchants.values(), 'duplicate_merchant_id'),
  ];

  for (const event of index.events.values()) {
    if (!index.artIds.has(event.illustrationId)) {
      issues.push({ code: 'missing_art', message: `Missing art: ${event.illustrationId}` });
    }
    if (event.audioId && !index.audioIds.has(event.audioId)) {
      issues.push({ code: 'missing_audio', message: `Missing audio: ${event.audioId}` });
    }
    issues.push(...duplicateIssues(event.choices, 'duplicate_choice_id'));
    for (const choice of event.choices) {
      for (const effect of choice.effects) issues.push(...effectIssues(effect, index));
    }
  }

  for (const encounter of index.encounters.values()) {
    for (const enemyId of encounter.enemyIds) {
      if (!index.enemies.has(enemyId)) {
        issues.push({ code: 'missing_enemy', message: `Missing enemy: ${enemyId}` });
      }
    }
  }

  for (const merchant of index.merchants.values()) {
    for (const itemId of merchant.stockItemIds) {
      if (!index.items.has(itemId)) {
        issues.push({ code: 'missing_merchant_stock', message: `Missing merchant stock item: ${itemId}` });
      }
    }
  }

  return issues;
}
