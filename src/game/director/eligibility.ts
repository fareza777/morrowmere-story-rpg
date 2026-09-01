import {
  type Chronicle1Choice,
  type ChronicleChoice,
  type ChronicleEvent,
  type ChronicleRequirement,
  type ContentIndex,
} from '../content/schema';
import type { EventId, StoryPosition } from '../domain/ids';
import type { InventoryState } from '../inventory';
import type { DirectorState, JourneyDirectorContext } from './types';

export interface ChoiceAvailabilityContext {
  readonly flags: readonly string[];
  readonly bankedGold: number;
  readonly unbankedGold: number;
  readonly inventory: InventoryState;
  readonly resolutionPosition?: StoryPosition;
}

const EMPTY_INVENTORY: InventoryState = {
  pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
};

function isAvailabilityContext(
  context: ChoiceAvailabilityContext | readonly string[],
): context is ChoiceAvailabilityContext {
  return !Array.isArray(context);
}

function availabilityContext(
  context: ChoiceAvailabilityContext | readonly string[],
  resolutionPosition?: StoryPosition,
): ChoiceAvailabilityContext {
  return isAvailabilityContext(context)
    ? context
    : { flags: context, bankedGold: 0, unbankedGold: 0, inventory: EMPTY_INVENTORY, resolutionPosition };
}

function entriesQuantity(entries: readonly { readonly itemId: string; readonly quantity: number }[], itemId: string): number {
  return entries
    .filter((entry) => entry.itemId === itemId)
    .reduce((total, entry) => total + entry.quantity, 0);
}

function itemQuantity(inventory: InventoryState, itemId: string, scope: 'pack' | 'owned'): number {
  const pack = entriesQuantity(inventory.pack, itemId);
  if (scope === 'pack') return pack;
  const equipped = [inventory.equipment.weapon, inventory.equipment.armor, ...inventory.equipment.charms]
    .filter((candidate) => candidate === itemId).length;
  // Equipping removes one pack entry, so equipment is a distinct owned instance.
  return pack + entriesQuantity(inventory.stash, itemId) + inventory.questItems.filter((candidate) => candidate === itemId).length + equipped;
}

function requirementReason(
  requirement: ChronicleRequirement,
  context: ChoiceAvailabilityContext,
  excluded: boolean,
): string | null {
  if (requirement.type === 'flag') {
    const matches = context.flags.includes(requirement.flagId) === (requirement.present ?? true);
    if (matches !== excluded) return null;
    return excluded ? 'An earlier decision has closed this path.' : 'A required earlier decision is missing.';
  }
  if (requirement.type === 'gold') {
    const available = requirement.scope === 'banked' ? context.bankedGold : context.unbankedGold;
    const matches = available >= requirement.amount;
    if (matches !== excluded) return null;
    const label = requirement.scope === 'banked' ? 'secured' : 'unbanked';
    return excluded
      ? `This path is closed while you have at least ${requirement.amount} ${label} gold.`
      : `You need at least ${requirement.amount} ${label} gold.`;
  }
  const scope = requirement.scope ?? 'owned';
  const matches = itemQuantity(context.inventory, requirement.itemId, scope) >= requirement.quantity;
  if (matches !== excluded) return null;
  return excluded
    ? `This path is closed while you carry ${requirement.itemId}.`
    : `You need ${requirement.quantity} ${requirement.itemId} in ${scope === 'pack' ? 'your pack' : 'your gear'}.`;
}

function requirementsAreSatisfied(
  requirements: readonly ChronicleRequirement[] | undefined,
  exclusions: readonly ChronicleRequirement[] | undefined,
  context: ChoiceAvailabilityContext,
): boolean {
  return (requirements?.every((requirement) => requirementReason(requirement, context, false) === null) ?? true)
    && (exclusions?.every((requirement) => requirementReason(requirement, context, true) === null) ?? true);
}

/** Returns the shared gate explanation for both presentation and command validation. */
export function unavailableChoiceReason(
  choice: ChronicleChoice | Chronicle1Choice,
  input: ChoiceAvailabilityContext | readonly string[],
  resolutionPosition?: StoryPosition,
): string | null {
  const context = availabilityContext(input, resolutionPosition);
  for (const requirement of choice.requirements ?? []) {
    const reason = requirementReason(requirement, context, false);
    if (reason) return reason;
  }
  for (const requirement of choice.exclusions ?? []) {
    const reason = requirementReason(requirement, context, true);
    if (reason) return reason;
  }
  if (!context.resolutionPosition || 'check' in choice) return null;
  const expired = choice.effects.some((effect) => effect.type === 'callback' && comparePosition(effect.promise.deadline, context.resolutionPosition!) < 0);
  return expired ? 'That promise can no longer be kept.' : null;
}

/** Shared gate semantics for both presentation and command validation. */
export function choiceIsAvailable(
  choice: ChronicleChoice | Chronicle1Choice,
  context: ChoiceAvailabilityContext | readonly string[],
  resolutionPosition?: StoryPosition,
): boolean {
  return unavailableChoiceReason(choice, context, resolutionPosition) === null;
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
  const sceneAvailability = {
    flags: context.flags,
    bankedGold: context.bankedGold ?? 0,
    unbankedGold: context.unbankedGold ?? 0,
    inventory: context.inventory ?? EMPTY_INVENTORY,
    resolutionPosition,
  } satisfies ChoiceAvailabilityContext;
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
    .filter((event) => requirementsAreSatisfied(event.requirements, event.exclusions, sceneAvailability))
    .filter((event) => event.eligibility.routes?.includes(context.routeProfile) ?? true)
    .filter((event) => event.choices.length === 0
      || event.choices.some((choice) => choiceIsAvailable(choice, sceneAvailability)))
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
