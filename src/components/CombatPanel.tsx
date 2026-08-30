import type { GameCommand, GameState } from '../game/state';
import { Heart, Shield, Sparkle, Sword } from './icons';

interface CombatPanelProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
}

export function CombatPanel({ state, dispatch }: CombatPanelProps) {
  const combat = state.combat;
  if (!combat) return null;
  const technique = state.hero.class === 'warrior' ? 'Cleave' : state.hero.class === 'mage' ? 'Witchfire' : 'Marked Shot';
  const healthPercent = Math.max(0, (combat.enemy.health / combat.enemy.maxHealth) * 100);
  return (
    <section className="combat-panel" aria-labelledby="enemy-name">
      <div className="enemy-heading">
        <div>
          <p>{combat.enemy.species}   rank {combat.enemy.rank}</p>
          <h1 id="enemy-name">{combat.enemy.name}</h1>
        </div>
        <span>{combat.enemy.health} / {combat.enemy.maxHealth}</span>
      </div>
      <div className="enemy-health" aria-label={`${combat.enemy.health} of ${combat.enemy.maxHealth} enemy Health`}>
        <span style={{ inlineSize: `${healthPercent}%` }} />
      </div>
      <div className="intent-panel">
        <strong>Enemy intent</strong>
        <p>{combat.intentText}</p>
      </div>
      <div className="combat-log" aria-live="polite">
        {combat.log.slice(-3).map((entry, index) => <p key={`${combat.turn}-${index}-${entry}`}>{entry}</p>)}
      </div>
      <div className="combat-actions" aria-label="Combat actions">
        <button type="button" aria-label="Attack" onClick={() => dispatch({ type: 'COMBAT', action: { type: 'attack' } })}><Sword size={22} weight="duotone" aria-hidden="true" /><span><strong>Attack</strong><small>Reliable physical damage</small></span></button>
        <button type="button" aria-label="Guard" onClick={() => dispatch({ type: 'COMBAT', action: { type: 'guard' } })}><Shield size={22} weight="duotone" aria-hidden="true" /><span><strong>Guard</strong><small>Halve the next hit</small></span></button>
        <button type="button" aria-label={`Technique: ${technique}`} onClick={() => dispatch({ type: 'COMBAT', action: { type: 'technique', techniqueId: technique.toLowerCase() } })}><Sparkle size={22} weight="duotone" aria-hidden="true" /><span><strong>Technique: {technique}</strong><small>Costs 3 Focus</small></span></button>
        <button type="button" aria-label="Red Mercy" disabled={!state.hero.inventory.includes('potion-red')} onClick={() => dispatch({ type: 'COMBAT', action: { type: 'item', itemId: 'potion-red' } })}><Heart size={22} weight="duotone" aria-hidden="true" /><span><strong>Red Mercy</strong><small>Recover 12 Health</small></span></button>
        <button className="flee-action" type="button" onClick={() => dispatch({ type: 'COMBAT', action: { type: 'flee' } })}>Flee</button>
      </div>
    </section>
  );
}
