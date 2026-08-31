import { describe, expect, it } from 'vitest';
import { beginDirectorRun, selectNextScene } from '../../src/game/director';
import { comparePosition } from '../../src/game/director/eligibility';
import type { DirectorState, PendingCallback, RouteProfileId } from '../../src/game/director/types';
import {
  CHRONICLE1,
  CHRONICLE1_CONTENT,
  CHRONICLE1_SCENES,
  MAIN_ANCHOR_IDS,
} from '../../src/game/content/chronicle1';
import type { Chronicle1Event, ContentIndex } from '../../src/game/content/schema';
import type { EventId } from '../../src/game/domain/ids';
import { scenePacing } from '../../src/game/director/pacing';

const ROUTES: readonly RouteProfileId[] = ['kings-road', 'old-forest', 'ruined-pass'];
const SCENE_BY_ID = new Map(CHRONICLE1_SCENES.map((scene) => [scene.id, scene] as const));

function unlockedContent(chapterId: string, slot: number): ContentIndex {
  return {
    ...CHRONICLE1_CONTENT,
    events: new Map(
      [...CHRONICLE1_CONTENT.events].filter(([eventId]) => {
        const scene = SCENE_BY_ID.get(eventId);
        return scene?.chapterId === chapterId && scene.slot <= slot;
      }),
    ),
  };
}

const initialState = (seed: number): DirectorState => ({
  rngState: seed,
  usedSceneIds: [],
  recentSceneKinds: [],
  recentFamilies: [],
  seenEventIds: [],
  familyCooldowns: {},
  currentRunBlockedFamilies: [],
  pendingCallbacks: [],
  tension: 2,
  threat: 0,
});

interface RouteAudit {
  readonly selectedSceneIds: readonly string[];
  readonly skippedAnchorIds: readonly string[];
  readonly duplicateSceneIds: readonly string[];
  readonly expiredCallbackIds: readonly string[];
  readonly choiceGateFailureIds: readonly string[];
  readonly longestCombatRun: number;
  readonly longestNoRecoveryRun: number;
}

function chooseChoiceIndex(seed: number, chapterIndex: number, selectionIndex: number, choiceCount: number): number {
  return (seed + chapterIndex + selectionIndex) % choiceCount;
}

function applyChoice(
  event: Chronicle1Event,
  seed: number,
  chapterIndex: number,
  selectionIndex: number,
  flags: Set<string>,
  pendingCallbacks: readonly PendingCallback[],
): {
  readonly pendingCallbacks: readonly PendingCallback[];
  readonly threatChange: number;
  readonly tensionChange: number;
} | null {
  const eligibleChoices = event.choices.filter((choice) =>
    (choice.requirements ?? []).every((gate) => flags.has(gate.flagId) === gate.present)
      && (choice.exclusions ?? []).every((gate) => flags.has(gate.flagId) !== gate.present));
  if (eligibleChoices.length === 0) return null;

  const choice = eligibleChoices[
    chooseChoiceIndex(seed, chapterIndex, selectionIndex, eligibleChoices.length)
  ]!;
  const callbacks: PendingCallback[] = [...pendingCallbacks];
  const register = (promise: { readonly targetEventId: EventId; readonly deadline: PendingCallback['deadline'] }) => {
    if (!callbacks.some((callback) => callback.targetEventId === promise.targetEventId)) {
      callbacks.push({ ...promise, status: 'pending', required: true });
    }
  };

  for (const promise of event.callbackPromises) register(promise);

  let threatChange = 0;
  let tensionChange = 0;

  for (const effect of choice.effects) {
    if (effect.type === 'flag') {
      if (effect.operation === 'add') flags.add(effect.flagId);
      else flags.delete(effect.flagId);
    }
    if (effect.type === 'callback') register(effect.promise);
    if (effect.type === 'threat') threatChange += effect.amount;
    if (effect.type === 'tension') tensionChange += effect.amount;
  }
  return { pendingCallbacks: callbacks, threatChange, tensionChange };
}

function expiredCallbackIds(pendingCallbacks: readonly PendingCallback[], position: PendingCallback['deadline']): readonly string[] {
  return pendingCallbacks
    .filter((callback) => callback.status === 'pending' && comparePosition(callback.deadline, position) < 0)
    .map((callback) => callback.targetEventId);
}

