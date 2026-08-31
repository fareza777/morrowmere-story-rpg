import { applyInventoryCommand } from '../inventory';
import type { ContentIndex } from '../content/schema';
import type { CommandDiagnostic, DomainEvent } from '../domain/result';
import { campaignPayload, initialDirector } from './create';
import { applyEffectsAtomically } from './effects';
import type { CampSnapshot, GameCommand, GameStateV2, GameTransition, SequencedDomainEvent } from './types';

function diagnostic(state: GameStateV2, code: string, message: string): GameTransition {
  return { state, events: [], diagnostic: { code, message } };
}

function routeSeed(seed: number, nonce: number): number {
  return (Math.imul(seed >>> 0, 0x9e3779b1) + nonce + 1) >>> 0;
}

function sequenced(events: readonly DomainEvent[], transition: number): readonly SequencedDomainEvent[] {
  return events.map((domain, index) => ({ domain, eventId: `${transition}:${index}`, sequence: transition }));
}

function commit(state: GameStateV2, changed: Omit<GameStateV2, 'campaign'> & { readonly campaign: GameStateV2['campaign'] }, rawEvents: readonly DomainEvent[]): GameTransition {
  const transition = state.campaign.transitionCounter + 1;
  const campaign = { ...changed.campaign, transitionCounter: transition };
  return { state: { ...changed, campaign }, events: sequenced(rawEvents, transition) };
}

function checkpointAtCamp(state: GameStateV2, campSceneId: CampSnapshot['campSceneId'], updatedAt: string): CampSnapshot {
  return { campaign: campaignPayload(state.campaign), campSceneId, savedAt: updatedAt };
}

function incrementAttempt(campaign: GameStateV2['campaign']) {
  const chapterId = campaign.chapterId;
  return {
    ...campaign,
    attemptCounters: { ...campaign.attemptCounters, [chapterId]: (campaign.attemptCounters[chapterId] ?? 0) + 1 },
    routeSeedNonce: campaign.routeSeedNonce + 1,
  };
}

/** The defeat flow remains visible until this command is explicitly requested. */
export function returnToCampAfterDefeat(state: GameStateV2, _content: ContentIndex, updatedAt: string): GameStateV2 {
  if (state.flow.screen !== 'defeat' || !state.expedition) return state;
  const camp = state.checkpoints.camp;
  if (!camp) return state;
  const recoveredGold = Math.floor(state.expedition.unbankedGold * 0.5);
  const restored = camp.campaign;
  const campaign = incrementAttempt({
    ...state.campaign,
    ...restored,
    hero: state.campaign.hero,
    flags: state.campaign.flags,
    evidence: state.campaign.evidence,
    companions: state.campaign.companions,
    bankedGold: restored.bankedGold + recoveredGold,
  });
  return {
    ...state, campaign, expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null }, updatedAt,
  };
}

export function restartChapter(state: GameStateV2, _content: ContentIndex, updatedAt: string): GameStateV2 {
  const restored = state.checkpoints.chapter.campaign;
  const campaign = incrementAttempt({ ...state.campaign, ...restored });
  const provisional: GameStateV2 = {
    ...state, campaign, expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null }, updatedAt,
  };
  return { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, null, updatedAt) } };
}

export function currentScene(state: GameStateV2, content: ContentIndex) {
  return state.expedition?.currentSceneId ? content.events.get(state.expedition.currentSceneId) ?? null : null;
}

export function currentSceneId(state: GameStateV2) {
  return state.expedition?.currentSceneId ?? null;
}

export function reduceGame(state: GameStateV2, command: GameCommand, content: ContentIndex): GameTransition {
  if (command.type === 'return-to-camp-after-defeat') {
    const next = returnToCampAfterDefeat(state, content, command.updatedAt);
    return next === state ? diagnostic(state, 'defeat_required', 'You can return to camp only after defeat.') : commit(state, next, [{ type: 'notification', message: 'Returned to camp.' }]);
  }
  if (command.type === 'restart-chapter') {
    const next = restartChapter(state, content, command.updatedAt);
    return commit(state, next, [{ type: 'notification', message: 'Chapter restarted.' }]);
  }
  if (command.type === 'start-expedition') {
    if (state.flow.screen !== 'camp') return diagnostic(state, 'camp_required', 'Start a route from camp.');
    const seed = routeSeed(state.campaign.seed, state.campaign.routeSeedNonce);
    const expedition = {
      routeProfile: command.routeProfile ?? 'kings-road', routeSeed: seed, director: initialDirector(seed), currentSceneId: null,
      currentCombat: null, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [],
    } as const;
    return commit(state, { ...state, expedition, flow: { ...state.flow, screen: 'story' }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Expedition started.' }]);
  }
  if (command.type === 'bank-camp') {
    if (!state.expedition) return diagnostic(state, 'nothing_to_bank', 'There is nothing to bank at camp.');
    if (state.expedition.unbankedGold === 0 && state.expedition.unbankedLoot.length === 0 && state.expedition.temporaryBoons.length === 0) return diagnostic(state, 'nothing_to_bank', 'There is nothing to bank at camp.');
    let inventory = state.campaign.inventory;
    for (const itemId of state.expedition.unbankedLoot) {
      const applied = applyInventoryCommand(inventory, { type: 'add', itemId, destination: 'stash' }, content.items);
      if (!applied.ok) return diagnostic(state, applied.error.code, applied.error.message);
      inventory = applied.value;
    }
    const campaign = { ...state.campaign, inventory, bankedGold: state.campaign.bankedGold + state.expedition.unbankedGold };
    const provisional = { ...state, campaign, expedition: { ...state.expedition, unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], pendingRewards: [], currentCombat: null }, flow: { ...state.flow, screen: 'camp' as const }, updatedAt: command.updatedAt };
    return commit(state, { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, command.campSceneId ?? provisional.expedition.currentSceneId, command.updatedAt) } }, [{ type: 'notification', message: 'Camp gains secured.' }]);
  }
  if (command.type === 'apply-effects') {
    const applied = applyEffectsAtomically(state, command.effects, content);
    if (!applied.ok) return diagnostic(state, applied.error.code, applied.error.message);
    return commit(state, { ...state, campaign: applied.value.campaign, expedition: applied.value.expedition, updatedAt: command.updatedAt }, applied.value.events);
  }
  if (command.type === 'inventory') {
    const result = applyInventoryCommand(state.campaign.inventory, command.command, content.items);
    if (!result.ok) return diagnostic(state, result.error.code, result.error.message);
    return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.value }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Inventory updated.' }]);
  }
  if (command.type === 'set-scene') {
    if (!state.expedition) return diagnostic(state, 'no_expedition', 'Start an expedition before selecting a scene.');
    if (!content.events.has(command.sceneId)) return diagnostic(state, 'invalid_scene', 'That scene is not available.');
    return commit(state, { ...state, expedition: { ...state.expedition, currentSceneId: command.sceneId }, flow: { ...state.flow, screen: 'story' }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Scene ready.' }]);
  }
  if (!state.expedition) return diagnostic(state, 'no_expedition', 'There is no expedition to defeat.');
  return commit(state, { ...state, flow: { ...state.flow, screen: 'defeat' }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Defeat.' }]);
}
