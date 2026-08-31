import { defineScene } from '../../builders';

export const CH08_COMPANION = Object.freeze([
  defineScene({
    id: 'ch08-companion-talla-opens-the-guest-passage', chapterId: 'ch08', region: 'crownless-keep', slot: 4,
    type: 'companion', family: 'talla-guest-passage', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 82, pacing: 'quiet', illustrationId: 'scene-ch08-companion-talla-opens-the-guest-passage',
    title: 'Talla Opens the Guest Passage',
    narrative: [
      'Talla finds a servants\' passage connecting the guarded guest rooms to an old records arcade. It can move compelled families out unseen or bring two witnesses directly into the public gallery.',
      'Evacuation protects more people. The shorter witness route strengthens the hearing, but leaves the remaining families behind armed doors.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-use-tallas-passage-for-families', label: 'Use the passage for families', detail: 'Evacuate every reachable civilian while the hearing begins with fewer firsthand witnesses.', effects: [{ type: 'flag', operation: 'add', flagId: 'guest-families-evacuated' }, { type: 'companion-loyalty', companionId: 'talla', amount: 6 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Talla guides families through the arcade in small groups and closes each door behind them.' },
      { id: 'ch08-choice-use-tallas-passage-for-witnesses', label: 'Use the passage for witnesses', detail: 'Bring two compelled governors into the gallery quickly while other families wait for the main rescue.', effects: [{ type: 'flag', operation: 'add', flagId: 'guest-witnesses-smuggled' }, { type: 'evidence', operation: 'add', evidenceId: 'guest-passage-testimony' }, { type: 'companion-loyalty', companionId: 'talla', amount: 3 }], outcome: 'Two governors enter the gallery before Voss\'s ushers realize their guest rooms are empty.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-lyra-and-the-numbered-seal-cases', chapterId: 'ch08', region: 'crownless-keep', slot: 8,
    type: 'companion', family: 'lyra-seal-custody', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 86, pacing: 'quiet', illustrationId: 'scene-ch08-companion-lyra-and-the-numbered-seal-cases',
    title: 'Lyra and the Numbered Seal Cases',
    narrative: [
      'Lyra identifies three lawful seal cases whose numbers were entered twice under different owners. The duplicate lines prove interference, but opening the cases without witnesses would damage the same custody argument.',
      'She can wait for neutral clerks or make charcoal impressions through the case cloth. One preserves procedure; the other preserves speed and partial proof.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-wait-for-neutral-seal-clerks', label: 'Wait for neutral seal clerks', detail: 'Open every case under lawful observation while giving Voss\'s staff time to move other records.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'witnessed-duplicate-seal-cases' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 6 }, { type: 'tension', amount: 1 }], outcome: 'Two retired clerks witness the openings and sign beside the duplicated numbers in the register.' },
      { id: 'ch08-choice-take-cloth-seal-impressions', label: 'Take cloth seal impressions', detail: 'Record the copied edges immediately while accepting that the unopened cases prove less on their own.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'cloth-seal-impressions' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 3 }, { type: 'threat', amount: -1 }], outcome: 'Lyra rubs charcoal across the case cloth and captures the same broken edge on all three seals.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-caldus-tends-the-compelled-delegates', chapterId: 'ch08', region: 'crownless-keep', slot: 14,
    type: 'companion', family: 'caldus-delegate-medicine', relationship: { kind: 'companion', companionId: 'caldus' },
    weight: 78, pacing: 'recovery', illustrationId: 'scene-ch08-companion-caldus-tends-the-compelled-delegates',
    title: 'Caldus Tends the Compelled Delegates',
    narrative: [
      'Caldus finds two delegates weakened by confinement and a guard injured while trying to pass them water. Treating all three supports the claim that the new order must protect people, not only punish Voss.',
      'His last smoke balm is also needed near the command platform. Spending it here improves testimony and recovery but leaves the final hall assault harder.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-spend-the-smoke-balm-on-delegates', label: 'Spend the smoke balm here', detail: 'Restore the delegates and injured guard before testimony while carrying no balm into the engine hall.', effects: [{ type: 'flag', operation: 'add', flagId: 'civilian-medicine-delivered' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 6 }, { type: 'vitals', health: 6 }], outcome: 'The delegates walk into the hearing under their own strength and the guard gives a signed account.' },
      { id: 'ch08-choice-save-the-balm-for-the-platform', label: 'Save the balm for the platform', detail: 'Prepare for smoke around the machinery while the delegates testify tired and from their beds.', effects: [{ type: 'flag', operation: 'add', flagId: 'coronation-smoke-balm-saved' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 2 }, { type: 'vitals', resource: 4 }], outcome: 'Caldus treats the worst wounds with water and linen, then seals the balm for the hall.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-lyra-builds-the-plain-case', chapterId: 'ch08', region: 'crownless-keep', slot: 20,
    type: 'companion', family: 'lyra-public-rebuttal', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 90, pacing: 'quiet', illustrationId: 'scene-ch08-companion-lyra-builds-the-plain-case',
    title: 'Lyra Builds the Plain Case',
    narrative: [
      'After hearing Voss, Lyra reduces months of records to a sequence the whole hall can follow: create shortage, fund violence, block relief, offer protection, demand seals. Every step has a named source.',
      'She can read the sequence herself as an expert or let the player speak while she answers technical objections. The first is precise; the second makes the accusation belong to an ordinary guard.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-let-lyra-read-the-sequence', label: 'Let Lyra read the sequence', detail: 'Deliver the strongest technical account while allowing Voss to dismiss it as an archivist\'s dispute.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'lyra-five-step-case' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 5 }], outcome: 'Lyra reads five dated steps and answers each challenge with a seal, witness, or custody line.' },
      { id: 'ch08-choice-speak-with-lyra-beside-you', label: 'Speak with Lyra beside you', detail: 'Put the case in direct language while relying on Lyra to correct every disputed record.', effects: [{ type: 'flag', operation: 'add', flagId: 'ordinary-guard-delivered-case' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 6 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The hall hears how each order changed a road, a village, or a family before Lyra names its record.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-talla-finds-the-engine-brakes', chapterId: 'ch08', region: 'crownless-keep', slot: 23,
    type: 'companion', family: 'talla-engine-brakes', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 88, pacing: 'danger', illustrationId: 'scene-ch08-companion-talla-finds-the-engine-brakes',
    title: 'Talla Finds the Engine Brakes',
    narrative: [
      'Talla reads the maintenance marks beneath the Coronation Engine and identifies separate brakes for the portcullis and seal press. One person can jam either brake before the platform guard reacts.',
      'Stopping the gate protects the crowd. Stopping the press prevents a final forged decree, but the portcullis may trap delegates during the fight.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-jam-the-portcullis-brake', label: 'Jam the portcullis brake', detail: 'Keep the public exits open while allowing the seal press one more prepared impression.', effects: [{ type: 'flag', operation: 'add', flagId: 'engine-portcullis-braked' }, { type: 'companion-loyalty', companionId: 'talla', amount: 5 }], outcome: 'Talla drives an inspection pin through the gate brake before the counterweight engages.' },
      { id: 'ch08-choice-jam-the-seal-press-brake', label: 'Jam the seal press brake', detail: 'Prevent the false decree while leaving the crowd dependent on the main portcullis chain.', effects: [{ type: 'flag', operation: 'add', flagId: 'engine-seal-press-braked' }, { type: 'companion-loyalty', companionId: 'talla', amount: 5 }], outcome: 'The press wheel locks halfway down and tears Voss\'s prepared decree across its center.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-lyra-closes-the-emergency-compact', chapterId: 'ch08', region: 'crownless-keep', slot: 29,
    type: 'companion', family: 'lyra-compact-closure', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 85, pacing: 'quiet', illustrationId: 'scene-ch08-companion-lyra-closes-the-emergency-compact',
    title: 'Lyra Closes the Emergency Compact',
    narrative: [
      'After the platform falls, Lyra finds the lawful procedure for ending an interrupted Compact session. Every attending seal must be returned or marked missing before any custodian can inherit the keep records.',
      'Completing the count delays pursuit of loyalists. Closing the hall immediately protects the settlement from later claims that Voss\'s false vote remained pending.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-complete-the-lawful-seal-count', label: 'Complete the lawful seal count', detail: 'Close every disputed vote under public record while loyalist officers gain time to leave the upper ward.', effects: [{ type: 'flag', operation: 'add', flagId: 'emergency-compact-lawfully-closed' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 6 }, { type: 'tension', amount: -1 }], outcome: 'Governors, clerks, and witnesses mark every seal returned, damaged, or missing before the session closes.' },
      { id: 'ch08-choice-seal-the-hall-for-later-audit', label: 'Seal the hall for later audit', detail: 'Join the pursuit quickly while leaving the full seal count to whichever custodian is chosen.', effects: [{ type: 'flag', operation: 'add', flagId: 'compact-hall-sealed-for-audit' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 3 }, { type: 'threat', amount: -1 }], outcome: 'Lyra seals both doors with witness strips and carries the master register into the courtyard.' },
    ],
  }),
  defineScene({
    id: 'ch08-companion-talla-and-the-private-ledger-lock', chapterId: 'ch08', region: 'crownless-keep', slot: 34,
    type: 'companion', family: 'talla-private-ledger-lock', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 84, pacing: 'quiet', illustrationId: 'scene-ch08-companion-talla-and-the-private-ledger-lock',
    title: 'Talla and the Private Ledger Lock',
    narrative: [
      'During the custodian inventory, Talla notices that Voss\'s private ledger cabinet has a newer lock than the surrounding furniture. Tool marks show someone opened it during the hall fight and returned a thin packet upside down.',
      'She can preserve the cabinet for a witnessed search or lift the packet before a fleeing clerk reaches the passage. Either method records custody before the final discovery.',
    ],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-witness-tallas-cabinet-search', label: 'Witness Talla\'s cabinet search', detail: 'Protect the final evidence chain while giving any hidden clerk more time to escape the record wing.', effects: [{ type: 'flag', operation: 'add', flagId: 'private-ledger-search-witnessed' }, { type: 'companion-loyalty', companionId: 'talla', amount: 6 }], outcome: 'The new custodian names two clerks to watch while Talla opens the cabinet without disturbing its contents.' },
      { id: 'ch08-choice-take-the-upturned-packet-first', label: 'Take the upturned packet first', detail: 'Secure the suspicious document immediately while accepting a shorter and more contested custody record.', effects: [{ type: 'flag', operation: 'add', flagId: 'private-ledger-packet-secured' }, { type: 'companion-loyalty', companionId: 'talla', amount: 3 }, { type: 'threat', amount: -1 }], outcome: 'Talla catches the packet with two fingers and marks its position before footsteps fade below.' },
    ],
  }),
]);
