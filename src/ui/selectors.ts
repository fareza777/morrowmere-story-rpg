import { loyaltyTier } from '../game/companions';
import type { CombatState, EnemyCombatant } from '../game/combat/types';
import type { ChronicleChoice, ChronicleEvent, ContentIndex } from '../game/content/schema';
import { CHRONICLE1_ROUTES } from '../game/content/chronicle1/routes';
import type { EnemyId, EventId, ItemId } from '../game/domain/ids';
import { inventorySlotUsage, PACK_CAPACITY, type InventoryEntry } from '../game/inventory';
import { quoteTrade, type MerchantContext, type MerchantVisit } from '../game/merchant';
import { deriveHeroStats } from '../game/progression';
import type { GameStateV2 } from '../game/state/types';
import type { HeroClass, ItemDefinition, ItemStats } from '../game/types';
import type {
  CampViewModel,
  CodexEntryViewModel,
  CombatActionViewModel,
  CombatViewModel,
  CompanionJournalViewModel,
  CompanionSummaryViewModel,
  ConsequenceViewModel,
  EnemyCombatViewModel,
  EvidenceViewModel,
  HeroHudViewModel,
  InventoryViewModel,
  ItemRowViewModel,
  JournalViewModel,
  MerchantSaleViewModel,
  MerchantStockViewModel,
  MerchantViewModel,
  ObjectiveViewModel,
  RouteOptionViewModel,
  RouteViewModel,
  StatLineViewModel,
  StoryChoiceViewModel,
  StoryViewModel,
} from './types';

const CLASS_LABELS: Readonly<Record<HeroClass, string>> = {
  warrior: 'Warrior',
  mage: 'Mage',
  warden: 'Warden',
};

const RESOURCE_LABELS: Readonly<Record<HeroClass, HeroHudViewModel['resourceLabel']>> = {
  warrior: 'Stamina',
  mage: 'Mana',
  warden: 'Focus',
};

const ITEM_STAT_LABELS: Readonly<Record<keyof ItemStats, string>> = {
  attack: 'Attack',
  will: 'Will',
  armor: 'Armor',
  ward: 'Ward',
  health: 'Health',
  focus: 'Resource',
};

const ITEM_STAT_ORDER: readonly (keyof ItemStats)[] = [
  'attack',
  'will',
  'armor',
  'ward',
  'health',
  'focus',
];

const INTENT_LABELS: Readonly<Record<string, string>> = {
  strike: 'Attack',
  heavy: 'Heavy attack',
  guard: 'Guarding ally',
  hex: 'Casting hex',
  recover: 'Recovering',
  flee: 'Preparing to flee',
};

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function companionCommandLabel(companionId: string, actionId: string): string {
  const prefix = `${companionId}-`;
  return titleCase(actionId.startsWith(prefix) ? actionId.slice(prefix.length) : actionId);
}

function chapterLabel(state: GameStateV2): string {
  return `Chapter ${Number(state.campaign.chapterId.slice(2))}`;
}

function routeLabel(state: GameStateV2): string {
  if (!state.expedition) return 'Camp';
  return CHRONICLE1_ROUTES.find((route) => route.id === state.expedition?.routeProfile)?.label ?? 'On the road';
}

function objectiveEvent(state: GameStateV2, content: ContentIndex): ChronicleEvent | null {
  const current = state.expedition?.currentSceneId
    ? content.events.get(state.expedition.currentSceneId)
    : undefined;
  if (current) return current;

  const seen = new Set(state.campaign.directorMemory.seenEventIds);
  const mainEvents = [...content.events.values()]
    .filter((event) => event.chapterId === state.campaign.chapterId && event.type === 'main')
    .sort((left, right) => {
      const anchorDifference = (left.anchorOrder ?? Number.MAX_SAFE_INTEGER)
        - (right.anchorOrder ?? Number.MAX_SAFE_INTEGER);
      return anchorDifference || left.id.localeCompare(right.id);
    });
  return mainEvents.find((event) => !seen.has(event.id)) ?? mainEvents.at(-1) ?? null;
}

