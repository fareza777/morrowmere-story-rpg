import { describe, expect, it } from 'vitest';
import { createEncounter, resolveCombatTurn, type HeroCombatant } from '../src/game/combat';
import type { CompanionCombatSnapshot } from '../src/game/companions';
import type { EncounterDefinition } from '../src/game/content/schema';
import type { EnemyId, EncounterId } from '../src/game/domain/ids';
import { applyInventoryCommand, type InventoryState } from '../src/game/inventory';
import { CHAPTER_LEVEL_CAPS, REPEAT_COMBAT_XP, deriveHeroStats, grantExperience } from '../src/game/progression';
import type { HeroClass } from '../src/game/types';

const chapters = [['ch01', 2], ['ch04', 8], ['ch08', 15]] as const;
const classes: readonly HeroClass[] = ['warrior', 'mage', 'warden'];
const emptyInventory = (): InventoryState => ({ pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] } });
const companion: CompanionCombatSnapshot = { companionId: 'mara' as never, loyaltyTier: 'respectful', questStage: 3, injured: false, attack: 1, guard: 1, will: 0, actionId: 'covering-shot' };

function simulate(heroClass: HeroClass, level: number, seed: number, withCompanion: boolean) {
  const inventory = emptyInventory();
  const stats = deriveHeroStats({ heroClass, level, xp: 10_000, talents: [] }, inventory, new Map());
  const hero: HeroCombatant = {
    class: heroClass, name: 'Balance Hero', level, xp: 10_000, health: stats.maxHealth, maxHealth: stats.maxHealth,
    focus: stats.maxFocus, maxFocus: stats.maxFocus, strength: stats.strength, cunning: stats.cunning, will: stats.will,
    armor: stats.armor, ward: stats.ward, attackBonus: Math.max(0, stats.attack - stats.strength), guarding: false,
    statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
  };
  const enemyHealth = 12 + level * 2;
  const enemy = (id: string) => ({
    id, archetypeId: id, name: id, rank: 1, level, species: 'goblin' as const, region: 'gloamwood' as const,
    maxHealth: enemyHealth, attack: Math.max(1, Math.floor(level / 2)), armor: Math.floor(level / 4), ward: 0,
    intentWeights: { strike: 1 as const }, traits: [], rewardTags: [], description: id, artFamily: 'goblin',
  });
  const enemyIds = ['front', 'rear'].map((id) => `${id}-${level}` as EnemyId);
  const encounter: EncounterDefinition = {
    id: `balance-${heroClass}-${level}` as EncounterId, family: 'balance', kind: 'regular', enemyIds,
    reward: { xp: 10, gold: 2, itemChoices: [] },
  };
  const enemies = new Map(enemyIds.map((id) => [id, enemy(id)]));
  let combat = createEncounter(hero, encounter, { enemies }, seed, undefined, withCompanion ? companion : null);
  let pack = inventory;
  const trace: unknown[] = [];
  let heroDamage = 0;
  const expectedBudget = withCompanion ? Math.min(Math.floor(enemyHealth * 2 * 0.15), 7 + Math.floor(level * 1.5)) : 0;
  expect(combat.companionSupportBudget).toBe(expectedBudget);

  if (withCompanion) {
    const called = resolveCombatTurn(combat, { type: 'companion', targetId: combat.enemies[0]!.id }, pack, { items: new Map() });
    trace.push(called.events);
    combat = called.combat;
    pack = called.inventory;
    const rejected = resolveCombatTurn(combat, { type: 'companion', targetId: combat.enemies[0]!.id }, pack, { items: new Map() });
    expect(rejected.combat).toBe(combat);
  }
  for (let turn = 0; turn < 10 && combat.outcome === 'active'; turn += 1) {
    const result = resolveCombatTurn(combat, { type: 'attack' }, pack, { items: new Map() });
    for (const event of result.events) {
      if (event.type === 'attack_resolved' && event.attackerId === 'hero') heroDamage += event.damage;
    }
    trace.push(result.events, { turn: result.combat.turn, rng: result.combat.rngState, hp: result.combat.player.health, enemies: result.combat.enemies.map((entry) => entry.health) });
    combat = result.combat;
    pack = result.inventory;
    expect([combat.player.health, combat.player.focus, combat.rngState, ...combat.enemies.flatMap((entry) => [entry.health, entry.attack, entry.armor, entry.ward])].every(Number.isFinite)).toBe(true);
    expect(combat.player.health).toBeGreaterThanOrEqual(0);
    expect(combat.player.health).toBeLessThanOrEqual(combat.player.maxHealth);
  }
  expect(combat.outcome).toBe('victory');
  expect(combat.player.health).toBeGreaterThan(0);
  expect(heroDamage).toBeGreaterThan(0);
  expect(combat.companionDamageDealt).toBeLessThanOrEqual(expectedBudget);
  if (withCompanion) expect(combat.companionDamageDealt).toBeLessThan(heroDamage * 0.18);
  return trace;
}

describe('focused Chronicle I balance smoke', () => {
  it('runs exactly 144 deterministic class/chapter/companion/seed scenarios', () => {
    let scenarios = 0;
    for (const heroClass of classes) for (const [, level] of chapters) for (const active of [false, true]) for (let seed = 0; seed < 8; seed += 1) {
      const trace = simulate(heroClass, level, seed, active);
      expect(trace.length).toBeGreaterThan(0);
      scenarios += 1;
    }
    expect(scenarios).toBe(144);
  });

  it('locks exact chapter caps and combat-family repeat XP without diminishing story XP', () => {
    expect(CHAPTER_LEVEL_CAPS).toEqual({ ch01: 2, ch02: 4, ch03: 6, ch04: 8, ch05: 10, ch06: 12, ch07: 14, ch08: 15 });
    expect(REPEAT_COMBAT_XP).toEqual([1, 0.5, 0.25, 0.1, 0]);
    const hero = { heroClass: 'warrior' as const, level: 1, xp: 0, talents: [] };
    expect(Array.from({ length: 6 }, (_, victories) => {
      const result = grantExperience(hero, { amount: 100, chapterId: 'ch08', source: 'combat', priorEncounterVictories: victories });
      return result.ok ? result.value.grantedXp : -1;
    })).toEqual([100, 50, 25, 10, 0, 0]);
    const story = grantExperience(hero, { amount: 100, chapterId: 'ch08', source: 'story', priorEncounterVictories: 99 });
    expect(story.ok && story.value.grantedXp).toBe(100);
  });

  it('enforces real consumable stack caps', () => {
    const items = new Map([['tonic' as never, { id: 'tonic', name: 'Tonic', category: 'potion' as const, description: 'Tonic.', allowedClasses: classes, stats: { health: 8 }, value: 1, tags: ['healing'] }]]);
    const first = applyInventoryCommand(emptyInventory(), { type: 'add', itemId: 'tonic' as never, quantity: 3 }, items);
    expect(first.ok).toBe(true);
    const overflow = applyInventoryCommand(first.ok ? first.value : emptyInventory(), { type: 'add', itemId: 'tonic' as never }, items);
    expect(overflow.ok).toBe(false);
    expect(overflow.ok ? null : overflow.error.code).toBe('stack_limit');
  });
});
