import { isChronicleCheckedChoice, type ContentIndex } from '../content/schema';
import type { GameEffect } from '../domain/effects';
import { classifyCheckResult } from '../checks';
import { createCampaign } from '../state/create';
import type { CheckedResultKind, GameStateV2, ProfileState } from '../state/types';
import type { HeroClass } from '../types';
import { isSaveStateV2Dto, type LegacySceneResolutionDto, type SaveStateDto, type SaveStateV2Dto, type SceneResolutionDto } from './schema';

const heroClasses = new Set<HeroClass>(['warrior', 'mage', 'warden']);

function isLegacy(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && (value as { schemaVersion?: unknown }).schemaVersion === 1;
}

function legacySettings(value: unknown): ProfileState['settings'] | null {
  if (!value || typeof value !== 'object') return null;
  const settings = value as Record<string, unknown>;
  if (typeof settings.textScale !== 'number' || !Number.isFinite(settings.textScale)
    || typeof settings.highContrast !== 'boolean' || typeof settings.reducedMotion !== 'boolean'
    || typeof settings.sound !== 'boolean' || typeof settings.music !== 'boolean' || typeof settings.narration !== 'boolean') return null;
  return {
    textScale: settings.textScale,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    sound: settings.sound,
    music: settings.music,
    narration: settings.narration,
    haptics: true,
    reducedHaptics: false,
  };
}

function validName(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 48 ? value.trim() : undefined;
}

/** Starts a clean Chronicle I campaign; the old story position is deliberately never inferred. */
export function migrateSave(value: unknown, content: ContentIndex, createdAt: string): GameStateV2 | null {
  if (!isLegacy(value)) return null;
  const legacy = value;
  const oldHero = legacy.hero && typeof legacy.hero === 'object' ? legacy.hero as Record<string, unknown> : {};
  const heroClass: HeroClass = heroClasses.has(oldHero.class as HeroClass) ? oldHero.class as HeroClass : 'warrior';
  const name = validName(oldHero.name);
  const seed = typeof legacy.seed === 'number' && Number.isFinite(legacy.seed) ? legacy.seed : 0;
  const initial = createCampaign({ heroClass, name, seed, updatedAt: createdAt, chapterId: 'ch01' }, content);
  const settings = legacySettings(legacy.settings) ?? initial.profile.settings;
  const eventIds = Array.isArray(legacy.discoveredEvents) ? legacy.discoveredEvents.filter((id): id is string => typeof id === 'string' && content.events.has(id as never)) : [];
  const enemyIds = Array.isArray(legacy.discoveredEnemies) ? legacy.discoveredEnemies.filter((id): id is string => typeof id === 'string' && content.enemies.has(id as never)) : [];
  return { ...initial, profile: { settings, discoveries: { events: [...new Set(eventIds)] as never, enemies: [...new Set(enemyIds)], codex: [] } } };
}

export interface SaveV2Migration {
  readonly state: SaveStateDto;
  readonly diagnostics: readonly string[];
}

function summarizeEffects(effects: readonly GameEffect[], content: ContentIndex): readonly string[] {
  return effects.map((effect) => {
    if (effect.type === 'xp') return `+${effect.amount} XP`;
    if (effect.type === 'gold') return `${effect.amount >= 0 ? '+' : ''}${effect.amount} Gold`;
    if (effect.type === 'flag') return `${effect.operation === 'add' ? '+' : '-'}${effect.flagId}`;
    if (effect.type === 'evidence') return effect.operation === 'add' ? `Evidence gained: ${effect.evidenceId}` : `Evidence removed: ${effect.evidenceId}`;
    if (effect.type === 'item') return `${effect.operation === 'grant' ? '+' : '-'}${effect.quantity} ${content.items.get(effect.itemId)?.name ?? effect.itemId}`;
    if (effect.type === 'combat') return 'Combat begins';
    return 'Prior consequence preserved';
  });
}

