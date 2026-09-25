import { describe, expect, it } from 'vitest';

import {
  CHRONICLE1_CONTENT,
  CHRONICLE1_DUNGEONS,
  CHRONICLE1_ENCOUNTERS,
  CHRONICLE1_ROUTE_JUNCTIONS,
} from '../../src/game/content/chronicle1';
import { availableDungeonExits, availableRouteOptions, resolveDungeonEncounter, resolveDungeonReward } from '../../src/game/dungeon/routes';
import type { DungeonDefinition, DungeonNode } from '../../src/game/dungeon/types';
import { createCampaign } from '../../src/game/state/create';
import { reduceGame } from '../../src/game/state/reducer';
import type { GameStateV2 } from '../../src/game/state/types';
import { validateContent } from '../../src/game/content/validate';

const DUNGEON_ID = 'ch05-embervault-underworks';
const LANDMARK_ID = 'ch05-main-forge-behind-the-wall';

interface DungeonPath {
  readonly nodes: readonly DungeonNode[];
  readonly exit: DungeonNode;
  readonly encounterIds: readonly string[];
}

function pathsForSeed(dungeon: DungeonDefinition, seed: number): DungeonPath[] {
  const paths: DungeonPath[] = [];
  const visit = (nodeId: string, visited: readonly string[], path: readonly DungeonNode[], encounters: readonly string[]): void => {
    const node = dungeon.nodes.find((entry) => entry.id === nodeId);
    expect(node, `${dungeon.id}/${nodeId} exists`).toBeDefined();
    expect(visited, `${dungeon.id}/${nodeId} does not loop`).not.toContain(nodeId);
    const nextPath = [...path, node!];
    const encounterId = resolveDungeonEncounter(node!, seed);
    const nextEncounters = encounterId ? [...encounters, encounterId] : encounters;

    if (node!.kind === 'exit') {
      paths.push({ nodes: nextPath, exit: node!, encounterIds: nextEncounters });
      return;
    }

    const exits = availableDungeonExits(dungeon, node!.id, new Set(), [...visited, node!.id]);
    expect(exits, `${dungeon.id}/${node!.id} has a safe continuation`).not.toHaveLength(0);
    for (const edge of exits) visit(edge.targetNodeId, [...visited, node!.id], nextPath, nextEncounters);
  };

  visit(dungeon.startNodeId, [], [], []);
  return paths;
}

function combatNodes(path: DungeonPath): readonly DungeonNode[] {
  return path.nodes.filter((node) => ['combat', 'elite', 'boss'].includes(node.kind));
}

