import { defineScene } from '../../builders';

export const CH03_COMBAT = Object.freeze([
  defineScene({
    id: 'ch03-combat-arrows-in-the-flooded-orchard', chapterId: 'ch03', region: 'drowned-road', slot: 5,
    type: 'combat', family: 'flooded-orchard-archers', weight: 85, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch03-flooded-orchard', illustrationId: 'scene-ch03-combat-arrows-in-the-flooded-orchard',
    title: 'Arrows in the Flooded Orchard',
    narrative: [
      'Archers fire from apple trees standing in chest-deep water, using hanging harvest baskets as dry quivers. Their first shots cut the ferry towline rather than aim at your party.',
      'The current carries the boat toward a collapsed wall. You can seize the nearest tree line or hold the drifting deck until the ferryman knots a new rope.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-wade-for-the-nearest-trees', label: 'Wade for the nearest trees', detail: 'Close with the archers through deep water while leaving the ferry briefly undefended.', effects: [{ type: 'flag', operation: 'add', flagId: 'orchard-flank-taken' }], outcome: 'You reach the first trunks beneath their firing angle, forcing the archers to draw blades among the branches.' },
      { id: 'ch03-choice-hold-the-drifting-ferry', label: 'Hold the drifting ferry', detail: 'Fight from an unstable deck while protecting the evidence and the ferryman\'s repair.', effects: [{ type: 'flag', operation: 'add', flagId: 'orchard-ferry-held' }, { type: 'threat', amount: 1 }], outcome: 'The new rope catches as arrows strike the gunwale, leaving the attackers above you and the case still aboard.' },
    ],
  }),
  defineScene({
    id: 'ch03-combat-smugglers-on-black-skiffs', chapterId: 'ch03', region: 'drowned-road', slot: 9,
    type: 'combat', family: 'smuggler-skiff-raid', weight: 80, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch03-black-skiffs', illustrationId: 'scene-ch03-combat-smugglers-on-black-skiffs',
    title: 'Smugglers on Black Skiffs',
    narrative: [
      'Three low skiffs slide from the reeds with their oar blades wrapped in cloth. Hookmen reach for the evidence chest while a sling crew breaks lanterns along the bank.',
      'The lead skiff carries stolen patrol pennants from both armies. Capturing it may explain the disguises, but the other boats are already closing around the civilians behind you.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-board-the-lead-skiff', label: 'Board the lead skiff', detail: 'Pursue the stolen pennants through close fighting while the smaller boats surround your rear.', effects: [{ type: 'flag', operation: 'add', flagId: 'black-skiff-boarded' }], outcome: 'Your jump pins the lead boat against the bank, exposing bundles of folded uniforms beneath its deck boards.' },
      { id: 'ch03-choice-form-a-ring-around-civilians', label: 'Form a ring around civilians', detail: 'Give up the lead boat to keep hookmen away from the families and their shallow barges.', effects: [{ type: 'flag', operation: 'add', flagId: 'skiff-civilians-covered' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'The barges reach the mud bank while two skiffs turn back and the third crashes into your defensive line.' },
    ],
  }),
  defineScene({
    id: 'ch03-combat-marsh-hounds-at-low-water', chapterId: 'ch03', region: 'drowned-road', slot: 16,
    type: 'combat', family: 'starved-marsh-hounds', weight: 70, pacing: 'danger', threatChange: 1,
    encounterId: 'enc-ch03-marsh-hounds', illustrationId: 'scene-ch03-combat-marsh-hounds-at-low-water',
    title: 'Marsh Hounds at Low Water',
    narrative: [
      'A pack of starved marsh hounds circles a stranded livestock barge as the water falls around it. The animals wear cut rope collars from farms emptied by the flood.',
      'Smoke can drive them toward the open marsh, or the party can hold the gangplank and protect the remaining sheep during a direct attack.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-drive-the-pack-with-smoke', label: 'Drive the pack with smoke', detail: 'Use wet-reed smoke to scatter the hounds while fighting through poor visibility yourself.', effects: [{ type: 'flag', operation: 'add', flagId: 'marsh-hounds-smoked-out' }], outcome: 'The pack breaks into smaller groups, but shapes keep lunging through the smoke at knee height.' },
      { id: 'ch03-choice-hold-the-livestock-gangplank', label: 'Hold the livestock gangplank', detail: 'Meet the full pack at a narrow point and keep the refugees\' remaining animals alive.', effects: [{ type: 'flag', operation: 'add', flagId: 'livestock-barge-defended' }, { type: 'faction', factionId: 'border-council', amount: 1 }], outcome: 'The gangplank limits the pack to two animals at once while frightened sheep crowd behind your line.' },
    ],
  }),
  defineScene({
    id: 'ch03-combat-patrol-with-borrowed-faces', chapterId: 'ch03', region: 'drowned-road', slot: 23,
    type: 'combat', family: 'impostor-patrol', weight: 90, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch03-borrowed-faces', illustrationId: 'scene-ch03-combat-patrol-with-borrowed-faces',
    title: 'A Patrol with Borrowed Faces',
    narrative: [
      'A Greywatch patrol orders you to surrender Kesh\'s statement, but its sergeant gives an outdated challenge phrase. One soldier\'s collar hides green Free Host stitching beneath fresh grey cloth.',
      'The impostors stand between the evidence party and a narrow culvert. Their rear runner is already reaching for a signal flare.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-rush-the-signal-runner', label: 'Rush the signal runner', detail: 'Break formation to stop the flare while the false sergeant keeps the road blocked.', effects: [{ type: 'flag', operation: 'add', flagId: 'impostor-flare-stopped' }], outcome: 'The runner drops the unlit flare beside a satchel containing orders for uniforms from both camps.' },
      { id: 'ch03-choice-withdraw-through-the-culvert', label: 'Withdraw through the culvert', detail: 'Keep the evidence moving through a cramped tunnel while allowing the runner to summon support.', effects: [{ type: 'flag', operation: 'add', flagId: 'impostor-culvert-withdrawal' }, { type: 'threat', amount: 2 }], outcome: 'The party reaches the far ditch before the flare rises, then turns to defend the culvert mouth.' },
    ],
  }),
  defineScene({
    id: 'ch03-combat-the-sluice-breakers', chapterId: 'ch03', region: 'drowned-road', slot: 29,
    type: 'combat', family: 'sluice-saboteur-team', weight: 85, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch03-sluice-breakers', illustrationId: 'scene-ch03-combat-the-sluice-breakers',
    title: 'The Sluice Breakers',
    narrative: [
      'Saboteurs hammer wedges into the main sluice while a shield line guards the winch house. If the gate fails, the surge will strike three evacuation roads below Redwater.',
      'The wedges can be pulled under fire, or the winch house can be taken before the crew completes its work. Both targets are too far apart to reach together.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-pull-the-sluice-wedges', label: 'Pull the sluice wedges', detail: 'Work beside the failing gate under missile fire and let the shield crew keep its position.', effects: [{ type: 'flag', operation: 'add', flagId: 'redwater-sluice-saved' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'The last wedge comes free before the gate twists, leaving the saboteurs trapped on the narrow service walk.' },
      { id: 'ch03-choice-storm-the-winch-house', label: 'Storm the winch house', detail: 'Cut down the sabotage crew quickly while risking a flood surge below the gate.', effects: [{ type: 'flag', operation: 'add', flagId: 'sluice-winch-house-taken' }, { type: 'tension', amount: 1 }], outcome: 'The hammering stops when you seize the winch, but water tears one damaged panel from the lower gate.' },
    ],
  }),
  defineScene({
    id: 'ch03-combat-the-two-banner-rearguard', chapterId: 'ch03', region: 'drowned-road', slot: 35,
    type: 'combat', family: 'false-flag-rearguard', weight: 95, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch03-two-banner-rearguard', illustrationId: 'scene-ch03-combat-the-two-banner-rearguard',
    title: 'The Two-Banner Rearguard',
    narrative: [
      'The surviving provocateurs retreat along a flooded dike, changing from Greywatch cloaks to Free Host tabards as signal fires rise behind them. One carries the raid pay chest.',
      'The dike forks toward Redwater and a civilian ferry. Cutting off the chest may prove who paid them; protecting the ferry prevents the retreat from becoming another massacre.',
    ],
    eligibility: { minLevel: 4, maxLevel: 6 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true,
    followUps: [], callbackPromises: [], choices: [
      { id: 'ch03-choice-cut-off-the-pay-chest', label: 'Cut off the pay chest', detail: 'Chase the proof along the exposed dike while the fleeing rearguard nears a civilian boat.', effects: [{ type: 'flag', operation: 'add', flagId: 'two-banner-pay-chest-taken' }, { type: 'evidence', operation: 'add', evidenceId: 'two-banner-pay-tokens' }], outcome: 'The chest falls open during the fight, spilling newly struck coins wrapped in iron-freight cloth.' },
      { id: 'ch03-choice-cover-the-civilian-ferry', label: 'Cover the civilian ferry', detail: 'Abandon the pay chest to prevent the rearguard from taking hostages at the landing.', effects: [{ type: 'flag', operation: 'add', flagId: 'two-banner-ferry-protected' }, { type: 'faction', factionId: 'border-council', amount: 4 }], outcome: 'The ferry pulls away before the rearguard arrives, forcing the attackers to turn and face you on the dike.' },
    ],
  }),
]);
