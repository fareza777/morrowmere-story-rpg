import { defineScene } from '../../builders';

export const CH05_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch05-journey-the-e17-road', chapterId: 'ch05', region: 'embervault', slot: 2,
    type: 'journey', journeySubtype: 'travel', family: 'shipment-pursuit', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-e17-road', title: 'The E-17 Road',
    narrative: ['The E-17 shipment code leads from Redwater into a narrow mining road scored by heavy carts. Fresh horse tracks leave it toward a signal post above the valley.', 'Following the carts reaches Embervault quickly; climbing to the post may stop a warning but gives the convoy more time to unload.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-stay-on-the-e17-cart-road', label: 'Stay on the E-17 cart road', detail: 'Reach the mine before the latest shipment clears, but let the hill signaler report your approach.', effects: [{ type: 'flag', operation: 'add', flagId: 'e17-carts-pursued' }, { type: 'threat', amount: 1 }], outcome: 'The party follows fresh iron ruts until Embervault\'s chained gate appears between the cliffs.' },
      { id: 'ch05-choice-climb-to-the-signal-post', label: 'Climb to the signal post', detail: 'Delay the mine approach to stop a warning, risking that evidence is moved before you arrive.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-signal-post-silenced' }, { type: 'tension', amount: 1 }], outcome: 'You find the post abandoned after cutting its bell rope, with one signal slate still warm.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-across-furnace-ridge', chapterId: 'ch05', region: 'embervault', slot: 4,
    type: 'journey', journeySubtype: 'travel', family: 'mine-approach', weight: 14, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-across-furnace-ridge', title: 'Across Furnace Ridge',
    narrative: ['An old rail line crosses Furnace Ridge above the main gate. Its trestle is intact but visible from every guard tower.', 'A miners\' footpath stays below the ridge in sulphur fog, where footing is poor and sentries cannot see far.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-cross-the-rail-trestle', label: 'Cross the rail trestle', detail: 'Use firm ground and gain time, but remain visible to the Embervault towers throughout the crossing.', effects: [{ type: 'flag', operation: 'add', flagId: 'furnace-ridge-crossed-high' }, { type: 'threat', amount: 1 }], outcome: 'The trestle carries the party safely while a tower shutter opens above the mine yard.' },
      { id: 'ch05-choice-take-the-sulphur-footpath', label: 'Take the sulphur footpath', detail: 'Stay below the sentries, but risk burns and exhaustion in the hot fog.', effects: [{ type: 'vitals', health: -2, resource: -1 }, { type: 'flag', operation: 'add', flagId: 'furnace-ridge-crossed-low' }], outcome: 'The footpath reaches the ore drains unseen, with yellow dust coating every boot.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-ore-cart-descent', chapterId: 'ch05', region: 'embervault', slot: 8,
    type: 'journey', journeySubtype: 'travel', family: 'mine-descent', weight: 15, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-ore-cart-descent', title: 'The Ore-Cart Descent',
    narrative: ['A brake cart descends from the shift board to the lower workshops every ten minutes. The rail offers speed, but its chain announces every arrival.', 'A service stair follows the same shaft behind locked doors and takes twice as long.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-ride-the-brake-cart', label: 'Ride the brake cart', detail: 'Reach the lower workshops quickly, but alert the receiving crew when the rail chain rings.', effects: [{ type: 'flag', operation: 'add', flagId: 'lower-mine-reached-by-cart' }, { type: 'threat', amount: 1 }], outcome: 'The cart drops through heat and darkness before stopping hard beside the workshop platform.' },
      { id: 'ch05-choice-pick-the-service-stair-locks', label: 'Pick the service-stair locks', detail: 'Descend without announcing the party, but spend time opening three secured landings.', effects: [{ type: 'flag', operation: 'add', flagId: 'lower-mine-reached-by-stair' }, { type: 'tension', amount: 1 }], outcome: 'Each lock opens quietly, and the stair ends behind the guards assigned to the cart platform.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-shift-change-catwalk', chapterId: 'ch05', region: 'embervault', slot: 10,
    type: 'journey', journeySubtype: 'travel', family: 'shift-movement', weight: 13, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-the-shift-change-catwalk', title: 'The Shift-Change Catwalk',
    narrative: ['Workers cross a steel catwalk in numbered groups while guards check meal tokens below. Joining the crowd conceals the party but places workers beside any fight.', 'A maintenance pipe reaches the far gallery above the catwalk with no railing and no witnesses.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-join-the-shift-change', label: 'Join the shift change', detail: 'Use the workers as cover, but risk drawing armed attention into a crowded line.', effects: [{ type: 'flag', operation: 'add', flagId: 'shift-catwalk-crossed-in-crowd' }, { type: 'threat', amount: -1 }], outcome: 'Dessa lends spare caps, and the party crosses while guards count tokens instead of faces.' },
      { id: 'ch05-choice-cross-the-maintenance-pipe', label: 'Cross the maintenance pipe', detail: 'Keep workers away from danger, but risk a long fall above the furnace gallery.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'shift-catwalk-bypassed' }], outcome: 'The pipe bends under the last crossing and holds until everyone reaches the far gallery.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-die-change-bell', chapterId: 'ch05', region: 'embervault', slot: 14,
    type: 'journey', journeySubtype: 'investigation', family: 'forge-procedure', weight: 19, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-the-die-change-bell', title: 'The Die-Change Bell',
    narrative: ['The hidden forge rings once for human weapon dies and twice for orc patterns. A slate beside the bell records equal production hours for both lines.', 'The slate names only batch numbers. The bell keeper knows who ordered each change but fears the guards holding his family.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-preserve-the-production-slate', label: 'Preserve the production slate', detail: 'Secure the equal production record, but leave the bell keeper without immediate protection.', effects: [{ type: 'flag', operation: 'add', flagId: 'paired-production-slate-recovered' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }], outcome: 'Jory wraps the slate and copies the bell code beside each numbered furnace batch.' },
      { id: 'ch05-choice-move-the-bell-keeper-to-safety', label: 'Move the bell keeper to safety', detail: 'Gain a living witness, but give guards time to remove the slate from the forge station.', effects: [{ type: 'flag', operation: 'add', flagId: 'bell-keeper-protected' }, { type: 'tension', amount: 1 }], outcome: 'The bell keeper leaves through the ore gallery and names the ledger room before he goes.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-trapped-surveyor', chapterId: 'ch05', region: 'embervault', slot: 15,
    type: 'journey', journeySubtype: 'side-quest', family: 'worker-rescue', weight: 12, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-trapped-surveyor', title: 'The Trapped Surveyor',
    narrative: ['A surveyor is pinned beneath a fallen beam near the false wall. His map shows an accounting vault omitted from the official mine plan.', 'Lifting the beam risks another collapse. Taking the map and leaving him preserves the route but loses the only person who can explain its marks.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-lift-the-surveyors-beam', label: 'Lift the surveyor\'s beam', detail: 'Risk injury and noise to save the mapmaker who knows the hidden accounting route.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'embervault-surveyor-rescued' }], outcome: 'The beam rises enough for workers to pull him free, and he marks the shortest vault approach.' },
      { id: 'ch05-choice-take-the-survey-map', label: 'Take the survey map', detail: 'Leave before the roof shifts again, but abandon the injured witness beneath the beam.', effects: [{ type: 'flag', operation: 'add', flagId: 'hidden-vault-map-recovered' }, { type: 'tension', amount: 1 }], outcome: 'You take the map as dust falls from the roof and the surveyor calls out one final correction.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-ventilation-gallery', chapterId: 'ch05', region: 'embervault', slot: 17,
    type: 'journey', journeySubtype: 'dungeon', family: 'mine-infiltration', weight: 10, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch05-journey-the-ventilation-gallery', title: 'The Ventilation Gallery',
    narrative: ['A narrow ventilation gallery runs above the hidden forge. Rusted fan blades turn below, driven by the same waterwheel that powers the stamping hammers.', 'The fan can be stopped for a safe crossing, reducing air to the workers, or crossed while moving before patrol lanterns return.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-stop-the-ventilation-fan', label: 'Stop the ventilation fan', detail: 'Cross safely and quietly, but reduce fresh air in the occupied forge until the wheel restarts.', effects: [{ type: 'flag', operation: 'add', flagId: 'ventilation-fan-stopped' }, { type: 'tension', amount: 1 }], outcome: 'The blades slow to a stop, and workers below look up as the forge air grows still.' },
      { id: 'ch05-choice-cross-between-moving-blades', label: 'Cross between moving blades', detail: 'Keep air flowing for the workers, but risk serious injury above the forge floor.', effects: [{ type: 'vitals', health: -4 }, { type: 'flag', operation: 'add', flagId: 'ventilation-crossed-live' }], outcome: 'The last blade passes beneath your boots as the party reaches the far maintenance ledge.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-accounting-vault', chapterId: 'ch05', region: 'embervault', slot: 21,
    type: 'journey', journeySubtype: 'dungeon', family: 'ledger-vault', weight: 11, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-accounting-vault', title: 'The Accounting Vault',
    narrative: ['The accounting vault has two locks and a weighted floor plate beneath the ledger stand. Removing the book without replacing its weight will drop an iron shutter.', 'A stack of blank payroll books can balance the plate. Breaking the shutter first is faster and loud enough to alert the adjoining guard room.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-balance-the-ledger-plate', label: 'Balance the ledger plate', detail: 'Spend time matching the book\'s weight, but remove it without sealing the only exit.', effects: [{ type: 'flag', operation: 'add', flagId: 'ledger-vault-disarmed' }, { type: 'threat', amount: -1 }], outcome: 'The blank books settle the plate, and the ledger lifts without moving the shutter.' },
      { id: 'ch05-choice-break-the-iron-shutter', label: 'Break the iron shutter', detail: 'Create a reliable escape before taking evidence, but alert every guard in the accounting wing.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'ledger-vault-forced' }, { type: 'threat', amount: 2 }], outcome: 'The shutter guide bends under repeated blows, and boots begin running beyond the vault door.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-ink-from-three-offices', chapterId: 'ch05', region: 'embervault', slot: 24,
    type: 'journey', journeySubtype: 'investigation', family: 'payment-audit', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-ink-from-three-offices', title: 'Ink from Three Offices',
    narrative: ['The ledger uses three official ink colors, yet every authorization line carries the same iron grit from Embervault water. The documents were written here and distributed as separate orders.', 'Preserving the inkwells links the offices physically. Following the clerk\'s corrections may identify the authorization file hidden elsewhere.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-seal-the-three-inkwells', label: 'Seal the three inkwells', detail: 'Carry fragile physical samples, but preserve proof that the separate offices shared one writing room.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-ink-samples-sealed' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'Lyra seals each well beside a matching line and signs across the wrappings.' },
      { id: 'ch05-choice-follow-the-clerks-corrections', label: 'Follow the clerk\'s corrections', detail: 'Pursue the hidden authorization file, but leave the fragile ink comparison behind.', effects: [{ type: 'flag', operation: 'add', flagId: 'authorization-file-traced' }, { type: 'threat', amount: 1 }], outcome: 'Repeated correction marks lead from the ledger to a numbered floor stone in the forge office.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-heat-number-audit', chapterId: 'ch05', region: 'embervault', slot: 28,
    type: 'journey', journeySubtype: 'investigation', family: 'weapon-audit', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-the-heat-number-audit', title: 'The Heat-Number Audit',
    narrative: ['Each weapon rack carries a chalk heat number. Human spears and orc axes share six batches poured on the same nights by the same shift.', 'Dessa can authenticate the numbers in writing, or one matched weapon pair can be carried out as a compact physical example.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-record-all-six-heat-batches', label: 'Record all six heat batches', detail: 'Create a complete production comparison, but spend time auditing racks during the alarm.', effects: [{ type: 'flag', operation: 'add', flagId: 'six-heat-batches-recorded' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'threat', amount: 1 }], outcome: 'Dessa signs each paired batch while Jory copies its date, shift, and delivery code.' },
      { id: 'ch05-choice-carry-one-matched-weapon-pair', label: 'Carry one matched weapon pair', detail: 'Leave with clear physical proof quickly, but reduce the breadth of the production record.', effects: [{ type: 'flag', operation: 'add', flagId: 'matched-weapon-pair-recovered' }, { type: 'evidence', operation: 'add', evidenceId: 'paired-cache-kit' }], outcome: 'You bind one spear socket and one axe collar around the same furnace plate for transport.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-cold-armory', chapterId: 'ch05', region: 'embervault', slot: 30,
    type: 'journey', journeySubtype: 'dungeon', family: 'sealed-armory', weight: 11, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-cold-armory', title: 'The Cold Armory',
    narrative: ['A disused cooling chamber holds finished weapons beneath sheets of frost from a damaged ward. The cold preserves labels that guards tried to wash from the crates.', 'Breaking the ward warms the room and may erase ink. Working inside it preserves the labels at the cost of strength and time.'],
    eligibility: { routes: ['ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-work-inside-the-cold-ward', label: 'Work inside the cold ward', detail: 'Preserve every shipment label, but risk exhaustion while reading crates in freezing air.', effects: [{ type: 'vitals', health: -3, resource: -2 }, { type: 'flag', operation: 'add', flagId: 'cold-armory-labels-preserved' }], outcome: 'The party copies destination codes before retreating from the chamber with numb hands.' },
      { id: 'ch05-choice-break-the-cooling-anchor', label: 'Break the cooling anchor', detail: 'Search the room safely, but risk thawing water through the remaining ink and paper labels.', effects: [{ type: 'flag', operation: 'add', flagId: 'cold-armory-ward-broken' }, { type: 'tension', amount: -1 }], outcome: 'Warm air returns as labels begin to run, leaving several crate brands still readable.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-smugglers-wife', chapterId: 'ch05', region: 'embervault', slot: 31,
    type: 'journey', journeySubtype: 'side-quest', family: 'hostage-source', weight: 13, pacing: 'quiet',
    illustrationId: 'scene-ch05-journey-the-smugglers-wife', title: 'The Smuggler\'s Wife',
    narrative: ['A cart smuggler finds his wife\'s name on the hostage list and offers a tunnel key in exchange for immediate help. The key opens a route beside the powder store.', 'Using it for the evidence party may strand the hostage rescue. Returning it preserves her escape route but leaves the armory door guarded.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-return-the-tunnel-key', label: 'Return the tunnel key', detail: 'Preserve the hostage escape route, but face the guarded armory without the smuggler\'s entrance.', effects: [{ type: 'flag', operation: 'add', flagId: 'smuggler-family-route-protected' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 3 }], outcome: 'The smuggler takes the key to Caldus and promises to guide every hostage through the tunnel.' },
      { id: 'ch05-choice-use-the-key-for-the-armory', label: 'Use the key for the armory', detail: 'Reach weapon records from behind, but force the hostages toward a slower guarded exit.', effects: [{ type: 'flag', operation: 'add', flagId: 'smuggler-key-used-on-armory' }, { type: 'threat', amount: -1 }], outcome: 'The key opens a powder-store passage that ends behind the armory loading rail.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-waterwheel-tunnel', chapterId: 'ch05', region: 'embervault', slot: 32,
    type: 'journey', journeySubtype: 'dungeon', family: 'forge-machinery', weight: 10, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-waterwheel-tunnel', title: 'The Waterwheel Tunnel',
    narrative: ['The forge waterwheel turns inside a stone tunnel crossed by one narrow maintenance bridge. Stopping it disables the stamping line and ventilation together.', 'Crossing while it runs keeps air moving for workers but leaves the bridge shaking beneath the party.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-jam-the-waterwheel-gears', label: 'Jam the waterwheel gears', detail: 'Disable weapon production before crossing, but cut ventilation to occupied galleries.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-production-disabled' }, { type: 'tension', amount: 1 }], outcome: 'The wheel stops with a deep impact, and every stamping hammer falls silent above.' },
      { id: 'ch05-choice-cross-the-shaking-bridge', label: 'Cross the shaking bridge', detail: 'Keep air moving for the workers, but risk a fall beside the turning wheel.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'waterwheel-crossed-live' }], outcome: 'The bridge shifts under each step and holds until the party reaches the authorization stair.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-ledger-or-medicine', chapterId: 'ch05', region: 'embervault', slot: 37,
    type: 'journey', journeySubtype: 'moral-choice', family: 'evidence-cost', weight: 17, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-ledger-or-medicine', title: 'Ledger or Medicine',
    narrative: ['A wounded forge witness cannot climb the cinder shaft without medicine. The only intact case also protects the authorization pages from heat and water.', 'Using it for treatment keeps the witness alive and exposes the papers; keeping it sealed protects the evidence while the witness weakens.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-open-the-case-for-the-witness', label: 'Open the case for the witness', detail: 'Treat a living source, but carry the authorization pages through heat without their sealed protection.', effects: [{ type: 'flag', operation: 'add', flagId: 'forge-witness-treated' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'threat', amount: 1 }], outcome: 'Caldus treats the witness while Jory wraps the papers in spare cloth beneath his coat.' },
      { id: 'ch05-choice-seal-the-authorization-pages', label: 'Seal the authorization pages', detail: 'Protect the strongest documents, but leave the wounded witness with only basic bandages.', effects: [{ type: 'flag', operation: 'add', flagId: 'voss-documents-heat-sealed' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'The case closes around the papers as workers carry the fading witness toward the shaft.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-last-missing-smith', chapterId: 'ch05', region: 'embervault', slot: 38,
    type: 'journey', journeySubtype: 'side-quest', family: 'worker-rescue', weight: 12, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-last-missing-smith', title: 'The Last Missing Smith',
    narrative: ['Dessa counts one smith missing after the forge evacuation. His hammer marks appear on the authorization chest, and he may know who delivered Voss\'s signed order.', 'His station lies beyond a gallery prepared for demolition. Searching it delays the cinder-shaft escape as charges burn closer.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-search-for-the-missing-smith', label: 'Search for the missing smith', detail: 'Enter the demolition gallery for a witness, risking the evidence party as the charges burn.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'last-embervault-smith-rescued' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }], outcome: 'You find him locked inside a tool cage with the delivery officer\'s name scratched on his hammer.' },
      { id: 'ch05-choice-leave-before-the-charges-fire', label: 'Leave before the charges fire', detail: 'Protect the rescued group and ledger, but abandon the last smith beyond the marked gallery.', effects: [{ type: 'flag', operation: 'add', flagId: 'last-smith-left-behind' }, { type: 'threat', amount: -1 }], outcome: 'Dessa closes the count with one name missing and leads the remaining workers toward the shaft.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-charges-and-the-witnesses', chapterId: 'ch05', region: 'embervault', slot: 40,
    type: 'journey', journeySubtype: 'moral-choice', family: 'collapse-choice', weight: 18, pacing: 'danger',
    illustrationId: 'scene-ch05-journey-the-charges-and-the-witnesses', title: 'The Charges and the Witnesses',
    narrative: ['A demolition cord runs toward the worker dormitory and the evidence vault from one firing box. Cutting either branch leaves the other live.', 'Workers can evacuate the dormitory if warned now. The vault holds duplicate records that could recover proof if the carried ledger is lost.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-cut-the-dormitory-charge', label: 'Cut the dormitory charge', detail: 'Protect sleeping workers, but let the duplicate evidence vault collapse during the escape.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-dormitory-saved' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The dormitory cord falls dead while a deep blast closes the distant evidence vault.' },
      { id: 'ch05-choice-cut-the-vault-charge', label: 'Cut the vault charge', detail: 'Preserve a recovery copy of the records, but force workers to flee the dormitory under warning bells.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-recovery-vault-saved' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger-copy' }, { type: 'tension', amount: 1 }], outcome: 'The vault cord goes slack as Dessa sounds the dormitory bell and workers run for the ore stairs.' },
    ],
  }),
  defineScene({
    id: 'ch05-journey-the-cinder-feeder-shaft', chapterId: 'ch05', region: 'embervault', slot: 41,
    type: 'journey', journeySubtype: 'dungeon', family: 'escape-shaft', weight: 12, pacing: 'danger', threatChange: 2,
    illustrationId: 'scene-ch05-journey-the-cinder-feeder-shaft', title: 'The Cinder-Feeder Shaft',
    narrative: ['The cinder feeder climbs beside hot exhaust ducts and ends at a ladder missing its lower rungs. A coal lift can raise people quickly if its damaged brake holds.', 'Repairing the ladder is slower and reliable. Using the lift moves witnesses before demolition crews reach the shaft.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: ['ch05-main-escape-through-the-cinder-shaft'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-repair-the-cinder-ladder', label: 'Repair the cinder ladder', detail: 'Create a dependable escape for everyone, but remain longer beside the hot exhaust ducts.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'cinder-ladder-repaired' }, { type: 'tension', amount: 1 }], outcome: 'Ore-cart braces replace the missing rungs, and the first witnesses begin the steady climb.' },
      { id: 'ch05-choice-use-the-damaged-coal-lift', label: 'Use the damaged coal lift', detail: 'Move witnesses quickly, but risk the brake failing with people above the furnace exhaust.', effects: [{ type: 'flag', operation: 'add', flagId: 'coal-lift-used-for-escape' }, { type: 'threat', amount: -1 }], outcome: 'The lift shudders up the shaft and stops hard at the surface landing without losing its load.' },
    ],
  }),
]);
