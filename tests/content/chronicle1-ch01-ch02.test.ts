import { describe, expect, it } from 'vitest';

import { CH01_SCENES } from '../../src/game/content/chronicle1/chapters/ch01';
import { CH02_SCENES } from '../../src/game/content/chronicle1/chapters/ch02';
import { chronicle1ChoiceEffects, chronicle1ChoiceOutcomes } from '../../src/game/content/schema';

const CH01_ANCHORS = [
  'ch01-main-three-days-to-greywatch',
  'ch01-main-medicine-for-the-north',
  'ch01-main-the-empty-tollhouse',
  'ch01-main-the-first-arrow',
  'ch01-main-the-bridge-in-smoke',
  'ch01-main-a-banner-placed-too-neatly',
  'ch01-main-before-the-gates-close',
] as const;

const CH02_ANCHORS = [
  'ch02-main-warning-before-dawn',
  'ch02-main-raiders-at-the-wall',
  'ch02-main-hold-the-south-gate',
  'ch02-main-the-royal-fletching',
  'ch02-main-the-witness-speaks',
  'ch02-main-greywatch-council',
  'ch02-main-the-hidden-depot',
] as const;

type Scene = (typeof CH01_SCENES)[number] | (typeof CH02_SCENES)[number];

function countSceneTypes(scenes: readonly Scene[]) {
  return scenes.reduce<Record<Scene['type'], number>>(
    (counts, scene) => ({ ...counts, [scene.type]: counts[scene.type] + 1 }),
    { main: 0, companion: 0, journey: 0, combat: 0, hub: 0 },
  );
}

function countJourneySubtypes(scenes: readonly Scene[]) {
  return scenes
    .filter((scene) => scene.type === 'journey')
    .reduce<Record<string, number>>((counts, scene) => {
      const subtype = scene.journeySubtype ?? 'missing';
      return { ...counts, [subtype]: (counts[subtype] ?? 0) + 1 };
    }, {});
}

function expectConcreteCopy(scene: Scene) {
  expect(scene.title.length, scene.id).toBeGreaterThanOrEqual(5);
  expect(scene.narrative.length, scene.id).toBeGreaterThanOrEqual(2);
  expect(scene.narrative.every((paragraph) => paragraph.length >= 35), scene.id).toBe(true);
  expect(scene.choices.length, scene.id).toBeGreaterThanOrEqual(2);
  expect(scene.choices.length, scene.id).toBeLessThanOrEqual(4);

  for (const choice of scene.choices) {
    expect(choice.label.length, `${scene.id}/${choice.id}`).toBeGreaterThanOrEqual(5);
    expect(choice.detail.length, `${scene.id}/${choice.id}`).toBeGreaterThanOrEqual(25);
    expect(chronicle1ChoiceOutcomes(choice).every((outcome) => outcome.length >= 25), `${scene.id}/${choice.id}`).toBe(true);
    expect(chronicle1ChoiceEffects(choice).length, `${scene.id}/${choice.id}`).toBeGreaterThan(0);
    expect(`${choice.label} ${choice.detail}`.toLowerCase()).not.toMatch(/\b(correct|best|optimal|wrong)\b/);
  }

  expect(scene.narrative.join(' ')).not.toMatch(/\b(?:TODO|TBD|placeholder)\b/i);
}

describe.each([
  {
    chapterId: 'ch01',
    scenes: CH01_SCENES,
    quotas: { main: 7, companion: 5, journey: 20, combat: 6, hub: 3 },
    anchors: CH01_ANCHORS,
    journey: { travel: 8, investigation: 4, 'side-quest': 4, dungeon: 1, 'moral-choice': 3 },
    companionIds: ['mara', 'mara', 'talla', 'talla'] as const,
  },
  {
    chapterId: 'ch02',
    scenes: CH02_SCENES,
    quotas: { main: 7, companion: 7, journey: 19, combat: 6, hub: 3 },
    anchors: CH02_ANCHORS,
    journey: { travel: 6, investigation: 5, 'side-quest': 3, dungeon: 2, 'moral-choice': 3 },
    companionIds: ['caldus', 'lyra', 'mara', 'mara', 'mara', 'talla'] as const,
  },
] as const)('$chapterId opening catalog', ({ chapterId, scenes, quotas, anchors, journey, companionIds }) => {
  it('keeps the locked category quota and one-based chapter slots', () => {
    expect(countSceneTypes(scenes)).toEqual(quotas);
    expect(scenes.map((scene) => scene.slot)).toEqual(
      Array.from({ length: scenes.length }, (_, index) => index + 1),
    );
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
  });

  it('keeps all seven main anchors in canonical order', () => {
    const mainScenes = scenes.filter((scene) => scene.type === 'main');
    expect(mainScenes.map((scene) => scene.id)).toEqual(anchors);
    expect(mainScenes.map((scene) => scene.anchorOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('uses unique scene art and concrete, non-leading English choices', () => {
    expect(new Set(scenes.map((scene) => scene.illustrationId)).size).toBe(scenes.length);
    for (const scene of scenes) {
      expect(scene.chapterId).toBe(chapterId);
      expect(scene.region).toBe('gloamwood');
      expect(scene.illustrationId).toBe(`scene-${scene.id}`);
      expectConcreteCopy(scene);
    }
  });

  it('keeps the planned journey mix and six distinct combat premises', () => {
    expect(countJourneySubtypes(scenes)).toEqual(journey);
    const combatScenes = scenes.filter((scene) => scene.type === 'combat');
    expect(new Set(combatScenes.map((scene) => scene.encounterId)).size).toBe(6);
    expect(combatScenes.every((scene) => scene.encounterId?.startsWith(`enc-${chapterId}-`))).toBe(true);
  });

  it('contains one camp, two service scenes, and the intended relationship ownership', () => {
    const hubs = scenes.filter((scene) => scene.type === 'hub');
    expect(hubs.filter((scene) => scene.family === 'camp').length).toBe(1);
    expect(hubs.filter((scene) => scene.merchantId !== undefined).length).toBe(2);

    const relationshipOwners = scenes
      .flatMap((scene) => {
        const relationship = scene.relationship;
        return scene.type === 'companion' && relationship?.kind === 'companion'
          ? [relationship.companionId]
          : [];
      })
      .sort();
    expect(relationshipOwners).toEqual([...companionIds].sort());
  });
});

it('contains the locked early companion quest scenes', () => {
  const ids = new Set<string>([...CH01_SCENES, ...CH02_SCENES].map((scene) => scene.id));
  expect(ids.has('ch01-companion-mara-at-the-burning-bridge')).toBe(true);
  expect(ids.has('ch01-companion-talla-and-the-spared-courier')).toBe(true);
  expect(ids.has('ch02-companion-mara-the-broken-command')).toBe(true);
  expect(ids.has('ch02-companion-mara-scouts-before-silver')).toBe(true);
  expect(ids.has('ch02-companion-caldus-among-the-refugees')).toBe(true);
  expect(ids.has('ch02-companion-lyra-reads-the-seal')).toBe(true);
  expect(ids.has('ch02-companion-talla-keeps-the-bargain')).toBe(true);
});
