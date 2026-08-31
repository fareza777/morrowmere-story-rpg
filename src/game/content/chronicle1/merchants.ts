import type { Chronicle1MerchantDefinition, MerchantDefinition } from '../schema';
import type { ItemId } from '../../domain/ids';
import { deepFreeze } from './builders';

export const MERCHANT_IDS = deepFreeze([
  'road-trader',
  'blacksmith',
  'apothecary',
  'relic-dealer',
  'quartermaster',
  'goblin-broker',
] as const);

const merchant = (id: string, name: string) => ({
  id,
  name,
  stockPoolId: `stock-${id}`,
  dialogueSetId: `dialogue-${id}`,
  illustrationId: `merchant-${id}`,
  // Authored hub scenes populate and assembly validates these gates later.
  restockGateIds: [],
});

export const CHRONICLE1_MERCHANTS = deepFreeze([
  merchant('road-trader', 'Road Trader'),
  merchant('blacksmith', 'Blacksmith'),
  merchant('apothecary', 'Apothecary'),
  merchant('relic-dealer', 'Relic Dealer'),
  merchant('quartermaster', 'Quartermaster'),
  merchant('goblin-broker', 'Goblin Broker'),
]) as unknown as readonly Chronicle1MerchantDefinition[];

/** Resolves a stock pool only after the item catalog exists; no fake items live here. */
export function resolveMerchantStock(
  merchant: Chronicle1MerchantDefinition,
  stockItemIds: readonly ItemId[],
): MerchantDefinition {
  return deepFreeze({
    id: merchant.id,
    name: merchant.name,
    stockItemIds: [...stockItemIds],
  });
}

export const toMerchantDefinition = resolveMerchantStock;
