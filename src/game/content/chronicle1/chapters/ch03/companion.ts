import { defineScene } from '../../builders';

export const CH03_COMPANION = Object.freeze([
  defineScene({
    id: 'ch03-companion-talla-hides-the-refuge', chapterId: 'ch03', region: 'drowned-road', slot: 10,
    type: 'companion', family: 'goblin-refuge', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 75, pacing: 'quiet', illustrationId: 'scene-ch03-companion-talla-hides-the-refuge',
    title: 'Talla Hides the Refuge',
    narrative: [
      'Goblin scout Talla Quickhand finds six families sheltering inside an abandoned eel smokehouse and brings you to them. They fled a smuggler crew that sells guides to whichever patrol pays first.',
      'A Greywatch requisition party is searching the same bank for dry buildings. Hiding the families will cost a safe storehouse and several sacks of road grain.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-move-families-to-reed-cellar', label: 'Move the families to the reed cellar', detail: 'Give up a dry supply cache so the refugees remain outside both armies\' searches.', effects: [{ type: 'flag', operation: 'add', flagId: 'goblin-refuge-hidden' }, { type: 'flag', operation: 'add', flagId: 'secret-bargain-honored' }, { type: 'companion-loyalty', companionId: 'talla', amount: 10 }, { type: 'companion-quest', companionId: 'talla', stage: 3 }], outcome: 'Talla erases the small footprints with a reed broom and leaves your grain where frightened families can reach it.' },
      { id: 'ch03-choice-trade-location-for-boats', label: 'Trade the location for boats', detail: 'Secure fast transport from Greywatch while exposing the refuge to forced removal.', effects: [{ type: 'flag', operation: 'add', flagId: 'talla-betrayed' }, { type: 'flag', operation: 'add', flagId: 'goblin-refuge-revealed' }, { type: 'faction', factionId: 'greywatch', amount: 3 }], outcome: 'The requisition officer grants two skiffs. Talla watches the families marched toward a guarded camp and says nothing.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-courier-testimony', chapterId: 'ch03', region: 'drowned-road', slot: 13,
    type: 'companion', family: 'courier-testimony', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 100, pacing: 'quiet', illustrationId: 'scene-ch03-companion-courier-testimony',
    title: 'The Courier\'s Testimony',
    narrative: [
      'Kesh Var gives his statement beneath the watch-post awning while rain drums on the boards. He identifies a human stores cipher inside an order delivered through a Free Host relay.',
      'Rukhar asks that Kesh speak as a free witness, not a prisoner bargaining for water. If Kesh arrived in custody, this is the last chance to release him before the testimony is sealed.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch03-companion-rukhar-keeps-watch'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-take-testimony-under-neutral-oath', label: 'Take testimony under a neutral oath', detail: 'Release Kesh before he speaks and let both armies challenge his account later.', effects: [{ type: 'flag', operation: 'add', flagId: 'orc-courier-spared' }, { type: 'flag', operation: 'add', flagId: 'kesh-testimony-sworn' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 10 }, { type: 'companion-quest', companionId: 'rukhar', stage: 1 }], outcome: 'Kesh signs beside a ferryman and a Greywatch clerk, creating testimony neither camp can dismiss as a private bargain.' },
      { id: 'ch03-choice-keep-kesh-under-guard', label: 'Keep Kesh under armed guard', detail: 'Preserve control of the witness, but give Free Host officers reason to dispute every word.', effects: [{ type: 'flag', operation: 'add', flagId: 'kesh-testimony-held' }, { type: 'companion-quest', companionId: 'rukhar', stage: 1 }, { type: 'companion-loyalty', companionId: 'rukhar', amount: -4 }, { type: 'tension', amount: 1 }], outcome: 'Kesh gives names and times, but Rukhar refuses to place his seal beneath a statement taken from a bound courier.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-rukhar-keeps-watch', chapterId: 'ch03', region: 'drowned-road', slot: 19,
    type: 'companion', family: 'shared-watch', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 100, pacing: 'quiet', illustrationId: 'scene-ch03-companion-rukhar-keeps-watch',
    title: 'Rukhar Keeps Watch',
    narrative: [
      'Rukhar takes the midnight watch beside you while human and orc campfires burn on opposite banks. He names three villages that will be trapped if either army opens the upper sluices.',
      'Signal lamps appear beyond the flooded fields. They may mark saboteurs, or families still trying to reach high ground before the patrols close the crossings.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-escort-families-before-dawn', label: 'Escort the families before dawn', detail: 'Spend the safest hours on civilians and let the signal team move without pursuit.', effects: [{ type: 'flag', operation: 'add', flagId: 'drowned-road-families-escorted' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 10 }, { type: 'companion-quest', companionId: 'rukhar', stage: 2 }, { type: 'tension', amount: -1 }], outcome: 'You and Rukhar lead two wagonloads across a submerged causeway before either sentry line can stop them.' },
      { id: 'ch03-choice-track-the-signal-team', label: 'Track the signal team', detail: 'Pursue a possible saboteur while leaving the families to find their own route uphill.', effects: [{ type: 'flag', operation: 'add', flagId: 'black-banner-lamp-code-seen' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 4 }, { type: 'companion-quest', companionId: 'rukhar', stage: 2 }, { type: 'threat', amount: 1 }], outcome: 'The lamps lead to an empty blind stocked with two uniforms and a timetable for both patrol lines.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-lyra-weighs-the-evidence', chapterId: 'ch03', region: 'drowned-road', slot: 20,
    type: 'companion', family: 'seal-analysis', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 70, pacing: 'quiet', illustrationId: 'scene-ch03-companion-lyra-weighs-the-evidence',
    title: 'Lyra Weighs the Evidence',
    narrative: [
      'Lyra compares the depot wax with the seal on Kesh\'s patrol order. The impressions were made by different stamps, but both seals carry the same chipped edge from a shared cutting jig.',
      'She can remove the wax intact for expert review, or melt a sliver to reveal the cheap black filler used by the forgers. Either method consumes part of the evidence.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-preserve-seals-for-redwater', label: 'Preserve the seals for Redwater', detail: 'Keep the physical impressions intact while accepting a less dramatic explanation at the parley.', effects: [{ type: 'flag', operation: 'add', flagId: 'royal-seals-collected' }, { type: 'flag', operation: 'add', flagId: 'evidence-shared-with-lyra' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 8 }, { type: 'companion-quest', companionId: 'lyra', stage: 2 }], outcome: 'Lyra wraps each seal separately and writes a plain comparison that any quartermaster can repeat.' },
      { id: 'ch03-choice-test-the-black-filler', label: 'Test the black filler', detail: 'Gain a clear material match now, but leave smaller seal fragments for later examination.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'matching-seal-filler' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 4 }, { type: 'companion-quest', companionId: 'lyra', stage: 2 }], outcome: 'The two samples melt to the same greasy residue, linking the orders without relying on handwriting alone.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-mara-and-rukhar-draw-the-line', chapterId: 'ch03', region: 'drowned-road', slot: 24,
    type: 'companion', family: 'scout-boundary', relationship: { kind: 'companion', companionId: 'mara' },
    weight: 75, pacing: 'quiet', illustrationId: 'scene-ch03-companion-mara-and-rukhar-draw-the-line',
    title: 'Mara and Rukhar Draw the Line',
    narrative: [
      'Mara arrives with Greywatch scouts and wants them on the west levee before the Free Host occupies it. Rukhar says the levee shelters evacuated orc farmers and that armed entry will look like a raid.',
      'Both agree the signal tower must be watched. They disagree over whose uniforms can approach without turning frightened civilians into shields.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: ['ch04-companion-mara-rukhar-common-ground'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-form-an-unmarked-scout-pair', label: 'Form an unmarked scout pair', detail: 'Send one scout from each side without colors, risking accusations from both commands.', effects: [{ type: 'flag', operation: 'add', flagId: 'mara-rukhar-joint-scouts' }, { type: 'companion-loyalty', companionId: 'mara', amount: 6 }, { type: 'faction', factionId: 'free-host', amount: 2 }], outcome: 'Mara and Rukhar choose scouts who have both lost homes to raids and give them one shared map.' },
      { id: 'ch03-choice-give-mara-the-east-tower', label: 'Give Mara the east tower', detail: 'Keep Greywatch scouts on familiar ground while leaving the west-bank signals unobserved.', effects: [{ type: 'flag', operation: 'add', flagId: 'mara-holds-east-tower' }, { type: 'companion-loyalty', companionId: 'mara', amount: 4 }, { type: 'companion-loyalty', companionId: 'rukhar', amount: -3 }], outcome: 'Mara secures the tower before dusk. Rukhar posts no answer, and the west-bank lamps continue unseen.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-the-enemys-dead', chapterId: 'ch03', region: 'drowned-road', slot: 27,
    type: 'companion', family: 'shared-burial', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 65, pacing: 'recovery', illustrationId: 'scene-ch03-companion-the-enemys-dead',
    title: 'The Enemy\'s Dead',
    narrative: [
      'Floodwater has carried two Greywatch soldiers and an orc levy fighter against the same willow roots. Each patrol claims only its own dead and warns you away from the bank.',
      'Rukhar says leaving one body unburied will become a recruiting story by morning. Recovering all three may also expose whoever searched their packs after death.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-recover-all-three-bodies', label: 'Recover all three bodies', detail: 'Cross an exposed bank and risk both pickets so every family receives its dead.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-dead-returned' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 6 }, { type: 'tension', amount: -1 }], outcome: 'The bodies return under one white sheet. A missing pay token suggests someone inspected each corpse first.' },
      { id: 'ch03-choice-mark-the-bank-for-later', label: 'Mark the bank for later recovery', detail: 'Avoid drawing fire now, but let rumor decide why one side was left beside the water.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-dead-delayed' }, { type: 'threat', amount: -1 }, { type: 'tension', amount: 1 }], outcome: 'Rukhar stacks stones above the waterline, yet distant scouts are already counting which uniforms remain below.' },
    ],
  }),
  defineScene({
    id: 'ch03-companion-stonehands-promise', chapterId: 'ch03', region: 'drowned-road', slot: 36,
    type: 'companion', family: 'peace-commitment', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 85, pacing: 'quiet', illustrationId: 'scene-ch03-companion-stonehands-promise',
    title: 'Stonehand\'s Promise',
    narrative: [
      'After the two-banner attack, Rukhar admits that several Free Host captains want permission to answer blood with blood. He can delay them until Redwater, but only on his personal word.',
      'If your evidence fails, he will lose command. If you hide the political risk from Greywatch, human officers will call the delay proof of an orc trick.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-companion-stop-the-retaliation'], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-record-rukhars-stand-openly', label: 'Record Rukhar\'s stand openly', detail: 'Give both commands a signed promise that can protect the truce or end his career.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-truce-pledge-recorded' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 5 }, { type: 'callback', promise: { targetEventId: 'ch04-companion-stop-the-retaliation', deadline: { chapterId: 'ch04', slot: 20 } } }], outcome: 'Rukhar signs beneath a Greywatch witness and sends a copy to every Free Host captain at Redwater.' },
      { id: 'ch03-choice-keep-the-promise-verbal', label: 'Keep the promise verbal', detail: 'Protect Rukhar from a written charge while leaving the truce dependent on personal trust.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-truce-pledge-private' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 2 }, { type: 'callback', promise: { targetEventId: 'ch04-companion-stop-the-retaliation', deadline: { chapterId: 'ch04', slot: 20 } } }], outcome: 'Rukhar sends runners with his seal but no explanation. The captains obey until sunrise and demand proof afterward.' },
    ],
  }),
  defineScene({
    id: 'ch03-faction-voices-of-the-river', chapterId: 'ch03', region: 'drowned-road', slot: 38,
    type: 'companion', family: 'river-delegation', relationship: { kind: 'faction', factionId: 'border-council' },
    weight: 70, pacing: 'quiet', illustrationId: 'scene-ch03-faction-voices-of-the-river',
    title: 'Voices of the River',
    narrative: [
      'Reeve Nessa Holt\'s river delegation meets you two miles from Redwater: a human miller, an orc ferryman, and a goblin cooper whose workshops lie between the armies.',
      'They ask to travel under your evidence seal. Both commanders will listen less freely with civilians present, but neither can pretend the flooded farms are empty ground.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch03-choice-escort-the-river-delegation', label: 'Escort the river delegation', detail: 'Bring civilian witnesses into the military dispute and accept a slower, more visible approach.', effects: [{ type: 'flag', operation: 'add', flagId: 'river-delegates-at-redwater' }, { type: 'faction', factionId: 'border-council', amount: 5 }, { type: 'threat', amount: 1 }], outcome: 'The delegation walks beside the evidence case, turning every checkpoint conversation toward homes and harvests.' },
      { id: 'ch03-choice-carry-their-petition-ahead', label: 'Carry their petition ahead', detail: 'Reach Redwater sooner while asking the civilians to trust soldiers with their words.', effects: [{ type: 'flag', operation: 'add', flagId: 'river-petition-carried' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Nessa\'s delegates return to the evacuation road while you carry a petition signed in three languages.' },
    ],
  }),
]);
