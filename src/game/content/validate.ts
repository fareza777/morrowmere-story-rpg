import type { GameEffect } from '../domain/effects';
import type {
  Chronicle1CompanionDefinition,
  Chronicle1Choice,
  Chronicle1Event,
  Chronicle1MerchantDefinition,
  ChronicleDialogueBeat,
  ChronicleEffect,
  ChronicleCallbackPromise,
  ChronicleDefinition,
  ChronicleFactionDefinition,
  ChronicleRouteDefinition,
  ContentIndex,
  EncounterDefinition,
} from './schema';
import {
  chronicleCheckBranches,
  chronicleChoiceEffects,
  isChronicleCheckedChoice,
} from './schema';
import { ROUTE_OPTIONS } from '../director/pacing';
import { countDialogueSentences } from './dialogue';

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
  | 'invalid_dialogue_voice_text'
  | 'incomplete_checked_choice'
  | 'missing_next_scene'
  | 'inescapable_required_cycle'
  | 'intangible_choice'
  | 'spoiler_route_copy'
  | 'unavailable_companion_art';

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

function dialogueIssues(event: ChronicleEvent, index: ContentIndex): ContentIssue[] {
  if (event.dialogue === undefined) return [];
  if (event.dialogue.length === 0) return [{ code: 'invalid_dialogue', message: `Scene ${event.id} has an empty dialogue list.` }];
  const issues: ContentIssue[] = [];
  walkDialogueBeats(event, (beat) => {
    if (!beat.speakerName.trim()) issues.push({ code: 'invalid_dialogue_speaker', message: `Scene ${event.id} has dialogue without a speaker.` });
    if (!beat.text.trim()) issues.push({ code: 'invalid_dialogue_text', message: `Scene ${event.id} has dialogue without text.` });
    if (countDialogueSentences(beat.text) < 1 || countDialogueSentences(beat.text) > 3) issues.push({ code: 'invalid_dialogue_sentence_count', message: `Scene ${event.id} has dialogue outside the one-to-three sentence limit.` });
    if (beat.characterLayer?.companionId && !index.companions.has(beat.characterLayer.companionId)) issues.push({ code: 'missing_companion', message: `Missing dialogue companion: ${beat.characterLayer.companionId}` });
    if (beat.characterLayer && !index.artIds.has(beat.characterLayer.illustrationId)) issues.push({ code: 'missing_art', message: `Missing dialogue character art: ${beat.characterLayer.illustrationId}` });
    if (beat.environmentIllustrationId && !index.artIds.has(beat.environmentIllustrationId)) issues.push({ code: 'missing_art', message: `Missing dialogue environment art: ${beat.environmentIllustrationId}` });
    if (beat.voiceCueId && !index.audioIds.has(beat.voiceCueId)) issues.push({ code: 'missing_audio', message: `Missing dialogue voice cue: ${beat.voiceCueId}` });
  });
  return issues;
}

