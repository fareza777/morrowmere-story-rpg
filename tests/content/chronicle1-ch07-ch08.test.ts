import { describe, expect, it } from 'vitest';

import { CH07_SCENES } from '../../src/game/content/chronicle1/chapters/ch07';
import {
  CH08_SCENES,
  ENDING_AXIS_FLAGS,
  KEEP_CUSTODIAN_FLAGS,
} from '../../src/game/content/chronicle1/chapters/ch08';

const CH07_ANCHORS = [
  'ch07-main-council-before-the-march',
  'ch07-main-banners-on-the-kingroad',
  'ch07-main-the-outer-patrol',
  'ch07-main-wall-or-hidden-way',
  'ch07-main-the-crownless-gate',
  'ch07-main-voss-last-champion',
  'ch07-main-inside-the-keep',
] as const;

const CH08_ANCHORS = [
  'ch08-main-guests-for-a-false-king',
  'ch08-main-the-hall-of-seals',
  'ch08-main-evidence-before-the-realm',
  'ch08-main-voss-offers-order',
  'ch08-main-the-marshal-and-the-banner',
  'ch08-main-who-keeps-the-crownless-keep',
  'ch08-main-the-letter-in-cipher',
] as const;

type Scene = (typeof CH07_SCENES)[number] | (typeof CH08_SCENES)[number];

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

function addedFlags(choice: Scene['choices'][number]) {
  return choice.effects
    .filter((effect) => effect.type === 'flag' && effect.operation === 'add')
    .map((effect) => effect.type === 'flag' ? effect.flagId : '');
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
    expect(choice.outcome.length, `${scene.id}/${choice.id}`).toBeGreaterThanOrEqual(25);
    expect(choice.effects.length, `${scene.id}/${choice.id}`).toBeGreaterThan(0);
    expect(`${choice.label} ${choice.detail}`.toLowerCase()).not.toMatch(/\b(correct|best|optimal|wrong)\b/);
  }
}

