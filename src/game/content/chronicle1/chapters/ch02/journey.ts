import { defineScene } from '../../builders';

export const CH02_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch02-journey-the-east-wall-run', chapterId: 'ch02', region: 'gloamwood', slot: 2,
    type: 'journey', journeySubtype: 'travel', family: 'wall-warning', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-the-east-wall-run', title: 'The East-Wall Run',
    narrative: [
      'The quickest route to the east wall crosses the open market, where medicine crates and refugee carts still block the paving. A covered alley takes longer but keeps you below the roofs.',
      'The sentry\'s warning must reach the wall captain before the hidden lanterns move again.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cross-the-open-market', label: 'Cross the open market', detail: 'Reach the wall sooner, but expose yourself to any signaler watching from the roofs.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-wall-warned-fast' }, { type: 'threat', amount: 1 }], outcome: 'You clear the market and reach the stair as another covered lantern opens beyond the wall.' },
      { id: 'ch02-choice-use-the-covered-alley', label: 'Use the covered alley', detail: 'Stay out of sight beneath the eaves, but lose time weaving around locked courtyards.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-wall-warning-concealed' }, { type: 'threat', amount: -1 }], outcome: 'The alley brings you behind the wall captain without drawing a single face to the windows.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-three-horn-signals', chapterId: 'ch02', region: 'gloamwood', slot: 4,
    type: 'journey', journeySubtype: 'investigation', family: 'raid-signals', weight: 19, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-three-horn-signals', title: 'Three Horn Signals',
    narrative: [
      'The sentry heard three short horn calls from the east farms and one answer inside Greywatch. The town signal book assigns that pattern to no watch patrol.',
      'The answer may have come from the bell tower or the old tannery roof. Both overlook the east gate, but searching either leaves the other unguarded.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-search-the-bell-tower', label: 'Search the bell tower', detail: 'Inspect the official signal point first, but give anyone on the tannery roof time to escape.', effects: [{ type: 'flag', operation: 'add', flagId: 'bell-tower-searched' }, { type: 'tension', amount: 1 }], outcome: 'You find the bell keeper bound behind the stair and a length of black signal cloth on the roof.' },
      { id: 'ch02-choice-search-the-old-tannery', label: 'Search the old tannery', detail: 'Pursue the unofficial vantage point, but leave the town bell unsecured during the warning.', effects: [{ type: 'flag', operation: 'add', flagId: 'tannery-roof-searched' }, { type: 'threat', amount: 1 }], outcome: 'Fresh boot marks cross the tannery tiles beside a shuttered lantern and a military ration wrapper.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-signal-stair', chapterId: 'ch02', region: 'gloamwood', slot: 6,
    type: 'journey', journeySubtype: 'travel', family: 'wall-movement', weight: 14, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-the-signal-stair', title: 'The Signal Stair',
    narrative: [
      'Defenders crowd the main wall stair with arrow bundles and buckets. A narrow maintenance ladder reaches the same parapet through the signal loft.',
      'Forcing the stair clears a direct route for everyone. Taking the ladder gets you to the wall alone before the raid begins.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-clear-the-main-stair', label: 'Clear the main stair', detail: 'Spend time organizing defenders, but bring water and arrows to the parapet with you.', effects: [{ type: 'flag', operation: 'add', flagId: 'wall-supplies-organized' }, { type: 'tension', amount: 1 }], outcome: 'The line begins moving in order, and the first buckets reach the wall before the fire arrows.' },
      { id: 'ch02-choice-climb-the-maintenance-ladder', label: 'Climb the maintenance ladder', detail: 'Reach the parapet before everyone else, but arrive without supplies or immediate support.', effects: [{ type: 'flag', operation: 'add', flagId: 'wall-reached-by-ladder' }, { type: 'threat', amount: -1 }], outcome: 'You emerge beside the signal brazier just as figures leave the tree line below.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-rooftop-couriers', chapterId: 'ch02', region: 'gloamwood', slot: 10,
    type: 'journey', journeySubtype: 'travel', family: 'message-route', weight: 13, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-rooftop-couriers', title: 'Rooftop Couriers',
    narrative: [
      'With the streets blocked by bucket lines, young town couriers carry orders over connected roofs. One tiled span has collapsed above the baker\'s yard.',
      'You can help bridge the gap or take the messages through raider fire at street level.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-bridge-the-rooftop-gap', label: 'Bridge the rooftop gap', detail: 'Risk a fall while placing a plank, but keep every later message above the fighting.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'rooftop-courier-route-opened' }], outcome: 'The plank settles between the roofs, and the couriers cross one at a time with messages under their shirts.' },
      { id: 'ch02-choice-carry-the-orders-at-street-level', label: 'Carry the orders at street level', detail: 'Deliver this warning yourself, but leave the roof route broken for the next courier.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-order-delivered-directly' }, { type: 'threat', amount: 1 }], outcome: 'You reach the next square behind an overturned cart as bolts strike the paving.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-bakers-water-line', chapterId: 'ch02', region: 'gloamwood', slot: 11,
    type: 'journey', journeySubtype: 'side-quest', family: 'fire-response', weight: 12, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-the-bakers-water-line', title: 'The Baker\'s Water Line',
    narrative: [
      'Baker Noll has organized civilians to pass water from the public well, but a fallen awning blocks the line and fire is spreading toward the flour store.',
      'The awning can be cut down quickly, or the water line can be rerouted through the chapel yard where refugees are sheltering.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cut-down-the-burning-awning', label: 'Cut down the burning awning', detail: 'Clear the direct water line under falling embers, risking injury but protecting the flour store.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'bakers-water-line-restored' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'The awning drops into the street, and full buckets begin reaching the flour store again.' },
      { id: 'ch02-choice-reroute-through-the-chapel-yard', label: 'Reroute through the chapel yard', detail: 'Avoid the flames, but move panicked refugees to make room for the slower bucket line.', effects: [{ type: 'flag', operation: 'add', flagId: 'water-line-through-chapel' }, { type: 'companion-loyalty', companionId: 'caldus', amount: -1 }], outcome: 'Caldus clears a narrow lane through the refugees, and the buckets reach the fire at a slower pace.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-lane-of-wounded', chapterId: 'ch02', region: 'gloamwood', slot: 16,
    type: 'journey', journeySubtype: 'travel', family: 'wounded-pressure', weight: 15, pacing: 'recovery',
    illustrationId: 'scene-ch02-journey-the-lane-of-wounded', title: 'The Lane of Wounded',
    narrative: [
      'The shortest path from the south gate to the armory is filled with wounded defenders waiting for the infirmary. A side lane remains open behind the cooperage, but scouts have not checked it.',
      'Crossing the crowded lane slows you and may help the injured. The side lane preserves speed at the cost of entering an unwatched route.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-help-clear-the-wounded-lane', label: 'Help clear the wounded lane', detail: 'Lose time carrying injured defenders, but open the direct route for soldiers behind you.', effects: [{ type: 'vitals', health: 2 }, { type: 'flag', operation: 'add', flagId: 'wounded-lane-cleared' }, { type: 'tension', amount: 1 }], outcome: 'You carry two defenders to the chapel, and the lane opens behind the last litter.' },
      { id: 'ch02-choice-take-the-unwatched-side-lane', label: 'Take the unwatched side lane', detail: 'Reach the armory sooner, but risk meeting infiltrators where no Greywatch patrol can help.', effects: [{ type: 'flag', operation: 'add', flagId: 'cooperage-side-lane-used' }, { type: 'threat', amount: 1 }], outcome: 'The cooperage lane is empty except for a fresh boot print pointing toward the armory yard.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-armory-receiving-book', chapterId: 'ch02', region: 'gloamwood', slot: 19,
    type: 'journey', journeySubtype: 'investigation', family: 'armory-audit', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-armory-receiving-book', title: 'The Armory Receiving Book',
    narrative: [
      'Greywatch\'s receiving book shows no royal arrows delivered in six years. A newer page has been cut from the binding between two ordinary shipments of nails and bowstrings.',
      'Quartermaster Cole offers the original book for inspection, but copying it preserves a second record if the armory is attacked again.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-copy-the-receiving-gap', label: 'Copy the receiving gap', detail: 'Create a portable record of the missing page, but spend time while the raid is still active.', effects: [{ type: 'flag', operation: 'add', flagId: 'armory-ledger-gap-copied' }, { type: 'tension', amount: 1 }], outcome: 'Jory copies the page numbers, neighboring entries, and the thread cut cleanly at the binding.' },
      { id: 'ch02-choice-lock-the-original-book-away', label: 'Lock the original book away', detail: 'Protect the full ledger in the armory vault, but leave the investigation dependent on one location.', effects: [{ type: 'flag', operation: 'add', flagId: 'armory-book-secured' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'Cole locks the book under her seal and gives separate keys to Sera Holt and Sergeant Hale.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-fletching-bench', chapterId: 'ch02', region: 'gloamwood', slot: 21,
    type: 'journey', journeySubtype: 'investigation', family: 'weapon-craft', weight: 18, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-fletching-bench', title: 'The Fletching Bench',
    narrative: [
      'Sera Holt\'s bench holds black thread from three suppliers. Only the military spool twists left around a pale center, matching the binding on the recovered arrow.',
      'Her apprentice signed for one missing spool last week under an order Sera never saw. Finding him may identify the buyer; preserving the spool strengthens the material proof.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch02-journey-find-apprentice-rowan'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-seal-the-matching-thread', label: 'Seal the matching thread', detail: 'Keep the material comparison intact, but delay the search for the missing apprentice.', effects: [{ type: 'flag', operation: 'add', flagId: 'military-thread-sealed' }, { type: 'evidence', operation: 'add', evidenceId: 'royal-arrow' }], outcome: 'Sera seals a measured strand beside the arrow and signs the packet across its folded edge.' },
      { id: 'ch02-choice-search-for-apprentice-rowan', label: 'Search for apprentice Rowan', detail: 'Pursue a living lead during the raid, but leave the thread comparison in the crowded workshop.', effects: [{ type: 'flag', operation: 'add', flagId: 'rowan-search-started' }, { type: 'threat', amount: 1 }], outcome: 'Sera gives you Rowan\'s address and the warehouse mark copied beside his disputed signature.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-find-apprentice-rowan', chapterId: 'ch02', region: 'gloamwood', slot: 23,
    type: 'journey', journeySubtype: 'side-quest', family: 'missing-apprentice', weight: 14, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-find-apprentice-rowan', title: 'Find Apprentice Rowan',
    narrative: [
      'Rowan\'s room has been searched, and a blood trail crosses the back stair toward the stable loft. Someone left a military warehouse token beside the overturned bed.',
      'The loft may still hold Rowan or his attacker. The token can instead take you directly to the warehouse named on Sera\'s record.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-follow-the-blood-to-the-loft', label: 'Follow the blood to the loft', detail: 'Risk an ambush to find Rowan alive, while the warehouse connected to the token remains unwatched.', effects: [{ type: 'flag', operation: 'add', flagId: 'rowan-found-alive' }, { type: 'threat', amount: 1 }], outcome: 'You find Rowan bound behind the hay, wounded but able to name the driver who forced his signature.' },
      { id: 'ch02-choice-take-the-token-to-the-warehouse', label: 'Take the token to the warehouse', detail: 'Pursue the supply trail immediately, but leave Rowan\'s condition and testimony uncertain.', effects: [{ type: 'flag', operation: 'add', flagId: 'warehouse-token-followed' }, { type: 'tension', amount: -1 }], outcome: 'The token opens a side door where fresh wheel tracks lead away from an empty bowstring rack.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-old-barracks-passage', chapterId: 'ch02', region: 'gloamwood', slot: 25,
    type: 'journey', journeySubtype: 'travel', family: 'town-shortcut', weight: 13, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-old-barracks-passage', title: 'The Old Barracks Passage',
    narrative: [
      'A disused barracks passage links the armory yard to the infirmary. Its inner door is barred by stored bunks, while the public street remains crowded with defenders.',
      'Clearing the passage creates a protected route for evidence and wounded people. The street is open now and may not remain so.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-clear-the-barracks-passage', label: 'Clear the barracks passage', detail: 'Spend strength moving bunks, but secure a covered route before the next wave arrives.', effects: [{ type: 'vitals', health: -1 }, { type: 'flag', operation: 'add', flagId: 'barracks-passage-opened' }], outcome: 'The last bunk slides aside, opening a dry corridor between the armory and infirmary.' },
      { id: 'ch02-choice-use-the-public-street', label: 'Use the public street', detail: 'Reach the infirmary without delay, but carry evidence through a crowd that may include an informer.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-crossed-public-street' }, { type: 'threat', amount: 1 }], outcome: 'You cross behind a shield detail while faces turn from every doorway along the route.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-jorys-duplicate-chit', chapterId: 'ch02', region: 'gloamwood', slot: 26,
    type: 'journey', journeySubtype: 'investigation', family: 'dispatch-recovery', weight: 26, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-jorys-duplicate-chit', title: 'Jory\'s Duplicate Chit',
    narrative: [
      'Greywatch\'s receiving office keeps a duplicate chit for every Northern Stores convoy. The Route Seven copy names Jory, two medicine wagons, and the same seal number carried through the ambush.',
      'The receiving clerk can add it to the council file or hide it in a separate civilian archive as a recovery copy.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-add-the-chit-to-the-council-file', label: 'Add the chit to the council file', detail: 'Strengthen the formal evidence chain, but place the dispatch and its backup in related custody.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'route-seven-dispatch' }, { type: 'flag', operation: 'add', flagId: 'duplicate-chit-in-council-file' }], outcome: 'The clerk seals the duplicate beside Jory\'s statement and signs the transfer in the public book.' },
      { id: 'ch02-choice-hide-the-chit-in-the-civilian-archive', label: 'Hide the chit in the civilian archive', detail: 'Create an independent recovery copy, but weaken immediate access during the council hearing.', effects: [{ type: 'flag', operation: 'add', flagId: 'duplicate-chit-in-civilian-archive' }, { type: 'faction', factionId: 'border-council', amount: 1 }], outcome: 'The clerk files the chit behind burial permits where no military inventory lists it.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-who-holds-the-arrow', chapterId: 'ch02', region: 'gloamwood', slot: 28,
    type: 'journey', journeySubtype: 'moral-choice', family: 'evidence-custody', weight: 18, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-who-holds-the-arrow', title: 'Who Holds the Arrow',
    narrative: [
      'Captain Ward claims the royal arrow belongs in Greywatch\'s armory. Lyra argues that the same armory may have lost the original batch, while Jory wants civilian witnesses present for any transfer.',
      'No custodian is free of risk. Local control is accountable to the town; divided custody is harder to steal and slower to present.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-seal-the-arrow-in-the-armory', label: 'Seal the arrow in the armory', detail: 'Keep the evidence under official guard, but trust the institution that failed to notice missing stock.', effects: [{ type: 'flag', operation: 'add', flagId: 'royal-arrow-in-greywatch-custody' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Ward, Jory, and Lyra each mark the case before it is locked in the armory vault.' },
      { id: 'ch02-choice-divide-custody-of-the-evidence', label: 'Divide custody of the evidence', detail: 'Separate the arrow, notes, and seal copies, but make later proof depend on several people arriving.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-custody-divided' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 2 }], outcome: 'Jory keeps the notes, Lyra takes a seal copy, and Hale locks the arrow behind his own mark.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-underwall-conduit', chapterId: 'ch02', region: 'gloamwood', slot: 30,
    type: 'journey', journeySubtype: 'dungeon', family: 'underwall-search', weight: 10, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch02-journey-the-underwall-conduit', title: 'The Underwall Conduit',
    narrative: [
      'A dry water conduit runs from the cooperage cellars beneath Greywatch\'s east wall. Fresh lime dust marks the floor, and someone has removed the iron grate at the outer end.',
      'The low tunnel is trapped with a simple bell wire. Cutting it preserves surprise; following it may reveal who was meant to hear the alarm.',
    ],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-cut-the-conduit-bell-wire', label: 'Cut the conduit bell wire', detail: 'Move through the tunnel quietly, but lose the chance to identify the alarm\'s listener.', effects: [{ type: 'flag', operation: 'add', flagId: 'conduit-entered-quietly' }, { type: 'threat', amount: -1 }], outcome: 'The wire falls slack, and you reach the outer grate without sounding the hidden cup bell.' },
      { id: 'ch02-choice-follow-the-wire-to-its-bell', label: 'Follow the wire to its bell', detail: 'Risk alerting the infiltrator to locate the receiver, while remaining longer beneath the wall.', effects: [{ type: 'flag', operation: 'add', flagId: 'conduit-bell-receiver-found' }, { type: 'threat', amount: 1 }], outcome: 'The wire ends beneath a warehouse floor beside a bedroll, army rations, and a quarry token.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-raider-in-a-grey-cloak', chapterId: 'ch02', region: 'gloamwood', slot: 32,
    type: 'journey', journeySubtype: 'moral-choice', family: 'prisoner-treatment', weight: 15, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-raider-in-a-grey-cloak', title: 'The Raider in a Grey Cloak',
    narrative: [
      'Greywatch soldiers capture a human raider wearing an unmarked grey cloak beneath goblin armor. He claims his family will be killed if he names the officer who paid him.',
      'A public interrogation may produce fast answers and panic other prisoners. Protective custody costs guards during a continuing attack.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-place-the-raider-under-guard', label: 'Place the raider under guard', detail: 'Use two defenders to protect him and his testimony, weakening the wall during the next alarm.', effects: [{ type: 'flag', operation: 'add', flagId: 'grey-cloak-raider-protected' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'Bren moves the prisoner to a locked store room and records the threat against his family.' },
      { id: 'ch02-choice-question-him-before-the-yard', label: 'Question him before the yard', detail: 'Seek the employer\'s name immediately, but expose the frightened prisoner to soldiers demanding revenge.', effects: [{ type: 'flag', operation: 'add', flagId: 'grey-cloak-raider-questioned-publicly' }, { type: 'tension', amount: 1 }], outcome: 'The raider gives up the lime-kiln route before the yard\'s anger forces Hale to end the questioning.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-widows-missing-son', chapterId: 'ch02', region: 'gloamwood', slot: 35,
    type: 'journey', journeySubtype: 'side-quest', family: 'missing-civilian', weight: 12, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-widows-missing-son', title: 'The Widow\'s Missing Son',
    narrative: [
      'The toll collector\'s widow finds her teenage son absent from the refugee roll. He was last seen carrying water near the east granary when the raid began.',
      'The council wants you moving toward the quarry. Searching the damaged granary costs daylight but may keep one family from losing another person.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4, requiredFlags: ['toll-widow-escorted'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-search-the-damaged-granary', label: 'Search the damaged granary', detail: 'Delay the quarry mission to enter an unstable building and look for the missing boy.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'widows-son-rescued' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'You find him beneath a fallen grain rack, bruised but alive and still holding an empty bucket.' },
      { id: 'ch02-choice-send-the-watch-roll', label: 'Send the watch roll', detail: 'Continue toward the quarry while soldiers search, but accept that the rescue will happen without you.', effects: [{ type: 'flag', operation: 'add', flagId: 'watch-searched-for-widows-son' }, { type: 'threat', amount: -1 }], outcome: 'Hale assigns two off-duty guards to the granary as you leave through the east gate.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-bread-before-steel', chapterId: 'ch02', region: 'gloamwood', slot: 37,
    type: 'journey', journeySubtype: 'moral-choice', family: 'scarce-supplies', weight: 16, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-bread-before-steel', title: 'Bread Before Steel',
    narrative: [
      'The saved granary can issue one cart before the quarry search begins. Soldiers want rations for the pursuit; refugee kitchens have fed twice their normal number since the gate closed.',
      'Either group can manage one lean day. The choice decides who bears the immediate cost of Greywatch\'s defense.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-send-grain-to-the-refuge-kitchens', label: 'Send grain to the refuge kitchens', detail: 'Feed displaced families first, but send the quarry patrol out with shorter rations.', effects: [{ type: 'flag', operation: 'add', flagId: 'refuge-kitchens-supplied' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 3 }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'Caldus receives the cart at the chapel while patrol soldiers divide what remains in their packs.' },
      { id: 'ch02-choice-provision-the-quarry-patrol', label: 'Provision the quarry patrol', detail: 'Prepare the armed search for a longer fight, but leave the refugee kitchens to reduce portions.', effects: [{ type: 'flag', operation: 'add', flagId: 'quarry-patrol-provisioned' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'The patrol loads bread and dried meat as the chapel posts a notice cutting the evening meal.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-quarry-cart-ruts', chapterId: 'ch02', region: 'gloamwood', slot: 38,
    type: 'journey', journeySubtype: 'investigation', family: 'depot-trail', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch02-journey-the-quarry-cart-ruts', title: 'The Quarry Cart Ruts',
    narrative: [
      'Beyond the east gate, broad wheel ruts leave the quarry road and enter scrub beside the abandoned lime kiln. One iron band carries the same repaired notch found at the tollhouse.',
      'The recent carts were heavy going in and lighter coming out. Boot prints beside them include army soles and smaller raider shoes.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch02-main-the-hidden-depot'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-match-the-repaired-wheel-band', label: 'Match the repaired wheel band', detail: 'Document the tollhouse-to-quarry supply route, but stop in open ground near the hidden depot.', effects: [{ type: 'flag', operation: 'add', flagId: 'army-cart-route-confirmed' }, { type: 'threat', amount: 1 }], outcome: 'Jory fits the old wax rut cast to the fresh track, matching the repaired band exactly.' },
      { id: 'ch02-choice-follow-the-light-return-ruts', label: 'Follow the light return ruts', detail: 'Approach the depot without stopping, but leave the wheel-link evidence less fully recorded.', effects: [{ type: 'flag', operation: 'add', flagId: 'depot-approach-found' }, { type: 'threat', amount: -1 }], outcome: 'The shallow return tracks end behind the kiln where brush hides a stone loading door.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-quarry-track', chapterId: 'ch02', region: 'gloamwood', slot: 39,
    type: 'journey', journeySubtype: 'travel', family: 'depot-approach', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch02-journey-the-quarry-track', title: 'The Quarry Track',
    narrative: [
      'The quarry track divides around a flooded chalk pit. The upper ledge reaches the kiln quickly in full view; the lower cart road is concealed and deep with white mud.',
      'Greywatch scouts can cover the ledge. The lower road may let the party reach the depot before its guards know the town survived.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-advance-along-the-upper-ledge', label: 'Advance along the upper ledge', detail: 'Move quickly with scout cover, but let every depot lookout see the approach.', effects: [{ type: 'flag', operation: 'add', flagId: 'quarry-upper-ledge-used' }, { type: 'threat', amount: 1 }], outcome: 'The patrol reaches the kiln above the pit as a warning whistle sounds from the loading yard.' },
      { id: 'ch02-choice-wade-the-lower-cart-road', label: 'Wade the lower cart road', detail: 'Hide beneath the chalk banks, but risk exhaustion and damaged gear in the flooded ruts.', effects: [{ type: 'vitals', health: -2, resource: -1 }, { type: 'flag', operation: 'add', flagId: 'quarry-lower-road-used' }], outcome: 'White mud reaches your knees, but the patrol arrives below the depot without a shouted warning.' },
    ],
  }),
  defineScene({
    id: 'ch02-journey-the-depot-cistern', chapterId: 'ch02', region: 'gloamwood', slot: 41,
    type: 'journey', journeySubtype: 'dungeon', family: 'depot-infiltration', weight: 12, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch02-journey-the-depot-cistern', title: 'The Depot Cistern',
    narrative: [
      'A dry cistern beneath the lime kiln opens into the depot through a cracked inspection hatch. Stored arrow crates block half the chamber, and smoke already leaks under the far door.',
      'The hatch can be widened quietly with tools, or the crates can be shifted to create a faster entry that the guards will hear.',
    ],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch02-main-the-hidden-depot'], callbackPromises: [],
    choices: [
      { id: 'ch02-choice-widen-the-inspection-hatch', label: 'Widen the inspection hatch', detail: 'Spend time working quietly in the smoke, but enter behind the depot guards without an alarm.', effects: [{ type: 'flag', operation: 'add', flagId: 'depot-entered-through-hatch' }, { type: 'threat', amount: -1 }], outcome: 'The mortar gives way in small pieces, opening a narrow route behind the stacked crates.' },
      { id: 'ch02-choice-shift-the-arrow-crates', label: 'Shift the arrow crates', detail: 'Create a direct entrance before smoke thickens, but warn everyone beyond the far door.', effects: [{ type: 'vitals', health: -1 }, { type: 'flag', operation: 'add', flagId: 'depot-crates-shifted' }, { type: 'threat', amount: 1 }], outcome: 'The upper crate falls with a heavy crack, revealing the depot floor as boots turn toward the noise.' },
    ],
  }),
]);
