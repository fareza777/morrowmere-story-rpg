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
});
