import { defineScene } from '../../builders';

export const CH05_HUB = Object.freeze([
  defineScene({
    id: 'ch05-hub-redwater-pursuit-camp', chapterId: 'ch05', region: 'embervault', slot: 5,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch05-hub-redwater-pursuit-camp', title: 'Camp Below Embervault',
    narrative: ['The party hides beneath an abandoned ore shelter within sight of Embervault\'s chained gate. Redwater testimony and the E-17 shipment code are laid beside the route map.', 'There is time to recover or rehearse the false inspection story before the next mine shift enters.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-rest-under-the-ore-shelter', label: 'Rest under the ore shelter', detail: 'Recover before entering the mine, but leave the inspection story less carefully prepared.', effects: [{ type: 'vitals', health: 8, resource: 5 }, { type: 'flag', operation: 'add', flagId: 'embervault-entry-rested' }], outcome: 'The party sleeps in short watches and wakes when the morning ore bell sounds.' },
      { id: 'ch05-choice-rehearse-the-e17-inspection', label: 'Rehearse the E-17 inspection', detail: 'Give up some rest to align names and answers, reducing the risk of a gate contradiction.', effects: [{ type: 'flag', operation: 'add', flagId: 'e17-cover-rehearsed' }, { type: 'threat', amount: -1 }], outcome: 'Jory tests every answer twice until the captured order sounds like ordinary mine business.' },
    ],
  }),
  defineScene({
    id: 'ch05-hub-vekkas-boiler-room-market', chapterId: 'ch05', region: 'embervault', slot: 22,
    type: 'hub', family: 'goblin-market', weight: 20, pacing: 'merchant', tensionChange: -1,
    merchantId: 'goblin-broker', merchantRestockKey: 'ch05-goblin-broker-boiler-room',
    illustrationId: 'scene-ch05-hub-vekkas-boiler-room-market', title: 'Vekka\'s Boiler-Room Market',
    narrative: ['Goblin Broker Vekka runs a quiet market between disused boilers, selling mine keys, lamp oil, field tools, and gear taken from careless guards. Every item has a named source.', 'Vekka will trade normally or exchange the location of a guard cache for news about the Redwater settlement.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-browse-vekkas-mine-stock', label: 'Browse Vekka\'s mine stock', detail: 'Spend coin on useful underground gear, but remain in a market known to several shift guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'goblin-broker-stock-opened-ch05' }, { type: 'tension', amount: 1 }], outcome: 'Vekka lays labeled keys and tools across a boiler plate and states the risk behind each price.' },
      { id: 'ch05-choice-trade-redwater-news-for-the-cache', label: 'Trade Redwater news for the cache', detail: 'Reveal how the border crisis ended to gain supplies, risking that the mine network learns your alliances.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-guard-cache-found' }, { type: 'threat', amount: -1 }], outcome: 'Vekka marks a ration locker behind the accounting stair and repeats none of your companion names.' },
    ],
  }),
  defineScene({
    id: 'ch05-hub-omarens-relic-bench', chapterId: 'ch05', region: 'embervault', slot: 35,
    type: 'hub', family: 'relic-merchant', weight: 18, pacing: 'merchant', tensionChange: -1,
    merchantId: 'relic-dealer', merchantRestockKey: 'ch05-relic-dealer-cooling-bench',
    illustrationId: 'scene-ch05-hub-omarens-relic-bench', title: 'Omaren\'s Cooling Bench',
    narrative: ['Relic Dealer Omaren Pell has hidden a field bench in a cooled survey room. He carries ward keys, protective charms, old mine maps, and tools that survive furnace heat.', 'He can sell equipment or inspect the recovered authorization case for damage before the escape begins.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-browse-omarens-warded-stock', label: 'Browse Omaren\'s warded stock', detail: 'Prepare for the hot escape passages, but spend time after the mine alarm has begun.', effects: [{ type: 'flag', operation: 'add', flagId: 'relic-dealer-stock-opened-ch05' }, { type: 'threat', amount: 1 }], outcome: 'Omaren opens heatproof cases and explains which charms are practical tools rather than legends.' },
      { id: 'ch05-choice-have-omaren-check-the-evidence-case', label: 'Have Omaren check the evidence case', detail: 'Protect the papers against heat and impact, but forgo shopping before the cinder-shaft climb.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-evidence-case-reinforced' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'Omaren replaces two weak clasps and wraps the case seams in cooling cloth.' },
    ],
  }),
]);
