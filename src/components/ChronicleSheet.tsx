import type { GameState } from '../game/state';
import { Sheet } from './Sheet';

interface ChronicleSheetProps { readonly state: GameState; readonly onClose: () => void; }

export function ChronicleSheet({ state, onClose }: ChronicleSheetProps) {
  return (
    <Sheet title="Chronicle" onClose={onClose}>
      <dl className="faction-grid">
        <div><dt>Iron Abbey</dt><dd>{state.factions.abbey}</dd></div>
        <div><dt>Free Host</dt><dd>{state.factions.freeHost}</dd></div>
        <div><dt>Pale Conclave</dt><dd>{state.factions.conclave}</dd></div>
      </dl>
      <div className="chronicle-marks"><span>Mercy {state.mercy}</span><span>Corruption {state.corruption}</span><span>Supplies {state.supplies}</span><span>Gold {state.gold}</span></div>
      <h2>Consequences</h2>
      {state.flags.length === 0 ? <p className="empty-state">Your choices have not yet left a lasting mark.</p> : <p>{state.flags.map((flag) => flag.replaceAll('-', ' ')).join(', ')}</p>}
    </Sheet>
  );
}
