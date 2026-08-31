import type { ChronicleChoice, ChronicleEvent, ContentIndex } from '../content/schema';
import type { EventId, StoryPosition } from '../domain/ids';
import type { DirectorState, JourneyDirectorContext } from './types';

/** Shared gate semantics for both presentation and command validation. */
export function choiceIsAvailable(
  choice: Pick<ChronicleChoice, 'requirements' | 'exclusions' | 'effects'>,
  flags: readonly string[],
  resolutionPosition?: StoryPosition,
): boolean {
  const present = new Set(flags);
  const gatesOpen = (choice.requirements ?? []).every((gate) => present.has(gate.flagId) === gate.present)
    && (choice.exclusions ?? []).every((gate) => present.has(gate.flagId) !== gate.present);
  if (!gatesOpen || !resolutionPosition) return gatesOpen;
  return choice.effects.every((effect) =>
    effect.type !== 'callback' || comparePosition(effect.promise.deadline, resolutionPosition) >= 0);
}

export function eligibleScenes(
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
): ChronicleEvent[] {
  const used = new Set<EventId>(state.usedSceneIds);
  const reservedCallbacks = new Set(
    state.pendingCallbacks
      .filter((callback) => callback.status === 'pending' && callback.required)
      .map((callback) => callback.targetEventId),
  );
  const resolutionPosition = {
    chapterId: context.position.chapterId,
    slot: context.position.slot + 1,
  } as const;
  return [...content.events.values()]
    .filter((event) => event.chapterId === context.position.chapterId)
    .filter((event) => event.slot === undefined || event.slot <= context.position.slot)
    .filter((event) => !used.has(event.id))
    .filter((event) => !event.oneShot || !state.seenEventIds.includes(event.id))
    .filter((event) => !reservedCallbacks.has(event.id))
    .filter((event) => (event.eligibility.minLevel ?? 0) <= context.level)
    .filter((event) => (event.eligibility.maxLevel ?? Number.POSITIVE_INFINITY) >= context.level)
    .filter((event) => event.eligibility.requiredFlags?.every((flag) => context.flags.includes(flag)) ?? true)
    .filter((event) => event.eligibility.excludedFlags?.every((flag) => !context.flags.includes(flag)) ?? true)
    .filter((event) => event.eligibility.routes?.includes(context.routeProfile) ?? true)
    .filter((event) => event.choices.length === 0
      || event.choices.some((choice) => choiceIsAvailable(choice, context.flags, resolutionPosition)))
    .filter((event) => event.type === 'main' || !state.currentRunBlockedFamilies.includes(event.family))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function callbackScene(
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
): ChronicleEvent | undefined {
  const used = new Set<EventId>(state.usedSceneIds);
  const due = state.pendingCallbacks
    .filter((callback) => callback.status === 'pending' && callback.required)
    .filter((callback) => comparePosition(callback.deadline, context.position) <= 0)
    .sort((left, right) => comparePosition(left.deadline, right.deadline))[0];
  if (!due || used.has(due.targetEventId)) return undefined;
  const event = content.events.get(due.targetEventId);
  if (!event || (event.oneShot && state.seenEventIds.includes(event.id))) return undefined;
  return event;
}

export function comparePosition(left: { readonly chapterId: string; readonly slot: number }, right: { readonly chapterId: string; readonly slot: number }): number {
  const chapter = Number(left.chapterId.slice(2)) - Number(right.chapterId.slice(2));
  return chapter !== 0 ? chapter : left.slot - right.slot;
}
