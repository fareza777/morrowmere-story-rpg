import { applyInventoryCommand } from '../inventory';
import type { ContentIndex } from '../content/schema';
import type { CommandDiagnostic, DomainEvent } from '../domain/result';
import { createEncounter } from '../combat/encounters';
import { resolveCombatTurn } from '../combat/resolve';
import { selectNextScene, beginDirectorRun } from '../director';
import { executeTrade, generateMerchantVisit } from '../merchant';
import { deriveHeroStats } from '../progression';
import { buildCompanionCombatSnapshot } from '../companions';
import type { EncounterId } from '../domain/ids';
import type { DirectorState } from '../director/types';
import { campaignPayload, cloneCampaignPayload, initialDirector } from './create';
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

function directorMemory(director: DirectorState) {
  return {
    rngState: director.rngState,
    seenEventIds: [...director.seenEventIds],
    familyCooldowns: { ...director.familyCooldowns },
    pendingCallbacks: director.pendingCallbacks.map((callback) => ({ ...callback, deadline: { ...callback.deadline } })),
  };
}

function inventoryTags(state: GameStateV2, content: ContentIndex): readonly string[] {
  const ids = [...state.campaign.inventory.pack, ...state.campaign.inventory.stash].map((entry) => entry.itemId);
  return [...new Set(ids.flatMap((id) => content.items.get(id)?.tags ?? []))];
}

function merchantRestockKey(state: GameStateV2, scene: NonNullable<ReturnType<typeof currentScene>>): string {
  return `${state.expedition!.routeSeed}:${scene.merchantId!}:${scene.merchantRestockKey!}`;
}

function heroCombatant(state: GameStateV2, content: ContentIndex) {
  const stats = deriveHeroStats(state.campaign.hero, state.campaign.inventory, content.items);
  return {
    class: stats.heroClass, name: 'The Oathless', level: stats.level, xp: stats.xp,
    health: stats.maxHealth, maxHealth: stats.maxHealth, focus: stats.maxFocus, maxFocus: stats.maxFocus,
    strength: stats.strength, cunning: stats.cunning, will: stats.will, armor: stats.armor, ward: stats.ward, attackBonus: Math.max(0, stats.attack - stats.strength),
    guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
  };
}

function beginCombat(state: GameStateV2, encounterId: EncounterId, content: ContentIndex) {
  const encounter = content.encounters.get(encounterId);
  if (!encounter) return null;
  try {
    return createEncounter(heroCombatant(state, content), encounter, content, state.expedition!.director.rngState, false, buildCompanionCombatSnapshot(state.campaign.companions, content));
  } catch {
    return null;
  }
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
  const restored = cloneCampaignPayload(camp.campaign);
  const secured = cloneCampaignPayload({
    ...restored,
    hero: state.campaign.hero,
    flags: state.campaign.flags,
    evidence: state.campaign.evidence,
    factions: state.campaign.factions,
    companions: state.campaign.companions,
    directorMemory: directorMemory(state.expedition.director),
    bankedGold: restored.bankedGold + recoveredGold,
  });
  const campaign = incrementAttempt({
    ...state.campaign,
    ...secured,
  });
  const provisional: GameStateV2 = {
    ...state, campaign, expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null, merchant: null }, updatedAt,
  };
  return { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, camp.campSceneId, updatedAt) } };
}