function simulateChronicle1(seed: number): RouteAudit {
  let director = initialState(seed);
  const flags = new Set<string>();
  const selectedSceneIds: string[] = [];
  const duplicateSceneIds: string[] = [];
  const expiredCallbackIdsFound: string[] = [];
  const choiceGateFailureIds: string[] = [];
  let combatRun = 0;
  let longestCombatRun = 0;
  let noRecoveryRun = 0;
  let longestNoRecoveryRun = 0;

  CHRONICLE1.chapters.forEach((chapter, chapterIndex) => {
    director = beginDirectorRun(director);
    const chapterScenes = CHRONICLE1_SCENES.filter((scene) => scene.chapterId === chapter.id);
    const lastSlot = Math.max(...chapterScenes.map((scene) => scene.slot));
    const level = chapter.levelBand.min;
    const routeProfile = ROUTES[(seed + chapterIndex) % ROUTES.length]!;
    const scheduledSlots = new Set(
      chapterScenes.filter((scene) => scene.type === 'main').map((scene) => scene.slot),
    );
    for (let slot = 1; slot <= lastSlot; slot += 4) scheduledSlots.add(slot);
    scheduledSlots.add(lastSlot);

    for (let slot = 1; slot <= lastSlot; slot += 1) {
      const position = { chapterId: chapter.id, slot };
      expiredCallbackIdsFound.push(...expiredCallbackIds(director.pendingCallbacks, position));
      let scheduledSelectionOwed = scheduledSlots.has(slot);
      let selectionsAtSlot = 0;

      while (
        scheduledSelectionOwed
        || director.pendingCallbacks.some((callback) =>
          callback.status === 'pending' && comparePosition(callback.deadline, position) <= 0)
      ) {
        const step = selectNextScene(director, {
          position,
          level,
          flags: [...flags],
          inventoryTags: [],
          routeProfile,
        }, unlockedContent(chapter.id, slot));

        if (step.kind === 'terminal') {
          director = step.state;
          break;
        }

        const event = step.event as unknown as Chronicle1Event;
        if (step.reason !== 'callback') scheduledSelectionOwed = false;
        if (selectedSceneIds.includes(event.id)) duplicateSceneIds.push(event.id);
        selectedSceneIds.push(event.id);
        combatRun = event.type === 'combat' ? combatRun + 1 : 0;
        longestCombatRun = Math.max(longestCombatRun, combatRun);
        noRecoveryRun = ['merchant', 'recovery'].includes(scenePacing(event)) ? 0 : noRecoveryRun + 1;
        longestNoRecoveryRun = Math.max(longestNoRecoveryRun, noRecoveryRun);

        const choiceResult = applyChoice(
          event,
          seed,
          chapterIndex,
          selectedSceneIds.length - 1,
          flags,
          step.state.pendingCallbacks,
        );
        if (!choiceResult) {
          choiceGateFailureIds.push(event.id);
          director = step.state;
          break;
        }
        director = {
          ...step.state,
          pendingCallbacks: choiceResult.pendingCallbacks,
          threat: Math.max(0, Math.min(10, step.state.threat + choiceResult.threatChange)),
          tension: Math.max(0, Math.min(10, step.state.tension + choiceResult.tensionChange)),
        };

        selectionsAtSlot += 1;
        if (selectionsAtSlot >= 8) throw new Error(`Route audit stalled at ${chapter.id}:${slot}.`);
      }
    }
  });

  const lastChapter = CHRONICLE1.chapters[CHRONICLE1.chapters.length - 1]!;
  const finalSlot = Math.max(...CHRONICLE1_SCENES.filter((scene) => scene.chapterId === lastChapter.id).map((scene) => scene.slot));
  expiredCallbackIdsFound.push(...expiredCallbackIds(director.pendingCallbacks, { chapterId: lastChapter.id, slot: finalSlot + 1 }));

  const selected = new Set(selectedSceneIds);
  const expectedAnchors = Object.values(MAIN_ANCHOR_IDS).flat();
  return {
    selectedSceneIds,
    skippedAnchorIds: expectedAnchors.filter((anchorId) => !selected.has(anchorId)),
    duplicateSceneIds,
    expiredCallbackIds: expiredCallbackIdsFound,
    choiceGateFailureIds,
    longestCombatRun,
    longestNoRecoveryRun,
  };
}

describe('Chronicle I route audit', () => {
  it('keeps anchors, callbacks, variety, and recovery opportunities coherent across 64 seeded campaigns', () => {
    const signatures = new Set<string>();

    for (let seed = 1; seed <= 64; seed += 1) {
      const audit = simulateChronicle1(seed);
      signatures.add(audit.selectedSceneIds.join('|'));
      expect(audit.skippedAnchorIds).toEqual([]);
      expect(audit.duplicateSceneIds).toEqual([]);
      expect(audit.expiredCallbackIds).toEqual([]);
      expect(audit.choiceGateFailureIds).toEqual([]);
      expect(audit.longestCombatRun, `seed ${seed}`).toBeLessThanOrEqual(3);
      expect(audit.longestNoRecoveryRun, `seed ${seed}`).toBeLessThanOrEqual(12);
    }

    expect(signatures.size).toBeGreaterThan(8);
  });
});
