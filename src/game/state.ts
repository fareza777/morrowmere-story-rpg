import { createCombat, resolveCombatAction, type CombatAction, type CombatState, type HeroState } from './combat';
import { ENEMIES } from './content/enemies';
import { generateItemReward, ITEMS } from './content/items';
import { resolveEnding, type Ending } from './content/story';
import { buildRoute, type RouteNode } from './director';
import type { EventEffect, FactionStanding, HeroClass, ItemCategory, ItemDefinition } from './types';

export { createCampaign } from './state/create';
export { currentScene, currentSceneId, reduceGame, restartChapter, returnToCampAfterDefeat } from './state/reducer';
export type {
  CampaignCheckpointPayload,
  CampaignState as CampaignStateV2,
  ChapterSnapshot,
  CreateCampaignOptions,
  ExpeditionState,
  FlowState,
  GameCommand as GameCommandV2,
  GameStateV2,
  GameTransition,
  HeroVitals,
  SceneResolution,
  PendingBattleReward,
  CampSnapshot,
  ProfileState,
  SequencedDomainEvent,
} from './state/types';

export interface GameSettings {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly sound: boolean;
  readonly music: boolean;
  readonly narration: boolean;
}

export type GameScreen = 'story' | 'combat' | 'reward' | 'defeat' | 'ending';
export type GameOverlay = 'inventory' | 'chronicle' | 'bestiary' | 'settings' | null;

export interface GameState {
  readonly schemaVersion: 1;
  readonly seed: number;
  readonly hero: HeroState;
  readonly route: readonly RouteNode[];
  readonly routeIndex: number;
  readonly screen: GameScreen;
  readonly overlay: GameOverlay;
  readonly combat: CombatState | null;
  readonly rewards: readonly ItemDefinition[];
  readonly flags: readonly string[];
  readonly factions: FactionStanding;
  readonly mercy: number;
  readonly corruption: number;
  readonly gold: number;
  readonly supplies: number;
  readonly lastOutcome: string | null;
  readonly ending: Ending | null;
  readonly discoveredEnemies: readonly string[];
  readonly discoveredEvents: readonly string[];
  readonly settings: GameSettings;
  readonly updatedAt: string;
}

export interface NewRunOptions {
  readonly heroClass: HeroClass;
  readonly seed: number;
  readonly name?: string;
}

export type GameCommand =
  | { readonly type: 'CHOOSE'; readonly choiceId: string }
  | { readonly type: 'ADVANCE' }
  | { readonly type: 'COMBAT'; readonly action: CombatAction }
  | { readonly type: 'CLAIM_REWARD'; readonly itemId: string }
  | { readonly type: 'EQUIP_ITEM'; readonly itemId: string }
  | { readonly type: 'UNEQUIP_ITEM'; readonly itemId: string }
  | { readonly type: 'OPEN_OVERLAY'; readonly overlay: Exclude<GameOverlay, null> }
  | { readonly type: 'CLOSE_OVERLAY' }
  | { readonly type: 'UPDATE_SETTINGS'; readonly settings: Partial<GameSettings> };

const CLASS_STATS: Record<HeroClass, Pick<HeroState, 'maxHealth' | 'maxFocus' | 'strength' | 'cunning' | 'will' | 'armor' | 'ward'>> = {
  warrior: { maxHealth: 44, maxFocus: 8, strength: 8, cunning: 4, will: 3, armor: 4, ward: 1 },
  mage: { maxHealth: 30, maxFocus: 14, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5 },
  warden: { maxHealth: 37, maxFocus: 10, strength: 5, cunning: 8, will: 5, armor: 3, ward: 3 },
};

export function createHero(heroClass: HeroClass, name = 'The Oathless'): HeroState {
  const stats = CLASS_STATS[heroClass];
  return {
    class: heroClass,
    name,
    level: 1,
    xp: 0,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    focus: stats.maxFocus,
    maxFocus: stats.maxFocus,
    strength: stats.strength,
    cunning: stats.cunning,
    will: stats.will,
    armor: stats.armor,
    ward: stats.ward,
    attackBonus: 0,
    guarding: false,
    statuses: [],
    inventory: ['potion-red'],
    equipment: { weapon: null, armor: null, charms: [] },
  };
}

