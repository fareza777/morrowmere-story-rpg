import { gameReducer, startNewRun } from '../src/game/state';

describe('chronicle state', () => {
  it.each([
    ['warrior', 44, 8],
    ['mage', 30, 14],
    ['warden', 37, 10],
  ] as const)('creates a complete twelve-node %s run', (heroClass, health, focus) => {
    const state = startNewRun({ heroClass, seed: 1212 });

    expect(state.route).toHaveLength(12);
    expect(state.hero.health).toBe(health);
    expect(state.hero.focus).toBe(focus);
    expect(state.screen).toBe('story');
    expect(state.routeIndex).toBe(0);
  });

  it('keeps state unchanged when a command violates its precondition', () => {
    const state = startNewRun({ heroClass: 'warrior', seed: 50 });

    expect(gameReducer(state, { type: 'ADVANCE' })).toBe(state);
  });

  it('applies a story choice once and then advances to the next node', () => {
    const state = startNewRun({ heroClass: 'warden', seed: 77 });
    const resolved = gameReducer(state, { type: 'CHOOSE', choiceId: 'continue' });
    const duplicate = gameReducer(resolved, { type: 'CHOOSE', choiceId: 'continue' });
    const advanced = gameReducer(resolved, { type: 'ADVANCE' });

    expect(resolved.lastOutcome).toContain('road');
    expect(duplicate).toBe(resolved);
    expect(advanced.routeIndex).toBe(1);
    expect(advanced.lastOutcome).toBeNull();
  });

  it('records faction, mercy, corruption, and flags from event consequences', () => {
    const initial = startNewRun({ heroClass: 'mage', seed: 1943 });
    const storyState = { ...initial, routeIndex: 1 };
    const choice = storyState.route[1]?.choices[0];
    if (!choice) throw new Error('Seeded route did not provide a choice');
    const result = gameReducer(storyState, { type: 'CHOOSE', choiceId: choice.id });

    expect(result.flags.length).toBeGreaterThanOrEqual(choice.effect.addFlags?.length ?? 0);
    expect(Number.isFinite(result.mercy)).toBe(true);
    expect(Number.isFinite(result.corruption)).toBe(true);
  });

  it.each([
    ['destroy-crown', 'crown-destroyed'],
    ['restore-crown', 'crown-restored'],
    ['refuse-crown', 'crown-refused'],
  ] as const)('records the final Crown decision before %s combat', (choiceId, expectedFlag) => {
    const initial = startNewRun({ heroClass: 'warrior', seed: 1943 });
    const finale = { ...initial, routeIndex: 11 };
    const result = gameReducer(finale, { type: 'CHOOSE', choiceId });

    expect(finale.route[11]?.choices).toHaveLength(3);
    expect(result.flags).toContain(expectedFlag);
    expect(result.screen).toBe('combat');
    expect(result.combat?.enemy.isBoss).toBe(true);
  });

  it('equips, replaces, and removes gear without stacking old bonuses', () => {
    const initial = startNewRun({ heroClass: 'warrior', seed: 1943 });
    const stocked = {
      ...initial,
      hero: {
        ...initial.hero,
        inventory: ['potion-red', 'weapon-rust-sword', 'weapon-orc-falchion'],
      },
    };

    const first = gameReducer(stocked, { type: 'EQUIP_ITEM', itemId: 'weapon-rust-sword' });
    const replacement = gameReducer(first, { type: 'EQUIP_ITEM', itemId: 'weapon-orc-falchion' });
    const removed = gameReducer(replacement, { type: 'UNEQUIP_ITEM', itemId: 'weapon-orc-falchion' });

    expect(first.hero.equipment.weapon).toBe('weapon-rust-sword');
    expect(first.hero.attackBonus).toBe(stocked.hero.attackBonus + 2);
    expect(replacement.hero.equipment.weapon).toBe('weapon-orc-falchion');
    expect(replacement.hero.attackBonus).toBe(stocked.hero.attackBonus + 5);
    expect(removed.hero.equipment.weapon).toBeNull();
    expect(removed.hero.attackBonus).toBe(stocked.hero.attackBonus);
  });

  it('limits equipped charms to two and rejects gear for another class', () => {
    const initial = startNewRun({ heroClass: 'warrior', seed: 84 });
    const stocked = {
      ...initial,
      hero: {
        ...initial.hero,
        inventory: ['charm-wolf-tooth', 'charm-mute-bell', 'charm-orc-knot', 'weapon-ash-wand'],
      },
    };

    const one = gameReducer(stocked, { type: 'EQUIP_ITEM', itemId: 'charm-wolf-tooth' });
    const two = gameReducer(one, { type: 'EQUIP_ITEM', itemId: 'charm-mute-bell' });
    const full = gameReducer(two, { type: 'EQUIP_ITEM', itemId: 'charm-orc-knot' });
    const wrongClass = gameReducer(full, { type: 'EQUIP_ITEM', itemId: 'weapon-ash-wand' });

    expect(two.hero.equipment.charms).toHaveLength(2);
    expect(full).toBe(two);
    expect(wrongClass).toBe(full);
  });
});
