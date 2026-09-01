import type { ReactNode } from 'react';
import type { StoryViewModel } from '../ui/types';
import { ChoiceList } from './ChoiceList';
import { ArrowRight } from './icons';

interface StoryPanelProps {
  readonly view: StoryViewModel;
  readonly onChoose: (choiceId: string) => void;
  readonly onContinue: () => void;
  readonly onNarrate?: () => void;
  readonly extraActions?: ReactNode;
}

export function StoryPanel({ view, onChoose, onContinue, onNarrate, extraActions }: StoryPanelProps) {
  return (
    <article className="story-panel">
      <header>
        <p>On the road</p>
        <h1>{view.title}</h1>
        {onNarrate && <button className="story-voice-button" type="button" onClick={onNarrate}>Play narration</button>}
      </header>
      <div className="story-prose">{view.paragraphs.map((paragraph, index) => <p key={`${view.id}-paragraph-${index}`}>{paragraph}</p>)}</div>
      {view.resolved ? (
        <section className="outcome-panel" role="status" aria-live="polite" aria-atomic="true">
          {view.resolution && <h2>{view.resolution.statusLabel}</h2>}
          {(view.resolution?.outcome ?? view.outcome) && <p className="outcome-copy">{view.resolution?.outcome ?? view.outcome}</p>}
          {view.resolution && view.resolution.effectSummary.length > 0 && <ul className="outcome-effects" aria-label="Applied consequences">{view.resolution.effectSummary.map((effect) => <li key={effect}>{effect}</li>)}</ul>}
          <button className="button button-primary" type="button" onClick={onContinue}>
            {view.resolution?.continueLabel ?? 'Continue'} <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
          {extraActions}
        </section>
      ) : (
        view.choices.length > 0 ? <ChoiceList choices={view.choices} onChoose={onChoose} /> : <button className="button button-primary" type="button" onClick={onContinue}>Continue <ArrowRight size={18} weight="bold" aria-hidden="true" /></button>
      )}
    </article>
  );
}