export function startNewRun(options: NewRunOptions): GameState {
  const factions: FactionStanding = { abbey: 0, freeHost: 0, conclave: 0 };
  const route = buildRoute({
    seed: options.seed,
    heroClass: options.heroClass,
    flags: [],
    inventoryTags: [],
    factions,
    recentFamilies: [],
    encounteredEventIds: [],
    tension: 1,
    mercy: 0,
    corruption: 0,
    region: 'gloamwood',
  });
  return {
    schemaVersion: 1,
    seed: options.seed,
    hero: createHero(options.heroClass, options.name),
    route,
    routeIndex: 0,
    screen: 'story',
    overlay: null,
    combat: null,
    rewards: [],
    flags: [],
    factions,
    mercy: 0,
    corruption: 0,
    gold: 12,
    supplies: 3,
    lastOutcome: null,
    ending: null,
    discoveredEnemies: [],
    discoveredEvents: ['prologue'],
    settings: { textScale: 1, highContrast: false, reducedMotion: false, sound: true, music: true, narration: false },
    updatedAt: new Date(0).toISOString(),
  };
}

function addUnique(values: readonly string[], additions: readonly string[] = []): string[] {
  return [...new Set([...values, ...additions])];
}

function applyItemStats(hero: HeroState, item: ItemDefinition, direction: 1 | -1): HeroState {
  const maxHealth = Math.max(1, hero.maxHealth + (item.stats.health ?? 0) * direction);
  const maxFocus = Math.max(0, hero.maxFocus + (item.stats.focus ?? 0) * direction);
  return {
    ...hero,
    attackBonus: Math.max(0, hero.attackBonus + (item.stats.attack ?? 0) * direction),
    will: Math.max(0, hero.will + (item.stats.will ?? 0) * direction),
    armor: Math.max(0, hero.armor + (item.stats.armor ?? 0) * direction),
    ward: Math.max(0, hero.ward + (item.stats.ward ?? 0) * direction),
    maxHealth,
    health: direction > 0
      ? Math.min(maxHealth, hero.health + (item.stats.health ?? 0))
      : Math.min(maxHealth, hero.health),
    maxFocus,
    focus: direction > 0
      ? Math.min(maxFocus, hero.focus + (item.stats.focus ?? 0))
      : Math.min(maxFocus, hero.focus),
  };
}

function isEquipmentCategory(category: ItemCategory): category is 'weapon' | 'armor' | 'charm' {
  return category === 'weapon' || category === 'armor' || category === 'charm';
}

function equipItem(state: GameState, itemId: string): GameState {
  if (!state.hero.inventory.includes(itemId)) return state;
  const item = ITEMS.find((candidate) => candidate.id === itemId);
  if (!item || !item.allowedClasses.includes(state.hero.class)) return state;
  if (!isEquipmentCategory(item.category)) return state;

  if (item.category === 'charm') {
    if (state.hero.equipment.charms.includes(item.id) || state.hero.equipment.charms.length >= 2) return state;
    const hero = applyItemStats(state.hero, item, 1);
    return { ...state, hero: { ...hero, equipment: { ...hero.equipment, charms: [...hero.equipment.charms, item.id] } } };
  }

  const slot = item.category;
  const previousId = state.hero.equipment[slot];
  if (previousId === item.id) return state;
  const previous = previousId ? ITEMS.find((candidate) => candidate.id === previousId) : undefined;
  const withoutPrevious = previous ? applyItemStats(state.hero, previous, -1) : state.hero;
  const hero = applyItemStats(withoutPrevious, item, 1);
  return { ...state, hero: { ...hero, equipment: { ...hero.equipment, [slot]: item.id } } };
}

function unequipItem(state: GameState, itemId: string): GameState {
  const item = ITEMS.find((candidate) => candidate.id === itemId);
  if (!item || !isEquipmentCategory(item.category)) return state;
  const isEquipped = item.category === 'charm'
    ? state.hero.equipment.charms.includes(item.id)
    : state.hero.equipment[item.category] === item.id;
  if (!isEquipped) return state;
  const hero = applyItemStats(state.hero, item, -1);
  const equipment = item.category === 'charm'
    ? { ...hero.equipment, charms: hero.equipment.charms.filter((id) => id !== item.id) }
    : { ...hero.equipment, [item.category]: null };
  return { ...state, hero: { ...hero, equipment } };
}

function applyEffect(state: GameState, effect: EventEffect): GameState {
  const hero = {
    ...state.hero,
    health: Math.max(0, Math.min(state.hero.maxHealth, state.hero.health + (effect.health ?? 0))),
    focus: Math.max(0, Math.min(state.hero.maxFocus, state.hero.focus + (effect.focus ?? 0))),
    attackBonus: state.hero.attackBonus + (effect.attack ?? 0),
    armor: state.hero.armor + (effect.armor ?? 0),
    ward: state.hero.ward + (effect.ward ?? 0),
  };
  return {
    ...state,
    hero,
    flags: addUnique(state.flags, effect.addFlags),
    factions: {
      abbey: state.factions.abbey + (effect.faction?.abbey ?? 0),
      freeHost: state.factions.freeHost + (effect.faction?.freeHost ?? 0),
      conclave: state.factions.conclave + (effect.faction?.conclave ?? 0),
    },
    mercy: state.mercy + (effect.mercy ?? 0),
    corruption: Math.max(0, state.corruption + (effect.corruption ?? 0)),
    gold: Math.max(0, state.gold + (effect.gold ?? 0)),
    supplies: Math.max(0, state.supplies + (effect.supplies ?? 0)),
  };
}