function selectObjective(state: GameStateV2, content: ContentIndex): ObjectiveViewModel {
  const event = objectiveEvent(state, content);
  if (!event) {
    return {
      id: 'continue-chronicle',
      title: 'Continue Chronicle I',
      summary: 'Choose a route and continue the campaign.',
      completed: false,
    };
  }
  return {
    id: event.id,
    title: event.title,
    summary: event.narrative[0] ?? event.title,
    completed: state.expedition?.currentSceneId === event.id
      ? state.expedition.sceneResolution?.eventId === event.id
        && state.expedition.sceneResolution.choiceId !== null
      : state.campaign.directorMemory.seenEventIds.includes(event.id),
  };
}

function heroHud(state: GameStateV2, content: ContentIndex): HeroHudViewModel {
  const derived = deriveHeroStats(state.campaign.hero, state.campaign.inventory, content.items);
  const combatPlayer = state.expedition?.currentCombat?.combat?.player;
  const health = combatPlayer?.health ?? state.expedition?.heroVitals.health ?? derived.maxHealth;
  const maxHealth = combatPlayer?.maxHealth ?? derived.maxHealth;
  const resource = combatPlayer?.focus ?? state.expedition?.heroVitals.resource ?? derived.maxFocus;
  const maxResource = combatPlayer?.maxFocus ?? derived.maxFocus;
  const carriedGold = state.expedition?.unbankedGold ?? 0;
  return {
    name: state.campaign.heroName,
    heroClass: state.campaign.hero.heroClass,
    heroClassLabel: CLASS_LABELS[state.campaign.hero.heroClass],
    level: state.campaign.hero.level,
    xp: state.campaign.hero.xp,
    health,
    maxHealth,
    resource,
    maxResource,
    resourceLabel: RESOURCE_LABELS[state.campaign.hero.heroClass],
    bankedGold: state.campaign.bankedGold,
    carriedGold,
    totalGold: state.campaign.bankedGold + carriedGold,
    chapterLabel: chapterLabel(state),
    locationLabel: routeLabel(state),
  };
}

function itemStats(stats: ItemStats): readonly StatLineViewModel[] {
  return ITEM_STAT_ORDER.flatMap((id) => {
    const value = stats[id];
    if (value === undefined || value === 0) return [];
    return [{
      id,
      label: ITEM_STAT_LABELS[id],
      value,
      displayValue: value > 0 ? `+${value}` : String(value),
    }];
  });
}

