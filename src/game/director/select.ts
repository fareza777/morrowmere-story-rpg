import { createRng } from '../rng';
import type { ChronicleEvent, ContentIndex } from '../content/schema';
import type { EventId } from '../domain/ids';
import { callbackScene, comparePosition, eligibleScenes } from './eligibility';
import { nextTension, nextThreat, pacingCandidates, routeWeight, scenePacing } from './pacing';
import type {
  AuthoredSceneQueueEntry,
  DirectorReason,
  DirectorState,
  DirectorStep,
  JourneyDirectorContext,
} from './types';

const THREAT_ENCOUNTER_THRESHOLD = 6;
const RECENT_FAMILY_WINDOW = 3;
const MAX_CONSECUTIVE_COMBAT_SCENES = 3;

function reachedCombatLimit(state: DirectorState, content: ContentIndex): boolean {
  const recentIds = state.usedSceneIds.slice(-MAX_CONSECUTIVE_COMBAT_SCENES);
  return recentIds.length === MAX_CONSECUTIVE_COMBAT_SCENES
    && recentIds.every((sceneId) => content.events.get(sceneId)?.type === 'combat');
}

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

interface CandidatePick {
  readonly event: ChronicleEvent;
  readonly reason: DirectorReason;
}

interface AuthoredQueuePick {
  readonly event?: ChronicleEvent;
  readonly queue: readonly AuthoredSceneQueueEntry[];
  readonly diagnostics: readonly string[];
}

function authoredQueuePick(
  queue: readonly AuthoredSceneQueueEntry[],
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
  priorDiagnostics: readonly string[] = [],
): AuthoredQueuePick {
  const diagnostics = [...priorDiagnostics];
  if (diagnostics.length > 0) return { queue, diagnostics };
  const retained: AuthoredSceneQueueEntry[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const entry = queue[index]!;
    const event = content.events.get(entry.sceneId);
    if (event?.chapterId === context.position.chapterId
      && event.slot !== undefined
      && event.slot > context.position.slot) {
      retained.push(entry);
      continue;
    }
    const directorWithoutTargetReservation = {
      ...state,
      pendingCallbacks: state.pendingCallbacks.filter((callback) => callback.targetEventId !== entry.sceneId),
    };
    const eligible = event?.chapterId === context.position.chapterId
      && eligibleScenes(directorWithoutTargetReservation, context, content).some((candidate) => candidate.id === event.id);
    if (event && eligible) {
      return { event, queue: [...retained, ...queue.slice(index + 1)], diagnostics };
    }
    if (entry.requirementMode === 'required') {
      diagnostics.push(
        `Required authored scene ${entry.sceneId} from ${entry.sourceSceneId} is invalid or ineligible${entry.reason ? ` (${entry.reason})` : ''}; continuing at the next valid route anchor.`,
      );
      return { queue: [...retained, ...queue.slice(index + 1)], diagnostics };
    }
  }
  return { queue: retained, diagnostics };
}

function pickCandidate(
  eligible: readonly ChronicleEvent[],
  authored: ChronicleEvent | undefined,
  callback: ChronicleEvent | undefined,
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
  random: number,
  recoverToAnchor: boolean,
): CandidatePick | undefined {
  const anchor = eligible
    .filter((event) => event.type === 'main' && (event.anchorOrder ?? Number.POSITIVE_INFINITY) <= context.position.slot)
    .sort((left, right) => (left.anchorOrder ?? 0) - (right.anchorOrder ?? 0))[0];
  const combatLimitReached = reachedCombatLimit(state, content);
  const threat = state.threat >= THREAT_ENCOUNTER_THRESHOLD && !combatLimitReached
    ? eligible.filter((event) => event.type === 'combat')[0]
    : undefined;
  const pacedEligible = eligible.filter((candidate) =>
    candidate.type !== 'main' && (!combatLimitReached || candidate.type !== 'combat'));
  const paced = selectPacedEvent(pacedEligible, state, context, random);
  const pacedSupport = paced && ['merchant', 'recovery'].includes(scenePacing(paced)) ? paced : undefined;
  const event = authored ?? callback ?? anchor ?? (recoverToAnchor ? undefined : pacedSupport ?? threat ?? paced);
  if (!event) return undefined;
  return {
    event,
    reason: authored
      ? 'authored'
      : callback
        ? 'callback'
      : anchor
        ? 'anchor'
        : event === threat
          ? 'threat'
          : 'paced',
  };
}

function candidatesAtPosition(
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
): ChronicleEvent[] {
  return eligibleScenes(state, context, content).filter((event) =>
    event.slot === undefined
      || event.slot === context.position.slot
      // A due anchor is never abandoned if a callback occupied its authored slot.
      || event.type === 'main');
}

