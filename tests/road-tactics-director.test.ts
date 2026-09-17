import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { EventId } from '../src/game/domain/ids';
import { selectNextScene, type DirectorState, type JourneyDirectorContext } from '../src/game/director';
import { CHRONICLE1_CONTENT, CHRONICLE1_SCENES } from '../src/game/content/chronicle1';

const asEventId = (value: string) => value as EventId;

function event(id: string, overrides: Partial<ChronicleEvent> = {}): ChronicleEvent {
  return {
    id: asEventId(id), chapterId: 'ch01', type: 'journey', family: id, illustrationId: 'fixture-art',
    title: id, narrative: ['A fixture scene.'], eligibility: {}, cooldownRuns: 0, oneShot: true, choices: [],
    ...overrides,
  };
}

function content(events: readonly ChronicleEvent[]): ContentIndex {
  return { events: new Map(events.map((scene) => [scene.id, scene])), items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(), artIds: new Set(['fixture-art']), audioIds: new Set() };
}

const director: DirectorState = {
  rngState: 1, usedSceneIds: [], recentSceneKinds: [], recentFamilies: [], seenEventIds: [],
  familyCooldowns: {}, currentRunBlockedFamilies: [], pendingCallbacks: [], tension: 2, threat: 0,
};

const context: JourneyDirectorContext = {
  position: { chapterId: 'ch01', slot: 1 }, level: 1, flags: [], inventoryTags: [], routeProfile: 'old-forest',
};

