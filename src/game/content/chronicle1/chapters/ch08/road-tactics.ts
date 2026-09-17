import { defineScene } from '../../builders';

const COMMON = {
  chapterId: 'ch08', region: 'crownless-keep', type: 'journey', weight: 24,
  eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 14, maxLevel: 15 },
  requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
} as const;

export const ROAD_TACTICS_SCENES = Object.freeze([
  defineScene({
    ...COMMON, id: 'ch08-road-crownless-sigil-court', slot: 5,
    journeySubtype: 'investigation', family: 'road-sigil-court', pacing: 'quiet',
    illustrationId: 'scene-ch08-road-crownless-sigil-court', title: 'The Sigil Court',
    narrative: [
      'Floating seals hang over the cracked floor of a ruined court. Each banner brought beneath them becomes a face reflected in the central sigil, waiting for a verdict.',
      'No judge remains to hear an objection. A narrow servants’ gallery circles the court; crossing the sigil could open a direct route toward the hall of seals.',
    ],
    choices: [
      { id: 'ch08-road-court-answer', label: 'Answer the seals with a sworn account', detail: 'Test Will at difficulty 11 to pass under their protection; failure drains three resource.', check: {
        stat: 'will', difficulty: 11,
        success: { outcome: 'You name what you witnessed and leave every uncertain claim unsaid. The seals lift, making room for your companions.', effects: [{ type: 'threat', amount: -3 }, { type: 'xp', amount: 40, source: 'quest' }] },
        failure: { outcome: 'The sigil repeats your account in unfamiliar voices until you can no longer hold the words together.', effects: [{ type: 'vitals', resource: -3 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch08-road-court-gallery', label: 'Circle through the servants’ gallery', detail: 'Conserve your resolve and refuse the court’s judgment, accepting a delay.', effects: [{ type: 'tension', amount: 2 }], outcome: 'You pass above the seals with your banners furled. The empty court judges its own reflections.' },
      { id: 'ch08-road-court-force', label: 'Break the court’s sealed threshold', detail: 'Challenge a golem and an undead soldier guarding the seals; battle salvage requires victory.', effects: [{ type: 'combat', encounterId: 'enc-ch08-seal-case-wardens' }], outcome: 'The nearest seal shatters. Stone armor unfolds beside the door and a dead soldier gives the command to advance.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch08-road-crownless-iron-chime', slot: 18,
    journeySubtype: 'travel', family: 'road-iron-chime', pacing: 'danger',
    illustrationId: 'scene-ch08-road-crownless-iron-chime', title: 'Iron Chime',
    narrative: [
      'A giant iron bell vibrates in a windless keep corridor. No hammer touches it, yet every note opens one invisible partition and closes another.',
      'The evidence party can move with its rhythm, wait for the long silence between cycles, or climb the frame and bind the vibrating tongue by hand.',
    ],
    choices: [
      { id: 'ch08-road-chime-rhythm', label: 'Walk to the last ring', detail: 'Test Will at difficulty 11 to cross unheard; a missed beat costs four health against a closing partition.', check: {
        stat: 'will', difficulty: 11,
        success: { outcome: 'You step only after the lowest note. The party crosses the corridor before a single guard door can open.', effects: [{ type: 'threat', amount: -3 }, { type: 'xp', amount: 36, source: 'quest' }] },
        failure: { outcome: 'A clear partition strikes your shoulder. You force the party back before the next note seals the corridor.', effects: [{ type: 'vitals', health: -4 }, { type: 'threat', amount: 1 }] },
      } },
      { id: 'ch08-road-chime-wait', label: 'Wait for the silent interval', detail: 'Keep your strength and supplies, spending time behind the stone alcove.', effects: [{ type: 'tension', amount: 2 }], outcome: 'The witnesses cover their ears until the long silence lets everyone cross together.' },
      { id: 'ch08-road-chime-bind', label: 'Bind the iron tongue', detail: 'Lose four health and two resource to stop the chime and lower threat by four.', effects: [{ type: 'vitals', health: -4, resource: -2 }, { type: 'threat', amount: -4 }], outcome: 'The vibrating iron splits your knuckles before the binding holds. Every partition stands open in the sudden quiet.' },
    ],
  }),
  defineScene({
    ...COMMON, id: 'ch08-road-crownless-barnacle-pit', slot: 26,
    journeySubtype: 'side-quest', family: 'road-barnacle-pit', pacing: 'danger',
    illustrationId: 'scene-ch08-road-crownless-barnacle-pit', title: 'The Barnacle Pit',
    narrative: [
      'Beneath Crownless Keep, prisoners signal through the bars of a flooded pit. Barnacles coat the walls far above the waterline, and black rain falls from a ceiling without a crack.',
      'A hidden stair answers the prisoners’ taps. Testing its stones may open a rescue route; lowering yourself on the rusty chain is faster and far less forgiving.',
    ],
    choices: [
      { id: 'ch08-road-pit-stones', label: 'Sound the hidden stair with stones', detail: 'Test Cunning at difficulty 11 to free the prisoners safely; failure costs three resource and time.', check: {
        stat: 'cunning', difficulty: 11,
        success: { outcome: 'You follow the hollow answers down to the grille. The prisoners climb out and mark a civilian exit through the lower ward.', effects: [{ type: 'flag', operation: 'add', flagId: 'lower-ward-exit-marked' }, { type: 'faction', factionId: 'border-council', amount: 3 }, { type: 'xp', amount: 44, source: 'quest' }] },
        failure: { outcome: 'The echo leads to a missing step. You haul yourself back while the water rises over the route you almost trusted.', effects: [{ type: 'vitals', resource: -3 }, { type: 'tension', amount: 1 }] },
      } },
      { id: 'ch08-road-pit-mark', label: 'Mark the grille for the rescue crews', detail: 'Preserve the evidence party’s strength and continue; the prisoners must wait for help.', effects: [{ type: 'tension', amount: 2 }], outcome: 'You knot a visible strip of cloth above the pit and call down the route the rescue crews will take.' },
      { id: 'ch08-road-pit-chain', label: 'Descend the rusty chain now', detail: 'Lose six health and two resource to break the grille and bring the prisoners out immediately.', effects: [{ type: 'vitals', health: -6, resource: -2 }, { type: 'faction', factionId: 'border-council', amount: 4 }, { type: 'xp', amount: 44, source: 'quest' }], outcome: 'Barnacles tear your arms as you wrench the grille free. The first prisoner steadies the chain for everyone behind her.' },
    ],
  }),
]);
