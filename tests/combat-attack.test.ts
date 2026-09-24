import { describe, expect, it } from 'vitest';
import { resolveCombatTurn, type CombatState } from '../src/game/combat';
import { calculateDamage } from '../src/game/combat/attack';
import { enemyAttackProfile, heroAttackProfile, previewAttack } from '../src/game/combat/preview';
import type { EnemyCombatant, HeroCombatant } from '../src/game/combat/types';
import type { InventoryState } from '../src/game/inventory';

const emptyInventory = (): InventoryState => ({
  pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
});

function combatFixtureForOutcome(outcome: 'miss' | 'glancing' | 'hit' | 'critical' | 'blocked' | 'parried'): CombatState {
  const player = {
    class: 'warrior' as const, name: 'Tester', level: 1, xp: 0, health: 40, maxHealth: 40,
    focus: 8, maxFocus: 8, strength: 8, cunning: 4, will: 3, armor: 3, ward: 1,
    attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
    attackAccuracy: outcome === 'miss' ? 0 : 100,
    criticalChance: outcome === 'critical' ? 100 : 0,
  };
  const enemy = {
    id: 'enemy-1', archetypeId: 'fixture', name: 'Training Foe', rank: 1, level: 1,
    species: 'human' as const, region: 'gloamwood' as const, maxHealth: 100, health: 100,
    attack: 0, armor: 0, ward: 0, intentWeights: { guard: 1 }, traits: [], rewardTags: [], description: '', artFamily: '',
    guarding: outcome === 'blocked', isBoss: false, statuses: [], role: 'defender' as const,
    evasion: outcome === 'glancing' ? 100 : 0,
    blockChance: outcome === 'blocked' ? 100 : 0,
    parryChance: outcome === 'parried' ? 100 : 0,
    phase: 1,
  };
  return {
    turn: 1, rngState: 42, player, enemies: [enemy], enemy, enemyIntent: 'guard',
    enemyIntents: [{ enemyId: 'enemy-1', intent: 'guard', text: 'The foe braces.' }],
    intentText: 'The foe braces.', outcome: 'active', log: [], missedAttacks: 0,
    companion: null, companionCooldown: 0, companionDamageDealt: 0, companionSupportBudget: 0,
  };
}

function previewHero(overrides: Partial<HeroCombatant> = {}): HeroCombatant {
  return {
    class: 'warrior', name: 'Preview Hero', level: 1, xp: 0, health: 40, maxHealth: 40,
    focus: 8, maxFocus: 8, strength: 8, cunning: 4, will: 3, armor: 3, ward: 1,
    attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
    ...overrides,
  };
}

function previewEnemy(overrides: Partial<EnemyCombatant> = {}): EnemyCombatant {
  return {
    id: 'preview-enemy', archetypeId: 'fixture', name: 'Preview Foe', rank: 1, level: 1,
    species: 'human', region: 'gloamwood', maxHealth: 40, health: 40, attack: 6, armor: 0, ward: 0,
    intentWeights: { strike: 1 }, traits: [], rewardTags: [], description: '', artFamily: '',
    guarding: false, isBoss: false, statuses: [], role: 'defender', evasion: 0, blockChance: 0,
    parryChance: 0, phase: 1,
    ...overrides,
  };
}

