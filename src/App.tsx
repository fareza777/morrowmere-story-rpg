import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameShell } from './components/GameShell';
import { NewRunScreen } from './components/NewRunScreen';
import { TitleScreen } from './components/TitleScreen';
import { loadGame, saveGame } from './game/persistence';
import { gameReducer, startNewRun, type GameCommand, type GameState } from './game/state';
import type { HeroClass } from './game/types';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';

type AppView = 'title' | 'new-run' | 'game';

export default function App() {
  const [view, setView] = useState<AppView>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(() => loadGame(1).ok);

  useEffect(() => {
    if (!game) return;
    const result = saveGame(1, game);
    if (result.ok) setHasSave(true);
  }, [game]);

  const dispatch = useCallback((command: GameCommand) => {
    setGame((current) => (current ? gameReducer(current, command) : current));
  }, []);

  const begin = (heroClass: HeroClass, name: string) => {
    const seed = Math.abs((Date.now() ^ 0x4d4f5252) | 0) || 1943;
    setGame(startNewRun({ heroClass, seed, name: name.trim() || 'The Oathless' }));
    setView('game');
  };

  const continueRun = () => {
    const loaded = loadGame(1);
    if (loaded.ok) {
      setGame(loaded.state);
      setView('game');
    }
  };

  return (
    <ErrorBoundary onReset={() => { setGame(null); setView('title'); }}>
      {view === 'title' && (
        <TitleScreen
          canContinue={hasSave}
          onContinue={continueRun}
          onNew={() => setView('new-run')}
        />
      )}
      {view === 'new-run' && <NewRunScreen onBack={() => setView('title')} onBegin={begin} />}
      {view === 'game' && game && <GameShell state={game} dispatch={dispatch} />}
    </ErrorBoundary>
  );
}
