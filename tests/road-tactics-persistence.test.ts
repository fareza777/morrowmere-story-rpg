import { describe, expect, it } from 'vitest';
import { decodeSaveState, decodeSaveStateWithDiagnostics, encodeSaveState, isContentBackedSaveState } from '../src/game/persistence/codec';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import { makeContentIndex } from './fixtures/game';
import type { ChronicleChoice } from '../src/game/content/schema';
import type { ChoiceId, EventId } from '../src/game/domain/ids';
import { createSaveRepository } from '../src/game/persistence/repository';
import type { SaveStateDto } from '../src/game/persistence/schema';

const updatedAt = '2026-09-17T08:00:00.000Z';

function resolvedRoad(kind: 'direct' | 'checked' | 'automatic' = 'direct') {
  const base = makeContentIndex();
  const source = base.events.get('fixture-event' as EventId)!;
  const choice = { id: 'resolve-road' as ChoiceId, label: 'Secure the road', detail: 'Prepare the next leg.' };
  const choices: readonly ChronicleChoice[] = kind === 'automatic' ? [] : kind === 'checked'
    ? [{ ...choice, check: { stat: 'cunning', difficulty: 0,
      success: { outcome: 'The road is secure.', effects: [] },
      failure: { outcome: 'The road is uncertain.', effects: [] },
    } }]
    : [{ ...choice, outcome: 'The road is secure.', effects: [] }];
  const scene = { ...source, type: 'hub' as const, choices };
  const content = { ...base, events: new Map([[scene.id, scene]]) };
  const camp = createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content);
  const started = reduceGame(camp, { type: 'start-expedition', updatedAt }, content).state;
  let story = reduceGame(started, { type: 'travel-action', action: 'press-on', updatedAt }, content).state;
  if (kind !== 'automatic') {
    const result = reduceGame(story, { type: 'resolve-choice', eventId: scene.id, choiceId: choice.id, updatedAt }, content);
    expect(result.diagnostic).toBeUndefined();
    story = result.state;
  }
  const result = reduceGame(story, { type: 'select-next-scene', updatedAt }, content);
  expect(result.diagnostic).toBeUndefined();
  const storyDto = encodeSaveState(story, content)!;
  expect(storyDto).not.toBeNull();
  const dto: SaveStateDto = { ...storyDto, flow: result.state.flow,
    campaign: { ...storyDto.campaign, transitionCounter: result.state.campaign.transitionCounter },
    expedition: { ...storyDto.expedition!, currentSceneId: null, dialogueBeatIndex: 0 },
  };
  return { content, story, storyDto, travel: result.state, dto };
}

describe('Road Tactics persistence', () => {
  it.each(['direct', 'checked', 'automatic'] as const)('autosaves and resumes a reducer-produced %s receipt in travel', (kind) => {
    const { content, travel, dto } = resolvedRoad(kind);
    expect(travel).toMatchObject({ flow: { screen: 'travel', merchant: null }, expedition: {
      currentSceneId: null, currentCombat: null, pendingReward: null,
      sceneResolution: { eventId: 'fixture-event' },
    } });
    expect(encodeSaveState(travel, content)).toEqual(dto);
    expect(decodeSaveState(dto, content)).toEqual(travel);
    window.localStorage.clear();
    const repository = createSaveRepository(window.localStorage, () => updatedAt, content);
    expect(repository.saveSlot(2, travel)).toEqual({ ok: true });
    const loaded = repository.loadSlot(2);
    expect(loaded).toMatchObject({ ok: true, source: 'active', state: travel });
    if (!loaded.ok) throw new Error('Travel receipt should load.');
    const banked = reduceGame(loaded.state, { type: 'bank-camp', updatedAt }, content);
    expect(banked.diagnostic).toBeUndefined();
    expect(banked.state).toMatchObject({ flow: { screen: 'camp' }, expedition: null });
  });

  it('rejects malformed and unvisited travel receipts without normalizing them away', () => {
    const { content, dto } = resolvedRoad();
    const expedition = dto.expedition!;
    const receipt = expedition.sceneResolution!;
    const invalidExpeditions = [
      { ...expedition, sceneResolution: { ...receipt, eventId: 'missing-scene' } },
      { ...expedition, sceneResolution: { ...receipt, choiceId: 'missing-choice' } },
      { ...expedition, sceneResolution: { ...receipt, choiceId: null } },
      { ...expedition, sceneResolution: { ...receipt, roll: 1 } },
      { ...expedition, sceneResolution: { ...receipt, outcome: '' } },
      { ...expedition, sceneVisitCounts: {} },
      { ...expedition, director: { ...expedition.director, usedSceneIds: [] } },
      { ...expedition, director: { ...expedition.director, seenEventIds: [] } },
      { ...expedition, dialogueBeatIndex: 1 },
    ];
    for (const invalid of invalidExpeditions) {
      expect(decodeSaveState({ ...dto, expedition: invalid }, content), JSON.stringify(invalid)).toBeNull();
    }
    const scene = content.events.get(receipt.eventId as EventId)!;
    const wrongChapter = { ...content, events: new Map([[scene.id, { ...scene, chapterId: 'ch02' as const }]]) };
    expect(decodeSaveState(dto, wrongChapter)).toBeNull();
  });

  it('keeps checked receipts tied to their recorded roll and visit', () => {
    const { content, dto } = resolvedRoad('checked');
    expect(decodeSaveState({ ...dto, expedition: { ...dto.expedition!, checkedAttempts: [] } }, content)).toBeNull();
    expect(decodeSaveState({ ...dto, expedition: { ...dto.expedition!, sceneVisitCounts: { 'fixture-event': 2 } } }, content)).toBeNull();
  });

  it('retains active story validation and does not recover an orphan story receipt as travel', () => {
    const { content, story, storyDto, dto } = resolvedRoad();
    expect(decodeSaveState(storyDto, content)).toEqual(story);
    expect(decodeSaveState({ ...dto, flow: { ...dto.flow, screen: 'story' } }, content)).toBeNull();
    const other = { ...content.events.get('fixture-event' as EventId)!, id: 'other-scene' as EventId };
    const catalog = { ...content, events: new Map([...content.events, [other.id, other]]) };
    const mismatched = { ...storyDto, expedition: { ...storyDto.expedition!,
      sceneResolution: { ...storyDto.expedition!.sceneResolution!, eventId: other.id },
    } };
    expect(decodeSaveState(mismatched, catalog)).toBeNull();
  });

  it('rejects travel receipts carrying an active scene, combat, reward, or merchant', () => {
    const { content, dto } = resolvedRoad();
    const expedition = dto.expedition!;
    for (const invalid of [
      { ...dto, expedition: { ...expedition, currentSceneId: 'fixture-event' } },
      { ...dto, expedition: { ...expedition, currentCombat: { encounterId: 'encounter', combat: null } } },
      { ...dto, expedition: { ...expedition, pendingReward: { rewardId: 'reward', encounterId: 'encounter', itemChoices: [], baseGold: 0, grantedXp: 0, adEligible: false } } },
      { ...dto, flow: { ...dto.flow, merchant: { merchantId: 'merchant', restockKey: 'stock', returnScreen: 'story' } } },
    ]) expect(decodeSaveState(invalid, content)).toBeNull();
  });

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
