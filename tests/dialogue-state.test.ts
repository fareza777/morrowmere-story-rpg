import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChoiceId, CompanionId, EventId } from '../src/game/domain/ids';
import { decodeSaveState, decodeSaveStateWithDiagnostics, encodeSaveState } from '../src/game/persistence/codec';
import { createSaveRepository, saveActiveKey } from '../src/game/persistence/repository';
import { createSaveEnvelope } from '../src/game/persistence/schema';
import { createCampaign, reduceGame, type GameStateV2 } from '../src/game/state';
import { selectCurrentScene } from '../src/ui/selectors';

const eventId = 'dialogue-at-the-ford' as EventId;
const choiceId = 'answer-the-ford' as ChoiceId;
const maraId = 'mara' as CompanionId;
const followUpId = 'dialogue-aftermath' as EventId;
const requiredFollowUpId = 'dialogue-required-aftermath' as EventId;
const at = (minute: number) => `2026-09-01T00:${String(minute).padStart(2, '0')}:00.000Z`;

const dialogue = [
  { speakerId: 'mara', speakerName: 'Mara', text: 'The ford is too quiet. Keep your hand near the blade.', characterLayer: { illustrationId: 'character-mara-wary', companionId: maraId, position: 'left' }, expression: 'wary' },
  { speakerId: 'mara', speakerName: 'Mara', text: 'We can cross now, or wait for the mist to lift.', voiceCueId: 'voice-dialogue-ford' },
] as const;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

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

function continueOnlyContent(): ContentIndex {
  const index = content();
  const scene = { ...index.events.get(eventId)!, choices: [], followUps: [followUpId], oneShot: false } as ChronicleEvent;
  return { ...index, events: new Map([[eventId, scene]]) };
}

