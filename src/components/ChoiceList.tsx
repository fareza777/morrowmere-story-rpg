import type { EventChoice } from '../game/types';
import { ArrowRight } from './icons';

interface ChoiceListProps {
  readonly choices: readonly EventChoice[];
  readonly disabled?: boolean;
  readonly onChoose: (choiceId: string) => void;
}

export function ChoiceList({ choices, disabled = false, onChoose }: ChoiceListProps) {
  return (
    <div className="choice-list" aria-label="Available choices">
      {choices.map((choice) => (
        <button
          key={choice.id}
          className="choice-button"
          type="button"
          aria-label={choice.label}
          disabled={disabled}
          onClick={() => onChoose(choice.id)}
        >
          <span>
            <strong>{choice.label}</strong>
            <small>{choice.detail}</small>
            {choice.check && <em>{choice.check.stat} check {choice.check.difficulty}</em>}
          </span>
          <ArrowRight size={20} weight="bold" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
