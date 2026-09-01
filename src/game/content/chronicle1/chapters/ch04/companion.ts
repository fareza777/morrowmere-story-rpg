import { defineScene } from '../../builders';

export const CH04_COMPANION = Object.freeze([
  defineScene({
    id: 'ch04-companion-camps-of-two-fires', chapterId: 'ch04', region: 'drowned-road', slot: 4,
    type: 'companion', family: 'divided-camps', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 75, pacing: 'quiet', illustrationId: 'scene-ch04-companion-camps-of-two-fires',
    title: 'Camps of Two Fires',
    narrative: [
      'Rukhar walks the ground between Redwater\'s two army camps. Greywatch cooks feed displaced human farmers; Free Host kettles feed orc laborers from the same flooded villages.',
      'A neutral meal line would expose how much the camps share, but officers on both sides fear that soldiers eating together will be accused of weakness.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-open-a-neutral-meal-line', label: 'Open a neutral meal line', detail: 'Combine spare food under town supervision and accept criticism from both military camps.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-neutral-meals' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 4 }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: -1 }], outcome: 'Holt\'s clerks serve by household size, and soldiers from both banks queue behind the same displaced families.' },
      { id: 'ch04-choice-keep-the-camp-kitchens-separate', label: 'Keep the camp kitchens separate', detail: 'Preserve military order while sending civilian portions through two unequal ration lines.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-separate-rations' }, { type: 'faction', factionId: 'greywatch', amount: 1 }, { type: 'faction', factionId: 'free-host', amount: 1 }], outcome: 'Both camps keep discipline, but the smaller Free Host kitchen runs out before the evening watch.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-rukhar-at-the-parley', chapterId: 'ch04', region: 'drowned-road', slot: 8,
    type: 'companion', family: 'parley-witness', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 85, pacing: 'quiet', illustrationId: 'scene-ch04-companion-rukhar-at-the-parley',
    title: 'Rukhar at the Parley',
    narrative: [
      'A Free Host elder challenges Rukhar for showing human officers their patrol orders. The elder has lost a nephew at the millrace and calls shared evidence a surrender of the dead.',
      'Rukhar can answer with Kesh\'s testimony, but doing so makes the spared courier a public target. He can instead stake only his own command on the claim.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-shield-kesh-behind-custody-records', label: 'Shield Kesh behind custody records', detail: 'Use the documented evidence without naming the courier and leave Rukhar personally exposed.', effects: [{ type: 'flag', operation: 'add', flagId: 'kesh-identity-protected' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 5 }, { type: 'faction', factionId: 'free-host', amount: -1 }], outcome: 'Rukhar accepts the elder\'s formal censure and keeps Kesh\'s name outside the camp debate.' },
      { id: 'ch04-choice-let-kesh-address-the-elder', label: 'Let Kesh address the elder', detail: 'Give the witness control of his account while revealing him to hostile officers in both camps.', effects: [{ type: 'flag', operation: 'add', flagId: 'kesh-spoke-at-parley' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Kesh names the false relay phrase himself, then leaves the awning under a doubled neutral guard.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-caldus-in-the-field-hospital', chapterId: 'ch04', region: 'drowned-road', slot: 11,
    type: 'companion', family: 'field-hospital', relationship: { kind: 'companion', companionId: 'caldus' },
    weight: 70, pacing: 'recovery', illustrationId: 'scene-ch04-companion-caldus-in-the-field-hospital',
    title: 'Caldus in the Field Hospital',
    narrative: [
      'Brother Caldus has come from Greywatch with a relief cart. He turns Redwater\'s wool hall into a field hospital with beds assigned by injury rather than uniform. Greywatch surgeons object when wounded Free Host scouts arrive first.',
      'The hall has enough clean water for surgery or the fever ward, not both. Caldus asks you to make the ration public so no officer can quietly reverse it.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-reserve-water-for-surgery', label: 'Reserve water for surgery', detail: 'Prioritize immediate wounds from the standoff while fever patients wait for another boiled supply.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-surgery-water' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 3 }, { type: 'vitals', health: 7 }], outcome: 'Caldus posts the ration at both doors and treats the worst wounds without asking which line they came from.' },
      { id: 'ch04-choice-reserve-water-for-fever-ward', label: 'Reserve water for the fever ward', detail: 'Protect dozens of civilians from infection while surgeons work with smaller cleaned instruments.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-fever-water' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 5 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The fever ward receives the kettles, and Caldus reorganizes surgery around the remaining sealed jars.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-stop-the-retaliation', chapterId: 'ch04', region: 'drowned-road', slot: 16,
    type: 'companion', family: 'retaliation-road', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 100, pacing: 'danger', illustrationId: 'scene-ch04-companion-stop-the-retaliation',
    title: 'Stop the Retaliation',
    narrative: [
      'News of Aven Pell\'s body reaches a Free Host war band as a false report that human scouts killed two orc children. The fighters turn toward the human hamlet of Lowbank before Brakka can recall them.',
      'Rukhar asks you to stand with him on the narrow cattle road. The war band includes grieving relatives, but two masked riders at its rear keep shouting details no witness could know.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-companion-the-cost-of-peace'], callbackPromises: [], choices: [
      { id: 'ch04-choice-stand-between-war-band-and-hamlet', label: 'Stand between the war band and hamlet', detail: 'Risk a fight beside Rukhar to block retaliation while the masked riders try to provoke bloodshed.', effects: [{ type: 'flag', operation: 'add', flagId: 'retaliation-prevented' }, { type: 'flag', operation: 'add', flagId: 'lowbank-hamlet-protected' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 8 }, { type: 'tension', amount: -2 }, { type: 'callback', promise: { targetEventId: 'ch04-companion-the-cost-of-peace', deadline: { chapterId: 'ch04', slot: 32 } } }], outcome: 'Rukhar names the dead children as living evacuees, and the war band turns on the masked riders instead of Lowbank.' },
      { id: 'ch04-choice-let-the-war-band-pass', label: 'Let the war band pass', detail: 'Avoid fighting Free Host troops and race ahead to evacuate only the hamlet residents.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-betrayed' }, { type: 'flag', operation: 'add', flagId: 'lowbank-evacuated-under-attack' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: -12 }, { type: 'tension', amount: 3 }, { type: 'callback', promise: { targetEventId: 'ch04-companion-the-cost-of-peace', deadline: { chapterId: 'ch04', slot: 32 } } }], outcome: 'Most families escape, but Lowbank burns behind them and Rukhar stays on the road alone to face his own fighters.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-mara-rukhar-common-ground', chapterId: 'ch04', region: 'drowned-road', slot: 18,
    type: 'companion', family: 'scout-reconciliation', relationship: { kind: 'companion', companionId: 'mara' },
    weight: 80, pacing: 'quiet', illustrationId: 'scene-ch04-companion-mara-rukhar-common-ground',
    title: 'Mara and Rukhar Find Common Ground',
    narrative: [
      'Mara and Rukhar return from a joint reconnaissance with one prisoner from the south tower and a map of safe civilian lanes. Mara admits Rukhar\'s west-bank warnings kept the scouts alive.',
      'Rukhar admits Mara was right to watch the tower. Their commanders now want separate custody of the prisoner, which could undo the trust their scouts earned.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-keep-the-prisoner-with-joint-scouts', label: 'Keep the prisoner with joint scouts', detail: 'Protect shared custody while angering both commanders over a suspect held outside rank.', effects: [{ type: 'flag', operation: 'add', flagId: 'mara-rukhar-conflict-resolved' }, { type: 'companion-loyalty', companionId: 'mara', amount: 6 }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 4 }], outcome: 'Mara and Rukhar sign the same watch log and post one scout from each side at the cell.' },
      { id: 'ch04-choice-give-the-prisoner-to-holt', label: 'Give the prisoner to Holt', detail: 'Use civilian custody to avoid choosing a command, but separate the suspect from the scouts who caught him.', effects: [{ type: 'flag', operation: 'add', flagId: 'tower-prisoner-in-town-custody' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'companion-loyalty', companionId: 'mara', amount: 3 }], outcome: 'Holt accepts the prisoner with the joint watch log, preserving the facts without making either army jailer.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-lyra-finds-the-second-hand', chapterId: 'ch04', region: 'drowned-road', slot: 21,
    type: 'companion', family: 'forged-orders', relationship: { kind: 'companion', companionId: 'lyra' },
    weight: 80, pacing: 'quiet', illustrationId: 'scene-ch04-companion-lyra-finds-the-second-hand',
    title: 'Lyra Finds the Second Hand',
    narrative: [
      'Lyra separates the language of the planted orders from the writing itself. A trained clerk copied the command phrases, but a second person inserted the patrol times with a blunter pen.',
      'The inserted numbers match Embervault freight notation. Lyra can announce the origin now or keep it quiet while the north warehouse is searched.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-keep-the-freight-notation-quiet', label: 'Keep the freight notation quiet', detail: 'Protect the warehouse search from warning while asking Lyra to trust a smaller evidence circle.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-notation-withheld' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 5 }, { type: 'threat', amount: -1 }], outcome: 'Lyra seals her comparison with Holt and waits until the warehouse doors are under guard.' },
      { id: 'ch04-choice-announce-the-embervault-notation', label: 'Announce the Embervault notation', detail: 'Strengthen the public case with a clear outside origin and risk sending the network advance warning.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'embervault-notation-sample' }, { type: 'flag', operation: 'add', flagId: 'embervault-origin-announced' }, { type: 'threat', amount: 1 }], outcome: 'Quartermasters from both armies recognize the numbering as foundry freight notation rather than field command code.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-talla-between-the-lines', chapterId: 'ch04', region: 'drowned-road', slot: 26,
    type: 'companion', family: 'goblin-messengers', relationship: { kind: 'companion', companionId: 'talla' },
    weight: 70, pacing: 'quiet', illustrationId: 'scene-ch04-companion-talla-between-the-lines',
    title: 'Talla Between the Lines',
    narrative: [
      'Goblin scout Talla Quickhand reaches Redwater through the covered market. She recruits local chimney sweeps to carry stand-fast notices through alleys no mounted runner can reach. Roake objects to using children near a military line.',
      'The sweeps know every roof and insist they already live inside the danger. Adult soldiers can carry the notices more formally, but not before the next signal horn.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-send-paired-adult-runners', label: 'Send paired adult runners', detail: 'Keep children away from the lines while accepting slower delivery through guarded streets.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-adult-runners' }, { type: 'companion-loyalty', companionId: 'talla', amount: 3 }, { type: 'tension', amount: 1 }], outcome: 'Human and orc runners leave in pairs, and several pickets receive the notice only moments before the horn.' },
      { id: 'ch04-choice-use-tallas-rooftop-network', label: 'Use Talla\'s rooftop network', detail: 'Deliver the stand-fast order quickly while trusting local youths in a dangerous public role.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-rooftop-messages' }, { type: 'companion-loyalty', companionId: 'talla', amount: 6 }, { type: 'tension', amount: -1 }], outcome: 'The sweeps cross the roofs in minutes and return by the covered market before either army advances.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-the-cost-of-peace', chapterId: 'ch04', region: 'drowned-road', slot: 30,
    type: 'companion', family: 'peace-political-cost', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 100, pacing: 'quiet', illustrationId: 'scene-ch04-companion-the-cost-of-peace',
    title: 'The Cost of Peace',
    narrative: [
      'The captured south-tower leader is a Greywatch veteran with friends in Roake\'s command. Rukhar will support a joint settlement only if the prisoner and the full Lowbank report go to civilian custody.',
      'Agreeing means publicly admitting that Greywatch men helped provoke the crisis and surrendering a human suspect to Redwater. Refusing protects your standing with officers who may be needed later.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch04-companion-stonehand-joins-the-road'], callbackPromises: [], choices: [
      { id: 'ch04-choice-accept-the-human-political-cost', label: 'Accept the human political cost', detail: 'Publish the Lowbank report and place the Greywatch veteran beyond his comrades\' protection.', effects: [{ type: 'flag', operation: 'add', flagId: 'political-cost-accepted' }, { type: 'flag', operation: 'add', flagId: 'tower-leader-in-civilian-custody' }, { type: 'faction', factionId: 'greywatch', amount: -6 }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 15 }, { type: 'companion-quest', companionId: 'rukhar', stage: 3 }], outcome: 'You sign the report before both commands. Holt takes the prisoner, and several Greywatch officers remove your name from their invitation list.' },
      { id: 'ch04-choice-keep-the-prisoner-with-greywatch', label: 'Keep the prisoner with Greywatch', detail: 'Preserve military cooperation while asking Rukhar to trust an internal inquiry he cannot observe.', effects: [{ type: 'flag', operation: 'add', flagId: 'tower-leader-returned-to-greywatch' }, { type: 'faction', factionId: 'greywatch', amount: 4 }, { type: 'companion-loyalty', companionId: 'rukhar', amount: -8 }, { type: 'companion-quest', companionId: 'rukhar', stage: 3 }], outcome: 'Roake promises a court hearing, but Rukhar says peace cannot rest on the accused choosing his own jailer.' },
    ],
  }),
  defineScene({
    id: 'ch04-companion-stonehand-joins-the-road', chapterId: 'ch04', region: 'drowned-road', slot: 33,
    type: 'companion', family: 'stonehand-recruitment', relationship: { kind: 'companion', companionId: 'rukhar' },
    weight: 100, pacing: 'quiet', illustrationId: 'scene-ch04-companion-stonehand-joins-the-road',
    title: 'Stonehand Joins the Road',
    narrative: [
      'After the custody transfer, Rukhar lays his command token on Brakka\'s field table. He has delayed retaliation, protected a witness, and accepted censure from his own elders; now the trail leads beyond his army.',
      'He offers to join your pursuit as an equal voice for the Free Host, not as a trophy of the Redwater settlement. Brakka will instead keep him as a treaty captain if you decline.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8, requiredFlags: ['rukhar-met', 'orc-courier-spared', 'retaliation-prevented', 'peace-evidence-carried', 'political-cost-accepted'], excludedFlags: ['rukhar-betrayed'] },
    requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-invite-rukhar-as-an-equal', label: 'Invite Rukhar as an equal', detail: 'Add a strong companion and Free Host witness while accepting suspicion from hostile human officers.', effects: [{ type: 'companion', companionId: 'rukhar', operation: 'recruit' }, { type: 'flag', operation: 'add', flagId: 'rukhar-joined-the-road' }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'Rukhar takes up his worn shield and joins the party with Brakka\'s written authority to pursue the network.' },
      { id: 'ch04-choice-ask-rukhar-to-guard-the-treaty', label: 'Ask Rukhar to guard the treaty', detail: 'Leave a trusted officer at Redwater and continue without his strength on the Embervault road.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-guards-redwater-treaty' }, { type: 'faction', factionId: 'free-host', amount: 4 }, { type: 'tension', amount: -1 }], outcome: 'Rukhar remains beside Brakka and Holt, promising that no forged order will move the Free Host again.' },
    ],
  }),
]);
