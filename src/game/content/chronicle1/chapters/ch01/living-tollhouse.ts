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

export const CH01_LIVING_TOLLHOUSE = Object.freeze([
  defineScene({
    ...COMMON,
    id: 'ch01-living-snared-scout-setup',
    slot: 12,
    type: 'journey',
    journeySubtype: 'side-quest',
    family: 'snared-scout',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-snared-scout-setup',
    title: 'A Boot Above the Bracken',
    narrative: [
      'Fifty paces beyond the tollhouse, a Greywatch scout hangs by one ankle from a bent ash sapling. He is alive, gagged, and bleeding from a shallow knife cut while a second wire lies slack beneath the leaves.',
    ],
    dialogue: [
      {
        speakerName: 'Halen Reeve',
        text: 'Halen makes a warning sound through the gag and looks repeatedly at the leaves below him.',
        environmentIllustrationId: 'scene-ch01-living-snared-scout-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-stop-beyond-the-second-wire',
        label: 'Stop beyond the second wire',
        detail: "Keep the guards outside the trap's killing space before freeing Halen.",
        effects: [
          { type: 'flag', operation: 'add', flagId: 'snare-second-wire-seen' },
          { type: 'threat', amount: -1 },
        ],
        outcome: "You halt the guards before anyone enters the trap's killing space.",
        nextSceneId: 'ch01-living-snared-scout-choice',
        continueLabel: 'Free the scout',
      },
      {
        id: 'ch01-choice-order-the-wagons-forward-of-the-snare',
        label: 'Move the wagons past the exposed verge',
        detail: 'Shelter the convoy on the stone shoulder while you remain with the scout.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'snare-wagons-sheltered' },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The convoy rolls to a stone shoulder while you remain with the trapped scout.',
        nextSceneId: 'ch01-living-snared-scout-choice',
        continueLabel: 'Free the scout',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-snared-scout-choice',
    slot: 13,
    type: 'journey',
    journeySubtype: 'side-quest',
    family: 'snared-scout',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-snared-scout-choice',
    title: 'The Bent Sapling',
    narrative: [
      'The main rope can be cut quickly, but Halen will fall across the lower wire. The knife wound is controlled for now; the greater danger is the numb leg and whoever set the trap.',
    ],
    dialogue: [
      {
        speakerName: 'Halen Reeve',
        text: 'Two humans in patrol cloaks. One goblin runner. They wanted the toll road left open.',
        environmentIllustrationId: 'scene-ch01-living-snared-scout-choice',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-catch-and-lower-halen',
        label: 'Catch and lower him',
        detail: 'Use Strength against difficulty 6 while Jory holds the canvas.',
        check: {
          stat: 'strength',
          difficulty: 6,
          modifiers: [{ label: 'Jory holds the canvas +5', amount: 5 }],
          success: {
            outcome: "You take Halen's weight and lower him without tightening the second wire.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued' },
              { type: 'xp', amount: 10, source: 'quest' },
              { type: 'faction', factionId: 'greywatch', amount: 1 },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          failure: {
            outcome: 'He lands hard and the numb leg folds beneath him, but the lower wire stays quiet.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued-injured' },
              { type: 'vitals', health: -2 },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          criticalSuccess: {
            outcome: 'You lower him directly onto the canvas and free the trapped ankle without another cut.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued' },
              { type: 'xp', amount: 14, source: 'quest' },
              { type: 'faction', factionId: 'greywatch', amount: 2 },
              {
                type: 'item',
                operation: 'grant',
                itemId: 'consumable-field-bandage',
                quantity: 1,
                destination: 'pack',
              },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          criticalFailure: {
            outcome: 'The sapling snaps back and throws both of you into the bracken.',
            effects: [
              { type: 'vitals', health: -5 },
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued-injured' },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
        },
      },
      {
        id: 'ch01-choice-keep-halen-talking',
        label: 'Free him while he gives the warning',
        detail: 'Use Will against difficulty 6 while Jory cuts the rope and Halen gives his warning.',
        check: {
          stat: 'will',
          difficulty: 6,
          modifiers: [{ label: 'Halen is trained +5', amount: 5 }],
          success: {
            outcome: 'Halen names the orchard signal and stays awake through the descent.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued' },
              { type: 'evidence', operation: 'add', evidenceId: 'halen-orchard-warning' },
              { type: 'xp', amount: 10, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          failure: {
            outcome: 'He loses consciousness before giving a direction, though Jory lowers him safely.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued-unconscious' },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          criticalSuccess: {
            outcome: 'He gives the exact smoke signal, patrol-cloak cut, and number of watchers.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued' },
              { type: 'flag', operation: 'add', flagId: 'orchard-signal-known' },
              { type: 'evidence', operation: 'add', evidenceId: 'halen-orchard-warning' },
              { type: 'xp', amount: 14, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
          criticalFailure: {
            outcome: 'Your questions push him into panic and he tears the wound open while struggling.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued-injured' },
              { type: 'faction', factionId: 'greywatch', amount: -1 },
              { type: 'threat', amount: 1 },
            ],
            nextSceneId: 'ch01-living-snared-scout-aftermath',
            continueLabel: "Treat Halen's leg",
          },
        },
      },
      {
        id: 'ch01-choice-map-the-snare-before-cutting',
        label: 'Investigate the trap first',
        detail: 'Trace the lower wire before Jory cuts Halen free.',
        requirements: [{ type: 'flag', flagId: 'snare-second-wire-seen' }],
        effects: [
          { type: 'flag', operation: 'add', flagId: 'snared-scout-rescued' },
          { type: 'flag', operation: 'add', flagId: 'tollhouse-bell-pattern-known' },
          { type: 'xp', amount: 8, source: 'quest' },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'You trace the lower wire to a bell clapper wrapped in cloth, then let Jory lower Halen.',
        nextSceneId: 'ch01-living-snared-scout-aftermath',
        continueLabel: "Treat Halen's leg",
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-snared-scout-aftermath',
    slot: 14,
    type: 'journey',
    journeySubtype: 'side-quest',
    family: 'snared-scout-aftermath',
    pacing: 'recovery',
    illustrationId: 'scene-ch01-living-snared-scout-aftermath',
    title: "Halen's Choice of Shelter",
    narrative: [
      'Halen can ride with the medicine or remain hidden beside a scout cache until his leg wakes. He refuses to return to the empty tollhouse.',
    ],
    dialogue: [
      {
        speakerName: 'Halen Reeve',
        text: 'Take me if you need a witness. Leave the whistle if you need the hour. Either choice costs you something.',
        exclusions: [{ type: 'flag', flagId: 'snared-scout-rescued-unconscious' }],
        environmentIllustrationId: 'scene-ch01-living-snared-scout-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-carry-halen-with-the-convoy',
        label: 'Carry Halen to Greywatch',
        detail: 'Move one bandage crate and give the wounded scout its place in the wagon.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'halen-with-convoy' },
          { type: 'faction', factionId: 'greywatch', amount: 1 },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'A bandage crate moves under oilcloth and Halen takes its place beside Jory.',
        nextSceneId: 'ch01-living-smoke-verge-setup',
        continueLabel: "Follow Halen's warning",
      },
      {
        id: 'ch01-choice-hide-halen-at-the-scout-cache',
        label: 'Hide Halen at the scout cache',
        detail: 'Leave Halen supplied and concealed while the convoy keeps its hour.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'halen-hidden-alive' },
          {
            type: 'item',
            operation: 'grant',
            itemId: 'tool-signal-whistle',
            quantity: 1,
            destination: 'pack',
          },
          { type: 'threat', amount: -1 },
        ],
        outcome: 'You leave water, a bandage, and his brass whistle within reach before covering the cache.',
        nextSceneId: 'ch01-living-smoke-verge-setup',
        continueLabel: 'Watch the northern smoke',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-bell-wire-setup',
    slot: 12,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'bell-wire',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-bell-wire-setup',
    title: 'Wire Under the Desk',
    narrative: [
      'Beneath the toll desk, a polished wire passes through a drilled floorboard. One end holds the missing register chain; the other runs into the wall toward a muffled bell under the orchard eaves.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'The register was not torn free. Its chain was made into a trigger.',
        environmentIllustrationId: 'scene-ch01-living-bell-wire-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-clear-the-tollhouse-doorway',
        label: 'Clear the doorway',
        detail: "Move everyone beyond the wire's line before touching the trap.",
        effects: [
          { type: 'flag', operation: 'add', flagId: 'bell-wire-doorway-cleared' },
          { type: 'tension', amount: 1 },
        ],
        outcome: "Jory moves the guards and widow, if present, beyond the wire's line before you touch it.",
        nextSceneId: 'ch01-living-bell-wire-choice',
        continueLabel: 'Trace the bell wire',
      },
      {
        id: 'ch01-choice-hold-the-wire-still',
        label: 'Pin the wire',
        detail: 'Spend focus to hold the wire still while inspecting its route.',
        effects: [
          { type: 'vitals', resource: -1 },
          { type: 'flag', operation: 'add', flagId: 'bell-wire-pinned' },
        ],
        outcome: 'A knife through the floor gap keeps the wire from moving while you inspect its route.',
        nextSceneId: 'ch01-living-bell-wire-choice',
        continueLabel: 'Trace the bell wire',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-bell-wire-choice',
    slot: 13,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'bell-wire',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-bell-wire-choice',
    title: 'The Muffled Bell',
    narrative: [
      'The bell is wrapped in sacking so only the orchard can hear it. A second branch of wire drops toward the cellar latch, making a careless disarm capable of opening both threats at once.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'Bell or cellar. Whoever built this wanted us looking the wrong way.',
        environmentIllustrationId: 'scene-ch01-living-bell-wire-choice',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-disarm-the-bell-wire',
        label: 'Disarm both branches',
        detail: 'Use Cunning against difficulty 7 to neutralize the bell and cellar latch together.',
        check: {
          stat: 'cunning',
          difficulty: 7,
          modifiers: [
            {
              label: 'Wire pinned +5',
              amount: 5,
              requirements: [{ type: 'flag', flagId: 'bell-wire-pinned' }],
            },
          ],
          success: {
            outcome: 'You slacken the bell, then lift the cellar loop without moving either clapper or latch.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-disarmed' },
              { type: 'xp', amount: 10, source: 'story' },
              { type: 'threat', amount: -1 },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          failure: {
            outcome: 'The bell gives one dull note. The cellar stays closed, but feet move outside.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-rang' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-lookouts',
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalSuccess: {
            outcome: 'You remove the complete trigger and preserve the cut Greywatch buckle used as its weight.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-disarmed' },
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-alarm-rig' },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalFailure: {
            outcome: 'The wire tears through the eyelet, ringing the bell and throwing the cellar latch.',
            effects: [
              { type: 'vitals', health: -2 },
              { type: 'flag', operation: 'add', flagId: 'bell-wire-rang' },
              { type: 'flag', operation: 'add', flagId: 'cellar-raiders-alerted' },
              { type: 'threat', amount: 3 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-lookouts',
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
        },
      },
      {
        id: 'ch01-choice-rip-the-bell-from-the-wall',
        label: 'Break the bell loose',
        detail: 'Use Strength against difficulty 7 to pull the bell free before its clapper strikes.',
        check: {
          stat: 'strength',
          difficulty: 7,
          modifiers: [{ label: 'Rotten wall boards +5', amount: 5 }],
          success: {
            outcome: 'The board comes away with the bell before the clapper can strike.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-broken-silent' },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          failure: {
            outcome: 'The bell rings as the board splits and the orchard lookouts rush the yard.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-rang' },
              { type: 'vitals', health: -2 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-lookouts',
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalSuccess: {
            outcome: 'You pull bell, wire, and hidden eyelet free as one piece of evidence.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-broken-silent' },
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-alarm-rig' },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalFailure: {
            outcome: 'The rotten frame drops across your shoulder while the bell sounds twice.',
            effects: [
              { type: 'vitals', health: -5 },
              { type: 'flag', operation: 'add', flagId: 'bell-wire-rang' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-lookouts',
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
        },
      },
      {
        id: 'ch01-choice-lure-the-bell-watcher',
        label: "Ring the watcher's answer",
        detail: "Use Will against difficulty 7 to copy the watcher's signal and draw him into the yard.",
        check: {
          stat: 'will',
          difficulty: 7,
          modifiers: [
            {
              label: 'Escape line already known +5',
              amount: 5,
              requirements: [{ type: 'flag', flagId: 'watcher-escape-line-known' }],
            },
          ],
          success: {
            outcome: 'Your copied signal draws one cloaked watcher into the empty yard, where the guards take him alive.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-watcher-captured' },
              { type: 'evidence', operation: 'add', evidenceId: 'watcher-patrol-cloak' },
              { type: 'xp', amount: 10, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          failure: {
            outcome: 'The watcher answers from cover, sees the trap, and escapes toward the orchard.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-watcher-escaped' },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalSuccess: {
            outcome: 'The watcher enters with the missing register page tucked inside his cloak.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-watcher-captured' },
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-register-page' },
              { type: 'xp', amount: 14, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
          criticalFailure: {
            outcome: 'Your false signal gives the wrong count and brings both lookouts at a run.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'bell-wire-rang' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-lookouts',
            nextSceneId: 'ch01-living-bell-wire-aftermath',
            continueLabel: 'Move the toll desk',
          },
        },
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-bell-wire-aftermath',
    slot: 14,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'bell-wire-aftermath',
    pacing: 'recovery',
    illustrationId: 'scene-ch01-living-bell-wire-aftermath',
    title: 'What the Alarm Guarded',
    narrative: [
      'With the wire harmless or its lookouts defeated, the desk can be moved. A square trapdoor lies beneath it, keyed to the cellar latch and marked by recent military boot scrapes.',
    ],
    dialogue: [
      {
        speakerName: 'Captured Watcher',
        text: 'We only watched the road.',
        requirements: [{ type: 'flag', flagId: 'tollhouse-watcher-captured' }],
        environmentIllustrationId: 'scene-ch01-living-bell-wire-aftermath',
      },
      {
        speakerName: 'Jory Fen',
        text: 'Then you can explain the missing register below it.',
        requirements: [{ type: 'flag', flagId: 'tollhouse-watcher-captured' }],
        environmentIllustrationId: 'scene-ch01-living-bell-wire-aftermath',
      },
      {
        speakerName: 'Jory Fen',
        text: 'The watcher took the orchard line. If he reaches a signal, the convoy will be counted twice.',
        requirements: [{ type: 'flag', flagId: 'tollhouse-watcher-escaped' }],
        environmentIllustrationId: 'scene-ch01-living-bell-wire-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-open-the-cellar-after-the-bell',
        label: 'Open the cellar',
        detail: 'Use the tollhouse key while the guards stand clear of the hinge.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'cellar-entered-after-alarm' },
          { type: 'xp', amount: 8, source: 'story' },
        ],
        outcome: 'Jory fits the tollhouse key while the guards stand clear of the hinge.',
        nextSceneId: 'ch01-living-below-desk-setup',
        continueLabel: 'Descend below the toll desk',
      },
      {
        id: 'ch01-choice-secure-the-yard-before-cellar',
        label: 'Secure the yard first',
        detail: 'Mark each orchard exit and shelter the wagons before opening the trapdoor.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'tollhouse-yard-secured' },
          { type: 'threat', amount: -1 },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The wagons form behind the barrier and every orchard exit is marked before the trapdoor opens.',
        nextSceneId: 'ch01-living-below-desk-setup',
        continueLabel: 'Open the trapdoor',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-below-desk-setup',
    slot: 14,
    type: 'journey',
    journeySubtype: 'dungeon',
    family: 'below-toll-desk',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-below-desk-setup',
    title: 'The Square Trapdoor',
    narrative: [
      'The key opens the trapdoor, but the first stair has been sawn almost through. Below it, lamplight touches uniform crates, a stone strongbox, and the corner of a torn toll register.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'The register is in reach. The strongbox is not. Somebody arranged that.',
        environmentIllustrationId: 'scene-ch01-living-below-desk-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-bridge-the-sawn-step',
        label: 'Bridge the sawn step',
        detail: 'Spend focus to make one safe path down the trapped stair.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'cellar-step-bridged' },
          { type: 'vitals', resource: -1 },
        ],
        outcome: 'A door plank spans the cut stair and gives the descent one safe line.',
        nextSceneId: 'ch01-living-below-desk-choice',
        continueLabel: 'Enter the cellar',
      },
      {
        id: 'ch01-choice-lower-a-lamp-before-entering',
        label: 'Lower a lamp first',
        detail: 'Spend focus to reveal traps before committing to the descent.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'cellar-tripcord-seen' },
          { type: 'vitals', resource: -1 },
        ],
        outcome: 'The lamp reveals a trip cord between the register and strongbox.',
        nextSceneId: 'ch01-living-below-desk-choice',
        continueLabel: 'Enter the cellar',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-below-desk-choice',
    slot: 15,
    type: 'journey',
    journeySubtype: 'dungeon',
    family: 'below-toll-desk',
    pacing: 'danger',
    illustrationId: 'scene-ch01-living-below-desk-choice',
    title: 'Register, Strongbox, Tunnel',
    narrative: [
      'The torn register records three empty military carts passing north before dawn. The strongbox is wired to a stone weight, and fresh air reaches the cellar through a low tunnel toward the orchard.',
    ],
    dialogue: [
      {
        speakerName: 'Tunnel Raider',
        text: 'Leave the book and climb out.',
        requirements: [{ type: 'flag', flagId: 'cellar-raiders-alerted' }],
        environmentIllustrationId: 'scene-ch01-living-below-desk-choice',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-preserve-the-cellar-register',
        label: 'Preserve the register and badge cuts',
        detail: 'Use Cunning against difficulty 7 to recover the records without disturbing the trap.',
        check: {
          stat: 'cunning',
          difficulty: 7,
          modifiers: [{ label: 'Jory knows record handling +5', amount: 5 }],
          success: {
            outcome: 'You free the dry pages and match the removed badge outlines without disturbing the trap.',
            effects: [
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-register-page' },
              { type: 'flag', operation: 'add', flagId: 'removed-greywatch-badges-recorded' },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          failure: {
            outcome: 'The final page tears, preserving the cart count but losing the signature line.',
            effects: [
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-register-page' },
              { type: 'flag', operation: 'add', flagId: 'tollhouse-evidence-partial' },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          criticalSuccess: {
            outcome: 'The intact leaf includes a clerk countermark matching the Route Seven office.',
            effects: [
              { type: 'evidence', operation: 'add', evidenceId: 'tollhouse-register-page' },
              { type: 'evidence', operation: 'add', evidenceId: 'removed-greywatch-badges' },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          criticalFailure: {
            outcome: 'The stone weight drops, soaking the register in an old water barrel.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-register-lost' },
              { type: 'vitals', health: -2 },
              { type: 'threat', amount: 1 },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
        },
      },
      {
        id: 'ch01-choice-lift-the-cellar-weight',
        label: 'Lift the trap weight off the strongbox',
        detail: 'Use Strength against difficulty 7 to hold the weight while Jory cuts the cord.',
        check: {
          stat: 'strength',
          difficulty: 7,
          modifiers: [
            {
              label: 'Trip cord visible +5',
              amount: 5,
              requirements: [{ type: 'flag', flagId: 'cellar-tripcord-seen' }],
            },
          ],
          success: {
            outcome: 'You hold the weight while Jory slides out the box and cuts the cord.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-cache-opened' },
              { type: 'gold', scope: 'unbanked', amount: 6 },
              {
                type: 'item',
                operation: 'grant',
                itemId: 'charm-greywatch-key',
                quantity: 1,
                destination: 'unbanked-loot',
              },
              { type: 'xp', amount: 10, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          failure: {
            outcome: 'The weight strikes the stair, but the box comes free with only its coin tray intact.',
            effects: [
              { type: 'vitals', health: -4 },
              { type: 'gold', scope: 'unbanked', amount: 4 },
              { type: 'flag', operation: 'add', flagId: 'tollhouse-cache-damaged' },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          criticalSuccess: {
            outcome: 'The strongbox opens without a sound, preserving coin, retired gate key, and duty seal.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-cache-opened' },
              { type: 'gold', scope: 'unbanked', amount: 8 },
              {
                type: 'item',
                operation: 'grant',
                itemId: 'charm-greywatch-key',
                quantity: 1,
                destination: 'unbanked-loot',
              },
              { type: 'xp', amount: 14, source: 'quest' },
            ],
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
          criticalFailure: {
            outcome: 'The weight breaks the support and armed figures rush from the tunnel through falling chalk.',
            effects: [
              { type: 'vitals', health: -5 },
              { type: 'flag', operation: 'add', flagId: 'cellar-collapse-started' },
              { type: 'threat', amount: 2 },
            ],
            combatEncounterId: 'enc-ch01-tollhouse-cellar',
            nextSceneId: 'ch01-living-below-desk-aftermath',
            continueLabel: 'Account for the evidence',
          },
        },
      },
      {
        id: 'ch01-choice-enter-the-cellar-tunnel',
        label: 'Block the tunnel before searching',
        detail: 'Enter the passage before its occupants can reach the stair.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'cellar-raiders-engaged' },
          { type: 'combat', encounterId: 'enc-ch01-tollhouse-cellar' },
        ],
        outcome: 'You move into the low passage before its two occupants can close on the stair.',
        nextSceneId: 'ch01-living-below-desk-aftermath',
        continueLabel: 'Clear the hidden tunnel',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-below-desk-aftermath',
    slot: 16,
    type: 'journey',
    journeySubtype: 'dungeon',
    family: 'below-toll-desk-aftermath',
    pacing: 'recovery',
    illustrationId: 'scene-ch01-living-below-desk-aftermath',
    title: 'The Missing Badges',
    narrative: [
      'The cellar crates once held Greywatch cloaks. Each badge has been cut away, but military boot polish, lamp oil, and the empty-cart register connect the room to trained people using stolen uniforms.',
    ],
    dialogue: [
      {
        speakerName: 'Jory Fen',
        text: 'This proves uniforms were taken. It does not prove who wore them. We keep those claims separate.',
        environmentIllustrationId: 'scene-ch01-living-below-desk-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-seal-the-tollhouse-evidence',
        label: 'Seal the evidence with the dispatch',
        detail: 'Wrap each recovered record and alarm piece separately for Greywatch.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'tollhouse-evidence-sealed' },
          { type: 'flag', operation: 'add', flagId: 'kneeling-armor-entry-ready' },
          { type: 'xp', amount: 8, source: 'story' },
        ],
        outcome: 'Jory wraps pages, badge cuts, and alarm pieces in separate waxed cloths.',
        nextSceneId: 'ch01-living-smoke-verge-setup',
        continueLabel: 'Follow the fresh smoke',
      },
      {
        id: 'ch01-choice-collapse-the-cellar-tunnel',
        label: 'Close the orchard tunnel',
        detail: 'Block the low passage before returning to the convoy.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'tollhouse-tunnel-collapsed' },
          { type: 'flag', operation: 'add', flagId: 'kneeling-armor-entry-ready' },
          { type: 'threat', amount: -2 },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The guards pull the sawn stair into the low passage and block it with chalk stone.',
        nextSceneId: 'ch01-living-smoke-verge-setup',
        continueLabel: 'Return to the convoy',
      },
    ],
  }),
]);
