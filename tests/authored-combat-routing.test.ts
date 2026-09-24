import { describe, expect, it } from 'vitest';
import { CHRONICLE1_CONTENT } from '../src/game/content/chronicle1';
import { createCampaign, reduceGame, type GameStateV2 } from '../src/game/state';
import type { ChoiceId, EventId } from '../src/game/domain/ids';
import { encodeSaveState } from '../src/game/persistence/codec';

const updatedAt = '2026-09-01T00:00:00.000Z';

function stateAtCombatScene(sceneId: EventId): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', name: 'Aster Vale', seed: 91, updatedAt }, CHRONICLE1_CONTENT);
  const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT);
  const travelled = reduceGame(started.state, { type: 'travel-action', action: 'press-on', updatedAt }, CHRONICLE1_CONTENT);
  return {
    ...travelled.state,
    expedition: { ...travelled.state.expedition!, currentSceneId: sceneId },
  };
}

describe('authored combat scene routing', () => {
  it('turns the orchard setup flags into a persistent battle opening', () => {
    const sceneId = 'ch01-living-split-fletched-arrow-battle' as EventId;
    const base = stateAtCombatScene(sceneId);
    const prepared = {
      ...base,
      campaign: {
        ...base.campaign,
        flags: [
          'orchard-high-bank-held',
          'orchard-jory-shielded',
          'orchard-horses-controlled',
          'combat-ch01-orchard-cover',
          'orchard-reaver-marked',
          'opening-volley-delayed',
          'medicine-protected-at-orchard',
        ],
      },
      expedition: { ...base.expedition!, dialogueBeatIndex: 2, sceneVisitCounts: { [sceneId]: 1 } },
    } as GameStateV2;
    const resolved = reduceGame(prepared, {
      type: 'resolve-choice',
      eventId: sceneId,
      choiceId: 'ch01-choice-charge-from-the-high-bank' as ChoiceId,
      updatedAt,
    }, CHRONICLE1_CONTENT);
    const started = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT).state;
    const combat = started.expedition?.currentCombat?.combat;

    expect(combat?.player.guarding).toBe(true);
    expect(combat?.player.attackBonus).toBeGreaterThan(0);
    expect(combat?.player.statuses.map((status) => status.id)).toEqual(expect.arrayContaining([
      'jory-and-dispatch-secured',
      'horse-teams-controlled',
      'medicine-protected',
    ]));
    expect(combat?.enemies.find((enemy) => enemy.id === 'black-banner-01')).toMatchObject({
      evasion: 0,
      parryChance: 0,
      statuses: [expect.objectContaining({ id: 'marked-reaver' })],
    });
    expect(encodeSaveState(started, CHRONICLE1_CONTENT)).not.toBeNull();
  });

  it('starts the authored combat encounter after resolving its setup choice', () => {
    const scene = [...CHRONICLE1_CONTENT.events.values()].find((candidate) => candidate.type === 'combat' && candidate.encounterId && candidate.choices.length > 0);
    expect(scene).toBeDefined();
    const choice = scene!.choices[0]!;
    const before = stateAtCombatScene(scene!.id);
    const result = reduceGame(before, { type: 'resolve-choice', eventId: scene!.id, choiceId: choice.id, updatedAt }, CHRONICLE1_CONTENT);

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.flow.screen).toBe('story');
    expect(result.state.expedition?.sceneResolution?.outcome).toBeTruthy();
    const advanced = reduceGame(result.state, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
    expect(advanced.state.flow.screen).toBe('combat');
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
      expect(result.state.flow.screen, scene.id).toBe('story');
      const advanced = reduceGame(result.state, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
      expect(advanced.state.flow.screen, scene.id).toBe('combat');
      expect(result.state.expedition?.currentCombat?.encounterId, scene.id).toBe(scene.encounterId);
    }
  });

  it('uses an authored retreat after fleeing a dungeon fight', () => {
    const scene = [...CHRONICLE1_CONTENT.events.values()].find((event) => event.type === 'combat' && event.encounterId && event.choices.length > 0)!;
    const retreatScene = { ...scene, id: 'flee-exit-scene' as EventId, type: 'journey' as const, family: 'flee-exit', choices: [], dialogue: [] };
    const content = { ...CHRONICLE1_CONTENT, events: new Map([...CHRONICLE1_CONTENT.events, [retreatScene.id, retreatScene] as const]), dungeons: new Map([['flee-run', { id: 'flee-run', chapterId: 'ch01' as const, startNodeId: 'fight', exitNodeIds: ['retreat'], nodes: [
      { id: 'fight', kind: 'combat' as const, encounterId: scene.encounterId, exits: [{ id: 'withdraw', targetNodeId: 'retreat', label: 'Withdraw', detail: 'Secure half the unbanked gold.' }] },
      { id: 'retreat', kind: 'exit' as const, exitKind: 'retreat' as const, sceneId: retreatScene.id, exits: [] },
    ] }]]) };
    const resolved = reduceGame(stateAtCombatScene(scene.id), { type: 'resolve-choice', eventId: scene.id, choiceId: scene.choices[0]!.id, updatedAt }, content).state;
    const battle = reduceGame(resolved, { type: 'select-next-scene', updatedAt }, content).state;
    const before: GameStateV2 = { ...battle, expedition: { ...battle.expedition!, dungeonRun: { dungeonId: 'flee-run', seed: 4, currentNodeId: 'fight', depth: 1, visitedNodeIds: ['fight'], resolvedNodeIds: [] }, unbankedGold: 9, currentCombat: { ...battle.expedition!.currentCombat!, combat: { ...battle.expedition!.currentCombat!.combat!, rngState: 9 } } } };
    const fled = reduceGame(before, { type: 'combat-turn', commandId: 'flee-1', action: { type: 'flee' }, updatedAt }, content);
    expect(fled.state.expedition?.dungeonRun?.currentNodeId).toBe('retreat');
    expect(fled.state.expedition?.currentSceneId).toBe(retreatScene.id);
    const exited = reduceGame(fled.state, { type: 'select-next-scene', updatedAt }, content);
    expect(exited.state.expedition?.dungeonRun).toBeNull();
    expect(exited.state.campaign.bankedGold - before.campaign.bankedGold).toBe(4);
    expect(exited.state.flow.screen).toBe('travel');
  });
});
