import { defineScene } from '../../builders';

const COMMON = {
  chapterId: 'ch05', region: 'embervault', type: 'journey', weight: 24,
  eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 },
  requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
} as const;

export const ROAD_TACTICS_SCENES = Object.freeze([
  defineScene({
    ...COMMON, id: 'ch05-road-embervault-ash-priestess', slot: 20,
    journeySubtype: 'side-quest', family: 'road-ash-priestess', pacing: 'recovery',
    illustrationId: 'scene-ch05-road-embervault-ash-priestess', title: 'Ash Priestess',
    narrative: [
      'A soot-covered priestess kneels at an ember-lit shrine, counting dead sparks in her palms. Behind her, a forbidden service corridor breathes cool air into the furnace heat.',
      'She offers rest to travelers who can keep the shrine’s last ember alive. Those who demand passage must cross the hot grate without her protection.',
    ],
    choices: [
      { id: 'ch05-road-priestess-ember', label: 'Keep vigil over the last ember', detail: 'Test Will at difficulty 9 to recover eight health; losing the ember drains two resource.', check: {
        stat: 'will', difficulty: 9,
        success: { outcome: 'You shelter the ember through a furnace gust. The priestess washes soot from your wounds and opens the cool corridor.', effects: [{ type: 'vitals', health: 8 }, { type: 'threat', amount: -1 }] },
        failure: { outcome: 'The ember dims despite your vigil. She rekindles it from her own sleeve while you leave exhausted.', effects: [{ type: 'vitals', resource: -2 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch05-road-priestess-leave', label: 'Thank her and use the public stair', detail: 'Keep your strength for the forge, but spend time on the watched route.', effects: [{ type: 'tension', amount: 1 }], outcome: 'She presses a cool hand to your shoulder and turns back to the small fire.' },
      { id: 'ch05-road-priestess-grate', label: 'Cross the hot grate into the corridor', detail: 'Lose four health to pass quickly below the sentries and lower threat by three.', effects: [{ type: 'vitals', health: -4 }, { type: 'threat', amount: -3 }], outcome: 'Heat bites through your boots. Beyond the grate, the hidden passage carries you beneath the guard stair.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch05-road-embervault-cinder-drill', slot: 15,
    journeySubtype: 'investigation', family: 'road-cinder-drill', pacing: 'quiet',
    illustrationId: 'scene-ch05-road-embervault-cinder-drill', title: 'Cinder Drill',
    narrative: [
      'Soldiers drill beside a forge while an abandoned drill-engine hammers below the floor. Each burst of sparks lights a second set of orders pinned behind the practice roster.',
      'The visible roster assigns guards to the mine. The hidden sheet assigns the same soldiers to an unlisted loading door; the engine’s brake can silence the room long enough to read it.',
    ],
    choices: [
      { id: 'ch05-road-drill-copy', label: 'Read between the bursts of sparks', detail: 'Test Cunning at difficulty 9 to locate the hidden loading door; failure draws the drill sergeant’s attention.', check: {
        stat: 'cunning', difficulty: 9,
        success: { outcome: 'You copy the loading hour onto your sleeve. The party reaches the hidden door during the next change of guard.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 28, source: 'quest' }] },
        failure: { outcome: 'The sergeant notices your interest in the wall and moves the next patrol into your path.', effects: [{ type: 'threat', amount: 2 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch05-road-drill-pass', label: 'Pass with the shift workers', detail: 'Conserve your resources and leave the concealed orders unread.', effects: [{ type: 'tension', amount: 1 }], outcome: 'You keep pace with the workers until the shouted count fades behind the next bulkhead.' },
      { id: 'ch05-road-drill-brake', label: 'Wrench the engine brake closed', detail: 'Lose three health and two resource to stop the engine, clear the work lane, and earn thirty quest experience.', effects: [{ type: 'vitals', health: -3, resource: -2 }, { type: 'xp', amount: 30, source: 'quest' }, { type: 'threat', amount: -2 }], outcome: 'The brake burns your palms, but the engine stops. Workers lead the party across the newly quiet service floor.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch05-road-embervault-scorch-festival', slot: 26,
    journeySubtype: 'moral-choice', family: 'road-scorch-festival', pacing: 'danger',
    illustrationId: 'scene-ch05-road-embervault-scorch-festival', title: 'Scorch Festival',
    narrative: [
      'Charcoal masks swing above a forge-district fire festival. Dancers turn around braziers while two masked figures roll an oil barrel toward the only crowded exit.',
      'The old feast gives the workers an hour of music. Someone has chosen that hour for an ambush, and the masks make every shouted warning sound like part of the song.',
    ],
    choices: [
      { id: 'ch05-road-festival-mask', label: 'Wear a mask and intercept the barrel', detail: 'Test Cunning at difficulty 9 to open an escape lane; failure costs four health in the flare.', check: {
        stat: 'cunning', difficulty: 9,
        success: { outcome: 'You turn with the dancers and wedge the barrel against an empty furnace. Workers slip through the exit before the masked pair can respond.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 32, source: 'quest' }] },
        failure: { outcome: 'Oil flashes across the paving. You pull the nearest dancer clear, burning your arm as the crowd scatters.', effects: [{ type: 'vitals', health: -4 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch05-road-festival-skirt', label: 'Withdraw through the side alleys', detail: 'Keep the evidence party out of the crowd and conserve supplies; the detour costs time.', effects: [{ type: 'tension', amount: 2 }], outcome: 'You guide your party between shuttered workshops while the festival drums hide the sound of pursuit.' },
      { id: 'ch05-road-festival-fight', label: 'Expose the ambushers and hold the exit', detail: 'Fight a black-banner cutter and an ash magus so workers can escape; claim salvage only after victory.', effects: [{ type: 'combat', encounterId: 'enc-ch05-ledger-vault-cutters' }], outcome: 'You tear away the nearest mask. A cutter draws steel while the second figure raises a furnace spell.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch05-road-embervault-ore-bone-road', slot: 40,
    journeySubtype: 'travel', family: 'road-ore-bone-road', pacing: 'danger',
    eligibility: { ...COMMON.eligibility, routes: ['kings-road', 'ruined-pass'] },
    illustrationId: 'scene-ch05-road-embervault-ore-bone-road', title: 'Ore on the Bone Road',
    narrative: [
      'Pale ore carts cross a road lined with old ribs and warning stakes. Every wheel passes through white dust that smells of crushed bone and hot iron.',
      'A broken cart has exposed an axle chest. The straight road leads toward the escape shafts; an old miners’ loop avoids the remains but winds beneath the guard towers.',
    ],
    choices: [
      { id: 'ch05-road-bone-guide', label: 'Guide the carts between the stakes', detail: 'Test Cunning at difficulty 9 to reach the shaft unseen; failure costs three health on the collapsing verge.', check: {
        stat: 'cunning', difficulty: 9,
        success: { outcome: 'The stakes mark old subsidence, not graves. You keep the wheels on firm ground and leave no trail outside the cart ruts.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 28, source: 'quest' }] },
        failure: { outcome: 'A wheel sinks past a warning stake. You drag it free as the sharp verge breaks beneath your knee.', effects: [{ type: 'vitals', health: -3 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch05-road-bone-loop', label: 'Take the miners’ loop', detail: 'Keep your strength and respect the marked ground; the longer route raises tension.', effects: [{ type: 'tension', amount: 2 }], outcome: 'The loop returns to the shaft road beyond the last rib, with the carts still grinding in the distance.' },
      { id: 'ch05-road-bone-chest', label: 'Pull the axle chest from the wreck', detail: 'Lose three health to salvage eighteen carried gold while the exposed work raises threat.', effects: [{ type: 'vitals', health: -3 }, { type: 'gold', scope: 'unbanked', amount: 18 }, { type: 'threat', amount: 1 }], outcome: 'The chest comes free with a shower of pale grit. A shutter opens in the nearest guard tower.' },
    ],
  }),
]);
