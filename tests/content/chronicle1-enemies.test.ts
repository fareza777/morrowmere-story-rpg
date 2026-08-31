import { describe, expect, it } from 'vitest';

import { roleForEnemy } from '../../src/game/combat/enemy-ai';
import { CHRONICLE1_SCENES } from '../../src/game/content/chronicle1';
import {
  BOSS_IDS,
  BOSS_PORTRAIT_IDS,
  CHAPTER_THREAT_BUDGETS,
  CHRONICLE1_ARCHETYPES,
  CHRONICLE1_BOSSES,
  CHRONICLE1_ENCOUNTERS,
  CHRONICLE1_ENEMIES,
  CHRONICLE1_RANKED_ENEMIES,
  ENEMY_PORTRAIT_IDS,
  validateEncounterGroups,
  type Chronicle1EncounterDefinition,
} from '../../src/game/content/chronicle1/enemies';

const EXPECTED_BOSS_IDS = [
  'boss-rattlehook-bridge-chief',
  'boss-captain-oren-dusk',
  'boss-black-banner-gatebreaker',
  'boss-osra-mire-witch',
  'boss-harrow-ferry-reaver',
  'boss-redwater-provocateur',
  'boss-kargan-war-chief',
  'boss-embervault-forgemaster',
  'boss-royal-armory-golem',
  'boss-siege-engineer-malrec',
  'boss-black-banner-commander',
  'boss-crownless-gate-warden',
  'boss-voss-champion-elian-roake',
  'boss-marshal-severin-voss',
  'boss-coronation-engine',
] as const;

const EXPECTED_ROLES = [
  'archer',
  'assassin',
  'commander',
  'controller',
  'defender',
  'shaman',
  'specialist',
  'summoner',
] as const;

function issueCodes(
  encounters: readonly Chronicle1EncounterDefinition[],
  enemies = CHRONICLE1_ENEMIES,
) {
  return validateEncounterGroups(encounters, enemies).map((issue) => issue.code);
}

describe('Chronicle I enemy catalog', () => {
  it('retains twenty tactical archetypes across ten mechanically ranked entries each', () => {
    expect(CHRONICLE1_ARCHETYPES).toHaveLength(20);
    expect(CHRONICLE1_RANKED_ENEMIES).toHaveLength(200);
    expect(new Set(CHRONICLE1_RANKED_ENEMIES.map((enemy) => enemy.id)).size).toBe(200);
    expect([...new Set(CHRONICLE1_RANKED_ENEMIES.map((enemy) => enemy.role))].sort()).toEqual(EXPECTED_ROLES);

    for (const archetype of CHRONICLE1_ARCHETYPES) {
      const ranks = CHRONICLE1_RANKED_ENEMIES.filter((enemy) => enemy.archetypeId === archetype.id);
      expect(ranks.map((enemy) => enemy.rank), archetype.id).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(new Set(ranks.map((enemy) => enemy.id)).size, archetype.id).toBe(10);
      expect(archetype.compatibilityTags.length, archetype.id).toBeGreaterThan(0);
      expect(archetype.statusInteractions.length, archetype.id).toBeGreaterThan(0);
      expect(archetype.eligibleRegions, archetype.id).toContain(archetype.region);
    }

    for (const enemy of CHRONICLE1_RANKED_ENEMIES) {
      expect(roleForEnemy(enemy), enemy.id).toBe(enemy.role);
      expect(enemy.threatCost, enemy.id).toBeGreaterThan(0);
      expect(enemy.compatibilityTags.length, enemy.id).toBeGreaterThan(0);
      expect(enemy.statusInteractions.length, enemy.id).toBeGreaterThan(0);
      expect(enemy.description.length, enemy.id).toBeGreaterThan(55);
      expect(enemy.eligibleRegions, enemy.id).toContain(enemy.region);
      expect(Object.isFrozen(enemy), enemy.id).toBe(true);
    }
  });

  it('maps rank bands to exactly four portraits per archetype and eighty portraits overall', () => {
    expect(ENEMY_PORTRAIT_IDS).toHaveLength(80);
    expect(new Set(ENEMY_PORTRAIT_IDS).size).toBe(80);

    for (const archetype of CHRONICLE1_ARCHETYPES) {
      const ranks = CHRONICLE1_RANKED_ENEMIES.filter((enemy) => enemy.archetypeId === archetype.id);
      const portraits = ranks.map((enemy) => enemy.portraitId);
      expect(new Set(portraits).size, archetype.id).toBe(4);
      expect(portraits.slice(0, 2), archetype.id).toEqual([portraits[0], portraits[0]]);
      expect(portraits.slice(2, 5), archetype.id).toEqual([portraits[2], portraits[2], portraits[2]]);
      expect(portraits.slice(5, 8), archetype.id).toEqual([portraits[5], portraits[5], portraits[5]]);
      expect(portraits.slice(8, 10), archetype.id).toEqual([portraits[8], portraits[8]]);
      expect(portraits.every((portraitId) => ENEMY_PORTRAIT_IDS.includes(portraitId))).toBe(true);
    }
  });

  it('authors the exact fifteen bosses with readable phases, reactions, and dedicated portraits', () => {
    expect(BOSS_IDS).toEqual(EXPECTED_BOSS_IDS);
    expect(CHRONICLE1_BOSSES).toHaveLength(15);
    expect(BOSS_PORTRAIT_IDS).toHaveLength(15);
    expect(new Set(BOSS_PORTRAIT_IDS).size).toBe(15);
    expect(CHRONICLE1_ENEMIES).toHaveLength(215);
    expect(new Set(CHRONICLE1_ENEMIES.map((enemy) => enemy.id)).size).toBe(215);

    for (const boss of CHRONICLE1_BOSSES) {
      expect(boss.isBoss, boss.id).toBe(true);
      expect(boss.phases.length, boss.id).toBeGreaterThanOrEqual(2);
      expect(boss.phases[0]?.startsAtHealthPercent, boss.id).toBe(100);
      expect(boss.phases.map((phase) => phase.startsAtHealthPercent), boss.id).toEqual(
        [...boss.phases.map((phase) => phase.startsAtHealthPercent)].sort((left, right) => right - left),
      );
      expect(boss.phases.every((phase) => phase.telegraph.length >= 25), boss.id).toBe(true);
      expect(boss.phases.every((phase) => phase.counterplay.length >= 25), boss.id).toBe(true);
      expect(boss.antiCheese.trigger.length, boss.id).toBeGreaterThanOrEqual(20);
      expect(boss.antiCheese.response.length, boss.id).toBeGreaterThanOrEqual(20);
      expect(boss.antiCheese.counterplay.length, boss.id).toBeGreaterThanOrEqual(20);
      expect(BOSS_PORTRAIT_IDS).toContain(boss.portraitId);
      expect(ENEMY_PORTRAIT_IDS).not.toContain(boss.portraitId);
      expect(roleForEnemy(boss), boss.id).toBe(boss.role);
    }
  });
});

