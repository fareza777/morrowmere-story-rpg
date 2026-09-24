import { describe, expect, it } from 'vitest';
import {
  selectCampView,
  selectCombatView,
  selectCurrentScene,
  selectInventoryView,
  selectJournalView,
  selectMerchantView,
  selectRouteView,
  selectTravelView,
} from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';
import type { RouteJunctionDefinition } from '../src/game/dungeon/types';
import { heroAttackProfile, previewAttack } from '../src/game/combat/preview';
import type { CombatState } from '../src/game/combat/types';
import type { GameStateV2 } from '../src/game/state/types';

function stateWithCombat(combat: CombatState): GameStateV2 {
  const state = makeUiGame({ screen: 'combat', enemyCount: 3 });
  return {
    ...state,
    expedition: {
      ...state.expedition!,
      currentCombat: { ...state.expedition!.currentCombat!, combat },
    },
  };
}

describe('Chronicle I UI selectors', () => {
  it('projects exact eligible junction options with authored consequences and art', () => {
    const state = makeUiGame({ screen: 'travel' });
    const junction: RouteJunctionDefinition = {
      id: 'ridge-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 2 },
      afterEventId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'],
      options: [
        { id: 'bridge', label: 'Cross the bridge', detail: 'Open ground under watch.', consequence: 'Threat +1; arrive sooner.', kind: 'shortcut', destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
        { id: 'bank', label: 'Follow the bank', detail: 'Sheltered but slow.', consequence: 'Tension +1; avoid the patrol.', kind: 'story', destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
        { id: 'tunnel', label: 'Use the tunnel', detail: 'An old culvert.', consequence: 'Reach hidden supplies.', kind: 'supply', requiredFlags: ['tunnel-key'], destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
      ],
    };
    const content = { ...UI_CONTENT, routeJunctions: new Map([[junction.id, junction]]) };
    const pending = { ...state, expedition: { ...state.expedition!, pendingRouteJunctionId: junction.id, lastTravelAction: 'scout' as const } };
    const withoutKey = selectTravelView(pending, content);
    expect(withoutKey.mode).toBe('junction');
    expect(withoutKey.actions).toHaveLength(0);
    expect(withoutKey.options.map(({ id }) => id)).toEqual(['bridge', 'bank']);
    expect(withoutKey.options[0]).toMatchObject({ label: 'Cross the bridge', detail: 'Open ground under watch.', consequence: 'Threat +1; arrive sooner.', kind: 'shortcut' });
    expect(withoutKey.options.every(({ artSrc, artAlt }) => artSrc.length > 0 && artAlt.length > 0)).toBe(true);
    const withKey = selectTravelView({ ...pending, campaign: { ...pending.campaign, flags: [...pending.campaign.flags, 'tunnel-key'] } }, content);
    expect(withKey.options.map(({ id }) => id)).toEqual(['bridge', 'bank', 'tunnel']);
  });

  it('keeps departure preparations only before the first travel action', () => {
    const state = makeUiGame({ screen: 'travel' });
    const departure = selectTravelView({ ...state, expedition: { ...state.expedition!, sceneVisitCounts: {}, lastTravelAction: null } }, UI_CONTENT);
    expect(departure.mode).toBe('departure');
    expect(departure.actions).toHaveLength(4);
    expect(departure.options).toHaveLength(0);
    const later = selectTravelView({ ...state, expedition: { ...state.expedition!, lastTravelAction: 'scout' } }, UI_CONTENT);
    expect(later.actions).toHaveLength(0);
    expect(later.options).toHaveLength(0);
  });
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

  it('projects each living target forecast from the canonical attack preview without mutating combat', () => {
    const state = makeUiGame({ screen: 'combat', enemyCount: 3 });
    const before = state.expedition!.currentCombat!.combat!;
    const target = before.enemies[0]!;
    const profile = heroAttackProfile(before.player, { type: 'attack' });
    const expected = previewAttack({
      attacker: before.player,
      target,
      ...profile,
      missedAttacks: before.missedAttacks,
    });

    const view = selectCombatView(state, UI_CONTENT)!;

    expect(view.attackForecasts[target.id]).toEqual({
      targetId: target.id,
      outcomeChances: expected.outcomeChances,
      damageRange: expected.damageRange,
    });
    expect(Object.keys(view.attackForecasts)).toEqual(before.enemies.filter((enemy) => enemy.health > 0).map((enemy) => enemy.id));
    expect(state.expedition!.currentCombat!.combat).toBe(before);
    expect(state.expedition!.currentCombat!.combat!.rngState).toBe(before.rngState);
  });

  it('uses the selected target’s guarding, block, and evasion values in its forecast', () => {
    const base = makeUiGame({ screen: 'combat', enemyCount: 3 }).expedition!.currentCombat!.combat!;
    const target = { ...base.enemies[0]!, guarding: true, blockChance: 45, evasion: 30, parryChance: 0 };
    const combat = { ...base, enemies: [target, ...base.enemies.slice(1)], enemy: target };
    const state = stateWithCombat(combat);
    const profile = heroAttackProfile(combat.player, { type: 'attack' });
    const expected = previewAttack({ attacker: combat.player, target, ...profile, missedAttacks: combat.missedAttacks });

    const forecast = selectCombatView(state, UI_CONTENT)!.attackForecasts[target.id]!;

    expect(forecast.outcomeChances).toEqual(expected.outcomeChances);
    expect(forecast.outcomeChances.blocked).toBeGreaterThan(0);
    expect(forecast.outcomeChances.glancing).toBeGreaterThan(0);
    expect(state.expedition!.currentCombat!.combat).toBe(combat);
    expect(combat.rngState).toBe(base.rngState);
  });

  it('forecasts blindness as a certain miss even when the miss streak would force a glance', () => {
    const base = makeUiGame({ screen: 'combat', enemyCount: 3 }).expedition!.currentCombat!.combat!;
    const player = { ...base.player, statuses: [{ id: 'blind', label: 'Blind', duration: 1, potency: 1 }] };
    const combat = { ...base, player, missedAttacks: 2 };
    const state = stateWithCombat(combat);
    const target = combat.enemies[0]!;
    const profile = heroAttackProfile(player, { type: 'attack' });
    const expected = previewAttack({ attacker: player, target, ...profile, missedAttacks: combat.missedAttacks });

    const forecast = selectCombatView(state, UI_CONTENT)!.attackForecasts[target.id]!;

    expect(forecast.outcomeChances).toEqual(expected.outcomeChances);
    expect(forecast.outcomeChances.miss).toBe(100);
    expect(forecast.damageRange).toEqual({ min: 0, max: 0 });
    expect(state.expedition!.currentCombat!.combat).toBe(combat);
    expect(combat.rngState).toBe(base.rngState);
  });

  it('forecasts the next non-blinded attack as a guaranteed glance after two misses', () => {
    const base = makeUiGame({ screen: 'combat', enemyCount: 3 }).expedition!.currentCombat!.combat!;
    const target = { ...base.enemies[0]!, guarding: false, blockChance: 0, evasion: 0, parryChance: 0 };
    const combat = { ...base, enemies: [target, ...base.enemies.slice(1)], enemy: target, missedAttacks: 2 };
    const state = stateWithCombat(combat);
    const profile = heroAttackProfile(combat.player, { type: 'attack' });
    const expected = previewAttack({ attacker: combat.player, target, ...profile, missedAttacks: combat.missedAttacks });

    const forecast = selectCombatView(state, UI_CONTENT)!.attackForecasts[target.id]!;

    expect(forecast.outcomeChances).toEqual(expected.outcomeChances);
    expect(forecast.outcomeChances.glancing).toBe(100);
    expect(forecast.damageRange.min).toBeGreaterThan(0);
    expect(state.expedition!.currentCombat!.combat).toBe(combat);
    expect(combat.rngState).toBe(base.rngState);
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

  it('keeps route choices atmospheric without forecasting outcomes', () => {
    const view = selectRouteView(makeUiGame({ screen: 'camp' }), UI_CONTENT);

    expect(view.routes).toEqual([
      {
        id: 'kings-road',
        label: "The King's Road",
        description: "Built for royal couriers, the broad stone road runs straight across wind-bent fields. Weathered mileposts and fallen statues mark the old kingdom's reach, while broken paving near the river flats slows a loaded wagon.",
      },
      {
        id: 'old-forest',
        label: 'The Old Forest',
        description: 'Older than the kingdom, the forest closes over narrow paths between ancient oaks and moss-slick roots. Fallen trunks and soft ground make every cart choose its way, while dusk gathers early beneath the canopy.',
      },
      {
        id: 'ruined-pass',
        label: 'The Ruined Pass',
        description: 'Once the northern road, the pass climbs through bare crags and shattered watchtowers. Loose stone, steep grades, and old switchbacks leave little room for wagons; snow lingers in the shade after the lowlands thaw.',
      },
    ]);
    expect(JSON.stringify(view.routes)).not.toMatch(/\b(?:risk|danger|ambush|encounter|merchant|trade|recovery|companion|relic|suppl(?:y|ies)|people)\b/i);
  });
});
