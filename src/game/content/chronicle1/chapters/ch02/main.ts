import { defineScene } from '../../builders';

export const CH02_MAIN = Object.freeze([
  defineScene({
    id: 'ch02-main-warning-before-dawn', chapterId: 'ch02', region: 'gloamwood', slot: 1,
    type: 'main', family: 'dawn-warning', anchorOrder: 1, weight: 100, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch02-main-warning-before-dawn', title: 'Warning Before Dawn',
    narrative: [
      'Greywatch sleeps behind locked gates while the medicine is unloaded. Before dawn, a wounded east-wall sentry reports covered lanterns moving through the fields and three horn calls answered from inside the town.',
      'The council chamber is across the market square. The alarm bell can raise every defender now, but it will also tell the hidden signaler that the warning was received.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-ring-the-general-alarm', label: 'Ring the general alarm', detail: 'Wake every district before the attack, but reveal that Greywatch has detected the signal plan.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-alarm-raised-early' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'The bell sounds across the roofs, and soldiers run for the walls while shutters close below.' },
      { id: 'ch02-choice-warn-the-commanders-quietly', label: 'Warn the commanders quietly', detail: 'Preserve the element of surprise, but risk leaving civilians asleep when the first attack lands.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-command-warned-quietly' }, { type: 'threat', amount: 1 }], outcome: 'Runners leave by separate alleys as the east-wall lanterns disappear one by one.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-raiders-at-the-wall', chapterId: 'ch02', region: 'gloamwood', slot: 7,
    type: 'main', family: 'greywatch-raid', anchorOrder: 2, weight: 100, pacing: 'danger', threatChange: 3,
    illustrationId: 'scene-ch02-main-raiders-at-the-wall', title: 'Raiders at the Wall',
    narrative: [
      'Fire arrows strike the east granary as ladders rise against the north wall. Goblin raiders shout in front, but disciplined human archers shoot from the tree line whenever defenders expose themselves.',
      'The attack is testing several defenses at once. Saving the granary protects winter food; breaking the ladders keeps the wall from being opened from within.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-lead-water-crews-to-the-granary', label: 'Lead water crews to the granary', detail: 'Protect Greywatch\'s food reserve, but leave fewer fighters against the ladders for several minutes.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-granary-saved' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Bucket lines smother the roof fire before it reaches the grain, while fighting spreads along the north wall.' },
      { id: 'ch02-choice-break-the-north-wall-ladders', label: 'Break the north-wall ladders', detail: 'Keep raiders outside the fortifications, but accept damage to stores while the granary burns.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-wall-held' }, { type: 'tension', amount: 1 }], outcome: 'The last ladder falls backward into the ditch as smoke thickens above the east granary.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-hold-the-south-gate', chapterId: 'ch02', region: 'gloamwood', slot: 13,
    type: 'main', family: 'south-gate-defense', anchorOrder: 3, weight: 100, pacing: 'danger', threatChange: 3,
    illustrationId: 'scene-ch02-main-hold-the-south-gate', title: 'Hold the South Gate',
    narrative: [
      'Sergeant Bren Hale commands the south gate when a stolen grain cart rolls downhill toward its bars. Raiders shelter behind it while a sapper crawls beneath the axle with a powder keg.',
      'Bren can close the inner gate and trap families still crossing the yard, or hold it open while you stop the cart in the outer lane.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch02-faction-sergeant-hale-at-the-infirmary'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-stop-the-cart-in-the-outer-lane', label: 'Stop the cart in the outer lane', detail: 'Meet the sapper beyond the bars, protecting civilians while fighting without the gate\'s cover.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-gate-civilians-cleared' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Bren keeps the inner gate open as you run toward the smoking keg beneath the cart.' },
      { id: 'ch02-choice-close-the-inner-gate', label: 'Close the inner gate', detail: 'Secure the fortress before the cart arrives, but leave several families trapped in the outer yard.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-gate-sealed-early' }, { type: 'companion-loyalty', companionId: 'caldus', amount: -3 }], outcome: 'The inner bars drop into place while Bren sends two soldiers back for the families left outside.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-the-royal-fletching', chapterId: 'ch02', region: 'gloamwood', slot: 20,
    type: 'main', family: 'armory-evidence', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch02-main-the-royal-fletching', title: 'The Royal Fletching',
    narrative: [
      'Greywatch fletcher Sera Holt lays the recovered arrow beside one from the keep armory. The crown notch matches an old royal batch, but both shafts were rebound with the same new black thread.',
      'The thread was issued only to regional military workshops. Lyra Arden, a seal reader from the Pale Conclave, asks to examine the armory records before anyone names a culprit.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch02-companion-lyra-reads-the-seal'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-give-lyra-the-intact-arrow', label: 'Give Lyra the intact arrow', detail: 'Let an outside expert handle the strongest clue, risking dispute over who controls the evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-shared-with-lyra' }, { type: 'evidence', operation: 'add', evidenceId: 'royal-arrow' }], outcome: 'Lyra records the binding knots and returns the arrow in a sealed case bearing both your marks.' },
      { id: 'ch02-choice-keep-the-arrow-with-greywatch', label: 'Keep the arrow with Greywatch', detail: 'Preserve local custody, but limit Lyra to notes and whatever the armory chooses to show her.', effects: [{ type: 'flag', operation: 'add', flagId: 'royal-arrow-in-greywatch-custody' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'Sera locks the arrow in the armory chest while Lyra copies the crown notch from across the table.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-the-witness-speaks', chapterId: 'ch02', region: 'gloamwood', slot: 27,
    type: 'main', family: 'witness-corroboration', anchorOrder: 5, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch02-main-the-witness-speaks', title: 'The Witness Speaks',
    narrative: [
      'The wounded toll officer, Tomas Reed, wakes in Greywatch\'s infirmary. He saw uniformed men remove the tollhouse register and heard one order the others back to the lime kiln before the medicine convoy arrived.',
      'Jory authenticates the Route Seven dispatch beside him. Tomas can name a quartermaster\'s driver, but speaking before the council may expose his family to whoever planned the raid.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-record-tomas-under-guard', label: 'Record Tomas under guard', detail: 'Create formal testimony and expose his identity, but give the council evidence it can act upon.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'toll-officer-testimony' }, { type: 'flag', operation: 'add', flagId: 'tomas-testimony-recorded' }], outcome: 'Bren seals Tomas\'s statement and posts two trusted guards outside the infirmary door.' },
      { id: 'ch02-choice-protect-tomas-as-an-unnamed-source', label: 'Protect Tomas as an unnamed source', detail: 'Hide the witness from immediate retaliation, but weaken the testimony when the council challenges it.', effects: [{ type: 'flag', operation: 'add', flagId: 'tomas-identity-protected' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 2 }], outcome: 'Jory records the lime-kiln lead without Tomas\'s name and moves his bed behind a screened ward.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-greywatch-council', chapterId: 'ch02', region: 'gloamwood', slot: 34,
    type: 'main', family: 'evidence-council', anchorOrder: 6, weight: 100, pacing: 'quiet', tensionChange: 1,
    illustrationId: 'scene-ch02-main-greywatch-council', title: 'Greywatch Council',
    narrative: [
      'Greywatch\'s council gathers in the map room: Captain Coren Ward, Quartermaster Nessa Cole, Sergeant Hale, and two civilian ward leaders. They agree the raid was organized but divide over who should hold the evidence.',
      'Captain Ward proposes sending copies to Marshal Severin Voss, the respected border commander currently inspecting western forts. Lyra warns that an unknown clerk has already copied military seal methods.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-divide-the-evidence-custody', label: 'Divide the evidence custody', detail: 'Give separate pieces to Jory, Lyra, and Sergeant Hale, reducing theft risk but slowing decisions.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-custody-divided' }, { type: 'faction', factionId: 'conclave', amount: 1 }], outcome: 'The council seals three inventories and records which witness holds each part before anyone leaves.' },
      { id: 'ch02-choice-place-the-evidence-with-the-council', label: 'Place the evidence with the council', detail: 'Create one accountable chain of custody, but make the council vault a single target for an infiltrator.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-in-council-vault' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Captain Ward locks the evidence beneath three keys and assigns each key to a different ward.' },
    ],
  }),
  defineScene({
    id: 'ch02-main-the-hidden-depot', chapterId: 'ch02', region: 'gloamwood', slot: 42,
    type: 'main', family: 'hidden-supply-depot', anchorOrder: 7, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch02-main-the-hidden-depot', title: 'The Hidden Depot',
    narrative: [
      'Beneath the abandoned lime kiln, a stone depot holds royal arrow crates, goblin shields, unmarked uniforms, and grain packed for an army that does not officially exist. Several crates were emptied before you arrived.',
      'A depot chit lists the next transfer at Redwater and bears the same clerk\'s hand as an emergency order initialed S.V. A quartermaster\'s runner escapes through the rear tunnel as smoke begins filling the chamber.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch03-main-orders-for-redwater'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-secure-the-depot-chits', label: 'Secure the depot chits', detail: 'Preserve the supply records before the fire spreads, but let the runner carry a warning north.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'depot-chits' }, { type: 'flag', operation: 'add', flagId: 'redwater-transfer-code-found' }], outcome: 'Jory packs the chits in the dispatch tube while Greywatch soldiers drag the remaining crates outside.' },
      { id: 'ch02-choice-chase-the-quartermasters-runner', label: 'Chase the quartermaster\'s runner', detail: 'Seek a living source and risk losing records to smoke, with no guarantee the runner can be caught.', effects: [{ type: 'flag', operation: 'add', flagId: 'depot-runner-pursued' }, { type: 'evidence', operation: 'add', evidenceId: 'depot-chit-fragment' }, { type: 'threat', amount: 1 }], outcome: 'You seize one torn chit from the tunnel floor and follow the runner toward the Redwater road.' },
    ],
  }),
]);
