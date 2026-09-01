import type { EnemyId, EventId, ItemId } from '../../domain/ids';
import type { ItemDefinition } from '../../types';
import {
  chronicle1ChoiceOutcomes,
  type Chronicle1Event,
  type ContentIndex,
} from '../schema';
import { validateChroniclePlayability } from '../validate';
import { deepFreeze } from './builders';
import { CH01_SCENES } from './chapters/ch01';
import { CH02_SCENES } from './chapters/ch02';
import { CH03_SCENES } from './chapters/ch03';
import { CH04_SCENES } from './chapters/ch04';
import { CH05_SCENES } from './chapters/ch05';
import { CH06_SCENES } from './chapters/ch06';
import { CH07_SCENES } from './chapters/ch07';
import { CH08_SCENES } from './chapters/ch08';
import { CHRONICLE1_COMPANIONS } from './companions';
import { CHRONICLE1, MAIN_ANCHOR_IDS } from './chronicle';
import {
  CHRONICLE1_ENCOUNTERS,
  CHRONICLE1_ENEMIES,
} from './enemies';
import {
  CHRONICLE1_ENDINGS,
  CHRONICLE1_EPILOGUE_FRAGMENTS,
  resolveChronicle1Ending,
} from './endings';
import { CHRONICLE1_FACTIONS } from './factions';
import {
  CHRONICLE1_ITEMS,
  CHRONICLE1_NEW_ITEMS,
} from './items';
import type { Chronicle1ItemDefinition } from './items';
import {
  CHRONICLE1_MEDIA_CONTRACT,
  CHRONICLE1_VOICE_CUES,
  voiceCuesForScene,
} from './media-contract';
import {
  CHRONICLE1_MERCHANTS,
  resolveMerchantStock,
} from './merchants';
import { CHRONICLE1_ROUTES } from './routes';

const ENGLISH_LETTER = /[A-Za-z]/;
const PROMPT_LIKE_COPY = /\b(?:generate|continue the story|AI response)\b/i;
const VALID_ROUTE_IDS = new Set(CHRONICLE1_ROUTES.map((route) => route.id));

function assemblyIssues(scenes: readonly Chronicle1Event[]): string[] {
  const issues: string[] = validateChroniclePlayability({
    chronicle: CHRONICLE1,
    routes: CHRONICLE1_ROUTES,
    factions: CHRONICLE1_FACTIONS,
    companions: CHRONICLE1_COMPANIONS,
    merchants: CHRONICLE1_MERCHANTS,
    events: scenes,
    encounters: CHRONICLE1_ENCOUNTERS,
    dialogueCatalog: {
      environmentArtIds: new Set(CHRONICLE1_MEDIA_CONTRACT.scenes.map((entry) => entry.id)),
      characterArt: CHRONICLE1_MEDIA_CONTRACT.characters,
      voiceCues: CHRONICLE1_VOICE_CUES,
    },
  }).map((issue) => `${issue.code}: ${issue.message}`);

  const eventIds = new Set<string>();
  const illustrationIds = new Set<string>();
  const choiceIds = new Set<string>();

  if (scenes.length !== 386) issues.push(`scene_count: expected 386 scenes, received ${scenes.length}`);

  for (const scene of scenes) {
    if (eventIds.has(scene.id)) issues.push(`duplicate_event_id: ${scene.id}`);
    eventIds.add(scene.id);

    if (illustrationIds.has(scene.illustrationId)) {
      issues.push(`duplicate_illustration_id: ${scene.illustrationId}`);
    }
    illustrationIds.add(scene.illustrationId);
    if (scene.type === 'main' && scene.anchorOrder === undefined) {
      issues.push(`missing_anchor_order: ${scene.id}`);
    }

    const { minLevel, maxLevel, routes = [], requiredFlags = [], excludedFlags = [] } = scene.eligibility;
    if (
      !Number.isSafeInteger(minLevel)
      || !Number.isSafeInteger(maxLevel)
      || minLevel! < 1
      || maxLevel! > 15
      || minLevel! > maxLevel!
      || routes.some((route) => !VALID_ROUTE_IDS.has(route))
      || requiredFlags.some((flag) => excludedFlags.includes(flag))
    ) {
      issues.push(`invalid_eligibility: ${scene.id}`);
    }

    const copy = [
      scene.title,
      ...scene.narrative,
      ...scene.choices.flatMap((choice) => [choice.label, choice.detail, ...chronicle1ChoiceOutcomes(choice)]),
    ];
    if (copy.some((text) => !text.trim() || !ENGLISH_LETTER.test(text))) {
      issues.push(`missing_english_copy: ${scene.id}`);
    }
    if (copy.some((text) => PROMPT_LIKE_COPY.test(text))) {
      issues.push(`prompt_like_copy: ${scene.id}`);
    }

    for (const choice of scene.choices) {
      if (choiceIds.has(choice.id)) issues.push(`duplicate_choice_id: ${choice.id}`);
      choiceIds.add(choice.id);
      if (chronicle1ChoiceOutcomes(choice).some((outcome) => !outcome.trim())) {
        issues.push(`missing_outcome: ${choice.id}`);
      }
    }
  }

  return issues;
}

