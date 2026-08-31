import { Shield, Sparkle, Sword } from '@phosphor-icons/react';
import type { InventoryCommand } from '../game/inventory';
import type { ItemId } from '../game/domain/ids';
import type { HeroClass } from '../game/types';
import type { InventoryViewModel, ItemRowViewModel } from '../ui/types';
import type { InventoryContext } from './InventorySheet';
import { ItemIcon } from './ItemIcon';

type UiInventoryCommand = Exclude<InventoryCommand, { readonly type: 'add' }>;
interface EquipmentSheetProps { readonly view: InventoryViewModel; readonly heroClass: HeroClass; readonly heroLevel: number; readonly chapter: number; readonly context: InventoryContext; readonly onCommand: (command: UiInventoryCommand) => void; }

function slotItem(label: string, item: ItemRowViewModel | null, icon: 'weapon' | 'armor' | 'charm', canUnequip: boolean, onCommand: (command: UiInventoryCommand) => void) {
  const Icon = icon === 'weapon' ? Sword : icon === 'armor' ? Shield : Sparkle;
  return <article>{item ? <ItemIcon iconId={item.iconId} name={item.name} /> : <Icon size={21} aria-hidden="true" />}<span><small>{label}</small><strong>{item?.name ?? 'Empty'}</strong></span>{item && <button type="button" disabled={!canUnequip} onClick={() => onCommand({ type: 'unequip', itemId: item.itemId as ItemId })}>Unequip {item.name}</button>}</article>;
}

function itemDelta(item: ItemRowViewModel, current: ItemRowViewModel | null): string {
  const candidateStats = new Map(item.stats.map((stat) => [stat.id, stat]));
  const currentStats = new Map(current?.stats.map((stat) => [stat.id, stat]) ?? []);
  const statIds = new Set([...candidateStats.keys(), ...currentStats.keys()]);
  const deltas = [...statIds].flatMap((id) => {
    const candidate = candidateStats.get(id);
    const equipped = currentStats.get(id);
    const delta = (candidate?.value ?? 0) - (equipped?.value ?? 0);
    if (delta === 0) return [];
    return [`${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${candidate?.label ?? equipped?.label ?? id}`];
  });
  return deltas.join(' · ') || 'No derived-stat change';
}

export function EquipmentSheet({ view, heroClass, heroLevel, chapter, context, onCommand }: EquipmentSheetProps) {
  const packFull = view.usedSlots >= view.capacity;
  const gear = view.pack.filter((item) => item.equippable);
  return (
    <div className="equipment-page">
      <p className="equipment-intro">Equip one weapon, one armor piece, and two charms. Swapping a weapon or armor piece returns the old item to your pack.</p>
      <div className="equipment-slots" aria-label="Equipped items">
        {slotItem('Weapon', view.equipment.weapon, 'weapon', context !== 'combat' && !packFull, onCommand)}
        {slotItem('Armor', view.equipment.armor, 'armor', context !== 'combat' && !packFull, onCommand)}
        {slotItem('Charm I', view.equipment.charms[0] ?? null, 'charm', context !== 'combat' && !packFull, onCommand)}
        {slotItem('Charm II', view.equipment.charms[1] ?? null, 'charm', context !== 'combat' && !packFull, onCommand)}
      </div>
      {packFull && <p className="restriction-copy">Pack full: free one slot before unequipping. Equipment swaps still use the vacated item slot.</p>}
      <div className="loadout-stats" aria-label="Current derived stats">{view.derivedStats.map((stat) => <span key={stat.id}>{stat.label}<strong>{stat.displayValue}</strong></span>)}</div>
      <h2>Pack alternatives</h2>
      {gear.length === 0 ? <p className="empty-state">No alternative equipment is in the pack.</p> : <div className="inventory-list loadout-list">{gear.map((item) => {
        const allowed = item.allowedClasses.includes(heroClass)
          && (item.minimumLevel === null || heroLevel >= item.minimumLevel)
          && (item.minimumChapter === null || chapter >= item.minimumChapter);
        const current = item.category === 'weapon' ? view.equipment.weapon : item.category === 'armor' ? view.equipment.armor : null;
        const charmsFull = item.category === 'charm' && view.equipment.charms.length >= 2;
        const disabled = context === 'combat' || !allowed || charmsFull;
        const action = current ? 'Swap' : 'Equip';
        return <article key={item.entryId ?? item.itemId}><header><ItemIcon iconId={item.iconId} name={item.name} /><span><strong>{item.name}</strong><small>{item.rarityLabel} · {item.categoryLabel}</small></span></header><p>{itemDelta(item, current)}</p>{item.restrictionLabel && <p className="restriction-copy">{item.restrictionLabel}</p>}<button className="loadout-action" type="button" aria-label={`${action} ${item.name}`} disabled={disabled || !item.entryId} onClick={() => item.entryId && onCommand({ type: 'equip', entryId: item.entryId, heroClass })}>{action} {item.name}</button>{context === 'combat' && <small>Equipment is locked during battle.</small>}{charmsFull && <small>Both charm slots are full.</small>}</article>;
      })}</div>}
    </div>
  );
}
