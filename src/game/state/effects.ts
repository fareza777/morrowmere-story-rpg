import { applyCompanionEffect, recruitCompanion } from '../companions';
import type { ContentIndex } from '../content/schema';
import type { GameEffect } from '../domain/effects';
import type { CommandDiagnostic, DomainEvent, DomainResult } from '../domain/result';
import { applyInventoryCommand } from '../inventory';
import { deriveHeroStats } from '../progression';
import type { CampaignState, ExpeditionState } from './types';

export interface EffectState {
  readonly campaign: CampaignState;
  readonly expedition: ExpeditionState | null;
}

export interface AppliedEffects extends EffectState {
  readonly events: readonly DomainEvent[];
}

function failure<T>(code: string, message: string): DomainResult<T, CommandDiagnostic> {
  return { ok: false, error: { code, message } };
}

function unique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

function chapterNumber(chapterId: string): number { return Number(chapterId.slice(2)); }

/** Applies a complete authored batch to local candidates.  The caller receives no partial state on failure. */
export function applyEffectsAtomically(
  state: EffectState,
  effects: readonly GameEffect[],
  content: ContentIndex,
): DomainResult<AppliedEffects, CommandDiagnostic> {
  let campaign = state.campaign;
  let expedition = state.expedition;
  const events: DomainEvent[] = [];

  for (const effect of effects) {
    if (effect.type === 'gold') {
      if (!Number.isSafeInteger(effect.amount)) return failure('invalid_gold', 'Gold changes must be safe whole numbers.');
      if (effect.scope === 'banked') {
        if (campaign.bankedGold + effect.amount < 0) return failure('insufficient_gold', 'You do not have enough banked gold.');
        campaign = { ...campaign, bankedGold: campaign.bankedGold + effect.amount };
      }
      else {
        if (!expedition) return failure('no_expedition', 'There is no expedition to receive unbanked gold.');
        if (expedition.unbankedGold + effect.amount < 0) return failure('insufficient_gold', 'You do not have enough unbanked gold.');
        expedition = { ...expedition, unbankedGold: expedition.unbankedGold + effect.amount };
      }
      events.push({ type: 'notification', message: 'Gold updated.' });
      continue;
    }
    if (effect.type === 'item') {
      if (!content.items.has(effect.itemId)) return failure('invalid_item', 'That item is not available.');
      if (!Number.isInteger(effect.quantity) || effect.quantity <= 0) return failure('invalid_quantity', 'Item quantity must be a positive whole number.');
      if (!expedition) return failure('no_expedition', 'There is no expedition to receive loot.');
      const loot = [...expedition.unbankedLoot];
      let inventory = campaign.inventory;
      if (effect.operation === 'grant') {
        const added = applyInventoryCommand(inventory, { type: 'add', itemId: effect.itemId, quantity: effect.quantity }, content.items);
        if (!added.ok) return failure(added.error.code, added.error.message);
        inventory = added.value;
        for (let i = 0; i < effect.quantity; i += 1) loot.push(effect.itemId);
      } else {
        let remaining = effect.quantity;
        for (let index = loot.length - 1; index >= 0 && remaining > 0; index -= 1) {
          if (loot[index] === effect.itemId) { loot.splice(index, 1); remaining -= 1; }
        }
        if (remaining > 0) return failure('item_not_found', 'That item is not available in this expedition.');
        for (let count = 0; count < effect.quantity; count += 1) {
          const entry = inventory.pack.find((candidate) => candidate.itemId === effect.itemId);
          if (!entry) return failure('item_not_found', 'That item is not available in this expedition.');
          const removed = applyInventoryCommand(inventory, { type: 'discard', entryId: entry.id, quantity: 1 }, content.items);
          if (!removed.ok) return failure(removed.error.code, removed.error.message);
          inventory = removed.value;
        }
      }
      campaign = { ...campaign, inventory };
      expedition = { ...expedition, unbankedLoot: loot };
      events.push({ type: 'item_changed', itemId: effect.itemId, quantity: effect.operation === 'grant' ? effect.quantity : -effect.quantity });
      continue;
    }
    if (effect.type === 'flag') {
      campaign = { ...campaign, flags: effect.operation === 'add' ? unique(campaign.flags, effect.flagId) : campaign.flags.filter((flag) => flag !== effect.flagId) };
      continue;
    }
    if (effect.type === 'faction') {
      if (!Number.isFinite(effect.amount)) return failure('invalid_faction', 'Faction changes must be finite numbers.');
      campaign = { ...campaign, factions: { ...campaign.factions, [effect.factionId]: (campaign.factions[effect.factionId] ?? 0) + effect.amount } };
      continue;
    }
    if (effect.type === 'companion') {
      const roster = effect.operation === 'recruit'
        ? recruitCompanion(campaign.companions, effect.companionId, campaign, content)
        : applyCompanionEffect(campaign.companions, { type: 'leave', companionId: effect.companionId });
      if (!roster.ok) return failure(roster.error.code, roster.error.message);
      campaign = { ...campaign, companions: roster.value };
      continue;
    }
    if (effect.type === 'callback') {
      if (!expedition) return failure('no_expedition', 'There is no expedition to schedule that callback.');
      const target = content.events.get(effect.promise.targetEventId);
      if (!target) return failure('invalid_callback', 'That callback target is not available.');
      if (!Number.isSafeInteger(effect.promise.deadline.slot) || effect.promise.deadline.slot < 1 || target.chapterId !== effect.promise.deadline.chapterId || chapterNumber(effect.promise.deadline.chapterId) < chapterNumber(expedition.position.chapterId) || (effect.promise.deadline.chapterId === expedition.position.chapterId && effect.promise.deadline.slot < expedition.position.slot) || (target.anchorOrder !== undefined && target.anchorOrder > effect.promise.deadline.slot)) {
        return failure('invalid_callback', 'That callback deadline is not valid for this route.');
      }
      expedition = { ...expedition, director: { ...expedition.director, pendingCallbacks: [...expedition.director.pendingCallbacks, { ...effect.promise, status: 'pending', required: true }] } };
      continue;
    }
    if (effect.type === 'combat') {
      if (!content.encounters.has(effect.encounterId)) return failure('invalid_encounter', 'That encounter is not available.');
      if (!expedition) return failure('no_expedition', 'There is no expedition to start combat.');
      if (expedition.currentCombat) return failure('combat_active', 'Finish the current encounter first.');
      expedition = { ...expedition, currentCombat: { encounterId: effect.encounterId, combat: null } };
      events.push({ type: 'combat_started', encounterId: effect.encounterId });
      continue;
    }
    if (!expedition) return failure('no_expedition', 'There is no expedition to change vital resources.');
    if ((effect.health !== undefined && !Number.isFinite(effect.health)) || (effect.resource !== undefined && !Number.isFinite(effect.resource))) return failure('invalid_vitals', 'Vital changes must be finite numbers.');
    const maxima = deriveHeroStats(campaign.hero, campaign.inventory, content.items);
    expedition = {
      ...expedition,
      heroVitals: {
        health: Math.max(0, Math.min(maxima.maxHealth, expedition.heroVitals.health + (effect.health ?? 0))),
        resource: Math.max(0, Math.min(maxima.maxFocus, expedition.heroVitals.resource + (effect.resource ?? 0))),
      },
    };
    events.push({ type: 'notification', message: 'Vital resources updated.' });
  }
  return { ok: true, value: { campaign, expedition, events } };
}