describe.each([
  {
    id: 'ch07',
    scenes: CH07_SCENES,
    quotas: { main: 7, companion: 8, journey: 16, combat: 6, hub: 3 },
    anchors: CH07_ANCHORS,
    journey: { travel: 6, investigation: 2, 'side-quest': 3, dungeon: 2, 'moral-choice': 3 },
    owners: ['mara', 'talla', 'talla', 'caldus', 'lyra', 'lyra', 'rukhar', 'rukhar'],
  },
  {
    id: 'ch08',
    scenes: CH08_SCENES,
    quotas: { main: 7, companion: 7, journey: 15, combat: 6, hub: 3 },
    anchors: CH08_ANCHORS,
    journey: { travel: 6, investigation: 3, 'side-quest': 3, dungeon: 1, 'moral-choice': 2 },
    owners: ['talla', 'talla', 'talla', 'caldus', 'lyra', 'lyra', 'lyra'],
  },
] as const)('$id finale catalog', ({ id, scenes, quotas, anchors, journey, owners }) => {
  it('keeps the locked category quota and contiguous slots', () => {
    expect(countTypes(scenes)).toEqual(quotas);
    expect(scenes.map((scene) => scene.slot)).toEqual(
      Array.from({ length: scenes.length }, (_, index) => index + 1),
    );
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
  });

  it('keeps all seven mandatory anchors in order', () => {
    const main = scenes.filter((scene) => scene.type === 'main');
    expect(main.map((scene) => scene.id)).toEqual(anchors);
    expect(main.map((scene) => scene.anchorOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('uses concrete English copy and unique Crownless Keep art', () => {
    expect(new Set(scenes.map((scene) => scene.illustrationId)).size).toBe(scenes.length);
    for (const scene of scenes) {
      expect(scene.chapterId).toBe(id);
      expect(scene.region).toBe('crownless-keep');
      expect(scene.illustrationId).toBe(`scene-${scene.id}`);
      expectConcreteCopy(scene);
    }
  });

  it('keeps its journey, relationship, hub, and combat ledgers', () => {
    expect(countJourneySubtypes(scenes)).toEqual(journey);
    expect(relationshipOwners(scenes)).toEqual([...owners].sort());
    const combats = scenes.filter((scene) => scene.type === 'combat');
    expect(new Set(combats.map((scene) => scene.encounterId)).size).toBe(6);
    expect(new Set(combats.map((scene) => scene.family)).size).toBe(6);
    expect(combats.every((scene) => scene.encounterId?.startsWith(`enc-${id}-`))).toBe(true);
    const hubs = scenes.filter((scene) => scene.type === 'hub');
    expect(hubs.filter((scene) => scene.family === 'camp')).toHaveLength(1);
    expect(hubs.filter((scene) => scene.merchantId !== undefined)).toHaveLength(2);
  });
});

it('forms a coalition only through an earned option and keeps fallback marches', () => {
  const muster = CH07_SCENES.find((scene) => scene.id === 'ch07-main-banners-on-the-kingroad')!;
  const coalition = muster.choices.find((choice) => addedFlags(choice).includes('coalition-formed'))!;
  expect(coalition.requirements?.length).toBeGreaterThanOrEqual(2);
  expect(muster.choices.some((choice) => addedFlags(choice).includes('fragile-march'))).toBe(true);
  expect(muster.choices.some((choice) => addedFlags(choice).includes('survivor-column-march'))).toBe(true);

  const approach = CH07_SCENES.find((scene) => scene.id === 'ch07-main-wall-or-hidden-way')!;
  expect(approach.choices).toHaveLength(4);
  expect(approach.choices.filter((choice) => (choice.requirements?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(3);
  expect(approach.choices.some((choice) => (choice.requirements?.length ?? 0) === 0)).toBe(true);
});

it('lets Voss make his strongest argument before every confrontation outcome', () => {
  const proofIndex = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-evidence-before-the-realm');
  const offerIndex = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-voss-offers-order');
  const resolutionIndex = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-the-marshal-and-the-banner');
  const offer = CH08_SCENES[offerIndex]!;
  expect(proofIndex).toBeLessThan(offerIndex);
  expect(offerIndex).toBeLessThan(resolutionIndex);
  expect(offer.narrative.join(' ').toLowerCase()).toMatch(/roads|realm/);
  expect(offer.narrative.join(' ').toLowerCase()).toContain('manufactured');

  const resolution = CH08_SCENES[resolutionIndex]!;
  expect(resolution.choices).toHaveLength(3);
  const peaceful = resolution.choices.find((choice) => choice.id === 'ch08-choice-take-voss-into-public-custody')!;
  const forceful = resolution.choices.find((choice) => choice.id === 'ch08-choice-seize-the-command-platform')!;
  const failed = resolution.choices.find((choice) => choice.id === 'ch08-choice-break-the-engine-and-evacuate')!;
  expect(addedFlags(peaceful)).toEqual(expect.arrayContaining(['voss-exposed', 'war-mechanism-dismantled', 'border-war-stopped']));
  expect(addedFlags(forceful)).toEqual(expect.arrayContaining(['voss-exposed', 'war-mechanism-dismantled', 'border-war-stopped', 'forceful-settlement']));
  expect(addedFlags(failed)).toEqual(expect.arrayContaining(['war-mechanism-dismantled', 'open-war', 'failed-accountability']));
});

it('selects one eligible custodian only after Voss is resolved', () => {
  expect(KEEP_CUSTODIAN_FLAGS).toEqual([
    'keep-border-council',
    'keep-greywatch',
    'keep-free-host',
    'keep-neutral-wardens',
  ]);
  expect(ENDING_AXIS_FLAGS).toEqual([
    'voss-exposed',
    'border-peace',
    'coalition-formed',
    'open-war',
    ...KEEP_CUSTODIAN_FLAGS,
  ]);

  const resolutionIndex = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-the-marshal-and-the-banner');
  const custodianIndex = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-who-keeps-the-crownless-keep');
  expect(custodianIndex).toBeGreaterThan(resolutionIndex);
  const custodian = CH08_SCENES[custodianIndex]!;
  expect(custodian.choices).toHaveLength(4);

  for (const [index, choice] of custodian.choices.entries()) {
    const selected = addedFlags(choice).filter((flag) => KEEP_CUSTODIAN_FLAGS.includes(flag as typeof KEEP_CUSTODIAN_FLAGS[number]));
    expect(selected, choice.id).toEqual([KEEP_CUSTODIAN_FLAGS[index]]);
    const removed = choice.effects
      .filter((effect) => effect.type === 'flag' && effect.operation === 'remove')
      .map((effect) => effect.type === 'flag' ? effect.flagId : '')
      .filter((flag) => KEEP_CUSTODIAN_FLAGS.includes(flag as typeof KEEP_CUSTODIAN_FLAGS[number]));
    expect(removed, choice.id).toHaveLength(3);
  }
  expect(custodian.choices.slice(0, 3).every((choice) => (choice.requirements?.length ?? 0) > 0)).toBe(true);
  expect(custodian.choices[3]?.requirements ?? []).toHaveLength(0);
});

it('reveals the cipher letter only after conflict resolution and custody', () => {
  const resolution = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-the-marshal-and-the-banner');
  const custodian = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-who-keeps-the-crownless-keep');
  const letter = CH08_SCENES.findIndex((scene) => scene.id === 'ch08-main-the-letter-in-cipher');
  expect(letter).toBeGreaterThan(resolution);
  expect(letter).toBeGreaterThan(custodian);
  expect(CH08_SCENES[letter]?.slot).toBe(38);

  const copy = CH08_SCENES[letter]!.narrative.join(' ');
  expect(copy.toLowerCase()).toContain('the first fracture');
  expect(copy).not.toMatch(/Chronicle II|second mastermind/i);
});
