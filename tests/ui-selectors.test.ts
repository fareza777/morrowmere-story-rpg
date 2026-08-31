import { describe, expect, it } from 'vitest';
import {
  selectCampView,
  selectCombatView,
  selectCurrentScene,
  selectInventoryView,
  selectJournalView,
  selectMerchantView,
  selectRouteView,
} from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

describe('Chronicle I UI selectors', () => {
  it('projects exact authored scene copy and choices from content', () => {
    const view = selectCurrentScene(makeUiGame({ screen: 'story' }), UI_CONTENT);

    expect(view).toMatchObject({
      id: 'ui-story-event',
      title: 'The Orchard Ambush',
      illustrationId: 'ui-story-art',
      paragraphs: [
        'A broken medicine wagon blocks the orchard road. Three sets of boot prints leave the wreck, but only one trail carries blood.',
        'Greywatch is still a day north. Whoever staged the attack expects the road patrol to blame the nearest goblin camp.',
      ],
    });
    expect(view?.choices[0]).toMatchObject({
      id: 'follow-blood',
      label: 'Follow the blood trail',
      detail: 'Risk an ambush to reach the wounded witness before the patrol does.',
    });
  });

  it('projects every living enemy and its announced group intent', () => {
    const view = selectCombatView(makeUiGame({ screen: 'combat', enemyCount: 3 }), UI_CONTENT);

    expect(view?.enemies).toHaveLength(3);
    expect(view?.selectedTargetId).toBe('ash-goblin');
    expect(view?.enemies.map((enemy) => enemy.name)).toEqual([
      'Ash Goblin Guard',
      'Ditch Raider',
      'Hedge Archer',
    ]);
    expect(view?.enemies.every((enemy) => enemy.intent.label.length > 0)).toBe(true);
    expect(view?.enemies.every((enemy) => enemy.intent.description.length > 0)).toBe(true);
  });

  it('counts item stacks but excludes equipment and quest items from 24 field slots', () => {
    const view = selectInventoryView(
      makeUiGame({ stackedPotions: 4, equippedWeapon: true, questItem: true }),
      UI_CONTENT,
    );

    expect(view.usedSlots).toBe(1);
    expect(view.capacity).toBe(24);
    expect(view.pack).toMatchObject([{ name: 'Red Mercy', quantity: 4 }]);
    expect(view.equipment.weapon?.name).toBe('Greywatch Iron Sword');
    expect(view.questItems).toMatchObject([{ name: 'Sealed Border Order' }]);
  });

  it('uses the persisted merchant visit and resolves stock through content', () => {
    const view = selectMerchantView(makeUiGame({ screen: 'merchant' }), UI_CONTENT);

    expect(view?.name).toBe('Harlan the Road Trader');
    expect(view?.illustrationId).toBe('merchant-road-trader');
    expect(view?.stock.map((entry) => entry.name)).toEqual([
      'Weathered Traveller\'s Cloak',
      'Red Mercy',
    ]);
    expect(view?.stock.every((entry) => entry.price > 0)).toBe(true);
  });

  it('exposes qualitative companion loyalty and content-backed personal quests', () => {
    const journal = selectJournalView(
      makeUiGame({ companionId: 'mara', loyalty: 17 }),
      UI_CONTENT,
    );
    const companion = journal.companions[0];

    expect(companion?.name).toBe('Mara Venn');
    expect(companion?.loyaltyLabel).toBe('Wary');
    expect(companion?.personalQuests.map((quest) => quest.title)).toEqual([
      'A Hunter\'s Debt',
      'Tracks at Redwater',
      'The Last Arrow',
    ]);
    expect(JSON.stringify(companion)).not.toContain('17');
    expect(companion).not.toHaveProperty('loyalty');
  });

  it('builds camp HUD and objective labels from campaign and content', () => {
    const view = selectCampView(makeUiGame({ screen: 'camp', companionId: 'mara' }), UI_CONTENT);

    expect(view.hero).toMatchObject({ name: 'Rowan', resourceLabel: 'Focus' });
    expect(view.objective.title).toBe('The Orchard Ambush');
    expect(view.activeCompanion?.name).toBe('Mara Venn');
  });

  it('uses the immutable Chronicle route catalog for understandable risk labels', () => {
    const view = selectRouteView(makeUiGame({ screen: 'camp' }), UI_CONTENT);

    expect(view.routes.map((route) => [route.label, route.riskLabel])).toEqual([
      ["The King's Road", 'Lower danger'],
      ['The Old Forest', 'Ambush risk · Moderate danger'],
      ['The Ruined Pass', 'High danger'],
    ]);
  });
});