function safeDirectResolution(
  value: LegacySceneResolutionDto,
  content: ContentIndex,
): SceneResolutionDto {
  const scene = content.events.get(value.eventId as never);
  const choice = value.choiceId === null ? null : scene?.choices.find((candidate) => candidate.id === value.choiceId);
  if ('resultKind' in value && value.resultKind === 'direct') {
    return {
      eventId: value.eventId,
      choiceId: value.choiceId,
      resultKind: 'direct',
      chance: null,
      roll: null,
      outcome: value.outcome,
      effectSummary: [...value.effectSummary],
      nextSceneId: value.nextSceneId,
      continueLabel: value.continueLabel,
    };
  }
  if (choice && !isChronicleCheckedChoice(choice)) {
    return {
      eventId: value.eventId,
      choiceId: value.choiceId,
      resultKind: 'direct',
      chance: null,
      roll: null,
      outcome: choice.outcome,
      effectSummary: summarizeEffects(choice.effects, content),
      nextSceneId: choice.nextSceneId ?? null,
      continueLabel: choice.continueLabel ?? null,
    };
  }
  return {
    eventId: value.eventId,
    choiceId: value.choiceId,
    resultKind: 'direct',
    chance: null,
    roll: null,
    outcome: scene?.narrative.at(-1) ?? scene?.title ?? 'Prior scene resolution preserved.',
    effectSummary: [],
    nextSceneId: null,
    continueLabel: null,
  };
}

function normalizedCheckedValues(
  resultKind: CheckedResultKind,
  chance: number | null,
  roll: number | null,
): { readonly chance: number; readonly roll: number } {
  const normalizedChance = chance === null ? null : Math.max(0, Math.min(100, chance));
  const normalizedRoll = roll === null ? null : Math.max(1, Math.min(100, roll));
  if (normalizedChance !== null && normalizedRoll !== null
    && classifyCheckResult(normalizedRoll, normalizedChance) === resultKind) {
    return { chance: normalizedChance, roll: normalizedRoll };
  }
  if (resultKind === 'critical-success') return { chance: 95, roll: 1 };
  if (resultKind === 'success') return { chance: 95, roll: 50 };
  if (resultKind === 'critical-failure') return { chance: 15, roll: 100 };
  return { chance: 15, roll: 50 };
}

/** Converts a validated v2 DTO without re-running any gameplay effects. */
export function migrateSaveV2(value: unknown, content: ContentIndex): SaveV2Migration | null {
  if (!isSaveStateV2Dto(value)) return null;
  const legacy = value as SaveStateV2Dto;
  if (legacy.expedition === null) return { state: { ...legacy, schemaVersion: 3, expedition: null }, diagnostics: [] };
  const legacyQueue = legacy.expedition.authoredSceneQueue ?? [];
  const queue = legacyQueue.filter((entry) => content.events.has(entry.sceneId as never));
  const removed = legacyQueue.length - queue.length;
  const currentId = legacy.expedition.currentSceneId;
  const sceneVisitCounts = currentId === null ? {} : { [currentId]: 1 };
  const legacyResolution = legacy.expedition.sceneResolution;
  const checked = legacyResolution !== null
    && 'resultKind' in legacyResolution
    && legacyResolution.resultKind !== 'direct';
  const checkedChoiceId = checked
    ? legacyResolution.choiceId
      ?? content.events.get(legacyResolution.eventId as never)?.choices[0]?.id
      ?? `legacy-checked:${legacyResolution.eventId}`
    : null;
  const checkedValues = checked
    ? normalizedCheckedValues(
        legacyResolution.resultKind as CheckedResultKind,
        legacyResolution.chance,
        legacyResolution.roll,
      )
    : null;
  const sceneResolution: SceneResolutionDto | null = legacyResolution === null
    ? null
    : checked
      ? {
          eventId: legacyResolution.eventId,
          choiceId: checkedChoiceId!,
          resultKind: legacyResolution.resultKind as Exclude<typeof legacyResolution.resultKind, 'direct'>,
          chance: checkedValues!.chance,
          roll: checkedValues!.roll,
          outcome: legacyResolution.outcome,
          effectSummary: [...legacyResolution.effectSummary],
          nextSceneId: legacyResolution.nextSceneId,
          continueLabel: legacyResolution.continueLabel,
        }
      : safeDirectResolution(legacyResolution, content);
  const checkedResolution = checked && sceneResolution !== null && sceneResolution.resultKind !== 'direct' ? sceneResolution : null;
  const checkedAttempts = checkedResolution
    ? [{
        eventId: checkedResolution.eventId,
        choiceId: checkedResolution.choiceId,
        visitOrdinal: 1,
        chance: checkedResolution.chance,
        roll: checkedResolution.roll,
        resultKind: checkedResolution.resultKind,
      }]
    : [];
  return {
    state: {
      ...legacy,
      schemaVersion: 3,
      expedition: {
        ...legacy.expedition,
        dialogueBeatIndex: 0,
        sceneResolution,
        authoredSceneQueue: queue.map((entry) => ({ ...entry })),
        sceneVisitCounts,
        checkedAttempts,
      },
    },
    diagnostics: removed > 0 ? [`Removed ${removed} unavailable authored scene ${removed === 1 ? 'entry' : 'entries'} while recovering the save.`] : [],
  };
}
