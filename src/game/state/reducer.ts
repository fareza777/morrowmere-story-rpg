import { applyCompanionEffect, buildCompanionCombatSnapshot } from '../companions';
import { createEncounter } from '../combat/encounters';
import { resolveCombatTurn } from '../combat/resolve';
import { isChronicleCheckedChoice, type ContentIndex } from '../content/schema';
import { calculateCheckChance, classifyCheckResult, createCheckRoll } from '../checks';
import type { ChapterId, EncounterId, ItemId } from '../domain/ids';
import type { GameEffect } from '../domain/effects';
import type { DomainEvent } from '../domain/result';
import { beginDirectorRun, choiceIsAvailable, selectNextScene } from '../director';
import type { DirectorState } from '../director/types';
import { applyInventoryCommand, useItem, type InventoryState } from '../inventory';
import { generateMerchantVisit, quoteTrade } from '../merchant';
import { isRewardedGoldEligible, shouldShowInterstitial } from '../../native/ads/policy';
import { deriveHeroStats, grantExperience } from '../progression';
import { campaignPayload, cloneCampaignPayload, initialDirector } from './create';
import { applyEffectsAtomically } from './effects';
import type {
  CampSnapshot,
  CampaignCheckpointPayload,
  GameCommand,
  GameStateV2,
  GameTransition,
  HeroVitals,
  SequencedDomainEvent,
} from './types';

function diagnostic(state: GameStateV2, code: string, message: string): GameTransition {
  return { state, events: [], diagnostic: { code, message } };
}

function routeSeed(seed: number, nonce: number): number {
  return (Math.imul(seed >>> 0, 0x9e3779b1) + nonce + 1) >>> 0;
}

function sequenced(events: readonly DomainEvent[], transition: number): readonly SequencedDomainEvent[] {
  return events.map((domain, index) => ({ domain, eventId: `${transition}:${index}`, sequence: transition }));
}

function transient(events: readonly DomainEvent[], sequence: number, commandId: string): readonly SequencedDomainEvent[] {
  return events.map((domain, index) => ({ domain, eventId: `transient:${commandId}:${index}`, sequence }));
}