describe('deterministic attack outcomes', () => {
  it.each(['miss', 'glancing', 'hit', 'critical', 'blocked', 'parried'] as const)(
    'serializes the %s attack outcome',
    (expected) => {
      const result = resolveCombatTurn(combatFixtureForOutcome(expected), { type: 'attack', targetId: 'enemy-1' }, emptyInventory(), { items: new Map() });

      expect(result.events).toContainEqual(expect.objectContaining({ type: 'attack_resolved', outcome: expected }));
    },
  );

  it('turns the third ordinary miss into a glancing hit unless the hero is blind', () => {
    const state = { ...combatFixtureForOutcome('miss'), missedAttacks: 2 };
    const result = resolveCombatTurn(state, { type: 'attack', targetId: 'enemy-1' }, emptyInventory(), { items: new Map() });

    expect(result.events).toContainEqual(expect.objectContaining({ type: 'attack_resolved', outcome: 'glancing' }));
    expect(result.combat.missedAttacks).toBe(0);
  });

  it('uses bounded saved power variation for every damaging strike', () => {
    const result = resolveCombatTurn(combatFixtureForOutcome('hit'), { type: 'attack', targetId: 'enemy-1' }, emptyInventory(), { items: new Map() });
    const event = result.events.find((candidate) => candidate.type === 'attack_resolved');

    expect(event && event.powerVariation).toBeGreaterThanOrEqual(0.88);
    expect(event && event.powerVariation).toBeLessThanOrEqual(1.15);
    expect(result.combat.rngState).not.toBe(42);
  });

  it('uses bounded saved power variation for enemy attacks too', () => {
    const combat = combatFixtureForOutcome('hit');
    const state: CombatState = {
      ...combat,
      rngState: 7,
      enemyIntent: 'strike',
      enemy: { ...combat.enemy, attack: 12 },
      enemyIntents: [{ enemyId: 'enemy-1', intent: 'strike', text: 'The foe attacks.' }],
    };
    const result = resolveCombatTurn(state, { type: 'guard' }, emptyInventory(), { items: new Map() });
    const event = result.events.find((candidate) => candidate.type === 'attack_resolved' && candidate.attackerId === 'enemy-1');

    expect(event?.type).toBe('attack_resolved');
    if (!event || event.type !== 'attack_resolved') throw new Error('Expected the enemy attack event.');
    expect(event.powerVariation).toBeGreaterThanOrEqual(0.88);
    expect(event.powerVariation).toBeLessThanOrEqual(1.15);
    expect(event.powerVariation).not.toBe(1);
  });
});

