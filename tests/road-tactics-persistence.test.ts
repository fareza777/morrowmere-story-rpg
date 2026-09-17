import { describe, expect, it } from 'vitest';
import { decodeSaveState, decodeSaveStateWithDiagnostics, encodeSaveState, isContentBackedSaveState } from '../src/game/persistence/codec';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import { makeContentIndex } from './fixtures/game';

const updatedAt = '2026-09-17T08:00:00.000Z';

describe('Road Tactics persistence', () => {
  it('round-trips a travel screen without losing the expedition', () => {
    const content = makeContentIndex();
    const state = reduceGame(createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content), { type: 'start-expedition', updatedAt }, content).state;

    const encoded = encodeSaveState(state, content);
    const decoded = decodeSaveState(encoded, content);

    expect(decoded).toMatchObject({ flow: { screen: 'travel' }, expedition: { currentSceneId: null } });
  });

  it('recovers an empty v3 story save into travel', () => {
    const content = makeContentIndex();
    const state = reduceGame(createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content), { type: 'start-expedition', updatedAt }, content).state;
    const legacy = encodeSaveState({ ...state, flow: { ...state.flow, screen: 'story' } }, content);

    const recovered = decodeSaveStateWithDiagnostics(legacy, content);

    expect(recovered?.state.flow.screen).toBe('travel');
    expect(recovered?.diagnostics.join(' ')).toMatch(/travel/i);
  });

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
