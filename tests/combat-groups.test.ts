import { describe, expect, it } from 'vitest';
import { createEncounter, resolveCombatTurn, type CombatState } from '../src/game/combat';
import type { CompanionCombatSnapshot } from '../src/game/companions';
import type { InventoryState } from '../src/game/inventory';
import type { EnemyDefinition, ItemDefinition } from '../src/game/types';

const inventory = (): InventoryState => ({
  pack: [{ id: 'pack-stack-potion-red', itemId: 'potion-red' as never, quantity: 1 }],
  stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
});

const enemy = (id: string, role: 'defender' | 'archer' | 'commander' = 'defender'): EnemyDefinition => ({
  id, archetypeId: id, name: id, rank: 1, level: 1, species: 'human', region: 'gloamwood', maxHealth: 30,
  attack: 3, armor: 0, ward: 0, intentWeights: { strike: 1 }, traits: [role], rewardTags: [], description: '', artFamily: '',
});

const hero = {
  class: 'warden' as const, name: 'Scout', level: 1, xp: 0, health: 40, maxHealth: 40,
  focus: 10, maxFocus: 10, strength: 5, cunning: 8, will: 5, armor: 3, ward: 3,
  attackBonus: 0, guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
  attackAccuracy: 100, criticalChance: 0,
};

const companion: CompanionCombatSnapshot = {
  companionId: 'rukhar' as never, loyaltyTier: 'loyal', questStage: 3, injured: false,
  attack: 4, guard: 2, will: 2, actionId: 'shield-bash',
};

const items = new Map<string, ItemDefinition>([['potion-red', {
  id: 'potion-red', name: 'Red Mercy', category: 'potion', description: '', allowedClasses: ['warrior', 'mage', 'warden'], stats: { health: 12 }, value: 1, tags: ['healing'],
}]]);

describe('group combat', () => {
  it('creates one combatant per encounter enemy and exposes a primary intent', () => {
    const combat = createEncounter(hero, { id: 'road-pack' as never, enemyIds: ['front' as never, 'rear' as never] }, {
      enemies: new Map([['front' as never, enemy('front')], ['rear' as never, enemy('rear', 'archer')]]),
    }, 7);

    expect(combat.enemies).toHaveLength(2);
    expect(combat.enemyIntents[0]?.enemyId).toBe('front');
    expect(combat.intentText.length).toBeGreaterThan(0);
  });

  it('only damages the selected living target', () => {
    const combat = createEncounter(hero, { id: 'road-pack' as never, enemyIds: ['front' as never, 'rear' as never] }, {
      enemies: new Map([['front' as never, enemy('front')], ['rear' as never, enemy('rear')]]),
    }, 7);
    const result = resolveCombatTurn(combat, { type: 'attack', targetId: 'rear' }, inventory(), { items });

    expect(result.combat.enemies.find((candidate) => candidate.id === 'front')?.health).toBe(30);
    expect(result.combat.enemies.find((candidate) => candidate.id === 'rear')?.health).toBeLessThan(30);
  });

  it('uses a combat consumable atomically and spends the turn', () => {
    const combat = createEncounter(hero, { id: 'solo' as never, enemyIds: ['front' as never] }, { enemies: new Map([['front' as never, enemy('front')]]) }, 7);
    const wounded: CombatState = { ...combat, player: { ...combat.player, health: 20 } };
    const result = resolveCombatTurn(wounded, { type: 'consumable', instanceId: 'pack-stack-potion-red' }, inventory(), { items });

    expect(result.inventory.pack).toEqual([]);
    expect(result.combat.player.health).toBeGreaterThan(20);
    expect(result.combat.turn).toBe(2);
  });

  it('enforces companion cooldown and support budget instead of making a second hero', () => {
    const combat = createEncounter(hero, { id: 'solo' as never, enemyIds: ['front' as never] }, { enemies: new Map([['front' as never, enemy('front')]]) }, 7, false, companion);
    const first = resolveCombatTurn(combat, { type: 'companion', targetId: 'front' }, inventory(), { items });
    const second = resolveCombatTurn(first.combat, { type: 'companion', targetId: 'front' }, first.inventory, { items });

    expect(first.combat.companionCooldown).toBeGreaterThan(0);
    expect(first.combat.companionDamageDealt).toBeLessThanOrEqual(first.combat.companionSupportBudget);
    expect(second.events).toContainEqual(expect.objectContaining({ type: 'combat_action_rejected', reason: 'companion_cooling_down' }));
  });

  it('moves a boss into its next phase once at its authored health threshold', () => {
    const combat = createEncounter(hero, { id: 'boss' as never, enemyIds: ['front' as never] }, { enemies: new Map([['front' as never, enemy('front')]]) }, 7, true);
    const nearThreshold: CombatState = { ...combat, enemies: combat.enemies.map((candidate) => ({ ...candidate, health: 14 })), enemy: { ...combat.enemy, health: 14 } };
    const result = resolveCombatTurn(nearThreshold, { type: 'attack', targetId: 'front' }, inventory(), { items });

    expect(result.events).toContainEqual(expect.objectContaining({ type: 'boss_phase_changed', phase: 2 }));
  });

  it.each([null, companion])('keeps the baseline encounter winnable with companion %s', (activeCompanion) => {
    let combat = createEncounter(hero, { id: 'baseline' as never, enemyIds: ['front' as never] }, { enemies: new Map([['front' as never, enemy('front')]]) }, 7, false, activeCompanion);
    let pack = inventory();
    for (let turn = 0; turn < 8 && combat.outcome === 'active'; turn += 1) {
      const result = resolveCombatTurn(combat, { type: 'attack', targetId: 'front' }, pack, { items });
      combat = result.combat;
      pack = result.inventory;
    }

    expect(combat.outcome).toBe('victory');
    expect(combat.player.health).toBeGreaterThan(0);
    expect(combat.companionDamageDealt).toBeLessThanOrEqual(combat.companionSupportBudget);
  });
});
