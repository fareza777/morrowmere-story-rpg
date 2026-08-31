import { describe, expect, it } from 'vitest';
import { resolveCombatTurn, type CombatState } from '../src/game/combat';
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
