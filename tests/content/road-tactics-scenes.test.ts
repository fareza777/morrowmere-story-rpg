import { describe, expect, it } from 'vitest';
import {
  CHRONICLE1_ART_IDS,
  CHRONICLE1_CONTENT,
  CHRONICLE1_MEDIA_CONTRACT,
  CHRONICLE1_SCENES,
} from '../../src/game/content/chronicle1';
import { chronicle1ChoiceEffects } from '../../src/game/content/schema';
import { validateContent } from '../../src/game/content/validate';
import type { ChoiceId } from '../../src/game/domain/ids';
import { createCampaign, reduceGame } from '../../src/game/state';

const ROAD_SCENES = [
  ['ch01-road-gloamwood-needle-briar', 7],
  ['ch01-road-gloamwood-riverless-altar', 26],
  ['ch01-road-gloamwood-hound-chant', 58],
  ['ch01-road-gloamwood-hidden-beggar', 88],
  ['ch02-road-drowned-silent-oars', 5],
  ['ch02-road-drowned-ink-warden', 12],
  ['ch02-road-drowned-watchtower-debt', 23],
  ['ch02-road-drowned-corpse-lantern', 33],
  ['ch02-road-drowned-basin-warden', 41],
  ['ch05-road-embervault-ash-priestess', 20],
  ['ch05-road-embervault-cinder-drill', 15],
  ['ch05-road-embervault-scorch-festival', 26],
  ['ch05-road-embervault-ore-bone-road', 40],
  ['ch08-road-crownless-sigil-court', 5],
  ['ch08-road-crownless-iron-chime', 18],
  ['ch08-road-crownless-barnacle-pit', 26],
] as const;

