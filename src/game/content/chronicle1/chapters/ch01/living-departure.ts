import { defineScene } from '../../builders';

const routes = ['kings-road', 'old-forest', 'ruined-pass'];
const base = (scene: any) => defineScene({
  chapterId: 'ch01', region: 'gloamwood', weight: 100, eligibility: { routes, minLevel: 1, maxLevel: 2 },
  requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
  dialogue: [{ speakerName: 'Jory', text: scene.line, environmentIllustrationId: scene.illustrationId }], ...scene,
});
const direct = (id: string, label: string, outcome: string, effects: any[], nextSceneId: string, continueLabel: string, extra = {}) => ({ id, label, detail: outcome, outcome, effects, nextSceneId, continueLabel, ...extra });
const checked = (id: string, label: string, stat: 'strength' | 'cunning' | 'will', difficulty: number, modifier: string, nextSceneId: string, continueLabel: string, effects: any[] = [], combatEncounterId?: string) => ({
  id, label, detail: `Attempt a ${stat} check against difficulty ${difficulty}.`, check: {
    stat, difficulty, modifiers: [{ label: modifier, amount: modifier.endsWith('+0') ? 0 : 5 }],
    success: { outcome: 'You carry out the work without losing the convoy.', effects, nextSceneId, continueLabel },
    failure: { outcome: 'The work costs you, but the convoy continues.', effects, nextSceneId, continueLabel },
    criticalSuccess: { outcome: 'The work is clean, quick, and useful later.', effects, nextSceneId, continueLabel },
    criticalFailure: { outcome: 'The mistake leaves the road exposed.', effects, nextSceneId, continueLabel, ...(combatEncounterId ? { combatEncounterId } : {}) },
  },
});

