import type { EventChoice, EventEffect, RegionId, SkillStat } from '../types';

export type EventTone = 'ominous' | 'violent' | 'mournful' | 'mystic' | 'hopeful';

export interface StoryEvent {
  readonly id: string;
  readonly family: string;
  readonly title: string;
  readonly region: RegionId;
  readonly tone: EventTone;
  readonly weight: number;
  readonly requiredFlags: readonly string[];
  readonly excludedFlags: readonly string[];
  readonly opening: string;
  readonly bodyVariants: readonly [string, string];
  readonly actors: readonly [string, string];
  readonly locations: readonly [string, string];
  readonly weathers: readonly [string, string];
  readonly choices: readonly EventChoice[];
}

interface Blueprint {
  readonly id: string;
  readonly family: string;
  readonly region: RegionId;
  readonly title: string;
  readonly tone: EventTone;
  readonly opening: string;
  readonly choiceA: readonly [string, string, EventEffect, string, SkillStat?, number?];
  readonly choiceB: readonly [string, string, EventEffect, string, SkillStat?, number?];
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
  readonly weight?: number;
}

const REGION_DETAILS: Record<
  RegionId,
  {
    actors: readonly [string, string];
    locations: readonly [string, string];
    weathers: readonly [string, string];
    bodies: readonly [string, string];
  }
> = {
  gloamwood: {
    actors: ['a hooded forester', 'a scarred goblin pilgrim'],
    locations: ['beneath the hanging oaks', 'beside a root-choked shrine'],
    weathers: ['under cold green rain', 'through a veil of silver moths'],
    bodies: [
      'The trees lean close enough to listen, their bark scored with old military numbers.',
      'Somewhere beyond sight, an axe falls once. No second blow follows.',
    ],
  },
  'drowned-road': {
    actors: ['an orc outrider', 'a rain-blind ferryman'],
    locations: ['on the drowned kingroad', 'at a chapel half below black water'],
    weathers: ['while the rain climbs upward', 'beneath a bruised violet dusk'],
    bodies: [
      'Floodwater hides the milestones, but each submerged stone still whispers its distance from the throne.',
      'Reeds scrape against old shields below the surface, counting the dead more patiently than any priest.',
    ],
  },
  embervault: {
    actors: ['a soot-veiled smith', 'a chained ash magus'],
    locations: ['inside the abandoned furnace cloister', 'above a river of sleeping embers'],
    weathers: ['as cinders fall like snow', 'under the red pulse of the mountain'],
    bodies: [
      'Heat moves through the stone in slow breaths, waking runes nobody remembers carving.',
      'The dark smells of hot iron, bitter herbs, and promises made where witnesses could not survive.',
    ],
  },
  'crownless-keep': {
    actors: ['a faceless abbey knight', 'a pale court envoy'],
    locations: ['in the hall of broken banners', 'beneath the empty throne tower'],
    weathers: ['while black rain drums on bronze', 'under a sky without stars'],
    bodies: [
      'Every doorway is taller than a living king and narrower than a coffin.',
      'The keep remembers ceremony: dust parts before you as though courtiers still bow.',
    ],
  },
};

function choice(
  id: string,
  definition: Blueprint['choiceA'],
): EventChoice {
  const [label, detail, effect, outcome, stat, difficulty] = definition;
  return Object.freeze({
    id,
    label,
    detail,
    ...(stat && difficulty ? { check: { stat, difficulty } } : {}),
    effect,
    outcome,
  });
}

function makeEvent(blueprint: Blueprint): StoryEvent {
  const details = REGION_DETAILS[blueprint.region];
  return Object.freeze({
    id: blueprint.id,
    family: blueprint.family,
    title: blueprint.title,
    region: blueprint.region,
    tone: blueprint.tone,
    weight: blueprint.weight ?? 10,
    requiredFlags: blueprint.requiredFlags ?? [],
    excludedFlags: blueprint.excludedFlags ?? [],
    opening: blueprint.opening,
    bodyVariants: details.bodies,
    actors: details.actors,
    locations: details.locations,
    weathers: details.weathers,
    choices: [choice(`${blueprint.id}-a`, blueprint.choiceA), choice(`${blueprint.id}-b`, blueprint.choiceB)],
  });
}

