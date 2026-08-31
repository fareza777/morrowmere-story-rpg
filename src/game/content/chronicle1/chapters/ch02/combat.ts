import { defineScene } from '../../builders';

export const CH02_COMBAT = Object.freeze([
  defineScene({
    id: 'ch02-combat-ladders-on-the-north-wall', chapterId: 'ch02', region: 'gloamwood', slot: 8,
    type: 'combat', family: 'wall-assault', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch02-north-wall-ladders', illustrationId: 'scene-ch02-combat-ladders-on-the-north-wall', title: 'Ladders on the North Wall',
    narrative: [
      'Hooked ladders strike the north parapet as goblin climbers rise behind scrap shields. Human archers in the tree line cover the ladders with disciplined volleys.',
      'The wall crew can cut the nearest hooks or raise shields for a countershot. Either choice leaves one threat active at the start of the fight.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cut-the-nearest-ladder-hooks', label: 'Cut the nearest ladder hooks', detail: 'Stop climbers from reaching the parapet, but remain exposed to the supporting archers.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-ladders-cut' }], outcome: 'The first ladder twists away from the wall while arrows strike sparks from the stone around you.' },
      { id: 'ch02-choice-shield-the-wall-bowmen', label: 'Shield the wall bowmen', detail: 'Help Greywatch answer the distant archers, but allow the first climbers another step upward.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-bowmen-shielded' }], outcome: 'The wall bowmen rise behind your guard and loose together toward the dark tree line.' },
    ],
  }),
  defineScene({
    id: 'ch02-combat-fire-at-the-granary', chapterId: 'ch02', region: 'gloamwood', slot: 12,
    type: 'combat', family: 'granary-raid', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch02-granary-fire-team', illustrationId: 'scene-ch02-combat-fire-at-the-granary', title: 'Fire at the Granary',
    narrative: [
      'A raider fire team enters the granary yard with oil jars and short axes. One shaman keeps the bucket crews back with bursts of blinding smoke.',
      'The oil carrier is close to the flour store. The shaman is farther away behind stacked grain carts and will keep disrupting defenders.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-intercept-the-oil-carrier', label: 'Intercept the oil carrier', detail: 'Protect the flour store immediately, but fight through smoke while the shaman remains free.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-granary-oil-stopped' }], outcome: 'You reach the nearest cart as the raider lifts an oil jar toward the granary door.' },
      { id: 'ch02-choice-circle-toward-the-shaman', label: 'Circle toward the shaman', detail: 'End the smoke attacks first, but give the oil carrier a clearer approach to the store.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-granary-shaman-rushed' }], outcome: 'You move behind the grain carts while the bucket line tries to block the oil carrier alone.' },
    ],
  }),
  defineScene({
    id: 'ch02-combat-the-south-gate-sapper', chapterId: 'ch02', region: 'gloamwood', slot: 14,
    type: 'combat', family: 'gate-sabotage', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch02-south-gate-sapper', illustrationId: 'scene-ch02-combat-the-south-gate-sapper', title: 'The South-Gate Sapper',
    narrative: [
      'The stolen grain cart gathers speed toward the gate while a sapper lights the keg beneath its axle. Shielded raiders run behind the cart and shoot through gaps in its boards.',
      'Sergeant Hale can hold the gate line if you reach the fuse. Breaking a wheel will stop the cart farther away but leave the sapper protected.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-reach-the-burning-fuse', label: 'Reach the burning fuse', detail: 'Cross directly through the raiders to prevent the blast, risking concentrated attacks.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-sapper-fuse-rushed' }], outcome: 'You sprint beside the moving cart while the fuse burns toward the keg under its center.' },
      { id: 'ch02-choice-break-the-front-wheel', label: 'Break the front wheel', detail: 'Stop the cart short of the gate, but give the sheltered sapper more time with the powder keg.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-sapper-wheel-targeted' }], outcome: 'You angle toward the left wheel as Hale orders the gate line to brace for the impact.' },
    ],
  }),
  defineScene({
    id: 'ch02-combat-infiltrators-below-the-armory', chapterId: 'ch02', region: 'gloamwood', slot: 24,
    type: 'combat', family: 'armory-infiltration', weight: 16, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch02-armory-infiltrators', illustrationId: 'scene-ch02-combat-infiltrators-below-the-armory', title: 'Infiltrators Below the Armory',
    narrative: [
      'A maintenance grate opens beneath the armory yard and three grey-cloaked infiltrators climb out with pry bars. Their commander carries a list of chest numbers instead of a raider badge.',
      'The nearest chest holds ordinary swords. The receiving ledgers are stored across the yard in a smaller locked office.',
    ],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-defend-the-ledger-office', label: 'Defend the ledger office', detail: 'Protect the supply records first, but let the infiltrators reach weapon chests in the open yard.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-ledger-office-held' }], outcome: 'You take position at the office door as the commander points two fighters toward the chests.' },
      { id: 'ch02-choice-cut-off-the-maintenance-grate', label: 'Cut off the maintenance grate', detail: 'Prevent reinforcements from entering, but leave both ledgers and weapons behind your first line.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-armory-grate-held' }], outcome: 'You move between the open grate and the courtyard while the infiltrators spread toward their targets.' },
    ],
  }),
  defineScene({
    id: 'ch02-combat-blades-in-the-council-passage', chapterId: 'ch02', region: 'gloamwood', slot: 33,
    type: 'combat', family: 'witness-assassination', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch02-council-passage-assassins', illustrationId: 'scene-ch02-combat-blades-in-the-council-passage', title: 'Blades in the Council Passage',
    narrative: [
      'Assassins in borrowed watch cloaks enter the passage between the infirmary and council room. One carries a fire flask for the evidence satchel; another turns toward Tomas Reed\'s guarded litter.',
      'Hale\'s soldiers cannot see both ends of the narrow passage. Protecting the witness leaves the documents exposed, and protecting the satchel makes Tomas the nearer target.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cover-tomas-litter', label: 'Cover Tomas\'s litter', detail: 'Keep the living witness alive, but allow the fire-flask carrier a route toward the documents.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-tomas-covered' }], outcome: 'You step beside Tomas as the first borrowed cloak draws a short blade from under its sleeve.' },
      { id: 'ch02-choice-seize-the-evidence-satchel', label: 'Seize the evidence satchel', detail: 'Protect the physical proof from fire, but leave Hale\'s guards to hold the witness line.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-evidence-covered' }], outcome: 'You pull the satchel behind a stone pillar while the second assassin rushes the litter.' },
    ],
  }),
  defineScene({
    id: 'ch02-combat-sentries-at-the-lime-kiln', chapterId: 'ch02', region: 'gloamwood', slot: 40,
    type: 'combat', family: 'depot-guard', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch02-lime-kiln-sentries', illustrationId: 'scene-ch02-combat-sentries-at-the-lime-kiln', title: 'Sentries at the Lime Kiln',
    narrative: [
      'Depot sentries defend the abandoned kiln with military crossbows and goblin bucklers. A runner waits beside the rear tunnel while the guard captain reaches for a smoke charge.',
      'Stopping the runner may preserve surprise beyond Greywatch. Seizing the smoke charge keeps the depot records visible during the fight.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cut-off-the-depot-runner', label: 'Cut off the depot runner', detail: 'Prevent a warning from leaving the kiln, but let the captain prepare smoke over the records.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-runner-cut-off' }], outcome: 'You turn toward the rear tunnel as the runner drops his spear and reaches for the door.' },
      { id: 'ch02-choice-take-the-smoke-charge', label: 'Take the smoke charge', detail: 'Protect the depot contents from concealment and fire, but give the runner a head start.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch02-smoke-charge-targeted' }], outcome: 'You close on the captain while the runner disappears into the narrow rear passage.' },
    ],
  }),
]);
