import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/game/content/validate';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { EventId } from '../src/game/domain/ids';

const eventId = 'dialogue-validation' as EventId;

function content(dialogue: unknown): ContentIndex {
  const event = {
    id: eventId, chapterId: 'ch01', type: 'journey', family: 'dialogue-validation', illustrationId: 'scene-dialogue-validation', title: 'Validation',
    narrative: ['Validation fixture.'], eligibility: {}, cooldownRuns: 0, oneShot: false, choices: [], dialogue,
  } as ChronicleEvent;
  return {
    events: new Map([[eventId, event]]), items: new Map(), enemies: new Map(), encounters: new Map(), merchants: new Map(), companions: new Map(),
    artIds: new Set(['scene-dialogue-validation']), audioIds: new Set(),
  };
}

describe('dialogue content validation', () => {
  it('rejects empty or malformed authored dialogue and unavailable references', () => {
    const issues = validateContent(content([
      { speakerName: '', text: 'One. Two. Three. Four.', characterLayer: { illustrationId: 'missing-pose', companionId: 'missing-companion' }, environmentIllustrationId: 'missing-environment', voiceCueId: 'missing-voice' },
      { speakerName: 'Mara', text: '' },
    ])).map((issue) => issue.code);

    expect(issues).toEqual(expect.arrayContaining([
      'invalid_dialogue_speaker', 'invalid_dialogue_text', 'invalid_dialogue_sentence_count', 'missing_companion', 'missing_art', 'missing_audio',
    ]));
    expect(validateContent(content([])).map((issue) => issue.code)).toContain('invalid_dialogue');
  });
});
