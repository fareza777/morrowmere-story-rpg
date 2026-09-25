import { describe, expect, it } from 'vitest';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import type { GameStateV2 } from '../src/game/state/types';
import { makeContentIndex } from './fixtures/game';
import type { EventId } from '../src/game/domain/ids';
import { encodeSaveState, decodeSaveState } from '../src/game/persistence/codec';
import { validateContent } from '../src/game/content/validate';

const updatedAt = '2026-09-17T08:00:00.000Z';

function roadContent() {
  const content = makeContentIndex();
  const event = content.events.get('fixture-event' as never)!;
  (content.events as Map<never, typeof event>).set(event.id, {
    ...event,
    type: 'journey',
    weight: 10,
    pacing: 'quiet',
    threatChange: 0,
    tensionChange: 0,
  });
  return content;
}

function campState(content = roadContent()) {
  return createCampaign({ heroClass: 'warden', seed: 7, updatedAt }, content);
}

function routeState(overrides: Partial<GameStateV2> = {}) {
  const content = roadContent();
  const started = reduceGame(campState(content), {
    type: 'start-expedition',
    routeProfile: 'kings-road',
    updatedAt,
  }, content).state;
  return {
    content,
    state: {
      ...started,
      ...overrides,
      expedition: {
        ...started.expedition!,
        ...overrides.expedition,
      },
    },
  };
}

