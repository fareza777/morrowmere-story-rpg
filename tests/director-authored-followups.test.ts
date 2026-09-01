import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex, EncounterDefinition } from '../src/game/content/schema';
import type { GameEffect } from '../src/game/domain/effects';
import type { ChoiceId, EncounterId, EnemyId, EventId } from '../src/game/domain/ids';
import { decodeSaveState, encodeSaveState } from '../src/game/persistence/codec';
import { createCampaign, currentSceneId, reduceGame, type GameStateV2 } from '../src/game/state';

const asChoice = (value: string) => value as ChoiceId;
const asEncounter = (value: string) => value as EncounterId;
const asEnemy = (value: string) => value as EnemyId;
const asEvent = (value: string) => value as EventId;
const at = (minute: number) => `2026-09-01T01:${String(minute).padStart(2, '0')}:00.000Z`;

type FixtureEvent = Partial<ChronicleEvent>
  & Pick<ChronicleEvent, 'id' | 'type' | 'choices'>
  & { readonly followUps?: readonly EventId[] };

function scene(input: FixtureEvent): ChronicleEvent {
  return {
    chapterId: 'ch01', slot: 2, family: String(input.id), illustrationId: `${input.id}-art`, title: String(input.id),
    narrative: ['A deterministic authored-follow-up fixture.'], eligibility: {}, cooldownRuns: 0, oneShot: true,
    ...input,
  } as ChronicleEvent;
}

function content(events: readonly ChronicleEvent[], includeCombat = false): ContentIndex {
  const enemy = {
    id: asEnemy('queue-raider'), archetypeId: 'queue-raider', name: 'Queue Raider', rank: 1, level: 1,
    species: 'human' as const, region: 'gloamwood' as const, maxHealth: 1, attack: 0, armor: 0, ward: 0,
    intentWeights: { strike: 1 as const }, traits: [], rewardTags: [], description: 'A fragile route fixture.', artFamily: 'raider',
  };
  const encounter: EncounterDefinition = {
    id: asEncounter('queue-fight'), family: 'queue-fight', kind: 'regular', enemyIds: [enemy.id],
    reward: { xp: 0, gold: 0, itemChoices: [] },
  };
  return {
    events: new Map(events.map((event) => [event.id, event])), items: new Map(),
    enemies: includeCombat ? new Map([[enemy.id, enemy]]) : new Map(),
    encounters: includeCombat ? new Map([[encounter.id, encounter]]) : new Map(),
    companions: new Map(), merchants: new Map(), artIds: new Set(events.map((event) => event.illustrationId)), audioIds: new Set(),
  };
}

function directChoice(
  nextSceneId?: EventId,
  effects: readonly GameEffect[] = [],
): ChronicleEvent['choices'][number] {
  return {
    id: asChoice('continue'), label: 'Continue', detail: 'Follow the authored route.',
    outcome: 'The route continues.', effects,
    ...(nextSceneId ? { nextSceneId, continueLabel: 'Follow the trail' } : {}),
  };
}

function atSource(index: ContentIndex, sourceId: EventId): GameStateV2 {
  const created = createCampaign({ heroClass: 'warrior', seed: 17, updatedAt: at(0) }, index);
  const started = reduceGame(created, { type: 'start-expedition', updatedAt: at(1) }, index).state;
  return {
    ...started,
    expedition: {
      ...started.expedition!,
      position: { chapterId: 'ch01', slot: 2 },
      currentSceneId: sourceId,
      sceneResolution: null,
      director: {
        ...started.expedition!.director,
        usedSceneIds: [sourceId],
        seenEventIds: [sourceId],
      },
    },
  };
}

function resolveSource(state: GameStateV2, index: ContentIndex) {
  const eventId = state.expedition!.currentSceneId!;
  return reduceGame(state, {
    type: 'resolve-choice', eventId, choiceId: asChoice('continue'), updatedAt: at(2),
  }, index);
}

function queue(state: GameStateV2) {
  return (state.expedition as GameStateV2['expedition'] & {
    readonly authoredSceneQueue: readonly { readonly sceneId: EventId; readonly sourceSceneId: EventId; readonly requirementMode: 'required' | 'optional'; readonly reason?: string }[];
  })?.authoredSceneQueue ?? [];
}

