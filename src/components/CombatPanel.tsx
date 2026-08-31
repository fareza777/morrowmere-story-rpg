import { useEffect, useMemo, useState } from 'react';
import type { CombatAction } from '../game/combat/types';
import type { DomainEvent } from '../game/domain/result';
import type { CombatViewModel, InventoryViewModel } from '../ui/types';
import { CombatActionBar } from './CombatActionBar';
import { EnemyParty } from './EnemyParty';

interface CombatPanelProps {
  readonly view: CombatViewModel;
  readonly inventory: InventoryViewModel;
  readonly transitionEvents: readonly DomainEvent[];
  readonly onAction: (action: CombatAction) => void;
}

export function CombatPanel({ view, inventory, transitionEvents, onAction }: CombatPanelProps) {
  const [selectedTargetId, setSelectedTargetId] = useState(view.selectedTargetId);
  useEffect(() => {
    if (!view.enemies.some((enemy) => enemy.id === selectedTargetId)) setSelectedTargetId(view.selectedTargetId);
  }, [selectedTargetId, view.enemies, view.selectedTargetId]);
  const feedbackClass = useMemo(() => {
    const attack = [...transitionEvents].reverse().find((event) => event.type === 'attack_resolved');
    return attack?.type === 'attack_resolved' ? `is-${attack.outcome}` : null;
  }, [transitionEvents]);
  const consumables = inventory.pack.filter((item) => item.usable && item.entryId !== null);
  return (
    <section className="combat-panel" aria-labelledby="battle-title">
      <header className="combat-heading"><p className="eyebrow">Battle</p><h1 id="battle-title">Choose your target</h1><p>Enemy intent is announced before your action.</p></header>
      <EnemyParty enemies={view.enemies} selectedTargetId={selectedTargetId} onTarget={setSelectedTargetId} feedbackClass={feedbackClass} />
      <div className="combat-log" aria-live="polite">
        {view.log.slice(-4).map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}
      </div>
      <CombatActionBar view={view} selectedTargetId={selectedTargetId} consumables={consumables} onAction={onAction} />
    </section>
  );
}
