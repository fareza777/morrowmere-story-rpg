import { defineScene } from '../../builders';

export const CH06_HUB = Object.freeze([
  defineScene({
    id: 'ch06-hub-bracken-farm-relay', chapterId: 'ch06', region: 'gloamwood', slot: 5,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch06-hub-bracken-farm-relay', title: 'The Bracken Farm Relay',
    narrative: ['A stone barn below Greywatch becomes the last safe camp before the siege road. Forge witnesses rest among packed farm carts while Jory checks the ledger against the contingency order.', 'The party can recover for one short watch or prepare evidence bundles so no single carrier holds the complete case.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-rest-one-watch-at-bracken', label: 'Rest one watch at Bracken', detail: 'Recover before the town fight, but surrender one hour of Greywatch\'s remaining warning.', effects: [{ type: 'vitals', health: 9, resource: 5 }, { type: 'flag', operation: 'add', flagId: 'bracken-relay-rested' }, { type: 'tension', amount: 1 }], outcome: 'The party sleeps beside harnessed horses and wakes when smoke reaches the barn roof.' },
      { id: 'ch06-choice-divide-the-evidence-bundles', label: 'Divide the evidence bundles', detail: 'Give up rest to protect the proof from one capture, but make later assembly more complicated.', effects: [{ type: 'flag', operation: 'add', flagId: 'siege-evidence-bundles-divided' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'Jory divides ledger copies, seal tracings, and witness lists among four named carriers.' },
    ],
  }),
  defineScene({
    id: 'ch06-hub-ilene-at-the-south-chapel', chapterId: 'ch06', region: 'gloamwood', slot: 22,
    type: 'hub', family: 'siege-healing', weight: 20, pacing: 'recovery', tensionChange: -1,
    merchantId: 'apothecary', merchantRestockKey: 'ch06-apothecary-south-chapel',
    illustrationId: 'scene-ch06-hub-ilene-at-the-south-chapel', title: 'Ilene at the South Chapel',
    narrative: ['Apothecary Ilene Marr works beside the ward healers in the crowded chapel. Her remaining stock is limited to combat dressings, fever tonic, smoke balm, and a few sealed remedies.', 'She will trade quickly or spend the same time treating the hostages brought from the undercroft.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-open-ilenes-siege-stock', label: 'Open Ilene\'s siege stock', detail: 'Buy scarce field remedies for the wall, but leave her with fewer supplies for the chapel ward.', effects: [{ type: 'flag', operation: 'add', flagId: 'apothecary-stock-opened-ch06' }, { type: 'tension', amount: 1 }], outcome: 'Ilene sets out the remaining sealed remedies and names what each purchase removes from the ward.' },
      { id: 'ch06-choice-help-ilene-treat-the-hostages', label: 'Help Ilene treat the hostages', detail: 'Recover while supporting the ward, but return to the siege line after the next alarm begins.', effects: [{ type: 'vitals', health: 7, resource: 3 }, { type: 'flag', operation: 'add', flagId: 'chapel-hostages-treated' }, { type: 'threat', amount: 1 }], outcome: 'The rescued hostages receive smoke balm and clean bandages before the wall bell sounds again.' },
    ],
  }),
  defineScene({
    id: 'ch06-hub-nessa-coles-siege-yard', chapterId: 'ch06', region: 'gloamwood', slot: 35,
    type: 'hub', family: 'siege-quartermaster', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'quartermaster', merchantRestockKey: 'ch06-quartermaster-siege-yard',
    illustrationId: 'scene-ch06-hub-nessa-coles-siege-yard', title: 'Nessa Cole\'s Siege Yard',
    narrative: ['Quartermaster Nessa Cole opens the last reserve cages beside the inner barricade. Surviving defenders can trade captured gear, repair equipment, and take siege rations before the final breach response.', 'Cole can also reinforce the archive cart, but doing so uses fittings needed for shields on the barricade.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-open-coles-siege-reserve', label: 'Open Cole\'s siege reserve', detail: 'Prepare equipment before the final defense, but spend coin and time beside the inner barricade.', effects: [{ type: 'flag', operation: 'add', flagId: 'quartermaster-stock-opened-ch06' }], outcome: 'Cole unlocks the reserve cages and records every item against the surviving ward list.' },
      { id: 'ch06-choice-reinforce-the-archive-cart', label: 'Reinforce the archive cart', detail: 'Protect the evidence during retreat, but leave the barricade with fewer shield fittings.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-archive-cart-reinforced' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'Cole bolts iron straps across the cart and sends the remaining fittings to Hale.' },
    ],
  }),
]);
