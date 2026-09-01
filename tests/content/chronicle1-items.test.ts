import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/game/content/items';
import {
  CHRONICLE1_ITEMS,
  CHRONICLE1_NEW_ITEMS,
  NEW_ITEM_ICON_IDS,
  NEW_ITEM_IDS,
  countNewItemGroups,
  isChronicleItemAvailable,
  isConsumable,
} from '../../src/game/content/chronicle1/items';
import { applyInventoryCommand, itemStackLimit, useItem, type InventoryState } from '../../src/game/inventory';

const LOCKED_IDS = {
  weapons: ['weapon-greywatch-sabre','weapon-border-pike','weapon-caravan-hatchet','weapon-scout-longbow','weapon-black-banner-cleaver','weapon-redwater-lance','weapon-orc-peaceblade','weapon-drowned-road-trident','weapon-ferryman-hook','weapon-embervault-maul','weapon-cinderpick','weapon-royal-armory-sword','weapon-conclave-focus-staff','weapon-sealbreak-wand','weapon-ashglass-dagger','weapon-crownless-halberd','weapon-voss-officer-blade','weapon-kingroad-crossbow','weapon-goblin-foldknife','weapon-talla-slingblade','weapon-mara-scout-knife','weapon-rukhar-oath-axe','weapon-lyra-seal-rod','weapon-caldus-pilgrim-mace','weapon-grave-tithe'],
  armor: ['armor-greywatch-guard-coat','armor-caravan-leathers','armor-scout-halfmail','armor-black-banner-cuirass','armor-redwater-scale','armor-orc-peace-lamellar','armor-flooded-chain','armor-ferryman-oilskin','armor-embervault-apron','armor-cinderplate','armor-conclave-sealcoat','armor-abbey-field-vestment','armor-crownless-sentinel-mail','armor-voss-command-plate','armor-goblin-patchcloak','armor-stonehand-harness','armor-mara-raincloak','armor-caldus-healer-mail','armor-lyra-warded-mantle','armor-road-council-coat','armor-cart-maw-jawguard'],
  charms: ['charm-greywatch-key','charm-medicine-wagon-token','charm-witness-ring','charm-royal-fletching','charm-goblin-brass-button','charm-redwater-peace-knot','charm-rukhar-name-bead','charm-drowned-compass','charm-ember-ledger-seal','charm-forgemasters-mark','charm-mara-scout-badge','charm-caldus-prayer-cord','charm-lyra-cipher-lens','charm-talla-bell-coin','charm-crownless-door-key','charm-voss-broken-signet','charm-warning-tree-knot','charm-kneeling-harness-key','charm-shrine-ward-nail','charm-cart-maw-tooth'],
  consumables: ['consumable-field-bandage','consumable-greywatch-tonic','consumable-bitterroot-tea','consumable-smoke-bomb','consumable-caltrop-pouch','consumable-lamp-oil','consumable-antivenom','consumable-marsh-salts','consumable-orc-field-broth','consumable-redwater-stimulant','consumable-warding-chalk','consumable-magefire-flask','consumable-frost-salve','consumable-ember-draught','consumable-burn-paste','consumable-focus-incense','consumable-armor-pitch','consumable-whetstone-kit','consumable-hearty-ration','consumable-blackroot-brew','consumable-healing-poultice','consumable-cleansing-herbs','consumable-courage-cordial','consumable-last-light-phial'],
  tools: ['scroll-counterseal','scroll-hushed-step','scroll-breaking-ward','scroll-roadward','tool-lockpick-roll','tool-field-repair-kit','tool-surveyors-kit','tool-signal-whistle'],
  artifacts: ['quest-voss-sealed-order','quest-greywatch-witness-statement','quest-royal-arrowhead','quest-redwater-truce-copy','quest-embervault-ledger','quest-hostage-list','quest-crownless-access-seal','quest-patron-cipher-letter'],
} as const;

const EMPTY_INVENTORY: InventoryState = {
  pack: [],
  stash: [],
  questItems: [],
  equipment: { weapon: null, armor: null, charms: [] },
};

const TIER_VALUE_RANGES = {
  1: [10, 28],
  2: [24, 62],
  3: [55, 100],
  4: [90, 170],
  5: [150, 260],
} as const;

