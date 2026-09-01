import { describe, expect, it } from 'vitest';

import {
  CHRONICLE1,
  CHRONICLE1_COMPANIONS,
  CHRONICLE1_CONTENT,
  CHRONICLE1_FACTIONS,
  CHRONICLE1_MERCHANTS,
  CHRONICLE1_MEDIA_CONTRACT,
  CHRONICLE1_ROUTES,
  CHRONICLE1_SCENE_INDEX,
  CHRONICLE1_SCENES,
} from '../../src/game/content/chronicle1';
import { chronicle1ChoiceEffects, chronicle1ChoiceOutcomes, type Chronicle1Event } from '../../src/game/content/schema';
import { validateChronicleSources } from '../../src/game/content/validate';

const CHAPTER_LEDGER = {
  ch01: { main: 7, companion: 5, journey: 20, combat: 6, hub: 3, total: 41 },
  ch02: { main: 7, companion: 7, journey: 19, combat: 6, hub: 3, total: 42 },
  ch03: { main: 7, companion: 8, journey: 18, combat: 6, hub: 3, total: 42 },
  ch04: { main: 7, companion: 9, journey: 18, combat: 6, hub: 3, total: 43 },
  ch05: { main: 7, companion: 10, journey: 17, combat: 6, hub: 3, total: 43 },
  ch06: { main: 7, companion: 10, journey: 17, combat: 6, hub: 3, total: 43 },
  ch07: { main: 7, companion: 8, journey: 16, combat: 6, hub: 3, total: 40 },
  ch08: { main: 7, companion: 7, journey: 15, combat: 6, hub: 3, total: 38 },
} as const;

const ROUTE_IDS = new Set(['kings-road', 'old-forest', 'ruined-pass']);
const ORDINARY_ENGLISH = /[A-Za-z]/;
const PROMPT_LIKE_COPY = /\b(?:generate|continue the story|AI response)\b/i;

function countTypes(scenes: readonly Chronicle1Event[]) {
  return scenes.reduce<Record<Chronicle1Event['type'], number>>(
    (counts, scene) => ({ ...counts, [scene.type]: counts[scene.type] + 1 }),
    { main: 0, companion: 0, journey: 0, combat: 0, hub: 0 },
  );
}

function countJourneySubtypes(scenes: readonly Chronicle1Event[]) {
  const counts = { travel: 0, investigation: 0, sideQuest: 0, dungeon: 0, moral: 0 };
  for (const scene of scenes) {
    if (scene.journeySubtype === 'travel') counts.travel += 1;
    if (scene.journeySubtype === 'investigation') counts.investigation += 1;
    if (scene.journeySubtype === 'side-quest') counts.sideQuest += 1;
    if (scene.journeySubtype === 'dungeon') counts.dungeon += 1;
    if (scene.journeySubtype === 'moral-choice') counts.moral += 1;
  }
  return counts;
}

function countRelationshipArcs(scenes: readonly Chronicle1Event[]) {
  const counts = { mara: 0, rukhar: 0, caldus: 0, lyra: 0, talla: 0, faction: 0 };
  for (const scene of scenes.filter((candidate) => candidate.type === 'companion')) {
    if (scene.relationship?.kind === 'faction') {
      counts.faction += 1;
    } else if (scene.relationship?.kind === 'companion') {
      const companionId = scene.relationship.companionId as keyof Omit<typeof counts, 'faction'>;
      counts[companionId] += 1;
    }
  }
  return counts;
}

