import { defineScene } from '../../builders';

// The flooded approaches to Greywatch belong to ch02's canonical Gloamwood region.
const COMMON = {
  chapterId: 'ch02', region: 'gloamwood', type: 'journey', weight: 24,
  eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 2, maxLevel: 4 },
  requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
} as const;

export const ROAD_TACTICS_SCENES = Object.freeze([
  defineScene({
    ...COMMON, id: 'ch02-road-drowned-silent-oars', slot: 5,
    journeySubtype: 'travel', family: 'road-silent-oars', pacing: 'quiet',
    illustrationId: 'scene-ch02-road-drowned-silent-oars', title: 'Silent Oars',
    narrative: [
      'Floodwater covers the road below Greywatch. A line of oars moves across it without boats or boatmen, each blade pausing above a submerged paving stone.',
      'The old ferry appears to remember a crossing. A raised towpath is slower but solid; a rope from the ferry rigging still catches the wheels of abandoned carts.',
    ],
    choices: [
      { id: 'ch02-road-oars-cross', label: 'Follow the remembered crossing', detail: 'Test Cunning at difficulty 7 to cross and recover a field bandage; failure drains two resource.', check: {
        stat: 'cunning', difficulty: 7,
        success: { outcome: 'You step where each blade pauses and retrieve a dry medical pouch from the far landing.', effects: [{ type: 'item', operation: 'grant', itemId: 'consumable-field-bandage', quantity: 1, destination: 'unbanked-loot' }, { type: 'threat', amount: -1 }] },
        failure: { outcome: 'The ferry remembers a stone that is no longer there. You struggle back to the towpath with empty hands.', effects: [{ type: 'vitals', resource: -2 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch02-road-oars-towpath', label: 'Take the raised towpath', detail: 'Keep your supplies and strength, spending more time on the long bank.', effects: [{ type: 'tension', amount: 1 }], outcome: 'The oars keep their silent rhythm as the convoy rounds the flooded bend.' },
      { id: 'ch02-road-oars-rigging', label: 'Cut the trapped ferry rope', detail: 'Lose three health to the whipping rope and free the carts for Greywatch’s evacuees.', effects: [{ type: 'vitals', health: -3 }, { type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'xp', amount: 18, source: 'quest' }], outcome: 'The rope lashes your shoulder, then the stranded carts roll free. Families pull them toward dry ground.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch02-road-drowned-ink-warden', slot: 12,
    journeySubtype: 'investigation', family: 'road-ink-warden', pacing: 'quiet',
    illustrationId: 'scene-ch02-road-drowned-ink-warden', title: 'The Ink Warden',
    narrative: [
      'An ink-black armored sentinel stands beside a drowned milestone. Rain writes symbols across its shield and erases them whenever you turn away.',
      'Behind it, water divides around a hidden ford. The sentinel opens one hand for payment while its other hand traces a warning no traveler has yet copied.',
    ],
    choices: [
      { id: 'ch02-road-ink-copy', label: 'Copy the rain before it fades', detail: 'Test Will at difficulty 7 to map the ford; a mistaken symbol drains two resource.', check: {
        stat: 'will', difficulty: 7,
        success: { outcome: 'The final symbol is a depth mark. You guide the convoy through the shallows without approaching the waiting hand.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 18, source: 'quest' }] },
        failure: { outcome: 'Your copy begins writing over itself. You tear the page away before its rhythm overwhelms you.', effects: [{ type: 'vitals', resource: -2 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch02-road-ink-leave', label: 'Leave the ford untested', detail: 'Keep your coin and concentration; the public causeway costs time.', effects: [{ type: 'tension', amount: 1 }], outcome: 'The shield turns toward the next traveler while you follow the causeway stones.' },
      { id: 'ch02-road-ink-pay', label: 'Place six coins in its hand', detail: 'Spend six carried gold for a quiet crossing that lowers threat by three.', requirements: [{ type: 'gold', scope: 'unbanked', amount: 6 }], effects: [{ type: 'gold', scope: 'unbanked', amount: -6 }, { type: 'threat', amount: -3 }], outcome: 'The coins dissolve into black rivulets. The sentinel holds the water apart until the rear wagon passes.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch02-road-drowned-watchtower-debt', slot: 23,
    journeySubtype: 'moral-choice', family: 'road-watchtower-debt', pacing: 'danger',
    illustrationId: 'scene-ch02-road-drowned-watchtower-debt', title: 'Watchtower Debt',
    narrative: [
      'Ledger pages hang from a broken watchtower over the flooded road. Its bell rings once for every wagon, though the keeper’s room has no floor.',
      'Armed collectors below the stair claim that refugee families owe the old garrison twelve coins. The names on the wet pages repeat in different hands.',
    ],
    choices: [
      { id: 'ch02-road-debt-audit', label: 'Challenge the repeated names', detail: 'Test Cunning at difficulty 8 to expose the false debt; failure alerts the collectors.', check: {
        stat: 'cunning', difficulty: 8,
        success: { outcome: 'You hold two copies of the same debt against the light. The families leave while the collectors argue over whose page is genuine.', effects: [{ type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'threat', amount: -1 }] },
        failure: { outcome: 'A collector snatches the page and sounds the tower bell. You withdraw before his companions close the stair.', effects: [{ type: 'threat', amount: 2 }] },
      } },
      { id: 'ch02-road-debt-detour', label: 'Lead your wagons around the tower', detail: 'Keep your coin and avoid the collectors; the long route leaves the families waiting.', effects: [{ type: 'tension', amount: 2 }], outcome: 'The bell continues behind you as your convoy takes the flooded meadow track.' },
      { id: 'ch02-road-debt-pay', label: 'Pay for every waiting family', detail: 'Spend twelve carried gold to free the queue and earn Greywatch trust.', requirements: [{ type: 'gold', scope: 'unbanked', amount: 12 }], effects: [{ type: 'gold', scope: 'unbanked', amount: -12 }, { type: 'faction', factionId: 'greywatch', amount: 3 }, { type: 'threat', amount: -2 }], outcome: 'You count the coins only after the final family passes. The hanging pages go still.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch02-road-drowned-corpse-lantern', slot: 33,
    journeySubtype: 'investigation', family: 'road-corpse-lantern', pacing: 'recovery',
    eligibility: { ...COMMON.eligibility, routes: ['old-forest', 'ruined-pass'] },
    illustrationId: 'scene-ch02-road-drowned-corpse-lantern', title: 'Corpse Lantern',
    narrative: [
      'A cold lantern moves through the reeds in the hands of a figure woven from river corpses. It lays the light on a floating coffin lid and points toward Greywatch.',
      'A note wrapped in fish skin rests beneath the lantern. Its dry reverse could hold a map, but lifting the lid will bring your arm within reach of the bearer.',
    ],
    choices: [
      { id: 'ch02-road-lantern-note', label: 'Read the note in its cold light', detail: 'Test Will at difficulty 7 to learn the safe channel and recover two resource; failure costs three health.', check: {
        stat: 'will', difficulty: 7,
        success: { outcome: 'The note names the drowned stones by their old ferry marks. Knowing where to step steadies your breathing.', effects: [{ type: 'vitals', resource: 2 }, { type: 'threat', amount: -2 }] },
        failure: { outcome: 'A waterlogged hand closes over your wrist. You wrench free and leave the unread note on the lid.', effects: [{ type: 'vitals', health: -3 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch02-road-lantern-pass', label: 'Let the dead carry their bargain', detail: 'Conserve your strength and follow the bank while the lantern passes.', effects: [{ type: 'tension', amount: 1 }], outcome: 'You lower your own lamp. The bearer drifts away and the current slowly settles.' },
      { id: 'ch02-road-lantern-hook', label: 'Hook the salvage beneath the lid', detail: 'Accept two health in cold burns to recover a sealed flask of lamp oil.', effects: [{ type: 'vitals', health: -2 }, { type: 'item', operation: 'grant', itemId: 'consumable-lamp-oil', quantity: 1, destination: 'unbanked-loot' }], outcome: 'The hook catches a sealed flask. Frost climbs the shaft and burns your fingers before you drop it.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch02-road-drowned-basin-warden', slot: 41,
    journeySubtype: 'dungeon', family: 'road-basin-warden', pacing: 'danger',
    illustrationId: 'scene-ch02-road-drowned-basin-warden', title: 'The Basin Warden',
    narrative: [
      'A rusted floodgate chamber guards the last dry passage toward the depot road. In a basin carved from a warship hull, a copper-and-mud guardian counts the turns of a broken wheel.',
      'It blocks every attempt to pass until the chamber is balanced. An overflow crawlway goes around it, but the brickwork is narrow and slow.',
    ],
    choices: [
      { id: 'ch02-road-basin-balance', label: 'Balance the sluice wheel', detail: 'Test Cunning at difficulty 8 to open the dry passage; failure costs four health in the surge.', check: {
        stat: 'cunning', difficulty: 8,
        success: { outcome: 'You match each turn to the guardian’s count. Water falls below the walkway and the small warden steps aside.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 22, source: 'quest' }] },
        failure: { outcome: 'The wheel kicks backward. A surge throws you against the chamber wall before the guardian catches it.', effects: [{ type: 'vitals', health: -4 }] },
      } },
      { id: 'ch02-road-basin-crawl', label: 'Use the overflow crawlway', detail: 'Conserve supplies and avoid the guardian, accepting a long delay in the brick passage.', effects: [{ type: 'tension', amount: 2 }], outcome: 'One traveler at a time, the party crawls above the waterline and emerges beyond the gate.' },
      { id: 'ch02-road-basin-force', label: 'Force the wheel through its last turn', detail: 'Spend three health and two resource to secure the dry passage and recover ten carried gold from its drain.', effects: [{ type: 'vitals', health: -3, resource: -2 }, { type: 'gold', scope: 'unbanked', amount: 10 }, { type: 'threat', amount: -2 }], outcome: 'The seized wheel moves under your full weight. As the water drains, old toll coins spill from the grate.' },
    ],
  }),
]);
