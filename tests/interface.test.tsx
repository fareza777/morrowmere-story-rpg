import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { GameShell } from '../src/components/GameShell';
import { createCombat } from '../src/game/combat';
import { ENEMIES } from '../src/game/content/enemies';
import { startNewRun } from '../src/game/state';

describe('portrait game interface', () => {
  it('starts a Mage chronicle from the title screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'New Chronicle' }));
    expect(screen.getByRole('heading', { name: 'Your chronicle remembers' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Skip introduction' }));
    expect(screen.getByRole('heading', { name: 'Choose your path' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Mage/i }));
    await user.click(screen.getByRole('button', { name: 'Begin Chronicle' }));

    expect(screen.getByRole('heading', { name: 'When the Black Rain Rings' })).toBeVisible();
    expect(screen.getByText(/The rain begins at your burial/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  it('shows announced enemy intent and all combat actions', () => {
    const run = startNewRun({ heroClass: 'warrior', seed: 44 });
    const combat = createCombat(run.hero, ENEMIES[0], 17);
    const state = { ...run, screen: 'combat' as const, combat };

    render(<GameShell state={state} dispatch={() => undefined} />);

    expect(screen.getByText('Enemy intent')).toBeVisible();
    expect(screen.getByText(combat.intentText)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Attack' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Guard' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Technique/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Flee' })).toBeVisible();
  });

  it('opens readable settings and updates text scale', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'New Chronicle' }));
    await user.click(screen.getByRole('button', { name: 'Skip introduction' }));
    await user.click(screen.getByRole('button', { name: 'Begin Chronicle' }));

    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Text size' })).toHaveValue('100');
    expect(screen.getByRole('checkbox', { name: 'Sound effects' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'Reduce motion' })).toBeVisible();
  });

  it('shows concrete inventory names and capacity', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'New Chronicle' }));
    await user.click(screen.getByRole('button', { name: 'Skip introduction' }));
    await user.click(screen.getByRole('button', { name: 'Begin Chronicle' }));

    await user.click(screen.getByRole('button', { name: 'Open inventory' }));

    expect(screen.getByRole('dialog', { name: 'Inventory' })).toBeVisible();
    expect(screen.getByText('Red Mercy')).toBeVisible();
    expect(screen.getByText('1 / 12 carried')).toBeVisible();
  });

  it('announces the active scene when narration is enabled', () => {
    const run = startNewRun({ heroClass: 'warden', seed: 71 });
    const state = { ...run, settings: { ...run.settings, narration: true } };
    render(<GameShell state={state} dispatch={() => undefined} />);

    expect(screen.getByText(/Narration: When the Black Rain Rings/)).toHaveAttribute('aria-live', 'polite');
  });
});
