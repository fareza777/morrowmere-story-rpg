import { ENEMIES } from '../src/game/content/enemies';
import {
  calculateDamage,
  createCombat,
  resolveCombatAction,
  type CombatState,
} from '../src/game/combat';
import { createHero } from '../src/game/state';

describe('combat rules', () => {
  it('uses armor for physical damage and ward for sorcery damage', () => {
    expect(calculateDamage({ power: 10, kind: 'physical', armor: 4, ward: 9 })).toBe(6);
    expect(calculateDamage({ power: 10, kind: 'sorcery', armor: 4, ward: 9 })).toBe(1);
  });

  it('guard halves the next incoming hit', () => {
    expect(
      calculateDamage({ power: 11, kind: 'physical', armor: 3, ward: 0, guarding: true }),
    ).toBe(4);
  });

  it('exposes the enemy intent before the player acts', () => {
    const combat = createCombat(createHero('warrior'), ENEMIES[0], 41);

    expect(combat.enemyIntent).toMatch(/strike|heavy|guard|hex|recover|flee/);
    expect(combat.intentText.length).toBeGreaterThan(12);
  });

  it('resolves guard before an announced enemy strike and expires statuses', () => {
    const initial = createCombat(createHero('warrior'), ENEMIES[0], 41);
    const state: CombatState = {
      ...initial,
      enemy: { ...initial.enemy, attack: 11 },
      enemyIntent: 'strike',
      intentText: 'The enemy draws back for a measured strike.',
      player: {
        ...initial.player,
        health: 40,
        armor: 3,
        statuses: [{ id: 'bleeding', label: 'Bleeding', duration: 2, potency: 1 }],
      },
    };

    const result = resolveCombatAction(state, { type: 'guard' });

    expect(result.state.player.health).toBe(36);
    expect(result.state.player.guarding).toBe(false);
    expect(result.state.player.statuses[0]?.duration).toBe(1);
  });

  it('does not allow fleeing from a boss encounter', () => {
    const combat = createCombat(createHero('warden'), ENEMIES[30], 99, true);
    const result = resolveCombatAction(combat, { type: 'flee' });

    expect(result.state.outcome).toBe('active');
    expect(result.events.join(' ')).toContain('There is no road out');
  });

  it('produces deterministic misses and critical hits across seeded attacks', () => {
    const initial = createCombat(createHero('warrior'), ENEMIES[0], 41);
    const outcomes = Array.from({ length: 160 }, (_, seed) => {
      const state: CombatState = {
        ...initial,
        rngState: seed + 1,
        enemyIntent: 'guard',
        enemy: { ...initial.enemy, health: 999, maxHealth: 999 },
      };
      return resolveCombatAction(state, { type: 'attack' }).events.join(' ');
    });

    expect(outcomes.some((entry) => entry.includes('misses'))).toBe(true);
    expect(outcomes.some((entry) => entry.includes('Critical hit'))).toBe(true);
  });

  it('allows enemy attacks to miss or critically hit from seeded rolls', () => {
    const initial = createCombat(createHero('warrior'), ENEMIES[0], 41);
    const outcomes = Array.from({ length: 180 }, (_, seed) => {
      const state: CombatState = {
        ...initial,
        rngState: seed + 1,
        enemyIntent: 'heavy',
        enemy: { ...initial.enemy, health: 999, maxHealth: 999 },
      };
      return resolveCombatAction(state, { type: 'guard' }).events.join(' ');
    });

    expect(outcomes.some((entry) => entry.includes('misses you'))).toBe(true);
    expect(outcomes.some((entry) => entry.includes('Critical enemy hit'))).toBe(true);
  });
});
