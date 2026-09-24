import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatPanel } from '../src/components/CombatPanel';
import { EnemyParty } from '../src/components/EnemyParty';
import { selectCombatView, selectInventoryView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

describe('group combat interface', () => {
  it('updates the live forecast for the selected enemy without stealing focus or hiding battle actions', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ screen: 'combat', enemyCount: 3 });
    const view = selectCombatView(state, UI_CONTENT)!;
    render(<CombatPanel view={view} inventory={selectInventoryView(state, UI_CONTENT)} transitionEvents={[]} onAction={vi.fn()} />);

    const forecast = screen.getByRole('region', { name: 'Attack forecast' });
    expect(forecast).toHaveAttribute('aria-live', 'polite');
    expect(forecast).toHaveTextContent('Ash Goblin Guard');
    const targetButton = screen.getByRole('button', { name: 'Target Ditch Raider' });
    await user.click(targetButton);

    expect(forecast).toHaveTextContent('Ditch Raider');
    expect(targetButton).toHaveFocus();
    expect(screen.getByText(view.enemies[1]!.intent.description)).toBeVisible();
    for (const label of ['Attack', 'Guard', 'Technique', 'Consumable', 'Flee']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') })).toBeVisible();
    }
    expect(screen.getByRole('button', { name: /^Companion/i })).toBeVisible();
  });

  it('hides zero-probability outcomes and preserves tiny chances and zero damage', () => {
    const state = makeUiGame({ screen: 'combat' });
    const base = selectCombatView(state, UI_CONTENT)!;
    const enemy = base.enemies[0]!;
    const forecast = base.attackForecasts[enemy.id]!;
    const view = {
      ...base,
      attackForecasts: {
        ...base.attackForecasts,
        [enemy.id]: {
          ...forecast,
          outcomeChances: { miss: 0, glancing: 0.04, hit: 99.96, critical: 0, blocked: 0, parried: 0 },
          damageRange: { min: 0, max: 0 },
        },
      },
    };
    render(<CombatPanel view={view} inventory={selectInventoryView(state, UI_CONTENT)} transitionEvents={[]} onAction={vi.fn()} />);

    const region = screen.getByRole('region', { name: 'Attack forecast' });
    expect(region).toHaveTextContent('Glancing hit');
    expect(region).toHaveTextContent('<0.1%');
    expect(region).toHaveTextContent('Damage: 0');
    expect(region).not.toHaveTextContent('Miss');
    expect(region).not.toHaveTextContent('Critical hit');
    expect(region).not.toHaveTextContent('Blocked');
    expect(region).not.toHaveTextContent('Parried');
    expect(region).not.toHaveTextContent('0.0%');
  });

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
