import type { ChronicleEvent } from '../content/schema';
import type { DirectorState, JourneyDirectorContext, RouteOption, ScenePacing } from './types';

export const ROUTE_OPTIONS: readonly RouteOption[] = [
  {
    id: 'kings-road', label: "The King's Road", description: 'Lower risk, frequent merchants, and reliable recovery.',
    risk: 1, recoveryBias: 3, merchantBias: 3,
  },
  {
    id: 'old-forest', label: 'The Old Forest', description: 'Balanced danger with companion and exploration opportunities.',
    risk: 2, recoveryBias: 2, merchantBias: 1,
  },
  {
    id: 'ruined-pass', label: 'The Ruined Pass', description: 'High-risk relic hunting with scarce recovery and trade.',
    risk: 3, recoveryBias: 1, merchantBias: 0,
  },
] as const;

export function chooseRouteOptions(_state: DirectorState, _context: JourneyDirectorContext): readonly RouteOption[] {
  return ROUTE_OPTIONS;
}

export function scenePacing(event: ChronicleEvent): ScenePacing {
  if (event.pacing) return event.pacing;
  if (event.type === 'combat') return 'danger';
  if (event.type === 'hub') return 'recovery';
  return 'quiet';
}

function stepsSince(kinds: readonly ScenePacing[], kind: ScenePacing): number {
  const last = kinds.lastIndexOf(kind);
  return last === -1 ? kinds.length : kinds.length - last - 1;
}

export function pacingCandidates(events: readonly ChronicleEvent[], state: DirectorState): readonly ChronicleEvent[] {
  const supportSince = Math.min(
    stepsSince(state.recentSceneKinds, 'merchant'),
    stepsSince(state.recentSceneKinds, 'recovery'),
  );
  const merchantMissing = !state.recentSceneKinds.includes('merchant');
  const recoveryMissing = !state.recentSceneKinds.includes('recovery');
  if (supportSince >= 3 && merchantMissing) {
    const merchants = events.filter((event) => scenePacing(event) === 'merchant');
    if (merchants.length > 0) return merchants;
  }
  if (supportSince >= 3 && recoveryMissing) {
    const recovery = events.filter((event) => scenePacing(event) === 'recovery');
    if (recovery.length > 0) return recovery;
  }
  if (supportSince >= 3) {
    const support = events.filter((event) => {
      const pacing = scenePacing(event);
      return pacing === 'merchant' || pacing === 'recovery';
    });
    if (support.length > 0) return support;
  }
  const nonSupport = events.filter((event) => {
    const pacing = scenePacing(event);
    return pacing !== 'merchant' && pacing !== 'recovery';
  });
  return nonSupport.length > 0 ? nonSupport : events;
}

export function routeWeight(event: ChronicleEvent, context: JourneyDirectorContext): number {
  const profile = ROUTE_OPTIONS.find((option) => option.id === context.routeProfile)!;
  const pacing = scenePacing(event);
  const base = event.weight ?? 1;
  if (pacing === 'danger') return base * profile.risk;
  if (pacing === 'merchant') return base * Math.max(0.25, profile.merchantBias);
  if (pacing === 'recovery') return base * profile.recoveryBias;
  return base;
}

export function nextTension(state: DirectorState, event: ChronicleEvent): number {
  const change = event.tensionChange ?? (scenePacing(event) === 'danger' ? 2 : scenePacing(event) === 'recovery' ? -2 : -1);
  return Math.max(0, Math.min(10, state.tension + change));
}

export function nextThreat(state: DirectorState, event: ChronicleEvent): number {
  const change = event.threatChange ?? (scenePacing(event) === 'danger' ? -3 : scenePacing(event) === 'recovery' ? -1 : 1);
  return Math.max(0, Math.min(10, state.threat + change));
}
