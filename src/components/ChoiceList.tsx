import { ArrowRight, LockKey } from '@phosphor-icons/react';
import type { StoryChoiceViewModel } from '../ui/types';

interface ChoiceListProps {
  readonly choices: readonly StoryChoiceViewModel[];
  readonly onChoose: (choiceId: string) => void;
}

export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <div className="choice-list" aria-label="Available choices">
      {choices.map((choice) => {
        const reasonId = `choice-${choice.id}-reason`;
        const checkId = `choice-${choice.id}-check`;
        const describedBy = [choice.check ? checkId : null, choice.unavailableReason ? reasonId : null].filter(Boolean).join(' ') || undefined;
        return <button key={choice.id} className="choice-button" type="button" aria-label={choice.label} aria-describedby={describedBy} disabled={choice.disabled} onClick={() => onChoose(choice.id)}><span><strong>{choice.label}</strong><small>{choice.detail}</small>{choice.check && <small id={checkId} className="choice-check">{choice.check.statLabel} check · {choice.check.difficultyLabel} · {choice.check.chance}% success</small>}{choice.unavailableReason && <em id={reasonId}><LockKey size={14} aria-hidden="true" />{choice.unavailableReason}</em>}</span><ArrowRight size={20} weight="bold" aria-hidden="true" /></button>;
      })}
    </div>
  );
}
