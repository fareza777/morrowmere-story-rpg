import { ArrowLeft, Coins, Scales, ShoppingBagOpen } from '@phosphor-icons/react';
import { useState } from 'react';
import type { MerchantViewModel } from '../ui/types';
import { ItemIcon } from './ItemIcon';
import { SceneArt } from './SceneArt';

interface MerchantScreenProps { readonly view: MerchantViewModel; readonly onBuy: (stockEntryId: string) => void; readonly onSell: (entryId: string, quantity?: number) => void; readonly onClose: () => void; }
export function MerchantScreen({ view, onBuy, onSell, onClose }: MerchantScreenProps) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  return (
    <main className="merchant-screen screen-page">
      <header className="merchant-header"><button className="back-button" type="button" onClick={onClose}><ArrowLeft size={20} aria-hidden="true" /> Leave</button><div><p className="eyebrow">Merchant</p><h1>{view.name}</h1></div></header>
      {view.illustrationId && <SceneArt illustrationId={view.illustrationId} alt={view.illustrationAlt} kind="merchant" />}
      {view.dialogue.map((line, index) => <p className="merchant-dialogue" key={`${view.id}-${index}`}>{line}</p>)}
      <p className="merchant-gold"><Coins size={19} weight="duotone" aria-hidden="true" />Banked {view.bankedGold} · Carried {view.carriedGold} · Total {view.totalGold}</p>
      <div className="sheet-tabs" role="tablist" aria-label="Trade direction"><button role="tab" aria-selected={tab === 'buy'} type="button" onClick={() => setTab('buy')}><ShoppingBagOpen size={18} aria-hidden="true" />Buy</button><button role="tab" aria-selected={tab === 'sell'} type="button" onClick={() => setTab('sell')}><Scales size={18} aria-hidden="true" />Sell</button></div>
      <p className="merchant-note">Prices shown are final for this visit and already include local scarcity and reputation. Stock stays sold until the merchant's next scheduled restock.</p>
      {tab === 'buy' ? (
        view.stock.length === 0 ? <p className="empty-state">{view.emptyStockMessage ?? `${view.name} has no stock left for this visit.`}</p> : <div className="merchant-list">{view.stock.map((item) => <article key={item.stockEntryId}><header><ItemIcon iconId={item.iconId} name={item.name} /><div><strong>{item.name}</strong><span>{item.rarityLabel} · {item.categoryLabel}</span></div><b>{item.price} gold</b></header><p>{item.description}</p><button type="button" aria-label={`Buy ${item.name} for ${item.price} gold`} disabled={!item.affordable} onClick={() => onBuy(item.stockEntryId)}>Buy for {item.price} gold</button>{!item.affordable && <small>Insufficient gold. Your current balance is {view.totalGold}.</small>}</article>)}</div>
      ) : (
        view.sellable.length === 0 ? <p className="empty-state">Nothing in your pack can be sold here.</p> : <div className="merchant-list">{view.sellable.map((item) => <article key={item.entryId ?? item.itemId}><header><ItemIcon iconId={item.iconId} name={item.name} /><div><strong>{item.name}</strong><span>Quantity {item.quantity}</span></div><b>{item.priceEach} each</b></header><p>{item.description}</p><button type="button" aria-label={`Sell ${item.name} for ${item.stackPrice} gold`} onClick={() => item.entryId && onSell(item.entryId, item.quantity)}>Sell stack for {item.stackPrice} gold</button></article>)}</div>
      )}
    </main>
  );
}