export const CH01_LIVING_DEPARTURE = Object.freeze([
  base({ id: 'ch01-living-bent-axle-setup', slot: 2, type: 'journey', journeySubtype: 'travel', family: 'bent-axle', pacing: 'quiet', illustrationId: 'scene-ch01-living-bent-axle-setup', title: 'The Rear Wheel Sags', line: 'That shoe will hold for a mile, or fail in ten steps.', narrative: ['At the first outer milestone, the rear wagon leans hard enough to spill rainwater from its canvas.', 'Jory stops the drivers while the convoy chooses how to prepare the bent iron shoe.'], choices: [
    direct('ch01-choice-wedge-the-bent-axle', 'Wedge the wagon', 'The drivers hammer timber under the frame until the damaged wheel hangs clear.', [{ type: 'flag', operation: 'add', flagId: 'bent-axle-wedged' }, { type: 'vitals', resource: -1 }], 'ch01-living-bent-axle-work', 'Raise the wagon'),
    direct('ch01-choice-unload-the-rear-cases', 'Unload the rear cases', 'Six sealed cases come down in order as Jory records their numbers.', [{ type: 'flag', operation: 'add', flagId: 'bent-axle-cases-unloaded' }, { type: 'tension', amount: 1 }], 'ch01-living-bent-axle-work', 'Rebalance the load'),
    direct('ch01-choice-send-for-an-axle-fitting', 'Buy a replacement fitting', 'A runner returns with a plain iron shoe and the wheelwright receipt.', [{ type: 'gold', scope: 'banked', amount: -6 }, { type: 'flag', operation: 'add', flagId: 'replacement-fitting-bought' }], 'ch01-living-bent-axle-work', 'Fit the new iron', { requirements: [{ type: 'gold', scope: 'banked', amount: 6 }] }),
  ] }),
  base({ id: 'ch01-living-bent-axle-work', slot: 3, type: 'journey', journeySubtype: 'travel', family: 'bent-axle', pacing: 'quiet', illustrationId: 'scene-ch01-living-bent-axle-work', title: 'Weight on the Jack', line: 'The fever bark is on the low side. If that case breaks, Greywatch loses it first.', narrative: ['The lifting bars bow beneath the rear frame, and a slip could crack the lowest medicine case.'], choices: [
    checked('ch01-choice-lift-and-pin-the-axle', 'Lift and pin the axle', 'strength', 6, 'Drivers on the lifting bars +5', 'ch01-living-bent-axle-aftermath', 'Test the repair', [{ type: 'flag', operation: 'add', flagId: 'rear-wagon-braced' }, { type: 'xp', amount: 10, source: 'story' }]),
    checked('ch01-choice-rebalance-by-manifest', 'Rebalance by the manifest', 'cunning', 6, 'Cases already numbered +5', 'ch01-living-bent-axle-aftermath', 'Test the repair', [{ type: 'flag', operation: 'add', flagId: 'load-redistributed' }, { type: 'xp', amount: 10, source: 'story' }]),
    direct('ch01-choice-install-the-bought-fitting', 'Install the bought fitting', 'The new shoe seats cleanly and the wheel turns without a knock.', [{ type: 'flag', operation: 'add', flagId: 'replacement-fitting-installed' }, { type: 'xp', amount: 8, source: 'story' }], 'ch01-living-bent-axle-aftermath', 'Test the repair', { requirements: [{ type: 'flag', flagId: 'replacement-fitting-bought' }] }),
  ] }),
  base({ id: 'ch01-living-bent-axle-aftermath', slot: 4, type: 'journey', journeySubtype: 'travel', family: 'bent-axle-aftermath', pacing: 'recovery', illustrationId: 'scene-ch01-living-bent-axle-aftermath', title: 'The Wagon Rolls True', line: 'Greywatch can argue with the ledger after it has the medicine.', narrative: ['The rear wagon completes a slow circle without leaning, though no one mistakes road work for a new axle.'], choices: [
    direct('ch01-choice-record-the-axle-repair', 'Record the repair', 'Jory adds the repair, lost time, and moved cases to the manifest.', [{ type: 'flag', operation: 'add', flagId: 'axle-repair-recorded' }, { type: 'evidence', operation: 'add', evidenceId: 'convoy-repair-record' }], 'ch01-main-medicine-for-the-north', 'Read the manifest'),
    direct('ch01-choice-use-the-saved-light', 'Use the remaining light', 'The wagons regain the road before other traffic closes around them.', [{ type: 'threat', amount: -1 }, { type: 'flag', operation: 'add', flagId: 'convoy-made-up-repair-time' }], 'ch01-main-medicine-for-the-north', 'Take the first grade'),
  ] }),
  base({ id: 'ch01-living-hooves-chalk-setup', slot: 7, type: 'journey', journeySubtype: 'travel', family: 'hooves-in-chalk', pacing: 'quiet', illustrationId: 'scene-ch01-living-hooves-chalk-setup', title: 'White Road, Stopped Team', line: 'They smell something under the chalk. If I whip them now, one of us goes over the edge.', narrative: ['Fresh rain turns the chalk road white. The lead horses stop together at a shallow bend above a ditch.'], choices: [
    direct('ch01-choice-hold-the-rear-brake', 'Hold the rear brake', 'The rear wagon stops a handspan from the lead cart.', [{ type: 'vitals', resource: -1 }, { type: 'flag', operation: 'add', flagId: 'chalk-rear-brake-held' }], 'ch01-living-hooves-chalk-choice', 'Inspect the chalk'),
    direct('ch01-choice-clear-the-drivers-from-the-slope', 'Clear the drivers from the slope', 'The drivers move uphill with the reins while you take the exposed ground.', [{ type: 'flag', operation: 'add', flagId: 'chalk-drivers-sheltered' }, { type: 'tension', amount: 1 }], 'ch01-living-hooves-chalk-choice', 'Inspect the chalk'),
  ] }),
  base({ id: 'ch01-living-hooves-chalk-choice', slot: 8, type: 'journey', journeySubtype: 'investigation', family: 'hooves-in-chalk', pacing: 'danger', illustrationId: 'scene-ch01-living-hooves-chalk-choice', title: 'What the Horses Smelled', line: 'Those are made points, not broken nails.', narrative: ['A gust reveals short iron points pressed into the chalk where a halted wagon would be exposed.'], choices: [
    checked('ch01-choice-calm-the-chalk-team', 'Calm the lead team', 'will', 6, 'Driver keeps the reins +5', 'ch01-living-hooves-chalk-aftermath', 'See what the trap cost', [{ type: 'flag', operation: 'add', flagId: 'chalk-horses-calmed' }, { type: 'xp', amount: 10, source: 'story' }], 'enc-ch01-ditch-road-cutters'),
    checked('ch01-choice-read-the-buried-points', 'Read the buried line', 'cunning', 6, 'Rain exposes the pattern +5', 'ch01-living-hooves-chalk-aftermath', 'See what the trap cost', [{ type: 'flag', operation: 'add', flagId: 'chalk-trap-read' }, { type: 'evidence', operation: 'add', evidenceId: 'road-cutter-pattern' }], 'enc-ch01-ditch-road-cutters'),
    checked('ch01-choice-drag-the-team-through-chalk', 'Drag the pole clear', 'strength', 7, 'Both drivers pull +5', 'ch01-living-hooves-chalk-aftermath', 'See what the trap cost', [{ type: 'flag', operation: 'add', flagId: 'chalk-team-dragged-clear' }, { type: 'xp', amount: 10, source: 'story' }], 'enc-ch01-ditch-road-cutters'),
  ] }),
  base({ id: 'ch01-living-hooves-chalk-aftermath', slot: 9, type: 'journey', journeySubtype: 'investigation', family: 'hooves-in-chalk-aftermath', pacing: 'recovery', illustrationId: 'scene-ch01-living-hooves-chalk-aftermath', title: 'Tracks Leaving the Bend', line: 'Raiders scatter. Soldiers are taught when to scatter.', narrative: ['The teams stand on firm stone while paired boot prints leave the ditch in disciplined lines.'], choices: [
    direct('ch01-choice-mark-the-paired-tracks', 'Mark the paired tracks', 'Jory sketches their spacing beside the record of the buried points.', [{ type: 'flag', operation: 'add', flagId: 'paired-road-tracks-recorded' }, { type: 'xp', amount: 8, source: 'story' }], 'ch01-living-cut-milestone-setup', 'Reach the cut milestone'),
    direct('ch01-choice-tend-the-horses-first', 'Tend the horses first', 'The drivers wash chalk from every hoof before moving.', [{ type: 'vitals', resource: 2 }, { type: 'flag', operation: 'add', flagId: 'chalk-horses-tended' }, { type: 'tension', amount: 1 }], 'ch01-living-cut-milestone-setup', 'Lead the teams onward'),
  ] }),
]);
