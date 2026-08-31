import { defineScene } from '../../builders';

export const CH04_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch04-journey-the-evacuation-lane', chapterId: 'ch04', region: 'drowned-road', slot: 2,
    type: 'journey', family: 'evacuation-lane', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-the-evacuation-lane', title: 'The Evacuation Lane',
    narrative: [
      'Redwater marks one lane between the army camps with white fence cloth so families can reach the palisade. Greywatch wagons begin using it to move spear bundles closer to the field.',
      'Clearing the wagons protects the civilian route but challenges Roake\'s logistics. Opening a second lane through the orchard is faster and less defensible.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-clear-the-marked-lane', label: 'Clear the marked lane', detail: 'Order Greywatch supplies aside and preserve the only route already trusted by civilians.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-evacuation-lane-kept' }, { type: 'faction', factionId: 'greywatch', amount: -2 }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'The spear wagons move to the meadow, and families continue through the white markers without mixing with soldiers.' },
      { id: 'ch04-choice-open-the-orchard-lane', label: 'Open the orchard lane', detail: 'Create a second path quickly while sending families through ground neither army has searched.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-orchard-lane-opened' }, { type: 'threat', amount: 1 }], outcome: 'Town wardens cut a path through the hedges, but fresh boot marks show that others used it first.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-stones-across-the-millrace', chapterId: 'ch04', region: 'drowned-road', slot: 5,
    type: 'journey', family: 'millrace-crossing', journeySubtype: 'travel', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-stones-across-the-millrace', title: 'Stones Across the Millrace',
    narrative: [
      'The shortest route to the parley crosses stepping stones below the mill sluice. Free Host sentries can see the water but not the Greywatch archers behind the eastern grain wall.',
      'The public bridge adds half a mile through the civilian market. The stones save time while making every slip look like a sudden attack.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-cross-the-open-stepping-stones', label: 'Cross the open stepping stones', detail: 'Reach the parley quickly while trusting both sentry lines to recognize the white sash.', effects: [{ type: 'flag', operation: 'add', flagId: 'millrace-stones-crossed' }, { type: 'threat', amount: 1 }], outcome: 'You cross within bowshot of both lines, and neither side wants to be the first to loose an arrow.' },
      { id: 'ch04-choice-take-the-market-bridge', label: 'Take the market bridge', detail: 'Use the safe civilian crossing and arrive after the commanders have begun arguing without you.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-market-bridge-used' }, { type: 'tension', amount: 1 }], outcome: 'The bridge is crowded but secure, and Holt delays the formal parley until your evidence case arrives.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-camp-supply-ledger', chapterId: 'ch04', region: 'drowned-road', slot: 9,
    type: 'journey', family: 'supply-ledger', journeySubtype: 'investigation', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-the-camp-supply-ledger', title: 'The Camp Supply Ledger',
    narrative: [
      'A Greywatch supply ledger records lamp oil delivered to the Free Host camp, while Brakka\'s matching ledger records the same barrels delivered east. Neither quartermaster signed the entries.',
      'The duplicate pages share a water stain shaped like the Redwater north pier. Comparing originals may expose the source, but removing them will interrupt rations in both camps.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-seize-both-ledger-pages', label: 'Seize both ledger pages', detail: 'Secure original proof while forcing two camp kitchens to rebuild their ration accounts.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'paired-camp-ledgers' }, { type: 'tension', amount: 1 }], outcome: 'The pages align stain for stain, showing that both were copied beside the same north-pier leak.' },
      { id: 'ch04-choice-make-witnessed-rubbings', label: 'Make witnessed rubbings', detail: 'Leave the ration books in service and rely on certified copies for the inquiry.', effects: [{ type: 'flag', operation: 'add', flagId: 'camp-ledger-rubbings' }, { type: 'faction', factionId: 'greywatch', amount: 1 }, { type: 'faction', factionId: 'free-host', amount: 1 }], outcome: 'Two cooks and a town clerk sign the rubbings before the ledgers return to their separate camp tables.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-white-flag-path', chapterId: 'ch04', region: 'drowned-road', slot: 12,
    type: 'journey', family: 'white-flag-path', journeySubtype: 'travel', weight: 70, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-the-white-flag-path', title: 'The White-Flag Path',
    narrative: [
      'Town wardens repaint the path between the hospital and both camps with white lime. Rain will erase it by evening, and impatient patrols are already crossing the marks.',
      'Posting armed guards makes the route clear but military. Asking guild volunteers to hold it preserves neutrality while placing civilians beside nervous soldiers.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-post-matched-armed-guards', label: 'Post matched armed guards', detail: 'Use equal soldiers from both camps to secure the hospital route and test their discipline.', effects: [{ type: 'flag', operation: 'add', flagId: 'white-path-joint-guard' }, { type: 'tension', amount: -1 }], outcome: 'One human and one orc guard stand at every turn, forcing patrols to acknowledge the same rules.' },
      { id: 'ch04-choice-post-redwater-guild-volunteers', label: 'Post Redwater guild volunteers', detail: 'Keep the route under civilian control while exposing unarmored townspeople to military anger.', effects: [{ type: 'flag', operation: 'add', flagId: 'white-path-civilian-guard' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Millers and coopers hold the lime path with ledger boards instead of weapons, and the patrols step aside.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-red-clay-back-to-the-quarry', chapterId: 'ch04', region: 'drowned-road', slot: 15,
    type: 'journey', family: 'quarry-clay-trail', journeySubtype: 'investigation', weight: 85, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-red-clay-back-to-the-quarry', title: 'Red Clay Back to the Quarry',
    narrative: [
      'Aven Pell\'s boot clay leads to an east-bank quarry shed used by Greywatch labor details. Inside, a wash basin is stained red and one floorboard has been scrubbed with lamp oil.',
      'The quarry foreman offers his shift roll if his workers receive protection. Searching the scrubbed floor may find direct evidence but alert whoever still watches the shed.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-protect-the-quarry-workers', label: 'Protect the quarry workers', detail: 'Commit town guards to vulnerable laborers and gain a complete record of who entered the shed.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'quarry-shift-roll' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'The roll lists a false labor gang admitted with a Greywatch stores token on the night Pell died.' },
      { id: 'ch04-choice-lift-the-scrubbed-floorboard', label: 'Lift the scrubbed floorboard', detail: 'Search for physical traces immediately while leaving the frightened workers without protection.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'pell-murder-cloth' }, { type: 'flag', operation: 'add', flagId: 'quarry-floor-searched' }], outcome: 'Beneath the board lies a bloodied cloak clasp filed smooth where a unit number once stood.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-two-grieving-mothers', chapterId: 'ch04', region: 'drowned-road', slot: 17,
    type: 'journey', family: 'grieving-families', journeySubtype: 'moral-choice', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-the-two-grieving-mothers', title: 'The Two Grieving Mothers',
    narrative: [
      'Pell\'s mother reaches the field as an orc mother searches for a son missing from the same night patrol. Each has been told the other army killed her child.',
      'The inquiry can release the staged-murder details now, before the orc fighter is found, or keep the evidence sealed until every family receives a confirmed account.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-tell-both-families-what-is-known', label: 'Tell both families what is known', detail: 'Share incomplete but honest evidence and risk new rumor filling the unanswered parts.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-families-briefed' }, { type: 'tension', amount: -1 }], outcome: 'Both women hear that Pell was moved and that the missing fighter may still be alive, ending one false accusation.' },
      { id: 'ch04-choice-wait-for-a-complete-account', label: 'Wait for a complete account', detail: 'Protect the inquiry from partial claims while asking grieving families to endure official silence.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-family-briefing-delayed' }, { type: 'faction', factionId: 'border-council', amount: -1 }], outcome: 'The mothers leave separately, and camp speakers repeat the old accusations before sunset.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-beneath-the-mill-drains', chapterId: 'ch04', region: 'drowned-road', slot: 19,
    type: 'journey', family: 'mill-drain-tunnels', journeySubtype: 'dungeon', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-beneath-the-mill-drains', title: 'Beneath the Mill Drains',
    narrative: [
      'A drainage tunnel runs from the millrace beneath both command fields. Fresh boot scrapes, candle ends, and bundled signal horns show how agents moved without crossing either sentry line.',
      'One branch leads toward the south tower; another slopes down to a chamber where rushing water is erasing papers from a stone table.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-follow-the-south-tower-branch', label: 'Follow the south-tower branch', detail: 'Trace the active escape route while allowing water to destroy the abandoned papers.', effects: [{ type: 'flag', operation: 'add', flagId: 'south-tower-tunnel-mapped' }, { type: 'threat', amount: 2 }], outcome: 'The tunnel ends behind a false grain bin within bowshot of the empty tower.' },
      { id: 'ch04-choice-salvage-the-drowned-papers', label: 'Salvage the drowned papers', detail: 'Recover the conspiracy\'s notes while giving anyone in the south branch time to escape.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'mill-drain-signal-plan' }, { type: 'vitals', health: -3 }], outcome: 'Three legible pages list matching horn and fire signals timed to move both armies at once.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-seals-on-the-north-warehouse', chapterId: 'ch04', region: 'drowned-road', slot: 22,
    type: 'journey', family: 'warehouse-seals', journeySubtype: 'investigation', weight: 85, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-seals-on-the-north-warehouse', title: 'Seals on the North Warehouse',
    narrative: [
      'The north warehouse door carries a fresh town seal over an older Greywatch mark. Beneath both, Lyra finds the square outline of a Free Host customs stamp that should never have crossed the river.',
      'Opening the door under all three witnesses preserves legitimacy. Entering through the loose roof tile may catch anyone still destroying records inside.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-assemble-three-seal-witnesses', label: 'Assemble three seal witnesses', detail: 'Delay entry until town and both armies can certify every broken mark together.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-warehouse-lawful-entry' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Holt, Roake, and Brakka each send a witness who records the layered seals before the lock opens.' },
      { id: 'ch04-choice-enter-through-the-roof-tile', label: 'Enter through the roof tile', detail: 'Preserve surprise inside while risking claims that evidence was planted during an unwitnessed search.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-warehouse-quiet-entry' }, { type: 'threat', amount: -1 }], outcome: 'You drop behind stacked barrels and hear someone tearing pages beyond the partition.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-missing-bakers', chapterId: 'ch04', region: 'drowned-road', slot: 24,
    type: 'journey', family: 'missing-bakers', journeySubtype: 'side-quest', weight: 65, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-the-missing-bakers', title: 'The Missing Bakers',
    narrative: [
      'Redwater\'s bakers vanish while carrying noon bread to the army camps. Their empty cart stands beside a lane recently closed by Free Host stakes and Greywatch warning rope.',
      'Tracks lead toward the tannery, while the untouched bread could keep the hospital fed if taken back immediately.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-follow-the-bakers-tracks', label: 'Follow the bakers\' tracks', detail: 'Search for the missing civilians while leaving the hospital to stretch its remaining food.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-bakers-rescued' }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'threat', amount: 1 }], outcome: 'The bakers are locked in the tannery with orders to claim an orc patrol abducted them.' },
      { id: 'ch04-choice-return-the-bread-cart', label: 'Return the bread cart', detail: 'Protect the hospital ration now while town wardens continue a slower search for the bakers.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-hospital-bread' }, { type: 'tension', amount: -1 }], outcome: 'The bread reaches the wool hall before noon, and Holt sends guild wardens to the tannery after you report the tracks.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-prisoner-at-grain-hall', chapterId: 'ch04', region: 'drowned-road', slot: 29,
    type: 'journey', family: 'grain-hall-prisoner', journeySubtype: 'moral-choice', weight: 75, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-the-prisoner-at-grain-hall', title: 'The Prisoner at Grain Hall',
    narrative: [
      'A captured provocateur offers the name of his pay clerk in exchange for protection from both armies. Families at Grain Hall recognize him as one of the men who fired the evacuation boats.',
      'Holt can promise a public trial and guarded cell. Turning him over for immediate questioning may produce the name faster but risks revenge replacing testimony.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-promise-a-public-trial', label: 'Promise a public trial', detail: 'Protect an unpopular prisoner long enough to testify and accept anger from bereaved families.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'provocateur-pay-clerk-testimony' }, { type: 'flag', operation: 'add', flagId: 'redwater-public-trial-promised' }, { type: 'faction', factionId: 'border-council', amount: -1 }], outcome: 'The prisoner names a north-warehouse clerk and repeats the claim before three civilian witnesses.' },
      { id: 'ch04-choice-permit-military-questioning', label: 'Permit military questioning', detail: 'Seek the pay clerk quickly while placing the suspect among soldiers he helped deceive.', effects: [{ type: 'flag', operation: 'add', flagId: 'provocateur-military-questioned' }, { type: 'faction', factionId: 'greywatch', amount: 1 }, { type: 'faction', factionId: 'free-host', amount: 1 }, { type: 'tension', amount: 1 }], outcome: 'The questioning produces a warehouse number, but the prisoner refuses to sign it after a guard strikes him.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-north-warehouse-cellar', chapterId: 'ch04', region: 'drowned-road', slot: 31,
    type: 'journey', family: 'warehouse-cellar', journeySubtype: 'dungeon', weight: 90, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-the-north-warehouse-cellar', title: 'The North Warehouse Cellar',
    narrative: [
      'Below the warehouse, brick vaults hold empty weapon racks, wet uniforms, and six crates labeled as mill bearings. A clerk is burning manifests in a narrow furnace room.',
      'The remaining crates may contain proof of symmetric supply. The clerk may know where the shipments began, but smoke is already filling both chambers.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-seize-the-clerk-alive', label: 'Seize the clerk alive', detail: 'Pursue a living witness through smoke while fire reaches the remaining freight records.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-warehouse-clerk-captured' }, { type: 'evidence', operation: 'add', evidenceId: 'warehouse-clerk-testimony' }, { type: 'vitals', health: -3 }], outcome: 'The clerk surrenders at the coal hatch and admits that identical crates left for both command camps.' },
      { id: 'ch04-choice-drag-out-the-freight-crates', label: 'Drag out the freight crates', detail: 'Preserve physical supply proof while allowing the clerk to escape through the coal hatch.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'paired-redwater-armament' }, { type: 'threat', amount: 1 }], outcome: 'The crates open in the square to reveal unmarked spearheads packed beside both armies\' requisition slips.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-two-captains-one-surgeon', chapterId: 'ch04', region: 'drowned-road', slot: 32,
    type: 'journey', family: 'surgeon-dispute', journeySubtype: 'moral-choice', weight: 70, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-two-captains-one-surgeon', title: 'Two Captains, One Surgeon',
    narrative: [
      'A Greywatch lieutenant and a Free Host shield captain arrive with the same crushed-leg injury. The hospital has one surgeon and enough lamp oil for one immediate operation.',
      'The human arrived first; the orc is more likely to die during the wait. Choosing either by rank will confirm what the other camp already fears.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-treat-the-more-urgent-wound', label: 'Treat the more urgent wound', detail: 'Operate on the orc captain first and ask Greywatch to accept medical need over arrival order.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-triage-by-need' }, { type: 'faction', factionId: 'free-host', amount: 2 }, { type: 'faction', factionId: 'greywatch', amount: -1 }], outcome: 'The surgeon saves the orc\'s leg, then begins the lieutenant\'s operation with dawn light instead of oil.' },
      { id: 'ch04-choice-honor-the-arrival-order', label: 'Honor the arrival order', detail: 'Treat the Greywatch lieutenant first and keep the hospital\'s published queue intact.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-triage-by-arrival' }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'faction', factionId: 'free-host', amount: -1 }], outcome: 'The lieutenant keeps his leg; the shield captain survives the wait but will not walk for months.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-field-of-discarded-shields', chapterId: 'ch04', region: 'drowned-road', slot: 34,
    type: 'journey', family: 'discarded-shield-field', journeySubtype: 'travel', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-field-of-discarded-shields', title: 'Field of Discarded Shields',
    narrative: [
      'After the south-tower fight, abandoned shields litter the wet meadow in Greywatch and Free Host colors. Several hide caltrops placed along the route to the grain sheds.',
      'Clearing the field opens the civilian road but consumes the last quiet hour. Marking a narrow lane gets the party through while leaving traps for anyone behind.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-clear-the-caltrop-field', label: 'Clear the caltrop field', detail: 'Remove every trap for later wagons while remaining exposed near both army lines.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-meadow-cleared' }, { type: 'faction', factionId: 'border-council', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'Town carts cross the meadow safely after your party stacks the marked caltrops beside the road.' },
      { id: 'ch04-choice-mark-one-safe-lane', label: 'Mark one safe lane', detail: 'Move quickly through a tested strip while leaving most hidden traps in the wet grass.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-meadow-lane-marked' }, { type: 'threat', amount: -1 }], outcome: 'The party reaches the sheds without injury, and red stakes warn others away from the uncleared field.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-through-the-water-gate', chapterId: 'ch04', region: 'drowned-road', slot: 36,
    type: 'journey', family: 'water-gate-route', journeySubtype: 'travel', weight: 75, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-through-the-water-gate', title: 'Through the Water Gate',
    narrative: [
      'Redwater\'s north gate is barred after the warehouse fire, leaving the old water gate as the shortest route to the river pier. Its tunnel passes beneath the palisade at shoulder height.',
      'Town guards can drain the tunnel by opening a side channel into flooded gardens, or the party can wade through and leave those homes untouched.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-wade-through-the-water-gate', label: 'Wade through the water gate', detail: 'Accept cold, deep water to protect the nearby gardens from another deliberate flood.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-water-gate-waded' }, { type: 'vitals', health: -2 }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The party emerges soaked at the pier while the garden walls hold against the river.' },
      { id: 'ch04-choice-drain-the-gate-into-gardens', label: 'Drain the gate into gardens', detail: 'Open a dry military route quickly while sacrificing several civilian winter plots.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-gardens-flooded' }, { type: 'threat', amount: -1 }, { type: 'faction', factionId: 'border-council', amount: -2 }], outcome: 'The tunnel clears within minutes, and dark water spreads across rows of late onions and beans.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-north-road-barricade', chapterId: 'ch04', region: 'drowned-road', slot: 37,
    type: 'journey', family: 'north-road-barricade', journeySubtype: 'travel', weight: 80, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-the-north-road-barricade', title: 'The North Road Barricade',
    narrative: [
      'Provocateurs have overturned ore carts across the north road and painted a Free Host warning on one side, Greywatch orders on the other. Refugee wagons cannot pass toward higher ground.',
      'Dismantling the carts saves the road but destroys the staged display. Recording it first keeps proof while the queue grows under exposed slopes.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-clear-the-barricade-at-once', label: 'Clear the barricade at once', detail: 'Open the route for waiting families and lose the strongest two-sided painted example.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-north-road-cleared' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'The first wagons climb north before dark, carrying only a witness sketch of the painted orders.' },
      { id: 'ch04-choice-record-both-painted-orders', label: 'Record both painted orders', detail: 'Preserve the false-flag display under witnesses while civilians wait longer on the open road.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'two-sided-barricade' }, { type: 'tension', amount: 1 }], outcome: 'Clerks copy both faces and their matching brush strokes before laborers roll the carts aside.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-who-pays-for-redwater', chapterId: 'ch04', region: 'drowned-road', slot: 38,
    type: 'journey', family: 'rebuilding-cost', journeySubtype: 'moral-choice', weight: 80, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-who-pays-for-redwater', title: 'Who Pays for Redwater',
    narrative: [
      'Holt presents the first repair account: burned grain sheds, broken ferries, flooded gardens, and wages lost while both armies occupied the fields. Neither command accepts sole responsibility.',
      'Equal payment is simple but burdens the smaller Free Host. Payment by troop count is fairer to capacity and politically humiliating to Greywatch.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-divide-repairs-equally', label: 'Divide repairs equally', detail: 'Make both commands accept the same public share despite their unequal size and resources.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-repairs-split-equally' }, { type: 'faction', factionId: 'free-host', amount: -2 }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Brakka signs after a long silence, committing supply wagons his smaller force can barely spare.' },
      { id: 'ch04-choice-divide-repairs-by-troop-count', label: 'Divide repairs by troop count', detail: 'Charge the larger Greywatch force more and accept resistance from human officers at home.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-repairs-by-strength' }, { type: 'faction', factionId: 'greywatch', amount: -3 }, { type: 'faction', factionId: 'border-council', amount: 4 }], outcome: 'Roake signs the larger account and warns that the council will call it a defeat paid without battle.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-ember-seven-marks', chapterId: 'ch04', region: 'drowned-road', slot: 40,
    type: 'journey', family: 'ember-seven-code', journeySubtype: 'investigation', weight: 90, pacing: 'quiet',
    illustrationId: 'scene-ch04-journey-the-ember-seven-marks', title: 'The Ember Seven Marks',
    narrative: [
      'Crates recovered from the warehouse carry seven shallow burn marks beneath their false mill labels. The same marks appear on iron-bound chests in both army camps.',
      'A river factor says Embervault foundries use burned numerals to route freight after rain destroys ink. The pattern identifies a source without naming who ordered it.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: ['ch04-main-what-the-river-carried-away'], callbackPromises: [], choices: [
      { id: 'ch04-choice-seal-an-ember-seven-plank', label: 'Seal an Ember Seven plank', detail: 'Carry a physical shipping mark toward Embervault while leaving less crate wood for Redwater\'s inquiry.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'ember-seven-crate-mark' }, { type: 'flag', operation: 'add', flagId: 'embervault-freight-source-traced' }], outcome: 'The marked plank enters the case beside the north-pier tallies and the factor\'s signed explanation.' },
      { id: 'ch04-choice-leave-all-crates-with-holt', label: 'Leave all crates with Holt', detail: 'Keep the public inquiry complete and travel with witnessed rubbings instead of original wood.', effects: [{ type: 'flag', operation: 'add', flagId: 'ember-seven-rubbings-carried' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Holt stores the crates under three locks while your copy records every burn mark and false label.' },
    ],
  }),
  defineScene({
    id: 'ch04-journey-the-last-river-families', chapterId: 'ch04', region: 'drowned-road', slot: 41,
    type: 'journey', family: 'last-river-evacuation', journeySubtype: 'side-quest', weight: 70, pacing: 'danger',
    illustrationId: 'scene-ch04-journey-the-last-river-families', title: 'The Last River Families',
    narrative: [
      'Three households remain on a reed island after both armies begin withdrawing. Their boats were taken for the field hospital, and the evening release from the sluice will cover the island.',
      'The inquiry has one fast patrol boat ready to pursue a fleeing warehouse courier. Diverting it can save the families but lose the courier\'s route north.',
    ],
    eligibility: { minLevel: 6, maxLevel: 8 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch04-choice-send-the-patrol-boat-to-island', label: 'Send the patrol boat to the island', detail: 'Rescue the remaining households while letting the warehouse courier widen his lead north.', effects: [{ type: 'flag', operation: 'add', flagId: 'last-river-families-rescued' }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'threat', amount: 1 }], outcome: 'The patrol boat returns overloaded but upright as the island disappears under the released water.' },
      { id: 'ch04-choice-pursue-the-warehouse-courier', label: 'Pursue the warehouse courier', detail: 'Protect the Embervault trail while trusting slower town barges to reach the island in time.', effects: [{ type: 'flag', operation: 'add', flagId: 'warehouse-courier-pursued' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-courier-route' }], outcome: 'The patrol boat catches the courier at the north bend while town barges reach the island near dusk.' },
    ],
  }),
]);
