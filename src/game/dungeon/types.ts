import type { GameEffect } from '../domain/effects';
import type { ChapterId, EncounterId, EventId, StoryPosition } from '../domain/ids';

export type DungeonNodeKind = 'scene' | 'combat' | 'hazard' | 'rest' | 'cache' | 'elite' | 'boss' | 'exit';
export type DungeonExitKind = 'complete' | 'extract' | 'retreat';

export interface DungeonExit {
  readonly id: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly detail: string;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
}

export interface DungeonNode {
  readonly id: string;
  readonly kind: DungeonNodeKind;
  readonly exitKind?: DungeonExitKind;
  readonly sceneId?: EventId;
  readonly encounterId?: EncounterId;
  /** When present, the run seed and node ID select one encounter without advancing campaign RNG. */
  readonly encounterVariants?: readonly EncounterId[];
  /** Cache/rest rewards use the same stable seed + node ID selection and normal effect application. */
  readonly rewardVariants?: readonly { readonly id: string; readonly effects: readonly GameEffect[] }[];
  readonly exits: readonly DungeonExit[];
}

export interface DungeonDefinition {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly startNodeId: string;
  readonly exitNodeIds: readonly string[];
  readonly nodes: readonly DungeonNode[];
}

export type RouteDestination =
  | { readonly kind: 'scene'; readonly sceneId: EventId }
  | { readonly kind: 'dungeon'; readonly dungeonId: string };

export interface RouteOptionDefinition {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly consequence: string;
  readonly kind: 'story' | 'combat' | 'dungeon' | 'rest' | 'supply' | 'shortcut';
  readonly destination: RouteDestination;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
  readonly effects?: readonly GameEffect[];
}

export interface RouteJunctionDefinition {
  readonly id: string;
  readonly chapterId: ChapterId;
  /** The saved campaign position used to recover an obsolete legacy travel screen safely. */
  readonly position: StoryPosition;
  /** The junction becomes active only after this scene and its authored aftermath queue finish. */
  readonly afterEventId: EventId;
  readonly options: readonly RouteOptionDefinition[];
}

export interface DungeonRunState {
  readonly dungeonId: string;
  readonly seed: number;
  readonly currentNodeId: string;
  readonly depth: number;
  readonly visitedNodeIds: readonly string[];
  readonly resolvedNodeIds: readonly string[];
}
