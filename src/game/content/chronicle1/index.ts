import type { Chronicle1Event } from '../schema';
import { validateChronicleSources } from '../validate';
import { CHRONICLE1_COMPANIONS } from './companions';
import { CHRONICLE1, MAIN_ANCHOR_IDS } from './chronicle';
import { CHRONICLE1_FACTIONS } from './factions';
import { CHRONICLE1_MERCHANTS } from './merchants';
import { CHRONICLE1_ROUTES } from './routes';
import { CH01_SCENES } from './chapters/ch01';
import { CH02_SCENES } from './chapters/ch02';
import { CH03_SCENES } from './chapters/ch03';
import { CH04_SCENES } from './chapters/ch04';
import { CH05_SCENES } from './chapters/ch05';
import { CH06_SCENES } from './chapters/ch06';
import { CH07_SCENES } from './chapters/ch07';
import { CH08_SCENES } from './chapters/ch08';

const ENGLISH_LETTER = /[A-Za-z]/;
const PROMPT_LIKE_COPY = /\b(?:generate|continue the story|AI response)\b/i;
const VALID_ROUTE_IDS = new Set(CHRONICLE1_ROUTES.map((route) => route.id));

function assemblyIssues(scenes: readonly Chronicle1Event[]): string[] {
  const issues: string[] = validateChronicleSources({
    chronicle: CHRONICLE1,
    routes: CHRONICLE1_ROUTES,
    factions: CHRONICLE1_FACTIONS,
    companions: CHRONICLE1_COMPANIONS,
    merchants: CHRONICLE1_MERCHANTS,
    events: scenes,
  }).map((issue) => `${issue.code}: ${issue.message}`);

  const eventIds = new Set<string>();
  const illustrationIds = new Set<string>();
  const choiceIds = new Set<string>();

  if (scenes.length !== 332) issues.push(`scene_count: expected 332 scenes, received ${scenes.length}`);

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
      ...scene.choices.flatMap((choice) => [choice.label, choice.detail, choice.outcome]),
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
      if (!choice.outcome.trim()) issues.push(`missing_outcome: ${choice.id}`);
    }
  }

  return issues;
}

export const CHRONICLE1_SCENES = Object.freeze([
  ...CH01_SCENES,
  ...CH02_SCENES,
  ...CH03_SCENES,
  ...CH04_SCENES,
  ...CH05_SCENES,
  ...CH06_SCENES,
  ...CH07_SCENES,
  ...CH08_SCENES,
]);

const issues = assemblyIssues(CHRONICLE1_SCENES);
if (issues.length > 0) {
  throw new Error(`Invalid Chronicle I scene assembly:\n${issues.join('\n')}`);
}

export const CHRONICLE1_SCENE_INDEX: ReadonlyMap<Chronicle1Event['id'], Chronicle1Event> = new Map(
  CHRONICLE1_SCENES.map((scene) => [scene.id, scene] as const),
);

/** Task 6's scene-only content slice; later catalog tasks add items and encounters. */
export const CHRONICLE1_CONTENT = Object.freeze({
  events: CHRONICLE1_SCENE_INDEX,
});

export {
  CHRONICLE1,
  CHRONICLE1_COMPANIONS,
  CHRONICLE1_FACTIONS,
  CHRONICLE1_MERCHANTS,
  CHRONICLE1_ROUTES,
  MAIN_ANCHOR_IDS,
};

export { CH01_SCENES } from './chapters/ch01';
export { CH02_SCENES } from './chapters/ch02';
export { CH03_SCENES } from './chapters/ch03';
export { CH04_SCENES } from './chapters/ch04';
export { CH05_SCENES } from './chapters/ch05';
export { CH06_SCENES } from './chapters/ch06';
export { CH07_SCENES } from './chapters/ch07';
export { CH08_SCENES } from './chapters/ch08';
export { CHRONICLE1_MEDIA_CONTRACT } from './media-contract';
