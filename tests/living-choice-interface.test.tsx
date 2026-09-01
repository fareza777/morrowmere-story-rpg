import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { StoryPanel } from '../src/components/StoryPanel';
import { selectCurrentScene } from '../src/ui/selectors';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChoiceId, EncounterId, EventId, ItemId } from '../src/game/domain/ids';
import { reduceGame } from '../src/game/state';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';
import '../src/styles/base.css';
import '../src/styles/game.css';

const eventId = (value: string) => value as EventId;
const choiceId = (value: string) => value as ChoiceId;
const encounterId = (value: string) => value as EncounterId;
const itemId = (value: string) => value as ItemId;

const CHECKED_EVENT: ChronicleEvent = {
  id: eventId('ui-checked-choice-event'),
  chapterId: 'ch01',
  type: 'main',
  family: 'sealed-tollhouse',
  anchorOrder: 2,
  illustrationId: 'ui-story-art',
  title: 'The Sealed Tollhouse',
  narrative: [
    'Rain darkens the tollhouse steps while a lantern burns behind the shuttered upper window. The door latch is old, but its brass face has been polished by recent use.',
  ],
  eligibility: {},
  cooldownRuns: 0,
  oneShot: true,
  choices: [{
    id: choiceId('wait-for-daylight'),
    label: 'Wait for daylight',
    detail: 'Keep clear of the shuttered tollhouse until dawn.',
    outcome: 'You wait for a safer hour.',
    effects: [],
  }, {
    id: choiceId('pick-the-latch'),
    label: 'Pick the latch',
    detail: 'Work the worn mechanism before the watcher returns.',
    check: {
      stat: 'cunning',
      difficulty: 7,
      success: {
        outcome: 'The latch turns without a sound, and the tollhouse yields its first answer.',
        effects: [{ type: 'xp', amount: 12 }],
        continueLabel: 'Inspect the signal room',
      },
      failure: {
        outcome: 'The pick snaps in the lock before you can draw it free.',
        effects: [{ type: 'combat', encounterId: encounterId('hidden-cellar-fight') }],
      },
    },
  }],
};

const PARITY_EVENT: ChronicleEvent = {
  ...CHECKED_EVENT,
  id: eventId('ui-check-parity-event'),
  choices: [{
    id: choiceId('parity-pick'),
    label: 'Pick the brass latch',
    detail: 'Set a tool against the rain-slick lock.',
    check: {
      stat: 'cunning',
      difficulty: 12,
      modifiers: [{ label: 'Rain-slick brass', amount: -2 }],
      success: {
        outcome: 'The latch yields.',
        effects: [],
      },
      failure: {
        outcome: 'The latch holds.',
        effects: [],
      },
    },
  }],
};

const CHECKED_CONTENT: ContentIndex = {
  ...UI_CONTENT,
  events: new Map([...UI_CONTENT.events, [CHECKED_EVENT.id, CHECKED_EVENT]]),
};

function checkedScene(resolved: boolean) {
  const state = makeUiGame();
  return {
    ...state,
    expedition: {
      ...state.expedition!,
      currentSceneId: CHECKED_EVENT.id,
      sceneVisitCounts: { [CHECKED_EVENT.id]: 1 },
      sceneResolution: resolved ? {
        eventId: CHECKED_EVENT.id,
        choiceId: choiceId('pick-the-latch'),
        resultKind: 'success' as const,
        chance: 65,
        roll: 41,
        outcome: 'The latch turns without a sound, and the tollhouse yields its first answer.',
        effectSummary: ['+12 XP'],
        nextSceneId: null,
        continueLabel: 'Inspect the signal room',
      } : null,
    },
  };
}

function sceneWithResult(
  resultKind: 'critical-success' | 'success' | 'failure' | 'critical-failure',
  choice = choiceId('pick-the-latch'),
) {
  const state = checkedScene(false);
  return {
    ...state,
    expedition: {
      ...state.expedition!,
      sceneResolution: {
        eventId: CHECKED_EVENT.id,
        choiceId: choice,
        resultKind,
        chance: 65,
        roll: resultKind === 'critical-success' ? 3 : resultKind === 'critical-failure' ? 98 : 41,
        outcome: 'The tollhouse keeps its answer close.',
        effectSummary: [],
        nextSceneId: null,
        continueLabel: null,
      },
    },
  };
}

