import type { ItemDefinition } from './content/schema';
import type { ItemId } from './domain/ids';
import type { DomainResult } from './domain/result';
import type { HeroClass } from './types';

export const PACK_CAPACITY = 24;
export type InventoryContext = 'combat' | 'field';
export type InventoryPartition = 'pack' | 'stash';

export interface InventoryEntry {
  readonly id: string;
  readonly itemId: ItemId;
  readonly quantity: number;
}

export interface InventoryState {
  readonly pack: readonly InventoryEntry[];
  readonly stash: readonly InventoryEntry[];
  readonly questItems: readonly ItemId[];
  readonly equipment: {
    readonly weapon: ItemId | null;
    readonly armor: ItemId | null;
    readonly charms: readonly ItemId[];
  };
}

export type InventoryCommand =
  | { readonly type: 'add'; readonly itemId: ItemId; readonly quantity?: number; readonly destination?: InventoryPartition }
  | { readonly type: 'move'; readonly entryId: string; readonly destination: InventoryPartition }
  | { readonly type: 'equip'; readonly entryId: string; readonly heroClass: HeroClass }
  | { readonly type: 'unequip'; readonly itemId: ItemId }
  | { readonly type: 'discard'; readonly entryId: string; readonly quantity?: number };

export interface InventoryError {
  readonly code: 'entry_not_found' | 'equipment_slot_full' | 'invalid_item' | 'invalid_quantity' | 'item_not_usable' | 'pack_full' | 'quest_item_protected';
  readonly message: string;
}

export interface InventorySlotUsage {
  readonly used: number;
  readonly capacity: number;
  readonly available: number;
}

export interface UsedItem {
  readonly inventory: InventoryState;
  readonly turnSpent: boolean;
  readonly effects: ItemDefinition['stats'];
}

function failure<T>(code: InventoryError['code'], message: string): DomainResult<T, InventoryError> {
  return { ok: false, error: { code, message } };
}

function isStackable(item: ItemDefinition): boolean {
  return item.category === 'potion' || item.category === 'scroll';
}

function isEquipment(item: ItemDefinition): item is ItemDefinition & { readonly category: 'weapon' | 'armor' | 'charm' } {
  return item.category === 'weapon' || item.category === 'armor' || item.category === 'charm';
}

function partition(inventory: InventoryState, destination: InventoryPartition): readonly InventoryEntry[] {
  return inventory[destination];
}

function withPartition(inventory: InventoryState, destination: InventoryPartition, entries: readonly InventoryEntry[]): InventoryState {
  return { ...inventory, [destination]: entries };
}

function uniqueEntryId(entries: readonly InventoryEntry[], itemId: ItemId, destination: InventoryPartition): string {
  const prefix = `${destination}-item-${itemId}-`;
  let suffix = 1;
  while (entries.some((entry) => entry.id === `${prefix}${suffix}`)) suffix += 1;
  return `${prefix}${suffix}`;
}

function addToPartition(
  entries: readonly InventoryEntry[],
  item: ItemDefinition,
  itemId: ItemId,
  quantity: number,
  destination: InventoryPartition,
): readonly InventoryEntry[] {
  if (isStackable(item)) {
    const existing = entries.find((entry) => entry.itemId === itemId);
    if (existing) return entries.map((entry) => entry.id === existing.id ? { ...entry, quantity: entry.quantity + quantity } : entry);
    return [...entries, { id: `${destination}-stack-${itemId}`, itemId, quantity }];
  }
  const next = [...entries];
  for (let count = 0; count < quantity; count += 1) next.push({ id: uniqueEntryId(next, itemId, destination), itemId, quantity: 1 });
  return next;
}

function removeFromEntries(entries: readonly InventoryEntry[], entryId: string, quantity: number): readonly InventoryEntry[] {
  return entries.flatMap((entry) => {
    if (entry.id !== entryId) return [entry];
    const remaining = entry.quantity - quantity;
    return remaining > 0 ? [{ ...entry, quantity: remaining }] : [];
  });
}

export function inventorySlotUsage(inventory: InventoryState): InventorySlotUsage {
  const used = inventory.pack.length;
  return { used, capacity: PACK_CAPACITY, available: Math.max(0, PACK_CAPACITY - used) };
}

