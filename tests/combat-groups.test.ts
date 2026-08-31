import { describe, expect, it } from 'vitest';
import { createEncounter, resolveCombatTurn, type CombatState } from '../src/game/combat';
import type { CompanionCombatSnapshot } from '../src/game/companions';
import type { InventoryState } from '../src/game/inventory';
import type { EnemyDefinition, ItemDefinition } from '../src/game/types';
import { ENEMIES } from '../src/game/content/enemies';
import { roleForEnemy } from '../src/game/combat/enemy-ai';
import type { DomainEvent as CanonicalDomainEvent } from '../src/game/domain/result';
import type { EncounterDefinition } from '../src/game/content/schema';
import { ITEMS } from '../src/game/content/items';
import type { ItemId } from '../src/game/domain/ids';

const inventory = (): InventoryState => ({
  pack: [{ id: 'pack-stack-potion-red', itemId: 'potion-red' as never, quantity: 1 }],
  stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
});

const enemy = (id: string, traits: readonly string[] = ['Shield Wall'], intentWeights: EnemyDefinition['intentWeights'] = { strike: 1 }): EnemyDefinition => ({
  id, archetypeId: id, name: id, rank: 1, level: 1, species: 'human', region: 'gloamwood', maxHealth: 30,
  attack: 3, armor: 0, ward: 0, intentWeights, traits, rewardTags: [], description: '', artFamily: '',
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

const catalogItems = new Map(ITEMS.map((item) => [item.id as ItemId, item] as const));

function inventoryWith(itemId: ItemId): InventoryState {
  return {
    pack: [{ id: `pack-stack-${itemId}`, itemId, quantity: 1 }],
    stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
  };
}

const encounter = (id: string, enemyIds: readonly string[], kind: 'regular' | 'boss' = 'regular'): EncounterDefinition => ({
  id: id as never,
  family: id,
  kind,
  bossEnemyId: kind === 'boss' ? enemyIds[0] as never : undefined,
  enemyIds: enemyIds.map((enemyId) => enemyId as never),
  reward: { xp: 0, gold: 0, itemChoices: [] },
});

describe('group combat', () => {
  it('creates one combatant per encounter enemy and exposes a primary intent', () => {
    const combat = createEncounter(hero, encounter('road-pack', ['front', 'rear']), {
      enemies: new Map([['front' as never, enemy('front')], ['rear' as never, enemy('rear', ['Stone Wings'])]]),
    }, 7);

    expect(combat.enemies).toHaveLength(2);
    expect(combat.enemyIntents[0]?.enemyId).toBe('front');
    expect(combat.intentText.length).toBeGreaterThan(0);
  });

  it('only damages the selected living target', () => {
    const combat = createEncounter(hero, encounter('road-pack', ['front', 'rear']), {
      enemies: new Map([['front' as never, enemy('front')], ['rear' as never, enemy('rear')]]),
    }, 7);
    const result = resolveCombatTurn(combat, { type: 'attack', targetId: 'rear' }, inventory(), { items });

    expect(result.combat.enemies.find((candidate) => candidate.id === 'front')?.health).toBe(30);
    expect(result.combat.enemies.find((candidate) => candidate.id === 'rear')?.health).toBeLessThan(30);
  });

  it('uses a combat consumable atomically and spends the turn', () => {
    const combat = createEncounter(hero, encounter('solo', ['front']), { enemies: new Map([['front' as never, enemy('front')]]) }, 7);
    const wounded: CombatState = { ...combat, player: { ...combat.player, health: 20 } };
    const result = resolveCombatTurn(wounded, { type: 'consumable', instanceId: 'pack-stack-potion-red' }, inventory(), { items });
    const canonicalEvents: readonly CanonicalDomainEvent[] = result.events;

    expect(result.inventory.pack).toEqual([]);
    expect(result.combat.player.health).toBeGreaterThan(20);
    expect(result.combat.turn).toBe(2);
    expect(canonicalEvents).toEqual(result.events);
  });

  it('rejects a full-health restorative without consuming it or advancing combat', () => {
    const combat = createEncounter(hero, encounter('solo', ['front']), { enemies: new Map([['front' as never, enemy('front')]]) }, 7);
    const pack = inventoryWith('potion-red' as ItemId);
    const result = resolveCombatTurn(combat, { type: 'consumable', instanceId: 'pack-stack-potion-red' }, pack, { items: catalogItems });

    expect(result.combat).toBe(combat);
    expect(result.inventory).toBe(pack);
    expect(result.combat.turn).toBe(1);
    expect(result.combat.rngState).toBe(combat.rngState);
    expect(result.events).toEqual([{ type: 'combat_action_rejected', reason: 'item_unavailable' }]);
  });

  it.each([
    ['potion-ember', 3, 3],
    ['potion-black-rain', 4, 4],
    ['scroll-sparks', 0, 3],
    ['scroll-thorns', 2, 2],
  ] as const)('applies the authored attack and will effects for %s', (rawItemId, attack, will) => {
    const itemId = rawItemId as ItemId;
    const combat = createEncounter(hero, encounter('solo', ['front']), { enemies: new Map([['front' as never, enemy('front')]]) }, 7);
    const pack = inventoryWith(itemId);
    const result = resolveCombatTurn(combat, { type: 'consumable', instanceId: `pack-stack-${itemId}` }, pack, { items: catalogItems });

    expect(result.inventory.pack).toEqual([]);
    expect(result.combat.turn).toBe(2);
    expect(result.combat.player.attackBonus).toBe(combat.player.attackBonus + attack);
    expect(result.combat.player.will).toBe(combat.player.will + will);
    expect(result.events).toContainEqual({ type: 'consumable_used', instanceId: `pack-stack-${itemId}` });
  });

  it('enforces companion cooldown and support budget instead of making a second hero', () => {
    const combat = createEncounter(hero, encounter('solo', ['front']), { enemies: new Map([['front' as never, enemy('front')]]) }, 7, false, companion);
    const first = resolveCombatTurn(combat, { type: 'companion', targetId: 'front' }, inventory(), { items });
    const second = resolveCombatTurn(first.combat, { type: 'companion', targetId: 'front' }, first.inventory, { items });

    expect(first.combat.companionCooldown).toBeGreaterThan(0);
    expect(first.combat.companionDamageDealt).toBeLessThanOrEqual(first.combat.companionSupportBudget);
    expect(second.events).toContainEqual(expect.objectContaining({ type: 'combat_action_rejected', reason: 'companion_cooling_down' }));
  });

  it('moves a boss into its next phase once at its authored health threshold', () => {
    const combat = createEncounter(hero, encounter('boss', ['front'], 'boss'), { enemies: new Map([['front' as never, enemy('front')]]) }, 7, true);
    const nearThreshold: CombatState = { ...combat, enemies: combat.enemies.map((candidate) => ({ ...candidate, health: 14 })), enemy: { ...combat.enemy, health: 14 } };
    const result = resolveCombatTurn(nearThreshold, { type: 'attack', targetId: 'front' }, inventory(), { items });

    expect(result.events).toContainEqual(expect.objectContaining({ type: 'boss_phase_changed', phase: 2 }));
  });

  it('does not advance a boss phase when the threshold-crossing hit is lethal', () => {
    const combat = createEncounter(hero, encounter('boss', ['front'], 'boss'), { enemies: new Map([['front' as never, enemy('front')]]) }, 7, true);
    const dyingBoss: CombatState = { ...combat, enemies: combat.enemies.map((candidate) => ({ ...candidate, health: 1 })), enemy: { ...combat.enemy, health: 1 } };
    const result = resolveCombatTurn(dyingBoss, { type: 'attack', targetId: 'front' }, inventory(), { items });

    expect(result.combat.outcome).toBe('victory');
    expect(result.events).not.toContainEqual(expect.objectContaining({ type: 'boss_phase_changed' }));
  });

  it('keeps the compatibility enemy aligned to the first living combatant', () => {
    const combat = createEncounter(hero, encounter('two', ['front', 'rear']), {
      enemies: new Map([['front' as never, enemy('front')], ['rear' as never, enemy('rear')]]),
    }, 7);
    const weakened: CombatState = { ...combat, enemies: combat.enemies.map((candidate) => candidate.id === 'front' ? { ...candidate, health: 1 } : candidate), enemy: { ...combat.enemy, health: 1 } };
    const result = resolveCombatTurn(weakened, { type: 'attack', targetId: 'front' }, inventory(), { items });

    expect(result.combat.enemy.id).toBe('rear');
    expect(result.combat.enemy.id).toBe(result.combat.enemyIntents[0]?.enemyId);
  });

  it('classifies shipped traits into all eight tactical roles', () => {
    const archetype = (id: string) => ENEMIES.find((candidate) => candidate.archetypeId === id)!;

    expect(roleForEnemy(archetype('iron-deserter'))).toBe('defender');
    expect(roleForEnemy(archetype('gloam-warg'))).toBe('assassin');
    expect(roleForEnemy(archetype('vault-gargoyle'))).toBe('archer');
    expect(roleForEnemy(archetype('ash-magus'))).toBe('shaman');
    expect(roleForEnemy(archetype('mire-enchantress'))).toBe('controller');
    expect(roleForEnemy(archetype('orc-hexcaller'))).toBe('summoner');
    expect(roleForEnemy(archetype('barrow-soldier'))).toBe('commander');
    expect(roleForEnemy(archetype('bridge-troll'))).toBe('specialist');
  });

  it('gives archers a piercing shot, controllers a hindering hex, shamans a focus drain, and specialists stronger recovery', () => {
    const resolveRoleTurn = (definition: EnemyDefinition, intent: 'strike' | 'hex' | 'recover', options: { readonly player?: Partial<CombatState['player']>; readonly enemyHealth?: number } = {}) => {
      const combat = createEncounter(hero, encounter(`${definition.id}-encounter`, [definition.id]), { enemies: new Map([[definition.id as never, definition]]) }, 7);
      const actingEnemy = { ...combat.enemy, health: options.enemyHealth ?? combat.enemy.health };
      const forced: CombatState = {
        ...combat, player: { ...combat.player, ...options.player }, enemy: actingEnemy, enemies: [actingEnemy], rngState: 7, enemyIntent: intent,
        enemyIntents: [{ enemyId: combat.enemy.id, intent, text: 'The enemy acts.' }],
      };
      return resolveCombatTurn(forced, { type: 'guard' }, inventory(), { items });
    };

    const archer = resolveRoleTurn({ ...enemy('archer', ['Stone Wings'], { strike: 1 }), attack: 10 }, 'strike', { player: { health: 40, armor: 0 } });
    const controller = resolveRoleTurn(enemy('controller', ['Drowning Word'], { hex: 1 }), 'hex');
    const shaman = resolveRoleTurn({ ...enemy('shaman', ['Witchfire'], { hex: 1 }), species: 'mage' }, 'hex');
    const specialist = resolveRoleTurn(enemy('specialist', ['Regeneration'], { recover: 1 }), 'recover', { enemyHealth: 10 });

    expect(archer.combat.player.health).toBeLessThan(32);
    expect(controller.combat.player.statuses).toContainEqual(expect.objectContaining({ id: 'hindered' }));
    expect(shaman.combat.player.focus).toBeLessThan(hero.focus);
    expect(specialist.combat.enemies[0]?.health).toBeGreaterThanOrEqual(16);
  });

  it('lets summoners add a minion and commanders strengthen a living ally', () => {
    const summonerDefinition = enemy('summoner', ['Ancestor Smoke'], { hex: 1 });
    const summoner = createEncounter(hero, encounter('summon', ['summoner']), { enemies: new Map([['summoner' as never, summonerDefinition]]) }, 7);
    const summoned = resolveCombatTurn({ ...summoner, rngState: 7, enemyIntent: 'hex', enemyIntents: [{ enemyId: 'summoner', intent: 'hex', text: 'Calls smoke.' }] }, { type: 'guard' }, inventory(), { items });

    const commanderDefinition = enemy('commander', ['Deathless Drill'], { guard: 1 });
    const allyDefinition = enemy('ally', ['Shield Wall'], { strike: 1 });
    const commanded = createEncounter(hero, encounter('command', ['commander', 'ally']), { enemies: new Map([['commander' as never, commanderDefinition], ['ally' as never, allyDefinition]]) }, 7);
    const strengthened = resolveCombatTurn({ ...commanded, enemyIntent: 'guard', enemyIntents: [{ enemyId: 'commander', intent: 'guard', text: 'Commands.' }] }, { type: 'guard' }, inventory(), { items });

    expect(summoned.combat.enemies).toHaveLength(2);
    expect(summoned.combat.enemies[1]?.name).toContain('Smoke');
    expect(strengthened.combat.enemies.find((candidate) => candidate.id === 'ally')?.attack).toBe(4);
  });

  it.each([null, companion])('keeps the baseline encounter winnable with companion %s', (activeCompanion) => {
    let combat = createEncounter(hero, encounter('baseline', ['front']), { enemies: new Map([['front' as never, enemy('front')]]) }, 7, false, activeCompanion);
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