describe('Road Tactics director bias', () => {
  it('scout prefers an investigation candidate over a danger candidate when both are valid', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('danger', { type: 'combat', weight: 1 }),
      event('investigation', { journeySubtype: 'investigation', weight: 1 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.event.journeySubtype).toBe('investigation');
  });

  it('press-on never bypasses a required callback', () => {
    const selected = selectNextScene({
      ...director,
      pendingCallbacks: [{ targetEventId: asEventId('callback'), deadline: { chapterId: 'ch01', slot: 1 }, status: 'pending', required: true }],
    }, { ...context, roadBias: 'press-on' }, content([
      event('callback'),
      event('danger', { type: 'combat', weight: 100 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.reason).toBe('callback');
  });

  it('keeps paced merchant support ahead of forced threat combat without a road bias', () => {
    const selected = selectNextScene({ ...director, threat: 6, recentSceneKinds: ['danger', 'danger', 'danger'] }, context, content([
      event('merchant', { type: 'hub', pacing: 'merchant', weight: 1_000 }),
      event('combat', { type: 'combat', pacing: 'danger', weight: 1 }),
    ]), []);

    expect(selected.kind).toBe('selected');
    expect(selected.kind === 'selected' && selected.sceneId).toBe('merchant');
    expect(selected.kind === 'selected' && selected.reason).toBe('paced');
  });

  it('does not let road bias bypass a chapter anchor', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('anchor', { type: 'main', anchorOrder: 1 }),
      event('investigation', { journeySubtype: 'investigation', weight: 1_000 }),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('anchor');
    expect(selected.kind === 'selected' && selected.reason).toBe('anchor');
  });

  it('does not let road bias select an ineligible favored investigation', () => {
    const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content([
      event('locked-investigation', { journeySubtype: 'investigation', weight: 1_000, eligibility: { requiredFlags: ['proof'] } }),
      event('available-road'),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('available-road');
  });

  it('does not let press-on exceed the combat streak cap', () => {
    const usedCombatIds = [asEventId('combat-one'), asEventId('combat-two'), asEventId('combat-three')];
    const selected = selectNextScene({ ...director, usedSceneIds: usedCombatIds }, { ...context, roadBias: 'press-on' }, content([
      event('combat-one', { type: 'combat' }),
      event('combat-two', { type: 'combat' }),
      event('combat-three', { type: 'combat' }),
      event('next-combat', { type: 'combat', weight: 1_000 }),
      event('safe-road'),
    ]), []);

    expect(selected.kind === 'selected' && selected.sceneId).toBe('safe-road');
  });
});

describe('Road affinity against the live ContentIndex', () => {
  const atCinder: JourneyDirectorContext = {
    position: { chapterId: 'ch05', slot: 15 }, level: 8, flags: [], inventoryTags: [], routeProfile: 'old-forest',
  };
  const cinderState: DirectorState = {
    ...director,
    usedSceneIds: CHRONICLE1_SCENES.filter((scene) => scene.chapterId === 'ch05' && scene.slot < 15).map((scene) => scene.id),
    recentSceneKinds: ['danger', 'danger', 'danger'],
  };

  it('selects different real road scenes for scouting and camping without jumping the timeline', () => {
    const scout = selectNextScene(cinderState, { ...atCinder, roadBias: 'scout' }, CHRONICLE1_CONTENT);
    const camp = selectNextScene(cinderState, { ...atCinder, roadBias: 'make-camp' }, CHRONICLE1_CONTENT);
    expect(scout).toMatchObject({ kind: 'selected', sceneId: 'ch05-road-embervault-cinder-drill', selectedAt: atCinder.position });
    expect(camp).toMatchObject({ kind: 'selected', sceneId: 'ch05-road-embervault-ash-priestess', selectedAt: atCinder.position });
    expect(selectNextScene(cinderState, { ...atCinder, roadBias: 'make-camp' }, CHRONICLE1_CONTENT)).toEqual(camp);
    expect(selectNextScene(cinderState, atCinder, CHRONICLE1_CONTENT))
      .toMatchObject({ kind: 'selected', sceneId: 'ch05-road-embervault-cinder-drill' });
    if (camp.kind !== 'selected') return;
    const next = selectNextScene(camp.state, { ...atCinder, position: { chapterId: 'ch05', slot: 16 }, roadBias: 'make-camp' }, CHRONICLE1_CONTENT);
    expect(next.kind === 'selected' && next.sceneId).not.toBe(camp.sceneId);
  });

  it.each(CHRONICLE1_SCENES.filter((scene) => /^ch\d{2}-road-/.test(scene.id)))
   ('can bring $id forward with its matching action while preserving eligibility', (road) => {
      const position = { chapterId: road.chapterId, slot: road.slot - 1 };
      const usedSceneIds = CHRONICLE1_SCENES.filter((scene) => scene.chapterId === road.chapterId
        && (scene.slot < position.slot || (scene.type === 'main' && scene.slot === position.slot))).map((scene) => scene.id);
      const roadContext: JourneyDirectorContext = {
        position, level: road.eligibility.minLevel!, flags: [], inventoryTags: [],
        routeProfile: road.eligibility.routes![0]!, roadBias: road.roadAffinities?.[0] ?? 'scout',
      };
      let deliveredEarly = false;
      for (let seed = 1; seed <= 64 && !deliveredEarly; seed += 1) {
        const result = selectNextScene({ ...director, rngState: seed, usedSceneIds, recentSceneKinds: ['danger', 'danger', 'danger'] }, roadContext, CHRONICLE1_CONTENT);
        deliveredEarly = result.kind === 'selected' && result.sceneId === road.id && result.selectedAt.slot === position.slot;
      }
      expect(deliveredEarly, road.id).toBe(true);
    });
});

describe('Road affinity candidate-window boundaries', () => {
  const road = event('future-road', { slot: 3, roadAffinities: ['scout'], weight: 1_000 });
  const local = event('local', { slot: 2, weight: 1 });
  const here = { ...context, position: { chapterId: 'ch01', slot: 2 }, roadBias: 'scout' } as const;

  it.each([undefined, 'press-on'] as const)('keeps the ordinary slot window for bias %s without a matching affinity', (roadBias) => {
    expect(selectNextScene(director, { ...here, roadBias }, content([local, road])))
      .toMatchObject({ kind: 'selected', sceneId: local.id, selectedAt: here.position });
  });

  it.each(['anchor', 'callback'] as const)('keeps a due %s ahead of a matching future road', (precedence) => {
    const marker = event('required', { slot: 2, ...(precedence === 'anchor' ? { type: 'main' as const, anchorOrder: 1 } : {}) });
    const state = { ...director, pendingCallbacks: precedence === 'callback'
      ? [{ targetEventId: marker.id, deadline: here.position, status: 'pending' as const, required: true }] : [] };
    expect(selectNextScene(state, here, content([local, marker, road])))
      .toMatchObject({ kind: 'selected', sceneId: marker.id, reason: precedence });
  });

  it('keeps a required authored continuation ahead of a matching future road', () => {
    const selected = selectNextScene(director, here, content([local, road]), [
      { sceneId: local.id, sourceSceneId: asEventId('source'), requirementMode: 'required' },
    ]);
    expect(selected).toMatchObject({ kind: 'selected', sceneId: local.id, reason: 'authored' });
  });

  it.each(['anchor', 'callback', 'authored'] as const)('does not reach beyond a future required %s', (boundary) => {
    const marker = event('required', { slot: 3, ...(boundary === 'anchor' ? { type: 'main' as const, anchorOrder: 1 } : {}) });
    const state = { ...director, pendingCallbacks: boundary === 'callback'
      ? [{ targetEventId: marker.id, deadline: { chapterId: 'ch01' as const, slot: 3 }, status: 'pending' as const, required: true }] : [] };
    const queue = boundary === 'authored' ? [{ sceneId: marker.id, sourceSceneId: local.id, requirementMode: 'required' as const }] : [];
    expect(selectNextScene(state, here, content([local, marker, { ...road, slot: 4 }]), queue))
      .toMatchObject({ kind: 'selected', sceneId: local.id });
  });

  it('keeps threat-forced combat ahead of a matching future road', () => {
    const combat = event('combat', { type: 'combat', slot: 2 });
    expect(selectNextScene({ ...director, threat: 6 }, here, content([combat, road])))
      .toMatchObject({ kind: 'selected', sceneId: combat.id, reason: 'threat' });
  });

  it('keeps the combat streak cap when a future road enters the candidate pool', () => {
    const previous = ['combat-one', 'combat-two', 'combat-three'].map((id) => event(id, { type: 'combat', slot: 1 }));
    const combat = event('next-combat', { type: 'combat', slot: 2, weight: 1_000 });
    expect(selectNextScene({ ...director, threat: 6, usedSceneIds: previous.map((scene) => scene.id) }, here, content([...previous, combat, road])))
      .toMatchObject({ kind: 'selected', sceneId: road.id, reason: 'paced', selectedAt: here.position });
  });

  it.each(['used', 'seen', 'route', 'level', 'flag', 'exclusion', 'family', 'choice'] as const)
    ('still excludes a future road gated by %s', (gate) => {
      const state = { ...director,
        usedSceneIds: gate === 'used' ? [road.id] : [], seenEventIds: gate === 'seen' ? [road.id] : [],
        currentRunBlockedFamilies: gate === 'family' ? [road.family] : [],
      };
      const gated = { ...road,
        eligibility: gate === 'route' ? { routes: ['kings-road'] as const }
          : gate === 'level' ? { minLevel: 9 }
          : gate === 'flag' ? { requiredFlags: ['proof'] } : {},
        exclusions: gate === 'exclusion' ? [{ type: 'flag' as const, flagId: 'closed', present: true }] : [],
        choices: gate === 'choice' ? [{ id: 'pay' as never, label: 'Pay', detail: 'Pay a toll.', outcome: 'Paid.', effects: [], requirements: [{ type: 'gold' as const, scope: 'unbanked' as const, amount: 10 }] }] : [],
      };
      expect(selectNextScene(state, { ...here, flags: ['closed'] }, content([local, gated])))
        .toMatchObject({ kind: 'selected', sceneId: local.id });
    });
});
