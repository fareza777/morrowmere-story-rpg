import { defineScene } from '../../builders';

export const CH07_HUB = Object.freeze([
  defineScene({
    id: 'ch07-hub-the-last-greywatch-camp', chapterId: 'ch07', region: 'crownless-keep', slot: 3,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch07-hub-the-last-greywatch-camp', title: 'The Last Greywatch Camp',
    narrative: [
      'The march makes one disciplined camp among abandoned toll barns. Bren Hale posts separate watches around civilians, witnesses, and evidence wagons while the keep ridge appears through the evening haze.',
      'A full rest restores the vanguard but costs road time. Copying custody lists through the night protects the case if a wagon is lost, at the cost of sleep.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-rest-under-hales-watch', label: 'Rest under Hale\'s watch', detail: 'Recover before the ridge ascent while giving Voss more time to assemble the governors.', effects: [{ type: 'vitals', health: 11, resource: 7 }, { type: 'flag', operation: 'add', flagId: 'ch07-last-camp-rested' }, { type: 'tension', amount: 2 }], outcome: 'The party sleeps for one full watch and wakes to the keep bell carrying over the hills.' },
      { id: 'ch07-choice-copy-the-custody-lists', label: 'Copy the custody lists', detail: 'Protect every witness chain against one lost wagon while reaching the ridge without a full recovery.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-custody-lists-copied' }, { type: 'evidence', operation: 'add', evidenceId: 'coalition-custody-list' }, { type: 'vitals', resource: -2 }], outcome: 'Jory numbers four complete copies and gives each to a different column officer before dawn.' },
    ],
  }),
  defineScene({
    id: 'ch07-hub-nessas-march-quartermaster', chapterId: 'ch07', region: 'crownless-keep', slot: 16,
    type: 'hub', family: 'march-quartermaster', weight: 22, pacing: 'merchant', tensionChange: -1,
    merchantId: 'quartermaster', merchantRestockKey: 'ch07-quartermaster-kingroad',
    illustrationId: 'scene-ch07-hub-nessas-march-quartermaster', title: 'Nessa\'s March Quartermaster',
    narrative: [
      'Nessa Cole runs a moving supply yard from three linked wagons. She has repaired shields, climbing rope, field rations, and captured keep equipment recorded against its former owners.',
      'Opening the wagons delays the column at a visible crossroads. Sending supplies forward keeps momentum but leaves little time to inspect or trade gear.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-open-nessas-march-stock', label: 'Open Nessa\'s march stock', detail: 'Trade and repair before the keep ascent while patrol signals spread from the crossroads.', effects: [{ type: 'flag', operation: 'add', flagId: 'quartermaster-stock-opened-ch07' }, { type: 'threat', amount: 1 }], outcome: 'Nessa lowers the wagon sides and posts the captured-equipment register where every buyer can see it.' },
      { id: 'ch07-choice-send-climbing-kits-forward', label: 'Send climbing kits forward', detail: 'Equip the advance without stopping to trade, leaving the evidence wagons with fewer repair supplies.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-climbing-kits-forwarded' }, { type: 'vitals', resource: 5 }], outcome: 'Runners carry rope, hooks, and padded gloves toward the scouts while the wagons keep moving.' },
    ],
  }),
  defineScene({
    id: 'ch07-hub-brez-at-the-abandoned-tollhouse', chapterId: 'ch07', region: 'crownless-keep', slot: 30,
    type: 'hub', family: 'goblin-tollhouse-broker', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'goblin-broker', merchantRestockKey: 'ch07-goblin-broker-tollhouse',
    illustrationId: 'scene-ch07-hub-brez-at-the-abandoned-tollhouse', title: 'Brez at the Abandoned Tollhouse',
    narrative: [
      'Brez, a goblin contractor who once serviced the keep drains, has turned an abandoned tollhouse into a careful market. He offers smoke pots, lock tools, old uniforms, and exact measurements of service doors.',
      'His drain ledger also names goblin crews Voss never paid. Buying the ledger helps a later claim; using it as leverage makes the infiltration cheaper but keeps those debts private.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-open-brezs-tollhouse-market', label: 'Open Brez\'s tollhouse market', detail: 'Purchase infiltration tools and old keep gear while spending time beneath a watched signal tower.', effects: [{ type: 'flag', operation: 'add', flagId: 'goblin-broker-stock-opened-ch07' }, { type: 'threat', amount: 1 }], outcome: 'Brez unfolds a clean inventory and explains which service keys still match the keep locks.' },
      { id: 'ch07-choice-buy-the-unpaid-drain-ledger', label: 'Buy the unpaid drain ledger', detail: 'Preserve proof of Voss\'s debts to civilian crews instead of bargaining those claims away for supplies.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'keep-unpaid-drain-ledger' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'gold', scope: 'unbanked', amount: -16 }], outcome: 'Brez seals the ledger in oilcloth and gives you the names of two clerks who witnessed every contract.' },
    ],
  }),
]);
