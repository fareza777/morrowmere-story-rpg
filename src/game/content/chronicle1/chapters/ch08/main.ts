import { defineScene } from '../../builders';

const KEEP_CUSTODIANS = [
  'keep-border-council',
  'keep-greywatch',
  'keep-free-host',
  'keep-neutral-wardens',
] as const;

function selectCustodian(selected: typeof KEEP_CUSTODIANS[number]) {
  return [
    { type: 'flag' as const, operation: 'add' as const, flagId: selected },
    ...KEEP_CUSTODIANS
      .filter((flag) => flag !== selected)
      .map((flag) => ({ type: 'flag' as const, operation: 'remove' as const, flagId: flag })),
  ];
}

export const CH08_MAIN = Object.freeze([
  defineScene({
    id: 'ch08-main-guests-for-a-false-king', chapterId: 'ch08', region: 'crownless-keep', slot: 1,
    type: 'main', family: 'false-coronation-guests', anchorOrder: 1, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-guests-for-a-false-king', title: 'Guests for a False King',
    narrative: [
      'Inside Crownless Keep, armed ushers separate the invited governors into those persuaded by grain and road promises and those compelled by hostage threats. The hearing bell will sound when Voss has enough seals in the hall.',
      'Your immediate goal is to protect a credible group of witnesses without starting a panic. The guest list identifies coercion, while the surviving delegates can explain what each promise cost.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-the-hall-of-seals'], callbackPromises: [], choices: [
      { id: 'ch08-choice-open-the-guarded-guest-rooms', label: 'Open the guarded guest rooms', detail: 'Free compelled delegates before the hearing while armed ushers can warn the hall of your position.', effects: [{ type: 'flag', operation: 'add', flagId: 'compelled-guests-freed' }, { type: 'evidence', operation: 'add', evidenceId: 'governor-coercion-testimony' }, { type: 'threat', amount: 2 }], outcome: 'The locks open and each governor names the hostage, debt, or threatened town used to bring them here.' },
      { id: 'ch08-choice-confront-the-persuaded-delegates', label: 'Confront the persuaded delegates', detail: 'Challenge Voss\'s supply bargains in private while compelled guests remain under guard for longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'persuaded-guests-questioned' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'tension', amount: 1 }], outcome: 'Two governors admit that Voss first interrupted their grain routes, then offered to restore them for a seal.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-the-hall-of-seals', chapterId: 'ch08', region: 'crownless-keep', slot: 6,
    type: 'main', family: 'compact-seal-audit', anchorOrder: 2, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-the-hall-of-seals', title: 'The Hall of Seals',
    narrative: [
      'The lower hall holds lawful governor seals in numbered cases beside fresh impressions prepared by Voss\'s clerks. Under the Emergency Compact, every vote requires a recognized seal, a public witness, and an uncoerced owner.',
      'The register proves which cases changed hands. Comparing impressions exposes copied dies, while preserving the cases lets each living delegate reclaim lawful custody before the hearing.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-evidence-before-the-realm'], callbackPromises: [], choices: [
      { id: 'ch08-choice-compare-every-seal-impression', label: 'Compare every seal impression', detail: 'Document the counterfeit pattern completely while clerks retain physical control of some lawful cases.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'false-coronation-seal-audit' }, { type: 'flag', operation: 'add', flagId: 'compact-forgeries-documented' }, { type: 'tension', amount: 1 }], outcome: 'Lyra and the record clerks match repeated chips in impressions supposedly made by different lawful dies.' },
      { id: 'ch08-choice-return-the-seals-to-the-governors', label: 'Return the seals to the governors', detail: 'Restore lawful custody before the count while preserving fewer technical details about the copied dies.', effects: [{ type: 'flag', operation: 'add', flagId: 'lawful-seals-restored' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Each governor signs the custody register beside two witnesses before reclaiming a numbered seal case.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-evidence-before-the-realm', chapterId: 'ch08', region: 'crownless-keep', slot: 12,
    type: 'main', family: 'public-evidence-hearing', anchorOrder: 3, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-evidence-before-the-realm', title: 'Evidence Before the Realm',
    narrative: [
      'The hall fills with governors, witnesses, soldiers, and record clerks. Jory lays out the Embervault ledger, forge testimony, siege orders, hostage accounts, and seal records with every transfer named aloud.',
      'The documents show a single pattern: Voss armed both sides, obstructed relief, coerced officials, and prepared the Compact vote while presenting himself as the only answer. The case can lead with living witnesses or the paper chain.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-voss-offers-order'], callbackPromises: [], choices: [
      { id: 'ch08-choice-let-the-witnesses-lead', label: 'Let the witnesses lead', detail: 'Put civilians and compelled delegates before the hall, accepting that frightened testimony may be challenged.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'flag', operation: 'add', flagId: 'public-witness-case-heard' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Jory, the forge survivors, and freed delegates describe matching orders before the ledgers confirm each account.' },
      { id: 'ch08-choice-let-the-record-chain-lead', label: 'Let the record chain lead', detail: 'Build the accusation from seals and custody entries, leaving the human cost until the hall understands the scheme.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'flag', operation: 'add', flagId: 'public-record-case-heard' }, { type: 'evidence', operation: 'add', evidenceId: 'complete-voss-case' }], outcome: 'Every ledger, order, and impression passes through named hands until Voss can dispute only the meaning.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-voss-offers-order', chapterId: 'ch08', region: 'crownless-keep', slot: 18,
    type: 'main', family: 'voss-final-argument', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-voss-offers-order', title: 'Voss Offers Order',
    narrative: [
      'Marshal Voss does not deny that the realm is divided. He points to unsafe roads, private tolls, abandoned villages, rival authorities, and eighteen years without a crown. He argues that forced unity under one temporary Protector can end the suffering faster than another council debate.',
      'His diagnosis is familiar because people lived it, but he manufactured the crisis he now promises to solve. The ledger, the border peace, Greywatch\'s losses, and the people in this hall each offer a different way to make that answer public before the confrontation.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-the-marshal-and-the-banner'], callbackPromises: [], choices: [
      { id: 'ch08-choice-answer-voss-with-the-coalition', label: 'Answer with the road coalition', detail: 'Show that independent communities accepted shared rules without surrendering their voice to one commander.', requirements: [{ type: 'flag', flagId: 'coalition-formed', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'voss-answered-by-coalition' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Coalition officers read their signed limits on command, reprisals, supplies, and evidence custody before the hall.' },
      { id: 'ch08-choice-answer-voss-with-border-peace', label: 'Answer with the border peace', detail: 'Use the Redwater settlement to prove that safety can be negotiated without inventing a permanent enemy.', requirements: [{ type: 'flag', flagId: 'border-peace', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'voss-answered-by-border-peace' }, { type: 'faction', factionId: 'free-host', amount: 3 }], outcome: 'The signed Redwater terms show roads reopened and prisoners returned without a Protector\'s command.' },
      { id: 'ch08-choice-answer-voss-with-greywatch', label: 'Answer with Greywatch\'s survival', detail: 'Name the town and hostages Voss was willing to destroy when they could expose his authority.', requirements: [{ type: 'flag', flagId: 'greywatch-council-survived', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'voss-answered-by-greywatch' }, { type: 'faction', factionId: 'greywatch', amount: 3 }], outcome: 'Bren Hale reads Voss\'s destruction order beside the list of civilians who survived it.' },
      { id: 'ch08-choice-answer-voss-with-his-own-orders', label: 'Answer with his own orders', detail: 'Use the complete paper trail to show that Voss created the danger behind every promise of safety.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-answered-by-orders' }, { type: 'evidence', operation: 'add', evidenceId: 'voss-public-rebuttal' }], outcome: 'You place the supply seizures, false patrol orders, and siege authorization in the sequence Voss approved them.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-the-marshal-and-the-banner', chapterId: 'ch08', region: 'crownless-keep', slot: 25,
    type: 'main', family: 'marshal-final-resolution', anchorOrder: 5, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch08-main-the-marshal-and-the-banner', title: 'The Marshal and the Banner',
    narrative: [
      'Voss holds the command platform while loyal guards keep the Coronation Engine moving. The same levers drive the seal press, alarm bell, hall portcullis, and defensive shutters; none is magical, but together they can trap the witnesses and stamp a false decree.',
      'The public case has been heard. You must now end Voss\'s control of the hall, knowing that custody, force, or evacuation will leave different consequences for the border.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-who-keeps-the-crownless-keep'], callbackPromises: [], choices: [
      { id: 'ch08-choice-take-voss-into-public-custody', label: 'Take Voss into public custody', detail: 'Keep the witnesses in place and demand surrender under the exposed record, risking a longer fight around civilians.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'flag', operation: 'add', flagId: 'war-mechanism-dismantled' }, { type: 'flag', operation: 'add', flagId: 'border-war-stopped' }, { type: 'flag', operation: 'remove', flagId: 'open-war' }, { type: 'flag', operation: 'remove', flagId: 'failed-accountability' }, { type: 'flag', operation: 'remove', flagId: 'forceful-settlement' }], outcome: 'The hall guard lowers its weapons one rank at a time, and Voss is bound before the governors whose seals he tried to take.' },
      { id: 'ch08-choice-seize-the-command-platform', label: 'Seize the command platform', detail: 'Storm the machinery and end organized resistance quickly, accepting injuries and a settlement imposed by force.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-exposed' }, { type: 'flag', operation: 'add', flagId: 'war-mechanism-dismantled' }, { type: 'flag', operation: 'add', flagId: 'border-war-stopped' }, { type: 'flag', operation: 'add', flagId: 'forceful-settlement' }, { type: 'flag', operation: 'remove', flagId: 'open-war' }, { type: 'flag', operation: 'remove', flagId: 'failed-accountability' }, { type: 'combat', encounterId: 'enc-ch08-coronation-engine' }], outcome: 'The vanguard takes the platform lever by lever, breaks Voss\'s command line, and stops the portcullis above the crowd.' },
      { id: 'ch08-choice-break-the-engine-and-evacuate', label: 'Break the engine and evacuate', detail: 'Save trapped delegates by destroying the machinery, but let Voss escape through a guard passage with loyal officers.', effects: [{ type: 'flag', operation: 'add', flagId: 'war-mechanism-dismantled' }, { type: 'flag', operation: 'add', flagId: 'open-war' }, { type: 'flag', operation: 'add', flagId: 'failed-accountability' }, { type: 'flag', operation: 'remove', flagId: 'border-war-stopped' }, { type: 'flag', operation: 'remove', flagId: 'forceful-settlement' }], outcome: 'The press frame collapses, the shutters open, and the governors escape while Voss disappears into the lower guard passage.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-who-keeps-the-crownless-keep', chapterId: 'ch08', region: 'crownless-keep', slot: 32,
    type: 'main', family: 'keep-custodian-settlement', anchorOrder: 6, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-who-keeps-the-crownless-keep', title: 'Who Keeps the Crownless Keep',
    narrative: [
      'With the hall conflict resolved, the seal cases, cells, archives, and roads need a lawful custodian before the armies leave. No group receives the keep merely for arriving at the end.',
      'Only authorities earned through earlier decisions can be proposed. Neutral wardens remain available when no coalition, surviving council, or recognized Free Host standing can support a stronger claim.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-the-letter-in-cipher'], callbackPromises: [], choices: [
      { id: 'ch08-choice-entrust-the-keep-to-the-border-council', label: 'Entrust the border council', detail: 'Place the keep under a shared civil council bound by the coalition and the negotiated border peace.', requirements: [{ type: 'flag', flagId: 'coalition-formed', present: true }, { type: 'flag', flagId: 'border-peace', present: true }], effects: selectCustodian('keep-border-council'), outcome: 'The attending towns sign a rotating custody charter with public inventories and no permanent commander.' },
      { id: 'ch08-choice-return-the-keep-to-greywatch', label: 'Return the keep to Greywatch', detail: 'Give the surviving Greywatch council responsibility for archives, roads, prisoners, and repairs.', requirements: [{ type: 'flag', flagId: 'greywatch-council-survived', present: true }], effects: selectCustodian('keep-greywatch'), outcome: 'Bren Hale accepts temporary custody under civilian audit and posts Nessa Cole\'s first public inventory.' },
      { id: 'ch08-choice-recognize-the-free-host-custody', label: 'Recognize Free Host custody', detail: 'Entrust the keep to the force that earned standing through restraint, testimony, and border peace work.', requirements: [{ type: 'flag', flagId: 'free-host-recognized-at-keep', present: true }], effects: selectCustodian('keep-free-host'), outcome: 'Free Host witnesses accept the keys beside human clerks and publish equal rules for both sides of Redwater.' },
      { id: 'ch08-choice-appoint-neutral-road-wardens', label: 'Appoint neutral road wardens', detail: 'Use a limited caretaker charter when no earned political claimant can hold the keep without reopening the dispute.', effects: selectCustodian('keep-neutral-wardens'), outcome: 'Named road wardens seal the armory, reopen the guest rooms, and schedule a public custody review.' },
    ],
  }),
  defineScene({
    id: 'ch08-main-the-letter-in-cipher', chapterId: 'ch08', region: 'crownless-keep', slot: 38,
    type: 'main', family: 'restrained-cipher-hook', anchorOrder: 7, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch08-main-the-letter-in-cipher', title: 'The Letter in Cipher',
    narrative: [
      'Only after the hall is secure and a custodian holds the keys does Talla find a narrow cipher letter behind Voss\'s private campaign ledger. It contains payments, route acknowledgments, and no signature that can identify the sender.',
      'Lyra decodes one complete sentence: the border war was “the first fracture.” Nothing in the page explains what follows. The victory stands, the wounded are counted, and the letter becomes evidence for another day.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-seal-the-cipher-with-the-public-record', label: 'Seal it with the public record', detail: 'Preserve the letter under the new custodian\'s witnessed archive rules without making unsupported accusations.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'first-fracture-cipher-letter' }, { type: 'flag', operation: 'add', flagId: 'cipher-letter-publicly-sealed' }], outcome: 'Three witnesses sign the envelope before it enters the same archive as the resolved case against Voss.' },
      { id: 'ch08-choice-copy-the-cipher-for-the-road', label: 'Copy it for trusted road agents', detail: 'Prepare for future investigation while accepting the risk that an unexplained phrase will spread as rumor.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'first-fracture-cipher-letter' }, { type: 'flag', operation: 'add', flagId: 'cipher-letter-copies-dispatched' }, { type: 'tension', amount: 1 }], outcome: 'Talla makes two exact copies, marks every uncertain character, and gives them to agents with separate routes.' },
    ],
  }),
]);
