import { render, screen } from '@testing-library/react';
import { StoryPanel } from '../src/components/StoryPanel';
import { selectCurrentScene } from '../src/ui/selectors';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChoiceId, EncounterId, EventId } from '../src/game/domain/ids';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const eventId = (value: string) => value as EventId;
const choiceId = (value: string) => value as ChoiceId;
const encounterId = (value: string) => value as EncounterId;

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

describe('living choice interface', () => {
  it('shows only the player-facing check information before a choice is made', () => {
    const view = selectCurrentScene(checkedScene(false), CHECKED_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Pick the latch' })).toHaveTextContent('Cunning check · Moderate · 65% success');
    expect(screen.queryByText(/hidden cellar fight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/latch turns without a sound/i)).not.toBeInTheDocument();
  });

  it('announces a resolved check with its applied effects and contextual continuation', () => {
    const view = selectCurrentScene(checkedScene(true), CHECKED_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('heading', { name: 'Cunning check succeeded' })).toBeInTheDocument();
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
});
