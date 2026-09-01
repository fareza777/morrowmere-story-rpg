import type { ChronicleEvent } from '../content/schema';
import type { EventId, StoryPosition } from '../domain/ids';

export type RouteProfileId = 'kings-road' | 'old-forest' | 'ruined-pass';
export type DirectorReason = 'callback' | 'anchor' | 'threat' | 'paced';
export type ScenePacing = 'danger' | 'merchant' | 'recovery' | 'quiet';

export interface RouteOption {
  readonly id: RouteProfileId;
  readonly label: string;
  readonly description: string;
  readonly risk: number;
  readonly recoveryBias: number;
  readonly merchantBias: number;
}

export interface PendingCallback {
  readonly targetEventId: EventId;
  readonly deadline: StoryPosition;
  readonly status: 'pending' | 'fulfilled';
  readonly required: boolean;
}

/** Persist this whole object with the campaign; it is the director's replay guard. */
export interface DirectorState {
  readonly rngState: number;
  readonly usedSceneIds: readonly EventId[];
  readonly recentSceneKinds: readonly ScenePacing[];
  readonly recentFamilies: readonly string[];
  readonly seenEventIds: readonly EventId[];
  /** Family -> future run starts that still need to block this family. */
  readonly familyCooldowns: Readonly<Record<string, number>>;
  /** Derived at each run boundary from `familyCooldowns`; never carries a prior run's block. */
  readonly currentRunBlockedFamilies: readonly string[];
  readonly pendingCallbacks: readonly PendingCallback[];
  readonly tension: number;
  readonly threat: number;
}

export interface JourneyDirectorContext {
  readonly position: StoryPosition;
  readonly level: number;
  readonly flags: readonly string[];
  readonly inventoryTags: readonly string[];
  readonly routeProfile: RouteProfileId;
}

export interface DirectorSelectedStep {
  readonly kind: 'selected';
  readonly sceneId: EventId;
  readonly event: ChronicleEvent;
  /** Timeline position where the scene was delivered, including a bridged gap or callback deadline. */
  readonly selectedAt: StoryPosition;
  readonly reason: DirectorReason;
  readonly state: DirectorState;
}

export interface DirectorTerminalStep {
  readonly kind: 'terminal';
  readonly terminal: 'completed' | 'precondition';
  readonly diagnostic: string;
  readonly state: DirectorState;
}

export type DirectorStep = DirectorSelectedStep | DirectorTerminalStep;
