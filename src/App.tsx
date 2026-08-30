import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameShell } from './components/GameShell';
import { LaunchSplash } from './components/LaunchSplash';
import { NewRunScreen } from './components/NewRunScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { TitleScreen } from './components/TitleScreen';
import { playSfx, playTransitionSfx } from './game/audio';
import { loadGame, saveGame } from './game/persistence';
import { gameReducer, startNewRun, type GameCommand, type GameState } from './game/state';
import type { HeroClass } from './game/types';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';

type AppView = 'title' | 'onboarding' | 'new-run' | 'game';

export default function App() {
  const [view, setView] = useState<AppView>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const [hasSave, setHasSave] = useState(() => loadGame(1).ok);

  useEffect(() => {
    if (!game) return;
    const result = saveGame(1, game);
    if (result.ok) setHasSave(true);
  }, [game]);

  const dispatch = useCallback((command: GameCommand) => {
    const current = gameRef.current;
    if (!current) return;
    const next = gameReducer(current, command);
    gameRef.current = next;
    playTransitionSfx(current, next, command);
    setGame(next);
  }, []);

  const begin = (heroClass: HeroClass, name: string) => {
    const seed = Math.abs((Date.now() ^ 0x4d4f5252) | 0) || 1943;
    const next = startNewRun({ heroClass, seed, name: name.trim() || 'The Oathless' });
    gameRef.current = next;
    setGame(next);
    setView('game');
  };

  const continueRun = () => {
    const loaded = loadGame(1);
    if (loaded.ok) {
      gameRef.current = loaded.state;
      setGame(loaded.state);
      setView('game');
    }
  };

  return (
    <>
    <LaunchSplash />
    <ErrorBoundary onReset={() => { gameRef.current = null; setGame(null); setView('title'); }}>
      {view === 'title' && (
        <TitleScreen
          canContinue={hasSave}
          onContinue={continueRun}
          onNew={() => { playSfx('ui'); setView('onboarding'); }}
        />
      )}
      {view === 'onboarding' && <OnboardingScreen onBack={() => setView('title')} onComplete={() => setView('new-run')} />}
      {view === 'new-run' && <NewRunScreen onBack={() => setView('title')} onBegin={begin} />}
      {view === 'game' && game && <GameShell state={game} dispatch={dispatch} />}
    </ErrorBoundary>
    </>
  );
}
