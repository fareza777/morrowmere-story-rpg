import type { GameCommand, GameState } from '../game/state';
import { Check } from './icons';

interface RewardPanelProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
}

export function RewardPanel({ state, dispatch }: RewardPanelProps) {
  return (
    <section className="reward-panel">
      <p className="eyebrow">Victory</p>
      <h1>Choose what the road leaves behind.</h1>
      <div className="reward-list">
        {state.rewards.map((reward) => (
          <button key={reward.id} type="button" onClick={() => dispatch({ type: 'CLAIM_REWARD', itemId: reward.id })}>
            <span><strong>{reward.name}</strong><small>{reward.description}</small></span>
            <Check size={20} weight="bold" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
