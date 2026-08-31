import { describe, expect, it } from 'vitest';
import { beginDirectorRun, selectNextScene } from '../../src/game/director';
import { choiceIsAvailable, comparePosition } from '../../src/game/director/eligibility';
import type { DirectorState, PendingCallback, RouteProfileId } from '../../src/game/director/types';
import {
  CHRONICLE1,
  CHRONICLE1_CONTENT,
  CHRONICLE1_SCENES,
  MAIN_ANCHOR_IDS,
} from '../../src/game/content/chronicle1';
import type { Chronicle1Event } from '../../src/game/content/schema';
import { scenePacing } from '../../src/game/director/pacing';
import { createCampaign } from '../../src/game/state/create';
import { applyEffectsAtomically, type EffectState } from '../../src/game/state/effects';

const ROUTES: readonly RouteProfileId[] = ['kings-road', 'old-forest', 'ruined-pass'];
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
  readonly terminalDiagnostics: readonly string[];
  readonly longestCombatRun: number;
  readonly longestNoRecoveryRun: number;
}

function chooseChoiceIndex(seed: number, chapterIndex: number, selectionIndex: number, choiceCount: number): number {
  return (seed + chapterIndex + selectionIndex) % choiceCount;
}

function initialEffectState(seed: number): EffectState {
  const created = createCampaign({
    heroClass: 'warrior',
    seed,
    name: 'Route Auditor',
    updatedAt: '2026-08-31T00:00:00.000Z',
  }, CHRONICLE1_CONTENT);
  return {
    campaign: { ...created.campaign, bankedGold: 10_000 },
    expedition: {
      routeProfile: 'kings-road',
      routeSeed: seed,
      director: initialState(seed),
      position: { chapterId: 'ch01', slot: 1 },
      currentSceneId: null,
      sceneResolution: null,
      heroVitals: { health: 44, resource: 8 },
      currentCombat: null,
      pendingReward: null,
      unbankedGold: 10_000,
      unbankedLoot: [],
      temporaryBoons: [],
      merchantVisits: [],
    },
  };
}

function resolveChoice(
  event: Chronicle1Event,
  seed: number,
  chapterIndex: number,
  selectionIndex: number,
  state: EffectState,
): EffectState | null {
  const eligibleChoices = event.choices.filter((choice) =>
    choiceIsAvailable(choice, state.campaign.flags, state.expedition?.position));
  if (eligibleChoices.length === 0) return null;

  const firstChoiceIndex = chooseChoiceIndex(
    seed,
    chapterIndex,
    selectionIndex,
    eligibleChoices.length,
  );
  const callbackEffects = event.callbackPromises.map((promise) => ({
    type: 'callback' as const,
    promise: { targetEventId: promise.targetEventId, deadline: promise.deadline },
  }));

  for (let offset = 0; offset < eligibleChoices.length; offset += 1) {
    const choice = eligibleChoices[(firstChoiceIndex + offset) % eligibleChoices.length]!;
    const applied = applyEffectsAtomically(
      state,
      [...callbackEffects, ...choice.effects],
      CHRONICLE1_CONTENT,
    );
    if (applied.ok) {
      return {
        campaign: applied.value.campaign,
        expedition: applied.value.expedition
          ? { ...applied.value.expedition, currentCombat: null }
          : null,
      };
    }
  }
  return null;
}

function expiredCallbackIds(pendingCallbacks: readonly PendingCallback[], position: PendingCallback['deadline']): readonly string[] {
  return pendingCallbacks
    .filter((callback) => callback.status === 'pending' && comparePosition(callback.deadline, position) < 0)
    .map((callback) => callback.targetEventId);
}

function simulateChronicle1(seed: number): RouteAudit {
  let effectState = initialEffectState(seed);
  let director = effectState.expedition!.director;
  const selectedSceneIds: string[] = [];
  const duplicateSceneIds: string[] = [];
  const expiredCallbackIdsFound: string[] = [];
  const choiceGateFailureIds: string[] = [];
  const terminalDiagnostics: string[] = [];
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
    effectState = {
      campaign: {
        ...effectState.campaign,
        chapterId: chapter.id,
        hero: { ...effectState.campaign.hero, level },
      },
      expedition: {
        ...effectState.expedition!,
        routeProfile,
        director,
        position: { chapterId: chapter.id, slot: 1 },
      },
    };
    const scheduledSlots = new Set(
      chapterScenes.filter((scene) => scene.type === 'main').map((scene) => scene.slot),
    );
    for (let slot = 1; slot <= lastSlot; slot += 4) scheduledSlots.add(slot);
    scheduledSlots.add(lastSlot);

    for (let slot = 1; slot <= lastSlot; slot += 1) {
      const position = { chapterId: chapter.id, slot };
      effectState = {
        ...effectState,
        expedition: { ...effectState.expedition!, director, position, currentCombat: null },
      };
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
          flags: effectState.campaign.flags,
          inventoryTags: [],
          routeProfile,
        }, CHRONICLE1_CONTENT);

        if (step.kind === 'terminal') {
          terminalDiagnostics.push(`${chapter.id}:${slot}:${step.terminal}:${step.diagnostic}`);
          director = step.state;
          effectState = {
            ...effectState,
            expedition: { ...effectState.expedition!, director },
          };
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

        const choiceResult = resolveChoice(
          event,
          seed,
          chapterIndex,
          selectedSceneIds.length - 1,
          {
            campaign: effectState.campaign,
            expedition: {
              ...effectState.expedition!,
              director: step.state,
              position: { ...position, slot: position.slot + 1 },
              currentCombat: null,
            },
          },
        );
        if (!choiceResult) {
          choiceGateFailureIds.push(event.id);
          director = step.state;
          effectState = {
            ...effectState,
            expedition: { ...effectState.expedition!, director },
          };
          break;
        }
        effectState = choiceResult;
        director = effectState.expedition!.director;

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
    terminalDiagnostics,
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
      expect(audit.terminalDiagnostics, `seed ${seed}`).toEqual([]);
      expect(audit.longestCombatRun, `seed ${seed}`).toBeLessThanOrEqual(3);
      expect(audit.longestNoRecoveryRun, `seed ${seed}`).toBeLessThanOrEqual(12);
    }

    expect(signatures.size).toBeGreaterThan(8);
  });
});
