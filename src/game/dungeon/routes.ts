import type { GameEffect } from '../domain/effects';
import type { EncounterId } from '../domain/ids';
import type { DungeonDefinition, DungeonExit, DungeonNode, RouteJunctionDefinition, RouteOptionDefinition } from './types';

function flagsAllow(
  gate: { readonly requiredFlags?: readonly string[]; readonly excludedFlags?: readonly string[] },
  flags: ReadonlySet<string>,
): boolean {
  return (gate.requiredFlags ?? []).every((flag) => flags.has(flag))
    && (gate.excludedFlags ?? []).every((flag) => !flags.has(flag));
}

/** A local, stable hash keeps content selection separate from mutable campaign RNG. */
function variantIndex(seed: number, nodeId: string, count: number): number {
  let hash = (seed >>> 0) ^ 2166136261;
  for (let index = 0; index < nodeId.length; index += 1) {
    hash = Math.imul(hash ^ nodeId.charCodeAt(index), 16777619);
  }
  return (hash >>> 0) % count;
}

export function availableRouteOptions(
  junction: RouteJunctionDefinition,
  flags: ReadonlySet<string>,
): readonly RouteOptionDefinition[] {
  return junction.options.filter((option) => flagsAllow(option, flags));
}

export function resolveDungeonEncounter(node: DungeonNode, runSeed: number): EncounterId | null {
  const variants = node.encounterVariants;
  return variants?.length ? variants[variantIndex(runSeed, node.id, variants.length)]! : node.encounterId ?? null;
}

export function resolveDungeonReward(
  node: DungeonNode,
  runSeed: number,
): { readonly id: string; readonly effects: readonly GameEffect[] } | null {
  const variants = node.rewardVariants;
  return variants?.length ? variants[variantIndex(runSeed, node.id, variants.length)]! : null;
}

export function availableDungeonExits(
  definition: DungeonDefinition,
  nodeId: string,
  flags: ReadonlySet<string>,
  visitedNodeIds: readonly string[],
): readonly DungeonExit[] {
  const node = definition.nodes.find((entry) => entry.id === nodeId);
  if (!node) return [];
  const knownNodes = new Set(definition.nodes.map((entry) => entry.id));
  const visited = new Set(visitedNodeIds);
  return node.exits.filter((exit) => knownNodes.has(exit.targetNodeId) && !visited.has(exit.targetNodeId) && flagsAllow(exit, flags));
}
