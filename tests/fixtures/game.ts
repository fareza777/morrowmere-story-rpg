import type { ChronicleEvent, ContentIndex } from '../../src/game/content/schema';
import type { EventId } from '../../src/game/domain/ids';

export interface ContentIndexOptions {
  readonly duplicateEventId?: boolean;
  readonly missingArtId?: boolean;
}

const eventId = 'fixture-event' as EventId;

function makeEvent(options: ContentIndexOptions): ChronicleEvent {
  return {
    id: eventId,
    chapterId: 'ch01',
    type: 'main',
    family: 'fixture',
    illustrationId: options.missingArtId ? 'missing-art' : 'fixture-art',
    title: 'Fixture Event',
    narrative: ['A deterministic fixture scene.'],
    eligibility: {},
    cooldownRuns: 0,
    oneShot: true,
    choices: [],
  };
}

export function makeContentIndex(options: ContentIndexOptions = {}): ContentIndex {
  const event = makeEvent(options);
  const events = new Map<EventId, ChronicleEvent>([[event.id, event]]);
  if (options.duplicateEventId) {
    events.set('fixture-event-copy' as EventId, { ...event });
  }

  return {
    events,
    items: new Map(),
    enemies: new Map(),
    encounters: new Map(),
    companions: new Map(),
    merchants: new Map(),
    artIds: new Set(['fixture-art']),
    audioIds: new Set(),
  };
}
