import { describe, expect, it } from 'vitest';
import { availableDungeonExits, availableRouteOptions, resolveDungeonEncounter, resolveDungeonReward } from '../src/game/dungeon/routes';
import type { DungeonDefinition, DungeonNode, RouteJunctionDefinition } from '../src/game/dungeon/types';
import type { EncounterId } from '../src/game/domain/ids';

const encounter = (id: string) => id as EncounterId;
const end: DungeonNode = { id: 'end', kind: 'exit', exitKind: 'complete', exits: [] };
const definition: DungeonDefinition = {
  id: 'test-dungeon', chapterId: 'ch01', startNodeId: 'start', exitNodeIds: ['end'],
  nodes: [
    { id: 'start', kind: 'scene', exits: [
      { id: 'left', targetNodeId: 'left', label: 'Left', detail: 'Take the left passage.' },
      { id: 'right', targetNodeId: 'right', label: 'Right', detail: 'Take the right passage.', requiredFlags: ['key'] },
    ] },
    { id: 'left', kind: 'rest', exits: [{ id: 'finish-left', targetNodeId: 'end', label: 'Finish', detail: 'Leave.' }] },
    { id: 'right', kind: 'cache', exits: [{ id: 'finish-right', targetNodeId: 'end', label: 'Finish', detail: 'Leave.' }] },
    end,
  ],
};

describe('dungeon route choices', () => {
  it('returns both eligible exits', () => {
    expect(availableDungeonExits(definition, 'start', new Set(['key']), []).map((exit) => exit.id)).toEqual(['left', 'right']);
  });

  it('excludes an exit when its required flag is absent', () => {
    expect(availableDungeonExits(definition, 'start', new Set(), []).map((exit) => exit.id)).toEqual(['left']);
  });

  it('omits previously visited destinations', () => {
    expect(availableDungeonExits(definition, 'start', new Set(['key']), ['right']).map((exit) => exit.id)).toEqual(['left']);
  });

  it('does not offer an exit to an unknown destination', () => {
    const broken = { ...definition, nodes: [{ ...definition.nodes[0]!, exits: [{ id: 'lost', targetNodeId: 'missing', label: 'Lost', detail: 'Nowhere.' }] }, ...definition.nodes.slice(1)] };
    expect(availableDungeonExits(broken, 'start', new Set(), [])).toEqual([]);
  });

  it('resolves encounter and reward variants from seed and node without changing input', () => {
    const node: DungeonNode = {
      id: 'cache', kind: 'cache', encounterVariants: [encounter('wolf'), encounter('bandit')],
      rewardVariants: [{ id: 'coins', effects: [{ type: 'gold', scope: 'unbanked', amount: 5 }] }, { id: 'rest', effects: [{ type: 'vitals', health: 2 }] }],
      exits: [],
    };
    const seed = 914;
    const snapshot = JSON.stringify(node);
    expect(resolveDungeonEncounter(node, seed)).toBe(resolveDungeonEncounter(node, seed));
    expect(resolveDungeonReward(node, seed)).toEqual(resolveDungeonReward(node, seed));
    expect(JSON.stringify(node)).toBe(snapshot);
    expect(seed).toBe(914);
    expect(new Set(Array.from({ length: 16 }, (_, value) => resolveDungeonEncounter(node, value))).size).toBe(2);
    expect(new Set(Array.from({ length: 16 }, (_, value) => resolveDungeonReward(node, value)?.id)).size).toBe(2);
  });

  it('filters junction choices by required and excluded flags', () => {
    const junction: RouteJunctionDefinition = {
      id: 'fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 2 }, afterEventId: 'fixture-event' as never,
      options: [
        { id: 'road', kind: 'story', label: 'Road', detail: 'Go by road.', consequence: 'Arrive safely.', destination: { kind: 'scene', sceneId: 'fixture-event' as never } },
        { id: 'gate', kind: 'shortcut', label: 'Gate', detail: 'Use the key.', consequence: 'Save time.', destination: { kind: 'scene', sceneId: 'second-event' as never }, requiredFlags: ['key'], excludedFlags: ['sealed'] },
      ],
    };
    expect(availableRouteOptions(junction, new Set()).map((option) => option.id)).toEqual(['road']);
    expect(availableRouteOptions(junction, new Set(['key'])).map((option) => option.id)).toEqual(['road', 'gate']);
    expect(availableRouteOptions(junction, new Set(['key', 'sealed'])).map((option) => option.id)).toEqual(['road']);
  });
});
