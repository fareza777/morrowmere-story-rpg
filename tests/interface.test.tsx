import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameShell } from '../src/components/GameShell';
import type { UiSettings } from '../src/ui/types';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

function renderShell(state = makeUiGame(), dispatch = vi.fn()) {
  return {
    dispatch,
    ...render(<GameShell state={state} content={UI_CONTENT} transitionEvents={[]} dispatch={dispatch} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} now={() => '2026-09-01T00:00:00.000Z'} />),
  };
}

describe('integrated portrait interface', () => {
  beforeEach(() => {
    window.localStorage.removeItem('morrowmere.tutorials.v1');
  });

  it('keeps the current story behind independent readable overlays', async () => {
    const user = userEvent.setup();
    renderShell(makeUiGame({ stackedPotions: 2 }));
    expect(screen.getByRole('heading', { name: 'The Orchard Ambush' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Pack' }));
    expect(screen.getByRole('dialog', { name: 'Inventory' })).toBeVisible();
    expect(screen.getByText('Quantity 2')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close Inventory' }));
    expect(screen.getByRole('heading', { name: 'The Orchard Ambush' })).toBeVisible();
  });

  it('issues a typed V2 choice command without changing content in the component', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Follow the blood trail' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'resolve-choice', eventId: 'ui-story-event', choiceId: 'follow-blood', updatedAt: '2026-09-01T00:00:00.000Z' });
  });

  it('always exposes camp, chapter, and menu recovery after defeat', () => {
    renderShell(makeUiGame({ screen: 'defeat' }));
    expect(screen.getByRole('button', { name: 'Return to Last Camp' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Restart Chapter' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Main Menu' })).toBeVisible();
  });

  it('keeps a dismissed contextual tutorial hidden after the shell remounts', async () => {
    const user = userEvent.setup();
    const first = renderShell();
    expect(screen.getByLabelText('Choices have consequences tutorial')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    first.unmount();
    cleanup();

    renderShell();
    expect(screen.queryByLabelText('Choices have consequences tutorial')).not.toBeInTheDocument();
  });
});
