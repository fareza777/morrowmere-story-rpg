import type {
  Chronicle1Event,
  Chronicle1EventSource,
  ChronicleRequirement,
  ChronicleRequirementSource,
} from '../schema';

export type DeepReadonly<T> =
  T extends string | number | boolean | bigint | symbol | null | undefined
    ? T
    : T extends (...args: never[]) => unknown
      ? T
      : T extends readonly unknown[]
        ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
        : T extends object
          ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
          : T;

/** Recursively freezes authored records so catalogs cannot drift at runtime. */
export function deepFreeze<const T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

function normalizeRequirements(
  requirements: readonly ChronicleRequirementSource[] | undefined,
): readonly ChronicleRequirement[] | undefined {
  const normalized = requirements?.map((requirement) => requirement.type === 'flag'
    ? { ...requirement, present: requirement.present ?? true }
    : requirement.type === 'item'
      ? { ...requirement, scope: requirement.scope ?? 'owned' }
    : requirement);
  return normalized as unknown as readonly ChronicleRequirement[] | undefined;
}

/**
 * The only authoring boundary for Chronicle I scenes. Literal source IDs are
 * branded here, legacy omitted `present` fields become positive flag gates,
 * and the complete nested record is frozen before export.
 */
export function defineScene<const Source extends Chronicle1EventSource>(
  scene: Source,
): Chronicle1Event {
  const normalized = {
    ...scene,
    requirements: normalizeRequirements(scene.requirements),
    exclusions: normalizeRequirements(scene.exclusions),
    dialogue: scene.dialogue?.map((beat) => ({
      ...beat,
      requirements: normalizeRequirements(beat.requirements),
      exclusions: normalizeRequirements(beat.exclusions),
    })),
    choices: scene.choices.map((choice) => {
      const normalizedChoice = {
        ...choice,
        requirements: normalizeRequirements(choice.requirements),
        exclusions: normalizeRequirements(choice.exclusions),
      };
      if (!choice.check) return normalizedChoice;
      return {
        ...normalizedChoice,
        check: {
          ...choice.check,
          modifiers: choice.check.modifiers?.map((modifier) => ({
            ...modifier,
            requirements: normalizeRequirements(modifier.requirements),
            exclusions: normalizeRequirements(modifier.exclusions),
          })),
        },
      };
    }),
  };

  return deepFreeze(normalized) as unknown as Chronicle1Event;
}
