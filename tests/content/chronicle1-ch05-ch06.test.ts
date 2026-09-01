import { describe, expect, it } from 'vitest';

import { CH05_SCENES } from '../../src/game/content/chronicle1/chapters/ch05';
import {
  CH06_SCENES,
  GREYWATCH_OUTCOME_FLAGS,
  LEAK_PATH_IDS,
} from '../../src/game/content/chronicle1/chapters/ch06';
import { chronicle1ChoiceEffects, chronicle1ChoiceOutcomes } from '../../src/game/content/schema';

const CH05_ANCHORS = [
  'ch05-main-the-mouth-of-embervault',
  'ch05-main-the-missing-shift',
  'ch05-main-forge-behind-the-wall',
  'ch05-main-the-quartermasters-ledger',
  'ch05-main-weapons-for-both-armies',
  'ch05-main-the-name-severin-voss',
  'ch05-main-escape-through-the-cinder-shaft',
] as const;

const CH06_ANCHORS = [
  'ch06-main-smoke-over-greywatch',
  'ch06-main-the-message-that-broke',
  'ch06-main-the-leak-in-the-watch',
  'ch06-main-hostages-under-the-chapel',
  'ch06-main-the-siege-begins',
  'ch06-main-the-last-open-breach',
  'ch06-main-what-remains-of-greywatch',
] as const;

type Scene = (typeof CH05_SCENES)[number] | (typeof CH06_SCENES)[number];

function countTypes(scenes: readonly Scene[]) {
  return scenes.reduce<Record<Scene['type'], number>>(
    (counts, scene) => ({ ...counts, [scene.type]: counts[scene.type] + 1 }),
    { main: 0, companion: 0, journey: 0, combat: 0, hub: 0 },
  );
}

function countJourneySubtypes(scenes: readonly Scene[]) {
  return scenes
    .filter((scene) => scene.type === 'journey')
    .reduce<Record<string, number>>((counts, scene) => {
      const key = scene.journeySubtype ?? 'missing';
      return { ...counts, [key]: (counts[key] ?? 0) + 1 };
    }, {});
}

function relationshipOwners(scenes: readonly Scene[]) {
  return scenes
    .filter((scene) => scene.type === 'companion')
    .map((scene) => scene.relationship?.kind === 'companion'
      ? scene.relationship.companionId
      : `faction:${scene.relationship?.kind === 'faction' ? scene.relationship.factionId : 'missing'}`)
    .sort();
}

function expectConcreteCopy(scene: Scene) {
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
}

