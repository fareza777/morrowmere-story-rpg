import { describe, expect, it } from 'vitest';
import type {
  Chronicle1Event,
  ChronicleDefinition,
  ChronicleRouteDefinition,
} from '../../src/game/content/schema';
import { validateChroniclePlayability, validateChronicleSources, validateContent, type ChroniclePlayabilityInput } from '../../src/game/content/validate';
import { countDialogueSentences } from '../../src/game/content/dialogue';
import { makeContentIndex } from '../fixtures/game';
import { CHRONICLE1_CONTENT, CHRONICLE1_DUNGEONS, CHRONICLE1_ROUTE_JUNCTIONS } from '../../src/game/content/chronicle1';
import { availableRouteOptions } from '../../src/game/dungeon/routes';
import { createCampaign } from '../../src/game/state/create';
import { reduceGame } from '../../src/game/state/reducer';
import type { GameStateV2 } from '../../src/game/state/types';

const chronicle: ChronicleDefinition = {
  id: 'fixture-chronicle',
  title: 'Fixture Chronicle',
  chapters: [{
    id: 'ch01', order: 1, title: 'Fixture Chapter', levelBand: { min: 1, max: 2 }, region: 'gloamwood', anchorIds: [] as never,
  }],
};

const routes: readonly ChronicleRouteDefinition[] = [
  { id: 'kings-road', label: 'The King Road', description: 'Wind moves through old stones.', danger: 1, recoveryWeight: 1, merchantWeight: 1, companionWeight: 1, relicWeight: 0 },
  { id: 'old-forest', label: 'The Old Forest', description: 'Moss darkens the trees.', danger: 2, recoveryWeight: 1, merchantWeight: 1, companionWeight: 1, relicWeight: 0 },
  { id: 'ruined-pass', label: 'The Ruined Pass', description: 'Cold air crosses the crags.', danger: 3, recoveryWeight: 1, merchantWeight: 1, companionWeight: 1, relicWeight: 0 },
];

it('connects each early delve to an authored terminal with distinct cadence and no repeated encounters', () => {
  const early = CHRONICLE1_DUNGEONS.filter((dungeon) => ['ch01', 'ch02', 'ch03', 'ch04'].includes(dungeon.chapterId));
  expect(early.map((dungeon) => dungeon.chapterId).sort()).toEqual(['ch01', 'ch02', 'ch03', 'ch04']);
  const fightCountsByDungeon = new Map<string, number[]>();
  for (const dungeon of early) {
    const nodes = new Map(dungeon.nodes.map((node) => [node.id, node]));
    const pathFightCounts: number[] = [];
    const visit = (id: string, seen: Set<string>, encounters: Set<string>, fights: number): void => {
      const node = nodes.get(id);
      expect(node, `${dungeon.id}/${id}`).toBeDefined();
      expect(seen.has(id), `${dungeon.id}/${id} cycles`).toBe(false);
      const nextSeen = new Set([...seen, id]);
      const nextEncounters = new Set(encounters);
      if (node!.encounterId) {
        expect(nextEncounters.has(node!.encounterId), `${dungeon.id}/${node!.encounterId} repeated`).toBe(false);
        nextEncounters.add(node!.encounterId);
      }
      const fightCount = fights + (node!.kind === 'combat' ? 1 : 0);
      if (node!.kind === 'exit') {
        const safeCellarExit = dungeon.id === 'ch01-tollhouse-culvert'
          && id === 'ch01-orchard-emergence'
          && nextSeen.has('ch01-culvert-tracks');
        expect(fightCount, `${dungeon.id}/${id} fight count`).toBeGreaterThanOrEqual(safeCellarExit ? 0 : 1);
        expect(fightCount, `${dungeon.id}/${id} fight count`).toBeLessThanOrEqual(3);
        pathFightCounts.push(fightCount);
        return;
      }
      expect(node!.exits.length, `${dungeon.id}/${id} stranded`).toBeGreaterThan(0);
      node!.exits.forEach((edge) => visit(edge.targetNodeId, nextSeen, nextEncounters, fightCount));
    };
    visit(dungeon.startNodeId, new Set(), new Set(), 0);
    fightCountsByDungeon.set(dungeon.chapterId, pathFightCounts);
  }
  expect([...new Set(fightCountsByDungeon.get('ch01'))].sort()).toEqual([0, 1]);
  expect([...new Set(fightCountsByDungeon.get('ch02'))].sort()).toEqual([1, 2]);
  expect(validateContent(CHRONICLE1_CONTENT)).toEqual([]);
  const earlyOptionCounts = CHRONICLE1_ROUTE_JUNCTIONS
    .filter((junction) => ['ch01', 'ch02', 'ch03', 'ch04'].includes(junction.chapterId))
    .map((junction) => junction.options.length);
  expect(earlyOptionCounts).toHaveLength(4);
  expect(new Set(earlyOptionCounts).size).toBeGreaterThan(1);
});