const SOURCE_SCENES = [
  ...CH01_SCENES,
  ...CH02_SCENES,
  ...CH03_SCENES,
  ...CH04_SCENES,
  ...CH05_SCENES,
  ...CH06_SCENES,
  ...CH07_SCENES,
  ...CH08_SCENES,
];

export const CHRONICLE1_SCENES: readonly Chronicle1Event[] = deepFreeze(
  SOURCE_SCENES.map((scene) => {
    const voiceCues = voiceCuesForScene(scene.id);
    return voiceCues.length === 0 ? scene : deepFreeze({ ...scene, voiceCues });
  }),
);

const issues = assemblyIssues(CHRONICLE1_SCENES);
if (issues.length > 0) {
  throw new Error(`Invalid Chronicle I scene assembly:\n${issues.join('\n')}`);
}

export const CHRONICLE1_SCENE_INDEX: ReadonlyMap<EventId, Chronicle1Event> = new Map(
  CHRONICLE1_SCENES.map((scene) => [scene.id, scene] as const),
);

const NEW_ITEM_BY_ID = new Map<string, Chronicle1ItemDefinition>(
  CHRONICLE1_NEW_ITEMS.map((item) => [item.id, item]),
);

function runtimeItem(item: ItemDefinition): ItemDefinition {
  const authored = NEW_ITEM_BY_ID.get(item.id);
  if (!authored) return item;

  const gateTags = [`min-chapter:${authored.gates.minChapter}`];
  if (authored.gates.minReputation !== undefined) {
    gateTags.push(`min-reputation:${authored.gates.minReputation}`);
  }
  return deepFreeze({
    ...item,
    tags: [...item.tags, ...gateTags.filter((tag) => !item.tags.includes(tag))],
  });
}

/** Runtime form keeps immutable prose/stats while translating authored gates into merchant tags. */
export const CHRONICLE1_RUNTIME_ITEMS: readonly ItemDefinition[] = deepFreeze(
  CHRONICLE1_ITEMS.map(runtimeItem),
);

export const CHRONICLE1_ITEM_INDEX: ContentIndex['items'] = new Map(
  CHRONICLE1_RUNTIME_ITEMS.map((item) => [item.id as ItemId, item] as const),
);

export const CHRONICLE1_ENEMY_INDEX: ContentIndex['enemies'] = new Map(
  CHRONICLE1_ENEMIES.map((enemy) => [enemy.id as EnemyId, enemy] as const),
);

export const CHRONICLE1_ENCOUNTER_INDEX: ContentIndex['encounters'] = new Map(
  CHRONICLE1_ENCOUNTERS.map((encounter) => [encounter.id, encounter] as const),
);

export const CHRONICLE1_COMPANION_INDEX: ContentIndex['companions'] = new Map(
  CHRONICLE1_COMPANIONS.map((companion) => [companion.id, companion] as const),
);

function merchantAllowsItem(merchantId: string, item: ItemDefinition): boolean {
  const authored = NEW_ITEM_BY_ID.get(item.id);
  if (!authored || item.category === 'quest' || authored.gates.questId !== undefined) return false;

  switch (merchantId) {
    case 'blacksmith':
      return item.category === 'weapon' || item.category === 'armor';
    case 'apothecary':
      return item.category === 'potion';
    case 'relic-dealer':
      return item.category === 'charm' || item.category === 'scroll';
    case 'quartermaster':
      return item.category === 'weapon' || item.category === 'armor' || item.category === 'potion';
    case 'goblin-broker':
      return item.category === 'scroll'
        || item.tags.some((tag) => ['goblin', 'tool', 'road', 'ranged', 'escape', 'hook'].includes(tag));
    case 'road-trader':
      return item.category === 'potion' || item.category === 'charm' || item.category === 'scroll';
    default:
      return false;
  }
}

