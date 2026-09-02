import { defineScene } from '../../builders';

export const CH01_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch01-journey-jorys-waxed-tube', chapterId: 'ch01', region: 'gloamwood', slot: 25,
    type: 'journey', journeySubtype: 'investigation', family: 'dispatch-provenance', weight: 16, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-jorys-waxed-tube', title: 'Jory\'s Waxed Tube',
    narrative: [
      'Jory Fen checks the waxed dispatch tube at every mile marker. Its Northern Stores seal authorizes Route Seven and names Greywatch\'s quartermaster as the receiver.',
      'He can show you how the seal is authenticated, or he can copy the route code while the wagons keep moving.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [],
    cooldownRuns: 2, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-learn-the-seal-marks', label: 'Learn the seal marks', detail: 'Stop long enough to inspect the wax, but make yourself another person who can identify the dispatch.', effects: [{ type: 'flag', operation: 'add', flagId: 'dispatch-seal-learned' }], outcome: 'Jory shows you the split tower, clerk countermark, and the fine blue grit mixed into Northern Stores wax.' },
      { id: 'ch01-choice-copy-the-route-number', label: 'Copy the route number', detail: 'Record the code while walking, risking a rough copy but avoiding another delay on the open road.', effects: [{ type: 'flag', operation: 'add', flagId: 'route-seven-code-copied' }], outcome: 'You write Route Seven and the Greywatch receiving office inside the dry fold of your map.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-wagonwrights-mile', chapterId: 'ch01', region: 'gloamwood', slot: 6,
    type: 'journey', journeySubtype: 'travel', family: 'wagon-pressure', weight: 14, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-wagonwrights-mile', title: 'The Wagonwright\'s Mile',
    narrative: [
      'Deep ruts make the rear wagon lean toward a drainage ditch. The driver says the road was repaired last spring, but fresh stones have been pulled from the wheel track.',
      'A slower line follows the verge. The center track is faster if someone walks beside the wheel and keeps it from slipping.',
    ],
    eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-guide-the-wheel-by-hand', label: 'Guide the wheel by hand', detail: 'Walk beside the loaded wagon and risk a crushed foot to preserve the convoy\'s pace.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'wagon-kept-on-center-track' }], outcome: 'The wheel slides twice, but your shoulder keeps the wagon upright until the road levels.' },
      { id: 'ch01-choice-take-the-verge', label: 'Take the verge', detail: 'Lose time on softer ground, but reduce the chance of breaking a wheel before Greywatch.', effects: [{ type: 'tension', amount: 1 }, { type: 'flag', operation: 'add', flagId: 'wagon-used-verge' }], outcome: 'The convoy crawls along the grass and reaches firm stone with every wheel still straight.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-rain-on-chalk-hill', chapterId: 'ch01', region: 'gloamwood', slot: 12,
    type: 'journey', journeySubtype: 'travel', family: 'weather-pressure', weight: 13, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-rain-on-chalk-hill', title: 'Rain on Chalk Hill',
    narrative: [
      'Rain turns Chalk Hill white and slick beneath the wagon wheels. The eastern descent is short and steep; an old shepherd path circles the hill through wet grass.',
      'The drivers can chain the wheels for the descent or take the longer path before the light fades.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-chain-the-wheels', label: 'Chain the wheels', detail: 'Risk damaging the spokes on the steep road, but reach the next shelter before dusk.', effects: [{ type: 'flag', operation: 'add', flagId: 'chalk-hill-direct' }, { type: 'threat', amount: -1 }], outcome: 'The chains bite into chalk, and both wagons descend in a controlled shower of white mud.' },
      { id: 'ch01-choice-circle-on-the-shepherd-path', label: 'Circle on the shepherd path', detail: 'Protect the wheels on gentler ground, but travel after dark where sentries have less warning.', effects: [{ type: 'flag', operation: 'add', flagId: 'chalk-hill-circled' }, { type: 'threat', amount: 1 }], outcome: 'The wagons reach the lower road after sunset with clean axles and tired horses.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-shepherds-missing-mule', chapterId: 'ch01', region: 'gloamwood', slot: 13,
    type: 'journey', journeySubtype: 'side-quest', family: 'roadside-help', weight: 10, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-shepherds-missing-mule', title: 'The Shepherd\'s Missing Mule',
    narrative: [
      'An old shepherd blocks the verge with an empty halter. His medicine mule broke loose after armed riders crossed his field during the night.',
      'The animal\'s tracks lead toward a bramble hollow; the riders\' tracks continue north beside Route Seven.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-find-the-shepherds-mule', label: 'Find the shepherd\'s mule', detail: 'Delay the convoy to recover a family\'s livelihood, while the armed riders gain more distance.', effects: [{ type: 'flag', operation: 'add', flagId: 'shepherd-mule-returned' }, { type: 'faction', factionId: 'greywatch', amount: 1 }, { type: 'tension', amount: 1 }], outcome: 'You lead the frightened mule from the brambles with its medicine panniers still tied shut.' },
      { id: 'ch01-choice-follow-the-riders-tracks', label: 'Follow the riders\' tracks', detail: 'Keep pressure on the armed group, but leave the shepherd to search alone before nightfall.', effects: [{ type: 'flag', operation: 'add', flagId: 'night-riders-trailed' }, { type: 'threat', amount: -1 }], outcome: 'You mark three military horses moving north and leave the shepherd a direction for the bramble hollow.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-toll-collectors-widow', chapterId: 'ch01', region: 'gloamwood', slot: 14,
    type: 'journey', journeySubtype: 'moral-choice', family: 'civilian-cost', weight: 12, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-toll-collectors-widow', title: 'The Toll Collector\'s Widow',
    narrative: [
      'A woman waits beside the road with her husband\'s official coat folded over one arm. He failed to return from the tollhouse, and Greywatch has sent no search party.',
      'She asks to ride with the convoy. Taking her means moving a crate onto the exposed rear board; refusing leaves her alone on a road used by armed riders.',
    ],
    eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-give-the-widow-a-seat', label: 'Give the widow a seat', detail: 'Expose one supply crate to weather so she can reach the tollhouse under guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'toll-widow-escorted' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'The drivers cover the crate with oilcloth, and the widow climbs aboard without thanking anyone.' },
      { id: 'ch01-choice-send-her-back-to-dunmere', label: 'Send her back to Dunmere', detail: 'Protect the medicine load, but force her to travel the southern road without an escort.', effects: [{ type: 'flag', operation: 'add', flagId: 'toll-widow-turned-back' }, { type: 'tension', amount: -1 }], outcome: 'You give her food and a warning; she walks south wearing her husband\'s coat against the rain.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-abandoned-register', chapterId: 'ch01', region: 'gloamwood', slot: 36,
    type: 'journey', journeySubtype: 'investigation', family: 'checkpoint-evidence', weight: 18, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-abandoned-register', title: 'The Abandoned Register',
    narrative: [
      'Pages torn from the tollhouse register lie beneath a rain barrel. Most entries are ruined, but the last dry line records six empty army carts traveling south without a Greywatch escort.',
      'The clerk used a charcoal rubbing instead of ink. You can preserve the page or search the yard for the missing carts\' wheel pattern.',
    ],
    eligibility: { routes: ['kings-road', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-wrap-the-register-page', label: 'Wrap the register page', detail: 'Preserve the written record, but stop searching before rain erases the remaining tracks.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'tollhouse-register-page' }, { type: 'flag', operation: 'add', flagId: 'empty-carts-recorded' }], outcome: 'Jory seals the dry page beside his dispatch and reads the cart count back to you.' },
      { id: 'ch01-choice-cast-the-wheel-ruts', label: 'Cast the wheel ruts', detail: 'Use lamp wax on one clear track, but leave the fragile register page in the wet yard.', effects: [{ type: 'flag', operation: 'add', flagId: 'army-cart-rut-cast' }, { type: 'threat', amount: 1 }], outcome: 'The wax takes a clear impression of a broad military wheel fitted with one repaired iron band.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-tollhouse-cellar', chapterId: 'ch01', region: 'gloamwood', slot: 37,
    type: 'journey', journeySubtype: 'dungeon', family: 'sealed-cellar', weight: 8, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch01-journey-the-tollhouse-cellar', title: 'The Tollhouse Cellar',
    narrative: [
      'The cellar key opens a narrow stair beneath the tollhouse desk. Below, ration crates have been emptied and six Greywatch cloaks hang from pegs with their unit badges removed.',
      'A rear tunnel leads toward the orchard. Its roof is weak, and fresh footprints disappear beneath fallen chalk.',
    ],
    eligibility: { routes: ['kings-road', 'ruined-pass'], minLevel: 1, maxLevel: 2, requiredFlags: ['tollhouse-searched'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-search-the-uniform-crates', label: 'Search the uniform crates', detail: 'Stay in the unstable cellar to identify stolen kit, risking collapse and another ambush.', effects: [{ type: 'flag', operation: 'add', flagId: 'stolen-greywatch-cloaks-found' }, { type: 'vitals', health: -2 }], outcome: 'You recover a cut unit badge and a receipt for lamp oil bought under a false patrol name.' },
      { id: 'ch01-choice-collapse-the-rear-tunnel', label: 'Collapse the rear tunnel', detail: 'Block a hidden approach before leaving, but destroy tracks that might identify the thieves.', effects: [{ type: 'flag', operation: 'add', flagId: 'tollhouse-tunnel-collapsed' }, { type: 'threat', amount: -1 }], outcome: 'A support gives way under your strike, sealing the orchard tunnel behind a wall of chalk.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-tracks-beyond-the-orchard', chapterId: 'ch01', region: 'gloamwood', slot: 46,
    type: 'journey', journeySubtype: 'travel', family: 'route-reading', weight: 15, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-tracks-beyond-the-orchard', title: 'Tracks Beyond the Orchard',
    narrative: [
      'Two trails leave the orchard: boot prints follow the road toward the bridge, while small bare footprints cut west through a drainage channel. Neither trail belongs to the missing toll collector.',
      'The wagons can shadow only one route without losing the northern road before dusk.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-shadow-the-boot-trail', label: 'Shadow the boot trail', detail: 'Follow the larger armed group near the road, but leave the goblin-sized trail unexplained.', effects: [{ type: 'flag', operation: 'add', flagId: 'human-trail-followed' }, { type: 'threat', amount: 1 }], outcome: 'The boot prints keep military spacing until they scatter deliberately near the bridge road.' },
      { id: 'ch01-choice-check-the-drainage-channel', label: 'Check the drainage channel', detail: 'Risk soft ground to trace the smaller footprints, while the wagons wait without full cover.', effects: [{ type: 'flag', operation: 'add', flagId: 'courier-trail-followed' }, { type: 'tension', amount: 1 }], outcome: 'The small trail leads to a cut snare cord and a slate fragment marked with food quantities.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-royal-shaft-mark', chapterId: 'ch01', region: 'gloamwood', slot: 55,
    type: 'journey', journeySubtype: 'investigation', family: 'weapon-evidence', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-royal-shaft-mark', title: 'The Royal Shaft Mark',
    narrative: [
      'Jory turns the second arrow beneath clean light. A shallow crown notch near the head marks an old royal-armory batch, while the black-and-white feathers are recent replacements.',
      'Pulling the head preserves the notch for inspection. Keeping the whole arrow may retain fingerprints and binding thread, but it is harder to carry safely.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2, excludedFlags: ['split-fletched-arrow-secured'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch02-main-the-royal-fletching'], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-preserve-the-complete-arrow', label: 'Preserve the complete arrow', detail: 'Carry the awkward shaft intact, risking damage during travel but keeping every material clue.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'royal-arrow' }, { type: 'flag', operation: 'add', flagId: 'royal-arrow-intact' }], outcome: 'Jory wraps the full arrow between two split boards and ties it beneath the wagon bench.' },
      { id: 'ch01-choice-remove-the-marked-head', label: 'Remove the marked head', detail: 'Secure the armory mark in a small pouch, but sacrifice the replaced feathers and binding thread.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'royal-arrow' }, { type: 'flag', operation: 'add', flagId: 'royal-arrow-head-only' }], outcome: 'The head comes free with its crown notch clear, while the shaft splinters around the socket.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-field-surgery-road', chapterId: 'ch01', region: 'gloamwood', slot: 57,
    type: 'journey', journeySubtype: 'travel', family: 'wounded-convoy', weight: 14, pacing: 'recovery',
    illustrationId: 'scene-ch01-journey-the-field-surgery-road', title: 'The Field Surgery Road',
    narrative: [
      'The surviving driver steers while Jory presses cloth against the toll officer\'s wound. A shaded farm lane offers a smoother ride, but it bends away from Greywatch for half a mile.',
      'The direct road saves time and shakes every injured passenger against the wagon boards.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-take-the-shaded-farm-lane', label: 'Take the shaded farm lane', detail: 'Lose distance to protect the wounded from the rough road and give Jory time to bind them.', effects: [{ type: 'vitals', health: 3 }, { type: 'flag', operation: 'add', flagId: 'wounded-stabilized-on-road' }], outcome: 'The wagon rolls evenly beneath the trees, and the toll officer\'s breathing steadies.', nextSceneId: 'ch01-journey-the-millers-children', continueLabel: 'Follow the lane toward the watermill' },
      { id: 'ch01-choice-hold-the-direct-road', label: 'Hold the direct road', detail: 'Reach Greywatch sooner, but accept that the wounded will suffer on the broken stones.', effects: [{ type: 'threat', amount: -1 }, { type: 'flag', operation: 'add', flagId: 'direct-road-with-wounded' }], outcome: 'The convoy gains a mile while Jory braces the injured against each hard turn.', nextSceneId: 'ch01-journey-the-millers-children', continueLabel: 'Follow the smoke past the watermill' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-millers-children', chapterId: 'ch01', region: 'gloamwood', slot: 59,
    type: 'journey', journeySubtype: 'side-quest', family: 'civilian-rescue', weight: 11, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-millers-children', title: 'The Miller\'s Children',
    narrative: [
      'Two children wave from the upper floor of a watermill while smoke rises from the bridge ahead. Their father crossed the river that morning and has not returned.',
      'A narrow mill race reaches the far bank beneath the road. It may bypass the smoke, but the wagons cannot fit through it.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-bring-the-children-to-the-convoy', label: 'Bring the children to the convoy', detail: 'Add two civilians to an already crowded wagon, but keep them away from the burning bridge.', effects: [{ type: 'flag', operation: 'add', flagId: 'millers-children-escorted' }, { type: 'flag', operation: 'add', flagId: 'millers-cart-route-ready' }, { type: 'companion-loyalty', companionId: 'mara', amount: 3 }], outcome: 'The children climb beside the bandage crates. At the mill race, they recognize their father trapped beside a captured flour cart.', nextSceneId: 'ch01-living-millers-cart', continueLabel: 'Reach the trapped miller' },
      { id: 'ch01-choice-scout-through-the-mill-race', label: 'Scout through the mill race', detail: 'Leave the children locked inside while you inspect the bridge from cover beneath the road.', effects: [{ type: 'flag', operation: 'add', flagId: 'bridge-scouted-from-mill' }, { type: 'flag', operation: 'add', flagId: 'millers-cart-route-ready' }, { type: 'threat', amount: -1 }], outcome: 'The mill race brings you beneath the road, where raiders have pinned the children\'s father beside his captured flour cart.', nextSceneId: 'ch01-living-millers-cart', continueLabel: 'Study the raiders at the mill race' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-wagon-or-the-rope', chapterId: 'ch01', region: 'gloamwood', slot: 66,
    type: 'journey', journeySubtype: 'moral-choice', family: 'bridge-aftermath', weight: 15, pacing: 'danger',
    illustrationId: 'scene-ch01-journey-the-wagon-or-the-rope', title: 'The Wagon or the Rope',
    narrative: [
      'A burning support drops across the rear wagon\'s tow rope. Cutting it will save the horses and medicine cases already on the far bank, but the wagon holds villagers\' winter tools.',
      'Mara can hold the line while you drag the wagon free, though the raiders may regroup before the work is done.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-cut-the-burning-rope', label: 'Cut the burning rope', detail: 'Save the horses and medicine immediately, but abandon the villagers\' tools with the wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'bridge-wagon-abandoned' }, { type: 'threat', amount: -1 }], outcome: 'The rope parts, the horses reach firm ground, and the loaded wagon sinks through the burning planks.', nextSceneId: 'ch01-journey-the-ferrymans-rope', continueLabel: 'Follow the river road north' },
      { id: 'ch01-choice-drag-the-wagon-clear', label: 'Drag the wagon clear', detail: 'Risk another attack and personal injury to preserve the tools needed by the displaced families.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'villager-tools-saved' }, { type: 'companion-loyalty', companionId: 'mara', amount: 2 }], outcome: 'You and Mara haul until the wheels catch stone, saving the wagon seconds before the support collapses.', nextSceneId: 'ch01-journey-the-ferrymans-rope', continueLabel: 'Follow the river road north' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-ferrymans-rope', chapterId: 'ch01', region: 'gloamwood', slot: 67,
    type: 'journey', journeySubtype: 'side-quest', family: 'roadside-repair', weight: 10, pacing: 'recovery',
    illustrationId: 'scene-ch01-journey-the-ferrymans-rope', title: 'The Ferryman\'s Rope',
    narrative: [
      'An old ferryman has stranded six travelers after raiders cut his guide rope. He has a spare coil, but no one strong enough to swim it across the fast channel.',
      'The repaired ferry offers a quiet crossing for the wounded. The bridge road remains faster and easier for the wagons.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-carry-the-rope-across', label: 'Carry the rope across', detail: 'Enter the cold current and risk injury so the stranded travelers can leave the exposed bank.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'ferry-rope-restored' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'The ferryman hauls the line tight and sends the travelers across before taking your wounded aboard.', nextSceneId: 'ch01-journey-smoke-behind-us', continueLabel: 'Watch the southern ridge' },
      { id: 'ch01-choice-lend-the-ferryman-a-horse', label: 'Lend the ferryman a horse', detail: 'Avoid the river, but slow the convoy while the ferryman pulls a new line from the bank.', effects: [{ type: 'tension', amount: 1 }, { type: 'flag', operation: 'add', flagId: 'ferry-horse-lent' }], outcome: 'The horse drags the rope around a riverside post, and the convoy waits until every traveler is ashore.', nextSceneId: 'ch01-journey-smoke-behind-us', continueLabel: 'Watch the southern ridge' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-smoke-behind-us', chapterId: 'ch01', region: 'gloamwood', slot: 69,
    type: 'journey', journeySubtype: 'travel', family: 'pursuit-pressure', weight: 16, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch01-journey-smoke-behind-us', title: 'Smoke Behind Us',
    narrative: [
      'A second column of smoke rises behind the convoy where the tollhouse stood. Riders appear on the southern ridge, too far away to identify and close enough to follow.',
      'The next mile offers a concealed farm track or a straight climb that keeps Greywatch\'s towers in view.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-take-the-concealed-farm-track', label: 'Take the concealed farm track', detail: 'Break sight of the riders, but risk bogging the medicine wagons on an unmapped lane.', effects: [{ type: 'flag', operation: 'add', flagId: 'pursuit-line-broken' }, { type: 'flag', operation: 'add', flagId: 'barrow-sword-route-chosen' }, { type: 'threat', amount: -2 }], outcome: 'Hedgerows hide the wagons until the farm track rejoins Route Seven beside an old burial mound.', nextSceneId: 'ch01-living-sword-in-barrow-clay', continueLabel: 'Inspect the sword above the road' },
      { id: 'ch01-choice-climb-in-full-view', label: 'Climb in full view', detail: 'Keep to reliable stone and gain distance, while allowing the riders to watch every turn.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-climb-direct' }, { type: 'tension', amount: -1 }], outcome: 'The horses take the grade without slipping. Ahead, a staged body and a dry war banner lie too neatly beside the road.', nextSceneId: 'ch01-main-a-banner-placed-too-neatly', continueLabel: 'Examine the staged body' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-officers-clean-boots', chapterId: 'ch01', region: 'gloamwood', slot: 82,
    type: 'journey', journeySubtype: 'investigation', family: 'false-evidence', weight: 19, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-officers-clean-boots', title: 'The Officer\'s Clean Boots',
    narrative: [
      'The dead toll officer\'s boots are clean inside and wet only on the soles. The knots are tied in a cavalry pattern, not the simple cross he used on the surviving boot lace in his pocket.',
      'Mara finds pale lime dust beneath one heel. The nearest lime kiln sits outside Greywatch beside the old quarry road.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch02-main-the-hidden-depot'], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-bag-the-lime-dust', label: 'Bag the lime dust', detail: 'Preserve a weak but traceable clue, while spending time beside an exposed body.', effects: [{ type: 'flag', operation: 'add', flagId: 'lime-dust-recovered' }, { type: 'threat', amount: 1 }], outcome: 'Jory folds the dust into waxed paper and labels it with the officer\'s name and location.' },
      { id: 'ch01-choice-mark-the-quarry-road', label: 'Mark the quarry road', detail: 'Leave the body undisturbed and pursue the location clue, but carry no physical dust sample.', effects: [{ type: 'flag', operation: 'add', flagId: 'quarry-road-suspected' }, { type: 'threat', amount: -1 }], outcome: 'Mara adds the lime kiln and quarry road to your map before covering the officer with his coat.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-wounded-woodcutter', chapterId: 'ch01', region: 'gloamwood', slot: 83,
    type: 'journey', journeySubtype: 'side-quest', family: 'witness-rescue', weight: 12, pacing: 'recovery',
    illustrationId: 'scene-ch01-journey-the-wounded-woodcutter', title: 'The Wounded Woodcutter',
    narrative: [
      'A woodcutter crawls from the ditch with a bolt through his coat. He saw men unload goblin shields from an army cart and carry them toward the quarry before dawn.',
      'He needs bandages from the convoy. Treating him uses medicine meant for Greywatch; moving him untreated may silence a useful witness.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-treat-the-woodcutter', label: 'Treat the woodcutter', detail: 'Open a Greywatch bandage bundle to save the witness, reducing the sealed medical delivery.', effects: [{ type: 'flag', operation: 'add', flagId: 'woodcutter-witness-saved' }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'Jory binds the wound, and the woodcutter repeats the quarry direction clearly before resting.' },
      { id: 'ch01-choice-carry-him-without-opening-crates', label: 'Carry him without opening crates', detail: 'Protect the official medicine count, but risk the witness worsening during the final miles.', effects: [{ type: 'flag', operation: 'add', flagId: 'woodcutter-carried-untreated' }, { type: 'tension', amount: 1 }], outcome: 'The woodcutter is lifted beside the toll officer, conscious but too weak to answer more questions.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-greywatch-lanterns', chapterId: 'ch01', region: 'gloamwood', slot: 88,
    type: 'journey', journeySubtype: 'travel', family: 'greywatch-approach', weight: 15, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-greywatch-lanterns', title: 'Greywatch Lanterns',
    narrative: [
      'Greywatch\'s wall lanterns appear across the valley, then vanish as the road drops behind pine ridges. Three short horn calls carry from the gate and receive no answer from the south tower.',
      'A ridge path keeps the lanterns visible. The valley road is easier for the wounded but passes beneath dense trees.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-take-the-ridge-path', label: 'Take the ridge path', detail: 'Keep sight of Greywatch and its signals, but force the damaged wagons over rough stone.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-signals-observed' }, { type: 'threat', amount: -1 }], outcome: 'From the ridge you see sentries running along the southern wall before the next horn call.' },
      { id: 'ch01-choice-use-the-valley-road', label: 'Use the valley road', detail: 'Give the wounded a smoother ride, but accept poor visibility beneath the trees.', effects: [{ type: 'vitals', health: 2 }, { type: 'threat', amount: 1 }], outcome: 'The wagons roll quietly through the valley while Greywatch\'s horns sound somewhere above.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-closed-north-track', chapterId: 'ch01', region: 'gloamwood', slot: 89,
    type: 'journey', journeySubtype: 'travel', family: 'road-closure', weight: 13, pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-the-closed-north-track', title: 'The Closed North Track',
    narrative: [
      'A Greywatch barricade closes the north track with fresh timber, but no soldiers remain to guard it. A notice orders travelers toward the east gate and bears yesterday\'s date.',
      'The barricade can be dismantled, or the convoy can follow the posted detour through a narrow quarry cutting.',
    ],
    eligibility: { routes: ['kings-road', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-dismantle-the-barricade', label: 'Dismantle the barricade', detail: 'Ignore an official closure and spend strength on the timbers, but keep the direct gate approach.', effects: [{ type: 'vitals', health: -1 }, { type: 'flag', operation: 'add', flagId: 'north-barricade-opened' }], outcome: 'The drivers stack the timbers beside the road, revealing wagon marks that continued north after the closure.' },
      { id: 'ch01-choice-follow-the-posted-detour', label: 'Follow the posted detour', detail: 'Obey the notice and avoid damage, but enter a narrow cutting where the wagons cannot turn.', effects: [{ type: 'flag', operation: 'add', flagId: 'quarry-detour-used' }, { type: 'threat', amount: 1 }], outcome: 'The convoy enters the chalk cutting in single file with the closed track hidden behind it.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-the-last-uphill-mile', chapterId: 'ch01', region: 'gloamwood', slot: 90,
    type: 'journey', journeySubtype: 'travel', family: 'final-approach', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch01-journey-the-last-uphill-mile', title: 'The Last Uphill Mile',
    narrative: [
      'The final mile rises in full view of Greywatch. The rear horse is limping, and riders have appeared again at the mouth of the valley behind you.',
      'The convoy can redistribute the load for one hard climb or abandon damaged cargo to gain speed.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-redistribute-the-load', label: 'Redistribute the load', detail: 'Keep every surviving crate, but climb slowly while the distant riders close the valley.', effects: [{ type: 'flag', operation: 'add', flagId: 'medicine-load-kept' }, { type: 'threat', amount: 2 }], outcome: 'Everyone walks beside the wagons, sharing weight until the Greywatch gate fills the road ahead.' },
      { id: 'ch01-choice-abandon-damaged-cargo', label: 'Abandon damaged cargo', detail: 'Leave broken tools and spoiled grain behind, gaining speed without sacrificing sealed medicine.', effects: [{ type: 'flag', operation: 'add', flagId: 'damaged-cargo-abandoned' }, { type: 'threat', amount: -2 }], outcome: 'The lighter wagons climb at a trot while the riders stop briefly at the discarded crates.' },
    ],
  }),
  defineScene({
    id: 'ch01-journey-witness-or-medicine', chapterId: 'ch01', region: 'gloamwood', slot: 91,
    type: 'journey', journeySubtype: 'moral-choice', family: 'evidence-custody', weight: 20, pacing: 'danger',
    illustrationId: 'scene-ch01-journey-witness-or-medicine', title: 'Witness or Medicine',
    narrative: [
      'The wounded toll officer stops breathing evenly as Greywatch begins closing its gate. Carrying him on a litter requires four people who would otherwise push the failing rear wagon.',
      'Jory says the officer may identify the raiders. The sealed medicine will save many more people if the wagon reaches the infirmary intact.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-carry-the-wounded-officer', label: 'Carry the wounded officer', detail: 'Use four defenders as litter bearers, risking the rear wagon on the final climb.', effects: [{ type: 'flag', operation: 'add', flagId: 'toll-officer-reached-greywatch' }, { type: 'threat', amount: 1 }], outcome: 'The officer reaches the gate alive while the rear wagon climbs behind with its wheel groaning.' },
      { id: 'ch01-choice-save-the-rear-wagon', label: 'Save the rear wagon', detail: 'Put every hand on the medicine load, but leave the officer with only Jory for support.', effects: [{ type: 'flag', operation: 'add', flagId: 'medicine-reached-greywatch-intact' }, { type: 'tension', amount: 1 }], outcome: 'The wagon reaches level ground; Jory follows with the officer breathing weakly against his shoulder.' },
    ],
  }),
]);
