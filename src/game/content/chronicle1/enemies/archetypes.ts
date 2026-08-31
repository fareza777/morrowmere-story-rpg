import { deepFreeze } from '../builders';
import type {
  Chronicle1EnemyArchetype,
  EnemyCompatibilityTag,
  EnemyStatusInteraction,
} from './types';

const portraits = (archetypeId: string) => [
  `enemy-portrait-${archetypeId}-01`,
  `enemy-portrait-${archetypeId}-02`,
  `enemy-portrait-${archetypeId}-03`,
  `enemy-portrait-${archetypeId}-04`,
] as const;

const status = (
  statusId: EnemyStatusInteraction['statusId'],
  relation: EnemyStatusInteraction['relation'],
  detail: string,
): EnemyStatusInteraction => ({ statusId, relation, detail });

const roleTags = {
  defender: ['frontline'] as const,
  assassin: ['mobile'] as const,
  archer: ['backline', 'ranged'] as const,
  shaman: ['arcane', 'support'] as const,
  controller: ['arcane', 'hard-control'] as const,
  summoner: ['arcane', 'summons'] as const,
  commander: ['frontline', 'leader'] as const,
  specialist: ['specialist'] as const,
};

const incompatibleForRole = {
  defender: [] as const,
  assassin: [] as const,
  archer: [] as const,
  shaman: [] as const,
  controller: ['hard-control', 'summons'] as const,
  summoner: ['hard-control', 'summons'] as const,
  commander: ['leader'] as const,
  specialist: [] as const,
};

function archetype(
  source: Omit<Chronicle1EnemyArchetype, 'portraitIds' | 'compatibilityTags' | 'incompatibleTags'> & {
    readonly compatibilityTags?: readonly EnemyCompatibilityTag[];
    readonly incompatibleTags?: readonly EnemyCompatibilityTag[];
  },
): Chronicle1EnemyArchetype {
  return {
    ...source,
    compatibilityTags: [...roleTags[source.role], ...(source.compatibilityTags ?? [])],
    incompatibleTags: [...incompatibleForRole[source.role], ...(source.incompatibleTags ?? [])],
    portraitIds: portraits(source.id),
  };
}

