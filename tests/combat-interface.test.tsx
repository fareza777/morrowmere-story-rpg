import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatPanel } from '../src/components/CombatPanel';
import { EnemyParty } from '../src/components/EnemyParty';
import { selectCombatView, selectInventoryView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

describe('group combat interface', () => {
  it('targets one of three enemies and issues a companion command', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ screen: 'combat', enemyCount: 3, companionId: 'mara', stackedPotions: 2 });
    const view = selectCombatView(state, UI_CONTENT)!;
    const onAction = vi.fn();
    render(
      <CombatPanel
        view={view}
        inventory={selectInventoryView(state, UI_CONTENT)}
        transitionEvents={[]}
        onAction={onAction}
      />,
    );

    expect(screen.getAllByRole('button', { name: /Target / })).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: /Target Ditch Raider/i }));
    await user.click(screen.getByRole('button', { name: /Mara Venn:/i }));
    expect(onAction).toHaveBeenCalledWith({ type: 'companion', targetId: view.enemies[1]!.id });
  });

  it('shows all six actions, consumable turn cost, and boss flee restriction', () => {
    const state = makeUiGame({ screen: 'combat', companionId: 'mara', stackedPotions: 2 });
    const base = selectCombatView(state, UI_CONTENT)!;
    const view = {
      ...base,
      enemies: [{ ...base.enemies[0]!, isBoss: true }],
      actions: base.actions.map((action) => action.id === 'flee'
        ? { ...action, available: false, unavailableReason: 'You cannot flee from a boss battle.' }
        : action),
    };
    render(<CombatPanel view={view} inventory={selectInventoryView(state, UI_CONTENT)} transitionEvents={[]} onAction={vi.fn()} />);

    for (const label of ['Attack', 'Guard', 'Technique', 'Consumable', 'Flee']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') })).toBeVisible();
    }
    expect(screen.getByText('Using an item spends this turn.')).toBeVisible();
    expect(screen.getByText('You cannot flee from a boss battle.')).toBeVisible();
  });

  it('labels intents and statuses without relying on color', () => {
    const base = selectCombatView(makeUiGame({ screen: 'combat' }), UI_CONTENT)!;
    const enemies = base.enemies.map((enemy, index) => index === 0
      ? { ...enemy, statuses: [{ id: 'guarded', label: 'Guarding ally', duration: 2, potency: 1 }] }
      : enemy);
    render(<EnemyParty enemies={enemies} selectedTargetId={enemies[0]!.id} onTarget={vi.fn()} feedbackClass="is-blocked" />);
    expect(screen.getByText('Guarding ally · 2 turns')).toBeVisible();
    expect(screen.getByText(base.enemies[0]!.intent.description)).toBeVisible();
  });

  it('shows mobile-safe generic enemy art and replaces a missing family with its clean species fallback', () => {
    const base = selectCombatView(makeUiGame({ screen: 'combat' }), UI_CONTENT)!;
    const { container } = render(<EnemyParty enemies={base.enemies} selectedTargetId={base.enemies[0]!.id} onTarget={vi.fn()} />);
    const portrait = container.querySelector<HTMLImageElement>('.enemy-card:first-child .enemy-portrait img')!;
    expect(portrait).toHaveAttribute('src', '/assets/enemies/enemy-ash-goblin-guard.webp');
    fireEvent.error(portrait);
    expect(portrait).toHaveAttribute('src', '/assets/enemies/goblin.webp');
    fireEvent.error(portrait);
    expect(portrait).toHaveAttribute('hidden');
  });

  it('selects a Chronicle portrait before the generic art-family fallback', () => {
    const state = makeUiGame({ screen: 'combat' });
    const definition = UI_CONTENT.enemies.get('ash-goblin' as never)!;
    const portraitDefinition = {
      ...definition,
      portraitId: 'enemy-portrait-goblin-cutpurse-01',
    };
    const content = {
      ...UI_CONTENT,
      enemies: new Map(UI_CONTENT.enemies).set(definition.id as never, portraitDefinition),
    };
    const enemy = selectCombatView(state, content)!.enemies[0]!;
    expect(enemy).toMatchObject({
      illustrationId: 'enemy-portrait-goblin-cutpurse-01',
      illustrationKind: 'chronicle-portrait',
      artFamily: 'enemy-ash-goblin-guard',
    });
    const { container } = render(<EnemyParty enemies={[enemy]} selectedTargetId={enemy.id} onTarget={vi.fn()} />);
    const portrait = container.querySelector<HTMLImageElement>('.enemy-portrait img')!;
    expect(portrait).toHaveAttribute('src', '/assets/chronicle1/enemies/enemy-portrait-goblin-cutpurse-01.webp');
    fireEvent.error(portrait);
    expect(portrait).toHaveAttribute('src', '/assets/enemies/enemy-ash-goblin-guard.webp');
  });

  it('routes Chronicle boss portraits to the boss catalog', () => {
    const base = selectCombatView(makeUiGame({ screen: 'combat' }), UI_CONTENT)!;
    const enemy = {
      ...base.enemies[0]!,
      illustrationId: 'enemy-portrait-boss-black-banner-commander',
      illustrationKind: 'chronicle-portrait' as const,
    };
    const { container } = render(<EnemyParty enemies={[enemy]} selectedTargetId={enemy.id} onTarget={vi.fn()} />);
    expect(container.querySelector('.enemy-portrait img')).toHaveAttribute(
      'src',
      '/assets/chronicle1/bosses/enemy-portrait-boss-black-banner-commander.webp',
    );
  });
});