describe('Road Tactics reducer', () => {
  it('continues a later leg without reapplying the opening road tactic', () => {
    const { content, state } = routeState();
    const continued: GameStateV2 = { ...state, expedition: {
      ...state.expedition!, lastTravelAction: 'scout', sceneVisitCounts: { 'fixture-event': 1 },
      director: { ...state.expedition!.director, threat: 4, tension: 3 },
    } };
    const next = reduceGame(continued, { type: 'continue-journey', updatedAt }, content);
    expect(next.diagnostic).toBeUndefined();
    expect(next.state.flow.screen).toBe('story');
    expect(next.state.expedition?.director.threat).toBe(4);
    expect(next.state.expedition?.director.tension).toBe(3);
    expect(next.state.expedition?.lastTravelAction).toBe('scout');
    expect(next.events.some(({ domain }) => domain.type === 'travel_action_taken')).toBe(false);
  });

  it('clears a junction with zero eligible options before direct continuation', () => {
    const { content, state } = routeState();
    (content.routeJunctions as Map<string, unknown>).set('closed-fork', {
      id: 'closed-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 2 },
      afterEventId: 'fixture-event', options: [
        { id: 'sealed', label: 'Sealed path', detail: '', consequence: '', kind: 'story', requiredFlags: ['unavailable-key'], destination: { kind: 'scene', sceneId: 'fixture-event' } },
      ],
    });
    const pending: GameStateV2 = { ...state, expedition: {
      ...state.expedition!, pendingRouteJunctionId: 'closed-fork', lastTravelAction: 'scout', sceneVisitCounts: { 'fixture-event': 1 },
    } };
    const next = reduceGame(pending, { type: 'continue-journey', updatedAt }, content);
    expect(next.diagnostic).toBeUndefined();
    expect(next.state.flow.screen).toBe('story');
    expect(next.state.expedition?.pendingRouteJunctionId).toBeNull();
    expect(next.state.campaign.flags).toContain('route:junction:closed-fork:resolved');
  });

  it('leaves a one-option chapter junction pending until the player confirms it', () => {
    const { content, state } = routeState();
    const base = content.events.get('fixture-event' as EventId)!;
    (content.routeJunctions as Map<string, unknown>).set('single-fork', {
      id: 'single-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 1 }, afterEventId: base.id,
      options: [{ id: 'take-pass', label: 'Take the pass', detail: 'Climb the exposed ridge.', consequence: 'Gain 8 unbanked gold.', kind: 'story', destination: { kind: 'scene', sceneId: base.id }, effects: [{ type: 'gold', scope: 'unbanked', amount: 8 }] }],
    });
    const resolved: GameStateV2 = { ...state, expedition: {
      ...state.expedition!, currentSceneId: base.id, sceneResolution: { eventId: base.id, choiceId: null, resultKind: 'direct', chance: null, roll: null, outcome: 'The road divides.', effectSummary: [], nextSceneId: null, continueLabel: null },
      sceneVisitCounts: { [base.id]: 1 }, director: { ...state.expedition!.director, seenEventIds: [base.id] },
    }, flow: { ...state.flow, screen: 'story' } };
    const junction = reduceGame(resolved, { type: 'select-next-scene', updatedAt }, content);
    expect(junction.diagnostic).toBeUndefined();
    expect(junction.state.flow.screen).toBe('travel');
    expect(junction.state.expedition?.pendingRouteJunctionId).toBe('single-fork');
    expect(junction.state.expedition?.unbankedGold).toBe(state.expedition?.unbankedGold);

    const chosen = reduceGame(junction.state, { type: 'select-route', junctionId: 'single-fork', optionId: 'take-pass', updatedAt }, content);
    expect(chosen.diagnostic).toBeUndefined();
    expect(chosen.state.expedition?.unbankedGold).toBe((state.expedition?.unbankedGold ?? 0) + 8);
  });

  it('offers emergency retreat only at a resolved dead-end and settles half gold while retaining loose loot', () => {
    const content = roadContent();
    const roomId = 'sealed-room' as EventId;
    const base = content.events.get('fixture-event' as EventId)!;
    (content.events as Map<EventId, typeof base>).set(roomId, { ...base, id: roomId, family: 'sealed-room', choices: [] });
    (content.dungeons as Map<string, unknown>).set('sealed-run', { id: 'sealed-run', chapterId: 'ch01', startNodeId: 'sealed-room', exitNodeIds: ['escape', 'already-visited'], nodes: [
      { id: 'sealed-room', kind: 'scene', sceneId: roomId, exits: [
        { id: 'locked-escape', targetNodeId: 'escape', label: 'Open the gate', detail: 'Requires the iron seal.', requiredFlags: ['iron-seal'] },
        { id: 'loop-back', targetNodeId: 'already-visited', label: 'Backtrack', detail: 'A passage already explored.' },
      ] },
      { id: 'escape', kind: 'exit', exitKind: 'retreat', sceneId: roomId, exits: [] },
      { id: 'already-visited', kind: 'hazard', exits: [] },
    ] });
    const { state: started } = routeState();
    const deadEnd: GameStateV2 = { ...started, expedition: {
      ...started.expedition!, dungeonRun: { dungeonId: 'sealed-run', seed: 8, currentNodeId: 'sealed-room', depth: 1, visitedNodeIds: ['sealed-room', 'already-visited'], resolvedNodeIds: [] },
      currentSceneId: roomId, sceneResolution: { eventId: roomId, choiceId: null, resultKind: 'direct', chance: null, roll: null, outcome: 'The gate has no handle.', effectSummary: [], nextSceneId: null, continueLabel: null },
      unbankedGold: 9, unbankedLoot: ['potion-red' as never],
    }, flow: { ...started.flow, screen: 'story' } };

    const reached = reduceGame(deadEnd, { type: 'select-next-scene', updatedAt }, content);
    expect(reached.diagnostic).toBeUndefined();
    expect(reached.state.flow.screen).toBe('travel');
    expect(reached.state.expedition?.dungeonRun?.resolvedNodeIds).toContain('sealed-room');

    const unresolved = reduceGame({ ...reached.state, expedition: { ...reached.state.expedition!, dungeonRun: { ...reached.state.expedition!.dungeonRun!, resolvedNodeIds: [] } } }, { type: 'emergency-retreat-dungeon', updatedAt }, content);
    expect(unresolved.diagnostic?.code).toBe('retreat_unavailable');
    const flagOpened = reduceGame({ ...reached.state, campaign: { ...reached.state.campaign, flags: [...reached.state.campaign.flags, 'iron-seal'] }, expedition: { ...reached.state.expedition!, dungeonRun: { ...reached.state.expedition!.dungeonRun!, visitedNodeIds: ['sealed-room'] } } }, { type: 'emergency-retreat-dungeon', updatedAt }, content);
    expect(flagOpened.diagnostic?.code).toBe('retreat_unavailable');
    expect(flagOpened.state.expedition?.dungeonRun).not.toBeNull();

    const retreated = reduceGame(reached.state, { type: 'emergency-retreat-dungeon', updatedAt }, content);
    expect(retreated.diagnostic).toBeUndefined();
    expect(retreated.state.flow.screen).toBe('travel');
    expect(retreated.state.expedition?.dungeonRun).toBeNull();
    expect(retreated.state.campaign.bankedGold - reached.state.campaign.bankedGold).toBe(4);
    expect(retreated.state.expedition?.unbankedGold).toBe(0);
    expect(retreated.state.expedition?.unbankedLoot).toEqual(['potion-red']);
    expect(retreated.events.some(({ domain }) => domain.type === 'notification' && domain.message.includes('Retreat secured 4 of 9'))).toBe(true);
  });

  it('keeps an authored choice and aftermath continuous until its junction', () => {
    const content = roadContent();
    const base = content.events.get('fixture-event' as EventId)!;
    const aftermathId = 'fixture-aftermath' as EventId;
    (content.events as Map<EventId, typeof base>).set(base.id, { ...base, type: 'main', choices: [{ id: 'take-path' as never, label: 'Take the path', detail: '', outcome: 'The path opens.', effects: [{ type: 'flag', flagId: 'path-open', operation: 'add' }], nextSceneId: aftermathId }] });
    (content.events as Map<EventId, typeof base>).set(aftermathId, { ...base, id: aftermathId, family: 'aftermath', eligibility: { requiredFlags: ['path-open'] }, choices: [] });
    (content.routeJunctions as Map<string, unknown>).set('fork', { id: 'fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 1 }, afterEventId: base.id, options: [
      { id: 'left', label: 'Left', detail: '', consequence: '', kind: 'story', destination: { kind: 'scene', sceneId: aftermathId }, effects: [{ type: 'gold', scope: 'unbanked', amount: 3 }] },
      { id: 'right', label: 'Right', detail: '', consequence: '', kind: 'story', destination: { kind: 'scene', sceneId: aftermathId } },
    ] });
    const start = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const scene: GameStateV2 = { ...start, expedition: { ...start.expedition!, currentSceneId: base.id, sceneVisitCounts: { [base.id]: 1 }, director: { ...start.expedition!.director, usedSceneIds: [base.id], seenEventIds: [base.id] } }, flow: { ...start.flow, screen: 'story' } };
    const choice = reduceGame(scene, { type: 'resolve-choice', eventId: base.id, choiceId: 'take-path' as never, updatedAt }, content).state;
    expect(choice.flow.screen).toBe('story');
    expect(choice.expedition?.sceneResolution?.outcome).toBe('The path opens.');
    const next = reduceGame(choice, { type: 'select-next-scene', updatedAt }, content).state;
    expect(next.flow.screen).toBe('story');
    expect(next.expedition?.currentSceneId).toBe(aftermathId);
    expect(next.expedition?.pendingRouteJunctionId).toBeNull();
    const junction = reduceGame(next, { type: 'select-next-scene', updatedAt }, content).state;
    expect(junction.flow.screen).toBe('travel');
    expect(junction.expedition?.pendingRouteJunctionId).toBe('fork');
    const selected = reduceGame(junction, { type: 'select-route', junctionId: 'fork', optionId: 'left', updatedAt }, content);
    expect(selected.diagnostic).toBeUndefined();
    expect(selected.state.expedition?.unbankedGold - junction.expedition!.unbankedGold).toBe(3);
    const stale = reduceGame(selected.state, { type: 'select-route', junctionId: 'fork', optionId: 'left', updatedAt }, content);
    expect(stale.state).toBe(selected.state);
    expect(stale.diagnostic?.code).toBe('route_required');
    const repeated = reduceGame(selected.state, { type: 'select-next-scene', updatedAt }, content);
    expect(repeated.state.expedition?.pendingRouteJunctionId).toBeNull();
  });

  it('shows the anchored route before independent future-slot continuations', () => {
    const content = roadContent();
    const base = content.events.get('fixture-event' as EventId)!;
    const blocked = 'fixture-locked-follow-up' as EventId;
    const later = 'fixture-later-follow-up' as EventId;
    (content.events as Map<EventId, typeof base>).set(base.id, { ...base, type: 'journey', slot: 1 });
    (content.events as Map<EventId, typeof base>).set(blocked, {
      ...base, id: blocked, type: 'journey', slot: 3, family: 'blocked-follow-up',
      eligibility: { requiredFlags: ['future-key'] }, choices: [], followUps: [],
    });
    (content.events as Map<EventId, typeof base>).set(later, {
      ...base, id: later, type: 'journey', slot: 5, family: 'later-follow-up',
      eligibility: {}, choices: [], followUps: [],
    });
    (content.routeJunctions as Map<string, unknown>).set('deferred-fork', {
      id: 'deferred-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 1 }, afterEventId: base.id,
      options: [
        { id: 'take-follow-up', label: 'Follow the lead', detail: '', consequence: '', kind: 'story', destination: { kind: 'scene', sceneId: later } },
        { id: 'leave-follow-up', label: 'Leave the road', detail: '', consequence: '', kind: 'story', destination: { kind: 'scene', sceneId: blocked } },
      ],
    });
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const resolved: GameStateV2 = {
      ...started,
      expedition: {
        ...started.expedition!,
        position: { chapterId: 'ch01', slot: 1 },
        currentSceneId: base.id,
        sceneResolution: { eventId: base.id, choiceId: null, resultKind: 'direct', chance: null, roll: null, outcome: 'The lead remains unresolved.', effectSummary: [], nextSceneId: null, continueLabel: null },
        authoredSceneQueue: [
          { sceneId: blocked, sourceSceneId: base.id, requirementMode: 'required' },
          { sceneId: later, sourceSceneId: base.id, requirementMode: 'optional' },
        ],
        director: { ...started.expedition!.director, usedSceneIds: [base.id], seenEventIds: [base.id] },
      },
      flow: { ...started.flow, screen: 'story' },
    };

    const result = reduceGame(resolved, { type: 'select-next-scene', updatedAt }, content);

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.flow.screen).toBe('travel');
    expect(result.state.expedition?.pendingRouteJunctionId).toBe('deferred-fork');
    expect(result.state.expedition?.authoredSceneQueue.map((entry) => entry.sceneId)).toContain(later);
  });

  it('rejects a forged route option without changing state', () => {
    const { content, state } = routeState();
    const result = reduceGame(state, { type: 'select-route', junctionId: 'fork', optionId: 'forged', updatedAt }, content);
    expect(result.state).toBe(state);
    expect(result.diagnostic).toBeDefined();
  });

  it('claims a dungeon victory once and resumes its terminal scene after saving', () => {
    const content = roadContent();
    const exitId = 'fixture-exit' as EventId;
    const base = content.events.get('fixture-event' as EventId)!;
    (content.events as Map<EventId, typeof base>).set(exitId, { ...base, id: exitId, type: 'journey', family: 'exit', choices: [] });
    (content.encounters as Map<string, unknown>).set('fixture-fight', { id: 'fixture-fight', family: 'fixture', kind: 'regular', enemyIds: [], reward: { xp: 0, gold: 10, itemChoices: [] } });
    (content.dungeons as Map<string, unknown>).set('fixture-dungeon', { id: 'fixture-dungeon', chapterId: 'ch01', startNodeId: 'fight', exitNodeIds: ['leave'], nodes: [
      { id: 'fight', kind: 'combat', encounterId: 'fixture-fight', exits: [{ id: 'leave-now', targetNodeId: 'leave', label: 'Leave', detail: 'Bank the surviving rewards.' }] },
      { id: 'leave', kind: 'exit', exitKind: 'extract', sceneId: exitId, exits: [] },
    ] });
    expect(validateContent(content)).toEqual([]);
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const reward: GameStateV2 = { ...started, expedition: { ...started.expedition!, dungeonRun: { dungeonId: 'fixture-dungeon', seed: 7, currentNodeId: 'fight', depth: 1, visitedNodeIds: ['fight'], resolvedNodeIds: [] }, currentCombat: null, pendingReward: { rewardId: 'fixture-reward', rewardOfferId: 'fixture-offer', encounterId: 'fixture-fight' as never, itemChoices: [], baseGold: 10, grantedXp: 0, adEligible: false, rewardedGoldSettlement: 'ineligible' }, unbankedGold: 10 }, flow: { ...started.flow, screen: 'reward' } };
    const claimed = reduceGame(reward, { type: 'claim-rewards', rewardId: 'fixture-reward', itemId: null, updatedAt }, content);
    expect(claimed.diagnostic).toBeUndefined();
    expect(claimed.state.flow.screen).toBe('story');
    expect(claimed.state.expedition?.dungeonRun?.currentNodeId).toBe('leave');
    expect(claimed.state.expedition?.dungeonRun?.resolvedNodeIds).toEqual(['fight']);
    const again = reduceGame(claimed.state, { type: 'claim-rewards', rewardId: 'fixture-reward', itemId: null, updatedAt }, content);
    expect(again.state).toBe(claimed.state);
    expect(again.diagnostic?.code).toBe('reward_required');
    const saved = encodeSaveState(claimed.state, content);
    expect(saved).not.toBeNull();
    const resumed = decodeSaveState(saved!, content);
    expect(resumed?.expedition?.currentSceneId).toBe(exitId);
    expect(resumed?.expedition?.sceneResolution?.outcome).toBe(base.narrative.at(-1));
    const exited = reduceGame(resumed!, { type: 'select-next-scene', updatedAt }, content);
    expect(exited.state.expedition?.dungeonRun).toBeNull();
    expect(exited.state.campaign.bankedGold - claimed.state.campaign.bankedGold).toBe(10);
    expect(exited.state.expedition?.unbankedGold).toBe(0);
    expect(exited.state.checkpoints.camp?.campaign.bankedGold).toBe(exited.state.campaign.bankedGold);
  });

  it('auto-resolves a single passage and secures half the unbanked gold on retreat', () => {
    const content = roadContent();
    const base = content.events.get('fixture-event' as EventId)!;
    const retreatSceneId = 'retreat-scene' as EventId;
    (content.events as Map<EventId, typeof base>).set(retreatSceneId, { ...base, id: retreatSceneId, family: 'retreat', narrative: ['You carry half the loose gold home.'], choices: [] });
    (content.dungeons as Map<string, unknown>).set('short-run', { id: 'short-run', chapterId: 'ch01', startNodeId: 'cache', exitNodeIds: ['retreat'], nodes: [
      { id: 'cache', kind: 'cache', exits: [{ id: 'back', targetNodeId: 'retreat', label: 'Retreat', detail: 'Secure half the unbanked gold.' }] },
      { id: 'retreat', kind: 'exit', exitKind: 'retreat', sceneId: retreatSceneId, exits: [] },
    ] });
    expect(validateContent(content)).toEqual([]);
    (content.routeJunctions as Map<string, unknown>).set('short-fork', { id: 'short-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 1 }, afterEventId: 'fixture-event', options: [
      { id: 'enter', label: 'Enter', detail: '', consequence: '', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'short-run' }, effects: [{ type: 'gold', scope: 'unbanked', amount: 11 }] },
    ] });
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const pending: GameStateV2 = { ...started, expedition: { ...started.expedition!, pendingRouteJunctionId: 'short-fork' } };
    const selected = reduceGame(pending, { type: 'select-route', junctionId: 'short-fork', optionId: 'enter', updatedAt }, content);
    expect(selected.diagnostic).toBeUndefined();
    expect(selected.state.expedition?.dungeonRun?.currentNodeId).toBe('retreat');
    expect(selected.state.expedition?.currentSceneId).toBe(retreatSceneId);
    expect(selected.state.expedition?.sceneResolution?.outcome).toBe('You carry half the loose gold home.');
    const saved = encodeSaveState(selected.state, content);
    expect(saved).not.toBeNull();
    const resumed = decodeSaveState(saved!, content);
    expect(resumed?.expedition?.dungeonRun?.currentNodeId).toBe('retreat');
    const exited = reduceGame(resumed!, { type: 'select-next-scene', updatedAt }, content);
    expect(exited.state.expedition?.dungeonRun).toBeNull();
    expect(exited.state.campaign.bankedGold - pending.campaign.bankedGold).toBe(5);
    expect(exited.state.checkpoints.camp?.campaign.bankedGold).toBe(exited.state.campaign.bankedGold);
    expect(exited.state.expedition?.unbankedGold).toBe(0);
    expect(exited.state.flow.screen).toBe('travel');
  });

  it('claims an authored battle reward into its queued aftermath', () => {
    const content = roadContent();
    const base = content.events.get('fixture-event' as EventId)!;
    const after = 'battle-aftermath' as EventId;
    (content.events as Map<EventId, typeof base>).set(after, { ...base, id: after, family: 'aftermath', choices: [] });
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const reward: GameStateV2 = { ...started, expedition: { ...started.expedition!, currentSceneId: base.id, sceneVisitCounts: { [base.id]: 1 }, director: { ...started.expedition!.director, usedSceneIds: [base.id], seenEventIds: [base.id] }, sceneResolution: { eventId: base.id, choiceId: null, resultKind: 'direct', chance: null, roll: null, outcome: 'Won.', effectSummary: [], nextSceneId: null, continueLabel: null }, authoredSceneQueue: [{ sceneId: after, sourceSceneId: base.id, requirementMode: 'required' }], pendingReward: { rewardId: 'battle', rewardOfferId: 'offer', encounterId: 'fight' as never, itemChoices: [], baseGold: 0, grantedXp: 0, adEligible: false, rewardedGoldSettlement: 'ineligible' } }, flow: { ...started.flow, screen: 'reward' } };
    const claimed = reduceGame(reward, { type: 'claim-rewards', rewardId: 'battle', itemId: null, updatedAt }, content);
    expect(claimed.state.flow.screen).toBe('story');
    expect(claimed.state.expedition?.currentSceneId).toBe(after);
  });

  it('persists a dungeon branch and rejects an exit that was not offered', () => {
    const content = roadContent();
    const base = content.events.get('fixture-event' as EventId)!;
    const left = 'left-exit' as EventId;
    const right = 'right-exit' as EventId;
    (content.events as Map<EventId, typeof base>).set(left, { ...base, id: left, family: 'left-exit', choices: [] });
    (content.events as Map<EventId, typeof base>).set(right, { ...base, id: right, family: 'right-exit', choices: [] });
    (content.dungeons as Map<string, unknown>).set('branch-run', { id: 'branch-run', chapterId: 'ch01', startNodeId: 'fork', exitNodeIds: ['left', 'right'], nodes: [
      { id: 'fork', kind: 'scene', sceneId: base.id, exits: [
        { id: 'take-left', targetNodeId: 'left', label: 'Left', detail: 'Take shelter.' },
        { id: 'take-right', targetNodeId: 'right', label: 'Right', detail: 'Press onward.' },
      ] },
      { id: 'left', kind: 'exit', exitKind: 'retreat', sceneId: left, exits: [] },
      { id: 'right', kind: 'exit', exitKind: 'extract', sceneId: right, exits: [] },
    ] });
    expect(validateContent(content)).toEqual([]);
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const atFork: GameStateV2 = { ...started, expedition: { ...started.expedition!, dungeonRun: { dungeonId: 'branch-run', seed: 2, currentNodeId: 'fork', depth: 1, visitedNodeIds: ['fork'], resolvedNodeIds: [] }, currentSceneId: base.id, sceneVisitCounts: { [base.id]: 1 }, director: { ...started.expedition!.director, usedSceneIds: [base.id], seenEventIds: [base.id] }, sceneResolution: { eventId: base.id, choiceId: null, resultKind: 'direct', chance: null, roll: null, outcome: 'A fork.', effectSummary: [], nextSceneId: null, continueLabel: null } }, flow: { ...started.flow, screen: 'story' } };
    const branch = reduceGame(atFork, { type: 'select-next-scene', updatedAt }, content).state;
    expect(branch.flow.screen).toBe('travel');
    expect(branch.expedition?.dungeonRun?.resolvedNodeIds).toEqual(['fork']);
    const saved = encodeSaveState(branch, content);
    expect(saved).not.toBeNull();
    const resumed = decodeSaveState(saved!, content)!;
    const forged = reduceGame(resumed, { type: 'select-route', junctionId: 'fork', optionId: 'forged', updatedAt }, content);
    expect(forged.state).toBe(resumed);
    expect(forged.diagnostic?.code).toBe('invalid_route');
    const chosen = reduceGame(resumed, { type: 'select-route', junctionId: 'fork', optionId: 'take-right', updatedAt }, content);
    expect(chosen.state.expedition?.currentSceneId).toBe(right);
    expect(chosen.state.expedition?.dungeonRun?.currentNodeId).toBe('right');
  });
  it('starts a route in travel before selecting a scene', () => {
    const content = roadContent();
    const started = reduceGame(campState(content), {
      type: 'start-expedition',
      routeProfile: 'kings-road',
      updatedAt,
    }, content);

    expect(started.state.flow.screen).toBe('travel');
    expect(started.state.expedition?.currentSceneId).toBeNull();
  });

  it('scout spends one resource and selects exactly one next scene', () => {
    const { content, state } = routeState();
    const before = state.expedition!.heroVitals.resource;
    const result = reduceGame(state, {
      type: 'travel-action',
      action: 'scout',
      updatedAt,
    }, content);

    expect(result.state.expedition!.heroVitals.resource).toBe(before - 1);
    expect(result.state.flow.screen).toBe('story');
    expect(result.state.expedition!.currentSceneId).not.toBeNull();
    expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
  });

  it.each([
    ['scout', 0, -1, -2, 0],
    ['press-on', 0, 0, 1, 1],
    ['make-camp', 6, 2, 0, 1],
  ] as const)('%s applies its exact bounded road effect', (action, healthDelta, resourceDelta, threatDelta, tensionDelta) => {
    const { content, state } = routeState();
    const before = {
      ...state,
      expedition: {
        ...state.expedition!,
        heroVitals: { health: 20, resource: 3 },
        director: { ...state.expedition!.director, threat: 5, tension: 5 },
      },
    };
    const result = reduceGame(before, { type: 'travel-action', action, updatedAt }, content);

    expect(result.state.expedition!.heroVitals.health - before.expedition!.heroVitals.health).toBe(healthDelta);
    expect(result.state.expedition!.heroVitals.resource - before.expedition!.heroVitals.resource).toBe(resourceDelta);
    expect(result.state.expedition!.director.threat - before.expedition!.director.threat).toBe(threatDelta);
    expect(result.state.expedition!.director.tension - before.expedition!.director.tension).toBe(tensionDelta);
  });

  it('rejects scout at zero resource without changing state', () => {
    const { content, state } = routeState();
    const travel = {
      ...state,
      expedition: {
        ...state.expedition!,
        heroVitals: { health: 30, resource: 0 },
      },
    };
    const result = reduceGame(travel, {
      type: 'travel-action',
      action: 'scout',
      updatedAt,
    }, content);

    expect(result.state).toEqual(travel);
    expect(result.diagnostic?.code).toBe('insufficient_resource');
  });

  it('rejects a failed scene selection atomically without granting repeatable recovery', () => {
    const content = roadContent();
    const event = content.events.get('fixture-event' as never)!;
    (content.events as Map<never, typeof event>).set(event.id, {
      ...event,
      eligibility: { requiredFlags: ['never-unlocked'] },
    });
    const started = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const before = {
      ...started,
      expedition: {
        ...started.expedition!,
        heroVitals: { health: 10, resource: 1 },
      },
    };

    const first = reduceGame(before, { type: 'travel-action', action: 'make-camp', updatedAt }, content);
    const second = reduceGame(first.state, { type: 'travel-action', action: 'make-camp', updatedAt }, content);

    expect(first.diagnostic?.code).toBe('scene_unavailable');
    expect(first.state).toEqual(before);
    expect(second.diagnostic?.code).toBe('scene_unavailable');
    expect(second.state).toEqual(before);
  });

  it('rejects a travel action when a scene is still current', () => {
    const { content, state } = routeState();
    const invalidTravel = {
      ...state,
      expedition: { ...state.expedition!, currentSceneId: 'fixture-event' as never },
    };

    const result = reduceGame(invalidTravel, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state).toEqual(invalidTravel);
    expect(result.diagnostic?.code).toBe('travel_required');
  });

  it('completes the chapter when the director has no remaining scene', () => {
    const { content, state } = routeState();
    const complete = {
      ...state,
      expedition: {
        ...state.expedition!,
        director: {
          ...state.expedition!.director,
          usedSceneIds: ['fixture-event' as never],
          seenEventIds: ['fixture-event' as never],
        },
      },
    };

    const result = reduceGame(complete, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state.expedition).toBeNull();
    expect(result.state.flow.screen).toBe('camp');
    expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
  });

  it('auto-resolves a scene whose dialogue is hidden and keeps its follow-up', () => {
    const content = roadContent();
    const event = content.events.get('fixture-event' as never)!;
    (content.events as Map<never, typeof event>).set(event.id, {
      ...event,
      type: 'journey',
      weight: 10,
      pacing: 'quiet',
      dialogue: [{ speakerName: 'Scout', text: 'This is hidden.', requirements: [{ type: 'flag', flagId: 'missing-flag', present: true }] }],
      followUps: ['follow-up' as never],
    });
    (content.events as Map<never, typeof event>).set('follow-up' as never, {
      ...event,
      id: 'follow-up' as never,
      type: 'journey',
      family: 'follow-up',
      weight: 1,
    });
    const state = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;

    const result = reduceGame(state, { type: 'travel-action', action: 'press-on', updatedAt }, content);

    expect(result.state.expedition?.sceneResolution?.eventId).toBe('fixture-event');
    expect(result.state.expedition?.authoredSceneQueue).toEqual(expect.arrayContaining([
      expect.objectContaining({ sceneId: 'follow-up' }),
    ]));
  });

  it('allows banking a resolved hub after travel clears the current scene', () => {
    const content = roadContent();
    const event = content.events.get('fixture-event' as never)!;
    (content.events as Map<never, typeof event>).set(event.id, { ...event, type: 'hub' });
    const state = reduceGame(campState(content), { type: 'start-expedition', updatedAt }, content).state;
    const travel = {
      ...state,
      expedition: {
        ...state.expedition!,
        sceneResolution: { eventId: 'fixture-event' as never, choiceId: null, resultKind: 'direct' as const, chance: null, roll: null, outcome: 'Safe.', effectSummary: [], nextSceneId: null, continueLabel: null },
      },
    };

    const result = reduceGame(travel, { type: 'bank-camp', updatedAt }, content);

    expect(result.state.flow.screen).toBe('camp');
    expect(result.state.expedition).toBeNull();
  });

  it('returns to travel after battle rewards are claimed', () => {
    const { content, state } = routeState();
    const reward = {
      ...state,
      expedition: {
        ...state.expedition!,
        currentCombat: null,
        pendingReward: { rewardId: 'reward-1', rewardOfferId: 'offer-1', encounterId: 'encounter-1' as never, itemChoices: [], baseGold: 0, grantedXp: 0, adEligible: false, rewardedGoldSettlement: 'ineligible' as const },
      },
      flow: { ...state.flow, screen: 'reward' as const },
    };

    const result = reduceGame(reward, { type: 'claim-rewards', rewardId: 'reward-1', itemId: null, updatedAt }, content);

    expect(result.state.flow.screen).toBe('travel');
    expect(result.state.expedition?.currentSceneId).toBeNull();
  });
});