function futureSelectionSlots(
  chapterScenes: readonly ChronicleEvent[],
  state: DirectorState,
  context: JourneyDirectorContext,
): number[] {
  const callbackDeadlines = state.pendingCallbacks
    .filter((callback) => callback.status === 'pending'
      && callback.required
      && callback.deadline.chapterId === context.position.chapterId)
    .map((callback) => callback.deadline.slot);
  return [...new Set([
    ...chapterScenes.map((scene) => scene.slot),
    ...callbackDeadlines,
  ].filter((slot): slot is number => slot !== undefined && slot > context.position.slot))]
    .sort((left, right) => left - right);
}

function chapterRouteComplete(chapterScenes: readonly ChronicleEvent[], state: DirectorState): boolean {
  const anchors = chapterScenes
    .filter((event) => event.type === 'main')
    .sort((left, right) => (left.anchorOrder ?? left.slot ?? 0) - (right.anchorOrder ?? right.slot ?? 0));
  const finalAnchor = anchors[anchors.length - 1];
  if (finalAnchor) {
    return state.usedSceneIds.includes(finalAnchor.id) || state.seenEventIds.includes(finalAnchor.id);
  }
  return chapterScenes.every((scene) => state.usedSceneIds.includes(scene.id));
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
  authoredSceneQueue: readonly AuthoredSceneQueueEntry[],
): DirectorStep {
  return { kind: 'terminal', terminal, diagnostic, state, authoredSceneQueue };
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
export function selectNextScene(
  state: DirectorState,
  context: JourneyDirectorContext,
  content: ContentIndex,
  authoredSceneQueue: readonly AuthoredSceneQueueEntry[] = [],
): DirectorStep {
  const chapterScenes = [...content.events.values()].filter((event) => event.chapterId === context.position.chapterId);
  if (chapterScenes.length === 0) {
    return terminalStep(state, 'precondition', `No Chronicle scenes are authored for ${context.position.chapterId}.`, authoredSceneQueue);
  }
  const rng = createRng(state.rngState);
  const random = rng.next();
  let queuePick = authoredQueuePick(authoredSceneQueue, state, context, content);
  const callback = callbackScene(state, context, content);
  if (!queuePick.event && dueRequiredCallback(state, context) && !callback) {
    return terminalStep(state, 'precondition', 'A required story callback cannot be delivered before its deadline.', queuePick.queue);
  }
  let selectedContext = context;
  let picked = pickCandidate(candidatesAtPosition(state, context, content), queuePick.event, callback, state, context, content, random, queuePick.diagnostics.length > 0);
  if (!picked) {
    // Authored slots are chronology markers, not a promise that every route has a scene at every number.
    // Include callback deadlines even when no ordinary scene is authored there.
    for (const slot of futureSelectionSlots(chapterScenes, state, context)) {
      const futureContext: JourneyDirectorContext = {
        ...context,
        position: { chapterId: context.position.chapterId, slot },
      };
      queuePick = authoredQueuePick(queuePick.queue, state, futureContext, content, queuePick.diagnostics);
      const futureCallback = callbackScene(state, futureContext, content);
      if (!queuePick.event && dueRequiredCallback(state, futureContext) && !futureCallback) {
        return terminalStep(state, 'precondition', 'A required story callback cannot be delivered before its deadline.', queuePick.queue);
      }
      const futureEligible = candidatesAtPosition(state, futureContext, content);
      picked = pickCandidate(futureEligible, queuePick.event, futureCallback, state, futureContext, content, random, queuePick.diagnostics.length > 0);
      if (picked) {
        selectedContext = futureContext;
        break;
      }
    }
  }
  if (!picked) {
    const completed = chapterRouteComplete(chapterScenes, state);
    return terminalStep(
      state,
      completed ? 'completed' : 'precondition',
      completed
        ? `The chapter route is complete for ${context.position.chapterId}; no remaining eligible Chronicle scenes are available.`
        : `No eligible Chronicle scene is available for ${context.position.chapterId} slot ${context.position.slot}.`,
      queuePick.queue,
    );
  }
  return {
    kind: 'selected',
    sceneId: picked.event.id,
    event: picked.event,
    selectedAt: selectedContext.position,
    reason: picked.reason,
    state: nextState(state, picked.event, rng.state),
    authoredSceneQueue: queuePick.queue,
    ...(queuePick.diagnostics.length > 0 ? { diagnostic: queuePick.diagnostics.join(' ') } : {}),
  };
}