export function applyInventoryCommand(
  inventory: InventoryState,
  command: InventoryCommand,
  items: ReadonlyMap<ItemId, ItemDefinition>,
): DomainResult<InventoryState, InventoryError> {
  if (command.type === 'add') {
    const item = items.get(command.itemId);
    const quantity = command.quantity ?? 1;
    if (!item) return failure('invalid_item', 'That item is not available.');
    if (!Number.isInteger(quantity) || quantity <= 0) return failure('invalid_quantity', 'Item quantity must be a positive whole number.');
    if (item.category === 'quest') {
      return { ok: true, value: inventory.questItems.includes(command.itemId) ? inventory : { ...inventory, questItems: [...inventory.questItems, command.itemId] } };
    }
    const destination = command.destination ?? 'pack';
    const entries = partition(inventory, destination);
    const newSlots = isStackable(item) && entries.some((entry) => entry.itemId === command.itemId) ? 0 : isStackable(item) ? 1 : quantity;
    if (destination === 'pack' && inventorySlotUsage(inventory).available < newSlots) return failure('pack_full', 'Your pack has no room for that item.');
    return { ok: true, value: withPartition(inventory, destination, addToPartition(entries, item, command.itemId, quantity, destination)) };
  }

  if (command.type === 'move') {
    const source: InventoryPartition = inventory.pack.some((entry) => entry.id === command.entryId) ? 'pack' : 'stash';
    const sourceEntries = partition(inventory, source);
    const entry = sourceEntries.find((candidate) => candidate.id === command.entryId);
    if (!entry) return failure('entry_not_found', 'That item is not in your inventory.');
    if (source === command.destination) return { ok: true, value: inventory };
    const item = items.get(entry.itemId);
    if (!item) return failure('invalid_item', 'That item is not available.');
    const destinationEntries = partition(inventory, command.destination);
    const newSlot = !isStackable(item) || !destinationEntries.some((candidate) => candidate.itemId === entry.itemId);
    if (command.destination === 'pack' && newSlot && inventorySlotUsage(inventory).available < 1) return failure('pack_full', 'Your pack has no room for that item.');
    const withoutSource = withPartition(inventory, source, sourceEntries.filter((candidate) => candidate.id !== entry.id));
    const destination = addToPartition(destinationEntries, item, entry.itemId, entry.quantity, command.destination);
    return { ok: true, value: withPartition(withoutSource, command.destination, destination) };
  }

  if (command.type === 'equip') {
    const entry = inventory.pack.find((candidate) => candidate.id === command.entryId);
    if (!entry) return failure('entry_not_found', 'That item is not in your pack.');
    const item = items.get(entry.itemId);
    if (!item || !isEquipment(item)) return failure('invalid_item', 'That item cannot be equipped.');
    if (!item.allowedClasses.includes(command.heroClass)) return failure('item_not_usable', 'That hero class cannot equip this item.');
    if (item.category === 'charm') {
      if (inventory.equipment.charms.length >= 2) return failure('equipment_slot_full', 'Both charm slots are already occupied.');
      return { ok: true, value: { ...inventory, pack: removeFromEntries(inventory.pack, entry.id, 1), equipment: { ...inventory.equipment, charms: [...inventory.equipment.charms, entry.itemId] } } };
    }
    const previousId = inventory.equipment[item.category];
    const previous = previousId ? items.get(previousId) : undefined;
    const withoutEntry = removeFromEntries(inventory.pack, entry.id, 1);
    const pack = previousId && previous
      ? addToPartition(withoutEntry, previous, previousId, 1, 'pack')
      : withoutEntry;
    return { ok: true, value: { ...inventory, pack, equipment: { ...inventory.equipment, [item.category]: entry.itemId } } };
  }

  if (command.type === 'unequip') {
    const slot = inventory.equipment.weapon === command.itemId ? 'weapon' : inventory.equipment.armor === command.itemId ? 'armor' : inventory.equipment.charms.includes(command.itemId) ? 'charm' : null;
    if (!slot) return failure('entry_not_found', 'That item is not equipped.');
    const item = items.get(command.itemId);
    if (!item) return failure('invalid_item', 'That item is not available.');
    if (inventorySlotUsage(inventory).available < 1) return failure('pack_full', 'Your pack has no room for that item.');
    const equipment = slot === 'charm'
      ? { ...inventory.equipment, charms: inventory.equipment.charms.filter((id, index) => id !== command.itemId || index !== inventory.equipment.charms.indexOf(command.itemId)) }
      : { ...inventory.equipment, [slot]: null };
    return { ok: true, value: { ...inventory, pack: addToPartition(inventory.pack, item, command.itemId, 1, 'pack'), equipment } };
  }

  const inPack = inventory.pack.find((entry) => entry.id === command.entryId);
  const entry = inPack ?? inventory.stash.find((candidate) => candidate.id === command.entryId);
  if (!entry) return failure('entry_not_found', 'That item is not in your inventory.');
  const quantity = command.quantity ?? entry.quantity;
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > entry.quantity) return failure('invalid_quantity', 'Choose a quantity that is in the stack.');
  if (items.get(entry.itemId)?.category === 'quest') return failure('quest_item_protected', 'Quest items cannot be discarded.');
  return { ok: true, value: inPack ? { ...inventory, pack: removeFromEntries(inventory.pack, entry.id, quantity) } : { ...inventory, stash: removeFromEntries(inventory.stash, entry.id, quantity) } };
}

export function useItem(inventory: InventoryState, entryId: string, context: InventoryContext, items: ReadonlyMap<ItemId, ItemDefinition>): DomainResult<UsedItem, InventoryError> {
  const entry = inventory.pack.find((candidate) => candidate.id === entryId);
  if (!entry) return failure('entry_not_found', 'That item is not in your pack.');
  const item = items.get(entry.itemId);
  if (!item) return failure('invalid_item', 'That item is not available.');
  if (!isStackable(item)) return failure('item_not_usable', 'That item cannot be used here.');
  return { ok: true, value: { inventory: { ...inventory, pack: removeFromEntries(inventory.pack, entry.id, 1) }, turnSpent: context === 'combat', effects: item.stats } };
}
