import type {
  EnemyDefinition,
  EnemyIntent,
  EnemySpecies,
  RegionId,
} from '../types';

interface EnemyArchetype {
  readonly id: string;
  readonly baseName: string;
  readonly species: EnemySpecies;
  readonly region: RegionId;
  readonly baseHealth: number;
  readonly baseAttack: number;
  readonly baseArmor: number;
  readonly baseWard: number;
  readonly intents: Readonly<Partial<Record<EnemyIntent, number>>>;
  readonly traits: readonly string[];
  readonly rewardTags: readonly string[];
  readonly lore: string;
  readonly artFamily: string;
  readonly levelOffset?: number;
}

const ARCHETYPES: readonly EnemyArchetype[] = [
  { id: 'goblin-cutpurse', baseName: 'Goblin Cutpurse', species: 'goblin', region: 'gloamwood', baseHealth: 18, baseAttack: 5, baseArmor: 0, baseWard: 0, intents: { strike: 5, guard: 2, flee: 1 }, traits: ['Quick Hands'], rewardTags: ['gold', 'knife'], lore: 'A roadside thief who learned courtly manners from the corpses of courtiers.', artFamily: 'goblin' },
  { id: 'goblin-torchling', baseName: 'Goblin Torchling', species: 'goblin', region: 'embervault', baseHealth: 20, baseAttack: 6, baseArmor: 0, baseWard: 1, intents: { strike: 3, heavy: 2, hex: 1 }, traits: ['Cinder Flask'], rewardTags: ['fire', 'supply'], lore: 'A soot-streaked raider carrying a flame that whispers the names of houses.', artFamily: 'goblin' },
  { id: 'orc-freeblade', baseName: 'Orc Freeblade', species: 'orc', region: 'drowned-road', baseHealth: 32, baseAttack: 7, baseArmor: 2, baseWard: 0, intents: { strike: 4, heavy: 3, guard: 2 }, traits: ['Honor Bound'], rewardTags: ['blade', 'armor'], lore: 'A mercenary of the Free Host who sells strength but never a sworn promise.', artFamily: 'orc' },
  { id: 'orc-hexcaller', baseName: 'Orc Hexcaller', species: 'orc', region: 'crownless-keep', baseHealth: 25, baseAttack: 5, baseArmor: 1, baseWard: 4, intents: { hex: 4, guard: 2, recover: 1 }, traits: ['Ancestor Smoke'], rewardTags: ['charm', 'scroll'], lore: 'An orc seer whose smoke-braids carry the counsel of unquiet ancestors.', artFamily: 'orc' },
  { id: 'iron-deserter', baseName: 'Iron Deserter', species: 'human', region: 'drowned-road', baseHealth: 29, baseAttack: 7, baseArmor: 4, baseWard: 0, intents: { strike: 3, heavy: 2, guard: 3 }, traits: ['Shield Wall'], rewardTags: ['armor', 'supply'], lore: 'A former abbey soldier who kept the armor and abandoned the certainty.', artFamily: 'warrior' },
  { id: 'black-banner', baseName: 'Black Banner Reaver', species: 'human', region: 'crownless-keep', baseHealth: 34, baseAttack: 8, baseArmor: 3, baseWard: 1, intents: { strike: 3, heavy: 4, guard: 1 }, traits: ['Executioner'], rewardTags: ['weapon', 'gold'], lore: 'A veteran who marches beneath a banner cut from a royal funeral cloth.', artFamily: 'warrior' },
  { id: 'ash-magus', baseName: 'Ash Magus', species: 'mage', region: 'embervault', baseHealth: 22, baseAttack: 6, baseArmor: 0, baseWard: 5, intents: { hex: 4, heavy: 2, recover: 1 }, traits: ['Witchfire'], rewardTags: ['scroll', 'charm'], lore: 'A court scholar burned hollow by the first answer the Crown ever gave.', artFamily: 'mage' },
  { id: 'mire-enchantress', baseName: 'Mire Enchantress', species: 'mage', region: 'drowned-road', baseHealth: 24, baseAttack: 5, baseArmor: 0, baseWard: 6, intents: { hex: 5, guard: 2, recover: 2 }, traits: ['Drowning Word'], rewardTags: ['potion', 'scroll'], lore: 'A bog witch who knots rainwater into curses and memories into medicine.', artFamily: 'mage' },
  { id: 'gloam-warg', baseName: 'Gloam Warg', species: 'beast', region: 'gloamwood', baseHealth: 28, baseAttack: 8, baseArmor: 1, baseWard: 0, intents: { strike: 5, heavy: 2, flee: 1 }, traits: ['Pack Hunter'], rewardTags: ['hide', 'fang'], lore: 'A long-legged forest predator trained to follow the scent of broken oaths.', artFamily: 'beast' },
  { id: 'marsh-crawler', baseName: 'Marsh Crawler', species: 'beast', region: 'drowned-road', baseHealth: 36, baseAttack: 6, baseArmor: 4, baseWard: 1, intents: { strike: 3, guard: 3, recover: 1 }, traits: ['Chitinous'], rewardTags: ['shell', 'potion'], lore: 'A plated scavenger grown enormous on drowned horses and silver runoff.', artFamily: 'beast' },
  { id: 'bridge-troll', baseName: 'Bridge Troll', species: 'troll', region: 'drowned-road', baseHealth: 48, baseAttack: 9, baseArmor: 2, baseWard: 1, intents: { heavy: 4, strike: 2, recover: 3 }, traits: ['Regeneration'], rewardTags: ['hide', 'gold'], lore: 'A toll-keeper older than the road, patient enough to collect from ghosts.', artFamily: 'troll' },
  { id: 'cinder-troll', baseName: 'Cinder Troll', species: 'troll', region: 'embervault', baseHealth: 44, baseAttack: 10, baseArmor: 3, baseWard: 2, intents: { heavy: 4, strike: 3, guard: 1 }, traits: ['Molten Blood'], rewardTags: ['fire', 'ore'], lore: 'A furnace-fed brute whose cracked skin shines like a banked forge.', artFamily: 'troll' },
  { id: 'abbey-golem', baseName: 'Abbey Golem', species: 'construct', region: 'crownless-keep', baseHealth: 45, baseAttack: 8, baseArmor: 7, baseWard: 2, intents: { strike: 2, heavy: 3, guard: 4 }, traits: ['Unliving Plate'], rewardTags: ['ore', 'armor'], lore: 'A prayer engine of iron and bone that remembers only the final command.', artFamily: 'construct' },
  { id: 'vault-gargoyle', baseName: 'Vault Gargoyle', species: 'construct', region: 'embervault', baseHealth: 33, baseAttack: 8, baseArmor: 5, baseWard: 4, intents: { strike: 3, guard: 3, hex: 2 }, traits: ['Stone Wings'], rewardTags: ['gem', 'charm'], lore: 'A carved sentinel awakened whenever mortal greed outshouts good sense.', artFamily: 'construct' },
  { id: 'barrow-soldier', baseName: 'Barrow Soldier', species: 'undead', region: 'gloamwood', baseHealth: 30, baseAttack: 7, baseArmor: 3, baseWard: 2, intents: { strike: 4, guard: 2, heavy: 1 }, traits: ['Deathless Drill'], rewardTags: ['weapon', 'bone'], lore: 'A dead levy still waiting for a king to dismiss it from service.', artFamily: 'undead' },
  { id: 'rain-wraith', baseName: 'Black Rain Wraith', species: 'undead', region: 'drowned-road', baseHealth: 24, baseAttack: 7, baseArmor: 0, baseWard: 7, intents: { hex: 4, strike: 2, recover: 1 }, traits: ['Incorporeal'], rewardTags: ['essence', 'charm'], lore: 'A human outline left behind when the rain washed everything else away.', artFamily: 'undead' },
  { id: 'thorn-penitent', baseName: 'Thorn Penitent', species: 'cultist', region: 'gloamwood', baseHealth: 27, baseAttack: 7, baseArmor: 2, baseWard: 3, intents: { strike: 3, hex: 2, guard: 2 }, traits: ['Pain Litany'], rewardTags: ['supply', 'charm'], lore: 'A masked believer who counts each wound as another royal blessing.', artFamily: 'cultist' },
  { id: 'bell-apostle', baseName: 'Bell Apostle', species: 'cultist', region: 'crownless-keep', baseHealth: 29, baseAttack: 6, baseArmor: 2, baseWard: 5, intents: { hex: 4, heavy: 2, recover: 1 }, traits: ['Toll of Ruin'], rewardTags: ['scroll', 'gold'], lore: 'A final-court fanatic who hears coronation bells inside every scream.', artFamily: 'cultist' },
  { id: 'ember-fiend', baseName: 'Ember Fiend', species: 'demon', region: 'embervault', baseHealth: 31, baseAttack: 9, baseArmor: 1, baseWard: 5, intents: { strike: 3, heavy: 3, hex: 2 }, traits: ['Hellkindled'], rewardTags: ['fire', 'essence'], lore: 'A small and vicious answer to a question no sane mage should ask.', artFamily: 'demon' },
  { id: 'crown-devil', baseName: 'Crown Devil', species: 'demon', region: 'crownless-keep', baseHealth: 40, baseAttack: 10, baseArmor: 4, baseWard: 6, intents: { strike: 2, heavy: 3, hex: 3, guard: 1 }, traits: ['Royal Malice'], rewardTags: ['relic', 'gem'], lore: 'A horned courtier dressed in the shadow cast by an empty throne.', artFamily: 'demon' },
  { id: 'siege-cart-maw', baseName: 'Siege Cart-Maw', species: 'beast', region: 'gloamwood', baseHealth: 38, baseAttack: 7, baseArmor: 4, baseWard: 1, intents: { strike: 3, heavy: 2, guard: 4, recover: 1 }, traits: ['Chain Mantle'], rewardTags: ['hide', 'tooth', 'siege'], lore: 'A road beast scarred by an old siege wreck, sheltering beneath chained timber and collecting iron from passing carts.', artFamily: 'beast', levelOffset: 1 },
] as const;

