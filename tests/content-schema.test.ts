import { describe, expect, it } from 'vitest';
import { defineScene } from '../src/game/content/chronicle1/builders';
import { CHRONICLE1 } from '../src/game/content/chronicle1/chronicle';
import { CHRONICLE1_COMPANIONS } from '../src/game/content/chronicle1/companions';
import { CHRONICLE1_FACTIONS } from '../src/game/content/chronicle1/factions';
import { CHRONICLE1_MERCHANTS } from '../src/game/content/chronicle1/merchants';
import { CHRONICLE1_ROUTES } from '../src/game/content/chronicle1/routes';
import {
  validateChronicleSourceKey,
  validateChronicleSources,
  validateContent,
} from '../src/game/content/validate';
import { makeContentIndex } from './fixtures/game';
import type { EventId } from '../src/game/domain/ids';
import type {
  ChronicleChoice,
  ChronicleChoiceCheck,
  ChronicleChoiceBranch,
  ChronicleCheckedChoice,
  ChronicleDirectChoice,
  ChronicleDefinition,
} from '../src/game/content/schema';

function sourceScene(overrides: Record<string, unknown> = {}) {
  return defineScene({
    id: 'ch01-journey-source-validation',
    chapterId: 'ch01',
    region: 'gloamwood',
    slot: 90,
    type: 'journey',
    journeySubtype: 'investigation',
    family: 'source-validation',
    weight: 1,
    pacing: 'quiet',
    illustrationId: 'scene-ch01-journey-source-validation',
    title: 'Source Validation',
    narrative: ['A synthetic scene validates source-array contracts.'],
    eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 },
    requirements: [],
    exclusions: [],
    cooldownRuns: 0,
    oneShot: true,
    followUps: [],
    callbackPromises: [],
    choices: [
      { id: 'ch01-choice-source-one', label: 'Inspect', detail: 'Inspect the source.', effects: [], outcome: 'The source is inspected.' },
      { id: 'ch01-choice-source-two', label: 'Record', detail: 'Record the source.', effects: [], outcome: 'The source is recorded.' },
    ],
    ...overrides,
  } as never);
}

function validateSources(events?: readonly ReturnType<typeof sourceScene>[]) {
  return validateChronicleSources({
    chronicle: CHRONICLE1,
    routes: CHRONICLE1_ROUTES,
    factions: CHRONICLE1_FACTIONS,
    companions: CHRONICLE1_COMPANIONS,
    merchants: CHRONICLE1_MERCHANTS,
    events,
  });
}

function testChronicle(chapters: ChronicleDefinition['chapters']): ChronicleDefinition {
  return { ...CHRONICLE1, chapters };
}

const emptySourceCatalogs = {
  routes: [],
  factions: [],
  companions: [],
  merchants: [],
} as const;