function cssRule(selector: string): CSSStyleRule {
  const rule = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .find((candidate): candidate is CSSStyleRule => candidate instanceof CSSStyleRule && candidate.selectorText === selector);
  if (!rule) throw new Error(`Missing ${selector} CSS rule.`);
  return rule;
}

describe('living choice interface', () => {
  it('shows only the player-facing check information before a choice is made', () => {
    const view = selectCurrentScene(checkedScene(false), CHECKED_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Pick the latch' })).toHaveTextContent('Cunning check · Moderate · 65% success');
    expect(screen.queryByText(/hidden cellar fight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/latch turns without a sound/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+12 XP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mara/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret aftermath/i)).not.toBeInTheDocument();
  });

  it('announces a resolved check with its applied effects and contextual continuation', () => {
    const view = selectCurrentScene(checkedScene(true), CHECKED_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('heading', { name: 'Check succeeded' })).toBeInTheDocument();
    expect(screen.getByText('+12 XP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspect the signal room' })).toBeInTheDocument();
  });

  it('keeps long narrative prose distinct from short resolved copy', () => {
    const view = selectCurrentScene(checkedScene(true), CHECKED_CONTENT)!;
    const { container } = render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(container.querySelector('.story-prose')).toBeInTheDocument();
    expect(container.querySelector('.outcome-copy')).toHaveTextContent('The latch turns without a sound, and the tollhouse yields its first answer.');
    expect(screen.getByRole('button', { name: 'Inspect the signal room' })).toHaveClass('button-primary');
  });

  it('matches the reducer chance after equipment, companion, low-vitals, and authored modifiers apply', () => {
    const content: ContentIndex = {
      ...CHECKED_CONTENT,
      events: new Map([...CHECKED_CONTENT.events, [PARITY_EVENT.id, PARITY_EVENT]]),
      items: new Map([...UI_CONTENT.items, [itemId('iron-sword'), { ...UI_CONTENT.items.get(itemId('iron-sword'))!, tags: ['tool'] }]]),
    };
    const state = makeUiGame({ equippedWeapon: true, companionId: 'mara' });
    const current = {
      ...state,
      expedition: {
        ...state.expedition!,
        currentSceneId: PARITY_EVENT.id,
        sceneResolution: null,
        sceneVisitCounts: { [PARITY_EVENT.id]: 1 },
        heroVitals: { ...state.expedition!.heroVitals, resource: 0 },
      },
    };

    const displayedChance = selectCurrentScene(current, content)!.choices[0]!.check?.chance;
    const resolved = reduceGame(current, { type: 'resolve-choice', eventId: PARITY_EVENT.id, choiceId: choiceId('parity-pick'), updatedAt: '2026-09-01T00:05:00.000Z' }, content);

    expect(displayedChance).toBe(43);
    expect(resolved.state.expedition?.sceneResolution?.chance).toBe(43);
  });

  it.each([
    ['success', choiceId('pick-the-latch'), 'Check succeeded'],
    ['failure', choiceId('pick-the-latch'), 'Check failed'],
    ['critical-success', choiceId('pick-the-latch'), 'Critical success'],
    ['critical-failure', choiceId('pick-the-latch'), 'Critical failure'],
    ['success', choiceId('legacy-checked:ui-checked-choice-event'), 'Check succeeded'],
  ] as const)('uses the stored %s result kind for its result heading', (resultKind, choice, heading) => {
    const view = selectCurrentScene(sceneWithResult(resultKind, choice), CHECKED_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('describes each choice detail and keeps 360px, 200% text-scale feedback readable', () => {
    const view = selectCurrentScene(checkedScene(false), CHECKED_CONTENT)!;
    const { container } = render(<div className="game-shell" style={{ '--text-scale': 2, width: '360px' } as CSSProperties}><StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} /></div>);
    const choice = screen.getByRole('button', { name: 'Pick the latch' });

    expect(choice).toHaveAccessibleDescription('Work the worn mechanism before the watcher returns. Cunning check · Moderate · 65% success');
    expect(container.querySelector('.game-shell')).toHaveStyle('--text-scale: 2');
    expect(cssRule('.choice-check').style.fontSize).toContain('var(--text-scale');
    expect(cssRule('.outcome-copy').style.fontSize).toContain('var(--text-scale');
    expect(cssRule('.choice-button > span, .reward-list button > span').style.minInlineSize).toBe('0px');
  });
});
