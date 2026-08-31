import axe from 'axe-core';
import { render } from '@testing-library/react';
import App from '../src/App';
import { GameShell } from '../src/components/GameShell';
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
});
