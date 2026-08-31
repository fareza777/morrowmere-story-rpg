import { Backpack, Boot, Heart, Shield, Sparkle, Sword, UsersThree } from '@phosphor-icons/react';
import { useState } from 'react';
import type { CombatAction } from '../game/combat/types';
import type { CombatActionViewModel, CombatViewModel, ItemRowViewModel } from '../ui/types';

interface CombatActionBarProps {
  readonly view: CombatViewModel;
  readonly selectedTargetId: string;
  readonly consumables: readonly ItemRowViewModel[];
  readonly onAction: (action: CombatAction) => void;
}

const ICONS = { attack: Sword, guard: Shield, technique: Sparkle, consumable: Backpack, companion: UsersThree, flee: Boot } as const;

function techniqueId(view: CombatViewModel): string {
  return view.hero.heroClass === 'warrior' ? 'cleave' : view.hero.heroClass === 'mage' ? 'witchfire' : 'marked-shot';
}

export function CombatActionBar({ view, selectedTargetId, consumables, onAction }: CombatActionBarProps) {
  const [showConsumables, setShowConsumables] = useState(false);
  const issue = (action: CombatActionViewModel) => {
    if (!action.available) return;
    if (action.id === 'attack') onAction({ type: 'attack', targetId: selectedTargetId });
    if (action.id === 'guard') onAction({ type: 'guard' });
    if (action.id === 'technique') onAction({ type: 'technique', techniqueId: techniqueId(view), targetId: selectedTargetId });
    if (action.id === 'companion') onAction({ type: 'companion', targetId: selectedTargetId });
    if (action.id === 'flee') onAction({ type: 'flee' });
    if (action.id === 'consumable') setShowConsumables((open) => !open);
  };
  return (
    <section className="combat-action-area" aria-label="Combat actions">
      <div className="combat-actions">
        {view.actions.map((action) => {
          const Icon = ICONS[action.id];
          const reasonId = `combat-${action.id}-reason`;
          const label = action.id === 'companion' && view.companion ? `${view.companion.name}: ${view.companion.commandLabel}` : action.label;
          return (
            <div className="combat-action" key={action.id}>
              <button type="button" aria-label={label} aria-expanded={action.id === 'consumable' ? showConsumables : undefined} aria-describedby={action.unavailableReason ? reasonId : undefined} disabled={!action.available} onClick={() => issue(action)}><Icon size={22} weight="duotone" aria-hidden="true" /><span><strong>{label}</strong>{action.turnCostLabel && <small>{action.turnCostLabel}</small>}</span></button>
              {action.unavailableReason && <p id={reasonId}>{action.unavailableReason}</p>}
            </div>
          );
        })}
      </div>
      <p className="combat-turn-warning"><Heart size={16} aria-hidden="true" />Using an item spends this turn.</p>
      {showConsumables && (
        <div className="combat-consumables" aria-label="Choose a consumable">
          {consumables.length === 0 ? <p>No usable consumables are in the pack.</p> : consumables.map((item) => <button key={item.entryId ?? item.itemId} type="button" onClick={() => item.entryId && onAction({ type: 'consumable', instanceId: item.entryId })}><strong>{item.name}</strong><span>Quantity {item.quantity} · {item.description}</span></button>)}
        </div>
      )}
    </section>
  );
}
