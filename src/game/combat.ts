/** Compatibility facade for the vertical slice while tactical modules stay pure. */
import type { EnemyDefinition } from './types';
import { ITEMS } from './content/items';
import { createCombatFromEnemies } from './combat/encounters';
import { resolveCombatTurn } from './combat/resolve';
import type { CombatAction, CombatState, HeroCombatant } from './combat/types';

export * from './combat/types';
export { calculateDamage } from './combat/attack';
export { createEncounter } from './combat/encounters';
export { resolveCombatTurn } from './combat/resolve';

/** @deprecated Use `createEncounter` with a catalog encounter definition. */
export function createCombat(hero: HeroCombatant, enemyDefinition: EnemyDefinition, seed: number, isBoss = false): CombatState {
  return createCombatFromEnemies(hero, [enemyDefinition], seed, isBoss);
}

export interface CombatResult {
  readonly state: CombatState;
  readonly events: readonly string[];
}

const LEGACY_ITEMS = new Map(ITEMS.map((item) => [item.id, item] as const));

function legacyInventory(hero: HeroCombatant) {
  return {
    pack: hero.inventory.map((itemId) => ({ id: itemId, itemId: itemId as never, quantity: 1 })),
    stash: [], questItems: [], equipment: { weapon: hero.equipment.weapon as never, armor: hero.equipment.armor as never, charms: hero.equipment.charms as never },
  };
}

/** @deprecated Use `resolveCombatTurn`, which returns combat and inventory atomically. */
export function resolveCombatAction(state: CombatState, action: CombatAction): CombatResult {
  const legacyState: CombatState = {
    ...state,
    enemies: [state.enemy],
    enemyIntents: [{ enemyId: state.enemy.id, intent: state.enemyIntent, text: state.intentText }],
  };
  const result = resolveCombatTurn(legacyState, action, legacyInventory(state.player), { items: LEGACY_ITEMS });
  const player = { ...result.combat.player, inventory: result.inventory.pack.flatMap((entry) => Array.from({ length: entry.quantity }, () => entry.itemId)) };
  const next = { ...result.combat, player };
  const events = result.events.map((event) => {
    if (event.type !== 'attack_resolved') {
      if (event.type === 'combat_action_rejected' && event.reason === 'boss_cannot_flee') return 'There is no road out of this confrontation.';
      return '';
    }
    if (event.attackerId === 'hero') return event.outcome === 'miss' ? 'Your attack misses. Steel finds only rain.' : event.outcome === 'critical' ? `Critical hit! You strike for ${event.damage} damage.` : `You strike for ${event.damage} damage.`;
    return event.outcome === 'miss' ? `${state.enemy.name} misses you.` : event.outcome === 'critical' ? `Critical enemy hit! ${state.enemy.name} deals ${event.damage} damage.` : `${state.enemy.name} deals ${event.damage} damage.`;
  }).filter(Boolean);
  return { state: next, events };
}

export type { CombatAction, CombatState, HeroCombatant as HeroState };
