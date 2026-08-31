import { ArrowCounterClockwise, House } from '@phosphor-icons/react';
import { useLayoutEffect, type CSSProperties } from 'react';
import type { GameCommand, GameState } from '../game/state';
import { BestiarySheet } from './BestiarySheet';
import { ChronicleSheet } from './ChronicleSheet';
import { CombatPanel } from './CombatPanel';
import { InventorySheet } from './InventorySheet';
import { RewardPanel } from './RewardPanel';
import { SceneArt } from './SceneArt';
import { SettingsSheet } from './SettingsSheet';
import { StoryPanel } from './StoryPanel';
import { TopHud } from './TopHud';

interface GameShellProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
  readonly onRetry?: () => void;
  readonly onExit?: () => void;
}

export function GameShell({ state, dispatch, onRetry, onExit }: GameShellProps) {
  const node = state.route[state.routeIndex];
  const combatArt = state.combat?.enemy.artFamily;
  const combatEnemyId = state.combat?.enemy.id;
  const narrationText = state.screen === 'story' && node
    ? `Narration: ${node.title}. ${node.text}`
    : state.screen === 'combat' && state.combat
      ? `Narration: ${state.combat.enemy.name}. Enemy intent: ${state.combat.intentText}`
      : state.screen === 'reward'
        ? 'Narration: Victory. Choose what the road leaves behind.'
        : state.screen === 'ending' && state.ending
          ? `Narration: ${state.ending.title}. ${state.ending.verdict}`
          : '';
  const style = { '--text-scale': state.settings.textScale } as CSSProperties;
  const closeOverlay = () => dispatch({ type: 'CLOSE_OVERLAY' });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [state.routeIndex, state.screen]);

  return (
    <div className={`game-shell ${state.settings.highContrast ? 'is-high-contrast' : ''} ${state.settings.reducedMotion ? 'is-reduced-motion' : ''}`} style={style}>
      {state.settings.narration && <div className="sr-only" aria-live="polite" aria-atomic="true">{narrationText}</div>}
      <TopHud state={state} dispatch={dispatch} />
      {(state.screen === 'story' || state.screen === 'combat') && node && <SceneArt region={node.region} sceneKey={node.sceneKey} enemyId={combatEnemyId} enemyArtFamily={combatArt} />}
      <main className="game-main">
        {state.screen === 'story' && <StoryPanel state={state} dispatch={dispatch} />}
        {state.screen === 'combat' && <CombatPanel state={state} dispatch={dispatch} />}
        {state.screen === 'reward' && <RewardPanel state={state} dispatch={dispatch} />}
        {state.screen === 'defeat' && (
          <section className="end-panel">
            <p className="eyebrow">Chronicle ended</p>
            <h1>The road keeps your name.</h1>
            <p>This run is over, but another road is waiting.</p>
            <div className="end-actions" aria-label="Defeat actions">
              <button className="button button-primary" type="button" onClick={onRetry}>
                <ArrowCounterClockwise size={21} weight="bold" aria-hidden="true" />
                Try Again
              </button>
              <button className="button button-secondary" type="button" onClick={onExit}>
                <House size={21} weight="bold" aria-hidden="true" />
                Main Menu
              </button>
            </div>
          </section>
        )}
        {state.screen === 'ending' && state.ending && <section className="end-panel"><p className="eyebrow">Epilogue</p><h1>{state.ending.title}</h1><strong>{state.ending.verdict}</strong><p>{state.ending.epilogue}</p></section>}
      </main>
      {state.overlay === 'inventory' && <InventorySheet state={state} dispatch={dispatch} onClose={closeOverlay} />}
      {state.overlay === 'chronicle' && <ChronicleSheet state={state} onClose={closeOverlay} />}
      {state.overlay === 'bestiary' && <BestiarySheet state={state} onClose={closeOverlay} />}
      {state.overlay === 'settings' && <SettingsSheet settings={state.settings} dispatch={dispatch} onClose={closeOverlay} />}
    </div>
  );
}
