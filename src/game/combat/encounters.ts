import type { CompanionCombatSnapshot } from '../companions';
import type { EncounterDefinition } from '../content/schema';
import type { EnemyDefinition } from '../types';
import { chooseEnemyIntents, roleForEnemy } from './enemy-ai';
import type { CombatState, EnemyCombatant, HeroCombatant } from './types';

function combatant(enemy: EnemyDefinition, isBoss: boolean): EnemyCombatant {
  const role = roleForEnemy(enemy);
  return { ...enemy, health: enemy.maxHealth, guarding: false, isBoss, statuses: [], role, evasion: role === 'assassin' ? 12 : 0, blockChance: role === 'defender' ? 30 : 0, parryChance: role === 'assassin' ? 10 : 0, phase: 1, roleUses: role === 'summoner' ? 1 : 0 };
}

export function calculateCompanionSupportCeiling(
  encounter: Pick<EncounterDefinition, 'kind' | 'bossEnemyId'>,
  enemyDefinitions: readonly EnemyDefinition[],
  heroLevel: number,
  companion: CompanionCombatSnapshot | null,
): number {
  if (!companion) return 0;
  const raw = encounter.kind === 'boss'
    ? Math.min(
      Math.floor((enemyDefinitions.find((enemy) => enemy.id === encounter.bossEnemyId)?.maxHealth ?? 0) * 0.12),
      12 + heroLevel,
    )
    : Math.min(
      Math.floor(enemyDefinitions.reduce((sum, enemy) => sum + enemy.maxHealth, 0) * 0.15),
      7 + Math.floor(heroLevel * 1.5),
    );
  return companion.injured ? Math.floor(raw * 0.75) : raw;
}

function createCombatWithBossIdentity(
  hero: HeroCombatant,
  enemyDefinitions: readonly EnemyDefinition[],
  seed: number,
  bossEnemyId: string | null,
  companion: CompanionCombatSnapshot | null,
  companionSupportBudget: number,
): CombatState {
  if (enemyDefinitions.length === 0) throw new RangeError('An encounter needs at least one enemy.');
  const seenIds = new Map<string, number>();
  const enemies = enemyDefinitions.map((enemy) => {
    const count = (seenIds.get(enemy.id) ?? 0) + 1;
    seenIds.set(enemy.id, count);
    const result = combatant(enemy, bossEnemyId === enemy.id && count === 1);
    return count === 1 ? result : { ...result, id: `${enemy.id}-${count}` };
  });
  const chosen = chooseEnemyIntents(enemies, seed);
  const primary = chosen.intents[0]!;
  return {
    turn: 1, rngState: chosen.rngState, player: { ...hero, guarding: false, statuses: [...hero.statuses] },
    enemies, enemy: enemies[0]!, enemyIntent: primary.intent, enemyIntents: chosen.intents, intentText: primary.text,
    outcome: 'active', log: [`${enemies[0]!.name} blocks the road.`], missedAttacks: 0,
    companion, companionCooldown: 0, companionDamageDealt: 0, companionSupportBudget,
  };
}

export function createCombatFromEnemies(hero: HeroCombatant, enemyDefinitions: readonly EnemyDefinition[], seed: number, isBoss = false, companion: CompanionCombatSnapshot | null = null): CombatState {
  const kind = isBoss ? 'boss' as const : 'regular' as const;
  const bossEnemyId = isBoss ? enemyDefinitions[0]?.id as EncounterDefinition['bossEnemyId'] : undefined;
  const support = calculateCompanionSupportCeiling({ kind, bossEnemyId }, enemyDefinitions, hero.level, companion);
  return createCombatWithBossIdentity(hero, enemyDefinitions, seed, bossEnemyId ?? null, companion, support);
}

export function createEncounter(hero: HeroCombatant, encounter: EncounterDefinition, content: { readonly enemies: ReadonlyMap<string, EnemyDefinition> }, seed: number, legacyIsBoss?: boolean, companion: CompanionCombatSnapshot | null = null): CombatState {
  const enemies = encounter.enemyIds.map((id) => content.enemies.get(id)).filter((enemy): enemy is EnemyDefinition => Boolean(enemy));
  if (enemies.length !== encounter.enemyIds.length) throw new RangeError('Encounter references an unavailable enemy.');
  const kind = encounter.kind ?? (legacyIsBoss ? 'boss' : 'regular');
  const bossEnemyId = encounter.bossEnemyId ?? (legacyIsBoss ? encounter.enemyIds[0] : undefined);
  if (kind === 'boss' && !bossEnemyId) throw new RangeError('A boss encounter needs one designated boss.');
  const support = calculateCompanionSupportCeiling({ kind, bossEnemyId }, enemies, hero.level, companion);
  return createCombatWithBossIdentity(hero, enemies, seed, bossEnemyId ?? null, companion, support);
}
