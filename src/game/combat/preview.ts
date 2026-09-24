import type { AttackOutcome } from '../domain/combat';
import type { EnemyIntent } from '../types';
import { attackAccuracy, calculateDamage, critChance, hasStatus } from './attack';
import type { EnemyCombatant, HeroCombatant } from './types';

export interface AttackPreview {
  /** Effective accuracy before target parry/block/evasion, including blind and miss-streak rules. */
  readonly accuracyChance: number;
  /** Chance that this action produces any nonzero damage after all defensive checks. */
  readonly chanceToDamage: number;
  /** Absolute per-action probability of the critical outcome, not the conditional crit stat. */
  readonly criticalChance: number;
  readonly outcomeChances: Readonly<Record<AttackOutcome, number>>;
  readonly damageRange: { readonly min: number; readonly max: number };
}

interface PreviewAttackInput {
  readonly attacker: HeroCombatant | EnemyCombatant;
  readonly target: HeroCombatant | EnemyCombatant;
  readonly power: number;
  readonly kind: 'physical' | 'sorcery';
  readonly missedAttacks?: number;
  readonly ignoreGuard?: boolean;
}

const OUTCOMES: readonly AttackOutcome[] = ['miss', 'glancing', 'hit', 'critical', 'blocked', 'parried'];
const MIN_POWER_VARIATION = 0.88;
const MAX_POWER_VARIATION = 1.15;

/** Probability that an integer roll from 1 through 100 is less than or equal to a chance value. */
function rollAtOrBelow(chance: number): number {
  if (Number.isNaN(chance)) return 0;
  return Math.max(0, Math.min(100, Math.floor(chance))) / 100;
}

/** Probability that an integer roll from 1 through 100 does not exceed an accuracy threshold. */
function passAccuracy(accuracy: number): number {
  if (Number.isNaN(accuracy)) return 1;
  return Math.max(0, Math.min(100, Math.floor(accuracy))) / 100;
}

/**
 * Forecast the resolver's mutually exclusive attack outcomes without creating or advancing RNG.
 * The percentages reflect its integer 1..100 rolls, including fractional downstream products.
 */
export function previewAttack(input: PreviewAttackInput): AttackPreview {
  const targetEnemy = 'role' in input.target ? input.target : null;
  const attackerHero = !('role' in input.attacker);
  const blind = attackerHero && hasStatus(input.attacker.statuses, 'blind');
  const forcedGlance = attackerHero && !blind && (input.missedAttacks ?? 0) >= 2;
  const accuracyProbability = blind ? 0 : forcedGlance ? 1 : passAccuracy(attackAccuracy(input.attacker));
  const accuracyChance = accuracyProbability * 100;

  const chances: Record<AttackOutcome, number> = {
    miss: 1 - accuracyProbability,
    glancing: 0,
    hit: 0,
    critical: 0,
    blocked: 0,
    parried: 0,
  };

  let remaining = accuracyProbability;
  const parryProbability = targetEnemy?.parryChance ? rollAtOrBelow(targetEnemy.parryChance) : 0;
  chances.parried = remaining * parryProbability;
  remaining *= 1 - parryProbability;

  const blockProbability = targetEnemy?.guarding && targetEnemy.blockChance > 0
    ? rollAtOrBelow(targetEnemy.blockChance)
    : 0;
  chances.blocked = remaining * blockProbability;
  remaining *= 1 - blockProbability;

  const evasionProbability = forcedGlance
    ? 1
    : targetEnemy && targetEnemy.evasion > 0
      ? rollAtOrBelow(targetEnemy.evasion)
      : 0;
  chances.glancing = remaining * evasionProbability;
  remaining *= 1 - evasionProbability;

  const conditionalCrit = rollAtOrBelow(critChance(input.attacker));
  chances.critical = remaining * conditionalCrit;
  chances.hit = remaining * (1 - conditionalCrit);

  const outcomeChances = Object.fromEntries(OUTCOMES.map((outcome) => [outcome, chances[outcome] * 100])) as Record<AttackOutcome, number>;
  const chanceToDamage = (1 - chances.miss - chances.parried) * 100;
  let minDamage = Number.POSITIVE_INFINITY;
  let maxDamage = 0;
  const guarded = input.target.guarding && !input.ignoreGuard;

  for (const outcome of OUTCOMES) {
    if (chances[outcome] <= 0 || outcome === 'miss' || outcome === 'parried') continue;
    const outcomeMultiplier = outcome === 'critical' ? 1.75 : outcome === 'glancing' ? 0.5 : 1;
    const baseDamageInput = {
      kind: input.kind,
      armor: input.target.armor,
      ward: input.target.ward,
      guarding: guarded,
    } as const;
    minDamage = Math.min(minDamage, calculateDamage({ ...baseDamageInput, power: input.power * MIN_POWER_VARIATION * outcomeMultiplier }));
    maxDamage = Math.max(maxDamage, calculateDamage({ ...baseDamageInput, power: input.power * MAX_POWER_VARIATION * outcomeMultiplier }));
  }

  return {
    accuracyChance,
    chanceToDamage,
    criticalChance: outcomeChances.critical,
    outcomeChances,
    damageRange: minDamage === Number.POSITIVE_INFINITY ? { min: 0, max: 0 } : { min: minDamage, max: maxDamage },
  };
}

export function heroAttackProfile(
  player: HeroCombatant,
  action: { readonly type: 'attack' } | { readonly type: 'technique'; readonly techniqueId: string },
): { readonly power: number; readonly kind: 'physical' | 'sorcery' } {
  if (action.type === 'attack') return { power: player.strength + player.attackBonus + 4, kind: 'physical' };
  const kind = player.class === 'mage' || action.techniqueId === 'witchfire' ? 'sorcery' : 'physical';
  return { power: kind === 'sorcery' ? player.will + 7 : player.strength + player.cunning + 3, kind };
}

export function enemyAttackProfile(
  enemy: EnemyCombatant,
  intent: EnemyIntent,
): { readonly power: number; readonly kind: 'physical' | 'sorcery'; readonly ignoreGuard: boolean } | null {
  if (intent === 'guard' || intent === 'recover' || (intent === 'flee' && !enemy.isBoss)) return null;
  const rolePower = enemy.role === 'assassin' ? 2 : enemy.role === 'archer' ? 1 : 0;
  return {
    power: enemy.attack + rolePower + (intent === 'heavy' ? 4 : intent === 'hex' ? 2 : 0),
    kind: intent === 'hex' ? 'sorcery' : 'physical',
    ignoreGuard: enemy.role === 'archer',
  };
}
