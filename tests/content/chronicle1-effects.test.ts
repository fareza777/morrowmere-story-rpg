import { describe, expect, it } from 'vitest';
import type { CompanionDefinition, ContentIndex, ItemDefinition } from '../../src/game/content/schema';
import { validateContent } from '../../src/game/content/validate';
import type { ChoiceId, CompanionId, ItemId } from '../../src/game/domain/ids';
import type { GameEffect } from '../../src/game/domain/effects';
import { applyEffectsAtomically } from '../../src/game/state/effects';
import { createCampaign, initialDirector } from '../../src/game/state/create';
import type { ExpeditionState } from '../../src/game/state/types';
import { makeContentIndex } from '../fixtures/game';

const companionId = 'mara' as CompanionId;

const companion: CompanionDefinition = {
  id: companionId,
  name: 'Mara Vey',
  recruitment: { requiredDecisionIds: [] },
  personalQuestIds: [],
  combat: { attack: 3, guard: 3, will: 1, actionId: 'mara-covering-shot' },
};

function contentFixture(): ContentIndex {
  return {
    ...makeContentIndex(),
    companions: new Map([[companionId, companion]]),
  };
}

function effectState(content: ContentIndex) {
  const campaign = createCampaign({
    heroClass: 'warrior',
    seed: 17,
    name: 'Rowan',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }, content).campaign;
  const expedition: ExpeditionState = {
    routeProfile: 'kings-road',
    routeSeed: 17,
    director: initialDirector(17),
    position: { chapterId: 'ch01', slot: 1 },
    currentSceneId: null,
    sceneResolution: null,
    authoredSceneQueue: [],
    sceneVisitCounts: {},
    checkedAttempts: [],
    heroVitals: { health: 40, resource: 12 },
    currentCombat: null,
    pendingReward: null,
    unbankedGold: 0,
    unbankedLoot: [],
    temporaryBoons: [],
    merchantVisits: [],
  };
  return { campaign, expedition };
}

describe('Chronicle I runtime effect normalization', () => {
  it('applies authored evidence, companion, threat, and tension effects atomically', () => {
    const content = contentFixture();
    const state = effectState(content);
    const effects = [
      { type: 'evidence', operation: 'add', evidenceId: 'route-seven-dispatch' },
      { type: 'companion-loyalty', companionId, amount: 40 },
      { type: 'companion-quest', companionId, stage: 3 },
      { type: 'companion-injury', companionId, injured: true },
      { type: 'threat', amount: 4 },
      { type: 'tension', amount: -1 },
    ] as const satisfies readonly GameEffect[];

    const result = applyEffectsAtomically(state, effects, content);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.campaign.evidence).toEqual(['route-seven-dispatch']);
    expect(result.value.campaign.companions.records).toEqual([{
      companionId,
      status: 'unknown',
      questStage: 3,
      loyalty: 40,
      injured: true,
    }]);
    expect(result.value.expedition?.director.threat).toBe(4);
    expect(result.value.expedition?.director.tension).toBe(1);
  });

  it('does not retain earlier Chronicle mutations when a later effect fails', () => {
    const content = contentFixture();
    const state = effectState(content);
    const effects = [
      { type: 'evidence', operation: 'add', evidenceId: 'route-seven-dispatch' },
      { type: 'companion-loyalty', companionId: 'missing-companion' as CompanionId, amount: 2 },
    ] as const satisfies readonly GameEffect[];

    const result = applyEffectsAtomically(state, effects, content);

    expect(result.ok).toBe(false);
    expect(state.campaign.evidence).toEqual([]);
    expect(state.campaign.companions.records[0]?.loyalty).toBe(0);
  });

  it('rejects every progression effect that references a missing companion', () => {
    const content = makeContentIndex();
    const event = [...content.events.values()][0]!;
    const missingCompanionId = 'missing-companion' as CompanionId;
    const invalidContent: ContentIndex = {
      ...content,
      events: new Map([[event.id, {
        ...event,
        choices: [{
          id: 'missing-companion-effects' as ChoiceId,
          label: 'Use invalid effects',
          detail: 'A validator-only fixture.',
          outcome: 'The fixture remains invalid.',
          effects: [
            { type: 'companion-loyalty', companionId: missingCompanionId, amount: 1 },
            { type: 'companion-quest', companionId: missingCompanionId, stage: 1 },
            { type: 'companion-injury', companionId: missingCompanionId, injured: true },
          ],
        }],
      }]]),
    };

    expect(validateContent(invalidContent).filter((issue) => issue.code === 'missing_companion')).toHaveLength(3);
  });

  it('rejects quest items authored as unbanked loot in validation and at runtime', () => {
    const questItemId = 'sealed-key' as ItemId;
    const questItem: ItemDefinition = {
      id: questItemId, name: 'Sealed Key', category: 'quest', description: 'A key that must survive the journey.',
      allowedClasses: ['warrior', 'mage', 'warden'], stats: {}, value: 0, tags: [],
    };
    const base = makeContentIndex();
    const event = [...base.events.values()][0]!;
    const content: ContentIndex = {
      ...base,
      items: new Map([[questItemId, questItem]]),
      events: new Map([[event.id, {
        ...event,
        choices: [{
          id: 'unbanked-quest-key' as ChoiceId,
          label: 'Take the sealed key', detail: 'An invalid loot-destination fixture.', outcome: 'The key remains safe.',
          effects: [{ type: 'item', operation: 'grant', itemId: questItemId, quantity: 1, destination: 'unbanked-loot' }],
        }],
      }]]),
    };
    const result = applyEffectsAtomically(effectState(content), [
      { type: 'item', operation: 'grant', itemId: questItemId, quantity: 1, destination: 'unbanked-loot' },
    ], content);
    const normalGrant = applyEffectsAtomically(effectState(content), [
      { type: 'item', operation: 'grant', itemId: questItemId, quantity: 1 },
    ], content);

    expect(validateContent(content)).toContainEqual({
      code: 'invalid_item_destination', message: 'Quest items cannot be unbanked loot: sealed-key',
    });
    expect(result).toEqual({
      ok: false,
      error: { code: 'invalid_item_destination', message: 'Quest items cannot be unbanked loot.' },
    });
    expect(normalGrant).toMatchObject({
      ok: true,
      value: { campaign: { inventory: { questItems: [questItemId] } }, expedition: { unbankedLoot: [] } },
    });
  });
});