describe('Chronicle I item catalog', () => {
  it('uses all 106 locked IDs in their exact authored groups', () => {
    expect(NEW_ITEM_IDS).toEqual(LOCKED_IDS);
    expect(countNewItemGroups(CHRONICLE1_NEW_ITEMS)).toEqual({
      weapons: 25,
      armor: 21,
      charms: 20,
      consumables: 24,
      tools: 8,
      artifacts: 8,
    });
    expect(CHRONICLE1_NEW_ITEMS).toHaveLength(106);
  });

  it('combines the 106 additions with all 60 legacy items without identity collisions', () => {
    expect(ITEMS).toHaveLength(60);
    expect(CHRONICLE1_ITEMS).toHaveLength(166);
    expect(CHRONICLE1_ITEMS.slice(0, 60)).toEqual(ITEMS);
    expect(new Set(CHRONICLE1_ITEMS.map((item) => item.id)).size).toBe(166);
  });

  it('authors readable immutable records with compatible runtime categories and unique icon IDs', () => {
    const expectedCategory = {
      weapon: 'weapon',
      armor: 'armor',
      charm: 'charm',
      consumable: 'potion',
      tool: 'scroll',
      artifact: 'quest',
    } as const;

    for (const item of CHRONICLE1_NEW_ITEMS) {
      expect(item.category, item.id).toBe(expectedCategory[item.contentGroup]);
      expect(item.name.length, item.id).toBeGreaterThanOrEqual(4);
      expect(item.description.length, item.id).toBeGreaterThanOrEqual(45);
      expect(item.description, item.id).toMatch(/[A-Za-z]/);
      expect(item.allowedClasses.length, item.id).toBeGreaterThan(0);
      expect(new Set(item.allowedClasses).size, item.id).toBe(item.allowedClasses.length);
      expect(item.tags.length, item.id).toBeGreaterThan(0);
      expect(item.iconId, item.id).toBe(`item-icon-${item.id}`);
      expect(item.gates.minChapter, item.id).toBeGreaterThanOrEqual(1);
      expect(item.gates.minChapter, item.id).toBeLessThanOrEqual(8);
      expect(Object.isFrozen(item), item.id).toBe(true);
      expect(Object.isFrozen(item.stats), item.id).toBe(true);
      expect(Object.isFrozen(item.gates), item.id).toBe(true);
      expect(Object.keys(item.gates), item.id).not.toContain('adRequired');

      if (item.contentGroup === 'artifact') {
        expect(item.value, item.id).toBe(0);
      } else {
        const [minimum, maximum] = TIER_VALUE_RANGES[item.tier];
        expect(item.value, item.id).toBeGreaterThanOrEqual(minimum);
        expect(item.value, item.id).toBeLessThanOrEqual(maximum);
      }
      expect(Math.max(item.stats.attack ?? 0, item.stats.will ?? 0), item.id).toBeLessThanOrEqual(12);
      expect((item.stats.armor ?? 0) + (item.stats.ward ?? 0), item.id).toBeLessThanOrEqual(14);
    }

    expect(NEW_ITEM_ICON_IDS).toHaveLength(106);
    expect(new Set(NEW_ITEM_ICON_IDS).size).toBe(106);
    expect(new Set(CHRONICLE1_NEW_ITEMS.map((item) => item.iconId))).toEqual(new Set(NEW_ITEM_ICON_IDS));
  });

  it('makes every new consumable genuinely usable in field and combat inventory contexts', () => {
    const itemMap = new Map(CHRONICLE1_NEW_ITEMS.map((item) => [item.id as never, item] as const));
    const consumables = CHRONICLE1_NEW_ITEMS.filter(isConsumable);

    expect(consumables).toHaveLength(24);
    for (const item of consumables) {
      expect(item.useContexts, item.id).toEqual(['field', 'combat']);
      expect(item.stats.health !== undefined || item.stats.focus !== undefined, item.id).toBe(true);
      expect(item.stats.attack, item.id).toBeUndefined();
      expect(item.stats.will, item.id).toBeUndefined();
      expect(item.stats.armor, item.id).toBeUndefined();
      expect(item.stats.ward, item.id).toBeUndefined();
      expect(itemStackLimit(item), item.id).toBe(3);

      const added = applyInventoryCommand(EMPTY_INVENTORY, { type: 'add', itemId: item.id as never, quantity: 1 }, itemMap);
      expect(added.ok, item.id).toBe(true);
      if (!added.ok) continue;
      const entryId = added.value.pack[0]!.id;
      const field = useItem(added.value, entryId, 'field', itemMap);
      const combat = useItem(added.value, entryId, 'combat', itemMap);
      expect(field.ok && field.value.turnSpent, item.id).toBe(false);
      expect(combat.ok && combat.value.turnSpent, item.id).toBe(true);
      expect(field.ok && field.value.inventory.pack, item.id).toEqual([]);
      expect(combat.ok && combat.value.inventory.pack, item.id).toEqual([]);
    }
  });

  it('enforces high-tier chapter, quest, and reputation gates independently of currency or ads', () => {
    expect(CHRONICLE1_NEW_ITEMS.filter((item) => item.tier >= 4).every((item) => (
      item.gates.minChapter >= 4 || item.gates.questId !== undefined || item.gates.minReputation !== undefined
    ))).toBe(true);

    const crownlessHalberd = CHRONICLE1_NEW_ITEMS.find((item) => item.id === 'weapon-crownless-halberd')!;
    expect(isChronicleItemAvailable(crownlessHalberd, { chapter: 7, reputation: 100, completedQuestIds: [] })).toBe(false);
    expect(isChronicleItemAvailable(crownlessHalberd, { chapter: 8, reputation: 0, completedQuestIds: [] })).toBe(true);

    const tallaBlade = CHRONICLE1_NEW_ITEMS.find((item) => item.id === 'weapon-talla-slingblade')!;
    expect(isChronicleItemAvailable(tallaBlade, { chapter: 8, reputation: 100, completedQuestIds: [] })).toBe(false);
    expect(isChronicleItemAvailable(tallaBlade, { chapter: 8, reputation: 0, completedQuestIds: [tallaBlade.gates.questId!] })).toBe(true);

    const councilCoat = CHRONICLE1_NEW_ITEMS.find((item) => item.id === 'armor-road-council-coat')!;
    expect(isChronicleItemAvailable(councilCoat, { chapter: 8, reputation: 24, completedQuestIds: [] })).toBe(false);
    expect(isChronicleItemAvailable(councilCoat, { chapter: 8, reputation: 25, completedQuestIds: [] })).toBe(true);

    expect(JSON.stringify(CHRONICLE1_NEW_ITEMS)).not.toContain('rewarded-ad');
    expect(JSON.stringify(CHRONICLE1_NEW_ITEMS)).not.toContain('interstitial');
  });
});