function commit(
  state: GameStateV2,
  changed: Omit<GameStateV2, 'campaign'> & { readonly campaign: GameStateV2['campaign'] },
  rawEvents: readonly DomainEvent[],
): GameTransition {
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

const CHAPTER_SEQUENCE: readonly ChapterId[] = ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'];

function nextChapterId(chapterId: ChapterId): ChapterId | null {
  const index = CHAPTER_SEQUENCE.indexOf(chapterId);
  return index >= 0 ? CHAPTER_SEQUENCE[index + 1] ?? null : null;
}

function completeChapter(state: GameStateV2, director: DirectorState, updatedAt: string): GameTransition {
  const expedition = state.expedition!;
  const nextChapter = nextChapterId(state.campaign.chapterId);
  const campaign = {
    ...state.campaign,
    chapterId: nextChapter ?? state.campaign.chapterId,
    bankedGold: state.campaign.bankedGold + expedition.unbankedGold,
    directorMemory: directorMemory(director),
    routeSeedNonce: state.campaign.routeSeedNonce + 1,
  };
  const provisional: GameStateV2 = {
    ...state,
    campaign,
    expedition: null,
    adPacing: {
      ...state.adPacing,
      expeditionBreaksSinceInterstitial: state.adPacing.expeditionBreaksSinceInterstitial + 1,
    },
    checkpoints: {
      chapter: { campaign: campaignPayload(campaign), enteredAt: updatedAt },
      camp: { campaign: campaignPayload(campaign), campSceneId: null, savedAt: updatedAt },
    },
    flow: { ...state.flow, screen: nextChapter ? 'camp' : 'ending', overlay: null, merchant: null },
    updatedAt,
  };
  return commit(state, provisional, [{
    type: 'notification',
    message: nextChapter ? `Chapter ${Number(nextChapter.slice(2))} is ready.` : 'Chronicle I complete.',
  }]);
}

function inventoryTags(state: GameStateV2, content: ContentIndex): readonly string[] {
  const ids = [...state.campaign.inventory.pack, ...state.campaign.inventory.stash].map((entry) => entry.itemId);
  return [...new Set(ids.flatMap((id) => content.items.get(id)?.tags ?? []))];
}

function merchantRestockKey(state: GameStateV2, scene: NonNullable<ReturnType<typeof currentScene>>): string {
  return `${state.expedition!.routeSeed}:${scene.merchantId!}:${scene.merchantRestockKey!}`;
}

function derivedMaxima(state: GameStateV2, content: ContentIndex) {
  return deriveHeroStats(state.campaign.hero, state.campaign.inventory, content.items);
}

const CHECK_TAGS: Readonly<Record<'strength' | 'cunning' | 'will', readonly string[]>> = {
  strength: ['axe', 'heavy', 'mace', 'pick', 'polearm'],
  cunning: ['locks', 'navigation', 'ranged', 'scout', 'stealth', 'tool'],
  will: ['conclave', 'focus', 'oath', 'seal', 'ward'],
} as const;

function equippedItemTags(state: GameStateV2, content: ContentIndex): readonly string[] {
  const equipment = state.campaign.inventory.equipment;
  return [equipment.weapon, equipment.armor, ...equipment.charms]
    .flatMap((itemId) => itemId ? content.items.get(itemId)?.tags ?? [] : []);
}

function effectiveCheckStat(
  state: GameStateV2,
  content: ContentIndex,
  stat: 'strength' | 'cunning' | 'will',
): number {
  const derived = derivedMaxima(state, content);
  const companion = buildCompanionCombatSnapshot(state.campaign.companions, content);
  const equipmentBonus = equippedItemTags(state, content).some((tag) => CHECK_TAGS[stat].includes(tag)) ? 1 : 0;
  const companionBonus = companion
    ? stat === 'strength' ? companion.guard : stat === 'cunning' ? companion.attack : companion.will
    : 0;
  const healthPenalty = state.expedition!.heroVitals.health * 2 < derived.maxHealth ? 1 : 0;
  const focusPenalty = stat !== 'strength' && state.expedition!.heroVitals.resource * 2 < derived.maxFocus ? 1 : 0;
  return Math.max(0, derived[stat] + equipmentBonus + companionBonus - healthPenalty - Number(focusPenalty));
}

function effectSummary(effects: readonly GameEffect[], content: ContentIndex): readonly string[] {
  return effects.flatMap((effect) => {
    if (effect.type === 'xp') return [`+${effect.amount} XP`];
    if (effect.type === 'item') {
      const name = content.items.get(effect.itemId)?.name ?? effect.itemId;
      return [`${effect.operation === 'grant' ? '+' : '-'}${effect.quantity} ${name}`];
    }
    if (effect.type === 'flag') return [`${effect.operation === 'add' ? '+' : '-'}${effect.flagId}`];
    if (effect.type === 'gold') return [`${effect.amount >= 0 ? '+' : ''}${effect.amount} Gold`];
    if (effect.type === 'evidence') return [effect.operation === 'add' ? `Evidence gained: ${effect.evidenceId}` : `Evidence removed: ${effect.evidenceId}`];
    if (effect.type === 'faction') return [`${effect.factionId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())} reputation ${effect.amount >= 0 ? '+' : ''}${effect.amount}`];
    if (effect.type === 'companion') {
      const name = content.companions.get(effect.companionId)?.name ?? effect.companionId;
      return [effect.operation === 'recruit' ? `${name} joined` : `${name} left`];
    }
    if (effect.type === 'companion-loyalty') {
      const name = content.companions.get(effect.companionId)?.name ?? effect.companionId;
      return [`${name} loyalty ${effect.amount >= 0 ? '+' : ''}${effect.amount}`];
    }
    if (effect.type === 'companion-quest') {
      const name = content.companions.get(effect.companionId)?.name ?? effect.companionId;
      return [`${name} quest stage ${effect.stage}`];
    }
    if (effect.type === 'companion-injury') {
      const name = content.companions.get(effect.companionId)?.name ?? effect.companionId;
      return [effect.injured ? `${name} injured` : `${name} recovered`];
    }
    if (effect.type === 'threat') return [`Threat ${effect.amount >= 0 ? '+' : ''}${effect.amount}`];
    if (effect.type === 'tension') return [`Tension ${effect.amount >= 0 ? '+' : ''}${effect.amount}`];
    if (effect.type === 'callback') return ['Follow-up scheduled'];
    if (effect.type === 'vitals') return [
      ...(effect.health === undefined ? [] : [`${effect.health >= 0 ? '+' : ''}${effect.health} Health`]),
      ...(effect.resource === undefined ? [] : [`${effect.resource >= 0 ? '+' : ''}${effect.resource} Focus`]),
    ];
    if (effect.type === 'combat') return ['Combat begins'];
    return [];
  });
}

function clampedVitals(vitals: HeroVitals, state: GameStateV2, content: ContentIndex): HeroVitals {
  const stats = derivedMaxima(state, content);
  return {
    health: Math.max(0, Math.min(stats.maxHealth, vitals.health)),
    resource: Math.max(0, Math.min(stats.maxFocus, vitals.resource)),
  };
}

function heroCombatant(state: GameStateV2, content: ContentIndex) {
  const stats = derivedMaxima(state, content);
  const vitals = clampedVitals(state.expedition!.heroVitals, state, content);
  return {
    class: stats.heroClass,
    name: state.campaign.heroName,
    level: stats.level,
    xp: stats.xp,
    health: vitals.health,
    maxHealth: stats.maxHealth,
    focus: vitals.resource,
    maxFocus: stats.maxFocus,
    strength: stats.strength,
    cunning: stats.cunning,
    will: stats.will,
    armor: stats.armor,
    ward: stats.ward,
    attackBonus: Math.max(0, stats.attack - stats.strength),
    guarding: false,
    statuses: [],
    inventory: [],
    equipment: { weapon: null, armor: null, charms: [] },
  };
}

function beginCombat(state: GameStateV2, encounterId: EncounterId, content: ContentIndex) {
  const encounter = content.encounters.get(encounterId);
  if (!encounter || !state.expedition || state.expedition.heroVitals.health <= 0) return null;
  try {
    return createEncounter(
      heroCombatant(state, content),
      encounter,
      content,
      state.expedition.director.rngState,
      undefined,
      buildCompanionCombatSnapshot(state.campaign.companions, content),
    );
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

function removeOneUnbanked(values: readonly ItemId[], itemId: ItemId): readonly ItemId[] {
  const index = values.indexOf(itemId);
  return index < 0 ? values : [...values.slice(0, index), ...values.slice(index + 1)];
}

function removeQuantityByItem(inventory: InventoryState, itemId: ItemId, quantity: number, content: ContentIndex): InventoryState | null {
  let next = inventory;
  let remaining = quantity;
  while (remaining > 0) {
    const entry = next.pack.find((candidate) => candidate.itemId === itemId);
    if (!entry) return null;
    const amount = Math.min(remaining, entry.quantity);
    const removed = applyInventoryCommand(next, { type: 'discard', entryId: entry.id, quantity: amount }, content.items);
    if (!removed.ok) return null;
    remaining -= amount;
    next = removed.value;
  }
  return next;
}

function packQuantity(inventory: InventoryState, itemId: ItemId): number {
  return inventory.pack.reduce((total, entry) => total + (entry.itemId === itemId ? entry.quantity : 0), 0);
}

function inventoryQuantity(inventory: InventoryState, itemId: ItemId): number {
  const packed = [...inventory.pack, ...inventory.stash].reduce((total, entry) => total + (entry.itemId === itemId ? entry.quantity : 0), 0);
  const equipped = [inventory.equipment.weapon, inventory.equipment.armor, ...inventory.equipment.charms]
    .filter((equippedId) => equippedId === itemId).length;
  return packed + equipped + Number(inventory.questItems.includes(itemId));
}

/** Makes the marker ledger match the checkpoint-derived unsecured quantity without trusting stale markers. */
function reconcileUnbankedLoot(values: readonly ItemId[], itemId: ItemId, quantity: number): readonly ItemId[] {
  let remaining = quantity;
  const next = values.flatMap((value) => {
    if (value !== itemId) return [value];
    if (remaining <= 0) return [];
    remaining -= 1;
    return [value];
  });
  while (remaining > 0) {
    next.push(itemId);
    remaining -= 1;
  }
  return next;
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
    encounterFamilyVictories: state.campaign.encounterFamilyVictories,
    companions: state.campaign.companions,
    directorMemory: directorMemory(state.expedition.director),
    bankedGold: restored.bankedGold + recoveredGold,
  });
  const campaign = incrementAttempt({ ...state.campaign, ...secured });
  const provisional: GameStateV2 = {
    ...state,
    campaign,
    expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null, merchant: null },
    updatedAt,
  };
  return { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, camp.campSceneId, updatedAt) } };
}

