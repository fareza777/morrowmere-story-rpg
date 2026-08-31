import { createRng } from '../rng';
import type { EnemyIntent } from '../types';
import type { EnemyCombatant, EnemyIntentView, EnemyRole } from './types';

const INTENT_COPY: Record<EnemyIntent, string> = {
  strike: 'The enemy measures the distance for a direct strike.',
  heavy: 'The enemy commits its weight to a crushing attack.',
  guard: 'The enemy settles behind a guarded stance.',
  hex: 'The enemy gathers a cold knot of hostile sorcery.',
  recover: 'The enemy searches for a breath in which to recover.',
  flee: 'The enemy glances toward the nearest open road.',
};

export function roleForEnemy(enemy: { readonly species: string; readonly traits: readonly string[] }): EnemyRole {
  const trait = enemy.traits.join(' ').toLowerCase();
  // The shipped catalog uses evocative trait names rather than role labels.
  // Keep this mapping explicit so content changes do not silently flatten roles.
  if (trait.includes('shield wall') || trait.includes('unliving plate') || trait.includes('chitinous')) return 'defender';
  if (trait.includes('quick hands') || trait.includes('executioner') || trait.includes('pack hunter') || trait.includes('incorporeal')) return 'assassin';
  if (trait.includes('cinder flask') || trait.includes('stone wings')) return 'archer';
  if (trait.includes('witchfire')) return 'shaman';
  if (trait.includes('drowning word') || trait.includes('pain litany') || trait.includes('toll of ruin')) return 'controller';
  if (trait.includes('ancestor smoke') || trait.includes('hellkindled')) return 'summoner';
  if (trait.includes('deathless drill') || trait.includes('royal malice')) return 'commander';
  if (trait.includes('regeneration') || trait.includes('molten blood')) return 'specialist';
  if (trait.includes('defender') || trait.includes('shield') || trait.includes('plate')) return 'defender';
  if (trait.includes('archer') || trait.includes('ranged')) return 'archer';
  if (trait.includes('summon')) return 'summoner';
  if (trait.includes('command')) return 'commander';
  if (trait.includes('control') || trait.includes('curse')) return 'controller';
  if (enemy.species === 'mage') return 'shaman';
  if (enemy.species === 'beast') return 'assassin';
  return 'specialist';
}

export function chooseEnemyIntent(enemy: EnemyCombatant, seed: number): { readonly view: EnemyIntentView; readonly rngState: number } {
  const rng = createRng(seed);
  const weighted = Object.entries(enemy.intentWeights).flatMap(([intent, weight]) =>
    Array.from({ length: Math.max(0, weight ?? 0) }, () => intent as EnemyIntent),
  );
  const allowed = weighted.filter((intent) => intent !== 'flee' || (!enemy.isBoss && enemy.health <= enemy.maxHealth / 3));
  const intent = rng.pick(allowed.length > 0 ? allowed : ['strike' as EnemyIntent]) as EnemyIntent;
  return { view: { enemyId: enemy.id, intent, text: INTENT_COPY[intent] }, rngState: rng.state };
}

export function chooseEnemyIntents(enemies: readonly EnemyCombatant[], seed: number): { readonly intents: readonly EnemyIntentView[]; readonly rngState: number } {
  return enemies.filter((enemy) => enemy.health > 0).reduce((result, enemy) => {
    const chosen = chooseEnemyIntent(enemy, result.rngState);
    return { intents: [...result.intents, chosen.view], rngState: chosen.rngState };
  }, { intents: [] as readonly EnemyIntentView[], rngState: seed });
}
