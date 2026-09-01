import { defineScene } from '../../builders';

export const CH01_HUB = Object.freeze([
  defineScene({
    id: 'ch01-hub-first-night-camp', chapterId: 'ch01', region: 'gloamwood', slot: 7,
    type: 'hub', family: 'camp', weight: 100, pacing: 'recovery', tensionChange: -2,
    illustrationId: 'scene-ch01-hub-first-night-camp', title: 'First Night on Route Seven',
    narrative: [
      'The convoy camps inside a low stone sheepfold where one fire can be hidden from the road. The drivers check harnesses while Jory sleeps beside the dispatch tube.',
      'You have time either to recover beside the fire or to walk the perimeter and learn which tracks approach the camp.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-rest-beside-the-hidden-fire', label: 'Rest beside the hidden fire', detail: 'Recover from the first day, but leave the outer watch to tired caravan hands.', effects: [{ type: 'vitals', health: 6, resource: 3 }, { type: 'flag', operation: 'add', flagId: 'first-camp-rested' }], outcome: 'You sleep for several quiet hours and wake while the drivers are harnessing the teams.' },
      { id: 'ch01-choice-walk-the-sheepfold-perimeter', label: 'Walk the sheepfold perimeter', detail: 'Give up some rest to inspect the approaches and reduce the risk of a night surprise.', effects: [{ type: 'flag', operation: 'add', flagId: 'first-camp-perimeter-checked' }, { type: 'threat', amount: -1 }], outcome: 'You find an old boot trail but no fresh approach, and the hidden fire remains unseen until dawn.' },
    ],
  }),
  defineScene({
    id: 'ch01-hub-ilenes-field-apothecary', chapterId: 'ch01', region: 'gloamwood', slot: 58,
    type: 'hub', family: 'field-healing', weight: 20, pacing: 'recovery', tensionChange: -1,
    merchantId: 'apothecary', merchantRestockKey: 'ch01-apothecary-field-stop',
    illustrationId: 'scene-ch01-hub-ilenes-field-apothecary', title: 'Ilene\'s Field Apothecary',
    narrative: [
      'Apothecary Ilene Marr treats travelers from a canvas shelter beside the farm lane. Her shelves hold wound wash, bitter tonic, and a small reserve of clean bandages.',
      'She will trade supplies or examine the toll officer now. Treatment costs time before the smoke on the northern road grows thicker.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-open-ilenes-trade-case', label: 'Open Ilene\'s trade case', detail: 'Spend coin on field supplies, while the convoy remains stopped beside a public road.', effects: [{ type: 'flag', operation: 'add', flagId: 'apothecary-stock-opened-ch01' }], outcome: 'Ilene lays labeled bottles across a clean cloth and names the price of each before you touch it.' },
      { id: 'ch01-choice-ask-ilene-to-treat-the-wounded', label: 'Ask Ilene to treat the wounded', detail: 'Use her limited time on the injured, but risk reaching the bridge after the raiders regroup.', effects: [{ type: 'vitals', health: 5 }, { type: 'flag', operation: 'add', flagId: 'wounded-treated-by-ilene' }, { type: 'threat', amount: 1 }], outcome: 'Ilene cleans the worst wound and gives Jory clear instructions for the remaining journey.' },
    ],
  }),
  defineScene({
    id: 'ch01-hub-orrens-charcoal-wagon', chapterId: 'ch01', region: 'gloamwood', slot: 73,
    type: 'hub', family: 'road-merchant', weight: 18, pacing: 'merchant', tensionChange: -1,
    merchantId: 'road-trader', merchantRestockKey: 'ch01-road-trader-charcoal-wagon',
    illustrationId: 'scene-ch01-hub-orrens-charcoal-wagon', title: 'Orren\'s Charcoal Wagon',
    narrative: [
      'Road Trader Orren Vale has turned his charcoal wagon sideways beneath a rock shelf. He saw armed riders searching every northbound cart and refuses to move until they pass.',
      'His stock includes rope, lamp oil, dried food, and repaired weapons. He will also buy damaged gear if the convoy needs lighter wagons.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-browse-orrens-road-stock', label: 'Browse Orren\'s road stock', detail: 'Stop to trade for practical supplies, but let the riders gain distance toward Greywatch.', effects: [{ type: 'flag', operation: 'add', flagId: 'road-trader-stock-opened-ch01' }, { type: 'tension', amount: 1 }], outcome: 'Orren opens the wagon panels and keeps one eye on the southern road while you compare his goods.' },
      { id: 'ch01-choice-trade-news-for-a-shortcut', label: 'Trade news for a shortcut', detail: 'Reveal the bridge attack to learn a hidden route, but spread word that the convoy carries evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'orren-shortcut-learned' }, { type: 'threat', amount: -1 }], outcome: 'Orren marks a farm track to Greywatch and promises only that he will not repeat your names.' },
    ],
  }),
]);
