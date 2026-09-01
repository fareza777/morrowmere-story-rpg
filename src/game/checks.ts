import { createRng } from './rng';
import type { ChronicleCheckModifier } from './content/schema';

export type ChronicleCheckResult =
  | 'critical-success'
  | 'success'
  | 'failure'
  | 'critical-failure';

const MINIMUM_CHANCE = 15;
const MAXIMUM_CHANCE = 95;

/** Returns only check modifiers whose authored flag gates match this expedition. */
export function activeCheckModifiers(
  modifiers: readonly ChronicleCheckModifier[] | undefined,
  flags: readonly string[],
): readonly ChronicleCheckModifier[] {
  const present = new Set(flags);
  return modifiers?.filter((modifier) =>
    (modifier.requirements ?? []).every((requirement) => present.has(requirement.flagId) === requirement.present)
      && (modifier.exclusions ?? []).every((requirement) => present.has(requirement.flagId) !== requirement.present),
  ) ?? [];
}

/** Calculates the visible success percentage from fully derived game values. */
export function calculateCheckChance(
  effectiveStat: number,
  difficulty: number,
  modifier = 0,
): number {
  const chance = 55 + (effectiveStat - difficulty) * 10 + modifier;
  return Math.max(MINIMUM_CHANCE, Math.min(MAXIMUM_CHANCE, chance));
}

/** Builds a stable seed namespace for one choice attempt. */
export function createCheckRollSeed(
  seed: number,
  sceneId: string,
  visitCount: number,
  choiceId: string,
): number {
  let hash = 2_166_136_261;
  const source = `${seed}:${sceneId}:${visitCount}:${choiceId}`;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

/** Rolls an inclusive d100 without consuming the expedition's mutable RNG stream. */
export function createCheckRoll(
  seed: number,
  sceneId: string,
  visitCount: number,
  choiceId: string,
): number {
  return createRng(createCheckRollSeed(seed, sceneId, visitCount, choiceId)).int(1, 100);
}

/** Classifies a resolved roll; critical bands only apply on their matching side. */
export function classifyCheckResult(roll: number, chance: number): ChronicleCheckResult {
  if (roll <= chance) return roll <= 5 ? 'critical-success' : 'success';
  return roll >= 96 ? 'critical-failure' : 'failure';
}
