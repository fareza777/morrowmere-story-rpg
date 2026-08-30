import { ENEMIES } from '../src/game/content/enemies';
import { ITEMS, generateItemReward } from '../src/game/content/items';

describe('enemy catalog', () => {
  it('contains exactly 200 stable unique enemies', () => {
    expect(ENEMIES).toHaveLength(200);
    expect(new Set(ENEMIES.map((enemy) => enemy.id)).size).toBe(200);
    expect(new Set(ENEMIES.map((enemy) => enemy.name)).size).toBe(200);
  });

  it('contains twenty archetypes with ten non-decreasing ranks each', () => {
    const groups = new Map<string, typeof ENEMIES>();
    for (const enemy of ENEMIES) {
      groups.set(enemy.archetypeId, [...(groups.get(enemy.archetypeId) ?? []), enemy]);
    }

    expect(groups.size).toBe(20);
    for (const variants of groups.values()) {
      expect(variants).toHaveLength(10);
      const power = variants.map(
        (enemy) => enemy.maxHealth + enemy.attack * 3 + enemy.armor * 2 + enemy.ward * 2,
      );
      expect(power).toEqual([...power].sort((left, right) => left - right));
    }
  });

  it('covers the promised sword and sorcery enemy families', () => {
    const species = new Set(ENEMIES.map((enemy) => enemy.species));

    for (const expected of [
      'goblin',
      'orc',
      'human',
      'mage',
      'beast',
      'troll',
      'construct',
      'undead',
      'cultist',
      'demon',
    ]) {
      expect(species).toContain(expected);
    }
  });
});

describe('item catalog', () => {
  it('contains sixty readable base items with unique identities', () => {
    expect(ITEMS).toHaveLength(60);
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(60);
    expect(new Set(ITEMS.map((item) => item.name)).size).toBe(60);
    expect(ITEMS.every((item) => item.description.length >= 24)).toBe(true);
  });

  it.each(['warrior', 'mage', 'warden'] as const)(
    'offers a class-relevant and defensive reward to %s',
    (heroClass) => {
      const rewards = generateItemReward({ heroClass, level: 4, seed: 8102 });

      expect(rewards).toHaveLength(3);
      expect(rewards.some((item) => item.allowedClasses.includes(heroClass))).toBe(true);
      expect(rewards.some((item) => item.stats.armor || item.stats.ward || item.stats.health)).toBe(
        true,
      );
    },
  );
});