describe.each([
  {
    id: 'ch05',
    scenes: CH05_SCENES,
    anchors: CH05_ANCHORS,
    journey: { travel: 4, investigation: 3, 'side-quest': 3, dungeon: 5, 'moral-choice': 2 },
    owners: ['caldus', 'caldus', 'caldus', 'caldus', 'lyra', 'lyra', 'lyra', 'mara', 'talla', 'faction:border-council'],
  },
  {
    id: 'ch06',
    scenes: CH06_SCENES,
    anchors: CH06_ANCHORS,
    journey: { travel: 5, investigation: 3, 'side-quest': 3, dungeon: 2, 'moral-choice': 4 },
    owners: ['caldus', 'caldus', 'caldus', 'caldus', 'lyra', 'mara', 'rukhar', 'talla', 'faction:greywatch', 'faction:greywatch'],
  },
] as const)('$id authored catalog', ({ id, scenes, anchors, journey, owners }) => {
  it('contains the locked 43-scene quota and one-based slots', () => {
    expect(countTypes(scenes)).toEqual({ main: 7, companion: 10, journey: 17, combat: 6, hub: 3 });
    expect(scenes.map((scene) => scene.slot)).toEqual(Array.from({ length: 43 }, (_, index) => index + 1));
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(43);
  });

  it('keeps canonical anchors and concrete unique art', () => {
    const main = scenes.filter((scene) => scene.type === 'main');
    expect(main.map((scene) => scene.id)).toEqual(anchors);
    expect(main.map((scene) => scene.anchorOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(scenes.map((scene) => scene.illustrationId)).size).toBe(43);
    for (const scene of scenes) {
      expect(scene.chapterId).toBe(id);
      expect(scene.illustrationId).toBe(`scene-${scene.id}`);
      expectConcreteCopy(scene);
    }
  });

  it('keeps its journey mix, relationship ledger, and six combat premises', () => {
    expect(countJourneySubtypes(scenes)).toEqual(journey);
    expect(relationshipOwners(scenes)).toEqual([...owners].sort());
    const encounters = scenes.filter((scene) => scene.type === 'combat').map((scene) => scene.encounterId);
    expect(new Set(encounters).size).toBe(6);
    expect(encounters.every((encounterId) => encounterId?.startsWith(`enc-${id}-`))).toBe(true);
  });
});

it('attributes the conspiracy only after the ledger and symmetric weapons', () => {
  const ledger = CH05_SCENES.find((scene) => scene.id === 'ch05-main-the-quartermasters-ledger');
  const weapons = CH05_SCENES.find((scene) => scene.id === 'ch05-main-weapons-for-both-armies');
  const naming = CH05_SCENES.find((scene) => scene.id === 'ch05-main-the-name-severin-voss');
  const escape = CH05_SCENES.find((scene) => scene.id === 'ch05-main-escape-through-the-cinder-shaft');
  expect([ledger?.slot, weapons?.slot, naming?.slot, escape?.slot]).toEqual([20, 27, 34, 43]);

  const copyBeforeNaming = CH05_SCENES
    .filter((scene) => scene.slot < (naming?.slot ?? 0))
    .flatMap((scene) => scene.narrative)
    .join(' ');
  expect(copyBeforeNaming).not.toContain('Severin Voss');
});

it('keeps the two coerced leak paths exclusive and convergent', () => {
  expect(LEAK_PATH_IDS).toEqual([
    'ch06-companion-caldus-confession',
    'ch06-faction-sergeant-hale-confession',
  ]);
  const leak = CH06_SCENES.find((scene) => scene.id === 'ch06-main-the-leak-in-the-watch');
  expect(leak?.followUps).toEqual(expect.arrayContaining([...LEAK_PATH_IDS]));

  const caldus = CH06_SCENES.find((scene) => scene.id === LEAK_PATH_IDS[0]);
  const hale = CH06_SCENES.find((scene) => scene.id === LEAK_PATH_IDS[1]);
  expect(caldus?.eligibility.requiredFlags).toContain('caldus-recruited');
  expect(hale?.eligibility.excludedFlags).toContain('caldus-recruited');
  expect(caldus?.followUps).toEqual(['ch06-main-hostages-under-the-chapel']);
  expect(hale?.followUps).toEqual(['ch06-main-hostages-under-the-chapel']);
});

it('offers exactly one mutually exclusive Greywatch result per eligible aftermath choice', () => {
  expect(GREYWATCH_OUTCOME_FLAGS).toEqual(['greywatch-held', 'greywatch-damaged', 'greywatch-fallen']);
  const aftermath = CH06_SCENES.find((scene) => scene.id === 'ch06-main-what-remains-of-greywatch');
  expect(aftermath?.choices).toHaveLength(3);

  const added = aftermath?.choices.map((choice) => chronicle1ChoiceEffects(choice)
    .flatMap((effect) => (
      effect.type === 'flag' && effect.operation === 'add' ? [effect.flagId] : []
    ))
    .filter((flagId) => GREYWATCH_OUTCOME_FLAGS.includes(flagId as typeof GREYWATCH_OUTCOME_FLAGS[number])));
  expect(added).toEqual([['greywatch-held'], ['greywatch-damaged'], ['greywatch-fallen']]);

  for (const choice of aftermath?.choices ?? []) {
    const removed = chronicle1ChoiceEffects(choice)
      .flatMap((effect) => (
        effect.type === 'flag' && effect.operation === 'remove' ? [effect.flagId] : []
      ))
      .filter((flagId) => GREYWATCH_OUTCOME_FLAGS.includes(flagId as typeof GREYWATCH_OUTCOME_FLAGS[number]));
    expect(removed).toHaveLength(2);
  }
});

it('keeps Caldus and Lyra recruitment after their final personal-quest requirement', () => {
  const ids = new Set<string>(CH05_SCENES.map((scene) => scene.id));
  expect(ids.has('ch05-companion-caldus-keeps-confidence')).toBe(true);
  expect(ids.has('ch05-companion-caldus-the-first-hostages')).toBe(true);
  expect(ids.has('ch05-companion-caldus-answers-the-road')).toBe(true);
  expect(ids.has('ch05-companion-lyra-and-the-embervault-ward')).toBe(true);
  expect(ids.has('ch05-companion-lyra-chooses-the-slower-truth')).toBe(true);
});
