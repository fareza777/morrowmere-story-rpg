import { defineScene } from '../../builders';

export const CH08_COMBAT = Object.freeze([
  defineScene({
    id: 'ch08-combat-the-guest-guard-rotation', chapterId: 'ch08', region: 'crownless-keep', slot: 5,
    type: 'combat', family: 'guest-room-guard-rotation', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch08-guest-guard-rotation', illustrationId: 'scene-ch08-combat-the-guest-guard-rotation',
    title: 'The Guest Guard Rotation',
    narrative: ['A fresh guard rotation reaches the compelled guest rooms while civilians are still moving through the service passage. Its captain carries the master keys and orders the rear rank to secure every stair.', 'Taking the keys opens the remaining rooms. Holding the stair protects the evacuation, but gives the captain time to lock delegates behind stronger doors.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-reach-the-guest-master-keys', label: 'Reach the guest master keys', detail: 'Open every guarded room while the rear rank presses toward the civilian passage.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-guest-keys-seized' }], outcome: 'The captain draws steel over the key ring while two guards turn toward the service door.' },
      { id: 'ch08-choice-hold-the-service-stair', label: 'Hold the service stair', detail: 'Protect the evacuating families while the captain moves the remaining delegates deeper inside.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-service-stair-held' }], outcome: 'The party blocks the stair as the captain orders locked guests toward the record level.' },
    ],
  }),
  defineScene({
    id: 'ch08-combat-wardens-of-the-seal-cases', chapterId: 'ch08', region: 'crownless-keep', slot: 10,
    type: 'combat', family: 'seal-case-wardens', weight: 100, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch08-seal-case-wardens', illustrationId: 'scene-ch08-combat-wardens-of-the-seal-cases',
    title: 'Wardens of the Seal Cases',
    narrative: ['Armored wardens form around nine disputed seal cases as Voss\'s clerk tries to lower them into a barred document well. Several wardens look uncertain, but their sergeant orders them to defend lawful property.', 'Stopping the lift preserves the cases. Reaching the sergeant with the custody register may divide the unit, though the clerk can lower more evidence meanwhile.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-stop-the-document-well-lift', label: 'Stop the document-well lift', detail: 'Keep all nine seal cases in sight while fighting through wardens who still believe their orders.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-seal-lift-stopped' }], outcome: 'The chain groans as the cases descend and the wardens close around its brake.' },
      { id: 'ch08-choice-show-the-sergeant-the-register', label: 'Show the sergeant the register', detail: 'Risk the custody book near the shield line to split uncertain wardens from Voss\'s clerk.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-seal-wardens-challenged' }], outcome: 'The sergeant reads the duplicated entries while the clerk reaches again for the lift lever.' },
    ],
  }),
  defineScene({
    id: 'ch08-combat-the-archive-furnace-detail', chapterId: 'ch08', region: 'crownless-keep', slot: 17,
    type: 'combat', family: 'archive-furnace-destruction', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch08-archive-furnace-detail', illustrationId: 'scene-ch08-combat-the-archive-furnace-detail',
    title: 'The Archive Furnace Detail',
    narrative: ['A demolition detail barricades the archive furnace with oil jars and bundles of campaign dispatches. Its mage heats the iron door while a sapper lays a slow fuse beneath the record shelves.', 'Breaking the oil line protects the full archive. Capturing the mage preserves a witness who can identify which records Voss ordered destroyed.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch08-main-voss-offers-order'], callbackPromises: [], choices: [
      { id: 'ch08-choice-break-the-archive-oil-line', label: 'Break the archive oil line', detail: 'Prevent the shelves from burning while the mage keeps heating the furnace door.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-archive-oil-line-broken' }, { type: 'evidence', operation: 'add', evidenceId: 'saved-voss-dispatches' }], outcome: 'Oil spreads harmlessly across bare stone as the sapper turns to defend the fuse.' },
      { id: 'ch08-choice-capture-the-furnace-mage', label: 'Capture the furnace mage', detail: 'Secure a living witness to Voss\'s destruction order while oil jars remain beside the records.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-furnace-mage-captured' }], outcome: 'The party moves through waves of dry heat while the mage calls for the fuse to be lit.' },
    ],
  }),
  defineScene({
    id: 'ch08-combat-the-coronation-engine', chapterId: 'ch08', region: 'crownless-keep', slot: 24,
    type: 'combat', family: 'coronation-engine-apparatus', weight: 100, pacing: 'danger', threatChange: 4,
    encounterId: 'enc-ch08-coronation-engine', illustrationId: 'scene-ch08-combat-the-coronation-engine',
    title: 'The Coronation Engine',
    narrative: ['Platform guards engage the Coronation Engine: a linked seal press, alarm bell, counterweighted portcullis, and bank of defensive shutters. Steam and sorcery play no part; the danger comes from heavy iron moving above a crowded hall.', 'The brake station controls the gate and shutters. The platform signaler coordinates the guards and press crew, forcing a choice between machinery and command.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch08-main-the-marshal-and-the-banner'], callbackPromises: [], choices: [
      { id: 'ch08-choice-take-the-engine-brake-station', label: 'Take the engine brake station', detail: 'Stop the heaviest machinery while organized platform guards retain Voss\'s signals.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-engine-brakes-taken' }], outcome: 'The party crosses under the counterweight chain as the brake crew locks shields around its lever.' },
      { id: 'ch08-choice-break-the-platform-signals', label: 'Break the platform signals', detail: 'Disorganize the guard and press crews while the portcullis continues descending toward the hall.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-platform-signals-broken' }], outcome: 'The signaler raises two command flags while the iron gate drops another handspan.' },
    ],
  }),
  defineScene({
    id: 'ch08-combat-loyalists-in-the-upper-courtyard', chapterId: 'ch08', region: 'crownless-keep', slot: 30,
    type: 'combat', family: 'post-resolution-loyalist-counterstroke', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch08-upper-courtyard-loyalists', illustrationId: 'scene-ch08-combat-loyalists-in-the-upper-courtyard',
    title: 'Loyalists in the Upper Courtyard',
    narrative: ['A loyalist company counterattacks through the upper courtyard to recover Voss or destroy the custody records, depending on how the hall ended. Wounded civilians remain between the archive cart and infirmary door.', 'Holding the archive cart preserves accountability. Opening the infirmary lane saves the wounded while the loyalists reach documents and prisoners.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-form-around-the-custody-records', label: 'Form around the custody records', detail: 'Protect the case against Voss and his officers while wounded civilians remain in the open longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-custody-records-defended' }], outcome: 'The party forms around the archive cart as the loyalist captain points his line toward it.' },
      { id: 'ch08-choice-open-the-infirmary-lane', label: 'Open the infirmary lane', detail: 'Move wounded people out of the charge while the archive cart receives only a clerk guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-infirmary-lane-opened' }], outcome: 'Stretcher teams cross behind you as loyalists turn toward the lightly guarded records.' },
    ],
  }),
  defineScene({
    id: 'ch08-combat-the-last-record-wing-cell', chapterId: 'ch08', region: 'crownless-keep', slot: 36,
    type: 'combat', family: 'record-wing-holdouts', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch08-record-wing-holdouts', illustrationId: 'scene-ch08-combat-the-last-record-wing-cell',
    title: 'The Last Record-Wing Cell',
    narrative: ['The last armed cell holds Voss\'s private record wing with a clerk, a cipher chest, and sealed trial files between them. Their leader threatens to scatter burning pages down the ventilation shaft.', 'The chest may contain the missing correspondence. The ventilation grate controls the fire risk, but reaching it leaves the leader beside the cipher records.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch08-main-the-letter-in-cipher'], callbackPromises: [], choices: [
      { id: 'ch08-choice-reach-the-cipher-chest', label: 'Reach the cipher chest', detail: 'Secure Voss\'s private correspondence while burning pages threaten the rest of the archive.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-cipher-chest-secured' }], outcome: 'The holdout leader braces beside the chest while the clerk touches flame to a loose page.' },
      { id: 'ch08-choice-seal-the-ventilation-grate', label: 'Seal the ventilation grate', detail: 'Protect trial records throughout the wing while the holdouts retain the cipher chest longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch08-record-vent-sealed' }], outcome: 'You move toward the iron grate as burning paper curls above the open shaft.' },
    ],
  }),
]);
