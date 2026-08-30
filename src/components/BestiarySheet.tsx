import { ENEMIES } from '../game/content/enemies';
import type { GameState } from '../game/state';
import { Sheet } from './Sheet';

interface BestiarySheetProps { readonly state: GameState; readonly onClose: () => void; }

export function BestiarySheet({ state, onClose }: BestiarySheetProps) {
  const found = state.discoveredEnemies.map((id) => ENEMIES.find((enemy) => enemy.id === id)).filter(Boolean);
  return <Sheet title="Bestiary" onClose={onClose}><p className="sheet-count">{found.length} / {ENEMIES.length} discovered</p>{found.length === 0 ? <p className="empty-state">Survive an encounter to record its adversary.</p> : <div className="inventory-list">{found.map((enemy) => enemy && <article key={enemy.id}><strong>{enemy.name}</strong><p>{enemy.description}</p></article>)}</div>}</Sheet>;
}