describe('Chronicle I scene assembly', () => {
  it('ships the exact approved authored scene ledger', () => {
    expect(CHRONICLE1_SCENES).toHaveLength(332);
    expect(countTypes(CHRONICLE1_SCENES)).toEqual({
      main: 56,
      companion: 64,
      journey: 140,
      combat: 48,
      hub: 24,
    });
    expect(countJourneySubtypes(CHRONICLE1_SCENES)).toEqual({
      travel: 48,
      investigation: 28,
      sideQuest: 24,
      dungeon: 16,
      moral: 24,
    });
    expect(countRelationshipArcs(CHRONICLE1_SCENES)).toEqual({
      mara: 10,
      rukhar: 12,
      caldus: 12,
      lyra: 12,
      talla: 12,
      faction: 6,
    });
  });

  it('preserves chapter order, exact chapter quotas, and contiguous local slots', () => {
    expect(Object.keys(CHAPTER_LEDGER)).toEqual(CHRONICLE1.chapters.map((chapter) => chapter.id));

    for (const chapter of CHRONICLE1.chapters) {
      const scenes = CHRONICLE1_SCENES.filter((scene) => scene.chapterId === chapter.id);
      const expected = CHAPTER_LEDGER[chapter.id];
      expect({ ...countTypes(scenes), total: scenes.length }, chapter.id).toEqual(expected);
      expect(scenes.map((scene) => scene.slot), chapter.id).toEqual(
        Array.from({ length: expected.total }, (_, index) => index + 1),
      );
    }

    expect(CHRONICLE1_SCENES.map((scene) => scene.chapterId)).toEqual(
      CHRONICLE1.chapters.flatMap((chapter) => (
        Array.from({ length: CHAPTER_LEDGER[chapter.id].total }, () => chapter.id)
      )),
    );
  });

  it('contains every ordered main anchor exactly once', () => {
    for (const chapter of CHRONICLE1.chapters) {
      const main = CHRONICLE1_SCENES.filter(
        (scene) => scene.chapterId === chapter.id && scene.type === 'main',
      );
      expect(main.map((scene) => scene.id), chapter.id).toEqual(chapter.anchorIds);
      expect(main.map((scene) => scene.anchorOrder), chapter.id).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it('builds lossless unique scene and illustration indexes', () => {
    expect(CHRONICLE1_SCENE_INDEX.size).toBe(332);
    expect(CHRONICLE1_CONTENT.events).toBe(CHRONICLE1_SCENE_INDEX);
    expect(new Set(CHRONICLE1_SCENES.map((scene) => scene.id)).size).toBe(332);
    expect(new Set(CHRONICLE1_SCENES.map((scene) => scene.illustrationId)).size).toBe(332);
    for (const scene of CHRONICLE1_SCENES) {
      expect(CHRONICLE1_SCENE_INDEX.get(scene.id)).toBe(scene);
      expect(scene.illustrationId).toBe(`scene-${scene.id}`);
    }
  });

  it('passes the source validator before Map construction', () => {
    expect(validateChronicleSources({
      chronicle: CHRONICLE1,
      routes: CHRONICLE1_ROUTES,
      factions: CHRONICLE1_FACTIONS,
      companions: CHRONICLE1_COMPANIONS,
      merchants: CHRONICLE1_MERCHANTS,
      events: CHRONICLE1_SCENES,
    })).toEqual([]);
  });

  it('keeps eligibility, choice gates, callbacks, and follow-ups structurally usable', () => {
    const sceneIds = new Set(CHRONICLE1_SCENES.map((scene) => scene.id));
    for (const scene of CHRONICLE1_SCENES) {
      const { minLevel, maxLevel, routes = [], requiredFlags = [], excludedFlags = [] } = scene.eligibility;
      expect(Number.isSafeInteger(minLevel), `${scene.id}/minLevel`).toBe(true);
      expect(Number.isSafeInteger(maxLevel), `${scene.id}/maxLevel`).toBe(true);
      expect(minLevel!, `${scene.id}/minLevel`).toBeGreaterThanOrEqual(1);
      expect(maxLevel!, `${scene.id}/maxLevel`).toBeLessThanOrEqual(15);
      expect(minLevel!, `${scene.id}/level-order`).toBeLessThanOrEqual(maxLevel!);
      expect(routes.every((route) => ROUTE_IDS.has(route)), `${scene.id}/routes`).toBe(true);
      expect(requiredFlags.every((flag) => !excludedFlags.includes(flag)), `${scene.id}/flags`).toBe(true);

      for (const gate of [
        ...(scene.requirements ?? []),
        ...(scene.exclusions ?? []),
        ...scene.choices.flatMap((choice) => [
          ...(choice.requirements ?? []),
          ...(choice.exclusions ?? []),
        ]),
      ]) {
        expect(gate).toMatchObject({ type: 'flag', present: expect.any(Boolean) });
        expect(gate.flagId.length, `${scene.id}/gate`).toBeGreaterThan(0);
      }

      for (const followUpId of scene.followUps) expect(sceneIds.has(followUpId), followUpId).toBe(true);
      for (const promise of scene.callbackPromises) {
        expect(sceneIds.has(promise.targetEventId), promise.targetEventId).toBe(true);
        expect(promise.deadline.slot, `${scene.id}/callback-deadline`).toBeGreaterThan(0);
      }
    }
  });

  it('contains readable authored English and no prompt-like runtime text', () => {
    for (const scene of CHRONICLE1_SCENES) {
      const copy = [
        scene.title,
        ...scene.narrative,
        ...scene.choices.flatMap((choice) => [choice.label, choice.detail, ...chronicle1ChoiceOutcomes(choice)]),
      ];
      for (const text of copy) {
        expect(text, scene.id).toMatch(ORDINARY_ENGLISH);
        expect(text.trim().length, scene.id).toBeGreaterThan(0);
        expect(text, scene.id).not.toMatch(PROMPT_LIKE_COPY);
      }
      for (const choice of scene.choices) {
        expect(chronicle1ChoiceOutcomes(choice).every((outcome) => outcome.trim().length >= 25), choice.id).toBe(true);
        expect(chronicle1ChoiceEffects(choice).length, choice.id).toBeGreaterThan(0);
      }
    }
  });

  it('exports one safe scene-art media row per scene', () => {
    expect(CHRONICLE1_MEDIA_CONTRACT.scenes).toHaveLength(332);
    expect(new Set(CHRONICLE1_MEDIA_CONTRACT.scenes.map((row) => row.id)).size).toBe(332);
    expect(CHRONICLE1_MEDIA_CONTRACT.scenes).toEqual(CHRONICLE1_SCENES.map((scene) => ({
      id: scene.illustrationId,
      sceneId: scene.id,
      title: scene.title,
      chapterId: scene.chapterId,
      type: scene.type,
    })));

    const serialized = JSON.stringify(CHRONICLE1_MEDIA_CONTRACT);
    expect(serialized).not.toMatch(/xi-api-key|ELEVENLABS_API_KEY|\bsk_[A-Za-z0-9_-]+/i);
    expect(serialized).not.toMatch(/[A-Za-z]:\\|\/Users\/|\/home\//);
    expect(serialized).not.toMatch(/providerUrl|rawPrompt|promptResponse/i);
  });

  it('keeps the assembled authored graph deeply immutable', () => {
    expect(Object.isFrozen(CHRONICLE1_SCENES)).toBe(true);
    expect(Object.isFrozen(CHRONICLE1_MEDIA_CONTRACT)).toBe(true);
    expect(Object.isFrozen(CHRONICLE1_MEDIA_CONTRACT.scenes)).toBe(true);
    for (const scene of CHRONICLE1_SCENES) {
      expect(Object.isFrozen(scene), scene.id).toBe(true);
      expect(Object.isFrozen(scene.choices), scene.id).toBe(true);
      expect(Object.isFrozen(scene.narrative), scene.id).toBe(true);
    }
  });
});
