import { defineScene } from '../../builders';

export const CH03_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch03-journey-road-beneath-water', chapterId: 'ch03', region: 'drowned-road', slot: 2,
    type: 'journey', family: 'submerged-road', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-road-beneath-water', title: 'The Road Beneath Water',
    narrative: [
      'The kingroad continues beneath waist-deep floodwater, marked only by willow stakes and the tops of old milestones. A wagon axle lies somewhere below the brown surface.',
      'A roofline offers a drier detour through abandoned cottages, but every climb exposes your party against the pale morning sky.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 1, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-probe-the-sunken-road', label: 'Probe the sunken road', detail: 'Keep a direct course while risking hidden holes and broken farm tools under the water.', effects: [{ type: 'flag', operation: 'add', flagId: 'drowned-road-depth-marked' }, { type: 'vitals', health: -3 }], outcome: 'Your poles find the old crown of the road, though a submerged harrow cuts one guard across the calf.' },
      { id: 'ch03-choice-cross-the-cottage-roofs', label: 'Cross the cottage roofs', detail: 'Stay dry and visible while stepping across beams weakened by weeks of rain.', effects: [{ type: 'flag', operation: 'add', flagId: 'drowned-road-roof-route' }, { type: 'threat', amount: 1 }], outcome: 'The roofs hold long enough to reach a stone barn, and distant watchers track every careful jump.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-boatmans-toll', chapterId: 'ch03', region: 'drowned-road', slot: 4,
    type: 'journey', family: 'ferry-toll', journeySubtype: 'travel', weight: 70, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-the-boatmans-toll', title: 'The Boatman\'s Toll',
    narrative: [
      'Old Perrin has the only flatboat broad enough for the evidence case. He asks for coin, then admits that raiders took his daughter\'s two draft mules at dawn.',
      'The animals are tied on a nearby hummock under one inattentive guard. Recovering them will delay the crossing and announce that armed travelers have arrived.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-pay-perrins-crossing-fee', label: 'Pay Perrin\'s crossing fee', detail: 'Spend campaign gold for a quiet passage and leave the stolen farm animals behind.', effects: [{ type: 'gold', scope: 'unbanked', amount: -12 }, { type: 'flag', operation: 'add', flagId: 'perrins-ferry-paid' }], outcome: 'Perrin poles the flatboat across without a lantern, keeping the evidence case dry beneath a tarred sheet.' },
      { id: 'ch03-choice-recover-the-draft-mules', label: 'Recover the draft mules', detail: 'Trade time and secrecy for the boatman\'s help and a working farm after the flood.', effects: [{ type: 'flag', operation: 'add', flagId: 'perrins-mules-recovered' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'The guard runs when you cut the lead rope. Perrin crosses you without payment and promises another boat to the refugees.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-broken-causeway', chapterId: 'ch03', region: 'drowned-road', slot: 7,
    type: 'journey', family: 'broken-causeway', journeySubtype: 'travel', weight: 85, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-the-broken-causeway', title: 'The Broken Causeway',
    narrative: [
      'A thirty-foot section of the raised causeway has collapsed into fast water. Refugees wait on the far side with a handcart and one exhausted horse.',
      'There is enough timber for a narrow footbridge or a strong raft, but not both. The river is still rising against the remaining stonework.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-build-a-refugee-footbridge', label: 'Build a refugee footbridge', detail: 'Open a lasting route for people on foot while carrying your own gear across by hand.', effects: [{ type: 'flag', operation: 'add', flagId: 'causeway-footbridge-built' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: -1 }], outcome: 'The first children cross before the last plank is fixed, and the path remains usable behind you.' },
      { id: 'ch03-choice-lash-a-strong-raft', label: 'Lash a strong raft', detail: 'Move the evidence and horse quickly, but leave no fixed crossing for later families.', effects: [{ type: 'flag', operation: 'add', flagId: 'causeway-raft-used' }, { type: 'threat', amount: -1 }], outcome: 'The raft lands below the break with every case aboard, while the waiting families search for another route.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-eel-smugglers-debt', chapterId: 'ch03', region: 'drowned-road', slot: 8,
    type: 'journey', family: 'smuggler-debt', journeySubtype: 'side-quest', weight: 65, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-the-eel-smugglers-debt', title: 'The Eel Smuggler\'s Debt',
    narrative: [
      'A wounded eel smuggler named Wren offers the location of a hidden dry path if you recover her ledger from a flooded hut. The book records bribes paid to both patrols.',
      'Wren wants the debt pages burned before anyone sees them. The patrol payments could also identify officers who knowingly kept the smuggling route open.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-return-wrens-ledger-closed', label: 'Return Wren\'s ledger closed', detail: 'Honor the bargain and gain the dry path without learning which officers took bribes.', effects: [{ type: 'flag', operation: 'add', flagId: 'wrens-dry-path' }, { type: 'threat', amount: -1 }], outcome: 'Wren burns three pages herself, then draws a route along cattle mounds that stay above the flood.' },
      { id: 'ch03-choice-copy-the-patrol-payments', label: 'Copy the patrol payments', detail: 'Keep evidence of corruption while risking the smuggler\'s warning reaching both armies.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'drowned-road-bribe-list' }, { type: 'flag', operation: 'add', flagId: 'wren-bargain-broken' }, { type: 'threat', amount: 2 }], outcome: 'The copied names include one Greywatch sergeant and one Free Host supplier, but Wren disappears before dawn.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-tracks-at-the-sluice', chapterId: 'ch03', region: 'drowned-road', slot: 11,
    type: 'journey', family: 'sluice-tracks', journeySubtype: 'investigation', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-tracks-at-the-sluice', title: 'Tracks at the Sluice',
    narrative: [
      'Mud beside a forced sluice gate holds three sets of prints: army boots, bare orc feet, and square heels used by depot clerks. All three tracks begin at the same cart rut.',
      'The boot soles can be cast in wax, or the cart rut can be followed before rain fills it. Only one trace will survive the next hour.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-cast-the-three-boot-prints', label: 'Cast the three boot prints', detail: 'Preserve a comparison for Redwater while allowing the shared supply cart to escape.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'sluice-print-casts' }, { type: 'threat', amount: 1 }], outcome: 'The casts show that the bare feet were pressed into mud by carved wooden soles rather than living walkers.' },
      { id: 'ch03-choice-follow-the-supply-cart', label: 'Follow the supply cart', detail: 'Pursue the fresh rut through exposed fields and leave the fragile prints to the rain.', effects: [{ type: 'flag', operation: 'add', flagId: 'sluice-cart-traced' }, { type: 'threat', amount: 2 }], outcome: 'The rut ends at a stripped wagon where black wax and two kinds of uniform buttons lie in one box.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-last-dry-loft', chapterId: 'ch03', region: 'drowned-road', slot: 14,
    type: 'journey', family: 'dry-loft', journeySubtype: 'moral-choice', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-the-last-dry-loft', title: 'The Last Dry Loft',
    narrative: [
      'A grain loft is the only dry shelter for miles. Your oilskin evidence case needs space away from the leaking roof, but twelve displaced farm workers have already crowded inside.',
      'The owner will clear a locked room for official papers if ordered. Doing so would put an elderly couple and two feverish children back in the rain.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-share-the-loft-with-families', label: 'Share the loft with families', detail: 'Keep everyone under cover while accepting damp damage to the outer evidence wrappings.', effects: [{ type: 'flag', operation: 'add', flagId: 'dry-loft-shared' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'tension', amount: -1 }], outcome: 'The evidence stays beneath your cloak while the children sleep beside the driest sacks of grain.' },
      { id: 'ch03-choice-reserve-the-locked-room', label: 'Reserve the locked room', detail: 'Protect the custody case completely while forcing vulnerable civilians into a cart shed.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-kept-dry' }, { type: 'faction', factionId: 'border-council', amount: -2 }], outcome: 'The seals remain perfect through the storm, and the owner avoids your eyes when the children begin coughing.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-half-sunk-chapel', chapterId: 'ch03', region: 'drowned-road', slot: 17,
    type: 'journey', family: 'chapel-crossing', journeySubtype: 'travel', weight: 65, pacing: 'recovery',
    illustrationId: 'scene-ch03-journey-the-half-sunk-chapel', title: 'The Half-Sunk Chapel',
    narrative: [
      'A stone chapel stands above the flood from the windows upward. Its roof beams form a bridge to the next dry ridge, while the nave below offers a sheltered place to rest.',
      'The bell rope still runs through the water. Ringing it may call stranded villagers, but it may also guide raiders through the fog.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-ring-the-chapel-bell', label: 'Ring the chapel bell', detail: 'Call anyone lost in the flood and reveal your resting place across the valley.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-bell-rung' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'Three wet families answer before sunset, followed by a distant signal horn from the north bank.' },
      { id: 'ch03-choice-cross-the-roof-in-silence', label: 'Cross the roof in silence', detail: 'Use the dry beam route without alerting stranded civilians or hostile watchers.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-roof-crossed' }, { type: 'threat', amount: -1 }], outcome: 'The party reaches the ridge unseen, leaving the silent bell above the empty flooded nave.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-millers-wheel', chapterId: 'ch03', region: 'drowned-road', slot: 21,
    type: 'journey', family: 'mill-repair', journeySubtype: 'side-quest', weight: 65, pacing: 'recovery',
    illustrationId: 'scene-ch03-journey-the-millers-wheel', title: 'The Miller\'s Wheel',
    narrative: [
      'Miller Osric Vale has grain for Redwater, but a sabotage chain jams his waterwheel and floods the millrace. His two sons are already serving in opposite patrol auxiliaries.',
      'Repairing the wheel feeds the town. Escorting the grain by hand gets one cart moving sooner but leaves the mill useless for the next refugees.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-clear-the-millrace-chain', label: 'Clear the millrace chain', detail: 'Spend half a day restoring the mill while the evidence mission waits on an open road.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-mill-restored' }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'threat', amount: 1 }], outcome: 'The wheel turns by dusk, and flour for several hundred people begins filling clean sacks.' },
      { id: 'ch03-choice-escort-one-grain-cart', label: 'Escort one grain cart', detail: 'Deliver immediate food to Redwater while leaving the damaged mill unable to grind more.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-grain-cart-delivered' }, { type: 'tension', amount: -1 }], outcome: 'One cart reaches the ridge before dark, enough to calm the ration line for a single night.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-reed-maze', chapterId: 'ch03', region: 'drowned-road', slot: 22,
    type: 'journey', family: 'reed-maze', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-the-reed-maze', title: 'The Reed Maze',
    narrative: [
      'The channel divides into a maze of tall reeds where current and wind point in different directions. Fresh knife marks on the stalks form a guide code used by local fishers.',
      'A captured smuggler offers to read the code for freedom. Your compass gives a slower route that avoids trusting someone who knows every ambush bank.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-trust-the-smugglers-marks', label: 'Trust the smuggler\'s marks', detail: 'Take the shortest channel while giving a prisoner control over where the boat emerges.', effects: [{ type: 'flag', operation: 'add', flagId: 'reed-code-learned' }, { type: 'threat', amount: 1 }], outcome: 'The marks lead through water deep enough for the boat, and the smuggler slips away at the final bend.' },
      { id: 'ch03-choice-follow-the-compass-south', label: 'Follow the compass south', detail: 'Choose a slow, open channel that avoids the coded route and its hidden shortcuts.', effects: [{ type: 'flag', operation: 'add', flagId: 'reed-maze-compass-route' }, { type: 'tension', amount: 1 }], outcome: 'You reach the southern marker after nightfall with no ambush and one full day lost.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-three-prisoners-one-boat', chapterId: 'ch03', region: 'drowned-road', slot: 26,
    type: 'journey', family: 'prisoner-rescue', journeySubtype: 'moral-choice', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-three-prisoners-one-boat', title: 'Three Prisoners, One Boat',
    narrative: [
      'A sinking skiff carries a Greywatch deserter, a Free Host levy fighter, and a civilian accused of guiding smugglers. The rescue boat has room for only two beside your evidence case.',
      'No charge has been heard by a court. Moving the case into the leaking skiff could save all three, but one bad wave may destroy the proof meant to stop a battle.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-risk-the-evidence-for-all-three', label: 'Risk the evidence for all three', detail: 'Transfer the custody case to the leaking skiff so every prisoner can board the sound boat.', effects: [{ type: 'flag', operation: 'add', flagId: 'three-prisoners-rescued' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 2 }], outcome: 'All three reach shore alive, and the oilskin case arrives soaked outside but sealed within.' },
      { id: 'ch03-choice-keep-the-evidence-aboard', label: 'Keep the evidence aboard', detail: 'Protect the case and choose the civilian plus one soldier for immediate rescue.', effects: [{ type: 'flag', operation: 'add', flagId: 'evidence-prioritized-at-skiff' }, { type: 'tension', amount: 1 }], outcome: 'The civilian and one soldier survive. The other cuts his bonds and swims toward a distant willow.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-cut-ferry-rope', chapterId: 'ch03', region: 'drowned-road', slot: 28,
    type: 'journey', family: 'ferry-sabotage', journeySubtype: 'investigation', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-the-cut-ferry-rope', title: 'The Cut Ferry Rope',
    narrative: [
      'A ferry rope parts cleanly and sends an empty platform downstream. The cut fibers hold black grit, while a replacement coil waits under the landing with an orc maker\'s tag tied over a human depot knot.',
      'Following the drifting ferry may reveal the saboteur. Securing the replacement coil preserves a compact example of the mixed false-flag method.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-secure-the-replacement-coil', label: 'Secure the replacement coil', detail: 'Preserve the staged materials for Redwater and let the saboteur gain distance downstream.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'mixed-ferry-rigging' }, { type: 'flag', operation: 'add', flagId: 'ferry-sabotage-documented' }], outcome: 'The tag, knot, and black grit remain together under seal as one deliberate attempt to blame both camps.' },
      { id: 'ch03-choice-follow-the-drifting-platform', label: 'Follow the drifting platform', detail: 'Chase a possible saboteur through fast water while leaving the staged coil at the landing.', effects: [{ type: 'flag', operation: 'add', flagId: 'ferry-saboteur-tracked' }, { type: 'threat', amount: 2 }], outcome: 'The platform grounds beside fresh boot marks leading toward a signal blind above the river.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-letters-from-the-east-bank', chapterId: 'ch03', region: 'drowned-road', slot: 30,
    type: 'journey', family: 'family-letters', journeySubtype: 'side-quest', weight: 60, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-letters-from-the-east-bank', title: 'Letters from the East Bank',
    narrative: [
      'A schoolteacher gives you seventeen letters for relatives trapped west of the patrol line. The names include two Free Host soldiers and a Greywatch cook.',
      'Carrying the bundle may expose family connections that hardliners call disloyal. Leaving it behind protects the writers but lets rumors replace simple news.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-carry-the-seventeen-letters', label: 'Carry the seventeen letters', detail: 'Take personal messages through military searches and risk exposing families across the line.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-bank-letters-delivered' }, { type: 'tension', amount: -1 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'By nightfall, replies cross back in the same oilcloth bundle and several false casualty rumors end.' },
      { id: 'ch03-choice-leave-the-letters-sealed', label: 'Leave the letters sealed', detail: 'Protect the writers from hostile searches while denying families reliable news for another week.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-bank-letters-left' }, { type: 'threat', amount: -1 }], outcome: 'The teacher locks the letters beneath a floorboard and asks you to remember the names if Redwater falls.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-flooded-toll-archive', chapterId: 'ch03', region: 'drowned-road', slot: 32,
    type: 'journey', family: 'toll-archive', journeySubtype: 'dungeon', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-the-flooded-toll-archive', title: 'The Flooded Toll Archive',
    narrative: [
      'Stone steps descend into a toll archive where shelves have collapsed into black water. Recent lantern smoke proves someone entered after the flood and searched the military freight ledgers.',
      'A trapped scavenger calls from behind a fallen cabinet. The intact ledger shelf is sinking on the other side of the room.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-free-the-trapped-scavenger', label: 'Free the trapped scavenger', detail: 'Use the remaining dry beams on a rescue and let the freight shelf sink deeper.', effects: [{ type: 'flag', operation: 'add', flagId: 'toll-archive-scavenger-saved' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'vitals', health: -4 }], outcome: 'The scavenger crawls free and names the masked clerk who paid him to remove every Route Seven entry.' },
      { id: 'ch03-choice-raise-the-freight-ledger', label: 'Raise the freight ledger', detail: 'Recover shipment records before the water claims them while leaving the trapped man longer.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'drowned-toll-ledger' }, { type: 'threat', amount: 1 }], outcome: 'The swollen ledger shows paired freight loads sent east and west under consecutive false names.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-a-child-at-the-picket', chapterId: 'ch03', region: 'drowned-road', slot: 33,
    type: 'journey', family: 'picket-child', journeySubtype: 'moral-choice', weight: 70, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-a-child-at-the-picket', title: 'A Child at the Picket',
    narrative: [
      'A twelve-year-old farm boy reaches the Greywatch picket carrying medicine for his orc stepfather across the river. The sentries suspect he is marking their positions.',
      'Escorting him through both lines may protect one family and expose the path. Confiscating the medicine follows standing orders but turns a mixed household into another grievance.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-escort-the-boy-across', label: 'Escort the boy across', detail: 'Cross two suspicious pickets for a civilian errand and reveal a narrow ford to both sides.', effects: [{ type: 'flag', operation: 'add', flagId: 'picket-child-escorted' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Both sentry captains sign the medicine packet, and the boy reaches his family before nightfall.' },
      { id: 'ch03-choice-send-the-medicine-by-flag', label: 'Send the medicine under a flag', detail: 'Keep the child behind the line while trusting an opposing patrol to deliver the packet.', effects: [{ type: 'flag', operation: 'add', flagId: 'picket-medicine-transferred' }, { type: 'tension', amount: -1 }], outcome: 'An orc runner receives the packet at midstream while the boy waits beside the Greywatch fire.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-black-thread-in-the-reeds', chapterId: 'ch03', region: 'drowned-road', slot: 37,
    type: 'journey', family: 'uniform-thread', journeySubtype: 'investigation', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-black-thread-in-the-reeds', title: 'Black Thread in the Reeds',
    narrative: [
      'A strip of reversible uniform cloth hangs from a thorn beside the attack route. Black thread joins a Greywatch hem on one side to a Free Host border on the other.',
      'The stitches match civilian sail work from Redwater, but the thread carries iron dust used around distant foundries rather than river docks.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-seal-the-reversible-cloth', label: 'Seal the reversible cloth', detail: 'Carry the strongest physical sample while leaving its local stitching source untested.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'reversible-uniform-cloth' }, { type: 'flag', operation: 'add', flagId: 'black-thread-secured' }], outcome: 'The cloth joins the evidence case with both colors visible through a clear folded sleeve.' },
      { id: 'ch03-choice-question-redwater-sailmakers', label: 'Question Redwater sailmakers', detail: 'Seek the stitcher behind the disguise while risking word of the inquiry reaching the network.', effects: [{ type: 'flag', operation: 'add', flagId: 'sailmaker-lead-opened' }, { type: 'threat', amount: 1 }], outcome: 'A sailmaker recognizes the stitch but says the order came with iron-dusted thread from northern foundry caravans.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-levee-before-storm', chapterId: 'ch03', region: 'drowned-road', slot: 39,
    type: 'journey', family: 'storm-levee', journeySubtype: 'travel', weight: 85, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-the-levee-before-storm', title: 'The Levee Before Storm',
    narrative: [
      'Wind drives waves over the low levee while Redwater\'s ridge appears and disappears through rain. The raised path is fast but narrow enough for one rider at a time.',
      'A farm lane below offers cover from arrows, yet the water is already lifting fence posts from the mud.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-take-the-open-levee', label: 'Take the open levee', detail: 'Reach Redwater before the storm peak while crossing in full view of both scout lines.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-levee-route' }, { type: 'threat', amount: 2 }], outcome: 'The party reaches the stone marker quickly as signal flags rise from camps on both banks.' },
      { id: 'ch03-choice-use-the-flooded-farm-lane', label: 'Use the flooded farm lane', detail: 'Travel under hedge cover while risking deep water, floating debris, and a late arrival.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-farm-route' }, { type: 'vitals', health: -2 }, { type: 'tension', amount: 1 }], outcome: 'You emerge below Redwater after dark with mud to the waist and the evidence case still sealed.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-night-ferry', chapterId: 'ch03', region: 'drowned-road', slot: 40,
    type: 'journey', family: 'night-ferry', journeySubtype: 'travel', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch03-journey-the-night-ferry', title: 'The Night Ferry',
    narrative: [
      'The final ferry moves by a rope stretched just above black water. Unlit boats have struck floating timber here, while lanterns draw warning shots from nervous sentries.',
      'The ferryman will obey either order. He asks only that someone take responsibility for the families waiting behind your party.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-cross-with-shielded-lanterns', label: 'Cross with shielded lanterns', detail: 'See the debris and risk being challenged by every armed post along the river.', effects: [{ type: 'flag', operation: 'add', flagId: 'night-ferry-lit' }, { type: 'tension', amount: 1 }], outcome: 'The boat clears two logs before both pickets order it to halt, giving you time to name the neutral crossing.' },
      { id: 'ch03-choice-cross-in-complete-darkness', label: 'Cross in complete darkness', detail: 'Avoid the sentries while trusting the ferry rope and the boatman\'s memory of the current.', effects: [{ type: 'flag', operation: 'add', flagId: 'night-ferry-dark' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: -1 }], outcome: 'A floating beam strikes the hull, but the ferry reaches the far bank without drawing a shot.' },
    ],
  }),
  defineScene({
    id: 'ch03-journey-the-redwater-roadbook', chapterId: 'ch03', region: 'drowned-road', slot: 41,
    type: 'journey', family: 'roadbook-cipher', journeySubtype: 'investigation', weight: 90, pacing: 'quiet',
    illustrationId: 'scene-ch03-journey-the-redwater-roadbook', title: 'The Redwater Roadbook',
    narrative: [
      'A dead dispatch rider carries a roadbook listing both armies\' patrol changes in the same shorthand. The final page records a delivery called ember stock through Redwater\'s north warehouse.',
      'The book can be shown immediately to Reeve Holt, or kept sealed until the officers commit their own orders to the record.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: ['ch04-main-two-armies-one-field'], callbackPromises: [], choices: [
      { id: 'ch03-choice-give-the-roadbook-to-holt', label: 'Give the roadbook to Reeve Holt', detail: 'Place the new evidence in civilian custody before either army can claim or suppress it.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'redwater-roadbook' }, { type: 'flag', operation: 'add', flagId: 'roadbook-in-civilian-custody' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Holt locks the roadbook in the town grain scale, where three guild witnesses hold separate keys.' },
      { id: 'ch03-choice-seal-the-roadbook-until-parley', label: 'Seal the roadbook until parley', detail: 'Preserve surprise for questioning while leaving the only copy in your exposed custody.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'redwater-roadbook' }, { type: 'flag', operation: 'add', flagId: 'roadbook-held-for-parley' }, { type: 'threat', amount: 1 }], outcome: 'The roadbook enters your evidence case before the gates close and no officer learns what it contains.' },
    ],
  }),
]);
