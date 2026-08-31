import { defineScene } from '../../builders';

export const CH03_HUB = Object.freeze([
  defineScene({
    id: 'ch03-hub-ferrymans-lantern-camp', chapterId: 'ch03', region: 'drowned-road', slot: 3,
    type: 'hub', family: 'camp', weight: 70, pacing: 'recovery',
    illustrationId: 'scene-ch03-hub-ferrymans-lantern-camp', title: 'Ferryman\'s Lantern Camp',
    narrative: [
      'A dry mound beside the ferry holds a cook fire inside a ring of overturned boats. Ferrymen share weather reports while refugees mend rope and sleep beneath patched sails.',
      'The party can rest openly near the fire or take the late watch and hear which patrols have been buying silent crossings.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-sleep-beside-the-ferry-fire', label: 'Sleep beside the ferry fire', detail: 'Recover in a crowded camp while trusting local boat crews to guard the evidence case.', effects: [{ type: 'vitals', health: 10, resource: 5 }, { type: 'flag', operation: 'add', flagId: 'ferryman-camp-rested' }], outcome: 'Warm food and four uninterrupted hours restore the party before the river mist returns.' },
      { id: 'ch03-choice-take-the-late-ferry-watch', label: 'Take the late ferry watch', detail: 'Give up some rest to learn which armed groups have crossed without official records.', effects: [{ type: 'flag', operation: 'add', flagId: 'silent-ferry-list-learned' }, { type: 'vitals', health: 5 }, { type: 'threat', amount: -1 }], outcome: 'A boatman names three masked quartermasters who always paid with newly struck silver.' },
    ],
  }),
  defineScene({
    id: 'ch03-hub-sella-vains-flatboat', chapterId: 'ch03', region: 'drowned-road', slot: 15,
    type: 'hub', family: 'floating-road-trader', weight: 65, pacing: 'merchant', merchantId: 'road-trader',
    merchantRestockKey: 'ch03-sella-flatboat-crossing', illustrationId: 'scene-ch03-hub-sella-vains-flatboat',
    title: 'Sella Vain\'s Flatboat',
    narrative: [
      'Road trader Sella Vain has turned a grain flatboat into a floating shop. Dry boots, rope, lamp oil, and dented field gear hang from lines above the cargo deck.',
      'Sella accepts coin or verified river news. She refuses army scrip after two patrols paid her with notes bearing the same copied signature.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-trade-at-sellas-flatboat', label: 'Trade at Sella\'s flatboat', detail: 'Spend time reviewing practical road stock while patrol boats continue searching the channel.', effects: [{ type: 'flag', operation: 'add', flagId: 'sella-flatboat-opened' }, { type: 'threat', amount: 1 }], outcome: 'Sella lays out her dry stock and quietly removes every piece she knows came from a looted farm.' },
      { id: 'ch03-choice-exchange-news-for-supplies', label: 'Exchange news for supplies', detail: 'Share safe-route information with a civilian trader and risk those routes spreading further.', effects: [{ type: 'flag', operation: 'add', flagId: 'sella-route-news-traded' }, { type: 'gold', scope: 'unbanked', amount: 8 }], outcome: 'Sella pays fairly for the marked crossings and promises to warn refugee boats before merchants.' },
    ],
  }),
  defineScene({
    id: 'ch03-hub-mother-ailsas-reed-clinic', chapterId: 'ch03', region: 'drowned-road', slot: 31,
    type: 'hub', family: 'reed-clinic', weight: 70, pacing: 'merchant', merchantId: 'apothecary',
    merchantRestockKey: 'ch03-reed-clinic-relief', illustrationId: 'scene-ch03-hub-mother-ailsas-reed-clinic',
    title: 'Mother Ailsa\'s Reed Clinic',
    narrative: [
      'Ailsa Marr treats flood fever in a long reed house raised on stone piers. Her shelves hold clean bandages, bitter tonics, and salves traded from both banks.',
      'The clinic needs carrying hands more than coin. Helping with the fever line earns treatment, but the evidence party remains in one public place for hours.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-buy-a-clean-treatment', label: 'Buy a clean treatment', detail: 'Pay for immediate care and preserve time needed to reach Redwater before the armies move.', effects: [{ type: 'gold', scope: 'unbanked', amount: -10 }, { type: 'vitals', health: 14, resource: 6 }, { type: 'flag', operation: 'add', flagId: 'ailsa-treatment-bought' }], outcome: 'Ailsa cleans every cut with boiled spirits and sends the party back to the road within the hour.' },
      { id: 'ch03-choice-work-the-fever-line', label: 'Work the fever line', detail: 'Carry water and patients in exchange for care while losing most of the remaining daylight.', effects: [{ type: 'vitals', health: 11, resource: 4 }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: 1 }], outcome: 'The clinic beds are orderly by dusk, and Ailsa treats your party after the last child is settled.' },
    ],
  }),
]);
