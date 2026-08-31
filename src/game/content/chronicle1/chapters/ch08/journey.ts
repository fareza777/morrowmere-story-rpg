import { defineScene } from '../../builders';

export const CH08_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch08-journey-through-the-lower-ward', chapterId: 'ch08', region: 'crownless-keep', slot: 2,
    type: 'journey', family: 'lower-ward-route', journeySubtype: 'travel', weight: 28, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-through-the-lower-ward', title: 'Through the Lower Ward',
    narrative: ['The lower ward is crowded with servants, stable hands, and guards who do not know whether the gate has fallen. Two routes lead toward the guest rooms: a visible customs arcade and a narrow laundry stair.', 'The arcade keeps the party near civilians who need direction. The stair avoids a confrontation but leaves frightened workers without a safe route outside.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-cross-the-customs-arcade', label: 'Cross the customs arcade', detail: 'Mark a civilian exit in public while keep guards can report your movement toward the guests.', effects: [{ type: 'flag', operation: 'add', flagId: 'lower-ward-exit-marked' }, { type: 'threat', amount: 1 }], outcome: 'Stable hands repeat the exit instructions as the party moves openly across the arcade.' },
      { id: 'ch08-choice-take-the-laundry-stair', label: 'Take the laundry stair', detail: 'Reach the guest level unseen while leaving the lower-ward workers to find their own way.', effects: [{ type: 'flag', operation: 'add', flagId: 'guest-level-reached-unseen' }, { type: 'threat', amount: -1 }], outcome: 'The party climbs between linen presses and reaches an unguarded landing above the ward.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-the-processional-stair', chapterId: 'ch08', region: 'crownless-keep', slot: 7,
    type: 'journey', family: 'processional-stair-route', journeySubtype: 'travel', weight: 25, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-the-processional-stair', title: 'The Processional Stair',
    narrative: ['The broad stair between guest rooms and seal hall is arranged for Voss\'s procession. Painted shields hide guard alcoves, while rolled carpets cover iron rings once used to control crowds.', 'Removing the shields exposes the alcoves but announces the intrusion. Cutting the crowd rings protects the guests from restraint while leaving the guard positions concealed.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-pull-down-the-painted-shields', label: 'Pull down the painted shields', detail: 'Expose every hidden guard alcove while making enough noise to warn the seal hall.', effects: [{ type: 'flag', operation: 'add', flagId: 'processional-alcoves-exposed' }, { type: 'threat', amount: 1 }], outcome: 'The painted panels fall and reveal two empty alcoves and one startled crossbow guard.' },
      { id: 'ch08-choice-cut-the-crowd-restraint-rings', label: 'Cut the crowd restraint rings', detail: 'Prevent ushers from chaining delegates in place while passing concealed guard alcoves untested.', effects: [{ type: 'flag', operation: 'add', flagId: 'processional-rings-cut' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The iron rings drop beneath the carpet and leave no fixed point for the ushers\' chains.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-the-records-arcade', chapterId: 'ch08', region: 'crownless-keep', slot: 9,
    type: 'journey', family: 'records-arcade-route', journeySubtype: 'travel', weight: 24, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-the-records-arcade', title: 'The Records Arcade',
    narrative: ['An enclosed arcade links the seal hall to the old tax archive. Clerks push carts of uncatalogued boxes toward a guarded lift, claiming Voss ordered them removed for protection.', 'Following the carts may reveal where disputed records are hidden. Stopping them now preserves the visible archive but blocks the route with frightened clerks and guards.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-follow-the-record-carts', label: 'Follow the record carts', detail: 'Learn the destination of removed files while allowing several boxes to leave public custody.', effects: [{ type: 'flag', operation: 'add', flagId: 'removed-record-route-followed' }, { type: 'threat', amount: -1 }], outcome: 'The party shadows the lift crew to a locked receiving room beneath the hall.' },
      { id: 'ch08-choice-stop-the-record-lift', label: 'Stop the record lift', detail: 'Keep the visible archive together while forcing a public dispute with the escorting guards.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'seal-hall-record-carts' }, { type: 'threat', amount: 1 }], outcome: 'Jory wedges the lift gate and begins naming every box before the clerks can move it.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-question-the-deputy-seal-clerk', chapterId: 'ch08', region: 'crownless-keep', slot: 11,
    type: 'journey', family: 'deputy-seal-clerk', journeySubtype: 'investigation', weight: 35, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-question-the-deputy-seal-clerk', title: 'Question the Deputy Seal Clerk',
    narrative: ['A deputy seal clerk admits that Voss\'s staff replaced two witness names after midnight. She kept the scraped parchment and can identify the officer who delivered the changes.', 'Her testimony is immediate but exposes her to retaliation. Taking only the parchment protects her identity while losing the person who can explain how it was altered.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-bring-the-deputy-before-the-hall', label: 'Bring the deputy before the hall', detail: 'Gain a living witness to the altered register while making her safety part of the hearing.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'deputy-clerk-testimony' }, { type: 'flag', operation: 'add', flagId: 'deputy-clerk-protected' }, { type: 'threat', amount: 1 }], outcome: 'The deputy signs her account and joins the witness group under an assigned guard.' },
      { id: 'ch08-choice-take-only-the-scraped-parchment', label: 'Take only the scraped parchment', detail: 'Protect the deputy\'s identity while presenting a physical alteration with less explanatory force.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'scraped-witness-register' }, { type: 'threat', amount: -1 }], outcome: 'She wraps the scraped register in blotting cloth and returns to the anonymous clerk line.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-the-ushers-family-keys', chapterId: 'ch08', region: 'crownless-keep', slot: 13,
    type: 'journey', family: 'usher-family-release', journeySubtype: 'side-quest', weight: 26, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-the-ushers-family-keys', title: 'The Usher\'s Family Keys',
    narrative: ['A young hall usher offers a ring of guest-room keys if the party will free his mother and sister from a staff dormitory used as leverage. The detour runs below the seal hall as the hearing fills.', 'Taking the keys without the rescue opens doors sooner but repeats Voss\'s bargain. Keeping the promise costs time and gains someone who knows which guests were coerced.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-free-the-ushers-family-first', label: 'Free the usher\'s family first', detail: 'Honor the rescue bargain and arrive later with a complete map of coerced guest rooms.', effects: [{ type: 'flag', operation: 'add', flagId: 'ushers-family-freed' }, { type: 'evidence', operation: 'add', evidenceId: 'coerced-guest-room-map' }, { type: 'tension', amount: 1 }], outcome: 'The family leaves by the lower arcade and the usher marks every threatened guest on the key list.' },
      { id: 'ch08-choice-take-the-keys-to-the-hall', label: 'Take the keys to the hall', detail: 'Open guest rooms immediately while leaving the usher\'s family under Voss\'s leverage.', effects: [{ type: 'flag', operation: 'add', flagId: 'guest-master-keys-taken' }, { type: 'threat', amount: -1 }, { type: 'faction', factionId: 'border-council', amount: -1 }], outcome: 'The usher hands over the ring but remains behind, listening for footsteps from the dormitory.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-along-the-witness-gallery', chapterId: 'ch08', region: 'crownless-keep', slot: 16,
    type: 'journey', family: 'witness-gallery-route', journeySubtype: 'travel', weight: 25, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-along-the-witness-gallery', title: 'Along the Witness Gallery',
    narrative: ['The witness gallery circles the main hall behind a carved wooden screen. One section overlooks the governors; another reaches a stair used by Voss\'s messengers and reserve guards.', 'Holding the overlook protects testimony. Taking the messenger stair can cut command traffic, but leaves witnesses with only local wardens.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-hold-the-gallery-overlook', label: 'Hold the gallery overlook', detail: 'Keep witnesses visible and protected while Voss\'s messengers retain their private stair.', effects: [{ type: 'flag', operation: 'add', flagId: 'witness-overlook-held' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Wardens form a quiet line behind the screen and keep every witness in view.' },
      { id: 'ch08-choice-take-the-messenger-stair', label: 'Take the messenger stair', detail: 'Disrupt orders between the hall and guard rooms while thinning protection around the witnesses.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-messenger-stair-taken' }, { type: 'threat', amount: -1 }], outcome: 'The party catches two runners carrying different orders to the same guard company.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-audit-voss-grain-promises', chapterId: 'ch08', region: 'crownless-keep', slot: 19,
    type: 'journey', family: 'grain-contract-audit', journeySubtype: 'investigation', weight: 34, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-audit-voss-grain-promises', title: 'Audit Voss\'s Grain Promises',
    narrative: ['Supply contracts beside Voss\'s lectern promise restored grain to towns that support his Compact. Earlier requisition orders show his own officers diverted those same shipments weeks before.', 'A complete audit proves the manufactured shortage. Reading one clear pair of orders is faster and easier for the hall to understand, but leaves other towns uncertain.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-complete-the-grain-contract-audit', label: 'Complete the grain contract audit', detail: 'Connect every promised shipment to an earlier seizure while the confrontation draws nearer.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'complete-grain-diversion-audit' }, { type: 'tension', amount: 1 }], outcome: 'Jory aligns town contracts with convoy seizures and marks the same quartermaster signature throughout.' },
      { id: 'ch08-choice-read-one-clear-contract-pair', label: 'Read one clear contract pair', detail: 'Give the hall a simple example immediately while preserving less proof for distant towns.', effects: [{ type: 'flag', operation: 'add', flagId: 'grain-bargain-publicly-explained' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'A governor recognizes his missing convoy and the later promise to return the exact cargo.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-beneath-the-command-platform', chapterId: 'ch08', region: 'crownless-keep', slot: 21,
    type: 'journey', family: 'engine-service-galleries', journeySubtype: 'dungeon', weight: 30, pacing: 'danger', threatChange: 2,
    illustrationId: 'scene-ch08-journey-beneath-the-command-platform', title: 'Beneath the Command Platform',
    narrative: ['A maintenance hatch leads into cramped galleries beneath the command platform. Iron rods connect the bell, portcullis, shutters, and seal press to separate levers above.', 'The party can wedge the shutter linkage or open a service grate behind the platform guard. Both routes require crawling past moving counterweights.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-wedge-the-shutter-linkage', label: 'Wedge the shutter linkage', detail: 'Keep light and exits visible during the fight while approaching the platform through the main hall.', effects: [{ type: 'flag', operation: 'add', flagId: 'engine-shutters-wedged' }, { type: 'vitals', health: -2 }], outcome: 'A steel wedge locks the linkage as the counterweight jerks the gallery floor beneath you.' },
      { id: 'ch08-choice-open-the-platform-service-grate', label: 'Open the platform service grate', detail: 'Create a close assault route while leaving the defensive shutters under Voss\'s control.', effects: [{ type: 'flag', operation: 'add', flagId: 'platform-service-grate-opened' }, { type: 'threat', amount: -1 }], outcome: 'The grate opens behind the lower guard rail, one short climb from the command levers.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-the-bell-crews-families', chapterId: 'ch08', region: 'crownless-keep', slot: 22,
    type: 'journey', family: 'bell-crew-coercion', journeySubtype: 'moral-choice', weight: 32, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-the-bell-crews-families', title: 'The Bell Crew\'s Families',
    narrative: ['The keep bell crew admits that guards confined their families below the loft to force obedience. They can stop the alarm now if the party promises an immediate rescue.', 'Sending fighters below weakens the platform assault. Ordering the crew to stop without a rescue may save the hall, but asks coerced workers to risk their families again.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-rescue-the-bell-families-now', label: 'Rescue the bell families now', detail: 'Honor the crew\'s condition and silence the alarm with fewer fighters at the platform.', effects: [{ type: 'flag', operation: 'add', flagId: 'bell-families-rescued' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'A rescue team opens the loft cells before the bell crew drops its ropes and joins the evacuation.' },
      { id: 'ch08-choice-order-the-bell-silenced-first', label: 'Order the bell silenced first', detail: 'Keep the assault together while asking coerced workers to trust a rescue that comes later.', effects: [{ type: 'flag', operation: 'add', flagId: 'coronation-alarm-silenced' }, { type: 'tension', amount: 2 }], outcome: 'The crew cuts the bell ropes while their families remain behind a guarded door below.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-from-the-hall-to-the-courtyard', chapterId: 'ch08', region: 'crownless-keep', slot: 26,
    type: 'journey', family: 'post-conflict-courtyard', journeySubtype: 'travel', weight: 24, pacing: 'recovery',
    illustrationId: 'scene-ch08-journey-from-the-hall-to-the-courtyard', title: 'From the Hall to the Courtyard',
    narrative: ['After the platform conflict, wounded guards, delegates, and civilians converge on the upper courtyard. Smoke from the broken press drifts toward the archive windows.', 'Clearing the infirmary route saves lives. Organizing a bucket line protects the records that will support trials and settlement, but delays treatment.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-clear-the-courtyard-infirmary-route', label: 'Clear the infirmary route', detail: 'Move wounded people to treatment quickly while smoke reaches the unguarded archive windows.', effects: [{ type: 'flag', operation: 'add', flagId: 'courtyard-wounded-evacuated' }, { type: 'vitals', health: 5 }], outcome: 'Caldus marks a clear lane and stretcher teams carry both sides toward the lower ward.' },
      { id: 'ch08-choice-form-the-archive-bucket-line', label: 'Form the archive bucket line', detail: 'Protect trial records from fire while wounded guards wait longer in the crowded courtyard.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-archives-protected-from-fire' }, { type: 'evidence', operation: 'add', evidenceId: 'surviving-compact-archive' }], outcome: 'Clerks and soldiers pass water together until the smoke stops rising from the shutters.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-search-the-guard-passage', chapterId: 'ch08', region: 'crownless-keep', slot: 27,
    type: 'journey', family: 'guard-passage-search', journeySubtype: 'travel', weight: 23, pacing: 'danger',
    illustrationId: 'scene-ch08-journey-search-the-guard-passage', title: 'Search the Guard Passage',
    narrative: ['A narrow guard passage runs from the platform to the upper barracks and outer wall. Fresh boot marks divide toward a postern and a room where command dispatches were burned.', 'Following the postern may catch fleeing loyalists. Searching the dispatch room can preserve evidence about officers who remain inside the coalition.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-follow-the-postern-boot-marks', label: 'Follow the postern boot marks', detail: 'Pursue armed loyalists before they reach the road while leaving the burned dispatches unexamined.', effects: [{ type: 'flag', operation: 'add', flagId: 'upper-postern-pursuit-started' }, { type: 'threat', amount: -1 }], outcome: 'The party reaches the outer wall as a rope ladder begins sliding over the parapet.' },
      { id: 'ch08-choice-search-the-burned-dispatch-room', label: 'Search the burned dispatch room', detail: 'Recover command names from the ashes while the fleeing group gains distance beyond the keep.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'burned-loyalist-dispatches' }, { type: 'threat', amount: 1 }], outcome: 'Jory finds a damp packet beneath the brazier with three guard companies still listed.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-the-surrendered-standard-bearer', chapterId: 'ch08', region: 'crownless-keep', slot: 31,
    type: 'journey', family: 'standard-bearer-surrender', journeySubtype: 'side-quest', weight: 27, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-the-surrendered-standard-bearer', title: 'The Surrendered Standard-Bearer',
    narrative: ['Voss\'s wounded standard-bearer offers the banner and the names of loyalist officers if his surviving squad receives public prisoner terms. Several coalition fighters want the banner torn down without negotiation.', 'Accepting the surrender gains names and prevents revenge. Taking only the banner is faster, but sends the squad back toward hidden barracks with no settlement.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-record-the-squads-surrender', label: 'Record the squad\'s surrender', detail: 'Grant witnessed prisoner terms and receive an officer list while testing coalition restraint after victory.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'loyalist-officer-list' }, { type: 'flag', operation: 'add', flagId: 'keep-squad-surrender-recorded' }, { type: 'tension', amount: -1 }], outcome: 'The squad lays down weapons beneath a written guarantee and the bearer names every remaining officer.' },
      { id: 'ch08-choice-take-the-banner-without-terms', label: 'Take the banner without terms', detail: 'Remove Voss\'s symbol immediately while leaving the wounded squad uncertain and still armed.', effects: [{ type: 'flag', operation: 'add', flagId: 'black-banner-publicly-taken' }, { type: 'threat', amount: 1 }], outcome: 'The banner comes down, but the squad withdraws into the barracks carrying its wounded.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-audit-the-custodian-inventory', chapterId: 'ch08', region: 'crownless-keep', slot: 33,
    type: 'journey', family: 'custodian-inventory-audit', journeySubtype: 'investigation', weight: 34, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-audit-the-custodian-inventory', title: 'Audit the Custodian Inventory',
    narrative: ['The first custodian inventory lists weapons, prisoners, seal cases, and private campaign ledgers. One ledger number is missing between Voss\'s road accounts and the false coronation file.', 'Tracing the number through receiving books preserves a clean search. Questioning Voss\'s clerk may locate it faster, but alerts anyone still trying to remove the ledger.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-trace-the-missing-ledger-number', label: 'Trace the missing ledger number', detail: 'Follow the archive custody books carefully while a hidden document remains out of reach longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'missing-ledger-traced-by-register' }, { type: 'evidence', operation: 'add', evidenceId: 'private-ledger-receiving-line' }], outcome: 'The receiving line ends at a cabinet signed out to Voss\'s private secretary.' },
      { id: 'ch08-choice-question-the-private-clerk', label: 'Question the private clerk', detail: 'Find the likely cabinet immediately while warning the clerk that the missing ledger has been noticed.', effects: [{ type: 'flag', operation: 'add', flagId: 'private-ledger-cabinet-identified' }, { type: 'threat', amount: 1 }], outcome: 'The clerk glances toward the record wing before claiming that no such ledger existed.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-mercy-in-the-upper-barracks', chapterId: 'ch08', region: 'crownless-keep', slot: 35,
    type: 'journey', family: 'upper-barracks-mercy', journeySubtype: 'moral-choice', weight: 31, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-mercy-in-the-upper-barracks', title: 'Mercy in the Upper Barracks',
    narrative: ['The upper barracks holds wounded loyalists beside two captured wardens. Neither group can be moved safely while a final armed cell controls the record-wing door.', 'Leaving medicine for both sides reduces supplies before the last search. Treating only the wardens preserves strength but turns lawful victory into selective mercy.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-treat-both-barracks-lines', label: 'Treat both barracks lines', detail: 'Spend scarce medicine on prisoners and wardens alike before entering the final record wing.', effects: [{ type: 'flag', operation: 'add', flagId: 'upper-barracks-wounded-treated' }, { type: 'vitals', resource: -3 }, { type: 'tension', amount: -1 }], outcome: 'Caldus leaves equal dressings on both rows and records every patient under the custodian seal.' },
      { id: 'ch08-choice-treat-the-captured-wardens', label: 'Treat the captured wardens', detail: 'Preserve supplies for allies and the last search while wounded loyalists receive only water.', effects: [{ type: 'flag', operation: 'add', flagId: 'captured-wardens-treated' }, { type: 'vitals', health: 4 }, { type: 'faction', factionId: 'border-council', amount: -1 }], outcome: 'The wardens return to duty as the loyalist row watches the medicine case close.' },
    ],
  }),
  defineScene({
    id: 'ch08-journey-across-the-quiet-record-wing', chapterId: 'ch08', region: 'crownless-keep', slot: 37,
    type: 'journey', family: 'cipher-key-fragments', journeySubtype: 'side-quest', weight: 29, pacing: 'quiet',
    illustrationId: 'scene-ch08-journey-across-the-quiet-record-wing', title: 'Across the Quiet Record Wing',
    narrative: ['The secured record wing contains torn cipher worksheets beside ordinary road tallies. Three repeated symbols correspond to bridge, payment, and receipt, enough to begin reading one concealed letter.', 'Collecting every worksheet improves accuracy but disturbs sealed trial files. Taking only the loose fragments protects the archive and leaves parts of the message uncertain.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch08-main-the-letter-in-cipher'], callbackPromises: [], choices: [
      { id: 'ch08-choice-catalog-every-cipher-worksheet', label: 'Catalog every cipher worksheet', detail: 'Build a reliable decoding key while reopening several files already sealed for future trials.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'complete-voss-cipher-key' }, { type: 'tension', amount: 1 }], outcome: 'Lyra records each symbol in place and reseals every file with the custodian watching.' },
      { id: 'ch08-choice-take-only-the-loose-fragments', label: 'Take only the loose fragments', detail: 'Respect the sealed trial archive while accepting gaps in the final letter translation.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'partial-voss-cipher-key' }, { type: 'flag', operation: 'add', flagId: 'trial-files-left-sealed' }], outcome: 'Talla gathers the loose worksheets without opening a single numbered case.' },
    ],
  }),
]);