describe('Chronicle I encounter catalog', () => {
  it('maps exactly one definition to each of the forty-eight authored combat scenes', () => {
    const combatScenes = CHRONICLE1_SCENES.filter((scene) => scene.type === 'combat');
    const sceneEncounterIds = combatScenes.map((scene) => scene.encounterId).sort();

    expect(combatScenes).toHaveLength(48);
    expect(new Set(sceneEncounterIds).size).toBe(48);
    expect(CHRONICLE1_ENCOUNTERS).toHaveLength(48);
    expect(CHRONICLE1_ENCOUNTERS.map((encounter) => encounter.id).sort()).toEqual(sceneEncounterIds);
  });

  it('uses every unique boss once and stays inside authored chapter threat ceilings', () => {
    const usedBosses = CHRONICLE1_ENCOUNTERS.flatMap((encounter) => encounter.enemyIds)
      .filter((enemyId) => (BOSS_IDS as readonly string[]).includes(enemyId))
      .sort();
    expect(usedBosses).toEqual([...BOSS_IDS].sort());

    for (const encounter of CHRONICLE1_ENCOUNTERS) {
      const ceiling = CHAPTER_THREAT_BUDGETS[encounter.chapterId];
      expect(encounter.threatBudget, encounter.id).toBeLessThanOrEqual(ceiling.maxThreat);
      expect(encounter.openingDamageCap, encounter.id).toBe(ceiling.maxOpeningDamage);
      expect(encounter.counterplay.length, encounter.id).toBeGreaterThanOrEqual(35);
      expect(encounter.reward.xp, encounter.id).toBeGreaterThan(0);
      expect(encounter.reward.gold, encounter.id).toBeGreaterThan(0);
      expect(Object.isFrozen(encounter.enemyIds), encounter.id).toBe(true);
    }
  });

  it('accepts every shipped group without missing enemies, lethal openings, or control locks', () => {
    expect(validateEncounterGroups(CHRONICLE1_ENCOUNTERS, CHRONICLE1_ENEMIES)).toEqual([]);
  });

  it('rejects missing enemies, overspent budgets, duplicate bosses, lethal openings, and control loops', () => {
    const regular = CHRONICLE1_ENCOUNTERS.find((encounter) => encounter.kind === 'regular')!;
    const boss = CHRONICLE1_ENCOUNTERS.find((encounter) => encounter.kind === 'boss')!;
    const controllerIds = CHRONICLE1_RANKED_ENEMIES
      .filter((enemy) => enemy.role === 'controller')
      .slice(0, 2)
      .map((enemy) => enemy.id);

    expect(issueCodes([{ ...regular, id: 'enc-test-missing-enemy' as never, enemyIds: ['enemy-does-not-exist' as never] }])).toContain('missing_enemy');
    expect(issueCodes([{ ...regular, id: 'enc-test-budget' as never, threatBudget: 1 }])).toContain('threat_budget_exceeded');
    expect(issueCodes([{ ...boss, id: 'enc-test-duplicate-boss' as never, enemyIds: [boss.bossEnemyId!, boss.bossEnemyId!] }])).toContain('duplicate_unique_boss');
    expect(issueCodes([{ ...regular, id: 'enc-test-control-loop' as never, enemyIds: controllerIds as never }])).toContain('permanent_control_loop');

    const firstEnemyId = regular.enemyIds[0]!;
    const dangerousEnemies = CHRONICLE1_ENEMIES.map((enemy) => (
      enemy.id === firstEnemyId ? { ...enemy, attack: regular.openingDamageCap + 100 } : enemy
    ));
    expect(issueCodes([{ ...regular, id: 'enc-test-lethal-opening' as never }], dangerousEnemies)).toContain('unsafe_opening_damage');
  });
});
