import { createRng } from '../rng';
import type { ChronicleEvent, ContentIndex } from '../content/schema';
import type { EventId } from '../domain/ids';
import { callbackScene, comparePosition, eligibleScenes } from './eligibility';
import { nextTension, nextThreat, pacingCandidates, routeWeight, scenePacing } from './pacing';
import type {
  DirectorReason,
  DirectorState,
  DirectorStep,
  JourneyDirectorContext,
} from './types';

const THREAT_ENCOUNTER_THRESHOLD = 6;
const RECENT_FAMILY_WINDOW = 3;

function weightedPick(events: readonly ChronicleEvent[], random: number, context: JourneyDirectorContext): ChronicleEvent {
  const total = events.reduce((sum, event) => sum + routeWeight(event, context), 0);
  let cursor = random * total;
  for (const event of events) {
    cursor -= routeWeight(event, context);
    if (cursor < 0) return event;
  }
  return events[events.length - 1]!;
}

function selectPacedEvent(
  events: readonly ChronicleEvent[], state: DirectorState, context: JourneyDirectorContext, random: number,
): ChronicleEvent | undefined {
  if (events.length === 0) return undefined;
  const recent = new Set(state.recentFamilies.slice(-RECENT_FAMILY_WINDOW));
  const withoutRecentFamily = events.filter((event) => !recent.has(event.family));
  const coherent = withoutRecentFamily.length > 0 ? withoutRecentFamily : events;
  const unseen = coherent.filter((event) => !state.seenEventIds.includes(event.id));
  return weightedPick(pacingCandidates(unseen.length > 0 ? unseen : coherent, state), random, context);
}

/**
 * Starts the next run atomically. A positive cooldown blocks this new run,
 * then decrements so `cooldownRuns: 2` blocks exactly the next two runs.
 */
export function beginDirectorRun(state: DirectorState): DirectorState {
  const currentRunBlockedFamilies = Object.entries(state.familyCooldowns)
    .filter(([, remaining]) => remaining > 0)
    .map(([family]) => family);
  return {
    ...state,
    usedSceneIds: [],
    recentSceneKinds: [],
    recentFamilies: [],
    tension: 2,
    threat: 0,
    currentRunBlockedFamilies,
    familyCooldowns: Object.fromEntries(
      Object.entries(state.familyCooldowns).map(([family, remaining]) => [family, Math.max(0, remaining - 1)]),
    ),
  };
}

function dueRequiredCallback(state: DirectorState, context: JourneyDirectorContext): boolean {
  return state.pendingCallbacks.some(
    (callback) => callback.status === 'pending'
      && callback.required
      && comparePosition(callback.deadline, context.position) <= 0,
  );
}

function terminalStep(
  state: DirectorState,
  terminal: 'completed' | 'precondition',
  diagnostic: string,
): DirectorStep {
  return { kind: 'terminal', terminal, diagnostic, state };
}

function fulfilledCallbacks(state: DirectorState, sceneId: EventId): DirectorState['pendingCallbacks'] {
  return state.pendingCallbacks.map((callback) =>
    callback.status === 'pending' && callback.targetEventId === sceneId
      ? { ...callback, status: 'fulfilled' as const }
      : callback,
  );
}

function nextState(state: DirectorState, event: ChronicleEvent, rngState: number): DirectorState {
  const cooldown = event.cooldownRuns > 0
    ? { ...state.familyCooldowns, [event.family]: Math.max(state.familyCooldowns[event.family] ?? 0, event.cooldownRuns) }
    : state.familyCooldowns;
  return {
    ...state,
    rngState,
    usedSceneIds: [...state.usedSceneIds, event.id],
    seenEventIds: state.seenEventIds.includes(event.id) ? state.seenEventIds : [...state.seenEventIds, event.id],
    recentFamilies: [...state.recentFamilies, event.family].slice(-RECENT_FAMILY_WINDOW),
    recentSceneKinds: [...state.recentSceneKinds, scenePacing(event)].slice(-8),
    pendingCallbacks: fulfilledCallbacks(state, event.id),
    tension: nextTension(state, event),
    threat: nextThreat(state, event),
    familyCooldowns: cooldown,
  };
}

/** Selects one authored scene only. It deliberately never materializes a route. */
export function selectNextScene(state: DirectorState, context: JourneyDirectorContext, content: ContentIndex): DirectorStep {
  const chapterScenes = [...content.events.values()].filter((event) => event.chapterId === context.position.chapterId);
  if (chapterScenes.length === 0) {
    return terminalStep(state, 'precondition', `No Chronicle scenes are authored for ${context.position.chapterId}.`);
  }
  const rng = createRng(state.rngState);
  const random = rng.next();
  const eligible = eligibleScenes(state, context, content);
  const callback = callbackScene(state, context, content);
  if (dueRequiredCallback(state, context) && !callback) {
    return terminalStep(state, 'precondition', 'A required story callback cannot be delivered before its deadline.');
  }
  const anchor = eligible
    .filter((event) => event.type === 'main' && (event.anchorOrder ?? Number.POSITIVE_INFINITY) <= context.position.slot)
    .sort((left, right) => (left.anchorOrder ?? 0) - (right.anchorOrder ?? 0))[0];
  const threat = state.threat >= THREAT_ENCOUNTER_THRESHOLD
    ? eligible.filter((event) => event.type === 'combat')[0]
    : undefined;
  const pacedEligible = eligible.filter((candidate) => candidate.type !== 'main');
  const event = callback ?? anchor ?? threat ?? selectPacedEvent(pacedEligible, state, context, random);
  const reason: DirectorReason = callback ? 'callback' : anchor ? 'anchor' : threat ? 'threat' : 'paced';
  if (!event) {
    const completed = chapterScenes.every((scene) => state.usedSceneIds.includes(scene.id));
    return terminalStep(
      state,
      completed ? 'completed' : 'precondition',
      completed
        ? `No remaining eligible Chronicle scenes are available for ${context.position.chapterId}.`
        : `No eligible Chronicle scene is available for ${context.position.chapterId} slot ${context.position.slot}.`,
    );
  }
  return { kind: 'selected', sceneId: event.id, event, reason, state: nextState(state, event, rng.state) };
}