describe('Road Tactics authored scenes', () => {
  it.each(ROAD_SCENES)('assembles %s with unique live artwork and meaningful choices', (id, slot) => {
    const scene = CHRONICLE1_SCENES.find((candidate) => candidate.id === id);
    expect(scene, id).toBeDefined();
    if (!scene) return;
    expect(CHRONICLE1_CONTENT.events.get(scene.id)).toBe(scene);
    expect(scene.type).toBe('journey');
    expect(scene.journeySubtype).toBeDefined();
    expect(scene.slot).toBe(slot);
    expect(scene.oneShot).toBe(true);
    expect(scene.choices.length).toBeGreaterThanOrEqual(3);
    expect(scene.illustrationId).toBe(`scene-${id}`);
    expect(CHRONICLE1_ART_IDS.has(scene.illustrationId)).toBe(true);
    expect(CHRONICLE1_MEDIA_CONTRACT.scenes.filter((art) => art.id === scene.illustrationId))
      .toEqual([expect.objectContaining({ sceneId: id, chapterId: scene.chapterId })]);
    expect(CHRONICLE1_SCENES.filter((other) => other.illustrationId === scene.illustrationId)).toHaveLength(1);

    const anchors = CHRONICLE1_SCENES.filter((other) => other.chapterId === scene.chapterId && other.type === 'main');
    expect(slot).toBeGreaterThan(anchors[0]!.slot);
    expect(slot).toBeLessThan(anchors.at(-1)!.slot);
    expect(scene.eligibility.routes?.length).toBeGreaterThan(0);
    expect(scene.pacing).toBeDefined();
    expect(scene.roadAffinities?.length ?? 0).toBeGreaterThan(0);
    expect(CHRONICLE1_MEDIA_CONTRACT.scenes.find((art) => art.sceneId === id)?.alt?.trim().length)
      .toBeGreaterThan(0);
    expect(scene.choices.some((choice) => choice.check !== undefined)).toBe(true);
    // An ungated, noncombat choice remains usable when carried gold and items are exhausted.
    expect(scene.choices.some((choice) => !choice.check && !choice.requirements?.length
      && !choice.exclusions?.length && choice.effects.every((effect) =>
        effect.type !== 'combat' && effect.type !== 'item' && effect.type !== 'gold'
        && (effect.type !== 'vitals' || ((effect.health ?? 0) >= 0 && (effect.resource ?? 0) >= 0))))).toBe(true);
    for (const choice of scene.choices) {
      expect(chronicle1ChoiceEffects(choice).length, choice.id).toBeGreaterThan(0);
      if (choice.check) {
        expect(choice.check.success.outcome).not.toBe(choice.check.failure.outcome);
        expect(choice.check.success.effects).not.toEqual(choice.check.failure.effects);
      }
    }
  });

  it('keeps unique integer slots, anchor order, and valid effect references after insertion', () => {
    expect(validateContent(CHRONICLE1_CONTENT)).toEqual([]);
    for (const chapterId of ['ch01', 'ch02', 'ch05', 'ch08']) {
      const scenes = CHRONICLE1_SCENES.filter((scene) => scene.chapterId === chapterId);
      expect(scenes.map((scene) => scene.slot)).toEqual(Array.from({ length: scenes.length }, (_, index) => index + 1));
      expect(scenes.filter((scene) => scene.type === 'main').map((scene) => scene.anchorOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it('keeps Talla’s cross-chapter deadline at the same authored story boundary', () => {
    const bargain = CHRONICLE1_SCENES.flatMap((scene) => scene.choices)
      .find((choice) => choice.id === 'ch01-choice-accept-tallas-secret-bargain')!;
    expect(chronicle1ChoiceEffects(bargain).find((effect) => effect.type === 'callback'))
      .toMatchObject({ promise: { deadline: { chapterId: 'ch02', slot: 35 } } });
  });

  it.each([
    ['ch01-road-gloamwood-needle-briar', 'ch01-road-needle-cut',
      { health: 30, resource: 6, threat: 3, xp: 12, loot: [] },
      { health: 27, resource: 5, threat: 5, xp: 0, loot: [] }],
    ['ch02-road-drowned-silent-oars', 'ch02-road-oars-cross',
      { health: 30, resource: 6, threat: 4, xp: 0, loot: ['consumable-field-bandage'] },
      { health: 30, resource: 4, threat: 5, xp: 0, loot: [] }],
  ] as const)('resolves only the selected checked branch of %s at runtime', (id, choiceId, success, failure) => {
    const scene = CHRONICLE1_SCENES.find((candidate) => candidate.id === id)!;
    const choice = scene.choices.find((candidate) => candidate.id === choiceId)!;
    const found = new Set<string>();
    // Exercise real deterministic rolls without replacing the authored check or mocking RNG.
    for (let seed = 1; seed <= 64 && found.size < 2; seed += 1) {
      const created = createCampaign({ heroClass: 'warrior', seed, updatedAt: '2026-09-17T00:00:00Z' }, CHRONICLE1_CONTENT);
      const started = reduceGame(created, { type: 'start-expedition', updatedAt: '2026-09-17T00:01:00Z' }, CHRONICLE1_CONTENT).state;
      const initial = {
        ...started,
        campaign: { ...started.campaign, chapterId: scene.chapterId },
        flow: { ...started.flow, screen: 'story' as const },
        expedition: { ...started.expedition!, currentSceneId: scene.id,
          position: { chapterId: scene.chapterId, slot: scene.slot },
          sceneVisitCounts: { [scene.id]: 1 }, heroVitals: { health: 30, resource: 6 },
          director: { ...started.expedition!.director, threat: 5 },
        },
      };
      const command = { type: 'resolve-choice' as const, eventId: scene.id, choiceId: choiceId as ChoiceId, updatedAt: '2026-09-17T00:02:00Z' };
      const result = reduceGame(initial, command, CHRONICLE1_CONTENT);
      expect(result.diagnostic).toBeUndefined();
      const resolution = result.state.expedition!.sceneResolution!;
      const branch = resolution.resultKind.endsWith('success') ? 'success' : 'failure';
      found.add(branch);
      const expected = branch === 'success' ? success : failure;
      expect(resolution.outcome).toBe(choice.check![branch].outcome);
      expect(resolution.outcome).not.toBe(choice.check![branch === 'success' ? 'failure' : 'success'].outcome);
      expect(result.state.expedition!.heroVitals).toEqual({ health: expected.health, resource: expected.resource });
      expect(result.state.expedition!.director.threat).toBe(expected.threat);
      expect(result.state.campaign.hero.xp).toBe(expected.xp);
      expect(result.state.expedition!.unbankedLoot).toEqual(expected.loot);
      expect(result.state.expedition!.currentCombat).toBeNull();
      const duplicate = reduceGame(result.state, command, CHRONICLE1_CONTENT);
      expect(duplicate.diagnostic?.code).toBe('choice_resolved');
      expect(duplicate.state).toBe(result.state);
    }
    expect([...found].sort()).toEqual(['failure', 'success']);
  });
});
