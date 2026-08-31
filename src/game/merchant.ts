import type { ContentIndex, MerchantDefinition } from "./content/schema";
import type { ItemId, MerchantId } from "./domain/ids";
import type { DomainResult } from "./domain/result";
import { applyInventoryCommand, type InventoryState } from "./inventory";
import { createRng } from "./rng";

export const SELL_PRICE_MINIMUM = 0.35;
export const SELL_PRICE_MAXIMUM = 0.45;
export const BUY_MULTIPLIER_MINIMUM = 0.86;
export const BUY_MULTIPLIER_MAXIMUM = 1.21;
const REPUTATION_MULTIPLIER_MINIMUM = 0.85;
const REPUTATION_MULTIPLIER_MAXIMUM = 1.15;
const DEFAULT_STOCK_SIZE = 6;

export interface MerchantStockEntry {
  readonly id: string;
  readonly itemId: ItemId;
}
export interface MerchantVisit {
  readonly merchantId: MerchantId;
  readonly restockKey: string;
  readonly restockSeed: number;
  /** The hero level used when this deterministic stock was originally generated. */
  readonly generatedAtLevel: number;
  readonly stock: readonly MerchantStockEntry[];
}
export interface MerchantContext {
  readonly content: ContentIndex;
  readonly seed: number;
  readonly restockKey: string;
  readonly heroLevel: number;
  readonly chapter: number;
  readonly reputation: number;
  readonly scarcityMultiplier: number;
  readonly persistedVisit?: MerchantVisit;
}
export type TradeIntent =
  | { readonly type: "buy"; readonly stockEntryId: string }
  | {
      readonly type: "sell";
      readonly entryId: string;
      readonly quantity?: number;
    };
export interface TradeQuote {
  readonly type: TradeIntent["type"];
  readonly itemId: ItemId;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
}
export interface TradeResult {
  readonly visit: MerchantVisit;
  readonly inventory: InventoryState;
  readonly gold: number;
}
export interface TradeFailureState {
  readonly visit: MerchantVisit;
  readonly inventory: InventoryState;
  readonly gold: number;
}
export interface MerchantError {
  readonly code:
    | "insufficient_gold"
    | "invalid_quantity"
    | "item_not_found"
    | "pack_full"
    | "quest_item_protected"
    | "stock_entry_not_found";
  readonly message: string;
  readonly state?: TradeFailureState;
}

