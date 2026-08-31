import { createRng, type SeededRng } from '../rng';
import type { EnemyCombatant, HeroCombatant, AttackOutcome } from './types';

export function calculateDamage(input: { readonly power: number; readonly kind: 'physical' | 'sorcery'; readonly armor: number; readonly ward: number; readonly guarding?: boolean }): number {
  const defense = input.kind === 'physical' ? input.armor : input.ward;
  const afterDefense = Math.max(1, Math.floor(input.power) - Math.max(0, defense));
  return input.guarding ? Math.ceil(afterDefense / 2) : afterDefense;
}

export function hasStatus(statuses: readonly { readonly id: string }[], id: string): boolean {
  return statuses.some((status) => status.id === id);
}

export interface AttackResolution {
  readonly outcome: AttackOutcome;
  readonly damage: number;
  readonly powerVariation: number;
  readonly rngState: number;
}

function attackAccuracy(attacker: HeroCombatant | EnemyCombatant): number {
  return 'attackAccuracy' in attacker && attacker.attackAccuracy !== undefined
    ? attacker.attackAccuracy
    : 'role' in attacker ? 91 : Math.max(4, Math.min(95, 82 + attacker.cunning));
}

function critChance(attacker: HeroCombatant | EnemyCombatant): number {
  return 'criticalChance' in attacker && attacker.criticalChance !== undefined
    ? attacker.criticalChance
    : 'role' in attacker ? 9 : Math.max(0, Math.min(30, 8 + attacker.cunning));
}

export function resolveAttack(input: {
  readonly rngState: number;
  readonly attacker: HeroCombatant | EnemyCombatant;
  readonly target: HeroCombatant | EnemyCombatant;
  readonly power: number;
  readonly kind: 'physical' | 'sorcery';
  readonly missedAttacks?: number;
  readonly varyPower?: boolean;
}): AttackResolution {
  const rng: SeededRng = createRng(input.rngState);
  const accuracyRoll = rng.int(1, 100);
  const targetEnemy = 'role' in input.target ? input.target : null;
  const attackerHero = !('role' in input.attacker);
  const blind = attackerHero && hasStatus(input.attacker.statuses, 'blind');
  const forcedGlance = attackerHero && !blind && (input.missedAttacks ?? 0) >= 2;
  const variation = input.varyPower === false ? 1 : rng.int(88, 115) / 100;

  let outcome: AttackOutcome;
  if (!forcedGlance && (blind || accuracyRoll > attackAccuracy(input.attacker))) outcome = 'miss';
  else if (targetEnemy?.parryChance && rng.int(1, 100) <= targetEnemy.parryChance) outcome = 'parried';
  else if (targetEnemy?.guarding && targetEnemy.blockChance > 0 && rng.int(1, 100) <= targetEnemy.blockChance) outcome = 'blocked';
  else if (forcedGlance || (targetEnemy?.evasion ?? 0) > 0 && rng.int(1, 100) <= (targetEnemy?.evasion ?? 0)) outcome = 'glancing';
  else if (rng.int(1, 100) <= critChance(input.attacker)) outcome = 'critical';
  else outcome = 'hit';

  const modifiedPower = input.power * variation * (outcome === 'critical' ? 1.75 : outcome === 'glancing' ? 0.5 : 1);
  const damage = outcome === 'miss' || outcome === 'parried'
    ? 0
    : calculateDamage({ power: modifiedPower, kind: input.kind, armor: input.target.armor, ward: input.target.ward, guarding: input.target.guarding });
  return { outcome, damage, powerVariation: variation, rngState: rng.state };
}
