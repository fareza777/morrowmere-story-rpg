import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefeatPanel } from '../src/components/DefeatPanel';
import { JournalSheet } from '../src/components/JournalSheet';
import { RewardPanel } from '../src/components/RewardPanel';
import { SettingsSheet } from '../src/components/SettingsSheet';
import { selectInventoryView, selectJournalView } from '../src/ui/selectors';
import type { UiSettings } from '../src/ui/types';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true,
  reducedHaptics: false, sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9,
  captions: true, voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

describe('journal, settings, reward, and defeat', () => {
  it('shows authored objective, evidence, qualitative loyalty, and companion quests', async () => {
    const user = userEvent.setup();
    const state = makeUiGame({ companionId: 'mara', loyalty: 60 });
    render(<JournalSheet view={selectJournalView(state, UI_CONTENT)} onSetActiveCompanion={vi.fn()} onReplayOpening={vi.fn()} onReplayTutorials={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Current objective')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Evidence' }));
    expect(screen.getByText('Royal Armory Arrow')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Companions' }));
    expect(screen.getByText('Respectful', { exact: true })).toBeVisible();
    expect(screen.queryByText('60')).not.toBeInTheDocument();
    expect(screen.getByText("A Hunter's Debt")).toBeVisible();
  });

  it('updates the complete readable settings set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SettingsSheet settings={SETTINGS} onChange={onChange} onClose={vi.fn()} />);
    expect(screen.getByRole('slider', { name: 'Text size' })).toHaveAttribute('max', '140');
    for (const name of ['Sound effects volume', 'Music volume', 'Voice volume']) {
      expect(screen.getByRole('slider', { name })).toBeVisible();
    }
    expect(screen.getByRole('checkbox', { name: 'Haptics' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'Captions' })).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'High contrast' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ highContrast: true }));
  });

  it('keeps immediate base rewards visible when the optional bonus is unavailable', () => {
    render(<RewardPanel view={{ rewardId: 'r1', gold: 18, xp: 12, items: [], bonusStatus: 'unavailable' }} onClaim={vi.fn()} />);
    expect(screen.getByText('18 gold received')).toBeVisible();
    expect(screen.getByText('12 XP received')).toBeVisible();
    expect(screen.getByText('Bonus video unavailable. Your reward is safe.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  it('can decline an item reward and locks every settlement control while an ad is pending', () => {
    const rewardItem = selectInventoryView(makeUiGame({ stackedPotions: 1 }), UI_CONTENT).pack[0]!;
    const onClaim = vi.fn();
    const { rerender } = render(<RewardPanel view={{ rewardId: 'r2', gold: 18, xp: 12, items: [rewardItem], bonusStatus: 'available' }} onClaim={onClaim} onRequestBonus={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Continue without an item' })).toBeEnabled();
    rerender(<RewardPanel view={{ rewardId: 'r2', gold: 18, xp: 12, items: [rewardItem], bonusStatus: 'pending' }} onClaim={onClaim} onRequestBonus={vi.fn()} />);

    expect(screen.getByRole('button', { name: `Choose ${rewardItem.name}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue without an item' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Watch Ad — Double Battle Gold' })).toBeDisabled();
  });

  it('offers all three icon-labeled defeat exits with restart confirmation', async () => {
    const user = userEvent.setup();
    const onReturnToCamp = vi.fn();
    const onRestartChapter = vi.fn();
    const onMainMenu = vi.fn();
    render(<DefeatPanel onReturnToCamp={onReturnToCamp} onRestartChapter={onRestartChapter} onMainMenu={onMainMenu} />);
    await user.click(screen.getByRole('button', { name: 'Return to Last Camp' }));
    await user.click(screen.getByRole('button', { name: 'Restart Chapter' }));
    expect(screen.getByRole('dialog', { name: 'Restart this chapter?' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Restart Chapter from Beginning' }));
    await user.click(screen.getByRole('button', { name: 'Main Menu' }));
    expect(onReturnToCamp).toHaveBeenCalledOnce();
    expect(onRestartChapter).toHaveBeenCalledOnce();
    expect(onMainMenu).toHaveBeenCalledOnce();
  });
});
