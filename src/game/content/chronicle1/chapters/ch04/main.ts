import { defineScene } from '../../builders';

export const CH04_MAIN = Object.freeze([
  defineScene({
    id: 'ch04-main-two-armies-one-field', chapterId: 'ch04', region: 'drowned-road', slot: 1,
    type: 'main', family: 'redwater-standoff', anchorOrder: 1, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch04-main-two-armies-one-field', title: 'Two Armies, One Field',
    narrative: [
      'Captain Elian Roake forms Greywatch spears on the east meadow while Shield-Captain Brakka Tor anchors the Free Host behind the west millrace. Each has orders claiming the other crossed the river first.',
      'Reeve Nessa Holt keeps Redwater\'s families behind the palisade, but the town granary and clinic stand outside it. One exchange of arrows would trap civilians between both lines.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-parley-between-lines'], callbackPromises: [], choices: [
      { id: 'ch04-choice-place-evidence-under-town-guard', label: 'Place the evidence under town guard', detail: 'Give Reeve Holt custody before either army sees the proof, strengthening neutrality but slowing review.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-evidence-in-town-custody' }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'tension', amount: -1 }], outcome: 'Three guild wardens carry the case into the grain hall while both commanders send witnesses after it.' },
      { id: 'ch04-choice-open-the-case-between-lines', label: 'Open the case between the lines', detail: 'Show both armies the paired evidence at once while standing inside easy bow range.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-evidence-shown-publicly' }, { type: 'threat', amount: 2 }], outcome: 'The reversible cloth and matching cache knots lie on a field table where neither command can hide its reaction.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-parley-between-lines', chapterId: 'ch04', region: 'drowned-road', slot: 7,
    type: 'main', family: 'field-parley', anchorOrder: 2, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch04-main-parley-between-lines', title: 'Parley Between Lines',
    narrative: [
      'Roake and Brakka meet beneath a canvas awning with equal guards and no drawn steel. The human orders cite burned farms; the orc orders cite murdered scouts, yet both use the same unusual spacing and depot abbreviations.',
      'Roake wants Kesh held for questioning. Brakka wants the Greywatch dispatch clerk surrendered. Holt refuses either demand until the town hears evidence instead of accusations.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-the-murdered-scout'], callbackPromises: [], choices: [
      { id: 'ch04-choice-submit-witnesses-to-town-custody', label: 'Submit witnesses to town custody', detail: 'Keep Kesh and the clerk beyond both armies\' reach while accepting Redwater\'s slower hearing.', effects: [{ type: 'flag', operation: 'add', flagId: 'parley-witnesses-neutral' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: -1 }], outcome: 'Holt places each witness in a different guild house and gives both commanders the same visiting hours.' },
      { id: 'ch04-choice-permit-matched-questioning', label: 'Permit matched questioning', detail: 'Let each command question its opposing witness under guard, risking intimidation and retaliation.', effects: [{ type: 'flag', operation: 'add', flagId: 'parley-matched-questioning' }, { type: 'threat', amount: 1 }], outcome: 'The questioning produces matching descriptions of a masked quartermaster before tempers end both sessions.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-the-murdered-scout', chapterId: 'ch04', region: 'drowned-road', slot: 14,
    type: 'main', family: 'scout-murder', anchorOrder: 3, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch04-main-the-murdered-scout', title: 'The Murdered Scout',
    narrative: [
      'Greywatch scout Aven Pell is found beside the west millrace with an orc knife in his chest and Brakka\'s patrol map under his body. Roake\'s soldiers begin fastening shields before anyone examines the bank.',
      'The knife wound was made after death, and wet red clay on Pell\'s boots comes only from the east quarry. Someone killed him behind Greywatch lines, moved him, and planted the map.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-orders-written-to-be-found'], callbackPromises: [], choices: [
      { id: 'ch04-choice-display-the-quarry-clay', label: 'Display the quarry clay', detail: 'Challenge the murder story before both ranks and risk humiliating Roake in front of his soldiers.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'pell-quarry-clay' }, { type: 'flag', operation: 'add', flagId: 'scout-murder-staged' }, { type: 'faction', factionId: 'greywatch', amount: -2 }], outcome: 'A Greywatch mason confirms the clay source, and the first rank lowers its spears while Roake orders silence.' },
      { id: 'ch04-choice-show-roake-the-body-privately', label: 'Show Roake the body privately', detail: 'Give the captain room to reverse course while leaving Free Host troops unaware of the new proof.', effects: [{ type: 'flag', operation: 'add', flagId: 'roake-warned-in-private' }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'tension', amount: 1 }], outcome: 'Roake quietly delays formation and sends his own surgeon to confirm the postmortem wound.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-orders-written-to-be-found', chapterId: 'ch04', region: 'drowned-road', slot: 20,
    type: 'main', family: 'false-order-proof', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch04-main-orders-written-to-be-found', title: 'Orders Written to Be Found',
    narrative: [
      'The search of two abandoned command tents produces a human attack order and an orc retaliation order placed in unlocked chests. Both contain the same copied mile-marker error and the same black wax filler Lyra identified on the Drowned Road.',
      'Kesh recognizes the relay phrase; Jory Fen\'s Route Seven statement explains the depot code; the paired caches supply matching tools and cloth. Together, the pieces prove one network prepared evidence for each army to find after blood was shed.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-before-the-first-charge'], callbackPromises: [], choices: [
      { id: 'ch04-choice-present-the-full-custody-chain', label: 'Present the full custody chain', detail: 'Reveal every witness and sample in public, exposing vulnerable sources but making suppression difficult.', effects: [{ type: 'flag', operation: 'add', flagId: 'false-flag-network-proven' }, { type: 'evidence', operation: 'add', evidenceId: 'matched-redwater-orders' }, { type: 'tension', amount: -2 }], outcome: 'Holt reads each custody name aloud while Roake and Brakka compare the same deliberate errors on both orders.' },
      { id: 'ch04-choice-give-commanders-matched-copies', label: 'Give commanders matched copies', detail: 'Protect witnesses by limiting names, but leave each officer room to question the hidden sources.', effects: [{ type: 'flag', operation: 'add', flagId: 'false-flag-method-proven' }, { type: 'evidence', operation: 'add', evidenceId: 'matched-redwater-orders' }, { type: 'faction', factionId: 'greywatch', amount: 1 }, { type: 'faction', factionId: 'free-host', amount: 1 }], outcome: 'The commanders receive identical packets and discover that neither can defend its orders without defending the other side\'s forgery.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-before-the-first-charge', chapterId: 'ch04', region: 'drowned-road', slot: 27,
    type: 'main', family: 'last-provocation', anchorOrder: 5, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch04-main-before-the-first-charge', title: 'Before the First Charge',
    narrative: [
      'A horn sounds from the empty south tower using Greywatch\'s charge pattern. Seconds later, fire arrows rise from behind the Free Host line toward Redwater\'s grain sheds.',
      'Both provocations begin outside either formation. The proof has changed the commanders\' doubts, but frightened soldiers may still obey the sound and flame they were trained to answer.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-terms-at-redwater'], callbackPromises: [], choices: [
      { id: 'ch04-choice-silence-the-south-tower', label: 'Silence the south tower', detail: 'Stop the false charge signal while trusting Redwater crews to contain the grain-shed fire.', effects: [{ type: 'flag', operation: 'add', flagId: 'false-charge-horn-stopped' }, { type: 'combat', encounterId: 'enc-ch04-south-tower-provocateurs' }, { type: 'threat', amount: 1 }], outcome: 'The horn cuts off mid-call, giving Roake time to repeat the stand-fast order down his line.' },
      { id: 'ch04-choice-save-the-grain-sheds', label: 'Save the grain sheds', detail: 'Protect Redwater\'s winter food while leaving the false horn to test Greywatch discipline.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-grain-sheds-saved' }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'combat', encounterId: 'enc-ch04-south-tower-provocateurs' }], outcome: 'Bucket crews smother the roofs as the first Greywatch files step forward, then stop at Roake\'s shouted order.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-terms-at-redwater', chapterId: 'ch04', region: 'drowned-road', slot: 39,
    type: 'main', family: 'redwater-settlement', anchorOrder: 6, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch04-main-terms-at-redwater', title: 'Terms at Redwater',
    narrative: [
      'With the provocateurs defeated and the matched orders exposed, Holt demands terms before either army leaves the field. Roake wants supervised withdrawal; Brakka wants joint pursuit of the network through the north warehouse.',
      'The town can host a mixed inquiry with civilian custody of evidence, or accept separate withdrawals and exchange witnesses at the river. The first is stronger but politically costly; the second is faster and fragile.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-main-what-the-river-carried-away'], callbackPromises: [], choices: [
      { id: 'ch04-choice-establish-the-redwater-inquiry', label: 'Establish the Redwater inquiry', detail: 'Bind both commands to civilian evidence custody and a mixed patrol despite resistance at home.', effects: [{ type: 'flag', operation: 'add', flagId: 'border-peace' }, { type: 'flag', operation: 'add', flagId: 'redwater-mixed-inquiry' }, { type: 'faction', factionId: 'border-council', amount: 5 }, { type: 'tension', amount: -2 }], outcome: 'Roake and Brakka sign beneath Holt\'s seal, placing paired patrols and all captured orders under town oversight.' },
      { id: 'ch04-choice-order-separate-withdrawals', label: 'Order separate withdrawals', detail: 'Move both armies away from civilians quickly while leaving future evidence exchange to messengers.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-armed-truce' }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'faction', factionId: 'free-host', amount: 2 }, { type: 'tension', amount: -1 }], outcome: 'Both lines withdraw beyond bow range before sunset, and the river becomes the boundary of an uneasy truce.' },
    ],
  }),
  defineScene({
    id: 'ch04-main-what-the-river-carried-away', chapterId: 'ch04', region: 'drowned-road', slot: 43,
    type: 'main', family: 'embervault-lead', anchorOrder: 7, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch04-main-what-the-river-carried-away', title: 'What the River Carried Away',
    narrative: [
      'When the water drops, searchers recover a locked freight tube beneath the north warehouse pier. Inside are shipment tallies for black wax, reversible cloth, and unmarked weapons sent under the code EMBER SEVEN.',
      'A warehouse clerk identifies the origin as Embervault, an ironworking town upriver, and marks the quarry road used by the last convoy. The conspiracy has lost Redwater, but its supply source is still operating.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch05-main-the-mouth-of-embervault'], callbackPromises: [], choices: [
      { id: 'ch04-choice-take-the-quarry-road-at-dawn', label: 'Take the quarry road at dawn', detail: 'Pursue the latest Embervault convoy quickly while carrying only a small escort and copied evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-quarry-road' }, { type: 'evidence', operation: 'add', evidenceId: 'ember-seven-freight-tube' }, { type: 'threat', amount: 1 }], outcome: 'Holt keeps the original tube while your party leaves for Embervault with the convoy time and quarry route.' },
      { id: 'ch04-choice-send-warning-then-follow', label: 'Send warning, then follow', detail: 'Give Embervault authorities notice and risk the network learning that its freight code was recovered.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-warning-sent' }, { type: 'evidence', operation: 'add', evidenceId: 'ember-seven-freight-tube' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'A river rider carries the warning toward Embervault, and your party follows with a full copy of the tallies.' },
    ],
  }),
]);
