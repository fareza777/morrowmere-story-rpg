import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/game/content/validate';
import { makeContentIndex } from './fixtures/game';
import type { EventId } from '../src/game/domain/ids';

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
});
