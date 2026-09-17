import { describe, expect, it } from 'vitest';
import { encodeSaveState, isContentBackedSaveState } from '../src/game/persistence/codec';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import { makeContentIndex } from './fixtures/game';

const updatedAt = '2026-09-17T08:00:00.000Z';

describe('Road Tactics persistence', () => {
  it('rejects a travel save carrying a current scene', () => {
    const content = makeContentIndex();
    const started = reduceGame(createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content), { type: 'start-expedition', updatedAt }, content).state;
    const valid = encodeSaveState(started, content)!;
    const invalid = {
      ...valid,
      expedition: {
        ...valid.expedition!,
        currentSceneId: 'fixture-event',
        sceneResolution: { eventId: 'fixture-event', choiceId: null, resultKind: 'direct' as const, chance: null, roll: null, outcome: 'Done.', effectSummary: [], nextSceneId: null, continueLabel: null },
        sceneVisitCounts: { 'fixture-event': 1 },
      },
    };

    expect(isContentBackedSaveState(invalid, content)).toBe(false);
  });
});
