import { useState } from 'react';
import { ITEMS } from '../game/content/items';
import type { GameCommand, GameState } from '../game/state';
import type { ItemDefinition } from '../game/types';
import { Backpack, Shield, Sparkle, Sword } from './icons';
import { Sheet } from './Sheet';

interface InventorySheetProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
  readonly onClose: () => void;
}

function statLine(item: ItemDefinition): string {
  const labels: Record<string, string> = { attack: 'Attack', will: 'Will', armor: 'Armor', ward: 'Ward', health: 'Health', focus: 'Focus' };
  const entries = Object.entries(item.stats).filter(([, value]) => Boolean(value));
  return entries.length > 0 ? entries.map(([key, value]) => `+${value} ${labels[key] ?? key}`).join('  ·  ') : 'No combat bonus';
}

export function InventorySheet({ state, dispatch, onClose }: InventorySheetProps) {
  const [page, setPage] = useState<'inventory' | 'equipment'>('inventory');
  const items = state.hero.inventory.map((id) => ITEMS.find((item) => item.id === id)).filter((item): item is ItemDefinition => Boolean(item));
  const gear = items.filter((item) => ['weapon', 'armor', 'charm'].includes(item.category));
  const equippedIds = new Set([state.hero.equipment.weapon, state.hero.equipment.armor, ...state.hero.equipment.charms].filter((id): id is string => Boolean(id)));
  const itemName = (id: string | null | undefined) => ITEMS.find((item) => item.id === id)?.name ?? 'Empty';

  return (
    <Sheet title="Inventory" onClose={onClose}>
      <div className="sheet-tabs" role="tablist" aria-label="Inventory pages">
        <button type="button" role="tab" aria-selected={page === 'inventory'} onClick={() => setPage('inventory')}><Backpack size={19} aria-hidden="true" />Inventory</button>
        <button type="button" role="tab" aria-selected={page === 'equipment'} onClick={() => setPage('equipment')}><Sword size={19} aria-hidden="true" />Equipment</button>
      </div>
      {page === 'inventory' ? (
        <>
          <div className="sheet-summary"><Backpack size={22} aria-hidden="true" /><span>{items.length} / 12 carried</span></div>
          {items.length === 0 ? <p className="empty-state">Your pack is empty. The road rarely leaves it that way.</p> : (
            <div className="inventory-list">{items.map((item) => <article key={item.id}><div><strong>{item.name}</strong><small>{equippedIds.has(item.id) ? 'equipped' : item.category}</small></div><p>{item.description}</p><b>{statLine(item)}</b></article>)}</div>
          )}
        </>
      ) : (
        <div className="equipment-page">
          <p className="equipment-intro">Equip one weapon, one armor piece, and two charms. Bonuses are reflected in your combat stats immediately.</p>
          <div className="equipment-slots" aria-label="Equipped items">
            <article><Sword size={20} aria-hidden="true" /><span><small>Weapon</small><strong>{itemName(state.hero.equipment.weapon)}</strong></span></article>
            <article><Shield size={20} aria-hidden="true" /><span><small>Armor</small><strong>{itemName(state.hero.equipment.armor)}</strong></span></article>
            <article><Sparkle size={20} aria-hidden="true" /><span><small>Charm I</small><strong>{itemName(state.hero.equipment.charms[0])}</strong></span></article>
            <article><Sparkle size={20} aria-hidden="true" /><span><small>Charm II</small><strong>{itemName(state.hero.equipment.charms[1])}</strong></span></article>
          </div>
          <div className="loadout-stats" aria-label="Current combat stats">
            <span>ATK <strong>{state.hero.strength + state.hero.attackBonus}</strong></span><span>WILL <strong>{state.hero.will}</strong></span><span>ARM <strong>{state.hero.armor}</strong></span><span>WARD <strong>{state.hero.ward}</strong></span>
          </div>
          <div className="inventory-list loadout-list">
            {gear.length === 0 ? <p className="empty-state">Find weapons, armor, and charms on the road to build a loadout.</p> : gear.map((item) => {
              const equipped = equippedIds.has(item.id);
              const allowed = item.allowedClasses.includes(state.hero.class);
              const charmsFull = item.category === 'charm' && state.hero.equipment.charms.length >= 2 && !equipped;
              const label = equipped ? 'Unequip' : !allowed ? `Not for ${state.hero.class}` : charmsFull ? 'Charm slots full' : 'Equip';
              return <article key={item.id}><div><strong>{item.name}</strong><small>{item.category}</small></div><p>{statLine(item)}</p><button className="loadout-action" type="button" disabled={!allowed || charmsFull} onClick={() => dispatch({ type: equipped ? 'UNEQUIP_ITEM' : 'EQUIP_ITEM', itemId: item.id })}>{label}</button></article>;
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
}
