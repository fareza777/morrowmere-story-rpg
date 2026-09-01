import { describe, expect, it } from 'vitest';
import {
  calculateCheckChance,
  classifyCheckResult,
  createCheckRoll,
  createCheckRollSeed,
} from '../src/game/checks';

describe('deterministic narrative checks', () => {
  it.each([
    [4, 4, 0, 55],
    [7, 4, 0, 85],
    [0, 4, 0, 15],
    [10, 1, 0, 95],
  ])('calculates and clamps chance for stat %i against difficulty %i', (stat, difficulty, modifier, expected) => {
    expect(calculateCheckChance(stat, difficulty, modifier)).toBe(expected);
  });

  it('applies bounded positive and negative modifiers before clamping', () => {
    expect(calculateCheckChance(4, 4, 15)).toBe(70);
    expect(calculateCheckChance(4, 4, -15)).toBe(40);
    expect(calculateCheckChance(10, 1, 20)).toBe(95);
    expect(calculateCheckChance(0, 4, -20)).toBe(15);
  });

  it('replays one roll for the same seed, scene, visit, and choice', () => {
    const input = [913, 'ch01-journey-washed-verge', 2, 'ch01-choice-brace-the-wagon'] as const;

    expect(createCheckRoll(...input)).toBe(createCheckRoll(...input));
    expect(createCheckRollSeed(...input)).toBe(createCheckRollSeed(...input));
  });

  it('uses a distinct deterministic stream for a different choice or visit', () => {
    const seed = 913;
    const sceneId = 'ch01-journey-washed-verge';
    const choiceId = 'ch01-choice-brace-the-wagon';

    expect(createCheckRollSeed(seed, sceneId, 3, choiceId)).not.toBe(
      createCheckRollSeed(seed, sceneId, 2, choiceId),
    );
    expect(createCheckRollSeed(seed, sceneId, 2, 'ch01-choice-find-a-detour')).not.toBe(
      createCheckRollSeed(seed, sceneId, 2, choiceId),
    );
  });

  it('classifies low rolls as critical successes only when they succeed', () => {
    expect(classifyCheckResult(1, 50)).toBe('critical-success');
    expect(classifyCheckResult(5, 5)).toBe('critical-success');
    expect(classifyCheckResult(5, 4)).toBe('failure');
  });

  it('classifies high rolls as critical failures only when they fail', () => {
    expect(classifyCheckResult(100, 95)).toBe('critical-failure');
    expect(classifyCheckResult(96, 95)).toBe('critical-failure');
    expect(classifyCheckResult(96, 96)).toBe('success');
  });
});
