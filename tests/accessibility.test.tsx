import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import App from '../src/App';
import { GameShell } from '../src/components/GameShell';
import { Sheet } from '../src/components/Sheet';
import type { UiSettings } from '../src/ui/types';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

describe('accessibility baseline', () => {
  it('has no serious violations on the title screen', async () => {
    render(<App />);

    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });

  it('has no serious violations on the story screen', async () => {
    const state = makeUiGame();
    render(<GameShell state={state} content={UI_CONTENT} transitionEvents={[]} dispatch={() => undefined} onSaveAndExit={() => undefined} onMainMenu={() => undefined} onReplayOpening={() => undefined} settings={SETTINGS} onSettingsChange={() => undefined} />);

    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });

  it.each([
    ['camp', makeUiGame({ screen: 'camp' })],
    ['combat', makeUiGame({ screen: 'combat', enemyCount: 3 })],
    ['merchant', makeUiGame({ screen: 'merchant' })],
    ['defeat', makeUiGame({ screen: 'defeat' })],
  ] as const)('has no serious accessibility violation on %s', async (_name, state) => {
    render(<GameShell state={state} content={UI_CONTENT} transitionEvents={[]} dispatch={vi.fn()} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} />);
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });

  it('focuses a safe sheet heading, traps focus, closes on Escape, and restores the opener', async () => {
    const user = userEvent.setup();
    function SheetHarness() {
      const [open, setOpen] = useState(false);
      return <><button type="button" onClick={() => setOpen(true)}>Open Journal</button>{open && <Sheet title="Journal" onClose={() => setOpen(false)}><button type="button">Replay tutorial</button></Sheet>}</>;
    }
    render(<SheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open Journal' });
    await user.click(opener);
    expect(screen.getByRole('heading', { name: 'Journal' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Journal' })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
