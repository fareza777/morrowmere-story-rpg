import { defineScene } from '../../builders';

export const CH08_HUB = Object.freeze([
  defineScene({
    id: 'ch08-hub-the-old-customs-kitchen', chapterId: 'ch08', region: 'crownless-keep', slot: 3,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch08-hub-the-old-customs-kitchen', title: 'The Old Customs Kitchen',
    narrative: ['An unused customs kitchen becomes the last secure room before the false coronation hearing. Civilians heat water, Jory checks evidence cases, and the party can hear guard rotations through the walls.', 'A short rest restores strength but allows more guests to enter the hall. Preparing witness bundles keeps the case mobile and costs the party its recovery.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-rest-in-the-customs-kitchen', label: 'Rest in the customs kitchen', detail: 'Recover before entering the seal hall while Voss\'s ushers complete another guest count.', effects: [{ type: 'vitals', health: 12, resource: 8 }, { type: 'flag', operation: 'add', flagId: 'ch08-customs-kitchen-rested' }, { type: 'tension', amount: 2 }], outcome: 'The party rests beside banked ovens until the first formal bell sounds above.' },
      { id: 'ch08-choice-prepare-mobile-witness-bundles', label: 'Prepare mobile witness bundles', detail: 'Keep testimony and records ready to move through a fight while giving up the last safe rest.', effects: [{ type: 'flag', operation: 'add', flagId: 'final-witness-bundles-prepared' }, { type: 'evidence', operation: 'add', evidenceId: 'final-hearing-custody-list' }, { type: 'vitals', resource: -2 }], outcome: 'Jory divides the hearing case into numbered bundles carried by separate protected witnesses.' },
    ],
  }),
  defineScene({
    id: 'ch08-hub-ilene-beside-the-witness-gallery', chapterId: 'ch08', region: 'crownless-keep', slot: 15,
    type: 'hub', family: 'gallery-apothecary', weight: 22, pacing: 'merchant', tensionChange: -1,
    merchantId: 'apothecary', merchantRestockKey: 'ch08-apothecary-witness-gallery',
    illustrationId: 'scene-ch08-hub-ilene-beside-the-witness-gallery', title: 'Ilene Beside the Witness Gallery',
    narrative: ['Apothecary Ilene Marr sets a compact field shop beside the witness gallery. Her stock includes strong dressings, smoke balm, focus tonic, and remedies carried from Greywatch after the siege.', 'Trading prepares the party for the platform. Giving her stock to delegates improves the improvised ward but removes those remedies from purchase.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-open-ilenes-gallery-stock', label: 'Open Ilene\'s gallery stock', detail: 'Buy final combat remedies while witnesses wait beside an undersupplied treatment bench.', effects: [{ type: 'flag', operation: 'add', flagId: 'apothecary-stock-opened-ch08' }], outcome: 'Ilene lays out each remedy with a written dose and keeps the gallery exit clear.' },
      { id: 'ch08-choice-give-the-stock-to-the-delegates', label: 'Give the stock to delegates', detail: 'Supply the civilian ward fully while entering the platform confrontation with fewer remedies.', effects: [{ type: 'flag', operation: 'add', flagId: 'civilian-medicine-delivered' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'vitals', resource: -2 }], outcome: 'Ilene moves every sealed remedy to the treatment bench and begins with the weakest delegates.' },
    ],
  }),
  defineScene({
    id: 'ch08-hub-orrens-courtyard-forge', chapterId: 'ch08', region: 'crownless-keep', slot: 28,
    type: 'hub', family: 'courtyard-blacksmith', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'blacksmith', merchantRestockKey: 'ch08-blacksmith-upper-courtyard',
    illustrationId: 'scene-ch08-hub-orrens-courtyard-forge', title: 'Orren\'s Courtyard Forge',
    narrative: ['Keep smith Orren turns a courtyard repair station over to the victors after the hall conflict. He offers recovered armor, repaired weapons, shield fittings, and tools for securing the damaged machinery.', 'Opening trade helps the party face remaining loyalists. Using the fittings to lock the engine makes the settlement safer but reduces available equipment.'],
    eligibility: { minLevel: 14, maxLevel: 15 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [], choices: [
      { id: 'ch08-choice-open-orrens-courtyard-stock', label: 'Open Orren\'s courtyard stock', detail: 'Repair and trade before clearing the upper ward while the engine remains secured by temporary ropes.', effects: [{ type: 'flag', operation: 'add', flagId: 'blacksmith-stock-opened-ch08' }], outcome: 'Orren marks every recovered item and opens the repair racks beneath the courtyard awning.' },
      { id: 'ch08-choice-use-fittings-to-lock-the-engine', label: 'Use fittings to lock the engine', detail: 'Make the dismantled apparatus impossible to restart while sacrificing repaired gear from the forge.', effects: [{ type: 'flag', operation: 'add', flagId: 'coronation-engine-permanently-locked' }, { type: 'flag', operation: 'add', flagId: 'war-mechanism-dismantled' }, { type: 'vitals', resource: -2 }], outcome: 'Orren pins every lever and removes the counterweight hooks under public inventory.' },
    ],
  }),
]);
