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

const merchant = (id: string, name: string, restockGateIds: readonly string[]) => ({
  id,
  name,
  stockPoolId: `stock-${id}`,
  dialogueSetId: `dialogue-${id}`,
  illustrationId: `merchant-${id}`,
  restockGateIds,
});

export const CHRONICLE1_MERCHANTS = deepFreeze([
  merchant('road-trader', 'Road Trader', [
    'ch01-hub-orrens-charcoal-wagon',
    'ch03-hub-sella-vains-flatboat',
  ]),
  merchant('blacksmith', 'Blacksmith', [
    'ch02-hub-dorrans-wall-forge',
    'ch08-hub-orrens-courtyard-forge',
  ]),
  merchant('apothecary', 'Apothecary', [
    'ch01-hub-ilenes-field-apothecary',
    'ch03-hub-mother-ailsas-reed-clinic',
    'ch06-hub-ilene-at-the-south-chapel',
    'ch08-hub-ilene-beside-the-witness-gallery',
  ]),
  merchant('relic-dealer', 'Relic Dealer', [
    'ch05-hub-omarens-relic-bench',
  ]),
  merchant('quartermaster', 'Quartermaster', [
    'ch02-hub-quartermaster-coles-yard',
    'ch04-hub-the-neutral-quartermaster',
    'ch06-hub-nessa-coles-siege-yard',
    'ch07-hub-nessas-march-quartermaster',
  ]),
  merchant('goblin-broker', 'Goblin Broker', [
    'ch04-hub-the-nimble-nail-exchange',
    'ch05-hub-vekkas-boiler-room-market',
    'ch07-hub-brez-at-the-abandoned-tollhouse',
  ]),
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
