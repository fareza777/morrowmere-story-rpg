import { defineScene } from '../../builders';

export const CH04_HUB = Object.freeze([
  defineScene({
    id: 'ch04-hub-redwater-palisade-camp', chapterId: 'ch04', region: 'drowned-road', slot: 3,
    type: 'hub', family: 'camp', weight: 70, pacing: 'recovery',
    illustrationId: 'scene-ch04-hub-redwater-palisade-camp', title: 'Redwater Palisade Camp',
    narrative: [
      'Redwater assigns your party a canvas shelter inside the palisade between the guild hall and the refugee cookhouse. Both army camps remain visible beyond the sharpened stakes.',
      'A full rest restores strength before the parley. Taking a wall watch gives less sleep but may catch signal traffic between the fields and the south tower.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-rest-inside-the-palisade', label: 'Rest inside the palisade', detail: 'Recover behind town walls while guild wardens keep custody of the evidence through the night.', effects: [{ type: 'vitals', health: 12, resource: 7 }, { type: 'flag', operation: 'add', flagId: 'redwater-palisade-rested' }], outcome: 'The party wakes before dawn to steady rain and the sound of both army camps changing watch.' },
      { id: 'ch04-choice-take-the-south-wall-watch', label: 'Take the south-wall watch', detail: 'Give up some recovery to observe lamps and runners moving outside either command line.', effects: [{ type: 'vitals', health: 6, resource: 3 }, { type: 'flag', operation: 'add', flagId: 'south-tower-signals-observed' }, { type: 'threat', amount: -1 }], outcome: 'Three shielded lamps answer the empty south tower from a warehouse window near midnight.' },
    ],
  }),
  defineScene({
    id: 'ch04-hub-the-neutral-quartermaster', chapterId: 'ch04', region: 'drowned-road', slot: 10,
    type: 'hub', family: 'neutral-quartermaster', weight: 70, pacing: 'merchant', merchantId: 'quartermaster',
    merchantRestockKey: 'ch04-redwater-neutral-requisition', illustrationId: 'scene-ch04-hub-the-neutral-quartermaster',
    title: 'The Neutral Quartermaster',
    narrative: [
      'Quartermaster Ina Crest runs a requisition tent under Redwater colors, with equal shelves assigned to Greywatch and Free Host stock. Every sale receives a town-stamped receipt.',
      'Crest offers field gear at standard coin prices. She also needs volunteers to audit two crates delivered with matching false signatures.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-review-the-neutral-stock', label: 'Review the neutral stock', detail: 'Spend time comparing military supplies while every purchase becomes part of the town record.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-quartermaster-opened' }, { type: 'faction', factionId: 'border-council', amount: 1 }], outcome: 'Crest opens both shelf ledgers and refuses to sell any item whose custody cannot be traced.' },
      { id: 'ch04-choice-audit-the-false-signatures', label: 'Audit the false signatures', detail: 'Help isolate suspect crates in exchange for coin and delay personal resupply until later.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-crates-audited' }, { type: 'gold', scope: 'unbanked', amount: 12 }, { type: 'tension', amount: -1 }], outcome: 'The audit separates two weapon crates copied from consecutive pages of different camp ledgers.' },
    ],
  }),
  defineScene({
    id: 'ch04-hub-the-nimble-nail-exchange', chapterId: 'ch04', region: 'drowned-road', slot: 25,
    type: 'hub', family: 'goblin-exchange', weight: 65, pacing: 'merchant', merchantId: 'goblin-broker',
    merchantRestockKey: 'ch04-nimble-nail-market', illustrationId: 'scene-ch04-hub-the-nimble-nail-exchange',
    title: 'The Nimble Nail Exchange',
    narrative: [
      'Goblin broker Pella Quill operates beneath the covered market with salvaged tools, compact charms, and supplies carried through Redwater\'s roof passages. Her prices include information as often as coin.',
      'Pella can trade normally or buy the locations of safe civilian lanes. Selling those routes funds the pursuit but may spread them beyond trusted messengers.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-trade-at-the-nimble-nail', label: 'Trade at the Nimble Nail', detail: 'Browse compact field stock in a crowded market while keeping evacuation routes private.', effects: [{ type: 'flag', operation: 'add', flagId: 'nimble-nail-opened' }, { type: 'threat', amount: 1 }], outcome: 'Pella displays every item on clean cloth and warns which pieces were recently stolen from camp stores.' },
      { id: 'ch04-choice-sell-old-safe-route-maps', label: 'Sell old safe-route maps', detail: 'Exchange routes already cleared of civilians for coin, trusting the broker not to resell active paths.', effects: [{ type: 'flag', operation: 'add', flagId: 'expired-routes-sold' }, { type: 'gold', scope: 'unbanked', amount: 15 }, { type: 'companion-loyalty', companionId: 'talla', amount: 2 }], outcome: 'Pella pays for routes whose families have already arrived, then burns the two maps still marked active.' },
    ],
  }),
]);
