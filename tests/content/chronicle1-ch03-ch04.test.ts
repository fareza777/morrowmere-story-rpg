import { describe, expect, it } from 'vitest';

import { CH03_SCENES } from '../../src/game/content/chronicle1/chapters/ch03';
import { CH04_SCENES } from '../../src/game/content/chronicle1/chapters/ch04';
import { chronicle1ChoiceEffects, chronicle1ChoiceOutcomes } from '../../src/game/content/schema';

const CH03_ANCHORS = [
  'ch03-main-orders-for-redwater',
  'ch03-main-the-flooded-mile',
  'ch03-main-the-captured-courier',
  'ch03-main-rukhar-at-the-crossing',
  'ch03-main-evidence-on-both-sides',
  'ch03-main-the-attack-with-two-banners',
  'ch03-main-redwater-in-sight',
] as const;

const CH04_ANCHORS = [
  'ch04-main-two-armies-one-field',
  'ch04-main-parley-between-lines',
  'ch04-main-the-murdered-scout',
  'ch04-main-orders-written-to-be-found',
  'ch04-main-before-the-first-charge',
  'ch04-main-terms-at-redwater',
  'ch04-main-what-the-river-carried-away',
] as const;

const RUKHAR_CALLBACKS = [
  'ch03-companion-courier-testimony',
  'ch03-companion-rukhar-keeps-watch',
  'ch04-companion-stop-the-retaliation',
  'ch04-companion-the-cost-of-peace',
] as const;

const RUKHAR_DECISIONS = [
  'rukhar-met',
  'orc-courier-spared',
  'retaliation-prevented',
  'peace-evidence-carried',
  'political-cost-accepted',
] as const;

type Scene = (typeof CH03_SCENES)[number] | (typeof CH04_SCENES)[number];

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
    chapterId: 'ch03',
    scenes: CH03_SCENES,
    quotas: { main: 7, companion: 8, journey: 18, combat: 6, hub: 3 },
    anchors: CH03_ANCHORS,
    journey: { travel: 7, investigation: 4, 'side-quest': 3, dungeon: 1, 'moral-choice': 3 },
  },
  {
    chapterId: 'ch04',
    scenes: CH04_SCENES,
    quotas: { main: 7, companion: 9, journey: 18, combat: 6, hub: 3 },
    anchors: CH04_ANCHORS,
    journey: { travel: 6, investigation: 4, 'side-quest': 2, dungeon: 2, 'moral-choice': 4 },
  },
] as const)('$chapterId authored catalog', ({ chapterId, scenes, quotas, anchors, journey }) => {
  it('keeps the locked category quota and one-based chapter slots', () => {
    expect(countSceneTypes(scenes)).toEqual(quotas);
    expect(scenes.map((scene) => scene.slot)).toEqual(
      Array.from({ length: scenes.length }, (_, index) => index + 1),
    );
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
  });

  it('keeps all seven mandatory main anchors in canonical order', () => {
    const mainScenes = scenes.filter((scene) => scene.type === 'main');
    expect(mainScenes.map((scene) => scene.id)).toEqual(anchors);
    expect(mainScenes.map((scene) => scene.anchorOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('uses unique scene art and concrete, non-leading English choices', () => {
    expect(new Set(scenes.map((scene) => scene.illustrationId)).size).toBe(scenes.length);
    for (const scene of scenes) {
      expect(scene.chapterId).toBe(chapterId);
      expect(scene.region).toBe('drowned-road');
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

  it('contains one camp and two staffed service scenes', () => {
    const hubs = scenes.filter((scene) => scene.type === 'hub');
    expect(hubs.filter((scene) => scene.family === 'camp').length).toBe(1);
    expect(hubs.filter((scene) => scene.merchantId !== undefined).length).toBe(2);
  });
});

it('keeps twelve distinct combat premises across the two chapters', () => {
  const combatScenes = [...CH03_SCENES, ...CH04_SCENES].filter((scene) => scene.type === 'combat');
  expect(new Set(combatScenes.map((scene) => scene.encounterId)).size).toBe(12);
  expect(new Set(combatScenes.map((scene) => scene.family)).size).toBe(12);
});

it('earns Rukhar through callbacks, five decisions, a blocker, and a later recruitment scene', () => {
  const scenes = [...CH03_SCENES, ...CH04_SCENES];
  const sceneIds = new Set<string>(scenes.map((scene) => scene.id));
  for (const callbackId of RUKHAR_CALLBACKS) expect(sceneIds.has(callbackId), callbackId).toBe(true);

  const addedFlags = new Set<string>(
    scenes.flatMap((scene) => scene.choices).flatMap((choice) => chronicle1ChoiceEffects(choice))
      .filter((effect) => effect.type === 'flag' && effect.operation === 'add')
      .map((effect) => effect.type === 'flag' ? effect.flagId : ''),
  );
  for (const decision of RUKHAR_DECISIONS) expect(addedFlags.has(decision), decision).toBe(true);
  expect(addedFlags.has('rukhar-betrayed')).toBe(true);

  const finalGateIndex = scenes.findIndex((scene) => scene.id === 'ch04-companion-the-cost-of-peace');
  const recruitmentIndex = scenes.findIndex((scene) => scene.id === 'ch04-companion-stonehand-joins-the-road');
  expect(finalGateIndex).toBeGreaterThan(-1);
  expect(recruitmentIndex).toBeGreaterThan(finalGateIndex);

  const recruitment = scenes[recruitmentIndex]!;
  expect(recruitment.eligibility.requiredFlags).toEqual(RUKHAR_DECISIONS);
  expect(recruitment.eligibility.excludedFlags).toContain('rukhar-betrayed');
  expect(
    recruitment.choices.flatMap((choice) => chronicle1ChoiceEffects(choice))
      .some((effect) => effect.type === 'companion' && effect.operation === 'recruit' && effect.companionId === 'rukhar'),
  ).toBe(true);
});

it('reveals the false flag before settlement and points directly to Embervault', () => {
  const reveal = CH04_SCENES.findIndex((scene) => scene.id === 'ch04-main-orders-written-to-be-found');
  const settlement = CH04_SCENES.findIndex((scene) => scene.id === 'ch04-main-terms-at-redwater');
  expect(reveal).toBeGreaterThan(-1);
  expect(settlement).toBeGreaterThan(reveal);

  const finale = CH04_SCENES.find((scene) => scene.id === 'ch04-main-what-the-river-carried-away')!;
  expect(`${finale.narrative.join(' ')} ${finale.choices.flatMap((choice) => chronicle1ChoiceOutcomes(choice)).join(' ')}`.toLowerCase())
    .toContain('embervault');
});
