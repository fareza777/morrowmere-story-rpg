import type { EnemyDefinition, EnemyIntent, HeroClass } from './types';
import { createRng } from './rng';

export interface StatusEffect {
  readonly id: string;
  readonly label: string;
  readonly duration: number;
  readonly potency: number;
}

export interface HeroState {
  readonly class: HeroClass;
  readonly name: string;
  readonly level: number;
  readonly xp: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly focus: number;
  readonly maxFocus: number;
  readonly strength: number;
  readonly cunning: number;
  readonly will: number;
  readonly armor: number;
  readonly ward: number;
  readonly attackBonus: number;
  readonly guarding: boolean;
  readonly statuses: readonly StatusEffect[];
  readonly inventory: readonly string[];
  readonly equipment: {
    readonly weapon: string | null;
    readonly armor: string | null;
    readonly charms: readonly string[];
  };
}

export interface EnemyCombatant extends EnemyDefinition {
  readonly health: number;
  readonly guarding: boolean;
  readonly isBoss: boolean;
  readonly statuses: readonly StatusEffect[];
}

export type CombatOutcome = 'active' | 'victory' | 'defeat' | 'fled';

export interface CombatState {
  readonly turn: number;
  readonly rngState: number;
  readonly player: HeroState;
  readonly enemy: EnemyCombatant;
  readonly enemyIntent: EnemyIntent;
  readonly intentText: string;
  readonly outcome: CombatOutcome;
  readonly log: readonly string[];
}

export type CombatAction =
  | { readonly type: 'attack' }
  | { readonly type: 'guard' }
  | { readonly type: 'technique'; readonly techniqueId: string }
  | { readonly type: 'item'; readonly itemId: string }
  | { readonly type: 'flee' };

export interface CombatResult {
  readonly state: CombatState;
  readonly events: readonly string[];
}

const INTENT_COPY: Record<EnemyIntent, string> = {
  strike: 'The enemy measures the distance for a direct strike.',
  heavy: 'The enemy commits its weight to a crushing attack.',
  guard: 'The enemy settles behind a guarded stance.',
  hex: 'The enemy gathers a cold knot of hostile sorcery.',
  recover: 'The enemy searches for a breath in which to recover.',
  flee: 'The enemy glances toward the nearest open road.',
};

export function calculateDamage(input: {
  readonly power: number;
  readonly kind: 'physical' | 'sorcery';
  readonly armor: number;
  readonly ward: number;
  readonly guarding?: boolean;
}): number {
  const defense = input.kind === 'physical' ? input.armor : input.ward;
  const afterDefense = Math.max(1, Math.floor(input.power) - Math.max(0, defense));
  return input.guarding ? Math.ceil(afterDefense / 2) : afterDefense;
}

function chooseIntent(enemy: EnemyCombatant, seed: number): { intent: EnemyIntent; state: number } {
  const rng = createRng(seed);
  const weighted = Object.entries(enemy.intentWeights).flatMap(([intent, weight]) =>
    Array.from({ length: Math.max(0, weight ?? 0) }, () => intent as EnemyIntent),
  );
  const allowed = weighted.filter((intent) => intent !== 'flee' || enemy.health <= enemy.maxHealth / 3);
  return { intent: rng.pick(allowed.length > 0 ? allowed : ['strike']), state: rng.state };
}

export function createCombat(
  hero: HeroState,
  enemyDefinition: EnemyDefinition,
  seed: number,
  isBoss = false,
): CombatState {
  const enemy: EnemyCombatant = {
    ...enemyDefinition,
    health: enemyDefinition.maxHealth,
    guarding: false,
    isBoss,
    statuses: [],
  };
  const selected = chooseIntent(enemy, seed);
  return {
    turn: 1,
    rngState: selected.state,
    player: { ...hero, guarding: false, statuses: [...hero.statuses] },
    enemy,
    enemyIntent: selected.intent,
    intentText: INTENT_COPY[selected.intent],
    outcome: 'active',
    log: [`${enemy.name} blocks the road.`],
  };
}

function tickStatuses(statuses: readonly StatusEffect[]): StatusEffect[] {
  return statuses
    .map((status) => ({ ...status, duration: status.duration - 1 }))
    .filter((status) => status.duration > 0);
}

