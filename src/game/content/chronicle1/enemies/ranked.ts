import { ENEMIES } from '../../enemies';
import { deepFreeze } from '../builders';
import { CHRONICLE1_ARCHETYPES } from './archetypes';
import type { Chronicle1EnemyDefinition } from './types';

const ARCHETYPE_INDEX = new Map(CHRONICLE1_ARCHETYPES.map((entry) => [entry.id, entry] as const));

const ROLE_THREAT = {
  defender: 1,
  assassin: 1,
  archer: 1,
  shaman: 2,
  controller: 2,
  summoner: 2,
  commander: 2,
  specialist: 1,
} as const;

function portraitIndex(rank: number): 0 | 1 | 2 | 3 {
  if (rank <= 2) return 0;
  if (rank <= 5) return 1;
  if (rank <= 8) return 2;
  return 3;
}

export const CHRONICLE1_RANKED_ENEMIES = deepFreeze(
  ENEMIES.map((enemy): Chronicle1EnemyDefinition => {
    const archetype = ARCHETYPE_INDEX.get(enemy.archetypeId);
    if (!archetype) throw new Error(`Missing Chronicle I archetype metadata for ${enemy.archetypeId}.`);
    const compatibilityTags = enemy.rank >= 7 && !archetype.compatibilityTags.includes('elite')
      ? [...archetype.compatibilityTags, 'elite' as const]
      : archetype.compatibilityTags;

    return {
      ...enemy,
      portraitId: archetype.portraitIds[portraitIndex(enemy.rank)],
      eligibleRegions: archetype.eligibleRegions,
      role: archetype.role,
      compatibilityTags,
      incompatibleTags: archetype.incompatibleTags,
      statusInteractions: archetype.statusInteractions,
      battlefieldRule: archetype.battlefieldRule,
      threatCost: 1 + Math.ceil(enemy.rank / 2) + ROLE_THREAT[archetype.role] + (archetype.threatCostModifier ?? 0),
      description: `${enemy.description} In battle, ${archetype.battlefieldRule}`,
    };
  }),
);
