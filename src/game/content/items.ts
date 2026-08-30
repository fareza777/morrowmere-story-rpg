import { createRng } from '../rng';
import type { HeroClass, ItemCategory, ItemDefinition, ItemStats, RewardContext } from '../types';

const ALL_CLASSES: readonly HeroClass[] = ['warrior', 'mage', 'warden'];

function defineItem(
  id: string,
  name: string,
  category: ItemCategory,
  description: string,
  allowedClasses: readonly HeroClass[],
  stats: ItemStats,
  value: number,
  tags: readonly string[],
): ItemDefinition {
  return Object.freeze({ id, name, category, description, allowedClasses, stats, value, tags });
}

const WEAPONS = [
  defineItem('weapon-rust-sword', 'Rust-Eaten Sword', 'weapon', 'A nicked soldier blade that still remembers the weight of honest work.', ['warrior', 'warden'], { attack: 2 }, 16, ['blade']),
  defineItem('weapon-boar-cleaver', 'Boar Cleaver', 'weapon', 'A forward-heavy cleaver made for hide, bone, and crowded woodland paths.', ['warrior'], { attack: 4 }, 30, ['blade', 'heavy']),
  defineItem('weapon-abbey-longsword', 'Abbey Longsword', 'weapon', 'A severe iron sword balanced for disciplined cuts behind a raised guard.', ['warrior'], { attack: 5, armor: 1 }, 46, ['blade', 'abbey']),
  defineItem('weapon-orc-falchion', 'Free Host Falchion', 'weapon', 'A broad orcish blade with three oath notches cut below the guard.', ['warrior', 'warden'], { attack: 5 }, 48, ['blade', 'orc']),
  defineItem('weapon-kingbreaker', 'Kingbreaker Maul', 'weapon', 'A blackened war maul built to make armor regret its confidence.', ['warrior'], { attack: 7 }, 68, ['heavy', 'relic']),
  defineItem('weapon-ash-wand', 'Ashwood Wand', 'weapon', 'A warm wand that coaxes small flames from the memory of a forest.', ['mage'], { will: 3 }, 18, ['focus', 'fire']),
  defineItem('weapon-mire-staff', 'Mireglass Staff', 'weapon', 'Green glass in its head bends hexes away from their intended victims.', ['mage'], { will: 4, ward: 1 }, 34, ['focus', 'mire']),
  defineItem('weapon-bell-rod', 'Silent Bell Rod', 'weapon', 'A silver rod that vibrates whenever an unseen spirit draws breath.', ['mage'], { will: 5, focus: 2 }, 49, ['focus', 'undead']),
  defineItem('weapon-cinder-crook', 'Cinder Crook', 'weapon', 'A furnace-priest crook whose hook keeps a patient ember alive.', ['mage'], { will: 6 }, 56, ['focus', 'fire']),
  defineItem('weapon-black-grimoire', 'Black-Rain Grimoire', 'weapon', 'Water-stained pages teach the reader to wound a shadow before its owner.', ['mage'], { will: 7, ward: 1 }, 72, ['focus', 'relic']),
  defineItem('weapon-hunter-bow', 'Gloamwood Bow', 'weapon', 'A short yew bow wrapped in waxed cord for wet and silent country.', ['warden'], { attack: 3 }, 20, ['ranged', 'wood']),
  defineItem('weapon-marsh-spear', 'Marsh-Reed Spear', 'weapon', 'A flexible ash spear that finds footing where its wielder cannot.', ['warden', 'warrior'], { attack: 4, armor: 1 }, 37, ['polearm', 'mire']),
  defineItem('weapon-twin-knives', 'Widowmaker Knives', 'weapon', 'Paired skinning knives weighted for a fast throw or a final mercy.', ['warden'], { attack: 5 }, 45, ['blade', 'ranged']),
  defineItem('weapon-oath-crossbow', 'Oathstring Crossbow', 'weapon', 'A compact crossbow whose brass trigger bears a deliberately filed crest.', ['warden'], { attack: 6 }, 58, ['ranged', 'abbey']),
  defineItem('weapon-last-tooth', 'The Last Iron Tooth', 'weapon', 'The broken Crown shard drinks rain and hums when danger approaches.', ALL_CLASSES, { attack: 5, will: 5 }, 90, ['relic', 'crown']),
] as const;