describe('Chapter 5 Embervault expedition', () => {
  const dungeon = CHRONICLE1_DUNGEONS.find((entry) => entry.id === DUNGEON_ID);

  it('offers the delve once after the missing-shift anchor, alongside a direct story route', () => {
    const junction = CHRONICLE1_ROUTE_JUNCTIONS.find((entry) => entry.id === 'ch05-embervault-descent');
    expect(junction).toBeDefined();
    expect(junction?.afterEventId).toBe('ch05-main-the-missing-shift');

    const options = availableRouteOptions(junction!, new Set());
    expect(options.filter((option) => option.destination.kind === 'dungeon')).toHaveLength(1);
    expect(options.some((option) => option.kind === 'story' && option.destination.kind === 'scene')).toBe(true);
    expect(validateContent(CHRONICLE1_CONTENT)).toEqual([]);
  });

  it('gives every full entrance-to-forge run 10–13 rooms, 6–8 fights, and one boss', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    for (const seed of [3, 17, 41]) {
      const runs = pathsForSeed(dungeon, seed);
      const complete = runs.filter((path) => path.exit.exitKind === 'complete');
      expect(complete).toHaveLength(32);

      for (const path of complete) {
        const fights = combatNodes(path);
        expect(path.nodes.length, path.nodes.map((node) => node.id).join(' → ')).toBeGreaterThanOrEqual(10);
        expect(path.nodes.length, path.nodes.map((node) => node.id).join(' → ')).toBeLessThanOrEqual(13);
        expect(fights.length).toBeGreaterThanOrEqual(6);
        expect(fights.length).toBeLessThanOrEqual(8);
        const eliteCount = fights.filter((node) => node.kind === 'elite').length;
        expect(eliteCount).toBeGreaterThanOrEqual(1);
        expect(eliteCount).toBeLessThanOrEqual(2);
        expect(eliteCount).toBe(2);
        expect(fights.filter((node) => node.kind === 'boss')).toHaveLength(1);
        expect(new Set(path.encounterIds).size).toBe(path.encounterIds.length);
        expect(path.exit.sceneId).toBe(LANDMARK_ID);
        expect(path.nodes.some((node, index) => ['rest', 'cache'].includes(node.kind) && index >= 2 && index <= 4)).toBe(true);
      }
    }
  });

  it('makes both route decisions materially different and keeps run-seeded variants stable', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    const branchNodes = dungeon.nodes.filter((node) => node.exits.filter((edge) => !edge.targetNodeId.includes('retreat')).length >= 2);
    expect(branchNodes.length).toBeGreaterThanOrEqual(2);

    const runs = pathsForSeed(dungeon, 29).filter((path) => path.exit.exitKind === 'complete');
    const signatures = new Set(runs.map((path) => path.encounterIds.join('|')));
    expect(signatures.size).toBeGreaterThanOrEqual(4);

    for (const node of dungeon.nodes) {
      if (node.encounterVariants?.length) {
        expect(resolveDungeonEncounter(node, 29)).toBe(resolveDungeonEncounter(node, 29));
      }
      if (node.rewardVariants?.length) {
        expect(resolveDungeonReward(node, 29)).toEqual(resolveDungeonReward(node, 29));
      }
    }

    const branchEncounterIds = dungeon.nodes
      .filter((node) => node.id.includes('ledger-path') || node.id.includes('worker-path'))
      .flatMap((node) => node.encounterVariants ?? (node.encounterId ? [node.encounterId] : []));
    const branchRewards = branchEncounterIds.map((id) => CHRONICLE1_ENCOUNTERS.find((entry) => entry.id === id)?.reward);
    expect(branchRewards.every(Boolean)).toBe(true);
    expect(new Set(branchRewards.map((reward) => `${reward?.xp}/${reward?.gold}/${reward?.itemChoices.join(',')}`)).size).toBeGreaterThan(1);
  });

  it('offers an optional medic-cache detour between the sentinel and the regulator', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    const sentinelId = 'ch05-vault-gargoyle-sentinel';
    const cacheId = 'ch05-underworks-pressure-medic-cache';
    const exits = availableDungeonExits(dungeon, sentinelId, new Set(), [sentinelId]);
    expect(exits.map((exit) => exit.targetNodeId)).toContain(cacheId);
    expect(exits.map((exit) => exit.targetNodeId)).toContain('ch05-cinder-heart-regulator');
    expect(exits.map((exit) => exit.targetNodeId)).toContain('ch05-underworks-retreat-after-sentinel');

    const cache = dungeon.nodes.find((node) => node.id === cacheId);
    expect(cache?.kind).toBe('cache');
    expect(cache?.exits.map((exit) => exit.targetNodeId)).toEqual(['ch05-cinder-heart-regulator']);
    expect(resolveDungeonReward(cache!, 41)?.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'vitals', health: 28, resource: 2 }),
      expect.objectContaining({ type: 'gold', scope: 'unbanked', amount: 8 }),
      expect.objectContaining({ type: 'item', operation: 'grant', itemId: 'consumable-burn-paste', quantity: 2, destination: 'pack' }),
    ]));
  });

  it('has reachable early retreats that settle without claiming the forge landmark', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    const paths = pathsForSeed(dungeon, 17);
    const retreats = paths.filter((path) => path.exit.exitKind === 'retreat');
    expect(retreats.length).toBeGreaterThanOrEqual(2);
    for (const path of retreats) {
      expect(combatNodes(path).length).toBeLessThan(6);
      expect(path.exit.sceneId).not.toBe(LANDMARK_ID);
    }
  });

  it('starts the selected delve from the resolved missing-shift anchor and settles a retreat safely', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    const updatedAt = '2026-09-24T00:00:00.000Z';
    const created = createCampaign({ heroClass: 'warden', seed: 29, chapterId: 'ch05', updatedAt }, CHRONICLE1_CONTENT);
    const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT).state;
    const eventId = 'ch05-main-the-missing-shift';
    const atJunction: GameStateV2 = {
      ...started,
      expedition: {
        ...started.expedition!,
        position: { chapterId: 'ch05', slot: 8 },
        currentSceneId: eventId,
        authoredSceneQueue: [],
        sceneResolution: {
          eventId, choiceId: null, resultKind: 'direct', chance: null, roll: null,
          outcome: 'The workers are clear of the cage line.', effectSummary: [], nextSceneId: null, continueLabel: null,
        },
        director: { ...started.expedition!.director, seenEventIds: [...started.expedition!.director.seenEventIds, eventId] },
      },
      flow: { ...started.flow, screen: 'story' },
    };
    const activated = reduceGame(atJunction, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
    expect(activated.diagnostic).toBeUndefined();
    expect(activated.state.expedition?.pendingRouteJunctionId).toBe('ch05-embervault-descent');

    const entered = reduceGame(activated.state, {
      type: 'select-route', junctionId: 'ch05-embervault-descent', optionId: 'ch05-descend-into-the-underworks', updatedAt,
    }, CHRONICLE1_CONTENT);
    const start = dungeon.nodes.find((node) => node.id === dungeon.startNodeId)!;
    expect(entered.diagnostic).toBeUndefined();
    expect(entered.state.expedition?.dungeonRun?.dungeonId).toBe(dungeon.id);
    expect(entered.state.expedition?.currentCombat?.encounterId).toBe(resolveDungeonEncounter(start, entered.state.expedition!.dungeonRun!.seed));

    const retreatNode = dungeon.nodes.find((node) => node.id === 'ch05-underworks-retreat-after-lift')!;
    const onRetreat: GameStateV2 = {
      ...entered.state,
      campaign: { ...entered.state.campaign, bankedGold: 5 },
      expedition: {
        ...entered.state.expedition!,
        currentSceneId: retreatNode.sceneId!,
        currentCombat: null,
        unbankedGold: 9,
        dungeonRun: {
          dungeonId: dungeon.id, seed: 29, currentNodeId: retreatNode.id, depth: 2,
          visitedNodeIds: [dungeon.startNodeId, retreatNode.id], resolvedNodeIds: [],
        },
        sceneResolution: {
          eventId: retreatNode.sceneId!, choiceId: 'ch05-choice-secure-the-underworks-docket', resultKind: 'direct', chance: null, roll: null,
          outcome: 'The docket is secured before the party withdraws.', effectSummary: [], nextSceneId: null, continueLabel: null,
        },
      },
      flow: { ...entered.state.flow, screen: 'story' },
    };
    const retreated = reduceGame(onRetreat, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
    expect(retreated.diagnostic).toBeUndefined();
    expect(retreated.state.flow.screen).toBe('travel');
    expect(retreated.state.expedition?.dungeonRun).toBeNull();
    expect(retreated.state.campaign.bankedGold).toBe(9);
    expect(retreated.state.expedition?.unbankedGold).toBe(0);
  });

  it('resumes after the forge landmark when the full delve skips earlier road beats', () => {
    expect(dungeon).toBeDefined();
    if (!dungeon) return;

    const updatedAt = '2026-09-24T00:00:00.000Z';
    const created = createCampaign({ heroClass: 'warden', seed: 31, chapterId: 'ch05', updatedAt }, CHRONICLE1_CONTENT);
    const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT).state;
    const exit = dungeon.nodes.find((node) => node.id === 'ch05-underworks-forge-exit')!;
    const forge = CHRONICLE1_CONTENT.events.get(LANDMARK_ID as never)!;
    const completedScene: GameStateV2 = {
      ...started,
      expedition: {
        ...started.expedition!,
        position: { chapterId: 'ch05', slot: 8 },
        currentSceneId: forge.id,
        currentCombat: null,
        authoredSceneQueue: [],
        director: {
          ...started.expedition!.director,
          usedSceneIds: [...started.expedition!.director.usedSceneIds, forge.id],
          seenEventIds: [...started.expedition!.director.seenEventIds, forge.id],
        },
        sceneResolution: {
          eventId: forge.id, choiceId: 'ch05-choice-seize-the-stamping-dies', resultKind: 'direct', chance: null, roll: null,
          outcome: 'The pressure engine falls and the forge stands open.', effectSummary: [], nextSceneId: null, continueLabel: null,
        },
        dungeonRun: {
          dungeonId: dungeon.id, seed: 31, currentNodeId: exit.id, depth: 10,
          visitedNodeIds: dungeon.nodes.filter((node) => node.kind !== 'exit' || node.id === exit.id).map((node) => node.id), resolvedNodeIds: [],
        },
      },
      flow: { ...started.flow, screen: 'story' },
    };

    const resumed = reduceGame(completedScene, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
    expect(resumed.diagnostic).toBeUndefined();
    expect(resumed.state.flow.screen).toBe('travel');
    expect(resumed.state.expedition?.dungeonRun).toBeNull();
    expect(resumed.state.expedition?.position.slot).toBe(forge.slot + 1);
  });
});
