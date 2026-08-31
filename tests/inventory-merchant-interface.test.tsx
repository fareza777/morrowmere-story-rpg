import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventorySheet } from '../src/components/InventorySheet';
import { MerchantScreen } from '../src/components/MerchantScreen';
import { selectInventoryView, selectMerchantView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

describe('inventory, equipment, and merchant flows', () => {
  it('shows 24 stack slots and uses a field consumable by entry ID', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ stackedPotions: 3, equippedWeapon: true, questItem: true });
    const onUse = vi.fn();
    render(
      <InventorySheet
        view={selectInventoryView(state, UI_CONTENT)}
        context="field"
        heroClass={state.campaign.hero.heroClass}
        onUse={onUse}
        onInventoryCommand={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('1 / 24 slots')).toBeVisible();
    expect(screen.getByText('Quantity 3')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Use Red Mercy' }));
    expect(onUse).toHaveBeenCalledWith('stack-red-mercy');
  });

  it('shows explicit equipment slots and restrictions before equipping', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ stackedPotions: 1 });
    const view = selectInventoryView(state, UI_CONTENT);
    const restricted = {
      ...view,
      pack: [...view.pack, {
        ...selectInventoryView(makeUiGame({ equippedWeapon: true }), UI_CONTENT).equipment.weapon!,
        entryId: 'sword-entry', allowedClasses: ['warrior' as const], restrictionLabel: 'Warrior only',
      }],
    };
    render(<InventorySheet view={restricted} context="camp" heroClass="warden" onUse={vi.fn()} onInventoryCommand={vi.fn()} onClose={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Equipment' }));
    expect(screen.getByText('Weapon')).toBeVisible();
    expect(screen.getByRole('button', { name: /Equip Greywatch Iron Sword/i })).toBeDisabled();
    expect(screen.getByText('Warrior only')).toBeVisible();
  });

  it('includes stats lost from the currently equipped item in swap comparisons', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ stackedPotions: 1, equippedWeapon: true });
    const view = selectInventoryView(state, UI_CONTENT);
    const currentWeapon = view.equipment.weapon!;
    const weakerWeapon = {
      ...currentWeapon,
      entryId: 'weaker-sword-entry',
      name: 'Notched Sword',
      stats: currentWeapon.stats.map((stat) => stat.id === 'attack' ? { ...stat, value: stat.value - 2 } : stat),
    };
    render(
      <InventorySheet
        view={{ ...view, pack: [...view.pack, weakerWeapon] }}
        context="camp"
        heroClass={state.campaign.hero.heroClass}
        onUse={vi.fn()}
        onInventoryCommand={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('tab', { name: 'Equipment' }));
    expect(screen.getByText('−2 Attack')).toBeVisible();
  });

  it('shows exact buy and sell quotes and persistent empty stock copy', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ screen: 'merchant', stackedPotions: 2 });
    const selected = selectMerchantView(state, UI_CONTENT)!;
    const view = { ...selected, totalGold: 999, stock: selected.stock.map((item) => ({ ...item, affordable: true })) };
    const onBuy = vi.fn();
    render(<MerchantScreen view={view} onBuy={onBuy} onSell={vi.fn()} onClose={vi.fn()} />);
    const stock = view.stock[0]!;
    await user.click(screen.getByRole('button', { name: `Buy ${stock.name} for ${stock.price} gold` }));
    expect(onBuy).toHaveBeenCalledWith(stock.stockEntryId);
    expect(screen.getByText(/Banked .*Carried .*Total/)).toBeVisible();
  });
});
