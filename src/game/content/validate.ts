import type { GameEffect } from '../domain/effects';
import type {
  Chronicle1CompanionDefinition,
  Chronicle1Event,
  Chronicle1MerchantDefinition,
  ChronicleCallbackPromise,
  ChronicleDefinition,
  ChronicleFactionDefinition,
  ChronicleRouteDefinition,
  ContentIndex,
} from './schema';
import {
  chronicle1ChoiceEffects,
  chronicleCheckBranches,
  chronicleChoiceEffects,
  isChronicleCheckedChoice,
  isChronicle1CheckedChoice,
} from './schema';
import { ROUTE_OPTIONS } from '../director/pacing';
import { voiceCueForId } from '../audio/catalog';

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
  | 'invalid_item_destination'
  | 'missing_companion'
  | 'missing_encounter'
  | 'missing_enemy'
  | 'missing_callback_target'
  | 'missing_merchant_stock'
  | 'missing_event_merchant'
  | 'invalid_event_merchant'
  | 'invalid_encounter_family'
  | 'invalid_encounter_reward'
  | 'invalid_boss_identity'
  | 'invalid_route'
  | 'invalid_id'
  | 'source_key_mismatch'
  | 'duplicate_illustration_id'
  | 'duplicate_media_id'
  | 'invalid_chapter_region'
  | 'invalid_scene_slot'
  | 'invalid_scene_weight'
  | 'duplicate_scene_slot'
  | 'missing_anchor'
  | 'missing_companion_quest_scene'
  | 'missing_companion_outcome_scene'
  | 'missing_merchant_restock_gate'
  | 'invalid_anchor_order'
  | 'invalid_anchor_type'
  | 'invalid_choice_count'
  | 'invalid_journey_subtype'
  | 'invalid_callback_window'
  | 'unreachable_callback'
  | 'missing_follow_up'
  | 'invalid_dialogue'
  | 'invalid_dialogue_speaker'
  | 'invalid_dialogue_text'
  | 'invalid_dialogue_sentence_count'
  | 'invalid_dialogue_voice_text';

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
  if (effect.type === 'item') {
    const item = index.items.get(effect.itemId);
    if (!item) return [{ code: 'missing_item', message: `Missing item: ${effect.itemId}` }];
    if (item.category === 'quest' && effect.destination === 'unbanked-loot') {
      return [{ code: 'invalid_item_destination', message: `Quest items cannot be unbanked loot: ${effect.itemId}` }];
    }
  }
  if (
    (
      effect.type === 'companion'
      || effect.type === 'companion-loyalty'
      || effect.type === 'companion-quest'
      || effect.type === 'companion-injury'
    )
    && !index.companions.has(effect.companionId)
  ) {
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

function dialogueSentenceCount(text: string): number {
  return text.trim().split(/[.!?]+(?:\s+|$)/u).filter(Boolean).length;
}

function dialogueIssues(event: ChronicleEvent, index: ContentIndex): ContentIssue[] {
  if (event.dialogue === undefined) return [];
  if (event.dialogue.length === 0) return [{ code: 'invalid_dialogue', message: `Scene ${event.id} has an empty dialogue list.` }];
  const issues: ContentIssue[] = [];
  for (const beat of event.dialogue) {
    if (!beat.speakerName.trim()) issues.push({ code: 'invalid_dialogue_speaker', message: `Scene ${event.id} has dialogue without a speaker.` });
    if (!beat.text.trim()) issues.push({ code: 'invalid_dialogue_text', message: `Scene ${event.id} has dialogue without text.` });
    if (dialogueSentenceCount(beat.text) < 1 || dialogueSentenceCount(beat.text) > 3) issues.push({ code: 'invalid_dialogue_sentence_count', message: `Scene ${event.id} has dialogue outside the one-to-three sentence limit.` });
    if (beat.characterLayer?.companionId && !index.companions.has(beat.characterLayer.companionId)) issues.push({ code: 'missing_companion', message: `Missing dialogue companion: ${beat.characterLayer.companionId}` });
    if (beat.characterLayer && !index.artIds.has(beat.characterLayer.illustrationId)) issues.push({ code: 'missing_art', message: `Missing dialogue character art: ${beat.characterLayer.illustrationId}` });
    if (beat.environmentIllustrationId && !index.artIds.has(beat.environmentIllustrationId)) issues.push({ code: 'missing_art', message: `Missing dialogue environment art: ${beat.environmentIllustrationId}` });
    if (beat.voiceCueId) {
      const cue = voiceCueForId(beat.voiceCueId);
      if (!cue) issues.push({ code: 'missing_audio', message: `Missing dialogue voice cue: ${beat.voiceCueId}` });
      else if (!cue.captionText.includes(beat.text) && !cue.spokenText.includes(beat.text) && !beat.text.includes(cue.captionText)) issues.push({ code: 'invalid_dialogue_voice_text', message: `Dialogue voice cue does not match beat text: ${beat.voiceCueId}` });
    }
  }
  return issues;
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
    issues.push(...dialogueIssues(event, index));
    if (event.merchantId && !index.merchants.has(event.merchantId)) {
      issues.push({ code: 'missing_event_merchant', message: `Missing event merchant: ${event.merchantId}` });
    }
    if ((event.merchantId || event.merchantRestockKey) && (event.type !== 'hub' || !event.merchantId || !event.merchantRestockKey?.trim())) {
      issues.push({ code: 'invalid_event_merchant', message: `Invalid merchant metadata: ${event.id}` });
    }
    for (const route of event.eligibility.routes ?? []) {
      if (!ROUTE_OPTIONS.some((option) => option.id === route)) {
        issues.push({ code: 'invalid_route', message: `Invalid route profile: ${route}` });
      }
    }
    issues.push(...duplicateIssues(event.choices, 'duplicate_choice_id'));
    for (const choice of event.choices) {
      for (const effect of chronicleChoiceEffects(choice)) issues.push(...effectIssues(effect, index));
      if (isChronicleCheckedChoice(choice)) {
        for (const branch of chronicleCheckBranches(choice.check)) {
          if (branch.nextSceneId && !index.events.has(branch.nextSceneId)) {
            issues.push({ code: 'missing_callback_target', message: `Missing check branch scene: ${branch.nextSceneId}` });
          }
          if (branch.combatEncounterId && !index.encounters.has(branch.combatEncounterId)) {
            issues.push({ code: 'missing_encounter', message: `Missing check branch encounter: ${branch.combatEncounterId}` });
          }
        }
      } else if (choice.nextSceneId && !index.events.has(choice.nextSceneId)) {
        issues.push({ code: 'missing_callback_target', message: `Missing direct choice scene: ${choice.nextSceneId}` });
      }
    }
  }

  for (const encounter of index.encounters.values()) {
    if (!encounter.family.trim()) issues.push({ code: 'invalid_encounter_family', message: `Invalid encounter family: ${encounter.id}` });
    if (!Number.isSafeInteger(encounter.reward.xp) || encounter.reward.xp < 0 || !Number.isSafeInteger(encounter.reward.gold) || encounter.reward.gold < 0 || encounter.reward.itemChoices.some((itemId) => !index.items.has(itemId))) {
      issues.push({ code: 'invalid_encounter_reward', message: `Invalid encounter reward: ${encounter.id}` });
    }
    const bossOccurrences = encounter.bossEnemyId === undefined ? 0 : encounter.enemyIds.filter((enemyId) => enemyId === encounter.bossEnemyId).length;
    if ((encounter.kind === 'boss' && bossOccurrences !== 1) || (encounter.kind !== 'boss' && encounter.bossEnemyId !== undefined)) {
      issues.push({ code: 'invalid_boss_identity', message: `Invalid boss identity: ${encounter.id}` });
    }
    for (const enemyId of encounter.enemyIds) {
      if (!index.enemies.has(enemyId)) {
        issues.push({ code: 'missing_enemy', message: `Missing enemy: ${enemyId}` });
      }
    }
    for (const itemId of encounter.reward.itemChoices) {
      if (!index.items.has(itemId)) issues.push({ code: 'missing_item', message: `Missing item: ${itemId}` });
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

export interface ChronicleSourceInput {
  readonly chronicle: ChronicleDefinition;
  readonly routes: readonly ChronicleRouteDefinition[];
  readonly factions: readonly ChronicleFactionDefinition[];
  readonly companions: readonly Chronicle1CompanionDefinition[];
  readonly merchants: readonly Chronicle1MerchantDefinition[];
  /** Omit events while validating only the Task 1 metadata catalogs. */
  readonly events?: readonly Chronicle1Event[];
}

const SOURCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sourceIssue(code: ContentIssueCode, message: string): ContentIssue {
  return { code, message };
}

function validateSourceId(label: string, id: string, issues: ContentIssue[]): void {
  if (!SOURCE_ID_PATTERN.test(id)) {
    issues.push(sourceIssue('invalid_id', `Invalid ${label} ID: ${id}`));
  }
}

/** Validates dictionary keys without forcing authored scene arrays into wrappers. */
export function validateChronicleSourceKey(
  key: string,
  source: { readonly id: string },
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  validateSourceId('source key', key, issues);
  validateSourceId('source record', source.id, issues);
  if (key !== source.id) {
    issues.push(sourceIssue(
      'source_key_mismatch',
      `Source key ${key} does not match record ID ${source.id}.`,
    ));
  }
  return issues;
}

function chapterPosition(
  chronicle: ChronicleDefinition,
  chapterId: string,
  slot: number,
): readonly [number, number] | null {
  const chapter = chronicle.chapters.find((entry) => entry.id === chapterId);
  return chapter ? [chapter.order, slot] : null;
}

function positionAfter(
  left: readonly [number, number],
  right: readonly [number, number],
): boolean {
  return left[0] > right[0] || (left[0] === right[0] && left[1] > right[1]);
}

/**
 * Validates immutable source arrays before Map construction can hide duplicate
 * records. This deliberately remains independent from the V1 ContentIndex
 * validator above.
 */
export function validateChronicleSources(input: ChronicleSourceInput): ContentIssue[] {
  const issues: ContentIssue[] = [
    ...duplicateIssues(input.companions, 'duplicate_companion_id'),
    ...duplicateIssues(input.merchants, 'duplicate_merchant_id'),
  ];

  validateSourceId('chronicle', input.chronicle.id, issues);
  for (const chapter of input.chronicle.chapters) {
    validateSourceId('chapter', chapter.id, issues);
    for (const anchorId of chapter.anchorIds) validateSourceId('anchor', anchorId, issues);
  }
  for (const route of input.routes) validateSourceId('route', route.id, issues);
  for (const faction of input.factions) validateSourceId('faction', faction.id, issues);
  for (const companion of input.companions) {
    validateSourceId('companion', companion.id, issues);
    validateSourceId('companion action', companion.combat.actionId, issues);
    validateSourceId('exploration capability', companion.explorationCapability.id, issues);
    validateSourceId('passive', companion.passive.id, issues);
    for (const questId of companion.personalQuestIds) validateSourceId('personal quest', questId, issues);
    for (const outcomeId of companion.outcomeSceneIds) validateSourceId('companion outcome', outcomeId, issues);
  }
  for (const merchant of input.merchants) {
    validateSourceId('merchant', merchant.id, issues);
    validateSourceId('merchant stock pool', merchant.stockPoolId, issues);
    validateSourceId('merchant dialogue set', merchant.dialogueSetId, issues);
    validateSourceId('merchant illustration', merchant.illustrationId, issues);
    for (const gateId of merchant.restockGateIds) validateSourceId('merchant restock gate', gateId, issues);
  }

  if (!input.events) return issues;

  issues.push(...duplicateIssues(input.events, 'duplicate_event_id'));

  const eventIds = new Set(input.events.map((event) => event.id));
  const eventById = new Map(input.events.map((event) => [event.id, event]));
  const illustrationIds = new Set<string>();
  const mediaIds = new Set<string>();
  const chapterSlots = new Set<string>();
  const journeySubtypes = new Set(['travel', 'investigation', 'side-quest', 'dungeon', 'moral-choice']);

  for (const companion of input.companions) {
    for (const questId of companion.personalQuestIds) {
      if (!eventIds.has(questId)) {
        issues.push(sourceIssue(
          'missing_companion_quest_scene',
          `Companion ${companion.id} references missing quest scene ${questId}.`,
        ));
      }
    }
    for (const outcomeId of companion.outcomeSceneIds) {
      if (!eventIds.has(outcomeId)) {
        issues.push(sourceIssue(
          'missing_companion_outcome_scene',
          `Companion ${companion.id} references missing outcome scene ${outcomeId}.`,
        ));
      }
    }
  }
  for (const merchant of input.merchants) {
    for (const gateId of merchant.restockGateIds) {
      if (!eventIds.has(gateId)) {
        issues.push(sourceIssue(
          'missing_merchant_restock_gate',
          `Merchant ${merchant.id} references missing restock gate scene ${gateId}.`,
        ));
      }
    }
  }

  const registerMedia = (id: string, ownerId: string): void => {
    validateSourceId('media', id, issues);
    if (mediaIds.has(id)) {
      issues.push(sourceIssue('duplicate_media_id', `Duplicate media ID ${id} in scene ${ownerId}.`));
    }
    mediaIds.add(id);
  };

  for (const event of input.events) {
    validateSourceId('event', event.id, issues);
    validateSourceId('scene family', event.family, issues);
    validateSourceId('illustration', event.illustrationId, issues);
    if (illustrationIds.has(event.illustrationId)) {
      issues.push(sourceIssue(
        'duplicate_illustration_id',
        `Duplicate illustration ID ${event.illustrationId}.`,
      ));
    }
    illustrationIds.add(event.illustrationId);
    registerMedia(event.illustrationId, event.id);
    if (event.audioId) registerMedia(event.audioId, event.id);
    for (const cue of event.voiceCues ?? []) {
      registerMedia(cue.id, event.id);
    }
    if (event.encounterId) validateSourceId('encounter', event.encounterId, issues);
    if (event.merchantId) validateSourceId('event merchant', event.merchantId, issues);
    if (event.merchantRestockKey) validateSourceId('merchant restock key', event.merchantRestockKey, issues);
    if (event.relationship?.kind === 'companion') {
      validateSourceId('relationship companion', event.relationship.companionId, issues);
    } else if (event.relationship?.kind === 'faction') {
      validateSourceId('relationship faction', event.relationship.factionId, issues);
    }
    for (const flagId of event.eligibility.requiredFlags ?? []) validateSourceId('eligibility flag', flagId, issues);
    for (const flagId of event.eligibility.excludedFlags ?? []) validateSourceId('eligibility flag', flagId, issues);

    const chapter = input.chronicle.chapters.find((entry) => entry.id === event.chapterId);
    if (!chapter || chapter.region !== event.region) {
      issues.push(sourceIssue(
        'invalid_chapter_region',
        `Scene ${event.id} uses region ${event.region} outside chapter ${event.chapterId}.`,
      ));
    }

    if (!Number.isSafeInteger(event.slot) || event.slot <= 0) {
      issues.push(sourceIssue('invalid_scene_slot', `Scene ${event.id} has invalid slot ${event.slot}.`));
    }
    const slotKey = `${event.chapterId}:${event.slot}`;
    if (chapterSlots.has(slotKey)) {
      issues.push(sourceIssue('duplicate_scene_slot', `Duplicate chapter slot ${slotKey}.`));
    }
    chapterSlots.add(slotKey);

    if (!Number.isFinite(event.weight) || event.weight <= 0) {
      issues.push(sourceIssue('invalid_scene_weight', `Scene ${event.id} has invalid authored weight ${event.weight}.`));
    }

    const choiceCountIsValid = event.continueOnly
      ? event.choices.length === 1
      : event.choices.length >= 2 && event.choices.length <= 4;
    if (!choiceCountIsValid) {
      issues.push(sourceIssue(
        'invalid_choice_count',
        `Scene ${event.id} has ${event.choices.length} choices for its selection mode.`,
      ));
    }

    if (
      (event.type === 'journey' && (!event.journeySubtype || !journeySubtypes.has(event.journeySubtype)))
      || (event.type !== 'journey' && event.journeySubtype !== undefined)
    ) {
      issues.push(sourceIssue(
        'invalid_journey_subtype',
        `Scene ${event.id} has invalid journey subtype metadata.`,
      ));
    }

    for (const requirement of [...(event.requirements ?? []), ...(event.exclusions ?? [])]) {
      validateSourceId('requirement flag', requirement.flagId, issues);
    }
    for (const choice of event.choices) {
      validateSourceId('choice', choice.id, issues);
      for (const requirement of [...(choice.requirements ?? []), ...(choice.exclusions ?? [])]) {
        validateSourceId('choice requirement flag', requirement.flagId, issues);
      }
      for (const effect of chronicle1ChoiceEffects(choice)) {
        if (effect.type === 'item') validateSourceId('effect item', effect.itemId, issues);
        if (effect.type === 'flag') validateSourceId('effect flag', effect.flagId, issues);
        if (effect.type === 'faction') validateSourceId('effect faction', effect.factionId, issues);
        if (effect.type === 'companion' || effect.type === 'companion-loyalty' || effect.type === 'companion-quest' || effect.type === 'companion-injury') {
          validateSourceId('effect companion', effect.companionId, issues);
        }
        if (effect.type === 'combat') validateSourceId('effect encounter', effect.encounterId, issues);
        if (effect.type === 'evidence') validateSourceId('effect evidence', effect.evidenceId, issues);
      }
      if (isChronicle1CheckedChoice(choice)) {
        for (const branch of chronicleCheckBranches(choice.check)) {
          if (branch.nextSceneId) validateSourceId('check next scene', branch.nextSceneId, issues);
          if (branch.combatEncounterId) validateSourceId('check encounter', branch.combatEncounterId, issues);
        }
      } else if (choice.nextSceneId) {
        validateSourceId('direct next scene', choice.nextSceneId, issues);
      }
    }

    issues.push(...duplicateIssues(event.choices, 'duplicate_choice_id'));

    for (const followUpId of event.followUps) {
      validateSourceId('follow-up', followUpId, issues);
      if (!eventIds.has(followUpId)) {
        issues.push(sourceIssue('missing_follow_up', `Scene ${event.id} references missing follow-up ${followUpId}.`));
      }
    }

    const callbackPromises: readonly ChronicleCallbackPromise[] = [
      ...event.callbackPromises,
      ...event.choices.flatMap((choice) => chronicle1ChoiceEffects(choice).flatMap((effect) => (
        effect.type === 'callback' ? [effect.promise] : []
      ))),
    ];
    for (const promise of callbackPromises) {
      if (promise.id) validateSourceId('callback', promise.id, issues);
      validateSourceId('callback target', promise.targetEventId, issues);
      const sourcePosition = chapterPosition(input.chronicle, event.chapterId, event.slot);
      const deadlinePosition = chapterPosition(
        input.chronicle,
        promise.deadline.chapterId,
        promise.deadline.slot,
      );
      const target = eventById.get(promise.targetEventId);
      if (
        !sourcePosition
        || !deadlinePosition
        || !Number.isSafeInteger(promise.deadline.slot)
        || promise.deadline.slot <= 0
        || !positionAfter(deadlinePosition, sourcePosition)
        || (target !== undefined && target.chapterId !== promise.deadline.chapterId)
      ) {
        issues.push(sourceIssue(
          'invalid_callback_window',
          `Scene ${event.id} has an invalid callback deadline for ${promise.targetEventId}.`,
        ));
      }

      const targetPosition = target
        ? chapterPosition(input.chronicle, target.chapterId, target.slot)
        : null;
      if (
        !targetPosition
        || !sourcePosition
        || !positionAfter(targetPosition, sourcePosition)
        || (deadlinePosition && positionAfter(targetPosition, deadlinePosition))
      ) {
        issues.push(sourceIssue(
          'unreachable_callback',
          `Scene ${event.id} cannot reach callback target ${promise.targetEventId} within its window.`,
        ));
      }

      if (promise.fallbackEventId && !eventIds.has(promise.fallbackEventId)) {
        issues.push(sourceIssue(
          'unreachable_callback',
          `Scene ${event.id} references missing callback fallback ${promise.fallbackEventId}.`,
        ));
      }
    }

    if (event.anchorOrder !== undefined) {
      const expectedOrder = chapter?.anchorIds.findIndex((anchorId) => anchorId === event.id) ?? -1;
      if (expectedOrder < 0 || event.anchorOrder !== expectedOrder + 1) {
        issues.push(sourceIssue(
          'invalid_anchor_order',
          `Scene ${event.id} has invalid anchor order ${event.anchorOrder}.`,
        ));
      }
    }
  }

  for (const chapter of input.chronicle.chapters) {
    chapter.anchorIds.forEach((anchorId, index) => {
      const event = eventById.get(anchorId);
      if (!event) {
        issues.push(sourceIssue('missing_anchor', `Missing anchor scene ${anchorId}.`));
      } else {
        if (event.type !== 'main') {
          issues.push(sourceIssue(
            'invalid_anchor_type',
            `Anchor ${anchorId} must use the main scene type.`,
          ));
        }
        if (event.chapterId !== chapter.id || event.anchorOrder !== index + 1) {
          issues.push(sourceIssue(
            'invalid_anchor_order',
            `Anchor ${anchorId} is not ordered as ${index + 1} in ${chapter.id}.`,
          ));
        }
      }
    });
  }

  return issues;
}
