import type { GameCommand, GameState } from '../game/state';
import { ChoiceList } from './ChoiceList';
import { ArrowRight } from './icons';

interface StoryPanelProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
}

export function StoryPanel({ state, dispatch }: StoryPanelProps) {
  const node = state.route[state.routeIndex];
  if (!node) return null;
  return (
    <article className="story-panel">
      <header>
        <p>{node.kind === 'story' ? 'On the road' : node.kind}</p>
        <h1>{node.title}</h1>
      </header>
      <div className="story-prose"><p>{node.text}</p></div>
      {state.lastOutcome ? (
        <div className="outcome-panel" role="status">
          <p>{state.lastOutcome}</p>
          <button className="button button-primary" type="button" onClick={() => dispatch({ type: 'ADVANCE' })}>
            Continue <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ChoiceList choices={node.choices} onChoose={(choiceId) => dispatch({ type: 'CHOOSE', choiceId })} />
      )}
    </article>
  );
}
