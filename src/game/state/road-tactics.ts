import { activeCompanion } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { DomainEvent } from '../domain/result';
import { selectNextScene } from '../director';
import { deriveHeroStats } from '../progression';
import type { GameStateV2, GameTransition, HeroVitals } from './types';

export type TravelAction = 'scout' | 'press-on' | 'make-camp' | 'companion';

function transition(state: GameStateV2, changed: GameStateV2, events: readonly DomainEvent[], diagnostic?: GameTransition['diagnostic']): GameTransition {
  const sequence = state.campaign.transitionCounter + 1;
  return {
    state: { ...changed, campaign: { ...changed.campaign, transitionCounter: sequence } },
    events: events.map((domain, index) => ({ domain, eventId: `${sequence}:${index}`, sequence })),
    ...(diagnostic ? { diagnostic } : {}),
  };
}

function clampVitals(vitals: HeroVitals, state: GameStateV2, content: ContentIndex): HeroVitals {
  const maxima = deriveHeroStats(state.campaign.hero, state.campaign.inventory, content.items);
  return {
    health: Math.max(0, Math.min(maxima.maxHealth, vitals.health)),
    resource: Math.max(0, Math.min(maxima.maxFocus, vitals.resource)),
  };
}

function roadBoon(boons: readonly string[], boon: string): readonly string[] {
  return boons.includes(boon) ? boons : [...boons, boon];
}

/** Leaves a resolved scene behind while preserving its receipt for hub banking. */
export function enterTravel(state: GameStateV2, updatedAt: string): GameStateV2 {
  if (!state.expedition) return state;
  return {
    ...state,
    expedition: { ...state.expedition, currentSceneId: null, dialogueBeatIndex: 0 },
    flow: { ...state.flow, screen: 'travel', merchant: null },
    updatedAt,
  };
}

function companionEffect(companionId: string, vitals: HeroVitals) {
  switch (companionId) {
    case 'mara': return { vitals, threat: -2, tension: 0, boon: 'road:scouted' };
    case 'rukhar': return { vitals, threat: -1, tension: -1, boon: 'road:guarded' };
    case 'caldus': return { vitals: { health: vitals.health + 8, resource: vitals.resource + 1 }, threat: 0, tension: 0, boon: 'road:rested' };
    case 'lyra': return { vitals, threat: -1, tension: 0, boon: 'road:proof' };
    case 'talla': return { vitals, threat: -1, tension: -1, boon: 'road:hidden' };
    default: return null;
  }
}

export function resolveTravelAction(state: GameStateV2, action: TravelAction, content: ContentIndex, updatedAt: string): GameTransition {
  const expedition = state.expedition;
  if (!expedition || state.flow.screen !== 'travel' || expedition.currentCombat || expedition.pendingReward) {
    return { state, events: [], diagnostic: { code: 'travel_required', message: 'Choose a road tactic while travelling.' } };
  }

  let vitals = expedition.heroVitals;
  let threat = expedition.director.threat;
  let tension = expedition.director.tension;
  let boon: string;
  if (action === 'scout') {
    if (vitals.resource < 1) return { state, events: [], diagnostic: { code: 'insufficient_resource', message: 'Scout requires one resource.' } };
    vitals = { ...vitals, resource: vitals.resource - 1 };
    threat -= 2;
    boon = 'road:scouted';
  } else if (action === 'press-on') {
    threat += 1;
    tension += 1;
    boon = 'road:pressed';
  } else if (action === 'make-camp') {
    vitals = { health: vitals.health + 6, resource: vitals.resource + 2 };
    tension += 1;
    boon = 'road:rested';
  } else {
    const companion = activeCompanion(state.campaign.companions);
    if (!companion || companion.status !== 'recruited') {
      return { state, events: [], diagnostic: { code: 'companion_required', message: 'Activate a recruited companion before using their road move.' } };
    }
    const effect = companionEffect(companion.companionId, vitals);
    if (!effect) return { state, events: [], diagnostic: { code: 'companion_unavailable', message: 'That companion has no road move.' } };
    vitals = effect.vitals;
    threat += effect.threat;
    tension += effect.tension;
    boon = effect.boon;
  }

  const prepared = {
    ...expedition,
    heroVitals: clampVitals(vitals, state, content),
    temporaryBoons: roadBoon(expedition.temporaryBoons, boon!),
    director: { ...expedition.director, threat: Math.max(0, Math.min(10, threat)), tension: Math.max(0, Math.min(10, tension)) },
  };
  const step = selectNextScene(prepared.director, {
    position: prepared.position,
    level: state.campaign.hero.level,
    flags: state.campaign.flags,
    inventoryTags: [...state.campaign.inventory.pack, ...state.campaign.inventory.stash]
      .flatMap((entry) => content.items.get(entry.itemId)?.tags ?? []),
    routeProfile: prepared.routeProfile,
    bankedGold: state.campaign.bankedGold,
    unbankedGold: prepared.unbankedGold,
    inventory: state.campaign.inventory,
  }, content, prepared.authoredSceneQueue);
  const event: DomainEvent = { type: 'travel_action_taken', action };
  if (step.kind !== 'selected') {
    return transition(state, { ...state, expedition: prepared, updatedAt }, [event], { code: 'scene_unavailable', message: step.diagnostic });
  }
  const autoResolved = step.event.choices.length === 0 && (step.event.dialogue?.length ?? 0) === 0;
  const visitOrdinal = (prepared.sceneVisitCounts[step.sceneId] ?? 0) + 1;
  const selected = {
    ...prepared,
    director: step.state,
    authoredSceneQueue: step.authoredSceneQueue,
    sceneVisitCounts: { ...prepared.sceneVisitCounts, [step.sceneId]: visitOrdinal },
    currentSceneId: step.sceneId,
    dialogueBeatIndex: 0,
    sceneResolution: autoResolved ? {
      eventId: step.sceneId, choiceId: null, resultKind: 'direct' as const, chance: null, roll: null,
      outcome: step.event.narrative.at(-1) ?? step.event.title, effectSummary: [], nextSceneId: null, continueLabel: null,
    } : null,
    position: { ...step.selectedAt, slot: step.selectedAt.slot + 1 },
  };
  return transition(state, {
    ...state,
    campaign: { ...state.campaign, directorMemory: { rngState: step.state.rngState, seenEventIds: [...step.state.seenEventIds], familyCooldowns: { ...step.state.familyCooldowns }, pendingCallbacks: step.state.pendingCallbacks.map((callback) => ({ ...callback, deadline: { ...callback.deadline } })) } },
    expedition: selected,
    flow: { ...state.flow, screen: 'story', merchant: null },
    updatedAt,
  }, [event, ...(step.diagnostic ? [{ type: 'notification' as const, message: step.diagnostic }] : []), { type: 'notification', message: 'Scene ready.' }]);
}