export function resolveCombatAction(state: CombatState, action: CombatAction): CombatResult {
  if (state.outcome !== 'active') return { state, events: [] };
  if (action.type === 'flee' && state.enemy.isBoss) {
    return { state, events: ['There is no road out of this confrontation.'] };
  }

  const rng = createRng(state.rngState);
  const events: string[] = [];
  let player: HeroState = { ...state.player };
  let enemy: EnemyCombatant = { ...state.enemy };

  if (action.type === 'attack') {
    const variance = rng.int(0, 2);
    const damage = calculateDamage({
      power: player.strength + player.attackBonus + 3 + variance,
      kind: 'physical',
      armor: enemy.armor,
      ward: enemy.ward,
      guarding: enemy.guarding,
    });
    enemy = { ...enemy, health: Math.max(0, enemy.health - damage), guarding: false };
    events.push(`You strike for ${damage} damage.`);
  } else if (action.type === 'guard') {
    player = { ...player, guarding: true };
    events.push('You raise your guard and brace for the announced attack.');
  } else if (action.type === 'technique') {
    const focusCost = 3;
    if (player.focus < focusCost) return { state, events: ['You do not have enough Focus.'] };
    const isSorcery = player.class === 'mage' || action.techniqueId === 'witchfire';
    const base = isSorcery ? player.will + 7 : player.strength + player.cunning + 3;
    const damage = calculateDamage({
      power: base,
      kind: isSorcery ? 'sorcery' : 'physical',
      armor: enemy.armor,
      ward: enemy.ward,
      guarding: enemy.guarding,
    });
    player = { ...player, focus: player.focus - focusCost };
    enemy = { ...enemy, health: Math.max(0, enemy.health - damage), guarding: false };
    events.push(`Your technique deals ${damage} damage.`);
  } else if (action.type === 'item') {
    if (!player.inventory.includes(action.itemId)) return { state, events: ['That item is not in your pack.'] };
    player = {
      ...player,
      health: Math.min(player.maxHealth, player.health + 12),
      inventory: player.inventory.filter((id) => id !== action.itemId),
    };
    events.push('You use the item and recover 12 Health.');
  } else if (action.type === 'flee') {
    const escaped = player.cunning + rng.int(1, 10) >= enemy.level + 7;
    if (escaped) {
      const next = { ...state, player, enemy, rngState: rng.state, outcome: 'fled' as const };
      return { state: next, events: ['You break contact and find another road.'] };
    }
    events.push('The enemy cuts off your escape.');
  }

  if (enemy.health <= 0) {
    const next = {
      ...state,
      turn: state.turn + 1,
      rngState: rng.state,
      player: { ...player, guarding: false, statuses: tickStatuses(player.statuses) },
      enemy,
      outcome: 'victory' as const,
      log: [...state.log, ...events],
    };
    return { state: next, events };
  }

  if (state.enemyIntent === 'guard') {
    enemy = { ...enemy, guarding: true };
    events.push(`${enemy.name} guards.`);
  } else if (state.enemyIntent === 'recover') {
    const healing = Math.max(2, Math.floor(enemy.maxHealth * 0.08));
    enemy = { ...enemy, health: Math.min(enemy.maxHealth, enemy.health + healing) };
    events.push(`${enemy.name} recovers ${healing} Health.`);
  } else if (state.enemyIntent === 'flee' && !enemy.isBoss) {
    const next = { ...state, player, enemy, rngState: rng.state, outcome: 'victory' as const };
    return { state: next, events: [...events, `${enemy.name} abandons the fight.`] };
  } else {
    const kind = state.enemyIntent === 'hex' ? 'sorcery' : 'physical';
    const bonus = state.enemyIntent === 'heavy' ? 4 : state.enemyIntent === 'hex' ? 2 : 0;
    const damage = calculateDamage({
      power: enemy.attack + bonus,
      kind,
      armor: player.armor,
      ward: player.ward,
      guarding: player.guarding,
    });
    player = { ...player, health: Math.max(0, player.health - damage) };
    events.push(`${enemy.name} deals ${damage} ${kind} damage.`);
  }

  player = { ...player, guarding: false, statuses: tickStatuses(player.statuses) };
  enemy = { ...enemy, statuses: tickStatuses(enemy.statuses) };
  const selected = chooseIntent(enemy, rng.state);
  const outcome: CombatOutcome = player.health <= 0 ? 'defeat' : 'active';
  const next: CombatState = {
    ...state,
    turn: state.turn + 1,
    rngState: selected.state,
    player,
    enemy,
    enemyIntent: selected.intent,
    intentText: INTENT_COPY[selected.intent],
    outcome,
    log: [...state.log, ...events].slice(-8),
  };
  return { state: next, events };
}
