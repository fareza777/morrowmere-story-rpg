import { deepFreeze } from '../builders';
import { CHRONICLE1_BOSSES } from './bosses';
import { CHRONICLE1_RANKED_ENEMIES } from './ranked';

export { CHRONICLE1_ARCHETYPES, ENEMY_PORTRAIT_IDS } from './archetypes';
export { BOSS_IDS, BOSS_PORTRAIT_IDS, CHRONICLE1_BOSSES } from './bosses';
export {
  CHAPTER_THREAT_BUDGETS,
  CHRONICLE1_ENCOUNTERS,
  validateEncounterGroups,
} from './encounters';
export { CHRONICLE1_RANKED_ENEMIES } from './ranked';
export type {
  BossAntiCheeseRule,
  BossPhaseDefinition,
  ChapterThreatBudget,
  Chronicle1BossDefinition,
  Chronicle1EncounterDefinition,
  Chronicle1EnemyArchetype,
  Chronicle1EnemyDefinition,
  EncounterValidationIssue,
  EncounterValidationIssueCode,
  EnemyCompatibilityTag,
  EnemyStatusId,
  EnemyStatusInteraction,
} from './types';

export const CHRONICLE1_ENEMIES = deepFreeze([
  ...CHRONICLE1_RANKED_ENEMIES,
  ...CHRONICLE1_BOSSES,
]);
