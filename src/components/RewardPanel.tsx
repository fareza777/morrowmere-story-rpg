import { Check, Coins, Gift, Play, Sparkle } from '@phosphor-icons/react';
import type { ItemRowViewModel } from '../ui/types';

export type RewardBonusStatus = 'available' | 'pending' | 'unavailable' | 'failed' | 'claimed' | 'dismissed';
export interface RewardViewModel { readonly rewardId: string; readonly gold: number; readonly xp: number; readonly items: readonly ItemRowViewModel[]; readonly bonusStatus: RewardBonusStatus; }
interface RewardPanelProps { readonly view: RewardViewModel; readonly onClaim: (itemId: string | null) => void; readonly onRequestBonus?: () => void; readonly onDismissBonus?: () => void; }

function bonusCopy(status: RewardBonusStatus): string {
  if (status === 'pending') return 'Preparing the optional bonus video…';
  if (status === 'unavailable') return 'Bonus video unavailable. Your reward is safe.';
  if (status === 'failed') return 'The bonus could not be granted. Your base reward is safe.';
  if (status === 'claimed') return 'Bonus gold received.';
  if (status === 'dismissed') return 'Bonus dismissed. Your base reward is safe.';
  return 'Optional: watch a bonus video to double ordinary battle gold.';
}

export function RewardPanel({ view, onClaim, onRequestBonus, onDismissBonus }: RewardPanelProps) {
  const canRequest = view.bonusStatus === 'available' && onRequestBonus;
  return (
    <section className="reward-panel" aria-labelledby="reward-title"><p className="eyebrow">Victory</p><h1 id="reward-title">The road leaves something behind.</h1><div className="reward-summary"><span><Coins size={20} weight="duotone" aria-hidden="true" /><strong>{view.gold} gold received</strong></span><span><Sparkle size={20} weight="duotone" aria-hidden="true" /><strong>{view.xp} XP received</strong></span></div>
      {view.items.length > 0 ? <><h2>Choose one item</h2><div className="reward-list">{view.items.map((item) => <button key={item.itemId} type="button" aria-label={`Choose ${item.name}`} onClick={() => onClaim(item.itemId)}><span><strong>{item.name}</strong><small>{item.description}</small></span><Check size={20} weight="bold" aria-hidden="true" /></button>)}</div></> : <button className="button button-primary" type="button" onClick={() => onClaim(null)}>Continue</button>}
      <aside className="reward-bonus" aria-live="polite"><Gift size={21} aria-hidden="true" /><div><strong>Optional battle bonus</strong><p>{bonusCopy(view.bonusStatus)}</p></div>{canRequest && <button type="button" onClick={onRequestBonus}><Play size={17} aria-hidden="true" />Watch Bonus</button>}{(view.bonusStatus === 'available' || view.bonusStatus === 'failed') && onDismissBonus && <button type="button" onClick={onDismissBonus}>Not now</button>}</aside>
    </section>
  );
}