describe('pure attack previews', () => {
  it('reports a certain hit at 100% accuracy and matches physical damage variation bounds', () => {
    const attacker = previewHero({ attackAccuracy: 100, criticalChance: 0 });
    const target = previewEnemy({ armor: 4 });
    const preview = previewAttack({ attacker, target, power: 19, kind: 'physical' });

    expect(preview.accuracyChance).toBe(100);
    expect(preview.outcomeChances).toEqual({ miss: 0, glancing: 0, hit: 100, critical: 0, blocked: 0, parried: 0 });
    expect(preview.chanceToDamage).toBe(100);
    expect(preview.damageRange).toEqual({
      min: calculateDamage({ power: 19 * 0.88, kind: 'physical', armor: 4, ward: 0 }),
      max: calculateDamage({ power: 19 * 1.15, kind: 'physical', armor: 4, ward: 0 }),
    });
  });

  it('reports blindness as a guaranteed miss even when the hero has a miss-streak', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 100, statuses: [{ id: 'blind', label: 'Blind', duration: 1, potency: 1 }] }),
      target: previewEnemy(), power: 12, kind: 'physical', missedAttacks: 2,
    });

    expect(preview.accuracyChance).toBe(0);
    expect(preview.outcomeChances.miss).toBe(100);
    expect(preview.chanceToDamage).toBe(0);
    expect(preview.damageRange).toEqual({ min: 0, max: 0 });
  });

  it('forecasts the miss-streak forced graze as certain and not critical', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 0, criticalChance: 100 }),
      target: previewEnemy(), power: 12, kind: 'physical', missedAttacks: 2,
    });

    expect(preview.accuracyChance).toBe(100);
    expect(preview.outcomeChances.glancing).toBe(100);
    expect(preview.criticalChance).toBe(0);
    expect(preview.chanceToDamage).toBe(100);
  });

  it('reports a certain parry as zero damage', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 100, criticalChance: 100 }),
      target: previewEnemy({ parryChance: 100 }), power: 12, kind: 'physical',
    });

    expect(preview.outcomeChances.parried).toBe(100);
    expect(preview.criticalChance).toBe(0);
    expect(preview.chanceToDamage).toBe(0);
    expect(preview.damageRange).toEqual({ min: 0, max: 0 });
  });

  it('reports a guarded certain block as damaging and respects its reduced damage', () => {
    const target = previewEnemy({ guarding: true, blockChance: 100, evasion: 100, armor: 2 });
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 100, criticalChance: 100 }), target, power: 18, kind: 'physical',
    });

    expect(preview.outcomeChances.blocked).toBe(100);
    expect(preview.chanceToDamage).toBe(100);
    expect(preview.criticalChance).toBe(0);
    expect(preview.damageRange).toEqual({
      min: calculateDamage({ power: 18 * 0.88, kind: 'physical', armor: 2, ward: 0, guarding: true }),
      max: calculateDamage({ power: 18 * 1.15, kind: 'physical', armor: 2, ward: 0, guarding: true }),
    });
  });

  it('resolves certain evasion before a critical roll and reports a damaging graze', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 100, criticalChance: 100 }),
      target: previewEnemy({ evasion: 100 }), power: 16, kind: 'physical',
    });

    expect(preview.outcomeChances.glancing).toBe(100);
    expect(preview.criticalChance).toBe(0);
    expect(preview.chanceToDamage).toBe(100);
  });

  it('reports unconditional critical probability and mutually exclusive probabilities summing to 100', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 80, criticalChance: 40 }),
      target: previewEnemy({ guarding: true, blockChance: 30, parryChance: 20, evasion: 25 }),
      power: 17, kind: 'physical',
    });

    expect(preview.outcomeChances.miss).toBeCloseTo(20, 10);
    expect(preview.outcomeChances.glancing).toBeCloseTo(11.2, 10);
    expect(preview.outcomeChances.hit).toBeCloseTo(20.16, 10);
    expect(preview.outcomeChances.critical).toBeCloseTo(13.44, 10);
    expect(preview.outcomeChances.blocked).toBeCloseTo(19.2, 10);
    expect(preview.outcomeChances.parried).toBeCloseTo(16, 10);
    expect(preview.criticalChance).toBeCloseTo(13.44, 10);
    expect(Object.values(preview.outcomeChances).reduce((sum, chance) => sum + chance, 0)).toBeCloseTo(100);
    expect(preview.chanceToDamage).toBe(64);
  });

  it('preserves nonzero per-outcome probabilities below one tenth of a percent', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 1, criticalChance: 1 }),
      target: previewEnemy({ guarding: true, parryChance: 1, blockChance: 1, evasion: 1 }),
      power: 12,
      kind: 'physical',
    });

    expect(preview.outcomeChances).toMatchObject({
      parried: 0.01,
      blocked: 0.0099,
      glancing: 0.009801,
      critical: 0.00970299,
    });
    expect(preview.outcomeChances.blocked).toBeGreaterThan(0);
  });

  it('matches sorcery damage bounds against ward rather than armor', () => {
    const preview = previewAttack({
      attacker: previewHero({ attackAccuracy: 100, criticalChance: 0 }),
      target: previewEnemy({ armor: 1, ward: 7 }), power: 23, kind: 'sorcery',
    });

    expect(preview.damageRange).toEqual({
      min: calculateDamage({ power: 23 * 0.88, kind: 'sorcery', armor: 1, ward: 7 }),
      max: calculateDamage({ power: 23 * 1.15, kind: 'sorcery', armor: 1, ward: 7 }),
    });
  });

  it('derives hero attack and technique profiles using the combat resolver formulas', () => {
    const player = previewHero({ strength: 9, cunning: 5, will: 6, attackBonus: 2 });

    expect(heroAttackProfile(player, { type: 'attack' })).toEqual({ power: 15, kind: 'physical' });
    expect(heroAttackProfile(player, { type: 'technique', techniqueId: 'trip' })).toEqual({ power: 17, kind: 'physical' });
    expect(heroAttackProfile(player, { type: 'technique', techniqueId: 'witchfire' })).toEqual({ power: 13, kind: 'sorcery' });
  });

  it('derives enemy attack profiles and does not forecast ordinary flee, guard, or recover as attacks', () => {
    const enemy = previewEnemy({ role: 'archer', attack: 10 });

    expect(enemyAttackProfile(enemy, 'strike')).toEqual({ power: 11, kind: 'physical', ignoreGuard: true });
    expect(enemyAttackProfile(enemy, 'heavy')).toEqual({ power: 15, kind: 'physical', ignoreGuard: true });
    expect(enemyAttackProfile(enemy, 'hex')).toEqual({ power: 13, kind: 'sorcery', ignoreGuard: true });
    expect(enemyAttackProfile(enemy, 'guard')).toBeNull();
    expect(enemyAttackProfile(enemy, 'recover')).toBeNull();
    expect(enemyAttackProfile(enemy, 'flee')).toBeNull();
    expect(enemyAttackProfile({ ...enemy, isBoss: true }, 'flee')).toEqual({ power: 11, kind: 'physical', ignoreGuard: true });
  });

  it('does not mutate the supplied combatants', () => {
    const attacker = Object.freeze(previewHero({ statuses: Object.freeze([]) }));
    const target = Object.freeze(previewEnemy());

    expect(() => previewAttack({ attacker, target, power: 12, kind: 'physical' })).not.toThrow();
    expect(attacker.health).toBe(40);
    expect(target.health).toBe(40);
  });
});
