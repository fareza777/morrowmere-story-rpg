import type { ItemDefinition } from './content/schema';
import type { ChapterId, ItemId } from './domain/ids';
import type { DomainResult } from './domain/result';
import type { InventoryState } from './inventory';
import type { HeroClass } from './types';

export const LEVEL_CAP = 15;
const XP_BY_LEVEL = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950] as const;
const CHAPTER_SOFT_CAP: Readonly<Record<ChapterId, number>> = { ch01: 3, ch02: 5, ch03: 7, ch04: 9, ch05: 11, ch06: 13, ch07: 15, ch08: 15 };

/** The highest progression level that Chronicle I awards within a chapter. */
export function chapterLevelCap(chapterId: ChapterId): number {
  return CHAPTER_SOFT_CAP[chapterId];
}

export type DerivedStatName = 'attack' | 'armor' | 'ward' | 'maxHealth' | 'maxFocus' | 'strength' | 'cunning' | 'will';

export interface HeroProgress {
  readonly heroClass: HeroClass;
  readonly level: number;
  readonly xp: number;
  readonly talents: readonly string[];
}

export interface BoonState {
  readonly id: string;
  readonly stats: Readonly<Partial<Record<DerivedStatName, number>>>;
}

export interface DerivedHeroStats {
  readonly heroClass: HeroClass;
  readonly level: number;
  readonly xp: number;
  readonly talents: readonly string[];
  readonly maxHealth: number;
  readonly maxFocus: number;
  readonly strength: number;
  readonly cunning: number;
  readonly will: number;
  readonly attack: number;
  readonly armor: number;
  readonly ward: number;
}

export interface LevelReward {
  readonly level: number;
  readonly xpRequired: number;
  readonly maxHealth: number;
  readonly maxFocus: number;
  readonly talentChoice: boolean;
}

export interface ExperienceGrant {
  readonly amount: number;
  readonly chapterId: ChapterId;
  readonly priorEncounterVictories?: number;
}

export interface ExperienceResult {
  readonly hero: HeroProgress;
  readonly grantedXp: number;
  readonly levelsGained: number;
}

export interface ProgressionError {
  readonly code: 'invalid_experience' | 'talent_already_chosen' | 'talent_locked' | 'unknown_talent';
  readonly message: string;
}

interface TalentDefinition {
  readonly id: string;
  readonly heroClass: HeroClass;
  readonly stats: Readonly<Partial<Record<DerivedStatName, number>>>;
}

const TALENTS: readonly TalentDefinition[] = [
  { id: 'warrior-cleave', heroClass: 'warrior', stats: { attack: 1 } },
  { id: 'warrior-bulwark', heroClass: 'warrior', stats: { armor: 2 } },
  { id: 'warrior-riposte', heroClass: 'warrior', stats: { ward: 1, cunning: 1 } },
  { id: 'mage-witchfire', heroClass: 'mage', stats: { attack: 2, will: 1 } },
  { id: 'mage-sigil-ward', heroClass: 'mage', stats: { ward: 2 } },
  { id: 'mage-ley-step', heroClass: 'mage', stats: { maxFocus: 2, cunning: 1 } },
  { id: 'warden-aim', heroClass: 'warden', stats: { attack: 1, cunning: 1 } },
  { id: 'warden-traps', heroClass: 'warden', stats: { armor: 1, ward: 1 } },
  { id: 'warden-remedy', heroClass: 'warden', stats: { maxHealth: 4, maxFocus: 1 } },
];

/** Persistence needs the same closed talent catalog as the progression command. */
export function isTalentForClass(heroClass: HeroClass, talentId: string): boolean {
  return TALENTS.some((talent) => talent.heroClass === heroClass && talent.id === talentId);
}

const CLASS_BASE_STATS: Readonly<Record<HeroClass, Omit<DerivedHeroStats, 'heroClass' | 'level' | 'xp' | 'talents' | 'attack'>>> = {
  warrior: { maxHealth: 44, maxFocus: 8, strength: 8, cunning: 4, will: 3, armor: 4, ward: 1 },
  mage: { maxHealth: 30, maxFocus: 14, strength: 3, cunning: 5, will: 9, armor: 1, ward: 5 },
  warden: { maxHealth: 37, maxFocus: 10, strength: 5, cunning: 8, will: 5, armor: 3, ward: 3 },
};

function failure<T>(code: ProgressionError['code'], message: string): DomainResult<T, ProgressionError> {
  return { ok: false, error: { code, message } };
}

