import { ITEMS } from '../game/content/items';
import type { GameState } from '../game/state';
import { Backpack } from './icons';
import { Sheet } from './Sheet';

interface InventorySheetProps { readonly state: GameState; readonly onClose: () => void; }

export function InventorySheet({ state, onClose }: InventorySheetProps) {
  const items = state.hero.inventory.map((id) => ITEMS.find((item) => item.id === id)).filter(Boolean);
  return (
    <Sheet title="Inventory" onClose={onClose}>
      <div className="sheet-summary"><Backpack size={22} aria-hidden="true" /><span>{items.length} / 12 carried</span></div>
      {items.length === 0 ? <p className="empty-state">Your pack is empty. The road rarely leaves it that way.</p> : (
        <div className="inventory-list">
          {items.map((item) => item && <article key={item.id}><div><strong>{item.name}</strong><small>{item.category}</small></div><p>{item.description}</p></article>)}
        </div>
      )}
    </Sheet>
  );
}