function enemyFor(archetypeId: string, level: number) {
  const variants = ENEMIES.filter((enemy) => enemy.archetypeId === archetypeId);
  return variants.reduce((best, candidate) =>
    Math.abs(candidate.level - level) < Math.abs(best.level - level) ? candidate : best,
  );
}

function beginCombat(state: GameState, archetypeId: string, isBoss: boolean): GameState {
  const enemy = enemyFor(archetypeId, state.hero.level + Math.floor(state.routeIndex / 2));
  return {
    ...state,
    screen: 'combat',
    combat: createCombat(state.hero, enemy, state.seed + state.routeIndex * 997, isBoss),
    lastOutcome: null,
    discoveredEnemies: addUnique(state.discoveredEnemies, [enemy.id]),
  };
}

export function gameReducer(state: GameState, command: GameCommand): GameState {
  if (command.type === 'OPEN_OVERLAY') return { ...state, overlay: command.overlay };
  if (command.type === 'CLOSE_OVERLAY') return state.overlay ? { ...state, overlay: null } : state;
  if (command.type === 'UPDATE_SETTINGS') {
    return { ...state, settings: { ...state.settings, ...command.settings } };
  }
  if (command.type === 'EQUIP_ITEM') return equipItem(state, command.itemId);
  if (command.type === 'UNEQUIP_ITEM') return unequipItem(state, command.itemId);

  if (command.type === 'CHOOSE') {
    if (state.screen !== 'story' || state.lastOutcome) return state;
    const node = state.route[state.routeIndex];
    const selected = node?.choices.find((choice) => choice.id === command.choiceId);
    if (!node || !selected) return state;
    const changed = applyEffect(state, selected.effect);
    if (changed.hero.health <= 0) {
      return {
        ...changed,
        screen: 'defeat',
        combat: null,
        lastOutcome: selected.outcome,
        discoveredEvents: addUnique(state.discoveredEvents, [node.id]),
      };
    }
    const archetypeId = selected.effect.startCombat ?? node.enemyArchetypeId;
    if (archetypeId) return beginCombat(changed, archetypeId, node.kind === 'lieutenant' || node.kind === 'finale');
    return {
      ...changed,
      lastOutcome: selected.outcome,
      discoveredEvents: addUnique(state.discoveredEvents, [node.id]),
    };
  }

  if (command.type === 'ADVANCE') {
    if (state.screen !== 'story' || !state.lastOutcome) return state;
    const nextIndex = state.routeIndex + 1;
    if (nextIndex >= state.route.length) {
      return { ...state, screen: 'ending', ending: resolveEnding(state), lastOutcome: null };
    }
    return { ...state, routeIndex: nextIndex, lastOutcome: null };
  }

  if (command.type === 'COMBAT') {
    if (state.screen !== 'combat' || !state.combat) return state;
    const result = resolveCombatAction(state.combat, command.action);
    if (result.state.outcome === 'victory' || result.state.outcome === 'fled') {
      return {
        ...state,
        hero: result.state.player,
        combat: result.state,
        screen: 'reward',
        rewards: generateItemReward({ heroClass: state.hero.class, level: state.hero.level, seed: result.state.rngState }),
      };
    }
    if (result.state.outcome === 'defeat') {
      return { ...state, hero: result.state.player, combat: result.state, screen: 'defeat' };
    }
    return { ...state, hero: result.state.player, combat: result.state };
  }

  if (command.type === 'CLAIM_REWARD') {
    if (state.screen !== 'reward') return state;
    const reward = state.rewards.find((item) => item.id === command.itemId);
    if (!reward) return state;
    const inventory = state.hero.inventory.length < 12 ? [...state.hero.inventory, reward.id] : state.hero.inventory;
    const hero = { ...state.hero, inventory, xp: state.hero.xp + 25 };
    const node = state.route[state.routeIndex];
    if (node?.kind === 'finale') {
      return { ...state, hero, screen: 'ending', ending: resolveEnding(state), rewards: [], combat: null };
    }
    return { ...state, hero, routeIndex: state.routeIndex + 1, screen: 'story', rewards: [], combat: null, lastOutcome: null };
  }

  return state;
}