function rarityLabel(item: ItemDefinition): string {
  const richItem = item as ItemDefinition & { readonly tier?: 1 | 2 | 3 | 4 | 5 };
  if (richItem.tier) {
    return ({ 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary' } as const)[richItem.tier];
  }
  const rarity = ['legendary', 'epic', 'rare', 'uncommon', 'common']
    .find((candidate) => item.tags.includes(candidate));
  return rarity ? titleCase(rarity) : 'Common';
}

function itemIconId(item: ItemDefinition): string | null {
  const richItem = item as ItemDefinition & { readonly iconId?: string };
  if (richItem.iconId) return richItem.iconId;
  const iconTag = item.tags.find((tag) => tag.startsWith('icon:'));
  return iconTag?.slice('icon:'.length) || null;
}

function taggedMinimum(item: ItemDefinition, tagName: string): number | null {
  const tag = item.tags.find((candidate) => candidate.startsWith(`${tagName}:`));
  if (!tag) return null;
  const value = Number(tag.slice(tagName.length + 1));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function itemRow(
  item: ItemDefinition,
  quantity: number,
  entryId: string | null,
): ItemRowViewModel {
  const classes = item.allowedClasses.map((heroClass) => CLASS_LABELS[heroClass]);
  const richItem = item as ItemDefinition & {
    readonly tier?: 1 | 2 | 3 | 4 | 5;
    readonly gates?: { readonly minChapter?: number };
  };
  const minimumLevel = taggedMinimum(item, 'min-level');
  const minimumChapter = richItem.gates?.minChapter ?? taggedMinimum(item, 'min-chapter');
  const restrictions = [
    classes.length === 3 ? 'All classes' : classes.join(', '),
    minimumLevel ? `Level ${minimumLevel}` : null,
    minimumChapter ? `Chapter ${minimumChapter}` : null,
  ].filter((part): part is string => part !== null);
  return {
    entryId,
    itemId: item.id,
    name: item.name,
    category: item.category,
    categoryLabel: titleCase(item.category),
    description: item.description,
    quantity,
    iconId: itemIconId(item),
    rarityLabel: rarityLabel(item),
    tier: richItem.tier ?? null,
    allowedClasses: [...item.allowedClasses],
    minimumLevel,
    minimumChapter,
    restrictionLabel: restrictions.join(' · '),
    stats: itemStats(item.stats),
    tags: [...item.tags],
    usable: item.category === 'potion' || item.category === 'scroll',
    equippable: item.category === 'weapon' || item.category === 'armor' || item.category === 'charm',
  };
}

function inventoryEntryRow(entry: InventoryEntry, content: ContentIndex): ItemRowViewModel | null {
  const item = content.items.get(entry.itemId);
  return item ? itemRow(item, entry.quantity, entry.id) : null;
}

function contentItemRow(itemId: ItemId | null, content: ContentIndex): ItemRowViewModel | null {
  if (!itemId) return null;
  const item = content.items.get(itemId);
  return item ? itemRow(item, 1, null) : null;
}

function activeCompanionSummary(state: GameStateV2, content: ContentIndex): CompanionSummaryViewModel | null {
  const activeId = state.campaign.companions.activeCompanionId;
  if (!activeId) return null;
  const progress = state.campaign.companions.records.find((record) => record.companionId === activeId);
  const definition = content.companions.get(activeId);
  if (!progress || !definition || progress.status !== 'recruited') return null;
  return {
    id: activeId,
    name: definition.name,
    statusLabel: progress.injured ? 'Injured' : 'Ready',
    injured: progress.injured,
  };
}

function choiceRequirements(choice: ChronicleChoice): {
  readonly requirements?: readonly { readonly flagId: string; readonly present?: boolean }[];
  readonly exclusions?: readonly { readonly flagId: string; readonly present?: boolean }[];
} {
  return choice as ChronicleChoice & {
    readonly requirements?: readonly { readonly flagId: string; readonly present?: boolean }[];
    readonly exclusions?: readonly { readonly flagId: string; readonly present?: boolean }[];
  };
}

function unavailableChoiceReason(choice: ChronicleChoice, state: GameStateV2): string | null {
  const authored = choiceRequirements(choice);
  const missing = authored.requirements?.some((requirement) =>
    (requirement.present ?? true)
      ? !state.campaign.flags.includes(requirement.flagId)
      : state.campaign.flags.includes(requirement.flagId),
  );
  if (missing) return 'A required earlier decision is missing.';
  const excluded = authored.exclusions?.some((requirement) =>
    (requirement.present ?? true)
      ? state.campaign.flags.includes(requirement.flagId)
      : !state.campaign.flags.includes(requirement.flagId),
  );
  return excluded ? 'An earlier decision has closed this path.' : null;
}

export function selectCampView(state: GameStateV2, content: ContentIndex): CampViewModel {
  return {
    hero: heroHud(state, content),
    objective: selectObjective(state, content),
    activeCompanion: activeCompanionSummary(state, content),
    hasStashItems: state.campaign.inventory.stash.length > 0,
    canDepart: state.flow.screen === 'camp',
  };
}

function weightLabel(weight: number, noun: string): string {
  if (weight <= 0) return `No ${noun}`;
  if (weight === 1) return `Limited ${noun}`;
  if (weight === 2) return `Regular ${noun}`;
  return `Frequent ${noun}`;
}

function routeOption(route: (typeof CHRONICLE1_ROUTES)[number]): RouteOptionViewModel {
  const riskLabel = route.danger === 1
    ? 'Lower danger'
    : route.danger === 2
      ? 'Ambush risk · Moderate danger'
      : 'High danger';
  return {
    id: route.id,
    label: route.label,
    description: route.description,
    riskLabel,
    recoveryLabel: weightLabel(route.recoveryWeight, 'recovery'),
    tradeLabel: weightLabel(route.merchantWeight, 'trade'),
    companionLabel: weightLabel(route.companionWeight, 'companion events'),
    relicLabel: weightLabel(route.relicWeight, 'relic finds'),
  };
}

export function selectRouteView(state: GameStateV2, content: ContentIndex): RouteViewModel {
  return {
    hero: heroHud(state, content),
    objective: selectObjective(state, content),
    routes: CHRONICLE1_ROUTES.map(routeOption),
  };
}

export function selectCurrentScene(state: GameStateV2, content: ContentIndex): StoryViewModel | null {
  const sceneId = state.expedition?.currentSceneId;
  if (!sceneId) return null;
  const event = content.events.get(sceneId);
  if (!event) return null;
  const resolution = state.expedition?.sceneResolution;
  const resolved = resolution?.eventId === event.id && resolution.choiceId !== null;
  const selectedChoice = resolved
    ? event.choices.find((choice) => choice.id === resolution.choiceId)
    : undefined;
  const choices: readonly StoryChoiceViewModel[] = event.choices.map((choice) => {
    const unavailableReason = unavailableChoiceReason(choice, state);
    return {
      id: choice.id,
      label: choice.label,
      detail: choice.detail,
      outcome: choice.outcome,
      selected: selectedChoice?.id === choice.id,
      disabled: resolved || unavailableReason !== null,
      unavailableReason: resolved && selectedChoice?.id !== choice.id
        ? 'This scene has already been resolved.'
        : unavailableReason,
    };
  });
  return {
    id: event.id,
    title: event.title,
    paragraphs: [...event.narrative],
    illustrationId: event.illustrationId,
    illustrationAlt: `Illustration for ${event.title}.`,
    choices,
    resolved,
    outcome: selectedChoice?.outcome ?? null,
  };
}

function combatActions(
  state: GameStateV2,
  content: ContentIndex,
): readonly CombatActionViewModel[] {
  const combat = state.expedition?.currentCombat?.combat;
  if (!combat) return [];
  const active = combat.outcome === 'active';
  const consumableAvailable = state.campaign.inventory.pack.some((entry) => {
    const item = content.items.get(entry.itemId);
    return item?.category === 'potion' || item?.category === 'scroll';
  });
  const companionDefinition = combat.companion
    ? content.companions.get(combat.companion.companionId)
    : undefined;
  const supportSpent = combat.companionDamageDealt >= combat.companionSupportBudget;
  const companionReason = !combat.companion || !companionDefinition
    ? 'No active companion is available.'
    : combat.companionCooldown > 0
      ? `Companion command is ready in ${combat.companionCooldown} turn${combat.companionCooldown === 1 ? '' : 's'}.`
      : supportSpent
        ? 'Companion support is exhausted for this battle.'
        : null;
  const bossPresent = combat.enemies.some((enemy) => enemy.health > 0 && enemy.isBoss);
  const inactiveReason = active ? null : 'This battle has ended.';
  return [
    { id: 'attack', label: 'Attack', available: active, unavailableReason: inactiveReason, turnCostLabel: null },
    { id: 'guard', label: 'Guard', available: active, unavailableReason: inactiveReason, turnCostLabel: null },
    {
      id: 'technique',
      label: 'Technique',
      available: active && combat.player.focus >= 3,
      unavailableReason: inactiveReason
        ?? (combat.player.focus >= 3 ? null : `Requires 3 ${RESOURCE_LABELS[combat.player.class]}.`),
      turnCostLabel: 'Spends a turn',
    },
    {
      id: 'consumable',
      label: 'Consumable',
      available: active && consumableAvailable,
      unavailableReason: inactiveReason ?? (consumableAvailable ? null : 'No usable consumable is in the pack.'),
      turnCostLabel: 'Spends a turn',
    },
    {
      id: 'companion',
      label: companionDefinition
        ? `${companionDefinition.name}: ${companionCommandLabel(companionDefinition.id, companionDefinition.combat.actionId)}`
        : 'Companion Command',
      available: active && companionReason === null,
      unavailableReason: inactiveReason ?? companionReason,
      turnCostLabel: null,
    },
    {
      id: 'flee',
      label: 'Flee',
      available: active && !bossPresent,
      unavailableReason: inactiveReason ?? (bossPresent ? 'You cannot flee from a boss battle.' : null),
      turnCostLabel: null,
    },
  ];
}

function combatEnemy(
  enemy: EnemyCombatant,
  combat: CombatState,
  content: ContentIndex,
): EnemyCombatViewModel | null {
  const definition = content.enemies.get(enemy.id as EnemyId)
    ?? [...content.enemies.values()].find((candidate) =>
      enemy.id.startsWith(`${candidate.id}-`)
      && enemy.archetypeId === candidate.archetypeId
      && enemy.species === candidate.species,
    );
  if (!definition) return null;
  const portraitId = 'portraitId' in definition && typeof definition.portraitId === 'string'
    ? definition.portraitId
    : null;
  const intent = combat.enemyIntents.find((candidate) => candidate.enemyId === enemy.id);
  const intentId = intent?.intent ?? 'strike';
  return {
    id: enemy.id,
    name: definition.name,
    description: definition.description,
    illustrationId: portraitId ?? definition.artFamily,
    illustrationKind: portraitId ? 'chronicle-portrait' : 'art-family',
    artFamily: definition.artFamily,
    role: enemy.role,
    roleLabel: titleCase(enemy.role),
    health: enemy.health,
    maxHealth: definition.maxHealth,
    statuses: enemy.statuses.map((status) => ({
      id: status.id,
      label: status.label,
      duration: status.duration,
      potency: status.potency,
    })),
    intent: {
      id: intentId,
      label: INTENT_LABELS[intentId] ?? titleCase(intentId),
      description: intent?.text ?? 'Intent not announced.',
    },
    isBoss: enemy.isBoss,
    phase: enemy.phase,
  };
}

export function selectCombatView(state: GameStateV2, content: ContentIndex): CombatViewModel | null {
  const combat = state.expedition?.currentCombat?.combat;
  if (!combat) return null;
  const enemies = combat.enemies
    .filter((enemy) => enemy.health > 0)
    .map((enemy) => combatEnemy(enemy, combat, content))
    .filter((enemy): enemy is EnemyCombatViewModel => enemy !== null);
  const companionDefinition = combat.companion
    ? content.companions.get(combat.companion.companionId)
    : undefined;
  const supportSpent = combat.companionDamageDealt >= combat.companionSupportBudget;
  const companion = combat.companion && companionDefinition
    ? {
        id: combat.companion.companionId,
        name: companionDefinition.name,
        commandId: companionDefinition.combat.actionId,
        commandLabel: companionCommandLabel(companionDefinition.id, companionDefinition.combat.actionId),
        cooldownRemaining: combat.companionCooldown,
        available: combat.outcome === 'active' && combat.companionCooldown === 0 && !supportSpent,
        unavailableReason: combat.companionCooldown > 0
          ? `Ready in ${combat.companionCooldown} turn${combat.companionCooldown === 1 ? '' : 's'}.`
          : supportSpent
            ? 'Support exhausted for this battle.'
            : combat.outcome === 'active'
              ? null
              : 'This battle has ended.',
        injured: combat.companion.injured,
      }
    : null;
  return {
    hero: heroHud(state, content),
    companion,
    enemies,
    selectedTargetId: enemies[0]?.id ?? '',
    actions: combatActions(state, content),
    log: [...combat.log],
  };
}

export function selectInventoryView(state: GameStateV2, content: ContentIndex): InventoryViewModel {
  const usage = inventorySlotUsage(state.campaign.inventory);
  const derived = deriveHeroStats(state.campaign.hero, state.campaign.inventory, content.items);
  const pack = state.campaign.inventory.pack
    .map((entry) => inventoryEntryRow(entry, content))
    .filter((entry): entry is ItemRowViewModel => entry !== null);
  const stash = state.campaign.inventory.stash
    .map((entry) => inventoryEntryRow(entry, content))
    .filter((entry): entry is ItemRowViewModel => entry !== null);
  const questItems = state.campaign.inventory.questItems
    .map((id) => contentItemRow(id, content))
    .filter((entry): entry is ItemRowViewModel => entry !== null);
  return {
    usedSlots: usage.used,
    capacity: PACK_CAPACITY,
    pack,
    stash,
    equipment: {
      weapon: contentItemRow(state.campaign.inventory.equipment.weapon, content),
      armor: contentItemRow(state.campaign.inventory.equipment.armor, content),
      charms: state.campaign.inventory.equipment.charms
        .map((id) => contentItemRow(id, content))
        .filter((entry): entry is ItemRowViewModel => entry !== null),
    },
    questItems,
    derivedStats: [
      { id: 'attack', label: 'Attack', value: derived.attack, displayValue: String(derived.attack) },
      { id: 'armor', label: 'Armor', value: derived.armor, displayValue: String(derived.armor) },
      { id: 'ward', label: 'Ward', value: derived.ward, displayValue: String(derived.ward) },
      { id: 'max-health', label: 'Maximum Health', value: derived.maxHealth, displayValue: String(derived.maxHealth) },
      { id: 'max-resource', label: `Maximum ${RESOURCE_LABELS[derived.heroClass]}`, value: derived.maxFocus, displayValue: String(derived.maxFocus) },
    ],
  };
}

function merchantContext(
  state: GameStateV2,
  content: ContentIndex,
  visit: MerchantVisit,
): MerchantContext {
  return {
    content,
    seed: state.expedition!.routeSeed,
    restockKey: visit.restockKey,
    heroLevel: state.campaign.hero.level,
    chapter: Number(state.campaign.chapterId.slice(2)),
    reputation: 0,
    scarcityMultiplier: 1,
    persistedVisit: visit,
  };
}

export function selectMerchantView(state: GameStateV2, content: ContentIndex): MerchantViewModel | null {
  const flow = state.flow.merchant;
  const expedition = state.expedition;
  if (state.flow.screen !== 'merchant' || !flow || !expedition) return null;
  const merchant = content.merchants.get(flow.merchantId);
  const visit = expedition.merchantVisits.find((candidate) =>
    candidate.merchantId === flow.merchantId && candidate.restockKey === flow.restockKey,
  );
  if (!merchant || !visit) return null;
  const context = merchantContext(state, content, visit);
  const totalGold = state.campaign.bankedGold + expedition.unbankedGold;
  const stock = visit.stock.flatMap((stockEntry): readonly MerchantStockViewModel[] => {
    const item = content.items.get(stockEntry.itemId);
    const quote = quoteTrade(
      visit,
      state.campaign.inventory,
      { type: 'buy', stockEntryId: stockEntry.id },
      context,
    );
    if (!item || !quote.ok) return [];
    return [{
      ...itemRow(item, 1, null),
      stockEntryId: stockEntry.id,
      price: quote.value.total,
      affordable: totalGold >= quote.value.total,
    }];
  });
  const sellable = state.campaign.inventory.pack.flatMap((entry): readonly MerchantSaleViewModel[] => {
    const item = content.items.get(entry.itemId);
    const quote = quoteTrade(
      visit,
      state.campaign.inventory,
      { type: 'sell', entryId: entry.id },
      context,
    );
    if (!item || !quote.ok) return [];
    return [{
      ...itemRow(item, entry.quantity, entry.id),
      priceEach: quote.value.unitPrice,
      stackPrice: quote.value.total,
    }];
  });
  const scene = expedition.currentSceneId
    ? content.events.get(expedition.currentSceneId)
    : undefined;
  const merchantScene = scene?.merchantId === merchant.id ? scene : undefined;
  return {
    id: merchant.id,
    name: merchant.name,
    illustrationId: `merchant-${merchant.id}`,
    illustrationAlt: `Illustration of ${merchant.name}.`,
    dialogue: merchantScene ? [...merchantScene.narrative] : [],
    bankedGold: state.campaign.bankedGold,
    carriedGold: expedition.unbankedGold,
    totalGold,
    stock,
    sellable,
    emptyStockMessage: stock.length === 0 ? `${merchant.name} has no stock left for this visit.` : null,
  };
}

function authoredConsequence(flag: string, content: ContentIndex): ConsequenceViewModel | null {
  for (const event of content.events.values()) {
    for (const choice of event.choices) {
      const addsFlag = choice.effects.some((effect) =>
        effect.type === 'flag' && effect.operation === 'add' && effect.flagId === flag,
      );
      if (addsFlag) {
        return {
          id: flag,
          label: choice.label,
          summary: choice.outcome,
          sceneTitle: event.title,
        };
      }
    }
  }
  return null;
}

function evidenceEntry(id: string): EvidenceViewModel {
  const words = id.split(/[-_\s]+/u).filter(Boolean);
  const label = titleCase(
    words[0] === 'evidence' || words[0] === 'proof'
      ? words.slice(1).join(' ')
      : words.join(' '),
  );
  return {
    id,
    label,
    summary: `${label} has been recorded as evidence.`,
  };
}

function companionJournal(state: GameStateV2, content: ContentIndex): readonly CompanionJournalViewModel[] {
  return state.campaign.companions.records.flatMap((progress): readonly CompanionJournalViewModel[] => {
    const definition = content.companions.get(progress.companionId);
    if (!definition) return [];
    const tier = loyaltyTier(progress.loyalty);
    const loyaltyLabel = tier === 'wary' ? 'Wary' : tier === 'respectful' ? 'Respectful' : 'Loyal';
    const richDefinition = definition as typeof definition & {
      readonly commandCooldown?: number;
      readonly loyaltyStates?: Readonly<Record<'wary' | 'respectful' | 'loyal', string>>;
      readonly explorationCapability?: { readonly id: string; readonly label: string; readonly description: string };
      readonly passive?: { readonly id: string; readonly label: string; readonly description: string };
      readonly visibleRecruitmentCost?: string;
    };
    const statusLabel = progress.status === 'unknown'
      ? 'Not recruited'
      : progress.status === 'recruited'
        ? progress.injured ? 'Recruited · Injured' : 'Recruited · Ready'
        : titleCase(progress.status);
    const personalQuests = definition.personalQuestIds.flatMap((questId, index) => {
      const event = content.events.get(questId);
      if (!event) return [];
      const stage = (index + 1) as 1 | 2 | 3;
      return [{
        id: questId,
        title: event.title,
        summary: event.narrative[0] ?? event.title,
        stage,
        completed: progress.questStage >= stage,
      }];
    });
    return [{
      id: progress.companionId,
      name: definition.name,
      status: progress.status,
      statusLabel,
      loyaltyLabel,
      injured: progress.injured,
      active: state.campaign.companions.activeCompanionId === progress.companionId,
      commandId: definition.combat.actionId,
      commandLabel: companionCommandLabel(definition.id, definition.combat.actionId),
      commandCooldown: richDefinition.commandCooldown ?? null,
      loyaltyDescription: richDefinition.loyaltyStates?.[tier] ?? `${loyaltyLabel} trust.`,
      explorationCapability: richDefinition.explorationCapability
        ? { ...richDefinition.explorationCapability }
        : null,
      passive: richDefinition.passive ? { ...richDefinition.passive } : null,
      recruitmentCostLabel: richDefinition.visibleRecruitmentCost ?? null,
      personalQuests,
    }];
  });
}

function codexEntries(state: GameStateV2, content: ContentIndex): readonly CodexEntryViewModel[] {
  const discoveryIds = [
    ...state.profile.discoveries.events,
    ...state.profile.discoveries.enemies,
    ...state.profile.discoveries.codex,
  ];
  const uniqueIds = [...new Set(discoveryIds)];
  return uniqueIds.flatMap((id): readonly CodexEntryViewModel[] => {
    const event = content.events.get(id as EventId);
    if (event) {
      return [{
        id,
        category: 'event',
        title: event.title,
        description: event.narrative[0] ?? event.title,
        illustrationId: event.illustrationId,
      }];
    }
    const enemy = content.enemies.get(id as EnemyId);
    if (enemy) {
      const portraitId = 'portraitId' in enemy && typeof enemy.portraitId === 'string'
        ? enemy.portraitId
        : null;
      return [{
        id,
        category: 'enemy',
        title: enemy.name,
        description: enemy.description,
        illustrationId: portraitId ?? enemy.artFamily,
      }];
    }
    return [];
  });
}

export function selectJournalView(state: GameStateV2, content: ContentIndex): JournalViewModel {
  return {
    objective: selectObjective(state, content),
    consequences: state.campaign.flags
      .map((flag) => authoredConsequence(flag, content))
      .filter((entry): entry is ConsequenceViewModel => entry !== null),
    evidence: [...state.campaign.evidence].sort().map(evidenceEntry),
    companions: companionJournal(state, content),
    codex: codexEntries(state, content),
  };
}