export function restartChapter(state: GameStateV2, _content: ContentIndex, updatedAt: string): GameStateV2 {
  const restored = cloneCampaignPayload(state.checkpoints.chapter.campaign);
  const campaign = incrementAttempt({ ...state.campaign, ...restored });
  const provisional: GameStateV2 = {
    ...state,
    campaign,
    expedition: null,
    flow: { ...state.flow, screen: 'camp', overlay: null, merchant: null },
    updatedAt,
  };
  return { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, null, updatedAt) } };
}

export function currentScene(state: GameStateV2, content: ContentIndex) {
  return state.expedition?.currentSceneId ? content.events.get(state.expedition.currentSceneId) ?? null : null;
}

export function currentSceneId(state: GameStateV2) {
  return state.expedition?.currentSceneId ?? null;
}

function commitCampMutation(state: GameStateV2, campaign: GameStateV2['campaign'], updatedAt: string, events: readonly DomainEvent[]): GameTransition {
  const provisional = { ...state, campaign, updatedAt };
  const campSceneId = state.checkpoints.camp?.campSceneId ?? null;
  return commit(state, { ...provisional, checkpoints: { ...state.checkpoints, camp: checkpointAtCamp(provisional, campSceneId, updatedAt) } }, events);
}

export function reduceGame(state: GameStateV2, command: GameCommand, content: ContentIndex): GameTransition {
  if (command.type === 'update-profile-settings') {
    const settings = command.settings;
    const valid = Number.isFinite(settings.textScale) && settings.textScale >= 0.5
      && ['highContrast', 'reducedMotion', 'sound', 'music', 'narration', 'haptics', 'reducedHaptics']
        .every((key) => typeof settings[key as keyof typeof settings] === 'boolean');
    if (!valid) return diagnostic(state, 'invalid_settings', 'Those settings could not be saved.');
    return commit(state, { ...state, profile: { ...state.profile, settings: { ...settings } }, updatedAt: command.updatedAt }, []);
  }
  if (command.type === 'CLAIM_REWARDED_GOLD') {
    if (state.adPacing.claimedRewardOfferIds.includes(command.rewardOfferId)) return { state, events: [] };
    const reward = state.expedition?.pendingReward;
    if (!state.expedition || state.flow.screen !== 'reward' || !reward || reward.rewardOfferId !== command.rewardOfferId) {
      return diagnostic(state, 'rewarded_gold_unavailable', 'That optional gold reward is no longer available.');
    }
    if (!isRewardedGoldEligible(reward, state.adPacing)) {
      return diagnostic(state, 'rewarded_gold_ineligible', 'This battle does not qualify for optional bonus gold.');
    }
    const pendingReward = { ...reward, rewardedGoldSettlement: 'claimed' as const };
    const adPacing = {
      ...state.adPacing,
      rewardedShownAtCurrentBreak: true,
      claimedRewardOfferIds: [...state.adPacing.claimedRewardOfferIds, reward.rewardOfferId],
      rewardedClaimsThisExpedition: state.adPacing.rewardedClaimsThisExpedition + 1,
    };
    return commit(state, {
      ...state,
      expedition: { ...state.expedition, pendingReward, unbankedGold: state.expedition.unbankedGold + reward.baseGold },
      adPacing,
      updatedAt: command.updatedAt,
    }, [{ type: 'notification', message: `${reward.baseGold} bonus gold earned.` }]);
  }
  if (command.type === 'RECORD_INTERSTITIAL_SHOWN') {
    const shownAt = Date.parse(command.shownAt);
    if (state.flow.screen !== 'camp' || state.expedition || !shouldShowInterstitial(state.adPacing, shownAt)) {
      return diagnostic(state, 'interstitial_not_due', 'An interstitial is not due at this safe break.');
    }
    return commit(state, {
      ...state,
      adPacing: {
        ...state.adPacing,
        lastInterstitialAt: command.shownAt,
        expeditionBreaksSinceInterstitial: 0,
        rewardedShownAtCurrentBreak: false,
      },
      updatedAt: command.updatedAt,
    }, []);
  }
  if (command.type === 'return-to-camp-after-defeat') {
    const next = returnToCampAfterDefeat(state, content, command.updatedAt);
    return next === state
      ? diagnostic(state, 'defeat_required', 'You can return to camp only after defeat.')
      : commit(state, next, [{ type: 'notification', message: 'Returned to camp.' }]);
  }
  if (command.type === 'restart-chapter') {
    return commit(state, restartChapter(state, content, command.updatedAt), [{ type: 'notification', message: 'Chapter restarted.' }]);
  }
  if (command.type === 'set-active-companion') {
    if (state.flow.screen !== 'camp' || state.expedition) return diagnostic(state, 'camp_required', 'Choose a companion while at camp.');
    if (command.companionId === null) {
      const companions = { ...state.campaign.companions, activeCompanionId: null };
      return commitCampMutation(state, { ...state.campaign, companions }, command.updatedAt, [{ type: 'companion_activated', companionId: null }]);
    }
    const activated = applyCompanionEffect(state.campaign.companions, { type: 'activate', companionId: command.companionId });
    if (!activated.ok) return diagnostic(state, activated.error.code, activated.error.message);
    return commitCampMutation(state, { ...state.campaign, companions: activated.value }, command.updatedAt, [{ type: 'companion_activated', companionId: command.companionId }]);
  }
  if (command.type === 'start-expedition') {
    if (state.flow.screen !== 'camp' || state.expedition) return diagnostic(state, 'camp_required', 'Start a route from camp.');
    const seed = routeSeed(state.campaign.seed, state.campaign.routeSeedNonce);
    const seededDirector = {
      ...initialDirector(seed),
      ...state.campaign.directorMemory,
      usedSceneIds: [],
      recentSceneKinds: [],
      recentFamilies: [],
      currentRunBlockedFamilies: [],
      tension: 2,
      threat: 0,
    };
    const stats = derivedMaxima(state, content);
    const expedition = {
      routeProfile: command.routeProfile ?? 'kings-road', routeSeed: seed, director: beginDirectorRun(seededDirector),
      position: { chapterId: state.campaign.chapterId, slot: 1 }, currentSceneId: null, sceneResolution: null,
      heroVitals: { health: stats.maxHealth, resource: stats.maxFocus }, currentCombat: null, pendingReward: null,
      unbankedGold: 0, unbankedLoot: [], temporaryBoons: [], merchantVisits: [],
    } as const;
    return commit(state, {
      ...state,
      expedition,
      adPacing: { ...state.adPacing, rewardedShownAtCurrentBreak: false, rewardedClaimsThisExpedition: 0 },
      flow: { ...state.flow, screen: 'story', merchant: null },
      updatedAt: command.updatedAt,
    }, [{ type: 'notification', message: 'Expedition started.' }]);
  }
  if (command.type === 'bank-camp') {
    if (!state.expedition || state.flow.screen !== 'story' || state.expedition.currentCombat || state.expedition.pendingReward || state.flow.merchant) return diagnostic(state, 'safe_hub_required', 'Secure an expedition only at a safe hub.');
    const scene = currentScene(state, content);
    if (!scene || scene.type !== 'hub' || state.expedition.sceneResolution?.eventId !== scene.id) return diagnostic(state, 'safe_hub_required', 'Secure an expedition only at a safe hub.');
    const gold = state.expedition.unbankedGold;
    const securedInventory = state.checkpoints.camp?.campaign.inventory ?? state.campaign.inventory;
    let inventory = state.campaign.inventory;
    const lootCounts = new Map<ItemId, number>();
    for (const itemId of state.expedition.unbankedLoot) lootCounts.set(itemId, (lootCounts.get(itemId) ?? 0) + 1);
    for (const [itemId, quantity] of lootCounts) {
      const alreadyUnsecured = Math.max(0, inventoryQuantity(inventory, itemId) - inventoryQuantity(securedInventory, itemId));
      const missing = Math.max(0, quantity - alreadyUnsecured);
      if (missing === 0) continue;
      const added = applyInventoryCommand(inventory, { type: 'add', itemId, quantity: missing }, content.items);
      if (!added.ok) return diagnostic(state, added.error.code, added.error.message);
      inventory = added.value;
    }
    const campaign = { ...state.campaign, inventory, bankedGold: state.campaign.bankedGold + gold, directorMemory: directorMemory(state.expedition.director), routeSeedNonce: state.campaign.routeSeedNonce + 1 };
    const provisional: GameStateV2 = {
      ...state,
      campaign,
      expedition: null,
      adPacing: { ...state.adPacing, expeditionBreaksSinceInterstitial: state.adPacing.expeditionBreaksSinceInterstitial + 1 },
      flow: { ...state.flow, screen: 'camp', merchant: null },
      updatedAt: command.updatedAt,
    };
    return commit(state, { ...provisional, checkpoints: { ...provisional.checkpoints, camp: checkpointAtCamp(provisional, scene.id, command.updatedAt) } }, [{ type: 'camp_banked', sceneId: scene.id, gold }]);
  }
  if (command.type === 'inventory') {
    if (state.expedition?.currentCombat && (command.command.type === 'equip' || command.command.type === 'unequip')) return diagnostic(state, 'combat_active', 'Equipment cannot be changed during combat.');
    if ((command.command.type === 'move' || command.command.type === 'discard') && (state.flow.screen !== 'camp' || state.expedition)) return diagnostic(state, 'camp_required', 'Move or discard items while at camp.');
    const inventoryCommand = command.command.type === 'equip' ? { ...command.command, heroClass: state.campaign.hero.heroClass } : command.command;
    const result = applyInventoryCommand(state.campaign.inventory, inventoryCommand, content.items);
    if (!result.ok) return diagnostic(state, result.error.code, result.error.message);
    const campaign = { ...state.campaign, inventory: result.value };
    let expedition = state.expedition;
    if (expedition) expedition = { ...expedition, heroVitals: clampedVitals(expedition.heroVitals, { ...state, campaign }, content) };
    if (state.flow.screen === 'camp' && !expedition) return commitCampMutation(state, campaign, command.updatedAt, [{ type: 'notification', message: 'Inventory updated.' }]);
    return commit(state, { ...state, campaign, expedition, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Inventory updated.' }]);
  }
  if (command.type === 'select-next-scene') {
    if (!state.expedition || state.flow.screen !== 'story') return diagnostic(state, 'story_required', 'Select the next scene while travelling.');
    const current = currentScene(state, content);
    if (current && current.choices.length > 0 && state.expedition.sceneResolution?.eventId !== current.id) return diagnostic(state, 'choice_required', 'Resolve the current choice before continuing.');
    const step = selectNextScene(state.expedition.director, { position: state.expedition.position, level: state.campaign.hero.level, flags: state.campaign.flags, inventoryTags: inventoryTags(state, content), routeProfile: state.expedition.routeProfile }, content);
    if (step.kind !== 'selected') {
      return step.terminal === 'completed'
        ? completeChapter(state, step.state, command.updatedAt)
        : diagnostic(state, 'scene_unavailable', step.diagnostic);
    }
    const expedition = { ...state.expedition, director: step.state, currentSceneId: step.sceneId, sceneResolution: step.event.choices.length === 0 ? { eventId: step.sceneId, choiceId: null } : null, position: { ...step.selectedAt, slot: step.selectedAt.slot + 1 } };
    return commit(state, { ...state, campaign: { ...state.campaign, directorMemory: directorMemory(step.state) }, expedition, updatedAt: command.updatedAt }, [{ type: 'notification', message: 'Scene ready.' }]);
  }
  if (command.type === 'resolve-choice') {
    if (!state.expedition || state.flow.screen !== 'story') return diagnostic(state, 'story_required', 'Resolve choices while travelling.');
    const scene = currentScene(state, content);
    if (!scene || scene.id !== command.eventId) return diagnostic(state, 'stale_event', 'That story choice is no longer current.');
    if (state.expedition.sceneResolution?.eventId === scene.id) return diagnostic(state, 'choice_resolved', 'That choice has already been resolved.');
    const choice = scene.choices.find((candidate) => candidate.id === command.choiceId);
    if (!choice) return diagnostic(state, 'invalid_choice', 'That choice does not belong to this scene.');
    if (!choiceIsAvailable(choice, state.campaign.flags, state.expedition.position)) {
      return diagnostic(state, 'choice_unavailable', 'Earlier decisions have closed that choice.');
    }
    const checked = isChronicleCheckedChoice(choice);
    const modifier = checked
      ? choice.check.modifiers?.reduce((total, entry) => total + entry.amount, 0) ?? 0
      : 0;
    const chance = checked
      ? calculateCheckChance(effectiveCheckStat(state, content, choice.check.stat), choice.check.difficulty, modifier)
      : null;
    const roll = checked
      ? createCheckRoll(state.campaign.seed, scene.id, state.expedition.position.slot, choice.id)
      : null;
    const resultKind = checked && chance !== null && roll !== null
      ? classifyCheckResult(roll, chance)
      : 'direct' as const;
    const branch = checked
      ? resultKind === 'critical-success' ? choice.check.criticalSuccess ?? choice.check.success
        : resultKind === 'critical-failure' ? choice.check.criticalFailure ?? choice.check.failure
          : resultKind === 'success' ? choice.check.success : choice.check.failure
      : null;
    const effects: readonly GameEffect[] = branch
      ? [...branch.effects, ...(branch.combatEncounterId ? [{ type: 'combat' as const, encounterId: branch.combatEncounterId }] : [])]
      : isChronicleCheckedChoice(choice) ? [] : choice.effects;
    const applied = applyEffectsAtomically(state, effects, content);
    if (!applied.ok) return diagnostic(state, applied.error.code, applied.error.message);
    const bankedGoldDelta = applied.value.campaign.bankedGold - state.campaign.bankedGold;
    let checkpoints = state.checkpoints;
    if (bankedGoldDelta !== 0 && state.checkpoints.camp) {
      const checkpointGold = state.checkpoints.camp.campaign.bankedGold + bankedGoldDelta;
      if (checkpointGold < 0) return diagnostic(state, 'insufficient_gold', 'You do not have enough secured gold.');
      checkpoints = {
        ...state.checkpoints,
        camp: {
          ...state.checkpoints.camp,
          campaign: cloneCampaignPayload({ ...state.checkpoints.camp.campaign, bankedGold: checkpointGold }),
        },
      };
    }
    let expedition = {
      ...applied.value.expedition!,
      sceneResolution: {
        eventId: scene.id,
        choiceId: choice.id,
        resultKind,
        chance,
        roll,
        outcome: branch?.outcome ?? choice.outcome,
        effectSummary: effectSummary(effects, content),
        nextSceneId: branch?.nextSceneId ?? null,
        continueLabel: branch?.continueLabel ?? null,
      },
    };
    const events: DomainEvent[] = [{ type: 'choice_resolved', eventId: scene.id, choiceId: choice.id }, ...applied.value.events];
    if (expedition.heroVitals.health <= 0) {
      expedition = { ...expedition, currentCombat: null, pendingReward: null };
      return commit(state, { ...state, campaign: applied.value.campaign, expedition, checkpoints, flow: { ...state.flow, screen: 'defeat', merchant: null }, updatedAt: command.updatedAt }, events);
    }
    if (!expedition.currentCombat && scene.type === 'combat' && scene.encounterId) {
      expedition = { ...expedition, currentCombat: { encounterId: scene.encounterId, combat: null } };
    }
    if (expedition.currentCombat && !expedition.currentCombat.combat) {
      const temporary = { ...state, campaign: applied.value.campaign, expedition };
      const combat = beginCombat(temporary, expedition.currentCombat.encounterId, content);
      if (!combat) return diagnostic(state, 'invalid_encounter', 'That encounter cannot be started.');
      expedition = { ...expedition, currentCombat: { ...expedition.currentCombat, combat } };
      return commit(state, { ...state, campaign: applied.value.campaign, expedition, checkpoints, flow: { ...state.flow, screen: 'combat', merchant: null }, updatedAt: command.updatedAt }, events);
    }
    return commit(state, { ...state, campaign: applied.value.campaign, expedition, checkpoints, updatedAt: command.updatedAt }, events);
  }
  if (command.type === 'use-item') {
    if (!state.expedition || state.flow.screen !== 'story' || state.expedition.currentCombat) return diagnostic(state, 'field_required', 'Use that item while travelling outside combat.');
    const entry = state.campaign.inventory.pack.find((candidate) => candidate.id === command.entryId);
    const item = entry ? content.items.get(entry.itemId) : undefined;
    if (!entry || !item) return diagnostic(state, 'entry_not_found', 'That item is not in your pack.');
    if (item.stats.attack !== undefined || item.stats.armor !== undefined || item.stats.ward !== undefined || item.stats.will !== undefined) return diagnostic(state, 'item_not_usable', 'That item needs an explicit field-duration effect.');
    const stats = derivedMaxima(state, content);
    const nextVitals = { health: Math.min(stats.maxHealth, state.expedition.heroVitals.health + (item.stats.health ?? 0)), resource: Math.min(stats.maxFocus, state.expedition.heroVitals.resource + (item.stats.focus ?? 0)) };
    if (nextVitals.health === state.expedition.heroVitals.health && nextVitals.resource === state.expedition.heroVitals.resource) return diagnostic(state, 'item_no_effect', 'That item would have no effect right now.');
    const used = useItem(state.campaign.inventory, command.entryId, 'field', content.items);
    if (!used.ok) return diagnostic(state, used.error.code, used.error.message);
    return commit(state, { ...state, campaign: { ...state.campaign, inventory: used.value.inventory }, expedition: { ...state.expedition, heroVitals: nextVitals, unbankedLoot: removeOneUnbanked(state.expedition.unbankedLoot, entry.itemId) }, updatedAt: command.updatedAt }, [{ type: 'consumable_used', instanceId: command.entryId }]);
  }
  if (command.type === 'combat-turn') {
    if (!state.expedition?.currentCombat?.combat || state.flow.screen !== 'combat') return diagnostic(state, 'combat_required', 'Take combat actions only during combat.');
    const beforeInventory = state.campaign.inventory;
    const consumedInstanceId = command.action.type === 'consumable' ? command.action.instanceId : null;
    const usedItemId = consumedInstanceId ? beforeInventory.pack.find((entry) => entry.id === consumedInstanceId)?.itemId ?? null : null;
    const result = resolveCombatTurn(state.expedition.currentCombat.combat, command.action, beforeInventory, { items: content.items });
    if (result.combat === state.expedition.currentCombat.combat && result.inventory === beforeInventory) return { state, events: transient(result.events, state.campaign.transitionCounter, command.commandId) };
    const encounterId = state.expedition.currentCombat.encounterId;
    const encounter = content.encounters.get(encounterId);
    if (!encounter) return diagnostic(state, 'invalid_encounter', 'That encounter is no longer available.');
    const heroVitals = { health: result.combat.player.health, resource: result.combat.player.focus };
    const unbankedLoot = usedItemId ? removeOneUnbanked(state.expedition.unbankedLoot, usedItemId) : state.expedition.unbankedLoot;
    if (result.combat.outcome === 'active') return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.inventory }, expedition: { ...state.expedition, heroVitals, unbankedLoot, currentCombat: { encounterId, combat: result.combat } }, updatedAt: command.updatedAt }, result.events);
    if (result.combat.outcome === 'fled') return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.inventory }, expedition: { ...state.expedition, heroVitals, unbankedLoot, currentCombat: null, pendingReward: null }, flow: { ...state.flow, screen: 'story', merchant: null }, updatedAt: command.updatedAt }, [...result.events, { type: 'combat_ended', encounterId, outcome: 'fled' }]);
    if (result.combat.outcome === 'defeat') return commit(state, { ...state, campaign: { ...state.campaign, inventory: result.inventory }, expedition: { ...state.expedition, heroVitals, unbankedLoot, currentCombat: { encounterId, combat: result.combat }, pendingReward: null }, flow: { ...state.flow, screen: 'defeat', merchant: null }, updatedAt: command.updatedAt }, [...result.events, { type: 'combat_ended', encounterId, outcome: 'defeat' }]);
    const priorVictories = state.campaign.encounterFamilyVictories[encounter.family] ?? 0;
    const xp = grantExperience(state.campaign.hero, { amount: encounter.reward.xp, chapterId: state.campaign.chapterId, source: 'combat', priorEncounterVictories: priorVictories });
    if (!xp.ok) return diagnostic(state, xp.error.code, xp.error.message);
    const rewardId = `${state.expedition.routeSeed}:${state.expedition.position.slot}:${encounterId}`;
    const rewardOfferId = `reward:${state.campaign.seed}:${rewardId}`;
    const adEligible = encounter.kind === 'regular';
    const candidateReward = { rewardOfferId, baseGold: encounter.reward.gold, adEligible, rewardedGoldSettlement: 'available' as const };
    const rewardedGoldSettlement = isRewardedGoldEligible(candidateReward, state.adPacing) ? 'available' as const : 'ineligible' as const;
    const pendingReward = { rewardId, rewardOfferId, encounterId, itemChoices: [...encounter.reward.itemChoices], baseGold: encounter.reward.gold, grantedXp: xp.value.grantedXp, adEligible, rewardedGoldSettlement };
    const campaign = { ...state.campaign, hero: xp.value.hero, inventory: result.inventory, encounterFamilyVictories: { ...state.campaign.encounterFamilyVictories, [encounter.family]: priorVictories + 1 } };
    const completedCombat = { ...result.combat, player: { ...result.combat.player, level: xp.value.hero.level, xp: xp.value.hero.xp } };
    return commit(state, { ...state, campaign, expedition: { ...state.expedition, heroVitals, unbankedLoot, unbankedGold: state.expedition.unbankedGold + encounter.reward.gold, currentCombat: { encounterId, combat: completedCombat }, pendingReward }, flow: { ...state.flow, screen: 'reward', merchant: null }, updatedAt: command.updatedAt }, [
      ...result.events,
      { type: 'combat_ended', encounterId, outcome: 'victory' },
      { type: 'battle_rewards_granted', rewardId, encounterId, gold: encounter.reward.gold, xp: xp.value.grantedXp, adEligible: pendingReward.adEligible },
      ...(xp.value.levelsGained > 0 ? [{ type: 'level_up' as const, level: xp.value.hero.level }] : []),
    ]);
  }
  if (command.type === 'claim-rewards') {
    const receipt = state.expedition?.pendingReward;
    if (!state.expedition || state.flow.screen !== 'reward' || !receipt || receipt.rewardId !== command.rewardId) return diagnostic(state, 'reward_required', 'That battle reward is no longer available.');
    if (command.itemId !== null && !receipt.itemChoices.includes(command.itemId)) return diagnostic(state, 'invalid_reward', 'Choose an item offered by this battle reward.');
    let inventory = state.campaign.inventory;
    let unbankedLoot = state.expedition.unbankedLoot;
    if (command.itemId !== null) {
      const added = applyInventoryCommand(inventory, { type: 'add', itemId: command.itemId }, content.items);
      if (!added.ok) return diagnostic(state, added.error.code, added.error.message);
      inventory = added.value;
      unbankedLoot = [...unbankedLoot, command.itemId];
    }
    return commit(state, { ...state, campaign: { ...state.campaign, inventory }, expedition: { ...state.expedition, unbankedLoot, pendingReward: null, currentCombat: null }, flow: { ...state.flow, screen: 'story', merchant: null }, updatedAt: command.updatedAt }, [{ type: 'battle_reward_claimed', rewardId: receipt.rewardId, itemId: command.itemId }]);
  }
  if (command.type === 'open-merchant') {
    if (!state.expedition || state.flow.screen !== 'story' || state.expedition.currentCombat || state.expedition.pendingReward) return diagnostic(state, 'merchant_required', 'Open a merchant only from an authorized hub.');
    const scene = currentScene(state, content);
    if (!scene || scene.type !== 'hub' || state.expedition.sceneResolution?.eventId !== scene.id || !scene.merchantId || !scene.merchantRestockKey) return diagnostic(state, 'merchant_unavailable', 'That merchant is not available at this scene.');
    const merchant = content.merchants.get(scene.merchantId);
    if (!merchant) return diagnostic(state, 'merchant_unavailable', 'That merchant is not available at this scene.');
    const restockKey = merchantRestockKey(state, scene);
    const persistedVisit = state.expedition.merchantVisits.find((visit) => visit.merchantId === scene.merchantId && visit.restockKey === restockKey);
    const visit = generateMerchantVisit({ content, seed: state.expedition.routeSeed, restockKey, heroLevel: state.campaign.hero.level, chapter: Number(state.campaign.chapterId.slice(2)), reputation: 0, scarcityMultiplier: 1, persistedVisit }, merchant);
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
    const visit = state.expedition.merchantVisits.find((candidate) => candidate.merchantId === state.flow.merchant!.merchantId && candidate.restockKey === state.flow.merchant!.restockKey);
    if (!merchant || !visit) return diagnostic(state, 'merchant_state_missing', 'That merchant visit is no longer available.');
    const context = { content, seed: state.expedition.routeSeed, restockKey: state.flow.merchant.restockKey, heroLevel: state.campaign.hero.level, chapter: Number(state.campaign.chapterId.slice(2)), reputation: 0, scarcityMultiplier: 1, persistedVisit: visit };
    const quote = quoteTrade(visit, state.campaign.inventory, command.intent, context);
    if (!quote.ok) return diagnostic(state, quote.error.code, quote.error.message);
    let inventory: InventoryState;
    let nextVisit = visit;
    let unbankedGold = state.expedition.unbankedGold;
    let bankedGold = state.campaign.bankedGold;
    let campCampaign: CampaignCheckpointPayload | null = state.checkpoints.camp?.campaign ?? null;
    let unbankedLoot = state.expedition.unbankedLoot;
    let unbankedSpent = 0;
    let bankedSpent = 0;
    if (command.intent.type === 'buy') {
      const stockEntryId = command.intent.stockEntryId;
      if (unbankedGold + bankedGold < quote.value.total) return diagnostic(state, 'insufficient_gold', 'You do not have enough gold.');
      const added = applyInventoryCommand(state.campaign.inventory, { type: 'add', itemId: quote.value.itemId }, content.items);
      if (!added.ok) return diagnostic(state, added.error.code, added.error.message);
      inventory = added.value;
      unbankedSpent = Math.min(unbankedGold, quote.value.total);
      bankedSpent = quote.value.total - unbankedSpent;
      unbankedGold -= unbankedSpent;
      bankedGold -= bankedSpent;
      if (campCampaign) campCampaign = { ...campCampaign, bankedGold: campCampaign.bankedGold - bankedSpent };
      unbankedLoot = [...unbankedLoot, quote.value.itemId];
      nextVisit = { ...visit, stock: visit.stock.filter((entry) => entry.id !== stockEntryId) };
    } else {
      const liveQuantityBefore = packQuantity(state.campaign.inventory, quote.value.itemId);
      const securedQuantityBefore = campCampaign ? packQuantity(campCampaign.inventory, quote.value.itemId) : 0;
      const unsecuredQuantityBefore = Math.max(0, liveQuantityBefore - securedQuantityBefore);
      const removed = applyInventoryCommand(state.campaign.inventory, { type: 'discard', entryId: command.intent.entryId, quantity: quote.value.quantity }, content.items);
      if (!removed.ok) return diagnostic(state, removed.error.code, removed.error.message);
      inventory = removed.value;
      unbankedGold += quote.value.total;
      const unsecuredSold = Math.min(unsecuredQuantityBefore, quote.value.quantity);
      const securedSold = quote.value.quantity - unsecuredSold;
      if (securedSold > 0 && campCampaign) {
        const checkpointInventory = removeQuantityByItem(campCampaign.inventory, quote.value.itemId, securedSold, content);
        if (!checkpointInventory) return diagnostic(state, 'merchant_state_missing', 'The secured inventory no longer matches this trade.');
        campCampaign = { ...campCampaign, inventory: checkpointInventory };
      }
      const securedQuantityAfter = campCampaign ? packQuantity(campCampaign.inventory, quote.value.itemId) : 0;
      const unsecuredQuantityAfter = Math.max(0, packQuantity(inventory, quote.value.itemId) - securedQuantityAfter);
      unbankedLoot = reconcileUnbankedLoot(unbankedLoot, quote.value.itemId, unsecuredQuantityAfter);
    }
    const merchantVisits = [...state.expedition.merchantVisits.filter((candidate) => candidate.merchantId !== visit.merchantId || candidate.restockKey !== visit.restockKey), nextVisit];
    return commit(state, { ...state, campaign: { ...state.campaign, inventory, bankedGold }, expedition: { ...state.expedition, merchantVisits, unbankedGold, unbankedLoot }, checkpoints: { ...state.checkpoints, camp: state.checkpoints.camp && campCampaign ? { ...state.checkpoints.camp, campaign: cloneCampaignPayload(campCampaign) } : state.checkpoints.camp }, updatedAt: command.updatedAt }, [{ type: 'trade_completed', merchantId: visit.merchantId, tradeType: quote.value.type, itemId: quote.value.itemId, quantity: quote.value.quantity, total: quote.value.total, unbankedSpent, bankedSpent }]);
  }
  return diagnostic(state, 'unsupported_command', 'That command is not available.');
}
