import { defineScene } from '../../builders';

const ALL_ROUTES = ['kings-road', 'old-forest', 'ruined-pass'] as const;
const COMMON = {
  chapterId: 'ch01' as const,
  region: 'gloamwood' as const,
  weight: 100,
  eligibility: { routes: ALL_ROUTES, minLevel: 1, maxLevel: 2 },
  requirements: [],
  exclusions: [],
  cooldownRuns: 0,
  oneShot: true,
  followUps: [],
  callbackPromises: [],
};

export const CH01_LIVING_DEPARTURE = Object.freeze([
  defineScene({
    ...COMMON,
    id: 'ch01-living-bent-axle-setup',
    slot: 2,
    type: 'journey',
    journeySubtype: 'travel',
    family: 'bent-axle',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-bent-axle-setup',
    title: 'The Rear Wheel Sags',
    narrative: [
      'At the first outer milestone, the rear wagon leans hard enough to spill rainwater from its canvas. The axle has not snapped, but its iron shoe is bent and every locked medicine case is pressing on the damaged side.',
      "Jory stops the drivers from moving it again. A wheelwright's shed stands behind the closed south gate, while the open road offers only timber wedges, lifting bars, and careful hands.",
    ],
    requirements: [{ type: 'flag', flagId: 'medicine-wagons-inspected' }],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'That shoe will hold for a mile, or fail in ten steps. I cannot tell you which.',
        environmentIllustrationId: 'scene-ch01-living-bent-axle-setup',
      },
      {
        speakerName: 'Eda Pell',
        text: 'Lift it, lighten it, or buy the proper iron. Those are the choices.',
        environmentIllustrationId: 'scene-ch01-living-bent-axle-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-wedge-the-bent-axle',
        label: 'Wedge the wagon',
        detail: 'Use timber wedges to raise the damaged wheel clear of the road.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'bent-axle-wedged' },
          { type: 'vitals', resource: -1 },
        ],
        outcome: 'The drivers hammer timber under the frame until the damaged wheel hangs clear of the road.',
        nextSceneId: 'ch01-living-bent-axle-work',
        continueLabel: 'Raise the wagon',
      },
      {
        id: 'ch01-choice-unload-the-rear-cases',
        label: 'Unload the rear cases',
        detail: 'Remove the sealed medicine cases from the damaged side before lifting.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'bent-axle-cases-unloaded' },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'Six sealed cases come down in order, each number repeated by Jory before it touches the verge.',
        nextSceneId: 'ch01-living-bent-axle-work',
        continueLabel: 'Rebalance the load',
      },
      {
        id: 'ch01-choice-send-for-an-axle-fitting',
        label: 'Buy a replacement fitting',
        detail: 'Spend 6 banked gold on a proper iron shoe from the wheelwright.',
        requirements: [{ type: 'gold', scope: 'banked', amount: 6 }],
        effects: [
          { type: 'gold', scope: 'banked', amount: -6 },
          { type: 'flag', operation: 'add', flagId: 'replacement-fitting-bought' },
        ],
        outcome: "A runner returns from the wheelwright with a plain iron shoe and the master's stamped receipt.",
        nextSceneId: 'ch01-living-bent-axle-work',
        continueLabel: 'Fit the new iron',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-bent-axle-work',
    slot: 3,
    type: 'journey',
    journeySubtype: 'travel',
    family: 'bent-axle',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-bent-axle-work',
    title: 'Weight on the Jack',
    narrative: [
      'The lifting bars bow beneath the rear frame. A repair made under load will be fast, but a mistake will drop the wagon onto the wheel and crack the lowest medicine case.',
    ],
    requirements: [{ type: 'flag', flagId: 'medicine-wagons-inspected' }],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'The fever bark is on the low side. If that case breaks, Greywatch loses it first.',
        environmentIllustrationId: 'scene-ch01-living-bent-axle-work',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-lift-and-pin-the-axle',
        label: 'Lift and pin the axle',
        detail: 'Use Strength against difficulty 6 while the drivers hold the lifting bars.',
        requirements: [{ type: 'flag', flagId: 'bent-axle-wedged' }],
        check: {
          stat: 'strength',
          difficulty: 6,
          modifiers: [{ label: 'Drivers on the lifting bars +5', amount: 5 }],
          success: {
            outcome: 'You hold the frame steady while Eda drives the pin square.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'rear-wagon-braced' },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          failure: {
            outcome: 'The bar slips. The wagon lands short, bruising your shoulder, but the drivers save the case.',
            effects: [
              { type: 'vitals', health: -3 },
              { type: 'flag', operation: 'add', flagId: 'rear-wagon-braced-poorly' },
              { type: 'threat', amount: 1 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          criticalSuccess: {
            outcome: 'You raise the frame in one clean motion and straighten the shoe before the pin cools.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'rear-wagon-braced' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'vitals', resource: 1 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          criticalFailure: {
            outcome: 'A block splits and the wheel drops across your boot before the team can lift again.',
            effects: [
              { type: 'vitals', health: -6 },
              { type: 'flag', operation: 'add', flagId: 'rear-wagon-braced-poorly' },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
        },
      },
      {
        id: 'ch01-choice-rebalance-by-manifest',
        label: 'Rebalance by the manifest',
        detail: 'Use Cunning against difficulty 6 to redistribute the numbered cases without breaking their seals.',
        requirements: [{ type: 'flag', flagId: 'bent-axle-cases-unloaded' }],
        check: {
          stat: 'cunning',
          difficulty: 6,
          modifiers: [{ label: 'Cases already numbered +5', amount: 5 }],
          success: {
            outcome: 'You move dense spirits and hardware forward without breaking a single seal.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'load-redistributed' },
              { type: 'xp', amount: 10, source: 'story' },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          failure: {
            outcome: 'The wagon rides level, but one unmarked crate must travel outside the official order.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'load-redistributed-partial' },
              { type: 'tension', amount: 2 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          criticalSuccess: {
            outcome: "Your new loading order relieves both the axle and the lead wagon's tired spring.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'load-redistributed' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'threat', amount: -1 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
          criticalFailure: {
            outcome: 'A case corner splits during the move and clean bandages must be used to wrap it.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'load-redistributed-partial' },
              { type: 'vitals', health: -1 },
              { type: 'faction', factionId: 'greywatch', amount: -1 },
            ],
            nextSceneId: 'ch01-living-bent-axle-aftermath',
            continueLabel: 'Test the repair',
          },
        },
      },
      {
        id: 'ch01-choice-install-the-bought-fitting',
        label: 'Install the bought fitting',
        detail: 'Seat the replacement iron shoe bought at Dunmere.',
        requirements: [{ type: 'flag', flagId: 'replacement-fitting-bought' }],
        effects: [
          { type: 'flag', operation: 'add', flagId: 'replacement-fitting-installed' },
          { type: 'xp', amount: 8, source: 'story' },
        ],
        outcome: 'The new shoe seats cleanly and the wheel turns without a knock.',
        nextSceneId: 'ch01-living-bent-axle-aftermath',
        continueLabel: 'Test the repair',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-bent-axle-aftermath',
    slot: 4,
    type: 'journey',
    journeySubtype: 'travel',
    family: 'bent-axle-aftermath',
    pacing: 'recovery',
    illustrationId: 'scene-ch01-living-bent-axle-aftermath',
    title: 'The Wagon Rolls True',
    narrative: [
      'The rear wagon completes a slow circle on the roadside without leaning. The repair is sound enough for the next grade, though no one mistakes road work for a new axle.',
    ],
    requirements: [{ type: 'flag', flagId: 'medicine-wagons-inspected' }],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'I will write what we spent and what survived. Greywatch can argue with the ledger after it has the medicine.',
        environmentIllustrationId: 'scene-ch01-living-bent-axle-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-record-the-axle-repair',
        label: 'Record the repair',
        detail: 'Add the repair, lost time, and moved cases to the official manifest.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'axle-repair-recorded' },
          { type: 'evidence', operation: 'add', evidenceId: 'convoy-repair-record' },
        ],
        outcome: 'Jory adds the repair, the lost time, and every moved case to the manifest.',
        nextSceneId: 'ch01-main-medicine-for-the-north',
        continueLabel: 'Read the manifest',
      },
      {
        id: 'ch01-choice-use-the-saved-light',
        label: 'Use the remaining light',
        detail: 'Return to the road quickly before other traffic closes around the convoy.',
        effects: [
          { type: 'threat', amount: -1 },
          { type: 'flag', operation: 'add', flagId: 'convoy-made-up-repair-time' },
        ],
        outcome: 'The wagons regain the road before other traffic closes around them.',
        nextSceneId: 'ch01-main-medicine-for-the-north',
        continueLabel: 'Take the first grade',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-hooves-chalk-setup',
    slot: 9,
    type: 'journey',
    journeySubtype: 'travel',
    family: 'hooves-in-chalk',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-hooves-chalk-setup',
    title: 'White Road, Stopped Team',
    narrative: [
      'Fresh rain has turned the chalk road into a white paste. The lead horses stop together at a shallow bend, ears flat, while the rear team crowds dangerously close behind them.',
      'Beneath the chalk are thin dark lines that could be roots, wire, or nothing more than washed grass. The drivers cannot reverse both wagons on the slope.',
    ],
    dialogue: [
      {
        speakerName: 'Eda Pell',
        text: 'They smell something under the chalk. If I whip them now, one of us goes over the edge.',
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-hold-the-rear-brake',
        label: 'Hold the rear brake',
        detail: 'Stop the rear wagon before it crowds the lead cart on the slope.',
        effects: [
          { type: 'vitals', resource: -1 },
          { type: 'flag', operation: 'add', flagId: 'chalk-rear-brake-held' },
        ],
        outcome: 'The rear wagon stops a handspan from the lead cart, leaving room to work.',
        nextSceneId: 'ch01-living-hooves-chalk-choice',
        continueLabel: 'Inspect the chalk',
      },
      {
        id: 'ch01-choice-clear-the-drivers-from-the-slope',
        label: 'Clear the drivers from the slope',
        detail: 'Move the drivers uphill while you take the exposed ground beside the teams.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'chalk-drivers-sheltered' },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The drivers move uphill with the reins while you take the exposed ground beside the teams.',
        nextSceneId: 'ch01-living-hooves-chalk-choice',
        continueLabel: 'Inspect the chalk',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-hooves-chalk-choice',
    slot: 10,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'hooves-in-chalk',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-hooves-chalk-choice',
    title: 'What the Horses Smelled',
    narrative: [
      'A gust strips water from the bend and reveals a line of short iron points pressed into the chalk. Someone buried them where a halted wagon would be exposed to the drainage ditch.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'Those are made points, not broken nails.',
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-choice',
      },
      {
        speakerName: 'Eda Pell',
        text: 'Then whoever laid them may still be watching.',
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-choice',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-calm-the-chalk-team',
        label: 'Calm the lead team',
        detail: 'Use Will against difficulty 6 while the driver keeps the reins.',
        check: {
          stat: 'will',
          difficulty: 6,
          modifiers: [{ label: 'Driver keeps the reins +5', amount: 5 }],
          success: {
            outcome: 'Your steady voice brings the horses forward one careful step at a time.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-horses-calmed' },
              { type: 'xp', amount: 10, source: 'story' },
              { type: 'threat', amount: -1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          failure: {
            outcome: 'The lead mare kicks the pole and opens your forearm before she settles.',
            effects: [
              { type: 'vitals', health: -3 },
              { type: 'flag', operation: 'add', flagId: 'chalk-horses-forced-settle' },
              { type: 'threat', amount: 1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalSuccess: {
            outcome: 'Both teams answer your pace and cross the safe strip without a wheel sliding.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-horses-calmed' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'vitals', resource: 2 },
              { type: 'threat', amount: -1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalFailure: {
            outcome: 'The rear pair surges, tearing a trace and leaving the convoy exposed on the bend.',
            effects: [
              { type: 'vitals', health: -4 },
              { type: 'flag', operation: 'add', flagId: 'chalk-trace-torn' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-ditch-road-cutters',
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'Defend the teams',
          },
        },
      },
      {
        id: 'ch01-choice-read-the-buried-points',
        label: 'Read the buried line',
        detail: 'Use Cunning against difficulty 6 to identify the trap pattern and a safe lane.',
        check: {
          stat: 'cunning',
          difficulty: 6,
          modifiers: [{ label: 'Rain exposes the pattern +5', amount: 5 }],
          success: {
            outcome: 'You find a wagon-wide safe lane and the boot hollow where the points were planted.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-trap-read' },
              { type: 'xp', amount: 10, source: 'story' },
              { type: 'evidence', operation: 'add', evidenceId: 'road-cutter-pattern' },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          failure: {
            outcome: 'You clear most of the points, but one cuts a horse and slows the team.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-horse-cut' },
              { type: 'threat', amount: 1 },
              { type: 'faction', factionId: 'greywatch', amount: -1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalSuccess: {
            outcome: 'You lift the entire cord of points intact and keep it for proof.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-trap-read' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'item', operation: 'grant', itemId: 'consumable-caltrop-pouch', quantity: 1, destination: 'pack' },
              { type: 'evidence', operation: 'add', evidenceId: 'road-cutter-pattern' },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalFailure: {
            outcome: 'The buried cord snaps tight around your ankle and drags you toward the ditch.',
            effects: [
              { type: 'vitals', health: -5 },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-ditch-road-cutters',
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
        },
      },
      {
        id: 'ch01-choice-drag-the-team-through-chalk',
        label: 'Drag the pole clear',
        detail: 'Use Strength against difficulty 7 while both drivers pull the lead pole.',
        check: {
          stat: 'strength',
          difficulty: 7,
          modifiers: [{ label: 'Both drivers pull +5', amount: 5 }],
          success: {
            outcome: 'You haul the lead pole across the narrow safe edge before the horses can bolt.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-team-dragged-clear' },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          failure: {
            outcome: 'The team crosses, but the rear wheel rolls over iron and the brace begins to knock.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-wheel-struck' },
              { type: 'threat', amount: 1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalSuccess: {
            outcome: 'The whole lead wagon clears in one pull, leaving the buried points useless behind it.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'chalk-team-dragged-clear' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'threat', amount: -1 },
            ],
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
          criticalFailure: {
            outcome: 'The pole twists from your grip and the exposed cutters rush the stalled wagons.',
            effects: [
              { type: 'vitals', health: -4 },
              { type: 'flag', operation: 'add', flagId: 'chalk-wheel-struck' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-ditch-road-cutters',
            nextSceneId: 'ch01-living-hooves-chalk-aftermath',
            continueLabel: 'See what the trap cost',
          },
        },
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-hooves-chalk-aftermath',
    slot: 11,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'hooves-in-chalk-aftermath',
    pacing: 'recovery',
    illustrationId: 'scene-ch01-living-hooves-chalk-aftermath',
    title: 'Tracks Leaving the Bend',
    narrative: [
      'The teams stand on firm stone again. Boot prints leave the drainage ditch in disciplined pairs, then separate before the next milestone as if their owners expected pursuit.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'Raiders scatter. Soldiers are taught when to scatter.',
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-aftermath',
      },
      {
        speakerName: 'Eda Pell',
        text: 'The rear brace is knocking again. Keep that wheel off the broken edge.',
        requirements: [{ type: 'flag', flagId: 'rear-wagon-braced-poorly' }],
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-aftermath',
      },
      {
        speakerName: 'Jory Fen',
        text: 'The new iron held. Every medicine seal is where I marked it.',
        requirements: [{ type: 'flag', flagId: 'replacement-fitting-installed' }],
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-aftermath',
      },
      {
        speakerName: 'Jory Fen',
        text: 'The new loading order kept the medicine cases steady when the teams lurched.',
        requirements: [{ type: 'flag', flagId: 'load-redistributed' }],
        environmentIllustrationId: 'scene-ch01-living-hooves-chalk-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-mark-the-paired-tracks',
        label: 'Mark the paired tracks',
        detail: 'Record the disciplined spacing beside the buried-point evidence.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'paired-road-tracks-recorded' },
          { type: 'xp', amount: 8, source: 'story' },
        ],
        outcome: 'Jory sketches their spacing beside the record of the buried points.',
        nextSceneId: 'ch01-living-cut-milestone-setup',
        continueLabel: 'Reach the cut milestone',
      },
      {
        id: 'ch01-choice-tend-the-horses-first',
        label: 'Tend the horses first',
        detail: 'Wash the chalk from every hoof and bind any cut before moving.',
        effects: [
          { type: 'vitals', resource: 2 },
          { type: 'flag', operation: 'add', flagId: 'chalk-horses-tended' },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The drivers wash chalk from every hoof and bind the cut before moving.',
        nextSceneId: 'ch01-living-cut-milestone-setup',
        continueLabel: 'Lead the teams onward',
      },
    ],
  }),
]);
