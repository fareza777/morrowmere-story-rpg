import { describe, expect, it } from 'vitest';
import { chooseTalent, deriveHeroStats, grantExperience, levelReward, type HeroProgress } from '../src/game/progression';
import type { InventoryState } from '../src/game/inventory';
import type { ItemDefinition } from '../src/game/content/schema';
import type { ItemId } from '../src/game/domain/ids';

const itemId = (id: string) => id as ItemId;
const emptyInventory: InventoryState = {
  pack: [], stash: [], questItems: [], equipment: { weapon: null, armor: null, charms: [] },
};
const warrior: HeroProgress = { heroClass: 'warrior', level: 1, xp: 0, talents: [] };
const ITEMS_FIXTURE = new Map<ItemId, ItemDefinition>([
  [itemId('weapon-rust-sword'), {
    id: 'weapon-rust-sword', name: 'Rust Sword', category: 'weapon', description: 'A battered sword.',
    allowedClasses: ['warrior'], stats: { attack: 2 }, value: 16, tags: ['blade'],
  }],
]);

describe('progression', () => {
  it.each([3, 6, 9, 12, 15])('offers a talent at level %i', (level) => {
    expect(levelReward(level).talentChoice).toBe(true);
  });

  it('does not offer a talent between talent levels', () => {
    expect(levelReward(4).talentChoice).toBe(false);
  });

  it('levels from the XP curve but does not exceed the chapter soft cap', () => {
    const result = grantExperience(warrior, { amount: 1_000, chapterId: 'ch01' });

    expect(result.ok && result.value.hero.level).toBe(2);
    expect(result.ok && result.value.hero.xp).toBe(1_000);
    expect(result.ok && result.value.levelsGained).toBe(1);
  });

  it('never lowers a hero level when granting XP under an earlier chapter soft cap', () => {
    const result = grantExperience(
      { ...warrior, level: 8, xp: 1_750 },
      { amount: 100, chapterId: 'ch01' },
    );

    expect(result.ok && result.value.hero.level).toBe(8);
    expect(result.ok && result.value.levelsGained).toBe(0);
  });

  it('halves repeated encounter XP after the first victory', () => {
    const result = grantExperience(warrior, {
      amount: 100,
      chapterId: 'ch02',
      priorEncounterVictories: 1,
    });

    expect(result.ok && result.value.grantedXp).toBe(50);
    expect(result.ok && result.value.hero.xp).toBe(50);
  });

  it('allows one unlocked class talent and rejects a duplicate choice', () => {
    const levelThreeWarrior: HeroProgress = { ...warrior, level: 3, xp: 250 };
    const selected = chooseTalent(levelThreeWarrior, 'warrior-cleave');
    const duplicate = chooseTalent(selected.ok ? selected.value : levelThreeWarrior, 'warrior-cleave');

    expect(selected.ok && selected.value.talents).toEqual(['warrior-cleave']);
    expect(duplicate.ok).toBe(false);
    expect(duplicate.ok ? null : duplicate.error.code).toBe('talent_already_chosen');
  });

  it('derives equipment and temporary-boon bonuses without storing them on hero progress', () => {
    const inventory: InventoryState = {
      ...emptyInventory,
      equipment: { weapon: itemId('weapon-rust-sword'), armor: null, charms: [] },
    };
    const derived = deriveHeroStats(
      { ...warrior, level: 3, xp: 250, talents: ['warrior-cleave'] },
      inventory,
      ITEMS_FIXTURE,
      [{ id: 'road-blessing', stats: { armor: 2 } }],
    );

    expect(derived.attack).toBe(13);
    expect(derived.armor).toBe(6);
    expect(derived.maxHealth).toBe(50);
  });
});
