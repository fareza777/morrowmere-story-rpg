import { defineScene } from '../../builders';

export const CH03_MAIN = Object.freeze([
  defineScene({
    id: 'ch03-main-orders-for-redwater', chapterId: 'ch03', region: 'drowned-road', slot: 1,
    type: 'main', family: 'redwater-mission', anchorOrder: 1, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch03-main-orders-for-redwater', title: 'Orders for Redwater',
    narrative: [
      'Greywatch sends you south with the royal arrow, Jory Fen\'s signed Route Seven statement, and copies of the hidden-depot chits. The originals stay behind separate locks so one ambush cannot erase the case.',
      'Your immediate goal is Redwater, where human and orc patrols are gathering on opposite banks. You must warn the town, compare what each army has been told, and return any new proof to neutral custody.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-main-the-flooded-mile'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-seal-evidence-case', label: 'Seal the copies in oilskin', detail: 'Carry extra weight, but protect the evidence from floodwater.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-evidence-waterproofed' }], outcome: 'Quartermaster Hale knots the oilskin himself and records every item in your custody.' },
      { id: 'ch03-choice-divide-evidence-copies', label: 'Divide the copies between riders', detail: 'Reduce the risk of one loss, but trust two couriers on a dangerous road.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-evidence-divided' }, { type: 'threat', amount: 1 }], outcome: 'Two riders leave by different gates. Your own case now holds only the proof needed to persuade Redwater.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-the-flooded-mile', chapterId: 'ch03', region: 'drowned-road', slot: 6,
    type: 'main', family: 'flooded-road', anchorOrder: 2, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch03-main-the-flooded-mile', title: 'The Flooded Mile',
    narrative: [
      'The old road disappears beneath brown water where a sluice gate has been opened before the seasonal rise. Roof peaks and marker stones are the only straight line toward Redwater.',
      'Fresh axe cuts mark the gate chain. Someone wanted travelers forced onto the exposed ferry channel, where archers can see every boat.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-main-the-captured-courier'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-repair-sluice-chain', label: 'Help the flood workers close the gate', detail: 'Lose daylight while lowering the water for civilians behind you.', effects: [{ type: 'flag', operation: 'add', flagId: 'drowned-road-sluice-secured' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: -1 }], outcome: 'The water drops finger by finger. A usable strip of road returns before dusk.' },
      { id: 'ch03-choice-take-exposed-ferry', label: 'Take the exposed ferry channel', detail: 'Reach the next crossing quickly, but accept a higher ambush risk.', effects: [{ type: 'flag', operation: 'add', flagId: 'drowned-road-ferry-route' }, { type: 'threat', amount: 2 }], outcome: 'The ferryman keeps low behind the gunwale while distant signal mirrors follow your progress.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-the-captured-courier', chapterId: 'ch03', region: 'drowned-road', slot: 12,
    type: 'main', family: 'orc-courier', anchorOrder: 3, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch03-main-the-captured-courier', title: 'The Captured Courier',
    narrative: [
      'At a half-drowned watch post, three deserters have tied an orc courier named Kesh Var to the signal mast. His message tube bears the Free Host mark, but the deserters plan to sell both prisoner and papers.',
      'Kesh says he carries patrol changes to envoy Rukhar Stonehand. Taking his testimony could expose who redirected the orc patrols, but freeing him will anger human officers who want a bargaining piece.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-companion-courier-testimony', 'ch03-main-rukhar-at-the-crossing'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-free-kesh-with-his-message', label: 'Free Kesh and return his message', detail: 'Gain a witness and possible trust, while surrendering a useful military advantage.', effects: [{ type: 'flag', operation: 'add', flagId: 'orc-courier-spared' }, { type: 'faction', factionId: 'free-host', amount: 5 }, { type: 'faction', factionId: 'greywatch', amount: -2 }, { type: 'callback', promise: { targetEventId: 'ch03-companion-courier-testimony', deadline: { chapterId: 'ch03', slot: 16 } } }], outcome: 'Kesh reads the tube before sealing it again. The patrol order uses a human quartermaster code he has seen twice this week.' },
      { id: 'ch03-choice-hold-kesh-for-redwater', label: 'Take Kesh into neutral custody', detail: 'Preserve his testimony, but risk being seen as another captor.', effects: [{ type: 'flag', operation: 'add', flagId: 'orc-courier-detained' }, { type: 'callback', promise: { targetEventId: 'ch03-companion-courier-testimony', deadline: { chapterId: 'ch03', slot: 16 } } }, { type: 'tension', amount: 1 }], outcome: 'Kesh agrees to walk only after you cut the rope from his wrists. He promises nothing beyond one truthful statement.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-rukhar-at-the-crossing', chapterId: 'ch03', region: 'drowned-road', slot: 18,
    type: 'main', family: 'rukhar-crossing', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch03-main-rukhar-at-the-crossing', title: 'Rukhar at the Crossing',
    narrative: [
      'Rukhar Stonehand waits at a stone causeway with twelve Free Host soldiers and no raised weapons. He is broad, grey-haired, and tired of receiving orders that send young fighters into human farms.',
      'He will not call you ally. He will compare documents, permit passage, and judge whether you protect witnesses when their testimony becomes inconvenient.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-companion-rukhar-keeps-watch', 'ch03-main-evidence-on-both-sides'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-show-rukhar-custody-ledger', label: 'Show Rukhar the custody ledger', detail: 'Reveal exactly what Greywatch holds without surrendering the evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-met' }, { type: 'flag', operation: 'add', flagId: 'rukhar-evidence-shown' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 8 }, { type: 'callback', promise: { targetEventId: 'ch03-companion-rukhar-keeps-watch', deadline: { chapterId: 'ch03', slot: 24 } } }], outcome: 'Rukhar checks Jory\'s route code against a copied order from his own camp. The same clerk hand appears on both.' },
      { id: 'ch03-choice-trade-one-depot-chit', label: 'Trade one depot chit for an orc order', detail: 'Create equal custody, but give up Greywatch\'s exclusive control of one clue.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-met' }, { type: 'flag', operation: 'add', flagId: 'evidence-shared-with-free-host' }, { type: 'faction', factionId: 'free-host', amount: 4 }, { type: 'faction', factionId: 'greywatch', amount: -1 }, { type: 'callback', promise: { targetEventId: 'ch03-companion-rukhar-keeps-watch', deadline: { chapterId: 'ch03', slot: 24 } } }], outcome: 'Each side leaves with evidence that can embarrass its own officers. Rukhar calls that a fair beginning, not trust.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-evidence-on-both-sides', chapterId: 'ch03', region: 'drowned-road', slot: 25,
    type: 'main', family: 'paired-caches', anchorOrder: 5, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch03-main-evidence-on-both-sides', title: 'Evidence on Both Sides',
    narrative: [
      'A human cache under the east bank and an orc cache beneath the west ferry contain the same lamp oil, bowstrings, black wax, and filing tools for removing royal marks. Each also holds a banner meant to incriminate the other side.',
      'The matching packing knots and inventory hand turn suspicion into a physical pattern. The paired-cache kit can prove coordinated manipulation if it reaches Redwater with its custody intact.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-main-the-attack-with-two-banners'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-carry-paired-cache-kit', label: 'Carry samples from both caches', detail: 'Accept slower travel and make yourself the obvious target, but preserve credible comparative proof.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'paired-cache-kit' }, { type: 'flag', operation: 'add', flagId: 'peace-evidence-carried' }, { type: 'threat', amount: 2 }], outcome: 'Rukhar and your Greywatch escort sign the same custody strip. Neither can later deny what was packed beside their own colors.' },
      { id: 'ch03-choice-send-cache-rubbings-ahead', label: 'Send rubbings to Redwater', detail: 'Move faster with weaker proof that hostile officers may dismiss as copies.', effects: [{ type: 'flag', operation: 'add', flagId: 'paired-cache-rubbings' }, { type: 'faction', factionId: 'border-council', amount: 1 }], outcome: 'The rubbings leave by skiff. You keep the matching wax and knots, but not the full cache kit.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-the-attack-with-two-banners', chapterId: 'ch03', region: 'drowned-road', slot: 34,
    type: 'main', family: 'two-banner-attack', anchorOrder: 6, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch03-main-the-attack-with-two-banners', title: 'The Attack with Two Banners',
    narrative: [
      'Near the last ferry, one squad attacks from the reeds under Greywatch colors while another fires from the levee beneath a Free Host banner. Their arrows avoid each other and converge on the evidence case.',
      'A fallen attacker wears a reversible tabard stitched black between the two colors. The raid is not a clash between armies; it is a performance meant to begin one.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-main-redwater-in-sight'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-capture-two-banner-leader', label: 'Cut off the levee leader', detail: 'Risk the exposed bank to secure a living witness and the reversible tabard.', effects: [{ type: 'flag', operation: 'add', flagId: 'two-banner-leader-captured' }, { type: 'evidence', operation: 'add', evidenceId: 'redwater-testimony' }, { type: 'combat', encounterId: 'enc-ch03-two-signal-fires' }], outcome: 'The leader survives and admits that both squads received pay from the same masked quartermaster.' },
      { id: 'ch03-choice-protect-evidence-ferry', label: 'Hold the evidence ferry', detail: 'Keep the proof safe while allowing more attackers to escape toward Redwater.', effects: [{ type: 'flag', operation: 'add', flagId: 'paired-cache-kit-secured' }, { type: 'combat', encounterId: 'enc-ch03-two-signal-fires' }, { type: 'threat', amount: 1 }], outcome: 'The ferry clears the killing ground. Riders carrying both stolen colors race ahead of you.' },
    ],
  }),
  defineScene({
    id: 'ch03-main-redwater-in-sight', chapterId: 'ch03', region: 'drowned-road', slot: 42,
    type: 'main', family: 'redwater-approach', anchorOrder: 7, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch03-main-redwater-in-sight', title: 'Redwater in Sight',
    narrative: [
      'Redwater stands on a dry ridge above the flooded farms. Captain Elian Roake\'s Greywatch companies hold the eastern meadow; Shield-Captain Brakka Tor\'s Free Host forms on the western bank.',
      'Between them, Reeve Nessa Holt has gathered millers, ferrymen, and displaced families inside the town palisade. Your evidence has reached the crisis, but armed scouts are already measuring the field.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-two-armies-one-field'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-enter-through-neutral-gate', label: 'Enter through Redwater\'s neutral gate', detail: 'Put the town council between you and both armies before presenting evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-neutral-entry' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Reeve Holt closes the gate behind you and demands that every claim be made where civilians can hear it.' },
      { id: 'ch03-choice-ride-between-the-lines', label: 'Ride between the two lines', detail: 'Display the evidence case openly and risk fire from anyone who wants the parley stopped.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-open-parley' }, { type: 'tension', amount: -1 }, { type: 'threat', amount: 1 }], outcome: 'Both lines watch you cross the field. For one evening, neither commander wants to be seen firing first.' },
    ],
  }),
]);