describe('cinematic dialogue state', () => {
  it('shows and advances only dialogue beats whose flag gates match', () => {
    const base = content();
    const scene = {
      ...base.events.get(eventId)!,
      dialogue: [
        { speakerName: 'Captured Watcher', text: 'We only watched the road.', requirements: [{ type: 'flag', flagId: 'watcher-captured', present: true }] },
        { speakerName: 'Jory', text: 'The register is still missing.' },
      ],
    } as ChronicleEvent;
    const index = { ...base, events: new Map([[eventId, scene]]) };
    const withoutCapture = atDialogueScene(index);

    expect(selectCurrentScene(withoutCapture, index)?.dialogue).toMatchObject({ speakerName: 'Jory', total: 1, isFinal: true });
    expect(reduceGame(withoutCapture, { type: 'advance-dialogue', eventId, updatedAt: at(2) } as never, index).diagnostic?.code).toBe('dialogue_complete');

    const withCapture = { ...withoutCapture, campaign: { ...withoutCapture.campaign, flags: ['watcher-captured'] } };
    expect(selectCurrentScene(withCapture, index)?.dialogue).toMatchObject({ speakerName: 'Captured Watcher', total: 2, isFinal: false });
    const advanced = reduceGame(withCapture, { type: 'advance-dialogue', eventId, updatedAt: at(2) } as never, index).state;
    expect(selectCurrentScene(advanced, index)?.dialogue).toMatchObject({ speakerName: 'Jory', index: 1, isFinal: true });
  });

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

  it('rejects selecting away from an unfinished continue-only dialogue', () => {
    const index = continueOnlyContent();
    const created = createCampaign({ heroClass: 'warrior', seed: 11, updatedAt: at(0) }, index);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: at(1) }, index).state;
    const selected = reduceGame(started, { type: 'select-next-scene', updatedAt: at(2) }, index).state;
    const earlyContinue = reduceGame(selected, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(selected.expedition?.currentSceneId).toBe(eventId);
    expect(selected.expedition?.dialogueBeatIndex).toBe(0);
    expect(selected.expedition?.sceneResolution).toBeNull();
    expect(earlyContinue.state).toBe(selected);
    expect(earlyContinue.diagnostic?.code).toBe('dialogue_incomplete');
  });

  it('completes a final continue-only dialogue and appends its follow-up after queued scenes', () => {
    const index = continueOnlyContent();
    const initial = atDialogueScene(index);
    const finalBeat = reduceGame(initial, { type: 'advance-dialogue', eventId, updatedAt: at(2) }, index).state;
    const queued = {
      ...finalBeat,
      expedition: {
        ...finalBeat.expedition!,
        authoredSceneQueue: [{ sceneId: 'earlier-optional' as EventId, sourceSceneId: 'earlier-source' as EventId, requirementMode: 'optional' as const }],
      },
    };

    const completed = reduceGame(queued, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(completed.diagnostic).toBeUndefined();
    expect(completed.state.expedition).toMatchObject({ currentSceneId: null, dialogueBeatIndex: 0, sceneResolution: { eventId, choiceId: null, resultKind: 'direct' } });
    expect(completed.state.expedition?.authoredSceneQueue.map((entry) => [entry.sceneId, entry.requirementMode])).toEqual([
      ['earlier-optional', 'optional'],
      [followUpId, 'optional'],
    ]);
    expect(completed.state.campaign.flags).toEqual(initial.campaign.flags);
  });

  it('resolves a final choice-bearing dialogue with its required continuation before scene follow-ups', () => {
    const index = content();
    const scene = {
      ...index.events.get(eventId)!,
      followUps: [followUpId],
      choices: [{ ...index.events.get(eventId)!.choices[0], nextSceneId: requiredFollowUpId }],
    } as ChronicleEvent;
    const withContinuations = { ...index, events: new Map([[eventId, scene]]) };
    const finalBeat = reduceGame(atDialogueScene(withContinuations), { type: 'advance-dialogue', eventId, updatedAt: at(2) }, withContinuations).state;

    const resolved = reduceGame(finalBeat, { type: 'resolve-choice', eventId, choiceId, updatedAt: at(3) }, withContinuations);

    expect(resolved.diagnostic).toBeUndefined();
    expect(resolved.state.expedition?.sceneResolution).toMatchObject({ eventId, choiceId, nextSceneId: requiredFollowUpId });
    expect(resolved.state.expedition?.authoredSceneQueue.map((entry) => [entry.sceneId, entry.requirementMode])).toEqual([
      [requiredFollowUpId, 'required'],
      [followUpId, 'optional'],
    ]);
  });

  it('rejects direct choice resolution before dialogue reaches its final beat', () => {
    const index = content();
    const initial = atDialogueScene(index);
    const result = reduceGame(initial, { type: 'resolve-choice', eventId, choiceId, updatedAt: at(2) }, index);

    expect(result.state).toBe(initial);
    expect(result.diagnostic?.code).toBe('dialogue_incomplete');
    expect(result.state.campaign.flags).toEqual([]);
    expect(result.state.expedition?.checkedAttempts).toEqual([]);
    expect(result.state.expedition?.authoredSceneQueue).toEqual([]);
  });

  it('reports current-v3 dialogue index recovery when it clamps or clears the stored index', () => {
    const index = content();
    const encoded = encodeSaveState({ ...atDialogueScene(index), expedition: { ...atDialogueScene(index).expedition!, dialogueBeatIndex: 99 } }, index)!;
    const recovered = decodeSaveStateWithDiagnostics(encoded, index);
    const cleared = decodeSaveStateWithDiagnostics({ ...encoded, expedition: { ...encoded.expedition!, currentSceneId: null, dialogueBeatIndex: 1, sceneVisitCounts: {} } }, index);

    expect(recovered?.state.expedition?.dialogueBeatIndex).toBe(1);
    expect(recovered?.diagnostics.join(' ')).toMatch(/dialogue/i);
    expect(cleared?.state.expedition?.dialogueBeatIndex).toBe(0);
    expect(cleared?.diagnostics.join(' ')).toMatch(/dialogue/i);
  });

  it('rewrites a recovered v3 dialogue index through the save repository', () => {
    const index = content();
    const state = atDialogueScene(index);
    const encoded = encodeSaveState({ ...state, expedition: { ...state.expedition!, dialogueBeatIndex: 99 } }, index)!;
    const storage = new MemoryStorage();
    storage.setItem(saveActiveKey(1), JSON.stringify(createSaveEnvelope(1, encoded, at(3))));

    const loaded = createSaveRepository(storage, () => at(4), index).loadSlot(1);

    expect(loaded).toMatchObject({ ok: true, state: { expedition: { dialogueBeatIndex: 1 } }, notice: expect.stringMatching(/dialogue/i) });
    expect(JSON.parse(storage.getItem(saveActiveKey(1)) ?? '{}').state.expedition.dialogueBeatIndex).toBe(1);
  });
});
