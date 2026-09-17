import { defineScene } from '../../builders';

const COMMON = {
  chapterId: 'ch01', region: 'gloamwood', type: 'journey', weight: 24,
  eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 },
  requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
} as const;

export const ROAD_TACTICS_SCENES = Object.freeze([
  defineScene({
    ...COMMON, id: 'ch01-road-gloamwood-needle-briar', slot: 7,
    roadAffinities: ['press-on', 'rukhar'],
    journeySubtype: 'travel', family: 'road-needle-briar', pacing: 'danger',
    illustrationId: 'scene-ch01-road-gloamwood-needle-briar', title: 'Needle Briar',
    narrative: [
      'Black thorn vines have knitted across the wagon road. Under the green canopy, every tug on the medicine wagon draws another needle through its canvas.',
      'A fox-shaped bronze clasp hangs inside the briar. Beyond it, a deer track winds around the roots; clearing the road would save the convoy a long detour.',
    ],
    choices: [
      { id: 'ch01-road-needle-cut', label: 'Cut beside the roots', detail: 'Test Strength at difficulty 6: clear the wagon lane, or lose three health and one resource to the thorns.', check: {
        stat: 'strength', difficulty: 6,
        success: { outcome: 'The roots part before the thorns can tighten. Both medicine wagons cross the cleared lane.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 12, source: 'quest' }] },
        failure: { outcome: 'You free the axle, but hooked needles rake your hands before the wagons can turn away.', effects: [{ type: 'vitals', health: -3, resource: -1 }] },
      } },
      { id: 'ch01-road-needle-detour', label: 'Follow the deer track', detail: 'Keep your strength and supplies; the sheltered detour lowers threat but costs time.', effects: [{ type: 'threat', amount: -1 }, { type: 'tension', amount: 1 }], outcome: 'The wagons creep between roots while three small bells ring somewhere above the abandoned lane.' },
      { id: 'ch01-road-needle-clasp', label: 'Reach for the bronze clasp', detail: 'Accept two health in thorn cuts to recover eight carried gold caught beside the clasp.', effects: [{ type: 'vitals', health: -2 }, { type: 'gold', scope: 'unbanked', amount: 8 }], outcome: 'A torn purse comes away with the clasp. You bind your wrist while Jory counts the coins.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch01-road-gloamwood-riverless-altar', slot: 26,
    roadAffinities: ['scout', 'lyra'],
    journeySubtype: 'investigation', family: 'road-riverless-altar', pacing: 'quiet',
    eligibility: { ...COMMON.eligibility, routes: ['old-forest', 'ruined-pass'] },
    illustrationId: 'scene-ch01-road-gloamwood-riverless-altar', title: 'The Riverless Altar',
    narrative: [
      'Wet footprints cross a riverbed that has been dry for years. They end at an altar cut with a water sigil, where chalk dust floats against the wind.',
      'The sigil resembles a bend in the road ahead. A shallow bowl asks for a living offering; the raised bank offers a slower way around.',
    ],
    choices: [
      { id: 'ch01-road-altar-read', label: 'Read the water sigil', detail: 'Test Will at difficulty 6 to find the dry crossing; a false reading drains two resource.', check: {
        stat: 'will', difficulty: 6,
        success: { outcome: 'You trace the missing bend without touching the bowl. A chalk line reveals firm ground beneath the dust.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 12, source: 'quest' }] },
        failure: { outcome: 'The carved current draws your thoughts in circles. You pull away before it can take your footing too.', effects: [{ type: 'vitals', resource: -2 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch01-road-altar-bank', label: 'Keep to the raised bank', detail: 'Conserve your blood and concentration, accepting a slower exposed crossing.', effects: [{ type: 'tension', amount: 1 }], outcome: 'You leave a stone warning beside the altar and guide the wagons along the bank.' },
      { id: 'ch01-road-altar-blood', label: 'Give the bowl a drop of blood', detail: 'Lose two health to reveal a sheltered lane and lower threat by three.', effects: [{ type: 'vitals', health: -2 }, { type: 'threat', amount: -3 }], outcome: 'The bowl fills with reflected water. Beneath the reflection, a narrow lane opens through the reeds.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch01-road-gloamwood-hound-chant', slot: 58,
    roadAffinities: ['press-on', 'rukhar'],
    journeySubtype: 'moral-choice', family: 'road-hound-chant', pacing: 'danger',
    illustrationId: 'scene-ch01-road-gloamwood-hound-chant', title: 'Hound Chant',
    narrative: [
      'Moonlit hounds circle the wagons while unseen voices sing between the trees. A goblin bell keeper crouches beside a half-drowned animal whose jaw moves with the choir.',
      'A wire joins its collar to a cracked brass bell. Cutting the wire may free it; taking the bell will bring the rest of the pack into the wagon lane.',
    ],
    choices: [
      { id: 'ch01-road-hound-wire', label: 'Slip the wire from its collar', detail: 'Test Cunning at difficulty 7 to quiet the pack; failure costs three health as you retreat.', check: {
        stat: 'cunning', difficulty: 7,
        success: { outcome: 'The wire falls loose and the choir becomes ordinary breathing. The bell keeper leads the hounds away.', effects: [{ type: 'threat', amount: -2 }, { type: 'xp', amount: 16, source: 'quest' }] },
        failure: { outcome: 'The wire twangs. A hound catches your arm before the wagon guards close ranks.', effects: [{ type: 'vitals', health: -3 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch01-road-hound-wait', label: 'Keep the convoy still', detail: 'Spend time waiting for the chant to pass without drawing a weapon or spending supplies.', effects: [{ type: 'tension', amount: 2 }, { type: 'threat', amount: -1 }], outcome: 'The song travels deeper into the wood. Only when the last hound follows do the wagon wheels move.' },
      { id: 'ch01-road-hound-bell', label: 'Seize the bell and defend the wagons', detail: 'Fight two gloam wargs for the pack keeper’s salvage; battle rewards depend on victory.', effects: [{ type: 'combat', encounterId: 'enc-ch01-war-camp-wargs' }], outcome: 'The keeper vanishes among the roots as two wargs rush the bell in your hand.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch01-road-gloamwood-hidden-beggar', slot: 88,
    roadAffinities: ['make-camp', 'caldus', 'talla'],
    journeySubtype: 'side-quest', family: 'road-hidden-beggar', pacing: 'recovery',
    illustrationId: 'scene-ch01-road-gloamwood-hidden-beggar', title: 'The Beggar Beneath the Root',
    narrative: [
      'A masked beggar shelters beneath colossal roots with a broken road ledger on his knees. Farther down the ridge, riders stop whenever the convoy stops.',
      'His ink-stained fingers betray a courier. He asks for one true loss before he will show the fork that keeps travelers out of the riders’ sight.',
    ],
    choices: [
      { id: 'ch01-road-beggar-story', label: 'Tell him a true loss', detail: 'Test Will at difficulty 6 to earn his trust and recover three resource; faltering costs time.', check: {
        stat: 'will', difficulty: 6,
        success: { outcome: 'He closes the ledger without writing your story. Speaking it leaves you steadier, and he points out the sheltered fork.', effects: [{ type: 'vitals', resource: 3 }, { type: 'threat', amount: -1 }] },
        failure: { outcome: 'The words will not come. He gives you water, but the riders have moved closer while you sit.', effects: [{ type: 'tension', amount: 1 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch01-road-beggar-decline', label: 'Keep your story and move on', detail: 'Conserve what you carry, but take the visible road beneath the riders.', effects: [{ type: 'threat', amount: 1 }], outcome: 'He bows without asking again. The riders turn their horses as the wagons reappear on the ridge.' },
      { id: 'ch01-road-beggar-shelter', label: 'Hide the courier under wagon canvas', detail: 'Risk the riders’ attention to rescue him; gain Greywatch trust while threat rises by two.', effects: [{ type: 'faction', factionId: 'greywatch', amount: 2 }, { type: 'threat', amount: 2 }, { type: 'xp', amount: 16, source: 'quest' }], outcome: 'The ledger travels beneath the medicine. From the ridge, a rider raises a hand toward your rear wagon.' },
    ],
  }),
]);
