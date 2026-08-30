import axe from 'axe-core';
import { render } from '@testing-library/react';
import App from '../src/App';
import { GameShell } from '../src/components/GameShell';
import { startNewRun } from '../src/game/state';

describe('accessibility baseline', () => {
  it('has no serious violations on the title screen', async () => {
    render(<App />);

    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });

  it('has no serious violations on the story screen', async () => {
    const state = startNewRun({ heroClass: 'mage', seed: 71 });
    render(<GameShell state={state} dispatch={() => undefined} />);

    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
});
