import { defineScene } from '../../builders';

export const CH07_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch07-journey-the-road-out-of-greywatch', chapterId: 'ch07', region: 'crownless-keep', slot: 2,
    type: 'journey', family: 'post-siege-departure', journeySubtype: 'travel', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-the-road-out-of-greywatch', title: 'The Road Out of Greywatch',
    narrative: [
      'The march leaves Greywatch past burned carts and fresh casualty markers. Families line the road to ask whether the remaining defenders are being abandoned for Crownless Keep.',
      'A public departure account may steady them but reveals troop strength. Leaving before dawn protects the column and lets rumor explain the movement.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-read-the-march-purpose-publicly', label: 'Read the march purpose publicly', detail: 'Explain the evidence and destination while giving enemy observers an accurate count of the column.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-march-purpose-public' }, { type: 'faction', factionId: 'greywatch', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Hale names Crownless Keep, the Emergency Compact, and the defenders remaining behind before the column moves.' },
      { id: 'ch07-choice-leave-before-the-road-crowds', label: 'Leave before the road crowds', detail: 'Protect the march order and evidence wagons while denying anxious families a direct explanation.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-march-left-quietly' }, { type: 'threat', amount: -1 }, { type: 'tension', amount: 1 }], outcome: 'The evidence wagons clear the northern markers before sunrise with only the road watch observing them.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-bridge-of-broken-wagons', chapterId: 'ch07', region: 'crownless-keep', slot: 6,
    type: 'journey', family: 'march-bridge', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-bridge-of-broken-wagons', title: 'The Bridge of Broken Wagons',
    narrative: [
      'Voss\'s retreating supply train has jammed a stone bridge with overturned wagons. The river gorge leaves no nearby ford, and oil-soaked axle straw waits beneath the wrecks.',
      'Clearing the bridge preserves the coalition road but risks fire. A steep mule track bypasses the span and cannot carry the heavy archive wagon.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-clear-the-oil-soaked-wrecks', label: 'Clear the oil-soaked wrecks', detail: 'Keep the evidence wagon on the main road while working beneath a bridge prepared to burn.', effects: [{ type: 'flag', operation: 'add', flagId: 'crownless-bridge-cleared' }, { type: 'threat', amount: 2 }], outcome: 'The last wagon rolls aside before a hidden fuse reaches the axle straw.' },
      { id: 'ch07-choice-take-copies-up-the-mule-track', label: 'Take copies up the mule track', detail: 'Move the vanguard quickly with copied proof while leaving the original archive behind under guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-archive-delayed' }, { type: 'vitals', health: -2 }, { type: 'threat', amount: -1 }], outcome: 'The vanguard reaches the ridge by dusk while Hale remains below with the archive wagon.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-hales-missing-scouts', chapterId: 'ch07', region: 'crownless-keep', slot: 8,
    type: 'journey', family: 'missing-march-scouts', journeySubtype: 'side-quest', weight: 70, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-hales-missing-scouts', title: 'Hale\'s Missing Scouts',
    narrative: [
      'Two of Bren Hale\'s scouts fail to return from a farm lane below the keep road. Their last marker points toward a threshing barn now occupied by Voss\'s foragers.',
      'A rescue may recover current patrol information. Keeping the march together protects the evidence before the foragers learn what the scouts saw.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-search-the-threshing-barn', label: 'Search the threshing barn', detail: 'Split a rescue party from the march and risk an ambush for two scouts and their fresh report.', effects: [{ type: 'flag', operation: 'add', flagId: 'hales-scouts-recovered' }, { type: 'evidence', operation: 'add', evidenceId: 'keep-patrol-sketch' }, { type: 'threat', amount: 1 }], outcome: 'Both scouts are found bound in the loft with a sketch of the keep\'s changed eastern patrol.' },
      { id: 'ch07-choice-keep-the-evidence-column-moving', label: 'Keep the evidence column moving', detail: 'Protect the march schedule while leaving local wardens to search for the missing scouts.', effects: [{ type: 'flag', operation: 'add', flagId: 'hales-scouts-left-to-wardens' }, { type: 'threat', amount: -1 }], outcome: 'Hale leaves the barn marked on a warden map and keeps the archive wagon inside the column.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-banners-through-empty-farms', chapterId: 'ch07', region: 'crownless-keep', slot: 10,
    type: 'journey', family: 'empty-farm-march', journeySubtype: 'travel', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-banners-through-empty-farms', title: 'Banners Through Empty Farms',
    narrative: [
      'The kingroad passes farms emptied by Voss\'s requisitions. Grain doors stand open, and notices promise repayment after the Protector restores order.',
      'The march can leave signed coalition chits for what it needs or carry only current rations and reach the keep hungry.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-leave-witnessed-supply-chits', label: 'Leave witnessed supply chits', detail: 'Take abandoned fodder under a public repayment record and accept another debt for the coalition.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-supplies-recorded' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'tension', amount: -1 }], outcome: 'Jory records every sack and nails a signed copy inside each emptied storehouse.' },
      { id: 'ch07-choice-march-on-current-rations', label: 'March on current rations', detail: 'Leave farm stores untouched while reaching the ridge with tired soldiers and hungry horses.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-rations-stretched' }, { type: 'vitals', resource: -3 }, { type: 'threat', amount: -1 }], outcome: 'The column clears the farms without taking grain and shortens the evening meal below the ridge.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-tokens-from-the-outer-patrol', chapterId: 'ch07', region: 'crownless-keep', slot: 14,
    type: 'journey', family: 'patrol-token-audit', journeySubtype: 'investigation', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-tokens-from-the-outer-patrol', title: 'Tokens from the Outer Patrol',
    narrative: [
      'The captured patrol carries meal tokens stamped for twice its actual strength. Half bear yesterday\'s date and the rest tomorrow\'s, suggesting a second unit is moving under the same identity.',
      'Following the duplicate tokens may reveal an ambush. Showing them to the prisoners could expose who knows the replacement unit.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-trace-the-duplicate-meal-tokens', label: 'Trace the duplicate meal tokens', detail: 'Search the supply lane for a hidden unit while leaving prisoners under a smaller escort.', effects: [{ type: 'flag', operation: 'add', flagId: 'duplicate-patrol-traced' }, { type: 'threat', amount: 2 }], outcome: 'The tokens lead to a concealed lancer camp positioned behind the march route.' },
      { id: 'ch07-choice-question-the-patrol-quartermaster', label: 'Question the patrol quartermaster', detail: 'Seek an immediate explanation while revealing exactly which logistical error exposed the scheme.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'keep-duplicate-patrol-roll' }, { type: 'flag', operation: 'add', flagId: 'patrol-quartermaster-testified' }], outcome: 'The quartermaster names the second unit and signs the order that gave both forces one patrol number.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-old-kingroad-switchback', chapterId: 'ch07', region: 'crownless-keep', slot: 17,
    type: 'journey', family: 'ridge-switchback', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-old-kingroad-switchback', title: 'The Old Kingroad Switchback',
    narrative: [
      'The climb toward Crownless Keep turns across a bare switchback overlooked by abandoned toll towers. Fresh stone dust marks firing rests cut into the upper wall.',
      'The column can cross quickly in compact ranks or spread along a goat path that avoids one killing ground and lengthens the climb.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-cross-the-switchback-in-ranks', label: 'Cross the switchback in ranks', detail: 'Move the whole column together beneath prepared towers and reduce time spent exposed.', effects: [{ type: 'flag', operation: 'add', flagId: 'switchback-crossed-in-ranks' }, { type: 'threat', amount: 2 }], outcome: 'The column clears the upper turn before defenders fully man the old firing rests.' },
      { id: 'ch07-choice-spread-along-the-goat-path', label: 'Spread along the goat path', detail: 'Avoid the toll towers while separating commands and delaying heavy carts below.', effects: [{ type: 'flag', operation: 'add', flagId: 'switchback-goat-path' }, { type: 'tension', amount: 1 }, { type: 'vitals', health: -2 }], outcome: 'Small groups reach the ridge unseen, but the archive wagon remains two turns behind.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-buried-compact-archive', chapterId: 'ch07', region: 'crownless-keep', slot: 18,
    type: 'journey', family: 'compact-road-archive', journeySubtype: 'dungeon', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-buried-compact-archive', title: 'The Buried Compact Archive',
    narrative: [
      'A collapsed toll archive beneath the ridge contains old Emergency Compact copies and governor succession rolls. Someone recently tunneled in to remove pages naming dissolved districts.',
      'The intact succession roll rests behind unstable masonry. A trapped keep clerk calls from a lower records pit filling with dust.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-rescue-the-trapped-record-clerk', label: 'Rescue the trapped record clerk', detail: 'Use the safe beams on a living witness while accepting that the succession shelf may collapse.', effects: [{ type: 'flag', operation: 'add', flagId: 'compact-clerk-rescued' }, { type: 'evidence', operation: 'add', evidenceId: 'compact-clerk-testimony' }, { type: 'vitals', health: -3 }], outcome: 'The clerk reaches daylight and names the officer who ordered three governor pages removed.' },
      { id: 'ch07-choice-brace-the-succession-shelf', label: 'Brace the succession shelf', detail: 'Recover the lawful district roll while leaving the trapped clerk longer beneath unstable stone.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'lawful-governor-roll' }, { type: 'threat', amount: 1 }], outcome: 'The shelf comes free with every valid district listed and three false delegates plainly excluded.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-closed-governors-carriage', chapterId: 'ch07', region: 'crownless-keep', slot: 21,
    type: 'journey', family: 'compelled-governor-rescue', journeySubtype: 'side-quest', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-closed-governors-carriage', title: 'The Closed Governor\'s Carriage',
    narrative: [
      'A barred carriage waits below the keep under six veteran guards. Inside, Governor Maelin Rusk and her clerk say their grain district will lose winter deliveries unless she votes for Voss.',
      'Freeing them provides a public witness. Marking the carriage and following it may lead to other compelled guests still hidden on the road.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-free-governor-rusk-now', label: 'Free Governor Rusk now', detail: 'Gain a willing witness immediately while alerting the keep that its compelled guest is missing.', effects: [{ type: 'flag', operation: 'add', flagId: 'governor-rusk-freed' }, { type: 'evidence', operation: 'add', evidenceId: 'grain-coercion-testimony' }, { type: 'threat', amount: 2 }], outcome: 'Rusk steps from the carriage with her threat letter and agrees to read it before the hall.' },
      { id: 'ch07-choice-follow-the-carriage-route', label: 'Follow the carriage route', detail: 'Delay the rescue to locate other coerced guests and risk the carriage reaching the closed gate.', effects: [{ type: 'flag', operation: 'add', flagId: 'compelled-guest-route-found' }, { type: 'threat', amount: 1 }], outcome: 'The carriage joins two others at a screened holding yard below the eastern wall.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-grain-for-the-march', chapterId: 'ch07', region: 'crownless-keep', slot: 23,
    type: 'journey', family: 'march-requisition', journeySubtype: 'moral-choice', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-grain-for-the-march', title: 'Grain for the March',
    narrative: [
      'A village store holds enough grain to feed the march for two days and its residents for three weeks. Voss\'s requisition order already claims half for the keep.',
      'Taking a measured share may decide the assault. Leaving it all protects civilians who have no guarantee either force will return supplies.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-take-a-measured-march-share', label: 'Take a measured march share', detail: 'Feed the coalition and leave witnessed payment while reducing the village\'s winter reserve.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-grain-requisitioned' }, { type: 'faction', factionId: 'border-council', amount: -1 }, { type: 'vitals', resource: 5 }], outcome: 'Jory weighs every sack and leaves a repayment bond signed by each attending command.' },
      { id: 'ch07-choice-leave-the-village-grain', label: 'Leave the village grain', detail: 'Protect civilian reserves while sending tired soldiers into the keep approach on short rations.', effects: [{ type: 'flag', operation: 'add', flagId: 'village-grain-protected' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'vitals', resource: -2 }], outcome: 'The store remains sealed for the village, and the column divides its last hard bread at dusk.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-prisoners-beside-the-road', chapterId: 'ch07', region: 'crownless-keep', slot: 24,
    type: 'journey', family: 'patrol-prisoner-custody', journeySubtype: 'moral-choice', weight: 70, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-prisoners-beside-the-road', title: 'Prisoners Beside the Road',
    narrative: [
      'The march now holds eleven patrol prisoners, including three conscripts whose families live inside Crownless Keep. Guards demand ropes after one escape attempt.',
      'Paroling the conscripts reduces the custody burden and risks warning defenders. Binding everyone together protects the march and treats coerced recruits like committed officers.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-parole-the-three-conscripts', label: 'Parole the three conscripts', detail: 'Release coerced soldiers under signed terms and accept that they know the march composition.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-conscripts-paroled' }, { type: 'tension', amount: -1 }, { type: 'threat', amount: 1 }], outcome: 'The conscripts sign their names, surrender badges, and take a farm track away from the keep.' },
      { id: 'ch07-choice-bind-the-patrol-together', label: 'Bind the patrol together', detail: 'Prevent another escape while increasing resentment among families inside the keep.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-patrol-bound' }, { type: 'threat', amount: -1 }, { type: 'faction', factionId: 'border-council', amount: -1 }], outcome: 'The prisoners continue under one rope as the column passes their home valley.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-beneath-the-keep-ridge', chapterId: 'ch07', region: 'crownless-keep', slot: 28,
    type: 'journey', family: 'ridge-shadow-route', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-beneath-the-keep-ridge', title: 'Beneath the Keep Ridge',
    narrative: [
      'The lower road hugs the ridge beneath loose shale and keep signal posts. A covered quarry lane offers concealment but ends at a winched ore lift controlled from above.',
      'The open road is longer and visible. The quarry route is faster if the lift remains unused by defenders.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-use-the-covered-quarry-lane', label: 'Use the covered quarry lane', detail: 'Approach unseen beneath the ridge while trusting an ore lift that defenders can drop or block.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-quarry-lane-used' }, { type: 'threat', amount: 1 }], outcome: 'The vanguard reaches the ore lift before the upper signal post notices movement below.' },
      { id: 'ch07-choice-stay-on-the-open-lower-road', label: 'Stay on the open lower road', detail: 'Keep the column together on reliable ground while allowing the keep to count every banner.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-open-road-approach' }, { type: 'threat', amount: 2 }], outcome: 'The full column reaches the western field as keep bells begin counting its strength.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-dry-aqueduct', chapterId: 'ch07', region: 'crownless-keep', slot: 29,
    type: 'journey', family: 'keep-aqueduct', journeySubtype: 'dungeon', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-dry-aqueduct', title: 'The Dry Aqueduct',
    narrative: [
      'An inspection grate opens into the dry aqueduct beneath the eastern wall. Collapsed screens, old maintenance chains, and fresh boot marks make the tunnel useful but contested.',
      'One branch reaches the lower ward; another climbs toward the command cistern where keep defenders store alarm oil.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-follow-the-lower-ward-channel', label: 'Follow the lower-ward channel', detail: 'Preserve a direct infiltration route while leaving the alarm-oil store intact above.', effects: [{ type: 'flag', operation: 'add', flagId: 'aqueduct-lower-ward-route' }, { type: 'threat', amount: 1 }], outcome: 'The channel ends behind a service screen within sight of the customs court.' },
      { id: 'ch07-choice-climb-to-the-command-cistern', label: 'Climb to the command cistern', detail: 'Disable alarm supplies while risking discovery on a narrow iron maintenance ladder.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-alarm-oil-disabled' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: 2 }], outcome: 'The party drains the alarm oil into a sand sump before the cistern watch arrives.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-names-on-the-gate-roster', chapterId: 'ch07', region: 'crownless-keep', slot: 32,
    type: 'journey', family: 'gate-roster-audit', journeySubtype: 'investigation', weight: 85, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-names-on-the-gate-roster', title: 'Names on the Gate Roster',
    narrative: [
      'A stolen gate roster lists every guard family housed inside the keep and marks twelve dependents as surety for continued service. Several veterans are fighting because Voss controls those rooms.',
      'Publishing the names may split the defense and endanger the families. Sending a quiet extraction team protects them but delays the upper assault.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-send-the-roster-to-defenders', label: 'Send the roster to defenders', detail: 'Expose the hostage arrangement publicly and risk guards believing the list threatens their families.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'keep-family-surety-roster' }, { type: 'flag', operation: 'add', flagId: 'keep-defenders-warned' }, { type: 'tension', amount: -1 }], outcome: 'Copies cross the wall by arrow, and several guard files stop answering their officers.' },
      { id: 'ch07-choice-send-an-extraction-team', label: 'Send an extraction team', detail: 'Protect the named families quietly while reducing the force available at the gate.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-families-extracted' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Town wardens reach the family rooms through a laundry stair and lead the first households out.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-upper-ward-causeway', chapterId: 'ch07', region: 'crownless-keep', slot: 35,
    type: 'journey', family: 'upper-ward-causeway', journeySubtype: 'travel', weight: 85, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-upper-ward-causeway', title: 'The Upper-Ward Causeway',
    narrative: [
      'A narrow stone causeway joins the customs court to the upper keep. Defenders have removed its railings and hung weighted shutters above the midpoint.',
      'Crossing under shields protects people but not the evidence cases. Running small teams moves proof quickly and leaves each group without support.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-cross-under-a-shield-roof', label: 'Cross under a shield roof', detail: 'Move witnesses together while heavy shutters threaten the unprotected evidence wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'upper-causeway-shield-roof' }, { type: 'threat', amount: 1 }], outcome: 'The shield roof reaches the midpoint as the first weighted shutter slams across the stones.' },
      { id: 'ch07-choice-run-the-evidence-in-small-teams', label: 'Run the evidence in small teams', detail: 'Carry records between shutter drops while separating witnesses from their assigned cases.', effects: [{ type: 'flag', operation: 'add', flagId: 'upper-causeway-evidence-runners' }, { type: 'vitals', health: -2 }, { type: 'threat', amount: 1 }], outcome: 'Each case reaches the upper arch in a separate sprint with its custody strip intact.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-record-clerks-cell', chapterId: 'ch07', region: 'crownless-keep', slot: 37,
    type: 'journey', family: 'record-clerk-rescue', journeySubtype: 'side-quest', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch07-journey-the-record-clerks-cell', title: 'The Record Clerks\' Cell',
    narrative: [
      'Six compact clerks are locked beneath the upper records room after refusing to certify copied seals. They can identify which entries Voss changed and which governors never arrived.',
      'Opening the cell creates more witnesses to protect. Taking only their written refusal keeps the party smaller and leaves them behind keep lines.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-free-all-six-record-clerks', label: 'Free all six record clerks', detail: 'Gain living witnesses and accept responsibility for escorting them through the upper ward.', effects: [{ type: 'flag', operation: 'add', flagId: 'compact-clerks-freed' }, { type: 'evidence', operation: 'add', evidenceId: 'compact-clerk-affidavits' }, { type: 'threat', amount: 1 }], outcome: 'The clerks leave together carrying the correction ledger they hid beneath the cell bench.' },
      { id: 'ch07-choice-take-the-clerks-refusal-ledger', label: 'Take the clerks\' refusal ledger', detail: 'Preserve their written objection while leaving the prisoners locked away from the immediate battle.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'compact-refusal-ledger' }, { type: 'threat', amount: -1 }], outcome: 'The senior clerk passes out the signed ledger and marks the key room needed for a later rescue.' },
    ],
  }),
  defineScene({
    id: 'ch07-journey-the-wounded-on-both-stairs', chapterId: 'ch07', region: 'crownless-keep', slot: 38,
    type: 'journey', family: 'upper-stair-wounded', journeySubtype: 'moral-choice', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch07-journey-the-wounded-on-both-stairs', title: 'The Wounded on Both Stairs',
    narrative: [
      'Wounded march soldiers and keep veterans lie on opposite landings as the coronation bell begins. The party has enough carriers for one group before pressing upstairs.',
      'Keep veterans may know the hall defenses; your own soldiers carried the evidence through the gate. Treating either first will be seen by both sides.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch07-choice-carry-the-march-wounded-first', label: 'Carry the march wounded first', detail: 'Honor the soldiers who brought the evidence inside while leaving keep veterans under guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-wounded-carried' }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'vitals', health: 4 }], outcome: 'The carriers move your wounded into the customs office while keep veterans watch from the upper landing.' },
      { id: 'ch07-choice-carry-the-keep-veterans-first', label: 'Carry the keep veterans first', detail: 'Demonstrate fair custody and risk anger from soldiers who fought beside the archive wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-wounded-carried' }, { type: 'tension', amount: -1 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Two keep veterans reveal the hall\'s shutter controls after receiving the same bandages as the march.' },
    ],
  }),
]);
