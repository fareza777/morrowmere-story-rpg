import type { ItemDefinition } from '../../../types';
import { ITEMS } from '../../items';
import { deepFreeze } from '../builders';
import { CHRONICLE1_ARMOR } from './armor';
import { CHRONICLE1_ARTIFACTS } from './artifacts';
import { CHRONICLE1_CHARMS } from './charms';
import { CHRONICLE1_CONSUMABLES } from './consumables';
import { CHRONICLE1_TOOLS } from './tools';
import type { Chronicle1ItemDefinition, ChronicleItemContentGroup } from './types';
import { CHRONICLE1_WEAPONS } from './weapons';

export { CHRONICLE1_ARMOR } from './armor';
export { CHRONICLE1_ARTIFACTS } from './artifacts';
export { CHRONICLE1_CHARMS } from './charms';
export { CHRONICLE1_CONSUMABLES } from './consumables';
export { CHRONICLE1_TOOLS } from './tools';
export {
  isChronicleItemAvailable,
  isConsumable,
} from './types';
export type {
  Chronicle1ItemDefinition,
  ChronicleItemAccessContext,
  ChronicleItemContentGroup,
  ChronicleItemGates,
  ChronicleItemTier,
  ChronicleItemUseContext,
} from './types';
export { CHRONICLE1_WEAPONS } from './weapons';

/** The 106 authored equipment, supply, and quest additions for The Black Banner. */
export const CHRONICLE1_NEW_ITEMS: readonly Chronicle1ItemDefinition[] = deepFreeze([
  ...CHRONICLE1_WEAPONS,
  ...CHRONICLE1_ARMOR,
  ...CHRONICLE1_CHARMS,
  ...CHRONICLE1_CONSUMABLES,
  ...CHRONICLE1_TOOLS,
  ...CHRONICLE1_ARTIFACTS,
]);

/** V1-compatible catalog: legacy definitions first, followed by Chronicle I additions. */
export const CHRONICLE1_ITEMS: readonly ItemDefinition[] = deepFreeze([
  ...ITEMS,
  ...CHRONICLE1_NEW_ITEMS,
]);

export const NEW_ITEM_IDS = deepFreeze({
  weapons: CHRONICLE1_WEAPONS.map((item) => item.id),
  armor: CHRONICLE1_ARMOR.map((item) => item.id),
  charms: CHRONICLE1_CHARMS.map((item) => item.id),
  consumables: CHRONICLE1_CONSUMABLES.map((item) => item.id),
  tools: CHRONICLE1_TOOLS.map((item) => item.id),
  artifacts: CHRONICLE1_ARTIFACTS.map((item) => item.id),
});

export const NEW_ITEM_ICON_IDS: readonly string[] = deepFreeze(
  CHRONICLE1_NEW_ITEMS.map((item) => item.iconId),
);

export interface Chronicle1ItemGroupCounts {
  readonly weapons: number;
  readonly armor: number;
  readonly charms: number;
  readonly consumables: number;
  readonly tools: number;
  readonly artifacts: number;
}

const COUNT_KEY_BY_GROUP: Readonly<Record<ChronicleItemContentGroup, keyof Chronicle1ItemGroupCounts>> = {
  weapon: 'weapons',
  armor: 'armor',
  charm: 'charms',
  consumable: 'consumables',
  tool: 'tools',
  artifact: 'artifacts',
};

export function countNewItemGroups(items: readonly Chronicle1ItemDefinition[]): Chronicle1ItemGroupCounts {
  const counts: Record<keyof Chronicle1ItemGroupCounts, number> = {
    weapons: 0,
    armor: 0,
    charms: 0,
    consumables: 0,
    tools: 0,
    artifacts: 0,
  };

  for (const item of items) counts[COUNT_KEY_BY_GROUP[item.contentGroup]] += 1;
  return counts;
}