const BLUEPRINTS: readonly Blueprint[] = [
  { id: 'gloamwood-hanging-road', family: 'lost-road', region: 'gloamwood', title: 'The Road in the Branches', tone: 'ominous', opening: 'A complete cobbled road hangs thirty feet above the forest floor, tangled among branches that grew around its dead travelers.', choiceA: ['Climb to the milestones', 'Risk injury to search the impossible road.', { health: -3, gold: 12, addFlags: ['saw-hanging-road'] }, 'Among the carts you find royal coin and a map naming a road erased from every archive.', 'strength', 7], choiceB: ['Follow from below', 'Keep your footing and read where the roots point.', { focus: -1, supplies: 1 }, 'The roots guide you safely, though the dead above turn their heads to follow.'] },
  { id: 'gloamwood-widow-tree', family: 'widow-tree', region: 'gloamwood', title: 'The Widow Tree', tone: 'mournful', opening: 'A woman has sewn hundreds of wooden wedding rings into an oak. One ring bears your name.', choiceA: ['Cut out your ring', 'Reject the omen with steel.', { corruption: 1, addFlags: ['defied-widow'] }, 'Black sap follows the blade. The woman smiles as if you have answered correctly.', 'strength', 6], choiceB: ['Ask who carved it', 'Offer patience instead of violence.', { mercy: 1, faction: { conclave: 1 } }, 'She names a dead king and gives you a thread tied before your birth.'] },
  { id: 'gloamwood-goblin-snare', family: 'goblin-mercy', region: 'gloamwood', title: 'A Crown of Wire', tone: 'violent', opening: 'A young goblin hangs upside down from an abbey snare while armored hunters circle back through the ferns.', choiceA: ['Cut the goblin free', 'Gain an enemy and perhaps a debt.', { mercy: 2, addFlags: ['spared-goblin'], faction: { abbey: -1, freeHost: 1 } }, 'The goblin vanishes after pressing a brass button into your palm.', 'cunning', 6], choiceB: ['Leave the snare untouched', 'Preserve strength and avoid the hunters.', { supplies: 1, mercy: -1, faction: { abbey: 1 } }, 'You take the hunters’ abandoned pack. The wire keeps creaking long after the road turns.'] },
  { id: 'gloamwood-goblin-debt', family: 'goblin-callback', region: 'gloamwood', title: 'A Debt with Sharp Teeth', tone: 'hopeful', opening: 'The goblin you freed waits beside three dead cultists, proudly wearing their belts as a crown.', choiceA: ['Accept the hidden path', 'Trust a creature with every reason to remember mercy.', { supplies: 2, gold: 8, addFlags: ['goblin-guide'] }, 'The hidden trail spares you a night beneath the hungry trees.'], choiceB: ['Ask for information', 'Trade the debt for a dangerous truth.', { focus: 2, addFlags: ['truth-known'] }, 'The goblin saw abbey wagons carrying rain barrels toward the Crownless Keep.'], requiredFlags: ['spared-goblin'], weight: 200 },
  { id: 'gloamwood-antler-chapel', family: 'forest-faith', region: 'gloamwood', title: 'The Chapel of Antlers', tone: 'mystic', opening: 'An altar built from shed antlers holds bread still warm beneath a roof collapsed forty years ago.', choiceA: ['Share the bread', 'Leave half for the next traveler.', { health: 6, mercy: 1, supplies: 1 }, 'The forest grows quiet while you eat, a silence that feels briefly protective.'], choiceB: ['Take every loaf', 'Hunger is a stronger god than manners.', { health: 10, supplies: 2, corruption: 1 }, 'You eat well. At dusk, antlered shapes begin following beyond the firelight.'] },
  { id: 'gloamwood-black-hunt', family: 'wild-hunt', region: 'gloamwood', title: 'Horns Behind the Rain', tone: 'violent', opening: 'A hunting horn sounds behind you, then ahead, then from inside your own pack.', choiceA: ['Stand and challenge it', 'Meet the unseen hunt on honest ground.', { health: -4, gold: 15, startCombat: 'gloam-warg' }, 'The first warg emerges wearing a dead knight’s silver collar.', 'strength', 8], choiceB: ['Break your trail', 'Use water, ash, and a false set of tracks.', { focus: -2, addFlags: ['escaped-black-hunt'] }, 'The horn follows the false trail until sunrise.', 'cunning', 7] },
  { id: 'gloamwood-iron-bees', family: 'iron-bees', region: 'gloamwood', title: 'The Iron Hive', tone: 'mystic', opening: 'Metal bees pour from a hollow helm and repair a fallen soldier one rust flake at a time.', choiceA: ['Disturb the work', 'Claim what the swarm protects.', { health: -2, rewardTag: 'armor', corruption: 1 }, 'The soldier opens new brass eyes and thanks you for interrupting resurrection.', 'will', 8], choiceB: ['Offer a broken weapon', 'Give the hive better metal to remember.', { gold: -5, armor: 1, addFlags: ['fed-iron-hive'] }, 'The bees plate your sleeve before returning to their impossible patient.'] },
  { id: 'gloamwood-sleeping-cart', family: 'refugees', region: 'gloamwood', title: 'The Sleeping Cart', tone: 'mournful', opening: 'A refugee cart stands abandoned, its passengers asleep beneath blankets that rise and fall together.', choiceA: ['Wake the eldest', 'Risk whatever holds the sleepers.', { focus: -2, mercy: 1, addFlags: ['woke-refugees'] }, 'The eldest wakes screaming about a crown carried inside the rain.', 'will', 6], choiceB: ['Leave supplies', 'Do not turn helpless strangers into an experiment.', { supplies: -1, mercy: 2 }, 'Small hands pull the parcel beneath a blanket before you leave.'] },
  { id: 'gloamwood-root-knight', family: 'root-knight', region: 'gloamwood', title: 'The Root-Bound Knight', tone: 'ominous', opening: 'An abbey knight is fused to an oak from the waist down, sword raised against an enemy that never arrived.', choiceA: ['Release him with steel', 'End the vigil before the tree finishes feeding.', { mercy: 1, rewardTag: 'blade', faction: { abbey: 1 } }, 'He dies relieved, naming the Abbey as the keeper of the first rain barrel.'], choiceB: ['Question the roots', 'Let living wood answer through borrowed flesh.', { corruption: 1, addFlags: ['roots-spoke'], faction: { conclave: 1 } }, 'The roots speak in the knight’s voice and call the Crown a lock.', 'will', 8] },

  { id: 'drowned-road-orc-toll', family: 'orc-parley', region: 'drowned-road', title: 'The Red Toll', tone: 'ominous', opening: 'Free Host riders have stretched a red cord across the flood and demand one true story as payment.', choiceA: ['Tell them why you travel', 'Truth may purchase more than passage.', { faction: { freeHost: 2 }, addFlags: ['told-orcs-truth'] }, 'The riders lower their weapons. One recognizes the Iron Tooth and says nothing.'], choiceB: ['Cut the toll cord', 'Refuse a price no coin can satisfy.', { health: -3, gold: 10, faction: { freeHost: -2 }, startCombat: 'orc-freeblade' }, 'The water reddens around your boots as the first rider draws steel.', 'strength', 8] },
  { id: 'drowned-road-sunken-bell', family: 'sunken-bell', region: 'drowned-road', title: 'The Bell Beneath', tone: 'mystic', opening: 'A cathedral bell swings beneath the flood, ringing without sound each time you think of home.', choiceA: ['Dive for its inscription', 'Spend breath to recover a buried name.', { health: -3, focus: 3, addFlags: ['bell-inscription'] }, 'The inscription reads: A CROWN IS ONLY A PROMISE WITH TEETH.', 'strength', 7], choiceB: ['Answer with the Iron Tooth', 'Let relic and bell recognize one another.', { corruption: 1, addFlags: ['tooth-awake'] }, 'Your pack answers with a single warm pulse. Every corpse downstream sits upright.'] },
  { id: 'drowned-road-ferryman', family: 'ferryman', region: 'drowned-road', title: 'The Ferryman’s Empty Boat', tone: 'mournful', opening: 'An empty skiff follows the bank, keeping perfect pace. Wet coins lie arranged on its seat.', choiceA: ['Board the skiff', 'Trust the vessel more than the road.', { gold: 9, addFlags: ['rode-dead-ferry'] }, 'The current carries you past a mile of drowned soldiers who salute beneath the water.', 'will', 7], choiceB: ['Pay without boarding', 'Honor the custom and keep your own path.', { gold: -4, mercy: 1, supplies: 1 }, 'The skiff accepts your coin and leaves a sealed ration at your feet.'] },
  { id: 'drowned-road-marchers', family: 'drowned-army', region: 'drowned-road', title: 'The Army Below', tone: 'violent', opening: 'Hundreds of drowned soldiers march under the road, visible between cracks in the paving stones.', choiceA: ['March in their cadence', 'Hide your living heartbeat inside their rhythm.', { focus: -2, gold: 14, addFlags: ['learned-dead-march'] }, 'For one mile the dead mistake you for an officer and obey every turn.', 'cunning', 8], choiceB: ['Break the road behind you', 'End the formation before it reaches dry land.', { health: -5, mercy: 2, faction: { abbey: -1 } }, 'The road collapses. A century of orders dissolves into silt.', 'strength', 9] },
  { id: 'drowned-road-plague-house', family: 'plague-house', region: 'drowned-road', title: 'Lanterns in the Plague House', tone: 'mournful', opening: 'A quarantine house shows fresh lamplight. Someone inside scratches names into the shutters.', choiceA: ['Enter with medicine ready', 'Spend supplies to learn who survived.', { supplies: -1, mercy: 2, addFlags: ['saved-plague-child'] }, 'Only one child remains. She carries an abbey ledger wrapped in oilskin.', 'will', 7], choiceB: ['Seal the doors', 'Protect the road from whatever waits inside.', { faction: { abbey: 1 }, corruption: 1 }, 'The scratching stops before the last nail is driven.'] },
  { id: 'drowned-road-mire-witch', family: 'witch-bargain', region: 'drowned-road', title: 'A Cup for the Mire', tone: 'mystic', opening: 'A witch pours tea into the flood. Each cup forms a clear circle where a possible future can be seen.', choiceA: ['Drink the future of victory', 'Gain certainty and invite its price.', { focus: 4, corruption: 2, faction: { conclave: 1 } }, 'You see yourself crowned and cannot tell whether you are smiling.', 'will', 8], choiceB: ['Spill the cup', 'Choose an unwritten road.', { mercy: 1, addFlags: ['refused-prophecy'] }, 'The witch laughs with genuine approval and marks a safe ford on your map.'] },
  { id: 'drowned-road-troll-bridge', family: 'troll-toll', region: 'drowned-road', title: 'The Bridge That Eats', tone: 'violent', opening: 'A troll has chained itself beneath a bridge to keep the bridge from crawling away.', choiceA: ['Help tighten the chains', 'Strengthen an ugly but necessary prison.', { health: -2, supplies: 2, addFlags: ['bound-hungry-bridge'] }, 'The troll pays you in provisions taken from travelers the bridge swallowed.', 'strength', 8], choiceB: ['Free the troll', 'Let both jailer and prisoner choose what follows.', { mercy: 2, startCombat: 'bridge-troll' }, 'The bridge unfolds stone legs. The troll stands beside you for the first charge.'] },
  { id: 'drowned-road-abbey-wagon', family: 'rain-wagons', region: 'drowned-road', title: 'Barrels of Rain', tone: 'ominous', opening: 'An overturned abbey wagon leaks black rain uphill into sealed barrels.', choiceA: ['Open a barrel', 'Prove what the Abbey carried.', { corruption: 2, addFlags: ['abbey-rain-proof', 'truth-known'], faction: { abbey: -2 } }, 'Inside floats a royal crown thorn wrapped in a child’s coronation robe.', 'will', 9], choiceB: ['Burn the wagon', 'Destroy the cargo before it reaches another town.', { supplies: -1, mercy: 1, faction: { abbey: -1 } }, 'The smoke falls as black snow and every nearby bell cracks.'] },
  { id: 'drowned-road-rain-wraith', family: 'rain-wraith', region: 'drowned-road', title: 'The Shape the Rain Forgot', tone: 'violent', opening: 'Rain stops around a human silhouette walking toward you against the current.', choiceA: ['Name the dead', 'Use memory as a weapon against erasure.', { focus: -3, addFlags: ['named-rain-dead'] }, 'The silhouette becomes a tired soldier long enough to point toward the Keep.', 'will', 8], choiceB: ['Strike first', 'Trust iron more than resemblance.', { health: -4, startCombat: 'rain-wraith', rewardTag: 'essence' }, 'The blade passes through and returns carrying a stranger’s final memory.'] },

  { id: 'embervault-chain-smith', family: 'chained-smith', region: 'embervault', title: 'The Smith in Chains', tone: 'mournful', opening: 'A master smith is chained to an anvil, forging identical keys for locks that no longer exist.', choiceA: ['Break the chain', 'Spend strength to end the old sentence.', { health: -3, rewardTag: 'weapon', mercy: 2 }, 'She reforges one link into an edge keen enough to cut royal iron.', 'strength', 9], choiceB: ['Ask for a key', 'Let the sentence continue for one useful answer.', { gold: -8, addFlags: ['vault-key'], corruption: 1 }, 'The key opens the brand beneath your skin and nothing else.'] },
  { id: 'embervault-singing-ore', family: 'singing-ore', region: 'embervault', title: 'The Vein That Sings', tone: 'mystic', opening: 'A silver ore vein sings the melody of your earliest memory in a voice not your own.', choiceA: ['Mine a fragment', 'Take power before the mountain changes its song.', { health: -2, rewardTag: 'charm', corruption: 1 }, 'The fragment keeps singing after it leaves the rock.', 'strength', 7], choiceB: ['Sing the final note', 'Complete the memory instead of taking it.', { focus: 4, mercy: 1 }, 'The vein falls silent and a hidden stair opens in the cooled stone.', 'will', 7] },
  { id: 'embervault-goblin-market', family: 'goblin-market', region: 'embervault', title: 'Market of Burned Names', tone: 'ominous', opening: 'Goblin traders sell names hammered onto copper tags. Several belong to people you met on the road.', choiceA: ['Buy back a name', 'Return one stranger to the world’s memory.', { gold: -8, mercy: 2, addFlags: ['restored-name'] }, 'The tag melts in your hand. Far away, someone remembers how to grieve.'], choiceB: ['Sell your false name', 'Trade an identity you no longer need.', { gold: 18, corruption: 1 }, 'The goblins test the syllables and discover one of them is unexpectedly true.'] },
  { id: 'embervault-cinder-troll', family: 'furnace-beast', region: 'embervault', title: 'The Sleeping Furnace', tone: 'violent', opening: 'A cinder troll sleeps across the only bridge, each breath heating the iron to orange.', choiceA: ['Cross between breaths', 'Trust timing over force.', { focus: -2, supplies: 2 }, 'Your boots smoke, but you reach the far side before the next red breath.', 'cunning', 8], choiceB: ['Wake it honorably', 'Demand the road with weapon drawn.', { health: -3, startCombat: 'cinder-troll', rewardTag: 'ore' }, 'One molten eye opens. The troll smiles at your manners.'] },
  { id: 'embervault-ash-school', family: 'dead-school', region: 'embervault', title: 'Lessons After Death', tone: 'mournful', opening: 'Ghostly apprentices repeat a spell lesson while their dead teacher corrects the same fatal gesture.', choiceA: ['Correct the gesture', 'Break the lesson by changing its ending.', { focus: -2, mercy: 2, faction: { conclave: 1 } }, 'The spell blooms safely. Thirty ghosts bow and disappear.', 'will', 9], choiceB: ['Copy the forbidden version', 'Learn from the mistake that killed them.', { corruption: 2, rewardTag: 'scroll' }, 'The copied sigil moves on the page like an insect beneath skin.'] },
  { id: 'embervault-iron-saint', family: 'iron-saint', region: 'embervault', title: 'Saint of the Bellows', tone: 'ominous', opening: 'An iron saint pumps the great bellows with both hands, though its head lies on the floor nearby.', choiceA: ['Return the head', 'Restore the machine-priest and ask one question.', { faction: { abbey: 1 }, addFlags: ['saint-testimony'] }, 'The saint names the abbot who ordered the first Crown thorn melted.'], choiceB: ['Stop the bellows', 'Cool the forge and everything sleeping beneath it.', { supplies: 2, faction: { abbey: -1 } }, 'The mountain exhales. In the sudden cold, something enormous stops turning.'] },
  { id: 'embervault-demon-contract', family: 'demon-contract', region: 'embervault', title: 'Fine Print in Flame', tone: 'mystic', opening: 'A small demon has trapped itself inside a contract and politely asks you to misread one clause.', choiceA: ['Find the false clause', 'Outwit a creature made from dishonest language.', { gold: 15, focus: -2, addFlags: ['demon-owes-favor'] }, 'The contract burns from the middle outward. The demon leaves its true name behind.', 'cunning', 9], choiceB: ['Burn every page', 'Refuse to distinguish clever evil from clumsy evil.', { corruption: -1, startCombat: 'ember-fiend' }, 'The flame screams in several legal dialects before taking a body.'] },
  { id: 'embervault-crown-mold', family: 'crown-forge', region: 'embervault', title: 'The Empty Crown Mold', tone: 'ominous', opening: 'The original mold for the Crown of Thorns waits beside five channels cut for blood, rain, iron, memory, and consent.', choiceA: ['Place the Iron Tooth inside', 'Ask the mold what the relic was built to do.', { corruption: 2, addFlags: ['crown-is-lock', 'truth-known'] }, 'The mold closes like a jaw and shows you a king kneeling inside the Crown.', 'will', 10], choiceB: ['Shatter the mold', 'Make another Crown impossible.', { health: -5, addFlags: ['mold-destroyed'], faction: { conclave: -1 } }, 'The stone breaks. Every crown thorn in the realm turns toward you.'] },
  { id: 'embervault-last-coal', family: 'last-coal', region: 'embervault', title: 'The Last Honest Fire', tone: 'hopeful', opening: 'A single coal burns blue in a dead forge. It warms flesh but refuses to heat weapons.', choiceA: ['Warm the wounded', 'Use the fire for the purpose it chooses.', { health: 10, mercy: 1 }, 'The coal brightens and leaves a blue spark beneath your ribs.'], choiceB: ['Force it into a blade', 'Turn mercy into an edge.', { attack: 1, corruption: 1, rewardTag: 'weapon' }, 'The coal goes black. The blade remains hot enough to resent you.'] },

  { id: 'crownless-keep-abbot', family: 'abbot-trial', region: 'crownless-keep', title: 'The Abbot Without a Face', tone: 'ominous', opening: 'The Iron Abbot waits behind a visor polished into a mirror and asks which lie kept the realm alive.', choiceA: ['Accuse the Abbey', 'Name the rain wagons and the buried proof.', { faction: { abbey: -2, freeHost: 1 }, addFlags: ['challenged-abbot'] }, 'The mirror clouds. For the first time, the Abbot’s voice sounds old.', 'will', 9], choiceB: ['Ask to see his face', 'Refuse the question and judge the questioner.', { focus: -2, addFlags: ['abbot-unmasked'] }, 'Behind the visor is your own face wearing forty years of grief.', 'cunning', 9] },
  { id: 'crownless-keep-orc-hostage', family: 'orc-hostage', region: 'crownless-keep', title: 'The General in the Cage', tone: 'violent', opening: 'An orc general hangs in a silver cage, refusing water from guards who died days ago.', choiceA: ['Open the cage', 'Free a rival power before the final hall.', { mercy: 1, faction: { freeHost: 3, abbey: -1 }, addFlags: ['freed-orc-general'] }, 'She kneels only long enough to swear the Free Host will remember.', 'strength', 9], choiceB: ['Demand military intelligence', 'Trade water for the Keep’s defenses.', { supplies: -1, addFlags: ['keep-map'], faction: { freeHost: 1 } }, 'She drinks, then describes a passage hidden behind the throne tapestries.'] },
  { id: 'crownless-keep-pale-envoy', family: 'conclave-offer', region: 'crownless-keep', title: 'The Pale Proposal', tone: 'mystic', opening: 'A Conclave envoy offers to remove the Iron Tooth from your body without removing it from history.', choiceA: ['Accept the ritual', 'Trade pain for a debt to the Conclave.', { health: 8, corruption: 1, faction: { conclave: 3 }, addFlags: ['conclave-mark'] }, 'The relic leaves a hollow shaped exactly like a future command.'], choiceB: ['Keep the burden', 'Carry your own wound into the throne room.', { mercy: 1, faction: { conclave: -1 }, addFlags: ['kept-the-tooth'] }, 'The envoy bows. Respect and disappointment look identical on a mask.'] },
  { id: 'crownless-keep-dead-court', family: 'dead-court', region: 'crownless-keep', title: 'Court Is in Session', tone: 'mournful', opening: 'Dead nobles debate who should inherit a kingdom whose last living subject is standing before them.', choiceA: ['Argue for the common dead', 'Use their own laws against royal vanity.', { focus: -3, mercy: 2, addFlags: ['won-dead-court'] }, 'The vote passes by one severed hand. The nobles name you Advocate of Dust.', 'cunning', 10], choiceB: ['Dismiss the court', 'End a government that no longer governs anyone.', { corruption: -1, startCombat: 'barrow-soldier' }, 'The nobles applaud the clarity, then order their guards to test it.'] },
  { id: 'crownless-keep-five-doors', family: 'five-doors', region: 'crownless-keep', title: 'Five Doors, Four Shadows', tone: 'ominous', opening: 'Five iron doors bear the symbols of blood, rain, memory, consent, and the Crown. Only four cast shadows.', choiceA: ['Open the door without a shadow', 'Choose the omission over the symbols.', { focus: -2, addFlags: ['found-refusal-door', 'truth-known'] }, 'Beyond waits a road leading out of every possible kingdom.', 'will', 10], choiceB: ['Open the Crown door', 'Confront the design at its center.', { health: -3, addFlags: ['entered-crown-heart'] }, 'The door opens inward through your oldest scar.', 'strength', 9] },
  { id: 'crownless-keep-royal-child', family: 'royal-ghost', region: 'crownless-keep', title: 'The Child Who Was Crowned', tone: 'mournful', opening: 'A child ghost sits beneath the throne, practicing the speech that ended the world before she could deliver it.', choiceA: ['Listen to the speech', 'Give the dead child the audience she was promised.', { mercy: 3, addFlags: ['heard-last-queen'] }, 'Her final line names consent as the missing metal in the Crown.', 'will', 9], choiceB: ['Give her your cloak', 'Offer comfort without demanding another answer.', { mercy: 2, health: -2 }, 'She sleeps. The Keep becomes warmer by one impossible degree.'] },
  { id: 'crownless-keep-devil-feast', family: 'devil-feast', region: 'crownless-keep', title: 'The Feast of Empty Plates', tone: 'violent', opening: 'Crown devils dine from empty plates and toast each ruler who mistook possession for duty.', choiceA: ['Join the toast', 'Learn what demons believe the Crown will do.', { corruption: 2, focus: 3, addFlags: ['heard-devils-plan'] }, 'They celebrate the coming coronation as the opening of a very old cage.'], choiceB: ['Overturn the table', 'Make diplomacy brief and furniture useful.', { health: -4, startCombat: 'crown-devil', rewardTag: 'relic' }, 'The banquet knives rise before the guests do.', 'strength', 10] },
  { id: 'crownless-keep-banner-room', family: 'banner-memory', region: 'crownless-keep', title: 'Banners That Remember', tone: 'mystic', opening: 'Every war banner in the realm hangs here, whispering the names deliberately removed from victory rolls.', choiceA: ['Read the orcish names aloud', 'Return honor stolen by the old court.', { faction: { freeHost: 2, abbey: -1 }, mercy: 1 }, 'The red banners unfurl though the air is still.'], choiceB: ['Record every forgotten name', 'Spend precious time building an honest ledger.', { focus: -3, addFlags: ['ledger-of-forgotten'], mercy: 2 }, 'The final name is yours, written in ink that has not dried.'] },
  { id: 'crownless-keep-black-mirror', family: 'black-mirror', region: 'crownless-keep', title: 'The King in the Mirror', tone: 'ominous', opening: 'A black mirror shows you wearing the restored Crown while three armies kneel in burning rain.', choiceA: ['Break the reflection', 'Reject prophecy before it hardens into appetite.', { health: -2, corruption: -2, addFlags: ['crown-refused'] }, 'The mirror breaks everywhere except around your reflected eyes.', 'will', 10], choiceB: ['Ask what peace costs', 'Hear the strongest argument for a terrible crown.', { corruption: 2, addFlags: ['crown-restored'] }, 'The answer is simple: everyone must obey before they can suffer.'] },
] as const;

export const EVENTS: readonly StoryEvent[] = Object.freeze(BLUEPRINTS.map(makeEvent));

export const SCENE_VARIANT_KEYS: readonly string[] = Object.freeze(
  EVENTS.flatMap((event) =>
    event.actors.flatMap((actor) =>
      event.locations.flatMap((location) =>
        event.weathers.map((weather) => `${event.id}|${actor}|${location}|${weather}`),
      ),
    ),
  ),
);