it('activates each chapter junction from a resolved story event and enters its authored dungeon', () => {
  const chapterJunctions = CHRONICLE1_ROUTE_JUNCTIONS.filter((junction) => ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'].includes(junction.chapterId));
  const nextMainAnchorByChapter = new Map([
    ['ch01', 'ch01-main-the-first-arrow'],
    ['ch02', 'ch02-main-the-hidden-depot'],
    ['ch03', 'ch03-main-the-attack-with-two-banners'],
    ['ch04', 'ch04-main-before-the-first-charge'],
    ['ch05', 'ch05-main-forge-behind-the-wall'],
    ['ch06', 'ch06-main-the-siege-begins'],
    ['ch07', 'ch07-main-voss-last-champion'],
    ['ch08', 'ch08-main-the-marshal-and-the-banner'],
  ]);
  const exitSceneByChapter = new Map([
    ...nextMainAnchorByChapter,
    ['ch07', 'ch07-combat-the-counterweight-house'],
    ['ch08', 'ch08-combat-the-coronation-engine'],
  ]);

  for (const junction of chapterJunctions) {
    const updatedAt = '2026-09-24T00:00:00.000Z';
    const created = createCampaign({ heroClass: 'warden', seed: 17, chapterId: junction.chapterId, updatedAt }, CHRONICLE1_CONTENT);
    const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT).state;
    const mainAnchors = [...CHRONICLE1_CONTENT.events.values()]
      .filter((event) => event.chapterId === junction.chapterId && event.type === 'main')
      .sort((left, right) => (left.anchorOrder ?? 0) - (right.anchorOrder ?? 0));
    const terminalOrder = mainAnchors.find((event) => event.id === nextMainAnchorByChapter.get(junction.chapterId))?.anchorOrder;
    expect(terminalOrder, junction.id).toBeDefined();
    const priorAnchors = mainAnchors.filter((event) => (event.anchorOrder ?? 0) < terminalOrder!).map((event) => event.id);
    const seenEventIds = [...new Set([...priorAnchors, junction.afterEventId])];
    const flags = junction.chapterId === 'ch01' ? ['tollhouse-searched'] : [];
    const atJunction: GameStateV2 = {
      ...started,
      campaign: { ...started.campaign, flags },
      expedition: {
        ...started.expedition!,
        position: junction.position,
        currentSceneId: junction.afterEventId,
        sceneResolution: {
          eventId: junction.afterEventId, choiceId: null, resultKind: 'direct', chance: null, roll: null,
          outcome: 'The party reaches the route decision.', effectSummary: [], nextSceneId: null, continueLabel: null,
        },
        authoredSceneQueue: [],
        director: { ...started.expedition!.director, usedSceneIds: priorAnchors, seenEventIds },
      },
      flow: { ...started.flow, screen: 'story' },
    };

    const activated = reduceGame(atJunction, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
    expect(activated.diagnostic, junction.id).toBeUndefined();
    expect(activated.state.expedition?.pendingRouteJunctionId, junction.id).toBe(junction.id);

    const dungeonOption = availableRouteOptions(junction, new Set(flags)).find((option) => option.kind === 'dungeon');
    expect(dungeonOption, junction.id).toBeDefined();
    const selected = reduceGame(activated.state, {
      type: 'select-route', junctionId: junction.id, optionId: dungeonOption!.id, updatedAt,
    }, CHRONICLE1_CONTENT);
    const dungeon = CHRONICLE1_DUNGEONS.find((entry) => entry.id === dungeonOption!.destination.dungeonId)!;
    const start = dungeon.nodes.find((node) => node.id === dungeon.startNodeId)!;
    expect(selected.diagnostic, junction.id).toBeUndefined();
    expect(selected.state.expedition?.dungeonRun?.dungeonId, junction.id).toBe(dungeon.id);
    if (start.sceneId) expect(selected.state.expedition?.currentSceneId, junction.id).toBe(start.sceneId);
    else expect(selected.state.expedition?.currentCombat?.encounterId, junction.id).toBeDefined();
    expect(dungeon.nodes.find((node) => dungeon.exitNodeIds.includes(node.id))?.sceneId, junction.id)
      .toBe(exitSceneByChapter.get(junction.chapterId));
  }
});

it('covers all eight campaign chapters with a reachable, consequential dungeon route', () => {
  const chapters = ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'];
  const terminalScenes = new Map([
    ['ch01', 'ch01-main-the-first-arrow'], ['ch02', 'ch02-main-the-hidden-depot'],
    ['ch03', 'ch03-main-the-attack-with-two-banners'], ['ch04', 'ch04-main-before-the-first-charge'],
    ['ch05', 'ch05-main-forge-behind-the-wall'], ['ch06', 'ch06-main-the-siege-begins'],
    ['ch07', 'ch07-combat-the-counterweight-house'], ['ch08', 'ch08-combat-the-coronation-engine'],
  ]);
  expect([...new Set(CHRONICLE1_DUNGEONS.map((dungeon) => dungeon.chapterId))].sort()).toEqual(chapters);

  for (const chapterId of chapters) {
    const dungeon = CHRONICLE1_DUNGEONS.find((entry) => entry.chapterId === chapterId)!;
    const junction = CHRONICLE1_ROUTE_JUNCTIONS.find((entry) => entry.chapterId === chapterId);
    expect(junction, `${chapterId} junction`).toBeDefined();
    expect(junction!.options.some((option) => option.kind === 'story')).toBe(true);
    expect(junction!.options.some((option) => option.destination.kind === 'dungeon' && option.destination.dungeonId === dungeon.id)).toBe(true);

    const nodes = new Map(dungeon.nodes.map((node) => [node.id, node]));
    const reachableExits = new Set<string>();
    const visit = (id: string, route: Set<string>): void => {
      const node = nodes.get(id);
      expect(node, `${dungeon.id}/${id} missing`).toBeDefined();
      expect(route.has(id), `${dungeon.id}/${id} cycles`).toBe(false);
      if (node!.kind === 'exit') {
        reachableExits.add(id);
        return;
      }
      expect(node!.exits.length, `${dungeon.id}/${id} strands the run`).toBeGreaterThan(0);
      for (const edge of node!.exits) visit(edge.targetNodeId, new Set([...route, id]));
    };
    visit(dungeon.startNodeId, new Set());
    expect(reachableExits).toEqual(new Set(dungeon.exitNodeIds));
    expect(dungeon.nodes.some((node) => node.kind === 'exit' && node.exitKind !== 'retreat' && node.sceneId === terminalScenes.get(chapterId))).toBe(true);
  }
});

function scene(id: string, slot: number): Chronicle1Event {
  return {
    id: id as Chronicle1Event['id'], chapterId: 'ch01', region: 'gloamwood', slot, type: 'journey', family: 'fixture-family' as Chronicle1Event['family'], weight: 1,
    illustrationId: `${id}-art` as Chronicle1Event['illustrationId'], title: id, narrative: ['A fixture scene.'], eligibility: {}, cooldownRuns: 0, oneShot: false,
    journeySubtype: 'travel', followUps: [], callbackPromises: [],
    choices: [
      { id: `${id}-left` as never, label: 'Take the left road', detail: 'A quiet route.', outcome: 'You continue.', effects: [] },
      { id: `${id}-right` as never, label: 'Take the right road', detail: 'A stony route.', outcome: 'You continue.', effects: [] },
    ],
  };
}

function input(events: readonly Chronicle1Event[]): ChroniclePlayabilityInput {
  return {
    chronicle, routes, factions: [], companions: [], merchants: [], events,
    encounters: [{ id: 'fixture-encounter' as never, family: 'fixture', kind: 'regular', enemyIds: [], reward: { xp: 0, gold: 0, itemChoices: [] } }],
    dialogueCatalog: {
      environmentArtIds: new Set(events.map((event) => event.illustrationId)),
      characterArt: [{ id: 'fixture-mara-pose' }],
      voiceCues: [{ id: 'fixture-cue', text: 'Dr. Vale waits.' }],
    },
  };
}

function issueCodes(events: readonly Chronicle1Event[]) {
  return validateChroniclePlayability(input(events)).map((issue) => issue.code);
}

describe('Chronicle I playability validation', () => {
  it('reports an ID-rich missing required continuation', () => {
    const invalid = {
      ...scene('fixture-source', 1),
      choices: [{ ...scene('fixture-source', 1).choices[0], nextSceneId: 'missing-scene' as never }, scene('fixture-source', 1).choices[1]],
    } as Chronicle1Event;

    const issues = validateChronicleSources({ chronicle, routes, factions: [], companions: [], merchants: [], events: [invalid] });

    expect(issues).toContainEqual(expect.objectContaining({
      code: 'missing_next_scene',
      message: expect.stringContaining('fixture-source'),
    }));
  });

  it('finds missing combat ownership, malformed checks, and required cycles without treating follow-ups as required edges', () => {
    const combatWithoutEncounter = { ...scene('fixture-combat', 1), type: 'combat' as const, journeySubtype: undefined } as Chronicle1Event;
    const malformedCheck = {
      ...scene('fixture-check', 2),
      choices: [{ id: 'fixture-check-choice' as never, label: 'Test the omen', detail: 'A malformed check.', check: { success: { outcome: 'Only one branch.', effects: [] } } }, scene('fixture-check', 2).choices[1]],
    } as unknown as Chronicle1Event;
    const cycleA = { ...scene('fixture-a', 3), choices: scene('fixture-a', 3).choices.map((choice) => ({ ...choice, nextSceneId: 'fixture-b' as never })) } as Chronicle1Event;
    const cycleB = { ...scene('fixture-b', 4), choices: scene('fixture-b', 4).choices.map((choice) => ({ ...choice, nextSceneId: 'fixture-a' as never })) } as Chronicle1Event;
    const optionalOnlyA = { ...scene('fixture-optional-a', 5), followUps: ['fixture-optional-b' as never] } as Chronicle1Event;
    const optionalOnlyB = { ...scene('fixture-optional-b', 6), followUps: ['fixture-optional-a' as never] } as Chronicle1Event;
    const codes = issueCodes([combatWithoutEncounter, malformedCheck, cycleA, cycleB, optionalOnlyA, optionalOnlyB]);

    expect(codes).toContain('missing_encounter');
    expect(codes).toContain('incomplete_checked_choice');
    expect(codes.filter((code) => code === 'inescapable_required_cycle')).toHaveLength(1);
  });

  it('keeps legacy flag choices and neutral dialogue legal while rejecting an intangible strict choice', () => {
    const legacy = {
      ...scene('fixture-legacy', 1),
      choices: scene('fixture-legacy', 1).choices.map((choice) => ({ ...choice, effects: [{ type: 'flag', operation: 'add', flagId: 'legacy-mark' }] })),
    } as Chronicle1Event;
    const strict = {
      ...scene('fixture-strict', 2), dialogue: [{ speakerName: 'Mara', text: 'The road is quiet.' }],
      choices: scene('fixture-strict', 2).choices.map((choice) => ({ ...choice, effects: [{ type: 'flag', operation: 'add', flagId: 'strict-mark' }] })),
    } as Chronicle1Event;
    const neutralDialogue = { ...scene('fixture-dialogue', 4), dialogue: [{ speakerName: 'Mara', text: 'Dr. Vale waits.', voiceCueId: 'fixture-cue' }], choices: [] } as Chronicle1Event;

    expect(issueCodes([legacy])).not.toContain('intangible_choice');
    expect(issueCodes([strict])).toContain('intangible_choice');
    expect(issueCodes([neutralDialogue])).not.toContain('intangible_choice');
  });

  it('validates route spoilers and catalog-aware dialogue media without production audio', () => {
    const dialogue = {
      ...scene('fixture-dialogue-media', 1),
      dialogue: [{ speakerName: 'Mara', text: 'One.Two.Three.Four.', characterLayer: { illustrationId: 'fixture-dialogue-media-art' as never }, environmentIllustrationId: 'fixture-mara-pose' as never, voiceCueId: 'fixture-cue' as never }],
      choices: [],
    } as Chronicle1Event;
    const customInput = {
      ...input([dialogue]),
      routes: [{ ...routes[0]!, description: 'Merchant frequency is high.' }, ...routes.slice(1)],
      dialogueCatalog: { environmentArtIds: new Set([dialogue.illustrationId]), characterArt: [{ id: 'fixture-mara-pose' }], voiceCues: [{ id: 'fixture-cue', text: 'An unrelated line.' }] },
    } satisfies ChroniclePlayabilityInput;
    const codes = validateChroniclePlayability(customInput).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining(['spoiler_route_copy', 'missing_art', 'invalid_dialogue_sentence_count', 'invalid_dialogue_voice_text']));
  });

  it('counts closing punctuation and a terminal abbreviation as real dialogue boundaries', () => {
    const quoted = { ...scene('fixture-quoted', 1), dialogue: [{ speakerName: 'Mara', text: '“Wait.” (Mara turns.)' }], choices: [] } as Chronicle1Event;
    const terminalAbbreviation = { ...scene('fixture-abbreviation', 2), dialogue: [{ speakerName: 'Mara', text: 'One. Two. etc. Then.' }], choices: [] } as Chronicle1Event;

    expect(issueCodes([quoted])).not.toContain('invalid_dialogue_sentence_count');
    expect(issueCodes([terminalAbbreviation])).toContain('invalid_dialogue_sentence_count');
  });

  it('guards malformed branch effects and keeps every uncertain branch as a graph exit', () => {
    const malformed = {
      ...scene('fixture-malformed', 1),
      choices: [{
        id: 'fixture-malformed-check' as never, label: 'Read the omen', detail: 'A malformed checked choice.',
        check: {
          success: { outcome: 'A false loop.', effects: [null, { type: 'unknown-effect' }, { type: 'gold' }], nextSceneId: 'fixture-malformed' },
          failure: null,
          criticalSuccess: { outcome: 'Another false loop.', effects: [], nextSceneId: 'fixture-malformed' },
        },
      }, scene('fixture-malformed', 1).choices[1]],
    } as unknown as Chronicle1Event;
    const incompleteGoldLoop = {
      ...scene('fixture-incomplete-gold', 2),
      choices: [{
        id: 'fixture-incomplete-gold-check' as never, label: 'Take the toll', detail: 'A checked choice with incomplete effects.',
        check: {
          success: { outcome: 'The toll repeats.', effects: [{ type: 'gold' }], nextSceneId: 'fixture-incomplete-gold' },
          failure: { outcome: 'The toll repeats.', effects: [{ type: 'gold' }], nextSceneId: 'fixture-incomplete-gold' },
        },
      }],
    } as unknown as Chronicle1Event;

    expect(() => validateChroniclePlayability(input([malformed]))).not.toThrow();
    const issues = validateChroniclePlayability(input([malformed, incompleteGoldLoop]));
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain('incomplete_checked_choice');
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'incomplete_checked_choice',
      message: expect.stringContaining('fixture-incomplete-gold'),
    }));
    expect(codes).not.toContain('inescapable_required_cycle');
  });

  it('recognizes unknown branch encounters, self-loop escapes, and later-consumed flag consequences', () => {
    const checkedEncounter = {
      ...scene('fixture-branch-combat', 1),
      choices: [{
        id: 'fixture-branch-combat-choice' as never, label: 'Test the line', detail: 'A valid checked shape.',
        check: {
          success: { outcome: 'Hold fast.', effects: [], combatEncounterId: 'unknown-encounter' },
          failure: { outcome: 'Fall back.', effects: [] },
        },
      }, { ...scene('fixture-branch-combat', 1).choices[1], effects: [{ type: 'evidence', operation: 'add', evidenceId: 'road-proof' }] }],
    } as unknown as Chronicle1Event;
    const escapingSelfLoop = {
      ...scene('fixture-self-loop', 2),
      choices: [{ ...scene('fixture-self-loop', 2).choices[0], nextSceneId: 'fixture-self-loop' as never }, { ...scene('fixture-self-loop', 2).choices[1], effects: [{ type: 'evidence', operation: 'add', evidenceId: 'road-proof' }] }],
    } as Chronicle1Event;
    const consumedFlag = {
      ...scene('fixture-consumed-flag', 3), dialogue: [{ speakerName: 'Mara', text: 'The road waits.' }],
      choices: scene('fixture-consumed-flag', 3).choices.map((choice) => ({ ...choice, effects: [{ type: 'flag', operation: 'add', flagId: 'gate-opened' }] })),
    } as Chronicle1Event;
    const gate = { ...scene('fixture-gate', 4), requirements: [{ type: 'flag', flagId: 'gate-opened', present: true }] } as Chronicle1Event;
    const tangibleEffect = { ...scene('fixture-tangible-effect', 5), dialogue: [{ speakerName: 'Mara', text: 'The marker is real.' }], choices: scene('fixture-tangible-effect', 5).choices.map((choice) => ({ ...choice, effects: [{ type: 'evidence', operation: 'add', evidenceId: 'road-proof' }] })) } as Chronicle1Event;
    const codes = issueCodes([checkedEncounter, escapingSelfLoop, consumedFlag, gate, tangibleEffect]);

    expect(codes).toContain('missing_encounter');
    expect(codes).not.toContain('inescapable_required_cycle');
    expect(codes).not.toContain('intangible_choice');
  });

  it('uses Unicode word boundaries for cue text and preserves index-local generic audio', () => {
    const punctuationCue = {
      ...scene('fixture-cue-boundary', 1), dialogue: [{ speakerName: 'Mara', text: 'Wait', voiceCueId: 'fixture-cue' }], choices: [],
    } as Chronicle1Event;
    const boundaryIssues = validateChroniclePlayability({
      ...input([punctuationCue]),
      dialogueCatalog: { environmentArtIds: new Set([punctuationCue.illustrationId]), characterArt: [], voiceCues: [{ id: 'fixture-cue', text: 'Wait, traveller.' }] },
    });
    const runtime = makeContentIndex();
    const runtimeScene = [...runtime.events.values()][0]!;
    const withLocalAudio = {
      ...runtime,
      events: new Map([[runtimeScene.id, { ...runtimeScene, dialogue: [{ speakerName: 'Mara', text: 'A local cue.', voiceCueId: 'fixture-local-cue' as never }] }]]),
      audioIds: new Set([...runtime.audioIds, 'fixture-local-cue']),
    };

    expect(boundaryIssues.map((issue) => issue.code)).not.toContain('invalid_dialogue_voice_text');
    expect(validateContent(withLocalAudio).map((issue) => issue.code)).not.toContain('missing_audio');
    expect(validateContent({ ...withLocalAudio, audioIds: new Set() }).map((issue) => issue.code)).toContain('missing_audio');
  });

  it('handles title and example abbreviations according to their sentence context', () => {
    expect(countDialogueSentences('Dr. Vale waits.')).toBe(1);
    expect(countDialogueSentences('St. Then leave.')).toBe(2);
    expect(countDialogueSentences('Use e.g. a lantern.')).toBe(1);
    expect(countDialogueSentences('e.g. Then leave.')).toBe(2);
    expect(countDialogueSentences('i.e. Then leave.')).toBe(2);
    expect(countDialogueSentences('Pack rope, etc. before dusk.')).toBe(1);
    expect(countDialogueSentences('Pack rope, etc. Soldiers wait.')).toBe(2);
    expect(countDialogueSentences('High St. Guards wait.')).toBe(2);
  });
});
