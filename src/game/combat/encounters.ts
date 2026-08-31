import type { CompanionCombatSnapshot } from '../companions';
import type { EncounterDefinition } from '../content/schema';
import type { EnemyDefinition } from '../types';
import { chooseEnemyIntents, roleForEnemy } from './enemy-ai';
import type { CombatState, EnemyCombatant, HeroCombatant } from './types';

function combatant(enemy: EnemyDefinition, isBoss: boolean): EnemyCombatant {
  const role = roleForEnemy(enemy);
  return { ...enemy, health: enemy.maxHealth, guarding: false, isBoss, statuses: [], role, evasion: role === 'assassin' ? 12 : 0, blockChance: role === 'defender' ? 30 : 0, parryChance: role === 'assassin' ? 10 : 0, phase: 1 };
}

export function createCombatFromEnemies(hero: HeroCombatant, enemyDefinitions: readonly EnemyDefinition[], seed: number, isBoss = false, companion: CompanionCombatSnapshot | null = null): CombatState {
  if (enemyDefinitions.length === 0) throw new RangeError('An encounter needs at least one enemy.');
  const seenIds = new Map<string, number>();
  const enemies = enemyDefinitions.map((enemy) => {
    const count = (seenIds.get(enemy.id) ?? 0) + 1;
    seenIds.set(enemy.id, count);
    const result = combatant(enemy, isBoss);
    return count === 1 ? result : { ...result, id: `${enemy.id}-${count}` };
  });
  const chosen = chooseEnemyIntents(enemies, seed);
  const primary = chosen.intents[0]!;
  return {
    turn: 1, rngState: chosen.rngState, player: { ...hero, guarding: false, statuses: [...hero.statuses] },
    enemies, enemy: enemies[0]!, enemyIntent: primary.intent, enemyIntents: chosen.intents, intentText: primary.text,
    outcome: 'active', log: [`${enemies[0]!.name} blocks the road.`], missedAttacks: 0,
    companion, companionCooldown: 0, companionDamageDealt: 0,
    companionSupportBudget: companion ? Math.max(4, Math.floor(enemies.reduce((sum, enemy) => sum + enemy.maxHealth, 0) * 0.35)) : 0,
  };
}

export function createEncounter(hero: HeroCombatant, encounter: EncounterDefinition, content: { readonly enemies: ReadonlyMap<string, EnemyDefinition> }, seed: number, isBoss = false, companion: CompanionCombatSnapshot | null = null): CombatState {
  const enemies = encounter.enemyIds.map((id) => content.enemies.get(id)).filter((enemy): enemy is EnemyDefinition => Boolean(enemy));
  if (enemies.length !== encounter.enemyIds.length) throw new RangeError('Encounter references an unavailable enemy.');
  return createCombatFromEnemies(hero, enemies, seed, isBoss, companion);
}