export const CHRONICLE1_MERCHANT_INDEX: ContentIndex['merchants'] = new Map(
  CHRONICLE1_MERCHANTS.map((merchant) => {
    const stockItemIds = CHRONICLE1_RUNTIME_ITEMS
      .filter((item) => merchantAllowsItem(merchant.id, item))
      .map((item) => item.id as ItemId);
    if (stockItemIds.length < 6) {
      throw new Error(`Chronicle I merchant ${merchant.id} has fewer than six real stock items.`);
    }
    const runtimeMerchant = resolveMerchantStock(merchant, stockItemIds);
    return [runtimeMerchant.id, runtimeMerchant] as const;
  }),
);

export const CHRONICLE1_ART_IDS: ReadonlySet<string> = new Set([
  ...CHRONICLE1_MEDIA_CONTRACT.scenes.map((entry) => entry.id),
  ...CHRONICLE1_MEDIA_CONTRACT.itemIcons.map((entry) => entry.id),
  ...CHRONICLE1_MEDIA_CONTRACT.enemyPortraits.map((entry) => entry.id),
  ...CHRONICLE1_MEDIA_CONTRACT.bosses.map((entry) => entry.id),
  ...CHRONICLE1_MEDIA_CONTRACT.characters.map((entry) => entry.id),
  ...CHRONICLE1_MERCHANTS.map((merchant) => merchant.illustrationId),
]);

export const CHRONICLE1_AUDIO_IDS: ReadonlySet<string> = new Set([
  ...CHRONICLE1_SCENES.flatMap((scene) => scene.audioId ? [scene.audioId] : []),
  ...CHRONICLE1_VOICE_CUES.map((cue) => cue.id),
]);

/**
 * Chronicle scene choices use DecisionId in authored metadata and ChoiceId in
 * the legacy runtime API. Both are the same stable serialized string; this is
 * the single branding bridge while the runtime contract is migrated.
 */
const RUNTIME_SCENE_INDEX = CHRONICLE1_SCENE_INDEX as unknown as ContentIndex['events'];

export const CHRONICLE1_CONTENT: ContentIndex = Object.freeze({
  events: RUNTIME_SCENE_INDEX,
  items: CHRONICLE1_ITEM_INDEX,
  enemies: CHRONICLE1_ENEMY_INDEX,
  encounters: CHRONICLE1_ENCOUNTER_INDEX,
  companions: CHRONICLE1_COMPANION_INDEX,
  merchants: CHRONICLE1_MERCHANT_INDEX,
  artIds: CHRONICLE1_ART_IDS,
  audioIds: CHRONICLE1_AUDIO_IDS,
});

export {
  CHRONICLE1,
  CHRONICLE1_COMPANIONS,
  CHRONICLE1_ENCOUNTERS,
  CHRONICLE1_ENDINGS,
  CHRONICLE1_ENEMIES,
  CHRONICLE1_EPILOGUE_FRAGMENTS,
  CHRONICLE1_FACTIONS,
  CHRONICLE1_ITEMS,
  CHRONICLE1_MEDIA_CONTRACT,
  CHRONICLE1_MERCHANTS,
  CHRONICLE1_NEW_ITEMS,
  CHRONICLE1_ROUTES,
  CHRONICLE1_VOICE_CUES,
  MAIN_ANCHOR_IDS,
  resolveChronicle1Ending,
};

export { CH01_SCENES } from './chapters/ch01';
export { CH02_SCENES } from './chapters/ch02';
export { CH03_SCENES } from './chapters/ch03';
export { CH04_SCENES } from './chapters/ch04';
export { CH05_SCENES } from './chapters/ch05';
export { CH06_SCENES } from './chapters/ch06';
export { CH07_SCENES } from './chapters/ch07';
export { CH08_SCENES } from './chapters/ch08';
export {
  BOSS_IDS,
  BOSS_PORTRAIT_IDS,
  CHAPTER_THREAT_BUDGETS,
  CHRONICLE1_ARCHETYPES,
  CHRONICLE1_BOSSES,
  CHRONICLE1_RANKED_ENEMIES,
  ENEMY_PORTRAIT_IDS,
  validateEncounterGroups,
} from './enemies';
export {
  CHRONICLE1_ARMOR,
  CHRONICLE1_ARTIFACTS,
  CHRONICLE1_CHARMS,
  CHRONICLE1_CONSUMABLES,
  CHRONICLE1_TOOLS,
  CHRONICLE1_WEAPONS,
  NEW_ITEM_ICON_IDS,
  NEW_ITEM_IDS,
  countNewItemGroups,
  isChronicleItemAvailable,
  isConsumable,
} from './items';
