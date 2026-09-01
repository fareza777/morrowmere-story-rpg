import { describe, expect, it } from 'vitest';
import type {
  Chronicle1Event,
  ChronicleDefinition,
  ChronicleRouteDefinition,
} from '../../src/game/content/schema';
import { validateChroniclePlayability, validateChronicleSources, type ChroniclePlayabilityInput } from '../../src/game/content/validate';

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
});