const ARMOR = [
  defineItem('armor-patched-mail', 'Patched Mail', 'armor', 'Three generations of repairs have made this shirt ugly and dependable.', ['warrior', 'warden'], { armor: 3, health: 4 }, 22, ['mail']),
  defineItem('armor-abbey-plate', 'Iron Abbey Plate', 'armor', 'Black plate with the prayer scratches polished away by a deserter.', ['warrior'], { armor: 6, health: 6 }, 60, ['plate', 'abbey']),
  defineItem('armor-orc-lamellar', 'Orcish Lamellar', 'armor', 'Overlapping horn plates turn deep cuts into bruises and useful anger.', ['warrior', 'warden'], { armor: 5 }, 48, ['plate', 'orc']),
  defineItem('armor-trollhide', 'Trollhide Coat', 'armor', 'Thick hide closes shallow rents when warmed beside a living fire.', ['warrior'], { armor: 4, health: 12 }, 64, ['hide', 'troll']),
  defineItem('armor-crown-guard', 'Crown Guard Harness', 'armor', 'A royal harness made before ceremonial armor forgot it was armor.', ['warrior'], { armor: 7, ward: 2 }, 82, ['plate', 'relic']),
  defineItem('armor-sage-robes', 'Ash-Sage Robes', 'armor', 'Layered grey wool holds protective chalk without smearing the sigils.', ['mage'], { ward: 4, focus: 4 }, 26, ['cloth', 'magic']),
  defineItem('armor-mire-silk', 'Miresilk Mantle', 'armor', 'Water rolls from this green-black silk without ever touching the weave.', ['mage'], { ward: 5 }, 40, ['cloth', 'mire']),
  defineItem('armor-bell-vestment', 'Bellkeeper Vestment', 'armor', 'A sleeveless vest stitched with tiny mute bells and silver thread.', ['mage'], { ward: 6, health: 4 }, 56, ['cloth', 'abbey']),
  defineItem('armor-emberweave', 'Emberweave Robe', 'armor', 'Copper wire through dark linen grounds the worst excesses of witchfire.', ['mage'], { ward: 7 }, 68, ['cloth', 'fire']),
  defineItem('armor-rain-shroud', 'Black-Rain Shroud', 'armor', 'A dry funeral shroud that makes hostile magic briefly forget your name.', ['mage'], { ward: 8, armor: 1 }, 84, ['cloth', 'relic']),
  defineItem('armor-ranger-leathers', 'Gloam Ranger Leathers', 'armor', 'Waxed leather and quiet buckles reward movement without surrendering cover.', ['warden'], { armor: 3, ward: 1 }, 28, ['leather', 'wood']),
  defineItem('armor-marshcloak', 'Marshwalker Cloak', 'armor', 'A reed-lined cloak masks heat, scent, and the small betrayals of breath.', ['warden'], { armor: 2, ward: 3 }, 42, ['leather', 'mire']),
  defineItem('armor-warg-pelt', 'Night Warg Pelt', 'armor', 'The fur rises before an ambush and settles only after blood is drawn.', ['warden'], { armor: 4, health: 5 }, 54, ['hide', 'beast']),
  defineItem('armor-free-host', 'Free Host Brigandine', 'armor', 'Riveted plates under red cloth allow a scout to survive a soldier fight.', ['warden', 'warrior'], { armor: 5, ward: 1 }, 66, ['mail', 'orc']),
  defineItem('armor-wayfarer', 'Crownless Wayfarer Coat', 'armor', 'Hidden pockets hold maps, remedies, and one letter never delivered.', ALL_CLASSES, { armor: 3, ward: 3, health: 6 }, 76, ['leather', 'relic']),
] as const;