export const CHRONICLE1_ARCHETYPES = deepFreeze([
  archetype({
    id: 'goblin-cutpurse', baseName: 'Goblin Cutpurse', species: 'goblin', region: 'gloamwood',
    eligibleRegions: ['gloamwood', 'drowned-road', 'crownless-keep'], role: 'assassin',
    compatibilityTags: ['expeditionary', 'false-flag'],
    statusInteractions: [status('marked', 'exploits', 'A marked target cannot hide the hand reaching for its belt or evidence case.')],
    battlefieldRule: 'It circles exposed targets and retreats when a defender closes the lane.',
  }),
  archetype({
    id: 'goblin-torchling', baseName: 'Goblin Torchling', species: 'goblin', region: 'embervault',
    eligibleRegions: ['gloamwood', 'drowned-road', 'embervault', 'crownless-keep'], role: 'archer',
    compatibilityTags: ['expeditionary', 'fire'],
    statusInteractions: [status('burning', 'applies', 'Its cinder flask starts a short burn that guarding can contain.')],
    battlefieldRule: 'It telegraphs a cinder throw before attacking from behind a sturdier ally.',
  }),
  archetype({
    id: 'orc-freeblade', baseName: 'Orc Freeblade', species: 'orc', region: 'drowned-road',
    eligibleRegions: ['gloamwood', 'drowned-road', 'crownless-keep'], role: 'specialist',
    compatibilityTags: ['expeditionary'],
    statusInteractions: [status('guard-broken', 'exploits', 'It answers a broken guard with one committed but clearly telegraphed strike.')],
    battlefieldRule: 'It changes between measured guard and a heavy oath-strike instead of attacking blindly.',
  }),
  archetype({
    id: 'orc-hexcaller', baseName: 'Orc Hexcaller', species: 'orc', region: 'crownless-keep',
    eligibleRegions: ['drowned-road', 'crownless-keep'], role: 'summoner',
    compatibilityTags: ['expeditionary'],
    statusInteractions: [status('silenced', 'resists', 'Ancestor signs still grant defense, but silence prevents another smoke summons.')],
    battlefieldRule: 'It can call one smoke ally, after which its ward and direct hexes become the threat.',
  }),
  archetype({
    id: 'iron-deserter', baseName: 'Iron Deserter', species: 'human', region: 'drowned-road',
    eligibleRegions: ['gloamwood', 'drowned-road', 'embervault', 'crownless-keep'], role: 'defender',
    compatibilityTags: ['expeditionary', 'false-flag'],
    statusInteractions: [status('staggered', 'resists', 'Heavy plate shortens the first stagger, while a second break opens the shield line.')],
    battlefieldRule: 'It occupies the front rank and guards whichever ally carries orders or evidence.',
  }),
  archetype({
    id: 'black-banner', baseName: 'Black Banner Reaver', species: 'human', region: 'crownless-keep',
    eligibleRegions: ['gloamwood', 'drowned-road', 'embervault', 'crownless-keep'], role: 'assassin',
    compatibilityTags: ['elite', 'expeditionary', 'false-flag'],
    statusInteractions: [status('bleeding', 'exploits', 'It presses a bleeding target, but loses that bonus when the wound is treated.')],
    battlefieldRule: 'It abandons formation to finish a weakened witness or isolated combatant.',
  }),
  archetype({
    id: 'ash-magus', baseName: 'Ash Magus', species: 'mage', region: 'embervault',
    eligibleRegions: ['gloamwood', 'embervault', 'crownless-keep'], role: 'shaman',
    compatibilityTags: ['expeditionary', 'fire'],
    statusInteractions: [status('burning', 'applies', 'Witchfire extends an existing burn but cannot stack it without limit.')],
    battlefieldRule: 'It drains focus with a named hex, then pauses to rebuild its ward instead of chaining control.',
  }),
  archetype({
    id: 'mire-enchantress', baseName: 'Mire Enchantress', species: 'mage', region: 'drowned-road',
    eligibleRegions: ['gloamwood', 'drowned-road'], role: 'controller',
    compatibilityTags: ['water'],
    statusInteractions: [status('hindered', 'applies', 'Its drowning word hinders once; the status must expire before it can be renewed.')],
    battlefieldRule: 'It controls one lane with a visible rain-knot and never appears beside another hard controller.',
  }),
  archetype({
    id: 'gloam-warg', baseName: 'Gloam Warg', species: 'beast', region: 'gloamwood',
    eligibleRegions: ['gloamwood', 'drowned-road', 'embervault'], role: 'assassin',
    compatibilityTags: ['beast', 'mobile'],
    statusInteractions: [status('marked', 'resists', 'A mark removes its concealment but not the speed of its next lunge.')],
    battlefieldRule: 'It circles until an ally creates an opening, then lunges at the least protected target.',
  }),
  archetype({
    id: 'marsh-crawler', baseName: 'Marsh Crawler', species: 'beast', region: 'drowned-road',
    eligibleRegions: ['drowned-road'], role: 'defender',
    compatibilityTags: ['beast', 'water'],
    statusInteractions: [status('guard-broken', 'resists', 'Breaking one plate lowers armor without removing the creature from the lane.')],
    battlefieldRule: 'It blocks narrow banks with its shell while quicker enemies attack around it.',
  }),
  archetype({
    id: 'bridge-troll', baseName: 'Bridge Troll', species: 'troll', region: 'drowned-road',
    eligibleRegions: ['drowned-road'], role: 'specialist',
    compatibilityTags: ['water'],
    statusInteractions: [status('burning', 'resists', 'Fire pauses one recovery intent rather than dealing an unbounded regeneration penalty.')],
    battlefieldRule: 'It signals a recovery breath that can be interrupted before health returns.',
  }),
  archetype({
    id: 'cinder-troll', baseName: 'Cinder Troll', species: 'troll', region: 'embervault',
    eligibleRegions: ['embervault'], role: 'specialist',
    compatibilityTags: ['fire'],
    statusInteractions: [status('burning', 'resists', 'Ordinary fire cannot ignite it, while stagger still interrupts a molten charge.')],
    battlefieldRule: 'It builds toward one molten charge and exposes its cracked flank while recovering.',
  }),
  archetype({
    id: 'abbey-golem', baseName: 'Abbey Golem', species: 'construct', region: 'crownless-keep',
    eligibleRegions: ['gloamwood', 'crownless-keep'], role: 'defender',
    compatibilityTags: ['construct'],
    statusInteractions: [status('bleeding', 'resists', 'It cannot bleed, but guard-breaking blows open its command plates.')],
    battlefieldRule: 'It guards a fixed objective and turns slowly enough for a mobile flank to remain viable.',
  }),
  archetype({
    id: 'vault-gargoyle', baseName: 'Vault Gargoyle', species: 'construct', region: 'embervault',
    eligibleRegions: ['gloamwood', 'embervault', 'crownless-keep'], role: 'archer',
    compatibilityTags: ['construct', 'expeditionary'],
    statusInteractions: [status('marked', 'exploits', 'Its stone-wing shot gains accuracy against a marked target but remains telegraphed.')],
    battlefieldRule: 'It fires over guards from a fixed perch and loses that advantage when staggered.',
  }),
  archetype({
    id: 'barrow-soldier', baseName: 'Barrow Soldier', species: 'undead', region: 'gloamwood',
    eligibleRegions: ['gloamwood', 'drowned-road', 'crownless-keep'], role: 'commander',
    compatibilityTags: ['undead'],
    statusInteractions: [status('silenced', 'resists', 'Silence stops its drill call, but the dead soldier keeps its own guarded stance.')],
    battlefieldRule: 'Its guard intent strengthens one living ally, so breaking command changes the whole group.',
  }),
  archetype({
    id: 'rain-wraith', baseName: 'Black Rain Wraith', species: 'undead', region: 'drowned-road',
    eligibleRegions: ['drowned-road'], role: 'assassin',
    compatibilityTags: ['undead', 'water'],
    statusInteractions: [status('marked', 'resists', 'A mark fixes its outline in view and removes the safest route for its next strike.')],
    battlefieldRule: 'It slips past armor toward low-ward targets but cannot hide after being marked.',
  }),
  archetype({
    id: 'thorn-penitent', baseName: 'Thorn Penitent', species: 'cultist', region: 'gloamwood',
    eligibleRegions: ['gloamwood', 'crownless-keep'], role: 'controller',
    compatibilityTags: ['expeditionary'],
    statusInteractions: [status('hindered', 'applies', 'Its thorn line hinders movement once and then must be reset in plain view.')],
    battlefieldRule: 'It narrows one route with thorns while leaving a slower but safe route open.',
  }),
  archetype({
    id: 'bell-apostle', baseName: 'Bell Apostle', species: 'cultist', region: 'crownless-keep',
    eligibleRegions: ['gloamwood', 'crownless-keep'], role: 'controller',
    compatibilityTags: ['expeditionary'],
    statusInteractions: [status('hindered', 'applies', 'A clearly raised hand bell precedes the hindering toll and permits a guard response.')],
    battlefieldRule: 'It tolls only after a full telegraph and cannot renew control while hindered remains active.',
  }),
  archetype({
    id: 'ember-fiend', baseName: 'Ember Fiend', species: 'demon', region: 'embervault',
    eligibleRegions: ['embervault'], role: 'summoner',
    compatibilityTags: ['fire'],
    statusInteractions: [status('silenced', 'exploits', 'A silence collapses its smoke minion and leaves the fiend exposed for one exchange.')],
    battlefieldRule: 'It spends one summon before relying on direct claws and a weakening hex.',
  }),
  archetype({
    id: 'crown-devil', baseName: 'Crown Devil', species: 'demon', region: 'crownless-keep',
    eligibleRegions: ['crownless-keep'], role: 'commander',
    compatibilityTags: ['elite'],
    statusInteractions: [status('guard-broken', 'exploits', 'Its command strike punishes a broken guard but never ignores an intact defense.')],
    battlefieldRule: 'It strengthens one subordinate at a time and exposes itself whenever it issues the order.',
  }),
] as const);

export const ENEMY_PORTRAIT_IDS = deepFreeze(
  CHRONICLE1_ARCHETYPES.flatMap((entry) => entry.portraitIds),
);
