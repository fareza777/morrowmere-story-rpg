import { defineScene } from '../../builders';

export const CH04_COMBAT = Object.freeze([
  defineScene({
    id: 'ch04-combat-pikes-at-the-parley-rope', chapterId: 'ch04', region: 'drowned-road', slot: 6,
    type: 'combat', family: 'parley-line-hardliners', weight: 90, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch04-parley-rope', illustrationId: 'scene-ch04-combat-pikes-at-the-parley-rope',
    title: 'Pikes at the Parley Rope',
    narrative: [
      'Greywatch and Free Host hardliners rush the parley boundary from opposite ends at the same signal. Their front ranks shout different causes, but both rear leaders wear identical black leather bracers.',
      'Holt\'s unarmed clerks are trapped beside the evidence table. The rear leaders may escape if you form a shield around the witnesses.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-shield-the-parley-clerks', label: 'Shield the parley clerks', detail: 'Protect neutral witnesses and the evidence table while the two rear leaders direct the attack.', effects: [{ type: 'flag', operation: 'add', flagId: 'parley-clerks-protected' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'The clerks drag the evidence beneath the table as your line absorbs the first rush from both directions.' },
      { id: 'ch04-choice-break-through-to-rear-leaders', label: 'Break through to the rear leaders', detail: 'Leave the parley table lightly guarded to capture whoever gave both groups one signal.', effects: [{ type: 'flag', operation: 'add', flagId: 'parley-hardliner-leader-caught' }, { type: 'threat', amount: 1 }], outcome: 'One leader falls with two camp passes and a list of matching attack times inside his bracer.' },
    ],
  }),
  defineScene({
    id: 'ch04-combat-knives-beneath-the-millrace', chapterId: 'ch04', region: 'drowned-road', slot: 13,
    type: 'combat', family: 'millrace-assassins', weight: 85, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch04-millrace-knives', illustrationId: 'scene-ch04-combat-knives-beneath-the-millrace',
    title: 'Knives Beneath the Millrace',
    narrative: [
      'Divers rise beneath the mill footbridge with tarred knives and weighted nets. They strike at Aven Pell\'s witness escort while an accomplice opens the sluice to deepen the channel.',
      'The sluice wheel can stop the current, but the divers will reach the witness first. Holding the bridge protects him while the water becomes their weapon.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-fight-for-the-sluice-wheel', label: 'Fight for the sluice wheel', detail: 'Cut off the rising current while trusting the escort to keep the murder witness alive.', effects: [{ type: 'flag', operation: 'add', flagId: 'millrace-sluice-closed' }], outcome: 'The wheel locks and the channel falls, exposing the divers among stones beneath the bridge.' },
      { id: 'ch04-choice-hold-around-the-witness', label: 'Hold around the witness', detail: 'Protect the escort on a narrowing bridge while the open sluice strengthens every attacker below.', effects: [{ type: 'flag', operation: 'add', flagId: 'pell-witness-protected' }, { type: 'threat', amount: 1 }], outcome: 'The witness reaches the far bank as weighted nets slap across the boards behind him.' },
    ],
  }),
  defineScene({
    id: 'ch04-combat-fire-in-the-north-warehouse', chapterId: 'ch04', region: 'drowned-road', slot: 23,
    type: 'combat', family: 'warehouse-arson-crew', weight: 95, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch04-warehouse-arsonists', illustrationId: 'scene-ch04-combat-fire-in-the-north-warehouse',
    title: 'Fire in the North Warehouse',
    narrative: [
      'Smugglers in river masks overturn oil jars inside the north warehouse while two crossbowmen guard the freight office. Flames climb toward records stacked along the rafters.',
      'The loading doors can vent smoke and create an escape route, but opening them also gives the arson crew a clear path to the pier.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-open-the-loading-doors', label: 'Open the loading doors', detail: 'Clear smoke for trapped workers while giving armed smugglers a direct route toward their boats.', effects: [{ type: 'flag', operation: 'add', flagId: 'warehouse-workers-evacuated' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Workers crawl into clean air as the arson crew turns toward the suddenly open pier.' },
      { id: 'ch04-choice-seize-the-freight-office', label: 'Seize the freight office', detail: 'Protect shipment records behind the crossbow line while smoke traps workers deeper inside.', effects: [{ type: 'flag', operation: 'add', flagId: 'warehouse-records-saved' }, { type: 'evidence', operation: 'add', evidenceId: 'north-warehouse-manifests' }], outcome: 'The office door holds against the flames long enough to drag its iron document chest into the yard.' },
    ],
  }),
  defineScene({
    id: 'ch04-combat-the-south-tower-provocateurs', chapterId: 'ch04', region: 'drowned-road', slot: 28,
    type: 'combat', family: 'south-tower-provocateurs', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch04-south-tower-provocateurs', illustrationId: 'scene-ch04-combat-the-south-tower-provocateurs',
    title: 'The South-Tower Provocateurs',
    narrative: [
      'Inside the south tower, a horn team wears Greywatch signal coats over black quilted armor. Archers on the roof fire Free Host arrows toward Redwater\'s grain sheds.',
      'The horn caller is preparing a second charge signal while the roof captain reaches for a basket of pitch arrows. Either act could move an army before the other is stopped.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-take-the-horn-room-first', label: 'Take the horn room first', detail: 'Prevent a second false charge signal while pitch arrows continue toward civilian stores.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-tower-horn-silenced' }], outcome: 'The horn caller falls across the signal chart before the second note reaches the Greywatch line.' },
      { id: 'ch04-choice-climb-to-the-pitch-archers', label: 'Climb to the pitch archers', detail: 'Protect the grain sheds from fire while the horn team keeps calling soldiers forward.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-tower-pitch-stopped' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'You reach the roof before the next basket is lit, but the tower stones shake with another horn call below.' },
    ],
  }),
  defineScene({
    id: 'ch04-combat-war-oxen-in-the-grain-lane', chapterId: 'ch04', region: 'drowned-road', slot: 35,
    type: 'combat', family: 'panicked-war-oxen', weight: 75, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch04-panicked-war-oxen', illustrationId: 'scene-ch04-combat-war-oxen-in-the-grain-lane',
    title: 'War Oxen in the Grain Lane',
    narrative: [
      'Handlers cut loose six armored oxen between the withdrawing lines, then strike the animals with fire pots. The panicked team charges toward the hospital wagons and the crowded market gate.',
      'Breaking the lead yoke may scatter the animals through the camp. Holding the lane keeps them together but forces your party to meet the full charge.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-break-the-lead-ox-yoke', label: 'Break the lead ox yoke', detail: 'Disrupt the charge before the gate while sending frightened armored animals through nearby tents.', effects: [{ type: 'flag', operation: 'add', flagId: 'war-oxen-yoke-broken' }, { type: 'tension', amount: 1 }], outcome: 'The lead pair separates and the charge bends away from the gate into abandoned supply tents.' },
      { id: 'ch04-choice-hold-the-grain-lane', label: 'Hold the grain lane', detail: 'Face the intact team at the narrowest point and keep every hospital wagon behind your line.', effects: [{ type: 'flag', operation: 'add', flagId: 'hospital-wagons-protected' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The lane walls keep the team straight while your party braces between the horns and the first wagon.' },
    ],
  }),
  defineScene({
    id: 'ch04-combat-rearguard-on-the-north-road', chapterId: 'ch04', region: 'drowned-road', slot: 42,
    type: 'combat', family: 'ember-freight-rearguard', weight: 95, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch04-north-road-rearguard', illustrationId: 'scene-ch04-combat-rearguard-on-the-north-road',
    title: 'Rearguard on the North Road',
    narrative: [
      'A freight wagon races north from the river pier under guard by disciplined mercenaries with every badge filed away. The rear cart carries oil jars meant to burn the roadbook and shipment tube if stopped.',
      'The wagon team can be cut off at the quarry bend, or the oil cart can be separated before its driver lights the fuse.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: ['ch04-main-what-the-river-carried-away'], callbackPromises: [], choices: [
      { id: 'ch04-choice-ride-for-the-quarry-bend', label: 'Ride for the quarry bend', detail: 'Trap the lead freight wagon on narrow ground while leaving the oil cart free behind you.', effects: [{ type: 'flag', operation: 'add', flagId: 'ember-freight-wagon-stopped' }], outcome: 'The lead wagon overturns at the bend, spilling foundry tools and sealed Redwater pay packets.' },
      { id: 'ch04-choice-separate-the-oil-cart', label: 'Separate the oil cart', detail: 'Protect the surviving evidence from fire while allowing the lead freight wagon to gain distance.', effects: [{ type: 'flag', operation: 'add', flagId: 'ember-evidence-protected-from-fire' }, { type: 'evidence', operation: 'add', evidenceId: 'ember-seven-freight-tube' }], outcome: 'The oil cart rolls into the ditch unlit, leaving its driver and guards between you and the fleeing wagon.' },
    ],
  }),
]);
