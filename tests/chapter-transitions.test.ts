import { describe, expect, it } from 'vitest';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChapterId, EventId } from '../src/game/domain/ids';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';

const asEventId = (id: string) => id as EventId;

function anchor(chapterId: ChapterId, id: string, slot: number): ChronicleEvent {
  return {
    id: asEventId(id), chapterId, slot, type: 'main', family: id, anchorOrder: 7,
    illustrationId: 'fixture-art', title: id, narrative: ['The chapter reaches its final road.'], eligibility: {},
    cooldownRuns: 0, oneShot: true, choices: [],
  };
}

function content(events: readonly ChronicleEvent[]): ContentIndex {
  return {
    events: new Map(events.map((event) => [event.id, event])),
    items: new Map(), enemies: new Map(), encounters: new Map(), companions: new Map(), merchants: new Map(),
    artIds: new Set(['fixture-art']), audioIds: new Set(),
  };
}

function stateAfterFinalAnchor(chapterId: ChapterId, finale: ChronicleEvent, fixture: ContentIndex) {
  const created = createCampaign({
    heroClass: 'warrior', seed: 29, name: 'Rowan', chapterId, updatedAt: '2026-09-01T00:00:00.000Z',
  }, fixture);
  const started = reduceGame(created, {
    type: 'start-expedition', routeProfile: 'old-forest', updatedAt: '2026-09-01T00:01:00.000Z',
  }, fixture).state;
  return {
    ...started,
    campaign: {
      ...started.campaign,
      bankedGold: 12,
      flags: ['kept-oath'],
      evidence: ['sealed-ledger'],
      factions: { greywatch: 4 },
      hero: { ...started.campaign.hero, level: chapterId === 'ch08' ? 15 : 2, xp: chapterId === 'ch08' ? 14_000 : 100 },
    },
    expedition: {
      ...started.expedition!,
      position: { chapterId, slot: (finale.slot ?? 1) + 1 },
      currentSceneId: finale.id,
      sceneResolution: { eventId: finale.id, choiceId: null },
      unbankedGold: 9,
      director: {
        ...started.expedition!.director,
        usedSceneIds: [finale.id],
        seenEventIds: [finale.id],
      },
    },
  };
}

describe('Chronicle chapter terminal transitions', () => {
  it('banks the completed run and opens the next chapter from Camp', () => {
    const ch01Finale = anchor('ch01', 'ch01-finale', 2);
    const ch02Opening = anchor('ch02', 'ch02-opening', 1);
    const fixture = content([ch01Finale, ch02Opening]);
    const before = stateAfterFinalAnchor('ch01', ch01Finale, fixture);
    const attempts = before.campaign.attemptCounters;

    const result = reduceGame(before, {
      type: 'select-next-scene', updatedAt: '2026-09-01T00:02:00.000Z',
    }, fixture);

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.expedition).toBeNull();
    expect(result.state.flow).toMatchObject({ screen: 'camp', merchant: null });
    expect(result.state.campaign).toMatchObject({
      chapterId: 'ch02', bankedGold: 21, flags: ['kept-oath'], evidence: ['sealed-ledger'],
      factions: { greywatch: 4 }, hero: before.campaign.hero,
      attemptCounters: attempts,
      routeSeedNonce: before.campaign.routeSeedNonce + 1,
    });
    expect(result.state.checkpoints.chapter.campaign).toMatchObject({ chapterId: 'ch02', bankedGold: 21 });
    expect(result.state.checkpoints.camp).toMatchObject({ campaign: { chapterId: 'ch02', bankedGold: 21 }, campSceneId: null });
    expect(result.state.checkpoints.chapter.campaign).not.toBe(result.state.checkpoints.camp?.campaign);
  });

  it('ends Chronicle I after the Chapter 8 finale without surfacing a scene error', () => {
    const finale = anchor('ch08', 'ch08-finale', 2);
    const fixture = content([finale]);
    const before = stateAfterFinalAnchor('ch08', finale, fixture);

    const result = reduceGame(before, {
      type: 'select-next-scene', updatedAt: '2026-09-01T00:02:00.000Z',
    }, fixture);

    expect(result.diagnostic).toBeUndefined();
    expect(result.state.expedition).toBeNull();
    expect(result.state.flow).toMatchObject({ screen: 'ending', merchant: null });
    expect(result.state.campaign).toMatchObject({ chapterId: 'ch08', bankedGold: 21, hero: before.campaign.hero });
    expect(result.state.checkpoints.chapter.campaign).toMatchObject({ chapterId: 'ch08', bankedGold: 21 });
    expect(result.state.checkpoints.camp).toMatchObject({ campaign: { chapterId: 'ch08', bankedGold: 21 }, campSceneId: null });
  });
});
