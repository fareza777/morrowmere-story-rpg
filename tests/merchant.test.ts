import { describe, expect, it } from "vitest";
import {
  executeTrade,
  generateMerchantVisit,
  quoteTrade,
  type MerchantContext,
} from "../src/game/merchant";
import type {
  ContentIndex,
  ItemDefinition,
  MerchantDefinition,
} from "../src/game/content/schema";
import type { ItemId, MerchantId } from "../src/game/domain/ids";
import type { InventoryState } from "../src/game/inventory";

const itemId = (id: string) => id as ItemId;
const merchantId = (id: string) => id as MerchantId;
const EMPTY_INVENTORY: InventoryState = {
  pack: [],
  stash: [],
  questItems: [],
  equipment: { weapon: null, armor: null, charms: [] },
};
const ITEMS = new Map<ItemId, ItemDefinition>([
  [
    itemId("potion-red"),
    {
      id: "potion-red",
      name: "Red Mercy",
      category: "potion",
      description: "A healing tonic.",
      allowedClasses: ["warrior", "mage", "warden"],
      stats: { health: 12 },
      value: 12,
      tags: ["healing"],
    },
  ],
  [
    itemId("weapon-kingbreaker"),
    {
      id: "weapon-kingbreaker",
      name: "Kingbreaker",
      category: "weapon",
      description: "A relic maul.",
      allowedClasses: ["warrior"],
      stats: { attack: 7 },
      value: 68,
      tags: ["min-level:4", "min-chapter:3", "min-reputation:20"],
    },
  ],
  ...Array.from(
    { length: 6 },
    (_, index) =>
      [
        itemId(`scroll-${index}`),
        {
          id: `scroll-${index}`,
          name: `Scroll ${index}`,
          category: "scroll" as const,
          description: "A tradeable scroll.",
          allowedClasses: ["warrior", "mage", "warden"] as const,
          stats: {},
          value: 10,
          tags: [],
        },
      ] as const
  ),
]);
const ROAD_TRADER: MerchantDefinition = {
  id: merchantId("road-trader"),
  name: "Road Trader",
  stockItemIds: [...ITEMS.keys()],
};
const CONTENT: ContentIndex = {
  events: new Map(),
  items: ITEMS,
  enemies: new Map(),
  encounters: new Map(),
  companions: new Map(),
  merchants: new Map([[ROAD_TRADER.id, ROAD_TRADER]]),
  artIds: new Set(),
  audioIds: new Set(),
};
const MERCHANT_CONTEXT: MerchantContext = {
  content: CONTENT,
  seed: 91,
  restockKey: "ch01-road-trader",
  heroLevel: 1,
  chapter: 1,
  reputation: 0,
  scarcityMultiplier: 1,
};

describe("merchants", () => {
  it("reopening a merchant preserves stock and prevents duplicate purchase", () => {
    const visit = generateMerchantVisit(MERCHANT_CONTEXT, ROAD_TRADER);
    const first = executeTrade(
      visit,
      EMPTY_INVENTORY,
      100,
      { type: "buy", stockEntryId: visit.stock[0]!.id },
      MERCHANT_CONTEXT
    );
    const second = first.ok
      ? executeTrade(
          first.value.visit,
          first.value.inventory,
          first.value.gold,
          { type: "buy", stockEntryId: visit.stock[0]!.id },
          MERCHANT_CONTEXT
        )
      : first;
    expect(
      generateMerchantVisit(
        { ...MERCHANT_CONTEXT, persistedVisit: visit },
        ROAD_TRADER
      )
    ).toEqual(visit);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });

  it("uses the bounded scarcity and reputation multipliers for buying and selling", () => {
    const inventory: InventoryState = {
      ...EMPTY_INVENTORY,
      pack: [{ id: "potion-stack", itemId: itemId("potion-red"), quantity: 2 }],
    };
    const context = {
      ...MERCHANT_CONTEXT,
      reputation: 100,
      scarcityMultiplier: 10,
    };
    const visit = generateMerchantVisit(context, ROAD_TRADER);
    const buy = quoteTrade(
      visit,
      inventory,
      {
        type: "buy",
        stockEntryId: visit.stock.find(
          (entry) => entry.itemId === itemId("potion-red")
        )!.id,
      },
      context
    );
    const sell = quoteTrade(
      visit,
      inventory,
      { type: "sell", entryId: "potion-stack", quantity: 2 },
      context
    );
    expect(buy.ok && buy.value.unitPrice).toBe(15);
    expect(sell.ok && sell.value.unitPrice).toBe(5);
  });

  it("offers six entries without replacement and respects explicit level, chapter, and reputation gates", () => {
    const gatedTrader: MerchantDefinition = {
      ...ROAD_TRADER,
      id: merchantId("gated-trader"),
      stockItemIds: [itemId("weapon-kingbreaker")],
    };
    const early = generateMerchantVisit(
      { ...MERCHANT_CONTEXT, restockKey: "ch01-gated-trader" },
      gatedTrader
    );
    const eligible = generateMerchantVisit(
      {
        ...MERCHANT_CONTEXT,
        heroLevel: 4,
        chapter: 3,
        reputation: 20,
        restockKey: "ch03-gated-trader",
      },
      gatedTrader
    );
    const generalStock = generateMerchantVisit(MERCHANT_CONTEXT, ROAD_TRADER);
    expect(generalStock.stock).toHaveLength(6);
    expect(new Set(generalStock.stock.map((entry) => entry.itemId)).size).toBe(
      6
    );
    expect(early.stock).toEqual([]);
    expect(eligible.stock.map((entry) => entry.itemId)).toEqual([
      itemId("weapon-kingbreaker"),
    ]);
  });

  it("keeps a failed purchase atomic when the pack is full", () => {
    const fullInventory: InventoryState = {
      ...EMPTY_INVENTORY,
      pack: Array.from({ length: 24 }, (_, index) => ({
        id: `scroll-${index}`,
        itemId: itemId(`scroll-${index % 6}`),
        quantity: 1,
      })),
    };
    const visit = generateMerchantVisit(MERCHANT_CONTEXT, ROAD_TRADER);
    const failed = executeTrade(
      visit,
      fullInventory,
      100,
      {
        type: "buy",
        stockEntryId: visit.stock.find(
          (entry) => entry.itemId === itemId("potion-red")
        )!.id,
      },
      MERCHANT_CONTEXT
    );
    expect(failed.ok).toBe(false);
    expect(failed.ok ? null : failed.error.state).toEqual({
      visit,
      inventory: fullInventory,
      gold: 100,
    });
    expect(failed.ok ? null : failed.error.state?.visit).toBe(visit);
    expect(failed.ok ? null : failed.error.state?.inventory).toBe(
      fullInventory
    );
    expect(visit.stock).toHaveLength(6);
    expect(fullInventory.pack).toHaveLength(24);
  });

  it("sells a valid pack copy when another copy is equipped", () => {
    const inventory: InventoryState = {
      ...EMPTY_INVENTORY,
      pack: [
        {
          id: "spare-kingbreaker",
          itemId: itemId("weapon-kingbreaker"),
          quantity: 1,
        },
      ],
      equipment: {
        weapon: itemId("weapon-kingbreaker"),
        armor: null,
        charms: [],
      },
    };
    const visit = generateMerchantVisit(MERCHANT_CONTEXT, ROAD_TRADER);

    const result = executeTrade(
      visit,
      inventory,
      0,
      { type: "sell", entryId: "spare-kingbreaker" },
      MERCHANT_CONTEXT
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.inventory.pack).toEqual([]);
    expect(result.ok && result.value.gold).toBe(27);
  });
});
