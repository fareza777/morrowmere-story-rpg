import { Backpack, BoxArrowDown, Flask, Shield, Sword, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import type { InventoryCommand } from '../game/inventory';
import type { HeroClass } from '../game/types';
import type { InventoryViewModel, ItemRowViewModel } from '../ui/types';
import { ConfirmDialog } from './ConfirmDialog';
import { EquipmentSheet } from './EquipmentSheet';
import { ItemIcon } from './ItemIcon';
import { Sheet } from './Sheet';
import { TutorialCallout, type TutorialKind } from './TutorialCallout';

type UiInventoryCommand = Exclude<InventoryCommand, { readonly type: 'add' }>;
export type InventoryContext = 'camp' | 'field' | 'combat';

interface InventorySheetProps {
  readonly view: InventoryViewModel;
  readonly context: InventoryContext;
  readonly heroClass: HeroClass;
  readonly heroLevel?: number;
  readonly chapter?: number;
  readonly onUse: (entryId: string) => void;
  readonly onInventoryCommand: (command: UiInventoryCommand) => void;
  readonly onClose: () => void;
  readonly tutorialKind?: Extract<TutorialKind, 'consumable' | 'equipment'> | null;
  readonly onTutorialDismiss?: () => void;
  readonly onSkipTutorials?: () => void;
}

function statLine(item: ItemRowViewModel): string {
  return item.stats.length > 0 ? item.stats.map((stat) => `${stat.value >= 0 ? '+' : ''}${stat.displayValue} ${stat.label}`).join(' · ') : 'No direct combat bonus';
}

interface ItemCardProps {
  readonly item: ItemRowViewModel;
  readonly location: 'pack' | 'stash';
  readonly context: InventoryContext;
  readonly onUse: (entryId: string) => void;
  readonly onMove: (entryId: string, destination: 'pack' | 'stash') => void;
  readonly onDiscard: (item: ItemRowViewModel) => void;
}

function ItemCard({ item, location, context, onUse, onMove, onDiscard }: ItemCardProps) {
  const entryId = item.entryId;
  return (
    <article className="item-card">
      <header><ItemIcon iconId={item.iconId} name={item.name} /><div><strong>{item.name}</strong><span>{item.rarityLabel} · {item.categoryLabel}</span></div>{item.quantity > 1 && <b>Quantity {item.quantity}</b>}</header>
      <p>{item.description}</p><small>{statLine(item)}</small>
      {item.restrictionLabel && <p className="restriction-copy">{item.restrictionLabel}</p>}
      <div className="item-actions">
        {location === 'pack' && item.usable && <button type="button" disabled={context !== 'field' || !entryId} onClick={() => entryId && onUse(entryId)}><Flask size={17} aria-hidden="true" />Use {item.name}</button>}
        {context === 'camp' && entryId && <button type="button" onClick={() => onMove(entryId, location === 'pack' ? 'stash' : 'pack')}><BoxArrowDown size={17} aria-hidden="true" />Move to {location === 'pack' ? 'Stash' : 'Pack'}</button>}
        {context === 'camp' && entryId && <button className="danger-action" type="button" onClick={() => onDiscard(item)}><Trash size={17} aria-hidden="true" />Discard</button>}
      </div>
      {context === 'combat' && item.usable && <p className="item-note">Use this from the Consumable battle action.</p>}
      {context === 'camp' && item.usable && <p className="item-note">Carry this onto the road to use it when injured.</p>}
    </article>
  );
}

export function InventorySheet({ view, context, heroClass, heroLevel = 1, chapter = 1, onUse, onInventoryCommand, onClose, tutorialKind = null, onTutorialDismiss, onSkipTutorials }: InventorySheetProps) {
  const [page, setPage] = useState<'pack' | 'stash' | 'equipment'>('pack');
  const [discardItem, setDiscardItem] = useState<ItemRowViewModel | null>(null);
  const items = page === 'stash' ? view.stash : view.pack;
  const showTutorial = tutorialKind === 'consumable' ? page === 'pack' : tutorialKind === 'equipment' ? page === 'equipment' : false;
  const move = (entryId: string, destination: 'pack' | 'stash') => onInventoryCommand({ type: 'move', entryId, destination });
  return (
    <>
      <Sheet title="Inventory" onClose={onClose}>
        {showTutorial && tutorialKind && onTutorialDismiss && onSkipTutorials && <TutorialCallout kind={tutorialKind} onDismiss={onTutorialDismiss} onSkipAll={onSkipTutorials} />}
        <div className="sheet-tabs inventory-tabs" role="tablist" aria-label="Inventory pages">
          <button type="button" role="tab" aria-selected={page === 'pack'} onClick={() => setPage('pack')}><Backpack size={18} aria-hidden="true" />Pack</button>
          <button type="button" role="tab" aria-selected={page === 'stash'} disabled={context !== 'camp'} onClick={() => setPage('stash')}><BoxArrowDown size={18} aria-hidden="true" />Stash</button>
          <button type="button" role="tab" aria-selected={page === 'equipment'} onClick={() => setPage('equipment')}><Sword size={18} aria-hidden="true" />Equipment</button>
        </div>
        {page !== 'equipment' ? (
          <>
            <div className="sheet-summary"><Backpack size={21} aria-hidden="true" /><span>{view.usedSlots} / {view.capacity} slots</span></div>
            {items.length === 0 ? <p className="empty-state">The {page} is empty.</p> : <div className="inventory-list">{items.map((item) => <ItemCard key={item.entryId ?? item.itemId} item={item} location={page} context={context} onUse={onUse} onMove={move} onDiscard={setDiscardItem} />)}</div>}
            {view.questItems.length > 0 && <section className="quest-items"><h2>Quest items</h2>{view.questItems.map((item) => <article key={item.itemId}><ItemIcon iconId={item.iconId} name={item.name} /><div><strong>{item.name}</strong><p>{item.description}</p><small><Shield size={15} aria-hidden="true" />Protected · does not use a pack slot</small></div></article>)}</section>}
          </>
        ) : <EquipmentSheet view={view} heroClass={heroClass} heroLevel={heroLevel} chapter={chapter} context={context} onCommand={onInventoryCommand} />}
      </Sheet>
      {discardItem?.entryId && <ConfirmDialog title={`Discard ${discardItem.name}?`} description="Discarded items cannot be recovered." confirmLabel="Discard Item" cancelLabel="Keep Item" onCancel={() => setDiscardItem(null)} onConfirm={() => { onInventoryCommand({ type: 'discard', entryId: discardItem.entryId! }); setDiscardItem(null); }} />}
    </>
  );
}