function failure<T>(
  code: MerchantError["code"],
  message: string
): DomainResult<T, MerchantError> {
  return { ok: false, error: { code, message } };
}
function tradeFailure<T>(
  error: MerchantError,
  visit: MerchantVisit,
  inventory: InventoryState,
  gold: number
): DomainResult<T, MerchantError> {
  return { ok: false, error: { ...error, state: { visit, inventory, gold } } };
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
export function merchantRestockSeed(
  seed: number,
  merchantId: MerchantId,
  restockKey: string
): number {
  let result = seed >>> 0;
  for (const character of `${merchantId}:${restockKey}`)
    result = Math.imul(result ^ character.charCodeAt(0), 0x45d9f3b) >>> 0;
  return result;
}
function gateValue(tags: readonly string[], name: string): number | null {
  const tag = tags.find((candidate) => candidate.startsWith(`${name}:`));
  if (!tag) return null;
  const value = Number(tag.slice(name.length + 1));
  return Number.isInteger(value) && value >= 0 ? value : null;
}
function stockEligible(
  item: { readonly category: string; readonly tags: readonly string[] },
  context: MerchantContext
): boolean {
  const level = gateValue(item.tags, "min-level");
  const chapter = gateValue(item.tags, "min-chapter");
  const reputation = gateValue(item.tags, "min-reputation");
  return (
    item.category !== "quest" &&
    (level === null || context.heroLevel >= level) &&
    (chapter === null || context.chapter >= chapter) &&
    (reputation === null || context.reputation >= reputation)
  );
}
function reputationMultiplier(reputation: number): number {
  return clamp(
    1 - clamp(reputation, -100, 100) * 0.0015,
    REPUTATION_MULTIPLIER_MINIMUM,
    REPUTATION_MULTIPLIER_MAXIMUM
  );
}
function buyPrice(value: number, context: MerchantContext): number {
  return Math.max(
    1,
    Math.round(
      value *
        clamp(
          context.scarcityMultiplier * reputationMultiplier(context.reputation),
          BUY_MULTIPLIER_MINIMUM,
          BUY_MULTIPLIER_MAXIMUM
        )
    )
  );
}
function sellPrice(value: number, context: MerchantContext): number {
  return Math.max(
    1,
    Math.round(
      value *
        clamp(
          0.4 + clamp(context.reputation, -100, 100) * 0.0005,
          SELL_PRICE_MINIMUM,
          SELL_PRICE_MAXIMUM
        )
    )
  );
}
function inventoryError(code: string): MerchantError {
  if (code === "pack_full")
    return {
      code: "pack_full",
      message: "Your pack has no room for that purchase.",
    };
  if (code === "quest_item_protected")
    return {
      code: "quest_item_protected",
      message: "Quest items cannot be traded.",
    };
  if (code === "invalid_quantity")
    return {
      code: "invalid_quantity",
      message: "Choose a quantity that is in the stack.",
    };
  return {
    code: "item_not_found",
    message: "That item is not available for trade.",
  };
}

export function generateMerchantVisit(
  context: MerchantContext,
  merchant: MerchantDefinition
): MerchantVisit {
  if (
    context.persistedVisit &&
    context.persistedVisit.merchantId === merchant.id &&
    context.persistedVisit.restockKey === context.restockKey
  )
    return context.persistedVisit;
  const seed = merchantRestockSeed(context.seed, merchant.id, context.restockKey);
  const distinctEligible = [...new Set(merchant.stockItemIds)].filter(
    (itemId) => {
      const item = context.content.items.get(itemId);
      return Boolean(item && stockEligible(item, context));
    }
  );
  return {
    merchantId: merchant.id,
    restockKey: context.restockKey,
    restockSeed: seed,
    generatedAtLevel: context.heroLevel,
    stock: createRng(seed)
      .shuffle(distinctEligible)
      .slice(0, DEFAULT_STOCK_SIZE)
      .map((itemId, index) => ({
        id: `${merchant.id}:${context.restockKey}:${index}:${itemId}`,
        itemId,
      })),
  };
}

export function quoteTrade(
  visit: MerchantVisit,
  inventory: InventoryState,
  intent: TradeIntent,
  context: MerchantContext
): DomainResult<TradeQuote, MerchantError> {
  if (intent.type === "buy") {
    const stock = visit.stock.find((entry) => entry.id === intent.stockEntryId);
    if (!stock)
      return failure(
        "stock_entry_not_found",
        "That stock entry has already been sold."
      );
    const item = context.content.items.get(stock.itemId);
    if (!item)
      return failure("item_not_found", "That item is not available for trade.");
    const unitPrice = buyPrice(item.value, context);
    return {
      ok: true,
      value: {
        type: "buy",
        itemId: stock.itemId,
        quantity: 1,
        unitPrice,
        total: unitPrice,
      },
    };
  }
  const entry = inventory.pack.find(
    (candidate) => candidate.id === intent.entryId
  );
  if (!entry)
    return failure("item_not_found", "That item is not in your pack.");
  const quantity = intent.quantity ?? entry.quantity;
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > entry.quantity)
    return failure(
      "invalid_quantity",
      "Choose a quantity that is in the stack."
    );
  const item = context.content.items.get(entry.itemId);
  if (!item)
    return failure("item_not_found", "That item is not available for trade.");
  if (item.category === "quest")
    return failure("quest_item_protected", "Quest items cannot be traded.");
  const unitPrice = sellPrice(item.value, context);
  return {
    ok: true,
    value: {
      type: "sell",
      itemId: entry.itemId,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    },
  };
}

export function executeTrade(
  visit: MerchantVisit,
  inventory: InventoryState,
  gold: number,
  intent: TradeIntent,
  context: MerchantContext
): DomainResult<TradeResult, MerchantError> {
  const quote = quoteTrade(visit, inventory, intent, context);
  if (!quote.ok) return tradeFailure(quote.error, visit, inventory, gold);
  if (intent.type === "buy") {
    if (gold < quote.value.total)
      return tradeFailure(
        { code: "insufficient_gold", message: "You do not have enough gold." },
        visit,
        inventory,
        gold
      );
    const added = applyInventoryCommand(
      inventory,
      { type: "add", itemId: quote.value.itemId },
      context.content.items
    );
    if (!added.ok)
      return tradeFailure(
        inventoryError(added.error.code),
        visit,
        inventory,
        gold
      );
    return {
      ok: true,
      value: {
        visit: {
          ...visit,
          stock: visit.stock.filter(
            (entry) => entry.id !== intent.stockEntryId
          ),
        },
        inventory: added.value,
        gold: gold - quote.value.total,
      },
    };
  }
  const removed = applyInventoryCommand(
    inventory,
    {
      type: "discard",
      entryId: intent.entryId,
      quantity: quote.value.quantity,
    },
    context.content.items
  );
  if (!removed.ok)
    return tradeFailure(
      inventoryError(removed.error.code),
      visit,
      inventory,
      gold
    );
  return {
    ok: true,
    value: { visit, inventory: removed.value, gold: gold + quote.value.total },
  };
}
