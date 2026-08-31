import { describe, expect, it } from 'vitest';
import {
  applyInventoryCommand,
  inventorySlotUsage,
  useItem,
  type InventoryState,
} from '../src/game/inventory';
import type { ItemDefinition } from '../src/game/content/schema';
import type { ItemId } from '../src/game/domain/ids';

const itemId = (id: string) => id as ItemId;

const ITEMS_FIXTURE = new Map<ItemId, ItemDefinition>([
  [itemId('potion-red'), {
    id: 'potion-red', name: 'Red Mercy', category: 'potion', description: 'A healing tonic.',
    allowedClasses: ['warrior', 'mage', 'warden'], stats: { health: 12 }, value: 12, tags: ['healing'],
  }],
  [itemId('weapon-rust-sword'), {
    id: 'weapon-rust-sword', name: 'Rust Sword', category: 'weapon', description: 'A battered sword.',
    allowedClasses: ['warrior'], stats: { attack: 2 }, value: 16, tags: ['blade'],
  }],
  [itemId('armor-patched-mail'), {
    id: 'armor-patched-mail', name: 'Patched Mail', category: 'armor', description: 'Reliable mail.',
    allowedClasses: ['warrior'], stats: { armor: 3 }, value: 22, tags: ['mail'],
  }],
  [itemId('charm-wolf-tooth'), {
    id: 'charm-wolf-tooth', name: 'Wolf Tooth', category: 'charm', description: 'A sharpened tooth.',
    allowedClasses: ['warrior', 'mage', 'warden'], stats: { attack: 1 }, value: 18, tags: ['beast'],
  }],
  [itemId('quest-iron-tooth'), {
    id: 'quest-iron-tooth', name: 'Iron Crown Tooth', category: 'quest', description: 'An important crown tooth.',
    allowedClasses: ['warrior', 'mage', 'warden'], stats: {}, value: 0, tags: ['key'],
  }],
]);

const emptyInventory = (): InventoryState => ({
  pack: [],
  stash: [],
  questItems: [],
  equipment: { weapon: null, armor: null, charms: [] },
});

const inventoryWith = (id: string, quantity: number): InventoryState => ({
  ...emptyInventory(),
  pack: [{ id: `stack-${id}`, itemId: itemId(id), quantity }],
});

