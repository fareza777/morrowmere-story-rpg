import { defineScene } from '../../builders';

export const CH06_JOURNEY = Object.freeze([
  defineScene({
    id: 'ch06-journey-the-broken-north-bridge', chapterId: 'ch06', region: 'gloamwood', slot: 2,
    type: 'journey', journeySubtype: 'travel', family: 'greywatch-return', weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-broken-north-bridge', title: 'The Broken North Bridge',
    narrative: ['The fastest concealed route to Greywatch crosses a bridge missing its center span. The stone piers still stand above a cold river carrying ash from the town.', 'Rope can carry people and evidence separately. Repairing a cart rail creates a narrow crossing for everyone and takes longer under approaching cavalry.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-rope-the-evidence-across-first', label: 'Rope the evidence across first', detail: 'Protect the ledger before people cross, but leave witnesses waiting on the exposed northern bank.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-bridge-evidence-crossed' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }, { type: 'threat', amount: 1 }], outcome: 'The evidence case reaches the far pier before the first witness clips onto the rope.' },
      { id: 'ch06-choice-build-a-rail-plank', label: 'Build a rail plank', detail: 'Create one crossing for the full group, but spend time while cavalry approaches the river road.', effects: [{ type: 'flag', operation: 'add', flagId: 'north-bridge-rail-plank-built' }, { type: 'tension', amount: 1 }], outcome: 'Ore rails span the gap, and the party crosses one at a time above the fast water.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-relay-horses', chapterId: 'ch06', region: 'gloamwood', slot: 3,
    type: 'journey', journeySubtype: 'travel', family: 'urgent-return', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-relay-horses', title: 'The Relay Horses',
    narrative: ['A roadside relay stable has three fresh horses and seven exhausted mine witnesses. The stable master offers the mounts to whoever carries Greywatch\'s warning.', 'Riders can reach the town sooner with the ledger, or the horses can pull a farm wagon carrying the weakest witnesses.'],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-ride-ahead-with-the-warning', label: 'Ride ahead with the warning', detail: 'Reach Greywatch before the evidence group, but leave witnesses with fewer defenders on the road.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-warning-arrived-early' }, { type: 'threat', amount: 1 }], outcome: 'Three riders take the order and ledger copy east while the remaining party follows on foot.' },
      { id: 'ch06-choice-hitch-the-horses-to-a-wagon', label: 'Hitch the horses to a wagon', detail: 'Keep the witnesses together and moving, but give Greywatch less time before the siege arrives.', effects: [{ type: 'flag', operation: 'add', flagId: 'forge-witnesses-kept-together' }, { type: 'tension', amount: 1 }], outcome: 'The witnesses climb aboard a farm wagon and reach the next ridge as one guarded group.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-farms-below-the-smoke', chapterId: 'ch06', region: 'gloamwood', slot: 4,
    type: 'journey', journeySubtype: 'moral-choice', family: 'civilian-warning', weight: 15, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-farms-below-the-smoke', title: 'The Farms Below the Smoke',
    narrative: ['Families at Bracken Farm have not seen Greywatch\'s warning flags. Siege scouts are one ridge away, and the farm road leads directly into their advance.', 'Warning every household costs an hour. Sending one runner protects some families and keeps the evidence moving.'],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-warn-every-bracken-household', label: 'Warn every Bracken household', detail: 'Delay the return to move all farm families, risking that the siege reaches Greywatch first.', effects: [{ type: 'flag', operation: 'add', flagId: 'bracken-farms-evacuated' }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'tension', amount: 1 }], outcome: 'Carts leave the farms by the orchard road before the first enemy scouts cross the ridge.' },
      { id: 'ch06-choice-send-one-runner-through-the-farms', label: 'Send one runner through the farms', detail: 'Keep the evidence party moving, but rely on one messenger to reach scattered households.', effects: [{ type: 'flag', operation: 'add', flagId: 'bracken-warning-runner-sent' }, { type: 'threat', amount: -1 }], outcome: 'The runner turns toward the farm bells while the party continues toward Greywatch.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-fields-before-greywatch', chapterId: 'ch06', region: 'gloamwood', slot: 8,
    type: 'journey', journeySubtype: 'travel', family: 'siege-approach', weight: 16, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-fields-before-greywatch', title: 'Fields Before Greywatch',
    narrative: ['The last fields before Greywatch are cut by irrigation ditches and abandoned siege carts. The north gate is closed, and Black Banner riders patrol the main causeway.', 'A drainage lane reaches the east wall unseen. Crossing the open fields is faster if the gate recognizes Jory\'s dispatch.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-cross-the-fields-under-the-dispatch', label: 'Cross under the dispatch', detail: 'Reach the gate quickly with official proof raised, but show the riders exactly who carries it.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-causeway-crossed' }, { type: 'threat', amount: 2 }], outcome: 'Jory raises the waxed tube, and the north gate opens as riders turn toward the causeway.' },
      { id: 'ch06-choice-use-the-east-drainage-lane', label: 'Use the east drainage lane', detail: 'Hide the evidence route from cavalry, but lose time reaching a smaller postern under attack.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-east-postern-used' }, { type: 'tension', amount: 1 }], outcome: 'The party reaches the east wall through waist-high reeds while the main causeway remains watched.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-burned-signal-post', chapterId: 'ch06', region: 'gloamwood', slot: 10,
    type: 'journey', journeySubtype: 'investigation', family: 'siege-intent', weight: 19, pacing: 'quiet',
    illustrationId: 'scene-ch06-journey-the-burned-signal-post', title: 'The Burned Signal Post',
    narrative: ['A burned signal post outside the wall contains a discarded order pouch. Its route marks bypass food stores and converge on the receiving office, infirmary, and council archive.', 'The map proves destruction intent if preserved. Following one marked line may identify the next strike before it lands.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-preserve-the-target-map', label: 'Preserve the target map', detail: 'Secure evidence of the siege plan, but leave the marked strike routes active for now.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-target-map-recovered' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }], outcome: 'Jory folds the map with its pouch seal and records where it was found.' },
      { id: 'ch06-choice-follow-the-infirmary-line', label: 'Follow the infirmary line', detail: 'Intercept the nearest strike team, but leave the original map at the damaged post.', effects: [{ type: 'flag', operation: 'add', flagId: 'infirmary-strike-intercepted' }, { type: 'threat', amount: 1 }], outcome: 'The marked line leads toward a culvert beneath the chapel lane before the attackers arrive.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-road-wardens', chapterId: 'ch06', region: 'gloamwood', slot: 11,
    type: 'journey', journeySubtype: 'side-quest', family: 'captured-patrol', weight: 13, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-road-wardens', title: 'The Captured Road Wardens',
    narrative: ['Three road wardens are bound inside an overturned toll cart beyond the north ditch. They saw the siege column carry Greywatch patrol schedules before any warning left town.', 'Freeing them adds witnesses and costs time under cavalry watch. Taking their testimony through the cart slats preserves speed and leaves them exposed.'],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-free-the-road-wardens', label: 'Free the road wardens', detail: 'Risk cavalry returning to rescue three witnesses who can identify the stolen schedules.', effects: [{ type: 'flag', operation: 'add', flagId: 'road-wardens-rescued' }, { type: 'threat', amount: 1 }], outcome: 'The wardens cut free, recover their short bows, and enter Greywatch beside the evidence party.' },
      { id: 'ch06-choice-record-the-wardens-testimony', label: 'Record the wardens\' testimony', detail: 'Keep moving toward the wall, but leave the bound witnesses dependent on a later patrol.', effects: [{ type: 'flag', operation: 'add', flagId: 'road-warden-testimony-recorded' }, { type: 'tension', amount: 1 }], outcome: 'Jory records the schedule case and rider badges before sending their location to the north gate.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-ink-in-the-charity-cipher', chapterId: 'ch06', region: 'gloamwood', slot: 17,
    type: 'journey', journeySubtype: 'investigation', family: 'hostage-cipher', weight: 20, pacing: 'quiet',
    illustrationId: 'scene-ch06-journey-ink-in-the-charity-cipher', title: 'Ink in the Charity Cipher',
    narrative: ['The hostage note uses an abbey charity code for medicine deliveries. Its ink matches labels from the chapel store, but the paper came from the Black Banner order pouch.', 'Comparing the store ledger can identify who received it. Preserving the note alone protects names until the coerced source is found.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-compare-the-charity-ledger', label: 'Compare the charity ledger', detail: 'Narrow the recipient quickly, but expose several innocent clerks to suspicion during the siege.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostage-cipher-recipient-traced' }, { type: 'tension', amount: 1 }], outcome: 'The delivery mark points to one watch office while Hale keeps every clerk under ordinary protection.' },
      { id: 'ch06-choice-seal-the-cipher-note', label: 'Seal the cipher note', detail: 'Protect the original and avoid premature accusation, but delay identifying the coerced source.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostage-cipher-preserved' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }], outcome: 'Lyra seals the note beside the order pouch while Hale traces schedules by hand.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-chapel-ossuary', chapterId: 'ch06', region: 'gloamwood', slot: 21,
    type: 'journey', journeySubtype: 'dungeon', family: 'chapel-undercroft', weight: 11, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-chapel-ossuary', title: 'The Chapel Ossuary',
    narrative: ['The rear route into the hostage cells crosses an old ossuary with a cracked support arch. Captors have wired the arch to a warning bell, not an explosive.', 'Cutting the wire risks the weak stone. Following it reaches the bell keeper and a guarded side door.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-cut-the-ossuary-bell-wire', label: 'Cut the ossuary bell wire', detail: 'Preserve surprise, but risk shifting the cracked arch above the rescue route.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'ossuary-entered-quietly' }], outcome: 'The wire parts without ringing, and dust falls while the arch remains standing.' },
      { id: 'ch06-choice-follow-the-wire-to-the-keeper', label: 'Follow the wire to the keeper', detail: 'Remove the alarm operator directly, but approach a guarded door without surprise.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-bell-keeper-found' }, { type: 'threat', amount: 1 }], outcome: 'The wire ends at a hand bell beside two guards and the hostage-cell key board.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-novice-in-the-bell-loft', chapterId: 'ch06', region: 'gloamwood', slot: 24,
    type: 'journey', journeySubtype: 'side-quest', family: 'chapel-rescue', weight: 12, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-novice-in-the-bell-loft', title: 'The Novice in the Bell Loft',
    narrative: ['One rescued novice says her sister is locked in the bell loft as leverage against the chapel healers. Siege spotters are already using the same tower.', 'A direct stair fight can reach her quickly. Crossing from the archive roof avoids the spotters and leaves the wounded waiting below.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-fight-up-the-bell-stair', label: 'Fight up the bell stair', detail: 'Reach the captive before the next signal, but climb through defenders in a narrow space.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'bell-loft-novice-rescued' }], outcome: 'The spotters fall back from the bell, and the captive reaches the stair behind your line.' },
      { id: 'ch06-choice-cross-from-the-archive-roof', label: 'Cross from the archive roof', detail: 'Approach unseen above the street, but leave the chapel ward without help for several minutes.', effects: [{ type: 'flag', operation: 'add', flagId: 'bell-loft-entered-from-roof' }, { type: 'tension', amount: 1 }], outcome: 'A roof plank reaches the loft window, and the captive opens it before the spotters turn.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-wall-to-wall', chapterId: 'ch06', region: 'gloamwood', slot: 28,
    type: 'journey', journeySubtype: 'travel', family: 'siege-movement', weight: 15, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-wall-to-wall', title: 'Wall to Wall',
    narrative: ['The siege cuts the inner street between the north wall and archive square. A covered wall walk remains open above; a brewer\'s yard offers a shorter route between burning buildings.', 'The wall walk carries defenders and arrows. The yard keeps the party near the evidence convoy with no overhead cover.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-use-the-covered-wall-walk', label: 'Use the covered wall walk', detail: 'Move with defenders under stone cover, but take the longer route away from the evidence convoy.', effects: [{ type: 'flag', operation: 'add', flagId: 'siege-wall-walk-used' }, { type: 'threat', amount: -1 }], outcome: 'The party moves behind shield shutters and reaches the west tower with the arrow crews.' },
      { id: 'ch06-choice-cross-the-brewers-yard', label: 'Cross the brewer\'s yard', detail: 'Stay near Jory and the records, but cross open ground between burning storehouses.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'brewers-yard-crossed' }], outcome: 'The party reaches the archive square as sparks fall across the overturned brewing vats.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-close-the-west-sally-port', chapterId: 'ch06', region: 'gloamwood', slot: 29,
    type: 'journey', journeySubtype: 'moral-choice', family: 'siege-gate-choice', weight: 17, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-close-the-west-sally-port', title: 'Close the West Sally Port',
    narrative: ['The west sally port remains open for twelve scouts still outside the wall. Siege infantry will reach it before half the scouts return.', 'Closing now protects the ward and abandons the last patrols. Holding it gives them a chance and risks an enemy entry beside civilian shelters.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-close-the-sally-port-now', label: 'Close the sally port now', detail: 'Secure the west ward before infantry arrives, but leave the returning scouts outside.', effects: [{ type: 'flag', operation: 'add', flagId: 'west-sally-port-closed-early' }, { type: 'threat', amount: -1 }], outcome: 'The port bars drop as three distant scouts turn toward the river instead.' },
      { id: 'ch06-choice-hold-the-port-for-the-scouts', label: 'Hold the port for the scouts', detail: 'Give the patrols time to return, but defend an open gate beside crowded shelters.', effects: [{ type: 'flag', operation: 'add', flagId: 'west-scouts-recovered' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: 1 }], outcome: 'Nine scouts reach the port before the first enemy shield enters the lane.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-siege-route-map', chapterId: 'ch06', region: 'gloamwood', slot: 30,
    type: 'journey', journeySubtype: 'investigation', family: 'siege-audit', weight: 19, pacing: 'quiet',
    illustrationId: 'scene-ch06-journey-the-siege-route-map', title: 'The Siege-Route Map',
    narrative: ['A fallen Black Banner officer carries a map with three routes labeled by witness name rather than military objective. Jory, Tomas Reed, and the receiving clerk each have a numbered path.', 'The reverse side lists withdrawal roads toward Crownless Keep. Securing the map proves intent; acting on it can protect one targeted witness immediately.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-secure-the-siege-route-map', label: 'Secure the siege-route map', detail: 'Preserve the named target and withdrawal routes, but leave current escorts unchanged.', effects: [{ type: 'flag', operation: 'add', flagId: 'crownless-withdrawal-route-found' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }], outcome: 'Hale seals the map while Jory identifies each target and the road leading west.' },
      { id: 'ch06-choice-reinforce-the-receiving-clerk', label: 'Reinforce the receiving clerk', detail: 'Protect one named witness now, but let the original map remain with the fallen officer longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'receiving-clerk-protected' }, { type: 'threat', amount: 1 }], outcome: 'Two ward guards reach the clerk before the marked strike team turns into the archive lane.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-breach-culvert', chapterId: 'ch06', region: 'gloamwood', slot: 32,
    type: 'journey', journeySubtype: 'dungeon', family: 'breach-defense', weight: 11, pacing: 'danger', threatChange: 1,
    illustrationId: 'scene-ch06-journey-the-breach-culvert', title: 'The Breach Culvert',
    narrative: ['A stone culvert runs beneath the west wall where siege sappers have removed two supports. The channel can carry a counterattack behind them or be collapsed to seal the route.', 'Crossing preserves a surprise flank and risks the ceiling. Collapsing it blocks the sappers and cuts a civilian drainage exit.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-cross-the-weakened-culvert', label: 'Cross the weakened culvert', detail: 'Reach the sappers from behind, but risk the unsupported ceiling during the fight.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'west-sappers-flanked' }], outcome: 'The party emerges behind the sapper line as stones begin falling into the channel.' },
      { id: 'ch06-choice-collapse-the-breach-culvert', label: 'Collapse the breach culvert', detail: 'Block an enemy route immediately, but remove one escape path for the west ward.', effects: [{ type: 'flag', operation: 'add', flagId: 'breach-culvert-sealed' }, { type: 'tension', amount: 1 }], outcome: 'The damaged supports fall inward, filling the channel before the sappers can enter.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-east-ward-retreat', chapterId: 'ch06', region: 'gloamwood', slot: 37,
    type: 'journey', journeySubtype: 'travel', family: 'siege-retreat', weight: 15, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-east-ward-retreat', title: 'The East-Ward Retreat',
    narrative: ['The road from the breach to the east ward is blocked by a fallen watchtower. An upper house row remains connected by balconies; a lower alley passes beside fire spreading from the granary.', 'The balconies are slow with wounded people. The alley keeps carts moving and may close behind them.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-move-across-the-balconies', label: 'Move across the balconies', detail: 'Avoid the street fire, but carry wounded people through narrow upper rooms one by one.', effects: [{ type: 'flag', operation: 'add', flagId: 'east-retreat-used-balconies' }, { type: 'tension', amount: 1 }], outcome: 'Ward families cross joined balconies while defenders hold each stair behind them.' },
      { id: 'ch06-choice-push-the-carts-through-the-alley', label: 'Push the carts through the alley', detail: 'Keep medicine and records together, but risk the spreading fire closing the route.', effects: [{ type: 'vitals', health: -2 }, { type: 'flag', operation: 'add', flagId: 'east-retreat-saved-carts' }], outcome: 'The last cart clears the alley as burning roof tiles fall across its tracks.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-bell-ringers-last-climb', chapterId: 'ch06', region: 'gloamwood', slot: 38,
    type: 'journey', journeySubtype: 'side-quest', family: 'siege-signal', weight: 12, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-bell-ringers-last-climb', title: 'The Bell Ringer\'s Last Climb',
    narrative: ['Greywatch\'s bell ringer is wounded below the tower while wards wait for an evacuation signal. The rope has burned through at the lower landing.', 'Carrying him up preserves the trained signal pattern. Ringing it yourself is faster and risks sending the wrong order through smoke.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-carry-the-bell-ringer-up', label: 'Carry the bell ringer up', detail: 'Risk the burning stair to preserve the exact signal understood by every ward.', effects: [{ type: 'vitals', health: -3 }, { type: 'flag', operation: 'add', flagId: 'greywatch-bell-signal-correct' }], outcome: 'The ringer reaches the upper rope and sounds the evacuation pattern through the smoke.' },
      { id: 'ch06-choice-ring-the-signal-yourself', label: 'Ring the signal yourself', detail: 'Warn the wards immediately, but risk a timing error that sends families toward a closed route.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-bell-rung-by-player' }, { type: 'tension', amount: 1 }], outcome: 'The bell carries across the town, and ward runners begin checking which route you meant.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-the-last-medicine-wagon', chapterId: 'ch06', region: 'gloamwood', slot: 40,
    type: 'journey', journeySubtype: 'moral-choice', family: 'siege-supplies', weight: 18, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-the-last-medicine-wagon', title: 'The Last Medicine Wagon',
    narrative: ['One surviving Route Seven wagon stands between the infirmary and east gate. The wounded need its cases now; the evacuation column will need them after leaving Greywatch.', 'Unloading serves people who cannot travel. Keeping the wagon packed supports a retreat and risks abandoning the current ward.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-unload-the-wagon-at-the-infirmary', label: 'Unload the wagon at the infirmary', detail: 'Treat the immobile wounded, but leave the evacuation column with fewer sealed supplies.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-infirmary-supplied' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Every case is carried inside while the empty wagon remains ready for wounded passengers.' },
      { id: 'ch06-choice-keep-the-wagon-packed-for-retreat', label: 'Keep the wagon packed for retreat', detail: 'Protect medicine for survivors beyond the wall, but leave the present ward on reduced treatment.', effects: [{ type: 'flag', operation: 'add', flagId: 'evacuation-medicine-preserved' }, { type: 'tension', amount: 1 }], outcome: 'The sealed wagon joins the east column while infirmary healers divide their remaining stock.' },
    ],
  }),
  defineScene({
    id: 'ch06-journey-evidence-or-wounded', chapterId: 'ch06', region: 'gloamwood', slot: 41,
    type: 'journey', journeySubtype: 'moral-choice', family: 'aftermath-custody', weight: 19, pacing: 'danger',
    illustrationId: 'scene-ch06-journey-evidence-or-wounded', title: 'Evidence or Wounded',
    narrative: ['The archive cart loses a wheel beside a litter line as the rear guard approaches. The Embervault case and receiving register can be carried by the same people needed for four wounded defenders.', 'Hiding the documents allows everyone to move and risks later recovery. Carrying them now leaves the wounded with a smaller escort.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-carry-the-evidence-cases', label: 'Carry the evidence cases', detail: 'Protect the proof during the retreat, but leave fewer hands for wounded defenders.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-evidence-carried-out' }, { type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger' }, { type: 'tension', amount: 1 }], outcome: 'Jory and Hale carry the cases while ward volunteers take the remaining litter poles.' },
      { id: 'ch06-choice-hide-the-cases-and-carry-wounded', label: 'Hide the cases and carry wounded', detail: 'Move every injured defender now, but risk returning through enemy-held streets for the proof.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-evidence-hidden-for-recovery' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'The cases disappear beneath a marked hearthstone, and the full litter line reaches the east route.' },
    ],
  }),
]);