const CHARMS = [
  defineItem('charm-wolf-tooth', 'Wolf-Tooth Token', 'charm', 'A pierced fang worn by travelers who would rather be feared than followed.', ALL_CLASSES, { attack: 1, health: 3 }, 18, ['beast']),
  defineItem('charm-mute-bell', 'Mute Bell', 'charm', 'A bell without a clapper that grows cold near restless dead things.', ALL_CLASSES, { ward: 2 }, 22, ['undead']),
  defineItem('charm-orc-knot', 'Orcish Oath Knot', 'charm', 'Red cord records a promise through a pattern no outsider can untie.', ALL_CLASSES, { armor: 1, ward: 1 }, 24, ['orc']),
  defineItem('charm-cinder-coin', 'Cinder Coin', 'charm', 'A royal coin burned blank on both faces but warm along its edge.', ALL_CLASSES, { will: 2 }, 28, ['fire']),
  defineItem('charm-saint-bone', 'Unburied Saint Bone', 'charm', 'A finger bone wrapped in petitions nobody at the Abbey answered.', ALL_CLASSES, { health: 6 }, 30, ['abbey']),
  defineItem('charm-mire-eye', 'Mireglass Eye', 'charm', 'Green glass reveals the ripple left by a lie moving through a room.', ['mage', 'warden'], { focus: 3, ward: 1 }, 34, ['mire']),
  defineItem('charm-iron-psalm', 'Iron Psalm', 'charm', 'A prayer hammered into a thin plate for soldiers who cannot read.', ['warrior'], { armor: 2, health: 4 }, 36, ['abbey']),
  defineItem('charm-raven-pin', 'Raven Pin', 'charm', 'A black pin traded among scouts who return from impossible routes.', ['warden'], { attack: 2, focus: 2 }, 38, ['wood']),
  defineItem('charm-witch-ring', 'Witch-Ring', 'charm', 'The inner inscription changes whenever its wearer dreams of rain.', ['mage'], { will: 2, ward: 2 }, 42, ['magic']),
  defineItem('charm-troll-heart', 'Troll-Heart Bead', 'charm', 'A resin bead pulses once at dawn and strengthens stubborn flesh.', ['warrior', 'warden'], { health: 10 }, 48, ['troll']),
  defineItem('charm-crown-splinter', 'Crown Splinter', 'charm', 'A black thorn of royal iron that points toward the nearest betrayal.', ALL_CLASSES, { attack: 2, will: 2, ward: 1 }, 70, ['crown', 'relic']),
  defineItem('charm-empty-signet', 'The Empty Signet', 'charm', 'A royal signet with no crest and no rightful finger left to claim it.', ALL_CLASSES, { armor: 2, ward: 2, health: 5 }, 80, ['crown', 'relic']),
] as const;

