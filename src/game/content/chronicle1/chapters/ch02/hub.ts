import { defineScene } from '../../builders';

export const CH02_HUB = Object.freeze([
  defineScene({
    id: 'ch02-hub-greywatch-before-the-bell', chapterId: 'ch02', region: 'gloamwood', slot: 5,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch02-hub-greywatch-before-the-bell', title: 'Greywatch Before the Bell',
    narrative: [
      'The inner barracks yard becomes a temporary camp while commanders verify the dawn warning. You have a bench, clean water, and several minutes before the wall bell decides the town\'s next move.',
      'You can recover beside the medicine wagons or help sort the equipment carried in from the road.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-rest-by-the-medicine-wagons', label: 'Rest by the medicine wagons', detail: 'Recover before the alarm, but leave preparation work to soldiers who have already stood night watch.', effects: [{ type: 'vitals', health: 7, resource: 4 }, { type: 'flag', operation: 'add', flagId: 'greywatch-dawn-rested' }], outcome: 'You wake when the harness bells are removed from the horses and the yard falls completely quiet.' },
      { id: 'ch02-choice-sort-the-road-equipment', label: 'Sort the road equipment', detail: 'Give up some rest to prepare usable gear, reducing confusion if the warning becomes an attack.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-dawn-gear-sorted' }, { type: 'tension', amount: -1 }], outcome: 'Weapons, bandages, and tools are placed in separate racks before the first horn call.' },
    ],
  }),
  defineScene({
    id: 'ch02-hub-dorrans-wall-forge', chapterId: 'ch02', region: 'gloamwood', slot: 18,
    type: 'hub', family: 'wall-blacksmith', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'blacksmith', merchantRestockKey: 'ch02-blacksmith-wall-forge',
    illustrationId: 'scene-ch02-hub-dorrans-wall-forge', title: 'Dorran\'s Wall Forge',
    narrative: [
      'Blacksmith Dorran Pike keeps his forge open beneath the west wall while the raid moves east. He has repaired shields, practical weapons, and armor traded by soldiers who need lighter gear.',
      'Dorran will work quickly, but every hammer strike can be heard from the lane outside the armory.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-browse-dorrans-repaired-gear', label: 'Browse Dorran\'s repaired gear', detail: 'Pause to compare weapons and armor, but lose time while the fletching evidence waits nearby.', effects: [{ type: 'flag', operation: 'add', flagId: 'blacksmith-stock-opened-ch02' }, { type: 'tension', amount: 1 }], outcome: 'Dorran sets out three repaired pieces and explains every patch before naming his price.' },
      { id: 'ch02-choice-ask-dorran-about-armory-steel', label: 'Ask Dorran about armory steel', detail: 'Trade shopping time for his knowledge, risking no new equipment before the next fight.', effects: [{ type: 'flag', operation: 'add', flagId: 'dorran-armory-batch-identified' }], outcome: 'Dorran recognizes the arrow socket as royal steel and names the workshop that last handled the batch.' },
    ],
  }),
  defineScene({
    id: 'ch02-hub-quartermaster-coles-yard', chapterId: 'ch02', region: 'gloamwood', slot: 31,
    type: 'hub', family: 'quartermaster-service', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'quartermaster', merchantRestockKey: 'ch02-quartermaster-after-raid',
    illustrationId: 'scene-ch02-hub-quartermaster-coles-yard', title: 'Quartermaster Cole\'s Yard',
    narrative: [
      'Quartermaster Nessa Cole opens the reserve yard after the walls are secured. Surviving defenders may buy issued equipment, sell captured gear, or claim basic field supplies before leaving for the quarry.',
      'Cole is also comparing missing stock against the raid. A careful audit may reveal another clue, but it delays the depot search.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-open-coles-reserve-stock', label: 'Open Cole\'s reserve stock', detail: 'Prepare for the quarry with official supplies, but spend coin before knowing what the depot holds.', effects: [{ type: 'flag', operation: 'add', flagId: 'quartermaster-stock-opened-ch02' }], outcome: 'Cole unlocks the reserve cages and records each item that leaves under your campaign number.' },
      { id: 'ch02-choice-help-audit-the-missing-stock', label: 'Help audit the missing stock', detail: 'Delay shopping to compare ledgers, while the depot crew gains more time to clear the kiln.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-stock-audited' }, { type: 'tension', amount: 1 }], outcome: 'You identify six arrow crates listed as transferred to a patrol that never existed.' },
    ],
  }),
]);
