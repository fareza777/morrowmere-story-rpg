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

describe('Chronicle I content schema', () => {
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
});