describe('Chronicle I content schema', () => {
  it('supports a checked choice with immutable authored success and failure branches', () => {
    const success: ChronicleChoiceBranch = {
      outcome: 'The wagon reaches solid ground.',
      effects: [],
      nextSceneId: 'ch01-journey-solid-ground' as EventId,
      continueLabel: 'Continue to the road',
    };
    const check: ChronicleChoiceCheck = {
      stat: 'strength',
      difficulty: 3,
      modifiers: [{ label: 'Wagon braces', amount: 10 }],
      success,
      failure: {
        outcome: 'The axle cracks in the mud.',
        effects: [],
        combatEncounterId: 'encounter-road-raiders' as never,
      },
    };
    const choice: ChronicleCheckedChoice = {
      id: 'ch01-choice-brace-the-wagon' as never,
      label: 'Brace the wagon',
      detail: 'Put your shoulder into the sinking frame.',
      check,
    };
    const directChoice: ChronicleDirectChoice = {
      id: 'ch01-choice-take-the-detour' as never,
      label: 'Take the detour',
      detail: 'Avoid the washed verge.',
      effects: [],
      outcome: 'The longer road is clear.',
    };
    // @ts-expect-error Checked choices own their outcome/effects in branches.
    const invalidMixedChoice: ChronicleChoice = { ...choice, effects: [], outcome: 'Unused direct outcome.' };

    expect(choice.check.success.nextSceneId).toBe('ch01-journey-solid-ground');
    expect(choice.check.failure.combatEncounterId).toBe('encounter-road-raiders');
    expect(directChoice.outcome).toBe('The longer road is clear.');
    expect(invalidMixedChoice).toBeDefined();
  });

  it('validates a checked source without direct placeholder fields', () => {
    const checked = sourceScene({
      continueOnly: true,
      choices: [{
        id: 'ch01-choice-checked-source',
        label: 'Brace the wagon',
        detail: 'Put your shoulder into the sinking frame.',
        check: {
          stat: 'strength',
          difficulty: 3,
          success: {
            outcome: 'The wagon reaches solid ground.',
            effects: [{ type: 'flag', operation: 'add', flagId: 'wagon-saved' }],
          },
          failure: {
            outcome: 'The axle cracks in the mud.',
            effects: [{ type: 'threat', amount: 1 }],
          },
        },
      }],
    });

    const chronicle = testChronicle([{
      id: 'ch01', order: 1, title: 'Checked Source', levelBand: { min: 1, max: 2 }, region: 'gloamwood', anchorIds: [],
    }] as never);
    expect(validateChronicleSources({ chronicle, ...emptySourceCatalogs, events: [checked] })).toEqual([]);
  });

  it('rejects duplicate IDs and broken references', () => {
    const content = makeContentIndex({ duplicateEventId: true, missingArtId: true });
    expect(validateContent(content).map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['duplicate_event_id', 'missing_art']),
    );
  });

  it('accepts the minimal deterministic fixture', () => {
    expect(validateContent(makeContentIndex())).toEqual([]);
  });

  it('rejects event routes outside the three Chronicle route profiles', () => {
    expect(validateContent(makeContentIndex({ invalidRoute: true })).map((issue) => issue.code)).toContain(
      'invalid_route',
    );
  });

  it('rejects hub merchant metadata with a missing merchant or restock key', () => {
    const original = makeContentIndex();
    const event = [...original.events.values()][0]!;
    const broken = {
      ...original,
      events: new Map([[event.id, { ...event, type: 'hub' as const, merchantId: 'missing-merchant' as never, merchantRestockKey: '' }]]),
    };

    expect(validateContent(broken).map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['missing_event_merchant', 'invalid_event_merchant']),
    );
  });

  it('accepts canonical metadata sources without requiring Chronicle scenes yet', () => {
    expect(validateSources()).toEqual([]);
  });

  it('validates keyed source identity before Map construction', () => {
    expect(validateChronicleSourceKey('wrong-key', sourceScene()).map((issue) => issue.code)).toEqual([
      'source_key_mismatch',
    ]);
  });

  it('reports malformed identity, media, chapter, slot, anchor, and link contracts', () => {
    const first = sourceScene({
      id: 'Bad Id',
      region: 'embervault',
      slot: 0,
      weight: 0,
      anchorOrder: 2,
      illustrationId: 'shared-media',
      audioId: 'shared-media',
      followUps: ['missing-follow-up'],
      callbackPromises: [{
        id: 'callback-too-late',
        targetEventId: 'missing-callback-target',
        deadline: { chapterId: 'ch01', slot: -1 },
      }],
    });
    const second = sourceScene({
      id: 'ch01-journey-duplicate-source-slot',
      illustrationId: 'shared-media',
      slot: 0,
      choices: [],
    });

    const codes = validateSources([first, second]).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      'invalid_id',
      'duplicate_illustration_id',
      'duplicate_media_id',
      'invalid_chapter_region',
      'invalid_scene_slot',
      'invalid_scene_weight',
      'duplicate_scene_slot',
      'missing_anchor',
      'invalid_anchor_order',
      'invalid_choice_count',
      'invalid_callback_window',
      'unreachable_callback',
      'missing_follow_up',
    ]));
  });

  it('requires a valid journey subtype and allows one choice only for continue-only scenes', () => {
    const missingSubtype = sourceScene({ journeySubtype: undefined });
    const wrongOwner = sourceScene({
      id: 'ch01-main-source-validation',
      type: 'main',
      journeySubtype: 'travel',
      slot: 91,
      illustrationId: 'scene-ch01-main-source-validation',
    });
    const oneChoice = sourceScene({
      id: 'ch01-journey-single-choice',
      slot: 92,
      illustrationId: 'scene-ch01-journey-single-choice',
      choices: [{ id: 'ch01-choice-continue', label: 'Continue', detail: 'Continue onward.', effects: [], outcome: 'The road continues.' }],
    });
    const continueOnly = sourceScene({
      id: 'ch01-journey-continue-only',
      slot: 93,
      illustrationId: 'scene-ch01-journey-continue-only',
      continueOnly: true,
      choices: [{ id: 'ch01-choice-only', label: 'Continue', detail: 'Continue onward.', effects: [], outcome: 'The road continues.' }],
    });

    expect(validateSources([missingSubtype, wrongOwner]).map((issue) => issue.code)).toContain('invalid_journey_subtype');
    expect(validateSources([oneChoice]).map((issue) => issue.code)).toContain('invalid_choice_count');
    expect(validateSources([continueOnly]).map((issue) => issue.code)).not.toContain('invalid_choice_count');
  });

  it('rejects companion scene links and merchant restock gates absent from supplied events', () => {
    const anchor = sourceScene({
      id: 'ch01-main-validator-anchor',
      slot: 1,
      type: 'main',
      journeySubtype: undefined,
      anchorOrder: 1,
      illustrationId: 'scene-ch01-main-validator-anchor',
    });
    const chronicle = testChronicle([{
      id: 'ch01', order: 1, title: 'Validator Chapter', levelBand: { min: 1, max: 2 },
      region: 'gloamwood', anchorIds: [anchor.id],
    }] as never);
    const companion = {
      ...CHRONICLE1_COMPANIONS[0]!,
      personalQuestIds: ['ch01-companion-missing-quest' as EventId],
      outcomeSceneIds: ['ch01-companion-missing-outcome' as EventId],
    };
    const merchant = {
      ...CHRONICLE1_MERCHANTS[0]!,
      restockGateIds: ['ch01-hub-missing-merchant-gate' as EventId],
    };

    const codes = validateChronicleSources({
      chronicle,
      ...emptySourceCatalogs,
      companions: [companion],
      merchants: [merchant],
      events: [anchor],
    }).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      'missing_companion_quest_scene',
      'missing_companion_outcome_scene',
      'missing_merchant_restock_gate',
    ]));
  });

  it('requires each canonical anchor scene to use the main scene type', () => {
    const wrongType = sourceScene({
      id: 'ch01-main-validator-anchor',
      slot: 1,
      anchorOrder: 1,
      illustrationId: 'scene-ch01-main-validator-anchor',
    });
    const chronicle = testChronicle([{
      id: 'ch01', order: 1, title: 'Validator Chapter', levelBand: { min: 1, max: 2 },
      region: 'gloamwood', anchorIds: [wrongType.id],
    }] as never);

    const codes = validateChronicleSources({ chronicle, ...emptySourceCatalogs, events: [wrongType] }).map((issue) => issue.code);

    expect(codes).toContain('invalid_anchor_type');
  });

  it('rejects a callback target authored in a different chapter from its deadline', () => {
    const source = sourceScene({
      id: 'ch01-journey-callback-source',
      slot: 1,
      illustrationId: 'scene-ch01-journey-callback-source',
      callbackPromises: [{
        id: 'callback-cross-chapter-deadline',
        targetEventId: 'ch02-journey-callback-target',
        deadline: { chapterId: 'ch03', slot: 5 },
      }],
    });
    const target = sourceScene({
      id: 'ch02-journey-callback-target',
      chapterId: 'ch02',
      slot: 1,
      illustrationId: 'scene-ch02-journey-callback-target',
    });
    const chronicle = testChronicle([
      { id: 'ch01', order: 1, title: 'One', levelBand: { min: 1, max: 2 }, region: 'gloamwood', anchorIds: [] },
      { id: 'ch02', order: 2, title: 'Two', levelBand: { min: 2, max: 4 }, region: 'gloamwood', anchorIds: [] },
      { id: 'ch03', order: 3, title: 'Three', levelBand: { min: 4, max: 6 }, region: 'drowned-road', anchorIds: [] },
    ] as never);

    const codes = validateChronicleSources({ chronicle, ...emptySourceCatalogs, events: [source, target] }).map((issue) => issue.code);

    expect(codes).toContain('invalid_callback_window');
  });
});
