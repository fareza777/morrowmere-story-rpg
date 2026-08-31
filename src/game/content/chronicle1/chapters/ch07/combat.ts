import { defineScene } from '../../builders';

export const CH07_COMBAT = Object.freeze([
  defineScene({
    id: 'ch07-combat-wagon-cutters-on-the-kingroad', chapterId: 'ch07', region: 'crownless-keep', slot: 5,
    type: 'combat', family: 'archive-wagon-ambush', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch07-kingroad-wagon-cutters', illustrationId: 'scene-ch07-combat-wagon-cutters-on-the-kingroad',
    title: 'Wagon Cutters on the Kingroad',
    narrative: [
      'Masked riders strike the evidence train with hooked blades meant to cut harness straps rather than kill guards. A second team rolls an empty cart across the road to separate Jory from the march.',
      'Saving the draft horses keeps the archive moving. Reaching the blocking cart first protects Jory, but leaves the rear evidence wagon exposed to the riders.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-guard-the-archive-horses', label: 'Guard the archive horses', detail: 'Keep the original records moving while Jory faces the blocking team with fewer defenders.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-archive-horses-guarded' }], outcome: 'You close around the harness as hooked blades sweep through the traces and stirrups.' },
      { id: 'ch07-choice-break-the-blocking-cart', label: 'Break the blocking cart', detail: 'Rejoin Jory before he is isolated, but let the riders make another pass at the evidence wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-blocking-cart-broken' }], outcome: 'The party charges the overturned cart while riders turn behind the unprotected wagon.' },
    ],
  }),
  defineScene({
    id: 'ch07-combat-the-duplicate-patrol', chapterId: 'ch07', region: 'crownless-keep', slot: 12,
    type: 'combat', family: 'false-patrol-lancers', weight: 24, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch07-duplicate-patrol', illustrationId: 'scene-ch07-combat-the-duplicate-patrol',
    title: 'The Duplicate Patrol',
    narrative: [
      'Two patrols in the same keep colors meet at a milestone and accuse each other of desertion. One carries copied badges and Black Banner pay tokens; the other has civilians tied behind its remounts.',
      'The counterfeit sergeant tries to burn his pay roll while mounted archers circle the prisoners. Either target can be saved, but the opposing wing gains room to attack.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-take-the-counterfeit-pay-roll', label: 'Take the counterfeit pay roll', detail: 'Preserve proof of the false patrol while mounted archers retain a clear line toward the prisoners.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-pay-roll-rushed' }, { type: 'evidence', operation: 'add', evidenceId: 'keep-counterfeit-pay-roll' }], outcome: 'You drive toward the sergeant as he drops the pay roll beside a travel brazier.' },
      { id: 'ch07-choice-cut-the-civilian-reins', label: 'Cut the civilian reins', detail: 'Free the patrol captives before the charge, but allow the counterfeit sergeant time to destroy names.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-patrol-captives-freed' }], outcome: 'The archers wheel toward you while the prisoners pull against the remount line.' },
    ],
  }),
  defineScene({
    id: 'ch07-combat-crossbows-over-the-quarry', chapterId: 'ch07', region: 'crownless-keep', slot: 19,
    type: 'combat', family: 'quarry-crossfire', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch07-quarry-crossbows', illustrationId: 'scene-ch07-combat-crossbows-over-the-quarry',
    title: 'Crossbows over the Quarry',
    narrative: [
      'Keep crossbow crews occupy abandoned quarry ledges above the final ascent. Below them, laborers chained to stone sledges are being used to obstruct the coalition road.',
      'A winch controls the laborers and the heaviest sledge. The upper firing platform commands the whole quarry but takes longer to reach under fire.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-wall-or-hidden-way'], callbackPromises: [], choices: [
      { id: 'ch07-choice-seize-the-quarry-winch', label: 'Seize the quarry winch', detail: 'Free the laborers and clear the road while the crossbow captain keeps the high platform.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-quarry-winch-seized' }], outcome: 'You descend toward the winch as its crew releases the first loaded sledge.' },
      { id: 'ch07-choice-climb-to-the-firing-platform', label: 'Climb to the firing platform', detail: 'Silence the crossbows before the march arrives, but leave chained laborers beside a moving sledge.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-quarry-platform-rushed' }], outcome: 'The party climbs a broken crane ladder while bolts strike the stone around each rung.' },
    ],
  }),
  defineScene({
    id: 'ch07-combat-sappers-at-the-postern', chapterId: 'ch07', region: 'crownless-keep', slot: 26,
    type: 'combat', family: 'postern-countermine', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch07-postern-sappers', illustrationId: 'scene-ch07-combat-sappers-at-the-postern',
    title: 'Sappers at the Postern',
    narrative: [
      'Keep engineers discover movement beneath the eastern wall and lower a demolition charge into the drainage shaft. Their shield crew seals the surface hatch while a fuse runner crosses the kitchen yard.',
      'Cutting the fuse protects anyone in the tunnel. Breaking the hatch lets the march enter, but the charge may collapse the postern before the rear guard passes.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-the-crownless-gate'], callbackPromises: [], choices: [
      { id: 'ch07-choice-stop-the-fuse-runner', label: 'Stop the fuse runner', detail: 'Prevent the demolition immediately while the shield crew keeps the surface hatch barred.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-postern-fuse-stopped' }], outcome: 'You pursue the runner between ovens as sparks travel toward the drainage shaft.' },
      { id: 'ch07-choice-break-the-surface-hatch', label: 'Break the surface hatch', detail: 'Open the route for allies and evidence carriers while trusting the tunnel party to handle the fuse.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-postern-hatch-broken' }], outcome: 'The shield crew braces over the hatch while the demolition line burns behind them.' },
    ],
  }),
  defineScene({
    id: 'ch07-combat-the-counterweight-house', chapterId: 'ch07', region: 'crownless-keep', slot: 33,
    type: 'combat', family: 'gate-counterweight-guard', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch07-counterweight-house', illustrationId: 'scene-ch07-combat-the-counterweight-house',
    title: 'The Counterweight House',
    narrative: [
      'Veterans defend the gate counterweight house while an engineer prepares to drop the portcullis onto the witness column. A bell crew above them calls reserves from the upper ward.',
      'The brake lever can hold the gate open. The alarm loft controls reinforcements, but reaching it means leaving the engineer beside the counterweight chain.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-voss-last-champion'], callbackPromises: [], choices: [
      { id: 'ch07-choice-hold-the-counterweight-brake', label: 'Hold the counterweight brake', detail: 'Keep the gate clear for witnesses while upper-ward reserves answer the alarm bell.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-gate-brake-held' }], outcome: 'The chain snaps taut as you fight toward the engineer and the iron brake.' },
      { id: 'ch07-choice-silence-the-alarm-loft', label: 'Silence the alarm loft', detail: 'Delay reinforcements from the upper ward while the engineer continues lowering the portcullis.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-alarm-loft-silenced' }], outcome: 'You take the loft stair as the bell crew pulls hard and the gate begins to descend.' },
    ],
  }),
  defineScene({
    id: 'ch07-combat-shields-before-the-record-hall', chapterId: 'ch07', region: 'crownless-keep', slot: 39,
    type: 'combat', family: 'record-hall-shield-line', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch07-voss-last-champion', illustrationId: 'scene-ch07-combat-shields-before-the-record-hall',
    title: 'Shields Before the Record Hall',
    narrative: [
      'Voss\'s inner guard forms a shield line between the party and the record hall. Behind them, clerks carry seal registers toward a furnace while a second squad bars the witness gallery.',
      'The records can prove how the false coronation was prepared. The gallery holds living governors whose testimony will matter more than paper if they survive.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-inside-the-keep'], callbackPromises: [], choices: [
      { id: 'ch07-choice-pierce-the-line-for-the-registers', label: 'Pierce the line for the registers', detail: 'Reach the compact records before they burn while the gallery squad retains its prisoners.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-record-registers-saved' }, { type: 'evidence', operation: 'add', evidenceId: 'keep-seal-registers' }], outcome: 'The party drives toward the furnace as clerks throw the first ledger onto its iron lip.' },
      { id: 'ch07-choice-turn-toward-the-witness-gallery', label: 'Turn toward the witness gallery', detail: 'Protect the compelled governors while sacrificing time needed to recover the complete registers.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch07-gallery-prisoners-freed' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'You turn on the gallery squad while smoke begins to rise from the record hall.' },
    ],
  }),
]);
