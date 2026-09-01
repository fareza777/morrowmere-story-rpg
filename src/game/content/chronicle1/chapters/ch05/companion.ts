import { defineScene } from '../../builders';

export const CH05_COMPANION = Object.freeze([
  defineScene({
    id: 'ch05-companion-talla-in-the-shift-tunnels', chapterId: 'ch05', region: 'embervault', slot: 3,
    type: 'companion', family: 'talla-worker-route', relationship: { kind: 'companion', companionId: 'talla' }, weight: 22, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-talla-in-the-shift-tunnels', title: 'Talla in the Shift Tunnels',
    narrative: [
      'Talla finds goblin tally marks beneath the ore chutes. They belong to food carriers who supply coerced workers through old shift tunnels without entering the guarded forge.',
      'Following the marks protects the carriers\' identities but takes a narrow route. Turning the map over to the mine rebels offers more help and exposes every hidden entrance.',
    ],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['talla-met'], excludedFlags: ['talla-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-follow-the-carriers-marks-alone', label: 'Follow the carriers\' marks alone', detail: 'Protect the hidden food route, but enter the shift tunnels without support from the mine rebels.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-carrier-route-protected' }, { type: 'companion-loyalty', companionId: 'talla', amount: 5 }, { type: 'threat', amount: -1 }], outcome: 'Talla erases each mark after the party passes and leaves the carriers\' entrance undisclosed.' },
      { id: 'ch05-choice-share-the-map-with-dessa', label: 'Share the map with Dessa', detail: 'Gain worker guides for the tunnels, but expose a route used by goblin families outside the mine.', effects: [{ type: 'flag', operation: 'add', flagId: 'shift-map-shared-with-workers' }, { type: 'companion-loyalty', companionId: 'talla', amount: -2 }, { type: 'faction', factionId: 'border-council', amount: 1 }], outcome: 'Dessa assigns two guides and promises to close the food entrance after the hidden shift escapes.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-caldus-keeps-confidence', chapterId: 'ch05', region: 'embervault', slot: 9,
    type: 'companion', family: 'caldus-confidence', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 30, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-caldus-keeps-confidence', title: 'Caldus Keeps Confidence',
    narrative: [
      'Caldus reaches Embervault with Redwater\'s relief party. A frightened furnace clerk tells him that guards hold workers\' relatives in a sealed bunkhouse. She will identify the hostage ledger only if her name stays out of the raid report.',
      'Keeping her confidence protects a source and limits immediate questioning. Naming her to Dessa may verify the claim faster but makes the clerk visible to every faction in the mine.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['caldus-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch05-companion-caldus-reads-the-hostage-list'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-keep-the-clerks-confidence', label: 'Keep the clerk\'s confidence', detail: 'Protect her identity and accept slower corroboration before acting on the hostage report.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-confidence-kept' }, { type: 'companion-quest', companionId: 'caldus', stage: 2 }, { type: 'companion-loyalty', companionId: 'caldus', amount: 8 }], outcome: 'Caldus records the bunkhouse mark without her name and arranges a separate check of the meal count.' },
      { id: 'ch05-choice-name-the-clerk-to-dessa', label: 'Name the clerk to Dessa', detail: 'Gain immediate worker confirmation, but break the confidence that brought the warning forward.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-confidence-broken' }, { type: 'companion-quest', companionId: 'caldus', stage: 2 }, { type: 'companion-loyalty', companionId: 'caldus', amount: -8 }], outcome: 'Dessa confirms the bunkhouse and calls guards, while the clerk leaves before Caldus can answer her.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-lyra-and-the-embervault-ward', chapterId: 'ch05', region: 'embervault', slot: 11,
    type: 'companion', family: 'lyra-embervault-ward', relationship: { kind: 'companion', companionId: 'lyra' }, weight: 32, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-lyra-and-the-embervault-ward', title: 'Lyra and the Embervault Ward',
    narrative: [
      'Lyra arrives as the evidence delegation\'s seal examiner. A heat ward seals the service door behind the false wall, and she can overload it with a fast fire spell, but the surge may ignite dust in the worker gallery.',
      'The slower method is mechanical: cool three copper anchors and turn them in order while guards continue their rounds.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['lyra-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch05-companion-lyra-tests-the-ledger-seals'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-cool-the-copper-anchors', label: 'Cool the copper anchors', detail: 'Spend time exposed to patrols, but open the ward without risking workers or evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'dangerous-magic-refused' }, { type: 'flag', operation: 'add', flagId: 'embervault-ward-solved' }, { type: 'companion-quest', companionId: 'lyra', stage: 3 }, { type: 'companion-loyalty', companionId: 'lyra', amount: 9 }, { type: 'threat', amount: 1 }], outcome: 'Lyra turns the cooled anchors by hand, and the door opens without a spark in the dust.' },
      { id: 'ch05-choice-overload-the-heat-ward', label: 'Overload the heat ward', detail: 'Open the door before the patrol returns, but risk a fire through the occupied worker gallery.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-ward-burned-out' }, { type: 'companion-quest', companionId: 'lyra', stage: 3 }, { type: 'companion-loyalty', companionId: 'lyra', amount: -8 }, { type: 'vitals', health: -3 }], outcome: 'The ward bursts in a sheet of heat, and workers beat sparks from their clothes as you enter.' },
    ],
  }),
  defineScene({
    id: 'ch05-faction-forewoman-dessa-testifies', chapterId: 'ch05', region: 'embervault', slot: 16,
    type: 'companion', family: 'forge-testimony', relationship: { kind: 'faction', factionId: 'border-council' }, weight: 28, pacing: 'quiet',
    illustrationId: 'scene-ch05-faction-forewoman-dessa-testifies', title: 'Forewoman Dessa Testifies',
    narrative: [
      'Dessa Krail names every coerced shift leader and explains how the forge alternated human and orc weapon dies. She can testify openly if the workers leave together.',
      'A signed statement travels faster than sixty people, but a paper witness is easier for Voss\'s officers to dismiss as forced or forged.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-plan-a-group-evacuation', label: 'Plan a group evacuation', detail: 'Slow the evidence mission to move every willing witness, risking discovery before the ledger is found.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-witness-evacuation-planned' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'tension', amount: 1 }], outcome: 'Dessa divides the workers into tunnel groups and assigns one witness to each shift record.' },
      { id: 'ch05-choice-take-dessas-signed-statement', label: 'Take Dessa\'s signed statement', detail: 'Preserve testimony without moving the whole shift, but leave most witnesses under guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'dessa-statement-secured' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }], outcome: 'Dessa signs each page with her shift mark and names two smiths who can corroborate it.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-caldus-reads-the-hostage-list', chapterId: 'ch05', region: 'embervault', slot: 18,
    type: 'companion', family: 'caldus-hostage-leverage', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 30, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-caldus-reads-the-hostage-list', title: 'Caldus Reads the Hostage List',
    narrative: [
      'The meal ledger hides a list of workers whose relatives are held in the sealed bunkhouse. Beside several names, an abbey hand records medicine withheld after disobedience.',
      'Caldus recognizes the notation from coerced charity records. Removing the list warns the guards that it was found; copying it costs time near the accounting room.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['caldus-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch05-companion-caldus-the-first-hostages'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-copy-every-hostage-name', label: 'Copy every hostage name', detail: 'Stay long enough to preserve the full list, but risk guards returning to the accounting room.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostage-leverage-found' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 6 }, { type: 'threat', amount: 1 }], outcome: 'Caldus copies each name, relation, medicine mark, and bunk assignment before replacing the ledger.' },
      { id: 'ch05-choice-tear-out-the-hostage-list', label: 'Tear out the hostage list', detail: 'Secure the names immediately, but alert the network that its leverage has been exposed.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostage-leverage-found' }, { type: 'flag', operation: 'add', flagId: 'hostage-list-removed' }, { type: 'threat', amount: 2 }], outcome: 'The stitched page tears free, leaving a visible gap that the next clerk will report.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-lyra-tests-the-ledger-seals', chapterId: 'ch05', region: 'embervault', slot: 23,
    type: 'companion', family: 'lyra-evidence-authentication', relationship: { kind: 'companion', companionId: 'lyra' }, weight: 27, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-lyra-tests-the-ledger-seals', title: 'Lyra Tests the Ledger Seals',
    narrative: [
      'Lyra compares the ledger authorizations to seal impressions collected since Greywatch. The press is genuine, but the same narrow clerk\'s stroke appears beneath wax from three different offices.',
      'She can mark the originals with a harmless reagent or make separate tracings that preserve custody but are easier to challenge.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['lyra-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch05-companion-lyra-chooses-the-slower-truth'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-mark-the-original-seals', label: 'Mark the original seals', detail: 'Strengthen authentication on the ledger itself, but disclose that an expert has examined it.', effects: [{ type: 'flag', operation: 'add', flagId: 'ledger-seals-authenticated' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 4 }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }], outcome: 'A pale line appears only in genuine wax, linking the authorizations without obscuring the writing.' },
      { id: 'ch05-choice-make-independent-seal-tracings', label: 'Make independent seal tracings', detail: 'Keep the originals untouched, but rely on copies if the ledger cannot reach a later hearing.', effects: [{ type: 'flag', operation: 'add', flagId: 'ledger-seal-tracings-made' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 2 }], outcome: 'Lyra makes three signed tracings and gives each to a different witness for the escape.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-mara-and-the-contingency-runner', chapterId: 'ch05', region: 'embervault', slot: 25,
    type: 'companion', family: 'greywatch-warning', relationship: { kind: 'companion', companionId: 'mara' }, weight: 28, pacing: 'danger',
    illustrationId: 'scene-ch05-companion-mara-and-the-contingency-runner', title: 'Mara and the Contingency Runner',
    narrative: [
      'Mara\'s Greywatch patrol intercepts a Black Banner runner carrying an order initialed S.V. If E-17 is compromised, the message directs nearby columns to destroy Greywatch\'s witnesses and receiving register.',
      'Sending Mara\'s scout away with the warning protects the town sooner. Keeping the scout inside Embervault gives the evidence party an experienced guide for the escape.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['mara-met'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch06-main-smoke-over-greywatch'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-send-the-scout-to-greywatch', label: 'Send the scout to Greywatch', detail: 'Lose Mara\'s strongest tunnel guide, but give the town several hours of warning before the siege.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-warned-by-scout' }, { type: 'companion-loyalty', companionId: 'mara', amount: 6 }, { type: 'threat', amount: 1 }], outcome: 'The scout memorizes the order, takes a relay horse, and leaves Embervault by the northern cut.' },
      { id: 'ch05-choice-keep-the-scout-for-the-escape', label: 'Keep the scout for the escape', detail: 'Strengthen the party underground, but let Greywatch learn of the attack through slower messengers.', effects: [{ type: 'flag', operation: 'add', flagId: 'embervault-scout-kept' }, { type: 'companion-loyalty', companionId: 'mara', amount: -2 }, { type: 'threat', amount: -1 }], outcome: 'Mara gives the scout the rear position and sends the warning by an ordinary mine courier.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-caldus-the-first-hostages', chapterId: 'ch05', region: 'embervault', slot: 29,
    type: 'companion', family: 'caldus-first-hostage-rescue', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 34, pacing: 'danger',
    illustrationId: 'scene-ch05-companion-caldus-the-first-hostages', title: 'Caldus and the First Hostages',
    narrative: [
      'The sealed bunkhouse holds twelve relatives from the missing shift, guarded beside a powder store. They are the first group named in the leverage ledger, not the larger network still hidden near Greywatch.',
      'Caldus can lead them through a smoke vent while you hold the guards, or the party can breach the front door before demolition charges are armed.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['caldus-met', 'hostage-leverage-found'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch05-companion-caldus-answers-the-road'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-cover-caldus-smoke-vent-rescue', label: 'Cover Caldus\'s smoke-vent rescue', detail: 'Split the party while hostages crawl out, risking a harder fight against the bunkhouse guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostages-rescued' }, { type: 'flag', operation: 'add', flagId: 'first-hostage-group-safe' }, { type: 'companion-quest', companionId: 'caldus', stage: 3 }, { type: 'companion-loyalty', companionId: 'caldus', amount: 10 }, { type: 'threat', amount: 1 }], outcome: 'Caldus brings all twelve through the vent while the guards remain focused on your position.' },
      { id: 'ch05-choice-breach-the-bunkhouse-door', label: 'Breach the bunkhouse door', detail: 'Keep the party together and move quickly, but fight beside hostages and an unstable powder store.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostages-rescued' }, { type: 'flag', operation: 'add', flagId: 'bunkhouse-breached' }, { type: 'companion-quest', companionId: 'caldus', stage: 3 }, { type: 'companion-loyalty', companionId: 'caldus', amount: 6 }, { type: 'vitals', health: -3 }], outcome: 'The door gives way, and Caldus moves the hostages behind stone bins before the guards recover.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-lyra-chooses-the-slower-truth', chapterId: 'ch05', region: 'embervault', slot: 36,
    type: 'companion', family: 'lyra-recruitment', relationship: { kind: 'companion', companionId: 'lyra' }, weight: 40, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-lyra-chooses-the-slower-truth', title: 'Lyra Chooses the Slower Truth',
    narrative: [
      'With the authorization finally named, Lyra closes her spell case and packs the seal tracings by hand. You trusted her reading, shared the evidence, and refused to burn through the ward at the workers\' expense.',
      'She offers to carry the proof toward Greywatch and confront the forgeries wherever the network uses them next.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['lyra-met', 'royal-seals-collected', 'evidence-shared-with-lyra', 'lyra-expertise-respected', 'dangerous-magic-refused'], excludedFlags: ['lyra-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-invite-lyra-to-carry-the-proof', label: 'Invite Lyra to carry the proof', detail: 'Accept her as an active companion, knowing careful authentication may slow urgent decisions.', effects: [{ type: 'companion', companionId: 'lyra', operation: 'recruit' }, { type: 'flag', operation: 'add', flagId: 'lyra-recruited' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 4 }], outcome: 'Lyra seals the evidence case to her belt and joins the route back toward Greywatch.' },
      { id: 'ch05-choice-ask-lyra-to-escort-witnesses', label: 'Ask Lyra to escort witnesses', detail: 'Keep her expertise with the rescued smiths, but continue without her battle command or seal reading.', effects: [{ type: 'flag', operation: 'add', flagId: 'lyra-escorted-forge-witnesses' }, { type: 'faction', factionId: 'conclave', amount: 2 }], outcome: 'Lyra takes Dessa and the smiths by a separate shaft with copies of every authenticated seal.' },
    ],
  }),
  defineScene({
    id: 'ch05-companion-caldus-answers-the-road', chapterId: 'ch05', region: 'embervault', slot: 39,
    type: 'companion', family: 'caldus-recruitment', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 40, pacing: 'quiet',
    illustrationId: 'scene-ch05-companion-caldus-answers-the-road', title: 'Caldus Answers the Road',
    narrative: [
      'Caldus finishes counting the first rescued hostages and writes the names of those still missing near Greywatch. You protected refugees, kept his source\'s confidence, exposed the leverage, and accepted the dangerous rescue.',
      'He asks to join the return journey. His abbey contacts may open doors, but his loyalty is now to the people those institutions failed.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10, requiredFlags: ['caldus-met', 'refugees-protected', 'hostage-leverage-found', 'caldus-confidence-kept', 'hostages-rescued'], excludedFlags: ['caldus-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-invite-caldus-to-join', label: 'Invite Caldus to join', detail: 'Accept his healing and abbey knowledge, while sharing the burden of every hostage decision ahead.', effects: [{ type: 'companion', companionId: 'caldus', operation: 'recruit' }, { type: 'flag', operation: 'add', flagId: 'caldus-recruited' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 4 }], outcome: 'Caldus takes a worker\'s spare pack and joins the group climbing toward the cinder shaft.' },
      { id: 'ch05-choice-leave-caldus-with-the-rescued', label: 'Leave Caldus with the rescued', detail: 'Keep a healer with the freed families, but return to Greywatch without his knowledge of the leverage network.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-remained-with-hostages' }, { type: 'faction', factionId: 'abbey', amount: 2 }], outcome: 'Caldus accepts the duty and gives you his copied hostage list before leading the families outside.' },
    ],
  }),
]);
