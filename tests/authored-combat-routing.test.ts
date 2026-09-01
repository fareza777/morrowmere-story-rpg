import { describe, expect, it } from 'vitest';
import { CHRONICLE1_CONTENT } from '../src/game/content/chronicle1';
import { createCampaign, reduceGame, type GameStateV2 } from '../src/game/state';
import type { ChoiceId, EventId } from '../src/game/domain/ids';

const updatedAt = '2026-09-01T00:00:00.000Z';

function stateAtCombatScene(sceneId: EventId): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', name: 'Aster Vale', seed: 91, updatedAt }, CHRONICLE1_CONTENT);
  const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT);
  return {
    ...started.state,
    expedition: { ...started.state.expedition!, currentSceneId: sceneId },
  };
}

describe('authored combat scene routing', () => {
  it('starts the authored combat encounter after resolving its setup choice', () => {
    const scene = [...CHRONICLE1_CONTENT.events.values()].find((candidate) => candidate.type === 'combat' && candidate.choices.length > 0);
    expect(scene).toBeDefined();
    const choice = scene!.choices[0]!;
    const before = stateAtCombatScene(scene!.id);
    const result = reduceGame(before, { type: 'resolve-choice', eventId: scene!.id, choiceId: choice.id, updatedAt }, CHRONICLE1_CONTENT);

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.flow.screen).toBe('combat');
    expect(result.state.expedition?.currentCombat?.encounterId).toBe(scene!.encounterId);
    expect(result.state.campaign.flags).toContain('combat-ch01-ditch-formation');
  });

  it('routes every authored combat scene with an encounterId into combat', () => {
    const scenes = [...CHRONICLE1_CONTENT.events.values()].filter((scene) => scene.type === 'combat' && scene.encounterId);
    expect(scenes.length).toBeGreaterThan(0);

    for (const scene of scenes) {
      const choice = scene.choices[0];
      expect(choice, `${scene.id} should have a setup choice`).toBeDefined();
      const result = reduceGame(stateAtCombatScene(scene.id), {
        type: 'resolve-choice', eventId: scene.id, choiceId: choice!.id as ChoiceId, updatedAt,
      }, CHRONICLE1_CONTENT);
      expect(result.diagnostic, scene.id).toBeUndefined();
      expect(result.state.flow.screen, scene.id).toBe('combat');
      expect(result.state.expedition?.currentCombat?.encounterId, scene.id).toBe(scene.encounterId);
    }
  });
});