const CONSUMABLES = [
  defineItem('potion-red', 'Red Mercy', 'potion', 'A bitter field tonic that closes wounds and leaves the tongue numb.', ALL_CLASSES, { health: 12 }, 12, ['healing']),
  defineItem('potion-witchlight', 'Witchlight Draught', 'potion', 'Blue liquid restores focus while making every nearby shadow look attentive.', ALL_CLASSES, { focus: 8 }, 14, ['focus']),
  defineItem('potion-bark', 'Barkskin Tincture', 'potion', 'A resinous swallow that hardens the skin until the next hard blow.', ALL_CLASSES, { armor: 3 }, 16, ['defense']),
  defineItem('potion-silver', 'Silverwater', 'potion', 'Blessed rainwater clears a minor hex and stings every old regret.', ALL_CLASSES, { ward: 3 }, 16, ['cleanse']),
  defineItem('potion-troll', 'Trollblood Cordial', 'potion', 'A smoking green dose restores flesh and tests the courage of the stomach.', ALL_CLASSES, { health: 20 }, 24, ['healing', 'troll']),
  defineItem('potion-ember', 'Ember Oil', 'potion', 'Thrown or swallowed, this oil makes the next act dangerously decisive.', ALL_CLASSES, { attack: 3, will: 3 }, 25, ['fire']),
  defineItem('potion-mist', 'Mistwalker Phial', 'potion', 'Grey vapor loosens footprints from mud and attention from the mind.', ALL_CLASSES, { focus: 5 }, 22, ['escape']),
  defineItem('potion-orc', 'Free Host Bitter', 'potion', 'An orc campaign brew that turns exhaustion into a problem for tomorrow.', ALL_CLASSES, { health: 10, focus: 4 }, 23, ['orc']),
  defineItem('potion-black-rain', 'Black Rain Vial', 'potion', 'Captured rain grants violent insight at a cost the label refuses to name.', ALL_CLASSES, { attack: 4, will: 4 }, 36, ['corruption']),
  defineItem('scroll-sparks', 'Scroll of Seven Sparks', 'scroll', 'A cheap battle scroll that releases seven sparks and six useful distractions.', ALL_CLASSES, { will: 3 }, 18, ['fire']),
  defineItem('scroll-ward', 'Scroll of the Closed Door', 'scroll', 'A geometric ward briefly persuades hostile sorcery that nobody is home.', ALL_CLASSES, { ward: 4 }, 20, ['defense']),
  defineItem('scroll-thorns', 'Scroll of Briar Law', 'scroll', 'Green script commands roots and grudges to hold a target in place.', ALL_CLASSES, { attack: 2, will: 2 }, 24, ['wood']),
] as const;

const QUEST_ITEMS = [
  defineItem('quest-iron-tooth', 'Iron Crown Tooth', 'quest', 'One of five royal thorns, black with rain and heavy with unfinished vows.', ALL_CLASSES, {}, 0, ['crown', 'key']),
  defineItem('quest-abbey-seal', 'Broken Abbey Seal', 'quest', 'A lead seal proves the Abbey knew the rain would fall before it did.', ALL_CLASSES, {}, 0, ['abbey', 'evidence']),
  defineItem('quest-orc-banner', 'Red Banner Fragment', 'quest', 'A torn banner carries names of orc dead omitted from the royal histories.', ALL_CLASSES, {}, 0, ['orc', 'evidence']),
  defineItem('quest-pale-letter', 'Conclave Cipher', 'quest', 'A waxed letter describes the Crown as a cage rather than a throne.', ALL_CLASSES, {}, 0, ['magic', 'evidence']),
  defineItem('quest-rain-map', 'Rain-Swollen Map', 'quest', 'Ink rivers converge on a road that no surviving mapmaker remembers.', ALL_CLASSES, {}, 0, ['map', 'key']),
  defineItem('quest-king-name', 'The King’s True Name', 'quest', 'Three syllables on funerary bark can command a crown or release a ghost.', ALL_CLASSES, {}, 0, ['crown', 'key']),
] as const;

export const ITEMS: readonly ItemDefinition[] = Object.freeze([
  ...WEAPONS,
  ...ARMOR,
  ...CHARMS,
  ...CONSUMABLES,
  ...QUEST_ITEMS,
]);

export function generateItemReward(context: RewardContext): ItemDefinition[] {
  const rng = createRng(context.seed ^ (context.level * 0x9e3779b9));
  const classRelevant = ITEMS.filter(
    (item) =>
      item.category === 'weapon' &&
      item.allowedClasses.includes(context.heroClass) &&
      !item.tags.includes('crown'),
  );
  const defensive = ITEMS.filter(
    (item) =>
      item.category !== 'quest' &&
      (Boolean(item.stats.armor) || Boolean(item.stats.ward) || Boolean(item.stats.health)),
  );
  const flexible = ITEMS.filter(
    (item) => item.category === 'charm' || item.category === 'potion' || item.category === 'scroll',
  );
  const first = rng.pick(classRelevant);
  const second = rng.pick(defensive.filter((item) => item.id !== first.id));
  const third = rng.pick(flexible.filter((item) => item.id !== first.id && item.id !== second.id));
  return [first, second, third];
}
