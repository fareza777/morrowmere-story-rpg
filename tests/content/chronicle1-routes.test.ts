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
import { CHRONICLE1_ROUTES, toRouteOption } from '../../src/game/content/chronicle1/routes';
import { chronicle1ChoiceEffects, type Chronicle1Event } from '../../src/game/content/schema';
import type { StoryPosition } from '../../src/game/domain/ids';
import { scenePacing } from '../../src/game/director/pacing';
import { createCampaign } from '../../src/game/state/create';
import { applyEffectsAtomically, type EffectState } from '../../src/game/state/effects';
import { currentSceneId, reduceGame } from '../../src/game/state/reducer';

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
      authoredSceneQueue: [],
      sceneVisitCounts: {},
      checkedAttempts: [],
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
      [...callbackEffects, ...chronicle1ChoiceEffects(choice)],
      CHRONICLE1_CONTENT,
    );
    if (!applied.ok) continue;
    return {
      campaign: applied.value.campaign,
      expedition: applied.value.expedition
        ? { ...applied.value.expedition, currentCombat: null }
        : null,
    };
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
    // Every completed chapter returns through Camp before the next route starts.
    noRecoveryRun = 0;
    const level = chapter.levelBand.min;
    const routeProfile = ROUTES[(seed + chapterIndex) % ROUTES.length]!;
    let position: StoryPosition = { chapterId: chapter.id, slot: 1 };
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
        position,
      },
    };

    for (let selections = 0; selections < 96; selections += 1) {
      effectState = {
        ...effectState,
        expedition: { ...effectState.expedition!, director, position, currentCombat: null },
      };
      expiredCallbackIdsFound.push(...expiredCallbackIds(director.pendingCallbacks, position));

      const step = selectNextScene(director, {
        position,
        level,
        flags: effectState.campaign.flags,
        inventoryTags: [],
        routeProfile,
      }, CHRONICLE1_CONTENT);

      if (step.kind === 'terminal') {
        if (step.terminal !== 'completed') {
          terminalDiagnostics.push(`${chapter.id}:${position.slot}:${step.terminal}:${step.diagnostic}`);
        }
        director = step.state;
        effectState = {
          ...effectState,
          expedition: { ...effectState.expedition!, director },
        };
        break;
      }

      const event = step.event as unknown as Chronicle1Event;
      if (selectedSceneIds.includes(event.id)) duplicateSceneIds.push(event.id);
      selectedSceneIds.push(event.id);
      combatRun = event.type === 'combat' ? combatRun + 1 : 0;
      longestCombatRun = Math.max(longestCombatRun, combatRun);
      noRecoveryRun = ['merchant', 'recovery'].includes(scenePacing(step.event)) ? 0 : noRecoveryRun + 1;
      longestNoRecoveryRun = Math.max(longestNoRecoveryRun, noRecoveryRun);

      position = { ...step.selectedAt, slot: step.selectedAt.slot + 1 };
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
            position,
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
  it('keeps the locked route copy separate from private director tuning', () => {
    const expected = [
      {
        id: 'kings-road', label: "The King's Road",
        description: "Built for royal couriers, the broad stone road runs straight across wind-bent fields. Weathered mileposts and fallen statues mark the old kingdom's reach, while broken paving near the river flats slows a loaded wagon.",
        danger: 1, recoveryWeight: 3, merchantWeight: 3, companionWeight: 1, relicWeight: 0,
      },
      {
        id: 'old-forest', label: 'The Old Forest',
        description: 'Older than the kingdom, the forest closes over narrow paths between ancient oaks and moss-slick roots. Fallen trunks and soft ground make every cart choose its way, while dusk gathers early beneath the canopy.',
        danger: 2, recoveryWeight: 2, merchantWeight: 1, companionWeight: 3, relicWeight: 1,
      },
      {
        id: 'ruined-pass', label: 'The Ruined Pass',
        description: 'Once the northern road, the pass climbs through bare crags and shattered watchtowers. Loose stone, steep grades, and old switchbacks leave little room for wagons; snow lingers in the shade after the lowlands thaw.',
        danger: 3, recoveryWeight: 1, merchantWeight: 0, companionWeight: 1, relicWeight: 3,
      },
    ] as const;

    expect(CHRONICLE1_ROUTES).toEqual(expected);
    expect(CHRONICLE1_ROUTES.map(toRouteOption)).toEqual(expected.map((route) => ({
      id: route.id,
      label: route.label,
      description: route.description,
      risk: route.danger,
      recoveryBias: route.recoveryWeight,
      merchantBias: route.merchantWeight,
    })));
  });

  it('selects the first authored anchor from a fresh runtime expedition', () => {
    const created = createCampaign({
      heroClass: 'warrior',
      seed: 17,
      name: 'Route Auditor',
      updatedAt: '2026-08-31T00:00:00.000Z',
    }, CHRONICLE1_CONTENT);
    const started = reduceGame(created, {
      type: 'start-expedition',
      routeProfile: 'kings-road',
      updatedAt: '2026-08-31T00:01:00.000Z',
    }, CHRONICLE1_CONTENT);

    expect(started.state.expedition?.position.slot).toBe(1);
    const selected = reduceGame(started.state, {
      type: 'select-next-scene',
      updatedAt: '2026-08-31T00:02:00.000Z',
    }, CHRONICLE1_CONTENT);

    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(MAIN_ANCHOR_IDS.ch01[0]);
  });

  it('keeps anchors, callbacks, variety, and recovery opportunities coherent across 64 seeded campaigns', () => {
    const signatures = new Set<string>();

    for (let seed = 1; seed <= 64; seed += 1) {
      const audit = simulateChronicle1(seed);
      signatures.add(audit.selectedSceneIds.join('|'));
      expect(audit.skippedAnchorIds, `seed ${seed}; gates: ${audit.choiceGateFailureIds.join(', ')}; terminals: ${audit.terminalDiagnostics.join(' | ')}`).toEqual([]);
      expect(audit.duplicateSceneIds).toEqual([]);
      expect(audit.expiredCallbackIds).toEqual([]);
      expect(audit.choiceGateFailureIds).toEqual([]);
      expect(audit.terminalDiagnostics, `seed ${seed}`).toEqual([]);
      expect(audit.longestCombatRun, `seed ${seed}`).toBeLessThanOrEqual(3);
      // The Ruined Pass deliberately bypasses Chapter 1's route-side apothecary.
      expect(audit.longestNoRecoveryRun, `seed ${seed}`).toBeLessThanOrEqual(24);
    }

    expect(signatures.size).toBeGreaterThanOrEqual(6);
  });
});
