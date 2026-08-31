import type { ChronicleEvent, ContentIndex } from '../content/schema';
import type { EventId } from '../domain/ids';
import type { DirectorState, JourneyDirectorContext } from './types';

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
  return [...content.events.values()]
    .filter((event) => event.chapterId === context.position.chapterId)
    .filter((event) => !used.has(event.id))
    .filter((event) => !reservedCallbacks.has(event.id))
    .filter((event) => (event.eligibility.minLevel ?? 0) <= context.level)
    .filter((event) => (event.eligibility.maxLevel ?? Number.POSITIVE_INFINITY) >= context.level)
    .filter((event) => event.eligibility.requiredFlags?.every((flag) => context.flags.includes(flag)) ?? true)
    .filter((event) => event.eligibility.excludedFlags?.every((flag) => !context.flags.includes(flag)) ?? true)
    .filter((event) => event.eligibility.routes?.includes(context.routeProfile) ?? true)
    .filter((event) => !state.currentRunBlockedFamilies.includes(event.family))
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
  return content.events.get(due.targetEventId);
}

export function comparePosition(left: { readonly chapterId: string; readonly slot: number }, right: { readonly chapterId: string; readonly slot: number }): number {
  const chapter = Number(left.chapterId.slice(2)) - Number(right.chapterId.slice(2));
  return chapter !== 0 ? chapter : left.slot - right.slot;
}
