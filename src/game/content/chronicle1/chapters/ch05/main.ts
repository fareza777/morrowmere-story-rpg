import { defineScene } from '../../builders';

export const CH05_MAIN = Object.freeze([
  defineScene({
    id: 'ch05-main-the-mouth-of-embervault', chapterId: 'ch05', region: 'embervault', slot: 1,
    type: 'main', family: 'embervault-entry', anchorOrder: 1, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch05-main-the-mouth-of-embervault', title: 'The Mouth of Embervault',
    narrative: [
      'The Redwater settlement yielded a shipment code stamped E-17 and a route to Embervault, an iron mine closed after a furnace collapse. Fresh cart tracks now cross the chained entrance.',
      'The gate clerk recognizes the transfer code but not your faces. You can present the captured order as inspectors or enter through the ore drainage cut below the road.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-present-the-e17-transfer-order', label: 'Present the E-17 transfer order', detail: 'Enter through the staffed gate under a false role, risking close inspection of the captured seal.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-entered-as-inspectors' }, { type: 'tension', amount: 1 }], outcome: 'The clerk copies the code and waves your party toward the lower workshops under armed escort.' },
      { id: 'ch05-choice-use-the-ore-drainage-cut', label: 'Use the ore drainage cut', detail: 'Avoid the gate record, but risk injury and lost time in a flooded maintenance tunnel.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-entered-through-drain' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: 1 }], outcome: 'You crawl beneath the chained gate and emerge beside ore carts inside the abandoned mine yard.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-the-missing-shift', chapterId: 'ch05', region: 'embervault', slot: 7,
    type: 'main', family: 'missing-workers', anchorOrder: 2, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch05-main-the-missing-shift', title: 'The Missing Shift',
    narrative: [
      'The public shift board lists forty-two miners, but the meal ledger feeds sixty. Eighteen workers are assigned only by family name and moved behind the sealed furnace wall each night.',
      'Forewoman Dessa Krail says guards threaten relatives outside the mine whenever a worker refuses. The hidden shift changed at noon and can be followed now or questioned through its frightened record keeper.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-follow-the-hidden-shift', label: 'Follow the hidden shift', detail: 'Stay close enough to find the sealed workshop, but risk exposing the workers as your guides.', effects: [{ type: 'flag', operation: 'add', flagId: 'hidden-shift-followed' }, { type: 'threat', amount: 1 }], outcome: 'You trail the workers through a ventilation gallery until guards admit them behind a false stone wall.' },
      { id: 'ch05-choice-question-the-meal-clerk', label: 'Question the meal clerk', detail: 'Protect the workers from immediate suspicion, but give the next shift time to disappear underground.', effects: [{ type: 'flag', operation: 'add', flagId: 'meal-ledger-source-protected' }, { type: 'tension', amount: 1 }], outcome: 'The clerk marks a service stair and names the guard who collects food for the unlisted workers.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-forge-behind-the-wall', chapterId: 'ch05', region: 'embervault', slot: 13,
    type: 'main', family: 'hidden-forge', anchorOrder: 3, weight: 100, pacing: 'danger', threatChange: 2,
    illustrationId: 'scene-ch05-main-forge-behind-the-wall', title: 'The Forge Behind the Wall',
    narrative: [
      'Behind the false wall, a working forge stamps royal arrowheads, human spear sockets, and orc-pattern axe collars from the same steel. Coerced smiths change dies when a bell rings.',
      'The forge master starts clearing the benches as soon as he sees strangers. Worker testimony can preserve how the line operates; the stamped dies are harder physical proof to replace.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-move-the-smiths-to-safety', label: 'Move the smiths to safety', detail: 'Protect living witnesses first, but give the forge master time to damage dies and records.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-smiths-protected' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }], outcome: 'Dessa leads the smiths into the ore gallery while two of them describe each weapon line on record.' },
      { id: 'ch05-choice-seize-the-stamping-dies', label: 'Seize the stamping dies', detail: 'Secure physical proof of both weapon patterns, but leave frightened workers beside armed guards longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'paired-weapon-dies-seized' }, { type: 'tension', amount: 1 }], outcome: 'You lock the human and orc dies in one tool chest before the forge master reaches the quenching trough.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-the-quartermasters-ledger', chapterId: 'ch05', region: 'embervault', slot: 20,
    type: 'main', family: 'supply-ledger', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch05-main-the-quartermasters-ledger', title: 'The Quartermaster\'s Ledger',
    narrative: [
      'A locked accounting room contains a quartermaster ledger that matches the Redwater shipment codes. It records stolen royal stock, payments to provocateurs, and deliveries under both human and orc markings.',
      'Several authorization pages are stitched into the spine with numbered thread. Removing the ledger preserves the complete chain; copying the pages is slower but keeps the original hidden from immediate pursuit.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-take-the-complete-ledger', label: 'Take the complete ledger', detail: 'Carry the strongest evidence openly, but make the party easier to identify during the escape.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }, { type: 'flag', operation: 'add', flagId: 'complete-ledger-recovered' }, { type: 'threat', amount: 1 }], outcome: 'Jory wraps the ledger in oilcloth and checks that every numbered authorization page remains bound.' },
      { id: 'ch05-choice-copy-the-authorization-pages', label: 'Copy the authorization pages', detail: 'Leave the original in place to delay discovery, but risk losing details during a hurried transcription.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger-copy' }, { type: 'flag', operation: 'add', flagId: 'ledger-authorization-copied' }, { type: 'tension', amount: 1 }], outcome: 'Lyra and Jory copy names, payments, seal marks, and thread numbers onto separate sheets.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-weapons-for-both-armies', chapterId: 'ch05', region: 'embervault', slot: 27,
    type: 'main', family: 'symmetric-supply-proof', anchorOrder: 5, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch05-main-weapons-for-both-armies', title: 'Weapons for Both Armies',
    narrative: [
      'Two armory chambers share one loading rail. One holds Greywatch-style spears and royal arrows; the other holds orc axes, Free Host shields, and human-made harness cut to fit orc riders.',
      'Matching heat numbers link both rooms to the same furnace batch. A convoy is preparing to remove one side of the evidence before the mine alarm reaches the surface.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-mark-matching-heat-numbers', label: 'Mark matching heat numbers', detail: 'Document the shared furnace batch, but remain in the armory while the convoy begins moving.', effects: [{ type: 'flag', operation: 'add', flagId: 'symmetric-supply-documented' }, { type: 'evidence', operation: 'add', evidenceId: 'paired-cache-kit' }, { type: 'threat', amount: 1 }], outcome: 'Dessa confirms the heat numbers while Jory sketches paired weapons beside the same batch plate.' },
      { id: 'ch05-choice-disable-the-loading-rail', label: 'Disable the loading rail', detail: 'Keep both weapon stocks in place for later witnesses, but risk destroying the clearest movement records.', effects: [{ type: 'flag', operation: 'add', flagId: 'paired-armories-preserved' }, { type: 'vitals', health: -2 }], outcome: 'You drive a wedge into the rail gears, stopping both loaded carts inside the shared chamber.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-the-name-severin-voss', chapterId: 'ch05', region: 'embervault', slot: 34,
    type: 'main', family: 'voss-attribution', anchorOrder: 6, weight: 100, pacing: 'quiet', tensionChange: 2,
    illustrationId: 'scene-ch05-main-the-name-severin-voss', title: 'The Name Severin Voss',
    narrative: [
      'The ledger\'s numbered thread leads to a sealed authorization kept beneath the forge office floor. It orders equal weapons delivered to opposing border forces and releases payment after each provoked clash.',
      'The full signature reads Marshal Severin Voss. The seal, clerk\'s hand, payment countersignature, and Dessa\'s testimony agree; the respected commander built the crisis he claimed he would contain.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-bind-the-authorization-to-the-ledger', label: 'Bind the authorization to the ledger', detail: 'Keep the complete proof chain together, but risk losing both if the evidence case is seized.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-authorization-bound' }, { type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'Jory threads the authorization beside its payment entry and seals the binding before three witnesses.' },
      { id: 'ch05-choice-split-signature-seal-and-testimony', label: 'Split signature, seal, and testimony', detail: 'Create three independent custody routes, but make a later hearing depend on assembling them again.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-proof-divided' }, { type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }], outcome: 'Lyra takes the seal copy, Jory carries the signature, and Dessa memorizes the payment entry.' },
    ],
  }),
  defineScene({
    id: 'ch05-main-escape-through-the-cinder-shaft', chapterId: 'ch05', region: 'embervault', slot: 43,
    type: 'main', family: 'embervault-escape', anchorOrder: 7, weight: 100, pacing: 'danger', threatChange: 3,
    illustrationId: 'scene-ch05-main-escape-through-the-cinder-shaft', title: 'Escape Through the Cinder Shaft',
    narrative: [
      'Demolition charges close the main galleries while smoke fills the hidden forge. The old cinder shaft reaches the northern slope, but only after a ladder climb above the furnace exhaust.',
      'A stolen contingency order says Voss will strike Greywatch if the ledger leaves Embervault. Mara\'s runner waits at the shaft mouth with word that siege columns are already moving east.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-smoke-over-greywatch'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-send-the-evidence-up-first', label: 'Send the evidence up first', detail: 'Protect the proof before people climb, but leave workers longer in smoke below the shaft.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-evidence-escaped' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'tension', amount: 1 }], outcome: 'The oilcloth case reaches Mara\'s runner before the first workers begin climbing through the heat.' },
      { id: 'ch05-choice-send-the-workers-up-first', label: 'Send the workers up first', detail: 'Move living witnesses out of the smoke, but keep the ledger below while charges break nearby supports.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-witnesses-escaped' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'threat', amount: 1 }], outcome: 'Dessa and the smiths climb first; Jory follows last with the evidence tied beneath his coat.' },
    ],
  }),
]);