describe('inventory', () => {
  it('uses a potion in combat and in the field from the same stack', () => {
    const inventory = inventoryWith('potion-red', 2);

    const combatUse = useItem(inventory, 'stack-potion-red', 'combat', ITEMS_FIXTURE);
    expect(combatUse.ok && combatUse.value.inventory.pack[0]?.quantity).toBe(1);
    expect(combatUse.ok && combatUse.value.turnSpent).toBe(true);

    const fieldUse = useItem(
      combatUse.ok ? combatUse.value.inventory : inventory,
      'stack-potion-red',
      'field',
      ITEMS_FIXTURE,
    );
    expect(fieldUse.ok && fieldUse.value.inventory.pack).toEqual([]);
    expect(fieldUse.ok && fieldUse.value.turnSpent).toBe(false);
    expect(fieldUse.ok && fieldUse.value.effects).toEqual({ health: 12 });
  });

  it('counts a consumable stack as one of the twenty-four pack slots', () => {
    const inventory = inventoryWith('potion-red', 99);

    expect(inventorySlotUsage(inventory)).toEqual({ used: 1, capacity: 24, available: 23 });
  });

  it('moves the stash stack when the same consumable was also added to the pack', () => {
    const inPack = applyInventoryCommand(
      emptyInventory(),
      { type: 'add', itemId: itemId('potion-red') },
      ITEMS_FIXTURE,
    );
    const inBothPartitions = applyInventoryCommand(
      inPack.ok ? inPack.value : emptyInventory(),
      { type: 'add', itemId: itemId('potion-red'), destination: 'stash' },
      ITEMS_FIXTURE,
    );
    const moved = applyInventoryCommand(
      inBothPartitions.ok ? inBothPartitions.value : emptyInventory(),
      { type: 'move', entryId: 'stash-stack-potion-red', destination: 'pack' },
      ITEMS_FIXTURE,
    );

    expect(moved.ok && moved.value.pack).toEqual([
      { id: 'pack-stack-potion-red', itemId: itemId('potion-red'), quantity: 2 },
    ]);
    expect(moved.ok && moved.value.stash).toEqual([]);
  });

  it('rejects a new non-stackable item when the pack is full without changing inventory', () => {
    const inventory: InventoryState = {
      ...emptyInventory(),
      pack: Array.from({ length: 24 }, (_, index) => ({
        id: `sword-${index}`,
        itemId: itemId('weapon-rust-sword'),
        quantity: 1,
      })),
    };

    const result = applyInventoryCommand(
      inventory,
      { type: 'add', itemId: itemId('armor-patched-mail') },
      ITEMS_FIXTURE,
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error.code).toBe('pack_full');
    expect(inventory).toHaveProperty('pack.length', 24);
  });

  it('keeps quest items outside the pack and grants them without consuming capacity', () => {
    const result = applyInventoryCommand(
      emptyInventory(),
      { type: 'add', itemId: itemId('quest-iron-tooth') },
      ITEMS_FIXTURE,
    );

    expect(result.ok && result.value.questItems).toEqual([itemId('quest-iron-tooth')]);
    expect(result.ok && inventorySlotUsage(result.value).used).toBe(0);
  });

  it('enforces one weapon, one armor, and two charm equipment slots', () => {
    const inventory: InventoryState = {
      ...emptyInventory(),
      pack: [
        { id: 'sword-a', itemId: itemId('weapon-rust-sword'), quantity: 1 },
        { id: 'mail-a', itemId: itemId('armor-patched-mail'), quantity: 1 },
        { id: 'charm-a', itemId: itemId('charm-wolf-tooth'), quantity: 1 },
        { id: 'charm-b', itemId: itemId('charm-wolf-tooth'), quantity: 1 },
        { id: 'charm-c', itemId: itemId('charm-wolf-tooth'), quantity: 1 },
      ],
    };
    const weapon = applyInventoryCommand(inventory, { type: 'equip', entryId: 'sword-a', heroClass: 'warrior' }, ITEMS_FIXTURE);
    const armor = applyInventoryCommand(weapon.ok ? weapon.value : inventory, { type: 'equip', entryId: 'mail-a', heroClass: 'warrior' }, ITEMS_FIXTURE);
    const charmA = applyInventoryCommand(armor.ok ? armor.value : inventory, { type: 'equip', entryId: 'charm-a', heroClass: 'warrior' }, ITEMS_FIXTURE);
    const charmB = applyInventoryCommand(charmA.ok ? charmA.value : inventory, { type: 'equip', entryId: 'charm-b', heroClass: 'warrior' }, ITEMS_FIXTURE);
    const charmC = applyInventoryCommand(charmB.ok ? charmB.value : inventory, { type: 'equip', entryId: 'charm-c', heroClass: 'warrior' }, ITEMS_FIXTURE);

    expect(charmB.ok && charmB.value.equipment).toEqual({
      weapon: 'weapon-rust-sword',
      armor: 'armor-patched-mail',
      charms: ['charm-wolf-tooth', 'charm-wolf-tooth'],
    });
    expect(charmC.ok).toBe(false);
    expect(charmC.ok ? null : charmC.error.code).toBe('equipment_slot_full');
  });

  it('rejects equipment the hero class cannot use without moving the pack entry', () => {
    const inventory = inventoryWith('weapon-rust-sword', 1);

    const result = applyInventoryCommand(inventory, { type: 'equip', entryId: 'stack-weapon-rust-sword', heroClass: 'mage' }, ITEMS_FIXTURE);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error).toEqual({ code: 'item_not_usable', message: 'That hero class cannot equip this item.' });
    expect(inventory.pack).toHaveLength(1);
  });

  it('unequips only one copy when both charm slots contain the same charm', () => {
    const inventory: InventoryState = {
      ...emptyInventory(),
      equipment: { weapon: null, armor: null, charms: [itemId('charm-wolf-tooth'), itemId('charm-wolf-tooth')] },
    };

    const result = applyInventoryCommand(
      inventory,
      { type: 'unequip', itemId: itemId('charm-wolf-tooth') },
      ITEMS_FIXTURE,
    );

    expect(result.ok && result.value.equipment.charms).toEqual(['charm-wolf-tooth']);
    expect(result.ok && result.value.pack).toEqual([
      { id: 'pack-item-charm-wolf-tooth-1', itemId: itemId('charm-wolf-tooth'), quantity: 1 },
    ]);
  });
});
