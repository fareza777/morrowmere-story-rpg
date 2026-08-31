import type { ReactNode } from 'react';
import type { StoryViewModel } from '../ui/types';
import { ChoiceList } from './ChoiceList';
import { ArrowRight } from './icons';

interface StoryPanelProps {
  readonly view: StoryViewModel;
  readonly onChoose: (choiceId: string) => void;
  readonly onContinue: () => void;
  readonly extraActions?: ReactNode;
}

export function StoryPanel({ view, onChoose, onContinue, extraActions }: StoryPanelProps) {
  return (
    <article className="story-panel">
      <header>
        <p>On the road</p>
        <h1>{view.title}</h1>
      </header>
      <div className="story-prose">{view.paragraphs.map((paragraph, index) => <p key={`${view.id}-paragraph-${index}`}>{paragraph}</p>)}</div>
      {view.resolved ? (
        <div className="outcome-panel" role="status">
          {view.outcome && <p>{view.outcome}</p>}
          <button className="button button-primary" type="button" onClick={onContinue}>
            Continue <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
          {extraActions}
        </div>
      ) : (
        view.choices.length > 0 ? <ChoiceList choices={view.choices} onChoose={onChoose} /> : <button className="button button-primary" type="button" onClick={onContinue}>Continue <ArrowRight size={18} weight="bold" aria-hidden="true" /></button>
      )}
    </article>
  );
}
