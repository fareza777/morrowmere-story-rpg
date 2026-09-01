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

export const CH01_LIVING_MARA = Object.freeze([
  defineScene({
    ...COMMON,
    id: 'ch01-living-cut-milestone-setup',
    slot: 9,
    type: 'companion',
    family: 'mara-first-meeting',
    relationship: { kind: 'companion', companionId: 'mara' },
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-cut-milestone-setup',
    title: 'A Scout Beside the Stone',
    narrative: [
      'A lone woman waits beside a milestone whose north face has been cut away with a chisel. Her raincloak bears a Greywatch scout clasp, but she keeps both hands clear of her bow.',
      'She names herself Mara Vey and points to three facts: paired military boot tracks, a missing distance number, and birch bark tied low where a rider would not notice it.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'Mara Vey, border scouts. Three groups passed north last night. One wanted its distance from Greywatch hidden.',
        environmentIllustrationId: 'scene-ch01-living-cut-milestone-setup',
      },
      {
        speakerName: 'Jory Fen',
        text: 'A badge can be stolen.',
        environmentIllustrationId: 'scene-ch01-living-cut-milestone-setup',
      },
      {
        speakerName: 'Mara Vey',
        text: 'So can a wagon. Check the ruts before you trust either of us.',
        environmentIllustrationId: 'scene-ch01-living-cut-milestone-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-name-yourself-to-mara',
        label: 'Give Mara your name',
        detail: 'Answer her introduction without making a promise about the road.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-met' },
          { type: 'companion-loyalty', companionId: 'mara', amount: 2 },
        ],
        outcome: 'Mara repeats it once, then looks to the wagons instead of offering courtesy.',
        nextSceneId: 'ch01-living-cut-milestone-dialogue',
        continueLabel: "Hear Mara's evidence",
      },
      {
        id: 'ch01-choice-ask-for-her-patrol-order',
        label: 'Ask for her patrol order',
        detail: 'Verify the lone scout before accepting anything she says about the road.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-met' },
          { type: 'flag', operation: 'add', flagId: 'mara-order-seen' },
        ],
        outcome: 'She produces a rain-soft order naming the southern milestones, signed before the tollhouse went silent.',
        nextSceneId: 'ch01-living-cut-milestone-dialogue',
        continueLabel: "Hear Mara's evidence",
      },
      {
        id: 'ch01-choice-keep-jory-between-you',
        label: 'Keep your distance',
        detail: 'Keep Jory and a wagon pole between you while the scout presents her case.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-met' },
          { type: 'flag', operation: 'add', flagId: 'mara-met-warily' },
          { type: 'companion-loyalty', companionId: 'mara', amount: -1 },
        ],
        outcome: 'You leave Jory and a wagon pole between you. Mara accepts the caution without stepping closer.',
        nextSceneId: 'ch01-living-cut-milestone-dialogue',
        continueLabel: "Hear Mara's evidence",
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-cut-milestone-dialogue',
    slot: 10,
    type: 'companion',
    family: 'mara-first-meeting',
    relationship: { kind: 'companion', companionId: 'mara' },
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-cut-milestone-dialogue',
    title: 'Three Groups in the Rain',
    narrative: [
      'Mara lays a knotted cord across the road. The first rut pair belongs to empty military carts, the second to lightly loaded farm wagons, and the third to riders who turned their horses around to leave north-facing prints.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'The third group walked south and wanted us to read north.',
        environmentIllustrationId: 'scene-ch01-living-cut-milestone-dialogue',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-test-maras-rut-count',
        label: 'Test the rut count',
        detail: 'Use Cunning against difficulty 6 to verify the reversed tracks yourself.',
        check: {
          stat: 'cunning',
          difficulty: 6,
          modifiers: [{ label: 'Fresh chalk holds edges +5', amount: 5 }],
          success: {
            outcome: 'You find the reversed heel drag and confirm her count.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-claim-verified' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 4 },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          failure: {
            outcome: "Rain has blurred the final print. Mara's reading remains plausible, not proven.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-claim-unverified' },
              { type: 'companion-loyalty', companionId: 'mara', amount: -1 },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          criticalSuccess: {
            outcome: 'You also match one wheel band to the broad military rut outside the toll route.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-claim-verified' },
              { type: 'evidence', operation: 'add', evidenceId: 'reversed-military-tracks' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 5 },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          criticalFailure: {
            outcome: 'You spoil the clearest heel mark and accuse the wrong rut.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-claim-doubted' },
              { type: 'companion-loyalty', companionId: 'mara', amount: -3 },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
        },
      },
      {
        id: 'ch01-choice-press-mara-for-one-certainty',
        label: 'Ask what she knows for certain',
        detail: 'Use Will against difficulty 6 to separate her observations from her inferences.',
        check: {
          stat: 'will',
          difficulty: 6,
          modifiers: [{ label: 'Direct question +0', amount: 0 }],
          success: {
            outcome: 'Mara separates what she saw from what she inferred: the tollhouse failed to report, and trained riders hid their direction.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-honesty-respected' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 3 },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          failure: {
            outcome: 'Your challenge hardens the exchange. Mara gives only the tollhouse fact and keeps her route advice brief.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-questioned-hard' },
              { type: 'companion-loyalty', companionId: 'mara', amount: -2 },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          criticalSuccess: {
            outcome: 'She names the hour of the missing toll signal and lets Jory copy it into the manifest.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-honesty-respected' },
              { type: 'evidence', operation: 'add', evidenceId: 'missing-toll-signal-time' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 4 },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
          criticalFailure: {
            outcome: 'The question sounds like an order from someone with no authority. Mara ends the interview.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-claim-doubted' },
              { type: 'companion-loyalty', companionId: 'mara', amount: -4 },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-cut-milestone-aftermath',
            continueLabel: 'Hear her route advice',
          },
        },
      },
      {
        id: 'ch01-choice-accept-maras-observation',
        label: 'Accept the observation',
        detail: 'Accept the hidden direction without claiming it identifies the travelers.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-trusted-provisionally' },
          { type: 'companion-loyalty', companionId: 'mara', amount: 2 },
        ],
        outcome: 'You accept the hidden direction without pretending it proves who made the tracks.',
        nextSceneId: 'ch01-living-cut-milestone-aftermath',
        continueLabel: 'Hear her route advice',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-cut-milestone-aftermath',
    slot: 10,
    type: 'companion',
    family: 'mara-first-meeting-aftermath',
    relationship: { kind: 'companion', companionId: 'mara' },
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-cut-milestone-aftermath',
    title: 'The Warning She Can Prove',
    narrative: [
      'Mara does not ask to join the convoy. She offers to show one marked crossing through the birches, then says she will continue her own patrol toward the silent tollhouse.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'Follow, verify, or watch me from the road. Just do not confuse the fastest path with the unobserved one.',
        environmentIllustrationId: 'scene-ch01-living-cut-milestone-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-thank-mara-without-a-promise',
        label: 'Thank her without a promise',
        detail: 'Treat Mara as a scout contact while keeping command of the convoy.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-treated-as-scout' },
          { type: 'companion-loyalty', companionId: 'mara', amount: 1 },
        ],
        outcome: 'Mara nods once and walks ahead where the birches meet the road.',
        nextSceneId: 'ch01-living-birch-marks-setup',
        continueLabel: 'Study the birch marks',
      },
      {
        id: 'ch01-choice-tell-mara-you-will-judge-the-path',
        label: 'Say you will judge the path',
        detail: 'Tell Mara that you will test the marked crossing before trusting it.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-path-to-be-tested' },
          { type: 'companion-loyalty', companionId: 'mara', amount: 1 },
        ],
        outcome: 'She answers that judgment is the work, not an insult.',
        nextSceneId: 'ch01-living-birch-marks-setup',
        continueLabel: 'Test the marked crossing',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-birch-marks-setup',
    slot: 10,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'birch-marks',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-birch-marks-setup',
    title: 'Three Cuts on White Bark',
    narrative: [
      'Three shallow cuts repeat from tree to tree along a firm verge beside Route Seven. The marks are fresh, but a second set lower on the trunks has been rubbed with road mud to hide it.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'High marks are mine. The low ones were added after dawn.',
        environmentIllustrationId: 'scene-ch01-living-birch-marks-setup',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-copy-both-birch-marks',
        label: 'Copy both marks',
        detail: 'Record the high cuts and mud-dark lower marks as separate evidence.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'both-birch-marks-copied' },
          { type: 'evidence', operation: 'add', evidenceId: 'altered-birch-marks' },
        ],
        outcome: 'Jory copies the high cuts and mud-dark lower cuts onto separate lines.',
        nextSceneId: 'ch01-living-birch-marks-choice',
        continueLabel: 'Choose which marks to follow',
      },
      {
        id: 'ch01-choice-keep-the-wagons-on-stone',
        label: 'Keep the wagons on stone',
        detail: 'Hold the convoy on Route Seven and examine the verge on foot.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'wagons-held-on-route-seven' },
          { type: 'threat', amount: 1 },
        ],
        outcome: 'The drivers hold Route Seven while you examine the verge on foot.',
        nextSceneId: 'ch01-living-birch-marks-choice',
        continueLabel: 'Choose which marks to follow',
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-birch-marks-choice',
    slot: 10,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'birch-marks',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-birch-marks-choice',
    title: 'Which Marks to Follow',
    narrative: [
      'The high marks lead over dry roots toward the toll road. The false low marks turn into a hollow where two wagon teams could be hidden from anyone watching the milestone.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'My path gives up speed. The other gives up sight.',
        environmentIllustrationId: 'scene-ch01-living-birch-marks-choice',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-accept-maras-high-marks',
        label: "Take Mara's marked path",
        detail: 'Use the firm verge and accept the time it costs.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'mara-path-accepted' },
          { type: 'companion-loyalty', companionId: 'mara', amount: 3 },
          { type: 'threat', amount: -1 },
          { type: 'tension', amount: 1 },
        ],
        outcome: 'The wagons use the firm verge and rejoin Route Seven below the tollhouse rise.',
        nextSceneId: 'ch01-living-birch-marks-aftermath',
        continueLabel: 'Look down on the tollhouse',
      },
      {
        id: 'ch01-choice-verify-the-hidden-hollow',
        label: 'Verify the hidden hollow',
        detail: 'Use Cunning against difficulty 7 to test the false low marks.',
        check: {
          stat: 'cunning',
          difficulty: 7,
          modifiers: [
            {
              label: 'Both mark sets copied +5',
              amount: 5,
              requirements: [{ type: 'flag', flagId: 'both-birch-marks-copied' }],
            },
          ],
          success: {
            outcome: "You find a watcher's heel shelf and a cord leading toward the tollhouse.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'birch-hollow-verified' },
              { type: 'flag', operation: 'add', flagId: 'bell-wire-suspected' },
              { type: 'xp', amount: 10, source: 'story' },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          failure: {
            outcome: 'The hollow is empty when you reach it, and your return leaves clear tracks to the convoy.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'birch-hollow-searched' },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          criticalSuccess: {
            outcome: "You find the watcher's shelf, bell cord, and a Greywatch cloak button cut from its thread.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'birch-hollow-verified' },
              { type: 'flag', operation: 'add', flagId: 'bell-wire-suspected' },
              { type: 'evidence', operation: 'add', evidenceId: 'removed-greywatch-button' },
              { type: 'xp', amount: 14, source: 'story' },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          criticalFailure: {
            outcome: 'A hidden noisemaker cracks underfoot and rings once toward the tollhouse.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-watcher-alerted' },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
        },
      },
      {
        id: 'ch01-choice-shadow-mara-through-birches',
        label: 'Shadow Mara instead of following openly',
        detail: 'Use Will against difficulty 7 to test Mara without crowding her line.',
        check: {
          stat: 'will',
          difficulty: 7,
          modifiers: [{ label: 'Mara expects scrutiny +0', amount: 0 }],
          success: {
            outcome: 'You keep her in sight without crowding her line. She stops at the cord before you reveal yourself.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-shadowed-cleanly' },
              { type: 'flag', operation: 'add', flagId: 'bell-wire-suspected' },
              { type: 'xp', amount: 10, source: 'story' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 1 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          failure: {
            outcome: 'Mara doubles back and finds you beside the first tree.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-shadowing-failed' },
              { type: 'companion-loyalty', companionId: 'mara', amount: -2 },
              { type: 'tension', amount: 1 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          criticalSuccess: {
            outcome: "You see Mara test two false marks and identify the watcher's escape line before she does.",
            effects: [
              { type: 'flag', operation: 'add', flagId: 'mara-shadowed-cleanly' },
              { type: 'flag', operation: 'add', flagId: 'watcher-escape-line-known' },
              { type: 'xp', amount: 14, source: 'story' },
              { type: 'companion-loyalty', companionId: 'mara', amount: 2 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
          criticalFailure: {
            outcome: 'You lose Mara and step into the hollow she avoided.',
            effects: [
              { type: 'flag', operation: 'add', flagId: 'tollhouse-watcher-alerted' },
              { type: 'vitals', health: -2 },
              { type: 'companion-loyalty', companionId: 'mara', amount: -3 },
              { type: 'threat', amount: 2 },
            ],
            nextSceneId: 'ch01-living-birch-marks-aftermath',
            continueLabel: 'Look down on the tollhouse',
          },
        },
      },
    ],
  }),
  defineScene({
    ...COMMON,
    id: 'ch01-living-birch-marks-aftermath',
    slot: 10,
    type: 'journey',
    journeySubtype: 'travel',
    family: 'birch-marks-aftermath',
    pacing: 'quiet',
    illustrationId: 'scene-ch01-living-birch-marks-aftermath',
    title: 'The Tollhouse Below',
    narrative: [
      'The birches thin above the tollhouse roof. Its barrier is raised and its chimney is cold; from this angle, a narrow wire disappears under the eaves toward the orchard.',
    ],
    dialogue: [
      {
        speakerName: 'Mara Vey',
        text: 'I will check the north ditch. Your wagons are your command.',
        environmentIllustrationId: 'scene-ch01-living-birch-marks-aftermath',
      },
    ],
    choices: [
      {
        id: 'ch01-choice-approach-tollhouse-under-cover',
        label: 'Approach under the birches',
        detail: 'Leave the wagons below the rise and enter the yard unseen.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'tollhouse-approach-hidden' },
          { type: 'threat', amount: -1 },
        ],
        outcome: 'The wagons stop below the rise while you reach the yard unseen.',
        nextSceneId: 'ch01-main-the-empty-tollhouse',
        continueLabel: 'Enter the tollhouse yard',
      },
      {
        id: 'ch01-choice-bring-the-wagons-to-the-barrier',
        label: 'Bring the wagons to the barrier',
        detail: 'Keep the convoy together while accepting that the orchard can see it.',
        effects: [
          { type: 'flag', operation: 'add', flagId: 'tollhouse-convoy-close' },
          { type: 'tension', amount: -1 },
        ],
        outcome: 'The full convoy enters the yard together, ready to move but visible from the orchard.',
        nextSceneId: 'ch01-main-the-empty-tollhouse',
        continueLabel: 'Call for the collector',
      },
    ],
  }),
]);