function walkDialogueBeats(
  event: Pick<ChronicleEvent, 'dialogue'>,
  visit: (beat: ChronicleDialogueBeat, index: number) => void,
): void {
  event.dialogue?.forEach(visit);
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

export interface ChronicleDialogueValidationCatalog {
  readonly environmentArtIds: ReadonlySet<string>;
  readonly characterArt: readonly { readonly id: string; readonly companionId?: string }[];
  readonly voiceCues: readonly { readonly id: string; readonly text: string }[];
}

export interface ChroniclePlayabilityInput extends ChronicleSourceInput {
  readonly encounters: readonly EncounterDefinition[];
  readonly dialogueCatalog: ChronicleDialogueValidationCatalog;
}

type SourceRecord = Record<string, unknown>;
type SourceBranch = { readonly label: string; readonly value: SourceRecord };
const SOURCE_EFFECT_TYPES = new Set([
  'gold', 'item', 'xp', 'flag', 'faction', 'companion', 'vitals', 'callback', 'combat', 'evidence',
  'companion-loyalty', 'companion-quest', 'companion-injury', 'threat', 'tension',
]);

function isRecord(value: unknown): value is SourceRecord {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveQuantity(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isSourceEffect(value: unknown): value is ChronicleEffect {
  if (!isRecord(value) || typeof value.type !== 'string' || !SOURCE_EFFECT_TYPES.has(value.type)) return false;
  switch (value.type) {
    case 'gold':
      return (value.scope === 'banked' || value.scope === 'unbanked') && isFiniteNumber(value.amount);
    case 'item':
      return (value.operation === 'grant' || value.operation === 'remove')
        && isNonEmptyString(value.itemId)
        && isPositiveQuantity(value.quantity)
        && (value.destination === undefined || value.destination === 'pack' || value.destination === 'unbanked-loot');
    case 'xp':
      return isFiniteNumber(value.amount)
        && (value.source === undefined || value.source === 'story' || value.source === 'quest' || value.source === 'companion');
    case 'flag':
      return (value.operation === 'add' || value.operation === 'remove') && isNonEmptyString(value.flagId);
    case 'evidence':
      return (value.operation === 'add' || value.operation === 'remove') && isNonEmptyString(value.evidenceId);
    case 'faction':
      return isNonEmptyString(value.factionId) && isFiniteNumber(value.amount);
    case 'companion':
      return isNonEmptyString(value.companionId) && (value.operation === 'recruit' || value.operation === 'dismiss');
    case 'companion-loyalty':
      return isNonEmptyString(value.companionId) && isFiniteNumber(value.amount);
    case 'companion-quest':
      return isNonEmptyString(value.companionId) && Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 3;
    case 'companion-injury':
      return isNonEmptyString(value.companionId) && typeof value.injured === 'boolean';
    case 'threat':
    case 'tension':
      return isFiniteNumber(value.amount);
    case 'vitals':
      return (value.health !== undefined || value.resource !== undefined)
        && (value.health === undefined || isFiniteNumber(value.health))
        && (value.resource === undefined || isFiniteNumber(value.resource));
    case 'callback':
      return isRecord(value.promise)
        && isNonEmptyString(value.promise.targetEventId)
        && isRecord(value.promise.deadline)
        && isNonEmptyString(value.promise.deadline.chapterId)
        && isPositiveQuantity(value.promise.deadline.slot);
    case 'combat':
      return isNonEmptyString(value.encounterId);
    default:
      return false;
  }
}

function checkedChoiceBranches(choice: Chronicle1Choice, sceneId: string, issues: ContentIssue[]): readonly SourceBranch[] | null {
  const record = choice as unknown as SourceRecord;
  if (!Object.prototype.hasOwnProperty.call(record, 'check')) return null;
  const check = record.check;
  const labels = ['success', 'failure', 'criticalSuccess', 'criticalFailure'] as const;
  if (!isRecord(check)) {
    for (const label of labels.slice(0, 2)) issues.push(sourceIssue('incomplete_checked_choice', `Scene ${sceneId} choice ${String(record.id)} has malformed ${label} branch.`));
    return [];
  }
  const branches: SourceBranch[] = [];
  for (const label of labels) {
    const branch = check[label];
    if (branch === undefined && (label === 'criticalSuccess' || label === 'criticalFailure')) continue;
    if (!isRecord(branch) || typeof branch.outcome !== 'string' || !branch.outcome.trim() || !Array.isArray(branch.effects)) {
      issues.push(sourceIssue('incomplete_checked_choice', `Scene ${sceneId} choice ${String(record.id)} has malformed ${label} branch.`));
      continue;
    }
    branch.effects.forEach((effect, effectIndex) => {
      if (!isSourceEffect(effect)) issues.push(sourceIssue('incomplete_checked_choice', `Scene ${sceneId} choice ${String(record.id)} ${label} branch has malformed effect ${effectIndex}.`));
    });
    branches.push({ label, value: branch });
  }
  return branches;
}

function sourceChoiceEffects(choice: Chronicle1Choice, branches: readonly SourceBranch[] | null): readonly ChronicleEffect[] {
  if (branches !== null) return branches.flatMap((branch) => (branch.value.effects as readonly unknown[]).filter(isSourceEffect));
  const effects = (choice as unknown as SourceRecord).effects;
  return Array.isArray(effects) ? effects.filter(isSourceEffect) : [];
}

function sourceNextSceneId(value: SourceRecord): string | null {
  return typeof value.nextSceneId === 'string' && value.nextSceneId.trim() ? value.nextSceneId : null;
}

function sourceCombatEncounterIds(effects: readonly ChronicleEffect[], branch: SourceRecord | null): readonly string[] {
  return [
    ...effects.flatMap((effect) => effect.type === 'combat' ? [effect.encounterId] : []),
    ...(branch && typeof branch.combatEncounterId === 'string' ? [branch.combatEncounterId] : []),
  ];
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

  const eventIds = new Set<string>(input.events.map((event) => event.id));
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

    const choiceCountIsValid = event.dialogue?.length && event.choices.length === 0
      ? true
      : event.continueOnly
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
    const effectsByChoice = new Map<Chronicle1Choice, readonly ChronicleEffect[]>();
    for (const choice of event.choices) {
      validateSourceId('choice', choice.id, issues);
      for (const requirement of [...(choice.requirements ?? []), ...(choice.exclusions ?? [])]) {
        validateSourceId('choice requirement flag', requirement.flagId, issues);
      }
      const branches = checkedChoiceBranches(choice, event.id, issues);
      const effects = sourceChoiceEffects(choice, branches);
      effectsByChoice.set(choice, effects);
      for (const effect of effects) {
        if (effect.type === 'item') validateSourceId('effect item', effect.itemId, issues);
        if (effect.type === 'flag') validateSourceId('effect flag', effect.flagId, issues);
        if (effect.type === 'faction') validateSourceId('effect faction', effect.factionId, issues);
        if (effect.type === 'companion' || effect.type === 'companion-loyalty' || effect.type === 'companion-quest' || effect.type === 'companion-injury') {
          validateSourceId('effect companion', effect.companionId, issues);
        }
        if (effect.type === 'combat') validateSourceId('effect encounter', effect.encounterId, issues);
        if (effect.type === 'evidence') validateSourceId('effect evidence', effect.evidenceId, issues);
      }
      if (branches !== null) {
        for (const branch of branches) {
          const nextSceneId = sourceNextSceneId(branch.value);
          if (nextSceneId) {
            validateSourceId('check next scene', nextSceneId, issues);
            if (!eventIds.has(nextSceneId)) issues.push(sourceIssue('missing_next_scene', `Scene ${event.id} choice ${choice.id} ${branch.label} branch references missing next scene ${nextSceneId}.`));
          }
          if (typeof branch.value.combatEncounterId === 'string') validateSourceId('check encounter', branch.value.combatEncounterId, issues);
        }
      } else {
        const nextSceneId = sourceNextSceneId(choice as unknown as SourceRecord);
        if (nextSceneId) {
          validateSourceId('direct next scene', nextSceneId, issues);
          if (!eventIds.has(nextSceneId)) issues.push(sourceIssue('missing_next_scene', `Scene ${event.id} choice ${choice.id} references missing next scene ${nextSceneId}.`));
        }
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
      ...event.choices.flatMap((choice) => (effectsByChoice.get(choice) ?? []).flatMap((effect) => (
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

function uniqueIssues(issues: readonly ContentIssue[]): ContentIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}\u0000${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizedDialogueText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[“”]/gu, '"')
    .replace(/[‘’]/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase();
}

function wholeDialogueMatch(left: string, right: string): boolean {
  if (!right) return false;
  let offset = left.indexOf(right);
  while (offset >= 0) {
    const before = left.slice(0, offset).at(-1) ?? '';
    const after = left.at(offset + right.length) ?? '';
    if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) return true;
    offset = left.indexOf(right, offset + right.length);
  }
  return false;
}

function catalogDialogueIssues(event: Chronicle1Event, input: ChroniclePlayabilityInput): ContentIssue[] {
  if (event.dialogue === undefined) return [];
  if (event.dialogue.length === 0) return [sourceIssue('invalid_dialogue', `Scene ${event.id} has an empty dialogue list.`)];
  const issues: ContentIssue[] = [];
  const companionIds = new Set(input.companions.map((companion) => companion.id));
  const characterById = new Map(input.dialogueCatalog.characterArt.map((art) => [art.id, art]));
  const voiceById = new Map(input.dialogueCatalog.voiceCues.map((cue) => [cue.id, cue]));
  walkDialogueBeats(event, (beat, beatIndex) => {
    if (!beat.speakerName.trim()) issues.push(sourceIssue('invalid_dialogue_speaker', `Scene ${event.id} beat ${beatIndex} has dialogue without a speaker.`));
    if (!beat.text.trim()) issues.push(sourceIssue('invalid_dialogue_text', `Scene ${event.id} beat ${beatIndex} has dialogue without text.`));
    const sentenceCount = countDialogueSentences(beat.text);
    if (sentenceCount < 1 || sentenceCount > 3) issues.push(sourceIssue('invalid_dialogue_sentence_count', `Scene ${event.id} beat ${beatIndex} has dialogue outside the one-to-three sentence limit.`));
    if (beat.characterLayer) {
      const art = characterById.get(beat.characterLayer.illustrationId);
      if (!art) issues.push(sourceIssue('missing_art', `Scene ${event.id} beat ${beatIndex} references unavailable character art ${beat.characterLayer.illustrationId}.`));
      if (beat.characterLayer.companionId && !companionIds.has(beat.characterLayer.companionId)) issues.push(sourceIssue('missing_companion', `Scene ${event.id} beat ${beatIndex} references missing companion ${beat.characterLayer.companionId}.`));
      if (art?.companionId && art.companionId !== beat.characterLayer.companionId) issues.push(sourceIssue('unavailable_companion_art', `Scene ${event.id} beat ${beatIndex} assigns character art ${art.id} to a different companion.`));
    }
    if (beat.environmentIllustrationId && !input.dialogueCatalog.environmentArtIds.has(beat.environmentIllustrationId)) issues.push(sourceIssue('missing_art', `Scene ${event.id} beat ${beatIndex} references unavailable environment art ${beat.environmentIllustrationId}.`));
    if (beat.voiceCueId) {
      const cue = voiceById.get(beat.voiceCueId);
      if (!cue) issues.push(sourceIssue('missing_audio', `Scene ${event.id} beat ${beatIndex} references missing voice cue ${beat.voiceCueId}.`));
      else {
        const beatText = normalizedDialogueText(beat.text);
        const cueText = normalizedDialogueText(cue.text);
        if (!wholeDialogueMatch(beatText, cueText) && !wholeDialogueMatch(cueText, beatText)) issues.push(sourceIssue('invalid_dialogue_voice_text', `Scene ${event.id} beat ${beatIndex} voice cue ${beat.voiceCueId} does not match dialogue text.`));
      }
    }
  });
  return issues;
}

function routeSpoilerIssues(routes: readonly ChronicleRouteDefinition[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const leakage = /\b(?:merchant|companion|relic|reward|combat|encounter|recovery|chance|weight|frequency)\b|\b\d+(?:\.\d+)?\s*%|\b(?:danger|risk)\s+(?:tier|level|rating|\d+|higher|lower|more|less)\b|\b(?:higher|lower)\s+(?:danger|risk)\b/iu;
  for (const route of routes) {
    const visible = `${route.label} ${route.description}`.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase();
    const match = visible.match(leakage);
    if (match) issues.push(sourceIssue('spoiler_route_copy', `Route ${route.id} exposes system copy: ${match[0]}.`));
  }
  return issues;
}

function graphBranchTarget(branch: unknown): string | null {
  if (!isRecord(branch) || typeof branch.outcome !== 'string' || !branch.outcome.trim() || !Array.isArray(branch.effects) || !branch.effects.every(isSourceEffect)) return null;
  return sourceNextSceneId(branch);
}

function hasCompleteCheckedBranches(choice: Chronicle1Choice): boolean {
  const record = choice as unknown as SourceRecord;
  if (!isRecord(record.check)) return false;
  return ['success', 'failure'].every((label) => {
    const branch = record.check[label];
    return isRecord(branch)
      && typeof branch.outcome === 'string'
      && branch.outcome.trim().length > 0
      && Array.isArray(branch.effects)
      && branch.effects.every(isSourceEffect);
  });
}

function branchTargets(choice: Chronicle1Choice): readonly (string | null)[] {
  const record = choice as unknown as SourceRecord;
  if (!Object.prototype.hasOwnProperty.call(record, 'check')) return [sourceNextSceneId(record)];
  const check = record.check;
  if (!isRecord(check)) return [null, null];
  const labels = ['success', 'failure', 'criticalSuccess', 'criticalFailure'] as const;
  return labels.flatMap((label) => {
    const branch = check[label];
    if (branch === undefined && (label === 'criticalSuccess' || label === 'criticalFailure')) return [];
    return [graphBranchTarget(branch)];
  });
}

function requiredCycleIssues(events: readonly Chronicle1Event[]): ContentIssue[] {
  const eventIds = new Set(events.map((event) => event.id));
  const edges = new Map<string, readonly string[]>();
  const outcomes = new Map<string, readonly (string | null)[]>();
  for (const event of events) {
    const sceneOutcomes = event.choices.flatMap(branchTargets);
    outcomes.set(event.id, sceneOutcomes);
    edges.set(event.id, sceneOutcomes.filter((target): target is string => target !== null && eventIds.has(target)));
  }
  let nextIndex = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];
  const visit = (id: string): void => {
    indices.set(id, nextIndex);
    lowLinks.set(id, nextIndex);
    nextIndex += 1;
    stack.push(id);
    onStack.add(id);
    for (const target of edges.get(id) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(id, Math.min(lowLinks.get(id)!, lowLinks.get(target)!));
      } else if (onStack.has(target)) {
        lowLinks.set(id, Math.min(lowLinks.get(id)!, indices.get(target)!));
      }
    }
    if (lowLinks.get(id) === indices.get(id)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== id);
      components.push(component.sort());
    }
  };
  for (const event of events) if (!indices.has(event.id)) visit(event.id);
  return components
    .filter((component) => component.length > 1 || (edges.get(component[0]!) ?? []).includes(component[0]!))
    .filter((component) => {
      const members = new Set(component);
      return component.every((id) => (outcomes.get(id) ?? []).length > 0 && (outcomes.get(id) ?? []).every((target) => target !== null && members.has(target)));
    })
    .sort((left, right) => left.join(',').localeCompare(right.join(',')))
    .map((component) => sourceIssue('inescapable_required_cycle', `Required continuation cycle among scenes ${component.join(', ')}.`));
}

function laterFlagConsumption(event: Chronicle1Event, flagId: string, input: ChroniclePlayabilityInput): boolean {
  const chapterOrder = new Map(input.chronicle.chapters.map((chapter) => [chapter.id, chapter.order]));
  const sourceOrder = chapterOrder.get(event.chapterId);
  if (sourceOrder === undefined) return false;
  return input.events?.some((candidate) => {
    const candidateOrder = chapterOrder.get(candidate.chapterId);
    if (candidate === event || candidateOrder === undefined || candidateOrder < sourceOrder || (candidateOrder === sourceOrder && candidate.slot <= event.slot)) return false;
    const requirements = [
      ...(candidate.requirements ?? []), ...(candidate.exclusions ?? []),
      ...(candidate.eligibility.requiredFlags ?? []).map((flag) => ({ flagId: flag })),
      ...(candidate.eligibility.excludedFlags ?? []).map((flag) => ({ flagId: flag })),
      ...candidate.choices.flatMap((choice) => [...(choice.requirements ?? []), ...(choice.exclusions ?? [])]),
    ];
    return requirements.some((requirement) => requirement.flagId === flagId);
  }) ?? false;
}

function strictInteractionIssues(input: ChroniclePlayabilityInput): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const event of input.events ?? []) {
    const choiceFacts = event.choices.map((choice) => {
      const branches = checkedChoiceBranches(choice, event.id, []);
      const effects = sourceChoiceEffects(choice, branches);
      const targets = branchTargets(choice);
      const hasCombat = sourceCombatEncounterIds(effects, null).length > 0 || (branches ?? []).some((branch) => typeof branch.value.combatEncounterId === 'string');
      return { choice, branches, effects, targets, hasCombat };
    });
    const strict = event.dialogue !== undefined || event.followUps.length > 0 || choiceFacts.some((fact) => fact.branches !== null || fact.targets.some((target) => target !== null) || fact.hasCombat);
    if (!strict) continue;
    const neutralDialogue = event.dialogue !== undefined && (event.choices.length === 0 || (event.continueOnly === true && event.choices.length === 1 && choiceFacts[0]?.branches === null));
    if (neutralDialogue) continue;
    for (const fact of choiceFacts) {
      const flagConsumedLater = fact.effects
        .filter((effect) => effect.type === 'flag')
        .some((effect) => laterFlagConsumption(event, effect.flagId, input));
      const tangible = hasCompleteCheckedBranches(fact.choice)
        || fact.targets.some((target) => target !== null)
        || fact.hasCombat
        || fact.effects.some((effect) => effect.type !== 'flag')
        || event.followUps.length > 0
        || flagConsumedLater;
      if (!tangible) issues.push(sourceIssue('intangible_choice', `Scene ${event.id} choice ${fact.choice.id} has no tangible consequence.`));
    }
  }
  return issues;
}

function encounterIssues(input: ChroniclePlayabilityInput): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const encounterIds = new Set<string>(input.encounters.map((encounter) => encounter.id));
  const validateEncounter = (sceneId: string, encounterId: string | undefined, owner: string): void => {
    if (!encounterId || !encounterIds.has(encounterId)) issues.push(sourceIssue('missing_encounter', `${owner} in scene ${sceneId} references missing encounter ${encounterId ?? '(none)'}.`));
  };
  for (const event of input.events ?? []) {
    if (event.type === 'combat') validateEncounter(event.id, event.encounterId, 'Combat scene');
    else if (event.encounterId) validateEncounter(event.id, event.encounterId, 'Scene');
    for (const choice of event.choices) {
      const branches = checkedChoiceBranches(choice, event.id, []);
      const effects = sourceChoiceEffects(choice, branches);
      for (const effect of effects) if (effect.type === 'combat') validateEncounter(event.id, effect.encounterId, `Choice ${choice.id}`);
      for (const branch of branches ?? []) if (typeof branch.value.combatEncounterId === 'string') validateEncounter(event.id, branch.value.combatEncounterId, `Choice ${choice.id} ${branch.label} branch`);
    }
  }
  return issues;
}

/** Validates Chronicle source connectivity with the catalog context unavailable to generic runtime indices. */
export function validateChroniclePlayability(input: ChroniclePlayabilityInput): ContentIssue[] {
  const issues = [
    ...validateChronicleSources(input),
    ...encounterIssues(input),
    ...requiredCycleIssues(input.events ?? []),
    ...strictInteractionIssues(input),
    ...routeSpoilerIssues(input.routes),
    ...input.dialogueCatalog.characterArt.flatMap((art) => art.companionId && !input.companions.some((companion) => companion.id === art.companionId)
      ? [sourceIssue('unavailable_companion_art', `Character art ${art.id} names unavailable companion ${art.companionId}.`)] : []),
    ...(input.events ?? []).flatMap((event) => catalogDialogueIssues(event, input)),
  ];
  return uniqueIssues(issues);
}
