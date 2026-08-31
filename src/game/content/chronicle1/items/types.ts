import type { ItemDefinition } from '../../../types';
import { deepFreeze } from '../builders';

export type ChronicleItemContentGroup = 'weapon' | 'armor' | 'charm' | 'consumable' | 'tool' | 'artifact';
export type ChronicleItemTier = 1 | 2 | 3 | 4 | 5;
export type ChronicleItemUseContext = 'field' | 'combat';

export interface ChronicleItemGates {
  readonly minChapter: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly questId?: string;
  readonly minReputation?: number;
}

export interface Chronicle1ItemDefinition extends ItemDefinition {
  readonly contentGroup: ChronicleItemContentGroup;
  readonly tier: ChronicleItemTier;
  readonly gates: ChronicleItemGates;
  readonly useContexts: readonly ChronicleItemUseContext[];
  readonly iconId: string;
}

export interface ChronicleItemAccessContext {
  readonly chapter: number;
  readonly reputation: number;
  readonly completedQuestIds: readonly string[];
}

type ItemSource = Omit<Chronicle1ItemDefinition, 'category' | 'contentGroup' | 'iconId' | 'useContexts'> & {
  readonly useContexts?: readonly ChronicleItemUseContext[];
};

export const ALL_HERO_CLASSES = deepFreeze(['warrior', 'mage', 'warden'] as const);

function defineGroupedItem(
  contentGroup: ChronicleItemContentGroup,
  category: ItemDefinition['category'],
  source: ItemSource,
  defaultUseContexts: readonly ChronicleItemUseContext[] = [],
): Chronicle1ItemDefinition {
  return deepFreeze({
    ...source,
    category,
    contentGroup,
    useContexts: source.useContexts ?? defaultUseContexts,
    iconId: `item-icon-${source.id}`,
  }) as Chronicle1ItemDefinition;
}

export const defineWeapon = (source: ItemSource) => defineGroupedItem('weapon', 'weapon', source);
export const defineArmor = (source: ItemSource) => defineGroupedItem('armor', 'armor', source);
export const defineCharm = (source: ItemSource) => defineGroupedItem('charm', 'charm', source);
export const defineConsumable = (source: ItemSource) => defineGroupedItem('consumable', 'potion', source, ['field', 'combat']);
export const defineTool = (source: ItemSource) => defineGroupedItem('tool', 'scroll', source, ['field']);
export const defineArtifact = (source: ItemSource) => defineGroupedItem('artifact', 'quest', source);

export function isChronicleItemAvailable(
  item: Chronicle1ItemDefinition,
  context: ChronicleItemAccessContext,
): boolean {
  return context.chapter >= item.gates.minChapter
    && (item.gates.minReputation === undefined || context.reputation >= item.gates.minReputation)
    && (item.gates.questId === undefined || context.completedQuestIds.includes(item.gates.questId));
}

export function isConsumable(
  item: Chronicle1ItemDefinition,
): item is Chronicle1ItemDefinition & { readonly contentGroup: 'consumable'; readonly category: 'potion' } {
  return item.contentGroup === 'consumable';
}