export function restartChapter(state: GameStateV2, _content: ContentIndex, updatedAt: string): GameStateV2 {
  const restored = cloneCampaignPayload(state.checkpoints.chapter.campaign);
  const campaign = incrementAttempt({ ...state.campaign, ...restored });
  const provisional: GameStateV2 = {
    ...state, campaign, expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null, merchant: null }, updatedAt,
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
    const seededDirector = { ...initialDirector(seed), ...state.campaign.directorMemory, usedSceneIds: [], recentSceneKinds: [], recentFamilies: [], currentRunBlockedFamilies: [], tension: 2, threat: 0 };
    const expedition = {
      routeProfile: command.routeProfile ?? 'kings-road', routeSeed: seed, director: beginDirectorRun(seededDirector), position: { chapterId: state.campaign.chapterId, slot: 0 }, currentSceneId: null,
      currentCombat: null, pendingRewards: [], unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [],
    } as const;
    return commit(state, { ...state, expedition, flow: { ...state.flow, screen: 'story', merchant: null }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Expedition started.' }]);
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
    const campaign = { ...state.campaign, inventory, bankedGold: state.campaign.bankedGold + state.expedition.unbankedGold, directorMemory: directorMemory(state.expedition.director) };
    const provisional = { ...state, campaign, expedition: { ...state.expedition, unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], pendingRewards: [], currentCombat: null }, flow: { ...state.flow, screen: 'camp' as const, merchant: null }, updatedAt: command.updatedAt };
    return commit(state, { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, command.campSceneId ?? provisional.expedition.currentSceneId, command.updatedAt) } }, [{ type: 'notification', message: 'Camp gains secured.' }]);
  }
  if (command.type === 'apply-effects') {
    const applied = applyEffectsAtomically(state, command.effects, content);
    if (!applied.ok) return diagnostic(state, applied.error.code, applied.error.message);
    if (applied.value.expedition?.currentCombat && !applied.value.expedition.currentCombat.combat) {
      const temporary = { ...state, campaign: applied.value.campaign, expedition: applied.value.expedition };
      const combat = beginCombat(temporary, applied.value.expedition.currentCombat.encounterId, content);
      if (!combat) return diagnostic(state, 'invalid_encounter', 'That encounter cannot be started.');
      return commit(state, { ...state, campaign: applied.value.campaign, expedition: { ...applied.value.expedition, currentCombat: { ...applied.value.expedition.currentCombat, combat } }, flow: { ...state.flow, screen: 'combat', merchant: null }, updatedAt: command.updatedAt }, applied.value.events);
    }
    return commit(state, { ...state, campaign: applied.value.campaign, expedition: applied.value.expedition, updatedAt: command.updatedAt }, applied.value.events);
  }
  if (command.type === 'inventory') {
    const inventoryCommand = command.command.type === 'equip' ? { ...command.command, heroClass: state.campaign.hero.heroClass } : command.command;
    const result = applyInventoryCommand(state.campaign.inventory, inventoryCommand, content.items);
    if (!result.ok) return diagnostic(state, result.error.code, result.error.message);
    return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.value }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Inventory updated.' }]);
  }
  if (command.type === 'select-next-scene') {
    if (!state.expedition || state.flow.screen !== 'story') return diagnostic(state, 'story_required', 'Select the next scene while travelling.');
    const step = selectNextScene(state.expedition.director, { position: state.expedition.position, level: state.campaign.hero.level, flags: state.campaign.flags, inventoryTags: inventoryTags(state, content), routeProfile: state.expedition.routeProfile }, content);
    if (step.kind !== 'selected') return diagnostic(state, 'scene_unavailable', step.diagnostic);
    const expedition = { ...state.expedition, director: step.state, currentSceneId: step.sceneId, position: { ...state.expedition.position, slot: state.expedition.position.slot + 1 } };
    return commit(state, { ...state, campaign: { ...state.campaign, directorMemory: directorMemory(step.state) }, expedition, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Scene ready.' }]);
  }
  if (command.type === 'combat-turn') {
    if (!state.expedition?.currentCombat?.combat || state.flow.screen !== 'combat') return diagnostic(state, 'combat_required', 'Take combat actions only during combat.');
    const result = resolveCombatTurn(state.expedition.currentCombat.combat, command.action, state.campaign.inventory, { items: content.items });
    if (result.combat === state.expedition.currentCombat.combat && result.inventory === state.campaign.inventory) {
      return { state, events: sequenced(result.events, state.campaign.transitionCounter) };
    }
    const screen = result.combat.outcome === 'defeat' ? 'defeat' : result.combat.outcome === 'active' ? 'combat' : 'reward';
    return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.inventory }, expedition: { ...state.expedition, currentCombat: { ...state.expedition.currentCombat, combat: result.combat } }, flow: { ...state.flow, screen, merchant: null }, updatedAt: command.updatedAt }, result.events);
  }
  if (command.type === 'open-merchant') {
    if (!state.expedition || state.flow.screen !== 'story') return diagnostic(state, 'merchant_required', 'Open a merchant only from an authorized hub.');
    const scene = currentScene(state, content);
    if (!scene || scene.type !== 'hub' || !scene.merchantId || !scene.merchantRestockKey) return diagnostic(state, 'merchant_unavailable', 'That merchant is not available at this scene.');
    const merchant = content.merchants.get(scene.merchantId);
    if (!merchant) return diagnostic(state, 'merchant_unavailable', 'That merchant is not available at this scene.');
    const restockKey = merchantRestockKey(state, scene);
    const persistedVisit = state.expedition.merchantVisits.find((visit) => visit.merchantId === scene.merchantId && visit.restockKey === restockKey);
    const context = { content, seed: state.expedition.routeSeed, restockKey, heroLevel: state.campaign.hero.level, chapter: Number(state.campaign.chapterId.slice(2)), reputation: 0, scarcityMultiplier: 1, persistedVisit };
    const visit = generateMerchantVisit(context, merchant);
    const merchantVisits = [...state.expedition.merchantVisits.filter((candidate) => candidate.merchantId !== scene.merchantId || candidate.restockKey !== restockKey), visit];
    return commit(state, { ...state, expedition: { ...state.expedition, merchantVisits }, flow: { ...state.flow, screen: 'merchant', merchant: { merchantId: scene.merchantId, restockKey, returnScreen: 'story' } }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Merchant opened.' }]);
  }
  if (command.type === 'close-merchant') {
    if (state.flow.screen !== 'merchant' || !state.flow.merchant) return diagnostic(state, 'merchant_required', 'There is no merchant to close.');
    return commit(state, { ...state, flow: { ...state.flow, screen: state.flow.merchant.returnScreen, merchant: null }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Merchant closed.' }]);
  }
  if (command.type === 'trade') {
    if (!state.expedition || state.flow.screen !== 'merchant' || !state.flow.merchant) return diagnostic(state, 'merchant_required', 'Trade only while a merchant is open.');
    const scene = currentScene(state, content);
    if (!scene || scene.type !== 'hub' || scene.merchantId !== state.flow.merchant.merchantId || !scene.merchantRestockKey || merchantRestockKey(state, scene) !== state.flow.merchant.restockKey) return diagnostic(state, 'merchant_unavailable', 'That merchant is not available at this scene.');
    const merchant = content.merchants.get(state.flow.merchant.merchantId);
    if (!merchant) return diagnostic(state, 'merchant_not_found', 'That merchant is not available.');
    const persistedVisit = state.expedition.merchantVisits.find((visit) => visit.merchantId === state.flow.merchant!.merchantId && visit.restockKey === state.flow.merchant!.restockKey);
    if (!persistedVisit) return diagnostic(state, 'merchant_state_missing', 'That merchant visit is no longer available.');
    const context = { content, seed: state.expedition.routeSeed, restockKey: state.flow.merchant.restockKey, heroLevel: state.campaign.hero.level, chapter: Number(state.campaign.chapterId.slice(2)), reputation: 0, scarcityMultiplier: 1, persistedVisit };
    const trade = executeTrade(persistedVisit, state.campaign.inventory, state.expedition.unbankedGold, command.intent, context);
    if (!trade.ok) return diagnostic(state, trade.error.code, trade.error.message);
    const merchantVisits = [...state.expedition.merchantVisits.filter((candidate) => candidate.merchantId !== state.flow.merchant!.merchantId || candidate.restockKey !== state.flow.merchant!.restockKey), trade.value.visit];
    return commit(state, { ...state, campaign: { ...state.campaign, inventory: trade.value.inventory }, expedition: { ...state.expedition, merchantVisits, unbankedGold: trade.value.gold }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Trade completed.' }]);
  }
  if (!state.expedition) return diagnostic(state, 'no_expedition', 'There is no expedition to defeat.');
  return commit(state, { ...state, flow: { ...state.flow, screen: 'defeat' }, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Defeat.' }]);
}