describe('authored scene queue', () => {
  it('selects a direct choice target before random eligible content', () => {
    const source = scene({ id: asEvent('source'), type: 'journey', choices: [directChoice(asEvent('choice-aftermath'))] });
    const aftermath = scene({ id: asEvent('choice-aftermath'), type: 'journey', choices: [] });
    const anchor = scene({ id: asEvent('random-anchor'), type: 'main', anchorOrder: 2, choices: [] });
    const index = content([source, aftermath, anchor]);

    const resolved = resolveSource(atSource(index, source.id), index);
    const selected = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(resolved.diagnostic).toBeUndefined();
    expect(queue(resolved.state)).toEqual([expect.objectContaining({
      sceneId: aftermath.id, sourceSceneId: source.id, requirementMode: 'required',
    })]);
    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(aftermath.id);
    expect(queue(selected.state)).toEqual([]);
  });

  it('selects eligible scene follow-ups in declared order', () => {
    const first = scene({ id: asEvent('first-follow-up'), type: 'journey', eligibility: { requiredFlags: ['trail-open'] }, choices: [] });
    const second = scene({ id: asEvent('second-follow-up'), type: 'journey', choices: [] });
    const source = scene({
      id: asEvent('ordered-source'), type: 'journey', followUps: [first.id, second.id],
      choices: [{ ...directChoice(), effects: [{ type: 'flag', operation: 'add', flagId: 'trail-open' }] } as never],
    });
    const anchor = scene({ id: asEvent('ordered-anchor'), type: 'main', anchorOrder: 2, choices: [] });
    const index = content([source, first, second, anchor]);

    const resolved = resolveSource(atSource(index, source.id), index);
    const selectedFirst = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt: at(3) }, index);
    const selectedSecond = reduceGame(selectedFirst.state, { type: 'select-next-scene', updatedAt: at(4) }, index);

    expect(currentSceneId(selectedFirst.state)).toBe(first.id);
    expect(currentSceneId(selectedSecond.state)).toBe(second.id);
    expect(queue(selectedSecond.state)).toEqual([]);
  });

  it('skips ineligible optional follow-ups without dead-ending', () => {
    const locked = scene({ id: asEvent('locked-follow-up'), type: 'journey', eligibility: { requiredFlags: ['missing-key'] }, choices: [] });
    const open = scene({ id: asEvent('open-follow-up'), type: 'journey', choices: [] });
    const source = scene({ id: asEvent('optional-source'), type: 'journey', followUps: [locked.id, open.id], choices: [directChoice()] });
    const anchor = scene({ id: asEvent('optional-anchor'), type: 'main', anchorOrder: 2, choices: [] });
    const index = content([source, locked, open, anchor]);

    const resolved = resolveSource(atSource(index, source.id), index);
    const selected = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(open.id);
    expect(queue(selected.state)).toEqual([]);
  });

  it('reports and removes an invalid required target before falling back to the next anchor', () => {
    const missing = asEvent('missing-required-aftermath');
    const source = scene({ id: asEvent('invalid-source'), type: 'journey', choices: [directChoice(missing)] });
    const distraction = scene({ id: asEvent('procedural-distraction'), type: 'journey', choices: [] });
    const anchor = scene({ id: asEvent('recovery-anchor'), type: 'main', slot: 3, anchorOrder: 3, choices: [] });
    const index = content([source, distraction, anchor]);

    const resolved = resolveSource(atSource(index, source.id), index);
    const selected = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(anchor.id);
    expect(queue(selected.state)).toEqual([]);
    expect(selected.events.map((event) => event.domain)).toContainEqual(expect.objectContaining({
      type: 'notification', message: expect.stringMatching(/missing-required-aftermath.*invalid-source/i),
    }));
  });

  it('keeps optional authored entries queued while an invalid required target recovers through a callback', () => {
    const missing = asEvent('missing-before-optional');
    const optional = scene({ id: asEvent('waiting-optional'), type: 'journey', choices: [] });
    const callback = scene({ id: asEvent('required-callback'), type: 'journey', choices: [] });
    const anchor = scene({ id: asEvent('callback-fallback-anchor'), type: 'main', anchorOrder: 2, choices: [] });
    const source = scene({
      id: asEvent('invalid-then-optional-source'), type: 'journey', followUps: [optional.id],
      choices: [directChoice(missing)],
    });
    const index = content([source, optional, callback, anchor]);
    const resolved = resolveSource(atSource(index, source.id), index).state;
    const withCallback: GameStateV2 = {
      ...resolved,
      expedition: {
        ...resolved.expedition!,
        director: {
          ...resolved.expedition!.director,
          pendingCallbacks: [{
            targetEventId: callback.id,
            deadline: { chapterId: 'ch01', slot: 2 },
            status: 'pending',
            required: true,
          }],
        },
      },
    };

    const selected = reduceGame(withCallback, { type: 'select-next-scene', updatedAt: at(3) }, index);

    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(callback.id);
    expect(queue(selected.state).map((entry) => entry.sceneId)).toEqual([optional.id]);
    expect(selected.state.expedition?.director.pendingCallbacks[0]?.status).toBe('fulfilled');
  });

  it('selects the first due required entry past a future required queue head', () => {
    const slotFive = scene({ id: asEvent('required-at-slot-five'), slot: 5, type: 'journey', choices: [] });
    const slotFour = scene({ id: asEvent('required-at-slot-four'), slot: 4, type: 'journey', choices: [] });
    const index = content([slotFive, slotFour]);
    const created = createCampaign({ heroClass: 'warrior', seed: 17, updatedAt: at(0) }, index);
    const started = reduceGame(created, { type: 'start-expedition', updatedAt: at(1) }, index).state;
    const queued: GameStateV2 = {
      ...started,
      expedition: {
        ...started.expedition!,
        position: { chapterId: 'ch01', slot: 4 },
        authoredSceneQueue: [
          { sceneId: slotFive.id, sourceSceneId: asEvent('earlier-source'), requirementMode: 'required' },
          { sceneId: slotFour.id, sourceSceneId: asEvent('later-source'), requirementMode: 'required' },
        ],
      },
    };

    const selected = reduceGame(queued, { type: 'select-next-scene', updatedAt: at(2) }, index);

    expect(selected.diagnostic).toBeUndefined();
    expect(currentSceneId(selected.state)).toBe(slotFour.id);
    expect(queue(selected.state).map((entry) => entry.sceneId)).toEqual([slotFive.id]);
  });

  it('preserves a queued aftermath through combat victory and reward claim', () => {
    const source = scene({
      id: asEvent('combat-source'), type: 'combat', encounterId: asEncounter('queue-fight'),
      choices: [directChoice(asEvent('combat-aftermath'))],
    });
    const aftermath = scene({ id: asEvent('combat-aftermath'), type: 'journey', choices: [] });
    const anchor = scene({ id: asEvent('combat-anchor'), type: 'main', anchorOrder: 2, choices: [] });
    const index = content([source, aftermath, anchor], true);

    const resolved = resolveSource(atSource(index, source.id), index);
    expect(resolved.state.flow.screen).toBe('combat');
    expect(queue(resolved.state).map((entry) => entry.sceneId)).toEqual([aftermath.id]);

    let won = resolved.state;
    for (let turn = 0; turn < 5 && won.flow.screen === 'combat'; turn += 1) {
      won = reduceGame(won, { type: 'combat-turn', commandId: `queue-win:${turn}`, action: { type: 'attack' }, updatedAt: at(3 + turn) }, index).state;
      expect(queue(won).map((entry) => entry.sceneId)).toEqual([aftermath.id]);
    }
    expect(won.flow.screen).toBe('reward');
    const rewardId = won.expedition?.pendingReward?.rewardId;
    if (!rewardId) throw new Error('Expected the combat reward fixture.');

    const claimed = reduceGame(won, { type: 'claim-rewards', rewardId, itemId: null, updatedAt: at(8) }, index);
    const next = reduceGame(claimed.state, { type: 'select-next-scene', updatedAt: at(9) }, index);

    expect(claimed.diagnostic).toBeUndefined();
    expect(queue(claimed.state).map((entry) => entry.sceneId)).toEqual([aftermath.id]);
    expect(currentSceneId(next.state)).toBe(aftermath.id);
  });

  it('does not emit a no-eligible diagnostic across a connected Chapter 1 route fixture', () => {
    const followUp = scene({ id: asEvent('route-follow-up'), type: 'journey', choices: [] });
    const source = scene({ id: asEvent('route-source'), type: 'main', anchorOrder: 1, followUps: [followUp.id], choices: [directChoice()] });
    const finale = scene({ id: asEvent('route-finale'), type: 'main', slot: 3, anchorOrder: 3, choices: [] });
    const index = content([source, followUp, finale]);
    const diagnostics: string[] = [];

    const resolved = resolveSource(atSource(index, source.id), index);
    let state = resolved.state;
    for (let minute = 3; minute <= 5 && state.expedition; minute += 1) {
      const transition = reduceGame(state, { type: 'select-next-scene', updatedAt: at(minute) }, index);
      if (transition.diagnostic) diagnostics.push(transition.diagnostic.message);
      state = transition.state;
    }

    expect(diagnostics.join('\n')).not.toMatch(/No eligible Chronicle scene/i);
    expect(state.campaign.chapterId).toBe('ch02');
  });

  it('round-trips the authored queue through the current save codec', () => {
    const source = scene({ id: asEvent('saved-source'), type: 'journey', choices: [directChoice(asEvent('saved-aftermath'))] });
    const aftermath = scene({ id: asEvent('saved-aftermath'), type: 'journey', choices: [] });
    const index = content([source, aftermath]);
    const resolved = resolveSource(atSource(index, source.id), index).state;

    const encoded = encodeSaveState(resolved, index);
    const decoded = encoded ? decodeSaveState(encoded, index) : null;

    expect(encoded?.expedition?.authoredSceneQueue).toEqual(queue(resolved));
    expect(queue(decoded!)).toEqual(queue(resolved));
  });
});
