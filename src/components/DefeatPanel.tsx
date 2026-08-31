import { ArrowCounterClockwise, Campfire, House } from '@phosphor-icons/react';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface DefeatPanelProps { readonly onReturnToCamp: () => void; readonly onRestartChapter: () => void; readonly onMainMenu: () => void; }
export function DefeatPanel({ onReturnToCamp, onRestartChapter, onMainMenu }: DefeatPanelProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <>
      <section className="end-panel defeat-panel" aria-labelledby="defeat-title"><p className="eyebrow">Defeated, not forgotten</p><h1 id="defeat-title">The road takes its price.</h1><p>Carried gold and unsecured loot are lost. Choose where the next attempt begins.</p><div className="end-actions" aria-label="Defeat actions"><button className="button button-primary" type="button" onClick={onReturnToCamp}><Campfire size={22} weight="duotone" aria-hidden="true" />Return to Last Camp</button><button className="button button-secondary" type="button" onClick={() => setConfirmRestart(true)}><ArrowCounterClockwise size={22} weight="duotone" aria-hidden="true" />Restart Chapter</button><button className="button button-secondary" type="button" onClick={onMainMenu}><House size={22} weight="duotone" aria-hidden="true" />Main Menu</button></div></section>
      {confirmRestart && <ConfirmDialog title="Restart this chapter?" description="The chapter checkpoint replaces all progress made during this chapter attempt." confirmLabel="Restart Chapter from Beginning" cancelLabel="Stay Here" onCancel={() => setConfirmRestart(false)} onConfirm={() => { setConfirmRestart(false); onRestartChapter(); }} />}
    </>
  );
}
