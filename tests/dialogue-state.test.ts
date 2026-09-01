import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChoiceId, CompanionId, EventId } from '../src/game/domain/ids';
import { decodeSaveState, encodeSaveState } from '../src/game/persistence/codec';
import { createCampaign, reduceGame, type GameStateV2 } from '../src/game/state';

const eventId = 'dialogue-at-the-ford' as EventId;
const choiceId = 'answer-the-ford' as ChoiceId;
const maraId = 'mara' as CompanionId;
const at = (minute: number) => `2026-09-01T00:${String(minute).padStart(2, '0')}:00.000Z`;

const dialogue = [
  { speakerId: 'mara', speakerName: 'Mara', text: 'The ford is too quiet. Keep your hand near the blade.', characterLayer: { illustrationId: 'character-mara-wary', companionId: maraId, position: 'left' }, expression: 'wary' },
  { speakerId: 'mara', speakerName: 'Mara', text: 'We can cross now, or wait for the mist to lift.', voiceCueId: 'voice-dialogue-ford' },
] as const;

function content(): ContentIndex {
  const event = {
    id: eventId, chapterId: 'ch01', type: 'journey', family: 'dialogue-fixture', illustrationId: 'scene-ch01-dialogue-ford',
    title: 'The silent ford', narrative: ['Cold water crosses the old road.'], eligibility: {}, cooldownRuns: 0, oneShot: true,
    dialogue,
    choices: [{ id: choiceId, label: 'Cross the ford', detail: 'Take the shallow stones.', outcome: 'You cross before the mist closes.', effects: [{ type: 'flag', operation: 'add', flagId: 'ford-crossed' }] }],
  } as unknown as ChronicleEvent;
  return {
    events: new Map([[eventId, event]]), items: new Map(), enemies: new Map(), encounters: new Map(), merchants: new Map(),
    companions: new Map([[maraId, { id: maraId, name: 'Mara', recruitment: { requiredDecisionIds: [] }, personalQuestIds: [], combat: { attack: 1, guard: 1, will: 1, actionId: 'covering-shot' } }]]),
    artIds: new Set(['scene-ch01-dialogue-ford', 'character-mara-wary']), audioIds: new Set(['voice-dialogue-ford']),
  };
}

function atDialogueScene(index: ContentIndex): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', seed: 11, updatedAt: at(0) }, index);
  const started = reduceGame(created, { type: 'start-expedition', updatedAt: at(1) }, index).state;
  return {
    ...started,
    expedition: { ...started.expedition!, currentSceneId: eventId, dialogueBeatIndex: 0, sceneResolution: null, sceneVisitCounts: { [eventId]: 1 } },
  } as GameStateV2;
}

describe('cinematic dialogue state', () => {
  it('advances one ordered beat without resolving or changing campaign state', () => {
    const index = content();
    const initial = atDialogueScene(index);
    const before = JSON.parse(JSON.stringify(initial));

    const advanced = reduceGame(initial, { type: 'advance-dialogue', eventId, updatedAt: at(2) } as never, index);

    expect(advanced.diagnostic).toBeUndefined();
    expect(advanced.state.expedition?.dialogueBeatIndex).toBe(1);
    expect({ ...advanced.state, updatedAt: at(1), campaign: { ...advanced.state.campaign, transitionCounter: before.campaign.transitionCounter }, expedition: { ...advanced.state.expedition!, dialogueBeatIndex: 0 } }).toEqual(before);
    expect(advanced.state.expedition?.sceneResolution).toBeNull();
    expect(advanced.state.campaign.flags).toEqual([]);
  });

  it('keeps responses unresolved at the final beat and resumes the exact beat after save/load', () => {
    const index = content();
    const atFinalBeat = reduceGame(atDialogueScene(index), { type: 'advance-dialogue', eventId, updatedAt: at(2) } as never, index).state;
    const rejected = reduceGame(atFinalBeat, { type: 'advance-dialogue', eventId, updatedAt: at(3) } as never, index);
    const encoded = encodeSaveState(atFinalBeat, index);

    expect(rejected.state).toBe(atFinalBeat);
    expect(rejected.diagnostic?.code).toBe('dialogue_complete');
    expect(rejected.state.expedition?.sceneResolution).toBeNull();
    expect(decodeSaveState(encoded, index)?.expedition?.dialogueBeatIndex).toBe(1);
  });

  it('normalizes installed v3 saves without a dialogue index to the first beat', () => {
    const index = content();
    const encoded = encodeSaveState(atDialogueScene(index), index)!;
    const legacyV3 = JSON.parse(JSON.stringify(encoded)) as { expedition: Record<string, unknown> };
    delete legacyV3.expedition.dialogueBeatIndex;

    expect(decodeSaveState(legacyV3, index)?.expedition?.dialogueBeatIndex).toBe(0);
  });
});
