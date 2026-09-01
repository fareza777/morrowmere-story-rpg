import { defineScene } from '../../builders';

export const CH07_COMPANION = Object.freeze([
  defineScene({
    id: 'ch07-companion-mara-maps-the-last-march', chapterId: 'ch07', region: 'crownless-keep', slot: 4,
    type: 'companion', family: 'mara-keep-recon', relationship: { kind: 'companion', companionId: 'mara' },
    weight: 75, pacing: 'quiet', illustrationId: 'scene-ch07-companion-mara-maps-the-last-march',
    title: 'Mara Maps the Last March',
    narrative: [
      'Greywatch scouts led by Mara Vey return with a charcoal map of Crownless Keep\'s western ridge, patrol intervals, and three places where civilian carts still enter under inspection.',
      'They can remain ahead to mark the army route or escort the evidence wagons through country still watched by Voss\'s riders. They cannot safely do both.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-send-maras-scouts-ahead', label: 'Send Mara\'s scouts ahead', detail: 'Gain precise patrol timing near the keep while leaving the evidence wagons with ordinary road guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-patrols-mapped' }, { type: 'companion-loyalty', companionId: 'mara', amount: 5 }, { type: 'threat', amount: -1 }], outcome: 'Mara divides the ridge into timed sectors and sends one scout toward each signal tower.' },
      { id: 'ch07-choice-keep-scouts-with-the-archive', label: 'Keep scouts with the archive', detail: 'Protect the proof on the march and approach the keep with older, less reliable patrol information.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-archive-scout-guard' }, { type: 'companion-loyalty', companionId: 'mara', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'The scouts form around Jory\'s wagons and leave the western ridge to the main column.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-talla-finds-the-drainage-postern', chapterId: 'ch07', region: 'crownless-keep', slot: 9,
    type: 'companion', family: 'talla-keep-postern', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 80, pacing: 'quiet', illustrationId: 'scene-ch07-companion-talla-finds-the-drainage-postern',
    title: 'Talla Finds the Drainage Postern',
    narrative: [
      'Goblin scout Talla Quickhand compares an old maintenance invoice with the ridge map and locates a drainage postern behind the keep kitchens. The opening is narrow, gated, and probably unwatched.',
      'Marking it for the whole march risks discovery. Keeping the route to a small covert party protects secrecy but limits how much evidence can pass.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-map-the-postern-for-a-small-party', label: 'Map the postern for a small party', detail: 'Preserve a covert entrance for a few people and accept that heavy evidence remains outside.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-postern-mapped' }, { type: 'companion-loyalty', companionId: 'talla', amount: 6 }, { type: 'threat', amount: -1 }], outcome: 'Talla marks the gate pins, drain depth, and kitchen stair on one copy kept inside her coat.' },
      { id: 'ch07-choice-mark-the-postern-for-the-column', label: 'Mark the postern for the column', detail: 'Prepare a broader infiltration route while increasing the chance that scouts notice the work.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-postern-column-route' }, { type: 'companion-loyalty', companionId: 'talla', amount: 3 }, { type: 'threat', amount: 2 }], outcome: 'Engineers widen the drain approach under canvas as keep signal mirrors begin searching the ridge.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-lyra-reads-the-emergency-compact', chapterId: 'ch07', region: 'crownless-keep', slot: 11,
    type: 'companion', family: 'lyra-compact-law', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 85, pacing: 'quiet', illustrationId: 'scene-ch07-companion-lyra-reads-the-emergency-compact',
    title: 'Lyra Reads the Emergency Compact',
    narrative: [
      'Lyra studies the recovered compact register and explains its narrow authority. Recognized border governors may ratify a temporary Protector only with lawful seals, public witnesses, and an uncoerced count.',
      'The rule gives Voss a credible legal stage, not a rightful claim. Lyra can prepare a plain public challenge or a technical seal objection that fewer delegates will understand.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-prepare-the-public-compact-challenge', label: 'Prepare the public compact challenge', detail: 'Use clear language about coercion and witnesses while leaving detailed seal flaws for later.', effects: [{ type: 'flag', operation: 'add', flagId: 'compact-public-challenge-ready' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 5 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Lyra writes three questions any governor can answer before Voss asks for a vote.' },
      { id: 'ch07-choice-prepare-the-seal-objection', label: 'Prepare the seal objection', detail: 'Build a precise legal challenge around stamp custody while relying on experts to explain it.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'compact-seal-objection' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 4 }], outcome: 'Lyra catalogs every lawful press and identifies two compact seals copied from the same damaged die.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-rukhars-witness-rides-north', chapterId: 'ch07', region: 'crownless-keep', slot: 15,
    type: 'companion', family: 'rukhar-keep-testimony', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 80, pacing: 'quiet', illustrationId: 'scene-ch07-companion-rukhars-witness-rides-north',
    title: 'Rukhar\'s Witness Rides North',
    narrative: [
      'A Free Host courier brings Rukhar\'s Redwater testimony and Brakka Tor\'s recognition seal. If Rukhar joined the road, he confirms it himself; if he remained behind, the signed custody chain speaks for him.',
      'Presenting the testimony grants an orc voice at the keep and exposes the courier to Voss\'s patrols. Sealing it inside the archive is safer but leaves the march visibly human-led.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-present-rukhars-testimony-openly', label: 'Present Rukhar\'s testimony openly', detail: 'Recognize the Free Host as a lawful witness and accept political resistance from human hardliners.', requirements: [{ type: 'flag', flagId: 'border-peace', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'free-host-recognized-at-keep' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 6 }, { type: 'faction', factionId: 'free-host', amount: 4 }], outcome: 'The testimony rides beneath its own seal, making the Redwater settlement part of the public case.' },
      { id: 'ch07-choice-seal-the-testimony-in-the-archive', label: 'Seal the testimony in the archive', detail: 'Protect the courier and document while postponing visible Free Host participation at the keep.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'rukhar-redwater-testimony' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 2 }], outcome: 'Jory records the testimony beside the paired-cache kit and sends the courier back by a safer road.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-caldus-and-the-abbey-delegate', chapterId: 'ch07', region: 'crownless-keep', slot: 22,
    type: 'companion', family: 'caldus-abbey-delegate', relationship: { kind: 'companion', companionId: 'caldus' },
    weight: 70, pacing: 'recovery', illustrationId: 'scene-ch07-companion-caldus-and-the-abbey-delegate',
    title: 'Caldus and the Abbey Delegate',
    narrative: [
      'Brother Caldus arrives with an Iron Abbey delegate whose escort was wounded by Voss\'s outer patrol. She will testify that the coronation invitations arrived with threats against abbey hostages.',
      'The delegate needs treatment before the climb. Caldus can remain with her, or send his signed medical account while joining the vanguard.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-let-caldus-escort-the-delegate', label: 'Let Caldus escort the delegate', detail: 'Keep a credible witness alive and rested while losing his support during the outer approach.', effects: [{ type: 'flag', operation: 'add', flagId: 'abbey-delegate-protected' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 5 }, { type: 'faction', factionId: 'abbey', amount: 3 }], outcome: 'Caldus slows the delegate\'s bleeding and brings her to the keep in a covered wagon.' },
      { id: 'ch07-choice-carry-caldus-medical-account', label: 'Carry Caldus\'s medical account', detail: 'Keep Caldus with the advance and risk the injured delegate arriving too late for the hearing.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'abbey-coercion-account' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'Caldus signs every wound and threat in his ledger before the abbey wagon takes the slower road.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-lyra-finds-the-counterfeit-governors', chapterId: 'ch07', region: 'crownless-keep', slot: 25,
    type: 'companion', family: 'lyra-counterfeit-seals', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 85, pacing: 'quiet', illustrationId: 'scene-ch07-companion-lyra-finds-the-counterfeit-governors',
    title: 'Lyra Finds the Counterfeit Governors',
    narrative: [
      'Lyra compares the guest list with the compact register and finds three supposed governors whose seals belong to districts dissolved after the old monarchy fell. Voss needs their votes to reach his count.',
      'Exposing the names now may cause replacements to appear. Preserving the trap allows the false delegates to enter the hall under observation.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-publish-the-false-governor-names', label: 'Publish the false governor names', detail: 'Warn every delegate before entry while giving Voss time to alter his planned vote count.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'counterfeit-governor-list' }, { type: 'flag', operation: 'add', flagId: 'false-governors-exposed-early' }, { type: 'threat', amount: 1 }], outcome: 'Runners copy the three names to every arriving delegation before the keep closes its lower gate.' },
      { id: 'ch07-choice-watch-the-false-delegates-enter', label: 'Watch the false delegates enter', detail: 'Preserve surprise for the hearing while allowing impostors deeper access to the keep.', effects: [{ type: 'flag', operation: 'add', flagId: 'false-governors-tracked' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 5 }], outcome: 'Lyra marks each impostor by seal flaw and assigns a witness to follow them into the hall.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-talla-refuses-the-stewards-price', chapterId: 'ch07', region: 'crownless-keep', slot: 31,
    type: 'companion', family: 'talla-steward-bargain', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 75, pacing: 'quiet', illustrationId: 'scene-ch07-companion-talla-refuses-the-stewards-price',
    title: 'Talla Refuses the Steward\'s Price',
    narrative: [
      'A keep steward offers Talla gold and safe papers for every goblin family near Redwater if she reveals which hidden route the march will use. He claims the bargain avoids a bloody gate assault.',
      'Talla recognizes the papers as genuine but revocable. Feeding the steward a false route could protect the real approach while drawing defenders toward civilian workers.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-refuse-the-stewards-bargain', label: 'Refuse the steward\'s bargain', detail: 'Keep every covert route private and surrender a chance at legal papers for Talla\'s people.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-routes-kept-secret' }, { type: 'flag', operation: 'add', flagId: 'profitable-betrayal-refused' }, { type: 'companion-loyalty', companionId: 'talla', amount: 7 }, { type: 'threat', amount: 1 }], outcome: 'Talla tears the unsigned corner from the papers and sends the steward back without a route.' },
      { id: 'ch07-choice-feed-the-steward-an-empty-route', label: 'Feed the steward an empty route', detail: 'Misdirect keep guards toward an abandoned stair while risking workers questioned near it.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-guards-misdirected' }, { type: 'companion-loyalty', companionId: 'talla', amount: 4 }, { type: 'faction', factionId: 'black-banner', amount: -2 }], outcome: 'The steward carries away a convincing map to a stair Talla checked and cleared that morning.' },
    ],
  }),
  defineScene({
    id: 'ch07-companion-rukhar-holds-the-gate-line', chapterId: 'ch07', region: 'crownless-keep', slot: 36,
    type: 'companion', family: 'rukhar-gate-discipline', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 80, pacing: 'danger', illustrationId: 'scene-ch07-companion-rukhar-holds-the-gate-line',
    title: 'Rukhar Holds the Gate Line',
    narrative: [
      'Free Host witnesses and Greywatch survivors meet under fire in the lower ward. Rukhar, present or represented by his written command, orders the orc line to protect evidence bearers before pursuing retreating guards.',
      'The human line can mirror that order or chase the keep veterans before they regroup. The choice decides whether the march acts like a coalition when pressure is highest.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-mirror-rukhars-protection-order', label: 'Mirror Rukhar\'s protection order', detail: 'Keep both lines around witnesses and evidence while allowing more keep veterans to escape upstairs.', effects: [{ type: 'flag', operation: 'add', flagId: 'gate-lines-held-together' }, { type: 'flag', operation: 'add', flagId: 'free-host-recognized-at-keep' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 6 }, { type: 'tension', amount: -1 }], outcome: 'Human and orc shields close around the archive wagon while delegates cross the customs court.' },
      { id: 'ch07-choice-pursue-the-retreating-veterans', label: 'Pursue the retreating veterans', detail: 'Prevent defenders regrouping in the upper ward while leaving the custody line thinner below.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-veterans-pursued' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 2 }, { type: 'threat', amount: 2 }], outcome: 'The pursuit reaches the upper stair quickly, but the evidence bearers lose half their guard.' },
    ],
  }),
]);