const RANK_TITLES = [
  'Wretched',
  'Ragged',
  'Scarred',
  'Blooded',
  'Veteran',
  'Dread',
  'Black',
  'Elder',
  'Exalted',
  'Doomed',
] as const;

export const ENEMIES: readonly EnemyDefinition[] = Object.freeze(
  ARCHETYPES.flatMap((archetype, archetypeIndex) =>
    RANK_TITLES.map((title, rankIndex) => {
      const rank = rankIndex + 1;
      const level = Math.min(12, rank + (archetype.levelOffset ?? Math.floor(archetypeIndex / 5)));
      return Object.freeze({
        id: `${archetype.id}-${rank.toString().padStart(2, '0')}`,
        archetypeId: archetype.id,
        name: `${title} ${archetype.baseName}`,
        rank,
        level,
        species: archetype.species,
        region: archetype.region,
        maxHealth: archetype.baseHealth + rankIndex * 8 + Math.floor(rankIndex / 3) * 3,
        attack: archetype.baseAttack + Math.floor(rankIndex * 0.8),
        armor: archetype.baseArmor + Math.floor(rankIndex / 3),
        ward: archetype.baseWard + Math.floor(rankIndex / 3),
        intentWeights: archetype.intents,
        traits: rank >= 7 ? [...archetype.traits, 'Elite'] : archetype.traits,
        rewardTags: archetype.rewardTags,
        description: `${archetype.lore} This ${title.toLowerCase()} specimen has survived ${rank} marked hunts.`,
        artFamily: archetype.artFamily,
      });
    }),
  ),
);

export const ENEMY_ARCHETYPE_COUNT = ARCHETYPES.length;