function levelForXp(xp: number): number {
  let level = 1;
  for (let index = 1; index < XP_BY_LEVEL.length; index += 1) if (xp >= XP_BY_LEVEL[index]!) level = index + 1;
  return level;
}

function applyModifiers(stats: DerivedHeroStats, modifiers: Readonly<Partial<Record<DerivedStatName, number>>>): DerivedHeroStats {
  return {
    ...stats,
    maxHealth: Math.max(1, stats.maxHealth + (modifiers.maxHealth ?? 0)),
    maxFocus: Math.max(0, stats.maxFocus + (modifiers.maxFocus ?? 0)),
    strength: Math.max(0, stats.strength + (modifiers.strength ?? 0)),
    cunning: Math.max(0, stats.cunning + (modifiers.cunning ?? 0)),
    will: Math.max(0, stats.will + (modifiers.will ?? 0)),
    attack: Math.max(0, stats.attack + (modifiers.attack ?? 0)),
    armor: Math.max(0, stats.armor + (modifiers.armor ?? 0)),
    ward: Math.max(0, stats.ward + (modifiers.ward ?? 0)),
  };
}

export function levelReward(level: number): LevelReward {
  const normalized = Math.max(1, Math.min(LEVEL_CAP, Math.floor(level)));
  return { level: normalized, xpRequired: XP_BY_LEVEL[normalized - 1] ?? XP_BY_LEVEL[XP_BY_LEVEL.length - 1]!, maxHealth: normalized > 1 ? 3 : 0, maxFocus: normalized > 1 ? 1 : 0, talentChoice: normalized % 3 === 0 };
}

export function grantExperience(hero: HeroProgress, grant: ExperienceGrant): DomainResult<ExperienceResult, ProgressionError> {
  if (!Number.isFinite(grant.amount) || grant.amount < 0) return failure('invalid_experience', 'Experience must be a non-negative number.');
  const victories = Math.max(0, Math.floor(grant.priorEncounterVictories ?? 0));
  const grantedXp = Math.floor(grant.amount * 0.5 ** victories);
  const xp = hero.xp + grantedXp;
  const level = Math.max(hero.level, Math.min(LEVEL_CAP, CHAPTER_SOFT_CAP[grant.chapterId], levelForXp(xp)));
  return { ok: true, value: { hero: { ...hero, xp, level }, grantedXp, levelsGained: Math.max(0, level - hero.level) } };
}

export function chooseTalent(hero: HeroProgress, talentId: string): DomainResult<HeroProgress, ProgressionError> {
  const talent = TALENTS.find((candidate) => candidate.id === talentId && candidate.heroClass === hero.heroClass);
  if (!talent) return failure('unknown_talent', 'That talent is not available to this hero.');
  if (hero.talents.includes(talentId)) return failure('talent_already_chosen', 'That talent has already been chosen.');
  if (hero.talents.length >= Math.floor(Math.min(hero.level, LEVEL_CAP) / 3)) return failure('talent_locked', 'Reach another talent level before choosing a talent.');
  return { ok: true, value: { ...hero, talents: [...hero.talents, talentId] } };
}

export function deriveHeroStats(hero: HeroProgress, inventory: InventoryState, items: ReadonlyMap<ItemId, ItemDefinition>, boons: readonly BoonState[] = []): DerivedHeroStats {
  const level = Math.max(1, Math.min(LEVEL_CAP, hero.level));
  const base = CLASS_BASE_STATS[hero.heroClass];
  let stats: DerivedHeroStats = {
    heroClass: hero.heroClass, level, xp: hero.xp, talents: hero.talents,
    maxHealth: base.maxHealth + (level - 1) * 3, maxFocus: base.maxFocus + (level - 1),
    strength: base.strength + (level - 1), cunning: base.cunning, will: base.will,
    attack: base.strength + (level - 1), armor: base.armor, ward: base.ward,
  };
  for (const talent of TALENTS.filter((candidate) => hero.talents.includes(candidate.id))) stats = applyModifiers(stats, talent.stats);
  for (const equippedId of [inventory.equipment.weapon, inventory.equipment.armor, ...inventory.equipment.charms]) {
    if (!equippedId) continue;
    const item = items.get(equippedId);
    if (item) stats = applyModifiers(stats, { attack: item.stats.attack, armor: item.stats.armor, ward: item.stats.ward, maxHealth: item.stats.health, maxFocus: item.stats.focus, will: item.stats.will });
  }
  for (const boon of boons) stats = applyModifiers(stats, boon.stats);
  return stats;
}
