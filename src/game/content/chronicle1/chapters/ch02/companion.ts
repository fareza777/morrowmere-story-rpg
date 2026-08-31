import { defineScene } from '../../builders';

export const CH02_COMPANION = Object.freeze([
  defineScene({
    id: 'ch02-companion-caldus-among-the-refugees', chapterId: 'ch02', region: 'gloamwood', slot: 3,
    type: 'companion', family: 'caldus-refugee-duty', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 22, pacing: 'recovery',
    illustrationId: 'scene-ch02-companion-caldus-among-the-refugees', title: 'Caldus Among the Refugees',
    narrative: [
      'Brother Caldus turns the south chapel into a refuge ward before the raid begins. He has thirty frightened people, four cots, and no authority to open the medicine convoy\'s sealed cases.',
      'Fever is spreading among three children. Breaking the quartermaster\'s seal will save time, but Greywatch may accuse Caldus of stealing military supplies.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-open-a-fever-case-for-caldus', label: 'Open a fever case for Caldus', detail: 'Break an official seal to treat the children now, risking blame when the medicine is counted.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-met' }, { type: 'flag', operation: 'add', flagId: 'refugees-protected' }, { type: 'companion-quest', companionId: 'caldus', stage: 1 }, { type: 'companion-loyalty', companionId: 'caldus', amount: 8 }], outcome: 'Caldus records every dose under his own name and begins treating the children before the alarm sounds.' },
      { id: 'ch02-choice-send-for-quartermaster-approval', label: 'Send for quartermaster approval', detail: 'Protect the legal medicine count, but make the sick children wait during an approaching attack.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-met' }, { type: 'companion-quest', companionId: 'caldus', stage: 1 }, { type: 'companion-loyalty', companionId: 'caldus', amount: -4 }], outcome: 'A runner leaves for the keep while Caldus cools the children with water and says nothing more.' },
    ],
  }),
  defineScene({
    id: 'ch02-companion-talla-keeps-the-bargain', chapterId: 'ch02', region: 'gloamwood', slot: 9,
    type: 'companion', family: 'talla-secret-bargain', relationship: { kind: 'companion', companionId: 'talla' }, weight: 30, pacing: 'quiet',
    illustrationId: 'scene-ch02-companion-talla-keeps-the-bargain', title: 'Talla Keeps the Bargain',
    narrative: [
      'Talla waits in a shuttered cooperage while the raid strikes the walls. She has marked a route from the hidden goblin food line to the lime kiln without exposing the refuge it serves.',
      'Greywatch scouts are searching every tunnel. You can honor the secret and use Talla\'s longer route, or give the scouts the direct food path before the raiders escape.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 2, maxLevel: 4, requiredFlags: ['secret-bargain-started'], excludedFlags: ['talla-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-use-tallas-longer-route', label: 'Use Talla\'s longer route', detail: 'Honor the refuge secret and lose time circling the quarry, while the depot crew may prepare.', effects: [{ type: 'flag', operation: 'add', flagId: 'secret-bargain-honored' }, { type: 'companion-quest', companionId: 'talla', stage: 2 }, { type: 'companion-loyalty', companionId: 'talla', amount: 8 }, { type: 'tension', amount: 1 }], outcome: 'Talla leads you through cooper cellars and drainage cuts without crossing the hidden food line.' },
      { id: 'ch02-choice-give-scouts-the-direct-path', label: 'Give scouts the direct path', detail: 'Reach the kiln sooner with Greywatch support, but expose the route Talla made you promise to protect.', effects: [{ type: 'flag', operation: 'add', flagId: 'talla-betrayed' }, { type: 'companion-quest', companionId: 'talla', stage: 2 }, { type: 'companion-loyalty', companionId: 'talla', amount: -10 }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Greywatch scouts take the food path at once; Talla watches them go and leaves by another door.' },
    ],
  }),
  defineScene({
    id: 'ch02-faction-sergeant-hale-at-the-infirmary', chapterId: 'ch02', region: 'gloamwood', slot: 15,
    type: 'companion', family: 'greywatch-command', relationship: { kind: 'faction', factionId: 'greywatch' }, weight: 24, pacing: 'recovery',
    illustrationId: 'scene-ch02-faction-sergeant-hale-at-the-infirmary', title: 'Sergeant Hale at the Infirmary',
    narrative: [
      'Sergeant Bren Hale reports to the infirmary with blood on one sleeve and a complete list of the south-gate dead. He stayed until the last civilian crossed the inner yard.',
      'Bren asks for the names of every guard who saw the stolen grain cart. A quick public report may steady the town; a private list is safer if the raiders had help inside Greywatch.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-post-the-south-gate-report', label: 'Post the south-gate report', detail: 'Give citizens an honest account, but reveal which surviving guards can identify the attackers.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-gate-report-public' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Bren pins the casualty list and defense account outside the infirmary before returning to the wall.' },
      { id: 'ch02-choice-seal-the-witness-list', label: 'Seal the witness list', detail: 'Protect the named guards from retaliation, but let rumors fill the gap left by silence.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-gate-witnesses-protected' }, { type: 'tension', amount: 1 }], outcome: 'Bren seals the list under his mark and assigns the witnesses to separate posts.' },
    ],
  }),
  defineScene({
    id: 'ch02-companion-mara-the-broken-command', chapterId: 'ch02', region: 'gloamwood', slot: 17,
    type: 'companion', family: 'mara-military-betrayal', relationship: { kind: 'companion', companionId: 'mara' }, weight: 30, pacing: 'quiet',
    illustrationId: 'scene-ch02-companion-mara-the-broken-command', title: 'Mara and the Broken Command',
    narrative: [
      'Mara finds an order that pulled her old scout section from the east farms two hours before the raid. Lieutenant Corven signed it to protect a private grain store, then left the farm families without warning.',
      'The order proves a military betrayal even if Corven did not plan the raid. Exposing him now may damage command during the defense; confronting him privately gives him time to destroy records.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4, requiredFlags: ['mara-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch02-companion-mara-scouts-before-silver'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-put-corvens-order-on-record', label: 'Put Corven\'s order on record', detail: 'Expose the betrayal during an active raid, risking command confusion but preserving the written proof.', effects: [{ type: 'flag', operation: 'add', flagId: 'military-betrayal-exposed' }, { type: 'companion-quest', companionId: 'mara', stage: 2 }, { type: 'companion-loyalty', companionId: 'mara', amount: 8 }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'Bren witnesses the order, removes Corven from command, and keeps the original under guard.' },
      { id: 'ch02-choice-confront-corven-in-private', label: 'Confront Corven in private', detail: 'Protect the chain of command in public, but risk giving Corven a chance to hide the full record.', effects: [{ type: 'flag', operation: 'add', flagId: 'corven-confronted-privately' }, { type: 'companion-quest', companionId: 'mara', stage: 2 }, { type: 'companion-loyalty', companionId: 'mara', amount: -4 }], outcome: 'Corven admits protecting his grain investment, then demands the order remain inside the command office.' },
    ],
  }),
  defineScene({
    id: 'ch02-companion-lyra-reads-the-seal', chapterId: 'ch02', region: 'gloamwood', slot: 22,
    type: 'companion', family: 'lyra-seal-reading', relationship: { kind: 'companion', companionId: 'lyra' }, weight: 30, pacing: 'quiet',
    illustrationId: 'scene-ch02-companion-lyra-reads-the-seal', title: 'Lyra Reads the Seal',
    narrative: [
      'Lyra Arden compares the Route Seven wax with two seals recovered from the raiders. One is a crude copy; the other used a genuine royal press on wax mixed in a regional military workshop.',
      'She can separate the seals with a slow solvent, or warm them with a controlled spell that is faster but may blur the clerk\'s hand beneath the wax.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-trust-lyras-slow-reading', label: 'Trust Lyra\'s slow reading', detail: 'Give her time and full access to the seals, but delay the search for the raid\'s supply point.', effects: [{ type: 'flag', operation: 'add', flagId: 'lyra-met' }, { type: 'flag', operation: 'add', flagId: 'royal-seals-collected' }, { type: 'flag', operation: 'add', flagId: 'evidence-shared-with-lyra' }, { type: 'flag', operation: 'add', flagId: 'lyra-expertise-respected' }, { type: 'companion-quest', companionId: 'lyra', stage: 1 }, { type: 'companion-loyalty', companionId: 'lyra', amount: 8 }], outcome: 'The solvent reveals the same clerk\'s narrow final stroke beneath both military impressions.' },
      { id: 'ch02-choice-ask-for-the-faster-spell', label: 'Ask for the faster spell', detail: 'Gain an immediate reading, but risk damaging the handwriting that links the forged orders.', effects: [{ type: 'flag', operation: 'add', flagId: 'lyra-met' }, { type: 'flag', operation: 'add', flagId: 'royal-seals-collected' }, { type: 'companion-quest', companionId: 'lyra', stage: 1 }, { type: 'companion-loyalty', companionId: 'lyra', amount: -3 }], outcome: 'Lyra warms the wax without protest; the press mark survives, but one line of handwriting softens.' },
    ],
  }),
  defineScene({
    id: 'ch02-companion-mara-scouts-before-silver', chapterId: 'ch02', region: 'gloamwood', slot: 29,
    type: 'companion', family: 'mara-visible-cost', relationship: { kind: 'companion', companionId: 'mara' }, weight: 32, pacing: 'quiet',
    illustrationId: 'scene-ch02-companion-mara-scouts-before-silver', title: 'Mara\'s Scouts Before Silver',
    narrative: [
      'Three survivors from Mara\'s scout section need food, arrows, and boots before they can search the quarry road. The council has offered you eighteen silver for defending the south gate.',
      'Giving the reward to the scouts buys reliable eyes outside Greywatch. Keeping it preserves your ability to prepare for the depot, and Mara will not pretend the cost is small.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4, requiredFlags: ['mara-met', 'military-betrayal-exposed'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch02-companion-mara-takes-the-road'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-give-the-reward-to-maras-scouts', label: 'Give the reward to Mara\'s scouts', detail: 'Surrender eighteen unbanked gold needed for your own gear so the scout section can return to duty.', effects: [{ type: 'gold', scope: 'unbanked', amount: -18 }, { type: 'flag', operation: 'add', flagId: 'mara-scouts-supplied' }, { type: 'companion-quest', companionId: 'mara', stage: 3 }, { type: 'companion-loyalty', companionId: 'mara', amount: 10 }], outcome: 'Mara buys boots and arrows in the market, then sends the scouts toward the lime kiln before noon.' },
      { id: 'ch02-choice-keep-the-defense-reward', label: 'Keep the defense reward', detail: 'Retain the silver for equipment, but leave Mara\'s scouts unable to search beyond the walls.', effects: [{ type: 'flag', operation: 'add', flagId: 'mara-scouts-left-unsupplied' }, { type: 'companion-quest', companionId: 'mara', stage: 3 }, { type: 'companion-loyalty', companionId: 'mara', amount: -6 }], outcome: 'Mara divides their remaining arrows and tells the scouts to guard the infirmary instead.' },
    ],
  }),
  defineScene({
    id: 'ch02-companion-mara-takes-the-road', chapterId: 'ch02', region: 'gloamwood', slot: 36,
    type: 'companion', family: 'mara-recruitment', relationship: { kind: 'companion', companionId: 'mara' }, weight: 40, pacing: 'quiet',
    illustrationId: 'scene-ch02-companion-mara-takes-the-road', title: 'Mara Takes the Road',
    narrative: [
      'After the council, Mara finds you at the east stair with a packed field roll. Her scouts are supplied, Corven\'s betrayal is on record, and the bridge families reached shelter because of your choices.',
      'She offers to join the search beyond Greywatch, but only if decisions about civilians remain as important as evidence and victory.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4, requiredFlags: ['mara-met', 'greywatch-civilians-protected', 'military-betrayal-exposed', 'mara-scouts-supplied'], excludedFlags: ['mara-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-invite-mara-to-join', label: 'Invite Mara to join', detail: 'Accept her field judgment and one active companion slot, knowing she will challenge reckless orders.', effects: [{ type: 'companion', companionId: 'mara', operation: 'recruit' }, { type: 'flag', operation: 'add', flagId: 'mara-recruited' }, { type: 'companion-loyalty', companionId: 'mara', amount: 4 }], outcome: 'Mara ties her scout badge inside her coat and joins you at the quarry-road gate.' },
      { id: 'ch02-choice-ask-mara-to-defend-greywatch', label: 'Ask Mara to defend Greywatch', detail: 'Leave her scouts protecting the town, but continue the depot search without her field command.', effects: [{ type: 'flag', operation: 'add', flagId: 'mara-remained-at-greywatch' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Mara accepts the post and gives you her marked map before returning to the east wall.' },
    ],
  }),
]);
